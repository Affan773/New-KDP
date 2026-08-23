import { calculateKdpCoverDimensions, calculateKdpSpineWidth } from '../constants/kdp';
import { PuzzleRegistry } from '../puzzles/core/PuzzleRegistry';
import { DEFAULT_PUZZLE_STYLE } from '../puzzles/renderers/PuzzleRenderer';
import { GeneratedPuzzle, PuzzleType } from '../puzzles/types';
import {
  AnswerKeySettings,
  BookMetadata,
  BookProjectSettings,
  BookSection,
  BookTheme,
  FrontMatterConfig,
  HeaderFooterSettings,
  PageNumberingSettings,
  PuzzleBatchItemConfig,
} from '../types/book';
import { DocumentModel, PageModel, Project, TrimSize } from '../types/project';
import { PageCompositionEngine } from './pageCompositionEngine';
import { TocService } from './tocService';
import { AnswerKeyService, normalizeAnswerKeyMode } from './answerKeyService';
import { FrontMatterService, DEFAULT_FRONT_MATTER_CONFIG } from './frontMatterService';

export interface BookGenerationRequest {
  metadata: BookMetadata;
  trimSize: TrimSize;
  bleed: 'No Bleed' | 'Bleed';
  paperType: 'White' | 'Cream' | 'Premium Color' | 'Standard Color';
  sections: BookSection[];
  puzzleBatches: PuzzleBatchItemConfig[];
  theme: BookTheme;
  frontMatter: FrontMatterConfig;
  answerKey: AnswerKeySettings;
  headerFooter: HeaderFooterSettings;
  numbering: PageNumberingSettings;
  puzzlesPerPage: 1 | 2 | 4;
}

export interface GenerationProgressEvent {
  percent: number;
  stage: string;
  currentItem?: string;
}

export class BookGenerationService {
  /**
   * Generates a complete Book Project and DocumentModel asynchronously with progress updates
   */
  static async generateBook(
    request: BookGenerationRequest,
    onProgress?: (event: GenerationProgressEvent) => void,
    signal?: AbortSignal
  ): Promise<{ project: Project; document: DocumentModel; puzzles: GeneratedPuzzle[] }> {
    const {
      metadata,
      trimSize,
      bleed,
      paperType,
      sections,
      puzzleBatches,
      theme,
      frontMatter,
      answerKey,
      headerFooter,
      numbering,
      puzzlesPerPage,
    } = request;

    const projectId = `proj-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const documentId = `doc-${Date.now()}`;
    const now = new Date().toISOString();

    const bounds = PageCompositionEngine.getPageBounds(trimSize, bleed);
    const pages: PageModel[] = [];
    const allGeneratedPuzzles: GeneratedPuzzle[] = [];
    const usedSeeds = new Set<number>();

    // 1. STAGE 1: PREPARATION & VALIDATION
    if (signal?.aborted) throw new Error('Generation cancelled by user');
    onProgress?.({ percent: 5, stage: 'Preparing book structure and layout parameters...' });
    await new Promise(r => setTimeout(r, 80));

    // 2. STAGE 2: GENERATE PUZZLES
    let totalPuzzlesTarget = puzzleBatches.reduce((acc, b) => acc + b.count, 0);
    if (totalPuzzlesTarget === 0) totalPuzzlesTarget = 1;

    let generatedCount = 0;
    const puzzlesBySection = new Map<string, GeneratedPuzzle[]>();

    for (const batch of puzzleBatches) {
      if (signal?.aborted) throw new Error('Generation cancelled by user');

      const batchPuzzles: GeneratedPuzzle[] = [];
      const generator = PuzzleRegistry.get(batch.puzzleType);

      for (let i = 0; i < batch.count; i++) {
        if (signal?.aborted) throw new Error('Generation cancelled by user');

        // Deterministic unique seed
        let seed = Math.floor(Date.now() % 1000000) + Math.floor(Math.random() * 900000) + generatedCount;
        while (usedSeeds.has(seed)) {
          seed += 13;
        }
        usedSeeds.add(seed);

        const puzzleNum = generatedCount + 1;
        const puzzleTitle = batch.sectionTitle
          ? `${batch.sectionTitle} #${i + 1}`
          : `${batch.puzzleType.replace('_', ' ').toUpperCase()} #${puzzleNum}`;

        const settings: any = {
          puzzleType: batch.puzzleType,
          seed,
          puzzleNumber: puzzleNum,
          title: puzzleTitle,
          difficulty: batch.difficulty,
          width: batch.gridWidth || 15,
          height: batch.gridHeight || 15,
          theme: batch.theme,
          words: batch.words,
        };

        const generated = generator.generate(settings);
        batchPuzzles.push(generated);
        allGeneratedPuzzles.push(generated);

        generatedCount++;
        const puzzleProgress = 10 + Math.round((generatedCount / totalPuzzlesTarget) * 45);
        onProgress?.({
          percent: puzzleProgress,
          stage: `Generating puzzles (${generatedCount}/${totalPuzzlesTarget})...`,
          currentItem: puzzleTitle,
        });

        // Micro-yield to keep UI responsive
        if (i % 2 === 0) {
          await new Promise(r => setTimeout(r, 10));
        }
      }

      puzzlesBySection.set(batch.id, batchPuzzles);
    }

    // 3. STAGE 3: COMPOSE FRONT MATTER
    if (signal?.aborted) throw new Error('Generation cancelled by user');
    onProgress?.({ percent: 60, stage: 'Composing Front Matter pages...' });
    await new Promise(r => setTimeout(r, 60));

    let currentPageNumber = 1;

    // Title Page
    if (frontMatter.includeTitlePage) {
      pages.push(
        PageCompositionEngine.composeTitlePage(projectId, currentPageNumber++, metadata, theme, bounds)
      );
    }

    // Copyright Page
    if (frontMatter.includeCopyrightPage) {
      pages.push(
        PageCompositionEngine.composeCopyrightPage(projectId, currentPageNumber++, metadata, theme, bounds)
      );
    }

    // Instructions Page
    if (frontMatter.includeInstructionsPage && puzzleBatches.length > 0) {
      const puzzleTypes = puzzleBatches.map(b => b.puzzleType);
      pages.push(
        PageCompositionEngine.composeInstructionsPage(
          projectId,
          currentPageNumber++,
          puzzleTypes,
          theme,
          bounds
        )
      );
    }

    // Table of Contents Placeholder Page (will be populated after section pagination)
    let tocPageIndex = -1;
    if (frontMatter.includeTableOfContents) {
      tocPageIndex = pages.length;
      pages.push({
        id: `page-${projectId}-toc`,
        pageNumber: currentPageNumber++,
        pageType: 'toc',
        name: 'Table of Contents',
        backgroundColor: '#FFFFFF',
        elements: [],
        notes: 'Front Matter - Table of Contents',
      });
    }

    // 4. STAGE 4: COMPOSE CONTENT / PUZZLE PAGES
    if (signal?.aborted) throw new Error('Generation cancelled by user');
    onProgress?.({ percent: 75, stage: 'Composing interior content & section pages...' });
    await new Promise(r => setTimeout(r, 60));

    const updatedSections: BookSection[] = [];
    const effectiveAnswerKeyMode = normalizeAnswerKeyMode(answerKey?.mode);

    // Map puzzle ID to original puzzle page number, page ID, and element ID
    const puzzlePageMap = new Map<string, number>();
    const puzzlePageIdMap = new Map<string, string>();
    const puzzleElementIdMap = new Map<string, string>();

    const contentPagesBySection = new Map<string, PageModel[]>();
    const flatContentPages: PageModel[] = [];

    // If we have sections, compose by section
    if (sections.length > 0) {
      for (const section of sections) {
        const secPuzzles = puzzlesBySection.get(section.id) || [];
        const sectionContentPages: PageModel[] = [];

        for (let i = 0; i < secPuzzles.length; i += puzzlesPerPage) {
          const chunk = secPuzzles.slice(i, i + puzzlesPerPage);
          const page = PageCompositionEngine.composePuzzlePage(
            projectId,
            currentPageNumber++,
            chunk,
            puzzlesPerPage,
            theme,
            section,
            bounds
          );
          page.isAnswerKey = false;
          page.pageType = 'puzzle';
          chunk.forEach((p, idx) => {
            puzzlePageMap.set(p.id, page.pageNumber);
            puzzlePageIdMap.set(p.id, page.id);
            const el = page.elements.find(e => (e as any).puzzleType === p.type && (e as any).title === p.title) || page.elements[idx];
            if (el) {
              puzzleElementIdMap.set(p.id, el.id);
            }
          });
          sectionContentPages.push(page);
        }

        contentPagesBySection.set(section.id, sectionContentPages);
      }
    } else {
      // No sections defined, compose flat
      for (let i = 0; i < allGeneratedPuzzles.length; i += puzzlesPerPage) {
        const chunk = allGeneratedPuzzles.slice(i, i + puzzlesPerPage);
        const page = PageCompositionEngine.composePuzzlePage(
          projectId,
          currentPageNumber++,
          chunk,
          puzzlesPerPage,
          theme,
          undefined,
          bounds
        );
        page.isAnswerKey = false;
        page.pageType = 'puzzle';
        chunk.forEach((p, idx) => {
          puzzlePageMap.set(p.id, page.pageNumber);
          puzzlePageIdMap.set(p.id, page.id);
          const el = page.elements.find(e => (e as any).puzzleType === p.type && (e as any).title === p.title) || page.elements[idx];
          if (el) {
            puzzleElementIdMap.set(p.id, el.id);
          }
        });
        flatContentPages.push(page);
      }
    }

    // 5. STAGE 5: COMPOSE ANSWER KEY / SOLUTIONS VIA AUTHORITATIVE AnswerKeyService
    if (signal?.aborted) throw new Error('Generation cancelled by user');
    onProgress?.({ percent: 88, stage: 'Generating solution keys & answer pages...' });
    await new Promise(r => setTimeout(r, 60));

    // The ONE authoritative function allowed to create Answer Key pages
    const solutionPages = AnswerKeyService.generateSolutionPages({
      projectId,
      puzzles: allGeneratedPuzzles,
      puzzlePageMap,
      puzzlePageIdMap,
      puzzleElementIdMap,
      answerKey: {
        ...answerKey,
        mode: effectiveAnswerKeyMode,
      },
      theme,
      bounds,
      trimSize,
      styleOptions: DEFAULT_PUZZLE_STYLE,
    });

    // Map each solution page by its sourcePuzzleId for precise placement
    const solutionByPuzzleId = new Map<string, PageModel>();
    solutionPages.forEach(solPage => {
      if (solPage.sourcePuzzleId) {
        solutionByPuzzleId.set(solPage.sourcePuzzleId, solPage);
      } else if (solPage.puzzleId) {
        solutionByPuzzleId.set(solPage.puzzleId, solPage);
      }
    });

    // Assemble final manuscript pages based on effectiveAnswerKeyMode
    if (sections.length > 0) {
      for (const section of sections) {
        const secContent = contentPagesBySection.get(section.id) || [];
        const secPuzzles = puzzlesBySection.get(section.id) || [];
        const sectionPageIds: string[] = [];

        if (effectiveAnswerKeyMode === 'after_puzzle') {
          // Interleaved: each puzzle page followed immediately by its solution(s)
          for (const pPage of secContent) {
            pages.push(pPage);
            sectionPageIds.push(pPage.id);
            const puzElements = pPage.elements.filter(e => e.type === 'puzzle');
            for (const pEl of puzElements) {
              const puzId = (pEl as any).sourcePuzzleId || (pEl as any).puzzleData?.id;
              if (puzId && solutionByPuzzleId.has(puzId)) {
                const sol = solutionByPuzzleId.get(puzId)!;
                pages.push(sol);
                sectionPageIds.push(sol.id);
              }
            }
          }
        } else if (effectiveAnswerKeyMode === 'after_section') {
          // Section puzzles first, then section solutions immediately after
          for (const pPage of secContent) {
            pages.push(pPage);
            sectionPageIds.push(pPage.id);
          }
          for (const puz of secPuzzles) {
            if (solutionByPuzzleId.has(puz.id)) {
              const sol = solutionByPuzzleId.get(puz.id)!;
              pages.push(sol);
              sectionPageIds.push(sol.id);
            }
          }
        } else {
          // 'end_of_book', 'four_up', 'custom', 'none'
          for (const pPage of secContent) {
            pages.push(pPage);
            sectionPageIds.push(pPage.id);
          }
        }

        updatedSections.push({
          ...section,
          pageIds: sectionPageIds,
        });
      }

      // If end_of_book, four_up, or custom with sections: append all solution pages at the end
      if (effectiveAnswerKeyMode === 'end_of_book' || effectiveAnswerKeyMode === 'four_up' || effectiveAnswerKeyMode === 'custom') {
        solutionPages.forEach(solPage => {
          pages.push(solPage);
        });
      }
    } else {
      // Flat book (no sections)
      if (effectiveAnswerKeyMode === 'after_puzzle') {
        for (const pPage of flatContentPages) {
          pages.push(pPage);
          const puzElements = pPage.elements.filter(e => e.type === 'puzzle');
          for (const pEl of puzElements) {
            const puzId = (pEl as any).sourcePuzzleId || (pEl as any).puzzleData?.id;
            if (puzId && solutionByPuzzleId.has(puzId)) {
              const sol = solutionByPuzzleId.get(puzId)!;
              pages.push(sol);
            }
          }
        }
      } else if (effectiveAnswerKeyMode === 'none') {
        flatContentPages.forEach(p => pages.push(p));
      } else {
        // 'end_of_book', 'after_section' (without sections), 'four_up', 'custom'
        flatContentPages.forEach(p => pages.push(p));
        solutionPages.forEach(sol => pages.push(sol));
      }
    }

    // Renumber all pages sequentially starting from page 1
    pages.forEach((p, idx) => {
      p.pageNumber = idx + 1;
    });

    // Explicitly enforce state safety on all created pages
    pages.forEach(p => {
      if (p.pageType === 'answer_key' || p.isAnswerKey === true) {
        p.isAnswerKey = true;
        p.pageType = 'answer_key';
        p.elements.forEach(el => {
          if (el.type === 'puzzle' && el.previewData) {
            el.previewData.showSolution = true;
            el.previewData.showWordBank = false;
          }
        });
      } else {
        p.isAnswerKey = false;
        p.elements.forEach(el => {
          if (el.type === 'puzzle' && el.previewData) {
            el.previewData.showSolution = false;
          }
        });
      }
    });

    // Update Table of Contents content if enabled
    if (tocPageIndex >= 0 && pages[tocPageIndex]) {
      const docModelTemp: DocumentModel = {
        id: documentId,
        projectId,
        pages,
        createdAt: now,
        updatedAt: now,
      };
      const entries = TocService.generateEntries(docModelTemp, updatedSections);
      pages[tocPageIndex].elements = TocService.composeTocElements(
        entries,
        bounds.widthPx,
        bounds.heightPx,
        theme
      );
    }

    // 6. STAGE 6: FINALIZING DOCUMENT & PROJECT
    if (signal?.aborted) throw new Error('Generation cancelled by user');
    onProgress?.({ percent: 96, stage: 'Finalizing manuscript metadata...' });
    await new Promise(r => setTimeout(r, 60));

    const synchronizedPages = AnswerKeyService.synchronizeSolutionPageReferences(pages);
    const totalPages = synchronizedPages.length;
    const spineWidth = calculateKdpSpineWidth(totalPages, paperType);
    const coverDims = calculateKdpCoverDimensions(trimSize.width, trimSize.height, spineWidth);

    // Answer Key Diagnostics & Verification
    const normalizedMode = normalizeAnswerKeyMode(answerKey?.mode);
    const isWordSearchBook = allGeneratedPuzzles.some(p => p.type === 'word_search');
    const expectedSolutionCount = normalizedMode === 'none' ? 0 : allGeneratedPuzzles.length;
    const actualSolutionCount = synchronizedPages.filter(p => p.pageType === 'answer_key' || p.isAnswerKey === true).length;

    console.log(`[ANSWER KEY] mode: ${normalizedMode}`);
    console.log(`[ANSWER KEY] puzzles: ${allGeneratedPuzzles.length}`);
    console.log(`[ANSWER KEY] generated solutions: ${solutionPages.length}`);
    console.log(`[ANSWER KEY] final solution pages: ${actualSolutionCount}`);

    if (isWordSearchBook && normalizedMode !== 'none' && actualSolutionCount !== expectedSolutionCount) {
      console.error(`[ANSWER KEY] validation: FAILED (expected ${expectedSolutionCount}, found ${actualSolutionCount})`);
      throw new Error(
        `ANSWER_KEY_GENERATION_FAILED: expected ${expectedSolutionCount} solution pages but generated ${actualSolutionCount}.`
      );
    } else {
      console.log(`[ANSWER KEY] validation: PASS`);
    }

    const bookSettings: BookProjectSettings = {
      schemaVersion: 4,
      metadata,
      sections: updatedSections,
      theme,
      numbering,
      headerFooter,
      answerKey,
      toc: {
        enabled: frontMatter.includeTableOfContents,
        title: 'Table of Contents',
        showPageNumbers: true,
        dotLeaders: true,
        includeFrontMatter: false,
      },
      frontMatter,
      puzzleNumberingStyle: 'continuous',
    };

    const document: DocumentModel = {
      id: documentId,
      projectId,
      pages: synchronizedPages,
      createdAt: now,
      updatedAt: now,
      schemaVersion: 4,
    };

    const project: Project = {
      id: projectId,
      name: metadata.title || 'Untitled Book',
      type: 'Puzzle Book',
      description: `Complete ${allGeneratedPuzzles.length}-puzzle book with ${totalPages} formatted pages ready for Amazon KDP print.`,
      pageCount: totalPages,
      createdAt: now,
      updatedAt: now,
      status: 'Draft',
      ownerId: 'local-user',
      isFavorite: false,
      documentId,
      schemaVersion: 4,
      sections: updatedSections,
      bookSettings,
      kdpSettings: {
        trimSize,
        orientation: 'Portrait',
        pageCount: totalPages,
        margins: {
          top: 0.5,
          bottom: 0.5,
          left: 0.75, // Inside gutter
          right: 0.5,
        },
        bleed,
        paperType,
        spineWidthInches: spineWidth,
        coverWidthInches: coverDims.width,
        coverHeightInches: coverDims.height,
      },
      metadata: {
        description: metadata.description,
        category: metadata.category || 'Activity & Puzzle Books',
        author: metadata.author,
        publisher: metadata.publisher,
        subtitle: metadata.subtitle,
        keywords: metadata.keywords || ['puzzle book', 'amazon kdp', 'activity book'],
        edition: metadata.edition,
        seriesName: metadata.seriesName,
        volumeNumber: metadata.volumeNumber,
        isbn: metadata.isbn,
        copyrightYear: metadata.copyrightYear,
      },
    };

    onProgress?.({ percent: 100, stage: 'Book manuscript created successfully!' });

    const { sanitizedDocument, sanitizedProject } = FrontMatterService.sanitizeBookStructure(document, project, frontMatter);

    return { project: sanitizedProject, document: sanitizedDocument, puzzles: allGeneratedPuzzles };
  }

  /**
   * Generates a book project directly from an approved AI Book Plan
   */
  static async generateFromAiPlan(
    plan: any,
    options: {
      trimSize: TrimSize;
      bleed: 'No Bleed' | 'Bleed';
      paperType: 'White' | 'Cream' | 'Premium Color' | 'Standard Color';
      theme: BookTheme;
      puzzlesPerPage?: 1 | 2 | 4;
      author?: string;
    },
    onProgress?: (event: GenerationProgressEvent) => void,
    signal?: AbortSignal
  ): Promise<{ project: Project; document: DocumentModel; puzzles: GeneratedPuzzle[] }> {
    const sanitizedPlan = FrontMatterService.sanitizeAIBookPlan(plan);
    const { trimSize, bleed, paperType, theme, puzzlesPerPage = 1, author = 'KDP Publishing Studio' } = options;

    const sections: BookSection[] = [];
    const puzzleBatches: PuzzleBatchItemConfig[] = [];

    const planSections = sanitizedPlan.sections || [
      { title: 'Chapter 1: Themed Puzzles', puzzleType: 'word_search', count: sanitizedPlan.totalPuzzles || 30, difficulty: 'Medium', theme: sanitizedPlan.topic || 'Brain Teasers' }
    ];

    planSections.forEach((sec: any, idx: number) => {
      const sectionId = `sec-${Date.now()}-${idx + 1}`;
      sections.push({
        id: sectionId,
        title: sec.title || `Section ${idx + 1}`,
        order: idx,
        description: `${sec.difficulty || 'Medium'} difficulty ${sec.puzzleType || 'puzzles'}`,
        puzzleType: sec.puzzleType || 'word_search',
        pageIds: [],
      });

      puzzleBatches.push({
        id: sectionId,
        puzzleType: sec.puzzleType || 'word_search',
        count: sec.count || 10,
        difficulty: sec.difficulty || 'Medium',
        sectionTitle: sec.title,
        theme: sec.theme || sanitizedPlan.topic || 'General',
        gridWidth: sec.puzzleType === 'sudoku' ? 9 : 15,
        gridHeight: sec.puzzleType === 'sudoku' ? 9 : 15,
      });
    });

    const frontMatter: FrontMatterConfig = FrontMatterService.normalizeConfig({
      includeTitlePage: sanitizedPlan.frontMatter?.includeTitlePage ?? true,
      includeCopyrightPage: sanitizedPlan.frontMatter?.includeCopyright ?? false,
      includeInstructionsPage: sanitizedPlan.frontMatter?.includeInstructions ?? false,
      includeTableOfContents: sanitizedPlan.frontMatter?.includeTOC ?? false,
      includeDisclaimerPage: false,
      includeIntroPage: false,
    });

    const answerKey: AnswerKeySettings = {
      mode: (sanitizedPlan.backMatter?.answerKeyMode as any) || 'end_of_book',
      puzzlesPerPage: ((sanitizedPlan.backMatter?.puzzlesPerSolutionPage as any) || 4) as 1 | 2 | 4 | 6,
      includeTitle: true,
      sectionLabels: true,
      startOnNewPage: true,
    };

    const metadata: BookMetadata = {
      title: sanitizedPlan.title || 'AI Generated Puzzle Book',
      subtitle: sanitizedPlan.subtitle || 'Challenging & Relaxing Brain Games',
      author,
      publisher: 'Independently Published',
      category: 'Activity & Puzzle Books',
      description: sanitizedPlan.description || '',
      keywords: sanitizedPlan.keywords || ['puzzle book', 'brain workout', 'amazon kdp'],
      copyrightYear: new Date().getFullYear().toString(),
      seriesName: '',
      volumeNumber: '',
      edition: '1st Edition',
    };

    const frontMatterCount =
      (frontMatter.includeTitlePage ? 1 : 0) +
      (frontMatter.includeCopyrightPage ? 1 : 0) +
      (frontMatter.includeInstructionsPage ? 1 : 0) +
      (frontMatter.includeTableOfContents ? 1 : 0);

    const numbering: PageNumberingSettings = {
      enabled: true,
      startPageNumber: 1,
      startPageIndex: frontMatterCount,
      frontMatterStyle: 'none',
      bodyStyle: 'arabic',
      position: 'bottom-center',
      fontSize: 10,
      fontFamily: theme.fontBody,
      hideOnFrontMatter: true,
    };

    const headerFooter: HeaderFooterSettings = {
      showHeader: true,
      showFooter: true,
      headerLeft: 'none',
      headerCenter: 'book_title',
      headerRight: 'none',
      footerLeft: 'none',
      footerCenter: 'page_number',
      footerRight: 'none',
      fontFamily: theme.fontBody,
      fontSize: 9,
      color: '#6B7280',
      marginFromEdge: 0.35,
      suppressOnFrontMatter: true,
      suppressOnBlankPages: true,
    };

    return BookGenerationService.generateBook(
      {
        metadata,
        trimSize,
        bleed,
        paperType,
        sections,
        puzzleBatches,
        theme,
        frontMatter,
        answerKey,
        headerFooter,
        numbering,
        puzzlesPerPage,
      },
      onProgress,
      signal
    );
  }

  /**
   * Safely clones a project to create an independent variant (e.g. Large Print, Kids, Spanish)
   */
  static createProjectVariant(
    sourceProject: Project,
    sourceDoc: DocumentModel,
    options: {
      variantType: string;
      newTitle: string;
      newSubtitle?: string;
      newTrimSize?: TrimSize;
      newTheme?: BookTheme;
    }
  ): { project: Project; document: DocumentModel } {
    const newProjectId = `proj-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newDocId = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const clonedPages: PageModel[] = sourceDoc.pages.map((p, idx) => ({
      ...p,
      id: `page-${newProjectId}-${idx + 1}`,
      elements: p.elements.map(el => ({
        ...el,
        id: `el-${newProjectId}-${Math.random().toString(36).substring(2, 9)}`,
      })),
    }));

    const clonedDoc: DocumentModel = {
      ...sourceDoc,
      id: newDocId,
      projectId: newProjectId,
      pages: clonedPages,
      createdAt: now,
      updatedAt: now,
    };

    const clonedProject: Project = {
      ...sourceProject,
      id: newProjectId,
      documentId: newDocId,
      name: options.newTitle || `${sourceProject.name} (${options.variantType})`,
      createdAt: now,
      updatedAt: now,
      isFavorite: false,
      metadata: {
        ...sourceProject.metadata,
        subtitle: options.newSubtitle || sourceProject.metadata?.subtitle,
        edition: `${options.variantType.replace('_', ' ').toUpperCase()} Edition`,
      },
    };

    if (options.newTrimSize && clonedProject.kdpSettings) {
      clonedProject.kdpSettings = {
        ...clonedProject.kdpSettings,
        trimSize: options.newTrimSize,
      };
    }

    if (options.newTheme && clonedProject.bookSettings) {
      clonedProject.bookSettings = {
        ...clonedProject.bookSettings,
        theme: options.newTheme,
      };
    }

    return { project: clonedProject, document: clonedDoc };
  }
}


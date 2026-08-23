import { Project, DocumentModel, PageModel, TrimSize, CanvasElement } from '../../types/project';
import { GeneratedPuzzle, PuzzleStyleOptions } from '../types';
import { DEFAULT_PUZZLE_STYLE } from '../renderers/PuzzleRenderer';
import { AnswerKeyService, normalizeAnswerKeyMode } from '../../services/answerKeyService';
import { PageCompositionEngine } from '../../services/pageCompositionEngine';
import { BUILTIN_BOOK_THEMES } from '../../constants/bookThemes';

export interface PuzzleBookBuildOptions {
  name: string;
  puzzles: GeneratedPuzzle[];
  puzzlesPerPage: 1 | 2 | 4;
  answerKeyMode: 'end_of_book' | 'after_puzzle' | 'after_each_puzzle' | 'none';
  trimSize?: TrimSize;
  styleOptions?: Partial<PuzzleStyleOptions>;
}

export class PuzzleBookBuilder {
  static buildProject(options: PuzzleBookBuildOptions): { project: Project; document: DocumentModel } {
    const {
      name,
      puzzles,
      puzzlesPerPage = 1,
      answerKeyMode: rawAnswerKeyMode = 'end_of_book',
      trimSize = { id: '8.5x11', name: '8.5 × 11 in (Large Format)', width: 8.5, height: 11, category: 'Large' },
      styleOptions = {},
    } = options;

    const answerKeyMode = normalizeAnswerKeyMode(rawAnswerKeyMode);
    const projectId = `proj-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const documentId = `doc-${Date.now()}`;
    const now = new Date().toISOString();

    const bounds = PageCompositionEngine.getPageBounds(trimSize, 'No Bleed');
    const marginPx = bounds.marginInsidePx;
    const contentWidth = bounds.contentWidth;
    const contentHeight = bounds.contentHeight;

    const puzzlePages: PageModel[] = [];
    const puzzlePageMap = new Map<string, number>();
    const puzzlePageIdMap = new Map<string, string>();
    const puzzleElementIdMap = new Map<string, string>();

    // Helper to calculate layout slots on a page
    const getSlots = (count: 1 | 2 | 4) => {
      if (count === 1) {
        return [
          {
            x: marginPx,
            y: marginPx,
            width: contentWidth,
            height: contentHeight,
          },
        ];
      } else if (count === 2) {
        const slotHeight = Math.floor((contentHeight - 20) / 2);
        return [
          {
            x: marginPx,
            y: marginPx,
            width: contentWidth,
            height: slotHeight,
          },
          {
            x: marginPx,
            y: marginPx + slotHeight + 20,
            width: contentWidth,
            height: slotHeight,
          },
        ];
      } else {
        // 4 per page (2x2 grid)
        const slotWidth = Math.floor((contentWidth - 20) / 2);
        const slotHeight = Math.floor((contentHeight - 20) / 2);
        return [
          { x: marginPx, y: marginPx, width: slotWidth, height: slotHeight },
          { x: marginPx + slotWidth + 20, y: marginPx, width: slotWidth, height: slotHeight },
          { x: marginPx, y: marginPx + slotHeight + 20, width: slotWidth, height: slotHeight },
          { x: marginPx + slotWidth + 20, y: marginPx + slotHeight + 20, width: slotWidth, height: slotHeight },
        ];
      }
    };

    const puzzleSlots = getSlots(puzzlesPerPage);

    // ================= 1. PUZZLE PAGES =================
    let currentPuzzlePageNum = 1;
    for (let i = 0; i < puzzles.length; i += puzzlesPerPage) {
      const pagePuzzles = puzzles.slice(i, i + puzzlesPerPage);
      const elements: CanvasElement[] = [];
      const currentPuzzlePageId = `page-${projectId}-${currentPuzzlePageNum}`;

      pagePuzzles.forEach((puzzle, slotIdx) => {
        const slot = puzzleSlots[slotIdx];
        const elementId = `el-puz-${currentPuzzlePageNum}-${slotIdx + 1}`;
        puzzlePageMap.set(puzzle.id, currentPuzzlePageNum);
        puzzlePageIdMap.set(puzzle.id, currentPuzzlePageId);
        puzzleElementIdMap.set(puzzle.id, elementId);

        elements.push({
          id: elementId,
          type: 'puzzle',
          name: puzzle.title || `Puzzle #${puzzle.settings?.puzzleNumber || i + slotIdx + 1}`,
          x: slot.x,
          y: slot.y,
          width: slot.width,
          height: slot.height,
          rotation: 0,
          zIndex: slotIdx + 1,
          opacity: 1,
          locked: false,
          aspectRatioLocked: false,
          puzzleType: puzzle.type,
          difficulty: puzzle.difficulty,
          title: puzzle.title,
          puzzleData: puzzle as any,
          sourcePuzzleId: puzzle.id,
          sourcePuzzlePageId: currentPuzzlePageId,
          sourcePuzzleElementId: elementId,
          previewData: {
            ...DEFAULT_PUZZLE_STYLE,
            ...styleOptions,
            showSolution: false,
          },
        });
      });

      const firstPuzzle = pagePuzzles[0];
      puzzlePages.push({
        id: currentPuzzlePageId,
        pageNumber: currentPuzzlePageNum,
        pageType: 'puzzle',
        isAnswerKey: false,
        puzzleId: firstPuzzle?.id,
        puzzleType: firstPuzzle?.type,
        sourcePuzzleId: firstPuzzle?.id,
        name: pagePuzzles.length === 1 && firstPuzzle?.title ? firstPuzzle.title : `Puzzle Page ${currentPuzzlePageNum}`,
        backgroundColor: '#FFFFFF',
        elements,
      });
      currentPuzzlePageNum++;
    }

    // ================= 2. ANSWER KEYS VIA AUTHORITATIVE AnswerKeyService =================
    const solutionPages = AnswerKeyService.generateSolutionPages({
      projectId,
      puzzles,
      puzzlePageMap,
      puzzlePageIdMap,
      puzzleElementIdMap,
      answerKey: {
        mode: answerKeyMode,
        puzzlesPerPage: 4,
        includeTitle: true,
        sectionLabels: true,
        startOnNewPage: true,
      },
      bounds,
      trimSize,
      styleOptions,
    });

    const solutionByPuzzleId = new Map<string, PageModel>();
    solutionPages.forEach(solPage => {
      if (solPage.sourcePuzzleId) {
        solutionByPuzzleId.set(solPage.sourcePuzzleId, solPage);
      } else if (solPage.puzzleId) {
        solutionByPuzzleId.set(solPage.puzzleId, solPage);
      }
    });

    const assembledPages: PageModel[] = [];
    if (answerKeyMode === 'after_puzzle') {
      puzzlePages.forEach(pPage => {
        assembledPages.push(pPage);
        const puzElements = pPage.elements.filter(e => e.type === 'puzzle');
        for (const pEl of puzElements) {
          const puzId = (pEl as any).sourcePuzzleId || (pEl as any).puzzleData?.id;
          if (puzId && solutionByPuzzleId.has(puzId)) {
            assembledPages.push(solutionByPuzzleId.get(puzId)!);
          }
        }
      });
    } else if (answerKeyMode === 'none') {
      puzzlePages.forEach(pPage => assembledPages.push(pPage));
    } else {
      // end_of_book, four_up, custom, etc.
      puzzlePages.forEach(pPage => assembledPages.push(pPage));
      solutionPages.forEach(solPage => assembledPages.push(solPage));
    }

    // Renumber pages sequentially
    assembledPages.forEach((p, idx) => {
      p.pageNumber = idx + 1;
    });

    // Synchronize solution titles and references
    const synchronizedPages = AnswerKeyService.synchronizeSolutionPageReferences(assembledPages);

    const document: DocumentModel = {
      id: documentId,
      projectId,
      pages: synchronizedPages,
      createdAt: now,
      updatedAt: now,
    };

    const project: Project = {
      id: projectId,
      name,
      type: 'Puzzle Book',
      description: `Complete ${puzzles.length}-puzzle book formatted for Amazon KDP with solution keys.`,
      pageCount: synchronizedPages.length,
      createdAt: now,
      updatedAt: now,
      status: 'Draft',
      ownerId: 'local-user',
      isFavorite: true,
      documentId,
      bookSettings: {
        schemaVersion: 4,
        metadata: {
          title: name,
          author: 'KDP Publishing Studio',
          category: 'Activity & Puzzle Books',
          keywords: ['puzzle book', 'brain teasers', 'word search', 'sudoku', 'kdp print on demand'],
        },
        sections: [],
        theme: BUILTIN_BOOK_THEMES[0],
        numbering: {
          enabled: true,
          startPageNumber: 1,
          startPageIndex: 0,
          frontMatterStyle: 'none',
          bodyStyle: 'arabic',
          position: 'bottom-center',
          fontSize: 10,
          fontFamily: BUILTIN_BOOK_THEMES[0].fontBody,
          hideOnFrontMatter: true,
        },
        headerFooter: {
          showHeader: false,
          showFooter: true,
          headerLeft: 'none',
          headerCenter: 'none',
          headerRight: 'none',
          footerLeft: 'none',
          footerCenter: 'page_number',
          footerRight: 'none',
          fontFamily: BUILTIN_BOOK_THEMES[0].fontBody,
          fontSize: 9,
          color: '#6B7280',
          marginFromEdge: 0.35,
          suppressOnFrontMatter: true,
          suppressOnBlankPages: true,
        },
        answerKey: {
          mode: answerKeyMode,
          puzzlesPerPage: 4,
          includeTitle: true,
          sectionLabels: true,
          startOnNewPage: true,
        },
        toc: {
          enabled: false,
          title: 'Table of Contents',
          showPageNumbers: true,
          dotLeaders: true,
          includeFrontMatter: false,
        },
        frontMatter: {
          includeTitlePage: false,
          includeCopyrightPage: false,
          includeDisclaimerPage: false,
          includeInstructionsPage: false,
          includeIntroPage: false,
          includeTableOfContents: false,
        },
        puzzleNumberingStyle: 'continuous',
      },
      kdpSettings: {
        trimSize,
        orientation: 'Portrait',
        pageCount: synchronizedPages.length,
        margins: {
          top: 0.5,
          bottom: 0.5,
          left: 0.75, // Gutter margin
          right: 0.5,
        },
        bleed: 'No Bleed',
        paperType: 'White',
        spineWidthInches: Math.round((synchronizedPages.length * 0.002252) * 1000) / 1000,
        coverWidthInches: trimSize.width * 2 + 0.002252 * synchronizedPages.length + 0.25,
        coverHeightInches: trimSize.height + 0.25,
      },
      metadata: {
        category: 'Activity & Puzzle Books',
        targetAudience: 'Adults & Young Adults',
        keywords: ['puzzle book', 'brain teasers', 'word search', 'sudoku', 'kdp print on demand'],
      },
    };

    return { project, document };
  }
}

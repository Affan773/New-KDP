import { FrontMatterConfig } from '../types/book';
import { PageModel, Project, DocumentModel, TextElement } from '../types/project';
import { BookMetadata, BookTheme } from '../types/book';
import { PageCompositionEngine } from './pageCompositionEngine';
import { AnswerKeyService } from './answerKeyService';
import { calculateKdpSpineWidth, calculateKdpCoverDimensions } from '../constants/kdp';
import { DEFAULT_BOOK_THEME } from '../constants/bookThemes';
import { PuzzleType } from '../puzzles/types';

/**
 * Clean Centralized Front Matter Configuration
 * Defaults:
 *   titlePage: true (or user preference)
 *   copyrightPage: false (OFF by default)
 *   howToSolvePage: false (OFF by default)
 */
export interface CentralizedFrontMatterConfig {
  titlePage: boolean;
  copyrightPage: boolean;
  howToSolvePage: boolean;
  tableOfContents?: boolean;
  disclaimerPage?: boolean;
  introPage?: boolean;
}

export const DEFAULT_CENTRALIZED_FRONT_MATTER: CentralizedFrontMatterConfig = {
  titlePage: true,
  copyrightPage: false,
  howToSolvePage: false,
  tableOfContents: false,
  disclaimerPage: false,
  introPage: false,
};

export const DEFAULT_FRONT_MATTER_CONFIG: FrontMatterConfig = {
  includeTitlePage: true,
  includeCopyrightPage: false,
  includeInstructionsPage: false,
  includeDisclaimerPage: false,
  includeIntroPage: false,
  includeTableOfContents: false,
  copyrightText: '',
  disclaimerText: '',
  instructionsText: '',
  introText: '',
};

/**
 * Service managing centralized Front Matter configuration, deterministic ordering,
 * seamless page reflow without blank holes, and synchronization with answer keys and cover spine.
 */
export class FrontMatterService {
  /**
   * Normalizes any input configuration into a standard FrontMatterConfig object.
   * Ensures default is: titlePage: true, copyrightPage: false, howToSolvePage: false.
   */
  public static normalizeConfig(
    config?: Partial<FrontMatterConfig> | Partial<CentralizedFrontMatterConfig> | null
  ): FrontMatterConfig {
    if (!config) {
      return { ...DEFAULT_FRONT_MATTER_CONFIG };
    }
    const raw = config as any;
    return {
      includeTitlePage:
        raw.titlePage !== undefined ? Boolean(raw.titlePage) : (raw.includeTitlePage ?? true),
      includeCopyrightPage:
        raw.copyrightPage !== undefined ? Boolean(raw.copyrightPage) : (raw.includeCopyrightPage ?? false),
      includeInstructionsPage:
        raw.howToSolvePage !== undefined ? Boolean(raw.howToSolvePage) : (raw.includeInstructionsPage ?? false),
      includeTableOfContents:
        raw.tableOfContents !== undefined ? Boolean(raw.tableOfContents) : (raw.includeTableOfContents ?? false),
      includeDisclaimerPage:
        raw.disclaimerPage !== undefined ? Boolean(raw.disclaimerPage) : (raw.includeDisclaimerPage ?? false),
      includeIntroPage:
        raw.introPage !== undefined ? Boolean(raw.introPage) : (raw.includeIntroPage ?? false),
      copyrightText: raw.copyrightText || '',
      disclaimerText: raw.disclaimerText || '',
      instructionsText: raw.instructionsText || '',
      introText: raw.introText || '',
    };
  }

  /**
   * Converts config to the centralized format
   */
  public static toCentralized(
    config?: Partial<FrontMatterConfig> | Partial<CentralizedFrontMatterConfig> | null
  ): CentralizedFrontMatterConfig {
    const normalized = this.normalizeConfig(config);
    return {
      titlePage: normalized.includeTitlePage,
      copyrightPage: normalized.includeCopyrightPage,
      howToSolvePage: normalized.includeInstructionsPage,
      tableOfContents: normalized.includeTableOfContents,
      disclaimerPage: normalized.includeDisclaimerPage,
      introPage: normalized.includeIntroPage,
    };
  }

  /**
   * Generates deterministic front matter pages based on configuration:
   * Order:
   * 1. Title/Opening (if enabled)
   * 2. Copyright (if enabled)
   * 3. How to Solve (if enabled)
   * 4. Table of Contents (if enabled)
   * 5. Disclaimer / Intro (if enabled)
   */
  public static generateFrontMatterPages(options: {
    projectId: string;
    config: Partial<FrontMatterConfig> | Partial<CentralizedFrontMatterConfig>;
    metadata: BookMetadata;
    theme: BookTheme;
    puzzleTypes: PuzzleType[];
    bounds: ReturnType<typeof PageCompositionEngine.getPageBounds>;
  }): PageModel[] {
    const { projectId, config, metadata, theme, puzzleTypes, bounds } = options;
    const normalized = this.normalizeConfig(config);
    const pages: PageModel[] = [];
    let pageNum = 1;

    // 1. Title Page
    if (normalized.includeTitlePage) {
      pages.push(
        PageCompositionEngine.composeTitlePage(projectId, pageNum++, metadata, theme, bounds)
      );
    }

    // 2. Copyright Page
    if (normalized.includeCopyrightPage) {
      pages.push(
        PageCompositionEngine.composeCopyrightPage(projectId, pageNum++, metadata, theme, bounds)
      );
    }

    // 3. How to Solve Puzzles Page
    if (normalized.includeInstructionsPage && puzzleTypes.length > 0) {
      pages.push(
        PageCompositionEngine.composeInstructionsPage(
          projectId,
          pageNum++,
          puzzleTypes,
          theme,
          bounds
        )
      );
    }

    // 4. Table of Contents (Optional)
    if (normalized.includeTableOfContents) {
      pages.push(
        PageCompositionEngine.composeTocPage(
          projectId,
          pageNum++,
          metadata.title || 'Puzzle Collection',
          [],
          theme,
          bounds
        )
      );
    }

    return pages;
  }

  /**
   * Reflows document pages according to new front matter settings:
   * - Strips old front matter pages (or updates them)
   * - Inserts only enabled front matter pages
   * - Preserves ALL puzzle pages, puzzle IDs, and elements without any blank gaps
   * - Preserves ALL answer keys and updates their cross-reference page numbers
   * - Sequentially renumbers every page from 1 to N
   */
  public static reflowDocumentPages(options: {
    project: Project;
    document: DocumentModel;
    config?: Partial<FrontMatterConfig> | Partial<CentralizedFrontMatterConfig>;
    newFrontMatter?: Partial<FrontMatterConfig> | Partial<CentralizedFrontMatterConfig>;
    metadata?: Partial<BookMetadata>;
    theme?: BookTheme;
  }): {
    updatedDocument: DocumentModel;
    updatedProject: Project;
    oldPageCount: number;
    newPageCount: number;
    pageCountChanged: boolean;
    spineOutdated: boolean;
    newSpineWidth: number;
  } {
    const {
      project,
      document,
      config,
      newFrontMatter,
      metadata = project.metadata || {},
      theme = project.bookSettings?.theme,
    } = options;
    const normalizedFM = this.normalizeConfig(config || newFrontMatter);

    const oldPageCount = document.pages.length;
    const trimSize = project.kdpSettings?.trimSize || {
      id: '8.5x11',
      name: '8.5 × 11 in',
      width: 8.5,
      height: 11,
      category: 'Large',
    };
    const bleed = project.kdpSettings?.bleed || 'No Bleed';
    const paperType = (project.kdpSettings?.paperType as any) || 'White';
    const bounds = PageCompositionEngine.getPageBounds(trimSize, bleed);

    // Extract non-front-matter pages (puzzles and solutions)
    const existingPuzzlePages: PageModel[] = [];
    const existingSolutionPages: PageModel[] = [];
    const detectedPuzzleTypes: PuzzleType[] = [];

    document.pages.forEach(p => {
      const isFrontMatter =
        p.pageType === 'title' ||
        p.pageType === 'copyright' ||
        p.pageType === 'instructions' ||
        p.pageType === 'toc' ||
        p.pageType === 'introduction' ||
        p.pageType === 'disclaimer' ||
        (p.name &&
          (p.name.toLowerCase().includes('title') ||
            p.name.toLowerCase().includes('copyright') ||
            p.name.toLowerCase().includes('how to solve') ||
            p.name.toLowerCase().includes('instructions') ||
            p.name.toLowerCase().includes('table of contents')));

      if (isFrontMatter) {
        return;
      }

      if (p.pageType === 'answer_key' || p.isAnswerKey) {
        existingSolutionPages.push(p);
      } else {
        existingPuzzlePages.push(p);
        if (p.puzzleType && !detectedPuzzleTypes.includes(p.puzzleType as any)) {
          detectedPuzzleTypes.push(p.puzzleType as any);
        }
        p.elements.forEach(el => {
          const pType = (el as any).puzzleType;
          if (pType && !detectedPuzzleTypes.includes(pType as any)) {
            detectedPuzzleTypes.push(pType as any);
          }
        });
      }
    });

    // Default fallback puzzle types if none found
    if (detectedPuzzleTypes.length === 0) {
      detectedPuzzleTypes.push('word_search');
    }

    const safeMetadata: BookMetadata = {
      title: project.name || 'Untitled Puzzle Book',
      author: (metadata as any).author || 'KDP Creator',
      publisher: (metadata as any).publisher || 'Independent Publisher',
      subtitle: (metadata as any).subtitle || '',
      description: (metadata as any).description || project.description || '',
      copyrightYear: (metadata as any).copyrightYear || new Date().getFullYear().toString(),
      edition: (metadata as any).edition || '1st Edition',
      isbn: (metadata as any).isbn || '',
      seriesName: (metadata as any).seriesName || '',
      volumeNumber: (metadata as any).volumeNumber || '',
      disclaimer: (metadata as any).disclaimer || '',
    };

    // Generate fresh front matter pages
    const freshFrontMatterPages = this.generateFrontMatterPages({
      projectId: project.id,
      config: normalizedFM,
      metadata: safeMetadata,
      theme: theme || DEFAULT_BOOK_THEME,
      puzzleTypes: detectedPuzzleTypes,
      bounds,
    });

    // Combine all pages: Front Matter -> Puzzle Pages -> Solution Pages
    const allPages: PageModel[] = [
      ...freshFrontMatterPages,
      ...existingPuzzlePages,
      ...existingSolutionPages,
    ];

    // Renumber sequentially from 1 to total
    allPages.forEach((page, index) => {
      page.pageNumber = index + 1;
    });

    // Synchronize solution titles and back-references to puzzle page numbers
    const synchronizedPages = AnswerKeyService.synchronizeSolutionPageReferences(allPages);

    const newPageCount = synchronizedPages.length;
    const pageCountChanged = newPageCount !== oldPageCount;
    const newSpineWidth = calculateKdpSpineWidth(newPageCount, paperType);
    const coverDims = calculateKdpCoverDimensions(trimSize.width, trimSize.height, newSpineWidth);
    const spineOutdated = pageCountChanged;

    const currentVersion = project.kdpConfig?.contentVersion || {
      interiorVersion: 1,
      coverVersion: 1,
      printConfigVersion: 1,
      lastGeneratedPageCount: oldPageCount,
      lastGeneratedTrimSize: trimSize.name,
    };

    const updatedDocument: DocumentModel = {
      ...document,
      pages: synchronizedPages,
      updatedAt: new Date().toISOString(),
    };

    const updatedProject: Project = {
      ...project,
      pageCount: newPageCount,
      kdpSettings: {
        ...project.kdpSettings,
        pageCount: newPageCount,
        spineWidthInches: newSpineWidth,
        coverWidthInches: coverDims.width,
        coverHeightInches: coverDims.height,
      },
      bookSettings: {
        ...(project.bookSettings || ({} as any)),
        frontMatter: normalizedFM,
        schemaVersion: project.bookSettings?.schemaVersion || 4,
        metadata: safeMetadata,
        sections: project.bookSettings?.sections || [],
        theme: theme || (project.bookSettings?.theme as any),
        numbering: {
          ...(project.bookSettings?.numbering || {
            enabled: true,
            startPageNumber: 1,
            startPageIndex: freshFrontMatterPages.length,
            frontMatterStyle: 'roman_lower',
            bodyStyle: 'arabic',
            position: 'bottom-center',
            fontSize: 10,
            fontFamily: 'Outfit',
            hideOnFrontMatter: true,
          }),
          startPageIndex: freshFrontMatterPages.length,
        },
        headerFooter: project.bookSettings?.headerFooter || ({} as any),
        answerKey: project.bookSettings?.answerKey || ({} as any),
        toc: project.bookSettings?.toc || ({} as any),
        puzzleNumberingStyle: 'continuous',
      },
      kdpConfig: {
        ...(project.kdpConfig || ({} as any)),
        pageCount: newPageCount,
        contentVersion: {
          ...currentVersion,
          interiorVersion: currentVersion.interiorVersion + 1,
          interiorOutdated: false,
          coverOutdated: spineOutdated ? true : currentVersion.coverOutdated,
          outdatedReason: spineOutdated
            ? `Page count changed from ${oldPageCount} to ${newPageCount}. Spine width must be recalculated.`
            : currentVersion.outdatedReason,
          lastGeneratedPageCount: newPageCount,
        },
      },
      updatedAt: new Date().toISOString(),
    };

    return {
      updatedDocument,
      updatedProject,
      oldPageCount,
      newPageCount,
      pageCountChanged,
      spineOutdated,
      newSpineWidth,
    };
  }

  /**
   * Sanitizes an AI generated book plan object to enforce strict front-matter whitelisting.
   * Rejects/removes any unauthorized copyright or instructions sections.
   */
  public static sanitizeAIBookPlan(plan: any, requestedConfig?: Partial<FrontMatterConfig> | Partial<CentralizedFrontMatterConfig>): any {
    if (!plan || typeof plan !== 'object') return plan;
    const reqNormalized = requestedConfig ? this.normalizeConfig(requestedConfig) : null;

    const frontMatter = {
      includeTitlePage: reqNormalized ? reqNormalized.includeTitlePage : Boolean(plan.frontMatter?.includeTitlePage ?? true),
      includeCopyright: reqNormalized ? reqNormalized.includeCopyrightPage : Boolean(plan.frontMatter?.includeCopyright ?? false),
      includeInstructions: reqNormalized ? reqNormalized.includeInstructionsPage : Boolean(plan.frontMatter?.includeInstructions ?? false),
      includeTOC: reqNormalized ? reqNormalized.includeTableOfContents : Boolean(plan.frontMatter?.includeTOC ?? false),
    };

    const forbiddenPatterns: string[] = [];
    if (!frontMatter.includeCopyright) {
      forbiddenPatterns.push('copyright', 'all rights reserved', 'legal notice', '©');
    }
    if (!frontMatter.includeInstructions) {
      forbiddenPatterns.push('how to solve', 'instructions', 'how to play', 'how-to-solve', 'rules');
    }

    const rawSections = Array.isArray(plan.sections) ? plan.sections : [];
    const validSections = rawSections.filter((sec: any) => {
      if (!sec) return false;
      const titleLower = String(sec.title || '').toLowerCase();
      const typeLower = String(sec.puzzleType || '').toLowerCase();
      const themeLower = String(sec.theme || '').toLowerCase();

      for (const pattern of forbiddenPatterns) {
        if (titleLower.includes(pattern) || typeLower.includes(pattern) || themeLower.includes(pattern)) {
          return false;
        }
      }
      return true;
    });

    return {
      ...plan,
      frontMatter,
      sections: validSections,
    };
  }

  /**
   * Server and client side sanitizer:
   * Strips unauthorized front matter pages (Copyright, Instructions/How to Solve, Disclaimer, TOC)
   * unless explicitly enabled in the project / book settings.
   *
   * Ensures:
   * - Strict front matter whitelist: Title (default true), Copyright (default false), How to Solve (default false)
   * - Never removes actual puzzle pages or solution answer keys
   * - Re-indexes all pages continuously from 1 to N with zero blank pages
   * - Re-synchronizes solution cross references
   * - Recalculates spine width and flags cover as outdated if page count changes
   */
  public static sanitizeBookStructure(
    document: DocumentModel,
    project: Project,
    overrideConfig?: Partial<FrontMatterConfig> | Partial<CentralizedFrontMatterConfig>
  ): {
    sanitizedDocument: DocumentModel;
    sanitizedProject: Project;
    removedPagesCount: number;
    pageCountChanged: boolean;
  } {
    const fmConfig = this.normalizeConfig(overrideConfig || project.bookSettings?.frontMatter);
    const oldPageCount = document.pages.length;

    const sanitizedPages: PageModel[] = [];
    let removedPagesCount = 0;

    for (const page of document.pages) {
      const pageType = (page.pageType || '').toLowerCase();
      const pageName = (page.name || '').toLowerCase();

      // Check if page contains puzzle grid or puzzle element (NEVER remove actual puzzle content)
      const isActualPuzzle =
        pageType === 'puzzle' ||
        Boolean(page.puzzleType) ||
        page.elements.some(
          el =>
            el.type === 'puzzle' ||
            Boolean((el as any).puzzleType) ||
            (el.name && (el.name.toLowerCase().includes('puzzle') || el.name.toLowerCase().includes('grid') || el.name.toLowerCase().includes('word search') || el.name.toLowerCase().includes('sudoku') || el.name.toLowerCase().includes('maze')))
        );

      const isActualSolution =
        pageType === 'answer_key' ||
        pageName.includes('solution') ||
        pageName.includes('answer key') ||
        page.elements.some(el => el.name && (el.name.toLowerCase().includes('solution') || el.name.toLowerCase().includes('answer key')));

      if (isActualPuzzle || isActualSolution) {
        sanitizedPages.push(page);
        continue;
      }

      // Check if it's an unauthorized front-matter page
      const isCopyrightPage =
        pageType === 'copyright' ||
        pageName.includes('copyright') ||
        pageName.includes('legal notice') ||
        pageName.includes('all rights reserved') ||
        page.elements.some(
          el =>
            (el.name && el.name.toLowerCase().includes('copyright')) ||
            (el.type === 'text' && typeof (el as TextElement).content === 'string' && ((el as TextElement).content.includes('Copyright ©') || (el as TextElement).content.toLowerCase().includes('all rights reserved')))
        );

      const isInstructionsPage =
        pageType === 'instructions' ||
        pageName.includes('how to solve') ||
        pageName.includes('how-to-solve') ||
        pageName.includes('instructions') ||
        pageName.includes('how to play') ||
        page.elements.some(
          el =>
            (el.name && (el.name.toLowerCase().includes('how to solve') || el.name.toLowerCase().includes('instruction'))) ||
            (el.type === 'text' && typeof (el as TextElement).content === 'string' && ((el as TextElement).content.toLowerCase().includes('how to solve the puzzles') || (el as TextElement).content.toLowerCase().includes('puzzle solving tips')))
        );

      const isTocPage =
        pageType === 'toc' ||
        pageName.includes('table of contents') ||
        page.elements.some(el => el.name && el.name.toLowerCase().includes('table of contents'));

      const isDisclaimerPage =
        pageType === 'disclaimer' ||
        pageName.includes('disclaimer');

      const isTitlePage =
        pageType === 'title' ||
        pageName.includes('title page');

      // Filter based on explicit whitelist
      if (isCopyrightPage && !fmConfig.includeCopyrightPage) {
        removedPagesCount++;
        continue;
      }
      if (isInstructionsPage && !fmConfig.includeInstructionsPage) {
        removedPagesCount++;
        continue;
      }
      if (isTocPage && !fmConfig.includeTableOfContents) {
        removedPagesCount++;
        continue;
      }
      if (isDisclaimerPage && !fmConfig.includeDisclaimerPage) {
        removedPagesCount++;
        continue;
      }
      if (isTitlePage && !fmConfig.includeTitlePage) {
        removedPagesCount++;
        continue;
      }

      sanitizedPages.push(page);
    }

    // Renumber pages consecutively from 1 to N (no blank holes)
    sanitizedPages.forEach((p, idx) => {
      p.pageNumber = idx + 1;
    });

    // Synchronize solution cross-references
    const synchronizedPages = AnswerKeyService.synchronizeSolutionPageReferences(sanitizedPages);
    const newPageCount = synchronizedPages.length;
    const pageCountChanged = newPageCount !== oldPageCount;

    const trimSize = project.kdpSettings?.trimSize || {
      id: '8.5x11',
      name: '8.5 × 11 in',
      width: 8.5,
      height: 11,
      category: 'Large',
    };
    const paperType = (project.kdpSettings?.paperType as any) || 'White';
    const newSpineWidth = calculateKdpSpineWidth(newPageCount, paperType);
    const coverDims = calculateKdpCoverDimensions(trimSize.width, trimSize.height, newSpineWidth);

    const currentVersion = project.kdpConfig?.contentVersion || {
      interiorVersion: 1,
      coverVersion: 1,
      printConfigVersion: 1,
      lastGeneratedPageCount: oldPageCount,
      lastGeneratedTrimSize: trimSize.name,
    };

    const sanitizedDocument: DocumentModel = {
      ...document,
      pages: synchronizedPages,
      updatedAt: new Date().toISOString(),
    };

    const sanitizedProject: Project = {
      ...project,
      pageCount: newPageCount,
      kdpSettings: {
        ...project.kdpSettings,
        pageCount: newPageCount,
        spineWidthInches: newSpineWidth,
        coverWidthInches: coverDims.width,
        coverHeightInches: coverDims.height,
      },
      bookSettings: {
        ...(project.bookSettings || ({} as any)),
        frontMatter: fmConfig,
        schemaVersion: project.bookSettings?.schemaVersion || 4,
      },
      kdpConfig: {
        ...(project.kdpConfig || ({} as any)),
        pageCount: newPageCount,
        contentVersion: {
          ...currentVersion,
          interiorVersion: currentVersion.interiorVersion + (pageCountChanged ? 1 : 0),
          interiorOutdated: false,
          coverOutdated: pageCountChanged ? true : currentVersion.coverOutdated,
          outdatedReason: pageCountChanged
            ? 'Interior page count changed after front-matter removal.'
            : currentVersion.outdatedReason,
          lastGeneratedPageCount: newPageCount,
        },
      },
      updatedAt: new Date().toISOString(),
    };

    return {
      sanitizedDocument,
      sanitizedProject,
      removedPagesCount,
      pageCountChanged,
    };
  }
}

import { DEFAULT_PUZZLE_STYLE } from '../puzzles/renderers/PuzzleRenderer';
import { GeneratedPuzzle, PuzzleStyleOptions } from '../puzzles/types';
import { BookTheme } from '../types/book';
import { CanvasElement, DocumentModel, PageModel, Project, TrimSize } from '../types/project';
import { PageCompositionEngine } from './pageCompositionEngine';

export interface CreateSolutionPageOptions {
  projectId: string;
  puzzle: GeneratedPuzzle;
  originalPageNumber: number;
  sourcePuzzlePageId: string;
  sourcePuzzleElementId?: string;
  styleOptions?: Partial<PuzzleStyleOptions>;
  theme?: BookTheme;
  bounds?: ReturnType<typeof PageCompositionEngine.getPageBounds>;
  trimSize?: TrimSize;
}

export interface InsertPuzzlesOptions {
  document: DocumentModel;
  project: Project;
  puzzles: GeneratedPuzzle[];
  styleOptions?: Partial<PuzzleStyleOptions>;
  answerKeyMode?: 'end_of_book' | 'after_puzzle' | 'after_each_puzzle' | 'none';
  autoAnswerKey?: boolean;
  theme?: BookTheme;
}

export class AnswerKeyService {
  /**
   * Checks if a page is a dedicated solution / answer key page
   */
  static isSolutionPage(page: PageModel): boolean {
    return (
      page.pageType === 'answer_key' ||
      page.isAnswerKey === true ||
      (page.name || '').toLowerCase().startsWith('solution') ||
      (page.name || '').toLowerCase().startsWith('answer key')
    );
  }

  /**
   * Creates an editable, dedicated 1-up Answer Key Page for a given puzzle
   */
  static createDedicatedSolutionPage(options: CreateSolutionPageOptions): PageModel {
    const {
      projectId,
      puzzle,
      originalPageNumber,
      sourcePuzzlePageId,
      sourcePuzzleElementId,
      styleOptions = {},
      theme,
      bounds: customBounds,
      trimSize = { id: '8.5x11', name: '8.5 × 11 in (Large Format)', width: 8.5, height: 11, category: 'Large' },
    } = options;

    const bounds = customBounds || PageCompositionEngine.getPageBounds(trimSize, 'No Bleed');
    const marginPx = bounds.marginInsidePx;
    const contentWidth = bounds.contentWidth;
    const contentHeight = bounds.contentHeight;

    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const headingId = `el-sol-heading-${uniqueSuffix}`;
    const puzzleElId = `el-sol-puz-${uniqueSuffix}`;
    const solPageId = `page-${projectId}-sol-${uniqueSuffix}`;

    const headingElement: CanvasElement = {
      id: headingId,
      type: 'text',
      name: 'Solutions Header',
      content: `Solution — Page ${originalPageNumber}`,
      x: marginPx,
      y: bounds.marginTopPx,
      width: contentWidth,
      height: 32,
      rotation: 0,
      zIndex: 1,
      opacity: 1,
      fontFamily: theme?.fontHeading || styleOptions?.fontFamily || 'Plus Jakarta Sans, sans-serif',
      fontSize: 16,
      fontWeight: '800',
      textAlign: 'center',
      color: theme?.primaryColor || '#111827',
      letterSpacing: 1.5,
      lineHeight: 1.2,
    };

    const solutionElement: CanvasElement = {
      id: puzzleElId,
      type: 'puzzle',
      name: `Solution: ${puzzle.title || 'Word Search'}`,
      x: marginPx,
      y: bounds.marginTopPx + 36,
      width: contentWidth,
      height: contentHeight - 46,
      rotation: 0,
      zIndex: 2,
      opacity: 1,
      locked: false,
      aspectRatioLocked: false,
      puzzleType: puzzle.type,
      difficulty: puzzle.difficulty,
      title: `Solution — Page ${originalPageNumber}`,
      puzzleData: puzzle as any,
      sourcePuzzleId: puzzle.id,
      sourcePuzzlePageId,
      sourcePuzzleElementId,
      previewData: {
        ...DEFAULT_PUZZLE_STYLE,
        ...styleOptions,
        fontFamily: theme?.fontBody || styleOptions?.fontFamily || 'Plus Jakarta Sans, sans-serif',
        gridBorderColor: theme?.borderColor || styleOptions?.borderColor || '#111827',
        showSolution: true,
        showWordBank: false,
        gridFontSize: 14,
        titleFontSize: 16,
        clueFontSize: 11,
      },
    };

    return {
      id: solPageId,
      pageNumber: originalPageNumber + 1,
      pageType: 'answer_key',
      isAnswerKey: true,
      sourcePuzzleId: puzzle.id,
      puzzleId: puzzle.id,
      sourcePuzzlePageId,
      sourcePuzzleElementId,
      name: `Solution — Page ${originalPageNumber}`,
      backgroundColor: '#FFFFFF',
      notes: `Dedicated Solution for Puzzle on Page ${originalPageNumber}`,
      elements: [headingElement, solutionElement],
    };
  }

  /**
   * Synchronizes all solution page titles and headings with their source puzzle pages' current positions
   */
  static synchronizeSolutionPageReferences(pages: PageModel[]): PageModel[] {
    // Map page IDs to their current 1-based page numbers
    const pageIdToNumberMap = new Map<string, number>();
    const puzzleIdToNumberMap = new Map<string, number>();

    pages.forEach((page, idx) => {
      const pNum = idx + 1;
      pageIdToNumberMap.set(page.id, pNum);

      if (!this.isSolutionPage(page)) {
        if (page.puzzleId) {
          puzzleIdToNumberMap.set(page.puzzleId, pNum);
        }
        if (page.sourcePuzzleId) {
          puzzleIdToNumberMap.set(page.sourcePuzzleId, pNum);
        }
        (page.elements || []).forEach(el => {
          if ((el as any).sourcePuzzleId) {
            puzzleIdToNumberMap.set((el as any).sourcePuzzleId, pNum);
          }
          if ((el as any).puzzleData?.id) {
            puzzleIdToNumberMap.set((el as any).puzzleData.id, pNum);
          }
        });
      }
    });

    return pages.map((page, idx) => {
      const pageNumber = idx + 1;
      if (!this.isSolutionPage(page)) {
        return {
          ...page,
          pageNumber,
        };
      }

      // Find the source puzzle page number
      let sourcePageNumber: number | undefined;

      if (page.sourcePuzzlePageId && pageIdToNumberMap.has(page.sourcePuzzlePageId)) {
        sourcePageNumber = pageIdToNumberMap.get(page.sourcePuzzlePageId);
      } else if (page.sourcePuzzleId && puzzleIdToNumberMap.has(page.sourcePuzzleId)) {
        sourcePageNumber = puzzleIdToNumberMap.get(page.sourcePuzzleId);
      } else if (page.puzzleId && puzzleIdToNumberMap.has(page.puzzleId)) {
        sourcePageNumber = puzzleIdToNumberMap.get(page.puzzleId);
      }

      if (!sourcePageNumber) {
        // Fallback: search through elements
        for (const el of page.elements || []) {
          if ((el as any).sourcePuzzlePageId && pageIdToNumberMap.has((el as any).sourcePuzzlePageId)) {
            sourcePageNumber = pageIdToNumberMap.get((el as any).sourcePuzzlePageId);
            break;
          }
          if ((el as any).sourcePuzzleId && puzzleIdToNumberMap.has((el as any).sourcePuzzleId)) {
            sourcePageNumber = puzzleIdToNumberMap.get((el as any).sourcePuzzleId);
            break;
          }
        }
      }

      const refNumber = sourcePageNumber || pageNumber;
      const refTitle = `Solution — Page ${refNumber}`;

      const updatedElements = (page.elements || []).map(el => {
        if (el.type === 'text' && (el.name === 'Solutions Header' || el.content?.startsWith('Solution'))) {
          return {
            ...el,
            content: refTitle,
          };
        }
        if (el.type === 'puzzle') {
          return {
            ...el,
            title: refTitle,
          };
        }
        return el;
      });

      return {
        ...page,
        pageNumber,
        name: refTitle,
        elements: updatedElements,
      };
    });
  }

  /**
   * Inserts multiple generated puzzles and their dedicated solution pages atomically.
   * Ensures deterministic 1:1 puzzle-to-solution page creation from the exact same puzzle data.
   */
  static insertPuzzlesWithSolutions(options: InsertPuzzlesOptions): {
    updatedDocument: DocumentModel;
    updatedProject: Project;
    addedPuzzlePages: PageModel[];
    addedSolutionPages: PageModel[];
  } {
    const {
      document,
      project,
      puzzles,
      styleOptions = {},
      answerKeyMode = project.bookSettings?.answerKey?.mode || 'end_of_book',
      autoAnswerKey = true,
      theme = project.bookSettings?.theme,
    } = options;

    if (!puzzles || puzzles.length === 0) {
      return {
        updatedDocument: document,
        updatedProject: project,
        addedPuzzlePages: [],
        addedSolutionPages: [],
      };
    }

    const trimSize: TrimSize = project.kdpSettings?.trimSize || {
      id: '8.5x11',
      name: '8.5 × 11 in (Large Format)',
      width: 8.5,
      height: 11,
      category: 'Large',
    };
    const bounds = PageCompositionEngine.getPageBounds(trimSize, 'No Bleed');
    const marginPx = bounds.marginInsidePx;
    const contentWidth = bounds.contentWidth;
    const contentHeight = bounds.contentHeight;

    const currentPages = [...(document.pages || [])];
    const isAnswerKeyEnabled = autoAnswerKey && answerKeyMode !== 'none';

    const newPuzzlePages: PageModel[] = [];
    const newSolutionPages: PageModel[] = [];

    // Create puzzle and solution pages for each puzzle
    puzzles.forEach((puzzle, idx) => {
      const uniqueSuffix = `${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`;
      const puzzlePageId = `page-${project.id}-puz-${uniqueSuffix}`;
      const puzzleElementId = `el-puz-${uniqueSuffix}`;

      const puzzleElement: CanvasElement = {
        id: puzzleElementId,
        type: 'puzzle',
        name: puzzle.title || `Word Search #${idx + 1}`,
        x: marginPx,
        y: bounds.marginTopPx,
        width: contentWidth,
        height: contentHeight,
        rotation: 0,
        zIndex: 1,
        opacity: 1,
        locked: false,
        aspectRatioLocked: false,
        puzzleType: puzzle.type,
        difficulty: puzzle.difficulty,
        title: puzzle.title,
        puzzleData: puzzle as any,
        sourcePuzzleId: puzzle.id,
        sourcePuzzlePageId: puzzlePageId,
        sourcePuzzleElementId: puzzleElementId,
        previewData: {
          ...DEFAULT_PUZZLE_STYLE,
          ...styleOptions,
          showSolution: false,
        },
      };

      const puzzlePage: PageModel = {
        id: puzzlePageId,
        pageNumber: currentPages.length + idx + 1,
        pageType: 'puzzle',
        puzzleId: puzzle.id,
        puzzleType: puzzle.type,
        sourcePuzzleId: puzzle.id,
        name: puzzle.title || `Word Search #${idx + 1}`,
        backgroundColor: '#FFFFFF',
        elements: [puzzleElement],
      };

      newPuzzlePages.push(puzzlePage);

      if (isAnswerKeyEnabled) {
        const solutionPage = this.createDedicatedSolutionPage({
          projectId: project.id,
          puzzle,
          originalPageNumber: puzzlePage.pageNumber,
          sourcePuzzlePageId: puzzlePageId,
          sourcePuzzleElementId: puzzleElementId,
          styleOptions,
          theme,
          bounds,
          trimSize,
        });

        newSolutionPages.push(solutionPage);
      }
    });

    // Assemble updated pages list based on answerKeyMode
    let combinedPages: PageModel[] = [];

    if (answerKeyMode === 'after_puzzle' || answerKeyMode === 'after_each_puzzle') {
      // Interleaved: Each puzzle followed immediately by its solution
      const interleaved: PageModel[] = [];
      newPuzzlePages.forEach((pPage, i) => {
        interleaved.push(pPage);
        if (newSolutionPages[i]) {
          interleaved.push(newSolutionPages[i]);
        }
      });
      combinedPages = [...currentPages, ...interleaved];
    } else if (answerKeyMode === 'end_of_book' && newSolutionPages.length > 0) {
      // Insert puzzle pages before existing solutions, and append solution pages at the end
      const firstSolutionIndex = currentPages.findIndex(p => this.isSolutionPage(p));
      if (firstSolutionIndex !== -1) {
        const beforeSolutions = currentPages.slice(0, firstSolutionIndex);
        const existingSolutions = currentPages.slice(firstSolutionIndex);
        combinedPages = [...beforeSolutions, ...newPuzzlePages, ...existingSolutions, ...newSolutionPages];
      } else {
        combinedPages = [...currentPages, ...newPuzzlePages, ...newSolutionPages];
      }
    } else {
      // No solutions created
      const firstSolutionIndex = currentPages.findIndex(p => this.isSolutionPage(p));
      if (firstSolutionIndex !== -1) {
        const beforeSolutions = currentPages.slice(0, firstSolutionIndex);
        const existingSolutions = currentPages.slice(firstSolutionIndex);
        combinedPages = [...beforeSolutions, ...newPuzzlePages, ...existingSolutions];
      } else {
        combinedPages = [...currentPages, ...newPuzzlePages];
      }
    }

    // Renumber all pages and synchronize all solution references
    const finalPages = this.synchronizeSolutionPageReferences(
      combinedPages.map((p, i) => ({ ...p, pageNumber: i + 1 }))
    );

    const totalPages = finalPages.length;
    const now = new Date().toISOString();

    const updatedDocument: DocumentModel = {
      ...document,
      pages: finalPages,
      updatedAt: now,
    };

    const updatedProject: Project = {
      ...project,
      pageCount: totalPages,
      updatedAt: now,
      kdpSettings: {
        ...project.kdpSettings,
        trimSize,
        orientation: project.kdpSettings?.orientation || 'Portrait',
        pageCount: totalPages,
        margins: project.kdpSettings?.margins || { top: 0.5, bottom: 0.5, left: 0.75, right: 0.5 },
        bleed: project.kdpSettings?.bleed || 'No Bleed',
        paperType: project.kdpSettings?.paperType || 'White',
        spineWidthInches: Math.round(totalPages * 0.002252 * 1000) / 1000,
        coverWidthInches: trimSize.width * 2 + 0.002252 * totalPages + 0.25,
        coverHeightInches: trimSize.height + 0.25,
      },
    };

    return {
      updatedDocument,
      updatedProject,
      addedPuzzlePages: newPuzzlePages,
      addedSolutionPages: newSolutionPages,
    };
  }

  /**
   * Inserts a single generated puzzle with its corresponding dedicated solution page atomically
   */
  static insertPuzzleWithSolution(options: {
    document: DocumentModel;
    project: Project;
    puzzle: GeneratedPuzzle;
    styleOptions?: Partial<PuzzleStyleOptions>;
    answerKeyMode?: 'end_of_book' | 'after_puzzle' | 'after_each_puzzle' | 'none';
    autoAnswerKey?: boolean;
    theme?: BookTheme;
  }): {
    updatedDocument: DocumentModel;
    updatedProject: Project;
    puzzlePage: PageModel;
    solutionPage?: PageModel;
  } {
    const result = this.insertPuzzlesWithSolutions({
      document: options.document,
      project: options.project,
      puzzles: [options.puzzle],
      styleOptions: options.styleOptions,
      answerKeyMode: options.answerKeyMode,
      autoAnswerKey: options.autoAnswerKey,
      theme: options.theme,
    });

    return {
      updatedDocument: result.updatedDocument,
      updatedProject: result.updatedProject,
      puzzlePage: result.addedPuzzlePages[0],
      solutionPage: result.addedSolutionPages[0],
    };
  }
}

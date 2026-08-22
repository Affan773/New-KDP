import { Project, DocumentModel, PageModel, TrimSize, CanvasElement } from '../../types/project';
import { GeneratedPuzzle, PuzzleStyleOptions } from '../types';
import { DEFAULT_PUZZLE_STYLE } from '../renderers/PuzzleRenderer';
import { AnswerKeyService } from '../../services/answerKeyService';

export interface PuzzleBookBuildOptions {
  name: string;
  puzzles: GeneratedPuzzle[];
  puzzlesPerPage: 1 | 2 | 4;
  answerKeyMode: 'end_of_book' | 'after_each_puzzle' | 'none';
  trimSize?: TrimSize;
  styleOptions?: Partial<PuzzleStyleOptions>;
}

export class PuzzleBookBuilder {
  static buildProject(options: PuzzleBookBuildOptions): { project: Project; document: DocumentModel } {
    const {
      name,
      puzzles,
      puzzlesPerPage = 1,
      answerKeyMode = 'end_of_book',
      trimSize = { id: '8.5x11', name: '8.5 × 11 in (Large Format)', width: 8.5, height: 11, category: 'Large' },
      styleOptions = {},
    } = options;

    const projectId = `proj-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const documentId = `doc-${Date.now()}`;
    const now = new Date().toISOString();

    const pageWidthPx = Math.round(trimSize.width * 96);
    const pageHeightPx = Math.round(trimSize.height * 96);

    const marginInches = 0.5;
    const marginPx = Math.round(marginInches * 96);
    const contentWidth = pageWidthPx - marginPx * 2;
    const contentHeight = pageHeightPx - marginPx * 2;

    const pages: PageModel[] = [];
    let pageNumber = 1;

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
    const puzzlePageMap = new Map<string, number>();
    const puzzlePageIdMap = new Map<string, string>();
    const puzzleElementIdMap = new Map<string, string>();

    // ================= 1. PUZZLE PAGES =================
    for (let i = 0; i < puzzles.length; i += puzzlesPerPage) {
      const pagePuzzles = puzzles.slice(i, i + puzzlesPerPage);
      const elements: CanvasElement[] = [];
      const currentPuzzlePageNumber = pageNumber;
      const currentPuzzlePageId = `page-${projectId}-${pageNumber}`;

      pagePuzzles.forEach((puzzle, slotIdx) => {
        const slot = puzzleSlots[slotIdx];
        const elementId = `el-puz-${pageNumber}-${slotIdx + 1}`;
        puzzlePageMap.set(puzzle.id, currentPuzzlePageNumber);
        puzzlePageIdMap.set(puzzle.id, currentPuzzlePageId);
        puzzleElementIdMap.set(puzzle.id, elementId);

        elements.push({
          id: elementId,
          type: 'puzzle',
          name: puzzle.title || `Puzzle #${puzzle.settings.puzzleNumber || i + slotIdx + 1}`,
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
      pages.push({
        id: currentPuzzlePageId,
        pageNumber: currentPuzzlePageNumber,
        pageType: 'puzzle',
        puzzleId: firstPuzzle?.id,
        puzzleType: firstPuzzle?.type,
        sourcePuzzleId: firstPuzzle?.id,
        name: pagePuzzles.length === 1 && firstPuzzle?.title ? firstPuzzle.title : `Puzzle Page ${pageNumber}`,
        backgroundColor: '#FFFFFF',
        elements,
      });
      pageNumber++;

      // If interleaved solution mode
      if (answerKeyMode === 'after_each_puzzle') {
        pagePuzzles.forEach((puzzle, pIdx) => {
          const origPage = puzzlePageMap.get(puzzle.id) || currentPuzzlePageNumber;
          const origElId = puzzleElementIdMap.get(puzzle.id);
          const solSlot = {
            x: marginPx,
            y: marginPx + 35,
            width: contentWidth,
            height: contentHeight - 45,
          };

          const solutionElements: CanvasElement[] = [
            {
              id: `el-sol-heading-${pageNumber}`,
              type: 'text',
              name: 'Solutions Header',
              content: `Solution — Page ${origPage}`,
              x: marginPx,
              y: marginPx,
              width: contentWidth,
              height: 30,
              rotation: 0,
              zIndex: 1,
              opacity: 1,
              fontFamily: styleOptions.fontFamily || 'Plus Jakarta Sans, sans-serif',
              fontSize: 16,
              fontWeight: '800',
              textAlign: 'center',
              color: '#111827',
              letterSpacing: 1.5,
              lineHeight: 1.2,
            },
            {
              id: `el-sol-${pageNumber}-${pIdx + 1}`,
              type: 'puzzle',
              name: `Solution: ${puzzle.title}`,
              x: solSlot.x,
              y: solSlot.y,
              width: solSlot.width,
              height: solSlot.height,
              rotation: 0,
              zIndex: 2,
              opacity: 1,
              locked: false,
              aspectRatioLocked: false,
              puzzleType: puzzle.type,
              difficulty: puzzle.difficulty,
              title: `Solution — Page ${origPage}`,
              puzzleData: puzzle as any,
              sourcePuzzleId: puzzle.id,
              sourcePuzzlePageId: currentPuzzlePageId,
              sourcePuzzleElementId: origElId,
              previewData: {
                ...DEFAULT_PUZZLE_STYLE,
                ...styleOptions,
                gridFontSize: 14,
                titleFontSize: 16,
                clueFontSize: 11,
                showSolution: true,
                showWordBank: false,
              },
            },
          ];

          pages.push({
            id: `page-${projectId}-${pageNumber}`,
            pageNumber,
            pageType: 'answer_key',
            isAnswerKey: true,
            sourcePuzzleId: puzzle.id,
            puzzleId: puzzle.id,
            sourcePuzzlePageId: currentPuzzlePageId,
            sourcePuzzleElementId: origElId,
            name: `Solution — Page ${origPage}`,
            backgroundColor: '#FFFFFF',
            elements: solutionElements,
          });
          pageNumber++;
        });
      }
    }

    // ================= 2. END-OF-BOOK ANSWER KEYS =================
    if (answerKeyMode === 'end_of_book') {
      const isWordSearchBook = puzzles.some(p => p.type === 'word_search');

      // For Word Search or 1-up: EXACTLY ONE PUZZLE SOLUTION occupies ONE FULL MANUSCRIPT PAGE
      if (isWordSearchBook || puzzlesPerPage === 1) {
        puzzles.forEach((puzzle, pIdx) => {
          const origPage = puzzlePageMap.get(puzzle.id) || pIdx + 1;
          const origPageId = puzzlePageIdMap.get(puzzle.id);
          const origElId = puzzleElementIdMap.get(puzzle.id);
          const solSlot = {
            x: marginPx,
            y: marginPx + 35,
            width: contentWidth,
            height: contentHeight - 45,
          };

          const solutionElements: CanvasElement[] = [
            {
              id: `el-sol-heading-${pageNumber}`,
              type: 'text',
              name: 'Solutions Header',
              content: `Solution — Page ${origPage}`,
              x: marginPx,
              y: marginPx,
              width: contentWidth,
              height: 30,
              rotation: 0,
              zIndex: 1,
              opacity: 1,
              fontFamily: styleOptions.fontFamily || 'Plus Jakarta Sans, sans-serif',
              fontSize: 16,
              fontWeight: '800',
              textAlign: 'center',
              color: '#111827',
              letterSpacing: 1.5,
              lineHeight: 1.2,
            },
            {
              id: `el-sol-${pageNumber}-1`,
              type: 'puzzle',
              name: `Solution: ${puzzle.title}`,
              x: solSlot.x,
              y: solSlot.y,
              width: solSlot.width,
              height: solSlot.height,
              rotation: 0,
              zIndex: 2,
              opacity: 1,
              locked: false,
              aspectRatioLocked: false,
              puzzleType: puzzle.type,
              difficulty: puzzle.difficulty,
              title: `Solution — Page ${origPage}`,
              puzzleData: puzzle as any,
              sourcePuzzleId: puzzle.id,
              sourcePuzzlePageId: origPageId,
              sourcePuzzleElementId: origElId,
              previewData: {
                ...DEFAULT_PUZZLE_STYLE,
                ...styleOptions,
                gridFontSize: 14,
                titleFontSize: 16,
                clueFontSize: 11,
                showSolution: true,
                showWordBank: false,
              },
            },
          ];

          pages.push({
            id: `page-${projectId}-${pageNumber}`,
            pageNumber,
            pageType: 'answer_key',
            isAnswerKey: true,
            sourcePuzzleId: puzzle.id,
            puzzleId: puzzle.id,
            sourcePuzzlePageId: origPageId,
            sourcePuzzleElementId: origElId,
            name: `Solution — Page ${origPage}`,
            backgroundColor: '#FFFFFF',
            elements: solutionElements,
          });
          pageNumber++;
        });
      } else {
        // Multi-up fallback only for non-word-search multi-puzzle layouts
        const solutionsPerPage = 4;
        const solutionSlots = getSlots(4);

        for (let i = 0; i < puzzles.length; i += solutionsPerPage) {
          const chunk = puzzles.slice(i, i + solutionsPerPage);
          const solutionElements: CanvasElement[] = chunk.map((puzzle, slotIdx) => {
            const slot = solutionSlots[slotIdx];
            const origPage = puzzlePageMap.get(puzzle.id) || i + slotIdx + 1;
            const origPageId = puzzlePageIdMap.get(puzzle.id);
            const origElId = puzzleElementIdMap.get(puzzle.id);
            return {
              id: `el-sol-${pageNumber}-${slotIdx + 1}`,
              type: 'puzzle',
              name: `Solution Key: ${puzzle.title}`,
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
              title: `Solution — Page ${origPage}`,
              puzzleData: puzzle as any,
              sourcePuzzleId: puzzle.id,
              sourcePuzzlePageId: origPageId,
              sourcePuzzleElementId: origElId,
              previewData: {
                ...DEFAULT_PUZZLE_STYLE,
                ...styleOptions,
                gridFontSize: 9,
                titleFontSize: 11,
                clueFontSize: 8,
                showSolution: true,
                showWordBank: false,
              },
            };
          });

          pages.push({
            id: `page-${projectId}-${pageNumber}`,
            pageNumber,
            pageType: 'answer_key',
            isAnswerKey: true,
            name: `Answer Keys (P.${pageNumber})`,
            backgroundColor: '#FFFFFF',
            elements: solutionElements,
          });
          pageNumber++;
        }
      }
    }

    const synchronizedPages = AnswerKeyService.synchronizeSolutionPageReferences(pages);

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


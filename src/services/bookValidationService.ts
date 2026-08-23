import { calculateKdpInsideMargin } from '../constants/kdp';
import { GeneratedPuzzle } from '../puzzles/types';
import { DocumentModel, PageModel, Project } from '../types/project';

export type ValidationSeverity = 'info' | 'warning' | 'error' | 'pass';
export type ValidationCategory = 'document' | 'layout' | 'typography' | 'puzzles' | 'book';

export interface ValidationIssue {
  id: string;
  severity: ValidationSeverity;
  category: ValidationCategory;
  title: string;
  message: string;
  pageIndex?: number;
  pageNumber?: number;
  elementId?: string;
  fixSuggestion?: string;
  canAutoFix?: boolean;
  autoFixAction?: 'fix_gutter' | 'pad_even_pages' | 'renumber_pages' | 'fix_puzzle_seeds' | 'center_safe_area';
}

export interface ValidationReport {
  isValid: boolean;
  hasErrors: boolean;
  hasWarnings: boolean;
  errorsCount: number;
  warningsCount: number;
  infosCount: number;
  passedCount: number;
  overallStatus: 'READY' | 'READY_WITH_WARNINGS' | 'NOT_READY';
  statusText: string;
  issues: ValidationIssue[];
}

export class BookValidationService {
  /**
   * Runs the comprehensive 5-domain KDP Preflight inspection
   */
  static validateBook(
    project: Project,
    document?: DocumentModel | null,
    puzzles: GeneratedPuzzle[] = []
  ): ValidationReport {
    const issues: ValidationIssue[] = [];
    const pages = document?.pages || [];
    const totalPages = pages.length > 0 ? pages.length : project.pageCount || 0;
    const trimW = (project.kdpSettings?.trimSize?.width || 8.5) * 96;
    const trimH = (project.kdpSettings?.trimSize?.height || 11) * 96;

    // ==========================================
    // 1. DOCUMENT LEVEL CHECKS
    // ==========================================

    // 1.1 Trim Size check
    if (!project.kdpSettings?.trimSize || project.kdpSettings.trimSize.width <= 0 || project.kdpSettings.trimSize.height <= 0) {
      issues.push({
        id: 'val-err-trim-size',
        severity: 'error',
        category: 'document',
        title: 'Invalid Trim Size',
        message: 'The manuscript trim size dimensions are missing or non-positive.',
        fixSuggestion: 'Select a standard KDP trim size (e.g. 8.5" × 11" or 6" × 9") in Book Setup.',
      });
    }

    // 1.2 Orientation check
    if (!project.kdpSettings?.orientation) {
      issues.push({
        id: 'val-warn-orientation',
        severity: 'warning',
        category: 'document',
        title: 'Unspecified Page Orientation',
        message: 'Document orientation is not defined. Defaulting to Portrait for standard KDP print.',
        fixSuggestion: 'Set orientation in Book Setup.',
      });
    }

    // 1.3 Page count checks (KDP min: 24, max: 828)
    if (totalPages < 24) {
      issues.push({
        id: 'val-err-pagecount-min',
        severity: 'error',
        category: 'document',
        title: 'Page Count Below KDP Minimum (24 Pages)',
        message: `Current manuscript has ${totalPages} page(s). Amazon KDP Paperback requires a minimum of 24 printed pages for saddle-stitch/perfect binding.`,
        fixSuggestion: `Add ${24 - totalPages} more page(s) to reach minimum 24-page threshold.`,
      });
    } else if (totalPages > 828) {
      issues.push({
        id: 'val-err-pagecount-max',
        severity: 'error',
        category: 'document',
        title: 'Page Count Exceeds KDP Maximum (828 Pages)',
        message: `Current manuscript has ${totalPages} pages. Amazon KDP allows a maximum of 828 pages for black & white paperbacks.`,
        fixSuggestion: 'Split the manuscript or reduce puzzle count to under 828 pages.',
      });
    }

    // 1.4 Odd page count warning
    if (totalPages > 0 && totalPages % 2 !== 0) {
      issues.push({
        id: 'val-warn-odd-pages',
        severity: 'warning',
        category: 'document',
        title: 'Odd Total Page Count',
        message: `Book currently contains ${totalPages} pages (odd number). Print-on-demand books print 2-sided spreads, so an even page count is recommended.`,
        fixSuggestion: 'Add a blank or notes page at the end of the manuscript.',
        canAutoFix: true,
        autoFixAction: 'pad_even_pages',
      });
    }

    // 1.5 Blank pages check (pages with 0 elements)
    if (pages.length > 0) {
      const blankPages = pages.filter(p => (!p.elements || p.elements.length === 0) && p.pageType !== 'blank');
      if (blankPages.length > 0 && blankPages.length > totalPages * 0.3) {
        issues.push({
          id: 'val-warn-excess-blank-pages',
          severity: 'warning',
          category: 'document',
          title: 'High Proportion of Empty Pages',
          message: `${blankPages.length} pages have no content elements. KDP may flag excessive unintentional blank pages.`,
          fixSuggestion: 'Review unpopulated pages and add puzzle content or mark as intentional blank sheets.',
        });
      }
    }

    // ==========================================
    // 2. LAYOUT & MARGIN CHECKS
    // ==========================================

    // 2.1 Inside Gutter margin check
    const recommendedInsideMargin = calculateKdpInsideMargin(totalPages);
    const configuredInsideMargin = project.kdpSettings?.margins?.left || 0.5;
    if (configuredInsideMargin < recommendedInsideMargin) {
      issues.push({
        id: 'val-warn-gutter-too-small',
        severity: 'warning',
        category: 'layout',
        title: 'Inside Spine Gutter Below Recommended Size',
        message: `For a ${totalPages}-page book, KDP recommends an inside gutter margin of at least ${recommendedInsideMargin}", but current inside margin is ${configuredInsideMargin}". Text near the spine fold may be difficult to read.`,
        fixSuggestion: `Adjust inside gutter to ${recommendedInsideMargin}" in Book Setup.`,
        canAutoFix: true,
        autoFixAction: 'fix_gutter',
      });
    }

    // 2.2 Content outside Safe Area / Margin Clipping Check
    if (pages.length > 0) {
      const safeMarginPx = Math.round(0.375 * 96); // 0.375" minimum safe zone
      const unsafePages: { index: number; pageNumber: number; elementId: string; elementName: string }[] = [];

      pages.forEach((p, pIdx) => {
        p.elements.forEach(el => {
          if (el.locked) return;
          // Check if bounding box exceeds safe print bounds
          const isLeftUnsafe = el.x < safeMarginPx;
          const isTopUnsafe = el.y < safeMarginPx;
          const isRightUnsafe = el.x + el.width > trimW - safeMarginPx;
          const isBottomUnsafe = el.y + el.height > trimH - safeMarginPx;

          if (isLeftUnsafe || isTopUnsafe || isRightUnsafe || isBottomUnsafe) {
            unsafePages.push({
              index: pIdx,
              pageNumber: p.pageNumber,
              elementId: el.id,
              elementName: el.name || el.type,
            });
          }
        });
      });

      if (unsafePages.length > 0) {
        // Group by first 5 distinct pages to avoid overwhelming
        const firstUnsafe = unsafePages[0];
        issues.push({
          id: `val-warn-safe-margin-overflow`,
          severity: 'warning',
          category: 'layout',
          title: 'Content Placed in Unsafe Margin Zone',
          message: `${unsafePages.length} element(s) across ${new Set(unsafePages.map(u => u.pageNumber)).size} page(s) extend past the 0.375" safe print margin. (First occurrence: Page ${firstUnsafe.pageNumber}, "${firstUnsafe.elementName}")`,
          pageIndex: firstUnsafe.index,
          pageNumber: firstUnsafe.pageNumber,
          elementId: firstUnsafe.elementId,
          fixSuggestion: 'Move elements inside the safe margin guides or run Auto-Center.',
          canAutoFix: true,
          autoFixAction: 'center_safe_area',
        });
      }
    }

    // ==========================================
    // 3. TYPOGRAPHY CHECKS
    // ==========================================
    if (pages.length > 0) {
      const smallTextElements: { index: number; pageNumber: number; elementId: string; fontSize: number }[] = [];

      pages.forEach((p, pIdx) => {
        p.elements.forEach(el => {
          if (el.type === 'text' && el.fontSize && el.fontSize < 7) {
            smallTextElements.push({
              index: pIdx,
              pageNumber: p.pageNumber,
              elementId: el.id,
              fontSize: el.fontSize,
            });
          }
        });
      });

      if (smallTextElements.length > 0) {
        const firstSmall = smallTextElements[0];
        issues.push({
          id: 'val-warn-small-font',
          severity: 'warning',
          category: 'typography',
          title: 'Extremely Small Text Detected (< 7pt)',
          message: `Found ${smallTextElements.length} text element(s) with font size below 7pt (e.g. Page ${firstSmall.pageNumber} at ${firstSmall.fontSize}pt). Text may be illegible when printed.`,
          pageIndex: firstSmall.index,
          pageNumber: firstSmall.pageNumber,
          elementId: firstSmall.elementId,
          fixSuggestion: 'Increase font size to at least 8pt–10pt for print clarity.',
        });
      }
    }

    // ==========================================
    // 4. PUZZLE INTEGRITY & UNIQUENESS CHECKS
    // ==========================================
    const puzzleElementsList: { pageIndex: number; pageNumber: number; el: any }[] = [];
    pages.forEach((p, pIdx) => {
      p.elements.forEach(el => {
        if (el.type === 'puzzle') {
          puzzleElementsList.push({ pageIndex: pIdx, pageNumber: p.pageNumber, el });
        }
      });
    });

    if (puzzleElementsList.length > 0) {
      // 4.1 Duplicate puzzle seeds check
      const seedMap = new Map<number, { pageNumber: number; title: string }>();
      const duplicateSeeds: { seed: number; page1: number; page2: number; title: string }[] = [];

      puzzleElementsList.forEach(({ pageNumber, el }) => {
        const puzData = el.puzzleData;
        const seed = puzData?.seed || el.previewData?.seed;
        if (seed !== undefined && seed !== null) {
          if (seedMap.has(seed)) {
            const existing = seedMap.get(seed)!;
            duplicateSeeds.push({
              seed,
              page1: existing.pageNumber,
              page2: pageNumber,
              title: el.name || el.title || 'Puzzle',
            });
          } else {
            seedMap.set(seed, { pageNumber, title: el.name || el.title || 'Puzzle' });
          }
        }
      });

      if (duplicateSeeds.length > 0) {
        const firstDup = duplicateSeeds[0];
        issues.push({
          id: 'val-warn-duplicate-puzzle-seeds',
          severity: 'warning',
          category: 'puzzles',
          title: 'Duplicate Puzzle Seeds Detected',
          message: `${duplicateSeeds.length} puzzle(s) share identical seeds (e.g. Page ${firstDup.page1} and Page ${firstDup.page2}). This will print identical puzzles.`,
          pageIndex: pages.findIndex(p => p.pageNumber === firstDup.page2),
          pageNumber: firstDup.page2,
          fixSuggestion: 'Regenerate duplicate puzzles with distinct random seeds.',
          canAutoFix: true,
          autoFixAction: 'fix_puzzle_seeds',
        });
      }

      // 4.2 Missing solutions check
      const missingSolutions = puzzleElementsList.filter(({ el }) => {
        const puzData = el.puzzleData;
        return !puzData?.solution;
      });

      if (missingSolutions.length > 0) {
        issues.push({
          id: 'val-err-missing-puzzle-solutions',
          severity: 'error',
          category: 'puzzles',
          title: 'Missing Puzzle Solutions',
          message: `${missingSolutions.length} puzzle(s) are missing structured solution data, preventing valid answer keys from printing.`,
          pageIndex: missingSolutions[0].pageIndex,
          pageNumber: missingSolutions[0].pageNumber,
          fixSuggestion: 'Regenerate the puzzle or re-import the solution data.',
        });
      }
    }

    // ==========================================
    // 5. BOOK STRUCTURE & METADATA CHECKS
    // ==========================================

    // 5.1 Book Title Check
    const title = project.name || project.bookSettings?.metadata?.title || '';
    if (!title.trim() || title.trim().toLowerCase() === 'untitled' || title.trim().toLowerCase() === 'untitled book') {
      issues.push({
        id: 'val-err-title',
        severity: 'error',
        category: 'book',
        title: 'Missing Book Title',
        message: 'A distinct, descriptive book title is required for Amazon KDP catalog publishing.',
        fixSuggestion: 'Enter a clear, descriptive book title in Book Setup.',
      });
    }

    // 5.2 Author Name Check
    const author = project.metadata?.author || project.bookSettings?.metadata?.author || '';
    if (!author.trim()) {
      issues.push({
        id: 'val-warn-author',
        severity: 'warning',
        category: 'book',
        title: 'Author Name Not Specified',
        message: 'No author or publisher imprint name was specified. KDP requires an author/creator name for publication.',
        fixSuggestion: 'Add an author or publisher imprint name in Book Setup.',
      });
    }

    // 5.3 Page Numbering Sequence & Gaps
    if (pages.length > 1) {
      let hasPageNumberingIssue = false;
      const seenPageNumbers = new Set<number>();
      for (let i = 0; i < pages.length; i++) {
        const pNum = pages[i].pageNumber;
        if (pNum !== i + 1 || seenPageNumbers.has(pNum)) {
          hasPageNumberingIssue = true;
          break;
        }
        seenPageNumbers.add(pNum);
      }

      if (hasPageNumberingIssue) {
        issues.push({
          id: 'val-warn-page-numbering-sequence',
          severity: 'warning',
          category: 'book',
          title: 'Non-Sequential Page Numbers or Duplicate Indices',
          message: 'Interior page sequence numbers do not match physical page order.',
          fixSuggestion: 'Run Auto-Renumber to ensure consecutive page numbering 1...N.',
          canAutoFix: true,
          autoFixAction: 'renumber_pages',
        });
      }
    }

    // 5.4 Answer Key & Solution Integrity Checks
    const answerKeyMode = project.bookSettings?.answerKey?.mode || 'none';
    const answerKeyPages = pages.filter(p => p.isAnswerKey === true || p.pageType === 'answer_key');
    const normalPuzzlePages = pages.filter(p => !p.isAnswerKey && p.pageType !== 'answer_key' && (p.elements || []).some(el => el.type === 'puzzle'));

    if (answerKeyMode === 'none' && answerKeyPages.length > 0) {
      issues.push({
        id: 'val-warn-unexpected-answer-key-pages',
        severity: 'warning',
        category: 'book',
        title: 'Unexpected Solution Pages Present',
        message: `Book is set to Answer Key Mode 'None', but contains ${answerKeyPages.length} solution page(s).`,
        fixSuggestion: 'Remove leftover solution pages or update the Answer Key mode setting in Book Setup.',
      });
    } else if (answerKeyMode !== 'none' && normalPuzzlePages.length > 0 && answerKeyPages.length === 0) {
      issues.push({
        id: 'val-info-no-answer-key-pages',
        severity: 'info',
        category: 'book',
        title: 'No Dedicated Answer Key Pages Found',
        message: `This puzzle book is configured with solutions enabled (${answerKeyMode}), but no solution key pages were found.`,
        fixSuggestion: 'Regenerate the book with solution pages enabled.',
      });
    }

    // 5.5 State Leak Check: Normal puzzle pages must never have showSolution = true
    const leakedPuzzlePages = normalPuzzlePages.filter(p =>
      p.elements.some(el => el.type === 'puzzle' && el.previewData?.showSolution === true)
    );
    if (leakedPuzzlePages.length > 0) {
      issues.push({
        id: 'val-err-solution-on-puzzle-page',
        severity: 'error',
        category: 'puzzles',
        title: 'Solution Revealed on Normal Puzzle Page',
        message: `Found ${leakedPuzzlePages.length} puzzle page(s) (e.g. Page ${leakedPuzzlePages[0].pageNumber}) displaying solved answers instead of an unsolved puzzle grid.`,
        pageIndex: pages.findIndex(p => p.id === leakedPuzzlePages[0].id),
        pageNumber: leakedPuzzlePages[0].pageNumber,
        fixSuggestion: 'Turn off solution display for normal puzzle pages.',
      });
    }

    // 5.6 State Leak Check: Solution pages must never have showSolution = false
    const unrevealedSolutionPages = answerKeyPages.filter(p =>
      p.elements.some(el => el.type === 'puzzle' && el.previewData?.showSolution === false)
    );
    if (unrevealedSolutionPages.length > 0) {
      issues.push({
        id: 'val-warn-unsolved-answer-key',
        severity: 'warning',
        category: 'puzzles',
        title: 'Answer Key Page Without Solution Highlights',
        message: `Found ${unrevealedSolutionPages.length} solution page(s) (e.g. Page ${unrevealedSolutionPages[0].pageNumber}) where solution display is disabled.`,
        pageIndex: pages.findIndex(p => p.id === unrevealedSolutionPages[0].id),
        pageNumber: unrevealedSolutionPages[0].pageNumber,
        fixSuggestion: 'Ensure showSolution is enabled for all answer key pages.',
      });
    }

    // 5.7 Orphan Solution Check: Single-puzzle solution pages must point to an existing source puzzle
    const orphanSolutionPages = answerKeyPages.filter(p => {
      const sourceId = p.sourcePuzzleId || p.puzzleId;
      if (!sourceId) return false;
      return !pages.some(other => !other.isAnswerKey && other.pageType !== 'answer_key' && (other.puzzleId === sourceId || other.sourcePuzzleId === sourceId || other.elements.some(e => (e as any).sourcePuzzleId === sourceId || (e as any).puzzleData?.id === sourceId)));
    });
    if (orphanSolutionPages.length > 0) {
      issues.push({
        id: 'val-warn-orphan-solution-pages',
        severity: 'warning',
        category: 'puzzles',
        title: 'Orphan Solution Pages Detected',
        message: `${orphanSolutionPages.length} solution page(s) reference puzzle IDs that do not exist in the manuscript.`,
        fixSuggestion: 'Synchronize solution page references.',
      });
    }

    // Calculate Summary Counts
    const errorsCount = issues.filter(i => i.severity === 'error').length;
    const warningsCount = issues.filter(i => i.severity === 'warning').length;
    const infosCount = issues.filter(i => i.severity === 'info').length;

    let overallStatus: 'READY' | 'READY_WITH_WARNINGS' | 'NOT_READY' = 'READY';
    let statusText = 'Preflight passed based on the checks implemented by this application.';

    if (errorsCount > 0) {
      overallStatus = 'NOT_READY';
      statusText = `Manuscript has ${errorsCount} critical error(s) that must be resolved prior to KDP upload.`;
    } else if (warningsCount > 0) {
      overallStatus = 'READY_WITH_WARNINGS';
      statusText = 'Preflight passed with warnings. Review recommendations before printing.';
    }

    return {
      isValid: errorsCount === 0,
      hasErrors: errorsCount > 0,
      hasWarnings: warningsCount > 0,
      errorsCount,
      warningsCount,
      infosCount,
      passedCount: Math.max(0, 18 - issues.length),
      overallStatus,
      statusText,
      issues,
    };
  }

  /**
   * Applies deterministic automatic fixes for safe preflight issues
   */
  static applyAutoFix(
    action: string,
    project: Project,
    document?: DocumentModel | null
  ): { project: Project; document: DocumentModel } {
    const updatedProject = { ...project };
    const updatedDocument = document
      ? { ...document, pages: [...document.pages] }
      : { id: `doc-${Date.now()}`, projectId: project.id, pages: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };

    const totalPages = updatedDocument.pages.length;

    if (action === 'fix_gutter') {
      const recInside = calculateKdpInsideMargin(totalPages);
      updatedProject.kdpSettings = {
        ...updatedProject.kdpSettings,
        margins: {
          ...updatedProject.kdpSettings.margins,
          left: recInside,
        },
      };
    } else if (action === 'pad_even_pages') {
      if (totalPages % 2 !== 0) {
        const newPageNum = totalPages + 1;
        updatedDocument.pages.push({
          id: `page-${project.id}-notes-${Date.now()}`,
          pageNumber: newPageNum,
          pageType: 'custom',
          name: 'Notes',
          backgroundColor: '#FFFFFF',
          notes: 'End Matter - Notes & Sketches',
          elements: [
            {
              id: `el-notes-title-${Date.now()}`,
              type: 'text',
              name: 'Notes Heading',
              content: 'NOTES',
              x: 80,
              y: 60,
              width: 400,
              height: 30,
              rotation: 0,
              zIndex: 1,
              opacity: 1,
              fontFamily: 'Outfit',
              fontSize: 16,
              fontWeight: '700',
              textAlign: 'center',
              color: '#111827',
              letterSpacing: 2,
            },
            ...Array.from({ length: 18 }).map((_, r) => ({
              id: `el-note-line-${Date.now()}-${r}`,
              type: 'line' as const,
              name: `Rule ${r + 1}`,
              x: 60,
              y: 110 + r * 34,
              width: 440,
              height: 1,
              rotation: 0,
              zIndex: 2,
              opacity: 0.5,
              strokeColor: '#D1D5DB',
              strokeWidth: 1,
              dashPattern: 'solid' as const,
            })),
          ],
        });
        updatedProject.pageCount = updatedDocument.pages.length;
      }
    } else if (action === 'renumber_pages') {
      updatedDocument.pages = updatedDocument.pages.map((p, i) => ({
        ...p,
        pageNumber: i + 1,
      }));
    } else if (action === 'fix_puzzle_seeds') {
      const usedSeeds = new Set<number>();
      updatedDocument.pages = updatedDocument.pages.map(page => ({
        ...page,
        elements: page.elements.map(el => {
          if (el.type === 'puzzle') {
            const rawSeed = el.puzzleData?.seed;
            let seed: number = typeof rawSeed === 'number' ? rawSeed : Math.floor(Math.random() * 800000) + 10000;
            while (usedSeeds.has(seed)) {
              seed = Math.floor(Math.random() * 800000) + 10000;
            }
            usedSeeds.add(seed);
            return {
              ...el,
              puzzleData: el.puzzleData ? { ...el.puzzleData, seed } : el.puzzleData,
              previewData: el.previewData ? { ...el.previewData, seed } : el.previewData,
            };
          }
          return el;
        }),
      }));
    } else if (action === 'center_safe_area') {
      const trimW = (project.kdpSettings?.trimSize?.width || 8.5) * 96;
      const trimH = (project.kdpSettings?.trimSize?.height || 11) * 96;
      const safeMarginPx = Math.round(0.375 * 96);

      updatedDocument.pages = updatedDocument.pages.map(page => ({
        ...page,
        elements: page.elements.map(el => {
          if (el.locked) return el;
          let x = el.x;
          let y = el.y;
          let w = el.width;
          let h = el.height;

          if (w > trimW - 2 * safeMarginPx) {
            w = trimW - 2 * safeMarginPx;
          }
          if (h > trimH - 2 * safeMarginPx) {
            h = trimH - 2 * safeMarginPx;
          }

          if (x < safeMarginPx) x = safeMarginPx;
          if (y < safeMarginPx) y = safeMarginPx;
          if (x + w > trimW - safeMarginPx) x = trimW - safeMarginPx - w;
          if (y + h > trimH - safeMarginPx) y = trimH - safeMarginPx - h;

          return { ...el, x, y, width: w, height: h };
        }),
      }));
    }

    return { project: updatedProject, document: updatedDocument };
  }
}

import { PageModel, Project } from '../types/project';
import { PageNumberingSettings } from '../types/book';

/**
 * Service managing automatic page numbering across Editor Canvas, Spread View,
 * Thumbnails, and PDF Export.
 */
export class PageNumberingService {
  /**
   * Default Page Numbering Settings fallback
   */
  static getDefaultSettings(): PageNumberingSettings {
    return {
      enabled: true,
      startPageNumber: 1,
      startPageIndex: 0,
      frontMatterStyle: 'roman_lower',
      bodyStyle: 'arabic',
      position: 'bottom-center',
      fontSize: 16,
      fontFamily: 'Plus Jakarta Sans',
      hideOnFrontMatter: true,
    };
  }

  /**
   * Identifies whether a given page is classified as Front Matter
   */
  static isFrontMatter(page: PageModel, _pageIndex: number = 0): boolean {
    if (page.pageType) {
      return (
        page.pageType === 'title' ||
        page.pageType === 'copyright' ||
        page.pageType === 'instructions' ||
        page.pageType === 'toc' ||
        page.pageType === 'introduction' ||
        page.pageType === 'disclaimer'
      );
    }
    const nameLower = (page.name || '').toLowerCase();
    return (
      nameLower.includes('title') ||
      nameLower.includes('copyright') ||
      nameLower.includes('how to play') ||
      nameLower.includes('instructions') ||
      nameLower.includes('table of contents') ||
      nameLower.includes('toc')
    );
  }

  /**
   * Identifies whether a given page is a Solution / Answer Key page
   */
  static isSolutionPage(page: PageModel): boolean {
    return page.pageType === 'answer_key' || page.isAnswerKey === true;
  }

  /**
   * Determines whether page numbers should be displayed on this page
   */
  static shouldShowPageNumber(
    page: PageModel,
    pageIndex: number,
    project?: Project | null
  ): boolean {
    const numbering = project?.bookSettings?.numbering ?? this.getDefaultSettings();
    if (!numbering.enabled) {
      return false;
    }

    // Never show on covers or intentional blank filler pages
    if (page.isCover || page.pageType === 'blank') {
      return false;
    }

    // Solution pages are interior/back-matter and must ALWAYS display numbers when enabled
    if (this.isSolutionPage(page)) {
      return true;
    }

    const isFM = this.isFrontMatter(page, pageIndex);
    if (isFM && numbering.hideOnFrontMatter) {
      return false;
    }

    return true;
  }

  /**
   * Converts integer to Roman numeral string
   */
  static toRoman(num: number, lower = true): string {
    if (num <= 0) return '';
    const romanMap: [number, string][] = [
      [1000, 'M'],
      [900, 'CM'],
      [500, 'D'],
      [400, 'CD'],
      [100, 'C'],
      [90, 'XC'],
      [50, 'L'],
      [40, 'XL'],
      [10, 'X'],
      [9, 'IX'],
      [5, 'V'],
      [4, 'IV'],
      [1, 'I'],
    ];
    let result = '';
    let n = num;
    for (const [val, roman] of romanMap) {
      while (n >= val) {
        result += roman;
        n -= val;
      }
    }
    return lower ? result.toLowerCase() : result;
  }

  /**
   * Calculates the formatted page number string based on project numbering settings
   */
  static getFormattedPageNumber(
    page: PageModel,
    pageIndex: number,
    project?: Project | null
  ): string {
    const numbering = project?.bookSettings?.numbering ?? this.getDefaultSettings();
    const isFM = this.isFrontMatter(page, pageIndex);

    // Front matter pages with Roman numeral formatting
    if (isFM && !this.isSolutionPage(page)) {
      if (numbering.frontMatterStyle === 'roman_lower') {
        return this.toRoman(pageIndex + 1, true);
      }
      if (numbering.frontMatterStyle === 'roman_upper') {
        return this.toRoman(pageIndex + 1, false);
      }
      if (numbering.frontMatterStyle === 'none') {
        return '';
      }
    }

    const startNum = numbering.startPageNumber || 1;
    const rawPageNum = page.pageNumber || (pageIndex + 1);
    const displayNum = rawPageNum + (startNum - 1);

    const prefix = numbering.prefix || '';
    const suffix = numbering.suffix || '';
    return `${prefix}${displayNum}${suffix}`;
  }

  /**
   * Computes canvas screen coordinates and layout parameters (96 DPI)
   */
  static getPageNumberLayout(
    page: PageModel,
    pageIndex: number,
    project: Project | undefined | null,
    canvasWidthPx: number,
    canvasHeightPx: number
  ) {
    const numbering = project?.bookSettings?.numbering ?? this.getDefaultSettings();
    const margins = project?.kdpSettings?.margins || { top: 0.5, bottom: 0.5, left: 0.75, right: 0.5 };

    const pageNum = page.pageNumber || (pageIndex + 1);
    const isOdd = pageNum % 2 !== 0; // Odd = Recto (Right page), Even = Verso (Left page)

    const outsideMarginPx = Math.round((isOdd ? margins.right : margins.left) * 96);
    const topMarginPx = Math.round(margins.top * 96);
    const bottomMarginPx = Math.round(margins.bottom * 96);

    const fontSize = numbering.fontSize || 10;
    const fontFamily = numbering.fontFamily || 'Outfit, sans-serif';
    const position = numbering.position || 'bottom-center';

    let textAlign: 'left' | 'center' | 'right' = 'center';
    let x = 0;
    let y = 0;
    const boxWidth = 100;
    const boxHeight = 24;

    const isTop = position.startsWith('top');

    if (isTop) {
      y = Math.max(6, Math.round(topMarginPx / 2 - boxHeight / 2));
    } else {
      // Moved UP by ~0.25 inches (24px at 96 DPI) to place page number completely inside KDP safe margin
      const offset25InchesPx = 24;
      y = Math.round(canvasHeightPx - bottomMarginPx / 2 - offset25InchesPx - boxHeight / 2);
    }

    if (position === 'bottom-center' || position === 'top-center') {
      textAlign = 'center';
      x = Math.round(canvasWidthPx / 2 - boxWidth / 2);
    } else if (position === 'bottom-right') {
      textAlign = 'right';
      x = Math.round(canvasWidthPx - outsideMarginPx - boxWidth);
    } else if (position === 'bottom-outside' || position === 'top-outside') {
      if (!isOdd) {
        // Verso / Left page: outside is left
        textAlign = 'left';
        x = outsideMarginPx;
      } else {
        // Recto / Right page: outside is right
        textAlign = 'right';
        x = Math.round(canvasWidthPx - outsideMarginPx - boxWidth);
      }
    }

    return {
      text: this.getFormattedPageNumber(page, pageIndex, project),
      x,
      y,
      width: boxWidth,
      height: boxHeight,
      textAlign,
      fontSize,
      fontFamily,
      color: '#6B7280',
    };
  }

  /**
   * Computes PDF print layout parameters (72 pt / points)
   */
  static getPageNumberPdfLayout(
    page: PageModel,
    pageIndex: number,
    project: Project,
    trimWidthPt: number,
    trimHeightPt: number,
    bleedOffsetX: number,
    bleedOffsetY: number
  ) {
    const numbering = project.bookSettings?.numbering ?? this.getDefaultSettings();
    const margins = project.kdpSettings?.margins || { top: 0.5, bottom: 0.5, left: 0.75, right: 0.5 };

    const pageNum = page.pageNumber || (pageIndex + 1);
    const isOdd = pageNum % 2 !== 0;

    const outsideMarginPt = (isOdd ? margins.right : margins.left) * 72;
    const topMarginPt = margins.top * 72;
    const bottomMarginPt = margins.bottom * 72;

    const fontSizePt = Math.max(7, (numbering.fontSize || 10) * 0.75);
    const position = numbering.position || 'bottom-center';
    const isTop = position.startsWith('top');

    const offset25InchesPt = 0.25 * 72; // 18 pt (0.25 inches)

    const textY = isTop
      ? bleedOffsetY + topMarginPt / 2 + fontSizePt / 3
      : bleedOffsetY + trimHeightPt - (bottomMarginPt / 2 + offset25InchesPt) + fontSizePt / 3;

    let textX = bleedOffsetX + trimWidthPt / 2;
    let align: 'left' | 'center' | 'right' = 'center';

    if (position === 'bottom-center' || position === 'top-center') {
      textX = bleedOffsetX + trimWidthPt / 2;
      align = 'center';
    } else if (position === 'bottom-right') {
      textX = bleedOffsetX + trimWidthPt - outsideMarginPt;
      align = 'right';
    } else if (position === 'bottom-outside' || position === 'top-outside') {
      if (!isOdd) {
        textX = bleedOffsetX + outsideMarginPt;
        align = 'left';
      } else {
        textX = bleedOffsetX + trimWidthPt - outsideMarginPt;
        align = 'right';
      }
    }

    return {
      text: this.getFormattedPageNumber(page, pageIndex, project),
      textX,
      textY,
      align,
      fontSizePt,
      fontFamily: numbering.fontFamily || 'Outfit',
      color: '#6B7280',
    };
  }

  /**
   * Finds the original puzzle page corresponding to an answer key / solution page
   * Dynamically tracks changes when pages are reordered or moved.
   */
  static getOriginalPuzzlePage(
    solutionPage: PageModel,
    pages: PageModel[]
  ): { page: PageModel; index: number; pageNumber: number } | null {
    if (!pages || pages.length === 0) return null;

    // 1. Direct page-level sourcePuzzleId or puzzleId
    const targetPuzzleId = (solutionPage as any).sourcePuzzleId || solutionPage.puzzleId;
    if (targetPuzzleId) {
      const idx = pages.findIndex(
        p =>
          !this.isSolutionPage(p) &&
          (p.puzzleId === targetPuzzleId ||
            (p as any).sourcePuzzleId === targetPuzzleId ||
            (p.elements || []).some(
              el => el.type === 'puzzle' && ((el as any).puzzleData?.id === targetPuzzleId || el.id === targetPuzzleId)
            ))
      );
      if (idx !== -1) {
        return { page: pages[idx], index: idx, pageNumber: pages[idx].pageNumber || idx + 1 };
      }
    }

    // 2. Search by puzzle element's ID or puzzleData inside solutionPage
    const solPuzzleEl = (solutionPage.elements || []).find(el => el.type === 'puzzle') as any;
    const solPuzzleDataId = solPuzzleEl?.puzzleData?.id || solPuzzleEl?.sourcePuzzleId;
    const solSeed = solPuzzleEl?.puzzleData?.settings?.seed ?? solPuzzleEl?.puzzleData?.seed;
    const solTitle = solPuzzleEl?.puzzleData?.title || solPuzzleEl?.title;

    if (solPuzzleDataId || solSeed !== undefined || solTitle) {
      const idx = pages.findIndex(p => {
        if (this.isSolutionPage(p) || p.id === solutionPage.id) return false;
        return (p.elements || []).some(el => {
          if (el.type !== 'puzzle') return false;
          const pz = el as any;
          if (solPuzzleDataId && (pz.puzzleData?.id === solPuzzleDataId || pz.id === solPuzzleDataId)) return true;
          if (
            solSeed !== undefined &&
            (pz.puzzleData?.settings?.seed === solSeed || pz.puzzleData?.seed === solSeed)
          ) {
            return true;
          }
          if (solTitle && (pz.puzzleData?.title === solTitle || pz.title === solTitle)) return true;
          return false;
        });
      });
      if (idx !== -1) {
        return { page: pages[idx], index: idx, pageNumber: pages[idx].pageNumber || idx + 1 };
      }
    }

    // 3. Fallback: Ordinal position matching (e.g. 1st solution corresponds to 1st puzzle)
    const allSolutionPages = pages.filter(p => this.isSolutionPage(p));
    const solOrdinal = allSolutionPages.findIndex(p => p.id === solutionPage.id);
    const allPuzzlePages = pages.filter(
      p =>
        !this.isSolutionPage(p) &&
        !this.isFrontMatter(p) &&
        !p.isCover &&
        (p.elements || []).some(el => el.type === 'puzzle')
    );

    if (solOrdinal >= 0 && solOrdinal < allPuzzlePages.length) {
      const targetPage = allPuzzlePages[solOrdinal];
      const targetIndex = pages.findIndex(p => p.id === targetPage.id);
      return {
        page: targetPage,
        index: targetIndex !== -1 ? targetIndex : solOrdinal,
        pageNumber: targetPage.pageNumber || (targetIndex !== -1 ? targetIndex + 1 : solOrdinal + 1),
      };
    }

    return null;
  }

  /**
   * Generates dynamic solution heading referencing the original puzzle's current manuscript page number.
   * Format: "Solution — Page 15" (or "Solution — Page {X}")
   */
  static getSolutionPageHeading(
    solutionPage: PageModel,
    pages: PageModel[],
    project?: Project | null
  ): string {
    const orig = this.getOriginalPuzzlePage(solutionPage, pages);
    if (orig) {
      const formattedNum = this.getFormattedPageNumber(orig.page, orig.index, project);
      return `Solution — Page ${formattedNum || orig.pageNumber}`;
    }
    return 'Solution Key';
  }
}

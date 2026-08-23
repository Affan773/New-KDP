import { DEFAULT_PUZZLE_STYLE } from '../puzzles/renderers/PuzzleRenderer';
import { GeneratedPuzzle, PuzzleType } from '../puzzles/types';
import {
  BookMetadata,
  BookSection,
  BookTheme,
  FrontMatterConfig,
  HeaderFooterSettings,
  PageNumberingSettings,
} from '../types/book';
import { CanvasElement, PageModel, TrimSize } from '../types/project';
import { InstructionsService } from './instructionsService';

export interface PageCompositionOptions {
  projectId: string;
  trimSize: TrimSize;
  bleed: 'No Bleed' | 'Bleed';
  theme: BookTheme;
  metadata: BookMetadata;
  sections: BookSection[];
  puzzlesPerPage: 1 | 2 | 4;
  headerFooter: HeaderFooterSettings;
  numbering: PageNumberingSettings;
}

export class PageCompositionEngine {
  /**
   * Calculates dimensions and margins in pixels (at standard 96 DPI screen preview)
   */
  static getPageBounds(trimSize: TrimSize, bleed: 'No Bleed' | 'Bleed', pageNumber?: number) {
    const isBleed = bleed === 'Bleed';
    const widthInches = isBleed ? trimSize.width + 0.125 : trimSize.width;
    const heightInches = isBleed ? trimSize.height + 0.25 : trimSize.height;

    const widthPx = Math.round(widthInches * 96);
    const heightPx = Math.round(heightInches * 96);

    const marginTopPx = Math.round(0.5 * 96);
    // Increase bottom margin to 0.625" (60px) for generous bottom clearance under puzzles
    const marginBottomPx = Math.round(0.625 * 96);
    const marginInsidePx = Math.round(0.75 * 96); // Inside Gutter
    const marginOutsidePx = Math.round(0.5 * 96); // Outside Margin

    // Mirrored Margins: Even pages (Verso / Left) have gutter on the right; Odd pages (Recto / Right) have gutter on the left
    const isEvenPage = typeof pageNumber === 'number' && pageNumber % 2 === 0;
    const leftMarginPx = isEvenPage ? marginOutsidePx : marginInsidePx;
    const rightMarginPx = isEvenPage ? marginInsidePx : marginOutsidePx;

    const contentWidth = widthPx - marginInsidePx - marginOutsidePx;
    const contentHeight = heightPx - marginTopPx - marginBottomPx;

    return {
      widthPx,
      heightPx,
      marginTopPx,
      marginBottomPx,
      marginInsidePx,
      marginOutsidePx,
      leftMarginPx,
      rightMarginPx,
      contentWidth,
      contentHeight,
    };
  }

  /**
   * Composes Title Page
   */
  static composeTitlePage(
    projectId: string,
    pageNumber: number,
    metadata: BookMetadata,
    theme: BookTheme,
    bounds: ReturnType<typeof PageCompositionEngine.getPageBounds>
  ): PageModel {
    const elements: CanvasElement[] = [];
    const centerX = bounds.marginInsidePx;
    const contentW = bounds.contentWidth;

    // Main Title
    elements.push({
      id: `el-title-${Date.now()}`,
      type: 'text',
      name: 'Book Title',
      content: (metadata.title || 'UNTITLED BOOK').toUpperCase(),
      x: centerX,
      y: Math.round(bounds.heightPx * 0.28),
      width: contentW,
      height: 90,
      rotation: 0,
      zIndex: 1,
      opacity: 1,
      fontFamily: theme.fontHeading,
      fontSize: Math.min(32, theme.headingSize + 8),
      fontWeight: '800',
      textAlign: 'center',
      color: theme.primaryColor,
      lineHeight: 1.15,
      letterSpacing: 2,
    });

    // Subtitle
    if (metadata.subtitle) {
      elements.push({
        id: `el-subtitle-${Date.now()}`,
        type: 'text',
        name: 'Book Subtitle',
        content: metadata.subtitle,
        x: centerX,
        y: Math.round(bounds.heightPx * 0.42),
        width: contentW,
        height: 48,
        rotation: 0,
        zIndex: 2,
        opacity: 1,
        fontFamily: theme.fontBody,
        fontSize: Math.min(16, theme.bodySize + 2),
        fontWeight: '500',
        textAlign: 'center',
        color: theme.secondaryColor,
        lineHeight: 1.3,
        letterSpacing: 0.5,
      });
    }

    // Decorative Rule
    elements.push({
      id: `el-title-rule-${Date.now()}`,
      type: 'line',
      name: 'Title Divider',
      x: Math.round(bounds.widthPx / 2 - 60),
      y: Math.round(bounds.heightPx * 0.52),
      width: 120,
      height: 2,
      rotation: 0,
      zIndex: 3,
      opacity: 0.8,
      strokeColor: theme.borderColor,
      strokeWidth: theme.borderWidth || 1.5,
      lineStyle: 'solid',
    });

    // Author
    elements.push({
      id: `el-author-${Date.now()}`,
      type: 'text',
      name: 'Author Name',
      content: (metadata.author || 'Author Name').toUpperCase(),
      x: centerX,
      y: Math.round(bounds.heightPx * 0.65),
      width: contentW,
      height: 40,
      rotation: 0,
      zIndex: 4,
      opacity: 1,
      fontFamily: theme.fontHeading,
      fontSize: 16,
      fontWeight: '700',
      textAlign: 'center',
      color: theme.primaryColor,
      letterSpacing: 1.5,
      lineHeight: 1.2,
    });

    // Publisher / Imprint
    if (metadata.publisher) {
      elements.push({
        id: `el-publisher-${Date.now()}`,
        type: 'text',
        name: 'Publisher Imprint',
        content: metadata.publisher,
        x: centerX,
        y: Math.round(bounds.heightPx * 0.82),
        width: contentW,
        height: 30,
        rotation: 0,
        zIndex: 5,
        opacity: 1,
        fontFamily: theme.fontBody,
        fontSize: 12,
        fontWeight: '500',
        textAlign: 'center',
        color: theme.secondaryColor,
        letterSpacing: 1,
        lineHeight: 1.2,
      });
    }

    return {
      id: `page-${projectId}-title`,
      pageNumber,
      pageType: 'title',
      name: 'Title Page',
      backgroundColor: '#FFFFFF',
      elements,
      notes: 'Front Matter - Main Title Page',
    };
  }

  /**
   * Composes Copyright Page with editable placeholders
   */
  static composeCopyrightPage(
    projectId: string,
    pageNumber: number,
    metadata: BookMetadata,
    theme: BookTheme,
    bounds: ReturnType<typeof PageCompositionEngine.getPageBounds>
  ): PageModel {
    const elements: CanvasElement[] = [];
    const centerX = bounds.marginInsidePx;
    const contentW = bounds.contentWidth;
    const year = metadata.copyrightYear || new Date().getFullYear().toString();
    const author = metadata.author || '[AUTHOR NAME]';
    const publisher = metadata.publisher || '[PUBLISHER / IMPRINT]';

    const copyrightText = `${metadata.title || 'Untitled Book'}
Copyright © ${year} by ${author}.
All rights reserved.

No part of this publication may be reproduced, distributed, or transmitted in any form or by any means, including photocopying, recording, or other electronic or mechanical methods, without prior written permission from the publisher, except in the case of brief quotations embodied in critical reviews.

Published by: ${publisher}
${metadata.edition ? `Edition: ${metadata.edition}` : 'First Edition'}
${metadata.isbn ? `ISBN: ${metadata.isbn}` : 'ISBN: [ENTER ISBN IF APPLICABLE]'}

Printed for Amazon KDP Print on Demand.`;

    elements.push({
      id: `el-copy-text-${Date.now()}`,
      type: 'text',
      name: 'Copyright Notice',
      content: copyrightText,
      x: centerX + 20,
      y: Math.round(bounds.heightPx * 0.45),
      width: contentW - 40,
      height: 280,
      rotation: 0,
      zIndex: 1,
      opacity: 1,
      fontFamily: theme.fontBody,
      fontSize: 11,
      fontWeight: '400',
      textAlign: 'left',
      color: theme.secondaryColor,
      lineHeight: 1.6,
      letterSpacing: 0.2,
    });

    return {
      id: `page-${projectId}-copyright`,
      pageNumber,
      pageType: 'copyright',
      name: 'Copyright Page',
      backgroundColor: '#FFFFFF',
      elements,
      notes: 'Front Matter - Legal & Copyright Notice',
    };
  }

  /**
   * Composes Table of Contents Page
   */
  static composeTocPage(
    projectId: string,
    pageNumber: number,
    title: string,
    entries: { label: string; pageNumber: number }[],
    theme: BookTheme,
    bounds: ReturnType<typeof PageCompositionEngine.getPageBounds>
  ): PageModel {
    const elements: CanvasElement[] = [];
    const centerX = bounds.marginInsidePx;
    const contentW = bounds.contentWidth;

    elements.push({
      id: `el-toc-header-${Date.now()}`,
      type: 'text',
      name: 'Table of Contents Header',
      content: 'TABLE OF CONTENTS',
      x: centerX,
      y: 60,
      width: contentW,
      height: 40,
      rotation: 0,
      zIndex: 1,
      opacity: 1,
      fontFamily: theme.fontHeading,
      fontSize: Math.min(22, theme.headingSize),
      fontWeight: '800',
      textAlign: 'center',
      color: theme.primaryColor,
      letterSpacing: 1.5,
      lineHeight: 1.2,
    });

    const tocContent =
      entries.length > 0
        ? entries.map(e => `${e.label.padEnd(36, '.')} Page ${e.pageNumber}`).join('\n\n')
        : `• Puzzles & Challenges ..................... Page 2\n\n• Solutions & Answer Keys .................. Back of Book`;

    elements.push({
      id: `el-toc-content-${Date.now()}`,
      type: 'text',
      name: 'TOC List',
      content: tocContent,
      x: centerX + 20,
      y: 120,
      width: contentW - 40,
      height: 350,
      rotation: 0,
      zIndex: 2,
      opacity: 1,
      fontFamily: theme.fontBody,
      fontSize: 12,
      fontWeight: '500',
      textAlign: 'left',
      color: theme.primaryColor,
      lineHeight: 1.8,
    });

    return {
      id: `page-${projectId}-toc`,
      pageNumber,
      pageType: 'toc',
      name: 'Table of Contents',
      backgroundColor: '#FFFFFF',
      elements,
      notes: 'Front Matter - Table of Contents',
    };
  }

  /**
   * Composes Disclaimer Page
   */
  static composeDisclaimerPage(
    projectId: string,
    pageNumber: number,
    metadata: BookMetadata,
    theme: BookTheme,
    bounds: ReturnType<typeof PageCompositionEngine.getPageBounds>
  ): PageModel {
    const elements: CanvasElement[] = [];
    const centerX = bounds.marginInsidePx;
    const contentW = bounds.contentWidth;

    elements.push({
      id: `el-disc-header-${Date.now()}`,
      type: 'text',
      name: 'Disclaimer Header',
      content: 'DISCLAIMER & NOTICE',
      x: centerX,
      y: 80,
      width: contentW,
      height: 40,
      rotation: 0,
      zIndex: 1,
      opacity: 1,
      fontFamily: theme.fontHeading,
      fontSize: 18,
      fontWeight: '800',
      textAlign: 'center',
      color: theme.primaryColor,
      letterSpacing: 1.5,
      lineHeight: 1.2,
    });

    const disclaimerText =
      metadata.disclaimer ||
      `This book is created for entertainment, puzzle solving, and educational purposes. All puzzle designs and layouts are curated for high-quality printing. While every effort is made to ensure accurate solutions, minor typographical variations may occur.`;

    elements.push({
      id: `el-disc-body-${Date.now()}`,
      type: 'text',
      name: 'Disclaimer Content',
      content: disclaimerText,
      x: centerX + 20,
      y: 150,
      width: contentW - 40,
      height: 250,
      rotation: 0,
      zIndex: 2,
      opacity: 1,
      fontFamily: theme.fontBody,
      fontSize: 11,
      fontWeight: '400',
      textAlign: 'left',
      color: theme.secondaryColor,
      lineHeight: 1.6,
    });

    return {
      id: `page-${projectId}-disclaimer`,
      pageNumber,
      pageType: 'disclaimer',
      name: 'Disclaimer Page',
      backgroundColor: '#FFFFFF',
      elements,
      notes: 'Front Matter - Disclaimer',
    };
  }

  /**
   * Composes Instructions Page for puzzle types
   */
  static composeInstructionsPage(
    projectId: string,
    pageNumber: number,
    puzzleTypes: PuzzleType[],
    theme: BookTheme,
    bounds: ReturnType<typeof PageCompositionEngine.getPageBounds>
  ): PageModel {
    const elements: CanvasElement[] = [];
    const centerX = bounds.marginInsidePx;
    const contentW = bounds.contentWidth;

    elements.push({
      id: `el-inst-header-${Date.now()}`,
      type: 'text',
      name: 'Instructions Header',
      content: 'HOW TO SOLVE THE PUZZLES',
      x: centerX,
      y: 60,
      width: contentW,
      height: 40,
      rotation: 0,
      zIndex: 1,
      opacity: 1,
      fontFamily: theme.fontHeading,
      fontSize: Math.min(22, theme.headingSize),
      fontWeight: '800',
      textAlign: 'center',
      color: theme.primaryColor,
      letterSpacing: 1.5,
      lineHeight: 1.2,
    });

    const instructionsList = InstructionsService.getInstructionsForTypes(puzzleTypes);
    let currentY = 115;

    instructionsList.forEach((inst, idx) => {
      if (currentY + 120 > bounds.heightPx - 70) return;

      elements.push({
        id: `el-inst-sec-${idx}-${Date.now()}`,
        type: 'text',
        name: `Instruction Block: ${inst.title}`,
        content: `▶ ${inst.title.toUpperCase()}\n${inst.summary}\n\n• ${inst.steps.join('\n• ')}`,
        x: centerX + 10,
        y: currentY,
        width: contentW - 20,
        height: 120,
        rotation: 0,
        zIndex: idx + 2,
        opacity: 1,
        fontFamily: theme.fontBody,
        fontSize: 11,
        fontWeight: '400',
        textAlign: 'left',
        color: theme.primaryColor,
        lineHeight: 1.45,
      });

      currentY += 135;
    });

    return {
      id: `page-${projectId}-instructions`,
      pageNumber,
      pageType: 'instructions',
      name: 'How to Play',
      backgroundColor: '#FFFFFF',
      elements,
      notes: 'Front Matter - Game Rules & Tips',
    };
  }

  /**
   * Composes a Puzzle Page with 1, 2, or 4 puzzles per page
   */
  static composePuzzlePage(
    projectId: string,
    pageNumber: number,
    pagePuzzles: GeneratedPuzzle[],
    puzzlesPerPage: 1 | 2 | 4,
    theme: BookTheme,
    section: BookSection | undefined,
    bounds: ReturnType<typeof PageCompositionEngine.getPageBounds>
  ): PageModel {
    const elements: CanvasElement[] = [];
    const { marginTopPx, contentWidth, contentHeight } = bounds;
    const startX = bounds.leftMarginPx !== undefined ? bounds.leftMarginPx : bounds.marginInsidePx;

    // Helper to calculate layout slots
    const getSlots = () => {
      if (puzzlesPerPage === 1) {
        return [
          {
            x: startX,
            y: marginTopPx + 15,
            width: contentWidth,
            height: contentHeight - 20,
          },
        ];
      } else if (puzzlesPerPage === 2) {
        const slotH = Math.floor((contentHeight - 40) / 2);
        return [
          {
            x: startX,
            y: marginTopPx + 10,
            width: contentWidth,
            height: slotH,
          },
          {
            x: startX,
            y: marginTopPx + slotH + 30,
            width: contentWidth,
            height: slotH,
          },
        ];
      } else {
        // 4 per page
        const slotW = Math.floor((contentWidth - 20) / 2);
        const slotH = Math.floor((contentHeight - 40) / 2);
        return [
          { x: startX, y: marginTopPx + 10, width: slotW, height: slotH },
          { x: startX + slotW + 20, y: marginTopPx + 10, width: slotW, height: slotH },
          { x: startX, y: marginTopPx + slotH + 30, width: slotW, height: slotH },
          { x: startX + slotW + 20, y: marginTopPx + slotH + 30, width: slotW, height: slotH },
        ];
      }
    };

    const slots = getSlots();

    pagePuzzles.forEach((puzzle, idx) => {
      const slot = slots[idx];
      if (!slot) return;

      const elementId = `el-puz-${pageNumber}-${idx + 1}`;

      elements.push({
        id: elementId,
        type: 'puzzle',
        name: puzzle.title || `Puzzle #${puzzle.settings?.puzzleNumber || pageNumber}`,
        x: slot.x,
        y: slot.y,
        width: slot.width,
        height: slot.height,
        rotation: 0,
        zIndex: idx + 1,
        opacity: 1,
        locked: false,
        aspectRatioLocked: false,
        puzzleType: puzzle.type,
        difficulty: puzzle.difficulty,
        title: puzzle.title,
        puzzleData: puzzle as any,
        sourcePuzzleId: puzzle.id,
        sourcePuzzlePageId: `page-${projectId}-${pageNumber}`,
        sourcePuzzleElementId: elementId,
        previewData: {
          ...DEFAULT_PUZZLE_STYLE,
          fontFamily: theme.fontBody,
          gridBorderColor: theme.borderColor,
          showSolution: false,
        },
      });
    });

    return {
      id: `page-${projectId}-${pageNumber}`,
      pageNumber,
      pageType: 'puzzle',
      isAnswerKey: false,
      puzzleId: pagePuzzles[0]?.id,
      sourcePuzzleId: pagePuzzles[0]?.id,
      sectionId: section?.id,
      name: `Puzzle Page ${pageNumber}`,
      backgroundColor: '#FFFFFF',
      elements,
      notes: section ? `Section: ${section.title}` : `Interior Puzzle Page ${pageNumber}`,
    };
  }

  /**
   * Composes an Answer Key / Solutions Page (1-up full page for word search or multi-up compact layout)
   */
  static composeAnswerKeyPage(
    projectId: string,
    pageNumber: number,
    solutionPuzzles: GeneratedPuzzle[],
    theme: BookTheme,
    bounds: ReturnType<typeof PageCompositionEngine.getPageBounds>,
    originalPageNumber?: number,
    sourcePageId?: string,
    sourceElementId?: string
  ): PageModel {
    const elements: CanvasElement[] = [];
    const { marginInsidePx, marginTopPx, contentWidth, contentHeight } = bounds;

    const isSingleSolution = solutionPuzzles.length === 1;
    const singlePuzzle = solutionPuzzles[0];
    const headerTitle = isSingleSolution && originalPageNumber
      ? `Solution — Page ${originalPageNumber}`
      : isSingleSolution
      ? 'Solution Key'
      : 'SOLUTIONS & ANSWER KEYS';

    // Header for solution page
    elements.push({
      id: `el-sol-heading-${Date.now()}-${pageNumber}`,
      type: 'text',
      name: 'Solutions Header',
      content: headerTitle,
      x: marginInsidePx,
      y: marginTopPx - 10,
      width: contentWidth,
      height: 30,
      rotation: 0,
      zIndex: 1,
      opacity: 1,
      fontFamily: theme.fontHeading,
      fontSize: 16,
      fontWeight: '800',
      textAlign: 'center',
      color: theme.primaryColor,
      letterSpacing: 1.5,
      lineHeight: 1.2,
    });

    // Calculate dynamic layout slots
    const count = Math.max(1, solutionPuzzles.length);
    let cols = 2;
    let rows = 2;
    let gridFontSize = 9;
    let titleFontSize = 11;
    let clueFontSize = 8;

    if (count === 1) {
      cols = 1;
      rows = 1;
      gridFontSize = 14;
      titleFontSize = 16;
      clueFontSize = 11;
    } else if (count === 2) {
      cols = 1;
      rows = 2;
      gridFontSize = 11;
      titleFontSize = 13;
      clueFontSize = 9;
    } else if (count <= 4) {
      cols = 2;
      rows = 2;
      gridFontSize = 9;
      titleFontSize = 11;
      clueFontSize = 8;
    } else if (count <= 6) {
      cols = 2;
      rows = 3;
      gridFontSize = 8;
      titleFontSize = 10;
      clueFontSize = 7;
    } else if (count <= 9) {
      cols = 3;
      rows = 3;
      gridFontSize = 7;
      titleFontSize = 9;
      clueFontSize = 6;
    } else {
      cols = Math.ceil(Math.sqrt(count));
      rows = Math.ceil(count / cols);
      gridFontSize = 6;
      titleFontSize = 8;
      clueFontSize = 5;
    }

    const gapX = cols > 1 ? 14 : 0;
    const gapY = rows > 1 ? 16 : 0;
    const totalGapsX = (cols - 1) * gapX;
    const totalGapsY = (rows - 1) * gapY;
    const availableW = contentWidth - totalGapsX;
    const availableH = contentHeight - 40 - totalGapsY;

    const slotW = Math.max(20, Math.floor(availableW / cols));
    const slotH = Math.max(20, Math.floor(availableH / rows));

    const slots: { x: number; y: number; width: number; height: number }[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        slots.push({
          x: marginInsidePx + c * (slotW + gapX),
          y: marginTopPx + 30 + r * (slotH + gapY),
          width: slotW,
          height: slotH,
        });
      }
    }

    solutionPuzzles.forEach((puzzle, idx) => {
      const slot = slots[idx];
      if (!slot) return;

      const puzTitle = isSingleSolution && originalPageNumber
        ? `Solution — Page ${originalPageNumber}`
        : `Solution: ${puzzle.title}`;

      elements.push({
        id: `el-sol-puz-${pageNumber}-${idx + 1}`,
        type: 'puzzle',
        name: `Solution: ${puzzle.title}`,
        x: slot.x,
        y: slot.y,
        width: slot.width,
        height: slot.height,
        rotation: 0,
        zIndex: idx + 2,
        opacity: 1,
        locked: false,
        aspectRatioLocked: false,
        puzzleType: puzzle.type,
        difficulty: puzzle.difficulty,
        title: puzTitle,
        puzzleData: puzzle as any,
        sourcePuzzleId: puzzle.id,
        sourcePuzzlePageId: sourcePageId,
        sourcePuzzleElementId: sourceElementId,
        previewData: {
          ...DEFAULT_PUZZLE_STYLE,
          fontFamily: theme.fontBody,
          showSolution: true,
          showWordBank: false,
          gridFontSize,
          titleFontSize,
          clueFontSize,
        },
      });
    });

    const pageName = isSingleSolution && originalPageNumber
      ? `Solution — Page ${originalPageNumber}`
      : isSingleSolution && singlePuzzle?.title
      ? `Solution: ${singlePuzzle.title}`
      : `Answer Keys (P.${pageNumber})`;

    return {
      id: `page-${projectId}-sol-${pageNumber}`,
      pageNumber,
      pageType: 'answer_key',
      isAnswerKey: true,
      sourcePuzzleId: singlePuzzle?.id,
      puzzleId: singlePuzzle?.id,
      sourcePuzzlePageId: sourcePageId,
      sourcePuzzleElementId: sourceElementId,
      name: pageName,
      backgroundColor: '#FFFFFF',
      elements,
      notes: isSingleSolution && originalPageNumber
        ? `Dedicated Solution for Puzzle on Page ${originalPageNumber}`
        : 'Back Matter - Puzzle Solutions Key',
    };
  }
}

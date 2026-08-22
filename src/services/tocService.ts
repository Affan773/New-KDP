import { CanvasElement, DocumentModel, PageModel } from '../types/project';
import { BookSection, BookTheme } from '../types/book';

export interface TocEntry {
  title: string;
  pageNumber: number;
  type: 'front_matter' | 'section' | 'answer_key' | 'content';
}

export class TocService {
  /**
   * Computes the list of entries for the Table of Contents based on document structure and sections
   */
  static generateEntries(document: DocumentModel, sections: BookSection[] = []): TocEntry[] {
    const entries: TocEntry[] = [];
    const sectionMap = new Map<string, BookSection>(sections.map(s => [s.id, s]));

    // Find first occurrences of sections
    const seenSections = new Set<string>();

    document.pages.forEach((page, index) => {
      const pageNum = page.pageNumber || index + 1;

      if (page.pageType === 'instructions' && !entries.some(e => e.title.includes('Instructions'))) {
        entries.push({
          title: 'How to Play & Instructions',
          pageNumber: pageNum,
          type: 'front_matter',
        });
      } else if (page.sectionId && !seenSections.has(page.sectionId)) {
        seenSections.add(page.sectionId);
        const sec = sectionMap.get(page.sectionId);
        if (sec) {
          entries.push({
            title: sec.title || `Section ${sec.order + 1}`,
            pageNumber: pageNum,
            type: 'section',
          });
        }
      } else if (page.isAnswerKey && !entries.some(e => e.type === 'answer_key')) {
        entries.push({
          title: 'Solutions & Answer Keys',
          pageNumber: pageNum,
          type: 'answer_key',
        });
      }
    });

    return entries;
  }

  /**
   * Composes editable CanvasElements for a Table of Contents page
   */
  static composeTocElements(
    entries: TocEntry[],
    canvasWidth: number,
    canvasHeight: number,
    theme: BookTheme
  ): CanvasElement[] {
    const elements: CanvasElement[] = [];
    const marginX = 60;
    const contentWidth = canvasWidth - marginX * 2;

    // TOC Header Title
    elements.push({
      id: `el-toc-title-${Date.now()}`,
      type: 'text',
      name: 'Table of Contents Heading',
      content: 'TABLE OF CONTENTS',
      x: marginX,
      y: 70,
      width: contentWidth,
      height: 44,
      rotation: 0,
      zIndex: 1,
      opacity: 1,
      fontFamily: theme.fontHeading,
      fontSize: Math.min(26, theme.headingSize + 2),
      fontWeight: '800',
      textAlign: 'center',
      color: theme.primaryColor,
      letterSpacing: 2,
      lineHeight: 1.2,
    });

    // Decorative divider line under title
    elements.push({
      id: `el-toc-divider-${Date.now()}`,
      type: 'line',
      name: 'TOC Heading Divider',
      x: Math.round(canvasWidth / 2 - 80),
      y: 125,
      width: 160,
      height: 3,
      rotation: 0,
      zIndex: 2,
      opacity: 1,
      strokeColor: theme.borderColor || '#E5E7EB',
      strokeWidth: 2,
      lineStyle: 'solid',
    });

    const startY = 160;
    const rowHeight = 36;

    entries.forEach((entry, index) => {
      const rowY = startY + index * rowHeight;
      if (rowY + rowHeight > canvasHeight - 80) return; // Prevent overflow

      // Section / Entry Title (Left)
      elements.push({
        id: `el-toc-item-${index}-${Date.now()}`,
        type: 'text',
        name: `TOC Entry: ${entry.title}`,
        content: entry.title,
        x: marginX,
        y: rowY,
        width: Math.round(contentWidth * 0.75),
        height: 28,
        rotation: 0,
        zIndex: index + 3,
        opacity: 1,
        fontFamily: theme.fontBody,
        fontSize: entry.type === 'section' ? 15 : 14,
        fontWeight: entry.type === 'section' ? '700' : '500',
        textAlign: 'left',
        color: theme.primaryColor,
        lineHeight: 1.2,
      });

      // Page number (Right)
      elements.push({
        id: `el-toc-page-${index}-${Date.now()}`,
        type: 'text',
        name: `TOC Page ${entry.pageNumber}`,
        content: String(entry.pageNumber),
        x: canvasWidth - marginX - 60,
        y: rowY,
        width: 60,
        height: 28,
        rotation: 0,
        zIndex: index + 3,
        opacity: 1,
        fontFamily: theme.fontHeading,
        fontSize: 14,
        fontWeight: '700',
        textAlign: 'right',
        color: theme.secondaryColor,
        lineHeight: 1.2,
      });

      // Dotted leader line between item and page number
      elements.push({
        id: `el-toc-dots-${index}-${Date.now()}`,
        type: 'line',
        name: `TOC Dots ${index + 1}`,
        x: marginX + Math.round(contentWidth * 0.72),
        y: rowY + 14,
        width: Math.round(contentWidth * 0.16),
        height: 2,
        rotation: 0,
        zIndex: 2,
        opacity: 0.7,
        strokeColor: theme.borderColor,
        strokeWidth: 1.5,
        lineStyle: 'dotted',
        dashPattern: 'dotted',
      });
    });

    return elements;
  }
}

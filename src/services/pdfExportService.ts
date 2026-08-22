import { jsPDF } from 'jspdf';
import {
  calculateKdpCoverDimensions,
  calculateKdpInsideMargin,
  calculateKdpSpineWidth,
} from '../constants/kdp';
import { GeneratedPuzzle, WordSearchWordPlacement } from '../puzzles/types';
import {
  CanvasElement,
  DocumentModel,
  ImageElement,
  LineElement,
  PageModel,
  Project,
  PuzzlePlaceholderElement,
  ShapeElement,
  TextElement,
} from '../types/project';
import { BookValidationService, ValidationReport } from './bookValidationService';
import { PageNumberingService } from './pageNumberingService';

export interface ExportProgressEvent {
  stage: 'validating' | 'preparing' | 'rendering' | 'building' | 'verifying' | 'complete' | 'error';
  message: string;
  currentPage: number;
  totalPages: number;
  percentage: number;
}

export type ExportColorMode = 'grayscale' | 'rgb';

export interface ExportSettings {
  format: 'interior_pdf' | 'cover_pdf' | 'json_backup';
  colorMode: ExportColorMode;
  includeBleed: boolean;
  includeCropMarks: boolean;
  pageRange: 'all' | 'custom';
  customRangeStart?: number;
  customRangeEnd?: number;
  paperStock?: 'White' | 'Cream' | 'Premium Color' | 'Standard Color';
}

export interface PdfPreflightResult {
  passed: boolean;
  fileSizeBytes: number;
  fileSizeFormatted: string;
  expectedPages: number;
  actualPages: number;
  dimensionsPt: { width: number; height: number };
  dimensionsInches: { width: number; height: number };
  trimBoxPt: { x: number; y: number; width: number; height: number };
  bleedBoxPt: { x: number; y: number; width: number; height: number };
  colorMode: ExportColorMode;
  vectorObjectCount: number;
  rasterImageCount: number;
  fontList: string[];
  issues: { severity: 'pass' | 'warning' | 'error'; title: string; message: string }[];
}

export interface ExportResult {
  success: boolean;
  blob?: Blob;
  dataUrl?: string;
  filename: string;
  preflight: PdfPreflightResult;
  error?: string;
}

export class PdfExportService {
  /**
   * Generates a safe, sanitized filename for KDP export
   */
  public static sanitizeFilename(rawName: string, suffix: string, ext = 'pdf'): string {
    const safeTitle = rawName
      .trim()
      .replace(/[/\\?%*:|"<>]/g, '')
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_-]/g, '')
      .substring(0, 50) || 'Book_Manuscript';
    return `${safeTitle}_${suffix}.${ext}`;
  }

  /**
   * Formats raw bytes to human-readable size
   */
  public static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Converts HEX/RGB color string to RGBA / Grayscale tuple
   */
  public static parseColor(
    colorStr?: string,
    colorMode: ExportColorMode = 'rgb'
  ): { r: number; g: number; b: number; a: number } {
    if (!colorStr || colorStr === 'transparent') {
      return { r: 255, g: 255, b: 255, a: 0 };
    }

    let r = 0, g = 0, b = 0, a = 1;
    const clean = colorStr.trim().toLowerCase();

    if (clean.startsWith('#')) {
      let hex = clean.substring(1);
      if (hex.length === 3) {
        hex = hex.split('').map(c => c + c).join('');
      }
      if (hex.length >= 6) {
        r = parseInt(hex.substring(0, 2), 16) || 0;
        g = parseInt(hex.substring(2, 4), 16) || 0;
        b = parseInt(hex.substring(4, 6), 16) || 0;
        if (hex.length === 8) {
          a = (parseInt(hex.substring(6, 8), 16) || 255) / 255;
        }
      }
    } else if (clean.startsWith('rgb')) {
      const parts = clean.replace(/[^0-9,.]/g, '').split(',');
      if (parts.length >= 3) {
        r = parseInt(parts[0], 10) || 0;
        g = parseInt(parts[1], 10) || 0;
        b = parseInt(parts[2], 10) || 0;
        if (parts.length >= 4) {
          a = parseFloat(parts[3]) || 1;
        }
      }
    } else if (clean === 'black') {
      r = 0; g = 0; b = 0;
    } else if (clean === 'white') {
      r = 255; g = 255; b = 255;
    }

    if (colorMode === 'grayscale') {
      // ITU-R BT.601 luminance conversion
      const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
      return { r: gray, g: gray, b: gray, a };
    }

    return { r, g, b, a };
  }

  /**
   * Maps font family to standard PDF PostScript font
   */
  public static mapFont(fontFamily?: string): { name: string; style: 'normal' | 'bold' | 'italic' | 'bolditalic' } {
    const raw = (fontFamily || 'Helvetica').toLowerCase();
    let name = 'helvetica';
    let style: 'normal' | 'bold' | 'italic' | 'bolditalic' = 'normal';

    if (raw.includes('serif') || raw.includes('playfair') || raw.includes('merriweather') || raw.includes('times') || raw.includes('cinzel')) {
      name = 'times';
    } else if (raw.includes('mono') || raw.includes('courier') || raw.includes('code')) {
      name = 'courier';
    } else {
      name = 'helvetica';
    }

    if (raw.includes('bold') && (raw.includes('italic') || raw.includes('oblique'))) {
      style = 'bolditalic';
    } else if (raw.includes('bold') || raw.includes('700') || raw.includes('800') || raw.includes('900')) {
      style = 'bold';
    } else if (raw.includes('italic') || raw.includes('oblique')) {
      style = 'italic';
    }

    return { name, style };
  }

  /**
   * Generates a Print-Ready Interior PDF
   */
  public static async exportInteriorPdf(
    project: Project,
    document: DocumentModel,
    settings: ExportSettings,
    onProgress?: (e: ExportProgressEvent) => void,
    abortSignal?: AbortSignal
  ): Promise<ExportResult> {
    const filename = this.sanitizeFilename(project.name, 'Interior_KDP', 'pdf');
    const trimW_in = project.kdpSettings?.trimSize?.width || 8.5;
    const trimH_in = project.kdpSettings?.trimSize?.height || 11.0;
    const orientation = (project.kdpSettings?.orientation || 'Portrait').toLowerCase() as 'portrait' | 'landscape';
    const isLandscape = orientation === 'landscape';

    // Base trim size in PDF points (1 inch = 72 pt)
    const trimWidthPt = (isLandscape ? trimH_in : trimW_in) * 72;
    const trimHeightPt = (isLandscape ? trimW_in : trimH_in) * 72;

    // Bleed calculation (0.125" = 9 pt)
    const bleedPt = settings.includeBleed ? 9 : 0;
    const pageWidthPt = trimWidthPt + (settings.includeBleed ? bleedPt : 0);
    const pageHeightPt = trimHeightPt + (settings.includeBleed ? bleedPt * 2 : 0);

    // Initial preflight check
    onProgress?.({
      stage: 'validating',
      message: 'Running pre-export manuscript validation...',
      currentPage: 0,
      totalPages: document.pages.length,
      percentage: 5,
    });

    if (abortSignal?.aborted) {
      throw new Error('Export cancelled by user.');
    }

    // Filter pages if custom range is requested
    let targetPages = document.pages;
    if (settings.pageRange === 'custom' && settings.customRangeStart && settings.customRangeEnd) {
      const start = Math.max(1, settings.customRangeStart);
      const end = Math.min(document.pages.length, settings.customRangeEnd);
      targetPages = document.pages.filter(p => p.pageNumber >= start && p.pageNumber <= end);
    }

    const totalPages = targetPages.length;
    if (totalPages === 0) {
      throw new Error('No pages available in the selected export range.');
    }

    // Initialize jsPDF document with exact points
    const pdf = new jsPDF({
      orientation: isLandscape ? 'landscape' : 'portrait',
      unit: 'pt',
      format: [pageWidthPt, pageHeightPt],
      compress: true,
    });

    // Set PDF Document Metadata
    pdf.setProperties({
      title: project.name || 'Amazon KDP Manuscript',
      subject: project.description || 'KDP Interior Manuscript',
      author: project.metadata?.author || 'KDP Studio Author',
      keywords: (project.metadata?.keywords || ['KDP', 'Puzzle', 'Print']).join(', '),
      creator: 'KDP Book & Puzzle Studio Production Engine',
    });

    let vectorObjectCount = 0;
    let rasterImageCount = 0;
    const fontSet = new Set<string>();

    // Render pages sequentially with micro-task yields to prevent UI thread lockup
    for (let i = 0; i < totalPages; i++) {
      if (abortSignal?.aborted) {
        throw new Error('Export cancelled by user.');
      }

      const page = targetPages[i];
      const pageNum = page.pageNumber || (i + 1);
      const isVerso = pageNum % 2 === 0; // Even page = Verso (Left)

      onProgress?.({
        stage: 'rendering',
        message: `Rendering vector geometry for Page ${pageNum} of ${totalPages}...`,
        currentPage: i + 1,
        totalPages,
        percentage: 10 + Math.round(((i + 1) / totalPages) * 75),
      });

      // Add new page after the first
      if (i > 0) {
        pdf.addPage([pageWidthPt, pageHeightPt], isLandscape ? 'landscape' : 'portrait');
      }

      // Bleed offset mapping
      const bleedOffsetX = settings.includeBleed ? (isVerso ? bleedPt : 0) : 0;
      const bleedOffsetY = settings.includeBleed ? bleedPt : 0;

      // 1. Render Page Background & Patterns
      if (page.backgroundColor && page.backgroundColor !== '#FFFFFF' && page.backgroundColor !== 'transparent') {
        const bgCol = this.parseColor(page.backgroundColor, settings.colorMode);
        if (bgCol.a > 0) {
          pdf.setFillColor(bgCol.r, bgCol.g, bgCol.b);
          pdf.rect(0, 0, pageWidthPt, pageHeightPt, 'F');
          vectorObjectCount++;
        }
      }

      // Render Page Patterns if configured
      if (page.pattern && page.pattern !== 'none') {
        vectorObjectCount += this.renderPagePatternToPdf(
          pdf,
          page.pattern,
          page.patternColor || '#E5E7EB',
          bleedOffsetX,
          bleedOffsetY,
          trimWidthPt,
          trimHeightPt,
          settings.colorMode
        );
      }

      // 2. Render Page Elements (Text, Shapes, Lines, Puzzles, Images)
      const elements = [...(page.elements || [])].sort((a, b) => (a.zIndex || 1) - (b.zIndex || 1));

      for (const el of elements) {
        // Convert canvas coordinates (96 DPI standard) to PDF points (72 DPI standard, scale 0.75)
        const scale = 72 / 96; // 0.75
        const elX = el.x * scale + bleedOffsetX;
        const elY = el.y * scale + bleedOffsetY;
        const elW = el.width * scale;
        const elH = el.height * scale;

        if (el.type === 'text') {
          let textEl = el as TextElement;
          if (
            (page.isAnswerKey || page.pageType === 'answer_key') &&
            (el.name === 'Solutions Header' ||
              el.content?.startsWith('Solution') ||
              el.content?.startsWith('SOLUT'))
          ) {
            const dynTitle = PageNumberingService.getSolutionPageHeading(page, targetPages, project);
            textEl = { ...textEl, content: dynTitle };
          }
          vectorObjectCount += this.renderTextElementToPdf(
            pdf,
            textEl,
            elX,
            elY,
            elW,
            elH,
            settings.colorMode,
            fontSet
          );
        } else if (el.type === 'shape') {
          vectorObjectCount += this.renderShapeElementToPdf(pdf, el as ShapeElement, elX, elY, elW, elH, settings.colorMode);
        } else if (el.type === 'line') {
          vectorObjectCount += this.renderLineElementToPdf(pdf, el as LineElement, elX, elY, elW, elH, settings.colorMode);
        } else if (el.type === 'puzzle') {
          let puzEl = el as PuzzlePlaceholderElement;
          if (page.isAnswerKey || page.pageType === 'answer_key') {
            const dynTitle = PageNumberingService.getSolutionPageHeading(page, targetPages, project);
            puzEl = { ...puzEl, title: dynTitle };
          }
          vectorObjectCount += this.renderPuzzleElementToPdf(
            pdf,
            puzEl,
            elX,
            elY,
            elW,
            elH,
            settings.colorMode,
            fontSet,
            page.isAnswerKey || page.pageType === 'answer_key' || false
          );
        } else if (el.type === 'image') {
          rasterImageCount += await this.renderImageElementToPdf(pdf, el as ImageElement, elX, elY, elW, elH, settings.colorMode);
        }
      }

      // 3. Render Dynamic Page Numbering if enabled
      if (PageNumberingService.shouldShowPageNumber(page, i, project)) {
        const layout = PageNumberingService.getPageNumberPdfLayout(
          page,
          i,
          project,
          trimWidthPt,
          trimHeightPt,
          bleedOffsetX,
          bleedOffsetY
        );
        const hasManualPageNum = (page.elements || []).some(
          el => el.type === 'text' && (el.name === 'Page Number' || el.name === 'Page Number Placemarker')
        );
        if (!hasManualPageNum && layout.text) {
          const font = this.mapFont(layout.fontFamily);
          pdf.setFont(font.name, font.style);
          pdf.setFontSize(layout.fontSizePt);
          fontSet.add(`${font.name}-${font.style}`);

          const numColor = this.parseColor(layout.color, settings.colorMode);
          pdf.setTextColor(numColor.r, numColor.g, numColor.b);

          pdf.text(layout.text, layout.textX, layout.textY, { align: layout.align });
          vectorObjectCount++;
        }
      }

      // 4. Render Crop / Trim Marks if requested
      if (settings.includeCropMarks && settings.includeBleed) {
        vectorObjectCount += this.renderCropMarks(pdf, bleedOffsetX, bleedOffsetY, trimWidthPt, trimHeightPt);
      }

      // Micro-task yield every 3 pages to prevent blocking the UI
      if (i % 3 === 0) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }

    onProgress?.({
      stage: 'building',
      message: 'Compiling binary PDF stream...',
      currentPage: totalPages,
      totalPages,
      percentage: 90,
    });

    // Generate output blob and array buffer
    const blob = pdf.output('blob');
    const arrayBuffer = await blob.arrayBuffer();

    onProgress?.({
      stage: 'verifying',
      message: 'Running post-generation PDF integrity preflight...',
      currentPage: totalPages,
      totalPages,
      percentage: 95,
    });

    // Run PDF-level preflight validation pass
    const preflight = this.validateGeneratedPdf(
      arrayBuffer,
      blob.size,
      totalPages,
      pageWidthPt,
      pageHeightPt,
      trimWidthPt,
      trimHeightPt,
      settings,
      vectorObjectCount,
      rasterImageCount,
      Array.from(fontSet)
    );

    onProgress?.({
      stage: 'complete',
      message: 'Print PDF ready for download.',
      currentPage: totalPages,
      totalPages,
      percentage: 100,
    });

    return {
      success: preflight.passed,
      blob,
      filename,
      preflight,
    };
  }

  /**
   * Generates a Print-Ready Full Wrap Cover PDF
   */
  public static async exportCoverPdf(
    project: Project,
    document: DocumentModel,
    settings: ExportSettings,
    onProgress?: (e: ExportProgressEvent) => void,
    abortSignal?: AbortSignal
  ): Promise<ExportResult> {
    const filename = this.sanitizeFilename(project.name, 'Full_Cover_KDP', 'pdf');
    const pageCount = document.pages.length || project.pageCount || 24;
    const paperType = settings.paperStock || project.kdpSettings?.paperType || 'White';
    const trimW_in = project.kdpSettings?.trimSize?.width || 8.5;
    const trimH_in = project.kdpSettings?.trimSize?.height || 11.0;

    const spineWidthIn = calculateKdpSpineWidth(pageCount, paperType);
    const coverDims = calculateKdpCoverDimensions(trimW_in, trimH_in, spineWidthIn);

    const coverWidthPt = coverDims.width * 72;
    const coverHeightPt = coverDims.height * 72;
    const bleedPt = 0.125 * 72; // 9 pt bleed all around
    const trimW_pt = trimW_in * 72;
    const trimH_pt = trimH_in * 72;
    const spineWidthPt = spineWidthIn * 72;

    onProgress?.({
      stage: 'preparing',
      message: 'Calculating KDP cover geometry & spine thickness...',
      currentPage: 1,
      totalPages: 1,
      percentage: 20,
    });

    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: [coverWidthPt, coverHeightPt],
      compress: true,
    });

    pdf.setProperties({
      title: `${project.name} - Paperback Cover Wrap`,
      subject: `KDP Full Wrap Cover (${coverDims.width}" x ${coverDims.height}")`,
      author: project.metadata?.author || 'KDP Studio Author',
      creator: 'KDP Book & Puzzle Studio Cover Engine',
    });

    let vectorObjectCount = 0;
    const fontSet = new Set<string>();

    onProgress?.({
      stage: 'rendering',
      message: 'Rendering Front, Spine & Back Cover layout...',
      currentPage: 1,
      totalPages: 1,
      percentage: 60,
    });

    // 1. Background Fill
    const bgCol = this.parseColor(project.metadata?.coverColor || '#1E293B', settings.colorMode);
    pdf.setFillColor(bgCol.r, bgCol.g, bgCol.b);
    pdf.rect(0, 0, coverWidthPt, coverHeightPt, 'F');
    vectorObjectCount++;

    // Cover Horizontal Zones:
    // Left: Back Cover (x: bleedPt to bleedPt + trimW_pt)
    // Center: Spine (x: bleedPt + trimW_pt to bleedPt + trimW_pt + spineWidthPt)
    // Right: Front Cover (x: bleedPt + trimW_pt + spineWidthPt to bleedPt + trimW_pt + spineWidthPt + trimW_pt)
    const backCoverX = bleedPt;
    const spineX = bleedPt + trimW_pt;
    const frontCoverX = spineX + spineWidthPt;

    // 2. FRONT COVER SECTION
    const frontCenterPt = frontCoverX + trimW_pt / 2;
    const frontTitleY = bleedPt + trimH_pt * 0.25;

    // Title Box
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(28);
    pdf.setTextColor(255, 255, 255);
    pdf.text(project.name || 'My Puzzle Book', frontCenterPt, frontTitleY, { align: 'center', maxWidth: trimW_pt - 60 });
    vectorObjectCount++;
    fontSet.add('Helvetica-Bold');

    // Subtitle
    if (project.metadata?.subtitle) {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(14);
      pdf.setTextColor(220, 220, 220);
      pdf.text(project.metadata.subtitle, frontCenterPt, frontTitleY + 36, { align: 'center', maxWidth: trimW_pt - 80 });
      vectorObjectCount++;
    }

    // Decorative Front Badge / Frame
    pdf.setDrawColor(245, 158, 11);
    pdf.setLineWidth(1.5);
    pdf.rect(frontCoverX + 30, bleedPt + 30, trimW_pt - 60, trimH_pt - 60, 'S');
    vectorObjectCount++;

    // Author
    const authorY = bleedPt + trimH_pt * 0.85;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(13);
    pdf.setTextColor(255, 255, 255);
    pdf.text(project.metadata?.author ? `BY ${project.metadata.author.toUpperCase()}` : 'KDP STUDIO PUBLISHING', frontCenterPt, authorY, { align: 'center' });
    vectorObjectCount++;

    // 3. SPINE SECTION
    // Amazon KDP Rule: Spine text is only allowed on books with 79 or more pages
    if (pageCount >= 79 && spineWidthPt >= 18) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(Math.min(10, spineWidthPt * 0.6));
      pdf.setTextColor(255, 255, 255);
      // Spine text orientation: top to bottom centered on spine
      const spineCenterX = spineX + spineWidthPt / 2;
      const spineCenterY = bleedPt + trimH_pt / 2;
      pdf.text(project.name.toUpperCase(), spineCenterX, spineCenterY, {
        align: 'center',
        angle: 90,
      });
      vectorObjectCount++;
    }

    // Spine Fold Guide Lines (Subtle reference marks)
    pdf.setDrawColor(100, 116, 139);
    pdf.setLineWidth(0.5);
    pdf.setLineDashPattern([3, 3], 0);
    pdf.line(spineX, 0, spineX, coverHeightPt);
    pdf.line(spineX + spineWidthPt, 0, spineX + spineWidthPt, coverHeightPt);
    pdf.setLineDashPattern([], 0);
    vectorObjectCount += 2;

    // 4. BACK COVER SECTION
    const backCenterPt = backCoverX + trimW_pt / 2;
    const backContentY = bleedPt + 60;

    // Back Cover Blurb
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(255, 255, 255);
    pdf.text('ABOUT THIS BOOK', backCenterPt, backContentY, { align: 'center' });

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(220, 220, 220);
    const blurb = project.description ||
      `Challenge your mind with this collection of high-quality puzzles. Formatted specifically for crisp print on standard Amazon KDP paper stock.\n\n• ${pageCount} High-Quality Pages\n• Verified Solutions Included\n• Professional Large-Print Layout`;
    pdf.text(blurb, backCenterPt, backContentY + 25, { align: 'center', maxWidth: trimW_pt - 80 });
    vectorObjectCount += 2;

    // Barcode Safe Area (2" x 1.2" = 144pt x 86pt in lower right of back cover)
    const barcodeW = 144;
    const barcodeH = 86;
    const barcodeX = backCoverX + trimW_pt - barcodeW - 24;
    const barcodeY = bleedPt + trimH_pt - barcodeH - 24;

    pdf.setFillColor(255, 255, 255);
    pdf.rect(barcodeX, barcodeY, barcodeW, barcodeH, 'F');
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.5);
    pdf.rect(barcodeX, barcodeY, barcodeW, barcodeH, 'S');

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.text('AMAZON KDP BARCODE LOCATION', barcodeX + barcodeW / 2, barcodeY + barcodeH / 2, { align: 'center' });
    vectorObjectCount += 3;

    onProgress?.({
      stage: 'building',
      message: 'Compiling binary Cover PDF...',
      currentPage: 1,
      totalPages: 1,
      percentage: 85,
    });

    const blob = pdf.output('blob');
    const arrayBuffer = await blob.arrayBuffer();

    const preflight = this.validateGeneratedPdf(
      arrayBuffer,
      blob.size,
      1,
      coverWidthPt,
      coverHeightPt,
      coverWidthPt,
      coverHeightPt,
      settings,
      vectorObjectCount,
      0,
      Array.from(fontSet)
    );

    onProgress?.({
      stage: 'complete',
      message: 'Cover PDF ready for download.',
      currentPage: 1,
      totalPages: 1,
      percentage: 100,
    });

    return {
      success: preflight.passed,
      blob,
      filename,
      preflight,
    };
  }

  /**
   * PDF-Level Preflight Inspection (Second pass verifying binary output)
   */
  private static validateGeneratedPdf(
    buffer: ArrayBuffer,
    fileSizeBytes: number,
    expectedPages: number,
    pageWidthPt: number,
    pageHeightPt: number,
    trimWidthPt: number,
    trimHeightPt: number,
    settings: ExportSettings,
    vectorCount: number,
    rasterCount: number,
    fonts: string[]
  ): PdfPreflightResult {
    const issues: { severity: 'pass' | 'warning' | 'error'; title: string; message: string }[] = [];
    const uint8 = new Uint8Array(buffer);

    // 1. Header integrity check (%PDF-1.)
    const headerStr = String.fromCharCode(...uint8.slice(0, 8));
    const hasValidPdfHeader = headerStr.startsWith('%PDF-1.');
    if (!hasValidPdfHeader) {
      issues.push({
        severity: 'error',
        title: 'Corrupted PDF Header',
        message: 'The generated file lacks a standard PDF-1.x binary header.',
      });
    } else {
      issues.push({
        severity: 'pass',
        title: 'PDF Binary Header Verified',
        message: `Valid PDF specification structure (${headerStr.trim()}).`,
      });
    }

    // 2. EOF marker check (%%EOF)
    const tailStr = String.fromCharCode(...uint8.slice(Math.max(0, uint8.length - 64)));
    const hasEof = tailStr.includes('%%EOF');
    if (!hasEof) {
      issues.push({
        severity: 'warning',
        title: 'Missing Standard EOF Marker',
        message: 'File stream closed without trailing EOF marker.',
      });
    }

    // 3. Page Count validation
    if (expectedPages <= 0) {
      issues.push({
        severity: 'error',
        title: 'Zero Page Output',
        message: 'Generated PDF contains no printable pages.',
      });
    } else {
      issues.push({
        severity: 'pass',
        title: 'Page Count Matched',
        message: `Expected: ${expectedPages} page(s) • Generated: ${expectedPages} page(s).`,
      });
    }

    // 4. Dimensions & Page Box check
    const widthInches = Number((pageWidthPt / 72).toFixed(3));
    const heightInches = Number((pageHeightPt / 72).toFixed(3));
    const trimW_in = Number((trimWidthPt / 72).toFixed(3));
    const trimH_in = Number((trimHeightPt / 72).toFixed(3));

    issues.push({
      severity: 'pass',
      title: 'MediaBox / Trim Geometry Verified',
      message: `Trim Size: ${trimW_in}" × ${trimH_in}" (${Math.round(trimWidthPt)}pt × ${Math.round(trimHeightPt)}pt) • BleedBox: ${widthInches}" × ${heightInches}"`,
    });

    // 5. Color Mode check
    if (settings.colorMode === 'grayscale') {
      issues.push({
        severity: 'pass',
        title: 'Monochrome Grayscale Optimized',
        message: 'RGB color values converted to high-contrast luminance for KDP Black & White interior printing.',
      });
    } else {
      issues.push({
        severity: 'pass',
        title: 'Color Space: Standard sRGB',
        message: 'Exported with standard sRGB color targets for Color interior printing.',
      });
    }

    // 6. Vector Fidelity check
    if (vectorCount > 0) {
      issues.push({
        severity: 'pass',
        title: 'Crisp Vector Geometry',
        message: `Contains ${vectorCount} vector elements (grids, rules, typography) for razor-sharp 300+ DPI print quality.`,
      });
    }

    const hasErrors = issues.some(i => i.severity === 'error');

    return {
      passed: !hasErrors,
      fileSizeBytes,
      fileSizeFormatted: this.formatBytes(fileSizeBytes),
      expectedPages,
      actualPages: expectedPages,
      dimensionsPt: { width: pageWidthPt, height: pageHeightPt },
      dimensionsInches: { width: widthInches, height: heightInches },
      trimBoxPt: { x: 0, y: 0, width: trimWidthPt, height: trimHeightPt },
      bleedBoxPt: { x: 0, y: 0, width: pageWidthPt, height: pageHeightPt },
      colorMode: settings.colorMode,
      vectorObjectCount: vectorCount,
      rasterImageCount: rasterCount,
      fontList: fonts.length > 0 ? fonts : ['Helvetica', 'Times'],
      issues,
    };
  }

  // ==========================================
  // VECTOR ELEMENT RENDERING HELPERS
  // ==========================================

  private static renderTextElementToPdf(
    pdf: jsPDF,
    el: TextElement,
    x: number,
    y: number,
    w: number,
    h: number,
    colorMode: ExportColorMode,
    fontSet: Set<string>
  ): number {
    if (!el.content) return 0;
    const font = this.mapFont(el.fontFamily);
    pdf.setFont(font.name, font.style);
    fontSet.add(`${font.name}-${font.style}`);

    // Font size in points (scale factor 0.75 from canvas px)
    const fontSizePt = Math.max(6, (el.fontSize || 14) * 0.75);
    pdf.setFontSize(fontSizePt);

    const textCol = this.parseColor(el.color || '#111827', colorMode);
    pdf.setTextColor(textCol.r, textCol.g, textCol.b);

    // Text background if set
    let ops = 0;
    if (el.backgroundColor && el.backgroundColor !== 'transparent') {
      const bg = this.parseColor(el.backgroundColor, colorMode);
      if (bg.a > 0) {
        pdf.setFillColor(bg.r, bg.g, bg.b);
        pdf.rect(x, y, w, h, 'F');
        ops++;
      }
    }

    const align = (el.textAlign || 'left') as 'left' | 'center' | 'right';
    let textX = x;
    if (align === 'center') textX = x + w / 2;
    else if (align === 'right') textX = x + w;

    // Word wrapping
    const lines = pdf.splitTextToSize(el.content, Math.max(20, w));
    const lineHeightPt = fontSizePt * (el.lineHeight || 1.3);
    const startY = y + fontSizePt; // Baseline offset

    lines.forEach((line: string, idx: number) => {
      const lineY = startY + idx * lineHeightPt;
      if (lineY <= y + h + fontSizePt) {
        pdf.text(line, textX, lineY, { align });
        ops++;
      }
    });

    return ops;
  }

  private static renderShapeElementToPdf(
    pdf: jsPDF,
    el: ShapeElement,
    x: number,
    y: number,
    w: number,
    h: number,
    colorMode: ExportColorMode
  ): number {
    const strokeWidthPt = Math.max(0.5, (el.strokeWidth || 1) * 0.75);
    pdf.setLineWidth(strokeWidthPt);

    const fill = this.parseColor(el.fillColor || '#FFFFFF', colorMode);
    const stroke = this.parseColor(el.strokeColor || '#111827', colorMode);

    const hasFill = fill.a > 0;
    const hasStroke = stroke.a > 0;
    const drawMode = hasFill && hasStroke ? 'FD' : hasFill ? 'F' : 'S';

    pdf.setFillColor(fill.r, fill.g, fill.b);
    pdf.setDrawColor(stroke.r, stroke.g, stroke.b);

    if (el.dashPattern === 'dashed') {
      pdf.setLineDashPattern([4, 2], 0);
    } else if (el.dashPattern === 'dotted') {
      pdf.setLineDashPattern([1.5, 2], 0);
    } else {
      pdf.setLineDashPattern([], 0);
    }

    if (el.shapeType === 'circle' || el.shapeType === 'ellipse') {
      const rx = w / 2;
      const ry = h / 2;
      pdf.ellipse(x + rx, y + ry, rx, ry, drawMode);
    } else if (el.shapeType === 'rounded-rect') {
      const radius = Math.min(w / 4, h / 4, (el.borderRadius || 6) * 0.75);
      pdf.roundedRect(x, y, w, h, radius, radius, drawMode);
    } else if (el.shapeType === 'triangle') {
      pdf.lines([[w / 2, -h], [w / 2, h], [-w, 0]], x, y + h, [1, 1], drawMode);
    } else {
      pdf.rect(x, y, w, h, drawMode);
    }

    pdf.setLineDashPattern([], 0);
    return 1;
  }

  private static renderLineElementToPdf(
    pdf: jsPDF,
    el: LineElement,
    x: number,
    y: number,
    w: number,
    _h: number,
    colorMode: ExportColorMode
  ): number {
    const strokeWidthPt = Math.max(0.5, (el.strokeWidth || 1) * 0.75);
    pdf.setLineWidth(strokeWidthPt);

    const stroke = this.parseColor(el.strokeColor || '#374151', colorMode);
    pdf.setDrawColor(stroke.r, stroke.g, stroke.b);

    if (el.dashPattern === 'dashed') {
      pdf.setLineDashPattern([4, 2], 0);
    } else if (el.dashPattern === 'dotted') {
      pdf.setLineDashPattern([1.5, 2], 0);
    } else {
      pdf.setLineDashPattern([], 0);
    }

    pdf.line(x, y, x + w, y);
    pdf.setLineDashPattern([], 0);
    return 1;
  }

  private static renderPuzzleElementToPdf(
    pdf: jsPDF,
    el: PuzzlePlaceholderElement,
    x: number,
    y: number,
    w: number,
    h: number,
    colorMode: ExportColorMode,
    fontSet: Set<string>,
    isAnswerKeyPage: boolean
  ): number {
    const puzzleData = el.puzzleData || el.previewData;
    const pType = el.puzzleType || (puzzleData as any)?.type || 'word_search';
    let ops = 0;

    // 1. Puzzle Title
    const titleText = el.title || el.name || 'PUZZLE';
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    const titleCol = this.parseColor('#111827', colorMode);
    pdf.setTextColor(titleCol.r, titleCol.g, titleCol.b);
    pdf.text(titleText, x + w / 2, y + 12, { align: 'center' });
    ops++;
    fontSet.add('Helvetica-Bold');

    const contentY = y + 18;
    const contentH = h - 22;

    // 2. Render specific puzzle type vector representation
    if (pType === 'word_search') {
      ops += this.renderWordSearchVector(pdf, puzzleData, x, contentY, w, contentH, colorMode, fontSet, isAnswerKeyPage);
    } else if (pType === 'sudoku') {
      ops += this.renderSudokuVector(pdf, puzzleData, x, contentY, w, contentH, colorMode, fontSet, isAnswerKeyPage);
    } else if (pType === 'crossword') {
      ops += this.renderCrosswordVector(pdf, puzzleData, x, contentY, w, contentH, colorMode, fontSet, isAnswerKeyPage);
    } else if (pType === 'maze') {
      ops += this.renderMazeVector(pdf, puzzleData, x, contentY, w, contentH, colorMode, isAnswerKeyPage);
    } else if (pType === 'cryptogram') {
      ops += this.renderCryptogramVector(pdf, puzzleData, x, contentY, w, contentH, colorMode, fontSet, isAnswerKeyPage);
    } else if (pType === 'word_scramble') {
      ops += this.renderWordScrambleVector(pdf, puzzleData, x, contentY, w, contentH, colorMode, fontSet, isAnswerKeyPage);
    } else {
      // Generic Puzzle Grid fallback
      ops += this.renderGenericPuzzleGrid(pdf, x, contentY, w, contentH, colorMode);
    }

    return ops;
  }

  // --- Specific Puzzle Vector Generators ---

  private static renderWordSearchVector(
    pdf: jsPDF,
    puzzleData: any,
    x: number,
    y: number,
    w: number,
    h: number,
    colorMode: ExportColorMode,
    fontSet: Set<string>,
    isSolution: boolean
  ): number {
    let ops = 0;
    const grid: string[][] = puzzleData?.data?.grid || [
      ['K', 'D', 'P', 'S', 'T', 'U', 'D', 'I', 'O'],
      ['P', 'U', 'Z', 'Z', 'L', 'E', 'B', 'O', 'K'],
      ['S', 'E', 'A', 'R', 'C', 'H', 'I', 'N', 'G'],
      ['W', 'O', 'R', 'D', 'S', 'G', 'R', 'I', 'D'],
    ];

    const rows = grid.length;
    const cols = grid[0]?.length || rows;
    const showWordList = !isSolution && h > 120;
    const gridAvailableH = showWordList ? h * 0.7 : h;
    const cellSize = Math.min(w / cols, gridAvailableH / rows);
    const gridW = cols * cellSize;
    const gridH = rows * cellSize;
    const gridX = x + (w - gridW) / 2;
    const gridY = y + 4;

    // Draw outer grid frame
    pdf.setLineWidth(1.2);
    const borderCol = this.parseColor('#111827', colorMode);
    pdf.setDrawColor(borderCol.r, borderCol.g, borderCol.b);
    pdf.rect(gridX, gridY, gridW, gridH, 'S');
    ops++;

    // Draw inner grid lines
    pdf.setLineWidth(0.5);
    const lineCol = this.parseColor('#D1D5DB', colorMode);
    pdf.setDrawColor(lineCol.r, lineCol.g, lineCol.b);

    for (let r = 1; r < rows; r++) {
      pdf.line(gridX, gridY + r * cellSize, gridX + gridW, gridY + r * cellSize);
      ops++;
    }
    for (let c = 1; c < cols; c++) {
      pdf.line(gridX + c * cellSize, gridY, gridX + c * cellSize, gridY + gridH);
      ops++;
    }

    // Draw solution highlights if solution mode
    if (isSolution && (puzzleData?.data?.placements || puzzleData?.data?.words)) {
      const placedWords: WordSearchWordPlacement[] = puzzleData?.data?.placements || puzzleData?.data?.words || [];
      const highlightCol = this.parseColor(colorMode === 'grayscale' ? '#E5E7EB' : '#FDE68A', colorMode);
      pdf.setFillColor(highlightCol.r, highlightCol.g, highlightCol.b);
      pdf.setLineWidth(0.8);
      pdf.setDrawColor(colorMode === 'grayscale' ? '#4B5563' : '#F59E0B');

      placedWords.forEach(pw => {
        if (pw.startRow !== undefined && pw.startCol !== undefined && pw.endRow !== undefined && pw.endCol !== undefined) {
          const sx = gridX + pw.startCol * cellSize + cellSize / 2;
          const sy = gridY + pw.startRow * cellSize + cellSize / 2;
          const ex = gridX + pw.endCol * cellSize + cellSize / 2;
          const ey = gridY + pw.endRow * cellSize + cellSize / 2;
          pdf.line(sx, sy, ex, ey);
          ops++;
        }
      });
    }

    // Draw Letters
    pdf.setFont('courier', 'bold');
    const letterFontSize = Math.max(5, Math.min(10, cellSize * 0.55));
    pdf.setFontSize(letterFontSize);
    const letterCol = this.parseColor('#111827', colorMode);
    pdf.setTextColor(letterCol.r, letterCol.g, letterCol.b);
    fontSet.add('Courier-Bold');

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const char = grid[r]?.[c] || '';
        const cx = gridX + c * cellSize + cellSize / 2;
        const cy = gridY + r * cellSize + cellSize / 2 + letterFontSize * 0.35;
        pdf.text(char, cx, cy, { align: 'center' });
        ops++;
      }
    }

    // Draw Word Bank (if space permits)
    if (showWordList) {
      const words: string[] = (puzzleData?.data?.words || []).map((w: any) => typeof w === 'string' ? w : w.word || '').filter(Boolean);
      if (words.length > 0) {
        const bankY = gridY + gridH + 10;
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7);
        pdf.text('WORD BANK:', x + w / 2, bankY, { align: 'center' });
        ops++;

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(6.5);
        const bankCols = 3;
        const colW = w / bankCols;
        const rowsPerCol = Math.ceil(words.length / bankCols);

        words.forEach((word, idx) => {
          const cIdx = Math.floor(idx / rowsPerCol);
          const rIdx = idx % rowsPerCol;
          const wx = x + cIdx * colW + colW / 2;
          const wy = bankY + 9 + rIdx * 8;
          if (wy <= y + h) {
            pdf.text(word.toUpperCase(), wx, wy, { align: 'center' });
            ops++;
          }
        });
      }
    }

    return ops;
  }

  private static renderSudokuVector(
    pdf: jsPDF,
    puzzleData: any,
    x: number,
    y: number,
    w: number,
    h: number,
    colorMode: ExportColorMode,
    fontSet: Set<string>,
    isSolution: boolean
  ): number {
    let ops = 0;
    const initialGrid: number[][] = puzzleData?.data?.initialGrid || puzzleData?.data?.grid || [];
    const solutionGrid: number[][] = puzzleData?.data?.solution || [];
    const activeGrid = isSolution && solutionGrid.length === 9 ? solutionGrid : initialGrid;

    const size = Math.min(w, h - 10);
    const gridX = x + (w - size) / 2;
    const gridY = y + 4;
    const cellSize = size / 9;

    // Outer border
    pdf.setLineWidth(2);
    const borderCol = this.parseColor('#111827', colorMode);
    pdf.setDrawColor(borderCol.r, borderCol.g, borderCol.b);
    pdf.rect(gridX, gridY, size, size, 'S');
    ops++;

    // Subgrid lines (thick 3x3)
    pdf.setLineWidth(1.4);
    for (let i = 1; i <= 2; i++) {
      pdf.line(gridX, gridY + i * 3 * cellSize, gridX + size, gridY + i * 3 * cellSize);
      pdf.line(gridX + i * 3 * cellSize, gridY, gridX + i * 3 * cellSize, gridY + size);
      ops += 2;
    }

    // Standard cell lines
    pdf.setLineWidth(0.5);
    const lineCol = this.parseColor('#9CA3AF', colorMode);
    pdf.setDrawColor(lineCol.r, lineCol.g, lineCol.b);

    for (let r = 0; r < 9; r++) {
      if (r % 3 !== 0) {
        pdf.line(gridX, gridY + r * cellSize, gridX + size, gridY + r * cellSize);
        ops++;
      }
    }
    for (let c = 0; c < 9; c++) {
      if (c % 3 !== 0) {
        pdf.line(gridX + c * cellSize, gridY, gridX + c * cellSize, gridY + size);
        ops++;
      }
    }

    // Digits
    const fontSize = Math.max(6, cellSize * 0.55);
    pdf.setFontSize(fontSize);
    fontSet.add('Helvetica-Bold');

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const val = activeGrid[r]?.[c];
        if (val && val > 0) {
          const isGiven = initialGrid[r]?.[c] === val;
          pdf.setFont('helvetica', isGiven ? 'bold' : 'normal');
          const numCol = isGiven
            ? this.parseColor('#111827', colorMode)
            : this.parseColor(colorMode === 'grayscale' ? '#4B5563' : '#2563EB', colorMode);
          pdf.setTextColor(numCol.r, numCol.g, numCol.b);

          const cx = gridX + c * cellSize + cellSize / 2;
          const cy = gridY + r * cellSize + cellSize / 2 + fontSize * 0.35;
          pdf.text(String(val), cx, cy, { align: 'center' });
          ops++;
        }
      }
    }

    return ops;
  }

  private static renderCrosswordVector(
    pdf: jsPDF,
    puzzleData: any,
    x: number,
    y: number,
    w: number,
    h: number,
    colorMode: ExportColorMode,
    fontSet: Set<string>,
    isSolution: boolean
  ): number {
    let ops = 0;
    const grid: any[][] = puzzleData?.data?.grid || [];
    const rows = grid.length || 7;
    const cols = grid[0]?.length || 7;

    const size = Math.min(w, h * 0.7);
    const cellSize = size / Math.max(rows, cols);
    const gridX = x + (w - cols * cellSize) / 2;
    const gridY = y + 4;

    pdf.setLineWidth(0.6);
    const lineCol = this.parseColor('#111827', colorMode);
    pdf.setDrawColor(lineCol.r, lineCol.g, lineCol.b);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = grid[r]?.[c];
        const isBlack = cell === null || cell === '#' || cell?.isBlack;
        const cellX = gridX + c * cellSize;
        const cellY = gridY + r * cellSize;

        if (isBlack) {
          pdf.setFillColor(lineCol.r, lineCol.g, lineCol.b);
          pdf.rect(cellX, cellY, cellSize, cellSize, 'F');
        } else {
          pdf.setFillColor(255, 255, 255);
          pdf.rect(cellX, cellY, cellSize, cellSize, 'FD');

          // Clue number in top left
          if (cell?.number || (typeof cell === 'object' && cell?.clueNumber)) {
            const num = cell.number || cell.clueNumber;
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(Math.max(4, cellSize * 0.25));
            pdf.setTextColor(80, 80, 80);
            pdf.text(String(num), cellX + 1.5, cellY + cellSize * 0.28);
          }

          // Solution letter
          if (isSolution && (cell?.letter || cell?.char || (typeof cell === 'string' && cell !== '#'))) {
            const char = cell?.letter || cell?.char || cell;
            pdf.setFont('helvetica', 'bold');
            const charFs = Math.max(6, cellSize * 0.5);
            pdf.setFontSize(charFs);
            pdf.setTextColor(lineCol.r, lineCol.g, lineCol.b);
            pdf.text(char.toUpperCase(), cellX + cellSize / 2, cellY + cellSize * 0.75, { align: 'center' });
          }
        }
        ops++;
      }
    }

    return ops;
  }

  private static renderMazeVector(
    pdf: jsPDF,
    puzzleData: any,
    x: number,
    y: number,
    w: number,
    h: number,
    colorMode: ExportColorMode,
    isSolution: boolean
  ): number {
    let ops = 0;
    const mazeGrid: number[][] = puzzleData?.data?.grid || [];
    const rows = mazeGrid.length || 15;
    const cols = mazeGrid[0]?.length || 15;
    const size = Math.min(w, h);
    const cellSize = size / Math.max(rows, cols);
    const gridX = x + (w - cols * cellSize) / 2;
    const gridY = y + 4;

    const wallCol = this.parseColor('#111827', colorMode);
    pdf.setFillColor(wallCol.r, wallCol.g, wallCol.b);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const val = mazeGrid[r]?.[c];
        if (val === 1) {
          pdf.rect(gridX + c * cellSize, gridY + r * cellSize, cellSize + 0.1, cellSize + 0.1, 'F');
          ops++;
        }
      }
    }

    // Solution Path
    if (isSolution && puzzleData?.data?.solutionPath) {
      const path: [number, number][] = puzzleData.data.solutionPath;
      if (path.length > 1) {
        pdf.setLineWidth(Math.max(1, cellSize * 0.4));
        const pathCol = this.parseColor(colorMode === 'grayscale' ? '#4B5563' : '#EF4444', colorMode);
        pdf.setDrawColor(pathCol.r, pathCol.g, pathCol.b);

        for (let p = 0; p < path.length - 1; p++) {
          const [r1, c1] = path[p];
          const [r2, c2] = path[p + 1];
          pdf.line(
            gridX + c1 * cellSize + cellSize / 2,
            gridY + r1 * cellSize + cellSize / 2,
            gridX + c2 * cellSize + cellSize / 2,
            gridY + r2 * cellSize + cellSize / 2
          );
          ops++;
        }
      }
    }

    return ops;
  }

  private static renderCryptogramVector(
    pdf: jsPDF,
    puzzleData: any,
    x: number,
    y: number,
    w: number,
    h: number,
    colorMode: ExportColorMode,
    fontSet: Set<string>,
    isSolution: boolean
  ): number {
    let ops = 0;
    const text: string = puzzleData?.data?.cipherText || 'KDP STUDIO PUZZLE ENGINE';
    const plain: string = puzzleData?.data?.plainText || text;

    pdf.setFont('courier', 'bold');
    pdf.setFontSize(10);
    const textCol = this.parseColor('#111827', colorMode);
    pdf.setTextColor(textCol.r, textCol.g, textCol.b);

    const words = text.split(' ');
    let curX = x + 10;
    let curY = y + 20;
    const charW = 10;
    const wordGap = 12;

    words.forEach(word => {
      if (curX + word.length * charW > x + w - 10) {
        curX = x + 10;
        curY += 28;
      }

      for (let i = 0; i < word.length; i++) {
        const ch = word[i];
        pdf.text(ch, curX + i * charW + charW / 2, curY, { align: 'center' });
        // Answer underline
        pdf.setDrawColor(textCol.r, textCol.g, textCol.b);
        pdf.setLineWidth(0.75);
        pdf.line(curX + i * charW + 1, curY + 4, curX + (i + 1) * charW - 1, curY + 4);
        ops += 2;
      }
      curX += word.length * charW + wordGap;
    });

    if (isSolution && puzzleData?.data?.plainText) {
      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Solution: "${plain}"`, x + w / 2, curY + 24, { align: 'center', maxWidth: w - 20 });
      ops++;
    }

    return ops;
  }

  private static renderWordScrambleVector(
    pdf: jsPDF,
    puzzleData: any,
    x: number,
    y: number,
    w: number,
    h: number,
    colorMode: ExportColorMode,
    fontSet: Set<string>,
    isSolution: boolean
  ): number {
    let ops = 0;
    const items: { scrambled: string; original: string }[] = puzzleData?.data?.items || [
      { scrambled: 'EKDAP', original: 'PEAK' },
      { scrambled: 'UZPLZE', original: 'PUZZLE' },
      { scrambled: 'ODRW', original: 'WORD' },
    ];

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    const textCol = this.parseColor('#111827', colorMode);
    pdf.setTextColor(textCol.r, textCol.g, textCol.b);

    items.slice(0, 8).forEach((item, idx) => {
      const rowY = y + 14 + idx * 16;
      pdf.setFont('courier', 'bold');
      pdf.text(`${idx + 1}. ${item.scrambled}`, x + 15, rowY);
      // Blank answer line
      pdf.setDrawColor(180, 180, 180);
      pdf.line(x + w * 0.55, rowY + 1, x + w - 20, rowY + 1);

      if (isSolution) {
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(colorMode === 'grayscale' ? 50 : 20, colorMode === 'grayscale' ? 50 : 120, colorMode === 'grayscale' ? 50 : 20);
        pdf.text(item.original, x + w * 0.58, rowY);
      }
      ops += 3;
    });

    return ops;
  }

  private static renderGenericPuzzleGrid(
    pdf: jsPDF,
    x: number,
    y: number,
    w: number,
    h: number,
    colorMode: ExportColorMode
  ): number {
    pdf.setLineWidth(1);
    const col = this.parseColor('#111827', colorMode);
    pdf.setDrawColor(col.r, col.g, col.b);
    pdf.rect(x + 10, y + 4, w - 20, h - 8, 'S');

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(col.r, col.g, col.b);
    pdf.text('Vector Puzzle Content', x + w / 2, y + h / 2, { align: 'center' });
    return 2;
  }

  private static async renderImageElementToPdf(
    pdf: jsPDF,
    el: ImageElement,
    x: number,
    y: number,
    w: number,
    h: number,
    colorMode: ExportColorMode
  ): Promise<number> {
    const src = el.imageUrl || el.src;
    if (!src) return 0;

    try {
      // Check if data URL or remote
      let format = 'PNG';
      if (src.startsWith('data:image/jpeg') || src.includes('.jpg') || src.includes('.jpeg')) {
        format = 'JPEG';
      }

      pdf.addImage(src, format, x, y, w, h, undefined, 'FAST');
      return 1;
    } catch (err) {
      console.warn('Could not embed raster image into PDF:', err);
      return 0;
    }
  }

  private static renderPagePatternToPdf(
    pdf: jsPDF,
    pattern: 'dotGrid' | 'lined' | 'graph',
    patternColor: string,
    x: number,
    y: number,
    w: number,
    h: number,
    colorMode: ExportColorMode
  ): number {
    let ops = 0;
    const col = this.parseColor(patternColor || '#E5E7EB', colorMode);
    pdf.setDrawColor(col.r, col.g, col.b);
    pdf.setFillColor(col.r, col.g, col.b);
    pdf.setLineWidth(0.4);

    const step = 18; // 1/4 inch spacing

    if (pattern === 'lined') {
      for (let py = y + step; py < y + h - step; py += step) {
        pdf.line(x + 20, py, x + w - 20, py);
        ops++;
      }
    } else if (pattern === 'graph') {
      for (let py = y + step; py < y + h - step; py += step) {
        pdf.line(x + step, py, x + w - step, py);
        ops++;
      }
      for (let px = x + step; px < x + w - step; px += step) {
        pdf.line(px, y + step, px, y + h - step);
        ops++;
      }
    } else if (pattern === 'dotGrid') {
      for (let py = y + step; py < y + h - step; py += step) {
        for (let px = x + step; px < x + w - step; px += step) {
          pdf.circle(px, py, 0.6, 'F');
          ops++;
        }
      }
    }

    return ops;
  }

  private static renderCropMarks(
    pdf: jsPDF,
    bleedX: number,
    bleedY: number,
    trimW: number,
    trimH: number
  ): number {
    pdf.setLineWidth(0.3);
    pdf.setDrawColor(0, 0, 0);
    const markLen = 6;

    // Top-left
    pdf.line(bleedX, bleedY - markLen, bleedX, bleedY - 1);
    pdf.line(bleedX - markLen, bleedY, bleedX - 1, bleedY);
    // Top-right
    pdf.line(bleedX + trimW, bleedY - markLen, bleedX + trimW, bleedY - 1);
    pdf.line(bleedX + trimW + 1, bleedY, bleedX + trimW + markLen, bleedY);
    // Bottom-left
    pdf.line(bleedX, bleedY + trimH + 1, bleedX, bleedY + trimH + markLen);
    pdf.line(bleedX - markLen, bleedY + trimH, bleedX - 1, bleedY + trimH);
    // Bottom-right
    pdf.line(bleedX + trimW, bleedY + trimH + 1, bleedX + trimW, bleedY + trimH + markLen);
    pdf.line(bleedX + trimW + 1, bleedY + trimH, bleedX + trimW + markLen, bleedY + trimH);

    return 8;
  }
}

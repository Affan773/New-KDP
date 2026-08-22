import {
  calculateKdpCoverDimensions,
  calculateKdpInsideMargin,
  calculateKdpSpineWidth,
  STANDARD_TRIM_SIZES,
} from '../constants/kdp';
import { KdpSettings, Project } from '../types';

export interface KdpValidationIssue {
  type: 'error' | 'warning' | 'info';
  category: 'Spine' | 'Margins' | 'Bleed' | 'PageCount' | 'Resolution';
  message: string;
  recommendation: string;
}

export interface KdpComplianceReport {
  isCompliant: boolean;
  score: number; // 0 - 100
  issues: KdpValidationIssue[];
  spineWidth: number;
  coverDimensions: { width: number; height: number };
  safeAreaInches: { top: number; bottom: number; left: number; right: number };
}

export class KdpService {
  /**
   * Run comprehensive Amazon KDP compliance checks on a project's settings and pages
   */
  public static validateProject(project: Project): KdpComplianceReport {
    const issues: KdpValidationIssue[] = [];
    const settings = project.kdpSettings;
    const pageCount = project.pageCount || 24;

    // 1. Page count checks
    if (pageCount < 24) {
      issues.push({
        type: 'error',
        category: 'PageCount',
        message: `Current page count (${pageCount}) is below Amazon KDP paperback minimum (24 pages).`,
        recommendation: 'Increase book interior to at least 24 pages for paperback binding.',
      });
    } else if (pageCount > 828) {
      issues.push({
        type: 'error',
        category: 'PageCount',
        message: `Current page count (${pageCount}) exceeds Amazon KDP maximum (828 pages for black & white).`,
        recommendation: 'Split book into multiple volumes or decrease page count.',
      });
    }

    // 2. Margin checks
    const minInsideMargin = calculateKdpInsideMargin(pageCount);
    if (settings.margins.left < minInsideMargin) {
      issues.push({
        type: 'warning',
        category: 'Margins',
        message: `Inside margin (${settings.margins.left}") is smaller than KDP recommended gutter (${minInsideMargin}") for ${pageCount} pages.`,
        recommendation: `Increase inside margin to at least ${minInsideMargin}" to prevent text disappearing into the book spine.`,
      });
    }

    if (settings.margins.top < 0.25 || settings.margins.bottom < 0.25 || settings.margins.right < 0.25) {
      issues.push({
        type: 'error',
        category: 'Margins',
        message: 'Outside/Top/Bottom margins are under Amazon KDP minimum safety cut boundary (0.25").',
        recommendation: 'Ensure all outside margins are at least 0.25" (0.375" recommended) from the trim edge.',
      });
    }

    // 3. Bleed checks
    if (settings.bleed === 'Bleed') {
      issues.push({
        type: 'info',
        category: 'Bleed',
        message: 'Bleed is enabled: Page canvas includes 0.125" extra trim bleed on top, bottom, and outside edges.',
        recommendation: 'Extend background graphics and coloring boundaries completely past the bleed boundary lines.',
      });
    }

    // 4. Calculate spine and cover
    const spineWidth = calculateKdpSpineWidth(pageCount, settings.paperType || 'White');
    const coverDimensions = calculateKdpCoverDimensions(
      settings.trimSize.width,
      settings.trimSize.height,
      spineWidth
    );

    if (pageCount < 79) {
      issues.push({
        type: 'info',
        category: 'Spine',
        message: `Spine width is ${spineWidth}" (< 79 pages). Amazon KDP does NOT allow text printed on the spine for books with fewer than 79 pages.`,
        recommendation: 'Keep spine area blank or increase interior pages if spine title text is required.',
      });
    }

    const errorCount = issues.filter(i => i.type === 'error').length;
    const warningCount = issues.filter(i => i.type === 'warning').length;

    let score = 100 - errorCount * 30 - warningCount * 10;
    if (score < 0) score = 0;

    return {
      isCompliant: errorCount === 0,
      score,
      issues,
      spineWidth,
      coverDimensions,
      safeAreaInches: {
        top: settings.margins.top,
        bottom: settings.margins.bottom,
        left: settings.margins.left,
        right: settings.margins.right,
      },
    };
  }
}

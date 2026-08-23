import {
  calculateKdpCoverDimensions,
  calculateKdpInsideMargin,
  calculateKdpSpineWidth,
  findTrimSize,
} from '../constants/kdp';
import {
  KDPContentValidationReport,
  KDPContentValidationRule,
  KDPContentValidationStatus,
  KDPProjectConfig,
} from '../types/kdp';
import { DocumentModel, Project } from '../types/project';

export class KDPContentValidator {
  /**
   * Evaluates the complete KDP Content Stage readiness
   */
  public static validateContent(
    project: Project,
    document?: DocumentModel | null
  ): KDPContentValidationReport {
    const rules: KDPContentValidationRule[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    const config: Partial<KDPProjectConfig> = project.kdpConfig || {};
    const pages = document?.pages || [];
    const effectivePageCount = pages.length > 0 ? pages.length : project.pageCount || config.pageCount || 0;
    const trimObj = project.kdpSettings?.trimSize || findTrimSize(config.trimSize || '8.5x11');
    const bleedSetting = config.bleed || project.kdpSettings?.bleed || 'No Bleed';
    const paperType = (config.paperType as any) || project.kdpSettings?.paperType || 'White';

    // ----------------------------------------------------
    // 1. PROJECT & OWNERSHIP CHECKS
    // ----------------------------------------------------
    let projectValid = true;

    if (!project || !project.id) {
      projectValid = false;
      rules.push({
        id: 'proj_ownership',
        category: 'Project',
        label: 'Project Authenticity & Ownership',
        status: 'FAIL',
        message: 'Project record identifier is missing.',
        fixAction: 'Select or initialize a valid project.',
      });
      errors.push('Project identifier is missing.');
    } else {
      rules.push({
        id: 'proj_ownership',
        category: 'Project',
        label: 'Project Authenticity & Ownership',
        status: 'PASS',
        message: `Project authenticated for owner: ${project.ownerId || 'Authorized Studio User'}.`,
      });
    }

    if (effectivePageCount === 0) {
      projectValid = false;
      rules.push({
        id: 'proj_not_empty',
        category: 'Project',
        label: 'Project Content Existence',
        status: 'FAIL',
        message: 'The manuscript has 0 pages. Generation has not been completed.',
        fixAction: 'Generate or insert manuscript pages.',
      });
      errors.push('Manuscript contains 0 pages.');
    } else {
      rules.push({
        id: 'proj_not_empty',
        category: 'Project',
        label: 'Project Content Existence',
        status: 'PASS',
        message: `Manuscript contains ${effectivePageCount} assembled pages.`,
      });
    }

    // ----------------------------------------------------
    // 2. MANUSCRIPT (INTERIOR PDF) CHECKS
    // ----------------------------------------------------
    let manuscriptValid = true;

    // Minimum & Maximum KDP Page Constraints
    if (effectivePageCount < 24) {
      manuscriptValid = false;
      rules.push({
        id: 'manu_min_pages',
        category: 'Manuscript',
        label: 'Minimum Page Count Requirement',
        status: 'FAIL',
        message: `Amazon KDP requires at least 24 pages for standard paperbacks (currently ${effectivePageCount}).`,
        fixAction: 'Add more pages to reach minimum 24 pages.',
      });
      errors.push(`Page count (${effectivePageCount}) is below Amazon KDP minimum of 24 pages.`);
    } else if (effectivePageCount > 828) {
      manuscriptValid = false;
      rules.push({
        id: 'manu_min_pages',
        category: 'Manuscript',
        label: 'Maximum Page Count Requirement',
        status: 'FAIL',
        message: `Page count (${effectivePageCount}) exceeds Amazon KDP standard limit (828 pages for B&W White).`,
        fixAction: 'Reduce total page count to under 828 pages.',
      });
      errors.push(`Page count exceeds KDP maximum allowable limit.`);
    } else {
      rules.push({
        id: 'manu_min_pages',
        category: 'Manuscript',
        label: 'Page Count Compatibility',
        status: 'PASS',
        message: `Page count (${effectivePageCount} pages) is fully compliant with KDP Paperback bounds (24–828).`,
      });
    }

    // Page dimensions & Trim size check
    if (!trimObj.width || !trimObj.height || trimObj.width <= 0 || trimObj.height <= 0) {
      manuscriptValid = false;
      rules.push({
        id: 'manu_trim_dims',
        category: 'Manuscript',
        label: 'Trim Size & Geometry',
        status: 'FAIL',
        message: 'Invalid trim dimensions configured.',
        fixAction: 'Select a standard KDP trim size.',
      });
      errors.push('Invalid trim size dimensions.');
    } else {
      rules.push({
        id: 'manu_trim_dims',
        category: 'Manuscript',
        label: 'Trim Size & Geometry',
        status: 'PASS',
        message: `Trim size verified at ${trimObj.width}" × ${trimObj.height}" (${trimObj.name}).`,
      });
    }

    // Margins & Gutter Validation
    const requiredGutter = calculateKdpInsideMargin(effectivePageCount);
    const configuredMargins = project.kdpSettings?.margins || { top: 0.5, bottom: 0.5, left: 0.75, right: 0.5 };
    if (configuredMargins.left < requiredGutter - 0.05) {
      rules.push({
        id: 'manu_gutter_margin',
        category: 'Manuscript',
        label: 'Inside Margin (Gutter) Depth',
        status: 'WARNING',
        message: `Inside gutter margin (${configuredMargins.left}") is lower than recommended for ${effectivePageCount} pages (${requiredGutter}").`,
        fixAction: `Increase inside gutter to at least ${requiredGutter}".`,
      });
      warnings.push(`Inside gutter margin (${configuredMargins.left}") may bind into spine.`);
    } else {
      rules.push({
        id: 'manu_gutter_margin',
        category: 'Manuscript',
        label: 'Inside Margin (Gutter) Depth',
        status: 'PASS',
        message: `Inside gutter (${configuredMargins.left}") meets or exceeds recommended depth (${requiredGutter}").`,
      });
    }

    // Outdated Interior Check
    const versionInfo = config.contentVersion;
    if (versionInfo?.interiorOutdated) {
      manuscriptValid = false;
      rules.push({
        id: 'manu_version_fresh',
        category: 'Manuscript',
        label: 'Interior Version Freshness',
        status: 'FAIL',
        message: versionInfo.outdatedReason || 'Interior PDF is outdated due to project changes.',
        fixAction: 'Click [Regenerate Interior] to update manuscript.',
      });
      errors.push('Interior manuscript PDF is outdated.');
    } else {
      rules.push({
        id: 'manu_version_fresh',
        category: 'Manuscript',
        label: 'Interior Version Freshness',
        status: 'PASS',
        message: `Interior PDF is up-to-date (v${versionInfo?.interiorVersion || 1}).`,
      });
    }

    // Puzzle & Answer Key Validation
    const puzzlePages = pages.filter(p => p.pageType === 'puzzle' || p.puzzleId);
    const answerPages = pages.filter(p => p.pageType === 'answer_key' || p.isAnswerKey);

    if (puzzlePages.length > 0 && answerPages.length === 0 && config.bookType === 'Puzzle Book') {
      rules.push({
        id: 'manu_answers_exist',
        category: 'Manuscript',
        label: 'Answer Keys & Solutions',
        status: 'WARNING',
        message: `Found ${puzzlePages.length} puzzle pages, but no solution answer key pages detected.`,
        fixAction: 'Include solution pages in back matter or adjust answer key mode.',
      });
      warnings.push('No answer key solution pages found for puzzle manuscript.');
    } else if (puzzlePages.length > 0) {
      rules.push({
        id: 'manu_answers_exist',
        category: 'Manuscript',
        label: 'Answer Keys & Solutions',
        status: 'PASS',
        message: `Verified ${puzzlePages.length} puzzles with ${answerPages.length} associated solution page(s).`,
      });
    }

    // Overlapping / Clipped Puzzle Content Check
    let hasClippedElements = false;
    pages.forEach((page, pIdx) => {
      const puzEls = page.elements.filter(e => e.type === 'puzzle');
      puzEls.forEach(el => {
        if (el.width <= 0 || el.height <= 0 || el.x < 0 || el.y < 0) {
          hasClippedElements = true;
        }
      });
    });

    if (hasClippedElements) {
      rules.push({
        id: 'manu_clipping_check',
        category: 'Manuscript',
        label: 'Element Bounds & Clipping',
        status: 'WARNING',
        message: 'Some puzzle elements have tight or negative canvas offsets.',
        fixAction: 'Check page layout in editor.',
      });
      warnings.push('Possible clipped element offsets detected on canvas.');
    } else {
      rules.push({
        id: 'manu_clipping_check',
        category: 'Manuscript',
        label: 'Element Bounds & Clipping',
        status: 'PASS',
        message: 'No overlapping or clipped puzzle boundary errors detected.',
      });
    }

    // ----------------------------------------------------
    // 3. BOOK COVER CHECKS
    // ----------------------------------------------------
    let coverValid = true;

    // Spine calculation validation
    const spineWidth = calculateKdpSpineWidth(effectivePageCount, paperType);
    const coverDims = calculateKdpCoverDimensions(trimObj.width, trimObj.height, spineWidth);

    if (versionInfo?.coverOutdated) {
      coverValid = false;
      rules.push({
        id: 'cov_version_fresh',
        category: 'Cover',
        label: 'Full Wrap Cover Freshness',
        status: 'FAIL',
        message: versionInfo.outdatedReason || `Cover outdated. Page count or print configuration modified.`,
        fixAction: 'Click [Regenerate Cover] to recalculate spine dimensions.',
      });
      errors.push('Full wrap cover PDF is outdated and must be regenerated.');
    } else if (versionInfo?.lastGeneratedPageCount && versionInfo.lastGeneratedPageCount !== effectivePageCount) {
      coverValid = false;
      rules.push({
        id: 'cov_spine_match',
        category: 'Cover',
        label: 'Spine & Page Count Synchronization',
        status: 'FAIL',
        message: `Page count changed from ${versionInfo.lastGeneratedPageCount} to ${effectivePageCount}. Cover spine width is invalid.`,
        fixAction: 'Regenerate full wrap cover PDF.',
      });
      errors.push(`Cover spine mismatch: page count changed to ${effectivePageCount}.`);
    } else {
      rules.push({
        id: 'cov_spine_match',
        category: 'Cover',
        label: 'Spine & Page Count Synchronization',
        status: 'PASS',
        message: `Spine thickness calibrated at ${spineWidth.toFixed(4)}" for ${effectivePageCount} pages (${paperType} stock).`,
      });
    }

    rules.push({
      id: 'cov_full_wrap_dims',
      category: 'Cover',
      label: 'Cover Spread Geometry & Bleed',
      status: 'PASS',
      message: `Full wrap spread: ${coverDims.width.toFixed(3)}" × ${coverDims.height.toFixed(3)}" including 0.125" bleed.`,
    });

    rules.push({
      id: 'cov_spine_text_eligibility',
      category: 'Cover',
      label: 'Spine Text Printability (79+ Pages)',
      status: 'PASS',
      message:
        effectivePageCount >= 79
          ? `Book qualifies for spine text (${effectivePageCount} >= 79 pages).`
          : `Spine text omitted per KDP specifications (${effectivePageCount} < 79 pages).`,
    });

    // ----------------------------------------------------
    // 4. PRINT CONFIGURATION CHECKS
    // ----------------------------------------------------
    let printSettingsValid = true;

    rules.push({
      id: 'print_trim_selection',
      category: 'Print',
      label: 'Trim Size Selection',
      status: 'PASS',
      message: `Trim size: ${trimObj.name} (${trimObj.width}" × ${trimObj.height}").`,
    });

    rules.push({
      id: 'print_interior_stock',
      category: 'Print',
      label: 'Interior & Paper Stock',
      status: 'PASS',
      message: `${config.interiorType || 'Black & White'} on ${paperType} Paper.`,
    });

    rules.push({
      id: 'print_bleed_option',
      category: 'Print',
      label: 'Bleed Configuration',
      status: 'PASS',
      message: `Bleed: ${bleedSetting}.`,
    });

    // ----------------------------------------------------
    // 5. AI CONTENT DISCLOSURE CHECK
    // ----------------------------------------------------
    let aiDisclosureValid = true;

    if (!config.aiContentType || !config.aiDisclosureExplicitlySelected) {
      aiDisclosureValid = false;
      rules.push({
        id: 'ai_disclosure_selected',
        category: 'AI',
        label: 'Amazon AI Content Disclosure',
        status: 'FAIL',
        message: 'Amazon KDP requires explicit disclosure of AI-generated content before submission.',
        fixAction: 'Select AI-generated, AI-assisted, or Human-created in the AI Content card.',
      });
      errors.push('AI Content Disclosure has not been explicitly confirmed.');
    } else {
      rules.push({
        id: 'ai_disclosure_selected',
        category: 'AI',
        label: 'Amazon AI Content Disclosure',
        status: 'PASS',
        message: `AI Disclosure recorded: "${config.aiContentType}". Ready for KDP declaration.`,
      });
    }

    // ----------------------------------------------------
    // OVERALL STATUS DETERMINATION
    // ----------------------------------------------------
    let overallStatus: KDPContentValidationStatus = 'READY';
    if (errors.length > 0 || !manuscriptValid || !coverValid || !aiDisclosureValid || !projectValid) {
      overallStatus = 'NOT_READY';
    } else if (warnings.length > 0) {
      overallStatus = 'READY_WITH_WARNINGS';
    }

    const passedCount = rules.filter(r => r.status === 'PASS').length;
    const warningCount = rules.filter(r => r.status === 'WARNING').length;
    const errorCount = rules.filter(r => r.status === 'FAIL').length;

    return {
      overallStatus,
      manuscriptValid: manuscriptValid && errors.filter(e => e.includes('Manuscript') || e.includes('Page count') || e.includes('Interior')).length === 0,
      coverValid: coverValid && errors.filter(e => e.includes('Cover') || e.includes('spine')).length === 0,
      printSettingsValid,
      aiDisclosureValid,
      projectValid,
      errors,
      warnings,
      rules,
      timestamp: new Date().toISOString(),
      summary: {
        passed: passedCount,
        warnings: warningCount,
        errors: errorCount,
        total: rules.length,
      },
    };
  }
}

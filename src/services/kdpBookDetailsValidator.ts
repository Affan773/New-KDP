import { KDPProjectConfig, KDPBookDetailsValidationReport } from '../types/kdp';
import { DocumentModel, Project } from '../types/project';
import { KDPMetadataConsistencyService } from './kdpMetadataConsistencyService';
import { KDPTitleGenerator } from './kdpTitleGenerator';
import { KDPSubtitleGenerator } from './kdpSubtitleGenerator';
import { KDPDescriptionGenerator } from './kdpDescriptionGenerator';
import { KDPKeywordGenerator } from './kdpKeywordGenerator';

export class KDPBookDetailsValidator {
  /**
   * Validates all KDP Book Details and outputs a full pre-flight audit report
   */
  public static validateBookDetails(
    project: Project,
    document?: DocumentModel | null,
    existingProjects: Project[] = []
  ): KDPBookDetailsValidationReport {
    const checks: KDPBookDetailsValidationReport['checks'] = [];
    const errors: string[] = [];
    const warnings: string[] = [];
    const config: Partial<KDPProjectConfig> = project.kdpConfig || {};
    const meta = project.metadata || {};

    const consistency = KDPMetadataConsistencyService.checkConsistency(project, document, existingProjects);

    // Track completed criteria for percentage calculation
    let completedPoints = 0;
    const totalPoints = 10;

    // 1. Title Check
    const title = (config.title || project.name || '').trim();
    const existingTitles = existingProjects.filter(p => p.id !== project.id).map(p => p.name || '');
    const titleVal = KDPTitleGenerator.validateTitle(title, existingTitles);

    if (!titleVal.isValid) {
      checks.push({
        field: 'title',
        label: 'Book Title',
        status: 'FAIL',
        message: titleVal.errors.join('; '),
      });
      errors.push(...titleVal.errors);
    } else if (titleVal.warnings.length > 0) {
      checks.push({
        field: 'title',
        label: 'Book Title',
        status: 'WARNING',
        message: titleVal.warnings.join('; '),
      });
      warnings.push(...titleVal.warnings);
      completedPoints += 1;
    } else {
      checks.push({
        field: 'title',
        label: 'Book Title',
        status: 'PASS',
        message: `Valid title: "${title}"`,
      });
      completedPoints += 1;
    }

    // 2. Subtitle Check (Optional but validated if present)
    const subtitle = (config.subtitle || meta.subtitle || '').trim();
    if (subtitle) {
      const subVal = KDPSubtitleGenerator.validateSubtitle(subtitle);
      if (!subVal.isValid) {
        checks.push({
          field: 'subtitle',
          label: 'Subtitle',
          status: 'FAIL',
          message: subVal.errors.join('; '),
        });
        errors.push(...subVal.errors);
      } else {
        checks.push({
          field: 'subtitle',
          label: 'Subtitle',
          status: 'PASS',
          message: `Valid subtitle (${subtitle.length} chars)`,
        });
      }
    } else {
      checks.push({
        field: 'subtitle',
        label: 'Subtitle',
        status: 'PASS',
        message: 'No subtitle provided (optional).',
      });
    }
    completedPoints += 1;

    // 3. Author / Creator Check
    const author = (config.authorName || meta.author || '').trim();
    if (!author) {
      checks.push({
        field: 'author',
        label: 'Author / Imprint Name',
        status: 'FAIL',
        message: 'Primary author name is required.',
      });
      errors.push('Author name is required.');
    } else if (author.length < 2) {
      checks.push({
        field: 'author',
        label: 'Author / Imprint Name',
        status: 'FAIL',
        message: 'Author name must have at least 2 characters.',
      });
      errors.push('Author name is too short.');
    } else {
      checks.push({
        field: 'author',
        label: 'Author / Imprint Name',
        status: 'PASS',
        message: `Author set to "${author}".`,
      });
      completedPoints += 1;
    }

    // 4. Description Check
    const desc = (config.description || meta.description || '').trim();
    const descVal = KDPDescriptionGenerator.validateDescription(desc, consistency.detectedPuzzleCount);
    if (!descVal.isValid) {
      checks.push({
        field: 'description',
        label: 'Book Description',
        status: 'FAIL',
        message: descVal.errors.join('; '),
      });
      errors.push(...descVal.errors);
    } else if (descVal.warnings.length > 0) {
      checks.push({
        field: 'description',
        label: 'Book Description',
        status: 'WARNING',
        message: descVal.warnings.join('; '),
      });
      warnings.push(...descVal.warnings);
      completedPoints += 1;
    } else {
      checks.push({
        field: 'description',
        label: 'Book Description',
        status: 'PASS',
        message: `Ready (${desc.length} chars, matches content specs).`,
      });
      completedPoints += 1;
    }

    // 5. Keywords Check
    const keywords = config.keywords || [];
    const keyVal = KDPKeywordGenerator.evaluateAllKeywords(keywords);
    if (keyVal.overallQuality === 'INVALID') {
      checks.push({
        field: 'keywords',
        label: 'Search Keywords',
        status: 'FAIL',
        message: keyVal.warnings.join('; '),
      });
      errors.push(...keyVal.warnings);
    } else if (keyVal.validCount < 4) {
      checks.push({
        field: 'keywords',
        label: 'Search Keywords',
        status: 'WARNING',
        message: `${keyVal.validCount}/7 slots filled. Adding more improves discovery.`,
      });
      warnings.push('Fewer than 4 keywords configured.');
      completedPoints += 0.5;
    } else {
      checks.push({
        field: 'keywords',
        label: 'Search Keywords',
        status: 'PASS',
        message: `${keyVal.validCount} valid keyword slots configured.`,
      });
      completedPoints += 1;
    }

    // 6. Categories Check
    const categories = config.categories || [];
    if (categories.length === 0) {
      checks.push({
        field: 'categories',
        label: 'KDP Categories',
        status: 'FAIL',
        message: 'At least one category is required for Amazon KDP catalog placement.',
      });
      errors.push('No KDP category selected.');
    } else {
      checks.push({
        field: 'categories',
        label: 'KDP Categories',
        status: 'PASS',
        message: `${categories.length} category classification(s) selected.`,
      });
      completedPoints += 1;
    }

    // 7. Publishing Language Check
    const language = (config.language || 'English').trim();
    if (!language) {
      checks.push({
        field: 'language',
        label: 'Publishing Language',
        status: 'FAIL',
        message: 'Language must be specified.',
      });
      errors.push('Language is required.');
    } else {
      checks.push({
        field: 'language',
        label: 'Publishing Language',
        status: 'PASS',
        message: `Language set to ${language}.`,
      });
      completedPoints += 1;
    }

    // 8. AI Content Disclosure Check
    const aiContent = config.aiContentType;
    if (!aiContent) {
      checks.push({
        field: 'aiContentType',
        label: 'AI Content Disclosure',
        status: 'FAIL',
        message: 'Amazon KDP mandatory AI Content declaration is required.',
      });
      errors.push('AI Content Disclosure is required by Amazon.');
    } else {
      checks.push({
        field: 'aiContentType',
        label: 'AI Content Disclosure',
        status: 'PASS',
        message: `Declared as "${aiContent}".`,
      });
      completedPoints += 1;
    }

    // 9. Consistency Engine Pass Check
    if (!consistency.isConsistent) {
      const consistencyErrors = consistency.checks
        .filter(c => c.severity === 'ERROR' && !c.passed)
        .map(c => c.message);
      checks.push({
        field: 'consistency',
        label: 'Metadata Consistency Engine',
        status: 'FAIL',
        message: consistencyErrors.join('; '),
      });
      errors.push(...consistencyErrors);
    } else {
      checks.push({
        field: 'consistency',
        label: 'Metadata Consistency Engine',
        status: 'PASS',
        message: 'All metadata matches manuscript, cover, and puzzle counts.',
      });
      completedPoints += 1;
    }

    // 10. User Approval Check
    const approval = config.metadataApprovalStatus || 'DRAFT';
    if (approval !== 'APPROVED') {
      checks.push({
        field: 'approvalStatus',
        label: 'User Approval Status',
        status: 'WARNING',
        message: `Current status is ${approval}. Final review and user approval required before publishing.`,
      });
      warnings.push('Metadata requires user review and approval.');
      completedPoints += 0.5;
    } else {
      checks.push({
        field: 'approvalStatus',
        label: 'User Approval Status',
        status: 'PASS',
        message: 'User-approved and verified for KDP submission.',
      });
      completedPoints += 1;
    }

    // Calculate Completion Percentage
    const completionPercentage = Math.min(100, Math.round((completedPoints / totalPoints) * 100));

    // Overall Status
    let overallStatus: 'PASS' | 'WARNING' | 'FAIL' = 'PASS';
    if (errors.length > 0) {
      overallStatus = 'FAIL';
    } else if (warnings.length > 0 || approval !== 'APPROVED') {
      overallStatus = 'WARNING';
    }

    return {
      overallStatus,
      completionPercentage,
      errors,
      warnings,
      checks,
      consistency,
      timestamp: new Date().toISOString(),
    };
  }
}

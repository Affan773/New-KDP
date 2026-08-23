import { KDPProjectConfig } from '../types/kdp';
import { Project } from '../types/project';

export interface KDPFieldMapping {
  // 1. Details
  title: string;
  subtitle: string;
  author: string;
  contributors: string;
  description: string;
  keywords: string[];
  keywordsCommaSeparated: string;
  categories: string[];
  primaryCategory: string;
  language: string;
  seriesName: string;
  editionNumber: string;
  publishingRights: string;
  explicitImages: boolean;

  // 2. Content
  isbnType: string;
  customIsbn: string;
  publicationDate: string;
  interiorType: string;
  paperType: string;
  trimSize: string;
  bleed: string;
  coverFinish: string;
  pageCount: number;
  aiContentDisclosure: string;
  aiGeneratedText: boolean;
  aiGeneratedImages: boolean;
  aiTranslation: boolean;

  // 3. Pricing
  primaryMarketplace: string;
  listPriceUSD: number;
  expandedDistribution: boolean;
}

export class KDPFieldMapper {
  /**
   * Maps internal project and configuration state to official KDP fields
   */
  public static mapProjectToKDP(project: Project): KDPFieldMapping {
    const config: Partial<KDPProjectConfig> = project.kdpConfig || {};
    const meta = project.metadata || {};
    const effectivePages = project.pageCount || config.pageCount || 80;
    const rawKeywords = config.keywords || meta.keywords || [];
    const sanitizedKeywords = rawKeywords.filter(k => Boolean(k && k.trim())).slice(0, 7);

    const isAiContent = config.aiContentType === 'AI-generated' || config.aiContentType === 'AI-assisted';

    return {
      // 1. Details
      title: config.title || project.name || '',
      subtitle: config.subtitle || meta.subtitle || '',
      author: config.authorName || meta.author || 'Independent Creator',
      contributors: config.contributorName || '',
      description: config.description || meta.description || project.description || '',
      keywords: sanitizedKeywords,
      keywordsCommaSeparated: sanitizedKeywords.join(', '),
      categories: config.categories && config.categories.length > 0 ? config.categories : [meta.category || 'Activity & Puzzle Books'],
      primaryCategory: (config.categories && config.categories[0]) || meta.category || 'Nonfiction / Activity Books',
      language: config.language || meta.language || 'English',
      seriesName: meta.seriesName || '',
      editionNumber: meta.edition || '1',
      publishingRights: 'I hold the copyright and own the publishing rights for this work.',
      explicitImages: false,

      // 2. Content
      isbnType: config.isbnType || 'Free KDP ISBN',
      customIsbn: config.isbn || meta.isbn || '',
      publicationDate: new Date().toISOString().split('T')[0],
      interiorType: config.interiorType || 'Black & White',
      paperType: config.paperType || 'White',
      trimSize: config.trimSize || project.kdpSettings?.trimSize?.name || '8.5" × 11"',
      bleed: config.bleed || project.kdpSettings?.bleed || 'No Bleed',
      coverFinish: config.coverFinish || 'Matte',
      pageCount: effectivePages,
      aiContentDisclosure: config.aiContentType || 'Human-created',
      aiGeneratedText: isAiContent,
      aiGeneratedImages: false,
      aiTranslation: false,

      // 3. Pricing
      primaryMarketplace: config.marketplace || 'amazon.com',
      listPriceUSD: 9.99,
      expandedDistribution: true,
    };
  }

  /**
   * Helper to format a copy-ready block for the user's clipboard matching official KDP Bookshelf structure
   */
  public static formatSummaryForClipboard(project: Project): string {
    const config: Partial<KDPProjectConfig> = project.kdpConfig || {};
    const meta = project.metadata || {};
    const mapping = this.mapProjectToKDP(project);

    const seriesText = config.isPartOfSeries && config.seriesName
      ? `${config.seriesName}${config.seriesNumber ? ` (Book #${config.seriesNumber})` : ''}`
      : 'Not part of a series';

    const editionText = config.editionNumber
      ? `Edition ${config.editionNumber}${config.editionNotes ? ` (${config.editionNotes})` : ''}`
      : 'Not specified (Standard Edition)';

    const contributorText = config.contributorName
      ? `${config.contributorName} (${config.contributorType || 'Contributor'})`
      : 'None';

    const keywordsText = (config.keywords && config.keywords.length > 0)
      ? config.keywords.map((k, i) => `${i + 1}. ${k}`).join('\n')
      : 'None configured';

    const categoriesText = (config.categories && config.categories.length > 0)
      ? config.categories.map((c, i) => `${i + 1}. ${c}`).join('\n')
      : '1. Activity & Puzzle Books';

    return `=== AMAZON KDP BOOK DETAILS ===

TITLE:
${mapping.title}

SUBTITLE:
${mapping.subtitle || 'None'}

AUTHOR:
${mapping.author}

CONTRIBUTORS:
${contributorText}

DESCRIPTION:
${mapping.description}

LANGUAGE:
${mapping.language}

KEYWORDS:
${keywordsText}

CATEGORIES:
${categoriesText}

READING AGE:
${config.readingAge || 'Not specified'}

GRADE RANGE:
${config.gradeRange || 'Not specified'}

SERIES:
${seriesText}

EDITION:
${editionText}

AI CONTENT:
${config.aiContentType || 'Human-created'}
`;
  }
}


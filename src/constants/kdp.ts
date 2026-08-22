import { MarginConfig, Orientation, TrimSize } from '../types';
import {
  KDPAiContentType,
  KDPBleed,
  KDPBookType,
  KDPCoverFinish,
  KDPFormat,
  KDPInteriorType,
  KDPIsbnType,
  KDPPaperType,
  KDPProjectConfig,
  KDPPublicationStatus,
  KDPValidationStatus,
} from '../types/kdp';
import { Project } from '../types/project';

export const STANDARD_TRIM_SIZES: TrimSize[] = [
  {
    id: '8.5x11',
    name: '8.5" × 11"',
    width: 8.5,
    height: 11,
    isPopular: true,
    category: 'Large',
  },
  {
    id: '6x9',
    name: '6" × 9"',
    width: 6,
    height: 9,
    isPopular: true,
    category: 'Standard',
  },
  {
    id: '8x10',
    name: '8" × 10"',
    width: 8,
    height: 10,
    isPopular: true,
    category: 'Standard',
  },
  {
    id: '7x10',
    name: '7" × 10"',
    width: 7,
    height: 10,
    isPopular: false,
    category: 'Standard',
  },
  {
    id: '5.5x8.5',
    name: '5.5" × 8.5"',
    width: 5.5,
    height: 8.5,
    isPopular: false,
    category: 'Pocket',
  },
  {
    id: '5.25x8',
    name: '5.25" × 8"',
    width: 5.25,
    height: 8,
    isPopular: false,
    category: 'Pocket',
  },
  {
    id: '5x8',
    name: '5" × 8"',
    width: 5,
    height: 8,
    isPopular: false,
    category: 'Pocket',
  },
  {
    id: '8.25x8.25',
    name: '8.25" × 8.25"',
    width: 8.25,
    height: 8.25,
    isPopular: false,
    category: 'Standard',
  },
  {
    id: '8.25x6',
    name: '8.25" × 6"',
    width: 8.25,
    height: 6,
    isPopular: false,
    category: 'Standard',
  },
];

export const KDP_BOOK_TYPES: { id: KDPBookType; label: string; description: string }[] = [
  {
    id: 'Puzzle Book',
    label: 'Puzzle Book',
    description: 'Word searches, crosswords, sudokus, cryptograms, mazes with solution answer keys.',
  },
  {
    id: 'Activity Book',
    label: 'Activity Book',
    description: 'Mixed variety challenges, dot-to-dot, word scramble, and educational games.',
  },
  {
    id: 'Coloring Book',
    label: 'Coloring Book',
    description: 'Full-bleed or framed line art, mandalas, patterns, and creative illustrations.',
  },
  {
    id: 'Workbook',
    label: 'Workbook',
    description: 'Curriculum-aligned practice sheets, study guides, and prompt workbooks.',
  },
  {
    id: 'Other',
    label: 'Other Book Format',
    description: 'Journals, planners, notebooks, logbooks, and custom layout manuscripts.',
  },
];

export const KDP_FORMATS: { id: KDPFormat; label: string; minPages: number; description: string }[] = [
  {
    id: 'Paperback',
    label: 'Paperback (Softcover)',
    minPages: 24,
    description: 'Amazon KDP Print-on-Demand standard perfect binding. Requires 24–828 pages.',
  },
  {
    id: 'Hardcover',
    label: 'Hardcover (Case Laminate)',
    minPages: 72,
    description: 'Amazon KDP Case Laminate hardcover binding. Requires 72–550 pages.',
  },
];

export const KDP_INTERIOR_TYPES: { id: KDPInteriorType; label: string; description: string }[] = [
  {
    id: 'Black & White',
    label: 'Black & White Interior',
    description: 'Economical high-contrast monochrome printing suitable for puzzle grids and text.',
  },
  {
    id: 'Standard Color',
    label: 'Standard Color Interior',
    description: 'Cost-effective 4-color ink suited for activity books, diagrams, and light illustrations.',
  },
  {
    id: 'Premium Color',
    label: 'Premium Color Interior',
    description: 'Rich, vivid photographic-grade color printing with heavy saturation.',
  },
];

export const KDP_PAPER_TYPES: { id: KDPPaperType; label: string; multiplier: number; description: string }[] = [
  {
    id: 'White',
    label: 'White Paper',
    multiplier: 0.002252,
    description: 'Crisp white 50-61 lb paper. Standard choice for puzzle & activity books.',
  },
  {
    id: 'Cream',
    label: 'Cream Paper',
    multiplier: 0.0025,
    description: 'Warm cream 50-61 lb paper. Ideal for novels, journals, and vintage editions.',
  },
  {
    id: 'Color-compatible option',
    label: 'Color Paper (60-70 lb)',
    multiplier: 0.002347,
    description: 'Heavyweight smooth white paper optimized for color interior ink absorption.',
  },
];

export const KDP_BLEED_OPTIONS: { id: KDPBleed; label: string; description: string }[] = [
  {
    id: 'No Bleed',
    label: 'No Bleed',
    description: 'Elements stay safely inside the 0.25"–0.375" margin margins (Standard for puzzles).',
  },
  {
    id: 'Bleed',
    label: 'Bleed (0.125" trim overflow)',
    description: 'Background illustrations extend 0.125" past the outer trim edge to prevent white edges.',
  },
];

export const KDP_COVER_FINISHES: { id: KDPCoverFinish; label: string; description: string }[] = [
  {
    id: 'Matte',
    label: 'Matte Finish',
    description: 'Soft, non-reflective velvety texture. Sophisticated and modern.',
  },
  {
    id: 'Glossy',
    label: 'Glossy Finish',
    description: 'High-shine, vibrant finish that enhances color saturation and resists fingerprints.',
  },
];

export const KDP_AI_CONTENT_OPTIONS: {
  id: KDPAiContentType;
  label: string;
  badge: string;
  description: string;
}[] = [
  {
    id: 'AI-generated',
    label: 'AI-generated Content',
    badge: 'AI Created',
    description:
      'Content (text, puzzle vocabulary, or illustrations) created using generative AI tools like Gemini.',
  },
  {
    id: 'AI-assisted',
    label: 'AI-assisted Content',
    badge: 'AI Assisted',
    description:
      'Human-authored content that was brainstormed, edited, refined, or spellchecked using AI tools.',
  },
  {
    id: 'Human-created',
    label: 'Human-created Content',
    badge: 'Human Only',
    description:
      'Entirely authored and illustrated by human creators with zero generative AI generation.',
  },
];

export const KDP_ISBN_TYPES: { id: KDPIsbnType; label: string; description: string }[] = [
  {
    id: 'Free KDP ISBN',
    label: 'Free Amazon KDP ISBN',
    description: 'Amazon assigns an ISBN automatically at publication time at no cost.',
  },
  {
    id: 'Custom ISBN',
    label: 'Use My Own ISBN',
    description: 'Provide an ISBN registered under your own publishing imprint (e.g. from Bowker).',
  },
  {
    id: 'No ISBN',
    label: 'No ISBN (Low-Content Books)',
    description: 'Publish without an ISBN if allowed for low-content notebooks or planners.',
  },
];

export const KDP_MARKETPLACES: { id: string; name: string; currency: string }[] = [
  { id: 'amazon.com', name: 'Amazon.com (United States)', currency: 'USD' },
  { id: 'amazon.co.uk', name: 'Amazon.co.uk (United Kingdom)', currency: 'GBP' },
  { id: 'amazon.de', name: 'Amazon.de (Germany / EU)', currency: 'EUR' },
  { id: 'amazon.fr', name: 'Amazon.fr (France)', currency: 'EUR' },
  { id: 'amazon.es', name: 'Amazon.es (Spain)', currency: 'EUR' },
  { id: 'amazon.it', name: 'Amazon.it (Italy)', currency: 'EUR' },
  { id: 'amazon.ca', name: 'Amazon.ca (Canada)', currency: 'CAD' },
  { id: 'amazon.com.au', name: 'Amazon.com.au (Australia)', currency: 'AUD' },
  { id: 'amazon.co.jp', name: 'Amazon.co.jp (Japan)', currency: 'JPY' },
];

export const DEFAULT_MARGINS: MarginConfig = {
  top: 0.5,
  bottom: 0.5,
  left: 0.625, // Inside gutter for ~100-150 pages
  right: 0.375, // Outside margin
};

/**
 * Calculates Amazon KDP minimum inside margin (gutter) based on page count.
 */
export function calculateKdpInsideMargin(pageCount: number): number {
  if (pageCount <= 150) return 0.375;
  if (pageCount <= 300) return 0.5;
  if (pageCount <= 500) return 0.625;
  if (pageCount <= 700) return 0.75;
  return 0.875;
}

/**
 * Amazon KDP Spine Width Calculation Formulas:
 * White Paper: pageCount * 0.002252 inches
 * Cream Paper: pageCount * 0.0025 inches
 * Premium Color: pageCount * 0.002347 inches
 * Standard Color: pageCount * 0.002252 inches
 */
export function calculateKdpSpineWidth(
  pageCount: number,
  paperType: 'White' | 'Cream' | 'Premium Color' | 'Standard Color' | 'Color-compatible option' = 'White'
): number {
  const multipliers: Record<string, number> = {
    White: 0.002252,
    Cream: 0.0025,
    'Premium Color': 0.002347,
    'Standard Color': 0.002252,
    'Color-compatible option': 0.002347,
  };

  const multiplier = multipliers[paperType] || 0.002252;
  const spine = pageCount * multiplier;
  return Math.round(spine * 1000) / 1000;
}

/**
 * Amazon KDP Full Wrap Paperback Cover Dimensions Calculation
 * Width = (2 * Trim Width) + Spine Width + (2 * 0.125" bleed)
 * Height = Trim Height + (2 * 0.125" bleed)
 */
export function calculateKdpCoverDimensions(
  trimWidth: number,
  trimHeight: number,
  spineWidth: number
): { width: number; height: number } {
  const bleed = 0.125;
  const fullWidth = 2 * trimWidth + spineWidth + 2 * bleed;
  const fullHeight = trimHeight + 2 * bleed;

  return {
    width: Math.round(fullWidth * 1000) / 1000,
    height: Math.round(fullHeight * 1000) / 1000,
  };
}

/**
 * Convert inches to screen canvas pixels at reference scale (default 96 DPI for crisp editing).
 */
export function inchesToPixels(inches: number, dpi: number = 96): number {
  return Math.round(inches * dpi);
}

export function pixelsToInches(pixels: number, dpi: number = 96): number {
  return Math.round((pixels / dpi) * 1000) / 1000;
}

/**
 * Find trim size object by ID or name
 */
export function findTrimSize(idOrName: string): TrimSize {
  const normalized = idOrName.toLowerCase().replace(/[^a-z0-9.]/g, '');
  const found = STANDARD_TRIM_SIZES.find(
    t =>
      t.id.toLowerCase().replace(/[^a-z0-9.]/g, '') === normalized ||
      t.name.toLowerCase().replace(/[^a-z0-9.]/g, '') === normalized
  );
  return (
    found || {
      id: '8.5x11',
      name: '8.5" × 11"',
      width: 8.5,
      height: 11,
      isPopular: true,
      category: 'Large',
    }
  );
}

/**
 * Creates or synchronizes a complete, robust KDPProjectConfig for any project
 */
export function createDefaultKdpConfig(project?: Partial<Project>): KDPProjectConfig {
  const now = new Date().toISOString();
  const title = project?.name || 'Untitled KDP Puzzle Book';
  const description =
    project?.metadata?.description ||
    project?.description ||
    'Enjoy hours of brain-teasing fun and mental relaxation with this carefully crafted collection of high-quality puzzles. Includes complete solutions in the back.';
  const authorName = project?.metadata?.author || 'KDP Puzzle Creator';
  const subtitle =
    project?.metadata?.subtitle || 'Challenging & Relaxing Brain Games with Complete Solutions';
  const trimSizeStr = project?.kdpSettings?.trimSize?.name || '8.5" × 11"';
  const pageCount = project?.pageCount || 80;
  const keywords = project?.metadata?.keywords?.length
    ? project.metadata.keywords
    : [
        'puzzle book for adults',
        'word search with solutions',
        'brain games and mind exercises',
        'large print activity book',
        'relaxing daily puzzles',
      ];
  const categories = project?.metadata?.category
    ? [project.metadata.category]
    : ['Games & Activities / Puzzles', 'Self-Help / Brain Fitness'];

  // Infer book type
  let bookType: KDPBookType = 'Puzzle Book';
  if (project?.type === 'Coloring Book') bookType = 'Coloring Book';
  else if (project?.type === 'Activity Book') bookType = 'Activity Book';
  else if (project?.type === 'Custom Book' || project?.type === 'Journal' || project?.type === 'Planner')
    bookType = 'Other';

  return {
    bookId: project?.id || `book-${Date.now()}`,
    title,
    subtitle,
    authorName,
    contributorName: '',
    language: project?.metadata?.language || 'English',
    description,
    keywords,
    categories,
    bookType,
    format: 'Paperback',
    trimSize: trimSizeStr,
    pageCount,
    interiorType: 'Black & White',
    paperType: (project?.kdpSettings?.paperType as any) === 'Cream' ? 'Cream' : 'White',
    bleed: project?.kdpSettings?.bleed === 'Bleed' ? 'Bleed' : 'No Bleed',
    coverFinish: 'Matte',
    isbnType: 'Free KDP ISBN',
    isbn: project?.metadata?.isbn || '',
    aiContentType: 'AI-generated',
    marketplace: 'amazon.com',
    publicationStatus: 'DRAFT',
    validationStatus: 'NOT_VALIDATED',
    validationErrors: [],
    validationWarnings: [],
    createdAt: project?.createdAt || now,
    updatedAt: now,
  };
}

export type KDPBookType =
  | 'Puzzle Book'
  | 'Activity Book'
  | 'Coloring Book'
  | 'Workbook'
  | 'Other';

export type KDPFormat = 'Paperback' | 'Hardcover';

export type KDPInteriorType = 'Black & White' | 'Premium Color' | 'Standard Color';

export type KDPPaperType = 'White' | 'Cream' | 'Color-compatible option';

export type KDPBleed = 'No Bleed' | 'Bleed';

export type KDPCoverFinish = 'Matte' | 'Glossy';

export type KDPIsbnType = 'Free KDP ISBN' | 'Custom ISBN' | 'No ISBN';

export type KDPAiContentType = 'AI-generated' | 'AI-assisted' | 'Human-created';

export type KDPValidationStatus = 'PASS' | 'WARNING' | 'FAIL' | 'NOT_VALIDATED';

export type KDPPublicationStatus =
  | 'DRAFT'
  | 'METADATA_READY'
  | 'VALIDATION_REQUIRED'
  | 'VALIDATION_FAILED'
  | 'READY_WITH_WARNINGS'
  | 'KDP_READY'
  | 'EXPORTED';

export type KDPCheckCategory =
  | 'Project'
  | 'Metadata'
  | 'Print'
  | 'AI'
  | 'Files'
  | 'Puzzle Quality';

export interface KDPCheckItem {
  id: string;
  category: KDPCheckCategory;
  name: string;
  status: 'PASS' | 'WARNING' | 'FAIL';
  message: string;
  details?: string;
  fixAction?: string;
}

export interface KDPPreflightReport {
  status: 'PASS' | 'WARNING' | 'FAIL';
  overallStatus: KDPPublicationStatus;
  errors: string[];
  warnings: string[];
  checks: KDPCheckItem[];
  timestamp: string;
  summary: {
    passed: number;
    warnings: number;
    errors: number;
    total: number;
  };
}

export interface KDPProjectConfig {
  bookId: string;
  title: string;
  subtitle: string;
  authorName: string;
  contributorName?: string;
  language: string;
  description: string;
  keywords: string[];
  categories: string[];
  bookType: KDPBookType;
  format: KDPFormat;
  trimSize: string; // e.g. '8.5x11' or '8.5" × 11"'
  pageCount: number;
  interiorType: KDPInteriorType;
  paperType: KDPPaperType;
  bleed: KDPBleed;
  coverFinish: KDPCoverFinish;
  isbnType: KDPIsbnType;
  isbn?: string;
  aiContentType: KDPAiContentType;
  marketplace: string;
  publicationStatus: KDPPublicationStatus;
  validationStatus: KDPValidationStatus;
  validationErrors: string[];
  validationWarnings: string[];
  // Phase 3: Content-First Engine Extensions
  aiDisclosureExplicitlySelected?: boolean;
  // Phase 4: Book Details Engine Extensions
  contributorType?: KDPContributorType;
  isPartOfSeries?: boolean;
  seriesName?: string;
  seriesNumber?: string;
  editionNumber?: string;
  editionNotes?: string;
  readingAge?: string;
  gradeRange?: string;
  metadataApprovalStatus?: KDPMetadataApprovalStatus;
  metadataVersions?: KDPMetadataVersionRecord[];
  contentVersion?: {
    interiorVersion: number;
    coverVersion: number;
    printConfigVersion: number;
    interiorOutdated?: boolean;
    coverOutdated?: boolean;
    lastGeneratedPageCount?: number;
    lastGeneratedTrimSize?: string;
    lastGeneratedBleed?: string;
    lastGeneratedPaperType?: string;
    lastGeneratedInteriorType?: string;
    lastGeneratedFormat?: string;
    outdatedReason?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export type KDPContributorType =
  | 'Author'
  | 'Illustrator'
  | 'Editor'
  | 'Translator'
  | 'Other';

export type KDPMetadataApprovalStatus = 'DRAFT' | 'REVIEW' | 'APPROVED';

export interface KDPMetadataVersionRecord {
  id: string;
  versionNumber: number;
  timestamp: string;
  title: string;
  subtitle: string;
  author: string;
  contributorType?: KDPContributorType;
  contributorName?: string;
  description: string;
  keywords: string[];
  categories: string[];
  seriesName?: string;
  seriesNumber?: string;
  editionNumber?: string;
  editionNotes?: string;
  language: string;
  readingAge?: string;
  gradeRange?: string;
  aiContentType: KDPAiContentType;
  approvalStatus: KDPMetadataApprovalStatus;
  userNotes?: string;
}

export interface KDPTitleSuggestion {
  title: string;
  subtitle: string;
  reason: string;
  score: number;
  style: 'Direct & Descriptive' | 'Punchy & Engaging' | 'Theme Focused' | 'Difficulty Focused' | 'Volume / Count Focused';
}

export interface KDPSubtitleSuggestion {
  subtitle: string;
  reason: string;
  focus: string;
}

export interface KDPCategorySuggestion {
  name: string;
  path: string;
  reason: string;
  confidence: number;
  isKdpStandard: boolean;
}

export interface KDPKeywordItem {
  text: string;
  quality: 'GOOD' | 'REVIEW' | 'INVALID';
  charCount: number;
  reason?: string;
  isCompetitorRisk?: boolean;
}

export interface KDPMetadataConsistencyReport {
  isConsistent: boolean;
  checks: {
    id: string;
    label: string;
    passed: boolean;
    severity: 'ERROR' | 'WARNING' | 'INFO';
    message: string;
    detectedValue?: string | number;
    metadataValue?: string | number;
    fixAction?: string;
  }[];
  detectedPuzzleCount: number;
  detectedAnswerCount: number;
  detectedPageCount: number;
  detectedTrimSize: string;
}

export interface KDPBookDetailsValidationReport {
  overallStatus: 'PASS' | 'WARNING' | 'FAIL';
  completionPercentage: number;
  errors: string[];
  warnings: string[];
  checks: {
    field: string;
    label: string;
    status: 'PASS' | 'WARNING' | 'FAIL';
    message: string;
  }[];
  consistency: KDPMetadataConsistencyReport;
  timestamp: string;
}

export type KDPWorkflowStep =
  | 'content'
  | 'details'
  | 'pricing'
  | 'review'
  | 'publish';

export type KDPContentValidationStatus =
  | 'NOT_READY'
  | 'READY_WITH_WARNINGS'
  | 'READY';

export interface KDPContentValidationRule {
  id: string;
  category: 'Manuscript' | 'Cover' | 'Print' | 'AI' | 'Project';
  label: string;
  status: 'PASS' | 'WARNING' | 'FAIL';
  message: string;
  details?: string;
  fixAction?: string;
}

export interface KDPContentValidationReport {
  overallStatus: KDPContentValidationStatus;
  manuscriptValid: boolean;
  coverValid: boolean;
  printSettingsValid: boolean;
  aiDisclosureValid: boolean;
  projectValid: boolean;
  errors: string[];
  warnings: string[];
  rules: KDPContentValidationRule[];
  timestamp: string;
  summary: {
    passed: number;
    warnings: number;
    errors: number;
    total: number;
  };
}

export interface KDPExportPackageFile {
  name: string;
  type: string;
  size: number;
  blob?: Blob;
  content?: string;
  isMandatory: boolean;
  status: 'READY' | 'MISSING' | 'ERROR';
  description: string;
}

export interface KDPExportPackageResult {
  success: boolean;
  canExport: boolean;
  blockingReasons?: string[];
  files: KDPExportPackageFile[];
  zipBlob?: Blob;
  metadataJson: Record<string, any>;
  descriptionText: string;
  keywordsText: string;
  validationReport?: KDPPreflightReport;
  timestamp: string;
  error?: string;
}

export interface KDPPublishingAnalytics {
  totalProjects: number;
  kdpReady: number;
  warnings: number;
  failures: number;
  exported: number;
  drafts: number;
  byBookType: Record<string, number>;
  byAiContent: Record<string, number>;
  byTrimSize: Record<string, number>;
  byFormat: Record<string, number>;
  recentProjects: {
    id: string;
    title: string;
    bookType: KDPBookType;
    format: KDPFormat;
    trimSize: string;
    pageCount: number;
    aiContentType: KDPAiContentType;
    publicationStatus: KDPPublicationStatus;
    validationStatus: KDPValidationStatus;
    errorsCount: number;
    warningsCount: number;
    updatedAt: string;
  }[];
}

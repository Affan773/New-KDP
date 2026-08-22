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
  createdAt: string;
  updatedAt: string;
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

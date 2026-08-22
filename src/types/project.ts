import {
  BookMetadata,
  BookProjectSettings,
  BookSection,
  BookTheme,
  PageType,
} from './book';
import { KDPProjectConfig } from './kdp';

export type ProjectType =
  | 'Puzzle Book'
  | 'Coloring Book'
  | 'Journal'
  | 'Planner'
  | 'Notebook'
  | 'Activity Book'
  | 'Custom Book';

export type ProjectStatus = 'Draft' | 'In Progress' | 'Completed';

export type Orientation = 'Portrait' | 'Landscape';

export type BleedType = 'No Bleed' | 'Bleed';

export interface MarginConfig {
  top: number;    // inches
  bottom: number; // inches
  left: number;   // inches (inside/gutter for facing pages)
  right: number;  // inches (outside)
}

export interface TrimSize {
  id: string;
  name: string;
  width: number;  // inches
  height: number; // inches
  isPopular?: boolean;
  category?: 'Standard' | 'Large' | 'Pocket' | 'Custom';
}

export interface KdpSettings {
  trimSize: TrimSize;
  orientation: Orientation;
  pageCount: number;
  margins: MarginConfig;
  bleed: BleedType;
  paperType: 'White' | 'Cream' | 'Premium Color' | 'Standard Color';
  spineWidthInches: number;
  coverWidthInches: number;
  coverHeightInches: number;
}

export interface ProjectMetadata {
  description?: string;
  category?: string;
  targetAudience?: string;
  keywords?: string[];
  isFavorite?: boolean;
  coverColor?: string;
  tags?: string[];
  // Extended book metadata
  subtitle?: string;
  author?: string;
  publisher?: string;
  language?: string;
  edition?: string;
  seriesName?: string;
  volumeNumber?: string;
  isbn?: string;
  copyrightYear?: string;
}

export interface Project {
  id: string;
  name: string;
  type: ProjectType;
  description: string;
  thumbnail?: string;
  pageCount: number;
  createdAt: string;
  updatedAt: string;
  status: ProjectStatus;
  ownerId: string;
  isFavorite: boolean;
  kdpSettings: KdpSettings;
  documentId: string;
  metadata?: ProjectMetadata;
  // Phase 4 Book extensions
  schemaVersion?: number;
  sections?: BookSection[];
  bookSettings?: BookProjectSettings;
  // KDP Publishing Foundation (Phase 1)
  kdpConfig?: KDPProjectConfig;
}

export interface DocumentModel {
  id: string;
  projectId: string;
  pages: PageModel[];
  createdAt: string;
  updatedAt: string;
  schemaVersion?: number;
}

export interface PageModel {
  id: string;
  pageNumber: number;
  elements: CanvasElement[];
  backgroundColor?: string;
  pattern?: 'none' | 'dotGrid' | 'lined' | 'graph';
  patternColor?: string;
  isCover?: boolean;
  name?: string;
  notes?: string;
  // Phase 4 Page extensions
  pageType?: PageType;
  sectionId?: string;
  puzzleId?: string;
  puzzleType?: string;
  sourcePuzzleId?: string;
  sourcePuzzlePageId?: string;
  sourcePuzzleElementId?: string;
  isAnswerKey?: boolean;
  customHeader?: string;
  customFooter?: string;
}

export type CanvasElementType =
  | 'text'
  | 'image'
  | 'shape'
  | 'line'
  | 'puzzle'
  | 'group';

export interface BaseElement {
  id: string;
  type: CanvasElementType;
  x: number;          // pixels relative to page canvas (at 96 or standard screen DPI)
  y: number;
  width: number;
  height: number;
  rotation: number;   // degrees 0-360
  zIndex: number;
  opacity: number;    // 0-1
  locked?: boolean;
  aspectRatioLocked?: boolean;
  name?: string;
  groupId?: string;
}

export interface TextElement extends BaseElement {
  type: 'text';
  content: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  fontStyle?: 'normal' | 'italic';
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  color?: string;
  backgroundColor?: string;
  lineHeight?: number;
  letterSpacing?: number;
  paragraphSpacing?: number;
  textDecoration?: 'none' | 'underline' | 'line-through';
}

export interface ImageElement extends BaseElement {
  type: 'image';
  src?: string;
  imageUrl?: string;
  alt?: string;
  objectFit?: 'contain' | 'cover' | 'fill';
  borderRadius?: number;
  grayscale?: boolean;
  aspectRatioLocked?: boolean;
  filter?: 'none' | 'grayscale' | 'sepia' | 'high-contrast';
}

export type ShapeType =
  | 'rectangle'
  | 'circle'
  | 'ellipse'
  | 'triangle'
  | 'star'
  | 'polygon'
  | 'rounded-rect'
  | 'heart';

export interface ShapeElement extends BaseElement {
  type: 'shape';
  shapeType: ShapeType;
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  borderRadius?: number;
  dashArray?: string;
  dashPattern?: 'solid' | 'dashed' | 'dotted';
}

export interface LineElement extends BaseElement {
  type: 'line';
  strokeColor?: string;
  strokeWidth?: number;
  lineStyle?: 'solid' | 'dashed' | 'dotted';
  dashPattern?: 'solid' | 'dashed' | 'dotted';
  arrowStart?: boolean;
  arrowEnd?: boolean;
}

export interface PuzzlePlaceholderElement extends BaseElement {
  type: 'puzzle';
  puzzleType?: string;
  difficulty?: string;
  title?: string;
  gridSize?: number;
  wordCount?: number;
  previewData?: Record<string, unknown>;
  puzzleData?: Record<string, unknown>;
  sourcePuzzleId?: string;
  sourcePuzzlePageId?: string;
  sourcePuzzleElementId?: string;
}

export interface GroupElement extends BaseElement {
  type: 'group';
  childrenIds: string[];
}

export type CanvasElement =
  | TextElement
  | ImageElement
  | ShapeElement
  | LineElement
  | PuzzlePlaceholderElement
  | GroupElement;

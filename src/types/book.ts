import { CanvasElement, MarginConfig, Orientation, ProjectType, TrimSize } from './project';
import { GeneratedPuzzle, PuzzleDifficulty, PuzzleType } from '../puzzles/types';

export type PageType =
  | 'title'
  | 'copyright'
  | 'introduction'
  | 'instructions'
  | 'toc'
  | 'content'
  | 'puzzle'
  | 'answer_key'
  | 'blank'
  | 'custom'
  | 'disclaimer';

export interface BookMetadata {
  title: string;
  subtitle?: string;
  author: string;
  publisher?: string;
  description?: string;
  language?: string;
  category?: string;
  keywords?: string[];
  edition?: string;
  seriesName?: string;
  volumeNumber?: string;
  isbn?: string;
  copyrightYear?: string;
  disclaimer?: string;
}

export interface BookSection {
  id: string;
  title: string;
  order: number;
  description?: string;
  puzzleType?: PuzzleType | 'mixed' | 'blank';
  pageIds: string[];
  settings?: Record<string, unknown>;
}

export interface PageNumberingSettings {
  enabled: boolean;
  startPageNumber: number;
  startPageIndex: number; // e.g. skip front matter (index >= startPageIndex)
  frontMatterStyle: 'none' | 'roman_lower' | 'roman_upper';
  bodyStyle: 'arabic';
  position: 'bottom-center' | 'bottom-right' | 'bottom-outside' | 'top-center' | 'top-outside';
  fontSize: number;
  fontFamily: string;
  hideOnFrontMatter: boolean;
  prefix?: string;
  suffix?: string;
}

export type HeaderFooterContentType =
  | 'none'
  | 'book_title'
  | 'section_title'
  | 'author'
  | 'page_number'
  | 'custom';

export interface HeaderFooterSettings {
  showHeader: boolean;
  showFooter: boolean;
  headerLeft: HeaderFooterContentType;
  headerCenter: HeaderFooterContentType;
  headerRight: HeaderFooterContentType;
  footerLeft: HeaderFooterContentType;
  footerCenter: HeaderFooterContentType;
  footerRight: HeaderFooterContentType;
  customHeaderText?: string;
  customFooterText?: string;
  fontFamily: string;
  fontSize: number;
  color: string;
  marginFromEdge: number; // inches (e.g. 0.35)
  suppressOnFrontMatter: boolean;
  suppressOnBlankPages: boolean;
  separatorLine?: boolean;
}

export interface BookTheme {
  id: string;
  name: string;
  description: string;
  fontHeading: string;
  fontBody: string;
  fontAccent?: string;
  headingSize: number;
  bodySize: number;
  primaryColor: string;
  secondaryColor: string;
  borderColor: string;
  borderStyle: 'solid' | 'dashed' | 'dotted' | 'double' | 'none';
  borderWidth: number;
  borderRadius: number;
  pageSpacing: number;
  puzzleGridStyle: 'clean' | 'bold' | 'classic' | 'minimal' | 'playful';
}

export type AnswerKeyMode =
  | 'none'
  | 'after_puzzle'
  | 'after_section'
  | 'end_of_book'
  | 'four_up'
  | 'custom';

export interface AnswerKeySettings {
  mode: AnswerKeyMode;
  puzzlesPerPage: 1 | 2 | 4 | 6;
  includeTitle: boolean;
  sectionLabels: boolean;
  startOnNewPage: boolean;
  enabled?: boolean;
}

export interface BulkEditOptions {
  targetScope: 'all' | 'section' | 'puzzles_only' | 'selected';
  sectionId?: string;
  fontFamily?: string;
  fontSizeAdjustment?: number; // relative delta or absolute
  headingFontFamily?: string;
  gridBorderColor?: string;
  gridBorderStyle?: 'solid' | 'dashed' | 'dotted' | 'double' | 'none';
  gridBorderWidth?: number;
  wordListColumns?: 1 | 2 | 3 | 4;
  wordListFontSize?: number;
  wordListSpacing?: number;
  puzzleNumberingStyle?: 'continuous' | 'section_based';
  pageBackgroundColor?: string;
  headerEnabled?: boolean;
  footerEnabled?: boolean;
  customHeaderText?: string;
  customFooterText?: string;
  marginsAdjustment?: 'standard' | 'wide' | 'compact';
  solutionStyle?: 'highlight' | 'outline' | 'pill' | 'circle';
}

export interface TableOfContentsSettings {
  enabled: boolean;
  title: string;
  showPageNumbers: boolean;
  dotLeaders: boolean;
  includeFrontMatter: boolean;
}

export interface FrontMatterConfig {
  includeTitlePage: boolean;
  includeCopyrightPage: boolean;
  includeDisclaimerPage: boolean;
  includeInstructionsPage: boolean;
  includeIntroPage: boolean;
  includeTableOfContents: boolean;
  copyrightText?: string;
  disclaimerText?: string;
  instructionsText?: string;
  introText?: string;
}

export interface CentralizedFrontMatterConfig {
  titlePage: boolean;
  copyrightPage: boolean;
  howToSolvePage: boolean;
  tableOfContents?: boolean;
  disclaimerPage?: boolean;
  introPage?: boolean;
}

export const DEFAULT_FRONT_MATTER_CONFIG: FrontMatterConfig = {
  includeTitlePage: true,
  includeCopyrightPage: false,
  includeInstructionsPage: false,
  includeDisclaimerPage: false,
  includeIntroPage: false,
  includeTableOfContents: false,
  copyrightText: '',
  disclaimerText: '',
  instructionsText: '',
  introText: '',
};

export const DEFAULT_CENTRALIZED_FRONT_MATTER: CentralizedFrontMatterConfig = {
  titlePage: true,
  copyrightPage: false,
  howToSolvePage: false,
  tableOfContents: false,
  disclaimerPage: false,
  introPage: false,
};

export interface PuzzleBatchItemConfig {
  id: string;
  puzzleType: PuzzleType;
  count: number;
  difficulty: PuzzleDifficulty;
  theme?: string;
  words?: string[];
  gridWidth?: number;
  gridHeight?: number;
  sectionTitle?: string;
}

export interface BookProjectSettings {
  schemaVersion: number;
  metadata: BookMetadata;
  sections: BookSection[];
  theme: BookTheme;
  numbering: PageNumberingSettings;
  headerFooter: HeaderFooterSettings;
  answerKey: AnswerKeySettings;
  toc: TableOfContentsSettings;
  frontMatter: FrontMatterConfig;
  puzzleNumberingStyle: 'continuous' | 'section_based';
}

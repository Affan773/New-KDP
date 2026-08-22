import { PuzzleDifficulty, PuzzleType } from '../puzzles/types';
import { BleedType, Orientation, TrimSize } from './project';
import { BookTheme, FrontMatterConfig } from './book';

export interface AiBookPlanRequest {
  bookType: string;
  topic: string;
  targetAudience: string;
  language: string;
  difficulty: string;
  trimSize: string;
  orientation?: Orientation;
  targetPages: number;
  puzzleCount: number;
  puzzlesPerPage?: 1 | 2 | 4;
  wordsPerSearch?: number;
  answerKeyMode: 'end_of_book' | 'after_section' | 'after_puzzle' | 'four_up';
  isLargePrint: boolean;
  paperType?: 'White' | 'Cream' | 'Premium Color' | 'Standard Color';
  titlePreference?: string;
  subtitlePreference?: string;
  customInstructions?: string;
}

export interface AiPlanSection {
  title: string;
  puzzleType: PuzzleType;
  count: number;
  difficulty: PuzzleDifficulty;
  theme?: string;
  wordCount?: number;
}

export interface AiBookPlan {
  title: string;
  subtitle: string;
  description: string;
  targetAudience: string;
  language: string;
  recommendedTrimSize: string;
  recommendedPageCount: number;
  totalPuzzles: number;
  difficultyProgression: string;
  keywords: string[];
  frontMatter: {
    includeTitlePage: boolean;
    includeCopyright: boolean;
    includeInstructions: boolean;
    includeTOC: boolean;
  };
  sections: AiPlanSection[];
  backMatter: {
    answerKeyMode: string;
    puzzlesPerSolutionPage: number;
    includeNotesPage: boolean;
  };
}

export interface AiTitleAssistantRequest {
  niche: string;
  targetAudience: string;
  tone?: string;
  keywords?: string;
}

export interface AiTitleOption {
  title: string;
  subtitle: string;
}

export interface AiTitleAssistantResult {
  titles: AiTitleOption[];
  keywords: string[];
  description: string;
  audienceHook?: string;
}

export interface BatchBookSeriesItem {
  id: string;
  volumeNumber: number;
  title: string;
  subtitle: string;
  topic: string;
  targetAudience: string;
  puzzleCount: number;
  puzzleType: PuzzleType;
  difficulty: PuzzleDifficulty;
  themePresetId: string;
}

export interface BatchBookSeriesProgress {
  currentBook: number;
  totalBooks: number;
  bookTitle: string;
  stage: string;
  percent: number;
}

export interface ProjectVariantOptions {
  sourceProjectId: string;
  variantType: 'large_print' | 'kids_edition' | 'spanish_edition' | 'expanded_100' | 'pocket_format' | 'custom';
  newTitle: string;
  newSubtitle?: string;
  adjustTrimSize?: TrimSize;
  adjustThemeId?: string;
  scalePuzzles?: number; // scale count
}

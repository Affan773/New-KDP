import { MarginConfig, Orientation, TrimSize } from './project';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  plan: 'Free Creator' | 'Pro Studio' | 'Agency';
  booksPublished: number;
}

export interface DefaultBookSettings {
  trimSizeId: string;
  orientation: Orientation;
  margins: MarginConfig;
  bleed: 'No Bleed' | 'Bleed';
  defaultPageCount: number;
  paperType: 'White' | 'Cream' | 'Premium Color' | 'Standard Color';
}

export interface EditorPreferences {
  snapToGrid: boolean;
  gridSize: number;
  showSafeMargins: boolean;
  showBleedGuides: boolean;
  showRulers: boolean;
  autosaveIntervalSeconds: number;
  theme: 'system' | 'light' | 'dark';
}

export interface StorageMetrics {
  usedBytes: number;
  maxBytes: number;
  projectsCount: number;
  assetsCount: number;
  pagesCount: number;
  databaseStatus: 'Local Storage / Ready for Supabase' | 'Connected to Cloud';
}

export interface PuzzlePreferences {
  defaultDifficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert';
  defaultWordSearchGridSize: number;
  defaultSudokuDifficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert';
  autoIncludeSolution: boolean;
  showWordBank: boolean;
  showInstructions: boolean;
}

export interface AccessibilityPreferences {
  reduceMotion: boolean;
  largerTouchTargets: boolean;
  highContrast: boolean;
  keyboardShortcuts: boolean;
}

export interface LayoutPreferences {
  defaultSidebarCollapsed: boolean;
  mobileDockPosition: 'bottom' | 'floating';
  confirmDestructiveActions: boolean;
}

export interface GeneralPreferences {
  defaultZoom: number;
  defaultProjectView: 'grid' | 'list';
}

export interface UserSettings {
  profile: UserProfile;
  defaults: DefaultBookSettings;
  editor: EditorPreferences;
  storage: StorageMetrics;
  notifications: {
    autosaveAlerts: boolean;
    kdpMarginWarnings: boolean;
    productUpdates: boolean;
  };
  puzzles?: PuzzlePreferences;
  accessibility?: AccessibilityPreferences;
  layout?: LayoutPreferences;
  general?: GeneralPreferences;
}

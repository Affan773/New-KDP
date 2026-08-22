export type PuzzleType =
  | 'Word Search'
  | 'Sudoku'
  | 'Crossword'
  | 'Maze'
  | 'Cryptogram'
  | 'Word Scramble'
  | 'Number Puzzle'
  | 'Logic Puzzle';

export type PuzzleDifficulty = 'Easy' | 'Medium' | 'Hard' | 'Expert';

export interface PuzzleGeneratorConfig {
  puzzleType: PuzzleType;
  difficulty: PuzzleDifficulty;
  theme?: string;
  gridWidth: number;
  gridHeight: number;
  wordList?: string[];
  includeSolution: boolean;
  pageFormat: '1-per-page' | '2-per-page' | '4-per-page';
  showWordBank?: boolean;
  fontFamily?: string;
  cellSize?: number;
  lineThickness?: number;
  options?: Record<string, unknown>;
}

export interface PuzzleItem {
  id: string;
  title: string;
  type: PuzzleType;
  difficulty: PuzzleDifficulty;
  grid: string[][];
  clues?: { across?: string[]; down?: string[] };
  wordBank?: string[];
  solution: string[][];
  metadata?: Record<string, unknown>;
}

export interface PuzzleGenerationResult {
  puzzles: PuzzleItem[];
  solutions: PuzzleItem[];
  totalPageEstimate: number;
  generatedAt: string;
}

export interface PuzzleTypeInfo {
  type: PuzzleType;
  title: string;
  description: string;
  iconName: string;
  difficultyOptions: PuzzleDifficulty[];
  defaultGridSize: string;
  popularFor: string;
  samplePreview: string;
}

export interface PuzzleCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export type PuzzleConfig = PuzzleGeneratorConfig;


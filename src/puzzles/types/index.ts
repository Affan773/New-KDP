export type PuzzleType =
  | 'word_search'
  | 'sudoku'
  | 'crossword'
  | 'maze'
  | 'cryptogram'
  | 'word_scramble'
  | 'number_puzzle'
  | 'logic_grid';

export type DisplayPuzzleType =
  | 'Word Search'
  | 'Sudoku'
  | 'Crossword'
  | 'Maze'
  | 'Cryptogram'
  | 'Word Scramble'
  | 'Number Puzzle'
  | 'Logic Puzzle';

export type PuzzleDifficulty = 'Easy' | 'Medium' | 'Hard' | 'Expert' | 'Custom';

export interface BasePuzzleSettings {
  puzzleType: PuzzleType;
  difficulty?: PuzzleDifficulty;
  seed?: number;
  title?: string;
  subtitle?: string;
  instructions?: string;
  puzzleNumber?: number;
  [key: string]: any;
}

export type WordSearchDirectionKey =
  | 'horizontal_forward'
  | 'horizontal_backward'
  | 'vertical_down'
  | 'vertical_up'
  | 'diagonal_down_right'
  | 'diagonal_down_left'
  | 'diagonal_up_right'
  | 'diagonal_up_left';

export interface WordSearchDirections {
  horizontal?: boolean;
  horizontalReverse?: boolean;
  vertical?: boolean;
  verticalReverse?: boolean;
  diagonalDown?: boolean;
  diagonalDownReverse?: boolean;
  diagonalUp?: boolean;
  diagonalUpReverse?: boolean;
  [key: string]: boolean | undefined;
}

export interface WordSearchSettings extends BasePuzzleSettings {
  puzzleType: 'word_search';
  gridWidth?: number;
  gridHeight?: number;
  words?: string[];
  customWords?: string[];
  directions?: WordSearchDirections;
  wordCount?: number;
  theme?: string;
  allowOverlap?: boolean;
  allowBackwards?: boolean;
  allowDiagonals?: boolean;
  caseSensitive?: boolean;
  // Professional Phase 4.1 Extensions
  targetWordCount?: number;
  minWordLength?: number;
  maxWordLength?: number;
  customWordInput?: string;
  wordSelectionMode?: 'all' | 'random' | 'manual';
  customAlphabet?: string;
  // Granular Direction Controls
  allowHorizontalForward?: boolean;
  allowHorizontalBackward?: boolean;
  allowVerticalDown?: boolean;
  allowVerticalUp?: boolean;
  allowDiagonalDownRight?: boolean;
  allowDiagonalDownLeft?: boolean;
  allowDiagonalUpRight?: boolean;
  allowDiagonalUpLeft?: boolean;
  // Display & Layout Controls
  wordListPosition?: 'bottom' | 'top' | 'left' | 'right' | 'hidden';
  wordListColumns?: 1 | 2 | 3 | 4;
  wordListSort?: 'alphabetical' | 'original' | 'random';
  solutionMode?: 'highlight' | 'capsule' | 'circle' | 'underline' | 'answer_list_only';
}

export interface SudokuSettings extends BasePuzzleSettings {
  puzzleType: 'sudoku';
  size?: 4 | 6 | 9;
  clueDensity?: number; // Custom given clues count
  symmetryPreference?: 'none' | 'rotational' | 'horizontal' | 'diagonal';
  numberStyle?: 'standard' | 'roman' | 'circled';
  gridLineThickness?: number;
  boxLineThickness?: number;
}

export interface CrosswordClueInput {
  word: string;
  clue: string;
}

export interface CrosswordSettings extends BasePuzzleSettings {
  puzzleType: 'crossword';
  gridSize?: number;
  size?: number;
  wordList?: CrosswordClueInput[];
  customWordPairs?: CrosswordClueInput[];
  theme?: string;
  allowIntersections?: boolean;
  clueLayout?: 'split' | 'side_by_side' | 'stacked';
  minWordLength?: number;
  maxWordLength?: number;
}

export interface MazeSettings extends BasePuzzleSettings {
  puzzleType: 'maze';
  width?: number;
  height?: number;
  algorithm?: 'dfs' | 'prims' | 'kruskals';
  startPosition?: 'top_left' | 'top_right' | 'bottom_left' | 'bottom_right' | 'top_center';
  endPosition?: 'bottom_right' | 'bottom_left' | 'top_right' | 'bottom_center';
  wallThickness?: number;
  solutionStyle?: 'solid_line' | 'dotted' | 'highlight';
}

export interface CryptogramSettings extends BasePuzzleSettings {
  puzzleType: 'cryptogram';
  quote?: string;
  author?: string;
  cipherType?: 'random_substitution' | 'atbash' | 'caesar';
  caesarShift?: number;
  hintsProvided?: number;
  preservePunctuation?: boolean;
  showAuthor?: boolean;
}

export interface WordScrambleSettings extends BasePuzzleSettings {
  puzzleType: 'word_scramble';
  words?: string[];
  customWords?: string[];
  wordCount?: number;
  theme?: string;
  includeHints?: boolean;
  scrambleStyle?: 'random' | 'reverse' | 'vowels_kept';
  showWordBank?: boolean;
  minWordLength?: number;
  maxWordLength?: number;
}

export interface NumberPuzzleSettings extends BasePuzzleSettings {
  puzzleType: 'number_puzzle';
  subType?: 'sequence' | 'missing_number' | 'arithmetic_grid';
  itemCount?: number;
  maxNumber?: number;
  minRange?: number;
  maxRange?: number;
  operations?: ('add' | 'subtract' | 'multiply' | 'divide')[];
  allowNegative?: boolean;
  allowNegatives?: boolean;
  allowDecimals?: boolean;
}

export interface LogicGridSettings extends BasePuzzleSettings {
  puzzleType: 'logic_grid';
  categoriesCount?: 3 | 4;
  categoryCount?: number;
  itemsPerCategory?: 3 | 4 | 5;
  theme?: string;
  customCategories?: { name: string; items: string[] }[];
  customClues?: string[];
}

export type AnyPuzzleSettings =
  | WordSearchSettings
  | SudokuSettings
  | CrosswordSettings
  | MazeSettings
  | CryptogramSettings
  | WordScrambleSettings
  | NumberPuzzleSettings
  | LogicGridSettings;

// ================= PUZZLE DATA & SOLUTIONS =================

export interface WordSearchWordPlacement {
  word: string;
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
  direction: [number, number]; // [dRow, dCol]
}

export interface WordSearchData {
  grid: string[][];
  words: string[];
  placements: WordSearchWordPlacement[];
  theme?: string;
}

export interface SudokuData {
  size: number;
  boxWidth: number;
  boxHeight: number;
  initialGrid: (number | null)[][];
  solutionGrid: number[][];
}

export interface CrosswordPlacedEntry {
  number: number;
  direction: 'across' | 'down';
  word: string;
  clue: string;
  row: number;
  col: number;
  length: number;
}

export interface CrosswordData {
  size: number;
  grid: (string | null)[][]; // null = black cell
  numbers: (number | null)[][];
  acrossEntries: CrosswordPlacedEntry[];
  downEntries: CrosswordPlacedEntry[];
  solutionGrid: string[][];
}

export interface MazeCell {
  row: number;
  col: number;
  walls: { top: boolean; right: boolean; bottom: boolean; left: boolean };
}

export interface MazeData {
  width: number;
  height: number;
  grid: MazeCell[][];
  start: { row: number; col: number };
  end: { row: number; col: number };
  solutionPath: { row: number; col: number }[];
}

export interface CryptogramData {
  ciphertext: string;
  plaintext: string;
  author?: string;
  cipherMap: Record<string, string>; // Plain -> Cipher
  reverseMap: Record<string, string>; // Cipher -> Plain
  hints: Record<string, string>; // pre-revealed
}

export interface WordScrambleItem {
  id: string;
  original: string;
  scrambled: string;
  hint?: string;
}

export interface WordScrambleData {
  items: WordScrambleItem[];
  theme?: string;
}

export interface NumberSequenceItem {
  id: string;
  sequence: (number | string)[]; // string for '?'
  missingIndex: number;
  ruleDescription: string;
  answer: number;
  options?: number[];
}

export interface MissingNumberItem {
  id: string;
  equation: string; // e.g. "14 + [?] = 32"
  answer: number;
  explanation: string;
}

export interface ArithmeticGridItem {
  id: string;
  grid: (number | string | null)[][];
  solution: number[][];
  operations: string[];
}

export interface NumberPuzzleData {
  subType: 'sequence' | 'missing_number' | 'arithmetic_grid';
  sequences?: NumberSequenceItem[];
  missingNumbers?: MissingNumberItem[];
  arithmeticGrid?: ArithmeticGridItem;
}

export interface LogicEntityCategory {
  name: string;
  items: string[];
}

export interface LogicClue {
  id: string;
  text: string;
  type: 'positive' | 'negative' | 'relative';
}

export interface LogicGridData {
  categories: LogicEntityCategory[];
  clues: LogicClue[];
  solutionMatrix: Record<string, Record<string, string>>; // e.g. { "Alice": { "Pet": "Cat", "City": "Paris" } }
}

export type AnyPuzzleData =
  | WordSearchData
  | SudokuData
  | CrosswordData
  | MazeData
  | CryptogramData
  | WordScrambleData
  | NumberPuzzleData
  | LogicGridData;

// ================= GENERATED PUZZLE MODEL =================

export interface GeneratedPuzzle<TSettings = AnyPuzzleSettings, TData = AnyPuzzleData> {
  id: string;
  type: PuzzleType;
  title: string;
  difficulty: PuzzleDifficulty;
  seed: number;
  settings: TSettings;
  data: TData;
  solution: unknown;
  metadata: {
    generatedAt: string;
    generatorVersion: string;
    itemCount?: number;
    dimensions?: string;
    isSolvable: boolean;
    hasUniqueSolution?: boolean;
    generationTimeMs?: number;
  };
}

// ================= PRESENTATION STYLING =================

export type PuzzleVisualPresetKey =
  | 'clean_editorial'
  | 'modern_bold'
  | 'minimalist_slate'
  | 'warm_golden'
  | 'classic_charcoal'
  | 'blueprint_blue'
  | 'forest_botanical';

export interface PuzzleStyleOptions {
  fontFamily: string;
  titleFontSize: number;
  subtitleFontSize?: number;
  instructionsFontSize?: number;
  gridFontSize: number;
  clueFontSize: number;
  textColor: string;
  borderColor: string;
  titleColor?: string;
  instructionsColor?: string;
  gridBorderWidth: number;
  cellBorderWidth: number;
  cellPadding: number;
  lineColor: string;
  highlightColor: string;
  showTitle: boolean;
  showSubtitle?: boolean;
  showPuzzleNumber: boolean;
  showInstructions: boolean;
  showWordBank: boolean;
  showSolution: boolean;
  backgroundColor: string;
  layoutColumns?: 1 | 2;
  presetKey?: PuzzleVisualPresetKey;
  borderStyle?: 'solid' | 'dashed' | 'dotted';
}

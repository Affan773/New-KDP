import { PuzzleType } from '../puzzles/types';

export interface PuzzleInstruction {
  title: string;
  summary: string;
  steps: string[];
  tips: string[];
}

export const PUZZLE_INSTRUCTIONS_MAP: Record<PuzzleType, PuzzleInstruction> = {
  word_search: {
    title: 'How to Solve Word Search Puzzles',
    summary: 'Find and circle all hidden words listed in the word bank within the letter grid.',
    steps: [
      'Words can be oriented horizontally (left-to-right or right-to-left), vertically (top-to-bottom or bottom-to-top), or diagonally.',
      'Scan the grid for unique or uncommon letters found in the target words (such as Q, X, Z, J, or double letters).',
      'Cross off each word in the list once found until all words are completed.',
    ],
    tips: [
      'Read through the word list first to familiarize yourself with the target vocabulary.',
      'Use a highlighter or colored pencil to keep your puzzle page clean and organized.',
    ],
  },
  sudoku: {
    title: 'How to Solve Sudoku Puzzles',
    summary: 'Fill the 9×9 grid so that every row, column, and 3×3 box contains digits 1 through 9 exactly once.',
    steps: [
      'Each row must contain the numbers 1 to 9 without repetition.',
      'Each column must contain the numbers 1 to 9 without repetition.',
      'Each 3×3 sub-grid (box) must also contain the numbers 1 to 9 without repetition.',
    ],
    tips: [
      'Start with rows, columns, or 3×3 boxes that already have the most numbers filled in.',
      'Use pencil candidate marks (pencil notation) to track possibilities for challenging cells.',
      'Never guess — every valid Sudoku puzzle has a single unique logical solution.',
    ],
  },
  crossword: {
    title: 'How to Solve Crossword Puzzles',
    summary: 'Fill the interlocking white squares with letters that form words matching the numbered Across and Down clues.',
    steps: [
      'Read the numbered clues categorized into "Across" (horizontal) and "Down" (vertical).',
      'Enter one letter per white square starting at the corresponding numbered square.',
      'Black squares represent word boundaries and cannot contain letters.',
    ],
    tips: [
      'Solve the easiest clues first (fill-in-the-blanks, abbreviations, or short words).',
      'Use intersecting letters from solved words to reveal letters in intersecting words.',
    ],
  },
  maze: {
    title: 'How to Solve Mazes',
    summary: 'Navigate a continuous unbroken path from the starting entrance to the designated exit point.',
    steps: [
      'Locate the starting marker (usually labeled Start or marked with an arrow) and the finishing goal.',
      'Draw a continuous line through the open corridors without crossing any solid boundary walls.',
      'If you encounter a dead end, backtrack to the last junction and choose an alternate passage.',
    ],
    tips: [
      'Try scanning backwards from the finish line toward the start to avoid deceptive branching paths.',
      'Lightly trace candidate routes with your finger before drawing with ink.',
    ],
  },
  cryptogram: {
    title: 'How to Solve Cryptogram Puzzles',
    summary: 'Decipher the encrypted quotation or phrase where each letter has been consistently replaced by another letter.',
    steps: [
      'Every appearance of a cipher letter corresponds to the same plaintext letter throughout the entire puzzle.',
      'Punctuation marks, numbers, and word spacing remain unchanged and are not encrypted.',
      'Write your decoded letters directly above the corresponding cipher letters.',
    ],
    tips: [
      'Look for single-letter words — in English, these are almost always "A" or "I".',
      'Look for common two-letter words (such as "IN", "TO", "OF", "IT", "IS", "ON", "HE", "BE").',
      'Look for common three-letter words like "THE", "AND", "FOR", or common suffixes like "-ING", "-ED", "-TION".',
    ],
  },
  word_scramble: {
    title: 'How to Solve Word Scrambles',
    summary: 'Rearrange the jumbled letters in each item to spell out the correct dictionary word.',
    steps: [
      'Examine the scrambled letters and check the clue category or theme if provided.',
      'Write candidate combinations in the answer line until a valid word appears.',
      'Ensure that each letter from the prompt is used exactly once.',
    ],
    tips: [
      'Separate vowels and consonants to identify common prefixes (RE-, UN-, PRE-) and suffixes (-ER, -LY, -ES).',
      'Rearrange letters in a circle or on scrap paper to view alternative sound combinations.',
    ],
  },
  number_puzzle: {
    title: 'How to Solve Number Sequence Puzzles',
    summary: 'Determine the arithmetic rule or pattern governing the sequence and fill in the missing numbers.',
    steps: [
      'Analyze the difference or ratio between consecutive terms in the series.',
      'Check for arithmetic progressions (+, -), geometric factors (×, ÷), Fibonacci additions, or alternating patterns.',
      'Apply the identified formula to compute and verify the missing target values.',
    ],
    tips: [
      'Write down the differences between adjacent numbers on a separate line to detect secondary patterns.',
      'Check if alternating items follow two independent interwoven sequences.',
    ],
  },
  logic_grid: {
    title: 'How to Solve Logic Grid Puzzles',
    summary: 'Use deductive reasoning and elimination based on given clues to determine relationships between categories.',
    steps: [
      'Read each clue carefully and record positive matches (O) and confirmed eliminations (X) in the logic grid.',
      'When a positive match is established, eliminate all other possibilities in that row and column for that category.',
      'Cross-reference known relationships to discover indirect deductions until all pairings are solved.',
    ],
    tips: [
      'Read clues multiple times — facts that seem unhelpful initially often become solvable after earlier deductions.',
      'Be methodical: every clue is essential and provides necessary constraints.',
    ],
  },
};

export class InstructionsService {
  static getInstructions(puzzleType: PuzzleType): PuzzleInstruction {
    return PUZZLE_INSTRUCTIONS_MAP[puzzleType] || PUZZLE_INSTRUCTIONS_MAP.word_search;
  }

  static getInstructionsForTypes(types: PuzzleType[]): PuzzleInstruction[] {
    const unique = Array.from(new Set(types));
    return unique.map(t => this.getInstructions(t));
  }
}

import { BaseGenerator, ValidationResult } from '../core/PuzzleGenerator';
import { Random } from '../core/Random';
import {
  WordSearchSettings,
  WordSearchData,
  GeneratedPuzzle,
  WordSearchWordPlacement,
} from '../types';
import { BUILT_IN_WORD_THEMES, sanitizeWordList } from '../utils/wordLists';

// Direction vectors: [dRow, dCol]
export const WS_DIRECTIONS = {
  HORIZONTAL_FORWARD: [0, 1] as [number, number],
  HORIZONTAL_BACKWARD: [0, -1] as [number, number],
  VERTICAL_DOWN: [1, 0] as [number, number],
  VERTICAL_UP: [-1, 0] as [number, number],
  DIAGONAL_DOWN_RIGHT: [1, 1] as [number, number],
  DIAGONAL_DOWN_LEFT: [1, -1] as [number, number],
  DIAGONAL_UP_RIGHT: [-1, 1] as [number, number],
  DIAGONAL_UP_LEFT: [-1, -1] as [number, number],
};

export class WordSearchGenerator extends BaseGenerator<WordSearchSettings, WordSearchData> {
  readonly type = 'word_search';
  readonly name = 'Word Search';
  readonly defaultSettings: Partial<WordSearchSettings> = {
    puzzleType: 'word_search',
    gridWidth: 15,
    gridHeight: 15,
    rows: 15,
    cols: 15,
    difficulty: 'Medium',
    theme: 'animals',
    wordCount: 14,
    allowOverlap: true,
    allowOverlaps: true,
    directions: {
      horizontal: true,
      horizontalReverse: false,
      vertical: true,
      verticalReverse: false,
      diagonalDown: true,
      diagonalDownReverse: false,
      diagonalUp: false,
      diagonalUpReverse: false,
    },
    wordListPosition: 'bottom',
    wordListColumns: 3,
    solutionMode: 'highlight',
  };

  generate(settings: WordSearchSettings): GeneratedPuzzle<WordSearchSettings, WordSearchData> {
    const startTime = performance.now();
    const seedVal = typeof settings.seed === 'number' ? settings.seed : 101;
    const prng = new Random(seedVal);

    const width = Math.max(6, Math.min(35, settings.cols || settings.gridWidth || 15));
    const height = Math.max(6, Math.min(35, settings.rows || settings.gridHeight || 15));
    const maxDimension = Math.max(width, height);

    const minWordLen = Math.max(3, settings.minWordLength || 3);
    const maxWordLen = Math.min(maxDimension, settings.maxWordLength || maxDimension);

    // Determine word source
    let wordSource: string[] = [];
    if (settings.customWords && settings.customWords.length > 0) {
      wordSource = settings.customWords;
    } else if (settings.customWordInput && settings.customWordInput.trim().length > 0) {
      wordSource = settings.customWordInput.split(/[\n,;]+/).map(w => w.trim()).filter(Boolean);
    } else if (settings.words && settings.words.length > 0) {
      wordSource = settings.words;
    } else {
      const themeKey = (settings.theme || 'animals').toLowerCase();
      const themeObj = BUILT_IN_WORD_THEMES[themeKey] || BUILT_IN_WORD_THEMES.animals;
      wordSource = themeObj.words;
    }

    const { words: cleanedWords } = sanitizeWordList(wordSource, minWordLen, maxWordLen);

    // Target count
    let desiredCount = settings.wordCount || settings.targetWordCount;
    if (!desiredCount || desiredCount <= 0) {
      if (settings.difficulty === 'Easy') {
        desiredCount = Math.min(cleanedWords.length, Math.max(6, Math.floor((width * height) / 22)));
      } else if (settings.difficulty === 'Hard' || settings.difficulty === 'Expert') {
        desiredCount = Math.min(cleanedWords.length, Math.max(14, Math.floor((width * height) / 11)));
      } else {
        desiredCount = Math.min(cleanedWords.length, Math.max(10, Math.floor((width * height) / 15)));
      }
    }

    const wordsToPick = Math.min(cleanedWords.length, desiredCount);
    let selectedWords: string[] = [];

    if (settings.wordSelectionMode === 'manual' || settings.customWords) {
      selectedWords = cleanedWords.slice(0, wordsToPick);
    } else {
      selectedWords = prng.sample(cleanedWords, wordsToPick);
    }

    // Sort words descending by length for dense placement
    selectedWords.sort((a, b) => b.length - a.length);

    // Allowed directions
    const allowedDirections = this.getAllowedDirections(settings);
    const allowOverlaps = settings.allowOverlaps !== false && settings.allowOverlap !== false;

    // Retry loop with different seed attempts to maximize placed words
    let bestResult: {
      grid: string[][];
      placements: WordSearchWordPlacement[];
      placedWords: string[];
      unplacedWords: string[];
      cellOccupancy: number[][];
      overlapCount: number;
    } | null = null;

    const maxGenerationRetries = 5;

    for (let retry = 0; retry < maxGenerationRetries; retry++) {
      const attemptPrng = new Random(seedVal + retry * 997);
      const attemptGrid: string[][] = Array.from({ length: height }, () =>
        Array.from({ length: width }, () => '')
      );
      const cellOccupancy: number[][] = Array.from({ length: height }, () =>
        Array.from({ length: width }, () => 0)
      );
      const placements: WordSearchWordPlacement[] = [];
      const placedWords: string[] = [];
      const unplacedWords: string[] = [];

      for (const word of selectedWords) {
        const placement = this.tryPlaceWord(
          attemptGrid,
          cellOccupancy,
          word,
          width,
          height,
          allowedDirections,
          allowOverlaps,
          attemptPrng
        );

        if (placement) {
          placements.push(placement);
          placedWords.push(word);
        } else {
          unplacedWords.push(word);
        }
      }

      let overlapCount = 0;
      for (let r = 0; r < height; r++) {
        for (let c = 0; c < width; c++) {
          if (cellOccupancy[r][c] > 1) {
            overlapCount += (cellOccupancy[r][c] - 1);
          }
        }
      }

      if (!bestResult || placedWords.length > bestResult.placedWords.length) {
        bestResult = {
          grid: attemptGrid,
          placements,
          placedWords,
          unplacedWords,
          cellOccupancy,
          overlapCount,
        };

        if (unplacedWords.length === 0) {
          break; // Perfect placement achieved
        }
      }
    }

    const { grid, placements, placedWords, unplacedWords, cellOccupancy, overlapCount } = bestResult!;

    // Filler letters
    let alphabet = (settings.customAlphabet && settings.customAlphabet.trim().length > 0)
      ? settings.customAlphabet.toUpperCase().replace(/[^A-Z]/g, '')
      : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (!alphabet || alphabet.length === 0) alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    const fillerPrng = new Random(seedVal + 4321);
    for (let r = 0; r < height; r++) {
      for (let c = 0; c < width; c++) {
        if (!grid[r][c]) {
          grid[r][c] = alphabet[fillerPrng.nextInt(0, alphabet.length - 1)];
        }
      }
    }

    // Word list sorting for presentation
    const displayWords = [...placedWords];
    if (settings.wordListSort === 'original') {
      // Preserve order
    } else if (settings.wordListSort === 'random') {
      displayWords.sort(() => fillerPrng.next() - 0.5);
    } else {
      displayWords.sort((a, b) => a.localeCompare(b));
    }

    const data: WordSearchData = {
      grid,
      words: displayWords,
      placements,
      theme: settings.theme,
    };

    const endTime = performance.now();
    const totalCells = width * height;
    const uniquePlacedCells = cellOccupancy.flat().filter(count => count > 0).length;
    const densityPercent = Math.round((uniquePlacedCells / totalCells) * 100);
    const directionDiversity = new Set(placements.map(p => `${p.direction[0]},${p.direction[1]}`)).size;
    const qualityScore = Math.min(100, Math.round(
      (placedWords.length / Math.max(1, selectedWords.length)) * 70 +
      Math.min(20, densityPercent * 0.4) +
      Math.min(10, directionDiversity * 2)
    ));

    return {
      id: `ws-${seedVal}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      type: 'word_search',
      title: settings.title || (settings.theme ? `${settings.theme.toUpperCase()} WORD SEARCH` : 'WORD SEARCH'),
      difficulty: settings.difficulty || 'Medium',
      seed: seedVal,
      settings: {
        ...settings,
        rows: height,
        cols: width,
        gridHeight: height,
        gridWidth: width,
      },
      data,
      solution: placements,
      metadata: {
        generatedAt: new Date().toISOString(),
        generatorVersion: '2.5.0',
        itemCount: placedWords.length,
        placedWordsCount: placedWords.length,
        unplacedWordsCount: unplacedWords.length,
        unplacedWords,
        dimensions: `${width}×${height}`,
        isSolvable: placedWords.length > 0,
        hasUniqueSolution: true,
        generationTimeMs: Math.round(endTime - startTime),
        overlapCount,
        gridDensity: densityPercent,
        directionDiversity,
        qualityScore,
      } as any,
    };
  }

  private getAllowedDirections(settings: WordSearchSettings): [number, number][] {
    const directions: [number, number][] = [];

    // Check settings.directions object (from UI toggles)
    if (settings.directions) {
      const d = settings.directions;
      if (d.horizontal) directions.push(WS_DIRECTIONS.HORIZONTAL_FORWARD);
      if (d.horizontalReverse) directions.push(WS_DIRECTIONS.HORIZONTAL_BACKWARD);
      if (d.vertical) directions.push(WS_DIRECTIONS.VERTICAL_DOWN);
      if (d.verticalReverse) directions.push(WS_DIRECTIONS.VERTICAL_UP);
      if (d.diagonalDown) directions.push(WS_DIRECTIONS.DIAGONAL_DOWN_RIGHT);
      if (d.diagonalDownReverse) directions.push(WS_DIRECTIONS.DIAGONAL_DOWN_LEFT);
      if (d.diagonalUp) directions.push(WS_DIRECTIONS.DIAGONAL_UP_RIGHT);
      if (d.diagonalUpReverse) directions.push(WS_DIRECTIONS.DIAGONAL_UP_LEFT);
    }

    // If directions is still empty, check granular boolean fields
    if (directions.length === 0) {
      const hasGranular =
        settings.allowHorizontalForward !== undefined ||
        settings.allowHorizontalBackward !== undefined ||
        settings.allowVerticalDown !== undefined ||
        settings.allowVerticalUp !== undefined ||
        settings.allowDiagonalDownRight !== undefined ||
        settings.allowDiagonalDownLeft !== undefined ||
        settings.allowDiagonalUpRight !== undefined ||
        settings.allowDiagonalUpLeft !== undefined;

      if (hasGranular) {
        if (settings.allowHorizontalForward !== false) directions.push(WS_DIRECTIONS.HORIZONTAL_FORWARD);
        if (settings.allowHorizontalBackward) directions.push(WS_DIRECTIONS.HORIZONTAL_BACKWARD);
        if (settings.allowVerticalDown !== false) directions.push(WS_DIRECTIONS.VERTICAL_DOWN);
        if (settings.allowVerticalUp) directions.push(WS_DIRECTIONS.VERTICAL_UP);
        if (settings.allowDiagonalDownRight) directions.push(WS_DIRECTIONS.DIAGONAL_DOWN_RIGHT);
        if (settings.allowDiagonalDownLeft) directions.push(WS_DIRECTIONS.DIAGONAL_DOWN_LEFT);
        if (settings.allowDiagonalUpRight) directions.push(WS_DIRECTIONS.DIAGONAL_UP_RIGHT);
        if (settings.allowDiagonalUpLeft) directions.push(WS_DIRECTIONS.DIAGONAL_UP_LEFT);
      }
    }

    // If still empty, use difficulty preset
    if (directions.length === 0) {
      const diff = settings.difficulty || 'Medium';
      if (diff === 'Easy') {
        directions.push(WS_DIRECTIONS.HORIZONTAL_FORWARD, WS_DIRECTIONS.VERTICAL_DOWN);
      } else if (diff === 'Hard') {
        directions.push(
          WS_DIRECTIONS.HORIZONTAL_FORWARD,
          WS_DIRECTIONS.HORIZONTAL_BACKWARD,
          WS_DIRECTIONS.VERTICAL_DOWN,
          WS_DIRECTIONS.VERTICAL_UP,
          WS_DIRECTIONS.DIAGONAL_DOWN_RIGHT,
          WS_DIRECTIONS.DIAGONAL_UP_RIGHT
        );
      } else if (diff === 'Expert' || (diff as string) === 'Extreme') {
        directions.push(
          WS_DIRECTIONS.HORIZONTAL_FORWARD,
          WS_DIRECTIONS.HORIZONTAL_BACKWARD,
          WS_DIRECTIONS.VERTICAL_DOWN,
          WS_DIRECTIONS.VERTICAL_UP,
          WS_DIRECTIONS.DIAGONAL_DOWN_RIGHT,
          WS_DIRECTIONS.DIAGONAL_DOWN_LEFT,
          WS_DIRECTIONS.DIAGONAL_UP_RIGHT,
          WS_DIRECTIONS.DIAGONAL_UP_LEFT
        );
      } else {
        // Medium default
        directions.push(
          WS_DIRECTIONS.HORIZONTAL_FORWARD,
          WS_DIRECTIONS.VERTICAL_DOWN,
          WS_DIRECTIONS.DIAGONAL_DOWN_RIGHT
        );
      }
    }

    return directions;
  }

  private tryPlaceWord(
    grid: string[][],
    cellOccupancy: number[][],
    word: string,
    width: number,
    height: number,
    directions: [number, number][],
    allowOverlap: boolean,
    prng: Random
  ): WordSearchWordPlacement | null {
    const maxAttempts = 250;
    const len = word.length;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const dir = prng.choice(directions);
      const [dRow, dCol] = dir;

      const minRow = dRow < 0 ? len - 1 : 0;
      const maxRow = dRow > 0 ? height - len : height - 1;
      const minCol = dCol < 0 ? len - 1 : 0;
      const maxCol = dCol > 0 ? width - len : width - 1;

      if (minRow > maxRow || minCol > maxCol) continue;

      const startRow = prng.nextInt(minRow, maxRow);
      const startCol = prng.nextInt(minCol, maxCol);

      let canPlace = true;
      for (let i = 0; i < len; i++) {
        const r = startRow + i * dRow;
        const c = startCol + i * dCol;
        const currentCell = grid[r][c];

        if (currentCell !== '' && currentCell !== word[i]) {
          canPlace = false;
          break;
        }
        if (!allowOverlap && currentCell !== '') {
          canPlace = false;
          break;
        }
      }

      if (canPlace) {
        for (let i = 0; i < len; i++) {
          const r = startRow + i * dRow;
          const c = startCol + i * dCol;
          grid[r][c] = word[i];
          cellOccupancy[r][c] += 1;
        }

        const endRow = startRow + (len - 1) * dRow;
        const endCol = startCol + (len - 1) * dCol;

        return {
          word,
          startRow,
          startCol,
          endRow,
          endCol,
          direction: dir,
        };
      }
    }

    return null;
  }

  validate(puzzle: GeneratedPuzzle<WordSearchSettings, WordSearchData>): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const { grid, words, placements } = puzzle.data;
    if (!grid || grid.length === 0 || grid[0].length === 0) {
      errors.push('Grid is empty');
      return { valid: false, errors, warnings };
    }

    const height = grid.length;
    const width = grid[0].length;

    for (const p of placements) {
      const len = p.word.length;
      const [dRow, dCol] = p.direction;

      let extracted = '';
      for (let i = 0; i < len; i++) {
        const r = p.startRow + i * dRow;
        const c = p.startCol + i * dCol;

        if (r < 0 || r >= height || c < 0 || c >= width) {
          errors.push(`Word "${p.word}" extends out of bounds at (${r}, ${c})`);
          break;
        }
        extracted += grid[r][c];
      }

      if (extracted !== p.word) {
        errors.push(`Placed word "${p.word}" does not match grid letters: "${extracted}"`);
      }
    }

    if (placements.length < words.length) {
      warnings.push(`Placed ${placements.length} of ${words.length} requested words.`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  generateSolution(puzzle: GeneratedPuzzle<WordSearchSettings, WordSearchData>): WordSearchWordPlacement[] {
    return puzzle.data.placements;
  }
}

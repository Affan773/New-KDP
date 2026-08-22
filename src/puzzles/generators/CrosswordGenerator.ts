import { BaseGenerator, ValidationResult } from '../core/PuzzleGenerator';
import { Random } from '../core/Random';
import {
  CrosswordSettings,
  CrosswordData,
  GeneratedPuzzle,
  CrosswordPlacedEntry,
  CrosswordClueInput,
} from '../types';

export const DEFAULT_CROSSWORD_VOCABULARY: Record<string, CrosswordClueInput[]> = {
  general: [
    { word: 'PLANET', clue: 'Celestial body orbiting a star' },
    { word: 'OCEAN', clue: 'Vast body of salt water covering the Earth' },
    { word: 'GALAXY', clue: 'System of millions or billions of stars' },
    { word: 'FOREST', clue: 'Large area covered chiefly with trees' },
    { word: 'DESERT', clue: 'Dry, barren area of land with little rainfall' },
    { word: 'ISLAND', clue: 'Piece of land surrounded by water' },
    { word: 'CANYON', clue: 'Deep gorge, typically with a river flowing through it' },
    { word: 'BRIDGE', clue: 'Structure carrying a road or path across an obstacle' },
    { word: 'CASTLE', clue: 'Large fortified building of the medieval period' },
    { word: 'TEMPLE', clue: 'Building devoted to the worship of a deity' },
    { word: 'VIOLIN', clue: 'Four-stringed musical instrument played with a bow' },
    { word: 'GUITAR', clue: 'Stringed musical instrument with a fretted fingerboard' },
    { word: 'POETRY', clue: 'Literary work in which expression of feelings is given intensity' },
    { word: 'NOVEL', clue: 'Fictitious prose narrative of book length' },
    { word: 'STATUE', clue: 'Carved or cast figure of a person or animal' },
    { word: 'EAGLE', clue: 'Large bird of prey with a massive hooked bill' },
    { word: 'DOLPHIN', clue: 'Intelligent aquatic mammal with a curved dorsal fin' },
    { word: 'TIGER', clue: 'Very large solitary striped cat of Asia' },
    { word: 'OCTOPUS', clue: 'Sea creature with eight soft arms and suction cups' },
    { word: 'FALCON', clue: 'Bird of prey with long, pointed wings' },
  ],
  nature: [
    { word: 'BLOSSOM', clue: 'A flower or mass of flowers on a tree' },
    { word: 'REDWOOD', clue: 'Giant evergreen tree native to California' },
    { word: 'MEADOW', clue: 'A piece of grassland used for pasture or hay' },
    { word: 'VOLCANO', clue: 'Mountain having a crater through which lava erupts' },
    { word: 'GLACIER', clue: 'Slowly moving mass or river of ice' },
    { word: 'LAVENDER', clue: 'Small aromatic shrub with purple flowers' },
    { word: 'ORCHID', clue: 'Plant with complex, often brightly colored flowers' },
    { word: 'STREAM', clue: 'Small, narrow river' },
  ],
};

export class CrosswordGenerator extends BaseGenerator<CrosswordSettings, CrosswordData> {
  readonly type = 'crossword';
  readonly name = 'Crossword';
  readonly defaultSettings: Partial<CrosswordSettings> = {
    puzzleType: 'crossword',
    gridSize: 13,
    difficulty: 'Medium',
    wordList: DEFAULT_CROSSWORD_VOCABULARY.general,
  };

  generate(settings: CrosswordSettings): GeneratedPuzzle<CrosswordSettings, CrosswordData> {
    const startTime = performance.now();
    const prng = new Random(settings.seed || Date.now());

    const size = Math.max(9, Math.min(25, settings.gridSize || 13));
    let sourceWords = settings.wordList && settings.wordList.length > 0
      ? settings.wordList
      : DEFAULT_CROSSWORD_VOCABULARY.general;

    // Filter and sanitize word entries
    const validInputs: CrosswordClueInput[] = sourceWords
      .map(item => ({
        word: item.word.toUpperCase().replace(/[^A-Z]/g, ''),
        clue: item.clue.trim(),
      }))
      .filter(item => item.word.length >= 3 && item.word.length <= size && item.clue.length > 0);

    // Shuffle and pick
    const candidates = prng.shuffle(validInputs);

    // Grid representing letters (null = empty/black)
    const grid: (string | null)[][] = Array.from({ length: size }, () => Array(size).fill(null));
    const placedEntries: {
      word: string;
      clue: string;
      direction: 'across' | 'down';
      row: number;
      col: number;
    }[] = [];

    // Place the first word horizontally in the center
    if (candidates.length > 0) {
      const first = candidates[0];
      const startRow = Math.floor(size / 2);
      const startCol = Math.floor((size - first.word.length) / 2);

      for (let i = 0; i < first.word.length; i++) {
        grid[startRow][startCol + i] = first.word[i];
      }

      placedEntries.push({
        word: first.word,
        clue: first.clue,
        direction: 'across',
        row: startRow,
        col: startCol,
      });
    }

    // Try placing remaining candidates intersecting with already placed words
    for (let cIdx = 1; cIdx < candidates.length; cIdx++) {
      const item = candidates[cIdx];
      const bestPlacement = this.findBestIntersection(grid, item, size, placedEntries, prng);

      if (bestPlacement) {
        // Place word
        const [dRow, dCol] = bestPlacement.direction === 'across' ? [0, 1] : [1, 0];
        for (let i = 0; i < item.word.length; i++) {
          grid[bestPlacement.row + i * dRow][bestPlacement.col + i * dCol] = item.word[i];
        }
        placedEntries.push({
          word: item.word,
          clue: item.clue,
          direction: bestPlacement.direction,
          row: bestPlacement.row,
          col: bestPlacement.col,
        });
      }
    }

    // Number the crossword grid cells
    // Cells that start an across or down word get a sequential number
    const numbers: (number | null)[][] = Array.from({ length: size }, () => Array(size).fill(null));
    let currentNumber = 1;

    const acrossEntries: CrosswordPlacedEntry[] = [];
    const downEntries: CrosswordPlacedEntry[] = [];

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (!grid[r][c]) continue;

        const matchingPlaced = placedEntries.filter(p => p.row === r && p.col === c);

        if (matchingPlaced.length > 0) {
          numbers[r][c] = currentNumber;

          for (const p of matchingPlaced) {
            const entry: CrosswordPlacedEntry = {
              number: currentNumber,
              direction: p.direction,
              word: p.word,
              clue: p.clue,
              row: p.row,
              col: p.col,
              length: p.word.length,
            };

            if (p.direction === 'across') {
              acrossEntries.push(entry);
            } else {
              downEntries.push(entry);
            }
          }
          currentNumber++;
        }
      }
    }

    // Prepare solution grid (string matrix with letter or empty string for black)
    const solutionGrid: string[][] = grid.map(row => row.map(cell => (cell ? cell : '')));

    const data: CrosswordData = {
      size,
      grid,
      numbers,
      acrossEntries,
      downEntries,
      solutionGrid,
    };

    const endTime = performance.now();

    return {
      id: `cw-${settings.seed}-${Date.now().toString(36)}`,
      type: 'crossword',
      title: settings.title || `CROSSWORD PUZZLE #${settings.puzzleNumber || 1}`,
      difficulty: settings.difficulty,
      seed: settings.seed,
      settings,
      data,
      solution: solutionGrid,
      metadata: {
        generatedAt: new Date().toISOString(),
        generatorVersion: '2.0.0',
        itemCount: acrossEntries.length + downEntries.length,
        dimensions: `${size}×${size}`,
        isSolvable: acrossEntries.length + downEntries.length > 0,
        hasUniqueSolution: true,
        generationTimeMs: Math.round(endTime - startTime),
      },
    };
  }

  private findBestIntersection(
    grid: (string | null)[][],
    item: CrosswordClueInput,
    size: number,
    placedEntries: { direction: 'across' | 'down'; word: string; row: number; col: number }[],
    prng: Random
  ): { direction: 'across' | 'down'; row: number; col: number } | null {
    const word = item.word;
    const len = word.length;
    const possiblePlacements: { direction: 'across' | 'down'; row: number; col: number; score: number }[] = [];

    for (const placed of placedEntries) {
      const targetDir: 'across' | 'down' = placed.direction === 'across' ? 'down' : 'across';
      const [dRow, dCol] = targetDir === 'across' ? [0, 1] : [1, 0];

      // Find common letters between placed word and new word
      for (let i = 0; i < placed.word.length; i++) {
        const charOnGrid = placed.word[i];
        const gridR = placed.direction === 'across' ? placed.row : placed.row + i;
        const gridC = placed.direction === 'across' ? placed.col + i : placed.col;

        for (let j = 0; j < len; j++) {
          if (word[j] === charOnGrid) {
            // Test placing new word through this cell
            const startRow = gridR - j * dRow;
            const startCol = gridC - j * dCol;

            // Check boundaries
            const endRow = startRow + (len - 1) * dRow;
            const endCol = startCol + (len - 1) * dCol;

            if (startRow < 0 || endRow >= size || startCol < 0 || endCol >= size) {
              continue;
            }

            if (this.canPlaceCrosswordWord(grid, word, startRow, startCol, targetDir, size)) {
              possiblePlacements.push({
                direction: targetDir,
                row: startRow,
                col: startCol,
                score: prng.nextInt(1, 100),
              });
            }
          }
        }
      }
    }

    if (possiblePlacements.length === 0) return null;
    possiblePlacements.sort((a, b) => b.score - a.score);
    return possiblePlacements[0];
  }

  private canPlaceCrosswordWord(
    grid: (string | null)[][],
    word: string,
    startRow: number,
    startCol: number,
    dir: 'across' | 'down',
    size: number
  ): boolean {
    const len = word.length;
    const [dRow, dCol] = dir === 'across' ? [0, 1] : [1, 0];
    const [perpRow, perpCol] = dir === 'across' ? [1, 0] : [0, 1];

    // Check pre-cell and post-cell (must be empty/null so words don't run into each other)
    const beforeR = startRow - dRow;
    const beforeC = startCol - dCol;
    if (beforeR >= 0 && beforeR < size && beforeC >= 0 && beforeC < size && grid[beforeR][beforeC] !== null) {
      return false;
    }

    const afterR = startRow + len * dRow;
    const afterC = startCol + len * dCol;
    if (afterR >= 0 && afterR < size && afterC >= 0 && afterC < size && grid[afterR][afterC] !== null) {
      return false;
    }

    let intersections = 0;

    for (let i = 0; i < len; i++) {
      const r = startRow + i * dRow;
      const c = startCol + i * dCol;
      const currentCell = grid[r][c];

      if (currentCell !== null) {
        if (currentCell !== word[i]) {
          return false; // Collision
        }
        intersections++;
      } else {
        // If placing into an empty cell, ensure perpendicular adjacent cells are empty
        const p1R = r + perpRow;
        const p1C = c + perpCol;
        const p2R = r - perpRow;
        const p2C = c - perpCol;

        if (p1R >= 0 && p1R < size && p1C >= 0 && p1C < size && grid[p1R][p1C] !== null) {
          return false;
        }
        if (p2R >= 0 && p2R < size && p2C >= 0 && p2C < size && grid[p2R][p2C] !== null) {
          return false;
        }
      }
    }

    return intersections >= 1;
  }

  validate(puzzle: GeneratedPuzzle<CrosswordSettings, CrosswordData>): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const { acrossEntries, downEntries, grid, size } = puzzle.data;

    if (!grid || acrossEntries.length + downEntries.length === 0) {
      errors.push('Crossword has no placed entries');
      return { valid: false, errors, warnings };
    }

    // Verify all across and down words in the grid
    for (const entry of [...acrossEntries, ...downEntries]) {
      const [dRow, dCol] = entry.direction === 'across' ? [0, 1] : [1, 0];
      let str = '';
      for (let i = 0; i < entry.word.length; i++) {
        const r = entry.row + i * dRow;
        const c = entry.col + i * dCol;
        if (r < 0 || r >= size || c < 0 || c >= size) {
          errors.push(`Entry "${entry.word}" extends out of bounds`);
          break;
        }
        str += grid[r][c] || '';
      }
      if (str !== entry.word) {
        errors.push(`Crossword grid does not match entry "${entry.word}" (found "${str}")`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  generateSolution(puzzle: GeneratedPuzzle<CrosswordSettings, CrosswordData>): string[][] {
    return puzzle.data.solutionGrid;
  }
}

import { BaseGenerator, ValidationResult } from '../core/PuzzleGenerator';
import { Random } from '../core/Random';
import { SudokuSettings, SudokuData, GeneratedPuzzle } from '../types';

export class SudokuGenerator extends BaseGenerator<SudokuSettings, SudokuData> {
  readonly type = 'sudoku';
  readonly name = 'Sudoku';
  readonly defaultSettings: Partial<SudokuSettings> = {
    puzzleType: 'sudoku',
    size: 9,
    difficulty: 'Medium',
  };

  generate(settings: SudokuSettings): GeneratedPuzzle<SudokuSettings, SudokuData> {
    const startTime = performance.now();
    const prng = new Random(settings.seed || Date.now());

    const size = settings.size === 4 ? 4 : settings.size === 6 ? 6 : 9;
    const { boxWidth, boxHeight } = this.getBoxDimensions(size);

    // 1. Generate full solved grid
    const solutionGrid = this.generateCompleteGrid(size, boxWidth, boxHeight, prng);

    // 2. Remove clues according to difficulty / settings
    const initialGrid = this.createPuzzleGrid(
      solutionGrid,
      size,
      settings.difficulty || 'Medium',
      settings.clueDensity,
      settings.symmetryPreference,
      prng
    );

    const remainingClues = initialGrid.flat().filter(c => c !== null).length;

    const data: SudokuData = {
      size,
      boxWidth,
      boxHeight,
      initialGrid,
      solutionGrid,
    };

    const endTime = performance.now();

    return {
      id: `sdk-${settings.seed}-${Date.now().toString(36)}`,
      type: 'sudoku',
      title: settings.title || `SUDOKU ${size}×${size} - ${(settings.difficulty || 'Medium').toUpperCase()}`,
      difficulty: settings.difficulty || 'Medium',
      seed: settings.seed || 12345,
      settings,
      data,
      solution: solutionGrid,
      metadata: {
        generatedAt: new Date().toISOString(),
        generatorVersion: '2.5.0',
        dimensions: `${size}×${size}`,
        itemCount: remainingClues,
        isSolvable: true,
        hasUniqueSolution: true,
        generationTimeMs: Math.round(endTime - startTime),
      },
    };
  }

  private getBoxDimensions(size: number): { boxWidth: number; boxHeight: number } {
    if (size === 4) return { boxWidth: 2, boxHeight: 2 };
    if (size === 6) return { boxWidth: 3, boxHeight: 2 };
    return { boxWidth: 3, boxHeight: 3 };
  }

  private generateCompleteGrid(
    size: number,
    boxWidth: number,
    boxHeight: number,
    prng: Random
  ): number[][] {
    const grid: number[][] = Array.from({ length: size }, () => Array(size).fill(0));

    const fillGrid = (row: number, col: number): boolean => {
      if (row === size) return true;
      const nextRow = col === size - 1 ? row + 1 : row;
      const nextCol = col === size - 1 ? 0 : col + 1;

      const numbers = prng.shuffle(Array.from({ length: size }, (_, i) => i + 1));

      for (const num of numbers) {
        if (this.isValidPlacement(grid, row, col, num, size, boxWidth, boxHeight)) {
          grid[row][col] = num;
          if (fillGrid(nextRow, nextCol)) return true;
          grid[row][col] = 0;
        }
      }
      return false;
    };

    fillGrid(0, 0);
    return grid;
  }

  private isValidPlacement(
    grid: (number | null)[][],
    row: number,
    col: number,
    num: number,
    size: number,
    boxWidth: number,
    boxHeight: number
  ): boolean {
    // Check row
    for (let c = 0; c < size; c++) {
      if (grid[row][c] === num) return false;
    }

    // Check column
    for (let r = 0; r < size; r++) {
      if (grid[r][col] === num) return false;
    }

    // Check box
    const startRow = Math.floor(row / boxHeight) * boxHeight;
    const startCol = Math.floor(col / boxWidth) * boxWidth;

    for (let r = 0; r < boxHeight; r++) {
      for (let c = 0; c < boxWidth; c++) {
        if (grid[startRow + r][startCol + c] === num) return false;
      }
    }

    return true;
  }

  private createPuzzleGrid(
    solutionGrid: number[][],
    size: number,
    difficulty: string,
    clueDensity: number | undefined,
    symmetry: string | undefined,
    prng: Random
  ): (number | null)[][] {
    const puzzle: (number | null)[][] = solutionGrid.map(r => [...r]);
    const totalCells = size * size;

    // Determine target remaining clues
    let targetClues = totalCells - 40;
    if (clueDensity && clueDensity >= (size === 4 ? 4 : size === 6 ? 10 : 17) && clueDensity <= totalCells) {
      targetClues = clueDensity;
    } else if (size === 9) {
      switch (difficulty) {
        case 'Easy':
          targetClues = 48;
          break;
        case 'Medium':
          targetClues = 38;
          break;
        case 'Hard':
          targetClues = 32;
          break;
        case 'Expert':
          targetClues = 26;
          break;
        default:
          targetClues = 36;
      }
    } else if (size === 6) {
      targetClues = difficulty === 'Easy' ? 22 : difficulty === 'Medium' ? 18 : 14;
    } else {
      // 4x4
      targetClues = difficulty === 'Easy' ? 10 : difficulty === 'Medium' ? 8 : 6;
    }

    const cluesToRemove = totalCells - targetClues;

    const cells: [number, number][] = [];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        cells.push([r, c]);
      }
    }

    const shuffledCells = prng.shuffle(cells);
    let removed = 0;

    for (const [r, c] of shuffledCells) {
      if (removed >= cluesToRemove) break;
      if (puzzle[r][c] === null) continue;

      const backup = puzzle[r][c];
      puzzle[r][c] = null;

      // Handle symmetry pair if requested
      let symR = -1;
      let symC = -1;
      let symBackup: number | null = null;

      if (symmetry === 'rotational') {
        symR = size - 1 - r;
        symC = size - 1 - c;
      } else if (symmetry === 'horizontal') {
        symR = r;
        symC = size - 1 - c;
      } else if (symmetry === 'diagonal') {
        symR = c;
        symC = r;
      }

      if (symR >= 0 && symC >= 0 && (symR !== r || symC !== c) && puzzle[symR][symC] !== null) {
        symBackup = puzzle[symR][symC];
        puzzle[symR][symC] = null;
      }

      // Verify unique solution
      if (this.countSolutions(puzzle, size, this.getBoxDimensions(size)) !== 1) {
        // Rollback
        puzzle[r][c] = backup;
        if (symBackup !== null && symR >= 0 && symC >= 0) {
          puzzle[symR][symC] = symBackup;
        }
      } else {
        removed++;
        if (symBackup !== null) removed++;
      }
    }

    return puzzle;
  }

  private countSolutions(
    grid: (number | null)[][],
    size: number,
    boxDims: { boxWidth: number; boxHeight: number },
    limit: number = 2
  ): number {
    let count = 0;

    const solve = (row: number, col: number) => {
      if (count >= limit) return;
      if (row === size) {
        count++;
        return;
      }

      const nextRow = col === size - 1 ? row + 1 : row;
      const nextCol = col === size - 1 ? 0 : col + 1;

      if (grid[row][col] !== null) {
        solve(nextRow, nextCol);
        return;
      }

      for (let num = 1; num <= size; num++) {
        if (this.isValidPlacement(grid, row, col, num, size, boxDims.boxWidth, boxDims.boxHeight)) {
          grid[row][col] = num;
          solve(nextRow, nextCol);
          grid[row][col] = null;
        }
      }
    };

    // Make copy so we don't mutate input
    const copy = grid.map(r => [...r]);
    solve(0, 0);
    return count;
  }

  validate(puzzle: GeneratedPuzzle<SudokuSettings, SudokuData>): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const { size, initialGrid, solutionGrid, boxWidth, boxHeight } = puzzle.data;

    if (!initialGrid || !solutionGrid) {
      errors.push('Sudoku grid or solution is missing');
      return { valid: false, errors, warnings };
    }

    // Verify solution grid correctness
    for (let r = 0; r < size; r++) {
      const rowVals = new Set<number>();
      for (let c = 0; c < size; c++) {
        const val = solutionGrid[r][c];
        if (!val || val < 1 || val > size) {
          errors.push(`Invalid solution number ${val} at (${r}, ${c})`);
        }
        if (rowVals.has(val)) {
          errors.push(`Duplicate number ${val} in solution row ${r + 1}`);
        }
        rowVals.add(val);
      }
    }

    // Verify initial clues match solution
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const initVal = initialGrid[r][c];
        if (initVal !== null && initVal !== solutionGrid[r][c]) {
          errors.push(`Initial clue at (${r}, ${c}) does not match solution`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  generateSolution(puzzle: GeneratedPuzzle<SudokuSettings, SudokuData>): number[][] {
    return puzzle.data.solutionGrid;
  }
}

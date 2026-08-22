import { BaseGenerator, ValidationResult } from '../core/PuzzleGenerator';
import { Random } from '../core/Random';
import { MazeSettings, MazeData, GeneratedPuzzle, MazeCell } from '../types';

export class MazeGenerator extends BaseGenerator<MazeSettings, MazeData> {
  readonly type = 'maze';
  readonly name = 'Maze Labyrinth';
  readonly defaultSettings: Partial<MazeSettings> = {
    puzzleType: 'maze',
    width: 21,
    height: 21,
    difficulty: 'Medium',
    algorithm: 'dfs',
    startPosition: 'top_left',
    endPosition: 'bottom_right',
  };

  generate(settings: MazeSettings): GeneratedPuzzle<MazeSettings, MazeData> {
    const startTime = performance.now();
    const prng = new Random(settings.seed || Date.now());

    let width = settings.width || 21;
    let height = settings.height || 21;

    // Adjust grid size for difficulty if default sizes are used
    if (!settings.width || !settings.height) {
      if (settings.difficulty === 'Easy') {
        width = 15;
        height = 15;
      } else if (settings.difficulty === 'Medium') {
        width = 23;
        height = 23;
      } else if (settings.difficulty === 'Hard') {
        width = 31;
        height = 31;
      } else {
        // Expert
        width = 39;
        height = 39;
      }
    }

    // Ensure dimensions are odd for crisp passage rendering
    if (width % 2 === 0) width += 1;
    if (height % 2 === 0) height += 1;

    // Initialize full walled grid
    const grid: MazeCell[][] = Array.from({ length: height }, (_, r) =>
      Array.from({ length: width }, (_, c) => ({
        row: r,
        col: c,
        walls: { top: true, right: true, bottom: true, left: true },
      }))
    );

    // Determine start & end positions
    const start = this.getStartPosition(settings.startPosition, width, height);
    const end = this.getEndPosition(settings.endPosition, width, height);

    const algorithm = settings.algorithm || 'dfs';

    if (algorithm === 'prims') {
      this.generatePrimsMaze(grid, start, width, height, prng);
    } else {
      // Randomized DFS / Recursive Backtracking
      this.generateDfsMaze(grid, start, width, height, prng);
    }

    // Knock open entry & exit on perimeter
    if (start.row === 0) grid[start.row][start.col].walls.top = false;
    else if (start.col === 0) grid[start.row][start.col].walls.left = false;

    if (end.row === height - 1) grid[end.row][end.col].walls.bottom = false;
    else if (end.col === width - 1) grid[end.row][end.col].walls.right = false;

    // Find shortest solution path using BFS
    const solutionPath = this.solveMaze(grid, start, end, width, height);

    const data: MazeData = {
      width,
      height,
      grid,
      start,
      end,
      solutionPath,
    };

    const endTime = performance.now();

    return {
      id: `mz-${settings.seed}-${Date.now().toString(36)}`,
      type: 'maze',
      title: settings.title || `MAZE LABYRINTH - ${(settings.difficulty || 'Medium').toUpperCase()}`,
      difficulty: settings.difficulty || 'Medium',
      seed: settings.seed || 12345,
      settings,
      data,
      solution: solutionPath,
      metadata: {
        generatedAt: new Date().toISOString(),
        generatorVersion: '2.5.0',
        dimensions: `${width}×${height}`,
        itemCount: solutionPath.length,
        isSolvable: solutionPath.length > 0,
        hasUniqueSolution: true,
        generationTimeMs: Math.round(endTime - startTime),
      },
    };
  }

  private getStartPosition(pos: string | undefined, width: number, height: number) {
    if (pos === 'top_right') return { row: 0, col: width - 1 };
    if (pos === 'bottom_left') return { row: height - 1, col: 0 };
    if (pos === 'top_center') return { row: 0, col: Math.floor(width / 2) };
    return { row: 0, col: 0 };
  }

  private getEndPosition(pos: string | undefined, width: number, height: number) {
    if (pos === 'bottom_left') return { row: height - 1, col: 0 };
    if (pos === 'top_right') return { row: 0, col: width - 1 };
    if (pos === 'bottom_center') return { row: height - 1, col: Math.floor(width / 2) };
    return { row: height - 1, col: width - 1 };
  }

  private generateDfsMaze(
    grid: MazeCell[][],
    start: { row: number; col: number },
    width: number,
    height: number,
    prng: Random
  ) {
    const visited: boolean[][] = Array.from({ length: height }, () => Array(width).fill(false));
    const stack: [number, number][] = [];

    visited[start.row][start.col] = true;
    stack.push([start.row, start.col]);

    while (stack.length > 0) {
      const [currR, currC] = stack[stack.length - 1];
      const neighbors: { r: number; c: number; dir: 'top' | 'right' | 'bottom' | 'left' }[] = [];

      if (currR > 0 && !visited[currR - 1][currC]) neighbors.push({ r: currR - 1, c: currC, dir: 'top' });
      if (currC < width - 1 && !visited[currR][currC + 1]) neighbors.push({ r: currR, c: currC + 1, dir: 'right' });
      if (currR < height - 1 && !visited[currR + 1][currC]) neighbors.push({ r: currR + 1, c: currC, dir: 'bottom' });
      if (currC > 0 && !visited[currR][currC - 1]) neighbors.push({ r: currR, c: currC - 1, dir: 'left' });

      if (neighbors.length > 0) {
        const next = prng.choice(neighbors);

        if (next.dir === 'top') {
          grid[currR][currC].walls.top = false;
          grid[next.r][next.c].walls.bottom = false;
        } else if (next.dir === 'right') {
          grid[currR][currC].walls.right = false;
          grid[next.r][next.c].walls.left = false;
        } else if (next.dir === 'bottom') {
          grid[currR][currC].walls.bottom = false;
          grid[next.r][next.c].walls.top = false;
        } else if (next.dir === 'left') {
          grid[currR][currC].walls.left = false;
          grid[next.r][next.c].walls.right = false;
        }

        visited[next.r][next.c] = true;
        stack.push([next.r, next.c]);
      } else {
        stack.pop();
      }
    }
  }

  private generatePrimsMaze(
    grid: MazeCell[][],
    start: { row: number; col: number },
    width: number,
    height: number,
    prng: Random
  ) {
    const inMaze: boolean[][] = Array.from({ length: height }, () => Array(width).fill(false));
    inMaze[start.row][start.col] = true;

    // List of candidate frontier edges: [fromR, fromC, toR, toC, dir]
    const frontier: { fromR: number; fromC: number; toR: number; toC: number; dir: 'top' | 'right' | 'bottom' | 'left' }[] = [];

    const addFrontier = (r: number, c: number) => {
      if (r > 0 && !inMaze[r - 1][c]) frontier.push({ fromR: r, fromC: c, toR: r - 1, toC: c, dir: 'top' });
      if (c < width - 1 && !inMaze[r][c + 1]) frontier.push({ fromR: r, fromC: c, toR: r, toC: c + 1, dir: 'right' });
      if (r < height - 1 && !inMaze[r + 1][c]) frontier.push({ fromR: r, fromC: c, toR: r + 1, toC: c, dir: 'bottom' });
      if (c > 0 && !inMaze[r][c - 1]) frontier.push({ fromR: r, fromC: c, toR: r, toC: c - 1, dir: 'left' });
    };

    addFrontier(start.row, start.col);

    while (frontier.length > 0) {
      const idx = prng.nextInt(0, frontier.length - 1);
      const edge = frontier.splice(idx, 1)[0];

      if (!inMaze[edge.toR][edge.toC]) {
        inMaze[edge.toR][edge.toC] = true;

        if (edge.dir === 'top') {
          grid[edge.fromR][edge.fromC].walls.top = false;
          grid[edge.toR][edge.toC].walls.bottom = false;
        } else if (edge.dir === 'right') {
          grid[edge.fromR][edge.fromC].walls.right = false;
          grid[edge.toR][edge.toC].walls.left = false;
        } else if (edge.dir === 'bottom') {
          grid[edge.fromR][edge.fromC].walls.bottom = false;
          grid[edge.toR][edge.toC].walls.top = false;
        } else if (edge.dir === 'left') {
          grid[edge.fromR][edge.fromC].walls.left = false;
          grid[edge.toR][edge.toC].walls.right = false;
        }

        addFrontier(edge.toR, edge.toC);
      }
    }
  }

  private solveMaze(
    grid: MazeCell[][],
    start: { row: number; col: number },
    end: { row: number; col: number },
    width: number,
    height: number
  ): { row: number; col: number }[] {
    const queue: { r: number; c: number; path: { row: number; col: number }[] }[] = [];
    const visited: boolean[][] = Array.from({ length: height }, () => Array(width).fill(false));

    queue.push({ r: start.row, c: start.col, path: [start] });
    visited[start.row][start.col] = true;

    while (queue.length > 0) {
      const { r, c, path } = queue.shift()!;

      if (r === end.row && c === end.col) {
        return path;
      }

      const cell = grid[r][c];

      if (!cell.walls.top && r > 0 && !visited[r - 1][c]) {
        visited[r - 1][c] = true;
        queue.push({ r: r - 1, c, path: [...path, { row: r - 1, col: c }] });
      }
      if (!cell.walls.right && c < width - 1 && !visited[r][c + 1]) {
        visited[r][c + 1] = true;
        queue.push({ r, c: c + 1, path: [...path, { row: r, col: c + 1 }] });
      }
      if (!cell.walls.bottom && r < height - 1 && !visited[r + 1][c]) {
        visited[r + 1][c] = true;
        queue.push({ r: r + 1, c, path: [...path, { row: r + 1, col: c }] });
      }
      if (!cell.walls.left && c > 0 && !visited[r][c - 1]) {
        visited[r][c - 1] = true;
        queue.push({ r, c: c - 1, path: [...path, { row: r, col: c - 1 }] });
      }
    }

    return [];
  }

  validate(puzzle: GeneratedPuzzle<MazeSettings, MazeData>): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!puzzle.data.solutionPath || puzzle.data.solutionPath.length === 0) {
      errors.push('No valid route from start to finish found in maze.');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  generateSolution(puzzle: GeneratedPuzzle<MazeSettings, MazeData>): { row: number; col: number }[] {
    return puzzle.data.solutionPath;
  }
}

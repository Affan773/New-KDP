import { PuzzleRegistry } from '../core/PuzzleRegistry';
import { AnyPuzzleSettings, GeneratedPuzzle, PuzzleType } from '../types';

export interface BatchGenerationProgress {
  current: number;
  total: number;
  percent: number;
  statusText: string;
}

export interface BatchGenerationOptions {
  count: number;
  baseSettings: AnyPuzzleSettings;
  startSeed?: number;
  onProgress?: (progress: BatchGenerationProgress) => void;
  signal?: AbortSignal;
}

export class BatchGenerationService {
  /**
   * Generates a batch of unique puzzles deterministically and asynchronously.
   */
  static async generateBatch(options: BatchGenerationOptions): Promise<GeneratedPuzzle[]> {
    const { count, baseSettings, startSeed = 100, onProgress, signal } = options;
    const puzzles: GeneratedPuzzle[] = [];
    const seenSignatures = new Set<string>();

    let currentSeed = startSeed;
    const maxRetriesPerItem = 15;

    for (let i = 0; i < count; i++) {
      if (signal?.aborted) {
        throw new Error('Batch generation was cancelled by user');
      }

      let attempts = 0;
      let generated: GeneratedPuzzle | null = null;

      while (attempts < maxRetriesPerItem) {
        if (signal?.aborted) throw new Error('Batch generation was cancelled');

        const itemSettings: AnyPuzzleSettings = {
          ...baseSettings,
          seed: currentSeed,
          puzzleNumber: i + 1,
          title: baseSettings.title
            ? `${baseSettings.title} #${i + 1}`
            : `${getPuzzleTypeDisplayName(baseSettings.puzzleType)} #${i + 1}`,
        };

        const puzzle = PuzzleRegistry.generate(itemSettings);
        const signature = this.getPuzzleSignature(puzzle);

        if (!seenSignatures.has(signature)) {
          seenSignatures.add(signature);
          generated = puzzle;
          currentSeed++;
          break;
        } else {
          // Collision: increment seed and retry
          currentSeed += 7;
          attempts++;
        }
      }

      if (!generated) {
        throw new Error(
          `Could not generate unique puzzle #${i + 1} after ${maxRetriesPerItem} attempts. Please increase word list variety or change puzzle settings.`
        );
      }

      puzzles.push(generated);

      if (onProgress) {
        const current = i + 1;
        const percent = Math.round((current / count) * 100);
        onProgress({
          current,
          total: count,
          percent,
          statusText: `Generating ${current} of ${count}: ${generated.title}`,
        });
      }

      // Yield event loop every 2 puzzles so UI remains buttery smooth
      if (i % 2 === 0) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }

    return puzzles;
  }

  private static getPuzzleSignature(puzzle: GeneratedPuzzle): string {
    // Generate a unique fingerprint based on puzzle solution or primary content
    if (typeof puzzle.solution === 'string') {
      return puzzle.solution;
    }
    return JSON.stringify(puzzle.solution);
  }
}

function getPuzzleTypeDisplayName(type: PuzzleType): string {
  switch (type) {
    case 'word_search':
      return 'Word Search';
    case 'sudoku':
      return 'Sudoku';
    case 'crossword':
      return 'Crossword';
    case 'maze':
      return 'Maze';
    case 'cryptogram':
      return 'Cryptogram';
    case 'word_scramble':
      return 'Word Scramble';
    case 'number_puzzle':
      return 'Number Puzzle';
    case 'logic_grid':
      return 'Logic Grid';
    default:
      return 'Puzzle';
  }
}

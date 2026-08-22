import { PuzzleType, AnyPuzzleSettings, AnyPuzzleData, GeneratedPuzzle } from '../types';
import { PuzzleGenerator, ValidationResult } from './PuzzleGenerator';
import { WordSearchGenerator } from '../generators/WordSearchGenerator';
import { SudokuGenerator } from '../generators/SudokuGenerator';
import { CrosswordGenerator } from '../generators/CrosswordGenerator';
import { MazeGenerator } from '../generators/MazeGenerator';
import { CryptogramGenerator } from '../generators/CryptogramGenerator';
import { WordScrambleGenerator } from '../generators/WordScrambleGenerator';
import { NumberPuzzleGenerator } from '../generators/NumberPuzzleGenerator';
import { LogicPuzzleGenerator } from '../generators/LogicPuzzleGenerator';

class PuzzleRegistryClass {
  private generators = new Map<PuzzleType, PuzzleGenerator<any, any>>();

  constructor() {
    this.register(new WordSearchGenerator());
    this.register(new SudokuGenerator());
    this.register(new CrosswordGenerator());
    this.register(new MazeGenerator());
    this.register(new CryptogramGenerator());
    this.register(new WordScrambleGenerator());
    this.register(new NumberPuzzleGenerator());
    this.register(new LogicPuzzleGenerator());
  }

  register(generator: PuzzleGenerator<any, any>): void {
    this.generators.set(generator.type, generator);
  }

  get<TSettings extends AnyPuzzleSettings = AnyPuzzleSettings, TData extends AnyPuzzleData = AnyPuzzleData>(
    type: PuzzleType
  ): PuzzleGenerator<TSettings, TData> {
    const gen = this.generators.get(type);
    if (!gen) {
      throw new Error(`No puzzle generator registered for type "${type}"`);
    }
    return gen as PuzzleGenerator<TSettings, TData>;
  }

  has(type: PuzzleType): boolean {
    return this.generators.has(type);
  }

  getAllTypes(): PuzzleType[] {
    return Array.from(this.generators.keys());
  }

  generate(settings: AnyPuzzleSettings): GeneratedPuzzle {
    const generator = this.get(settings.puzzleType);
    const puzzle = generator.generate(settings);
    return puzzle;
  }

  validate(puzzle: GeneratedPuzzle): ValidationResult {
    const generator = this.get(puzzle.type);
    return generator.validate(puzzle);
  }
}

export const PuzzleRegistry = new PuzzleRegistryClass();

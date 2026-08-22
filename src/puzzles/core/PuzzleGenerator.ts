import {
  PuzzleType,
  PuzzleDifficulty,
  GeneratedPuzzle,
  BasePuzzleSettings,
  AnyPuzzleSettings,
  AnyPuzzleData,
} from '../types';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface PuzzleGenerator<
  TSettings extends BasePuzzleSettings = AnyPuzzleSettings,
  TData extends AnyPuzzleData = AnyPuzzleData
> {
  readonly type: PuzzleType;
  readonly name: string;
  readonly defaultSettings: Partial<TSettings>;

  generate(settings: TSettings): GeneratedPuzzle<TSettings, TData>;
  validate(puzzle: GeneratedPuzzle<TSettings, TData>): ValidationResult;
  generateSolution(puzzle: GeneratedPuzzle<TSettings, TData>): unknown;
  getDifficulty(settings: TSettings): PuzzleDifficulty;
  getMetadata(puzzle: GeneratedPuzzle<TSettings, TData>): Record<string, unknown>;
}

export abstract class BaseGenerator<
  TSettings extends BasePuzzleSettings,
  TData extends AnyPuzzleData
> implements PuzzleGenerator<TSettings, TData> {
  abstract readonly type: PuzzleType;
  abstract readonly name: string;
  abstract readonly defaultSettings: Partial<TSettings>;

  abstract generate(settings: TSettings): GeneratedPuzzle<TSettings, TData>;
  abstract validate(puzzle: GeneratedPuzzle<TSettings, TData>): ValidationResult;
  abstract generateSolution(puzzle: GeneratedPuzzle<TSettings, TData>): unknown;

  getDifficulty(settings: TSettings): PuzzleDifficulty {
    return settings.difficulty || 'Medium';
  }

  getMetadata(puzzle: GeneratedPuzzle<TSettings, TData>): Record<string, unknown> {
    return puzzle.metadata || {};
  }
}

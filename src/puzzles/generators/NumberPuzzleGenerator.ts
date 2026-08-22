import { BaseGenerator, ValidationResult } from '../core/PuzzleGenerator';
import { Random } from '../core/Random';
import {
  NumberPuzzleSettings,
  NumberPuzzleData,
  NumberSequenceItem,
  MissingNumberItem,
  GeneratedPuzzle,
} from '../types';

export class NumberPuzzleGenerator extends BaseGenerator<NumberPuzzleSettings, NumberPuzzleData> {
  readonly type = 'number_puzzle';
  readonly name = 'Number Puzzle';
  readonly defaultSettings: Partial<NumberPuzzleSettings> = {
    puzzleType: 'number_puzzle',
    subType: 'sequence',
    difficulty: 'Medium',
    itemCount: 6,
  };

  generate(settings: NumberPuzzleSettings): GeneratedPuzzle<NumberPuzzleSettings, NumberPuzzleData> {
    const startTime = performance.now();
    const prng = new Random(settings.seed || Date.now());

    const subType = settings.subType || 'sequence';
    const count = settings.itemCount || (settings.difficulty === 'Easy' ? 4 : settings.difficulty === 'Medium' ? 6 : 8);

    let sequences: NumberSequenceItem[] | undefined;
    let missingNumbers: MissingNumberItem[] | undefined;

    if (subType === 'sequence') {
      sequences = this.generateSequences(count, settings.difficulty, prng);
    } else {
      missingNumbers = this.generateMissingNumbers(count, settings.difficulty, prng);
    }

    const data: NumberPuzzleData = {
      subType,
      sequences,
      missingNumbers,
    };

    const solution = subType === 'sequence'
      ? sequences!.map(s => `Problem: ${s.sequence.join(', ')} → Answer: ${s.answer} (${s.ruleDescription})`)
      : missingNumbers!.map(m => `Equation: ${m.equation} → Answer: ${m.answer} (${m.explanation})`);

    const endTime = performance.now();

    return {
      id: `np-${settings.seed}-${Date.now().toString(36)}`,
      type: 'number_puzzle',
      title: settings.title || `NUMBER BRAIN TEASERS (${settings.difficulty.toUpperCase()})`,
      difficulty: settings.difficulty,
      seed: settings.seed,
      settings,
      data,
      solution,
      metadata: {
        generatedAt: new Date().toISOString(),
        generatorVersion: '2.0.0',
        itemCount: count,
        isSolvable: true,
        hasUniqueSolution: true,
        generationTimeMs: Math.round(endTime - startTime),
      },
    };
  }

  private generateSequences(count: number, difficulty: string, prng: Random): NumberSequenceItem[] {
    const items: NumberSequenceItem[] = [];

    for (let i = 0; i < count; i++) {
      const typeChoice = prng.nextInt(1, 4);
      let seq: number[] = [];
      let rule = '';
      const len = 6;

      if (typeChoice === 1) {
        // Arithmetic Progression: an = a + n*d
        const start = prng.nextInt(2, 20);
        const step = difficulty === 'Easy' ? prng.nextInt(2, 6) : prng.nextInt(4, 15);
        for (let j = 0; j < len; j++) {
          seq.push(start + j * step);
        }
        rule = `Add ${step} each time`;
      } else if (typeChoice === 2) {
        // Geometric / Multiplication:
        const start = prng.nextInt(1, 4);
        const mult = difficulty === 'Easy' ? 2 : prng.nextInt(2, 3);
        let curr = start;
        for (let j = 0; j < len; j++) {
          seq.push(curr);
          curr *= mult;
        }
        rule = `Multiply by ${mult} each time`;
      } else if (typeChoice === 3) {
        // Increasing difference: +1, +2, +3, +4...
        let curr = prng.nextInt(1, 10);
        let step = prng.nextInt(1, 3);
        for (let j = 0; j < len; j++) {
          seq.push(curr);
          curr += step + j;
        }
        rule = `Add increasing step (+${step}, +${step + 1}, +${step + 2}...)`;
      } else {
        // Alternating operations: +a, -b or +a, *b
        const start = prng.nextInt(5, 20);
        const addVal = prng.nextInt(3, 8);
        const subVal = prng.nextInt(1, 4);
        let curr = start;
        for (let j = 0; j < len; j++) {
          seq.push(curr);
          curr = j % 2 === 0 ? curr + addVal : curr - subVal;
        }
        rule = `Alternate: +${addVal}, -${subVal}`;
      }

      // Choose missing index (typically last or second to last)
      const missingIndex = difficulty === 'Easy' ? len - 1 : prng.nextInt(len - 2, len - 1);
      const answer = seq[missingIndex];

      const displaySeq: (number | string)[] = seq.map((val, idx) =>
        idx === missingIndex ? '?' : val
      );

      items.push({
        id: `seq-${i + 1}`,
        sequence: displaySeq,
        missingIndex,
        ruleDescription: rule,
        answer,
      });
    }

    return items;
  }

  private generateMissingNumbers(count: number, difficulty: string, prng: Random): MissingNumberItem[] {
    const items: MissingNumberItem[] = [];

    for (let i = 0; i < count; i++) {
      const a = prng.nextInt(10, difficulty === 'Easy' ? 50 : 150);
      const b = prng.nextInt(5, difficulty === 'Easy' ? 30 : 90);
      const opChoice = prng.choice(['+', '-', '*']);

      if (opChoice === '+') {
        const sum = a + b;
        const hideFirst = prng.chance(0.5);
        items.push({
          id: `eq-${i + 1}`,
          equation: hideFirst ? `[ ? ] + ${b} = ${sum}` : `${a} + [ ? ] = ${sum}`,
          answer: hideFirst ? a : b,
          explanation: `${sum} - ${hideFirst ? b : a} = ${hideFirst ? a : b}`,
        });
      } else if (opChoice === '-') {
        const diff = a - b;
        const hideA = prng.chance(0.5);
        items.push({
          id: `eq-${i + 1}`,
          equation: hideA ? `[ ? ] - ${b} = ${diff}` : `${a} - [ ? ] = ${diff}`,
          answer: hideA ? a : b,
          explanation: hideA ? `${diff} + ${b} = ${a}` : `${a} - ${diff} = ${b}`,
        });
      } else {
        // Multiplication
        const x = prng.nextInt(3, 12);
        const y = prng.nextInt(3, 12);
        const prod = x * y;
        const hideX = prng.chance(0.5);
        items.push({
          id: `eq-${i + 1}`,
          equation: hideX ? `[ ? ] × ${y} = ${prod}` : `${x} × [ ? ] = ${prod}`,
          answer: hideX ? x : y,
          explanation: `${prod} ÷ ${hideX ? y : x} = ${hideX ? x : y}`,
        });
      }
    }

    return items;
  }

  validate(puzzle: GeneratedPuzzle<NumberPuzzleSettings, NumberPuzzleData>): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const { sequences, missingNumbers } = puzzle.data;

    if (!sequences && !missingNumbers) {
      errors.push('No number puzzles items exist');
      return { valid: false, errors, warnings };
    }

    if (sequences) {
      for (const s of sequences) {
        if (typeof s.answer !== 'number' || isNaN(s.answer)) {
          errors.push(`Sequence item ${s.id} has invalid answer: ${s.answer}`);
        }
      }
    }

    if (missingNumbers) {
      for (const m of missingNumbers) {
        if (typeof m.answer !== 'number' || isNaN(m.answer)) {
          errors.push(`Missing number item ${m.id} has invalid answer: ${m.answer}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  generateSolution(puzzle: GeneratedPuzzle<NumberPuzzleSettings, NumberPuzzleData>): unknown {
    return puzzle.solution;
  }
}

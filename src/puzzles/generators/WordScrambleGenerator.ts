import { BaseGenerator, ValidationResult } from '../core/PuzzleGenerator';
import { Random } from '../core/Random';
import {
  WordScrambleSettings,
  WordScrambleData,
  WordScrambleItem,
  GeneratedPuzzle,
} from '../types';
import { BUILT_IN_WORD_THEMES, sanitizeWordList } from '../utils/wordLists';

export class WordScrambleGenerator extends BaseGenerator<WordScrambleSettings, WordScrambleData> {
  readonly type = 'word_scramble';
  readonly name = 'Word Scramble';
  readonly defaultSettings: Partial<WordScrambleSettings> = {
    puzzleType: 'word_scramble',
    difficulty: 'Medium',
    theme: 'nature',
    words: BUILT_IN_WORD_THEMES.nature.words.slice(0, 10),
  };

  generate(settings: WordScrambleSettings): GeneratedPuzzle<WordScrambleSettings, WordScrambleData> {
    const startTime = performance.now();
    const prng = new Random(settings.seed || Date.now());

    let source = settings.words;
    if (!source || source.length === 0) {
      const themeKey = (settings.theme || 'nature').toLowerCase();
      const themeObj = BUILT_IN_WORD_THEMES[themeKey] || BUILT_IN_WORD_THEMES.nature;
      source = themeObj.words;
    }

    const { words: cleanedWords } = sanitizeWordList(source, 3, 14);
    const count = settings.difficulty === 'Easy' ? 6 : settings.difficulty === 'Medium' ? 10 : 14;
    const selected = prng.sample(cleanedWords, Math.min(cleanedWords.length, count));

    const items: WordScrambleItem[] = [];

    for (let i = 0; i < selected.length; i++) {
      const original = selected[i];
      const scrambled = this.scrambleWord(original, prng);

      let hint: string | undefined = undefined;
      if (settings.difficulty === 'Easy' && original.length > 4) {
        hint = `First letter: ${original[0]}`;
      }

      items.push({
        id: `wsc-${i + 1}`,
        original,
        scrambled,
        hint,
      });
    }

    const data: WordScrambleData = {
      items,
      theme: settings.theme,
    };

    const endTime = performance.now();

    return {
      id: `wsb-${settings.seed}-${Date.now().toString(36)}`,
      type: 'word_scramble',
      title: settings.title || (settings.theme ? `${settings.theme.toUpperCase()} WORD SCRAMBLE` : 'WORD SCRAMBLE'),
      difficulty: settings.difficulty,
      seed: settings.seed,
      settings,
      data,
      solution: items.map(it => `${it.scrambled} → ${it.original}`),
      metadata: {
        generatedAt: new Date().toISOString(),
        generatorVersion: '2.0.0',
        itemCount: items.length,
        isSolvable: items.length > 0,
        hasUniqueSolution: true,
        generationTimeMs: Math.round(endTime - startTime),
      },
    };
  }

  private scrambleWord(word: string, prng: Random): string {
    const letters = word.split('');
    const unique = new Set(letters);

    // If word is all same letter, return as is
    if (unique.size <= 1) return word;

    let scrambled = word;
    let attempts = 0;

    // Ensure scrambled version is not identical to original
    while (scrambled === word && attempts < 30) {
      scrambled = prng.shuffle([...letters]).join('');
      attempts++;
    }

    return scrambled;
  }

  validate(puzzle: GeneratedPuzzle<WordScrambleSettings, WordScrambleData>): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const { items } = puzzle.data;
    if (!items || items.length === 0) {
      errors.push('No scramble items generated');
      return { valid: false, errors, warnings };
    }

    for (const it of items) {
      if (!it.original || !it.scrambled) {
        errors.push(`Scramble item missing original or scrambled word`);
        continue;
      }

      // Check letter frequencies match
      const origLetters = it.original.split('').sort().join('');
      const scramLetters = it.scrambled.split('').sort().join('');

      if (origLetters !== scramLetters) {
        errors.push(`Scrambled word "${it.scrambled}" letters do not match original "${it.original}"`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  generateSolution(puzzle: GeneratedPuzzle<WordScrambleSettings, WordScrambleData>): Record<string, string> {
    const sol: Record<string, string> = {};
    for (const it of puzzle.data.items) {
      sol[it.scrambled] = it.original;
    }
    return sol;
  }
}

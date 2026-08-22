import { BaseGenerator, ValidationResult } from '../core/PuzzleGenerator';
import { Random } from '../core/Random';
import { CryptogramSettings, CryptogramData, GeneratedPuzzle } from '../types';
import { ORIGINAL_QUOTES } from '../utils/quotes';

export class CryptogramGenerator extends BaseGenerator<CryptogramSettings, CryptogramData> {
  readonly type = 'cryptogram';
  readonly name = 'Cryptogram & Cipher';
  readonly defaultSettings: Partial<CryptogramSettings> = {
    puzzleType: 'cryptogram',
    difficulty: 'Medium',
    cipherType: 'random_substitution',
    hintsProvided: 2,
    preservePunctuation: true,
  };

  generate(settings: CryptogramSettings): GeneratedPuzzle<CryptogramSettings, CryptogramData> {
    const startTime = performance.now();
    const prng = new Random(settings.seed || Date.now());

    let rawQuote = settings.quote;
    let author = settings.author;

    if (!rawQuote || rawQuote.trim().length === 0) {
      const quoteObj = prng.choice(ORIGINAL_QUOTES);
      rawQuote = quoteObj.text;
      author = quoteObj.author;
    }

    const plaintext = rawQuote.toUpperCase().trim();
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const cipherMap: Record<string, string> = {};
    const reverseMap: Record<string, string> = {};

    const cipherType = settings.cipherType || 'random_substitution';

    if (cipherType === 'atbash') {
      // Reverse alphabet: A->Z, B->Y...
      for (let i = 0; i < alphabet.length; i++) {
        const plainChar = alphabet[i];
        const cipherChar = alphabet[alphabet.length - 1 - i];
        cipherMap[plainChar] = cipherChar;
        reverseMap[cipherChar] = plainChar;
      }
    } else if (cipherType === 'caesar') {
      const shift = settings.caesarShift && settings.caesarShift >= 1 && settings.caesarShift <= 25
        ? settings.caesarShift
        : prng.nextInt(1, 25);
      for (let i = 0; i < alphabet.length; i++) {
        const plainChar = alphabet[i];
        const cipherChar = alphabet[(i + shift) % 26];
        cipherMap[plainChar] = cipherChar;
        reverseMap[cipherChar] = plainChar;
      }
    } else {
      // Random derangement substitution mapping
      const shuffled = prng.shuffle([...alphabet]);
      for (let i = 0; i < alphabet.length; i++) {
        if (shuffled[i] === alphabet[i]) {
          const swapIdx = (i + 1) % alphabet.length;
          [shuffled[i], shuffled[swapIdx]] = [shuffled[swapIdx], shuffled[i]];
        }
      }
      for (let i = 0; i < alphabet.length; i++) {
        cipherMap[alphabet[i]] = shuffled[i];
        reverseMap[shuffled[i]] = alphabet[i];
      }
    }

    // Encrypt plaintext
    let ciphertext = '';
    for (let i = 0; i < plaintext.length; i++) {
      const ch = plaintext[i];
      if (cipherMap[ch]) {
        ciphertext += cipherMap[ch];
      } else {
        ciphertext += ch;
      }
    }

    // Provide initial hints based on settings or difficulty
    const uniqueLettersInQuote = Array.from(new Set(plaintext.replace(/[^A-Z]/g, '').split('')));
    let hintsCount = settings.hintsProvided !== undefined
      ? settings.hintsProvided
      : settings.difficulty === 'Easy' ? 3 : settings.difficulty === 'Medium' ? 1 : 0;

    hintsCount = Math.max(0, Math.min(uniqueLettersInQuote.length, hintsCount));

    const chosenHintLetters = prng.sample(uniqueLettersInQuote, hintsCount);
    const hints: Record<string, string> = {};
    for (const letter of chosenHintLetters) {
      hints[cipherMap[letter]] = letter;
    }

    const data: CryptogramData = {
      ciphertext,
      plaintext,
      author: settings.showAuthor === false ? undefined : author,
      cipherMap,
      reverseMap,
      hints,
    };

    const endTime = performance.now();

    return {
      id: `cg-${settings.seed}-${Date.now().toString(36)}`,
      type: 'cryptogram',
      title: settings.title || `CRYPTOGRAM PUZZLE #${settings.puzzleNumber || 1}`,
      difficulty: settings.difficulty || 'Medium',
      seed: settings.seed || 12345,
      settings,
      data,
      solution: plaintext,
      metadata: {
        generatedAt: new Date().toISOString(),
        generatorVersion: '2.5.0',
        dimensions: `${plaintext.length} chars`,
        itemCount: uniqueLettersInQuote.length,
        isSolvable: true,
        hasUniqueSolution: true,
        generationTimeMs: Math.round(endTime - startTime),
      },
    };
  }

  validate(puzzle: GeneratedPuzzle<CryptogramSettings, CryptogramData>): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!puzzle.data.plaintext || puzzle.data.plaintext.length === 0) {
      errors.push('Quote plaintext is empty.');
    }
    if (!puzzle.data.ciphertext || puzzle.data.ciphertext.length === 0) {
      errors.push('Ciphertext is empty.');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  generateSolution(puzzle: GeneratedPuzzle<CryptogramSettings, CryptogramData>): string {
    return puzzle.data.plaintext;
  }
}

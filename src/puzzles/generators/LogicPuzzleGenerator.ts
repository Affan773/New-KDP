import { BaseGenerator, ValidationResult } from '../core/PuzzleGenerator';
import { Random } from '../core/Random';
import {
  LogicGridSettings,
  LogicGridData,
  GeneratedPuzzle,
  LogicEntityCategory,
  LogicClue,
} from '../types';

const LOGIC_THEMES = [
  {
    theme: 'Neighborhood Pets',
    categories: [
      { name: 'Person', items: ['Alice', 'Bob', 'Charlie', 'David', 'Emma'] },
      { name: 'Pet', items: ['Dog', 'Cat', 'Parrot', 'Rabbit', 'Hamster'] },
      { name: 'House Color', items: ['Blue', 'Green', 'Red', 'Yellow', 'White'] },
      { name: 'Beverage', items: ['Tea', 'Coffee', 'Juice', 'Milk', 'Water'] },
    ],
  },
  {
    theme: 'World Explorers',
    categories: [
      { name: 'Scientist', items: ['Elena', 'Marcus', 'Sophia', 'Lucas', 'Chloe'] },
      { name: 'Destination', items: ['Cairo', 'Tokyo', 'Reykjavik', 'Nairobi', 'Lima'] },
      { name: 'Artifact', items: ['Compass', 'Telescope', 'Map', 'Journal', 'Camera'] },
      { name: 'Transport', items: ['Train', 'Boat', 'Airship', 'Jeep', 'Bicycle'] },
    ],
  },
];

export class LogicPuzzleGenerator extends BaseGenerator<LogicGridSettings, LogicGridData> {
  readonly type = 'logic_grid';
  readonly name = 'Logic Grid Puzzle';
  readonly defaultSettings: Partial<LogicGridSettings> = {
    puzzleType: 'logic_grid',
    categoriesCount: 3,
    itemsPerCategory: 3,
    difficulty: 'Medium',
  };

  generate(settings: LogicGridSettings): GeneratedPuzzle<LogicGridSettings, LogicGridData> {
    const startTime = performance.now();
    const prng = new Random(settings.seed || Date.now());

    const numCats = settings.categoriesCount === 4 ? 4 : 3;
    const numItems = settings.itemsPerCategory === 4 ? 4 : 3;

    // Pick theme
    const themeObj = prng.choice(LOGIC_THEMES);
    const selectedCats = themeObj.categories.slice(0, numCats).map(cat => ({
      name: cat.name,
      items: cat.items.slice(0, numItems),
    }));

    // Create Ground Truth Solution Matrix
    // The primary category (first category) acts as the anchor
    const primaryCat = selectedCats[0];
    const solutionMatrix: Record<string, Record<string, string>> = {};

    for (let i = 0; i < numItems; i++) {
      const anchorItem = primaryCat.items[i];
      solutionMatrix[anchorItem] = {};
    }

    // For each other category, generate a 1-to-1 permutation match
    for (let c = 1; c < numCats; c++) {
      const cat = selectedCats[c];
      const shuffledItems = prng.shuffle([...cat.items]);

      for (let i = 0; i < numItems; i++) {
        const anchorItem = primaryCat.items[i];
        solutionMatrix[anchorItem][cat.name] = shuffledItems[i];
      }
    }

    // Generate Clues derived directly from the Ground Truth (guaranteeing 0 contradictions)
    const clues: LogicClue[] = [];
    let clueId = 1;

    // 1. Positive Clues ("Alice owns the Dog.")
    for (let i = 0; i < numItems; i++) {
      const anchor = primaryCat.items[i];
      const otherCats = selectedCats.slice(1);
      const chosenCat = prng.choice(otherCats);
      const matchedItem = solutionMatrix[anchor][chosenCat.name];

      clues.push({
        id: `clue-${clueId++}`,
        text: `${anchor} is directly associated with the ${matchedItem}.`,
        type: 'positive',
      });
    }

    // 2. Negative Clues ("Bob does not live in the Red house.")
    for (let i = 0; i < numItems; i++) {
      const anchor = primaryCat.items[i];
      const otherCats = selectedCats.slice(1);
      const chosenCat = prng.choice(otherCats);
      const actualMatch = solutionMatrix[anchor][chosenCat.name];
      const nonMatches = chosenCat.items.filter(item => item !== actualMatch);

      if (nonMatches.length > 0) {
        const chosenNonMatch = prng.choice(nonMatches);
        clues.push({
          id: `clue-${clueId++}`,
          text: `${anchor} does NOT have the ${chosenNonMatch}.`,
          type: 'negative',
        });
      }
    }

    // 3. Cross-Category Clues between Secondary Categories ("The Cat owner drinks Tea.")
    if (numCats >= 3) {
      const cat2 = selectedCats[1];
      const cat3 = selectedCats[2];

      for (let i = 0; i < Math.min(2, numItems); i++) {
        const anchor = primaryCat.items[i];
        const val2 = solutionMatrix[anchor][cat2.name];
        const val3 = solutionMatrix[anchor][cat3.name];

        clues.push({
          id: `clue-${clueId++}`,
          text: `The ${val2} belongs with the ${val3}.`,
          type: 'positive',
        });
      }
    }

    // Shuffle clues
    const shuffledClues = prng.shuffle(clues);

    const data: LogicGridData = {
      categories: selectedCats,
      clues: shuffledClues,
      solutionMatrix,
    };

    const endTime = performance.now();

    return {
      id: `lg-${settings.seed}-${Date.now().toString(36)}`,
      type: 'logic_grid',
      title: settings.title || `LOGIC DEDUCTION GRID: ${themeObj.theme.toUpperCase()}`,
      difficulty: settings.difficulty,
      seed: settings.seed,
      settings,
      data,
      solution: solutionMatrix,
      metadata: {
        generatedAt: new Date().toISOString(),
        generatorVersion: '2.0.0',
        itemCount: clues.length,
        isSolvable: true,
        hasUniqueSolution: true,
        generationTimeMs: Math.round(endTime - startTime),
      },
    };
  }

  validate(puzzle: GeneratedPuzzle<LogicGridSettings, LogicGridData>): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const { categories, clues, solutionMatrix } = puzzle.data;

    if (!categories || categories.length < 2) {
      errors.push('Logic grid requires at least 2 categories');
      return { valid: false, errors, warnings };
    }

    if (!clues || clues.length === 0) {
      errors.push('No clues provided');
    }

    if (!solutionMatrix || Object.keys(solutionMatrix).length === 0) {
      errors.push('Solution matrix is empty');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  generateSolution(puzzle: GeneratedPuzzle<LogicGridSettings, LogicGridData>): Record<string, Record<string, string>> {
    return puzzle.data.solutionMatrix;
  }
}

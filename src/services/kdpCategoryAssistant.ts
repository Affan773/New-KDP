import { KDPCategorySuggestion } from '../types/kdp';
import { Project } from '../types/project';

export class KDPCategoryAssistant {
  // Standard, official Amazon KDP / BISAC categories for books & puzzles
  public static STANDARD_CATEGORIES = [
    {
      id: 'puzzles_word_search',
      name: 'Word Search Puzzles',
      path: 'Books > Humor & Entertainment > Puzzles & Games > Word Search',
      keywords: ['word search', 'word puzzle', 'word find'],
    },
    {
      id: 'puzzles_sudoku',
      name: 'Sudoku & Logic Grids',
      path: 'Books > Humor & Entertainment > Puzzles & Games > Sudoku',
      keywords: ['sudoku', 'kakuro', 'number puzzle'],
    },
    {
      id: 'puzzles_crosswords',
      name: 'Crosswords',
      path: 'Books > Humor & Entertainment > Puzzles & Games > Crosswords',
      keywords: ['crossword', 'clues', 'cryptic'],
    },
    {
      id: 'puzzles_logic_brain',
      name: 'Logic & Brain Teasers',
      path: 'Books > Humor & Entertainment > Puzzles & Games > Logic & Brain Teasers',
      keywords: ['logic', 'brain teaser', 'cryptogram', 'maze', 'nonogram'],
    },
    {
      id: 'activities_adults',
      name: 'Activity Books for Adults',
      path: 'Books > Crafts, Hobbies & Home > Crafts & Hobbies > Activity Books',
      keywords: ['activity', 'relaxation', 'mindfulness', 'mind exercise'],
    },
    {
      id: 'self_help_aging',
      name: 'Cognitive Health & Memory',
      path: 'Books > Health, Fitness & Dieting > Aging > Memory Improvement',
      keywords: ['memory', 'seniors', 'mental fitness', 'cognitive'],
    },
    {
      id: 'juvenile_puzzles',
      name: 'Children\'s Games & Activities',
      path: 'Books > Children\'s Books > Activities, Crafts & Games > Puzzles',
      keywords: ['kids', 'children', 'teens', 'youth'],
    },
  ];

  /**
   * Suggests top 3 matching Amazon KDP categories based on actual book content
   */
  public static suggestCategories(
    project: Project,
    detectedTypes: string[] = ['Word Search', 'Sudoku']
  ): KDPCategorySuggestion[] {
    const audience = (project.metadata?.targetAudience || '').toLowerCase();
    const isKids = audience.includes('kid') || audience.includes('child');
    const isSeniors = audience.includes('senior') || audience.includes('elder');
    const primaryType = (detectedTypes[0] || '').toLowerCase();

    const suggestions: KDPCategorySuggestion[] = [];

    // 1. Primary category matching specific puzzle type
    if (primaryType.includes('word') || primaryType.includes('search')) {
      suggestions.push({
        name: 'Word Search Puzzles',
        path: 'Books > Humor & Entertainment > Puzzles & Games > Word Search',
        reason: 'Matches detected Word Search puzzle contents in manuscript.',
        confidence: 96,
        isKdpStandard: true,
      });
    } else if (primaryType.includes('sudoku') || primaryType.includes('number')) {
      suggestions.push({
        name: 'Sudoku & Logic Grids',
        path: 'Books > Humor & Entertainment > Puzzles & Games > Sudoku',
        reason: 'Matches detected Sudoku / grid puzzle elements in manuscript.',
        confidence: 96,
        isKdpStandard: true,
      });
    } else if (primaryType.includes('crossword')) {
      suggestions.push({
        name: 'Crosswords',
        path: 'Books > Humor & Entertainment > Puzzles & Games > Crosswords',
        reason: 'Matches detected Crossword puzzle contents.',
        confidence: 96,
        isKdpStandard: true,
      });
    } else {
      suggestions.push({
        name: 'Logic & Brain Teasers',
        path: 'Books > Humor & Entertainment > Puzzles & Games > Logic & Brain Teasers',
        reason: 'Standard KDP classification for multi-puzzle and brain teaser collections.',
        confidence: 92,
        isKdpStandard: true,
      });
    }

    // 2. Secondary General Activity / Logic category
    suggestions.push({
      name: 'Logic & Brain Teasers',
      path: 'Books > Humor & Entertainment > Puzzles & Games > Logic & Brain Teasers',
      reason: 'Enhances discoverability across general logic puzzle shoppers.',
      confidence: 88,
      isKdpStandard: true,
    });

    // 3. Audience or lifestyle category
    if (isKids) {
      suggestions.push({
        name: 'Children\'s Games & Activities',
        path: 'Books > Children\'s Books > Activities, Crafts & Games > Puzzles',
        reason: 'Targeted to youth & student puzzle enthusiasts.',
        confidence: 90,
        isKdpStandard: true,
      });
    } else if (isSeniors) {
      suggestions.push({
        name: 'Cognitive Health & Memory',
        path: 'Books > Health, Fitness & Dieting > Aging > Memory Improvement',
        reason: 'Aligned with mental agility, relaxation, and senior brain exercise.',
        confidence: 85,
        isKdpStandard: true,
      });
    } else {
      suggestions.push({
        name: 'Activity Books for Adults',
        path: 'Books > Crafts, Hobbies & Home > Crafts & Hobbies > Activity Books',
        reason: 'Standard lifestyle & hobby category for screen-free recreation.',
        confidence: 84,
        isKdpStandard: true,
      });
    }

    return suggestions;
  }
}

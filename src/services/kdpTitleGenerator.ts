import { KDPTitleSuggestion } from '../types/kdp';
import { Project } from '../types/project';

export class KDPTitleGenerator {
  // Prohibited trademarked brand names or misleading claim terms
  private static PROHIBITED_WORDS = [
    'rubik',
    'rubik\'s',
    'scrabble',
    'new york times',
    'nyt',
    'monopoly',
    'guaranteed cure',
    'cures alzheimer',
    'cures dementia',
    'cures memory loss',
    'official amazon',
    'kdp exclusive',
    '#1 best seller',
    'bestseller',
  ];

  /**
   * Generates 5 curated, compliant titles based on actual project content
   */
  public static generateTitles(
    project: Project,
    detectedPuzzleCount: number = 80,
    detectedTypes: string[] = ['Word Search', 'Sudoku', 'Crossword'],
    existingProjects: Project[] = []
  ): KDPTitleSuggestion[] {
    const anyMeta = (project.metadata || {}) as any;
    const theme = anyMeta.theme || 'General Brain Teasers';
    const audience = project.metadata?.targetAudience || 'Adults & Seniors';
    const primaryType = detectedTypes[0] || 'Brain Puzzle';
    const count = detectedPuzzleCount > 0 ? detectedPuzzleCount : project.pageCount || 80;

    const existingTitles = existingProjects
      .map(p => (p.name || p.kdpConfig?.title || '').trim().toLowerCase())
      .filter(Boolean);

    const candidates: KDPTitleSuggestion[] = [
      {
        title: `The Ultimate ${primaryType} Collection for ${audience}`,
        subtitle: `${count} Engaging & Calibrated Puzzles with Complete Solutions`,
        reason: 'Direct and highly descriptive title prioritizing reader clarity and search relevance.',
        score: 95,
        style: 'Direct & Descriptive',
      },
      {
        title: `Mind Mastery ${theme} Puzzle Challenge`,
        subtitle: `${count} Thoughtfully Crafted ${primaryType} Puzzles for Focus and Relaxation`,
        reason: 'Engaging and benefit-focused title emphasizing mindfulness and mental agility.',
        score: 92,
        style: 'Punchy & Engaging',
      },
      {
        title: `Large Print ${primaryType} Bonanza: ${theme} Edition`,
        subtitle: `${count} Easy-to-Read Grids with Full Page Solutions in Back Matter`,
        reason: 'Format and theme-focused title appealing directly to accessibility and readability needs.',
        score: 90,
        style: 'Theme Focused',
      },
      {
        title: `Brain Agility Workout: Progressive ${primaryType} Series`,
        subtitle: `From Easy Warm-ups to Expert Challenges — ${count} Handcrafted Puzzles`,
        reason: 'Difficulty-tiered title targeting puzzle enthusiasts seeking skill progression.',
        score: 88,
        style: 'Difficulty Focused',
      },
      {
        title: `${count} ${primaryType} Adventures for ${audience}`,
        subtitle: `Hours of Relaxing Entertainment with Clear Rules and Answer Keys`,
        reason: 'Volume-focused title highlighting substantial content value without keyword stuffing.',
        score: 87,
        style: 'Volume / Count Focused',
      },
    ];

    // Filter out duplicates if any match existing project titles
    return candidates.filter(c => !existingTitles.includes(c.title.toLowerCase()));
  }

  /**
   * Validates a title according to Amazon KDP rules
   */
  public static validateTitle(
    title: string,
    existingTitles: string[] = []
  ): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const cleanTitle = (title || '').trim();

    if (!cleanTitle) {
      errors.push('Title cannot be empty.');
      return { isValid: false, errors, warnings };
    }

    if (cleanTitle.length > 200) {
      errors.push('Title exceeds Amazon KDP 200-character maximum limit.');
    }

    if (cleanTitle.length < 3) {
      errors.push('Title is too short (minimum 3 characters).');
    }

    // Check for excessive ALL CAPS
    const letters = cleanTitle.replace(/[^a-zA-Z]/g, '');
    if (letters.length > 8 && letters === letters.toUpperCase()) {
      warnings.push('Title is in ALL CAPS. Amazon KDP recommends standard title casing.');
    }

    // Check prohibited words / trademarks
    const lowerTitle = cleanTitle.toLowerCase();
    for (const term of this.PROHIBITED_WORDS) {
      if (lowerTitle.includes(term)) {
        errors.push(`Title contains restricted or trademarked phrasing ("${term}").`);
      }
    }

    // Check for obvious keyword stuffing (e.g. repeated commas or excessive stacked genre keywords)
    const genreKeywords = ['word search', 'sudoku', 'crossword', 'maze', 'cryptogram', 'coloring', 'puzzle book'];
    const matches = genreKeywords.filter(k => lowerTitle.includes(k));
    if (matches.length >= 4) {
      warnings.push('Title appears to contain stacked keywords. KDP may reject repetitive keyword-stuffed titles.');
    }

    // Check duplicates
    if (existingTitles.some(t => t.toLowerCase() === lowerTitle)) {
      warnings.push('A project with this exact title already exists in your Studio library.');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}

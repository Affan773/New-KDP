import { KDPSubtitleSuggestion } from '../types/kdp';
import { Project } from '../types/project';

export class KDPSubtitleGenerator {
  /**
   * Generates tailored subtitle suggestions based on actual book attributes
   */
  public static generateSubtitles(
    project: Project,
    detectedPuzzleCount: number = 80,
    detectedTypes: string[] = ['Word Search', 'Sudoku', 'Crossword']
  ): KDPSubtitleSuggestion[] {
    const audience = project.metadata?.targetAudience || 'Adults & Seniors';
    const anyMeta = (project.metadata || {}) as any;
    const difficulty = anyMeta.difficulty || 'Mixed (Easy to Hard)';
    const theme = anyMeta.theme || 'General Brain Teasers';
    const primaryType = detectedTypes[0] || 'Brain Puzzle';
    const count = detectedPuzzleCount > 0 ? detectedPuzzleCount : project.pageCount || 80;

    return [
      {
        subtitle: `${count} Fun & Stimulating ${primaryType} Puzzles for ${audience} — Complete Solutions Included`,
        reason: 'Highlights total volume, target reader, and solution inclusion clearly.',
        focus: 'Comprehensive Overview',
      },
      {
        subtitle: `${count} Handcrafted Puzzles Featuring ${theme} Themes and Calibrated ${difficulty} Levels`,
        reason: 'Focuses on theme immersion and skill progression across the book.',
        focus: 'Theme & Difficulty',
      },
      {
        subtitle: `Large Print Edition: ${count} Relaxing & Mind-Strengthening Puzzles with Clear Layouts`,
        reason: 'Highlights reader comfort, accessibility, and visual ergonomics.',
        focus: 'Large Print & Accessibility',
      },
      {
        subtitle: `Daily Mental Fitness Workout: ${count} Puzzles to Boost Focus, Memory, and Logic`,
        reason: 'Emphasizes daily engagement and active cognitive recreation without medical claims.',
        focus: 'Brain Workout & Habits',
      },
      {
        subtitle: `The Ultimate Brain Booster for ${audience}: ${count} Challenges with Step-by-Step Answer Keys`,
        reason: 'Direct benefit-driven phrasing suitable for gift buyers and leisure puzzle fans.',
        focus: 'Gift & Leisure',
      },
    ];
  }

  /**
   * Validates subtitle string according to KDP constraints
   */
  public static validateSubtitle(subtitle: string): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const clean = (subtitle || '').trim();

    if (clean.length > 200) {
      errors.push('Subtitle exceeds Amazon KDP 200-character maximum limit.');
    }

    if (clean.toLowerCase().includes('guaranteed') || clean.toLowerCase().includes('dementia') || clean.toLowerCase().includes('alzheimer')) {
      errors.push('Subtitle contains prohibited medical/guarantee claims.');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}

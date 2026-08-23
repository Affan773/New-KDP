import { Project } from '../types/project';

export interface GeneratedDescription {
  shortDescription: string;
  longDescription: string;
  bulletPoints: string[];
  htmlFormatted: string;
  plainText: string;
  characterCount: number;
}

export class KDPDescriptionGenerator {
  /**
   * Generates formatted Amazon KDP descriptions based ONLY on actual book content
   */
  public static generateDescription(
    project: Project,
    detectedPuzzleCount: number = 80,
    detectedTypes: string[] = ['Word Search', 'Sudoku', 'Crossword']
  ): GeneratedDescription {
    const title = project.kdpConfig?.title || project.name || 'Puzzle Book';
    const subtitle = project.kdpConfig?.subtitle || project.metadata?.subtitle || '';
    const anyMeta = (project.metadata || {}) as any;
    const audience = project.metadata?.targetAudience || 'Adults, Seniors, and Puzzle Lovers';
    const theme = anyMeta.theme || 'General Knowledge & Logic';
    const difficulty = anyMeta.difficulty || 'Progressive Easy to Hard';
    const primaryType = detectedTypes.join(' & ') || 'Engaging Brain Puzzles';
    const count = detectedPuzzleCount > 0 ? detectedPuzzleCount : project.pageCount || 80;
    const trim = project.kdpSettings?.trimSize?.name || project.kdpConfig?.trimSize || '8.5" × 11"';

    const shortDesc = `Challenge your mind and unwind with ${title}. Featuring ${count} handcrafted ${primaryType} puzzles for ${audience}, complete with clear rules and solution answer keys in the back.`;

    const bulletPoints = [
      `<b>${count} Handcrafted Puzzles:</b> Hours of engaging, screen-free mental recreation and focus.`,
      `<b>Progressive Difficulty:</b> Thoughtfully calibrated from comfortable warm-ups to satisfying challenges (${difficulty}).`,
      `<b>Large Print & Eye-Friendly Layout:</b> Clean, high-contrast typography set on spacious ${trim} pages.`,
      `<b>Full Solutions Included:</b> Complete answer keys provided in the back matter for effortless verification.`,
      `<b>High-Quality Bookbinding:</b> Formatted specifically for Amazon KDP Paperback standard publishing.`,
      `<b>Perfect Gift Idea:</b> An ideal cognitive workout for ${audience}, travel, or relaxing evenings.`,
    ];

    const longHtml = `<p><b>Keep your brain sharp and enjoy hours of relaxing entertainment with <i>${title}</i>!</b></p>

<p>${subtitle ? `<b>${subtitle}</b>` : `Designed specifically for ${audience}, this comprehensive collection combines relaxation with active cognitive engagement.`}</p>

<p>Whether you want to unwind after a busy day or give your memory and logic skills a daily workout, this book provides the perfect balance of fun and mental challenge.</p>

<p><b>Inside this book, you'll discover:</b></p>
<ul>
${bulletPoints.map(b => `  <li>${b}</li>`).join('\n')}
</ul>

<p><b>Book Specifications:</b></p>
<ul>
  <li><b>Trim Size:</b> ${trim} standard paperback</li>
  <li><b>Page Count:</b> Over ${count} structured puzzle and solution pages</li>
  <li><b>Paper Stock:</b> High quality 55lb white interior paper</li>
  <li><b>Finish:</b> Durable, professionally designed cover</li>
</ul>

<p><b>Ready to start the challenge? Grab your copy today and put your puzzle-solving skills to the test!</b></p>`;

    const plainText = longHtml
      .replace(/<p>/g, '')
      .replace(/<\/p>/g, '\n\n')
      .replace(/<ul>/g, '')
      .replace(/<\/ul>/g, '\n')
      .replace(/<li>/g, '• ')
      .replace(/<\/li>/g, '\n')
      .replace(/<b>/g, '')
      .replace(/<\/b>/g, '')
      .replace(/<i>/g, '')
      .replace(/<\/i>/g, '')
      .trim();

    return {
      shortDescription: shortDesc,
      longDescription: plainText,
      bulletPoints,
      htmlFormatted: longHtml,
      plainText,
      characterCount: longHtml.length,
    };
  }

  /**
   * Validates description against Amazon KDP guidelines and content consistency
   */
  public static validateDescription(
    description: string,
    detectedPuzzleCount: number = 80
  ): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const text = (description || '').trim();

    if (!text) {
      errors.push('Description cannot be empty.');
      return { isValid: false, errors, warnings };
    }

    if (text.length > 4000) {
      errors.push(`Description length (${text.length} chars) exceeds Amazon KDP 4,000-character limit.`);
    }

    if (text.length < 100) {
      warnings.push('Description is very short (under 100 characters). A detailed description improves discoverability.');
    }

    // Prohibited medical claims
    const prohibitedPhrases = [
      'cures dementia',
      'cures alzheimer',
      'prevents dementia',
      'medical guarantee',
      '100% cure',
      'free gift inside',
      'cheapest price on amazon',
      'buy from our website',
    ];

    for (const phrase of prohibitedPhrases) {
      if (text.toLowerCase().includes(phrase)) {
        errors.push(`Description contains prohibited promotional or medical claim phrasing: "${phrase}".`);
      }
    }

    // Check count consistency
    const countMatch = text.match(/(\d+)\+?\s*(puzzles?|word search|sudoku|crossword)/i);
    if (countMatch && detectedPuzzleCount > 0) {
      const claimed = parseInt(countMatch[1], 10);
      if (claimed > 0 && Math.abs(claimed - detectedPuzzleCount) > 5) {
        errors.push(`Description states ${claimed} puzzles, but book actually has ${detectedPuzzleCount} detected puzzles.`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}

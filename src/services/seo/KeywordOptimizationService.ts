import { KdpSeoKeyword, KdpSevenBoxesOptimization } from '../../types/seo';
import { Project } from '../../types/project';

export class KeywordOptimizationService {
  /**
   * Optimizes 7 KDP Keyword Boxes according to Amazon's exact guidelines:
   * - 50 character limit per box
   * - Eliminate repetitive words across all boxes to expand search index reach
   * - Prioritize highest scoring, safe, content-matched keywords
   */
  public static optimizeSevenBoxes(
    keywords: KdpSeoKeyword[],
    project?: Project | null
  ): KdpSevenBoxesOptimization {
    const valid = keywords
      .filter(k => !k.isExcluded && k.risk !== 'POLICY_VIOLATION' && k.risk !== 'COMPETITOR_BRAND' && k.risk !== 'TRADEMARK_RISK')
      .sort((a, b) => (b.studioSeoScore * 0.6 + b.bookMatchScore * 0.4) - (a.studioSeoScore * 0.6 + a.bookMatchScore * 0.4));

    const boxes: KdpSevenBoxesOptimization['boxes'] = [];
    const usedWords = new Set<string>();

    for (let slot = 1; slot <= 7; slot++) {
      let currentPhrase = '';
      const keywordsInSlot: string[] = [];
      const warnings: string[] = [];

      for (const item of valid) {
        const itemWords = item.keyword.toLowerCase().split(/\s+/);
        // Check if item contains novel words
        const novelWords = itemWords.filter(w => !usedWords.has(w) && w.length > 2);

        if (novelWords.length === 0 && currentPhrase.length > 0) {
          continue;
        }

        const candidatePhrase = currentPhrase
          ? `${currentPhrase} ${novelWords.join(' ')}`.trim()
          : item.keyword.trim();

        if (candidatePhrase.length <= 50) {
          currentPhrase = candidatePhrase;
          keywordsInSlot.push(item.keyword);
          for (const w of novelWords) {
            usedWords.add(w);
          }
        }

        if (currentPhrase.length >= 40) {
          break;
        }
      }

      // If slot is still empty or too short, fill with remaining best candidates
      if (!currentPhrase && valid[slot - 1]) {
        currentPhrase = valid[slot - 1].keyword.slice(0, 50);
        keywordsInSlot.push(valid[slot - 1].keyword);
      }

      if (currentPhrase.length > 50) {
        warnings.push('Exceeds Amazon 50-character limit');
      }

      boxes.push({
        slotNumber: slot,
        phrase: currentPhrase,
        charCount: currentPhrase.length,
        charLimit: 50,
        keywordsIncluded: keywordsInSlot,
        relevanceScore: currentPhrase ? 90 : 0,
        warnings,
        isCompliant: currentPhrase.length <= 50,
      });
    }

    return this.evaluateBoxesCollection(boxes);
  }

  /**
   * Evaluates manual edits to boxes and recalculates overall keyword set score
   */
  public static evaluateBoxesCollection(
    boxes: KdpSevenBoxesOptimization['boxes']
  ): KdpSevenBoxesOptimization {
    let totalChars = 0;
    const allWords: string[] = [];
    const uniqueWords = new Set<string>();
    let duplicateCount = 0;

    for (const b of boxes) {
      totalChars += b.phrase.length;
      const words = b.phrase.toLowerCase().split(/\s+/).filter(w => w.length > 1);
      for (const w of words) {
        allWords.push(w);
        if (uniqueWords.has(w)) {
          duplicateCount++;
        } else {
          uniqueWords.add(w);
        }
      }

      // Update compliance and warnings for this box
      b.charCount = b.phrase.length;
      b.warnings = [];
      if (b.phrase.length > 50) {
        b.warnings.push(`Exceeds 50 characters (${b.phrase.length}/50)`);
        b.isCompliant = false;
      } else {
        b.isCompliant = true;
      }
    }

    // Overall coverage score (0-100)
    // 350 characters possible (7 x 50). Ideal is ~280-340 chars used with high unique word ratio.
    const charEfficiency = Math.min(100, Math.round((totalChars / 320) * 100));
    const uniquenessEfficiency = allWords.length > 0
      ? Math.max(20, Math.round(((allWords.length - duplicateCount) / allWords.length) * 100))
      : 0;

    const overallCoverage = Math.round(charEfficiency * 0.5 + uniquenessEfficiency * 0.5);

    // Overall Keyword Set Score (0-100)
    let setScore = Math.round(overallCoverage * 0.7 + (uniqueWords.size > 15 ? 30 : uniqueWords.size * 2));
    if (boxes.some(b => !b.isCompliant)) {
      setScore = Math.max(30, setScore - 20);
    }
    setScore = Math.min(100, Math.max(10, setScore));

    const recommendations: string[] = [];
    if (duplicateCount > 0) {
      recommendations.push(`Detected ${duplicateCount} duplicate words across boxes. Removing repetition frees up slots for new search terms.`);
    }
    if (totalChars < 200) {
      recommendations.push('You have available character capacity in your 7 boxes. Consider adding more long-tail keywords.');
    }
    if (boxes.some(b => b.charCount > 50)) {
      recommendations.push('One or more keyword boxes exceed Amazon\'s 50-character limit and may get truncated.');
    }

    return {
      boxes,
      totalCharactersUsed: totalChars,
      totalUniqueWords: uniqueWords.size,
      duplicateWordCount: duplicateCount,
      overallCoverageScore: overallCoverage,
      overallKeywordSetScore: setScore,
      recommendations,
    };
  }

  /**
   * Generates formatted text export for 7 KDP Keywords
   */
  public static generateExportText(boxes: KdpSevenBoxesOptimization['boxes']): string {
    const lines: string[] = [
      '==================================================',
      'AMAZON KDP 7 KEYWORD BOXES EXPORT',
      `Generated: ${new Date().toLocaleString()}`,
      'Amazon Limits: Max 50 characters per box',
      '==================================================\n',
    ];

    boxes.forEach((box, i) => {
      lines.push(`Keyword Box ${box.slotNumber} (${box.charCount}/50 chars):`);
      lines.push(`${box.phrase || '[EMPTY]'}\n`);
    });

    lines.push('==================================================');
    lines.push('TIPS FOR KDP DASHBOARD:');
    lines.push('- Copy each line into its corresponding box in KDP Book Setup.');
    lines.push('- Avoid punctuation or quotation marks unless necessary.');
    lines.push('- Do not repeat words already present in your Title or Subtitle.');
    lines.push('==================================================');

    return lines.join('\n');
  }
}

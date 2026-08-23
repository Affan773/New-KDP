import { KDPKeywordItem } from '../types/kdp';
import { Project } from '../types/project';

export class KDPKeywordGenerator {
  private static COMPETITOR_KEYWORDS = [
    'rubik',
    'scrabble',
    'crossword dictionary',
    'new york times',
    'nyt',
    'bestseller',
    'best seller',
    'free kindle',
    'cheap book',
    'kindle unlimited free',
  ];

  /**
   * Generates 7+ high-relevance, policy-compliant KDP backend keywords
   */
  public static generateKeywords(
    project: Project,
    detectedPuzzleCount: number = 80,
    detectedTypes: string[] = ['Word Search', 'Sudoku', 'Crossword']
  ): string[] {
    const audience = project.metadata?.targetAudience || 'Adults';
    const theme = (project.metadata as any)?.theme || 'General';
    const primaryType = detectedTypes[0] || 'Brain Puzzle';

    const suggestions: string[] = [
      `${primaryType.toLowerCase()} books for ${audience.toLowerCase()}`.slice(0, 50),
      `large print ${primaryType.toLowerCase()} with answers`.slice(0, 50),
      `brain games mental fitness ${audience.toLowerCase()}`.slice(0, 50),
      `relaxing mind puzzles for stress relief`.slice(0, 50),
      `${theme.toLowerCase()} activity book for relaxation`.slice(0, 50),
      `easy to hard logic challenge collection`.slice(0, 50),
      `daily memory workout and cognitive games`.slice(0, 50),
    ];

    return suggestions;
  }

  /**
   * Evaluates each keyword slot against Amazon KDP policies
   */
  public static evaluateKeyword(keyword: string, allKeywords: string[] = []): KDPKeywordItem {
    const clean = (keyword || '').trim();
    const charCount = clean.length;

    if (!clean) {
      return {
        text: '',
        quality: 'INVALID',
        charCount: 0,
        reason: 'Empty keyword slot',
      };
    }

    if (charCount > 50) {
      return {
        text: clean,
        quality: 'INVALID',
        charCount,
        reason: `Exceeds 50-character limit (${charCount}/50)`,
      };
    }

    const lower = clean.toLowerCase();

    // Check competitor trademarked phrases
    const hasCompetitor = this.COMPETITOR_KEYWORDS.some(k => lower.includes(k));
    if (hasCompetitor) {
      return {
        text: clean,
        quality: 'INVALID',
        charCount,
        isCompetitorRisk: true,
        reason: 'Contains trademarked brand or competitor term',
      };
    }

    // Check duplicates in list
    const count = allKeywords.filter(k => k.trim().toLowerCase() === lower).length;
    if (count > 1) {
      return {
        text: clean,
        quality: 'REVIEW',
        charCount,
        reason: 'Duplicate keyword phrase',
      };
    }

    // Single generic word warning
    if (!clean.includes(' ') && clean.length < 5) {
      return {
        text: clean,
        quality: 'REVIEW',
        charCount,
        reason: 'Short single word — multi-word long-tail phrases perform better',
      };
    }

    return {
      text: clean,
      quality: 'GOOD',
      charCount,
    };
  }

  /**
   * Evaluates complete keyword set (up to 7 slots)
   */
  public static evaluateAllKeywords(keywords: string[]): {
    items: KDPKeywordItem[];
    overallQuality: 'GOOD' | 'REVIEW' | 'INVALID';
    validCount: number;
    warnings: string[];
  } {
    const warnings: string[] = [];
    const items = (keywords || []).slice(0, 7).map(k => this.evaluateKeyword(k, keywords));

    const invalidCount = items.filter(i => i.quality === 'INVALID' && i.text.length > 0).length;
    const reviewCount = items.filter(i => i.quality === 'REVIEW').length;
    const validCount = items.filter(i => i.quality === 'GOOD').length;

    let overallQuality: 'GOOD' | 'REVIEW' | 'INVALID' = 'GOOD';
    if (invalidCount > 0) {
      overallQuality = 'INVALID';
      warnings.push(`${invalidCount} keyword(s) violate Amazon KDP keyword policies.`);
    } else if (reviewCount > 0 || validCount < 4) {
      overallQuality = 'REVIEW';
      if (validCount < 4) {
        warnings.push(`Only ${validCount}/7 keyword slots filled. Adding more improves search visibility.`);
      }
    }

    return {
      items,
      overallQuality,
      validCount,
      warnings,
    };
  }
}

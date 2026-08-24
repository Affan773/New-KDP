import {
  KdpCompetitionSignal,
  KdpDemandSignal,
  KdpKeywordRisk,
  KdpSearchIntent,
  KdpSeoKeyword,
} from '../types/seo';
import { Project } from '../types/project';

export class KDPKeywordScoreEngine {
  /**
   * Calculates internal Studio SEO Score (0-100) using a multi-factor formula.
   * Clearly labeled as internal calculated metric, never claiming official Amazon data.
   */
  public static calculateKeywordScore(params: {
    keyword: string;
    relevance: number; // 0-100
    demandSignal: KdpDemandSignal;
    competitionSignal: KdpCompetitionSignal;
    commercialIntent: KdpSearchIntent;
    isLongTail: boolean;
    bookContentMatch: boolean;
    risk: KdpKeywordRisk;
  }): { score: number; grade: 'Excellent' | 'Strong' | 'Moderate' | 'Weak' | 'Poor' } {
    if (params.risk === 'POLICY_VIOLATION' || params.risk === 'COMPETITOR_BRAND' || params.risk === 'TRADEMARK_RISK') {
      return { score: 15, grade: 'Poor' };
    }

    // 1. Relevance component (25%)
    const relevanceWeight = (Math.max(0, Math.min(100, params.relevance)) / 100) * 25;

    // 2. Search Demand Signal component (20%)
    let demandScore = 70;
    if (params.demandSignal === 'High') demandScore = 95;
    else if (params.demandSignal === 'Moderate') demandScore = 75;
    else if (params.demandSignal === 'Niche') demandScore = 60;
    const demandWeight = (demandScore / 100) * 20;

    // 3. Competition Signal component (15%) - Low competition is favorable
    let compScore = 65;
    if (params.competitionSignal === 'Low') compScore = 95;
    else if (params.competitionSignal === 'Moderate') compScore = 70;
    else if (params.competitionSignal === 'High') compScore = 45;
    const compWeight = (compScore / 100) * 15;

    // 4. Commercial Intent component (15%)
    let intentScore = 70;
    switch (params.commercialIntent) {
      case 'Transactional':
        intentScore = 98;
        break;
      case 'Commercial':
        intentScore = 90;
        break;
      case 'Gift-oriented':
        intentScore = 85;
        break;
      case 'Niche-specific':
        intentScore = 80;
        break;
      case 'Informational':
        intentScore = 50;
        break;
    }
    const intentWeight = (intentScore / 100) * 15;

    // 5. Specificity & Long-tail quality (15%)
    const wordCount = params.keyword.trim().split(/\s+/).filter(Boolean).length;
    let specificityScore = 60;
    if (wordCount >= 3 && wordCount <= 5) specificityScore = 95;
    else if (wordCount === 2 || wordCount === 6) specificityScore = 80;
    else if (wordCount === 1) specificityScore = 40;
    else specificityScore = 55;
    const specificityWeight = (specificityScore / 100) * 15;

    // 6. Book Content Match component (10%)
    const matchWeight = (params.bookContentMatch ? 95 : 50) * 0.10;

    const rawScore = Math.round(
      relevanceWeight +
      demandWeight +
      compWeight +
      intentWeight +
      specificityWeight +
      matchWeight
    );

    const finalScore = Math.max(0, Math.min(100, rawScore));

    let grade: 'Excellent' | 'Strong' | 'Moderate' | 'Weak' | 'Poor' = 'Moderate';
    if (finalScore >= 90) grade = 'Excellent';
    else if (finalScore >= 75) grade = 'Strong';
    else if (finalScore >= 60) grade = 'Moderate';
    else if (finalScore >= 40) grade = 'Weak';
    else grade = 'Poor';

    return { score: finalScore, grade };
  }

  /**
   * Helper to detect keyword risks against Amazon KDP policy
   */
  public static detectKeywordRisk(keyword: string, project?: Project): {
    risk: KdpKeywordRisk;
    reason?: string;
  } {
    const text = (keyword || '').toLowerCase().trim();
    if (!text) return { risk: 'NONE' };

    // Trademarked brands & competitor titles
    const trademarkList = [
      'rubik',
      'rubiks',
      'scrabble',
      'nyt',
      'new york times',
      'crossword dictionary',
      'merriam-webster',
      'simon & schuster',
      'highlights',
      'sudoku master',
    ];
    for (const tm of trademarkList) {
      if (text.includes(tm)) {
        return {
          risk: 'COMPETITOR_BRAND',
          reason: `Contains trademark or competitor reference ("${tm}") which violates Amazon KDP metadata guidelines.`,
        };
      }
    }

    // Prohibited promotional claims on Amazon KDP
    const prohibitedClaims = [
      'best seller',
      'bestseller',
      '#1 best seller',
      'free kindle',
      'cheap book',
      'free download',
      'top rated',
      'discount',
      'promo',
      'kindle unlimited free',
    ];
    for (const claim of prohibitedClaims) {
      if (text.includes(claim)) {
        return {
          risk: 'UNSUPPORTED_CLAIM',
          reason: `Contains subjective or promotional claim ("${claim}") prohibited by Amazon KDP.`,
        };
      }
    }

    // Keyword stuffing indicators (excessive comma repetition, over 50 chars)
    if (text.length > 50) {
      return {
        risk: 'KEYWORD_STUFFING',
        reason: `Exceeds Amazon KDP 50-character limit for a single backend field (${text.length}/50).`,
      };
    }

    // Format mismatch check if project provided
    if (project) {
      const format = ((project.kdpSettings as any)?.format || 'Paperback').toLowerCase();
      if (format.includes('paperback') && text.includes('hardcover only')) {
        return {
          risk: 'WRONG_FORMAT',
          reason: 'Refers to hardcover format while book project is set to Paperback.',
        };
      }
    }

    return { risk: 'NONE' };
  }
}

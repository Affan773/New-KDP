import {
  KdpNicheOpportunityScore,
  KdpNicheScoreComponents,
  NicheScoreGrade,
  DataSourceType,
} from '../types/niche';
import { KdpDemandSignal, KdpCompetitionSignal, KdpTrendSignal } from '../types/seo';

export interface NicheScoreInput {
  niche: string;
  bookType: string;
  puzzleType?: string;
  targetAudience: string;
  marketplace?: string;
  competitorsCount?: number;
  hasDistinctFormatGap?: boolean;
  hasAudienceGap?: boolean;
  hasThemeGap?: boolean;
  keywordCount?: number;
}

export class KDPNicheScoreEngine {
  /**
   * Weights for the 8 core components of the Studio Niche Opportunity Score
   */
  private static readonly WEIGHTS = {
    demandSignal: 0.18,          // 18%
    competitionSignal: 0.16,     // 16%
    relevance: 0.14,             // 14%
    audienceSpecificity: 0.12,   // 12%
    commercialIntent: 0.12,      // 12%
    keywordOpportunity: 0.12,    // 12%
    contentDifferentiation: 0.10,// 10%
    trendSignal: 0.06,           // 6%
  };

  /**
   * Calculates internal Studio Niche Opportunity Score
   * NOTE: This is strictly an internal Studio algorithmic estimate based on
   * content signals, competitor density, and keyword breadth.
   * NEVER labelled as Amazon official score.
   */
  public static calculateNicheScore(input: NicheScoreInput): KdpNicheOpportunityScore {
    const components = this.deriveComponents(input);

    const demandVal = this.demandToNumeric(components.demandSignal);
    const compVal = this.competitionToNumeric(components.competitionSignal);
    const trendVal = this.trendToNumeric(components.trendSignal);

    const rawScore =
      demandVal * this.WEIGHTS.demandSignal +
      compVal * this.WEIGHTS.competitionSignal +
      components.relevance * this.WEIGHTS.relevance +
      components.audienceSpecificity * this.WEIGHTS.audienceSpecificity +
      components.commercialIntent * this.WEIGHTS.commercialIntent +
      components.keywordOpportunity * this.WEIGHTS.keywordOpportunity +
      components.contentDifferentiation * this.WEIGHTS.contentDifferentiation +
      trendVal * this.WEIGHTS.trendSignal;

    const overallScore = Math.max(0, Math.min(100, Math.round(rawScore)));
    const grade = this.scoreToGrade(overallScore);
    const explanation = this.generateScoreExplanation(overallScore, grade, components, input);

    return {
      overallScore,
      grade,
      label: grade,
      explanation,
      components,
      isEstimate: true,
      dataSource: 'Calculated',
    };
  }

  public static scoreToGrade(score: number): NicheScoreGrade {
    if (score >= 90) return 'Excellent Opportunity';
    if (score >= 75) return 'Strong Opportunity';
    if (score >= 60) return 'Moderate';
    if (score >= 40) return 'Weak';
    return 'Poor';
  }

  private static demandToNumeric(signal: KdpDemandSignal): number {
    switch (signal) {
      case 'High': return 92;
      case 'Moderate': return 76;
      case 'Niche': return 65;
      case 'Estimated': default: return 60;
    }
  }

  private static competitionToNumeric(signal: KdpCompetitionSignal): number {
    switch (signal) {
      case 'Low': return 92;      // Low competition is great for opportunity
      case 'Moderate': return 74; // Balanced
      case 'High': return 45;     // High competition makes ranking harder
      case 'Estimated': default: return 60;
    }
  }

  private static trendToNumeric(signal: KdpTrendSignal): number {
    switch (signal) {
      case 'Rising': return 95;
      case 'Evergreen': return 88;
      case 'Stable': return 75;
      case 'Seasonal': return 65;
      default: return 70;
    }
  }

  private static deriveComponents(input: NicheScoreInput): KdpNicheScoreComponents {
    const nicheLower = (input.niche || '').toLowerCase().trim();
    const audienceLower = (input.targetAudience || '').toLowerCase().trim();
    const bookTypeLower = (input.bookType || '').toLowerCase().trim();

    // 1. Demand signal heuristic
    let demandSignal: KdpDemandSignal = 'Moderate';
    if (
      nicheLower.includes('word search') ||
      nicheLower.includes('sudoku') ||
      nicheLower.includes('coloring') ||
      nicheLower.includes('crossword') ||
      nicheLower.includes('seniors') ||
      nicheLower.includes('adults') ||
      nicheLower.includes('cars') ||
      nicheLower.includes('animals') ||
      nicheLower.includes('plants') ||
      nicheLower.includes('bible') ||
      nicheLower.includes('mindfulness')
    ) {
      demandSignal = 'High';
    } else if (nicheLower.split(' ').length >= 3) {
      demandSignal = 'Niche';
    }

    // 2. Competition signal heuristic
    let competitionSignal: KdpCompetitionSignal = 'Moderate';
    if (input.competitorsCount !== undefined) {
      if (input.competitorsCount <= 3) competitionSignal = 'Low';
      else if (input.competitorsCount <= 7) competitionSignal = 'Moderate';
      else competitionSignal = 'High';
    } else if (nicheLower.includes('easy sudoku') || nicheLower.includes('kids coloring')) {
      competitionSignal = 'High';
    } else if (nicheLower.split(' ').length >= 3) {
      competitionSignal = 'Low';
    }

    // 3. Relevance (0-100)
    let relevance = 85;
    if (nicheLower.length > 3) relevance += 5;
    if (bookTypeLower) relevance += 5;

    // 4. Audience Specificity (0-100)
    let audienceSpecificity = 70;
    if (
      audienceLower.includes('seniors') ||
      audienceLower.includes('adults 50+') ||
      audienceLower.includes('teens') ||
      audienceLower.includes('beginners') ||
      audienceLower.includes('dementia') ||
      audienceLower.includes('mechanics') ||
      audienceLower.includes('nurses') ||
      audienceLower.includes('gardeners')
    ) {
      audienceSpecificity = 92;
    } else if (audienceLower.includes('all ages') || audienceLower.includes('everyone')) {
      audienceSpecificity = 48;
    } else if (audienceLower.length > 0) {
      audienceSpecificity = 80;
    }

    // 5. Commercial Intent (0-100)
    let commercialIntent = 82;
    if (
      nicheLower.includes('gift') ||
      nicheLower.includes('large print') ||
      nicheLower.includes('activity book') ||
      nicheLower.includes('relaxing')
    ) {
      commercialIntent = 94;
    }

    // 6. Keyword Opportunity (0-100)
    let keywordOpportunity = 78;
    if (input.keywordCount && input.keywordCount > 15) {
      keywordOpportunity = 88;
    } else if (nicheLower.split(' ').length >= 2) {
      keywordOpportunity = 84;
    }

    // 7. Content Differentiation (0-100)
    let contentDifferentiation = 75;
    if (input.hasDistinctFormatGap || input.hasAudienceGap || input.hasThemeGap) {
      contentDifferentiation = 90;
    } else if (nicheLower.includes('large print') || nicheLower.includes('themed')) {
      contentDifferentiation = 85;
    }

    // 8. Trend Signal
    let trendSignal: KdpTrendSignal = 'Evergreen';
    if (nicheLower.includes('christmas') || nicheLower.includes('halloween') || nicheLower.includes('easter')) {
      trendSignal = 'Seasonal';
    } else if (nicheLower.includes('ai') || nicheLower.includes('mindful') || nicheLower.includes('retro')) {
      trendSignal = 'Rising';
    }

    return {
      demandSignal,
      competitionSignal,
      relevance: Math.min(100, relevance),
      audienceSpecificity: Math.min(100, audienceSpecificity),
      commercialIntent: Math.min(100, commercialIntent),
      keywordOpportunity: Math.min(100, keywordOpportunity),
      contentDifferentiation: Math.min(100, contentDifferentiation),
      trendSignal,
    };
  }

  private static generateScoreExplanation(
    score: number,
    grade: NicheScoreGrade,
    components: KdpNicheScoreComponents,
    input: NicheScoreInput
  ): string {
    const compDesc =
      components.competitionSignal === 'Low'
        ? 'favorable low competitor saturation'
        : components.competitionSignal === 'Moderate'
        ? 'balanced competitor activity'
        : 'dense competitor saturation';

    const demandDesc =
      components.demandSignal === 'High'
        ? 'strong shopper demand signals'
        : components.demandSignal === 'Moderate'
        ? 'healthy steady search patterns'
        : 'focused niche search interest';

    return `This niche demonstrates a ${grade.toLowerCase()} (${score}/100) based on ${demandDesc}, ${compDesc}, and strong specificity in "${input.targetAudience || 'Target Audience'}". Differentiation through specific themes or formats (e.g. Large Print) presents strong publishing potential.`;
  }
}

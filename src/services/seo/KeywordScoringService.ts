import {
  KdpCompetitionSignal,
  KdpDemandSignal,
  KdpKeywordRisk,
  KdpSearchIntent,
  KdpSeoKeyword,
  KdpTrendSignal,
  OverallKdpSeoBreakdown,
  RiskLevel,
} from '../../types/seo';
import { Project } from '../../types/project';
import { KeywordRiskService } from './KeywordRiskService';

export class KeywordScoringService {
  /**
   * Calculates Studio SEO Score (0-100) using a multi-factor formula.
   * Internal Studio Metric: Never labeled as "Amazon ranking score" unless verified.
   *
   * Formula Weights:
   * 1. Relevance: 25%
   * 2. Specificity / Long-tail: 15%
   * 3. Commercial Intent: 15%
   * 4. Content / Book Match: 15%
   * 5. Search Demand Signal: 15%
   * 6. Competition / Trend Signal: 15%
   */
  public static calculateKeywordScore(params: {
    keyword: string;
    relevance: number; // 0-100
    demandSignal: KdpDemandSignal;
    competitionSignal: KdpCompetitionSignal;
    commercialIntent: KdpSearchIntent;
    isLongTail: boolean;
    bookMatchScore: number;
    risk: KdpKeywordRisk;
    riskLevel?: RiskLevel;
  }): { score: number; grade: 'Excellent' | 'Strong' | 'Moderate' | 'Weak' | 'Poor' } {
    if (
      params.risk === 'POLICY_VIOLATION' ||
      params.risk === 'COMPETITOR_BRAND' ||
      params.risk === 'TRADEMARK_RISK' ||
      params.risk === 'CELEBRITY_NAME'
    ) {
      return { score: 18, grade: 'Poor' };
    }

    // 1. Relevance component (25%)
    const relWeight = (Math.max(0, Math.min(100, params.relevance)) / 100) * 25;

    // 2. Specificity / Long-Tail (15%)
    const wordCount = params.keyword.trim().split(/\s+/).length;
    let specificityScore = 65;
    if (wordCount >= 4) specificityScore = 98;
    else if (wordCount === 3) specificityScore = 90;
    else if (wordCount === 2) specificityScore = 75;
    else specificityScore = 50;
    const specWeight = (specificityScore / 100) * 15;

    // 3. Commercial Intent (15%)
    let intentScore = 70;
    switch (params.commercialIntent) {
      case 'Transactional':
        intentScore = 98;
        break;
      case 'Commercial':
        intentScore = 90;
        break;
      case 'Gift-oriented':
        intentScore = 86;
        break;
      case 'Niche-specific':
        intentScore = 80;
        break;
      case 'Informational':
        intentScore = 55;
        break;
    }
    const intentWeight = (intentScore / 100) * 15;

    // 4. Book / Content Match (15%)
    const matchWeight = (Math.max(0, Math.min(100, params.bookMatchScore)) / 100) * 15;

    // 5. Demand Signal (15%)
    let demandScore = 70;
    if (params.demandSignal === 'High') demandScore = 95;
    else if (params.demandSignal === 'Moderate') demandScore = 78;
    else if (params.demandSignal === 'Niche') demandScore = 65;
    const demandWeight = (demandScore / 100) * 15;

    // 6. Competition Signal (15%) - Low competition is favorable
    let compScore = 65;
    if (params.competitionSignal === 'Low') compScore = 95;
    else if (params.competitionSignal === 'Moderate') compScore = 75;
    else if (params.competitionSignal === 'High') compScore = 50;
    const compWeight = (compScore / 100) * 15;

    const total = Math.round(relWeight + specWeight + intentWeight + matchWeight + demandWeight + compWeight);
    const score = Math.max(5, Math.min(100, total));

    let grade: 'Excellent' | 'Strong' | 'Moderate' | 'Weak' | 'Poor';
    if (score >= 90) grade = 'Excellent';
    else if (score >= 75) grade = 'Strong';
    else if (score >= 60) grade = 'Moderate';
    else if (score >= 40) grade = 'Weak';
    else grade = 'Poor';

    return { score, grade };
  }

  /**
   * Calculates overall comprehensive KDP SEO breakdown for the studio dashboard
   */
  public static calculateOverallSeoBreakdown(params: {
    keywords: KdpSeoKeyword[];
    titleScore: number;
    subtitleScore: number;
    descriptionScore: number;
    sevenBoxesCoverageScore: number;
    project?: Project | null;
  }): OverallKdpSeoBreakdown {
    const validKeywords = params.keywords.filter(k => !k.isExcluded);

    // Keyword Quality
    const avgKeywordQuality = validKeywords.length > 0
      ? Math.round(validKeywords.reduce((acc, k) => acc + k.studioSeoScore, 0) / validKeywords.length)
      : 50;

    // Content Match average
    const avgContentMatch = validKeywords.length > 0
      ? Math.round(validKeywords.reduce((acc, k) => acc + k.bookMatchScore, 0) / validKeywords.length)
      : 60;

    // Risk Level
    const riskLevel = KeywordRiskService.evaluateKeywordCollectionRisk(validKeywords);

    // Weights:
    // Keyword Quality: 30%
    // Title Score: 20%
    // Subtitle Score: 15%
    // Description Score: 15%
    // 7-Boxes Keyword Coverage: 10%
    // Content Match: 10%
    let overall = Math.round(
      avgKeywordQuality * 0.30 +
      params.titleScore * 0.20 +
      params.subtitleScore * 0.15 +
      params.descriptionScore * 0.15 +
      params.sevenBoxesCoverageScore * 0.10 +
      avgContentMatch * 0.10
    );

    // Penalty for high risk
    if (riskLevel === 'HIGH RISK') {
      overall = Math.max(25, overall - 20);
    } else if (riskLevel === 'MEDIUM RISK') {
      overall = Math.max(40, overall - 10);
    }

    let scoreGrade: 'Excellent' | 'Strong' | 'Moderate' | 'Weak' | 'Poor';
    if (overall >= 90) scoreGrade = 'Excellent';
    else if (overall >= 75) scoreGrade = 'Strong';
    else if (overall >= 60) scoreGrade = 'Moderate';
    else if (overall >= 40) scoreGrade = 'Weak';
    else scoreGrade = 'Poor';

    return {
      overallScore: overall,
      keywordQualityScore: avgKeywordQuality,
      titleScore: params.titleScore,
      subtitleScore: params.subtitleScore,
      descriptionScore: params.descriptionScore,
      keywordCoverageScore: params.sevenBoxesCoverageScore,
      contentMatchScore: avgContentMatch,
      riskLevel,
      scoreGrade,
    };
  }
}

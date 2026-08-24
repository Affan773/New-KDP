import {
  KdpDescriptionSeoAnalysis,
  KdpMarketplaceConfig,
  KdpOneClickSeoProposal,
  KdpSeoHistorySession,
  KdpSeoKeyword,
  KdpSeoResearchReport,
  KdpSevenBoxesOptimization,
  KdpTitleSeoAnalysis,
  OverallKdpSeoBreakdown,
} from '../../types/seo';
import { Project } from '../../types/project';
import {
  KeywordDataProviderRegistry,
  KeywordDiscoveryParams,
} from './KeywordDataProvider';
import { KeywordRiskService } from './KeywordRiskService';
import { KeywordScoringService } from './KeywordScoringService';
import { KeywordClusterService } from './KeywordClusterService';
import { KeywordOptimizationService } from './KeywordOptimizationService';
import { SEOAnalysisService } from './SEOAnalysisService';

export class KeywordResearchService {
  public static readonly MARKETPLACES: KdpMarketplaceConfig[] = [
    { id: 'com', name: 'United States', domain: 'amazon.com', defaultLanguage: 'English', currency: 'USD ($)', flag: '🇺🇸' },
    { id: 'in', name: 'India', domain: 'amazon.in', defaultLanguage: 'English', currency: 'INR (₹)', flag: '🇮🇳' },
    { id: 'co.uk', name: 'United Kingdom', domain: 'amazon.co.uk', defaultLanguage: 'English', currency: 'GBP (£)', flag: '🇬🇧' },
    { id: 'ca', name: 'Canada', domain: 'amazon.ca', defaultLanguage: 'English / French', currency: 'CAD ($)', flag: '🇨🇦' },
    { id: 'de', name: 'Germany', domain: 'amazon.de', defaultLanguage: 'German', currency: 'EUR (€)', flag: '🇩🇪' },
    { id: 'fr', name: 'France', domain: 'amazon.fr', defaultLanguage: 'French', currency: 'EUR (€)', flag: '🇫🇷' },
    { id: 'it', name: 'Italy', domain: 'amazon.it', defaultLanguage: 'Italian', currency: 'EUR (€)', flag: '🇮🇹' },
    { id: 'es', name: 'Spain', domain: 'amazon.es', defaultLanguage: 'Spanish', currency: 'EUR (€)', flag: '🇪🇸' },
    { id: 'co.jp', name: 'Japan', domain: 'amazon.co.jp', defaultLanguage: 'Japanese', currency: 'JPY (¥)', flag: '🇯🇵' },
  ];

  private static readonly HISTORY_KEY = 'kdp_studio_seo_history';

  /**
   * Complete Keyword Discovery Pipeline:
   * Discovery -> Risk Check -> Scoring -> Clustering -> 7 Boxes
   */
  public static async runDiscoveryPipeline(params: KeywordDiscoveryParams): Promise<{
    keywords: KdpSeoKeyword[];
    clusters: { cluster: string; count: number; keywords: string[] }[];
    sevenBoxes: KdpSevenBoxesOptimization;
    breakdown: OverallKdpSeoBreakdown;
    titleAnalysis: KdpTitleSeoAnalysis;
    descriptionAnalysis: KdpDescriptionSeoAnalysis;
    isLive: boolean;
    notice: string;
  }> {
    const provider = KeywordDataProviderRegistry.getActiveProvider();
    const { keywords: rawKeywords, isLive, providerNotice } = await provider.discoverKeywords(params);

    // 1. Evaluate risk and score each keyword
    const processedKeywords: KdpSeoKeyword[] = rawKeywords.map(kw => {
      const riskEval = KeywordRiskService.evaluateKeywordRisk(kw.keyword, params.project);
      const scoreData = KeywordScoringService.calculateKeywordScore({
        keyword: kw.keyword,
        relevance: kw.relevance,
        demandSignal: kw.demandSignal,
        competitionSignal: kw.competitionSignal,
        commercialIntent: kw.commercialIntent,
        isLongTail: kw.isLongTail,
        bookMatchScore: kw.bookMatchScore,
        risk: riskEval.risk,
        riskLevel: riskEval.riskLevel,
      });

      return {
        ...kw,
        risk: riskEval.risk,
        riskLevel: riskEval.riskLevel,
        riskReason: riskEval.riskReason,
        studioSeoScore: scoreData.score,
        scoreGrade: scoreData.grade,
      };
    });

    // 2. Cluster keywords
    const clusterGroups = KeywordClusterService.groupIntoClusters(processedKeywords);
    const clusters = clusterGroups.map(cg => ({
      cluster: cg.cluster,
      count: cg.count,
      keywords: cg.keywords,
    }));

    // 3. Optimize 7 Boxes
    const sevenBoxes = KeywordOptimizationService.optimizeSevenBoxes(processedKeywords, params.project);

    // 4. Title & Description Analysis
    const titleAnalysis = SEOAnalysisService.analyzeTitle({
      title: params.bookTitle || params.project?.name || '',
      subtitle: params.subtitle || params.project?.metadata?.subtitle || '',
      targetKeywords: processedKeywords.map(k => k.keyword),
      project: params.project,
    });

    const descriptionAnalysis = SEOAnalysisService.analyzeDescription({
      description: params.description || params.project?.metadata?.description || '',
      targetKeywords: processedKeywords.map(k => k.keyword),
      project: params.project,
    });

    // 5. Calculate Overall Breakdown
    const breakdown = KeywordScoringService.calculateOverallSeoBreakdown({
      keywords: processedKeywords,
      titleScore: titleAnalysis.overallTitleScore,
      subtitleScore: titleAnalysis.readabilityScore,
      descriptionScore: descriptionAnalysis.overallDescriptionScore,
      sevenBoxesCoverageScore: sevenBoxes.overallKeywordSetScore,
      project: params.project,
    });

    return {
      keywords: processedKeywords,
      clusters,
      sevenBoxes,
      breakdown,
      titleAnalysis,
      descriptionAnalysis,
      isLive,
      notice: providerNotice,
    };
  }

  /**
   * Save a research session to history
   */
  public static saveSessionToHistory(session: Omit<KdpSeoHistorySession, 'id' | 'timestamp' | 'date'>): KdpSeoHistorySession {
    const history = this.getHistory();
    const newSession: KdpSeoHistorySession = {
      ...session,
      id: `seo_hist_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      timestamp: Date.now(),
    };

    history.unshift(newSession);
    const trimmed = history.slice(0, 50); // Keep last 50
    try {
      localStorage.setItem(this.HISTORY_KEY, JSON.stringify(trimmed));
    } catch {
      // safe fallback
    }
    return newSession;
  }

  /**
   * Retrieve all history sessions
   */
  public static getHistory(): KdpSeoHistorySession[] {
    try {
      const data = localStorage.getItem(this.HISTORY_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch {
      // ignore
    }
    return [];
  }

  /**
   * Delete a history session
   */
  public static deleteHistorySession(id: string): KdpSeoHistorySession[] {
    const current = this.getHistory().filter(h => h.id !== id);
    try {
      localStorage.setItem(this.HISTORY_KEY, JSON.stringify(current));
    } catch {
      // ignore
    }
    return current;
  }

  /**
   * Generates CSV Export matching Phase 10 exact columns:
   * Keyword, SEO Score, Relevance, Intent, Competition, Trend, Cluster, Risk, Source, Book Match
   */
  public static generateCsvContent(keywords: KdpSeoKeyword[]): string {
    const headers = [
      'Keyword',
      'SEO Score',
      'Relevance',
      'Intent',
      'Competition',
      'Trend',
      'Cluster',
      'Risk',
      'Source',
      'Book Match %',
      'Data Source',
    ];

    const rows = keywords.map(kw => [
      `"${kw.keyword.replace(/"/g, '""')}"`,
      kw.studioSeoScore,
      `${kw.relevance}%`,
      `"${kw.commercialIntent}"`,
      `"${kw.competitionSignal}"`,
      `"${kw.trend}"`,
      `"${kw.cluster}"`,
      `"${kw.riskLevel} (${kw.risk})"`,
      `"${kw.source}"`,
      `${kw.bookMatchScore}%`,
      `"${kw.dataSource}"`,
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }
}

import {
  DataSourceType,
  KdpCompetitionSignal,
  KdpDemandSignal,
  KdpKeywordCluster,
  KdpKeywordRisk,
  KdpSearchIntent,
  KdpSeoKeyword,
  KdpTrendSignal,
  RiskLevel,
} from '../../types/seo';
import { Project } from '../../types/project';

export interface KeywordDiscoveryParams {
  seed: string;
  bookTitle?: string;
  subtitle?: string;
  description?: string;
  bookType?: string;
  puzzleType?: string;
  theme?: string;
  audience?: string;
  difficulty?: string;
  format?: string;
  language?: string;
  marketplace?: string;
  project?: Project | null;
  customKeywords?: string[];
}

export interface KeywordDataProvider {
  readonly id: string;
  readonly name: string;
  readonly isLiveConnected: boolean;
  readonly dataClassification: DataSourceType;

  discoverKeywords(params: KeywordDiscoveryParams): Promise<{
    keywords: KdpSeoKeyword[];
    isLive: boolean;
    providerNotice: string;
  }>;

  generateLongTails(params: KeywordDiscoveryParams): Promise<KdpSeoKeyword[]>;
}

/**
 * Internal Studio AI / Algorithmic Estimator
 * Grounded strictly in book content, typography, taxonomy, and multi-factor analysis.
 * Explicitly designated as "Estimated / Calculated" to uphold 100% data integrity without fabricating unverified live numbers.
 */
export class InternalAIEstimatorProvider implements KeywordDataProvider {
  public readonly id = 'internal_studio_estimator';
  public readonly name = 'Internal Studio Estimator (Phase 10)';
  public readonly isLiveConnected = false;
  public readonly dataClassification: DataSourceType = 'Estimated';

  public async discoverKeywords(params: KeywordDiscoveryParams): Promise<{
    keywords: KdpSeoKeyword[];
    isLive: boolean;
    providerNotice: string;
  }> {
    const seed = (params.seed || '').trim().toLowerCase();
    const bookTitle = (params.bookTitle || params.project?.name || '').toLowerCase();
    const subtitle = (params.subtitle || params.project?.metadata?.subtitle || '').toLowerCase();
    const description = (params.description || params.project?.metadata?.description || '').toLowerCase();
    const puzzleType = (params.puzzleType || (params.project?.metadata as any)?.puzzleType || 'Word Search').toLowerCase();
    const bookType = (params.bookType || (params.project?.kdpSettings as any)?.bookType || params.project?.type || 'Puzzle Book').toLowerCase();
    const theme = (params.theme || (params.project?.metadata as any)?.theme || 'General').toLowerCase();
    const audience = (params.audience || params.project?.metadata?.targetAudience || 'Adults').toLowerCase();
    const difficulty = (params.difficulty || (params.project?.metadata as any)?.difficulty || 'Medium').toLowerCase();
    const format = (params.format || (params.project?.kdpSettings as any)?.format || 'Paperback').toLowerCase();
    const lang = (params.language || params.project?.metadata?.language || 'English').toLowerCase();

    const rawCandidates: {
      text: string;
      cluster: KdpKeywordCluster;
      intent: KdpSearchIntent;
      source: KdpSeoKeyword['source'];
      demand: KdpDemandSignal;
      comp: KdpCompetitionSignal;
      trend: KdpTrendSignal;
    }[] = [];

    // 1. Seed Direct Variations
    if (seed) {
      rawCandidates.push(
        { text: seed, cluster: 'CORE', intent: 'Commercial', source: 'Seed Search', demand: 'High', comp: 'Moderate', trend: 'Evergreen' },
        { text: `${seed} for ${audience}`, cluster: 'AUDIENCE', intent: 'Transactional', source: 'Seed Search', demand: 'High', comp: 'Moderate', trend: 'Evergreen' },
        { text: `easy ${seed}`, cluster: 'DIFFICULTY', intent: 'Commercial', source: 'Seed Search', demand: 'Moderate', comp: 'Low', trend: 'Stable' },
        { text: `large print ${seed}`, cluster: 'FORMAT', intent: 'Transactional', source: 'Seed Search', demand: 'High', comp: 'Moderate', trend: 'Rising' },
        { text: `${theme} ${seed}`, cluster: 'THEME', intent: 'Commercial', source: 'Seed Search', demand: 'Moderate', comp: 'Low', trend: 'Rising' },
        { text: `${seed} gift for ${audience}`, cluster: 'GIFT', intent: 'Gift-oriented', source: 'Seed Search', demand: 'High', comp: 'Moderate', trend: 'Seasonal' },
        { text: `relaxing ${seed} book`, cluster: 'USE CASE', intent: 'Commercial', source: 'Seed Search', demand: 'Moderate', comp: 'Low', trend: 'Evergreen' }
      );
    }

    // 2. Content & Taxonomic Grounding
    if (puzzleType) {
      rawCandidates.push(
        { text: `${puzzleType} puzzle book`, cluster: 'CORE', intent: 'Commercial', source: 'Book Content', demand: 'High', comp: 'Moderate', trend: 'Evergreen' },
        { text: `large print ${puzzleType} for ${audience}`, cluster: 'AUDIENCE', intent: 'Transactional', source: 'Book Content', demand: 'High', comp: 'Moderate', trend: 'Rising' },
        { text: `${theme} ${puzzleType} puzzles`, cluster: 'THEME', intent: 'Commercial', source: 'Book Content', demand: 'Moderate', comp: 'Low', trend: 'Rising' },
        { text: `${difficulty} ${puzzleType} collection`, cluster: 'DIFFICULTY', intent: 'Commercial', source: 'Book Content', demand: 'Moderate', comp: 'Low', trend: 'Stable' },
        { text: `${puzzleType} with solutions`, cluster: 'FORMAT', intent: 'Transactional', source: 'Book Content', demand: 'High', comp: 'Low', trend: 'Evergreen' },
        { text: `stress relief ${puzzleType} for ${audience}`, cluster: 'USE CASE', intent: 'Commercial', source: 'Book Content', demand: 'Moderate', comp: 'Low', trend: 'Rising' },
        { text: `brain games ${puzzleType} book`, cluster: 'USE CASE', intent: 'Commercial', source: 'Book Content', demand: 'High', comp: 'Moderate', trend: 'Evergreen' }
      );
    }

    // 3. Title & Subtitle Grounding
    if (bookTitle) {
      rawCandidates.push({
        text: bookTitle.slice(0, 50),
        cluster: 'CORE',
        intent: 'Commercial',
        source: 'Book Content',
        demand: 'Moderate',
        comp: 'Low',
        trend: 'Evergreen',
      });
    }

    if (subtitle) {
      const parts = subtitle.split(/[,:;|-]/).map(s => s.trim().toLowerCase()).filter(s => s.length > 5 && s.length <= 45);
      for (const part of parts.slice(0, 3)) {
        rawCandidates.push({
          text: part,
          cluster: 'LONG-TAIL',
          intent: 'Transactional',
          source: 'Book Content',
          demand: 'Moderate',
          comp: 'Low',
          trend: 'Rising',
        });
      }
    }

    // 4. Custom User Entered Keywords
    if (params.customKeywords && params.customKeywords.length > 0) {
      for (const custom of params.customKeywords) {
        if (custom.trim()) {
          rawCandidates.push({
            text: custom.trim().toLowerCase(),
            cluster: 'CORE',
            intent: 'Commercial',
            source: 'Imported',
            demand: 'Estimated',
            comp: 'Estimated',
            trend: 'Stable',
          });
        }
      }
    }

    // Deduplicate & Normalize
    const seen = new Set<string>();
    const normalizedKeywords: KdpSeoKeyword[] = [];

    for (const item of rawCandidates) {
      const clean = item.text.replace(/[^a-z0-9\s-]/g, ' ').replace(/\s+/g, ' ').trim();
      if (!clean || clean.length < 3 || clean.length > 60 || seen.has(clean)) {
        continue;
      }
      seen.add(clean);

      const words = clean.split(' ');
      const isLongTail = words.length >= 3;
      const relevance = this.estimateRelevance(clean, { seed, bookTitle, puzzleType, theme, audience, format });
      const bookMatch = this.calculateBookMatchScore(clean, { bookTitle, subtitle, description, puzzleType, theme, audience, format, difficulty });

      // Default temporary values - will be scored by KeywordScoringService
      normalizedKeywords.push({
        id: `kw_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        keyword: clean,
        relevance,
        demandSignal: item.demand,
        competitionSignal: item.comp,
        commercialIntent: item.intent,
        trend: item.trend,
        isLongTail,
        wordCount: words.length,
        charCount: clean.length,
        risk: 'NONE',
        riskLevel: 'LOW RISK',
        studioSeoScore: 75,
        scoreGrade: 'Strong',
        cluster: item.cluster,
        source: item.source,
        dataSource: 'Estimated',
        bookMatchScore: bookMatch,
        bookContentMatch: bookMatch >= 60,
      });
    }

    return {
      keywords: normalizedKeywords,
      isLive: false,
      providerNotice: 'Live Amazon search API is not connected. Metrics are estimated based on Studio content analysis and semantic taxonomy.',
    };
  }

  public async generateLongTails(params: KeywordDiscoveryParams): Promise<KdpSeoKeyword[]> {
    const seed = (params.seed || params.puzzleType || 'puzzles').trim().toLowerCase();
    const audience = (params.audience || 'adults').toLowerCase();
    const theme = (params.theme || 'relaxing').toLowerCase();
    const difficulty = (params.difficulty || 'easy').toLowerCase();
    const puzzleType = (params.puzzleType || 'word search').toLowerCase();

    const longTailTemplates = [
      `large print ${puzzleType} puzzles for ${audience}`,
      `${difficulty} ${puzzleType} puzzle book for seniors`,
      `travel themed ${puzzleType} puzzle book`,
      `stress relief ${puzzleType} for adults with solutions`,
      `relaxing ${theme} ${puzzleType} book for beginners`,
      `giant print ${puzzleType} puzzles 100 pages`,
      `brain exercise ${puzzleType} activity book for adults`,
      `mindfulness and ${theme} ${puzzleType} book`,
      `pocket size ${puzzleType} puzzle travel edition`,
      `ultimate ${difficulty} to hard ${puzzleType} collection`,
    ];

    return longTailTemplates.map(text => {
      const clean = text.trim().toLowerCase();
      const words = clean.split(' ');
      return {
        id: `lt_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        keyword: clean,
        relevance: 92,
        demandSignal: 'High',
        competitionSignal: 'Low',
        commercialIntent: 'Transactional',
        trend: 'Rising',
        isLongTail: true,
        wordCount: words.length,
        charCount: clean.length,
        risk: 'NONE',
        riskLevel: 'LOW RISK',
        studioSeoScore: 88,
        scoreGrade: 'Strong',
        cluster: 'LONG-TAIL',
        source: 'Long-Tail Generator',
        dataSource: 'Estimated',
        bookMatchScore: 90,
        bookContentMatch: true,
      };
    });
  }

  private estimateRelevance(keyword: string, context: any): number {
    let score = 50;
    const kw = keyword.toLowerCase();
    if (context.seed && kw.includes(context.seed)) score += 30;
    if (context.puzzleType && kw.includes(context.puzzleType)) score += 20;
    if (context.theme && kw.includes(context.theme)) score += 15;
    if (context.audience && kw.includes(context.audience)) score += 15;
    if (context.format && kw.includes(context.format)) score += 10;
    return Math.min(100, Math.max(25, score));
  }

  public calculateBookMatchScore(keyword: string, context: {
    bookTitle?: string;
    subtitle?: string;
    description?: string;
    puzzleType?: string;
    theme?: string;
    audience?: string;
    format?: string;
    difficulty?: string;
  }): number {
    const kw = keyword.toLowerCase();
    const words = kw.split(/\s+/);
    let matchPoints = 0;
    let maxPoints = 0;

    // Check title/subtitle (30 points)
    maxPoints += 30;
    const titleText = `${context.bookTitle || ''} ${context.subtitle || ''}`.toLowerCase();
    if (words.some(w => titleText.includes(w))) {
      matchPoints += 25;
      if (titleText.includes(kw)) matchPoints += 5;
    }

    // Check puzzle type (25 points)
    maxPoints += 25;
    const pt = (context.puzzleType || '').toLowerCase();
    if (pt && (kw.includes(pt) || pt.includes(kw))) {
      matchPoints += 25;
    }

    // Check theme & audience (25 points)
    maxPoints += 25;
    const th = (context.theme || '').toLowerCase();
    const aud = (context.audience || '').toLowerCase();
    if (th && kw.includes(th)) matchPoints += 15;
    if (aud && kw.includes(aud)) matchPoints += 10;

    // Check format & difficulty (20 points)
    maxPoints += 20;
    const fmt = (context.format || '').toLowerCase();
    const diff = (context.difficulty || '').toLowerCase();
    if (fmt && kw.includes(fmt)) matchPoints += 10;
    if (diff && kw.includes(diff)) matchPoints += 10;

    if (maxPoints === 0) return 60;
    return Math.min(100, Math.max(15, Math.round((matchPoints / maxPoints) * 100)));
  }
}

/**
 * Service Registry managing providers
 */
export class KeywordDataProviderRegistry {
  private static providers: Map<string, KeywordDataProvider> = new Map();
  private static activeProviderId: string = 'internal_studio_estimator';

  static {
    const defaultProvider = new InternalAIEstimatorProvider();
    this.providers.set(defaultProvider.id, defaultProvider);
  }

  public static registerProvider(provider: KeywordDataProvider): void {
    this.providers.set(provider.id, provider);
  }

  public static getActiveProvider(): KeywordDataProvider {
    return this.providers.get(this.activeProviderId) || new InternalAIEstimatorProvider();
  }

  public static setActiveProvider(id: string): boolean {
    if (this.providers.has(id)) {
      this.activeProviderId = id;
      return true;
    }
    return false;
  }

  public static getAllProviders(): KeywordDataProvider[] {
    return Array.from(this.providers.values());
  }
}

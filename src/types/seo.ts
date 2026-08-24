export type KdpSearchIntent =
  | 'Commercial'
  | 'Transactional'
  | 'Informational'
  | 'Niche-specific'
  | 'Gift-oriented';

export type KdpKeywordCluster =
  | 'CORE'
  | 'AUDIENCE'
  | 'FORMAT'
  | 'THEME'
  | 'DIFFICULTY'
  | 'USE CASE'
  | 'LONG-TAIL'
  | 'GIFT'
  | 'NICHE'
  | string;

export type KdpKeywordRisk =
  | 'NONE'
  | 'TRADEMARK_RISK'
  | 'COMPETITOR_BRAND'
  | 'CELEBRITY_NAME'
  | 'UNSUPPORTED_CLAIM'
  | 'POLICY_VIOLATION'
  | 'KEYWORD_STUFFING'
  | 'REPEATED_KEYWORDS'
  | 'MISLEADING_KEYWORDS'
  | 'WRONG_AUDIENCE'
  | 'WRONG_FORMAT';

export type RiskLevel = 'LOW RISK' | 'MEDIUM RISK' | 'HIGH RISK';

export type DataSourceType =
  | 'Verified'
  | 'Estimated'
  | 'Calculated'
  | 'User Provided'
  | 'Unavailable';

export type KdpDemandSignal = 'High' | 'Moderate' | 'Niche' | 'Estimated';
export type KdpCompetitionSignal = 'Low' | 'Moderate' | 'High' | 'Estimated';
export type KdpTrendSignal = 'Evergreen' | 'Rising' | 'Stable' | 'Seasonal';

export interface KdpSeoKeyword {
  id: string;
  keyword: string;
  relevance: number; // 0-100
  demandSignal: KdpDemandSignal;
  competitionSignal: KdpCompetitionSignal;
  commercialIntent: KdpSearchIntent;
  trend: KdpTrendSignal;
  isLongTail: boolean;
  wordCount: number;
  charCount: number;
  risk: KdpKeywordRisk;
  riskLevel: RiskLevel;
  riskReason?: string;
  studioSeoScore: number; // 0-100 internal score (never labeled as amazon ranking)
  scoreGrade: 'Excellent' | 'Strong' | 'Moderate' | 'Weak' | 'Poor';
  cluster: KdpKeywordCluster;
  source: 'Book Content' | 'Seed Search' | 'Long-Tail Generator' | 'Imported' | 'AI Suggested' | 'Competitor Signal';
  dataSource: DataSourceType;
  bookMatchScore: number; // 0-100% based on book title, description, puzzle type, theme, audience, format
  isExcluded?: boolean;
  excludeReason?: string;
  bookContentMatch: boolean;
  notes?: string;
}

export interface KdpSevenBoxesOptimization {
  boxes: {
    slotNumber: number; // 1-7
    phrase: string;
    charCount: number;
    charLimit: number; // 50
    keywordsIncluded: string[];
    relevanceScore: number;
    warnings: string[];
    isCompliant: boolean;
  }[];
  totalCharactersUsed: number;
  totalUniqueWords: number;
  duplicateWordCount: number;
  overallCoverageScore: number;
  overallKeywordSetScore: number; // 0-100 live calculated set score
  recommendations: string[];
}

export interface KdpTitleSeoAnalysis {
  title: string;
  subtitle: string;
  overallTitleScore: number; // 0-100
  readabilityScore: number; // 0-100
  keywordRelevanceScore: number; // 0-100
  keywordPlacement: 'Optimal' | 'Acceptable' | 'Needs Improvement';
  characterCount: {
    title: number;
    subtitle: number;
    total: number;
    maxLimit: number; // 200
  };
  detectedKeywords: string[];
  overOptimizationWarnings: string[];
  suggestions: {
    title: string;
    subtitle: string;
    reason: string;
    focus: 'Readability & Search' | 'Audience Focused' | 'Benefit Focused';
  }[];
}

export interface KdpDescriptionSeoAnalysis {
  rawDescription: string;
  overallDescriptionScore: number; // 0-100
  readabilityScore: number;
  keywordRelevanceScore: number;
  naturalFlowScore: number;
  wordCount: number;
  characterCount: number;
  keywordDensity: {
    keyword: string;
    count: number;
    densityPercent: number;
    isOverused: boolean;
  }[];
  detectedClaims: string[];
  unsupportedClaims: string[];
  repetitionWarnings: string[];
  audienceMatch: boolean;
  bookContentMatch: boolean;
  optimizedDescriptionPreview: string;
  recommendations: string[];
}

export interface KdpCompetitorAnalysisItem {
  id: string;
  title: string;
  subtitle?: string;
  author?: string;
  visibleCategory?: string;
  price?: string;
  pageCount?: number;
  extractedKeywords: string[];
  notes?: string;
}

export interface KdpMarketplaceConfig {
  id: string;
  name: string;
  domain: string;
  defaultLanguage: string;
  currency: string;
  flag: string;
}

export interface OverallKdpSeoBreakdown {
  overallScore: number; // 0-100
  keywordQualityScore: number; // 0-100
  titleScore: number; // 0-100
  subtitleScore: number; // 0-100
  descriptionScore: number; // 0-100
  keywordCoverageScore: number; // 0-100
  contentMatchScore: number; // 0-100
  riskLevel: RiskLevel;
  scoreGrade: 'Excellent' | 'Strong' | 'Moderate' | 'Weak' | 'Poor';
}

export interface KdpSeoHistorySession {
  id: string;
  projectId: string;
  projectTitle: string;
  date: string;
  timestamp: number;
  seedKeyword: string;
  marketplace: string;
  language: string;
  keywordCount: number;
  topKeywords: string[];
  overallScore: number;
  sevenBoxesPhrases: string[];
  keywords?: KdpSeoKeyword[];
  sevenBoxes?: KdpSevenBoxesOptimization;
}

export interface KdpOneClickSeoProposal {
  id: string;
  projectId: string;
  originalTitle: string;
  originalSubtitle: string;
  originalDescription: string;
  originalKeywords: string[];
  proposedTitle: string;
  proposedSubtitle: string;
  proposedDescription: string;
  proposedSevenBoxes: string[];
  titleRationale: string;
  subtitleRationale: string;
  descriptionRationale: string;
  keywordsRationale: string;
  projectedScoreGain: number;
  status: {
    title: 'PENDING' | 'APPLIED' | 'IGNORED';
    subtitle: 'PENDING' | 'APPLIED' | 'IGNORED';
    description: 'PENDING' | 'APPLIED' | 'IGNORED';
    keywords: 'PENDING' | 'APPLIED' | 'IGNORED';
  };
}

export interface KdpSeoResearchReport {
  id: string;
  projectId: string;
  projectTitle: string;
  timestamp: string;
  marketplace: string;
  language: string;
  seedKeyword: string;
  overallSeoScore: number;
  scoreGrade: 'Excellent' | 'Strong' | 'Moderate' | 'Weak' | 'Poor';
  breakdown: OverallKdpSeoBreakdown;
  topKeywords: KdpSeoKeyword[];
  longTailKeywords: KdpSeoKeyword[];
  sevenBoxes: KdpSevenBoxesOptimization;
  clusters: {
    cluster: KdpKeywordCluster;
    count: number;
    keywords: string[];
  }[];
  titleAnalysis: KdpTitleSeoAnalysis;
  descriptionAnalysis: KdpDescriptionSeoAnalysis;
  negativeKeywords: {
    keyword: string;
    reason: string;
  }[];
  warnings: string[];
  recommendedImprovements: string[];
  dataSourcesDisclosure: {
    providerName: string;
    liveDataStatus: string;
    estimationNotice: string;
  };
}

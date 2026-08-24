import { DataSourceType, KdpDemandSignal, KdpCompetitionSignal, KdpTrendSignal } from './seo';

export type { DataSourceType };

export type NicheWatchlistStatus =
  | 'Researching'
  | 'Promising'
  | 'Create Book'
  | 'Rejected'
  | 'Archived';

export type NicheStatus = NicheWatchlistStatus;

export interface KdpNicheResearchParams {
  niche: string;
  bookType: string;
  puzzleType?: string;
  targetAudience: string;
  language?: string;
  marketplace?: string;
  customCompetitors?: KdpCompetitor[];
}

export type NicheScoreGrade =
  | 'Excellent Opportunity'
  | 'Strong Opportunity'
  | 'Moderate'
  | 'Weak'
  | 'Poor';

export interface KdpNicheScoreComponents {
  demandSignal: KdpDemandSignal;
  competitionSignal: KdpCompetitionSignal;
  relevance: number; // 0-100
  audienceSpecificity: number; // 0-100
  commercialIntent: number; // 0-100
  keywordOpportunity: number; // 0-100
  contentDifferentiation: number; // 0-100
  trendSignal: KdpTrendSignal;
}

export interface KdpNicheOpportunityScore {
  overallScore: number; // 0-100
  grade: NicheScoreGrade;
  label: string;
  explanation: string;
  components: KdpNicheScoreComponents;
  isEstimate: boolean; // Always true (Studio internal calculation, not Amazon official)
  dataSource: DataSourceType;
}

export interface KdpSubNiche {
  id: string;
  name: string;
  theme: string;
  targetAudience: string;
  relevance: number; // 0-100
  opportunityScore: number; // 0-100
  competitionSignal: KdpCompetitionSignal;
  keywordOpportunity: number; // 0-100
  differentiationAngle: string;
  dataSource: DataSourceType;
}

export interface KdpCompetitor {
  id: string;
  title: string;
  subtitle?: string;
  author: string;
  asin?: string;
  isbn?: string;
  url?: string;
  format: string;
  pageCount: number | null;
  puzzleCount?: number | null;
  price: number | string | null;
  rating: number | null;
  reviewCount: number | null;
  category?: string | null;
  publicationInfo?: string | null;
  theme?: string;
  audience?: string;
  difficulty?: string;
  uniqueFeatures: string[];
  source: string; // e.g. "Public Amazon listing", "User Provided", "ISBN Open Index"
  dataSource: DataSourceType; // "Verified" | "Estimated" | "Calculated" | "User Provided" | "Unavailable"
  timestamp: string;
  notes?: string;
}

export interface KdpCompetitorContentAnalysis {
  commonTopics: { topic: string; frequency: number; sampleKeywords: string[] }[];
  commonPhrases: { phrase: string; count: number; purpose: string }[];
  audiencePositioning: { segment: string; percentage: number; rationale: string }[];
  formatPatterns: { format: string; prevalence: string; note: string }[];
}

export interface KdpContentGap {
  id: string;
  competitorPattern: string;
  potentialGap: string;
  opportunityLevel: 'High' | 'Moderate' | 'Niche';
  actionableAdvice: string;
}

export interface KdpDifferentiationStrategy {
  themeAngles: string[];
  audienceAngles: string[];
  difficultyAngles: string[];
  puzzleCountAngles: string[];
  formatAngles: string[];
  interiorDesignAngles: string[];
  answerKeyAngles: string[];
  nicheSpecialization: string[];
}

export interface KdpNicheKeywordsConnection {
  coreKeywords: string[];
  longTailKeywords: string[];
  audienceKeywords: string[];
  themeKeywords: string[];
  formatKeywords: string[];
  keywordOpportunityScore: number; // 0-100
}

export type KdpNicheKeywords = KdpNicheKeywordsConnection;

export interface KdpTitleOpportunities {
  directions: {
    title: string;
    subtitle: string;
    targetKeyword: string;
    rationale: string;
  }[];
}

export type KdpTitleOpportunityResult = KdpTitleOpportunities;

export interface KdpDescriptionPositioning {
  usp: string;
  targetAudience: string;
  mainBenefit: string;
  theme: string;
  difficulty: string;
  formatPositioning: string;
  sampleBulletPoints: string[];
  closingHook: string;
}

export type KdpDescriptionPositioningResult = KdpDescriptionPositioning;

export interface KdpValidationCheckItem {
  id: string;
  label: string;
  passed: boolean;
  tip?: string;
}

export interface KdpNicheValidation {
  checklist: KdpValidationCheckItem[];
  status: 'READY TO CREATE' | 'NEEDS MORE RESEARCH';
  readinessScore: number; // 0-100
  verdictRationale: string;
}

export type KdpNicheValidationResult = KdpNicheValidation;

export interface KdpNicheBreakdown {
  niche: string;
  primaryAudience: string;
  subAudiences: string[];
  popularThemes: string[];
  bookTypes: string[];
  puzzleTypes: string[];
  potentialFormats: string[];
  potentialPricePositioning: {
    min: number;
    max: number;
    recommended: number;
    currency: string;
    dataSource: DataSourceType;
  };
  keywordOpportunities: string[];
  contentGaps: KdpContentGap[];
}

export interface KdpNicheResearchResult {
  id: string;
  niche: string;
  bookType: string;
  puzzleType: string;
  targetAudience: string;
  language: string;
  marketplace: string;
  timestamp: string;
  score: KdpNicheOpportunityScore;
  breakdown: KdpNicheBreakdown;
  subNiches: KdpSubNiche[];
  competitors: KdpCompetitor[];
  competitorContentAnalysis: KdpCompetitorContentAnalysis;
  contentGaps: KdpContentGap[];
  differentiation: KdpDifferentiationStrategy;
  keywords: KdpNicheKeywordsConnection;
  titleOpportunities: KdpTitleOpportunities;
  descriptionPositioning: KdpDescriptionPositioning;
  validation: KdpNicheValidation;
  dataSources: {
    metric: string;
    source: string;
    status: DataSourceType;
    timestamp: string;
  }[];
}

export interface KdpNicheWatchlistItem {
  id: string;
  nicheName: string;
  bookType: string;
  puzzleType: string;
  audience: string;
  marketplace: string;
  language: string;
  score: number;
  grade: NicheScoreGrade;
  status: NicheWatchlistStatus;
  createdAt: string;
  updatedAt: string;
  notes?: string;
  sessionData: KdpNicheResearchResult;
}

export interface KdpNicheHistorySession {
  id: string;
  niche: string;
  marketplace: string;
  bookType: string;
  score: number;
  grade: NicheScoreGrade;
  keywordsCount: number;
  competitorsCount: number;
  analysisDate: string;
  result: KdpNicheResearchResult;
}

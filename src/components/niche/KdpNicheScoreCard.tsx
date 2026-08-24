import React from 'react';
import {
  TrendingUp,
  Award,
  Users,
  Search,
  Sparkles,
  Layers,
  ShieldCheck,
  Info,
  Flame,
  Zap,
} from 'lucide-react';
import { KdpNicheOpportunityScore, DataSourceType } from '../../types/niche';

interface KdpNicheScoreCardProps {
  score: KdpNicheOpportunityScore;
  niche: string;
  targetAudience: string;
}

export const KdpNicheScoreCard: React.FC<KdpNicheScoreCardProps> = ({
  score,
  niche,
  targetAudience,
}) => {
  const getGradeColor = (scoreNum: number) => {
    if (scoreNum >= 90) return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30';
    if (scoreNum >= 75) return 'text-blue-500 bg-blue-500/10 border-blue-500/30';
    if (scoreNum >= 60) return 'text-amber-500 bg-amber-500/10 border-amber-500/30';
    if (scoreNum >= 40) return 'text-orange-500 bg-orange-500/10 border-orange-500/30';
    return 'text-rose-500 bg-rose-500/10 border-rose-500/30';
  };

  const getSourceBadge = (type: DataSourceType) => {
    switch (type) {
      case 'Verified':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            ✓ Verified
          </span>
        );
      case 'Calculated':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            ⚡ Calculated
          </span>
        );
      case 'User Provided':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            ✎ User Provided
          </span>
        );
      case 'Estimated':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            ≈ Estimated
          </span>
        );
      case 'Unavailable':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 border border-neutral-500/20">
            ? Unavailable
          </span>
        );
    }
  };

  return (
    <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-5">
      {/* Header with Title & Estimate Safety Notice */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-100 dark:border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white font-display">
              Niche Opportunity Score
            </h2>
            {getSourceBadge(score.dataSource)}
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Multi-factor internal assessment evaluating market demand, competition density, and differentiation signals.
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs shrink-0 font-medium">
          <Info className="w-3.5 h-3.5" />
          <span>Internal Studio Estimate</span>
        </div>
      </div>

      {/* Main Score Hero Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Score Dial / Number (4 cols) */}
        <div className="lg:col-span-4 flex flex-col items-center justify-center p-6 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-750 text-center">
          <div className="relative flex items-center justify-center">
            {/* SVG Circular Progress Meter */}
            <svg className="w-36 h-36 -rotate-90" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="50"
                className="text-neutral-200 dark:text-neutral-700"
                strokeWidth="10"
                stroke="currentColor"
                fill="transparent"
              />
              <circle
                cx="60"
                cy="60"
                r="50"
                className={
                  score.overallScore >= 75
                    ? 'text-amber-500'
                    : score.overallScore >= 60
                    ? 'text-blue-500'
                    : 'text-rose-500'
                }
                strokeWidth="10"
                strokeDasharray={314.159}
                strokeDashoffset={314.159 * (1 - score.overallScore / 100)}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-3xl font-extrabold text-neutral-900 dark:text-white font-mono tracking-tight">
                {score.overallScore}
              </span>
              <span className="text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                out of 100
              </span>
            </div>
          </div>

          <div
            className={`mt-4 px-3.5 py-1.5 rounded-full border text-xs font-bold font-display ${getGradeColor(
              score.overallScore
            )}`}
          >
            {score.grade}
          </div>

          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-2">
            Opportunity rating for <strong className="text-neutral-700 dark:text-neutral-300">{niche}</strong>
          </p>
        </div>

        {/* 8-Component Breakdown Grid (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 flex items-center justify-between">
            <span>Opportunity Factors (0–100 Weighted)</span>
            <span className="text-[10px] font-normal text-neutral-400">Never called official Amazon rank</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
            {/* Demand Signal */}
            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/70 dark:border-neutral-750">
              <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 mb-1">
                <span className="text-[11px] font-medium flex items-center gap-1">
                  <Flame className="w-3 h-3 text-orange-500" />
                  Demand
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-500">
                  {score.components.demandSignal}
                </span>
              </div>
              <div className="text-sm font-bold text-neutral-900 dark:text-white">
                {score.components.demandSignal === 'High' ? 'Strong Interest' : 'Steady Interest'}
              </div>
            </div>

            {/* Competition Signal */}
            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/70 dark:border-neutral-750">
              <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 mb-1">
                <span className="text-[11px] font-medium flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-blue-500" />
                  Competition
                </span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    score.components.competitionSignal === 'Low'
                      ? 'bg-emerald-500/10 text-emerald-500'
                      : score.components.competitionSignal === 'Moderate'
                      ? 'bg-blue-500/10 text-blue-500'
                      : 'bg-rose-500/10 text-rose-500'
                  }`}
                >
                  {score.components.competitionSignal}
                </span>
              </div>
              <div className="text-sm font-bold text-neutral-900 dark:text-white">
                {score.components.competitionSignal === 'Low' ? 'Low Saturation' : 'Manageable'}
              </div>
            </div>

            {/* Audience Specificity */}
            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/70 dark:border-neutral-750">
              <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 mb-1">
                <span className="text-[11px] font-medium flex items-center gap-1">
                  <Users className="w-3 h-3 text-purple-500" />
                  Audience
                </span>
                <span className="font-mono text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                  {score.components.audienceSpecificity}%
                </span>
              </div>
              <div className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                {targetAudience || 'General'}
              </div>
            </div>

            {/* Trend Signal */}
            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/70 dark:border-neutral-750">
              <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 mb-1">
                <span className="text-[11px] font-medium flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-emerald-500" />
                  Trend
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500">
                  {score.components.trendSignal}
                </span>
              </div>
              <div className="text-sm font-bold text-neutral-900 dark:text-white">
                {score.components.trendSignal}
              </div>
            </div>

            {/* Relevance */}
            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/70 dark:border-neutral-750">
              <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 mb-1">
                <span className="text-[11px] font-medium">Relevance</span>
                <span className="font-mono text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                  {score.components.relevance}%
                </span>
              </div>
              <div className="w-full bg-neutral-200 dark:bg-neutral-700 h-1.5 rounded-full overflow-hidden mt-1">
                <div
                  className="bg-amber-500 h-full rounded-full"
                  style={{ width: `${score.components.relevance}%` }}
                />
              </div>
            </div>

            {/* Commercial Intent */}
            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/70 dark:border-neutral-750">
              <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 mb-1">
                <span className="text-[11px] font-medium">Commercial Intent</span>
                <span className="font-mono text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                  {score.components.commercialIntent}%
                </span>
              </div>
              <div className="w-full bg-neutral-200 dark:bg-neutral-700 h-1.5 rounded-full overflow-hidden mt-1">
                <div
                  className="bg-blue-500 h-full rounded-full"
                  style={{ width: `${score.components.commercialIntent}%` }}
                />
              </div>
            </div>

            {/* Keyword Opportunity */}
            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/70 dark:border-neutral-750">
              <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 mb-1">
                <span className="text-[11px] font-medium">Keyword Depth</span>
                <span className="font-mono text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                  {score.components.keywordOpportunity}%
                </span>
              </div>
              <div className="w-full bg-neutral-200 dark:bg-neutral-700 h-1.5 rounded-full overflow-hidden mt-1">
                <div
                  className="bg-emerald-500 h-full rounded-full"
                  style={{ width: `${score.components.keywordOpportunity}%` }}
                />
              </div>
            </div>

            {/* Content Differentiation */}
            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/70 dark:border-neutral-750">
              <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 mb-1">
                <span className="text-[11px] font-medium">Differentiation</span>
                <span className="font-mono text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                  {score.components.contentDifferentiation}%
                </span>
              </div>
              <div className="w-full bg-neutral-200 dark:bg-neutral-700 h-1.5 rounded-full overflow-hidden mt-1">
                <div
                  className="bg-purple-500 h-full rounded-full"
                  style={{ width: `${score.components.contentDifferentiation}%` }}
                />
              </div>
            </div>
          </div>

          {/* Explanation Banner */}
          <div className="p-3.5 rounded-xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 text-xs text-neutral-700 dark:text-neutral-300">
            <p className="leading-relaxed">{score.explanation}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

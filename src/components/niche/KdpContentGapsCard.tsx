import React from 'react';
import {
  Lightbulb,
  Sparkles,
  Layers,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  BookmarkCheck,
  Palette,
  Eye,
  Key,
  Flame,
} from 'lucide-react';
import { KdpContentGap, KdpDifferentiationStrategy } from '../../types/niche';

interface KdpContentGapsCardProps {
  contentGaps: KdpContentGap[];
  differentiation: KdpDifferentiationStrategy;
  niche: string;
}

export const KdpContentGapsCard: React.FC<KdpContentGapsCardProps> = ({
  contentGaps,
  differentiation,
  niche,
}) => {
  return (
    <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-neutral-100 dark:border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Lightbulb className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-white font-display">
              Content Gap Analysis & Differentiation Engine
            </h3>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Identify market gaps left open by competitors and actionable methods to make your book stand out.
          </p>
        </div>
        <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold self-start sm:self-auto">
          Potential Opportunity Focus
        </div>
      </div>

      {/* Section 1: Content Gaps Table / Cards */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          Identified Content Gaps (Competitor Weaknesses)
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {contentGaps.map((gap, i) => (
            <div
              key={gap.id || i}
              className="p-4 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-800/40 space-y-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-mono">
                  Competitor Pattern #{i + 1}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  {gap.opportunityLevel} Opportunity
                </span>
              </div>

              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                <strong className="text-neutral-800 dark:text-neutral-200">What Competitors Do:</strong> {gap.competitorPattern}
              </p>

              <div className="p-2.5 rounded-lg bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-900 dark:text-emerald-200 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300">
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span>Potential Gap to Capture:</span>
                </div>
                <p className="text-[11px] leading-relaxed">{gap.potentialGap}</p>
                <div className="pt-1 text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">
                  → Action: {gap.actionableAdvice}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: "HOW CAN I MAKE MY BOOK DIFFERENT?" Differentiation Engine */}
      <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-neutral-900 dark:text-white font-display flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            HOW CAN I MAKE MY BOOK DIFFERENT?
          </h4>
          <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
            Actionable strategies based on research data
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 1. Format & Typography Angle */}
          <div className="p-3.5 rounded-xl border border-neutral-200/70 dark:border-neutral-750 bg-white dark:bg-neutral-800/80 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400">
              <Eye className="w-4 h-4" />
              <span>Large-Print & Margins</span>
            </div>
            <ul className="text-[11px] text-neutral-600 dark:text-neutral-400 space-y-1.5 list-disc list-inside">
              {differentiation.formatAngles.map((a, idx) => (
                <li key={idx} className="leading-snug">{a}</li>
              ))}
            </ul>
          </div>

          {/* 2. Theme & Nostalgia Angle */}
          <div className="p-3.5 rounded-xl border border-neutral-200/70 dark:border-neutral-750 bg-white dark:bg-neutral-800/80 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-600 dark:text-purple-400">
              <Layers className="w-4 h-4" />
              <span>Thematic Chapters</span>
            </div>
            <ul className="text-[11px] text-neutral-600 dark:text-neutral-400 space-y-1.5 list-disc list-inside">
              {differentiation.themeAngles.map((a, idx) => (
                <li key={idx} className="leading-snug">{a}</li>
              ))}
            </ul>
          </div>

          {/* 3. Specialized Audience Angle */}
          <div className="p-3.5 rounded-xl border border-neutral-200/70 dark:border-neutral-750 bg-white dark:bg-neutral-800/80 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400">
              <BookmarkCheck className="w-4 h-4" />
              <span>Audience Precision</span>
            </div>
            <ul className="text-[11px] text-neutral-600 dark:text-neutral-400 space-y-1.5 list-disc list-inside">
              {differentiation.audienceAngles.map((a, idx) => (
                <li key={idx} className="leading-snug">{a}</li>
              ))}
            </ul>
          </div>

          {/* 4. Answer Key & Interior Layout */}
          <div className="p-3.5 rounded-xl border border-neutral-200/70 dark:border-neutral-750 bg-white dark:bg-neutral-800/80 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <Key className="w-4 h-4" />
              <span>Answer Keys & Layout</span>
            </div>
            <ul className="text-[11px] text-neutral-600 dark:text-neutral-400 space-y-1.5 list-disc list-inside">
              {differentiation.answerKeyAngles.map((a, idx) => (
                <li key={idx} className="leading-snug">{a}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

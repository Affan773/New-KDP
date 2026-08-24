import React from 'react';
import { Compass, Sparkles, ArrowRight, ShieldCheck, Zap, Layers, Users } from 'lucide-react';
import { KdpSubNiche } from '../../types/niche';

interface KdpSubNicheDiscoveryProps {
  subNiches: KdpSubNiche[];
  currentNiche: string;
  onSelectSubNiche: (subNiche: KdpSubNiche) => void;
}

export const KdpSubNicheDiscovery: React.FC<KdpSubNicheDiscoveryProps> = ({
  subNiches,
  currentNiche,
  onSelectSubNiche,
}) => {
  return (
    <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-100 dark:border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <Compass className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-white font-display">
              Sub-Niche Discovery & Branching
            </h3>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Discover focused sub-segments branching from <strong className="text-neutral-700 dark:text-neutral-300">{currentNiche}</strong> to identify lower competition and specialized buyer intent.
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 self-start sm:self-auto font-mono">
          {subNiches.length} Opportunities Identified
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
        {subNiches.map(sub => (
          <div
            key={sub.id}
            className="p-4 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-800/40 hover:bg-white dark:hover:bg-neutral-800 hover:border-purple-500/40 dark:hover:border-purple-500/40 transition-all shadow-xs group flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-bold text-sm text-neutral-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  {sub.name}
                </h4>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 font-mono ${
                    sub.opportunityScore >= 80
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                  }`}
                >
                  {sub.opportunityScore}/100 Opp.
                </span>
              </div>

              <div className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-2">
                <strong className="text-neutral-700 dark:text-neutral-300">Theme:</strong> {sub.theme}
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-neutral-600 dark:text-neutral-400">
                <Users className="w-3 h-3 text-purple-500 shrink-0" />
                <span className="truncate">{sub.targetAudience}</span>
              </div>

              <div className="grid grid-cols-3 gap-1 pt-1.5 border-t border-neutral-200/60 dark:border-neutral-750 text-[10px]">
                <div className="text-center p-1 rounded bg-neutral-100 dark:bg-neutral-750">
                  <span className="block text-neutral-400">Relevance</span>
                  <span className="font-bold text-neutral-800 dark:text-neutral-200 font-mono">{sub.relevance}%</span>
                </div>
                <div className="text-center p-1 rounded bg-neutral-100 dark:bg-neutral-750">
                  <span className="block text-neutral-400">Competition</span>
                  <span
                    className={`font-bold ${
                      sub.competitionSignal === 'Low'
                        ? 'text-emerald-500'
                        : sub.competitionSignal === 'Moderate'
                        ? 'text-blue-500'
                        : 'text-rose-500'
                    }`}
                  >
                    {sub.competitionSignal}
                  </span>
                </div>
                <div className="text-center p-1 rounded bg-neutral-100 dark:bg-neutral-750">
                  <span className="block text-neutral-400">Keywords</span>
                  <span className="font-bold text-neutral-800 dark:text-neutral-200 font-mono">{sub.keywordOpportunity}%</span>
                </div>
              </div>

              <div className="p-2 rounded-lg bg-purple-500/5 dark:bg-purple-500/10 border border-purple-500/15 text-[11px] text-neutral-700 dark:text-neutral-300">
                <strong className="text-purple-600 dark:text-purple-400">Angle:</strong> {sub.differentiationAngle}
              </div>
            </div>

            <button
              onClick={() => onSelectSubNiche(sub)}
              className="mt-3 w-full py-1.5 px-3 rounded-lg bg-neutral-200/80 hover:bg-purple-600 hover:text-white dark:bg-neutral-750 dark:hover:bg-purple-600 text-neutral-700 dark:text-neutral-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Analyze This Sub-Niche</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

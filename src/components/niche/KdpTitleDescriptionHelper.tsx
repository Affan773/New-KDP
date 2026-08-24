import React, { useState } from 'react';
import {
  FileText,
  Copy,
  Check,
  Sparkles,
  Info,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import {
  KdpTitleOpportunityResult,
  KdpDescriptionPositioningResult,
} from '../../types/niche';

interface KdpTitleDescriptionHelperProps {
  titleOpportunities: KdpTitleOpportunityResult;
  descriptionPositioning: KdpDescriptionPositioningResult;
  niche: string;
}

export const KdpTitleDescriptionHelper: React.FC<KdpTitleDescriptionHelperProps> = ({
  titleOpportunities,
  descriptionPositioning,
  niche,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(id);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-6">
      {/* Header with Mandatory Suggestions Disclaimer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-neutral-100 dark:border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-white font-display">
              Suggested Title & Description Positioning
            </h3>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Marketplace-aligned title structures and benefit-driven bullet points for <strong className="text-neutral-700 dark:text-neutral-300">{niche}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300 text-xs font-semibold self-start sm:self-auto">
          <Info className="w-3.5 h-3.5" />
          <span>Suggestions Only — Fully Editable</span>
        </div>
      </div>

      {/* Suggested Title Directions Grid */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          High-Converting Title Structures (Compliant with KDP Rules)
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {titleOpportunities.directions.map((dir, i) => (
            <div
              key={i}
              className="p-4 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-800/40 space-y-2.5 flex flex-col justify-between"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-bold text-neutral-400">
                  <span className="uppercase tracking-wider">Option #{i + 1}</span>
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                    <ShieldCheck className="w-3 h-3" />
                    KDP Compliant
                  </span>
                </div>

                <div className="font-bold text-sm text-neutral-900 dark:text-white leading-snug">
                  {dir.title}
                </div>

                <div className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed font-medium">
                  {dir.subtitle}
                </div>

                <div className="text-[11px] text-neutral-500 dark:text-neutral-400 pt-1">
                  <strong>Rationale:</strong> {dir.rationale}
                </div>
              </div>

              <button
                onClick={() => handleCopy(`${dir.title}: ${dir.subtitle}`, `title-${i}`)}
                className="mt-3 w-full py-1.5 px-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-750 text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center justify-center gap-1.5 transition-colors"
              >
                {copiedField === `title-${i}` ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Copied Title!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Copy Title & Subtitle</span>
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Description Positioning & USPs */}
      <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          Recommended Book Description Positioning & USPs
        </h4>

        <div className="p-4 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/40 space-y-3">
          <div>
            <span className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block">
              Core Value Proposition (USP Hook):
            </span>
            <p className="text-sm font-semibold text-neutral-900 dark:text-white mt-0.5">
              "{descriptionPositioning.usp}"
            </p>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-neutral-200/60 dark:border-neutral-750">
            <span className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block">
              High-Converting Feature Bullets:
            </span>
            <div className="space-y-1 text-xs text-neutral-700 dark:text-neutral-300 font-mono">
              {descriptionPositioning.sampleBulletPoints.map((bullet, idx) => (
                <div key={idx} className="p-1.5 rounded bg-white dark:bg-neutral-800 border border-neutral-200/70 dark:border-neutral-750 flex items-center justify-between">
                  <span>{bullet}</span>
                  <button
                    onClick={() => handleCopy(bullet, `bullet-${idx}`)}
                    className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                    title="Copy bullet"
                  >
                    {copiedField === `bullet-${idx}` ? (
                      <Check className="w-3 h-3 text-emerald-500" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

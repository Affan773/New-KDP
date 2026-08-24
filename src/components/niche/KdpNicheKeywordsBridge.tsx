import React, { useState } from 'react';
import { Search, Copy, Check, ExternalLink, Sparkles, Tag, ArrowRight } from 'lucide-react';
import { KdpNicheKeywords } from '../../types/niche';

interface KdpNicheKeywordsBridgeProps {
  keywords: KdpNicheKeywords;
  niche: string;
  onOpenKeywordResearch?: (seedKeyword: string) => void;
}

export const KdpNicheKeywordsBridge: React.FC<KdpNicheKeywordsBridgeProps> = ({
  keywords,
  niche,
  onOpenKeywordResearch,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCopyAll = () => {
    const all = [
      ...keywords.coreKeywords,
      ...keywords.longTailKeywords,
      ...keywords.audienceKeywords,
      ...keywords.themeKeywords,
      ...keywords.formatKeywords,
    ].join('\n');
    handleCopy(all, 'ALL');
  };

  return (
    <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100 dark:border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Search className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-white font-display">
              High-Opportunity Keywords
            </h3>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Keywords identified for <strong className="text-neutral-700 dark:text-neutral-300">{niche}</strong> categorized by search intent.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-semibold text-neutral-700 dark:text-neutral-300 transition-colors"
          >
            {copiedKey === 'ALL' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedKey === 'ALL' ? 'Copied All!' : 'Copy All'}</span>
          </button>

          {onOpenKeywordResearch && (
            <button
              onClick={() => onOpenKeywordResearch(niche)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs"
            >
              <span>Open Keyword Research</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 4-Category Keyword Badges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* 1. Core Keywords */}
        <div className="p-3.5 rounded-xl bg-neutral-50/70 dark:bg-neutral-800/40 border border-neutral-200/70 dark:border-neutral-750 space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 flex items-center justify-between">
            <span>Core Search Phrases</span>
            <span className="font-mono text-[10px]">{keywords.coreKeywords.length}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {keywords.coreKeywords.map(kw => (
              <button
                key={kw}
                onClick={() => handleCopy(kw, kw)}
                title="Click to copy"
                className="group inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-800 dark:text-neutral-200 hover:border-emerald-500 transition-all text-left"
              >
                <span>{kw}</span>
                {copiedKey === kw ? (
                  <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                ) : (
                  <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 text-neutral-400 shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Long-Tail Keywords */}
        <div className="p-3.5 rounded-xl bg-neutral-50/70 dark:bg-neutral-800/40 border border-neutral-200/70 dark:border-neutral-750 space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 flex items-center justify-between">
            <span>Long-Tail & Buyer Intent</span>
            <span className="font-mono text-[10px]">{keywords.longTailKeywords.length}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {keywords.longTailKeywords.map(kw => (
              <button
                key={kw}
                onClick={() => handleCopy(kw, kw)}
                title="Click to copy"
                className="group inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-800 dark:text-neutral-200 hover:border-emerald-500 transition-all text-left"
              >
                <span>{kw}</span>
                {copiedKey === kw ? (
                  <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                ) : (
                  <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 text-neutral-400 shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Audience & Gift Keywords */}
        <div className="p-3.5 rounded-xl bg-neutral-50/70 dark:bg-neutral-800/40 border border-neutral-200/70 dark:border-neutral-750 space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 flex items-center justify-between">
            <span>Audience & Gift Intent</span>
            <span className="font-mono text-[10px]">{keywords.audienceKeywords.length}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {keywords.audienceKeywords.map(kw => (
              <button
                key={kw}
                onClick={() => handleCopy(kw, kw)}
                title="Click to copy"
                className="group inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-800 dark:text-neutral-200 hover:border-emerald-500 transition-all text-left"
              >
                <span>{kw}</span>
                {copiedKey === kw ? (
                  <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                ) : (
                  <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 text-neutral-400 shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 4. Format & Theme Keywords */}
        <div className="p-3.5 rounded-xl bg-neutral-50/70 dark:bg-neutral-800/40 border border-neutral-200/70 dark:border-neutral-750 space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 flex items-center justify-between">
            <span>Format & Attribute Terms</span>
            <span className="font-mono text-[10px]">{keywords.formatKeywords.length}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {keywords.formatKeywords.map(kw => (
              <button
                key={kw}
                onClick={() => handleCopy(kw, kw)}
                title="Click to copy"
                className="group inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-800 dark:text-neutral-200 hover:border-emerald-500 transition-all text-left"
              >
                <span>{kw}</span>
                {copiedKey === kw ? (
                  <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                ) : (
                  <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 text-neutral-400 shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Loader2,
  Copy,
  Check,
  BookOpen,
  ArrowRight,
  ShieldAlert,
  Search,
} from 'lucide-react';
import { AiTitleOption, AiTitleAssistantResult } from '../../types/ai';

interface AiTitleAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyTitle: (title: string, subtitle: string, keywords?: string[]) => void;
  initialTopic?: string;
  initialAudience?: string;
}

export const AiTitleAssistantModal: React.FC<AiTitleAssistantModalProps> = ({
  isOpen,
  onClose,
  onApplyTitle,
  initialTopic = '',
  initialAudience = 'Adults & Seniors',
}) => {
  const [topic, setTopic] = useState(initialTopic || 'Nature & Wildlife Word Search');
  const [targetAudience, setTargetAudience] = useState(initialAudience);
  const [tone, setTone] = useState('Engaging & High-Converting');
  const [seedKeywords, setSeedKeywords] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AiTitleAssistantResult | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!topic.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/ai/title-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          niche: topic.trim(),
          targetAudience,
          tone,
          keywords: seedKeywords.trim(),
        }),
      });

      const data = await response.json();
      if (data.titles) {
        setResult(data);
      }
    } catch (err) {
      console.error('Title Assistant Request failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-900 dark:text-white font-display">
                AI Title, Subtitle & Keyword Assistant
              </h2>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Generate high-converting Amazon KDP metadata concepts.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                Book Niche / Core Theme
              </label>
              <input
                type="text"
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="e.g. 90s Music Word Search"
                className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                Target Reader Audience
              </label>
              <select
                value={targetAudience}
                onChange={e => setTargetAudience(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
              >
                <option value="Adults & Seniors">Adults & Seniors</option>
                <option value="Seniors (Large Print)">Seniors (Large Print)</option>
                <option value="Kids (Ages 6-10)">Kids (Ages 6-10)</option>
                <option value="Teens & Young Adults">Teens & Young Adults</option>
                <option value="All Ages Family">All Ages Family</option>
              </select>
            </div>
          </div>

          <button
            type="button"
            disabled={isLoading || !topic.trim()}
            onClick={handleGenerate}
            className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-neutral-950 font-bold text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Brainstorming Metadata Suggestions...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Title Ideas & Keywords</span>
              </>
            )}
          </button>

          {/* Results Display */}
          {result && (
            <div className="space-y-4 pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                Title & Subtitle Options
              </h3>

              <div className="space-y-3">
                {result.titles.map((t, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group hover:border-amber-500/50 transition-colors"
                  >
                    <div className="space-y-1 flex-1">
                      <h4 className="text-sm font-bold text-neutral-900 dark:text-white font-display">
                        {t.title}
                      </h4>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                        {t.subtitle}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onApplyTitle(t.title, t.subtitle, result.keywords);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-neutral-900 text-white dark:bg-neutral-700 dark:text-white text-xs font-bold hover:bg-amber-500 hover:text-neutral-950 transition-colors self-end sm:self-center shrink-0 flex items-center gap-1.5"
                    >
                      <span>Apply</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* 7 Keywords */}
              {result.keywords && result.keywords.length > 0 && (
                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                    Recommended 7 KDP Search Keywords
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {result.keywords.map((kw, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => copyToClipboard(kw)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 font-mono hover:border-amber-500 transition-colors"
                      >
                        <span>{kw}</span>
                        {copiedText === kw ? (
                          <Check className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <Copy className="w-3 h-3 opacity-40" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Disclaimer */}
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-300 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Amazon KDP Notice: Generated title and keyword ideas are creative suggestions. You are responsible for ensuring your final metadata complies with Amazon's Content Guidelines and trademark rules.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

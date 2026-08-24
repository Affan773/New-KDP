import React, { useState } from 'react';
import {
  FileText,
  BookOpen,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Info,
  Layers,
  ArrowRight,
  RefreshCw,
  Save,
} from 'lucide-react';
import { KdpDescriptionSeoAnalysis, KdpTitleSeoAnalysis } from '../../types/seo';
import { Project } from '../../types/project';
import { SEOAnalysisService } from '../../services/seo/SEOAnalysisService';

interface Props {
  project: Project | null;
  title: string;
  subtitle: string;
  description: string;
  titleAnalysis: KdpTitleSeoAnalysis;
  descriptionAnalysis: KdpDescriptionSeoAnalysis;
  targetKeywords: string[];
  onChangeTitle: (title: string) => void;
  onChangeSubtitle: (subtitle: string) => void;
  onChangeDescription: (desc: string) => void;
  onApplyTitleSuggestion: (title: string, subtitle: string) => void;
  onApplyOptimizedDescription: (optimized: string) => void;
}

export const KdpTitleDescriptionAnalyzers: React.FC<Props> = ({
  project,
  title,
  subtitle,
  description,
  titleAnalysis,
  descriptionAnalysis,
  targetKeywords,
  onChangeTitle,
  onChangeSubtitle,
  onChangeDescription,
  onApplyTitleSuggestion,
  onApplyOptimizedDescription,
}) => {
  const [showOptimizedDescPreview, setShowOptimizedDescPreview] = useState(false);
  const [copiedPreview, setCopiedPreview] = useState(false);

  const totalTitleChars = title.length + (subtitle ? subtitle.length + 3 : 0);
  const isTitleOverLimit = totalTitleChars > 200;

  const handleCopyOptimizedDesc = () => {
    if (descriptionAnalysis.optimizedDescriptionPreview) {
      navigator.clipboard.writeText(descriptionAnalysis.optimizedDescriptionPreview);
      setCopiedPreview(true);
      setTimeout(() => setCopiedPreview(false), 2000);
    }
  };

  return (
    <div id="kdp-title-description-analyzers-container" className="space-y-6">
      {/* Title & Subtitle Analyzer */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-bold text-slate-900">Title & Subtitle SEO Analyzer</h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Evaluates search terms, readability, and character limits (200-char combined ceiling).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs text-slate-500 font-medium">Title Score</div>
              <div className="text-lg font-bold text-indigo-600">{titleAnalysis.overallTitleScore}/100</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center font-bold text-indigo-700">
              {titleAnalysis.overallTitleScore}%
            </div>
          </div>
        </div>

        {/* Input Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">Book Title</label>
              <span className="text-[11px] font-mono text-slate-500">{title.length} chars</span>
            </div>
            <input
              id="input-seo-title"
              type="text"
              value={title}
              onChange={e => onChangeTitle(e.target.value)}
              placeholder="e.g. Relaxing Word Search Puzzles"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">Subtitle</label>
              <span className="text-[11px] font-mono text-slate-500">{subtitle.length} chars</span>
            </div>
            <input
              id="input-seo-subtitle"
              type="text"
              value={subtitle}
              onChange={e => onChangeSubtitle(e.target.value)}
              placeholder="e.g. 100 Large Print Puzzles for Seniors & Adults with Full Solutions"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Combined Limit Bar */}
        <div className="space-y-1.5 p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">
              Combined Title + Subtitle Character Count:
            </span>
            <span
              className={`font-mono font-bold ${
                isTitleOverLimit ? 'text-rose-600' : 'text-slate-800'
              }`}
            >
              {totalTitleChars} / 200 max
            </span>
          </div>
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                isTitleOverLimit ? 'bg-rose-500' : totalTitleChars > 160 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, (totalTitleChars / 200) * 100)}%` }}
            />
          </div>
        </div>

        {/* Over-Optimization & Warnings */}
        {titleAnalysis.overOptimizationWarnings.length > 0 && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 space-y-1">
            <div className="font-semibold flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Title Policy Warnings:
            </div>
            {titleAnalysis.overOptimizationWarnings.map((w, i) => (
              <div key={i} className="pl-5">
                • {w}
              </div>
            ))}
          </div>
        )}

        {/* Suggestions */}
        {titleAnalysis.suggestions.length > 0 && (
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              High-Converting Title Suggestions:
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {titleAnalysis.suggestions.map((sug, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-lg border border-indigo-100 bg-indigo-50/40 hover:bg-indigo-50/70 transition-colors space-y-2 flex flex-col justify-between"
                >
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">
                      {sug.focus}
                    </div>
                    <div className="text-xs font-bold text-slate-900">{sug.title}</div>
                    <div className="text-xs text-slate-600">{sug.subtitle}</div>
                    <p className="text-[11px] text-slate-500 italic mt-1">{sug.reason}</p>
                  </div>

                  <button
                    onClick={() => onApplyTitleSuggestion(sug.title, sug.subtitle)}
                    className="self-start inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-indigo-200 hover:border-indigo-300 text-indigo-700 rounded text-xs font-semibold shadow-2xs transition-colors"
                  >
                    Apply Suggestion <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Book Description SEO Analyzer */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-teal-600" />
              <h3 className="text-lg font-bold text-slate-900">Book Description SEO Analyzer</h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Checks keyword density, natural flow, claim compliance, and reader conversion triggers.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs text-slate-500 font-medium">Description Score</div>
              <div className="text-lg font-bold text-teal-600">{descriptionAnalysis.overallDescriptionScore}/100</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center font-bold text-teal-700">
              {descriptionAnalysis.overallDescriptionScore}%
            </div>
          </div>
        </div>

        {/* Text Area */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700">Book Description Copy</label>
            <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500">
              <span>{descriptionAnalysis.wordCount} words</span>
              <span>{descriptionAnalysis.characterCount} characters</span>
            </div>
          </div>
          <textarea
            id="textarea-seo-description"
            rows={7}
            value={description}
            onChange={e => onChangeDescription(e.target.value)}
            placeholder="Enter your Amazon book description..."
            className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 leading-relaxed font-sans"
          />
        </div>

        {/* Density & Flow Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center space-y-1">
            <div className="text-[11px] font-medium text-slate-500 uppercase">Readability & Clarity</div>
            <div className="text-lg font-bold text-slate-800">{descriptionAnalysis.readabilityScore}%</div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center space-y-1">
            <div className="text-[11px] font-medium text-slate-500 uppercase">Keyword Natural Flow</div>
            <div className="text-lg font-bold text-teal-600">{descriptionAnalysis.naturalFlowScore}%</div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center space-y-1">
            <div className="text-[11px] font-medium text-slate-500 uppercase">Audience & Content Match</div>
            <div className="text-lg font-bold text-emerald-600">
              {descriptionAnalysis.audienceMatch && descriptionAnalysis.bookContentMatch ? 'Matched' : 'Partial'}
            </div>
          </div>
        </div>

        {/* Keyword Density Breakdown */}
        {descriptionAnalysis.keywordDensity.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Keyword Density Analysis:
            </h4>
            <div className="flex flex-wrap gap-2">
              {descriptionAnalysis.keywordDensity.map((item, idx) => (
                <span
                  key={idx}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${
                    item.isOverused
                      ? 'bg-rose-50 text-rose-800 border-rose-300 font-bold'
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {item.keyword}: <strong className="font-mono">{item.count}x ({item.densityPercent}%)</strong>
                  {item.isOverused && <span className="text-[10px] text-rose-600 font-bold ml-1">(Overused)</span>}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Policy Claims / Repetition Warnings */}
        {descriptionAnalysis.unsupportedClaims.length > 0 && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 space-y-1">
            <div className="font-semibold flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Prohibited Claims in Description:
            </div>
            {descriptionAnalysis.unsupportedClaims.map((claim, idx) => (
              <div key={idx} className="pl-5">
                • {claim}
              </div>
            ))}
          </div>
        )}

        {/* Optimize Description Action */}
        <div className="pt-2 flex items-center justify-between flex-wrap gap-3">
          <button
            id="btn-toggle-optimize-desc"
            onClick={() => setShowOptimizedDescPreview(prev => !prev)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg text-xs shadow-sm transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {showOptimizedDescPreview ? 'Hide Optimized Copy' : 'Generate Optimized Description Copy'}
          </button>
        </div>

        {/* Optimized Copy Preview Box */}
        {showOptimizedDescPreview && (
          <div className="p-4 bg-teal-50/50 border border-teal-200 rounded-xl space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-teal-900">
                <CheckCircle2 className="w-4 h-4 text-teal-600" />
                Natural Human-Readable Optimized Description
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyOptimizedDesc}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-teal-300 text-teal-800 rounded text-xs font-medium hover:bg-teal-50"
                >
                  {copiedPreview ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  Copy
                </button>

                <button
                  onClick={() => {
                    if (descriptionAnalysis.optimizedDescriptionPreview) {
                      onApplyOptimizedDescription(descriptionAnalysis.optimizedDescriptionPreview);
                      setShowOptimizedDescPreview(false);
                    }
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-teal-700 hover:bg-teal-800 text-white rounded text-xs font-semibold"
                >
                  <Save className="w-3 h-3" />
                  Apply to Description
                </button>
              </div>
            </div>

            <pre className="p-3 bg-white border border-teal-200 rounded-lg text-xs text-slate-800 whitespace-pre-wrap font-sans leading-relaxed max-h-60 overflow-y-auto">
              {descriptionAnalysis.optimizedDescriptionPreview}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

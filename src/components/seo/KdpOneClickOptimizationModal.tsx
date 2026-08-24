import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  X,
  Check,
} from 'lucide-react';
import { KdpOneClickSeoProposal } from '../../types/seo';

interface Props {
  proposal: KdpOneClickSeoProposal;
  isOpen: boolean;
  onClose: () => void;
  onApplyChanges: (decisions: {
    applyTitle: boolean;
    applySubtitle: boolean;
    applyDescription: boolean;
    applyKeywords: boolean;
    proposal: KdpOneClickSeoProposal;
  }) => void;
}

export const KdpOneClickOptimizationModal: React.FC<Props> = ({
  proposal,
  isOpen,
  onClose,
  onApplyChanges,
}) => {
  const [decisions, setDecisions] = useState({
    title: true,
    subtitle: true,
    description: true,
    keywords: true,
  });

  if (!isOpen) return null;

  const handleApplyAllAccepted = () => {
    onApplyChanges({
      applyTitle: decisions.title,
      applySubtitle: decisions.subtitle,
      applyDescription: decisions.description,
      applyKeywords: decisions.keywords,
      proposal,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-sm shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">One-Click SEO Optimization Proposal</h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  +{proposal.projectedScoreGain} pts Projected Gain
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Review proposed optimizations below. You control which changes get applied to your book.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Items */}
        <div className="p-6 overflow-y-auto space-y-5 divide-y divide-slate-100">
          {/* 1. Title Item */}
          <div className="pt-4 first:pt-0 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                1. Book Title
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDecisions(prev => ({ ...prev, title: !prev.title }))}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                    decisions.title
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                  }`}
                >
                  {decisions.title ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                  {decisions.title ? 'Apply Proposal' : 'Ignore (Keep Original)'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="text-[10px] font-semibold text-slate-400 uppercase mb-1">Current Title:</div>
                <div className="text-slate-700 font-medium">{proposal.originalTitle || '(Empty)'}</div>
              </div>

              <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg">
                <div className="text-[10px] font-semibold text-amber-700 uppercase mb-1">Proposed Title:</div>
                <div className="text-slate-900 font-bold">{proposal.proposedTitle}</div>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 italic pl-1">Rationale: {proposal.titleRationale}</p>
          </div>

          {/* 2. Subtitle Item */}
          <div className="pt-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                2. Subtitle
              </span>
              <button
                onClick={() => setDecisions(prev => ({ ...prev, subtitle: !prev.subtitle }))}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  decisions.subtitle
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                }`}
              >
                {decisions.subtitle ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                {decisions.subtitle ? 'Apply Proposal' : 'Ignore (Keep Original)'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="text-[10px] font-semibold text-slate-400 uppercase mb-1">Current Subtitle:</div>
                <div className="text-slate-700">{proposal.originalSubtitle || '(Empty)'}</div>
              </div>

              <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg">
                <div className="text-[10px] font-semibold text-amber-700 uppercase mb-1">Proposed Subtitle:</div>
                <div className="text-slate-900 font-semibold">{proposal.proposedSubtitle}</div>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 italic pl-1">Rationale: {proposal.subtitleRationale}</p>
          </div>

          {/* 3. Description Item */}
          <div className="pt-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                3. Book Description
              </span>
              <button
                onClick={() => setDecisions(prev => ({ ...prev, description: !prev.description }))}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  decisions.description
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                }`}
              >
                {decisions.description ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                {decisions.description ? 'Apply Proposal' : 'Ignore (Keep Original)'}
              </button>
            </div>

            <div className="p-3 bg-amber-50/40 border border-amber-200 rounded-lg text-xs">
              <div className="text-[10px] font-semibold text-amber-800 uppercase mb-1">
                Proposed Human-Readable Description:
              </div>
              <pre className="text-slate-800 whitespace-pre-wrap font-sans max-h-36 overflow-y-auto leading-relaxed">
                {proposal.proposedDescription}
              </pre>
            </div>
            <p className="text-[11px] text-slate-500 italic pl-1">Rationale: {proposal.descriptionRationale}</p>
          </div>

          {/* 4. 7 KDP Boxes */}
          <div className="pt-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                4. KDP 7-Keyword Boxes
              </span>
              <button
                onClick={() => setDecisions(prev => ({ ...prev, keywords: !prev.keywords }))}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  decisions.keywords
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                }`}
              >
                {decisions.keywords ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                {decisions.keywords ? 'Apply Proposal' : 'Ignore (Keep Original)'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {proposal.proposedSevenBoxes.map((phrase, i) => (
                <div key={i} className="p-2 bg-slate-50 border border-slate-200 rounded text-slate-800 flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <span className="font-medium truncate">{phrase}</span>
                  <span className="text-[10px] text-slate-400 ml-auto font-mono">{phrase.length}/50</span>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 italic pl-1">Rationale: {proposal.keywordsRationale}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Cancel
          </button>

          <button
            id="btn-apply-one-click-changes"
            onClick={handleApplyAllAccepted}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold rounded-lg text-xs shadow-md transition-all"
          >
            <Sparkles className="w-4 h-4" />
            Apply Selected Optimizations to Book
          </button>
        </div>
      </div>
    </div>
  );
};

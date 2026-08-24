import React from 'react';
import {
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Info,
  Layers,
  FileText,
  BookOpen,
  CheckCircle2,
  Sliders,
} from 'lucide-react';
import { OverallKdpSeoBreakdown, RiskLevel } from '../../types/seo';

interface Props {
  breakdown: OverallKdpSeoBreakdown;
  dataSourcesDisclosure?: string;
  isLive?: boolean;
  onOpenOneClickModal?: () => void;
}

export const KdpSeoBreakdownCard: React.FC<Props> = ({
  breakdown,
  dataSourcesDisclosure = 'Internal Studio calculated metrics & AI content analysis. Search demand and competition signals are marked Estimated.',
  isLive = false,
  onOpenOneClickModal,
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (score >= 75) return 'text-blue-700 bg-blue-50 border-blue-200';
    if (score >= 60) return 'text-amber-700 bg-amber-50 border-amber-200';
    if (score >= 40) return 'text-orange-700 bg-orange-50 border-orange-200';
    return 'text-rose-700 bg-rose-50 border-rose-200';
  };

  const getRiskBadge = (risk: RiskLevel) => {
    switch (risk) {
      case 'HIGH RISK':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
            <ShieldAlert className="w-3.5 h-3.5" /> High Risk Detected
          </span>
        );
      case 'MEDIUM RISK':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            <AlertTriangle className="w-3.5 h-3.5" /> Review Needed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <ShieldCheck className="w-3.5 h-3.5" /> Low Risk (Compliant)
          </span>
        );
    }
  };

  return (
    <div id="kdp-seo-breakdown-card" className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
      {/* Top Banner with Overall Score */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
        <div className="flex items-start gap-4">
          <div
            className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center border-2 shrink-0 ${getScoreColor(
              breakdown.overallScore
            )}`}
          >
            <span className="text-3xl font-bold leading-none">{breakdown.overallScore}</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider mt-1">/ 100</span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-slate-900">Studio KDP SEO Score</h2>
              <span className={`px-2.5 py-0.5 rounded text-xs font-semibold border ${getScoreColor(breakdown.overallScore)}`}>
                {breakdown.scoreGrade}
              </span>
              {getRiskBadge(breakdown.riskLevel)}
            </div>
            <p className="text-sm text-slate-500 max-w-xl">
              Composite index calculating keyword relevance, 7-box coverage, content alignment, title optimization, and policy safety.
            </p>
          </div>
        </div>

        {onOpenOneClickModal && (
          <button
            id="btn-one-click-optimize-banner"
            onClick={onOpenOneClickModal}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold rounded-lg shadow-sm transition-all text-sm shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            One-Click SEO Optimize
          </button>
        )}
      </div>

      {/* Sub-Score Breakdown Meters */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 text-center space-y-1">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Keyword Quality</div>
          <div className="text-lg font-bold text-slate-800">{breakdown.keywordQualityScore}%</div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
            <div className="bg-blue-600 h-full rounded-full" style={{ width: `${breakdown.keywordQualityScore}%` }} />
          </div>
        </div>

        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 text-center space-y-1">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Title Score</div>
          <div className="text-lg font-bold text-slate-800">{breakdown.titleScore}%</div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
            <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${breakdown.titleScore}%` }} />
          </div>
        </div>

        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 text-center space-y-1">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Subtitle Score</div>
          <div className="text-lg font-bold text-slate-800">{breakdown.subtitleScore}%</div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
            <div className="bg-purple-600 h-full rounded-full" style={{ width: `${breakdown.subtitleScore}%` }} />
          </div>
        </div>

        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 text-center space-y-1">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Description Score</div>
          <div className="text-lg font-bold text-slate-800">{breakdown.descriptionScore}%</div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
            <div className="bg-teal-600 h-full rounded-full" style={{ width: `${breakdown.descriptionScore}%` }} />
          </div>
        </div>

        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 text-center space-y-1">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">7-Boxes Coverage</div>
          <div className="text-lg font-bold text-slate-800">{breakdown.keywordCoverageScore}%</div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
            <div className="bg-amber-600 h-full rounded-full" style={{ width: `${breakdown.keywordCoverageScore}%` }} />
          </div>
        </div>

        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 text-center space-y-1">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Content Match</div>
          <div className="text-lg font-bold text-slate-800">{breakdown.contentMatchScore}%</div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${breakdown.contentMatchScore}%` }} />
          </div>
        </div>
      </div>

      {/* Data Source Disclosure / Integrity Bar */}
      <div className="flex items-start gap-2.5 p-3.5 bg-amber-50/70 border border-amber-200 rounded-lg text-xs text-amber-900 leading-relaxed">
        <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">Transparency & Data Source Disclosure: </span>
          {dataSourcesDisclosure}
          <span className="ml-1 text-amber-800/80 font-medium">
            (Provider: {isLive ? 'Live Verified Amazon Partner API' : 'Studio Internal AI Estimator'})
          </span>
        </div>
      </div>
    </div>
  );
};

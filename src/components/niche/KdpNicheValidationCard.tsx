import React from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sparkles,
  BookOpen,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { KdpNicheValidationResult } from '../../types/niche';

interface KdpNicheValidationCardProps {
  validation: KdpNicheValidationResult;
  niche: string;
  onCreateBook: () => void;
}

export const KdpNicheValidationCard: React.FC<KdpNicheValidationCardProps> = ({
  validation,
  niche,
  onCreateBook,
}) => {
  const isReady = validation.status === 'READY TO CREATE';

  return (
    <div
      className={`p-6 rounded-2xl border transition-all ${
        isReady
          ? 'bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/30'
          : 'bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/30'
      }`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Status & Checklist Overview */}
        <div className="space-y-4 flex-1">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isReady
                  ? 'bg-emerald-500 text-neutral-950 shadow-md shadow-emerald-500/20'
                  : 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20'
              }`}
            >
              {isReady ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Niche Validation Check
                </span>
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full font-mono ${
                    isReady
                      ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                      : 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                  }`}
                >
                  {validation.readinessScore}% Criteria Met
                </span>
              </div>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white font-display">
                {validation.status}
              </h3>
            </div>
          </div>

          <p className="text-xs text-neutral-600 dark:text-neutral-300">
            {validation.verdictRationale}
          </p>

          {/* Checklist */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {validation.checklist.map(item => (
              <div
                key={item.id}
                className="flex items-start gap-2 p-2 rounded-lg bg-white/60 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-750"
              >
                {item.passed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                )}
                <div>
                  <span className={`font-semibold ${item.passed ? 'text-neutral-800 dark:text-neutral-200' : 'text-amber-700 dark:text-amber-300'}`}>
                    {item.label}
                  </span>
                  {item.tip && <p className="text-[11px] text-neutral-400 mt-0.5">{item.tip}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Button Box */}
        <div className="flex flex-col sm:flex-row lg:flex-col items-center justify-center gap-3 shrink-0 lg:w-64 pt-2 lg:pt-0">
          <button
            onClick={onCreateBook}
            className={`w-full py-3.5 px-6 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 ${
              isReady
                ? 'bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-amber-500/20'
                : 'bg-neutral-900 dark:bg-neutral-800 hover:bg-neutral-800 text-white shadow-neutral-900/20'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>CREATE BOOK FROM NICHE</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <span className="text-[11px] text-neutral-500 dark:text-neutral-400 text-center">
            Transfers niche, audience, and keywords directly into Book Generator
          </span>
        </div>
      </div>
    </div>
  );
};

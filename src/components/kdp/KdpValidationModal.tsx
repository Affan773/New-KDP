import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  X,
  RefreshCw,
  Package,
  ArrowRight,
  Filter,
  Check,
  FileText,
  Printer,
  Sparkles,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { KDPPreflightService } from '../../services/kdpPreflightService';
import { KDPCheckCategory, KDPCheckItem } from '../../types/kdp';
import { DocumentModel, Project } from '../../types/project';

interface KdpValidationModalProps {
  project: Project;
  document?: DocumentModel | null;
  onClose: () => void;
  onOpenExport?: () => void;
}

export const KdpValidationModal: React.FC<KdpValidationModalProps> = ({
  project,
  document,
  onClose,
  onOpenExport,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [report, setReport] = useState(() => KDPPreflightService.validate(project, document));
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setReport(KDPPreflightService.validate(project, document));
      setIsRefreshing(false);
    }, 250);
  };

  const categories = ['All', 'Project', 'Metadata', 'Print', 'AI', 'Files', 'Puzzle Quality'];

  const filteredChecks = report.checks.filter(c => {
    if (selectedCategory === 'All') return true;
    return c.category === selectedCategory;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/70 backdrop-blur-sm animate-fadeIn">
      <div
        className="w-full max-w-3xl max-h-[90vh] flex flex-col bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-950/50">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                report.status === 'PASS'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                  : report.status === 'WARNING'
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                  : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
              }`}
            >
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                  KDP Preflight Compliance Inspection
                </h2>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    report.status === 'PASS'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : report.status === 'WARNING'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                  }`}
                >
                  {report.status === 'PASS'
                    ? 'READY TO PUBLISH'
                    : report.status === 'WARNING'
                    ? 'READY WITH WARNINGS'
                    : 'VALIDATION FAILED'}
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Auditing "{project.name}" against Amazon KDP Print guidelines & mechanical tolerances.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              className={`p-2 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-all ${
                isRefreshing ? 'animate-spin' : ''
              }`}
              title="Re-run Checks"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status Metrics Bar */}
        <div className="grid grid-cols-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-center">
          <div className="p-3 border-r border-neutral-200 dark:border-neutral-800">
            <span className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase">
              Passed Checks
            </span>
            <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
              {report.summary.passed}
            </div>
          </div>
          <div className="p-3 border-r border-neutral-200 dark:border-neutral-800">
            <span className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase">
              Warnings
            </span>
            <div className="text-xl font-extrabold text-amber-600 dark:text-amber-400 font-mono mt-0.5">
              {report.summary.warnings}
            </div>
          </div>
          <div className="p-3">
            <span className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase">
              Blocking Errors
            </span>
            <div className="text-xl font-extrabold text-red-600 dark:text-red-400 font-mono mt-0.5">
              {report.summary.errors}
            </div>
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="px-6 py-2.5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/30 flex items-center gap-1.5 overflow-x-auto">
          <span className="text-[11px] font-bold text-neutral-400 flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3" />
            <span>Domain:</span>
          </span>
          {categories.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                  : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Check Items List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {filteredChecks.map(check => (
            <div
              key={check.id}
              className={`p-4 rounded-2xl border transition-all ${
                check.status === 'FAIL'
                  ? 'bg-red-50/40 dark:bg-red-950/20 border-red-200 dark:border-red-900/40'
                  : check.status === 'WARNING'
                  ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40'
                  : 'bg-neutral-50/50 dark:bg-neutral-800/30 border-neutral-200/80 dark:border-neutral-700/50'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      check.status === 'FAIL'
                        ? 'bg-red-500 text-white'
                        : check.status === 'WARNING'
                        ? 'bg-amber-500 text-white'
                        : 'bg-emerald-500 text-white'
                    }`}
                  >
                    {check.status === 'FAIL' ? (
                      <X className="w-3.5 h-3.5" />
                    ) : check.status === 'WARNING' ? (
                      <span className="text-xs font-bold font-mono">!</span>
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-neutral-900 dark:text-white">
                        [{check.category}] {check.name}
                      </span>
                      <span
                        className={`text-[10px] font-mono font-bold uppercase px-1.5 py-0.2 rounded ${
                          check.status === 'FAIL'
                            ? 'text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/40'
                            : check.status === 'WARNING'
                            ? 'text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40'
                            : 'text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/40'
                        }`}
                      >
                        {check.status}
                      </span>
                    </div>

                    <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-1 leading-relaxed">
                      {check.message}
                    </p>

                    {check.fixAction && (
                      <div className="mt-2 text-[11px] font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                        <span>Fix recommendation:</span>
                        <span className="font-normal text-neutral-700 dark:text-neutral-300">
                          {check.fixAction}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-950/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-neutral-500 dark:text-neutral-400">
            {report.status === 'FAIL' ? (
              <span className="text-red-600 dark:text-red-400 font-semibold">
                Export blocked until all {report.errors.length} error(s) are resolved.
              </span>
            ) : (
              <span>Ready for KDP Package bundling & verification export.</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all"
            >
              Close
            </button>

            {onOpenExport && (
              <button
                type="button"
                disabled={report.status === 'FAIL'}
                onClick={onOpenExport}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-neutral-950 text-xs font-bold shadow-md shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-1.5"
              >
                <Package className="w-3.5 h-3.5" />
                <span>Continue to Export Package</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  ShieldCheck,
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle2,
  Wrench,
  ChevronRight,
  ExternalLink,
  RefreshCw,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useEditor } from '../../context/EditorContext';
import {
  BookValidationService,
  ValidationCategory,
  ValidationIssue,
  ValidationReport,
  ValidationSeverity,
} from '../../services/bookValidationService';

interface BookPreflightModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToElement?: (pageIndex: number, elementId?: string) => void;
}

export const BookPreflightModal: React.FC<BookPreflightModalProps> = ({
  isOpen,
  onClose,
  onNavigateToElement,
}) => {
  const { activeProject, updateProject, showToast } = useApp();
  const { document, updateDocument, selectPage, selectElement } = useEditor();

  const [selectedCategory, setSelectedCategory] = useState<ValidationCategory | 'all'>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<ValidationSeverity | 'all'>('all');

  if (!isOpen || !activeProject) return null;

  const report: ValidationReport = BookValidationService.validateBook(activeProject, document);

  const filteredIssues = report.issues.filter(issue => {
    if (selectedCategory !== 'all' && issue.category !== selectedCategory) return false;
    if (selectedSeverity !== 'all' && issue.severity !== selectedSeverity) return false;
    return true;
  });

  const handleApplyFix = (issue: ValidationIssue) => {
    if (!issue.autoFixAction) return;

    try {
      const fixed = BookValidationService.applyAutoFix(issue.autoFixAction, activeProject, document);
      updateProject(fixed.project);
      if (fixed.document) {
        updateDocument(fixed.document, true);
      }
      showToast({
        type: 'success',
        message: `Applied fix: "${issue.title}"`,
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        message: `Could not apply fix: ${err?.message || 'Unknown error'}`,
      });
    }
  };

  const handleJumpToIssue = (issue: ValidationIssue) => {
    if (issue.pageIndex !== undefined && issue.pageIndex >= 0) {
      selectPage(issue.pageIndex);
      if (issue.elementId) {
        selectElement(issue.elementId);
      }
      onClose();
      showToast({
        type: 'info',
        message: `Navigated to Page ${issue.pageNumber || issue.pageIndex + 1}`,
      });
    }
  };

  const getSeverityBadge = (severity: ValidationSeverity) => {
    switch (severity) {
      case 'error':
        return (
          <span className="px-2 py-0.5 rounded-md bg-red-500/10 text-red-600 dark:text-red-400 font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            ERROR
          </span>
        );
      case 'warning':
        return (
          <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            WARNING
          </span>
        );
      case 'info':
      default:
        return (
          <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
            <Info className="w-3 h-3" />
            INFO
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div onClick={onClose} className="fixed inset-0 bg-neutral-950/80 backdrop-blur-xs" />

      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }}
        className="relative w-full max-w-4xl bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-2xl ${
                report.overallStatus === 'READY'
                  ? 'bg-emerald-500/10 text-emerald-500'
                  : report.overallStatus === 'READY_WITH_WARNINGS'
                  ? 'bg-amber-500/10 text-amber-500'
                  : 'bg-red-500/10 text-red-500'
              }`}
            >
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-neutral-900 dark:text-white font-display">
                  Amazon KDP Preflight Quality Inspector
                </h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono tracking-wide ${
                    report.overallStatus === 'READY'
                      ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                      : report.overallStatus === 'READY_WITH_WARNINGS'
                      ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                      : 'bg-red-500/20 text-red-700 dark:text-red-300'
                  }`}
                >
                  {report.overallStatus.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                {activeProject.name} • {document?.pages.length || activeProject.pageCount} Pages •{' '}
                {activeProject.kdpSettings.trimSize.name} ({activeProject.kdpSettings.bleed})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Summary Banner */}
        <div
          className={`px-6 py-3.5 border-b flex flex-wrap items-center justify-between gap-3 text-xs ${
            report.overallStatus === 'READY'
              ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-800 dark:text-emerald-200'
              : report.overallStatus === 'READY_WITH_WARNINGS'
              ? 'bg-amber-500/5 border-amber-500/20 text-amber-800 dark:text-amber-200'
              : 'bg-red-500/5 border-red-500/20 text-red-800 dark:text-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {report.overallStatus === 'READY' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : report.overallStatus === 'READY_WITH_WARNINGS' ? (
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
            )}
            <span className="font-semibold">{report.statusText}</span>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-4 text-xs font-mono font-bold">
            <span className="text-emerald-600 dark:text-emerald-400">
              PASSED: {report.passedCount}
            </span>
            <span className="text-amber-600 dark:text-amber-400">
              WARNINGS: {report.warningsCount}
            </span>
            <span className="text-red-600 dark:text-red-400">
              ERRORS: {report.errorsCount}
            </span>
          </div>
        </div>

        {/* Filter Navigation Tabs */}
        <div className="px-6 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between overflow-x-auto bg-neutral-50/50 dark:bg-neutral-900/50 text-xs font-semibold py-2">
          {/* Category Filters */}
          <div className="flex items-center gap-1">
            {[
              { id: 'all', label: 'All Domains' },
              { id: 'document', label: 'Document & Trim' },
              { id: 'layout', label: 'Layout & Margins' },
              { id: 'typography', label: 'Typography' },
              { id: 'puzzles', label: 'Puzzle Integrity' },
              { id: 'book', label: 'Structure & TOC' },
            ].map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id as any)}
                className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 font-bold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Severity Filters */}
          <div className="flex items-center gap-1 pl-4 border-l border-neutral-200 dark:border-neutral-800">
            {[
              { id: 'all', label: 'All Severities' },
              { id: 'error', label: `Errors (${report.errorsCount})` },
              { id: 'warning', label: `Warnings (${report.warningsCount})` },
            ].map(sev => (
              <button
                key={sev.id}
                type="button"
                onClick={() => setSelectedSeverity(sev.id as any)}
                className={`px-2.5 py-1 rounded-lg text-[11px] transition-all ${
                  selectedSeverity === sev.id
                    ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                {sev.label}
              </button>
            ))}
          </div>
        </div>

        {/* Issue List Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3">
          {filteredIssues.length === 0 ? (
            <div className="py-12 px-4 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-sm text-neutral-900 dark:text-white">
                No issues detected in this domain!
              </h4>
              <p className="text-xs text-neutral-500 max-w-md mx-auto">
                All inspected checks for trim bounds, safe margins, typography legibility, puzzle uniqueness, and book structure passed cleanly.
              </p>
            </div>
          ) : (
            filteredIssues.map(issue => (
              <div
                key={issue.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  issue.severity === 'error'
                    ? 'border-red-500/30 bg-red-500/5 hover:border-red-500/50'
                    : issue.severity === 'warning'
                    ? 'border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50'
                    : 'border-blue-500/30 bg-blue-500/5 hover:border-blue-500/50'
                }`}
              >
                <div className="flex items-start gap-3 flex-1">
                  <div className="mt-0.5">{getSeverityBadge(issue.severity)}</div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-neutral-900 dark:text-white font-sans">
                        {issue.title}
                      </h4>
                      {issue.pageNumber !== undefined && (
                        <span className="px-1.5 py-0.5 rounded-md bg-neutral-200 dark:bg-neutral-800 text-[10px] font-mono font-bold text-neutral-700 dark:text-neutral-300">
                          Page {issue.pageNumber}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                      {issue.message}
                    </p>
                    {issue.fixSuggestion && (
                      <p className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
                        💡 Suggestion: {issue.fixSuggestion}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions: Jump to Element or Auto-Fix */}
                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  {issue.canAutoFix && issue.autoFixAction && (
                    <button
                      type="button"
                      onClick={() => handleApplyFix(issue)}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      <span>Fix Automatically</span>
                    </button>
                  )}

                  {issue.pageIndex !== undefined && (
                    <button
                      type="button"
                      onClick={() => handleJumpToIssue(issue)}
                      className="px-3 py-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1"
                    >
                      <span>Jump to Page</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-900/50">
          <div className="text-[11px] text-neutral-400">
            Standard checks: Trim Size • Safety Zone (0.375") • Gutter Depth • Font Bounds • Puzzle Seeds
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-neutral-900 dark:bg-neutral-100 hover:bg-neutral-800 text-white dark:text-neutral-900 font-bold text-xs transition-all"
            >
              Close Inspector
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

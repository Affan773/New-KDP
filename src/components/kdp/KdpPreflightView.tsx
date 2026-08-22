import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  BookOpen,
  Package,
  RefreshCw,
  Sliders,
  Filter,
  Check,
  X,
  Layers,
  Printer,
  Sparkles,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useOptionalEditor } from '../../context/EditorContext';
import { KDPPreflightService } from '../../services/kdpPreflightService';
import { Project } from '../../types/project';
import { KdpExportModal } from './KdpExportModal';
import { KdpProjectTab } from './KdpProjectTab';

export const KdpPreflightView: React.FC = () => {
  const { projects, activeProject, openProjectInEditor, updateProject, setCurrentRoute } = useApp();
  const editorContext = useOptionalEditor();
  const currentDoc = editorContext?.document || null;

  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    activeProject?.id || (projects.length > 0 ? projects[0].id : '')
  );
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'audit' | 'settings'>('audit');

  const currentProject = projects.find(p => p.id === selectedProjectId) || activeProject || projects[0];

  const report = currentProject
    ? KDPPreflightService.validate(
        currentProject,
        currentProject.id === activeProject?.id ? currentDoc : null
      )
    : null;

  const categories = ['All', 'Project', 'Metadata', 'Print', 'AI', 'Files', 'Puzzle Quality'];

  const filteredChecks = report
    ? report.checks.filter(c => {
        if (selectedCategory === 'All') return true;
        return c.category === selectedCategory;
      })
    : [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>KDP Publishing Safety Gate</span>
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white font-display">
            Automated KDP Pre-Flight Inspector
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Validates manuscript margins, spine calculations, page limits, AI disclosure, and metadata before KDP upload.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Project Selector Dropdown */}
          <div className="flex items-center gap-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-1.5 shadow-sm">
            <BookOpen className="w-4 h-4 text-amber-500 shrink-0" />
            <select
              value={selectedProjectId}
              onChange={e => setSelectedProjectId(e.target.value)}
              className="bg-transparent text-xs font-bold text-neutral-800 dark:text-neutral-200 focus:outline-none max-w-[200px] truncate"
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.pageCount || 24}p)
                </option>
              ))}
            </select>
          </div>

          {currentProject && (
            <>
              <button
                type="button"
                onClick={() => openProjectInEditor(currentProject.id)}
                className="px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Open in Canvas Editor</span>
              </button>

              <button
                type="button"
                onClick={() => setIsExportModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold shadow-md shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-1.5"
              >
                <Package className="w-3.5 h-3.5" />
                <span>Export KDP Package</span>
              </button>
            </>
          )}
        </div>
      </div>

      {!currentProject ? (
        <div className="p-12 text-center rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <BookOpen className="w-12 h-12 text-neutral-400 mx-auto mb-3 opacity-50" />
          <h3 className="text-base font-bold text-neutral-900 dark:text-white">No Projects Available</h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Create a new book project to run automated KDP preflight validation.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Main Status & Metrics Card */}
          {report && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Overall Status Banner (5 cols) */}
              <div
                className={`md:col-span-5 p-6 rounded-3xl border flex flex-col justify-between shadow-sm ${
                  report.status === 'PASS'
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 text-emerald-950 dark:text-emerald-200'
                    : report.status === 'WARNING'
                    ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40 text-amber-950 dark:text-amber-200'
                    : 'bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900/40 text-red-950 dark:text-red-200'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className={`w-3 h-3 rounded-full ${
                        report.status === 'PASS'
                          ? 'bg-emerald-500'
                          : report.status === 'WARNING'
                          ? 'bg-amber-500'
                          : 'bg-red-500'
                      }`}
                    />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider opacity-80">
                      Overall Preflight Verdict
                    </span>
                  </div>

                  <h2 className="text-xl font-extrabold font-display">
                    {report.status === 'PASS'
                      ? 'KDP Print Ready'
                      : report.status === 'WARNING'
                      ? 'Ready with Warnings'
                      : 'Validation Failed'}
                  </h2>

                  <p className="text-xs mt-2 leading-relaxed opacity-90">
                    {report.status === 'PASS'
                      ? 'All mechanical margin bounds, page limits, AI disclosure, and file structures meet Amazon KDP requirements.'
                      : report.status === 'WARNING'
                      ? `${report.warnings.length} warning(s) detected. You can proceed with export, but we recommend reviewing before publishing.`
                      : `${report.errors.length} blocking error(s) must be resolved before this book can be published to Amazon KDP.`}
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-current/10 flex items-center justify-between">
                  <span className="text-[11px] font-mono opacity-80">
                    Audited: {new Date(report.timestamp).toLocaleTimeString()}
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveTab(activeTab === 'audit' ? 'settings' : 'audit')}
                    className="text-xs font-bold underline flex items-center gap-1"
                  >
                    <span>{activeTab === 'audit' ? 'Edit KDP Settings' : 'Back to Audit'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Metrics Breakdown (7 cols) */}
              <div className="md:col-span-7 grid grid-cols-3 gap-4">
                <div className="p-5 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col justify-between">
                  <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase">
                    Passed Checks
                  </span>
                  <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono my-2">
                    {report.summary.passed}
                  </div>
                  <span className="text-[11px] text-neutral-400">Mechanical & policy</span>
                </div>

                <div className="p-5 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col justify-between">
                  <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase">
                    Warnings
                  </span>
                  <div className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 font-mono my-2">
                    {report.summary.warnings}
                  </div>
                  <span className="text-[11px] text-neutral-400">Non-blocking notices</span>
                </div>

                <div className="p-5 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col justify-between">
                  <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase">
                    Blocking Errors
                  </span>
                  <div className="text-3xl font-extrabold text-red-600 dark:text-red-400 font-mono my-2">
                    {report.summary.errors}
                  </div>
                  <span className="text-[11px] text-neutral-400">Must fix to export</span>
                </div>
              </div>
            </div>
          )}

          {/* Tab Selection */}
          <div className="flex border-b border-neutral-200 dark:border-neutral-800 gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('audit')}
              className={`px-4 py-2.5 rounded-t-2xl font-bold text-xs transition-all ${
                activeTab === 'audit'
                  ? 'bg-white dark:bg-neutral-900 text-amber-600 dark:text-amber-400 border-t-2 border-amber-500 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              Preflight Audit Checks ({report?.checks.length || 0})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2.5 rounded-t-2xl font-bold text-xs transition-all ${
                activeTab === 'settings'
                  ? 'bg-white dark:bg-neutral-900 text-amber-600 dark:text-amber-400 border-t-2 border-amber-500 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              Project KDP Publishing Configuration
            </button>
          </div>

          {/* VIEW TAB 1: AUDIT CHECKS */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              {/* Filter Chips */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <span className="text-xs font-bold text-neutral-400 flex items-center gap-1 mr-1">
                  <Filter className="w-3.5 h-3.5" />
                  <span>Category:</span>
                </span>
                {categories.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                      selectedCategory === cat
                        ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-sm'
                        : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Check Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredChecks.map(check => (
                  <div
                    key={check.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      check.status === 'FAIL'
                        ? 'bg-red-50/40 dark:bg-red-950/20 border-red-200 dark:border-red-900/40'
                        : check.status === 'WARNING'
                        ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40'
                        : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 shadow-sm'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                          check.status === 'FAIL'
                            ? 'bg-red-500 text-white'
                            : check.status === 'WARNING'
                            ? 'bg-amber-500 text-white'
                            : 'bg-emerald-500 text-white'
                        }`}
                      >
                        {check.status === 'FAIL' ? (
                          <X className="w-4 h-4" />
                        ) : check.status === 'WARNING' ? (
                          <span className="text-xs font-bold font-mono">!</span>
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-neutral-900 dark:text-white">
                            [{check.category}] {check.name}
                          </span>
                          <span
                            className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
                              check.status === 'FAIL'
                                ? 'text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-950/60'
                                : check.status === 'WARNING'
                                ? 'text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60'
                                : 'text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60'
                            }`}
                          >
                            {check.status}
                          </span>
                        </div>

                        <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-1.5 leading-relaxed">
                          {check.message}
                        </p>

                        {check.fixAction && (
                          <div className="mt-2.5 p-2 rounded-xl bg-neutral-100/70 dark:bg-neutral-800/60 text-[11px] text-neutral-700 dark:text-neutral-300 flex items-start gap-1.5">
                            <span className="font-bold text-amber-600 dark:text-amber-400 shrink-0">
                              Recommendation:
                            </span>
                            <span>{check.fixAction}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW TAB 2: KDP SETTINGS */}
          {activeTab === 'settings' && (
            <div className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
              <KdpProjectTab
                project={currentProject}
                onUpdateProject={updated => updateProject(updated)}
              />
            </div>
          )}
        </div>
      )}

      {/* EXPORT MODAL */}
      {isExportModalOpen && currentProject && (
        <KdpExportModal
          project={currentProject}
          document={currentProject.id === activeProject?.id ? currentDoc : null}
          onClose={() => setIsExportModalOpen(false)}
        />
      )}
    </div>
  );
};

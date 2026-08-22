import React, { useState } from 'react';
import {
  BarChart3,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Package,
  ShieldCheck,
  Sparkles,
  Sliders,
  Printer,
  Download,
  Filter,
  Search,
  ExternalLink,
  Layers,
  FileText,
  Lock,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StorageService } from '../../services/storageService';
import { Project } from '../../types/project';
import { KdpExportModal } from '../kdp/KdpExportModal';
import { KdpValidationModal } from '../kdp/KdpValidationModal';

export const KdpAdminView: React.FC = () => {
  const { projects, openProjectInEditor, setCurrentRoute } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedType, setSelectedType] = useState<string>('All');

  const [inspectingProject, setInspectingProject] = useState<Project | null>(null);
  const [exportingProject, setExportingProject] = useState<Project | null>(null);

  const analytics = StorageService.getKdpPublishingAnalytics();

  const filteredProjects = projects.filter(p => {
    const title = p.kdpConfig?.title || p.name;
    const author = p.kdpConfig?.authorName || p.metadata?.author || '';
    const matchesSearch =
      title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      author.toLowerCase().includes(searchQuery.toLowerCase());

    const pStatus = p.kdpConfig?.publicationStatus || 'DRAFT';
    const matchesStatus =
      selectedStatus === 'All'
        ? true
        : selectedStatus === 'READY'
        ? pStatus === 'KDP_READY'
        : selectedStatus === 'WARNINGS'
        ? pStatus === 'READY_WITH_WARNINGS'
        : selectedStatus === 'FAILED'
        ? pStatus === 'VALIDATION_FAILED'
        : selectedStatus === 'EXPORTED'
        ? pStatus === 'EXPORTED'
        : true;

    const bType = p.kdpConfig?.bookType || p.type;
    const matchesType = selectedType === 'All' ? true : bType === selectedType;

    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 mb-2">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>KDP Publishing Foundation</span>
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white font-display">
            Publishing Analytics & Catalog Management
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Studio-wide compliance auditing, AI content disclosure tracking, and KDP print packaging metrics.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCurrentRoute('kdp-checker')}
          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold shadow-md shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-1.5"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Launch Pre-Flight Inspector</span>
        </button>
      </div>

      {/* Top 5 Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Metric 1 */}
        <div className="p-5 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-neutral-500 dark:text-neutral-400">
            <span>Total Projects</span>
            <BookOpen className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white font-mono">
            {analytics.totalProjects}
          </div>
          <span className="text-[11px] text-neutral-400">In Studio Database</span>
        </div>

        {/* Metric 2 */}
        <div className="p-5 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-neutral-500 dark:text-neutral-400">
            <span>KDP Ready</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
            {analytics.kdpReady}
          </div>
          <span className="text-[11px] text-neutral-400">0 Errors & 0 Warnings</span>
        </div>

        {/* Metric 3 */}
        <div className="p-5 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-neutral-500 dark:text-neutral-400">
            <span>Has Warnings</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400 font-mono">
            {analytics.warnings}
          </div>
          <span className="text-[11px] text-neutral-400">Review Recommended</span>
        </div>

        {/* Metric 4 */}
        <div className="p-5 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-neutral-500 dark:text-neutral-400">
            <span>Validation Blocked</span>
            <XCircle className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-red-600 dark:text-red-400 font-mono">
            {analytics.failures}
          </div>
          <span className="text-[11px] text-neutral-400">Has Blocking Errors</span>
        </div>

        {/* Metric 5 */}
        <div className="p-5 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-2 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-xs font-bold text-neutral-500 dark:text-neutral-400">
            <span>Exported Packages</span>
            <Package className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">
            {analytics.exported}
          </div>
          <span className="text-[11px] text-neutral-400">Ready for Amazon Upload</span>
        </div>
      </div>

      {/* Distribution Visualizers (2 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Book Type Breakdown */}
        <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
              Catalog by Book Type
            </h3>
            <span className="text-xs text-neutral-400 font-mono">
              {analytics.totalProjects} Total
            </span>
          </div>

          <div className="space-y-3">
            {Object.entries(analytics.byBookType).map(([type, count]) => {
              const pct = analytics.totalProjects > 0 ? Math.round((count / analytics.totalProjects) * 100) : 0;
              return (
                <div key={type} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-neutral-700 dark:text-neutral-300">{type}</span>
                    <span className="text-neutral-500 dark:text-neutral-400 font-mono">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Disclosure Breakdown */}
        <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
              AI Content Disclosure Breakdown
            </h3>
            <span className="text-xs text-neutral-400 font-mono">KDP Mandate</span>
          </div>

          <div className="space-y-3">
            {Object.entries(analytics.byAiContent).map(([type, count]) => {
              const pct = analytics.totalProjects > 0 ? Math.round((count / analytics.totalProjects) * 100) : 0;
              const color =
                type === 'AI-generated'
                  ? 'bg-purple-500'
                  : type === 'AI-assisted'
                  ? 'bg-blue-500'
                  : 'bg-emerald-500';
              return (
                <div key={type} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-neutral-700 dark:text-neutral-300">{type}</span>
                    <span className="text-neutral-500 dark:text-neutral-400 font-mono">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                    <div
                      className={`h-full ${color} rounded-full transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Catalog Table */}
      <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
            KDP Publishing Project Inventory ({filteredProjects.length})
          </h3>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search title or author..."
                className="pl-8 pr-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs font-semibold focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="READY">KDP Ready</option>
              <option value="WARNINGS">Warnings</option>
              <option value="FAILED">Blocked</option>
              <option value="EXPORTED">Exported</option>
            </select>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-400 font-mono text-[11px] uppercase">
                <th className="pb-3 font-semibold">Book Title & Author</th>
                <th className="pb-3 font-semibold">Type & Format</th>
                <th className="pb-3 font-semibold">Trim & Pages</th>
                <th className="pb-3 font-semibold">AI Disclosure</th>
                <th className="pb-3 font-semibold">KDP Status</th>
                <th className="pb-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {filteredProjects.map(proj => {
                const cfg = proj.kdpConfig;
                const title = cfg?.title || proj.name;
                const author = cfg?.authorName || proj.metadata?.author || 'Creator';
                const status = cfg?.publicationStatus || 'DRAFT';

                return (
                  <tr key={proj.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors">
                    <td className="py-3.5 pr-4">
                      <div className="font-bold text-neutral-900 dark:text-white max-w-[220px] truncate">
                        {title}
                      </div>
                      <div className="text-[11px] text-neutral-400">{author}</div>
                    </td>

                    <td className="py-3.5 pr-4">
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                        {cfg?.bookType || proj.type}
                      </span>
                      <div className="text-[11px] text-neutral-400">{cfg?.format || 'Paperback'}</div>
                    </td>

                    <td className="py-3.5 pr-4 font-mono text-neutral-700 dark:text-neutral-300">
                      <div>{cfg?.trimSize || '8.5" × 11"'}</div>
                      <div className="text-[11px] text-neutral-400">
                        {proj.pageCount || 24} pages
                      </div>
                    </td>

                    <td className="py-3.5 pr-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
                        {cfg?.aiContentType || 'AI-generated'}
                      </span>
                    </td>

                    <td className="py-3.5 pr-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                          status === 'KDP_READY'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : status === 'READY_WITH_WARNINGS'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : status === 'VALIDATION_FAILED'
                            ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                            : status === 'EXPORTED'
                            ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                            : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                        }`}
                      >
                        {status === 'KDP_READY'
                          ? 'KDP READY'
                          : status === 'READY_WITH_WARNINGS'
                          ? 'WARNINGS'
                          : status === 'VALIDATION_FAILED'
                          ? 'FAILED'
                          : status === 'EXPORTED'
                          ? 'EXPORTED'
                          : 'DRAFT'}
                      </span>
                    </td>

                    <td className="py-3.5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setInspectingProject(proj)}
                          className="px-2.5 py-1 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-[11px] font-bold transition-colors"
                          title="Run Preflight Inspection"
                        >
                          Inspect
                        </button>
                        <button
                          type="button"
                          onClick={() => setExportingProject(proj)}
                          className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 text-[11px] font-bold shadow-sm transition-all"
                          title="Export KDP Package"
                        >
                          Export
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODALS */}
      {inspectingProject && (
        <KdpValidationModal
          project={inspectingProject}
          onClose={() => setInspectingProject(null)}
          onOpenExport={() => {
            const p = inspectingProject;
            setInspectingProject(null);
            setExportingProject(p);
          }}
        />
      )}

      {exportingProject && (
        <KdpExportModal
          project={exportingProject}
          onClose={() => setExportingProject(null)}
        />
      )}
    </div>
  );
};

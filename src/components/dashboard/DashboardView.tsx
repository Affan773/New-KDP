import React from 'react';
import { motion } from 'motion/react';
import {
  PlusCircle,
  Grid3X3,
  Palette,
  BookOpen,
  FileUp,
  LayoutTemplate,
  FolderKanban,
  Clock,
  Sparkles,
  ArrowRight,
  HardDrive,
  CheckCircle2,
  MoreVertical,
  Edit,
  Copy,
  Trash2,
  Star,
  ExternalLink,
  BookMarked,
  ShieldCheck,
  Package,
  Search,
} from 'lucide-react';
import { DEMO_TEMPLATES } from '../../constants/templates';
import { useApp } from '../../context/AppContext';
import { StorageService } from '../../services/storageService';
import { Project, ProjectType } from '../../types';
import { GoogleSyncBadge } from '../google/GoogleSyncBadge';

export const DashboardView: React.FC = () => {
  const {
    projects,
    settings,
    setCurrentRoute,
    setIsNewBookWizardOpen,
    quickCreateBook,
    openProjectInEditor,
    duplicateProject,
    showConfirmDialog,
    deleteProject,
    toggleFavoriteProject,
    createProjectFromTemplate,
    showToast,
  } = useApp();

  const metrics = StorageService.getStorageMetrics();
  const recentProjects = [...projects].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  ).slice(0, 4);

  const draftProjects = projects.filter(p => p.status === 'Draft');

  const handleImportPdfClick = () => {
    showToast({
      type: 'info',
      title: 'PDF Import Pipeline',
      message: 'PDF rasterization & interior merging engine is ready for Phase 2 integration.',
    });
  };

  const handleDeleteClick = (project: Project) => {
    const hasLinkedGoogleDoc = Boolean(project.googleIntegration?.googleDocumentId);
    const deleteDocBehavior = settings.googleDocsSync?.deleteBehavior !== 'keep_linked';

    if (hasLinkedGoogleDoc && deleteDocBehavior) {
      showConfirmDialog({
        title: 'DELETE PROJECT & LINKED GOOGLE DOC?',
        message: `This will permanently remove:
• KDP Studio Project: "${project.name}"
• Linked Google Doc: "KDP — ${project.name}" (ID: ${project.googleIntegration?.googleDocumentId})

This action cannot be undone.`,
        confirmLabel: 'DELETE PROJECT + GOOGLE DOC',
        isDestructive: true,
        onConfirm: () => deleteProject(project.id),
      });
    } else {
      showConfirmDialog({
        title: 'DELETE PROJECT?',
        message: `Are you sure you want to permanently delete "${project.name}"? This action cannot be undone.`,
        confirmLabel: 'DELETE PROJECT',
        isDestructive: true,
        onConfirm: () => deleteProject(project.id),
      });
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Welcome Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-neutral-900 via-neutral-900 to-neutral-800 border border-neutral-200 dark:border-neutral-800 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Studio Workspace</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display">
              Welcome back, {settings.profile.name}
            </h1>
            <p className="text-neutral-400 text-sm mt-2 leading-relaxed">
              Design, format, and generate print-ready Amazon KDP puzzle interiors, coloring books, and planners.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsNewBookWizardOpen(true)}
              className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-sm transition-all shadow-lg shadow-amber-500/20 active:scale-95 flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create New Book</span>
            </button>

            <button
              onClick={() => setCurrentRoute('puzzles')}
              className="px-5 py-3 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-sm transition-all border border-neutral-700 active:scale-95 flex items-center gap-2"
            >
              <Grid3X3 className="w-4 h-4 text-amber-400" />
              <span>Puzzle Center</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-3">
          Quick Launch
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {[
            {
              label: 'New Book',
              icon: <PlusCircle className="w-5 h-5 text-amber-500" />,
              action: () => setIsNewBookWizardOpen(true),
              badge: 'Wizard',
            },
            {
              label: 'New Puzzle',
              icon: <Grid3X3 className="w-5 h-5 text-blue-500" />,
              action: () => quickCreateBook('Puzzle Book'),
            },
            {
              label: 'Coloring Book',
              icon: <Palette className="w-5 h-5 text-pink-500" />,
              action: () => quickCreateBook('Coloring Book'),
            },
            {
              label: 'Daily Journal',
              icon: <BookOpen className="w-5 h-5 text-emerald-500" />,
              action: () => quickCreateBook('Journal'),
            },
            {
              label: 'Import PDF',
              icon: <FileUp className="w-5 h-5 text-indigo-500" />,
              action: handleImportPdfClick,
              badge: 'Phase 2',
            },
            {
              label: 'KDP SEO Engine',
              icon: <Search className="w-5 h-5 text-emerald-500" />,
              action: () => setCurrentRoute('kdp-seo'),
              badge: 'Phase 9',
            },
            {
              label: 'Templates',
              icon: <LayoutTemplate className="w-5 h-5 text-amber-500" />,
              action: () => setCurrentRoute('templates'),
            },
          ].map((action, idx) => (
            <button
              key={idx}
              onClick={action.action}
              className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-amber-500/40 hover:shadow-md transition-all text-left group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 group-hover:scale-105 transition-transform">
                  {action.icon}
                </div>
                {action.badge && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400">
                    {action.badge}
                  </span>
                )}
              </div>
              <span className="text-xs font-bold text-neutral-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                {action.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Recent Projects + Side Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Recent Projects */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderKanban className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                Recent Projects
              </h2>
            </div>
            <button
              onClick={() => setCurrentRoute('projects')}
              className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
            >
              <span>View All ({projects.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {recentProjects.map(project => (
              <div
                key={project.id}
                className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all flex flex-col justify-between group"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      onClick={() => openProjectInEditor(project.id)}
                      className="w-12 h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 overflow-hidden border border-neutral-200 dark:border-neutral-700 cursor-pointer flex items-center justify-center shrink-0"
                    >
                      {project.thumbnail ? (
                        <img
                          src={project.thumbnail}
                          alt={project.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <BookOpen className="w-5 h-5 text-neutral-400" />
                      )}
                    </div>
                    <div>
                      <h3
                        onClick={() => openProjectInEditor(project.id)}
                        className="text-sm font-bold text-neutral-900 dark:text-white hover:text-amber-600 dark:hover:text-amber-400 cursor-pointer transition-colors line-clamp-1"
                      >
                        {project.name}
                      </h3>
                      <div className="text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center gap-2 mt-0.5">
                        <span>{project.type}</span>
                        <span>•</span>
                        <span>{project.kdpSettings.trimSize.name}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <GoogleSyncBadge project={project} compact />
                    <button
                      onClick={() => toggleFavoriteProject(project.id)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        project.isFavorite
                          ? 'text-amber-500 bg-amber-500/10'
                          : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'
                      }`}
                      title={project.isFavorite ? 'Remove Favorite' : 'Favorite'}
                    >
                      <Star className="w-4 h-4 fill-current" />
                    </button>
                  </div>
                </div>

                <div className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 mb-4 leading-relaxed">
                  {project.description}
                </div>

                <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-mono text-[11px] text-neutral-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => duplicateProject(project.id)}
                      className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
                      title="Duplicate"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(project)}
                      className="p-1 text-neutral-400 hover:text-rose-600 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => openProjectInEditor(project.id)}
                      className="px-3 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-950 font-semibold text-xs transition-colors"
                    >
                      Open
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Col: Storage & Activity */}
        <div className="space-y-6">
          {/* Storage Metric Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <HardDrive className="w-5 h-5 text-emerald-500" />
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                  Local Persistence
                </h3>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                ACTIVE
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-neutral-500 dark:text-neutral-400">
                <span>Used Storage</span>
                <span className="font-mono">
                  {(metrics.usedBytes / 1024).toFixed(1)} KB / 15 MB
                </span>
              </div>
              <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all"
                  style={{
                    width: `${Math.max(4, (metrics.usedBytes / metrics.maxBytes) * 100)}%`,
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800 text-center">
              <div className="p-2 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
                <div className="text-base font-bold font-mono text-neutral-900 dark:text-white">
                  {metrics.projectsCount}
                </div>
                <div className="text-[10px] text-neutral-500">Books</div>
              </div>
              <div className="p-2 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
                <div className="text-base font-bold font-mono text-neutral-900 dark:text-white">
                  {metrics.pagesCount}
                </div>
                <div className="text-[10px] text-neutral-500">Pages</div>
              </div>
              <div className="p-2 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
                <div className="text-base font-bold font-mono text-neutral-900 dark:text-white">
                  {metrics.assetsCount}
                </div>
                <div className="text-[10px] text-neutral-500">Assets</div>
              </div>
            </div>
          </div>

          {/* KDP Publishing Compliance Card */}
          {(() => {
            const kdpAnalytics = StorageService.getKdpPublishingAnalytics();
            return (
              <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-5 h-5 text-amber-500" />
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                      KDP Preflight Status
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentRoute('kdp-checker')}
                    className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                  >
                    <span>Inspector</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <div className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">
                      {kdpAnalytics.kdpReady}
                    </div>
                    <div className="text-[10px] text-neutral-600 dark:text-neutral-300 font-semibold">Ready</div>
                  </div>
                  <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <div className="text-base font-bold font-mono text-amber-600 dark:text-amber-400">
                      {kdpAnalytics.warnings}
                    </div>
                    <div className="text-[10px] text-neutral-600 dark:text-neutral-300 font-semibold">Warnings</div>
                  </div>
                  <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20">
                    <div className="text-base font-bold font-mono text-red-600 dark:text-red-400">
                      {kdpAnalytics.failures}
                    </div>
                    <div className="text-[10px] text-neutral-600 dark:text-neutral-300 font-semibold">Errors</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentRoute('admin')}
                  className="w-full py-2 px-3 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-xs font-bold text-neutral-700 dark:text-neutral-300 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Package className="w-3.5 h-3.5 text-indigo-500" />
                  <span>View Publishing Catalog & Analytics</span>
                </button>
              </div>
            );
          })()}

          {/* Quick Activity Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-neutral-400" />
              Creator Activity
            </h3>
            <div className="space-y-3">
              {projects.slice(0, 3).map((p, i) => (
                <div key={p.id} className="flex items-start gap-3 text-xs">
                  <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  <div className="flex-1">
                    <div className="font-medium text-neutral-800 dark:text-neutral-200">
                      Edited "{p.name}"
                    </div>
                    <div className="text-neutral-500 font-mono text-[10px]">
                      {new Date(p.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Featured Templates Row */}
      <div className="space-y-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
              Featured Templates
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              One-click KDP interior layouts ready for customization
            </p>
          </div>
          <button
            onClick={() => setCurrentRoute('templates')}
            className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
          >
            <span>Explore All Templates</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {DEMO_TEMPLATES.slice(0, 3).map(tmpl => (
            <div
              key={tmpl.id}
              className="rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col justify-between hover:border-amber-500/40 transition-all group"
            >
              <div className="h-32 bg-neutral-100 dark:bg-neutral-800 overflow-hidden relative">
                <img
                  src={tmpl.thumbnail}
                  alt={tmpl.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-950/80 text-white backdrop-blur-xs">
                  {tmpl.category}
                </span>
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-bold text-neutral-900 dark:text-white mb-1">
                    {tmpl.name}
                  </h4>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                    {tmpl.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-neutral-500">
                    {tmpl.pageSize.name}
                  </span>
                  <button
                    onClick={() => createProjectFromTemplate(tmpl)}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold transition-colors"
                  >
                    Use Template
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

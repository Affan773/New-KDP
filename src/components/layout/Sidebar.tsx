import React, { useState } from 'react';
import {
  LayoutDashboard,
  FolderKanban,
  LayoutTemplate,
  Grid3X3,
  BookOpen,
  PenTool,
  Image as ImageIcon,
  Settings,
  HelpCircle,
  Sparkles,
  FileCheck2,
  Cpu,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  Database,
  ExternalLink,
  BookMarked,
} from 'lucide-react';
import { AppRoute, useApp } from '../../context/AppContext';

export const Sidebar: React.FC = () => {
  const { currentRoute, setCurrentRoute, setIsNewBookWizardOpen, projects } = useApp();
  const [collapsed, setCollapsed] = useState(false);

  const mainNavItems: { id: AppRoute; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'projects', label: 'Projects', icon: <FolderKanban className="w-5 h-5" />, badge: `${projects.length}` },
    { id: 'editor', label: 'Book Editor', icon: <PenTool className="w-5 h-5" /> },
    { id: 'templates', label: 'Templates', icon: <LayoutTemplate className="w-5 h-5" /> },
    { id: 'puzzles', label: 'Puzzle Center', icon: <Grid3X3 className="w-5 h-5" /> },
    { id: 'books', label: 'KDP Catalog', icon: <BookOpen className="w-5 h-5" /> },
    { id: 'assets', label: 'Asset Library', icon: <ImageIcon className="w-5 h-5" /> },
  ];

  const roadmapNavItems: { id: AppRoute; label: string; icon: React.ReactNode; phase: string }[] = [
    { id: 'ai', label: 'AI Generator', icon: <Sparkles className="w-4 h-4 text-amber-500" />, phase: 'Live' },
    { id: 'kdp-checker', label: 'KDP Pre-Flight', icon: <BookMarked className="w-4 h-4 text-emerald-500" />, phase: 'Live' },
    { id: 'admin', label: 'KDP Analytics', icon: <Cpu className="w-4 h-4 text-indigo-500" />, phase: 'Live' },
    { id: 'pdf-tools', label: 'PDF Production', icon: <FileCheck2 className="w-4 h-4 text-blue-500" />, phase: 'P2' },
  ];

  const bottomNavItems: { id: AppRoute; label: string; icon: React.ReactNode }[] = [
    { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
    { id: 'help', label: 'KDP Guides & Help', icon: <HelpCircle className="w-5 h-5" /> },
  ];

  return (
    <aside
      className={`hidden md:flex relative flex-col h-screen bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 select-none transition-all duration-200 z-30 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-neutral-100 dark:border-neutral-800">
        <button
          onClick={() => setCurrentRoute('landing')}
          className="flex items-center gap-3 overflow-hidden text-left focus:outline-none group"
          title="Return to Product Landing"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-white shadow-md shadow-amber-500/20 shrink-0 font-display font-extrabold text-lg">
            KDP
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <div className="font-display font-bold text-sm text-neutral-900 dark:text-white truncate group-hover:text-amber-500 transition-colors">
                Book & Puzzle
              </div>
              <div className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate flex items-center gap-1 font-mono">
                <span>Studio v1.0</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
              </div>
            </div>
          )}
        </button>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          aria-label={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Primary Action Button */}
      <div className="p-3 border-b border-neutral-100 dark:border-neutral-800">
        <button
          onClick={() => setIsNewBookWizardOpen(true)}
          className={`w-full flex items-center justify-center gap-2.5 py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-neutral-950 font-bold text-sm transition-all shadow-md shadow-amber-500/15 ${
            collapsed ? 'px-0' : ''
          }`}
          title="Create New Book"
        >
          <PlusCircle className="w-5 h-5 shrink-0" />
          {!collapsed && <span>New Book Wizard</span>}
        </button>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto py-3 px-2.5 space-y-1">
        <div className="px-2 mb-1">
          {!collapsed && (
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
              Workspace
            </span>
          )}
        </div>

        {mainNavItems.map(item => {
          const isActive = currentRoute === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentRoute(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left relative ${
                isActive
                  ? 'bg-neutral-900 text-white dark:bg-amber-500/15 dark:text-amber-400 font-semibold shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/60 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <div className="shrink-0">{item.icon}</div>
              {!collapsed && <span className="truncate flex-1">{item.label}</span>}
              {!collapsed && item.badge && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-mono font-medium ${
                    isActive
                      ? 'bg-neutral-800 text-white dark:bg-amber-500/30 dark:text-amber-300'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Phase Roadmap Nav */}
        <div className="pt-4 px-2 mb-1">
          {!collapsed && (
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
              Roadmap Modules
            </span>
          )}
        </div>

        {roadmapNavItems.map(item => {
          const isActive = currentRoute === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentRoute(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors text-left ${
                isActive
                  ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white font-semibold'
                  : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100/70 dark:hover:bg-neutral-800/40 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <div className="shrink-0">{item.icon}</div>
              {!collapsed && <span className="truncate flex-1">{item.label}</span>}
              {!collapsed && (
                <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-neutral-200/70 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                  {item.phase}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Persistence indicator & Bottom Navigation */}
      <div className="p-2.5 border-t border-neutral-100 dark:border-neutral-800 space-y-1">
        {!collapsed && (
          <div className="mb-2 p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/70 dark:border-neutral-750 text-xs">
            <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400 mb-1">
              <span className="flex items-center gap-1.5 font-medium">
                <Database className="w-3.5 h-3.5 text-emerald-500" />
                Local Storage
              </span>
              <span className="font-mono text-[10px]">Ready for Cloud</span>
            </div>
            <div className="w-full bg-neutral-200 dark:bg-neutral-700 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full w-[25%] rounded-full"></div>
            </div>
          </div>
        )}

        {bottomNavItems.map(item => {
          const isActive = currentRoute === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentRoute(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors text-left ${
                isActive
                  ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white font-semibold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/60 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <div className="shrink-0">{item.icon}</div>
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </div>
    </aside>
  );
};

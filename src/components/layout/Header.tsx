import React, { useState } from 'react';
import {
  Sun,
  Moon,
  Search,
  Plus,
  BookOpen,
  Grid3X3,
  Palette,
  Sparkles,
  HelpCircle,
  FolderPlus,
  ExternalLink,
  ChevronDown,
  User,
  Shield,
  Menu,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ProjectType } from '../../types';

interface HeaderProps {
  onOpenMobileNav?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileNav }) => {
  const {
    currentRoute,
    setCurrentRoute,
    theme,
    toggleTheme,
    setIsNewBookWizardOpen,
    quickCreateBook,
    projects,
    activeProject,
    settings,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const handleQuickCreate = (type: ProjectType) => {
    setIsQuickActionOpen(false);
    quickCreateBook(type);
  };

  const getRouteTitle = () => {
    switch (currentRoute) {
      case 'dashboard':
        return 'Creator Dashboard';
      case 'projects':
        return 'Project Management';
      case 'editor':
        return activeProject ? `${activeProject.name}` : 'Book Editor Workspace';
      case 'templates':
        return 'Templates Gallery';
      case 'puzzles':
        return 'Puzzle Center';
      case 'books':
        return 'KDP Book Catalog';
      case 'assets':
        return 'Asset & Graphics Library';
      case 'settings':
        return 'Studio Settings';
      case 'help':
        return 'KDP Publishing Guide & Help';
      case 'ai':
        return 'AI Content Studio';
      case 'pdf-tools':
        return 'PDF Production Engine';
      case 'kdp-checker':
        return 'KDP Pre-Flight Inspector';
      case 'admin':
        return 'Enterprise Cloud Admin';
      default:
        return 'KDP Studio';
    }
  };

  return (
    <header className="h-16 border-b border-neutral-200 dark:border-neutral-800 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between gap-3 z-20 select-none">
      {/* Route Title or Breadcrumb */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {onOpenMobileNav && (
          <button
            type="button"
            onClick={onOpenMobileNav}
            className="md:hidden p-2 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center -ml-1"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <h1 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white truncate font-display">
          {getRouteTitle()}
        </h1>
        {activeProject && currentRoute === 'editor' && (
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            {activeProject.kdpSettings.trimSize.name} • {activeProject.pageCount} Pages
          </span>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Action Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsQuickActionOpen(!isQuickActionOpen)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-750 text-neutral-800 dark:text-neutral-200 text-xs font-semibold transition-colors"
          >
            <Plus className="w-4 h-4 text-amber-500" />
            <span className="hidden sm:inline">Quick Action</span>
            <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
          </button>

          {isQuickActionOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl py-2 z-50 text-sm animate-in fade-in zoom-in-95">
              <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                Create Instantly
              </div>
              <button
                onClick={() => {
                  setIsQuickActionOpen(false);
                  setIsNewBookWizardOpen(true);
                }}
                className="w-full px-3 py-2 text-left flex items-center gap-2.5 text-neutral-700 dark:text-neutral-300 hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
              >
                <FolderPlus className="w-4 h-4 text-amber-500" />
                <span className="font-medium">New Book Wizard</span>
              </button>
              <button
                onClick={() => handleQuickCreate('Puzzle Book')}
                className="w-full px-3 py-2 text-left flex items-center gap-2.5 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <Grid3X3 className="w-4 h-4 text-blue-500" />
                <span>New Puzzle Book</span>
              </button>
              <button
                onClick={() => handleQuickCreate('Coloring Book')}
                className="w-full px-3 py-2 text-left flex items-center gap-2.5 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <Palette className="w-4 h-4 text-pink-500" />
                <span>New Coloring Book</span>
              </button>
              <button
                onClick={() => handleQuickCreate('Journal')}
                className="w-full px-3 py-2 text-left flex items-center gap-2.5 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <BookOpen className="w-4 h-4 text-emerald-500" />
                <span>New Dot Grid Journal</span>
              </button>
              <div className="my-1 border-t border-neutral-100 dark:border-neutral-800"></div>
              <button
                onClick={() => {
                  setIsQuickActionOpen(false);
                  setCurrentRoute('templates');
                }}
                className="w-full px-3 py-2 text-left flex items-center gap-2.5 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Browse Templates</span>
              </button>
            </div>
          )}
        </div>

        {/* Landing Page Link */}
        <button
          onClick={() => setCurrentRoute('landing')}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          title="Product Tour & Features"
        >
          <span>Landing Page</span>
          <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* User Profile Avatar & Badge */}
        <div className="relative">
          <button
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <div className="w-7 h-7 rounded-lg bg-neutral-800 dark:bg-neutral-700 text-white flex items-center justify-center text-xs font-bold font-display">
              KC
            </div>
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-semibold text-neutral-900 dark:text-white leading-tight">
                {settings.profile.name}
              </span>
              <span className="text-[10px] text-neutral-500 dark:text-neutral-400 leading-tight font-mono">
                {settings.profile.plan}
              </span>
            </div>
          </button>

          {isProfileMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95">
              <div className="flex items-center gap-3 pb-3 border-b border-neutral-100 dark:border-neutral-800">
                <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-neutral-950 font-bold font-display text-sm">
                  KC
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-neutral-900 dark:text-white truncate">
                    {settings.profile.name}
                  </div>
                  <div className="text-xs text-neutral-500 truncate font-mono">
                    {settings.profile.email}
                  </div>
                </div>
              </div>

              <div className="py-2.5 space-y-1">
                <div className="flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400 py-1">
                  <span>Current Plan</span>
                  <span className="font-semibold text-neutral-900 dark:text-white bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded">
                    {settings.profile.plan}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400 py-1">
                  <span>Total Projects</span>
                  <span className="font-semibold text-neutral-900 dark:text-white font-mono">
                    {projects.length}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex flex-col gap-1.5">
                <button
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    setCurrentRoute('settings');
                  }}
                  className="w-full text-center py-2 text-xs font-semibold rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-750 text-neutral-800 dark:text-neutral-200 transition-colors"
                >
                  Manage Account & Storage
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

import React from 'react';
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
  PlusCircle,
  BookMarked,
  ExternalLink,
  Search,
  Compass,
} from 'lucide-react';
import { AppRoute, useApp } from '../../context/AppContext';
import { Drawer } from '../common/Drawer';

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileNavDrawer: React.FC<MobileNavDrawerProps> = ({ isOpen, onClose }) => {
  const { currentRoute, setCurrentRoute, setIsNewBookWizardOpen, projects, settings } = useApp();

  const handleNavigate = (route: AppRoute) => {
    setCurrentRoute(route);
    onClose();
  };

  const mainNavItems: { id: AppRoute; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'projects', label: 'Projects', icon: <FolderKanban className="w-5 h-5" />, badge: `${projects.length}` },
    { id: 'editor', label: 'Book Editor', icon: <PenTool className="w-5 h-5" /> },
    { id: 'templates', label: 'Templates Gallery', icon: <LayoutTemplate className="w-5 h-5" /> },
    { id: 'puzzles', label: 'Puzzle Center', icon: <Grid3X3 className="w-5 h-5" /> },
    { id: 'books', label: 'KDP Catalog', icon: <BookOpen className="w-5 h-5" /> },
    { id: 'assets', label: 'Asset Library', icon: <ImageIcon className="w-5 h-5" /> },
  ];

  const roadmapNavItems: { id: AppRoute; label: string; icon: React.ReactNode; phase: string }[] = [
    { id: 'kdp-niche', label: 'KDP Niche & Market', icon: <Compass className="w-4 h-4 text-purple-500" />, phase: 'P11' },
    { id: 'kdp-seo', label: 'KDP SEO & Keywords', icon: <Search className="w-4 h-4 text-emerald-500" />, phase: 'P10' },
    { id: 'ai', label: 'AI Generator', icon: <Sparkles className="w-4 h-4 text-amber-500" />, phase: 'Live' },
    { id: 'kdp-checker', label: 'KDP Pre-Flight', icon: <FileCheck2 className="w-4 h-4 text-emerald-500" />, phase: 'Live' },
    { id: 'admin', label: 'Enterprise Admin', icon: <Cpu className="w-4 h-4 text-indigo-500" />, phase: 'Live' },
    { id: 'pdf-tools', label: 'PDF Production', icon: <FileCheck2 className="w-4 h-4 text-blue-500" />, phase: 'P2' },
  ];

  const bottomNavItems: { id: AppRoute; label: string; icon: React.ReactNode }[] = [
    { id: 'settings', label: 'Studio Settings', icon: <Settings className="w-5 h-5" /> },
    { id: 'help', label: 'KDP Guides & Help', icon: <HelpCircle className="w-5 h-5" /> },
  ];

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      side="left"
      title={
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-white shadow-md shadow-amber-500/20 shrink-0 font-display font-extrabold text-sm">
            KDP
          </div>
          <div>
            <div className="font-display font-bold text-sm text-neutral-900 dark:text-white leading-tight">
              Book & Puzzle Studio
            </div>
            <div className="text-[10px] text-neutral-500 font-mono">v1.0 Pro Mobile</div>
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
          <span>{settings.profile.plan}</span>
          <button
            onClick={() => handleNavigate('landing')}
            className="flex items-center gap-1 text-amber-500 font-semibold hover:underline"
          >
            <span>Landing Page</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      }
    >
      <div className="p-3 space-y-4">
        {/* Quick New Book Button */}
        <button
          onClick={() => {
            onClose();
            setIsNewBookWizardOpen(true);
          }}
          className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-98 text-neutral-950 font-bold text-sm shadow-md shadow-amber-500/20"
        >
          <PlusCircle className="w-5 h-5 shrink-0" />
          <span>New Book Wizard</span>
        </button>

        {/* Main Nav Items */}
        <div className="space-y-1">
          <div className="px-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
            Workspace
          </div>
          {mainNavItems.map(item => {
            const isActive = currentRoute === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-sm font-medium transition-colors text-left min-h-[46px] ${
                  isActive
                    ? 'bg-neutral-900 text-white dark:bg-amber-500/15 dark:text-amber-400 font-semibold shadow-xs'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                <div className="shrink-0">{item.icon}</div>
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-mono font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Roadmap Items */}
        <div className="space-y-1 pt-2 border-t border-neutral-100 dark:border-neutral-800">
          <div className="px-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
            Roadmap Modules
          </div>
          {roadmapNavItems.map(item => {
            const isActive = currentRoute === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-medium transition-colors text-left min-h-[42px] ${
                  isActive
                    ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white font-semibold'
                    : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                <div className="shrink-0">{item.icon}</div>
                <span className="flex-1">{item.label}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-neutral-200/70 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                  {item.phase}
                </span>
              </button>
            );
          })}
        </div>

        {/* Settings & Help */}
        <div className="space-y-1 pt-2 border-t border-neutral-100 dark:border-neutral-800">
          {bottomNavItems.map(item => {
            const isActive = currentRoute === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-sm font-medium transition-colors text-left min-h-[46px] ${
                  isActive
                    ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white font-semibold'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                <div className="shrink-0">{item.icon}</div>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </Drawer>
  );
};

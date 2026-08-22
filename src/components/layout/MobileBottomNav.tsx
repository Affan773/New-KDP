import React from 'react';
import {
  LayoutDashboard,
  FolderKanban,
  PenTool,
  Grid3X3,
  Menu,
} from 'lucide-react';
import { AppRoute, useApp } from '../../context/AppContext';

interface MobileBottomNavProps {
  onOpenMenu: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ onOpenMenu }) => {
  const { currentRoute, setCurrentRoute, projects } = useApp();

  const navItems: { id: AppRoute | 'menu'; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'projects', label: 'Projects', icon: <FolderKanban className="w-5 h-5" />, badge: `${projects.length}` },
    { id: 'editor', label: 'Editor', icon: <PenTool className="w-5 h-5" /> },
    { id: 'puzzles', label: 'Puzzles', icon: <Grid3X3 className="w-5 h-5" /> },
    { id: 'menu', label: 'Menu', icon: <Menu className="w-5 h-5" /> },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-t border-neutral-200 dark:border-neutral-800 px-2 py-1.5 pb-safe flex items-center justify-around shadow-lg">
      {navItems.map(item => {
        const isMenu = item.id === 'menu';
        const isActive = !isMenu && currentRoute === item.id;

        return (
          <button
            key={item.id}
            onClick={() => {
              if (isMenu) {
                onOpenMenu();
              } else {
                setCurrentRoute(item.id as AppRoute);
              }
            }}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl min-w-[56px] min-h-[46px] transition-all relative ${
              isActive
                ? 'text-amber-500 font-bold dark:text-amber-400 scale-105'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <div className="relative">
              {item.icon}
              {item.badge && (
                <span className="absolute -top-1 -right-2 px-1 text-[9px] font-bold rounded-full bg-amber-500 text-neutral-950 font-mono leading-tight">
                  {item.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5 font-medium leading-none">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};

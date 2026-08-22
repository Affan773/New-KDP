import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { MobileNavDrawer } from './MobileNavDrawer';
import { MobileBottomNav } from './MobileBottomNav';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { currentRoute } = useApp();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // If on landing page, display clean standalone landing layout
  if (currentRoute === 'landing') {
    return <div className="min-h-screen bg-neutral-950 text-neutral-100">{children}</div>;
  }

  const isEditor = currentRoute === 'editor';

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-neutral-100 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      {/* Sidebar Navigation for Desktop */}
      <Sidebar />

      {/* Slide-out Navigation Drawer for Mobile/Tablet */}
      <MobileNavDrawer
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Header onOpenMobileNav={() => setIsMobileNavOpen(true)} />
        <main
          className={`flex-1 overflow-y-auto overflow-x-hidden relative bg-neutral-50 dark:bg-neutral-950/60 ${
            !isEditor ? 'pb-16 md:pb-0' : ''
          }`}
        >
          {children}
        </main>

        {/* Mobile Bottom Dock (Hidden in full-screen editor to maximize canvas space) */}
        {!isEditor && (
          <MobileBottomNav onOpenMenu={() => setIsMobileNavOpen(true)} />
        )}
      </div>
    </div>
  );
};


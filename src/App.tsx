/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AppLayout } from './components/layout/AppLayout';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { ToastContainer } from './components/common/ToastContainer';
import { ConfirmDialog } from './components/common/ConfirmDialog';
import { NewBookWizardModal } from './components/projects/NewBookWizardModal';

// Views
import { LandingPage } from './components/landing/LandingPage';
import { DashboardView } from './components/dashboard/DashboardView';
import { ProjectsView } from './components/projects/ProjectsView';
import { TemplatesView } from './components/templates/TemplatesView';
import { PuzzlesView } from './components/puzzles/PuzzlesView';
import { BooksView } from './components/books/BooksView';
import { BookEditor } from './components/editor/BookEditor';
import { SettingsView } from './components/settings/SettingsView';
import { AiBookPlannerView } from './components/ai/AiBookPlannerView';
import { KdpPreflightView } from './components/kdp/KdpPreflightView';
import { KdpBookContentView } from './components/kdp/KdpBookContentView';
import { KdpBookDetailsView } from './components/kdp/KdpBookDetailsView';
import { KdpAdminView } from './components/admin/KdpAdminView';
import { PhasePlaceholder } from './components/common/PhasePlaceholder';

const MainContent: React.FC = () => {
  const { currentRoute } = useApp();

  const renderView = () => {
    switch (currentRoute) {
      case 'landing':
        return <LandingPage />;
      case 'dashboard':
        return <DashboardView />;
      case 'projects':
        return <ProjectsView />;
      case 'templates':
        return <TemplatesView />;
      case 'puzzles':
        return <PuzzlesView />;
      case 'books':
        return <BooksView />;
      case 'editor':
        return <BookEditor />;
      case 'settings':
        return <SettingsView />;
      case 'ai':
        return <AiBookPlannerView />;
      case 'pdf-tools':
        return <PhasePlaceholder module="pdf-tools" />;
      case 'kdp-checker':
        return <KdpPreflightView />;
      case 'kdp-content':
        return <KdpBookContentView />;
      case 'kdp-details':
        return <KdpBookDetailsView />;
      case 'admin':
        return <KdpAdminView />;
      case 'assets':
        return (
          <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-white font-display">
                Asset & Graphics Library
              </h1>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                Manage reusable vector icons, decorative borders, flourishes, and high-resolution puzzle illustrations.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {['Decorative Borders', 'Puzzle Clipart', 'Florals & Botanicals', 'Geometric Frames', 'Ribbons & Banners', 'Animals & Nature', 'Vintage Ornaments', 'Custom Uploads'].map((folder, i) => (
                <div
                  key={folder}
                  className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-sm mb-3">
                    #{i + 1}
                  </div>
                  <h3 className="font-bold text-neutral-900 dark:text-white text-sm">{folder}</h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    {12 + i * 8} vector assets ready for print
                  </p>
                </div>
              ))}
            </div>
          </div>
        );
      case 'settings':
      case 'help':
      default:
        return <DashboardView />;
    }
  };

  return (
    <AppLayout>
      {renderView()}
      <NewBookWizardModal />
      <ConfirmDialog />
      <ToastContainer />
    </AppLayout>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <MainContent />
      </AppProvider>
    </ErrorBoundary>
  );
}


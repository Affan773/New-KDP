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
import { Project, DocumentModel, TrimSize } from './types/project';

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
import { KdpSeoResearchView } from './components/seo/KdpSeoResearchView';
import { KdpNicheResearchDashboard } from './components/niche/KdpNicheResearchDashboard';
import { KdpAdminView } from './components/admin/KdpAdminView';
import { PhasePlaceholder } from './components/common/PhasePlaceholder';

const MainContent: React.FC = () => {
  const {
    currentRoute,
    setCurrentRoute,
    setIsNewBookWizardOpen,
    activeProject,
    createProject,
    openProjectInEditor,
    showToast,
  } = useApp();

  const handleCreateBookFromNiche = (nicheData: {
    niche: string;
    bookType: string;
    puzzleType: string;
    targetAudience: string;
    theme: string;
    keywords: string[];
    suggestedTitle?: string;
    suggestedSubtitle?: string;
  }) => {
    const newProjectId = `proj-${Date.now()}`;
    const newDocId = `doc-${Date.now()}`;
    const title =
      nicheData.suggestedTitle ||
      `${nicheData.niche} ${nicheData.puzzleType || nicheData.bookType} Book`;
    const subtitle =
      nicheData.suggestedSubtitle ||
      `Fun & Relaxing Puzzles for ${nicheData.targetAudience}`;

    const trimSize: TrimSize = {
      id: '8.5x11',
      name: '8.5" × 11"',
      width: 8.5,
      height: 11,
      category: 'Large',
      isPopular: true,
    };

    const newProject: Project = {
      id: newProjectId,
      name: title,
      type: (nicheData.bookType as any) || 'Puzzle Book',
      description: `${subtitle}. Curated for ${nicheData.targetAudience}.`,
      pageCount: 80,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'Draft',
      ownerId: 'user-default-1',
      isFavorite: false,
      documentId: newDocId,
      kdpSettings: {
        trimSize,
        orientation: 'Portrait',
        pageCount: 80,
        margins: { top: 0.5, bottom: 0.5, left: 0.5, right: 0.5 },
        bleed: 'No Bleed',
        paperType: 'White',
        spineWidthInches: 0.18,
        coverWidthInches: 17.43,
        coverHeightInches: 11.25,
      },
      metadata: {
        category: nicheData.puzzleType || 'Word Search',
        keywords: nicheData.keywords || [],
      },
    };

    const initialDoc: DocumentModel = {
      id: newDocId,
      projectId: newProjectId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pages: [
        {
          id: `page-${newProjectId}-1`,
          pageNumber: 1,
          backgroundColor: '#FFFFFF',
          notes: 'Title & Introduction Page',
          elements: [
            {
              id: `el-text-title`,
              type: 'text',
              content: title.toUpperCase(),
              x: 100,
              y: 200,
              width: 600,
              height: 80,
              fontSize: 32,
              fontFamily: 'Playfair Display',
              fontWeight: 'bold',
              textAlign: 'center',
              color: '#111827',
              rotation: 0,
              opacity: 1,
              zIndex: 1,
              locked: false,
            },
            {
              id: `el-text-subtitle`,
              type: 'text',
              content: subtitle,
              x: 120,
              y: 290,
              width: 560,
              height: 50,
              fontSize: 18,
              fontFamily: 'Inter',
              fontWeight: 'normal',
              textAlign: 'center',
              color: '#4B5563',
              rotation: 0,
              opacity: 1,
              zIndex: 2,
              locked: false,
            },
          ],
        },
      ],
    };

    createProject(newProject, initialDoc);
    showToast({
      type: 'success',
      title: 'Book Created from Niche Research',
      message: `Created "${title}" with targeted keywords and specifications.`,
    });
    openProjectInEditor(newProjectId);
  };

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
      case 'kdp-seo':
        return <KdpSeoResearchView />;
      case 'kdp-niche':
        return (
          <KdpNicheResearchDashboard
            currentProject={activeProject || undefined}
            onNavigateToSeo={() => {
              setCurrentRoute('kdp-seo');
            }}
            onCreateBookFromNiche={handleCreateBookFromNiche}
          />
        );
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


import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { EditorProvider, useEditor } from '../../context/EditorContext';
import { EditorToolbar } from './EditorToolbar';
import { EditorLeftPanel } from './EditorLeftPanel';
import { EditorCanvas } from './EditorCanvas';
import { EditorRightPanel } from './EditorRightPanel';
import { EditorTimeline } from './EditorTimeline';
import { EditorPreviewModal } from './EditorPreviewModal';
import { EditorExportModal } from './EditorExportModal';
import { BookSettingsModal } from './BookSettingsModal';
import { BookPreflightModal } from '../books/BookPreflightModal';
import { BookBulkEditModal } from '../books/BookBulkEditModal';
import { BookStylesModal } from '../books/BookStylesModal';
import { Drawer } from '../common/Drawer';
import { BottomSheet } from '../common/BottomSheet';
import {
  BookOpen,
  PlusCircle,
  ArrowRight,
  Plus,
  Sliders,
  Film,
  Layers,
  Sparkles,
  Eye,
  Download,
  ShieldCheck,
  Grid,
} from 'lucide-react';

const EditorLayoutContent: React.FC = () => {
  const {
    selectedElements,
    currentPageIndex,
    document,
  } = useEditor();

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPreflightOpen, setIsPreflightOpen] = useState(false);
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
  const [isStylesOpen, setIsStylesOpen] = useState(false);

  const [settingsTab, setSettingsTab] = useState<
    'metadata' | 'trim' | 'headerFooter' | 'numbering' | 'theme' | 'preflight'
  >('metadata');

  // Mobile drawer / sheet visibility states
  const [isMobileToolsOpen, setIsMobileToolsOpen] = useState(false);
  const [isMobileInspectorOpen, setIsMobileInspectorOpen] = useState(false);
  const [isMobileTimelineOpen, setIsMobileTimelineOpen] = useState(false);

  const totalPages = document?.pages?.length || 1;

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden bg-neutral-100 dark:bg-neutral-950 relative">
      {/* Top Editor Toolbar */}
      <EditorToolbar
        onOpenPreview={() => setIsPreviewOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenSettings={() => {
          setSettingsTab('metadata');
          setIsSettingsOpen(true);
        }}
        onOpenBulkEdit={() => setIsBulkEditOpen(true)}
        onOpenStyles={() => setIsStylesOpen(true)}
        onOpenValidation={() => setIsPreflightOpen(true)}
      />

      {/* Center Workspace (Responsive layout: Left panel inline on lg+, Right inspector inline on xl+, else in Drawer/BottomSheet) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Desktop Left Panel (lg+) */}
        <div className="hidden lg:flex shrink-0">
          <EditorLeftPanel
            onOpenSettings={() => {
              setSettingsTab('metadata');
              setIsSettingsOpen(true);
            }}
            onOpenValidation={() => setIsPreflightOpen(true)}
            onOpenBulkEdit={() => setIsBulkEditOpen(true)}
            onOpenStyles={() => setIsStylesOpen(true)}
            onOpenPreview={() => setIsPreviewOpen(true)}
          />
        </div>

        {/* Central Interactive Canvas (Full width on mobile/tablet) */}
        <div className="flex-1 h-full overflow-hidden relative">
          <EditorCanvas />
        </div>

        {/* Desktop Right Inspector (xl+) */}
        <div className="hidden xl:flex shrink-0">
          <EditorRightPanel />
        </div>
      </div>

      {/* Desktop Bottom Timeline Strip (md+) or when expanded on mobile */}
      <div className={`${isMobileTimelineOpen ? 'block' : 'hidden md:block'} shrink-0`}>
        <EditorTimeline />
      </div>

      {/* MOBILE FLOATING ACTION DOCK (< lg) */}
      <div className="lg:hidden fixed bottom-3 left-1/2 -translate-x-1/2 z-30 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border border-neutral-200 dark:border-neutral-800 rounded-2xl p-1.5 shadow-2xl flex items-center gap-1">
        {/* Left Tools / Insert Drawer Trigger */}
        <button
          type="button"
          onClick={() => setIsMobileToolsOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 text-neutral-950 text-xs font-bold shadow-sm shadow-amber-500/20 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span>Insert</span>
        </button>

        {/* Inspector Bottom Sheet Trigger */}
        <button
          type="button"
          onClick={() => setIsMobileInspectorOpen(true)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
            selectedElements.length > 0
              ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
          }`}
        >
          <Sliders className="w-4 h-4 shrink-0" />
          <span>Inspect</span>
          {selectedElements.length > 0 && (
            <span className="w-4 h-4 rounded-full bg-amber-500 text-neutral-950 text-[10px] font-mono font-bold flex items-center justify-center">
              {selectedElements.length}
            </span>
          )}
        </button>

        {/* Timeline Filmstrip Toggle */}
        <button
          type="button"
          onClick={() => setIsMobileTimelineOpen(!isMobileTimelineOpen)}
          className={`p-2 rounded-xl text-xs font-semibold transition-all ${
            isMobileTimelineOpen
              ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
              : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
          title="Toggle Page Filmstrip"
        >
          <Film className="w-4 h-4" />
        </button>

        {/* Preflight Inspector */}
        <button
          type="button"
          onClick={() => setIsPreflightOpen(true)}
          className="p-2 rounded-xl text-emerald-600 dark:text-emerald-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          title="KDP Preflight Inspector"
        >
          <ShieldCheck className="w-4 h-4" />
        </button>

        {/* Quick Preview */}
        <button
          type="button"
          onClick={() => setIsPreviewOpen(true)}
          className="p-2 rounded-xl text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          title="Full Manuscript Preview"
        >
          <Eye className="w-4 h-4" />
        </button>

        {/* Quick Export */}
        <button
          type="button"
          onClick={() => setIsExportOpen(true)}
          className="p-2 rounded-xl text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          title="Export Book"
        >
          <Download className="w-4 h-4" />
        </button>
      </div>

      {/* MOBILE DRAWER: Tools, Outline, Text, Shapes, Puzzles, Layouts, Assets */}
      <Drawer
        isOpen={isMobileToolsOpen}
        onClose={() => setIsMobileToolsOpen(false)}
        side="left"
        widthClass="w-80 sm:w-96 max-w-[88vw]"
        title="Insert & Outline Tools"
      >
        <div className="h-full flex flex-col">
          <EditorLeftPanel
            onOpenSettings={() => {
              setIsMobileToolsOpen(false);
              setSettingsTab('metadata');
              setIsSettingsOpen(true);
            }}
            onOpenValidation={() => {
              setIsMobileToolsOpen(false);
              setIsPreflightOpen(true);
            }}
            onOpenBulkEdit={() => {
              setIsMobileToolsOpen(false);
              setIsBulkEditOpen(true);
            }}
            onOpenStyles={() => {
              setIsMobileToolsOpen(false);
              setIsStylesOpen(true);
            }}
            onOpenPreview={() => {
              setIsMobileToolsOpen(false);
              setIsPreviewOpen(true);
            }}
          />
        </div>
      </Drawer>

      {/* MOBILE BOTTOM SHEET: Inspector & Properties */}
      <BottomSheet
        isOpen={isMobileInspectorOpen}
        onClose={() => setIsMobileInspectorOpen(false)}
        maxHeightClass="max-h-[85vh]"
        title="Inspector & Properties"
      >
        <div className="h-full overflow-y-auto">
          <EditorRightPanel />
        </div>
      </BottomSheet>

      {/* Modals */}
      <EditorPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        onOpenExport={() => setIsExportOpen(true)}
      />

      <EditorExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
      />

      <BookSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        defaultTab={settingsTab}
      />

      <BookPreflightModal
        isOpen={isPreflightOpen}
        onClose={() => setIsPreflightOpen(false)}
      />

      <BookBulkEditModal
        isOpen={isBulkEditOpen}
        onClose={() => setIsBulkEditOpen(false)}
      />

      <BookStylesModal
        isOpen={isStylesOpen}
        onClose={() => setIsStylesOpen(false)}
      />
    </div>
  );
};

export const BookEditor: React.FC = () => {
  const { activeProject, projects, openProjectInEditor, setIsNewBookWizardOpen } = useApp();

  // If no active project is selected, present project chooser or quick launch
  if (!activeProject) {
    return (
      <div className="h-full flex items-center justify-center p-4 sm:p-6 bg-neutral-100 dark:bg-neutral-950">
        <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl text-center space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto shadow-xs">
            <BookOpen className="w-7 h-7" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white font-display">
              No Active Project Selected
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 leading-relaxed">
              Open an existing manuscript or start a new KDP book with the setup wizard.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => setIsNewBookWizardOpen(true)}
              className="w-full py-3.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-98 text-neutral-950 font-bold text-xs transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create New Book</span>
            </button>

            {projects.length > 0 && (
              <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 text-left">
                <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2">
                  Or Open Recent Project:
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {projects.slice(0, 4).map(p => (
                    <button
                      key={p.id}
                      onClick={() => openProjectInEditor(p.id)}
                      className="w-full p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 flex items-center justify-between text-left transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                          {p.name}
                        </div>
                        <div className="text-[10px] text-neutral-500 font-mono">
                          {p.type} • {p.kdpSettings.trimSize.name}
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-neutral-400 shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <EditorProvider>
      <EditorLayoutContent />
    </EditorProvider>
  );
};

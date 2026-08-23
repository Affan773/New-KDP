import React, { useState } from 'react';
import {
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Eye,
  Download,
  Plus,
  Copy,
  Trash2,
  Grid,
  Shield,
  Layers,
  ChevronLeft,
  ChevronRight,
  Save,
  Check,
  Sparkles,
  Ruler,
  Magnet,
  Maximize,
  ChevronDown,
  BookMarked,
} from 'lucide-react';
import { useEditor, RulerUnit } from '../../context/EditorContext';
import { useApp } from '../../context/AppContext';

interface EditorToolbarProps {
  onOpenPreview: () => void;
  onOpenExport: () => void;
  onOpenSettings?: () => void;
  onOpenBulkAdd?: () => void;
  onOpenBulkEdit?: () => void;
  onOpenStyles?: () => void;
  onOpenValidation?: () => void;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  onOpenPreview,
  onOpenExport,
  onOpenSettings,
  onOpenBulkAdd,
  onOpenBulkEdit,
  onOpenStyles,
  onOpenValidation,
}) => {
  const {
    document,
    currentPageIndex,
    canUndo,
    canRedo,
    undo,
    redo,
    zoom,
    setZoom,
    fitPage,
    fitWidth,
    showGuides,
    setShowGuides,
    showBleedGuides,
    setShowBleedGuides,
    showSafeMargins,
    setShowSafeMargins,
    showGrid,
    setShowGrid,
    showRulers,
    setShowRulers,
    rulerUnit,
    setRulerUnit,
    snapToGrid,
    setSnapToGrid,
    snapToObjects,
    setSnapToObjects,
    autosaveStatus,
    saveNow,
    addPage,
    duplicateCurrentPage,
    deleteCurrentPage,
    setCurrentPageIndex,
  } = useEditor();

  const { activeProject, setCurrentRoute } = useApp();
  const [showZoomMenu, setShowZoomMenu] = useState(false);
  const [showSnapMenu, setShowSnapMenu] = useState(false);

  const totalPages = document?.pages?.length || 1;

  return (
    <div className="h-14 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 sm:px-4 flex items-center justify-between gap-2 z-30 select-none overflow-x-auto no-scrollbar">
      {/* LEFT: Save, History & Page Stepper */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Save & Status */}
        <button
          onClick={saveNow}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-xs font-semibold text-neutral-800 dark:text-neutral-200 transition-colors"
          title="Save Manuscript (Ctrl+S)"
        >
          <Save className="w-3.5 h-3.5 text-amber-500" />
          <span className="hidden sm:inline">Save</span>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
              autosaveStatus === 'Saved'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : autosaveStatus === 'Saving...'
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 animate-pulse'
                : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400'
            }`}
          >
            {autosaveStatus}
          </span>
        </button>

        {/* Undo / Redo */}
        <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 rounded-xl p-0.5">
          <button
            onClick={undo}
            disabled={!canUndo}
            className="p-1.5 rounded-lg text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white disabled:opacity-30 disabled:hover:text-neutral-400 transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className="p-1.5 rounded-lg text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white disabled:opacity-30 disabled:hover:text-neutral-400 transition-colors"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        <div className="h-5 w-px bg-neutral-200 dark:bg-neutral-800 mx-0.5 hidden sm:block" />

        {/* Page stepper */}
        <div className="flex items-center gap-0.5 bg-neutral-100 dark:bg-neutral-800 rounded-xl px-1.5 py-0.5">
          <button
            onClick={() => setCurrentPageIndex(Math.max(0, currentPageIndex - 1))}
            disabled={currentPageIndex === 0}
            className="p-1 rounded-lg text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white disabled:opacity-30"
            title="Previous Page"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <span className="text-xs font-mono font-semibold text-neutral-800 dark:text-neutral-200 px-1.5">
            {currentPageIndex + 1} / {totalPages}
          </span>

          <button
            onClick={() => setCurrentPageIndex(Math.min(totalPages - 1, currentPageIndex + 1))}
            disabled={currentPageIndex >= totalPages - 1}
            className="p-1 rounded-lg text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white disabled:opacity-30"
            title="Next Page"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Quick Page Actions */}
        <div className="hidden md:flex items-center gap-1">
          <button
            onClick={() => addPage()}
            className="p-1.5 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors"
            title="Add New Blank Page"
          >
            <Plus className="w-4 h-4 text-emerald-500" />
          </button>
          {onOpenBulkAdd && (
            <button
              onClick={onOpenBulkAdd}
              className="p-1.5 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors"
              title="Bulk Generate Pages"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
            </button>
          )}
          <button
            onClick={duplicateCurrentPage}
            className="p-1.5 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors"
            title="Duplicate Current Page"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={deleteCurrentPage}
            disabled={totalPages <= 1}
            className="p-1.5 text-neutral-600 dark:text-neutral-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors disabled:opacity-30"
            title="Delete Current Page"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* CENTER: Overlays & Guides & Rulers & Snap Toggles */}
      <div className="hidden xl:flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl text-xs shrink-0">
        {/* Margins */}
        <button
          onClick={() => setShowSafeMargins(!showSafeMargins)}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg font-medium transition-colors ${
            showSafeMargins
              ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
          }`}
          title="Toggle KDP Safe Margins & Gutter"
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Margins</span>
        </button>

        {/* Bleed */}
        <button
          onClick={() => setShowBleedGuides(!showBleedGuides)}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg font-medium transition-colors ${
            showBleedGuides
              ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
          }`}
          title="Toggle 0.125in Bleed Boundary"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span>Bleed</span>
        </button>

        {/* Grid */}
        <button
          onClick={() => setShowGrid(!showGrid)}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg font-medium transition-colors ${
            showGrid
              ? 'bg-purple-500/20 text-purple-600 dark:text-purple-400 font-bold'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
          }`}
          title="Toggle Alignment Grid"
        >
          <Grid className="w-3.5 h-3.5" />
          <span>Grid</span>
        </button>

        {/* Rulers */}
        <div className="flex items-center">
          <button
            onClick={() => setShowRulers(!showRulers)}
            className={`flex items-center gap-1 px-2 py-1 rounded-l-lg font-medium transition-colors ${
              showRulers
                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
            title="Toggle Horizontal & Vertical Rulers"
          >
            <Ruler className="w-3.5 h-3.5" />
            <span>Rulers</span>
          </button>
          {showRulers && (
            <button
              onClick={() => setRulerUnit(rulerUnit === 'in' ? 'px' : 'in')}
              className="px-1.5 py-1 text-[10px] font-mono bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-r-lg font-bold hover:bg-neutral-300"
              title="Switch Ruler Unit (Inches / Pixels)"
            >
              {rulerUnit}
            </button>
          )}
        </div>

        {/* Snap Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowSnapMenu(!showSnapMenu)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg font-medium transition-colors ${
              snapToGrid || snapToObjects
                ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold'
                : 'text-neutral-500 dark:text-neutral-400'
            }`}
            title="Magnetic Snapping Settings"
          >
            <Magnet className="w-3.5 h-3.5" />
            <span>Snap</span>
            <ChevronDown className="w-3 h-3" />
          </button>

          {showSnapMenu && (
            <div className="absolute top-full mt-1 right-0 w-44 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl p-2 z-40 space-y-1 text-xs">
              <label className="flex items-center justify-between p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer">
                <span>Snap to Grid</span>
                <input
                  type="checkbox"
                  checked={snapToGrid}
                  onChange={e => setSnapToGrid(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-0"
                />
              </label>
              <label className="flex items-center justify-between p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer">
                <span>Snap to Objects</span>
                <input
                  type="checkbox"
                  checked={snapToObjects}
                  onChange={e => setSnapToObjects(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-0"
                />
              </label>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Zoom, Full Preview & Export */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Zoom Stepper & Dropdown */}
        <div className="relative flex items-center bg-neutral-100 dark:bg-neutral-800 rounded-xl p-0.5">
          <button
            onClick={() => setZoom(Math.max(0.4, Number((zoom - 0.1).toFixed(2))))}
            className="p-1.5 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setShowZoomMenu(!showZoomMenu)}
            className="px-1.5 text-xs font-mono font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-0.5"
            title="Zoom Presets"
          >
            {Math.round(zoom * 100)}%
            <ChevronDown className="w-2.5 h-2.5 opacity-60" />
          </button>

          <button
            onClick={() => setZoom(Math.min(2.5, Number((zoom + 0.1).toFixed(2))))}
            className="p-1.5 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          {showZoomMenu && (
            <div className="absolute top-full mt-1 right-0 w-36 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl p-1.5 z-40 text-xs space-y-0.5">
              {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map(val => (
                <button
                  key={val}
                  onClick={() => {
                    setZoom(val);
                    setShowZoomMenu(false);
                  }}
                  className="w-full px-2.5 py-1 rounded-lg text-left hover:bg-neutral-100 dark:hover:bg-neutral-800 font-mono flex justify-between"
                >
                  <span>{Math.round(val * 100)}%</span>
                  {zoom === val && <Check className="w-3 h-3 text-amber-500" />}
                </button>
              ))}
              <div className="h-px bg-neutral-100 dark:bg-neutral-800 my-1" />
              <button
                onClick={() => {
                  fitPage();
                  setShowZoomMenu(false);
                }}
                className="w-full px-2.5 py-1 rounded-lg text-left hover:bg-neutral-100 dark:hover:bg-neutral-800 font-semibold"
              >
                Fit Page
              </button>
              <button
                onClick={() => {
                  fitWidth();
                  setShowZoomMenu(false);
                }}
                className="w-full px-2.5 py-1 rounded-lg text-left hover:bg-neutral-100 dark:hover:bg-neutral-800 font-semibold"
              >
                Fit Width
              </button>
            </div>
          )}
        </div>

        {/* Book Styles */}
        {onOpenStyles && (
          <button
            onClick={onOpenStyles}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-semibold transition-colors"
            title="Global Book Styles"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span className="hidden lg:inline">Styles</span>
          </button>
        )}

        {/* Bulk Edit */}
        {onOpenBulkEdit && (
          <button
            onClick={onOpenBulkEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-semibold transition-colors"
            title="Bulk Edit Pages"
          >
            <Grid className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden lg:inline">Bulk Edit</span>
          </button>
        )}

        {/* KDP Preflight Inspector */}
        {onOpenValidation && (
          <button
            onClick={onOpenValidation}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-semibold transition-colors"
            title="KDP Quality & Preflight Inspector"
          >
            <Shield className="w-3.5 h-3.5 text-emerald-500" />
            <span className="hidden md:inline">Preflight</span>
          </button>
        )}

        {/* Book Settings */}
        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-semibold transition-colors"
            title="Book & Manuscript Settings"
          >
            <Layers className="w-3.5 h-3.5 text-purple-500" />
            <span className="hidden md:inline">Settings</span>
          </button>
        )}

        {/* KDP Book Content Dashboard */}
        <button
          onClick={() => setCurrentRoute('kdp-content')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-bold transition-colors"
          title="KDP Content-First Assistant (Interior & Cover)"
        >
          <BookMarked className="w-3.5 h-3.5 text-amber-500" />
          <span className="hidden sm:inline">KDP Content</span>
        </button>

        {/* Full Book Preview */}
        <button
          onClick={onOpenPreview}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-semibold transition-colors"
          title="Full Manuscript Spread Preview"
        >
          <Eye className="w-3.5 h-3.5 text-blue-500" />
          <span className="hidden sm:inline">Preview</span>
        </button>

        {/* Export Button */}
        <button
          onClick={onOpenExport}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold transition-all shadow-sm shadow-amber-500/20 active:scale-95"
          title="Export KDP Print-Ready Files"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export</span>
        </button>
      </div>
    </div>
  );
};

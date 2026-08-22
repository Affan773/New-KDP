import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  BookOpen,
  Download,
  Search,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Grid,
  FileText,
  Key,
  Sparkles,
} from 'lucide-react';
import { useEditor } from '../../context/EditorContext';
import { useApp } from '../../context/AppContext';
import { PageModel, CanvasElement } from '../../types/project';
import { PageNumberingService } from '../../services/pageNumberingService';

interface EditorPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenExport: () => void;
}

export const EditorPreviewModal: React.FC<EditorPreviewModalProps> = ({
  isOpen,
  onClose,
  onOpenExport,
}) => {
  const { document } = useEditor();
  const { activeProject } = useApp();

  const [viewMode, setViewMode] = useState<'spread' | 'single'>('spread');
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [showThumbnails, setShowThumbnails] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [pageJumpInput, setPageJumpInput] = useState<string>('');

  if (!isOpen || !document) return null;

  const pages = document.pages || [];
  const totalPages = pages.length;

  // Spread calculations
  const totalSpreads = Math.ceil((totalPages + 1) / 2);
  const currentSpreadIndex = Math.floor(currentPageIndex / 2);

  const leftPage = currentSpreadIndex === 0 ? null : pages[currentSpreadIndex * 2 - 1];
  const rightPage = currentSpreadIndex === 0 ? pages[0] : pages[currentSpreadIndex * 2];

  // Navigation handlers
  const handleFirstPage = () => {
    setCurrentPageIndex(0);
  };

  const handlePrevPage = () => {
    if (viewMode === 'spread') {
      const prevSpread = Math.max(0, currentSpreadIndex - 1);
      setCurrentPageIndex(prevSpread === 0 ? 0 : (prevSpread * 2) - 1);
    } else {
      setCurrentPageIndex(Math.max(0, currentPageIndex - 1));
    }
  };

  const handleNextPage = () => {
    if (viewMode === 'spread') {
      const nextSpread = Math.min(totalSpreads - 1, currentSpreadIndex + 1);
      setCurrentPageIndex(nextSpread === 0 ? 0 : (nextSpread * 2) - 1);
    } else {
      setCurrentPageIndex(Math.min(totalPages - 1, currentPageIndex + 1));
    }
  };

  const handleLastPage = () => {
    setCurrentPageIndex(totalPages - 1);
  };

  const handleJumpToPage = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(pageJumpInput, 10);
    if (!isNaN(num) && num >= 1 && num <= totalPages) {
      setCurrentPageIndex(num - 1);
      setPageJumpInput('');
    }
  };

  // Render individual page content
  const renderPageSheet = (page: PageModel | null, isLeft: boolean) => {
    if (!page) {
      return (
        <div className="w-[340px] h-[480px] bg-neutral-900 border border-neutral-800 rounded-lg flex flex-col items-center justify-center text-xs text-neutral-500 italic p-6 text-center shadow-inner">
          <span>Inside Cover Blank</span>
        </div>
      );
    }

    return (
      <div
        className="w-[340px] h-[480px] bg-white text-neutral-900 p-6 flex flex-col justify-between relative shadow-2xl overflow-hidden rounded-md border border-neutral-300 select-none"
        style={{
          backgroundColor: page.backgroundColor || '#FFFFFF',
          transform: `scale(${zoomLevel / 100})`,
          transformOrigin: isLeft ? 'right center' : 'left center',
        }}
      >
        {/* Page Content Elements */}
        <div className="space-y-3 overflow-hidden flex-1">
          {/* Header */}
          <div className="flex items-center justify-between text-[9px] font-mono text-neutral-400 border-b pb-1 mb-2">
            <span>{isLeft ? activeProject?.name : page.name}</span>
            <span>{isLeft ? '' : activeProject?.kdpSettings.trimSize.name}</span>
          </div>

          {/* Canvas Elements Representation */}
          {page.elements.map(el => (
            <div key={el.id} className="text-neutral-800">
              {el.type === 'text' && (() => {
                const isSol = PageNumberingService.isSolutionPage(page);
                const isSolHeading =
                  isSol &&
                  (el.name === 'Solutions Header' ||
                    el.content?.startsWith('Solution') ||
                    el.content?.startsWith('SOLUT'));
                const content =
                  isSolHeading && document
                    ? PageNumberingService.getSolutionPageHeading(page, document.pages, activeProject)
                    : el.content;

                return (
                  <div
                    style={{
                      fontFamily: el.fontFamily || 'Plus Jakarta Sans',
                      fontSize: `${Math.min(14, Math.max(9, (el.fontSize || 12) * 0.7))}px`,
                      fontWeight: el.fontWeight || 'normal',
                      textAlign: (el.textAlign as any) || 'left',
                      color: el.color || '#111827',
                    }}
                    className="leading-snug line-clamp-3"
                  >
                    {content}
                  </div>
                );
              })()}

              {el.type === 'puzzle' && (() => {
                const isSol = PageNumberingService.isSolutionPage(page);
                const puzTitle =
                  isSol && document
                    ? PageNumberingService.getSolutionPageHeading(page, document.pages, activeProject)
                    : el.title || el.name || `[ ${el.puzzleType?.toUpperCase()} PUZZLE ]`;

                return (
                  <div className="my-2 p-3 bg-neutral-50 border border-neutral-300 rounded-lg text-center space-y-1">
                    <div className="font-bold text-[10px] font-mono text-neutral-700">
                      {puzTitle}
                    </div>
                    <div className="text-[9px] text-neutral-500 font-mono">
                      Difficulty: {el.difficulty || 'Medium'} • {el.previewData?.showSolution ? 'Solution View' : 'Puzzle Grid'}
                    </div>
                  </div>
                );
              })()}

              {el.type === 'line' && (
                <div
                  className="w-full my-1 border-t"
                  style={{ borderColor: el.strokeColor || '#D1D5DB' }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Footer Page Number */}
        {(() => {
          const pageIndex = document?.pages?.findIndex(p => p.id === page.id) ?? (page.pageNumber - 1);
          if (PageNumberingService.shouldShowPageNumber(page, pageIndex, activeProject)) {
            return (
              <div className="text-center font-mono text-[10px] font-bold text-neutral-500 border-t pt-1 mt-2">
                {PageNumberingService.getFormattedPageNumber(page, pageIndex, activeProject)}
              </div>
            );
          }
          return (
            <div className="text-center font-mono text-[10px] text-neutral-300 dark:text-neutral-700 border-t pt-1 mt-2">
              -
            </div>
          );
        })()}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      {/* Backdrop */}
      <div onClick={onClose} className="fixed inset-0 bg-neutral-950/90 backdrop-blur-md" />

      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }}
        className="relative w-full max-w-6xl bg-neutral-900 rounded-3xl border border-neutral-800 shadow-2xl overflow-hidden z-10 flex flex-col h-[94vh]"
      >
        {/* Header Toolbar */}
        <div className="p-4 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-3 bg-neutral-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-amber-500/10 text-amber-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white font-display flex items-center gap-2">
                <span>Book Spread Simulator</span>
                <span className="px-2 py-0.5 rounded-full bg-neutral-800 text-[10px] font-mono text-neutral-400">
                  {totalPages} Pages
                </span>
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                {activeProject?.name} • {activeProject?.kdpSettings.trimSize.name} •{' '}
                {activeProject?.kdpSettings.bleed}
              </p>
            </div>
          </div>

          {/* Controls: View Mode, Zoom, Navigation */}
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-neutral-800 p-1 rounded-xl border border-neutral-700 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('spread')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                  viewMode === 'spread' ? 'bg-amber-500 text-neutral-950 font-bold' : 'text-neutral-400 hover:text-white'
                }`}
              >
                2-Page Spread
              </button>
              <button
                type="button"
                onClick={() => setViewMode('single')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                  viewMode === 'single' ? 'bg-amber-500 text-neutral-950 font-bold' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Single Page
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center bg-neutral-800 p-1 rounded-xl border border-neutral-700 text-xs">
              <button
                type="button"
                onClick={() => setZoomLevel(Math.max(50, zoomLevel - 25))}
                className="p-1 text-neutral-400 hover:text-white"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 font-mono text-[11px] font-bold text-neutral-300">
                {zoomLevel}%
              </span>
              <button
                type="button"
                onClick={() => setZoomLevel(Math.min(150, zoomLevel + 25))}
                className="p-1 text-neutral-400 hover:text-white"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Export Shortcut */}
            <button
              onClick={() => {
                onClose();
                onOpenExport();
              }}
              className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-white rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Stage & Thumbnails */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Thumbnails Sidebar */}
          {showThumbnails && (
            <div className="w-full md:w-56 border-b md:border-b-0 md:border-r border-neutral-800 bg-neutral-950/60 p-3 overflow-y-auto space-y-2 max-h-40 md:max-h-none">
              <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 px-1 mb-1">
                Pages ({totalPages})
              </div>

              <div className="grid grid-cols-2 md:grid-cols-1 gap-2">
                {pages.map((p, idx) => {
                  const isSelected = viewMode === 'single' ? idx === currentPageIndex : (idx === currentSpreadIndex * 2 || idx === currentSpreadIndex * 2 - 1);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setCurrentPageIndex(idx)}
                      className={`p-2 rounded-xl border text-left flex items-center justify-between transition-all ${
                        isSelected
                          ? 'border-amber-500 bg-amber-500/10 text-white font-bold'
                          : 'border-neutral-800 bg-neutral-900/80 text-neutral-400 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-mono text-[10px]">p.{p.pageNumber}</span>
                        <span className="text-xs truncate">
                          {PageNumberingService.isSolutionPage(p)
                            ? PageNumberingService.getSolutionPageHeading(p, pages, activeProject)
                            : p.name || 'Page'}
                        </span>
                      </div>
                      {p.isAnswerKey && <Key className="w-3 h-3 text-emerald-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Preview Canvas Stage */}
          <div className="flex-1 overflow-auto flex items-center justify-center p-6 bg-neutral-950 relative">
            {viewMode === 'spread' ? (
              /* Realistic 2-Page Spread View */
              <div className="flex items-center justify-center shadow-2xl rounded-xl overflow-visible p-2 border border-neutral-800/80 bg-neutral-900/60">
                {renderPageSheet(leftPage, true)}
                {/* Spine Fold Shadow */}
                <div className="w-3 h-[480px] bg-gradient-to-r from-neutral-800 via-neutral-950 to-neutral-800 shadow-xl shrink-0" />
                {renderPageSheet(rightPage, false)}
              </div>
            ) : (
              /* Single Page View */
              <div className="flex items-center justify-center shadow-2xl rounded-xl p-2 border border-neutral-800/80 bg-neutral-900/60">
                {renderPageSheet(pages[currentPageIndex], false)}
              </div>
            )}
          </div>
        </div>

        {/* Footer Navigation Bar */}
        <div className="p-3 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-3 bg-neutral-900/90 text-xs">
          {/* Direct Page Jump */}
          <form onSubmit={handleJumpToPage} className="flex items-center gap-2">
            <span className="text-neutral-400 font-mono text-[11px]">Jump to Page:</span>
            <input
              type="number"
              min={1}
              max={totalPages}
              placeholder={`${currentPageIndex + 1}`}
              value={pageJumpInput}
              onChange={e => setPageJumpInput(e.target.value)}
              className="w-16 px-2 py-1 text-center rounded-lg border border-neutral-700 bg-neutral-800 text-white font-mono text-xs focus:outline-hidden focus:border-amber-500"
            />
            <button
              type="submit"
              className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs"
            >
              Go
            </button>
          </form>

          {/* Stepper Navigation Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleFirstPage}
              disabled={currentPageIndex === 0}
              className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white disabled:opacity-30"
              title="First Page"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handlePrevPage}
              disabled={currentPageIndex === 0}
              className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold disabled:opacity-30 flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Prev</span>
            </button>

            <div className="px-3 font-mono font-bold text-amber-400">
              {viewMode === 'spread'
                ? `Spread ${currentSpreadIndex + 1} / ${totalSpreads}`
                : `Page ${currentPageIndex + 1} / ${totalPages}`}
            </div>

            <button
              type="button"
              onClick={handleNextPage}
              disabled={currentPageIndex >= totalPages - 1}
              className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold disabled:opacity-30 flex items-center gap-1"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleLastPage}
              disabled={currentPageIndex >= totalPages - 1}
              className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white disabled:opacity-30"
              title="Last Page"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

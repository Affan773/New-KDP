import React, { useState } from 'react';
import { Plus, Copy, Trash2, ArrowLeft, ArrowRight, Layers, FilePlus, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEditor } from '../../context/EditorContext';
import { useApp } from '../../context/AppContext';
import { PageModel } from '../../types';
import { PageNumberingService } from '../../services/pageNumberingService';
import { EditorBulkPagesModal } from './EditorBulkPagesModal';

export const EditorTimeline: React.FC = () => {
  const { activeProject } = useApp();
  const {
    document,
    currentPageIndex,
    setCurrentPageIndex,
    addPage,
    duplicateCurrentPage,
    deleteCurrentPage,
    reorderPage,
  } = useEditor();

  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const pages = document?.pages || [];

  return (
    <div className="h-28 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-4 py-2 flex items-center gap-3 select-none z-20 shrink-0">
      {/* Page Navigation Left / Right Buttons */}
      <div className="flex items-center gap-1 shrink-0 border-r border-neutral-200 dark:border-neutral-800 pr-3">
        <button
          onClick={() => setCurrentPageIndex(Math.max(0, currentPageIndex - 1))}
          disabled={currentPageIndex <= 0}
          className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-30 text-neutral-700 dark:text-neutral-300 transition-colors"
          title="Previous Page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-xs font-mono font-bold px-1 text-neutral-600 dark:text-neutral-300 whitespace-nowrap">
          {currentPageIndex + 1} / {pages.length}
        </span>
        <button
          onClick={() => setCurrentPageIndex(Math.min(pages.length - 1, currentPageIndex + 1))}
          disabled={currentPageIndex >= pages.length - 1}
          className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-30 text-neutral-700 dark:text-neutral-300 transition-colors"
          title="Next Page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Add Page Buttons */}
      <div className="flex items-center gap-2 shrink-0 border-r border-neutral-200 dark:border-neutral-800 pr-3">
        <button
          onClick={() => addPage()}
          className="h-20 w-14 rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-amber-500 hover:bg-amber-500/5 flex flex-col items-center justify-center gap-1 text-neutral-500 hover:text-amber-500 transition-all"
          title="Add Blank Page"
        >
          <Plus className="w-4 h-4" />
          <span className="text-[9px] font-bold">New Page</span>
        </button>

        <button
          onClick={() => setIsBulkModalOpen(true)}
          className="h-20 w-14 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/80 hover:border-amber-500 hover:text-amber-500 flex flex-col items-center justify-center gap-1 text-neutral-500 transition-all"
          title="Bulk Generate Multiple Pages"
        >
          <FilePlus className="w-4 h-4 text-amber-500" />
          <span className="text-[9px] font-bold">Bulk Add</span>
        </button>
      </div>

      {/* Pages List Strip */}
      <div className="flex-1 flex items-center gap-3 overflow-x-auto h-full py-1">
        {pages.map((page: PageModel, idx: number) => {
          const isActive = idx === currentPageIndex;
          const isSpreadEven = (page.pageNumber || idx + 1) % 2 === 0;

          return (
            <div
              key={page.id}
              onClick={() => setCurrentPageIndex(idx)}
              className={`relative w-16 h-20 rounded-xl border bg-white dark:bg-neutral-800 shrink-0 cursor-pointer flex flex-col items-center justify-between p-1.5 transition-all group ${
                isActive
                  ? 'border-amber-500 ring-2 ring-amber-500/40 shadow-md scale-105'
                  : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-400'
              }`}
            >
              {/* Mini Page Thumbnail Visualizer */}
              <div
                style={{
                  backgroundColor: page.backgroundColor || '#FFFFFF',
                }}
                className="w-full flex-1 rounded-sm border border-neutral-200 dark:border-neutral-700 overflow-hidden relative flex flex-col items-center justify-center shadow-2xs"
              >
                {page.pattern && page.pattern !== 'none' && (
                  <span className="text-[7px] text-amber-600 dark:text-amber-400 font-mono absolute top-0.5 left-0.5">
                    {page.pattern === 'dotGrid' ? '::' : page.pattern === 'lined' ? '≡' : '▦'}
                  </span>
                )}

                {page.elements.length > 0 ? (
                  <div className="space-y-0.5 w-3/4 opacity-60">
                    <div className="h-1 bg-neutral-600 dark:bg-neutral-400 rounded-xs w-full" />
                    <div className="h-1 bg-neutral-400 dark:bg-neutral-600 rounded-xs w-2/3" />
                  </div>
                ) : (
                  <span className="text-[8px] text-neutral-400 font-mono">Blank</span>
                )}
              </div>

              {/* Page Number & Spread Label */}
              <div className="flex items-center justify-between w-full px-0.5 mt-1">
                <span className="text-[8px] font-mono text-neutral-400">
                  {isSpreadEven ? 'L' : 'R'}
                </span>
                <span className="text-[10px] font-mono font-bold text-neutral-700 dark:text-neutral-200">
                  {PageNumberingService.shouldShowPageNumber(page, idx, activeProject)
                    ? PageNumberingService.getFormattedPageNumber(page, idx, activeProject)
                    : page.pageNumber}
                </span>
              </div>

              {/* Quick Hover Reorder / Action Floating Toolbar */}
              {isActive && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:flex items-center gap-1 bg-neutral-900 text-white px-2 py-1 rounded-lg text-[10px] shadow-lg z-30">
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      if (idx > 0) reorderPage(idx, idx - 1);
                    }}
                    disabled={idx === 0}
                    className="hover:text-amber-400 disabled:opacity-30 p-0.5"
                    title="Move Left"
                  >
                    <ArrowLeft className="w-3 h-3" />
                  </button>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      duplicateCurrentPage();
                    }}
                    className="hover:text-amber-400 p-0.5"
                    title="Duplicate Page"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      if (pages.length > 1) deleteCurrentPage();
                    }}
                    disabled={pages.length <= 1}
                    className="hover:text-rose-400 disabled:opacity-30 p-0.5"
                    title="Delete Page"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      if (idx < pages.length - 1) reorderPage(idx, idx + 1);
                    }}
                    disabled={idx >= pages.length - 1}
                    className="hover:text-amber-400 disabled:opacity-30 p-0.5"
                    title="Move Right"
                  >
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bulk Pages Generator Modal */}
      {isBulkModalOpen && (
        <EditorBulkPagesModal
          isOpen={isBulkModalOpen}
          onClose={() => setIsBulkModalOpen(false)}
        />
      )}
    </div>
  );
};

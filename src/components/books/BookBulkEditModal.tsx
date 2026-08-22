import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Sliders,
  Type,
  Grid,
  Sparkles,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Palette,
  Columns,
  Square,
  Bookmark,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useEditor } from '../../context/EditorContext';
import { BulkEditOptions } from '../../types/book';
import { CanvasElement, PageModel } from '../../types/project';

interface BookBulkEditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BookBulkEditModal: React.FC<BookBulkEditModalProps> = ({ isOpen, onClose }) => {
  const { activeProject, updateProject, showToast } = useApp();
  const { document, updateDocument, currentPageIndex } = useEditor();

  const [targetScope, setTargetScope] = useState<'all' | 'section' | 'puzzles_only'>('puzzles_only');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');

  // Bulk Edit Option States
  const [applyFont, setApplyFont] = useState(false);
  const [fontFamily, setFontFamily] = useState('Plus Jakarta Sans');

  const [applyHeadingFont, setApplyHeadingFont] = useState(false);
  const [headingFontFamily, setHeadingFontFamily] = useState('Outfit');

  const [applyWordListCols, setApplyWordListCols] = useState(false);
  const [wordListColumns, setWordListColumns] = useState<1 | 2 | 3>(2);

  const [applyWordListSpacing, setApplyWordListSpacing] = useState(false);
  const [wordListSpacing, setWordListSpacing] = useState(18);

  const [applyBorder, setApplyBorder] = useState(false);
  const [borderStyle, setBorderStyle] = useState<'solid' | 'dashed' | 'dotted' | 'double' | 'none'>('solid');
  const [borderColor, setBorderColor] = useState('#D1D5DB');
  const [borderWidth, setBorderWidth] = useState(1);

  const [applyBackground, setApplyBackground] = useState(false);
  const [pageBackground, setPageBackground] = useState('#FFFFFF');

  const [applyHeaderFooter, setApplyHeaderFooter] = useState(false);
  const [headerText, setHeaderText] = useState('');
  const [footerText, setFooterText] = useState('');

  // Confirmation state for large bulk edit
  const [showConfirm, setShowConfirm] = useState(false);

  if (!isOpen || !activeProject || !document) return null;

  const pages = document.pages || [];
  const sections = activeProject.sections || [];

  // Determine affected pages
  const getAffectedPages = (): { index: number; page: PageModel }[] => {
    if (targetScope === 'all') {
      return pages.map((p, idx) => ({ index: idx, page: p }));
    } else if (targetScope === 'section') {
      const targetSecId = selectedSectionId || (sections[0]?.id ?? '');
      return pages
        .map((p, idx) => ({ index: idx, page: p }))
        .filter(({ page }) => page.sectionId === targetSecId);
    } else {
      // puzzles_only
      return pages
        .map((p, idx) => ({ index: idx, page: p }))
        .filter(({ page }) => page.pageType === 'puzzle' || page.elements.some(el => el.type === 'puzzle'));
    }
  };

  const affectedPages = getAffectedPages();
  const affectedCount = affectedPages.length;

  const handleExecuteBulkEdit = () => {
    if (affectedCount === 0) {
      showToast({ type: 'warning', message: 'No matching pages selected for bulk modification.' });
      return;
    }

    const updatedPages = [...pages];

    affectedPages.forEach(({ index, page }) => {
      let updatedElements = [...page.elements];

      // 1. Font Family changes
      if (applyFont) {
        updatedElements = updatedElements.map(el => {
          if (el.type === 'text') {
            return { ...el, fontFamily };
          }
          if (el.type === 'puzzle') {
            return {
              ...el,
              previewData: {
                ...(el.previewData || {}),
                fontFamily,
              },
            };
          }
          return el;
        });
      }

      // 2. Heading Font changes
      if (applyHeadingFont) {
        updatedElements = updatedElements.map(el => {
          if (el.type === 'text' && (el.name?.toLowerCase().includes('heading') || el.name?.toLowerCase().includes('title'))) {
            return { ...el, fontFamily: headingFontFamily };
          }
          return el;
        });
      }

      // 3. Word list columns & spacing
      if (applyWordListCols || applyWordListSpacing) {
        updatedElements = updatedElements.map(el => {
          if (el.type === 'puzzle') {
            return {
              ...el,
              previewData: {
                ...(el.previewData || {}),
                ...(applyWordListCols ? { wordListColumns } : {}),
                ...(applyWordListSpacing ? { wordListSpacing } : {}),
              },
            };
          }
          return el;
        });
      }

      // 4. Border adjustments
      if (applyBorder) {
        updatedElements = updatedElements.map(el => {
          if (el.type === 'puzzle') {
            return {
              ...el,
              previewData: {
                ...(el.previewData || {}),
                gridBorderColor: borderColor,
                gridBorderStyle: borderStyle,
                gridBorderWidth: borderWidth,
              },
            };
          }
          if (el.type === 'shape') {
            return {
              ...el,
              strokeColor: borderColor,
              strokeWidth: borderWidth,
            };
          }
          return el;
        });
      }

      // 5. Header / Footer update
      if (applyHeaderFooter) {
        // Look for existing header/footer text elements or create them
        if (headerText.trim()) {
          const headerEl = updatedElements.find(e => e.name === 'Page Header');
          if (headerEl && headerEl.type === 'text') {
            headerEl.content = headerText;
          }
        }
      }

      updatedPages[index] = {
        ...page,
        backgroundColor: applyBackground ? pageBackground : page.backgroundColor,
        elements: updatedElements,
      };
    });

    updateDocument({ ...document, pages: updatedPages }, true);
    setShowConfirm(false);
    onClose();

    showToast({
      type: 'success',
      message: `Bulk edit successfully applied to ${affectedCount} page(s).`,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div onClick={onClose} className="fixed inset-0 bg-neutral-950/80 backdrop-blur-xs" />

      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }}
        className="relative w-full max-w-3xl bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden z-10 flex flex-col max-h-[88vh]"
      >
        {/* Header */}
        <div className="p-5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white font-display">
                Bulk Style & Layout Editor
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Apply consistent typography, word-list columns, borders, and margins across multiple pages simultaneously
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scope Selection Strip */}
        <div className="p-4 bg-neutral-50 dark:bg-neutral-950 border-b border-neutral-100 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-neutral-500 uppercase tracking-wider text-[11px]">
              Apply Changes To:
            </span>
            <div className="flex items-center gap-1.5 bg-white dark:bg-neutral-900 p-1 rounded-xl border border-neutral-200 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setTargetScope('puzzles_only')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  targetScope === 'puzzles_only'
                    ? 'bg-amber-500 text-neutral-950 font-bold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                Puzzle Pages Only ({pages.filter(p => p.pageType === 'puzzle' || p.elements.some(e => e.type === 'puzzle')).length})
              </button>

              <button
                type="button"
                onClick={() => setTargetScope('all')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  targetScope === 'all'
                    ? 'bg-amber-500 text-neutral-950 font-bold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                All Pages ({pages.length})
              </button>

              {sections.length > 0 && (
                <button
                  type="button"
                  onClick={() => setTargetScope('section')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                    targetScope === 'section'
                      ? 'bg-amber-500 text-neutral-950 font-bold'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  Specific Section
                </button>
              )}
            </div>
          </div>

          {targetScope === 'section' && sections.length > 0 && (
            <select
              value={selectedSectionId || sections[0]?.id}
              onChange={e => setSelectedSectionId(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs font-semibold"
            >
              {sections.map(sec => (
                <option key={sec.id} value={sec.id}>
                  {sec.title} ({sec.pageIds?.length || 0} pages)
                </option>
              ))}
            </select>
          )}

          <div className="font-mono font-bold text-amber-600 dark:text-amber-400 text-xs">
            Target: {affectedCount} Pages
          </div>
        </div>

        {/* Options Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* 1. Typography */}
          <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={applyFont}
                  onChange={e => setApplyFont(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded"
                />
                <span className="font-bold text-xs text-neutral-900 dark:text-white uppercase tracking-wider">
                  Update Body / Puzzle Font Family
                </span>
              </label>
            </div>

            {applyFont && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                {['Plus Jakarta Sans', 'Outfit', 'Inter', 'Merriweather', 'Quicksand', 'Space Grotesk', 'Courier Prime', 'Roboto Mono'].map(f => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFontFamily(f)}
                    className={`p-2 rounded-xl border text-center transition-all ${
                      fontFamily === f
                        ? 'border-amber-500 bg-amber-500/10 font-bold text-neutral-900 dark:text-white'
                        : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 2. Word Search / Word List Layout */}
          <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={applyWordListCols}
                  onChange={e => setApplyWordListCols(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded"
                />
                <span className="font-bold text-xs text-neutral-900 dark:text-white uppercase tracking-wider">
                  Word List Column Count
                </span>
              </label>
            </div>

            {applyWordListCols && (
              <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
                {[1, 2, 3].map(cols => (
                  <button
                    key={cols}
                    type="button"
                    onClick={() => setWordListColumns(cols as any)}
                    className={`py-2 rounded-xl border text-center font-bold transition-all ${
                      wordListColumns === cols
                        ? 'border-amber-500 bg-amber-500/10 text-neutral-900 dark:text-white'
                        : 'border-neutral-200 dark:border-neutral-800 text-neutral-500'
                    }`}
                  >
                    {cols} {cols === 1 ? 'Column' : 'Columns'}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 3. Border & Dividers */}
          <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={applyBorder}
                  onChange={e => setApplyBorder(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded"
                />
                <span className="font-bold text-xs text-neutral-900 dark:text-white uppercase tracking-wider">
                  Puzzle Grid & Card Borders
                </span>
              </label>
            </div>

            {applyBorder && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
                <div>
                  <label className="block text-[11px] text-neutral-500 mb-1">Border Style</label>
                  <select
                    value={borderStyle}
                    onChange={e => setBorderStyle(e.target.value as any)}
                    className="w-full px-3 py-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800"
                  >
                    <option value="solid">Solid Line</option>
                    <option value="double">Double Rule</option>
                    <option value="dashed">Dashed</option>
                    <option value="dotted">Dotted</option>
                    <option value="none">No Border</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-neutral-500 mb-1">Border Width</label>
                  <select
                    value={borderWidth}
                    onChange={e => setBorderWidth(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800"
                  >
                    <option value={1}>1px (Hairline)</option>
                    <option value={1.5}>1.5px (Medium)</option>
                    <option value={2}>2px (Bold)</option>
                    <option value={3}>3px (Heavy)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-neutral-500 mb-1">Border Color</label>
                  <input
                    type="color"
                    value={borderColor}
                    onChange={e => setBorderColor(e.target.value)}
                    className="w-full h-8 rounded-xl cursor-pointer p-0.5 border border-neutral-300 dark:border-neutral-700"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 4. Page Background */}
          <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={applyBackground}
                  onChange={e => setApplyBackground(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded"
                />
                <span className="font-bold text-xs text-neutral-900 dark:text-white uppercase tracking-wider">
                  Page Canvas Background
                </span>
              </label>
            </div>

            {applyBackground && (
              <div className="flex items-center gap-3 pt-1 text-xs">
                {[
                  { id: '#FFFFFF', label: 'Pure White (KDP Standard)' },
                  { id: '#FBFBFB', label: 'Off-White' },
                  { id: '#F9FAFB', label: 'Cool White' },
                ].map(bg => (
                  <button
                    key={bg.id}
                    type="button"
                    onClick={() => setPageBackground(bg.id)}
                    className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
                      pageBackground === bg.id
                        ? 'border-amber-500 bg-amber-500/10'
                        : 'border-neutral-200 dark:border-neutral-800'
                    }`}
                  >
                    <div className="w-3.5 h-3.5 rounded-full border border-neutral-300" style={{ backgroundColor: bg.id }} />
                    <span>{bg.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-900/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => {
              if (affectedCount >= 20) {
                setShowConfirm(true);
              } else {
                handleExecuteBulkEdit();
              }
            }}
            disabled={!applyFont && !applyHeadingFont && !applyWordListCols && !applyWordListSpacing && !applyBorder && !applyBackground}
            className="px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition-all shadow-md shadow-amber-500/20 disabled:opacity-40 flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Apply to {affectedCount} Pages</span>
          </button>
        </div>

        {/* Confirmation Modal Overlay for Large Changes */}
        {showConfirm && (
          <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-xs flex items-center justify-center p-6">
            <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 max-w-md w-full space-y-4 shadow-2xl">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                  Confirm Bulk Modification
                </h3>
                <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                  You are about to modify typography and layout parameters on{' '}
                  <strong className="text-neutral-900 dark:text-white font-mono font-bold">
                    {affectedCount} pages
                  </strong>
                  . This operation can be undone via Undo (Ctrl+Z).
                </p>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirm(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteBulkEdit}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs"
                >
                  Confirm & Apply
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

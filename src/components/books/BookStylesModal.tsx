import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Palette,
  Sparkles,
  Check,
  Copy,
  Plus,
  RefreshCw,
  Sliders,
  Type,
  Grid,
  CheckCircle2,
  Bookmark,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useEditor } from '../../context/EditorContext';
import { BUILTIN_BOOK_THEMES, DEFAULT_BOOK_THEME } from '../../constants/bookThemes';
import { BookTheme } from '../../types/book';

interface BookStylesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BookStylesModal: React.FC<BookStylesModalProps> = ({ isOpen, onClose }) => {
  const { activeProject, updateProject, showToast } = useApp();
  const { document, updateDocument } = useEditor();

  const currentTheme = activeProject?.bookSettings?.theme || DEFAULT_BOOK_THEME;
  const [themesList, setThemesList] = useState<BookTheme[]>(BUILTIN_BOOK_THEMES);
  const [selectedThemeId, setSelectedThemeId] = useState<string>(currentTheme.id || BUILTIN_BOOK_THEMES[0].id);
  const [applyScope, setApplyScope] = useState<'all' | 'puzzle_pages' | 'solution_pages' | 'front_matter'>('all');

  // Edit Mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editingTheme, setEditingTheme] = useState<BookTheme>({ ...currentTheme });

  if (!isOpen || !activeProject) return null;

  const selectedTheme = themesList.find(t => t.id === selectedThemeId) || themesList[0];

  const handleApplyTheme = (themeToApply: BookTheme) => {
    // 1. Update Project Settings
    const updatedProject = {
      ...activeProject,
      bookSettings: {
        ...(activeProject.bookSettings || ({} as any)),
        theme: themeToApply,
      },
    };
    updateProject(updatedProject);

    // 2. Propagate to Canvas Elements in Document according to scope
    if (document && document.pages.length > 0) {
      const updatedPages = document.pages.map(page => {
        const isSolution = page.pageType === 'answer_key' || page.name.toLowerCase().includes('solution') || page.name.toLowerCase().includes('answer');
        const isFrontMatter = page.pageType === 'title' || page.pageType === 'copyright' || page.pageType === 'instructions' || page.pageType === 'toc' || page.pageNumber <= 3;
        const isPuzzle = !isSolution && !isFrontMatter;

        let shouldUpdate = false;
        if (applyScope === 'all') shouldUpdate = true;
        else if (applyScope === 'puzzle_pages' && isPuzzle) shouldUpdate = true;
        else if (applyScope === 'solution_pages' && isSolution) shouldUpdate = true;
        else if (applyScope === 'front_matter' && isFrontMatter) shouldUpdate = true;

        if (!shouldUpdate) return page;

        return {
          ...page,
          elements: page.elements.map(el => {
            if (el.type === 'text') {
              const isHeading = el.name?.toLowerCase().includes('heading') || el.name?.toLowerCase().includes('title');
              return {
                ...el,
                fontFamily: isHeading ? themeToApply.fontHeading : themeToApply.fontBody,
                color: isHeading ? themeToApply.primaryColor : (el.color || themeToApply.primaryColor),
              };
            }
            if (el.type === 'puzzle') {
              return {
                ...el,
                previewData: {
                  ...(el.previewData || {}),
                  fontFamily: themeToApply.fontBody,
                  gridBorderColor: themeToApply.borderColor,
                  gridBorderStyle: themeToApply.borderStyle,
                  gridBorderWidth: themeToApply.borderWidth,
                },
              };
            }
            if (el.type === 'line') {
              return {
                ...el,
                strokeColor: themeToApply.borderColor,
                strokeWidth: themeToApply.borderWidth,
              };
            }
            return el;
          }),
        };
      });

      updateDocument({ ...document, pages: updatedPages }, true);
    }

    showToast({
      type: 'success',
      message: `Theme "${themeToApply.name}" applied to ${applyScope.replace('_', ' ')}.`,
    });
    onClose();
  };

  const handleDuplicateTheme = (theme: BookTheme) => {
    const newTheme: BookTheme = {
      ...theme,
      id: `theme-custom-${Date.now()}`,
      name: `${theme.name} (Custom Copy)`,
      description: `Customized variant of ${theme.name}`,
    };
    setThemesList(prev => [newTheme, ...prev]);
    setSelectedThemeId(newTheme.id);
    setEditingTheme(newTheme);
    setIsEditing(true);
    showToast({
      type: 'info',
      message: 'Created custom theme copy. Adjust settings below.',
    });
  };

  const handleCreateNewTheme = () => {
    const newTheme: BookTheme = {
      id: `theme-custom-${Date.now()}`,
      name: 'My Custom Book Style',
      description: 'Custom handcrafted typography and borders.',
      fontHeading: 'Outfit',
      fontBody: 'Plus Jakarta Sans',
      fontAccent: 'Outfit',
      headingSize: 24,
      bodySize: 14,
      primaryColor: '#111827',
      secondaryColor: '#4B5563',
      borderColor: '#E5E7EB',
      borderStyle: 'solid',
      borderWidth: 1,
      borderRadius: 8,
      pageSpacing: 24,
      puzzleGridStyle: 'clean',
    };
    setThemesList(prev => [newTheme, ...prev]);
    setSelectedThemeId(newTheme.id);
    setEditingTheme(newTheme);
    setIsEditing(true);
  };

  const handleSaveCustomTheme = () => {
    setThemesList(prev => prev.map(t => (t.id === editingTheme.id ? editingTheme : t)));
    setIsEditing(false);
    showToast({
      type: 'success',
      message: 'Saved custom style settings.',
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
        className="relative w-full max-w-4xl bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden z-10 flex flex-col max-h-[88vh]"
      >
        {/* Header */}
        <div className="p-5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white font-display">
                Global Book Styles & Themes
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Cohesive typographic hierarchies, puzzle grid line-weights, and safe print styling
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCreateNewTheme}
              className="px-3 py-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Style</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Theme Selector Sidebar */}
          <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-neutral-100 dark:border-neutral-800 overflow-y-auto p-4 space-y-2 bg-neutral-50/50 dark:bg-neutral-950/50 max-h-56 md:max-h-none">
            <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider px-2 mb-1">
              Available Styles ({themesList.length})
            </div>

            {themesList.map(t => {
              const isSelected = t.id === selectedThemeId;
              const isCurrent = activeProject.bookSettings?.theme?.id === t.id;

              return (
                <div
                  key={t.id}
                  onClick={() => {
                    setSelectedThemeId(t.id);
                    setEditingTheme({ ...t });
                    setIsEditing(false);
                  }}
                  className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'border-amber-500 bg-amber-500/5 dark:bg-amber-500/10 shadow-xs'
                      : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
                      {t.name}
                    </h4>
                    {isCurrent && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono font-bold">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-neutral-500 line-clamp-2 mt-1">
                    {t.description}
                  </p>

                  <div className="flex items-center gap-2 mt-2 text-[10px] font-mono text-neutral-400">
                    <span className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800">
                      {t.fontHeading}
                    </span>
                    <span>•</span>
                    <span className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800">
                      {t.fontBody}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Theme Details & Customizer */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white font-display">
                  {selectedTheme.name}
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">{selectedTheme.description}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDuplicateTheme(selectedTheme)}
                  className="px-3 py-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Duplicate</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEditingTheme({ ...selectedTheme });
                    setIsEditing(!isEditing);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 ${
                    isEditing
                      ? 'bg-amber-500 text-neutral-950 font-bold'
                      : 'border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>{isEditing ? 'Close Editor' : 'Edit Style'}</span>
                </button>
              </div>
            </div>

            {/* Editable Configuration Controls */}
            {isEditing ? (
              <div className="space-y-4 p-4 rounded-2xl border border-amber-500/30 bg-amber-500/5">
                <div className="font-bold text-xs text-neutral-900 dark:text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-amber-500" />
                  <span>Custom Style Parameters</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-500 mb-1">
                      Heading Font Family
                    </label>
                    <select
                      value={editingTheme.fontHeading}
                      onChange={e => setEditingTheme({ ...editingTheme, fontHeading: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800"
                    >
                      {['Outfit', 'Cinzel', 'Space Grotesk', 'Quicksand', 'Bitter', 'Montserrat', 'Playfair Display', 'Inter'].map(f => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-500 mb-1">
                      Body & Grid Font Family
                    </label>
                    <select
                      value={editingTheme.fontBody}
                      onChange={e => setEditingTheme({ ...editingTheme, fontBody: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800"
                    >
                      {['Plus Jakarta Sans', 'Merriweather', 'Inter', 'Poppins', 'Roboto Mono', 'Courier Prime'].map(f => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-500 mb-1">
                      Border Style
                    </label>
                    <select
                      value={editingTheme.borderStyle}
                      onChange={e => setEditingTheme({ ...editingTheme, borderStyle: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800"
                    >
                      <option value="solid">Solid</option>
                      <option value="double">Double</option>
                      <option value="dashed">Dashed</option>
                      <option value="dotted">Dotted</option>
                      <option value="none">None</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-500 mb-1">
                      Grid Style Archetype
                    </label>
                    <select
                      value={editingTheme.puzzleGridStyle}
                      onChange={e => setEditingTheme({ ...editingTheme, puzzleGridStyle: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800"
                    >
                      <option value="clean">Clean</option>
                      <option value="classic">Classic</option>
                      <option value="bold">Bold</option>
                      <option value="minimal">Minimal</option>
                      <option value="playful">Playful</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleSaveCustomTheme}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition-all"
                  >
                    Save Custom Parameters
                  </button>
                </div>
              </div>
            ) : null}

            {/* Live Style Preview Card */}
            <div className="p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 shadow-sm space-y-4">
              <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                Live Manuscript Preview
              </div>

              <div className="space-y-2 border-b pb-4" style={{ borderColor: selectedTheme.borderColor }}>
                <h2
                  className="font-bold tracking-tight"
                  style={{
                    fontFamily: selectedTheme.fontHeading,
                    fontSize: `${selectedTheme.headingSize}px`,
                    color: selectedTheme.primaryColor,
                  }}
                >
                  PUZZLE #01: WORD SEARCH EXPLORER
                </h2>
                <p
                  className="text-xs leading-relaxed"
                  style={{
                    fontFamily: selectedTheme.fontBody,
                    fontSize: `${selectedTheme.bodySize}px`,
                    color: selectedTheme.secondaryColor,
                  }}
                >
                  Find all hidden words placed horizontally, vertically, or diagonally in the letter matrix.
                </p>
              </div>

              {/* Sample Grid Card */}
              <div
                className="p-4 rounded-xl flex items-center justify-between"
                style={{
                  borderWidth: `${selectedTheme.borderWidth}px`,
                  borderStyle: selectedTheme.borderStyle,
                  borderColor: selectedTheme.borderColor,
                  borderRadius: `${selectedTheme.borderRadius}px`,
                }}
              >
                <div className="font-mono text-xs font-bold tracking-widest text-neutral-700 dark:text-neutral-300">
                  W O R D • S E A R C H • G R I D
                </div>
                <span className="text-[11px] font-semibold text-neutral-400">
                  Style: {selectedTheme.puzzleGridStyle}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-50/50 dark:bg-neutral-900/50">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-neutral-500">Apply Scope:</span>
            <select
              value={applyScope}
              onChange={e => setApplyScope(e.target.value as any)}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200"
            >
              <option value="all">Entire Manuscript</option>
              <option value="puzzle_pages">Puzzle Pages Only</option>
              <option value="solution_pages">Answer Keys Only</option>
              <option value="front_matter">Front Matter Only</option>
            </select>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => handleApplyTheme(selectedTheme)}
              className="px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition-all shadow-md shadow-amber-500/20 flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Apply "{selectedTheme.name}"</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

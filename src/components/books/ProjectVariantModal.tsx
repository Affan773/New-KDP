import React, { useState } from 'react';
import {
  X,
  Copy,
  Sparkles,
  Layers,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Type,
  Maximize2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { STANDARD_TRIM_SIZES } from '../../constants/kdp';
import { BUILTIN_BOOK_THEMES } from '../../constants/bookThemes';
import { BookGenerationService } from '../../services/bookGenerationService';
import { StorageService } from '../../services/storageService';
import { Project } from '../../types';

interface ProjectVariantModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceProject: Project;
}

export const ProjectVariantModal: React.FC<ProjectVariantModalProps> = ({
  isOpen,
  onClose,
  sourceProject,
}) => {
  const { createProject, openProjectInEditor, showToast } = useApp();

  const [variantType, setVariantType] = useState<
    'large_print' | 'kids_edition' | 'spanish_edition' | 'expanded_100' | 'pocket_format' | 'custom'
  >('large_print');
  const [newTitle, setNewTitle] = useState(`${sourceProject.name} (Large Print Edition)`);
  const [newSubtitle, setNewSubtitle] = useState('Senior-Friendly Extra Large Type with Clear Solutions');
  const [selectedTrimId, setSelectedTrimId] = useState(sourceProject.kdpSettings?.trimSize?.id || '8.5x11');
  const [selectedThemeId, setSelectedThemeId] = useState('theme-large-print');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen || !sourceProject) return null;

  const handleVariantTypeChange = (type: typeof variantType) => {
    setVariantType(type);
    switch (type) {
      case 'large_print':
        setNewTitle(`${sourceProject.name} (Large Print Edition)`);
        setNewSubtitle('Senior-Friendly Extra Large 18pt+ Type with High Contrast Solutions');
        setSelectedTrimId('8.5x11');
        setSelectedThemeId('theme-large-print');
        break;
      case 'kids_edition':
        setNewTitle(`${sourceProject.name} for Kids`);
        setNewSubtitle('Fun & Engaging Activity Puzzles Designed for Ages 6–12');
        setSelectedTrimId('8.5x11');
        setSelectedThemeId('theme-junior-fun');
        break;
      case 'spanish_edition':
        setNewTitle(`${sourceProject.name} (Edición en Español)`);
        setNewSubtitle('Rompecabezas y pasatiempos con soluciones completas');
        setSelectedThemeId('theme-classic-book');
        break;
      case 'pocket_format':
        setNewTitle(`${sourceProject.name} (Pocket Edition)`);
        setNewSubtitle('Compact Travel-Ready Puzzles for On-the-Go Solving');
        setSelectedTrimId('6x9');
        setSelectedThemeId('theme-clean-minimal');
        break;
      case 'expanded_100':
        setNewTitle(`${sourceProject.name} (100 Puzzles Ultimate Edition)`);
        setNewSubtitle('Expanded Giant Collection for Dedicated Solvers');
        break;
      default:
        break;
    }
  };

  const handleCreateVariant = () => {
    setIsProcessing(true);
    try {
      const sourceDoc = StorageService.getDocument(sourceProject.documentId);
      if (!sourceDoc) {
        throw new Error('Could not find original project manuscript.');
      }

      const targetTrim = STANDARD_TRIM_SIZES.find(t => t.id === selectedTrimId);
      const targetTheme = BUILTIN_BOOK_THEMES.find(t => t.id === selectedThemeId);

      const { project, document } = BookGenerationService.createProjectVariant(
        sourceProject,
        sourceDoc,
        {
          variantType,
          newTitle: newTitle.trim() || `${sourceProject.name} (Variant)`,
          newSubtitle: newSubtitle.trim(),
          newTrimSize: targetTrim,
          newTheme: targetTheme,
        }
      );

      createProject(project, document);
      showToast({
        type: 'success',
        title: 'Variant Created',
        message: `Created variant "${project.name}" without modifying the original project.`,
      });
      openProjectInEditor(project.id);
      onClose();
    } catch (err: any) {
      console.error('Failed to create variant:', err);
      showToast({ type: 'error', message: err.message || 'Failed to create project variant.' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-xl bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Copy className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-900 dark:text-white font-display">
                Create Independent Project Variant
              </h2>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Clone into an alternative edition (Large Print, Spanish, Pocket, Kids).
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Variant Presets */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-2">
              Select Variant Archetype
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'large_print', label: 'Large Print Senior', icon: <Type className="w-3.5 h-3.5" /> },
                { id: 'kids_edition', label: 'Kids / Junior Edition', icon: <Sparkles className="w-3.5 h-3.5" /> },
                { id: 'spanish_edition', label: 'Spanish Edition', icon: <BookOpen className="w-3.5 h-3.5" /> },
                { id: 'pocket_format', label: '6×9 Pocket Edition', icon: <Maximize2 className="w-3.5 h-3.5" /> },
                { id: 'expanded_100', label: '100+ Puzzles Edition', icon: <Layers className="w-3.5 h-3.5" /> },
                { id: 'custom', label: 'Custom Clone', icon: <Copy className="w-3.5 h-3.5" /> },
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleVariantTypeChange(opt.id as any)}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold text-left transition-all ${
                    variantType === opt.id
                      ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 shadow-xs'
                      : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/60 text-neutral-700 dark:text-neutral-300 hover:border-neutral-300'
                  }`}
                >
                  {opt.icon}
                  <span className="truncate">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Title & Subtitle */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                Variant Title
              </label>
              <input
                type="text"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                Variant Subtitle
              </label>
              <input
                type="text"
                value={newSubtitle}
                onChange={e => setNewSubtitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-700 dark:text-neutral-300 focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
          </div>

          {/* Safety Notice */}
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              The original project "{sourceProject.name}" will remain completely untouched. A deep copy with independent pages and IDs will be generated.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-900/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={isProcessing}
            onClick={handleCreateVariant}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition-all shadow-md shadow-amber-500/20 flex items-center gap-2"
          >
            <Copy className="w-4 h-4" />
            <span>Create Independent Variant</span>
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  LayoutTemplate,
  Search,
  BookOpen,
  Grid3X3,
  Palette,
  Calendar,
  Sparkles,
  ArrowRight,
  Eye,
  CheckCircle2,
  X,
  Sliders,
} from 'lucide-react';
import { DEMO_TEMPLATES } from '../../constants/templates';
import { useApp } from '../../context/AppContext';
import { Template } from '../../types';
import { TemplateCustomizerModal } from './TemplateCustomizerModal';

export const TemplatesView: React.FC = () => {
  const { createProjectFromTemplate } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [customizingTemplate, setCustomizingTemplate] = useState<Template | null>(null);

  const categories = ['All', 'Puzzle Books', 'Planners', 'Journals', 'Coloring', 'Activity Books'];

  const filteredTemplates = DEMO_TEMPLATES.filter(t => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || t.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white font-display">
            Interior Templates & Layout Architecture
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Pre-formatted, Amazon KDP verified interiors ready to launch in one click or visually customize.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-4">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search templates by niche, layout, or keywords..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {/* Categories Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-neutral-950 font-bold shadow-xs'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map(tmpl => (
          <div
            key={tmpl.id}
            className="rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-xs hover:border-amber-500/40 hover:shadow-lg transition-all flex flex-col justify-between group"
          >
            {/* Thumbnail Header */}
            <div className="h-44 bg-neutral-100 dark:bg-neutral-800 overflow-hidden relative">
              <img
                src={tmpl.thumbnail}
                alt={tmpl.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
              <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-neutral-950/80 text-white backdrop-blur-xs">
                {tmpl.category}
              </span>
              <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/90 dark:bg-neutral-900/90 text-neutral-900 dark:text-white backdrop-blur-xs">
                {tmpl.pageSize.name}
              </span>
            </div>

            {/* Template Info Body */}
            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white mb-1.5 group-hover:text-amber-500 transition-colors">
                  {tmpl.name}
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed mb-4 line-clamp-2">
                  {tmpl.description}
                </p>

                <div className="flex flex-wrap gap-1.5 mb-4">
                  {tmpl.tags.slice(0, 3).map(tag => (
                    <span
                      key={tag}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPreviewTemplate(tmpl)}
                    className="px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-semibold flex items-center gap-1"
                    title="Preview layout"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Preview</span>
                  </button>

                  <button
                    onClick={() => setCustomizingTemplate(tmpl)}
                    className="px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-semibold flex items-center gap-1"
                    title="Customize fonts, borders, margins"
                  >
                    <Sliders className="w-3.5 h-3.5 text-amber-500" />
                    <span>Customize</span>
                  </button>
                </div>

                <button
                  onClick={() => createProjectFromTemplate(tmpl)}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition-all shadow-sm shadow-amber-500/20 active:scale-95 flex items-center gap-1"
                >
                  <span>Use</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setPreviewTemplate(null)} className="fixed inset-0 bg-black/70 backdrop-blur-xs" />
          <div className="relative w-full max-w-lg bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl p-6 z-10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <h3 className="font-bold text-base text-neutral-900 dark:text-white font-display">
                {previewTemplate.name}
              </h3>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="h-56 rounded-2xl overflow-hidden bg-neutral-100 dark:bg-neutral-800">
              <img
                src={previewTemplate.thumbnail}
                alt={previewTemplate.name}
                className="w-full h-full object-cover"
              />
            </div>

            <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
              {previewTemplate.description}
            </p>

            <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-neutral-500">Trim Size:</span>
                <span className="font-bold text-neutral-900 dark:text-white font-mono">
                  {previewTemplate.pageSize.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Suggested Page Count:</span>
                <span className="font-bold text-neutral-900 dark:text-white font-mono">
                  {previewTemplate.pageCount || 60} pages
                </span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                onClick={() => setPreviewTemplate(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-400"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const tmpl = previewTemplate;
                  setPreviewTemplate(null);
                  setCustomizingTemplate(tmpl);
                }}
                className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-semibold flex items-center gap-1.5"
              >
                <Sliders className="w-3.5 h-3.5 text-amber-500" />
                <span>Customize</span>
              </button>
              <button
                onClick={() => {
                  const tmpl = previewTemplate;
                  setPreviewTemplate(null);
                  createProjectFromTemplate(tmpl);
                }}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs shadow-md shadow-amber-500/20"
              >
                Create Book With Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customizer Modal */}
      {customizingTemplate && (
        <TemplateCustomizerModal
          isOpen={true}
          template={customizingTemplate}
          onClose={() => setCustomizingTemplate(null)}
          onApply={customized => {
            setCustomizingTemplate(null);
            createProjectFromTemplate(customized);
          }}
        />
      )}
    </div>
  );
};


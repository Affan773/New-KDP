import React, { useState } from 'react';
import { X, Layers, Sparkles, Check } from 'lucide-react';
import { useEditor } from '../../context/EditorContext';
import { CanvasElement } from '../../types';

interface EditorBulkPagesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EditorBulkPagesModal: React.FC<EditorBulkPagesModalProps> = ({ isOpen, onClose }) => {
  const { bulkAddPages } = useEditor();
  const [pageCount, setPageCount] = useState<number>(20);
  const [pageLayout, setPageLayout] = useState<'blank' | 'dotGrid' | 'lined' | 'borderFrame'>('blank');

  if (!isOpen) return null;

  const handleGenerate = () => {
    let templateElements: CanvasElement[] | undefined = undefined;

    if (pageLayout === 'lined') {
      templateElements = Array.from({ length: 22 }).map((_, r) => ({
        id: `line-tmpl-${r}`,
        type: 'line' as const,
        x: 60,
        y: 100 + r * 30,
        width: 456,
        height: 1,
        rotation: 0,
        zIndex: 1,
        opacity: 0.8,
        strokeColor: '#D1D5DB',
        strokeWidth: 1,
        dashPattern: 'solid' as const,
      }));
    } else if (pageLayout === 'borderFrame') {
      templateElements = [
        {
          id: `frame-tmpl-1`,
          type: 'shape' as const,
          shapeType: 'rectangle' as const,
          x: 40,
          y: 40,
          width: 496,
          height: 760,
          rotation: 0,
          zIndex: 1,
          opacity: 1,
          fillColor: 'transparent',
          strokeColor: '#374151',
          strokeWidth: 2,
          borderRadius: 4,
        },
      ];
    } else if (pageLayout === 'dotGrid') {
      const dots: CanvasElement[] = [];
      for (let r = 0; r < 20; r++) {
        for (let c = 0; c < 14; c++) {
          dots.push({
            id: `dot-tmpl-${r}-${c}`,
            type: 'shape' as const,
            shapeType: 'circle' as const,
            x: 70 + c * 32,
            y: 100 + r * 32,
            width: 3,
            height: 3,
            rotation: 0,
            zIndex: 1,
            opacity: 0.5,
            fillColor: '#9CA3AF',
          });
        }
      }
      templateElements = dots;
    }

    bulkAddPages(pageCount, templateElements);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
      <div className="w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-white font-display">
                Bulk Add Manuscript Pages
              </h3>
              <p className="text-xs text-neutral-500">
                Quickly populate your interior layout with repetitive pages
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Page Count Selection */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400">
            Number of Pages to Add
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[10, 20, 50, 100].map(cnt => (
              <button
                key={cnt}
                onClick={() => setPageCount(cnt)}
                className={`py-2 rounded-xl text-xs font-bold font-mono transition-all border ${
                  pageCount === cnt
                    ? 'bg-amber-500 text-neutral-950 border-amber-500 shadow-xs'
                    : 'bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-amber-400'
                }`}
              >
                +{cnt}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 pt-1">
            <span className="text-xs text-neutral-500">Or custom count:</span>
            <input
              type="number"
              min="1"
              max="400"
              value={pageCount}
              onChange={e => setPageCount(Math.max(1, Math.min(600, parseInt(e.target.value) || 1)))}
              className="w-20 px-2 py-1 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-mono font-bold text-neutral-900 dark:text-white outline-none"
            />
          </div>
        </div>

        {/* Interior Preset Selection */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400">
            Initial Page Layout Template
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'blank', title: 'Blank Pages', desc: 'Clean white canvas' },
              { id: 'lined', title: 'Lined Rules', desc: 'College writing lines' },
              { id: 'dotGrid', title: 'Dot Matrix', desc: '5mm bullet dots' },
              { id: 'borderFrame', title: 'Framed Border', desc: 'Margin outline border' },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setPageLayout(item.id as any)}
                className={`p-3 rounded-2xl border text-left transition-all relative ${
                  pageLayout === item.id
                    ? 'border-amber-500 bg-amber-500/10'
                    : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-400 bg-neutral-50 dark:bg-neutral-800'
                }`}
              >
                {pageLayout === item.id && (
                  <Check className="w-3.5 h-3.5 text-amber-500 absolute top-2 right-2" />
                )}
                <div className="text-xs font-bold text-neutral-900 dark:text-white">{item.title}</div>
                <div className="text-[11px] text-neutral-500 mt-0.5">{item.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold transition-all shadow-md shadow-amber-500/20 flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate {pageCount} Pages</span>
          </button>
        </div>
      </div>
    </div>
  );
};

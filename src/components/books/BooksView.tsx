import React, { useState } from 'react';
import {
  BookOpen,
  Calculator,
  ShieldCheck,
  Printer,
  Sliders,
  CheckCircle2,
  FileCheck,
  Info,
  Maximize2,
  Layers,
  Sparkles,
  Package,
} from 'lucide-react';
import {
  calculateKdpCoverDimensions,
  calculateKdpInsideMargin,
  calculateKdpSpineWidth,
  STANDARD_TRIM_SIZES,
} from '../../constants/kdp';
import { useApp } from '../../context/AppContext';
import { BatchExportModal } from './BatchExportModal';

export const BooksView: React.FC = () => {
  const { setIsNewBookWizardOpen, setCurrentRoute } = useApp();

  const [isBatchExportOpen, setIsBatchExportOpen] = useState(false);
  const [calcTrimWidth, setCalcTrimWidth] = useState<number>(6.0);
  const [calcTrimHeight, setCalcTrimHeight] = useState<number>(9.0);
  const [calcPages, setCalcPages] = useState<number>(100);
  const [calcPaper, setCalcPaper] = useState<'White' | 'Cream' | 'Premium Color' | 'Standard Color'>('White');
  const [calcBleed, setCalcBleed] = useState<boolean>(false);

  const spineWidth = calculateKdpSpineWidth(calcPages, calcPaper);
  const gutterMargin = calculateKdpInsideMargin(calcPages);
  const coverDimensions = calculateKdpCoverDimensions(calcTrimWidth, calcTrimHeight, spineWidth);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white font-display">
            Amazon KDP Print Mathematics & Production
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Manufacturing formulas, spine thickness multipliers, AI manuscript generation, and batch export.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setCurrentRoute('ai')}
            className="px-4 py-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 font-bold text-xs transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Book Planner</span>
          </button>

          <button
            onClick={() => setIsBatchExportOpen(true)}
            className="px-4 py-2.5 rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 font-bold text-xs transition-colors flex items-center gap-1.5"
          >
            <Package className="w-3.5 h-3.5" />
            <span>Batch Export</span>
          </button>

          <button
            onClick={() => setIsNewBookWizardOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition-all shadow-md shadow-amber-500/20 active:scale-95"
          >
            New Book Wizard
          </button>
        </div>
      </div>

      {/* Interactive KDP Calculator Component */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Parameters (5 Cols) */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-neutral-100 dark:border-neutral-800">
            <Calculator className="w-5 h-5 text-amber-500" />
            <h2 className="text-sm font-bold text-neutral-900 dark:text-white">
              Spine & Cover Calculator
            </h2>
          </div>

          {/* Page count slider */}
          <div>
            <div className="flex justify-between text-xs mb-2">
              <span className="font-bold text-neutral-600 dark:text-neutral-400">Total Page Count</span>
              <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                {calcPages} pages
              </span>
            </div>
            <input
              type="range"
              min="24"
              max="500"
              step="4"
              value={calcPages}
              onChange={e => setCalcPages(parseInt(e.target.value))}
              className="w-full accent-amber-500"
            />
          </div>

          {/* Paper Type */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
              Paper Stock Multiplier
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['White', 'Cream', 'Premium Color', 'Standard Color'] as const).map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setCalcPaper(p)}
                  className={`p-2.5 rounded-xl border text-xs font-semibold text-left ${
                    calcPaper === p
                      ? 'border-amber-500 bg-amber-500/10 text-amber-500'
                      : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Trim size selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
              Trim Dimensions
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { name: '6" × 9"', w: 6.0, h: 9.0 },
                { name: '8.5" × 11"', w: 8.5, h: 11.0 },
                { name: '8" × 10"', w: 8.0, h: 10.0 },
              ].map(t => (
                <button
                  key={t.name}
                  type="button"
                  onClick={() => {
                    setCalcTrimWidth(t.w);
                    setCalcTrimHeight(t.h);
                  }}
                  className={`p-2.5 rounded-xl border text-xs font-mono font-bold ${
                    calcTrimWidth === t.w && calcTrimHeight === t.h
                      ? 'border-amber-500 bg-amber-500/10 text-amber-500'
                      : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Output Metrics (7 Cols) */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-neutral-900 text-white border border-neutral-800 shadow-xl space-y-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Calculated Print Specifications
              </span>
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Valid for KDP Paperback
              </span>
            </div>

            {/* Visual Cover Wrap Diagram */}
            <div className="my-6 p-6 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-center">
              <div className="flex items-center text-center font-mono text-xs">
                {/* Back Cover */}
                <div className="w-28 h-40 bg-neutral-800 border border-neutral-700 rounded-l-md flex flex-col items-center justify-center p-2 text-neutral-400">
                  <span>Back Cover</span>
                  <span className="text-[10px] text-neutral-500">{calcTrimWidth}"</span>
                </div>
                {/* Spine */}
                <div className="w-10 h-40 bg-amber-500 text-neutral-950 font-bold flex flex-col items-center justify-center text-[10px] shadow-md">
                  <span>{spineWidth}"</span>
                  <span className="text-[8px] opacity-80">SPINE</span>
                </div>
                {/* Front Cover */}
                <div className="w-28 h-40 bg-neutral-800 border border-neutral-700 rounded-r-md flex flex-col items-center justify-center p-2 text-neutral-400">
                  <span>Front Cover</span>
                  <span className="text-[10px] text-neutral-500">{calcTrimWidth}"</span>
                </div>
              </div>
            </div>

            {/* Metric Summary Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-neutral-800/60 border border-neutral-700">
                <div className="text-[10px] uppercase text-neutral-400 font-bold">Spine Thickness</div>
                <div className="text-lg font-bold font-mono text-amber-400 mt-0.5">
                  {spineWidth}"
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-neutral-800/60 border border-neutral-700">
                <div className="text-[10px] uppercase text-neutral-400 font-bold">Inside Gutter Margin</div>
                <div className="text-lg font-bold font-mono text-white mt-0.5">
                  {gutterMargin}"
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-neutral-800/60 border border-neutral-700 sm:col-span-1 col-span-2">
                <div className="text-[10px] uppercase text-neutral-400 font-bold">Full Cover Spread</div>
                <div className="text-lg font-bold font-mono text-white mt-0.5">
                  {coverDimensions.width}" × {coverDimensions.height}"
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-neutral-800/40 border border-neutral-700/60 text-xs text-neutral-400 flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Formula: ({calcPages} pages × {calcPaper === 'White' ? '0.002252"' : '0.002500"'}) + 0.125" bleed wrapping.</span>
          </div>
        </div>
      </div>

      {/* Standard KDP Trim Size Reference Table */}
      <div className="rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-xs">
        <div className="p-6 border-b border-neutral-100 dark:border-neutral-800">
          <h2 className="text-base font-bold text-neutral-900 dark:text-white font-display">
            Amazon KDP Industry Standard Trim Formats
          </h2>
          <p className="text-xs text-neutral-500">
            Recommended dimensions categorized by book archetype
          </p>
        </div>

        <table className="w-full text-left text-xs">
          <thead className="bg-neutral-50 dark:bg-neutral-800/60 border-b border-neutral-200 dark:border-neutral-700 font-bold text-neutral-500">
            <tr>
              <th className="py-3.5 px-6">Trim Size</th>
              <th className="py-3.5 px-6">Category</th>
              <th className="py-3.5 px-6">Ideal For</th>
              <th className="py-3.5 px-6">Standard Bleed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {STANDARD_TRIM_SIZES.map(trim => (
              <tr key={trim.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                <td className="py-3.5 px-6 font-mono font-bold text-neutral-900 dark:text-white">
                  {trim.name}
                </td>
                <td className="py-3.5 px-6 text-neutral-600 dark:text-neutral-300">
                  {trim.category}
                </td>
                <td className="py-3.5 px-6 text-neutral-500">
                  {trim.id === '6x9' && 'Word Search, Crossword, Sudoku, General Fiction'}
                  {trim.id === '8.5x11' && 'Coloring Books, Large Workbooks, Complex Planners'}
                  {trim.id === '8x10' && 'Children Activity Books, Illustrated Journals'}
                  {trim.id === '7x10' && 'Technical Guides, Specialized Puzzle Books'}
                  {trim.id === '5.5x8.5' && 'Pocket Journals, Daily Planners'}
                  {trim.id === '8.25x6' && 'Landscape Children Storybooks'}
                </td>
                <td className="py-3.5 px-6 font-mono text-neutral-400">
                  +0.125" (Outside)
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

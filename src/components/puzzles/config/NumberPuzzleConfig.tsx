import React from 'react';
import {
  Hash,
  Sliders,
  Sparkles,
  Calculator,
} from 'lucide-react';
import { NumberPuzzleSettings } from '../../../puzzles/types';

interface NumberPuzzleConfigProps {
  settings: NumberPuzzleSettings;
  onChange: (updates: Partial<NumberPuzzleSettings>) => void;
  metadata?: any;
}

export const NumberPuzzleConfig: React.FC<NumberPuzzleConfigProps> = ({
  settings,
  onChange,
  metadata,
}) => {
  return (
    <div className="space-y-6">
      {/* 1. SUB-TYPE SELECTION */}
      <div className="space-y-3">
        <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400">
          Math & Number Puzzle Type
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { id: 'sequence', name: 'Number Pattern Sequences', desc: 'Find missing term in mathematical series (e.g. 2, 4, 8, ?)' },
            { id: 'missing_number', name: 'Missing Equation Operands', desc: 'Fill in missing numbers in balanced arithmetic formulas' },
          ].map(t => {
            const isSelected = (settings.subType || 'sequence') === t.id;
            return (
              <button
                key={t.id}
                onClick={() => onChange({ subType: t.id as any })}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  isSelected
                    ? 'border-amber-500 bg-amber-500/10 text-amber-900 dark:text-amber-300 ring-1 ring-amber-500/30'
                    : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300'
                }`}
              >
                <span className="text-xs font-bold block mb-0.5">{t.name}</span>
                <span className="text-[10px] text-neutral-500 block">{t.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. NUMBER RANGE & COUNT */}
      <div className="space-y-3 pt-4 border-t border-neutral-100 dark:border-neutral-800">
        <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400">
          Difficulty & Mathematical Range
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <div className="flex justify-between text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
              <span>Item Count</span>
              <span className="font-mono">{settings.itemCount || 8} puzzles</span>
            </div>
            <input
              type="range"
              min={4}
              max={16}
              value={settings.itemCount || 8}
              onChange={e => onChange({ itemCount: Number(e.target.value) })}
              className="w-full accent-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
              Maximum Number Cap
            </label>
            <input
              type="number"
              min={20}
              max={1000}
              value={Number(settings.maxNumber || settings.maxRange || 100)}
              onChange={e => onChange({ maxNumber: Number(e.target.value), maxRange: Number(e.target.value) })}
              className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        <div className="pt-2">
          <label className="flex items-center gap-2 p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 cursor-pointer text-xs font-medium">
            <input
              type="checkbox"
              checked={settings.allowNegatives === true}
              onChange={e => onChange({ allowNegatives: e.target.checked })}
              className="rounded text-amber-500 focus:ring-amber-500 accent-amber-500"
            />
            <div>
              <span className="font-bold block">Allow Negative Numbers</span>
              <span className="text-[10px] text-neutral-400">Include patterns with negative differences</span>
            </div>
          </label>
        </div>
      </div>

      {/* METADATA */}
      {metadata && (
        <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 text-xs flex items-center justify-between">
          <span className="font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Generated Items: {metadata.itemCount || 0}
          </span>
          <span className="text-[10px] text-neutral-400 font-mono">
            Sub-type: {settings.subType || 'sequence'}
          </span>
        </div>
      )}
    </div>
  );
};

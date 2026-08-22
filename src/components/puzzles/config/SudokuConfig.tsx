import React from 'react';
import {
  Grid,
  Shield,
  Sliders,
  Sparkles,
  Layers,
} from 'lucide-react';
import { SudokuSettings } from '../../../puzzles/types';

interface SudokuConfigProps {
  settings: SudokuSettings;
  onChange: (updates: Partial<SudokuSettings>) => void;
  metadata?: any;
}

export const SudokuConfig: React.FC<SudokuConfigProps> = ({
  settings,
  onChange,
  metadata,
}) => {
  const size = settings.size || 9;
  const maxClues = size * size;
  const minClues = size === 4 ? 4 : size === 6 ? 10 : 17;

  return (
    <div className="space-y-6">
      {/* 1. GRID SIZE & DIFFICULTY */}
      <div className="space-y-3">
        <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400">
          Grid Size & Dimensions
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { size: 4, label: '4 × 4 (Kids / Mini)' },
            { size: 6, label: '6 × 6 (Junior / 2×3)' },
            { size: 9, label: '9 × 9 (Standard 3×3)' },
          ].map(s => {
            const isSelected = size === s.size;
            return (
              <button
                key={s.size}
                onClick={() => onChange({ size: s.size as any })}
                className={`p-2.5 rounded-xl border text-xs font-medium transition-all ${
                  isSelected
                    ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold ring-1 ring-amber-500/30'
                    : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-700'
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. DIFFICULTY & GIVEN CLUES */}
      <div className="space-y-3 pt-4 border-t border-neutral-100 dark:border-neutral-800">
        <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400">
          Difficulty Level & Clue Density
        </label>
        <div className="grid grid-cols-4 gap-2">
          {['Easy', 'Medium', 'Hard', 'Expert'].map(d => {
            const isSelected = (settings.difficulty || 'Medium') === d;
            return (
              <button
                key={d}
                onClick={() => onChange({ difficulty: d as any, clueDensity: undefined })}
                className={`p-2 rounded-xl border text-xs font-medium transition-all ${
                  isSelected
                    ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold ring-1 ring-amber-500/30'
                    : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300'
                }`}
              >
                {d}
              </button>
            );
          })}
        </div>

        {/* CLUE DENSITY SLIDER */}
        <div className="pt-2">
          <div className="flex justify-between text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
            <span>Given Clues Target</span>
            <span className="font-mono">{settings.clueDensity || (size === 9 ? (settings.difficulty === 'Easy' ? 48 : settings.difficulty === 'Hard' ? 32 : settings.difficulty === 'Expert' ? 26 : 38) : size === 6 ? 18 : 8)} clues</span>
          </div>
          <input
            type="range"
            min={minClues}
            max={maxClues - 4}
            value={settings.clueDensity || (size === 9 ? 38 : size === 6 ? 18 : 8)}
            onChange={e => onChange({ clueDensity: Number(e.target.value) })}
            className="w-full accent-amber-500"
          />
        </div>
      </div>

      {/* 3. SYMMETRY & NUMBER STYLE */}
      <div className="space-y-3 pt-4 border-t border-neutral-100 dark:border-neutral-800">
        <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400">
          Symmetry & Number Representation
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
              Clue Removal Symmetry
            </label>
            <select
              value={settings.symmetryPreference || 'rotational'}
              onChange={e => onChange({ symmetryPreference: e.target.value as any })}
              className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="rotational">180° Rotational Symmetry (Standard)</option>
              <option value="horizontal">Horizontal Mirror Symmetry</option>
              <option value="diagonal">Diagonal Symmetry</option>
              <option value="none">Asymmetric Random Removal</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
              Number Representation Style
            </label>
            <select
              value={settings.numberStyle || 'standard'}
              onChange={e => onChange({ numberStyle: e.target.value as any })}
              className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="standard">Standard Arabic (1, 2, 3...)</option>
              <option value="roman">Roman Numerals (I, II, III...)</option>
              <option value="circled">Circled Digits (①, ②, ③...)</option>
            </select>
          </div>
        </div>
      </div>

      {/* METADATA */}
      {metadata && (
        <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 text-xs flex items-center justify-between">
          <span className="font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Remaining Clues: {metadata.itemCount || 0}
          </span>
          <span className="text-[10px] text-neutral-400 font-mono">
            Unique Solution: {metadata.hasUniqueSolution ? 'Verified' : 'Yes'}
          </span>
        </div>
      )}
    </div>
  );
};

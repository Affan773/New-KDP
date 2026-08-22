import React from 'react';
import {
  Brain,
  Sliders,
  Sparkles,
  Layers,
} from 'lucide-react';
import { LogicGridSettings } from '../../../puzzles/types';

interface LogicPuzzleConfigProps {
  settings: LogicGridSettings;
  onChange: (updates: Partial<LogicGridSettings>) => void;
  metadata?: any;
}

export const LogicPuzzleConfig: React.FC<LogicPuzzleConfigProps> = ({
  settings,
  onChange,
  metadata,
}) => {
  return (
    <div className="space-y-6">
      {/* 1. GRID DIMENSIONS & COMPLEXITY */}
      <div className="space-y-3">
        <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400">
          Grid Complexity & Category Setup
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
              Category Dimensions
            </label>
            <select
              value={`${settings.categoryCount || 3}x${settings.itemsPerCategory || 3}`}
              onChange={e => {
                const [cats, items] = e.target.value.split('x').map(Number);
                onChange({ categoryCount: cats as any, itemsPerCategory: items as (3 | 4 | 5) });
              }}
              className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="3x3">3 Categories × 3 Items (Standard / Easy)</option>
              <option value="3x4">3 Categories × 4 Items (Medium)</option>
              <option value="4x4">4 Categories × 4 Items (Challenging)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
              Theme / Story Setting
            </label>
            <select
              value={settings.theme || 'houses'}
              onChange={e => onChange({ theme: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="houses">Neighborhood & House Colors</option>
              <option value="pets">Pet Adoption & Hobbies</option>
              <option value="sports">Athletes & Medals</option>
              <option value="space">Astronauts & Planets</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. DEDUCTIVE CLUES */}
      <div className="space-y-3 pt-4 border-t border-neutral-100 dark:border-neutral-800">
        <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400">
          Clue Generation Style
        </label>
        <p className="text-xs text-neutral-500">
          Deductive logic solver dynamically computes non-redundant positive, negative, and transitive constraint clues.
        </p>
      </div>

      {/* METADATA */}
      {metadata && (
        <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 text-xs flex items-center justify-between">
          <span className="font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Generated Clues: {metadata.itemCount || 0}
          </span>
          <span className="text-[10px] text-neutral-400 font-mono">
            Deduction: Complete
          </span>
        </div>
      )}
    </div>
  );
};

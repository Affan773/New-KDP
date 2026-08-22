import React from 'react';
import {
  Compass,
  Sliders,
  Sparkles,
  MapPin,
  Play,
  Flag,
} from 'lucide-react';
import { MazeSettings } from '../../../puzzles/types';

interface MazeConfigProps {
  settings: MazeSettings;
  onChange: (updates: Partial<MazeSettings>) => void;
  metadata?: any;
}

export const MazeConfig: React.FC<MazeConfigProps> = ({
  settings,
  onChange,
  metadata,
}) => {
  return (
    <div className="space-y-6">
      {/* 1. MAZE DIMENSIONS & COMPLEXITY */}
      <div className="space-y-3">
        <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400">
          Maze Dimensions & Grid Size
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { width: 15, height: 15, label: '15 × 15 (Easy/Kids)' },
            { width: 23, height: 23, label: '23 × 23 (Medium)' },
            { width: 31, height: 31, label: '31 × 31 (Hard/Dense)' },
          ].map(m => {
            const isSelected = (settings.width || 21) === m.width && (settings.height || 21) === m.height;
            return (
              <button
                key={m.label}
                onClick={() => onChange({ width: m.width, height: m.height })}
                className={`p-2.5 rounded-xl border text-xs font-medium transition-all ${
                  isSelected
                    ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold ring-1 ring-amber-500/30'
                    : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300'
                }`}
              >
                {m.label}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <div>
            <span className="text-[11px] font-semibold text-neutral-500">Width ({settings.width || 21})</span>
            <input
              type="range"
              min={9}
              max={41}
              step={2}
              value={settings.width || 21}
              onChange={e => onChange({ width: Number(e.target.value) })}
              className="w-full accent-amber-500 mt-1"
            />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-neutral-500">Height ({settings.height || 21})</span>
            <input
              type="range"
              min={9}
              max={41}
              step={2}
              value={settings.height || 21}
              onChange={e => onChange({ height: Number(e.target.value) })}
              className="w-full accent-amber-500 mt-1"
            />
          </div>
        </div>
      </div>

      {/* 2. GENERATION ALGORITHM */}
      <div className="space-y-3 pt-4 border-t border-neutral-100 dark:border-neutral-800">
        <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400">
          Maze Generation Algorithm
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => onChange({ algorithm: 'dfs' })}
            className={`p-3 rounded-2xl border text-left transition-all ${
              (settings.algorithm || 'dfs') === 'dfs'
                ? 'border-amber-500 bg-amber-500/10 text-amber-900 dark:text-amber-300 ring-1 ring-amber-500/30'
                : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300'
            }`}
          >
            <span className="text-xs font-bold block mb-0.5">Recursive Backtracker (DFS)</span>
            <span className="text-[10px] text-neutral-500 block">
              Long, winding corridors with fewer dead ends. Classic labyrinth feel.
            </span>
          </button>

          <button
            onClick={() => onChange({ algorithm: 'prims' })}
            className={`p-3 rounded-2xl border text-left transition-all ${
              settings.algorithm === 'prims'
                ? 'border-amber-500 bg-amber-500/10 text-amber-900 dark:text-amber-300 ring-1 ring-amber-500/30'
                : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300'
            }`}
          >
            <span className="text-xs font-bold block mb-0.5">Randomized Prim's Algorithm</span>
            <span className="text-[10px] text-neutral-500 block">
              Dense branching structure with many short blind alleys. Highly complex.
            </span>
          </button>
        </div>
      </div>

      {/* 3. START & END POSITIONS */}
      <div className="space-y-3 pt-4 border-t border-neutral-100 dark:border-neutral-800">
        <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400">
          Start & End Anchor Positions
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1 flex items-center gap-1">
              <Play className="w-3 h-3 text-emerald-500" />
              <span>Start Position</span>
            </label>
            <select
              value={settings.startPosition || 'top_left'}
              onChange={e => onChange({ startPosition: e.target.value as any })}
              className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="top_left">Top-Left Corner (Default)</option>
              <option value="top_right">Top-Right Corner</option>
              <option value="top_center">Top Center Edge</option>
              <option value="bottom_left">Bottom-Left Corner</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1 flex items-center gap-1">
              <Flag className="w-3 h-3 text-rose-500" />
              <span>Finish Position</span>
            </label>
            <select
              value={settings.endPosition || 'bottom_right'}
              onChange={e => onChange({ endPosition: e.target.value as any })}
              className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="bottom_right">Bottom-Right Corner (Default)</option>
              <option value="bottom_left">Bottom-Left Corner</option>
              <option value="bottom_center">Bottom Center Edge</option>
              <option value="top_right">Top-Right Corner</option>
            </select>
          </div>
        </div>
      </div>

      {/* METADATA */}
      {metadata && (
        <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 text-xs flex items-center justify-between">
          <span className="font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Solution Path: {metadata.itemCount || 0} steps
          </span>
          <span className="text-[10px] text-neutral-400 font-mono">
            Solvable: {metadata.isSolvable ? 'Yes' : 'No'}
          </span>
        </div>
      )}
    </div>
  );
};

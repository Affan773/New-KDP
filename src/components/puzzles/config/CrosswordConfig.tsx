import React, { useState } from 'react';
import {
  Grid,
  Plus,
  Trash2,
  BookOpen,
  Layers,
  Sparkles,
} from 'lucide-react';
import { CrosswordSettings } from '../../../puzzles/types';

interface CrosswordConfigProps {
  settings: CrosswordSettings;
  onChange: (updates: Partial<CrosswordSettings>) => void;
  metadata?: any;
}

export const CrosswordConfig: React.FC<CrosswordConfigProps> = ({
  settings,
  onChange,
  metadata,
}) => {
  const [newWord, setNewWord] = useState('');
  const [newClue, setNewClue] = useState('');

  const wordPairs = settings.customWordPairs || [];

  const handleAddPair = () => {
    if (!newWord.trim() || !newClue.trim()) return;
    const cleanWord = newWord.trim().toUpperCase().replace(/[^A-Z]/g, '');
    if (cleanWord.length < 3) return;

    onChange({
      customWordPairs: [...wordPairs, { word: cleanWord, clue: newClue.trim() }],
    });
    setNewWord('');
    setNewClue('');
  };

  const handleRemovePair = (index: number) => {
    const next = [...wordPairs];
    next.splice(index, 1);
    onChange({ customWordPairs: next });
  };

  return (
    <div className="space-y-6">
      {/* 1. GRID SIZE & DIFFICULTY */}
      <div className="space-y-3">
        <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400">
          Grid Size & Dimensions
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { size: 9, label: '9 × 9 (Mini)' },
            { size: 13, label: '13 × 13 (Standard)' },
            { size: 15, label: '15 × 15 (Classic NYT)' },
          ].map(s => {
            const isSelected = (settings.size || 13) === s.size;
            return (
              <button
                key={s.size}
                onClick={() => onChange({ size: s.size })}
                className={`p-2.5 rounded-xl border text-xs font-medium transition-all ${
                  isSelected
                    ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold ring-1 ring-amber-500/30'
                    : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300'
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. THEME / VOCABULARY */}
      <div className="space-y-3 pt-4 border-t border-neutral-100 dark:border-neutral-800">
        <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400">
          Vocabulary Theme
        </label>
        <select
          value={settings.theme || 'general'}
          onChange={e => onChange({ theme: e.target.value })}
          className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <option value="general">General Knowledge & Vocabulary</option>
          <option value="animals">Animals & Wildlife</option>
          <option value="science">Science & Space</option>
          <option value="geography">World Geography & Countries</option>
          <option value="history">World History & Heritage</option>
        </select>
      </div>

      {/* 3. CUSTOM WORD & CLUE PAIRS */}
      <div className="space-y-3 pt-4 border-t border-neutral-100 dark:border-neutral-800">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400">
            Custom Clue & Word Pairs ({wordPairs.length})
          </label>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder="WORD (e.g. SOLAR)"
            value={newWord}
            onChange={e => setNewWord(e.target.value)}
            className="sm:w-1/3 px-3 py-2 text-xs rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-amber-500 uppercase font-mono"
          />
          <input
            type="text"
            placeholder="Clue text (e.g. Relating to the sun)"
            value={newClue}
            onChange={e => setNewClue(e.target.value)}
            className="flex-1 px-3 py-2 text-xs rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <button
            onClick={handleAddPair}
            className="px-4 py-2 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-bold hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors flex items-center justify-center gap-1 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>

        {wordPairs.length > 0 && (
          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
            {wordPairs.map((p, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs"
              >
                <div className="truncate pr-2">
                  <span className="font-mono font-bold text-neutral-900 dark:text-white mr-2">
                    {p.word}
                  </span>
                  <span className="text-neutral-500 text-[11px] truncate">{p.clue}</span>
                </div>
                <button
                  onClick={() => handleRemovePair(idx)}
                  className="text-neutral-400 hover:text-rose-500 p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. CLUE LAYOUT */}
      <div className="space-y-3 pt-4 border-t border-neutral-100 dark:border-neutral-800">
        <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400">
          Clues Display Layout
        </label>
        <select
          value={settings.clueLayout || 'split'}
          onChange={e => onChange({ clueLayout: e.target.value as any })}
          className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <option value="split">Split Columns (Across & Down)</option>
          <option value="side_by_side">Side-by-Side with Grid</option>
          <option value="stacked">Stacked Bottom List</option>
        </select>
      </div>

      {/* METADATA */}
      {metadata && (
        <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 text-xs flex items-center justify-between">
          <span className="font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Placed Entries: {metadata.itemCount || 0}
          </span>
          <span className="text-[10px] text-neutral-400 font-mono">
            Intersections: {metadata.intersections || 0}
          </span>
        </div>
      )}
    </div>
  );
};

import React from 'react';
import {
  Type,
  Shuffle,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import { WordScrambleSettings } from '../../../puzzles/types';
import { WordListService } from '../../../puzzles/services/WordListService';

interface WordScrambleConfigProps {
  settings: WordScrambleSettings;
  onChange: (updates: Partial<WordScrambleSettings>) => void;
  metadata?: any;
}

export const WordScrambleConfig: React.FC<WordScrambleConfigProps> = ({
  settings,
  onChange,
  metadata,
}) => {
  const categories = WordListService.getAllCategories();

  const handleCustomWordsTextChange = (text: string) => {
    const { words } = WordListService.importPlainText(text);
    onChange({ customWords: words });
  };

  const currentWordsCount = settings.customWords?.length || 0;
  const currentTextVal = settings.customWords ? settings.customWords.join('\n') : '';

  return (
    <div className="space-y-6">
      {/* 1. VOCABULARY & WORD SOURCE */}
      <div className="space-y-3">
        <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400">
          Vocabulary & Category
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
              Select Theme
            </label>
            <select
              value={settings.theme || 'animals'}
              onChange={e => {
                const chosenCat = categories.find(c => c.id === e.target.value);
                onChange({
                  theme: e.target.value,
                  customWords: chosenCat ? chosenCat.words : undefined,
                });
              }}
              className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} ({cat.words.length} words){cat.isCustom ? ' [Custom]' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex justify-between text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
              <span>Target Item Count</span>
              <span className="font-mono">{settings.wordCount || 10} words</span>
            </div>
            <input
              type="range"
              min={4}
              max={25}
              value={settings.wordCount || 10}
              onChange={e => onChange({ wordCount: Number(e.target.value) })}
              className="w-full accent-amber-500 mt-1"
            />
          </div>
        </div>

        {/* CUSTOM WORDS */}
        <div className="pt-2">
          <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
            Custom Words ({currentWordsCount} words)
          </label>
          <textarea
            rows={3}
            value={currentTextVal}
            onChange={e => handleCustomWordsTextChange(e.target.value)}
            placeholder="Enter custom words (one per line or comma-separated)..."
            className="w-full p-2.5 font-mono text-xs rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-amber-500 uppercase"
          />
        </div>
      </div>

      {/* 2. SCRAMBLE STYLE & HINTS */}
      <div className="space-y-3 pt-4 border-t border-neutral-100 dark:border-neutral-800">
        <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400">
          Scramble Algorithm & Hints
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
              Scramble Method
            </label>
            <select
              value={settings.scrambleStyle || 'random'}
              onChange={e => onChange({ scrambleStyle: e.target.value as any })}
              className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="random">Random Permutation (Classic)</option>
              <option value="reverse">Reverse String (Mirror)</option>
              <option value="vowels_kept">Vowels Anchored in Position</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
              Word Length Range
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                min={3}
                max={15}
                value={settings.minWordLength || 4}
                onChange={e => onChange({ minWordLength: Number(e.target.value) })}
                className="w-full px-2.5 py-2 text-xs rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-center"
                placeholder="Min"
              />
              <input
                type="number"
                min={4}
                max={20}
                value={settings.maxWordLength || 10}
                onChange={e => onChange({ maxWordLength: Number(e.target.value) })}
                className="w-full px-2.5 py-2 text-xs rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-center"
                placeholder="Max"
              />
            </div>
          </div>
        </div>

        <div className="pt-1">
          <label className="flex items-center gap-2 p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 cursor-pointer text-xs font-medium">
            <input
              type="checkbox"
              checked={settings.showWordBank !== false}
              onChange={e => onChange({ showWordBank: e.target.checked })}
              className="rounded text-amber-500 focus:ring-amber-500 accent-amber-500"
            />
            <span>Include Word Bank Hint Box for Solvers</span>
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
            Solvable: Yes
          </span>
        </div>
      )}
    </div>
  );
};

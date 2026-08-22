import React from 'react';
import {
  Key,
  Sliders,
  Sparkles,
  Quote,
  Shield,
} from 'lucide-react';
import { CryptogramSettings } from '../../../puzzles/types';

interface CryptogramConfigProps {
  settings: CryptogramSettings;
  onChange: (updates: Partial<CryptogramSettings>) => void;
  metadata?: any;
}

export const CryptogramConfig: React.FC<CryptogramConfigProps> = ({
  settings,
  onChange,
  metadata,
}) => {
  return (
    <div className="space-y-6">
      {/* 1. CIPHER ALGORITHM */}
      <div className="space-y-3">
        <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400">
          Cipher Encryption Algorithm
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {[
            { id: 'random_substitution', name: 'Random Substitution', desc: 'Classic monoalphabetic cryptogram' },
            { id: 'atbash', name: 'Atbash Cipher', desc: 'Symmetric reversed alphabet (A=Z, B=Y)' },
            { id: 'caesar', name: 'Caesar Shift', desc: 'Rotational letter shift' },
          ].map(c => {
            const isSelected = (settings.cipherType || 'random_substitution') === c.id;
            return (
              <button
                key={c.id}
                onClick={() => onChange({ cipherType: c.id as any })}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  isSelected
                    ? 'border-amber-500 bg-amber-500/10 text-amber-900 dark:text-amber-300 ring-1 ring-amber-500/30'
                    : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300'
                }`}
              >
                <span className="text-xs font-bold block mb-0.5">{c.name}</span>
                <span className="text-[10px] text-neutral-500 block">{c.desc}</span>
              </button>
            );
          })}
        </div>

        {/* CAESAR SHIFT SLIDER */}
        {settings.cipherType === 'caesar' && (
          <div className="pt-2">
            <div className="flex justify-between text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
              <span>Caesar Shift Key (Positions)</span>
              <span className="font-mono">+{settings.caesarShift || 3}</span>
            </div>
            <input
              type="range"
              min={1}
              max={25}
              value={settings.caesarShift || 3}
              onChange={e => onChange({ caesarShift: Number(e.target.value) })}
              className="w-full accent-amber-500"
            />
          </div>
        )}
      </div>

      {/* 2. CUSTOM QUOTE OR AUTO SEED */}
      <div className="space-y-3 pt-4 border-t border-neutral-100 dark:border-neutral-800">
        <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400">
          Quote Text & Author
        </label>
        <div>
          <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
            Custom Quote Text (Leave blank to use curated database)
          </label>
          <textarea
            rows={3}
            value={settings.quote || ''}
            onChange={e => onChange({ quote: e.target.value })}
            placeholder="e.g. THE ONLY WAY TO DO GREAT WORK IS TO LOVE WHAT YOU DO."
            className="w-full p-2.5 text-xs rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-amber-500 uppercase"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
              Author (Optional)
            </label>
            <input
              type="text"
              value={settings.author || ''}
              onChange={e => onChange({ author: e.target.value })}
              placeholder="e.g. Steve Jobs"
              className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
              <span>Pre-Filled Letter Hints</span>
              <span className="font-mono">{settings.hintsProvided !== undefined ? settings.hintsProvided : 2} hints</span>
            </div>
            <input
              type="range"
              min={0}
              max={6}
              value={settings.hintsProvided !== undefined ? settings.hintsProvided : 2}
              onChange={e => onChange({ hintsProvided: Number(e.target.value) })}
              className="w-full accent-amber-500 mt-1"
            />
          </div>
        </div>
      </div>

      {/* 3. DISPLAY OPTIONS */}
      <div className="space-y-3 pt-4 border-t border-neutral-100 dark:border-neutral-800">
        <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400">
          Display Controls
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <label className="flex items-center gap-2 p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 cursor-pointer text-xs font-medium">
            <input
              type="checkbox"
              checked={settings.showAuthor !== false}
              onChange={e => onChange({ showAuthor: e.target.checked })}
              className="rounded text-amber-500 focus:ring-amber-500 accent-amber-500"
            />
            <span>Show Author in Solution</span>
          </label>

          <label className="flex items-center gap-2 p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 cursor-pointer text-xs font-medium">
            <input
              type="checkbox"
              checked={settings.preservePunctuation !== false}
              onChange={e => onChange({ preservePunctuation: e.target.checked })}
              className="rounded text-amber-500 focus:ring-amber-500 accent-amber-500"
            />
            <span>Preserve Punctuation Marks</span>
          </label>
        </div>
      </div>

      {/* METADATA */}
      {metadata && (
        <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 text-xs flex items-center justify-between">
          <span className="font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Unique Letters: {metadata.itemCount || 0}
          </span>
          <span className="text-[10px] text-neutral-400 font-mono">
            Length: {metadata.dimensions || ''}
          </span>
        </div>
      )}
    </div>
  );
};

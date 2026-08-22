import React, { useState, useRef } from 'react';
import {
  Grid,
  Type,
  Compass,
  ArrowRight,
  ArrowDown,
  ArrowUp,
  ArrowLeft,
  BookOpen,
  Shuffle,
  SortAsc,
  Sliders,
  CheckSquare,
  Square,
  Layers,
  Sparkles,
  Info,
  Upload,
  Zap,
} from 'lucide-react';
import { WordSearchSettings } from '../../../puzzles/types';
import { WordListService, CustomWordCategory } from '../../../puzzles/services/WordListService';
import { WordListManagerModal } from '../WordListManagerModal';
import { AiWordGeneratorModal } from '../AiWordGeneratorModal';

interface WordSearchConfigProps {
  settings: WordSearchSettings;
  onChange: (updates: Partial<WordSearchSettings>) => void;
  onAddToBook?: (words: string[], themeTitle: string) => void;
  metadata?: any;
}

const GRID_PRESETS = [
  { label: '8 × 8 (Kids)', rows: 8, cols: 8 },
  { label: '10 × 10 (Easy)', rows: 10, cols: 10 },
  { label: '12 × 12 (Standard)', rows: 12, cols: 12 },
  { label: '15 × 15 (Classic)', rows: 15, cols: 15 },
  { label: '18 × 18 (Medium)', rows: 18, cols: 18 },
  { label: '20 × 20 (Large)', rows: 20, cols: 20 },
  { label: '25 × 25 (Jumbo)', rows: 25, cols: 25 },
];

export const WordSearchConfig: React.FC<WordSearchConfigProps> = ({
  settings,
  onChange,
  onAddToBook,
  metadata,
}) => {
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const categories = WordListService.getAllCategories();

  const handleCustomWordsTextChange = (text: string) => {
    const { words } = WordListService.importPlainText(text);
    onChange({ customWords: words });
  };

  const handleToggleDirection = (dirKey: keyof NonNullable<WordSearchSettings['directions']>) => {
    const curr = settings.directions || {
      horizontal: true,
      horizontalReverse: false,
      vertical: true,
      verticalReverse: false,
      diagonalDown: true,
      diagonalDownReverse: false,
      diagonalUp: false,
      diagonalUpReverse: false,
    };
    onChange({
      directions: {
        ...curr,
        [dirKey]: !curr[dirKey],
      },
    });
  };

  const handleSelectAllDirections = () => {
    onChange({
      directions: {
        horizontal: true,
        horizontalReverse: true,
        vertical: true,
        verticalReverse: true,
        diagonalDown: true,
        diagonalDownReverse: true,
        diagonalUp: true,
        diagonalUpReverse: true,
      },
    });
  };

  const handleResetStandardDirections = () => {
    onChange({
      directions: {
        horizontal: true,
        horizontalReverse: false,
        vertical: true,
        verticalReverse: false,
        diagonalDown: true,
        diagonalDownReverse: false,
        diagonalUp: false,
        diagonalUpReverse: false,
      },
    });
  };

  const handleSortWordsAZ = () => {
    if (!settings.customWords) return;
    const sorted = [...settings.customWords].sort((a, b) => a.localeCompare(b));
    onChange({ customWords: sorted });
  };

  const handleShuffleWords = () => {
    if (!settings.customWords) return;
    const shuffled = [...settings.customWords].sort(() => Math.random() - 0.5);
    onChange({ customWords: shuffled });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const text = event.target?.result as string;
      if (!text) return;
      const { words } = WordListService.importPlainText(text);
      if (words.length > 0) {
        onChange({ customWords: words });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const currentWordsCount = settings.customWords?.length || 0;
  const currentTextVal = settings.customWords ? settings.customWords.join('\n') : '';

  return (
    <div className="space-y-6">
      {/* 1. GRID DIMENSIONS */}
      <div className="space-y-3">
        <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400">
          Grid Size & Dimensions
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {GRID_PRESETS.map(p => {
            const isSelected = (settings.rows || settings.gridHeight) === p.rows && (settings.cols || settings.gridWidth) === p.cols;
            return (
              <button
                key={p.label}
                onClick={() => onChange({ rows: p.rows, cols: p.cols, gridHeight: p.rows, gridWidth: p.cols })}
                className={`p-2.5 rounded-xl border text-xs font-medium transition-all ${
                  isSelected
                    ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold ring-1 ring-amber-500/30'
                    : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-700'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <div>
            <span className="text-[11px] font-semibold text-neutral-500">Custom Rows ({settings.rows || settings.gridHeight || 15})</span>
            <input
              type="range"
              min={6}
              max={30}
              value={settings.rows || settings.gridHeight || 15}
              onChange={e => onChange({ rows: Number(e.target.value), gridHeight: Number(e.target.value) })}
              className="w-full accent-amber-500 mt-1"
            />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-neutral-500">Custom Columns ({settings.cols || settings.gridWidth || 15})</span>
            <input
              type="range"
              min={6}
              max={30}
              value={settings.cols || settings.gridWidth || 15}
              onChange={e => onChange({ cols: Number(e.target.value), gridWidth: Number(e.target.value) })}
              className="w-full accent-amber-500 mt-1"
            />
          </div>
        </div>
      </div>

      {/* 2. THEME & WORD SOURCE */}
      <div className="space-y-3 pt-4 border-t border-neutral-100 dark:border-neutral-800">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400">
            Vocabulary & Word List Source
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAiModalOpen(true)}
              className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Generate</span>
            </button>
            <button
              onClick={() => setIsLibraryOpen(true)}
              className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Library</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
              Select Theme / Dictionary
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
              <span>Words Placed in Grid</span>
              <span className="font-mono">{settings.wordCount || settings.targetWordCount || 15}</span>
            </div>
            <input
              type="range"
              min={4}
              max={30}
              value={settings.wordCount || settings.targetWordCount || 15}
              onChange={e => onChange({ wordCount: Number(e.target.value), targetWordCount: Number(e.target.value) })}
              className="w-full accent-amber-500 mt-1"
            />
          </div>
        </div>

        {/* CUSTOM WORDS INPUT */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
              Custom Word List ({currentWordsCount} words)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-[10px] font-semibold text-neutral-500 hover:text-amber-600 flex items-center gap-1"
                title="Upload TXT or CSV"
              >
                <Upload className="w-3 h-3" />
                <span>Upload TXT/CSV</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />

              <button
                onClick={handleSortWordsAZ}
                className="text-[10px] font-semibold text-neutral-500 hover:text-amber-600 flex items-center gap-1"
                title="Sort A-Z"
              >
                <SortAsc className="w-3 h-3" />
                <span>A-Z</span>
              </button>
              <button
                onClick={handleShuffleWords}
                className="text-[10px] font-semibold text-neutral-500 hover:text-amber-600 flex items-center gap-1"
                title="Shuffle words"
              >
                <Shuffle className="w-3 h-3" />
                <span>Shuffle</span>
              </button>
            </div>
          </div>
          <textarea
            rows={4}
            value={currentTextVal}
            onChange={e => handleCustomWordsTextChange(e.target.value)}
            placeholder="Type or paste custom words (one per line or separated by commas)..."
            className="w-full p-2.5 font-mono text-xs rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* 3. DIRECTION CONTROLS (8-WAY) */}
      <div className="space-y-3 pt-4 border-t border-neutral-100 dark:border-neutral-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-amber-500" />
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400">
              Allowed Placement Directions
            </label>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetStandardDirections}
              className="text-[10px] font-semibold text-neutral-500 hover:text-amber-600 underline"
            >
              Standard (Easy/Med)
            </button>
            <button
              onClick={handleSelectAllDirections}
              className="text-[10px] font-semibold text-neutral-500 hover:text-amber-600 underline"
            >
              All 8-Way (Hard)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { key: 'horizontal', label: 'Right →', icon: ArrowRight },
            { key: 'horizontalReverse', label: 'Left ← (Backwards)', icon: ArrowLeft },
            { key: 'vertical', label: 'Down ↓', icon: ArrowDown },
            { key: 'verticalReverse', label: 'Up ↑ (Upwards)', icon: ArrowUp },
            { key: 'diagonalDown', label: 'Diag Down-Right ↘', icon: ArrowRight },
            { key: 'diagonalDownReverse', label: 'Diag Down-Left ↙', icon: ArrowLeft },
            { key: 'diagonalUp', label: 'Diag Up-Right ↗', icon: ArrowRight },
            { key: 'diagonalUpReverse', label: 'Diag Up-Left ↖', icon: ArrowLeft },
          ].map(d => {
            const isChecked = Boolean(settings.directions?.[d.key as keyof WordSearchSettings['directions']]);
            return (
              <button
                key={d.key}
                onClick={() => handleToggleDirection(d.key as keyof WordSearchSettings['directions'])}
                className={`p-2 rounded-xl border text-xs flex items-center justify-between transition-all ${
                  isChecked
                    ? 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold'
                    : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-500 hover:border-neutral-300 dark:hover:border-neutral-700'
                }`}
              >
                <span className="truncate">{d.label}</span>
                {isChecked ? (
                  <CheckSquare className="w-4 h-4 text-amber-500 shrink-0 ml-1" />
                ) : (
                  <Square className="w-4 h-4 text-neutral-400 shrink-0 ml-1" />
                )}
              </button>
            );
          })}
        </div>

        {/* OVERLAP & FILLER CONTROLS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <label className="flex items-center gap-2 p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 cursor-pointer text-xs font-medium">
            <input
              type="checkbox"
              checked={settings.allowOverlaps !== false && settings.allowOverlap !== false}
              onChange={e => onChange({ allowOverlaps: e.target.checked, allowOverlap: e.target.checked })}
              className="rounded text-amber-500 focus:ring-amber-500 accent-amber-500"
            />
            <div>
              <span className="font-bold block">Allow Word Intersections / Overlaps</span>
              <span className="text-[10px] text-neutral-400">Enables shared letter crossings between words</span>
            </div>
          </label>

          <label className="flex items-center gap-2 p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 cursor-pointer text-xs font-medium">
            <input
              type="checkbox"
              checked={settings.allowReverse !== false}
              onChange={e => onChange({ allowReverse: e.target.checked })}
              className="rounded text-amber-500 focus:ring-amber-500 accent-amber-500"
            />
            <div>
              <span className="font-bold block">Master Reverse Direction</span>
              <span className="text-[10px] text-neutral-400">Allow reverse spelling across enabled vectors</span>
            </div>
          </label>
        </div>
      </div>

      {/* 4. WORD LIST LAYOUT & PRESENTATION */}
      <div className="space-y-3 pt-4 border-t border-neutral-100 dark:border-neutral-800">
        <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400">
          Word Bank Layout & Solution Key Style
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
              Word Bank Placement
            </label>
            <select
              value={settings.wordListPosition || 'bottom'}
              onChange={e => onChange({ wordListPosition: e.target.value as any })}
              className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="bottom">Bottom (Classic)</option>
              <option value="top">Top Header</option>
              <option value="right">Right Column</option>
              <option value="left">Left Column</option>
              <option value="hidden">Hidden (No Word Bank)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
              Word Bank Columns
            </label>
            <select
              value={settings.wordListColumns || 3}
              onChange={e => onChange({ wordListColumns: Number(e.target.value) as any })}
              className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value={1}>1 Column</option>
              <option value={2}>2 Columns</option>
              <option value={3}>3 Columns</option>
              <option value={4}>4 Columns</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
              Solution Key Visual
            </label>
            <select
              value={settings.solutionMode || 'highlight'}
              onChange={e => onChange({ solutionMode: e.target.value as any })}
              className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="highlight">Full Cell Color Highlight</option>
              <option value="capsule">Pill / Capsule Outline</option>
              <option value="circle">Individual Circle Letters</option>
              <option value="underline">Letter Underline</option>
              <option value="answer_list_only">Word Bank Mark Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* 5. QUALITY / TELEMETRY METRICS */}
      {metadata && (
        <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Puzzle Quality Score: {metadata.qualityScore || 95}/100
            </span>
            <span className="text-[10px] text-neutral-400 font-mono">
              Gen Time: {metadata.generationTimeMs || 12}ms
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-neutral-600 dark:text-neutral-400 font-mono">
            <div>Placed: {metadata.placedWordsCount || metadata.itemCount || 0} words</div>
            <div>Grid Density: {metadata.gridDensity || 45}%</div>
            <div>Letter Overlaps: {metadata.overlapCount || 0}</div>
            <div>Directions: {metadata.directionDiversity || 3} vectors</div>
          </div>
        </div>
      )}

      {/* MODALS */}
      <WordListManagerModal
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        onSelectCategory={cat => {
          onChange({
            theme: cat.id,
            customWords: cat.words,
          });
        }}
      />

      <AiWordGeneratorModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onApplyWords={(words, themeTitle) => {
          onChange({
            theme: themeTitle,
            title: `${themeTitle.toUpperCase()} WORD SEARCH`,
            customWords: words,
            wordCount: words.length,
          });
        }}
        onAddToBook={(words, themeTitle) => {
          onChange({
            theme: themeTitle,
            title: `${themeTitle.toUpperCase()} WORD SEARCH`,
            customWords: words,
            wordCount: words.length,
          });
          if (onAddToBook) {
            onAddToBook(words, themeTitle);
          }
        }}
        initialTopic={settings.theme || 'Rainforest Wildlife'}
      />
    </div>
  );
};

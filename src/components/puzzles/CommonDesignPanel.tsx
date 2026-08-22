import React from 'react';
import {
  Palette,
  Type,
  Maximize2,
  Sliders,
  Sparkles,
  Layout,
  Check,
} from 'lucide-react';
import {
  PuzzleStyleOptions,
  PuzzleVisualPresetKey,
} from '../../puzzles/types';
import { VISUAL_PRESETS } from '../../puzzles/renderers/PuzzleRenderer';

interface CommonDesignPanelProps {
  styleOptions: PuzzleStyleOptions;
  onChange: (updates: Partial<PuzzleStyleOptions>) => void;
}

const FONT_OPTIONS = [
  { id: 'Plus Jakarta Sans, sans-serif', name: 'Plus Jakarta Sans (Modern Sans)' },
  { id: 'Inter, sans-serif', name: 'Inter (Clean Neutral)' },
  { id: 'Roboto Mono, monospace', name: 'Roboto Mono (Crisp Monospace)' },
  { id: 'Merriweather, serif', name: 'Merriweather (Classic Editorial)' },
  { id: 'Playfair Display, serif', name: 'Playfair Display (Luxury Serif)' },
  { id: 'Courier New, monospace', name: 'Courier New (Retro Typewriter)' },
  { id: 'Cinzel, serif', name: 'Cinzel (Classical Elegant)' },
];

const PRESET_DEFINITIONS: { id: PuzzleVisualPresetKey; name: string; desc: string; bg: string; text: string; accent: string }[] = [
  {
    id: 'clean_editorial',
    name: 'Clean Editorial',
    desc: 'Neutral dark typography with warm amber accents',
    bg: '#FFFFFF',
    text: '#1E293B',
    accent: '#F59E0B',
  },
  {
    id: 'modern_bold',
    name: 'Modern Bold',
    desc: 'High contrast borders with indigo solutions',
    bg: '#FFFFFF',
    text: '#0F172A',
    accent: '#6366F1',
  },
  {
    id: 'minimalist_slate',
    name: 'Minimalist Slate',
    desc: 'Slate neutrals with refined cyan highlights',
    bg: '#F8FAFC',
    text: '#334155',
    accent: '#06B6D4',
  },
  {
    id: 'warm_golden',
    name: 'Warm Golden',
    desc: 'Warm paper tone with dark amber framing',
    bg: '#FFFDF9',
    text: '#292524',
    accent: '#FBBF24',
  },
  {
    id: 'classic_charcoal',
    name: 'Classic Charcoal',
    desc: 'Print-perfect 100% black & white with yellow key',
    bg: '#FFFFFF',
    text: '#000000',
    accent: '#FEF08A',
  },
  {
    id: 'blueprint_blue',
    name: 'Blueprint Blue',
    desc: 'Crisp technical drafting grid with sky highlights',
    bg: '#F0F9FF',
    text: '#0F2942',
    accent: '#BAE6FD',
  },
  {
    id: 'forest_botanical',
    name: 'Forest Botanical',
    desc: 'Deep pine borders with soft emerald highlights',
    bg: '#F0FDF4',
    text: '#064E3B',
    accent: '#A7F3D0',
  },
];

export const CommonDesignPanel: React.FC<CommonDesignPanelProps> = ({
  styleOptions,
  onChange,
}) => {
  const handleApplyPreset = (presetKey: PuzzleVisualPresetKey) => {
    const preset = VISUAL_PRESETS[presetKey];
    if (preset) {
      onChange({
        ...preset,
        presetKey,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. VISUAL THEME PRESETS */}
      <div className="space-y-3">
        <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400">
          Visual Style Presets
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {PRESET_DEFINITIONS.map(preset => {
            const isSelected = styleOptions.presetKey === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => handleApplyPreset(preset.id)}
                className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                  isSelected
                    ? 'border-amber-500 bg-amber-500/10 shadow-xs ring-1 ring-amber-500/30'
                    : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-300 dark:hover:border-neutral-700'
                }`}
              >
                <div className="space-y-1 truncate pr-2">
                  <div className="flex items-center gap-2">
                    <span
                      style={{ backgroundColor: preset.accent }}
                      className="w-2.5 h-2.5 rounded-full inline-block shrink-0 shadow-xs"
                    />
                    <span className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                      {preset.name}
                    </span>
                  </div>
                  <p className="text-[10px] text-neutral-500 truncate">{preset.desc}</p>
                </div>
                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-amber-500 text-neutral-950 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. TYPOGRAPHY & SIZING */}
      <div className="space-y-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <Type className="w-4 h-4 text-amber-500" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
            Typography & Font Sizing
          </h4>
        </div>

        {/* Font Family */}
        <div>
          <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
            Font Family
          </label>
          <select
            value={styleOptions.fontFamily}
            onChange={e => onChange({ fontFamily: e.target.value })}
            className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            {FONT_OPTIONS.map(f => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>

        {/* Font Sizing Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <div className="flex justify-between text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
              <span>Title Size</span>
              <span className="font-mono">{styleOptions.titleFontSize}px</span>
            </div>
            <input
              type="range"
              min={12}
              max={32}
              value={styleOptions.titleFontSize}
              onChange={e => onChange({ titleFontSize: Number(e.target.value) })}
              className="w-full accent-amber-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
              <span>Grid / Letters</span>
              <span className="font-mono">{styleOptions.gridFontSize}px</span>
            </div>
            <input
              type="range"
              min={9}
              max={24}
              value={styleOptions.gridFontSize}
              onChange={e => onChange({ gridFontSize: Number(e.target.value) })}
              className="w-full accent-amber-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
              <span>Clues / Words</span>
              <span className="font-mono">{styleOptions.clueFontSize}px</span>
            </div>
            <input
              type="range"
              min={8}
              max={16}
              value={styleOptions.clueFontSize}
              onChange={e => onChange({ clueFontSize: Number(e.target.value) })}
              className="w-full accent-amber-500"
            />
          </div>
        </div>
      </div>

      {/* 3. BORDERS & COLORS */}
      <div className="space-y-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-amber-500" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
            Colors & Line Styling
          </h4>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
              Text Color
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={styleOptions.textColor || '#111827'}
                onChange={e => onChange({ textColor: e.target.value })}
                className="w-8 h-8 rounded-lg border border-neutral-200 cursor-pointer"
              />
              <span className="text-[10px] font-mono text-neutral-500">{styleOptions.textColor}</span>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
              Border Color
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={styleOptions.borderColor || '#111827'}
                onChange={e => onChange({ borderColor: e.target.value })}
                className="w-8 h-8 rounded-lg border border-neutral-200 cursor-pointer"
              />
              <span className="text-[10px] font-mono text-neutral-500">{styleOptions.borderColor}</span>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
              Highlight Color
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={styleOptions.highlightColor || '#F59E0B'}
                onChange={e => onChange({ highlightColor: e.target.value })}
                className="w-8 h-8 rounded-lg border border-neutral-200 cursor-pointer"
              />
              <span className="text-[10px] font-mono text-neutral-500">{styleOptions.highlightColor}</span>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
              Background
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={styleOptions.backgroundColor || '#FFFFFF'}
                onChange={e => onChange({ backgroundColor: e.target.value })}
                className="w-8 h-8 rounded-lg border border-neutral-200 cursor-pointer"
              />
              <span className="text-[10px] font-mono text-neutral-500">{styleOptions.backgroundColor}</span>
            </div>
          </div>
        </div>

        {/* Grid Line Width */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div>
            <div className="flex justify-between text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
              <span>Grid Border Width</span>
              <span className="font-mono">{styleOptions.gridBorderWidth}px</span>
            </div>
            <input
              type="range"
              min={1}
              max={6}
              step={0.5}
              value={styleOptions.gridBorderWidth}
              onChange={e => onChange({ gridBorderWidth: Number(e.target.value) })}
              className="w-full accent-amber-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
              <span>Cell Border Width</span>
              <span className="font-mono">{styleOptions.cellBorderWidth}px</span>
            </div>
            <input
              type="range"
              min={0.5}
              max={3}
              step={0.5}
              value={styleOptions.cellBorderWidth}
              onChange={e => onChange({ cellBorderWidth: Number(e.target.value) })}
              className="w-full accent-amber-500"
            />
          </div>
        </div>
      </div>

      {/* 4. SECTION VISIBILITY TOGGLES */}
      <div className="space-y-3 pt-4 border-t border-neutral-100 dark:border-neutral-800">
        <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400">
          Element Visibility Controls
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <label className="flex items-center gap-2 p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 cursor-pointer text-xs font-medium">
            <input
              type="checkbox"
              checked={styleOptions.showTitle}
              onChange={e => onChange({ showTitle: e.target.checked })}
              className="rounded text-amber-500 focus:ring-amber-500 accent-amber-500"
            />
            <span>Show Title</span>
          </label>

          <label className="flex items-center gap-2 p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 cursor-pointer text-xs font-medium">
            <input
              type="checkbox"
              checked={styleOptions.showInstructions}
              onChange={e => onChange({ showInstructions: e.target.checked })}
              className="rounded text-amber-500 focus:ring-amber-500 accent-amber-500"
            />
            <span>Instructions</span>
          </label>

          <label className="flex items-center gap-2 p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 cursor-pointer text-xs font-medium">
            <input
              type="checkbox"
              checked={styleOptions.showWordBank}
              onChange={e => onChange({ showWordBank: e.target.checked })}
              className="rounded text-amber-500 focus:ring-amber-500 accent-amber-500"
            />
            <span>Word Bank</span>
          </label>
        </div>
      </div>
    </div>
  );
};

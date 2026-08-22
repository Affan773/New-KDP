import React, { useState } from 'react';
import {
  X,
  Sliders,
  Sparkles,
  Check,
  RotateCcw,
  LayoutTemplate,
  Type,
  Maximize2,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Template } from '../../types';
import { useApp } from '../../context/AppContext';

interface TemplateCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: Template;
  onApply: (customizedTemplate: Template) => void;
}

export const TemplateCustomizerModal: React.FC<TemplateCustomizerModalProps> = ({
  isOpen,
  onClose,
  template,
  onApply,
}) => {
  const { createProjectFromTemplate } = useApp();

  // Customization parameters
  const [headingFont, setHeadingFont] = useState('Outfit');
  const [bodyFont, setBodyFont] = useState('Plus Jakarta Sans');
  const [headingSize, setHeadingSize] = useState(22);
  const [bodySize, setBodySize] = useState(13);
  const [borderWidth, setBorderWidth] = useState(1.5);
  const [borderRadius, setBorderRadius] = useState(8);
  const [primaryColor, setPrimaryColor] = useState('#111827');
  const [borderColor, setBorderColor] = useState('#374151');
  const [headerText, setHeaderText] = useState('PUZZLE 01 • WILD ANIMALS');
  const [wordListPlacement, setWordListPlacement] = useState<'bottom' | 'side' | 'two_column'>('bottom');

  if (!isOpen || !template) return null;

  const handleApplyCustomized = () => {
    // Generate customized clone of template
    const clonedTemplate: Template = {
      ...template,
      id: `tmpl-custom-${Date.now()}`,
      name: `${template.name} (Customized)`,
      description: `Customized styling with ${headingFont} and ${bodyFont}`,
      pages: template.pages.map(page => ({
        ...page,
        elements: page.elements.map(el => {
          if (el.type === 'text') {
            const isHeading = el.id.includes('title') || el.id.includes('header');
            return {
              ...el,
              fontFamily: isHeading ? headingFont : bodyFont,
              fontSize: isHeading ? headingSize : bodySize,
              color: primaryColor,
              content: isHeading ? headerText : el.content,
            };
          }
          if (el.type === 'shape') {
            return {
              ...el,
              strokeWidth: borderWidth,
              strokeColor: borderColor,
              borderRadius,
            };
          }
          return el;
        }),
      })),
    };

    onApply(clonedTemplate);
    onClose();
  };

  const handleReset = () => {
    setHeadingFont('Outfit');
    setBodyFont('Plus Jakarta Sans');
    setHeadingSize(22);
    setBodySize(13);
    setBorderWidth(1.5);
    setBorderRadius(8);
    setPrimaryColor('#111827');
    setBorderColor('#374151');
    setHeaderText('PUZZLE 01 • WILD ANIMALS');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-4xl bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-900 dark:text-white font-display">
                Template Layout & Styling Customizer
              </h2>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Customizing: {template.name} ({template.pageSize.name})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body: Two columns */}
        <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-y-auto">
          {/* Controls Column */}
          <div className="md:col-span-6 p-6 space-y-5 border-r border-neutral-100 dark:border-neutral-800">
            {/* Header Text */}
            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                Header Title Text
              </label>
              <input
                type="text"
                value={headerText}
                onChange={e => setHeaderText(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-medium text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>

            {/* Typography */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Heading Font
                </label>
                <select
                  value={headingFont}
                  onChange={e => setHeadingFont(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-medium text-neutral-900 dark:text-white outline-none"
                >
                  {['Outfit', 'Cinzel', 'Space Grotesk', 'Quicksand', 'Playfair Display', 'Inter', 'Bitter'].map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Body & Grid Font
                </label>
                <select
                  value={bodyFont}
                  onChange={e => setBodyFont(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-medium text-neutral-900 dark:text-white outline-none"
                >
                  {['Plus Jakarta Sans', 'Merriweather', 'Poppins', 'Inter', 'Roboto Mono'].map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Font Sizing */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Heading Size ({headingSize}px)
                </label>
                <input
                  type="range"
                  min="16"
                  max="36"
                  value={headingSize}
                  onChange={e => setHeadingSize(Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Body Size ({bodySize}px)
                </label>
                <input
                  type="range"
                  min="10"
                  max="20"
                  value={bodySize}
                  onChange={e => setBodySize(Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>
            </div>

            {/* Borders & Corners */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Border Width ({borderWidth}px)
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="4"
                  step="0.5"
                  value={borderWidth}
                  onChange={e => setBorderWidth(Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Corner Radius ({borderRadius}px)
                </label>
                <input
                  type="range"
                  min="0"
                  max="24"
                  step="2"
                  value={borderRadius}
                  onChange={e => setBorderRadius(Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>
            </div>

            {/* Word List Placement */}
            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                Word List Placement Archetype
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'bottom', label: 'Bottom Horizontal' },
                  { id: 'side', label: 'Right Side' },
                  { id: 'two_column', label: '2-Col Split' },
                ].map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setWordListPlacement(p.id as any)}
                    className={`py-2 px-2.5 rounded-xl border text-[11px] font-bold text-center transition-colors ${
                      wordListPlacement === p.id
                        ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Live Render Column */}
          <div className="md:col-span-6 p-6 flex flex-col items-center justify-center bg-neutral-100/50 dark:bg-neutral-950/40">
            <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-3">
              Live Custom Page Preview (KDP Ratio)
            </div>

            {/* Page Simulation Box */}
            <div className="w-72 sm:w-80 h-[420px] bg-white rounded-xl shadow-xl border border-neutral-300 dark:border-neutral-700 p-6 flex flex-col justify-between select-none">
              {/* Header */}
              <div className="text-center space-y-1">
                <h3
                  className="font-bold tracking-tight text-neutral-900 truncate"
                  style={{ fontFamily: headingFont, fontSize: `${headingSize * 0.75}px` }}
                >
                  {headerText}
                </h3>
              </div>

              {/* Center Puzzle Box */}
              <div
                className="w-full flex-1 my-3 flex items-center justify-center bg-neutral-50/50"
                style={{
                  borderWidth: `${borderWidth}px`,
                  borderColor: borderColor,
                  borderRadius: `${borderRadius}px`,
                }}
              >
                <div
                  className="font-mono font-bold text-neutral-800 text-[10px] tracking-widest text-center leading-loose"
                  style={{ fontFamily: bodyFont }}
                >
                  P U Z Z L E • G R I D
                  <br />
                  1 5 × 1 5 • V E C T O R
                </div>
              </div>

              {/* Word bank */}
              <div className="space-y-1 text-center">
                <div className="text-[9px] font-bold text-neutral-400 tracking-wider">FIND THE WORDS:</div>
                <div
                  className="text-[9px] text-neutral-700 font-semibold leading-tight line-clamp-2"
                  style={{ fontFamily: bodyFont }}
                >
                  ELEPHANT • GIRAFFE • LEOPARD • TIGER • CHEETAH • ZEBRA
                </div>
              </div>

              {/* Page Number */}
              <div className="text-center text-[9px] text-neutral-400 font-mono pt-2">
                Page 1
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-900/50">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleApplyCustomized}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition-all shadow-md shadow-amber-500/20 flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Create Project with Custom Layout</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

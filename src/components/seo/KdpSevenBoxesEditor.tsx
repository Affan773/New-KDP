import React, { useState } from 'react';
import {
  Copy,
  Check,
  Sparkles,
  Download,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  HelpCircle,
  Save,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { KdpSevenBoxesOptimization } from '../../types/seo';
import { KeywordOptimizationService } from '../../services/seo/KeywordOptimizationService';

interface Props {
  sevenBoxes: KdpSevenBoxesOptimization;
  onUpdateBoxes: (newBoxes: KdpSevenBoxesOptimization) => void;
  onOptimizeFromPool: () => void;
  onApplyToProjectMetadata: (phrases: string[]) => void;
  onExportTxt: () => void;
}

export const KdpSevenBoxesEditor: React.FC<Props> = ({
  sevenBoxes,
  onUpdateBoxes,
  onOptimizeFromPool,
  onApplyToProjectMetadata,
  onExportTxt,
}) => {
  const [copiedSlot, setCopiedSlot] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const handlePhraseChange = (slotNumber: number, newPhrase: string) => {
    const updatedBoxes = sevenBoxes.boxes.map(b => {
      if (b.slotNumber === slotNumber) {
        return {
          ...b,
          phrase: newPhrase,
          charCount: newPhrase.length,
          isCompliant: newPhrase.length <= 50,
        };
      }
      return b;
    });

    const evaluated = KeywordOptimizationService.evaluateBoxesCollection(updatedBoxes);
    onUpdateBoxes(evaluated);
  };

  const handleCopySlot = (slotNumber: number, phrase: string) => {
    navigator.clipboard.writeText(phrase);
    setCopiedSlot(slotNumber);
    setTimeout(() => setCopiedSlot(null), 2000);
  };

  const handleCopyAll = () => {
    const text = sevenBoxes.boxes.map(b => b.phrase).filter(Boolean).join('\n');
    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleClearAll = () => {
    if (confirm('Clear all 7 keyword boxes?')) {
      const cleared = sevenBoxes.boxes.map(b => ({
        ...b,
        phrase: '',
        charCount: 0,
        keywordsIncluded: [],
        warnings: [],
        isCompliant: true,
      }));
      onUpdateBoxes(KeywordOptimizationService.evaluateBoxesCollection(cleared));
    }
  };

  return (
    <div id="kdp-seven-boxes-editor-container" className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-slate-900">Amazon KDP 7-Keyword Boxes</h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
              50 Chars / Slot Limit
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Amazon indexes each box individually. Eliminate word repetition across boxes to maximize search coverage.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="btn-optimize-7-boxes"
            onClick={onOptimizeFromPool}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg text-xs shadow-sm transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Auto-Optimize 7 Boxes
          </button>

          <button
            id="btn-copy-all-7-boxes"
            onClick={handleCopyAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium rounded-lg text-xs shadow-sm transition-all"
          >
            {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            Copy All Boxes
          </button>

          <button
            id="btn-export-7-boxes-txt"
            onClick={onExportTxt}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium rounded-lg text-xs shadow-sm transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            Export TXT
          </button>

          <button
            id="btn-clear-all-boxes"
            onClick={handleClearAll}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="Clear all boxes"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
          <div className="text-[11px] font-medium text-slate-500 uppercase">Keyword Set Score</div>
          <div className="text-xl font-bold text-amber-600">{sevenBoxes.overallKeywordSetScore || 0}%</div>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
          <div className="text-[11px] font-medium text-slate-500 uppercase">Characters Used</div>
          <div className="text-xl font-bold text-slate-800">
            {sevenBoxes.totalCharactersUsed} <span className="text-xs text-slate-400 font-normal">/ 350 max</span>
          </div>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
          <div className="text-[11px] font-medium text-slate-500 uppercase">Unique Words</div>
          <div className="text-xl font-bold text-emerald-600">{sevenBoxes.totalUniqueWords}</div>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
          <div className="text-[11px] font-medium text-slate-500 uppercase">Duplicate Repetitions</div>
          <div className={`text-xl font-bold ${sevenBoxes.duplicateWordCount > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
            {sevenBoxes.duplicateWordCount}
          </div>
        </div>
      </div>

      {/* Warnings & Recommendations */}
      {sevenBoxes.recommendations.length > 0 && (
        <div className="space-y-1.5 p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-xs text-amber-900">
          <div className="font-semibold flex items-center gap-1.5 text-amber-800">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Optimization Guidance:
          </div>
          {sevenBoxes.recommendations.map((rec, i) => (
            <div key={i} className="pl-5 text-amber-900/90 leading-normal">
              • {rec}
            </div>
          ))}
        </div>
      )}

      {/* 7 Boxes Inputs */}
      <div className="space-y-3">
        {sevenBoxes.boxes.map(box => {
          const isOver = box.charCount > 50;
          const isNear = box.charCount >= 45 && box.charCount <= 50;

          return (
            <div
              key={box.slotNumber}
              className={`p-3.5 rounded-lg border transition-all ${
                isOver
                  ? 'border-rose-300 bg-rose-50/40'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between gap-3 mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center">
                    {box.slotNumber}
                  </span>
                  <span className="text-xs font-semibold text-slate-700">
                    Keyword Box {box.slotNumber}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Character Counter */}
                  <span
                    className={`text-xs font-mono font-semibold px-2 py-0.5 rounded ${
                      isOver
                        ? 'bg-rose-100 text-rose-800'
                        : isNear
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {box.charCount}/50 chars
                  </span>

                  {/* Copy Single Slot */}
                  <button
                    id={`btn-copy-box-${box.slotNumber}`}
                    onClick={() => handleCopySlot(box.slotNumber, box.phrase)}
                    disabled={!box.phrase}
                    className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded disabled:opacity-30"
                    title="Copy this keyword box"
                  >
                    {copiedSlot === box.slotNumber ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Input */}
              <input
                id={`input-box-phrase-${box.slotNumber}`}
                type="text"
                value={box.phrase}
                onChange={e => handlePhraseChange(box.slotNumber, e.target.value)}
                placeholder={`e.g. relaxing large print puzzles for seniors`}
                className={`w-full px-3 py-2 text-sm bg-white border rounded-lg focus:outline-none focus:ring-2 ${
                  isOver
                    ? 'border-rose-400 focus:ring-rose-400'
                    : 'border-slate-300 focus:ring-amber-500 focus:border-amber-500'
                }`}
              />

              {/* Warnings */}
              {box.warnings.length > 0 && (
                <div className="mt-1 text-[11px] text-rose-600 font-medium">
                  {box.warnings.join(', ')}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Save / Apply to Active Project */}
      <div className="pt-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-3">
        <div className="text-xs text-slate-500">
          Clicking "Apply to Book Metadata" saves these 7 phrases directly to your active project's KDP settings.
        </div>

        <button
          id="btn-apply-7-boxes-to-project"
          onClick={() => onApplyToProjectMetadata(sevenBoxes.boxes.map(b => b.phrase).filter(Boolean))}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs shadow transition-all"
        >
          <Save className="w-3.5 h-3.5" />
          Apply to Book Metadata
        </button>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  Sliders,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Layers,
  Trash2,
  Copy,
  ShieldCheck,
  BookOpen,
  ArrowUp,
  ArrowDown,
  RotateCw,
  Palette,
  Maximize2,
  FileText,
  Lock,
  Unlock,
  Link,
  Unlink,
  AlignVerticalJustifyCenter,
  AlignHorizontalDistributeCenter,
  AlignVerticalDistributeCenter,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Grid,
} from 'lucide-react';
import { useEditor } from '../../context/EditorContext';
import { useApp } from '../../context/AppContext';
import { CanvasElement, ShapeElement, TextElement, ImageElement } from '../../types';
import { EditorLayersPanel } from './EditorLayersPanel';
import { PuzzleRegistry } from '../../puzzles/core/PuzzleRegistry';
import { GeneratedPuzzle, PuzzleType, AnyPuzzleSettings } from '../../puzzles/types';

export const EditorRightPanel: React.FC = () => {
  const {
    document,
    currentPageIndex,
    selectedElementIds,
    selectedElements,
    updateElement,
    updateElements,
    deleteSelectedElements,
    duplicateSelectedElements,
    toggleLockSelected,
    toggleAspectRatioLock,
    alignElements,
    distributeElements,
    updatePageBackground,
    updatePagePattern,
    updatePageName,
    updateCurrentPageNotes,
  } = useEditor();

  const { activeProject } = useApp();
  const [activeTab, setActiveTab] = useState<'properties' | 'layers' | 'page'>('properties');

  const currentPage = document?.pages?.[currentPageIndex];
  const selectedElement: CanvasElement | undefined = currentPage?.elements?.find(
    el => el.id === selectedElementIds[0]
  );

  const fontFamilies = [
    'Outfit',
    'Plus Jakarta Sans',
    'Playfair Display',
    'Cinzel',
    'Bebas Neue',
    'Caveat',
    'Courier Prime',
    'Montserrat',
    'Merriweather',
    'Inter',
    'Roboto',
  ];

  return (
    <div className="w-72 sm:w-80 h-full border-l border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-col z-20 select-none overflow-hidden">
      {/* PANEL TABS */}
      <div className="flex border-b border-neutral-200 dark:border-neutral-800 p-1.5 gap-1 bg-neutral-50 dark:bg-neutral-900/50 shrink-0">
        <button
          onClick={() => setActiveTab('properties')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'properties'
              ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white shadow-xs'
              : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Inspector</span>
        </button>

        <button
          onClick={() => setActiveTab('layers')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'layers'
              ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white shadow-xs'
              : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Layers ({currentPage?.elements?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('page')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'page'
              ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white shadow-xs'
              : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Page</span>
        </button>
      </div>

      {/* TAB CONTENT (Scrollable) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* ================= TAB 1: PROPERTIES ================= */}
        {activeTab === 'properties' && (
          <>
            {selectedElement ? (
              <div className="space-y-4">
                {/* Header & Quick Action Buttons */}
                <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
                      {selectedElement.name || selectedElement.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={toggleLockSelected}
                      className={`p-1.5 rounded-lg transition-colors ${
                        selectedElement.locked
                          ? 'bg-amber-500/20 text-amber-500'
                          : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
                      }`}
                      title={selectedElement.locked ? 'Unlock Element' : 'Lock Position'}
                    >
                      {selectedElement.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={duplicateSelectedElements}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
                      title="Duplicate Element (Ctrl+D)"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={deleteSelectedElements}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-500 transition-colors"
                      title="Delete Element (Del)"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* GEOMETRY & TRANSFORM CONTROLS */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                      Transform & Position
                    </span>
                    <button
                      onClick={toggleAspectRatioLock}
                      className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-mono ${
                        selectedElement.aspectRatioLocked
                          ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                          : 'text-neutral-400 hover:text-neutral-600'
                      }`}
                      title="Lock Aspect Ratio"
                    >
                      {selectedElement.aspectRatioLocked ? <Link className="w-3 h-3" /> : <Unlink className="w-3 h-3" />}
                      <span>{selectedElement.aspectRatioLocked ? 'Locked Ratio' : 'Free Ratio'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1.5 p-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                      <span className="text-neutral-400 font-mono text-[10px]">X:</span>
                      <input
                        type="number"
                        disabled={selectedElement.locked}
                        value={selectedElement.x}
                        onChange={e => updateElement(selectedElement.id, { x: parseInt(e.target.value) || 0 })}
                        className="w-full bg-transparent font-mono text-neutral-900 dark:text-white outline-none disabled:opacity-50"
                      />
                    </div>
                    <div className="flex items-center gap-1.5 p-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                      <span className="text-neutral-400 font-mono text-[10px]">Y:</span>
                      <input
                        type="number"
                        disabled={selectedElement.locked}
                        value={selectedElement.y}
                        onChange={e => updateElement(selectedElement.id, { y: parseInt(e.target.value) || 0 })}
                        className="w-full bg-transparent font-mono text-neutral-900 dark:text-white outline-none disabled:opacity-50"
                      />
                    </div>
                    <div className="flex items-center gap-1.5 p-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                      <span className="text-neutral-400 font-mono text-[10px]">W:</span>
                      <input
                        type="number"
                        disabled={selectedElement.locked}
                        value={selectedElement.width}
                        onChange={e => updateElement(selectedElement.id, { width: parseInt(e.target.value) || 10 })}
                        className="w-full bg-transparent font-mono text-neutral-900 dark:text-white outline-none disabled:opacity-50"
                      />
                    </div>
                    <div className="flex items-center gap-1.5 p-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                      <span className="text-neutral-400 font-mono text-[10px]">H:</span>
                      <input
                        type="number"
                        disabled={selectedElement.locked}
                        value={selectedElement.height}
                        onChange={e => updateElement(selectedElement.id, { height: parseInt(e.target.value) || 10 })}
                        className="w-full bg-transparent font-mono text-neutral-900 dark:text-white outline-none disabled:opacity-50"
                      />
                    </div>
                  </div>

                  {/* Rotation Angle Stepper */}
                  <div className="flex items-center justify-between p-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs">
                    <span className="text-neutral-400 flex items-center gap-1">
                      <RotateCw className="w-3.5 h-3.5" />
                      <span>Rotation:</span>
                    </span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        max="360"
                        disabled={selectedElement.locked}
                        value={selectedElement.rotation || 0}
                        onChange={e => updateElement(selectedElement.id, { rotation: parseInt(e.target.value) || 0 })}
                        className="w-14 bg-transparent font-mono font-bold text-right outline-none disabled:opacity-50"
                      />
                      <span className="font-mono text-neutral-400">°</span>
                    </div>
                  </div>

                  {/* Opacity Slider */}
                  <div className="flex items-center justify-between p-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs">
                    <span className="text-neutral-400">Opacity:</span>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.05"
                      disabled={selectedElement.locked}
                      value={selectedElement.opacity ?? 1}
                      onChange={e => updateElement(selectedElement.id, { opacity: parseFloat(e.target.value) })}
                      className="w-28 accent-amber-500"
                    />
                    <span className="font-mono text-[11px] w-8 text-right">
                      {Math.round((selectedElement.opacity ?? 1) * 100)}%
                    </span>
                  </div>
                </div>

                {/* ALIGNMENT SHORTCUT BUTTONS */}
                <div className="space-y-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    Alignment & Distribution
                  </span>
                  <div className="grid grid-cols-6 gap-1 p-1 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
                    <button
                      onClick={() => alignElements('left')}
                      className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-neutral-700 flex justify-center text-neutral-700 dark:text-neutral-300"
                      title="Align Left"
                    >
                      <AlignLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => alignElements('center')}
                      className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-neutral-700 flex justify-center text-neutral-700 dark:text-neutral-300"
                      title="Center Horizontally"
                    >
                      <AlignCenter className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => alignElements('right')}
                      className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-neutral-700 flex justify-center text-neutral-700 dark:text-neutral-300"
                      title="Align Right"
                    >
                      <AlignRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => alignElements('middle')}
                      className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-neutral-700 flex justify-center text-neutral-700 dark:text-neutral-300"
                      title="Center Vertically"
                    >
                      <AlignVerticalJustifyCenter className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => distributeElements('horizontal')}
                      className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-neutral-700 flex justify-center text-neutral-700 dark:text-neutral-300"
                      title="Distribute Horizontally"
                    >
                      <AlignHorizontalDistributeCenter className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => distributeElements('vertical')}
                      className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-neutral-700 flex justify-center text-neutral-700 dark:text-neutral-300"
                      title="Distribute Vertically"
                    >
                      <AlignVerticalDistributeCenter className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* ================= TEXT SPECIFIC CONTROLS ================= */}
                {selectedElement.type === 'text' && (
                  <div className="space-y-3 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                      Typography & Text Styles
                    </span>

                    {/* Font Family */}
                    <div>
                      <select
                        value={(selectedElement as TextElement).fontFamily || 'Plus Jakarta Sans'}
                        onChange={e => updateElement(selectedElement.id, { fontFamily: e.target.value })}
                        className="w-full p-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-semibold text-neutral-900 dark:text-white outline-none"
                      >
                        {fontFamilies.map(f => (
                          <option key={f} value={f}>
                            {f}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Font Size & Weight */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-1.5 p-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs">
                        <span className="text-neutral-400">Size:</span>
                        <input
                          type="number"
                          value={(selectedElement as TextElement).fontSize || 16}
                          onChange={e => updateElement(selectedElement.id, { fontSize: parseInt(e.target.value) || 12 })}
                          className="w-full bg-transparent font-mono font-semibold outline-none"
                        />
                      </div>
                      <div>
                        <select
                          value={(selectedElement as TextElement).fontWeight || '400'}
                          onChange={e => updateElement(selectedElement.id, { fontWeight: e.target.value })}
                          className="w-full p-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-semibold text-neutral-900 dark:text-white outline-none"
                        >
                          <option value="400">Regular (400)</option>
                          <option value="500">Medium (500)</option>
                          <option value="600">Semibold (600)</option>
                          <option value="700">Bold (700)</option>
                          <option value="800">Extra Bold (800)</option>
                        </select>
                      </div>
                    </div>

                    {/* Text Styling (Bold, Italic, Underline, Strikethrough) */}
                    <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl">
                      <button
                        onClick={() =>
                          updateElement(selectedElement.id, {
                            fontWeight: (selectedElement as TextElement).fontWeight === '700' ? '400' : '700',
                          })
                        }
                        className={`p-1.5 rounded-lg flex-1 flex items-center justify-center ${
                          (selectedElement as TextElement).fontWeight === '700'
                            ? 'bg-white dark:bg-neutral-700 text-amber-500 shadow-xs'
                            : 'text-neutral-500'
                        }`}
                        title="Bold"
                      >
                        <Bold className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() =>
                          updateElement(selectedElement.id, {
                            fontStyle: (selectedElement as TextElement).fontStyle === 'italic' ? 'normal' : 'italic',
                          })
                        }
                        className={`p-1.5 rounded-lg flex-1 flex items-center justify-center ${
                          (selectedElement as TextElement).fontStyle === 'italic'
                            ? 'bg-white dark:bg-neutral-700 text-amber-500 shadow-xs'
                            : 'text-neutral-500'
                        }`}
                        title="Italic"
                      >
                        <Italic className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() =>
                          updateElement(selectedElement.id, {
                            textDecoration: (selectedElement as TextElement).textDecoration === 'underline' ? 'none' : 'underline',
                          })
                        }
                        className={`p-1.5 rounded-lg flex-1 flex items-center justify-center ${
                          (selectedElement as TextElement).textDecoration === 'underline'
                            ? 'bg-white dark:bg-neutral-700 text-amber-500 shadow-xs'
                            : 'text-neutral-500'
                        }`}
                        title="Underline"
                      >
                        <Underline className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() =>
                          updateElement(selectedElement.id, {
                            textDecoration: (selectedElement as TextElement).textDecoration === 'line-through' ? 'none' : 'line-through',
                          })
                        }
                        className={`p-1.5 rounded-lg flex-1 flex items-center justify-center ${
                          (selectedElement as TextElement).textDecoration === 'line-through'
                            ? 'bg-white dark:bg-neutral-700 text-amber-500 shadow-xs'
                            : 'text-neutral-500'
                        }`}
                        title="Strikethrough"
                      >
                        <Strikethrough className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Text Alignment */}
                    <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl justify-between">
                      {(['left', 'center', 'right', 'justify'] as const).map(align => (
                        <button
                          key={align}
                          onClick={() => updateElement(selectedElement.id, { textAlign: align })}
                          className={`p-1.5 rounded-lg flex-1 flex items-center justify-center ${
                            (selectedElement as TextElement).textAlign === align
                              ? 'bg-white dark:bg-neutral-700 text-amber-500 shadow-xs'
                              : 'text-neutral-500'
                          }`}
                        >
                          {align === 'left' && <AlignLeft className="w-3.5 h-3.5" />}
                          {align === 'center' && <AlignCenter className="w-3.5 h-3.5" />}
                          {align === 'right' && <AlignRight className="w-3.5 h-3.5" />}
                          {align === 'justify' && <AlignJustify className="w-3.5 h-3.5" />}
                        </button>
                      ))}
                    </div>

                    {/* Colors (Text & Highlight Background) */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center justify-between p-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                        <span className="text-neutral-500">Color:</span>
                        <input
                          type="color"
                          value={(selectedElement as TextElement).color || '#111827'}
                          onChange={e => updateElement(selectedElement.id, { color: e.target.value })}
                          className="w-6 h-6 rounded-md cursor-pointer bg-transparent border-none"
                        />
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                        <span className="text-neutral-500">Highlight:</span>
                        <input
                          type="color"
                          value={(selectedElement as TextElement).backgroundColor || '#FFFFFF'}
                          onChange={e => updateElement(selectedElement.id, { backgroundColor: e.target.value })}
                          className="w-6 h-6 rounded-md cursor-pointer bg-transparent border-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* ================= SHAPE SPECIFIC CONTROLS ================= */}
                {(selectedElement.type === 'shape' || selectedElement.type === 'line') && (
                  <div className="space-y-3 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                      Shape Fill & Outline
                    </span>

                    {selectedElement.type === 'shape' && (
                      <div className="flex items-center justify-between p-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs">
                        <span className="text-neutral-500">Fill Color</span>
                        <input
                          type="color"
                          value={(selectedElement as ShapeElement).fillColor || '#FFFFFF'}
                          onChange={e => updateElement(selectedElement.id, { fillColor: e.target.value })}
                          className="w-6 h-6 rounded-md cursor-pointer bg-transparent"
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between p-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs">
                      <span className="text-neutral-500">Stroke Color</span>
                      <input
                        type="color"
                        value={selectedElement.strokeColor || '#111827'}
                        onChange={e => updateElement(selectedElement.id, { strokeColor: e.target.value })}
                        className="w-6 h-6 rounded-md cursor-pointer bg-transparent"
                      />
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs">
                      <span className="text-neutral-500">Stroke Width ({selectedElement.strokeWidth || 2}px)</span>
                      <input
                        type="range"
                        min="0"
                        max="16"
                        value={selectedElement.strokeWidth || 2}
                        onChange={e => updateElement(selectedElement.id, { strokeWidth: parseInt(e.target.value) })}
                        className="w-24 accent-amber-500"
                      />
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs">
                      <span className="text-neutral-500">Line Style</span>
                      <select
                        value={selectedElement.dashPattern || 'solid'}
                        onChange={e => updateElement(selectedElement.id, { dashPattern: e.target.value as any })}
                        className="bg-transparent font-semibold outline-none text-right"
                      >
                        <option value="solid">Solid</option>
                        <option value="dashed">Dashed</option>
                        <option value="dotted">Dotted</option>
                      </select>
                    </div>

                    {selectedElement.type === 'shape' && (
                      <div className="flex items-center justify-between p-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs">
                        <span className="text-neutral-500">Corner Radius ({(selectedElement as ShapeElement).borderRadius || 0}px)</span>
                        <input
                          type="range"
                          min="0"
                          max="40"
                          value={(selectedElement as ShapeElement).borderRadius || 0}
                          onChange={e => updateElement(selectedElement.id, { borderRadius: parseInt(e.target.value) })}
                          className="w-24 accent-amber-500"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* ================= IMAGE SPECIFIC CONTROLS ================= */}
                {selectedElement.type === 'image' && (
                  <div className="space-y-3 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                      Graphic Properties
                    </span>

                    <div className="space-y-1.5 text-xs">
                      <label className="text-neutral-500">Image Source URL:</label>
                      <input
                        type="text"
                        value={(selectedElement as ImageElement).imageUrl || (selectedElement as ImageElement).src || ''}
                        onChange={e => updateElement(selectedElement.id, { imageUrl: e.target.value, src: e.target.value })}
                        className="w-full p-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs outline-none"
                      />
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs">
                      <span className="text-neutral-500">Object Fit</span>
                      <select
                        value={(selectedElement as ImageElement).objectFit || 'contain'}
                        onChange={e => updateElement(selectedElement.id, { objectFit: e.target.value as any })}
                        className="bg-transparent font-semibold outline-none text-right"
                      >
                        <option value="contain">Contain</option>
                        <option value="cover">Cover</option>
                        <option value="fill">Fill</option>
                      </select>
                    </div>

                    <label className="flex items-center justify-between p-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs cursor-pointer">
                      <span className="text-neutral-500">Grayscale Filter (KDP B&W Print)</span>
                      <input
                        type="checkbox"
                        checked={!!(selectedElement as ImageElement).grayscale}
                        onChange={e => updateElement(selectedElement.id, { grayscale: e.target.checked })}
                        className="rounded text-amber-500 focus:ring-0"
                      />
                    </label>
                  </div>
                )}

                {/* ================= PUZZLE SPECIFIC CONTROLS ================= */}
                {selectedElement.type === 'puzzle' && (() => {
                  const puz = (selectedElement.puzzleData as unknown as GeneratedPuzzle) || null;
                  const preview = (selectedElement.previewData || {}) as Record<string, any>;
                  const isSolution = !!preview.showSolution;

                  const handleToggleSolution = () => {
                    updateElement(selectedElement.id, {
                      previewData: {
                        ...preview,
                        showSolution: !isSolution,
                      },
                    });
                  };

                  const handleRegenerateSeed = () => {
                    try {
                      const pType = (selectedElement.puzzleType || 'word_search') as PuzzleType;
                      const nextSeed = Math.floor(Math.random() * 100000) + 1;
                      const newPuzzle = PuzzleRegistry.generate({
                        ...(puz?.settings || { puzzleType: pType }),
                        puzzleType: pType,
                        seed: nextSeed,
                        title: selectedElement.title || selectedElement.name,
                        difficulty: (selectedElement.difficulty as any) || 'Medium',
                      } as AnyPuzzleSettings);

                      updateElement(selectedElement.id, {
                        puzzleData: newPuzzle as any,
                      });
                    } catch (err) {
                      console.error('Failed to regenerate puzzle:', err);
                    }
                  };

                  return (
                    <div className="space-y-3 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                          Puzzle Settings & Key
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 capitalize">
                          {selectedElement.puzzleType?.replace('_', ' ') || 'Puzzle'}
                        </span>
                      </div>

                      {/* Solution View Switch */}
                      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold text-amber-900 dark:text-amber-300 block">
                            Display Mode
                          </span>
                          <span className="text-[10px] text-amber-700 dark:text-amber-400">
                            {isSolution ? 'Showing Solution Answer Key' : 'Showing Unsolved Puzzle'}
                          </span>
                        </div>
                        <button
                          onClick={handleToggleSolution}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                            isSolution
                              ? 'bg-amber-500 text-neutral-950 shadow-xs'
                              : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700'
                          }`}
                        >
                          {isSolution ? 'Answer Key' : 'Puzzle Mode'}
                        </button>
                      </div>

                      {/* Difficulty Selector */}
                      <div className="flex items-center justify-between p-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs">
                        <span className="text-neutral-500">Difficulty</span>
                        <select
                          value={selectedElement.difficulty || 'Medium'}
                          onChange={e => {
                            const diff = e.target.value as any;
                            const pType = (selectedElement.puzzleType || 'word_search') as PuzzleType;
                            try {
                              const newPuzzle = PuzzleRegistry.generate({
                                ...(puz?.settings || {}),
                                puzzleType: pType,
                                difficulty: diff,
                                seed: (puz?.seed) || 12345,
                                title: selectedElement.title || selectedElement.name,
                              } as AnyPuzzleSettings);
                              updateElement(selectedElement.id, {
                                difficulty: diff,
                                puzzleData: newPuzzle as any,
                              });
                            } catch (err) {
                              updateElement(selectedElement.id, { difficulty: diff });
                            }
                          }}
                          className="bg-transparent font-semibold outline-none text-right"
                        >
                          <option value="Easy">Easy</option>
                          <option value="Medium">Medium</option>
                          <option value="Hard">Hard</option>
                          <option value="Expert">Expert</option>
                        </select>
                      </div>

                      {/* Regenerate Random Seed Button */}
                      <button
                        onClick={handleRegenerateSeed}
                        className="w-full py-2 px-3 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold text-xs flex items-center justify-center gap-2 shadow-xs hover:opacity-90 active:scale-[0.98] transition-all"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                        <span>Regenerate New Seed</span>
                      </button>

                      {/* Visual Toggles */}
                      <div className="space-y-1.5 pt-1">
                        <label className="flex items-center justify-between p-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs cursor-pointer">
                          <span className="text-neutral-500">Show Title Header</span>
                          <input
                            type="checkbox"
                            checked={preview.showTitle !== false}
                            onChange={e =>
                              updateElement(selectedElement.id, {
                                previewData: { ...preview, showTitle: e.target.checked },
                              })
                            }
                            className="rounded text-amber-500 focus:ring-0"
                          />
                        </label>

                        <label className="flex items-center justify-between p-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs cursor-pointer">
                          <span className="text-neutral-500">Show Instructions</span>
                          <input
                            type="checkbox"
                            checked={preview.showInstructions !== false}
                            onChange={e =>
                              updateElement(selectedElement.id, {
                                previewData: { ...preview, showInstructions: e.target.checked },
                              })
                            }
                            className="rounded text-amber-500 focus:ring-0"
                          />
                        </label>

                        {selectedElement.puzzleType === 'word_search' && (
                          <label className="flex items-center justify-between p-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs cursor-pointer">
                            <span className="text-neutral-500">Show Word Bank</span>
                            <input
                              type="checkbox"
                              checked={preview.showWordBank !== false}
                              onChange={e =>
                                updateElement(selectedElement.id, {
                                  previewData: { ...preview, showWordBank: e.target.checked },
                                })
                              }
                              className="rounded text-amber-500 focus:ring-0"
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              /* NO SELECTION STATE -> QUICK PAGE GUIDE */
              <div className="space-y-4 text-center py-6">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
                  <Sliders className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
                    No Element Selected
                  </h4>
                  <p className="text-[11px] text-neutral-500 px-4">
                    Click any text, shape, or image on the canvas to inspect and edit its properties.
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        {/* ================= TAB 2: LAYERS ================= */}
        {activeTab === 'layers' && <EditorLayersPanel />}

        {/* ================= TAB 3: PAGE SETTINGS ================= */}
        {activeTab === 'page' && (
          <div className="space-y-5">
            {/* Page Header */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                Page Title / Label
              </label>
              <input
                type="text"
                value={currentPage?.name || `Page ${currentPage?.pageNumber || 1}`}
                onChange={e => updatePageName(currentPageIndex, e.target.value)}
                className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-semibold text-neutral-900 dark:text-white outline-none"
              />
            </div>

            {/* Background Color Picker */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                Page Canvas Background
              </label>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs">
                <span className="text-neutral-500 font-medium">Solid Background</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] uppercase">
                    {currentPage?.backgroundColor || '#FFFFFF'}
                  </span>
                  <input
                    type="color"
                    value={currentPage?.backgroundColor || '#FFFFFF'}
                    onChange={e => updatePageBackground(e.target.value)}
                    className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-none"
                  />
                </div>
              </div>
            </div>

            {/* Page Interior Background Patterns */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                Interior Pattern Style
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { id: 'none', label: 'Plain Solid' },
                  { id: 'lined', label: 'Lined Notebook' },
                  { id: 'dotGrid', label: 'Bullet Dot Grid' },
                  { id: 'graph', label: 'Graph Paper' },
                ].map(ptn => (
                  <button
                    key={ptn.id}
                    onClick={() => updatePagePattern(ptn.id as any)}
                    className={`p-2.5 rounded-xl border text-left font-medium transition-all ${
                      (currentPage?.pattern || 'none') === ptn.id
                        ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold'
                        : 'border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    {ptn.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Page Notes */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                Author Notes & KDP Intent
              </label>
              <textarea
                value={currentPage?.notes || ''}
                onChange={e => updateCurrentPageNotes(e.target.value)}
                placeholder="e.g. Solution Page, Table of Contents, Chapter 2 Title"
                rows={3}
                className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs text-neutral-900 dark:text-white resize-none outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            {/* KDP Book Specifications Snapshot */}
            <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 space-y-2.5">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
                  KDP Print Specifications
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/15 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Trim Size:</span>
                  <span className="font-mono font-semibold text-neutral-900 dark:text-white">
                    {activeProject?.kdpSettings.trimSize.name || '6" × 9"'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Spine Width:</span>
                  <span className="font-mono font-semibold text-neutral-900 dark:text-white">
                    {activeProject?.kdpSettings.spineWidthInches || 0.18}"
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Gutter Margin:</span>
                  <span className="font-mono font-semibold text-neutral-900 dark:text-white">
                    {activeProject?.kdpSettings.margins.left || 0.625}"
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Spread Position:</span>
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                    {(currentPage?.pageNumber || 1) % 2 === 0 ? 'Left (Even)' : 'Right (Odd)'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

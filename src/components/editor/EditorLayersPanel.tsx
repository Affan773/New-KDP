import React from 'react';
import {
  Layers,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  ArrowUp,
  ArrowDown,
  ArrowUpToLine,
  ArrowDownToLine,
  Trash2,
  Copy,
  Type,
  Square,
  Minus,
  Image as ImageIcon,
  Grid3X3,
  Group as GroupIcon,
} from 'lucide-react';
import { useEditor } from '../../context/EditorContext';
import { CanvasElement } from '../../types';

export const EditorLayersPanel: React.FC = () => {
  const {
    document,
    currentPageIndex,
    selectedElementIds,
    selectElement,
    updateElement,
    bringForward,
    sendBackward,
    bringToFront,
    sendToBack,
    reorderLayers,
    toggleElementVisibility,
    deleteSelectedElements,
    duplicateSelectedElements,
  } = useEditor();

  const currentPage = document?.pages?.[currentPageIndex];
  const elements = currentPage?.elements || [];

  // Top of stack is displayed first (reversed array for visual layer tree)
  const sortedLayers = [...elements].sort((a, b) => (b.zIndex || 1) - (a.zIndex || 1));

  const getElementIcon = (el: CanvasElement) => {
    switch (el.type) {
      case 'text':
        return <Type className="w-3.5 h-3.5 text-blue-500" />;
      case 'shape':
        return <Square className="w-3.5 h-3.5 text-amber-500" />;
      case 'line':
        return <Minus className="w-3.5 h-3.5 text-emerald-500" />;
      case 'image':
        return <ImageIcon className="w-3.5 h-3.5 text-purple-500" />;
      case 'puzzle':
        return <Grid3X3 className="w-3.5 h-3.5 text-rose-500" />;
      case 'group':
        return <GroupIcon className="w-3.5 h-3.5 text-cyan-500" />;
      default:
        return <Layers className="w-3.5 h-3.5 text-neutral-400" />;
    }
  };

  const getElementTitle = (el: CanvasElement) => {
    if (el.name) return el.name;
    if (el.type === 'text') {
      return (el as any).content ? `"${(el as any).content.slice(0, 18)}..."` : 'Text Box';
    }
    if (el.type === 'shape') return `${(el as any).shapeType || 'Rectangle'} Shape`;
    if (el.type === 'puzzle') return `${(el as any).puzzleType || 'Puzzle'} Grid`;
    if (el.type === 'image') return 'Graphic Asset';
    if (el.type === 'group') return `Group (${(el as any).childrenIds?.length || 0} items)`;
    return 'Element';
  };

  return (
    <div className="space-y-4">
      {/* Header & Quick Layer Reordering Controls */}
      <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-amber-500" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
            Layers ({elements.length})
          </h3>
        </div>

        {selectedElementIds.length > 0 && (
          <div className="flex items-center gap-1">
            <button
              onClick={bringToFront}
              className="p-1 rounded text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              title="Bring to Front"
            >
              <ArrowUpToLine className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={bringForward}
              className="p-1 rounded text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              title="Bring Forward"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={sendBackward}
              className="p-1 rounded text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              title="Send Backward"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={sendToBack}
              className="p-1 rounded text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              title="Send to Back"
            >
              <ArrowDownToLine className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Layers List */}
      {sortedLayers.length === 0 ? (
        <div className="p-6 text-center text-xs text-neutral-400 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl">
          No elements placed on this page. Add text, shapes, or assets from the left toolbox.
        </div>
      ) : (
        <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
          {sortedLayers.map(el => {
            const isSelected = selectedElementIds.includes(el.id);
            const isHidden = el.opacity === 0;

            return (
              <div
                key={el.id}
                onClick={e => selectElement(el.id, e.shiftKey)}
                className={`w-full p-2 rounded-xl border flex items-center justify-between gap-2 text-xs transition-all cursor-pointer select-none group ${
                  isSelected
                    ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-500 text-neutral-950 dark:text-white shadow-xs font-semibold'
                    : 'bg-neutral-50 dark:bg-neutral-800/60 border-neutral-200 dark:border-neutral-700 hover:border-neutral-400 text-neutral-700 dark:text-neutral-300'
                }`}
              >
                {/* Left: Icon & Label */}
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {getElementIcon(el)}
                  <span className="truncate text-xs">{getElementTitle(el)}</span>
                </div>

                {/* Right: Quick Lock & Visibility Toggles */}
                <div className="flex items-center gap-1 shrink-0">
                  {/* Visibility */}
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      toggleElementVisibility(el.id);
                    }}
                    className="p-1 rounded text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
                    title={isHidden ? 'Unhide Layer' : 'Hide Layer'}
                  >
                    {isHidden ? (
                      <EyeOff className="w-3.5 h-3.5 text-neutral-400" />
                    ) : (
                      <Eye className="w-3.5 h-3.5 text-neutral-500" />
                    )}
                  </button>

                  {/* Lock */}
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      updateElement(el.id, { locked: !el.locked });
                    }}
                    className={`p-1 rounded transition-colors ${
                      el.locked ? 'text-amber-500' : 'text-neutral-400 hover:text-neutral-800'
                    }`}
                    title={el.locked ? 'Unlock Element' : 'Lock Element'}
                  >
                    {el.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

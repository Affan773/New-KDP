import React, { useEffect, useRef } from 'react';
import {
  Scissors,
  Copy,
  Clipboard,
  Trash2,
  CopyPlus,
  ArrowUpToLine,
  ArrowUp,
  ArrowDown,
  ArrowDownToLine,
  Group,
  Ungroup,
  Lock,
  Unlock,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignVerticalJustifyCenter,
  Plus,
} from 'lucide-react';
import { useEditor } from '../../context/EditorContext';

interface EditorContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
}

export const EditorContextMenu: React.FC<EditorContextMenuProps> = ({ x, y, onClose }) => {
  const {
    selectedElements,
    selectedElementIds,
    clipboard,
    cutSelected,
    copySelected,
    pasteClipboard,
    duplicateSelectedElements,
    deleteSelectedElements,
    bringToFront,
    bringForward,
    sendBackward,
    sendToBack,
    groupSelectedElements,
    ungroupSelectedElements,
    toggleLockSelected,
    alignElements,
    addPage,
  } = useEditor();

  const menuRef = useRef<HTMLDivElement>(null);

  const hasSelection = selectedElementIds.length > 0;
  const hasMultipleSelection = selectedElementIds.length > 1;
  const hasGroupSelected = selectedElements.some(e => e.type === 'group');
  const allLocked = hasSelection && selectedElements.every(e => e.locked);
  const canPaste = clipboard.length > 0;

  // Close on outside click or escape
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('mousedown', handleOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handleOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // Adjust menu position so it doesn't overflow the viewport
  const menuWidth = 220;
  const menuHeight = 360;
  const adjustedX = Math.min(x, window.innerWidth - menuWidth - 10);
  const adjustedY = Math.min(y, window.innerHeight - menuHeight - 10);

  return (
    <div
      ref={menuRef}
      style={{ left: `${adjustedX}px`, top: `${adjustedY}px` }}
      className="fixed z-50 w-56 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl p-1.5 text-xs text-neutral-800 dark:text-neutral-200 select-none animate-in fade-in zoom-in-95 duration-100 space-y-1"
    >
      {/* SECTION 1: CLIPBOARD & EDITING */}
      <div className="space-y-0.5">
        <button
          onClick={() => {
            copySelected();
            onClose();
          }}
          disabled={!hasSelection}
          className="w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-40 disabled:hover:bg-transparent transition-colors text-left"
        >
          <div className="flex items-center gap-2">
            <Copy className="w-3.5 h-3.5 text-neutral-500" />
            <span>Copy</span>
          </div>
          <span className="text-[10px] text-neutral-400 font-mono">⌘C</span>
        </button>

        <button
          onClick={() => {
            cutSelected();
            onClose();
          }}
          disabled={!hasSelection}
          className="w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-40 disabled:hover:bg-transparent transition-colors text-left"
        >
          <div className="flex items-center gap-2">
            <Scissors className="w-3.5 h-3.5 text-neutral-500" />
            <span>Cut</span>
          </div>
          <span className="text-[10px] text-neutral-400 font-mono">⌘X</span>
        </button>

        <button
          onClick={() => {
            pasteClipboard();
            onClose();
          }}
          disabled={!canPaste}
          className="w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-40 disabled:hover:bg-transparent transition-colors text-left"
        >
          <div className="flex items-center gap-2">
            <Clipboard className="w-3.5 h-3.5 text-neutral-500" />
            <span>Paste</span>
          </div>
          <span className="text-[10px] text-neutral-400 font-mono">⌘V</span>
        </button>

        <button
          onClick={() => {
            duplicateSelectedElements();
            onClose();
          }}
          disabled={!hasSelection}
          className="w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-40 disabled:hover:bg-transparent transition-colors text-left"
        >
          <div className="flex items-center gap-2">
            <CopyPlus className="w-3.5 h-3.5 text-neutral-500" />
            <span>Duplicate</span>
          </div>
          <span className="text-[10px] text-neutral-400 font-mono">⌘D</span>
        </button>
      </div>

      <div className="h-px bg-neutral-100 dark:bg-neutral-800 my-1" />

      {/* SECTION 2: LAYER HIERARCHY */}
      {hasSelection && (
        <>
          <div className="space-y-0.5">
            <button
              onClick={() => {
                bringToFront();
                onClose();
              }}
              className="w-full px-2.5 py-1.5 rounded-lg flex items-center gap-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-left"
            >
              <ArrowUpToLine className="w-3.5 h-3.5 text-neutral-500" />
              <span>Bring to Front</span>
            </button>
            <button
              onClick={() => {
                bringForward();
                onClose();
              }}
              className="w-full px-2.5 py-1.5 rounded-lg flex items-center gap-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-left"
            >
              <ArrowUp className="w-3.5 h-3.5 text-neutral-500" />
              <span>Bring Forward</span>
            </button>
            <button
              onClick={() => {
                sendBackward();
                onClose();
              }}
              className="w-full px-2.5 py-1.5 rounded-lg flex items-center gap-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-left"
            >
              <ArrowDown className="w-3.5 h-3.5 text-neutral-500" />
              <span>Send Backward</span>
            </button>
            <button
              onClick={() => {
                sendToBack();
                onClose();
              }}
              className="w-full px-2.5 py-1.5 rounded-lg flex items-center gap-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-left"
            >
              <ArrowDownToLine className="w-3.5 h-3.5 text-neutral-500" />
              <span>Send to Back</span>
            </button>
          </div>

          <div className="h-px bg-neutral-100 dark:bg-neutral-800 my-1" />

          {/* SECTION 3: GROUP / UNGROUP & LOCK */}
          <div className="space-y-0.5">
            {hasMultipleSelection && (
              <button
                onClick={() => {
                  groupSelectedElements();
                  onClose();
                }}
                className="w-full px-2.5 py-1.5 rounded-lg flex items-center gap-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-left"
              >
                <Group className="w-3.5 h-3.5 text-amber-500" />
                <span>Group Elements</span>
              </button>
            )}

            {hasGroupSelected && (
              <button
                onClick={() => {
                  ungroupSelectedElements();
                  onClose();
                }}
                className="w-full px-2.5 py-1.5 rounded-lg flex items-center gap-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-left"
              >
                <Ungroup className="w-3.5 h-3.5 text-amber-500" />
                <span>Ungroup</span>
              </button>
            )}

            <button
              onClick={() => {
                toggleLockSelected();
                onClose();
              }}
              className="w-full px-2.5 py-1.5 rounded-lg flex items-center gap-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-left"
            >
              {allLocked ? (
                <>
                  <Unlock className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Unlock Element</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-amber-500" />
                  <span>Lock Position</span>
                </>
              )}
            </button>
          </div>

          <div className="h-px bg-neutral-100 dark:bg-neutral-800 my-1" />

          {/* SECTION 4: QUICK ALIGN */}
          <div className="p-1 grid grid-cols-4 gap-1 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl">
            <button
              onClick={() => {
                alignElements('left');
                onClose();
              }}
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-neutral-700 flex justify-center"
              title="Align Left"
            >
              <AlignLeft className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-300" />
            </button>
            <button
              onClick={() => {
                alignElements('center');
                onClose();
              }}
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-neutral-700 flex justify-center"
              title="Center Horizontally"
            >
              <AlignCenter className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-300" />
            </button>
            <button
              onClick={() => {
                alignElements('right');
                onClose();
              }}
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-neutral-700 flex justify-center"
              title="Align Right"
            >
              <AlignRight className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-300" />
            </button>
            <button
              onClick={() => {
                alignElements('middle');
                onClose();
              }}
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-neutral-700 flex justify-center"
              title="Center Vertically"
            >
              <AlignVerticalJustifyCenter className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-300" />
            </button>
          </div>

          <div className="h-px bg-neutral-100 dark:bg-neutral-800 my-1" />

          {/* SECTION 5: DELETE */}
          <button
            onClick={() => {
              deleteSelectedElements();
              onClose();
            }}
            className="w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 transition-colors text-left"
          >
            <div className="flex items-center gap-2">
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </div>
            <span className="text-[10px] font-mono opacity-80">Del</span>
          </button>
        </>
      )}

      {/* CANVAS OPTIONS (When no element is selected) */}
      {!hasSelection && (
        <div className="space-y-0.5">
          <button
            onClick={() => {
              addPage();
              onClose();
            }}
            className="w-full px-2.5 py-1.5 rounded-lg flex items-center gap-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-left"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-500" />
            <span>Add New Blank Page</span>
          </button>
        </div>
      )}
    </div>
  );
};

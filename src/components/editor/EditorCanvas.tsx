import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useEditor } from '../../context/EditorContext';
import { useApp } from '../../context/AppContext';
import { CanvasElement, PageModel, ShapeElement, TextElement, LineElement, ImageElement } from '../../types';
import { EditorRuler } from './EditorRuler';
import { EditorContextMenu } from './EditorContextMenu';
import { Lock, RotateCw } from 'lucide-react';
import { PuzzleRenderer } from '../../puzzles/renderers/PuzzleRenderer';
import { PuzzleRegistry } from '../../puzzles/core/PuzzleRegistry';
import { GeneratedPuzzle } from '../../puzzles/types';
import { PageNumberingService } from '../../services/pageNumberingService';

type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

interface SnapLine {
  orientation: 'horizontal' | 'vertical';
  position: number;
}

export const EditorCanvas: React.FC = () => {
  const {
    document,
    currentPageIndex,
    selectedElementIds,
    selectedElements,
    selectElement,
    selectElements,
    selectAll,
    clearSelection,
    updateElement,
    updateElements,
    deleteSelectedElements,
    duplicateSelectedElements,
    copySelected,
    pasteClipboard,
    cutSelected,
    zoom,
    showGuides,
    showBleedGuides,
    showSafeMargins,
    showGrid,
    gridSize,
    showRulers,
    rulerUnit,
    snapToGrid,
    snapToObjects,
    snapToMargins,
    snapToCenter,
    canvasWidthPx,
    canvasHeightPx,
  } = useEditor();

  const { activeProject } = useApp();

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);

  // Mouse tracking for rulers
  const [mouseCanvasX, setMouseCanvasX] = useState<number | null>(null);
  const [mouseCanvasY, setMouseCanvasY] = useState<number | null>(null);

  // Context Menu State
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);

  // Active snap lines shown during dragging
  const [activeSnapLines, setActiveSnapLines] = useState<SnapLine[]>([]);

  // Dragging State
  const [dragState, setDragState] = useState<{
    elementId: string;
    startX: number;
    startY: number;
    initialPositions: { id: string; x: number; y: number }[];
    isDragging: boolean;
  } | null>(null);

  // Resizing State
  const [resizeState, setResizeState] = useState<{
    elementId: string;
    handle: ResizeHandle;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    origW: number;
    origH: number;
    aspectRatio: number;
    aspectLocked: boolean;
  } | null>(null);

  // Rotating State
  const [rotateState, setRotateState] = useState<{
    elementId: string;
    centerX: number;
    centerY: number;
    startAngle: number;
    origRotation: number;
  } | null>(null);

  // Marquee Selection Box State
  const [marqueeState, setMarqueeState] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);

  const currentPage: PageModel | undefined = document?.pages?.[currentPageIndex];

  // Base canvas pixel dimensions
  const trimWidthInches = activeProject?.kdpSettings.trimSize.width || 6;
  const trimHeightInches = activeProject?.kdpSettings.trimSize.height || 9;
  const baseWidthPx = canvasWidthPx || trimWidthInches * 96;
  const baseHeightPx = canvasHeightPx || trimHeightInches * 96;

  // Margin calculation in pixels (96 px per inch)
  const margins = activeProject?.kdpSettings.margins || {
    top: 0.5,
    bottom: 0.5,
    left: 0.625,
    right: 0.375,
  };

  const isOddPage = (currentPage?.pageNumber || 1) % 2 !== 0;
  const gutterMarginPx = Math.round((isOddPage ? margins.left : margins.right) * 96);
  const outsideMarginPx = Math.round((isOddPage ? margins.right : margins.left) * 96);
  const topMarginPx = Math.round(margins.top * 96);
  const bottomMarginPx = Math.round(margins.bottom * 96);

  // Safe Margin Boundaries
  const safeLeft = gutterMarginPx;
  const safeRight = baseWidthPx - outsideMarginPx;
  const safeTop = topMarginPx;
  const safeBottom = baseHeightPx - bottomMarginPx;

  // Keyboard shortcut listener (Delete, Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+D, Ctrl+A, Esc, Arrow Keys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingTextId) return; // ignore typing in textarea
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return;

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modKey = isMac ? e.metaKey : e.ctrlKey;

      if (modKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        selectAll();
      } else if (modKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        copySelected();
      } else if (modKey && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        pasteClipboard();
      } else if (modKey && e.key.toLowerCase() === 'x') {
        e.preventDefault();
        cutSelected();
      } else if (modKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        duplicateSelectedElements();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedElementIds.length > 0) {
          e.preventDefault();
          deleteSelectedElements();
        }
      } else if (e.key === 'Escape') {
        clearSelection();
        setContextMenuPos(null);
      } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        if (selectedElements.length > 0) {
          e.preventDefault();
          const step = e.shiftKey ? 10 : 1;
          const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
          const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;

          const updates = selectedElements
            .filter(el => !el.locked)
            .map(el => ({
              id: el.id,
              updates: { x: el.x + dx, y: el.y + dy },
            }));
          updateElements(updates);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    selectedElementIds,
    selectedElements,
    editingTextId,
    deleteSelectedElements,
    copySelected,
    pasteClipboard,
    cutSelected,
    duplicateSelectedElements,
    selectAll,
    clearSelection,
    updateElements,
  ]);

  // Track mouse coordinates over canvas for rulers
  const handleMouseMoveOverCanvas = useCallback(
    (e: React.MouseEvent) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const unscaledX = Math.round((e.clientX - rect.left) / zoom);
      const unscaledY = Math.round((e.clientY - rect.top) / zoom);
      setMouseCanvasX(unscaledX);
      setMouseCanvasY(unscaledY);
    },
    [zoom]
  );

  // Global mouse move & up handler for Dragging, Resizing, Rotating, and Marquee Selection
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current) return;

      // 1. DRAGGING ELEMENTS WITH MAGNETIC SNAPPING
      if (dragState && dragState.isDragging) {
        const dx = (e.clientX - dragState.startX) / zoom;
        const dy = (e.clientY - dragState.startY) / zoom;

        const targetInitial = dragState.initialPositions.find(p => p.id === dragState.elementId);
        if (!targetInitial) return;

        let newTargetX = targetInitial.x + dx;
        let newTargetY = targetInitial.y + dy;

        const targetElement = currentPage?.elements.find(el => el.id === dragState.elementId);
        const targetW = targetElement?.width || 100;
        const targetH = targetElement?.height || 100;

        const snapThreshold = 6; // pixels
        const lines: SnapLine[] = [];

        // Center Snapping
        if (snapToCenter) {
          const centerX = baseWidthPx / 2;
          const centerY = baseHeightPx / 2;
          if (Math.abs(newTargetX + targetW / 2 - centerX) < snapThreshold) {
            newTargetX = centerX - targetW / 2;
            lines.push({ orientation: 'vertical', position: centerX });
          }
          if (Math.abs(newTargetY + targetH / 2 - centerY) < snapThreshold) {
            newTargetY = centerY - targetH / 2;
            lines.push({ orientation: 'horizontal', position: centerY });
          }
        }

        // Margin Snapping
        if (snapToMargins) {
          if (Math.abs(newTargetX - safeLeft) < snapThreshold) {
            newTargetX = safeLeft;
            lines.push({ orientation: 'vertical', position: safeLeft });
          }
          if (Math.abs(newTargetX + targetW - safeRight) < snapThreshold) {
            newTargetX = safeRight - targetW;
            lines.push({ orientation: 'vertical', position: safeRight });
          }
          if (Math.abs(newTargetY - safeTop) < snapThreshold) {
            newTargetY = safeTop;
            lines.push({ orientation: 'horizontal', position: safeTop });
          }
          if (Math.abs(newTargetY + targetH - safeBottom) < snapThreshold) {
            newTargetY = safeBottom - targetH;
            lines.push({ orientation: 'horizontal', position: safeBottom });
          }
        }

        // Grid Snapping
        if (snapToGrid) {
          const snappedX = Math.round(newTargetX / gridSize) * gridSize;
          const snappedY = Math.round(newTargetY / gridSize) * gridSize;
          if (Math.abs(newTargetX - snappedX) < snapThreshold) newTargetX = snappedX;
          if (Math.abs(newTargetY - snappedY) < snapThreshold) newTargetY = snappedY;
        }

        setActiveSnapLines(lines);

        const deltaXApplied = newTargetX - targetInitial.x;
        const deltaYApplied = newTargetY - targetInitial.y;

        const updates = dragState.initialPositions.map(pos => ({
          id: pos.id,
          updates: {
            x: Math.round(pos.x + deltaXApplied),
            y: Math.round(pos.y + deltaYApplied),
          },
        }));

        updateElements(updates);
      }

      // 2. RESIZING ELEMENTS (8 Handles + Aspect Ratio Lock)
      else if (resizeState) {
        const dx = (e.clientX - resizeState.startX) / zoom;
        const dy = (e.clientY - resizeState.startY) / zoom;

        let newW = resizeState.origW;
        let newH = resizeState.origH;
        let newX = resizeState.origX;
        let newY = resizeState.origY;

        const lockRatio = resizeState.aspectLocked || e.shiftKey;

        switch (resizeState.handle) {
          case 'e':
            newW = Math.max(10, resizeState.origW + dx);
            break;
          case 'w':
            newW = Math.max(10, resizeState.origW - dx);
            newX = resizeState.origX + (resizeState.origW - newW);
            break;
          case 's':
            newH = Math.max(10, resizeState.origH + dy);
            break;
          case 'n':
            newH = Math.max(10, resizeState.origH - dy);
            newY = resizeState.origY + (resizeState.origH - newH);
            break;
          case 'se':
            newW = Math.max(10, resizeState.origW + dx);
            newH = lockRatio ? newW / resizeState.aspectRatio : Math.max(10, resizeState.origH + dy);
            break;
          case 'sw':
            newW = Math.max(10, resizeState.origW - dx);
            newH = lockRatio ? newW / resizeState.aspectRatio : Math.max(10, resizeState.origH + dy);
            newX = resizeState.origX + (resizeState.origW - newW);
            break;
          case 'ne':
            newW = Math.max(10, resizeState.origW + dx);
            newH = lockRatio ? newW / resizeState.aspectRatio : Math.max(10, resizeState.origH - dy);
            newY = resizeState.origY + (resizeState.origH - newH);
            break;
          case 'nw':
            newW = Math.max(10, resizeState.origW - dx);
            newH = lockRatio ? newW / resizeState.aspectRatio : Math.max(10, resizeState.origH - dy);
            newX = resizeState.origX + (resizeState.origW - newW);
            newY = resizeState.origY + (resizeState.origH - newH);
            break;
        }

        updateElement(resizeState.elementId, {
          x: Math.round(newX),
          y: Math.round(newY),
          width: Math.round(newW),
          height: Math.round(newH),
        });
      }

      // 3. ROTATING ELEMENTS
      else if (rotateState) {
        const currentAngle = Math.atan2(e.clientY - rotateState.centerY, e.clientX - rotateState.centerX);
        const angleDiff = (currentAngle - rotateState.startAngle) * (180 / Math.PI);
        let finalDeg = Math.round((rotateState.origRotation + angleDiff) % 360);
        if (finalDeg < 0) finalDeg += 360;

        // Snap rotation to 15-degree increments if Shift is held
        if (e.shiftKey) {
          finalDeg = Math.round(finalDeg / 15) * 15;
        }

        updateElement(rotateState.elementId, { rotation: finalDeg });
      }

      // 4. MARQUEE MULTI-SELECTION BOX
      else if (marqueeState && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const curX = (e.clientX - rect.left) / zoom;
        const curY = (e.clientY - rect.top) / zoom;

        setMarqueeState(prev => (prev ? { ...prev, currentX: curX, currentY: curY } : null));

        const boxX = Math.min(marqueeState.startX, curX);
        const boxY = Math.min(marqueeState.startY, curY);
        const boxW = Math.abs(curX - marqueeState.startX);
        const boxH = Math.abs(curY - marqueeState.startY);

        if (currentPage && boxW > 5 && boxH > 5) {
          const selected = currentPage.elements
            .filter(el => {
              const elRight = el.x + el.width;
              const elBottom = el.y + el.height;
              return el.x < boxX + boxW && elRight > boxX && el.y < boxY + boxH && elBottom > boxY;
            })
            .map(el => el.id);

          selectElements(selected);
        }
      }
    };

    const handleGlobalMouseUp = () => {
      if (dragState) {
        setDragState(null);
        setActiveSnapLines([]);
      }
      if (resizeState) setResizeState(null);
      if (rotateState) setRotateState(null);
      if (marqueeState) setMarqueeState(null);
    };

    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        handleGlobalMouseMove({
          clientX: touch.clientX,
          clientY: touch.clientY,
          shiftKey: false,
        } as MouseEvent);
      }
    };

    const handleGlobalTouchEnd = () => {
      handleGlobalMouseUp();
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('touchmove', handleGlobalTouchMove, { passive: true });
    window.addEventListener('touchend', handleGlobalTouchEnd);
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('touchmove', handleGlobalTouchMove);
      window.removeEventListener('touchend', handleGlobalTouchEnd);
    };
  }, [
    dragState,
    resizeState,
    rotateState,
    marqueeState,
    zoom,
    baseWidthPx,
    baseHeightPx,
    safeLeft,
    safeRight,
    safeTop,
    safeBottom,
    snapToCenter,
    snapToMargins,
    snapToGrid,
    gridSize,
    currentPage,
    updateElement,
    updateElements,
    selectElements,
  ]);

  // Handle click on canvas backdrop to clear selection
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button === 2) return; // Right-click handled separately

    if (e.target === canvasRef.current || (e.target as HTMLElement).id === 'canvas-page-surface') {
      if (!e.shiftKey) {
        clearSelection();
      }
      setEditingTextId(null);
      setContextMenuPos(null);

      // Start Marquee Selection
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const startX = (e.clientX - rect.left) / zoom;
        const startY = (e.clientY - rect.top) / zoom;
        setMarqueeState({ startX, startY, currentX: startX, currentY: startY });
      }
    }
  };

  const handleContextMenu = (e: React.MouseEvent, elementId?: string) => {
    e.preventDefault();
    if (elementId && !selectedElementIds.includes(elementId)) {
      selectElement(elementId);
    }
    setContextMenuPos({ x: e.clientX, y: e.clientY });
  };

  const handleElementMouseDown = (e: React.MouseEvent, el: CanvasElement) => {
    if (e.button === 2) return; // Right click
    e.stopPropagation();
    setContextMenuPos(null);

    const isAlreadySelected = selectedElementIds.includes(el.id);

    if (e.shiftKey) {
      selectElement(el.id, true);
    } else if (!isAlreadySelected) {
      selectElement(el.id, false);
    }

    if (el.locked) return;

    // Collect initial positions for all selected elements
    const elementsToMove = isAlreadySelected
      ? selectedElements.filter(item => !item.locked)
      : [el];

    setDragState({
      elementId: el.id,
      startX: e.clientX,
      startY: e.clientY,
      initialPositions: elementsToMove.map(item => ({ id: item.id, x: item.x, y: item.y })),
      isDragging: true,
    });
  };

  const handleResizeStart = (e: React.MouseEvent, el: CanvasElement, handle: ResizeHandle) => {
    e.stopPropagation();
    if (el.locked) return;

    setResizeState({
      elementId: el.id,
      handle,
      startX: e.clientX,
      startY: e.clientY,
      origX: el.x,
      origY: el.y,
      origW: el.width,
      origH: el.height,
      aspectRatio: el.width / (el.height || 1),
      aspectLocked: !!el.aspectRatioLocked,
    });
  };

  const handleRotateStart = (e: React.MouseEvent, el: CanvasElement) => {
    e.stopPropagation();
    if (el.locked || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const elCenterX = rect.left + (el.x + el.width / 2) * zoom;
    const elCenterY = rect.top + (el.y + el.height / 2) * zoom;

    const startAngle = Math.atan2(e.clientY - elCenterY, e.clientX - elCenterX);

    setRotateState({
      elementId: el.id,
      centerX: elCenterX,
      centerY: elCenterY,
      startAngle,
      origRotation: el.rotation || 0,
    });
  };

  if (!currentPage) {
    return (
      <div className="flex-1 flex items-center justify-center text-neutral-400 text-sm">
        No active page found in manuscript
      </div>
    );
  }

  // Render Background Pattern
  const renderPagePattern = () => {
    const pattern = currentPage.pattern || 'none';
    const color = currentPage.patternColor || '#E2E8F0';

    if (pattern === 'dotGrid') {
      return (
        <div
          style={{
            backgroundImage: `radial-gradient(${color} 1.2px, transparent 1.2px)`,
            backgroundSize: '16px 16px',
          }}
          className="absolute inset-0 pointer-events-none z-10"
        />
      );
    }
    if (pattern === 'lined') {
      return (
        <div
          style={{
            backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 27px, ${color} 28px)`,
          }}
          className="absolute inset-0 pointer-events-none z-10"
        />
      );
    }
    if (pattern === 'graph') {
      return (
        <div
          style={{
            backgroundImage: `linear-gradient(to right, ${color} 1px, transparent 1px), linear-gradient(to bottom, ${color} 1px, transparent 1px)`,
            backgroundSize: '20px 20px',
          }}
          className="absolute inset-0 pointer-events-none z-10"
        />
      );
    }
    return null;
  };

  return (
    <div
      ref={containerRef}
      onContextMenu={e => handleContextMenu(e)}
      className="flex-1 flex flex-col h-full overflow-hidden bg-neutral-200 dark:bg-neutral-950 relative select-none"
    >
      {/* TOP RULER BAR */}
      {showRulers && (
        <div className="flex bg-neutral-100 dark:bg-neutral-900 border-b border-neutral-300 dark:border-neutral-800 z-20 shrink-0">
          <div className="w-6 h-6 bg-neutral-200 dark:bg-neutral-800 border-r border-neutral-300 dark:border-neutral-700 flex items-center justify-center text-[8px] font-mono font-bold text-neutral-500">
            {rulerUnit}
          </div>
          <div className="flex-1 overflow-hidden flex justify-center">
            <EditorRuler
              orientation="horizontal"
              lengthPx={baseWidthPx}
              zoom={zoom}
              unit={rulerUnit}
              mousePos={mouseCanvasX}
            />
          </div>
        </div>
      )}

      {/* WORKSPACE AREA (Left Ruler + Center Canvas) */}
      <div className="flex-1 flex overflow-auto relative">
        {/* LEFT RULER BAR */}
        {showRulers && (
          <div className="bg-neutral-100 dark:bg-neutral-900 border-r border-neutral-300 dark:border-neutral-800 z-20 shrink-0 flex items-center justify-center">
            <EditorRuler
              orientation="vertical"
              lengthPx={baseHeightPx}
              zoom={zoom}
              unit={rulerUnit}
              mousePos={mouseCanvasY}
            />
          </div>
        )}

        {/* SCROLLABLE / PANNABLE CANVAS VIEWPORT */}
        <div
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleMouseMoveOverCanvas}
          className="flex-1 p-10 sm:p-14 flex items-center justify-center relative overflow-auto canvas-grid"
        >
          {/* SCALED PAGE SURFACE */}
          <div
            id="canvas-page-surface"
            ref={canvasRef}
            style={{
              width: `${baseWidthPx}px`,
              height: `${baseHeightPx}px`,
              transform: `scale(${zoom})`,
              transformOrigin: 'center center',
              backgroundColor: currentPage.backgroundColor || '#FFFFFF',
            }}
            className="relative shadow-2xl rounded-xs transition-transform duration-75 overflow-visible border border-neutral-300 dark:border-neutral-700 shrink-0"
          >
            {/* Pattern Overlay */}
            {renderPagePattern()}

            {/* Bleed Overlay (0.125in = 12px) */}
            {showBleedGuides && (
              <div
                className="absolute -inset-3 border-2 border-dashed border-blue-400 pointer-events-none z-30 opacity-70"
                title="Amazon KDP 0.125in Bleed Boundary"
              >
                <span className="absolute -top-5 left-0 text-[10px] font-mono text-blue-500 bg-white/90 dark:bg-neutral-900/90 px-1 rounded shadow-xs">
                  Bleed (+0.125")
                </span>
              </div>
            )}

            {/* KDP Safe Margins & Gutter Overlay */}
            {showSafeMargins && (
              <div
                style={{
                  top: `${safeTop}px`,
                  bottom: `${baseHeightPx - safeBottom}px`,
                  left: `${safeLeft}px`,
                  right: `${baseWidthPx - safeRight}px`,
                }}
                className="absolute border border-dashed border-amber-500/80 pointer-events-none z-30 bg-amber-500/5"
                title={`Safe Margin Box (Gutter: ${margins.left}", Outside: ${margins.right}")`}
              >
                <span className="absolute top-1 left-2 text-[9px] font-mono font-bold text-amber-600 dark:text-amber-400 bg-white/95 dark:bg-neutral-900/95 px-1.5 py-0.5 rounded shadow-xs">
                  KDP Safe Zone (Page {currentPage.pageNumber})
                </span>
              </div>
            )}

            {/* Alignment Grid Overlay */}
            {showGrid && (
              <div
                style={{ backgroundSize: `${gridSize}px ${gridSize}px` }}
                className="absolute inset-0 pointer-events-none z-20 opacity-30 bg-[linear-gradient(to_right,#80808020_1px,transparent_1px),linear-gradient(to_bottom,#80808020_1px,transparent_1px)]"
              />
            )}

            {/* Dynamic Magnetic Helper Snap Lines */}
            {activeSnapLines.map((line, idx) => (
              <div
                key={`snap-line-${idx}`}
                style={{
                  [line.orientation === 'vertical' ? 'left' : 'top']: `${line.position}px`,
                  [line.orientation === 'vertical' ? 'top' : 'left']: 0,
                  [line.orientation === 'vertical' ? 'width' : 'height']: '1.5px',
                  [line.orientation === 'vertical' ? 'height' : 'width']: '100%',
                }}
                className="absolute bg-cyan-400 dark:bg-cyan-300 z-40 pointer-events-none shadow-xs"
              />
            ))}

            {/* RENDER PAGE ELEMENTS */}
            {currentPage.elements.map(el => {
              const isSelected = selectedElementIds.includes(el.id);
              const isOnlySelected = isSelected && selectedElementIds.length === 1;

              return (
                <div
                  key={el.id}
                  onMouseDown={e => handleElementMouseDown(e, el)}
                  onTouchStart={e => {
                    if (e.touches.length === 1) {
                      const t = e.touches[0];
                      handleElementMouseDown(
                        {
                          clientX: t.clientX,
                          clientY: t.clientY,
                          shiftKey: false,
                          stopPropagation: () => e.stopPropagation(),
                        } as any,
                        el
                      );
                    }
                  }}
                  onContextMenu={e => handleContextMenu(e, el.id)}
                  onDoubleClick={() => {
                    if (el.type === 'text' && !el.locked) setEditingTextId(el.id);
                  }}
                  style={{
                    position: 'absolute',
                    left: `${el.x}px`,
                    top: `${el.y}px`,
                    width: `${el.width}px`,
                    height: `${el.height}px`,
                    transform: `rotate(${el.rotation || 0}deg)`,
                    zIndex: el.zIndex || 1,
                    opacity: el.opacity ?? 1,
                  }}
                  className={`transition-shadow ${
                    el.locked ? 'cursor-default' : 'cursor-move'
                  } ${
                    isSelected
                      ? 'ring-2 ring-amber-500 ring-offset-1 z-40'
                      : 'hover:ring-1 hover:ring-amber-300/60'
                  }`}
                >
                  {/* ELEMENT TYPE: TEXT */}
                  {el.type === 'text' && (() => {
                    const isSolPage = currentPage && PageNumberingService.isSolutionPage(currentPage);
                    const isSolHeader = isSolPage && (el.name === 'Solutions Header' || el.content?.startsWith('Solution') || el.content?.startsWith('SOLUT'));
                    const displayContent = isSolHeader && document
                      ? PageNumberingService.getSolutionPageHeading(currentPage, document.pages, activeProject)
                      : el.content;

                    return (
                      <div
                        style={{
                          fontFamily: el.fontFamily || 'Plus Jakarta Sans',
                          fontSize: `${el.fontSize || 16}px`,
                          fontWeight: el.fontWeight || '400',
                          fontStyle: el.fontStyle || 'normal',
                          textDecoration: el.textDecoration || 'none',
                          color: el.color || '#111827',
                          backgroundColor: el.backgroundColor || 'transparent',
                          textAlign: el.textAlign || 'left',
                          lineHeight: el.lineHeight || 1.4,
                          letterSpacing: el.letterSpacing ? `${el.letterSpacing}px` : 'normal',
                        }}
                        className="w-full h-full p-1 overflow-hidden select-none break-words"
                      >
                        {editingTextId === el.id ? (
                          <textarea
                            value={el.content}
                            onChange={e => updateElement(el.id, { content: e.target.value })}
                            onBlur={() => setEditingTextId(null)}
                            autoFocus
                            className="w-full h-full bg-white/90 dark:bg-neutral-900/90 text-neutral-900 dark:text-white border border-amber-500 rounded-sm p-1 outline-none resize-none"
                          />
                        ) : (
                          displayContent
                        )}
                      </div>
                    );
                  })()}

                  {/* ELEMENT TYPE: SHAPE */}
                  {el.type === 'shape' && (
                    <div className="w-full h-full">
                      {el.shapeType === 'circle' || el.shapeType === 'ellipse' ? (
                        <div
                          style={{
                            backgroundColor: el.fillColor || '#FFFFFF',
                            borderColor: el.strokeColor || '#111827',
                            borderWidth: `${el.strokeWidth || 1}px`,
                            borderStyle: (el.dashPattern as any) || 'solid',
                            borderRadius: '9999px',
                          }}
                          className="w-full h-full"
                        />
                      ) : el.shapeType === 'triangle' ? (
                        <svg viewBox="0 0 100 100" className="w-full h-full">
                          <polygon
                            points="50,5 95,95 5,95"
                            fill={el.fillColor || '#F3F4F6'}
                            stroke={el.strokeColor || '#111827'}
                            strokeWidth={el.strokeWidth || 2}
                          />
                        </svg>
                      ) : el.shapeType === 'star' ? (
                        <svg viewBox="0 0 100 100" className="w-full h-full">
                          <polygon
                            points="50,5 64,36 98,36 70,57 81,91 50,70 19,91 30,57 2,36 36,36"
                            fill={el.fillColor || '#F3F4F6'}
                            stroke={el.strokeColor || '#111827'}
                            strokeWidth={el.strokeWidth || 2}
                          />
                        </svg>
                      ) : el.shapeType === 'heart' ? (
                        <svg viewBox="0 0 100 100" className="w-full h-full">
                          <path
                            d="M 50,85 A 25,25 0 0,1 15,50 A 20,20 0 0,1 50,30 A 20,20 0 0,1 85,50 A 25,25 0 0,1 50,85 Z"
                            fill={el.fillColor || '#F3F4F6'}
                            stroke={el.strokeColor || '#111827'}
                            strokeWidth={el.strokeWidth || 2}
                          />
                        </svg>
                      ) : (
                        <div
                          style={{
                            backgroundColor: el.fillColor || '#FFFFFF',
                            borderColor: el.strokeColor || '#111827',
                            borderWidth: `${el.strokeWidth || 1}px`,
                            borderStyle: (el.dashPattern as any) || 'solid',
                            borderRadius: `${el.borderRadius || 0}px`,
                          }}
                          className="w-full h-full"
                        />
                      )}
                    </div>
                  )}

                  {/* ELEMENT TYPE: LINE */}
                  {el.type === 'line' && (
                    <div
                      style={{
                        borderColor: el.strokeColor || '#374151',
                        borderTopWidth: `${el.strokeWidth || 2}px`,
                        borderStyle: (el.dashPattern as any) || 'solid',
                      }}
                      className="w-full h-full flex items-center justify-center"
                    />
                  )}

                  {/* ELEMENT TYPE: IMAGE */}
                  {el.type === 'image' && (
                    <img
                      src={el.imageUrl || el.src}
                      alt={el.alt || 'Manuscript graphic'}
                      style={{
                        objectFit: el.objectFit || 'contain',
                        borderRadius: `${el.borderRadius || 0}px`,
                        filter: el.grayscale ? 'grayscale(100%)' : 'none',
                      }}
                      className="w-full h-full pointer-events-none select-none"
                    />
                  )}

                  {/* ELEMENT TYPE: GROUP */}
                  {el.type === 'group' && (
                    <div className="w-full h-full border border-dashed border-cyan-500/80 bg-cyan-500/5 pointer-events-none rounded-xs" />
                  )}

                  {/* ELEMENT TYPE: PUZZLE */}
                  {el.type === 'puzzle' && (() => {
                    let puzzleObj: GeneratedPuzzle | null = null;
                    if (el.puzzleData && (el.puzzleData as any).data && (el.puzzleData as any).type) {
                      puzzleObj = el.puzzleData as unknown as GeneratedPuzzle;
                    } else {
                      // Construct or fallback using Registry
                      try {
                        const pType = (el.puzzleType || 'word_search') as any;
                        if (PuzzleRegistry.has(pType)) {
                          puzzleObj = PuzzleRegistry.generate({
                            puzzleType: pType,
                            seed: 12345,
                            difficulty: (el.difficulty as any) || 'Medium',
                            title: el.title || el.name,
                          });
                        }
                      } catch (err) {
                        console.error('Error generating fallback puzzle:', err);
                      }
                    }

                    if (puzzleObj) {
                      const styleOptions = (el.previewData || {}) as any;
                      const isSolPage = currentPage && PageNumberingService.isSolutionPage(currentPage);
                      const displayPuzzleObj =
                        isSolPage && document
                          ? {
                              ...puzzleObj,
                              title: PageNumberingService.getSolutionPageHeading(
                                currentPage,
                                document.pages,
                                activeProject
                              ),
                            }
                          : puzzleObj;

                      return (
                        <div className="w-full h-full border border-neutral-300 dark:border-neutral-700 bg-white rounded-xs overflow-hidden">
                          <PuzzleRenderer
                            puzzle={displayPuzzleObj}
                            styleOptions={styleOptions}
                            width={el.width}
                            height={el.height}
                          />
                        </div>
                      );
                    }

                    return (
                      <div className="w-full h-full border border-dashed border-neutral-300 dark:border-neutral-700 bg-neutral-50 flex items-center justify-center p-2 text-xs font-mono text-neutral-500">
                        {el.name || 'Puzzle'}
                      </div>
                    );
                  })()}

                  {/* Lock Indicator Badge */}
                  {el.locked && (
                    <div className="absolute top-1 right-1 p-1 bg-amber-500 text-neutral-950 rounded-full shadow-md z-50">
                      <Lock className="w-2.5 h-2.5" />
                    </div>
                  )}

                  {/* 8-DIRECTION RESIZE HANDLES & ROTATE HANDLE (When Selected & Not Locked) */}
                  {isOnlySelected && !el.locked && (
                    <>
                      {/* Corner Handles */}
                      <div
                        onMouseDown={e => handleResizeStart(e, el, 'nw')}
                        className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-amber-500 rounded-xs cursor-nw-resize z-50 shadow-xs hover:scale-125 transition-transform"
                      />
                      <div
                        onMouseDown={e => handleResizeStart(e, el, 'ne')}
                        className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-amber-500 rounded-xs cursor-ne-resize z-50 shadow-xs hover:scale-125 transition-transform"
                      />
                      <div
                        onMouseDown={e => handleResizeStart(e, el, 'sw')}
                        className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-amber-500 rounded-xs cursor-sw-resize z-50 shadow-xs hover:scale-125 transition-transform"
                      />
                      <div
                        onMouseDown={e => handleResizeStart(e, el, 'se')}
                        className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-amber-500 rounded-xs cursor-se-resize z-50 shadow-xs hover:scale-125 transition-transform"
                      />

                      {/* Edge Handles */}
                      <div
                        onMouseDown={e => handleResizeStart(e, el, 'n')}
                        className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-2.5 bg-white border-2 border-amber-500 rounded-xs cursor-n-resize z-50 shadow-xs"
                      />
                      <div
                        onMouseDown={e => handleResizeStart(e, el, 's')}
                        className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-2.5 bg-white border-2 border-amber-500 rounded-xs cursor-s-resize z-50 shadow-xs"
                      />
                      <div
                        onMouseDown={e => handleResizeStart(e, el, 'w')}
                        className="absolute top-1/2 -translate-y-1/2 -left-1.5 w-2.5 h-3 bg-white border-2 border-amber-500 rounded-xs cursor-w-resize z-50 shadow-xs"
                      />
                      <div
                        onMouseDown={e => handleResizeStart(e, el, 'e')}
                        className="absolute top-1/2 -translate-y-1/2 -right-1.5 w-2.5 h-3 bg-white border-2 border-amber-500 rounded-xs cursor-e-resize z-50 shadow-xs"
                      />

                      {/* Top Center Rotation Handle */}
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex flex-col items-center z-50">
                        <div
                          onMouseDown={e => handleRotateStart(e, el)}
                          className="w-4 h-4 bg-amber-500 border border-white text-neutral-950 rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing shadow-md hover:scale-110 transition-transform"
                          title="Rotate (Hold Shift for 15° snap)"
                        >
                          <RotateCw className="w-2.5 h-2.5" />
                        </div>
                        <div className="w-0.5 h-2 bg-amber-500" />
                      </div>
                    </>
                  )}
                </div>
              );
            })}

            {/* DYNAMIC PAGE NUMBER OVERLAY */}
            {currentPage && PageNumberingService.shouldShowPageNumber(currentPage, currentPageIndex, activeProject) && (
              (() => {
                const layout = PageNumberingService.getPageNumberLayout(
                  currentPage,
                  currentPageIndex,
                  activeProject,
                  baseWidthPx,
                  baseHeightPx
                );
                // Avoid rendering if page already has an explicit manual Page Number element
                const hasManualPageNum = currentPage.elements.some(
                  el => el.type === 'text' && (el.name === 'Page Number' || el.name === 'Page Number Placemarker')
                );
                if (hasManualPageNum) return null;

                return (
                  <div
                    id={`page-number-indicator-${currentPage.id}`}
                    style={{
                      position: 'absolute',
                      left: `${layout.x}px`,
                      top: `${layout.y}px`,
                      width: `${layout.width}px`,
                      height: `${layout.height}px`,
                      textAlign: layout.textAlign,
                      fontFamily: layout.fontFamily,
                      fontSize: `${layout.fontSize}px`,
                      color: layout.color,
                      lineHeight: `${layout.height}px`,
                      pointerEvents: 'none',
                      userSelect: 'none',
                      zIndex: 35,
                    }}
                    className="font-medium tracking-wide transition-opacity opacity-80"
                    title={`Page Number: ${layout.text}`}
                  >
                    {layout.text}
                  </div>
                );
              })()
            )}

            {/* MARQUEE DRAG SELECTION BOX */}
            {marqueeState && (
              <div
                style={{
                  left: `${Math.min(marqueeState.startX, marqueeState.currentX)}px`,
                  top: `${Math.min(marqueeState.startY, marqueeState.currentY)}px`,
                  width: `${Math.abs(marqueeState.currentX - marqueeState.startX)}px`,
                  height: `${Math.abs(marqueeState.currentY - marqueeState.startY)}px`,
                }}
                className="absolute border border-amber-500 bg-amber-500/15 pointer-events-none z-50 rounded-xs"
              />
            )}
          </div>
        </div>
      </div>

      {/* CONTEXT MENU */}
      {contextMenuPos && (
        <EditorContextMenu
          x={contextMenuPos.x}
          y={contextMenuPos.y}
          onClose={() => setContextMenuPos(null)}
        />
      )}
    </div>
  );
};

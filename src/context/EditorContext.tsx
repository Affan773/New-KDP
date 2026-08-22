import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { inchesToPixels } from '../constants/kdp';
import { GeneratedPuzzle, PuzzleStyleOptions } from '../puzzles/types';
import { AnswerKeyService } from '../services/answerKeyService';
import { StorageService } from '../services/storageService';
import {
  CanvasElement,
  CanvasElementType,
  DocumentModel,
  PageModel,
  Project,
  TextElement,
  ShapeElement,
  LineElement,
  ImageElement,
  GroupElement,
} from '../types';
import { BookTheme } from '../types/book';
import { useApp } from './AppContext';

export type ToolMode = 'select' | 'text' | 'image' | 'shape' | 'line' | 'elements';
export type AutosaveStatus = 'Saved' | 'Saving...' | 'Unsaved changes';
export type RulerUnit = 'in' | 'px';

interface EditorContextType {
  project: Project | null;
  document: DocumentModel | null;
  currentPageIndex: number;
  setCurrentPageIndex: (index: number) => void;
  currentPage: PageModel | null;
  selectedElementIds: string[];
  selectedElements: CanvasElement[];
  toolMode: ToolMode;
  setToolMode: (mode: ToolMode) => void;
  // Zoom & View
  zoom: number;
  setZoom: (zoom: number | ((prev: number) => number)) => void;
  fitPage: () => void;
  fitWidth: () => void;
  // Overlays & Toggles
  showSafeMargins: boolean;
  setShowSafeMargins: (show: boolean) => void;
  showMargins: boolean;
  setShowMargins: (show: boolean) => void;
  showBleedGuides: boolean;
  setShowBleedGuides: (show: boolean) => void;
  showBleed: boolean;
  setShowBleed: (show: boolean) => void;
  showGrid: boolean;
  setShowGrid: (show: boolean) => void;
  gridSize: number;
  setGridSize: (size: number) => void;
  showGuides: boolean;
  setShowGuides: (show: boolean) => void;
  showRulers: boolean;
  setShowRulers: (show: boolean) => void;
  rulerUnit: RulerUnit;
  setRulerUnit: (unit: RulerUnit) => void;
  // Snap options
  snapToGrid: boolean;
  setSnapToGrid: (snap: boolean) => void;
  snapToObjects: boolean;
  setSnapToObjects: (snap: boolean) => void;
  snapToMargins: boolean;
  setSnapToMargins: (snap: boolean) => void;
  snapToCenter: boolean;
  setSnapToCenter: (snap: boolean) => void;
  // History & Save
  autosaveStatus: AutosaveStatus;
  canUndo: boolean;
  canRedo: boolean;
  canvasWidthPx: number;
  canvasHeightPx: number;
  // Selection
  selectElement: (id: string | null, isShift?: boolean) => void;
  selectElements: (ids: string[]) => void;
  selectAll: () => void;
  clearSelection: () => void;
  // Element Actions
  addElement: (typeOrElement: CanvasElementType | CanvasElement, defaultOverrides?: Partial<CanvasElement>) => void;
  updateElement: (id: string, updates: Partial<CanvasElement>) => void;
  updateElements: (updates: { id: string; updates: Partial<CanvasElement> }[]) => void;
  deleteSelectedElements: () => void;
  duplicateSelectedElements: () => void;
  lockElement: (id: string, locked?: boolean) => void;
  toggleLockSelected: () => void;
  toggleAspectRatioLock: () => void;
  // Grouping
  groupSelectedElements: () => void;
  ungroupSelectedElements: () => void;
  // Layering
  bringForward: () => void;
  sendBackward: () => void;
  bringToFront: () => void;
  sendToBack: () => void;
  reorderLayers: (fromIndex: number, toIndex: number) => void;
  toggleElementVisibility: (id: string) => void;
  // Alignment & Distribution
  alignElements: (direction: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void;
  distributeElements: (direction: 'horizontal' | 'vertical') => void;
  // Clipboard
  clipboard: CanvasElement[];
  copySelected: () => void;
  cutSelected: () => void;
  pasteClipboard: () => void;
  // Page Actions
  selectPage: (index: number) => void;
  addPage: (options?: { name?: string; background?: string; pattern?: PageModel['pattern']; elements?: CanvasElement[] }) => void;
  insertPuzzleWithSolution: (
    puzzle: GeneratedPuzzle,
    options?: {
      styleOptions?: Partial<PuzzleStyleOptions>;
      autoAnswerKey?: boolean;
      answerKeyMode?: 'end_of_book' | 'after_puzzle' | 'after_each_puzzle' | 'none';
      theme?: BookTheme;
    }
  ) => void;
  insertPuzzlesWithSolutions: (
    puzzles: GeneratedPuzzle[],
    options?: {
      styleOptions?: Partial<PuzzleStyleOptions>;
      autoAnswerKey?: boolean;
      answerKeyMode?: 'end_of_book' | 'after_puzzle' | 'after_each_puzzle' | 'none';
      theme?: BookTheme;
    }
  ) => void;
  deletePage: (index: number) => void;
  duplicatePage: (index: number) => void;
  duplicateCurrentPage: () => void;
  deleteCurrentPage: () => void;
  reorderPage: (fromIndex: number, toIndex: number) => void;
  updatePageBackground: (color: string) => void;
  updatePagePattern: (pattern: 'none' | 'dotGrid' | 'lined' | 'graph', color?: string) => void;
  updatePageName: (index: number, name: string) => void;
  updateCurrentPageNotes: (notes: string) => void;
  bulkAddPages: (count: number, templateElements?: CanvasElement[]) => void;
  applyTemplateToCurrentPage: (elements: CanvasElement[]) => void;
  updateDocument: (doc: DocumentModel, addToHistory?: boolean) => void;
  // History & Save
  undo: () => void;
  redo: () => void;
  saveNow: () => void;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export const EditorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeProjectId, activeProject, refreshProjects, showToast } = useApp();
  const [document, setDocument] = useState<DocumentModel | null>(null);
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [selectedElementIds, setSelectedElementIds] = useState<string[]>([]);
  const [toolMode, setToolMode] = useState<ToolMode>('select');
  const [zoom, setZoom] = useState<number>(1.0);
  
  // Overlays and guides
  const [showSafeMargins, setShowSafeMargins] = useState<boolean>(true);
  const [showBleedGuides, setShowBleedGuides] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(false);
  const [gridSize, setGridSize] = useState<number>(20);
  const [showGuides, setShowGuides] = useState<boolean>(true);
  const [showRulers, setShowRulers] = useState<boolean>(true);
  const [rulerUnit, setRulerUnit] = useState<RulerUnit>('in');
  
  // Snapping toggles
  const [snapToGrid, setSnapToGrid] = useState<boolean>(true);
  const [snapToObjects, setSnapToObjects] = useState<boolean>(true);
  const [snapToMargins, setSnapToMargins] = useState<boolean>(true);
  const [snapToCenter, setSnapToCenter] = useState<boolean>(true);
  
  // Clipboard
  const [clipboard, setClipboard] = useState<CanvasElement[]>([]);

  // Status and history
  const [autosaveStatus, setAutosaveStatus] = useState<AutosaveStatus>('Saved');
  const [undoStack, setUndoStack] = useState<DocumentModel[]>([]);
  const [redoStack, setRedoStack] = useState<DocumentModel[]>([]);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load document when active project changes
  useEffect(() => {
    if (!activeProject) {
      setDocument(null);
      return;
    }
    const doc = StorageService.getDocument(activeProject.documentId);
    if (doc) {
      setDocument(doc);
      setCurrentPageIndex(0);
      setSelectedElementIds([]);
      setUndoStack([]);
      setRedoStack([]);
      setAutosaveStatus('Saved');
    } else {
      const newDoc: DocumentModel = {
        id: activeProject.documentId,
        projectId: activeProject.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        pages: [
          {
            id: `page-${activeProject.id}-1`,
            pageNumber: 1,
            backgroundColor: '#FFFFFF',
            name: 'Page 1',
            elements: [],
          },
        ],
      };
      StorageService.saveDocument(newDoc);
      setDocument(newDoc);
      setCurrentPageIndex(0);
    }
  }, [activeProjectId]);

  // Compute canvas pixel dimensions based on project trim size and bleed
  const trimSize = activeProject?.kdpSettings.trimSize || { width: 6, height: 9 };
  const hasBleed = activeProject?.kdpSettings.bleed === 'Bleed';
  const widthInches = hasBleed ? trimSize.width + 0.125 : trimSize.width;
  const heightInches = hasBleed ? trimSize.height + 0.25 : trimSize.height;

  const canvasWidthPx = Math.round(inchesToPixels(widthInches, 96));
  const canvasHeightPx = Math.round(inchesToPixels(heightInches, 96));

  const currentPage: PageModel | null =
    document && document.pages[currentPageIndex] ? document.pages[currentPageIndex] : null;

  const selectedElements: CanvasElement[] = currentPage
    ? currentPage.elements.filter(el => selectedElementIds.includes(el.id))
    : [];

  // Helper to commit document changes with history recording and debounced autosave
  const commitDocumentChange = useCallback((newDoc: DocumentModel, addToHistory: boolean = true) => {
    if (addToHistory && document) {
      setUndoStack(prev => [...prev.slice(-40), document]);
      setRedoStack([]);
    }

    setDocument(newDoc);
    setAutosaveStatus('Unsaved changes');

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setAutosaveStatus('Saving...');
    saveTimeoutRef.current = setTimeout(() => {
      StorageService.saveDocument(newDoc);
      setAutosaveStatus('Saved');
    }, 600);
  }, [document]);

  const saveNow = useCallback(() => {
    if (document) {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      setAutosaveStatus('Saving...');
      StorageService.saveDocument(document);
      refreshProjects();
      setAutosaveStatus('Saved');
      showToast({
        type: 'success',
        message: 'All book changes saved.',
      });
    }
  }, [document, refreshProjects, showToast]);

  const undo = useCallback(() => {
    if (undoStack.length === 0 || !document) return;
    const previous = undoStack[undoStack.length - 1];
    setRedoStack(prev => [...prev, document]);
    setUndoStack(prev => prev.slice(0, prev.length - 1));
    setDocument(previous);
    StorageService.saveDocument(previous);
    setAutosaveStatus('Saved');
  }, [undoStack, document]);

  const redo = useCallback(() => {
    if (redoStack.length === 0 || !document) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack(prev => [...prev, document]);
    setRedoStack(prev => prev.slice(0, prev.length - 1));
    setDocument(next);
    StorageService.saveDocument(next);
    setAutosaveStatus('Saved');
  }, [redoStack, document]);

  // Zoom helpers
  const fitPage = useCallback(() => {
    // Calculates scale to fit standard page within common viewport height (around 650px)
    const scale = Math.min(1.2, Math.max(0.4, Number((580 / canvasHeightPx).toFixed(2))));
    setZoom(scale);
  }, [canvasHeightPx]);

  const fitWidth = useCallback(() => {
    const scale = Math.min(1.4, Math.max(0.5, Number((520 / canvasWidthPx).toFixed(2))));
    setZoom(scale);
  }, [canvasWidthPx]);

  // Selection handlers
  const selectElement = useCallback((id: string | null, isShift: boolean = false) => {
    if (!id) {
      setSelectedElementIds([]);
      return;
    }
    if (isShift) {
      setSelectedElementIds(prev =>
        prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
      );
    } else {
      setSelectedElementIds([id]);
    }
  }, []);

  const selectElements = useCallback((ids: string[]) => {
    setSelectedElementIds(ids);
  }, []);

  const selectAll = useCallback(() => {
    if (!currentPage) return;
    setSelectedElementIds(currentPage.elements.map(e => e.id));
  }, [currentPage]);

  const clearSelection = useCallback(() => {
    setSelectedElementIds([]);
  }, []);

  // Element Actions
  const addElement = useCallback((typeOrElement: CanvasElementType | CanvasElement, defaultOverrides: Partial<CanvasElement> = {}) => {
    if (!document || !currentPage) return;

    if (typeof typeOrElement === 'object' && typeOrElement !== null && 'type' in typeOrElement) {
      const el = typeOrElement as CanvasElement;
      const newId = el.id || `el-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const elementToAdd = {
        ...el,
        id: newId,
        zIndex: currentPage.elements.length + 1,
      } as CanvasElement;

      const updatedPages = [...document.pages];
      updatedPages[currentPageIndex] = {
        ...currentPage,
        elements: [...currentPage.elements, elementToAdd],
      };

      commitDocumentChange({
        ...document,
        pages: updatedPages,
      });

      setSelectedElementIds([newId]);
      setToolMode('select');
      return;
    }

    const type = typeOrElement as CanvasElementType;
    const newId = `el-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const centerX = Math.max(40, Math.round(canvasWidthPx / 2 - 150));
    const centerY = Math.max(40, Math.round(canvasHeightPx / 2 - 60));

    let newElement: CanvasElement;

    switch (type) {
      case 'text':
        newElement = {
          id: newId,
          type: 'text',
          name: 'Text Heading',
          content: 'Add your text heading here',
          x: centerX,
          y: centerY,
          width: 300,
          height: 50,
          rotation: 0,
          zIndex: currentPage.elements.length + 1,
          opacity: 1,
          fontFamily: 'Outfit',
          fontSize: 22,
          fontWeight: '700',
          textAlign: 'center',
          color: '#111827',
          lineHeight: 1.2,
          letterSpacing: 0.5,
          ...defaultOverrides,
        } as TextElement;
        break;

      case 'shape':
        newElement = {
          id: newId,
          type: 'shape',
          name: 'Box Shape',
          shapeType: 'rectangle',
          x: centerX,
          y: centerY,
          width: 240,
          height: 180,
          rotation: 0,
          zIndex: currentPage.elements.length + 1,
          opacity: 1,
          fillColor: '#F3F4F6',
          strokeColor: '#374151',
          strokeWidth: 2,
          borderRadius: 6,
          ...defaultOverrides,
        } as ShapeElement;
        break;

      case 'line':
        newElement = {
          id: newId,
          type: 'line',
          name: 'Rule Line',
          strokeColor: '#1F2937',
          strokeWidth: 2,
          lineStyle: 'solid',
          x: centerX,
          y: centerY,
          width: 280,
          height: 4,
          rotation: 0,
          zIndex: currentPage.elements.length + 1,
          opacity: 1,
          ...defaultOverrides,
        } as LineElement;
        break;

      case 'image':
        newElement = {
          id: newId,
          type: 'image',
          name: 'Illustration Image',
          src: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop&q=80',
          imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop&q=80',
          alt: 'Asset illustration',
          objectFit: 'contain',
          borderRadius: 4,
          x: centerX,
          y: centerY,
          width: 240,
          height: 240,
          rotation: 0,
          zIndex: currentPage.elements.length + 1,
          opacity: 1,
          aspectRatioLocked: true,
          ...defaultOverrides,
        } as ImageElement;
        break;

      default:
        newElement = {
          id: newId,
          type: 'text',
          name: 'Paragraph Text',
          content: 'New Element',
          x: centerX,
          y: centerY,
          width: 200,
          height: 40,
          rotation: 0,
          zIndex: currentPage.elements.length + 1,
          opacity: 1,
          fontFamily: 'Plus Jakarta Sans',
          fontSize: 16,
          fontWeight: '500',
          textAlign: 'left',
          color: '#111827',
          lineHeight: 1.2,
          letterSpacing: 0,
          ...defaultOverrides,
        } as TextElement;
    }

    const updatedPages = [...document.pages];
    updatedPages[currentPageIndex] = {
      ...currentPage,
      elements: [...currentPage.elements, newElement],
    };

    commitDocumentChange({
      ...document,
      pages: updatedPages,
    });

    setSelectedElementIds([newId]);
    setToolMode('select');
  }, [document, currentPage, currentPageIndex, canvasWidthPx, canvasHeightPx, commitDocumentChange]);

  const updateElement = useCallback((id: string, updates: Partial<CanvasElement>) => {
    if (!document || !currentPage) return;

    const updatedPages = [...document.pages];
    updatedPages[currentPageIndex] = {
      ...currentPage,
      elements: currentPage.elements.map(el => (el.id === id ? ({ ...el, ...updates } as CanvasElement) : el)),
    };

    commitDocumentChange({
      ...document,
      pages: updatedPages,
    });
  }, [document, currentPage, currentPageIndex, commitDocumentChange]);

  const updateElements = useCallback((updatesList: { id: string; updates: Partial<CanvasElement> }[]) => {
    if (!document || !currentPage) return;

    const updateMap = new Map(updatesList.map(u => [u.id, u.updates]));
    const updatedPages = [...document.pages];
    updatedPages[currentPageIndex] = {
      ...currentPage,
      elements: currentPage.elements.map(el => {
        const u = updateMap.get(el.id);
        return u ? ({ ...el, ...u } as CanvasElement) : el;
      }),
    };

    commitDocumentChange({
      ...document,
      pages: updatedPages,
    });
  }, [document, currentPage, currentPageIndex, commitDocumentChange]);

  const deleteSelectedElements = useCallback(() => {
    if (!document || !currentPage || selectedElementIds.length === 0) return;

    const updatedPages = [...document.pages];
    updatedPages[currentPageIndex] = {
      ...currentPage,
      elements: currentPage.elements.filter(el => !selectedElementIds.includes(el.id)),
    };

    commitDocumentChange({
      ...document,
      pages: updatedPages,
    });
    setSelectedElementIds([]);
  }, [document, currentPage, selectedElementIds, currentPageIndex, commitDocumentChange]);

  const duplicateSelectedElements = useCallback(() => {
    if (!document || !currentPage || selectedElementIds.length === 0) return;

    const duplicatedElements: CanvasElement[] = [];
    const newSelectedIds: string[] = [];

    currentPage.elements.forEach(el => {
      if (selectedElementIds.includes(el.id)) {
        const newId = `el-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        const copy: CanvasElement = {
          ...el,
          id: newId,
          x: el.x + 20,
          y: el.y + 20,
          zIndex: currentPage.elements.length + duplicatedElements.length + 1,
        };
        duplicatedElements.push(copy);
        newSelectedIds.push(newId);
      }
    });

    const updatedPages = [...document.pages];
    updatedPages[currentPageIndex] = {
      ...currentPage,
      elements: [...currentPage.elements, ...duplicatedElements],
    };

    commitDocumentChange({
      ...document,
      pages: updatedPages,
    });

    setSelectedElementIds(newSelectedIds);
  }, [document, currentPage, selectedElementIds, currentPageIndex, commitDocumentChange]);

  const lockElement = useCallback((id: string, locked: boolean = true) => {
    updateElement(id, { locked });
  }, [updateElement]);

  const toggleLockSelected = useCallback(() => {
    if (selectedElements.length === 0) return;
    const allLocked = selectedElements.every(el => el.locked);
    const newLocked = !allLocked;
    updateElements(selectedElements.map(el => ({ id: el.id, updates: { locked: newLocked } })));
  }, [selectedElements, updateElements]);

  const toggleAspectRatioLock = useCallback(() => {
    if (selectedElements.length === 0) return;
    const allLocked = selectedElements.every(el => el.aspectRatioLocked);
    const newLocked = !allLocked;
    updateElements(selectedElements.map(el => ({ id: el.id, updates: { aspectRatioLocked: newLocked } })));
  }, [selectedElements, updateElements]);

  // Grouping
  const groupSelectedElements = useCallback(() => {
    if (!document || !currentPage || selectedElementIds.length < 2) return;

    const itemsToGroup = currentPage.elements.filter(
      el => selectedElementIds.includes(el.id) && !el.locked
    );
    if (itemsToGroup.length < 2) return;

    const minX = Math.min(...itemsToGroup.map(el => el.x));
    const minY = Math.min(...itemsToGroup.map(el => el.y));
    const maxX = Math.max(...itemsToGroup.map(el => el.x + el.width));
    const maxY = Math.max(...itemsToGroup.map(el => el.y + el.height));

    const groupId = `group-${Date.now()}`;
    const groupElement: GroupElement = {
      id: groupId,
      type: 'group',
      name: `Group (${itemsToGroup.length} items)`,
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
      rotation: 0,
      zIndex: Math.max(...itemsToGroup.map(el => el.zIndex || 1)),
      opacity: 1,
      childrenIds: itemsToGroup.map(el => el.id),
    };

    // Tag children with groupId
    const updatedElements = currentPage.elements.map(el => {
      if (selectedElementIds.includes(el.id)) {
        return { ...el, groupId };
      }
      return el;
    });

    const updatedPages = [...document.pages];
    updatedPages[currentPageIndex] = {
      ...currentPage,
      elements: [...updatedElements, groupElement],
    };

    commitDocumentChange({
      ...document,
      pages: updatedPages,
    });

    setSelectedElementIds([groupId]);
  }, [document, currentPage, selectedElementIds, currentPageIndex, commitDocumentChange]);

  const ungroupSelectedElements = useCallback(() => {
    if (!document || !currentPage || selectedElementIds.length === 0) return;

    const groupsToUngroup = currentPage.elements.filter(
      el => el.type === 'group' && selectedElementIds.includes(el.id)
    ) as GroupElement[];

    if (groupsToUngroup.length === 0) return;

    const groupIds = new Set(groupsToUngroup.map(g => g.id));
    const childrenToSelect: string[] = [];
    groupsToUngroup.forEach(g => childrenToSelect.push(...g.childrenIds));

    const remainingElements = currentPage.elements
      .filter(el => !groupIds.has(el.id))
      .map(el => (el.groupId && groupIds.has(el.groupId) ? { ...el, groupId: undefined } : el));

    const updatedPages = [...document.pages];
    updatedPages[currentPageIndex] = {
      ...currentPage,
      elements: remainingElements,
    };

    commitDocumentChange({
      ...document,
      pages: updatedPages,
    });

    setSelectedElementIds(childrenToSelect);
  }, [document, currentPage, selectedElementIds, currentPageIndex, commitDocumentChange]);

  // Layering
  const bringForward = useCallback(() => {
    if (!document || !currentPage || selectedElementIds.length === 0) return;
    const targetId = selectedElementIds[0];
    const elements = [...currentPage.elements];
    const index = elements.findIndex(e => e.id === targetId);
    if (index < elements.length - 1) {
      const temp = elements[index];
      elements[index] = elements[index + 1];
      elements[index + 1] = temp;
      elements.forEach((el, idx) => (el.zIndex = idx + 1));

      const updatedPages = [...document.pages];
      updatedPages[currentPageIndex] = { ...currentPage, elements };
      commitDocumentChange({ ...document, pages: updatedPages });
    }
  }, [document, currentPage, selectedElementIds, currentPageIndex, commitDocumentChange]);

  const sendBackward = useCallback(() => {
    if (!document || !currentPage || selectedElementIds.length === 0) return;
    const targetId = selectedElementIds[0];
    const elements = [...currentPage.elements];
    const index = elements.findIndex(e => e.id === targetId);
    if (index > 0) {
      const temp = elements[index];
      elements[index] = elements[index - 1];
      elements[index - 1] = temp;
      elements.forEach((el, idx) => (el.zIndex = idx + 1));

      const updatedPages = [...document.pages];
      updatedPages[currentPageIndex] = { ...currentPage, elements };
      commitDocumentChange({ ...document, pages: updatedPages });
    }
  }, [document, currentPage, selectedElementIds, currentPageIndex, commitDocumentChange]);

  const bringToFront = useCallback(() => {
    if (!document || !currentPage || selectedElementIds.length === 0) return;
    const targetId = selectedElementIds[0];
    const elements = currentPage.elements.filter(e => e.id !== targetId);
    const target = currentPage.elements.find(e => e.id === targetId);
    if (target) {
      elements.push(target);
      elements.forEach((el, idx) => (el.zIndex = idx + 1));
      const updatedPages = [...document.pages];
      updatedPages[currentPageIndex] = { ...currentPage, elements };
      commitDocumentChange({ ...document, pages: updatedPages });
    }
  }, [document, currentPage, selectedElementIds, currentPageIndex, commitDocumentChange]);

  const sendToBack = useCallback(() => {
    if (!document || !currentPage || selectedElementIds.length === 0) return;
    const targetId = selectedElementIds[0];
    const elements = currentPage.elements.filter(e => e.id !== targetId);
    const target = currentPage.elements.find(e => e.id === targetId);
    if (target) {
      elements.unshift(target);
      elements.forEach((el, idx) => (el.zIndex = idx + 1));
      const updatedPages = [...document.pages];
      updatedPages[currentPageIndex] = { ...currentPage, elements };
      commitDocumentChange({ ...document, pages: updatedPages });
    }
  }, [document, currentPage, selectedElementIds, currentPageIndex, commitDocumentChange]);

  const reorderLayers = useCallback((fromIndex: number, toIndex: number) => {
    if (!document || !currentPage) return;
    const elements = [...currentPage.elements];
    const [moved] = elements.splice(fromIndex, 1);
    elements.splice(toIndex, 0, moved);
    elements.forEach((el, idx) => (el.zIndex = idx + 1));

    const updatedPages = [...document.pages];
    updatedPages[currentPageIndex] = { ...currentPage, elements };
    commitDocumentChange({ ...document, pages: updatedPages });
  }, [document, currentPage, currentPageIndex, commitDocumentChange]);

  const toggleElementVisibility = useCallback((id: string) => {
    const el = currentPage?.elements.find(e => e.id === id);
    if (el) {
      updateElement(id, { opacity: el.opacity === 0 ? 1 : 0 });
    }
  }, [currentPage, updateElement]);

  // Alignment & Distribution
  const alignElements = useCallback((direction: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    if (!document || !currentPage || selectedElementIds.length === 0) return;

    // Single item aligns to page bounds / safe zone
    if (selectedElementIds.length === 1) {
      const el = selectedElements[0];
      if (!el || el.locked) return;
      let nextX = el.x;
      let nextY = el.y;

      switch (direction) {
        case 'left':
          nextX = 48; // Safe left margin
          break;
        case 'center':
          nextX = Math.round((canvasWidthPx - el.width) / 2);
          break;
        case 'right':
          nextX = canvasWidthPx - el.width - 48;
          break;
        case 'top':
          nextY = 48; // Safe top margin
          break;
        case 'middle':
          nextY = Math.round((canvasHeightPx - el.height) / 2);
          break;
        case 'bottom':
          nextY = canvasHeightPx - el.height - 48;
          break;
      }
      updateElement(el.id, { x: nextX, y: nextY });
      return;
    }

    // Multiple items align relative to group bounding box
    const items = selectedElements.filter(e => !e.locked);
    if (items.length === 0) return;

    const minX = Math.min(...items.map(e => e.x));
    const minY = Math.min(...items.map(e => e.y));
    const maxX = Math.max(...items.map(e => e.x + e.width));
    const maxY = Math.max(...items.map(e => e.y + e.height));
    const midX = minX + (maxX - minX) / 2;
    const midY = minY + (maxY - minY) / 2;

    const updates: { id: string; updates: Partial<CanvasElement> }[] = [];

    items.forEach(el => {
      let x = el.x;
      let y = el.y;
      switch (direction) {
        case 'left':
          x = minX;
          break;
        case 'center':
          x = Math.round(midX - el.width / 2);
          break;
        case 'right':
          x = maxX - el.width;
          break;
        case 'top':
          y = minY;
          break;
        case 'middle':
          y = Math.round(midY - el.height / 2);
          break;
        case 'bottom':
          y = maxY - el.height;
          break;
      }
      updates.push({ id: el.id, updates: { x, y } });
    });

    updateElements(updates);
  }, [document, currentPage, selectedElementIds, selectedElements, canvasWidthPx, canvasHeightPx, updateElement, updateElements]);

  const distributeElements = useCallback((direction: 'horizontal' | 'vertical') => {
    if (!currentPage || selectedElementIds.length < 3) return;
    const items = selectedElements.filter(e => !e.locked);
    if (items.length < 3) return;

    if (direction === 'horizontal') {
      const sorted = [...items].sort((a, b) => a.x - b.x);
      const minX = sorted[0].x;
      const last = sorted[sorted.length - 1];
      const maxX = last.x + last.width;
      const totalElementsWidth = sorted.reduce((sum, item) => sum + item.width, 0);
      const gap = (maxX - minX - totalElementsWidth) / (sorted.length - 1);

      let currentX = minX;
      const updates = sorted.map(el => {
        const x = Math.round(currentX);
        currentX += el.width + gap;
        return { id: el.id, updates: { x } };
      });
      updateElements(updates);
    } else {
      const sorted = [...items].sort((a, b) => a.y - b.y);
      const minY = sorted[0].y;
      const last = sorted[sorted.length - 1];
      const maxY = last.y + last.height;
      const totalElementsHeight = sorted.reduce((sum, item) => sum + item.height, 0);
      const gap = (maxY - minY - totalElementsHeight) / (sorted.length - 1);

      let currentY = minY;
      const updates = sorted.map(el => {
        const y = Math.round(currentY);
        currentY += el.height + gap;
        return { id: el.id, updates: { y } };
      });
      updateElements(updates);
    }
  }, [currentPage, selectedElementIds.length, selectedElements, updateElements]);

  // Clipboard operations
  const copySelected = useCallback(() => {
    if (selectedElements.length === 0) return;
    setClipboard(selectedElements.map(el => ({ ...el })));
  }, [selectedElements]);

  const cutSelected = useCallback(() => {
    if (selectedElements.length === 0) return;
    setClipboard(selectedElements.map(el => ({ ...el })));
    deleteSelectedElements();
  }, [selectedElements, deleteSelectedElements]);

  const pasteClipboard = useCallback(() => {
    if (!document || !currentPage || clipboard.length === 0) return;

    const newElements: CanvasElement[] = [];
    const newIds: string[] = [];

    clipboard.forEach((item, index) => {
      const newId = `el-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const copy: CanvasElement = {
        ...item,
        id: newId,
        x: Math.min(canvasWidthPx - item.width - 20, item.x + 24),
        y: Math.min(canvasHeightPx - item.height - 20, item.y + 24),
        zIndex: currentPage.elements.length + index + 1,
      };
      newElements.push(copy);
      newIds.push(newId);
    });

    const updatedPages = [...document.pages];
    updatedPages[currentPageIndex] = {
      ...currentPage,
      elements: [...currentPage.elements, ...newElements],
    };

    commitDocumentChange({
      ...document,
      pages: updatedPages,
    });

    setSelectedElementIds(newIds);
  }, [document, currentPage, clipboard, canvasWidthPx, canvasHeightPx, currentPageIndex, commitDocumentChange]);

  // Page Operations
  const selectPage = useCallback((index: number) => {
    if (!document || index < 0 || index >= document.pages.length) return;
    setCurrentPageIndex(index);
    setSelectedElementIds([]);
  }, [document]);

  const addPage = useCallback((options?: { name?: string; background?: string; pattern?: PageModel['pattern']; elements?: CanvasElement[] }) => {
    if (!document || !activeProject) return;

    const newPageNumber = document.pages.length + 1;
    const newPageId = `page-${activeProject.id}-${Date.now()}`;
    const newPage: PageModel = {
      id: newPageId,
      pageNumber: newPageNumber,
      backgroundColor: options?.background || '#FFFFFF',
      pattern: options?.pattern || 'none',
      name: options?.name || `Page ${newPageNumber}`,
      elements: options?.elements ? options.elements.map(el => ({
        ...el,
        id: `el-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      })) : [],
      notes: `Interior Page ${newPageNumber}`,
    };

    const updatedPages = [...document.pages, newPage];
    commitDocumentChange({
      ...document,
      pages: updatedPages,
    });

    setCurrentPageIndex(updatedPages.length - 1);
    setSelectedElementIds([]);
  }, [document, activeProject, commitDocumentChange]);

  const insertPuzzlesWithSolutions = useCallback((
    puzzles: GeneratedPuzzle[],
    options?: {
      styleOptions?: Partial<PuzzleStyleOptions>;
      autoAnswerKey?: boolean;
      answerKeyMode?: 'end_of_book' | 'after_puzzle' | 'after_each_puzzle' | 'none';
      theme?: BookTheme;
    }
  ) => {
    if (!document || !activeProject || puzzles.length === 0) return;

    const result = AnswerKeyService.insertPuzzlesWithSolutions({
      document,
      project: activeProject,
      puzzles,
      styleOptions: options?.styleOptions,
      autoAnswerKey: options?.autoAnswerKey ?? true,
      answerKeyMode: options?.answerKeyMode,
      theme: options?.theme,
    });

    commitDocumentChange(result.updatedDocument);
    if (result.updatedProject) {
      StorageService.saveProject(result.updatedProject);
    }

    if (result.addedPuzzlePages.length > 0) {
      const firstPuzzleId = result.addedPuzzlePages[0].id;
      const puzzlePageIdx = result.updatedDocument.pages.findIndex(p => p.id === firstPuzzleId);
      if (puzzlePageIdx !== -1) {
        setCurrentPageIndex(puzzlePageIdx);
      }
    }
    setSelectedElementIds([]);

    const puzzleCount = result.addedPuzzlePages.length;
    const solutionCount = result.addedSolutionPages.length;

    showToast({
      type: 'success',
      title: 'Puzzles Added to Manuscript',
      message: solutionCount > 0
        ? `Added ${puzzleCount} puzzle${puzzleCount > 1 ? 's' : ''} and ${solutionCount} dedicated Solution Key page${solutionCount > 1 ? 's' : ''}.`
        : `Added ${puzzleCount} puzzle${puzzleCount > 1 ? 's' : ''} to manuscript.`,
    });
  }, [document, activeProject, commitDocumentChange, showToast]);

  const insertPuzzleWithSolution = useCallback((
    puzzle: GeneratedPuzzle,
    options?: {
      styleOptions?: Partial<PuzzleStyleOptions>;
      autoAnswerKey?: boolean;
      answerKeyMode?: 'end_of_book' | 'after_puzzle' | 'after_each_puzzle' | 'none';
      theme?: BookTheme;
    }
  ) => {
    insertPuzzlesWithSolutions([puzzle], options);
  }, [insertPuzzlesWithSolutions]);

  const deletePage = useCallback((index: number) => {
    if (!document || document.pages.length <= 1) {
      showToast({
        type: 'warning',
        message: 'A book must contain at least 1 page.',
      });
      return;
    }

    const updatedPages = document.pages
      .filter((_, i) => i !== index)
      .map((p, i) => ({ ...p, pageNumber: i + 1 }));

    const synchronizedPages = AnswerKeyService.synchronizeSolutionPageReferences(updatedPages);

    commitDocumentChange({
      ...document,
      pages: synchronizedPages,
    });

    if (currentPageIndex >= synchronizedPages.length) {
      setCurrentPageIndex(synchronizedPages.length - 1);
    }
    setSelectedElementIds([]);
  }, [document, showToast, currentPageIndex, commitDocumentChange]);

  const duplicatePage = useCallback((index: number) => {
    if (!document || !activeProject) return;
    const pageToCopy = document.pages[index];
    if (!pageToCopy) return;

    const duplicatedPage: PageModel = {
      ...pageToCopy,
      id: `page-${activeProject.id}-${Date.now()}`,
      pageNumber: index + 2,
      name: `${pageToCopy.name || 'Page'} (Copy)`,
      notes: `${pageToCopy.notes || 'Page'} (Copy)`,
      elements: pageToCopy.elements.map(el => ({
        ...el,
        id: `el-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      })),
    };

    const updatedPages = [
      ...document.pages.slice(0, index + 1),
      duplicatedPage,
      ...document.pages.slice(index + 1),
    ].map((p, i) => ({ ...p, pageNumber: i + 1 }));

    const synchronizedPages = AnswerKeyService.synchronizeSolutionPageReferences(updatedPages);

    commitDocumentChange({
      ...document,
      pages: synchronizedPages,
    });

    setCurrentPageIndex(index + 1);
    setSelectedElementIds([]);
  }, [document, activeProject, commitDocumentChange]);

  const reorderPage = useCallback((fromIndex: number, toIndex: number) => {
    if (!document || fromIndex < 0 || toIndex < 0 || fromIndex >= document.pages.length || toIndex >= document.pages.length) {
      return;
    }
    const updatedPages = [...document.pages];
    const [moved] = updatedPages.splice(fromIndex, 1);
    updatedPages.splice(toIndex, 0, moved);

    const normalizedPages = updatedPages.map((p, i) => ({ ...p, pageNumber: i + 1 }));
    const synchronizedPages = AnswerKeyService.synchronizeSolutionPageReferences(normalizedPages);

    commitDocumentChange({
      ...document,
      pages: synchronizedPages,
    });

    setCurrentPageIndex(toIndex);
  }, [document, commitDocumentChange]);

  const updatePageBackground = useCallback((color: string) => {
    if (!document || !currentPage) return;
    const updatedPages = [...document.pages];
    updatedPages[currentPageIndex] = {
      ...currentPage,
      backgroundColor: color,
    };
    commitDocumentChange({
      ...document,
      pages: updatedPages,
    });
  }, [document, currentPage, currentPageIndex, commitDocumentChange]);

  const updatePagePattern = useCallback((pattern: 'none' | 'dotGrid' | 'lined' | 'graph', color: string = '#CBD5E1') => {
    if (!document || !currentPage) return;
    const updatedPages = [...document.pages];
    updatedPages[currentPageIndex] = {
      ...currentPage,
      pattern,
      patternColor: color,
    };
    commitDocumentChange({
      ...document,
      pages: updatedPages,
    });
  }, [document, currentPage, currentPageIndex, commitDocumentChange]);

  const updatePageName = useCallback((index: number, name: string) => {
    if (!document || index < 0 || index >= document.pages.length) return;
    const updatedPages = [...document.pages];
    updatedPages[index] = {
      ...updatedPages[index],
      name,
    };
    commitDocumentChange({
      ...document,
      pages: updatedPages,
    });
  }, [document, commitDocumentChange]);

  const duplicateCurrentPage = useCallback(() => {
    duplicatePage(currentPageIndex);
  }, [duplicatePage, currentPageIndex]);

  const deleteCurrentPage = useCallback(() => {
    deletePage(currentPageIndex);
  }, [deletePage, currentPageIndex]);

  const updateCurrentPageNotes = useCallback((notes: string) => {
    if (!document || !currentPage) return;
    const updatedPages = [...document.pages];
    updatedPages[currentPageIndex] = {
      ...currentPage,
      notes,
    };
    commitDocumentChange({
      ...document,
      pages: updatedPages,
    });
  }, [document, currentPage, currentPageIndex, commitDocumentChange]);

  const bulkAddPages = useCallback((count: number, templateElements?: CanvasElement[]) => {
    if (!document || !activeProject || count <= 0) return;

    const newPages: PageModel[] = [];
    const baseNumber = document.pages.length;

    for (let i = 1; i <= count; i++) {
      const pNum = baseNumber + i;
      newPages.push({
        id: `page-${activeProject.id}-${Date.now()}-${i}`,
        pageNumber: pNum,
        name: `Page ${pNum}`,
        backgroundColor: '#FFFFFF',
        pattern: 'none',
        elements: templateElements ? templateElements.map(el => ({
          ...el,
          id: `el-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
        })) : [],
      });
    }

    const updatedPages = [...document.pages, ...newPages];
    commitDocumentChange({
      ...document,
      pages: updatedPages,
    });

    showToast({
      type: 'success',
      message: `Added ${count} new pages to manuscript.`,
    });
  }, [document, activeProject, commitDocumentChange, showToast]);

  const applyTemplateToCurrentPage = useCallback((elements: CanvasElement[]) => {
    if (!document || !currentPage) return;
    const instantiated = elements.map(el => ({
      ...el,
      id: `el-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      zIndex: currentPage.elements.length + 1,
    }));

    const updatedPages = [...document.pages];
    updatedPages[currentPageIndex] = {
      ...currentPage,
      elements: [...currentPage.elements, ...instantiated],
    };
    commitDocumentChange({
      ...document,
      pages: updatedPages,
    });
  }, [document, currentPage, currentPageIndex, commitDocumentChange]);

  return (
    <EditorContext.Provider
      value={{
        project: activeProject,
        document,
        currentPageIndex,
        setCurrentPageIndex,
        currentPage,
        selectedElementIds,
        selectedElements,
        toolMode,
        setToolMode,
        // Zoom & View
        zoom,
        setZoom,
        fitPage,
        fitWidth,
        // Overlays & Toggles
        showSafeMargins,
        setShowSafeMargins,
        showMargins: showSafeMargins,
        setShowMargins: setShowSafeMargins,
        showBleedGuides,
        setShowBleedGuides,
        showBleed: showBleedGuides,
        setShowBleed: setShowBleedGuides,
        showGrid,
        setShowGrid,
        gridSize,
        setGridSize,
        showGuides,
        setShowGuides,
        showRulers,
        setShowRulers,
        rulerUnit,
        setRulerUnit,
        // Snap
        snapToGrid,
        setSnapToGrid,
        snapToObjects,
        setSnapToObjects,
        snapToMargins,
        setSnapToMargins,
        snapToCenter,
        setSnapToCenter,
        // Status & Dimensions
        autosaveStatus,
        canUndo: undoStack.length > 0,
        canRedo: redoStack.length > 0,
        canvasWidthPx,
        canvasHeightPx,
        // Selection
        selectElement,
        selectElements,
        selectAll,
        clearSelection,
        // Element Actions
        addElement,
        updateElement,
        updateElements,
        deleteSelectedElements,
        duplicateSelectedElements,
        lockElement,
        toggleLockSelected,
        toggleAspectRatioLock,
        groupSelectedElements,
        ungroupSelectedElements,
        bringForward,
        sendBackward,
        bringToFront,
        sendToBack,
        reorderLayers,
        toggleElementVisibility,
        alignElements,
        distributeElements,
        // Clipboard
        clipboard,
        copySelected,
        cutSelected,
        pasteClipboard,
        // Page Actions
        selectPage,
        addPage,
        insertPuzzleWithSolution,
        insertPuzzlesWithSolutions,
        deletePage,
        duplicatePage,
        duplicateCurrentPage,
        deleteCurrentPage,
        reorderPage,
        updatePageBackground,
        updatePagePattern,
        updatePageName,
        updateCurrentPageNotes,
        bulkAddPages,
        applyTemplateToCurrentPage,
        updateDocument: commitDocumentChange,
        // History & Save
        undo,
        redo,
        saveNow,
      }}
    >
      {children}
    </EditorContext.Provider>
  );
};

export const useEditor = (): EditorContextType => {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error('useEditor must be used within an EditorProvider');
  }
  return context;
};

export const useOptionalEditor = (): EditorContextType | null => {
  return useContext(EditorContext);
};

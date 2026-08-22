import React, { useState } from 'react';
import {
  Type,
  Square,
  Grid3X3,
  LayoutTemplate,
  Image as ImageIcon,
  Minus,
  Table,
  Plus,
  Sparkles,
  Circle,
  HelpCircle,
  Hash,
  ListOrdered,
  FileText,
  Compass,
  Star,
  Triangle,
  Heart,
  Upload,
  Link,
  BookOpen,
} from 'lucide-react';
import { useEditor } from '../../context/EditorContext';
import { CanvasElement, ShapeType } from '../../types';
import { DEMO_ASSETS } from '../../constants/assets';
import { EditorOutlinePanel } from './EditorOutlinePanel';
import { AiWordGeneratorModal } from '../puzzles/AiWordGeneratorModal';
import { PuzzleRegistry } from '../../puzzles/core/PuzzleRegistry';
import { useApp } from '../../context/AppContext';

interface EditorLeftPanelProps {
  onOpenSettings?: () => void;
  onOpenValidation?: () => void;
  onOpenBulkEdit?: () => void;
  onOpenStyles?: () => void;
  onOpenPreview?: () => void;
}

export const EditorLeftPanel: React.FC<EditorLeftPanelProps> = ({
  onOpenSettings,
  onOpenValidation,
  onOpenBulkEdit,
  onOpenStyles,
  onOpenPreview,
}) => {
  const [activeTab, setActiveTab] = useState<'outline' | 'text' | 'shapes' | 'puzzles' | 'templates' | 'assets'>('outline');
  const { addElement, addPage, applyTemplateToCurrentPage, insertPuzzleWithSolution } = useEditor();
  const { showToast } = useApp();
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [isAiWordModalOpen, setIsAiWordModalOpen] = useState(false);

  const handleAddText = (variant: 'title' | 'heading' | 'subheading' | 'body' | 'pageNumber' | 'wordList' | 'quote') => {
    const id = `el-text-${Date.now()}`;
    let newElement: CanvasElement;

    if (variant === 'title') {
      newElement = {
        id,
        type: 'text',
        name: 'Chapter Title',
        content: 'CHAPTER TITLE',
        x: 60,
        y: 80,
        width: 450,
        height: 55,
        rotation: 0,
        zIndex: 10,
        opacity: 1,
        fontFamily: 'Playfair Display',
        fontSize: 32,
        fontWeight: '700',
        textAlign: 'center',
        color: '#111827',
        lineHeight: 1.2,
        letterSpacing: 2,
      };
    } else if (variant === 'heading') {
      newElement = {
        id,
        type: 'text',
        name: 'Section Heading',
        content: 'Activity Section #1',
        x: 60,
        y: 120,
        width: 450,
        height: 40,
        rotation: 0,
        zIndex: 10,
        opacity: 1,
        fontFamily: 'Outfit',
        fontSize: 20,
        fontWeight: '700',
        textAlign: 'center',
        color: '#1F2937',
        lineHeight: 1.2,
      };
    } else if (variant === 'subheading') {
      newElement = {
        id,
        type: 'text',
        name: 'Subheading',
        content: 'Instructions & Overview',
        x: 60,
        y: 150,
        width: 450,
        height: 30,
        rotation: 0,
        zIndex: 10,
        opacity: 1,
        fontFamily: 'Plus Jakarta Sans',
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
        color: '#4B5563',
        lineHeight: 1.3,
      };
    } else if (variant === 'pageNumber') {
      newElement = {
        id,
        type: 'text',
        name: 'Page Number',
        content: '1',
        x: 260,
        y: 780,
        width: 60,
        height: 30,
        rotation: 0,
        zIndex: 10,
        opacity: 1,
        fontFamily: 'Plus Jakarta Sans',
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
        color: '#6B7280',
        lineHeight: 1,
      };
    } else if (variant === 'wordList') {
      newElement = {
        id,
        type: 'text',
        name: 'Word Bank',
        content: 'LION • ELEPHANT • GIRAFFE • CHEETAH • ZEBRA • RHINO • HIPPO • GAZELLE',
        x: 60,
        y: 680,
        width: 456,
        height: 60,
        rotation: 0,
        zIndex: 10,
        opacity: 1,
        fontFamily: 'Plus Jakarta Sans',
        fontSize: 11,
        fontWeight: '600',
        textAlign: 'center',
        color: '#374151',
        lineHeight: 1.6,
        letterSpacing: 1,
      };
    } else if (variant === 'quote') {
      newElement = {
        id,
        type: 'text',
        name: 'Callout Quote',
        content: '"The only limit to our realization of tomorrow will be our doubts of today."',
        x: 80,
        y: 200,
        width: 410,
        height: 70,
        rotation: 0,
        zIndex: 10,
        opacity: 1,
        fontFamily: 'Cinzel',
        fontSize: 14,
        fontWeight: '500',
        fontStyle: 'italic',
        textAlign: 'center',
        color: '#374151',
        lineHeight: 1.5,
      };
    } else {
      newElement = {
        id,
        type: 'text',
        name: 'Paragraph',
        content: 'Type your custom book interior text, story prose, or activity guidelines here...',
        x: 60,
        y: 180,
        width: 450,
        height: 80,
        rotation: 0,
        zIndex: 10,
        opacity: 1,
        fontFamily: 'Plus Jakarta Sans',
        fontSize: 14,
        fontWeight: '400',
        textAlign: 'left',
        color: '#374151',
        lineHeight: 1.6,
      };
    }

    addElement(newElement);
  };

  const handleAddShape = (shapeType: ShapeType | 'line') => {
    const id = `el-shape-${Date.now()}`;
    let element: CanvasElement;

    if (shapeType === 'line') {
      element = {
        id,
        type: 'line',
        name: 'Separator Line',
        x: 60,
        y: 200,
        width: 450,
        height: 2,
        rotation: 0,
        zIndex: 5,
        opacity: 1,
        strokeColor: '#374151',
        strokeWidth: 2,
        dashPattern: 'solid',
      };
    } else if (shapeType === 'circle' || shapeType === 'ellipse') {
      element = {
        id,
        type: 'shape',
        shapeType: 'circle',
        name: 'Circle',
        x: 180,
        y: 250,
        width: 200,
        height: 200,
        rotation: 0,
        zIndex: 5,
        opacity: 1,
        fillColor: '#F9FAFB',
        strokeColor: '#111827',
        strokeWidth: 2,
      };
    } else if (shapeType === 'triangle') {
      element = {
        id,
        type: 'shape',
        shapeType: 'triangle',
        name: 'Triangle',
        x: 200,
        y: 250,
        width: 180,
        height: 180,
        rotation: 0,
        zIndex: 5,
        opacity: 1,
        fillColor: '#F9FAFB',
        strokeColor: '#111827',
        strokeWidth: 2,
      };
    } else if (shapeType === 'star') {
      element = {
        id,
        type: 'shape',
        shapeType: 'star',
        name: 'Star',
        x: 200,
        y: 250,
        width: 180,
        height: 180,
        rotation: 0,
        zIndex: 5,
        opacity: 1,
        fillColor: '#FEF08A',
        strokeColor: '#CA8A04',
        strokeWidth: 2,
      };
    } else if (shapeType === 'heart') {
      element = {
        id,
        type: 'shape',
        shapeType: 'heart',
        name: 'Heart',
        x: 200,
        y: 250,
        width: 180,
        height: 180,
        rotation: 0,
        zIndex: 5,
        opacity: 1,
        fillColor: '#FEE2E2',
        strokeColor: '#DC2626',
        strokeWidth: 2,
      };
    } else {
      element = {
        id,
        type: 'shape',
        shapeType: 'rectangle',
        name: 'Rectangle Box',
        x: 60,
        y: 200,
        width: 456,
        height: 260,
        rotation: 0,
        zIndex: 5,
        opacity: 1,
        fillColor: '#FFFFFF',
        strokeColor: '#111827',
        strokeWidth: 2,
        borderRadius: 8,
      };
    }

    addElement(element);
  };

  const handleAddPuzzle = (puzzleType: 'word_search' | 'sudoku' | 'maze' | 'crossword') => {
    const id = `el-puzzle-${Date.now()}`;
    let puzzleElement: CanvasElement;

    if (puzzleType === 'sudoku') {
      puzzleElement = {
        id,
        type: 'puzzle',
        puzzleType: 'sudoku',
        name: 'Sudoku 9×9',
        x: 88,
        y: 200,
        width: 400,
        height: 400,
        rotation: 0,
        zIndex: 8,
        opacity: 1,
        puzzleData: {
          difficulty: 'Medium',
          gridSize: 9,
          gridData: [
            ['5', '3', '', '', '7', '', '', '', ''],
            ['6', '', '', '1', '9', '5', '', '', ''],
            ['', '9', '8', '', '', '', '', '6', ''],
            ['8', '', '', '', '6', '', '', '', '3'],
            ['4', '', '', '8', '', '3', '', '', '1'],
            ['7', '', '', '', '2', '', '', '', '6'],
            ['', '6', '', '', '', '', '2', '8', ''],
            ['', '', '', '4', '1', '9', '', '', '5'],
            ['', '', '', '', '8', '', '', '7', '9'],
          ],
        },
      };
    } else if (puzzleType === 'maze') {
      puzzleElement = {
        id,
        type: 'puzzle',
        puzzleType: 'maze',
        name: 'Maze Puzzle',
        x: 88,
        y: 180,
        width: 400,
        height: 400,
        rotation: 0,
        zIndex: 8,
        opacity: 1,
        puzzleData: {
          difficulty: 'Hard',
          gridSize: 20,
          seed: 42,
        },
      };
    } else if (puzzleType === 'crossword') {
      puzzleElement = {
        id,
        type: 'puzzle',
        puzzleType: 'crossword',
        name: 'Crossword Clues',
        x: 88,
        y: 180,
        width: 400,
        height: 400,
        rotation: 0,
        zIndex: 8,
        opacity: 1,
        puzzleData: {
          gridSize: 10,
          clues: [
            { num: 1, text: 'King of the jungle (4)' },
            { num: 2, text: 'Striped savanna equines (6)' },
            { num: 3, text: 'Tallest spotted mammal (7)' },
          ],
        },
      };
    } else {
      // Word search default
      const sampleLetters = [
        ['S', 'A', 'F', 'A', 'R', 'I', 'L', 'I', 'O', 'N', 'Z', 'Q', 'X', 'B', 'M'],
        ['E', 'L', 'E', 'P', 'H', 'A', 'N', 'T', 'G', 'E', 'E', 'W', 'O', 'R', 'D'],
        ['C', 'H', 'E', 'E', 'T', 'A', 'H', 'B', 'I', 'B', 'B', 'L', 'I', 'S', 'T'],
        ['K', 'A', 'N', 'G', 'A', 'R', 'O', 'O', 'R', 'R', 'R', 'P', 'A', 'T', 'H'],
        ['M', 'E', 'E', 'R', 'K', 'A', 'T', 'P', 'A', 'A', 'A', 'U', 'Z', 'Z', 'L'],
        ['G', 'I', 'R', 'A', 'F', 'F', 'E', 'H', 'F', 'F', 'F', 'Z', 'E', 'B', 'R'],
        ['Z', 'E', 'B', 'R', 'A', 'X', 'Y', 'Z', 'A', 'B', 'C', 'D', 'E', 'F', 'G'],
        ['H', 'I', 'P', 'P', 'O', 'T', 'A', 'M', 'U', 'S', 'T', 'E', 'M', 'P', 'L'],
        ['G', 'A', 'Z', 'E', 'L', 'L', 'E', 'O', 'P', 'A', 'R', 'D', 'Q', 'R', 'S'],
        ['L', 'E', 'O', 'P', 'A', 'R', 'D', 'J', 'U', 'N', 'G', 'L', 'E', 'T', 'U'],
        ['W', 'I', 'L', 'D', 'B', 'E', 'E', 'S', 'T', 'F', 'O', 'R', 'E', 'S', 'T'],
        ['C', 'R', 'O', 'C', 'O', 'D', 'I', 'L', 'E', 'R', 'I', 'V', 'E', 'R', 'W'],
        ['F', 'L', 'A', 'M', 'I', 'N', 'G', 'O', 'B', 'I', 'R', 'D', 'W', 'I', 'N'],
        ['M', 'O', 'N', 'K', 'E', 'Y', 'T', 'R', 'E', 'E', 'C', 'L', 'I', 'M', 'B'],
        ['O', 'S', 'T', 'R', 'I', 'C', 'H', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
      ];

      puzzleElement = {
        id,
        type: 'puzzle',
        puzzleType: 'word_search',
        name: 'Word Search 15×15',
        x: 88,
        y: 180,
        width: 400,
        height: 400,
        rotation: 0,
        zIndex: 8,
        opacity: 1,
        puzzleData: {
          theme: 'Wild Animals',
          gridSize: 15,
          words: ['SAFARI', 'LION', 'ELEPHANT', 'CHEETAH', 'KANGAROO', 'MEERKAT', 'GIRAFFE', 'ZEBRA', 'HIPPO', 'GAZELLE', 'LEOPARD'],
          gridData: sampleLetters,
        },
      };
    }

    addElement(puzzleElement);
  };

  const handleAddAsset = (assetUrl: string, name: string) => {
    const id = `el-asset-${Date.now()}`;
    const newElement: CanvasElement = {
      id,
      type: 'image',
      name: name || 'Illustration',
      imageUrl: assetUrl,
      x: 110,
      y: 180,
      width: 350,
      height: 350,
      rotation: 0,
      zIndex: 6,
      opacity: 1,
      aspectRatioLocked: true,
    };
    addElement(newElement);
  };

  const handleAddCustomImage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customImageUrl.trim()) return;
    handleAddAsset(customImageUrl.trim(), 'Custom Image');
    setCustomImageUrl('');
  };

  const handleApplyPreset = (preset: 'dotGrid' | 'lined' | 'borderFrame' | 'headerFooter') => {
    if (preset === 'dotGrid') {
      const dotElements: CanvasElement[] = [];
      for (let r = 0; r < 20; r++) {
        for (let c = 0; c < 14; c++) {
          dotElements.push({
            id: `dot-${r}-${c}-${Date.now()}`,
            type: 'shape',
            shapeType: 'circle',
            name: 'Grid Dot',
            x: 70 + c * 32,
            y: 100 + r * 32,
            width: 3,
            height: 3,
            rotation: 0,
            zIndex: 2,
            opacity: 0.5,
            fillColor: '#9CA3AF',
          });
        }
      }
      applyTemplateToCurrentPage(dotElements);
    } else if (preset === 'lined') {
      const lineElements: CanvasElement[] = [];
      for (let r = 0; r < 22; r++) {
        lineElements.push({
          id: `line-${r}-${Date.now()}`,
          type: 'line',
          name: 'Journal Line',
          x: 60,
          y: 100 + r * 30,
          width: 456,
          height: 1,
          rotation: 0,
          zIndex: 2,
          opacity: 0.8,
          strokeColor: '#D1D5DB',
          strokeWidth: 1,
        });
      }
      applyTemplateToCurrentPage(lineElements);
    } else if (preset === 'borderFrame') {
      const frameElement: CanvasElement = {
        id: `frame-${Date.now()}`,
        type: 'shape',
        shapeType: 'rectangle',
        name: 'Page Border Frame',
        x: 40,
        y: 40,
        width: 496,
        height: 760,
        rotation: 0,
        zIndex: 1,
        opacity: 1,
        fillColor: 'transparent',
        strokeColor: '#1F2937',
        strokeWidth: 3,
        borderRadius: 4,
      };
      addElement(frameElement);
    } else if (preset === 'headerFooter') {
      const headerLine: CanvasElement = {
        id: `header-line-${Date.now()}`,
        type: 'line',
        name: 'Header Rule',
        x: 60,
        y: 80,
        width: 456,
        height: 1,
        rotation: 0,
        zIndex: 2,
        opacity: 1,
        strokeColor: '#E5E7EB',
        strokeWidth: 1,
      };
      const footerLine: CanvasElement = {
        id: `footer-line-${Date.now()}`,
        type: 'line',
        name: 'Footer Rule',
        x: 60,
        y: 770,
        width: 456,
        height: 1,
        rotation: 0,
        zIndex: 2,
        opacity: 1,
        strokeColor: '#E5E7EB',
        strokeWidth: 1,
      };
      addElement(headerLine);
      addElement(footerLine);
    }
  };

  return (
    <div className="w-64 sm:w-72 h-full border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-col z-20 select-none shrink-0">
      {/* TAB NAVIGATION HEADER */}
      <div className="flex items-center justify-between p-1.5 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/80 shrink-0 gap-1 overflow-x-auto no-scrollbar">
        {[
          { id: 'outline', icon: <BookOpen className="w-3.5 h-3.5" />, label: 'Outline' },
          { id: 'text', icon: <Type className="w-3.5 h-3.5" />, label: 'Text' },
          { id: 'shapes', icon: <Square className="w-3.5 h-3.5" />, label: 'Shapes' },
          { id: 'puzzles', icon: <Grid3X3 className="w-3.5 h-3.5" />, label: 'Puzzles' },
          { id: 'templates', icon: <LayoutTemplate className="w-3.5 h-3.5" />, label: 'Layouts' },
          { id: 'assets', icon: <ImageIcon className="w-3.5 h-3.5" />, label: 'Assets' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`py-1.5 px-1 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 transition-all flex-1 min-w-[42px] ${
              activeTab === tab.id
                ? 'bg-white dark:bg-neutral-800 text-amber-600 dark:text-amber-400 shadow-xs'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
            title={tab.label}
          >
            {tab.icon}
            <span className="text-[9px] font-medium">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ================= OUTLINE TAB ================= */}
      {activeTab === 'outline' && (
        <div className="flex-1 overflow-hidden">
          <EditorOutlinePanel
            onOpenSettings={onOpenSettings}
            onOpenValidation={onOpenValidation}
            onOpenBulkEdit={onOpenBulkEdit}
            onOpenStyles={onOpenStyles}
            onOpenPreview={onOpenPreview}
          />
        </div>
      )}

      {/* TAB BODY (Scrollable for Text, Shapes, Puzzles, Layouts, Assets) */}
      {activeTab !== 'outline' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* ================= TEXT TAB ================= */}
          {activeTab === 'text' && (
          <div className="space-y-2.5">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Typography Presets</h3>
            <button
              onClick={() => handleAddText('title')}
              className="w-full p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:border-amber-500/50 text-left transition-all group"
            >
              <div className="font-display font-bold text-base text-neutral-900 dark:text-white group-hover:text-amber-500">
                Chapter Title
              </div>
              <div className="text-[11px] text-neutral-500">Playfair Display 32pt Serif</div>
            </button>

            <button
              onClick={() => handleAddText('heading')}
              className="w-full p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:border-amber-500/50 text-left transition-all group"
            >
              <div className="font-display font-bold text-sm text-neutral-900 dark:text-white group-hover:text-amber-500">
                Section Heading
              </div>
              <div className="text-[11px] text-neutral-500">Outfit 20pt Modern Sans</div>
            </button>

            <button
              onClick={() => handleAddText('subheading')}
              className="w-full p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:border-amber-500/50 text-left transition-all group"
            >
              <div className="font-semibold text-xs text-neutral-800 dark:text-neutral-200 group-hover:text-amber-500">
                Subheading / Instructions
              </div>
              <div className="text-[11px] text-neutral-500">Plus Jakarta Sans 14pt Semibold</div>
            </button>

            <button
              onClick={() => handleAddText('body')}
              className="w-full p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:border-amber-500/50 text-left transition-all group"
            >
              <div className="text-xs font-normal text-neutral-700 dark:text-neutral-300 group-hover:text-amber-500">
                Paragraph Body Copy
              </div>
              <div className="text-[11px] text-neutral-500">14pt interior book narrative</div>
            </button>

            <button
              onClick={() => handleAddText('quote')}
              className="w-full p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:border-amber-500/50 text-left transition-all group"
            >
              <div className="text-xs italic font-serif text-neutral-800 dark:text-neutral-200 group-hover:text-amber-500">
                Callout Quote / Epigraph
              </div>
              <div className="text-[11px] text-neutral-500">Cinzel classic ornamental serif</div>
            </button>

            <button
              onClick={() => handleAddText('wordList')}
              className="w-full p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:border-amber-500/50 text-left transition-all group"
            >
              <div className="text-xs font-mono font-bold text-neutral-800 dark:text-neutral-200 group-hover:text-amber-500">
                Word Search Word Bank
              </div>
              <div className="text-[11px] text-neutral-500">Formatted horizontal keywords list</div>
            </button>

            <button
              onClick={() => handleAddText('pageNumber')}
              className="w-full p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:border-amber-500/50 text-left transition-all group"
            >
              <div className="text-xs font-mono font-bold text-neutral-800 dark:text-neutral-200 group-hover:text-amber-500">
                Page Number Placemarker
              </div>
              <div className="text-[11px] text-neutral-500">Centered bottom footer marker</div>
            </button>
          </div>
        )}

        {/* ================= SHAPES TAB ================= */}
        {activeTab === 'shapes' && (
          <div className="space-y-3">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Vector Shapes</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleAddShape('rectangle')}
                className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:border-amber-500 text-center flex flex-col items-center gap-1.5 transition-all"
              >
                <Square className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
                <span className="text-xs font-medium">Rectangle</span>
              </button>

              <button
                onClick={() => handleAddShape('circle')}
                className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:border-amber-500 text-center flex flex-col items-center gap-1.5 transition-all"
              >
                <Circle className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
                <span className="text-xs font-medium">Circle</span>
              </button>

              <button
                onClick={() => handleAddShape('triangle')}
                className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:border-amber-500 text-center flex flex-col items-center gap-1.5 transition-all"
              >
                <Triangle className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
                <span className="text-xs font-medium">Triangle</span>
              </button>

              <button
                onClick={() => handleAddShape('star')}
                className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:border-amber-500 text-center flex flex-col items-center gap-1.5 transition-all"
              >
                <Star className="w-5 h-5 text-amber-500" />
                <span className="text-xs font-medium">Star</span>
              </button>

              <button
                onClick={() => handleAddShape('heart')}
                className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:border-amber-500 text-center flex flex-col items-center gap-1.5 transition-all"
              >
                <Heart className="w-5 h-5 text-rose-500" />
                <span className="text-xs font-medium">Heart</span>
              </button>

              <button
                onClick={() => handleAddShape('line')}
                className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:border-amber-500 text-center flex flex-col items-center gap-1.5 transition-all"
              >
                <Minus className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
                <span className="text-xs font-medium">Rule Line</span>
              </button>
            </div>
          </div>
        )}

        {/* ================= PUZZLES TAB ================= */}
        {activeTab === 'puzzles' && (
          <div className="space-y-2.5">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">AI Puzzle Studio</h3>
            
            <button
              onClick={() => setIsAiWordModalOpen(true)}
              className="w-full p-3 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 hover:border-amber-500 hover:bg-amber-500/20 text-left transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-xs text-amber-700 dark:text-amber-300">
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>AI Word Search (Gemini)</span>
                </div>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500 text-neutral-950">
                  AUTO-PAGE
                </span>
              </div>
              <div className="text-[11px] text-neutral-600 dark:text-neutral-400 mt-1">
                Generate custom themed vocabulary & add page to manuscript
              </div>
            </button>

            <h3 className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 pt-2">Puzzle Generators</h3>
            <button
              onClick={() => handleAddPuzzle('word_search')}
              className="w-full p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:border-amber-500 text-left transition-all"
            >
              <div className="flex items-center gap-2 font-bold text-xs text-neutral-900 dark:text-white">
                <Grid3X3 className="w-4 h-4 text-amber-500" />
                <span>Word Search 15×15</span>
              </div>
              <div className="text-[11px] text-neutral-500 mt-1">
                Letters grid with themed word vocabulary bank
              </div>
            </button>

            <button
              onClick={() => handleAddPuzzle('sudoku')}
              className="w-full p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:border-amber-500 text-left transition-all"
            >
              <div className="flex items-center gap-2 font-bold text-xs text-neutral-900 dark:text-white">
                <Hash className="w-4 h-4 text-blue-500" />
                <span>Sudoku 9×9 Classic</span>
              </div>
              <div className="text-[11px] text-neutral-500 mt-1">
                Standard 3×3 subgrid layout with numbers
              </div>
            </button>

            <button
              onClick={() => handleAddPuzzle('maze')}
              className="w-full p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:border-amber-500 text-left transition-all"
            >
              <div className="flex items-center gap-2 font-bold text-xs text-neutral-900 dark:text-white">
                <Compass className="w-4 h-4 text-emerald-500" />
                <span>Pathfinding Maze</span>
              </div>
              <div className="text-[11px] text-neutral-500 mt-1">
                Algorithmic labyrinth with start & end markers
              </div>
            </button>

            <button
              onClick={() => handleAddPuzzle('crossword')}
              className="w-full p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:border-amber-500 text-left transition-all"
            >
              <div className="flex items-center gap-2 font-bold text-xs text-neutral-900 dark:text-white">
                <Table className="w-4 h-4 text-purple-500" />
                <span>Crossword Grid</span>
              </div>
              <div className="text-[11px] text-neutral-500 mt-1">
                Interlocking numbered clue squares
              </div>
            </button>
          </div>
        )}

        {/* ================= TEMPLATES PRESETS TAB ================= */}
        {activeTab === 'templates' && (
          <div className="space-y-2.5">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Page Presets & Rules</h3>
            <button
              onClick={() => handleApplyPreset('dotGrid')}
              className="w-full p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:border-amber-500 text-left transition-all"
            >
              <div className="font-bold text-xs text-neutral-900 dark:text-white">
                Dot Grid Matrix 5mm
              </div>
              <div className="text-[11px] text-neutral-500 mt-1">
                Evenly spaced bullet journal dot matrix
              </div>
            </button>

            <button
              onClick={() => handleApplyPreset('lined')}
              className="w-full p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:border-amber-500 text-left transition-all"
            >
              <div className="font-bold text-xs text-neutral-900 dark:text-white">
                Lined Journal Rules
              </div>
              <div className="text-[11px] text-neutral-500 mt-1">
                College-ruled horizontal writing lines
              </div>
            </button>

            <button
              onClick={() => handleApplyPreset('borderFrame')}
              className="w-full p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:border-amber-500 text-left transition-all"
            >
              <div className="font-bold text-xs text-neutral-900 dark:text-white">
                Decorative Outer Frame
              </div>
              <div className="text-[11px] text-neutral-500 mt-1">
                Border enclosing the safe margin boundary
              </div>
            </button>

            <button
              onClick={() => handleApplyPreset('headerFooter')}
              className="w-full p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:border-amber-500 text-left transition-all"
            >
              <div className="font-bold text-xs text-neutral-900 dark:text-white">
                Header & Footer Rules
              </div>
              <div className="text-[11px] text-neutral-500 mt-1">
                Top running header and bottom footer lines
              </div>
            </button>
          </div>
        )}

        {/* ================= ASSETS TAB ================= */}
        {activeTab === 'assets' && (
          <div className="space-y-4">
            {/* Custom Image URL Form */}
            <form onSubmit={handleAddCustomImage} className="space-y-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                Insert Image via URL
              </label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="https://example.com/image.png"
                  value={customImageUrl}
                  onChange={e => setCustomImageUrl(e.target.value)}
                  className="flex-1 p-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 outline-none"
                />
                <button
                  type="submit"
                  className="px-3 py-2 bg-amber-500 text-neutral-950 rounded-xl text-xs font-bold hover:bg-amber-400 transition-colors"
                >
                  Add
                </button>
              </div>
            </form>

            <div className="space-y-2">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Sample Graphics</h3>
              <div className="grid grid-cols-2 gap-2">
                {DEMO_ASSETS.map(asset => (
                  <div
                    key={asset.id}
                    onClick={() => handleAddAsset(asset.url, asset.name)}
                    className="p-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:border-amber-500 cursor-pointer group flex flex-col items-center text-center transition-all"
                  >
                    <img
                      src={asset.url}
                      alt={asset.name}
                      className="w-14 h-14 object-contain mb-1 group-hover:scale-105 transition-transform"
                    />
                    <span className="text-[10px] text-neutral-600 dark:text-neutral-300 truncate w-full">
                      {asset.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      )}

      {/* AI WORD SEARCH GENERATOR MODAL */}
      <AiWordGeneratorModal
        isOpen={isAiWordModalOpen}
        onClose={() => setIsAiWordModalOpen(false)}
        onApplyWords={(words, themeTitle) => {
          try {
            const generated = PuzzleRegistry.generate({
              puzzleType: 'word_search',
              gridSize: 15,
              theme: themeTitle,
              title: `${themeTitle.toUpperCase()} WORD SEARCH`,
              customWords: words,
              wordCount: words.length,
              difficulty: 'Medium',
              seed: Math.floor(Math.random() * 900000) + 1000,
            });

            if (generated) {
              insertPuzzleWithSolution(generated, { autoAnswerKey: true });
            }
          } catch (err: any) {
            console.error('Failed to generate AI Word Search page:', err);
            showToast({
              type: 'error',
              title: 'Generation Error',
              message: err.message || 'Could not generate Word Search page.',
            });
          }
        }}
        onAddToBook={(words, themeTitle) => {
          try {
            const generated = PuzzleRegistry.generate({
              puzzleType: 'word_search',
              gridSize: 15,
              theme: themeTitle,
              title: `${themeTitle.toUpperCase()} WORD SEARCH`,
              customWords: words,
              wordCount: words.length,
              difficulty: 'Medium',
              seed: Math.floor(Math.random() * 900000) + 1000,
            });

            if (generated) {
              insertPuzzleWithSolution(generated, { autoAnswerKey: true });
            }
          } catch (err: any) {
            console.error('Failed to generate AI Word Search page:', err);
            showToast({
              type: 'error',
              title: 'Generation Error',
              message: err.message || 'Could not generate Word Search page.',
            });
          }
        }}
        initialTopic="Rainforest Wildlife"
      />
    </div>
  );
};

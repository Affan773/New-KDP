import React, { useState, useMemo, useRef } from 'react';
import {
  Grid3X3,
  Hash,
  Compass,
  Table,
  Lock,
  Type,
  Binary,
  Layers,
  Sparkles,
  RefreshCw,
  PlusCircle,
  ArrowRight,
  Sliders,
  CheckCircle2,
  BookOpen,
  Eye,
  Settings2,
  FileCheck,
  Zap,
  ListOrdered,
  X,
  Loader2,
  Copy,
  Plus,
  Palette,
} from 'lucide-react';
import { PUZZLE_TYPES } from '../../constants/puzzles';
import { useApp } from '../../context/AppContext';
import { useEditor } from '../../context/EditorContext';
import {
  PuzzleType,
  PuzzleDifficulty,
  GeneratedPuzzle,
  PuzzleStyleOptions,
  AnyPuzzleSettings,
  WordSearchSettings,
  SudokuSettings,
  CrosswordSettings,
  MazeSettings,
  CryptogramSettings,
  WordScrambleSettings,
  NumberPuzzleSettings,
  LogicGridSettings,
} from '../../puzzles/types';
import { PuzzleRegistry } from '../../puzzles/core/PuzzleRegistry';
import {
  PuzzleRenderer,
  DEFAULT_PUZZLE_STYLE,
  VISUAL_PRESETS,
} from '../../puzzles/renderers/PuzzleRenderer';
import {
  BatchGenerationService,
  BatchGenerationProgress,
} from '../../puzzles/services/BatchGenerationService';
import { PuzzleBookBuilder } from '../../puzzles/services/PuzzleBookBuilder';
import { STANDARD_TRIM_SIZES } from '../../constants/kdp';
import { CommonDesignPanel } from './CommonDesignPanel';
import { WordSearchConfig } from './config/WordSearchConfig';
import { SudokuConfig } from './config/SudokuConfig';
import { CrosswordConfig } from './config/CrosswordConfig';
import { MazeConfig } from './config/MazeConfig';
import { CryptogramConfig } from './config/CryptogramConfig';
import { WordScrambleConfig } from './config/WordScrambleConfig';
import { NumberPuzzleConfig } from './config/NumberPuzzleConfig';
import { LogicPuzzleConfig } from './config/LogicPuzzleConfig';

export const PuzzlesView: React.FC = () => {
  const {
    activeProject,
    openProjectInEditor,
    createProject,
    showToast,
    setCurrentRoute,
  } = useApp();

  const { addPage, selectPage, document, insertPuzzleWithSolution } = useEditor();

  // Active puzzle type
  const [selectedType, setSelectedType] = useState<PuzzleType>('word_search');

  // Active configuration tab: 'rules' | 'styling' | 'batch'
  const [activeTab, setActiveTab] = useState<'rules' | 'styling' | 'batch'>('rules');

  // Common seed & solution preview
  const [seed, setSeed] = useState<number>(101);
  const [showSolutionPreview, setShowSolutionPreview] = useState<boolean>(false);

  // Universal visual style options
  const [styleOptions, setStyleOptions] = useState<PuzzleStyleOptions>({
    ...DEFAULT_PUZZLE_STYLE,
  });

  // Type-specific settings state
  const [wsSettings, setWsSettings] = useState<WordSearchSettings>({
    puzzleType: 'word_search',
    rows: 15,
    cols: 15,
    difficulty: 'Medium',
    theme: 'animals',
    wordCount: 14,
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
    allowOverlaps: true,
    wordListPosition: 'bottom',
    wordListColumns: 3,
    solutionMode: 'highlight',
  });

  const [sudokuSettings, setSudokuSettings] = useState<SudokuSettings>({
    puzzleType: 'sudoku',
    size: 9,
    difficulty: 'Medium',
    clueDensity: 38,
    symmetryPreference: 'rotational',
    numberStyle: 'standard',
  });

  const [crosswordSettings, setCrosswordSettings] = useState<CrosswordSettings>({
    puzzleType: 'crossword',
    size: 13,
    difficulty: 'Medium',
    theme: 'general',
    clueLayout: 'split',
  });

  const [mazeSettings, setMazeSettings] = useState<MazeSettings>({
    puzzleType: 'maze',
    width: 21,
    height: 21,
    difficulty: 'Medium',
    algorithm: 'dfs',
    startPosition: 'top_left',
    endPosition: 'bottom_right',
  });

  const [cryptogramSettings, setCryptogramSettings] = useState<CryptogramSettings>({
    puzzleType: 'cryptogram',
    difficulty: 'Medium',
    cipherType: 'random_substitution',
    hintsProvided: 2,
    showAuthor: true,
    preservePunctuation: true,
  });

  const [wordScrambleSettings, setWordScrambleSettings] = useState<WordScrambleSettings>({
    puzzleType: 'word_scramble',
    theme: 'nature',
    difficulty: 'Medium',
    wordCount: 10,
    scrambleStyle: 'random',
    showWordBank: true,
  });

  const [numberPuzzleSettings, setNumberPuzzleSettings] = useState<NumberPuzzleSettings>({
    puzzleType: 'number_puzzle',
    subType: 'sequence',
    difficulty: 'Medium',
    itemCount: 8,
    maxNumber: 100,
    allowNegatives: false,
  });

  const [logicGridSettings, setLogicGridSettings] = useState<LogicGridSettings>({
    puzzleType: 'logic_grid',
    difficulty: 'Medium',
    categoryCount: 3,
    itemsPerCategory: 3,
    theme: 'houses',
  });

  // Batch Book Modal State
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [batchBookName, setBatchBookName] = useState('Ultimate Activity & Brain Games');
  const [batchCount, setBatchCount] = useState<number>(20);
  const [batchLayout, setBatchLayout] = useState<1 | 2 | 4>(1);
  const [batchAnswerKey, setBatchAnswerKey] = useState<'end_of_book' | 'after_each_puzzle' | 'none'>('end_of_book');
  const [batchTrimSize, setBatchTrimSize] = useState(STANDARD_TRIM_SIZES[1]); // 8.5x11
  const [isGeneratingBatch, setIsGeneratingBatch] = useState(false);
  const [batchProgress, setBatchProgress] = useState<BatchGenerationProgress | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Active current settings
  const currentSettings = useMemo<AnyPuzzleSettings>(() => {
    switch (selectedType) {
      case 'word_search':
        return { ...wsSettings, seed };
      case 'sudoku':
        return { ...sudokuSettings, seed };
      case 'crossword':
        return { ...crosswordSettings, seed };
      case 'maze':
        return { ...mazeSettings, seed };
      case 'cryptogram':
        return { ...cryptogramSettings, seed };
      case 'word_scramble':
        return { ...wordScrambleSettings, seed };
      case 'number_puzzle':
        return { ...numberPuzzleSettings, seed };
      case 'logic_grid':
        return { ...logicGridSettings, seed };
      default:
        return { puzzleType: 'word_search', seed };
    }
  }, [
    selectedType,
    seed,
    wsSettings,
    sudokuSettings,
    crosswordSettings,
    mazeSettings,
    cryptogramSettings,
    wordScrambleSettings,
    numberPuzzleSettings,
    logicGridSettings,
  ]);

  // Generate live preview puzzle
  const livePuzzle = useMemo<GeneratedPuzzle | null>(() => {
    try {
      return PuzzleRegistry.generate(currentSettings);
    } catch (err) {
      console.error('Puzzle generation error:', err);
      return null;
    }
  }, [currentSettings]);

  // Validation
  const validation = useMemo(() => {
    if (!livePuzzle) return { valid: false, errors: ['Failed to compile puzzle.'], warnings: [] };
    return PuzzleRegistry.validate(livePuzzle);
  }, [livePuzzle]);

  const handleRegenerateSeed = () => {
    const nextSeed = Math.floor(Math.random() * 90000) + 100;
    setSeed(nextSeed);
    showToast({
      type: 'info',
      title: 'New Seed Seeded',
      message: `Generated deterministic variation #${nextSeed}`,
    });
  };

  const handleInsertIntoCurrentProject = () => {
    if (!livePuzzle) return;

    if (!activeProject || !document) {
      // Create new project if none is active
      const { project, document: newDoc } = PuzzleBookBuilder.buildProject({
        name: `${livePuzzle.title || 'Puzzle'} Book`,
        puzzles: [livePuzzle],
        puzzlesPerPage: 1,
        answerKeyMode: 'end_of_book',
      });
      createProject(project, newDoc);
      openProjectInEditor(project.id);
      showToast({
        type: 'success',
        title: 'New Project Created',
        message: `Created new project with ${livePuzzle.title || 'puzzle'} and dedicated solution page.`,
      });
      return;
    }

    insertPuzzleWithSolution(livePuzzle, {
      styleOptions,
      autoAnswerKey: true,
    });
    setCurrentRoute('editor');
  };

  const handleAddAiWordSearchToBook = (words: string[], themeTitle: string) => {
    try {
      const generated = PuzzleRegistry.generate({
        ...wsSettings,
        puzzleType: 'word_search',
        theme: themeTitle,
        title: `${themeTitle.toUpperCase()} WORD SEARCH`,
        customWords: words,
        wordCount: words.length,
        seed: Math.floor(Math.random() * 900000) + 1000,
      });

      if (!generated) return;

      if (!activeProject || !document) {
        const { project, document: newDoc } = PuzzleBookBuilder.buildProject({
          name: `${themeTitle} Word Search Book`,
          puzzles: [generated],
          puzzlesPerPage: 1,
          answerKeyMode: 'end_of_book',
        });
        createProject(project, newDoc);
        openProjectInEditor(project.id);
        showToast({
          type: 'success',
          title: 'Word Search Book Created',
          message: `Created book project with "${themeTitle}" Word Search page and dedicated solution key.`,
        });
        return;
      }

      insertPuzzleWithSolution(generated, {
        styleOptions,
        autoAnswerKey: true,
      });
      setCurrentRoute('editor');
    } catch (err: any) {
      console.error('Error creating AI Word Search page:', err);
      showToast({
        type: 'error',
        title: 'Insertion Failed',
        message: err.message || 'Could not insert Word Search page.',
      });
    }
  };

  const handleStartBatchBookBuild = async () => {
    setIsGeneratingBatch(true);
    setBatchProgress({
      current: 0,
      total: batchCount,
      percent: 0,
      statusText: 'Initializing generator...',
    });

    const abortCtrl = new AbortController();
    abortControllerRef.current = abortCtrl;

    try {
      const generatedPuzzles = await BatchGenerationService.generateBatch({
        count: batchCount,
        baseSettings: currentSettings,
        startSeed: seed,
        signal: abortCtrl.signal,
        onProgress: progress => {
          setBatchProgress(progress);
        },
      });

      const { project, document: newDoc } = PuzzleBookBuilder.buildProject({
        name: batchBookName || `${livePuzzle?.title || 'Puzzle'} Book`,
        puzzles: generatedPuzzles,
        puzzlesPerPage: batchLayout,
        answerKeyMode: batchAnswerKey,
        trimSize: batchTrimSize,
      });

      createProject(project, newDoc);
      setIsBatchModalOpen(false);
      openProjectInEditor(project.id);

      showToast({
        type: 'success',
        title: 'Puzzle Book Created',
        message: `Compiled ${generatedPuzzles.length} puzzles into a ${project.pageCount}-page KDP document.`,
      });
    } catch (err: any) {
      if (err.message !== 'Batch generation was cancelled') {
        showToast({
          type: 'error',
          title: 'Batch Generation Failed',
          message: err.message || 'An unexpected error occurred during batch compiling.',
        });
      }
    } finally {
      setIsGeneratingBatch(false);
      setBatchProgress(null);
      abortControllerRef.current = null;
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 select-none">
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white font-display">
              Advanced Puzzle Studio & Engine
            </h1>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              V2.5 Pro
            </span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Algorithmic, deterministic puzzle generation with print-ready vector typography for Amazon KDP books.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsBatchModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition-all shadow-md shadow-amber-500/20 active:scale-95 flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Generate Multi-Page Book</span>
          </button>
        </div>
      </div>

      {/* 8 PUZZLE TYPES SELECTOR */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
        {PUZZLE_TYPES.map(cat => {
          const isSelected = cat.id === selectedType;
          return (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedType(cat.id as PuzzleType);
                setShowSolutionPreview(false);
              }}
              className={`p-3 rounded-2xl border text-center flex flex-col items-center gap-2 transition-all ${
                isSelected
                  ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 shadow-xs ring-1 ring-amber-500/30'
                  : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-700'
              }`}
            >
              <div className="p-2 rounded-xl bg-neutral-50 dark:bg-neutral-800">
                {cat.id === 'word_search' && <Grid3X3 className="w-5 h-5 text-amber-500" />}
                {cat.id === 'sudoku' && <Hash className="w-5 h-5 text-blue-500" />}
                {cat.id === 'crossword' && <Table className="w-5 h-5 text-purple-500" />}
                {cat.id === 'maze' && <Compass className="w-5 h-5 text-emerald-500" />}
                {cat.id === 'cryptogram' && <Lock className="w-5 h-5 text-rose-500" />}
                {cat.id === 'word_scramble' && <Type className="w-5 h-5 text-indigo-500" />}
                {cat.id === 'number_puzzle' && <Binary className="w-5 h-5 text-cyan-500" />}
                {cat.id === 'logic_grid' && <Layers className="w-5 h-5 text-orange-500" />}
              </div>
              <span className="text-[11px] font-bold truncate w-full">{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* MAIN WORKSPACE: SIMULATOR (LEFT) & CONFIGURATION PANEL (RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT 7 COLUMNS: LIVE PUZZLE RENDERER SIMULATOR */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-5">
            {/* SIMULATOR TOOLBAR */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl">
                  <button
                    onClick={() => setShowSolutionPreview(false)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      !showSolutionPreview
                        ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                        : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    Puzzle View
                  </button>
                  <button
                    onClick={() => setShowSolutionPreview(true)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      showSolutionPreview
                        ? 'bg-amber-500 text-neutral-950 shadow-xs'
                        : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    Solution Key
                  </button>
                </div>

                <div className="text-xs text-neutral-500">
                  Seed: <span className="font-mono font-bold text-neutral-700 dark:text-neutral-300">#{seed}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleRegenerateSeed}
                  className="px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Regenerate Variation</span>
                </button>
              </div>
            </div>

            {/* LIVE VECTOR PUZZLE CANVAS CONTAINER */}
            <div className="p-4 sm:p-6 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center min-h-[480px]">
              {livePuzzle ? (
                <div
                  style={{
                    backgroundColor: styleOptions.backgroundColor || '#FFFFFF',
                    borderColor: styleOptions.borderColor || '#E5E7EB',
                  }}
                  className="w-full max-w-lg rounded-2xl shadow-xl border p-2 overflow-hidden"
                >
                  <PuzzleRenderer
                    puzzle={livePuzzle}
                    styleOptions={styleOptions}
                    showSolutionOverride={showSolutionPreview}
                  />
                </div>
              ) : (
                <div className="text-center py-12 text-neutral-400">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-amber-500" />
                  <p className="text-xs">Compiling deterministic puzzle algorithms...</p>
                </div>
              )}
            </div>

            {/* ACTION & TELEMETRY FOOTER */}
            <div className="flex flex-wrap items-center justify-between pt-2 gap-3">
              <div className="flex items-center gap-3 text-xs text-neutral-500">
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  {validation.valid ? 'Deterministic Verified' : 'Validation Warning'}
                </span>
                {livePuzzle?.metadata?.generationTimeMs !== undefined && (
                  <span className="text-[11px] font-mono text-neutral-400">
                    {livePuzzle.metadata.generationTimeMs}ms
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleInsertIntoCurrentProject}
                  className="px-4 py-2 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-bold hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-all flex items-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Insert to Document</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT 5 COLUMNS: PROFESSIONAL SETTINGS TABS & CONTROLS */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-5">
            {/* TABS HEADER */}
            <div className="flex items-center bg-neutral-100 dark:bg-neutral-800/80 p-1 rounded-2xl">
              <button
                onClick={() => setActiveTab('rules')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'rules'
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Rules & Content</span>
              </button>

              <button
                onClick={() => setActiveTab('styling')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'styling'
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                <span>Visual Styling</span>
              </button>
            </div>

            {/* TAB CONTENT: RULES & CONTENT */}
            {activeTab === 'rules' && (
              <div className="space-y-4">
                {selectedType === 'word_search' && (
                  <WordSearchConfig
                    settings={wsSettings}
                    onChange={updates => setWsSettings(prev => ({ ...prev, ...updates }))}
                    onAddToBook={handleAddAiWordSearchToBook}
                    metadata={livePuzzle?.metadata}
                  />
                )}

                {selectedType === 'sudoku' && (
                  <SudokuConfig
                    settings={sudokuSettings}
                    onChange={updates => setSudokuSettings(prev => ({ ...prev, ...updates }))}
                    metadata={livePuzzle?.metadata}
                  />
                )}

                {selectedType === 'crossword' && (
                  <CrosswordConfig
                    settings={crosswordSettings}
                    onChange={updates => setCrosswordSettings(prev => ({ ...prev, ...updates }))}
                    metadata={livePuzzle?.metadata}
                  />
                )}

                {selectedType === 'maze' && (
                  <MazeConfig
                    settings={mazeSettings}
                    onChange={updates => setMazeSettings(prev => ({ ...prev, ...updates }))}
                    metadata={livePuzzle?.metadata}
                  />
                )}

                {selectedType === 'cryptogram' && (
                  <CryptogramConfig
                    settings={cryptogramSettings}
                    onChange={updates => setCryptogramSettings(prev => ({ ...prev, ...updates }))}
                    metadata={livePuzzle?.metadata}
                  />
                )}

                {selectedType === 'word_scramble' && (
                  <WordScrambleConfig
                    settings={wordScrambleSettings}
                    onChange={updates => setWordScrambleSettings(prev => ({ ...prev, ...updates }))}
                    metadata={livePuzzle?.metadata}
                  />
                )}

                {selectedType === 'number_puzzle' && (
                  <NumberPuzzleConfig
                    settings={numberPuzzleSettings}
                    onChange={updates => setNumberPuzzleSettings(prev => ({ ...prev, ...updates }))}
                    metadata={livePuzzle?.metadata}
                  />
                )}

                {selectedType === 'logic_grid' && (
                  <LogicPuzzleConfig
                    settings={logicGridSettings}
                    onChange={updates => setLogicGridSettings(prev => ({ ...prev, ...updates }))}
                    metadata={livePuzzle?.metadata}
                  />
                )}
              </div>
            )}

            {/* TAB CONTENT: VISUAL STYLING */}
            {activeTab === 'styling' && (
              <CommonDesignPanel
                styleOptions={styleOptions}
                onChange={updates => setStyleOptions(prev => ({ ...prev, ...updates }))}
              />
            )}
          </div>
        </div>
      </div>

      {/* BATCH BOOK BUILDER MODAL */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl w-full max-w-xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                    Multi-Page KDP Book Builder
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Compile high-volume activity books with structured answer keys.
                  </p>
                </div>
              </div>

              {!isGeneratingBatch && (
                <button
                  onClick={() => setIsBatchModalOpen(false)}
                  className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {isGeneratingBatch && batchProgress ? (
              <div className="py-8 space-y-4 text-center">
                <Loader2 className="w-10 h-10 animate-spin text-amber-500 mx-auto" />
                <div>
                  <h4 className="text-sm font-bold text-neutral-900 dark:text-white">
                    {batchProgress.statusText}
                  </h4>
                  <p className="text-xs text-neutral-500 mt-1">
                    Generating puzzle {batchProgress.current} of {batchProgress.total} (
                    {batchProgress.percent}%)
                  </p>
                </div>
                <div className="w-full h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${batchProgress.percent}%` }}
                    className="h-full bg-amber-500 transition-all duration-200"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-neutral-400 mb-1">
                    Book Title
                  </label>
                  <input
                    type="text"
                    value={batchBookName}
                    onChange={e => setBatchBookName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold uppercase tracking-wider text-neutral-400 mb-1">
                      Puzzle Count
                    </label>
                    <input
                      type="number"
                      min={2}
                      max={100}
                      value={batchCount}
                      onChange={e => setBatchCount(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold uppercase tracking-wider text-neutral-400 mb-1">
                      Puzzles Per Page
                    </label>
                    <select
                      value={batchLayout}
                      onChange={e => setBatchLayout(Number(e.target.value) as any)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value={1}>1 Puzzle Per Page (Full Page)</option>
                      <option value={2}>2 Puzzles Per Page (Split)</option>
                      <option value={4}>4 Puzzles Per Page (Quad)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold uppercase tracking-wider text-neutral-400 mb-1">
                    Solutions & Answer Keys
                  </label>
                  <select
                    value={batchAnswerKey}
                    onChange={e => setBatchAnswerKey(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="end_of_book">Solutions at End of Book (Standard KDP)</option>
                    <option value="after_each_puzzle">Solution directly after each puzzle</option>
                    <option value="none">No answer keys</option>
                  </select>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-neutral-100 dark:border-neutral-800">
                  <button
                    onClick={() => setIsBatchModalOpen(false)}
                    className="px-4 py-2 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleStartBatchBookBuild}
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold shadow-md shadow-amber-500/20 flex items-center gap-2"
                  >
                    <Zap className="w-4 h-4" />
                    <span>Generate & Open Manuscript</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

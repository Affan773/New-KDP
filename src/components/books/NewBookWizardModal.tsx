import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Grid3X3,
  Palette,
  Calendar,
  Layers,
  Sparkles,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  FileText,
  ShieldCheck,
  Zap,
  Bookmark,
  RefreshCw,
  Hash,
  LayoutGrid,
  HelpCircle,
  Copy,
} from 'lucide-react';
import {
  calculateKdpCoverDimensions,
  calculateKdpInsideMargin,
  calculateKdpSpineWidth,
  DEFAULT_MARGINS,
  STANDARD_TRIM_SIZES,
} from '../../constants/kdp';
import { BUILTIN_BOOK_THEMES, DEFAULT_BOOK_THEME } from '../../constants/bookThemes';
import { useApp } from '../../context/AppContext';
import {
  BookGenerationService,
  BookGenerationRequest,
  GenerationProgressEvent,
} from '../../services/bookGenerationService';
import { BookValidationService, ValidationReport } from '../../services/bookValidationService';
import {
  AnswerKeySettings,
  BookMetadata,
  BookSection,
  BookTheme,
  FrontMatterConfig,
  HeaderFooterSettings,
  PageNumberingSettings,
  PuzzleBatchItemConfig,
} from '../../types/book';
import { BleedType, Orientation, Project, ProjectType, TrimSize } from '../../types/project';
import { PuzzleDifficulty, PuzzleType } from '../../puzzles/types';

export const NewBookWizardModal: React.FC = () => {
  const { isNewBookWizardOpen, setIsNewBookWizardOpen, createProject, setCurrentRoute } = useApp();

  // Wizard Step (1 to 10)
  const [step, setStep] = useState<number>(1);
  const totalSteps = 10;

  // STEP 1: Book Type
  const [bookArchetype, setBookArchetype] = useState<string>('mixed_puzzle');
  const [projectType, setProjectType] = useState<ProjectType>('Puzzle Book');

  // STEP 2: Book Metadata
  const [metadata, setMetadata] = useState<BookMetadata>({
    title: 'Ultimate Brain Games & Puzzle Book',
    subtitle: 'Over 80 Fun Puzzles with Solutions for Adults and Teens',
    author: 'KDP Studio Creator',
    publisher: 'Independent Publishing',
    description: 'A captivating variety collection of word search, sudoku, mazes, and crosswords formatted for Amazon KDP.',
    language: 'English',
    category: 'Activity & Puzzle Books',
    keywords: ['puzzle book', 'word search', 'sudoku', 'brain teasers', 'amazon kdp'],
    edition: 'First Edition',
    seriesName: 'Mind Sharpeners Collection',
    volumeNumber: '1',
    copyrightYear: new Date().getFullYear().toString(),
  });

  // STEP 3: Trim & Print Settings
  const [trimSize, setTrimSize] = useState<TrimSize>(
    STANDARD_TRIM_SIZES.find(t => t.id === '8.5x11') || STANDARD_TRIM_SIZES[0]
  );
  const [orientation, setOrientation] = useState<Orientation>('Portrait');
  const [paperType, setPaperType] = useState<'White' | 'Cream' | 'Premium Color' | 'Standard Color'>('White');
  const [bleed, setBleed] = useState<BleedType>('No Bleed');

  // STEP 4: Sections / Chapters
  const [sections, setSections] = useState<BookSection[]>([
    {
      id: 'sec-1',
      title: 'Warm-Up: Word Searches',
      order: 0,
      puzzleType: 'word_search',
      pageIds: [],
    },
    {
      id: 'sec-2',
      title: 'Challenge: Sudoku Master',
      order: 1,
      puzzleType: 'sudoku',
      pageIds: [],
    },
    {
      id: 'sec-3',
      title: 'Labyrinths: Maze Quest',
      order: 2,
      puzzleType: 'maze',
      pageIds: [],
    },
  ]);

  // STEP 5: Puzzle Batch Configuration
  const [puzzleBatches, setPuzzleBatches] = useState<PuzzleBatchItemConfig[]>([
    {
      id: 'batch-1',
      puzzleType: 'word_search',
      count: 12,
      difficulty: 'Medium',
      theme: 'World Capitals',
      gridWidth: 15,
      gridHeight: 15,
      sectionTitle: 'Word Search Challenge',
    },
    {
      id: 'batch-2',
      puzzleType: 'sudoku',
      count: 12,
      difficulty: 'Medium',
      sectionTitle: 'Classic Sudoku',
    },
    {
      id: 'batch-3',
      puzzleType: 'maze',
      count: 12,
      difficulty: 'Medium',
      gridWidth: 21,
      gridHeight: 21,
      sectionTitle: 'Maze Adventure',
    },
    {
      id: 'batch-4',
      puzzleType: 'cryptogram',
      count: 8,
      difficulty: 'Easy',
      theme: 'Inspirational Wisdom',
      sectionTitle: 'Secret Cipher Quotes',
    },
  ]);

  // STEP 6: Layout & Theme
  const [puzzlesPerPage, setPuzzlesPerPage] = useState<1 | 2 | 4>(1);
  const [selectedTheme, setSelectedTheme] = useState<BookTheme>(DEFAULT_BOOK_THEME);

  // STEP 7: Front Matter
  const [frontMatter, setFrontMatter] = useState<FrontMatterConfig>({
    includeTitlePage: true,
    includeCopyrightPage: true,
    includeDisclaimerPage: false,
    includeInstructionsPage: true,
    includeIntroPage: false,
    includeTableOfContents: true,
    copyrightText: '',
    instructionsText: '',
  });

  // STEP 8: Answer Key
  const [answerKey, setAnswerKey] = useState<AnswerKeySettings>({
    mode: 'end_of_book',
    puzzlesPerPage: 4,
    includeTitle: true,
    sectionLabels: true,
    startOnNewPage: true,
  });

  // Header & Footer Settings
  const [headerFooter, setHeaderFooter] = useState<HeaderFooterSettings>({
    showHeader: true,
    showFooter: true,
    headerLeft: 'none',
    headerCenter: 'section_title',
    headerRight: 'none',
    footerLeft: 'none',
    footerCenter: 'page_number',
    footerRight: 'none',
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 9,
    color: '#6B7280',
    marginFromEdge: 0.35,
    suppressOnFrontMatter: true,
    suppressOnBlankPages: true,
    separatorLine: false,
  });

  // Numbering Settings
  const [numbering, setNumbering] = useState<PageNumberingSettings>({
    enabled: true,
    startPageNumber: 1,
    startPageIndex: 4,
    frontMatterStyle: 'roman_lower',
    bodyStyle: 'arabic',
    position: 'bottom-center',
    fontSize: 10,
    fontFamily: 'Outfit',
    hideOnFrontMatter: true,
  });

  // STEP 10: Generation State
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationProgress, setGenerationProgress] = useState<GenerationProgressEvent>({
    percent: 0,
    stage: '',
  });
  const abortControllerRef = useRef<AbortController | null>(null);

  if (!isNewBookWizardOpen) return null;

  // Real-time calculations
  const totalPuzzlesCount = puzzleBatches.reduce((acc, b) => acc + b.count, 0);
  const estimatedPuzzlePages = Math.ceil(totalPuzzlesCount / puzzlesPerPage);
  const estimatedFrontPages =
    (frontMatter.includeTitlePage ? 1 : 0) +
    (frontMatter.includeCopyrightPage ? 1 : 0) +
    (frontMatter.includeInstructionsPage ? 1 : 0) +
    (frontMatter.includeIntroPage ? 1 : 0) +
    (frontMatter.includeTableOfContents ? 1 : 0) +
    (frontMatter.includeDisclaimerPage ? 1 : 0);
  const hasWordSearchPuzzles = puzzleBatches.some(b => b.puzzleType === 'word_search');
  const estimatedSolutionPages =
    answerKey.mode === 'none'
      ? 0
      : hasWordSearchPuzzles || puzzlesPerPage === 1
      ? totalPuzzlesCount
      : answerKey.mode === 'end_of_book' || answerKey.mode === 'four_up'
      ? Math.ceil(totalPuzzlesCount / (answerKey.mode === 'four_up' ? 4 : (answerKey.puzzlesPerPage || 4)))
      : totalPuzzlesCount;
  const estimatedTotalPages = Math.max(24, estimatedFrontPages + estimatedPuzzlePages + estimatedSolutionPages);

  const recommendedGutter = calculateKdpInsideMargin(estimatedTotalPages);
  const spineWidth = calculateKdpSpineWidth(estimatedTotalPages, paperType);
  const coverDims = calculateKdpCoverDimensions(trimSize.width, trimSize.height, spineWidth);

  // Pre-flight Report for Step 9
  const dummyProject: Project = {
    id: 'val-check',
    name: metadata.title,
    type: projectType,
    description: metadata.description || '',
    pageCount: estimatedTotalPages,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'Draft',
    ownerId: 'temp',
    isFavorite: false,
    documentId: 'temp',
    sections,
    kdpSettings: {
      trimSize,
      orientation,
      pageCount: estimatedTotalPages,
      margins: { top: 0.5, bottom: 0.5, left: 0.75, right: 0.5 },
      bleed,
      paperType,
      spineWidthInches: spineWidth,
      coverWidthInches: coverDims.width,
      coverHeightInches: coverDims.height,
    },
    metadata: {
      author: metadata.author,
      publisher: metadata.publisher,
      keywords: metadata.keywords,
      category: metadata.category,
    },
  };

  const validationReport: ValidationReport = BookValidationService.validateBook(dummyProject);

  // Step 1 Archetype Preset selector
  const handleSelectArchetype = (archId: string) => {
    setBookArchetype(archId);
    if (archId === 'mixed_puzzle') {
      setProjectType('Puzzle Book');
      setTrimSize(STANDARD_TRIM_SIZES.find(t => t.id === '8.5x11') || STANDARD_TRIM_SIZES[0]);
      setPuzzleBatches([
        { id: 'b1', puzzleType: 'word_search', count: 15, difficulty: 'Medium', theme: 'Animals & Nature', sectionTitle: 'Word Searches' },
        { id: 'b2', puzzleType: 'sudoku', count: 15, difficulty: 'Medium', sectionTitle: 'Sudoku' },
        { id: 'b3', puzzleType: 'maze', count: 10, difficulty: 'Medium', sectionTitle: 'Mazes' },
        { id: 'b4', puzzleType: 'cryptogram', count: 10, difficulty: 'Easy', sectionTitle: 'Cryptograms' },
      ]);
    } else if (archId === 'word_search_master') {
      setProjectType('Puzzle Book');
      setMetadata(prev => ({
        ...prev,
        title: 'The Great Large Print Word Search Book',
        subtitle: '100 Themed Puzzles with Full Solutions',
      }));
      setTrimSize(STANDARD_TRIM_SIZES.find(t => t.id === '8.5x11') || STANDARD_TRIM_SIZES[0]);
      setPuzzleBatches([
        { id: 'b1', puzzleType: 'word_search', count: 25, difficulty: 'Easy', theme: 'Geography & Travel', sectionTitle: 'Around The World' },
        { id: 'b2', puzzleType: 'word_search', count: 25, difficulty: 'Medium', theme: 'Science & Cosmos', sectionTitle: 'Science & Cosmos' },
        { id: 'b3', puzzleType: 'word_search', count: 25, difficulty: 'Hard', theme: 'Classic Literature', sectionTitle: 'Classic Literature' },
      ]);
    } else if (archId === 'sudoku_challenge') {
      setProjectType('Puzzle Book');
      setMetadata(prev => ({
        ...prev,
        title: 'Master Sudoku Challenge',
        subtitle: 'From Easy to Expert: 100 Handcrafted Logic Grids',
      }));
      setTrimSize(STANDARD_TRIM_SIZES.find(t => t.id === '6x9') || STANDARD_TRIM_SIZES[0]);
      setPuzzleBatches([
        { id: 'b1', puzzleType: 'sudoku', count: 20, difficulty: 'Easy', sectionTitle: 'Easy Warm-Up' },
        { id: 'b2', puzzleType: 'sudoku', count: 30, difficulty: 'Medium', sectionTitle: 'Medium Challenge' },
        { id: 'b3', puzzleType: 'sudoku', count: 30, difficulty: 'Hard', sectionTitle: 'Hard Mastery' },
      ]);
    } else if (archId === 'kids_activity') {
      setProjectType('Activity Book');
      setMetadata(prev => ({
        ...prev,
        title: 'Fun Activity & Brain Games for Kids',
        subtitle: 'Word Scrambles, Mazes, Number Puzzles & More!',
      }));
      setSelectedTheme(BUILTIN_BOOK_THEMES.find(t => t.id === 'theme-kids-activity') || DEFAULT_BOOK_THEME);
      setPuzzleBatches([
        { id: 'b1', puzzleType: 'word_scramble', count: 12, difficulty: 'Easy', theme: 'Animals', sectionTitle: 'Word Scramble Fun' },
        { id: 'b2', puzzleType: 'maze', count: 15, difficulty: 'Easy', sectionTitle: 'Animal Mazes' },
        { id: 'b3', puzzleType: 'number_puzzle', count: 12, difficulty: 'Easy', sectionTitle: 'Number Quests' },
      ]);
    }
  };

  // Execution: Bulk Generation
  const handleStartGeneration = async () => {
    setIsGenerating(true);
    abortControllerRef.current = new AbortController();

    const request: BookGenerationRequest = {
      metadata,
      trimSize,
      bleed,
      paperType,
      sections,
      puzzleBatches,
      theme: selectedTheme,
      frontMatter,
      answerKey,
      headerFooter,
      numbering,
      puzzlesPerPage,
    };

    try {
      const result = await BookGenerationService.generateBook(
        request,
        progress => {
          setGenerationProgress(progress);
        },
        abortControllerRef.current.signal
      );

      // Save to App Context & Local Storage
      createProject(result.project, result.document);

      setTimeout(() => {
        setIsGenerating(false);
        setIsNewBookWizardOpen(false);
        setStep(1);
        setCurrentRoute('editor');
      }, 500);
    } catch (err: any) {
      if (err.message !== 'Generation cancelled by user') {
        console.error('Book generation failed:', err);
      }
      setIsGenerating(false);
    }
  };

  const handleCancelGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsGenerating(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        onClick={() => !isGenerating && setIsNewBookWizardOpen(false)}
        className="fixed inset-0 bg-neutral-950/80 backdrop-blur-xs transition-opacity"
      />

      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }}
        className="relative w-full max-w-4xl bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden z-10 flex flex-col max-h-[92vh]"
      >
        {/* Wizard Header */}
        <div className="px-6 py-5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-900/50">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">
              <span>Step {step} of {totalSteps}</span>
              <span>•</span>
              <span>Professional Book Production Wizard</span>
            </div>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white font-display">
              {step === 1 && '1. Choose Book Archetype & Starting Point'}
              {step === 2 && '2. Book Information & Catalog Metadata'}
              {step === 3 && '3. Trim Size, Paper Stock & KDP Margins'}
              {step === 4 && '4. Interior Structure & Chapters'}
              {step === 5 && '5. Puzzle Batch & Content Generator'}
              {step === 6 && '6. Page Composition & Book Styling Theme'}
              {step === 7 && '7. Front Matter & Legal Pages'}
              {step === 8 && '8. Answer Key & Solution Layout'}
              {step === 9 && '9. Pre-Flight Inspection & Verification'}
              {step === 10 && '10. Production & Bulk Generation'}
            </h2>
          </div>

          <button
            onClick={() => !isGenerating && setIsNewBookWizardOpen(false)}
            disabled={isGenerating}
            className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-xl transition-colors disabled:opacity-30"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-1.5">
          <div
            className="bg-amber-500 h-full transition-all duration-300"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>

        {/* Wizard Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* STEP 1: ARCHETYPE */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Select an archetype to initialize your book structure with optimal trim dimensions, chapter sections, and puzzle batches.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {[
                  {
                    id: 'mixed_puzzle',
                    title: 'Mixed Master Puzzle Book',
                    desc: 'Word search, sudoku, mazes, cryptograms & crosswords with complete end solutions.',
                    icon: <Grid3X3 className="w-6 h-6 text-amber-500" />,
                    badge: 'Bestseller KDP Format',
                  },
                  {
                    id: 'word_search_master',
                    title: 'Large Print Word Search Collection',
                    desc: 'Spacious 8.5" × 11" format with themed categories and high-legibility fonts.',
                    icon: <BookOpen className="w-6 h-6 text-blue-500" />,
                    badge: 'High Demand',
                  },
                  {
                    id: 'sudoku_challenge',
                    title: 'Sudoku Challenge & Logic Book',
                    desc: 'Progressive levels from easy to expert with symmetric, unique logic grids.',
                    icon: <Hash className="w-6 h-6 text-emerald-500" />,
                    badge: 'Pocket or Standard',
                  },
                  {
                    id: 'kids_activity',
                    title: 'Kids Activity & Brain Games',
                    desc: 'Word scrambles, labyrinths, number sequences, and playful border themes.',
                    icon: <Sparkles className="w-6 h-6 text-purple-500" />,
                    badge: 'Children 6-12',
                  },
                  {
                    id: 'custom_blank',
                    title: 'Custom Blank Book Manuscript',
                    desc: 'Start with a clean canvas, fully custom margins, and custom section layout.',
                    icon: <Layers className="w-6 h-6 text-neutral-500" />,
                    badge: 'Advanced',
                  },
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectArchetype(item.id)}
                    className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-4 ${
                      bookArchetype === item.id
                        ? 'border-amber-500 bg-amber-500/5 dark:bg-amber-500/10 shadow-xs ring-1 ring-amber-500'
                        : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
                    }`}
                  >
                    <div className="p-3 rounded-2xl bg-white dark:bg-neutral-800 shrink-0 border border-neutral-100 dark:border-neutral-700">
                      {item.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sm text-neutral-900 dark:text-white">
                          {item.title}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                          {item.badge}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: METADATA */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
                    Main Book Title *
                  </label>
                  <input
                    type="text"
                    value={metadata.title}
                    onChange={e => setMetadata({ ...metadata, title: e.target.value })}
                    placeholder="e.g. The Ultimate Brain Workout Puzzle Collection"
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-amber-500 outline-hidden"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
                    Subtitle
                  </label>
                  <input
                    type="text"
                    value={metadata.subtitle || ''}
                    onChange={e => setMetadata({ ...metadata, subtitle: e.target.value })}
                    placeholder="e.g. 100+ Mind Sharpening Puzzles for Adults and Teens"
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
                    Author / Pen Name *
                  </label>
                  <input
                    type="text"
                    value={metadata.author}
                    onChange={e => setMetadata({ ...metadata, author: e.target.value })}
                    placeholder="e.g. Arthur Sterling"
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
                    Publisher / Imprint
                  </label>
                  <input
                    type="text"
                    value={metadata.publisher || ''}
                    onChange={e => setMetadata({ ...metadata, publisher: e.target.value })}
                    placeholder="e.g. Starlight Puzzle Studio"
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
                    Series Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={metadata.seriesName || ''}
                    onChange={e => setMetadata({ ...metadata, seriesName: e.target.value })}
                    placeholder="e.g. Mind Sharpeners Series"
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
                    Volume # & Edition
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={metadata.volumeNumber || ''}
                      onChange={e => setMetadata({ ...metadata, volumeNumber: e.target.value })}
                      placeholder="Vol 1"
                      className="w-1/3 px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm"
                    />
                    <input
                      type="text"
                      value={metadata.edition || ''}
                      onChange={e => setMetadata({ ...metadata, edition: e.target.value })}
                      placeholder="1st Edition"
                      className="w-2/3 px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
                    KDP Description (Back Cover & Amazon Listing)
                  </label>
                  <textarea
                    rows={2}
                    value={metadata.description || ''}
                    onChange={e => setMetadata({ ...metadata, description: e.target.value })}
                    placeholder="Enter engaging book description..."
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm outline-hidden"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: TRIM & PRINT */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
                  KDP Interior Trim Size
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {STANDARD_TRIM_SIZES.map(trim => (
                    <button
                      key={trim.id}
                      type="button"
                      onClick={() => setTrimSize(trim)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        trimSize.id === trim.id
                          ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold'
                          : 'border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200'
                      }`}
                    >
                      <div className="font-mono text-sm font-bold">{trim.name}</div>
                      <div className="text-[10px] text-neutral-500">{trim.category} Format</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
                    Paper Stock
                  </label>
                  <select
                    value={paperType}
                    onChange={e => setPaperType(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white"
                  >
                    <option value="White">Standard White Paper</option>
                    <option value="Cream">Cream Paper (Novels)</option>
                    <option value="Premium Color">Premium Color</option>
                    <option value="Standard Color">Standard Color</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
                    Bleed Setting
                  </label>
                  <select
                    value={bleed}
                    onChange={e => setBleed(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white"
                  >
                    <option value="No Bleed">No Bleed (Standard for Puzzles)</option>
                    <option value="Bleed">Bleed (+0.125" for Full Edge)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
                    Orientation
                  </label>
                  <select
                    value={orientation}
                    onChange={e => setOrientation(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white"
                  >
                    <option value="Portrait">Portrait</option>
                    <option value="Landscape">Landscape</option>
                  </select>
                </div>
              </div>

              {/* Spine & Margin Diagram Card */}
              <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-neutral-500 block">Est. Page Count:</span>
                  <strong className="text-neutral-900 dark:text-white font-mono text-sm">
                    {estimatedTotalPages} pages
                  </strong>
                </div>
                <div>
                  <span className="text-neutral-500 block">Calculated Spine:</span>
                  <strong className="text-neutral-900 dark:text-white font-mono text-sm">
                    {spineWidth}"
                  </strong>
                </div>
                <div>
                  <span className="text-neutral-500 block">Inside Gutter:</span>
                  <strong className="text-neutral-900 dark:text-white font-mono text-sm">
                    {recommendedGutter}"
                  </strong>
                </div>
                <div>
                  <span className="text-neutral-500 block">Full Cover Wrap:</span>
                  <strong className="text-neutral-900 dark:text-white font-mono text-sm">
                    {coverDims.width}" × {coverDims.height}"
                  </strong>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: SECTIONS */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Organize your manuscript into logical sections or chapters.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    const newId = `sec-${Date.now()}`;
                    setSections([
                      ...sections,
                      {
                        id: newId,
                        title: `Section ${sections.length + 1}`,
                        order: sections.length,
                        pageIds: [],
                      },
                    ]);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-xs flex items-center gap-1.5 hover:bg-amber-500/20"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Section</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {sections.map((sec, idx) => (
                  <div
                    key={sec.id}
                    className="p-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800/40 flex items-center gap-3"
                  >
                    <span className="w-6 h-6 rounded-lg bg-neutral-100 dark:bg-neutral-800 font-mono text-xs font-bold flex items-center justify-center text-neutral-500">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      value={sec.title}
                      onChange={e => {
                        const updated = [...sections];
                        updated[idx].title = e.target.value;
                        setSections(updated);
                      }}
                      placeholder="Section Title"
                      className="flex-1 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm font-semibold"
                    />
                    {sections.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setSections(sections.filter(s => s.id !== sec.id))}
                        className="p-1.5 text-neutral-400 hover:text-red-500 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 5: PUZZLE BATCH CONFIGURATION */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                    Configured Puzzle Batches ({totalPuzzlesCount} Total Puzzles)
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Each batch generates mathematically unique, solvable puzzles with full solution data.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const newBatch: PuzzleBatchItemConfig = {
                      id: `batch-${Date.now()}`,
                      puzzleType: 'word_search',
                      count: 10,
                      difficulty: 'Medium',
                      theme: 'General Vocabulary',
                      sectionTitle: 'Word Searches',
                    };
                    setPuzzleBatches([...puzzleBatches, newBatch]);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 text-neutral-950 font-bold text-xs flex items-center gap-1.5 hover:bg-amber-400 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Batch</span>
                </button>
              </div>

              <div className="space-y-3">
                {puzzleBatches.map((batch, idx) => (
                  <div
                    key={batch.id}
                    className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800/50 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-xs flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={batch.sectionTitle || ''}
                          onChange={e => {
                            const updated = [...puzzleBatches];
                            updated[idx].sectionTitle = e.target.value;
                            setPuzzleBatches(updated);
                          }}
                          placeholder="Batch Title / Label"
                          className="px-2.5 py-1 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs font-bold bg-neutral-50 dark:bg-neutral-800"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => setPuzzleBatches(puzzleBatches.filter(b => b.id !== batch.id))}
                        className="p-1 text-neutral-400 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                      <div>
                        <label className="text-[10px] font-bold text-neutral-400 block mb-1">Puzzle Type</label>
                        <select
                          value={batch.puzzleType}
                          onChange={e => {
                            const updated = [...puzzleBatches];
                            updated[idx].puzzleType = e.target.value as PuzzleType;
                            setPuzzleBatches(updated);
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs"
                        >
                          <option value="word_search">Word Search</option>
                          <option value="sudoku">Sudoku</option>
                          <option value="crossword">Crossword</option>
                          <option value="maze">Maze</option>
                          <option value="cryptogram">Cryptogram</option>
                          <option value="word_scramble">Word Scramble</option>
                          <option value="number_puzzle">Number Sequence</option>
                          <option value="logic_grid">Logic Grid</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-neutral-400 block mb-1">Quantity</label>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={batch.count}
                          onChange={e => {
                            const updated = [...puzzleBatches];
                            updated[idx].count = Math.max(1, parseInt(e.target.value) || 1);
                            setPuzzleBatches(updated);
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-mono font-bold"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-neutral-400 block mb-1">Difficulty</label>
                        <select
                          value={batch.difficulty}
                          onChange={e => {
                            const updated = [...puzzleBatches];
                            updated[idx].difficulty = e.target.value as PuzzleDifficulty;
                            setPuzzleBatches(updated);
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs"
                        >
                          <option value="Easy">Easy</option>
                          <option value="Medium">Medium</option>
                          <option value="Hard">Hard</option>
                          <option value="Expert">Expert</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-neutral-400 block mb-1">Theme / Topic</label>
                        <input
                          type="text"
                          value={batch.theme || ''}
                          onChange={e => {
                            const updated = [...puzzleBatches];
                            updated[idx].theme = e.target.value;
                            setPuzzleBatches(updated);
                          }}
                          placeholder="e.g. Astronomy"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 6: LAYOUT & THEME */}
          {step === 6 && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
                  Page Layout (Puzzles Per Page)
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { count: 1 as const, title: '1 Per Page', desc: 'Large format, high readability' },
                    { count: 2 as const, title: '2 Per Page', desc: 'Stacked vertical dual-layout' },
                    { count: 4 as const, title: '4 Per Page', desc: 'Compact 2×2 grid layout' },
                  ].map(item => (
                    <button
                      key={item.count}
                      type="button"
                      onClick={() => setPuzzlesPerPage(item.count)}
                      className={`p-4 rounded-2xl border text-left transition-all ${
                        puzzlesPerPage === item.count
                          ? 'border-amber-500 bg-amber-500/10'
                          : 'border-neutral-200 dark:border-neutral-800'
                      }`}
                    >
                      <div className="font-bold text-sm text-neutral-900 dark:text-white mb-1">
                        {item.title}
                      </div>
                      <div className="text-xs text-neutral-500">{item.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
                  Select Typography & Aesthetic Theme
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {BUILTIN_BOOK_THEMES.map(theme => (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => setSelectedTheme(theme)}
                      className={`p-4 rounded-2xl border text-left transition-all ${
                        selectedTheme.id === theme.id
                          ? 'border-amber-500 bg-amber-500/10 shadow-xs ring-1 ring-amber-500'
                          : 'border-neutral-200 dark:border-neutral-800'
                      }`}
                    >
                      <div className="font-bold text-sm text-neutral-900 dark:text-white mb-1">
                        {theme.name}
                      </div>
                      <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mb-2 leading-snug">
                        {theme.description}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-400">
                        <span>H: {theme.fontHeading}</span>
                        <span>•</span>
                        <span>B: {theme.fontBody}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 7: FRONT MATTER */}
          {step === 7 && (
            <div className="space-y-4">
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Choose which standard introductory pages to format automatically in your manuscript.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    key: 'includeTitlePage',
                    label: 'Main Title Page',
                    desc: 'Centered title, subtitle, author, and publisher imprint.',
                  },
                  {
                    key: 'includeCopyrightPage',
                    label: 'Copyright & Legal Notice',
                    desc: '© notice, rights reservation, edition, and ISBN notice.',
                  },
                  {
                    key: 'includeInstructionsPage',
                    label: 'How to Play / Rules Guide',
                    desc: 'Original solving instructions for all included puzzle types.',
                  },
                  {
                    key: 'includeTableOfContents',
                    label: 'Table of Contents',
                    desc: 'Dynamic section index with page numbers and leader lines.',
                  },
                  {
                    key: 'includeDisclaimerPage',
                    label: 'Disclaimer Page',
                    desc: 'Publisher informational notice & rights disclaimer.',
                  },
                ].map(item => {
                  const isChecked = (frontMatter as any)[item.key];
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() =>
                        setFrontMatter({ ...frontMatter, [item.key]: !isChecked })
                      }
                      className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                        isChecked
                          ? 'border-amber-500 bg-amber-500/10'
                          : 'border-neutral-200 dark:border-neutral-800'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        readOnly
                        className="mt-1 accent-amber-500 rounded-md"
                      />
                      <div>
                        <div className="font-bold text-sm text-neutral-900 dark:text-white">
                          {item.label}
                        </div>
                        <div className="text-xs text-neutral-500 mt-0.5">{item.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 8: ANSWER KEY */}
          {step === 8 && (
            <div className="space-y-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500">
                Answer Key Placement Workflow
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    mode: 'end_of_book' as const,
                    title: 'Complete Answer Key at End',
                    desc: 'Standard Amazon KDP format. Solutions packed 4-up at back of book.',
                  },
                  {
                    mode: 'after_section' as const,
                    title: 'Solutions After Each Section',
                    desc: 'Places answer pages immediately following each chapter.',
                  },
                  {
                    mode: 'none' as const,
                    title: 'No Solutions (Blank/Custom)',
                    desc: 'Omits solutions entirely for journals or non-puzzle workbooks.',
                  },
                ].map(item => (
                  <button
                    key={item.mode}
                    type="button"
                    onClick={() => setAnswerKey({ ...answerKey, mode: item.mode })}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      answerKey.mode === item.mode
                        ? 'border-amber-500 bg-amber-500/10'
                        : 'border-neutral-200 dark:border-neutral-800'
                    }`}
                  >
                    <div className="font-bold text-sm text-neutral-900 dark:text-white mb-1">
                      {item.title}
                    </div>
                    <div className="text-xs text-neutral-500">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 9: PRE-FLIGHT REVIEW */}
          {step === 9 && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/70 border border-neutral-200 dark:border-neutral-700 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-neutral-700">
                  <span className="text-xs font-bold text-neutral-500 uppercase">Pre-Flight Summary</span>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                    {validationReport.errorsCount === 0 ? 'Print Ready' : 'Issues Found'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-neutral-500 block">Trim Size:</span>
                    <strong className="text-neutral-900 dark:text-white font-mono">{trimSize.name}</strong>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Est. Page Count:</span>
                    <strong className="text-neutral-900 dark:text-white font-mono">{estimatedTotalPages} pages</strong>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Spine Width:</span>
                    <strong className="text-neutral-900 dark:text-white font-mono">{spineWidth}"</strong>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Inside Gutter:</span>
                    <strong className="text-neutral-900 dark:text-white font-mono">{recommendedGutter}"</strong>
                  </div>
                </div>
              </div>

              {/* Issues List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Quality & KDP Compliance Check
                </h4>
                {validationReport.issues.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2.5">
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    <span>All parameters pass Amazon KDP manufacturing standards without errors.</span>
                  </div>
                ) : (
                  validationReport.issues.map(iss => (
                    <div
                      key={iss.id}
                      className={`p-3.5 rounded-2xl border text-xs flex items-start gap-3 ${
                        iss.severity === 'error'
                          ? 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300'
                          : iss.severity === 'warning'
                          ? 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300'
                          : 'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300'
                      }`}
                    >
                      {iss.severity === 'error' ? (
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      ) : iss.severity === 'warning' ? (
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      ) : (
                        <Info className="w-4 h-4 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <strong className="block font-bold">{iss.title}</strong>
                        <span>{iss.message}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* STEP 10: GENERATION PROGRESS MODAL SCREEN */}
          {step === 10 && (
            <div className="py-8 px-4 text-center space-y-6">
              {!isGenerating ? (
                <div className="space-y-4 max-w-md mx-auto">
                  <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
                    <Zap className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
                    Ready to Generate Manuscript
                  </h3>
                  <p className="text-sm text-neutral-500">
                    The engine will synthesize {totalPuzzlesCount} unique puzzles, calculate answers, compose front matter, and format all pages directly into your interactive project.
                  </p>
                  <button
                    type="button"
                    onClick={handleStartGeneration}
                    className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-sm transition-all shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-5 h-5" />
                    <span>Generate & Open Book in Studio Editor</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-6 max-w-md mx-auto">
                  <div className="w-16 h-16 rounded-3xl bg-amber-500/20 text-amber-500 flex items-center justify-center mx-auto animate-pulse">
                    <RefreshCw className="w-8 h-8 animate-spin" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-1">
                      Generating Your Book Manuscript
                    </h3>
                    <p className="text-xs text-neutral-500 font-mono">
                      {generationProgress.stage || 'Assembling pages...'}
                    </p>
                    {generationProgress.currentItem && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 font-semibold">
                        {generationProgress.currentItem}
                      </p>
                    )}
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-amber-500 h-full transition-all duration-200"
                      style={{ width: `${generationProgress.percent}%` }}
                    />
                  </div>

                  <div className="text-xs font-mono font-bold text-neutral-500">
                    {generationProgress.percent}% Complete
                  </div>

                  <button
                    type="button"
                    onClick={handleCancelGeneration}
                    className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  >
                    Cancel Generation
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Wizard Footer Controls */}
        {step < 10 && (
          <div className="p-6 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-900/50">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 font-semibold text-xs transition-colors flex items-center gap-2 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="px-6 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-neutral-950 font-bold text-xs transition-all flex items-center gap-2"
            >
              <span>{step === totalSteps - 1 ? 'Proceed to Generation' : 'Continue'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

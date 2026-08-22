import React, { useState } from 'react';
import {
  Sparkles,
  BookOpen,
  Layers,
  CheckCircle2,
  Sliders,
  RefreshCw,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Loader2,
  FileText,
  Key,
  ShieldCheck,
  Zap,
  Copy,
  Check,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { STANDARD_TRIM_SIZES, calculateKdpSpineWidth, calculateKdpInsideMargin } from '../../constants/kdp';
import { BUILTIN_BOOK_THEMES } from '../../constants/bookThemes';
import { BookGenerationService } from '../../services/bookGenerationService';
import { AiBookPlan, AiPlanSection } from '../../types/ai';
import { PuzzleType, PuzzleDifficulty } from '../../puzzles/types';
import { StorageService } from '../../services/storageService';

const TOPIC_SUGGESTIONS = [
  'Rainforest Wildlife & Birds',
  'World Geography & Landmarks',
  'Botanical Gardens & Flora',
  'Galactic Space & Astronomy',
  'Mindfulness & Daily Peace',
  'Vintage Bakery & Pastries',
  'Classic Literature & Poetry',
  'Ocean Depths & Coral Reefs',
  '80s & 90s Pop Culture',
  'Ancient Rome & Greece',
];

const BOOK_TYPES = [
  'Mixed Variety Puzzle Book',
  'Themed Word Search Book',
  'Sudoku Mastery Collection',
  'Maze & Labyrinth Adventure',
  'Cryptogram & Word Scramble',
  'Senior Large Print Activity Book',
  'Kids Activity & Logic Book',
];

const TARGET_AUDIENCES = ['Adults & Seniors', 'Seniors (Large Print)', 'Adults & Teens', 'Kids (Ages 6–10)', 'Teens & Young Adults', 'All Ages'];

const LANGUAGES = [
  { id: 'English', label: 'English' },
  { id: 'Spanish', label: 'Spanish (Español)' },
  { id: 'French', label: 'French (Français)' },
  { id: 'German', label: 'German (Deutsch)' },
  { id: 'Italian', label: 'Italian (Italiano)' },
  { id: 'Portuguese', label: 'Portuguese (Português)' },
];

export const AiBookPlannerView: React.FC = () => {
  const { createProject, openProjectInEditor, showToast } = useApp();

  // Input states
  const [bookType, setBookType] = useState('Mixed Variety Puzzle Book');
  const [topic, setTopic] = useState('Rainforest Wildlife & Birds');
  const [targetAudience, setTargetAudience] = useState('Adults & Seniors');
  const [language, setLanguage] = useState('English');
  const [difficulty, setDifficulty] = useState('Medium');
  const [trimSizeId, setTrimSizeId] = useState('8.5x11');
  const [targetPages, setTargetPages] = useState(80);
  const [puzzleCount, setPuzzleCount] = useState(60);
  const [puzzlesPerPage, setPuzzlesPerPage] = useState<1 | 2 | 4>(1);
  const [wordsPerSearch, setWordsPerSearch] = useState(15);
  const [answerKeyMode, setAnswerKeyMode] = useState<'end_of_book' | 'after_section' | 'after_puzzle' | 'four_up'>('end_of_book');
  const [isLargePrint, setIsLargePrint] = useState(false);
  const [paperType, setPaperType] = useState<'White' | 'Cream' | 'Premium Color' | 'Standard Color'>('White');
  const [titlePreference, setTitlePreference] = useState('');
  const [subtitlePreference, setSubtitlePreference] = useState('');
  const [selectedThemeId, setSelectedThemeId] = useState('theme-clean-minimal');

  // Generation state
  const [isPlanning, setIsPlanning] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<AiBookPlan | null>(null);
  const [isBuildingBook, setIsBuildingBook] = useState(false);
  const [buildStage, setBuildStage] = useState('');
  const [buildPercent, setBuildPercent] = useState(0);
  const [copiedKeyword, setCopiedKeyword] = useState<string | null>(null);

  const selectedTrim = STANDARD_TRIM_SIZES.find(t => t.id === trimSizeId) || STANDARD_TRIM_SIZES[1];
  const selectedTheme = BUILTIN_BOOK_THEMES.find(t => t.id === selectedThemeId) || BUILTIN_BOOK_THEMES[0];

  // Estimated manufacturing specs
  const estimatedSpine = calculateKdpSpineWidth(targetPages, paperType);
  const insideMargin = calculateKdpInsideMargin(targetPages);

  const handleGeneratePlan = async () => {
    if (!topic.trim()) {
      showToast({ type: 'warning', message: 'Please enter a book topic or theme.' });
      return;
    }

    setIsPlanning(true);
    try {
      const response = await fetch('/api/ai/plan-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookType,
          topic: topic.trim(),
          targetAudience,
          language,
          difficulty,
          trimSize: trimSizeId,
          targetPages,
          puzzleCount,
          wordsPerSearch,
          answerKeyMode,
          isLargePrint,
          titlePreference: titlePreference.trim(),
          subtitlePreference: subtitlePreference.trim(),
        }),
      });

      const data = await response.json();
      if (data.plan) {
        setCurrentPlan(data.plan);
        showToast({
          type: 'success',
          title: 'Book Plan Ready',
          message: data.isFallback
            ? 'Structured plan generated from publishing standards.'
            : 'AI publication plan successfully generated.',
        });
      } else {
        throw new Error(data.error || 'Failed to generate plan.');
      }
    } catch (err: any) {
      console.error('AI Book Planner Error:', err);
      showToast({ type: 'error', message: err.message || 'Failed to connect to planner.' });
    } finally {
      setIsPlanning(false);
    }
  };

  const handleBuildBook = async () => {
    if (!currentPlan) return;

    setIsBuildingBook(true);
    setBuildStage('Starting book production engine...');
    setBuildPercent(5);

    try {
      const result = await BookGenerationService.generateFromAiPlan(
        currentPlan,
        {
          trimSize: selectedTrim,
          bleed: 'No Bleed',
          paperType,
          theme: selectedTheme,
          puzzlesPerPage,
          author: 'KDP Studio Author',
        },
        event => {
          setBuildPercent(event.percent);
          setBuildStage(event.stage);
        }
      );

      // Save and open in editor
      createProject(result.project, result.document);
      showToast({
        type: 'success',
        title: 'Manuscript Generated',
        message: `Created "${result.project.name}" with ${result.document.pages.length} pages.`,
      });
      openProjectInEditor(result.project.id);
    } catch (err: any) {
      console.error('Book Building Error:', err);
      showToast({ type: 'error', message: err.message || 'Failed to generate manuscript.' });
    } finally {
      setIsBuildingBook(false);
    }
  };

  // Section manipulation in approved plan
  const handleUpdateSection = (index: number, updated: Partial<AiPlanSection>) => {
    if (!currentPlan) return;
    const newSections = [...currentPlan.sections];
    newSections[index] = { ...newSections[index], ...updated };
    setCurrentPlan({ ...currentPlan, sections: newSections });
  };

  const handleRemoveSection = (index: number) => {
    if (!currentPlan || currentPlan.sections.length <= 1) {
      showToast({ type: 'warning', message: 'Book must contain at least one section.' });
      return;
    }
    const newSections = currentPlan.sections.filter((_, i) => i !== index);
    setCurrentPlan({ ...currentPlan, sections: newSections });
  };

  const handleAddSection = () => {
    if (!currentPlan) return;
    const newSec: AiPlanSection = {
      title: `Chapter ${currentPlan.sections.length + 1}: Bonus Puzzles`,
      puzzleType: 'word_search',
      count: 10,
      difficulty: 'Medium',
      theme: topic,
    };
    setCurrentPlan({ ...currentPlan, sections: [...currentPlan.sections, newSec] });
  };

  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    if (!currentPlan) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentPlan.sections.length) return;
    const copy = [...currentPlan.sections];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIndex, 0, moved);
    setCurrentPlan({ ...currentPlan, sections: copy });
  };

  const copyKeyword = (kw: string) => {
    navigator.clipboard.writeText(kw);
    setCopiedKeyword(kw);
    setTimeout(() => setCopiedKeyword(null), 2000);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            AI Book Production Studio
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white font-display tracking-tight">
            AI Book Planner & Outline Architect
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1 max-w-2xl">
            Generate complete, publication-ready Amazon KDP puzzle book blueprints with structured front matter, themed chapters, deterministic puzzle grids, and automated answer keys.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Input Specification Form */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-5">
            <div className="flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <Sliders className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
                Book Specifications
              </h2>
            </div>

            {/* Book Type */}
            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                Book Format & Niche
              </label>
              <select
                value={bookType}
                onChange={e => setBookType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-medium text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
              >
                {BOOK_TYPES.map(bt => (
                  <option key={bt} value={bt}>
                    {bt}
                  </option>
                ))}
              </select>
            </div>

            {/* Topic Input & Chips */}
            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                Theme or Subject Topic
              </label>
              <input
                type="text"
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="e.g. Vintage Botanical Gardens, 90s Nostalgia, World Wonders"
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-medium text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
              />
              {/* Quick inspiration chips */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {TOPIC_SUGGESTIONS.slice(0, 5).map(chip => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setTopic(chip)}
                    className="text-[10px] px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-amber-500 transition-colors"
                  >
                    + {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* Target Audience & Language */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Target Audience
                </label>
                <select
                  value={targetAudience}
                  onChange={e => {
                    setTargetAudience(e.target.value);
                    if (e.target.value.includes('Large Print') || e.target.value.includes('Seniors')) {
                      setIsLargePrint(true);
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-medium text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  {TARGET_AUDIENCES.map(aud => (
                    <option key={aud} value={aud}>
                      {aud}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Language
                </label>
                <select
                  value={language}
                  onChange={e => setLanguage(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-medium text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  {LANGUAGES.map(lang => (
                    <option key={lang.id} value={lang.id}>
                      {lang.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Trim Size & Difficulty */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  KDP Trim Size
                </label>
                <select
                  value={trimSizeId}
                  onChange={e => setTrimSizeId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-medium text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  {STANDARD_TRIM_SIZES.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Difficulty Level
                </label>
                <select
                  value={difficulty}
                  onChange={e => setDifficulty(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-medium text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  <option value="Easy">Easy (Beginner Friendly)</option>
                  <option value="Medium">Medium (Standard)</option>
                  <option value="Hard">Hard (Expert)</option>
                  <option value="Progressive">Progressive (Easy to Hard)</option>
                </select>
              </div>
            </div>

            {/* Numeric targets: Page Count & Puzzle Count */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Target Pages ({targetPages})
                </label>
                <input
                  type="range"
                  min="24"
                  max="300"
                  step="4"
                  value={targetPages}
                  onChange={e => setTargetPages(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-neutral-400 mt-1 font-mono">
                  <span>24 pgs</span>
                  <span>100 pgs</span>
                  <span>300 pgs</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Total Puzzles ({puzzleCount})
                </label>
                <input
                  type="range"
                  min="10"
                  max="200"
                  step="5"
                  value={puzzleCount}
                  onChange={e => setPuzzleCount(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-neutral-400 mt-1 font-mono">
                  <span>10</span>
                  <span>100</span>
                  <span>200</span>
                </div>
              </div>
            </div>

            {/* Layout Options */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Puzzles / Page
                </label>
                <select
                  value={puzzlesPerPage}
                  onChange={e => setPuzzlesPerPage(Number(e.target.value) as 1 | 2 | 4)}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-medium text-neutral-900 dark:text-white"
                >
                  <option value={1}>1 Per Page</option>
                  <option value={2}>2 Per Page</option>
                  <option value={4}>4 Per Page</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Words / Search
                </label>
                <select
                  value={wordsPerSearch}
                  onChange={e => setWordsPerSearch(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-medium text-neutral-900 dark:text-white"
                >
                  <option value={10}>10 Words</option>
                  <option value={12}>12 Words</option>
                  <option value={15}>15 Words</option>
                  <option value={18}>18 Words</option>
                  <option value={20}>20 Words</option>
                  <option value={24}>24 Words</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Answer Key Mode
                </label>
                <select
                  value={answerKeyMode}
                  onChange={e => setAnswerKeyMode(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-medium text-neutral-900 dark:text-white"
                >
                  <option value="end_of_book">End of Book</option>
                  <option value="after_section">After Section</option>
                  <option value="after_puzzle">Interleaved</option>
                  <option value="four_up">4-Up Compact</option>
                </select>
              </div>
            </div>

            {/* Design Theme Preset */}
            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                Book Design Theme
              </label>
              <select
                value={selectedThemeId}
                onChange={e => setSelectedThemeId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-medium text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
              >
                {BUILTIN_BOOK_THEMES.map(th => (
                  <option key={th.id} value={th.id}>
                    {th.name} — {th.fontHeading} / {th.fontBody}
                  </option>
                ))}
              </select>
            </div>

            {/* Large Print Toggle */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-neutral-900 dark:text-white">
                  Large Print Mode (Senior Friendly)
                </span>
                <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
                  Enforces 18pt–22pt fonts and generous puzzle grids.
                </span>
              </div>
              <input
                type="checkbox"
                checked={isLargePrint}
                onChange={e => setIsLargePrint(e.target.checked)}
                className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
              />
            </div>

            {/* Generate Action Button */}
            <button
              type="button"
              disabled={isPlanning}
              onClick={handleGeneratePlan}
              className="w-full py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-neutral-950 font-bold text-sm transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isPlanning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Publication Plan...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate AI Book Plan</span>
                </>
              )}
            </button>
          </div>

          {/* KDP Preflight Specs Card */}
          <div className="p-5 rounded-3xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 text-xs space-y-2.5 font-mono">
            <div className="flex items-center gap-2 font-bold text-neutral-900 dark:text-white font-sans text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              KDP Print Target Calculations
            </div>
            <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
              <span>Trim Size:</span>
              <span className="text-neutral-900 dark:text-white font-bold">{selectedTrim.name}</span>
            </div>
            <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
              <span>Estimated Spine:</span>
              <span className="text-neutral-900 dark:text-white font-bold">{estimatedSpine.toFixed(4)} in</span>
            </div>
            <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
              <span>Inside Gutter Margin:</span>
              <span className="text-neutral-900 dark:text-white font-bold">{insideMargin.toFixed(3)} in</span>
            </div>
            <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
              <span>Paper Stock:</span>
              <span className="text-neutral-900 dark:text-white font-bold">{paperType}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Plan Preview & Chapter Architect */}
        <div className="lg:col-span-7 space-y-6">
          {!currentPlan ? (
            <div className="h-full min-h-[420px] flex flex-col items-center justify-center p-8 rounded-3xl border-2 border-dashed border-neutral-300 dark:border-neutral-800 text-center bg-white/50 dark:bg-neutral-900/30">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4">
                <BookOpen className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                No Book Plan Generated Yet
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mt-1 mb-5">
                Configure your book parameters on the left and click "Generate AI Book Plan" to formulate chapter structures, titles, and layouts.
              </p>
              <button
                type="button"
                onClick={handleGeneratePlan}
                disabled={isPlanning}
                className="px-5 py-2.5 rounded-xl bg-neutral-900 text-white dark:bg-neutral-800 dark:text-neutral-200 text-xs font-bold hover:bg-neutral-800 transition-colors inline-flex items-center gap-2"
              >
                <Zap className="w-4 h-4 text-amber-500" />
                Quick Plan Demo ({topic})
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Approved Plan Summary Header */}
              <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      Approved KDP Blueprint
                    </span>
                  </div>
                  <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                    {currentPlan.sections.length} Chapters • {currentPlan.totalPuzzles} Puzzles
                  </span>
                </div>

                {/* Title & Subtitle Direct Editors */}
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                    Book Title
                  </label>
                  <input
                    type="text"
                    value={currentPlan.title}
                    onChange={e => setCurrentPlan({ ...currentPlan, title: e.target.value })}
                    className="w-full text-lg sm:text-xl font-bold font-display px-3 py-1.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                    Subtitle
                  </label>
                  <input
                    type="text"
                    value={currentPlan.subtitle}
                    onChange={e => setCurrentPlan({ ...currentPlan, subtitle: e.target.value })}
                    className="w-full text-xs font-medium px-3 py-1.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300"
                  />
                </div>

                {/* KDP Search Keywords */}
                <div>
                  <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-2">
                    Amazon 7-Backend Keywords (Click to Copy)
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {currentPlan.keywords.map((kw, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => copyKeyword(kw)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-neutral-100 dark:bg-neutral-800 hover:bg-amber-500/20 hover:text-amber-500 text-neutral-700 dark:text-neutral-300 transition-colors font-mono"
                        title="Click to copy keyword phrase"
                      >
                        {kw}
                        {copiedKeyword === kw ? (
                          <Check className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <Copy className="w-3 h-3 opacity-50" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Front Matter Configuration */}
                <div className="pt-2">
                  <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-2">
                    Front Matter Inclusions
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { key: 'includeTitlePage', label: 'Title Page' },
                      { key: 'includeCopyright', label: 'Copyright' },
                      { key: 'includeInstructions', label: 'How to Play' },
                      { key: 'includeTOC', label: 'Table of Contents' },
                    ].map(fm => (
                      <label
                        key={fm.key}
                        className="flex items-center gap-2 p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-medium cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={(currentPlan.frontMatter as any)[fm.key]}
                          onChange={e =>
                            setCurrentPlan({
                              ...currentPlan,
                              frontMatter: {
                                ...currentPlan.frontMatter,
                                [fm.key]: e.target.checked,
                              },
                            })
                          }
                          className="accent-amber-500 rounded"
                        />
                        <span className="text-neutral-800 dark:text-neutral-200 text-[11px]">{fm.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Chapter Outline Section Manager */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                    Interior Chapter Progression ({currentPlan.sections.length} Sections)
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddSection}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold hover:bg-amber-500/20 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Section
                  </button>
                </div>

                <div className="space-y-3">
                  {currentPlan.sections.map((sec, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
                    >
                      <div className="flex items-start gap-3 flex-1">
                        <div className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center font-mono font-bold text-xs text-neutral-600 dark:text-neutral-400 shrink-0 mt-0.5">
                          {idx + 1}
                        </div>
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <input
                            type="text"
                            value={sec.title}
                            onChange={e => handleUpdateSection(idx, { title: e.target.value })}
                            className="w-full text-xs font-bold text-neutral-900 dark:text-white bg-transparent border-b border-transparent focus:border-amber-500 outline-none pb-0.5"
                          />
                          <div className="flex flex-wrap items-center gap-2 text-[11px]">
                            {/* Type selector */}
                            <select
                              value={sec.puzzleType}
                              onChange={e => handleUpdateSection(idx, { puzzleType: e.target.value as any })}
                              className="px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-[10px] font-semibold"
                            >
                              <option value="word_search">Word Search</option>
                              <option value="sudoku">Sudoku</option>
                              <option value="maze">Maze</option>
                              <option value="crossword">Crossword</option>
                              <option value="word_scramble">Word Scramble</option>
                              <option value="cryptogram">Cryptogram</option>
                            </select>

                            {/* Difficulty selector */}
                            <select
                              value={sec.difficulty}
                              onChange={e => handleUpdateSection(idx, { difficulty: e.target.value as any })}
                              className="px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-[10px] font-semibold"
                            >
                              <option value="Easy">Easy</option>
                              <option value="Medium">Medium</option>
                              <option value="Hard">Hard</option>
                            </select>

                            {/* Puzzle count */}
                            <div className="flex items-center gap-1 font-mono text-[10px] text-neutral-500">
                              <span>Count:</span>
                              <input
                                type="number"
                                min="1"
                                max="100"
                                value={sec.count}
                                onChange={e => handleUpdateSection(idx, { count: Math.max(1, Number(e.target.value)) })}
                                className="w-12 px-1 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white font-bold text-center"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Controls: Reorder & Delete */}
                      <div className="flex items-center gap-1 shrink-0 self-end sm:self-center">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveSection(idx, 'up')}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30"
                          title="Move section up"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === currentPlan.sections.length - 1}
                          onClick={() => handleMoveSection(idx, 'down')}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30"
                          title="Move section down"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveSection(idx)}
                          className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-500/10 transition-colors"
                          title="Delete section"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Master Build Execution Card */}
              <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-base font-bold text-neutral-900 dark:text-white font-display">
                      Ready to Build KDP Manuscript?
                    </h4>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
                      This will generate deterministic puzzle vectors, formatted front matter, and full answer keys.
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={isBuildingBook}
                    onClick={handleBuildBook}
                    className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-neutral-950 font-extrabold text-sm transition-all shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
                  >
                    {isBuildingBook ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Generating ({buildPercent}%)...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Build Book Manuscript</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>

                {isBuildingBook && (
                  <div className="space-y-2 pt-2">
                    <div className="w-full h-2 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
                      <div
                        className="h-full bg-amber-500 transition-all duration-300 rounded-full"
                        style={{ width: `${buildPercent}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] font-mono text-neutral-500">
                      <span>{buildStage}</span>
                      <span>{buildPercent}%</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Loader2,
  Check,
  BookOpen,
  Copy,
  RefreshCw,
  Sliders,
  Globe,
  Users,
  Hash,
  AlertCircle,
  Plus,
  Trash2,
} from 'lucide-react';
import { WordListService, CustomWordCategory } from '../../puzzles/services/WordListService';

interface AiWordGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyWords: (words: string[], themeTitle: string) => void;
  onAddToBook?: (words: string[], themeTitle: string) => void;
  initialTopic?: string;
}

const INSPIRATION_THEMES = [
  'Rainforest Wildlife',
  'Galactic Astronomy',
  'French Bakery & Pastries',
  'Autumn Harvest & Seasons',
  'Marine Biology & Coral Reefs',
  'World Capitals & Geography',
  'Botanical Garden Flowers',
  'Ancient Egyptian History',
  'Coffee Brewing & Roasting',
  'Mindfulness & Positive Virtues',
];

const LANGUAGES = [
  { id: 'English', label: 'English' },
  { id: 'Spanish', label: 'Spanish (Español)' },
  { id: 'French', label: 'French (Français)' },
  { id: 'German', label: 'German (Deutsch)' },
  { id: 'Italian', label: 'Italian (Italiano)' },
  { id: 'Portuguese', label: 'Portuguese (Português)' },
];

export const AiWordGeneratorModal: React.FC<AiWordGeneratorModalProps> = ({
  isOpen,
  onClose,
  onApplyWords,
  onAddToBook,
  initialTopic = '',
}) => {
  const [topic, setTopic] = useState(initialTopic || 'Rainforest Wildlife');
  const [language, setLanguage] = useState('English');
  const [difficulty, setDifficulty] = useState('Medium');
  const [targetAudience, setTargetAudience] = useState('All Ages');
  const [wordCount, setWordCount] = useState(16);
  const [customInstructions, setCustomInstructions] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedWords, setGeneratedWords] = useState<string[]>([]);
  const [resolvedTopic, setResolvedTopic] = useState('');
  const [newWordInput, setNewWordInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setErrorMsg('Please enter a theme or topic.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setGeneratedWords([]);

    try {
      const response = await fetch('/api/ai/generate-words', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          count: wordCount,
          difficulty,
          language,
          targetAudience,
          customInstructions: customInstructions.trim(),
          minLen: 3,
          maxLen: 16,
        }),
      });

      const data = await response.json();

      if (data.words && Array.isArray(data.words) && data.words.length > 0) {
        setGeneratedWords(data.words);
        setResolvedTopic(data.topic || topic.trim());
        if (data.isFallback) {
          setToastMsg('Note: Generated using curated dictionary.');
        } else {
          setToastMsg(`Generated ${data.words.length} words using Gemini AI.`);
        }
        setTimeout(() => setToastMsg(null), 3500);
      } else {
        throw new Error(data.error || 'No words returned from generator.');
      }
    } catch (err: any) {
      console.error('AI Generation Request failed:', err);
      setErrorMsg(err.message || 'Failed to connect to AI generator. Please retry.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveWord = (wordToRemove: string) => {
    setGeneratedWords(prev => prev.filter(w => w !== wordToRemove));
  };

  const handleAddWord = () => {
    const clean = newWordInput.trim().toUpperCase().replace(/[^A-Z]/g, '');
    if (clean.length < 3) return;
    if (!generatedWords.includes(clean)) {
      setGeneratedWords(prev => [...prev, clean]);
    }
    setNewWordInput('');
  };

  const handleApplyToPuzzle = () => {
    if (generatedWords.length === 0) return;
    onApplyWords(generatedWords, resolvedTopic || topic);
    onClose();
  };

  const handleAddToBook = () => {
    if (generatedWords.length === 0) return;
    if (onAddToBook) {
      onAddToBook(generatedWords, resolvedTopic || topic);
    } else {
      onApplyWords(generatedWords, resolvedTopic || topic);
    }
    onClose();
  };

  const handleSaveToLibrary = () => {
    if (generatedWords.length === 0) return;
    try {
      WordListService.saveCategory({
        name: resolvedTopic || topic,
        category: 'AI Generated',
        words: generatedWords,
      });
      setToastMsg(`Saved "${resolvedTopic || topic}" to custom lists library!`);
      setTimeout(() => setToastMsg(null), 3000);
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to save to library.');
    }
  };

  const handleCopyClipboard = () => {
    if (generatedWords.length === 0) return;
    navigator.clipboard.writeText(generatedWords.join('\n'));
    setToastMsg('Copied words to clipboard!');
    setTimeout(() => setToastMsg(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* HEADER */}
        <div className="p-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white font-display flex items-center gap-2">
                <span>AI Topic & Word List Generator</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  Gemini Flash
                </span>
              </h2>
              <p className="text-xs text-neutral-500">
                Generate tailored, themed word search vocabulary lists with length and language constraints.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* NOTIFICATIONS */}
        {toastMsg && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-5 py-2 text-xs font-semibold text-amber-700 dark:text-amber-400 flex items-center justify-between">
            <span>{toastMsg}</span>
            <button onClick={() => setToastMsg(null)} className="text-xs underline">
              Dismiss
            </button>
          </div>
        )}

        {errorMsg && (
          <div className="bg-rose-500/10 border-b border-rose-500/20 px-5 py-2 text-xs font-semibold text-rose-700 dark:text-rose-400 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-xs underline">
              Dismiss
            </button>
          </div>
        )}

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* STEP 1: TOPIC & PROMPT SETTINGS */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                Puzzle Theme or Topic
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  placeholder="e.g. Vintage Cars, Deep Ocean Life, French Pastries..."
                  className="flex-1 px-3.5 py-2.5 text-xs rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button
                  onClick={handleGenerate}
                  disabled={isLoading}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-neutral-950 font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-amber-500/20 shrink-0"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generate Words</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* INSPIRATION CHIPS */}
            <div>
              <span className="text-[11px] font-semibold text-neutral-500 block mb-1.5">
                Popular Theme Inspirations:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {INSPIRATION_THEMES.map(theme => (
                  <button
                    key={theme}
                    onClick={() => setTopic(theme)}
                    className="px-2.5 py-1 rounded-lg text-[11px] bg-neutral-100 dark:bg-neutral-800 hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 text-neutral-600 dark:text-neutral-300 transition-colors"
                  >
                    {theme}
                  </button>
                ))}
              </div>
            </div>

            {/* PARAMETERS GRID */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div>
                <label className="block text-[11px] font-semibold text-neutral-500 mb-1">
                  Language
                </label>
                <select
                  value={language}
                  onChange={e => setLanguage(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {LANGUAGES.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-500 mb-1">
                  Word Count ({wordCount})
                </label>
                <select
                  value={wordCount}
                  onChange={e => setWordCount(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value={10}>10 Words (Small)</option>
                  <option value={15}>15 Words (Standard)</option>
                  <option value={20}>20 Words (Medium)</option>
                  <option value={25}>25 Words (Large)</option>
                  <option value={30}>30 Words (Jumbo)</option>
                  <option value={40}>40 Words (Master Bank)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-500 mb-1">
                  Difficulty
                </label>
                <select
                  value={difficulty}
                  onChange={e => setDifficulty(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="Easy">Easy (Familiar terms)</option>
                  <option value="Medium">Medium (Balanced)</option>
                  <option value="Hard">Hard (Specific terms)</option>
                  <option value="Expert">Expert (Lexical depth)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-500 mb-1">
                  Audience
                </label>
                <select
                  value={targetAudience}
                  onChange={e => setTargetAudience(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="All Ages">All Ages</option>
                  <option value="Kids & Children">Kids (Ages 6-10)</option>
                  <option value="Teens">Teens (Ages 11-16)</option>
                  <option value="Adults">Adults & Seniors</option>
                </select>
              </div>
            </div>
          </div>

          {/* STEP 2: GENERATED WORDS PREVIEW */}
          {generatedWords.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                    Generated Word Bank ({generatedWords.length} words)
                  </h3>
                  <span className="text-[11px] text-neutral-500">
                    Topic: {resolvedTopic || topic} • Cleaned & ready for puzzle placement
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyClipboard}
                    className="px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-1"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </button>
                  <button
                    onClick={handleSaveToLibrary}
                    className="px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-1"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Save to Library</span>
                  </button>
                </div>
              </div>

              {/* QUICK ADD SINGLE WORD */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newWordInput}
                  onChange={e => setNewWordInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddWord()}
                  placeholder="Add another custom word..."
                  className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-amber-500 uppercase font-mono"
                />
                <button
                  onClick={handleAddWord}
                  className="px-3.5 py-1.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-bold hover:bg-neutral-800 dark:hover:bg-neutral-100"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* WORD CHIP LIST */}
              <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 max-h-48 overflow-y-auto">
                <div className="flex flex-wrap gap-2">
                  {generatedWords.map((word, idx) => (
                    <div
                      key={idx}
                      className="group flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs font-mono font-medium text-neutral-800 dark:text-neutral-200 shadow-2xs"
                    >
                      <span>{word}</span>
                      <span className="text-[10px] text-neutral-400">({word.length})</span>
                      <button
                        onClick={() => handleRemoveWord(word)}
                        className="text-neutral-300 group-hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded p-0.5 transition-colors"
                        title={`Remove ${word}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-4 bg-neutral-50 dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleApplyToPuzzle}
              disabled={generatedWords.length === 0}
              className="px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-semibold text-xs flex items-center gap-1.5 transition-all"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply to Generator</span>
            </button>
            <button
              onClick={handleAddToBook}
              disabled={generatedWords.length === 0}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-neutral-950 font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-amber-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Insert Directly into Book</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

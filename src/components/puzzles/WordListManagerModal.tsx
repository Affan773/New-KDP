import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  BookOpen,
  Plus,
  Trash2,
  Edit2,
  Download,
  Upload,
  Search,
  Check,
  Sparkles,
  AlertCircle,
  FileText,
  Copy,
  FileType,
} from 'lucide-react';
import { WordListService, CustomWordCategory } from '../../puzzles/services/WordListService';
import { AiWordGeneratorModal } from './AiWordGeneratorModal';

interface WordListManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCategory?: (category: CustomWordCategory) => void;
}

export const WordListManagerModal: React.FC<WordListManagerModalProps> = ({
  isOpen,
  onClose,
  onSelectCategory,
}) => {
  const [categories, setCategories] = useState<CustomWordCategory[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<string>('animals');
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editCategoryGroup, setEditCategoryGroup] = useState('General');
  const [editTextWords, setEditTextWords] = useState('');
  const [newWordInput, setNewWordInput] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  // File import state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFileName, setImportFileName] = useState('');
  const [importParsedWords, setImportParsedWords] = useState<string[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importListName, setImportListName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadCategories = () => {
    const list = WordListService.getAllCategories();
    setCategories(list);
    if (list.length > 0 && !list.find(c => c.id === selectedCatId)) {
      setSelectedCatId(list[0].id);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadCategories();
      setIsEditing(false);
      setIsImportModalOpen(false);
    }
  }, [isOpen]);

  const activeCategory = categories.find(c => c.id === selectedCatId) || categories[0];

  const handleStartCreate = () => {
    setIsEditing(true);
    setEditName('My Custom Word List');
    setEditCategoryGroup('Custom');
    setEditTextWords('');
  };

  const handleStartEdit = (cat: CustomWordCategory) => {
    setIsEditing(true);
    setEditName(cat.name);
    setEditCategoryGroup(cat.category);
    setEditTextWords(cat.words.join('\n'));
  };

  const handleSaveCategory = () => {
    if (!editName.trim()) {
      setToastMsg('Please enter a list name.');
      return;
    }
    const { words } = WordListService.importPlainText(editTextWords);
    if (words.length === 0) {
      setToastMsg('Please include at least 1 valid alphabetic word.');
      return;
    }

    const saved = WordListService.saveCategory({
      id: activeCategory?.isCustom ? activeCategory.id : undefined,
      name: editName,
      category: editCategoryGroup,
      words,
    });

    loadCategories();
    setSelectedCatId(saved.id);
    setIsEditing(false);
    setToastMsg(`Saved "${saved.name}" with ${saved.words.length} words.`);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleDeleteCategory = (id: string) => {
    if (window.confirm('Are you sure you want to delete this custom word list?')) {
      WordListService.deleteCategory(id);
      loadCategories();
      setToastMsg('List deleted.');
      setTimeout(() => setToastMsg(null), 3000);
    }
  };

  const handleAddSingleWord = () => {
    if (!newWordInput.trim() || !activeCategory) return;
    const cleanWord = newWordInput.toUpperCase().replace(/[^A-Z]/g, '');
    if (cleanWord.length < 3) {
      setToastMsg('Words must have at least 3 letters.');
      return;
    }
    if (activeCategory.words.includes(cleanWord)) {
      setToastMsg('Word already in list.');
      return;
    }

    const updatedWords = [...activeCategory.words, cleanWord];
    WordListService.saveCategory({
      id: activeCategory.isCustom ? activeCategory.id : undefined,
      name: activeCategory.isCustom ? activeCategory.name : `${activeCategory.name} (Custom)`,
      category: activeCategory.category,
      words: updatedWords,
    });

    loadCategories();
    setNewWordInput('');
    setToastMsg(`Added "${cleanWord}" to list.`);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const handleRemoveWord = (wordToRemove: string) => {
    if (!activeCategory) return;
    const updatedWords = activeCategory.words.filter(w => w !== wordToRemove);
    WordListService.saveCategory({
      id: activeCategory.isCustom ? activeCategory.id : undefined,
      name: activeCategory.isCustom ? activeCategory.name : `${activeCategory.name} (Custom)`,
      category: activeCategory.category,
      words: updatedWords,
    });
    loadCategories();
  };

  const handleExportText = () => {
    if (!activeCategory) return;
    const text = activeCategory.words.join('\n');
    navigator.clipboard.writeText(text);
    setToastMsg('Word list copied to clipboard!');
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleDownloadFile = (format: 'txt' | 'csv') => {
    if (!activeCategory) return;
    let content = '';
    let filename = `${activeCategory.name.toLowerCase().replace(/\s+/g, '_')}.${format}`;

    if (format === 'csv') {
      content = 'Word,Length\n' + activeCategory.words.map(w => `"${w}",${w.length}`).join('\n');
    } else {
      content = activeCategory.words.join('\n');
    }

    const blob = new Blob([content], { type: format === 'csv' ? 'text/csv' : 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setToastMsg(`Downloaded ${filename}!`);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // File import handling
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const text = event.target?.result as string;
      if (!text) return;

      const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setImportFileName(file.name);
      setImportListName(baseName.charAt(0).toUpperCase() + baseName.slice(1));

      const { words, errors } = WordListService.importPlainText(text);
      setImportParsedWords(words);
      setImportErrors(errors || []);
      setIsImportModalOpen(true);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSaveImportedList = () => {
    if (!importListName.trim()) {
      setToastMsg('Please enter a list name.');
      return;
    }
    if (importParsedWords.length === 0) {
      setToastMsg('No valid words found in file.');
      return;
    }

    const saved = WordListService.saveCategory({
      name: importListName,
      category: 'Imported',
      words: importParsedWords,
    });

    loadCategories();
    setSelectedCatId(saved.id);
    setIsImportModalOpen(false);
    setToastMsg(`Successfully imported "${saved.name}" with ${saved.words.length} words.`);
    setTimeout(() => setToastMsg(null), 3500);
  };

  if (!isOpen) return null;

  const filteredCategories = categories.filter(
    c =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
          {/* HEADER */}
          <div className="p-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-neutral-900 dark:text-white font-display">
                  Word List Library Manager
                </h2>
                <p className="text-xs text-neutral-500">
                  Manage built-in themes, import TXT/CSV files, or generate AI word banks.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAiModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Generator</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-1.5"
                title="Import words from TXT or CSV file"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Import File</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />

              <button
                onClick={handleStartCreate}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Create List</span>
              </button>

              <button
                onClick={onClose}
                className="p-2 rounded-xl text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* TOAST ALERT */}
          {toastMsg && (
            <div className="bg-amber-500/10 border-b border-amber-500/20 px-5 py-2 text-xs font-semibold text-amber-700 dark:text-amber-400 flex items-center justify-between">
              <span>{toastMsg}</span>
              <button onClick={() => setToastMsg(null)} className="text-xs underline">
                Dismiss
              </button>
            </div>
          )}

          {/* BODY */}
          <div className="flex-1 flex overflow-hidden">
            {/* LEFT SIDEBAR: CATEGORIES LIST */}
            <div className="w-72 border-r border-neutral-200 dark:border-neutral-800 flex flex-col p-4 space-y-3 shrink-0 bg-neutral-50/50 dark:bg-neutral-950/50">
              <div className="relative">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search categories..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex-1 overflow-y-auto space-y-1 pr-1">
                {filteredCategories.map(cat => {
                  const isSelected = cat.id === selectedCatId;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setSelectedCatId(cat.id);
                        setIsEditing(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl text-xs transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/20 shadow-xs'
                          : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800/60'
                      }`}
                    >
                      <div className="truncate pr-2">
                        <div className="truncate">{cat.name}</div>
                        <div className="text-[10px] text-neutral-400 font-normal">{cat.category}</div>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-neutral-200/60 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 shrink-0">
                        {cat.words.length}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* RIGHT VIEWPORT */}
            <div className="flex-1 flex flex-col p-6 overflow-y-auto">
              {isEditing ? (
                /* EDITOR FORM */
                <div className="space-y-4 max-w-xl">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                      {activeCategory?.isCustom ? 'Edit Word List' : 'Create Custom Word List'}
                    </h3>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="text-xs text-neutral-500 hover:underline"
                    >
                      Cancel
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1">
                      List Name
                    </label>
                    <input
                      type="text"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="e.g. Tropical Rainforest Animals"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1">
                      Group Category
                    </label>
                    <input
                      type="text"
                      value={editCategoryGroup}
                      onChange={e => setEditCategoryGroup(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="e.g. Science / Geography"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1">
                      Words (One per line or comma-separated)
                    </label>
                    <textarea
                      rows={8}
                      value={editTextWords}
                      onChange={e => setEditTextWords(e.target.value)}
                      className="w-full p-3 font-mono text-xs rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="LION&#10;TIGER&#10;ELEPHANT&#10;GIRAFFE"
                    />
                    <p className="text-[10px] text-neutral-400 mt-1">
                      Non-alphabetic characters and duplicates are automatically cleaned.
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={handleSaveCategory}
                      className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition-all shadow-md shadow-amber-500/20"
                    >
                      Save Word List
                    </button>
                  </div>
                </div>
              ) : (
                /* ACTIVE CATEGORY DETAILS & WORDS LIST */
                <div className="space-y-5">
                  {activeCategory && (
                    <>
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-neutral-200 dark:border-neutral-800">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                              {activeCategory.name}
                            </h3>
                            {activeCategory.isCustom && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                Custom
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-neutral-400 font-medium">
                            Category: {activeCategory.category} • {activeCategory.words.length} Words Total
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {onSelectCategory && (
                            <button
                              onClick={() => {
                                onSelectCategory(activeCategory);
                                onClose();
                              }}
                              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs flex items-center gap-1.5 shadow-xs"
                            >
                              <Check className="w-4 h-4" />
                              <span>Use in Puzzle</span>
                            </button>
                          )}
                          <button
                            onClick={handleExportText}
                            className="px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-1"
                            title="Copy words to clipboard"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </button>
                          <button
                            onClick={() => handleDownloadFile('txt')}
                            className="px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-1"
                            title="Download TXT"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>.TXT</span>
                          </button>
                          <button
                            onClick={() => handleDownloadFile('csv')}
                            className="px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-1"
                            title="Download CSV"
                          >
                            <FileType className="w-3.5 h-3.5" />
                            <span>.CSV</span>
                          </button>

                          {activeCategory.isCustom ? (
                            <>
                              <button
                                onClick={() => handleStartEdit(activeCategory)}
                                className="px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-1.5"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={() => handleDeleteCategory(activeCategory.id)}
                                className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-colors"
                                title="Delete custom category"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleStartEdit(activeCategory)}
                              className="px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-1.5"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Duplicate</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* ADD SINGLE WORD INPUT */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newWordInput}
                          onChange={e => setNewWordInput(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleAddSingleWord()}
                          placeholder="Add word to this list..."
                          className="flex-1 px-3 py-2 text-xs rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-amber-500 uppercase"
                        />
                        <button
                          onClick={handleAddSingleWord}
                          className="px-4 py-2 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-bold hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors shrink-0"
                        >
                          Add Word
                        </button>
                      </div>

                      {/* WORDS CHIP CLOUD */}
                      <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
                        <div className="flex flex-wrap gap-2">
                          {activeCategory.words.map((word, idx) => (
                            <div
                              key={idx}
                              className="group flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs font-mono font-medium text-neutral-800 dark:text-neutral-200 shadow-2xs"
                            >
                              <span>{word}</span>
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
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* IMPORT PREVIEW MODAL */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Upload className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-neutral-900 dark:text-white font-display">
                  Import Word List Preview
                </h3>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1">
                  List Name
                </label>
                <input
                  type="text"
                  value={importListName}
                  onChange={e => setImportListName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-xs flex items-center justify-between">
                <span>File: <strong>{importFileName}</strong></span>
                <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">
                  {importParsedWords.length} Valid Words
                </span>
              </div>

              {importErrors.length > 0 && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400 space-y-1">
                  <div className="font-bold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Sanitization Notes ({importErrors.length}):</span>
                  </div>
                  <ul className="list-disc list-inside text-[11px] max-h-20 overflow-y-auto">
                    {importErrors.slice(0, 5).map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <span className="text-[11px] font-semibold text-neutral-500 block mb-1">
                  Sample Words Preview:
                </span>
                <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 max-h-36 overflow-y-auto font-mono text-xs text-neutral-700 dark:text-neutral-300">
                  {importParsedWords.slice(0, 30).join(', ')}
                  {importParsedWords.length > 30 && '...'}
                </div>
              </div>
            </div>

            <div className="p-4 bg-neutral-50 dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-neutral-600 dark:text-neutral-400"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveImportedList}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs flex items-center gap-1.5 shadow-xs"
              >
                <Check className="w-4 h-4" />
                <span>Save to Library</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI GENERATOR MODAL */}
      <AiWordGeneratorModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onApplyWords={(words, themeTitle) => {
          setIsAiModalOpen(false);
          const saved = WordListService.saveCategory({
            name: themeTitle,
            category: 'AI Generated',
            words,
          });
          loadCategories();
          setSelectedCatId(saved.id);
          setToastMsg(`Generated & saved "${themeTitle}" with ${words.length} words!`);
          setTimeout(() => setToastMsg(null), 3000);
        }}
      />
    </>
  );
};

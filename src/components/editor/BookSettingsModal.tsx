import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  BookOpen,
  Sliders,
  Palette,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  Layers,
  Sparkles,
  ShieldCheck,
  Type,
  FileCheck,
  Hash,
} from 'lucide-react';
import {
  calculateKdpCoverDimensions,
  calculateKdpInsideMargin,
  calculateKdpSpineWidth,
  STANDARD_TRIM_SIZES,
} from '../../constants/kdp';
import { BUILTIN_BOOK_THEMES, DEFAULT_BOOK_THEME } from '../../constants/bookThemes';
import { useApp } from '../../context/AppContext';
import { useEditor } from '../../context/EditorContext';
import { BookValidationService, ValidationReport } from '../../services/bookValidationService';
import {
  BookMetadata,
  BookProjectSettings,
  BookTheme,
  HeaderFooterSettings,
  PageNumberingSettings,
} from '../../types/book';
import { BleedType, Orientation, Project, TrimSize } from '../../types/project';
import { KdpProjectTab } from '../kdp/KdpProjectTab';

interface BookSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'metadata' | 'kdp' | 'trim' | 'headerFooter' | 'numbering' | 'theme' | 'preflight';
}

export const BookSettingsModal: React.FC<BookSettingsModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'metadata',
}) => {
  const { activeProject, updateProject } = useApp();
  const { document } = useEditor();

  const [activeTab, setActiveTab] = useState<
    'metadata' | 'kdp' | 'trim' | 'headerFooter' | 'numbering' | 'theme' | 'preflight'
  >(defaultTab);

  // Local editable state initialized with safe defaults
  const [metadata, setMetadata] = useState<BookMetadata>({
    title: activeProject?.name || '',
    subtitle: activeProject?.metadata?.subtitle || '',
    author: activeProject?.metadata?.author || 'KDP Creator',
    publisher: activeProject?.metadata?.publisher || 'Independent Publisher',
    description: activeProject?.description || '',
    seriesName: activeProject?.metadata?.seriesName || '',
    volumeNumber: activeProject?.metadata?.volumeNumber || '',
    edition: activeProject?.metadata?.edition || '1st Edition',
    isbn: activeProject?.metadata?.isbn || '',
    copyrightYear: activeProject?.metadata?.copyrightYear || new Date().getFullYear().toString(),
  });

  const [trimSize, setTrimSize] = useState<TrimSize>(
    activeProject?.kdpSettings?.trimSize || STANDARD_TRIM_SIZES[0]
  );
  const [paperType, setPaperType] = useState(activeProject?.kdpSettings?.paperType || 'White');
  const [bleed, setBleed] = useState<BleedType>(activeProject?.kdpSettings?.bleed || 'No Bleed');
  const [selectedTheme, setSelectedTheme] = useState<BookTheme>(
    activeProject?.bookSettings?.theme || DEFAULT_BOOK_THEME
  );

  const [headerFooter, setHeaderFooter] = useState<HeaderFooterSettings>(
    activeProject?.bookSettings?.headerFooter || {
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
    }
  );

  const [numbering, setNumbering] = useState<PageNumberingSettings>(
    activeProject?.bookSettings?.numbering || {
      enabled: true,
      startPageNumber: 1,
      startPageIndex: 4,
      frontMatterStyle: 'roman_lower',
      bodyStyle: 'arabic',
      position: 'bottom-center',
      fontSize: 10,
      fontFamily: 'Outfit',
      hideOnFrontMatter: true,
    }
  );

  // Sync state when activeProject or modal opens
  useEffect(() => {
    if (!activeProject || !isOpen) return;

    setActiveTab(defaultTab);
    setMetadata({
      title: activeProject.name || '',
      subtitle: activeProject.metadata?.subtitle || '',
      author: activeProject.metadata?.author || 'KDP Creator',
      publisher: activeProject.metadata?.publisher || 'Independent Publisher',
      description: activeProject.description || '',
      seriesName: activeProject.metadata?.seriesName || '',
      volumeNumber: activeProject.metadata?.volumeNumber || '',
      edition: activeProject.metadata?.edition || '1st Edition',
      isbn: activeProject.metadata?.isbn || '',
      copyrightYear: activeProject.metadata?.copyrightYear || new Date().getFullYear().toString(),
    });

    setTrimSize(activeProject.kdpSettings?.trimSize || STANDARD_TRIM_SIZES[0]);
    setPaperType(activeProject.kdpSettings?.paperType || 'White');
    setBleed(activeProject.kdpSettings?.bleed || 'No Bleed');
    setSelectedTheme(activeProject.bookSettings?.theme || DEFAULT_BOOK_THEME);

    if (activeProject.bookSettings?.headerFooter) {
      setHeaderFooter(activeProject.bookSettings.headerFooter);
    }
    if (activeProject.bookSettings?.numbering) {
      setNumbering(activeProject.bookSettings.numbering);
    }
  }, [activeProject, isOpen, defaultTab]);

  if (!isOpen || !activeProject) return null;

  const currentBookSettings = activeProject.bookSettings;
  const totalPages = document?.pages?.length || activeProject.pageCount || 80;

  // Live Spine & Gutter calculations
  const recommendedGutter = calculateKdpInsideMargin(totalPages);
  const spineWidth = calculateKdpSpineWidth(totalPages, paperType);
  const coverDims = calculateKdpCoverDimensions(trimSize.width, trimSize.height, spineWidth);

  // Validation report
  const validationReport: ValidationReport = BookValidationService.validateBook(
    activeProject,
    document
  );

  const handleSave = () => {
    const updatedBookSettings: BookProjectSettings = {
      schemaVersion: 4,
      metadata,
      sections: activeProject.sections || [],
      theme: selectedTheme,
      numbering,
      headerFooter,
      answerKey: currentBookSettings?.answerKey || {
        mode: 'end_of_book',
        puzzlesPerPage: 4,
        includeTitle: true,
        sectionLabels: true,
        startOnNewPage: true,
      },
      toc: currentBookSettings?.toc || {
        enabled: true,
        title: 'Table of Contents',
        showPageNumbers: true,
        dotLeaders: true,
        includeFrontMatter: false,
      },
      frontMatter: currentBookSettings?.frontMatter || {
        includeTitlePage: true,
        includeCopyrightPage: true,
        includeDisclaimerPage: false,
        includeInstructionsPage: true,
        includeIntroPage: false,
        includeTableOfContents: true,
      },
      puzzleNumberingStyle: 'continuous',
    };

    const updatedProject: Project = {
      ...activeProject,
      name: metadata.title,
      description: metadata.description || activeProject.description,
      kdpSettings: {
        ...activeProject.kdpSettings,
        trimSize,
        paperType,
        bleed,
        spineWidthInches: spineWidth,
        coverWidthInches: coverDims.width,
        coverHeightInches: coverDims.height,
      },
      metadata: {
        ...activeProject.metadata,
        ...metadata,
      },
      bookSettings: updatedBookSettings,
    };

    updateProject(updatedProject);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div onClick={onClose} className="fixed inset-0 bg-neutral-950/80 backdrop-blur-xs" />

      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }}
        className="relative w-full max-w-3xl bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden z-10 flex flex-col max-h-[88vh]"
      >
        {/* Header */}
        <div className="p-5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white font-display">
                Book & Manuscript Settings
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {activeProject.name} • {totalPages} Pages
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 border-b border-neutral-100 dark:border-neutral-800 flex gap-2 overflow-x-auto bg-neutral-50/50 dark:bg-neutral-900/50 text-xs font-semibold">
          {[
            { id: 'kdp', label: 'Amazon KDP Publishing' },
            { id: 'metadata', label: 'Metadata & Info' },
            { id: 'trim', label: 'Trim & Paper' },
            { id: 'headerFooter', label: 'Headers & Footers' },
            { id: 'numbering', label: 'Page Numbers' },
            { id: 'theme', label: 'Styling Theme' },
            {
              id: 'preflight',
              label: `Pre-Flight Check (${validationReport.errorsCount + validationReport.warningsCount})`,
            },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-3.5 border-b-2 transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-bold'
                  : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* 0. KDP PUBLISHING SETUP */}
          {activeTab === 'kdp' && (
            <KdpProjectTab
              project={activeProject}
              onUpdateProject={updateProject}
            />
          )}

          {/* 1. METADATA */}
          {activeTab === 'metadata' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">
                  Book Title *
                </label>
                <input
                  type="text"
                  value={metadata.title}
                  onChange={e => setMetadata({ ...metadata, title: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm font-semibold text-neutral-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">
                  Subtitle
                </label>
                <input
                  type="text"
                  value={metadata.subtitle || ''}
                  onChange={e => setMetadata({ ...metadata, subtitle: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">
                    Author / Pen Name
                  </label>
                  <input
                    type="text"
                    value={metadata.author}
                    onChange={e => setMetadata({ ...metadata, author: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">
                    Publisher / Imprint
                  </label>
                  <input
                    type="text"
                    value={metadata.publisher || ''}
                    onChange={e => setMetadata({ ...metadata, publisher: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 2. TRIM & PAPER */}
          {activeTab === 'trim' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
                  Amazon KDP Trim Size
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {STANDARD_TRIM_SIZES.map(trim => (
                    <button
                      key={trim.id}
                      type="button"
                      onClick={() => setTrimSize(trim)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        trimSize.id === trim.id
                          ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold'
                          : 'border-neutral-200 dark:border-neutral-800'
                      }`}
                    >
                      <div className="font-mono text-sm">{trim.name}</div>
                      <div className="text-[10px] text-neutral-500">{trim.category} Format</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">
                    Paper Stock
                  </label>
                  <select
                    value={paperType}
                    onChange={e => setPaperType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white"
                  >
                    <option value="White">Standard White Paper</option>
                    <option value="Cream">Cream Paper</option>
                    <option value="Premium Color">Premium Color</option>
                    <option value="Standard Color">Standard Color</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">
                    Bleed Setting
                  </label>
                  <select
                    value={bleed}
                    onChange={e => setBleed(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white"
                  >
                    <option value="No Bleed">No Bleed (Puzzles & Text)</option>
                    <option value="Bleed">Bleed (+0.125" for Artwork)</option>
                  </select>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 grid grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-neutral-500 block">Spine Width:</span>
                  <strong className="text-neutral-900 dark:text-white font-mono">{spineWidth}"</strong>
                </div>
                <div>
                  <span className="text-neutral-500 block">Min Gutter:</span>
                  <strong className="text-neutral-900 dark:text-white font-mono">{recommendedGutter}"</strong>
                </div>
                <div>
                  <span className="text-neutral-500 block">Full Cover Wrap:</span>
                  <strong className="text-neutral-900 dark:text-white font-mono">
                    {coverDims.width}" × {coverDims.height}"
                  </strong>
                </div>
              </div>
            </div>
          )}

          {/* 3. HEADERS & FOOTERS */}
          {activeTab === 'headerFooter' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-800">
                <div>
                  <strong className="text-sm font-bold text-neutral-900 dark:text-white block">
                    Enable Running Headers
                  </strong>
                  <span className="text-xs text-neutral-500">
                    Displays chapter titles or book title at top of content pages
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={headerFooter.showHeader}
                  onChange={e =>
                    setHeaderFooter({ ...headerFooter, showHeader: e.target.checked })
                  }
                  className="w-5 h-5 accent-amber-500 rounded-md cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-800">
                <div>
                  <strong className="text-sm font-bold text-neutral-900 dark:text-white block">
                    Enable Running Footers
                  </strong>
                  <span className="text-xs text-neutral-500">
                    Displays page numbers or author credits at bottom of pages
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={headerFooter.showFooter}
                  onChange={e =>
                    setHeaderFooter({ ...headerFooter, showFooter: e.target.checked })
                  }
                  className="w-5 h-5 accent-amber-500 rounded-md cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-bold text-neutral-500 block mb-1">Header Center Content</label>
                  <select
                    value={headerFooter.headerCenter}
                    onChange={e =>
                      setHeaderFooter({ ...headerFooter, headerCenter: e.target.value as any })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800"
                  >
                    <option value="section_title">Section / Chapter Title</option>
                    <option value="book_title">Book Title</option>
                    <option value="author">Author Name</option>
                    <option value="none">None</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-neutral-500 block mb-1">Footer Center Content</label>
                  <select
                    value={headerFooter.footerCenter}
                    onChange={e =>
                      setHeaderFooter({ ...headerFooter, footerCenter: e.target.value as any })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800"
                  >
                    <option value="page_number">Page Number</option>
                    <option value="book_title">Book Title</option>
                    <option value="none">None</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* 4. PAGE NUMBERS */}
          {activeTab === 'numbering' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-800">
                <div>
                  <strong className="text-sm font-bold text-neutral-900 dark:text-white block">
                    Automatic Page Numbering
                  </strong>
                  <span className="text-xs text-neutral-500">
                    Renders dynamic page numbers on all interior content pages
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={numbering.enabled}
                  onChange={e => setNumbering({ ...numbering, enabled: e.target.checked })}
                  className="w-5 h-5 accent-amber-500 rounded-md cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-bold text-neutral-500 block mb-1">Numbering Position</label>
                  <select
                    value={numbering.position}
                    onChange={e =>
                      setNumbering({ ...numbering, position: e.target.value as any })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800"
                  >
                    <option value="bottom-center">Bottom Center</option>
                    <option value="bottom-outside">Bottom Outside (Facing Margins)</option>
                    <option value="bottom-right">Bottom Right</option>
                    <option value="top-center">Top Center</option>
                    <option value="top-outside">Top Outside</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-neutral-500 block mb-1">Hide on Front Matter</label>
                  <select
                    value={numbering.hideOnFrontMatter ? 'yes' : 'no'}
                    onChange={e =>
                      setNumbering({ ...numbering, hideOnFrontMatter: e.target.value === 'yes' })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800"
                  >
                    <option value="yes">Yes (Hide on Title, Copyright, TOC)</option>
                    <option value="no">No (Show on all pages)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* 5. THEMES */}
          {activeTab === 'theme' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">
                      {theme.description}
                    </div>
                    <div className="text-[10px] font-mono text-neutral-400">
                      H: {theme.fontHeading} • B: {theme.fontBody}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 6. PRE-FLIGHT */}
          {activeTab === 'preflight' && (
            <div className="space-y-3">
              {validationReport.issues.length === 0 ? (
                <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 shrink-0" />
                  <div>
                    <strong className="text-sm block">Pre-Flight Passed!</strong>
                    <span>Your manuscript satisfies all Amazon KDP physical manufacturing standards.</span>
                  </div>
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
                      <p>{iss.message}</p>
                      {iss.fixSuggestion && (
                        <p className="text-[11px] font-semibold opacity-90 mt-1">
                          Fix: {iss.fixSuggestion}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-900/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition-all shadow-md shadow-amber-500/20 flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Apply & Save Settings</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

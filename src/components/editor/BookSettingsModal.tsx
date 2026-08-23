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
  RotateCcw,
  FileText,
  HelpCircle,
  ArrowRight,
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
  CentralizedFrontMatterConfig,
  FrontMatterConfig,
  HeaderFooterSettings,
  PageNumberingSettings,
} from '../../types/book';
import { BleedType, Orientation, Project, TrimSize } from '../../types/project';
import { KdpProjectTab } from '../kdp/KdpProjectTab';
import { FrontMatterService, DEFAULT_FRONT_MATTER_CONFIG } from '../../services/frontMatterService';

interface BookSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'metadata' | 'interior' | 'kdp' | 'trim' | 'headerFooter' | 'numbering' | 'theme' | 'preflight';
}

export const BookSettingsModal: React.FC<BookSettingsModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'interior',
}) => {
  const { activeProject, updateProject, showToast } = useApp();
  const { document, updateDocument } = useEditor();

  const [activeTab, setActiveTab] = useState<
    'metadata' | 'interior' | 'kdp' | 'trim' | 'headerFooter' | 'numbering' | 'theme' | 'preflight'
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

  const [frontMatter, setFrontMatter] = useState<FrontMatterConfig>(() =>
    FrontMatterService.normalizeConfig(activeProject?.bookSettings?.frontMatter || DEFAULT_FRONT_MATTER_CONFIG)
  );

  const [isReflowing, setIsReflowing] = useState(false);

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

    setFrontMatter(
      FrontMatterService.normalizeConfig(activeProject.bookSettings?.frontMatter || DEFAULT_FRONT_MATTER_CONFIG)
    );

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

  const handleReflowDocument = () => {
    if (!activeProject || !document) return;
    setIsReflowing(true);
    try {
      const reflowRes = FrontMatterService.reflowDocumentPages({
        project: activeProject,
        document,
        config: frontMatter,
        theme: selectedTheme,
      });

      updateDocument(reflowRes.updatedDocument);
      updateProject(reflowRes.updatedProject);

      if (reflowRes.pageCountChanged) {
        showToast({
          type: 'warning',
          title: 'Page Count Updated',
          message: `Interior reflowed from ${reflowRes.oldPageCount} to ${reflowRes.newPageCount} pages. Cover marked as OUTDATED for spine recalculation.`,
        });
      } else {
        showToast({
          type: 'success',
          title: 'Interior Reflowed',
          message: 'Front matter pages updated. Puzzles and answer keys retained without blank pages.',
        });
      }
    } catch (err: any) {
      console.error('Reflow failed:', err);
      showToast({
        type: 'error',
        title: 'Reflow Failed',
        message: err?.message || 'Could not reflow front matter pages.',
      });
    } finally {
      setIsReflowing(false);
    }
  };

  const handleSave = () => {
    let finalProject = activeProject;
    let finalDocument = document;

    // If document is present, ensure front matter reflow is synchronized
    if (document) {
      const reflowRes = FrontMatterService.reflowDocumentPages({
        project: activeProject,
        document,
        config: frontMatter,
        theme: selectedTheme,
      });
      finalProject = reflowRes.updatedProject;
      finalDocument = reflowRes.updatedDocument;
      updateDocument(finalDocument);
    }

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
      frontMatter,
      puzzleNumberingStyle: 'continuous',
    };

    const updatedProject: Project = {
      ...finalProject,
      name: metadata.title,
      description: metadata.description || activeProject.description,
      kdpSettings: {
        ...finalProject.kdpSettings,
        trimSize,
        paperType,
        bleed,
        spineWidthInches: spineWidth,
        coverWidthInches: coverDims.width,
        coverHeightInches: coverDims.height,
      },
      metadata: {
        ...finalProject.metadata,
        ...metadata,
      },
      bookSettings: updatedBookSettings,
    };

    updateProject(updatedProject);
    showToast({
      type: 'success',
      message: 'Book settings and interior saved successfully.',
    });
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
            { id: 'interior', label: 'Interior & Front Matter' },
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
          {/* INTERIOR & FRONT MATTER */}
          {activeTab === 'interior' && (
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-500" />
                    <span>Front Matter Page Configuration</span>
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    Control introductory pages in your book interior. Disabled pages are excluded completely without leaving empty or blank pages.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleReflowDocument}
                  disabled={isReflowing}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition-all shadow-xs flex items-center gap-1.5 shrink-0"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${isReflowing ? 'animate-spin' : ''}`} />
                  <span>{isReflowing ? 'Reflowing...' : 'Apply & Reflow Interior'}</span>
                </button>
              </div>

              {/* Informational banner */}
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2.5">
                <Info className="w-4 h-4 shrink-0 text-amber-500" />
                <span>Disabled pages will not be included in the generated interior.</span>
              </div>

              {/* Front matter toggles */}
              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Front Matter Pages
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    {
                      key: 'includeTitlePage',
                      label: 'Title / Opening Page',
                      desc: 'Centered book title, subtitle, author, and publisher imprint.',
                      defaultStatus: 'Default: ON',
                    },
                    {
                      key: 'includeCopyrightPage',
                      label: 'Copyright Page',
                      desc: '© notice, rights reservation, edition, and ISBN legal information.',
                      defaultStatus: 'Default: OFF',
                    },
                    {
                      key: 'includeInstructionsPage',
                      label: 'How to Solve the Puzzles',
                      desc: 'Solving rules & guidelines for each puzzle type in the book.',
                      defaultStatus: 'Default: OFF',
                    },
                    {
                      key: 'includeTableOfContents',
                      label: 'Table of Contents',
                      desc: 'Dynamic chapter & section index with page numbers.',
                      defaultStatus: 'Optional',
                    },
                    {
                      key: 'includeDisclaimerPage',
                      label: 'Disclaimer Page',
                      desc: 'Publisher disclaimer & reader informational notice.',
                      defaultStatus: 'Optional',
                    },
                  ].map(item => {
                    const isChecked = (frontMatter as any)[item.key];
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() =>
                          setFrontMatter({
                            ...frontMatter,
                            [item.key]: !isChecked,
                          })
                        }
                        className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                          isChecked
                            ? 'border-amber-500 bg-amber-500/10 shadow-xs ring-1 ring-amber-500'
                            : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-neutral-50/40 dark:bg-neutral-800/40'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          readOnly
                          className="mt-1 accent-amber-500 rounded-md"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-sm text-neutral-900 dark:text-white truncate">
                              {item.label}
                            </span>
                            <span
                              className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                                isChecked
                                  ? 'bg-amber-500 text-neutral-950'
                                  : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300'
                              }`}
                            >
                              {isChecked ? 'ON' : 'OFF'}
                            </span>
                          </div>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                            {item.desc}
                          </p>
                          <span className="inline-block mt-2 text-[10px] font-mono text-neutral-400">
                            {item.defaultStatus}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Deterministic Order Flow Banner */}
              <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
                    Deterministic Page Order (Current Selection):
                  </span>
                  <span className="text-xs text-neutral-500 font-mono">
                    Total: {document?.pages?.length || activeProject.pageCount} pages
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                  {frontMatter.includeTitlePage && (
                    <>
                      <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold border border-amber-500/30">
                        1. Title / Opening
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-neutral-400" />
                    </>
                  )}
                  {frontMatter.includeCopyrightPage && (
                    <>
                      <span className="px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-800 dark:text-blue-300 font-bold border border-blue-500/30">
                        Copyright
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-neutral-400" />
                    </>
                  )}
                  {frontMatter.includeInstructionsPage && (
                    <>
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-500/30">
                        How to Solve
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-neutral-400" />
                    </>
                  )}
                  {frontMatter.includeTableOfContents && (
                    <>
                      <span className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-800 dark:text-purple-300 font-bold border border-purple-500/30">
                        Table of Contents
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-neutral-400" />
                    </>
                  )}
                  <span className="px-2.5 py-1 rounded-lg bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200">
                    Puzzle 1
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-neutral-400" />
                  <span className="px-2.5 py-1 rounded-lg bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200">
                    Puzzle 2...
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-neutral-400" />
                  <span className="px-2.5 py-1 rounded-lg bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200">
                    Answer Key
                  </span>
                </div>
              </div>

              {/* Cover Invalidation Status if spine is outdated */}
              {activeProject?.kdpConfig?.contentVersion?.coverOutdated && (
                <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-bold text-xs uppercase tracking-wider text-amber-900 dark:text-amber-200">
                      ⚠ Cover Outdated
                    </div>
                    <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
                      {activeProject.kdpConfig.contentVersion.outdatedReason ||
                        'Page count changed. Spine width must be recalculated.'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

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

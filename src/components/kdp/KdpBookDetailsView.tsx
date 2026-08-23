import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  Check,
  Sparkles,
  RefreshCw,
  History,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  Layers,
  FileText,
  UserCheck,
  Tag,
  Search,
  ExternalLink,
  BookMarked,
  Sliders,
  Bookmark,
  Info,
  Save,
  RotateCcw,
  ArrowRight,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  KDPProjectConfig,
  KDPContributorType,
  KDPMetadataApprovalStatus,
  KDPMetadataVersionRecord,
  KDPTitleSuggestion,
  KDPSubtitleSuggestion,
  KDPCategorySuggestion,
  KDPKeywordItem,
  KDPAiContentType,
} from '../../types/kdp';
import { KDPMetadataConsistencyService } from '../../services/kdpMetadataConsistencyService';
import { KDPTitleGenerator } from '../../services/kdpTitleGenerator';
import { KDPSubtitleGenerator } from '../../services/kdpSubtitleGenerator';
import { KDPDescriptionGenerator } from '../../services/kdpDescriptionGenerator';
import { KDPKeywordGenerator } from '../../services/kdpKeywordGenerator';
import { KDPCategoryAssistant } from '../../services/kdpCategoryAssistant';
import { KDPBookDetailsValidator } from '../../services/kdpBookDetailsValidator';
import { KDPFieldMapper } from '../../services/kdpFieldMapper';

export const KdpBookDetailsView: React.FC = () => {
  const {
    projects,
    activeProject,
    setActiveProjectId,
    setCurrentRoute,
    showToast,
    settings,
    updateSettings,
    refreshProjects,
  } = useApp();

  // Pick active project or fallback to first available project
  const targetProject = activeProject || projects[0] || null;

  // Local state for all metadata fields
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [contributorType, setContributorType] = useState<KDPContributorType>('Author');
  const [contributorName, setContributorName] = useState('');
  const [description, setDescription] = useState('');
  const [descriptionMode, setDescriptionMode] = useState<'html' | 'plain'>('html');
  const [keywords, setKeywords] = useState<string[]>(['', '', '', '', '', '', '']);
  const [categories, setCategories] = useState<string[]>([]);
  const [language, setLanguage] = useState('English');
  const [readingAge, setReadingAge] = useState('Not specified');
  const [gradeRange, setGradeRange] = useState('Not specified');
  const [isPartOfSeries, setIsPartOfSeries] = useState(false);
  const [seriesName, setSeriesName] = useState('');
  const [seriesNumber, setSeriesNumber] = useState('');
  const [editionNumber, setEditionNumber] = useState('');
  const [editionNotes, setEditionNotes] = useState('');
  const [aiContentType, setAiContentType] = useState<KDPAiContentType>('Human-created');
  const [approvalStatus, setApprovalStatus] = useState<KDPMetadataApprovalStatus>('DRAFT');
  const [metadataVersions, setMetadataVersions] = useState<KDPMetadataVersionRecord[]>([]);

  // Generator & Assistant State
  const [titleSuggestions, setTitleSuggestions] = useState<KDPTitleSuggestion[]>([]);
  const [isGeneratingTitles, setIsGeneratingTitles] = useState(false);
  const [subtitleSuggestions, setSubtitleSuggestions] = useState<KDPSubtitleSuggestion[]>([]);
  const [isGeneratingSubtitles, setIsGeneratingSubtitles] = useState(false);
  const [categorySuggestions, setCategorySuggestions] = useState<KDPCategorySuggestion[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Initialize fields from active project
  useEffect(() => {
    if (targetProject) {
      const cfg: Partial<KDPProjectConfig> = targetProject.kdpConfig || {};
      const meta = targetProject.metadata || {};

      setTitle(cfg.title || targetProject.name || '');
      setSubtitle(cfg.subtitle || meta.subtitle || '');
      setAuthorName(cfg.authorName || meta.author || settings.profile?.name || 'Independent Creator');
      setContributorType(cfg.contributorType || 'Author');
      setContributorName(cfg.contributorName || '');
      setDescription(cfg.description || meta.description || targetProject.description || '');

      const initialKeywords = [...(cfg.keywords || meta.keywords || [])];
      while (initialKeywords.length < 7) {
        initialKeywords.push('');
      }
      setKeywords(initialKeywords.slice(0, 7));

      setCategories(cfg.categories && cfg.categories.length > 0 ? cfg.categories : ['Activity & Puzzle Books']);
      setLanguage(cfg.language || meta.language || 'English');
      setReadingAge(cfg.readingAge || 'Not specified');
      setGradeRange(cfg.gradeRange || 'Not specified');
      setIsPartOfSeries(cfg.isPartOfSeries || Boolean(meta.seriesName));
      setSeriesName(cfg.seriesName || meta.seriesName || '');
      setSeriesNumber(cfg.seriesNumber || '');
      setEditionNumber(cfg.editionNumber || meta.edition || '');
      setEditionNotes(cfg.editionNotes || '');
      setAiContentType(cfg.aiContentType || 'Human-created');
      setApprovalStatus(cfg.metadataApprovalStatus || 'DRAFT');
      setMetadataVersions(cfg.metadataVersions || []);

      // Load initial category suggestions
      const anyProj = targetProject as any;
      const detected = (anyProj.puzzles?.map((p: any) => p.type) || ['Word Search', 'Sudoku']) as string[];
      const catSug = KDPCategoryAssistant.suggestCategories(targetProject, detected);
      setCategorySuggestions(catSug);
    }
  }, [targetProject?.id]);

  // Detected puzzle stats
  const detectedTypes = useMemo<string[]>(() => {
    if (!targetProject) return ['Word Search', 'Sudoku'];
    const anyProj = targetProject as any;
    const pTypes = (anyProj.puzzles?.map((p: any) => p.type) || []) as string[];
    return pTypes.length > 0 ? Array.from(new Set(pTypes)) : ['Word Search', 'Sudoku', 'Crossword'];
  }, [targetProject]);

  const detectedPuzzleCount = useMemo(() => {
    if (!targetProject) return 80;
    const anyProj = targetProject as any;
    return anyProj.puzzles?.length || targetProject.pageCount || targetProject.kdpConfig?.pageCount || 80;
  }, [targetProject]);

  // Real-time project mockup for validation
  const currentProjectState = useMemo(() => {
    if (!targetProject) return null;
    return {
      ...targetProject,
      name: title || targetProject.name,
      description,
      kdpConfig: {
        ...(targetProject.kdpConfig || {}),
        bookId: targetProject.id,
        title,
        subtitle,
        authorName,
        contributorType,
        contributorName,
        description,
        keywords: keywords.filter(k => Boolean(k && k.trim())),
        categories,
        language,
        readingAge,
        gradeRange,
        isPartOfSeries,
        seriesName,
        seriesNumber,
        editionNumber,
        editionNotes,
        aiContentType,
        metadataApprovalStatus: approvalStatus,
        metadataVersions,
      } as any,
    };
  }, [
    targetProject,
    title,
    subtitle,
    authorName,
    contributorType,
    contributorName,
    description,
    keywords,
    categories,
    language,
    readingAge,
    gradeRange,
    isPartOfSeries,
    seriesName,
    seriesNumber,
    editionNumber,
    editionNotes,
    aiContentType,
    approvalStatus,
    metadataVersions,
  ]);

  // Validation Report
  const validationReport = useMemo(() => {
    if (!currentProjectState) return null;
    return KDPBookDetailsValidator.validateBookDetails(currentProjectState, null, projects);
  }, [currentProjectState, projects]);

  // Autosave current metadata to Project in LocalStorage
  const saveMetadataDraft = (newApprovalStatus?: KDPMetadataApprovalStatus) => {
    if (!targetProject || !currentProjectState) return;

    const statusToSave = newApprovalStatus || approvalStatus;

    // Create a new version record if explicitly approved or significant save
    const updatedVersions = [...metadataVersions];
    if (newApprovalStatus === 'APPROVED' || updatedVersions.length === 0) {
      const newVersion: KDPMetadataVersionRecord = {
        id: `v_${Date.now()}`,
        versionNumber: updatedVersions.length + 1,
        timestamp: new Date().toISOString(),
        title,
        subtitle,
        author: authorName,
        contributorType,
        contributorName,
        description,
        keywords: keywords.filter(k => Boolean(k && k.trim())),
        categories,
        seriesName,
        seriesNumber,
        editionNumber,
        editionNotes,
        language,
        readingAge,
        gradeRange,
        aiContentType,
        approvalStatus: statusToSave,
        userNotes: newApprovalStatus === 'APPROVED' ? 'Approved by User' : 'Draft autosave',
      };
      updatedVersions.unshift(newVersion);
      setMetadataVersions(updatedVersions);
    }

    const updatedConfig = {
      ...(targetProject.kdpConfig || {}),
      title,
      subtitle,
      authorName,
      contributorType,
      contributorName,
      description,
      keywords: keywords.filter(k => Boolean(k && k.trim())),
      categories,
      language,
      readingAge,
      gradeRange,
      isPartOfSeries,
      seriesName,
      seriesNumber,
      editionNumber,
      editionNotes,
      aiContentType,
      metadataApprovalStatus: statusToSave,
      metadataVersions: updatedVersions,
      updatedAt: new Date().toISOString(),
    };

    targetProject.kdpConfig = updatedConfig as any;
    targetProject.name = title || targetProject.name;
    targetProject.description = description;

    // Save project
    try {
      const allProjects = [...projects];
      const idx = allProjects.findIndex(p => p.id === targetProject.id);
      if (idx >= 0) {
        allProjects[idx] = { ...targetProject };
        localStorage.setItem('kdp_studio_projects', JSON.stringify(allProjects));
        refreshProjects();
      }
    } catch (e) {
      console.error('Failed to save project draft', e);
    }
  };

  // Auto-save on unmount / change debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      saveMetadataDraft();
    }, 1500);
    return () => clearTimeout(timer);
  }, [
    title,
    subtitle,
    authorName,
    description,
    keywords,
    categories,
    language,
    isPartOfSeries,
    seriesName,
    seriesNumber,
    editionNumber,
    editionNotes,
    aiContentType,
  ]);

  // Copy helper
  const handleCopyText = (text: string, fieldKey: string, label: string = 'Field') => {
    if (!text) {
      showToast({ type: 'warning', title: 'Nothing to Copy', message: `${label} is empty.` });
      return;
    }
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    showToast({ type: 'success', title: 'Copied!', message: `${label} copied to clipboard.` });
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Copy All KDP Details
  const handleCopyAll = () => {
    if (!currentProjectState) return;
    const summary = KDPFieldMapper.formatSummaryForClipboard(currentProjectState);
    navigator.clipboard.writeText(summary);
    setCopiedField('ALL');
    showToast({
      type: 'success',
      title: 'KDP Details Copied',
      message: 'All book details formatted and copied for Amazon KDP Bookshelf.',
    });
    setTimeout(() => setCopiedField(null), 2500);
  };

  // Title Generator Handler
  const handleGenerateTitles = () => {
    if (!targetProject) return;
    setIsGeneratingTitles(true);
    setTimeout(() => {
      const suggestions = KDPTitleGenerator.generateTitles(
        targetProject,
        detectedPuzzleCount,
        detectedTypes,
        projects
      );
      setTitleSuggestions(suggestions);
      setIsGeneratingTitles(false);
      showToast({
        type: 'info',
        title: 'Titles Generated',
        message: '5 policy-compliant title options created based on manuscript.',
      });
    }, 400);
  };

  // Subtitle Generator Handler
  const handleGenerateSubtitles = () => {
    if (!targetProject) return;
    setIsGeneratingSubtitles(true);
    setTimeout(() => {
      const suggestions = KDPSubtitleGenerator.generateSubtitles(
        targetProject,
        detectedPuzzleCount,
        detectedTypes
      );
      setSubtitleSuggestions(suggestions);
      setIsGeneratingSubtitles(false);
    }, 300);
  };

  // Description Generator Handler
  const handleGenerateDescription = () => {
    if (!targetProject) return;
    const generated = KDPDescriptionGenerator.generateDescription(
      currentProjectState || targetProject,
      detectedPuzzleCount,
      detectedTypes
    );
    setDescription(descriptionMode === 'html' ? generated.htmlFormatted : generated.plainText);
    showToast({
      type: 'info',
      title: 'Description Generated',
      message: `Generated description matching ${detectedPuzzleCount} detected puzzles.`,
    });
  };

  // Keyword Generator Handler
  const handleGenerateKeywords = () => {
    if (!targetProject) return;
    const sug = KDPKeywordGenerator.generateKeywords(targetProject, detectedPuzzleCount, detectedTypes);
    setKeywords(sug);
    showToast({
      type: 'info',
      title: 'Keywords Generated',
      message: '7 compliant keyword phrases prepared.',
    });
  };

  // Comprehensive Auto-Fill All KDP Details
  const handleAutoFillAll = () => {
    if (!targetProject) return;

    // 1. Title & Subtitle if empty
    if (!title.trim()) {
      const tSug = KDPTitleGenerator.generateTitles(targetProject, detectedPuzzleCount, detectedTypes, projects);
      if (tSug[0]) {
        setTitle(tSug[0].title);
        if (!subtitle.trim()) setSubtitle(tSug[0].subtitle);
      }
    }

    // 2. Author
    if (!authorName.trim()) {
      setAuthorName(settings.profile?.name || 'Independent Creator');
    }

    // 3. Description
    const descObj = KDPDescriptionGenerator.generateDescription(
      currentProjectState || targetProject,
      detectedPuzzleCount,
      detectedTypes
    );
    setDescription(descObj.htmlFormatted);

    // 4. Keywords
    const kSug = KDPKeywordGenerator.generateKeywords(targetProject, detectedPuzzleCount, detectedTypes);
    setKeywords(kSug);

    // 5. Categories
    const catSug = KDPCategoryAssistant.suggestCategories(targetProject, detectedTypes);
    if (catSug.length > 0) {
      setCategories(catSug.slice(0, 2).map(c => c.name));
    }

    // 6. Language
    setLanguage('English');

    setApprovalStatus('REVIEW');
    showToast({
      type: 'success',
      title: 'KDP Auto-Fill Ready',
      message: 'All metadata fields populated based on manuscript. Please review and approve.',
    });
  };

  // Restore Version
  const handleRestoreVersion = (ver: KDPMetadataVersionRecord) => {
    setTitle(ver.title);
    setSubtitle(ver.subtitle || '');
    setAuthorName(ver.author);
    if (ver.contributorType) setContributorType(ver.contributorType);
    if (ver.contributorName) setContributorName(ver.contributorName);
    setDescription(ver.description);
    const k = [...ver.keywords];
    while (k.length < 7) k.push('');
    setKeywords(k.slice(0, 7));
    setCategories(ver.categories);
    setLanguage(ver.language);
    setReadingAge(ver.readingAge || 'Not specified');
    setGradeRange(ver.gradeRange || 'Not specified');
    setSeriesName(ver.seriesName || '');
    setSeriesNumber(ver.seriesNumber || '');
    setEditionNumber(ver.editionNumber || '');
    setEditionNotes(ver.editionNotes || '');
    setAiContentType(ver.aiContentType || 'Human-created');
    setApprovalStatus('REVIEW');
    setShowHistoryModal(false);
    showToast({
      type: 'info',
      title: 'Version Restored',
      message: `Restored Metadata Version #${ver.versionNumber}.`,
    });
  };

  // Save Default Author
  const handleSaveDefaultAuthor = () => {
    if (!authorName.trim()) {
      showToast({ type: 'warning', title: 'Enter Author Name', message: 'Provide an author name first.' });
      return;
    }
    updateSettings({
      ...settings,
      profile: {
        ...settings.profile,
        name: authorName,
      },
    });
    showToast({
      type: 'success',
      title: 'Default Author Saved',
      message: `"${authorName}" will be auto-filled for new books.`,
    });
  };

  if (!targetProject) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center space-y-4">
        <BookOpen className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-neutral-800 dark:text-white">No Active Book Selected</h2>
        <p className="text-neutral-500 text-sm">Please select or create a book project to configure KDP Book Details.</p>
        <button
          onClick={() => setCurrentRoute('projects')}
          className="px-4 py-2 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition-colors"
        >
          View Projects
        </button>
      </div>
    );
  }

  const completionPct = validationReport?.completionPercentage || 0;
  const isDetailsReady = validationReport?.overallStatus === 'PASS' && approvalStatus === 'APPROVED';

  return (
    <div className="min-h-screen pb-24 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white">
      {/* 1. TOP KDP WORKFLOW PROGRESS BAR */}
      <div className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-4 py-3.5 sticky top-0 z-20 shadow-xs">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
          {/* Project Selector & Title */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  Phase 4 • KDP Book Details
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 font-medium">
                  {detectedPuzzleCount} Puzzles Detected
                </span>
              </div>
              <h1 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                {targetProject.name}
              </h1>
            </div>
          </div>

          {/* 5-Step Workflow Nav */}
          <div className="flex items-center gap-1 sm:gap-2 text-xs overflow-x-auto py-1">
            <button
              onClick={() => setCurrentRoute('kdp-content')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-500/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>① Book Content</span>
            </button>

            <span className="text-neutral-400">→</span>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white font-bold shadow-xs">
              <span>② Book Details</span>
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            </div>

            <span className="text-neutral-400">→</span>

            <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-neutral-400 dark:text-neutral-500">
              <span>③ Rights & Pricing</span>
            </div>

            <span className="text-neutral-400">→</span>

            <div className="flex items-center gap-1 px-2 py-1.5 text-neutral-400 dark:text-neutral-500">
              <span>④ Review</span>
            </div>

            <span className="text-neutral-400">→</span>

            <div className="flex items-center gap-1 px-2 py-1.5 text-neutral-400 dark:text-neutral-500">
              <span>⑤ Publish</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN CONTAINER */}
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* DASHBOARD HEADER CARD */}
        <div className="p-5 md:p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold font-display">KDP Book Details Dashboard</h2>
              {/* Approval status pill */}
              {approvalStatus === 'APPROVED' ? (
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                </span>
              ) : approvalStatus === 'REVIEW' ? (
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5" /> Under Review
                </span>
              ) : (
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1">
                  <Sliders className="w-3.5 h-3.5" /> Draft
                </span>
              )}
            </div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Prepare, calibrate, and validate all Amazon KDP metadata fields from actual manuscript interior and cover assets.
            </p>

            {/* Progress Bar */}
            <div className="space-y-1.5 pt-2 max-w-md">
              <div className="flex justify-between text-xs font-medium text-neutral-600 dark:text-neutral-300">
                <span>Metadata Readiness</span>
                <span className="font-bold">{completionPct}% Complete</span>
              </div>
              <div className="w-full h-2 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    completionPct >= 90
                      ? 'bg-emerald-500'
                      : completionPct >= 60
                      ? 'bg-amber-500'
                      : 'bg-blue-500'
                  }`}
                  style={{ width: `${completionPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setShowHistoryModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/60 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-semibold transition-colors"
            >
              <History className="w-4 h-4 text-neutral-500" />
              <span>History ({metadataVersions.length})</span>
            </button>

            <button
              onClick={handleCopyAll}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-blue-500/30 bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-xs font-bold transition-colors"
            >
              {copiedField === 'ALL' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              <span>{copiedField === 'ALL' ? 'Copied Everything!' : 'Copy All KDP Details'}</span>
            </button>

            <button
              onClick={() => saveMetadataDraft('APPROVED')}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold shadow-xs transition-colors ${
                approvalStatus === 'APPROVED'
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 hover:opacity-90'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{approvalStatus === 'APPROVED' ? 'Metadata Approved ✓' : 'Approve Metadata'}</span>
            </button>
          </div>
        </div>

        {/* 3. AUTO-FILL ASSISTANT & CONSISTENCY SUMMARY BANNER */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Assistant Box */}
          <div className="lg:col-span-2 p-5 rounded-2xl bg-gradient-to-br from-blue-500/5 via-neutral-50 dark:via-neutral-900 to-amber-500/5 border border-blue-500/20 dark:border-blue-500/30 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-bold text-sm">
                <Sparkles className="w-4 h-4" />
                <span>KDP AUTO-FILL ASSISTANT</span>
              </div>
              <span className="text-xs text-neutral-500">Auto-detected from manuscript</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-xs">
              <div className="p-2 rounded-xl bg-white/80 dark:bg-neutral-800/80 border border-neutral-200/60 dark:border-neutral-700/60 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="truncate">Content: {detectedPuzzleCount} pz</span>
              </div>
              <div className="p-2 rounded-xl bg-white/80 dark:bg-neutral-800/80 border border-neutral-200/60 dark:border-neutral-700/60 flex items-center gap-1.5">
                {title.trim() ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                )}
                <span className="truncate">Title {title.trim() ? 'Ready' : 'Draft'}</span>
              </div>
              <div className="p-2 rounded-xl bg-white/80 dark:bg-neutral-800/80 border border-neutral-200/60 dark:border-neutral-700/60 flex items-center gap-1.5">
                {authorName.trim() ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                )}
                <span className="truncate">Author {authorName.trim() ? 'Set' : 'Empty'}</span>
              </div>
              <div className="p-2 rounded-xl bg-white/80 dark:bg-neutral-800/80 border border-neutral-200/60 dark:border-neutral-700/60 flex items-center gap-1.5">
                {description.trim() ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                )}
                <span className="truncate">Description</span>
              </div>
              <div className="p-2 rounded-xl bg-white/80 dark:bg-neutral-800/80 border border-neutral-200/60 dark:border-neutral-700/60 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="truncate">Keywords ({keywords.filter(Boolean).length}/7)</span>
              </div>
              <div className="p-2 rounded-xl bg-white/80 dark:bg-neutral-800/80 border border-neutral-200/60 dark:border-neutral-700/60 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="truncate">Categories ({categories.length})</span>
              </div>
              <div className="p-2 rounded-xl bg-white/80 dark:bg-neutral-800/80 border border-neutral-200/60 dark:border-neutral-700/60 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="truncate">Lang: {language}</span>
              </div>
              <div className="p-2 rounded-xl bg-white/80 dark:bg-neutral-800/80 border border-neutral-200/60 dark:border-neutral-700/60 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="truncate">AI Disclosure</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                onClick={handleAutoFillAll}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Auto-Fill All KDP Fields</span>
              </button>

              <a
                href="https://kdp.amazon.com/bookshelf"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-750 text-xs font-semibold text-neutral-700 dark:text-neutral-200 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5 text-neutral-500" />
                <span>Open Amazon KDP Bookshelf</span>
              </a>
            </div>
          </div>

          {/* Consistency Engine Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Consistency Engine</span>
              </h3>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  validationReport?.consistency.isConsistent
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'bg-red-500/10 text-red-600 dark:text-red-400'
                }`}
              >
                {validationReport?.consistency.isConsistent ? 'Consistent ✓' : 'Mismatch Found'}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              {validationReport?.consistency.checks.map(chk => (
                <div key={chk.id} className="flex items-start gap-2">
                  {chk.passed ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                  ) : chk.severity === 'ERROR' ? (
                    <XCircle className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                  )}
                  <div className="leading-tight">
                    <span className="font-medium text-neutral-700 dark:text-neutral-200">{chk.label}: </span>
                    <span className="text-neutral-500 dark:text-neutral-400">{chk.message}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 4. SECTION: TITLE & SUBTITLE */}
        <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
            <div>
              <h3 className="text-base font-bold flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-blue-500" />
                <span>1. Book Title & Subtitle</span>
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Must accurately describe your manuscript and match the physical book cover exactly.
              </p>
            </div>
            <button
              onClick={handleGenerateTitles}
              disabled={isGeneratingTitles}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-xs font-bold hover:bg-blue-100 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isGeneratingTitles ? 'Generating...' : 'Generate 5 Titles'}</span>
            </button>
          </div>

          {/* Title Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                Book Title <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-400">{title.length}/200</span>
                <button
                  onClick={() => handleCopyText(title, 'title', 'Title')}
                  className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
                  title="Copy Title"
                >
                  {copiedField === 'title' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. The Ultimate Word Search Challenge for Adults"
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Title Suggestions Drawer (if generated) */}
          {titleSuggestions.length > 0 && (
            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-neutral-700 dark:text-neutral-300">
                <span>Suggested Titles based on your {detectedPuzzleCount} puzzles</span>
                <button onClick={() => setTitleSuggestions([])} className="text-neutral-400 hover:text-neutral-600">
                  Dismiss
                </button>
              </div>
              <div className="space-y-2">
                {titleSuggestions.map((sug, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:border-blue-500/50 transition-colors"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-neutral-900 dark:text-white">{sug.title}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-semibold">
                          {sug.style}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">{sug.subtitle}</p>
                      <p className="text-[11px] text-neutral-400 dark:text-neutral-500 italic">{sug.reason}</p>
                    </div>
                    <button
                      onClick={() => {
                        setTitle(sug.title);
                        if (!subtitle || subtitle.length < 5) setSubtitle(sug.subtitle);
                        showToast({ type: 'success', title: 'Applied', message: 'Title & Subtitle updated.' });
                      }}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shrink-0 transition-colors"
                    >
                      Use This
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Subtitle Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                Subtitle <span className="text-neutral-400 font-normal">(Optional)</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-400">{subtitle.length}/200</span>
                <button
                  onClick={() => handleCopyText(subtitle, 'subtitle', 'Subtitle')}
                  className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
                  title="Copy Subtitle"
                >
                  {copiedField === 'subtitle' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            <input
              type="text"
              value={subtitle}
              onChange={e => setSubtitle(e.target.value)}
              placeholder="e.g. 500 Fun & Challenging Puzzles for Adults with Full Solutions"
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* 5. SECTION: AUTHOR & CONTRIBUTORS */}
        <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
            <div>
              <h3 className="text-base font-bold flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-500" />
                <span>2. Author & Primary Creators</span>
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Specify the primary pen name or imprint name appearing on the book.
              </p>
            </div>
            <button
              onClick={handleSaveDefaultAuthor}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-semibold hover:bg-neutral-100 transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save as Default Author</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Primary Author */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                  Primary Author / Pen Name <span className="text-red-500">*</span>
                </label>
                <button
                  onClick={() => handleCopyText(authorName, 'author', 'Author')}
                  className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
                >
                  {copiedField === 'author' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <input
                type="text"
                value={authorName}
                onChange={e => setAuthorName(e.target.value)}
                placeholder="e.g. BrainSpark Press"
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Contributor Role & Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                Additional Contributor (Optional)
              </label>
              <div className="flex gap-2">
                <select
                  value={contributorType}
                  onChange={e => setContributorType(e.target.value as KDPContributorType)}
                  className="px-2.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-semibold"
                >
                  <option value="Author">Author</option>
                  <option value="Illustrator">Illustrator</option>
                  <option value="Editor">Editor</option>
                  <option value="Translator">Translator</option>
                  <option value="Other">Other</option>
                </select>
                <input
                  type="text"
                  value={contributorName}
                  onChange={e => setContributorName(e.target.value)}
                  placeholder="Contributor name..."
                  className="flex-1 px-3 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-medium"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 6. SECTION: SERIES & EDITION (OPTIONAL) */}
        <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-5">
          <div className="border-b border-neutral-100 dark:border-neutral-800 pb-3">
            <h3 className="text-base font-bold flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-500" />
              <span>3. Series & Edition Information</span>
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Only provide series information if this book is part of an official numbered collection.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Series */}
            <div className="space-y-3 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isPartOfSeries"
                  checked={isPartOfSeries}
                  onChange={e => setIsPartOfSeries(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="isPartOfSeries" className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                  This book is part of a series
                </label>
              </div>

              {isPartOfSeries && (
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div className="col-span-2 space-y-1">
                    <label className="text-[11px] font-bold text-neutral-500">Series Title</label>
                    <input
                      type="text"
                      value={seriesName}
                      onChange={e => setSeriesName(e.target.value)}
                      placeholder="e.g. Master Minds Collection"
                      className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-medium"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-neutral-500">Book #</label>
                    <input
                      type="text"
                      value={seriesNumber}
                      onChange={e => setSeriesNumber(e.target.value)}
                      placeholder="1"
                      className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-medium text-center"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Edition */}
            <div className="space-y-3 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800">
              <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200">Edition Information (Optional)</div>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-neutral-500">Edition #</label>
                  <input
                    type="text"
                    value={editionNumber}
                    onChange={e => setEditionNumber(e.target.value)}
                    placeholder="1"
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-medium text-center"
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-[11px] font-bold text-neutral-500">Edition Description</label>
                  <input
                    type="text"
                    value={editionNotes}
                    onChange={e => setEditionNotes(e.target.value)}
                    placeholder="e.g. Large Print Edition"
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-medium"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 7. SECTION: DESCRIPTION GENERATOR */}
        <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
            <div>
              <h3 className="text-base font-bold flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-500" />
                <span>4. Book Description</span>
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Formatted for Amazon's product detail page. Supports standard bold tags and bulleted lists.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleGenerateDescription}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-500/20 text-xs font-bold hover:bg-purple-100 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate Description</span>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs">
                <button
                  onClick={() => setDescriptionMode('html')}
                  className={`px-2.5 py-1 rounded-lg font-bold ${
                    descriptionMode === 'html'
                      ? 'bg-purple-600 text-white'
                      : 'text-neutral-500 hover:text-neutral-800'
                  }`}
                >
                  HTML Format (Recommended for KDP)
                </button>
                <button
                  onClick={() => setDescriptionMode('plain')}
                  className={`px-2.5 py-1 rounded-lg font-bold ${
                    descriptionMode === 'plain'
                      ? 'bg-purple-600 text-white'
                      : 'text-neutral-500 hover:text-neutral-800'
                  }`}
                >
                  Plain Text
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-400">{description.length}/4000 chars</span>
                <button
                  onClick={() => handleCopyText(description, 'desc', 'Description')}
                  className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
                  title="Copy Description"
                >
                  {copiedField === 'desc' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <textarea
              rows={8}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Enter or generate a comprehensive, attractive book description..."
              className="w-full p-3.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* 8. SECTION: 7 BACKEND KEYWORDS */}
        <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
            <div>
              <h3 className="text-base font-bold flex items-center gap-2">
                <Search className="w-4 h-4 text-emerald-500" />
                <span>5. Seven Backend Keywords</span>
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Amazon provides 7 slots (up to 50 characters each). Avoid competitor brand names or keyword stuffing.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleGenerateKeywords}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold hover:bg-emerald-100 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate 7 Keywords</span>
              </button>
              <button
                onClick={() => handleCopyText(keywords.filter(Boolean).join(', '), 'all_keys', 'Keywords')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-bold hover:bg-neutral-50 dark:hover:bg-neutral-800"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy All</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {keywords.map((kw, i) => {
              const evalItem: KDPKeywordItem = KDPKeywordGenerator.evaluateKeyword(kw, keywords);
              return (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700/80 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-[11px] font-bold text-neutral-500">
                    <span>Keyword Slot #{i + 1}</span>
                    <div className="flex items-center gap-2">
                      <span className={kw.length > 50 ? 'text-red-500 font-bold' : 'text-neutral-400'}>
                        {kw.length}/50
                      </span>
                      {kw.trim() && (
                        <span
                          className={`px-1.5 py-0.2 rounded-md text-[10px] ${
                            evalItem.quality === 'GOOD'
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                              : evalItem.quality === 'REVIEW'
                              ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                              : 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300'
                          }`}
                        >
                          {evalItem.quality}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={60}
                      value={kw}
                      onChange={e => {
                        const next = [...keywords];
                        next[i] = e.target.value;
                        setKeywords(next);
                      }}
                      placeholder={`e.g. brain games for seniors with solutions`}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    <button
                      onClick={() => handleCopyText(kw, `kw_${i}`, `Keyword #${i + 1}`)}
                      className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
                      title="Copy this keyword"
                    >
                      {copiedField === `kw_${i}` ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {evalItem.reason && (
                    <p className="text-[10px] text-amber-600 dark:text-amber-400">{evalItem.reason}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 9. SECTION: CATEGORIES & TARGETING */}
        <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-5">
          <div className="border-b border-neutral-100 dark:border-neutral-800 pb-3">
            <h3 className="text-base font-bold flex items-center gap-2">
              <Tag className="w-4 h-4 text-amber-500" />
              <span>6. Categories, Language & Targeting</span>
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Select Amazon categories and specify publishing language.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Category selection */}
            <div className="md:col-span-2 space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                Selected Categories ({categories.length}/3)
              </label>

              <div className="flex flex-wrap gap-2">
                {categories.map((c, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border border-amber-500/30 text-xs font-semibold"
                  >
                    <span>{c}</span>
                    <button
                      onClick={() => setCategories(categories.filter((_, idx) => idx !== i))}
                      className="hover:text-red-500 ml-1 font-bold"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              {/* Suggestions */}
              <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 space-y-2">
                <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">Suggested Categories (KDP Standard)</span>
                <div className="space-y-1.5">
                  {categorySuggestions.map((cat, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-xs p-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700/60"
                    >
                      <div>
                        <div className="font-bold text-neutral-900 dark:text-white">{cat.name}</div>
                        <div className="text-[11px] text-neutral-500">{cat.path}</div>
                      </div>
                      <button
                        onClick={() => {
                          if (!categories.includes(cat.name) && categories.length < 3) {
                            setCategories([...categories, cat.name]);
                          }
                        }}
                        disabled={categories.includes(cat.name) || categories.length >= 3}
                        className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] disabled:opacity-40"
                      >
                        {categories.includes(cat.name) ? 'Selected' : 'Add'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Language & Age */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                  Publishing Language <span className="text-red-500">*</span>
                </label>
                <select
                  value={language}
                  onChange={e => setLanguage(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-bold"
                >
                  <option value="English">English</option>
                  <option value="Spanish">Spanish (Español)</option>
                  <option value="French">French (Français)</option>
                  <option value="German">German (Deutsch)</option>
                  <option value="Italian">Italian (Italiano)</option>
                  <option value="Portuguese">Portuguese (Português)</option>
                  <option value="Hindi">Hindi (हिन्दी)</option>
                  <option value="Japanese">Japanese (日本語)</option>
                  <option value="Dutch">Dutch (Nederlands)</option>
                  <option value="Polish">Polish (Polski)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                  Reading Age
                </label>
                <select
                  value={readingAge}
                  onChange={e => setReadingAge(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-semibold"
                >
                  <option value="Not specified">Not specified (General / Adult)</option>
                  <option value="Adults (18+)">Adults (18+)</option>
                  <option value="Seniors">Seniors (Large Print)</option>
                  <option value="Teens (13-17)">Teens (13–17)</option>
                  <option value="Kids 9-12">Kids 9–12</option>
                  <option value="Kids 6-8">Kids 6–8</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                  AI Content Declaration
                </label>
                <select
                  value={aiContentType}
                  onChange={e => setAiContentType(e.target.value as KDPAiContentType)}
                  className="w-full px-3 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-semibold"
                >
                  <option value="Human-created">Human-created Content</option>
                  <option value="AI-assisted">AI-assisted Content</option>
                  <option value="AI-generated">AI-generated Content</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 10. STICKY BOTTOM ACTION BAR (MOBILE & DESKTOP OPTIMIZED) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-t border-neutral-200 dark:border-neutral-800 px-4 py-3 z-30 shadow-lg">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">Status:</span>
              {isDetailsReady ? (
                <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>🟢 BOOK DETAILS READY</span>
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span>🟡 {approvalStatus === 'APPROVED' ? 'Validation Incomplete' : 'Approval Required'}</span>
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCopyAll}
              className="px-4 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-100 text-xs font-bold text-neutral-800 dark:text-white transition-colors"
            >
              {copiedField === 'ALL' ? '✓ Copied' : 'Copy All Details'}
            </button>

            <button
              onClick={() => {
                saveMetadataDraft('APPROVED');
                showToast({
                  type: 'info',
                  title: 'Advancing Workflow',
                  message: 'Book Details approved. Proceeding to Rights & Pricing.',
                });
                // In future phases: navigate to 'kdp-pricing'
              }}
              disabled={!isDetailsReady && approvalStatus !== 'APPROVED'}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all ${
                isDetailsReady || approvalStatus === 'APPROVED'
                  ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                  : 'bg-neutral-300 dark:bg-neutral-800 text-neutral-500 cursor-not-allowed'
              }`}
            >
              <span>Continue to Rights & Pricing</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 11. VERSION HISTORY MODAL */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <History className="w-5 h-5 text-blue-500" />
                <span>Metadata Version History</span>
              </h3>
              <button onClick={() => setShowHistoryModal(false)} className="text-neutral-400 hover:text-neutral-600">
                ✕
              </button>
            </div>

            {metadataVersions.length === 0 ? (
              <p className="text-xs text-neutral-500 py-6 text-center">No previous metadata revisions recorded.</p>
            ) : (
              <div className="space-y-3">
                {metadataVersions.map(ver => (
                  <div
                    key={ver.id}
                    className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-neutral-900 dark:text-white">
                        Version #{ver.versionNumber} • {ver.approvalStatus}
                      </span>
                      <span className="text-[11px] text-neutral-400">
                        {new Date(ver.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="font-semibold text-neutral-800 dark:text-neutral-200">
                      Title: {ver.title || 'Untitled'}
                    </p>
                    <p className="text-neutral-500 line-clamp-2">
                      Description: {ver.description || 'None'}
                    </p>
                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => handleRestoreVersion(ver)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Restore This Version</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

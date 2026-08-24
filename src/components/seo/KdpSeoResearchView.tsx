import React, { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Sparkles,
  Wand2,
  Copy,
  Check,
  Download,
  Upload,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Info,
  Layers,
  FileText,
  BookOpen,
  Filter,
  Trash2,
  Plus,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  Flame,
  HelpCircle,
  X,
  FileSpreadsheet,
  Eye,
  Sliders,
  Send,
  History,
  Save,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Project } from '../../types/project';
import {
  KdpCompetitorAnalysisItem,
  KdpDescriptionSeoAnalysis,
  KdpKeywordCluster,
  KdpMarketplaceConfig,
  KdpOneClickSeoProposal,
  KdpSearchIntent,
  KdpSeoHistorySession,
  KdpSeoKeyword,
  KdpSeoResearchReport,
  KdpSevenBoxesOptimization,
  KdpTitleSeoAnalysis,
  OverallKdpSeoBreakdown,
} from '../../types/seo';
import { KeywordResearchService } from '../../services/seo/KeywordResearchService';
import { KeywordOptimizationService } from '../../services/seo/KeywordOptimizationService';
import { KeywordClusterService } from '../../services/seo/KeywordClusterService';
import { SEOAnalysisService } from '../../services/seo/SEOAnalysisService';
import { GoogleDocsService } from '../../services/googleDocsService';
import { GoogleAuthService } from '../../services/googleAuthService';

// Subcomponents
import { KdpSeoBreakdownCard } from './KdpSeoBreakdownCard';
import { KdpSeoKeywordTable } from './KdpSeoKeywordTable';
import { KdpSevenBoxesEditor } from './KdpSevenBoxesEditor';
import { KdpSeoClusterManager } from './KdpSeoClusterManager';
import { KdpTitleDescriptionAnalyzers } from './KdpTitleDescriptionAnalyzers';
import { KdpOneClickOptimizationModal } from './KdpOneClickOptimizationModal';
import { KdpSeoHistoryDrawer } from './KdpSeoHistoryDrawer';

export const KdpSeoResearchView: React.FC = () => {
  const {
    projects,
    activeProjectId,
    setActiveProjectId,
    activeProject,
    updateProject,
    showToast,
    setCurrentRoute,
  } = useApp();

  const currentProject: Project | null = useMemo(() => {
    if (activeProject) return activeProject;
    if (projects.length > 0) return projects[0];
    return null;
  }, [activeProject, projects]);

  // Form State
  const [bookTitle, setBookTitle] = useState(currentProject?.name || 'Relaxing Word Search Puzzles for Adults');
  const [bookSubtitle, setBookSubtitle] = useState(
    currentProject?.metadata?.subtitle || '100 Large Print Brain Games with Full Solutions'
  );
  const [bookDescription, setBookDescription] = useState(
    currentProject?.metadata?.description ||
      'Immerse yourself in hours of engaging mental stimulation designed specifically for adults and seniors. Features clear large print, soothing themes, and full answers in the back.'
  );
  const [bookType, setBookType] = useState((currentProject?.kdpSettings as any)?.bookType || currentProject?.type || 'Puzzle Book');
  const [puzzleType, setPuzzleType] = useState((currentProject?.metadata as any)?.puzzleType || 'Word Search');
  const [theme, setTheme] = useState((currentProject?.metadata as any)?.theme || 'Relaxing');
  const [audience, setAudience] = useState(currentProject?.metadata?.targetAudience || 'Adults & Seniors');
  const [difficulty, setDifficulty] = useState((currentProject?.metadata as any)?.difficulty || 'Easy to Medium');
  const [format, setFormat] = useState((currentProject?.kdpSettings as any)?.format || 'Paperback');
  const [language, setLanguage] = useState(currentProject?.metadata?.language || 'English');
  const [marketplaceId, setMarketplaceId] = useState('com');
  const [seedKeyword, setSeedKeyword] = useState('word search puzzles');

  // Active Tab
  const [activeTab, setActiveTab] = useState<'table' | 'seven_boxes' | 'clusters' | 'title_desc' | 'avoid'>('table');

  // Pipeline Data State
  const [keywords, setKeywords] = useState<KdpSeoKeyword[]>([]);
  const [sevenBoxes, setSevenBoxes] = useState<KdpSevenBoxesOptimization>(() =>
    KeywordOptimizationService.optimizeSevenBoxes([], currentProject)
  );
  const [breakdown, setBreakdown] = useState<OverallKdpSeoBreakdown>({
    overallScore: 78,
    keywordQualityScore: 82,
    titleScore: 75,
    subtitleScore: 80,
    descriptionScore: 76,
    keywordCoverageScore: 80,
    contentMatchScore: 85,
    riskLevel: 'LOW RISK',
    scoreGrade: 'Strong',
  });
  const [titleAnalysis, setTitleAnalysis] = useState<KdpTitleSeoAnalysis>(() =>
    SEOAnalysisService.analyzeTitle({ title: bookTitle, subtitle: bookSubtitle, project: currentProject })
  );
  const [descriptionAnalysis, setDescriptionAnalysis] = useState<KdpDescriptionSeoAnalysis>(() =>
    SEOAnalysisService.analyzeDescription({ description: bookDescription, project: currentProject })
  );

  // Avoid List & Competitor State
  const [avoidList, setAvoidList] = useState<{ keyword: string; reason: string }[]>([
    { keyword: 'new york times crossword', reason: 'Competitor Trademark risk' },
    { keyword: 'rubik cube brain teasers', reason: 'Trademark risk' },
    { keyword: '#1 best seller on amazon', reason: 'Unsupported promotional claim' },
    { keyword: 'free kindle unlimited', reason: 'Misleading claim' },
  ]);
  const [customAvoidKeyword, setCustomAvoidKeyword] = useState('');
  const [customAvoidReason, setCustomAvoidReason] = useState('Trademark risk');

  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncingGoogleDoc, setIsSyncingGoogleDoc] = useState(false);
  const [historySessions, setHistorySessions] = useState<KdpSeoHistorySession[]>([]);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [oneClickProposal, setOneClickProposal] = useState<KdpOneClickSeoProposal | null>(null);
  const [isOneClickModalOpen, setIsOneClickModalOpen] = useState(false);

  // Helper toast dispatcher
  const notify = (title: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    if (showToast) {
      showToast({ type, title, message: title });
    }
  };

  // Initialize from project
  useEffect(() => {
    if (currentProject) {
      setBookTitle(currentProject.name);
      setBookSubtitle(currentProject.metadata?.subtitle || '');
      setBookDescription(
        currentProject.metadata?.description ||
          'Immerse yourself in hours of engaging mental stimulation designed specifically for adults and seniors.'
      );
      setBookType((currentProject.kdpSettings as any)?.bookType || currentProject.type || 'Puzzle Book');
      setPuzzleType((currentProject.metadata as any)?.puzzleType || 'Word Search');
      setTheme((currentProject.metadata as any)?.theme || 'Relaxing');
      setAudience(currentProject.metadata?.targetAudience || 'Adults & Seniors');
      setDifficulty((currentProject.metadata as any)?.difficulty || 'Easy to Medium');
      setLanguage(currentProject.metadata?.language || 'English');

      handleRunDiscovery();
    }
    setHistorySessions(KeywordResearchService.getHistory());
  }, [currentProject?.id]);

  // Execute keyword discovery pipeline
  const handleRunDiscovery = async () => {
    setIsLoading(true);
    try {
      const result = await KeywordResearchService.runDiscoveryPipeline({
        seed: seedKeyword,
        bookTitle,
        subtitle: bookSubtitle,
        description: bookDescription,
        theme,
        audience,
        puzzleType,
        difficulty,
        format,
        language,
        marketplace: marketplaceId,
        project: currentProject,
      });

      setKeywords(result.keywords);
      setSevenBoxes(result.sevenBoxes);
      setBreakdown(result.breakdown);
      setTitleAnalysis(result.titleAnalysis);
      setDescriptionAnalysis(result.descriptionAnalysis);

      // Auto save session
      KeywordResearchService.saveSessionToHistory({
        projectId: currentProject?.id || 'default',
        projectTitle: bookTitle,
        seedKeyword,
        marketplace: marketplaceId,
        language,
        overallScore: result.breakdown.overallScore,
        keywordCount: result.keywords.length,
        topKeywords: result.keywords.slice(0, 5).map(k => k.keyword),
        sevenBoxesPhrases: result.sevenBoxes.boxes.map(b => b.phrase),
        keywords: result.keywords,
        sevenBoxes: result.sevenBoxes,
      });
      setHistorySessions(KeywordResearchService.getHistory());

      notify('Keyword discovery and SEO scoring updated', 'success');
    } catch (err: any) {
      notify(`Error running discovery: ${err?.message || 'Unknown'}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Generate Long-Tails
  const handleGenerateLongTails = async () => {
    setIsLoading(true);
    try {
      const result = await KeywordResearchService.runDiscoveryPipeline({
        seed: `${seedKeyword} long tail`,
        bookTitle,
        subtitle: bookSubtitle,
        description: bookDescription,
        theme,
        audience,
        puzzleType,
        difficulty,
        format,
        language,
        marketplace: marketplaceId,
        project: currentProject,
      });

      // Merge unique
      const existingMap = new Map(keywords.map(k => [k.keyword.toLowerCase(), k]));
      result.keywords.forEach(k => {
        if (!existingMap.has(k.keyword.toLowerCase())) {
          existingMap.set(k.keyword.toLowerCase(), k);
        }
      });

      const merged = Array.from(existingMap.values());
      setKeywords(merged);
      const newBoxes = KeywordOptimizationService.optimizeSevenBoxes(merged, currentProject);
      setSevenBoxes(newBoxes);
      notify(`Generated ${result.keywords.length} long-tail search variations`, 'success');
    } finally {
      setIsLoading(false);
    }
  };

  // One-Click Proposal Workflow
  const handleOpenOneClickModal = () => {
    const proposal = SEOAnalysisService.generateOneClickProposal({
      project: currentProject,
      currentTitle: bookTitle,
      currentSubtitle: bookSubtitle,
      currentDescription: bookDescription,
      keywords,
    });
    setOneClickProposal(proposal);
    setIsOneClickModalOpen(true);
  };

  const handleApplyOneClickDecisions = (decisions: {
    applyTitle: boolean;
    applySubtitle: boolean;
    applyDescription: boolean;
    applyKeywords: boolean;
    proposal: KdpOneClickSeoProposal;
  }) => {
    if (decisions.applyTitle) setBookTitle(decisions.proposal.proposedTitle);
    if (decisions.applySubtitle) setBookSubtitle(decisions.proposal.proposedSubtitle);
    if (decisions.applyDescription) setBookDescription(decisions.proposal.proposedDescription);
    if (decisions.applyKeywords) {
      const updatedBoxes = KeywordOptimizationService.evaluateBoxesCollection(
        decisions.proposal.proposedSevenBoxes.map((phrase, idx) => ({
          slotNumber: idx + 1,
          phrase,
          charCount: phrase.length,
          charLimit: 50,
          keywordsIncluded: [phrase],
          relevanceScore: 95,
          warnings: [],
          isCompliant: phrase.length <= 50,
        }))
      );
      setSevenBoxes(updatedBoxes);
    }

    if (currentProject) {
      updateProject({
        ...currentProject,
        name: decisions.applyTitle ? decisions.proposal.proposedTitle : currentProject.name,
        metadata: {
          ...currentProject.metadata,
          subtitle: decisions.applySubtitle ? decisions.proposal.proposedSubtitle : currentProject.metadata?.subtitle,
          description: decisions.applyDescription ? decisions.proposal.proposedDescription : currentProject.metadata?.description,
          keywords: decisions.applyKeywords ? decisions.proposal.proposedSevenBoxes : (currentProject.metadata as any)?.keywords,
        },
      });
    }

    notify('Applied selected SEO optimizations to project metadata', 'success');
  };

  // Sync to Google Docs Section 13
  const handleSyncToGoogleDoc = async () => {
    if (!currentProject) {
      notify('No active project to synchronize', 'error');
      return;
    }

    setIsSyncingGoogleDoc(true);
    try {
      const token = await GoogleAuthService.getAccessToken();
      if (!token) {
        notify('Please connect your Google Account first in Google Docs sync', 'error');
        return;
      }

      const googleDocId = (currentProject.metadata as any)?.googleDocId;
      if (googleDocId) {
        await GoogleDocsService.updateBookDoc(currentProject, googleDocId, token);
      } else {
        await GoogleDocsService.createBookDoc(currentProject, token);
      }
      notify('Successfully synchronized SEO research into Google Doc Section 13', 'success');
    } catch (err: any) {
      notify(`Failed to sync with Google Doc: ${err?.message || 'Error'}`, 'error');
    } finally {
      setIsSyncingGoogleDoc(false);
    }
  };

  // CSV Export
  const handleExportCsv = () => {
    const csvContent = KeywordResearchService.generateCsvContent(keywords);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `KDP-SEO-Keyword-Research-${bookTitle.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify('Exported keyword research to CSV', 'success');
  };

  // TXT Export
  const handleExportTxt = () => {
    const txtContent = KeywordOptimizationService.generateExportText(sevenBoxes.boxes);
    const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `KDP-7-Keywords-${bookTitle.replace(/\s+/g, '_')}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify('Exported 7 KDP Keyword Boxes to TXT', 'success');
  };

  // Cluster operations
  const clusterGroups = useMemo(() => {
    return KeywordClusterService.groupIntoClusters(keywords);
  }, [keywords]);

  const clustersList = useMemo(() => {
    const set = new Set<string>(KeywordClusterService.DEFAULT_CLUSTERS);
    clusterGroups.forEach(g => set.add(g.cluster));
    return Array.from(set);
  }, [clusterGroups]);

  return (
    <div id="kdp-seo-research-page" className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">KDP SEO & Keyword Research Engine</h1>
              <p className="text-xs text-slate-500">
                Discover, evaluate, organize, and optimize search discoverability for Amazon Kindle Direct Publishing.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            id="btn-open-history"
            onClick={() => setIsHistoryDrawerOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-lg text-xs shadow-xs transition-colors"
          >
            <History className="w-4 h-4 text-slate-500" />
            History ({historySessions.length})
          </button>

          <button
            id="btn-sync-google-doc-seo"
            onClick={handleSyncToGoogleDoc}
            disabled={isSyncingGoogleDoc}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-lg text-xs shadow-xs transition-colors disabled:opacity-50"
          >
            {isSyncingGoogleDoc ? <RefreshCw className="w-4 h-4 animate-spin text-amber-600" /> : <FileText className="w-4 h-4 text-blue-600" />}
            Sync to Google Doc
          </button>

          <button
            id="btn-one-click-optimize-top"
            onClick={handleOpenOneClickModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold rounded-lg text-xs shadow-sm transition-all"
          >
            <Sparkles className="w-4 h-4" />
            One-Click Optimize
          </button>
        </div>
      </div>

      {/* Input Parameters Box */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
            Book Metadata & Search Parameters
          </h2>
          <span className="text-xs text-slate-400">
            Project: <strong className="text-slate-700">{currentProject?.name || 'Default'}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Book Title */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Book Title</label>
            <input
              type="text"
              value={bookTitle}
              onChange={e => setBookTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Subtitle */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Subtitle</label>
            <input
              type="text"
              value={bookSubtitle}
              onChange={e => setBookSubtitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Puzzle Type */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Puzzle Type</label>
            <input
              type="text"
              value={puzzleType}
              onChange={e => setPuzzleType(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Theme */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Theme</label>
            <input
              type="text"
              value={theme}
              onChange={e => setTheme(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Audience */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Target Audience</label>
            <input
              type="text"
              value={audience}
              onChange={e => setAudience(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Difficulty */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Difficulty</label>
            <input
              type="text"
              value={difficulty}
              onChange={e => setDifficulty(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Language */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Language</label>
            <input
              type="text"
              value={language}
              onChange={e => setLanguage(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Marketplace */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Target Marketplace</label>
            <select
              value={marketplaceId}
              onChange={e => setMarketplaceId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
            >
              {KeywordResearchService.MARKETPLACES.map(m => (
                <option key={m.id} value={m.id}>
                  {m.flag} {m.name} ({m.domain})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Seed Keyword Input Bar & Primary Action Buttons */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full max-w-lg">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              id="input-seed-keyword"
              type="text"
              value={seedKeyword}
              onChange={e => setSeedKeyword(e.target.value)}
              placeholder="Enter seed keyword (e.g. word search puzzles, sudoku for seniors)..."
              className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              id="btn-search-keywords"
              onClick={handleRunDiscovery}
              disabled={isLoading}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg text-xs shadow-sm transition-all disabled:opacity-50"
            >
              {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Search Keywords
            </button>

            <button
              id="btn-generate-long-tails"
              onClick={handleGenerateLongTails}
              disabled={isLoading}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-lg text-xs shadow-2xs transition-colors disabled:opacity-50"
            >
              <Wand2 className="w-4 h-4 text-indigo-600" />
              Generate Long-Tails
            </button>
          </div>
        </div>
      </div>

      {/* SEO Breakdown Overview Card */}
      <KdpSeoBreakdownCard
        breakdown={breakdown}
        onOpenOneClickModal={handleOpenOneClickModal}
      />

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-px">
        <button
          id="tab-keyword-table"
          onClick={() => setActiveTab('table')}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'table'
              ? 'border-amber-500 text-amber-600 bg-amber-50/50 rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Search className="w-4 h-4" />
          Keyword Discovery Table ({keywords.length})
        </button>

        <button
          id="tab-7-boxes"
          onClick={() => setActiveTab('seven_boxes')}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'seven_boxes'
              ? 'border-amber-500 text-amber-600 bg-amber-50/50 rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          7-Keyword Boxes Optimizer
        </button>

        <button
          id="tab-clusters"
          onClick={() => setActiveTab('clusters')}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'clusters'
              ? 'border-amber-500 text-amber-600 bg-amber-50/50 rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Layers className="w-4 h-4" />
          Keyword Clusters ({clusterGroups.length})
        </button>

        <button
          id="tab-title-desc"
          onClick={() => setActiveTab('title_desc')}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'title_desc'
              ? 'border-amber-500 text-amber-600 bg-amber-50/50 rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <FileText className="w-4 h-4" />
          Title & Description SEO
        </button>

        <button
          id="tab-avoid-list"
          onClick={() => setActiveTab('avoid')}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'avoid'
              ? 'border-amber-500 text-amber-600 bg-amber-50/50 rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          Avoid & Negative List ({avoidList.length})
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'table' && (
        <KdpSeoKeywordTable
          keywords={keywords}
          onToggleExclude={id => {
            setKeywords(prev =>
              prev.map(k => (k.id === id ? { ...k, isExcluded: !k.isExcluded } : k))
            );
          }}
          onEditKeyword={(id, newText) => {
            setKeywords(prev =>
              prev.map(k => (k.id === id ? { ...k, keyword: newText } : k))
            );
          }}
          onAddToSevenBoxes={kw => {
            // Find first box with room or append
            const emptyBox = sevenBoxes.boxes.find(b => b.phrase.length + kw.length + 1 <= 50);
            if (emptyBox) {
              emptyBox.phrase = emptyBox.phrase ? `${emptyBox.phrase} ${kw}` : kw;
              setSevenBoxes(KeywordOptimizationService.evaluateBoxesCollection(sevenBoxes.boxes));
              notify(`Added "${kw}" to Box ${emptyBox.slotNumber}`, 'success');
            } else {
              notify('All 7 boxes are full (50 characters limit reached)', 'warning');
            }
          }}
          onDeleteKeyword={id => {
            setKeywords(prev => prev.filter(k => k.id !== id));
          }}
          onBulkClusterChange={(ids, newCluster) => {
            setKeywords(prev => KeywordClusterService.splitCluster(prev, ids, newCluster));
            notify(`Moved ${ids.length} keywords to ${newCluster}`, 'success');
          }}
          onExportCsv={handleExportCsv}
          clustersList={clustersList}
        />
      )}

      {activeTab === 'seven_boxes' && (
        <KdpSevenBoxesEditor
          sevenBoxes={sevenBoxes}
          onUpdateBoxes={setSevenBoxes}
          onOptimizeFromPool={() => {
            const updated = KeywordOptimizationService.optimizeSevenBoxes(keywords, currentProject);
            setSevenBoxes(updated);
            notify('7 Keyword Boxes auto-optimized from candidate pool', 'success');
          }}
          onApplyToProjectMetadata={phrases => {
            if (currentProject) {
              updateProject({
                ...currentProject,
                metadata: {
                  ...currentProject.metadata,
                  keywords: phrases,
                },
              });
              notify('Applied 7 boxes to project metadata', 'success');
            }
          }}
          onExportTxt={handleExportTxt}
        />
      )}

      {activeTab === 'clusters' && (
        <KdpSeoClusterManager
          clusterGroups={clusterGroups}
          onMergeClusters={(src, tgt) => {
            setKeywords(prev => KeywordClusterService.mergeClusters(prev, src, tgt));
            notify(`Merged cluster ${src} into ${tgt}`, 'success');
          }}
          onRenameCluster={(oldN, newN) => {
            setKeywords(prev => KeywordClusterService.renameCluster(prev, oldN, newN));
            notify(`Renamed cluster to ${newN}`, 'success');
          }}
          onSplitKeywordToCluster={(id, newCluster) => {
            setKeywords(prev => KeywordClusterService.splitCluster(prev, [id], newCluster));
          }}
          onSelectCluster={cluster => {
            setActiveTab('table');
          }}
        />
      )}

      {activeTab === 'title_desc' && (
        <KdpTitleDescriptionAnalyzers
          project={currentProject}
          title={bookTitle}
          subtitle={bookSubtitle}
          description={bookDescription}
          titleAnalysis={titleAnalysis}
          descriptionAnalysis={descriptionAnalysis}
          targetKeywords={keywords.map(k => k.keyword)}
          onChangeTitle={setBookTitle}
          onChangeSubtitle={setBookSubtitle}
          onChangeDescription={setBookDescription}
          onApplyTitleSuggestion={(sugTitle, sugSub) => {
            setBookTitle(sugTitle);
            setBookSubtitle(sugSub);
            notify('Applied title suggestion', 'success');
          }}
          onApplyOptimizedDescription={optDesc => {
            setBookDescription(optDesc);
            notify('Applied optimized description', 'success');
          }}
        />
      )}

      {activeTab === 'avoid' && (
        <div id="kdp-avoid-list-panel" className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                <h3 className="text-lg font-bold text-slate-900">Negative & Avoid Keyword List</h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Maintain terms that must never be used in Title, Subtitle, Description, or 7 Backend Boxes to ensure Amazon KDP policy compliance.
              </p>
            </div>
          </div>

          {/* Add to Avoid List */}
          <div className="flex flex-wrap items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <input
              type="text"
              placeholder="Add keyword to avoid (e.g. brand name, forbidden claim)..."
              value={customAvoidKeyword}
              onChange={e => setCustomAvoidKeyword(e.target.value)}
              className="flex-1 min-w-[240px] px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
            />
            <select
              value={customAvoidReason}
              onChange={e => setCustomAvoidReason(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium"
            >
              <option value="Trademark risk">Trademark risk</option>
              <option value="Competitor brand">Competitor brand</option>
              <option value="Unsupported promotional claim">Unsupported promotional claim</option>
              <option value="Misleading claim">Misleading claim</option>
              <option value="Keyword stuffing">Keyword stuffing</option>
            </select>
            <button
              onClick={() => {
                if (customAvoidKeyword.trim()) {
                  setAvoidList(prev => [
                    ...prev,
                    { keyword: customAvoidKeyword.trim().toLowerCase(), reason: customAvoidReason },
                  ]);
                  setCustomAvoidKeyword('');
                  notify('Added keyword to negative avoid list', 'success');
                }
              }}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold"
            >
              Add Avoid Term
            </button>
          </div>

          {/* Avoid Table */}
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
            {avoidList.map((item, idx) => (
              <div key={idx} className="p-3 bg-white flex items-center justify-between hover:bg-slate-50 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800">"{item.keyword}"</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                    {item.reason}
                  </span>
                </div>

                <button
                  onClick={() => setAvoidList(prev => prev.filter((_, i) => i !== idx))}
                  className="p-1 text-slate-400 hover:text-rose-600 rounded"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* One-Click SEO Modal */}
      {oneClickProposal && (
        <KdpOneClickOptimizationModal
          proposal={oneClickProposal}
          isOpen={isOneClickModalOpen}
          onClose={() => setIsOneClickModalOpen(false)}
          onApplyChanges={handleApplyOneClickDecisions}
        />
      )}

      {/* History Drawer */}
      <KdpSeoHistoryDrawer
        isOpen={isHistoryDrawerOpen}
        onClose={() => setIsHistoryDrawerOpen(false)}
        sessions={historySessions}
        onRestoreSession={session => {
          setSeedKeyword(session.seedKeyword);
          setMarketplaceId(session.marketplace);
          if (session.keywords) setKeywords(session.keywords);
          if (session.sevenBoxes) setSevenBoxes(session.sevenBoxes);
          notify(`Restored research session for "${session.seedKeyword}"`, 'success');
        }}
        onDeleteSession={id => {
          const updated = KeywordResearchService.deleteHistorySession(id);
          setHistorySessions(updated);
          notify('Session deleted', 'info');
        }}
      />
    </div>
  );
};

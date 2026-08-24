import React, { useState, useEffect } from 'react';
import {
  Compass,
  Search,
  Sparkles,
  BookOpen,
  Download,
  FileSpreadsheet,
  FileText,
  Bookmark,
  Share2,
  Check,
  RefreshCw,
  Layers,
  ArrowRight,
  ShieldCheck,
  Info,
  ChevronDown,
} from 'lucide-react';
import {
  KdpNicheResearchParams,
  KdpNicheResearchResult,
  KdpNicheHistorySession,
  KdpSubNiche,
  KdpCompetitor,
  KdpNicheWatchlistItem,
  NicheStatus,
} from '../../types/niche';
import { KdpNicheResearchEngine } from '../../services/kdpNicheResearchEngine';
import { KdpNicheExportService } from '../../services/kdpNicheExportService';
import { GoogleDocsService } from '../../services/googleDocsService';
import { GoogleAuthService } from '../../services/googleAuthService';
import { Project } from '../../types/project';

import { KdpNicheScoreCard } from './KdpNicheScoreCard';
import { KdpSubNicheDiscovery } from './KdpSubNicheDiscovery';
import { KdpCompetitorAnalysisSuite } from './KdpCompetitorAnalysisSuite';
import { KdpContentGapsCard } from './KdpContentGapsCard';
import { KdpNicheKeywordsBridge } from './KdpNicheKeywordsBridge';
import { KdpTitleDescriptionHelper } from './KdpTitleDescriptionHelper';
import { KdpNicheValidationCard } from './KdpNicheValidationCard';
import { KdpNicheWatchlistManager } from './KdpNicheWatchlistManager';

interface KdpNicheResearchDashboardProps {
  currentProject?: Project;
  googleAccessToken?: string;
  onNavigateToSeo?: (seedKeyword: string) => void;
  onCreateBookFromNiche?: (nicheData: {
    niche: string;
    bookType: string;
    puzzleType: string;
    targetAudience: string;
    theme: string;
    keywords: string[];
    suggestedTitle?: string;
    suggestedSubtitle?: string;
  }) => void;
}

export const KdpNicheResearchDashboard: React.FC<KdpNicheResearchDashboardProps> = ({
  currentProject,
  googleAccessToken,
  onNavigateToSeo,
  onCreateBookFromNiche,
}) => {
  // Input Form State
  const [niche, setNiche] = useState('Classic Cars');
  const [bookType, setBookType] = useState('Word Search');
  const [puzzleType, setPuzzleType] = useState('Word Search');
  const [targetAudience, setTargetAudience] = useState('Adults');
  const [language, setLanguage] = useState('English');
  const [marketplace, setMarketplace] = useState('Amazon.com');

  // Loading & Results
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentResult, setCurrentResult] = useState<KdpNicheResearchResult | null>(null);

  // Watchlist & History State
  const [watchlist, setWatchlist] = useState<KdpNicheWatchlistItem[]>([]);
  const [history, setHistory] = useState<KdpNicheHistorySession[]>([]);
  const [savedToWatchlist, setSavedToWatchlist] = useState(false);
  const [googleDocSyncing, setGoogleDocSyncing] = useState(false);
  const [googleDocUrl, setGoogleDocUrl] = useState<string | null>(null);

  // Initialize data on mount
  useEffect(() => {
    // Load existing watchlist and history
    setWatchlist(KdpNicheResearchEngine.getWatchlist());
    const hist = KdpNicheResearchEngine.getHistory();
    setHistory(hist);

    // Initial analysis if empty
    if (!currentResult) {
      if (hist.length > 0 && hist[0].result) {
        setCurrentResult(hist[0].result);
        setNiche(hist[0].result.niche);
        setBookType(hist[0].result.bookType);
        setPuzzleType(hist[0].result.puzzleType);
        setTargetAudience(hist[0].result.targetAudience);
      } else {
        runAnalysis('Classic Cars', 'Word Search', 'Word Search', 'Adults', 'English', 'Amazon.com');
      }
    }
  }, []);

  const runAnalysis = (
    n: string,
    bt: string,
    pt: string,
    aud: string,
    lang: string,
    mkt: string
  ) => {
    setIsAnalyzing(true);
    setSavedToWatchlist(false);
    setGoogleDocUrl(null);

    // Slight delay for smooth visual feel and state stability
    setTimeout(async () => {
      const result = await KdpNicheResearchEngine.analyzeNiche({
        niche: n,
        bookType: bt,
        puzzleType: pt,
        targetAudience: aud,
        language: lang,
        marketplace: mkt,
      });

      setCurrentResult(result);
      setHistory(KdpNicheResearchEngine.getHistory());
      setIsAnalyzing(false);
    }, 200);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!niche.trim()) return;
    runAnalysis(niche.trim(), bookType, puzzleType, targetAudience, language, marketplace);
  };

  const handleSelectSubNiche = (subNiche: KdpSubNiche) => {
    setNiche(subNiche.name);
    setTargetAudience(subNiche.targetAudience);
    runAnalysis(
      subNiche.name,
      bookType,
      puzzleType,
      subNiche.targetAudience,
      language,
      marketplace
    );
  };

  const handleAddCompetitor = (competitor: KdpCompetitor) => {
    if (!currentResult) return;
    const updated = KdpNicheResearchEngine.addCompetitorToResearch(currentResult, competitor);
    if (updated) {
      setCurrentResult({ ...updated });
    }
  };

  const handleRemoveCompetitor = (competitorId: string) => {
    if (!currentResult) return;
    const updated = KdpNicheResearchEngine.removeCompetitorFromResearch(currentResult, competitorId);
    if (updated) {
      setCurrentResult({ ...updated });
    }
  };

  const handleSaveToWatchlist = () => {
    if (!currentResult) return;
    KdpNicheResearchEngine.saveToWatchlist(currentResult);
    setWatchlist(KdpNicheResearchEngine.getWatchlist());
    setSavedToWatchlist(true);
    setTimeout(() => setSavedToWatchlist(false), 2500);
  };

  const handleSaveToGoogleDoc = async () => {
    if (!currentResult) return;
    
    let token = googleAccessToken || (await GoogleAuthService.getAccessToken());
    if (!token) {
      const authResult = await GoogleAuthService.signInWithGoogle();
      token = authResult?.accessToken || null;
    }

    if (!token) {
      alert('Google Workspace connection required. Please connect your Google account to export research documents.');
      return;
    }

    try {
      setGoogleDocSyncing(true);
      const res = await GoogleDocsService.createStandaloneNicheResearchDoc(currentResult, token);
      setGoogleDocUrl(res.docUrl);
      setGoogleDocSyncing(false);
    } catch (err: any) {
      setGoogleDocSyncing(false);
      alert(`Error saving niche research to Google Doc: ${err.message || err}`);
    }
  };

  const handleCreateBookClick = () => {
    if (!currentResult) return;

    if (onCreateBookFromNiche) {
      const topTitle = currentResult.titleOpportunities.directions[0];
      onCreateBookFromNiche({
        niche: currentResult.niche,
        bookType: currentResult.bookType,
        puzzleType: currentResult.puzzleType,
        targetAudience: currentResult.targetAudience,
        theme: currentResult.niche,
        keywords: [
          ...currentResult.keywords.coreKeywords,
          ...currentResult.keywords.longTailKeywords.slice(0, 3),
        ],
        suggestedTitle: topTitle?.title,
        suggestedSubtitle: topTitle?.subtitle,
      });
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Header & Search Panel */}
      <div className="p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-neutral-950 flex items-center justify-center font-extrabold shadow-md shadow-amber-500/20">
                <Compass className="w-5 h-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-neutral-900 dark:text-white font-display tracking-tight">
                KDP Niche & Competitor Research Engine
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
              Evaluate market viability, discover low-competition sub-niches, benchmark competitors, and uncover content gaps <em>before</em> generating your book.
            </p>
          </div>

          {/* Top Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleSaveToWatchlist}
              disabled={!currentResult}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-750 text-xs font-semibold text-neutral-700 dark:text-neutral-200 transition-colors disabled:opacity-50"
            >
              {savedToWatchlist ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Bookmark className="w-3.5 h-3.5 text-amber-500" />}
              <span>{savedToWatchlist ? 'Saved to Watchlist!' : 'Save Niche'}</span>
            </button>

            <button
              onClick={() => currentResult && KdpNicheExportService.exportToCsv(currentResult)}
              disabled={!currentResult}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-750 text-xs font-semibold text-neutral-700 dark:text-neutral-200 transition-colors disabled:opacity-50"
              title="Export KDP-Niche-Research.csv"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => currentResult && KdpNicheExportService.exportToPdfReport(currentResult)}
              disabled={!currentResult}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-750 text-xs font-semibold text-neutral-700 dark:text-neutral-200 transition-colors disabled:opacity-50"
              title="Printable / PDF Niche Research Report"
            >
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>Report (PDF)</span>
            </button>

            <button
              onClick={handleSaveToGoogleDoc}
              disabled={!currentResult || googleDocSyncing}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-750 text-xs font-semibold text-neutral-700 dark:text-neutral-200 transition-colors disabled:opacity-50"
              title="Sync to Google Docs"
            >
              <Share2 className="w-3.5 h-3.5 text-indigo-500" />
              <span>{googleDocSyncing ? 'Syncing Doc...' : 'Google Doc'}</span>
            </button>
          </div>
        </div>

        {/* Google Doc Success Banner */}
        {googleDocUrl && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs flex items-center justify-between text-emerald-800 dark:text-emerald-300 animate-in fade-in">
            <span>✓ Standalone Niche Research Report saved to your Google Drive!</span>
            <a
              href={googleDocUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold underline text-emerald-700 dark:text-emerald-400 hover:text-emerald-600"
            >
              Open Google Doc
            </a>
          </div>
        )}

        {/* Research Input Form */}
        <form onSubmit={handleSearchSubmit} className="space-y-4 pt-2 border-t border-neutral-100 dark:border-neutral-800">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Niche / Topic */}
            <div className="lg:col-span-2">
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Niche / Topic *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={niche}
                  onChange={e => setNiche(e.target.value)}
                  placeholder="e.g. Classic Cars, Mindfulness, 90s Trivia"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Book Type */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Book Type
              </label>
              <select
                value={bookType}
                onChange={e => {
                  setBookType(e.target.value);
                  setPuzzleType(e.target.value);
                }}
                className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="Word Search">Word Search</option>
                <option value="Crossword">Crossword</option>
                <option value="Sudoku">Sudoku</option>
                <option value="Cryptogram">Cryptogram</option>
                <option value="Maze">Maze</option>
                <option value="Coloring Book">Coloring Book</option>
                <option value="Activity Book">Activity Book</option>
                <option value="Trivia Book">Trivia Book</option>
              </select>
            </div>

            {/* Target Audience */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Target Audience
              </label>
              <select
                value={targetAudience}
                onChange={e => setTargetAudience(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="Adults">Adults</option>
                <option value="Seniors">Seniors (50+)</option>
                <option value="Kids (Ages 4-8)">Kids (Ages 4-8)</option>
                <option value="Kids (Ages 8-12)">Kids (Ages 8-12)</option>
                <option value="Teens">Teens</option>
                <option value="Women">Women</option>
                <option value="Men">Men</option>
                <option value="Beginners">Beginners</option>
                <option value="Advanced Enthusiasts">Advanced Enthusiasts</option>
              </select>
            </div>

            {/* Language */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Language
              </label>
              <select
                value={language}
                onChange={e => setLanguage(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="English">English</option>
                <option value="Spanish">Spanish</option>
                <option value="German">German</option>
                <option value="French">French</option>
                <option value="Italian">Italian</option>
              </select>
            </div>

            {/* Marketplace */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Marketplace
              </label>
              <select
                value={marketplace}
                onChange={e => setMarketplace(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="Amazon.com">Amazon.com (US)</option>
                <option value="Amazon.co.uk">Amazon.co.uk (UK)</option>
                <option value="Amazon.de">Amazon.de (DE)</option>
                <option value="Amazon.ca">Amazon.ca (CA)</option>
                <option value="Amazon.com.au">Amazon.com.au (AU)</option>
                <option value="Amazon.es">Amazon.es (ES)</option>
                <option value="Amazon.fr">Amazon.fr (FR)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
              <span className="font-semibold">Quick Ideas:</span>
              {['Classic Cars', 'Mindfulness', 'Camping & Outdoor', '90s Pop Culture'].map(sample => (
                <button
                  key={sample}
                  type="button"
                  onClick={() => {
                    setNiche(sample);
                    runAnalysis(sample, bookType, puzzleType, targetAudience, language, marketplace);
                  }}
                  className="px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                >
                  {sample}
                </button>
              ))}
            </div>

            <button
              type="submit"
              disabled={isAnalyzing || !niche.trim()}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>ANALYZING NICHE...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>ANALYZE NICHE</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Main Results View */}
      {currentResult && (
        <div className="space-y-6">
          {/* 1. Niche Score Card */}
          <KdpNicheScoreCard
            score={currentResult.score}
            niche={currentResult.niche}
            targetAudience={currentResult.targetAudience}
          />

          {/* 2. Sub-Niche Discoveries */}
          <KdpSubNicheDiscovery
            subNiches={currentResult.subNiches}
            currentNiche={currentResult.niche}
            onSelectSubNiche={handleSelectSubNiche}
          />

          {/* 3. Competitor Research & Comparison */}
          <KdpCompetitorAnalysisSuite
            competitors={currentResult.competitors}
            contentAnalysis={currentResult.competitorContentAnalysis}
            niche={currentResult.niche}
            bookType={currentResult.bookType}
            targetAudience={currentResult.targetAudience}
            onAddCompetitor={handleAddCompetitor}
            onRemoveCompetitor={handleRemoveCompetitor}
          />

          {/* 4. Content Gaps & Differentiation Engine */}
          <KdpContentGapsCard
            contentGaps={currentResult.contentGaps}
            differentiation={currentResult.differentiation}
            niche={currentResult.niche}
          />

          {/* 5. High Opportunity Keywords (with Bridge to Phase 10 SEO) */}
          <KdpNicheKeywordsBridge
            keywords={currentResult.keywords}
            niche={currentResult.niche}
            onOpenKeywordResearch={onNavigateToSeo}
          />

          {/* 6. Title & Description Suggestions */}
          <KdpTitleDescriptionHelper
            titleOpportunities={currentResult.titleOpportunities}
            descriptionPositioning={currentResult.descriptionPositioning}
            niche={currentResult.niche}
          />

          {/* 7. Niche Validation & Create Book Action */}
          <KdpNicheValidationCard
            validation={currentResult.validation}
            niche={currentResult.niche}
            onCreateBook={handleCreateBookClick}
          />

          {/* 8. Data Sources & Transparency Attribution */}
          <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Data Source Attribution & Transparency</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-400 font-semibold">
                    <th className="pb-2">Metric / Area</th>
                    <th className="pb-2">Data Source</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2">Verification Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-neutral-600 dark:text-neutral-400">
                  {currentResult.dataSources.map(ds => (
                    <tr key={ds.metric}>
                      <td className="py-2 font-medium text-neutral-800 dark:text-neutral-200">{ds.metric}</td>
                      <td className="py-2">{ds.source}</td>
                      <td className="py-2">
                        <span
                          className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            ds.status === 'Verified'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : ds.status === 'User Provided'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                              : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                          }`}
                        >
                          {ds.status}
                        </span>
                      </td>
                      <td className="py-2 font-mono text-[11px] text-neutral-400">{ds.timestamp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-neutral-400 pt-2 border-t border-neutral-100 dark:border-neutral-800">
              * Notice: KDP Studio utilizes mathematical modeling, public catalog metadata, and verified KDP printing structures. No private Amazon internal algorithms or proprietary sales rankings are claimed or fabricated.
            </p>
          </div>

          {/* 9. Watchlist & History Management */}
          <KdpNicheWatchlistManager
            watchlist={watchlist}
            history={history}
            onOpenFromHistory={session => {
              if (session.result) {
                setCurrentResult(session.result);
                setNiche(session.result.niche);
                setBookType(session.result.bookType);
                setPuzzleType(session.result.puzzleType);
                setTargetAudience(session.result.targetAudience);
              }
            }}
            onDuplicateFromHistory={async session => {
              if (!session.result) return;
              const dup = await KdpNicheResearchEngine.analyzeNiche({
                niche: `${session.result.niche} (Copy)`,
                bookType: session.result.bookType,
                puzzleType: session.result.puzzleType,
                targetAudience: session.result.targetAudience,
                language: session.result.language,
                marketplace: session.result.marketplace,
              });
              setCurrentResult(dup);
              setHistory(KdpNicheResearchEngine.getHistory());
            }}
            onDeleteFromHistory={id => {
              KdpNicheResearchEngine.deleteFromHistory(id);
              setHistory(KdpNicheResearchEngine.getHistory());
            }}
            onUpdateWatchlistStatus={(id, status) => {
              KdpNicheResearchEngine.updateWatchlistStatus(id, status);
              setWatchlist(KdpNicheResearchEngine.getWatchlist());
            }}
            onDeleteFromWatchlist={id => {
              KdpNicheResearchEngine.deleteFromWatchlist(id);
              setWatchlist(KdpNicheResearchEngine.getWatchlist());
            }}
            onOpenNiche={nicheName => {
              setNiche(nicheName);
              runAnalysis(nicheName, bookType, puzzleType, targetAudience, language, marketplace);
            }}
          />
        </div>
      )}
    </div>
  );
};

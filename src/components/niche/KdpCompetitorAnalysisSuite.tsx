import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  Plus,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Star,
  DollarSign,
  Layers,
  FileText,
  Tag,
  Calendar,
  Sparkles,
  Info,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import {
  KdpCompetitor,
  KdpCompetitorContentAnalysis,
  DataSourceType,
} from '../../types/niche';
import { KdpManualCompetitorModal } from './KdpManualCompetitorModal';
import { KdpCompetitorService } from '../../services/kdpCompetitorService';

interface KdpCompetitorAnalysisSuiteProps {
  competitors: KdpCompetitor[];
  contentAnalysis: KdpCompetitorContentAnalysis;
  niche: string;
  bookType: string;
  targetAudience: string;
  onAddCompetitor: (competitor: KdpCompetitor) => void;
  onRemoveCompetitor: (id: string) => void;
}

export const KdpCompetitorAnalysisSuite: React.FC<KdpCompetitorAnalysisSuiteProps> = ({
  competitors,
  contentAnalysis,
  niche,
  bookType,
  targetAudience,
  onAddCompetitor,
  onRemoveCompetitor,
}) => {
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [quickQuery, setQuickQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'cards' | 'comparison' | 'patterns'>('comparison');

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickQuery.trim()) return;

    const parsed = KdpCompetitorService.parsePublicBookQuery(quickQuery);
    const newComp = KdpCompetitorService.createManualCompetitor({
      title: parsed.cleanQuery.length > 5 && !parsed.isUrl ? parsed.cleanQuery : `${niche} Puzzle Book`,
      author: 'Independent Author',
      asin: parsed.asin,
      isbn: parsed.isbn,
      url: parsed.isUrl ? parsed.cleanQuery : undefined,
      format: 'Paperback (8.5 × 11 in)',
      pageCount: 100,
      puzzleCount: 80,
      price: 8.99,
      notes: parsed.asin ? `ASIN: ${parsed.asin}` : undefined,
    });

    onAddCompetitor(newComp);
    setQuickQuery('');
  };

  const getSourceBadge = (type: DataSourceType, sourceText: string) => {
    return (
      <span
        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono ${
          type === 'User Provided'
            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
            : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
        }`}
        title={`Source: ${sourceText}`}
      >
        {type === 'User Provided' ? '✎ User Provided' : '≈ Public Listing'}
      </span>
    );
  };

  return (
    <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-100 dark:border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-white font-display">
              Competitor Research & Public Catalog Benchmarks
            </h3>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Compare public paperback listings, formats, pricing, and content patterns (up to 10 competitors).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsManualModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-neutral-950 text-xs font-bold transition-all shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Competitor</span>
          </button>
        </div>
      </div>

      {/* Quick Lookup & Import Bar */}
      <form onSubmit={handleQuickAdd} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={quickQuery}
            onChange={e => setQuickQuery(e.target.value)}
            placeholder="Enter public Amazon URL, ASIN (e.g. B09X123ABC), ISBN, or competitor title..."
            className="w-full pl-9.5 pr-4 py-2 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/60 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          type="submit"
          disabled={!quickQuery.trim()}
          className="px-4 py-2 rounded-xl bg-neutral-900 dark:bg-neutral-800 hover:bg-neutral-800 dark:hover:bg-neutral-700 text-white text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Quick Add
        </button>
      </form>

      {/* View Switcher Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800 text-xs font-medium pb-2">
        <button
          onClick={() => setActiveTab('comparison')}
          className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'comparison'
              ? 'bg-neutral-900 text-white dark:bg-neutral-800 dark:text-white font-bold'
              : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <span>Factor Comparison Matrix</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-neutral-700 text-neutral-200">
            {competitors.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('cards')}
          className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'cards'
              ? 'bg-neutral-900 text-white dark:bg-neutral-800 dark:text-white font-bold'
              : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <span>Listing Cards</span>
        </button>
        <button
          onClick={() => setActiveTab('patterns')}
          className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'patterns'
              ? 'bg-neutral-900 text-white dark:bg-neutral-800 dark:text-white font-bold'
              : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <span>Content Patterns & Phrases</span>
        </button>
      </div>

      {/* TAB 1: 10-Competitor Side-by-Side Comparison Matrix */}
      {activeTab === 'comparison' && (
        <div className="space-y-3">
          <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
            <table className="w-full text-xs text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-neutral-100/80 dark:bg-neutral-800/80 text-neutral-700 dark:text-neutral-300 font-semibold border-b border-neutral-200 dark:border-neutral-750">
                  <th className="p-3 w-32 sticky left-0 bg-neutral-100 dark:bg-neutral-800 z-10">Factor</th>
                  {/* My Book Column */}
                  <th className="p-3 w-56 bg-amber-500/10 dark:bg-amber-500/15 text-amber-900 dark:text-amber-200 border-x border-amber-500/20 font-bold">
                    <div className="flex items-center justify-between">
                      <span>★ My Book (Studio Target)</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500 text-neutral-950 font-extrabold">YOU</span>
                    </div>
                  </th>
                  {/* Competitor Columns (up to 10) */}
                  {competitors.slice(0, 10).map((c, i) => (
                    <th key={c.id} className="p-3 w-56 border-r border-neutral-200 dark:border-neutral-750 font-semibold">
                      <div className="flex items-center justify-between gap-1">
                        <span className="truncate">Competitor #{i + 1}</span>
                        <button
                          onClick={() => onRemoveCompetitor(c.id)}
                          className="text-neutral-400 hover:text-rose-500 p-0.5 rounded"
                          title="Remove competitor from comparison"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 text-neutral-800 dark:text-neutral-200">
                {/* Title */}
                <tr>
                  <td className="p-3 font-semibold text-neutral-500 dark:text-neutral-400 sticky left-0 bg-white dark:bg-neutral-900">Title</td>
                  <td className="p-3 bg-amber-500/5 dark:bg-amber-500/5 font-bold text-neutral-900 dark:text-white border-x border-amber-500/20">
                    {niche} Large Print {bookType}
                  </td>
                  {competitors.slice(0, 10).map(c => (
                    <td key={c.id} className="p-3 border-r border-neutral-200 dark:border-neutral-800">
                      <div className="font-semibold line-clamp-2">{c.title}</div>
                      {c.subtitle && <div className="text-[11px] text-neutral-500 line-clamp-1 mt-0.5">{c.subtitle}</div>}
                    </td>
                  ))}
                </tr>

                {/* Audience */}
                <tr>
                  <td className="p-3 font-semibold text-neutral-500 dark:text-neutral-400 sticky left-0 bg-white dark:bg-neutral-900">Audience</td>
                  <td className="p-3 bg-amber-500/5 dark:bg-amber-500/5 font-semibold text-purple-600 dark:text-purple-400 border-x border-amber-500/20">
                    {targetAudience} (Specific)
                  </td>
                  {competitors.slice(0, 10).map(c => (
                    <td key={c.id} className="p-3 border-r border-neutral-200 dark:border-neutral-800">
                      {c.audience || 'Adults (Generic)'}
                    </td>
                  ))}
                </tr>

                {/* Theme */}
                <tr>
                  <td className="p-3 font-semibold text-neutral-500 dark:text-neutral-400 sticky left-0 bg-white dark:bg-neutral-900">Theme</td>
                  <td className="p-3 bg-amber-500/5 dark:bg-amber-500/5 font-medium border-x border-amber-500/20">
                    Curated {niche} Eras & Trivia
                  </td>
                  {competitors.slice(0, 10).map(c => (
                    <td key={c.id} className="p-3 border-r border-neutral-200 dark:border-neutral-800">
                      {c.theme || 'General Puzzles'}
                    </td>
                  ))}
                </tr>

                {/* Format */}
                <tr>
                  <td className="p-3 font-semibold text-neutral-500 dark:text-neutral-400 sticky left-0 bg-white dark:bg-neutral-900">Format</td>
                  <td className="p-3 bg-amber-500/5 dark:bg-amber-500/5 font-medium border-x border-amber-500/20">
                    8.5" × 11" Extra-Large Print
                  </td>
                  {competitors.slice(0, 10).map(c => (
                    <td key={c.id} className="p-3 border-r border-neutral-200 dark:border-neutral-800">
                      {c.format}
                    </td>
                  ))}
                </tr>

                {/* Pages */}
                <tr>
                  <td className="p-3 font-semibold text-neutral-500 dark:text-neutral-400 sticky left-0 bg-white dark:bg-neutral-900">Pages</td>
                  <td className="p-3 bg-amber-500/5 dark:bg-amber-500/5 font-mono font-bold border-x border-amber-500/20">
                    100–110 pages
                  </td>
                  {competitors.slice(0, 10).map(c => (
                    <td key={c.id} className="p-3 font-mono border-r border-neutral-200 dark:border-neutral-800">
                      {c.pageCount ? `${c.pageCount}p` : '—'}
                    </td>
                  ))}
                </tr>

                {/* Puzzle Count */}
                <tr>
                  <td className="p-3 font-semibold text-neutral-500 dark:text-neutral-400 sticky left-0 bg-white dark:bg-neutral-900">Puzzle Count</td>
                  <td className="p-3 bg-amber-500/5 dark:bg-amber-500/5 font-mono font-bold border-x border-amber-500/20">
                    80 Puzzles (1,600+ words)
                  </td>
                  {competitors.slice(0, 10).map(c => (
                    <td key={c.id} className="p-3 font-mono border-r border-neutral-200 dark:border-neutral-800">
                      {c.puzzleCount ? `${c.puzzleCount} puzzles` : '—'}
                    </td>
                  ))}
                </tr>

                {/* Difficulty */}
                <tr>
                  <td className="p-3 font-semibold text-neutral-500 dark:text-neutral-400 sticky left-0 bg-white dark:bg-neutral-900">Difficulty</td>
                  <td className="p-3 bg-amber-500/5 dark:bg-amber-500/5 font-medium border-x border-amber-500/20">
                    Medium (Comfortable Solves)
                  </td>
                  {competitors.slice(0, 10).map(c => (
                    <td key={c.id} className="p-3 border-r border-neutral-200 dark:border-neutral-800">
                      {c.difficulty || 'Medium'}
                    </td>
                  ))}
                </tr>

                {/* Price */}
                <tr>
                  <td className="p-3 font-semibold text-neutral-500 dark:text-neutral-400 sticky left-0 bg-white dark:bg-neutral-900">Price</td>
                  <td className="p-3 bg-amber-500/5 dark:bg-amber-500/5 font-mono font-bold text-emerald-600 dark:text-emerald-400 border-x border-amber-500/20">
                    $8.99 (Optimal Royalty)
                  </td>
                  {competitors.slice(0, 10).map(c => (
                    <td key={c.id} className="p-3 font-mono border-r border-neutral-200 dark:border-neutral-800">
                      {c.price !== null ? (typeof c.price === 'number' ? `$${c.price.toFixed(2)}` : c.price) : '—'}
                    </td>
                  ))}
                </tr>

                {/* Unique Feature / Advantage */}
                <tr>
                  <td className="p-3 font-semibold text-neutral-500 dark:text-neutral-400 sticky left-0 bg-white dark:bg-neutral-900">Unique Feature</td>
                  <td className="p-3 bg-amber-500/5 dark:bg-amber-500/5 font-semibold text-amber-700 dark:text-amber-300 border-x border-amber-500/20">
                    20pt+ Font + Themed Chapters + 4-to-a-Page Solutions
                  </td>
                  {competitors.slice(0, 10).map(c => (
                    <td key={c.id} className="p-3 text-[11px] text-neutral-600 dark:text-neutral-400 border-r border-neutral-200 dark:border-neutral-800">
                      {c.uniqueFeatures?.join(', ') || 'Standard Layout'}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Detailed Competitor Cards */}
      {activeTab === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {competitors.map((c, i) => (
            <div
              key={c.id}
              className="p-4 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/40 space-y-3 relative group"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                    Competitor #{i + 1}
                  </span>
                  <h4 className="font-bold text-sm text-neutral-900 dark:text-white leading-tight">
                    {c.title}
                  </h4>
                  {c.subtitle && (
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-1">
                      {c.subtitle}
                    </p>
                  )}
                  <p className="text-[11px] text-neutral-400 mt-1">by {c.author}</p>
                </div>
                <button
                  onClick={() => onRemoveCompetitor(c.id)}
                  className="p-1 text-neutral-400 hover:text-rose-500 rounded transition-colors"
                  title="Remove"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-neutral-200/60 dark:border-neutral-750">
                <div>
                  <span className="text-neutral-400 block">Format:</span>
                  <span className="font-medium text-neutral-800 dark:text-neutral-200">{c.format}</span>
                </div>
                <div>
                  <span className="text-neutral-400 block">Pages / Puzzles:</span>
                  <span className="font-mono font-medium text-neutral-800 dark:text-neutral-200">
                    {c.pageCount || '—'}p ({c.puzzleCount || '—'} puzzles)
                  </span>
                </div>
                <div>
                  <span className="text-neutral-400 block">List Price:</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {c.price !== null ? (typeof c.price === 'number' ? `$${c.price.toFixed(2)}` : c.price) : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-400 block">Rating / Reviews:</span>
                  <span className="font-medium text-neutral-800 dark:text-neutral-200">
                    {c.rating ? `★ ${c.rating} (${c.reviewCount || 0})` : '—'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-neutral-200/60 dark:border-neutral-750 text-[10px]">
                {getSourceBadge(c.dataSource, c.source)}
                <span className="text-neutral-400 font-mono">{c.timestamp}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: Common Topics & Format Patterns */}
      {activeTab === 'patterns' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Common Topics */}
          <div className="p-4 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30 space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Common Niche Themes & Topics
            </h4>
            <div className="space-y-2.5">
              {contentAnalysis.commonTopics.map(t => (
                <div key={t.topic} className="space-y-1 text-xs">
                  <div className="flex justify-between font-semibold text-neutral-800 dark:text-neutral-200">
                    <span>{t.topic}</span>
                    <span className="text-neutral-400 font-mono text-[11px]">{t.frequency}% prevalence</span>
                  </div>
                  <div className="w-full bg-neutral-200 dark:bg-neutral-700 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-full rounded-full" style={{ width: `${t.frequency}%` }} />
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {t.sampleKeywords.map(k => (
                      <span key={k} className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-200/60 dark:bg-neutral-750 text-neutral-600 dark:text-neutral-400">
                        {k}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Common Phrases & Value Hooks */}
          <div className="p-4 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30 space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-emerald-500" />
              Frequent Copy Phrases & Amazon Hooks
            </h4>
            <div className="space-y-2">
              {contentAnalysis.commonPhrases.map(p => (
                <div key={p.phrase} className="p-2.5 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200/70 dark:border-neutral-750 text-xs">
                  <div className="font-semibold text-neutral-900 dark:text-white">"{p.phrase}"</div>
                  <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 flex justify-between">
                    <span>Purpose: {p.purpose}</span>
                    <span className="font-mono text-neutral-400">Used by {p.count} listings</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Manual Modal */}
      <KdpManualCompetitorModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        onAdd={onAddCompetitor}
        nicheHint={niche}
      />
    </div>
  );
};

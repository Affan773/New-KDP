import React, { useState } from 'react';
import {
  Bookmark,
  History,
  Trash2,
  Copy,
  FolderOpen,
  Plus,
  Check,
  Tag,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  KdpNicheWatchlistItem,
  KdpNicheHistorySession,
  KdpNicheResearchResult,
  NicheStatus,
} from '../../types/niche';

interface KdpNicheWatchlistManagerProps {
  watchlist: KdpNicheWatchlistItem[];
  history: KdpNicheHistorySession[];
  onOpenFromHistory: (session: KdpNicheHistorySession) => void;
  onDuplicateFromHistory: (session: KdpNicheHistorySession) => void;
  onDeleteFromHistory: (id: string) => void;
  onUpdateWatchlistStatus: (id: string, status: NicheStatus) => void;
  onDeleteFromWatchlist: (id: string) => void;
  onOpenNiche: (nicheName: string) => void;
}

export const KdpNicheWatchlistManager: React.FC<KdpNicheWatchlistManagerProps> = ({
  watchlist,
  history,
  onOpenFromHistory,
  onDuplicateFromHistory,
  onDeleteFromHistory,
  onUpdateWatchlistStatus,
  onDeleteFromWatchlist,
  onOpenNiche,
}) => {
  const [activeTab, setActiveTab] = useState<'watchlist' | 'history'>('watchlist');

  const getStatusColor = (status: NicheStatus) => {
    switch (status) {
      case 'Promising':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'Create Book':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'Researching':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      case 'Rejected':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
      case 'Archived':
      default:
        return 'bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 border-neutral-500/20';
    }
  };

  return (
    <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-4">
      {/* Tab Switcher */}
      <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('watchlist')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'watchlist'
                ? 'bg-neutral-900 text-white dark:bg-neutral-800 dark:text-white shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Niche Watchlist</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-neutral-700 text-white">
              {watchlist.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'history'
                ? 'bg-neutral-900 text-white dark:bg-neutral-800 dark:text-white shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Research History</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-neutral-700 text-white">
              {history.length}
            </span>
          </button>
        </div>
      </div>

      {/* WATCHLIST TAB */}
      {activeTab === 'watchlist' && (
        <div className="space-y-3">
          {watchlist.length === 0 ? (
            <div className="text-center py-8 text-neutral-400 text-xs">
              No saved niches on your watchlist yet. Click <strong>[ SAVE NICHE ]</strong> on any research result to track ideas!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {watchlist.map(item => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-800/40 space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-sm text-neutral-900 dark:text-white">
                          {item.nicheName}
                        </h4>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                          {item.bookType} • {item.marketplace}
                        </p>
                      </div>
                      <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        {item.score}/100
                      </span>
                    </div>

                    {/* Status Dropdown */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-neutral-400 font-semibold uppercase">Status:</span>
                      <select
                        value={item.status}
                        onChange={e => onUpdateWatchlistStatus(item.id, e.target.value as NicheStatus)}
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border focus:outline-none ${getStatusColor(
                          item.status
                        )}`}
                      >
                        <option value="Promising">Promising</option>
                        <option value="Researching">Researching</option>
                        <option value="Create Book">Create Book</option>
                        <option value="Rejected">Rejected</option>
                        <option value="Archived">Archived</option>
                      </select>
                    </div>

                    {/* Notes & Target Attributes */}
                    <div className="space-y-1 text-[11px] text-neutral-600 dark:text-neutral-300 pt-1 border-t border-neutral-200/60 dark:border-neutral-750">
                      <div>
                        <strong className="text-neutral-400">Audience:</strong> {item.audience || 'General'}
                      </div>
                      {item.sessionData?.breakdown?.potentialFormats?.[0] && (
                        <div>
                          <strong className="text-neutral-400">Format:</strong> {item.sessionData.breakdown.potentialFormats[0]}
                        </div>
                      )}
                      {item.sessionData?.breakdown?.potentialPricePositioning?.recommended && (
                        <div>
                          <strong className="text-neutral-400">Target Price:</strong> ${item.sessionData.breakdown.potentialPricePositioning.recommended.toFixed(2)}
                        </div>
                      )}
                      {item.notes && (
                        <p className="italic text-neutral-500 dark:text-neutral-400 pt-0.5">"{item.notes}"</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-neutral-200/60 dark:border-neutral-750">
                    <button
                      onClick={() => onOpenNiche(item.nicheName)}
                      className="flex-1 py-1 px-2.5 rounded-lg bg-neutral-900 dark:bg-neutral-800 hover:bg-neutral-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <FolderOpen className="w-3 h-3" />
                      <span>Analyze</span>
                    </button>
                    <button
                      onClick={() => onDeleteFromWatchlist(item.id)}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-500 transition-colors"
                      title="Delete from Watchlist"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* HISTORY TAB */}
      {activeTab === 'history' && (
        <div className="space-y-3">
          {history.length === 0 ? (
            <div className="text-center py-8 text-neutral-400 text-xs">
              No research history recorded yet. Run a niche search to start accumulating session history.
            </div>
          ) : (
            <div className="space-y-2">
              {history.map(item => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-800/40 flex items-center justify-between gap-4"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-neutral-900 dark:text-white">
                        {item.niche}
                      </h4>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                        {item.score}/100 ({item.grade})
                      </span>
                      <span className="text-[10px] text-neutral-400">
                        {item.bookType} • {item.result?.targetAudience || 'General'}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      {item.marketplace} • Analyzed on {item.analysisDate}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onOpenFromHistory(item)}
                      className="px-2.5 py-1 rounded-lg bg-neutral-900 dark:bg-neutral-800 hover:bg-neutral-800 text-white text-xs font-semibold flex items-center gap-1 transition-colors"
                      title="Open full research dashboard"
                    >
                      <FolderOpen className="w-3 h-3" />
                      <span>Open</span>
                    </button>
                    <button
                      onClick={() => onDuplicateFromHistory(item)}
                      className="p-1 text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200"
                      title="Duplicate session"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteFromHistory(item.id)}
                      className="p-1 text-neutral-400 hover:text-rose-500"
                      title="Delete from history"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  Copy,
  Check,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  ArrowUpDown,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';
import { KdpKeywordCluster, KdpSearchIntent, KdpSeoKeyword, RiskLevel } from '../../types/seo';

interface Props {
  keywords: KdpSeoKeyword[];
  onToggleExclude: (id: string) => void;
  onEditKeyword: (id: string, newText: string) => void;
  onAddToSevenBoxes: (keyword: string) => void;
  onDeleteKeyword: (id: string) => void;
  onBulkClusterChange: (ids: string[], newCluster: string) => void;
  onExportCsv: () => void;
  clustersList: string[];
}

export const KdpSeoKeywordTable: React.FC<Props> = ({
  keywords,
  onToggleExclude,
  onEditKeyword,
  onAddToSevenBoxes,
  onDeleteKeyword,
  onBulkClusterChange,
  onExportCsv,
  clustersList,
}) => {
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCluster, setSelectedCluster] = useState('ALL');
  const [selectedRisk, setSelectedRisk] = useState('ALL');
  const [selectedIntent, setSelectedIntent] = useState('ALL');
  const [sortField, setSortField] = useState<'score' | 'relevance' | 'match' | 'alphabetical'>('score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [targetBatchCluster, setTargetBatchCluster] = useState('');

  // Filtering & Sorting
  const filteredKeywords = useMemo(() => {
    return keywords.filter(item => {
      // Search
      if (searchTerm && !item.keyword.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      // Cluster
      if (selectedCluster !== 'ALL' && item.cluster !== selectedCluster) {
        return false;
      }
      // Risk
      if (selectedRisk !== 'ALL' && item.riskLevel !== selectedRisk) {
        return false;
      }
      // Intent
      if (selectedIntent !== 'ALL' && item.commercialIntent !== selectedIntent) {
        return false;
      }
      return true;
    }).sort((a, b) => {
      let comp = 0;
      if (sortField === 'score') comp = a.studioSeoScore - b.studioSeoScore;
      else if (sortField === 'relevance') comp = a.relevance - b.relevance;
      else if (sortField === 'match') comp = a.bookMatchScore - b.bookMatchScore;
      else if (sortField === 'alphabetical') comp = a.keyword.localeCompare(b.keyword);

      return sortOrder === 'desc' ? -comp : comp;
    });
  }, [keywords, searchTerm, selectedCluster, selectedRisk, selectedIntent, sortField, sortOrder]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredKeywords.map(k => k.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  const handleCopy = (keyword: string, id: string) => {
    navigator.clipboard.writeText(keyword);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleStartEdit = (id: string, text: string) => {
    setEditingId(id);
    setEditingText(text);
  };

  const handleSaveEdit = (id: string) => {
    if (editingText.trim()) {
      onEditKeyword(id, editingText.trim());
    }
    setEditingId(null);
    setEditingText('');
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    if (score >= 75) return 'bg-blue-100 text-blue-800 border-blue-300';
    if (score >= 60) return 'bg-amber-100 text-amber-800 border-amber-300';
    if (score >= 40) return 'bg-orange-100 text-orange-800 border-orange-300';
    return 'bg-rose-100 text-rose-800 border-rose-300';
  };

  const getRiskBadge = (riskLevel: RiskLevel, riskReason?: string) => {
    if (riskLevel === 'HIGH RISK') {
      return (
        <span
          title={riskReason || 'Potential trademark/brand risk — review manually.'}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-100 text-rose-800 border border-rose-300 cursor-help"
        >
          <ShieldAlert className="w-3 h-3" /> High Risk
        </span>
      );
    }
    if (riskLevel === 'MEDIUM RISK') {
      return (
        <span
          title={riskReason || 'Review for keyword stuffing or claims'}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-300 cursor-help"
        >
          <AlertTriangle className="w-3 h-3" /> Medium
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
        <ShieldCheck className="w-3 h-3" /> Low
      </span>
    );
  };

  return (
    <div id="kdp-seo-keyword-table-container" className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
      {/* Control Bar: Search & Filters */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              id="input-table-search-keywords"
              type="text"
              placeholder="Filter discovered keywords..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>

          {/* Cluster Filter */}
          <select
            id="select-filter-cluster"
            value={selectedCluster}
            onChange={e => setSelectedCluster(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="ALL">All Clusters</option>
            {clustersList.map(c => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Risk Filter */}
          <select
            id="select-filter-risk"
            value={selectedRisk}
            onChange={e => setSelectedRisk(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="LOW RISK">Low Risk (Compliant)</option>
            <option value="MEDIUM RISK">Medium Risk</option>
            <option value="HIGH RISK">High Risk (Review)</option>
          </select>

          {/* Intent Filter */}
          <select
            id="select-filter-intent"
            value={selectedIntent}
            onChange={e => setSelectedIntent(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="ALL">All Search Intents</option>
            <option value="Transactional">Transactional</option>
            <option value="Commercial">Commercial</option>
            <option value="Gift-oriented">Gift-oriented</option>
            <option value="Niche-specific">Niche-specific</option>
            <option value="Informational">Informational</option>
          </select>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium mr-2">
            Showing {filteredKeywords.length} of {keywords.length} keywords
          </span>

          <button
            id="btn-export-keywords-csv"
            onClick={onExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Batch Operations Bar if any selected */}
      {selectedIds.length > 0 && (
        <div className="mx-4 p-2.5 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{selectedIds.length} keywords selected:</span>
            <select
              value={targetBatchCluster}
              onChange={e => setTargetBatchCluster(e.target.value)}
              className="px-2 py-1 bg-white border border-amber-300 rounded text-xs"
            >
              <option value="">Move to Cluster...</option>
              {clustersList.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
              <option value="CUSTOM">New Custom Cluster</option>
            </select>
            {targetBatchCluster && (
              <button
                onClick={() => {
                  const target = targetBatchCluster === 'CUSTOM'
                    ? prompt('Enter new cluster name:') || 'CUSTOM'
                    : targetBatchCluster;
                  onBulkClusterChange(selectedIds, target);
                  setSelectedIds([]);
                  setTargetBatchCluster('');
                }}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded font-medium"
              >
                Apply Cluster
              </button>
            )}
          </div>

          <button
            onClick={() => setSelectedIds([])}
            className="text-amber-800 hover:underline font-medium"
          >
            Clear Selection
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-100/60 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <th className="p-3 w-8">
                <input
                  type="checkbox"
                  checked={selectedIds.length > 0 && selectedIds.length === filteredKeywords.length}
                  onChange={handleSelectAll}
                  className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                />
              </th>
              <th
                className="p-3 cursor-pointer hover:bg-slate-200/50 transition-colors"
                onClick={() => {
                  if (sortField === 'alphabetical') setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
                  else {
                    setSortField('alphabetical');
                    setSortOrder('asc');
                  }
                }}
              >
                <div className="flex items-center gap-1">
                  Keyword Phrase
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                className="p-3 cursor-pointer hover:bg-slate-200/50 transition-colors"
                onClick={() => {
                  if (sortField === 'score') setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
                  else {
                    setSortField('score');
                    setSortOrder('desc');
                  }
                }}
              >
                <div className="flex items-center gap-1">
                  Studio Score
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                className="p-3 cursor-pointer hover:bg-slate-200/50 transition-colors"
                onClick={() => {
                  if (sortField === 'relevance') setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
                  else {
                    setSortField('relevance');
                    setSortOrder('desc');
                  }
                }}
              >
                <div className="flex items-center gap-1">
                  Relevance
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="p-3">Intent</th>
              <th className="p-3">Demand Signal</th>
              <th className="p-3">Competition</th>
              <th className="p-3">Trend</th>
              <th className="p-3">Cluster</th>
              <th className="p-3">Risk Level</th>
              <th className="p-3">Source</th>
              <th className="p-3 text-right pr-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filteredKeywords.length === 0 ? (
              <tr>
                <td colSpan={12} className="p-8 text-center text-slate-400">
                  No keywords match the current filter criteria.
                </td>
              </tr>
            ) : (
              filteredKeywords.map(item => {
                const isSelected = selectedIds.includes(item.id);
                const isEditing = editingId === item.id;

                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      item.isExcluded ? 'opacity-40 line-through bg-slate-50' : ''
                    } ${isSelected ? 'bg-amber-50/40' : ''}`}
                  >
                    {/* Checkbox */}
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(item.id)}
                        className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                      />
                    </td>

                    {/* Keyword Text */}
                    <td className="p-3 font-medium text-slate-900 max-w-xs">
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={editingText}
                            onChange={e => setEditingText(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleSaveEdit(item.id);
                              if (e.key === 'Escape') setEditingId(null);
                            }}
                            className="px-2 py-1 border border-amber-500 rounded text-xs w-full"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveEdit(item.id)}
                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold">{item.keyword}</span>
                          {item.isLongTail && (
                            <span className="px-1.5 py-0.2 rounded bg-slate-100 text-[10px] text-slate-600 font-mono">
                              LT
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Studio SEO Score */}
                    <td className="p-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-bold border ${getScoreBadge(
                          item.studioSeoScore
                        )}`}
                      >
                        {item.studioSeoScore}
                      </span>
                    </td>

                    {/* Relevance */}
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-12 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-blue-600 h-full rounded-full"
                            style={{ width: `${item.relevance}%` }}
                          />
                        </div>
                        <span className="text-slate-600 font-mono">{item.relevance}%</span>
                      </div>
                    </td>

                    {/* Commercial Intent */}
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-medium">
                        {item.commercialIntent}
                      </span>
                    </td>

                    {/* Demand Signal */}
                    <td className="p-3 text-slate-600">
                      <span className="inline-flex items-center gap-1">
                        {item.demandSignal}
                        <span className="text-[10px] text-slate-400 font-normal">(Est.)</span>
                      </span>
                    </td>

                    {/* Competition Signal */}
                    <td className="p-3 text-slate-600">
                      <span className="inline-flex items-center gap-1">
                        {item.competitionSignal}
                        <span className="text-[10px] text-slate-400 font-normal">(Est.)</span>
                      </span>
                    </td>

                    {/* Trend */}
                    <td className="p-3 text-slate-600">
                      <span className="text-[11px] font-medium">{item.trend || 'Evergreen'}</span>
                    </td>

                    {/* Cluster */}
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-semibold">
                        {item.cluster}
                      </span>
                    </td>

                    {/* Risk Level */}
                    <td className="p-3">{getRiskBadge(item.riskLevel, item.riskReason)}</td>

                    {/* Source / Data Disclosure */}
                    <td className="p-3 text-slate-500 text-[11px]">
                      <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 font-mono">
                        {item.dataSource || 'Estimated'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-3 text-right pr-4">
                      <div className="flex items-center justify-end gap-1">
                        {/* Copy */}
                        <button
                          title="Copy keyword"
                          onClick={() => handleCopy(item.keyword, item.id)}
                          className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
                        >
                          {copiedId === item.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {/* Add to 7 Boxes */}
                        <button
                          title="Add to KDP 7-Keyword Boxes"
                          onClick={() => onAddToSevenBoxes(item.keyword)}
                          className="p-1 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit */}
                        <button
                          title="Edit keyword phrase"
                          onClick={() => handleStartEdit(item.id, item.keyword)}
                          className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Toggle Exclude */}
                        <button
                          title={item.isExcluded ? 'Include keyword' : 'Exclude keyword'}
                          onClick={() => onToggleExclude(item.id)}
                          className={`p-1 rounded text-xs font-semibold ${
                            item.isExcluded
                              ? 'text-emerald-700 hover:bg-emerald-50'
                              : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {item.isExcluded ? 'Include' : 'Exclude'}
                        </button>

                        {/* Delete */}
                        <button
                          title="Delete keyword"
                          onClick={() => onDeleteKeyword(item.id)}
                          className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

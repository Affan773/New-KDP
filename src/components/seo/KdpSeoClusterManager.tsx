import React, { useState } from 'react';
import {
  Layers,
  Edit2,
  Plus,
  Trash2,
  ArrowRight,
  Sparkles,
  Check,
  ChevronRight,
} from 'lucide-react';
import { KdpKeywordCluster, KdpSeoKeyword } from '../../types/seo';
import { KeywordClusterGroup } from '../../services/seo/KeywordClusterService';

interface Props {
  clusterGroups: KeywordClusterGroup[];
  onMergeClusters: (sourceCluster: string, targetCluster: string) => void;
  onRenameCluster: (oldName: string, newName: string) => void;
  onSplitKeywordToCluster: (keywordId: string, newCluster: string) => void;
  onSelectCluster: (cluster: string) => void;
}

export const KdpSeoClusterManager: React.FC<Props> = ({
  clusterGroups,
  onMergeClusters,
  onRenameCluster,
  onSplitKeywordToCluster,
  onSelectCluster,
}) => {
  const [editingCluster, setEditingCluster] = useState<string | null>(null);
  const [newClusterName, setNewClusterName] = useState('');
  const [mergeSource, setMergeSource] = useState('');
  const [mergeTarget, setMergeTarget] = useState('');
  const [showMergeModal, setShowMergeModal] = useState(false);

  const handleStartRename = (cluster: string) => {
    setEditingCluster(cluster);
    setNewClusterName(cluster);
  };

  const handleSaveRename = (oldName: string) => {
    if (newClusterName.trim() && newClusterName !== oldName) {
      onRenameCluster(oldName, newClusterName.trim());
    }
    setEditingCluster(null);
  };

  const handleExecuteMerge = () => {
    if (mergeSource && mergeTarget && mergeSource !== mergeTarget) {
      onMergeClusters(mergeSource, mergeTarget);
      setShowMergeModal(false);
      setMergeSource('');
      setMergeTarget('');
    }
  };

  return (
    <div id="kdp-seo-cluster-manager" className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-bold text-slate-900">Keyword Clustering & Segmentation</h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Organize search queries by commercial role (Audience, Theme, Format, Long-Tail, Gift) to ensure balanced KDP metadata coverage.
          </p>
        </div>

        <button
          id="btn-open-merge-clusters"
          onClick={() => setShowMergeModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition-colors self-start sm:self-auto"
        >
          <Layers className="w-3.5 h-3.5" />
          Merge Clusters
        </button>
      </div>

      {/* Cluster Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clusterGroups.map(group => {
          const isEditing = editingCluster === group.cluster;

          return (
            <div
              key={group.cluster}
              className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all flex flex-col justify-between space-y-3"
            >
              {/* Card Header */}
              <div className="flex items-center justify-between gap-2">
                {isEditing ? (
                  <div className="flex items-center gap-1 flex-1">
                    <input
                      type="text"
                      value={newClusterName}
                      onChange={e => setNewClusterName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleSaveRename(group.cluster);
                        if (e.key === 'Escape') setEditingCluster(null);
                      }}
                      className="px-2 py-1 text-xs border border-indigo-500 rounded bg-white w-full"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSaveRename(group.cluster)}
                      className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 tracking-wide uppercase">
                      {group.cluster}
                    </span>
                    <button
                      onClick={() => handleStartRename(group.cluster)}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                      title="Rename cluster"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                  </div>
                )}

                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {group.count} {group.count === 1 ? 'term' : 'terms'}
                </span>
              </div>

              {/* Keyword Preview Chips */}
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto py-1">
                {group.keywords.slice(0, 10).map((kw, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center px-2 py-0.5 rounded text-[11px] bg-white border border-slate-200 text-slate-700 font-medium"
                  >
                    {kw}
                  </span>
                ))}
                {group.keywords.length > 10 && (
                  <span className="text-[10px] text-slate-400 font-medium self-center px-1">
                    +{group.keywords.length - 10} more
                  </span>
                )}
              </div>

              {/* Footer */}
              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-500">
                <span>Avg. SEO Score: <strong className="text-slate-800">{group.avgScore}/100</strong></span>
                <button
                  onClick={() => onSelectCluster(group.cluster)}
                  className="text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center gap-0.5 text-[11px]"
                >
                  View in Table <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Merge Modal */}
      {showMergeModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h4 className="text-base font-bold text-slate-900">Merge Keyword Clusters</h4>
            <p className="text-xs text-slate-500">
              Combine all keywords from a source cluster into a destination cluster.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Source Cluster (to move from):</label>
                <select
                  value={mergeSource}
                  onChange={e => setMergeSource(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                >
                  <option value="">Select source cluster...</option>
                  {clusterGroups.map(g => (
                    <option key={g.cluster} value={g.cluster}>
                      {g.cluster} ({g.count} terms)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Target Cluster (to merge into):</label>
                <select
                  value={mergeTarget}
                  onChange={e => setMergeTarget(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                >
                  <option value="">Select destination cluster...</option>
                  {clusterGroups
                    .filter(g => g.cluster !== mergeSource)
                    .map(g => (
                      <option key={g.cluster} value={g.cluster}>
                        {g.cluster}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowMergeModal(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteMerge}
                disabled={!mergeSource || !mergeTarget}
                className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-40"
              >
                Confirm Merge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

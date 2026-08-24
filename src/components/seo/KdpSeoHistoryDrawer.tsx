import React from 'react';
import {
  History,
  X,
  Trash2,
  ArrowRight,
  Sparkles,
  Calendar,
  Layers,
  Globe,
} from 'lucide-react';
import { KdpSeoHistorySession } from '../../types/seo';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  sessions: KdpSeoHistorySession[];
  onRestoreSession: (session: KdpSeoHistorySession) => void;
  onDeleteSession: (id: string) => void;
}

export const KdpSeoHistoryDrawer: React.FC<Props> = ({
  isOpen,
  onClose,
  sessions,
  onRestoreSession,
  onDeleteSession,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex justify-end z-50 animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col border-l border-slate-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-amber-600" />
            <h3 className="text-base font-bold text-slate-900">SEO Research History</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sessions List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {sessions.length === 0 ? (
            <div className="p-8 text-center text-slate-400 space-y-2">
              <History className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs">No saved research sessions found.</p>
            </div>
          ) : (
            sessions.map(s => (
              <div
                key={s.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-amber-300 transition-all space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    "{s.seedKeyword}"
                  </span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800">
                    Score: {s.overallScore}%
                  </span>
                </div>

                <div className="flex items-center gap-3 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(s.timestamp).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    {s.marketplace}
                  </span>
                  <span>{s.keywordCount || s.keywords?.length || 0} keywords</span>
                </div>

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      onRestoreSession(s);
                      onClose();
                    }}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 hover:text-amber-700"
                  >
                    Restore Session <ArrowRight className="w-3 h-3" />
                  </button>

                  <button
                    onClick={() => onDeleteSession(s.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded"
                    title="Delete session"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

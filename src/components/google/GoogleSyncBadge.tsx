import React, { useState, useEffect } from 'react';
import {
  FileText,
  RefreshCw,
  ExternalLink,
  Folder,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  Link,
  PlusCircle,
} from 'lucide-react';
import { Project } from '../../types/project';
import { GoogleSyncStatus } from '../../types/googleSync';
import { GoogleAuthService } from '../../services/googleAuthService';
import { GoogleSyncQueue } from '../../services/googleSyncQueue';
import { GoogleDocsService } from '../../services/googleDocsService';
import { useApp } from '../../context/AppContext';

interface GoogleSyncBadgeProps {
  project: Project;
  compact?: boolean;
}

export const GoogleSyncBadge: React.FC<GoogleSyncBadgeProps> = ({ project, compact = false }) => {
  const { showToast, refreshProjects, settings } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [status, setStatus] = useState<GoogleSyncStatus>(
    project.googleIntegration?.googleSyncStatus || (GoogleAuthService.isConnected() ? 'pending' : 'not_connected')
  );
  const [docUrl, setDocUrl] = useState<string | undefined>(project.googleIntegration?.googleDocUrl);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(project.googleIntegration?.lastSyncError);

  const isEnabled = settings.googleDocsSync?.enabled ?? false;

  useEffect(() => {
    setStatus(
      project.googleIntegration?.googleSyncStatus || (GoogleAuthService.isConnected() ? 'pending' : 'not_connected')
    );
    setDocUrl(project.googleIntegration?.googleDocUrl);
    setErrorMessage(project.googleIntegration?.lastSyncError);
  }, [project]);

  useEffect(() => {
    const unsub = GoogleSyncQueue.addStatusListener(evt => {
      if (evt.projectId === project.id) {
        setStatus(evt.status);
        if (evt.docUrl) setDocUrl(evt.docUrl);
        if (evt.error) setErrorMessage(evt.error);
        if (evt.status === 'synced') {
          setErrorMessage(undefined);
        }
      }
    });
    return unsub;
  }, [project.id]);

  const handleSyncNow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!GoogleAuthService.isConnected()) {
      showToast({
        type: 'warning',
        title: 'Google Not Connected',
        message: 'Please connect your Google Account in Settings > Integrations to enable Google Docs sync.',
      });
      return;
    }

    setIsSyncing(true);
    setStatus('syncing');
    try {
      const res = await GoogleSyncQueue.syncNow(project);
      if (res.success) {
        showToast({
          type: 'success',
          title: 'Google Doc Updated',
          message: res.message,
        });
        if (res.docUrl) setDocUrl(res.docUrl);
        setStatus('synced');
        refreshProjects();
      } else {
        showToast({
          type: 'error',
          title: 'Google Sync Failed',
          message: res.message,
        });
        setStatus('error');
        setErrorMessage(res.message);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRecreate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSyncing(true);
    try {
      const res = await GoogleSyncQueue.recreateDoc(project);
      if (res.success) {
        showToast({
          type: 'success',
          title: 'Google Doc Recreated',
          message: res.message,
        });
        if (res.docUrl) setDocUrl(res.docUrl);
        setStatus('synced');
        refreshProjects();
      } else {
        showToast({
          type: 'error',
          title: 'Recreation Failed',
          message: res.message,
        });
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleOpenDoc = (e: React.MouseEvent) => {
    e.stopPropagation();
    const targetUrl =
      docUrl ||
      (project.googleIntegration?.googleDocumentId
        ? `https://docs.google.com/document/d/${project.googleIntegration.googleDocumentId}/edit`
        : null);

    if (targetUrl) {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    } else {
      handleSyncNow(e);
    }
  };

  const handleOpenFolder = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const token = await GoogleAuthService.getAccessToken();
    if (!token) {
      showToast({
        type: 'warning',
        title: 'Google Not Connected',
        message: 'Please connect your Google Account in Settings to view the Drive folder.',
      });
      return;
    }
    try {
      const folderInfo = await GoogleDocsService.getOrCreateStudioFolder(token);
      if (folderInfo.folderUrl) {
        window.open(folderInfo.folderUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Failed to Open Folder',
        message: err?.message || 'Could not locate Studio folder in Google Drive.',
      });
    }
  };

  if (!isEnabled && !GoogleAuthService.isConnected()) {
    return (
      <div
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-500 border border-neutral-200 dark:border-neutral-700"
        title="Google Docs sync is not connected. Enable in Settings > Integrations."
      >
        <span className="w-2 h-2 rounded-full bg-neutral-400"></span>
        <span>Google Docs: Offline</span>
      </div>
    );
  }

  // Render Status Badge
  const renderStatusIndicator = () => {
    switch (status) {
      case 'synced':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>🟢 Synced</span>
          </span>
        );
      case 'syncing':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400">
            <RefreshCw className="w-3 h-3 animate-spin text-amber-500" />
            <span>🟡 Syncing...</span>
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-700 dark:text-rose-400">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            <span>🔴 Sync Error</span>
          </span>
        );
      case 'not_found':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span>🟡 Not Found in Drive</span>
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 dark:text-blue-400">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span>🔵 Sync Pending</span>
          </span>
        );
      case 'not_connected':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500 dark:text-neutral-400">
            <span className="w-2 h-2 rounded-full bg-neutral-400"></span>
            <span>⚪ Not Connected</span>
          </span>
        );
    }
  };

  return (
    <div className="relative inline-block text-left" onClick={e => e.stopPropagation()}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors shadow-xs"
      >
        <FileText className="w-3.5 h-3.5 text-blue-500" />
        {renderStatusIndicator()}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl z-50 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-neutral-900 dark:text-white">Google Docs Auto-Sync</h4>
                  <p className="text-[11px] text-neutral-500">{project.name}</p>
                </div>
              </div>
              <div>{renderStatusIndicator()}</div>
            </div>

            {/* Sync Metadata */}
            <div className="bg-neutral-50 dark:bg-neutral-800/60 rounded-xl p-2.5 text-xs space-y-1.5">
              {project.googleIntegration?.googleDocumentId && (
                <div className="flex justify-between items-center text-neutral-600 dark:text-neutral-400">
                  <span className="text-[11px]">Doc ID:</span>
                  <span className="font-mono text-[10px] bg-neutral-200 dark:bg-neutral-700 px-1.5 py-0.5 rounded max-w-[140px] truncate">
                    {project.googleIntegration.googleDocumentId}
                  </span>
                </div>
              )}
              {project.googleIntegration?.googleLastSyncedAt && (
                <div className="flex justify-between items-center text-neutral-600 dark:text-neutral-400 text-[11px]">
                  <span>Last Synced:</span>
                  <span>{new Date(project.googleIntegration.googleLastSyncedAt).toLocaleTimeString()}</span>
                </div>
              )}
              {errorMessage && (
                <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-[11px]">
                  {errorMessage}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-1.5 pt-1">
              {(status === 'synced' || project.googleIntegration?.googleDocumentId) && (
                <button
                  onClick={handleOpenDoc}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>OPEN GOOGLE DOC</span>
                </button>
              )}

              {status === 'not_found' ? (
                <button
                  onClick={handleRecreate}
                  disabled={isSyncing}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white transition-colors shadow-xs disabled:opacity-50"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>RECREATE GOOGLE DOC</span>
                </button>
              ) : (
                <button
                  onClick={handleSyncNow}
                  disabled={isSyncing}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-750 text-neutral-800 dark:text-neutral-200 transition-colors shadow-xs disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Syncing...' : 'SYNC NOW'}</span>
                </button>
              )}

              <button
                onClick={handleOpenFolder}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <Folder className="w-3.5 h-3.5" />
                <span>OPEN GOOGLE DRIVE FOLDER</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

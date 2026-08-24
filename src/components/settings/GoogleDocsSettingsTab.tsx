import React, { useState, useEffect } from 'react';
import {
  FileText,
  Folder,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Trash2,
  ExternalLink,
  Shield,
  Clock,
  Download,
  Check,
  Zap,
  Lock,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { GoogleAuthService } from '../../services/googleAuthService';
import { GoogleDocsService, StudioFolderInfo } from '../../services/googleDocsService';
import { GoogleSyncQueue } from '../../services/googleSyncQueue';
import { GoogleAuditLogService } from '../../services/googleAuditLogService';
import { GoogleAuditLogEntry } from '../../types/googleSync';
import { StorageService } from '../../services/storageService';

export const GoogleDocsSettingsTab: React.FC = () => {
  const { settings, updateSettings, showToast, refreshProjects, projects } = useApp();

  const [isConnected, setIsConnected] = useState(GoogleAuthService.isConnected());
  const [connectedEmail, setConnectedEmail] = useState(GoogleAuthService.getConnectedEmail());
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [folderInfo, setFolderInfo] = useState<StudioFolderInfo | null>(null);
  const [isLoadingFolder, setIsLoadingFolder] = useState(false);
  const [auditLogs, setAuditLogs] = useState<GoogleAuditLogEntry[]>(GoogleAuditLogService.getLogs(30));
  const [isSyncingAll, setIsSyncingAll] = useState(false);

  const googleSyncConfig = settings.googleDocsSync || {
    enabled: false,
    deleteBehavior: 'delete_linked',
    autoSyncDebounceMs: 1500,
    folderName: 'KDP Book & Puzzle Studio',
  };

  useEffect(() => {
    const unsub = GoogleAuthService.addAuthListener((user, token) => {
      const connected = Boolean(user && token);
      setIsConnected(connected);
      setConnectedEmail(user?.email || null);
      if (connected && token) {
        loadFolder(token);
      }
    });

    return unsub;
  }, []);

  const loadFolder = async (token: string) => {
    setIsLoadingFolder(true);
    try {
      const info = await GoogleDocsService.getOrCreateStudioFolder(token);
      setFolderInfo(info);
    } catch (err: any) {
      console.warn('Could not fetch studio folder:', err);
    } finally {
      setIsLoadingFolder(false);
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const result = await GoogleAuthService.signInWithGoogle();
      if (result) {
        setIsConnected(true);
        setConnectedEmail(result.user.email);

        // Auto enable sync upon connection
        const updated = {
          ...settings,
          googleDocsSync: {
            ...googleSyncConfig,
            enabled: true,
            connectedEmail: result.user.email || undefined,
            lastConnectedAt: new Date().toISOString(),
          },
        };
        updateSettings(updated);
        StorageService.saveSettings(updated);

        showToast({
          type: 'success',
          title: 'Google Account Connected',
          message: `Connected successfully as ${result.user.email}. Google Docs sync is now active.`,
        });

        // Trigger queue processing
        GoogleSyncQueue.processQueue();
        refreshAuditLogs();
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Connection Failed',
        message: err?.message || 'Could not connect Google Account.',
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      await GoogleAuthService.signOutGoogle();
      setIsConnected(false);
      setConnectedEmail(null);
      setFolderInfo(null);

      const updated = {
        ...settings,
        googleDocsSync: {
          ...googleSyncConfig,
          enabled: false,
          connectedEmail: undefined,
        },
      };
      updateSettings(updated);
      StorageService.saveSettings(updated);

      showToast({
        type: 'info',
        title: 'Google Disconnected',
        message: 'Google Account disconnected. Local studio data remains safe.',
      });
      refreshAuditLogs();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Disconnect Failed',
        message: err?.message || 'Error disconnecting account.',
      });
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleToggleSync = (enabled: boolean) => {
    const updated = {
      ...settings,
      googleDocsSync: {
        ...googleSyncConfig,
        enabled,
      },
    };
    updateSettings(updated);
    StorageService.saveSettings(updated);

    if (enabled && isConnected) {
      GoogleSyncQueue.processQueue();
    }

    showToast({
      type: 'info',
      title: enabled ? 'Google Docs Sync Enabled' : 'Google Docs Sync Paused',
      message: enabled
        ? 'All new and modified projects will automatically sync to Google Docs.'
        : 'Automatic synchronization to Google Docs has been paused.',
    });
  };

  const handleDeleteBehaviorChange = (deleteBehavior: 'delete_linked' | 'keep_linked') => {
    const updated = {
      ...settings,
      googleDocsSync: {
        ...googleSyncConfig,
        deleteBehavior,
      },
    };
    updateSettings(updated);
    StorageService.saveSettings(updated);
  };

  const handleDebounceChange = (ms: number) => {
    const updated = {
      ...settings,
      googleDocsSync: {
        ...googleSyncConfig,
        autoSyncDebounceMs: ms,
      },
    };
    updateSettings(updated);
    StorageService.saveSettings(updated);
  };

  const handleSyncAllProjects = async () => {
    if (!isConnected) {
      showToast({
        type: 'warning',
        title: 'Not Connected',
        message: 'Please connect your Google Account first.',
      });
      return;
    }

    setIsSyncingAll(true);
    let successCount = 0;
    try {
      for (const p of projects) {
        const res = await GoogleSyncQueue.syncNow(p);
        if (res.success) successCount++;
      }
      refreshProjects();
      refreshAuditLogs();
      showToast({
        type: 'success',
        title: 'Bulk Sync Complete',
        message: `Successfully synchronized ${successCount} of ${projects.length} projects to Google Docs.`,
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Sync Error',
        message: err?.message || 'An error occurred during bulk sync.',
      });
    } finally {
      setIsSyncingAll(false);
    }
  };

  const refreshAuditLogs = () => {
    setAuditLogs(GoogleAuditLogService.getLogs(30));
  };

  const handleExportAuditLog = () => {
    const json = GoogleAuditLogService.exportLogsAsJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kdp-google-sync-audit-log-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-4xl">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-600/10 via-indigo-600/5 to-transparent border border-blue-200 dark:border-blue-900/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white font-display">
                Google Docs & Drive Integration
              </h2>
              {isConnected ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Connected
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                  Not Connected
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1 max-w-xl">
              Automatically create, update, and manage structured Google Docs documentation for every book project
              directly in a dedicated Google Drive folder with live synchronized metadata and safe deletion sync.
            </p>
          </div>
        </div>

        {isConnected ? (
          <button
            onClick={handleDisconnect}
            disabled={isDisconnecting}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors shadow-xs shrink-0 self-start md:self-auto disabled:opacity-50"
          >
            {isDisconnecting ? 'Disconnecting...' : 'DISCONNECT GOOGLE'}
          </button>
        ) : (
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2.5 transition-all shadow-md hover:shadow-lg shrink-0 self-start md:self-auto disabled:opacity-50"
          >
            {isConnecting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>Connect Google Account</span>
          </button>
        )}
      </div>

      {/* Account & Sync Controls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Account Details & Status */}
        <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider text-neutral-400">
            Connection Status
          </h3>

          {isConnected ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <div>
                  <div className="text-xs font-semibold">✓ Google Account Connected</div>
                  <div className="text-xs text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                    {connectedEmail}
                  </div>
                </div>
              </div>

              {folderInfo && (
                <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-800 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500 flex items-center gap-1.5">
                      <Folder className="w-4 h-4 text-blue-500" /> Dedicated Drive Folder:
                    </span>
                    <span className="font-semibold text-neutral-900 dark:text-white">KDP Book & Puzzle Studio</span>
                  </div>
                  <button
                    onClick={() => window.open(folderInfo.folderUrl, '_blank', 'noopener,noreferrer')}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>OPEN GOOGLE DRIVE FOLDER</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 text-center space-y-2">
              <Lock className="w-8 h-8 text-neutral-400 mx-auto" />
              <div className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                No Google Account Connected
              </div>
              <p className="text-[11px] text-neutral-500">
                Connect your Google account to automatically store book records and synchronize live metadata.
              </p>
            </div>
          )}

          {/* Privacy Notice */}
          <div className="pt-2 flex items-start gap-2 text-[11px] text-neutral-500">
            <Shield className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>
              <strong>Zero Secret Sharing:</strong> Only book metadata, descriptions, and KDP specifications are
              synced. Passwords, API keys, and private Amazon credentials are never transmitted.
            </span>
          </div>
        </div>

        {/* Sync Settings */}
        <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider text-neutral-400">
            Sync Preferences
          </h3>

          {/* Master Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800">
            <div>
              <div className="text-xs font-bold text-neutral-900 dark:text-white">Google Docs Auto-Sync</div>
              <div className="text-[11px] text-neutral-500">Automatically sync book changes to Google Docs</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={googleSyncConfig.enabled}
                onChange={e => handleToggleSync(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Delete Behavior Radio */}
          <div className="space-y-2 pt-1">
            <label className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
              Google Document Deletion Behavior
            </label>
            <div className="space-y-2">
              <label
                onClick={() => handleDeleteBehaviorChange('delete_linked')}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  googleSyncConfig.deleteBehavior === 'delete_linked'
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
                    : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                }`}
              >
                <input
                  type="radio"
                  name="deleteBehavior"
                  checked={googleSyncConfig.deleteBehavior === 'delete_linked'}
                  onChange={() => {}}
                  className="mt-0.5 text-blue-600"
                />
                <div>
                  <div className="text-xs font-semibold text-neutral-900 dark:text-white">
                    Delete linked Google Doc when project is deleted (Recommended)
                  </div>
                  <div className="text-[11px] text-neutral-500">
                    Always shows safety confirmation and only removes Studio-managed documents.
                  </div>
                </div>
              </label>

              <label
                onClick={() => handleDeleteBehaviorChange('keep_linked')}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  googleSyncConfig.deleteBehavior === 'keep_linked'
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
                    : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                }`}
              >
                <input
                  type="radio"
                  name="deleteBehavior"
                  checked={googleSyncConfig.deleteBehavior === 'keep_linked'}
                  onChange={() => {}}
                  className="mt-0.5 text-blue-600"
                />
                <div>
                  <div className="text-xs font-semibold text-neutral-900 dark:text-white">
                    Keep Google Doc when project is deleted
                  </div>
                  <div className="text-[11px] text-neutral-500">
                    Preserves the document in Google Drive even if deleted from Studio.
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Debounce Setting */}
          <div className="pt-2 flex items-center justify-between text-xs">
            <span className="text-neutral-600 dark:text-neutral-400">Sync Debounce Interval:</span>
            <select
              value={googleSyncConfig.autoSyncDebounceMs}
              onChange={e => handleDebounceChange(Number(e.target.value))}
              className="px-2.5 py-1 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-semibold"
            >
              <option value={1000}>1.0s (Fast)</option>
              <option value={1500}>1.5s (Default Recommended)</option>
              <option value={2000}>2.0s (Conservative)</option>
            </select>
          </div>

          {/* Manual Bulk Sync Action */}
          {isConnected && (
            <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <button
                onClick={handleSyncAllProjects}
                disabled={isSyncingAll}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAll ? 'animate-spin' : ''}`} />
                <span>{isSyncingAll ? 'Syncing All Projects...' : `SYNC ALL PROJECTS (${projects.length})`}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider text-neutral-400">
              Google Integration Audit Log
            </h3>
            <p className="text-xs text-neutral-500">Live operational history of document creation, updates, and deletes</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refreshAuditLogs}
              className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
              title="Refresh Logs"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={handleExportAuditLog}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Audit JSON</span>
            </button>
            <button
              onClick={() => {
                GoogleAuditLogService.clearLogs();
                refreshAuditLogs();
              }}
              className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-neutral-400 hover:text-rose-500"
              title="Clear Audit History"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-400 font-semibold uppercase text-[10px]">
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Operation</th>
                <th className="py-2.5 px-3">Project / Target</th>
                <th className="py-2.5 px-3">Result</th>
                <th className="py-2.5 px-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 font-normal">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-neutral-400 italic">
                    No Google integration activity recorded yet.
                  </td>
                </tr>
              ) : (
                auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors">
                    <td className="py-2 px-3 font-mono text-[11px] text-neutral-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2 px-3 font-medium text-neutral-900 dark:text-white whitespace-nowrap">
                      {log.operation}
                    </td>
                    <td className="py-2 px-3 text-neutral-600 dark:text-neutral-300 max-w-[180px] truncate">
                      {log.projectTitle || log.projectId || '—'}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      {log.result === 'success' ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          SUCCESS
                        </span>
                      ) : log.result === 'warning' ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          WARNING
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                          FAILED
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-neutral-500 text-[11px] max-w-[280px] truncate" title={log.details}>
                      {log.details || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

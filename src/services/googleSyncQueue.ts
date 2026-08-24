import { Project } from '../types/project';
import { GoogleSyncOperation, GoogleSyncOperationType, GoogleSyncStatus } from '../types/googleSync';
import { GoogleAuthService } from './googleAuthService';
import { GoogleDocsService } from './googleDocsService';
import { GoogleAuditLogService } from './googleAuditLogService';
import { StorageService } from './storageService';

const QUEUE_STORAGE_KEY = 'kdp_studio_google_sync_queue_v1';
const MAX_ATTEMPTS = 5;

type SyncStatusListener = (status: {
  projectId: string;
  status: GoogleSyncStatus;
  docUrl?: string;
  error?: string;
}) => void;

export class GoogleSyncQueue {
  private static queue: GoogleSyncOperation[] = [];
  private static isProcessing = false;
  private static debounceTimers = new Map<string, any>();
  private static statusListeners: SyncStatusListener[] = [];
  private static initialized = false;

  public static initialize(): void {
    if (this.initialized) return;
    this.initialized = true;
    this.loadQueue();

    // Listen for online status recovery
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.log('[GoogleSyncQueue] Network restored. Processing queue...');
        this.processQueue();
      });
    }

    // Listen for Google Auth connection events
    GoogleAuthService.addAuthListener((user, token) => {
      if (user && token) {
        console.log('[GoogleSyncQueue] Google account authenticated. Flushing pending syncs...');
        this.processQueue();
      }
    });

    // Initial check
    setTimeout(() => {
      this.processQueue();
    }, 1500);
  }

  public static addStatusListener(listener: SyncStatusListener): () => void {
    this.statusListeners.push(listener);
    return () => {
      this.statusListeners = this.statusListeners.filter(l => l !== listener);
    };
  }

  private static notifyStatus(projectId: string, status: GoogleSyncStatus, docUrl?: string, error?: string) {
    this.statusListeners.forEach(l => {
      try {
        l({ projectId, status, docUrl, error });
      } catch (e) {
        console.error('Error in status listener:', e);
      }
    });
  }

  private static loadQueue(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
        if (raw) {
          this.queue = JSON.parse(raw);
        }
      }
    } catch {
      this.queue = [];
    }
  }

  private static persistQueue(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(this.queue));
      }
    } catch (e) {
      console.warn('Failed to save sync queue:', e);
    }
  }

  public static getQueue(): GoogleSyncOperation[] {
    return [...this.queue];
  }

  /**
   * Enqueue a project creation or update with debouncing
   */
  public static queueProjectSync(project: Project, immediate: boolean = false): void {
    const settings = StorageService.getSettings();
    const isSyncEnabled = settings.googleDocsSync?.enabled ?? false;

    // If sync is not enabled or user is not connected, record pending state on project
    if (!isSyncEnabled || !GoogleAuthService.isConnected()) {
      const updatedProject: Project = {
        ...project,
        googleIntegration: {
          ...(project.googleIntegration || { googleCreatedByStudio: true }),
          googleSyncStatus: GoogleAuthService.isConnected() ? 'pending' : 'not_connected',
          pendingGoogleSync: true,
        },
      };
      StorageService.saveProject(updatedProject);
      this.notifyStatus(project.id, updatedProject.googleIntegration!.googleSyncStatus);
      return;
    }

    const debounceMs = immediate ? 0 : settings.googleDocsSync?.autoSyncDebounceMs ?? 1500;

    // Clear existing debounce timer for this project
    if (this.debounceTimers.has(project.id)) {
      clearTimeout(this.debounceTimers.get(project.id));
      this.debounceTimers.delete(project.id);
    }

    // Set immediate status to 'syncing'
    this.notifyStatus(project.id, 'syncing');

    const triggerSync = () => {
      this.debounceTimers.delete(project.id);
      const existingDocId = project.googleIntegration?.googleDocumentId;
      const opType: GoogleSyncOperationType = existingDocId ? 'UPDATE_DOCUMENT' : 'CREATE_DOCUMENT';

      // Idempotency: prune older pending operations for the same project
      this.queue = this.queue.filter(
        op => !(op.projectId === project.id && (op.type === 'CREATE_DOCUMENT' || op.type === 'UPDATE_DOCUMENT'))
      );

      const op: GoogleSyncOperation = {
        operationId: `op-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        projectId: project.id,
        projectTitle: project.name,
        googleDocumentId: existingDocId,
        type: opType,
        status: 'pending',
        attempts: 0,
        maxAttempts: MAX_ATTEMPTS,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      this.queue.push(op);
      this.persistQueue();
      this.processQueue();
    };

    if (debounceMs <= 0) {
      triggerSync();
    } else {
      const timer = setTimeout(triggerSync, debounceMs);
      this.debounceTimers.set(project.id, timer);
    }
  }

  /**
   * Enqueues verified deletion of a project's Google Doc
   */
  public static async queueProjectDelete(
    projectId: string,
    projectTitle: string,
    googleDocId?: string
  ): Promise<{ success: boolean; status: string; reason?: string }> {
    if (!googleDocId) {
      return { success: true, status: 'no_doc' };
    }

    const accessToken = await GoogleAuthService.getAccessToken();
    if (accessToken) {
      // Immediate verified deletion attempt
      try {
        const res = await GoogleDocsService.verifyAndSafeDeleteDoc(googleDocId, projectId, accessToken);
        return res;
      } catch (err: any) {
        console.warn('[GoogleSyncQueue] Immediate delete failed, queueing for retry:', err);
      }
    }

    // Queue for background retry if offline or temporary API error
    const op: GoogleSyncOperation = {
      operationId: `del-op-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      projectId,
      projectTitle,
      googleDocumentId: googleDocId,
      type: 'DELETE_DOCUMENT',
      status: 'pending',
      attempts: 0,
      maxAttempts: MAX_ATTEMPTS,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Remove any pending updates for this project
    this.queue = this.queue.filter(q => q.projectId !== projectId);
    this.queue.push(op);
    this.persistQueue();

    return { success: true, status: 'queued' };
  }

  /**
   * Main Queue Processor with Exponential Backoff
   */
  public static async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    if (this.queue.length === 0) return;

    const accessToken = await GoogleAuthService.getAccessToken();
    if (!accessToken) {
      console.log('[GoogleSyncQueue] No active Google access token. Sync operations remain pending in queue.');
      return;
    }

    this.isProcessing = true;

    try {
      while (this.queue.length > 0) {
        const op = this.queue[0];
        if (op.status === 'processing') {
          break;
        }

        op.status = 'processing';
        op.attempts += 1;
        op.updatedAt = new Date().toISOString();
        this.persistQueue();

        const project = StorageService.getProjectById(op.projectId);

        try {
          if (op.type === 'DELETE_DOCUMENT') {
            if (op.googleDocumentId) {
              await GoogleDocsService.verifyAndSafeDeleteDoc(op.googleDocumentId, op.projectId, accessToken);
            }
          } else if (project) {
            this.notifyStatus(project.id, 'syncing');

            if (op.type === 'CREATE_DOCUMENT' || op.type === 'RECREATE_DOCUMENT' || !project.googleIntegration?.googleDocumentId) {
              const { documentId, docUrl } = await GoogleDocsService.createBookDoc(project, accessToken);

              const updatedProject: Project = {
                ...project,
                googleIntegration: {
                  googleDocumentId: documentId,
                  googleDocUrl: docUrl,
                  googleCreatedByStudio: true,
                  googleAccountEmail: GoogleAuthService.getConnectedEmail() || undefined,
                  googleSyncStatus: 'synced',
                  googleLastSyncedAt: new Date().toISOString(),
                  googleSyncVersion: 1,
                  pendingGoogleSync: false,
                  lastSyncError: undefined,
                },
              };
              StorageService.saveProject(updatedProject);
              this.notifyStatus(project.id, 'synced', docUrl);
            } else if (op.type === 'UPDATE_DOCUMENT') {
              const docId = project.googleIntegration.googleDocumentId;
              try {
                await GoogleDocsService.updateBookDoc(project, docId, accessToken);
                const updatedProject: Project = {
                  ...project,
                  googleIntegration: {
                    ...project.googleIntegration,
                    googleSyncStatus: 'synced',
                    googleLastSyncedAt: new Date().toISOString(),
                    googleSyncVersion: (project.googleIntegration.googleSyncVersion || 1) + 1,
                    pendingGoogleSync: false,
                    lastSyncError: undefined,
                  },
                };
                StorageService.saveProject(updatedProject);
                this.notifyStatus(project.id, 'synced', project.googleIntegration.googleDocUrl);
              } catch (updateErr: any) {
                if (updateErr?.status === 404) {
                  // Document was deleted externally in Google Drive
                  const updatedProject: Project = {
                    ...project,
                    googleIntegration: {
                      ...project.googleIntegration,
                      googleSyncStatus: 'not_found',
                      pendingGoogleSync: false,
                      lastSyncError: 'Google Doc was deleted from Google Drive.',
                    },
                  };
                  StorageService.saveProject(updatedProject);
                  this.notifyStatus(project.id, 'not_found');
                  GoogleAuditLogService.log({
                    operation: 'Google Sync Failed',
                    result: 'warning',
                    projectId: project.id,
                    projectTitle: project.name,
                    googleDocumentId: docId,
                    details: 'Linked Google Doc was not found on Google Drive (404).',
                  });
                } else {
                  throw updateErr;
                }
              }
            }
          }

          // Operation succeeded: Remove from queue
          this.queue.shift();
          this.persistQueue();
        } catch (opErr: any) {
          console.error(`[GoogleSyncQueue] Error executing operation ${op.operationId}:`, opErr);
          op.lastError = opErr?.message || String(opErr);

          if (project) {
            const updatedProject: Project = {
              ...project,
              googleIntegration: {
                ...(project.googleIntegration || { googleCreatedByStudio: true, googleSyncStatus: 'error' }),
                googleSyncStatus: 'error',
                lastSyncError: op.lastError,
              },
            };
            StorageService.saveProject(updatedProject);
            this.notifyStatus(project.id, 'error', undefined, op.lastError);
          }

          GoogleAuditLogService.log({
            operation: 'Google Sync Failed',
            result: 'failed',
            projectId: op.projectId,
            projectTitle: op.projectTitle,
            googleDocumentId: op.googleDocumentId,
            details: `Sync operation ${op.type} failed (attempt ${op.attempts}/${op.maxAttempts}): ${op.lastError}`,
          });

          if (op.attempts >= op.maxAttempts) {
            // Max retries exceeded: Remove from active queue to prevent blocking
            this.queue.shift();
            this.persistQueue();
          } else {
            // Exponential backoff wait before continuing
            op.status = 'failed';
            this.persistQueue();
            const delayMs = Math.min(10000, 1000 * Math.pow(2, op.attempts));
            await new Promise(resolve => setTimeout(resolve, delayMs));
          }
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Manually triggers immediate sync for a project
   */
  public static async syncNow(project: Project): Promise<{ success: boolean; message: string; docUrl?: string }> {
    const accessToken = await GoogleAuthService.getAccessToken();
    if (!accessToken) {
      return {
        success: false,
        message: 'Google account is not connected. Please connect your Google account in Settings.',
      };
    }

    this.notifyStatus(project.id, 'syncing');

    try {
      const docId = project.googleIntegration?.googleDocumentId;
      if (docId) {
        // Update
        try {
          await GoogleDocsService.updateBookDoc(project, docId, accessToken);
          const docUrl = project.googleIntegration?.googleDocUrl || `https://docs.google.com/document/d/${docId}/edit`;
          const updated: Project = {
            ...project,
            googleIntegration: {
              ...project.googleIntegration!,
              googleSyncStatus: 'synced',
              googleLastSyncedAt: new Date().toISOString(),
              pendingGoogleSync: false,
              lastSyncError: undefined,
            },
          };
          StorageService.saveProject(updated);
          this.notifyStatus(project.id, 'synced', docUrl);
          return { success: true, message: 'Google Doc successfully updated!', docUrl };
        } catch (err: any) {
          if (err?.status === 404) {
            // Recreate if not found
            const { documentId, docUrl } = await GoogleDocsService.createBookDoc(project, accessToken);
            const updated: Project = {
              ...project,
              googleIntegration: {
                googleDocumentId: documentId,
                googleDocUrl: docUrl,
                googleCreatedByStudio: true,
                googleAccountEmail: GoogleAuthService.getConnectedEmail() || undefined,
                googleSyncStatus: 'synced',
                googleLastSyncedAt: new Date().toISOString(),
                googleSyncVersion: 1,
                pendingGoogleSync: false,
              },
            };
            StorageService.saveProject(updated);
            this.notifyStatus(project.id, 'synced', docUrl);
            GoogleAuditLogService.log({
              operation: 'Google Doc Recreated',
              result: 'success',
              projectId: project.id,
              projectTitle: project.name,
              googleDocumentId: documentId,
              details: `Recreated missing Google Doc as "${documentId}"`,
            });
            return { success: true, message: 'Missing Google Doc recreated and synchronized!', docUrl };
          }
          throw err;
        }
      } else {
        // Create fresh
        const { documentId, docUrl } = await GoogleDocsService.createBookDoc(project, accessToken);
        const updated: Project = {
          ...project,
          googleIntegration: {
            googleDocumentId: documentId,
            googleDocUrl: docUrl,
            googleCreatedByStudio: true,
            googleAccountEmail: GoogleAuthService.getConnectedEmail() || undefined,
            googleSyncStatus: 'synced',
            googleLastSyncedAt: new Date().toISOString(),
            googleSyncVersion: 1,
            pendingGoogleSync: false,
          },
        };
        StorageService.saveProject(updated);
        this.notifyStatus(project.id, 'synced', docUrl);
        return { success: true, message: 'Google Doc created and synchronized!', docUrl };
      }
    } catch (error: any) {
      console.error('[GoogleSyncQueue] Manual sync failed:', error);
      const errMsg = error?.message || 'Sync failed due to API error.';
      this.notifyStatus(project.id, 'error', undefined, errMsg);
      return { success: false, message: errMsg };
    }
  }

  /**
   * Recreates a document explicitly for a project
   */
  public static async recreateDoc(project: Project): Promise<{ success: boolean; message: string; docUrl?: string }> {
    const accessToken = await GoogleAuthService.getAccessToken();
    if (!accessToken) {
      return { success: false, message: 'Google account is not connected.' };
    }

    try {
      const { documentId, docUrl } = await GoogleDocsService.createBookDoc(project, accessToken);
      const updated: Project = {
        ...project,
        googleIntegration: {
          googleDocumentId: documentId,
          googleDocUrl: docUrl,
          googleCreatedByStudio: true,
          googleAccountEmail: GoogleAuthService.getConnectedEmail() || undefined,
          googleSyncStatus: 'synced',
          googleLastSyncedAt: new Date().toISOString(),
          googleSyncVersion: 1,
          pendingGoogleSync: false,
        },
      };
      StorageService.saveProject(updated);
      this.notifyStatus(project.id, 'synced', docUrl);

      GoogleAuditLogService.log({
        operation: 'Google Doc Recreated',
        result: 'success',
        projectId: project.id,
        projectTitle: project.name,
        googleDocumentId: documentId,
        details: `Manually recreated Google Doc (${documentId})`,
      });

      return { success: true, message: 'Google Doc recreated successfully!', docUrl };
    } catch (e: any) {
      return { success: false, message: e?.message || 'Failed to recreate document.' };
    }
  }
}

export type GoogleSyncStatus =
  | 'synced'
  | 'syncing'
  | 'error'
  | 'not_connected'
  | 'not_found'
  | 'pending';

export interface GoogleIntegration {
  googleDocumentId?: string;
  googleFolderId?: string;
  googleAccountId?: string;
  googleAccountEmail?: string;
  googleSyncStatus: GoogleSyncStatus;
  googleLastSyncedAt?: string;
  googleSyncVersion?: number;
  googleCreatedByStudio: boolean;
  googleDocUrl?: string;
  lastSyncError?: string;
  pendingGoogleSync?: boolean;
}

export type GoogleSyncOperationType =
  | 'CREATE_DOCUMENT'
  | 'UPDATE_DOCUMENT'
  | 'DELETE_DOCUMENT'
  | 'RECREATE_DOCUMENT';

export interface GoogleSyncOperation {
  operationId: string;
  projectId: string;
  projectTitle: string;
  googleDocumentId?: string;
  type: GoogleSyncOperationType;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  attempts: number;
  maxAttempts: number;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
  payload?: any;
}

export type GoogleAuditOperation =
  | 'Google Doc Created'
  | 'Google Doc Updated'
  | 'Google Doc Deleted'
  | 'Google Sync Failed'
  | 'Google Doc Recreated'
  | 'Google Account Connected'
  | 'Google Account Disconnected'
  | 'Google Drive Folder Created'
  | 'Google Sync Retried';

export interface GoogleAuditLogEntry {
  id: string;
  timestamp: string;
  projectId?: string;
  projectTitle?: string;
  googleDocumentId?: string;
  authenticatedUserEmail?: string;
  operation: GoogleAuditOperation;
  result: 'success' | 'failed' | 'warning' | 'skipped';
  details?: string;
}

export interface GoogleDocsSyncSettings {
  enabled: boolean;
  deleteBehavior: 'delete_linked' | 'keep_linked';
  autoSyncDebounceMs: number;
  folderName: string;
  connectedEmail?: string;
  lastConnectedAt?: string;
}

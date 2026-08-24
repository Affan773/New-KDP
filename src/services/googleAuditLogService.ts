import { GoogleAuditLogEntry, GoogleAuditOperation } from '../types/googleSync';
import { IndexedDbService } from './indexedDbService';

const AUDIT_LOG_STORAGE_KEY = 'kdp_studio_google_audit_log_v1';
const MAX_LOG_ENTRIES = 200;

export class GoogleAuditLogService {
  private static memoryLogs: GoogleAuditLogEntry[] = [];
  private static loaded = false;

  private static loadLogs(): GoogleAuditLogEntry[] {
    if (this.loaded) return this.memoryLogs;
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(AUDIT_LOG_STORAGE_KEY);
        if (raw) {
          this.memoryLogs = JSON.parse(raw);
        }
      }
    } catch {
      this.memoryLogs = [];
    }
    this.loaded = true;
    return this.memoryLogs;
  }

  private static persistLogs(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(AUDIT_LOG_STORAGE_KEY, JSON.stringify(this.memoryLogs.slice(0, MAX_LOG_ENTRIES)));
      }
    } catch (e) {
      console.warn('Failed to persist audit logs to localStorage:', e);
    }
  }

  public static log(entry: {
    operation: GoogleAuditOperation;
    result: 'success' | 'failed' | 'warning' | 'skipped';
    projectId?: string;
    projectTitle?: string;
    googleDocumentId?: string;
    authenticatedUserEmail?: string;
    details?: string;
  }): GoogleAuditLogEntry {
    this.loadLogs();
    const newEntry: GoogleAuditLogEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      ...entry,
    };

    this.memoryLogs.unshift(newEntry);
    if (this.memoryLogs.length > MAX_LOG_ENTRIES) {
      this.memoryLogs = this.memoryLogs.slice(0, MAX_LOG_ENTRIES);
    }
    this.persistLogs();
    return newEntry;
  }

  public static getLogs(limit: number = 50): GoogleAuditLogEntry[] {
    return this.loadLogs().slice(0, limit);
  }

  public static getLogsForProject(projectId: string): GoogleAuditLogEntry[] {
    return this.loadLogs().filter(log => log.projectId === projectId);
  }

  public static clearLogs(): void {
    this.memoryLogs = [];
    this.persistLogs();
  }

  public static exportLogsAsJson(): string {
    return JSON.stringify(this.loadLogs(), null, 2);
  }
}

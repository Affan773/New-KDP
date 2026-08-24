import { DEFAULT_ASSETS } from '../constants/assets';
import { INITIAL_DEMO_PROJECTS } from '../constants/demoProjects';
import { createDefaultKdpConfig, DEFAULT_MARGINS, STANDARD_TRIM_SIZES } from '../constants/kdp';
import {
  Asset,
  DocumentModel,
  KDPProjectConfig,
  KDPPublishingAnalytics,
  Project,
  StorageMetrics,
  UserSettings,
} from '../types';
import { IndexedDbService } from './indexedDbService';
import { GoogleSyncQueue } from './googleSyncQueue';

const STORAGE_KEYS = {
  PROJECTS: 'kdp_studio_projects_v1',
  DOCUMENTS: 'kdp_studio_documents_v1',
  DOC_PREFIX: 'kdp_doc_',
  ASSETS: 'kdp_studio_assets_v1',
  SETTINGS: 'kdp_studio_settings_v1',
  ACTIVE_PROJECT_ID: 'kdp_studio_active_project_v1',
};

/**
 * Safe JSON parser with Prototype Pollution defense
 */
function safeJsonParse<T>(jsonString: string | null, fallback: T): T {
  if (!jsonString) return fallback;
  try {
    const parsed = JSON.parse(jsonString, (key, value) => {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        return undefined;
      }
      return value;
    });
    return parsed ?? fallback;
  } catch (e) {
    return fallback;
  }
}

/**
 * Safe localStorage writer with automatic quota defense and cache pruning
 */
function safeSetItem(key: string, value: string): boolean {
  try {
    if (typeof localStorage === 'undefined') return false;
    localStorage.setItem(key, value);
    return true;
  } catch (e: any) {
    // Quota Exceeded handling: prune non-critical document cache from localStorage
    if (e?.name === 'QuotaExceededError' || e?.code === 22 || e?.code === 1014) {
      try {
        // Free up space by removing legacy monolithic documents blob or doc keys
        if (key !== STORAGE_KEYS.DOCUMENTS) {
          localStorage.removeItem(STORAGE_KEYS.DOCUMENTS);
        }
        // Remove individual doc keys that aren't the current key
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith(STORAGE_KEYS.DOC_PREFIX) && k !== key) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));

        // Retry setting the current item
        localStorage.setItem(key, value);
        return true;
      } catch {
        // IndexedDB and memory cache will serve as authoritative storage
        return false;
      }
    }
    return false;
  }
}

const DEFAULT_SETTINGS: UserSettings = {
  profile: {
    id: 'usr-local-creator',
    name: 'KDP Creator',
    email: 'creator@kdpstudiopro.local',
    plan: 'Free Creator',
    booksPublished: 4,
  },
  defaults: {
    trimSizeId: '6x9',
    orientation: 'Portrait',
    margins: DEFAULT_MARGINS,
    bleed: 'No Bleed',
    defaultPageCount: 80,
    paperType: 'White',
  },
  editor: {
    snapToGrid: true,
    gridSize: 20,
    showSafeMargins: true,
    showBleedGuides: true,
    showRulers: true,
    autosaveIntervalSeconds: 3,
    theme: 'dark',
  },
  storage: {
    usedBytes: 0,
    maxBytes: 100 * 1024 * 1024, // 100MB IndexedDB capacity
    projectsCount: 0,
    assetsCount: 0,
    pagesCount: 0,
    databaseStatus: 'Local Storage / Ready for Supabase',
  },
  notifications: {
    autosaveAlerts: true,
    kdpMarginWarnings: true,
    productUpdates: true,
  },
  puzzles: {
    defaultDifficulty: 'Medium',
    defaultWordSearchGridSize: 15,
    defaultSudokuDifficulty: 'Medium',
    autoIncludeSolution: true,
    showWordBank: true,
    showInstructions: true,
  },
  accessibility: {
    reduceMotion: false,
    largerTouchTargets: false,
    highContrast: false,
    keyboardShortcuts: true,
  },
  layout: {
    defaultSidebarCollapsed: false,
    mobileDockPosition: 'bottom',
    confirmDestructiveActions: true,
  },
  general: {
    defaultZoom: 1.0,
    defaultProjectView: 'grid',
  },
  googleDocsSync: {
    enabled: false,
    deleteBehavior: 'delete_linked',
    autoSyncDebounceMs: 1500,
    folderName: 'KDP Book & Puzzle Studio',
  },
};

export class StorageService {
  // In-memory hot cache for instant zero-latency synchronous access
  private static documentCache = new Map<string, DocumentModel>();
  private static projectsCache: Project[] | null = null;
  private static assetsCache: Asset[] | null = null;
  private static settingsCache: UserSettings | null = null;
  private static initialized = false;

  /**
   * Initializes local storage and IndexedDB with demo data if first time running
   */
  public static initialize(): void {
    if (this.initialized) return;
    this.initialized = true;

    try {
      if (typeof window === 'undefined') return;

      const rawProjects = localStorage.getItem(STORAGE_KEYS.PROJECTS);
      const rawLegacyDocs = localStorage.getItem(STORAGE_KEYS.DOCUMENTS);

      if (!rawProjects) {
        // First run: Seed demo projects & documents
        const initialProjects = INITIAL_DEMO_PROJECTS.map(item => item.project);
        this.projectsCache = initialProjects.map(p => this.migrateProject(p));

        INITIAL_DEMO_PROJECTS.forEach(item => {
          this.documentCache.set(item.document.id, item.document);
          // Persist to IndexedDB asynchronously
          IndexedDbService.put('documents', item.document).catch(() => {});
          IndexedDbService.put('projects', item.project).catch(() => {});
        });

        this.assetsCache = [...DEFAULT_ASSETS];
        this.settingsCache = { ...DEFAULT_SETTINGS };

        // Save lightweight projects list to localStorage
        safeSetItem(STORAGE_KEYS.PROJECTS, JSON.stringify(initialProjects));
        safeSetItem(STORAGE_KEYS.ASSETS, JSON.stringify(DEFAULT_ASSETS));
        safeSetItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
      } else {
        // Existing projects: Load into cache
        const projects: Project[] = safeJsonParse(rawProjects, []);
        this.projectsCache = projects.map(p => this.migrateProject(p));

        // Migrate legacy monolithic documents blob to memory + IndexedDB + per-doc keys
        if (rawLegacyDocs) {
          const legacyDocs = safeJsonParse<Record<string, DocumentModel>>(rawLegacyDocs, {});
          Object.values(legacyDocs).forEach(doc => {
            if (doc && doc.id) {
              this.documentCache.set(doc.id, doc);
              IndexedDbService.put('documents', doc).catch(() => {});
            }
          });
          // Remove monolithic key to free localStorage quota
          localStorage.removeItem(STORAGE_KEYS.DOCUMENTS);
        }

        // Seed Global Wonders if missing
        const wondersDemo = INITIAL_DEMO_PROJECTS.find(p => p.project.id === 'proj-wonders-ws');
        if (wondersDemo && !this.projectsCache.some(p => p.id === 'proj-wonders-ws')) {
          this.projectsCache.unshift(this.migrateProject(wondersDemo.project));
          this.documentCache.set(wondersDemo.document.id, wondersDemo.document);
          safeSetItem(STORAGE_KEYS.PROJECTS, JSON.stringify(this.projectsCache));
          IndexedDbService.put('documents', wondersDemo.document).catch(() => {});
          IndexedDbService.put('projects', wondersDemo.project).catch(() => {});
        }
      }

      // Background hydration from IndexedDB for any documents not yet in memory
      this.hydrateFromIndexedDb();
    } catch (e) {
      console.warn('StorageService initialize warning:', e);
    }
  }

  /**
   * Background hydration from IndexedDB
   */
  private static async hydrateFromIndexedDb(): Promise<void> {
    try {
      const docs = await IndexedDbService.getAll<DocumentModel>('documents');
      docs.forEach(doc => {
        if (doc && doc.id && !this.documentCache.has(doc.id)) {
          this.documentCache.set(doc.id, doc);
        }
      });
    } catch {
      // Ignored
    }
  }

  // --- PROJECTS ---
  public static getProjects(): Project[] {
    try {
      this.initialize();
      if (this.projectsCache) {
        return this.projectsCache;
      }
      const raw = localStorage.getItem(STORAGE_KEYS.PROJECTS);
      const projects: Project[] = safeJsonParse(raw, []);
      if (!Array.isArray(projects)) return [];
      this.projectsCache = projects.map(p => this.migrateProject(p));
      return this.projectsCache;
    } catch (e) {
      return [];
    }
  }

  public static migrateProject(project: Project): Project {
    if (!project || typeof project !== 'object') {
      return {
        id: `proj-recovered-${Date.now()}`,
        name: 'Recovered Project',
        description: '',
        type: 'Activity Book',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        pageCount: 24,
        ownerId: 'user-default',
        isFavorite: false,
        documentId: `doc-${Date.now()}`,
        kdpSettings: {
          trimSize: STANDARD_TRIM_SIZES[2] || { id: '8.5x11', name: '8.5" x 11"', width: 8.5, height: 11.0, isPopular: true },
          orientation: 'Portrait',
          pageCount: 24,
          margins: DEFAULT_MARGINS,
          bleed: 'Bleed',
          paperType: 'White',
          spineWidthInches: 0.054,
          coverWidthInches: 17.304,
          coverHeightInches: 11.25,
        },
        sections: [{ id: 'sec-main', title: 'Main Content', order: 0, pageIds: [] }],
        metadata: {
          subtitle: '',
          author: 'KDP Author',
          publisher: 'Independent Publisher',
          description: '',
          category: 'Activity & Puzzle Books',
          keywords: ['kdp', 'puzzle book'],
          copyrightYear: new Date().getFullYear().toString(),
        },
        status: 'Draft',
        schemaVersion: 4,
        kdpConfig: createDefaultKdpConfig({
          id: `proj-recovered-${Date.now()}`,
          name: 'Recovered Project',
          type: 'Activity Book',
          pageCount: 24,
        }),
      };
    }

    // Ensure kdpConfig exists even if schemaVersion is 4
    let kdpConfig = project.kdpConfig;
    if (!kdpConfig) {
      kdpConfig = createDefaultKdpConfig(project);
    }

    if (project.schemaVersion && project.schemaVersion >= 4 && project.kdpConfig) {
      return project;
    }

    const defaultMetadata = {
      title: project.name || 'Untitled Book',
      subtitle: project.metadata?.description || '',
      author: project.metadata?.author || 'KDP Author',
      publisher: project.metadata?.publisher || 'Independent Publisher',
      description: project.description || '',
      category: project.metadata?.category || 'Activity & Puzzle Books',
      keywords: project.metadata?.keywords || ['kdp', 'puzzle book'],
      copyrightYear: new Date().getFullYear().toString(),
    };

    return {
      ...project,
      schemaVersion: 4,
      kdpConfig,
      sections: project.sections || [
        {
          id: `sec-${project.id}-default`,
          title: 'Main Content',
          order: 0,
          pageIds: [],
        },
      ],
      metadata: {
        ...project.metadata,
        ...defaultMetadata,
      },
    };
  }

  /**
   * Aggregates Amazon KDP Publishing Analytics across all projects
   */
  public static getKdpPublishingAnalytics(): KDPPublishingAnalytics {
    const projects = this.getProjects();

    const byBookType: Record<string, number> = {
      'Puzzle Book': 0,
      'Activity Book': 0,
      'Coloring Book': 0,
      Workbook: 0,
      Other: 0,
    };

    const byAiContent: Record<string, number> = {
      'AI-generated': 0,
      'AI-assisted': 0,
      'Human-created': 0,
    };

    const byTrimSize: Record<string, number> = {};
    const byFormat: Record<string, number> = {
      Paperback: 0,
      Hardcover: 0,
    };

    let kdpReady = 0;
    let warnings = 0;
    let failures = 0;
    let exported = 0;
    let drafts = 0;

    const recentSummaries = projects.map(p => {
      const cfg = p.kdpConfig || createDefaultKdpConfig(p);
      const bType = cfg.bookType || 'Puzzle Book';
      byBookType[bType] = (byBookType[bType] || 0) + 1;

      const aiType = cfg.aiContentType || 'AI-generated';
      byAiContent[aiType] = (byAiContent[aiType] || 0) + 1;

      const tSize = cfg.trimSize || '8.5" × 11"';
      byTrimSize[tSize] = (byTrimSize[tSize] || 0) + 1;

      const fmt = cfg.format || 'Paperback';
      byFormat[fmt] = (byFormat[fmt] || 0) + 1;

      if (cfg.publicationStatus === 'EXPORTED') {
        exported++;
      } else if (cfg.publicationStatus === 'KDP_READY') {
        kdpReady++;
      } else if (cfg.publicationStatus === 'READY_WITH_WARNINGS') {
        warnings++;
      } else if (cfg.publicationStatus === 'VALIDATION_FAILED') {
        failures++;
      } else {
        drafts++;
      }

      return {
        id: p.id,
        title: cfg.title || p.name,
        bookType: cfg.bookType,
        format: cfg.format,
        trimSize: cfg.trimSize,
        pageCount: cfg.pageCount || p.pageCount || 24,
        aiContentType: cfg.aiContentType,
        publicationStatus: cfg.publicationStatus,
        validationStatus: cfg.validationStatus,
        errorsCount: cfg.validationErrors?.length || 0,
        warningsCount: cfg.validationWarnings?.length || 0,
        updatedAt: p.updatedAt,
      };
    });

    return {
      totalProjects: projects.length,
      kdpReady,
      warnings,
      failures,
      exported,
      drafts,
      byBookType,
      byAiContent,
      byTrimSize,
      byFormat,
      recentProjects: recentSummaries,
    };
  }

  public static getProjectById(id: string): Project | null {
    const projects = this.getProjects();
    return projects.find(p => p.id === id) || null;
  }

  public static saveProject(project: Project, skipGoogleSync: boolean = false): void {
    const projects = this.getProjects();
    const existingIndex = projects.findIndex(p => p.id === project.id);
    const updated = {
      ...project,
      updatedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      projects[existingIndex] = updated;
    } else {
      projects.unshift(updated);
    }

    this.projectsCache = [...projects];
    safeSetItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
    IndexedDbService.put('projects', updated).catch(() => {});

    // Phase 8: Trigger debounced Google Docs Auto-Sync
    if (!skipGoogleSync) {
      try {
        GoogleSyncQueue.queueProjectSync(updated);
      } catch (err) {
        console.warn('Could not queue project sync:', err);
      }
    }
  }

  public static deleteProject(id: string): void {
    const projects = this.getProjects();
    const target = projects.find(p => p.id === id);
    const filtered = projects.filter(p => p.id !== id);

    this.projectsCache = filtered;
    safeSetItem(STORAGE_KEYS.PROJECTS, JSON.stringify(filtered));
    IndexedDbService.delete('projects', id).catch(() => {});

    if (target?.documentId) {
      this.deleteDocument(target.documentId);
    }

    // Phase 8: Delete linked Google Doc if setting is delete_linked and doc exists
    if (target?.googleIntegration?.googleDocumentId) {
      const settings = this.getSettings();
      if (settings.googleDocsSync?.deleteBehavior !== 'keep_linked') {
        GoogleSyncQueue.queueProjectDelete(
          target.id,
          target.name,
          target.googleIntegration.googleDocumentId
        ).catch(() => {});
      }
    }
  }

  public static duplicateProject(id: string): Project | null {
    const original = this.getProjectById(id);
    if (!original) return null;

    const newProjectId = `proj-${Date.now()}`;
    const newDocId = `doc-${Date.now()}`;

    const originalDoc = this.getDocument(original.documentId);

    const duplicatedProject: Project = {
      ...original,
      id: newProjectId,
      name: `${original.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      documentId: newDocId,
      status: 'Draft',
    };

    // Rule 33: Stripping googleIntegration creates a fresh new Google Doc upon sync
    delete (duplicatedProject as any).googleIntegration;

    if (originalDoc) {
      const duplicatedDoc: DocumentModel = {
        ...originalDoc,
        id: newDocId,
        projectId: newProjectId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        pages: originalDoc.pages.map((p, idx) => ({
          ...p,
          id: `page-${newProjectId}-${idx + 1}`,
          elements: p.elements.map(el => ({
            ...el,
            id: `el-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          })),
        })),
      };
      this.saveDocument(duplicatedDoc);
    }

    this.saveProject(duplicatedProject);
    return duplicatedProject;
  }

  // --- DOCUMENTS ---
  public static getDocument(docId: string): DocumentModel | null {
    try {
      this.initialize();

      // 1. In-memory hot cache
      if (this.documentCache.has(docId)) {
        return this.documentCache.get(docId) || null;
      }

      // 2. Per-document localStorage key
      const perDocRaw = localStorage.getItem(`${STORAGE_KEYS.DOC_PREFIX}${docId}`);
      if (perDocRaw) {
        const parsed = safeJsonParse<DocumentModel | null>(perDocRaw, null);
        if (parsed) {
          this.documentCache.set(docId, parsed);
          return parsed;
        }
      }

      // 3. Fallback to demo projects definition
      const demo = INITIAL_DEMO_PROJECTS.find(d => d.document.id === docId);
      if (demo) {
        this.documentCache.set(docId, demo.document);
        return demo.document;
      }

      return null;
    } catch (e) {
      return null;
    }
  }

  public static saveDocument(doc: DocumentModel): void {
    try {
      this.initialize();

      const updatedDoc: DocumentModel = {
        ...doc,
        updatedAt: new Date().toISOString(),
        schemaVersion: 4,
        pages: (doc.pages || []).map((p, idx) => ({
          ...p,
          pageNumber: p.pageNumber || idx + 1,
          pageType: p.pageType || (idx === 0 ? 'title' : 'content'),
          elements: Array.isArray(p.elements) ? p.elements : [],
        })),
      };

      // 1. Update in-memory cache immediately
      this.documentCache.set(doc.id, updatedDoc);

      // 2. Persist to durable IndexedDB asynchronously
      IndexedDbService.put('documents', updatedDoc).catch(() => {});

      // 3. Persist to per-document localStorage key (with automatic quota defense)
      safeSetItem(`${STORAGE_KEYS.DOC_PREFIX}${doc.id}`, JSON.stringify(updatedDoc));

      // 4. Update project pageCount and timestamp
      const project = this.getProjectById(doc.projectId);
      if (project) {
        this.saveProject({
          ...project,
          pageCount: updatedDoc.pages.length,
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (e) {
      // Memory cache continues to work seamlessly
    }
  }

  public static deleteDocument(docId: string): void {
    try {
      this.documentCache.delete(docId);
      localStorage.removeItem(`${STORAGE_KEYS.DOC_PREFIX}${docId}`);
      IndexedDbService.delete('documents', docId).catch(() => {});
    } catch (e) {
      // Ignored
    }
  }

  // --- ASSETS ---
  public static getAssets(): Asset[] {
    try {
      this.initialize();
      if (this.assetsCache) return this.assetsCache;
      const raw = localStorage.getItem(STORAGE_KEYS.ASSETS);
      const parsed = safeJsonParse(raw, DEFAULT_ASSETS);
      this.assetsCache = parsed;
      return parsed;
    } catch (e) {
      return DEFAULT_ASSETS;
    }
  }

  public static saveAsset(asset: Asset): void {
    const assets = this.getAssets();
    assets.unshift(asset);
    this.assetsCache = [...assets];
    safeSetItem(STORAGE_KEYS.ASSETS, JSON.stringify(assets));
    IndexedDbService.put('assets', asset).catch(() => {});
  }

  public static deleteAsset(id: string): void {
    const assets = this.getAssets();
    const filtered = assets.filter(a => a.id !== id);
    this.assetsCache = filtered;
    safeSetItem(STORAGE_KEYS.ASSETS, JSON.stringify(filtered));
    IndexedDbService.delete('assets', id).catch(() => {});
  }

  // --- SETTINGS ---
  public static getSettings(): UserSettings {
    try {
      if (this.settingsCache) return this.settingsCache;
      const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!raw) return DEFAULT_SETTINGS;
      const parsed = safeJsonParse(raw, DEFAULT_SETTINGS);
      const merged = { ...DEFAULT_SETTINGS, ...parsed };
      this.settingsCache = merged;
      return merged;
    } catch (e) {
      return DEFAULT_SETTINGS;
    }
  }

  public static saveSettings(settings: UserSettings): void {
    this.settingsCache = settings;
    safeSetItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    IndexedDbService.put('settings', { id: 'user_settings', ...settings }).catch(() => {});
  }

  // --- STORAGE METRICS ---
  public static getStorageMetrics(): StorageMetrics {
    const projects = this.getProjects();
    const assets = this.getAssets();
    let totalPages = 0;
    projects.forEach(p => (totalPages += p.pageCount || 0));

    let approxBytes = 0;
    try {
      // Tally document cache size
      this.documentCache.forEach(doc => {
        approxBytes += JSON.stringify(doc).length * 2;
      });
      if (approxBytes === 0) {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) {
            const item = localStorage.getItem(key);
            if (item) approxBytes += item.length * 2;
          }
        }
      }
    } catch {
      approxBytes = 180000;
    }

    return {
      usedBytes: Math.max(120000, approxBytes),
      maxBytes: 100 * 1024 * 1024, // 100MB IndexedDB capacity
      projectsCount: projects.length,
      assetsCount: assets.length,
      pagesCount: totalPages,
      databaseStatus: 'Local Storage / Ready for Supabase',
    };
  }

  // --- BACKUP & RESTORE ---
  public static exportAllData(): string {
    const docsObj: Record<string, DocumentModel> = {};
    this.documentCache.forEach((doc, id) => {
      docsObj[id] = doc;
    });

    const exportData = {
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      projects: this.getProjects(),
      documents: docsObj,
      assets: this.getAssets(),
      settings: this.getSettings(),
    };
    return JSON.stringify(exportData, null, 2);
  }

  public static importAllData(jsonString: string): { success: boolean; message: string; projectCount?: number } {
    try {
      if (!jsonString || typeof jsonString !== 'string' || jsonString.trim().length === 0) {
        return { success: false, message: 'Uploaded file is empty.' };
      }
      if (jsonString.length > 100 * 1024 * 1024) {
        return { success: false, message: 'File is too large (> 100MB).' };
      }

      const data = safeJsonParse<any>(jsonString, null);
      if (!data || typeof data !== 'object') {
        return { success: false, message: 'Invalid JSON format. Expected a valid backup object.' };
      }
      if (!Array.isArray(data.projects)) {
        return { success: false, message: 'Invalid backup file: "projects" list is missing.' };
      }

      const validProjects = data.projects.map((p: any) => this.migrateProject(p));

      this.projectsCache = validProjects;
      safeSetItem(STORAGE_KEYS.PROJECTS, JSON.stringify(validProjects));
      validProjects.forEach(p => IndexedDbService.put('projects', p).catch(() => {}));

      if (data.documents && typeof data.documents === 'object') {
        Object.values(data.documents).forEach((doc: any) => {
          if (doc && doc.id) {
            this.documentCache.set(doc.id, doc);
            safeSetItem(`${STORAGE_KEYS.DOC_PREFIX}${doc.id}`, JSON.stringify(doc));
            IndexedDbService.put('documents', doc).catch(() => {});
          }
        });
      }
      if (Array.isArray(data.assets)) {
        this.assetsCache = data.assets;
        safeSetItem(STORAGE_KEYS.ASSETS, JSON.stringify(data.assets));
        data.assets.forEach(a => IndexedDbService.put('assets', a).catch(() => {}));
      }
      if (data.settings && typeof data.settings === 'object') {
        this.settingsCache = { ...DEFAULT_SETTINGS, ...data.settings };
        safeSetItem(STORAGE_KEYS.SETTINGS, JSON.stringify(this.settingsCache));
      }

      return {
        success: true,
        message: `Imported ${validProjects.length} projects successfully.`,
        projectCount: validProjects.length,
      };
    } catch (e: any) {
      return { success: false, message: e?.message || 'Failed to parse JSON backup file.' };
    }
  }

  public static resetToDemoData(): void {
    this.documentCache.clear();
    this.projectsCache = null;
    this.assetsCache = null;
    this.settingsCache = null;
    this.initialized = false;

    // Clear all localStorage keys
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith('kdp_') || k.startsWith('kdp_studio_'))) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));

    // Clear IndexedDB stores
    IndexedDbService.clear('projects').catch(() => {});
    IndexedDbService.clear('documents').catch(() => {});
    IndexedDbService.clear('assets').catch(() => {});
    IndexedDbService.clear('settings').catch(() => {});

    this.initialize();
  }

  public static clearAllData(): void {
    this.documentCache.clear();
    this.projectsCache = [];
    this.assetsCache = [];
    this.settingsCache = { ...DEFAULT_SETTINGS };

    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith('kdp_') || k.startsWith('kdp_studio_'))) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));

    IndexedDbService.clear('projects').catch(() => {});
    IndexedDbService.clear('documents').catch(() => {});
    IndexedDbService.clear('assets').catch(() => {});

    safeSetItem(STORAGE_KEYS.PROJECTS, JSON.stringify([]));
    safeSetItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
  }
}

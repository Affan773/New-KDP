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

const STORAGE_KEYS = {
  PROJECTS: 'kdp_studio_projects_v1',
  DOCUMENTS: 'kdp_studio_documents_v1',
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
    console.warn('Storage JSON parse error, using fallback:', e);
    return fallback;
  }
}

/**
 * Safe localStorage writer with Quota Exceeded error handling
 */
function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e: any) {
    if (e.name === 'QuotaExceededError' || e.code === 22 || e.code === 1014) {
      console.error('LocalStorage quota exceeded. Please export backup and clear unused projects.');
    } else {
      console.error('Failed to write to localStorage:', e);
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
    maxBytes: 15 * 1024 * 1024, // 15MB Local storage estimation
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
};

export class StorageService {
  /**
   * Initializes local storage with demo data if first time running
   */
  public static initialize(): void {
    try {
      if (!localStorage.getItem(STORAGE_KEYS.PROJECTS)) {
        const initialProjects = INITIAL_DEMO_PROJECTS.map(item => item.project);
        const initialDocuments: Record<string, DocumentModel> = {};
        INITIAL_DEMO_PROJECTS.forEach(item => {
          initialDocuments[item.document.id] = item.document;
        });

        localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(initialProjects));
        localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(initialDocuments));
        localStorage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify(DEFAULT_ASSETS));
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
      }
    } catch (e) {
      console.warn('LocalStorage initialization warning:', e);
    }
  }

  // --- PROJECTS ---
  public static getProjects(): Project[] {
    try {
      this.initialize();
      const raw = localStorage.getItem(STORAGE_KEYS.PROJECTS);
      const projects: Project[] = safeJsonParse(raw, []);
      if (!Array.isArray(projects)) return [];
      // Migrate projects to schemaVersion 4 if needed
      return projects.map(p => this.migrateProject(p));
    } catch (e) {
      console.error('Failed to load projects:', e);
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

  public static saveProject(project: Project): void {
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

    safeSetItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  }

  public static deleteProject(id: string): void {
    const projects = this.getProjects();
    const target = projects.find(p => p.id === id);
    const filtered = projects.filter(p => p.id !== id);
    safeSetItem(STORAGE_KEYS.PROJECTS, JSON.stringify(filtered));

    if (target?.documentId) {
      this.deleteDocument(target.documentId);
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
      const raw = localStorage.getItem(STORAGE_KEYS.DOCUMENTS);
      const docs: Record<string, DocumentModel> = safeJsonParse(raw, {});
      const doc = docs[docId] || null;
      if (!doc) return null;

      // Ensure pages have pageType default if missing
      const migratedPages = (doc.pages || []).map((p, idx) => ({
        ...p,
        pageNumber: p.pageNumber || idx + 1,
        pageType: p.pageType || (idx === 0 ? 'title' : 'content'),
        elements: Array.isArray(p.elements) ? p.elements : [],
      }));

      return {
        ...doc,
        schemaVersion: 4,
        pages: migratedPages,
      };
    } catch (e) {
      console.error('Failed to get document:', e);
      return null;
    }
  }

  public static saveDocument(doc: DocumentModel): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.DOCUMENTS);
      const docs: Record<string, DocumentModel> = safeJsonParse(raw, {});
      docs[doc.id] = {
        ...doc,
        updatedAt: new Date().toISOString(),
      };
      safeSetItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(docs));

      // Also update project's updatedAt and pageCount
      const project = this.getProjectById(doc.projectId);
      if (project) {
        this.saveProject({
          ...project,
          pageCount: doc.pages.length,
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.error('Failed to save document:', e);
    }
  }

  public static deleteDocument(docId: string): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.DOCUMENTS);
      if (!raw) return;
      const docs: Record<string, DocumentModel> = safeJsonParse(raw, {});
      delete docs[docId];
      safeSetItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(docs));
    } catch (e) {
      console.error('Failed to delete document:', e);
    }
  }

  // --- ASSETS ---
  public static getAssets(): Asset[] {
    try {
      this.initialize();
      const raw = localStorage.getItem(STORAGE_KEYS.ASSETS);
      return safeJsonParse(raw, DEFAULT_ASSETS);
    } catch (e) {
      console.error('Failed to get assets:', e);
      return DEFAULT_ASSETS;
    }
  }

  public static saveAsset(asset: Asset): void {
    const assets = this.getAssets();
    assets.unshift(asset);
    safeSetItem(STORAGE_KEYS.ASSETS, JSON.stringify(assets));
  }

  public static deleteAsset(id: string): void {
    const assets = this.getAssets();
    const filtered = assets.filter(a => a.id !== id);
    safeSetItem(STORAGE_KEYS.ASSETS, JSON.stringify(filtered));
  }

  // --- SETTINGS ---
  public static getSettings(): UserSettings {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!raw) return DEFAULT_SETTINGS;
      const parsed = safeJsonParse(raw, DEFAULT_SETTINGS);
      return { ...DEFAULT_SETTINGS, ...parsed };
    } catch (e) {
      console.error('Failed to get settings:', e);
      return DEFAULT_SETTINGS;
    }
  }

  public static saveSettings(settings: UserSettings): void {
    safeSetItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }

  // --- STORAGE METRICS ---
  public static getStorageMetrics(): StorageMetrics {
    const projects = this.getProjects();
    const assets = this.getAssets();
    let totalPages = 0;
    projects.forEach(p => (totalPages += p.pageCount || 0));

    let approxBytes = 0;
    try {
      for (const key of Object.values(STORAGE_KEYS)) {
        const item = localStorage.getItem(key);
        if (item) approxBytes += item.length * 2; // UTF-16 approx bytes
      }
    } catch {
      approxBytes = 120000;
    }

    return {
      usedBytes: approxBytes,
      maxBytes: 15 * 1024 * 1024,
      projectsCount: projects.length,
      assetsCount: assets.length,
      pagesCount: totalPages,
      databaseStatus: 'Local Storage / Ready for Supabase',
    };
  }

  // --- BACKUP & RESTORE ---
  public static exportAllData(): string {
    const exportData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      projects: this.getProjects(),
      documents: safeJsonParse(localStorage.getItem(STORAGE_KEYS.DOCUMENTS), {}),
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
      if (jsonString.length > 50 * 1024 * 1024) {
        return { success: false, message: 'File is too large (> 50MB).' };
      }

      const data = safeJsonParse<any>(jsonString, null);
      if (!data || typeof data !== 'object') {
        return { success: false, message: 'Invalid JSON format. Expected a valid backup object.' };
      }
      if (!Array.isArray(data.projects)) {
        return { success: false, message: 'Invalid backup file: "projects" list is missing.' };
      }

      const validProjects = data.projects.map((p: any) => this.migrateProject(p));

      safeSetItem(STORAGE_KEYS.PROJECTS, JSON.stringify(validProjects));

      if (data.documents && typeof data.documents === 'object') {
        safeSetItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(data.documents));
      }
      if (Array.isArray(data.assets)) {
        safeSetItem(STORAGE_KEYS.ASSETS, JSON.stringify(data.assets));
      }
      if (data.settings && typeof data.settings === 'object') {
        safeSetItem(STORAGE_KEYS.SETTINGS, JSON.stringify({ ...DEFAULT_SETTINGS, ...data.settings }));
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
    localStorage.removeItem(STORAGE_KEYS.PROJECTS);
    localStorage.removeItem(STORAGE_KEYS.DOCUMENTS);
    localStorage.removeItem(STORAGE_KEYS.ASSETS);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    this.initialize();
  }

  public static clearAllData(): void {
    localStorage.removeItem(STORAGE_KEYS.PROJECTS);
    localStorage.removeItem(STORAGE_KEYS.DOCUMENTS);
    localStorage.removeItem(STORAGE_KEYS.ASSETS);
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
  }
}

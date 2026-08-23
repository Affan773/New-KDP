import React, { createContext, useContext, useEffect, useState } from 'react';
import { DEFAULT_MARGINS, STANDARD_TRIM_SIZES } from '../constants/kdp';
import { StorageService } from '../services/storageService';
import { DocumentModel, Project, ProjectType, Template, UserSettings } from '../types';

export type AppRoute =
  | 'landing'
  | 'dashboard'
  | 'projects'
  | 'templates'
  | 'puzzles'
  | 'books'
  | 'editor'
  | 'assets'
  | 'settings'
  | 'help'
  | 'ai'
  | 'pdf-tools'
  | 'kdp-checker'
  | 'kdp-content'
  | 'kdp-details'
  | 'admin';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: string;
}

export interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
}

interface AppContextType {
  currentRoute: AppRoute;
  setCurrentRoute: (route: AppRoute) => void;
  projects: Project[];
  activeProjectId: string | null;
  setActiveProjectId: (id: string | null) => void;
  activeProject: Project | null;
  settings: UserSettings;
  updateSettings: (newSettings: UserSettings) => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  toasts: ToastMessage[];
  showToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
  confirmDialog: ConfirmDialogState;
  showConfirmDialog: (params: Omit<ConfirmDialogState, 'isOpen'>) => void;
  closeConfirmDialog: () => void;
  isNewBookWizardOpen: boolean;
  setIsNewBookWizardOpen: (open: boolean) => void;
  refreshProjects: () => void;
  createProject: (project: Project, initialDocument?: DocumentModel) => void;
  updateProject: (project: Project) => void;
  deleteProject: (id: string) => void;
  duplicateProject: (id: string) => void;
  toggleFavoriteProject: (id: string) => void;
  openProjectInEditor: (projectId: string) => void;
  createProjectFromTemplate: (template: Template) => void;
  quickCreateBook: (type: ProjectType) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentRoute, setCurrentRoute] = useState<AppRoute>('dashboard');
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [settings, setSettings] = useState<UserSettings>(StorageService.getSettings());
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isNewBookWizardOpen, setIsNewBookWizardOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Initialize and load
  useEffect(() => {
    StorageService.initialize();
    const loadedProjects = StorageService.getProjects();
    setProjects(loadedProjects);
    if (loadedProjects.length > 0 && !activeProjectId) {
      setActiveProjectId(loadedProjects[0].id);
    }
    const storedSettings = StorageService.getSettings();
    setSettings(storedSettings);
    if (storedSettings.editor.theme === 'light') {
      setTheme('light');
    } else {
      setTheme('dark');
    }
  }, []);

  // Sync theme with document class
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme: 'light' | 'dark' = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    const updated: UserSettings = {
      ...settings,
      editor: {
        ...settings.editor,
        theme: nextTheme,
      },
    };
    setSettings(updated);
    StorageService.saveSettings(updated);
  };

  const showToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    setToasts(prev => [...prev, { ...toast, id }]);

    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const showConfirmDialog = (params: Omit<ConfirmDialogState, 'isOpen'>) => {
    setConfirmDialog({
      isOpen: true,
      ...params,
    });
  };

  const closeConfirmDialog = () => {
    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
  };

  const refreshProjects = () => {
    const loaded = StorageService.getProjects();
    setProjects(loaded);
  };

  const createProject = (newProject: Project, initialDoc?: DocumentModel) => {
    StorageService.saveProject(newProject);
    if (initialDoc) {
      StorageService.saveDocument(initialDoc);
    }
    refreshProjects();
    setActiveProjectId(newProject.id);
    setCurrentRoute('editor');
    showToast({
      type: 'success',
      title: 'Project Created',
      message: `"${newProject.name}" was created successfully.`,
    });
  };

  const updateProject = (project: Project) => {
    StorageService.saveProject(project);
    refreshProjects();
  };

  const deleteProject = (id: string) => {
    const target = projects.find(p => p.id === id);
    StorageService.deleteProject(id);
    refreshProjects();
    if (activeProjectId === id) {
      const remaining = StorageService.getProjects();
      setActiveProjectId(remaining.length > 0 ? remaining[0].id : null);
    }
    showToast({
      type: 'info',
      title: 'Project Deleted',
      message: target ? `"${target.name}" has been removed.` : 'Project deleted.',
    });
  };

  const duplicateProject = (id: string) => {
    const duplicated = StorageService.duplicateProject(id);
    if (duplicated) {
      refreshProjects();
      showToast({
        type: 'success',
        title: 'Project Duplicated',
        message: `Created copy "${duplicated.name}".`,
      });
    }
  };

  const toggleFavoriteProject = (id: string) => {
    const proj = StorageService.getProjectById(id);
    if (!proj) return;
    const updated = { ...proj, isFavorite: !proj.isFavorite };
    StorageService.saveProject(updated);
    refreshProjects();
  };

  const openProjectInEditor = (projectId: string) => {
    setActiveProjectId(projectId);
    setCurrentRoute('editor');
  };

  const createProjectFromTemplate = (template: Template) => {
    const newProjectId = `proj-${Date.now()}`;
    const newDocId = `doc-${Date.now()}`;

    const newProject: Project = {
      id: newProjectId,
      name: `${template.name} Edition`,
      type: template.projectType,
      description: template.description,
      thumbnail: template.thumbnail,
      pageCount: template.pageCount || 60,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'Draft',
      ownerId: 'user-default-1',
      isFavorite: false,
      documentId: newDocId,
      kdpSettings: {
        trimSize: template.pageSize,
        orientation: template.orientation,
        pageCount: template.pageCount || 60,
        margins: DEFAULT_MARGINS,
        bleed: 'No Bleed',
        paperType: 'White',
        spineWidthInches: 0.135,
        coverWidthInches: template.pageSize.width * 2 + 0.135 + 0.25,
        coverHeightInches: template.pageSize.height + 0.25,
      },
      metadata: {
        category: template.category,
        keywords: template.tags,
      },
    };

    const initialDoc: DocumentModel = {
      id: newDocId,
      projectId: newProjectId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pages: template.pages.map((tp, idx) => ({
        id: `page-${newProjectId}-${idx + 1}`,
        pageNumber: idx + 1,
        backgroundColor: tp.backgroundColor || '#FFFFFF',
        notes: tp.notes || `Template Page ${idx + 1}`,
        elements: tp.elements.map(el => ({
          ...el,
          id: `el-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        })),
      })),
    };

    createProject(newProject, initialDoc);
  };

  const quickCreateBook = (type: ProjectType) => {
    const newProjectId = `proj-${Date.now()}`;
    const newDocId = `doc-${Date.now()}`;
    const defaultTrim = STANDARD_TRIM_SIZES[0]; // 6x9

    const newProject: Project = {
      id: newProjectId,
      name: `Untitled ${type}`,
      type,
      description: `New Amazon KDP ${type.toLowerCase()} interior project.`,
      pageCount: 80,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'Draft',
      ownerId: 'user-default-1',
      isFavorite: false,
      documentId: newDocId,
      kdpSettings: {
        trimSize: defaultTrim,
        orientation: 'Portrait',
        pageCount: 80,
        margins: DEFAULT_MARGINS,
        bleed: 'No Bleed',
        paperType: 'White',
        spineWidthInches: 0.18,
        coverWidthInches: 12.43,
        coverHeightInches: 9.25,
      },
    };

    const initialDoc: DocumentModel = {
      id: newDocId,
      projectId: newProjectId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pages: [
        {
          id: `page-${newProjectId}-1`,
          pageNumber: 1,
          backgroundColor: '#FFFFFF',
          notes: 'Title Page',
          elements: [
            {
              id: `el-text-title`,
              type: 'text',
              content: `MY NEW ${type.toUpperCase()}`,
              x: 50,
              y: 180,
              width: 476,
              height: 80,
              rotation: 0,
              zIndex: 1,
              opacity: 1,
              fontFamily: 'Outfit',
              fontSize: 28,
              fontWeight: '800',
              textAlign: 'center',
              color: '#111827',
              lineHeight: 1.2,
              letterSpacing: 2,
            },
          ],
        },
      ],
    };

    createProject(newProject, initialDoc);
  };

  const updateSettings = (newSettings: UserSettings) => {
    setSettings(newSettings);
    StorageService.saveSettings(newSettings);
    showToast({
      type: 'success',
      message: 'Preferences saved successfully.',
    });
  };

  const activeProject = projects.find(p => p.id === activeProjectId) || null;

  return (
    <AppContext.Provider
      value={{
        currentRoute,
        setCurrentRoute,
        projects,
        activeProjectId,
        setActiveProjectId,
        activeProject,
        settings,
        updateSettings,
        theme,
        setTheme,
        toggleTheme,
        toasts,
        showToast,
        removeToast,
        confirmDialog,
        showConfirmDialog,
        closeConfirmDialog,
        isNewBookWizardOpen,
        setIsNewBookWizardOpen,
        refreshProjects,
        createProject,
        updateProject,
        deleteProject,
        duplicateProject,
        toggleFavoriteProject,
        openProjectInEditor,
        createProjectFromTemplate,
        quickCreateBook,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

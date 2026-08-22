import React, { useState, useRef } from 'react';
import {
  Settings,
  Sliders,
  BookOpen,
  Grid3X3,
  Layout,
  Accessibility,
  Database,
  Info,
  Sun,
  Moon,
  Laptop,
  Save,
  Download,
  Upload,
  RefreshCw,
  Trash2,
  Check,
  Shield,
  Maximize2,
  Ruler,
  Magnet,
  Zap,
  HelpCircle,
  FileCheck,
  FileText,
  Copy,
  Keyboard,
  Eye,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { STANDARD_TRIM_SIZES } from '../../constants/kdp';
import { StorageService } from '../../services/storageService';
import { UserSettings } from '../../types';

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    theme,
    setTheme,
    toggleTheme,
    showToast,
    showConfirmDialog,
    refreshProjects,
  } = useApp();

  const [activeTab, setActiveTab] = useState<
    'general' | 'editor' | 'book' | 'puzzles' | 'layout' | 'accessibility' | 'storage' | 'about'
  >('general');

  // Local form state cloned from settings
  const [localSettings, setLocalSettings] = useState<UserSettings>(settings);
  const [isDirty, setIsDirty] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpdate = (updater: (prev: UserSettings) => UserSettings) => {
    setLocalSettings(prev => {
      const next = updater(prev);
      setIsDirty(true);
      return next;
    });
  };

  const handleSave = () => {
    updateSettings(localSettings);
    setIsDirty(false);
    showToast({
      type: 'success',
      title: 'Settings Saved',
      message: 'Your studio preferences have been updated successfully.',
    });
  };

  const handleExportBackup = () => {
    try {
      const dataStr = StorageService.exportAllData();
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `kdp-studio-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast({
        type: 'success',
        title: 'Backup Exported',
        message: 'All projects, documents, and settings downloaded as JSON.',
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Export Failed',
        message: err?.message || 'Could not export backup.',
      });
    }
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      if (!content) return;

      const result = StorageService.importAllData(content);
      if (result.success) {
        refreshProjects();
        const reloaded = StorageService.getSettings();
        setLocalSettings(reloaded);
        setIsDirty(false);
        showToast({
          type: 'success',
          title: 'Backup Restored',
          message: result.message,
        });
      } else {
        showToast({
          type: 'error',
          title: 'Import Failed',
          message: result.message,
        });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleResetDemoData = () => {
    showConfirmDialog({
      title: 'Reset to Sample Data?',
      message: 'This will reset your projects and templates back to the default initial demo library.',
      confirmLabel: 'Reset Data',
      isDestructive: false,
      onConfirm: () => {
        StorageService.resetToDemoData();
        refreshProjects();
        setLocalSettings(StorageService.getSettings());
        showToast({
          type: 'info',
          title: 'Data Reset',
          message: 'Sample demo library restored.',
        });
      },
    });
  };

  const handleClearAllData = () => {
    showConfirmDialog({
      title: 'Clear All Local Data?',
      message: 'This will permanently remove all custom projects, documents, and assets from your browser local storage. This action cannot be undone unless you have a JSON backup.',
      confirmLabel: 'Delete Everything',
      isDestructive: true,
      onConfirm: () => {
        StorageService.clearAllData();
        refreshProjects();
        setLocalSettings(StorageService.getSettings());
        showToast({
          type: 'warning',
          title: 'Storage Cleared',
          message: 'All local data was removed.',
        });
      },
    });
  };

  const storageMetrics = StorageService.getStorageMetrics();
  const usedMB = (storageMetrics.usedBytes / (1024 * 1024)).toFixed(2);
  const maxMB = (storageMetrics.maxBytes / (1024 * 1024)).toFixed(0);
  const usedPercentage = Math.min(100, Math.max(1, Math.round((storageMetrics.usedBytes / storageMetrics.maxBytes) * 100)));

  const navTabs: { id: typeof activeTab; label: string; icon: React.ReactNode }[] = [
    { id: 'general', label: 'General & Appearance', icon: <Sliders className="w-4 h-4" /> },
    { id: 'editor', label: 'Canvas & Editor', icon: <Magnet className="w-4 h-4" /> },
    { id: 'book', label: 'Book & KDP Defaults', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'puzzles', label: 'Puzzle Engine', icon: <Grid3X3 className="w-4 h-4" /> },
    { id: 'layout', label: 'Layout & Navigation', icon: <Layout className="w-4 h-4" /> },
    { id: 'accessibility', label: 'Accessibility', icon: <Accessibility className="w-4 h-4" /> },
    { id: 'storage', label: 'Storage & Backup', icon: <Database className="w-4 h-4" /> },
    { id: 'about', label: 'About Studio', icon: <Info className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 select-none">
      {/* Header & Save Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white font-display flex items-center gap-2.5">
            <Settings className="w-7 h-7 text-amber-500" />
            <span>Studio Settings Center</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Customize editor controls, default KDP trim sizes, puzzle generators, accessibility, and local storage.
          </p>
        </div>

        {isDirty && (
          <div className="flex items-center gap-2 self-start sm:self-auto animate-in fade-in">
            <button
              onClick={() => {
                setLocalSettings(settings);
                setIsDirty(false);
              }}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors"
            >
              Discard Changes
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-md shadow-amber-500/20 transition-all active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>Save Preferences</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Settings Body with Responsive Sidebar Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Navigation Tabs (Horizontal on mobile/tablet, vertical sidebar on desktop) */}
        <div className="lg:col-span-4 xl:col-span-3 flex lg:flex-col gap-1 overflow-x-auto no-scrollbar p-1 bg-neutral-100 dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800">
          {navTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap text-left ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs font-bold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-neutral-800/50'
              }`}
            >
              <span className={activeTab === tab.id ? 'text-amber-500' : 'text-neutral-400'}>
                {tab.icon}
              </span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Settings Content Area */}
        <div className="lg:col-span-8 xl:col-span-9 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-5 sm:p-7 shadow-xs space-y-6">
          {/* ================= TAB 1: GENERAL ================= */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white font-display">
                  General & Appearance
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Visual theme and core application behavior.
                </p>
              </div>

              {/* Theme Preference */}
              <div className="space-y-3 pt-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Theme Appearance
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'dark', label: 'Dark Mode', icon: <Moon className="w-4 h-4 text-amber-400" /> },
                    { id: 'light', label: 'Light Mode', icon: <Sun className="w-4 h-4 text-amber-500" /> },
                    { id: 'system', label: 'Follow System', icon: <Laptop className="w-4 h-4 text-blue-400" /> },
                  ].map(t => (
                    <button
                      key={t.id}
                      onClick={() => {
                        handleUpdate(prev => ({
                          ...prev,
                          editor: { ...prev.editor, theme: t.id as any },
                        }));
                        if (t.id === 'light') setTheme('light');
                        else setTheme('dark');
                      }}
                      className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                        localSettings.editor.theme === t.id
                          ? 'border-amber-500 bg-amber-500/10 text-neutral-900 dark:text-white font-bold ring-1 ring-amber-500'
                          : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-850 text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      {t.icon}
                      <span className="text-xs font-semibold">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Default Zoom Level */}
              <div className="space-y-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Default Editor Zoom Level
                </label>
                <div className="flex flex-wrap gap-2">
                  {[0.5, 0.75, 1.0, 1.25, 1.5].map(z => (
                    <button
                      key={z}
                      onClick={() =>
                        handleUpdate(prev => ({
                          ...prev,
                          general: { ...prev.general, defaultZoom: z, defaultProjectView: prev.general?.defaultProjectView || 'grid' },
                        }))
                      }
                      className={`px-3 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
                        (localSettings.general?.defaultZoom || 1.0) === z
                          ? 'bg-amber-500 text-neutral-950 shadow-xs'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200'
                      }`}
                    >
                      {Math.round(z * 100)}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Confirm Destructive Actions */}
              <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <label className="flex items-center justify-between p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 cursor-pointer">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-neutral-900 dark:text-white block">
                      Confirm Destructive Actions
                    </span>
                    <span className="text-[11px] text-neutral-500">
                      Show confirmation dialogs when deleting pages, elements, or whole projects.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={localSettings.layout?.confirmDestructiveActions ?? true}
                    onChange={e =>
                      handleUpdate(prev => ({
                        ...prev,
                        layout: { ...prev.layout, defaultSidebarCollapsed: prev.layout?.defaultSidebarCollapsed || false, mobileDockPosition: prev.layout?.mobileDockPosition || 'bottom', confirmDestructiveActions: e.target.checked },
                      }))
                    }
                    className="rounded text-amber-500 focus:ring-0 w-4 h-4"
                  />
                </label>
              </div>
            </div>
          )}

          {/* ================= TAB 2: EDITOR ================= */}
          {activeTab === 'editor' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white font-display">
                  Canvas & Editor Preferences
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Configure snapping, measurement units, margin overlays, and autosave timings.
                </p>
              </div>

              {/* Snapping & Grids */}
              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Snapping & Alignment
                </label>

                <div className="space-y-2">
                  <label className="flex items-center justify-between p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 cursor-pointer">
                    <div>
                      <div className="text-xs font-bold text-neutral-900 dark:text-white">
                        Snap to Grid
                      </div>
                      <div className="text-[11px] text-neutral-500">
                        Automatically align elements to the background coordinate matrix.
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={localSettings.editor.snapToGrid}
                      onChange={e =>
                        handleUpdate(prev => ({
                          ...prev,
                          editor: { ...prev.editor, snapToGrid: e.target.checked },
                        }))
                      }
                      className="rounded text-amber-500 focus:ring-0 w-4 h-4"
                    />
                  </label>

                  <div className="flex items-center justify-between p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60">
                    <div>
                      <div className="text-xs font-bold text-neutral-900 dark:text-white">
                        Grid Step Size
                      </div>
                      <div className="text-[11px] text-neutral-500">
                        Distance in pixels between snapping intersections.
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {[10, 15, 20, 25, 30].map(sz => (
                        <button
                          key={sz}
                          onClick={() =>
                            handleUpdate(prev => ({
                              ...prev,
                              editor: { ...prev.editor, gridSize: sz },
                            }))
                          }
                          className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold ${
                            localSettings.editor.gridSize === sz
                              ? 'bg-amber-500 text-neutral-950 font-bold'
                              : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
                          }`}
                        >
                          {sz}px
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Guides & Overlays */}
              <div className="space-y-3 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Visual Guides & Boundaries
                </label>

                <div className="space-y-2">
                  <label className="flex items-center justify-between p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 cursor-pointer">
                    <div>
                      <div className="text-xs font-bold text-neutral-900 dark:text-white">
                        Show Safe Margins & Gutter by Default
                      </div>
                      <div className="text-[11px] text-neutral-500">
                        Displays the Amazon KDP safe margin box based on book page count.
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={localSettings.editor.showSafeMargins}
                      onChange={e =>
                        handleUpdate(prev => ({
                          ...prev,
                          editor: { ...prev.editor, showSafeMargins: e.target.checked },
                        }))
                      }
                      className="rounded text-amber-500 focus:ring-0 w-4 h-4"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 cursor-pointer">
                    <div>
                      <div className="text-xs font-bold text-neutral-900 dark:text-white">
                        Show 0.125in Bleed Boundary by Default
                      </div>
                      <div className="text-[11px] text-neutral-500">
                        Highlights the physical cut zone for full-bleed print designs.
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={localSettings.editor.showBleedGuides}
                      onChange={e =>
                        handleUpdate(prev => ({
                          ...prev,
                          editor: { ...prev.editor, showBleedGuides: e.target.checked },
                        }))
                      }
                      className="rounded text-amber-500 focus:ring-0 w-4 h-4"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 cursor-pointer">
                    <div>
                      <div className="text-xs font-bold text-neutral-900 dark:text-white">
                        Show Coordinate Rulers
                      </div>
                      <div className="text-[11px] text-neutral-500">
                        Displays horizontal and vertical measurement scales on the canvas frame.
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={localSettings.editor.showRulers}
                      onChange={e =>
                        handleUpdate(prev => ({
                          ...prev,
                          editor: { ...prev.editor, showRulers: e.target.checked },
                        }))
                      }
                      className="rounded text-amber-500 focus:ring-0 w-4 h-4"
                    />
                  </label>
                </div>
              </div>

              {/* Autosave Interval */}
              <div className="space-y-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Autosave Interval
                </label>
                <div className="flex flex-wrap gap-2">
                  {[1, 3, 5, 10, 30].map(sec => (
                    <button
                      key={sec}
                      onClick={() =>
                        handleUpdate(prev => ({
                          ...prev,
                          editor: { ...prev.editor, autosaveIntervalSeconds: sec },
                        }))
                      }
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all ${
                        localSettings.editor.autosaveIntervalSeconds === sec
                          ? 'bg-amber-500 text-neutral-950 font-bold'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      {sec}s interval
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 3: BOOK DEFAULTS ================= */}
          {activeTab === 'book' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white font-display">
                  Default Book & Manuscript Settings
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Set baseline parameters used when creating new KDP books with the quick wizard.
                </p>
              </div>

              {/* Default Trim Size */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Default Trim Size
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {STANDARD_TRIM_SIZES.map(trim => (
                    <button
                      key={trim.id}
                      onClick={() =>
                        handleUpdate(prev => ({
                          ...prev,
                          defaults: { ...prev.defaults, trimSizeId: trim.id },
                        }))
                      }
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        localSettings.defaults.trimSizeId === trim.id
                          ? 'border-amber-500 bg-amber-500/10 text-neutral-900 dark:text-white font-bold ring-1 ring-amber-500'
                          : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-850 text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      <div className="text-xs font-bold">{trim.name}</div>
                      <div className="text-[10px] text-neutral-500 font-mono">
                        {trim.width}" × {trim.height}" ({trim.category})
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Default Margins */}
              <div className="space-y-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Default Margins (Inches)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                    <span className="text-neutral-400 text-[10px] block font-semibold">Top Margin</span>
                    <input
                      type="number"
                      step="0.05"
                      min="0.25"
                      value={localSettings.defaults.margins.top}
                      onChange={e =>
                        handleUpdate(prev => ({
                          ...prev,
                          defaults: {
                            ...prev.defaults,
                            margins: { ...prev.defaults.margins, top: parseFloat(e.target.value) || 0.5 },
                          },
                        }))
                      }
                      className="w-full bg-transparent font-mono font-bold outline-none text-neutral-900 dark:text-white mt-1"
                    />
                  </div>

                  <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                    <span className="text-neutral-400 text-[10px] block font-semibold">Bottom Margin</span>
                    <input
                      type="number"
                      step="0.05"
                      min="0.25"
                      value={localSettings.defaults.margins.bottom}
                      onChange={e =>
                        handleUpdate(prev => ({
                          ...prev,
                          defaults: {
                            ...prev.defaults,
                            margins: { ...prev.defaults.margins, bottom: parseFloat(e.target.value) || 0.5 },
                          },
                        }))
                      }
                      className="w-full bg-transparent font-mono font-bold outline-none text-neutral-900 dark:text-white mt-1"
                    />
                  </div>

                  <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                    <span className="text-neutral-400 text-[10px] block font-semibold">Inside / Gutter</span>
                    <input
                      type="number"
                      step="0.05"
                      min="0.375"
                      value={localSettings.defaults.margins.left}
                      onChange={e =>
                        handleUpdate(prev => ({
                          ...prev,
                          defaults: {
                            ...prev.defaults,
                            margins: { ...prev.defaults.margins, left: parseFloat(e.target.value) || 0.625 },
                          },
                        }))
                      }
                      className="w-full bg-transparent font-mono font-bold outline-none text-neutral-900 dark:text-white mt-1"
                    />
                  </div>

                  <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                    <span className="text-neutral-400 text-[10px] block font-semibold">Outside Margin</span>
                    <input
                      type="number"
                      step="0.05"
                      min="0.25"
                      value={localSettings.defaults.margins.right}
                      onChange={e =>
                        handleUpdate(prev => ({
                          ...prev,
                          defaults: {
                            ...prev.defaults,
                            margins: { ...prev.defaults.margins, right: parseFloat(e.target.value) || 0.375 },
                          },
                        }))
                      }
                      className="w-full bg-transparent font-mono font-bold outline-none text-neutral-900 dark:text-white mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Default Page Count & Bleed */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500">
                    Default Initial Page Count
                  </label>
                  <input
                    type="number"
                    min="24"
                    max="500"
                    step="4"
                    value={localSettings.defaults.defaultPageCount}
                    onChange={e =>
                      handleUpdate(prev => ({
                        ...prev,
                        defaults: { ...prev.defaults, defaultPageCount: parseInt(e.target.value) || 80 },
                      }))
                    }
                    className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 font-mono text-sm font-bold outline-none text-neutral-900 dark:text-white"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500">
                    Default Bleed Setting
                  </label>
                  <div className="flex gap-2">
                    {['No Bleed', 'Bleed'].map(b => (
                      <button
                        key={b}
                        onClick={() =>
                          handleUpdate(prev => ({
                            ...prev,
                            defaults: { ...prev.defaults, bleed: b as any },
                          }))
                        }
                        className={`flex-1 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                          localSettings.defaults.bleed === b
                            ? 'border-amber-500 bg-amber-500/10 text-neutral-900 dark:text-white font-bold'
                            : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 4: PUZZLES ================= */}
          {activeTab === 'puzzles' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white font-display">
                  Puzzle Engine Baseline Preferences
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Default difficulty, grid density, solution keys, and vocabulary bank configurations.
                </p>
              </div>

              {/* Default Difficulty */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Default Puzzle Difficulty
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {['Easy', 'Medium', 'Hard', 'Expert'].map(d => (
                    <button
                      key={d}
                      onClick={() =>
                        handleUpdate(prev => ({
                          ...prev,
                          puzzles: {
                            defaultDifficulty: d as any,
                            defaultWordSearchGridSize: prev.puzzles?.defaultWordSearchGridSize || 15,
                            defaultSudokuDifficulty: d as any,
                            autoIncludeSolution: prev.puzzles?.autoIncludeSolution ?? true,
                            showWordBank: prev.puzzles?.showWordBank ?? true,
                            showInstructions: prev.puzzles?.showInstructions ?? true,
                          },
                        }))
                      }
                      className={`p-3 rounded-2xl border text-center font-bold text-xs transition-all ${
                        (localSettings.puzzles?.defaultDifficulty || 'Medium') === d
                          ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-850 text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Word Search Grid Size */}
              <div className="space-y-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Default Word Search Grid Matrix
                </label>
                <div className="flex flex-wrap gap-2">
                  {[10, 12, 14, 15, 16, 18, 20].map(g => (
                    <button
                      key={g}
                      onClick={() =>
                        handleUpdate(prev => ({
                          ...prev,
                          puzzles: {
                            defaultDifficulty: prev.puzzles?.defaultDifficulty || 'Medium',
                            defaultWordSearchGridSize: g,
                            defaultSudokuDifficulty: prev.puzzles?.defaultSudokuDifficulty || 'Medium',
                            autoIncludeSolution: prev.puzzles?.autoIncludeSolution ?? true,
                            showWordBank: prev.puzzles?.showWordBank ?? true,
                            showInstructions: prev.puzzles?.showInstructions ?? true,
                          },
                        }))
                      }
                      className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all ${
                        (localSettings.puzzles?.defaultWordSearchGridSize || 15) === g
                          ? 'bg-amber-500 text-neutral-950 font-bold'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      {g} × {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Auto Toggles */}
              <div className="space-y-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <label className="flex items-center justify-between p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 cursor-pointer">
                  <div>
                    <div className="text-xs font-bold text-neutral-900 dark:text-white">
                      Include Solution Keys by Default in Batch Books
                    </div>
                    <div className="text-[11px] text-neutral-500">
                      Appends answer key pages at the end of generated puzzle books.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={localSettings.puzzles?.autoIncludeSolution ?? true}
                    onChange={e =>
                      handleUpdate(prev => ({
                        ...prev,
                        puzzles: {
                          defaultDifficulty: prev.puzzles?.defaultDifficulty || 'Medium',
                          defaultWordSearchGridSize: prev.puzzles?.defaultWordSearchGridSize || 15,
                          defaultSudokuDifficulty: prev.puzzles?.defaultSudokuDifficulty || 'Medium',
                          autoIncludeSolution: e.target.checked,
                          showWordBank: prev.puzzles?.showWordBank ?? true,
                          showInstructions: prev.puzzles?.showInstructions ?? true,
                        },
                      }))
                    }
                    className="rounded text-amber-500 focus:ring-0 w-4 h-4"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 cursor-pointer">
                  <div>
                    <div className="text-xs font-bold text-neutral-900 dark:text-white">
                      Display Word Bank Clues Under Grids
                    </div>
                    <div className="text-[11px] text-neutral-500">
                      Renders vocabulary word list bank at the bottom of puzzle pages.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={localSettings.puzzles?.showWordBank ?? true}
                    onChange={e =>
                      handleUpdate(prev => ({
                        ...prev,
                        puzzles: {
                          defaultDifficulty: prev.puzzles?.defaultDifficulty || 'Medium',
                          defaultWordSearchGridSize: prev.puzzles?.defaultWordSearchGridSize || 15,
                          defaultSudokuDifficulty: prev.puzzles?.defaultSudokuDifficulty || 'Medium',
                          autoIncludeSolution: prev.puzzles?.autoIncludeSolution ?? true,
                          showWordBank: e.target.checked,
                          showInstructions: prev.puzzles?.showInstructions ?? true,
                        },
                      }))
                    }
                    className="rounded text-amber-500 focus:ring-0 w-4 h-4"
                  />
                </label>
              </div>
            </div>
          )}

          {/* ================= TAB 5: LAYOUT & NAVIGATION ================= */}
          {activeTab === 'layout' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white font-display">
                  Layout & Mobile Navigation
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Configure drawer responsiveness and navigation docks for phones and tablets.
                </p>
              </div>

              <div className="space-y-3">
                <label className="flex items-center justify-between p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 cursor-pointer">
                  <div>
                    <div className="text-xs font-bold text-neutral-900 dark:text-white">
                      Collapse Desktop Sidebar by Default
                    </div>
                    <div className="text-[11px] text-neutral-500">
                      Starts the desktop layout with an icon-only narrow sidebar.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={localSettings.layout?.defaultSidebarCollapsed ?? false}
                    onChange={e =>
                      handleUpdate(prev => ({
                        ...prev,
                        layout: {
                          defaultSidebarCollapsed: e.target.checked,
                          mobileDockPosition: prev.layout?.mobileDockPosition || 'bottom',
                          confirmDestructiveActions: prev.layout?.confirmDestructiveActions ?? true,
                        },
                      }))
                    }
                    className="rounded text-amber-500 focus:ring-0 w-4 h-4"
                  />
                </label>

                <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 space-y-2">
                  <div className="text-xs font-bold text-neutral-900 dark:text-white">
                    Mobile Bottom Navigation Dock
                  </div>
                  <div className="text-[11px] text-neutral-500 leading-relaxed">
                    On small smartphone screens, the studio automatically switches to a high-contrast touch-friendly bottom dock with quick actions for Dashboard, Projects, Editor, and Puzzle Center.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 6: ACCESSIBILITY ================= */}
          {activeTab === 'accessibility' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white font-display">
                  Accessibility & Comfort
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Visual contrast, reduced animation intensity, and keyboard controls.
                </p>
              </div>

              <div className="space-y-3">
                <label className="flex items-center justify-between p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 cursor-pointer">
                  <div>
                    <div className="text-xs font-bold text-neutral-900 dark:text-white">
                      Reduce Motion & Transitions
                    </div>
                    <div className="text-[11px] text-neutral-500">
                      Disables complex scaling and sliding animations across modal dialogs.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={localSettings.accessibility?.reduceMotion ?? false}
                    onChange={e =>
                      handleUpdate(prev => ({
                        ...prev,
                        accessibility: {
                          reduceMotion: e.target.checked,
                          largerTouchTargets: prev.accessibility?.largerTouchTargets ?? false,
                          highContrast: prev.accessibility?.highContrast ?? false,
                          keyboardShortcuts: prev.accessibility?.keyboardShortcuts ?? true,
                        },
                      }))
                    }
                    className="rounded text-amber-500 focus:ring-0 w-4 h-4"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 cursor-pointer">
                  <div>
                    <div className="text-xs font-bold text-neutral-900 dark:text-white">
                      Larger Touch Targets (48px Min)
                    </div>
                    <div className="text-[11px] text-neutral-500">
                      Increases padding and interactive clickable areas for mobile touchscreens.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={localSettings.accessibility?.largerTouchTargets ?? false}
                    onChange={e =>
                      handleUpdate(prev => ({
                        ...prev,
                        accessibility: {
                          reduceMotion: prev.accessibility?.reduceMotion ?? false,
                          largerTouchTargets: e.target.checked,
                          highContrast: prev.accessibility?.highContrast ?? false,
                          keyboardShortcuts: prev.accessibility?.keyboardShortcuts ?? true,
                        },
                      }))
                    }
                    className="rounded text-amber-500 focus:ring-0 w-4 h-4"
                  />
                </label>
              </div>

              {/* Keyboard Shortcuts Reference */}
              <div className="space-y-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <div className="text-xs font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                  <Keyboard className="w-3.5 h-3.5" />
                  <span>Editor Keyboard Shortcuts</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {[
                    { key: 'Ctrl + S / Cmd + S', desc: 'Save manuscript immediately' },
                    { key: 'Ctrl + Z / Cmd + Z', desc: 'Undo canvas action' },
                    { key: 'Ctrl + Y / Cmd + Shift + Z', desc: 'Redo canvas action' },
                    { key: 'Ctrl + C / Cmd + C', desc: 'Copy selected element' },
                    { key: 'Ctrl + V / Cmd + V', desc: 'Paste copied element' },
                    { key: 'Ctrl + D / Cmd + D', desc: 'Duplicate selected element' },
                    { key: 'Delete / Backspace', desc: 'Delete selected element' },
                    { key: 'Esc', desc: 'Deselect / Close drawer' },
                    { key: 'Arrow Keys', desc: 'Nudge element by 1px (Shift + Arrow for 10px)' },
                  ].map(sc => (
                    <div
                      key={sc.key}
                      className="p-2 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 flex items-center justify-between"
                    >
                      <span className="text-[11px] text-neutral-600 dark:text-neutral-400">{sc.desc}</span>
                      <kbd className="px-2 py-0.5 rounded bg-white dark:bg-neutral-700 font-mono text-[10px] font-bold border border-neutral-200 dark:border-neutral-600">
                        {sc.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 7: STORAGE & BACKUP ================= */}
          {activeTab === 'storage' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white font-display">
                  Storage & Data Backup
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Real-time local storage metrics, full JSON export, restore from backup, and cache management.
                </p>
              </div>

              {/* Storage Capacity Bar */}
              <div className="p-4 sm:p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-750 space-y-3">
                <div className="flex items-center justify-between text-xs sm:text-sm font-semibold">
                  <span className="text-neutral-700 dark:text-neutral-300">Local Browser Storage Usage</span>
                  <span className="font-mono text-neutral-900 dark:text-white">
                    {usedMB} MB / ~{maxMB} MB ({usedPercentage}%)
                  </span>
                </div>

                <div className="w-full bg-neutral-200 dark:bg-neutral-700 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${usedPercentage}%` }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
                  <div className="p-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700">
                    <div className="font-bold text-sm text-neutral-900 dark:text-white font-mono">
                      {storageMetrics.projectsCount}
                    </div>
                    <div className="text-[10px] text-neutral-500">Projects</div>
                  </div>
                  <div className="p-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700">
                    <div className="font-bold text-sm text-neutral-900 dark:text-white font-mono">
                      {storageMetrics.pagesCount}
                    </div>
                    <div className="text-[10px] text-neutral-500">Total Pages</div>
                  </div>
                  <div className="p-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700">
                    <div className="font-bold text-sm text-neutral-900 dark:text-white font-mono">
                      {storageMetrics.assetsCount}
                    </div>
                    <div className="text-[10px] text-neutral-500">Vector Assets</div>
                  </div>
                </div>
              </div>

              {/* Export / Import Actions */}
              <div className="space-y-3 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Data Backup & Portability
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={handleExportBackup}
                    className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-850 hover:border-amber-500 text-left flex items-start gap-3 transition-all group"
                  >
                    <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 shrink-0 group-hover:scale-105 transition-transform">
                      <Download className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-neutral-900 dark:text-white">
                        Export Full Backup JSON
                      </div>
                      <div className="text-[11px] text-neutral-500 mt-0.5">
                        Download a single structured JSON file containing all books, puzzles, and settings.
                      </div>
                    </div>
                  </button>

                  <label className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-850 hover:border-amber-500 text-left flex items-start gap-3 transition-all cursor-pointer group">
                    <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500 shrink-0 group-hover:scale-105 transition-transform">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-bold text-neutral-900 dark:text-white">
                        Restore Backup File
                      </div>
                      <div className="text-[11px] text-neutral-500 mt-0.5">
                        Upload and restore a previously saved KDP Studio .json backup.
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json"
                        onChange={handleImportBackup}
                        className="hidden"
                      />
                    </div>
                  </label>
                </div>
              </div>

              {/* Cache & Reset Controls */}
              <div className="space-y-3 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <label className="block text-xs font-bold uppercase tracking-wider text-rose-500">
                  Maintenance & Cache Reset
                </label>

                <div className="flex flex-wrap gap-2.5">
                  <button
                    onClick={handleResetDemoData}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-amber-500" />
                    <span>Reset to Demo Library</span>
                  </button>

                  <button
                    onClick={handleClearAllData}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 border border-rose-500/20 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear All Local Storage</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 8: ABOUT ================= */}
          {activeTab === 'about' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white font-display">
                  About KDP Book & Puzzle Studio
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Architecture specifications, KDP print guidelines, and engine versioning.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-sm">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>KDP Studio Pro v1.0.0</span>
                </div>
                <p className="text-xs text-amber-900/80 dark:text-amber-200/80 leading-relaxed">
                  Engineered specifically for Amazon Kindle Direct Publishing (KDP) low-content and medium-content interior publishing. Designed for full offline-first editing with zero latency and high-precision print layout standards.
                </p>
              </div>

              {/* KDP Guidelines Quick Reference */}
              <div className="space-y-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Amazon KDP Print Specifications Reference
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-700/60">
                    <div className="font-bold text-neutral-900 dark:text-white">Minimum Resolution</div>
                    <div className="text-[11px] text-neutral-500 mt-0.5">300 DPI / PPI for crisp print reproduction.</div>
                  </div>
                  <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-700/60">
                    <div className="font-bold text-neutral-900 dark:text-white">Bleed Standard</div>
                    <div className="text-[11px] text-neutral-500 mt-0.5">0.125 inches (1/8") added on top, bottom, and outside edges.</div>
                  </div>
                  <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-700/60">
                    <div className="font-bold text-neutral-900 dark:text-white">Gutter Margin</div>
                    <div className="text-[11px] text-neutral-500 mt-0.5">0.375" (up to 150 pages) to 0.75" (up to 500 pages) for spine binding.</div>
                  </div>
                  <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-700/60">
                    <div className="font-bold text-neutral-900 dark:text-white">Ink & Color Output</div>
                    <div className="text-[11px] text-neutral-500 mt-0.5">High-contrast black & white interior vector rendering.</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

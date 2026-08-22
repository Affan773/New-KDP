import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  BookOpen,
  Printer,
  Sparkles,
  FileText,
  Sliders,
  Layers,
  HelpCircle,
  Package,
  Plus,
  Trash2,
  ArrowRight,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import {
  KDP_AI_CONTENT_OPTIONS,
  KDP_BLEED_OPTIONS,
  KDP_BOOK_TYPES,
  KDP_COVER_FINISHES,
  KDP_FORMATS,
  KDP_INTERIOR_TYPES,
  KDP_ISBN_TYPES,
  KDP_MARKETPLACES,
  KDP_PAPER_TYPES,
  STANDARD_TRIM_SIZES,
  calculateKdpCoverDimensions,
  calculateKdpInsideMargin,
  calculateKdpSpineWidth,
  createDefaultKdpConfig,
  findTrimSize,
} from '../../constants/kdp';
import { useApp } from '../../context/AppContext';
import { useOptionalEditor } from '../../context/EditorContext';
import { KDPPreflightService } from '../../services/kdpPreflightService';
import {
  KDPAiContentType,
  KDPBleed,
  KDPBookType,
  KDPCoverFinish,
  KDPFormat,
  KDPInteriorType,
  KDPIsbnType,
  KDPPaperType,
  KDPProjectConfig,
} from '../../types/kdp';
import { Project } from '../../types/project';
import { KdpExportModal } from './KdpExportModal';
import { KdpValidationModal } from './KdpValidationModal';

interface KdpProjectTabProps {
  project?: Project;
  onUpdateProject?: (updated: Project) => void;
}

export const KdpProjectTab: React.FC<KdpProjectTabProps> = ({ project: propProject, onUpdateProject }) => {
  const { activeProject, updateProject, showToast } = useApp();
  const editorContext = useOptionalEditor();
  const currentDoc = editorContext?.document || null;

  const targetProject = propProject || activeProject;
  const [isValidationModalOpen, setIsValidationModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<'overview' | 'metadata' | 'print' | 'ai' | 'validation'>('overview');
  const [newKeyword, setNewKeyword] = useState('');

  if (!targetProject) {
    return (
      <div className="p-6 text-center text-neutral-500 dark:text-neutral-400">
        No active project selected.
      </div>
    );
  }

  const kdpConfig: KDPProjectConfig = targetProject.kdpConfig || createDefaultKdpConfig(targetProject);

  const handleConfigChange = (updates: Partial<KDPProjectConfig>) => {
    const updatedConfig: KDPProjectConfig = {
      ...kdpConfig,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    const updatedProject: Project = {
      ...targetProject,
      name: updates.title !== undefined ? updates.title : targetProject.name,
      description: updates.description !== undefined ? updates.description : targetProject.description,
      kdpConfig: updatedConfig,
      updatedAt: new Date().toISOString(),
    };

    if (onUpdateProject) {
      onUpdateProject(updatedProject);
    } else {
      updateProject(updatedProject);
    }
  };

  const handleAddKeyword = () => {
    const trimmed = newKeyword.trim();
    if (!trimmed) return;
    const currentKw = kdpConfig.keywords || [];
    if (currentKw.length >= 7) {
      showToast({
        type: 'warning',
        title: 'Keyword Limit Reached',
        message: 'Amazon KDP allows a maximum of 7 backend keyword phrases.',
      });
      return;
    }
    if (currentKw.includes(trimmed)) {
      showToast({
        type: 'warning',
        title: 'Duplicate Keyword',
        message: 'This keyword phrase is already added.',
      });
      return;
    }
    handleConfigChange({ keywords: [...currentKw, trimmed] });
    setNewKeyword('');
  };

  const handleRemoveKeyword = (index: number) => {
    const currentKw = [...(kdpConfig.keywords || [])];
    currentKw.splice(index, 1);
    handleConfigChange({ keywords: currentKw });
  };

  // Run real-time preflight check for banner status
  const preflightReport = KDPPreflightService.validate(targetProject, currentDoc);

  // Spine & Cover live calculation
  const trimObj = findTrimSize(kdpConfig.trimSize || '8.5x11');
  const effectivePages = currentDoc?.pages?.length || kdpConfig.pageCount || targetProject.pageCount || 80;
  const spineWidth = calculateKdpSpineWidth(effectivePages, (kdpConfig.paperType as any) || 'White');
  const gutterMargin = calculateKdpInsideMargin(effectivePages);
  const coverDims = calculateKdpCoverDimensions(trimObj.width, trimObj.height, spineWidth);

  return (
    <div className="space-y-6 text-neutral-900 dark:text-neutral-100">
      {/* Top Status Header Banner */}
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-gradient-to-r from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-950 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
              preflightReport.status === 'PASS'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                : preflightReport.status === 'WARNING'
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
            }`}
          >
            {preflightReport.status === 'PASS' ? (
              <CheckCircle2 className="w-6 h-6" />
            ) : preflightReport.status === 'WARNING' ? (
              <AlertTriangle className="w-6 h-6" />
            ) : (
              <XCircle className="w-6 h-6" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                KDP Preflight Status
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                  preflightReport.status === 'PASS'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : preflightReport.status === 'WARNING'
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                }`}
              >
                {preflightReport.status === 'PASS'
                  ? 'KDP READY'
                  : preflightReport.status === 'WARNING'
                  ? 'READY WITH WARNINGS'
                  : 'VALIDATION FAILED'}
              </span>
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-0.5">
              {preflightReport.status === 'PASS'
                ? 'All mandatory mechanical, metadata, and AI disclosure checks passed.'
                : preflightReport.status === 'WARNING'
                ? `${preflightReport.warnings.length} warning(s) found. Manuscript can be exported.`
                : `${preflightReport.errors.length} blocking error(s) must be fixed before publishing.`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsValidationModalOpen(true)}
            className="px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
            <span>Inspect Checks</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExportModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold shadow-sm shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-1.5"
          >
            <Package className="w-3.5 h-3.5" />
            <span>Export Package</span>
          </button>
        </div>
      </div>

      {/* Sub Navigation Bar */}
      <div className="flex border-b border-neutral-200 dark:border-neutral-800 gap-1 overflow-x-auto pb-1 text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveSection('overview')}
          className={`px-3 py-2 rounded-t-xl transition-all whitespace-nowrap ${
            activeSection === 'overview'
              ? 'bg-neutral-200 dark:bg-neutral-800 text-amber-600 dark:text-amber-400 border-b-2 border-amber-500'
              : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
          }`}
        >
          Overview & Specs
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('metadata')}
          className={`px-3 py-2 rounded-t-xl transition-all whitespace-nowrap ${
            activeSection === 'metadata'
              ? 'bg-neutral-200 dark:bg-neutral-800 text-amber-600 dark:text-amber-400 border-b-2 border-amber-500'
              : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
          }`}
        >
          Book Metadata
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('print')}
          className={`px-3 py-2 rounded-t-xl transition-all whitespace-nowrap ${
            activeSection === 'print'
              ? 'bg-neutral-200 dark:bg-neutral-800 text-amber-600 dark:text-amber-400 border-b-2 border-amber-500'
              : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
          }`}
        >
          Print & Manufacturing
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('ai')}
          className={`px-3 py-2 rounded-t-xl transition-all whitespace-nowrap ${
            activeSection === 'ai'
              ? 'bg-neutral-200 dark:bg-neutral-800 text-amber-600 dark:text-amber-400 border-b-2 border-amber-500'
              : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
          }`}
        >
          AI Disclosure (Mandatory)
        </button>
      </div>

      {/* SECTION 1: OVERVIEW & SPECS */}
      {activeSection === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Spec Card 1: Format & Trim */}
            <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-neutral-500 dark:text-neutral-400">
                <Printer className="w-4 h-4 text-amber-500" />
                <span>Format & Trim</span>
              </div>
              <div className="text-base font-bold text-neutral-900 dark:text-white">
                {kdpConfig.format} • {kdpConfig.trimSize}
              </div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400">
                {effectivePages} Interior Pages ({kdpConfig.interiorType} on {kdpConfig.paperType})
              </div>
            </div>

            {/* Spec Card 2: Spine & Cover Wrap */}
            <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-neutral-500 dark:text-neutral-400">
                <Layers className="w-4 h-4 text-blue-500" />
                <span>Cover Wrap & Spine</span>
              </div>
              <div className="text-base font-bold text-neutral-900 dark:text-white font-mono">
                {coverDims.width}" × {coverDims.height}"
              </div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400">
                Spine: {spineWidth}" • Gutter Margin: {gutterMargin}"
              </div>
            </div>

            {/* Spec Card 3: AI & Category */}
            <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-neutral-500 dark:text-neutral-400">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                <span>AI Content & Type</span>
              </div>
              <div className="text-base font-bold text-neutral-900 dark:text-white">
                {kdpConfig.aiContentType}
              </div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400">
                {kdpConfig.bookType} • {kdpConfig.coverFinish} Lamination
              </div>
            </div>
          </div>

          {/* Quick Preflight Highlights Card */}
          <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                Preflight Verification Breakdown
              </h3>
              <button
                type="button"
                onClick={() => setIsValidationModalOpen(true)}
                className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
              >
                <span>Full Audit</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2">
              {preflightReport.checks.slice(0, 5).map(c => (
                <div
                  key={c.id}
                  className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/70 dark:border-neutral-700/50 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        c.status === 'PASS'
                          ? 'bg-emerald-500'
                          : c.status === 'WARNING'
                          ? 'bg-amber-500'
                          : 'bg-red-500'
                      }`}
                    />
                    <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                      [{c.category}] {c.name}
                    </span>
                  </div>
                  <span className="text-neutral-500 dark:text-neutral-400 text-[11px] truncate max-w-[280px]">
                    {c.message}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: METADATA */}
      {activeSection === 'metadata' && (
        <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-5">
          <div className="border-b border-neutral-100 dark:border-neutral-800 pb-3">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
              Amazon KDP Book Details & Metadata
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              These details match Amazon KDP product listing fields and are packaged into metadata.json.
            </p>
          </div>

          {/* Book Type & Primary Language */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                Book Type Classification
              </label>
              <select
                value={kdpConfig.bookType}
                onChange={e => handleConfigChange({ bookType: e.target.value as KDPBookType })}
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              >
                {KDP_BOOK_TYPES.map(bt => (
                  <option key={bt.id} value={bt.id}>
                    {bt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                Primary Language
              </label>
              <select
                value={kdpConfig.language}
                onChange={e => handleConfigChange({ language: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              >
                <option value="English">English</option>
                <option value="Spanish">Spanish (Español)</option>
                <option value="French">French (Français)</option>
                <option value="German">German (Deutsch)</option>
                <option value="Italian">Italian (Italiano)</option>
                <option value="Portuguese">Portuguese (Português)</option>
                <option value="Japanese">Japanese (日本語)</option>
              </select>
            </div>
          </div>

          {/* Title & Subtitle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                Book Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={kdpConfig.title}
                onChange={e => handleConfigChange({ title: e.target.value })}
                placeholder="e.g. Ultimate Brain Games Word Search for Adults"
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                Subtitle (Optional)
              </label>
              <input
                type="text"
                value={kdpConfig.subtitle}
                onChange={e => handleConfigChange({ subtitle: e.target.value })}
                placeholder="e.g. 100 Large Print Themed Puzzles with Full Solutions"
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          </div>

          {/* Author & Contributor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                Author / Pen Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={kdpConfig.authorName}
                onChange={e => handleConfigChange({ authorName: e.target.value })}
                placeholder="e.g. Studio Puzzles Press"
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                Contributor / Illustrator
              </label>
              <input
                type="text"
                value={kdpConfig.contributorName || ''}
                onChange={e => handleConfigChange({ contributorName: e.target.value })}
                placeholder="Optional contributor"
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                Amazon Sales Description <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] text-neutral-400 font-mono">
                {kdpConfig.description?.length || 0} characters
              </span>
            </div>
            <textarea
              rows={4}
              value={kdpConfig.description}
              onChange={e => handleConfigChange({ description: e.target.value })}
              placeholder="Detailed sales description of your book..."
              className="w-full p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          {/* 7 Backend Keywords */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                Amazon KDP 7 Search Keyword Phrases ({kdpConfig.keywords?.length || 0}/7)
              </label>
              <span className="text-[11px] text-neutral-400">Target buyer search phrases</span>
            </div>

            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newKeyword}
                onChange={e => setNewKeyword(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddKeyword();
                  }
                }}
                placeholder="Add keyword phrase (e.g. large print word search for seniors)..."
                className="flex-1 px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
              <button
                type="button"
                onClick={handleAddKeyword}
                disabled={(kdpConfig.keywords?.length || 0) >= 7}
                className="px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white dark:bg-neutral-200 dark:text-neutral-900 dark:hover:bg-white text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {(kdpConfig.keywords || []).map((kw, idx) => (
                <div
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs font-medium flex items-center gap-1.5 border border-neutral-200 dark:border-neutral-700"
                >
                  <span className="text-neutral-400 font-mono text-[10px]">#{idx + 1}</span>
                  <span>{kw}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveKeyword(idx)}
                    className="text-neutral-400 hover:text-red-500 transition-colors ml-0.5"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: PRINT & MANUFACTURING */}
      {activeSection === 'print' && (
        <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-5">
          <div className="border-b border-neutral-100 dark:border-neutral-800 pb-3">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
              Amazon KDP Print & Manufacturing Specifications
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Configures mechanical dimensions, paper absorption, spine formulas, and trim boundaries.
            </p>
          </div>

          {/* Format Selection (Paperback vs Hardcover) */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-2">
              Print Binding Format
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {KDP_FORMATS.map(fmt => (
                <div
                  key={fmt.id}
                  onClick={() => handleConfigChange({ format: fmt.id })}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    kdpConfig.format === fmt.id
                      ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 ring-2 ring-amber-500/20'
                      : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-neutral-900 dark:text-white">{fmt.label}</span>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                      Min {fmt.minPages} pages
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
                    {fmt.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Standard Trim Sizes */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-2">
              Standard KDP Trim Size
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {STANDARD_TRIM_SIZES.map(trim => (
                <button
                  key={trim.id}
                  type="button"
                  onClick={() => handleConfigChange({ trimSize: trim.name })}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    kdpConfig.trimSize === trim.name || kdpConfig.trimSize === trim.id
                      ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 text-neutral-900 dark:text-white'
                      : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                  }`}
                >
                  <div className="font-bold text-xs">{trim.name}</div>
                  <div className="text-[10px] text-neutral-400">{trim.category}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Interior Type & Paper Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                Interior Color Type
              </label>
              <select
                value={kdpConfig.interiorType}
                onChange={e => handleConfigChange({ interiorType: e.target.value as KDPInteriorType })}
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              >
                {KDP_INTERIOR_TYPES.map(it => (
                  <option key={it.id} value={it.id}>
                    {it.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                Paper Stock
              </label>
              <select
                value={kdpConfig.paperType}
                onChange={e => handleConfigChange({ paperType: e.target.value as KDPPaperType })}
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              >
                {KDP_PAPER_TYPES.map(pt => (
                  <option key={pt.id} value={pt.id}>
                    {pt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Bleed & Cover Finish */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                Bleed Settings
              </label>
              <select
                value={kdpConfig.bleed}
                onChange={e => handleConfigChange({ bleed: e.target.value as KDPBleed })}
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              >
                {KDP_BLEED_OPTIONS.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                Cover Finish Lamination
              </label>
              <select
                value={kdpConfig.coverFinish}
                onChange={e => handleConfigChange({ coverFinish: e.target.value as KDPCoverFinish })}
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              >
                {KDP_COVER_FINISHES.map(cf => (
                  <option key={cf.id} value={cf.id}>
                    {cf.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ISBN & Marketplace */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                ISBN Option
              </label>
              <select
                value={kdpConfig.isbnType}
                onChange={e => handleConfigChange({ isbnType: e.target.value as KDPIsbnType })}
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              >
                {KDP_ISBN_TYPES.map(isbn => (
                  <option key={isbn.id} value={isbn.id}>
                    {isbn.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                Primary Marketplace
              </label>
              <select
                value={kdpConfig.marketplace}
                onChange={e => handleConfigChange({ marketplace: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              >
                {KDP_MARKETPLACES.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.currency})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: AI CONTENT DISCLOSURE */}
      {activeSection === 'ai' && (
        <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-5">
          <div className="border-b border-neutral-100 dark:border-neutral-800 pb-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 mb-2">
              <Sparkles className="w-3 h-3" />
              <span>Mandatory Amazon KDP Publishing Policy</span>
            </div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
              AI-Generated Content Disclosure
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
              Amazon requires all authors and publishers to disclose whether text, images, or puzzle content were generated with AI-based tools.
            </p>
          </div>

          <div className="space-y-3">
            {KDP_AI_CONTENT_OPTIONS.map(opt => (
              <div
                key={opt.id}
                onClick={() => handleConfigChange({ aiContentType: opt.id })}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  kdpConfig.aiContentType === opt.id
                    ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 ring-2 ring-amber-500/20'
                    : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={kdpConfig.aiContentType === opt.id}
                      onChange={() => handleConfigChange({ aiContentType: opt.id })}
                      className="text-amber-500 focus:ring-amber-500"
                    />
                    <span className="font-bold text-xs text-neutral-900 dark:text-white">{opt.label}</span>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                    {opt.badge}
                  </span>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1.5 ml-6 leading-relaxed">
                  {opt.description}
                </p>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/80 dark:border-neutral-700/60 text-xs text-neutral-600 dark:text-neutral-300 space-y-1.5">
            <div className="font-bold text-neutral-800 dark:text-neutral-200">
              Guidance on Puzzle & Studio AI Generation:
            </div>
            <p className="text-[11px] leading-relaxed">
              If you generated themed word banks or puzzle vocabulary using the built-in Gemini Assistant, select <strong>"AI-generated"</strong>. If you supplied your own word lists and only used automatic grid placement algorithms, select <strong>"AI-assisted"</strong> or <strong>"Human-created"</strong>.
            </p>
          </div>
        </div>
      )}

      {/* MODALS */}
      {isValidationModalOpen && (
        <KdpValidationModal
          project={targetProject}
          document={currentDoc}
          onClose={() => setIsValidationModalOpen(false)}
          onOpenExport={() => {
            setIsValidationModalOpen(false);
            setIsExportModalOpen(true);
          }}
        />
      )}

      {isExportModalOpen && (
        <KdpExportModal
          project={targetProject}
          document={currentDoc}
          onClose={() => setIsExportModalOpen(false)}
        />
      )}
    </div>
  );
};

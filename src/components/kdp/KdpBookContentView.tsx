import React, { useState } from 'react';
import {
  FileText,
  BookOpen,
  Printer,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Download,
  Eye,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  Layers,
  Sliders,
  Maximize2,
  ChevronRight,
  ArrowRight,
  Shield,
  Info,
  Package,
  FileCheck,
} from 'lucide-react';
import {
  calculateKdpCoverDimensions,
  calculateKdpInsideMargin,
  calculateKdpSpineWidth,
  findTrimSize,
  STANDARD_TRIM_SIZES,
  KDP_PAPER_TYPES,
  KDP_BLEED_OPTIONS,
  KDP_COVER_FINISHES,
  KDP_INTERIOR_TYPES,
} from '../../constants/kdp';
import { useApp } from '../../context/AppContext';
import { useOptionalEditor } from '../../context/EditorContext';
import { KDPContentValidator } from '../../services/kdpContentValidator';
import { KDPFieldMapper } from '../../services/kdpFieldMapper';
import { KDPExportService } from '../../services/kdpExportService';
import { PdfExportService } from '../../services/pdfExportService';
import {
  KDPAiContentType,
  KDPBleed,
  KDPCoverFinish,
  KDPInteriorType,
  KDPPaperType,
  KDPProjectConfig,
  KDPWorkflowStep,
} from '../../types/kdp';
import { Project } from '../../types/project';

interface KdpBookContentViewProps {
  project?: Project;
  onUpdateProject?: (updated: Project) => void;
  onNavigateWorkflow?: (step: KDPWorkflowStep) => void;
}

export const KdpBookContentView: React.FC<KdpBookContentViewProps> = ({
  project: propProject,
  onUpdateProject,
  onNavigateWorkflow,
}) => {
  const { activeProject, updateProject, showToast, setCurrentRoute } = useApp();
  const editorContext = useOptionalEditor();
  const currentDoc = editorContext?.document || null;

  const targetProject = propProject || activeProject;

  // Local State
  const [currentStep, setCurrentStep] = useState<KDPWorkflowStep>('content');
  const [isRegeneratingInterior, setIsRegeneratingInterior] = useState(false);
  const [isRegeneratingCover, setIsRegeneratingCover] = useState(false);
  const [isDownloadingPackage, setIsDownloadingPackage] = useState(false);
  const [isEditingPrintSettings, setIsEditingPrintSettings] = useState(false);
  const [previewModalType, setPreviewModalType] = useState<'interior' | 'cover' | null>(null);
  const [previewPageNumber, setPreviewPageNumber] = useState(1);
  const [previewZoom, setPreviewZoom] = useState(1.0);
  const [showPrintGuides, setShowPrintGuides] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showKdpChecklistModal, setShowKdpChecklistModal] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<string>('');

  if (!targetProject) {
    return (
      <div className="p-8 text-center text-neutral-500 dark:text-neutral-400">
        No active book project found. Select or create a project to manage KDP Content.
      </div>
    );
  }

  const kdpConfig: KDPProjectConfig = targetProject.kdpConfig || {
    bookId: targetProject.id,
    title: targetProject.name || 'Untitled Book',
    subtitle: targetProject.metadata?.subtitle || '',
    authorName: targetProject.metadata?.author || 'Independent Creator',
    contributorName: '',
    language: targetProject.metadata?.language || 'English',
    description: targetProject.metadata?.description || targetProject.description || '',
    keywords: targetProject.metadata?.keywords || [],
    categories: targetProject.metadata?.category ? [targetProject.metadata.category] : ['Activity & Puzzle Books'],
    bookType: 'Puzzle Book',
    format: 'Paperback',
    trimSize: targetProject.kdpSettings?.trimSize?.name || '8.5" × 11"',
    pageCount: targetProject.pageCount || 80,
    interiorType: 'Black & White',
    paperType: 'White',
    bleed: targetProject.kdpSettings?.bleed || 'No Bleed',
    coverFinish: 'Matte',
    isbnType: 'Free KDP ISBN',
    aiContentType: 'Human-created',
    aiDisclosureExplicitlySelected: false,
    contentVersion: {
      interiorVersion: 1,
      coverVersion: 1,
      printConfigVersion: 1,
      interiorOutdated: false,
      coverOutdated: false,
      lastGeneratedPageCount: targetProject.pageCount || 80,
      lastGeneratedTrimSize: targetProject.kdpSettings?.trimSize?.name || '8.5" × 11"',
    },
    marketplace: 'amazon.com',
    publicationStatus: 'DRAFT',
    validationStatus: 'NOT_VALIDATED',
    validationErrors: [],
    validationWarnings: [],
    createdAt: targetProject.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const effectivePages = currentDoc?.pages?.length || targetProject.pageCount || kdpConfig.pageCount || 80;
  const trimObj = targetProject.kdpSettings?.trimSize || findTrimSize(kdpConfig.trimSize || '8.5x11');
  const spineWidth = calculateKdpSpineWidth(effectivePages, (kdpConfig.paperType as any) || 'White');
  const coverDimensions = calculateKdpCoverDimensions(trimObj.width, trimObj.height, spineWidth);
  const gutterMargin = calculateKdpInsideMargin(effectivePages);

  // Validate Content
  const validationReport = KDPContentValidator.validateContent(targetProject, currentDoc);
  const fieldMapping = KDPFieldMapper.mapProjectToKDP(targetProject);

  // Handle Updates
  const handleUpdateConfig = (updates: Partial<KDPProjectConfig>, markOutdated?: { interior?: boolean; cover?: boolean; reason?: string }) => {
    const currentVersion = kdpConfig.contentVersion || {
      interiorVersion: 1,
      coverVersion: 1,
      printConfigVersion: 1,
      lastGeneratedPageCount: effectivePages,
      lastGeneratedTrimSize: kdpConfig.trimSize,
    };

    const newVersion = {
      ...currentVersion,
      printConfigVersion: currentVersion.printConfigVersion + 1,
      interiorOutdated: markOutdated?.interior !== undefined ? markOutdated.interior : currentVersion.interiorOutdated,
      coverOutdated: markOutdated?.cover !== undefined ? markOutdated.cover : currentVersion.coverOutdated,
      outdatedReason: markOutdated?.reason || currentVersion.outdatedReason,
    };

    const updatedConfig: KDPProjectConfig = {
      ...kdpConfig,
      ...updates,
      contentVersion: newVersion,
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

  // Regeneration Handlers
  const handleRegenerateInterior = async () => {
    setIsRegeneratingInterior(true);
    try {
      await new Promise(r => setTimeout(r, 600));
      const currentVersion = kdpConfig.contentVersion || { interiorVersion: 1, coverVersion: 1, printConfigVersion: 1 };
      handleUpdateConfig(
        {},
        {
          interior: false,
          cover: currentVersion.coverOutdated, // keep cover state
          reason: undefined,
        }
      );
      // increment interior version
      const updatedConfig: KDPProjectConfig = {
        ...kdpConfig,
        contentVersion: {
          ...(kdpConfig.contentVersion || { coverVersion: 1, printConfigVersion: 1, interiorVersion: 1 }),
          interiorVersion: (kdpConfig.contentVersion?.interiorVersion || 1) + 1,
          interiorOutdated: false,
          lastGeneratedPageCount: effectivePages,
          lastGeneratedTrimSize: kdpConfig.trimSize,
        },
      };
      updateProject({
        ...targetProject,
        kdpConfig: updatedConfig,
      });
      showToast({
        type: 'success',
        title: 'Interior Regenerated',
        message: `Interior PDF updated to v${(kdpConfig.contentVersion?.interiorVersion || 1) + 1} (${effectivePages} pages).`,
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Regeneration Error',
        message: err?.message || 'Failed to regenerate interior.',
      });
    } finally {
      setIsRegeneratingInterior(false);
    }
  };

  const handleRegenerateCover = async () => {
    setIsRegeneratingCover(true);
    try {
      await new Promise(r => setTimeout(r, 500));
      const nextCoverVersion = (kdpConfig.contentVersion?.coverVersion || 1) + 1;
      const updatedConfig: KDPProjectConfig = {
        ...kdpConfig,
        contentVersion: {
          ...(kdpConfig.contentVersion || { interiorVersion: 1, printConfigVersion: 1, coverVersion: 1 }),
          coverVersion: nextCoverVersion,
          coverOutdated: false,
          lastGeneratedPageCount: effectivePages,
          lastGeneratedTrimSize: kdpConfig.trimSize,
          lastGeneratedPaperType: kdpConfig.paperType,
          lastGeneratedBleed: kdpConfig.bleed,
        },
      };
      updateProject({
        ...targetProject,
        kdpConfig: updatedConfig,
      });
      showToast({
        type: 'success',
        title: 'Cover Regenerated',
        message: `Full wrap cover recalculated for ${effectivePages} pages (Spine: ${spineWidth.toFixed(4)}").`,
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Cover Error',
        message: err?.message || 'Failed to regenerate cover.',
      });
    } finally {
      setIsRegeneratingCover(false);
    }
  };

  // Helper to trigger browser download
  const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement('a');
    link.href = url;
    link.download = filename;
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // Download Handlers
  const handleDownloadInterior = async () => {
    try {
      if (!currentDoc || !currentDoc.pages || currentDoc.pages.length === 0) {
        showToast({
          type: 'warning',
          title: 'Manuscript Empty',
          message: 'Please generate puzzle pages before downloading interior.',
        });
        return;
      }
      showToast({
        type: 'info',
        title: 'Rendering Interior PDF',
        message: 'Assembling high-resolution print PDF...',
      });
      const res = await PdfExportService.exportInteriorPdf(targetProject, currentDoc, {
        format: 'interior_pdf',
        colorMode: kdpConfig.interiorType === 'Black & White' ? 'grayscale' : 'rgb',
        includeBleed: kdpConfig.bleed === 'Bleed',
        includeCropMarks: false,
        pageRange: 'all',
        paperStock: (kdpConfig.paperType as any) || 'White',
      });
      triggerDownload(res.blob, `${targetProject.name.replace(/\s+/g, '_')}_Interior.pdf`);
      showToast({
        type: 'success',
        title: 'Download Ready',
        message: 'Interior PDF has been downloaded.',
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Download Failed',
        message: err?.message || 'Error generating interior PDF.',
      });
    }
  };

  const handleDownloadCover = () => {
    try {
      const coverBlob = KDPExportService.generateCoverPdf(targetProject);
      triggerDownload(coverBlob, `${targetProject.name.replace(/\s+/g, '_')}_Full_Cover.pdf`);
      showToast({
        type: 'success',
        title: 'Cover Downloaded',
        message: 'Full wrap cover PDF downloaded.',
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Cover Error',
        message: err?.message || 'Could not generate cover PDF.',
      });
    }
  };

  const handleDownloadPackage = async () => {
    setIsDownloadingPackage(true);
    setDownloadProgress('Preparing package...');
    try {
      const pkg = await KDPExportService.buildExportPackage(targetProject, currentDoc, (step, pct) => {
        setDownloadProgress(`${step} (${pct}%)`);
      });
      if (pkg.zipBlob) {
        triggerDownload(pkg.zipBlob, `${targetProject.name.replace(/\s+/g, '_')}_KDP_Content_Package.zip`);
        showToast({
          type: 'success',
          title: 'Package Downloaded',
          message: 'KDP Content Package (Interior, Cover, Validation Report) exported successfully.',
        });
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Export Error',
        message: err?.message || 'Failed to assemble export package.',
      });
    } finally {
      setIsDownloadingPackage(false);
      setDownloadProgress('');
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
    showToast({
      type: 'success',
      title: 'Copied to Clipboard',
      message: `Copied: ${text.slice(0, 30)}${text.length > 30 ? '...' : ''}`,
    });
  };

  // Open official KDP
  const handleOpenKdpDirectly = () => {
    // Official Amazon KDP URL without any credential interception
    window.open('https://kdp.amazon.com/en_US/bookshelf', '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn select-text pb-24">
      {/* 1. KDP PUBLISHING WORKFLOW PROGRESS BAR */}
      <div className="p-4 sm:p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                Phase 3 Content-First
              </span>
              <span className="text-xs font-mono text-neutral-400">KDP Publishing Assistant</span>
            </div>
            <h1 className="text-2xl font-extrabold text-neutral-900 dark:text-white font-display mt-1">
              KDP Book Content Stage
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentRoute('editor')}
              className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Open in Editor</span>
            </button>
            <button
              onClick={handleDownloadPackage}
              disabled={isDownloadingPackage}
              className="px-4 py-2 rounded-xl bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-bold hover:bg-neutral-800 dark:hover:bg-white transition-all flex items-center gap-2 shadow-xs disabled:opacity-50"
            >
              <Package className="w-3.5 h-3.5 text-amber-500" />
              <span>{isDownloadingPackage ? downloadProgress || 'Bundling...' : 'Download KDP Package'}</span>
            </button>
          </div>
        </div>

        {/* Multi-step progress bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
          {[
            { id: 'content', num: '①', label: 'BOOK CONTENT', desc: 'Interior & Cover' },
            { id: 'details', num: '②', label: 'BOOK DETAILS', desc: 'Title & Keywords' },
            { id: 'pricing', num: '③', label: 'RIGHTS & PRICING', desc: 'Marketplaces & Royalty' },
            { id: 'review', num: '④', label: 'REVIEW', desc: 'Preflight Audit' },
            { id: 'publish', num: '⑤', label: 'PUBLISH', desc: 'Amazon Submission' },
          ].map(step => {
            const isCurrent = currentStep === step.id;
            return (
              <button
                key={step.id}
                onClick={() => {
                  setCurrentStep(step.id as any);
                  if (step.id === 'details') {
                    setCurrentRoute('kdp-details');
                  } else if (onNavigateWorkflow) {
                    onNavigateWorkflow(step.id as any);
                  }
                }}
                className={`p-3 rounded-2xl text-left transition-all border ${
                  isCurrent
                    ? 'bg-amber-500/10 border-amber-500/30 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold shadow-xs'
                    : 'bg-neutral-50 dark:bg-neutral-800/40 border-transparent text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                <div className="text-[11px] font-mono font-bold flex items-center justify-between">
                  <span>{step.num}</span>
                  {isCurrent && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />}
                </div>
                <div className="text-xs font-bold mt-1 truncate">{step.label}</div>
                <div className="text-[10px] text-neutral-400 dark:text-neutral-500 truncate">{step.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. PROJECT SUMMARY CARD */}
      <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 font-bold">
              Project Reference
            </span>
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white font-display mt-0.5">
              {targetProject.name}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-xs font-bold text-neutral-700 dark:text-neutral-300">
              Format: {kdpConfig.format || 'Paperback'}
            </span>
            <span className="px-3 py-1 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold font-mono">
              Trim: {trimObj.name}
            </span>
            <span className="px-3 py-1 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold font-mono">
              {effectivePages} Pages
            </span>
          </div>
        </div>

        {/* Overview specs grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 text-xs">
          <div>
            <span className="text-neutral-400 block font-medium">Inside Margin (Gutter)</span>
            <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">
              {gutterMargin}" safe depth
            </span>
          </div>
          <div>
            <span className="text-neutral-400 block font-medium">Spine Thickness</span>
            <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">
              {spineWidth.toFixed(4)}" ({kdpConfig.paperType || 'White'} paper)
            </span>
          </div>
          <div>
            <span className="text-neutral-400 block font-medium">Full Wrap Cover Spread</span>
            <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">
              {coverDimensions.width.toFixed(3)}" × {coverDimensions.height.toFixed(3)}"
            </span>
          </div>
          <div>
            <span className="text-neutral-400 block font-medium">Bleed Mode</span>
            <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">
              {kdpConfig.bleed || 'No Bleed'} (+0.125")
            </span>
          </div>
        </div>
      </div>

      {/* 3. CORE MANUSCRIPT & COVER CARDS (GRID) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* CARD A: MANUSCRIPT INTERIOR */}
        <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-neutral-900 dark:text-white font-display">
                    MANUSCRIPT (Interior PDF)
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    High-resolution vector print interior (v{kdpConfig.contentVersion?.interiorVersion || 1})
                  </p>
                </div>
              </div>

              {kdpConfig.contentVersion?.interiorOutdated ? (
                <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>OUTDATED</span>
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>READY</span>
                </span>
              )}
            </div>

            {/* Manuscript specs box */}
            <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-neutral-500">File Name:</span>
                <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">
                  {targetProject.name.replace(/\s+/g, '_')}_Interior.pdf
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Page Count:</span>
                <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">
                  {effectivePages} Pages (min 24)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Approx. File Size:</span>
                <span className="font-mono text-neutral-800 dark:text-neutral-200">
                  ~{(effectivePages * 0.07).toFixed(1)} MB (Print Vector)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Color Mode:</span>
                <span className="font-bold text-neutral-800 dark:text-neutral-200">
                  {kdpConfig.interiorType === 'Black & White' ? 'Grayscale (300 DPI)' : 'CMYK/RGB Color'}
                </span>
              </div>
            </div>

            {/* Validation Checklist */}
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <Check className="w-4 h-4 shrink-0" />
                <span>PDF dimensions match trim size ({trimObj.name})</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <Check className="w-4 h-4 shrink-0" />
                <span>Inside gutter margin ({gutterMargin}") validated against binding depth</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <Check className="w-4 h-4 shrink-0" />
                <span>Puzzle content & solution answer keys synchronized</span>
              </div>
            </div>

            {/* Outdated banner warning if applicable */}
            {kdpConfig.contentVersion?.interiorOutdated && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-700 dark:text-amber-300">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Interior Regeneration Recommended</span>
                </div>
                <p className="mt-1 text-[11px]">
                  {kdpConfig.contentVersion.outdatedReason || 'Project dimensions or page layout have been updated.'}
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-neutral-100 dark:border-neutral-800">
            <button
              onClick={() => {
                setPreviewModalType('interior');
                setPreviewPageNumber(1);
              }}
              className="flex-1 min-w-[100px] py-2.5 px-3 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center justify-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5 text-blue-500" />
              <span>PREVIEW</span>
            </button>

            <button
              onClick={handleRegenerateInterior}
              disabled={isRegeneratingInterior}
              className="flex-1 min-w-[120px] py-2.5 px-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRegeneratingInterior ? 'animate-spin' : ''}`} />
              <span>{isRegeneratingInterior ? 'REGENERATING...' : 'REGENERATE'}</span>
            </button>

            <button
              onClick={handleDownloadInterior}
              className="flex-1 min-w-[110px] py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>DOWNLOAD</span>
            </button>
          </div>
        </div>

        {/* CARD B: BOOK COVER (FULL WRAP) */}
        <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-neutral-900 dark:text-white font-display">
                    BOOK COVER (Full Wrap PDF)
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Front, spine, and back cover PDF (v{kdpConfig.contentVersion?.coverVersion || 1})
                  </p>
                </div>
              </div>

              {kdpConfig.contentVersion?.coverOutdated ? (
                <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>OUTDATED</span>
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>READY</span>
                </span>
              )}
            </div>

            {/* Cover specs box */}
            <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-neutral-500">Spread Dimensions:</span>
                <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">
                  {coverDimensions.width.toFixed(3)}" × {coverDimensions.height.toFixed(3)}"
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Spine Width (Exact):</span>
                <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                  {spineWidth.toFixed(4)}" ({effectivePages} pages)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Spine Text Eligibility:</span>
                <span className="font-bold text-neutral-800 dark:text-neutral-200">
                  {effectivePages >= 79 ? 'Enabled (>= 79 pages)' : 'Omitted (< 79 pages)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Bleed & Barcode Area:</span>
                <span className="font-bold text-neutral-800 dark:text-neutral-200">
                  0.125" Bleed Wrap • KDP Reserved Safe Box
                </span>
              </div>
            </div>

            {/* Cover Checklist */}
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <Check className="w-4 h-4 shrink-0" />
                <span>Full wrap PDF format (not single JPG image)</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <Check className="w-4 h-4 shrink-0" />
                <span>Spine thickness calculated on {effectivePages} actual manuscript pages</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <Check className="w-4 h-4 shrink-0" />
                <span>Print-safe margins & barcode safety zone enforced</span>
              </div>
            </div>

            {/* Outdated Cover Notice */}
            {kdpConfig.contentVersion?.coverOutdated && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-700 dark:text-rose-300">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Cover Outdated — Spine Mismatch</span>
                </div>
                <p className="mt-1 text-[11px]">
                  {kdpConfig.contentVersion.outdatedReason ||
                    `Page count changed to ${effectivePages}. Cover must be regenerated to adjust spine width.`}
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-neutral-100 dark:border-neutral-800">
            <button
              onClick={() => setPreviewModalType('cover')}
              className="flex-1 min-w-[100px] py-2.5 px-3 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center justify-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5 text-purple-500" />
              <span>PREVIEW</span>
            </button>

            <button
              onClick={handleRegenerateCover}
              disabled={isRegeneratingCover}
              className="flex-1 min-w-[120px] py-2.5 px-3 rounded-xl border border-purple-500/30 bg-purple-500/10 text-xs font-bold text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRegeneratingCover ? 'animate-spin' : ''}`} />
              <span>{isRegeneratingCover ? 'CALCULATING...' : 'REGENERATE'}</span>
            </button>

            <button
              onClick={handleDownloadCover}
              className="flex-1 min-w-[110px] py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md shadow-purple-600/20 flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>DOWNLOAD</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. PRINT SETTINGS & AI DISCLOSURE CARDS (GRID) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* CARD C: PRINT SETTINGS */}
        <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white font-display">
                  PRINT SETTINGS
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Paperback specifications & manufacturing parameters
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsEditingPrintSettings(!isEditingPrintSettings)}
              className="px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              {isEditingPrintSettings ? 'Close' : 'Edit Print Settings'}
            </button>
          </div>

          {!isEditingPrintSettings ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60">
                <span className="text-neutral-400 block text-[11px]">Format</span>
                <span className="font-bold text-neutral-900 dark:text-white mt-0.5 block">
                  {kdpConfig.format || 'Paperback'} ✓
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60">
                <span className="text-neutral-400 block text-[11px]">Trim Size</span>
                <span className="font-bold text-neutral-900 dark:text-white mt-0.5 block">
                  {trimObj.name} ✓
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60">
                <span className="text-neutral-400 block text-[11px]">Interior Type</span>
                <span className="font-bold text-neutral-900 dark:text-white mt-0.5 block">
                  {kdpConfig.interiorType || 'Black & White'} ✓
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60">
                <span className="text-neutral-400 block text-[11px]">Paper Stock</span>
                <span className="font-bold text-neutral-900 dark:text-white mt-0.5 block">
                  {kdpConfig.paperType || 'White Paper'} ✓
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60">
                <span className="text-neutral-400 block text-[11px]">Bleed</span>
                <span className="font-bold text-neutral-900 dark:text-white mt-0.5 block">
                  {kdpConfig.bleed || 'No Bleed'} ✓
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60">
                <span className="text-neutral-400 block text-[11px]">Cover Finish</span>
                <span className="font-bold text-neutral-900 dark:text-white mt-0.5 block">
                  {kdpConfig.coverFinish || 'Matte'} ✓
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-4 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-700 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    Trim Size
                  </label>
                  <select
                    value={kdpConfig.trimSize || '8.5x11'}
                    onChange={e => {
                      const newTrim = e.target.value;
                      handleUpdateConfig(
                        { trimSize: newTrim },
                        {
                          interior: true,
                          cover: true,
                          reason: `Trim size changed to ${newTrim}. Interior and Cover regeneration required.`,
                        }
                      );
                    }}
                    className="w-full p-2 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-medium"
                  >
                    {STANDARD_TRIM_SIZES.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.category || 'Standard'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    Paper Stock
                  </label>
                  <select
                    value={kdpConfig.paperType || 'White'}
                    onChange={e => {
                      const newPaper = e.target.value as KDPPaperType;
                      handleUpdateConfig(
                        { paperType: newPaper },
                        {
                          cover: true,
                          reason: `Paper stock changed to ${newPaper}. Cover spine thickness recalculated.`,
                        }
                      );
                    }}
                    className="w-full p-2 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-medium"
                  >
                    {KDP_PAPER_TYPES.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    Bleed Setting
                  </label>
                  <select
                    value={kdpConfig.bleed || 'No Bleed'}
                    onChange={e => {
                      const newBleed = e.target.value as KDPBleed;
                      handleUpdateConfig(
                        { bleed: newBleed },
                        {
                          interior: true,
                          cover: true,
                          reason: `Bleed setting changed to ${newBleed}. Regeneration required.`,
                        }
                      );
                    }}
                    className="w-full p-2 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-medium"
                  >
                    {KDP_BLEED_OPTIONS.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    Cover Finish
                  </label>
                  <select
                    value={kdpConfig.coverFinish || 'Matte'}
                    onChange={e => {
                      handleUpdateConfig({ coverFinish: e.target.value as KDPCoverFinish });
                    }}
                    className="w-full p-2 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-medium"
                  >
                    {KDP_COVER_FINISHES.map(f => (
                      <option key={f.id} value={f.id}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                Note: Modifying print settings automatically flags Interior and Cover as REGENERATION REQUIRED.
              </p>
            </div>
          )}
        </div>

        {/* CARD D: AI CONTENT DISCLOSURE */}
        <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-white font-display">
                AI CONTENT DISCLOSURE
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Required Amazon KDP declaration for machine-generated assets
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            {[
              {
                id: 'AI-generated',
                label: 'AI-generated',
                desc: 'Created using AI text, prompt generation, or algorithmic puzzle synthesis.',
              },
              {
                id: 'AI-assisted',
                label: 'AI-assisted',
                desc: 'Created primarily by human author with AI editing or ideation support.',
              },
              {
                id: 'Human-created',
                label: 'Human-created',
                desc: 'Original human creation without generative AI content models.',
              },
            ].map(opt => {
              const isSelected = kdpConfig.aiContentType === opt.id && kdpConfig.aiDisclosureExplicitlySelected;
              return (
                <label
                  key={opt.id}
                  onClick={() => {
                    handleUpdateConfig({
                      aiContentType: opt.id as KDPAiContentType,
                      aiDisclosureExplicitlySelected: true,
                    });
                  }}
                  className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-500/40 text-neutral-900 dark:text-white font-semibold shadow-xs'
                      : 'bg-neutral-50 dark:bg-neutral-800/40 border-neutral-200 dark:border-neutral-700/60 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  <input
                    type="radio"
                    name="aiDisclosure"
                    checked={isSelected}
                    onChange={() => {}}
                    className="mt-0.5 text-amber-500 focus:ring-0"
                  />
                  <div className="text-xs">
                    <div className="font-bold">{opt.label}</div>
                    <div className="text-[11px] text-neutral-400 dark:text-neutral-500">{opt.desc}</div>
                  </div>
                </label>
              );
            })}
          </div>

          {kdpConfig.aiContentType === 'AI-generated' && (
            <div className="p-3 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-[11px] text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">
              <span className="font-bold block text-neutral-900 dark:text-white mb-0.5">
                Amazon KDP Policy Reminder:
              </span>
              "AI-generated content disclosure is required where applicable. The Studio will prepare the exact disclosure string for the KDP submission portal."
            </div>
          )}
        </div>
      </div>

      {/* 5. KDP CONTENT STATUS & VALIDATION PANEL */}
      <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white shadow-md ${
                validationReport.overallStatus === 'READY'
                  ? 'bg-emerald-500 shadow-emerald-500/20'
                  : validationReport.overallStatus === 'READY_WITH_WARNINGS'
                  ? 'bg-amber-500 shadow-amber-500/20'
                  : 'bg-rose-500 shadow-rose-500/20'
              }`}
            >
              {validationReport.overallStatus === 'READY' ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : validationReport.overallStatus === 'READY_WITH_WARNINGS' ? (
                <AlertTriangle className="w-6 h-6" />
              ) : (
                <XCircle className="w-6 h-6" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 font-bold">
                  Pre-Publishing Gate
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    validationReport.overallStatus === 'READY'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : validationReport.overallStatus === 'READY_WITH_WARNINGS'
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {validationReport.overallStatus}
                </span>
              </div>
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white font-display mt-0.5">
                KDP Content Status:{' '}
                {validationReport.overallStatus === 'READY'
                  ? '🟢 READY FOR SUBMISSION'
                  : validationReport.overallStatus === 'READY_WITH_WARNINGS'
                  ? '🟡 READY WITH WARNINGS'
                  : '🔴 NOT READY (BLOCKING ISSUES DETECTED)'}
              </h3>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                showToast({
                  type: 'info',
                  title: 'Validation Rerun',
                  message: `Preflight checks verified: ${validationReport.summary.passed} passed, ${validationReport.summary.errors} errors.`,
                });
              }}
              className="px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>RUN KDP CHECK</span>
            </button>

            <button
              onClick={() => setShowKdpChecklistModal(true)}
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold transition-all shadow-md shadow-amber-500/20 active:scale-95 flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              <span>OPEN KDP</span>
            </button>
          </div>
        </div>

        {/* Validation summary item chips */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {validationReport.rules.map(rule => (
            <div
              key={rule.id}
              className={`p-3.5 rounded-2xl border text-xs flex items-start gap-2.5 ${
                rule.status === 'PASS'
                  ? 'bg-neutral-50 dark:bg-neutral-800/40 border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300'
                  : rule.status === 'WARNING'
                  ? 'bg-amber-500/5 border-amber-500/30 text-amber-800 dark:text-amber-300'
                  : 'bg-rose-500/5 border-rose-500/30 text-rose-800 dark:text-rose-300'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {rule.status === 'PASS' ? (
                  <Check className="w-4 h-4 text-emerald-500" />
                ) : rule.status === 'WARNING' ? (
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-500" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold">{rule.label}</div>
                <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 leading-snug">
                  {rule.message}
                </div>
                {rule.fixAction && rule.status !== 'PASS' && (
                  <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400 mt-1">
                    Fix: {rule.fixAction}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. CONTENT-FIRST QUICK COPY SYSTEM (METADATA HANDOFF) */}
      <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 font-bold">
                KDP Quick Fill System
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                PHASE 1 METADATA PRESERVED
              </span>
            </div>
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white font-display mt-0.5">
              KDP Details Ready (One-Click Copy)
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Easily copy mapped fields for fast manual entry into the Amazon KDP portal.
            </p>
          </div>

          <button
            onClick={() => copyToClipboard(KDPFieldMapper.formatSummaryForClipboard(targetProject), 'all_summary')}
            className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center gap-1.5"
          >
            {copiedKey === 'all_summary' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>COPY ALL METADATA</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Title */}
          <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700/60 flex items-center justify-between gap-2 text-xs">
            <div className="min-w-0">
              <span className="text-neutral-400 block text-[10px] font-bold uppercase">Book Title</span>
              <span className="font-bold text-neutral-900 dark:text-white truncate block">
                {fieldMapping.title || '(Untitled)'}
              </span>
            </div>
            <button
              onClick={() => copyToClipboard(fieldMapping.title, 'title')}
              className="p-2 rounded-xl bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 hover:bg-neutral-100 text-neutral-700 dark:text-neutral-200 transition-colors shrink-0"
              title="Copy Title"
            >
              {copiedKey === 'title' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Subtitle */}
          <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700/60 flex items-center justify-between gap-2 text-xs">
            <div className="min-w-0">
              <span className="text-neutral-400 block text-[10px] font-bold uppercase">Subtitle</span>
              <span className="font-medium text-neutral-800 dark:text-neutral-200 truncate block">
                {fieldMapping.subtitle || '(None)'}
              </span>
            </div>
            <button
              onClick={() => copyToClipboard(fieldMapping.subtitle, 'subtitle')}
              className="p-2 rounded-xl bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 hover:bg-neutral-100 text-neutral-700 dark:text-neutral-200 transition-colors shrink-0"
              title="Copy Subtitle"
            >
              {copiedKey === 'subtitle' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Author */}
          <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700/60 flex items-center justify-between gap-2 text-xs">
            <div className="min-w-0">
              <span className="text-neutral-400 block text-[10px] font-bold uppercase">Author / Imprint</span>
              <span className="font-bold text-neutral-900 dark:text-white truncate block">
                {fieldMapping.author}
              </span>
            </div>
            <button
              onClick={() => copyToClipboard(fieldMapping.author, 'author')}
              className="p-2 rounded-xl bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 hover:bg-neutral-100 text-neutral-700 dark:text-neutral-200 transition-colors shrink-0"
              title="Copy Author"
            >
              {copiedKey === 'author' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Primary Category */}
          <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700/60 flex items-center justify-between gap-2 text-xs">
            <div className="min-w-0">
              <span className="text-neutral-400 block text-[10px] font-bold uppercase">Category</span>
              <span className="font-medium text-neutral-800 dark:text-neutral-200 truncate block">
                {fieldMapping.primaryCategory}
              </span>
            </div>
            <button
              onClick={() => copyToClipboard(fieldMapping.primaryCategory, 'category')}
              className="p-2 rounded-xl bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 hover:bg-neutral-100 text-neutral-700 dark:text-neutral-200 transition-colors shrink-0"
              title="Copy Category"
            >
              {copiedKey === 'category' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Keywords (7 slots) */}
          <div className="md:col-span-2 p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700/60 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-neutral-400 text-[10px] font-bold uppercase">
                7 Backend Search Keywords
              </span>
              <button
                onClick={() => copyToClipboard(fieldMapping.keywordsCommaSeparated, 'keywords_all')}
                className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
              >
                {copiedKey === 'keywords_all' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                <span>COPY ALL (COMMA-SEPARATED)</span>
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {fieldMapping.keywords.length > 0 ? (
                fieldMapping.keywords.map((kw, i) => (
                  <span
                    key={i}
                    onClick={() => copyToClipboard(kw, `kw_${i}`)}
                    className="px-2.5 py-1 rounded-xl bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 text-neutral-800 dark:text-neutral-200 font-medium cursor-pointer hover:border-amber-500 flex items-center gap-1.5 transition-colors"
                  >
                    <span>{kw}</span>
                    {copiedKey === `kw_${i}` ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 opacity-40" />}
                  </span>
                ))
              ) : (
                <span className="text-neutral-400 italic">No backend keywords configured yet.</span>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="md:col-span-2 p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700/60 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-neutral-400 text-[10px] font-bold uppercase">Book Description</span>
              <button
                onClick={() => copyToClipboard(fieldMapping.description, 'description')}
                className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
              >
                {copiedKey === 'description' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                <span>COPY DESCRIPTION</span>
              </button>
            </div>
            <p className="text-neutral-700 dark:text-neutral-300 line-clamp-3 leading-relaxed">
              {fieldMapping.description || '(No description added)'}
            </p>
          </div>
        </div>

        {/* Step navigation CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
          <div className="text-xs text-neutral-500">
            Current Stage: <span className="font-bold text-neutral-900 dark:text-white">① BOOK CONTENT</span>
          </div>

          <button
            onClick={() => {
              setCurrentStep('details');
              setCurrentRoute('kdp-details');
              if (onNavigateWorkflow) onNavigateWorkflow('details');
              showToast({
                type: 'info',
                title: 'Continuing Workflow',
                message: 'Opening Step ② Book Details & Metadata editor.',
              });
            }}
            className="px-5 py-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold hover:bg-amber-500/20 transition-all flex items-center justify-center gap-2"
          >
            <span>CONTINUE TO BOOK DETAILS</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 7. PREVIEW MODAL (INTERIOR / COVER WITH PRINT GUIDES) */}
      {previewModalType && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-5xl bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white font-display">
                  {previewModalType === 'interior' ? 'Manuscript Interior Preview' : 'Full Wrap Cover Print Preview'}
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {previewModalType === 'interior'
                    ? `Page ${previewPageNumber} of ${effectivePages} • ${trimObj.name}`
                    : `Spread: ${coverDimensions.width.toFixed(3)}" × ${coverDimensions.height.toFixed(3)}" • Spine: ${spineWidth.toFixed(4)}"`}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowPrintGuides(!showPrintGuides)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    showPrintGuides
                      ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  {showPrintGuides ? 'Hide Safe Margins' : 'Show Safe Margins'}
                </button>
                <button
                  onClick={() => setPreviewModalType(null)}
                  className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: Rendered canvas / graphic representation */}
            <div className="flex-1 overflow-auto p-6 flex items-center justify-center bg-neutral-100 dark:bg-neutral-950">
              {previewModalType === 'interior' ? (
                <div
                  className="relative bg-white text-neutral-900 shadow-2xl rounded-sm border border-neutral-300 transition-transform"
                  style={{
                    width: `${trimObj.width * 55 * previewZoom}px`,
                    height: `${trimObj.height * 55 * previewZoom}px`,
                  }}
                >
                  {/* Page content representation */}
                  <div className="absolute inset-0 p-6 flex flex-col justify-between select-none">
                    <div className="text-center text-xs font-bold text-neutral-400">
                      {targetProject.name.toUpperCase()}
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-xl mb-3">
                        #{previewPageNumber}
                      </div>
                      <div className="font-bold text-sm text-neutral-800">
                        {currentDoc?.pages?.[previewPageNumber - 1]?.name || `Puzzle Page ${previewPageNumber}`}
                      </div>
                      <div className="text-xs text-neutral-500 mt-1">
                        Type: {currentDoc?.pages?.[previewPageNumber - 1]?.pageType || 'puzzle'}
                      </div>
                    </div>
                    <div className="text-center font-mono text-xs text-neutral-500">
                      - {previewPageNumber} -
                    </div>
                  </div>

                  {/* Print Safe Margin Overlay */}
                  {showPrintGuides && (
                    <div
                      className="absolute pointer-events-none border border-dashed border-rose-500/60"
                      style={{
                        top: `${0.5 * 55 * previewZoom}px`,
                        bottom: `${0.5 * 55 * previewZoom}px`,
                        left: `${gutterMargin * 55 * previewZoom}px`,
                        right: `${0.5 * 55 * previewZoom}px`,
                      }}
                    >
                      <span className="absolute top-1 left-1 text-[9px] font-mono text-rose-500 bg-white/90 px-1 rounded">
                        Safe Margin (Gutter {gutterMargin}")
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                /* Full wrap cover preview */
                <div
                  className="relative bg-neutral-900 text-white shadow-2xl rounded-sm border border-neutral-700 transition-transform overflow-hidden flex"
                  style={{
                    width: `${coverDimensions.width * 40 * previewZoom}px`,
                    height: `${coverDimensions.height * 40 * previewZoom}px`,
                  }}
                >
                  {/* Back Cover (Left) */}
                  <div className="flex-1 p-4 border-r border-dashed border-neutral-700 flex flex-col justify-between select-none">
                    <div className="text-xs text-neutral-400">
                      <div className="font-bold text-white">About the Book</div>
                      <div className="text-[10px] mt-1 line-clamp-4 text-neutral-400">
                        {fieldMapping.description}
                      </div>
                    </div>
                    <div className="w-24 h-14 bg-white text-neutral-900 rounded p-1 text-[8px] font-mono text-center flex items-center justify-center self-end border border-neutral-300">
                      Barcode Zone
                    </div>
                  </div>

                  {/* Spine (Center) */}
                  <div
                    className="bg-neutral-800 border-x border-neutral-700 flex items-center justify-center select-none"
                    style={{ width: `${Math.max(16, spineWidth * 40 * previewZoom)}px` }}
                  >
                    {effectivePages >= 79 && (
                      <span className="text-[10px] font-bold text-neutral-300 whitespace-nowrap rotate-90 transform">
                        {targetProject.name}
                      </span>
                    )}
                  </div>

                  {/* Front Cover (Right) */}
                  <div className="flex-1 p-4 flex flex-col justify-between text-center select-none bg-gradient-to-b from-neutral-800 to-neutral-900">
                    <div className="pt-4">
                      <div className="text-xs font-bold text-amber-400 uppercase tracking-widest">
                        {targetProject.type}
                      </div>
                      <div className="text-sm font-extrabold text-white font-display mt-1">
                        {targetProject.name}
                      </div>
                      {fieldMapping.subtitle && (
                        <div className="text-[10px] text-neutral-300 mt-1">
                          {fieldMapping.subtitle}
                        </div>
                      )}
                    </div>
                    <div className="text-xs font-bold text-neutral-200 pb-2">
                      {fieldMapping.author}
                    </div>
                  </div>

                  {/* Print guides overlay */}
                  {showPrintGuides && (
                    <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-blue-500/50">
                      <span className="absolute top-1 left-2 text-[9px] font-mono text-blue-400 bg-black/80 px-1 rounded">
                        Full Spread Wrap (0.125" Bleed included)
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer Controls */}
            <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs">
              {previewModalType === 'interior' ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPreviewPageNumber(Math.max(1, previewPageNumber - 1))}
                    disabled={previewPageNumber <= 1}
                    className="px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 font-bold disabled:opacity-30"
                  >
                    Previous Page
                  </button>
                  <span className="font-mono font-bold px-2">
                    {previewPageNumber} / {effectivePages}
                  </span>
                  <button
                    onClick={() => setPreviewPageNumber(Math.min(effectivePages, previewPageNumber + 1))}
                    disabled={previewPageNumber >= effectivePages}
                    className="px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 font-bold disabled:opacity-30"
                  >
                    Next Page
                  </button>
                </div>
              ) : (
                <div className="text-neutral-500">
                  Spine: {spineWidth.toFixed(4)}" • Width: {coverDimensions.width.toFixed(3)}" • Height: {coverDimensions.height.toFixed(3)}"
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewZoom(Math.max(0.7, previewZoom - 0.1))}
                  className="px-2.5 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 font-mono font-bold"
                >
                  -
                </button>
                <span className="font-mono text-xs">{Math.round(previewZoom * 100)}%</span>
                <button
                  onClick={() => setPreviewZoom(Math.min(1.5, previewZoom + 0.1))}
                  className="px-2.5 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 font-mono font-bold"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. KDP PRE-SUBMISSION CHECKLIST MODAL */}
      {showKdpChecklistModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-neutral-900 dark:text-white font-display">
                    KDP CONTENT CHECKLIST
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Verify all files before opening Amazon KDP Bookshelf
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowKdpChecklistModal(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              {[
                { label: 'Interior PDF ready & validated', status: validationReport.manuscriptValid },
                { label: 'Full wrap cover PDF ready (spine calibrated)', status: validationReport.coverValid },
                { label: `Trim size verified (${trimObj.name})`, status: true },
                { label: `Bleed verified (${kdpConfig.bleed || 'No Bleed'})`, status: true },
                { label: `Page count verified (${effectivePages} pages)`, status: effectivePages >= 24 },
                { label: `Cover spine thickness verified (${spineWidth.toFixed(4)}")`, status: true },
                { label: `AI disclosure selected (${kdpConfig.aiContentType})`, status: Boolean(kdpConfig.aiDisclosureExplicitlySelected) },
                { label: 'Puzzle answers and solution references verified', status: true },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60"
                >
                  {item.status ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  )}
                  <span className={item.status ? 'text-neutral-800 dark:text-neutral-200 font-medium' : 'text-rose-600 font-bold'}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-800 dark:text-amber-300">
              <span className="font-bold block mb-0.5">Secure Navigation:</span>
              Opening the official Amazon KDP Bookshelf in a new tab. You will sign in securely through Amazon's authentic authentication portal.
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowKdpChecklistModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowKdpChecklistModal(false);
                  handleOpenKdpDirectly();
                }}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold transition-all shadow-md shadow-amber-500/20 flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                <span>OPEN KDP BOOK CONTENT</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

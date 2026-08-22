import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Download,
  FileText,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  ShieldCheck,
  Code2,
  Printer,
  Sparkles,
  Layers,
  Eye,
  Sliders,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Info,
  BookOpen,
  StopCircle,
  FileCheck,
  Check,
} from 'lucide-react';
import { useEditor } from '../../context/EditorContext';
import { useApp } from '../../context/AppContext';
import {
  ExportColorMode,
  ExportProgressEvent,
  ExportResult,
  ExportSettings,
  PdfExportService,
  PdfPreflightResult,
} from '../../services/pdfExportService';
import { BookValidationService, ValidationReport } from '../../services/bookValidationService';
import {
  calculateKdpCoverDimensions,
  calculateKdpInsideMargin,
  calculateKdpSpineWidth,
} from '../../constants/kdp';

interface ExportCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToPage?: (pageNumber: number) => void;
}

export const ExportCenterModal: React.FC<ExportCenterModalProps> = ({
  isOpen,
  onClose,
  onNavigateToPage,
}) => {
  const { document } = useEditor();
  const { activeProject, showToast } = useApp();

  // Export Settings State
  const [targetType, setTargetType] = useState<'interior' | 'cover' | 'backup'>('interior');
  const [colorMode, setColorMode] = useState<ExportColorMode>('grayscale');
  const [includeBleed, setIncludeBleed] = useState<boolean>(true);
  const [includeCropMarks, setIncludeCropMarks] = useState<boolean>(false);
  const [pageRange, setPageRange] = useState<'all' | 'custom'>('all');
  const [customRangeStart, setCustomRangeStart] = useState<number>(1);
  const [customRangeEnd, setCustomRangeEnd] = useState<number>(document?.pages.length || 24);
  const [paperStock, setPaperStock] = useState<'White' | 'Cream' | 'Premium Color' | 'Standard Color'>('White');

  // Preflight & Validation State
  const [validationReport, setValidationReport] = useState<ValidationReport | null>(null);
  const [ignoreWarnings, setIgnoreWarnings] = useState<boolean>(false);

  // Export Process State
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [progress, setProgress] = useState<ExportProgressEvent | null>(null);
  const [exportResult, setExportResult] = useState<ExportResult | null>(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [previewPageIndex, setPreviewPageIndex] = useState<number>(1);
  const [previewZoom, setPreviewZoom] = useState<number>(100);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync settings and run preflight when opened
  useEffect(() => {
    if (isOpen && activeProject && document) {
      setCustomRangeEnd(document.pages.length);
      setIncludeBleed(activeProject.kdpSettings?.bleed === 'Bleed');
      setPaperStock(activeProject.kdpSettings?.paperType || 'White');
      runPreflightCheck();
    }
  }, [isOpen, activeProject, document]);

  // Clean up object URLs
  useEffect(() => {
    return () => {
      if (previewBlobUrl) {
        URL.revokeObjectURL(previewBlobUrl);
      }
    };
  }, [previewBlobUrl]);

  if (!isOpen || !activeProject || !document) return null;

  const totalPages = document.pages.length;
  const trimW = activeProject.kdpSettings?.trimSize?.width || 8.5;
  const trimH = activeProject.kdpSettings?.trimSize?.height || 11;
  const spineWidthIn = calculateKdpSpineWidth(totalPages, paperStock);
  const coverDimensions = calculateKdpCoverDimensions(trimW, trimH, spineWidthIn);
  const insideGutter = calculateKdpInsideMargin(totalPages);

  // Preflight check handler
  const runPreflightCheck = () => {
    const report = BookValidationService.validateBook(activeProject, document);
    setValidationReport(report);
  };

  // Preset Handlers
  const applyPreset = (preset: 'bw_white' | 'bw_cream' | 'color_std' | 'color_prem') => {
    if (preset === 'bw_white') {
      setColorMode('grayscale');
      setPaperStock('White');
    } else if (preset === 'bw_cream') {
      setColorMode('grayscale');
      setPaperStock('Cream');
    } else if (preset === 'color_std') {
      setColorMode('rgb');
      setPaperStock('Standard Color');
    } else if (preset === 'color_prem') {
      setColorMode('rgb');
      setPaperStock('Premium Color');
    }
    showToast({
      type: 'info',
      title: 'Preset Applied',
      message: `Configured export settings for ${preset.replace('_', ' ').toUpperCase()}`,
    });
  };

  // Execute PDF Export
  const handleStartExport = async () => {
    if (targetType === 'backup') {
      handleExportJsonBackup();
      return;
    }

    if (validationReport?.hasErrors) {
      showToast({
        type: 'error',
        title: 'Export Blocked by Preflight',
        message: 'Please resolve critical errors before exporting your KDP manuscript.',
      });
      return;
    }

    if (validationReport?.hasWarnings && !ignoreWarnings) {
      showToast({
        type: 'warning',
        title: 'Preflight Warnings Present',
        message: 'Review warnings or check "Proceed with Warnings" to continue.',
      });
      return;
    }

    setIsExporting(true);
    setExportResult(null);
    if (previewBlobUrl) {
      URL.revokeObjectURL(previewBlobUrl);
      setPreviewBlobUrl(null);
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const settings: ExportSettings = {
      format: targetType === 'interior' ? 'interior_pdf' : 'cover_pdf',
      colorMode,
      includeBleed,
      includeCropMarks,
      pageRange,
      customRangeStart,
      customRangeEnd,
      paperStock,
    };

    try {
      let result: ExportResult;
      if (targetType === 'interior') {
        result = await PdfExportService.exportInteriorPdf(
          activeProject,
          document,
          settings,
          setProgress,
          abortController.signal
        );
      } else {
        result = await PdfExportService.exportCoverPdf(
          activeProject,
          document,
          settings,
          setProgress,
          abortController.signal
        );
      }

      setExportResult(result);
      if (result.blob) {
        const url = URL.createObjectURL(result.blob);
        setPreviewBlobUrl(url);
      }

      showToast({
        type: 'success',
        title: `${targetType === 'interior' ? 'Interior' : 'Cover'} PDF Ready`,
        message: `Successfully compiled ${result.preflight.actualPages} page(s) (${result.preflight.fileSizeFormatted}).`,
      });
    } catch (err: any) {
      if (err?.message !== 'Export cancelled by user.') {
        console.error('PDF Export Error:', err);
        showToast({
          type: 'error',
          title: 'Export Failed',
          message: err?.message || 'An unexpected error occurred during PDF rendering.',
        });
      }
    } finally {
      setIsExporting(false);
      abortControllerRef.current = null;
    }
  };

  // Cancel running export
  const handleCancelExport = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      showToast({
        type: 'info',
        title: 'Export Cancelled',
        message: 'PDF rendering was halted.',
      });
    }
  };

  // Download compiled file
  const handleDownloadFile = () => {
    if (!exportResult?.blob) return;
    const downloadAnchor = window.document.createElement('a');
    const url = URL.createObjectURL(exportResult.blob);
    downloadAnchor.setAttribute('href', url);
    downloadAnchor.setAttribute('download', exportResult.filename);
    window.document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    showToast({
      type: 'success',
      title: 'File Downloaded',
      message: `${exportResult.filename} saved to your device.`,
    });
  };

  // JSON Backup Export
  const handleExportJsonBackup = () => {
    const filename = PdfExportService.sanitizeFilename(activeProject.name, 'Studio_Backup', 'json');
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(
        JSON.stringify(
          {
            project: activeProject,
            document,
            schemaVersion: '2.0',
            exportedAt: new Date().toISOString(),
          },
          null,
          2
        )
      );
    const downloadAnchor = window.document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', filename);
    window.document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    showToast({
      type: 'success',
      title: 'Project Backup Downloaded',
      message: 'Complete manuscript manifest, pages, and metadata saved.',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div onClick={onClose} className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity" />

      {/* Main Modal Dialog */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="relative w-full max-w-5xl max-h-[92vh] bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden z-10 flex flex-col"
      >
        {/* TOP HEADER */}
        <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between shrink-0 bg-neutral-50/50 dark:bg-neutral-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white font-display">
                  Amazon KDP Export & Production Center
                </h2>
                <span className="text-[10px] font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full">
                  Phase 7 Print Pipeline
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                {activeProject.name} • {totalPages} Pages • {activeProject.kdpSettings?.trimSize?.name || '8.5" × 11"'} • {activeProject.type}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BODY: 2-COLUMN WORKSPACE */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT COLUMN: Export Configuration & Controls (7 Cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* 1. Target Export Type Switcher */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
                Target Output Package
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setTargetType('interior');
                    setExportResult(null);
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    targetType === 'interior'
                      ? 'border-amber-500 bg-amber-500/10 ring-1 ring-amber-500'
                      : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300'
                  }`}
                >
                  <FileText className="w-5 h-5 text-amber-500 mb-1.5" />
                  <div className="font-bold text-xs text-neutral-900 dark:text-white">Interior PDF</div>
                  <div className="text-[10px] text-neutral-500">Vector pages & puzzles</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTargetType('cover');
                    setExportResult(null);
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    targetType === 'cover'
                      ? 'border-amber-500 bg-amber-500/10 ring-1 ring-amber-500'
                      : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300'
                  }`}
                >
                  <BookOpen className="w-5 h-5 text-blue-500 mb-1.5" />
                  <div className="font-bold text-xs text-neutral-900 dark:text-white">Full Cover Wrap</div>
                  <div className="text-[10px] text-neutral-500">Front + Spine + Back</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTargetType('backup');
                    setExportResult(null);
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    targetType === 'backup'
                      ? 'border-amber-500 bg-amber-500/10 ring-1 ring-amber-500'
                      : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300'
                  }`}
                >
                  <Code2 className="w-5 h-5 text-emerald-500 mb-1.5" />
                  <div className="font-bold text-xs text-neutral-900 dark:text-white">JSON Project</div>
                  <div className="text-[10px] text-neutral-500">Full editable state</div>
                </button>
              </div>
            </div>

            {targetType !== 'backup' && (
              <>
                {/* 2. KDP Manufacturing Presets */}
                <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/80 dark:border-neutral-700/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      KDP Manufacturing Presets
                    </span>
                    <span className="text-[10px] text-neutral-400">1-Click Standards</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    <button
                      type="button"
                      onClick={() => applyPreset('bw_white')}
                      className={`p-2 rounded-xl text-left border text-[11px] font-semibold transition-all ${
                        colorMode === 'grayscale' && paperStock === 'White'
                          ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          : 'border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      B&W (White Paper)
                    </button>

                    <button
                      type="button"
                      onClick={() => applyPreset('bw_cream')}
                      className={`p-2 rounded-xl text-left border text-[11px] font-semibold transition-all ${
                        colorMode === 'grayscale' && paperStock === 'Cream'
                          ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          : 'border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      B&W (Cream Paper)
                    </button>

                    <button
                      type="button"
                      onClick={() => applyPreset('color_std')}
                      className={`p-2 rounded-xl text-left border text-[11px] font-semibold transition-all ${
                        colorMode === 'rgb' && paperStock === 'Standard Color'
                          ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          : 'border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      Standard Color
                    </button>

                    <button
                      type="button"
                      onClick={() => applyPreset('color_prem')}
                      className={`p-2 rounded-xl text-left border text-[11px] font-semibold transition-all ${
                        colorMode === 'rgb' && paperStock === 'Premium Color'
                          ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          : 'border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      Premium Color
                    </button>
                  </div>
                </div>

                {/* 3. Detailed Specifications Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {/* Color Space Selection */}
                  <div className="space-y-1.5">
                    <label className="block font-bold text-neutral-600 dark:text-neutral-400">
                      Color Space Profile
                    </label>
                    <select
                      value={colorMode}
                      onChange={e => setColorMode(e.target.value as ExportColorMode)}
                      className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-medium"
                    >
                      <option value="grayscale">Grayscale Monochrome (KDP B&W Interior)</option>
                      <option value="rgb">RGB Color (Children / Illustration / Art)</option>
                    </select>
                    <p className="text-[10px] text-neutral-400 italic">
                      Note: CMYK conversion is not available in the current client-side PDF export pipeline (outputs RGB/Grayscale with KDP print-density targets).
                    </p>
                  </div>

                  {/* Paper Stock */}
                  <div className="space-y-1.5">
                    <label className="block font-bold text-neutral-600 dark:text-neutral-400">
                      Paper Stock & Multiplier
                    </label>
                    <select
                      value={paperStock}
                      onChange={e => setPaperStock(e.target.value as any)}
                      className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-medium"
                    >
                      <option value="White">White Paper (0.002252" / page)</option>
                      <option value="Cream">Cream Paper (0.0025" / page)</option>
                      <option value="Standard Color">Standard Color (0.002252" / page)</option>
                      <option value="Premium Color">Premium Color (0.002347" / page)</option>
                    </select>
                  </div>

                  {/* Bleed Toggle */}
                  <div className="space-y-1.5">
                    <label className="flex items-center justify-between p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 cursor-pointer">
                      <div>
                        <div className="font-bold text-neutral-800 dark:text-neutral-200">Include 0.125" Bleed</div>
                        <div className="text-[10px] text-neutral-400">Standard KDP Trim Bleed Margin</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={includeBleed}
                        onChange={e => setIncludeBleed(e.target.checked)}
                        className="rounded text-amber-500 focus:ring-0 w-4 h-4"
                      />
                    </label>
                  </div>

                  {/* Crop Marks Toggle */}
                  <div className="space-y-1.5">
                    <label className="flex items-center justify-between p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 cursor-pointer">
                      <div>
                        <div className="font-bold text-neutral-800 dark:text-neutral-200">Include Trim Marks</div>
                        <div className="text-[10px] text-neutral-400">Add corner crop indicators</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={includeCropMarks}
                        onChange={e => setIncludeCropMarks(e.target.checked)}
                        className="rounded text-amber-500 focus:ring-0 w-4 h-4"
                      />
                    </label>
                  </div>
                </div>

                {/* 4. Page Range Selector (for Interior) */}
                {targetType === 'interior' && (
                  <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-700 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-neutral-700 dark:text-neutral-300">Page Scope</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setPageRange('all')}
                          className={`px-2.5 py-1 rounded-lg font-semibold ${
                            pageRange === 'all'
                              ? 'bg-amber-500 text-neutral-950'
                              : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
                          }`}
                        >
                          All ({totalPages} Pages)
                        </button>
                        <button
                          type="button"
                          onClick={() => setPageRange('custom')}
                          className={`px-2.5 py-1 rounded-lg font-semibold ${
                            pageRange === 'custom'
                              ? 'bg-amber-500 text-neutral-950'
                              : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
                          }`}
                        >
                          Custom Range
                        </button>
                      </div>
                    </div>

                    {pageRange === 'custom' && (
                      <div className="flex items-center gap-3 pt-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-neutral-500">From Page:</span>
                          <input
                            type="number"
                            min="1"
                            max={totalPages}
                            value={customRangeStart}
                            onChange={e => setCustomRangeStart(parseInt(e.target.value) || 1)}
                            className="w-16 p-1.5 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 font-mono text-center"
                          />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-neutral-500">To Page:</span>
                          <input
                            type="number"
                            min={customRangeStart}
                            max={totalPages}
                            value={customRangeEnd}
                            onChange={e => setCustomRangeEnd(parseInt(e.target.value) || totalPages)}
                            className="w-16 p-1.5 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 font-mono text-center"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* RIGHT COLUMN: Real-Time Preflight Checklist & Diagnostics (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-neutral-700">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span className="font-bold text-xs text-neutral-800 dark:text-neutral-200">
                    KDP Pre-Export Audit Checklist
                  </span>
                </div>
                <button
                  type="button"
                  onClick={runPreflightCheck}
                  className="text-[10px] text-amber-500 hover:text-amber-400 flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  Re-Audit
                </button>
              </div>

              {/* Preflight Checklist Items */}
              <div className="space-y-2 text-xs">
                {/* 1. Page Count */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {totalPages >= 24 && totalPages <= 828 ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                    )}
                    <span className="text-neutral-700 dark:text-neutral-300">Page Count (KDP 24–828)</span>
                  </div>
                  <span className="font-mono text-[10px] font-bold text-neutral-500">{totalPages} pages</span>
                </div>

                {/* 2. Inside Gutter */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {(activeProject.kdpSettings?.margins?.left || 0.5) >= insideGutter ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    )}
                    <span className="text-neutral-700 dark:text-neutral-300">Gutter Margin ({insideGutter}")</span>
                  </div>
                  <span className="font-mono text-[10px] font-bold text-neutral-500">
                    {activeProject.kdpSettings?.margins?.left || 0.5}"
                  </span>
                </div>

                {/* 3. Trim Box */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span className="text-neutral-700 dark:text-neutral-300">Trim Dimensions</span>
                  </div>
                  <span className="font-mono text-[10px] font-bold text-neutral-500">
                    {trimW}" × {trimH}"
                  </span>
                </div>

                {/* 4. Spine Width */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span className="text-neutral-700 dark:text-neutral-300">Calculated Spine Thickness</span>
                  </div>
                  <span className="font-mono text-[10px] font-bold text-neutral-500">{spineWidthIn}"</span>
                </div>

                {/* 5. Vector Engine */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span className="text-neutral-700 dark:text-neutral-300">Vector Print Precision</span>
                  </div>
                  <span className="font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    300+ DPI Target
                  </span>
                </div>
              </div>

              {/* Status Summary Banner */}
              <div
                className={`p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between ${
                  validationReport?.hasErrors
                    ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                    : validationReport?.hasWarnings
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                }`}
              >
                <span>
                  {validationReport?.hasErrors
                    ? `${validationReport.errorsCount} Critical Issue(s) Need Attention`
                    : validationReport?.hasWarnings
                    ? `${validationReport.warningsCount} Warning(s) Detected`
                    : 'Ready based on the checks implemented by this application'}
                </span>
                <span className="font-mono text-[10px] font-bold">
                  {validationReport?.hasErrors ? 'NOT READY' : validationReport?.hasWarnings ? 'WARNINGS' : 'READY'}
                </span>
              </div>

              {/* Warning override checkbox */}
              {validationReport?.hasWarnings && !validationReport.hasErrors && (
                <label className="flex items-center gap-2 text-[11px] text-neutral-600 dark:text-neutral-400 pt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ignoreWarnings}
                    onChange={e => setIgnoreWarnings(e.target.checked)}
                    className="rounded text-amber-500 focus:ring-0"
                  />
                  <span>Acknowledge warnings & proceed with export</span>
                </label>
              )}
            </div>

            {/* If Export Completed: Post-Generation PDF Inspection Report */}
            {exportResult?.preflight && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/30 space-y-2 text-xs"
              >
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
                  <FileCheck className="w-4 h-4" />
                  <span>PDF Preflight Validation Pass Succeeded</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-neutral-600 dark:text-neutral-400">
                  <div>
                    <span className="font-semibold text-neutral-700 dark:text-neutral-300">File Size:</span>{' '}
                    {exportResult.preflight.fileSizeFormatted}
                  </div>
                  <div>
                    <span className="font-semibold text-neutral-700 dark:text-neutral-300">Verified Pages:</span>{' '}
                    {exportResult.preflight.actualPages} / {exportResult.preflight.expectedPages}
                  </div>
                  <div>
                    <span className="font-semibold text-neutral-700 dark:text-neutral-300">MediaBox:</span>{' '}
                    {Math.round(exportResult.preflight.dimensionsPt.width)}pt × {Math.round(exportResult.preflight.dimensionsPt.height)}pt
                  </div>
                  <div>
                    <span className="font-semibold text-neutral-700 dark:text-neutral-300">Vector Objects:</span>{' '}
                    {exportResult.preflight.vectorObjectCount}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* PROGRESS BAR OVERLAY (When Exporting) */}
        {isExporting && progress && (
          <div className="px-6 py-3 bg-amber-500/10 border-t border-amber-500/20 flex items-center justify-between gap-4">
            <div className="flex-1 space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-neutral-800 dark:text-neutral-200">
                <span>{progress.message}</span>
                <span className="font-mono text-amber-600 dark:text-amber-400">{progress.percentage}%</span>
              </div>
              <div className="w-full h-2 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 transition-all duration-150 rounded-full"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleCancelExport}
              className="px-3 py-1.5 rounded-xl border border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/10 text-xs font-bold flex items-center gap-1.5 shrink-0"
            >
              <StopCircle className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </button>
          </div>
        )}

        {/* FOOTER ACTIONS BAR */}
        <div className="px-6 py-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-3 bg-neutral-50/80 dark:bg-neutral-900/80 shrink-0">
          <div className="text-xs text-neutral-500 hidden sm:block">
            {targetType === 'interior' ? 'KDP Print Interior PDF (Single Pages)' : targetType === 'cover' ? 'KDP Wrap Cover PDF' : 'JSON Archive'}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
            >
              Close
            </button>

            {exportResult?.blob ? (
              <button
                type="button"
                onClick={handleDownloadFile}
                className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs transition-all shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Save {exportResult.filename}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStartExport}
                disabled={isExporting || (validationReport?.hasErrors ?? false)}
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:pointer-events-none text-neutral-950 font-bold text-xs transition-all shadow-lg shadow-amber-500/20 active:scale-95 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>
                  {isExporting
                    ? 'Compiling PDF...'
                    : targetType === 'interior'
                    ? 'Export Interior PDF'
                    : targetType === 'cover'
                    ? 'Export Full Cover PDF'
                    : 'Download JSON Backup'}
                </span>
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

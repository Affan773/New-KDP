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
  BookOpen,
  StopCircle,
  FileCheck,
  RefreshCw,
  Sliders,
  Maximize2,
  Info,
} from 'lucide-react';
import { useEditor } from '../../context/EditorContext';
import { useApp } from '../../context/AppContext';
import {
  ExportColorMode,
  ExportProgressEvent,
  ExportResult,
  ExportSettings,
  PdfExportService,
} from '../../services/pdfExportService';
import { BookValidationService, ValidationReport } from '../../services/bookValidationService';
import {
  calculateKdpCoverDimensions,
  calculateKdpInsideMargin,
  calculateKdpSpineWidth,
} from '../../constants/kdp';
import { ExportCenterModal } from '../books/ExportCenterModal';

interface EditorExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToPage?: (pageNumber: number) => void;
}

export const EditorExportModal: React.FC<EditorExportModalProps> = ({
  isOpen,
  onClose,
  onNavigateToPage,
}) => {
  const { document } = useEditor();
  const { activeProject, showToast } = useApp();

  // Export Target: 'interior' | 'cover' | 'json'
  const [exportFormat, setExportFormat] = useState<'interior' | 'cover' | 'json'>('interior');
  const [colorMode, setColorMode] = useState<ExportColorMode>('grayscale');
  const [includeBleed, setIncludeBleed] = useState<boolean>(true);
  const [includeCropMarks, setIncludeCropMarks] = useState<boolean>(false);
  const [pageRange, setPageRange] = useState<'all' | 'custom'>('all');
  const [customRangeStart, setCustomRangeStart] = useState<number>(1);
  const [customRangeEnd, setCustomRangeEnd] = useState<number>(document?.pages.length || 24);
  const [paperStock, setPaperStock] = useState<'White' | 'Cream' | 'Premium Color' | 'Standard Color'>('White');

  // Advanced Production Mode View Toggle
  const [showAdvancedCenter, setShowAdvancedCenter] = useState<boolean>(false);

  // Preflight & Validation State
  const [validationReport, setValidationReport] = useState<ValidationReport | null>(null);
  const [ignoreWarnings, setIgnoreWarnings] = useState<boolean>(false);

  // Export Process State
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [progress, setProgress] = useState<ExportProgressEvent | null>(null);
  const [exportResult, setExportResult] = useState<ExportResult | null>(null);

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

  if (!isOpen || !activeProject || !document) return null;

  // If user requested full advanced center view, delegate to ExportCenterModal
  if (showAdvancedCenter) {
    return (
      <ExportCenterModal
        isOpen={isOpen}
        onClose={() => {
          setShowAdvancedCenter(false);
          onClose();
        }}
        onNavigateToPage={onNavigateToPage}
      />
    );
  }

  const pageCount = document.pages.length;
  const trimW = activeProject.kdpSettings?.trimSize?.width || 8.5;
  const trimH = activeProject.kdpSettings?.trimSize?.height || 11.0;
  const spineWidth = calculateKdpSpineWidth(pageCount, paperStock);
  const gutterMargin = calculateKdpInsideMargin(pageCount);
  const coverDimensions = calculateKdpCoverDimensions(trimW, trimH, spineWidth);

  const runPreflightCheck = () => {
    const report = BookValidationService.validateBook(activeProject, document);
    setValidationReport(report);
  };

  // Preset Configurations
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
      message: `Configured for ${preset.replace('_', ' ').toUpperCase()}`,
    });
  };

  // Main Export Handler
  const handleStartExport = async () => {
    if (exportFormat === 'json') {
      handleExportJsonBackup();
      return;
    }

    if (validationReport?.hasErrors) {
      showToast({
        type: 'error',
        title: 'Export Blocked by Preflight',
        message: 'Please resolve critical manuscript errors before exporting.',
      });
      return;
    }

    if (validationReport?.hasWarnings && !ignoreWarnings) {
      showToast({
        type: 'warning',
        title: 'Preflight Warnings Present',
        message: 'Review warnings or enable "Proceed with Warnings" to continue.',
      });
      return;
    }

    setIsExporting(true);
    setExportResult(null);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const settings: ExportSettings = {
      format: exportFormat === 'interior' ? 'interior_pdf' : 'cover_pdf',
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
      if (exportFormat === 'interior') {
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
        const downloadAnchor = window.document.createElement('a');
        const url = URL.createObjectURL(result.blob);
        downloadAnchor.setAttribute('href', url);
        downloadAnchor.setAttribute('download', result.filename);
        window.document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }

      showToast({
        type: 'success',
        title: `${exportFormat === 'interior' ? 'Interior' : 'Cover'} PDF Exported`,
        message: `Successfully compiled ${result.preflight.actualPages} page(s) (${result.preflight.fileSizeFormatted}).`,
      });
    } catch (err: any) {
      if (err?.message !== 'Export cancelled by user.') {
        console.error('PDF Export Error:', err);
        showToast({
          type: 'error',
          title: 'Export Failed',
          message: err?.message || 'An error occurred during PDF generation.',
        });
      }
    } finally {
      setIsExporting(false);
      abortControllerRef.current = null;
    }
  };

  const handleCancelExport = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      showToast({
        type: 'info',
        title: 'Export Cancelled',
        message: 'PDF compilation was stopped.',
      });
    }
  };

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
      message: 'Complete project manifest and vector pages saved.',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div onClick={onClose} className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity" />

      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden z-10 space-y-5 p-5 sm:p-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-neutral-900 dark:text-white font-display">
                  Export KDP Print Package
                </h2>
                <span className="text-[10px] font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full">
                  Vector Engine
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                {activeProject.name} • {pageCount} Pages • {activeProject.kdpSettings?.trimSize?.name || '8.5" × 11"'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAdvancedCenter(true)}
              className="px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-[11px] font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5 transition-colors hidden sm:flex"
              title="Open full-screen export workstation"
            >
              <Maximize2 className="w-3.5 h-3.5 text-amber-500" />
              <span>Advanced Center</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* KDP Pre-Flight Safety Verification */}
        <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 font-bold text-neutral-700 dark:text-neutral-300">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>KDP Pre-Flight Safety Audit</span>
            </div>
            <span
              className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-full ${
                validationReport?.hasErrors
                  ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                  : validationReport?.hasWarnings
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {validationReport?.hasErrors ? 'NOT READY' : validationReport?.hasWarnings ? 'WARNINGS' : 'READY'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400">
              {(activeProject.kdpSettings?.margins?.left || 0.5) >= gutterMargin ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              )}
              <span className="truncate">Gutter ({gutterMargin}")</span>
            </div>

            <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="truncate">Spine ({spineWidth}")</span>
            </div>

            <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="truncate">Trim ({trimW}"×{trimH}")</span>
            </div>

            <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold truncate">300+ DPI Vector</span>
            </div>
          </div>
        </div>

        {/* Target Format Options */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400">
            Export Target
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setExportFormat('interior')}
              className={`p-3 rounded-2xl border text-left transition-all ${
                exportFormat === 'interior'
                  ? 'border-amber-500 bg-amber-500/10 ring-1 ring-amber-500'
                  : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300'
              }`}
            >
              <FileText className="w-4 h-4 text-amber-500 mb-1.5" />
              <div className="font-bold text-xs text-neutral-900 dark:text-white">Interior PDF</div>
              <div className="text-[10px] text-neutral-500">Vector pages & puzzles</div>
            </button>

            <button
              type="button"
              onClick={() => setExportFormat('cover')}
              className={`p-3 rounded-2xl border text-left transition-all ${
                exportFormat === 'cover'
                  ? 'border-amber-500 bg-amber-500/10 ring-1 ring-amber-500'
                  : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300'
              }`}
            >
              <BookOpen className="w-4 h-4 text-blue-500 mb-1.5" />
              <div className="font-bold text-xs text-neutral-900 dark:text-white">Full Cover Wrap</div>
              <div className="text-[10px] text-neutral-500">Front + Spine + Back</div>
            </button>

            <button
              type="button"
              onClick={() => setExportFormat('json')}
              className={`p-3 rounded-2xl border text-left transition-all ${
                exportFormat === 'json'
                  ? 'border-amber-500 bg-amber-500/10 ring-1 ring-amber-500'
                  : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300'
              }`}
            >
              <Code2 className="w-4 h-4 text-emerald-500 mb-1.5" />
              <div className="font-bold text-xs text-neutral-900 dark:text-white">JSON Backup</div>
              <div className="text-[10px] text-neutral-500">Complete project state</div>
            </button>
          </div>
        </div>

        {/* Detailed Print Specifications (when PDF selected) */}
        {exportFormat !== 'json' && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Color Space */}
              <div className="space-y-1">
                <label className="block font-bold text-neutral-600 dark:text-neutral-400">
                  Color Profile
                </label>
                <select
                  value={colorMode}
                  onChange={e => setColorMode(e.target.value as ExportColorMode)}
                  className="w-full p-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-medium"
                >
                  <option value="grayscale">Grayscale Monochrome (KDP B&W Interior)</option>
                  <option value="rgb">RGB Color (Children / Illustration / Art)</option>
                </select>
              </div>

              {/* Paper Stock */}
              <div className="space-y-1">
                <label className="block font-bold text-neutral-600 dark:text-neutral-400">
                  Paper Stock Multiplier
                </label>
                <select
                  value={paperStock}
                  onChange={e => setPaperStock(e.target.value as any)}
                  className="w-full p-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-medium"
                >
                  <option value="White">White Paper (0.002252"/page)</option>
                  <option value="Cream">Cream Paper (0.002500"/page)</option>
                  <option value="Standard Color">Standard Color (0.002252"/page)</option>
                  <option value="Premium Color">Premium Color (0.002347"/page)</option>
                </select>
              </div>
            </div>

            {/* Page Range (Interior only) */}
            {exportFormat === 'interior' && (
              <div className="p-3 rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/40 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-neutral-700 dark:text-neutral-300">Page Range</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPageRange('all')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                        pageRange === 'all'
                          ? 'bg-amber-500 text-neutral-950 font-bold'
                          : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      All Pages ({pageCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setPageRange('custom')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                        pageRange === 'custom'
                          ? 'bg-amber-500 text-neutral-950 font-bold'
                          : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      Custom
                    </button>
                  </div>
                </div>

                {pageRange === 'custom' && (
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-neutral-500 text-[11px]">From Page:</span>
                    <input
                      type="number"
                      min={1}
                      max={customRangeEnd}
                      value={customRangeStart}
                      onChange={e => setCustomRangeStart(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-16 p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-center font-mono font-bold"
                    />
                    <span className="text-neutral-500 text-[11px]">to:</span>
                    <input
                      type="number"
                      min={customRangeStart}
                      max={pageCount}
                      value={customRangeEnd}
                      onChange={e => setCustomRangeEnd(Math.min(pageCount, parseInt(e.target.value) || pageCount))}
                      className="w-16 p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-center font-mono font-bold"
                    />
                    <span className="text-neutral-400 text-[11px] ml-auto">
                      ({Math.max(1, customRangeEnd - customRangeStart + 1)} pages selected)
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Bleed & Crop Marks Toggles */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <label className="flex items-center justify-between p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 cursor-pointer">
                <span className="font-semibold text-neutral-700 dark:text-neutral-300">0.125" Bleed Box</span>
                <input
                  type="checkbox"
                  checked={includeBleed}
                  onChange={e => setIncludeBleed(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 cursor-pointer">
                <span className="font-semibold text-neutral-700 dark:text-neutral-300">Include Trim Marks</span>
                <input
                  type="checkbox"
                  checked={includeCropMarks}
                  onChange={e => setIncludeCropMarks(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-0"
                />
              </label>
            </div>
          </div>
        )}

        {/* Progress Bar (When Exporting) */}
        {isExporting && progress && (
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1.5">
            <div className="flex justify-between text-xs font-bold text-neutral-800 dark:text-neutral-200">
              <span>{progress.message}</span>
              <span className="font-mono text-amber-600 dark:text-amber-400">{progress.percentage}%</span>
            </div>
            <div className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 transition-all duration-150 rounded-full"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-3">
          {validationReport?.hasWarnings && !validationReport.hasErrors && (
            <label className="flex items-center gap-2 text-[11px] text-neutral-600 dark:text-neutral-400 cursor-pointer">
              <input
                type="checkbox"
                checked={ignoreWarnings}
                onChange={e => setIgnoreWarnings(e.target.checked)}
                className="rounded text-amber-500 focus:ring-0"
              />
              <span>Proceed with warnings</span>
            </label>
          )}

          <div className="flex items-center gap-2.5 ml-auto">
            {isExporting ? (
              <button
                type="button"
                onClick={handleCancelExport}
                className="px-4 py-2.5 rounded-xl border border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/10 text-xs font-bold flex items-center gap-1.5"
              >
                <StopCircle className="w-4 h-4" />
                <span>Cancel</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                Cancel
              </button>
            )}

            <button
              type="button"
              onClick={handleStartExport}
              disabled={isExporting || (validationReport?.hasErrors ?? false)}
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:pointer-events-none text-neutral-950 font-bold text-xs transition-all shadow-lg shadow-amber-500/20 active:scale-95 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>
                {isExporting
                  ? 'Compiling...'
                  : exportFormat === 'interior'
                  ? 'Export Interior PDF'
                  : exportFormat === 'cover'
                  ? 'Export Cover PDF'
                  : 'Download JSON'}
              </span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

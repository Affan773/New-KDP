import React, { useState } from 'react';
import {
  X,
  FileCheck2,
  Download,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Package,
  Layers,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StorageService } from '../../services/storageService';
import { PdfExportService } from '../../services/pdfExportService';
import { Project } from '../../types';

interface BatchExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BatchExportModal: React.FC<BatchExportModalProps> = ({ isOpen, onClose }) => {
  const { projects, showToast } = useApp();

  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>(
    projects.slice(0, 5).map(p => p.id)
  );
  const [exportInteriorPdf, setExportInteriorPdf] = useState(true);
  const [exportCoverPdf, setExportCoverPdf] = useState(true);
  const [exportJsonBackup, setExportJsonBackup] = useState(false);
  const [colorMode, setColorMode] = useState<'grayscale' | 'rgb'>('grayscale');

  // Export progress
  const [isExporting, setIsExporting] = useState(false);
  const [currentBookIndex, setCurrentBookIndex] = useState(0);
  const [currentProgressText, setCurrentProgressText] = useState('');
  const [exportLogs, setExportLogs] = useState<{ name: string; status: 'success' | 'error'; message: string }[]>([]);

  if (!isOpen) return null;

  const toggleSelectAll = () => {
    if (selectedProjectIds.length === projects.length) {
      setSelectedProjectIds([]);
    } else {
      setSelectedProjectIds(projects.map(p => p.id));
    }
  };

  const toggleProject = (id: string) => {
    setSelectedProjectIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleStartBatchExport = async () => {
    if (selectedProjectIds.length === 0) {
      showToast({ type: 'warning', message: 'Please select at least one project to export.' });
      return;
    }

    setIsExporting(true);
    setExportLogs([]);

    const selectedProjects = projects.filter(p => selectedProjectIds.includes(p.id));

    for (let i = 0; i < selectedProjects.length; i++) {
      const proj = selectedProjects[i];
      setCurrentBookIndex(i + 1);
      setCurrentProgressText(`[${i + 1}/${selectedProjects.length}] Loading manuscript for "${proj.name}"...`);

      try {
        const doc = StorageService.getDocument(proj.documentId);
        if (!doc) throw new Error('Document model not found in storage.');

        // 1. Interior PDF
        if (exportInteriorPdf) {
          setCurrentProgressText(`[${i + 1}/${selectedProjects.length}] Rendering interior PDF pages...`);
          const interiorResult = await PdfExportService.exportInteriorPdf(
            proj,
            doc,
            {
              format: 'interior_pdf',
              colorMode,
              includeBleed: false,
              includeCropMarks: false,
              pageRange: 'all',
              paperStock: proj.kdpSettings?.paperType || 'White',
            },
            event => {
              setCurrentProgressText(`[${i + 1}/${selectedProjects.length}] ${event.message}`);
            }
          );

          if (interiorResult.blob) {
            const url = URL.createObjectURL(interiorResult.blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = interiorResult.filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }
        }

        // 2. Cover PDF
        if (exportCoverPdf) {
          setCurrentProgressText(`[${i + 1}/${selectedProjects.length}] Calculating cover spread dimensions...`);
          const coverResult = await PdfExportService.exportCoverPdf(
            proj,
            doc,
            {
              format: 'cover_pdf',
              colorMode: 'rgb',
              includeBleed: true,
              includeCropMarks: false,
              pageRange: 'all',
              paperStock: proj.kdpSettings?.paperType || 'White',
            },
            event => {
              setCurrentProgressText(`[${i + 1}/${selectedProjects.length}] ${event.message}`);
            }
          );

          if (coverResult.blob) {
            const url = URL.createObjectURL(coverResult.blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = coverResult.filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }
        }

        // 3. JSON Backup
        if (exportJsonBackup) {
          const backupData = JSON.stringify({ project: proj, document: doc }, null, 2);
          const blob = new Blob([backupData], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = PdfExportService.sanitizeFilename(proj.name, 'Backup', 'json');
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }

        setExportLogs(prev => [
          ...prev,
          { name: proj.name, status: 'success', message: 'Interior & Cover exported successfully.' },
        ]);
      } catch (err: any) {
        console.error(`Export failed for ${proj.name}:`, err);
        setExportLogs(prev => [
          ...prev,
          { name: proj.name, status: 'error', message: err.message || 'Export error.' },
        ]);
      }

      // Small pause between downloads to prevent browser throttling
      await new Promise(r => setTimeout(r, 400));
    }

    setIsExporting(false);
    showToast({
      type: 'success',
      title: 'Batch Export Complete',
      message: `Processed ${selectedProjects.length} books for KDP print distribution.`,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-900 dark:text-white font-display">
                Batch KDP Export Production
              </h2>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Generate production PDFs for multiple books simultaneously.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Target options */}
          <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 space-y-3">
            <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">
              Output Packages
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={exportInteriorPdf}
                  onChange={e => setExportInteriorPdf(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded"
                />
                <span>Interior PDF (Print Ready)</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={exportCoverPdf}
                  onChange={e => setExportCoverPdf(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded"
                />
                <span>Full Wrap Cover PDF</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={exportJsonBackup}
                  onChange={e => setExportJsonBackup(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded"
                />
                <span>JSON Project Backups</span>
              </label>
            </div>
          </div>

          {/* Project Selection List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                Select Books ({selectedProjectIds.length} of {projects.length} selected)
              </span>
              <button
                type="button"
                onClick={toggleSelectAll}
                className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline"
              >
                {selectedProjectIds.length === projects.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="max-h-56 overflow-y-auto space-y-1.5 p-2 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-700/50">
              {projects.map(proj => (
                <label
                  key={proj.id}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white dark:hover:bg-neutral-800 border border-transparent hover:border-neutral-200 dark:hover:border-neutral-700 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <input
                      type="checkbox"
                      checked={selectedProjectIds.includes(proj.id)}
                      onChange={() => toggleProject(proj.id)}
                      className="w-4 h-4 accent-amber-500 rounded shrink-0"
                    />
                    <div className="truncate">
                      <div className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                        {proj.name}
                      </div>
                      <div className="text-[10px] text-neutral-500 font-mono">
                        {proj.pageCount} Pages • {proj.kdpSettings?.trimSize?.name || '8.5x11'}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-700 font-mono text-neutral-600 dark:text-neutral-300 shrink-0">
                    {proj.status || 'Draft'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Progress Logs if running */}
          {isExporting && (
            <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-700 dark:text-blue-300">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{currentProgressText}</span>
              </div>
            </div>
          )}

          {exportLogs.length > 0 && !isExporting && (
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              {exportLogs.map((log, idx) => (
                <div
                  key={idx}
                  className={`text-xs p-2 rounded-lg flex items-center gap-2 ${
                    log.status === 'success'
                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                      : 'bg-rose-500/10 text-rose-700 dark:text-rose-300'
                  }`}
                >
                  {log.status === 'success' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  )}
                  <span className="font-bold truncate">{log.name}:</span>
                  <span className="truncate">{log.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-900/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            Close
          </button>

          <button
            type="button"
            disabled={isExporting || selectedProjectIds.length === 0}
            onClick={handleStartBatchExport}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all shadow-md shadow-blue-500/20 flex items-center gap-2 disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Exporting ({currentBookIndex}/{selectedProjectIds.length})...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Export {selectedProjectIds.length} Books</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

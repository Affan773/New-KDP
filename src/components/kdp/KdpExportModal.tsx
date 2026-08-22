import React, { useState } from 'react';
import {
  Package,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  FileCode,
  ShieldCheck,
  Printer,
  Layers,
  X,
  RefreshCw,
  Loader2,
  Check,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { KDPExportService } from '../../services/kdpExportService';
import { KDPPreflightService } from '../../services/kdpPreflightService';
import {
  KDPExportPackageFile,
  KDPExportPackageResult,
} from '../../types/kdp';
import { DocumentModel, Project } from '../../types/project';

interface KdpExportModalProps {
  project: Project;
  document?: DocumentModel | null;
  onClose: () => void;
}

export const KdpExportModal: React.FC<KdpExportModalProps> = ({
  project,
  document,
  onClose,
}) => {
  const { showToast, updateProject } = useApp();
  const [isCompiling, setIsCompiling] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [progressPct, setProgressPct] = useState(0);
  const [exportResult, setExportResult] = useState<KDPExportPackageResult | null>(null);

  const preflight = KDPPreflightService.validate(project, document);

  const handleBuildPackage = async () => {
    if (preflight.status === 'FAIL') {
      showToast({
        type: 'error',
        title: 'Export Blocked',
        message: 'Please resolve all validation errors before exporting the KDP package.',
      });
      return;
    }

    setIsCompiling(true);
    setProgressPct(5);
    setProgressMsg('Initializing KDP packaging engine...');

    try {
      const result = await KDPExportService.buildExportPackage(
        project,
        document,
        (msg, pct) => {
          setProgressMsg(msg);
          setProgressPct(pct);
        }
      );

      setExportResult(result);

      // Update project publication status to EXPORTED
      if (project.kdpConfig) {
        updateProject({
          ...project,
          kdpConfig: {
            ...project.kdpConfig,
            publicationStatus: 'EXPORTED',
            validationStatus: preflight.status,
            updatedAt: new Date().toISOString(),
          },
        });
      }

      showToast({
        type: 'success',
        title: 'KDP Package Assembled',
        message: 'All print files, manifests, and validation reports generated successfully.',
      });
    } catch (err: any) {
      console.error('KDP Export failure:', err);
      showToast({
        type: 'error',
        title: 'Packaging Failed',
        message: err?.message || 'Could not assemble KDP package.',
      });
    } finally {
      setIsCompiling(false);
    }
  };

  const handleDownloadZip = () => {
    if (!exportResult?.zipBlob) return;
    const cleanTitle = (project.kdpConfig?.title || project.name)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-');
    KDPExportService.triggerDownload(
      exportResult.zipBlob,
      `kdp-package-${cleanTitle}-${new Date().toISOString().slice(0, 10)}.zip`
    );
    showToast({
      type: 'success',
      title: 'ZIP Download Started',
      message: 'Full KDP package archive is downloading.',
    });
  };

  const handleDownloadSingle = (file: KDPExportPackageFile) => {
    if (!file.blob) return;
    KDPExportService.triggerDownload(file.blob, file.name);
    showToast({
      type: 'success',
      title: 'Download Started',
      message: `Downloading ${file.name}`,
    });
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith('.json')) return <FileCode className="w-4 h-4 text-amber-500" />;
    if (fileName.endsWith('.pdf')) {
      if (fileName.includes('Report')) return <ShieldCheck className="w-4 h-4 text-emerald-500" />;
      if (fileName.includes('cover')) return <Layers className="w-4 h-4 text-blue-500" />;
      return <Printer className="w-4 h-4 text-purple-500" />;
    }
    return <FileText className="w-4 h-4 text-neutral-500" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/70 backdrop-blur-sm animate-fadeIn">
      <div
        className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                Generate Amazon KDP Publishing Package
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Bundles print interior PDF, cover PDF, metadata.json, keywords, and preflight certificate.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Preflight Status Check Banner */}
          <div
            className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
              preflight.status === 'PASS'
                ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-200'
                : preflight.status === 'WARNING'
                ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40 text-amber-900 dark:text-amber-200'
                : 'bg-red-50/60 dark:bg-red-950/20 border-red-200 dark:border-red-900/40 text-red-900 dark:text-red-200'
            }`}
          >
            <div className="flex items-center gap-3">
              {preflight.status === 'PASS' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : preflight.status === 'WARNING' ? (
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
              )}
              <div>
                <div className="font-bold text-xs">
                  {preflight.status === 'PASS'
                    ? 'All Preflight Checks Passed'
                    : preflight.status === 'WARNING'
                    ? 'Preflight Passed with Warnings'
                    : 'Validation Errors Detected'}
                </div>
                <div className="text-[11px] opacity-80 mt-0.5">
                  {preflight.status === 'PASS'
                    ? 'Your book satisfies Amazon KDP mechanical tolerances and mandatory AI disclosure.'
                    : preflight.status === 'WARNING'
                    ? `${preflight.warnings.length} warning(s) found, but package generation is enabled.`
                    : `${preflight.errors.length} blocking error(s) must be fixed before package generation.`}
                </div>
              </div>
            </div>

            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-white/60 dark:bg-black/30">
              {preflight.status}
            </span>
          </div>

          {/* Compilation Progress bar if in progress */}
          {isCompiling && (
            <div className="p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-2 animate-pulse">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-neutral-800 dark:text-neutral-200">{progressMsg}</span>
                <span className="text-amber-600 dark:text-amber-400 font-mono">{progressPct}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
                <div
                  className="h-full bg-amber-500 transition-all duration-300 rounded-full"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}

          {/* File Inventory */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Package File Manifest
              </h3>
              <span className="text-[11px] text-neutral-400">6 standard files</span>
            </div>

            <div className="space-y-2">
              {(exportResult ? exportResult.files : getDefaultManifest(project)).map((file, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/80 dark:border-neutral-700/60 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center shrink-0">
                      {getFileIcon(file.name)}
                    </div>
                    <div>
                      <div className="font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                        <span>{file.name}</span>
                        {file.isMandatory && (
                          <span className="text-[9px] font-semibold text-neutral-400 uppercase">
                            Required
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                        {file.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {file.size > 0 && (
                      <span className="font-mono text-[11px] text-neutral-400">
                        {formatBytes(file.size)}
                      </span>
                    )}

                    {exportResult && file.blob && (
                      <button
                        type="button"
                        onClick={() => handleDownloadSingle(file)}
                        className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 transition-colors"
                        title={`Download ${file.name}`}
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Privacy & Safety Note */}
          <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/30 text-xs text-neutral-600 dark:text-neutral-300 space-y-1">
            <div className="font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
              <span>Security & Amazon Guidelines:</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              KDP package files are sanitized and contain zero API keys, secrets, or passwords. Direct Amazon KDP automatic uploading will be introduced in a future phase when officially supported.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-950/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            {!exportResult ? (
              <button
                type="button"
                disabled={preflight.status === 'FAIL' || isCompiling}
                onClick={handleBuildPackage}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-neutral-950 text-xs font-bold shadow-md shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-2"
              >
                {isCompiling ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Compiling Package...</span>
                  </>
                ) : (
                  <>
                    <Package className="w-4 h-4" />
                    <span>Build & Package KDP Files</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleDownloadZip}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Download Complete KDP ZIP Bundle</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

function getDefaultManifest(project: Project): KDPExportPackageFile[] {
  return [
    {
      name: 'metadata.json',
      type: 'application/json',
      size: 0,
      isMandatory: true,
      status: 'READY',
      description: 'Structured machine-readable KDP publishing manifest.',
    },
    {
      name: 'description.txt',
      type: 'text/plain',
      size: 0,
      isMandatory: true,
      status: 'READY',
      description: 'Formatted product blurb and book specifications for KDP listing.',
    },
    {
      name: 'keywords.txt',
      type: 'text/plain',
      size: 0,
      isMandatory: true,
      status: 'READY',
      description: '7-keyword backend search phrases formatted for quick pasting.',
    },
    {
      name: 'KDP-Validation-Report.pdf',
      type: 'application/pdf',
      size: 0,
      isMandatory: true,
      status: 'READY',
      description: 'Comprehensive KDP preflight verification certificate.',
    },
    {
      name: 'interior.pdf',
      type: 'application/pdf',
      size: 0,
      isMandatory: true,
      status: 'READY',
      description: 'Complete high-resolution vector print interior manuscript.',
    },
    {
      name: 'cover.pdf',
      type: 'application/pdf',
      size: 0,
      isMandatory: false,
      status: 'READY',
      description: 'Full wrap cover calculation with spine and bleed boundaries.',
    },
  ];
}

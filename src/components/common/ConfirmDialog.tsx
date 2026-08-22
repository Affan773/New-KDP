import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ConfirmDialog: React.FC = () => {
  const { confirmDialog, closeConfirmDialog } = useApp();

  if (!confirmDialog.isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeConfirmDialog}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs"
        />

        {/* Modal Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.15 }}
          className="relative w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl p-6 overflow-hidden z-10"
        >
          <div className="flex items-start gap-4">
            <div
              className={`p-3 rounded-xl shrink-0 ${
                confirmDialog.isDestructive
                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
              }`}
            >
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                {confirmDialog.title}
              </h3>
              <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                {confirmDialog.message}
              </p>
            </div>
            <button
              type="button"
              onClick={closeConfirmDialog}
              className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-1 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-neutral-100 dark:border-neutral-800">
            <button
              type="button"
              onClick={closeConfirmDialog}
              className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors"
            >
              {confirmDialog.cancelLabel || 'Cancel'}
            </button>
            <button
              type="button"
              onClick={() => {
                confirmDialog.onConfirm();
                closeConfirmDialog();
              }}
              className={`px-4 py-2 text-sm font-medium text-white rounded-xl transition-colors shadow-sm ${
                confirmDialog.isDestructive
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-amber-600 hover:bg-amber-700'
              }`}
            >
              {confirmDialog.confirmLabel || 'Confirm Action'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

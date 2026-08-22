import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none px-4 sm:px-0">
      <AnimatePresence>
        {toasts.map(toast => {
          let icon = <Info className="w-5 h-5 text-blue-500 shrink-0" />;
          let borderStyle = 'border-blue-500/20 bg-blue-50/95 dark:bg-neutral-900/95 text-blue-950 dark:text-blue-100';

          if (toast.type === 'success') {
            icon = <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />;
            borderStyle = 'border-emerald-500/20 bg-emerald-50/95 dark:bg-neutral-900/95 text-emerald-950 dark:text-emerald-100';
          } else if (toast.type === 'error') {
            icon = <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />;
            borderStyle = 'border-rose-500/20 bg-rose-50/95 dark:bg-neutral-900/95 text-rose-950 dark:text-rose-100';
          } else if (toast.type === 'warning') {
            icon = <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />;
            borderStyle = 'border-amber-500/20 bg-amber-50/95 dark:bg-neutral-900/95 text-amber-950 dark:text-amber-100';
          }

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ duration: 0.18 }}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-xl backdrop-blur-md ${borderStyle}`}
            >
              {icon}
              <div className="flex-1 text-sm">
                {toast.title && <div className="font-semibold text-neutral-900 dark:text-neutral-100 mb-0.5">{toast.title}</div>}
                <p className="text-neutral-700 dark:text-neutral-300 text-xs leading-relaxed">{toast.message}</p>
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 p-1 -mr-1 -mt-1 rounded-lg transition-colors"
                aria-label="Close notification"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

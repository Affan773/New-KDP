import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  side?: 'left' | 'right';
  widthClass?: string;
  headerActions?: React.ReactNode;
  footer?: React.ReactNode;
  id?: string;
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  side = 'left',
  widthClass = 'w-80 sm:w-96 max-w-[85vw]',
  headerActions,
  footer,
  id,
}) => {
  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div id={id} className="fixed inset-0 z-50 overflow-hidden flex">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: side === 'left' ? '-100%' : '100%' }}
            animate={{ x: 0 }}
            exit={{ x: side === 'left' ? '-100%' : '100%' }}
            transition={{ duration: 0.25 }}
            className={`relative flex flex-col h-full bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 shadow-2xl z-10 select-none ${widthClass} ${
              side === 'left' ? 'mr-auto border-r' : 'ml-auto border-l'
            }`}
          >
            {/* Header */}
            <div className="h-16 px-4 flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 shrink-0 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xs">
              <div className="flex-1 min-w-0 pr-2">
                {typeof title === 'string' ? (
                  <h2 className="text-base font-bold text-neutral-900 dark:text-white truncate">
                    {title}
                  </h2>
                ) : (
                  title
                )}
                {subtitle && (
                  <div className="text-xs text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                    {subtitle}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {headerActions}
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
                  aria-label="Close drawer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-0">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-900/80 shrink-0">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

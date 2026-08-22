import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  maxHeightClass?: string;
  headerActions?: React.ReactNode;
  id?: string;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxHeightClass = 'max-h-[85vh]',
  headerActions,
  id,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);

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
        <div id={id} className="fixed inset-0 z-50 overflow-hidden flex flex-col justify-end">
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

          {/* Bottom Sheet Modal */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
            className={`relative w-full bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 rounded-t-3xl shadow-2xl z-10 flex flex-col ${maxHeightClass} pb-safe`}
          >
            {/* Grab Handle */}
            <div className="w-full pt-3 pb-1 flex items-center justify-center shrink-0 cursor-grab">
              <div className="w-12 h-1.5 rounded-full bg-neutral-300 dark:bg-neutral-700" />
            </div>

            {/* Header */}
            <div className="px-5 py-2.5 flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 shrink-0">
              <div className="flex-1 min-w-0 pr-2">
                {typeof title === 'string' ? (
                  <h3 className="text-base font-bold text-neutral-900 dark:text-white truncate font-display">
                    {title}
                  </h3>
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
                  aria-label="Close bottom sheet"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Sheet Body */}
            <div ref={contentRef} className="flex-1 overflow-y-auto p-4 sm:p-5">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

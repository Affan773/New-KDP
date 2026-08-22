import React from 'react';
import { motion } from 'motion/react';
import {
  Sparkles,
  FileText,
  ShieldCheck,
  Cpu,
  ArrowRight,
  CheckCircle2,
  Calendar,
  Layers,
  Database,
  Lock,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface PhasePlaceholderProps {
  module: 'ai' | 'pdf-tools' | 'kdp-checker' | 'admin';
}

export const PhasePlaceholder: React.FC<PhasePlaceholderProps> = ({ module }) => {
  const { setCurrentRoute } = useApp();

  const configs = {
    ai: {
      title: 'AI Content & Illustration Studio',
      phase: 'Phase 2: Intelligent Generation Suite',
      badge: 'Coming in Phase 2',
      icon: <Sparkles className="w-8 h-8 text-amber-500" />,
      description:
        'Server-side Gemini AI orchestration for generating themed puzzle word banks, coloring book line art prompts, children activity scenarios, and marketing metadata.',
      milestones: [
        'Automated Word Search vocabulary clustering with Gemini Flash',
        'Algorithmic story generation for kids activity book interiors',
        'Custom coloring page SVG vector generation and line extraction',
        'Amazon KDP 7-keyword backend optimization & subtitle generator',
      ],
      ctaText: 'Explore Puzzle Center',
      ctaTarget: 'puzzles' as const,
    },
    'pdf-tools': {
      title: 'KDP PDF Engine & Interior Merging',
      phase: 'Phase 2: PDF Print Production',
      badge: 'Coming in Phase 2',
      icon: <FileText className="w-8 h-8 text-blue-500" />,
      description:
        'High-resolution 300 DPI PDF vector rendering, multi-file PDF interior merging, page renumbering, and print-ready PDF/X-1a compliance export.',
      milestones: [
        'Direct 300 DPI PDF/X-1a export with embedded CMYK profiles',
        'Multi-PDF interior merger with custom page sequence insertion',
        'Automated even/odd gutter margin adjustment for double-sided print',
        'Spine barcode & KDP ISBN placemark stampers',
      ],
      ctaText: 'Back to Editor',
      ctaTarget: 'editor' as const,
    },
    'kdp-checker': {
      title: 'Automated KDP Pre-Flight Inspector',
      phase: 'Phase 2: Publishing Safety Gate',
      badge: 'Coming in Phase 2',
      icon: <ShieldCheck className="w-8 h-8 text-emerald-500" />,
      description:
        'Automated pre-flight check that flags bleed issues, illegible font sizes, low-resolution raster images, and margin violations before you upload to Amazon KDP.',
      milestones: [
        'Automated minimum 300 DPI raster DPI scanning on all assets',
        'Gutter margin safety violation heatmaps on every page',
        'Paperback barcode exclusion area verification',
        'Print cover wrap dimension calculator with spine thickness validation',
      ],
      ctaText: 'View KDP Book Catalog',
      ctaTarget: 'books' as const,
    },
    admin: {
      title: 'Studio Management & Cloud Admin',
      phase: 'Phase 3: Multi-Tenant Enterprise Tier',
      badge: 'Coming in Phase 3',
      icon: <Cpu className="w-8 h-8 text-indigo-500" />,
      description:
        'PostgreSQL-backed tenant administration, team seat management, template marketplace curation, and API rate-limiting analytics.',
      milestones: [
        'Row Level Security (RLS) policies for multi-user collaboration',
        'Curated public marketplace for creator puzzle templates',
        'Supabase Storage asset bucket optimization & CDN delivery',
        'Stripe billing & tiered usage metering',
      ],
      ctaText: 'Open Settings',
      ctaTarget: 'settings' as const,
    },
  };

  const current = configs[module];

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl p-8 md:p-12 shadow-xl"
      >
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
              {current.icon}
            </div>
            <div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 mb-1">
                {current.badge}
              </span>
              <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white">
                {current.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800/80 px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700">
            <Calendar className="w-3.5 h-3.5" />
            <span>Architecture Ready • Supabase + Server-side Next</span>
          </div>
        </div>

        <p className="text-base text-neutral-600 dark:text-neutral-300 leading-relaxed max-w-3xl mb-8">
          {current.description}
        </p>

        <div className="mb-10">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-4 flex items-center gap-2">
            <Layers className="w-4 h-4" />
            Engineered Capabilities on the Roadmap
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {current.milestones.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/80 dark:border-neutral-800 text-sm text-neutral-700 dark:text-neutral-300"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span className="leading-snug">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/15 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Database className="w-5 h-5 text-amber-500" />
            <div className="text-xs text-neutral-600 dark:text-neutral-300">
              <span className="font-semibold text-neutral-900 dark:text-white">Clean Contract & TypeScript Schema Defined:</span> Backend route interfaces and types are fully documented in <code className="text-amber-600 dark:text-amber-400 font-mono">docs/ARCHITECTURE.md</code>.
            </div>
          </div>

          <button
            onClick={() => setCurrentRoute(current.ctaTarget)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-950 text-sm font-semibold transition-colors shadow-sm"
          >
            <span>{current.ctaText}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};

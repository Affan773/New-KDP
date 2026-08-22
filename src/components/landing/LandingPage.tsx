import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Sparkles,
  BookOpen,
  Grid3X3,
  Palette,
  FileText,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Sliders,
  Layers,
  Zap,
  Download,
  Printer,
  Compass,
  Cpu,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  LayoutTemplate,
  Check,
  Star,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const LandingPage: React.FC = () => {
  const { setCurrentRoute, setIsNewBookWizardOpen } = useApp();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Are the interiors created here compliant with Amazon KDP print requirements?',
      a: 'Yes! KDP Book & Puzzle Studio is engineered around Amazon KDP manufacturing guidelines. It provides automated calculations for spine width based on page count and paper type (white, cream, or color), calculates trim bleed (0.125"), and enforces safety margin boundaries so your text and puzzles never get cut off.',
    },
    {
      q: 'Can I generate puzzles like Word Searches, Sudokus, and Mazes?',
      a: 'Absolutely. The platform includes a dedicated Puzzle Center architecture supporting 8 puzzle archetypes (Word Search, Sudoku, Crosswords, Mazes, Cryptograms, Word Scramble, Number Puzzles, and Logic Grids) with custom difficulties and solution keys.',
    },
    {
      q: 'Do I own the commercial rights to books created in KDP Studio?',
      a: 'Yes, 100%. All original layouts, customized interiors, puzzle grids, and book documents created in the studio are your commercial property to publish and sell on Amazon KDP, Etsy, IngramSpark, or direct printable PDF shops.',
    },
    {
      q: 'How does data storage work in this phase?',
      a: 'In Phase 1, all your projects, pages, assets, and custom settings are stored safely in your browser via local persistence and IndexedDB with automatic autosave. The architecture is PostgreSQL and Supabase-ready for seamless multi-device cloud synchronization in upcoming phases.',
    },
    {
      q: 'Can I import my own custom illustrations, vectors, and fonts?',
      a: 'Yes, the Asset Library allows you to organize personal illustrations, background textures, SVG icons, and decorative borders to place directly on any page canvas.',
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-neutral-950/80 border-b border-neutral-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-neutral-950 font-display font-extrabold text-lg shadow-lg shadow-amber-500/20">
              KDP
            </div>
            <div>
              <span className="font-display font-bold text-lg text-white tracking-tight">
                Book & Puzzle Studio
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
                SaaS v1.0
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#workflow" className="hover:text-white transition-colors">Workflow</a>
            <a href="#puzzles" className="hover:text-white transition-colors">Puzzles</a>
            <a href="#templates" className="hover:text-white transition-colors">Templates</a>
            <a href="#kdp" className="hover:text-white transition-colors">KDP Specs</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentRoute('dashboard')}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-sm transition-all shadow-lg shadow-amber-500/20 active:scale-95 flex items-center gap-2"
            >
              <span>Launch Studio</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* SECTION 1: HERO */}
      <section className="relative pt-24 pb-20 md:pt-32 md:pb-28 overflow-hidden">
        {/* Background Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[350px] h-[350px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 text-xs font-semibold text-amber-400 mb-8 shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Next-Generation Amazon KDP Publishing Engine</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-5xl mx-auto leading-[1.1] font-display">
              Create Profitable <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500">Puzzle, Coloring & Activity Books</span> in Minutes
            </h1>

            <p className="mt-8 text-lg sm:text-xl text-neutral-400 max-w-3xl mx-auto leading-relaxed">
              An all-in-one professional creator platform for designing Amazon KDP puzzle books, journals, planners, and printable interiors with exact trim sizes, bleed math, and page layouts.
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={() => {
                  setCurrentRoute('dashboard');
                }}
                className="px-8 py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-base transition-all shadow-xl shadow-amber-500/25 hover:shadow-amber-500/35 active:scale-95 flex items-center gap-3"
              >
                <span>Open Creator Studio</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              <button
                onClick={() => {
                  setIsNewBookWizardOpen(true);
                  setCurrentRoute('projects');
                }}
                className="px-8 py-4 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-white font-semibold text-base transition-all active:scale-95 flex items-center gap-2"
              >
                <Sliders className="w-5 h-5 text-amber-400" />
                <span>Start New Book Wizard</span>
              </button>
            </div>

            {/* Quick trust metrics */}
            <div className="mt-14 pt-10 border-t border-neutral-900 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto text-left">
              <div className="p-4 rounded-2xl bg-neutral-900/50 border border-neutral-800/60">
                <div className="text-2xl font-bold font-display text-white">8+</div>
                <div className="text-xs text-neutral-400 mt-1">Puzzle Archetypes</div>
              </div>
              <div className="p-4 rounded-2xl bg-neutral-900/50 border border-neutral-800/60">
                <div className="text-2xl font-bold font-display text-white">100%</div>
                <div className="text-xs text-neutral-400 mt-1">KDP Compliant Trims</div>
              </div>
              <div className="p-4 rounded-2xl bg-neutral-900/50 border border-neutral-800/60">
                <div className="text-2xl font-bold font-display text-white">300 DPI</div>
                <div className="text-xs text-neutral-400 mt-1">Print Vector Precision</div>
              </div>
              <div className="p-4 rounded-2xl bg-neutral-900/50 border border-neutral-800/60">
                <div className="text-2xl font-bold font-display text-white">Zero Cloud Lock</div>
                <div className="text-xs text-neutral-400 mt-1">Offline Safe Persistence</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* SECTION 2: MAIN FEATURES */}
      <section id="features" className="py-24 bg-neutral-900/50 border-y border-neutral-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Core Architecture</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mt-2 font-display">
              Engineered Specifically for High-Volume KDP Publishers
            </h2>
            <p className="text-neutral-400 mt-4 text-base">
              Say goodbye to juggling generic graphic design tools. Build complete book interiors with page-aware pagination, spine math, and puzzle generators.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3 font-display">Multi-Page Book Engine</h3>
              <p className="text-neutral-400 text-sm leading-relaxed">
                Seamlessly manage 24 to 800+ pages. Duplicate page spreads, reorder interior chapters, and edit elements with precision coordinate alignment.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Grid3X3 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3 font-display">Integrated Puzzle Generators</h3>
              <p className="text-neutral-400 text-sm leading-relaxed">
                Generate Word Searches, Sudokus, Crosswords, Mazes, Cryptograms, and Logic puzzles with automated solution keys placed at the back of the book.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3 font-display">Amazon KDP Pre-Flight Guard</h3>
              <p className="text-neutral-400 text-sm leading-relaxed">
                Real-time safety margin calculators verify inside gutter space, bleed overflows, minimum font legibility, and cover spine calculations before export.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: BOOK CREATION WORKFLOW */}
      <section id="workflow" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Streamlined Process</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mt-2 font-display">
              From Blank Idea to KDP Upload in 4 Steps
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                step: '01',
                title: 'Configure Trim & Bleed',
                desc: 'Pick your Amazon trim size (6x9, 8.5x11, 8x10), orientation, page count, and gutter margins using the multi-step wizard.',
              },
              {
                step: '02',
                title: 'Generate Content',
                desc: 'Add puzzle grids, apply high-converting planner templates, insert dot grids, or compose coloring book pages.',
              },
              {
                step: '03',
                title: 'Design & Style Interior',
                desc: 'Use the visual editor to customize headers, add page numbers, tweak typography, and layer decorative borders.',
              },
              {
                step: '04',
                title: 'Verify & Export',
                desc: 'Run the automated KDP compliance check to confirm margins, calculate spine cover width, and export for production.',
              },
            ].map((item, idx) => (
              <div key={idx} className="p-6 rounded-3xl bg-neutral-900/60 border border-neutral-800 relative">
                <div className="font-mono text-3xl font-extrabold text-amber-500/40 mb-4">{item.step}</div>
                <h3 className="text-lg font-bold text-white mb-2 font-display">{item.title}</h3>
                <p className="text-neutral-400 text-xs leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4: PUZZLE CREATION PREVIEW */}
      <section id="puzzles" className="py-24 bg-neutral-900/40 border-y border-neutral-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Puzzle Center</span>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mt-2 mb-6 font-display">
                Built-in Generators for Top-Selling Puzzle Categories
              </h2>
              <p className="text-neutral-400 text-sm leading-relaxed mb-8">
                Create engaging puzzle books that buyers love. From large-print Word Searches for seniors to challenging 9x9 Sudokus and adventure mazes for kids.
              </p>

              <div className="grid grid-cols-2 gap-4">
                {[
                  'Word Search 15x15 & 20x20',
                  'Classic Symmetrical Sudoku',
                  'Clue-Numbered Crosswords',
                  'Algorithmic Path Mazes',
                  'Letter-Cipher Cryptograms',
                  'Vocabulary Word Scramble',
                  'Math Number Grids',
                  'Deductive Logic Grids',
                ].map((puz, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-neutral-300">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{puz}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <button
                  onClick={() => setCurrentRoute('puzzles')}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-sm transition-all"
                >
                  <span>Explore Puzzle Center</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 w-full max-w-lg p-6 rounded-3xl bg-neutral-900 border border-neutral-800 shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-neutral-800 mb-4">
                <div className="flex items-center gap-2">
                  <Grid3X3 className="w-5 h-5 text-amber-400" />
                  <span className="font-bold text-sm text-white">Word Search Generator Preview</span>
                </div>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400">15 × 15 Grid</span>
              </div>
              <div className="p-4 rounded-2xl bg-neutral-950 font-mono text-xs text-neutral-300 leading-relaxed tracking-widest text-center border border-neutral-800">
                P U Z Z L E • W I L D L I F E<br /><br />
                S A F A R I L I O N Z<br />
                E L E P H A N T G E E<br />
                C H E E T A H B I B B<br />
                K A N G A R O O R R R<br />
                M E E R K A T P A A A<br />
                G I R A F F E H F F F<br />
              </div>
              <div className="mt-4 text-xs text-neutral-400 flex items-center justify-between">
                <span>12 Words Placed • 100% Unique</span>
                <span className="text-emerald-400 font-semibold">Solution Key Generated</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: TEMPLATES SECTION */}
      <section id="templates" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Ready-To-Publish Interiors</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mt-2 font-display">
              Original, Beautifully Formatted Templates
            </h2>
            <p className="text-neutral-400 mt-4 text-sm">
              Launch books faster with tested interior templates for planners, dot grid journals, coloring books, and activity interiors.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'Classic Word Search 15x15',
                category: 'Puzzle Books',
                size: '6" × 9" • 60 Pages',
                img: 'https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?w=400&auto=format&fit=crop&q=80',
              },
              {
                title: 'Minimalist Daily Focus Planner',
                category: 'Planners',
                size: '8.5" × 11" • 100 Pages',
                img: 'https://images.unsplash.com/photo-1506784365847-bbad939e9335?w=400&auto=format&fit=crop&q=80',
              },
              {
                title: 'Dot Grid Creative Journal 5mm',
                category: 'Journals',
                size: '6" × 9" • 120 Pages',
                img: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop&q=80',
              },
            ].map((tmpl, idx) => (
              <div key={idx} className="rounded-3xl bg-neutral-900 border border-neutral-800 overflow-hidden hover:border-neutral-700 transition-all">
                <img src={tmpl.img} alt={tmpl.title} className="w-full h-48 object-cover opacity-80" />
                <div className="p-6">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-amber-400 font-semibold">{tmpl.category}</span>
                    <span className="text-neutral-500 font-mono">{tmpl.size}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-4">{tmpl.title}</h3>
                  <button
                    onClick={() => setCurrentRoute('templates')}
                    className="w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <LayoutTemplate className="w-4 h-4 text-amber-400" />
                    <span>Use Template</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 6 & 7: AI & PDF WORKFLOW PREVIEW */}
      <section className="py-24 bg-neutral-900/50 border-y border-neutral-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* AI Preview */}
            <div className="p-8 rounded-3xl bg-neutral-900 border border-neutral-800">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-mono text-amber-400 font-bold uppercase">Phase 2 Roadmap</span>
                  <h3 className="text-xl font-bold text-white font-display">AI Thematic Generator</h3>
                </div>
              </div>
              <p className="text-neutral-400 text-sm leading-relaxed mb-6">
                Automated word bank creation, themed vocabulary clustering, and metadata optimization powered by Gemini server-side orchestration.
              </p>
              <div className="p-4 rounded-2xl bg-neutral-950 text-xs font-mono text-neutral-400 border border-neutral-800">
                &gt; Theme: "Deep Ocean Explorations"<br />
                &gt; Generating 15 categorized sub-puzzles...<br />
                &gt; Difficulty: Hard (Diagonal + Backwards)<br />
                <span className="text-emerald-400">&gt; Ready for insertion into Book Canvas</span>
              </div>
            </div>

            {/* PDF Preview */}
            <div className="p-8 rounded-3xl bg-neutral-900 border border-neutral-800">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400">
                  <Printer className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-mono text-blue-400 font-bold uppercase">Print Pipeline</span>
                  <h3 className="text-xl font-bold text-white font-display">300 DPI PDF Engine</h3>
                </div>
              </div>
              <p className="text-neutral-400 text-sm leading-relaxed mb-6">
                Direct export to Amazon KDP compliant PDF/X format with embedded font subsets, CMYK ink separation, and exact bleed calculations.
              </p>
              <div className="p-4 rounded-2xl bg-neutral-950 text-xs font-mono text-neutral-400 border border-neutral-800">
                &gt; Resolution: 300 DPI (Lossless Vector)<br />
                &gt; Color Space: Grayscale / CMYK Print<br />
                &gt; Bleed: +0.125" Top/Bottom/Outside<br />
                <span className="text-emerald-400">&gt; KDP Pre-Flight Status: PASSED</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 8: KDP WORKFLOW & CALCULATIONS */}
      <section id="kdp" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Precision Mathematics</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mt-2 font-display">
              Amazon KDP Spine & Margin Calculator
            </h2>
            <p className="text-neutral-400 mt-4 text-sm">
              Never get an interior rejected by KDP again. Real-time formulas adjust gutter margins and paperback cover wraps dynamically.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-neutral-900 border border-neutral-800 text-center">
              <div className="text-3xl font-extrabold font-mono text-amber-400 mb-2">0.002252"</div>
              <div className="text-sm font-bold text-white mb-1">White Paper Spine Multiplier</div>
              <p className="text-xs text-neutral-400">Page Count × 0.002252" = Exact Spine Thickness</p>
            </div>

            <div className="p-6 rounded-3xl bg-neutral-900 border border-neutral-800 text-center">
              <div className="text-3xl font-extrabold font-mono text-amber-400 mb-2">0.125"</div>
              <div className="text-sm font-bold text-white mb-1">Standard Print Bleed</div>
              <p className="text-xs text-neutral-400">Added to Top, Bottom & Outside trim dimensions</p>
            </div>

            <div className="p-6 rounded-3xl bg-neutral-900 border border-neutral-800 text-center">
              <div className="text-3xl font-extrabold font-mono text-amber-400 mb-2">0.625"</div>
              <div className="text-sm font-bold text-white mb-1">Gutter Safety Margin</div>
              <p className="text-xs text-neutral-400">Prevents text loss inside book spine binding</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 9: FAQ */}
      <section id="faq" className="py-24 bg-neutral-900/40 border-t border-neutral-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Questions & Answers</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mt-2 font-display">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl bg-neutral-900 border border-neutral-800 overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-6 text-left flex items-center justify-between gap-4 font-bold text-white text-base hover:text-amber-400 transition-colors"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <ChevronUp className="w-5 h-5 text-amber-400 shrink-0" /> : <ChevronDown className="w-5 h-5 text-neutral-500 shrink-0" />}
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-6 text-sm text-neutral-400 leading-relaxed border-t border-neutral-800/60 pt-4">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 10: CTA */}
      <section className="py-24 relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="p-12 sm:p-16 rounded-3xl bg-gradient-to-b from-neutral-900 to-neutral-950 border border-neutral-800 shadow-2xl relative">
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white font-display">
              Ready to Publish Your Next Bestseller?
            </h2>
            <p className="mt-6 text-base sm:text-lg text-neutral-400 max-w-2xl mx-auto leading-relaxed">
              Launch the studio now to design KDP-ready puzzle books, coloring books, journals, and planners with zero friction.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={() => setCurrentRoute('dashboard')}
                className="px-8 py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-base transition-all shadow-xl shadow-amber-500/25 active:scale-95 flex items-center gap-3"
              >
                <span>Launch Creator Studio</span>
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentRoute('templates')}
                className="px-8 py-4 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-base transition-all"
              >
                <span>Browse Free Templates</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 11: FOOTER */}
      <footer className="py-12 border-t border-neutral-900 text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center text-neutral-950 font-bold font-display text-xs">
              KDP
            </div>
            <span className="font-semibold text-neutral-400">KDP Book & Puzzle Studio</span>
            <span>• Original Creator SaaS Foundation</span>
          </div>

          <div className="flex items-center gap-6">
            <button onClick={() => setCurrentRoute('dashboard')} className="hover:text-neutral-300 transition-colors">
              Dashboard
            </button>
            <button onClick={() => setCurrentRoute('templates')} className="hover:text-neutral-300 transition-colors">
              Templates
            </button>
            <button onClick={() => setCurrentRoute('help')} className="hover:text-neutral-300 transition-colors">
              KDP Guide
            </button>
            <button onClick={() => setCurrentRoute('settings')} className="hover:text-neutral-300 transition-colors">
              Settings
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

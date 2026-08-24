import React, { useState } from 'react';
import { X, Plus, BookOpen, DollarSign, Star, FileText, CheckCircle2 } from 'lucide-react';
import { KdpCompetitor } from '../../types/niche';
import { KdpCompetitorService } from '../../services/kdpCompetitorService';

interface KdpManualCompetitorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (competitor: KdpCompetitor) => void;
  nicheHint?: string;
}

export const KdpManualCompetitorModal: React.FC<KdpManualCompetitorModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  nicheHint = '',
}) => {
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [author, setAuthor] = useState('');
  const [asin, setAsin] = useState('');
  const [isbn, setIsbn] = useState('');
  const [url, setUrl] = useState('');
  const [format, setFormat] = useState('Paperback (8.5 × 11 in)');
  const [pageCount, setPageCount] = useState('100');
  const [puzzleCount, setPuzzleCount] = useState('80');
  const [price, setPrice] = useState('8.99');
  const [rating, setRating] = useState('4.5');
  const [reviewCount, setReviewCount] = useState('120');
  const [category, setCategory] = useState('Word Search Puzzles');
  const [uniqueFeatureText, setUniqueFeatureText] = useState('Large Print, Full Solutions, 80 Puzzles');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const uniqueFeatures = uniqueFeatureText
      .split(',')
      .map(f => f.trim())
      .filter(Boolean);

    const comp = KdpCompetitorService.createManualCompetitor({
      title: title.trim(),
      subtitle: subtitle.trim() || undefined,
      author: author.trim() || 'Independent Author',
      asin: asin.trim() || undefined,
      isbn: isbn.trim() || undefined,
      url: url.trim() || undefined,
      format,
      pageCount: pageCount ? parseInt(pageCount, 10) : null,
      puzzleCount: puzzleCount ? parseInt(puzzleCount, 10) : null,
      price: price ? parseFloat(price) : null,
      rating: rating ? parseFloat(rating) : null,
      reviewCount: reviewCount ? parseInt(reviewCount, 10) : null,
      category: category.trim() || undefined,
      uniqueFeatures,
      notes: notes.trim() || undefined,
    });

    onAdd(comp);
    onClose();
    // Reset form
    setTitle('');
    setSubtitle('');
    setAuthor('');
    setAsin('');
    setIsbn('');
    setUrl('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-white font-display">
                Add Competitor Listing Manually
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Marked transparently as <span className="font-semibold text-amber-600 dark:text-amber-400">User Provided</span> in comparisons & reports.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Book Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder={`e.g. ${nicheHint || 'Classic Cars'} Large Print Word Search`}
                className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Subtitle
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={e => setSubtitle(e.target.value)}
                placeholder="e.g. 100 Themed Puzzles for Adults with Answers"
                className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Author / Pen Name
              </label>
              <input
                type="text"
                value={author}
                onChange={e => setAuthor(e.target.value)}
                placeholder="e.g. Heritage Press"
                className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                ASIN or ISBN (Optional)
              </label>
              <input
                type="text"
                value={asin}
                onChange={e => setAsin(e.target.value)}
                placeholder="e.g. B09X123ABC"
                className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none uppercase"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Trim Size & Format
              </label>
              <select
                value={format}
                onChange={e => setFormat(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                <option value="Paperback (8.5 × 11 in)">Paperback (8.5 × 11 in)</option>
                <option value="Paperback (6 × 9 in)">Paperback (6 × 9 in)</option>
                <option value="Paperback (7 × 10 in)">Paperback (7 × 10 in)</option>
                <option value="Hardcover (8.5 × 11 in)">Hardcover (8.5 × 11 in)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                List Price ($ USD)
              </label>
              <input
                type="number"
                step="0.01"
                value={price}
                onChange={e => setPrice(e.target.value)}
                placeholder="8.99"
                className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Total Pages
              </label>
              <input
                type="number"
                value={pageCount}
                onChange={e => setPageCount(e.target.value)}
                placeholder="100"
                className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Total Puzzles
              </label>
              <input
                type="number"
                value={puzzleCount}
                onChange={e => setPuzzleCount(e.target.value)}
                placeholder="80"
                className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Star Rating (0.0 – 5.0)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="5"
                value={rating}
                onChange={e => setRating(e.target.value)}
                placeholder="4.6"
                className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Review Count
              </label>
              <input
                type="number"
                value={reviewCount}
                onChange={e => setReviewCount(e.target.value)}
                placeholder="150"
                className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Key Features / USPs (comma-separated)
              </label>
              <input
                type="text"
                value={uniqueFeatureText}
                onChange={e => setUniqueFeatureText(e.target.value)}
                placeholder="Large Print, 100 Puzzles, High Contrast, Solutions Included"
                className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Public Amazon URL (Optional)
              </label>
              <input
                type="url"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://amazon.com/dp/B09X123ABC"
                className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold shadow-md shadow-amber-500/20 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Competitor
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

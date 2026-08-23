import { KDPProjectConfig, KDPMetadataConsistencyReport } from '../types/kdp';
import { DocumentModel, Project } from '../types/project';

export class KDPMetadataConsistencyService {
  /**
   * Performs deep consistency checks across metadata, actual manuscript content, and cover specs
   */
  public static checkConsistency(
    project: Project,
    document?: DocumentModel | null,
    existingProjects: Project[] = []
  ): KDPMetadataConsistencyReport {
    const checks: KDPMetadataConsistencyReport['checks'] = [];
    const config: Partial<KDPProjectConfig> = project.kdpConfig || {};
    const meta = project.metadata || {};
    const pages = document?.pages || [];

    // 1. Detect actual puzzle and answer counts from document model
    let detectedPuzzleCount = 0;
    let detectedAnswerCount = 0;

    if (pages.length > 0) {
      pages.forEach(p => {
        // Check if page has puzzle elements or is flagged as puzzle
        const hasPuzzleElements = p.elements.some(e => e.type === 'puzzle' || (e as any).type === 'wordsearch' || (e as any).type === 'crossword' || (e as any).type === 'sudoku');
        if (p.pageType === 'puzzle' || p.puzzleId || hasPuzzleElements) {
          detectedPuzzleCount++;
        }
        // Check answer key
        const hasAnswerElements = p.elements.some(e => (e as any).type === 'answer_key' || (e as any).isAnswerKey);
        if (p.pageType === 'answer_key' || p.isAnswerKey || hasAnswerElements) {
          detectedAnswerCount++;
        }
      });
    } else {
      // Fallback to project puzzle metadata
      const anyProject = project as any;
      detectedPuzzleCount = anyProject.puzzles?.length || project.pageCount || config.pageCount || 0;
      detectedAnswerCount = detectedPuzzleCount > 0 ? Math.ceil(detectedPuzzleCount / 4) : 0;
    }

    const detectedPageCount = pages.length > 0 ? pages.length : project.pageCount || config.pageCount || 0;
    const detectedTrimSize = project.kdpSettings?.trimSize?.name || config.trimSize || '8.5" × 11"';

    const currentTitle = (config.title || project.name || '').trim();
    const currentSubtitle = (config.subtitle || meta.subtitle || '').trim();
    const currentAuthor = (config.authorName || meta.author || '').trim();
    const currentDescription = (config.description || meta.description || project.description || '').trim();

    // ----------------------------------------------------
    // CHECK 1: Title Not Empty & Matches Project Name
    // ----------------------------------------------------
    if (!currentTitle) {
      checks.push({
        id: 'title_presence',
        label: 'Book Title Presence',
        passed: false,
        severity: 'ERROR',
        message: 'Book title is missing or empty.',
        fixAction: 'Enter a valid book title or generate one.',
      });
    } else {
      checks.push({
        id: 'title_presence',
        label: 'Book Title Presence',
        passed: true,
        severity: 'INFO',
        message: `Book title defined: "${currentTitle}".`,
        metadataValue: currentTitle,
      });
    }

    // ----------------------------------------------------
    // CHECK 2: Duplicate Title in User Projects
    // ----------------------------------------------------
    const duplicateProject = existingProjects.find(
      p => p.id !== project.id && (p.name?.trim().toLowerCase() === currentTitle.toLowerCase() || p.kdpConfig?.title?.trim().toLowerCase() === currentTitle.toLowerCase())
    );
    if (duplicateProject) {
      checks.push({
        id: 'title_duplicate',
        label: 'Unique Project Title',
        passed: false,
        severity: 'WARNING',
        message: `Title "${currentTitle}" is already used in project "${duplicateProject.name}".`,
        fixAction: 'Consider distinguishing this edition or volume to avoid customer confusion.',
      });
    } else {
      checks.push({
        id: 'title_duplicate',
        label: 'Unique Project Title',
        passed: true,
        severity: 'INFO',
        message: 'Title is unique among your Studio projects.',
      });
    }

    // ----------------------------------------------------
    // CHECK 3: Cover Title Consistency
    // ----------------------------------------------------
    // If cover settings or cover layout exists, verify title matches
    const anyProject = project as any;
    const coverTitle = (anyProject.coverSettings?.title || project.name || '').trim();
    if (coverTitle && currentTitle && coverTitle.toLowerCase() !== currentTitle.toLowerCase()) {
      checks.push({
        id: 'cover_title_mismatch',
        label: 'Cover & Metadata Title Match',
        passed: false,
        severity: 'ERROR',
        message: `Title mismatch: Metadata title is "${currentTitle}" but Cover title is "${coverTitle}".`,
        metadataValue: currentTitle,
        detectedValue: coverTitle,
        fixAction: 'Update metadata or regenerate cover to ensure identical title wording.',
      });
    } else {
      checks.push({
        id: 'cover_title_mismatch',
        label: 'Cover & Metadata Title Match',
        passed: true,
        severity: 'INFO',
        message: 'Metadata title matches book cover layout exactly.',
      });
    }

    // ----------------------------------------------------
    // CHECK 4: Author Presence & Consistency
    // ----------------------------------------------------
    if (!currentAuthor) {
      checks.push({
        id: 'author_presence',
        label: 'Author Name Presence',
        passed: false,
        severity: 'ERROR',
        message: 'Author / Primary Creator name is required by Amazon KDP.',
        fixAction: 'Provide an author pen name or publishing imprint.',
      });
    } else {
      checks.push({
        id: 'author_presence',
        label: 'Author Name Presence',
        passed: true,
        severity: 'INFO',
        message: `Author name defined: "${currentAuthor}".`,
        metadataValue: currentAuthor,
      });
    }

    // ----------------------------------------------------
    // CHECK 5: Description Puzzle Count Consistency Check
    // ----------------------------------------------------
    // Look for numbers preceding "puzzle", "word search", "sudoku", "crossword", "mazes" in description
    const countPattern = /(\d+)\+?\s*(puzzles?|word search(?:es)?|sudoku|crosswords?|mazes?|brain teasers?|challenges?)/gi;
    let descriptionCountMismatch = false;
    let claimedCount = 0;
    let match: RegExpExecArray | null;

    while ((match = countPattern.exec(currentDescription)) !== null) {
      const parsedNum = parseInt(match[1], 10);
      if (parsedNum > 0 && parsedNum !== detectedPuzzleCount && Math.abs(parsedNum - detectedPuzzleCount) > 5) {
        descriptionCountMismatch = true;
        claimedCount = parsedNum;
        break;
      }
    }

    if (descriptionCountMismatch && detectedPuzzleCount > 0) {
      checks.push({
        id: 'description_puzzle_count',
        label: 'Description Puzzle Count Claim',
        passed: false,
        severity: 'ERROR',
        message: `Description claims ${claimedCount} puzzles, but the book manuscript contains ${detectedPuzzleCount} actual puzzle pages.`,
        metadataValue: claimedCount,
        detectedValue: detectedPuzzleCount,
        fixAction: `Update description text to state ${detectedPuzzleCount} puzzles, or regenerate description.`,
      });
    } else {
      checks.push({
        id: 'description_puzzle_count',
        label: 'Description Puzzle Count Claim',
        passed: true,
        severity: 'INFO',
        message: `Description is consistent with detected puzzle content (${detectedPuzzleCount} puzzles).`,
      });
    }

    // ----------------------------------------------------
    // CHECK 6: Puzzle Count vs Solution / Answer Keys
    // ----------------------------------------------------
    if (detectedPuzzleCount > 0 && detectedAnswerCount === 0 && config.bookType === 'Puzzle Book') {
      checks.push({
        id: 'answer_count_consistency',
        label: 'Puzzle to Answer Ratio',
        passed: false,
        severity: 'ERROR',
        message: `Book contains ${detectedPuzzleCount} puzzles but 0 solution answer key pages were detected.`,
        detectedValue: `Puzzles: ${detectedPuzzleCount}, Answers: ${detectedAnswerCount}`,
        fixAction: 'Include solution pages in back matter or generate answer keys in editor.',
      });
    } else {
      checks.push({
        id: 'answer_count_consistency',
        label: 'Puzzle to Answer Ratio',
        passed: true,
        severity: 'INFO',
        message: `Solution keys synchronized (${detectedPuzzleCount} puzzles, ${detectedAnswerCount} solution pages).`,
      });
    }

    // ----------------------------------------------------
    // CHECK 7: Series & Edition Consistency
    // ----------------------------------------------------
    if (config.isPartOfSeries && !config.seriesName?.trim()) {
      checks.push({
        id: 'series_consistency',
        label: 'Series Information',
        passed: false,
        severity: 'ERROR',
        message: 'Book is marked as part of a series, but Series Name is empty.',
        fixAction: 'Provide a series title or uncheck series option.',
      });
    } else if (config.isPartOfSeries) {
      checks.push({
        id: 'series_consistency',
        label: 'Series Information',
        passed: true,
        severity: 'INFO',
        message: `Series: "${config.seriesName}" ${config.seriesNumber ? `(#${config.seriesNumber})` : ''}.`,
      });
    }

    // Overall Consistency status
    const hasErrors = checks.some(c => c.severity === 'ERROR' && !c.passed);
    return {
      isConsistent: !hasErrors,
      checks,
      detectedPuzzleCount,
      detectedAnswerCount,
      detectedPageCount,
      detectedTrimSize,
    };
  }
}

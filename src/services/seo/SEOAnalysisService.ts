import {
  KdpDescriptionSeoAnalysis,
  KdpOneClickSeoProposal,
  KdpSeoKeyword,
  KdpTitleSeoAnalysis,
} from '../../types/seo';
import { Project } from '../../types/project';
import { KeywordOptimizationService } from './KeywordOptimizationService';

export class SEOAnalysisService {
  /**
   * Analyzes Title & Subtitle for KDP search discoverability, readability, and policy safety
   */
  public static analyzeTitle(params: {
    title: string;
    subtitle: string;
    targetKeywords?: string[];
    project?: Project | null;
  }): KdpTitleSeoAnalysis {
    const title = params.title.trim();
    const subtitle = params.subtitle.trim();
    const totalChars = title.length + (subtitle ? subtitle.length + 3 : 0);

    const titleWords = title.toLowerCase().split(/\s+/).filter(Boolean);
    const subtitleWords = subtitle.toLowerCase().split(/\s+/).filter(Boolean);

    // Over-optimization & repetition check
    const warnings: string[] = [];
    const detectedKeywords: string[] = [];
    const wordCounts = new Map<string, number>();

    [...titleWords, ...subtitleWords].forEach(w => {
      if (w.length > 3) {
        wordCounts.set(w, (wordCounts.get(w) || 0) + 1);
      }
    });

    wordCounts.forEach((count, word) => {
      if (count >= 3) {
        warnings.push(`Keyword stuffing risk: Word "${word}" is repeated ${count} times in title/subtitle.`);
      }
    });

    if (totalChars > 200) {
      warnings.push(`Total title + subtitle length (${totalChars} chars) exceeds Amazon 200-character ceiling.`);
    }

    if (title.length > 100) {
      warnings.push('Main title is unusually long. Keep main titles concise and move descriptive phrases into the subtitle.');
    }

    // Check presence of keywords
    if (params.targetKeywords) {
      for (const kw of params.targetKeywords.slice(0, 8)) {
        if (title.toLowerCase().includes(kw.toLowerCase()) || subtitle.toLowerCase().includes(kw.toLowerCase())) {
          detectedKeywords.push(kw);
        }
      }
    }

    // Calculate Readability & Relevance scores
    const readability = Math.max(30, Math.min(100, 100 - (warnings.length * 15) - (totalChars > 160 ? 10 : 0)));
    const relevance = detectedKeywords.length > 0 ? Math.min(100, 70 + detectedKeywords.length * 8) : 65;

    let placement: 'Optimal' | 'Acceptable' | 'Needs Improvement' = 'Optimal';
    if (warnings.length > 0 || totalChars > 190) placement = 'Needs Improvement';
    else if (titleWords.length > 10) placement = 'Acceptable';

    const overall = Math.round(readability * 0.45 + relevance * 0.55);

    // Suggestions
    const suggestions: KdpTitleSeoAnalysis['suggestions'] = [
      {
        title: title || 'Relaxing Puzzle Book',
        subtitle: `${params.project?.metadata?.targetAudience || 'Adults'} Edition: 100+ Brain Games with Clear Print & Full Solutions`,
        reason: 'Balances reader clarity with high-converting search terms without unnatural stuffing.',
        focus: 'Readability & Search',
      },
      {
        title: title || 'The Ultimate Brain Workout',
        subtitle: `Large Print Puzzles for Seniors & Adults: Relaxing Mindfulness Activity Book`,
        reason: 'Targets key audience and format search keywords directly in the subtitle.',
        focus: 'Audience Focused',
      },
    ];

    return {
      title,
      subtitle,
      overallTitleScore: overall,
      readabilityScore: readability,
      keywordRelevanceScore: relevance,
      keywordPlacement: placement,
      characterCount: {
        title: title.length,
        subtitle: subtitle.length,
        total: totalChars,
        maxLimit: 200,
      },
      detectedKeywords,
      overOptimizationWarnings: warnings,
      suggestions,
    };
  }

  /**
   * Analyzes Book Description for formatting, keyword density, claims, and search readability
   */
  public static analyzeDescription(params: {
    description: string;
    targetKeywords?: string[];
    project?: Project | null;
  }): KdpDescriptionSeoAnalysis {
    const raw = params.description.trim();
    const words = raw.toLowerCase().split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const charCount = raw.length;

    // Detect claims & warnings
    const detectedClaims: string[] = [];
    const unsupportedClaims: string[] = [];
    const repetitionWarnings: string[] = [];

    const claimKeywords = ['#1', 'bestseller', 'guaranteed', '100% cure', 'free gift', 'cheapest'];
    claimKeywords.forEach(claim => {
      if (raw.toLowerCase().includes(claim)) {
        unsupportedClaims.push(`Contains prohibited claim: "${claim}"`);
      }
    });

    // Keyword density
    const keywordDensity: KdpDescriptionSeoAnalysis['keywordDensity'] = [];
    if (params.targetKeywords && params.targetKeywords.length > 0) {
      params.targetKeywords.slice(0, 10).forEach(kw => {
        const regex = new RegExp(`\\b${kw.toLowerCase()}\\b`, 'gi');
        const matches = raw.match(regex);
        const count = matches ? matches.length : 0;
        const density = wordCount > 0 ? ((count * kw.split(' ').length) / wordCount) * 100 : 0;
        const isOverused = density > 4.5 || count >= 6;

        if (count > 0) {
          keywordDensity.push({
            keyword: kw,
            count,
            densityPercent: Number(density.toFixed(1)),
            isOverused,
          });
        }

        if (isOverused) {
          repetitionWarnings.push(`Keyword "${kw}" occurs ${count} times (${density.toFixed(1)}% density), which may trigger search ranking penalties.`);
        }
      });
    }

    const readability = Math.max(35, Math.min(100, 100 - (unsupportedClaims.length * 20) - (repetitionWarnings.length * 10) + (wordCount >= 100 && wordCount <= 450 ? 10 : 0)));
    const relevance = keywordDensity.length >= 3 ? 90 : 70;
    const naturalFlow = Math.max(40, Math.min(100, 100 - (repetitionWarnings.length * 15)));

    const overall = Math.round(readability * 0.35 + relevance * 0.35 + naturalFlow * 0.30);

    const puzzleType = (params.project?.metadata as any)?.puzzleType || 'Word Search';
    const audience = params.project?.metadata?.targetAudience || 'Adults & Seniors';
    const theme = (params.project?.metadata as any)?.theme || 'Relaxing';

    const optimizedPreview = `Looking for an engaging and calming way to keep your mind sharp?\n\nThis premium collection of ${puzzleType} puzzles is thoughtfully designed for ${audience}. Featuring easy-to-read large print typography and carefully verified solutions, each page provides the perfect balance of relaxation and mental exercise.\n\nKey Highlights of This Book:\n• Generous, Clear Print: Eye-friendly layout tailored for comfortable solving without strain.\n• Over 100 Handcrafted Puzzles: Progressive variety from approachable warm-ups to satisfying challenges.\n• Complete Solutions Included: Full answer keys conveniently provided in the back.\n• Ideal Gift for Puzzle Lovers: Perfect for quiet afternoons, stress relief, travel, or gifting to friends and family.\n\nRediscover the joy of classic puzzle solving today!`;

    const recommendations: string[] = [];
    if (wordCount < 80) {
      recommendations.push('Description is brief. Expanding to 150–350 words improves customer conversion and keyword indexing.');
    }
    if (unsupportedClaims.length > 0) {
      recommendations.push('Remove subjective ranking and promotional claims to avoid KDP policy rejections.');
    }
    if (repetitionWarnings.length > 0) {
      recommendations.push('Reduce repetitive exact-match phrases; natural descriptive writing converts readers better.');
    }

    return {
      rawDescription: raw,
      overallDescriptionScore: overall,
      readabilityScore: readability,
      keywordRelevanceScore: relevance,
      naturalFlowScore: naturalFlow,
      wordCount,
      characterCount: charCount,
      keywordDensity,
      detectedClaims,
      unsupportedClaims,
      repetitionWarnings,
      audienceMatch: raw.toLowerCase().includes(audience.toLowerCase().split(' ')[0]),
      bookContentMatch: raw.toLowerCase().includes(puzzleType.toLowerCase()),
      optimizedDescriptionPreview: optimizedPreview,
      recommendations,
    };
  }

  /**
   * One-Click SEO Optimization Workflow
   * Generates proposed improvements for Title, Subtitle, Description, and 7 KDP Boxes.
   * STRICTLY RESPECTS USER APPROVAL: Proposals are presented for explicit Apply / Ignore review.
   */
  public static generateOneClickProposal(params: {
    project: Project | null;
    currentTitle: string;
    currentSubtitle: string;
    currentDescription: string;
    keywords: KdpSeoKeyword[];
  }): KdpOneClickSeoProposal {
    const puzzleType = (params.project?.metadata as any)?.puzzleType || 'Word Search';
    const theme = (params.project?.metadata as any)?.theme || 'Relaxing';
    const audience = params.project?.metadata?.targetAudience || 'Adults & Seniors';
    const difficulty = (params.project?.metadata as any)?.difficulty || 'Easy to Medium';

    const proposedTitle = params.currentTitle || `${theme} ${puzzleType} Puzzles`;
    const proposedSubtitle = `100+ ${difficulty} Brain Games for ${audience} with Large Print & Full Solutions`;

    const optimizedDesc = `Step away from screen glare and exercise your brain with this handcrafted collection of ${theme.toLowerCase()} ${puzzleType.toLowerCase()} puzzles.\n\nSpecifically crafted for ${audience.toLowerCase()}, every page provides clean, high-contrast typography and clear layout spacing to ensure hours of relaxing enjoyment.\n\nInside You Will Discover:\n• 100+ Themed ${puzzleType} Puzzles: Engaging themes that keep every session fresh and stimulating.\n• Large Print Format: Easy on the eyes with generous margins for comfortable writing.\n• Step-by-Step Solutions: Full answer keys included at the back of the book.\n• Perfect Gift: A thoughtful gift for puzzle enthusiasts, birthdays, and holiday relaxation.\n\nOrder your copy today and enjoy hours of relaxing mental entertainment!`;

    const sevenBoxesOpt = KeywordOptimizationService.optimizeSevenBoxes(params.keywords, params.project);
    const proposedSevenBoxes = sevenBoxesOpt.boxes.map(b => b.phrase);

    return {
      id: `prop_${Date.now()}`,
      projectId: params.project?.id || 'active',
      originalTitle: params.currentTitle,
      originalSubtitle: params.currentSubtitle,
      originalDescription: params.currentDescription,
      originalKeywords: (params.project?.metadata as any)?.keywords || [],
      proposedTitle,
      proposedSubtitle,
      proposedDescription: optimizedDesc,
      proposedSevenBoxes,
      titleRationale: 'Focuses main title on high-intent theme and puzzle category.',
      subtitleRationale: 'Combines audience, format (large print), and volume into a natural, search-friendly subtitle under 200 characters.',
      descriptionRationale: 'Restructures copy with clean bulleted benefits, audience relevance, and organic keyword coverage while removing promotional fluff.',
      keywordsRationale: 'Extracts 7 non-overlapping search phrases utilizing full character capacity without keyword repetition.',
      projectedScoreGain: 28,
      status: {
        title: 'PENDING',
        subtitle: 'PENDING',
        description: 'PENDING',
        keywords: 'PENDING',
      },
    };
  }
}

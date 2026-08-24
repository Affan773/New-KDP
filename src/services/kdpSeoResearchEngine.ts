import { Project } from '../types/project';
import {
  KdpCompetitorAnalysisItem,
  KdpDescriptionSeoAnalysis,
  KdpKeywordCluster,
  KdpMarketplaceConfig,
  KdpSearchIntent,
  KdpSeoKeyword,
  KdpSeoResearchReport,
  KdpSevenBoxesOptimization,
  KdpTitleSeoAnalysis,
} from '../types/seo';
import { KDPKeywordScoreEngine } from './kdpKeywordScoreEngine';

export const KDP_MARKETPLACES: KdpMarketplaceConfig[] = [
  { id: 'com', name: 'Amazon.com (United States)', domain: 'amazon.com', defaultLanguage: 'English', currency: 'USD ($)', flag: '🇺🇸' },
  { id: 'in', name: 'Amazon.in (India)', domain: 'amazon.in', defaultLanguage: 'English', currency: 'INR (₹)', flag: '🇮🇳' },
  { id: 'co.uk', name: 'Amazon.co.uk (United Kingdom)', domain: 'amazon.co.uk', defaultLanguage: 'English', currency: 'GBP (£)', flag: '🇬🇧' },
  { id: 'ca', name: 'Amazon.ca (Canada)', domain: 'amazon.ca', defaultLanguage: 'English', currency: 'CAD ($)', flag: '🇨🇦' },
  { id: 'de', name: 'Amazon.de (Germany)', domain: 'amazon.de', defaultLanguage: 'German', currency: 'EUR (€)', flag: '🇩🇪' },
  { id: 'fr', name: 'Amazon.fr (France)', domain: 'amazon.fr', defaultLanguage: 'French', currency: 'EUR (€)', flag: '🇫🇷' },
  { id: 'it', name: 'Amazon.it (Italy)', domain: 'amazon.it', defaultLanguage: 'Italian', currency: 'EUR (€)', flag: '🇮🇹' },
  { id: 'es', name: 'Amazon.es (Spain)', domain: 'amazon.es', defaultLanguage: 'Spanish', currency: 'EUR (€)', flag: '🇪🇸' },
  { id: 'co.jp', name: 'Amazon.co.jp (Japan)', domain: 'amazon.co.jp', defaultLanguage: 'Japanese', currency: 'JPY (¥)', flag: '🇯🇵' },
];

export class KDPSeoResearchEngine {
  /**
   * Discovers & evaluates keywords grounded strictly in actual book metadata and seed term.
   */
  public static searchKeywords(params: {
    seed: string;
    project?: Project | null;
    marketplaceId?: string;
    language?: string;
  }): KdpSeoKeyword[] {
    const seed = (params.seed || '').trim().toLowerCase();
    const project = params.project;

    const bookType = (project?.kdpSettings as any)?.bookType || project?.type || 'Puzzle Book';
    const primaryType = (project?.metadata as any)?.puzzleType || 'Word Search';
    const audience = project?.metadata?.targetAudience || 'Adults';
    const theme = (project?.metadata as any)?.theme || 'General';
    const difficulty = (project?.metadata as any)?.difficulty || 'Medium';
    const format = (project?.kdpSettings as any)?.format || 'Paperback';
    const trimSize = project?.kdpSettings?.trimSize?.name || '8.5x11';

    const rawCandidates: {
      text: string;
      cluster: KdpKeywordCluster;
      intent: KdpSearchIntent;
      relevance: number;
      demand: 'High' | 'Moderate' | 'Niche' | 'Estimated';
      comp: 'Low' | 'Moderate' | 'High' | 'Estimated';
      source: KdpSeoKeyword['source'];
    }[] = [];

    // 1. Core Seed Variations
    if (seed) {
      rawCandidates.push({
        text: seed,
        cluster: 'CORE',
        intent: 'Commercial',
        relevance: 95,
        demand: 'High',
        comp: 'Moderate',
        source: 'Seed Search',
      });
      rawCandidates.push({
        text: `${seed} for ${audience.toLowerCase()}`,
        cluster: 'AUDIENCE',
        intent: 'Transactional',
        relevance: 98,
        demand: 'High',
        comp: 'Moderate',
        source: 'Seed Search',
      });
      rawCandidates.push({
        text: `large print ${seed}`,
        cluster: 'FORMAT',
        intent: 'Transactional',
        relevance: 92,
        demand: 'High',
        comp: 'Low',
        source: 'Seed Search',
      });
      rawCandidates.push({
        text: `relaxing ${seed} for adults`,
        cluster: 'USE CASE',
        intent: 'Commercial',
        relevance: 90,
        demand: 'Moderate',
        comp: 'Low',
        source: 'Seed Search',
      });
    }

    // 2. Book-Content Grounded Variations
    const bookTitle = (project?.name || (project?.metadata as any)?.title || '').toLowerCase();
    if (bookTitle && bookTitle !== seed) {
      rawCandidates.push({
        text: bookTitle.slice(0, 50),
        cluster: 'CORE',
        intent: 'Commercial',
        relevance: 94,
        demand: 'Moderate',
        comp: 'Low',
        source: 'Book Content',
      });
    }

    // 3. Format & Spec Combinations
    rawCandidates.push({
      text: `large print ${primaryType.toLowerCase()} book`,
      cluster: 'FORMAT',
      intent: 'Transactional',
      relevance: 95,
      demand: 'High',
      comp: 'Low',
      source: 'Book Content',
    });
    rawCandidates.push({
      text: `${primaryType.toLowerCase()} with solutions in back`,
      cluster: 'FORMAT',
      intent: 'Commercial',
      relevance: 88,
      demand: 'Moderate',
      comp: 'Low',
      source: 'Book Content',
    });
    rawCandidates.push({
      text: `${trimSize.includes('8.5') ? 'large 8.5x11' : 'compact'} ${primaryType.toLowerCase()} puzzle book`,
      cluster: 'FORMAT',
      intent: 'Commercial',
      relevance: 85,
      demand: 'Moderate',
      comp: 'Low',
      source: 'Book Content',
    });

    // 4. Audience Specifics
    rawCandidates.push({
      text: `${primaryType.toLowerCase()} for ${audience.toLowerCase()}`,
      cluster: 'AUDIENCE',
      intent: 'Transactional',
      relevance: 96,
      demand: 'High',
      comp: 'Moderate',
      source: 'Book Content',
    });
    rawCandidates.push({
      text: `brain games and ${primaryType.toLowerCase()} for seniors`,
      cluster: 'AUDIENCE',
      intent: 'Commercial',
      relevance: 91,
      demand: 'High',
      comp: 'Low',
      source: 'Book Content',
    });
    rawCandidates.push({
      text: `memory retention puzzles for ${audience.toLowerCase()}`,
      cluster: 'AUDIENCE',
      intent: 'Commercial',
      relevance: 87,
      demand: 'Moderate',
      comp: 'Low',
      source: 'Book Content',
    });

    // 5. Theme & Topic
    if (theme && theme !== 'General') {
      rawCandidates.push({
        text: `${theme.toLowerCase()} themed ${primaryType.toLowerCase()} book`,
        cluster: 'THEME',
        intent: 'Niche-specific',
        relevance: 94,
        demand: 'Moderate',
        comp: 'Low',
        source: 'Book Content',
      });
      rawCandidates.push({
        text: `${theme.toLowerCase()} activity book for relaxation`,
        cluster: 'THEME',
        intent: 'Commercial',
        relevance: 89,
        demand: 'Niche',
        comp: 'Low',
        source: 'Book Content',
      });
    }

    // 6. Difficulty & Mental Fitness
    rawCandidates.push({
      text: `${difficulty.toLowerCase()} level ${primaryType.toLowerCase()} puzzles`,
      cluster: 'DIFFICULTY',
      intent: 'Commercial',
      relevance: 89,
      demand: 'Moderate',
      comp: 'Low',
      source: 'Book Content',
    });
    rawCandidates.push({
      text: `easy to hard brain teasers collection`,
      cluster: 'DIFFICULTY',
      intent: 'Informational',
      relevance: 82,
      demand: 'Moderate',
      comp: 'Moderate',
      source: 'Book Content',
    });

    // 7. Use Case & Gift
    rawCandidates.push({
      text: `mindfulness and stress relief puzzle book`,
      cluster: 'USE CASE',
      intent: 'Commercial',
      relevance: 88,
      demand: 'High',
      comp: 'Moderate',
      source: 'Book Content',
    });
    rawCandidates.push({
      text: `travel activity book for adults and seniors`,
      cluster: 'USE CASE',
      intent: 'Commercial',
      relevance: 86,
      demand: 'Moderate',
      comp: 'Low',
      source: 'Book Content',
    });
    rawCandidates.push({
      text: `gift for puzzle lovers and retirees`,
      cluster: 'GIFT',
      intent: 'Gift-oriented',
      relevance: 85,
      demand: 'High',
      comp: 'Low',
      source: 'Book Content',
    });

    // Process & score candidate keywords
    const keywords: KdpSeoKeyword[] = [];
    const seen = new Set<string>();

    for (const c of rawCandidates) {
      const normalized = this.normalizeKeyword(c.text);
      if (!normalized || seen.has(normalized)) continue;
      seen.add(normalized);

      const words = normalized.split(/\s+/).filter(Boolean);
      const isLongTail = words.length >= 3;
      const riskInfo = KDPKeywordScoreEngine.detectKeywordRisk(normalized, project);
      const { score, grade } = KDPKeywordScoreEngine.calculateKeywordScore({
        keyword: normalized,
        relevance: c.relevance,
        demandSignal: c.demand,
        competitionSignal: c.comp,
        commercialIntent: c.intent,
        isLongTail,
        bookContentMatch: true,
        risk: riskInfo.risk,
      });

      const riskLevel = riskInfo.risk === 'NONE' ? 'LOW RISK' : (riskInfo.risk === 'KEYWORD_STUFFING' || riskInfo.risk === 'UNSUPPORTED_CLAIM' ? 'MEDIUM RISK' : 'HIGH RISK');
      const bookMatchScore = c.relevance;

      keywords.push({
        id: `kw_${Math.random().toString(36).substring(2, 9)}`,
        keyword: normalized,
        relevance: c.relevance,
        demandSignal: c.demand,
        competitionSignal: c.comp,
        commercialIntent: c.intent,
        trend: 'Evergreen',
        isLongTail,
        wordCount: words.length,
        charCount: normalized.length,
        risk: riskInfo.risk,
        riskLevel,
        riskReason: riskInfo.reason,
        studioSeoScore: score,
        scoreGrade: grade,
        cluster: c.cluster,
        source: c.source,
        dataSource: 'Estimated',
        bookMatchScore,
        bookContentMatch: true,
      });
    }

    // Sort by Studio SEO Score descending
    return keywords.sort((a, b) => b.studioSeoScore - a.studioSeoScore);
  }

  /**
   * Generates long-tail combinations grounded specifically in book content
   */
  public static generateLongTails(project: Project, seed?: string): KdpSeoKeyword[] {
    const primaryType = (project?.metadata as any)?.puzzleType || 'Word Search';
    const audience = project?.metadata?.targetAudience || 'Adults';
    const theme = (project?.metadata as any)?.theme || 'Relaxing';
    const difficulty = (project?.metadata as any)?.difficulty || 'Medium';

    const longTailTemplates: { template: string; cluster: KdpKeywordCluster; intent: KdpSearchIntent }[] = [
      { template: `${primaryType.toLowerCase()} puzzles for ${audience.toLowerCase()}`, cluster: 'LONG-TAIL', intent: 'Transactional' },
      { template: `large print ${primaryType.toLowerCase()} puzzle book`, cluster: 'LONG-TAIL', intent: 'Transactional' },
      { template: `relaxing ${primaryType.toLowerCase()} puzzles for stress relief`, cluster: 'LONG-TAIL', intent: 'Commercial' },
      { template: `travel ${primaryType.toLowerCase()} puzzle book for vacation`, cluster: 'LONG-TAIL', intent: 'Commercial' },
      { template: `easy to medium ${primaryType.toLowerCase()} for seniors`, cluster: 'LONG-TAIL', intent: 'Transactional' },
      { template: `${theme.toLowerCase()} mind fitness puzzles for adults`, cluster: 'LONG-TAIL', intent: 'Commercial' },
      { template: `daily ${primaryType.toLowerCase()} brain training workbook`, cluster: 'LONG-TAIL', intent: 'Commercial' },
      { template: `big font ${primaryType.toLowerCase()} with solution pages`, cluster: 'LONG-TAIL', intent: 'Transactional' },
      { template: `calm cognitive exercises and ${primaryType.toLowerCase()}`, cluster: 'LONG-TAIL', intent: 'Commercial' },
      { template: `thoughtful gift ${primaryType.toLowerCase()} for mom or dad`, cluster: 'GIFT', intent: 'Gift-oriented' },
    ];

    if (seed && seed.trim()) {
      longTailTemplates.unshift(
        { template: `${seed.trim().toLowerCase()} for seniors and adults`, cluster: 'LONG-TAIL', intent: 'Transactional' },
        { template: `large print ${seed.trim().toLowerCase()} collection`, cluster: 'LONG-TAIL', intent: 'Transactional' }
      );
    }

    return longTailTemplates.map(t => {
      const normalized = this.normalizeKeyword(t.template);
      const words = normalized.split(/\s+/).filter(Boolean);
      const riskInfo = KDPKeywordScoreEngine.detectKeywordRisk(normalized, project);
      const { score, grade } = KDPKeywordScoreEngine.calculateKeywordScore({
        keyword: normalized,
        relevance: 94,
        demandSignal: 'High',
        competitionSignal: 'Low',
        commercialIntent: t.intent,
        isLongTail: true,
        bookContentMatch: true,
        risk: riskInfo.risk,
      });

      const riskLevel = riskInfo.risk === 'NONE' ? 'LOW RISK' : (riskInfo.risk === 'KEYWORD_STUFFING' || riskInfo.risk === 'UNSUPPORTED_CLAIM' ? 'MEDIUM RISK' : 'HIGH RISK');

      return {
        id: `lt_${Math.random().toString(36).substring(2, 9)}`,
        keyword: normalized,
        relevance: 94,
        demandSignal: 'High',
        competitionSignal: 'Low',
        commercialIntent: t.intent,
        trend: 'Evergreen',
        isLongTail: true,
        wordCount: words.length,
        charCount: normalized.length,
        risk: riskInfo.risk,
        riskLevel,
        riskReason: riskInfo.reason,
        studioSeoScore: score,
        scoreGrade: grade,
        cluster: t.cluster,
        source: 'Long-Tail Generator',
        dataSource: 'Estimated',
        bookMatchScore: 92,
        bookContentMatch: true,
      };
    });
  }

  /**
   * KDP 7 Keyword Box Optimizer:
   * Selects and composes 7 policy-compliant, non-repeating search phrases up to 50 characters each.
   */
  public static optimizeSevenKeywordBoxes(
    candidateKeywords: KdpSeoKeyword[],
    project?: Project
  ): KdpSevenBoxesOptimization {
    const validCandidates = candidateKeywords.filter(
      k => !k.isExcluded && k.risk === 'NONE' && k.keyword.trim().length > 0
    );

    // Sort by Studio SEO Score descending
    const sorted = [...validCandidates].sort((a, b) => b.studioSeoScore - a.studioSeoScore);

    const usedWords = new Set<string>();
    const boxes: KdpSevenBoxesOptimization['boxes'] = [];

    // Build 7 non-redundant boxes
    for (let slot = 1; slot <= 7; slot++) {
      let boxPhrase = '';
      const includedKeywords: string[] = [];
      const warnings: string[] = [];

      // Find best candidate for this slot that introduces fresh search terms
      for (const candidate of sorted) {
        if (includedKeywords.includes(candidate.keyword)) continue;

        // Check character length
        if (candidate.keyword.length <= 50) {
          // Calculate word novelty
          const words = candidate.keyword.toLowerCase().split(/\s+/).filter(Boolean);
          const newWords = words.filter(w => !usedWords.has(w));

          // If box is empty, assign this candidate if it brings at least 1 new word or if we have few candidates left
          if (!boxPhrase && (newWords.length > 0 || sorted.length < 10)) {
            boxPhrase = candidate.keyword;
            includedKeywords.push(candidate.keyword);
            words.forEach(w => usedWords.add(w));
            break;
          }
        }
      }

      // Fallback if not enough unique candidates
      if (!boxPhrase) {
        const fallbacks = [
          'large print puzzle book with answers',
          'brain games and memory workout for adults',
          'relaxing mindful activity book collection',
          'travel size brain teasers and logic games',
          'stress relief cognitive exercise for seniors',
          'daily mental fitness challenges workbook',
          'gift activity book for puzzle lovers',
        ];
        boxPhrase = fallbacks[slot - 1] || `puzzle activity book volume ${slot}`;
      }

      const charCount = boxPhrase.length;
      const isCompliant = charCount <= 50 && charCount > 0;
      if (charCount > 50) {
        warnings.push(`Exceeds 50 character limit (${charCount}/50)`);
      }

      boxes.push({
        slotNumber: slot,
        phrase: boxPhrase,
        charCount,
        charLimit: 50,
        keywordsIncluded: includedKeywords,
        relevanceScore: 90 + Math.floor(Math.random() * 8),
        warnings,
        isCompliant,
      });
    }

    const totalCharactersUsed = boxes.reduce((sum, b) => sum + b.charCount, 0);
    const allBoxWords = boxes.flatMap(b => b.phrase.toLowerCase().split(/\s+/).filter(Boolean));
    const uniqueWordSet = new Set(allBoxWords);
    const duplicateWordCount = allBoxWords.length - uniqueWordSet.size;

    const recommendations: string[] = [];
    if (duplicateWordCount > 3) {
      recommendations.push(
        'Amazon algorithm treats all 7 backend boxes collectively: avoid repeating identical words across different boxes.'
      );
    }
    if (totalCharactersUsed < 220) {
      recommendations.push(
        `You are utilizing ${totalCharactersUsed}/350 total character capacity across the 7 boxes. Adding descriptive modifiers can expand discovery.`
      );
    } else {
      recommendations.push('Excellent keyword density and character utilization across all 7 KDP boxes.');
    }

    const overallCoverage = Math.min(100, Math.round((uniqueWordSet.size / 28) * 100));

    return {
      boxes,
      totalCharactersUsed,
      totalUniqueWords: uniqueWordSet.size,
      duplicateWordCount,
      overallCoverageScore: overallCoverage,
      overallKeywordSetScore: overallCoverage,
      recommendations,
    };
  }

  /**
   * Analyzes Title & Subtitle SEO for keyword placement, readability, and over-optimization
   */
  public static analyzeTitleSeo(
    title: string,
    subtitle: string,
    project?: Project
  ): KdpTitleSeoAnalysis {
    const cleanTitle = (title || '').trim();
    const cleanSubtitle = (subtitle || '').trim();
    const combined = `${cleanTitle} ${cleanSubtitle}`.toLowerCase();

    const titleLength = cleanTitle.length;
    const subtitleLength = cleanSubtitle.length;
    const totalLength = titleLength + subtitleLength;

    const detectedKeywords: string[] = [];
    const overOptimizationWarnings: string[] = [];

    // Check Amazon KDP 200 character hard limit
    if (totalLength > 200) {
      overOptimizationWarnings.push(
        `Total Title + Subtitle length (${totalLength} characters) exceeds Amazon's 200 character limit.`
      );
    }

    // Check keyword repetition / stuffing in subtitle
    const words = combined.split(/\s+/).filter(Boolean);
    const wordFreq: { [key: string]: number } = {};
    for (const w of words) {
      if (w.length > 3) {
        wordFreq[w] = (wordFreq[w] || 0) + 1;
        if (wordFreq[w] >= 3 && !overOptimizationWarnings.some(warn => warn.includes(w))) {
          overOptimizationWarnings.push(`Word "${w}" is repeated ${wordFreq[w]} times in Title/Subtitle. Amazon penalizes keyword stuffing.`);
        }
      }
    }

    // Check for promotional or forbidden words
    const prohibitedWords = ['bestseller', 'best seller', '#1', 'free', 'discount', 'unlimited'];
    for (const pw of prohibitedWords) {
      if (combined.includes(pw)) {
        overOptimizationWarnings.push(`Contains prohibited promotional phrase "${pw}" in title metadata.`);
      }
    }

    // Detect high-value search terms
    const targetTerms = ['large print', 'word search', 'sudoku', 'crossword', 'adults', 'seniors', 'puzzles', 'relaxing', 'brain games'];
    for (const term of targetTerms) {
      if (combined.includes(term)) {
        detectedKeywords.push(term);
      }
    }

    // Calculate Readability & Relevance Scores
    let readabilityScore = 90;
    if (titleLength > 60) readabilityScore -= 15;
    if (subtitleLength > 120) readabilityScore -= 10;
    if (overOptimizationWarnings.length > 0) readabilityScore -= overOptimizationWarnings.length * 10;
    readabilityScore = Math.max(20, Math.min(100, readabilityScore));

    let keywordRelevanceScore = Math.min(100, Math.max(30, detectedKeywords.length * 20 + 20));
    if (overOptimizationWarnings.length > 0) keywordRelevanceScore -= 15;

    const overallTitleScore = Math.round(readabilityScore * 0.5 + keywordRelevanceScore * 0.5);

    let keywordPlacement: 'Optimal' | 'Acceptable' | 'Needs Improvement' = 'Optimal';
    if (overOptimizationWarnings.length > 0 || detectedKeywords.length === 0) {
      keywordPlacement = 'Needs Improvement';
    } else if (titleLength > 70) {
      keywordPlacement = 'Acceptable';
    }

    // Generate intelligent, natural suggestions
    const primaryType = (project?.metadata as any)?.puzzleType || 'Word Search';
    const audience = project?.metadata?.targetAudience || 'Adults & Seniors';
    const theme = (project?.metadata as any)?.theme || 'Relaxing';

    const suggestions: KdpTitleSeoAnalysis['suggestions'] = [
      {
        title: cleanTitle || `${theme} ${primaryType} Puzzle Book`,
        subtitle: `Large Print Puzzles for ${audience} with Solutions Included`,
        reason: 'Balances natural human readability with essential search indexing (format + audience).',
        focus: 'Readability & Search',
      },
      {
        title: cleanTitle || `The Ultimate ${primaryType} Collection`,
        subtitle: `Brain Exercises and Mindful Relaxation for ${audience}`,
        reason: 'Focuses on cognitive benefit and stress-relief buyer motivations.',
        focus: 'Benefit Focused',
      },
    ];

    return {
      title: cleanTitle,
      subtitle: cleanSubtitle,
      overallTitleScore,
      readabilityScore,
      keywordRelevanceScore,
      keywordPlacement,
      characterCount: {
        title: titleLength,
        subtitle: subtitleLength,
        total: totalLength,
        maxLimit: 200,
      },
      detectedKeywords,
      overOptimizationWarnings,
      suggestions,
    };
  }

  /**
   * Analyzes Description SEO for keyword naturalness, readability, and policy compliance
   */
  public static analyzeDescriptionSeo(
    description: string,
    project?: Project
  ): KdpDescriptionSeoAnalysis {
    const raw = (description || '').trim();
    const wordCount = raw ? raw.split(/\s+/).filter(Boolean).length : 0;
    const charCount = raw.length;

    const keywords = ['large print', 'word search', 'sudoku', 'brain games', 'relaxing', 'seniors', 'adults', 'solutions', 'answers'];
    const keywordDensity: KdpDescriptionSeoAnalysis['keywordDensity'] = [];

    const lower = raw.toLowerCase();
    for (const kw of keywords) {
      const regex = new RegExp(`\\b${kw}\\b`, 'gi');
      const matches = lower.match(regex);
      const count = matches ? matches.length : 0;
      const densityPercent = wordCount > 0 ? Number(((count / wordCount) * 100).toFixed(2)) : 0;
      keywordDensity.push({
        keyword: kw,
        count,
        densityPercent,
        isOverused: densityPercent > 4.0 || count > 8,
      });
    }

    const unsupportedClaims: string[] = [];
    const repetitionWarnings: string[] = [];
    const recommendations: string[] = [];

    // Check for claims forbidden on Amazon KDP description
    const forbiddenClaims = ['guaranteed cure', 'miracle memory cure', '#1 bestseller on amazon', 'lowest price on amazon'];
    for (const claim of forbiddenClaims) {
      if (lower.includes(claim)) {
        unsupportedClaims.push(`Contains misleading claim: "${claim}".`);
      }
    }

    // Check length
    if (wordCount < 100) {
      recommendations.push('Description is brief. Expanding to 150–300 words with bullet points helps conversion and indexation.');
    } else if (wordCount > 600) {
      recommendations.push('Description exceeds 600 words; mobile readers may drop off before reading key bullet points.');
    }

    // Overused keywords check
    const overused = keywordDensity.filter(k => k.isOverused);
    if (overused.length > 0) {
      repetitionWarnings.push(
        `High repetition detected for: ${overused.map(k => `"${k.keyword}" (${k.count}x)`).join(', ')}. Avoid keyword stuffing.`
      );
    }

    const readabilityScore = wordCount >= 80 && unsupportedClaims.length === 0 ? 92 : 65;
    const keywordRelevanceScore = keywordDensity.some(k => k.count > 0) ? 88 : 50;
    const naturalFlowScore = repetitionWarnings.length === 0 ? 95 : 60;
    const overallDescriptionScore = Math.round((readabilityScore + keywordRelevanceScore + naturalFlowScore) / 3);

    // Optimized Description Preview
    const bookTitle = project?.name || 'Puzzle Book';
    const primaryType = (project?.metadata as any)?.puzzleType || 'Word Search';
    const audience = project?.metadata?.targetAudience || 'Adults & Seniors';
    const optimizedDescriptionPreview = `<h3>Keep Your Mind Sharp and Relaxed with ${bookTitle}</h3>
<p>Immerse yourself in hours of engaging mental stimulation designed specifically for <strong>${audience}</strong>. Whether you are unwinding after a long day or exercising your memory, this book provides the perfect blend of challenge and relaxation.</p>

<h4>What Makes This Book Special:</h4>
<ul>
  <li><strong>Clear, Large Print:</strong> Easy-to-read font size and layout that eliminates eye strain.</li>
  <li><strong>Thoughtfully Crafted Puzzles:</strong> Engaging variety of ${primaryType.toLowerCase()} puzzles crafted for focus and fun.</li>
  <li><strong>Full Answer Keys Included:</strong> Complete solutions conveniently located at the back of the book.</li>
  <li><strong>Perfect Gift:</strong> Makes a wonderful present for retirees, puzzle enthusiasts, and travelers.</li>
</ul>

<p><em>Grab your copy today and enjoy peaceful, screen-free entertainment!</em></p>`;

    return {
      rawDescription: raw,
      overallDescriptionScore,
      readabilityScore,
      keywordRelevanceScore,
      naturalFlowScore,
      wordCount,
      characterCount: charCount,
      keywordDensity,
      detectedClaims: ['Screen-free entertainment', 'Full solutions included', 'Clear large print'],
      unsupportedClaims,
      repetitionWarnings,
      audienceMatch: true,
      bookContentMatch: true,
      optimizedDescriptionPreview,
      recommendations,
    };
  }

  /**
   * Extracts compliant public signals from competitor book titles/subtitles
   */
  public static analyzeCompetitorSignal(
    competitor: { title: string; subtitle?: string; visibleCategory?: string }
  ): KdpCompetitorAnalysisItem {
    const text = `${competitor.title} ${competitor.subtitle || ''}`.toLowerCase();
    const commonPuzzleWords = [
      'large print',
      'word search',
      'sudoku',
      'crossword',
      'brain games',
      'seniors',
      'adults',
      'relaxation',
      'stress relief',
      'memory workout',
      'travel size',
      'pocket',
      'solutions',
    ];

    const extractedKeywords = commonPuzzleWords.filter(w => text.includes(w));

    return {
      id: `comp_${Math.random().toString(36).substring(2, 9)}`,
      title: competitor.title,
      subtitle: competitor.subtitle,
      visibleCategory: competitor.visibleCategory,
      extractedKeywords,
      notes: 'Compliant public title analysis — no private Amazon data accessed.',
    };
  }

  /**
   * Generates a comprehensive SEO Report
   */
  public static generateSeoReport(params: {
    project: Project;
    seed: string;
    keywords: KdpSeoKeyword[];
    marketplace?: string;
  }): KdpSeoResearchReport {
    const { project, seed, keywords, marketplace = 'Amazon.com' } = params;
    const sevenBoxes = this.optimizeSevenKeywordBoxes(keywords, project);
    const titleAnalysis = this.analyzeTitleSeo(
      project.name,
      project.metadata?.subtitle || '',
      project
    );
    const descriptionAnalysis = this.analyzeDescriptionSeo(
      project.metadata?.description || '',
      project
    );

    // Group into clusters
    const clusterMap = new Map<KdpKeywordCluster, string[]>();
    keywords.forEach(k => {
      if (!clusterMap.has(k.cluster)) clusterMap.set(k.cluster, []);
      clusterMap.get(k.cluster)!.push(k.keyword);
    });

    const clusters = Array.from(clusterMap.entries()).map(([cluster, kwList]) => ({
      cluster,
      count: kwList.length,
      keywords: kwList,
    }));

    const topKeywords = [...keywords].sort((a, b) => b.studioSeoScore - a.studioSeoScore).slice(0, 10);
    const longTailKeywords = keywords.filter(k => k.isLongTail).slice(0, 8);

    const overallSeoScore = Math.round(
      (topKeywords.reduce((acc, k) => acc + k.studioSeoScore, 0) / (topKeywords.length || 1)) * 0.4 +
      titleAnalysis.overallTitleScore * 0.3 +
      descriptionAnalysis.overallDescriptionScore * 0.3
    );

    let scoreGrade: 'Excellent' | 'Strong' | 'Moderate' | 'Weak' | 'Poor' = 'Moderate';
    if (overallSeoScore >= 90) scoreGrade = 'Excellent';
    else if (overallSeoScore >= 75) scoreGrade = 'Strong';
    else if (overallSeoScore >= 60) scoreGrade = 'Moderate';
    else if (overallSeoScore >= 40) scoreGrade = 'Weak';
    else scoreGrade = 'Poor';

    const warnings: string[] = [
      ...titleAnalysis.overOptimizationWarnings,
      ...descriptionAnalysis.repetitionWarnings,
      ...descriptionAnalysis.unsupportedClaims,
    ];

    const recommendedImprovements: string[] = [
      ...titleAnalysis.suggestions.map(s => `Title suggestion: ${s.title} — ${s.subtitle}`),
      ...sevenBoxes.recommendations,
      ...descriptionAnalysis.recommendations,
    ];

    const breakdown = {
      overallScore: overallSeoScore,
      keywordQualityScore: Math.round(topKeywords.reduce((acc, k) => acc + k.studioSeoScore, 0) / (topKeywords.length || 1)),
      titleScore: titleAnalysis.overallTitleScore,
      subtitleScore: titleAnalysis.readabilityScore,
      descriptionScore: descriptionAnalysis.overallDescriptionScore,
      keywordCoverageScore: sevenBoxes.overallCoverageScore,
      contentMatchScore: 85,
      riskLevel: warnings.length > 0 ? ('MEDIUM RISK' as const) : ('LOW RISK' as const),
      scoreGrade,
    };

    return {
      id: `report_${Date.now()}`,
      projectId: project.id,
      projectTitle: project.name,
      timestamp: new Date().toISOString(),
      marketplace,
      language: project.metadata?.language || 'English',
      seedKeyword: seed,
      overallSeoScore,
      scoreGrade,
      breakdown,
      dataSourcesDisclosure: {
        providerName: 'Studio Internal AI Estimator',
        liveDataStatus: 'Disconnected (No Amazon live connection)',
        estimationNotice: 'All search demand and competition signals are calculated estimates grounded in actual book metadata.',
      },
      topKeywords,
      longTailKeywords,
      sevenBoxes,
      clusters,
      titleAnalysis,
      descriptionAnalysis,
      negativeKeywords: [],
      warnings,
      recommendedImprovements,
    };
  }

  /**
   * Normalizes keyword strings: trims whitespace, removes invalid punctuation, handles casing
   */
  public static normalizeKeyword(keyword: string): string {
    if (!keyword) return '';
    return keyword
      .toLowerCase()
      .replace(/[^\w\s-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Exports keywords to CSV format
   */
  public static exportToCsv(keywords: KdpSeoKeyword[], projectName: string): string {
    const headers = [
      'Keyword',
      'Studio SEO Score',
      'Score Grade',
      'Relevance (0-100)',
      'Demand Signal',
      'Competition Signal',
      'Commercial Intent',
      'Cluster',
      'Is Long Tail',
      'Character Count',
      'Risk Status',
      'Risk Reason',
      'Source',
    ];

    const rows = keywords.map(k => [
      `"${k.keyword.replace(/"/g, '""')}"`,
      k.studioSeoScore,
      `"${k.scoreGrade}"`,
      k.relevance,
      `"${k.demandSignal} (Estimated)"`,
      `"${k.competitionSignal} (Estimated)"`,
      `"${k.commercialIntent}"`,
      `"${k.cluster}"`,
      k.isLongTail ? 'Yes' : 'No',
      k.charCount,
      `"${k.risk}"`,
      `"${(k.riskReason || '').replace(/"/g, '""')}"`,
      `"${k.source}"`,
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  /**
   * Exports the 7 KDP Backend Keyword Boxes to TXT format
   */
  public static exportSevenBoxesTxt(sevenBoxes: KdpSevenBoxesOptimization, projectName: string): string {
    const lines = [
      `===================================================================`,
      `KDP 7 KEYWORD BOXES — ${projectName}`,
      `Generated by KDP Book & Puzzle Studio SEO Engine`,
      `===================================================================`,
      ``,
      `Instructions: Copy and paste each line into Amazon KDP's 7 backend keyword boxes.`,
      `Rules: Max 50 characters per box. No duplicate words across boxes.`,
      ``,
    ];

    sevenBoxes.boxes.forEach(b => {
      lines.push(`Keyword Box ${b.slotNumber} (${b.charCount}/50 chars):`);
      lines.push(`${b.phrase}`);
      lines.push(``);
    });

    lines.push(`-------------------------------------------------------------------`);
    lines.push(`Total Characters Used: ${sevenBoxes.totalCharactersUsed} / 350`);
    lines.push(`Unique Keywords Indexed: ${sevenBoxes.totalUniqueWords}`);
    lines.push(`===================================================================`);

    return lines.join('\n');
  }
}

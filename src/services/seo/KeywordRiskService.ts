import { KdpKeywordRisk, RiskLevel } from '../../types/seo';
import { Project } from '../../types/project';

export interface KeywordRiskEvaluation {
  risk: KdpKeywordRisk;
  riskLevel: RiskLevel;
  riskReason?: string;
  isSafe: boolean;
  needsReview: boolean;
  recommendation: string;
}

export class KeywordRiskService {
  // Known high-risk trademarks / proprietary brands in KDP puzzle & book space
  private static readonly KNOWN_TRADEMARKS = [
    'new york times',
    'nyt',
    'rubik',
    'rubiks',
    'scrabble',
    'crossword puzzle books by dell',
    'dell magazine',
    'penny press',
    'disney',
    'marvel',
    'pokemon',
    'lego',
    'sudoku grandmaster tm',
    'clue',
    'monopoly',
    'hasbro',
    'mattel',
    'wordle',
  ];

  // Competitor imprints / brands
  private static readonly KNOWN_COMPETITORS = [
    'simon & schuster',
    'harpercollins',
    'penguin random house',
    'klutz',
    'national geographic',
    'scholastic',
    'sterling publishing',
    'dk publishing',
  ];

  // Celebrity / Living famous people
  private static readonly KNOWN_CELEBRITIES = [
    'oprah',
    'elon musk',
    'taylor swift',
    'stephen king',
    'jk rowling',
    'james patterson',
  ];

  // Unsupported promotional or deceptive claims banned under KDP guidelines
  private static readonly UNSUPPORTED_CLAIMS = [
    '#1 best seller',
    '#1 bestseller',
    'bestseller',
    'best seller',
    'free shipping',
    'lowest price',
    'top rated on amazon',
    'amazon choice',
    'amazons choice',
    'guaranteed cure',
    'miracle',
    '100% cure',
    'money back guarantee',
  ];

  /**
   * Evaluates risk of a single keyword against Amazon KDP policies.
   * Note: Adheres to guideline: "Do not automatically accuse a keyword of trademark infringement. Label: Potential trademark/brand risk — review manually."
   */
  public static evaluateKeywordRisk(
    keyword: string,
    project?: Project | null
  ): KeywordRiskEvaluation {
    const text = keyword.trim().toLowerCase();

    // 1. Check Trademarks
    for (const tm of this.KNOWN_TRADEMARKS) {
      if (text.includes(tm)) {
        return {
          risk: 'TRADEMARK_RISK',
          riskLevel: 'HIGH RISK',
          riskReason: `Matches known proprietary term "${tm}". Potential trademark/brand risk — review manually.`,
          isSafe: false,
          needsReview: true,
          recommendation: 'Remove or replace with generic descriptive terminology to avoid account warnings.',
        };
      }
    }

    // 2. Check Competitor Brands
    for (const comp of this.KNOWN_COMPETITORS) {
      if (text.includes(comp)) {
        return {
          risk: 'COMPETITOR_BRAND',
          riskLevel: 'HIGH RISK',
          riskReason: `Contains competitor or publishing brand "${comp}". Potential trademark/brand risk — review manually.`,
          isSafe: false,
          needsReview: true,
          recommendation: 'Avoid using competitor names in keywords or metadata.',
        };
      }
    }

    // 3. Check Celebrities
    for (const celeb of this.KNOWN_CELEBRITIES) {
      if (text.includes(celeb)) {
        return {
          risk: 'CELEBRITY_NAME',
          riskLevel: 'HIGH RISK',
          riskReason: `Contains recognizable public figure name "${celeb}". Potential trademark/brand risk — review manually.`,
          isSafe: false,
          needsReview: true,
          recommendation: 'Do not use celebrity names unless authorized.',
        };
      }
    }

    // 4. Check Unsupported Claims
    for (const claim of this.UNSUPPORTED_CLAIMS) {
      if (text.includes(claim)) {
        return {
          risk: 'UNSUPPORTED_CLAIM',
          riskLevel: 'MEDIUM RISK',
          riskReason: `Contains promotional or unverified ranking claim "${claim}".`,
          isSafe: false,
          needsReview: true,
          recommendation: 'Remove subjective promotional terms prohibited by KDP metadata guidelines.',
        };
      }
    }

    // 5. Keyword Stuffing / Overly Long
    if (text.length > 50) {
      return {
        risk: 'KEYWORD_STUFFING',
        riskLevel: 'MEDIUM RISK',
        riskReason: 'Phrase exceeds recommended single keyword slot length (50 characters).',
        isSafe: false,
        needsReview: true,
        recommendation: 'Split into smaller natural phrases.',
      };
    }

    // 6. Repeated words in same phrase
    const words = text.split(/\s+/);
    const wordSet = new Set(words);
    if (words.length > 2 && wordSet.size < words.length) {
      return {
        risk: 'REPEATED_KEYWORDS',
        riskLevel: 'LOW RISK',
        riskReason: 'Contains repetitive words within the same phrase.',
        isSafe: false,
        needsReview: true,
        recommendation: 'Remove duplicate words to conserve character space.',
      };
    }

    // 7. Format mismatch check if project provided
    if (project) {
      const format = ((project.kdpSettings as any)?.format || 'Paperback').toLowerCase();
      if (format.includes('paperback') && text.includes('hardcover only')) {
        return {
          risk: 'WRONG_FORMAT',
          riskLevel: 'LOW RISK',
          riskReason: 'Keyword specifies hardcover, but current book is configured as Paperback.',
          isSafe: false,
          needsReview: true,
          recommendation: 'Ensure keyword matches the physical book binding format.',
        };
      }
    }

    return {
      risk: 'NONE',
      riskLevel: 'LOW RISK',
      isSafe: true,
      needsReview: false,
      recommendation: 'Keyword conforms to standard KDP guidelines.',
    };
  }

  /**
   * Evaluates overall risk level across a collection of keywords
   */
  public static evaluateKeywordCollectionRisk(keywords: { riskLevel: RiskLevel }[]): RiskLevel {
    if (keywords.some(k => k.riskLevel === 'HIGH RISK')) {
      return 'HIGH RISK';
    }
    if (keywords.some(k => k.riskLevel === 'MEDIUM RISK')) {
      return 'MEDIUM RISK';
    }
    return 'LOW RISK';
  }
}

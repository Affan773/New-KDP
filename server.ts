import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 8080;

  app.use(express.json({ limit: '10mb' }));

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'KDP Book & Puzzle Studio API',
      version: '2.5.0',
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    });
  });

  // Lazy Gemini client helper
  let genAiClient: GoogleGenAI | null = null;
  function getGenAi(): GoogleGenAI | null {
    if (!process.env.GEMINI_API_KEY) {
      return null;
    }
    if (!genAiClient) {
      genAiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
    return genAiClient;
  }

  /**
   * Safe JSON parser that strips markdown code blocks or finds JSON structures
   */
  function cleanAndParseJson<T = any>(text: string, fallback: T): T {
    if (!text || typeof text !== 'string') return fallback;
    try {
      // 1. Direct parse attempt
      return JSON.parse(text.trim());
    } catch {
      try {
        // 2. Strip markdown code fence (```json ... ``` or ``` ...)
        let cleaned = text.trim();
        if (cleaned.startsWith('```')) {
          cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
          return JSON.parse(cleaned.trim());
        }

        // 3. Extract substring between first '{' and last '}' or '[' and ']'
        const firstBrace = cleaned.indexOf('{');
        const lastBrace = cleaned.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace > firstBrace) {
          const jsonSub = cleaned.substring(firstBrace, lastBrace + 1);
          return JSON.parse(jsonSub);
        }

        const firstBracket = cleaned.indexOf('[');
        const lastBracket = cleaned.lastIndexOf(']');
        if (firstBracket !== -1 && lastBracket > firstBracket) {
          const jsonSub = cleaned.substring(firstBracket, lastBracket + 1);
          return JSON.parse(jsonSub);
        }
      } catch (innerErr) {
        console.warn('Failed to parse AI JSON response:', innerErr);
      }
    }
    return fallback;
  }

  /**
   * Resilient Gemini caller with automatic failover across models
   * If a model is experiencing high demand (503), it immediately cascades to fallback models.
   */
  async function generateContentResilient(
    ai: GoogleGenAI,
    params: {
      contents: any;
      config?: any;
    },
    primaryModel: string = 'gemini-3.7-flash',
    fallbackModels: string[] = ['gemini-3.1-flash-lite', 'gemini-flash-latest']
  ) {
    const candidateModels = [primaryModel, ...fallbackModels];
    let lastError: any = null;

    for (const model of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: params.contents,
          config: params.config,
        });
        if (response && response.text) {
          return response;
        }
      } catch (err: any) {
        lastError = err;
        const status = err?.status || err?.code || err?.error?.code;
        const msg = String(err?.message || '');
        const isHighDemand =
          status === 503 ||
          status === 429 ||
          msg.includes('503') ||
          msg.includes('429') ||
          msg.includes('high demand') ||
          msg.includes('UNAVAILABLE') ||
          msg.includes('RESOURCE_EXHAUSTED');

        console.warn(`[Gemini API] Call to ${model} returned ${isHighDemand ? 'high demand / unavailable' : 'error'}. Switching to alternate model.`);

        // For high demand, immediately cascade to next candidate without blocking
        continue;
      }
    }

    throw lastError || new Error('All Gemini models unavailable.');
  }

  // Server-side AI Word Generation API endpoint
  app.post('/api/ai/generate-words', async (req, res) => {
    try {
      const {
        topic = 'General Knowledge',
        count = 15,
        difficulty = 'Medium',
        language = 'English',
        targetAudience = 'All Ages',
        customInstructions = '',
        minLen = 3,
        maxLen = 18,
      } = req.body || {};

      // Input safety validation
      const safeCount = Math.min(50, Math.max(3, Number(count) || 15));
      const safeTopic = String(topic).slice(0, 150).trim() || 'General Knowledge';
      const safeInstructions = String(customInstructions).slice(0, 500).trim();

      const ai = getGenAi();

      if (!ai) {
        // Fallback curated word generator if API key is not yet configured
        return res.status(200).json({
          success: true,
          isFallback: true,
          message: 'Gemini API key not configured in environment. Using smart dictionary generator.',
          topic: safeTopic,
          language,
          words: generateFallbackWords(safeTopic, safeCount, minLen, maxLen),
        });
      }

      const prompt = `You are a professional puzzle creator and lexicographer for Amazon KDP puzzle books.
Generate exactly ${safeCount} high-quality, engaging, and relevant vocabulary words for a "${safeTopic}" themed Word Search puzzle.

Requirements:
- Target Language: ${language}
- Difficulty Level: ${difficulty}
- Target Audience: ${targetAudience}
- Word Length: Strictly between ${minLen} and ${maxLen} alphabetic characters.
- Words MUST only contain letters (no numbers, no spaces, no hyphens, no special characters).
- All words must be distinct and non-repeating.
- Ensure appropriate and wholesome content suitable for published puzzle books.
${safeInstructions ? `- Additional Guidance: ${safeInstructions}` : ''}

Respond with a JSON object containing the theme/topic name, language, and an array of uppercase words.`;

      const response = await generateContentResilient(ai, {
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              topic: { type: Type.STRING, description: 'The polished topic or theme title.' },
              language: { type: Type.STRING, description: 'The language of the words.' },
              words: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'The list of single-word alphabetic vocabulary terms.',
              },
            },
            required: ['topic', 'words'],
          },
        },
      });

      const responseText = response.text || '{}';
      const parsed = cleanAndParseJson<any>(responseText, { topic: safeTopic, language, words: [] });

      // Cleanse and sanitize received words
      const cleanedWords = (parsed.words || [])
        .map((w: string) => String(w).trim().toUpperCase().replace(/[^A-Z]/g, ''))
        .filter((w: string) => w.length >= minLen && w.length <= maxLen);

      // Deduplicate
      const uniqueWords = Array.from(new Set(cleanedWords));

      return res.json({
        success: true,
        topic: parsed.topic || safeTopic,
        language: parsed.language || language,
        words: uniqueWords.length >= 3 ? uniqueWords : generateFallbackWords(safeTopic, safeCount, minLen, maxLen),
      });
    } catch (err: any) {
      console.warn('AI Word Generation fallback active:', err?.message || err);
      // Return safe fallback so the UI never breaks
      const { topic = 'Vocabulary', count = 15, minLen = 3, maxLen = 18 } = req.body || {};
      return res.status(200).json({
        success: true,
        isFallback: true,
        error: err.message || 'AI generation encountered an issue, used smart fallback.',
        topic,
        words: generateFallbackWords(topic, count, minLen, maxLen),
      });
    }
  });

  // Server-side AI Book Planner endpoint
  app.post('/api/ai/plan-book', async (req, res) => {
    try {
      const {
        bookType = 'Mixed Variety Puzzle Book',
        topic = 'Brain Fitness & Nature Exploration',
        targetAudience = 'Adults & Seniors',
        language = 'English',
        difficulty = 'Medium',
        trimSize = '8.5x11',
        targetPages = 80,
        puzzleCount = 60,
        wordsPerSearch = 15,
        answerKeyMode = 'end_of_book',
        isLargePrint = false,
        titlePreference = '',
        subtitlePreference = '',
      } = req.body || {};

      const ai = getGenAi();

      if (!ai) {
        return res.status(200).json({
          success: true,
          isFallback: true,
          plan: generateFallbackBookPlan({
            bookType,
            topic,
            targetAudience,
            language,
            difficulty,
            trimSize,
            targetPages,
            puzzleCount,
            wordsPerSearch,
            isLargePrint,
            titlePreference,
            subtitlePreference,
          }),
        });
      }

      const prompt = `You are a veteran Amazon KDP puzzle book publisher and layout architect.
Design a complete, publication-ready Book Plan and Chapter Outline for a new KDP book with the following specifications:
- Book Type: ${bookType}
- Core Topic/Theme: ${topic}
- Target Audience: ${targetAudience}
- Language: ${language}
- Difficulty Level: ${difficulty}
- Trim Size: ${trimSize}
- Desired Page Count: ${targetPages} pages
- Total Puzzles: ${puzzleCount} puzzles
- Words per Word Search: ${wordsPerSearch} words
- Large Print Preference: ${isLargePrint ? 'Yes (18pt+ fonts)' : 'Standard'}
${titlePreference ? `- Preferred Title Theme: ${titlePreference}` : ''}
${subtitlePreference ? `- Preferred Subtitle Theme: ${subtitlePreference}` : ''}

Generate a comprehensive structure including:
1. Compelling, high-converting Title and Subtitle for Amazon KDP.
2. Formatted 7 KDP backend keyword ideas and a 2-paragraph sales description.
3. Recommended interior layout with Front Matter (Title Page, Copyright, Instructions, TOC).
4. 3 to 5 themed interior sections/chapters with specific puzzle types (word_search, sudoku, maze, crossword, word_scramble, cryptogram) and puzzle count allocation.
5. Back Matter structure including Answer Key layout.`;

      const response = await generateContentResilient(ai, {
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              subtitle: { type: Type.STRING },
              description: { type: Type.STRING },
              targetAudience: { type: Type.STRING },
              language: { type: Type.STRING },
              recommendedTrimSize: { type: Type.STRING },
              recommendedPageCount: { type: Type.INTEGER },
              totalPuzzles: { type: Type.INTEGER },
              difficultyProgression: { type: Type.STRING },
              keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
              frontMatter: {
                type: Type.OBJECT,
                properties: {
                  includeTitlePage: { type: Type.BOOLEAN },
                  includeCopyright: { type: Type.BOOLEAN },
                  includeInstructions: { type: Type.BOOLEAN },
                  includeTOC: { type: Type.BOOLEAN },
                },
                required: ['includeTitlePage', 'includeCopyright', 'includeInstructions', 'includeTOC'],
              },
              sections: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    puzzleType: { type: Type.STRING },
                    count: { type: Type.INTEGER },
                    difficulty: { type: Type.STRING },
                    theme: { type: Type.STRING },
                  },
                  required: ['title', 'puzzleType', 'count', 'difficulty'],
                },
              },
              backMatter: {
                type: Type.OBJECT,
                properties: {
                  answerKeyMode: { type: Type.STRING },
                  puzzlesPerSolutionPage: { type: Type.INTEGER },
                  includeNotesPage: { type: Type.BOOLEAN },
                },
                required: ['answerKeyMode', 'puzzlesPerSolutionPage'],
              },
            },
            required: ['title', 'subtitle', 'description', 'keywords', 'sections'],
          },
        },
      });

      const parsed = cleanAndParseJson<any>(response.text || '{}', {});
      return res.json({
        success: true,
        isFallback: false,
        plan: {
          title: parsed.title || `${topic} Puzzle Book`,
          subtitle: parsed.subtitle || `Over ${puzzleCount} Engaging Brain Puzzles for ${targetAudience}`,
          description: parsed.description || `Enjoy hours of brain-training fun with this ${topic} collection.`,
          targetAudience: parsed.targetAudience || targetAudience,
          language: parsed.language || language,
          recommendedTrimSize: parsed.recommendedTrimSize || trimSize,
          recommendedPageCount: parsed.recommendedPageCount || targetPages,
          totalPuzzles: parsed.totalPuzzles || puzzleCount,
          difficultyProgression: parsed.difficultyProgression || difficulty,
          keywords: parsed.keywords || ['puzzle book', 'brain games', 'amazon kdp'],
          frontMatter: parsed.frontMatter || {
            includeTitlePage: true,
            includeCopyright: true,
            includeInstructions: true,
            includeTOC: true,
          },
          sections: (parsed.sections && parsed.sections.length > 0)
            ? parsed.sections
            : [
                { title: 'Part 1: Word Searches', puzzleType: 'word_search', count: Math.ceil(puzzleCount / 3), difficulty: 'Easy', theme: topic },
                { title: 'Part 2: Sudoku Mastery', puzzleType: 'sudoku', count: Math.ceil(puzzleCount / 3), difficulty: 'Medium', theme: 'numbers' },
                { title: 'Part 3: Labyrinths & Mazes', puzzleType: 'maze', count: Math.floor(puzzleCount / 3), difficulty: 'Medium', theme: 'geometry' },
              ],
          backMatter: parsed.backMatter || {
            answerKeyMode: answerKeyMode || 'end_of_book',
            puzzlesPerSolutionPage: 4,
            includeNotesPage: true,
          },
        },
      });
    } catch (err: any) {
      console.warn('AI Book Planner fallback active:', err?.message || err);
      return res.status(200).json({
        success: true,
        isFallback: true,
        error: err.message || 'AI planning encountered an issue, used smart fallback.',
        plan: generateFallbackBookPlan(req.body || {}),
      });
    }
  });

  // Server-side AI Title & Keywords Assistant endpoint
  app.post('/api/ai/title-assistant', async (req, res) => {
    try {
      const {
        niche = 'Brain Games & Word Search',
        targetAudience = 'Adults & Seniors',
        tone = 'Engaging & Professional',
        keywords = '',
      } = req.body || {};

      const ai = getGenAi();

      if (!ai) {
        return res.status(200).json({
          success: true,
          isFallback: true,
          titles: [
            { title: `The Ultimate ${niche} Collection`, subtitle: `100+ High Quality Puzzles to Relax and Sharpen Your Mind` },
            { title: `${niche} for ${targetAudience}`, subtitle: `Challenging & Fun Daily Brain Workout with Complete Solutions` },
            { title: `Mastering ${niche}`, subtitle: `A Curated Variety of Brain Teasers and Mind Exercises` },
            { title: `Relax & Unwind: ${niche}`, subtitle: `Stress Relief Puzzle Book with Large Easy-to-Read Print` },
          ],
          keywords: [
            `${niche.toLowerCase()} for adults`,
            `brain games ${targetAudience.toLowerCase()}`,
            'large print activity book',
            'daily mind workout',
            'stress relief puzzles',
            'kdp activity books',
            'cognitive fitness exercises',
          ],
          description: `Sharpen your cognitive skills and unwind with this comprehensive ${niche} designed specifically for ${targetAudience}. Featuring carefully crafted puzzles with clear solutions.`,
        });
      }

      const prompt = `You are a high-performing Amazon KDP publishing marketing consultant.
Generate high-converting title options, subtitle variations, 7 Amazon backend keyword phrases, and a compelling book description for:
- Niche/Theme: ${niche}
- Target Audience: ${targetAudience}
- Tone/Vibe: ${tone}
${keywords ? `- Seed Keywords: ${keywords}` : ''}

Rules:
- Titles should be punchy, memorable, and compliant with Amazon KDP metadata guidelines (no keyword stuffing in title).
- Subtitles must highlight clear benefits, puzzle counts, and audience appeal.
- Provide exactly 4 distinct title/subtitle pairings.
- Provide exactly 7 high-relevance KDP search keyword phrases under 50 characters each.
- Provide a 2-paragraph book description with bullet points.`;

      const response = await generateContentResilient(ai, {
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              titles: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    subtitle: { type: Type.STRING },
                  },
                  required: ['title', 'subtitle'],
                },
              },
              keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
              description: { type: Type.STRING },
              audienceHook: { type: Type.STRING },
            },
            required: ['titles', 'keywords', 'description'],
          },
        },
      });

      const parsed = cleanAndParseJson<any>(response.text || '{}', { titles: [], keywords: [], description: '', audienceHook: '' });
      return res.json({
        success: true,
        isFallback: false,
        titles: parsed.titles || [],
        keywords: parsed.keywords || [],
        description: parsed.description || '',
        audienceHook: parsed.audienceHook || '',
      });
    } catch (err: any) {
      console.warn('AI Title Assistant fallback active:', err?.message || err);
      const niche = req.body?.niche || 'Puzzle Book';
      return res.status(200).json({
        success: true,
        isFallback: true,
        error: err.message,
        titles: [
          { title: `The Ultimate ${niche}`, subtitle: 'Engaging brain puzzles and activities with complete solutions' },
          { title: `${niche} Mastery Collection`, subtitle: 'Hours of relaxing, cognitive entertainment' },
        ],
        keywords: ['puzzle book', 'brain workout', 'amazon kdp', 'activity book'],
        description: `Enjoy a curated selection of puzzles in this ${niche}.`,
      });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`KDP Studio server running on http://0.0.0.0:${PORT}`);
  });
}

function generateFallbackBookPlan(options: any): any {
  const {
    topic = 'Brain Fitness & Nature Exploration',
    targetAudience = 'Adults & Seniors',
    language = 'English',
    difficulty = 'Medium',
    trimSize = '8.5x11',
    targetPages = 80,
    puzzleCount = 60,
    isLargePrint = false,
    titlePreference = '',
    subtitlePreference = '',
  } = options;

  const title = titlePreference || `${topic} Puzzle Book`;
  const subtitle = subtitlePreference || `Over ${puzzleCount} Engaging Brain Puzzles with Solutions for ${targetAudience}`;
  const countPerSec = Math.max(10, Math.floor(puzzleCount / 3));

  return {
    title,
    subtitle,
    description: `Keep your mind sharp, active, and entertained with this curated collection of ${topic} puzzles. Specifically designed for ${targetAudience} with clear typography and complete solutions in the back.`,
    targetAudience,
    language,
    recommendedTrimSize: trimSize,
    recommendedPageCount: targetPages,
    totalPuzzles: puzzleCount,
    difficultyProgression: difficulty,
    keywords: [
      `${topic.toLowerCase()} puzzle book`,
      `brain games for ${targetAudience.toLowerCase()}`,
      isLargePrint ? 'large print puzzle book' : 'activity book for adults',
      'mind fitness games',
      'word search with solutions',
      'sudoku puzzle collection',
      'relaxing daily brain teasers',
    ],
    frontMatter: {
      includeTitlePage: true,
      includeCopyright: true,
      includeInstructions: true,
      includeTOC: true,
    },
    sections: [
      {
        title: 'Chapter 1: Themed Word Searches',
        puzzleType: 'word_search',
        count: countPerSec,
        difficulty: 'Easy',
        theme: topic,
      },
      {
        title: 'Chapter 2: Number Puzzles & Sudoku',
        puzzleType: 'sudoku',
        count: countPerSec,
        difficulty: difficulty === 'Hard' ? 'Hard' : 'Medium',
        theme: 'numbers',
      },
      {
        title: 'Chapter 3: Mazes & Labyrinths',
        puzzleType: 'maze',
        count: puzzleCount - countPerSec * 2,
        difficulty: 'Medium',
        theme: 'geometry',
      },
    ],
    backMatter: {
      answerKeyMode: 'end_of_book',
      puzzlesPerSolutionPage: 4,
      includeNotesPage: true,
    },
  };
}

function generateFallbackWords(topic: string, count: number, minLen: number, maxLen: number): string[] {
  const dictionary: Record<string, string[]> = {
    nature: [
      'MOUNTAIN', 'WATERFALL', 'RAINFOREST', 'BLOSSOM', 'VALLEY',
      'GLACIER', 'CANYON', 'MEADOW', 'VOLCANO', 'HORIZON',
      'SUNFLOWER', 'LAVENDER', 'EVERGREEN', 'SUNSHINE', 'RIVERBANK',
      'WILDERNESS', 'WOODLAND', 'SEQUOIA', 'ESTUARY', 'LAGOON', 'SAVANNA'
    ],
    space: [
      'SUPERNOVA', 'ASTEROID', 'CONSTELLATION', 'TELESCOPE', 'ASTRONAUT',
      'METEORITE', 'GRAVITY', 'GALAXY', 'PLANETARIUM', 'SATELLITE',
      'ECLIPSE', 'NEBULA', 'UNIVERSE', 'ORBITAL', 'STARLIGHT',
      'ANDROMEDA', 'SOLARFLARE', 'INTERSTELLAR', 'SPACECRAFT', 'COSMOS'
    ],
    animals: [
      'ELEPHANT', 'GIRAFFE', 'KANGAROO', 'LEOPARD', 'CHEETAH',
      'DOLPHIN', 'FLAMINGO', 'PENGUIN', 'GORILLA', 'CHAMELEON',
      'OCTOPUS', 'ALLIGATOR', 'HEDGEHOG', 'PLATYPUS', 'MEERKAT',
      'HUMMINGBIRD', 'SNOWLEOPARD', 'TORTOISE', 'WOLVERINE', 'SEALION'
    ],
    travel: [
      'PASSPORT', 'ITINERARY', 'LANDMARK', 'EXPEDITION', 'VOYAGE',
      'HERITAGE', 'TERMINAL', 'DEPARTURE', 'SOUVENIR', 'COMPASS',
      'BACKPACK', 'NAVIGATOR', 'MONUMENT', 'WANDERLUST', 'PILGRIMAGE'
    ],
    science: [
      'MOLECULE', 'HYPOTHESIS', 'EXPERIMENT', 'MICROSCOPE', 'CATALYST',
      'CHROMOSOME', 'ELECTRICITY', 'MAGNETISM', 'EQUATION', 'SPECTRUM',
      'LABORATORY', 'PHOTOSYNTHESIS', 'GRAVITATION', 'EVOLUTION', 'ORGANISM'
    ],
    food: [
      'CHOCOLATE', 'CINNAMON', 'VANILLA', 'CROISSANT', 'CAPPUCCINO',
      'BLUEBERRY', 'PISTACHIO', 'SOURDOUGH', 'PARMESAN', 'AVOCADO',
      'ROSEMARY', 'CARDAMOM', 'BRUSCHETTA', 'TORTELLINI', 'TARRAGON'
    ],
    history: [
      'CIVILIZATION', 'ARCHEOLOGY', 'DYNASTY', 'RENAISSANCE', 'MONARCHY',
      'PARCHMENT', 'DISCOVERY', 'ARTIFACT', 'EMPIRE', 'CHRONICLE',
      'HERITAGE', 'CENTURY', 'HIEROGLYPH', 'MONUMENT', 'ARCHIVE'
    ],
    general: [
      'ADVENTURE', 'DISCOVERY', 'JOURNEY', 'BRILLIANT', 'CREATIVE',
      'HARMONY', 'SERENITY', 'GRATITUDE', 'KINDNESS', 'WISDOM',
      'BALANCE', 'ELEGANT', 'INNOVATION', 'EXPLORE', 'VICTORY',
      'COURAGE', 'MINDFULNESS', 'BRILLIANCE', 'HORIZON', 'RESILIENCE'
    ]
  };

  const key = Object.keys(dictionary).find(k => topic.toLowerCase().includes(k)) || 'general';
  const pool = (dictionary[key] || dictionary.general).filter(
    w => w.length >= minLen && w.length <= maxLen
  );
  return pool.slice(0, count);
}

startServer();

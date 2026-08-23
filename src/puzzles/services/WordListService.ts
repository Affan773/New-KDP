import { BUILT_IN_WORD_THEMES, sanitizeWordList, WordTheme } from '../utils/wordLists';

const STORAGE_KEY = 'kdp_custom_word_themes_v1';

export interface CustomWordCategory {
  id: string;
  name: string;
  category: string;
  words: string[];
  isCustom?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export class WordListService {
  private static customCategoriesCache: CustomWordCategory[] | null = null;

  /**
   * Returns all categories (built-in combined with custom categories saved in storage)
   */
  static getAllCategories(): CustomWordCategory[] {
    const builtInList: CustomWordCategory[] = Object.values(BUILT_IN_WORD_THEMES).map(theme => ({
      id: theme.id,
      name: theme.name,
      category: theme.category,
      words: theme.words,
      isCustom: false,
    }));

    const customList = this.getCustomCategories();
    return [...builtInList, ...customList];
  }

  /**
   * Retrieves user-created custom categories from cache or storage
   */
  static getCustomCategories(): CustomWordCategory[] {
    if (this.customCategoriesCache) {
      return this.customCategoriesCache;
    }
    try {
      if (typeof localStorage === 'undefined') return [];
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        this.customCategoriesCache = parsed.map(c => ({ ...c, isCustom: true }));
        return this.customCategoriesCache;
      }
    } catch {
      // Ignored fallback
    }
    return [];
  }

  /**
   * Saves a new or updated custom category to storage
   */
  static saveCategory(category: {
    id?: string;
    name: string;
    category?: string;
    words: string[];
  }): CustomWordCategory {
    const customList = [...this.getCustomCategories()];
    const { words: cleanedWords } = sanitizeWordList(category.words);

    if (!category.name || category.name.trim().length === 0) {
      throw new Error('Category name cannot be blank.');
    }

    if (cleanedWords.length === 0) {
      throw new Error('Category must contain at least one valid alphabetical word.');
    }

    const existingIndex = category.id
      ? customList.findIndex(c => c.id === category.id)
      : -1;

    let savedItem: CustomWordCategory;

    if (existingIndex >= 0) {
      savedItem = {
        ...customList[existingIndex],
        name: category.name.trim(),
        category: category.category || 'Custom',
        words: cleanedWords,
        updatedAt: new Date().toISOString(),
      };
      customList[existingIndex] = savedItem;
    } else {
      const id = category.id || `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
      savedItem = {
        id,
        name: category.name.trim(),
        category: category.category || 'Custom',
        words: cleanedWords,
        isCustom: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      customList.push(savedItem);
    }

    this.customCategoriesCache = customList;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(customList));
      }
    } catch {
      // Memory cache preserved
    }

    return savedItem;
  }

  /**
   * Deletes a custom category by ID
   */
  static deleteCategory(id: string): boolean {
    const customList = this.getCustomCategories();
    const filtered = customList.filter(c => c.id !== id);
    if (filtered.length === customList.length) return false;

    this.customCategoriesCache = filtered;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      }
      return true;
    } catch {
      return true;
    }
  }

  /**
   * Imports plain text (newline, comma, or tab separated) and parses valid unique words
   */
  static importPlainText(text: string): {
    words: string[];
    errors: string[];
    duplicatesCount: number;
  } {
    const { words, errors, removedDuplicates } = sanitizeWordList(text, 3, 24);
    return {
      words,
      errors,
      duplicatesCount: removedDuplicates,
    };
  }

  /**
   * Exports an array of words to formatted plain text
   */
  static exportPlainText(words: string[]): string {
    return words.join('\n');
  }
}

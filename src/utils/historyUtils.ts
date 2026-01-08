/**
 * Translation History Utilities
 * Provides functions to manage translation history in Chrome storage
 */

import { secureRandomString } from "./index.ts";

// Storage keys
const HISTORY_STORAGE_KEY = "translationHistory";
const HISTORY_CONFIG_KEY = "translationHistoryConfig";

// Default configuration
const DEFAULT_HISTORY_CONFIG: TranslationHistoryConfig = {
  maxHistoryItems: 100,
  enabled: true,
};

/**
 * Get translation history configuration
 */
export async function getHistoryConfig(): Promise<TranslationHistoryConfig> {
  return new Promise((resolve) => {
    chrome.storage.local.get([HISTORY_CONFIG_KEY], (result) => {
      const config = result[HISTORY_CONFIG_KEY];
      if (config) {
        resolve(config as TranslationHistoryConfig);
      } else {
        // Save default config if not exists
        saveHistoryConfig(DEFAULT_HISTORY_CONFIG).then(() => {
          resolve(DEFAULT_HISTORY_CONFIG);
        });
      }
    });
  });
}

/**
 * Save translation history configuration
 */
export async function saveHistoryConfig(config: TranslationHistoryConfig): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [HISTORY_CONFIG_KEY]: config }, () => {
      resolve();
    });
  });
}

/**
 * Get all translation history items
 */
export async function getTranslationHistory(): Promise<TranslationHistoryItem[]> {
  return new Promise((resolve) => {
    chrome.storage.local.get([HISTORY_STORAGE_KEY], (result) => {
      const history = result[HISTORY_STORAGE_KEY];
      if (Array.isArray(history)) {
        // Sort by timestamp descending (newest first)
        resolve(history.sort((a, b) => b.timestamp - a.timestamp));
      } else {
        resolve([]);
      }
    });
  });
}

/**
 * Save a translation to history
 */
export async function saveToHistory(
  originalText: string,
  translatedText: string,
  sourceLanguage: string,
  targetLanguage: string,
  platform: string,
  additionalInfo?: string,
): Promise<void> {
  // Check if history is enabled
  const config = await getHistoryConfig();
  if (!config.enabled) {
    return;
  }

  // Don't save empty translations
  if (!originalText.trim() || !translatedText.trim()) {
    return;
  }

  // Get current history
  const history = await getTranslationHistory();

  // Create new history item
  const newItem: TranslationHistoryItem = {
    id: secureRandomString(16), // Generate a unique ID
    originalText,
    translatedText,
    sourceLanguage,
    targetLanguage,
    platform,
    timestamp: Date.now(),
    additionalInfo,
  };

  // Add to beginning of array (newest first)
  const updatedHistory = [newItem, ...history];

  // Limit history size
  if (updatedHistory.length > config.maxHistoryItems) {
    updatedHistory.length = config.maxHistoryItems;
  }

  // Save to storage
  return new Promise((resolve) => {
    chrome.storage.local.set({ [HISTORY_STORAGE_KEY]: updatedHistory }, () => {
      resolve();
    });
  });
}

/**
 * Delete a specific history item by ID
 */
export async function deleteHistoryItem(id: string): Promise<void> {
  const history = await getTranslationHistory();
  const updatedHistory = history.filter((item) => item.id !== id);

  return new Promise((resolve) => {
    chrome.storage.local.set({ [HISTORY_STORAGE_KEY]: updatedHistory }, () => {
      resolve();
    });
  });
}

/**
 * Clear all translation history
 */
export async function clearTranslationHistory(): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [HISTORY_STORAGE_KEY]: [] }, () => {
      resolve();
    });
  });
}

/**
 * Search translation history by text (searches both original and translated text)
 */
export async function searchTranslationHistory(query: string): Promise<TranslationHistoryItem[]> {
  const history = await getTranslationHistory();
  if (!query.trim()) {
    return history;
  }

  const lowercaseQuery = query.toLowerCase();
  return history.filter(
    (item) =>
      item.originalText.toLowerCase().includes(lowercaseQuery) ||
      item.translatedText.toLowerCase().includes(lowercaseQuery),
  );
}

/**
 * Get history statistics
 */
export async function getHistoryStats(): Promise<{
  totalItems: number;
  oldestTimestamp: number | null;
  newestTimestamp: number | null;
}> {
  const history = await getTranslationHistory();
  if (history.length === 0) {
    return {
      totalItems: 0,
      oldestTimestamp: null,
      newestTimestamp: null,
    };
  }

  return {
    totalItems: history.length,
    oldestTimestamp: Math.min(...history.map((item) => item.timestamp)),
    newestTimestamp: Math.max(...history.map((item) => item.timestamp)),
  };
}
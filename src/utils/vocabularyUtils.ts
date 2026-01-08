/**
 * Vocabulary Book Utilities
 * Provides functions to manage vocabulary items (word collection) in Chrome storage
 */

import { secureRandomString } from "./index.ts";

// Storage keys
const VOCABULARY_STORAGE_KEY = "vocabularyItems";
const VOCABULARY_CONFIG_KEY = "vocabularyConfig";

// Default configuration
const DEFAULT_VOCABULARY_CONFIG: VocabularyConfig = {
  maxVocabularyItems: 500,
  enabled: true,
  autoAddFavorites: false,
  defaultTags: ["new", "important", "difficult"],
  exportFormat: "csv" as const,
};

/**
 * Get vocabulary configuration
 */
export async function getVocabularyConfig(): Promise<VocabularyConfig> {
  return new Promise((resolve) => {
    chrome.storage.local.get([VOCABULARY_CONFIG_KEY], (result) => {
      const config = result[VOCABULARY_CONFIG_KEY];
      if (config) {
        resolve(config as VocabularyConfig);
      } else {
        // Save default config if not exists
        saveVocabularyConfig(DEFAULT_VOCABULARY_CONFIG).then(() => {
          resolve(DEFAULT_VOCABULARY_CONFIG);
        });
      }
    });
  });
}

/**
 * Save vocabulary configuration
 */
export async function saveVocabularyConfig(config: VocabularyConfig): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [VOCABULARY_CONFIG_KEY]: config }, () => {
      resolve();
    });
  });
}

/**
 * Get all vocabulary items
 */
export async function getVocabularyItems(): Promise<VocabularyItem[]> {
  return new Promise((resolve) => {
    chrome.storage.local.get([VOCABULARY_STORAGE_KEY], (result) => {
      const items = result[VOCABULARY_STORAGE_KEY];
      if (Array.isArray(items)) {
        // Sort by timestamp descending (newest first)
        resolve(items.sort((a, b) => b.timestamp - a.timestamp));
      } else {
        resolve([]);
      }
    });
  });
}

/**
 * Add a translation to vocabulary
 */
export async function addToVocabulary(
  originalText: string,
  translatedText: string,
  sourceLanguage: string,
  targetLanguage: string,
  platform: string,
  phonetic?: PhoneticInfo,
  tags?: string[],
  notes?: string,
): Promise<VocabularyItem> {
  // Check if vocabulary is enabled
  const config = await getVocabularyConfig();
  if (!config.enabled) {
    throw new Error("Vocabulary feature is disabled");
  }

  // Don't add empty translations
  if (!originalText.trim() || !translatedText.trim()) {
    throw new Error("Cannot add empty translation to vocabulary");
  }

  // Get current vocabulary
  const items = await getVocabularyItems();

  // Check if item already exists (by original text and language pair)
  const existingItem = items.find(
    (item) =>
      item.originalText === originalText &&
      item.sourceLanguage === sourceLanguage &&
      item.targetLanguage === targetLanguage,
  );

  if (existingItem) {
    // Update existing item
    const updatedItem: VocabularyItem = {
      ...existingItem,
      translatedText,
      platform,
      timestamp: Date.now(),
      phonetic: phonetic || existingItem.phonetic,
      tags: tags || existingItem.tags || [],
      notes: notes || existingItem.notes,
    };

    const updatedItems = items.map((item) => (item.id === existingItem.id ? updatedItem : item));
    await saveVocabularyItems(updatedItems);
    return updatedItem;
  }

  // Create new vocabulary item
  const newItem: VocabularyItem = {
    id: secureRandomString(16),
    originalText,
    translatedText,
    sourceLanguage,
    targetLanguage,
    platform,
    timestamp: Date.now(),
    phonetic,
    tags: tags || config.defaultTags || [],
    notes: notes || "",
    favorite: false,
    reviewCount: 0,
    difficulty: "medium" as const,
  };

  // Add to beginning of array (newest first)
  const updatedItems = [newItem, ...items];

  // Limit vocabulary size
  if (updatedItems.length > config.maxVocabularyItems) {
    updatedItems.length = config.maxVocabularyItems;
  }

  // Save to storage
  await saveVocabularyItems(updatedItems);
  return newItem;
}

/**
 * Save vocabulary items array
 */
async function saveVocabularyItems(items: VocabularyItem[]): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [VOCABULARY_STORAGE_KEY]: items }, () => {
      resolve();
    });
  });
}

/**
 * Remove a vocabulary item by ID
 */
export async function removeVocabularyItem(id: string): Promise<void> {
  const items = await getVocabularyItems();
  const updatedItems = items.filter((item) => item.id !== id);
  await saveVocabularyItems(updatedItems);
}

/**
 * Update a vocabulary item
 */
export async function updateVocabularyItem(id: string, updates: Partial<VocabularyItem>): Promise<VocabularyItem | null> {
  const items = await getVocabularyItems();
  const itemIndex = items.findIndex((item) => item.id === id);

  if (itemIndex === -1) {
    return null;
  }

  const originalItem = items[itemIndex]!;

  // Filter out undefined values from updates to avoid overwriting with undefined
  const filteredUpdates: Partial<VocabularyItem> = {};
  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) {
      // Use type assertion since we know the key is valid and value is not undefined
      (filteredUpdates as any)[key] = value;
    }
  }

  const updatedItem: VocabularyItem = {
    ...originalItem,
    ...filteredUpdates,
    id: originalItem.id, // Ensure ID doesn't change
    originalText: (filteredUpdates.originalText ?? originalItem.originalText) as string,
    translatedText: (filteredUpdates.translatedText ?? originalItem.translatedText) as string,
    sourceLanguage: (filteredUpdates.sourceLanguage ?? originalItem.sourceLanguage) as string,
    targetLanguage: (filteredUpdates.targetLanguage ?? originalItem.targetLanguage) as string,
    platform: (filteredUpdates.platform ?? originalItem.platform) as string,
    timestamp: originalItem.timestamp, // Keep original timestamp for updates, use Date.now() only for new items
    favorite: (filteredUpdates.favorite ?? originalItem.favorite) as boolean,
    reviewCount: (filteredUpdates.reviewCount ?? originalItem.reviewCount) as number,
    // Optional fields
    phonetic: filteredUpdates.phonetic ?? originalItem.phonetic,
    tags: filteredUpdates.tags ?? originalItem.tags,
    notes: filteredUpdates.notes ?? originalItem.notes,
    lastReviewed: filteredUpdates.lastReviewed ?? originalItem.lastReviewed,
    difficulty: filteredUpdates.difficulty ?? originalItem.difficulty,
  };

  items[itemIndex] = updatedItem;
  await saveVocabularyItems(items);
  return updatedItem;
}

/**
 * Toggle favorite status of a vocabulary item
 */
export async function toggleFavorite(id: string): Promise<VocabularyItem | null> {
  const items = await getVocabularyItems();
  const itemIndex = items.findIndex((item) => item.id === id);

  if (itemIndex === -1) {
    return null;
  }

  const originalItem = items[itemIndex]!;

  const updatedItem: VocabularyItem = {
    ...originalItem,
    favorite: !originalItem.favorite,
  };

  items[itemIndex] = updatedItem;
  await saveVocabularyItems(items);
  return updatedItem;
}

/**
 * Mark a vocabulary item as reviewed
 */
export async function markAsReviewed(id: string, difficulty?: "easy" | "medium" | "hard"): Promise<VocabularyItem | null> {
  const items = await getVocabularyItems();
  const itemIndex = items.findIndex((item) => item.id === id);

  if (itemIndex === -1) {
    return null;
  }

  const originalItem = items[itemIndex]!;

  const updatedItem: VocabularyItem = {
    ...originalItem,
    reviewCount: originalItem.reviewCount + 1,
    lastReviewed: Date.now(),
    difficulty: difficulty || originalItem.difficulty || "medium",
  };

  items[itemIndex] = updatedItem;
  await saveVocabularyItems(items);
  return updatedItem;
}

/**
 * Search vocabulary items by text (searches both original and translated text)
 */
export async function searchVocabulary(query: string): Promise<VocabularyItem[]> {
  const items = await getVocabularyItems();
  if (!query.trim()) {
    return items;
  }

  const lowercaseQuery = query.toLowerCase();
  return items.filter(
    (item) =>
      item.originalText.toLowerCase().includes(lowercaseQuery) ||
      item.translatedText.toLowerCase().includes(lowercaseQuery) ||
      item.tags?.some((tag) => tag.toLowerCase().includes(lowercaseQuery)) ||
      item.notes?.toLowerCase().includes(lowercaseQuery),
  );
}

/**
 * Filter vocabulary items by tag
 */
export async function filterByTag(tag: string): Promise<VocabularyItem[]> {
  const items = await getVocabularyItems();
  return items.filter((item) => item.tags?.includes(tag));
}

/**
 * Filter vocabulary items by favorite status
 */
export async function getFavorites(): Promise<VocabularyItem[]> {
  const items = await getVocabularyItems();
  return items.filter((item) => item.favorite);
}

/**
 * Clear all vocabulary items
 */
export async function clearVocabulary(): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [VOCABULARY_STORAGE_KEY]: [] }, () => {
      resolve();
    });
  });
}

/**
 * Export vocabulary items to different formats
 */
export async function exportVocabulary(format: "csv" | "json" | "txt" = "csv"): Promise<string> {
  const items = await getVocabularyItems();

  switch (format) {
    case "csv":
      return exportToCSV(items);
    case "json":
      return exportToJSON(items);
    case "txt":
      return exportToTXT(items);
    default:
      return exportToCSV(items);
  }
}

/**
 * Export to CSV format
 */
function exportToCSV(items: VocabularyItem[]): string {
  const headers = [
    "Original Text",
    "Translated Text",
    "Source Language",
    "Target Language",
    "Platform",
    "Timestamp",
    "Favorite",
    "Tags",
    "Notes",
    "Review Count",
    "Difficulty",
  ];

  const rows = items.map((item) => {
    const timestamp = new Date(item.timestamp).toISOString();
    const tags = item.tags?.join("; ") || "";
    const notes = item.notes?.replace(/"/g, '""') || ""; // Escape quotes for CSV
    return [
      `"${item.originalText.replace(/"/g, '""')}"`,
      `"${item.translatedText.replace(/"/g, '""')}"`,
      item.sourceLanguage,
      item.targetLanguage,
      item.platform,
      timestamp,
      item.favorite ? "Yes" : "No",
      `"${tags}"`,
      `"${notes}"`,
      item.reviewCount,
      item.difficulty || "medium",
    ].join(",");
  });

  return [headers.join(","), ...rows].join("\n");
}

/**
 * Export to JSON format
 */
function exportToJSON(items: VocabularyItem[]): string {
  return JSON.stringify(items, null, 2);
}

/**
 * Export to TXT format
 */
function exportToTXT(items: VocabularyItem[]): string {
  return items
    .map((item) => {
      const timestamp = new Date(item.timestamp).toLocaleString();
      const tags = item.tags?.join(", ") || "No tags";
      const favorite = item.favorite ? "★" : "☆";
      return `
${favorite} ${item.originalText}
  → ${item.translatedText}
  Languages: ${item.sourceLanguage} → ${item.targetLanguage}
  Platform: ${item.platform}
  Added: ${timestamp}
  Tags: ${tags}
  Reviews: ${item.reviewCount} (${item.difficulty || "medium"})
  ${item.notes ? `Notes: ${item.notes}` : ""}
${"-".repeat(50)}`;
    })
    .join("\n");
}

/**
 * Get vocabulary statistics
 */
export async function getVocabularyStats(): Promise<{
  totalItems: number;
  favoritesCount: number;
  byDifficulty: { easy: number; medium: number; hard: number };
  byLanguage: Record<string, number>;
  lastAdded?: number;
}> {
  const items = await getVocabularyItems();

  if (items.length === 0) {
    return {
      totalItems: 0,
      favoritesCount: 0,
      byDifficulty: { easy: 0, medium: 0, hard: 0 },
      byLanguage: {},
    };
  }

  const byDifficulty = {
    easy: items.filter((item) => item.difficulty === "easy").length,
    medium: items.filter((item) => item.difficulty === "medium").length,
    hard: items.filter((item) => item.difficulty === "hard").length,
  };

  const byLanguage: Record<string, number> = {};
  items.forEach((item) => {
    const langPair = `${item.sourceLanguage}-${item.targetLanguage}`;
    byLanguage[langPair] = (byLanguage[langPair] || 0) + 1;
  });

  return {
    totalItems: items.length,
    favoritesCount: items.filter((item) => item.favorite).length,
    byDifficulty,
    byLanguage,
    lastAdded: Math.max(...items.map((item) => item.timestamp)),
  };
}
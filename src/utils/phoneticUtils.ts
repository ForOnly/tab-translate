/**
 * Phonetic (IPA) Utilities
 * Provides functions to get phonetic transcription for words
 */

import { fetchWithTimeout } from "./index.ts";

// Storage keys
const PHONETIC_CONFIG_KEY = "phoneticConfig";

// Default configuration
const DEFAULT_PHONETIC_CONFIG = {
  enabled: true,
  apiProvider: "youdao" as "youdao" | "local" | "custom",
  autoFetch: true,
  showInTranslation: true,
  showAudioButton: true,
};

// Local phonetic database (basic mapping for common words)
const LOCAL_PHONETIC_DB: Record<string, string> = {
  // English words
  hello: "/həˈləʊ/",
  world: "/wɜːld/",
  computer: "/kəmˈpjuːtə/",
  translation: "/trænsˈleɪʃən/",
  dictionary: "/ˈdɪkʃənəri/",
  language: "/ˈlæŋɡwɪdʒ/",
  phonetic: "/fəˈnetɪk/",
  international: "/ˌɪntəˈnæʃənəl/",
  alphabet: "/ˈælfəbet/",
  pronunciation: "/prəˌnʌnsiˈeɪʃən/",

  // Chinese Pinyin (for demonstration)
  你好: "nǐ hǎo",
  谢谢: "xiè xiè",
  再见: "zài jiàn",
  中国: "zhōng guó",
  美国: "měi guó",
};

/**
 * Get phonetic configuration
 */
export async function getPhoneticConfig(): Promise<typeof DEFAULT_PHONETIC_CONFIG> {
  return new Promise((resolve) => {
    chrome.storage.local.get([PHONETIC_CONFIG_KEY], (result) => {
      const config = result[PHONETIC_CONFIG_KEY];
      if (config) {
        resolve(config as typeof DEFAULT_PHONETIC_CONFIG);
      } else {
        // Save default config if not exists
        savePhoneticConfig(DEFAULT_PHONETIC_CONFIG).then(() => {
          resolve(DEFAULT_PHONETIC_CONFIG);
        });
      }
    });
  });
}

/**
 * Save phonetic configuration
 */
export async function savePhoneticConfig(config: typeof DEFAULT_PHONETIC_CONFIG): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [PHONETIC_CONFIG_KEY]: config }, () => {
      resolve();
    });
  });
}

/**
 * Get phonetic information for a word
 */
export async function getPhoneticInfo(
  word: string,
  language: string = "en",
): Promise<PhoneticInfo | null> {
  const config = await getPhoneticConfig();

  if (!config.enabled) {
    return null;
  }

  // Clean the word (remove punctuation, trim)
  const cleanWord = word.trim().replace(/[.,!?;:]/g, "");

  if (!cleanWord) {
    return null;
  }

  try {
    let phoneticInfo: PhoneticInfo | null = null;

    switch (config.apiProvider) {
      case "local":
        phoneticInfo = await getLocalPhonetic(cleanWord, language);
        break;

      case "youdao":
        phoneticInfo = await getYoudaoPhonetic(cleanWord, language);
        break;

      case "custom":
        // Placeholder for custom API implementation
        phoneticInfo = await getLocalPhonetic(cleanWord, language);
        break;
    }

    return phoneticInfo;
  } catch (error) {
    console.error("Failed to get phonetic info:", error);
    return null;
  }
}

/**
 * Get phonetic from local database
 */
async function getLocalPhonetic(word: string, language: string): Promise<PhoneticInfo | null> {
  const lowercaseWord = word.toLowerCase();

  // Check if word exists in local database
  if (LOCAL_PHONETIC_DB[lowercaseWord]) {
    return {
      text: word,
      phonetic: LOCAL_PHONETIC_DB[lowercaseWord],
      source: "local",
    };
  }

  // For Chinese characters, try to generate Pinyin (simplified version)
  if (language.startsWith("zh")) {
    // This is a simplified placeholder - in production you'd use a proper Pinyin library
    return {
      text: word,
      phonetic: `[Chinese: ${word}]`,
      source: "local",
    };
  }

  // For other languages or unknown words, return null
  return null;
}

/**
 * Get phonetic from Youdao API
 * Note: Youdao API requires an API key for production use
 */
async function getYoudaoPhonetic(word: string, language: string): Promise<PhoneticInfo | null> {
  try {
    // Youdao API endpoint
    const url = `https://dict.youdao.com/jsonapi?q=${encodeURIComponent(word)}&type=1`;

    const response = await fetchWithTimeout(url, undefined, 5000);

    if (!response.ok) {
      throw new Error(`Youdao API error: ${response.status}`);
    }

    const data = await response.json();

    // Parse Youdao API response
    const phonetic = parseYoudaoResponse(data, word);

    if (phonetic) {
      return {
        text: word,
        phonetic: phonetic.ipa,
        audioUrl: phonetic.audio,
        source: "youdao",
      };
    }

    return null;
  } catch (error) {
    console.error("Youdao API request failed:", error);
    // Fallback to local database
    return await getLocalPhonetic(word, language);
  }
}

/**
 * Parse Youdao API response
 */
function parseYoudaoResponse(data: any, word: string): { ipa: string; audio?: string } | null {
  try {
    // Youdao API response structure varies
    // This is a simplified parser - actual implementation may need adjustment

    // Check for basic phonetic information
    if (data.basic && data.basic.phonetic) {
      const ipa = `/${data.basic.phonetic}/`;
      let audioUrl: string | undefined;

      // Try to get pronunciation audio URL
      if (data.basic.speech && typeof data.basic.speech === "string") {
        audioUrl = data.basic.speech;
      } else if (data.speakUrl && typeof data.speakUrl === "string") {
        audioUrl = data.speakUrl;
      }

      return { ipa, audio: audioUrl };
    }

    // Check for alternative phonetic sources
    if (data.ec && data.ec.word && Array.isArray(data.ec.word)) {
      for (const wordData of data.ec.word) {
        if (wordData.trs && Array.isArray(wordData.trs)) {
          for (const tr of wordData.trs) {
            if (tr.tr && Array.isArray(tr.tr)) {
              for (const translation of tr.tr) {
                if (translation.l && translation.l.i && Array.isArray(translation.l.i)) {
                  for (const item of translation.l.i) {
                    if (item["#text"] && item["#text"].includes("/")) {
                      const match = item["#text"].match(/\/(.+?)\//);
                      if (match) {
                        return { ipa: `/${match[1]}/` };
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    return null;
  } catch (error) {
    console.error("Failed to parse Youdao response:", error);
    return null;
  }
}

/**
 * Get phonetic for multiple words
 */
export async function getPhoneticForText(
  text: string,
  language: string = "en",
): Promise<PhoneticInfo[]> {
  const config = await getPhoneticConfig();

  if (!config.enabled) {
    return [];
  }

  // Split text into words (simple splitting by spaces)
  const words = text
    .split(/\s+/)
    .map((word) => word.replace(/[.,!?;:]/g, ""))
    .filter((word) => word.length > 1); // Filter out single characters

  const phoneticInfos: PhoneticInfo[] = [];

  for (const word of words) {
    if (word.length > 20) {
      // Skip very long "words" (likely not a single word)
      continue;
    }

    const phoneticInfo = await getPhoneticInfo(word, language);
    if (phoneticInfo) {
      phoneticInfos.push(phoneticInfo);
    }

    // Add small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return phoneticInfos;
}

/**
 * Generate audio URL for pronunciation
 */
export function generateAudioUrl(word: string, language: string = "en"): string | null {
  // Google TTS URL for pronunciation
  const langCode = getLanguageCodeForTTS(language);

  if (!langCode) {
    return null;
  }

  return `https://translate.google.com/translate_tts?client=tw-ob&ie=UTF-8&tl=${langCode}&q=${encodeURIComponent(
    word,
  )}`;
}

/**
 * Get language code for TTS
 */
function getLanguageCodeForTTS(language: string): string | null {
  if (!language) return null;

  const languageMap: Record<string, string> = {
    en: "en",
    "en-US": "en-US",
    "en-GB": "en-GB",
    zh: "zh-CN",
    "zh-CN": "zh-CN",
    "zh-TW": "zh-TW",
    ja: "ja",
    ko: "ko",
    fr: "fr",
    de: "de",
    es: "es",
    ru: "ru",
    it: "it",
    pt: "pt",
  };

  const firstPart = language.split("-")[0] ?? language;
  return languageMap[language] || languageMap[firstPart] || null;
}

/**
 * Check if phonetic feature is available for a language
 */
export function isPhoneticSupported(language: string): boolean {
  if (!language) return false;

  const supportedLanguages = [
    "en",
    "en-US",
    "en-GB",
    "zh",
    "zh-CN",
    "zh-TW",
    "ja",
    "ko",
    "fr",
    "de",
    "es",
    "ru",
    "it",
    "pt",
  ];

  const firstPart = language.split("-")[0] ?? language;
  return supportedLanguages.includes(language) || supportedLanguages.includes(firstPart);
}
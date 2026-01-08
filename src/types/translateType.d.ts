export {};

declare global {
  type TranslateResult = {
    result: string;
    additional: string;
    detectedLanguage: string;
  };

  type TranslatePlatformConfig = Record<string, unknown> | undefined | null;

  type CommonTranslatePlatformConfig = TranslatePlatformConfig & {
    apiKey: string;
  };
  type LanguageMapping = Array<{ code: string; name: string }>;
  type BaiduTranslatePlatformConfig = CommonTranslatePlatformConfig & {
    appid: string;
  };

  type PlatformConfigField = {
    key: string; // 配置字段名，如 "apiKey"、"appid"
    label: string; // 表单显示名称
    type: "text" | "password"; // 输入类型
    value?: string; // 当前值
  };

  type TranslatePlatformConfigSchema = PlatformConfigField[];

  // API Response Types
  type GoogleTranslateResponse = [
    Array<[string, string?, string?]>, // Main translation segments
    Array<[string, string[]]>?, // Dictionary definitions
    string, // Detected language
  ];

  type LibreTranslateResponse = {
    translatedText: string;
    detectedLanguage?: {
      language: string;
      confidence: number;
    };
    alternatives?: string[];
    error?: string;
  };

  type BaiduTranslateResponse = {
    trans_result: Array<{
      src: string;
      dst: string;
    }>;
    from: string;
    to: string;
    error_code?: string;
    error_msg?: string;
  };

  // Translation History Types
  interface TranslationHistoryItem {
    id: string;
    originalText: string;
    translatedText: string;
    sourceLanguage: string;
    targetLanguage: string;
    platform: string;
    timestamp: number;
    additionalInfo?: string;
  }

  interface TranslationHistoryConfig {
    maxHistoryItems: number;
    enabled: boolean;
  }

  // Phonetic (IPA) Types
  interface PhoneticInfo {
    text: string;
    phonetic?: string; // IPA phonetic transcription
    audioUrl?: string; // URL to pronunciation audio
    source?: string; // Source of phonetic data (e.g., "youdao", "local")
  }

  interface PhoneticApiResponse {
    word: string;
    phonetic?: string;
    phonetics?: Array<{
      text?: string;
      audio?: string;
      sourceUrl?: string;
    }>;
    meanings?: Array<{
      partOfSpeech?: string;
      definitions?: Array<{
        definition: string;
        example?: string;
        synonyms?: string[];
        antonyms?: string[];
      }>;
    }>;
  }

  // Vocabulary Book (Word Collection) Types
  interface VocabularyItem {
    id: string;
    originalText: string;
    translatedText: string;
    sourceLanguage: string;
    targetLanguage: string;
    platform: string;
    timestamp: number;
    phonetic?: PhoneticInfo;
    tags?: string[];
    notes?: string;
    favorite: boolean;
    reviewCount: number;
    lastReviewed?: number;
    difficulty?: 'easy' | 'medium' | 'hard';
  }

  interface VocabularyConfig {
    maxVocabularyItems: number;
    enabled: boolean;
    autoAddFavorites: boolean;
    defaultTags: string[];
    exportFormat: 'csv' | 'json' | 'txt';
  }

  // Hover Translation Types
  interface HoverTranslationConfig {
    enabled: boolean;
    delay: number; // ms before showing hover
    position: 'cursor' | 'above' | 'below';
    maxWidth: number;
    maxHeight: number;
    showPhonetic: boolean;
    showFavoriteButton: boolean;
    autoCloseDelay: number;
  }

  interface TranslatePlatform<T extends TranslatePlatformConfig = TranslatePlatformConfig> {
    code: string;
    name: string;
    languages: LanguageMapping;
    defaultDetectLanguage?: string;
    configSchema?: TranslatePlatformConfigSchema;
    getConfig: () => Promise<T>;
    checkPlatform: () => Promise<boolean>;
    translate: (text: string, source: string, target: string) => Promise<TranslateResult>;
  }
}

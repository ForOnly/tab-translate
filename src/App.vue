<template>
  <div id="app">
    <!-- Header -->
    <div class="flex flex-col items-start gap-2 mt-3 w-full">
      <div class="flex items-center gap-2 w-full justify-between">
        <div class="flex items-center gap-2">
          <span class="material-icons text-3xl text-blue-600">translate</span>
          <h1 class="text-3xl font-bold text-blue-600">翻译</h1>
        </div>

        <button
          @click="openConfigForm"
          class="ml-4 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow transition">
          平台配置
        </button>
      </div>

      <!-- Tab Navigation -->
      <div class="flex border-b border-gray-200 w-full mt-3">
        <button
          @click="activeTab = 'translate'"
          :class="[
            'px-4 py-2 font-medium text-sm transition-colors',
            activeTab === 'translate'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          ]">
          <span class="material-icons align-text-bottom text-base mr-1">translate</span>
          翻译
        </button>
        <button
          @click="activeTab = 'history'"
          :class="[
            'px-4 py-2 font-medium text-sm transition-colors',
            activeTab === 'history'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          ]">
          <span class="material-icons align-text-bottom text-base mr-1">history</span>
          历史
        </button>
        <button
          @click="activeTab = 'vocabulary'"
          :class="[
            'px-4 py-2 font-medium text-sm transition-colors',
            activeTab === 'vocabulary'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          ]">
          <span class="material-icons align-text-bottom text-base mr-1">bookmark</span>
          单词本
        </button>
        <button
          @click="activeTab = 'settings'"
          :class="[
            'px-4 py-2 font-medium text-sm transition-colors',
            activeTab === 'settings'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          ]">
          <span class="material-icons align-text-bottom text-base mr-1">settings</span>
          设置
        </button>
      </div>
    </div>

    <div v-if="showConfigForm" class="modal-backdrop">
      <div class="modal-content">
        <PlatformConfigForm
          :platforms="allPlatforms"
          :visible="configVisible"
          @updateConfig="onConfigUpdate"
          @close="closeConfigForm" />
      </div>
    </div>

    <!-- Translation Card (shown when translate tab is active) -->
    <div v-if="activeTab === 'translate'">
      <div
        class="bg-white rounded-2xl shadow-lg p-6 flex flex-col gap-4 overflow-hidden">
        <div class="flex flex-wrap gap-4">
          <!-- 原文区域 -->
          <TranslationCard
            :value="word"
            @update:value="word = $event"
            title="原文"
            :subtitle="getLangName(detectedLang)"
            :is-textarea="true"
            :placeholder="'请输入或粘贴文本...'"
            :content-class="isPlaying ? 'animate-pulse border border-green-300 rounded-lg' : ''" />

          <!-- 翻译区域 -->
          <TranslationCard
            :value="translation"
            title="译文"
            :subtitle="getLangName(selectedLang)"
            :show-copy-button="true"
            :copy-text="translation"
            :copy-button-title="'复制内容'"
            @copy="handleCopy(translation)" />
        </div>

        <!-- Controls -->
        <TranslationControls
          :is-playing="isPlaying"
          :has-text="!!word"
          :selected-lang="selectedLang"
          :selected-platform="selectedPlatform"
          :languages="languages"
          :platforms="platforms"
          @play-voice="playVoice"
          @lang-change="onLangChange"
          @platform-change="onPlatformChange" />

        <!-- Add to Vocabulary Button and Message -->
        <div class="flex flex-wrap justify-between items-center gap-3">
          <button
            class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg shadow transition flex items-center gap-2"
            :disabled="!word || !translation"
            @click="addToVocabularyHandler"
            title="添加到单词本">
            <span class="material-icons text-base">bookmark_add</span>
            <span class="text-sm font-medium">添加到单词本</span>
          </button>

          <div v-if="vocabularyMessage" class="flex-1 max-w-md">
            <div
              class="px-3 py-2 rounded-lg text-sm font-medium"
              :class="{
                'bg-green-100 text-green-800 border border-green-200': vocabularyMessageType === 'success',
                'bg-red-100 text-red-800 border border-red-200': vocabularyMessageType === 'error'
              }">
              {{ vocabularyMessage }}
            </div>
          </div>
        </div>

        <!-- Phonetic Display -->
        <PhoneticDisplay
          v-if="word && detectedLang !== 'auto'"
          :text="word"
          :language="detectedLang"
          :auto-load="true"
          :show-audio-button="true"
          :show-empty="false"
          class="mt-2" />

        <!-- Additional -->
        <AdditionalInfo :content="additional" />

        <!-- Footer -->
        <TranslationFooter :detected-lang="detectedLang" :get-lang-name="getLangName" />
      </div>
    </div>

    <!-- History Panel (shown when history tab is active) -->
    <div v-else-if="activeTab === 'history'" class="bg-white rounded-2xl shadow-lg p-6">
      <TranslationHistory
        :get-lang-name="getLangName"
        @use-history="onUseHistory" />
    </div>

    <!-- Vocabulary Book Panel (shown when vocabulary tab is active) -->
    <div v-else-if="activeTab === 'vocabulary'" class="bg-white rounded-2xl shadow-lg p-6">
      <VocabularyBook
        :get-lang-name="getLangName" />
    </div>

    <!-- Settings Panel (shown when settings tab is active) -->
    <div v-else-if="activeTab === 'settings'" class="bg-white rounded-2xl shadow-lg p-6">
      <SettingsPanel />
    </div>
  </div>
</template>

<script setup lang="ts">
import { debounce } from "@/utils/index.ts";
import { onMounted, onUnmounted, ref, watch } from "vue";
import PlatformConfigForm from "./components/PlatformConfigForm.vue";
import TranslationCard from "./components/TranslationCard.vue";
import TranslationControls from "./components/TranslationControls.vue";
import AdditionalInfo from "./components/AdditionalInfo.vue";
import TranslationFooter from "./components/TranslationFooter.vue";
import PhoneticDisplay from "./components/PhoneticDisplay.vue";
import { BaiduTranslatePlatform, GooglePlatform, LibrePlatform } from "./utils/translate";
import TranslationHistory from "./components/TranslationHistory.vue";
import VocabularyBook from "./components/VocabularyBook.vue";
import SettingsPanel from "./components/SettingsPanel.vue";
import { saveToHistory } from "./utils/historyUtils";
import { addToVocabulary } from "./utils/vocabularyUtils";

const word = ref("");
const translation = ref("");
const additional = ref("");
const detectedLang = ref("auto");
let globalAudio: HTMLAudioElement | null = null;
let storageChangeListener: ((changes: { [key: string]: chrome.storage.StorageChange }) => void) | null = null;
const isPlaying = ref(false);
const platforms = ref<TranslatePlatform[]>([]);
const configVisible = ref<boolean>(false);
const selectedPlatform = ref<TranslatePlatform | null>(null);
const languages = ref<LanguageMapping>([]);
const selectedLang = ref("auto");

const showConfigForm = ref(false);
const copied = ref(false);
const activeTab = ref<"translate" | "history" | "vocabulary" | "settings">("translate");

// Vocabulary message state
const vocabularyMessage = ref("");
const vocabularyMessageType = ref<"success" | "error">("success");

/**
 * Add current translation to vocabulary
 */
async function addToVocabularyHandler() {
  if (!word.value || !translation.value) {
    showVocabularyMessage("请先输入文本并获取翻译", "error");
    return;
  }

  try {
    const platformName = selectedPlatform.value?.name || selectedPlatform.value?.code || "unknown";

    await addToVocabulary(
      word.value,
      translation.value,
      detectedLang.value,
      selectedLang.value,
      platformName,
      undefined, // phonetic (optional)
      [], // tags (optional)
      "" // notes (optional)
    );

    showVocabularyMessage("已成功添加到单词本", "success");

    // Optionally switch to vocabulary tab
    // activeTab.value = "vocabulary";

  } catch (error) {
    console.error("Failed to add to vocabulary:", error);
    showVocabularyMessage(`添加失败: ${error instanceof Error ? error.message : "未知错误"}`, "error");
  }
}

/**
 * Show vocabulary message with auto-clear
 */
function showVocabularyMessage(message: string, type: "success" | "error") {
  vocabularyMessage.value = message;
  vocabularyMessageType.value = type;

  // Clear message after 3 seconds
  setTimeout(() => {
    vocabularyMessage.value = "";
  }, 3000);
}

// Watch selectedLang and save to storage
watch(selectedLang, (newLang) => {
  if (newLang && newLang !== "auto") {
    chrome.storage.local.set({ targetLanguage: newLang });
  }
});

const openConfigForm = () => {
  showConfigForm.value = true;
};

const closeConfigForm = () => {
  showConfigForm.value = false;
};

const handleCopy = (text: string) => {
  navigator.clipboard.writeText(text).then(() => {
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 1000);
  });
};

const onConfigUpdate = (configs: Record<string, Record<string, string>>) => {
  // 收集所有配置字段到一个对象中
  const saveData: Record<string, string> = {};

  // 遍历每个平台
  for (const platformCode in configs) {
    const platformConfig = configs[platformCode];

    // 遍历每个平台的每个字段
    for (const fieldKey in platformConfig) {
      const fieldValue = platformConfig[fieldKey];
      saveData[fieldKey] = fieldValue || "";
    }
  }

  // 批量保存所有字段
  chrome.storage.local
    .set(saveData)
    .then(() => {
      console.log("All configuration values saved");
      return getValidPlatforms(allPlatforms);
    })
    .then((res) => {
      platforms.value = res;

      // Update selected platform to match the new platform list
      if (selectedPlatform.value && res.length > 0) {
        // Try to find the same platform by code
        const foundPlatform = res.find(p => p.code === selectedPlatform.value!.code);
        if (foundPlatform) {
          selectedPlatform.value = foundPlatform;
        } else {
          // Fallback to first available platform
          selectedPlatform.value = res[0]!;
        }
      } else if (res.length > 0) {
        selectedPlatform.value = res[0]!;
      } else {
        selectedPlatform.value = null;
      }

      // Update languages and selected language based on the selected platform
      languages.value = selectedPlatform.value?.languages ?? [];
      if (selectedPlatform.value && languages.value.length > 0) {
        // Try to keep current language if it exists in new language list
        const currentLang = selectedLang.value;
        const langExists = languages.value.some(lang => lang.code === currentLang);
        if (langExists && currentLang !== "auto") {
          // Keep current language
          selectedLang.value = currentLang;
        } else {
          // Use platform default or first available language
          selectedLang.value = selectedPlatform.value.defaultDetectLanguage ?? languages.value[0]?.code ?? "auto";
        }
      } else {
        selectedLang.value = "auto";
      }
    })
    .catch((error) => {
      console.error("Failed to save configuration:", error);
      // 可以在这里添加用户通知
    })
    .finally(() => {
      // 关闭配置表单
      closeConfigForm();
    });
};
const allPlatforms: TranslatePlatform[] = [new GooglePlatform(), new LibrePlatform(), new BaiduTranslatePlatform()];

onMounted(async () => {
  platforms.value = await getValidPlatforms(allPlatforms);
  selectedPlatform.value = platforms.value[0]!;
  languages.value = selectedPlatform.value?.languages ?? [];

  // Try to load saved target language from storage
  try {
    const savedLang = await new Promise<string>((resolve) => {
      chrome.storage.local.get(["targetLanguage"], (result) => {
        resolve(result.targetLanguage || "");
      });
    });

    // Check if saved language is valid for current platform
    const isValidLang = languages.value.some(lang => lang.code === savedLang);
    if (savedLang && isValidLang) {
      selectedLang.value = savedLang;
    } else {
      selectedLang.value = selectedPlatform.value?.defaultDetectLanguage ?? languages.value[0]?.code ?? "auto";
    }
  } catch (error) {
    console.error("Failed to load target language from storage:", error);
    selectedLang.value = selectedPlatform.value?.defaultDetectLanguage ?? languages.value[0]?.code ?? "auto";
  }
});

watch(word, () => {
  debouncedTranslate();
});

const getValidPlatforms = async (platforms: TranslatePlatform[]): Promise<TranslatePlatform[]> => {
  // 并行检测每个平台
  const results = await Promise.all(
    platforms.map(async (platform) => ({
      platform,
      ok: await platform.checkPlatform(),
    })),
  );

  // 过滤出可用的平台
  return results.filter((r) => r.ok).map((r) => r.platform);
};

const getLangName = (code: string) => {
  const lang = languages.value?.find((l) => l.code === code);
  return lang ? lang.name : code;
};
const debouncedTranslate = debounce(() => {
  const platform = selectedPlatform.value;
  if (!platform) return;
  platform
    .translate(word.value, "auto", selectedLang.value)
    .then((resp) => {
      translation.value = resp.result;
      additional.value = resp.additional;
      detectedLang.value = resp.detectedLanguage;

      // Save to translation history
      if (word.value.trim() && resp.result.trim()) {
        saveToHistory(
          word.value,
          resp.result,
          resp.detectedLanguage || "auto",
          selectedLang.value,
          platform.name || platform.code,
          resp.additional,
        ).catch((error) => {
          console.error("Failed to save translation history:", error);
        });
      }
    })
    .catch((error) => {
      console.error("Translation failed:", error);
      translation.value = "Translation error: " + (error.message || "Unknown error");
      additional.value = "";
    });
}, 200);

const onUseHistory = (historyItem: TranslationHistoryItem) => {
  // Switch to translate tab
  activeTab.value = "translate";

  // Set the original text
  word.value = historyItem.originalText;

  // Set the translated text
  translation.value = historyItem.translatedText;

  // Set additional info if available
  additional.value = historyItem.additionalInfo || "";

  // Update detected language
  detectedLang.value = historyItem.sourceLanguage;

  // Try to set the target language if it exists in current languages
  const targetLangExists = languages.value.some(lang => lang.code === historyItem.targetLanguage);
  if (targetLangExists) {
    selectedLang.value = historyItem.targetLanguage;
  }

  // Try to select the platform if it exists
  const platformExists = platforms.value.some(p =>
    p.code === historyItem.platform || p.name === historyItem.platform
  );
  if (platformExists && selectedPlatform.value) {
    const platform = platforms.value.find(p =>
      p.code === historyItem.platform || p.name === historyItem.platform
    );
    if (platform) {
      selectedPlatform.value = platform;
      languages.value = platform.languages;
    }
  }
};

const translateStorageWord = () => {
  chrome.storage.session.get("lastWord", ({ lastWord }) => {
    if (!lastWord) return;
    word.value = lastWord;
    debouncedTranslate();
  });
};

const onLangChange = (lang?: string) => {
  if (lang) {
    selectedLang.value = lang;
  }
  debouncedTranslate();
};
const onPlatformChange = (platform?: any) => {
  getValidPlatforms(allPlatforms)
    .then((res) => {
      platforms.value = res;

      // Update selected platform
      if (platform && res.length > 0) {
        // Try to find the selected platform in valid platforms
        const foundPlatform = res.find(p => p.code === platform.code);
        if (foundPlatform) {
          selectedPlatform.value = foundPlatform;
        } else {
          // Fallback to first available platform
          selectedPlatform.value = res[0]!;
        }
      } else if (res.length > 0) {
        selectedPlatform.value = res[0]!;
      } else {
        selectedPlatform.value = null;
      }

      // Update languages and selected language
      languages.value = selectedPlatform.value?.languages ?? [];
      if (selectedPlatform.value && languages.value.length > 0) {
        // Try to keep current language if it exists in new language list
        const currentLang = selectedLang.value;
        const langExists = languages.value.some(lang => lang.code === currentLang);
        if (langExists && currentLang !== "auto") {
          // Keep current language
          selectedLang.value = currentLang;
        } else {
          // Use platform default or first available language
          selectedLang.value = selectedPlatform.value.defaultDetectLanguage ?? languages.value[0]?.code ?? "auto";
        }
      } else {
        selectedLang.value = "auto";
      }
    })
    .then(() => debouncedTranslate());
};

/**
 * 播放 Google TTS 音频
 * @param text 要播放的文本
 * @param language 语言代码，如 "zh-CN", "en"
 */
async function voice(text: string, language: string): Promise<void> {
  // 如果已有音频在播放，则停止并重置
  if (globalAudio) {
    globalAudio.pause();
    globalAudio.currentTime = 0;
  }

  // 生成 TTS URL 并加入随机参数避免缓存
  const url: string =
    "https://translate.google.com/translate_tts" +
    "?client=tw-ob" +
    "&ie=UTF-8" +
    "&tl=" +
    encodeURIComponent(language) +
    "&q=" +
    encodeURIComponent(text) +
    "&_=" +
    Date.now();

  // 创建新的 audio 实例
  globalAudio = new Audio();
  globalAudio.src = url;

  try {
    isPlaying.value = true;
    await globalAudio.play();
    globalAudio.onended = () => {
      isPlaying.value = false;
    };
  } catch (err) {
    console.error("音频播放失败:", err);
    isPlaying.value = false;
  }
}

const playVoice = () => {
  if (!word.value) return;
  voice(word.value, detectedLang.value);
};

storageChangeListener = (changes: { [key: string]: chrome.storage.StorageChange }) => {
  console.log(changes);
  const lastWordChange = changes.lastWord?.newValue;
  if (!lastWordChange) return;
  translateStorageWord();
};
chrome.storage.session.onChanged.addListener(storageChangeListener);

// Cleanup on component unmount
onUnmounted(() => {
  if (storageChangeListener) {
    chrome.storage.session.onChanged.removeListener(storageChangeListener);
  }
  if (globalAudio) {
    globalAudio.pause();
    globalAudio = null;
  }
});

// 页面加载时先执行以此
translateStorageWord();
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Material+Icons");

#app {
  font-family: "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  min-height: 100vh;
  margin: 0 0.75rem 0 0.75rem;
  color: var(--color-text);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

select {
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  font-size: var(--font-size-sm);
}

/* 简单上下跳动动画 */
@keyframes bounce {
  0% {
    transform: translateY(0);
  }
  100% {
    transform: translateY(-5px);
  }
}

@keyframes highlight {
  from {
    background-position: 200% 0;
  }
  to {
    background-position: -200% 0;
  }
}

</style>

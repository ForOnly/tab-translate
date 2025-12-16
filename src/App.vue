<template>
  <div id="app">
    <!-- Header -->
    <div class="flex flex-col items-start gap-2 mt-5 w-full">
      <div class="flex items-center gap-2 w-full justify-between">
        <div class="flex items-center gap-2">
          <span class="material-icons text-3xl text-blue-600">translate</span>
          <h1 class="text-3xl font-bold text-blue-600">Translate</h1>
        </div>

        <button
          @click="openConfigForm"
          class="ml-4 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow transition">
          平台配置
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

    <!-- Translation Card -->
    <div
      class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-lg p-6 flex flex-col gap-4 overflow-hidden">
      <div class="flex flex-wrap gap-4">
        <!-- 原文区域 -->
        <div class="flex-1 min-w-[260px] bg-white rounded-xl p-4 shadow-md flex flex-col min-h-[150px] max-h-[570px]">
          <h2 class="text-gray-600 text-base font-medium">Original ({{ getLangName(detectedLang) }})</h2>
          <div class="h-px bg-slate-300 my-2"></div>

          <textarea
            v-model="word"
            placeholder="Select a word or type here..."
            class="flex-1 text-sm leading-relaxed font-mono text-slate-700 resize-none outline-none bg-transparent"
            :class="{ 'animate-pulse border-2 rounded-xl border-green-700': isPlaying }"></textarea>
        </div>

        <!-- 翻译区域 -->
        <div class="flex-1 min-w-[260px] bg-white rounded-xl p-4 shadow-md flex flex-col min-h-[150px] max-h-[570px]">
          <div class="w-full flex justify-between items-center">
            <h2 class="text-gray-600 text-base font-medium">Translation ({{ getLangName(selectedLang) }})</h2>
            <button
              :disabled="!translation"
              class="p-1 rounded-md text-sm text-gray-400 hover:text-gray-600 hover:bg-gray-100 active:scale-95 transition"
              title="复制内容"
              :class="{ '!text-green-700': copied }"
              @click="handleCopy(translation)">
              {{ copied ? "copied" : "❐" }}
            </button>
          </div>

          <div class="h-px bg-slate-300 my-2"></div>
          <div class="text-sm whitespace-pre-wrap break-all flex-1 overflow-y-auto">
            {{ translation }}
          </div>
        </div>
      </div>

      <!-- Controls -->
      <div class="flex flex-wrap justify-end items-center gap-4">
        <button
          class="w-10 h-10 flex items-center justify-center rounded-full bg-gray-600 hover:bg-gray-700 text-white text-lg shadow transition"
          :class="{ 'animate-bounce bg-gray-700': isPlaying }"
          :disabled="!word"
          @click="playVoice">
          🔊
        </button>

        <select
          v-model="selectedLang"
          @change="onLangChange"
          class="px-3 py-1.5 border border-gray-300 rounded-lg text-sm shadow-sm">
          <option v-for="lang in languages" :key="lang.code" :value="lang.code">
            {{ lang.name }}
          </option>
        </select>
        <select
          v-model="selectedPlatform"
          @change="onPlatformChange"
          class="px-3 py-1.5 border border-gray-300 rounded-lg text-sm shadow-sm">
          <option v-for="p in platforms" :key="p.code" :value="p">
            {{ p.name }}
          </option>
        </select>
      </div>

      <!-- Additional -->
      <div
        v-if="additional"
        class="bg-blue-100 p-3 rounded-xl max-h-[160px] overflow-y-auto text-sm"
        v-html="additional"></div>

      <!-- Footer -->
      <div class="text-sm text-right text-gray-600">Detected language: {{ getLangName(detectedLang) }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { debounce } from "@/utils/index.ts";
import { onMounted, ref, watch } from "vue";
import PlatformConfigForm from "./components/PlatformConfigForm.vue";
import { BaiduTranslatePlatform, GooglePlatform, LibrePlatform } from "./utils/translate";

const word = ref("");
const translation = ref("");
const additional = ref("");
const detectedLang = ref("auto");
let globalAudio: HTMLAudioElement | null = null;
const isPlaying = ref(false);
const platforms = ref<TranslatePlatform[]>([]);
const configVisible = ref<boolean>(false);
const selectedPlatform = ref<TranslatePlatform | null>(null);
const languages = ref<LanguageMapping>([]);
const selectedLang = ref("auto");

const showConfigForm = ref(false);
const copied = ref(false);

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
  // 遍历每个平台
  for (const platformCode in configs) {
    const platformConfig = configs[platformCode];

    // 遍历每个平台的每个字段
    for (const fieldKey in platformConfig) {
      const fieldValue = platformConfig[fieldKey];

      // 单独保存每个字段
      chrome.storage.local.set({ [fieldKey]: fieldValue }).then(() => {
        console.log("Value is set:", { fieldKey });
      });
    }
  }
  getValidPlatforms(allPlatforms).then((res) => {
    platforms.value = res;
    languages.value = selectedPlatform.value?.languages ?? [];
    selectedLang.value = selectedPlatform.value?.defaultDetectLanguage ?? languages.value[0]?.code ?? "auto";
  });

  // 关闭配置表单
  closeConfigForm();
};
const allPlatforms: TranslatePlatform[] = [new GooglePlatform(), new LibrePlatform(), new BaiduTranslatePlatform()];

onMounted(async () => {
  platforms.value = await getValidPlatforms(allPlatforms);
  selectedPlatform.value = platforms.value[0]!;
  languages.value = selectedPlatform.value?.languages ?? [];
  selectedLang.value = selectedPlatform.value?.defaultDetectLanguage ?? languages.value[0]?.code ?? "auto";
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
  platform.translate(word.value, "auto", selectedLang.value).then((resp: any) => {
    translation.value = resp.result;
    additional.value = resp.additional;
    detectedLang.value = resp.detectedLanguage;
  });
}, 200);
const translateStorageWord = () => {
  chrome.storage.session.get("lastWord", ({ lastWord }) => {
    if (!lastWord) return;
    word.value = lastWord;
    debouncedTranslate();
  });
};

const onLangChange = () => debouncedTranslate();
const onPlatformChange = () => {
  getValidPlatforms(allPlatforms)
    .then((res) => {
      platforms.value = res;
      languages.value = selectedPlatform.value?.languages ?? [];
      selectedLang.value = selectedPlatform.value?.defaultDetectLanguage ?? languages.value[0]?.code ?? "auto";
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

chrome.storage.session.onChanged.addListener((changes) => {
  const lastWordChange = changes["lastWord"];
  if (!lastWordChange) return;
  translateStorageWord();
});

// 页面加载时先执行以此
translateStorageWord();
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Material+Icons");

#app {
  font-family: "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  min-height: 100vh;
  margin: 0 1rem 0 1rem;
  color: #333;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Header */
.header {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.logo .material-icons {
  font-size: 2rem;
  color: #0052cc;
}

.logo h1 {
  font-size: 2rem;
  font-weight: 700;
  color: #0052cc;
  margin: 0;
}

.sub-title {
  font-size: 0.95rem;
  color: #666;
}

/* Card */
.card {
  background: linear-gradient(135deg, #f0f4ff, #e6f0ff);
  border-radius: 16px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.card-content {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.text-block {
  flex: 1;
  min-width: 250px;
  background-color: #fff;
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  max-height: 200px; /* 整体高度固定 */
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
}

.text-block h2 {
  margin: 0;
  font-size: 1rem;
  color: #555;
}

.divider {
  height: 1px;
  background-color: #d0d7e0;
  margin: 0.3rem 0 0.6rem 0;
  border-radius: 1px;
}

.text-block p {
  margin: 0.5rem 0 0 0;
  word-wrap: break-word;
  white-space: pre-wrap;
}

.scroll-content {
  overflow-y: auto;
  flex: 1; /* 占满剩余高度，使标题固定 */
  word-wrap: break-word;
  white-space: pre-wrap;
}

.card-controls {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 0.8rem;
}

select {
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  border: 1px solid #bbb;
  font-size: 0.95rem;
}

.btn-voice {
  border: none;
  background-color: #0052cc;
  color: #fff;
  font-size: 1.2rem;
  padding: 0.4rem 0.6rem;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-voice.playing {
  animation: bounce 0.5s infinite alternate;
  background-color: #0066ff;
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

.btn-voice:hover:not(:disabled) {
  transform: scale(1.1);
  background-color: #0066ff;
}

.btn-voice:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Additional info */
.additional-card {
  background-color: #e0ebff;
  padding: 0.8rem 1rem;
  border-radius: 12px;
  max-height: 150px;
  overflow-y: auto;
}

/* Footer */
.card-footer {
  font-size: 0.85rem;
  color: #666;
  text-align: right;
}

/* Info and links */
.info {
  font-size: 0.85rem;
  color: #444;
}

.link {
  color: #0052cc;
  font-weight: 500;
  text-decoration: none;
}

.link:hover {
  text-decoration: underline;
}

/* Origin 输入区域（可编辑） */
.origin-editable {
  width: 100%;
  min-height: 100%;
  outline: none;
  border: none;
  padding: 0; /* 去掉多余 padding */
  margin: 0.5rem 0 0 0; /* 和 <p> 保持一致 */
  font-size: 0.8rem; /* 和 <p> 一致 */
  line-height: 1.5; /* 与 p 的行高一致 */
  color: #333;
  word-wrap: break-word;
  white-space: pre-wrap;
}

.origin-editable.playing {
  background: linear-gradient(90deg, rgba(255, 255, 0, 0.2) 50%, transparent 50%);
  background-size: 200% 100%;
  animation: highlight 2s linear infinite;
}

@keyframes highlight {
  from {
    background-position: 200% 0;
  }
  to {
    background-position: -200% 0;
  }
}

/* 内容为空时显示 placeholder */
.origin-editable:empty:before {
  content: "Select a word or type here...";
  color: #999;
  font-size: 0.95rem;
  line-height: 1.5;
  pointer-events: none;
}

.origin-editable::-webkit-scrollbar {
  width: 6px;
  background: transparent;
}

.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  /* padding: 1.5rem; */
  border-radius: 12px;
  min-width: 350px;
}
</style>

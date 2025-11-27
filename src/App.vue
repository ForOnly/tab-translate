<template>
  <div id="app">
    <!-- Header -->
    <div class="header">
      <div class="logo">
        <span class="material-icons">translate</span>
        <h1>Translate Panel</h1>
      </div>
      <!-- <p class="sub-title">Highlight text anywhere to translate it.</p> -->
    </div>

    <!-- Translation Card -->
    <div class="card">
      <div class="card-content">
        <!-- 原文区域 -->
        <div class="text-block input-block">
          <h2>Original ({{ getLangName(detectedLang) }})</h2>
          <div class="divider"></div>
          <div class="scroll-content">
            <div
              class="origin-editable"
              contenteditable="true"
              @input="onOriginInput"
            >
              {{ word }}
            </div>
            <!-- <p>{{ word || "Select a word" }}</p> -->
          </div>
        </div>
        <!-- 翻译区域 -->
        <div class="text-block output-block">
          <h2>Translation ({{ getLangName(selectedLang) }})</h2>
          <div class="divider"></div>
          <div class="scroll-content">
            <p>{{ translation }}</p>
          </div>
        </div>
      </div>

      <!-- Controls -->
      <div class="card-controls">
        <select v-model="selectedLang" @change="onLangChange">
          <option v-for="lang in languages" :key="lang.code" :value="lang.code">
            {{ lang.name }}
          </option>
        </select>

        <button
          class="btn-voice"
          :disabled="!word"
          @click="playVoice"
          :title="word ? 'Play pronunciation' : 'No word selected'"
        >
          🔊
        </button>
      </div>

      <!-- Additional Info -->
      <div v-if="additional" class="additional-card" v-html="additional"></div>

      <!-- Footer -->
      <div class="card-footer">
        Detected language: {{ getLangName(detectedLang) }}
      </div>
    </div>

    <p class="info">
      Highlight or right-click text and click the Translate icon to translate
      it.
    </p>

    <a href="https://translate.google.com/" target="_blank" class="link">
      Google Translate
    </a>
  </div>
</template>

<script setup lang="ts">
import { debounce } from "@/utils/index.ts";
import { ref } from "vue";

const word = ref("");
const translation = ref("");
const additional = ref("");
const detectedLang = ref("auto");

// 支持的语言列表（完整示例）
const languages = ref([
  { code: "en", name: "English" },
  { code: "zh-CN", name: "中文" },
  { code: "fr", name: "Français" },
  { code: "de", name: "Deutsch" },
  { code: "ko", name: "한국어" },
  { code: "ja", name: "日本語" },
  { code: "es", name: "Español" },
  { code: "ru", name: "Русский" },
  { code: "it", name: "Italiano" },
  { code: "pt", name: "Português" },
]);

const selectedLang = ref("zh-CN");

const getLangName = (code: string) => {
  const lang = languages.value.find((l) => l.code === code);
  return lang ? lang.name : code;
};
const debouncedTranslate = debounce(() => {
  translate(word.value, "auto", selectedLang.value).then((resp: any) => {
    translation.value = resp.result;
    additional.value = resp.additional;
    detectedLang.value = resp.detectedLanguage;
  });
}, 200);
const translateWord = () => {
  chrome.storage.session.get("lastWord", ({ lastWord }) => {
    if (!lastWord) return;
    word.value = lastWord;
    debouncedTranslate();
  });
};

const onLangChange = () => translateWord();

const onOriginInput = (event: any) => {
  const text = event.target.innerText.trim();
  word.value = text;
  debouncedTranslate();
};

const playVoice = () => {
  if (!word.value) return;
  const utter = new SpeechSynthesisUtterance(word.value);
  utter.lang = selectedLang.value;
  speechSynthesis.speak(utter);
};

async function translate(
  text: string,
  sourceLanguage: string,
  targetLanguage: string
) {
  const url =
    "https://translate.googleapis.com/translate_a/single?client=gtx&dt=t&dt=bd" +
    `&sl=${encodeURIComponent(sourceLanguage)}&tl=${encodeURIComponent(
      targetLanguage
    )}` +
    `&q=${encodeURIComponent(text)}`;

  const response = await fetch(url).then((res) => res.json());
  const result = response[0].map((v: any) => v[0]).join("");
  let additional = "";
  if (response[1]) {
    response[1].forEach((v: any) => {
      additional += "<h3>" + v[0] + "</h3>";
      additional +=
        "<ol>" +
        v[1].map((item: any) => "<li>" + item + "</li>").join("") +
        "</ol>";
    });
  }
  const detectedLanguage = response[2];
  return { result, additional, detectedLanguage };
}

chrome.storage.session.onChanged.addListener((changes) => {
  const lastWordChange = changes["lastWord"];
  if (!lastWordChange) return;
  translateWord();
});
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
</style>

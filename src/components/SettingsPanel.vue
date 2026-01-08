<template>
  <div class="settings-panel">
    <!-- Header -->
    <div class="flex items-center gap-2 mb-6">
      <span class="material-icons text-2xl text-blue-600">settings</span>
      <h2 class="text-xl font-bold text-blue-600">设置</h2>
    </div>

    <!-- Hover Translation Settings -->
    <div class="settings-section mb-6">
      <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <span class="material-icons text-base">open_in_new</span>
        悬浮翻译设置
      </h3>

      <div class="space-y-4">
        <!-- Enable hover translation -->
        <div class="setting-item">
          <label class="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              v-model="hoverConfig.enabled"
              @change="saveHoverConfig"
              class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
            <span class="text-sm font-medium text-gray-700">启用悬浮翻译</span>
          </label>
          <p class="text-xs text-gray-500 mt-1 ml-7">选中文本时显示悬浮翻译框</p>
        </div>

        <!-- Hover position -->
        <div class="setting-item">
          <label class="block text-sm font-medium text-gray-700 mb-1">悬浮位置</label>
          <select
            v-model="hoverConfig.position"
            @change="saveHoverConfig"
            class="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option value="cursor">跟随光标</option>
            <option value="above">在文字上方</option>
            <option value="below">在文字下方</option>
          </select>
        </div>

        <!-- Show phonetic in hover -->
        <div class="setting-item">
          <label class="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              v-model="hoverConfig.showPhonetic"
              @change="saveHoverConfig"
              class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
            <span class="text-sm font-medium text-gray-700">在悬浮框中显示音标</span>
          </label>
        </div>

        <!-- Show favorite button -->
        <div class="setting-item">
          <label class="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              v-model="hoverConfig.showFavoriteButton"
              @change="saveHoverConfig"
              class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
            <span class="text-sm font-medium text-gray-700">显示收藏按钮</span>
          </label>
        </div>

        <!-- Hover delay -->
        <div class="setting-item">
          <label class="block text-sm font-medium text-gray-700 mb-1">
            显示延迟: {{ hoverConfig.delay }}ms
          </label>
          <input
            type="range"
            v-model="hoverConfig.delay"
            @change="saveHoverConfig"
            min="100"
            max="1000"
            step="100"
            class="w-full max-w-xs h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
        </div>

        <!-- Auto close delay -->
        <div class="setting-item">
          <label class="block text-sm font-medium text-gray-700 mb-1">
            自动关闭延迟: {{ hoverConfig.autoCloseDelay }}ms
          </label>
          <input
            type="range"
            v-model="hoverConfig.autoCloseDelay"
            @change="saveHoverConfig"
            min="1000"
            max="10000"
            step="1000"
            class="w-full max-w-xs h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
          <p class="text-xs text-gray-500 mt-1">设为0表示不自动关闭</p>
        </div>
      </div>
    </div>

    <!-- Phonetic Settings -->
    <div class="settings-section mb-6">
      <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <span class="material-icons text-base">phonetics</span>
        音标设置
      </h3>

      <div class="space-y-4">
        <!-- Enable phonetic display -->
        <div class="setting-item">
          <label class="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              v-model="phoneticConfig.enabled"
              @change="savePhoneticConfig"
              class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
            <span class="text-sm font-medium text-gray-700">启用音标显示</span>
          </label>
        </div>

        <!-- Show phonetic in translation -->
        <div v-if="phoneticConfig.enabled" class="setting-item ml-6">
          <label class="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              v-model="phoneticConfig.showInTranslation"
              @change="savePhoneticConfig"
              class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
            <span class="text-sm font-medium text-gray-700">在翻译结果中显示音标</span>
          </label>
        </div>

        <!-- Show audio button -->
        <div v-if="phoneticConfig.enabled" class="setting-item ml-6">
          <label class="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              v-model="phoneticConfig.showAudioButton"
              @change="savePhoneticConfig"
              class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
            <span class="text-sm font-medium text-gray-700">显示发音按钮</span>
          </label>
        </div>

        <!-- API provider -->
        <div v-if="phoneticConfig.enabled" class="setting-item">
          <label class="block text-sm font-medium text-gray-700 mb-1">音标数据源</label>
          <select
            v-model="phoneticConfig.apiProvider"
            @change="savePhoneticConfig"
            class="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option value="local">本地数据库</option>
            <option value="youdao">有道API</option>
          </select>
          <p class="text-xs text-gray-500 mt-1">本地数据库包含常见单词，有道API需要网络连接</p>
        </div>
      </div>
    </div>

    <!-- Side Panel Coordination -->
    <div class="settings-section mb-6">
      <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <span class="material-icons text-base">sync</span>
        侧边栏协调
      </h3>

      <div class="space-y-4">
        <!-- Enable simultaneous hover and side panel -->
        <div class="setting-item">
          <label class="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              v-model="sidePanelCoordination.enableSimultaneous"
              @change="saveSidePanelCoordination"
              class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
            <span class="text-sm font-medium text-gray-700">同时启用悬浮翻译和侧边栏</span>
          </label>
          <p class="text-xs text-gray-500 mt-1 ml-7">侧边栏打开时仍显示悬浮翻译框</p>
        </div>
      </div>
    </div>

    <!-- Save status -->
    <div v-if="saveStatus" class="mt-6 p-3 rounded-lg text-sm font-medium" :class="saveStatusClass">
      {{ saveStatus }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";

// Hover translation configuration
interface HoverTranslationConfig {
  enabled: boolean;
  delay: number;
  position: 'cursor' | 'above' | 'below';
  maxWidth: number;
  maxHeight: number;
  showPhonetic: boolean;
  showFavoriteButton: boolean;
  autoCloseDelay: number;
}

// Phonetic configuration
interface PhoneticConfig {
  enabled: boolean;
  apiProvider: 'youdao' | 'local' | 'custom';
  autoFetch: boolean;
  showInTranslation: boolean;
  showAudioButton: boolean;
}

// Side panel coordination
interface SidePanelCoordination {
  enableSimultaneous: boolean;
}

// Default configurations
const DEFAULT_HOVER_CONFIG: HoverTranslationConfig = {
  enabled: true,
  delay: 300,
  position: 'cursor',
  maxWidth: 300,
  maxHeight: 200,
  showPhonetic: true,
  showFavoriteButton: true,
  autoCloseDelay: 3000,
};

const DEFAULT_PHONETIC_CONFIG: PhoneticConfig = {
  enabled: true,
  apiProvider: 'local',
  autoFetch: true,
  showInTranslation: true,
  showAudioButton: true,
};

const DEFAULT_SIDE_PANEL_COORDINATION: SidePanelCoordination = {
  enableSimultaneous: false,
};

// Reactive state
const hoverConfig = ref<HoverTranslationConfig>({ ...DEFAULT_HOVER_CONFIG });
const phoneticConfig = ref<PhoneticConfig>({ ...DEFAULT_PHONETIC_CONFIG });
const sidePanelCoordination = ref<SidePanelCoordination>({ ...DEFAULT_SIDE_PANEL_COORDINATION });
const saveStatus = ref("");
const saveStatusClass = ref("");

// Load configurations from storage
async function loadConfigurations() {
  try {
    // Load hover config
    const hoverConfigData = await new Promise<HoverTranslationConfig>((resolve) => {
      chrome.storage.local.get(['hoverConfig'], (result) => {
        if (result.hoverConfig) {
          resolve({ ...DEFAULT_HOVER_CONFIG, ...result.hoverConfig });
        } else {
          resolve(DEFAULT_HOVER_CONFIG);
        }
      });
    });
    hoverConfig.value = hoverConfigData;

    // Load phonetic config
    const phoneticConfigData = await new Promise<PhoneticConfig>((resolve) => {
      chrome.storage.local.get(['phoneticConfig'], (result) => {
        if (result.phoneticConfig) {
          resolve({ ...DEFAULT_PHONETIC_CONFIG, ...result.phoneticConfig });
        } else {
          resolve(DEFAULT_PHONETIC_CONFIG);
        }
      });
    });
    phoneticConfig.value = phoneticConfigData;

    // Load side panel coordination (custom storage key)
    const sidePanelData = await new Promise<SidePanelCoordination>((resolve) => {
      chrome.storage.local.get(['sidePanelCoordination'], (result) => {
        if (result.sidePanelCoordination) {
          resolve({ ...DEFAULT_SIDE_PANEL_COORDINATION, ...result.sidePanelCoordination });
        } else {
          resolve(DEFAULT_SIDE_PANEL_COORDINATION);
        }
      });
    });
    sidePanelCoordination.value = sidePanelData;

  } catch (error) {
    console.error("Failed to load configurations:", error);
  }
}

// Save hover configuration
async function saveHoverConfig() {
  try {
    await new Promise<void>((resolve) => {
      chrome.storage.local.set({ hoverConfig: hoverConfig.value }, () => {
        resolve();
      });
    });
    showSaveStatus("悬浮翻译设置已保存", "success");

    // Notify content script about config change
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'UPDATE_HOVER_CONFIG',
          config: hoverConfig.value
        }).catch(error => {
          // Content script might not be loaded, ignore
          console.debug('Could not notify content script:', error);
        });
      }
    });
  } catch (error) {
    console.error("Failed to save hover config:", error);
    showSaveStatus("保存失败", "error");
  }
}

// Save phonetic configuration
async function savePhoneticConfig() {
  try {
    await new Promise<void>((resolve) => {
      chrome.storage.local.set({ phoneticConfig: phoneticConfig.value }, () => {
        resolve();
      });
    });
    showSaveStatus("音标设置已保存", "success");
  } catch (error) {
    console.error("Failed to save phonetic config:", error);
    showSaveStatus("保存失败", "error");
  }
}

// Save side panel coordination
async function saveSidePanelCoordination() {
  try {
    await new Promise<void>((resolve) => {
      chrome.storage.local.set({ sidePanelCoordination: sidePanelCoordination.value }, () => {
        resolve();
      });
    });
    showSaveStatus("侧边栏协调设置已保存", "success");
  } catch (error) {
    console.error("Failed to save side panel coordination:", error);
    showSaveStatus("保存失败", "error");
  }
}

// Show save status message
function showSaveStatus(message: string, type: 'success' | 'error') {
  saveStatus.value = message;
  saveStatusClass.value = type === 'success'
    ? 'bg-green-100 text-green-800 border border-green-200'
    : 'bg-red-100 text-red-800 border border-red-200';

  setTimeout(() => {
    saveStatus.value = "";
  }, 3000);
}

// Lifecycle
onMounted(async () => {
  await loadConfigurations();
});
</script>

<style scoped>
.settings-panel {
  font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.settings-section {
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.settings-section:last-child {
  border-bottom: none;
}

.setting-item {
  margin-bottom: 1rem;
}

.setting-item:last-child {
  margin-bottom: 0;
}
</style>
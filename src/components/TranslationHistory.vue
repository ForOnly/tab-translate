<template>
  <div class="translation-history">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2">
        <span class="material-icons text-2xl text-blue-600">history</span>
        <h2 class="text-xl font-bold text-blue-600">翻译历史</h2>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-sm text-gray-500">
          共 {{ historyStats.totalItems }} 条记录
        </span>
        <button
          v-if="history.length > 0"
          @click="confirmClearHistory"
          class="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition"
          title="清空所有历史记录">
          清空
        </button>
      </div>
    </div>

    <!-- Search and Filter -->
    <div class="mb-4 space-y-3">
      <div class="relative">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索原文或译文..."
          class="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        <span class="material-icons absolute left-3 top-2.5 text-gray-400">search</span>
        <button
          v-if="searchQuery"
          @click="searchQuery = ''"
          class="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
          <span class="material-icons text-sm">close</span>
        </button>
      </div>

      <div class="flex flex-wrap gap-2">
        <button
          v-for="platform in availablePlatforms"
          :key="platform"
          @click="togglePlatformFilter(platform)"
          :class="[
            'px-3 py-1 text-sm rounded-full transition',
            platformFilter.includes(platform)
              ? 'bg-blue-100 text-blue-700 border border-blue-300'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
          ]">
          {{ platform }}
        </button>
      </div>
    </div>

    <!-- History List -->
    <div v-if="filteredHistory.length > 0" class="space-y-3 max-h-[400px] overflow-y-auto pr-2">
      <div
        v-for="item in filteredHistory"
        :key="item.id"
        class="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
        <div class="flex justify-between items-start mb-2">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1">
              <span class="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">{{ item.platform }}</span>
              <span class="text-xs text-gray-500">
                {{ formatDate(item.timestamp) }}
              </span>
              <span class="text-xs text-gray-500">
                {{ getLangName(item.sourceLanguage) }} → {{ getLangName(item.targetLanguage) }}
              </span>
            </div>

            <div class="space-y-2">
              <!-- Original Text -->
              <div>
                <div class="text-xs text-gray-500 mb-1">原文</div>
                <div class="text-sm text-gray-800 bg-gray-50 p-2 rounded border border-gray-200">
                  {{ truncateText(item.originalText, 150) }}
                </div>
              </div>

              <!-- Translated Text -->
              <div>
                <div class="text-xs text-gray-500 mb-1">译文</div>
                <div class="text-sm text-gray-800 bg-blue-50 p-2 rounded border border-blue-200">
                  {{ truncateText(item.translatedText, 150) }}
                </div>
              </div>
            </div>
          </div>

          <div class="flex flex-col gap-2 ml-3">
            <button
              @click="useHistoryItem(item)"
              class="p-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition"
              title="使用此翻译">
              <span class="material-icons text-sm">replay</span>
            </button>
            <button
              @click="deleteHistoryItem(item.id)"
              class="p-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition"
              title="删除此记录">
              <span class="material-icons text-sm">delete</span>
            </button>
          </div>
        </div>

        <!-- Additional Info -->
        <div v-if="item.additionalInfo" class="mt-3 pt-3 border-t border-gray-200">
          <div class="text-xs text-gray-500 mb-1">附加信息</div>
          <div class="text-xs text-gray-700" v-html="truncateText(item.additionalInfo, 100)"></div>
        </div>

        <!-- Full Text View Toggle -->
        <button
          v-if="item.originalText.length > 150 || item.translatedText.length > 150"
          @click="toggleExpanded(item.id)"
          class="mt-3 text-xs text-blue-600 hover:text-blue-800">
          {{ expandedItems.includes(item.id) ? '收起' : '展开全文' }}
        </button>

        <!-- Expanded View -->
        <div v-if="expandedItems.includes(item.id)" class="mt-3 space-y-3">
          <div>
            <div class="text-xs text-gray-500 mb-1">完整原文</div>
            <div class="text-sm text-gray-800 bg-gray-50 p-3 rounded border border-gray-200 whitespace-pre-wrap">
              {{ item.originalText }}
            </div>
          </div>
          <div>
            <div class="text-xs text-gray-500 mb-1">完整译文</div>
            <div class="text-sm text-gray-800 bg-blue-50 p-3 rounded border border-blue-200 whitespace-pre-wrap">
              {{ item.translatedText }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-10 text-gray-500">
      <span class="material-icons text-4xl mb-3">history_toggle_off</span>
      <p class="mb-2">暂无翻译历史</p>
      <p class="text-sm">开始翻译后，历史记录会在这里显示</p>
    </div>

    <!-- Settings -->
    <div class="mt-6 pt-4 border-t border-gray-200">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-sm font-medium text-gray-700">历史记录设置</h3>
          <p class="text-xs text-gray-500">最多保存 {{ historyConfig.maxHistoryItems }} 条记录</p>
        </div>
        <div class="flex items-center gap-3">
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              v-model="historyConfig.enabled"
              @change="updateHistoryConfig"
              class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
            <span class="text-sm text-gray-700">启用历史记录</span>
          </label>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import {
  getTranslationHistory,
  deleteHistoryItem as deleteHistoryItemApi,
  clearTranslationHistory,
  getHistoryConfig,
  saveHistoryConfig,
  searchTranslationHistory,
  getHistoryStats,
} from "@/utils/historyUtils";

interface Props {
  getLangName?: (code: string) => string;
}

const props = withDefaults(defineProps<Props>(), {
  getLangName: (code: string) => code,
});

const emit = defineEmits<{
  useHistory: [item: TranslationHistoryItem];
}>();

// Reactive state
const history = ref<TranslationHistoryItem[]>([]);
const searchQuery = ref("");
const platformFilter = ref<string[]>([]);
const expandedItems = ref<string[]>([]);
const historyConfig = ref<TranslationHistoryConfig>({
  maxHistoryItems: 100,
  enabled: true,
});
const historyStats = ref({
  totalItems: 0,
  oldestTimestamp: null as number | null,
  newestTimestamp: null as number | null,
});

// Computed properties
const availablePlatforms = computed(() => {
  const platforms = new Set(history.value.map((item) => item.platform));
  return Array.from(platforms).sort();
});

const filteredHistory = computed(() => {
  let filtered = history.value;

  // Apply search
  if (searchQuery.value.trim()) {
    filtered = filtered.filter(
      (item) =>
        item.originalText.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        item.translatedText.toLowerCase().includes(searchQuery.value.toLowerCase()),
    );
  }

  // Apply platform filter
  if (platformFilter.value.length > 0) {
    filtered = filtered.filter((item) => platformFilter.value.includes(item.platform));
  }

  return filtered;
});

// Methods
const loadHistory = async () => {
  history.value = await getTranslationHistory();
  updateHistoryStats();
};

const updateHistoryStats = async () => {
  historyStats.value = await getHistoryStats();
};

const loadHistoryConfig = async () => {
  historyConfig.value = await getHistoryConfig();
};

const updateHistoryConfig = async () => {
  await saveHistoryConfig(historyConfig.value);
};

const useHistoryItem = (item: TranslationHistoryItem) => {
  emit("useHistory", item);
};

const deleteHistoryItem = async (id: string) => {
  if (confirm("确定要删除这条记录吗？")) {
    await deleteHistoryItemApi(id);
    await loadHistory();
  }
};

const confirmClearHistory = async () => {
  if (confirm("确定要清空所有历史记录吗？此操作不可撤销。")) {
    await clearTranslationHistory();
    await loadHistory();
  }
};

const togglePlatformFilter = (platform: string) => {
  const index = platformFilter.value.indexOf(platform);
  if (index > -1) {
    platformFilter.value.splice(index, 1);
  } else {
    platformFilter.value.push(platform);
  }
};

const toggleExpanded = (id: string) => {
  const index = expandedItems.value.indexOf(id);
  if (index > -1) {
    expandedItems.value.splice(index, 1);
  } else {
    expandedItems.value.push(id);
  }
};

const formatDate = (timestamp: number) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) {
    return "刚刚";
  } else if (diffMins < 60) {
    return `${diffMins}分钟前`;
  } else if (diffHours < 24) {
    return `${diffHours}小时前`;
  } else if (diffDays < 7) {
    return `${diffDays}天前`;
  } else {
    return date.toLocaleDateString();
  }
};

const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
};

// Watch for search query changes with debounce
let searchTimer: ReturnType<typeof setTimeout> | null = null;
watch(searchQuery, async (newQuery) => {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(async () => {
    if (newQuery.trim()) {
      history.value = await searchTranslationHistory(newQuery);
    } else {
      await loadHistory();
    }
    updateHistoryStats();
  }, 300);
});

// Lifecycle
onMounted(async () => {
  await loadHistory();
  await loadHistoryConfig();
});

// Expose refresh method
defineExpose({
  refresh: loadHistory,
  addHistory: async (
    originalText: string,
    translatedText: string,
    sourceLanguage: string,
    targetLanguage: string,
    platform: string,
    additionalInfo?: string,
  ) => {
    // This would be implemented by importing saveToHistory
    // For now, we'll just reload the history
    await loadHistory();
  },
});
</script>

<style scoped>
.translation-history {
  font-family: "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
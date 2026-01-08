<template>
  <div class="vocabulary-book">
    <!-- Header -->
    <div class="header">
      <div class="header-left">
        <div class="title-section">
          <span class="material-icons title-icon">bookmark</span>
          <h2 class="title">单词本</h2>
        </div>
        <div class="stats">
          <span class="stat-item">
            <span class="stat-value">{{ stats.totalItems }}</span>
            <span class="stat-label">总词数</span>
          </span>
          <span class="stat-item">
            <span class="stat-value">{{ stats.favoritesCount }}</span>
            <span class="stat-label">收藏</span>
          </span>
          <span class="stat-item">
            <span class="stat-value">{{ stats.reviewedCount }}</span>
            <span class="stat-label">已复习</span>
          </span>
        </div>
      </div>

      <div class="header-right">
        <button @click="exportVocabulary" class="export-btn" title="导出单词本">
          <span class="material-icons">download</span>
          导出
        </button>
        <button @click="showSettings = !showSettings" class="settings-btn" title="设置">
          <span class="material-icons">settings</span>
        </button>
      </div>
    </div>

    <!-- Settings Panel -->
    <div v-if="showSettings" class="settings-panel">
      <div class="settings-content">
        <h3 class="settings-title">单词本设置</h3>

        <div class="settings-group">
          <label class="setting-item">
            <span class="setting-label">启用单词本</span>
            <input type="checkbox" v-model="vocabularyConfig.enabled" @change="updateVocabularyConfig" class="setting-input" />
          </label>

          <label class="setting-item">
            <span class="setting-label">自动收藏翻译</span>
            <input type="checkbox" v-model="vocabularyConfig.autoAddFavorites" @change="updateVocabularyConfig" class="setting-input" />
          </label>

          <label class="setting-item">
            <span class="setting-label">最大词数</span>
            <input type="number" v-model.number="vocabularyConfig.maxVocabularyItems" @change="updateVocabularyConfig" min="10" max="10000" class="setting-input number-input" />
          </label>

          <label class="setting-item">
            <span class="setting-label">默认标签</span>
            <input type="text" v-model="tagsInput" @keyup.enter="addDefaultTag" placeholder="输入标签后按Enter添加" class="setting-input tag-input" />
            <div class="tags-preview">
              <span v-for="tag in vocabularyConfig.defaultTags" :key="tag" class="tag-preview">
                {{ tag }}
                <button @click="removeDefaultTag(tag)" class="tag-remove">×</button>
              </span>
            </div>
          </label>

          <label class="setting-item">
            <span class="setting-label">导出格式</span>
            <select v-model="vocabularyConfig.exportFormat" @change="updateVocabularyConfig" class="setting-input select-input">
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
              <option value="txt">TXT</option>
            </select>
          </label>
        </div>

        <div class="settings-actions">
          <button @click="clearVocabulary" class="clear-btn">清空单词本</button>
          <button @click="showSettings = false" class="close-btn">关闭</button>
        </div>
      </div>
    </div>

    <!-- Search and Filter -->
    <div class="controls">
      <div class="search-box">
        <span class="material-icons search-icon">search</span>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索单词、翻译、标签..."
          class="search-input"
          @input="onSearchInput" />
        <button v-if="searchQuery" @click="searchQuery = ''" class="clear-search" title="清除搜索">
          <span class="material-icons">close</span>
        </button>
      </div>

      <div class="filter-controls">
        <div class="filter-group">
          <button
            @click="toggleFilter('favorites')"
            :class="['filter-btn', { active: filters.favorites }]"
            title="只显示收藏">
            <span class="material-icons">{{ filters.favorites ? 'star' : 'star_border' }}</span>
          </button>

          <select v-model="filters.difficulty" @change="applyFilters" class="filter-select">
            <option value="">所有难度</option>
            <option value="easy">简单</option>
            <option value="medium">中等</option>
            <option value="hard">困难</option>
          </select>

          <select v-model="filters.tag" @change="applyFilters" class="filter-select">
            <option value="">所有标签</option>
            <option v-for="tag in availableTags" :key="tag" :value="tag">{{ tag }}</option>
          </select>

          <select v-model="sortBy" @change="applySorting" class="filter-select">
            <option value="timestamp">最近添加</option>
            <option value="reviewCount">复习次数</option>
            <option value="alphabetical">字母顺序</option>
            <option value="difficulty">难度</option>
          </select>
        </div>

        <button @click="refreshVocabulary" class="refresh-btn" title="刷新">
          <span class="material-icons">refresh</span>
        </button>
      </div>
    </div>

    <!-- Vocabulary List -->
    <div v-if="filteredItems.length > 0" class="vocabulary-list">
      <div
        v-for="item in filteredItems"
        :key="item.id"
        class="vocabulary-item"
        :class="{ favorite: item.favorite, reviewed: item.reviewCount > 0 }">
        <div class="item-header">
          <div class="item-meta">
            <span class="platform-badge">{{ item.platform }}</span>
            <span class="timestamp">{{ formatDate(item.timestamp) }}</span>
            <span class="language-badge">{{ getLangName(item.sourceLanguage) }} → {{ getLangName(item.targetLanguage) }}</span>
          </div>

          <div class="item-actions">
            <button
              @click="toggleFavorite(item.id)"
              class="action-btn favorite-btn"
              :title="item.favorite ? '取消收藏' : '收藏'">
              <span class="material-icons">{{ item.favorite ? 'star' : 'star_border' }}</span>
            </button>

            <button
              @click="markAsReviewed(item.id)"
              class="action-btn review-btn"
              title="标记为已复习">
              <span class="material-icons">check_circle</span>
              <span v-if="item.reviewCount > 0" class="review-count">{{ item.reviewCount }}</span>
            </button>

            <button
              @click="showEditPanel(item)"
              class="action-btn edit-btn"
              title="编辑">
              <span class="material-icons">edit</span>
            </button>

            <button
              @click="deleteItem(item.id)"
              class="action-btn delete-btn"
              title="删除">
              <span class="material-icons">delete</span>
            </button>
          </div>
        </div>

        <div class="item-content">
          <div class="original-section">
            <div class="section-label">原文</div>
            <div class="original-text">{{ item.originalText }}</div>
            <PhoneticDisplay
              v-if="showPhonetics"
              :text="item.originalText"
              :language="item.sourceLanguage"
              :show-audio-button="true"
              class="phonetic-display" />
          </div>

          <div class="translation-section">
            <div class="section-label">译文</div>
            <div class="translation-text">{{ item.translatedText }}</div>
          </div>
        </div>

        <div v-if="item.tags && item.tags.length > 0" class="item-tags">
          <span v-for="tag in item.tags" :key="tag" class="tag">
            {{ tag }}
          </span>
        </div>

        <div v-if="item.notes" class="item-notes">
          <div class="notes-label">笔记:</div>
          <div class="notes-content">{{ item.notes }}</div>
        </div>

        <div class="item-footer">
          <div class="difficulty">
            <span class="difficulty-label">难度:</span>
            <select
              :value="item.difficulty || 'medium'"
              @change="updateDifficulty(item.id, $event)"
              class="difficulty-select">
              <option value="easy">简单</option>
              <option value="medium">中等</option>
              <option value="hard">困难</option>
            </select>
          </div>

          <div class="review-info" v-if="item.reviewCount > 0">
            <span class="review-info-text">
              复习 {{ item.reviewCount }} 次
              <span v-if="item.lastReviewed">(最近: {{ formatDate(item.lastReviewed) }})</span>
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <span class="material-icons empty-icon">bookmark_border</span>
      <h3 class="empty-title">单词本为空</h3>
      <p class="empty-description">
        {{ searchQuery ? '没有找到匹配的单词' : '开始翻译并收藏单词来构建你的单词本' }}
      </p>
      <button v-if="searchQuery" @click="searchQuery = ''" class="empty-action">
        清除搜索条件
      </button>
    </div>

    <!-- Edit Panel -->
    <div v-if="editingItem" class="edit-panel">
      <div class="edit-panel-content">
        <h3 class="edit-title">编辑单词</h3>

        <div class="edit-form">
          <div class="form-group">
            <label class="form-label">原文</label>
            <input v-model="editingItem.originalText" class="form-input" />
          </div>

          <div class="form-group">
            <label class="form-label">译文</label>
            <input v-model="editingItem.translatedText" class="form-input" />
          </div>

          <div class="form-group">
            <label class="form-label">标签 (用逗号分隔)</label>
            <input
              v-model="tagsEditInput"
              @keyup.enter="addEditTag"
              class="form-input"
              placeholder="例如: verb, important, new" />
            <div class="edit-tags">
              <span v-for="tag in editingItem.tags" :key="tag" class="edit-tag">
                {{ tag }}
                <button @click="removeEditTag(tag)" class="edit-tag-remove">×</button>
              </span>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">笔记</label>
            <textarea v-model="editingItem.notes" class="form-textarea" rows="3"></textarea>
          </div>
        </div>

        <div class="edit-actions">
          <button @click="saveEdit" class="save-btn">保存</button>
          <button @click="cancelEdit" class="cancel-btn">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import PhoneticDisplay from "./PhoneticDisplay.vue";
import {
  getVocabularyItems,
  toggleFavorite as toggleFavoriteApi,
  markAsReviewed as markAsReviewedApi,
  updateVocabularyItem,
  removeVocabularyItem,
  clearVocabulary as clearVocabularyApi,
  exportVocabulary as exportVocabularyApi,
  getVocabularyConfig,
  saveVocabularyConfig,
  searchVocabulary,
  getVocabularyStats,
} from "@/utils/vocabularyUtils";

interface Props {
  getLangName?: (code: string) => string;
}

const props = withDefaults(defineProps<Props>(), {
  getLangName: (code: string) => code,
});

// Reactive state
const vocabularyItems = ref<VocabularyItem[]>([]);
const searchQuery = ref("");
const showSettings = ref(false);
const showPhonetics = ref(true);
const editingItem = ref<VocabularyItem | null>(null);
const tagsInput = ref("");
const tagsEditInput = ref("");
const sortBy = ref("timestamp");

// Filters
const filters = ref({
  favorites: false,
  difficulty: "",
  tag: "",
});

// Configuration
const vocabularyConfig = ref<VocabularyConfig>({
  maxVocabularyItems: 500,
  enabled: true,
  autoAddFavorites: false,
  defaultTags: ["new", "important", "difficult"],
  exportFormat: "csv",
});

// Statistics
const stats = ref({
  totalItems: 0,
  favoritesCount: 0,
  reviewedCount: 0,
  byDifficulty: { easy: 0, medium: 0, hard: 0 },
});

// Computed properties
const availableTags = computed(() => {
  const tags = new Set<string>();
  vocabularyItems.value.forEach((item) => {
    item.tags?.forEach((tag) => tags.add(tag));
  });
  return Array.from(tags).sort();
});

const filteredItems = computed(() => {
  let items = vocabularyItems.value;

  // Apply search
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    items = items.filter(
      (item) =>
        item.originalText.toLowerCase().includes(query) ||
        item.translatedText.toLowerCase().includes(query) ||
        item.tags?.some((tag) => tag.toLowerCase().includes(query)) ||
        item.notes?.toLowerCase().includes(query),
    );
  }

  // Apply filters
  if (filters.value.favorites) {
    items = items.filter((item) => item.favorite);
  }

  if (filters.value.difficulty) {
    items = items.filter((item) => item.difficulty === filters.value.difficulty);
  }

  if (filters.value.tag) {
    items = items.filter((item) => item.tags?.includes(filters.value.tag));
  }

  // Apply sorting
  items = [...items]; // Create a copy
  switch (sortBy.value) {
    case "timestamp":
      items.sort((a, b) => b.timestamp - a.timestamp);
      break;
    case "reviewCount":
      items.sort((a, b) => b.reviewCount - a.reviewCount);
      break;
    case "alphabetical":
      items.sort((a, b) => a.originalText.localeCompare(b.originalText));
      break;
    case "difficulty":
      const difficultyOrder = { easy: 1, medium: 2, hard: 3 };
      items.sort((a, b) => {
        const aDiff = difficultyOrder[a.difficulty || "medium"] || 2;
        const bDiff = difficultyOrder[b.difficulty || "medium"] || 2;
        return aDiff - bDiff;
      });
      break;
  }

  return items;
});

// Methods
const loadVocabulary = async () => {
  vocabularyItems.value = await getVocabularyItems();
  updateStats();
};

const loadVocabularyConfig = async () => {
  const config = await getVocabularyConfig();
  vocabularyConfig.value = config;
};

const updateVocabularyConfig = async () => {
  await saveVocabularyConfig(vocabularyConfig.value);
};

const updateStats = async () => {
  const statsData = await getVocabularyStats();
  stats.value = {
    totalItems: statsData.totalItems,
    favoritesCount: statsData.favoritesCount,
    reviewedCount: statsData.byDifficulty.easy + statsData.byDifficulty.medium + statsData.byDifficulty.hard,
    byDifficulty: statsData.byDifficulty,
  };
};

const toggleFilter = (filterName: keyof typeof filters.value) => {
  if (filterName === "favorites") {
    filters.value.favorites = !filters.value.favorites;
  }
  // Other filters are handled by select elements
};

const applyFilters = () => {
  // Filters are applied automatically through computed property
};

const applySorting = () => {
  // Sorting is applied automatically through computed property
};

const onSearchInput = () => {
  // Search is applied automatically through computed property
  // Debounce could be added here if needed
};

const toggleFavorite = async (id: string) => {
  const updatedItem = await toggleFavoriteApi(id);
  if (updatedItem) {
    const index = vocabularyItems.value.findIndex((item) => item.id === id);
    if (index !== -1) {
      vocabularyItems.value[index] = updatedItem;
    }
    updateStats();
  }
};

const markAsReviewed = async (id: string) => {
  const updatedItem = await markAsReviewedApi(id);
  if (updatedItem) {
    const index = vocabularyItems.value.findIndex((item) => item.id === id);
    if (index !== -1) {
      vocabularyItems.value[index] = updatedItem;
    }
    updateStats();
  }
};

const updateDifficulty = async (id: string, event: Event) => {
  const difficulty = (event.target as HTMLSelectElement).value as "easy" | "medium" | "hard";
  const updatedItem = await updateVocabularyItem(id, { difficulty });
  if (updatedItem) {
    const index = vocabularyItems.value.findIndex((item) => item.id === id);
    if (index !== -1) {
      vocabularyItems.value[index] = updatedItem;
    }
    updateStats();
  }
};

const deleteItem = async (id: string) => {
  if (confirm("确定要删除这个单词吗？")) {
    await removeVocabularyItem(id);
    await loadVocabulary();
  }
};

const showEditPanel = (item: VocabularyItem) => {
  editingItem.value = { ...item };
  tagsEditInput.value = "";
};

const saveEdit = async () => {
  if (!editingItem.value) return;

  // Parse tags from input
  if (tagsEditInput.value.trim()) {
    const newTags = tagsEditInput.value
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
    editingItem.value.tags = [...(editingItem.value.tags || []), ...newTags];
    tagsEditInput.value = "";
  }

  const updatedItem = await updateVocabularyItem(editingItem.value.id, {
    originalText: editingItem.value.originalText,
    translatedText: editingItem.value.translatedText,
    tags: editingItem.value.tags,
    notes: editingItem.value.notes,
  });

  if (updatedItem) {
    const index = vocabularyItems.value.findIndex((item) => item.id === editingItem.value!.id);
    if (index !== -1) {
      vocabularyItems.value[index] = updatedItem;
    }
    editingItem.value = null;
  }
};

const cancelEdit = () => {
  editingItem.value = null;
  tagsEditInput.value = "";
};

const addEditTag = () => {
  if (!editingItem.value || !tagsEditInput.value.trim()) return;

  const tag = tagsEditInput.value.trim();
  if (!editingItem.value.tags) {
    editingItem.value.tags = [];
  }

  if (!editingItem.value.tags.includes(tag)) {
    editingItem.value.tags.push(tag);
  }

  tagsEditInput.value = "";
};

const removeEditTag = (tagToRemove: string) => {
  if (!editingItem.value) return;

  editingItem.value.tags = editingItem.value.tags?.filter((tag) => tag !== tagToRemove);
};

const addDefaultTag = () => {
  if (!tagsInput.value.trim()) return;

  const tag = tagsInput.value.trim();
  if (!vocabularyConfig.value.defaultTags.includes(tag)) {
    vocabularyConfig.value.defaultTags.push(tag);
    updateVocabularyConfig();
  }

  tagsInput.value = "";
};

const removeDefaultTag = (tagToRemove: string) => {
  vocabularyConfig.value.defaultTags = vocabularyConfig.value.defaultTags.filter((tag) => tag !== tagToRemove);
  updateVocabularyConfig();
};

const exportVocabulary = async () => {
  try {
    const format = vocabularyConfig.value.exportFormat;
    const content = await exportVocabularyApi(format);

    // Create download link
    const blob = new Blob([content], { type: getMimeType(format) });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vocabulary-${new Date().toISOString().split("T")[0]}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Export failed:", error);
    alert("导出失败: " + (error instanceof Error ? error.message : "未知错误"));
  }
};

const getMimeType = (format: string) => {
  switch (format) {
    case "csv":
      return "text/csv";
    case "json":
      return "application/json";
    case "txt":
      return "text/plain";
    default:
      return "text/plain";
  }
};

const clearVocabulary = async () => {
  if (confirm("确定要清空整个单词本吗？此操作不可撤销。")) {
    await clearVocabularyApi();
    await loadVocabulary();
    showSettings.value = false;
  }
};

const refreshVocabulary = async () => {
  await loadVocabulary();
};

const formatDate = (timestamp: number) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return "今天";
  } else if (diffDays === 1) {
    return "昨天";
  } else if (diffDays < 7) {
    return `${diffDays}天前`;
  } else {
    return date.toLocaleDateString();
  }
};

// Watch for search query changes with debounce
let searchTimer: ReturnType<typeof setTimeout> | null = null;
watch(searchQuery, async (newQuery) => {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(async () => {
    if (newQuery.trim()) {
      vocabularyItems.value = await searchVocabulary(newQuery);
    } else {
      await loadVocabulary();
    }
    updateStats();
  }, 300);
});

// Lifecycle
onMounted(async () => {
  await loadVocabularyConfig();
  await loadVocabulary();
});

// Expose methods
defineExpose({
  refresh: loadVocabulary,
  addItem: async (
    originalText: string,
    translatedText: string,
    sourceLanguage: string,
    targetLanguage: string,
    platform: string,
  ) => {
    // This would be implemented by importing addToVocabulary
    // For now, just refresh the list
    await loadVocabulary();
  },
});
</script>

<style scoped>
.vocabulary-book {
  font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

/* Header */
.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.title-section {
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-icon {
  font-size: 24px;
  color: #4f46e5;
}

.title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
}

.stats {
  display: flex;
  gap: 16px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4px 8px;
  background: #f8fafc;
  border-radius: 6px;
  min-width: 60px;
}

.stat-value {
  font-size: 18px;
  font-weight: 700;
  color: #4f46e5;
}

.stat-label {
  font-size: 11px;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.header-right {
  display: flex;
  gap: 8px;
}

.export-btn, .settings-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.export-btn:hover, .settings-btn:hover {
  background: #4338ca;
  transform: translateY(-1px);
}

.settings-btn {
  padding: 8px;
}

/* Settings Panel */
.settings-panel {
  margin-bottom: 20px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
}

.settings-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.settings-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.settings-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #e2e8f0;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-label {
  font-size: 14px;
  color: #475569;
  flex: 1;
}

.setting-input {
  padding: 6px 10px;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  font-size: 14px;
  color: #1e293b;
  background: white;
}

.setting-input:focus {
  outline: none;
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.number-input {
  width: 80px;
}

.tag-input {
  width: 200px;
}

.tags-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
}

.tag-preview {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px 6px;
  background: #e0e7ff;
  color: #4f46e5;
  border-radius: 4px;
  font-size: 12px;
}

.tag-remove {
  background: none;
  border: none;
  color: #4f46e5;
  cursor: pointer;
  font-size: 14px;
  padding: 0;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tag-remove:hover {
  color: #dc2626;
}

.select-input {
  width: 120px;
}

.settings-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid #e2e8f0;
}

.clear-btn, .close-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.clear-btn {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.clear-btn:hover {
  background: #fee2e2;
}

.close-btn {
  background: #e2e8f0;
  color: #475569;
}

.close-btn:hover {
  background: #cbd5e1;
}

/* Controls */
.controls {
  margin-bottom: 20px;
}

.search-box {
  position: relative;
  margin-bottom: 12px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  font-size: 20px;
}

.search-input {
  width: 100%;
  padding: 10px 40px 10px 40px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 14px;
  color: #1e293b;
  background: white;
}

.search-input:focus {
  outline: none;
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.clear-search {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.clear-search:hover {
  color: #64748b;
}

.filter-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-group {
  display: flex;
  gap: 8px;
  align-items: center;
}

.filter-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  cursor: pointer;
  color: #64748b;
  transition: all 0.2s;
}

.filter-btn:hover {
  background: #e2e8f0;
}

.filter-btn.active {
  background: #fef3c7;
  border-color: #f59e0b;
  color: #d97706;
}

.filter-select {
  padding: 6px 10px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 13px;
  color: #475569;
  background: white;
  cursor: pointer;
}

.filter-select:focus {
  outline: none;
  border-color: #4f46e5;
}

.refresh-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  cursor: pointer;
  color: #64748b;
  transition: all 0.2s;
}

.refresh-btn:hover {
  background: #e2e8f0;
  color: #4f46e5;
}

/* Vocabulary List */
.vocabulary-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: 500px;
  overflow-y: auto;
  padding-right: 4px;
}

.vocabulary-item {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
  transition: all 0.2s;
}

.vocabulary-item:hover {
  border-color: #cbd5e1;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.vocabulary-item.favorite {
  border-left: 4px solid #f59e0b;
}

.vocabulary-item.reviewed {
  border-right: 4px solid #10b981;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.item-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.platform-badge {
  padding: 2px 6px;
  background: #e0e7ff;
  color: #4f46e5;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.timestamp {
  font-size: 11px;
  color: #94a3b8;
}

.language-badge {
  padding: 2px 6px;
  background: #f1f5f9;
  color: #64748b;
  border-radius: 4px;
  font-size: 11px;
}

.item-actions {
  display: flex;
  gap: 4px;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  background: none;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  color: #94a3b8;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #f1f5f9;
  color: #475569;
}

.favorite-btn:hover {
  color: #f59e0b;
}

.review-btn:hover {
  color: #10b981;
}

.edit-btn:hover {
  color: #4f46e5;
}

.delete-btn:hover {
  color: #dc2626;
}

.review-count {
  margin-left: 2px;
  font-size: 11px;
  font-weight: 600;
  color: #10b981;
}

.item-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 12px;
}

.original-section, .translation-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.section-label {
  font-size: 12px;
  color: #64748b;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.original-text, .translation-text {
  font-size: 14px;
  color: #1e293b;
  line-height: 1.5;
}

.original-text {
  font-weight: 500;
}

.translation-text {
  color: #475569;
}

.phonetic-display {
  margin-top: 4px;
}

.item-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 8px;
}

.tag {
  padding: 2px 6px;
  background: #f1f5f9;
  color: #475569;
  border-radius: 4px;
  font-size: 11px;
}

.item-notes {
  margin-bottom: 12px;
  padding: 8px;
  background: #f8fafc;
  border-radius: 4px;
  border-left: 3px solid #cbd5e1;
}

.notes-label {
  font-size: 12px;
  color: #64748b;
  font-weight: 600;
  margin-bottom: 2px;
}

.notes-content {
  font-size: 13px;
  color: #475569;
  line-height: 1.4;
}

.item-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #e2e8f0;
}

.difficulty {
  display: flex;
  align-items: center;
  gap: 6px;
}

.difficulty-label {
  font-size: 12px;
  color: #64748b;
}

.difficulty-select {
  padding: 2px 6px;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  font-size: 12px;
  color: #475569;
  background: white;
  cursor: pointer;
}

.difficulty-select:focus {
  outline: none;
  border-color: #4f46e5;
}

.review-info {
  font-size: 11px;
  color: #94a3b8;
}

.review-info-text {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  color: #94a3b8;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  color: #cbd5e1;
}

.empty-title {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: #64748b;
}

.empty-description {
  margin: 0 0 16px 0;
  font-size: 14px;
  max-width: 300px;
}

.empty-action {
  padding: 8px 16px;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.empty-action:hover {
  background: #4338ca;
}

/* Edit Panel */
.edit-panel {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.edit-panel-content {
  background: white;
  border-radius: 12px;
  padding: 24px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
}

.edit-title {
  margin: 0 0 20px 0;
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
}

.edit-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 14px;
  font-weight: 500;
  color: #475569;
}

.form-input, .form-textarea {
  padding: 8px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 14px;
  color: #1e293b;
  background: white;
}

.form-input:focus, .form-textarea:focus {
  outline: none;
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 60px;
}

.edit-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
}

.edit-tag {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px 6px;
  background: #e0e7ff;
  color: #4f46e5;
  border-radius: 4px;
  font-size: 12px;
}

.edit-tag-remove {
  background: none;
  border: none;
  color: #4f46e5;
  cursor: pointer;
  font-size: 14px;
  padding: 0;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.edit-tag-remove:hover {
  color: #dc2626;
}

.edit-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #e2e8f0;
}

.save-btn, .cancel-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.save-btn {
  background: #4f46e5;
  color: white;
}

.save-btn:hover {
  background: #4338ca;
}

.cancel-btn {
  background: #e2e8f0;
  color: #475569;
}

.cancel-btn:hover {
  background: #cbd5e1;
}

/* Custom scrollbar */
.vocabulary-list::-webkit-scrollbar {
  width: 6px;
}

.vocabulary-list::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.vocabulary-list::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.vocabulary-list::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
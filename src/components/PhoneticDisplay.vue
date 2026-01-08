<template>
  <div v-if="showPhonetic" class="phonetic-display">
    <div class="phonetic-content">
      <!-- Phonetic Text -->
      <div v-if="phoneticInfo" class="phonetic-text">
        <span class="label">音标:</span>
        <span class="ipa">{{ phoneticInfo.phonetic }}</span>

        <!-- Audio Button -->
        <button
          v-if="showAudioButton && phoneticInfo.audioUrl"
          @click="playAudio"
          class="audio-btn"
          :class="{ playing: isPlaying }"
          :title="`播放发音 (${phoneticInfo.source || '来源'})`">
          <span class="material-icons">{{ isPlaying ? 'volume_up' : 'volume_down' }}</span>
        </button>

        <!-- Audio Button for generated URL -->
        <button
          v-else-if="showAudioButton && text"
          @click="playGeneratedAudio"
          class="audio-btn"
          :class="{ playing: isPlaying }"
          title="播放发音">
          <span class="material-icons">{{ isPlaying ? 'volume_up' : 'volume_down' }}</span>
        </button>
      </div>

      <!-- Loading State -->
      <div v-else-if="isLoading" class="loading">
        <span class="material-icons spin">autorenew</span>
        加载音标...
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error">
        <span class="material-icons">error_outline</span>
        {{ error }}
      </div>

      <!-- Empty State -->
      <div v-else-if="showEmpty && !isLoading" class="empty">
        <span class="material-icons">phonetics</span>
        无音标信息
      </div>
    </div>

    <!-- Configuration Toggle -->
    <div v-if="showConfig" class="config-toggle">
      <label class="config-label">
        <input
          type="checkbox"
          v-model="enabled"
          @change="updateConfig"
          class="config-checkbox" />
        <span class="config-text">显示音标</span>
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import { getPhoneticInfo, generateAudioUrl, getPhoneticConfig, savePhoneticConfig } from "@/utils/phoneticUtils";

interface Props {
  text: string;
  language?: string;
  autoLoad?: boolean;
  showAudioButton?: boolean;
  showEmpty?: boolean;
  showConfig?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  language: "en",
  autoLoad: true,
  showAudioButton: true,
  showEmpty: false,
  showConfig: false,
});

// Reactive state
const phoneticInfo = ref<PhoneticInfo | null>(null);
const isLoading = ref(false);
const error = ref<string | null>(null);
const isPlaying = ref(false);
const enabled = ref(true);
const showPhonetic = ref(true);

// Audio element for playback
let audioElement: HTMLAudioElement | null = null;

// Load phonetic configuration
const loadConfig = async () => {
  try {
    const config = await getPhoneticConfig();
    enabled.value = config.enabled;
    showPhonetic.value = config.enabled && config.showInTranslation;
  } catch (err) {
    console.error("Failed to load phonetic config:", err);
  }
};

// Update configuration
const updateConfig = async () => {
  try {
    const config = await getPhoneticConfig();
    await savePhoneticConfig({
      ...config,
      enabled: enabled.value,
      showInTranslation: enabled.value,
    });
    showPhonetic.value = enabled.value;
  } catch (err) {
    console.error("Failed to update phonetic config:", err);
  }
};

// Load phonetic information
const loadPhonetic = async () => {
  if (!props.text.trim() || !showPhonetic.value) {
    return;
  }

  isLoading.value = true;
  error.value = null;

  try {
    const info = await getPhoneticInfo(props.text, props.language);
    phoneticInfo.value = info;
  } catch (err) {
    console.error("Failed to load phonetic info:", err);
    error.value = "无法加载音标信息";
    phoneticInfo.value = null;
  } finally {
    isLoading.value = false;
  }
};

// Play audio from URL
const playAudio = () => {
  if (!phoneticInfo.value?.audioUrl) return;

  if (audioElement) {
    audioElement.pause();
    audioElement.currentTime = 0;
  }

  audioElement = new Audio(phoneticInfo.value.audioUrl);
  audioElement.play();
  isPlaying.value = true;

  audioElement.onended = () => {
    isPlaying.value = false;
  };

  audioElement.onerror = () => {
    isPlaying.value = false;
    error.value = "发音播放失败";
  };
};

// Play generated audio
const playGeneratedAudio = () => {
  const audioUrl = generateAudioUrl(props.text, props.language);
  if (!audioUrl) {
    error.value = "不支持该语言的发音";
    return;
  }

  if (audioElement) {
    audioElement.pause();
    audioElement.currentTime = 0;
  }

  audioElement = new Audio(audioUrl);
  audioElement.play();
  isPlaying.value = true;

  audioElement.onended = () => {
    isPlaying.value = false;
  };

  audioElement.onerror = () => {
    isPlaying.value = false;
    error.value = "发音播放失败";
  };
};

// Clean up audio on unmount
const cleanup = () => {
  if (audioElement) {
    audioElement.pause();
    audioElement = null;
  }
  isPlaying.value = false;
};

// Watch for text changes
watch(
  () => [props.text, props.language],
  () => {
    if (props.autoLoad) {
      loadPhonetic();
    }
  },
  { immediate: false }
);

// Lifecycle
onMounted(async () => {
  await loadConfig();
  if (props.autoLoad && showPhonetic.value) {
    await loadPhonetic();
  }
});

// Expose methods
defineExpose({
  loadPhonetic,
  refresh: loadPhonetic,
  playAudio,
  playGeneratedAudio,
});
</script>

<style scoped>
.phonetic-display {
  font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: 14px;
}

.phonetic-content {
  margin: 8px 0;
}

.phonetic-text {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  color: #475569;
}

.phonetic-text .label {
  font-weight: 600;
  color: #4f46e5;
  font-size: 12px;
}

.phonetic-text .ipa {
  flex: 1;
  font-family: 'Arial Unicode MS', 'Lucida Sans Unicode', sans-serif;
  font-size: 13px;
  color: #1e293b;
}

.audio-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  color: #64748b;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.audio-btn:hover {
  background: #f1f5f9;
  color: #4f46e5;
}

.audio-btn.playing {
  color: #f59e0b;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.loading, .error, .empty {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 12px;
}

.loading {
  color: #64748b;
  background: #f8fafc;
}

.error {
  color: #dc2626;
  background: #fef2f2;
}

.empty {
  color: #94a3b8;
  background: #f8fafc;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.config-toggle {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #e2e8f0;
}

.config-label {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 12px;
  color: #64748b;
}

.config-checkbox {
  width: 14px;
  height: 14px;
  accent-color: #4f46e5;
}

.config-text {
  user-select: none;
}
</style>
<template>
  <div class="flex flex-wrap justify-end items-center gap-4">
    <!-- 语音按钮 -->
    <button
      class="w-10 h-10 flex items-center justify-center rounded-full bg-gray-600 hover:bg-gray-700 text-white text-lg shadow transition"
      :class="{ 'animate-bounce bg-gray-700': isPlaying }"
      :disabled="!hasText"
      @click="emit('playVoice')"
      title="播放语音">
      <span class="material-icons text-lg">volume_up</span>
    </button>

    <!-- 语言选择 -->
    <select
      v-model="localSelectedLang"
      @change="emit('langChange', localSelectedLang)"
      class="px-3 py-2 border border-gray-300 rounded-lg text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition">
      <option v-for="lang in languages" :key="lang.code" :value="lang.code">
        {{ lang.name }}
      </option>
    </select>

    <!-- 平台选择 -->
    <select
      v-model="localSelectedPlatform"
      @change="emit('platformChange', localSelectedPlatform)"
      class="px-3 py-2 border border-gray-300 rounded-lg text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition">
      <option v-for="platform in availablePlatforms" :key="platform.code" :value="platform">
        {{ platform.name }}
      </option>
    </select>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'

interface Props {
  // 状态
  isPlaying?: boolean
  hasText?: boolean
  selectedLang?: string
  selectedPlatform?: any
  languages?: Array<{ code: string; name: string }>
  platforms?: any[]
}

const props = withDefaults(defineProps<Props>(), {
  isPlaying: false,
  hasText: false,
  selectedLang: 'auto',
  selectedPlatform: null,
  languages: () => [],
  platforms: () => []
})

const emit = defineEmits<{
  'playVoice': []
  'langChange': [lang: string]
  'platformChange': [platform: any]
}>()

const localSelectedLang = ref(props.selectedLang)
const localSelectedPlatform = ref(props.selectedPlatform)

// 监听外部prop变化
watch(() => props.selectedLang, (newVal) => {
  localSelectedLang.value = newVal
})

watch(() => props.selectedPlatform, (newVal) => {
  localSelectedPlatform.value = newVal
})

// 计算可用平台
const availablePlatforms = computed(() => {
  return props.platforms || []
})
</script>

<style scoped>
/* 可以添加自定义样式 */
</style>
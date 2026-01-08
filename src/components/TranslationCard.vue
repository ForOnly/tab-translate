<template>
  <div
    class="flex-1 min-w-[200px] bg-white rounded-xl p-4 shadow-md flex flex-col min-h-[150px] max-h-[570px]"
    :class="customClass">
    <!-- 标题区域 -->
    <div v-if="showHeader" class="w-full flex justify-between items-center">
      <h2 class="text-gray-600 text-base font-medium">
        {{ title }}
        <span v-if="subtitle" class="text-gray-400 text-sm font-normal">({{ subtitle }})</span>
      </h2>
      <button
        v-if="showCopyButton && copyText"
        :disabled="!copyText"
        class="p-1 rounded-md text-sm text-gray-400 hover:text-gray-600 hover:bg-gray-100 active:scale-95 transition"
        :class="{ '!text-green-700': copied }"
        :title="copyButtonTitle"
        @click="handleCopy">
        {{ copyButtonText }}
      </button>
    </div>

    <!-- 分隔线 -->
    <div v-if="showHeader" class="h-px bg-slate-300 my-2"></div>

    <!-- 内容区域 -->
    <div class="flex-1 overflow-y-auto">
      <slot>
        <div v-if="isTextarea" class="h-full">
          <textarea
            v-model="localValue"
            :placeholder="placeholder"
            class="w-full h-full text-sm leading-relaxed font-mono text-slate-700 resize-none outline-none bg-transparent"
            :class="contentClass"
            @input="handleInput" />
        </div>
        <div v-else class="text-sm whitespace-pre-wrap break-all" :class="contentClass">
          {{ displayText }}
        </div>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface Props {
  // 基础配置
  title: string
  subtitle?: string
  value?: string
  placeholder?: string

  // 显示控制
  showHeader?: boolean
  showCopyButton?: boolean
  copyButtonTitle?: string
  isTextarea?: boolean

  // 样式
  customClass?: string
  contentClass?: string

  // 复制功能
  copyText?: string
}

const props = withDefaults(defineProps<Props>(), {
  subtitle: '',
  value: '',
  placeholder: 'Select a word or type here...',
  showHeader: true,
  showCopyButton: false,
  copyButtonTitle: '复制内容',
  isTextarea: false,
  customClass: '',
  contentClass: '',
  copyText: ''
})

const emit = defineEmits<{
  'update:value': [value: string]
  'input': [value: string]
  'copy': [text: string]
}>()

const localValue = ref(props.value)
const copied = ref(false)

const displayText = computed(() => {
  return props.value || props.copyText || ''
})

const copyButtonText = computed(() => {
  return copied.value ? '已复制' : '❐'
})

const handleInput = (event: Event) => {
  const target = event.target as HTMLTextAreaElement
  localValue.value = target.value
  emit('update:value', target.value)
  emit('input', target.value)
}

const handleCopy = async () => {
  const textToCopy = props.copyText || props.value
  if (!textToCopy) return

  try {
    await navigator.clipboard.writeText(textToCopy)
    copied.value = true
    emit('copy', textToCopy)

    // 1秒后重置复制状态
    setTimeout(() => {
      copied.value = false
    }, 1000)
  } catch (error) {
    console.error('复制失败:', error)
  }
}

// 监听外部value变化
watch(() => props.value, (newVal) => {
  localValue.value = newVal
})
</script>

<style scoped>
/* 如果需要自定义样式可以在这里添加 */
</style>
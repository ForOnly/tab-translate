<template>
  <div class="text-sm text-right text-gray-600">
    <span v-if="prefix">{{ prefix }}</span>
    <span v-if="detectedLang && getLangName">{{ getLangName(detectedLang) }}</span>
    <span v-else>{{ detectedLang || 'auto' }}</span>
  </div>
</template>

<script setup lang="ts">
interface Props {
  detectedLang?: string
  getLangName?: (code: string) => string
  prefix?: string
}

const props = withDefaults(defineProps<Props>(), {
  detectedLang: 'auto',
  getLangName: undefined,
  prefix: 'Detected language: '
})
</script>

<style scoped>
/* 可以添加自定义样式 */
</style>
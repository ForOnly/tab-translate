<template>
  <div
    v-if="content"
    class="bg-blue-100 p-3 rounded-xl max-h-[160px] overflow-y-auto text-sm">
    <div v-html="content"></div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  content?: string
}

const props = withDefaults(defineProps<Props>(), {
  content: ''
})
</script>

<style scoped>
/* 可以添加自定义样式 */
</style>
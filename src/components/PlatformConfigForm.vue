<template>
  <div>
    <div class="m-[1.5rem] py-2 bg-gray-600 text-white rounded-lg shadow transition justify-center text-center">
      <h2>平台配置</h2>
    </div>
    <div class="p-[1.5rem] pt-0">
      <div v-if="platforms && platforms.length">
        <div v-for="platform in platforms" :key="platform.code" class="platform-card">
          <p class="text-sm font-bold">{{ platform.name }}</p>
          <div class="h-px bg-slate-300 my-2"></div>
          <form @submit.prevent="savePlatformConfig(platform.code)" v-if="platform.configSchema">
            <div v-for="field in platform.configSchema ?? []" :key="field.key" class="form-field">
              <label :for="platform.code + '-' + field.key">{{ field.label }}</label>
              <input
                :id="platform.code + '-' + field.key"
                :type="field.type || 'text'"
                v-model="allConfigs[platform.code]![field.key]" />
            </div>
            <button type="submit">保存</button>
          </form>
          <p v-else>平台无配置项</p>
        </div>
      </div>
      <div v-else>
        <p>没有平台可配置。</p>
      </div>
      <div class="flex justify-end justify-items-end">
        <button @click="closePlatformConfig">关闭</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { readChromeLocal } from "@/utils/chromeUtils";
import { reactive, watch } from "vue";

interface Props {
  platforms: TranslatePlatform[] | null;
  visible: boolean | false;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: "updateConfig", configs: Record<string, Record<string, string>>): void;
  (e: "close"): void;
}>();

// 响应式存储所有平台的配置
// 响应式存储所有平台的配置
const allConfigs = reactive<Record<string, Record<string, string>>>({});

// 初始化每个平台配置
const initConfigs = () => {
  if (!props.platforms) return; // 先保护
  props.platforms?.forEach((p) => {
    if (!allConfigs[p.code]) allConfigs[p.code] = {};
    p.configSchema?.forEach(async (field: PlatformConfigField) => {
      if (!(field.key in allConfigs[p.code]!)) {
        readChromeLocal(field.key)
          .then((val) => {
            allConfigs[p.code]![field.key] = val ?? "";
          })
          .catch((err) => {
            console.error(err);
          });
      }
    });
  });
};

// watch 当 platforms 改变时初始化配置
watch(
  () => props.platforms,
  () => initConfigs(),
  { immediate: true },
);

// 单个平台保存
const savePlatformConfig = (platformCode: string) => {
  emit("updateConfig", { ...allConfigs });
};

const closePlatformConfig = () => {
  emit("close");
};
</script>

<style scoped>
.platform-card {
  margin-bottom: var(--space-lg);
  padding: var(--space-lg);
  border-radius: var(--radius-lg);
  background-color: var(--color-primary-light);
}
.form-field {
  display: flex;
  flex-direction: column;
  margin-bottom: var(--space-sm);
}
label {
  font-weight: 500;
  margin-bottom: var(--space-xs);
}
input {
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  font-size: var(--font-size-sm);
}
button {
  margin-top: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-sm);
  border: none;
  background-color: var(--color-primary);
  color: var(--color-white);
  cursor: pointer;
  font-size: var(--font-size-sm);
}
button:hover {
  background-color: var(--color-primary-hover);
}
</style>

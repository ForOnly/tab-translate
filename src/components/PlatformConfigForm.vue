<template>
  <div>
    <h2>平台配置</h2>
    <div v-if="platforms && platforms.length">
      <div v-for="platform in platforms" :key="platform.code" class="platform-card">
        <h3>{{ platform.name }}</h3>

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
  </div>
</template>

<script setup lang="ts">
import { readChromeLocal } from "@/utils/chromeUtils";
import { reactive, watch } from "vue";

interface Props {
  platforms: TranslatePlatform[] | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: "updateConfig", configs: Record<string, Record<string, string>>): void;
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
</script>

<style scoped>
.platform-card {
  margin-bottom: 1rem;
  padding: 1rem;
  border-radius: 8px;
  background-color: #f0f4ff;
}
.form-field {
  display: flex;
  flex-direction: column;
  margin-bottom: 0.5rem;
}
label {
  font-weight: 500;
  margin-bottom: 0.2rem;
}
input {
  padding: 0.4rem 0.6rem;
  border-radius: 4px;
  border: 1px solid #bbb;
}
button {
  margin-top: 0.5rem;
  padding: 0.4rem 0.8rem;
  border-radius: 4px;
  border: none;
  background-color: #0052cc;
  color: #fff;
  cursor: pointer;
}
button:hover {
  background-color: #0066ff;
}
</style>

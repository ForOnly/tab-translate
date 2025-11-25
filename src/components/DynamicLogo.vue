<template>
  <div id="dynamic-logo">
    <div
      v-for="i in 20"
      :key="i"
      class="point-out"
      :style="{ animation: `pointX${i} 8s linear infinite alternate` }"
    >
      <div class="point-in" :style="pointStyles[i - 1]"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive } from "vue";
interface PointStyle {
  width: string;
  height: string;
  boxShadow: string;
  transform: string;
  animation: string;
}

// 生成随机整数
const getRandom = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min) + min);

// 存储每个点的样式
const pointStyles = reactive<PointStyle[]>([]);

let styleEl: HTMLStyleElement | null = null;

// 生成每个点的随机样式
const generatePointStyles = () => {
  for (let i = 0; i < 20; i++) {
    pointStyles[i] = {
      width: "0px",
      height: "0px",
      boxShadow: `0 0 100px 100px rgba(${getRandom(0, 255)}, ${getRandom(
        0,
        255
      )}, ${getRandom(0, 255)}, ${Math.random() + 0.5})`,
      transform: `translate(${getRandom(0, 255)}px, ${getRandom(0, 255)}px)`,
      animation: `pointY${
        i + 1
      } 8s cubic-bezier(0.6,0,0.4,1) infinite alternate`,
    };
  }
};

// 动态生成 keyframes
const generateKeyframes = () => {
  let cssContent = "";
  for (let i = 1; i <= 20; i++) {
    const yPositions = Array.from({ length: 5 }, () => getRandom(-100, 300));
    const xPositions = Array.from({ length: 5 }, () => getRandom(-100, 300));

    cssContent += `
      @keyframes pointY${i} {
        0% { transform: translateY(${yPositions[0]}px); }
        25% { transform: translateY(${yPositions[1]}px); }
        50% { transform: translateY(${yPositions[2]}px); }
        75% { transform: translateY(${yPositions[3]}px); }
        100% { transform: translateY(${yPositions[4]}px); }
      }
      @keyframes pointX${i} {
        0% { transform: translateX(${xPositions[0]}px); }
        25% { transform: translateX(${xPositions[1]}px); }
        50% { transform: translateX(${xPositions[2]}px); }
        75% { transform: translateX(${xPositions[3]}px); }
        100% { transform: translateX(${xPositions[4]}px); }
      }
    `;
  }
  return cssContent;
};

onMounted(() => {
  generatePointStyles();

  styleEl = document.createElement("style");
  styleEl.innerHTML = generateKeyframes();
  document.head.appendChild(styleEl);
});

onBeforeUnmount(() => {
  if (styleEl && document.head.contains(styleEl)) {
    document.head.removeChild(styleEl);
  }
});
</script>

<style scoped>
#dynamic-logo {
  position: relative;
  width: 100%;
  height: 100%;
}

.point-out {
  position: absolute;
}

.point-in {
  width: 0;
  height: 0;
  position: absolute;
}
</style>

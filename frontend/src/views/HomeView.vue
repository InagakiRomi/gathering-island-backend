<template>
  <div ref="scaleContainer" class="page-container">
    <h1 class="page-title">聚會島</h1>
    <div class="center">
      <button @click="goToEvents" class="go-button">前往活動</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useScaleToViewport } from '@/composables/ui/useScaleToViewport'

const scaleContainer = ref(null) // DOM 參考
useScaleToViewport(scaleContainer) // 呼叫 composable，處理縮放邏輯

// 路由跳轉
const router = useRouter()
const goToEvents = () => router.push({ name: 'eventsPage' })
</script>

<style scoped>

/* 頁面內容容器 */
.page-container {
  transform-origin: top left; /* 搭配 JS 的 scale 使用 */
  position: fixed;
  top: 0;
  left: 0;
  display: flex;
  align-items: center;
  background-image: url('/images/island-bg.jpg');
  background-size: cover;
}

/* 標題樣式 */
.page-title {
  position: absolute;
  top: 40px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 48px;
  font-weight: bold;
  color: #363636ff;
}

/* 按鈕容器置中 */
.center {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* 前往按鈕樣式 */
.go-button {
  font-size: 24px;
  padding: 16px 32px;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.go-button:hover {
  background-color: #369f75;
}
</style>

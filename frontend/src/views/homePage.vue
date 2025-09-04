<template>
  <div class="home-container">
    <div class="overlay">
      <h1>聚會島</h1>
      <p>歡迎來到聚會島，開始探索島嶼吧！</p>
      <button @click="goToEventsPage">開始探索</button>
    </div>
  </div>
</template>

<script setup lang="ts">

// 跳轉 eventsPage 頁面
import { useRouter } from 'vue-router'

const router = useRouter()

const goToEventsPage = () => {
  router.push({ name: 'eventsPage' })
}

</script>

<style scoped>
.home-container {
  background-image: var(--background-image-url);
  background-size: cover;
  background-position: center;
  height: 100vh;
  width: 100vw;
  position: relative;
}

.overlay {
  position: absolute;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 1rem;
}

.overlay h1 {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.overlay p {
  font-size: 1.2rem;
  margin-bottom: 2rem;
}

.overlay button {
  background-color: #369f75;
  color: white;
  padding: 0.75rem 2rem;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-weight: bold;
}

.overlay button:hover {
  background-color: #2b8561ff;
}
</style>

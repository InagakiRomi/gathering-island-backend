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
  import { RouteName } from '../router/index';
    import { useRouter } from 'vue-router';

  const router = useRouter();

  function goToEventsPage() {
    router.push({
      name: RouteName.EVENTS_PAGE
    });
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
  text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.5);
}

.overlay p {
  font-size: 1.2rem;
  margin-bottom: 2rem;
  text-shadow: 1px 1px 4px rgba(0, 0, 0, 0.5);
}

.overlay button {
  background: linear-gradient(135deg, #36d1dc, #5b86e5);
  color: white;
  padding: 1.25rem 3rem;
  font-size: 1.5rem;
  border: none;
  border-radius: 999px;
  cursor: pointer;
  font-weight: bold;
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

/* 放大＋流光線滑過效果 */
.overlay button::before {
  content: "";
  position: absolute;
  top: 0;
  left: -75%;
  width: 50%;
  height: 100%;
  background: linear-gradient(120deg, rgba(255,255,255,0.4), rgba(255,255,255,0));
  transform: skewX(-20deg);
  transition: left 0.6s ease;
}

.overlay button:hover::before {
  left: 125%;
}

.overlay button:hover {
  transform: scale(1.05);
  box-shadow: 0 12px 25px rgba(0, 0, 0, 0.4);
}

/* 點擊時微縮回饋 */
.overlay button:active {
  transform: scale(0.97);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
}
</style>

<template>
  <div class="home-container">
    <div class="overlay">
      <h1>聚會島</h1>
      <p>歡迎來到聚會島，開始探索島嶼吧！</p>
      <div class="button-group">
        <button @click="goToEventsPage" class="explore-button">開始探索</button>
        <button @click="goToLoginPage" class="login-button">登入</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { RouteName } from "../router/index";

const router = useRouter();

function goToEventsPage() {
  router.push({ name: RouteName.EVENTS_PAGE });
}

function goToLoginPage() {
  router.push({ name: RouteName.LOGIN_PAGE });
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

/* 通用按鈕樣式 */
.overlay button {
  position: relative;
  color: white;
  padding: 1.25rem 3rem;
  font-size: 1.5rem;
  border: none;
  border-radius: 999px;
  cursor: pointer;
  font-weight: bold;
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
  overflow: hidden;
}

/* Login 按鈕 */
.login-button {
  background: linear-gradient(135deg, #f091b9ff, #f859bbff);
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 10;
}

/* 進入頁面按鈕 */
.explore-button {
  background: linear-gradient(135deg, #36d1dc, #5b86e5);
}

/* 放大＋流光線滑過效果 */
.overlay button::before {
  content: "";
  position: absolute;
  top: 0;
  left: -75%;
  width: 50%;
  height: 100%;
  background: linear-gradient(
    120deg,
    rgba(255, 255, 255, 0.4),
    rgba(255, 255, 255, 0)
  );
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

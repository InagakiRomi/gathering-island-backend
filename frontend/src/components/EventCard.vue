<template>
  <div class="event-card">
    <div class="event-card__image-container">
      <img
        class="event-card__image_url"
        :src="image_url"
        :alt="event_name"
      />
    </div>
    <div class="event-card__content">
      <h2 class="event-card__title">{{ event_name }}</h2>
      <div class="event-card__info">
        <span class="event-card__icon">🕒</span>
        <p class="event-card__time">{{ formattedTime }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  image_url: string
  event_name: string
  event_time: string | Date
}
const props = defineProps<Props>()

const formattedTime = computed(() => {
  const date = new Date(props.event_time)
  return date.toLocaleString('zh-CN', {
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    day: 'numeric',
  })
})
</script>

<style scoped>

/* 卡片整體樣式 */
.event-card {
  width: 100%;
  max-width: 420px;
  height: 340px;
  background-color: #fffef9;
  border-radius: 12px;
  border: 1px solid #e8d9c1;
  box-shadow: 4px 6px 16px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: transform 0.4s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.4s ease;
  font-family: 'Segoe UI', 'PingFang SC', 'Helvetica Neue', sans-serif;
  display: flex;
  flex-direction: column;
  cursor: pointer;
}

/* 滑鼠懸停時的立體浮起效果 */
.event-card:hover {
  transform: translateY(-6px) scale(1.02);
  box-shadow: 10px 12px 32px rgba(0, 0, 0, 0.12);
}

/* 圖片容器區塊 */
.event-card__image-container {
  padding: 12px;
  background-color: #fff8ef;
  overflow: hidden;
}

/* 圖片動畫縮放效果 */
.event-card__image_url {
  width: 100%;
  height: 180px;
  object-fit: cover;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  display: block;
  transition: transform 0.4s ease;
}

.event-card:hover .event-card__image_url {
  transform: scale(1.05);
}

/* 卡片內容區域 */
.event-card__content {
  background-color: #fdf3e7;
  padding: 16px;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  opacity: 1;
  transition: opacity 0.4s ease;
}

.event-card:hover .event-card__content {
  opacity: 1;
}

/* 標題樣式 */
.event-card__title {
  font-size: 1.3rem;
  font-weight: bold;
  color: #5e3c23;
  margin-bottom: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.3s ease;
}

.event-card:hover .event-card__title {
  color: #b15c1d;
}

/* 時間區域 */
.event-card__info {
  display: flex;
  align-items: center;
  gap: 6px;
}

.event-card__icon {
  font-size: 1rem;
  color: #d17a22;
  transition: transform 0.3s ease;
}

.event-card:hover .event-card__icon {
  transform: scale(1.2) rotate(-5deg);
}

.event-card__time {
  font-size: 0.95rem;
  color: #6c584c;
  margin: 0;
  transition: color 0.3s ease;
}

.event-card:hover .event-card__time {
  color: #4e3a2b;
}
</style>

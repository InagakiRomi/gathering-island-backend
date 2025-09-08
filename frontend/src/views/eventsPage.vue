<template>
  <div class="events-page">
    <h1 class="events-page__title">活動一覽</h1>

    <!-- 關鍵字搜尋 -->
    <div class="search-container">
      <div class="search-input-wrapper">
        <input
          v-model="searchQuery"
          @keyup.enter="search"
          type="text"
          placeholder="輸入關鍵字搜尋活動"
          class="search-input"
        />
        <button @click="search" class="search-button">搜尋</button>
      </div>
    </div>

    <!-- 活動卡 -->
    <div class="events-page__grid">
      <EventCard
        v-for="event in events"
        :key="event.event_id"
        :image_url="event.image_url!"
        :event_name="event.event_name"
        :event_time="event.event_time"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import EventCard from '@/components/EventCard.vue'
  import api from '@/lib/api'
  import { getEventImageUrl } from '@/utils/eventImage'
  import type { Event } from '@/types/Event'

  const events = ref<Event[]>([])
  const searchQuery = ref('')

  // 封裝 enrichEvents 處理
  const enrichEvents = (raw: Event[]) =>
    raw.map((event) => ({
      ...event,
      image_url: getEventImageUrl(event.event_type),
    }))

  const fetchEvents = async (query?: string) => {
    try {
      const params = query ? { search: query } : {}
      const response = await api.get<Event[]>('/events', { params })
      events.value = enrichEvents(response.data)
    } catch (error) {
      console.error('載入活動資料失敗', error)
    }
  }

  const search = () => {
    fetchEvents(searchQuery.value.trim())
  }

  onMounted(() => {
    fetchEvents()
  })
</script>

<style scoped lang="scss">

  // 主容器樣式
  .events-page {
    width: 100%;
    padding: 48px 0;
    background: linear-gradient(to bottom, #fef9f4, #f5e8d5);
    min-height: 100vh;
    box-sizing: border-box;
  }

  .events-page__title {
    font-size: 2.4rem;
    font-weight: 600;
    text-align: center;
    color: #4e342e;
    margin-bottom: 40px;
    font-family: 'Segoe UI', 'PingFang SC', 'Helvetica Neue', sans-serif;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
  }

  // 搜尋區塊
  .search-container {
    margin-bottom: 32px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .search-input-wrapper {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
    max-width: 480px;
    background: #fff;
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 12px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
    transition: box-shadow 0.3s ease;

    &:focus-within {
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
      border-color: #999;
    }

    @media (min-width: 601px) {
      flex-direction: row;
      gap: 12px;
      align-items: center;
    }
  }

  .search-input {
    flex: 1;
    border: none;
    outline: none;
    padding: 0.5rem;
    font-size: 1rem;
    background: transparent;
    font-family: inherit;
    color: #333;
  }

  .search-button {
    background-color: #f4a261;
    color: white;
    border: none;
    padding: 0.5rem 1.2rem;
    border-radius: 8px;
    font-size: 1rem;
    cursor: pointer;
    transition: background-color 0.3s ease, transform 0.1s ease;
    font-weight: 600;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

    &:hover {
      background-color: #e76f51;
      transform: translateY(-1px);
    }

    &:active {
      transform: scale(0.98);
    }
  }

  // 活動卡區塊
  .events-page__grid {
    padding-right: $padding-desktop;
    padding-left: $padding-desktop;
    display: grid;
    gap: 24px;
    grid-template-columns: repeat(4, 1fr);
  }

  /* 平板版 */
  @media (max-width: $breakpoint-tablet) {
    .events-page__grid {
      padding-right: $padding-tablet;
      padding-left: $padding-tablet;
    }
  }

  /* 手機版 */
  @media (max-width: $breakpoint-mobile) {
    .events-page__grid {
      padding-right: $padding-mobile;
      padding-left: $padding-mobile;
      grid-template-columns: repeat(2, 1fr);
    }
  }
</style>
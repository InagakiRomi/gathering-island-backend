<template>
  <div class="events-page">
    <h1 class="events-page__title">活動一覽</h1>
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

  const fetchEvents = async (): Promise<void> => {
    try {
      const response = await api.get<Event[]>('/events')
      events.value = response.data.map((event) => ({
        ...event,
        image_url: getEventImageUrl(event.event_type),
      }))
    } catch (error) {
      console.error('載入活動資料失敗', error)
    }
  }

  onMounted(() => {
    fetchEvents()
  })
</script>

<style scoped>
  .events-page {
    width: 100%;
    max-width: 100%;
    padding-top: 24px;
    padding-right: 48px;
    padding-bottom: 48px;
    padding-left: 48px;
    background-color: #f3f4f6;
    min-height: 100vh;
    box-sizing: border-box;
  }

  .events-page__title {
    font-size: 2rem;
    font-weight: bold;
    margin-bottom: 24px;
  }

  .events-page__grid {
    display: grid;
    gap: 24px;
    grid-template-columns: repeat(6, 1fr); /* 預設電腦版顯示 6 個 */
  }

  /* 平板版：寬度介於 768px 到 1024px */
  @media (max-width: 1024px) {
    .events-page__grid {
      grid-template-columns: repeat(4, 1fr);
    }
  }

  /* 手機版：寬度小於 768px */
  @media (max-width: 768px) {
    .events-page__grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
</style>
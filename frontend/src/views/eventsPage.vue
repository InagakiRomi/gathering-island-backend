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
    padding-bottom: 48px;
    background-color: #f3f4f6;
    min-height: 100vh;
    box-sizing: border-box;
  }

  .events-page__title {
    font-size: 2rem;
    font-weight: bold;
    margin-bottom: 24px;
  }
</style>

<style scoped lang="scss">
  /*電腦版 */
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
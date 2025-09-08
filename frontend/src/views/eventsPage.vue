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
  text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
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
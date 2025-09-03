<template>
  <div class="events-page">
    <h1 class="events-page__title">活動一覽</h1>
    <div class="events-page__grid">
      <EventCard
        v-for="event in events"
        :key="event.event_id"
        :image_url="event.image_url"
        :event_name="event.event_name"
        :event_time="event.event_time"
      />
    </div>
  </div>
</template>

<script setup>
import EventCard from '../components/EventCard.vue'
const base = import.meta.env.BASE_URL
const events = [
  {
    event_id: 1,
    image_url: `${base}images/events/FOOD.jpg`,
    event_name: '中秋烤肉大會',
    event_time: '2025/09/10 18:00 - 21:00',
  },
  {
    event_id: 2,
    image_url: `${base}/images/events/PARTY.jpg`,
    event_name: 'Vue.js 開發者日',
    event_time: '2025/09/15 14:00 - 17:00',
  },
  {
    event_id: 3,
    image_url: `${base}/images/events/OTHER.jpg`,
    event_name: '創業交流會',
    event_time: '20250 10:00 - 12:00',
  },
]
</script>

<style scoped>
.events-page {
  padding: 24px;
  background-color: #f3f4f6;
  min-height: 100vh;
}

.events-page__title {
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 24px;
}

.events-page__grid {
  display: grid;
  gap: 24px;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}
</style>
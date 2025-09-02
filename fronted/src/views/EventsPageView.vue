<template>
  <div class="events-page">
    <h1 class="events-page__title">活動一覽</h1>
    <div class="events-page__grid">
      <EventCard
        v-for="event in events"
        :key="event.id"
        :image="event.image"
        :title="event.title"
        :time="event.time"
      />
    </div>
  </div>
</template>

<script setup>
import EventCard from '../components/EventCard.vue'

const events = [
  {
    id: 1,
    image: 'https://source.unsplash.com/random/400x300?event1',
    title: '中秋烤肉大會',
    time: '2025/09/10 18:00 - 21:00',
  },
  {
    id: 2,
    image: 'https://source.unsplash.com/random/400x300?event2',
    title: 'Vue.js 開發者日',
    time: '2025/09/15 14:00 - 17:00',
  },
  {
    id: 3,
    image: 'https://source.unsplash.com/random/400x300?event3',
    title: '創業交流會',
    time: '2025/09/20 10:00 - 12:00',
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

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
import { ref, onMounted } from 'vue'
import EventCard from '../components/EventCard.vue'
import api from '../lib/axios'
import eventTypeToImage from '../utils/eventImageMap'

const base = import.meta.env.BASE_URL
const events = ref([])

const fetchEvents = async () => {
  try {
    const response = await api.get('/events')
    events.value = response.data.map((event) => {
      const imageFile = eventTypeToImage[event.event_type] || eventTypeToImage.default
      return {
        ...event,
        image_url: `${base}images/events/${imageFile}`,
      }
    })
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
  padding: 24px;
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
  grid-template-columns: repeat(4, 1fr);
}

@media (max-width: 768px) {
  .events-page__grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
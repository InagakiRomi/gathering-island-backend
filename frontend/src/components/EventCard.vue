<template>
  <div class="event-card">
    <img
      class="event-card__image_url"
      :src="image_url"
      :alt="event_name"
    />
    <div class="event-card__content">
      <h2 class="event-card__title">{{ event_name }}</h2>
      <p class="event-card__time">{{ event_time }}</p>
    </div>
  </div>
</template>

<script setup>
defineProps({
  image_url: String,
  event_name: String,
  event_time: Date,
})
</script>

<style scoped>
.event-card {
  width: 100%;
  max-width: 400px;
  background-color: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.event-card__image_url {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.event-card__content {
  padding: 16px;
}

.event-card__title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #2d2d2d;
  margin-bottom: 4px;
}

.event-card__time {
  font-size: 0.875rem;
  color: #666666;
}
</style>
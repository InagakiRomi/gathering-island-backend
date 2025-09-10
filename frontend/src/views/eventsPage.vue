<template>
  <div class="events-page">
    <h1 class="events-page__title">活動一覽</h1>

    <!-- 搜尋 + 選單（同一排） -->
    <div class="search-container">
      <div class="search-input-wrapper">

        <!-- 活動類型 -->
        <select v-model="selectedEventType" class="dropdown">
          <option value="">所有類型</option>
          <option
            v-for="type in eventTypes"
            :key="type.value"
            :value="type.value"
          >
            {{ type.label }}
          </option>
        </select>

        <!-- 排序 -->
        <select v-model="selectedSort" class="dropdown">
          <option
            v-for="opt in sortOptions"
            :key="opt.value"
            :value="opt.value"
          >
            {{ opt.label }}
          </option>
        </select>

        <!-- 關鍵字搜尋 -->
        <input
          v-model="searchQuery"
          @keyup.enter="search"
          type="text"
          placeholder="輸入關鍵字搜尋活動"
          class="search-input"
        />
        <button @click="search" class="search-button">搜尋活動</button>
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
  import { ref, onMounted, watch } from 'vue'
  import { getEventImageUrl } from '@/utils/eventImage'
  import type { Event } from '@/types/Event'
  import EventCard from '@/components/EventCard.vue'
  import api from '@/lib/api'
  import { useSortOptions } from '@/composables/useSortOptions'

  // 排序選項
  const { selectedSort, sortOptions, sortMap } = useSortOptions()

  // 活動列表資料
  const events = ref<Event[]>([])

  // 搜尋關鍵字
  const searchQuery = ref('')

  // 使用者選擇的活動類型（空字串表示「所有類型」）
  const selectedEventType = ref('')

  // 活動類型選單資料（從 API 載入）
  const eventTypes = ref<{ value: number; label: string }[]>([])

  // 處理原始活動資料，加入圖片 URL 欄位
  const enrichEvents = (raw: Event[]) =>
    raw.map((event) => ({
      ...event,
      image_url: getEventImageUrl(event.event_type), // 根據類型加上圖片
    }))

  // 從後端取得活動類型列表（填充下拉選單）
  const fetchEventTypes = async () => {
    try {
      const response = await api.get('/events/eventType')
      eventTypes.value = response.data
    } catch (error) {
      console.error('取得活動類型失敗', error)
    }
  }

  // 根據目前篩選條件取得活動清單
  const fetchEvents = async (query?: string) => {
    try {
      const params: Record<string, any> = {}

      // 加入關鍵字搜尋條件（如果有）
      if (query) {
        params.search = query
      }

      // 如果使用者有選擇活動類型，加入條件
      if (selectedEventType.value !== '') {
        params.eventType = selectedEventType.value
      }

      // 使用 composable 裡的完整 sortMap
      const sortParam = sortMap[selectedSort.value]
      if (sortParam) {
        params.sort = sortParam
      }

      // 發送 API 請求，取得活動資料
      const response = await api.get<Event[]>('/events', { params })

      // 補上圖片並存入狀態
      events.value = enrichEvents(response.data)
    } catch (error) {
      console.error('載入活動資料失敗', error)
    }
  }

  // 模糊搜尋方法
  const search = () => {
    fetchEvents(searchQuery.value.trim())
  }

  // 監聽排序與活動類型的變化，自動重新撈資料
  watch([selectedEventType, selectedSort], () => {
    fetchEvents(searchQuery.value.trim())
  })

  // 首次載入時，載入分類與活動資料
  onMounted(() => {
    fetchEventTypes()
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
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 1000px;
  background: #fff5ee;
  padding: 1.5rem;
  border-radius: 20px;
  border: 2px dashed #f4a261;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;

  &:focus-within {
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.15);
    border-color: #e76f51;
  }

  select,
  input,
  .search-button {
    flex: 1 1 180px; // 每個元素的最小寬度
    max-width: 240px;
  }

  .search-button {
    max-width: 160px;
  }

  @media (max-width: 880px) {
    flex-direction: column;
    align-items: stretch;

    select,
    input,
    .search-button {
      flex: none;
      width: 100%;
      max-width: 100%;
    }

    gap: 12px;
  }
}

// 下拉選單與搜尋欄位通用樣式
.dropdown,
.search-input {
  padding: 0.6rem 1rem;
  border-radius: 14px;
  border: 2px solid #f4a261;
  background-color: #fffaf4;
  font-size: 1rem;
  color: #4e342e;
  font-family: 'Segoe UI', 'PingFang SC', 'Helvetica Neue', sans-serif;
  transition: all 0.3s ease;

  &:focus,
  &:hover {
    border-color: #e76f51;
    box-shadow: 0 0 0 3px rgba(231, 111, 81, 0.2);
    outline: none;
  }
}

// 搜尋按鈕樣式
.search-button {
  background-color: #ffb347;
  color: #fff;
  border: none;
  padding: 0.6rem 1.4rem;
  border-radius: 20px;
  font-size: 1rem;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.25s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 6px;

  &:hover {
    background-color: #ff9a76;
    transform: scale(1.05);
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
    grid-template-columns: repeat(3, 1fr);
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
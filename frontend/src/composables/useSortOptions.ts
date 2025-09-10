import { ref } from 'vue'

/** 排序選項型別 */
export type SortOption =
  | 'eventTimeASC'
  | 'eventTimeDESC'
  | 'createdAtASC'
  | 'createdAtDESC'
  | 'maxParticipantsASC'
  | 'maxParticipantsDESC'

/** 排序選單下拉資料 */
export const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'eventTimeASC', label: '活動時間 - 新到舊' },
  { value: 'eventTimeDESC', label: '活動時間 - 舊到新' },
  { value: 'createdAtASC', label: '建立時間 - 新到舊' },
  { value: 'createdAtDESC', label: '建立時間 - 舊到新' },
  { value: 'maxParticipantsASC', label: '參加人數 - 低到高' },
  { value: 'maxParticipantsDESC', label: '參加人數 - 高到低' },
]

/** 對應後端實際的排序語法 */
export const sortMap: Record<SortOption, string> = {
  eventTimeASC: 'event_time:ASC',
  eventTimeDESC: 'event_time:DESC',
  createdAtASC: 'created_at:ASC',
  createdAtDESC: 'created_at:DESC',
  maxParticipantsASC: 'max_participants:ASC',
  maxParticipantsDESC: 'max_participants:DESC',
}

/** Composable - 回傳排序選擇狀態 */
export function useSortOptions(defaultSort: SortOption = 'eventTimeASC') {
  const selectedSort = ref<SortOption>(defaultSort)

  return {
    selectedSort,
    sortOptions,
    sortMap,
  }
}
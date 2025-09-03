/** 活動類型對照表 */
export enum EventType {

  /** 派對 */
  PARTY = 1,

  /** 音樂 */
  MUSIC = 2,
  
  /** 學習 */
  LEARNING = 3,

  /** 展覽 */
  EXHIBITION = 4,

  /** 旅行 */
  TRAVEL = 5,

  /** 運動 */
  SPORTS = 6,

  /** 遊戲 */
  GAME = 7,

  /** 美食 */
  FOOD = 8,

  /** 其他 */
  OTHER = 9,
}

/** 對應 EventType 數值轉中文 */
export const EventTypeNameMap: Record<EventType, string> = {
  [EventType.PARTY]: '派對',
  [EventType.MUSIC]: '音樂',
  [EventType.LEARNING]: '學習',
  [EventType.EXHIBITION]: '展覽',
  [EventType.TRAVEL]: '旅行',
  [EventType.SPORTS]: '運動',
  [EventType.GAME]: '遊戲',
  [EventType.FOOD]: '美食',
  [EventType.OTHER]: '其他',
};

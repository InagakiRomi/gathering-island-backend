/** 聚會排序欄位 enum */
export enum GatheringSortBy {
  /** 參加人數 */
  PARTICIPANT_NUMBERS = 'participantNumbers',

  /** 活動費用 */
  PRICE = 'price',

  /** 結束狀態 */
  STATUS = 'status',

  /** 聚會分類 */
  Type = 'type',

  /** 活動日期 */
  START_TIME = 'startTime',

  /** 報名截止日期 */
  DUE_DATE = 'dueDate',

  /** 創建日期 */
  CREATED_AT = 'createdAt',
}

/** 聚會排序方式 enum */
export enum GatheringSortOrder {
  /** 升冪 */
  ASC = 'ASC',

  /** 降冪 */
  DESC = 'DESC',
}

/** 聚會排序欄位 enum */
export enum GatheringSortBy {
  /** 結束狀態 */
  STATUS = 'status',

  /** 聚會分類 */
  Type = 'type',

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

/** 性別對照表 */
export enum Gender {
  /** 男生 */
  MAN = 1,

  /** 女生 */
  FEMALE = 2,
}

/** 對應 Gender 數值轉中文 */
export const GenderTypeNameMap: Record<Gender, string> = {
  [Gender.MAN]: '男性',
  [Gender.FEMALE]: '女性',
};
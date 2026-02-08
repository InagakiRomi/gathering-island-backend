import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * 獲取當前時間（使用 Asia/Taipei 時區）
 * @returns 當前時間的 Date 物件
 */
export function getNowInTaiwan(): Date {
  return dayjs.tz('Asia/Taipei').toDate();
}

/**
 * 將指定時間轉換為 Asia/Taipei 時區
 * @param date 要轉換的日期
 * @returns 轉換後的 Date 物件
 */
export function convertToTaiwanTime(date: Date): Date {
  return dayjs(date).tz('Asia/Taipei').toDate();
}

/**
 * 獲取當前時間的字符串格式（YYYY-MM-DD HH:mm:ss）
 * @returns 格式化後的時間字符串
 */
export function getNowInTaiwanFormatted(): string {
  return dayjs.tz('Asia/Taipei').format('YYYY-MM-DD HH:mm:ss');
}

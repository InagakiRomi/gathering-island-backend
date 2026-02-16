import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const APP_TIMEZONE = process.env.APP_TIMEZONE || 'UTC';
const FORMAT = 'YYYY-MM-DD HH:mm:ss';

/**
 * 時區工具類
 * 所有日期資料庫存 UTC，API 輸出時轉換為 APP_TIMEZONE
 */
export class DateUtil {
  /**
   * 將 UTC 日期轉換為應用時區的格式字串
   * @param date UTC 日期
   * @returns 格式化後的日期字串 (YYYY-MM-DD HH:mm:ss)
   */
  static toAppTimezone(date: Date): string {
    return dayjs(date).utc().tz(APP_TIMEZONE).format(FORMAT);
  }

  /**
   * 取得當前 UTC 時間
   * @returns UTC Date 物件
   */
  static nowUTC(): Date {
    return dayjs().utc().toDate();
  }

  /**
   * 取得應用時區
   * @returns 時區字串 (e.g. 'Asia/Taipei')
   */
  static getTimezone(): string {
    return APP_TIMEZONE;
  }

  /**
   * 取得日期格式
   * @returns 日期格式字串
   */
  static getFormat(): string {
    return FORMAT;
  }
}

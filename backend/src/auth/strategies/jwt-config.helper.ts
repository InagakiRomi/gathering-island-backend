import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';

/** 取得應用程式環境變數中的 JWT 設定值 */
@Injectable()
export class JwtConfigHelper {
  constructor(private readonly configService: ConfigService) {}

  /**
   * 取得 Refresh Token 的密鑰字串
   * @returns 從設定中取得的 refreshSecret 值，如果沒有設定則回傳空字串
   */
  getRefreshTokenSecret(): string {
    return this.configService.get<string>('jwt.refreshSecret') || '';
  }

  /**
   * 取得 Access Token 的密鑰字串
   * @returns 從設定中取得的 accessSecret 值，如果沒有設定則回傳空字串
   */
  getAccessTokenSecret(): string {
    return this.configService.get<string>('jwt.accessSecret') || '';
  }

  /**
   * 取得 Access Token 的過期時間
   * @returns 從設定中取得 accessExpiresIn 值，若未設定則預設回傳 '15m'
   */
  getAccessTokenExpiresIn(): string {
    return this.configService.get<string>('jwt.accessExpiresIn') || '15m';
  }

  /**
   * 取得 Refresh Token 的過期時間（以毫秒為單位）
   * @returns 從設定中取得 refreshExpiresIn 數值，若未設定則預設為 7 天（604800000 毫秒）
   */
  getRefreshTokenExpiresIn(): number {
    return this.configService.get<number>('jwt.refreshExpiresIn') || 604800000;
  }
}

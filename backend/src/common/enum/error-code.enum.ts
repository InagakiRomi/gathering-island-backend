export enum ErrorCode {
  /** 驗證失敗，例如欄位格式錯誤或缺少必要資料 */
  VALIDATION_ERROR = 'VALIDATION_ERROR',

  /** 一般性的錯誤，例如請求格式錯誤或無法解析的參數 */
  BAD_REQUEST = 'BAD_REQUEST',

  /** 未授權，通常是使用者未登入或憑證失效 */
  UNAUTHORIZED = 'UNAUTHORIZED',

  /** 拒絕存取，使用者已登入但沒有權限 */
  FORBIDDEN = 'FORBIDDEN',

  /** 找不到資源，例如指定的 ID 查無資料 */
  NOT_FOUND = 'NOT_FOUND',

  /** 資源衝突，常見於資料重複建立或狀態衝突 */
  CONFLICT = 'CONFLICT',

  /** 伺服器內部錯誤，通常是未捕捉到的例外或非預期錯誤 */
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
}

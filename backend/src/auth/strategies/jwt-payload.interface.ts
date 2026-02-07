import { UserRole } from 'src/users/enum/auth.role';

/** JWT 中的 Payload 結構 */
export interface JwtPayload {
  /** 使用者的唯一識別碼 */
  sub: number;

  /** 使用者 mail */
  email: string;

  /** 使用者名稱 */
  username: string;

  /** 使用者的角色權限 */
  role: UserRole;

  /** 創建日期 */
  createdAt: string;

  /** 最後更新日期 */
  updatedAt: string;
}

import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { UserRole } from '../enum/auth.role';
import { DateUtil } from '../../common/utils/date.util';

/** 使用者 Entity */
@Entity()
export class User {
  /** 主鍵 id */
  @PrimaryKey({ autoincrement: true })
  id?: number;

  /** 使用者 mail */
  @Property({ unique: true })
  email: string;

  /** 使用者密碼 */
  @Property()
  passwordHash: string;

  /** 使用者 refreshToken 的雜湊值 */
  @Property({ default: '' })
  refreshTokenHash: string;

  /** 使用者名稱 */
  @Property()
  displayName: string;

  /** 使用者權限 */
  @Property({ default: UserRole.USER })
  role: UserRole;

  /** 創建日期 */
  @Property()
  createdAt: Date = DateUtil.nowUTC();

  /** 最後更新日期 */
  @Property({
    comment: '更新時間',
    onUpdate: () => DateUtil.nowUTC(),
    index: true,
  })
  updatedAt: Date = DateUtil.nowUTC();

  /** 自定義 JSON 輸出格式 */
  toJSON() {
    return {
      ...this,
      createdAt: DateUtil.toAppTimezone(this.createdAt),
      updatedAt: DateUtil.toAppTimezone(this.updatedAt),
    };
  }
}

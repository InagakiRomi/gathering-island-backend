import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import dayjs from 'dayjs';
import { UserRole } from '../enum/auth.role';

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
  @Property({ defaultRaw: 'NOW()' })
  createdAt: Date;

  /** 最後更新日期 */
  @Property({
    comment: '更新時間',
    onUpdate: () => new Date(),
    defaultRaw: 'NOW()',
    index: true,
  })
  updatedAt: Date;

  toJSON() {
    return {
      // 指定日期欄位格式
      ...this,
      createdAt: dayjs(this.createdAt).format('YYYY-MM-DD HH:mm:ss'),
      updatedAt: dayjs(this.updatedAt).format('YYYY-MM-DD HH:mm:ss'),
    };
  }
}

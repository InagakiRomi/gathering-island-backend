import {
  Entity,
  ManyToOne,
  PrimaryKey,
  Property,
  Unique,
} from '@mikro-orm/core';
import { Gathering } from './gathering.entity';
import { User } from '../../users/entities/user.entity';
import { DateUtil } from '../../common/utils/date.util';

/** 參與者 Entity - 記錄用戶參與活動的關係 */
@Entity()
@Unique({ properties: ['gathering', 'user'] })
export class Participant {
  /** 主鍵 id */
  @PrimaryKey({ autoincrement: true })
  id?: number;

  /** 活動 */
  @ManyToOne(() => Gathering)
  gathering: Gathering;

  /** 參與的用戶 */
  @ManyToOne(() => User)
  user: User;

  /** 報名日期 */
  @Property()
  joinedAt: Date = DateUtil.nowUTC();

  /** 自定義 JSON 輸出格式 */
  toJSON() {
    return {
      id: this.id,
      gatheringId: this.gathering?.id,
      userId: this.user?.id,
      joinedAt: DateUtil.toAppTimezone(this.joinedAt),
    };
  }
}

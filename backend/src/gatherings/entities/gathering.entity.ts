import {
  Collection,
  Entity,
  ManyToMany,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';
import { GatheringStatus } from '../enum/gathering.status';
import { GatheringType } from '../enum/gathering.type';
import dayjs from 'dayjs';
import { Tag } from '../../tags/entities/tag.entity';

/** 聚會 Entity */
@Entity()
export class Gathering {
  /** 主鍵 id */
  @PrimaryKey({ autoincrement: true })
  id?: number;

  /** 擁有者 id */
  @Property()
  userId: number;

  /** 標題 */
  @Property()
  title: string;

  /** 活動描述 */
  @Property({ default: '' })
  description: string;

  /** 活動地點 */
  @Property()
  location: string;

  /** 參加人數 */
  @Property()
  participantNumbers: number;

  /** 活動費用 */
  @Property()
  price: number;

  /** 結束狀態 */
  @Property({ default: GatheringStatus.OPEN })
  status: GatheringStatus;

  /** 聚會分類 */
  @Property({ default: GatheringType.PARTY })
  type: GatheringType;

  /** 活動日期 */
  @Property({ defaultRaw: `'2099-12-25 00:00:00'` })
  startTime: Date;

  /** 報名截止日期 */
  @Property({ defaultRaw: `'2099-12-31 23:59:59'` })
  deadline: Date;

  /** 標籤 */
  @ManyToMany(() => Tag, (tag) => tag.gatherings, { owner: true, eager: true })
  tags = new Collection<Tag>(this);

  /** 封存 */
  @Property({ default: false })
  isArchived: boolean;

  /** 創建日期 */
  @Property()
  createdAt: Date = new Date();

  /** 最後更新日期 */
  @Property({
    comment: '更新時間',
    onUpdate: () => new Date(),
    index: true,
  })
  updatedAt: Date = new Date();

  /** 自定義 JSON 輸出格式 */
  toJSON() {
    return {
      // 指定日期欄位格式
      ...this,
      startTime: dayjs(this.startTime).format('YYYY-MM-DD HH:mm:ss'),
      deadline: dayjs(this.deadline).format('YYYY-MM-DD HH:mm:ss'),
      createdAt: dayjs(this.createdAt).format('YYYY-MM-DD HH:mm:ss'),
      updatedAt: dayjs(this.updatedAt).format('YYYY-MM-DD HH:mm:ss'),

      // Tag 只回傳名稱
      tags: this.tags.getItems().map((tag) => tag.tagName),
    };
  }
}

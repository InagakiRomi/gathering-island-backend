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
import { DateUtil } from '../../common/utils/date.util';

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
  createdAt: Date = DateUtil.nowUTC();

  /** 最後更新日期 */
  @Property({
    comment: '更新時間',
    onUpdate: () => DateUtil.nowUTC(),
    index: true,
  })
  updatedAt: Date = DateUtil.nowUTC();

  /**
   * 根據當前時間計算聚會狀態
   * - deadline 之前：OPEN
   * - deadline 和 startTime 之間：UPCOMING
   * - 過了 startTime 之後：CLOSED
   *
   * @param {Date} now 當前時間（可選，預設為現在）
   * @returns {GatheringStatus} 計算後的狀態
   */
  calculateStatus(now: Date = new Date()): GatheringStatus {
    const currentTime = dayjs(now);
    const deadlineTime = dayjs(this.deadline);
    const startTime = dayjs(this.startTime);

    // 如果已經過了 startTime，狀態為 CLOSED
    if (currentTime.isAfter(startTime)) {
      return GatheringStatus.CLOSED;
    }

    // 如果已經過了 deadline 但還沒到 startTime，狀態為 UPCOMING
    if (currentTime.isAfter(deadlineTime) || currentTime.isSame(deadlineTime)) {
      return GatheringStatus.UPCOMING;
    }

    // 如果還沒到 deadline，狀態為 OPEN
    return GatheringStatus.OPEN;
  }

  /** 自定義 JSON 輸出格式 */
  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      title: this.title,
      description: this.description,
      location: this.location,
      participantNumbers: this.participantNumbers,
      price: this.price,
      type: this.type,
      status: this.status,
      isArchived: this.isArchived,
      startTime: DateUtil.toAppTimezone(this.startTime),
      deadline: DateUtil.toAppTimezone(this.deadline),
      createdAt: DateUtil.toAppTimezone(this.createdAt),
      updatedAt: DateUtil.toAppTimezone(this.updatedAt),
      // Tag 只回傳名稱
      tags: this.tags.getItems().map((tag) => tag.tagName),
    };
  }
}

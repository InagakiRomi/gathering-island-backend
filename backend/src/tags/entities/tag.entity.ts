import {
  Collection,
  Entity,
  ManyToMany,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';
import { Gathering } from '../../gatherings/entities/gathering.entity';

/** 標籤 Entity */
@Entity()
export class Tag {
  /** 標籤 id */
  @PrimaryKey({ autoincrement: true })
  id: number;

  /** 標籤名稱 */
  @Property({ unique: true })
  tagName: string;

  /** 多對多關聯：關聯到多個 Gathering */
  @ManyToMany(() => Gathering, (gathering) => gathering.tags)
  gatherings = new Collection<Gathering>(this);

  toJSON() {
    return {
      // 避免將 gatherings 一起序列化，防止循環引用與過多資料回傳
      id: this.id,
      tagName: this.tagName,
    };
  }
}

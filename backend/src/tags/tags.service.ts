import { EntityManager, raw } from '@mikro-orm/core';
import { SqlEntityManager } from '@mikro-orm/sqlite';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Gathering } from 'src/gatherings/entities/gathering.entity';
import { CreateTagDto } from './dto/create-tag.dto';
import { Tag } from './entities/tag.entity';
import { ErrorCode } from 'src/common/enum/error-code.enum';
import { TagWithUsageCount } from './types/tag-list.types';

@Injectable()
export class TagsService {
  constructor(private readonly entityManager: EntityManager) {}

  /**
   * 列出所有標籤（管理後台用）
   *
   * @returns {Promise<TagWithUsageCount[]>} 標籤清單
   */
  async findAllTags(): Promise<TagWithUsageCount[]> {
    // 從 Tag 表中查詢所有標籤
    const tags = await this.entityManager.find(
      Tag,
      {},
      { orderBy: { id: 'ASC' } },
    );

    // 從 Gathering 表中查詢各個 Tag 被聚會引用的次數
    const usageCountByTagId = await this.loadTagUsageCountByTagId();

    // 將標籤資料與被聚會引用的次數組合回傳
    return tags.map((tag) => ({
      id: tag.id,
      tagName: tag.tagName,
      usageCount: usageCountByTagId.get(tag.id) ?? 0,
    }));
  }

  /**
   * 根據標籤名稱查詢標籤 ID
   *
   * @param {string} tagName 標籤名稱
   * @returns {Promise<{tagId:number}>} 回傳符合名稱的標籤 ID
   * @throws {NotFoundException} 若找不到指定標籤則拋出錯誤
   */
  async findTagIdByName(tagName: string): Promise<{ tagId: number }> {
    // 查資料庫有沒有這個標籤
    const found = await this.entityManager.findOne(Tag, { tagName });

    // 如果沒有跳出錯誤
    if (!found) {
      throw new NotFoundException({
        message: `Tag with tagName "${tagName}" not found.`,
        code: ErrorCode.NOT_FOUND,
      });
    }

    return { tagId: found.id };
  }

  /**
   * 建立標籤
   *
   * @param {CreateTagDto} createTagDto 建立標籤的 DTO
   * @returns {Promise<Tag>} 回傳填入的標籤資料
   */
  async findOrCreateTag(createTagDto: CreateTagDto): Promise<Tag> {
    const { tagName } = createTagDto;

    // 查資料庫有沒有這個標籤
    let tag = await this.entityManager.findOne(Tag, { tagName });

    // 如果沒有執行建立標籤
    if (!tag) {
      tag = this.entityManager.create(Tag, { tagName: tagName });
      await this.entityManager.persistAndFlush(tag);
    }

    return tag;
  }

  /** 從 Gathering↔Tag 多對多關聯彙總各標籤被聚會引用的次數 */
  private async loadTagUsageCountByTagId(): Promise<Map<number, number>> {
    type Row = { tag: number; cnt: number | string };
    const em = this.entityManager as SqlEntityManager;

    // 從 Gathering 表中查詢各個 Tag 被聚會引用的次數
    const rows = await em
      .createQueryBuilder(Gathering, 'g')
      .select([raw('t.id as tag'), raw('count(*) as cnt')])
      .join('g.tags', 't')
      .groupBy('t.id')
      .execute<Row[]>('all', false);

    return new Map(rows.map((row) => [Number(row.tag), Number(row.cnt)]));
  }
}

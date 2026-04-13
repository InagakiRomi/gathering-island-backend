import { EntityManager } from '@mikro-orm/core';
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTagDto } from './dto/create-tag.dto';
import { Tag } from './entities/tag.entity';
import { ErrorCode } from 'src/common/enum/error-code.enum';

@Injectable()
export class TagsService {
  constructor(private readonly entityManager: EntityManager) {}

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

  /**
   * 列出所有標籤（依 id 遞增）
   *
   * @returns {Promise<Tag[]>} 標籤清單
   */
  async findAllTags(): Promise<Tag[]> {
    return this.entityManager.find(Tag, {}, { orderBy: { id: 'ASC' } });
  }
}

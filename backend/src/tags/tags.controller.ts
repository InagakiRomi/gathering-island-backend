import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { TagsService } from './tags.service';
import { TagWithUsageCount } from './types/tag-list.types';
import { CreateTagDto } from './dto/create-tag.dto';
import { Tag } from './entities/tag.entity';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/roles.decorator';

/** 標籤 Controller */
@ApiBearerAuth('access-token')
@Controller('tags')
export class TagsController {
  constructor(private tagsService: TagsService) {}

  /**
   * 列出所有標籤（管理後台用）
   *
   * @returns {Promise<{ tagData: TagWithUsageCount[] }>} 標籤清單
   */
  @Get()
  @Roles('admin')
  @ApiOperation({
    summary: '列出所有標籤',
    description: '回傳資料庫中所有標籤，被聚會引用次數。僅管理員可用。',
  })
  async listTags(): Promise<{ tagData: TagWithUsageCount[] }> {
    const tagData = await this.tagsService.findAllTags();
    return { tagData };
  }

  /**
   * 根據標籤名稱查詢標籤 ID
   *
   * @param {string} tagName 標籤名稱
   * @returns {Promise<{tagId:number}>} 回傳符合名稱的標籤 ID
   */
  @Get('name')
  @ApiOperation({
    summary: '透過標籤名稱查詢 ID',
    description:
      '根據傳入的 tagName 查詢資料庫中是否存在相同名稱的標籤，並回傳其 ID',
  })
  async findTagIdByName(
    @Query('tagName') tagName: string,
  ): Promise<{ tagId: number }> {
    return this.tagsService.findTagIdByName(tagName);
  }

  /**
   * 建立標籤
   *
   * @param {CreateTagDto} createTagDto 建立標籤的 DTO
   * @returns {Promise<Tag>} 回傳填入的標籤資料
   */
  @Post()
  @ApiOperation({
    summary: '建立新標籤',
    description:
      '若傳入的標籤名稱尚未存在，將建立新的標籤並回傳該標籤資料；若已存在，則回傳既有資料',
  })
  createTag(@Body() createTagDto: CreateTagDto): Promise<Tag> {
    return this.tagsService.findOrCreateTag(createTagDto);
  }
}

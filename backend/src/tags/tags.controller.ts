import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { TagsService } from './tags.service';
import { CreateTagDto } from './dto/create-tag-dto';
import { Tag } from './entities/tag.entity';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

/** 標籤 Controller */
@ApiBearerAuth('access-token')
@Controller('tags')
export class TagsController {
  constructor(private tagsService: TagsService) {}

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

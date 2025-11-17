import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { GatheringType } from '../enum/gathering.type';
import { GatheringStatus } from '../enum/gathering.status';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { GatheringSortBy, GatheringSortOrder } from '../enum/gathering.sort';

/** 查詢聚會的查詢參數 DTO */
export class GetGatheringsQueryDto {
  /** 頁數 */
  @ApiPropertyOptional({ type: Number, description: '頁數' })
  @IsOptional()
  page: number = 1;

  /** 每頁筆數 */
  @ApiPropertyOptional({ type: Number, description: '每頁筆數' })
  @IsOptional()
  limit: number = 10;

  /** 排序欄位 */
  @ApiPropertyOptional({ enum: GatheringSortBy, description: '排序欄位' })
  @IsOptional()
  @IsEnum(GatheringSortBy)
  sortBy: GatheringSortBy = GatheringSortBy.CREATED_AT;

  /** 排序方式 */
  @ApiPropertyOptional({
    enum: GatheringSortOrder,
    description: '排序方式（升冪 ASC / 降冪 DESC）',
  })
  @IsOptional()
  @IsEnum(GatheringSortOrder)
  sortOrder: GatheringSortOrder = GatheringSortOrder.DESC;

  /** 結束狀態篩選 */
  @ApiPropertyOptional({ enum: GatheringStatus, description: '結束狀態' })
  @IsOptional()
  @IsEnum(GatheringStatus)
  status: GatheringStatus;

  /** 聚會分類篩選 */
  @ApiPropertyOptional({ enum: GatheringType, description: '聚會分類' })
  @IsOptional()
  @IsEnum(GatheringType)
  type: GatheringType;

  /** 封存篩選 */
  @ApiPropertyOptional({ type: Boolean, description: '是否封存' })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isArchived: boolean;

  /** 模糊查詢 */
  @ApiPropertyOptional({ type: String, description: '模糊搜尋關鍵字' })
  @IsOptional()
  @IsString()
  search: string;

  /** 標籤篩選 */
  @ApiPropertyOptional({
    type: [String],
    description: '標籤（可以傳多個）',
  })
  @IsOptional()
  @IsArray()
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return [value];
    return [];
  })
  tags: string;
}

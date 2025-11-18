import { IsEnum, IsOptional } from 'class-validator';
import { GatheringType } from '../enum/gathering.type';
import { GatheringStatus } from '../enum/gathering.status';
import { ApiPropertyOptional } from '@nestjs/swagger';

/** 更新聚會 DTO */
export class UpdateGatheringDto {
  /** 標題 */
  @ApiPropertyOptional({ type: String, description: '標題' })
  @IsOptional()
  title: string;

  /** 項目內容 */
  @ApiPropertyOptional({ type: String, description: '項目內容' })
  @IsOptional()
  description: string;

  /** 結束狀態 */
  @ApiPropertyOptional({ enum: GatheringStatus, description: '結束狀態' })
  @IsOptional()
  @IsEnum(GatheringStatus)
  status: GatheringStatus;

  /** 聚會分類 */
  @ApiPropertyOptional({ enum: GatheringType, description: '聚會分類' })
  @IsOptional()
  @IsEnum(GatheringType)
  type: GatheringType;

  /** 報名截止日期 */
  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    description: '報名截止日期 (ISO 8601 格式)',
  })
  @IsOptional()
  dueDate: Date;

  /** 標籤 */
  @ApiPropertyOptional({
    type: [String],
    description: '標籤（可以傳多個）',
  })
  @IsOptional()
  tags: string[];
}

import { IsEnum, IsOptional } from 'class-validator';
import { GatheringType } from '../enum/gathering.type';
import { ApiPropertyOptional } from '@nestjs/swagger';

/** 更新聚會 DTO */
export class UpdateGatheringDto {
  /** 活動描述 */
  @ApiPropertyOptional({ type: String, description: '活動描述' })
  @IsOptional()
  description: string;

  /** 活動地點 */
  @ApiPropertyOptional({ type: String, description: '活動地點' })
  @IsOptional()
  location: string;

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
  deadline: Date;

  /** 標籤 */
  @ApiPropertyOptional({
    type: [String],
    description: '標籤（可以傳多個）',
  })
  @IsOptional()
  tags: string[];
}

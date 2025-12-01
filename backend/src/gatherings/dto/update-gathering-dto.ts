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

  /** 活動描述 */
  @ApiPropertyOptional({ type: String, description: '活動描述' })
  @IsOptional()
  description: string;

  /** 活動地點 */
  @ApiPropertyOptional({ type: String, description: '活動地點' })
  @IsOptional()
  location: string;

  /** 參加人數 */
  @ApiPropertyOptional({ type: Number, description: '參加人數' })
  @IsOptional()
  participantNumbers: number;

  /** 活動費用 */
  @ApiPropertyOptional({ type: Number, description: '活動費用' })
  @IsOptional()
  price: number;

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

  /** 活動日期 */
  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    description: '活動日期 (ISO 8601 格式)',
  })
  @IsOptional()
  startTime: Date;

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

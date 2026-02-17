import { IsEnum, IsNotEmpty, IsOptional, Max, Min } from 'class-validator';
import { GatheringType } from '../enum/gathering.type';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GatheringLimits } from 'src/common/constants/gathering.limits';

/** 建立聚會 DTO */
export class CreateGatheringDto {
  /** 標題 */
  @ApiProperty({ type: String, description: '標題' })
  @IsNotEmpty()
  title: string;

  /** 活動描述 */
  @ApiPropertyOptional({ type: String, description: '活動描述' })
  @IsOptional()
  description: string;

  /** 活動地點 */
  @ApiPropertyOptional({ type: String, description: '活動地點' })
  @IsNotEmpty()
  location: string;

  /** 參加人數 */
  @ApiPropertyOptional({ type: Number, description: '參加人數' })
  @Min(GatheringLimits.PARTICIPANT_NUMBERS.MIN)
  @Max(GatheringLimits.PARTICIPANT_NUMBERS.MAX)
  @IsNotEmpty()
  participantNumbers: number;

  /** 活動費用 */
  @ApiPropertyOptional({ type: Number, description: '活動費用' })
  @Min(GatheringLimits.PRICE.MIN)
  @Max(GatheringLimits.PRICE.MAX)
  @IsNotEmpty()
  price: number;

  /** 聚會分類 */
  @ApiPropertyOptional({ enum: GatheringType, description: '聚會分類' })
  @IsNotEmpty()
  @IsEnum(GatheringType)
  type: GatheringType;

  /** 活動日期 */
  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    description: '活動日期 (ISO 8601 格式)',
  })
  @IsNotEmpty()
  startTime: Date;

  /** 報名截止日期 */
  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    description: '報名截止日期 (ISO 8601 格式)',
  })
  @IsNotEmpty()
  deadline: Date;

  /** 標籤 */
  @ApiPropertyOptional({
    type: [String],
    description: '標籤（可以傳多個）',
  })
  @IsOptional()
  tags: string[];
}

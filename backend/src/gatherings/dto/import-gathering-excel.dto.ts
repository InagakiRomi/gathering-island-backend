import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsEnum,
  IsBoolean,
  IsDate,
  IsOptional,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { GatheringStatus } from '../enum/gathering.status';
import { GatheringType } from '../enum/gathering.type';
import { GatheringLimits } from 'src/common/constants/gathering.limits';

export class ImportGatheringExcelDto {
  /** 主鍵 id */
  @Type(() => Number)
  @IsNumber()
  @Min(GatheringLimits.ID.MIN)
  @IsNotEmpty()
  id: number;

  /** 擁有者 id */
  @Type(() => Number)
  @IsNumber()
  @Min(GatheringLimits.USER_ID.MIN)
  @IsNotEmpty()
  userId: number;

  /** 標題 */
  @IsString()
  @IsNotEmpty()
  title: string;

  /** 活動描述 */
  @IsOptional()
  @IsString()
  description?: string;

  /** 活動地點 */
  @IsString()
  @IsNotEmpty()
  location: string;

  /** 活動人數 */
  @Type(() => Number)
  @IsNumber()
  @Min(GatheringLimits.PARTICIPANT_NUMBERS.MIN)
  @Max(GatheringLimits.PARTICIPANT_NUMBERS.MAX)
  @IsNotEmpty()
  participantNumbers: number;

  /** 活動費用 */
  @Type(() => Number)
  @IsNumber()
  @Min(GatheringLimits.PRICE.MIN)
  @Max(GatheringLimits.PRICE.MAX)
  @IsNotEmpty()
  price: number;

  /** 結束狀態 */
  @IsEnum(GatheringStatus)
  @IsNotEmpty()
  status?: GatheringStatus;

  /** 聚會分類 */
  @IsEnum(GatheringType)
  @IsNotEmpty()
  type?: GatheringType;

  /** 活動日期 */
  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  startTime: Date;

  /** 報名截止日期 */
  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  deadline: Date;

  /** 封存 */
  @IsBoolean()
  @IsNotEmpty()
  isArchived?: boolean;

  /** 創建日期 */
  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  createdAt: Date;

  /** 最後更新日期 */
  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  updatedAt: Date;
}

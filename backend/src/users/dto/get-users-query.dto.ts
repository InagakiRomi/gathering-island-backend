import { IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/** 查詢使用者的查詢參數 DTO */
export class GetUsersQueryDto {
  /** 頁數 */
  @ApiPropertyOptional({ type: Number, description: '頁數' })
  @IsOptional()
  page: number = 1;

  /** 每頁筆數 */
  @ApiPropertyOptional({ type: Number, description: '每頁筆數' })
  @IsOptional()
  limit: number = 10;
}

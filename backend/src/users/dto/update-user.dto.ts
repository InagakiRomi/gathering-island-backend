import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

/** 更新使用者資訊 DTO */
export class UpdateUserDto {
  /** 使用者名稱 */
  @ApiPropertyOptional({ type: String, description: '使用者名稱' })
  @IsOptional()
  displayName: string;
}

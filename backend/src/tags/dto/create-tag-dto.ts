import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

/** 建立標籤 DTO */
export class CreateTagDto {
  /** 標籤名稱 */
  @ApiProperty({ type: String, description: '標籤名稱' })
  @IsNotEmpty()
  tagName: string;
}

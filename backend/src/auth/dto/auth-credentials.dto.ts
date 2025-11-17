import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

/** 註冊帳號 DTO */
export class AuthCredentialsDto {
  /** 使用者 mail */
  @ApiProperty({ type: String, description: '使用者 Email' })
  @IsEmail()
  @MinLength(1)
  @MaxLength(32)
  @IsNotEmpty()
  email: string;

  /** 使用者密碼 */
  @ApiProperty({ type: String, description: '使用者密碼' })
  @IsString()
  @MinLength(3)
  @MaxLength(32)
  @IsNotEmpty()
  password: string;

  /** 使用者名稱 */
  @ApiProperty({ type: String, description: '使用者名稱' })
  @IsString()
  @MinLength(1)
  @MaxLength(16)
  @IsNotEmpty()
  displayName: string;
}

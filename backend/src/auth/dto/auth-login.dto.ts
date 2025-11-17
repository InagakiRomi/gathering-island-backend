import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

/** 登入帳號 DTO */
export class AuthLoginDto {
  /** 使用者 mail */
  @ApiProperty({ type: String, description: '使用者 Email' })
  @IsEmail()
  @MinLength(1)
  @IsNotEmpty()
  email: string;

  /** 使用者密碼 */
  @ApiProperty({ type: String, description: '使用者密碼' })
  @IsString()
  @MinLength(1)
  @IsNotEmpty()
  password: string;
}

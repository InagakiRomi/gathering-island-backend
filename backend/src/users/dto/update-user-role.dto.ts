import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { UserRole } from '../enum/auth.role';

/** 管理員更新使用者角色 DTO */
export class UpdateUserRoleDto {
  /** 使用者角色 */
  @ApiProperty({ enum: UserRole, description: '使用者角色' })
  @IsEnum(UserRole)
  role: UserRole;
}

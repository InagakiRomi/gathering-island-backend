import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/** 將指定的路由標記為「角色限制路由」，使路由只能由特定角色的使用者存取 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

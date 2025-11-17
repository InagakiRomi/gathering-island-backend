import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

/** 保護路由，確保只有擁有特定角色的使用者可以存取 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  // context：提供目前的執行上下文，可以拿到目前的 handler（方法）和 class（控制器）
  canActivate(context: ExecutionContext): boolean {
    // 取得目前 route handler 或 controller class 上所設定的角色需求
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      // 優先取得 method 上的 metadata，若無則取得 class 上的
      [context.getHandler(), context.getClass()],
    );

    // 若無角色需求，則允許通過
    if (!requiredRoles) {
      return true;
    }

    // 從 request 物件中取得使用者資訊
    const request = context.switchToHttp().getRequest();

    // 假設 user 物件中有一個 roles 陣列，包含使用者的角色
    const user = request.user;

    // 檢查使用者是否是所需的角色
    return requiredRoles.includes(user?.role);
  }
}

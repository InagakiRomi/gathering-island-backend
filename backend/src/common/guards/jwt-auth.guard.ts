import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/** 保護路由，確保只有攜帶有效 JWT 的使用者可以存取 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // 讀取裝飾器（例如 @SetMetadata()）所設定的 metadata
  constructor(private readonly reflector: Reflector) {
    super();
  }

  // context：提供目前的執行上下文，可以拿到目前的 handler（方法）和 class（控制器）
  async canActivate(context: ExecutionContext) {
    // 檢查目前的路由是否被標示為公開路由
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      // 若為公開路由，直接通過驗證
      return true;
    }

    // 否則交給 passport 的 jwt 驗證流程
    return (await super.canActivate(context)) as boolean;
  }
}

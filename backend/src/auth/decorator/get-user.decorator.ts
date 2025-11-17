import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from 'src/users/entities/user.entity';

/** 自動從目前的請求中把 user 資料抓出來塞進變數 */
export const GetUser = createParamDecorator(
  (
    // 寫 @GetUser('xxx') 時會傳進來的資料， _ 開頭代表這裡用不到
    _data,
    // 提供這次請求的所有資訊(誰送來的請求、有沒有經過 Guards等...)
    ctx: ExecutionContext,
  ): User => {
    // 把 ctx 切換成「HTTP 模式」，並取得原始的 HTTP Request 物件
    const req = ctx.switchToHttp().getRequest();
    // 從 Express 的 req 物件中取得 user 資料並回傳
    return req.user;
  },
);

import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResult } from '../enum/api-result';

/**
 * API 成功回傳資料的攔截器。
 * @implements {NestInterceptor} 可以攔截並修改 controller 的回傳資料
 */
@Injectable()
export class SuccessResponseInterceptor implements NestInterceptor {
  /**
   * 攔截處理 controller 回傳資料。
   *
   * @param {ExecutionContext} context 目前 request 的執行上下文
   * @param {CallHandler} next 被處理的控制器方法
   * @returns {Observable<any>} - 回傳處理後的 observable 資料
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // 等待 controller 的回傳資料出來並執行 pipe 裡面內容
    return next.handle().pipe(
      // 回傳資料轉換
      map((data) => {
        // 如果沒有 result，就自動包裝成 success
        if (!data?.result) {
          return {
            result: ApiResult.Success,
            ...data,
          };
        }

        // 已經有 result 的話，直接回傳
        return data;
      }),
    );
  }
}

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorCode } from '../enum/error-code.enum';
import { ApiResult } from '../enum/api-result';

@Catch(HttpException) // 定義要捕捉的例外類型
export class HttpExceptionFilter implements ExceptionFilter {
  // 當捕捉到例外時會呼叫此方法
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus(); // 從 HttpException 例外中取得 HTTP 狀態碼

    // 定義錯誤回傳格式的類型
    type ExceptionResponseType = {
      message?: string | string[];
      code?: string | number;
    };

    // 取得例外的回應內容
    const exceptionResponse = exception.getResponse();

    // // 確保 resObj 回傳的是物件
    let resObj: ExceptionResponseType = {};

    if (typeof exceptionResponse !== 'string') {
      resObj = exceptionResponse as ExceptionResponseType;
    }

    const responseBody: any = {
      result: ApiResult.Error,
      statusCode: status, // HTTP 狀態碼
      error: exception.name.replace(/([a-z])([A-Z])/g, '$1 $2'), // 錯誤名稱，將每個大寫開頭的詞分開
      message: this.normalizeMessage(resObj.message ?? exception.message), // 錯誤訊息
      code: resObj.code ?? ErrorCode.INTERNAL_SERVER_ERROR, // 自訂錯誤代碼
      path: request.url, // 發生錯誤的 URL 路徑
      timestamp: new Date().toISOString(), // 發生錯誤的時間（ISO 格式）
    };

    // 使用 response 回傳自定義的錯誤格式 JSON 給 client
    response.status(status).json(responseBody);
  }

  /** 將錯誤訊息標準化為字串或字串陣列 */
  private normalizeMessage(message: unknown): string | string[] {
    // 如果 message 是字串或是字串陣列，直接原樣回傳即可
    if (typeof message === 'string' || Array.isArray(message)) return message;

    // 如果 message 是物件，就將它轉換成 JSON 字串
    if (typeof message === 'object') return JSON.stringify(message);

    // 如果以上條件都不符合，則回傳一個預設錯誤訊息
    return 'Unexpected error';
  }
}

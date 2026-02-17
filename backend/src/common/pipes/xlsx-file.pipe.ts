import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { WorkBook } from 'xlsx';
import { ErrorCode } from '../enum/error-code.enum';

/** Excel 檔案解析 Pipe */
@Injectable()
export class XlsxFilePipe implements PipeTransform {
  /**
   * 轉換並驗證上傳的 Excel 檔案
   *
   * @param file - 由 Multer 提供的上傳檔案物件
   * @param file.mimetype - 檔案的 MIME 類型
   * @param file.buffer - 檔案的原始二進位內容
   *
   * @returns 轉換後的檔案物件（附加 workbook 屬性）
   */
  transform(file: Express.Multer.File): WorkBook {
    // 檢查檔案是否存在
    if (!file) {
      throw new BadRequestException({
        message: 'Excel file is required.',
        code: ErrorCode.BAD_REQUEST,
      });
    }

    // 允許的 MIME 類型（僅限 .xlsx）
    const allowedMimeTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    // 驗證檔案類型
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException({
        message: `Only .xlsx files are supported. The uploaded file type is ${file.mimetype}.`,
        code: ErrorCode.BAD_REQUEST,
      });
    }

    try {
      return XLSX.read(file.buffer, { type: 'buffer' });
    } catch {
      // 當 Excel 結構錯誤或內容損毀時拋出例外
      throw new BadRequestException({
        message: 'Invalid Excel file content. Unable to parse .xlsx file.',
        code: ErrorCode.BAD_REQUEST,
      });
    }
  }
}

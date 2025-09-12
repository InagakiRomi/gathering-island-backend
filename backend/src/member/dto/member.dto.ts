import { Expose, Transform } from 'class-transformer';
import { Gender, GenderTypeNameMap } from '../enums/gender.enum';
import dayjs from 'dayjs';

export class MemberDto {

    /** 主鍵，自動遞增的會員 ID */
    @Expose()
    member_id: string;

    /** 使用者帳號名稱 */
    @Expose()
    username: string;

    /** 密碼加密後的字串 */
    @Expose()
    password_hash: string;
    
    /** 信箱 */
    @Expose()
    email: string;

    /** 性別 */
    @Expose()
    @Transform(({ obj }) => GenderTypeNameMap[obj.type])
    gender: string;

    /** 大頭照 URL */
    @Expose()
    avatar_url: string;

    /** 出生日期 */
    @Expose()
    @Transform(({ value }) => dayjs(value).format('YYYY/MM/DD'))
    birthday: Date;

    /** 註冊時間 */
    @Expose()
    @Transform(({ value }) => dayjs(value).format('YYYY/MM/DD HH:mm:ss'))
    created_at: Date;

    /** 最後更新時間 */
    @Expose()
    @Transform(({ value }) => dayjs(value).format('YYYY/MM/DD HH:mm:ss'))
    updated_at: Date;
}
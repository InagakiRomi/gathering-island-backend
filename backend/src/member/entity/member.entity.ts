import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { Gender } from '../enums/gender.enum';

@Entity('members')
export class Member{
    
    /** 主鍵，自動遞增的會員 ID */
    @PrimaryGeneratedColumn('uuid')
    member_id: string;

    /** 使用者帳號名稱 */
    @Column({ unique: true })
    username: string;

    /** 密碼加密後的字串 */
    @Column()
    password_hash: string;
    
    /** 信箱 */
    @Column({ unique: true })
    email: string;

    /** 性別 */
    @Column({ type: 'enum', enum: Gender })
    gender: Gender;

    /** 大頭照 URL */
    @Column({ nullable: true })
    avatar_url: string;

    /** 出生日期 */
    @Column({ nullable: true })
    birthday: Date;

    /** 註冊時間 */
    @Column({ nullable: true })
    created_at: Date;

    /** 最後更新時間 */
    @Column({ nullable: true })
    updated_at: Date;
}
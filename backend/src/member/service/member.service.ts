import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { Member } from '../entity/member.entity';
import { MemberDto } from '../dto/member.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class MemberService {

    // 建立 logger
    private logger = new Logger(MemberService.name);

    // 注入 Member 實體的 Repository
    constructor(
        @InjectRepository(Member)
        private memberRepository: Repository<Member>,
    ){}

    /** 註冊會員 */
    async register(member: MemberDto): Promise<MemberDto> {
            
        // 驗證帳號是否已被使用（避免重複註冊）
        await this.ensureUsernameNotTaken(member.username);

        // 使用 bcrypt 加密密碼（保障帳號安全）
        member.member_password = await bcrypt.hash(member.member_password, 10);

        // 設定建立時間與更新時間
        member.created_at = new Date();
        member.updated_at = new Date();

        try {

            // 將 DTO 轉換為實體以便於儲存進資料庫
            const memberEntity = plainToInstance(Member, member);

            // 儲存資料到資料庫中（INSERT INTO ...）
            const saved = await this.memberRepository.save(memberEntity);

            // 將儲存後的結果轉換為 DTO 並回傳（過濾多餘欄位）
            return plainToInstance(MemberDto, saved, { excludeExtraneousValues: true });

        } catch (error) {

            // 發生例外時，紀錄錯誤並丟出 HTTP 500 錯誤
            this.logger.error(error.message);
            throw new HttpException('Registration failed', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /** 批量會員資料匯入 */
    async bulkRegister(members: MemberDto[]): Promise<{
        success: MemberDto[],
        failed: { username: string, reason: string }[]
        }> {
        const success: MemberDto[] = [];
        const failed: { username: string, reason: string }[] = [];

        for (const member of members) {
            try {
            const existing = await this.memberRepository.findOneBy({ username: member.username });
            if (existing) {
                failed.push({ username: member.username, reason: 'Account already exists' });
                continue;
            }

            member.member_password = await bcrypt.hash(member.member_password, 10);
            member.created_at = new Date();
            member.updated_at = new Date();

            const memberEntity = plainToInstance(Member, member);
            const saved = await this.memberRepository.save(memberEntity);
            success.push(plainToInstance(MemberDto, saved, { excludeExtraneousValues: true }));

            } catch (err) {
            this.logger.error(`Failed to register ${member.username}: ${err.message}`);
            failed.push({ username: member.username, reason: err.message });
            }
        }

        return { success, failed };
        }

    /** 檢查帳號是否已存在 */
    private async ensureUsernameNotTaken(username: string): Promise<void> {
        const foundUser = await this.memberRepository.findOneBy({ username });

        if (foundUser) {
            // 若找到相同帳號，則表示帳號已被註冊，拋出衝突錯誤
            throw new HttpException('Account already exists', HttpStatus.CONFLICT);
        }
    }
}
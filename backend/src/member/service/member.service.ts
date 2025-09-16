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
        return this.processMemberRegistration(member);
    }

    /** 批量會員資料匯入 */
    async bulkRegister(members: MemberDto[]): Promise<MemberDto[]> {
        const result: MemberDto[] = [];
        for (const member of members) {
            const registered = await this.processMemberRegistration(member);
            result.push(registered);
        }
        return result;
    }

    /** 註冊會員流程 */
    private async processMemberRegistration(member: MemberDto): Promise<MemberDto> {
        
        // 檢查帳號是否已存在
        const existing = await this.memberRepository.findOneBy({ username: member.username });
        if (existing) {
            throw new HttpException('Account already exists', HttpStatus.CONFLICT);
        }

        // 密碼加密處理（使用 bcrypt）
        member.member_password = await bcrypt.hash(member.member_password, 10);

         // 設定建立與更新時間
        member.created_at = new Date();
        member.updated_at = new Date();

        try {

            // 將 DTO 轉換為 Entity
            const memberEntity = plainToInstance(Member, member);

            // 儲存到資料庫
            const saved = await this.memberRepository.save(memberEntity);

            // 將儲存成功的 Entity 轉回 DTO，並排除未標註 @Expose 的欄位
            return plainToInstance(MemberDto, saved, { excludeExtraneousValues: true });

        } catch (error) {
            
            // 記錄錯誤並丟出 500 錯誤
            this.logger.error(error.message);
            throw new HttpException('Registration failed', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
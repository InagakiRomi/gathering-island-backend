import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Member } from '../entity/member.entity';
import { MemberDto } from '../dto/member.dto';
import { Gender } from '../enums/gender.enum';
import * as bcrypt from 'bcrypt';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class MemberService {
    private logger = new Logger(MemberService.name);

    constructor(
        @InjectRepository(Member)
        private memberRepository: Repository<Member>,
    ){}

    /** 新增一筆會員資料（INSERT INTO member ...） */
    async register(member: MemberDto): Promise<MemberDto> {
    // 驗證帳號是否已存在
    await this.ensureUsernameNotTaken(member.username);

    // 加密密碼
    member.member_password = await bcrypt.hash(member.member_password, 10);

    // 設定建立時間與修改時間
    member.created_at = new Date();
    member.updated_at = new Date();

    try {
        const memberEntity = plainToInstance(Member, member);
        const saved = await this.memberRepository.save(memberEntity);

        // 回傳 DTO 格式的結果
        return plainToInstance(MemberDto, saved, { excludeExtraneousValues: true });
    } catch (error) {
        this.logger.error(error.message);
        throw new HttpException('Registration failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
    }

    /** 檢查帳號是否已存在 */
    private async ensureUsernameNotTaken(username: string): Promise<void> {
    const foundUser = await this.memberRepository.findOneBy({ username });
    if (foundUser) {
        throw new HttpException('Account already exists', HttpStatus.CONFLICT);
    }
    }
}
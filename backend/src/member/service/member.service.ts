import { HttpException, HttpStatus, Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Member } from '../entity/member.entity';
import { MemberDto } from "../dto/member.dto";
import * as crypto from "crypto";

function md5(str){
    const hash = crypto.createHash("md5");
    hash.update(str);
    return hash.digest("hex");
}

@Injectable()
export class MemberService {
    private logger = new Logger();

    constructor(
        @InjectRepository(Member)
        private memberRepository: Repository<Member>,
    ){}

    async register(member: MemberDto) {
        const foundUser = await this.memberRepository.findOneBy({
            username: member.username,
        });

        if(foundUser){
            throw new HttpException("Account already exists", 409);
        }

        const newMember = new Member();
        newMember.username = member.username;
        newMember.password_hash = md5(member.password_hash);

        try {
            await this.memberRepository.save(newMember);
            return "Registration successful";
        } catch (error) {
            this.logger.error(error.message);
            return "Registration failed";
        }
    }
}
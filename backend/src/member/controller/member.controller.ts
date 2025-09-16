import { Body, Controller, Inject, Post } from "@nestjs/common";
import { MemberService } from '../service/member.service';
import { MemberDto } from "../dto/member.dto";

@Controller('members')
export class MemberController {
    constructor(private readonly memberService: MemberService) {}

    /** 註冊會員 */
    @Post("register")
    async register(@Body() member: MemberDto) {
        console.log('register body:', member);
        return await this.memberService.register(member);
    }

    /** 批量會員資料匯入 */
    @Post("bulkRegister")
    async bulkRegister(@Body() members: MemberDto[]) {
        //console.log('bulkRegister body:', members);
        return await this.memberService.bulkRegister(members);
    }

    /** 會員登入 */
    @Post("login")
    async login(@Body() member: MemberDto) {
        return await this.memberService.register(member);
    }
}

import { Body, Controller, Inject, Post } from "@nestjs/common";
import { MemberService } from '../service/member.service';
import { MemberDto } from "../dto/member.dto";

@Controller('members')
export class MemberController {
    constructor(private readonly memberService: MemberService) {}
    @Post("login")
    async login(@Body() member: MemberDto) {
        console.log(member);
    }

    @Post("register")
    async register(@Body() member: MemberDto) {
        return await this.memberService.register(member);
    }
}

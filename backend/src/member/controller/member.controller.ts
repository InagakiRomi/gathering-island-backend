import { Body, Controller, Post, Res } from "@nestjs/common";
import { MemberService } from "../service/member.service";
import { MemberDto } from "../dto/member.dto";
import { JwtService } from "@nestjs/jwt";
import type { Response } from "express";

/** 會員相關的 API 控制器 */
@Controller('members')
export class MemberController {
    constructor(
        // 注入會員服務，處理會員相關邏輯
        private readonly memberService: MemberService,

        // 注入 JWT 服務，用於生成登入 Token
        private readonly jwtService: JwtService,
    ) {}

    /** 會員登入 */
    @Post("login")
    async login(
        @Body() member: MemberDto,
        @Res({ passthrough: true }) res: Response
    ) {
        // 呼叫 service 驗證會員資料
        const foundMember = await this.memberService.login(member);

        // 若驗證成功，產生 JWT 並設定在 response header 中
        if (foundMember) {
            const token = await this.jwtService.signAsync({
                user: {
                    member_id: foundMember.member_id,
                    username: foundMember.username,
                },
            });

            // 將 token 寫入 response header
            res.setHeader("token", token);
            return "login success";
        } else {
            return "Invalid username or password";
        }
    }

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
}

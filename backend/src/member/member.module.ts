import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Member } from './entity/member.entity';
import { MemberService } from './service/member.service';
import { MemberController } from './controller/member.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Member])],
    providers: [MemberService],
    controllers: [MemberController]
})
export class MemberModule {}
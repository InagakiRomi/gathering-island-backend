import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EventService } from './event/service/event.service';
import { EventController } from './event/controller/event.controller';
import { Event } from './event/entity/event.entity';
import { EventModule } from './event/event.module';
import { MemberModule } from './member/member.module';
import { Member } from './member/entity/member.entity';

@Module({
  imports: [
        TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: '12345678',
      database: 'party',
      entities: [Event, Member],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([Event, Member]),
    EventModule,
    MemberModule,
  ],
  controllers: [AppController, EventController],
  providers: [AppService, EventService],
})

export class AppModule {
  constructor(private connection: Connection) {}
}
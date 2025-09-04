import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EventService } from './event/service/event.service';
import { EventController } from './event/controller/event.controller';
import { Event } from './event/entity/event.entity';
import { EventModule } from './event/event.module';

@Module({
  imports: [
        TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: '12345678',
      database: 'party',
      entities: [Event],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([Event]),
    EventModule,
  ],
  controllers: [AppController, EventController],
  providers: [AppService, EventService],
})

export class AppModule {
  constructor(private connection: Connection) {}
}
import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { GatheringsModule } from '../gatherings/gatherings.module';

@Module({
  imports: [MikroOrmModule.forFeature({ entities: [User] }), GatheringsModule],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}

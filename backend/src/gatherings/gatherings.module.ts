import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { GatheringsController } from './gatherings.controller';
import { GatheringsService } from './gatherings.service';
import { Gathering } from './entities/gathering.entity';
import { TagsService } from '../tags/tags.service';
import { TagsModule } from '../tags/tags.module';

@Module({
  imports: [MikroOrmModule.forFeature({ entities: [Gathering] }), TagsModule],
  controllers: [GatheringsController],
  providers: [GatheringsService, TagsService],
})
export class GatheringsModule {}

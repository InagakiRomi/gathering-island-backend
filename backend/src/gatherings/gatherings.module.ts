import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { GatheringsController } from './gatherings.controller';
import { GatheringsService } from './gatherings.service';
import { GatheringsSchedulerService } from './gatherings-scheduler.service';
import { Gathering } from './entities/gathering.entity';
import { Participant } from './entities/participant.entity';
import { TagsService } from '../tags/tags.service';
import { TagsModule } from '../tags/tags.module';

@Module({
  imports: [
    MikroOrmModule.forFeature({ entities: [Gathering, Participant] }),
    TagsModule,
  ],
  controllers: [GatheringsController],
  providers: [GatheringsService, GatheringsSchedulerService, TagsService],
})
export class GatheringsModule {}

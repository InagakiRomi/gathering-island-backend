import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { EventService } from '../service/event.service';
import { Event as EventEntity } from '../entity/event.entity';
import { plainToInstance } from 'class-transformer';
import { EventDto } from '../dto/event.dto';
import { ParseIntPipe } from '@nestjs/common';

@Controller('events')
export class EventController {
    constructor(private eventService: EventService) {}

    /** 查詢所有的活動（SELECT * FROM event） */
    @Get()
    async findAllEvent(
        @Query('search') query: string,
        @Query('sort') sortParam: string = 'event_time:ASC',
    ): Promise<EventDto[]> {
        const sortObj: Record<string, 'ASC' | 'DESC'> = {};

        const allowedSortFields = ['created_at', 'max_participants', 'event_price', 'event_time', 'registration_deadline'];
        sortParam.split(',').forEach(pair => {
            const [field, direction] = pair.split(':');
            if (field && allowedSortFields.includes(field) && ['ASC', 'DESC'].includes(direction?.toUpperCase())) {
                sortObj[field] = direction.toUpperCase() as 'ASC' | 'DESC';
            }
        });

        const events = await this.eventService.findAllEvent(query, sortObj);
        return plainToInstance(EventDto, events, { excludeExtraneousValues: true });
    }

    /** 查詢指定 id 的活動（SELECT * FROM event） */
    @Get(':id')
    async findOneEvent(@Param('id', ParseIntPipe) id: number): Promise<EventDto> {
        const event = await this.eventService.findOneEvent(id);
        return plainToInstance(EventDto, event, { excludeExtraneousValues: true });
    }

    /** 新增一筆活動（INSERT INTO event ...） */
    @Post()
    async createEvent(@Body() event: EventEntity): Promise<EventEntity> {
        return this.eventService.createEvent(event);
    }

    /** 根據 id 修改活動（UPDATE event SET ... WHERE id = ?） */ 
    @Put(':id')
    async updateEvent(@Param('id') id: number, @Body() event: EventEntity): Promise<EventEntity> {
        return this.eventService.updateEvent(id, event);
    }

    /** 根據 id 刪除活動（DELETE FROM event WHERE id = ?） */ 
    @Delete(':id')
    async deleteEvent(@Param('id') id: number): Promise<void> {
        return this.eventService.deleteEvent(id);
    }
}
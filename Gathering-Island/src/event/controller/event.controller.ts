import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { EventService } from '../service/event.service';
import { Event as EventEntity } from '../entity/event.entity';

@Controller('events')
export class EventController {
    constructor(private eventService: EventService) {}

    /** 查詢所有的活動（SELECT * FROM event） */
    @Get()
    async findAllEvent(): Promise<EventEntity[]> {
        return this.eventService.findAllEvent();
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
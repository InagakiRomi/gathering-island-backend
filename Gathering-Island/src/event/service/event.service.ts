import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { Event } from '../entity/event.entity';
import { EventDto } from '../dto/event.dto';

@Injectable()
export class EventService {
  // 建構函式：當這個服務被建立時，會注入 Event 的 repository 進來
  constructor(
    @InjectRepository(Event) // 告訴 NestJS 要注入 Event 對應的資料表操作工具
    private eventRepository: Repository<Event>, // 宣告一個屬性，用來執行資料庫操作
  ) {}

  /** 查詢所有的活動（SELECT * FROM event） */
  async findAllEvent(): Promise<EventDto[]> {
    const events = await this.eventRepository.find();
    return EventDto.fromEntities(events);
  }

  /** 新增一筆活動（INSERT INTO event ...） */
  async createEvent(event: Event): Promise<EventDto> {
    event.created_at = new Date();
    const created = await this.eventRepository.save(event);
    return plainToInstance(EventDto, created, { excludeExtraneousValues: true });
  }

  /** 根據 id 修改活動（UPDATE event SET ... WHERE id = ?） */ 
  async updateEvent(id: number, event: Event): Promise<EventDto> {
    // 更新這筆資料
    await this.eventRepository.update(id, event);

    // 更新後再次查詢資料，確保它存在
    const updated = await this.eventRepository.findOne({where: { event_id: id },});
    if (!updated) {
      throw new NotFoundException(`找不到 id 為 ${id} 的活動`);
    }

    return EventDto.fromEntity(updated);
  }

  /** 根據 id 刪除活動（DELETE FROM event WHERE id = ?） */ 
  async deleteEvent(id: number): Promise<void> {
    await this.eventRepository.delete(id);
  }
}
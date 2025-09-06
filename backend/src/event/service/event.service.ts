import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { Event } from '../entity/event.entity';
import { EventDto } from '../dto/event.dto';
import { EventType } from '../enums/event-type.enum';

@Injectable()
export class EventService {
  // 建構函式：當這個服務被建立時，會注入 Event 的 repository 進來
  constructor(
    @InjectRepository(Event) // 告訴 NestJS 要注入 Event 對應的資料表操作工具
    private eventRepository: Repository<Event>, // 宣告一個屬性，用來執行資料庫操作
  ) {}

  /** 查詢指定 id 的活動（SELECT * FROM event） */
  async findAllEvent(
    keyword: string,
    order: Record<string, 'ASC' | 'DESC'> = { event_time: 'ASC' },
    eventType?: EventType,
    isEnded?: boolean,
  ): Promise<EventDto[]> {
    const qb = this.eventRepository.createQueryBuilder('event');

    if (keyword) {
    qb.where('event.event_name LIKE :keyword', { keyword: `%${keyword}%` })
      .orWhere('event.event_description LIKE :keyword', { keyword: `%${keyword}%` });
    }

    Object.entries(order).forEach(([field, direction]) => {
      qb.addOrderBy(`event.${field}`, direction);
    });

    if (eventType) {
      qb.andWhere('event.event_type = :eventType', { eventType });
    }

    if (typeof isEnded === 'boolean') {
      qb.andWhere('event.is_ended = :isEnded', { isEnded });
    }

    const events = await qb.getMany();
    
    return EventDto.fromEntities(events);
  }

  /** 查詢活動（SELECT * FROM event WHERE event_id） */
  async findOneEvent(event_id: number): Promise<EventDto> {
  const event = await this.eventRepository.findOne({ where: { event_id } });

  if (!event) {
    this.throwEventNotFound(event_id);
  }

  return EventDto.fromEntity(event);
  }

  /** 新增一筆活動（INSERT INTO event ...） */
  async createEvent(event: Event): Promise<EventDto> {
    // 驗證活動價格是否是正數
    this.validateEventPrice(event.event_price);

    event.created_at = new Date();
    const created = await this.eventRepository.save(event);
    return plainToInstance(EventDto, created, { excludeExtraneousValues: true });
  }

  /** 根據 id 修改活動（UPDATE event SET ... WHERE id = ?） */ 
  async updateEvent(event_id: number, event: Event): Promise<EventDto> {
    // 驗證活動價格是否是正數
    this.validateEventPrice(event.event_price);
    
    // 更新這筆資料
    await this.eventRepository.update(event_id, event);

    // 更新後再次查詢資料，是否符合資料庫需求
    const updated = await this.eventRepository.findOne({where: { event_id: event_id },});
    if (!updated) {
      this.throwEventNotFound(event_id);
    }

    return EventDto.fromEntity(updated);
  }

  /** 根據 id 刪除活動（DELETE FROM event WHERE id = ?） */ 
  async deleteEvent(id: number): Promise<void> {
    await this.eventRepository.delete(id);
  }

  /** 驗證 ID 是否存在 */
  private throwEventNotFound(event_id: number): never {
    throw new NotFoundException(`Event with ID ${event_id} not found`);
  }

  /** 驗證活動價格是否是正數 */
  private validateEventPrice(price: number): void {
    if (price < 0) {
      throw new BadRequestException('The minimum price must be greater than or equal to 0.');
    }
  }
}
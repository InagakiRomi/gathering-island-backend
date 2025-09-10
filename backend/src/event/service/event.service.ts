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
    @InjectRepository(Event)                    // 告訴 NestJS 要注入 Event 對應的資料表操作工具
    private eventRepository: Repository<Event>, // 宣告一個屬性，用來執行資料庫操作
  ) {}

  /** 查詢指定 id 的活動（SELECT * FROM event） */
  async findAllEvent(
    keyword: string,                                               // 活動名稱或描述的模糊搜尋關鍵字
    order: Record<string, 'ASC' | 'DESC'> = { event_time: 'ASC' }, // 排序條件
    eventType?: EventType,                                         // 篩選活動類型
    isEnded?: boolean,                                             // 篩選是否報名截止
    minPrice?: number,                                             // 最小價格
    maxPrice?: number,                                             // 最大價格
    limit: number = 10,                                            // 一次幾筆
    offset: number = 0,                                            // 跳過前 X 筆資料
  ): Promise<EventDto[]> {

    // 自動更新：若報名截止時間已過且 is_ended 為 false，就設為 true
    await this.eventRepository
      .createQueryBuilder()
      .update(Event)
      .set({ is_ended: true })
      .where('registration_deadline < :now', { now: new Date() })
      .andWhere('is_ended = false')
      .execute();

    // 建立一個 QueryBuilder，來動態產生 SQL 查詢
    const qb = this.eventRepository.createQueryBuilder('event');

    // 模糊查詢活動名稱或描述中包含 keyword 的
    if (keyword) {
    qb.where('event.event_name LIKE :keyword', { keyword: `%${keyword}%` })
      .orWhere('event.event_description LIKE :keyword', { keyword: `%${keyword}%` });
    }

    // 依照傳入的排序欄位與方向，動態加入 ORDER BY
    Object.entries(order).forEach(([field, direction]) => {
      qb.addOrderBy(`event.${field}`, direction);
    });

    // 若有指定活動類型，則加入條件
    if (eventType) {
      qb.andWhere('event.event_type = :eventType', { eventType });
    }

    // 若指定是否報名截止（isEnded），則加入條件
    if (typeof isEnded === 'boolean') {
      qb.andWhere('event.is_ended = :isEnded', { isEnded });
    }

    // 若指定價格區間，也加上相對應條件
    if (typeof minPrice === 'number') {
      qb.andWhere('event.event_price >= :minPrice', { minPrice });
    }
    if (typeof maxPrice === 'number') {
      qb.andWhere('event.event_price <= :maxPrice', { maxPrice });
    }

    // 分頁邏輯
    qb.skip(offset).take(limit);

    // 執行查詢並回傳資料陣列
    const events = await qb.getMany();
    
    // 把結果轉成 DTO 類別，避免多餘欄位外洩
    return EventDto.fromEntities(events);
  }

  /** 查詢活動（SELECT * FROM event WHERE event_id） */
  async findOneEvent(event_id: number): Promise<EventDto> {
    // 根據 ID 查詢活動資料
    const event = await this.eventRepository.findOne({ where: { event_id } });

    // 查無資料就拋出 404 例外
    if (!event) {
      this.throwEventNotFound(event_id);
    }

    
    // 若活動過期但尚未更新為 is_ended = true
    if (!event.is_ended && event.registration_deadline < new Date()) {
      event.is_ended = true;
      await this.eventRepository.save(event);
    }

    // 將查到的資料轉成 DTO 格式
    return EventDto.fromEntity(event);
  }

  /** 新增一筆活動（INSERT INTO event ...） */
  async createEvent(event: Event): Promise<EventDto> {
    // 驗證價格必須是正數
    this.validateEventPrice(event.event_price);

    // 設定建立時間
    event.created_at = new Date();

    // 設定修改時間
    event.updated_at = new Date();

    // 寫入資料庫
    const created = await this.eventRepository.save(event);

    // 回傳 DTO 格式的結果
    return plainToInstance(EventDto, created, { excludeExtraneousValues: true });
  }

  /** 根據 id 修改活動（UPDATE event SET ... WHERE id = ?） */ 
  async updateEvent(event_id: number, event: Event): Promise<EventDto> {

    // 更新修改時間
    event.updated_at = new Date();

    // 驗證價格必須是正數
    this.validateEventPrice(event.event_price);
    
    // 更新這筆資料
    await this.eventRepository.update(event_id, event);

    // 更新後再次查詢資料，是否符合資料庫需求
    const updated = await this.eventRepository.findOne({where: { event_id: event_id },});
    if (!updated) {
      this.throwEventNotFound(event_id);
    }

    // 回傳轉換後的 DTO
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
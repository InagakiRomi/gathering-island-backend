import { ParseIntPipe, Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { QueryParams, DefaultQueryValues } from 'src/event/common/constants/query-params.constant';
import { plainToInstance } from 'class-transformer';
import { EventService } from '../service/event.service';
import { Event as EventEntity } from '../entity/event.entity';
import { EventDto } from '../dto/event.dto';
import { EventType } from '../enums/event-type.enum';

@Controller('events')
export class EventController {
    constructor(private eventService: EventService) {}

    /** 查詢所有的活動（SELECT * FROM event） */
    @Get()
    async findAllEvent(
        // 模糊查詢
        @Query(QueryParams.SEARCH) query: string,

        // 排序
        @Query(QueryParams.SORT) sortParam: string = DefaultQueryValues.SORT,

        // 活動類型
        @Query(QueryParams.EVENT_TYPE) eventType?: EventType,

        // 是否報名截止
        @Query(QueryParams.IS_ENDED) isEndedRaw?: string,

        // 價格區間
        @Query(QueryParams.MIN_PRICE) minPriceRaw?: string,
        @Query(QueryParams.MAX_PRICE) maxPriceRaw?: string,

        // 分頁
        @Query(QueryParams.PAGE) pageRaw: string = DefaultQueryValues.PAGE,
        @Query(QueryParams.LIMIT) limitRaw: string = DefaultQueryValues.LIMIT,
        
    ): Promise<EventDto[]> {
        // 處理排序參數，轉為物件格式
        const sortObj: Record<string, 'ASC' | 'DESC'> = {};

        // 允許排序的欄位
        const allowedSortFields = [
            'created_at',
            'max_participants',
            'event_price',
            'event_time',
            'registration_deadline'
        ];

        // 將多個排序條件轉為物件格式
        sortParam.split(',').forEach(pair => {
            const [field, direction] = pair.split(':');
            if (field && allowedSortFields.includes(field) && ['ASC', 'DESC'].includes(direction?.toUpperCase())) {
                sortObj[field] = direction.toUpperCase() as 'ASC' | 'DESC';
            }
        });

        // 將 isEndedRaw 字串轉為 boolean
        let isEnded: boolean | undefined = undefined;
        if (typeof isEndedRaw === 'string') {
            if (isEndedRaw.toLowerCase() === 'true') {
            isEnded = true;
            } else if (isEndedRaw.toLowerCase() === 'false') {
            isEnded = false;
            }
        }

        // 轉換價格為數字型別（若未填寫則為 undefined）
        const minPrice = minPriceRaw ? parseInt(minPriceRaw, 10) : undefined;
        const maxPrice = maxPriceRaw ? parseInt(maxPriceRaw, 10) : undefined;

        const page = Math.max(1, parseInt(pageRaw, 10));
        const limit = Math.max(1, parseInt(limitRaw, 10));
        const offset = (page - 1) * limit;

        // 呼叫服務層查詢資料
        const events = await this.eventService.findAllEvent(
            query,
            sortObj,
            eventType,
            isEnded,
            minPrice,
            maxPrice,
            limit,
            offset
        );

        // 將結果轉為 DTO，排除不必要欄位
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
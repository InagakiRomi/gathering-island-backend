import { Expose, Transform } from 'class-transformer';
import dayjs from 'dayjs';
import { Event } from '../entity/event.entity';
import { EventType } from '../enums/event-type.enum';

export class EventDto {

    /** 活動 ID */
    @Expose()
    event_id: number;

    /** 活動標題 */
    @Expose()
    event_name: string;

    /** 活動描述 */
    @Expose()
    event_description: string;

    /** 活動類型 */
    @Expose()
    event_type: EventType;

    /** 活動地點 */
    @Expose()
    event_location: string;

    /** 封面圖片 URL */
    @Expose()
    image_url: string;

    /** 活動人數上限 */
    @Expose()
    max_participants: number;

    /** 活動費用 */
    @Expose()
    event_price: number;

    /** 主辦人 ID */
    @Expose()
    organizer_id: number;

    /** 活動開始時間 */
    @Expose()
    @Transform(({ value }) => dayjs(value).format('YYYY/MM/DD HH:mm:ss'))
    event_time: Date;

    /** 報名截止時間 */
    @Expose()
    @Transform(({ value }) => dayjs(value).format('YYYY/MM/DD HH:mm:ss'))
    registration_deadline: Date;

    /** 建立時間，自動填入目前時間 */
    @Expose()
    @Transform(({ value }) => dayjs(value).format('YYYY/MM/DD HH:mm:ss'))
    created_at: Date;

    /**
     * 將一個 Event Entity（從資料庫撈出來的物件）
     * 轉換成 EventDto（前端要看的格式）
     */
    static fromEntity(event: Event): EventDto {
        // Object.assign 把 event 的屬性值複製到一個新的 EventDto 實體上
        return Object.assign(new EventDto(), event);
    }

    /**
     * 將多個 Event Entity（陣列）轉換成多個 EventDto（陣列）
     */
    static fromEntities(events: Event[]): EventDto[] {
        // 用 map 一筆一筆轉換成 EventDto
        return events.map(e => EventDto.fromEntity(e));
    }
}
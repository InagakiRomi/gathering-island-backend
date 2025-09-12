import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { Min } from 'class-validator';
import { EventType } from '../enums/event-type.enum';

@Entity('events')
export class Event {
    /** 主鍵，自動遞增的活動 ID */
    @PrimaryGeneratedColumn()
    event_id: number;

    /** 活動標題 */
    @Column()
    event_name: string;

    /** 活動描述 */
    @Column()
    event_description: string;

    /** 活動類型 */
    @Column({ type: 'enum', enum: EventType })
    event_type: EventType;

    /** 活動地點 */
    @Column()
    event_location: string;

    /** 封面圖片 URL */
    @Column({ nullable: true })
    image_url: string;

    /** 活動人數上限 */
    @Column()
    max_participants: number;

    /** 活動費用 */
    @Min(0)
    @Column({ unsigned: true })
    event_price: number;

    /** 主辦人 ID */
    @Column()
    organizer_id: number;

    /** 活動報名是否截止 */
    @Column()
    is_ended: boolean;

    /** 活動開始時間 */
    @Column()
    event_time: Date;

    /** 報名截止時間 */
    @Column()
    registration_deadline: Date;

    /** 建立時間，自動填入目前時間 */
    @Column({ nullable: true })
    created_at: Date;

    /** 最後更新資料時間 */
    @Column()
    updated_at: Date;
}
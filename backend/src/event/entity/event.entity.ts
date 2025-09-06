import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { Min } from 'class-validator';
import { EventType } from '../enums/event-type.enum';

@Entity('events')
export class Event {
    /** 主鍵，自動遞增的活動 ID */
    @PrimaryGeneratedColumn()
    event_id: number;

    /** 活動標題 */
    @Column({ type: 'varchar', length: 32 })
    event_name: string;

    /** 活動描述 */
    @Column({ type: 'varchar', length: 512 })
    event_description: string;

    /** 活動類型 */
    @Column({ type: 'enum', enum: EventType })
    event_type: EventType;

    /** 活動地點 */
    @Column({ type: 'varchar', length: 128 })
    event_location: string;

    /** 封面圖片 URL */
    @Column({ type: 'varchar', length: 512, nullable: true })
    image_url: string;

    /** 活動人數上限 */
    @Column({ default: 2 })
    max_participants: number;

    /** 活動費用 */
    @Min(0)
    @Column({ type: 'int', default: 0, unsigned: true })
    event_price: number;

    /** 主辦人 ID */
    @Column()
    organizer_id: number;

    /** 活動開始時間 */
    @Column({ type: 'timestamp' })
    event_time: Date;

    /** 報名截止時間 */
    @Column({ type: 'timestamp' })
    registration_deadline: Date;

    /** 建立時間，自動填入目前時間 */
    @Column({ type: 'timestamp', nullable: true })
    created_at: Date;

    /** 活動報名是否截止 */
    @Column({ default: false })
    is_ended: boolean;
}
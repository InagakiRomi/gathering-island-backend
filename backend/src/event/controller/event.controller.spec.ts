import { Test, TestingModule } from '@nestjs/testing';
import { EventController } from '../controller/event.controller';
import { EventService } from '../service/event.service';
import { EventDto } from '../dto/event.dto';
import { EventType } from '../enums/event-type.enum';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Event } from '../entity/event.entity';

describe('EventController', () => {
  let controller: EventController;
  let service: EventService;

  const mockEvent: EventDto = {
    event_id: 1,
    event_name: 'Mock Event',
    event_description: 'Description',
    event_type: EventType.LEARNING,
    event_typeName: 'LEARNING',
    event_location: 'Somewhere',
    image_url: '',
    max_participants: 50,
    event_price: 200,
    organizer_id: 1,
    is_ended: false,
    event_time: new Date(),
    registration_deadline: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockService = {
    findAllEvent: jest.fn(),
    findOneEvent: jest.fn(),
    createEvent: jest.fn(),
    updateEvent: jest.fn(),
    deleteEvent: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventController],
      providers: [
        { provide: EventService, useValue: mockService },
      ],
    }).compile();

    controller = module.get<EventController>(EventController);
    service = module.get<EventService>(EventService);
  });

  afterEach(() => jest.clearAllMocks());

  // ✔️ 正常查詢（有排序與條件）
  it('should fetch events with proper query and sort', async () => {
    mockService.findAllEvent.mockResolvedValue([mockEvent]);

    const result = await controller.findAllEvent(
      'mock',                      // query
      'event_time:DESC',           // sort
      EventType.OTHER,             // eventType
      'false',                     // isEndedRaw
      '100', '300',                // min/max price
      '1', '10'                    // page, limit
    );

    expect(service.findAllEvent).toHaveBeenCalledWith(
      'mock',
      { event_time: 'DESC' },
      EventType.OTHER,
      false,
      100,
      300,
      10,
      0
    );

    expect(result[0]).toBeInstanceOf(EventDto);
  });

  // ⚠️ 非法排序欄位
  it('should ignore invalid sort fields', async () => {
    mockService.findAllEvent.mockResolvedValue([mockEvent]);

    const result = await controller.findAllEvent(
      '', 'invalid_field:ASC',
      undefined, undefined, undefined, undefined,
      undefined, undefined
    );

    expect(service.findAllEvent).toHaveBeenCalledWith(
      '',
      {},
      undefined,
      undefined,
      undefined,
      undefined,
      20,
      0
    );
  });

  // ⚠️ eventType 非合法（但 Enum 無法保護時會進來）
  it('should handle invalid enum values (eventType)', async () => {
    mockService.findAllEvent.mockResolvedValue([mockEvent]);

    const invalidType = 999 as EventType;

    const result = await controller.findAllEvent(
      '', 'created_at:ASC', invalidType,
      undefined, undefined, undefined,
      undefined, undefined
    );

    expect(service.findAllEvent).toHaveBeenCalledWith(
      '', { created_at: 'ASC' },
      invalidType, undefined,
      undefined, undefined,
      20, 0
    );
  });

  // ⚠️ 非法價格參數
  it('should handle non-numeric price values gracefully', async () => {
    mockService.findAllEvent.mockResolvedValue([mockEvent]);

    const result = await controller.findAllEvent(
      '', 'event_price:ASC',
      undefined,
      undefined,
      'abc', 'xyz',
      '1', '10'
    );

    expect(service.findAllEvent).toHaveBeenCalledWith(
      '',
      { event_price: 'ASC' },
      undefined,
      undefined,
      NaN,
      NaN,
      10,
      0
    );
  });

  // ✔️ 查單筆
  it('should return a single event by ID', async () => {
    mockService.findOneEvent.mockResolvedValue(mockEvent);

    const result = await controller.findOneEvent(1);

    expect(service.findOneEvent).toHaveBeenCalledWith(1);
    expect(result).toBeInstanceOf(EventDto);
  });

  // ⚠️ 查單筆失敗
  it('should throw NotFoundException if event not found', async () => {
    mockService.findOneEvent.mockRejectedValue(new NotFoundException());

    await expect(controller.findOneEvent(999)).rejects.toThrow(NotFoundException);
  });

  // ✔️ 建立活動
  it('should create new event', async () => {
    const newEvent = { ...mockEvent, event_id: undefined };
    mockService.createEvent.mockResolvedValue(mockEvent);

    const result = await controller.createEvent(newEvent as unknown as Event);

    expect(service.createEvent).toHaveBeenCalledWith(newEvent);
    expect(result).toEqual(mockEvent);
  });

  // ⚠️ 建立重複活動
  it('should throw ConflictException on duplicate event creation', async () => {
    const duplicate = { ...mockEvent, event_id: undefined };
    mockService.createEvent.mockRejectedValue(new ConflictException());

    await expect(controller.createEvent(duplicate as unknown as Event)).rejects.toThrow(ConflictException);
  });

  // ✔️ 更新活動
  it('should update event', async () => {
    mockService.updateEvent.mockResolvedValue(mockEvent);

    const result = await controller.updateEvent(1, mockEvent as Event);

    expect(service.updateEvent).toHaveBeenCalledWith(1, mockEvent);
    expect(result).toEqual(mockEvent);
  });

  // ✔️ 刪除活動
  it('should delete event by ID', async () => {
    mockService.deleteEvent.mockResolvedValue(undefined);

    await controller.deleteEvent(1);

    expect(service.deleteEvent).toHaveBeenCalledWith(1);
  });
});
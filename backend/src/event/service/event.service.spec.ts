import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventService } from '../service/event.service';
import { Event } from '../entity/event.entity';
import { EventType } from '../enums/event-type.enum';
import { NotFoundException, BadRequestException } from '@nestjs/common';

// ✅ 測試使用的合法 Entity mock 資料（只包含 Entity 定義的欄位）
const validEventEntity: Event = {
  event_id: 1,
  event_name: '測試活動',
  event_description: '這是一個測試活動',
  event_type: EventType.LEARNING,
  event_location: '台北市中正區',
  image_url: '',
  max_participants: 50,
  event_price: 200,
  is_ended: false,
  event_time: new Date(),
  registration_deadline: new Date(Date.now() + 3600000), // 一小時後
  organizer_id: 1,
  created_at: new Date(),
  updated_at: new Date(),
};

describe('EventService 單元測試', () => {
  let service: EventService;
  let repo: Repository<Event>;

  // 模擬 TypeORM Repository
  const mockRepo = {
    createQueryBuilder: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventService,
        {
          provide: getRepositoryToken(Event),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<EventService>(EventService);
    repo = module.get<Repository<Event>>(getRepositoryToken(Event));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ✅ 查詢所有活動
  describe('findAllEvent 查詢所有活動', () => {
    it('應該根據條件查詢並排序活動', async () => {
      // 建立模擬的查詢建構器
      const qb: any = {
        where: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([validEventEntity]),
      };

      // 模擬 is_ended 自動更新邏輯
      mockRepo.createQueryBuilder.mockReturnValueOnce({
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(undefined),
      });

      mockRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findAllEvent(
        '測試',
        { event_time: 'ASC' },
        EventType.LEARNING,
        false,
        100,
        300,
        10,
        0,
      );

      expect(qb.where).toHaveBeenCalled();
      expect(qb.andWhere).toHaveBeenCalled();
      expect(qb.addOrderBy).toHaveBeenCalledWith('event.event_time', 'ASC');
      expect(result[0].event_id).toBe(1);
    });
  });

  // ✅ 查詢單一活動
  describe('findOneEvent 查詢單一活動', () => {
    it('應該回傳活動，並在過期時自動設為已截止', async () => {
      const expiredEvent = {
        ...validEventEntity,
        registration_deadline: new Date(Date.now() - 10000),
        is_ended: false,
      };
      mockRepo.findOne.mockResolvedValueOnce(expiredEvent);
      mockRepo.save.mockResolvedValueOnce({ ...expiredEvent, is_ended: true });

      const result = await service.findOneEvent(1);

      expect(mockRepo.findOne).toHaveBeenCalledWith({ where: { event_id: 1 } });
      expect(mockRepo.save).toHaveBeenCalledWith(expect.objectContaining({ is_ended: true }));
      expect(result.event_id).toBe(1);
    });

    it('找不到活動應該拋出 NotFoundException', async () => {
      mockRepo.findOne.mockResolvedValueOnce(null);
      await expect(service.findOneEvent(999)).rejects.toThrow(NotFoundException);
    });
  });

  // ✅ 新增活動
  describe('createEvent 新增活動', () => {
    it('應該新增成功並回傳活動 DTO', async () => {
      const input = { ...validEventEntity };

      mockRepo.save.mockResolvedValueOnce(validEventEntity);

      const result = await service.createEvent(input as Event);

      expect(mockRepo.save).toHaveBeenCalledWith(expect.objectContaining({ event_name: '測試活動' }));
      expect(result.event_id).toBe(1);
    });

    it('新增時價格若為負數應拋出 BadRequestException', async () => {
      const input = { ...validEventEntity, event_price: -999 };

      await expect(service.createEvent(input)).rejects.toThrow(BadRequestException);
    });
  });

  // ✅ 更新活動
  describe('updateEvent 更新活動', () => {
    it('應該成功更新活動', async () => {
      mockRepo.update.mockResolvedValueOnce(undefined);
      mockRepo.findOne.mockResolvedValueOnce(validEventEntity);

      const result = await service.updateEvent(1, validEventEntity);

      expect(mockRepo.update).toHaveBeenCalledWith(1, expect.any(Object));
      expect(result.event_id).toBe(1);
    });

    it('更新後找不到活動應拋出 NotFoundException', async () => {
      mockRepo.update.mockResolvedValueOnce(undefined);
      mockRepo.findOne.mockResolvedValueOnce(null);

      await expect(service.updateEvent(1, validEventEntity)).rejects.toThrow(NotFoundException);
    });

    it('更新時價格為負應拋出 BadRequestException', async () => {
      const invalid = { ...validEventEntity, event_price: -100 };
      await expect(service.updateEvent(1, invalid)).rejects.toThrow(BadRequestException);
    });
  });

  // ✅ 刪除活動
  describe('deleteEvent 刪除活動', () => {
    it('應該呼叫 delete() 方法刪除活動', async () => {
      await service.deleteEvent(1);
      expect(mockRepo.delete).toHaveBeenCalledWith(1);
    });
  });

  // ✅ 驗證私有方法 validateEventPrice()
  describe('validateEventPrice 驗證價格是否為正數', () => {
    it('若價格為負數應拋出 BadRequestException', () => {
      expect(() => (service as any).validateEventPrice(-1)).toThrow(BadRequestException);
    });

    it('價格為 0 或正數時不應拋錯', () => {
      expect(() => (service as any).validateEventPrice(0)).not.toThrow();
      expect(() => (service as any).validateEventPrice(100)).not.toThrow();
    });
  });

  // ✅ 驗證私有方法 throwEventNotFound()
  describe('throwEventNotFound 拋出 NotFound 錯誤', () => {
    it('應該拋出 NotFoundException', () => {
      expect(() => (service as any).throwEventNotFound(123)).toThrow(NotFoundException);
    });
  });
});

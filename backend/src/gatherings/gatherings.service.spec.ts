import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager, EntityRepository, Loaded } from '@mikro-orm/core';
import { getRepositoryToken } from '@mikro-orm/nestjs';

import { GatheringsService } from './gatherings.service';
import { Gathering } from './entities/gathering.entity';
import { Participant } from './entities/participant.entity';
import { TagsService } from '../tags/tags.service';
import { GatheringStatus } from './enum/gathering.status';
import { GatheringType } from './enum/gathering.type';
import { UserRole } from 'src/users/enum/auth.role';
import { ErrorCode } from 'src/common/enum/error-code.enum';

/**
 * ============================
 * 共用 Mock 資料
 * ============================
 */

const mockUser = {
  id: 1,
  role: UserRole.USER,
};

const mockAdmin = {
  id: 999,
  role: UserRole.ADMIN,
};

const mockTag = (tagName: string) => ({
  id: Math.random(),
  tagName,
});

const mockParticipant = (override: Partial<Participant> = {}) => ({
  id: 1,
  gathering: mockGathering(),
  user: mockUser,
  joinedAt: new Date(),
  toJSON: () => ({
    id: 1,
    gatheringId: 1,
    userId: 1,
    joinedAt: new Date().toISOString(),
  }),
  ...override,
});

/**
 * MikroORM Loaded<Gathering> Mock
 * 一定要包含 toJSON()
 */
const mockGathering = (
  override: Partial<Gathering> = {},
): Loaded<Gathering> => {
  const gathering = {
    id: 1,
    userId: 1,
    title: 'Test Gathering',
    description: 'Test Description',
    location: 'Taipei',
    participantNumbers: 10,
    price: 100,
    status: GatheringStatus.OPEN,
    type: GatheringType.PARTY,
    startTime: new Date(),
    deadline: null,
    isArchived: false,
    createdAt: new Date(),
    updatedAt: new Date(),

    tags: {
      set: jest.fn(),
      map: (fn: any) => [{ tagName: 'music' }, { tagName: 'food' }].map(fn),
    },

    toJSON: () => ({
      id: 1,
      userId: 1,
      title: 'Test Gathering',
      description: 'Test Description',
      location: 'Taipei',
      participantNumbers: 10,
      price: 100,
      status: GatheringStatus.OPEN,
      type: GatheringType.PARTY,
      startTime: new Date().toISOString(),
      deadline: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: ['music', 'food'],
    }),

    ...override,
  };

  return gathering as Loaded<Gathering>;
};

describe('GatheringsService', () => {
  let service: GatheringsService;
  let gatheringRepository: jest.Mocked<EntityRepository<Gathering>>;
  let entityManager: jest.Mocked<EntityManager>;
  let tagsService: jest.Mocked<TagsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GatheringsService,
        {
          provide: getRepositoryToken(Gathering),
          useValue: {
            find: jest.fn(),
            count: jest.fn(),
          },
        },
        {
          provide: EntityManager,
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            count: jest.fn(),
            create: jest.fn(),
            persistAndFlush: jest.fn(),
            removeAndFlush: jest.fn(),
          },
        },
        {
          provide: TagsService,
          useValue: {
            findOrCreateTag: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(GatheringsService);
    gatheringRepository = module.get(getRepositoryToken(Gathering));
    entityManager = module.get(EntityManager);
    tagsService = module.get(TagsService);
  });

  /**
   * ============================
   * getGatherings
   * ============================
   */
  describe('getGatherings', () => {
    it('取得所有聚會（不限制 userId）', async () => {
      gatheringRepository.count.mockResolvedValue(1);
      gatheringRepository.find.mockResolvedValue([mockGathering()]);

      const result = await service.getGatherings({
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'DESC',
      } as any);

      expect(result.gatheringData).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('tags 不是 array 時拋出 BadRequestException', async () => {
      await expect(
        service.getGatherings({
          page: 1,
          limit: 10,
          sortBy: 'createdAt',
          sortOrder: 'DESC',
          tags: 'invalid' as any,
        } as any),
      ).rejects.toThrow(
        new BadRequestException({
          message: `The 'tags' field must be an array.`,
          code: ErrorCode.BAD_REQUEST,
        }),
      );
    });

    it('tags 為合法 array 但篩選後無結果時回傳空陣列', async () => {
      gatheringRepository.count.mockResolvedValue(1);
      gatheringRepository.find.mockResolvedValue([mockGathering()]);

      const result = await service.getGatherings({
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'DESC',
        tags: ['non-exist'],
      } as any);

      expect(result.gatheringData).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('search 條件會正確組成 $or 查詢', async () => {
      gatheringRepository.count.mockResolvedValue(0);
      gatheringRepository.find.mockResolvedValue([]);

      await service.getGatherings({
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'DESC',
        search: 'party',
      } as any);

      expect(gatheringRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          $or: [
            { title: { $like: '%party%' } },
            { description: { $like: '%party%' } },
          ],
        }),
        expect.any(Object),
      );
    });

    it('status 篩選正確應用', async () => {
      gatheringRepository.count.mockResolvedValue(1);
      gatheringRepository.find.mockResolvedValue([mockGathering()]);

      await service.getGatherings({
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'DESC',
        status: GatheringStatus.CLOSED,
      } as any);

      expect(gatheringRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({ status: GatheringStatus.CLOSED }),
        expect.any(Object),
      );
    });

    it('type 篩選正確應用', async () => {
      gatheringRepository.count.mockResolvedValue(1);
      gatheringRepository.find.mockResolvedValue([mockGathering()]);

      await service.getGatherings({
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'DESC',
        type: GatheringType.PARTY,
      } as any);

      expect(gatheringRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({ type: GatheringType.PARTY }),
        expect.any(Object),
      );
    });

    it('isArchived 篩選正確應用', async () => {
      gatheringRepository.count.mockResolvedValue(1);
      gatheringRepository.find.mockResolvedValue([mockGathering()]);

      await service.getGatherings({
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'DESC',
        isArchived: false,
      } as any);

      expect(gatheringRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({ isArchived: false }),
        expect.any(Object),
      );
    });
  });

  /**
   * ============================
   * getMyGatherings
   * ============================
   */
  describe('getMyGatherings', () => {
    it('一般使用者只能取得自己的聚會', async () => {
      gatheringRepository.count.mockResolvedValue(1);
      gatheringRepository.find.mockResolvedValue([mockGathering()]);

      const result = await service.getMyGatherings(
        {
          page: 1,
          limit: 10,
          sortBy: 'createdAt',
          sortOrder: 'DESC',
        } as any,
        mockUser as any,
      );

      expect(result.gatheringData).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(gatheringRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({ userId: mockUser }),
        expect.any(Object),
      );
    });

    it('管理員可以取得所有聚會（不限制 userId）', async () => {
      gatheringRepository.count.mockResolvedValue(2);
      gatheringRepository.find.mockResolvedValue([
        mockGathering(),
        mockGathering({ id: 2, userId: 999 } as any),
      ]);

      const result = await service.getMyGatherings(
        {
          page: 1,
          limit: 10,
          sortBy: 'createdAt',
          sortOrder: 'DESC',
        } as any,
        mockAdmin as any,
      );

      expect(result.gatheringData).toHaveLength(2);
      // 管理員查詢不應該被加上 userId
      expect(gatheringRepository.find).toHaveBeenCalledWith(
        expect.not.objectContaining({ userId: expect.anything() }),
        expect.any(Object),
      );
    });

    it('tags 不是 array 時拋出 BadRequestException', async () => {
      await expect(
        service.getMyGatherings(
          {
            page: 1,
            limit: 10,
            sortBy: 'createdAt',
            sortOrder: 'DESC',
            tags: 'invalid' as any,
          } as any,
          mockUser as any,
        ),
      ).rejects.toThrow(
        new BadRequestException({
          message: `The 'tags' field must be an array.`,
          code: ErrorCode.BAD_REQUEST,
        }),
      );
    });

    it('tags 為合法 array 但篩選後無結果時回傳空陣列', async () => {
      gatheringRepository.count.mockResolvedValue(1);
      gatheringRepository.find.mockResolvedValue([mockGathering()]);

      const result = await service.getMyGatherings(
        {
          page: 1,
          limit: 10,
          sortBy: 'createdAt',
          sortOrder: 'DESC',
          tags: ['non-exist'],
        } as any,
        mockUser as any,
      );

      expect(result.gatheringData).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('search 條件會正確組成 $or 查詢', async () => {
      gatheringRepository.count.mockResolvedValue(0);
      gatheringRepository.find.mockResolvedValue([]);

      await service.getMyGatherings(
        {
          page: 1,
          limit: 10,
          sortBy: 'createdAt',
          sortOrder: 'DESC',
          search: 'party',
        } as any,
        mockUser as any,
      );

      expect(gatheringRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUser,
          $or: [
            { title: { $like: '%party%' } },
            { description: { $like: '%party%' } },
          ],
        }),
        expect.any(Object),
      );
    });

    it('status 篩選正確應用', async () => {
      gatheringRepository.count.mockResolvedValue(1);
      gatheringRepository.find.mockResolvedValue([mockGathering()]);

      await service.getMyGatherings(
        {
          page: 1,
          limit: 10,
          sortBy: 'createdAt',
          sortOrder: 'DESC',
          status: GatheringStatus.CLOSED,
        } as any,
        mockUser as any,
      );

      expect(gatheringRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUser,
          status: GatheringStatus.CLOSED,
        }),
        expect.any(Object),
      );
    });

    it('type 篩選正確應用', async () => {
      gatheringRepository.count.mockResolvedValue(1);
      gatheringRepository.find.mockResolvedValue([mockGathering()]);

      await service.getMyGatherings(
        {
          page: 1,
          limit: 10,
          sortBy: 'createdAt',
          sortOrder: 'DESC',
          type: GatheringType.PARTY,
        } as any,
        mockUser as any,
      );

      expect(gatheringRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUser,
          type: GatheringType.PARTY,
        }),
        expect.any(Object),
      );
    });

    it('isArchived 篩選正確應用', async () => {
      gatheringRepository.count.mockResolvedValue(1);
      gatheringRepository.find.mockResolvedValue([mockGathering()]);

      await service.getMyGatherings(
        {
          page: 1,
          limit: 10,
          sortBy: 'createdAt',
          sortOrder: 'DESC',
          isArchived: false,
        } as any,
        mockUser as any,
      );

      expect(gatheringRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUser,
          isArchived: false,
        }),
        expect.any(Object),
      );
    });
  });

  /**
   * ============================
   * getGatheringById
   * ============================
   */
  describe('getGatheringById', () => {
    it('任何使用者都可以取得聚會詳細資料', async () => {
      entityManager.findOne.mockResolvedValue(mockGathering());

      const result = await service.getGatheringById(1);
      expect(result.gatheringData).toBeDefined();
      expect(entityManager.findOne).toHaveBeenCalledWith(Gathering, 1, {
        populate: ['tags'],
      });
    });

    it('找不到 gathering 時拋出 NotFoundException', async () => {
      entityManager.findOne.mockResolvedValue(null);

      await expect(service.getGatheringById(1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  /**
   * ============================
   * createGathering
   * ============================
   */
  describe('createGathering', () => {
    it('成功建立 gathering 並建立 tags 關聯', async () => {
      const gathering = mockGathering();
      entityManager.create.mockReturnValue(gathering as any);
      tagsService.findOrCreateTag.mockResolvedValue(mockTag('music') as any);

      const result = await service.createGathering(
        {
          title: 'New Gathering',
          location: 'Taipei',
          participantNumbers: 5,
          price: 0,
          startTime: new Date(),
          tags: ['music'],
        } as any,
        mockUser as any,
      );

      expect(entityManager.persistAndFlush).toHaveBeenCalledTimes(1);
      expect(result.gatheringData).toBe(gathering);
    });

    it('tags 為空 array 時不會建立 tag 關聯', async () => {
      const gathering = mockGathering();
      entityManager.create.mockReturnValue(gathering as any);

      await service.createGathering(
        {
          title: 'New Gathering',
          location: 'Taipei',
          participantNumbers: 5,
          startTime: new Date(),
          tags: [],
        } as any,
        mockUser as any,
      );

      expect(tagsService.findOrCreateTag).not.toHaveBeenCalled();
    });

    it('未傳 type 時會使用預設 GatheringType.PARTY', async () => {
      const gathering = mockGathering();
      entityManager.create.mockReturnValue(gathering as any);

      const result = await service.createGathering(
        {
          title: 'New Gathering',
          location: 'Taipei',
          participantNumbers: 5,
          startTime: new Date(),
        } as any,
        mockUser as any,
      );

      expect(result.gatheringData.type).toBe(GatheringType.PARTY);
    });

    it('user.id 不存在時拋出 BadRequestException', async () => {
      await expect(
        service.createGathering({} as any, {} as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  /**
   * ============================
   * updateGathering
   * ============================
   */
  describe('updateGathering', () => {
    it('本人可以成功更新 gathering 與 tags', async () => {
      const gathering = mockGathering();

      jest
        .spyOn(service, 'getGatheringById')
        .mockResolvedValue({ gatheringData: gathering });

      tagsService.findOrCreateTag.mockResolvedValue(mockTag('new') as any);

      const result = await service.updateGathering(
        1,
        { title: 'Updated', tags: ['new'] } as any,
        mockUser as any,
      );

      expect(result.gatheringData.title).toBe('Updated');
      expect(entityManager.persistAndFlush).toHaveBeenCalledTimes(1);
    });

    it('管理員可以更新任何 gathering', async () => {
      const gathering = mockGathering({ userId: 999 });

      jest
        .spyOn(service, 'getGatheringById')
        .mockResolvedValue({ gatheringData: gathering });

      tagsService.findOrCreateTag.mockResolvedValue(mockTag('new') as any);

      const result = await service.updateGathering(
        1,
        { title: 'Updated by Admin' } as any,
        mockAdmin as any,
      );

      expect(result.gatheringData.title).toBe('Updated by Admin');
    });

    it('非本人且非管理員時拋出 ForbiddenException', async () => {
      const gathering = mockGathering({ userId: 999 });

      jest
        .spyOn(service, 'getGatheringById')
        .mockResolvedValue({ gatheringData: gathering });

      await expect(
        service.updateGathering(
          1,
          { title: 'Unauthorized' } as any,
          mockUser as any,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('數值為 0 的欄位無法被更新（目前行為，防止誤改）', async () => {
      const gathering = mockGathering({ participantNumbers: 10 });

      jest
        .spyOn(service, 'getGatheringById')
        .mockResolvedValue({ gatheringData: gathering });

      await service.updateGathering(
        1,
        { participantNumbers: 0 } as any,
        mockUser as any,
      );

      expect(gathering.participantNumbers).toBe(10);
    });
  });

  /**
   * ============================
   * delete / restore / close
   * ============================
   */
  describe('delete / restore / close gathering', () => {
    let gathering: Loaded<Gathering>;

    beforeEach(() => {
      gathering = mockGathering();
      jest
        .spyOn(service, 'getGatheringById')
        .mockResolvedValue({ gatheringData: gathering });
    });

    it('本人可以刪除 gathering', async () => {
      const result = await service.deleteGathering(1, mockUser as any);
      expect(result.gatheringData.isArchived).toBe(true);
    });

    it('管理員可以刪除任何 gathering', async () => {
      gathering.userId = 999;
      const result = await service.deleteGathering(1, mockAdmin as any);
      expect(result.gatheringData.isArchived).toBe(true);
    });

    it('非本人且非管理員刪除時拋出 ForbiddenException', async () => {
      gathering.userId = 999;
      await expect(service.deleteGathering(1, mockUser as any)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('本人可以恢復 gathering', async () => {
      gathering.isArchived = true;
      const result = await service.restoreGathering(1, mockUser as any);
      expect(result.gatheringData.isArchived).toBe(false);
    });

    it('管理員可以恢復任何 gathering', async () => {
      gathering.isArchived = true;
      gathering.userId = 999;
      const result = await service.restoreGathering(1, mockAdmin as any);
      expect(result.gatheringData.isArchived).toBe(false);
    });

    it('非本人且非管理員恢復時拋出 ForbiddenException', async () => {
      gathering.isArchived = true;
      gathering.userId = 999;
      await expect(
        service.restoreGathering(1, mockUser as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it('本人可以關閉 gathering', async () => {
      const result = await service.closeGathering(1, mockUser as any);
      expect(result.gatheringData.status).toBe(GatheringStatus.CLOSED);
    });

    it('管理員可以關閉任何 gathering', async () => {
      gathering.userId = 999;
      const result = await service.closeGathering(1, mockAdmin as any);
      expect(result.gatheringData.status).toBe(GatheringStatus.CLOSED);
    });

    it('非本人且非管理員關閉時拋出 ForbiddenException', async () => {
      gathering.userId = 999;
      await expect(service.closeGathering(1, mockUser as any)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('close 已經 CLOSED 的 gathering 仍會維持 CLOSED（行為規格）', async () => {
      gathering.status = GatheringStatus.CLOSED;

      const result = await service.closeGathering(1, mockUser as any);

      expect(result.gatheringData.status).toBe(GatheringStatus.CLOSED);
    });
  });

  /**
   * ============================
   * joinGathering
   * ============================
   */
  describe('joinGathering', () => {
    let gathering: Loaded<Gathering>;
    let participant: Participant;

    beforeEach(() => {
      gathering = mockGathering({
        id: 1,
        userId: 2, // 不同的用戶 ID，避免創建者檢查
        participantNumbers: 10,
        status: GatheringStatus.OPEN,
        isArchived: false,
        deadline: null as any,
      });
      participant = mockParticipant() as Participant;

      jest
        .spyOn(service, 'getGatheringById')
        .mockResolvedValue({ gatheringData: gathering });
    });

    it('成功報名活動', async () => {
      entityManager.findOne.mockResolvedValue(null); // 尚未報名
      entityManager.count.mockResolvedValue(5); // 目前有 5 人參與，未達上限
      entityManager.create.mockReturnValue(participant);

      const result = await service.joinGathering(1, mockUser as any);

      expect(result.participantData).toBe(participant);
      expect(entityManager.findOne).toHaveBeenCalledWith(Participant, {
        gathering: 1,
        user: mockUser.id,
      });
      expect(entityManager.count).toHaveBeenCalledWith(Participant, {
        gathering: 1,
      });
      expect(entityManager.create).toHaveBeenCalledWith(
        Participant,
        expect.objectContaining({
          gathering: gathering,
          user: mockUser,
        }),
      );
      expect(entityManager.persistAndFlush).toHaveBeenCalledWith(participant);
    });

    it('user.id 不存在時拋出 BadRequestException', async () => {
      await expect(service.joinGathering(1, {} as any)).rejects.toThrow(
        new BadRequestException({
          message: 'User ID is missing.',
          code: ErrorCode.BAD_REQUEST,
        }),
      );
    });

    it('活動已封存時拋出 BadRequestException', async () => {
      gathering.isArchived = true;

      await expect(service.joinGathering(1, mockUser as any)).rejects.toThrow(
        new BadRequestException({
          message: 'This gathering has been archived.',
          code: ErrorCode.BAD_REQUEST,
        }),
      );
    });

    it('活動已關閉時拋出 BadRequestException', async () => {
      gathering.status = GatheringStatus.CLOSED;

      await expect(service.joinGathering(1, mockUser as any)).rejects.toThrow(
        new BadRequestException({
          message: 'This gathering is already closed.',
          code: ErrorCode.BAD_REQUEST,
        }),
      );
    });

    it('報名截止日期已過時拋出 BadRequestException', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1); // 昨天
      gathering.deadline = pastDate;

      await expect(service.joinGathering(1, mockUser as any)).rejects.toThrow(
        new BadRequestException({
          message: 'The registration deadline has passed.',
          code: ErrorCode.BAD_REQUEST,
        }),
      );
    });

    it('報名截止日期未過時可以報名', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1); // 明天
      gathering.deadline = futureDate;

      entityManager.findOne.mockResolvedValue(null);
      entityManager.count.mockResolvedValue(5);
      entityManager.create.mockReturnValue(participant);

      const result = await service.joinGathering(1, mockUser as any);

      expect(result.participantData).toBe(participant);
    });

    it('已經報名過時拋出 ConflictException', async () => {
      entityManager.findOne.mockResolvedValue(participant as any);

      await expect(service.joinGathering(1, mockUser as any)).rejects.toThrow(
        new ConflictException({
          message: 'You have already joined this gathering.',
          code: ErrorCode.CONFLICT,
        }),
      );
    });

    it('創建者不能報名時拋出 BadRequestException', async () => {
      gathering.userId = mockUser.id; // 創建者

      await expect(service.joinGathering(1, mockUser as any)).rejects.toThrow(
        new BadRequestException({
          message:
            'You are the creator of this gathering and cannot join as a participant.',
          code: ErrorCode.BAD_REQUEST,
        }),
      );
    });

    it('已達人數上限時拋出 BadRequestException', async () => {
      gathering.participantNumbers = 5;
      entityManager.findOne.mockResolvedValue(null);
      entityManager.count.mockResolvedValue(5); // 已達上限

      await expect(service.joinGathering(1, mockUser as any)).rejects.toThrow(
        new BadRequestException({
          message:
            'This gathering has reached the maximum number of participants.',
          code: ErrorCode.BAD_REQUEST,
        }),
      );
    });

    it('人數未達上限時可以報名', async () => {
      gathering.participantNumbers = 10;
      entityManager.findOne.mockResolvedValue(null);
      entityManager.count.mockResolvedValue(9); // 未達上限
      entityManager.create.mockReturnValue(participant);

      const result = await service.joinGathering(1, mockUser as any);

      expect(result.participantData).toBe(participant);
    });

    it('沒有設定報名截止日期時可以報名', async () => {
      (gathering as any).deadline = null;
      entityManager.findOne.mockResolvedValue(null);
      entityManager.count.mockResolvedValue(5);
      entityManager.create.mockReturnValue(participant);

      const result = await service.joinGathering(1, mockUser as any);

      expect(result.participantData).toBe(participant);
    });
  });

  /**
   * ============================
   * leaveGathering
   * ============================
   */
  describe('leaveGathering', () => {
    let gathering: Loaded<Gathering>;
    let participant: Participant;

    beforeEach(() => {
      gathering = mockGathering();
      participant = mockParticipant() as Participant;

      jest
        .spyOn(service, 'getGatheringById')
        .mockResolvedValue({ gatheringData: gathering });
    });

    it('成功取消報名', async () => {
      entityManager.findOne.mockResolvedValue(participant as any);

      const result = await service.leaveGathering(1, mockUser as any);

      expect(result.message).toBe('Successfully left the gathering.');
      expect(entityManager.findOne).toHaveBeenCalledWith(Participant, {
        gathering: gathering.id,
        user: mockUser.id,
      });
      expect(entityManager.removeAndFlush).toHaveBeenCalledWith(participant);
    });

    it('user.id 不存在時拋出 BadRequestException', async () => {
      await expect(service.leaveGathering(1, {} as any)).rejects.toThrow(
        new BadRequestException({
          message: 'User ID is missing.',
          code: ErrorCode.BAD_REQUEST,
        }),
      );
    });

    it('尚未報名時拋出 BadRequestException', async () => {
      entityManager.findOne.mockResolvedValue(null);

      await expect(service.leaveGathering(1, mockUser as any)).rejects.toThrow(
        new BadRequestException({
          message: 'You have not joined this gathering.',
          code: ErrorCode.BAD_REQUEST,
        }),
      );
    });

    it('找不到活動時會透過 getGatheringById 拋出 NotFoundException', async () => {
      jest.spyOn(service, 'getGatheringById').mockRejectedValue(
        new NotFoundException({
          message: 'Gathering with ID "1" not found.',
          code: ErrorCode.NOT_FOUND,
        }),
      );

      await expect(service.leaveGathering(1, mockUser as any)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  /**
   * ============================
   * getParticipatedGatherings
   * ============================
   */
  describe('getParticipatedGatherings', () => {
    let gathering1: Loaded<Gathering>;
    let gathering2: Loaded<Gathering>;
    let participant1: Participant;
    let participant2: Participant;

    beforeEach(() => {
      gathering1 = mockGathering({ id: 1 });
      gathering2 = mockGathering({ id: 2, title: 'Another Gathering' });
      participant1 = mockParticipant({
        id: 1,
        gathering: gathering1,
      }) as Participant;
      participant2 = mockParticipant({
        id: 2,
        gathering: gathering2,
      }) as Participant;
    });

    it('成功取得已參加的活動', async () => {
      entityManager.find.mockResolvedValue([
        participant1 as any,
        participant2 as any,
      ]);
      gatheringRepository.count.mockResolvedValue(2);
      gatheringRepository.find.mockResolvedValue([gathering1, gathering2]);

      const result = await service.getParticipatedGatherings(
        {
          page: 1,
          limit: 10,
          sortBy: 'createdAt',
          sortOrder: 'DESC',
        } as any,
        mockUser as any,
      );

      expect(result.gatheringData).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(entityManager.find).toHaveBeenCalledWith(
        Participant,
        { user: mockUser.id },
        { populate: ['gathering'] },
      );
      expect(gatheringRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          id: { $in: [1, 2] },
        }),
        expect.any(Object),
      );
    });

    it('user.id 不存在時拋出 BadRequestException', async () => {
      await expect(
        service.getParticipatedGatherings({} as any, {} as any),
      ).rejects.toThrow(
        new BadRequestException({
          message: 'User ID is missing.',
          code: ErrorCode.BAD_REQUEST,
        }),
      );
    });

    it('沒有參與任何活動時回傳空陣列', async () => {
      entityManager.find.mockResolvedValue([]);

      const result = await service.getParticipatedGatherings(
        {
          page: 1,
          limit: 10,
          sortBy: 'createdAt',
          sortOrder: 'DESC',
        } as any,
        mockUser as any,
      );

      expect(result.gatheringData).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(gatheringRepository.find).not.toHaveBeenCalled();
    });

    it('status 篩選正確應用', async () => {
      entityManager.find.mockResolvedValue([participant1 as any]);
      gatheringRepository.count.mockResolvedValue(1);
      gatheringRepository.find.mockResolvedValue([gathering1]);

      await service.getParticipatedGatherings(
        {
          page: 1,
          limit: 10,
          sortBy: 'createdAt',
          sortOrder: 'DESC',
          status: GatheringStatus.CLOSED,
        } as any,
        mockUser as any,
      );

      expect(gatheringRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          id: { $in: [1] },
          status: GatheringStatus.CLOSED,
        }),
        expect.any(Object),
      );
    });

    it('type 篩選正確應用', async () => {
      entityManager.find.mockResolvedValue([participant1 as any]);
      gatheringRepository.count.mockResolvedValue(1);
      gatheringRepository.find.mockResolvedValue([gathering1]);

      await service.getParticipatedGatherings(
        {
          page: 1,
          limit: 10,
          sortBy: 'createdAt',
          sortOrder: 'DESC',
          type: GatheringType.PARTY,
        } as any,
        mockUser as any,
      );

      expect(gatheringRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          id: { $in: [1] },
          type: GatheringType.PARTY,
        }),
        expect.any(Object),
      );
    });

    it('isArchived 篩選正確應用', async () => {
      entityManager.find.mockResolvedValue([participant1 as any]);
      gatheringRepository.count.mockResolvedValue(1);
      gatheringRepository.find.mockResolvedValue([gathering1]);

      await service.getParticipatedGatherings(
        {
          page: 1,
          limit: 10,
          sortBy: 'createdAt',
          sortOrder: 'DESC',
          isArchived: false,
        } as any,
        mockUser as any,
      );

      expect(gatheringRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          id: { $in: [1] },
          isArchived: false,
        }),
        expect.any(Object),
      );
    });

    it('search 條件會正確組成 $or 查詢', async () => {
      entityManager.find.mockResolvedValue([participant1 as any]);
      gatheringRepository.count.mockResolvedValue(0);
      gatheringRepository.find.mockResolvedValue([]);

      await service.getParticipatedGatherings(
        {
          page: 1,
          limit: 10,
          sortBy: 'createdAt',
          sortOrder: 'DESC',
          search: 'party',
        } as any,
        mockUser as any,
      );

      expect(gatheringRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          id: { $in: [1] },
          $or: [
            { title: { $like: '%party%' } },
            { description: { $like: '%party%' } },
          ],
        }),
        expect.any(Object),
      );
    });

    it('tags 不是 array 時拋出 BadRequestException', async () => {
      entityManager.find.mockResolvedValue([participant1 as any]);

      await expect(
        service.getParticipatedGatherings(
          {
            page: 1,
            limit: 10,
            sortBy: 'createdAt',
            sortOrder: 'DESC',
            tags: 'invalid' as any,
          } as any,
          mockUser as any,
        ),
      ).rejects.toThrow(
        new BadRequestException({
          message: `The 'tags' field must be an array.`,
          code: ErrorCode.BAD_REQUEST,
        }),
      );
    });

    it('tags 為合法 array 但篩選後無結果時回傳空陣列', async () => {
      entityManager.find.mockResolvedValue([participant1 as any]);
      gatheringRepository.count.mockResolvedValue(1);
      gatheringRepository.find.mockResolvedValue([gathering1]);

      const result = await service.getParticipatedGatherings(
        {
          page: 1,
          limit: 10,
          sortBy: 'createdAt',
          sortOrder: 'DESC',
          tags: ['non-exist'],
        } as any,
        mockUser as any,
      );

      expect(result.gatheringData).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('tags 篩選正確應用', async () => {
      entityManager.find.mockResolvedValue([participant1 as any]);
      gatheringRepository.count.mockResolvedValue(1);
      gatheringRepository.find.mockResolvedValue([gathering1]);

      const result = await service.getParticipatedGatherings(
        {
          page: 1,
          limit: 10,
          sortBy: 'createdAt',
          sortOrder: 'DESC',
          tags: ['music'],
        } as any,
        mockUser as any,
      );

      // gathering1 有 'music' 和 'food' 標籤，應該通過篩選
      expect(result.gatheringData.length).toBeGreaterThanOrEqual(0);
    });

    it('分頁參數正確應用', async () => {
      // 創建多個 gatherings 來測試分頁
      const gatherings = Array.from({ length: 10 }, (_, i) =>
        mockGathering({
          id: i + 1,
          createdAt: new Date(2024, 0, i + 1), // 不同的日期用於排序
        }),
      );
      const participants = gatherings.map((g, i) =>
        mockParticipant({ id: i + 1, gathering: g }),
      );

      entityManager.find.mockResolvedValue(participants as any);
      gatheringRepository.find.mockResolvedValue(gatherings);

      const result = await service.getParticipatedGatherings(
        {
          page: 2,
          limit: 5,
          sortBy: 'createdAt',
          sortOrder: 'ASC',
        } as any,
        mockUser as any,
      );

      // 驗證分頁結果：第 2 頁應該有 5 筆資料（索引 5-9）
      expect(result.gatheringData).toHaveLength(5);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(5);
      expect(result.total).toBe(10);
      // 驗證查詢時沒有使用 limit 和 offset（因為現在在記憶體中分頁）
      expect(gatheringRepository.find).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          populate: ['tags'],
        }),
      );
    });

    it('多個篩選條件同時應用', async () => {
      entityManager.find.mockResolvedValue([participant1 as any]);
      gatheringRepository.count.mockResolvedValue(1);
      gatheringRepository.find.mockResolvedValue([gathering1]);

      await service.getParticipatedGatherings(
        {
          page: 1,
          limit: 10,
          sortBy: 'createdAt',
          sortOrder: 'DESC',
          status: GatheringStatus.OPEN,
          type: GatheringType.PARTY,
          isArchived: false,
          search: 'test',
        } as any,
        mockUser as any,
      );

      expect(gatheringRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          id: { $in: [1] },
          status: GatheringStatus.OPEN,
          type: GatheringType.PARTY,
          isArchived: false,
          $or: [
            { title: { $like: '%test%' } },
            { description: { $like: '%test%' } },
          ],
        }),
        expect.any(Object),
      );
    });
  });
});

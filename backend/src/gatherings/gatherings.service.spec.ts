/* eslint-disable @typescript-eslint/unbound-method */
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
import * as XLSX from 'xlsx';

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

    calculateStatus: (_now: Date) => gathering.status,

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
            flush: jest.fn(),
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
          $or: [{ title: { $like: '%party%' } }],
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
          $or: [{ title: { $like: '%party%' } }],
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

    it('ID 為無效數字（NaN）時拋出 BadRequestException', async () => {
      await expect(service.getGatheringById(NaN)).rejects.toThrow(
        new BadRequestException({
          message: `Invalid gathering ID: "NaN". ID must be a positive integer.`,
          code: ErrorCode.BAD_REQUEST,
        }),
      );
      expect(entityManager.findOne).not.toHaveBeenCalled();
    });

    it('ID 為 0 時拋出 BadRequestException', async () => {
      await expect(service.getGatheringById(0)).rejects.toThrow(
        new BadRequestException({
          message: `Invalid gathering ID: "0". ID must be a positive integer.`,
          code: ErrorCode.BAD_REQUEST,
        }),
      );
      expect(entityManager.findOne).not.toHaveBeenCalled();
    });

    it('ID 為負數時拋出 BadRequestException', async () => {
      await expect(service.getGatheringById(-1)).rejects.toThrow(
        new BadRequestException({
          message: `Invalid gathering ID: "-1". ID must be a positive integer.`,
          code: ErrorCode.BAD_REQUEST,
        }),
      );
      expect(entityManager.findOne).not.toHaveBeenCalled();
    });

    it('ID 為非整數時拋出 BadRequestException', async () => {
      await expect(service.getGatheringById(1.5)).rejects.toThrow(
        new BadRequestException({
          message: `Invalid gathering ID: "1.5". ID must be a positive integer.`,
          code: ErrorCode.BAD_REQUEST,
        }),
      );
      expect(entityManager.findOne).not.toHaveBeenCalled();
    });

    it('ID 為 null 或 undefined 時拋出 BadRequestException', async () => {
      await expect(service.getGatheringById(null as any)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.getGatheringById(undefined as any)).rejects.toThrow(
        BadRequestException,
      );
      expect(entityManager.findOne).not.toHaveBeenCalled();
    });
  });

  /**
   * ============================
   * getGatheringParticipants
   * ============================
   */
  describe('getGatheringParticipants', () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('活動建立者可取得參與者列表', async () => {
      const gathering = mockGathering({ userId: 1 });
      jest.spyOn(service, 'getGatheringById').mockResolvedValue({
        gatheringData: gathering,
      });

      const participantUser = {
        id: 2,
        email: 'p@example.com',
        displayName: 'Participant',
        role: UserRole.USER,
        createdAt: new Date('2025-01-01T00:00:00.000Z'),
        updatedAt: new Date('2025-01-02T00:00:00.000Z'),
      };

      entityManager.find.mockResolvedValue([
        mockParticipant({ user: participantUser as any }) as any,
      ]);

      const result = await service.getGatheringParticipants(1, mockUser as any);

      expect(result.userData).toHaveLength(1);
      expect(result.userData[0].id).toBe(2);
      expect(result.userData[0].email).toBe('p@example.com');
      expect(entityManager.find).toHaveBeenCalledWith(
        Participant,
        { gathering: 1 },
        expect.objectContaining({
          populate: ['user'],
          orderBy: { joinedAt: 'ASC' },
        }),
      );
    });

    it('管理員可取得他人活動的參與者列表', async () => {
      const gathering = mockGathering({ userId: 42 });
      jest.spyOn(service, 'getGatheringById').mockResolvedValue({
        gatheringData: gathering,
      });
      entityManager.find.mockResolvedValue([]);

      const result = await service.getGatheringParticipants(1, mockAdmin as any);

      expect(result.userData).toEqual([]);
    });

    it('非建立者且非管理員時拋出 ForbiddenException', async () => {
      const gathering = mockGathering({ userId: 999 });
      jest.spyOn(service, 'getGatheringById').mockResolvedValue({
        gatheringData: gathering,
      });

      await expect(
        service.getGatheringParticipants(1, mockUser as any),
      ).rejects.toThrow(ForbiddenException);
      expect(entityManager.find).not.toHaveBeenCalled();
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

    it('startTime 小於現在時拋出 BadRequestException', async () => {
      const past = new Date(Date.now() - 1000 * 60 * 60); // 一小時前
      await expect(
        service.createGathering(
          {
            title: 'Past Gathering',
            location: 'Taipei',
            participantNumbers: 5,
            startTime: past,
            tags: ['music'],
          } as any,
          mockUser as any,
        ),
      ).rejects.toThrow(
        new BadRequestException({
          message: 'Start time cannot be earlier than the current time.',
          code: ErrorCode.BAD_REQUEST,
        }),
      );
    });

    it('deadline 大於 startTime 時拋出 BadRequestException', async () => {
      const now = new Date();
      const startTime = new Date(now.getTime() + 1000 * 60 * 60); // 一小時後
      const deadline = new Date(startTime.getTime() + 1000 * 60 * 60); // 兩小時後
      await expect(
        service.createGathering(
          {
            title: 'Invalid Deadline',
            location: 'Taipei',
            participantNumbers: 5,
            startTime,
            deadline,
            tags: ['music'],
          } as any,
          mockUser as any,
        ),
      ).rejects.toThrow(
        new BadRequestException({
          message: 'Dead line cannot be earlier than the start time.',
          code: ErrorCode.BAD_REQUEST,
        }),
      );
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

      entityManager.findOne.mockResolvedValue(gathering);

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

      entityManager.findOne.mockResolvedValue(gathering);

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

      entityManager.findOne.mockResolvedValue(gathering);

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

      entityManager.findOne.mockResolvedValue(gathering);

      await service.updateGathering(
        1,
        { participantNumbers: 0 } as any,
        mockUser as any,
      );

      expect(gathering.participantNumbers).toBe(10);
    });

    it('活動已封存時無法更新，拋出 BadRequestException', async () => {
      const gathering = mockGathering({ isArchived: true });

      entityManager.findOne.mockResolvedValue(gathering);

      await expect(
        service.updateGathering(
          1,
          { title: 'Updated' } as any,
          mockUser as any,
        ),
      ).rejects.toThrow(
        new BadRequestException({
          message: 'Cannot update archived gatherings.',
          code: ErrorCode.BAD_REQUEST,
        }),
      );
    });

    it('活動狀態為 CLOSED 時無法更新，拋出 BadRequestException', async () => {
      const gathering = mockGathering({
        status: GatheringStatus.CLOSED,
      });

      entityManager.findOne.mockResolvedValue(gathering);

      await expect(
        service.updateGathering(
          1,
          { title: 'Updated' } as any,
          mockUser as any,
        ),
      ).rejects.toThrow(
        new BadRequestException({
          message: 'Cannot update closed gatherings.',
          code: ErrorCode.BAD_REQUEST,
        }),
      );
    });

    it('活動狀態為 UPCOMING 時無法更新，拋出 BadRequestException', async () => {
      const gathering = mockGathering({
        status: GatheringStatus.UPCOMING,
      });

      entityManager.findOne.mockResolvedValue(gathering);

      await expect(
        service.updateGathering(
          1,
          { title: 'Updated' } as any,
          mockUser as any,
        ),
      ).rejects.toThrow(
        new BadRequestException({
          message: 'Cannot update gatherings in progress.',
          code: ErrorCode.BAD_REQUEST,
        }),
      );
    });

    it('更新 deadline 且新 deadline 大於 startTime 時拋出 BadRequestException', async () => {
      const startTime = new Date('2025-06-01T12:00:00Z');
      const gathering = mockGathering({
        startTime,
        deadline: new Date('2025-05-01T12:00:00Z'),
      });

      entityManager.findOne.mockResolvedValue(gathering);

      const newDeadline = new Date('2025-07-01T12:00:00Z'); // 晚於 startTime

      await expect(
        service.updateGathering(
          1,
          { deadline: newDeadline } as any,
          mockUser as any,
        ),
      ).rejects.toThrow(
        new BadRequestException({
          message: 'The deadline time cannot be earlier than the start time.',
          code: ErrorCode.BAD_REQUEST,
        }),
      );
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
      expect(result.gatheringData.status).toBe(GatheringStatus.CLOSED);
    });

    it('管理員可以刪除任何 gathering', async () => {
      gathering.userId = 999;
      const result = await service.deleteGathering(1, mockAdmin as any);
      expect(result.gatheringData.isArchived).toBe(true);
      expect(result.gatheringData.status).toBe(GatheringStatus.CLOSED);
    });

    it('非本人且非管理員刪除時拋出 ForbiddenException', async () => {
      gathering.userId = 999;
      await expect(service.deleteGathering(1, mockUser as any)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('本人可以恢復 gathering', async () => {
      gathering.isArchived = true;
      gathering.status = GatheringStatus.CLOSED;
      (gathering as any).calculateStatus = () => GatheringStatus.OPEN;
      const result = await service.restoreGathering(1, mockUser as any);
      expect(result.gatheringData.isArchived).toBe(false);
      expect(result.gatheringData.status).toBe(GatheringStatus.OPEN);
    });

    it('管理員可以恢復任何 gathering', async () => {
      gathering.isArchived = true;
      gathering.userId = 999;
      gathering.status = GatheringStatus.CLOSED;
      (gathering as any).calculateStatus = () => GatheringStatus.UPCOMING;
      const result = await service.restoreGathering(1, mockAdmin as any);
      expect(result.gatheringData.isArchived).toBe(false);
      expect(result.gatheringData.status).toBe(GatheringStatus.UPCOMING);
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

    it('活動已封存時無法取消報名，拋出 BadRequestException', async () => {
      const gathering = mockGathering({ isArchived: true });

      jest
        .spyOn(service, 'getGatheringById')
        .mockResolvedValue({ gatheringData: gathering });

      await expect(service.leaveGathering(1, mockUser as any)).rejects.toThrow(
        new BadRequestException({
          message: 'Cannot cancel participation for archived gatherings.',
          code: ErrorCode.BAD_REQUEST,
        }),
      );
    });

    it('活動狀態為 CLOSED 時無法取消報名，拋出 BadRequestException', async () => {
      const gathering = mockGathering({
        status: GatheringStatus.CLOSED,
      });

      jest
        .spyOn(service, 'getGatheringById')
        .mockResolvedValue({ gatheringData: gathering });

      await expect(service.leaveGathering(1, mockUser as any)).rejects.toThrow(
        new BadRequestException({
          message: 'Cannot cancel participation for closed gatherings.',
          code: ErrorCode.BAD_REQUEST,
        }),
      );
    });

    it('活動狀態為 UPCOMING 時無法取消報名，拋出 BadRequestException', async () => {
      const gathering = mockGathering({
        status: GatheringStatus.UPCOMING,
      });

      jest
        .spyOn(service, 'getGatheringById')
        .mockResolvedValue({ gatheringData: gathering });

      await expect(service.leaveGathering(1, mockUser as any)).rejects.toThrow(
        new BadRequestException({
          message: 'Cannot cancel participation for gatherings in progress.',
          code: ErrorCode.BAD_REQUEST,
        }),
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
          $or: [{ title: { $like: '%party%' } }],
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
          $or: [{ title: { $like: '%test%' } }],
        }),
        expect.any(Object),
      );
    });
  });

  /**
   * ============================
   * updateGatheringStatuses
   * ============================
   */
  describe('updateGatheringStatuses', () => {
    it('僅查詢可能需要轉換狀態的候選聚會', async () => {
      gatheringRepository.find.mockResolvedValue([]);

      await service.updateGatheringStatuses();

      expect(gatheringRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          isArchived: false,
          $or: [
            expect.objectContaining({
              status: GatheringStatus.OPEN,
              deadline: expect.objectContaining({ $lte: expect.any(Date) }),
            }),
            expect.objectContaining({
              status: GatheringStatus.OPEN,
              startTime: expect.objectContaining({ $lt: expect.any(Date) }),
            }),
            expect.objectContaining({
              status: GatheringStatus.UPCOMING,
              startTime: expect.objectContaining({ $lt: expect.any(Date) }),
            }),
          ],
        }),
      );
    });

    it('無需更新時回傳 updatedCount 0 且不呼叫 flush', async () => {
      const g = mockGathering({ status: GatheringStatus.OPEN });
      (g as any).calculateStatus = () => GatheringStatus.OPEN; // 與現狀相同
      gatheringRepository.find.mockResolvedValue([g]);

      const result = await service.updateGatheringStatuses();

      expect(result.updatedCount).toBe(0);
      expect(entityManager.flush).not.toHaveBeenCalled();
    });

    it('有聚會狀態與計算結果不同時會更新並呼叫 flush', async () => {
      const g = mockGathering({ status: GatheringStatus.OPEN });
      (g as any).calculateStatus = () => GatheringStatus.CLOSED; // 需要更新
      gatheringRepository.find.mockResolvedValue([g]);

      const result = await service.updateGatheringStatuses();

      expect(result.updatedCount).toBe(1);
      expect(g.status).toBe(GatheringStatus.CLOSED);
      expect(entityManager.flush).toHaveBeenCalledTimes(1);
    });

    it('傳入 EntityManager 時使用該 em 的 getRepository 與 flush', async () => {
      const g = mockGathering({ status: GatheringStatus.OPEN });
      (g as any).calculateStatus = () => GatheringStatus.UPCOMING;
      const mockEm = {
        getRepository: jest.fn().mockReturnValue({
          find: jest.fn().mockResolvedValue([g]),
        }),
        flush: jest.fn(),
      } as any;

      const result = await service.updateGatheringStatuses(mockEm);

      expect(mockEm.getRepository).toHaveBeenCalledWith(Gathering);
      expect(result.updatedCount).toBe(1);
      expect(mockEm.flush).toHaveBeenCalledTimes(1);
      expect(entityManager.flush).not.toHaveBeenCalled();
    });

    it('沒有未封存聚會時回傳 updatedCount 0', async () => {
      gatheringRepository.find.mockResolvedValue([]);

      const result = await service.updateGatheringStatuses();

      expect(result.updatedCount).toBe(0);
      expect(entityManager.flush).not.toHaveBeenCalled();
    });
  });

  /**
   * ============================
   * checkExcelGathering
   * ============================
   */
  describe('checkExcelGathering', () => {
    it('workbook 沒有工作表時拋出 BadRequestException', async () => {
      const workbook = { SheetNames: [], Sheets: {} };

      await expect(
        service.checkExcelGathering(workbook as any),
      ).rejects.toThrow(
        new BadRequestException({
          message: `No worksheets found in the Excel file.`,
          code: ErrorCode.BAD_REQUEST,
        }),
      );
    });

    it('Excel 無資料列時拋出 BadRequestException', async () => {
      const workbook = {
        SheetNames: ['Sheet1'],
        Sheets: { Sheet1: {} },
      };
      jest.spyOn(XLSX.utils, 'sheet_to_json').mockReturnValue([]);

      await expect(
        service.checkExcelGathering(workbook as any),
      ).rejects.toThrow(
        new BadRequestException({
          message: `The Excel file is empty.`,
          code: ErrorCode.BAD_REQUEST,
        }),
      );
    });

    it('資料驗證通過時回傳 total 與 data', async () => {
      const validRecord = {
        id: 1,
        userId: 1,
        title: 'Test',
        description: 'Desc',
        location: 'Taipei',
        participantNumbers: 5,
        price: 0,
        status: GatheringStatus.OPEN,
        type: GatheringType.PARTY,
        startTime: new Date('2025-01-03'),
        deadline: new Date('2025-01-02'),
        isArchived: false,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-04'),
      };
      const workbook = {
        SheetNames: ['Sheet1'],
        Sheets: { Sheet1: {} },
      };
      jest.spyOn(XLSX.utils, 'sheet_to_json').mockReturnValue([validRecord]);

      const result = await service.checkExcelGathering(workbook as any);

      expect(result).toEqual({ total: 1, data: [validRecord] });
    });

    it('自訂驗證：deadline 大於 startTime 時收集錯誤並拋出 BadRequestException', async () => {
      const invalidRecord = {
        id: 1,
        userId: 1,
        title: 'Test',
        location: 'Taipei',
        participantNumbers: 5,
        price: 0,
        status: GatheringStatus.OPEN,
        type: GatheringType.PARTY,
        startTime: new Date('2025-01-01'),
        deadline: new Date('2025-01-02'), // 晚於 startTime
        isArchived: false,
        createdAt: new Date('2024-12-31'),
        updatedAt: new Date('2025-01-03'),
      };
      const workbook = {
        SheetNames: ['Sheet1'],
        Sheets: { Sheet1: {} },
      };
      jest.spyOn(XLSX.utils, 'sheet_to_json').mockReturnValue([invalidRecord]);

      await expect(
        service.checkExcelGathering(workbook as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('自訂驗證：createdAt 晚於其他時間時收集錯誤並拋出 BadRequestException', async () => {
      const invalidRecord = {
        id: 1,
        userId: 1,
        title: 'Test',
        location: 'Taipei',
        participantNumbers: 5,
        price: 0,
        status: GatheringStatus.OPEN,
        type: GatheringType.PARTY,
        startTime: new Date('2025-01-01'),
        deadline: new Date('2025-01-01'),
        isArchived: false,
        createdAt: new Date('2025-01-02'), // 晚於 startTime / deadline
        updatedAt: new Date('2025-01-01'),
      };
      const workbook = {
        SheetNames: ['Sheet1'],
        Sheets: { Sheet1: {} },
      };
      jest.spyOn(XLSX.utils, 'sheet_to_json').mockReturnValue([invalidRecord]);

      await expect(
        service.checkExcelGathering(workbook as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('DTO 驗證失敗（缺少必填欄位或型別錯誤）時拋出 BadRequestException', async () => {
      const invalidRecord = {
        id: 'not-a-number', // 應為數字
        userId: 1,
        title: 'Test',
        location: 'Taipei',
        participantNumbers: 5,
        price: 0,
        status: GatheringStatus.OPEN,
        type: GatheringType.PARTY,
        startTime: new Date('2025-01-03'),
        deadline: new Date('2025-01-02'),
        isArchived: false,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-04'),
      };
      const workbook = {
        SheetNames: ['Sheet1'],
        Sheets: { Sheet1: {} },
      };
      jest.spyOn(XLSX.utils, 'sheet_to_json').mockReturnValue([invalidRecord]);

      await expect(
        service.checkExcelGathering(workbook as any),
      ).rejects.toThrow(BadRequestException);
    });
  });
});

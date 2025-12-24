import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager, EntityRepository, Loaded } from '@mikro-orm/core';
import { getRepositoryToken } from '@mikro-orm/nestjs';

import { GatheringsService } from './gatherings.service';
import { Gathering } from './entities/gathering.entity';
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
    dueDate: null,
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
      dueDate: null,
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
            create: jest.fn(),
            persistAndFlush: jest.fn(),
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
    it('一般使用者只能取得自己的 gatherings', async () => {
      gatheringRepository.count.mockResolvedValue(1);
      gatheringRepository.find.mockResolvedValue([mockGathering()]);

      const result = await service.getGatherings(
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
    });

    it('tags 不是 array 時拋出 BadRequestException', async () => {
      await expect(
        service.getGatherings(
          {
            page: 1,
            limit: 10,
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
  });

  /**
   * ============================
   * getGatheringById
   * ============================
   */
  describe('getGatheringById', () => {
    it('管理員可以取得任何 gathering', async () => {
      entityManager.findOne.mockResolvedValue(mockGathering());

      const result = await service.getGatheringById(1, mockAdmin as any);
      expect(result.gatheringData).toBeDefined();
    });

    it('找不到 gathering 時拋出 NotFoundException', async () => {
      entityManager.findOne.mockResolvedValue(null);

      await expect(
        service.getGatheringById(1, mockUser as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('非本人且非管理員時拋出 ForbiddenException', async () => {
      entityManager.findOne.mockResolvedValue(
        mockGathering({ userId: 999 } as any),
      );

      await expect(
        service.getGatheringById(1, mockUser as any),
      ).rejects.toThrow(ForbiddenException);
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

      expect(entityManager.persistAndFlush).toHaveBeenCalled();
      expect(result.gatheringData).toBe(gathering);
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
    it('成功更新 gathering 與 tags', async () => {
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
      expect(entityManager.persistAndFlush).toHaveBeenCalled();
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

    it('deleteGathering 會將 isArchived 設為 true', async () => {
      const result = await service.deleteGathering(1, mockUser as any);
      expect(result.gatheringData.isArchived).toBe(true);
    });

    it('restoreGathering 會將 isArchived 設為 false', async () => {
      gathering.isArchived = true;
      const result = await service.restoreGathering(1, mockUser as any);
      expect(result.gatheringData.isArchived).toBe(false);
    });

    it('closeGathering 會將 status 設為 CLOSED', async () => {
      const result = await service.closeGathering(1, mockUser as any);
      expect(result.gatheringData.status).toBe(GatheringStatus.CLOSED);
    });
  });
});

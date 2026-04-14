import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { getRepositoryToken } from '@mikro-orm/nestjs';

import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { UserRole } from 'src/users/enum/auth.role';
import { GatheringsService } from 'src/gatherings/gatherings.service';
import { Participant } from 'src/gatherings/entities/participant.entity';
import { ErrorCode } from 'src/common/enum/error-code.enum';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { GetUsersQueryDto } from './dto/get-users-query.dto';
import { JwtPayload } from 'src/auth/strategies/jwt-payload.interface';
import * as jwtPayloadBuilder from 'src/auth/strategies/jwt-payload.builder';
import dayjs from 'dayjs';

/**
 * ============================
 * 共用 Mock 資料
 * ============================
 */

const mockUser: User = {
  id: 1,
  email: 'test@example.com',
  displayName: 'Test User',
  passwordHash: 'hashed_password',
  refreshTokenHash: 'hashed_refresh_token',
  role: UserRole.USER,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-02'),
} as User;

const mockUsers: User[] = [
  mockUser,
  {
    ...mockUser,
    id: 2,
    email: 'user2@example.com',
    displayName: 'User Two',
  } as User,
];

/** 另一位管理員（與 mockUser id 不同，用於角色變更測試的操作者） */
const mockAdminActor: User = {
  ...mockUser,
  id: 2,
  email: 'admin@example.com',
  displayName: 'Admin Actor',
  role: UserRole.ADMIN,
} as User;

/**
 * ============================
 * UsersService
 * ============================
 */

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: jest.Mocked<EntityRepository<User>>;
  let entityManager: jest.Mocked<EntityManager>;
  let gatheringsService: jest.Mocked<
    Pick<GatheringsService, 'queryAndFilterGatherings'>
  >;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            count: jest.fn(),
          },
        },
        {
          provide: EntityManager,
          useValue: {
            persistAndFlush: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: GatheringsService,
          useValue: {
            queryAndFilterGatherings: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(UsersService);
    userRepository = module.get(getRepositoryToken(User));
    entityManager = module.get(EntityManager);
    gatheringsService = module.get(GatheringsService);

    jest.clearAllMocks();
  });

  /**
   * ============================
   * getProfile
   * ============================
   */
  describe('getProfile', () => {
    it('應回傳正確的 JwtPayload 結構', async () => {
      const expectedPayload: JwtPayload = {
        sub: mockUser.id as number,
        email: mockUser.email,
        username: mockUser.displayName,
        role: mockUser.role,
        createdAt: dayjs(mockUser.createdAt).format('YYYY-MM-DD HH:mm:ss'),
        updatedAt: dayjs(mockUser.updatedAt).format('YYYY-MM-DD HH:mm:ss'),
      };

      const spy = jest
        .spyOn(jwtPayloadBuilder, 'buildJwtPayload')
        .mockReturnValue(expectedPayload);

      const result = await service.getProfile(mockUser);

      expect(result).toEqual(expectedPayload);
      expect(spy).toHaveBeenCalledWith(mockUser);
    });
  });

  /**
   * ============================
   * updateUser
   * ============================
   */
  describe('updateUser', () => {
    it('成功更新 displayName 並回傳更新後的 JwtPayload', async () => {
      const dto: UpdateUserDto = {
        displayName: 'Updated Name',
      };

      const expectedPayload: JwtPayload = {
        sub: mockUser.id as number,
        email: mockUser.email,
        username: dto.displayName,
        role: mockUser.role,
        createdAt: dayjs(mockUser.createdAt).format('YYYY-MM-DD HH:mm:ss'),
        updatedAt: dayjs(mockUser.updatedAt).format('YYYY-MM-DD HH:mm:ss'),
      };

      const spy = jest
        .spyOn(jwtPayloadBuilder, 'buildJwtPayload')
        .mockReturnValue(expectedPayload);

      const result = await service.updateUser(dto, mockUser);

      expect(mockUser.displayName).toBe(dto.displayName);
      expect(entityManager.persistAndFlush).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(expectedPayload);
      expect(spy).toHaveBeenCalledWith(mockUser);
    });
  });

  /**
   * ============================
   * updateUserRoleById
   * ============================
   */
  describe('updateUserRoleById', () => {
    it('成功將一般使用者升級為管理員', async () => {
      const target = { ...mockUser, role: UserRole.USER } as User;
      const dto: UpdateUserRoleDto = { role: UserRole.ADMIN };

      userRepository.findOne.mockResolvedValue(target);
      userRepository.count.mockResolvedValue(1);

      const result = await service.updateUserRoleById(1, dto, mockAdminActor);

      expect(target.role).toBe(UserRole.ADMIN);
      expect(entityManager.persistAndFlush).toHaveBeenCalledWith(target);
      expect(result).toBe(target);
    });

    it('角色未變更時不寫入資料庫', async () => {
      const target = { ...mockUser, role: UserRole.USER } as User;
      const dto: UpdateUserRoleDto = { role: UserRole.USER };

      userRepository.findOne.mockResolvedValue(target);

      const result = await service.updateUserRoleById(1, dto, mockAdminActor);

      expect(entityManager.persistAndFlush).not.toHaveBeenCalled();
      expect(result).toBe(target);
    });

    it('有多位管理員時可將其中一位降級為一般使用者', async () => {
      const target = { ...mockUser, role: UserRole.ADMIN } as User;
      const dto: UpdateUserRoleDto = { role: UserRole.USER };

      userRepository.findOne.mockResolvedValue(target);
      userRepository.count.mockResolvedValue(2);

      const result = await service.updateUserRoleById(1, dto, mockAdminActor);

      expect(target.role).toBe(UserRole.USER);
      expect(entityManager.persistAndFlush).toHaveBeenCalledWith(target);
      expect(result).toBe(target);
    });

    it('管理員不可變更自己的角色', async () => {
      const target = { ...mockUser, id: 1, role: UserRole.ADMIN } as User;
      const actor = { ...mockUser, id: 1, role: UserRole.ADMIN } as User;
      const dto: UpdateUserRoleDto = { role: UserRole.USER };

      userRepository.findOne.mockResolvedValue(target);

      await expect(service.updateUserRoleById(1, dto, actor)).rejects.toThrow(
        ForbiddenException,
      );
      expect(entityManager.persistAndFlush).not.toHaveBeenCalled();
    });

    it('僅剩一位管理員時不可降級', async () => {
      const target = { ...mockUser, role: UserRole.ADMIN } as User;
      const dto: UpdateUserRoleDto = { role: UserRole.USER };

      userRepository.findOne.mockResolvedValue(target);
      userRepository.count.mockResolvedValue(1);

      await expect(
        service.updateUserRoleById(1, dto, mockAdminActor),
      ).rejects.toThrow(BadRequestException);
      expect(entityManager.persistAndFlush).not.toHaveBeenCalled();
    });

    it('找不到使用者時拋出 NotFoundException', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateUserRoleById(999, { role: UserRole.ADMIN }, mockAdminActor),
      ).rejects.toThrow(NotFoundException);
    });
  });

  /**
   * ============================
   * updateUserById
   * ============================
   */
  describe('updateUserById', () => {
    it('成功依 id 更新 displayName 並回傳使用者', async () => {
      const target = { ...mockUser } as User;
      const dto: UpdateUserDto = { displayName: 'New Display' };

      userRepository.findOne.mockResolvedValue(target);

      const result = await service.updateUserById(1, dto);

      expect(userRepository.findOne).toHaveBeenCalledWith({ id: 1 });
      expect(target.displayName).toBe(dto.displayName);
      expect(entityManager.persistAndFlush).toHaveBeenCalledWith(target);
      expect(result).toBe(target);
    });

    it('找不到使用者時拋出 NotFoundException', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.updateUserById(999, { displayName: 'x' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  /**
   * ============================
   * getUserById
   * ============================
   */
  describe('getUserById', () => {
    it('成功依 id 取得使用者', async () => {
      const target = { ...mockUser } as User;
      userRepository.findOne.mockResolvedValue(target);

      const result = await service.getUserById(1);

      expect(userRepository.findOne).toHaveBeenCalledWith({ id: 1 });
      expect(result).toBe(target);
    });

    it('找不到使用者時拋出 NotFoundException', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.getUserById(999)).rejects.toThrow(NotFoundException);
    });
  });

  /**
   * ============================
   * getUsers
   * ============================
   */
  describe('getUsers', () => {
    it('成功回傳分頁使用者清單', async () => {
      const queryDto: GetUsersQueryDto = {
        page: 1,
        limit: 10,
      };

      userRepository.find.mockResolvedValue(mockUsers);
      userRepository.count.mockResolvedValue(2);

      const result = await service.getUsers(queryDto);

      expect(userRepository.find).toHaveBeenCalledWith(
        {},
        {
          limit: 10,
          offset: 0,
        },
      );

      expect(userRepository.count).toHaveBeenCalledWith({});

      expect(result).toEqual({
        items: mockUsers,
        page: 1,
        limit: 10,
        total: 2,
      });
    });

    it('沒有任何使用者時回傳空陣列與 total = 0', async () => {
      const queryDto: GetUsersQueryDto = {
        page: 2,
        limit: 10,
      };

      userRepository.find.mockResolvedValue([]);
      userRepository.count.mockResolvedValue(0);

      const result = await service.getUsers(queryDto);

      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.page).toBe(2);
    });
  });

  /**
   * ============================
   * getGatheringsCreatedByUser
   * ============================
   */
  describe('getGatheringsCreatedByUser', () => {
    it('非本人且非管理員時拋出 ForbiddenException', async () => {
      await expect(
        service.getGatheringsCreatedByUser(
          {
            page: 1,
            limit: 10,
            sortBy: 'createdAt',
            sortOrder: 'DESC',
          } as any,
          2,
          mockUser as any,
        ),
      ).rejects.toThrow(
        new ForbiddenException({
          message: "You are not authorized to view this user's gatherings.",
          code: ErrorCode.FORBIDDEN,
        }),
      );
      expect(entityManager.findOne).not.toHaveBeenCalled();
    });

    it('使用者不存在時拋出 NotFoundException', async () => {
      entityManager.findOne.mockResolvedValue(null);

      await expect(
        service.getGatheringsCreatedByUser(
          {
            page: 1,
            limit: 10,
            sortBy: 'createdAt',
            sortOrder: 'DESC',
          } as any,
          42,
          mockAdminActor as any,
        ),
      ).rejects.toThrow(
        new NotFoundException({
          message: 'User with ID "42" not found.',
          code: ErrorCode.NOT_FOUND,
        }),
      );
    });

    it('本人可查詢且套用 userId 條件', async () => {
      const targetUser = { id: 1 };
      entityManager.findOne.mockResolvedValue(targetUser as any);
      gatheringsService.queryAndFilterGatherings.mockResolvedValue({
        gatheringData: [{ id: 99 }] as any,
        page: 1,
        limit: 10,
        total: 1,
      });

      const result = await service.getGatheringsCreatedByUser(
        {
          page: 1,
          limit: 10,
          sortBy: 'createdAt',
          sortOrder: 'DESC',
        } as any,
        1,
        mockUser as any,
      );

      expect(result.gatheringData).toHaveLength(1);
      expect(entityManager.findOne).toHaveBeenCalledWith(User, { id: 1 });
      expect(gatheringsService.queryAndFilterGatherings).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ userId: targetUser }),
      );
    });
  });

  /**
   * ============================
   * getGatheringsParticipatedByUser
   * ============================
   */
  describe('getGatheringsParticipatedByUser', () => {
    it('非本人且非管理員時拋出 ForbiddenException', async () => {
      await expect(
        service.getGatheringsParticipatedByUser(
          {
            page: 1,
            limit: 10,
            sortBy: 'createdAt',
            sortOrder: 'DESC',
          } as any,
          2,
          mockUser as any,
        ),
      ).rejects.toThrow(ForbiddenException);
      expect(entityManager.findOne).not.toHaveBeenCalled();
    });

    it('使用者不存在時拋出 NotFoundException', async () => {
      entityManager.findOne.mockResolvedValue(null);

      await expect(
        service.getGatheringsParticipatedByUser(
          {
            page: 1,
            limit: 10,
            sortBy: 'createdAt',
            sortOrder: 'DESC',
          } as any,
          42,
          mockAdminActor as any,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('無參與紀錄時回傳空陣列', async () => {
      entityManager.findOne.mockResolvedValue({ id: 1 } as any);
      entityManager.find.mockResolvedValue([]);

      const result = await service.getGatheringsParticipatedByUser(
        {
          page: 1,
          limit: 10,
          sortBy: 'createdAt',
          sortOrder: 'DESC',
        } as any,
        1,
        mockUser as any,
      );

      expect(result.gatheringData).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(gatheringsService.queryAndFilterGatherings).not.toHaveBeenCalled();
    });

    it('管理員可查詢他人已參加的活動', async () => {
      entityManager.findOne.mockResolvedValue({ id: 1 } as any);
      const gathering1 = { id: 1 };
      const participant1 = {
        id: 1,
        gathering: gathering1,
      };
      entityManager.find.mockResolvedValue([participant1 as any]);
      gatheringsService.queryAndFilterGatherings.mockResolvedValue({
        gatheringData: [gathering1] as any,
        page: 1,
        limit: 10,
        total: 1,
      });

      const result = await service.getGatheringsParticipatedByUser(
        {
          page: 1,
          limit: 10,
          sortBy: 'createdAt',
          sortOrder: 'DESC',
        } as any,
        1,
        mockAdminActor as any,
      );

      expect(result.gatheringData).toHaveLength(1);
      expect(entityManager.find).toHaveBeenCalledWith(
        Participant,
        { user: 1 },
        { populate: ['gathering'] },
      );
    });
  });
});

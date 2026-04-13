import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { getRepositoryToken } from '@mikro-orm/nestjs';

import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { UserRole } from 'src/users/enum/auth.role';
import { UpdateUserDto } from './dto/update-user.dto';
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

/**
 * ============================
 * UsersService
 * ============================
 */

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: jest.Mocked<EntityRepository<User>>;
  let entityManager: jest.Mocked<EntityManager>;

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
          },
        },
      ],
    }).compile();

    service = module.get(UsersService);
    userRepository = module.get(getRepositoryToken(User));
    entityManager = module.get(EntityManager);

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
});

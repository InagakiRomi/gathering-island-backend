import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

import * as bcrypt from 'bcrypt';

import { AuthService } from './auth.service';
import { JwtConfigHelper } from './strategies/jwt-config.helper';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { AuthLoginDto } from './dto/auth-login.dto';
import { User } from 'src/users/entities/user.entity';
import { UserRole } from 'src/users/enum/auth.role';
import { ErrorCode } from 'src/common/enum/error-code.enum';

/**
 * ============================
 * bcrypt mock（解決 never 問題）
 * ============================
 */
jest.mock('bcrypt', () => ({
  genSalt: jest.fn(),
  hash: jest.fn(),
  compare: jest.fn(),
}));

/**
 * ============================
 * Mock User Factory
 * ============================
 */
const mockUser = (override: Partial<User> = {}): User => {
  const baseUser: User = {
    id: 1,
    email: 'test@example.com',
    passwordHash: 'hashed_password',
    refreshTokenHash: 'hashed_refresh_token',
    displayName: 'Test User',
    role: UserRole.USER,
    createdAt: new Date(),
    updatedAt: new Date(),

    toJSON: function () {
      return {
        ...this,
        createdAt: this.createdAt.toISOString(),
        updatedAt: this.updatedAt.toISOString(),
      };
    },

    ...override,
  };

  return baseUser;
};

/**
 * ============================
 * Mock Request Factory
 * ============================
 */
const mockRequest = (refreshToken?: string): Request =>
  ({
    signedCookies: refreshToken ? { refresh_token: refreshToken } : {},
  }) as unknown as Request;

describe('AuthService', () => {
  let service: AuthService;
  let entityManager: jest.Mocked<EntityManager>;
  let jwtService: jest.Mocked<JwtService>;
  let jwtHelper: jest.Mocked<JwtConfigHelper>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: EntityManager,
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            persistAndFlush: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn<Promise<string>, any[]>(),
          },
        },
        {
          provide: JwtConfigHelper,
          useValue: {
            getRefreshTokenSecret: jest.fn(),
            getRefreshTokenExpiresIn: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get(AuthService);
    entityManager = module.get(EntityManager);
    jwtService = module.get(JwtService);
    jwtHelper = module.get(JwtConfigHelper);

    jest.clearAllMocks();
  });

  /**
   * ============================
   * register
   * ============================
   */
  describe('register', () => {
    it('成功註冊並回傳 jwt payload', async () => {
      const dto: AuthCredentialsDto = {
        email: 'new@example.com',
        password: '123456',
        displayName: 'New User',
      };

      entityManager.findOne.mockResolvedValue(null);
      entityManager.create.mockImplementation((_e, data) => data as any);
      entityManager.persistAndFlush.mockResolvedValue();

      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_pw');

      const result = await service.register(dto);

      expect(result).toMatchObject({
        email: dto.email,
      });

      expect(entityManager.persistAndFlush).toHaveBeenCalled();
    });

    it('email 已存在時拋出 ConflictException（含 error code）', async () => {
      entityManager.findOne.mockResolvedValue(mockUser());

      await expect(
        service.register({
          email: 'test@example.com',
          password: '123456',
          displayName: 'Dup',
        }),
      ).rejects.toThrow(ConflictException);

      await expect(
        service.register({
          email: 'test@example.com',
          password: '123456',
          displayName: 'Dup',
        }),
      ).rejects.toMatchObject({
        response: {
          code: ErrorCode.CONFLICT,
        },
      });
    });
  });

  /**
   * ============================
   * login
   * ============================
   */
  describe('login', () => {
    it('登入成功回傳 access / refresh token', async () => {
      const user = mockUser();
      entityManager.findOne.mockResolvedValue(user);

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      jwtService.signAsync
        .mockResolvedValueOnce('access_token')
        .mockResolvedValueOnce('refresh_token');

      jwtHelper.getRefreshTokenSecret.mockReturnValue('secret');
      jwtHelper.getRefreshTokenExpiresIn.mockReturnValue(604800000);

      const result = await service.login({
        email: user.email,
        password: '123456',
      });

      expect(result.accessToken).toBe('access_token');
      expect(result.refreshToken).toBe('refresh_token');
    });

    it('email 不存在時拋出 NotFoundException', async () => {
      entityManager.findOne.mockResolvedValue(null);

      await expect(
        service.login({ email: 'no@mail.com', password: '123' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('密碼錯誤時拋出 UnauthorizedException（含 error code）', async () => {
      entityManager.findOne.mockResolvedValue(mockUser());
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ email: 'test@example.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  /**
   * ============================
   * refresh
   * ============================
   */
  describe('refresh', () => {
    it('成功刷新 token', async () => {
      const user = mockUser();
      const req = mockRequest('valid_refresh_token');

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      jwtService.signAsync
        .mockResolvedValueOnce('new_access_token')
        .mockResolvedValueOnce('new_refresh_token');

      jwtHelper.getRefreshTokenSecret.mockReturnValue('secret');
      jwtHelper.getRefreshTokenExpiresIn.mockReturnValue(604800000);

      const result = await service.refresh(req, user);

      expect(result.accessToken).toBe('new_access_token');
      expect(result.refreshToken).toBe('new_refresh_token');
    });

    it('缺少 refresh token cookie 時拋 UnauthorizedException', async () => {
      await expect(service.refresh(mockRequest(), mockUser())).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('refresh token 不匹配時拋 UnauthorizedException', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.refresh(mockRequest('bad'), mockUser()),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  /**
   * ============================
   * logout
   * ============================
   */
  describe('logout', () => {
    it('成功清除 refreshTokenHash', async () => {
      const user = mockUser();

      await service.logout(user);

      expect(user.refreshTokenHash).toBe(' ');
      expect(entityManager.persistAndFlush).toHaveBeenCalledWith(user);
    });
  });
});

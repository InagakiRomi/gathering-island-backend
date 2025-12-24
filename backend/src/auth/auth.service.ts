import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Request } from 'express';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { EntityManager } from '@mikro-orm/core';
import { User } from 'src/users/entities/user.entity';
import { UserRole } from '../users/enum/auth.role';
import { JwtService } from '@nestjs/jwt';
import { AuthLoginDto } from './dto/auth-login.dto';
import { buildJwtPayload } from './strategies/jwt-payload.builder';
import { ConfigService } from '@nestjs/config';
import { JwtConfigHelper } from './strategies/jwt-config.helper';
import { ErrorCode } from 'src/common/enum/error-code.enum';
import { JwtPayload } from './strategies/jwt-payload.interface';

/** 帳號 Service */
@Injectable()
export class AuthService {
  constructor(
    private readonly entityManager: EntityManager,
    private readonly jwtHelper: JwtConfigHelper,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * 註冊帳號
   *
   * @param {AuthCredentialsDto} authCredentialsDto 註冊帳號的 DTO
   * @returns {Promise<User>} 回傳填入的註冊資料
   */
  async register(authCredentialsDto: AuthCredentialsDto): Promise<JwtPayload> {
    const { email, password, displayName } = authCredentialsDto;

    const now = new Date();

    // 密碼加鹽
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    // 查資料庫有沒有這個email
    let emailFind = await this.entityManager.findOne(User, { email });

    // 如果 email 已經存在
    if (emailFind) {
      throw new ConflictException({
        message: 'Email already exists',
        code: ErrorCode.CONFLICT,
      });
    }

    // 建立一筆新的 User 資料
    const user = this.entityManager.create(User, {
      email: email,
      passwordHash: hashedPassword,
      refreshTokenHash: ' ',
      displayName,
      role: UserRole.USER,
      createdAt: now,
      updatedAt: now,
    });

    await this.entityManager.persistAndFlush(user);

    // 帳號資料存進 payload 並回傳
    const payload = buildJwtPayload(user);
    return Promise.resolve(payload);
  }

  /**
   * 登入帳號
   *
   * @param {AuthCredentialsDto} authCredentialsDto 登入帳號的 DTO
   * @returns {Promise<{ payload; accessToken: string; refreshToken: string }>} 回傳帳號的資料和 Token
   */
  async login(
    authLoginDto: AuthLoginDto,
  ): Promise<{ payload; accessToken: string; refreshToken: string }> {
    const { email, password } = authLoginDto;

    // 從資料庫找出符合Email的使用者資料
    const user = await this.entityManager.findOne(User, { email });
    if (!user) {
      throw new NotFoundException({
        message: `User with email "${email}" not found`,
        code: ErrorCode.NOT_FOUND,
      });
    }

    // 比對密碼是否符合
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException({
        message: 'Invalid email or password',
        code: ErrorCode.UNAUTHORIZED,
      });
    }

    // 產生並儲存 Tokens
    return this.generateAndStoreTokens(user);
  }

  /**
   * 用 refresh token 換新 access token
   *
   * @param {Request} req HTTP 請求物件，包含簽名的 cookies
   * @param {User} user 取得目前登入的使用者
   * @returns {Promise<{ accessToken: string; refreshToken: string }>} 回傳帳號的 Token
   */
  async refresh(
    req: Request,
    user: User,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    // 檢查 refresh token 是否存在cookie中
    const refreshTokenFromCookie = req.signedCookies['refresh_token'];

    if (!refreshTokenFromCookie) {
      throw new UnauthorizedException({
        message: 'Missing refresh token in cookies',
        code: ErrorCode.UNAUTHORIZED,
      });
    }

    // 確認使用者的 refreshTokenHash 是否存在
    if (!user.refreshTokenHash) {
      throw new NotFoundException({
        message: 'RefreshTokenHash not found.',
        code: ErrorCode.NOT_FOUND,
      });
    }

    // 檢查 refresh token 是否是伺服器記錄中的最新版
    const isMatch = await bcrypt.compare(
      refreshTokenFromCookie,
      user.refreshTokenHash,
    );

    if (!isMatch) {
      throw new UnauthorizedException({
        message: 'Invalid refresh token',
        code: ErrorCode.UNAUTHORIZED,
      });
    }

    // 產生並儲存新的 Token
    const { accessToken, refreshToken } =
      await this.generateAndStoreTokens(user);

    // 回傳新的 accessToken 與 refreshToken 給前端
    return { accessToken, refreshToken };
  }

  /**
   * 登出使用者
   *
   * @param {User} user 取得目前登入的使用者
   */
  async logout(user: User): Promise<void> {
    // 清除資料庫中的 hashed refresh token
    user.refreshTokenHash = ' ';
    await this.entityManager.persistAndFlush(user);
  }

  /**
   * 建立 access token 與 refresh token
   *
   * @param {User} user - 取得目前登入的使用者
   * @returns {Promise<{ payload; accessToken: string; refreshToken: string }>} 回傳帳號的資料和 Token
   */
  private async generateAndStoreTokens(user: User): Promise<{
    payload;
    accessToken: string;
    refreshToken: string;
  }> {
    // 產生 JWT Payload
    const payload = buildJwtPayload(user);

    // 使用 JwtService 建立 access token
    const accessToken: string = await this.jwtService.signAsync(payload);

    // 建立 refresh token
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.jwtHelper.getRefreshTokenSecret(),
      expiresIn: this.jwtHelper.getRefreshTokenExpiresIn(),
    });

    // Refresh Token 加鹽與雜湊處理
    const salt = await bcrypt.genSalt();
    const hashedRefreshToken = await bcrypt.hash(refreshToken, salt);

    // 儲存 hashed refresh token 到資料庫
    user.refreshTokenHash = hashedRefreshToken;
    await this.entityManager.persistAndFlush(user);

    return { payload, accessToken, refreshToken };
  }
}

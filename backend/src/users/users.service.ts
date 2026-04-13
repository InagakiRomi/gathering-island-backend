import { Injectable, NotFoundException } from '@nestjs/common';
import { JwtPayload } from 'src/auth/strategies/jwt-payload.interface';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { buildJwtPayload } from 'src/auth/strategies/jwt-payload.builder';
import { GetUsersQueryDto } from './dto/get-users-query.dto';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { ErrorCode } from 'src/common/enum/error-code.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: EntityRepository<User>,
    private readonly entityManager: EntityManager,
  ) {}

  /**
   * 取得登入中的帳號的個人資訊
   *
   * @param {User} user 取得目前登入的使用者
   * @returns {Promise<User>} 回傳帳戶資料
   */
  getProfile(user: User): Promise<JwtPayload> {
    const payload = buildJwtPayload(user);
    return Promise.resolve(payload);
  }

  /**
   * 更新登入中帳號的個人名稱
   *
   * @param {UpdateProfileDto} updateProfileDto 從請求的 body 中取得更新後的名稱欄位
   * @param {User} user 取得目前登入的使用者
   * @returns {Promise<JwtPayload>} 回傳帳戶資料
   */
  async updateUser(
    updateUserDto: UpdateUserDto,
    user: User,
  ): Promise<JwtPayload> {
    // 取得更新後的顯示名稱
    const { displayName } = updateUserDto;

    // 更新使用者的顯示名稱
    user.displayName = displayName;

    // 儲存更新後的使用者資料
    await this.entityManager.persistAndFlush(user);

    // 建立並回傳更新後的 Payload
    const payload = buildJwtPayload(user);
    return Promise.resolve(payload);
  }

  /**
   * 管理員依 ID 更新使用者顯示名稱
   *
   * @param {number} id 使用者主鍵
   * @param {UpdateUserDto} updateUserDto 更新欄位
   * @returns {Promise<User>} 更新後的使用者實體
   * @throws {NotFoundException} 找不到指定 id 時
   */
  async updateUserById(
    id: number,
    updateUserDto: UpdateUserDto,
  ): Promise<User> {
    const user = await this.userRepository.findOne({ id });

    if (!user) {
      throw new NotFoundException({
        message: `User with id ${id} not found.`,
        code: ErrorCode.NOT_FOUND,
      });
    }

    if (updateUserDto.displayName !== undefined) {
      user.displayName = updateUserDto.displayName;
    }

    await this.entityManager.persistAndFlush(user);

    return user;
  }

  /**
   * 管理員依 ID 取得單一使用者
   *
   * @param {number} id 使用者主鍵
   * @returns {Promise<User>} 使用者實體
   * @throws {NotFoundException} 找不到指定 id 時
   */
  async getUserById(id: number): Promise<User> {
    const user = await this.userRepository.findOne({ id });

    if (!user) {
      throw new NotFoundException({
        message: `User with id ${id} not found.`,
        code: ErrorCode.NOT_FOUND,
      });
    }

    return user;
  }

  /**
   * 分頁列出所有使用者
   *
   * @param {GetUsersQueryDto} queryDto 查詢參數 DTO
   * @returns {Promise<{ items: User[]; page: number; limit: number; total: number }>} 回傳搜尋結果
   */
  async getUsers(
    queryDto: GetUsersQueryDto,
  ): Promise<{ items: User[]; page: number; limit: number; total: number }> {
    const { page, limit } = queryDto;

    // 建立查詢條件物件
    const query: any = {};

    // 撈取使用者資料
    const users = await this.userRepository.find(query, {
      limit,
      offset: (page - 1) * limit,
    });

    // 計算撈出的資料數量
    const total = await this.userRepository.count(query);

    return { items: users, page, limit, total };
  }
}

import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { User } from './entities/user.entity';
import { JwtPayload } from '../auth/strategies/jwt-payload.interface';
import { GetUser } from '../auth/decorator/get-user.decorator';
import { UpdateUserDto } from './dto/update-user.dto';
import { GetUsersQueryDto } from './dto/get-users-query.dto';
import { Roles } from 'src/common/decorators/roles.decorator';

/** 使用者 Controller */
@ApiBearerAuth('access-token')
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  /**
   * 取得登入中的帳號的個人資訊
   *
   * @param {User} user 取得目前登入的使用者
   * @returns {Promise<JwtPayload>} 回傳帳戶資料
   */
  @Get('/me')
  @ApiOperation({
    summary: '取得登入中的帳號的個人資訊',
    description: '根據登入帳號查詢對應的帳戶資訊，成功後回傳帳號基本資料。',
  })
  getProfile(@GetUser() user: User): Promise<JwtPayload> {
    return this.usersService.getProfile(user);
  }

  /**
   * 更新登入中帳號的個人名稱
   *
   * @param {UpdateProfileDto} updateProfileDto 從請求的 body 中取得更新後的名稱欄位
   * @param {User} user 取得目前登入的使用者
   * @returns {Promise<JwtPayload>} 回傳帳戶資料
   */
  @Patch('/me')
  @ApiOperation({
    summary: '更新登入中帳號的個人名稱',
    description: '根據登入帳號更新使用者的名稱，成功後回傳更新後的帳戶資訊。',
  })
  updateUser(
    @Body() updateUserDto: UpdateUserDto,
    @GetUser() user: User,
  ): Promise<JwtPayload> {
    return this.usersService.updateUser(updateUserDto, user);
  }

  /**
   * 分頁列出所有使用者
   *
   * @param {GetUsersQueryDto} queryDto 查詢參數 DTO
   * @returns {Promise<{ items: User[]; page: number; limit: number; total: number }>} 回傳搜尋結果
   */
  @Get()
  @Roles('admin')
  @ApiOperation({
    summary: '查詢所有使用者資料',
    description: '分頁列出所有使用者的基本資料。',
  })
  getUsers(
    @Query() queryDto: GetUsersQueryDto,
  ): Promise<{ items: User[]; page: number; limit: number; total: number }> {
    return this.usersService.getUsers(queryDto);
  }

  /**
   * 管理員依 ID 更新使用者名稱
   *
   * @param {number} id 使用者主鍵
   * @param {UpdateUserDto} updateUserDto 更新內容
   * @returns {Promise<User>} 更新後的使用者資料
   */
  @Patch(':id')
  @Roles('admin')
  @ApiOperation({
    summary: '管理員更新指定使用者名稱',
    description: '依使用者 ID 更新 displayName，僅管理員可用。',
  })
  updateUserById(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return this.usersService.updateUserById(id, updateUserDto);
  }
}

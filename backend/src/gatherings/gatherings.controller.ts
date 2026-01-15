import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { GatheringsService } from './gatherings.service';
import { Gathering } from './entities/gathering.entity';
import { Participant } from './entities/participant.entity';
import { CreateGatheringDto } from './dto/create-gathering-dto';
import { UpdateGatheringDto } from './dto/update-gathering-dto';
import { GetGatheringsQueryDto } from './dto/get-gatherings-query.dto';
import { ApiBearerAuth, ApiBody, ApiOperation } from '@nestjs/swagger';
import { User } from 'src/users/entities/user.entity';
import { GetUser } from 'src/auth/decorator/get-user.decorator';

/** 聚會 Controller */
@ApiBearerAuth('access-token')
@Controller('gatherings')
export class GatheringsController {
  private logger = new Logger('GatheringsController');
  // 把 GatheringsService 注入進來
  constructor(private gatheringsService: GatheringsService) {}

  /**
   * 查詢已有聚會
   *
   * @param {GetGatheringsQueryDto} queryDto 查詢參數 DTO
   * @returns {Promise<{ items: Gathering[]; page: number; limit: number; total: number }>} 回傳搜尋結果
   */
  @Get()
  @ApiOperation({
    summary: '查詢聚會列表',
    description: '根據查詢參數（如狀態、關鍵字等）來取得目前的聚會清單',
  })
  getGatherings(@Query() queryDto: GetGatheringsQueryDto): Promise<{
    gatheringData: Gathering[];
    page: number;
    limit: number;
    total: number;
  }> {
    return this.gatheringsService.getGatherings(queryDto);
  }

  /**
   * 取得目前登入使用者創建的聚會
   *
   * @param {GetGatheringsQueryDto} queryDto 查詢參數 DTO
   * @param {User} user 取得目前登入的使用者
   * @returns {Promise<{ items: Gathering[]; page: number; limit: number; total: number }>} 回傳搜尋結果
   */
  @Get('my')
  @ApiOperation({
    summary: '取得目前登入使用者創建的聚會',
    description:
      '取得目前登入使用者所建立的所有聚會，管理員可查看所有使用者的聚會',
  })
  getMyGatherings(
    @Query() queryDto: GetGatheringsQueryDto,
    @GetUser() user: User,
  ): Promise<{
    gatheringData: Gathering[];
    page: number;
    limit: number;
    total: number;
  }> {
    return this.gatheringsService.getMyGatherings(queryDto, user);
  }

  /**
   * 取得目前登入使用者已參加的活動
   *
   * @param {GetGatheringsQueryDto} queryDto 查詢參數 DTO
   * @param {User} user 取得目前登入的使用者
   * @returns {Promise<{ gatheringData: Gathering[]; page: number; limit: number; total: number }>} 回傳搜尋結果
   */
  @Get('participated')
  @ApiOperation({
    summary: '查詢已參加的活動',
    description: '取得目前登入使用者已報名參加的所有活動清單',
  })
  getParticipatedGatherings(
    @Query() queryDto: GetGatheringsQueryDto,
    @GetUser() user: User,
  ): Promise<{
    gatheringData: Gathering[];
    page: number;
    limit: number;
    total: number;
  }> {
    return this.gatheringsService.getParticipatedGatherings(queryDto, user);
  }

  /**
   * 取得指定 id 的聚會
   *
   * @param {number} id 聚會 ID
   * @returns {Promise<{ gatheringData: Gathering }>} 回傳某id的聚會資料
   */
  @Get('/:id')
  @ApiOperation({
    summary: '取得單筆聚會',
    description: '透過指定的聚會 ID，取得該筆聚會的詳細資料',
  })
  getGatheringById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ gatheringData: Gathering }> {
    return this.gatheringsService.getGatheringById(id);
  }

  /**
   * 建立聚會
   *
   * @param {CreateGatheringDto} createGatheringDto 建立聚會的 DTO
   * @param {User} user 取得目前登入的使用者
   * @returns {Promise<{ gatheringData: Gathering }>} 回傳填入的聚會資料
   */
  @Post()
  @ApiOperation({
    summary: '新增聚會',
    description: '建立一筆新的聚會，並回傳建立成功的資料',
  })
  @ApiBody({
    type: CreateGatheringDto,
    examples: {
      only: {
        value: {
          title: '游泳活動',
          description: '週末一起去游泳吧！僅限定成年人參加',
          location: '市立游泳池',
          participantNumbers: 20,
          price: 300,
          type: 'SPORTS',
          startTime: '2026-12-05 14:00:00',
          deadline: '2026-12-09 18:00:00',
          tags: ['游泳'],
        },
      },
    },
  })
  createGathering(
    @Body() createGatheringDto: CreateGatheringDto,
    @GetUser() user: User,
  ): Promise<{ gatheringData: Gathering }> {
    this.logger.verbose(
      `User "${user.displayName}" creating a new task. Data: ${JSON.stringify(createGatheringDto)}`,
    );
    // 呼叫 service 的方法，並把 DTO 傳進去
    return this.gatheringsService.createGathering(createGatheringDto, user);
  }

  /**
   * 更新聚會的資料
   *
   * @param {number} id 聚會 ID
   * @param {UpdateGatheringDto} updateGatheringDto 從請求的 body 中取得聚會欄位
   * @param {User} user 取得目前登入的使用者
   * @returns {Promise<{ gatheringData: Gathering }>} 回傳填入的聚會資料
   */
  @Patch('/:id')
  @ApiOperation({
    summary: '更新聚會',
    description: '根據指定的 ID，更新該筆聚會的欄位內容',
  })
  @ApiBody({
    type: UpdateGatheringDto,
    examples: {
      only: {
        value: {
          title: '桌遊聚會',
          description: '週末一起來玩桌遊吧！歡迎新手加入',
          location: '社區活動中心',
          participantNumbers: 15,
          price: 0,
          status: 'OPEN',
          type: 'GAME',
          startTime: '2026-09-20 10:00:00',
          deadline: '2026-09-18 14:00:00',
          tags: ['桌遊'],
        },
      },
    },
  })
  updateGathering(
    @Param('id', ParseIntPipe) id: number, // 從網址中的 :id 取得聚會 ID
    @Body() updateGatheringDto: UpdateGatheringDto,
    @GetUser() user: User,
  ): Promise<{ gatheringData: Gathering }> {
    // 呼叫 Service 的方法，更新指定聚會的資料
    return this.gatheringsService.updateGathering(id, updateGatheringDto, user);
  }

  /**
   * 軟刪除聚會
   *
   * @param {number} id 聚會 ID
   * @param {User} user 取得目前登入的使用者
   * @returns {Promise<{ gatheringData: Gathering }>} 回傳填入的聚會資料
   */
  @Delete(':id')
  @ApiOperation({
    summary: '刪除聚會（軟刪除）',
    description: '使用聚會 ID 將該筆資料標記為已刪除（不會實際刪除資料）',
  })
  deleteGathering(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: User,
  ): Promise<{ gatheringData: Gathering }> {
    return this.gatheringsService.deleteGathering(id, user);
  }

  /**
   * 恢復刪除聚會
   *
   * @param {number} id 聚會 ID
   * @param {User} user 取得目前登入的使用者
   * @returns {Promise<{ gatheringData: Gathering }>} 回傳填入的聚會資料
   */
  @Post(':id/restore')
  @ApiOperation({
    summary: '恢復刪除的聚會',
    description: '透過 ID 恢復先前軟刪除的聚會資料',
  })
  restoreGathering(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: User,
  ): Promise<{ gatheringData: Gathering }> {
    return this.gatheringsService.restoreGathering(id, user);
  }

  /**
   * 將聚會狀態設為 close
   *
   * @param {number} id 聚會 ID
   * @param {User} user 取得目前登入的使用者
   * @returns {Promise<{ gatheringData: Gathering }>} 回傳填入的聚會資料
   */
  @Post(':id/close')
  @ApiOperation({
    summary: '設為已結束',
    description: '透過 ID 將指定的聚會標記為結束狀態',
  })
  closeGathering(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: User,
  ): Promise<{ gatheringData: Gathering }> {
    return this.gatheringsService.closeGathering(id, user);
  }

  /**
   * 報名參加活動
   *
   * @param {number} id 活動 ID
   * @param {User} user 取得目前登入的使用者
   * @returns {Promise<{ participantData: Participant }>} 回傳報名資料
   */
  @Post(':id/join')
  @ApiOperation({
    summary: '報名參加活動',
    description:
      '報名參加指定的活動，系統會檢查活動狀態、報名截止日期和參與人數上限',
  })
  joinGathering(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: User,
  ): Promise<{ participantData: Participant }> {
    this.logger.verbose(
      `User "${user.displayName}" joining gathering with ID: ${id}`,
    );
    return this.gatheringsService.joinGathering(id, user);
  }

  /**
   * 取消報名活動
   *
   * @param {number} id 活動 ID
   * @param {User} user 取得目前登入的使用者
   * @returns {Promise<{ message: string }>} 回傳成功訊息
   */
  @Delete(':id/leave')
  @ApiOperation({
    summary: '取消報名活動',
    description: '取消已報名的活動，系統會檢查使用者是否已報名該活動',
  })
  leaveGathering(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: User,
  ): Promise<{ message: string }> {
    this.logger.verbose(
      `User "${user.displayName}" leaving gathering with ID: ${id}`,
    );
    return this.gatheringsService.leaveGathering(id, user);
  }
}

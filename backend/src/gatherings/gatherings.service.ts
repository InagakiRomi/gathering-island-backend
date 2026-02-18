import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager, EntityRepository } from '@mikro-orm/core';
import * as XLSX from 'xlsx';
import { WorkBook } from 'xlsx';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Gathering } from './entities/gathering.entity';
import { CreateGatheringDto } from './dto/create-gathering.dto';
import { UpdateGatheringDto } from './dto/update-gathering.dto';
import { GatheringStatus } from './enum/gathering.status';
import { GatheringType } from './enum/gathering.type';
import { TagsService } from '../tags/tags.service';
import { GetGatheringsQueryDto } from './dto/get-gatherings-query.dto';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Tag } from '../tags/entities/tag.entity';
import { User } from 'src/users/entities/user.entity';
import { UserRole } from 'src/users/enum/auth.role';
import { ErrorCode } from 'src/common/enum/error-code.enum';
import { Participant } from './entities/participant.entity';
import { ConflictException } from '@nestjs/common';
import { ImportGatheringExcelDto } from './dto/import-gathering-excel.dto';

/** 聚會 Service */
@Injectable()
export class GatheringsService {
  private logger = new Logger('GatheringsService');
  constructor(
    @InjectRepository(Gathering)
    private readonly gatheringRepository: EntityRepository<Gathering>,
    // 把 EntityManager 注入進來且不能覆寫
    private readonly entityManager: EntityManager,
    private tagsService: TagsService,
  ) {}

  /**
   * 統一的查詢、篩選、排序和分頁邏輯
   *
   * @param {GetGatheringsQueryDto} queryDto 查詢參數 DTO
   * @param {any} baseQuery 基礎查詢條件
   * @returns {Promise<{ gatheringData: Gathering[]; page: number; limit: number; total: number }>} 回傳搜尋結果
   */
  private async queryAndFilterGatherings(
    queryDto: GetGatheringsQueryDto,
    baseQuery: any = {},
  ): Promise<{
    gatheringData: Gathering[];
    page: number;
    limit: number;
    total: number;
  }> {
    const {
      page,
      limit,
      sortBy,
      sortOrder,
      status,
      type,
      isArchived,
      search,
      tags,
    } = queryDto;

    // 建立查詢條件物件，合併基礎查詢條件
    const query: any = { ...baseQuery };

    // 根據動態計算的狀態進行篩選（如果用戶傳入了 status 參數）
    if (status) {
      query.status = status;
    }

    // 根據聚會分類篩選
    if (type) {
      query.type = type;
    }

    // 根據封存狀態篩選
    if (typeof isArchived === 'boolean') {
      query.isArchived = isArchived;
    }

    // 根據關鍵字模糊搜尋 title 或 description（不區分大小寫）
    if (search?.trim()) {
      query.$or = [
        { title: { $like: `%${search}%` } },
        { description: { $like: `%${search}%` } },
      ];
    }

    // 保證 tags 是陣列格式，如果不是就報錯
    if (tags && !Array.isArray(tags)) {
      this.logger.warn(
        `The 'tags' field is not an array. Received: ${JSON.stringify(tags)}`,
      );

      throw new BadRequestException({
        message: `The 'tags' field must be an array.`,
        code: ErrorCode.BAD_REQUEST,
      });
    }

    // 查詢所有資料並載入關聯 tags（不分頁，用於計算總數和 tags 篩選）
    let allGatherings = await this.gatheringRepository.find(query, {
      populate: ['tags'],
    });

    // 動態計算並更新狀態（不寫入資料庫，僅在記憶體中計算）
    const now = new Date();
    allGatherings.forEach((gathering) => {
      const calculatedStatus = gathering.calculateStatus(now);
      // 臨時更新狀態用於後續過濾和返回，但不持久化到資料庫
      (gathering as any).status = calculatedStatus;
    });

    // 標籤篩選
    if (Array.isArray(tags) && tags.length > 0) {
      allGatherings = allGatherings.filter((gathering) => {
        // 把每個陣列轉成字串
        const tagNames = gathering.tags.map((tag) => tag.tagName);

        // 回傳篩選過後的項目
        return tags.every((tag) => new Set(tagNames).has(tag));
      });
    }

    // 計算過濾後的總數
    const total = allGatherings.length;

    // 排序並分頁
    const sortedGatherings = allGatherings.sort((a, b) => {
      const aValue = (a as any)[sortBy];
      const bValue = (b as any)[sortBy];
      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return sortOrder.toLowerCase() === 'desc' ? -comparison : comparison;
    });

    const gatherings = sortedGatherings.slice((page - 1) * limit, page * limit);

    return { gatheringData: gatherings, page, limit, total };
  }

  /**
   * 查詢已有聚會
   *
   * @param {GetGatheringsQueryDto} queryDto 查詢參數 DTO
   * @returns {Promise<{ gatheringData: Gathering }>} 回傳搜尋結果
   */
  async getGatherings(queryDto: GetGatheringsQueryDto): Promise<{
    gatheringData: Gathering[];
    page: number;
    limit: number;
    total: number;
  }> {
    return this.queryAndFilterGatherings(queryDto);
  }

  /**
   * 取得目前登入使用者創建的聚會
   *
   * @param {GetGatheringsQueryDto} queryDto 查詢參數 DTO
   * @param {User} user 取得目前登入的使用者
   * @returns {Promise<{ gatheringData: Gathering }>} 回傳搜尋結果
   */
  async getMyGatherings(
    queryDto: GetGatheringsQueryDto,
    user: User,
  ): Promise<{
    gatheringData: Gathering[];
    page: number;
    limit: number;
    total: number;
  }> {
    // 建立基礎查詢條件
    const baseQuery: any = {};

    // 一般使用者只能看到自己的 gathering
    if (user.role !== UserRole.ADMIN) {
      baseQuery.userId = user;
    }

    return this.queryAndFilterGatherings(queryDto, baseQuery);
  }

  /**
   * 取得指定 id 的聚會
   *
   * @param {number} id 聚會 ID
   * @returns {Promise<{ gatheringData: Gathering }>} 回傳某id的聚會資料
   * @throws {NotFoundException} 若找不到指定id則拋出錯誤
   * @throws {BadRequestException} 若 ID 無效則拋出錯誤
   */
  async getGatheringById(id: number): Promise<{ gatheringData: Gathering }> {
    // 驗證 ID 是否為有效數字
    if (!id || isNaN(id) || id <= 0 || !Number.isInteger(id)) {
      throw new BadRequestException({
        message: `Invalid gathering ID: "${id}". ID must be a positive integer.`,
        code: ErrorCode.BAD_REQUEST,
      });
    }

    // 查資料庫有沒有這個聚會
    const found = await this.entityManager.findOne(Gathering, id, {
      populate: ['tags'],
    });

    // 如果沒有跳出錯誤
    if (!found) {
      throw new NotFoundException({
        message: `Gathering with ID "${id}" not found.`,
        code: ErrorCode.NOT_FOUND,
      });
    }

    // 動態計算並更新狀態（不寫入資料庫，僅在返回時顯示）
    const now = new Date();
    const calculatedStatus = found.calculateStatus(now);
    (found as any).status = calculatedStatus;

    return { gatheringData: found };
  }

  /**
   * 建立聚會
   *
   * @param {CreateGatheringDto} createGatheringDto 建立聚會的 DTO
   * @param {User} user 取得目前登入的使用者
   * @returns {Promise<{ gatheringData: Gathering }>} 回傳填入的聚會資料
   */
  async createGathering(
    createGatheringDto: CreateGatheringDto,
    user: User,
  ): Promise<{ gatheringData: Gathering }> {
    // 從 DTO 中把需要的欄位解構出來
    const {
      title,
      description,
      location,
      participantNumbers,
      price,
      type,
      startTime,
      deadline,
      tags,
    } = createGatheringDto;

    const now = new Date();

    // 檢查使用者 id 是否存在
    if (!user.id) {
      throw new BadRequestException({
        message: 'User ID is missing.',
        code: ErrorCode.BAD_REQUEST,
      });
    }

    // 驗證 startTime 不能小於現在時間
    if (new Date(startTime) < now) {
      throw new BadRequestException({
        message: 'Start time cannot be earlier than the current time.',
        code: ErrorCode.BAD_REQUEST,
      });
    }

    // 驗證 deadline 不能大於 startTime
    if (new Date(deadline) > new Date(startTime)) {
      throw new BadRequestException({
        message: 'Dead line cannot be earlier than the start time.',
        code: ErrorCode.BAD_REQUEST,
      });
    }

    // 建立一筆新的 Gathering 資料
    const gathering = this.entityManager.create(Gathering, {
      userId: user.id,
      title,
      description: description ?? null,
      location,
      participantNumbers,
      price,
      status: GatheringStatus.OPEN,
      type: type ?? GatheringType.PARTY,
      startTime: startTime,
      deadline: deadline ?? null,
      isArchived: false,
      createdAt: now,
      updatedAt: now,
    });

    // 建立 Tags 資料
    if (tags && tags.length > 0) {
      const tagEntities: Tag[] = [];
      for (const tagName of tags) {
        const tag = await this.tagsService.findOrCreateTag({ tagName });
        tagEntities.push(tag);
      }
      // 建立多對多關聯
      gathering.tags.set(tagEntities);
    }

    // 把新的聚會存進資料庫
    await this.entityManager.persistAndFlush(gathering);
    return { gatheringData: gathering };
  }

  /**
   * 更新聚會的資料
   *
   * @param {number} id 聚會 ID
   * @param {UpdateGatheringDto} updateGatheringDto 從請求的 body 中取得聚會欄位
   * @param {User} user 取得目前登入的使用者
   * @returns {Promise<{ gatheringData: Gathering }>} 回傳填入的聚會資料
   * @throws {ForbiddenException} 若使用者無權限則拋出錯誤
   * @throws {BadRequestException} 若活動已關閉、進行中或已封存則拋出錯誤
   */
  async updateGathering(
    id: number,
    updateGatheringDto: UpdateGatheringDto,
    user: User,
  ): Promise<{ gatheringData: Gathering }> {
    // 先取得聚會（如果找不到會自動丟錯）
    const { gatheringData } = await this.getGatheringById(id);

    // 檢查使用者權限（只有本人或管理員可以更新）
    if (user.role !== UserRole.ADMIN && user.id !== gatheringData.userId) {
      throw new ForbiddenException({
        message: 'You are not authorized to update this gathering.',
        code: ErrorCode.FORBIDDEN,
      });
    }

    // 檢查活動是否已封存
    if (gatheringData.isArchived) {
      throw new BadRequestException({
        message: 'Cannot update archived gatherings.',
        code: ErrorCode.BAD_REQUEST,
      });
    }

    // 檢查活動狀態是否為關閉或進行中（UPCOMING）
    if (gatheringData.status === GatheringStatus.CLOSED) {
      throw new BadRequestException({
        message: 'Cannot update closed gatherings.',
        code: ErrorCode.BAD_REQUEST,
      });
    }

    if (gatheringData.status === GatheringStatus.UPCOMING) {
      throw new BadRequestException({
        message: 'Cannot update gatherings in progress.',
        code: ErrorCode.BAD_REQUEST,
      });
    }

    // 使用partial update
    for (let gatheringDto in updateGatheringDto) {
      const gatheringValue = updateGatheringDto[gatheringDto];
      if (gatheringValue) {
        if (gatheringDto === 'tags') {
          const tagEntities: Tag[] = [];
          for (const tagName of updateGatheringDto.tags) {
            const tag = await this.tagsService.findOrCreateTag({ tagName });
            tagEntities.push(tag);
          }
          // 建立多對多關聯
          gatheringData.tags.set(tagEntities);
        } else {
          (gatheringData as any)[gatheringDto] = gatheringValue;
        }
      }
    }

    await this.entityManager.persistAndFlush(gatheringData);
    return { gatheringData: gatheringData };
  }

  /**
   * 軟刪除聚會
   *
   * @param {number} id 聚會 ID
   * @param {User} user 取得目前登入的使用者
   * @returns {Promise<{ gatheringData: Gathering }>} 回傳填入的聚會資料
   * @throws {NotFoundException} 若找不到指定id則拋出錯誤
   */
  async deleteGathering(
    id: number,
    user: User,
  ): Promise<{ gatheringData: Gathering }> {
    const { gatheringData } = await this.getGatheringById(id);

    // 檢查使用者權限（只有本人或管理員可以刪除）
    if (user.role !== UserRole.ADMIN && user.id !== gatheringData.userId) {
      throw new ForbiddenException({
        message: 'You are not authorized to delete this gathering.',
        code: ErrorCode.FORBIDDEN,
      });
    }

    gatheringData.isArchived = true;
    await this.entityManager.persistAndFlush(gatheringData);
    return { gatheringData: gatheringData };
  }

  /**
   * 恢復刪除聚會
   *
   * @param {number} id 聚會 ID
   * @param {User} user 取得目前登入的使用者
   * @returns {Promise<{ gatheringData: Gathering }>} 回傳填入的聚會資料
   */
  async restoreGathering(
    id: number,
    user: User,
  ): Promise<{ gatheringData: Gathering }> {
    const { gatheringData } = await this.getGatheringById(id);

    // 檢查使用者權限（只有本人或管理員可以恢復）
    if (user.role !== UserRole.ADMIN && user.id !== gatheringData.userId) {
      throw new ForbiddenException({
        message: 'You are not authorized to restore this gathering.',
        code: ErrorCode.FORBIDDEN,
      });
    }

    gatheringData.isArchived = false;
    await this.entityManager.persistAndFlush(gatheringData);
    return { gatheringData: gatheringData };
  }

  /**
   * 將聚會狀態設為 close
   *
   * @param {number} id 聚會 ID
   * @param {User} user 取得目前登入的使用者
   * @returns {Promise<{ gatheringData: Gathering }>} 回傳填入的聚會資料
   */
  async closeGathering(
    id: number,
    user: User,
  ): Promise<{ gatheringData: Gathering }> {
    const { gatheringData } = await this.getGatheringById(id);

    // 檢查使用者權限（只有本人或管理員可以關閉）
    if (user.role !== UserRole.ADMIN && user.id !== gatheringData.userId) {
      throw new ForbiddenException({
        message: 'You are not authorized to close this gathering.',
        code: ErrorCode.FORBIDDEN,
      });
    }

    gatheringData.status = GatheringStatus.CLOSED;
    await this.entityManager.persistAndFlush(gatheringData);
    return { gatheringData: gatheringData };
  }

  /**
   * 報名參加活動
   *
   * @param {number} gatheringId 活動 ID
   * @param {User} user 取得目前登入的使用者
   * @returns {Promise<{ participantData: Participant }>} 回傳報名資料
   * @throws {NotFoundException} 若找不到指定活動則拋出錯誤
   * @throws {ConflictException} 若已經報名過則拋出錯誤
   * @throws {BadRequestException} 若活動已關閉、已過期或已達人數上限則拋出錯誤
   */
  async joinGathering(
    gatheringId: number,
    user: User,
  ): Promise<{ participantData: Participant }> {
    // 檢查使用者 id 是否存在
    if (!user.id) {
      throw new BadRequestException({
        message: 'User ID is missing.',
        code: ErrorCode.BAD_REQUEST,
      });
    }

    // 取得活動資料
    const { gatheringData } = await this.getGatheringById(gatheringId);

    // 檢查活動是否已封存
    if (gatheringData.isArchived) {
      throw new BadRequestException({
        message: 'This gathering has been archived.',
        code: ErrorCode.BAD_REQUEST,
      });
    }

    // 檢查活動狀態是否為關閉
    if (gatheringData.status === GatheringStatus.CLOSED) {
      throw new BadRequestException({
        message: 'This gathering is already closed.',
        code: ErrorCode.BAD_REQUEST,
      });
    }

    // 檢查報名截止日期
    const now = new Date();
    if (gatheringData.deadline && new Date(gatheringData.deadline) < now) {
      throw new BadRequestException({
        message: 'The registration deadline has passed.',
        code: ErrorCode.BAD_REQUEST,
      });
    }

    // 檢查是否已經報名過
    const existingParticipant = await this.entityManager.findOne(Participant, {
      gathering: gatheringData.id,
      user: user.id,
    });

    if (existingParticipant) {
      throw new ConflictException({
        message: 'You have already joined this gathering.',
        code: ErrorCode.CONFLICT,
      });
    }

    // 檢查是否為活動創建者（創建者不需要報名）
    if (gatheringData.userId === user.id) {
      throw new BadRequestException({
        message:
          'You are the creator of this gathering and cannot join as a participant.',
        code: ErrorCode.BAD_REQUEST,
      });
    }

    // 計算目前參與人數
    const currentParticipantCount = await this.entityManager.count(
      Participant,
      { gathering: gatheringData.id },
    );

    // 檢查是否已達人數上限
    if (currentParticipantCount >= gatheringData.participantNumbers) {
      throw new BadRequestException({
        message:
          'This gathering has reached the maximum number of participants.',
        code: ErrorCode.BAD_REQUEST,
      });
    }

    // 建立參與者記錄
    const participant = this.entityManager.create(Participant, {
      gathering: gatheringData,
      user: user,
      joinedAt: now,
    });

    await this.entityManager.persistAndFlush(participant);
    return { participantData: participant };
  }

  /**
   * 取消報名活動
   *
   * @param {number} gatheringId 活動 ID
   * @param {User} user 取得目前登入的使用者
   * @returns {Promise<{ message: string }>} 回傳成功訊息
   * @throws {NotFoundException} 若找不到指定活動則拋出錯誤
   * @throws {BadRequestException} 若尚未報名、活動已關閉或活動進行中則拋出錯誤
   */
  async leaveGathering(
    gatheringId: number,
    user: User,
  ): Promise<{ message: string }> {
    // 檢查使用者 id 是否存在
    if (!user.id) {
      throw new BadRequestException({
        message: 'User ID is missing.',
        code: ErrorCode.BAD_REQUEST,
      });
    }

    // 取得活動資料
    const { gatheringData } = await this.getGatheringById(gatheringId);

    // 檢查活動是否已封存
    if (gatheringData.isArchived) {
      throw new BadRequestException({
        message: 'Cannot cancel participation for archived gatherings.',
        code: ErrorCode.BAD_REQUEST,
      });
    }

    // 檢查活動狀態是否為關閉或進行中（UPCOMING）
    if (gatheringData.status === GatheringStatus.CLOSED) {
      throw new BadRequestException({
        message: 'Cannot cancel participation for closed gatherings.',
        code: ErrorCode.BAD_REQUEST,
      });
    }

    if (gatheringData.status === GatheringStatus.UPCOMING) {
      throw new BadRequestException({
        message: 'Cannot cancel participation for gatherings in progress.',
        code: ErrorCode.BAD_REQUEST,
      });
    }

    // 檢查是否已經報名過
    const existingParticipant = await this.entityManager.findOne(Participant, {
      gathering: gatheringData.id,
      user: user.id,
    });

    if (!existingParticipant) {
      throw new BadRequestException({
        message: 'You have not joined this gathering.',
        code: ErrorCode.BAD_REQUEST,
      });
    }

    // 刪除參與者記錄
    await this.entityManager.removeAndFlush(existingParticipant);

    return {
      message: 'Successfully left the gathering.',
    };
  }

  /**
   * 取得目前登入使用者已參加的活動
   *
   * @param {GetGatheringsQueryDto} queryDto 查詢參數 DTO
   * @param {User} user 取得目前登入的使用者
   * @returns {Promise<{ gatheringData: Gathering[]; page: number; limit: number; total: number }>} 回傳搜尋結果
   */
  async getParticipatedGatherings(
    queryDto: GetGatheringsQueryDto,
    user: User,
  ): Promise<{
    gatheringData: Gathering[];
    page: number;
    limit: number;
    total: number;
  }> {
    // 檢查使用者 id 是否存在
    if (!user.id) {
      throw new BadRequestException({
        message: 'User ID is missing.',
        code: ErrorCode.BAD_REQUEST,
      });
    }

    // 取得該用戶參與的所有活動ID
    const participants = await this.entityManager.find(
      Participant,
      { user: user.id },
      { populate: ['gathering'] },
    );

    const gatheringIds = participants.map((p) => p.gathering.id);

    // 如果沒有參與任何活動，直接回傳空結果
    if (gatheringIds.length === 0) {
      const { page, limit } = queryDto;
      return { gatheringData: [], page, limit, total: 0 };
    }

    // 建立基礎查詢條件
    const baseQuery: any = {
      id: { $in: gatheringIds },
    };

    return this.queryAndFilterGatherings(queryDto, baseQuery);
  }

  /**
   * 批量更新聚會狀態
   * 根據當前時間自動更新所有需要改變狀態的聚會
   * 此方法用於定時任務，定期更新資料庫中的狀態
   * 為了效能考量，只查詢必要的欄位，不載入關聯資料
   *
   * @param {EntityManager} em 可選的 EntityManager，用於在特定上下文中執行（如排程任務）
   * @returns {Promise<{ updatedCount: number }>} 回傳更新的筆數
   */
  async updateGatheringStatuses(
    em?: EntityManager,
  ): Promise<{ updatedCount: number }> {
    const now = new Date();
    const entityManager = em || this.entityManager;
    const gatheringRepository = em
      ? em.getRepository(Gathering)
      : this.gatheringRepository;

    // 查詢所有未封存的聚會（不載入 tags 以提升效能）
    const gatherings = await gatheringRepository.find({
      isArchived: false,
    });

    let updatedCount = 0;

    // 批量更新需要改變狀態的聚會
    for (const gathering of gatherings) {
      const calculatedStatus = gathering.calculateStatus(now);

      // 如果計算出的狀態與資料庫中的狀態不同，則更新
      if (gathering.status !== calculatedStatus) {
        gathering.status = calculatedStatus;
        updatedCount++;
      }
    }

    // 如果有更新，則批量寫入資料庫
    if (updatedCount > 0) {
      await entityManager.flush();
      this.logger.log(`已批量更新 ${updatedCount} 筆聚會狀態`);
    }

    return { updatedCount };
  }

  /**
   * 檢查 Gathering.xlsx 檔案內容是否符合 DTO 驗證規則
   * @param file 上傳的 Excel 檔案
   * @returns 檢查結果，包含錯誤資訊或有效資料
   */
  async checkExcelGathering(workbook: WorkBook) {
    // 取得第一個工作表
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new BadRequestException({
        message: `No worksheets found in the Excel file.`,
        code: ErrorCode.BAD_REQUEST,
      });
    }

    const worksheet = workbook.Sheets[sheetName];

    // 轉為 JSON
    const gatheringRecords = XLSX.utils.sheet_to_json<Record<string, any>>(
      worksheet,
      {
        defval: '',
        range: 1, // 從第 2 排開始讀
      },
    );

    // 檢查是否有任何內容
    if (!gatheringRecords.length) {
      throw new BadRequestException({
        message: `The Excel file is empty.`,
        code: ErrorCode.BAD_REQUEST,
      });
    }

    // 檢查表單資料是否正確，並收集驗證錯誤
    // 收集所有驗證失敗的列資料
    const allErrors: {
      row: number;
      fields: { field: string; message: string }[];
    }[] = [];

    // 逐筆驗證 Excel 轉出來的資料
    for (let i = 0; i < gatheringRecords.length; i++) {
      const record = gatheringRecords[i];

      // 將 plain object 轉為 DTO instance
      const dto = plainToInstance(ImportGatheringExcelDto, record);

      // 執行驗證
      const validationErrors = await validate(dto, {
        whitelist: true,
        forbidNonWhitelisted: true,
      });

      const rowErrors: { field: string; message: string }[] = [];

      // 如果有驗證錯誤，記錄錯誤資訊
      if (validationErrors.length > 0) {
        validationErrors.forEach((error) => {
          if (error.constraints) {
            Object.values(error.constraints).forEach((msg) => {
              // 將每一條錯誤訊息轉換成統一格式
              rowErrors.push({
                field: error.property,
                message: msg,
              });
            });
          }
        });
      }

      // 自訂驗證
      // 驗證 createdAt 的時間不能大於其他的時間
      if (
        new Date(dto.createdAt) > new Date(dto.startTime) ||
        new Date(dto.createdAt) > new Date(dto.deadline) ||
        new Date(dto.createdAt) > new Date(dto.updatedAt)
      ) {
        rowErrors.push({
          field: 'createdAt',
          message: 'The createdAt time cannot be later than the other time.',
        });
      }

      // 驗證 deadline 不能大於 startTime
      if (new Date(dto.deadline) > new Date(dto.startTime)) {
        rowErrors.push({
          field: 'deadline',
          message: 'The deadline time cannot be earlier than the start time.',
        });
      }

      // 合併自訂驗證
      if (rowErrors.length > 0) {
        allErrors.push({
          row: i + 2,
          fields: rowErrors,
        });
      }
    }

    // 如果有任一列驗證失敗，統一拋出錯誤
    if (allErrors.length > 0) {
      throw new BadRequestException(
        JSON.stringify({
          totalErrorRows: allErrors.length,
          errors: allErrors,
        }),
      );
    }

    // 回傳 JSON 結果
    return {
      total: gatheringRecords.length,
      data: gatheringRecords,
    };
  }
}

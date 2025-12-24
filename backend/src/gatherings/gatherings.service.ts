import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { Gathering } from './entities/gathering.entity';
import { CreateGatheringDto } from './dto/create-gathering-dto';
import { UpdateGatheringDto } from './dto/update-gathering-dto';
import { GatheringStatus } from './enum/gathering.status';
import { GatheringType } from './enum/gathering.type';
import { TagsService } from '../tags/tags.service';
import { GetGatheringsQueryDto } from './dto/get-gatherings-query.dto';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Tag } from '../tags/entities/tag.entity';
import { User } from 'src/users/entities/user.entity';
import { UserRole } from 'src/users/enum/auth.role';
import { ErrorCode } from 'src/common/enum/error-code.enum';

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
   * 查詢已有聚會
   *
   * @param {GetGatheringsQueryDto} queryDto 查詢參數 DTO
   * @param {User} user 取得目前登入的使用者
   * @returns {Promise<{ gatheringData: Gathering }>} 回傳搜尋結果
   */
  async getGatherings(
    queryDto: GetGatheringsQueryDto,
    user: User,
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

    // 建立查詢條件物件
    const query: any = {};

    // 一般使用者只能看到自己的 gathering
    if (user.role !== UserRole.ADMIN) {
      query.userId = user;
    }

    // 根據聚會結束狀態篩選
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

    // 計算撈出的資料數量
    let total = await this.gatheringRepository.count(query);

    // 查詢資料並載入關聯 tags
    let gatherings = await this.gatheringRepository.find(query, {
      populate: ['tags'],
      orderBy: { [sortBy]: sortOrder.toLowerCase() },
      limit,
      offset: (page - 1) * limit,
    });

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

    // 標籤篩選
    if (Array.isArray(tags) && tags.length > 0) {
      gatherings = gatherings.filter((gathering) => {
        // 把每個陣列轉成字串
        const tagNames = gathering.tags.map((tag) => tag.tagName);

        // 回傳篩選過後的項目
        return tags.every((tag) => new Set(tagNames).has(tag));
      });
    }

    // 計算過濾tag後的資料數量
    total = gatherings.length;

    return { gatheringData: gatherings, page, limit, total };
  }

  /**
   * 取得指定 id 的聚會
   *
   * @param {number} id 聚會 ID
   * @param {User} user 取得目前登入的使用者
   * @returns {Promise<{ gatheringData: Gathering }>} 回傳某id的聚會資料
   * @throws {NotFoundException} 若找不到指定id則拋出錯誤
   */
  async getGatheringById(
    id: number,
    user: User,
  ): Promise<{ gatheringData: Gathering }> {
    // 查資料庫有沒有這個聚會
    const found = await this.entityManager.findOne(Gathering, id);

    // 如果沒有跳出錯誤
    if (!found) {
      throw new NotFoundException({
        message: `Gathering with ID "${id}" not found.`,
        code: ErrorCode.NOT_FOUND,
      });
    }

    if (user.role !== UserRole.ADMIN && user.id !== found.userId) {
      throw new ForbiddenException({
        message: 'You are not authorized to access this gathering.',
        code: ErrorCode.FORBIDDEN,
      });
    }

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
      dueDate,
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
      dueDate: dueDate ?? null,
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
   */
  async updateGathering(
    id: number,
    updateGatheringDto: UpdateGatheringDto,
    user: User,
  ): Promise<{ gatheringData: Gathering }> {
    // 先取得聚會（如果找不到會自動丟錯）
    const { gatheringData } = await this.getGatheringById(id, user);

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
    const { gatheringData } = await this.getGatheringById(id, user);

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
    const { gatheringData } = await this.getGatheringById(id, user);
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
    const { gatheringData } = await this.getGatheringById(id, user);
    gatheringData.status = GatheringStatus.CLOSED;
    await this.entityManager.persistAndFlush(gatheringData);
    return { gatheringData: gatheringData };
  }
}

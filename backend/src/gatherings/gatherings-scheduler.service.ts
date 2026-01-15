import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { EntityManager } from '@mikro-orm/core';
import { GatheringsService } from './gatherings.service';

/**
 * 聚會狀態定時任務服務
 * 定期自動更新聚會狀態，確保資料庫中的狀態與實際時間一致
 */
@Injectable()
export class GatheringsSchedulerService implements OnApplicationBootstrap {
  private readonly logger = new Logger(GatheringsSchedulerService.name);

  constructor(
    private readonly gatheringsService: GatheringsService,
    private readonly entityManager: EntityManager,
  ) {}

  /**
   * 應用程式啟動時執行一次，立即更新聚會狀態
   */
  async onApplicationBootstrap() {
    this.logger.log('伺服器啟動：開始執行聚會狀態批量更新任務...');
    await this.updateGatheringStatus();
  }

  /**
   * 每5分鐘執行一次，批量更新聚會狀態
   * Cron 表達式：每5分鐘執行一次
   */
  @Cron('*/5 * * * *')
  async handleGatheringStatusUpdate() {
    await this.updateGatheringStatus();
  }

  /**
   * 統一的狀態更新邏輯
   */
  private async updateGatheringStatus() {
    this.logger.log('開始執行聚會狀態批量更新任務...');
    try {
      // 使用 fork() 創建新的 EntityManager 上下文，避免使用全域實例
      const em = this.entityManager.fork();
      const { updatedCount } =
        await this.gatheringsService.updateGatheringStatuses(em);
      this.logger.log(`聚會狀態批量更新完成，共更新 ${updatedCount} 筆資料`);
    } catch (error) {
      this.logger.error(`聚會狀態批量更新失敗: ${error.message}`, error.stack);
    }
  }
}

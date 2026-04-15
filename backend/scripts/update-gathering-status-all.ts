import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { GatheringsSchedulerService } from '../src/gatherings/gatherings-scheduler.service';

async function run() {
  const logger = new Logger('UpdateGatheringStatusAllCommand');
  process.env.SKIP_GATHERING_BOOTSTRAP_UPDATE = 'true';
  const app = await NestFactory.createApplicationContext(AppModule);

  logger.log('開始手動執行全量聚會狀態檢查...');
  const schedulerService = app.get(GatheringsSchedulerService);

  // 執行全量聚會狀態檢查
  await schedulerService
    .runFullGatheringStatusUpdate()
    .then(() => {
      logger.log('全量聚會狀態檢查完成');
    })
    .finally(async () => {
      await app.close();
    });
}

void run();

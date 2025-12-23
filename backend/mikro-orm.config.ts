import { Migrator, TSMigrationGenerator } from '@mikro-orm/migrations';
import {
  defineConfig,
  EntityCaseNamingStrategy,
  SqliteDriver,
} from '@mikro-orm/sqlite';
import * as dotenv from 'dotenv';
import path from 'path';

// 手動載入 .env
dotenv.config({
  path: path.resolve(process.cwd(), `.env.stage.${process.env.STAGE || 'dev'}`),
});

export default defineConfig({
  driver: SqliteDriver,
  dbName:
    process.env.DB_NAME || path.resolve(process.cwd(), 'data/gathering.db'),

  namingStrategy: EntityCaseNamingStrategy, // 保留 Entity 名稱
  entities: ['./dist/**/*.entity.js'],
  entitiesTs: ['./src/**/*.entity.ts'],

  // SQLite 自訂函數配置
  extensions: [Migrator],
  migrations: {
    tableName: 'mikro_orm_migrations',
    path: './migrations',
    glob: '!(*.d).{js,ts,cjs}',
    silent: false,
    transactional: true,
    disableForeignKeys: true,
    allOrNothing: true,
    dropTables: false,
    safe: false,
    snapshot: true,
    emit: 'ts',
    generator: TSMigrationGenerator,
    fileName: (timestamp: string, name?: string) =>
      `Migration${timestamp}${name ? '_' + name : ''}`,
  },
});

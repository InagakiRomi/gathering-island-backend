import { Migrator, TSMigrationGenerator } from '@mikro-orm/migrations';
import {
  defineConfig,
  EntityCaseNamingStrategy,
  PostgreSqlDriver,
} from '@mikro-orm/postgresql';
import * as dotenv from 'dotenv';
import path from 'path';

// 手動載入 .env
dotenv.config({
  path: path.resolve(process.cwd(), `.env.stage.${process.env.STAGE || 'dev'}`),
});

export default defineConfig({
  driver: PostgreSqlDriver,
  dbName: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),

  namingStrategy: EntityCaseNamingStrategy, // 保留 Entity 名稱
  entities: ['./dist/**/*.entity.js'],
  entitiesTs: ['./src/**/*.entity.ts'],

  extensions: [Migrator],
  migrations: {
    tableName: 'mikro_orm_migrations',
    path: './migrations',
    glob: '!(*.d).{js,ts,cjs}',
    silent: false,
    transactional: true,
    disableForeignKeys: false,
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

import { DataSource, DataSourceOptions } from 'typeorm';
import { join } from 'path';

/**
 * TypeORM DataSource 配置
 *
 * 用于 CLI 迁移命令（migration:generate, migration:run, migration:revert）
 * 以及种子数据脚本的独立运行。
 *
 * NestJS 运行时使用 DatabaseModule 中 forRootAsync 的动态配置，
 * 此文件仅供 NestJS 之外的 TypeORM CLI 使用。
 */

const options: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'bead_store',
  entities: [join(__dirname, 'entities', '*.entity.{ts,js}')],
  migrations: [join(__dirname, 'migrations', '*{.ts,.js}')],
  migrationsTableName: 'typeorm_migrations',
  synchronize: false,
  logging: process.env.DB_LOGGING === 'true',
};

const dataSource = new DataSource(options);

export default dataSource;

import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';

import {
  Store,
  ReservationRule,
  MerchantAccount,
  Reservation,
  TimerSession,
  TimerExtension,
  Coupon,
  Member,
  ConsumptionRecord,
  Message,
} from './entities';

import {
  StoreRepository,
  ReservationRuleRepository,
  MerchantAccountRepository,
  ReservationRepository,
  TimerSessionRepository,
  TimerExtensionRepository,
  CouponRepository,
  MemberRepository,
  ConsumptionRecordRepository,
  MessageRepository,
} from './repositories';

/**
 * 数据库模块
 *
 * 全局模块，提供 TypeORM 连接和自定义 Repository。
 * 使用 ConfigService 读取环境变量中的数据库配置。
 */
@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USERNAME', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', 'postgres'),
        database: configService.get<string>('DB_DATABASE', 'bead_store'),
        entities: [
          Store,
          ReservationRule,
          MerchantAccount,
          Reservation,
          TimerSession,
          TimerExtension,
          Coupon,
          Member,
          ConsumptionRecord,
          Message,
        ],
        migrations: [
          join(__dirname, 'migrations', '*{.ts,.js}'),
        ],
        migrationsRun: configService.get<string>('DB_MIGRATIONS_RUN', 'true') === 'true',
        synchronize: configService.get<string>('DB_SYNCHRONIZE', 'false') === 'true',
        logging: configService.get<string>('DB_LOGGING', 'false') === 'true',
        // 连接池配置
        extra: {
          max: configService.get<number>('DB_POOL_MAX', 20),
          idleTimeoutMillis: configService.get<number>('DB_POOL_IDLE_TIMEOUT', 30000),
          connectionTimeoutMillis: configService.get<number>('DB_POOL_CONNECTION_TIMEOUT', 5000),
        },
        // 时区设置
        timezone: 'Asia/Shanghai',
      }),
    }),
    TypeOrmModule.forFeature([
      Store,
      ReservationRule,
      MerchantAccount,
      Reservation,
      TimerSession,
      TimerExtension,
      Coupon,
      Member,
      ConsumptionRecord,
      Message,
    ]),
  ],
  providers: [
    StoreRepository,
    ReservationRuleRepository,
    MerchantAccountRepository,
    ReservationRepository,
    TimerSessionRepository,
    TimerExtensionRepository,
    CouponRepository,
    MemberRepository,
    ConsumptionRecordRepository,
    MessageRepository,
  ],
  exports: [
    TypeOrmModule,
    StoreRepository,
    ReservationRuleRepository,
    MerchantAccountRepository,
    ReservationRepository,
    TimerSessionRepository,
    TimerExtensionRepository,
    CouponRepository,
    MemberRepository,
    ConsumptionRecordRepository,
    MessageRepository,
  ],
})
export class DatabaseModule {}

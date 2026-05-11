import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import {
  Store,
  ReservationRule,
  MerchantAccount,
} from '../entities';

/**
 * 种子数据脚本
 *
 * 用于开发/演示环境的初始化数据。
 * 设计为幂等：重复执行不会报错或产生重复数据。
 *
 * 使用方法：
 *   npx ts-node src/database/seeds/seed.ts
 * 或在 NestJS 中通过 onModuleInit 调用 runSeed()。
 */

/**
 * bcrypt 加密轮数（开发环境用较低轮数以加快速度）
 */
const BCRYPT_ROUNDS = 10;

/**
 * 默认管理员密码的 bcrypt hash
 * 密码: admin123
 *
 * 注意：此 hash 是预计算的，如果直接使用请确保上线后修改密码。
 * 运行时通过 bcrypt.hash 重新计算以确保 salt 唯一。
 */
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * 执行种子数据写入
 */
export async function runSeed(dataSource: DataSource): Promise<void> {
  console.log('🌱 开始写入种子数据...');

  // ---------------------------------------------------------------------------
  // 1. 门店配置
  // ---------------------------------------------------------------------------
  const storeRepo = dataSource.getRepository(Store);
  const existingStore = await storeRepo.findOne({ where: { id: 1 } });

  if (!existingStore) {
    await storeRepo.save(
      storeRepo.create({
        id: 1,
        name: '我的拼豆店',
        address: '请配置门店地址',
        address_guide: '3楼电梯右转302',
        phone: '13800000000',
        photos: [
          'https://placehold.co/800x600/FDF8F2/3D3530?text=门店照片1',
          'https://placehold.co/800x600/FDF8F2/3D3530?text=门店照片2',
        ],
        open_time: '10:00',
        close_time: '22:00',
        rest_days: [],
        table_count: 8,
        description: '欢迎来到我的拼豆店！我们提供丰富的拼豆材料和专业指导，适合亲子、情侣、朋友聚会。',
      }),
    );
    console.log('  ✓ store — 门店配置已创建');
  } else {
    console.log('  ⏭ store — 已存在，跳过');
  }

  // ---------------------------------------------------------------------------
  // 2. 预约规则（默认值）
  // ---------------------------------------------------------------------------
  const rulesRepo = dataSource.getRepository(ReservationRule);
  const existingRules = await rulesRepo.findOne({ where: { id: 1 } });

  if (!existingRules) {
    await rulesRepo.save(
      rulesRepo.create({
        id: 1,
        require_confirmation: false,   // 默认自动确认
        advance_days: 7,               // 可提前 7 天预约
        cutoff_minutes: 60,            // 时段开始前 60 分钟关闭预约
        auto_cancel_hours: null,       // 不启用自动取消（需确认模式为 false）
        customer_cancel_hours: 3,      // 顾客可在开始前 3 小时自行取消
        slot_duration: 60,             // 每时段 60 分钟
      }),
    );
    console.log('  ✓ reservation_rules — 默认规则已创建');
  } else {
    console.log('  ⏭ reservation_rules — 已存在，跳过');
  }

  // ---------------------------------------------------------------------------
  // 3. 商家管理员账号
  // ---------------------------------------------------------------------------
  const accountRepo = dataSource.getRepository(MerchantAccount);
  const existingAdmin = await accountRepo.findOne({
    where: { username: 'admin' },
  });

  if (!existingAdmin) {
    const passwordHash = await hashPassword('admin123');
    await accountRepo.save(
      accountRepo.create({
        username: 'admin',
        password_hash: passwordHash,
        wechat_openid: null,
      }),
    );
    console.log('  ✓ merchant_accounts — 管理员账号已创建 (admin / admin123)');
    console.log('    ⚠️  请上线后立即修改默认密码！');
  } else {
    console.log('  ⏭ merchant_accounts — admin 已存在，跳过');
  }

  console.log('✅ 种子数据写入完成！');
}

/**
 * 独立运行入口
 *
 * 需要先配置 DataSource 连接 PostgreSQL。
 * 使用方式：
 *   npx ts-node -r tsconfig-paths/register src/database/seeds/seed.ts
 */
async function main(): Promise<void> {
  // 从环境变量读取数据库配置
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'bead_store',
    entities: [Store, ReservationRule, MerchantAccount],
    synchronize: false,
  });

  try {
    await dataSource.initialize();
    console.log('📦 数据库已连接');
    await runSeed(dataSource);
    await dataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ 种子数据写入失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此文件则执行
if (require.main === module) {
  main();
}

-- ============================================================================
-- 拼豆店预约计时小程序 — 数据库初始化脚本
-- 用途: Docker Compose 首次启动时自动执行
-- 包含: 建表 + 种子数据
-- 兼容: PostgreSQL 15+
-- ============================================================================

-- 1. 建表（与 001_initial_schema.sql 一致）
\i /docker-entrypoint-initdb.d/001_initial_schema.sql

-- 2. 种子数据
-- 门店配置
INSERT INTO store (id, name, address, address_guide, phone, photos, open_time, close_time, rest_days, table_count, description)
VALUES (
  1,
  '我的拼豆店',
  '请配置门店地址',
  '3楼电梯右转302',
  '13800000000',
  '["https://placehold.co/800x600/FDF8F2/3D3530?text=门店照片1","https://placehold.co/800x600/FDF8F2/3D3530?text=门店照片2"]',
  '10:00',
  '22:00',
  '[]',
  8,
  '欢迎来到我的拼豆店！我们提供丰富的拼豆材料和专业指导，适合亲子、情侣、朋友聚会。'
)
ON CONFLICT (id) DO NOTHING;

-- 预约规则（默认值）
INSERT INTO reservation_rules (id, require_confirmation, advance_days, cutoff_minutes, auto_cancel_hours, customer_cancel_hours, slot_duration)
VALUES (1, FALSE, 7, 60, NULL, 3, 60)
ON CONFLICT (id) DO NOTHING;

-- 商家管理员账号
-- 密码: admin123 (bcrypt hash, 上线后请修改)
INSERT INTO merchant_accounts (id, username, password_hash)
VALUES (
  1,
  'admin',
  -- bcrypt hash of 'admin123' (cost=10)
  -- 注意：实际部署时请使用运行时 bcrypt.hash('admin123', 10) 生成真实 hash
  '$2b$10$8K1p/a0dL1LXMIgoEDFrwOfMQkf9VsRnY8FXYZqTZqkHFqF0G9ZLi'
)
ON CONFLICT (id) DO NOTHING;

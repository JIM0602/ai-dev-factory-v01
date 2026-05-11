-- ============================================================================
-- 拼豆店预约计时小程序 — 初始数据库迁移
-- 版本: 001
-- 描述: 创建全部 10 张核心表、索引、约束
-- 数据库: PostgreSQL 15+
-- 创建日期: 2026-05-11
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. store — 门店信息表（V1 单门店，仅 1 行记录）
-- ----------------------------------------------------------------------------
CREATE TABLE store (
  id              SERIAL        PRIMARY KEY,
  name            VARCHAR(30)   NOT NULL,
  address         VARCHAR(200)  NOT NULL,
  address_guide   VARCHAR(100),
  phone           VARCHAR(11)   NOT NULL,
  photos          JSONB         NOT NULL DEFAULT '[]',
  open_time       TIME          NOT NULL DEFAULT '10:00',
  close_time      TIME          NOT NULL DEFAULT '22:00',
  rest_days       JSONB         NOT NULL DEFAULT '[]',
  table_count     INTEGER       NOT NULL DEFAULT 8 CHECK (table_count >= 1),
  description     VARCHAR(200),
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- 确保只有 1 行（V1 单门店约束）
ALTER TABLE store ADD CONSTRAINT store_single_row CHECK (id = 1);

-- ----------------------------------------------------------------------------
-- 2. reservation_rules — 预约规则表（V1 单套规则，仅 1 行记录）
-- ----------------------------------------------------------------------------
CREATE TABLE reservation_rules (
  id                    SERIAL    PRIMARY KEY,
  require_confirmation  BOOLEAN   NOT NULL DEFAULT FALSE,
  advance_days          INTEGER   NOT NULL DEFAULT 7 CHECK (advance_days >= 1),
  cutoff_minutes        INTEGER   NOT NULL DEFAULT 60 CHECK (cutoff_minutes >= 0),
  auto_cancel_hours     INTEGER   CHECK (auto_cancel_hours IS NULL OR auto_cancel_hours >= 1),
  customer_cancel_hours INTEGER   NOT NULL DEFAULT 3 CHECK (customer_cancel_hours >= 0),
  slot_duration         INTEGER   NOT NULL DEFAULT 60 CHECK (slot_duration IN (30, 60, 90, 120)),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE reservation_rules ADD CONSTRAINT reservation_rules_single_row CHECK (id = 1);

-- ----------------------------------------------------------------------------
-- 3. merchant_accounts — 商家账号表
-- ----------------------------------------------------------------------------
CREATE TABLE merchant_accounts (
  id              SERIAL        PRIMARY KEY,
  username        VARCHAR(50)   NOT NULL UNIQUE,
  password_hash   VARCHAR(255)  NOT NULL,
  wechat_openid   VARCHAR(64)   UNIQUE,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 4. reservations — 预约记录表（核心业务表）
-- ----------------------------------------------------------------------------
CREATE TYPE reservation_status AS ENUM (
  'pending',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
  'rejected'
);

CREATE TYPE reservation_source AS ENUM (
  'customer',
  'merchant',
  'walk_in'
);

CREATE TABLE reservations (
  id                BIGSERIAL           PRIMARY KEY,
  customer_openid   VARCHAR(64)         NOT NULL,
  customer_name     VARCHAR(50)         NOT NULL,
  customer_phone    VARCHAR(11)         NOT NULL,
  reservation_date  DATE                NOT NULL,
  slot_start_time   TIME                NOT NULL,
  slot_end_time     TIME                NOT NULL,
  guest_count       INTEGER             NOT NULL DEFAULT 1 CHECK (guest_count BETWEEN 1 AND 10),
  status            reservation_status  NOT NULL DEFAULT 'pending',
  source            reservation_source  NOT NULL DEFAULT 'customer',
  cancel_reason     VARCHAR(100),
  rejection_reason  VARCHAR(100),
  remark            VARCHAR(100),
  created_at        TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

-- 索引：按顾客查询
CREATE INDEX idx_reservations_customer_openid ON reservations(customer_openid);
CREATE INDEX idx_reservations_customer_phone ON reservations(customer_phone);

-- 索引：按日期 + 状态查询（商家筛选、容量统计）
CREATE INDEX idx_reservations_date_status ON reservations(reservation_date, status);

-- 索引：按日期 + 时段排序（容量查询、时段列表）
CREATE INDEX idx_reservations_date_slot ON reservations(reservation_date, slot_start_time);

-- ----------------------------------------------------------------------------
-- 5. timer_sessions — 计时会话表
-- ----------------------------------------------------------------------------
CREATE TYPE timer_session_status AS ENUM ('active', 'completed');

CREATE TABLE timer_sessions (
  id                        BIGSERIAL              PRIMARY KEY,
  reservation_id            BIGINT                 NOT NULL UNIQUE REFERENCES reservations(id) ON DELETE CASCADE,
  table_number              INTEGER                NOT NULL CHECK (table_number >= 1),
  check_in_time             TIMESTAMPTZ            NOT NULL,
  expected_end_time         TIMESTAMPTZ            NOT NULL,
  actual_end_time           TIMESTAMPTZ,
  original_duration_minutes INTEGER                NOT NULL,
  total_extension_minutes   INTEGER                NOT NULL DEFAULT 0 CHECK (total_extension_minutes >= 0),
  status                    timer_session_status   NOT NULL DEFAULT 'active',
  created_at                TIMESTAMPTZ            NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ            NOT NULL DEFAULT NOW()
);

-- 索引：按状态查询（计时看板）
CREATE INDEX idx_timer_sessions_status ON timer_sessions(status);

-- ----------------------------------------------------------------------------
-- 6. timer_extensions — 加时记录表
-- ----------------------------------------------------------------------------
CREATE TABLE timer_extensions (
  id                BIGSERIAL     PRIMARY KEY,
  timer_session_id  BIGINT        NOT NULL REFERENCES timer_sessions(id) ON DELETE CASCADE,
  extension_minutes INTEGER       NOT NULL CHECK (extension_minutes > 0),
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- 索引：按计时会话查询加时历史
CREATE INDEX idx_timer_extensions_session ON timer_extensions(timer_session_id);

-- ----------------------------------------------------------------------------
-- 7. coupons — 团购券核销记录表
-- ----------------------------------------------------------------------------
CREATE TYPE coupon_source AS ENUM ('meituan', 'douyin', 'other');

CREATE TABLE coupons (
  id                BIGSERIAL     PRIMARY KEY,
  timer_session_id  BIGINT        NOT NULL REFERENCES timer_sessions(id) ON DELETE CASCADE,
  coupon_code       VARCHAR(100)  NOT NULL,
  coupon_source     coupon_source NOT NULL,
  coupon_type       VARCHAR(50),
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- 索引：按计时会话查询
CREATE INDEX idx_coupons_session ON coupons(timer_session_id);

-- 索引：按券来源筛选
CREATE INDEX idx_coupons_source ON coupons(coupon_source);

-- ----------------------------------------------------------------------------
-- 8. members — 会员档案表
-- ----------------------------------------------------------------------------
CREATE TABLE members (
  id                      BIGSERIAL     PRIMARY KEY,
  name                    VARCHAR(50)   NOT NULL,
  phone                   VARCHAR(11)   NOT NULL UNIQUE,
  total_visits            INTEGER       NOT NULL DEFAULT 0 CHECK (total_visits >= 0),
  total_duration_minutes  INTEGER       NOT NULL DEFAULT 0 CHECK (total_duration_minutes >= 0),
  last_visit_date         DATE,
  created_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- 索引：按手机号精确查询
CREATE INDEX idx_members_phone ON members(phone);

-- ----------------------------------------------------------------------------
-- 9. consumption_records — 消费记录表
-- ----------------------------------------------------------------------------
CREATE TABLE consumption_records (
  id                BIGSERIAL     PRIMARY KEY,
  member_id         BIGINT        NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  reservation_id    BIGINT        NOT NULL UNIQUE REFERENCES reservations(id) ON DELETE CASCADE,
  timer_session_id  BIGINT        NOT NULL UNIQUE REFERENCES timer_sessions(id) ON DELETE CASCADE,
  visit_date        DATE          NOT NULL,
  check_in_time     TIMESTAMPTZ   NOT NULL,
  check_out_time    TIMESTAMPTZ   NOT NULL,
  duration_minutes  INTEGER       NOT NULL CHECK (duration_minutes > 0),
  has_coupon        BOOLEAN       NOT NULL DEFAULT FALSE,
  source            reservation_source NOT NULL,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- 索引：按会员查询消费记录
CREATE INDEX idx_consumption_member ON consumption_records(member_id);

-- 索引：按到店日期查询
CREATE INDEX idx_consumption_visit_date ON consumption_records(visit_date);

-- ----------------------------------------------------------------------------
-- 10. messages — 消息通知记录表（V1 预留，仅记录不实际发送）
-- ----------------------------------------------------------------------------
CREATE TYPE message_recipient_type AS ENUM ('customer', 'merchant');
CREATE TYPE message_status AS ENUM ('pending', 'sent', 'failed');

CREATE TABLE messages (
  id              BIGSERIAL               PRIMARY KEY,
  recipient_type  message_recipient_type  NOT NULL,
  recipient_id    VARCHAR(64)             NOT NULL,
  scene           VARCHAR(50)             NOT NULL,
  title           VARCHAR(100)            NOT NULL,
  content         JSONB                   NOT NULL,
  status          message_status          NOT NULL DEFAULT 'pending',
  created_at      TIMESTAMPTZ             NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ             NOT NULL DEFAULT NOW()
);

-- 索引：按接收方查询消息
CREATE INDEX idx_messages_recipient ON messages(recipient_type, recipient_id);
CREATE INDEX idx_messages_status ON messages(status);

COMMIT;

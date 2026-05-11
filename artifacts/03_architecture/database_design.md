# 拼豆店预约计时小程序 — 数据库设计

## 文档信息

| 项目 | 内容 |
|------|------|
| 文档版本 | v1.0 |
| 创建日期 | 2026-05-11 |
| 负责 Agent | architect |
| 输入来源 | PRD v1.0、用户流程 v1.0、系统架构设计 v1.0 |

---

## 1. ER 图（实体关系图）

```
┌──────────────────┐       ┌──────────────────────┐
│  merchant_accounts│       │  reservation_rules    │
│──────────────────│       │──────────────────────│
│ id (PK)          │       │ id (PK)              │
│ username (UQ)    │       │ require_confirmation  │
│ password_hash    │       │ advance_days          │
│ wechat_openid    │       │ cutoff_minutes        │
│ created_at       │       │ auto_cancel_hours     │
│ updated_at       │       │ customer_cancel_hours │
└──────────────────┘       │ slot_duration         │
                           │ created_at            │
                           │ updated_at            │
┌──────────────────┐       └──────────────────────┘
│  store            │
│──────────────────│
│ id (PK)          │       ┌──────────────────────────┐
│ name             │       │  reservations             │
│ address          │       │──────────────────────────│
│ address_guide    │       │ id (PK)                  │
│ phone            │       │ customer_openid (IDX)    │
│ photos (JSON)    │       │ customer_name            │
│ open_time        │       │ customer_phone (IDX)     │
│ close_time       │       │ reservation_date (IDX)   │
│ rest_days (JSON) │       │ slot_start_time          │
│ table_count      │       │ slot_end_time            │
│ description      │       │ guest_count              │
│ created_at       │       │ status (IDX)             │
│ updated_at       │ 1  N  │ source                   │
└──────────────────┘◄──────│ cancel_reason            │
                           │ rejection_reason         │
                           │ remark                   │
                           │ created_at               │
                           │ updated_at               │
                           └──────────┬───────────────┘
                                      │ 1
                                      │
                                      │ 0..1
                                      v
                           ┌──────────────────────────┐
                           │  timer_sessions           │
                           │──────────────────────────│
                           │ id (PK)                  │
                           │ reservation_id (FK, UQ)  │
                           │ table_number             │
                           │ check_in_time            │
                           │ expected_end_time        │
                           │ actual_end_time          │
                           │ original_duration_minutes│
                           │ total_extension_minutes  │
                           │ status (IDX)             │
                           │ created_at               │
                           │ updated_at               │
                           └──────┬─────────┬─────────┘
                                  │ 1       │ 1
                                  │         │
                         0..N ┌───┘         └───┐ 0..N
                              v                 v
                  ┌──────────────────┐  ┌──────────────────────┐
                  │ timer_extensions │  │  coupons             │
                  │──────────────────│  │──────────────────────│
                  │ id (PK)          │  │ id (PK)              │
                  │ timer_session_id │  │ timer_session_id     │
                  │   (FK, IDX)      │  │   (FK, IDX)          │
                  │ extension_minutes│  │ coupon_code          │
                  │ created_at       │  │ coupon_source        │
                  └──────────────────┘  │ coupon_type          │
                                       │ created_at           │
                                       └──────────┬───────────┘
                                                  │
                                                  │ 触发写入会员记录
                                                  │ (timer 结束时)
                                                  v
┌──────────────────┐       ┌──────────────────────────┐
│  members          │       │  consumption_records     │
│──────────────────│       │──────────────────────────│
│ id (PK)          │ 1  N  │ id (PK)                  │
│ name             │◄──────│ member_id (FK, IDX)      │
│ phone (UQ)       │       │ reservation_id (FK, UQ)  │
│ total_visits     │       │ timer_session_id (FK,UQ) │
│ total_duration   │       │ visit_date (IDX)         │
│ last_visit_date  │       │ check_in_time            │
│ created_at       │       │ check_out_time           │
│ updated_at       │       │ duration_minutes         │
└──────────────────┘       │ has_coupon               │
                           │ source                   │
                           │ created_at               │
                           └──────────────────────────┘

┌───────────────────┐
│  messages          │  ← V1 预留，不参与业务流程
│───────────────────│
│ id (PK)           │
│ recipient_type    │
│ recipient_id      │
│ scene             │
│ title             │
│ content (JSON)    │
│ status            │
│ created_at        │
│ updated_at        │
└───────────────────┘
```

### 关系总结

| 关系 | 类型 | 说明 |
|------|------|------|
| reservations.customer_phone -> members.phone | 逻辑关联 | 同一手机号归集到同一会员，非数据库外键 |
| timer_sessions.reservation_id -> reservations.id | 1:1 | 一个预约最多一条计时会话 |
| timer_extensions.timer_session_id -> timer_sessions.id | N:1 | 一次计时可多次加时 |
| coupons.timer_session_id -> timer_sessions.id | N:1 | 一次计时可核销多张券 |
| consumption_records.member_id -> members.id | N:1 | 一个会员有多条消费记录 |
| consumption_records.reservation_id -> reservations.id | 1:1 | 一条预约对应一条消费记录 |

---

## 2. 表结构详细设计

### 2.1 store（门店信息）

V1 仅支持单门店，此表只有 1 行记录。

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | SERIAL | PK | 主键，固定为 1 |
| name | VARCHAR(30) | NOT NULL | 门店名称 |
| address | VARCHAR(200) | NOT NULL | 完整地址 |
| address_guide | VARCHAR(100) | — | 门牌指引（如"3楼电梯右转302"） |
| phone | VARCHAR(11) | NOT NULL | 联系电话 |
| photos | JSONB | NOT NULL, DEFAULT '[]' | 门店照片 URL 数组，最少 1 张最多 9 张 |
| open_time | TIME | NOT NULL | 营业开始时间，如 "10:00" |
| close_time | TIME | NOT NULL | 营业结束时间，如 "22:00" |
| rest_days | JSONB | NOT NULL, DEFAULT '[]' | 每周固定休息日，如 `[0,6]`（0=周日,6=周六） |
| table_count | INTEGER | NOT NULL, CHECK >= 1 | 桌位总数 |
| description | VARCHAR(200) | — | 门店介绍文案 |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | 更新时间 |

**索引**：无额外索引（单行表）。

**SQL 示例**：

```sql
CREATE TABLE store (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  name VARCHAR(30) NOT NULL,
  address VARCHAR(200) NOT NULL,
  address_guide VARCHAR(100),
  phone VARCHAR(11) NOT NULL,
  photos JSONB NOT NULL DEFAULT '[]',
  open_time TIME NOT NULL DEFAULT '10:00',
  close_time TIME NOT NULL DEFAULT '22:00',
  rest_days JSONB NOT NULL DEFAULT '[]',
  table_count INTEGER NOT NULL DEFAULT 8 CHECK (table_count >= 1),
  description VARCHAR(200),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

### 2.2 reservation_rules（预约规则）

V1 仅有一套规则，此表只有 1 行记录。

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | SERIAL | PK | 主键，固定为 1 |
| require_confirmation | BOOLEAN | NOT NULL, DEFAULT FALSE | 预约是否需要商家确认 |
| advance_days | INTEGER | NOT NULL, DEFAULT 7 | 顾客可提前预约天数 |
| cutoff_minutes | INTEGER | NOT NULL, DEFAULT 60 | 时段开始前 X 分钟关闭预约 |
| auto_cancel_hours | INTEGER | — | 超时未确认自动取消的小时数（NULL=不启用） |
| customer_cancel_hours | INTEGER | NOT NULL, DEFAULT 3 | 顾客预约开始前 X 小时可自行取消 |
| slot_duration | INTEGER | NOT NULL, DEFAULT 60 | 时段时长（分钟）：30/60/90/120 |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | 更新时间 |

**SQL 示例**：

```sql
CREATE TABLE reservation_rules (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  require_confirmation BOOLEAN NOT NULL DEFAULT FALSE,
  advance_days INTEGER NOT NULL DEFAULT 7 CHECK (advance_days >= 1),
  cutoff_minutes INTEGER NOT NULL DEFAULT 60 CHECK (cutoff_minutes >= 0),
  auto_cancel_hours INTEGER CHECK (auto_cancel_hours IS NULL OR auto_cancel_hours >= 1),
  customer_cancel_hours INTEGER NOT NULL DEFAULT 3 CHECK (customer_cancel_hours >= 0),
  slot_duration INTEGER NOT NULL DEFAULT 60 CHECK (slot_duration IN (30, 60, 90, 120)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

### 2.3 reservations（预约记录）

核心表，存储所有预约记录。

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGSERIAL | PK | 主键 |
| customer_openid | VARCHAR(64) | NOT NULL, INDEX | 顾客微信 OpenID |
| customer_name | VARCHAR(50) | NOT NULL | 顾客姓名 |
| customer_phone | VARCHAR(11) | NOT NULL, INDEX | 顾客手机号 |
| reservation_date | DATE | NOT NULL, INDEX | 预约日期 |
| slot_start_time | TIME | NOT NULL | 时段开始时间，如 "14:00" |
| slot_end_time | TIME | NOT NULL | 时段结束时间，如 "15:00" |
| guest_count | INTEGER | NOT NULL, DEFAULT 1 | 人数（1-10） |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'pending', INDEX | 见下方状态枚举 |
| source | VARCHAR(20) | NOT NULL, DEFAULT 'customer' | customer / merchant / walk_in |
| cancel_reason | VARCHAR(100) | — | 取消原因（顾客取消/商家拒绝/自动取消） |
| rejection_reason | VARCHAR(100) | — | 商家拒绝原因 |
| remark | VARCHAR(100) | — | 顾客备注 |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | 更新时间 |

**状态枚举 (status)**：

| 值 | 含义 | 说明 |
|----|------|------|
| `pending` | 待确认 | 顾客提交，等待商家确认 |
| `confirmed` | 已确认 | 商家已确认或自动确认 |
| `in_progress` | 计时中 | 顾客已到店，正在计时 |
| `completed` | 已完成 | 计时结束，顾客离店 |
| `cancelled` | 已取消 | 顾客取消或系统自动取消 |
| `rejected` | 已拒绝 | 商家拒绝了预约 |

**状态流转**：

```
pending ──(商家确认)──> confirmed ──(到店登记)──> in_progress ──(结束计时)──> completed
   │                       │
   ├──(商家拒绝)──> rejected   └──(顾客取消)──> cancelled
   │
   └──(顾客取消/自动取消)──> cancelled
```

**SQL 示例**：

```sql
CREATE TABLE reservations (
  id BIGSERIAL PRIMARY KEY,
  customer_openid VARCHAR(64) NOT NULL,
  customer_name VARCHAR(50) NOT NULL,
  customer_phone VARCHAR(11) NOT NULL,
  reservation_date DATE NOT NULL,
  slot_start_time TIME NOT NULL,
  slot_end_time TIME NOT NULL,
  guest_count INTEGER NOT NULL DEFAULT 1 CHECK (guest_count BETWEEN 1 AND 10),
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','confirmed','in_progress','completed','cancelled','rejected')),
  source VARCHAR(20) NOT NULL DEFAULT 'customer'
    CHECK (source IN ('customer','merchant','walk_in')),
  cancel_reason VARCHAR(100),
  rejection_reason VARCHAR(100),
  remark VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reservations_customer_openid ON reservations(customer_openid);
CREATE INDEX idx_reservations_customer_phone ON reservations(customer_phone);
CREATE INDEX idx_reservations_date_status ON reservations(reservation_date, status);
CREATE INDEX idx_reservations_date_slot ON reservations(reservation_date, slot_start_time);
```

---

### 2.4 timer_sessions（计时会话）

记录每次到店后的计时信息。

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGSERIAL | PK | 主键 |
| reservation_id | BIGINT | FK -> reservations.id, UNIQUE | 关联的预约记录 |
| table_number | INTEGER | NOT NULL | 分配的桌位号（1 到 table_count） |
| check_in_time | TIMESTAMPTZ | NOT NULL | 实际到店时间 |
| expected_end_time | TIMESTAMPTZ | NOT NULL | 初始预计结束时间 (=check_in_time + slot_duration) |
| actual_end_time | TIMESTAMPTZ | — | 实际离店时间（结束计时后写入） |
| original_duration_minutes | INTEGER | NOT NULL | 预约时段的原始时长（分钟） |
| total_extension_minutes | INTEGER | NOT NULL, DEFAULT 0 | 累计加时时长（分钟） |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'active', INDEX | active / completed |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | 更新时间 |

**SQL 示例**：

```sql
CREATE TABLE timer_sessions (
  id BIGSERIAL PRIMARY KEY,
  reservation_id BIGINT NOT NULL UNIQUE REFERENCES reservations(id) ON DELETE CASCADE,
  table_number INTEGER NOT NULL CHECK (table_number >= 1),
  check_in_time TIMESTAMPTZ NOT NULL,
  expected_end_time TIMESTAMPTZ NOT NULL,
  actual_end_time TIMESTAMPTZ,
  original_duration_minutes INTEGER NOT NULL,
  total_extension_minutes INTEGER NOT NULL DEFAULT 0 CHECK (total_extension_minutes >= 0),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_timer_sessions_status ON timer_sessions(status);
```

---

### 2.5 timer_extensions（加时记录）

记录每次加时操作。

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGSERIAL | PK | 主键 |
| timer_session_id | BIGINT | FK -> timer_sessions.id, INDEX | 关联的计时会话 |
| extension_minutes | INTEGER | NOT NULL, CHECK > 0 | 本次加时时长（分钟） |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | 操作时间 |

**SQL 示例**：

```sql
CREATE TABLE timer_extensions (
  id BIGSERIAL PRIMARY KEY,
  timer_session_id BIGINT NOT NULL REFERENCES timer_sessions(id) ON DELETE CASCADE,
  extension_minutes INTEGER NOT NULL CHECK (extension_minutes > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_timer_extensions_session ON timer_extensions(timer_session_id);
```

---

### 2.6 coupons（团购券核销记录）

记录到店登记时录入的团购券信息。V1 仅做记录，不验证真伪。

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGSERIAL | PK | 主键 |
| timer_session_id | BIGINT | FK -> timer_sessions.id, INDEX | 关联的计时会话 |
| coupon_code | VARCHAR(100) | NOT NULL | 券码 |
| coupon_source | VARCHAR(20) | NOT NULL | meituan / douyin / other |
| coupon_type | VARCHAR(50) | — | 券类型描述，如"2小时体验券" |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | 核销时间 |

**SQL 示例**：

```sql
CREATE TABLE coupons (
  id BIGSERIAL PRIMARY KEY,
  timer_session_id BIGINT NOT NULL REFERENCES timer_sessions(id) ON DELETE CASCADE,
  coupon_code VARCHAR(100) NOT NULL,
  coupon_source VARCHAR(20) NOT NULL CHECK (coupon_source IN ('meituan','douyin','other')),
  coupon_type VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_coupons_session ON coupons(timer_session_id);
CREATE INDEX idx_coupons_source ON coupons(coupon_source);
```

---

### 2.7 members（会员档案）

基于手机号自动归集的会员信息。

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGSERIAL | PK | 主键 |
| name | VARCHAR(50) | NOT NULL | 会员姓名（最近一次消费的姓名） |
| phone | VARCHAR(11) | NOT NULL, UNIQUE | 手机号（会员唯一标识） |
| total_visits | INTEGER | NOT NULL, DEFAULT 0 | 累计到店次数 |
| total_duration_minutes | INTEGER | NOT NULL, DEFAULT 0 | 累计消费时长（分钟） |
| last_visit_date | DATE | — | 最近到店日期 |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | 更新时间 |

**SQL 示例**：

```sql
CREATE TABLE members (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  phone VARCHAR(11) NOT NULL UNIQUE,
  total_visits INTEGER NOT NULL DEFAULT 0 CHECK (total_visits >= 0),
  total_duration_minutes INTEGER NOT NULL DEFAULT 0 CHECK (total_duration_minutes >= 0),
  last_visit_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_members_phone ON members(phone);
```

---

### 2.8 consumption_records（消费记录）

计时结束时自动生成的消费记录。

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGSERIAL | PK | 主键 |
| member_id | BIGINT | FK -> members.id, INDEX | 关联的会员 |
| reservation_id | BIGINT | FK -> reservations.id, UNIQUE | 关联的预约 |
| timer_session_id | BIGINT | FK -> timer_sessions.id, UNIQUE | 关联的计时会话 |
| visit_date | DATE | NOT NULL, INDEX | 到店日期 |
| check_in_time | TIMESTAMPTZ | NOT NULL | 到店时间 |
| check_out_time | TIMESTAMPTZ | NOT NULL | 离店时间 |
| duration_minutes | INTEGER | NOT NULL | 消费总时长（分钟） |
| has_coupon | BOOLEAN | NOT NULL, DEFAULT FALSE | 是否使用了团购券 |
| source | VARCHAR(20) | NOT NULL | 预约方式：customer / merchant / walk_in |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | 创建时间 |

**SQL 示例**：

```sql
CREATE TABLE consumption_records (
  id BIGSERIAL PRIMARY KEY,
  member_id BIGINT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  reservation_id BIGINT NOT NULL UNIQUE REFERENCES reservations(id) ON DELETE CASCADE,
  timer_session_id BIGINT NOT NULL UNIQUE REFERENCES timer_sessions(id) ON DELETE CASCADE,
  visit_date DATE NOT NULL,
  check_in_time TIMESTAMPTZ NOT NULL,
  check_out_time TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  has_coupon BOOLEAN NOT NULL DEFAULT FALSE,
  source VARCHAR(20) NOT NULL CHECK (source IN ('customer','merchant','walk_in')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_consumption_member ON consumption_records(member_id);
CREATE INDEX idx_consumption_visit_date ON consumption_records(visit_date);
```

---

### 2.9 merchant_accounts（商家账号）

用于 Web 后台登录。

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | SERIAL | PK | 主键 |
| username | VARCHAR(50) | NOT NULL, UNIQUE | 登录用户名 |
| password_hash | VARCHAR(255) | NOT NULL | bcrypt 加密密码 |
| wechat_openid | VARCHAR(64) | UNIQUE | 商家微信 OpenID（用于小程序端识别商家身份） |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | 更新时间 |

**SQL 示例**：

```sql
CREATE TABLE merchant_accounts (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  wechat_openid VARCHAR(64) UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

### 2.10 messages（消息记录 - V1 预留）

V1 仅建表，不实现实际发送逻辑。

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGSERIAL | PK | 主键 |
| recipient_type | VARCHAR(20) | NOT NULL | customer / merchant |
| recipient_id | VARCHAR(64) | NOT NULL | 接收方标识（openid 或 username） |
| scene | VARCHAR(50) | NOT NULL | 通知场景（见 PRD 5.7 节） |
| title | VARCHAR(100) | NOT NULL | 消息标题 |
| content | JSONB | NOT NULL | 消息内容（模板数据） |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'pending' | pending / sent / failed |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | 更新时间 |

**SQL 示例**：

```sql
CREATE TABLE messages (
  id BIGSERIAL PRIMARY KEY,
  recipient_type VARCHAR(20) NOT NULL CHECK (recipient_type IN ('customer','merchant')),
  recipient_id VARCHAR(64) NOT NULL,
  scene VARCHAR(50) NOT NULL,
  title VARCHAR(100) NOT NULL,
  content JSONB NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 3. 关键查询场景

### 3.1 查询某日期某时段的剩余容量

这是顾客预约和商家代约时最核心的查询，需在事务中执行以保证并发安全。

```sql
-- 输入：日期 $date, 时段开始 $slot_start
-- 1. 获取门店总桌位
SELECT table_count FROM store WHERE id = 1;

-- 2. 统计已占用桌位（pending + confirmed + in_progress 状态）
SELECT COUNT(*) AS occupied
FROM reservations
WHERE reservation_date = $date
  AND slot_start_time = $slot_start
  AND status IN ('pending', 'confirmed', 'in_progress');

-- 剩余容量 = table_count - occupied
```

**并发安全**：使用 PostgreSQL 行级锁或 `SELECT ... FOR UPDATE` 确保不超卖。

### 3.2 查询顾客同日期同时段是否已有预约

```sql
SELECT COUNT(*) FROM reservations
WHERE customer_openid = $openid
  AND reservation_date = $date
  AND slot_start_time = $slot_start
  AND status NOT IN ('cancelled', 'rejected');
```

### 3.3 计时看板查询

```sql
SELECT
  ts.id,
  r.customer_name,
  ts.table_number,
  r.slot_start_time,
  r.slot_end_time,
  ts.check_in_time,
  ts.original_duration_minutes,
  ts.total_extension_minutes,
  ts.status,
  EXTRACT(EPOCH FROM (
    (ts.check_in_time + (ts.original_duration_minutes + ts.total_extension_minutes) * INTERVAL '1 minute')
    - NOW()
  )) AS remaining_seconds
FROM timer_sessions ts
JOIN reservations r ON r.id = ts.reservation_id
WHERE ts.status = 'active'
ORDER BY remaining_seconds ASC;
```

### 3.4 待确认预约超时自动取消

```sql
-- 定时任务每分钟执行
-- 找到需要自动取消的预约
SELECT r.id
FROM reservations r
JOIN reservation_rules rr ON rr.id = 1
WHERE r.status = 'pending'
  AND rr.auto_cancel_hours IS NOT NULL
  AND rr.require_confirmation = TRUE
  AND (r.reservation_date + r.slot_start_time::INTERVAL)
      - NOW() < (rr.auto_cancel_hours || ' hours')::INTERVAL;

-- 将查询到的预约状态改为 cancelled
UPDATE reservations
SET status = 'cancelled',
    cancel_reason = '系统自动取消（超时未确认）',
    updated_at = NOW()
WHERE id = ANY($ids);
```

### 3.5 会员搜索

```sql
-- 按手机号精确搜索
SELECT * FROM members WHERE phone = $phone;

-- 按姓名模糊搜索
SELECT * FROM members WHERE name LIKE '%' || $keyword || '%';
```

### 3.6 会员历史消费记录

```sql
SELECT
  cr.id,
  cr.visit_date,
  cr.check_in_time,
  cr.check_out_time,
  cr.duration_minutes,
  cr.has_coupon,
  cr.source,
  cr.created_at
FROM consumption_records cr
WHERE cr.member_id = $member_id
ORDER BY cr.visit_date DESC, cr.check_in_time DESC
LIMIT $page_size OFFSET ($page - 1) * $page_size;
```

---

## 4. 初始化数据 (Seed)

开发/演示环境需要预置以下数据：

```sql
-- 1. 门店配置（初始值，商家可在后台修改）
INSERT INTO store (id, name, address, phone, photos, open_time, close_time, table_count)
VALUES (1, '我的拼豆店', '请配置门店地址', '13800000000', '[]', '10:00', '22:00', 8);

-- 2. 预约规则（初始值）
INSERT INTO reservation_rules (id)
VALUES (1);

-- 3. 商家账号（初始密码: admin123，需上线后修改）
-- bcrypt hash of 'admin123'
INSERT INTO merchant_accounts (username, password_hash)
VALUES ('admin', '$2b$10$...');
```

---

## 5. 文档修订记录

| 版本 | 日期 | 修改内容 | 修改人 |
|------|------|----------|--------|
| v1.0 | 2026-05-11 | 初稿创建 | architect |

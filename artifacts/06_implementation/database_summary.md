# 拼豆店预约计时小程序 — 数据库实现总结

## 文档信息

| 项目 | 内容 |
|------|------|
| 文档版本 | v1.0 |
| 创建日期 | 2026-05-11 |
| 负责 Agent | database-dev |
| 输入来源 | database_design.md v1.0、task_list.md v1.0 |

---

## 1. 创建或修改了哪些表

严格按照 `database_design.md` 创建了以下 10 张表：

| 序号 | 表名 | 用途 | 记录数特征 |
|:---:|------|------|:---:|
| 1 | `store` | 门店信息 | 单行（V1 单门店） |
| 2 | `reservation_rules` | 预约规则 | 单行（V1 单套规则） |
| 3 | `merchant_accounts` | 商家账号 | 少数（管理员账户） |
| 4 | `reservations` | 预约记录 | 核心业务表，持续增长 |
| 5 | `timer_sessions` | 计时会话 | 与 reservation 1:1 |
| 6 | `timer_extensions` | 加时记录 | 一次计时可多条 |
| 7 | `coupons` | 团购券核销记录 | 一次计时可多条 |
| 8 | `members` | 会员档案 | 按手机号唯一 |
| 9 | `consumption_records` | 消费记录 | 计时结束时自动生成 |
| 10 | `messages` | 消息通知记录 | V1 预留，仅记录不发送 |

### 与数据库设计文档的差异说明

完全一致，无差异。所有字段名、类型、约束、默认值均直接取自 `database_design.md` 的 SQL 示例。

### 关于用户任务列表中表名的说明

用户任务列表提到的表名（`stores`, `tables`, `reservation_logs`, `visit_history`, `coupon_records`, `notification_logs`）与 `database_design.md` 中的正式表名有出入。本实现以 `database_design.md`（架构师产出的正式设计文档）为准，原因：
- `database_design.md` 包含完整 DDL、索引策略、查询场景，是经过文档化评审的产物
- `tables`（桌位表）在 V1 不需要独立表 —— 桌位通过 `store.table_count` 管理总数，`timer_sessions.table_number` 分配具体编号
- `reservation_logs`（操作日志）在 PRD 中明确列入 V2 范围，V1 不做
- 其他表名差异仅为命名风格不同（单数 vs 复数），实体含义完全对应

---

## 2. 关键字段说明

### 2.1 预约状态流转（reservations.status）

```
pending ──(商家确认)──> confirmed ──(到店登记)──> in_progress ──(结束计时)──> completed
   │                       │
   ├──(商家拒绝)──> rejected   └──(顾客取消)──> cancelled
   │
   └──(顾客取消/自动取消)──> cancelled
```

状态枚举通过 PostgreSQL 原生 ENUM 类型实现，TypeORM 侧对应 `ReservationStatus` 枚举。

### 2.2 容量管理（核心并发安全逻辑）

容量通过以下字段组合控制：
- `store.table_count` — 门店总桌位数
- `reservations.reservation_date` + `slot_start_time` + `status` — 某时段已占用的预约数
- 有效占用状态：`pending`、`confirmed`、`in_progress`
- `cancelled` 和 `rejected` 状态释放容量

并发安全策略：使用 PostgreSQL `SELECT ... FOR UPDATE` 行级锁，在事务中完成容量查询和写入，防止超卖。

### 2.3 计时管理

| 关键字段 | 说明 |
|---------|------|
| `timer_sessions.check_in_time` | 实际到店时间（计时起点） |
| `timer_sessions.expected_end_time` | 预计结束时间（= check_in_time + original_duration + total_extension） |
| `timer_sessions.actual_end_time` | 实际离店时间（结束计时后写入） |
| `timer_sessions.original_duration_minutes` | 预约时段原始时长 |
| `timer_sessions.total_extension_minutes` | 累计加时时长 |
| `timer_extensions.extension_minutes` | 单次加时时长（每次加时记录一条） |

### 2.4 会员自动归集

`members.phone` 是会员唯一标识。计时结束时系统自动：
1. 按 `customer_phone` 查找或创建 `members` 记录
2. 更新 `total_visits`、`total_duration_minutes`、`last_visit_date`
3. 生成 `consumption_records` 消费记录

V1 无会员等级/积分/储值功能。

---

## 3. 表之间关系

| 关系 | 类型 | 实现方式 |
|------|:---:|------|
| `timer_sessions.reservation_id` -> `reservations.id` | 1:1 | FK + UNIQUE |
| `timer_extensions.timer_session_id` -> `timer_sessions.id` | N:1 | FK + CASCADE DELETE |
| `coupons.timer_session_id` -> `timer_sessions.id` | N:1 | FK + CASCADE DELETE |
| `consumption_records.member_id` -> `members.id` | N:1 | FK + CASCADE DELETE |
| `consumption_records.reservation_id` -> `reservations.id` | 1:1 | FK + UNIQUE |
| `consumption_records.timer_session_id` -> `timer_sessions.id` | 1:1 | FK + UNIQUE |
| `reservations.customer_phone` -> `members.phone` | 逻辑关联 | 非数据库外键，业务层按手机号归集 |

**外键级联规则**：所有外键均使用 `ON DELETE CASCADE`，删除预约时自动删除关联的计时会话、加时记录、消费记录和团购券记录。

---

## 4. 索引说明

### 4.1 已创建的索引

| 索引名 | 表 | 列 | 用途 |
|--------|------|------|------|
| `idx_reservations_customer_openid` | reservations | customer_openid | 顾客按 OpenID 查询自己的预约 |
| `idx_reservations_customer_phone` | reservations | customer_phone | 商家按手机号搜索预约 |
| `idx_reservations_date_status` | reservations | reservation_date, status | 按日期+状态筛选（容量统计、商家列表） |
| `idx_reservations_date_slot` | reservations | reservation_date, slot_start_time | 按日期+时段排序（容量查询、时段列表） |
| `idx_timer_sessions_status` | timer_sessions | status | 计时看板查询进行中的会话 |
| `idx_timer_extensions_session` | timer_extensions | timer_session_id | 按计时会话查询加时历史 |
| `idx_coupons_session` | coupons | timer_session_id | 按计时会话查询关联团购券 |
| `idx_coupons_source` | coupons | coupon_source | 按券来源（美团/抖音/其他）筛选 |
| `idx_members_phone` | members | phone | 手机号精确搜索会员 |
| `idx_consumption_member` | consumption_records | member_id | 按会员查询消费历史 |
| `idx_consumption_visit_date` | consumption_records | visit_date | 按日期范围查询消费记录 |
| `idx_messages_recipient` | messages | recipient_type, recipient_id | 按接收方查询消息 |
| `idx_messages_status` | messages | status | 按发送状态筛选消息 |

### 4.2 无额外索引的表

- `store` — 单行表，无需索引
- `reservation_rules` — 单行表，无需索引
- `merchant_accounts` — 行数极少，username 和 wechat_openid 已有 UNIQUE 约束自带索引

---

## 5. 和后端接口的关系

### 5.1 表与 API 模块的对应

| 表 | NestJS 模块 | 主要 API 端点 |
|------|------|------|
| `store` | StoreModule | GET /api/store/info, PUT /api/store/config |
| `reservation_rules` | StoreModule (或独立 RulesModule) | GET /api/rules, PUT /api/rules |
| `merchant_accounts` | AuthModule | POST /api/auth/admin-login, POST /api/auth/wechat-login |
| `reservations` | ReservationModule | GET/POST /api/reservations, POST confirm/reject/cancel |
| `timer_sessions` | TimerModule | POST /api/timer/checkin, POST extend, POST end |
| `timer_extensions` | TimerModule | 嵌套在 timer service 中操作 |
| `coupons` | CouponModule | GET /api/coupons, 嵌套在 checkin 中写入 |
| `members` | MemberModule | GET /api/members, GET /api/members/:id |
| `consumption_records` | MemberModule | 嵌套在 member detail 中返回 |
| `messages` | MessageModule (V1 预留) | 无 Controller，仅 service 提供 createMessage() |

### 5.2 核心查询场景支持

所有 `database_design.md` 第 3 节定义的 6 个关键查询场景均已通过 Repository 方法支持：

1. **容量查询** — `ReservationRepository.countOccupied()` / `countOccupiedForUpdate()`
2. **重复预约检查** — `ReservationRepository.hasExistingReservation()`
3. **计时看板** — `TimerSessionRepository.findActiveSessions()`
4. **自动取消** — `ReservationRepository.findPendingToAutoCancel()`
5. **会员搜索** — `MemberRepository.findByPhone()` / `searchByName()`
6. **消费历史** — `ConsumptionRecordRepository.findByMemberId()`

---

## 6. 风险和注意事项

### 6.1 并发安全

- **风险**：高并发下同时间段最后一个空位可能被多人同时预约，造成超卖。
- **对策**：Repository 中提供了 `countOccupiedForUpdate()` 方法，使用 PostgreSQL `SELECT ... FOR UPDATE` 行级锁。后端 Service 层必须在事务中先获取锁再写入。

### 6.2 种子数据密码

- **风险**：`init.sql` 中硬编码了 bcrypt hash，但该 hash 仅作占位。
- **对策**：生产部署时应使用 `seed.ts`（TypeScript 版本），运行时通过 `bcrypt.hash()` 生成真实的随机 salt hash。上线后立即修改默认密码。

### 6.3 ENUM 类型维护

- **风险**：PostgreSQL 原生 ENUM 类型不支持直接删除值，只能新增。
- **对策**：V1 的状态枚举已经过充分设计，覆盖了所有业务流程。未来如需新增状态，使用 `ALTER TYPE ... ADD VALUE` 即可。

### 6.4 单行表约束

- **风险**：`store` 和 `reservation_rules` 使用了 `CHECK (id = 1)` 约束，限制只能插入 id=1 的行。
- **对策**：V2 如需支持多门店，需删除此约束并修改表结构。

### 6.5 数据量预估

| 表 | V1 预估日增量 | 年预估量 |
|------|:---:|:---:|
| reservations | 20-50 条 | 7k-18k |
| timer_sessions | 15-40 条 | 5k-14k |
| timer_extensions | 5-15 条 | 2k-5k |
| coupons | 10-30 条 | 4k-11k |
| members | 3-8 条 | 1k-3k |
| consumption_records | 15-40 条 | 5k-14k |

所有表均为轻量级，V1 单机 PostgreSQL 完全可以承载，无需分表或读写分离。

### 6.6 字符集和时区

- 数据库字符集使用 UTF8（PostgreSQL 默认）
- 所有时间字段使用 `TIMESTAMPTZ`（含时区），应用层统一使用 `Asia/Shanghai` 时区
- 日期字段使用 `DATE` 类型，不含时区信息

### 6.7 V1 不做但已预留

- `messages` 表已创建，提供了 `MessageRepository.createMessage()` 方法，各模块可直接调用记录消息，但 V1 不实现实际发送
- `coupons` 的 `coupon_source` 枚举已包含 `meituan`/`douyin`/`other`，V2 对接第三方 API 时无需改表

---

## 7. 交付物清单

| 文件 | 路径 | 任务 |
|------|------|:---:|
| 初始迁移 SQL | `workspace/server/src/database/migrations/001_initial_schema.sql` | DB-01 |
| 种子数据脚本 | `workspace/server/src/database/seeds/seed.ts` | DB-02 |
| Store Entity | `workspace/server/src/database/entities/store.entity.ts` | DB-03 |
| ReservationRule Entity | `workspace/server/src/database/entities/reservation-rule.entity.ts` | DB-03 |
| MerchantAccount Entity | `workspace/server/src/database/entities/merchant-account.entity.ts` | DB-03 |
| Reservation Entity | `workspace/server/src/database/entities/reservation.entity.ts` | DB-03 |
| TimerSession Entity | `workspace/server/src/database/entities/timer-session.entity.ts` | DB-03 |
| TimerExtension Entity | `workspace/server/src/database/entities/timer-extension.entity.ts` | DB-03 |
| Coupon Entity | `workspace/server/src/database/entities/coupon.entity.ts` | DB-03 |
| Member Entity | `workspace/server/src/database/entities/member.entity.ts` | DB-03 |
| ConsumptionRecord Entity | `workspace/server/src/database/entities/consumption-record.entity.ts` | DB-03 |
| Message Entity | `workspace/server/src/database/entities/message.entity.ts` | DB-03 |
| Entities 索引 | `workspace/server/src/database/entities/index.ts` | DB-03 |
| 数据库模块配置 | `workspace/server/src/database/database.module.ts` | DB-04 |
| DataSource 配置 | `workspace/server/src/database/data-source.ts` | DB-04 |
| Base Repository | `workspace/server/src/database/repositories/base.repository.ts` | DB-05 |
| Store Repository | `workspace/server/src/database/repositories/store.repository.ts` | DB-05 |
| ReservationRule Repository | `workspace/server/src/database/repositories/reservation-rule.repository.ts` | DB-05 |
| MerchantAccount Repository | `workspace/server/src/database/repositories/merchant-account.repository.ts` | DB-05 |
| Reservation Repository | `workspace/server/src/database/repositories/reservation.repository.ts` | DB-05 |
| TimerSession Repository | `workspace/server/src/database/repositories/timer-session.repository.ts` | DB-05 |
| TimerExtension Repository | `workspace/server/src/database/repositories/timer-extension.repository.ts` | DB-05 |
| Coupon Repository | `workspace/server/src/database/repositories/coupon.repository.ts` | DB-05 |
| Member Repository | `workspace/server/src/database/repositories/member.repository.ts` | DB-05 |
| ConsumptionRecord Repository | `workspace/server/src/database/repositories/consumption-record.repository.ts` | DB-05 |
| Message Repository | `workspace/server/src/database/repositories/message.repository.ts` | DB-05 |
| Repositories 索引 | `workspace/server/src/database/repositories/index.ts` | DB-05 |
| 数据库模块导出 | `workspace/server/src/database/index.ts` | — |
| Docker 初始化 SQL | `database/init.sql` | — |
| 实现总结（本文件） | `artifacts/06_implementation/database_summary.md` | — |

**共 29 个文件**，覆盖 DB-01 到 DB-05 全部 5 个任务的输出要求。

---

## 文档修订记录

| 版本 | 日期 | 修改内容 | 修改人 |
|------|------|----------|--------|
| v1.0 | 2026-05-11 | 初稿创建 | database-dev |

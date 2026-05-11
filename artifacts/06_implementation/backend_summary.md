# 后端 API 开发总结 — 拼豆店预约计时小程序

## 文档信息

| 项目 | 内容 |
|------|------|
| 文档版本 | v1.0 |
| 创建日期 | 2026-05-11 |
| 负责 Agent | backend-dev |
| 对应任务 | API-01 至 API-12 |

---

## 1. 完成了哪些接口

### 1.1 项目基础设施 (API-01)

**输出文件**：
- `workspace/server/package.json` — 项目依赖配置（NestJS 10.x, TypeORM 0.3.x, PostgreSQL, JWT, bcrypt 等）
- `workspace/server/tsconfig.json` — TypeScript 编译配置
- `workspace/server/tsconfig.build.json` — 构建配置
- `workspace/server/nest-cli.json` — NestJS CLI 配置
- `workspace/server/.env.example` — 环境变量模板
- `workspace/server/.env` — 开发环境变量
- `workspace/server/src/main.ts` — 应用入口（CORS、全局管道、Swagger、端口监听）
- `workspace/server/src/app.module.ts` — 根模块（导入所有业务模块和全局守卫/过滤器/拦截器）

**全局组件**：
- `src/common/interceptors/response.interceptor.ts` — 统一响应格式 `{ code: 0, message: "ok", data: ... }`
- `src/common/filters/http-exception.filter.ts` — 统一异常处理（错误码分类 1xxxx/2xxxx/3xxxx/4xxxx/5xxxx）
- `src/common/dto/pagination.dto.ts` — 分页 DTO 基类
- `src/common/decorators/current-user.decorator.ts` — `@CurrentUser()` 参数装饰器
- `src/common/decorators/public.decorator.ts` — `@Public()` 标记公开接口
- `src/common/decorators/roles.decorator.ts` — `@Roles()` 角色控制
- `src/common/guards/jwt-auth.guard.ts` — JWT 认证守卫（默认全部需要认证）
- `src/common/guards/roles.guard.ts` — 角色守卫
- `src/common/guards/ownership.guard.ts` — 数据归属权守卫

### 1.2 认证模块 (API-02)

**输出文件**：
- `src/modules/auth/auth.module.ts`
- `src/modules/auth/auth.controller.ts`
- `src/modules/auth/auth.service.ts`
- `src/modules/auth/auth.dto.ts`
- `src/modules/auth/jwt.strategy.ts`
- `src/config/jwt.config.ts`
- `src/config/wechat.config.ts`

**接口**：
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/wechat-login` | 微信小程序登录（开发环境 mock） |
| POST | `/api/auth/admin-login` | Web 后台账密登录 |
| POST | `/api/auth/refresh-token` | 刷新 JWT Token |

### 1.3 门店模块 (API-03)

**输出文件**：
- `src/modules/store/store.module.ts`
- `src/modules/store/store.controller.ts`
- `src/modules/store/store.service.ts`
- `src/modules/store/store.dto.ts`

**接口**：
| 方法 | 路径 | 认证 | 说明 |
|------|------|:--:|------|
| GET | `/api/store/info` | P | 门店公开信息（含今日是否营业、可预约数） |
| GET | `/api/store/config` | M | 门店完整配置 |
| PUT | `/api/store/config` | M | 更新门店配置（含照片校验 1-9 张） |
| GET | `/api/rules` | M | 获取预约规则 |
| PUT | `/api/rules` | M | 更新预约规则 |

### 1.4 预约模块 - 顾客端 (API-04)

**输出文件**：
- `src/modules/reservation/reservation.module.ts`
- `src/modules/reservation/reservation.controller.ts`
- `src/modules/reservation/reservation.service.ts`
- `src/modules/reservation/reservation.dto.ts`

**接口**：
| 方法 | 路径 | 认证 | 说明 |
|------|------|:--:|------|
| GET | `/api/reservations/slots` | P | 查询可预约时段（含容量、截止、过期状态） |
| POST | `/api/reservations` | C/M | 创建预约（事务 + 行级锁防超卖） |
| GET | `/api/reservations/my` | C | 我的预约列表（含状态筛选） |
| GET | `/api/reservations/:id` | C/M | 预约详情（含计时会话信息） |
| POST | `/api/reservations/:id/cancel` | C/M | 取消预约（顾客有时间限制，商家无） |

### 1.5 预约模块 - 商家端 (API-05)

**接口**（在同一 ReservationController 中）：
| 方法 | 路径 | 认证 | 说明 |
|------|------|:--:|------|
| GET | `/api/reservations/merchant` | M | 商家预约列表（日期/状态/搜索筛选+汇总） |
| POST | `/api/reservations/merchant` | M | 商家代客预约（source=merchant，直接确认） |
| POST | `/api/reservations/:id/confirm` | M | 确认预约 |
| POST | `/api/reservations/:id/reject` | M | 拒绝预约（释放容量） |

### 1.6 容量管理 (API-06)

| 方法 | 路径 | 认证 | 说明 |
|------|------|:--:|------|
| GET | `/api/admin/capacity` | M | 当日容量概况（时段/总桌位/已预约/剩余） |

### 1.7 计时模块 (API-06/API-08)

**输出文件**：
- `src/modules/timer/timer.module.ts`
- `src/modules/timer/timer.controller.ts`
- `src/modules/timer/timer.service.ts`
- `src/modules/timer/timer.dto.ts`

**接口**：
| 方法 | 路径 | 认证 | 说明 |
|------|------|:--:|------|
| POST | `/api/reservations/:id/checkin` | M | 到店登记（创建计时会话 + 可选团购券） |
| GET | `/api/timer/dashboard` | M | 计时看板（按剩余时间升序排列） |
| POST | `/api/timer/:sessionId/extend` | M | 加时操作 |
| POST | `/api/timer/:sessionId/end` | M | 结束计时（沉淀会员+消费记录） |
| PUT | `/api/timer/:sessionId/table` | M | 更换桌位 |

### 1.8 会员模块 (API-07)

**输出文件**：
- `src/modules/member/member.module.ts`
- `src/modules/member/member.controller.ts`
- `src/modules/member/member.service.ts`
- `src/modules/member/member.dto.ts`

**接口**：
| 方法 | 路径 | 认证 | 说明 |
|------|------|:--:|------|
| GET | `/api/members` | M | 会员搜索（手机号精确/姓名模糊） |
| GET | `/api/members/:id` | M | 会员详情（含消费记录分页） |

### 1.9 团购券模块 (API-08)

**输出文件**：
- `src/modules/coupon/coupon.module.ts`
- `src/modules/coupon/coupon.controller.ts`
- `src/modules/coupon/coupon.service.ts`
- `src/modules/coupon/coupon.dto.ts`

**接口**：
| 方法 | 路径 | 认证 | 说明 |
|------|------|:--:|------|
| GET | `/api/coupons` | M | 团购券核销记录（来源/日期范围筛选） |

### 1.10 定时任务 (API-09)

**输出文件**：
- `src/modules/scheduler/scheduler.module.ts`
- `src/modules/scheduler/scheduler.service.ts`

**功能**：每 5 分钟检查一次，自动取消超时未确认的预约。使用 `@nestjs/schedule` 的 `@Cron` 装饰器。

### 1.11 消息模块 (API-10 - V1 预留)

**输出文件**：
- `src/modules/message/message.module.ts`
- `src/modules/message/message.service.ts`

**功能**：`createMessage()` 方法供其他模块调用，仅写入 `messages` 表，不实际发送。

### 1.12 文件上传 (API-11)

**输出文件**：
- `src/modules/upload/upload.module.ts`
- `src/modules/upload/upload.controller.ts`

**接口**：
| 方法 | 路径 | 认证 | 说明 |
|------|------|:--:|------|
| POST | `/api/upload/image` | M | 上传门店照片（jpg/png/webp，最大 2MB） |

**说明**：API-11 (Nginx/NestJS 部署) 和 API-12 (Docker Compose 编排) 属于基础设施，由 database-dev 的 DB-05 和后续部署任务负责，暂未在本次开发中实现 NestJS 侧的 Docker 配置。

---

## 2. 实现了哪些业务规则

### 2.1 预约创建容量校验（核心规则）

- 在 PostgreSQL 事务中使用 `SELECT ... FOR UPDATE`（`pessimistic_write` 锁）锁定该时段的预约记录
- 统计 `pending + confirmed + in_progress` 状态的预约数，与 `store.table_count` 比较
- 容量不足时返回错误码 `30001`（时段已约满）
- 确保并发场景下不超卖

### 2.2 重复预约检查

- 同一 `openid + 日期 + 时段` 已有有效预约时阻止重复创建
- 返回错误码 `30002`（您在该时段已有预约）

### 2.3 预约状态机

完整实现 6 种状态的流转：
```
pending ──(商家确认)──> confirmed ──(到店登记)──> in_progress ──(结束计时)──> completed
   │                       │
   ├──(商家拒绝)──> rejected   └──(顾客取消/商家取消)──> cancelled
   │
   └──(顾客取消/自动取消)──> cancelled
```

每次状态变更都校验当前状态是否允许该操作（错误码 `30005`）。

### 2.4 自动确认 vs 需确认模式

- `require_confirmation = false`：顾客预约后状态直接为 `confirmed`
- `require_confirmation = true`：顾客预约后状态为 `pending`，需商家确认
- 商家代客预约始终为 `confirmed`

### 2.5 时段生成逻辑

- 从 `store.open_time` 到 `store.close_time`，按 `rules.slot_duration` 生成时段
- 每个时段判断：是否可预约、是否已过时、是否已截止
- 休息日不生成时段列表

### 2.6 营业日期和截止校验

- 休息日不可预约（错误码 `20003`）
- 超出 `advance_days` 不可预约（错误码 `20004`）
- 时段开始前 `cutoff_minutes` 内不可预约
- 已过去的时段不可预约

### 2.7 顾客取消时限

- 根据 `customer_cancel_hours` 判断是否允许顾客自行取消
- 超时返回错误码 `30003`

### 2.8 商家取消无限制

- 商家可以取消任何 `pending` 或 `confirmed` 状态的预约（客服场景）
- 无需检查取消时限

### 2.9 到店登记规则

- 仅 `confirmed` 状态的预约可登记（错误码 `30005`）
- 仅当日预约可登记（错误码 `20006`）
- 桌位号支持自定义或自动分配最小可用号
- 可同时录入多张团购券

### 2.10 计时看板排序

- 按剩余时间升序排列（最快要到期的在最前）
- 剩余 < 15 分钟标记为 `is_urgent`
- 剩余 < 5 分钟标记为 `is_critical`
- 倒计时到 0 不自动结束，必须商家手动操作

### 2.11 结束计时 - 自动沉淀

在事务中执行：
1. 更新 `timer_sessions.status = completed`
2. 更新 `reservations.status = completed`
3. 按手机号查找或创建 `members` 记录
4. 更新会员统计：`total_visits + 1`、`total_duration_minutes += duration`、`last_visit_date`
5. 创建 `consumption_records` 记录

### 2.12 手机号脱敏

- 列表场景（商家预约列表、会员搜索列表、团购券列表）：中间 4 位替换为 `****`，返回 `customer_phone` 字段
- 详情场景（预约详情、会员详情）：同时返回 `customer_phone`（脱敏）和 `customer_phone_full`（完整）
- 顾客查看自己的预约：返回完整手机号（通过 `customer_phone` 字段）

### 2.13 定时自动取消

- 每 5 分钟执行一次
- 仅当 `require_confirmation = true` 且 `auto_cancel_hours` 不为 null 时生效
- 在事务中批量更新超时预约的状态为 `cancelled`

### 2.14 错误码覆盖

| 错误码 | 场景 |
|--------|------|
| 10001 | 未登录（JWT Guard 自动返回 401 → 过滤器转换为 10001） |
| 10003 | 无权限 / 用户名或密码错误 |
| 20001 | 参数缺失 / 手机号校验失败 |
| 20002 | 参数格式错误 / 照片数量校验 |
| 20003 | 非营业日期 |
| 20004 | 预约日期超出范围 |
| 20006 | 预约日期不是今天 |
| 30001 | 时段已约满 / 桌位已被占用 |
| 30002 | 重复预约 |
| 30003 | 超过取消时间 |
| 30004 | 该预约不属于您 |
| 30005 | 状态不允许此操作 |
| 40001 | 门店不存在 |
| 40002 | 预约不存在 |
| 40003 | 会员不存在 |
| 50001 | 服务器内部错误 |
| 50002 | 数据库错误 |

---

## 3. 数据库依赖

所有实体和 Repository 已由 database-dev 预创建：

| 表 | Entity | Repository |
|----|--------|------------|
| store | `Store` | `StoreRepository` |
| reservation_rules | `ReservationRule` | `ReservationRuleRepository` |
| reservations | `Reservation` | `ReservationRepository` |
| timer_sessions | `TimerSession` | `TimerSessionRepository` |
| timer_extensions | `TimerExtension` | `TimerExtensionRepository` |
| coupons | `Coupon` | `CouponRepository` |
| members | `Member` | `MemberRepository` |
| consumption_records | `ConsumptionRecord` | `ConsumptionRecordRepository` |
| merchant_accounts | `MerchantAccount` | `MerchantAccountRepository` |
| messages | `Message` | `MessageRepository` |

数据库模块 `DatabaseModule` 为全局模块 (`@Global()`)，所有 Repository 自动注入到各 Service。

---

## 4. 和前端约定的字段

### 4.1 统一响应格式

```typescript
// 成功
{ code: 0, message: "ok", data: T }

// 错误
{ code: number, message: string, data: null }
```

### 4.2 分页格式

```typescript
// 请求
{ page?: number, page_size?: number }

// 响应
{
  list: T[],
  pagination: {
    page: number,
    page_size: number,
    total: number,
    total_pages: number
  }
}
```

### 4.3 关键枚举值（与数据库枚举一致）

**预约状态 (status)**：`pending` | `confirmed` | `in_progress` | `completed` | `cancelled` | `rejected`

**预约来源 (source)**：`customer` | `merchant` | `walk_in`

**计时状态**：`active` | `completed`

**团购券来源**：`meituan` | `douyin` | `other`

### 4.4 时段查询返回字段

```typescript
{
  start_time: string,      // "14:00"
  end_time: string,        // "15:00"
  total_tables: number,    // 总桌位
  booked_count: number,    // 已预约
  available_count: number, // 可预约
  is_available: boolean,   // 是否可预约
  is_past: boolean,        // 是否已过时
  is_cutoff: boolean       // 是否已截止
}
```

### 4.5 计时看板返回字段

```typescript
{
  active_count: number,
  available_tables: number,
  sessions: [{
    id: number,
    customer_name: string,
    table_number: number,
    remaining_seconds: number,
    is_urgent: boolean,    // < 15分钟
    is_critical: boolean   // < 5分钟
  }]
}
```

### 4.6 手机号脱敏规则

- 列表场景：`customer_phone: "138****5678"` (脱敏)
- 详情场景：`customer_phone: "138****5678"` + `customer_phone_full: "13800005678"` (脱敏+完整)

---

## 5. 还有哪些未完成

### 5.1 部署相关 (API-11, API-12)

- NestJS Dockerfile 和 Nginx 配置未创建（属于部署阶段任务）
- Docker Compose 编排未更新（database-dev 已创建 DB-05 的基础配置）

### 5.2 测试 (QA-01, QA-02)

- 后端单元测试（Vitest/Jest）未编写
- 后端 E2E 测试未编写

### 5.3 微信真实对接

- `wechatLogin()` 方法在开发环境使用 mock，生产环境需配置 `WECHAT_APP_ID` 和 `WECHAT_APP_SECRET`
- 微信订阅消息推送（V2 功能）

### 5.4 CORS 精确配置

- 当前使用环境变量配置 CORS origins，部署时需更新为实际的域名

### 5.5 Swagger 文档装饰完善

- 部分 DTO 的 `@ApiProperty` 装饰器可以更完善
- Response schema 可以使用 `@ApiResponse` 装饰器细化

### 5.6 API 路径差异

- 设计文档中的 `/admin/` 前缀路径与实际实现有差异（详见 `api_change_notes.md`），前端调用时需按照实际路径

---

## 6. 自测结果

### 6.1 编译通过

```
npx nest build — 0 errors, 0 warnings
```

TypeScript 编译成功，所有模块正常解析。

### 6.2 模块导入链验证

```
AppModule
  ├── ConfigModule (global)
  ├── ServeStaticModule (/uploads)
  ├── DatabaseModule (global)
  ├── SchedulerModule (@nestjs/schedule)
  ├── AuthModule (Passport + JWT)
  ├── StoreModule
  ├── ReservationModule
  ├── TimerModule
  ├── MemberModule
  ├── CouponModule
  ├── MessageModule
  └── UploadModule
```

全局守卫/过滤器/拦截器链：
```
Request → JwtAuthGuard → RolesGuard → Controller → ResponseInterceptor
                ↓ (exception)
           HttpExceptionFilter
```

### 6.3 依赖注入验证

所有 Service 中的 Repository 注入路径正确，均通过全局 `DatabaseModule` 的 exports 提供。

### 6.4 注意事项

- 需要先运行数据库 Migration/Seed 才能启动（`db:migration:run` → `db:seed`）
- 开发环境建议设置 `DB_SYNCHRONIZE=true` 自动同步表结构
- `bcrypt` 需要原生编译，确保系统已安装 `node-gyp` 所需工具链（Python, C++ compiler）

---

## 7. 文件清单

### 新建文件（按目录）

```
workspace/server/
├── package.json
├── tsconfig.json
├── tsconfig.build.json
├── nest-cli.json
├── .env.example
├── .env
├── uploads/                          (空目录，运行时存储上传文件)
└── src/
    ├── main.ts
    ├── app.module.ts
    ├── config/
    │   ├── index.ts
    │   ├── jwt.config.ts
    │   └── wechat.config.ts
    ├── common/
    │   ├── index.ts
    │   ├── dto/pagination.dto.ts
    │   ├── interceptors/response.interceptor.ts
    │   ├── filters/http-exception.filter.ts
    │   ├── decorators/
    │   │   ├── current-user.decorator.ts
    │   │   ├── public.decorator.ts
    │   │   └── roles.decorator.ts
    │   └── guards/
    │       ├── jwt-auth.guard.ts
    │       ├── roles.guard.ts
    │       └── ownership.guard.ts
    └── modules/
        ├── auth/
        │   ├── auth.module.ts
        │   ├── auth.controller.ts
        │   ├── auth.service.ts
        │   ├── auth.dto.ts
        │   └── jwt.strategy.ts
        ├── store/
        │   ├── store.module.ts
        │   ├── store.controller.ts
        │   ├── store.service.ts
        │   └── store.dto.ts
        ├── reservation/
        │   ├── reservation.module.ts
        │   ├── reservation.controller.ts
        │   ├── reservation.service.ts
        │   └── reservation.dto.ts
        ├── timer/
        │   ├── timer.module.ts
        │   ├── timer.controller.ts
        │   ├── timer.service.ts
        │   └── timer.dto.ts
        ├── member/
        │   ├── member.module.ts
        │   ├── member.controller.ts
        │   ├── member.service.ts
        │   └── member.dto.ts
        ├── coupon/
        │   ├── coupon.module.ts
        │   ├── coupon.controller.ts
        │   ├── coupon.service.ts
        │   └── coupon.dto.ts
        ├── scheduler/
        │   ├── scheduler.module.ts
        │   └── scheduler.service.ts
        ├── message/
        │   ├── message.module.ts
        │   └── message.service.ts
        └── upload/
            ├── upload.module.ts
            └── upload.controller.ts
```

### 修改的文件

| 文件 | 修改内容 |
|------|---------|
| `src/database/repositories/base.repository.ts` | `repo` getter 从 `protected` 改为 `public` |
| `src/database/repositories/coupon.repository.ts` | 修复 `recordCoupons` 方法中的 TypeScript 类型问题 |
| `src/common/decorators/current-user.decorator.ts` | 修复返回类型 |

---

## 文档修订记录

| 版本 | 日期 | 修改内容 | 修改人 |
|------|------|----------|--------|
| v1.0 | 2026-05-11 | 初稿，覆盖 API-01 至 API-12 全部任务 | backend-dev |

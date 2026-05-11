# 拼豆店预约计时小程序 — 开发任务清单

## 文档信息

| 项目 | 内容 |
|------|------|
| 文档版本 | v1.0 |
| 创建日期 | 2026-05-11 |
| 负责 Agent | planner |
| 输入来源 | PRD v1.0、页面清单 v1.0、用户流程 v1.0、验收标准 v1.0、系统架构设计 v1.0、项目结构 v1.0、数据库设计 v1.0、API 设计 v1.0、权限规则 v1.0、最终设计规则 v1.0 |

---

## 一、项目总任务概览

| 角色 | 任务数 | 负责内容 |
|------|:-----:|----------|
| database-dev | 5 | PostgreSQL 表创建、Entity 定义、Migration、Seed |
| backend-dev | 12 | NestJS 模块、API 端点、鉴权、定时任务、部署 |
| miniapp-dev | 16 | uni-app 小程序（用户端 5 页 + 商家端 8 页 + 公共层 + 组件） |
| merchant-web-dev | 12 | Vue 3 Web 后台（8 页 + 布局/组件/构建） |
| qa-tester | 6 | 单元测试、E2E 测试、UI 核验、性能测试 |
| code-reviewer | 5 | 数据库、后端、小程序、Web 代码审查 |
| **合计** | **56** | |

**优先级分布：**
- P0（核心流程，必须交付）：44 个任务
- P1（重要功能，应该交付）：10 个任务
- P2（辅助功能，最好交付）：2 个任务

---

## 二、数据库任务（database-dev）

### DB-01：TypeORM 数据源配置与连接

| 属性 | 内容 |
|------|------|
| **任务名称** | TypeORM DataSource 配置与 PostgreSQL 连接 |
| **负责 Agent** | database-dev |
| **依赖** | 无 |
| **输入文件** | `database_design.md`（全部 10 张表）、`system_design.md`（4.4 节）、`project_structure.md`（4 节 database/） |
| **输出位置** | `packages/server/src/database/data-source.ts`、`packages/server/src/config/database.config.ts` |
| **验收标准** | 能成功连接 PostgreSQL 并执行 `SELECT 1` |
| **优先级** | P0 |
| **可并行** | 否（后续所有任务依赖此任务） |
| **不能做** | 不要在此任务中创建 Entity 文件或写 Migration |

---

### DB-02：创建全部 Entity 文件（10 张表）

| 属性 | 内容 |
|------|------|
| **任务名称** | 创建 10 个 TypeORM Entity 文件 |
| **负责 Agent** | database-dev |
| **依赖** | DB-01 |
| **输入文件** | `database_design.md`（2.1-2.10 节，每张表的列名、类型、约束、默认值） |
| **输出位置** | `packages/server/src/modules/*/xxx.entity.ts`（store、reservation、timer、member、coupon、message、merchant-account 各 1 个，reservation-rules 1 个，timer-extension 1 个，consumption-record 1 个） |
| **验收标准** | 10 个 Entity 文件与数据库设计文档一一对应，列名、类型、约束、索引、默认值完全一致 |
| **优先级** | P0 |
| **可并行** | 否（依赖 DB-01） |
| **不能做** | 不要在此任务中写 Service 或 Controller |

---

### DB-03：生成并验证初始 Migration

| 属性 | 内容 |
|------|------|
| **任务名称** | 生成 TypeORM 初始 Migration 并在空库执行 |
| **负责 Agent** | database-dev |
| **依赖** | DB-02 |
| **输入文件** | `database_design.md`（全部 SQL 示例）、`project_structure.md`（4 节 migrations/） |
| **输出位置** | `packages/server/src/database/migrations/001_initial.ts` |
| **验收标准** | `migration:run` 在空 PostgreSQL 上成功创建全部 10 张表、所有索引、所有外键约束；`migration:revert` 能完整回滚 |
| **优先级** | P0 |
| **可并行** | 否（依赖 DB-02） |
| **不能做** | 不要手写 SQL 绕过 TypeORM Migration API |

---

### DB-04：编写种子数据脚本

| 属性 | 内容 |
|------|------|
| **任务名称** | 开发/演示环境 Seed 脚本 |
| **负责 Agent** | database-dev |
| **依赖** | DB-03 |
| **输入文件** | `database_design.md`（4 节初始化数据） |
| **输出位置** | `database/init.sql`（可独立执行的 SQL）、`packages/server/src/database/seeds/initial-seed.ts`（TypeORM 版本） |
| **验收标准** | 执行后 store 表有 1 行（默认门店）、reservation_rules 表有 1 行（默认规则）、merchant_accounts 表有 1 行（admin / admin123 bcrypt hash）；可重复执行不报错（幂等） |
| **优先级** | P0 |
| **可并行** | 否（依赖 DB-03） |
| **不能做** | 不要创建测试用的假的预约/会员数据 |

---

### DB-05：Docker Compose PostgreSQL 服务配置

| 属性 | 内容 |
|------|------|
| **任务名称** | Docker Compose 中配置 PostgreSQL 容器、Volume、初始化脚本 |
| **负责 Agent** | database-dev |
| **依赖** | DB-04 |
| **输入文件** | `system_design.md`（5 节部署架构）、`project_structure.md`（1 节 docker/） |
| **输出位置** | `docker/docker-compose.yml`（postgres 服务部分）、`docker/init-db.sh`（可选初始化辅助脚本） |
| **验收标准** | `docker compose up postgres` 启动后数据库可连接，init.sql 自动执行，数据通过 Volume 持久化 |
| **优先级** | P0 |
| **可并行** | 否（依赖 DB-04） |
| **不能做** | 不要在此任务中配置 Nginx 或 NestJS 服务 |

---

## 三、后端 API 任务（backend-dev）

### API-01：NestJS 项目脚手架与公共模块

| 属性 | 内容 |
|------|------|
| **任务名称** | NestJS 项目初始化、根模块、全局过滤器/拦截器/管道 |
| **负责 Agent** | backend-dev |
| **依赖** | DB-01（需要 data-source.ts 存在即可，不要求 Migration 完成） |
| **输入文件** | `project_structure.md`（4 节 server/）、`api_design.md`（2 节通用规范：统一响应格式、错误码、分页、时间格式） |
| **输出位置** | `packages/server/src/main.ts`、`app.module.ts`、`common/filters/http-exception.filter.ts`、`common/interceptors/response.interceptor.ts`、`common/dto/pagination.dto.ts`、`common/decorators/current-user.decorator.ts` |
| **验收标准** | 项目可启动监听 3000 端口；所有异常返回统一 JSON 格式 `{code, message, data}`；分页请求 DTO 可用 |
| **优先级** | P0 |
| **可并行** | 与 DB-02/DB-03 并行 |
| **不能做** | 不要在此任务中创建任何业务模块 |

---

### API-02：Auth 模块（微信登录 + Web 登录 + JWT）

| 属性 | 内容 |
|------|------|
| **任务名称** | 认证模块：微信 code 换 JWT、用户名密码登录、Token 刷新、JWT Strategy、Roles Guard |
| **负责 Agent** | backend-dev |
| **依赖** | API-01、DB-02（merchant_accounts entity 需存在） |
| **输入文件** | `api_design.md`（3.1 节认证模块 3 个端点）、`permission_rules.md`（2 节认证方式、4 节后端鉴权实现） |
| **输出位置** | `packages/server/src/modules/auth/auth.module.ts`、`auth.controller.ts`、`auth.service.ts`、`auth.dto.ts`、`jwt.strategy.ts`、`roles.guard.ts`；`packages/server/src/config/jwt.config.ts`、`wechat.config.ts` |
| **验收标准** | AC-F37（Web 登录成功返回 Token）、AC-F38（账密错误拒绝）、SEC-01（无 Token 返回 401）；POST /api/auth/wechat-login 接收 code 返回 role+token；POST /api/auth/admin-login 接收 username+password 返回 token；JWT payload 含 sub/role |
| **优先级** | P0 |
| **可并行** | 依赖 API-01 完成后可与后续模块并行 |
| **不能做** | V1 不要实现微信 code 换 openid 的完整对接（可用 mock）；不要实现复杂的刷新 Token 黑名单机制 |

---

### API-03：Store 模块（门店配置读写 + 公开信息）

| 属性 | 内容 |
|------|------|
| **任务名称** | 门店模块：公开信息查询、商家配置读写、照片上传 |
| **负责 Agent** | backend-dev |
| **依赖** | API-02（Auth/Guard 可用）、DB-02（store entity） |
| **输入文件** | `api_design.md`（3.2 节门店模块 3 个端点 + 3.9 节文件上传）、`database_design.md`（2.1 节 store 表） |
| **输出位置** | `packages/server/src/modules/store/store.module.ts`、`store.controller.ts`、`store.service.ts`、`store.dto.ts` |
| **验收标准** | AC-F01（GET /api/store/info 无需认证返回门店信息含营业状态和今日容量概况）、AC-F34（PUT /api/store/config 保存后 GET 验证返回更新值）、AC-F35（照片至少保留 1 张校验）；POST /api/upload/image 接收 multipart 文件返回 URL |
| **优先级** | P0 |
| **可并行** | 与 API-04/API-07 并行 |
| **不能做** | 不要在此任务中实现复杂的图片裁剪/压缩（V1 仅校验类型和大小） |

---

### API-04：Reservation 模块 — 顾客端

| 属性 | 内容 |
|------|------|
| **任务名称** | 预约模块顾客端：时段查询、创建预约、我的预约列表、预约详情、取消预约 |
| **负责 Agent** | backend-dev |
| **依赖** | API-03（需要门店营业时间和桌位数）、DB-02（reservations, reservation_rules entity） |
| **输入文件** | `api_design.md`（3.3 节：GET /reservations/slots、POST /reservations、GET /reservations/my、GET /reservations/:id、POST /reservations/:id/cancel）、`database_design.md`（2.3 节 reservations 表、3.1 节容量查询、3.2 节重复预约检查） |
| **输出位置** | `packages/server/src/modules/reservation/reservation.module.ts`、`reservation.controller.ts`（customer 部分）、`reservation.service.ts`（容量校验、创建、查询、取消）、`reservation.dto.ts` |
| **验收标准** | AC-F03（日期选择校验）、AC-F04（时段容量展示）、AC-F05（自动确认模式预约成功）、AC-F06（需确认模式预约待确认）、AC-F07（容量不足阻止）、AC-F08（同顾客同时段重复预约限制）、AC-F09（手机号校验）、AC-F10（我的预约列表）、AC-F11（状态筛选）、AC-F12（允许时间内取消）、AC-F13（超时阻止取消）、AC-F30（容量扣减与释放）、AC-F31（跨时段容量独立）、PERF-02（2 秒内响应） |
| **优先级** | P0 |
| **可并行** | 与 API-03 完成后，与 API-05/API-06 并行 |
| **不能做** | 不要在此任务中实现商家端的预约管理端点 |

---

### API-05：Reservation 模块 — 商家端

| 属性 | 内容 |
|------|------|
| **任务名称** | 预约模块商家端：全部预约列表、代客预约、确认预约、拒绝预约 |
| **负责 Agent** | backend-dev |
| **依赖** | API-04（共享 reservation.service 事务逻辑） |
| **输入文件** | `api_design.md`（3.3 节：GET /reservations/merchant、POST /reservations/merchant、POST /reservations/:id/confirm、POST /reservations/:id/reject） |
| **输出位置** | `packages/server/src/modules/reservation/reservation.controller.ts`（merchant 部分补充）、`reservation.service.ts`（merchant 方法补充） |
| **验收标准** | AC-F14（确认预约状态变更）、AC-F15（拒绝预约释放容量）、AC-F16（代客预约直接确认）、AC-F17（代约容量不足提示） |
| **优先级** | P0 |
| **可并行** | 与 API-06 并行（依赖 API-04 完成后） |
| **不能做** | 不要在此任务中修改顾客端预约逻辑 |

---

### API-06：Timer 模块（到店登记 + 计时 + 看板）

| 属性 | 内容 |
|------|------|
| **任务名称** | 计时模块：到店登记、加时、结束计时、计时看板 |
| **负责 Agent** | backend-dev |
| **依赖** | API-05（需要 reservation 状态为 confirmed 才能 checkin） |
| **输入文件** | `api_design.md`（3.4 节计时模块 3 个端点 + 3.5 节计时看板端点）、`database_design.md`（2.4 节 timer_sessions、2.5 节 timer_extensions、2.6 节 coupons） |
| **输出位置** | `packages/server/src/modules/timer/timer.module.ts`、`timer.controller.ts`、`timer.service.ts`、`timer.dto.ts` |
| **验收标准** | AC-F18（到店登记开始计时）、AC-F21（计时看板展示含排序和颜色状态）、AC-F22（加时操作更新剩余时间）、AC-F23（自定义加时）、AC-F24（结束计时释放桌位并沉淀消费记录）、AC-F25（倒计时到 0 不自动结束）、AC-F26（消费记录自动沉淀）、AC-F19（到店登记时录入团购券）、AC-F20（多张券录入） |
| **优先级** | P0 |
| **可并行** | 与 API-07 并行（依赖 API-05 完成后） |
| **不能做** | 不要在此任务中实现 WebSocket 实时推送（V1 用轮询）；不要实现自动计费 |

---

### API-07：Member 模块

| 属性 | 内容 |
|------|------|
| **任务名称** | 会员模块：会员搜索、会员详情与消费记录 |
| **负责 Agent** | backend-dev |
| **依赖** | API-06（会员数据由 timer end 时自动创建/更新） |
| **输入文件** | `api_design.md`（3.6 节会员模块 2 个端点）、`database_design.md`（2.7 节 members、2.8 节 consumption_records） |
| **输出位置** | `packages/server/src/modules/member/member.module.ts`、`member.controller.ts`、`member.service.ts`、`member.dto.ts` |
| **验收标准** | AC-F27（手机号精确搜索会员）、AC-F28（姓名模糊搜索）、AC-F29（无结果空态） |
| **优先级** | P0 |
| **可并行** | 与 API-08 并行 |
| **不能做** | 不要在此任务中实现会员等级/积分/储值功能（V2） |

---

### API-08：Coupon + Rules 模块

| 属性 | 内容 |
|------|------|
| **任务名称** | 团购券记录查询 + 预约规则读写 |
| **负责 Agent** | backend-dev |
| **依赖** | API-06（coupon 数据在 checkin 时写入） |
| **输入文件** | `api_design.md`（3.7 节团购券 1 个端点 + 3.8 节规则 2 个端点）、`database_design.md`（2.6 节 coupons、2.2 节 reservation_rules） |
| **输出位置** | `packages/server/src/modules/coupon/coupon.module.ts`、`coupon.controller.ts`、`coupon.service.ts`、`coupon.dto.ts`；`packages/server/src/modules/store/` 下新增 rules controller 和 service（或独立 rules 模块） |
| **验收标准** | AC-F36（预约需确认开关保存后影响后续预约）；GET /api/coupons 可按来源和日期范围筛选；GET /api/rules + PUT /api/rules 读写规则 |
| **优先级** | P1 |
| **可并行** | 与 API-07 并行 |
| **不能做** | 不要在此任务中修改 reservation 模块的规则读取逻辑（应已在 API-04 中通过 service 注入） |

---

### API-09：定时任务 — 预约自动取消

| 属性 | 内容 |
|------|------|
| **任务名称** | NestJS Scheduler：每分钟扫描待确认超时预约并自动取消 |
| **负责 Agent** | backend-dev |
| **依赖** | API-05（reservation service 需要 update status 方法） |
| **输入文件** | `api_design.md`（无独立端点，见 3.3 节 cancel 逻辑）、`database_design.md`（3.4 节 SQL 示例）、`user_flows.md`（流程 8 自动取消） |
| **输出位置** | `packages/server/src/modules/reservation/reservation-scheduler.ts` |
| **验收标准** | AC-F32（超时待确认预约自动取消并释放容量）、AC-F33（未超时不取消）；定时任务每分钟执行一次；在事务中批量更新 |
| **优先级** | P0 |
| **可并行** | 依赖 API-05 完成后 |
| **不能做** | 不要使用 cron 表达式之外的定时方案；不要处理已取消/已确认的预约 |

---

### API-10：Message 模块（V1 预留）

| 属性 | 内容 |
|------|------|
| **任务名称** | 消息模块：Entity + 基础 Service（V1 仅建表和接口预留，不实际发送） |
| **负责 Agent** | backend-dev |
| **依赖** | DB-02（messages entity） |
| **输入文件** | `database_design.md`（2.10 节 messages 表）、`api_design.md`（无 API 端点，PRD 5.7 节描述 7 个通知场景） |
| **输出位置** | `packages/server/src/modules/message/message.module.ts`、`message.entity.ts`、`message.service.ts` |
| **验收标准** | message 表可正常读写；service 提供 `createMessage()` 方法供其他模块调用以记录消息（但不实际发送） |
| **优先级** | P2 |
| **可并行** | 与 API-07/API-08 并行 |
| **不能做** | 不要对接微信订阅消息 API；不要创建消息相关的 Controller 端点 |

---

### API-11：Nginx 配置 + NestJS 部署

| 属性 | 内容 |
|------|------|
| **任务名称** | Nginx 反向代理配置、NestJS Dockerfile、环境变量注入 |
| **负责 Agent** | backend-dev |
| **依赖** | API-08（全部 API 模块完成后才能确定代理规则） |
| **输入文件** | `system_design.md`（4.1 节小程序通信、4.2 节 Web 通信、5 节部署架构）、`project_structure.md`（1 节 docker/） |
| **输出位置** | `docker/nginx.conf`、`docker/server.Dockerfile`、`packages/server/.env.example` |
| **验收标准** | Docker Compose 启动后 Nginx 正确代理 /api/* 到 NestJS:3000；/admin/* 指向 Web 后台静态文件；HTTPS 可配置 |
| **优先级** | P1 |
| **可并行** | 与前端任务并行 |
| **不能做** | 不要在此任务中硬编码 SSL 证书路径（使用环境变量） |

---

### API-12：Docker Compose 编排 + README

| 属性 | 内容 |
|------|------|
| **任务名称** | docker-compose.yml 完整编排、环境变量文件、项目 README |
| **负责 Agent** | backend-dev |
| **依赖** | DB-05、API-11 |
| **输入文件** | `system_design.md`（5 节完整部署架构） |
| **输出位置** | `docker/docker-compose.yml`（整合 nginx + server + postgres 三个服务）、`.env.example`（根目录）、`README.md`（根目录，含快速启动说明） |
| **验收标准** | `docker compose up -d` 一键启动全部服务；`docker compose ps` 显示三个服务均 healthy；`curl localhost/api/store/info` 返回门店信息 |
| **优先级** | P0 |
| **可并行** | 依赖 DB-05 和 API-11 完成后 |
| **不能做** | 不要使用 Docker Swarm/K8s 编排（V1 仅单机 Compose） |

---

## 四、微信小程序端任务（miniapp-dev）

### MP-01：uni-app 项目脚手架与全局配置

| 属性 | 内容 |
|------|------|
| **任务名称** | uni-app 项目初始化：pages.json、manifest.json、全局样式变量、SCSS 变量文件 |
| **负责 Agent** | miniapp-dev |
| **依赖** | 无 |
| **输入文件** | `project_structure.md`（2 节小程序结构、2.1 节 pages.json 路由）、`final_design_rules.md`（二节 Design Tokens 全部：色彩、字体、间距、圆角、阴影） |
| **输出位置** | `packages/miniprogram/src/pages.json`、`manifest.json`、`uni.scss`、`static/styles/variables.scss`、`static/styles/global.scss`、`App.vue`、`main.ts` |
| **验收标准** | 项目可编译为微信小程序；pages.json 包含全部 13 个页面路由；TabBar 配置正确（顾客端 2 个 tab）；CSS 变量覆盖设计规则中所有 Token；UI-01 视觉一致性基础建立 |
| **优先级** | P0 |
| **可并行** | 是（与 DB、后端任务完全并行） |
| **不能做** | 不要在此任务中写任何页面逻辑或组件 |

---

### MP-02：API 服务层（request 封装 + 全部 API 模块）

| 属性 | 内容 |
|------|------|
| **任务名称** | uni.request 拦截器封装 + 7 个 API 模块文件 |
| **负责 Agent** | miniapp-dev |
| **依赖** | MP-01 |
| **输入文件** | `api_design.md`（全部 21 个端点）、`permission_rules.md`（5.1 节小程序端权限控制、Token 注入） |
| **输出位置** | `packages/miniprogram/src/api/request.ts`、`auth.ts`、`store.ts`、`reservation.ts`、`timer.ts`、`member.ts`、`coupon.ts` |
| **验收标准** | request.ts 自动注入 Authorization header；Token 过期自动尝试 refresh；每个 API 模块的函数签名与 API 文档对应 |
| **优先级** | P0 |
| **可并行** | 与 MP-03 并行 |
| **不能做** | 不要在此任务中写 Pinia Store 或页面逻辑 |

---

### MP-03：Pinia 状态管理（4 个 Store）

| 属性 | 内容 |
|------|------|
| **任务名称** | user store、store store、reservation store、timer store |
| **负责 Agent** | miniapp-dev |
| **依赖** | MP-02 |
| **输入文件** | `project_structure.md`（2 节 api/ 和 store/ 目录）、`api_design.md`（各模块响应结构）、`permission_rules.md`（5.1 节角色切换） |
| **输出位置** | `packages/miniprogram/src/store/user.ts`、`store.ts`、`reservation.ts`、`timer.ts` |
| **验收标准** | user store 管理 token/role/openid/nickname 并提供 login/logout/switchRole；store store 缓存门店信息；reservation store 管理预约列表和当前预约；timer store 管理计时看板数据 |
| **优先级** | P0 |
| **可并行** | 与 MP-02 部分并行 |
| **不能做** | 不要在 Store 中直接调用 uni.request（必须通过 API 层） |

---

### MP-04：公共基础组件

| 属性 | 内容 |
|------|------|
| **任务名称** | AppNavbar、EmptyState、LoadingSkeleton、ConfirmDialog 四个公共组件 |
| **负责 Agent** | miniapp-dev |
| **依赖** | MP-01（样式变量已就绪） |
| **输入文件** | `final_design_rules.md`（4.6 节空态/加载态/错误态、4.5 节弹窗、3.1 节导航栏规范）、`project_structure.md`（2 节 components/common/） |
| **输出位置** | `packages/miniprogram/src/components/common/AppNavbar.vue`、`EmptyState.vue`、`LoadingSkeleton.vue`、`ConfirmDialog.vue` |
| **验收标准** | UI-05（空态占位图+引导文案）、UI-06（骨架屏 shimmer 动画）；弹窗从底部滑入 300ms；遮罩 rgba(61,44,46,0.5)；导航栏高度 88rpx、标题居中 34rpx |
| **优先级** | P0 |
| **可并行** | 与 MP-02/MP-03 并行 |
| **不能做** | 不要引入外部动效库；EmptyState 插图用 CSS/SVG 内联实现 |

---

### MP-05：顾客端专用组件

| 属性 | 内容 |
|------|------|
| **任务名称** | StoreBanner（门店轮播）、DateSelector（日期选择器）、SlotPicker（时段选择器）、ReservationCard（预约卡片）、StatusTag（状态标签） |
| **负责 Agent** | miniapp-dev |
| **依赖** | MP-01（样式变量）、MP-04（StatusTag 可提前做） |
| **输入文件** | `final_design_rules.md`（4.1 节按钮、4.2 节卡片、4.3 节选择器、4.4 节状态标签、5.1 节状态流转视觉映射、5.2 节卡片状态顶条）、`project_structure.md`（2 节 components/customer/） |
| **输出位置** | `packages/miniprogram/src/components/customer/StoreBanner.vue`、`DateSelector.vue`、`SlotPicker.vue`、`ReservationCard.vue`、`StatusTag.vue` |
| **验收标准** | 所有颜色使用 CSS 变量无硬编码；状态标签双编码（颜色+形状）；日期选择器横向滚动 100rpx 宽/项；时段选择器圆角块 72rpx 高；预约卡片 4rpx 彩色顶条；StatusTag 覆盖全部 6 种状态 |
| **优先级** | P0 |
| **可并行** | 与 MP-02/MP-03/MP-04 并行 |
| **不能做** | 不要使用 V02 高饱和配色；不要使用不对称圆角 |

---

### MP-06：顾客端 P01 — 门店主页

| 属性 | 内容 |
|------|------|
| **任务名称** | 门店主页：照片轮播、门店信息、营业状态、预约入口 |
| **负责 Agent** | miniapp-dev |
| **依赖** | MP-05（StoreBanner、StatusTag 组件就绪）、MP-02（store API）、MP-03（store store） |
| **输入文件** | `page_list.md`（P01 页面元素与交互要点）、`final_design_rules.md`（三节 3.1 页面布局、4.2 卡片、7.1 底部导航栏） |
| **输出位置** | `packages/miniprogram/src/pages/customer/store/index.vue` |
| **验收标准** | AC-F01（3 秒内加载、轮播可滑动、地址+导航图标、营业状态、今日可预约数、底部立即预约按钮、非营业时间按钮置灰）；AC-F02（点击导航唤起微信地图）；UI-04（触控友好 44rpx）；PERF-01（首屏 3 秒） |
| **优先级** | P0 |
| **可并行** | 与 MP-07/MP-08 并行 |
| **不能做** | 不要集成复杂地图 SDK（仅唤起微信地图）；不要使用横向滚动表格 |

---

### MP-07：顾客端 P02+P03 — 发起预约 + 结果页

| 属性 | 内容 |
|------|------|
| **任务名称** | 预约创建页（日期/时段选择、人数、手机号、备注）+ 预约结果展示页 |
| **负责 Agent** | miniapp-dev |
| **依赖** | MP-05（DateSelector、SlotPicker 组件）、MP-02（reservation API）、MP-03（reservation store） |
| **输入文件** | `page_list.md`（P02、P03 页面元素与交互）、`user_flows.md`（流程 1 顾客预约）、`final_design_rules.md`（4.3 节表单、选择器、计数器） |
| **输出位置** | `packages/miniprogram/src/pages/customer/reservation/create.vue`、`result.vue` |
| **验收标准** | AC-F03（日期选择、休息日灰色、提前天数限制）、AC-F04（时段容量显示、满员置灰）、AC-F05（自动确认模式提交成功）、AC-F06（需确认模式提交待确认）、AC-F07（容量不足提示）、AC-F09（手机号校验 11 位）；P03 结果页根据确认模式展示不同文案（"预约已提交等待确认" / "预约成功"）；PERF-02（提交响应 2 秒内） |
| **优先级** | P0 |
| **可并行** | 与 MP-06/MP-08 并行 |
| **不能做** | 不要在 P02 中实现商家代约逻辑（那是 B04） |

---

### MP-08：顾客端 P04+P05 — 我的预约列表 + 详情

| 属性 | 内容 |
|------|------|
| **任务名称** | 预约列表（状态筛选 Tab、卡片列表） + 预约详情（信息+状态时间线+操作按钮） |
| **负责 Agent** | miniapp-dev |
| **依赖** | MP-05（ReservationCard、StatusTag 组件）、MP-02（reservation API）、MP-03（reservation store） |
| **输入文件** | `page_list.md`（P04、P05）、`user_flows.md`（流程 7 顾客取消预约） |
| **输出位置** | `packages/miniprogram/src/pages/customer/reservation/my-list.vue`、`detail.vue` |
| **验收标准** | AC-F10（列表按时间倒序、状态标签颜色正确）、AC-F11（状态 Tab 筛选）、AC-F12（允许时间内可取消并释放容量）、AC-F13（超时阻止取消并提示联系商家）；P05 展示完整预约信息、状态时间线、操作按钮（取消/联系商家/导航到店）；UI-01（卡片样式统一、状态标签颜色一致）；UI-05（空态占位图+引导按钮） |
| **优先级** | P0 |
| **可并行** | 与 MP-06/MP-07 并行 |
| **不能做** | 不要在此任务中实现商家端预约操作按钮 |

---

### MP-09：商家端专用组件

| 属性 | 内容 |
|------|------|
| **任务名称** | TimerCard（计时卡片含进度条）、TimeExtensionPicker（加时选择器）、CouponInput（团购券录入组件） |
| **负责 Agent** | miniapp-dev |
| **依赖** | MP-01（样式变量）、MP-04（ConfirmDialog） |
| **输入文件** | `final_design_rules.md`（4.2 节计时卡片、6.1 节计时状态分级、6.2 节进度条、4.5 节加时选择器）、`project_structure.md`（2 节 components/merchant/） |
| **输出位置** | `packages/miniprogram/src/components/merchant/TimerCard.vue`、`TimeExtensionPicker.vue`、`CouponInput.vue` |
| **验收标准** | TimerCard：按剩余时间排序、正常/预警/紧急三态颜色和动画、进度条 6rpx、倒计时数字 60rpx Bold；剩余<5分钟脉冲动画 2.5s 周期；TimeExtensionPicker：底部弹出 +30min/+1h/+2h/自定义选项；CouponInput：可折叠、支持多张券录入和删除 |
| **优先级** | P0 |
| **可并行** | 与 MP-05/MP-06/MP-07 并行 |
| **不能做** | 不要使用 Lottie/GSAP 动画库；计时紧急动画仅用 CSS |

---

### MP-10：商家端 B01 — 工作台

| 属性 | 内容 |
|------|------|
| **任务名称** | 商家工作台：今日概览卡片 + 待处理预约列表 + 快捷入口宫格 |
| **负责 Agent** | miniapp-dev |
| **依赖** | MP-09（TimerCard 非必需但 StatusTag 需要）、MP-02（reservation API）、MP-03（stores） |
| **输入文件** | `page_list.md`（B01）、`user_flows.md`（流程 2 商家处理预约） |
| **输出位置** | `packages/miniprogram/src/pages/merchant/dashboard/index.vue` |
| **验收标准** | 顶部概览卡片正确显示今日预约总数/计时中/空闲桌位；快捷入口宫格可点击跳转到对应页面；待处理预约卡片列表可点击处理 |
| **优先级** | P0 |
| **可并行** | 与 MP-11/MP-12 并行 |
| **不能做** | 不要在此页面展示过于复杂的图表（V2 功能） |

---

### MP-11：商家端 B02+B03 — 预约列表 + 详情（商家视角）

| 属性 | 内容 |
|------|------|
| **任务名称** | 商家预约管理：列表（搜索/日期/状态筛选）+ 详情（含操作按钮） |
| **负责 Agent** | miniapp-dev |
| **依赖** | MP-05（StatusTag）、MP-02（reservation API）、MP-03 |
| **输入文件** | `page_list.md`（B02、B03）、`user_flows.md`（流程 2 商家处理预约） |
| **输出位置** | `packages/miniprogram/src/pages/merchant/reservation/list.vue`、`detail.vue` |
| **验收标准** | B02：搜索栏（手机号/姓名）、日期筛选（今天/明天/选择）、状态筛选、预约卡片含操作按钮（待确认→确认/拒绝、已确认→到店登记、计时中→查看计时）；B03：完整预约信息+操作记录时间线+底部动态操作按钮（确认/拒绝/到店登记/加时/结束计时）；手机号脱敏展示 |
| **优先级** | P0 |
| **可并行** | 与 MP-10/MP-12 并行 |
| **不能做** | 不要在 B02 中实现 Web 后台那种大表格（小程序用卡片列表） |

---

### MP-12：商家端 B04 — 手动添加预约

| 属性 | 内容 |
|------|------|
| **任务名称** | 商家代客预约表单页 |
| **负责 Agent** | miniapp-dev |
| **依赖** | MP-05（DateSelector、SlotPicker 可复用）、MP-02（reservation API） |
| **输入文件** | `page_list.md`（B04）、`user_flows.md`（流程 3 代客预约 + 流程 9 walk-in） |
| **输出位置** | `packages/miniprogram/src/pages/merchant/reservation/add.vue` |
| **验收标准** | AC-F16（填完提交直接生成已确认预约+来源标记商家代约+容量扣减+Toast提示）、AC-F17（容量不足时阻止并提示）；表单校验必填项（姓名、手机号、日期、时段）；选择日期后时段列表动态刷新 |
| **优先级** | P0 |
| **可并行** | 与 MP-10/MP-11 并行 |
| **不能做** | 不要复用顾客端 P02 的提交逻辑（代约直接确认 skip 确认流程） |

---

### MP-13：商家端 B05 — 计时看板

| 属性 | 内容 |
|------|------|
| **任务名称** | 计时看板：统计条 + 计时卡片列表（含加时/结束操作） |
| **负责 Agent** | miniapp-dev |
| **依赖** | MP-09（TimerCard、TimeExtensionPicker）、MP-02（timer API）、MP-03（timer store） |
| **输入文件** | `page_list.md`（B05）、`user_flows.md`（流程 5 加时 + 流程 6 结束计时）、`final_design_rules.md`（六节计时状态视觉规范） |
| **输出位置** | `packages/miniprogram/src/pages/merchant/timer/dashboard.vue` |
| **验收标准** | AC-F21（3组顾客排序正确、颜色分级正确、顶部统计正确）、AC-F22（加时操作更新剩余时间+Toast）、AC-F23（自定义加时）、AC-F24（结束计时二次确认+释放桌位+卡片移除）、AC-F25（倒计时到0不自动结束）；PERF-03（10秒刷新流畅无卡顿）；UI-04（触控友好）；计时紧急动画 2.5s 周期 |
| **优先级** | P0 |
| **可并行** | 与 MP-14 部分重叠（B06 是 B05 的前置操作页），可与 MP-12 并行 |
| **不能做** | 不要使用 WebSocket（用定时轮询 10 秒）；不要实现自动结束计时 |

---

### MP-14：商家端 B06 — 到店登记页

| 属性 | 内容 |
|------|------|
| **任务名称** | 到店登记：预约信息确认 + 桌位分配 + 团购券录入 + 开始计时 |
| **负责 Agent** | miniapp-dev |
| **依赖** | MP-09（CouponInput）、MP-02（timer API） |
| **输入文件** | `page_list.md`（B06）、`user_flows.md`（流程 4 到店计时） |
| **输出位置** | `packages/miniprogram/src/pages/merchant/timer/checkin.vue` |
| **验收标准** | AC-F18（到店登记后状态变为计时中+出现在看板+Toast提示）、AC-F19（录入单张团购券关联存储）、AC-F20（多张团购券录入和删除）；桌位号支持手动输入或自动分配；仅当日已确认预约可到店登记 |
| **优先级** | P0 |
| **可并行** | 与 MP-13（B05 是 B06 的后续页）并行 |
| **不能做** | 不要调第三方 API 验证券码（V1 仅记录） |

---

### MP-15：商家端 B07+B08 — 会员查询 + 详情

| 属性 | 内容 |
|------|------|
| **任务名称** | 会员搜索页 + 会员详情页（含消费记录列表） |
| **负责 Agent** | miniapp-dev |
| **依赖** | MP-02（member API）、MP-03 |
| **输入文件** | `page_list.md`（B07、B08）、`user_flows.md`（流程 10 会员查询） |
| **输出位置** | `packages/miniprogram/src/pages/merchant/member/search.vue`、`detail.vue` |
| **验收标准** | AC-F27（手机号精确搜索 1 条结果+脱敏展示）、AC-F28（姓名模糊搜索多条）、AC-F29（无结果空态）；B08 显示会员信息卡片+历史消费记录（日期/时长/券标识/预约方式），支持上拉加载更多 |
| **优先级** | P1 |
| **可并行** | 与 MP-10~MP-14 并行 |
| **不能做** | 不要在会员详情中展示图表或趋势分析（V2） |

---

### MP-16：角色切换与认证流程

| 属性 | 内容 |
|------|------|
| **任务名称** | 小程序启动鉴权、角色识别、顾客/商家双端切换 |
| **负责 Agent** | miniapp-dev |
| **依赖** | MP-03（user store）、MP-02（auth API） |
| **输入文件** | `permission_rules.md`（5.1 节小程序端权限控制、角色切换逻辑、页面访问守卫）、`system_design.md`（6.1 节小程序配置） |
| **输出位置** | `packages/miniprogram/src/App.vue`（启动逻辑）、各商家端页面 onLoad 守卫 |
| **验收标准** | 启动时自动 wx.login 获取 code 换 token；根据 role 展示对应 TabBar 和首页；顾客不可访问 /pages/merchant/* 页面（守卫重定向）；商家可在小程序内切换顾客/商家视角；Token 过期自动刷新 |
| **优先级** | P0 |
| **可并行** | 与页面任务并行（但需在页面完成后统一加守卫） |
| **不能做** | 不要实现微信之外的第三方登录 |

---

## 五、商家 Web 后台任务（merchant-web-dev）

### WEB-01：Vue 3 项目脚手架 + 布局框架 + 路由

| 属性 | 内容 |
|------|------|
| **任务名称** | Vite + Vue 3 项目初始化、Element Plus 集成、AppLayout/SideMenu/TopHeader 布局、路由配置与守卫 |
| **负责 Agent** | merchant-web-dev |
| **依赖** | 无 |
| **输入文件** | `project_structure.md`（3 节 admin-web/、3.1 节路由表）、`final_design_rules.md`（3.2 节 Web 布局、8.3 节侧边栏、8.1 节表格、8.2 节分页、8.4 节筛选栏）、`permission_rules.md`（5.2 节路由守卫） |
| **输出位置** | `packages/admin-web/src/`：`main.ts`、`App.vue`、`router/index.ts`、`components/layout/AppLayout.vue`、`SideMenu.vue`、`TopHeader.vue`、`styles/variables.scss`、`styles/global.scss` |
| **验收标准** | UI-03（侧边栏+主内容区统一布局）；侧边栏 200px 宽，#3D3530 背景，当前激活项 #E07A5F 高亮；路由守卫未登录跳转 /login；Element Plus 主题色覆盖为设计规则色值；CSS 变量覆盖所有 Design Tokens |
| **优先级** | P0 |
| **可并行** | 是（与后端、小程序完全并行） |
| **不能做** | 不要使用 Element Plus 默认主题色不覆盖；不要在 Web 后台使用大面积暖色背景 |

---

### WEB-02：API 层 + Pinia Store

| 属性 | 内容 |
|------|------|
| **任务名称** | axios 实例封装（Token 注入+刷新）、auth/store API 模块、auth/store Pinia store |
| **负责 Agent** | merchant-web-dev |
| **依赖** | WEB-01 |
| **输入文件** | `api_design.md`（认证+门店+规则相关端点）、`permission_rules.md`（5.2 节 Token 存储与恢复） |
| **输出位置** | `packages/admin-web/src/api/request.ts`、`auth.ts`、`store.ts`、`reservation.ts`、`rules.ts`、`member.ts`、`coupon.ts`；`packages/admin-web/src/store/auth.ts`、`store.ts` |
| **验收标准** | axios 拦截器自动注入 Authorization header；401 时清除 Token 跳转登录页；auth store 管理 login/logout/isAuthenticated；store store 管理门店配置缓存 |
| **优先级** | P0 |
| **可并行** | 与 WEB-03/WEB-04 并行 |
| **不能做** | 不要在此任务中写任何页面组件 |

---

### WEB-03：公共组件（表格封装、状态标签、搜索栏、确认弹窗、空态）

| 属性 | 内容 |
|------|------|
| **任务名称** | DataTable 封装、StatusTag、SearchBar、ConfirmDialog、EmptyState |
| **负责 Agent** | merchant-web-dev |
| **依赖** | WEB-01（Element Plus 已集成） |
| **输入文件** | `final_design_rules.md`（4.4 节状态标签 Web 版、8.1 节表格规范、8.2 分页器、8.4 筛选栏） |
| **输出位置** | `packages/admin-web/src/components/common/DataTable.vue`、`StatusTag.vue`、`SearchBar.vue`、`ConfirmDialog.vue`、`EmptyState.vue` |
| **验收标准** | DataTable：表头 #FAFAF8 + 12px Medium + #6B5D5E，行高 48px，hover #FDF8F2，边框 1px #EBE5DC，分页器集成；StatusTag：12px Medium 双编码（颜色+形状）；SearchBar：与筛选组件 16px 间距 |
| **优先级** | P0 |
| **可并行** | 与 WEB-02/WEB-04 并行 |
| **不能做** | 不要使用图片实现状态标识（用 CSS 绘制形状） |

---

### WEB-04：表单组件（图片上传、时间选择、休息日选择）

| 属性 | 内容 |
|------|------|
| **任务名称** | ImageUploader、TimePicker 封装、DaySelector（休息日多选） |
| **负责 Agent** | merchant-web-dev |
| **依赖** | WEB-01 |
| **输入文件** | `final_design_rules.md`（4.3 节表单 Web 版输入框规范）、`project_structure.md`（3 节 forms/） |
| **输出位置** | `packages/admin-web/src/components/forms/ImageUploader.vue`、`TimePicker.vue`、`DaySelector.vue` |
| **验收标准** | ImageUploader：支持拖拽排序、预览、删除、1-9 张限制；TimePicker：HH:mm 格式；DaySelector：周日-周六多选 |
| **优先级** | P0 |
| **可并行** | 与 WEB-02/WEB-03 并行 |
| **不能做** | 不要在此任务中实现图片裁剪功能 |

---

### WEB-05：W01 — 登录页

| 属性 | 内容 |
|------|------|
| **任务名称** | 商家登录页面 |
| **负责 Agent** | merchant-web-dev |
| **依赖** | WEB-02（auth API + auth store） |
| **输入文件** | `page_list.md`（W01）、`api_design.md`（POST /api/auth/admin-login） |
| **输出位置** | `packages/admin-web/src/pages/login/LoginPage.vue` |
| **验收标准** | AC-F37（正确账密登录后跳转 /dashboard）、AC-F38（错误密码提示"用户名或密码错误"）、AC-F39（未登录访问 /dashboard 跳转 /login）；页面居中卡片布局，Logo+系统名称"拼豆店管理后台" |
| **优先级** | P0 |
| **可并行** | 与 WEB-06~WEB-12 并行 |
| **不能做** | 不要在此任务中实现微信扫码登录（V1 优先账密） |

---

### WEB-06：W02 — 工作台 Dashboard

| 属性 | 内容 |
|------|------|
| **任务名称** | 商家 Web 工作台：概览数据卡片 + 今日预约列表 |
| **负责 Agent** | merchant-web-dev |
| **依赖** | WEB-02、WEB-03 |
| **输入文件** | `page_list.md`（W02）、`api_design.md`（GET /reservations/merchant summary） |
| **输出位置** | `packages/admin-web/src/pages/dashboard/DashboardPage.vue` |
| **验收标准** | 4 个概览卡片（今日预约数/待确认/在店/空闲桌位）；今日最近 10 条预约列表；数据卡片点击可跳转；侧边导航栏全局固定 |
| **优先级** | P1 |
| **可并行** | 与 WEB-05/WEB-07 并行 |
| **不能做** | 不要在此页面展示图表或趋势数据 |

---

### WEB-07：W03 — 预约管理

| 属性 | 内容 |
|------|------|
| **任务名称** | Web 预约管理：数据表格 + 筛选搜索 + 确认/拒绝操作 + 添加预约弹窗 |
| **负责 Agent** | merchant-web-dev |
| **依赖** | WEB-03（DataTable、SearchBar）、WEB-02（reservation API） |
| **输入文件** | `page_list.md`（W03）、`api_design.md`（GET/POST /reservations/merchant、confirm/reject） |
| **输出位置** | `packages/admin-web/src/pages/reservations/ReservationPage.vue` |
| **验收标准** | 日期范围筛选+状态下拉筛+搜索框；表格列：顾客/手机号(脱敏)/日期/时段/人数/来源/状态/操作；操作按钮根据状态动态显示（确认/拒绝/查看详情）；添加预约弹窗表单（同 B04 字段）；分页器正常 |
| **优先级** | P0 |
| **可并行** | 与 WEB-06/WEB-08 并行 |
| **不能做** | 不要在 Web 表格中实现到店登记和计时操作（那是小程序端功能） |

---

### WEB-08：W04 — 门店设置

| 属性 | 内容 |
|------|------|
| **任务名称** | 门店信息配置页：名称/地址/照片/营业时间/桌位/介绍 |
| **负责 Agent** | merchant-web-dev |
| **依赖** | WEB-04（ImageUploader、TimePicker、DaySelector）、WEB-02（store API） |
| **输入文件** | `page_list.md`（W04）、`api_design.md`（GET/PUT /api/store/config） |
| **输出位置** | `packages/admin-web/src/pages/store/StoreSettingsPage.vue` |
| **验收标准** | AC-F34（修改保存后 Toast "设置已保存"，用户端小程序同步更新）、AC-F35（至少保留 1 张照片校验）；表单包含全部可配置项；必填项校验；图片拖拽排序 |
| **优先级** | P0 |
| **可并行** | 与 WEB-07/WEB-09 并行 |
| **不能做** | 不要在此页修改预约规则或容量（这是 W05/W06） |

---

### WEB-09：W05+W06 — 预约规则 + 容量设置

| 属性 | 内容 |
|------|------|
| **任务名称** | 预约规则配置页 + 容量查看页 |
| **负责 Agent** | merchant-web-dev |
| **依赖** | WEB-02（rules API）、WEB-03 |
| **输入文件** | `page_list.md`（W05、W06）、`api_design.md`（GET/PUT /api/rules、GET /reservations/slots） |
| **输出位置** | `packages/admin-web/src/pages/store/ReservationRulesPage.vue`、`CapacityPage.vue` |
| **验收标准** | AC-F36（预约需确认开关保存后生效、关联配置项展开/收起）；W05：6 个配置项完整表单；W06：日期选择 + 当日时段容量表格（时段/总桌位/已预约/剩余） |
| **优先级** | P1 |
| **可并行** | 与 WEB-07/WEB-08 并行 |
| **不能做** | 不要在 W06 实现复杂的临时减容功能（V1 仅展示容量） |

---

### WEB-10：W07 — 会员管理

| 属性 | 内容 |
|------|------|
| **任务名称** | 会员搜索 + 会员列表表格 + 会员详情弹窗（含消费记录分页） |
| **负责 Agent** | merchant-web-dev |
| **依赖** | WEB-03（DataTable）、WEB-02（member API） |
| **输入文件** | `page_list.md`（W07）、`api_design.md`（GET /api/members、GET /api/members/:id） |
| **输出位置** | `packages/admin-web/src/pages/members/MemberPage.vue` |
| **验收标准** | 手机号搜索/姓名搜索；搜索结果表格（姓名/手机号脱敏/累计到店/累计时长/最近到店/操作）；会员详情弹窗含历史消费记录表格+日期范围筛选+分页 |
| **优先级** | P1 |
| **可并行** | 与 WEB-07/WEB-08/WEB-09 并行 |
| **不能做** | 不要在会员管理中实现数据导出功能（V2） |

---

### WEB-11：W08 — 团购券记录

| 属性 | 内容 |
|------|------|
| **任务名称** | 团购券核销记录查询页 |
| **负责 Agent** | merchant-web-dev |
| **依赖** | WEB-03（DataTable）、WEB-02（coupon API） |
| **输入文件** | `page_list.md`（W08）、`api_design.md`（GET /api/coupons） |
| **输出位置** | `packages/admin-web/src/pages/coupons/CouponPage.vue` |
| **验收标准** | 日期范围筛选 + 券来源下拉筛选（全部/美团/抖音/其他）；表格（核销日期/券码/来源/类型/顾客/关联消费/操作人）；分页正常 |
| **优先级** | P2 |
| **可并行** | 与 WEB-07~WEB-10 并行 |
| **不能做** | 不要实现团购券对账/导出/统计功能（V2） |

---

### WEB-12：Web 后台 Docker 构建

| 属性 | 内容 |
|------|------|
| **任务名称** | admin-web.Dockerfile + Nginx 静态资源配置 |
| **负责 Agent** | merchant-web-dev |
| **依赖** | WEB-01~WEB-11（全部页面完成） |
| **输入文件** | `project_structure.md`（1 节 docker/admin-web.Dockerfile）、`system_design.md`（5 节部署架构） |
| **输出位置** | `docker/admin-web.Dockerfile`、`packages/admin-web/vite.config.ts`（build 配置） |
| **验收标准** | `npm run build` 产出 dist/；Docker 构建镜像成功；Nginx 正确代理 /admin/* 到静态文件 |
| **优先级** | P1 |
| **可并行** | 依赖全部 Web 页面完成后 |
| **不能做** | 不要在此任务中修改 Nginx 主配置（由 API-11 负责） |

---

## 六、测试任务（qa-tester）

### QA-01：后端单元测试

| 属性 | 内容 |
|------|------|
| **任务名称** | NestJS Service 层单元测试 |
| **负责 Agent** | qa-tester |
| **依赖** | API-02~API-09（各模块 Service 完成） |
| **输入文件** | `acceptance_criteria.md`（第一部分功能验收全部 39 条）、`api_design.md`（各端点错误码和业务逻辑） |
| **输出位置** | `packages/server/test/unit/`：auth.service.spec.ts、reservation.service.spec.ts、timer.service.spec.ts、member.service.spec.ts、store.service.spec.ts |
| **验收标准** | 覆盖核心逻辑：容量校验（并发安全）、状态流转、会员自动沉淀、自动取消条件判断；覆盖率 > 70% |
| **优先级** | P1 |
| **可并行** | 与前端任务并行 |
| **不能做** | 不要测试框架层代码（Guard/Interceptor 等 NestJS 已测试的） |

---

### QA-02：后端 E2E 测试

| 属性 | 内容 |
|------|------|
| **任务名称** | 核心业务流程端到端测试 |
| **负责 Agent** | qa-tester |
| **依赖** | API-12（Docker Compose 全部服务可启动） |
| **输入文件** | `user_flows.md`（全部 10 个流程）、`acceptance_criteria.md`（全部 P0 功能验收条目） |
| **输出位置** | `packages/server/test/e2e/`：auth.e2e-spec.ts、reservation-flow.e2e-spec.ts、timer-flow.e2e-spec.ts、member.e2e-spec.ts |
| **验收标准** | 覆盖 5 条核心流程：顾客预约提交→商家确认→到店登记→加时→结束计时；容量并发控制（模拟 2 人同时抢最后 1 个空位）；自动取消定时任务 |
| **优先级** | P0 |
| **可并行** | 依赖全部后端和部署任务完成后 |
| **不能做** | 不要在此阶段测试 UI 层 |

---

### QA-03：小程序功能测试

| 属性 | 内容 |
|------|------|
| **任务名称** | 微信小程序真机功能测试 |
| **负责 Agent** | qa-tester |
| **依赖** | MP-16（全部小程序页面完成）、API-12（后端服务运行中） |
| **输入文件** | `acceptance_criteria.md`（功能验收 AC-F01~AC-F36 全部条目）、`user_flows.md`（流程 1-7,9,10） |
| **输出位置** | `artifacts/05_plan/test_report_miniapp.md` |
| **验收标准** | 执行 AC-F01~AC-F36 中所有与小程序相关的用例；P0 条目 100% 通过；记录不通过的条目和复现步骤 |
| **优先级** | P0 |
| **可并行** | 与 QA-04 并行 |
| **不能做** | 不要绕过小程序真机环境用模拟器测试 |

---

### QA-04：Web 后台功能测试

| 属性 | 内容 |
|------|------|
| **任务名称** | 商家 Web 后台功能测试 |
| **负责 Agent** | qa-tester |
| **依赖** | WEB-12（全部 Web 页面完成）、API-12（后端服务运行中） |
| **输入文件** | `acceptance_criteria.md`（AC-F34~AC-F39 及商家相关用例） |
| **输出位置** | `artifacts/05_plan/test_report_web.md` |
| **验收标准** | 执行 Web 后台相关全部验收用例；登录/门店设置/预约管理/规则配置/会员查询/团购券记录核心流程通过 |
| **优先级** | P1 |
| **可并行** | 与 QA-03 并行 |
| **不能做** | 不要在移动端浏览器测试 Web 后台（Web 后台仅桌面端） |

---

### QA-05：UI 设计规则核验

| 属性 | 内容 |
|------|------|
| **任务名称** | 对照设计规则清单逐项检查小程序和 Web 后台 |
| **负责 Agent** | qa-tester |
| **依赖** | MP-16、WEB-12（所有页面实现完成） |
| **输入文件** | `final_design_rules.md`（十节前端开发必须遵守的清单 30+ 项） |
| **输出位置** | `artifacts/05_plan/ui_check_report.md` |
| **验收标准** | UI-01~UI-07 全部通过；设计规则清单中所有复选框项确认通过或记录偏差；颜色变量无硬编码、状态标签双编码、触控区域≥44rpx、计时动画符合规范 |
| **优先级** | P0（UI 评审不通过不能交付） |
| **可并行** | 与 QA-06 并行 |
| **不能做** | 不要只做视觉走查，必须逐项对照清单打勾 |

---

### QA-06：性能与兼容性测试

| 属性 | 内容 |
|------|------|
| **任务名称** | 性能基准测试 + 多环境兼容性测试 |
| **负责 Agent** | qa-tester |
| **依赖** | QA-03、QA-04（功能测试通过后） |
| **输入文件** | `acceptance_criteria.md`（PERF-01~PERF-07 全部 7 条、COMP-01~COMP-03 全部 3 条、SEC-01~SEC-03 全部 3 条） |
| **输出位置** | `artifacts/05_plan/perf_compat_report.md` |
| **验收标准** | PERF-01（小程序首屏<3s）、PERF-02（预约提交<2s）、PERF-03（计时看板刷新<1s）、PERF-04（Web 页面<3s）、PERF-05（20 人并发无超卖）、COMP-01（微信 8.0+）、COMP-02（iOS 14+/Android 8.0+）、COMP-03（Chrome/Edge/Safari 桌面）、SEC-01（未登录 401）、SEC-02（手机号脱敏）、SEC-03（HTTPS） |
| **优先级** | P1 |
| **可并行** | 与 QA-05 并行 |
| **不能做** | 不要跳过真机兼容性测试 |

---

## 七、Review 任务（code-reviewer）

### REV-01：数据库设计 Review

| 属性 | 内容 |
|------|------|
| **任务名称** | 审查 Migration SQL、Entity 定义、索引策略、Seed 数据 |
| **负责 Agent** | code-reviewer |
| **依赖** | DB-05（全部数据库任务完成） |
| **输入文件** | `database_design.md`（作为对照标准）、`DB-01~DB-05` 的全部输出文件 |
| **输出位置** | `artifacts/05_plan/review_db.md` |
| **验收标准** | Entity 与数据库设计文档一致；索引覆盖设计文档中标注的所有查询场景；外键约束正确；Seed 数据幂等 |
| **优先级** | P0 |
| **可并行** | 与 REV-02 并行（后端依赖 DB 但 DB review 可在后端开发中途进行） |

---

### REV-02：后端代码 Review

| 属性 | 内容 |
|------|------|
| **任务名称** | 审查全部 NestJS 模块代码：鉴权、业务逻辑、事务处理、错误处理 |
| **负责 Agent** | code-reviewer |
| **依赖** | API-12（全部后端任务完成） |
| **输入文件** | `api_design.md`、`permission_rules.md`、API-01~API-12 的全部输出文件 |
| **输出位置** | `artifacts/05_plan/review_backend.md` |
| **验收标准** | JWT 验证逻辑正确；Roles Guard 覆盖所有需认证端点；容量校验在事务中使用行锁防止超卖；手机号脱敏规则正确；统一错误码与文档一致；无 SQL 注入风险 |
| **优先级** | P0 |
| **可并行** | 与 REV-01 部分并行，与 REV-03/REV-04 并行为佳 |
| **不能做** | 不要只读代码不做对照检查（必须对照 API 文档逐端点检查） |

---

### REV-03：小程序代码 Review

| 属性 | 内容 |
|------|------|
| **任务名称** | 审查全部 uni-app 代码：页面、组件、Store、API 层 |
| **负责 Agent** | code-reviewer |
| **依赖** | MP-16（全部小程序任务完成） |
| **输入文件** | `page_list.md`、`final_design_rules.md`、MP-01~MP-16 的全部输出文件 |
| **输出位置** | `artifacts/05_plan/review_miniapp.md` |
| **验收标准** | 所有颜色使用 CSS 变量无硬编码；状态标签双编码；触控区域≥44rpx；页面路由守卫正确；API 调用与文档一致；无直接操作 DOM（使用 Vue 响应式）；条件编译 `#ifdef MP-WEIXIN` 正确使用 |
| **优先级** | P0 |
| **可并行** | 与 REV-02/REV-04 并行 |
| **不能做** | 不要只看代码逻辑不看 UI 规范对照 |

---

### REV-04：Web 后台代码 Review

| 属性 | 内容 |
|------|------|
| **任务名称** | 审查全部 Vue 3 Web 后台代码：页面、组件、路由、API 层 |
| **负责 Agent** | code-reviewer |
| **依赖** | WEB-12（全部 Web 后台任务完成） |
| **输入文件** | `page_list.md`（W01-W08）、`final_design_rules.md`（八节 Web 特有规范）、WEB-01~WEB-12 的全部输出文件 |
| **输出位置** | `artifacts/05_plan/review_web.md` |
| **验收标准** | Element Plus 主题色已全局覆盖为设计规则色值；侧边栏规范符合设计；表格样式（表头/行高/hover/边框）符合规范；路由守卫正确；API 调用与文档一致；无硬编码颜色；无 `!important` 滥用 |
| **优先级** | P0 |
| **可并行** | 与 REV-02/REV-03 并行 |
| **不能做** | 不要跳过 Element Plus 主题覆盖的检查 |

---

### REV-05：端到端集成 Review

| 属性 | 内容 |
|------|------|
| **任务名称** | 全链路审查：从数据库到前端的数据流、API 契约一致性、三端交互完整性 |
| **负责 Agent** | code-reviewer |
| **依赖** | REV-01~REV-04 全部完成、QA-02（E2E 测试通过） |
| **输入文件** | 全部 artifacts 文档 + 全部 Review 报告 + E2E 测试报告 |
| **输出位置** | `artifacts/05_plan/review_integration.md` |
| **验收标准** | API 请求/响应格式三端一致；分页参数三端统一；状态枚举值三端一致；手机号脱敏规则前后端一致；计时剩余时间计算前后端一致；无遗漏的功能需求 |
| **优先级** | P0 |
| **可并行** | 否（依赖所有 Review 和测试） |
| **不能做** | 不要在集成 Review 中重新做模块级 Review |

---

## 八、任务依赖关系图

```
DB-01 ──> DB-02 ──> DB-03 ──> DB-04 ──> DB-05
  │
  └──> API-01 ──> API-02 ──> API-03 ──> API-04 ──> API-05 ──> API-06 ──> API-07
                      │                    │          │          │          │
                      │                    │          │          │          └──> API-08
                      │                    │          │          │
                      │                    │          │          └──> API-09
                      │                    │          │
                      │                    │          └──> API-10
                      │                    │
                      │                    └──> API-11 ──> API-12
                      │
                      └──────────────────────────────────────────────────> REV-02
                                                                              │
MP-01 ──> MP-02 ──> MP-03 ──> MP-04 ──> MP-05 ──> MP-06 ──> MP-07 ──> MP-08 ──> MP-16 ──> REV-03
                      │          │          │          │          │
                      │          │          │          │          └──> MP-09 ──> MP-10 ──> MP-11 ──> MP-12
                      │          │          │          │                        │          │
                      │          │          │          │                        │          └──> MP-13 ──> MP-14
                      │          │          │          │                        │
                      │          │          │          │                        └──> MP-15
                      │          │          │          │
WEB-01 ──> WEB-02 ──> WEB-03 ──> WEB-04 ──> WEB-05 ──> WEB-06 ──> WEB-07 ──> WEB-08 ──> WEB-09 ──> WEB-10 ──> WEB-11 ──> WEB-12 ──> REV-04

REV-01 ──┐
REV-02 ──┤
REV-03 ──┼──> REV-05
REV-04 ──┤
QA-01~06 ─┘
```

---

## 九、可并行开发的任务

以下任务组之间没有依赖关系，可以同时进行：

### 第 1 组（数据库 + 后端脚手架）
- DB-01、API-01 可并行开始

### 第 2 组（后端模块间并行）
- API-03（Store）完成后，API-04 和 API-07（Member）可并行
- API-04 完成后，API-05 和 API-06 可并行
- API-07 和 API-08 可并行
- API-09（Scheduler）依赖 API-05 完成后独立
- API-10（Message V1 预留）可与任何后端任务并行
- API-11、API-12 可与前端任务并行

### 第 3 组（小程序与 Web 后台完全并行）
- 小程序全部 16 个任务 与 Web 后台全部 12 个任务 完全可并行

### 第 4 组（小程序内部并行）
- MP-01 完成后：MP-02 与 MP-04 可并行
- MP-02+MP-04 完成后：MP-05 与 MP-09 可并行（顾客端组件 vs 商家端组件）
- 组件就绪后：MP-06+MP-07+MP-08 与 MP-10+MP-11+MP-12+MP-13+MP-14+MP-15 可完全并行（顾客端页面 vs 商家端页面）

### 第 5 组（Web 后台内部并行）
- WEB-01 完成后：WEB-02、WEB-03、WEB-04 可并行
- 基础组件就绪后：WEB-05~WEB-11 可大部并行（登录/工作台/预约管理/门店设置/规则/容量/会员/团购券各自独立）

### 第 6 组（测试与 Review 并行）
- QA-01（后端单元测试）可与前端任务并行
- QA-03（小程序测试）与 QA-04（Web 后台测试）可并行
- QA-05（UI 核验）与 QA-06（性能测试）可并行
- REV-01~REV-04 四端 Review 可完全并行

---

## 十、必须先完成的任务（关键路径）

以下任务必须按顺序完成，不可跳过：

1. **DB-01 → DB-02 → DB-03**：数据库 Entity 和 Migration 是所有后端任务的基础
2. **API-01 → API-02**：认证模块是后续所有需认证端点的前置依赖
3. **API-02 → API-03**：门店模块是 Reservation 模块（需要 table_count 和营业时间）的前置
4. **API-03 → API-04**：预约模块顾客端是商家端预约和计时模块的前置
5. **API-04 → API-05 → API-06**：预约→计时状态流转不可颠倒
6. **API-06 → API-07**：Member 模块依赖 Timer 结束时自动沉淀数据
7. **API-12（Docker Compose）→ QA-02（E2E 测试）**：E2E 需要完整运行环境
8. **全部开发任务 → 对应 Review 任务**：Review 必须在开发完成后
9. **全部 Review + 全部 QA → REV-05**：集成 Review 是最终交付前最后一步

---

## 十一、第一轮开发范围（V1 MVP）

以下任务为第一轮必须完成的最小可交付范围：

### 第一轮必须包含

| 模块 | 任务 | 原因 |
|------|------|------|
| 数据库 | DB-01 ~ DB-05（全部） | 基础设施 |
| 后端 | API-01 ~ API-09、API-12（全部 P0 模块） | 核心业务逻辑 |
| 后端 | API-11（Nginx 部署） | 可运行 |
| 小程序 | MP-01 ~ MP-14、MP-16 | P0 用户端+商家端核心页面 |
| Web | WEB-01 ~ WEB-08 | P0 后台核心页面 |
| 测试 | QA-02、QA-03、QA-05 | P0 核心流程测试 + UI 核验 |
| Review | REV-01 ~ REV-04 | 四端代码审查 |

**第一轮任务数：约 46 个（全部 44 个 P0 任务 + 关键 P1 任务 API-11/WEB-12 部署相关）**

### 第一轮完成后可以达到的状态

- 顾客可以通过小程序浏览门店、选择时段、提交预约
- 商家可以通过商家端小程序查看和处理预约、手动添加预约
- 顾客到店后商家可以登记并开始计时、加时、结束计时
- 计时结束后消费记录自动沉淀到会员档案
- 商家可以通过 Web 后台配置门店信息和预约规则
- 核心流程通过 E2E 测试
- UI 设计规则核验通过
- 数据库/后端/小程序/Web 四端代码审查通过

---

## 十二、暂不开发范围（V2+）

以下功能在 V1 任务清单中明确排除，**不要开发**：

| 功能 | 对应 PRD | 列入版本 |
|------|----------|:---:|
| 在线支付 | 3.2 节 | V2 |
| 自动计费（按时长算钱） | 3.2 节 | V2 |
| 储值、次卡、积分、会员等级 | 3.2 节 | V2/V3 |
| 候补预约（排队逻辑） | 3.2 节 | V2 |
| 多门店管理 | 3.2 节 | V2 |
| 复杂营销玩法（拼团、秒杀、优惠券） | 3.2 节 | V3+ |
| 连锁权限体系（多角色） | 3.2 节 | V2 |
| 数据统计分析看板（图表、趋势） | 3.2 节 | V2 |
| 微信订阅消息实际发送 | 5.7 节 | V2 |
| 第三方团购平台 API 对接核销 | 5.4.2 节 | V2 |
| 店员角色 | 4.3 节 | V2 |
| 会员数据导出 | — | V2 |
| 操作日志审计 | — | V2 |
| Web 后台移动端适配 | — | V2 |
| API 版本控制（/api/v1） | — | V2 |

**但以下预留工作已在任务中安排：**
- API-10（Message Entity + Service，仅数据结构）
- DB-02（messages 表已在 Migration 中创建）

---

## 十三、任务编号索引（快速查找）

| 编号 | 名称 | 角色 | 优先级 |
|------|------|------|:---:|
| DB-01 | TypeORM 数据源配置 | database-dev | P0 |
| DB-02 | 全部 Entity 文件 | database-dev | P0 |
| DB-03 | 初始 Migration | database-dev | P0 |
| DB-04 | 种子数据脚本 | database-dev | P0 |
| DB-05 | Docker PostgreSQL 配置 | database-dev | P0 |
| API-01 | NestJS 项目脚手架 | backend-dev | P0 |
| API-02 | Auth 模块 | backend-dev | P0 |
| API-03 | Store 模块 | backend-dev | P0 |
| API-04 | Reservation 模块—顾客端 | backend-dev | P0 |
| API-05 | Reservation 模块—商家端 | backend-dev | P0 |
| API-06 | Timer 模块 | backend-dev | P0 |
| API-07 | Member 模块 | backend-dev | P0 |
| API-08 | Coupon + Rules 模块 | backend-dev | P1 |
| API-09 | 定时任务—自动取消 | backend-dev | P0 |
| API-10 | Message 模块（V1 预留） | backend-dev | P2 |
| API-11 | Nginx + NestJS 部署 | backend-dev | P1 |
| API-12 | Docker Compose 编排 | backend-dev | P0 |
| MP-01 | uni-app 项目脚手架 | miniapp-dev | P0 |
| MP-02 | API 服务层 | miniapp-dev | P0 |
| MP-03 | Pinia 状态管理 | miniapp-dev | P0 |
| MP-04 | 公共基础组件 | miniapp-dev | P0 |
| MP-05 | 顾客端专用组件 | miniapp-dev | P0 |
| MP-06 | P01 门店主页 | miniapp-dev | P0 |
| MP-07 | P02+P03 预约创建+结果 | miniapp-dev | P0 |
| MP-08 | P04+P05 我的预约列表+详情 | miniapp-dev | P0 |
| MP-09 | 商家端专用组件 | miniapp-dev | P0 |
| MP-10 | B01 工作台 | miniapp-dev | P0 |
| MP-11 | B02+B03 预约列表+详情 | miniapp-dev | P0 |
| MP-12 | B04 手动添加预约 | miniapp-dev | P0 |
| MP-13 | B05 计时看板 | miniapp-dev | P0 |
| MP-14 | B06 到店登记 | miniapp-dev | P0 |
| MP-15 | B07+B08 会员查询+详情 | miniapp-dev | P1 |
| MP-16 | 角色切换与认证 | miniapp-dev | P0 |
| WEB-01 | Vue 3 项目脚手架+布局 | merchant-web-dev | P0 |
| WEB-02 | API 层 + Pinia Store | merchant-web-dev | P0 |
| WEB-03 | 公共组件 | merchant-web-dev | P0 |
| WEB-04 | 表单组件 | merchant-web-dev | P0 |
| WEB-05 | W01 登录页 | merchant-web-dev | P0 |
| WEB-06 | W02 工作台 | merchant-web-dev | P1 |
| WEB-07 | W03 预约管理 | merchant-web-dev | P0 |
| WEB-08 | W04 门店设置 | merchant-web-dev | P0 |
| WEB-09 | W05+W06 规则+容量 | merchant-web-dev | P1 |
| WEB-10 | W07 会员管理 | merchant-web-dev | P1 |
| WEB-11 | W08 团购券记录 | merchant-web-dev | P2 |
| WEB-12 | Web 后台 Docker 构建 | merchant-web-dev | P1 |
| QA-01 | 后端单元测试 | qa-tester | P1 |
| QA-02 | 后端 E2E 测试 | qa-tester | P0 |
| QA-03 | 小程序功能测试 | qa-tester | P0 |
| QA-04 | Web 后台功能测试 | qa-tester | P1 |
| QA-05 | UI 设计规则核验 | qa-tester | P0 |
| QA-06 | 性能与兼容性测试 | qa-tester | P1 |
| REV-01 | 数据库 Review | code-reviewer | P0 |
| REV-02 | 后端代码 Review | code-reviewer | P0 |
| REV-03 | 小程序代码 Review | code-reviewer | P0 |
| REV-04 | Web 后台代码 Review | code-reviewer | P0 |
| REV-05 | 端到端集成 Review | code-reviewer | P0 |

---

## 十四、文档修订记录

| 版本 | 日期 | 修改内容 | 修改人 |
|------|------|----------|--------|
| v1.0 | 2026-05-11 | 初稿创建，52 个任务覆盖全角色全模块 | planner |

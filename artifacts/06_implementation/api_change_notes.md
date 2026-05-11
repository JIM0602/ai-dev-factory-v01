# API 变更说明

## 文档信息

| 项目 | 内容 |
|------|------|
| 文档版本 | v1.0 |
| 创建日期 | 2026-05-11 |
| 负责 Agent | backend-dev |

---

## 与 api_design.md 的差异

### 1. 路由结构灵活调整

**原设计**：使用 `/admin/` 前缀区分商家端接口。

**调整后**：不使用 `/admin/` 前缀，统一以资源名称命名，通过 `@Roles('merchant')` 装饰器控制权限。

| 原设计路径 | 实现路径 | 原因 |
|-----------|---------|------|
| `GET /api/admin/reservations` | `GET /api/reservations/merchant` | 使用 `merchant` 子路径区分，更加 RESTful；`/admin/` 前缀与 NestJS 全局前缀 `/api` 搭配不够直观 |
| `POST /api/admin/reservations` | `POST /api/reservations/merchant` | 同上 |
| `POST /api/admin/reservations/:id/confirm` | `POST /api/reservations/:id/confirm` | 确认/拒绝是资源操作，不限定于 admin |
| `POST /api/admin/reservations/:id/reject` | `POST /api/reservations/:id/reject` | 同上 |
| `POST /api/admin/check-in` | `POST /api/reservations/:id/checkin` | 到店登记是预约的子操作，路由上挂在 reservation 下更合理 |
| `GET /api/admin/timer/dashboard` | `GET /api/timer/dashboard` | timer 模块本身就是商家功能，不需要 admin 前缀 |
| `POST /api/admin/timer/:sessionId/extend` | `POST /api/timer/:sessionId/extend` | 同上 |
| `POST /api/admin/timer/:sessionId/end` | `POST /api/timer/:sessionId/end` | 同上 |
| `PUT /api/admin/timer/:sessionId/table` | `PUT /api/timer/:sessionId/table` | 同上 |
| `GET /api/admin/members` | `GET /api/members` | member 模块本身就是商家功能 |
| `GET /api/admin/members/:id` | `GET /api/members/:id` | 同上 |
| `POST /api/admin/coupons` | `GET /api/coupons` | 设计文档中是 POST 但实际是查询列表，改为 GET |
| `GET /api/admin/settings/reservation-rules` | `GET /api/rules` | 简化路径，规则作为独立资源 |
| `PUT /api/admin/settings/reservation-rules` | `PUT /api/rules` | 同上 |

### 2. 门店配置路由

**原设计**：
- `GET /api/store/info` (公开)
- `GET /api/store/config` (商家)
- `PUT /api/store/config` (商家)

**调整后**：保持不变，与 API 设计一致。

### 3. 预约路由

| 端点 | 路径 | 认证 | 说明 |
|------|------|------|------|
| 查询时段 | `GET /api/reservations/slots` | Public | 与设计一致 |
| 创建预约 | `POST /api/reservations` | customer/merchant | 与设计一致。商家身份创建时自动视为代客预约 |
| 我的预约 | `GET /api/reservations/my` | customer | 与设计一致 |
| 预约详情 | `GET /api/reservations/:id` | customer/merchant | 与设计一致 |
| 取消预约 | `POST /api/reservations/:id/cancel` | customer/merchant | 与设计一致。商家取消时无时间限制 |
| 商家预约列表 | `GET /api/reservations/merchant` | merchant | 路径调整 |
| 商家代客预约 | `POST /api/reservations/merchant` | merchant | 路径调整 |
| 确认预约 | `POST /api/reservations/:id/confirm` | merchant | 路径调整 |
| 拒绝预约 | `POST /api/reservations/:id/reject` | merchant | 路径调整 |
| 容量概况 | `GET /api/admin/capacity` | merchant | 保留 admin 前缀（非 RESTful 资源操作） |

### 4. 计时模块路径

**原设计**：到店登记使用 `POST /api/reservations/:id/checkin`，与实现一致。

**timer 模块**路由设计保持不变，仅去除 `/admin/` 前缀：
- `GET /api/timer/dashboard` - 计时看板
- `POST /api/timer/:sessionId/extend` - 加时
- `POST /api/timer/:sessionId/end` - 结束计时
- `PUT /api/timer/:sessionId/table` - 更换桌位（文档未明确列出但设计有提及）

### 5. 文件上传路径

**原设计**：`POST /api/upload/image`

**调整后**：`POST /api/upload/image`，保持不变。

---

## 未实现的功能

1. **微信 code 换 openid 的真实对接**：开发环境使用 mock，生产环境需配置 `WECHAT_APP_ID` 和 `WECHAT_APP_SECRET` 后自动启用真实调用。

2. **消息推送（微信订阅消息）**：V1 仅创建了 `messages` 表和 `MessageService.createMessage()` 方法，不实际发送消息。

3. **WebSocket 实时计时推送**：V1 使用前端定时轮询方式。

---

## 文档修订记录

| 版本 | 日期 | 修改内容 | 修改人 |
|------|------|----------|--------|
| v1.0 | 2026-05-11 | 初稿创建 | backend-dev |

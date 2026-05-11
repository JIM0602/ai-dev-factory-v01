# 小程序端 API 问题记录

## 文档信息

| 项目 | 内容 |
|------|------|
| 文档版本 | v1.0 |
| 创建日期 | 2026-05-11 |
| 负责 Agent | miniapp-dev |

---

## 1. 缺少的 API 端点

### 1.1 计时详情接口

**问题**: 计时详情页（pages/merchant/timer/detail.vue）需要获取计时会话的完整信息（含加时记录列表、团购券列表），但当前 API 设计中只有：
- `GET /api/timer/dashboard`（看板汇总，不含扩展记录）
- `POST /api/timer/:sessionId/extend`（加时操作）
- `POST /api/timer/:sessionId/end`（结束计时）

**建议**: 增加 `GET /api/timer/:sessionId` 返回完整计时详情，包含 `extensions` 数组和 `coupons` 数组。

### 1.2 商家工作台聚合接口

**问题**: 商家工作台（B01）需要同时获取今日预约汇总、计时状态、待处理预约列表。当前需要调用 2 个接口：
- `GET /api/reservations/merchant?date=today`（预约列表 + summary）
- `GET /api/timer/dashboard`（计时数据）

**当前实现**: 页面中使用 `Promise.all` 并行请求两个接口。

**建议**: 可考虑增加 `GET /api/merchant/dashboard` 一次性返回所有工作台数据，减少请求次数。

---

## 2. 字段缺失

### 2.1 门店经纬度

**问题**: 门店主页（P01）和预约详情（P05）需要"导航到店"功能，调用 `uni.openLocation` 需要经纬度参数。

**影响接口**: `GET /api/store/info`

**当前实现**: 页面中硬编码了默认广州坐标 `(23.1291, 113.2644)`。

**建议**: 在 `StoreInfo` 中增加 `latitude` 和 `longitude` 字段。

### 2.2 预约列表返回字段

**问题**: 顾客端预约列表（P04）需要 `can_cancel` 字段判断是否显示"取消预约"按钮。根据 API 设计文档，此字段存在。但 `GET /api/reservations/my` 响应中是否已有此字段需后端确认。

**建议**: 确认 `GET /api/reservations/my` 列表中每个预约项包含 `can_cancel: boolean`。

---

## 3. 响应格式确认

### 3.1 会员详情 records 嵌套格式

**问题**: `GET /api/members/:id` 响应中 `records` 字段包含内嵌分页对象。TypeScript 类型定义如下：
```typescript
{
  id: 1,
  records: {
    list: [...],
    pagination: { ... }
  }
}
```
需要确认此嵌套结构与后端实际返回一致。

### 3.2 分页响应格式

**确认**: `GET /api/reservations/merchant` 响应中 `summary` 字段在 `data` 层级下与 `list` 和 `pagination` 平级。已在 API 封装中按此处理。

---

## 4. 业务逻辑确认

### 4.1 到店登记日期限制

**API 文档规定**: 仅当日已确认预约可到店登记（`reservation_date === today`），状态必须为 `confirmed`。

**当前实现**: 商家端预约详情（B03）中仅 `status === 'confirmed' && isTodayReservation` 时显示"到店登记"按钮。

### 4.2 取消预约时间限制

**当前实现**: 页面通过 `can_cancel` 字段控制，具体规则由后端计算。顾客端预约详情（P05）和列表（P04）中根据此字段显示/隐藏取消按钮。

### 4.3 商家代约状态

**API 文档规定**: `POST /api/reservations/merchant` 创建的预约 `status` 固定为 `confirmed`，`source` 为 `merchant`。

**当前实现**: 商家添加预约页（B04）提交后 Toast 提示"预约添加成功"，不经过确认流程。

---

## 5. 无需修改的适配点

以下为小程序端已自行处理的不匹配项，无需后端修改：

1. **TabBar 适配**: 微信 TabBar 最多 5 个 tab，使用自定义 TabBar（`custom: true`）实现顾客端 2tab / 商家端 4tab 动态切换。
2. **地图坐标缺失**: 已硬编码默认坐标占位，后续补充经纬度后改为动态获取。
3. **计时详情数据**: 计时详情页暂时通过 `GET /api/timer/dashboard` 匹配 sessionId 获取数据，扩展记录列表暂时为空。

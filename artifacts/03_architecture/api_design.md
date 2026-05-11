# 拼豆店预约计时小程序 — API 设计

## 文档信息

| 项目 | 内容 |
|------|------|
| 文档版本 | v1.0 |
| 创建日期 | 2026-05-11 |
| 负责 Agent | architect |
| 输入来源 | PRD v1.0、用户流程 v1.0、数据库设计 v1.0 |

---

## 1. API 总览

### 1.1 基础信息

| 项目 | 说明 |
|------|------|
| 协议 | HTTPS |
| 域名（开发） | `https://localhost:443` |
| 域名（生产） | `https://api.your-bead-store.com` |
| 前缀 | `/api` |
| 请求/响应格式 | JSON |
| 字符编码 | UTF-8 |

### 1.2 认证方式

所有需要认证的接口在请求头携带：

```
Authorization: Bearer <JWT_TOKEN>
```

JWT 获取方式：
- **小程序端**：调用 `POST /api/auth/wechat-login`，传入微信 `code`
- **Web 后台**：调用 `POST /api/auth/admin-login`，传入用户名密码

### 1.3 端点总览

| 模块 | 端点数 | 需要认证 |
|------|:-----:|:------:|
| Auth（认证） | 3 | 部分 |
| Store（门店） | 2 | 部分 |
| Reservation（预约） | 9 | 是 |
| Timer（计时） | 3 | 是 (merchant) |
| Member（会员） | 2 | 是 (merchant) |
| Coupon（团购券） | 1 | 是 (merchant) |
| Rules（规则） | 1 | 是 (merchant) |
| **合计** | **21** | |

---

## 2. 通用规范

### 2.1 统一响应格式

所有成功响应：

```json
{
  "code": 0,
  "message": "ok",
  "data": { ... }
}
```

所有错误响应：

```json
{
  "code": 40001,
  "message": "该时段已约满，请选择其他时段",
  "data": null
}
```

### 2.2 错误码规范

| 类别 | 错误码范围 | 示例 | 说明 |
|------|-----------|------|------|
| 认证错误 | 10001 - 10099 | 10001: 未登录, 10002: Token 过期, 10003: 无权限 | — |
| 参数校验 | 20001 - 20099 | 20001: 参数缺失, 20002: 参数格式错误 | — |
| 业务错误 | 30001 - 30099 | 30001: 时段已满, 30002: 重复预约, 30003: 超过取消时间, 30004: 该预约不属于您, 30005: 状态不允许此操作 | — |
| 资源不存在 | 40001 - 40099 | 40001: 门店不存在, 40002: 预约不存在, 40003: 会员不存在 | — |
| 服务器错误 | 50001 - 50099 | 50001: 服务器内部错误, 50002: 数据库错误 | — |

### 2.3 分页规范

**请求参数**：

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| page | number | 1 | 页码（从 1 开始） |
| page_size | number | 20 | 每页条数（最大 100） |

**响应格式**：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "list": [ ... ],
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total": 85,
      "total_pages": 5
    }
  }
}
```

### 2.4 时间格式

- **日期**：`"2026-05-11"` (ISO 8601 date)
- **时间**：`"14:00"` (HH:mm)
- **时间戳**：`"2026-05-11T14:05:00+08:00"` (ISO 8601 datetime with timezone)

### 2.5 手机号脱敏规则

- API 返回手机号时，根据调用方角色决定：
  - **顾客查看自己的预约**：返回完整手机号
  - **商家查看预约列表/会员列表**：返回脱敏格式 `138****5678`
  - **商家查看详情**：返回完整手机号（方便拨打）

---

## 3. API 详细设计

### 3.1 认证模块 (Auth)

---

#### POST /api/auth/wechat-login

**说明**：微信小程序端登录，用微信 code 换取 JWT。

**认证**：否

**请求体**：

```json
{
  "code": "0b1a2b3c4d5e6f7g8h9i0j"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|:---:|------|
| code | string | 是 | wx.login() 返回的临时 code |

**响应**：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "token": "eyJhbGciOi...",
    "expires_in": 604800,
    "role": "customer",
    "nickname": "微信用户",
    "openid": "oUpF8uMuAJO_M2pxb1Q9zNjWeS6o"
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| token | string | JWT Token |
| expires_in | number | 有效期（秒），7天=604800 |
| role | string | `"customer"` 或 `"merchant"` |
| nickname | string | 微信昵称 |
| openid | string | 微信 OpenID |

**逻辑**：
1. 后端用 code 调用微信接口 `https://api.weixin.qq.com/sns/jscode2session` 换取 openid 和 session_key。
2. 查询 `merchant_accounts.wechat_openid` 是否匹配该 openid：
   - 匹配：role = `"merchant"`
   - 不匹配：role = `"customer"`
3. 签发 JWT，payload 包含 `{ sub: openid, role: role }`。

---

#### POST /api/auth/admin-login

**说明**：商家 Web 后台登录。

**认证**：否

**请求体**：

```json
{
  "username": "admin",
  "password": "admin123"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|:---:|------|
| username | string | 是 | 用户名 |
| password | string | 是 | 密码 |

**响应**：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "token": "eyJhbGciOi...",
    "expires_in": 86400,
    "role": "merchant",
    "username": "admin"
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| token | string | JWT Token |
| expires_in | number | 有效期（秒），24小时=86400 |
| role | string | 固定为 `"merchant"` |
| username | string | 用户名 |

**错误**：

| code | message | 触发条件 |
|------|---------|----------|
| 10003 | 用户名或密码错误 | 账密不匹配 |

---

#### POST /api/auth/refresh-token

**说明**：用未过期的 Token 换取新 Token。

**认证**：是（需要传即将过期的 Token）

**请求体**：空

**响应**：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "token": "eyJhbGciOi...",
    "expires_in": 604800
  }
}
```

---

### 3.2 门店模块 (Store)

---

#### GET /api/store/info

**说明**：获取门店公开展示信息（顾客端门店主页用）。

**认证**：否

**请求参数**：无

**响应**：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "id": 1,
    "name": "XX拼豆工作室",
    "address": "广东省广州市天河区XX路XX号XX大厦302室",
    "address_guide": "3楼出电梯右转302室",
    "phone": "13800000000",
    "photos": ["https://cdn.example.com/photo1.jpg", "https://cdn.example.com/photo2.jpg"],
    "open_time": "10:00",
    "close_time": "22:00",
    "rest_days": [0],
    "table_count": 8,
    "description": "提供200+种颜色拼豆，适合亲子、情侣、朋友聚会",
    "is_open_today": true,
    "today_available_slots": 12
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| id | number | 门店 ID |
| name | string | 门店名称 |
| address | string | 完整地址 |
| address_guide | string | 门牌指引，可能为空 |
| phone | string | 联系电话 |
| photos | string[] | 门店照片 URL 数组 |
| open_time | string | 营业开始时间 (HH:mm) |
| close_time | string | 营业结束时间 (HH:mm) |
| rest_days | number[] | 固定休息日（0=周日,1=周一,...,6=周六） |
| table_count | number | 桌位总数 |
| description | string | 门店介绍，可能为空 |
| is_open_today | boolean | 今日是否营业 |
| today_available_slots | number | 今日所有时段剩余容量之和 |

---

#### GET /api/store/config

**说明**：获取门店完整配置（商家 Web 后台 W04 用）。

**认证**：是 (`role: merchant`)

**响应**：与 `GET /api/store/info` 相同，额外包含 `created_at`、`updated_at`。

---

#### PUT /api/store/config

**说明**：更新门店配置。

**认证**：是 (`role: merchant`)

**请求体**：

```json
{
  "name": "XX拼豆工作室",
  "address": "广东省广州市天河区XX路XX号XX大厦302室",
  "address_guide": "3楼出电梯右转302室",
  "phone": "13800000000",
  "photos": ["https://cdn.example.com/photo1.jpg"],
  "open_time": "10:00",
  "close_time": "22:00",
  "rest_days": [0],
  "table_count": 8,
  "description": "提供200+种颜色拼豆"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|:---:|------|
| name | string | 是 | 门店名称，最长 30 字 |
| address | string | 是 | 完整地址，最长 200 字 |
| address_guide | string | 否 | 门牌指引，最长 100 字 |
| phone | string | 是 | 联系电话，11 位手机号 |
| photos | string[] | 是 | 照片 URL 数组，最少 1 张最多 9 张 |
| open_time | string | 是 | 营业开始时间，格式 HH:mm |
| close_time | string | 是 | 营业结束时间，格式 HH:mm |
| rest_days | number[] | 否 | 固定休息日数组 |
| table_count | number | 是 | 桌位总数，>= 1 |
| description | string | 否 | 门店介绍，最长 200 字 |

**响应**：更新后的门店配置对象。

**错误**：

| code | message | 触发条件 |
|------|---------|----------|
| 20001 | 门店名称不能为空 | name 为空 |
| 20002 | 至少保留一张门店照片 | photos 数组为空或少于 1 张 |
| 20002 | 门店照片不能超过 9 张 | photos 数组超过 9 张 |

---

### 3.3 预约模块 (Reservation)

---

#### GET /api/reservations/slots

**说明**：获取指定日期的可预约时段列表（含容量信息）。

**认证**：否（顾客浏览时） / 是（商家代约时）

**请求参数**：

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|:---:|--------|------|
| date | string | 是 | — | 日期，格式 YYYY-MM-DD |

**响应**：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "date": "2026-05-11",
    "is_open": true,
    "slots": [
      {
        "start_time": "10:00",
        "end_time": "11:00",
        "total_tables": 8,
        "booked_count": 5,
        "available_count": 3,
        "is_available": true,
        "is_past": false,
        "is_cutoff": false
      },
      {
        "start_time": "11:00",
        "end_time": "12:00",
        "total_tables": 8,
        "booked_count": 8,
        "available_count": 0,
        "is_available": false,
        "is_past": false,
        "is_cutoff": false
      }
    ]
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| date | string | 查询日期 |
| is_open | boolean | 该日期是否营业（非休息日） |
| slots[].start_time | string | 时段开始时间 |
| slots[].end_time | string | 时段结束时间 |
| slots[].total_tables | number | 总桌位数 |
| slots[].booked_count | number | 已预约数（pending + confirmed + in_progress） |
| slots[].available_count | number | 剩余可预约数 |
| slots[].is_available | boolean | 是否可预约（有空位 + 未截止 + 未过期） |
| slots[].is_past | boolean | 是否已过时（当前时间已超过时段开始时间） |
| slots[].is_cutoff | boolean | 是否已截止（距离时段开始不足 cutoff_minutes） |

**时段生成逻辑**：
1. 获取门店营业时间（open_time, close_time）和时段时长（slot_duration）。
2. 从 open_time 开始，按 slot_duration 生成时段列表。
3. 最后一个时段结束时间 <= close_time。
4. 对每个时段，查询 reservations 表统计 booked_count。

---

#### POST /api/reservations

**说明**：顾客提交预约。

**认证**：是 (`role: customer` 或 `role: merchant`)

**请求体**：

```json
{
  "reservation_date": "2026-05-11",
  "slot_start_time": "14:00",
  "slot_end_time": "15:00",
  "guest_count": 2,
  "customer_phone": "13800001111",
  "customer_name": "张三",
  "remark": "靠窗位置"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|:---:|------|
| reservation_date | string | 是 | 预约日期，格式 YYYY-MM-DD |
| slot_start_time | string | 是 | 时段开始时间，格式 HH:mm |
| slot_end_time | string | 是 | 时段结束时间，格式 HH:mm |
| guest_count | number | 否 | 人数，默认 1，范围 1-10 |
| customer_phone | string | 是 | 手机号，11 位 |
| customer_name | string | 是 | 顾客姓名（微信昵称） |
| remark | string | 否 | 备注，最长 100 字 |

**响应**：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "id": 42,
    "reservation_date": "2026-05-11",
    "slot_start_time": "14:00",
    "slot_end_time": "15:00",
    "guest_count": 2,
    "customer_name": "张三",
    "customer_phone": "13800001111",
    "status": "pending",
    "source": "customer",
    "remark": "靠窗位置",
    "created_at": "2026-05-11T09:30:00+08:00"
  }
}
```

**错误**：

| code | message | 触发条件 |
|------|---------|----------|
| 30001 | 该时段已约满，请选择其他时段 | 容量不足 |
| 30002 | 您在该时段已有预约，请勿重复预约 | 同一 openid + 同一日期 + 同一时段已存在有效预约 |
| 20003 | 非营业日期，无法预约 | 日期是休息日 |
| 20004 | 预约日期超出可预约范围 | 超过 advance_days 限制 |
| 20001 | 请输入正确的手机号 | 手机号格式不对 |

**逻辑**：
1. 校验所有参数。
2. 在事务中：
   - 使用 `SELECT ... FOR UPDATE` 锁定该时段的预约记录。
   - 计算占用数，判断是否 >= table_count。
   - 若有余量，创建预约记录。
   - 根据 `require_confirmation` 设置 status：`pending` 或 `confirmed`。
3. 返回新建的预约记录。

---

#### GET /api/reservations/my

**说明**：顾客查看自己的预约列表。

**认证**：是 (`role: customer`)

**请求参数**：

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|:---:|--------|------|
| status | string | 否 | — | 筛选状态，可选值：`all`/`pending`/`confirmed`/`completed`/`cancelled` |
| page | number | 否 | 1 | 页码 |
| page_size | number | 否 | 20 | 每页条数 |

**响应**：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "list": [
      {
        "id": 42,
        "reservation_date": "2026-05-11",
        "slot_start_time": "14:00",
        "slot_end_time": "15:00",
        "guest_count": 2,
        "status": "pending",
        "source": "customer",
        "store_name": "XX拼豆工作室",
        "can_cancel": true,
        "created_at": "2026-05-11T09:30:00+08:00"
      }
    ],
    "pagination": { ... }
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| list[].id | number | 预约 ID |
| list[].status | string | 状态枚举值 |
| list[].can_cancel | boolean | 当前是否可取消 |
| list[].store_name | string | 门店名称 |

---

#### GET /api/reservations/:id

**说明**：获取预约详情。

**认证**：是 (`role: customer` 仅自己的 / `role: merchant` 所有)

**请求参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|:---:|------|
| id | number | 是 | 预约 ID（路径参数） |

**响应**：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "id": 42,
    "reservation_date": "2026-05-11",
    "slot_start_time": "14:00",
    "slot_end_time": "15:00",
    "guest_count": 2,
    "customer_name": "张三",
    "customer_phone": "138****5678",
    "customer_phone_full": "13800005678",
    "status": "confirmed",
    "source": "customer",
    "cancel_reason": null,
    "rejection_reason": null,
    "remark": "靠窗位置",
    "store_name": "XX拼豆工作室",
    "store_address": "广东省广州市...",
    "can_cancel": true,
    "timer_session": null,
    "created_at": "2026-05-11T09:30:00+08:00",
    "updated_at": "2026-05-11T09:35:00+08:00"
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| customer_phone | string | 脱敏手机号（列表展示用） |
| customer_phone_full | string | 完整手机号（详情用，仅商家可见） |
| timer_session | object|null | 关联的计时会话信息，无则为 null |
| can_cancel | boolean | 当前是否可取消（判断取消截止时间） |

**timer_session 子对象**（当状态为 `in_progress` 或 `completed` 时）：

```json
{
  "id": 1,
  "table_number": 3,
  "check_in_time": "2026-05-11T14:05:00+08:00",
  "expected_end_time": "2026-05-11T15:05:00+08:00",
  "actual_end_time": null,
  "original_duration_minutes": 60,
  "total_extension_minutes": 30,
  "status": "active",
  "remaining_seconds": 540,
  "extensions": [
    { "id": 1, "extension_minutes": 30, "created_at": "2026-05-11T14:35:00+08:00" }
  ],
  "coupons": [
    { "id": 1, "coupon_code": "MT202605110001", "coupon_source": "meituan", "coupon_type": "2小时体验券" }
  ]
}
```

---

#### POST /api/reservations/:id/cancel

**说明**：顾客取消预约。

**认证**：是 (`role: customer`，仅自己的预约)

**响应**：

```json
{
  "code": 0,
  "message": "预约已取消"
}
```

**错误**：

| code | message | 触发条件 |
|------|---------|----------|
| 30003 | 已超过取消时间，如需取消请联系商家 | 当前时间 > 预约开始时间 - customer_cancel_hours |
| 30005 | 当前状态不允许取消 | 状态不是 pending 或 confirmed |

---

#### GET /api/reservations/merchant

**说明**：商家查看所有预约列表。

**认证**：是 (`role: merchant`)

**请求参数**：

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|:---:|--------|------|
| date | string | 否 | 今天 | 日期筛选，格式 YYYY-MM-DD |
| status | string | 否 | all | all/pending/confirmed/in_progress/completed/cancelled |
| search | string | 否 | — | 按手机号或姓名搜索 |
| page | number | 否 | 1 | 页码 |
| page_size | number | 否 | 20 | 每页条数 |

**响应**：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "list": [
      {
        "id": 42,
        "customer_name": "张三",
        "customer_phone": "138****5678",
        "reservation_date": "2026-05-11",
        "slot_start_time": "14:00",
        "slot_end_time": "15:00",
        "guest_count": 2,
        "status": "pending",
        "source": "customer",
        "remark": "靠窗位置",
        "created_at": "2026-05-11T09:30:00+08:00"
      }
    ],
    "summary": {
      "pending_count": 3,
      "confirmed_count": 10,
      "in_progress_count": 4
    },
    "pagination": { ... }
  }
}
```

---

#### POST /api/reservations/merchant

**说明**：商家手动添加预约（代客预约）。

**认证**：是 (`role: merchant`)

**请求体**：

```json
{
  "reservation_date": "2026-05-11",
  "slot_start_time": "14:00",
  "slot_end_time": "15:00",
  "guest_count": 3,
  "customer_phone": "13900002222",
  "customer_name": "李四",
  "remark": "电话预约"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|:---:|------|
| reservation_date | string | 是 | 预约日期 |
| slot_start_time | string | 是 | 时段开始时间 |
| slot_end_time | string | 是 | 时段结束时间 |
| guest_count | number | 否 | 人数，默认 1 |
| customer_phone | string | 是 | 顾客手机号 |
| customer_name | string | 是 | 顾客姓名 |
| remark | string | 否 | 备注 |

**响应**：

```json
{
  "code": 0,
  "message": "预约添加成功",
  "data": {
    "id": 43,
    "reservation_date": "2026-05-11",
    "slot_start_time": "14:00",
    "slot_end_time": "15:00",
    "guest_count": 3,
    "customer_name": "李四",
    "customer_phone": "13900002222",
    "status": "confirmed",
    "source": "merchant",
    "created_at": "2026-05-11T10:00:00+08:00"
  }
}
```

**逻辑**：与顾客预约相同，但 source = `"merchant"`，status 固定 `"confirmed"`（跳过确认流程）。

---

#### POST /api/reservations/:id/confirm

**说明**：商家确认待确认的预约。

**认证**：是 (`role: merchant`)

**响应**：

```json
{
  "code": 0,
  "message": "预约已确认"
}
```

**错误**：

| code | message | 触发条件 |
|------|---------|----------|
| 30005 | 仅待确认状态的预约可确认 | 状态不是 pending |

---

#### POST /api/reservations/:id/reject

**说明**：商家拒绝待确认的预约。

**认证**：是 (`role: merchant`)

**请求体**：

```json
{
  "reason": "该时段已满，请选择其他时段"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|:---:|------|
| reason | string | 否 | 拒绝原因，最长 100 字 |

**响应**：

```json
{
  "code": 0,
  "message": "预约已拒绝"
}
```

**逻辑**：status 变为 `rejected`，释放该时段容量。

---

### 3.4 计时模块 (Timer)

---

#### POST /api/reservations/:id/checkin

**说明**：商家为顾客办理到店登记，开始计时。

**认证**：是 (`role: merchant`)

**请求体**：

```json
{
  "table_number": 3,
  "coupons": [
    {
      "coupon_code": "MT202605110001",
      "coupon_source": "meituan",
      "coupon_type": "2小时体验券"
    }
  ]
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|:---:|------|
| table_number | number | 否 | 桌位号，若不传则自动分配最小可用号 |
| coupons | array | 否 | 团购券列表，无券则为空数组 |
| coupons[].coupon_code | string | 是 | 券码 |
| coupons[].coupon_source | string | 是 | 券来源：meituan/douyin/other |
| coupons[].coupon_type | string | 否 | 券类型描述 |

**响应**：

```json
{
  "code": 0,
  "message": "已开始计时",
  "data": {
    "timer_session_id": 1,
    "table_number": 3,
    "check_in_time": "2026-05-11T14:05:00+08:00",
    "expected_end_time": "2026-05-11T15:05:00+08:00",
    "original_duration_minutes": 60,
    "reservation_status": "in_progress"
  }
}
```

**错误**：

| code | message | 触发条件 |
|------|---------|----------|
| 30005 | 仅已确认状态的预约可到店登记 | 状态不是 confirmed |
| 20006 | 预约日期不是今天，无法到店登记 | reservation_date != 今天 |

**逻辑**：
1. 校验预约状态为 `confirmed`，且预约日期为今天。
2. 创建 `timer_sessions` 记录：
   - `check_in_time` = NOW()
   - `expected_end_time` = check_in_time + original_duration_minutes
   - `status` = `active`
3. 更新 `reservations.status` = `in_progress`。
4. 如果传了 coupons，批量创建 `coupons` 记录。
5. 以上操作在同一事务中。

---

#### POST /api/timer/:sessionId/extend

**说明**：商家对正在计时的顾客进行加时操作。

**认证**：是 (`role: merchant`)

**请求体**：

```json
{
  "extension_minutes": 60
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|:---:|------|
| extension_minutes | number | 是 | 加时时长（分钟），必须 > 0 |

**响应**：

```json
{
  "code": 0,
  "message": "已加时 +60 分钟",
  "data": {
    "timer_session_id": 1,
    "new_remaining_seconds": 3540,
    "total_extension_minutes": 90
  }
}
```

**逻辑**：
1. 校验 timer_session 状态为 `active`。
2. 创建 `timer_extensions` 记录。
3. 更新 `timer_sessions.total_extension_minutes` += extension_minutes。
4. 计算新剩余时间返回。

---

#### POST /api/timer/:sessionId/end

**说明**：商家结束计时，顾客离店。

**认证**：是 (`role: merchant`)

**响应**：

```json
{
  "code": 0,
  "message": "计时已结束",
  "data": {
    "timer_session_id": 1,
    "actual_end_time": "2026-05-11T15:37:00+08:00",
    "total_duration_minutes": 122,
    "reservation_status": "completed"
  }
}
```

**逻辑**（在事务中执行）：
1. 更新 `timer_sessions`：
   - `actual_end_time` = NOW()
   - `status` = `completed`
2. 更新 `reservations.status` = `completed`。
3. 查找或创建会员：
   - 按 `customer_phone` 查找 `members` 表
   - 不存在则创建，存在则更新 `total_visits`、`total_duration_minutes`、`last_visit_date`、`name`
4. 创建 `consumption_records` 记录，关联 member_id、reservation_id、timer_session_id。
5. 记录日志。

---

### 3.5 计时看板

#### GET /api/timer/dashboard

**说明**：商家获取计时看板数据。

**认证**：是 (`role: merchant`)

**响应**：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "active_count": 3,
    "available_tables": 5,
    "sessions": [
      {
        "id": 1,
        "customer_name": "张三",
        "table_number": 3,
        "slot_start_time": "14:00",
        "slot_end_time": "15:00",
        "check_in_time": "2026-05-11T14:05:00+08:00",
        "used_minutes": 32,
        "remaining_seconds": 1680,
        "total_extension_minutes": 0,
        "is_urgent": false,
        "is_critical": false
      },
      {
        "id": 2,
        "customer_name": "李四",
        "table_number": 1,
        "slot_start_time": "14:00",
        "slot_end_time": "15:00",
        "check_in_time": "2026-05-11T14:01:00+08:00",
        "used_minutes": 56,
        "remaining_seconds": 240,
        "total_extension_minutes": 30,
        "is_urgent": true,
        "is_critical": false
      }
    ]
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| active_count | number | 正在计时的顾客数 |
| available_tables | number | 当前空闲桌位数 = table_count - active_count |
| sessions[].remaining_seconds | number | 剩余秒数（实时计算） |
| sessions[].is_urgent | boolean | 剩余 < 15分钟 (剩余秒数 < 900) |
| sessions[].is_critical | boolean | 剩余 < 5分钟 (剩余秒数 < 300) |

**排序**：按 `remaining_seconds` 升序（最快要到期的在最前面）。

---

### 3.6 会员模块 (Member)

---

#### GET /api/members

**说明**：商家搜索会员。

**认证**：是 (`role: merchant`)

**请求参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|:---:|------|
| search | string | 是 | 手机号精确匹配 或 姓名模糊搜索 |
| page | number | 否 | 页码 |
| page_size | number | 否 | 每页条数 |

**响应**：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "list": [
      {
        "id": 1,
        "name": "张三",
        "phone": "138****5678",
        "total_visits": 3,
        "total_duration_minutes": 370,
        "last_visit_date": "2026-05-11"
      }
    ],
    "pagination": { ... }
  }
}
```

**逻辑**：
- 如果 search 是全数字且长度 11 位，按 phone 精确匹配。
- 否则，按 name 模糊搜索（LIKE '%keyword%'）。

---

#### GET /api/members/:id

**说明**：查看会员详情和历史消费记录。

**认证**：是 (`role: merchant`)

**请求参数**：

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|:---:|--------|------|
| page | number | 否 | 1 | 消费记录页码 |
| page_size | number | 否 | 20 | 每页条数 |

**响应**：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "id": 1,
    "name": "张三",
    "phone": "138****5678",
    "phone_full": "13800005678",
    "total_visits": 3,
    "total_duration_minutes": 370,
    "last_visit_date": "2026-05-11",
    "records": {
      "list": [
        {
          "id": 1,
          "visit_date": "2026-05-11",
          "check_in_time": "2026-05-11T14:05:00+08:00",
          "check_out_time": "2026-05-11T15:37:00+08:00",
          "duration_minutes": 122,
          "has_coupon": true,
          "source": "customer"
        }
      ],
      "pagination": { ... }
    }
  }
}
```

---

### 3.7 团购券模块 (Coupon)

---

#### GET /api/coupons

**说明**：商家查看团购券核销记录。

**认证**：是 (`role: merchant`)

**请求参数**：

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|:---:|--------|------|
| source | string | 否 | all | all/meituan/douyin/other |
| start_date | string | 否 | — | 开始日期，格式 YYYY-MM-DD |
| end_date | string | 否 | — | 结束日期，格式 YYYY-MM-DD |
| page | number | 否 | 1 | 页码 |
| page_size | number | 否 | 20 | 每页条数 |

**响应**：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "list": [
      {
        "id": 1,
        "coupon_code": "MT202605110001",
        "coupon_source": "meituan",
        "coupon_type": "2小时体验券",
        "customer_name": "张三",
        "customer_phone": "138****5678",
        "visit_date": "2026-05-11",
        "created_at": "2026-05-11T14:05:00+08:00"
      }
    ],
    "pagination": { ... }
  }
}
```

---

### 3.8 规则模块 (Rules)

---

#### GET /api/rules

**说明**：获取预约规则配置。

**认证**：是 (`role: merchant`)

**响应**：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "id": 1,
    "require_confirmation": false,
    "advance_days": 7,
    "cutoff_minutes": 60,
    "auto_cancel_hours": null,
    "customer_cancel_hours": 3,
    "slot_duration": 60
  }
}
```

---

#### PUT /api/rules

**说明**：更新预约规则配置。

**认证**：是 (`role: merchant`)

**请求体**：

```json
{
  "require_confirmation": true,
  "advance_days": 7,
  "cutoff_minutes": 30,
  "auto_cancel_hours": 2,
  "customer_cancel_hours": 3,
  "slot_duration": 60
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|:---:|------|
| require_confirmation | boolean | 是 | 预约是否需要确认 |
| advance_days | number | 是 | 提前预约天数，>= 1 |
| cutoff_minutes | number | 是 | 截止分钟数，>= 0 |
| auto_cancel_hours | number/null | 否 | 自动取消小时数，null 表示不启用自动取消 |
| customer_cancel_hours | number | 是 | 顾客可取消的小时数，>= 0 |
| slot_duration | number | 是 | 时段时长，仅支持 30/60/90/120 |

**响应**：更新后的规则对象。

---

### 3.9 文件上传

#### POST /api/upload/image

**说明**：商家上传门店照片。

**认证**：是 (`role: merchant`)

**请求**：`multipart/form-data`

| 字段 | 类型 | 必填 | 说明 |
|------|------|:---:|------|
| file | File | 是 | 图片文件，支持 jpg/png/webp，最大 2MB |

**响应**：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "url": "https://api.your-bead-store.com/uploads/2026/05/abc123.jpg"
  }
}
```

---

## 4. JWT Payload 设计

```json
{
  "sub": "oUpF8uMuAJO_M2pxb1Q9zNjWeS6o",
  "role": "merchant",
  "iat": 1746950000,
  "exp": 1747036400
}
```

| 字段 | 说明 |
|------|------|
| sub | 用户标识：小程序端为 openid，Web 端为 username |
| role | 角色：`customer` 或 `merchant` |
| iat | 签发时间戳 |
| exp | 过期时间戳 |

---

## 5. 文档修订记录

| 版本 | 日期 | 修改内容 | 修改人 |
|------|------|----------|--------|
| v1.0 | 2026-05-11 | 初稿创建 | architect |

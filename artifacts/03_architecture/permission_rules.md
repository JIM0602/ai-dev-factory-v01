# 拼豆店预约计时小程序 — 权限规则

## 文档信息

| 项目 | 内容 |
|------|------|
| 文档版本 | v1.0 |
| 创建日期 | 2026-05-11 |
| 负责 Agent | architect |
| 输入来源 | PRD v1.0、API 设计 v1.0、系统架构设计 v1.0 |

---

## 1. 角色定义

V1 版本仅定义 2 个角色，无层级关系。

| 角色 | 标识 | 说明 |
|------|------|------|
| **顾客 (Customer)** | `customer` | 使用小程序的普通消费者，通过微信授权登录 |
| **商家 (Merchant)** | `merchant` | 拼豆店经营者，可访问顾客端和商家端的所有功能 |

> V1 不做：店员角色、多门店管理员、连锁总部角色（PRD 明确列入 V2）。

---

## 2. 认证方式

### 2.1 微信小程序端（顾客 + 商家）

```
顾客打开小程序
       │
       v
wx.login() 获取临时 code
       │
       v
POST /api/auth/wechat-login { code }
       │
       v
后端：code → 微信接口 → openid
       │
       v
后端：查询 merchant_accounts.wechat_openid
       │
       ├── 匹配 → role = "merchant"
       │
       └── 不匹配 → role = "customer"
       │
       v
后端：签发 JWT { sub: openid, role: role }
返回 token + role 给小程序
       │
       v
小程序：存储 token，根据 role 展示对应界面
```

| 项目 | 说明 |
|------|------|
| 认证方式 | 微信授权登录（wx.login code 换 JWT） |
| Token 有效期 | 7 天 |
| Token 存储 | uni-app Storage（微信 storage） |
| 自动刷新 | Token 过期前调用 `/api/auth/refresh-token` |

### 2.2 商家 Web 后台

```
商家打开 Web 后台
       │
       v
输入用户名 + 密码
       │
       v
POST /api/auth/admin-login { username, password }
       │
       v
后端：bcrypt 验证密码 → 查询 merchant_accounts
       │
       v
后端：签发 JWT { sub: username, role: "merchant" }
返回 token 给浏览器
       │
       v
浏览器：存储 token 到 localStorage
       │
       v
axios 请求拦截器自动注入 Authorization header
```

| 项目 | 说明 |
|------|------|
| 认证方式 | 用户名 + 密码 |
| Token 有效期 | 24 小时 |
| Token 存储 | localStorage |
| 路由守卫 | Vue Router 守卫检查 Token，未登录跳转 `/login` |

### 2.3 商家身份配置（V1 初始化）

V1 只有 1 个商家账号。初始化方式：

1. **Web 后台账号**：数据库 `merchant_accounts` 表预置一条记录，初始密码在部署时通过环境变量 `INIT_ADMIN_PASSWORD` 设置，首次登录后建议修改。

2. **小程序商家身份**：商家第一次在微信小程序中使用后，其 OpenID 需要与 Web 后台账号关联。流程如下：
   - 商家在 Web 后台的"账号设置"页面（V1 可简化为数据库直接操作），录入自己的微信 OpenID。
   - 录入后，该 OpenID 在小程序登录时被识别为 `role: merchant`。

> 简化方案（V1）：直接在数据库 `merchant_accounts.wechat_openid` 字段填入商家微信 OpenID。商家可从开发工具中获取自己的 OpenID。

---

## 3. API 权限矩阵

### 3.1 认证要求

| 符号 | 含义 |
|------|------|
| P (Public) | 不需要认证即可访问 |
| C (Customer) | 需要认证，仅 `role: customer` 可访问，且只能操作自己的数据 |
| M (Merchant) | 需要认证，仅 `role: merchant` 可访问，可操作所有数据 |
| C/M | customer 或 merchant 均可访问 |

### 3.2 权限表

| API | 方法 | 权限 | 额外限制 |
|-----|------|:----:|----------|
| `/api/auth/wechat-login` | POST | P | — |
| `/api/auth/admin-login` | POST | P | — |
| `/api/auth/refresh-token` | POST | C/M | Token 未过期 |
| `/api/store/info` | GET | P | — |
| `/api/store/config` | GET | M | — |
| `/api/store/config` | PUT | M | — |
| `/api/reservations/slots` | GET | P | 顾客浏览时可公开，商家代约时也可调用 |
| `/api/reservations` | POST | C/M | 顾客创建时自动使用自己 openid；商家代约时 source=merchant |
| `/api/reservations/my` | GET | C | 仅返回当前 openid 的预约 |
| `/api/reservations/:id` | GET | C/M | 顾客只能查看自己的；商家可查看所有 |
| `/api/reservations/:id/cancel` | POST | C/M | 顾客只能取消自己的，商家可取消任何（客服场景） |
| `/api/reservations/merchant` | GET | M | — |
| `/api/reservations/merchant` | POST | M | — |
| `/api/reservations/:id/confirm` | POST | M | 仅 status=pending |
| `/api/reservations/:id/reject` | POST | M | 仅 status=pending |
| `/api/reservations/:id/checkin` | POST | M | 仅 status=confirmed 且 reservation_date=今天 |
| `/api/timer/:sessionId/extend` | POST | M | 仅 status=active |
| `/api/timer/:sessionId/end` | POST | M | 仅 status=active |
| `/api/timer/dashboard` | GET | M | — |
| `/api/members` | GET | M | — |
| `/api/members/:id` | GET | M | — |
| `/api/coupons` | GET | M | — |
| `/api/rules` | GET | M | — |
| `/api/rules` | PUT | M | — |
| `/api/upload/image` | POST | M | — |

---

## 4. 后端鉴权实现

### 4.1 Guard 层次

```
请求
  │
  v
┌─────────────────────┐
│  JwtAuthGuard        │  ← 验证 JWT Token 有效性，提取 payload
│  (全局或路由级)       │
└──────────┬──────────┘
           │
           v
┌─────────────────────┐
│  RolesGuard          │  ← 检查 JWT payload.role 是否匹配装饰器要求
│  (路由级)            │
└──────────┬──────────┘
           │
           v
┌─────────────────────┐
│  OwnershipGuard      │  ← 顾客场景：检查资源归属 (openid 匹配)
│  (特定路由)          │
└──────────┬──────────┘
           │
           v
      执行业务逻辑
```

### 4.2 NestJS 装饰器

```typescript
// 公开接口（无需认证）
@Public()
@Get('info')
getStoreInfo() { }

// 需要 merchant 角色
@Roles('merchant')
@Get('merchant')
getMerchantReservations() { }

// customer 或 merchant 均可
@Roles('customer', 'merchant')
@Get(':id')
getReservationDetail(@Param('id') id: number) { }

// 获取当前用户信息
@Get('my')
getMyReservations(@CurrentUser() user: JwtPayload) {
  // user.sub = openid, user.role = 'customer'
}
```

### 4.3 JWT 验证流程

```
1. 从请求头 Authorization 提取 Bearer Token
2. 使用密钥验证 Token 签名和过期时间
3. 解析 payload 得到 { sub, role, iat, exp }
4. 将 payload 注入到 request.user
5. RolesGuard 读取 request.user.role 与 @Roles() 装饰器比对
6. OwnershipGuard（客户场景）将 request.user.sub 与资源 owner 比对
```

---

## 5. 前端权限控制

### 5.1 微信小程序端

**角色切换逻辑**：

```
小程序启动
    │
    v
读取 Storage 中的 token 和 role
    │
    ├── 无 token → wx.login() → 调用 wechat-login API → 获取 role
    │
    └── 有 token → 验证是否过期
         │
         ├── 未过期 → 根据 role 展示界面
         │
         └── 已过期 → 重新 login
```

**界面展示规则**：

| 场景 | role=customer | role=merchant |
|------|:---:|:---:|
| TabBar 显示 | 首页、我的预约 | — |
| 默认首页 | 门店主页 (P01) | 工作台 (B01) |
| 顾客端页面 (P01-P05) | 可访问 | 可访问 |
| 商家端页面 (B01-B08) | 不可访问 | 可访问 |
| 角色切换入口 | 显示"商家入口"（若 openid 为商家） | 显示"顾客视角" |

**页面访问守卫**：

```typescript
// 在 pages/merchant/* 页面的 onLoad 中
if (userStore.role !== 'merchant') {
  uni.redirectTo({ url: '/pages/customer/store/index' })
}
```

### 5.2 商家 Web 后台

**路由守卫**：

```typescript
// router/index.ts
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  if (to.path === '/login') {
    // 已登录则跳转工作台
    if (authStore.isAuthenticated) return next('/dashboard')
    return next()
  }

  // 未登录则跳转登录页
  if (!authStore.isAuthenticated) {
    return next(`/login?redirect=${to.path}`)
  }

  // 所有后台页面统一要求 role=merchant
  if (authStore.role !== 'merchant') {
    authStore.logout()
    return next('/login')
  }

  next()
})
```

**Token 存储与恢复**：

```typescript
// store/auth.ts
export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('admin_token') || '',
    username: localStorage.getItem('admin_username') || '',
  }),
  getters: {
    isAuthenticated: (state) => !!state.token,
    role: () => 'merchant', // Web 后台固定 merchant
  },
  actions: {
    async login(username: string, password: string) {
      const res = await authApi.adminLogin({ username, password })
      this.token = res.data.token
      this.username = res.data.username
      localStorage.setItem('admin_token', res.data.token)
      localStorage.setItem('admin_username', res.data.username)
    },
    logout() {
      this.token = ''
      this.username = ''
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_username')
    }
  }
})
```

---

## 6. 数据访问权限

### 6.1 顾客数据隔离

顾客只能访问自己的预约数据：

| 资源 | 规则 |
|------|------|
| 预约列表 `/api/reservations/my` | 后端根据 JWT 中的 openid 过滤，只返回该顾客的预约 |
| 预约详情 `/api/reservations/:id` | 后端校验 `reservations.customer_openid === JWT.sub` |
| 取消预约 `/api/reservations/:id/cancel` | 后端校验 `reservations.customer_openid === JWT.sub` |

### 6.2 商家数据访问

商家可访问所有数据（V1 单门店，无门店隔离）。

| 资源 | 规则 |
|------|------|
| 所有预约 | 商家可查看、操作所有顾客的预约 |
| 门店配置 | 商家可读写 |
| 所有会员 | 商家可搜索、查看所有会员 |
| 所有团购券 | 商家可查看所有核销记录 |

### 6.3 手机号脱敏

| 场景 | 顾客看自己 | 商家看列表 | 商家看详情 |
|------|:---:|:---:|:---:|
| 预约列表 | 完整 | 脱敏 `138****5678` | — |
| 预约详情 | 完整 | — | 完整（方便拨打） |
| 会员搜索列表 | — | 脱敏 `138****5678` | — |
| 会员详情 | — | — | 完整（方便联系） |

脱敏逻辑在后端 Service 层统一处理，根据 API 返回的场景选择返回 `phone`（脱敏）或 `phone_full`（完整）。

---

## 7. 安全边界

### 7.1 请求安全

| 措施 | 说明 |
|------|------|
| HTTPS 强制 | Nginx 层配置 HTTP → HTTPS 重定向 |
| JWT 签名验证 | 后端验证每个请求的 JWT 签名 |
| CORS 限制 | 仅允许 Web 后台域名和小程序合法来源 |
| 请求频率限制 | 登录接口限流：同一 IP 每分钟最多 5 次尝试（防止暴力破解） |

### 7.2 数据安全

| 措施 | 说明 |
|------|------|
| 密码加密 | bcrypt (salt rounds >= 10) |
| 手机号脱敏 | 列表场景中间四位替换为 **** |
| SQL 注入防护 | 使用 TypeORM 参数化查询 |
| 文件上传 | 限制类型 (jpg/png/webp)，限制大小 (2MB)，不保留原始文件名 |

### 7.3 业务安全

| 场景 | 保护措施 |
|------|----------|
| 容量超卖 | 预约提交在事务中使用 `SELECT ... FOR UPDATE` 锁住时段预约记录 |
| 重复预约 | 同一 openid + 同日期 + 同时段检查已存在预约 |
| 超时取消 | 定时任务每分钟执行，在事务中批量更新 |
| 越权操作 | OwnershipGuard 校验顾客操作的资源归属 |

---

## 8. V1 不做但预留扩展点

| 项目 | V1 状态 | V2 扩展方向 |
|------|:---:|------|
| 多商家账号 | 不做 | `merchant_accounts` 表支持多条记录 |
| 店员角色 | 不做 | 新增 `role: staff`，细化权限矩阵 |
| 操作日志 | 不做 | 新增 `audit_logs` 表记录关键操作 |
| 数据导出 | 不做 | 新增导出 API |
| 微信订阅消息 | 仅建表和接口 | 接入微信订阅消息 API |
| API 版本控制 | 不做 | URL 前缀从 `/api` 升级为 `/api/v1` |

---

## 9. 文档修订记录

| 版本 | 日期 | 修改内容 | 修改人 |
|------|------|----------|--------|
| v1.0 | 2026-05-11 | 初稿创建 | architect |

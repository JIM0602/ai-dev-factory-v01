# 拼豆店预约计时小程序 — 项目结构

## 文档信息

| 项目 | 内容 |
|------|------|
| 文档版本 | v1.0 |
| 创建日期 | 2026-05-11 |
| 负责 Agent | architect |
| 输入来源 | 系统架构设计 v1.0、页面清单 v1.0 |

---

## 1. 仓库根目录结构

```
bead-store/
├── packages/
│   ├── miniprogram/          # uni-app 微信小程序（顾客端 + 商家端）
│   ├── admin-web/            # 商家 Web 后台 (Vue 3 + Vite)
│   └── server/               # 后端服务 (NestJS)
├── database/
│   └── init.sql              # 数据库初始化 SQL（开发/演示用）
├── docker/
│   ├── docker-compose.yml    # 服务编排
│   ├── nginx.conf            # Nginx 配置
│   ├── server.Dockerfile     # 后端镜像
│   └── admin-web.Dockerfile  # Web 后台镜像
├── artifacts/                # 项目文档（不参与构建）
│   ├── 01_requirements/
│   ├── 02_product/
│   └── 03_architecture/
├── knowledge/                # 经验沉淀
├── .gitignore
└── README.md
```

---

## 2. 微信小程序项目结构 (`packages/miniprogram/`)

```
packages/miniprogram/
├── src/
│   ├── pages/                    # 页面目录
│   │   ├── customer/             # 顾客端页面（5 页）
│   │   │   ├── store/            # P01 - 门店主页
│   │   │   │   └── index.vue
│   │   │   ├── reservation/      # 预约相关
│   │   │   │   ├── create.vue    # P02 - 发起预约
│   │   │   │   ├── result.vue    # P03 - 预约结果
│   │   │   │   ├── my-list.vue   # P04 - 我的预约列表
│   │   │   │   └── detail.vue    # P05 - 预约详情
│   │   │   └── ...
│   │   └── merchant/             # 商家端页面（8 页）
│   │       ├── dashboard/        # B01 - 工作台
│   │       │   └── index.vue
│   │       ├── reservation/      # 预约管理
│   │       │   ├── list.vue      # B02 - 预约列表
│   │       │   ├── detail.vue    # B03 - 预约详情
│   │       │   └── add.vue       # B04 - 添加预约
│   │       ├── timer/            # 计时管理
│   │       │   ├── dashboard.vue # B05 - 计时看板
│   │       │   └── checkin.vue   # B06 - 到店登记
│   │       └── member/            # 会员管理
│   │           ├── search.vue    # B07 - 会员查询
│   │           └── detail.vue    # B08 - 会员详情
│   │
│   ├── components/               # 共享组件
│   │   ├── common/               # 通用组件
│   │   │   ├── AppNavbar.vue     # 自定义导航栏
│   │   │   ├── EmptyState.vue    # 空态占位
│   │   │   └── LoadingSkeleton.vue # 骨架屏
│   │   ├── customer/             # 顾客端专用组件
│   │   │   ├── StoreBanner.vue   # 门店轮播图
│   │   │   ├── DateSelector.vue  # 日期选择器
│   │   │   ├── SlotPicker.vue    # 时段选择器
│   │   │   ├── ReservationCard.vue # 预约卡片
│   │   │   └── StatusTag.vue     # 状态标签
│   │   └── merchant/             # 商家端专用组件
│   │       ├── TimerCard.vue     # 计时卡片
│   │       ├── TimeExtensionPicker.vue # 加时选择器
│   │       ├── CouponInput.vue   # 团购券录入
│   │       └── ConfirmDialog.vue # 二次确认弹窗
│   │
│   ├── api/                      # API 服务层
│   │   ├── request.ts            # uni.request 封装（拦截器、Token 注入）
│   │   ├── auth.ts               # 认证 API
│   │   ├── store.ts              # 门店 API
│   │   ├── reservation.ts        # 预约 API
│   │   ├── timer.ts              # 计时 API
│   │   ├── member.ts             # 会员 API
│   │   └── coupon.ts             # 团购券 API
│   │
│   ├── store/                    # Pinia 状态管理
│   │   ├── user.ts               # 用户信息、角色、Token
│   │   ├── store.ts              # 门店信息（缓存）
│   │   ├── reservation.ts        # 预约列表、当前预约
│   │   └── timer.ts              # 计时看板数据
│   │
│   ├── utils/                    # 工具函数
│   │   ├── index.ts              # 通用工具
│   │   ├── date.ts               # 日期格式化、时段生成
│   │   ├── validator.ts          # 手机号校验等
│   │   └── constants.ts          # 状态枚举、颜色映射
│   │
│   ├── static/                   # 静态资源
│   │   ├── images/               # 图标、占位图
│   │   └── styles/               # 全局样式
│   │       ├── variables.scss    # 颜色、字体、间距变量
│   │       └── global.scss       # 全局样式重置
│   │
│   ├── App.vue                   # 应用入口
│   ├── main.ts                   # 主入口文件
│   ├── manifest.json             # uni-app 配置
│   ├── pages.json                # 页面路由配置
│   └── uni.scss                  # uni-app 内置变量
│
├── package.json
├── tsconfig.json
├── vite.config.ts                # uni-app 使用 Vite 编译
└── index.html
```

### 2.1 pages.json 路由规划

```json
{
  "pages": [
    { "path": "pages/customer/store/index", "style": { "navigationBarTitleText": "门店主页" } },
    { "path": "pages/customer/reservation/create", "style": { "navigationBarTitleText": "发起预约" } },
    { "path": "pages/customer/reservation/result", "style": { "navigationBarTitleText": "预约结果" } },
    { "path": "pages/customer/reservation/my-list", "style": { "navigationBarTitleText": "我的预约" } },
    { "path": "pages/customer/reservation/detail", "style": { "navigationBarTitleText": "预约详情" } },
    { "path": "pages/merchant/dashboard/index", "style": { "navigationBarTitleText": "工作台" } },
    { "path": "pages/merchant/reservation/list", "style": { "navigationBarTitleText": "预约管理" } },
    { "path": "pages/merchant/reservation/detail", "style": { "navigationBarTitleText": "预约详情" } },
    { "path": "pages/merchant/reservation/add", "style": { "navigationBarTitleText": "添加预约" } },
    { "path": "pages/merchant/timer/dashboard", "style": { "navigationBarTitleText": "计时看板" } },
    { "path": "pages/merchant/timer/checkin", "style": { "navigationBarTitleText": "到店登记" } },
    { "path": "pages/merchant/member/search", "style": { "navigationBarTitleText": "会员查询" } },
    { "path": "pages/merchant/member/detail", "style": { "navigationBarTitleText": "会员详情" } }
  ],
  "tabBar": {
    "list": [
      { "pagePath": "pages/customer/store/index", "text": "首页" },
      { "pagePath": "pages/customer/reservation/my-list", "text": "我的预约" }
    ]
  }
}
```

> **说明**：TabBar 仅用于顾客端。商家端通过顾客端入口切换进入，商家端内使用自定义导航切换页面。

---

## 3. 商家 Web 后台项目结构 (`packages/admin-web/`)

```
packages/admin-web/
├── src/
│   ├── pages/                    # 页面组件（按路由组织）
│   │   ├── login/
│   │   │   └── LoginPage.vue     # W01 - 登录页
│   │   ├── dashboard/
│   │   │   └── DashboardPage.vue # W02 - 工作台
│   │   ├── reservations/
│   │   │   └── ReservationPage.vue # W03 - 预约管理
│   │   ├── store/
│   │   │   ├── StoreSettingsPage.vue    # W04 - 门店设置
│   │   │   ├── ReservationRulesPage.vue # W05 - 预约规则
│   │   │   └── CapacityPage.vue         # W06 - 容量设置
│   │   ├── members/
│   │   │   └── MemberPage.vue     # W07 - 会员管理
│   │   └── coupons/
│   │       └── CouponPage.vue     # W08 - 团购券记录
│   │
│   ├── components/               # 组件
│   │   ├── layout/               # 布局组件
│   │   │   ├── AppLayout.vue     # 主布局（侧边栏 + 顶栏 + 内容区）
│   │   │   ├── SideMenu.vue      # 侧边导航菜单
│   │   │   └── TopHeader.vue     # 顶栏（用户信息、退出）
│   │   ├── common/               # 通用组件
│   │   │   ├── SearchBar.vue     # 搜索栏
│   │   │   ├── StatusTag.vue     # 状态标签（与小程序一致）
│   │   │   ├── DataTable.vue     # 数据表格封装
│   │   │   ├── ConfirmDialog.vue # 确认弹窗
│   │   │   └── EmptyState.vue    # 空态
│   │   └── forms/                # 表单组件
│   │       ├── ImageUploader.vue # 图片上传
│   │       ├── TimePicker.vue    # 时间选择
│   │       └── DaySelector.vue   # 休息日多选
│   │
│   ├── api/                      # API 层
│   │   ├── request.ts            # axios 实例（拦截器、Token 刷新）
│   │   ├── auth.ts               # 登录 API
│   │   ├── store.ts              # 门店配置 API
│   │   ├── reservation.ts        # 预约管理 API
│   │   ├── rules.ts              # 预约规则 API
│   │   ├── member.ts             # 会员 API
│   │   └── coupon.ts             # 团购券 API
│   │
│   ├── router/
│   │   └── index.ts              # 路由配置 + 导航守卫
│   │
│   ├── store/                    # Pinia 状态
│   │   ├── auth.ts               # 登录状态、Token
│   │   └── store.ts              # 门店配置缓存
│   │
│   ├── utils/
│   │   ├── constants.ts          # 状态枚举、选项列表
│   │   └── format.ts             # 日期格式化等
│   │
│   ├── styles/
│   │   ├── variables.scss        # 颜色、字体变量
│   │   └── global.scss           # 全局样式
│   │
│   ├── App.vue
│   └── main.ts
│
├── public/
│   └── favicon.ico
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── env.d.ts
```

### 3.1 Web 后台路由配置

| 路径 | 页面 | 组件 | 说明 |
|------|------|------|------|
| `/login` | W01 | LoginPage.vue | 登录页，不需要认证 |
| `/dashboard` | W02 | DashboardPage.vue | 工作台，需要认证 |
| `/reservations` | W03 | ReservationPage.vue | 预约管理 |
| `/store/settings` | W04 | StoreSettingsPage.vue | 门店设置 |
| `/store/rules` | W05 | ReservationRulesPage.vue | 预约规则 |
| `/store/capacity` | W06 | CapacityPage.vue | 容量设置 |
| `/members` | W07 | MemberPage.vue | 会员管理 |
| `/coupons` | W08 | CouponPage.vue | 团购券记录 |

---

## 4. 后端服务项目结构 (`packages/server/`)

```
packages/server/
├── src/
│   ├── modules/                  # 业务模块
│   │   ├── auth/                 # 认证模块
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.dto.ts       # 登录请求/响应 DTO
│   │   │   ├── jwt.strategy.ts   # JWT 验证策略
│   │   │   └── roles.guard.ts    # 角色守卫
│   │   │
│   │   ├── store/                # 门店模块
│   │   │   ├── store.module.ts
│   │   │   ├── store.controller.ts
│   │   │   ├── store.service.ts
│   │   │   ├── store.dto.ts
│   │   │   └── store.entity.ts
│   │   │
│   │   ├── reservation/          # 预约模块
│   │   │   ├── reservation.module.ts
│   │   │   ├── reservation.controller.ts
│   │   │   ├── reservation.service.ts
│   │   │   ├── reservation.dto.ts
│   │   │   ├── reservation.entity.ts
│   │   │   └── reservation-scheduler.ts  # 自动取消定时任务
│   │   │
│   │   ├── timer/                # 计时模块
│   │   │   ├── timer.module.ts
│   │   │   ├── timer.controller.ts
│   │   │   ├── timer.service.ts
│   │   │   ├── timer.dto.ts
│   │   │   ├── timer-session.entity.ts
│   │   │   └── timer-extension.entity.ts
│   │   │
│   │   ├── member/               # 会员模块
│   │   │   ├── member.module.ts
│   │   │   ├── member.controller.ts
│   │   │   ├── member.service.ts
│   │   │   ├── member.dto.ts
│   │   │   ├── member.entity.ts
│   │   │   └── consumption-record.entity.ts
│   │   │
│   │   ├── coupon/               # 团购券模块
│   │   │   ├── coupon.module.ts
│   │   │   ├── coupon.controller.ts
│   │   │   ├── coupon.service.ts
│   │   │   ├── coupon.dto.ts
│   │   │   └── coupon.entity.ts
│   │   │
│   │   └── message/              # 消息模块（V1 预留）
│   │       ├── message.module.ts
│   │       ├── message.entity.ts
│   │       └── message.service.ts
│   │
│   ├── common/                   # 通用模块
│   │   ├── decorators/
│   │   │   └── current-user.decorator.ts  # @CurrentUser() 参数装饰器
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts   # 统一异常处理
│   │   ├── interceptors/
│   │   │   └── response.interceptor.ts    # 统一响应格式
│   │   └── dto/
│   │       └── pagination.dto.ts          # 分页请求基类
│   │
│   ├── database/                 # 数据库
│   │   ├── data-source.ts        # TypeORM DataSource 配置
│   │   └── migrations/           # TypeORM Migration 文件
│   │       └── 001_initial.ts
│   │
│   ├── config/
│   │   ├── database.config.ts    # 数据库连接配置
│   │   ├── jwt.config.ts         # JWT 密钥和过期时间配置
│   │   └── wechat.config.ts      # 微信 AppID/AppSecret 配置
│   │
│   ├── app.module.ts             # 根模块
│   └── main.ts                   # 应用入口（启动监听 3000）
│
├── test/                         # 测试
│   ├── unit/
│   └── e2e/
├── uploads/                      # 上传文件存储目录（挂载 Volume）
├── package.json
├── tsconfig.json
├── tsconfig.build.json
├── nest-cli.json
└── .env                          # 环境变量（开发用，生产通过 Docker 注入）
```

---

## 5. 命名规范

### 5.1 文件命名

| 类型 | 规范 | 示例 |
|------|------|------|
| Vue 组件 | PascalCase | `ReservationCard.vue` |
| TypeScript 模块 | kebab-case | `reservation.service.ts` |
| 页面目录 | kebab-case | `merchant/reservation/` |
| 类型定义文件 | kebab-case | `reservation.dto.ts` |
| 样式文件 | kebab-case | `variables.scss` |
| SQL 文件 | kebab-case | `init.sql` |

### 5.2 代码命名

| 类型 | 规范 | 示例 |
|------|------|------|
| 变量 / 函数 | camelCase | `getReservationList` |
| 类 / 组件 / 接口 | PascalCase | `ReservationEntity` |
| 常量 | UPPER_SNAKE_CASE | `MAX_PHOTOS_COUNT` |
| 数据库表名 | snake_case | `reservation_rules` |
| 数据库列名 | snake_case | `slot_start_time` |
| API 路由 | kebab-case | `/reservations/slots` |

### 5.3 API 路径规范

```
/api/{resource}[/{id}][/{action}]

示例：
GET    /api/reservations          # 列表
POST   /api/reservations          # 创建
GET    /api/reservations/:id      # 详情
POST   /api/reservations/:id/confirm  # 自定义动作
```

### 5.4 Git 分支规范（开发阶段）

| 分支 | 用途 |
|------|------|
| `main` | 稳定版本 |
| `develop` | 开发主线 |
| `feature/*` | 功能分支，如 `feature/reservation-api` |
| `fix/*` | 修复分支 |

---

## 6. 文档修订记录

| 版本 | 日期 | 修改内容 | 修改人 |
|------|------|----------|--------|
| v1.0 | 2026-05-11 | 初稿创建 | architect |

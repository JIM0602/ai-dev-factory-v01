# 小程序端开发总结

## 文档信息

| 项目 | 内容 |
|------|------|
| 文档版本 | v1.0 |
| 创建日期 | 2026-05-11 |
| 负责 Agent | miniapp-dev |
| 任务范围 | MP-01 至 MP-16 |

---

## 1. 完成了哪些页面

### 用户端页面（5 个）

| 页面 | 路径 | 功能状态 |
|------|------|:---:|
| P01 - 门店主页 | `pages/customer/store/index.vue` | 已完成 |
| P02 - 发起预约 | `pages/customer/reservation/create.vue` | 已完成 |
| P03 - 预约结果 | `pages/customer/reservation/result.vue` | 已完成 |
| P04 - 我的预约列表 | `pages/customer/reservation/my-list.vue` | 已完成 |
| P05 - 预约详情 | `pages/customer/reservation/detail.vue` | 已完成 |

### 商家端页面（8 个）

| 页面 | 路径 | 功能状态 |
|------|------|:---:|
| B01 - 工作台 | `pages/merchant/dashboard/index.vue` | 已完成 |
| B02 - 预约列表 | `pages/merchant/reservation/list.vue` | 已完成 |
| B03 - 预约详情 | `pages/merchant/reservation/detail.vue` | 已完成 |
| B04 - 添加预约 | `pages/merchant/reservation/add.vue` | 已完成 |
| B05 - 计时看板 | `pages/merchant/timer/dashboard.vue` | 已完成 |
| B06 - 到店登记 | `pages/merchant/timer/checkin.vue` | 已完成 |
| B07 - 会员查询 | `pages/merchant/member/search.vue` | 已完成 |
| B08 - 会员详情 | `pages/merchant/member/detail.vue` | 已完成 |

### 额外页面（1 个）

| 页面 | 路径 | 功能状态 |
|------|------|:---:|
| 计时详情 | `pages/merchant/timer/detail.vue` | 已完成 |

---

## 2. 完成了哪些组件

### 通用组件（5 个）

| 组件 | 文件 | 用途 |
|------|------|------|
| AppNavbar | `components/common/AppNavbar.vue` | 自定义导航栏（标题、返回按钮） |
| EmptyState | `components/common/EmptyState.vue` | 空态占位（图标 + 引导文案 + 操作按钮） |
| LoadingSkeleton | `components/common/LoadingSkeleton.vue` | 骨架屏加载态（card/list/detail 三种模式，shimmer 动画） |
| ConfirmDialog | `components/common/ConfirmDialog.vue` | 二次确认弹窗（支持 primary/danger 类型） |
| PageContainer | `components/common/PageContainer.vue` | 页面容器（集成加载态、错误态、重试） |

### 顾客端专用组件（5 个）

| 组件 | 文件 | 用途 |
|------|------|------|
| StoreBanner | `components/customer/StoreBanner.vue` | 门店照片轮播（swiper + 指示器） |
| StoreHeader | `components/customer/StoreHeader.vue` | 门店头部信息卡片（名称、地址、营业状态） |
| DateSelector | `components/customer/DateSelector.vue` | 日期选择器（横向滚动、非营业日灰显） |
| SlotPicker | `components/customer/SlotPicker.vue` | 时段选择器（2列网格、容量进度条、满员置灰） |
| ReservationCard | `components/customer/ReservationCard.vue` | 预约卡片（4rpx 彩色顶条、状态标签、操作按钮） |
| StatusBadge | `components/customer/StatusBadge.vue` | 状态标签（6 种预约状态，颜色+形状双编码） |

### 商家端专用组件（3 个）

| 组件 | 文件 | 用途 |
|------|------|------|
| TimerCard | `components/merchant/TimerCard.vue` | 计时卡片（倒计时、进度条、正常/预警/紧急三态） |
| TimeExtensionPicker | `components/merchant/TimeExtensionPicker.vue` | 加时选择器（底部弹出 +30min/+1h/+2h/自定义） |
| CouponInput | `components/merchant/CouponInput.vue` | 团购券录入（可折叠、多张券录入和删除） |

### 自定义 TabBar（1 个）

| 组件 | 文件 | 用途 |
|------|------|------|
| CustomTabBar | `custom-tab-bar/index.vue` | 自定义底部导航栏（顾客端2tab / 商家端4tab 动态切换） |

---

## 3. 调用了哪些接口

### API 层文件

| 模块 | 文件 | 端点数量 |
|------|------|:---:|
| request 封装 | `api/request.ts` | —（Token 注入、过期刷新、统一错误） |
| Auth | `api/auth.ts` | 2（微信登录、刷新Token） |
| Store | `api/store.ts` | 2（门店公开信息、完整配置） |
| Reservation | `api/reservation.ts` | 9（时段查询、提交预约、我的列表、详情、取消、商家列表、代约、确认、拒绝） |
| Timer | `api/timer.ts` | 4（到店登记、加时、结束计时、看板） |
| Member | `api/member.ts` | 2（搜索会员、会员详情） |
| Coupon | `api/coupon.ts` | 1（核销记录查询） |

### Pinia Store

| Store | 文件 | 管理状态 |
|------|------|----------|
| user | `store/user.ts` | token、role、nickname、登录/登出/角色切换/会话恢复 |
| storeInfo | `store/store.ts` | 门店信息缓存 |
| reservation | `store/reservation.ts` | 预约列表、详情、时段、提交/取消预约 |
| timer | `store/timer.ts` | 计时看板数据、加时/结束计时、10秒轮询 |

---

## 4. 还有哪些未完成

1. **npm install**: 需要运行 `npm install` 安装依赖（package.json 已配置完整依赖）。
2. **微信开发者工具运行**: 需要在微信开发者工具中打开项目 `workspace/miniapp/` 编译运行。
3. **真机测试**: 未在真机上测试交互、触控反馈、下拉刷新等。
4. **TabBar 页面选中态同步**: custom-tab-bar 的 `selected` 状态需要通过页面生命周期的 `onShow` 来同步当前选中项，当前实现为基础版，需要各 tab 页面在 onShow 中调用 `getTabBar().setData({ selected: N })`。
5. **API 基础 URL**: `api/request.ts` 中 `BASE_URL` 硬编码为 `http://localhost:3000/api`，生产环境需通过环境变量或配置切换。
6. **微信小程序 appid**: `manifest.json` 中 appid 为空，需要填写真实的微信小程序 AppID。
7. **地图坐标**: 门店主页和预约详情中的地图导航使用了默认广州坐标，实际应从门店配置中获取经纬度字段。API 当前未返回经纬度字段。
8. **轮询优化**: 计时看板使用 setInterval 10秒轮询，可使用 `onHide` 停止、`onShow` 恢复以节省资源。

---

## 5. 需要后端配合的问题

以下问题已识别，可能需要后端配合调整：

### 5.1 API 接口字段补充

| 问题 | 相关接口 | 建议 |
|------|----------|------|
| 门店缺少经纬度 | `GET /api/store/info` | 需要增加 `latitude`, `longitude` 字段用于地图导航 |
| 计时详情无独立接口 | — | 建议增加 `GET /api/timer/:sessionId` 返回完整计时详情（含扩展记录列表、券列表） |
| 工作台缺少 summary 集成接口 | — | 建议增加 `GET /api/merchant/dashboard` 一次性返回今日概览+待处理预约+计时状态 |
| 会员详情接口 `records` 嵌套分页格式 | `GET /api/members/:id` | 当前 API 设计中 records 内嵌分页，实际返回时建议扁平化或明确嵌套结构 |

### 5.2 功能逻辑确认

| 问题 | 说明 |
|------|------|
| 到店登记日期限制 | 当前 API 限制仅当日已确认预约可到店登记，页面代码已按此逻辑实现 |
| 顾客端取消规则 | 页面通过 `can_cancel` 字段判断是否显示取消按钮，具体取消截止时间由后端规则控制 |
| 手机号脱敏 | 商家端列表页使用脱敏 `customer_phone`，详情页使用 `customer_phone_full`，顾客端使用脱敏格式 |
| 自动确认 vs 需确认 | 预约结果页根据 `status` 字段（`confirmed` vs `pending`）展示不同文案 |

---

## 6. 自测结果

### 通过项

- [x] 项目文件结构完整，共 53 个文件
- [x] pages.json 配置 14 个页面路由 + 自定义 TabBar
- [x] 全局 CSS 变量覆盖 final_design_rules.md 所有 Design Tokens
- [x] 所有颜色使用 CSS 变量，无硬编码 HEX 值（SCSS 变量文件除外）
- [x] 状态标签使用颜色+形状双编码（6 种预约状态：◇●⊘○◉■）
- [x] 计时卡片实现正常/预警/紧急三态（剩余≤15分钟橙色，≤5分钟红色+脉冲动画）
- [x] 按钮胶囊形圆角 44rpx，高度 96rpx（主按钮）
- [x] 卡片 4rpx 彩色状态顶条
- [x] 所有可点击元素触控区域 ≥ 44rpx
- [x] 弹窗从底部滑入动画（300ms ease-out）
- [x] 骨架屏 shimmer 动画
- [x] 空态有引导文案 + 操作按钮
- [x] 网络错误提示条 + 重试按钮
- [x] 表单校验（手机号 11 位、姓名非空、人数 1-10、备注 100 字限制）
- [x] API 请求封装（Token 注入、过期刷新、统一错误处理）
- [x] Pinia 状态管理（4 个 Store）
- [x] TypeScript 类型定义完整
- [x] 计时紧急动画 2.5s 周期（breathe-color + pulse-critical）

### 待验证项（需要运行环境）

- [ ] uni-app 项目编译是否通过（`npm run dev:mp-weixin`）
- [ ] 微信开发者工具中页面渲染是否正常
- [ ] 页面间跳转是否正常
- [ ] TabBar 切换是否正常
- [ ] 表单提交 API 对接是否正常
- [ ] 下拉刷新是否正常
- [ ] 倒计时实时更新是否流畅
- [ ] 小程序包体积是否 < 2MB
- [ ] 低端机动画性能

### 设计规则合规自检

| 规则大类 | 关键项 | 状态 |
|----------|--------|:---:|
| 颜色 | 所有颜色使用 CSS 变量 | 通过 |
| 颜色 | 主文字 #3D2C2E 与背景对比度 ≥ 4.5:1 | 通过 |
| 状态 | 状态标签双编码（颜色+形状） | 通过 |
| 触控 | 所有可点击元素 ≥ 44rpx | 通过 |
| 按钮 | 胶囊形圆角 = 高度/2 | 通过 |
| 按钮 | 禁用态颜色 #E8C4B8 | 通过 |
| 卡片 | 4rpx 彩色状态顶条 | 通过 |
| 布局 | 页面左右留白 36rpx | 通过 |
| 计时 | 倒计时数字 60rpx Bold | 通过 |
| 计时 | 紧急动画 2.5s 周期 | 通过 |
| 弹窗 | 底部滑入 300ms | 通过 |
| 空态 | 引导文案 + 操作按钮 | 通过 |
| 图标 | 使用 Unicode/emoji 内联 | 通过 |
| 禁止 | 无纯黑 #000000 | 通过 |
| 禁止 | 无外部动效库 | 通过 |
| 禁止 | 无图片空态插画 | 通过 |
| 禁止 | 弹窗按钮不超过 2 个 | 通过 |
| 禁止 | 无横向滚动表格 | 通过 |
| 禁止 | 按钮文案不超过 8 字 | 通过 |

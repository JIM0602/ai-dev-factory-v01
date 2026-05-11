# 商家 Web 后台开发总结

## 1. 完成了哪些页面

| 任务编号 | 页面 | 文件路径 | 状态 |
|----------|------|----------|------|
| WEB-01 | 项目脚手架 + 布局框架 + 路由 | 完整的 Vue 3 + Vite + TypeScript 项目 | 完成 |
| WEB-02 | W01 登录页 | `src/pages/login/LoginPage.vue` | 完成 |
| WEB-03 | W02 工作台 | `src/pages/dashboard/DashboardPage.vue` | 完成 |
| WEB-04 | W03 预约管理（核心页面） | `src/pages/reservations/ReservationPage.vue` | 完成 |
| WEB-04 | W03 预约详情 | `src/pages/reservations/ReservationDetailDrawer.vue` | 完成 |
| WEB-05 | 添加预约 | `src/pages/reservations/AddReservationDialog.vue` | 完成 |
| WEB-06 | W04 门店设置 | `src/pages/store/StoreSettingsPage.vue` | 完成 |
| WEB-07 | W05 预约规则设置 | `src/pages/store/ReservationRulesPage.vue` | 完成 |
| WEB-08 | W06 容量设置 | `src/pages/store/CapacityPage.vue` | 完成 |
| WEB-09 | W07 会员管理 | `src/pages/members/MemberPage.vue` | 完成 |
| WEB-09 | W07 会员详情 | `src/pages/members/MemberDetailDialog.vue` | 完成 |
| WEB-10 | W08 团购券记录 | `src/pages/coupons/CouponPage.vue` | 完成 |

## 2. 完成了哪些组件

### 布局组件（3 个）
| 组件 | 文件 |
|------|------|
| AppLayout | `src/components/layout/AppLayout.vue` |
| SideMenu | `src/components/layout/SideMenu.vue` |
| TopHeader | `src/components/layout/TopHeader.vue` |

### 通用组件（6 个）
| 组件 | 文件 |
|------|------|
| DataTable | `src/components/common/DataTable.vue` |
| StatusTag | `src/components/common/StatusTag.vue` |
| SearchFilter | `src/components/common/SearchFilter.vue` |
| StatCard | `src/components/common/StatCard.vue` |
| ConfirmDialog | `src/components/common/ConfirmDialog.vue` |
| EmptyState | `src/components/common/EmptyState.vue` |
| LoadingSkeleton | `src/components/common/LoadingSkeleton.vue` |

### 表单组件（2 个）
| 组件 | 文件 |
|------|------|
| ImageUploader | `src/components/forms/ImageUploader.vue` |
| DaySelector | `src/components/forms/DaySelector.vue` |

### API 层（7 个模块）
| 模块 | 文件 |
|------|------|
| Request 封装 (axios 实例) | `src/api/request.ts` |
| Auth API | `src/api/auth.ts` |
| Store API | `src/api/store.ts` |
| Reservation API | `src/api/reservation.ts` |
| Rules API | `src/api/rules.ts` |
| Member API | `src/api/member.ts` |
| Coupon API | `src/api/coupon.ts` |

### 状态管理（2 个 Store）
| Store | 文件 |
|------|------|
| Auth Store | `src/store/auth.ts` |
| Store Config Store | `src/store/store.ts` |

### 工具模块
| 模块 | 文件 |
|------|------|
| 常量（状态枚举、选项列表） | `src/utils/constants.ts` |
| 格式化工具（日期、手机号脱敏） | `src/utils/format.ts` |

### 样式系统
| 文件 | 说明 |
|------|------|
| `src/styles/variables.css` | Design Tokens CSS 变量 |
| `src/styles/global.css` | 全局样式 + Element Plus 主题覆盖 |

## 3. 调用了哪些接口

| 接口 | 方法 | 调用位置 |
|------|------|----------|
| POST /api/auth/admin-login | 登录 | LoginPage.vue |
| GET /api/store/config | 获取门店配置 | StoreSettingsPage.vue, TopHeader.vue, DashboardPage.vue |
| PUT /api/store/config | 更新门店配置 | StoreSettingsPage.vue |
| POST /api/upload/image | 上传图片 | ImageUploader.vue |
| GET /api/reservations/slots | 获取时段容量 | AddReservationDialog.vue, CapacityPage.vue |
| GET /api/reservations/merchant | 商家预约列表 | ReservationPage.vue, DashboardPage.vue |
| POST /api/reservations/merchant | 商家代约 | AddReservationDialog.vue |
| GET /api/reservations/:id | 预约详情 | ReservationDetailDrawer.vue |
| POST /api/reservations/:id/confirm | 确认预约 | ReservationPage.vue, ReservationDetailDrawer.vue |
| POST /api/reservations/:id/reject | 拒绝预约 | ReservationPage.vue, ReservationDetailDrawer.vue |
| GET /api/rules | 获取预约规则 | ReservationRulesPage.vue |
| PUT /api/rules | 更新预约规则 | ReservationRulesPage.vue |
| GET /api/members | 搜索会员 | MemberPage.vue |
| GET /api/members/:id | 会员详情 | MemberDetailDialog.vue |
| GET /api/coupons | 团购券记录 | CouponPage.vue |

## 4. 还有哪些未完成

| 项目 | 说明 | 优先级 |
|------|------|--------|
| WEB-12 Docker 构建 | `admin-web.Dockerfile` 和 Nginx 静态资源配置 | P1 |
| 图片上传预览与排序 | ImageUploader 组件的拖拽排序功能已实现，但依赖后端上传接口 | P0 |
| 批量操作（批量确认） | 当前仅支持逐条确认/拒绝，批量确认可在 DataTable 上扩展多选 | P2 |
| 微信扫码登录 | V1 仅做账密登录，扫码登录留待 V2 | V2 |
| 移动端适配 | Web 后台不作为移动端主要使用场景，已在路由守卫中做了基础跳转 | V2 |
| 数据导出功能 | 预约列表/团购券导出留待 V2 | V2 |
| 计时看板 | 计时看板页面属于商家端小程序功能（B05），不在 Web 后台范围 | 不在范围 |

## 5. 需要后端配合的问题

### 5.1 接口字段确认
| 问题 | 说明 |
|------|------|
| `GET /api/reservations/merchant` 的 `date` 参数 | 当前 API 设计中 `date` 为单日期参数。后台筛选栏使用了日期范围选择器，但 V1 发送到 API 时仅传 `dateRange[0]`。如果后端不支持日期范围筛选，建议在 V2 增加 `start_date` / `end_date` 参数 |
| 预约详情返回 `customer_phone_full` | API 设计中详情返回完整手机号，前端已为此准备了 `ReservationDetail` 扩展类型 |
| 门店设置 `PUT /api/store/config` 的 `photos` 字段 | 当前 ImageUploader 组件先上传照片获取 URL，再将 URL 数组提交到 config。如果后端支持在 config 请求中直接接收文件上传，可简化流程 |

### 5.2 接口不存在时的降级方案
| 场景 | 降级方案 |
|------|----------|
| 后端未启动时 | axios 拦截器统一捕获错误并显示 Toast 提示 |
| 图片上传接口不可用时 | ImageUploader 显示错误信息，阻止继续操作 |
| 门店配置未配置时 | 各页面使用默认值显示，不报错 |

## 6. 自测结果

### 6.1 构建验证
- TypeScript 类型检查：通过（`vue-tsc --noEmit` 零错误）
- Vite 生产构建：通过（`vite build` 成功生成 dist/）
- 构建时间：约 1.67s
- 输出文件大小合理（按路由代码分割）

### 6.2 功能验证清单
| 功能 | 状态 |
|------|------|
| 项目创建与依赖安装 | 通过 |
| 路由配置与守卫 | 通过 |
| 登录页（账密表单、错误提示、记住状态） | 通过 |
| 工作台（统计卡片、最近预约列表、快捷入口） | 通过 |
| 预约管理（筛选、分页、确认/拒绝操作） | 通过 |
| 添加预约弹窗（日期/时段选择、容量提示、表单验证） | 通过 |
| 预约详情抽屉（顾客信息、预约信息、操作时间线） | 通过 |
| 门店设置（基本信息、照片上传、营业时间、休息日） | 通过 |
| 预约规则（确认开关、高级设置、时段时长） | 通过 |
| 容量设置（日期选择、时段容量表格） | 通过 |
| 会员管理（搜索、列表、详情弹窗含消费记录） | 通过 |
| 团购券记录（日期范围筛选、来源筛选、分页） | 通过 |
| 状态标签（6 种状态双编码：颜色+形状） | 通过 |
| Design Tokens（全部使用 CSS 变量，无硬编码） | 通过 |
| Element Plus 主题覆盖 | 通过 |
| 侧边栏（220px 可折叠、当前激活高亮） | 通过 |
| 表格规范（表头 sticky、行高 48px、hover 变色） | 通过 |
| 加载态（骨架屏 shimmer 动画） | 通过 |
| 空态（SVG 图标 + 引导文案 + 操作按钮） | 通过 |
| 错误态（表格内重试按钮） | 通过 |
| 确认弹窗（二次确认、loading 状态） | 通过 |
| 手机号脱敏显示 | 通过 |

### 6.3 设计规则符合性
| 规则 | 符合 |
|------|------|
| Web 主色 `#C5704F`（比小程序冷 5-10%） | 是 |
| Web 背景 `#F8F7F5` | 是 |
| 侧边栏 220px 宽、`#3D3530` 背景 | 是 |
| 表格行高 48px、表头 sticky | 是 |
| 操作列固定在表格右侧 | 是 |
| 表单标签左对齐 | 是 |
| 卡片白底 + `1px solid #E8E3DA` 边框、无阴影 | 是 |
| 状态标签双编码（颜色+形状） | 是 |
| 所有颜色使用 CSS 变量、无硬编码 | 是 |
| 无 `!important` 滥用 | 是 |

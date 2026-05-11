# 成功运行记录：拼豆店预约计时小程序

## 记录信息

| 项目 | 内容 |
|------|------|
| 运行日期 | 2026-05-11 |
| 项目名称 | 拼豆店预约计时小程序 |
| 一句话描述 | 面向拼豆店个体商家的双端微信小程序工具，核心解决门店容量管理、预约管理、到店计时和会员记录沉淀问题。 |
| 运行结果 | 成功（后端全额通过，前端有条件可交付） |
| 全流程阶段 | 需求分析 → 产品 → 架构 → UI Contest → 开发计划 → 开发实现 → Review → 测试 → 交付 |

---

## 关键指标

| 指标 | 数值 |
|------|:---:|
| 总开发角色 | 6 个（database-dev、backend-dev、miniapp-dev、merchant-web-dev、qa-tester、code-reviewer） |
| 总任务数 | 56 个 |
| 数据库表 | 10 张 |
| API 端点 | 27 个 |
| NestJS 模块 | 7 个 |
| 小程序页面 | 13 个（用户端 5 + 商家端 8） |
| Web 后台页面 | 8 个 |
| 后端源文件 | 76 个 .ts |
| 小程序源文件 | 50 个 .vue/.ts/.scss |
| Web 源文件 | 37 个 .vue/.ts/.scss |
| 后端单元测试 | 65 条，100% 通过 |
| 功能流程测试 | 14 条，100% 通过 |
| 代码审查 P0 阻塞 | 2 个，全部修复 |
| Artifacts 文档 | 15 个 |

---

## 技术栈

- **微信小程序端**: uni-app + Vue 3 + TypeScript
- **商家 Web 后台**: Vue 3 + Vite + TypeScript + Element Plus
- **后端**: NestJS + TypeScript + TypeORM
- **数据库**: PostgreSQL 15
- **部署**: Docker Compose (Nginx + NestJS + PostgreSQL)

---

## 核心亮点

### 1. UI Contest 融合机制
4 个 UI 方案竞标，最终以"温暖手作 Warm Handcraft"为主体，融合其他方案的优点（V03 的效率设计、V04 的暖棕阴影、V02 的按钮交互），产出一套完整的 Design Tokens + 组件规范 + 前端开发检查清单（12 章节）。这是流程中最成功的环节之一。

### 2. 防超卖的悲观锁实现
容量校验使用 PostgreSQL `SELECT ... FOR UPDATE` 行级锁，在事务中完成，简单可靠。无需引入 Redis 或分布式锁。

### 3. JWT 双端认证
同一个 NestJS 后端支持两种认证方式：微信小程序 OpenID 换 JWT（7 天有效）+ Web 后台账密登录换 JWT（24 小时有效）。通过 JWT payload 中的 role 字段 + RolesGuard 实现统一的权限控制。

### 4. Review-测试-修复闭环
Review 发现 2 个 P0 阻塞问题（计时看板倒计时计算错误、新会员首次消费数据丢失），测试阶段验证修复，新增 2 条单元测试防止回归。形成"发现→修复→验证→防回归"的完整闭环。

### 5. 完整的 Design Tokens 体系
`final_design_rules.md` 定义了颜色、字体、间距、圆角、阴影的完整 Token，所有 Token 使用相同的命名在三端共享，仅单位不同（rpx vs px）。这是同类项目的可复用资产。

---

## 关键文件路径

| 文件 | 路径 |
|------|------|
| 原始需求 | brief.md |
| 需求分析 | artifacts/01_requirements/requirement_analysis.md |
| PRD | artifacts/02_product/prd.md |
| 页面清单 | artifacts/02_product/page_list.md |
| 验收标准 | artifacts/02_product/acceptance_criteria.md |
| 系统架构设计 | artifacts/03_architecture/system_design.md |
| 数据库设计 | artifacts/03_architecture/database_design.md |
| API 设计 | artifacts/03_architecture/api_design.md |
| UI 方案选定 | artifacts/04_ui_contest/selected_ui_direction.md |
| 最终设计规则 | artifacts/04_ui_contest/final_design_rules.md |
| 开发任务清单 | artifacts/05_plan/task_list.md |
| 代码审查报告 | artifacts/07_review/code_review_report.md |
| 测试报告 | artifacts/08_test/test_report.md |
| 修复清单 | artifacts/08_test/fix_list.md |
| 交付报告 | artifacts/09_delivery/delivery_report.md |
| 部署指南 | artifacts/09_delivery/deploy_guide.md |
| 经验总结 | artifacts/10_learning/lessons_learned.md |
| 后端代码 | workspace/server/ |
| 小程序代码 | workspace/miniapp/ |
| Web 后台代码 | workspace/admin-web/ |

---

## 遗留问题（V1.1 优先处理）

| 优先级 | 问题 |
|:---:|------|
| P1 | 前端缺少组件/页面单元测试 |
| P1 | 缺少真实数据库的 E2E/集成测试 |
| P1 | 登录接口缺少限流保护 |
| P2 | Admin-web Element Plus 主题色偏差 |
| P2 | 小程序 API BASE_URL 硬编码 |
| P2 | checkIn 日期校验时区边界问题 |

---

## 适用于下次类似项目的模式

1. **UI Contest 融合模式**：多方案竞标 + 主方案为主体 + 吸收其他方案优点
2. **多端共享 Design Tokens**：相同 Token 命名，不同端不同单位
3. **悲观锁防超卖**：`SELECT ... FOR UPDATE` 在事务中
4. **JWT 双认证**：同后端、不同登录方式、不同有效期
5. **定时任务自动取消**：`@Cron` + 批量事务更新
6. **状态标签双编码**：颜色 + 形状，保障无障碍
7. **阶段门控 + 输出文件可检查**：每个阶段必须有可检查的输出文件

---

## 文档修订记录

| 版本 | 日期 | 修改内容 | 修改人 |
|------|------|----------|--------|
| v1.0 | 2026-05-11 | 初稿创建 | delivery-agent |

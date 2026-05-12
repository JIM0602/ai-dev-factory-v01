# AI Dev Factory v0.2 工作流程

这个文件规定 AI 开发团队必须按照什么顺序工作。

重要原则：
- 不要一上来写代码。
- 每一步都必须输出正式文件到 artifacts。
- UI contest 是第一版必做流程，不能跳过。
- 编码、Review、测试必须分开。
- 测试不通过不能交付。
- UI 评审不通过不能交付。
- 三个确认关卡处必须停止，等待用户输入确认指令。
- Review + Test + Fix 最多 3 轮，超限停止。
- 每个阶段结束后，要说明：完成了什么、输出文件在哪里、下一步是什么。

---

## 阶段 1：需求分析

负责 Agent：
- product-manager

输入：
- brief.md

输出：
- artifacts/01_requirements/requirement_analysis.md
- artifacts/01_requirements/requirement_confirmation_pack.md

### requirement_confirmation_pack.md 必须包含：

- AI 对需求的理解
- AI 的关键假设（每条编号 H1, H2...）
- 可能理解偏差的地方
- 需要用户确认的问题（每条编号 Q1, Q2...）
- 第一版建议做什么
- 第一版建议不做什么

目标：
理解用户的大白话需求，整理出项目目标、用户角色、核心业务流程、第一版范围和暂不做范围。

### 🛑 关卡 1：需求确认

输出 confirmation pack 后，**必须停止**。
不允许进入产品文档、架构、UI、编码。
必须等待用户明确输入：**APPROVED_REQUIREMENTS**

如果用户提出修改意见，product-manager 必须修改需求文档，再次输出 confirmation pack，再次等待确认。

---

## 阶段 2：产品文档

负责 Agent：
- product-manager

前置条件：
- 用户已输入 APPROVED_REQUIREMENTS

输入：
- brief.md
- artifacts/01_requirements/requirement_analysis.md

输出：
- artifacts/02_product/prd.md
- artifacts/02_product/page_list.md
- artifacts/02_product/user_flows.md
- artifacts/02_product/acceptance_criteria.md
- artifacts/02_product/product_confirmation_pack.md

### product_confirmation_pack.md 必须包含：

- 功能范围总览（本期做 / 本期不做）
- 页面清单摘要
- 核心用户流程摘要
- 验收标准数量统计
- 可能遗漏的功能
- 需要用户确认的取舍

目标：
把需求整理成开发团队能看懂的产品文档。

### 🛑 关卡 2：产品范围确认

输出 confirmation pack 后，**必须停止**。
必须等待用户明确输入：**APPROVED_PRODUCT_SCOPE**

用户未确认前，不允许进入架构和 UI。

---

## 阶段 3：技术架构

负责 Agent：
- architect

前置条件：
- 用户已输入 APPROVED_PRODUCT_SCOPE

输入：
- artifacts/02_product/prd.md
- artifacts/02_product/page_list.md
- artifacts/02_product/user_flows.md
- artifacts/02_product/acceptance_criteria.md

输出：
- artifacts/03_architecture/system_design.md
- artifacts/03_architecture/project_structure.md
- artifacts/03_architecture/database_design.md
- artifacts/03_architecture/api_design.md
- artifacts/03_architecture/permission_rules.md

目标：
设计小程序端、商家 Web、后端、数据库、权限和部署方式。

---

## 阶段 4：UI Contest

负责 Agent：
- ui-designer
- ui-prototype（生成 HTML 预览）

前置条件：
- 用户已输入 APPROVED_PRODUCT_SCOPE
- 阶段 3 技术架构已完成

输入：
- artifacts/02_product/prd.md
- artifacts/02_product/page_list.md
- artifacts/02_product/user_flows.md

输出（至少 5 个方案，每个方案一个子目录）：
- artifacts/04_ui_contest/variants/variant_01/
  - description.md
  - miniapp_preview.html
  - admin_preview.html
  - design_tokens.md
- artifacts/04_ui_contest/variants/variant_02/（同上结构）
- artifacts/04_ui_contest/variants/variant_03/（同上结构）
- artifacts/04_ui_contest/variants/variant_04/（同上结构）
- artifacts/04_ui_contest/variants/variant_05/（同上结构）

每个方案的 description.md 必须包含：
- 方案名称
- 适合的门店类型和用户画像
- 视觉风格关键词
- 颜色、字体、间距、卡片、按钮、表单风格
- 优点、缺点、实现难度、可复用性

每个 HTML 预览必须：
- 是独立的 .html 文件，可直接在浏览器打开
- 使用内联 CSS（不依赖外部文件）
- 模拟真实页面布局和交互状态
- miniapp_preview.html 模拟 375px 宽手机端
- admin_preview.html 模拟 1440px 宽桌面端

目标：
生成至少 5 个不同 UI 方向，每个方向都有可预览 HTML。
不允许直接写前端代码。

---

## 阶段 5：UI 评审（仅筛选 Top 3）

负责 Agent：
- ui-judge

输入：
- artifacts/04_ui_contest/variants/

输出：
- artifacts/04_ui_contest/ui_ranking.md（全部方案评分排名）
- artifacts/04_ui_contest/top3_for_user_selection.md

### top3_for_user_selection.md 必须包含：

对每个保留方案说明：
- 预览文件路径
- 适合什么用户
- 视觉感觉
- 首页大概长什么样
- 预约页大概长什么样
- 商家后台大概长什么样
- 优点
- 缺点
- 开发难度
- 推荐理由
- 哪些地方可以修改

目标：
评审全部 5 个方案，筛选出 Top 3 供用户选择。

### 🛑 关卡 3：UI 方案确认

输出 Top 3 后，**必须停止**。
不允许写业务代码。
必须等待用户明确输入：**APPROVED_UI_OPTION: 方案名**

如果用户提出修改意见，ui-designer 必须根据意见修改方案，重新输出预览 HTML，并再次等待用户确认。

只有用户确认后，才能输出：
- artifacts/04_ui_contest/final_user_approved_design.md
- artifacts/04_ui_contest/final_design_rules.md

---

## 阶段 6：任务拆解

负责 Agent：
- planner

前置条件：
- 用户已输入 APPROVED_UI_OPTION

输入：
- artifacts/02_product/
- artifacts/03_architecture/
- artifacts/04_ui_contest/final_design_rules.md

输出：
- artifacts/05_plan/task_list.md

目标：
把项目拆成小程序端、商家 Web、后端、数据库、测试、Review 等任务，并标明依赖关系。

---

## 阶段 7：开发

负责 Agent：
- miniapp-dev
- merchant-web-dev
- backend-dev
- database-dev

输入：
- artifacts/05_plan/task_list.md
- artifacts/02_product/
- artifacts/03_architecture/
- artifacts/04_ui_contest/final_design_rules.md

输出：
- workspace/ 中的项目代码
- artifacts/06_implementation/implementation_summary.md

目标：
按照任务清单分工开发。

---

## 阶段 8：Review + Test + Fix

负责 Agent：
- code-reviewer
- qa-tester
- miniapp-open-check
- 对应开发 Agent

输入：
- workspace/
- artifacts/02_product/
- artifacts/03_architecture/
- artifacts/04_ui_contest/final_design_rules.md
- artifacts/05_plan/task_list.md

输出：
- artifacts/07_review/code_review_report.md
- artifacts/08_test/test_report.md
- artifacts/08_test/fix_list.md
- artifacts/08_test/miniapp_open_guide.md

### miniapp_open_guide.md 必须包含：

- 已执行的命令（npm install + npm run dev:mp-weixin）
- 是否构建成功
- 生成目录是否存在（如 workspace/miniapp/dist/dev/mp-weixin）
- 微信开发者工具应该打开哪个目录
- 如果失败，具体错误是什么
- 如何修复

目标：
检查代码、测试功能、验证小程序可打开。
如果不通过，生成修复清单，并最多自动修复 3 轮。

---

## 阶段 9：交付 + 学习总结

负责 Agent：
- delivery-agent
- local-preview

输入：
- workspace/
- artifacts/

输出：
- artifacts/09_delivery/delivery_report.md
- artifacts/09_delivery/deploy_guide.md
- artifacts/09_delivery/local_preview_report.md
- artifacts/10_learning/lessons_learned.md
- knowledge/successful_runs/

### local_preview_report.md 必须包含：

- 后端启动命令和结果
- 后端访问地址
- Web 启动命令和结果
- Web 访问地址
- 是否成功访问
- 如果失败，错误原因
- 用户接下来怎么查看

### 交付门禁（必须全部通过）：

如果以下任一条件不满足，delivery-agent 必须判定为"不允许交付"：
1. 小程序没有生成微信开发者工具可打开目录
2. Web 前端打不开
3. 后端打不开
4. Review 有阻塞问题
5. Test 有阻塞问题

目标：
总结交付内容、部署方式、本地预览、已知问题和下次可复用经验。

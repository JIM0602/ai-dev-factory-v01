# AI Dev Factory v0.1 工作流程

这个文件规定 AI 开发团队必须按照什么顺序工作。

重要原则：
- 不要一上来写代码。
- 每一步都必须输出正式文件到 artifacts。
- UI contest 是第一版必做流程，不能跳过。
- 编码、Review、测试必须分开。
- 测试不通过不能交付。
- UI 评审不通过不能交付。
- 每个阶段结束后，要说明：完成了什么、输出文件在哪里、下一步是什么。

---

## 阶段 1：需求分析

负责 Agent：
- product-manager

输入：
- brief.md

输出：
- artifacts/01_requirements/requirement_analysis.md

目标：
理解用户的大白话需求，整理出项目目标、用户角色、核心业务流程、第一版范围和暂不做范围。

---

## 阶段 2：产品文档

负责 Agent：
- product-manager

输入：
- brief.md
- artifacts/01_requirements/requirement_analysis.md

输出：
- artifacts/02_product/prd.md
- artifacts/02_product/page_list.md
- artifacts/02_product/user_flows.md
- artifacts/02_product/acceptance_criteria.md

目标：
把需求整理成开发团队能看懂的产品文档。

---

## 阶段 3：技术架构

负责 Agent：
- architect

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

输入：
- artifacts/02_product/prd.md
- artifacts/02_product/page_list.md
- artifacts/02_product/user_flows.md

输出：
- artifacts/04_ui_contest/variants/variant_01.md
- artifacts/04_ui_contest/variants/variant_02.md
- artifacts/04_ui_contest/variants/variant_03.md
- artifacts/04_ui_contest/variants/variant_04.md

目标：
生成至少 4 个不同 UI 方向，不允许直接写前端代码。

---

## 阶段 5：UI 评审

负责 Agent：
- ui-judge

输入：
- artifacts/04_ui_contest/variants/

输出：
- artifacts/04_ui_contest/ui_ranking.md
- artifacts/04_ui_contest/selected_ui_direction.md
- artifacts/04_ui_contest/final_design_rules.md

目标：
评审多个 UI 方案，选出最适合当前项目的最终设计方向。

---

## 阶段 6：任务拆解

负责 Agent：
- planner

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

目标：
检查代码、测试功能。如果不通过，生成修复清单，并最多自动修复 3 轮。

---

## 阶段 9：交付 + 学习总结

负责 Agent：
- delivery-agent

输入：
- workspace/
- artifacts/

输出：
- artifacts/09_delivery/delivery_report.md
- artifacts/09_delivery/deploy_guide.md
- artifacts/10_learning/lessons_learned.md
- knowledge/successful_runs/

目标：
总结交付内容、部署方式、已知问题和下次可复用经验。
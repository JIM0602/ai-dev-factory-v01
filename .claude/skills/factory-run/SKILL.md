---
name: factory-run
description: 从 brief.md 开始，按 AI Dev Factory v0.2 流程完成需求分析、产品文档、架构、UI contest、任务拆解、开发、Review、测试、修复和交付。包含 3 个人工确认关卡。
---

# factory-run

你现在要执行 AI Dev Factory v0.2 的完整开发流程。

必须先读取：
- CLAUDE.md
- workflow.md
- brief.md

严格按照 workflow.md 的 9 个阶段执行：

1. 需求分析
2. 产品文档
3. 技术架构
4. UI Contest（≥5 方案 + HTML 预览）
5. UI 评审（仅筛选 Top 3）
6. 任务拆解
7. 开发
8. Review + Test + Fix
9. 交付 + 学习总结

## 🛑 三个必须停止的关卡

### 关卡 1（阶段 1 结束后）
输出 artifacts/01_requirements/requirement_confirmation_pack.md 后，必须停止。
等待用户输入 APPROVED_REQUIREMENTS 才能继续。

### 关卡 2（阶段 2 结束后）
输出 artifacts/02_product/product_confirmation_pack.md 后，必须停止。
等待用户输入 APPROVED_PRODUCT_SCOPE 才能继续。

### 关卡 3（阶段 5 结束后）
ui-judge 输出 top3_for_user_selection.md 后，必须停止。
等待用户输入 APPROVED_UI_OPTION: 方案名 才能继续。

## 交付门禁（阶段 9）

以下任一条件不满足，delivery-agent 必须判定为"不允许交付"：
1. 小程序没有生成微信开发者工具可打开目录
2. Web 前端打不开
3. 后端打不开
4. Review 有阻塞问题
5. Test 有阻塞问题

## 核心要求

- 不要一上来写代码。
- 不要跳过 UI contest。
- 不要跳过 Review。
- 不要跳过 Test。
- 三个关卡处必须停止等待用户确认。
- 所有正式结果必须写入 artifacts。
- 开发代码必须写入 workspace。
- 每个阶段结束后，必须告诉用户输出文件在哪里。
- 如果某个阶段失败，先写明失败原因，再生成修复方案。
- Review + Test + Fix 最多自动循环 3 轮。
- 如果 3 轮后仍失败，停止并输出失败报告，不要无限循环。
- 小程序交付必须实际生成微信开发者工具可打开目录。
- Web 交付必须使用 local-preview 启动并验证可访问。

## 执行方式

- 产品相关任务使用 product-manager agent。
- 架构相关任务使用 architect agent。
- UI 方案任务使用 ui-designer agent。
- HTML 原型生成使用 ui-prototype skill。
- UI 评审任务使用 ui-judge agent。
- 任务拆解使用 planner agent。
- 小程序开发使用 miniapp-dev agent。
- 商家 Web 开发使用 merchant-web-dev agent。
- 后端开发使用 backend-dev agent。
- 数据库开发使用 database-dev agent。
- 测试使用 qa-tester agent。
- 代码审查使用 code-reviewer agent。
- 小程序打开检查使用 miniapp-open-check skill。
- 本地预览使用 local-preview skill。
- 交付总结使用 delivery-agent agent。

## 完成后输出

- 本次完成了哪些阶段
- 关键产物位置
- 当前是否可以进入人工验收
- 下一步建议

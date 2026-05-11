---
name: factory-run
description: 从 brief.md 开始，按 AI Dev Factory v0.1 流程完成需求分析、产品文档、架构、UI contest、任务拆解、开发、Review、测试、修复和交付。
---

# factory-run

你现在要执行 AI Dev Factory v0.1 的完整开发流程。

必须先读取：
- CLAUDE.md
- workflow.md
- brief.md

严格按照 workflow.md 的 9 个阶段执行：

1. 需求分析
2. 产品文档
3. 技术架构
4. UI Contest
5. UI 评审
6. 任务拆解
7. 开发
8. Review + Test + Fix
9. 交付 + 学习总结

核心要求：
- 不要一上来写代码。
- 不要跳过 UI contest。
- 不要跳过 Review。
- 不要跳过 Test。
- 所有正式结果必须写入 artifacts。
- 开发代码必须写入 workspace。
- 每个阶段结束后，必须告诉用户输出文件在哪里。
- 如果某个阶段失败，先写明失败原因，再生成修复方案。
- Review + Test + Fix 最多自动循环 3 轮。
- 如果 3 轮后仍失败，停止并输出失败报告，不要无限循环。

执行方式：
- 产品相关任务使用 product-manager agent。
- 架构相关任务使用 architect agent。
- UI 方案任务使用 ui-designer agent。
- UI 评审任务使用 ui-judge agent。
- 任务拆解使用 planner agent。
- 小程序开发使用 miniapp-dev agent。
- 商家 Web 开发使用 merchant-web-dev agent。
- 后端开发使用 backend-dev agent。
- 数据库开发使用 database-dev agent。
- 测试使用 qa-tester agent。
- 代码审查使用 code-reviewer agent。
- 交付总结使用 delivery-agent agent。

完成后输出：
- 本次完成了哪些阶段
- 关键产物位置
- 当前是否可以进入人工验收
- 下一步建议
---
name: ui-contest
description: 针对当前项目重新进行 UI contest，生成多个 UI 方案并评审出最佳方向。
---

# ui-contest

你现在只执行 UI contest，不要改业务逻辑代码。

必须读取：
- CLAUDE.md
- workflow.md
- artifacts/02_product/prd.md
- artifacts/02_product/page_list.md
- artifacts/02_product/user_flows.md

如果存在，也要读取：
- artifacts/04_ui_contest/final_design_rules.md
- knowledge/ui_lessons/

任务：
1. 使用 ui-designer agent 生成至少 5 个不同 UI 方案。
2. 每个方案必须适合微信小程序和商家 Web。
3. 每个方案必须说明首页、预约页、商家后台的布局。
4. 每个方案必须说明颜色、字体、间距、卡片、按钮、表单风格。
5. 每个方案必须说明适合什么门店类型。
6. 每个方案必须说明缺点和风险。
7. 使用 ui-judge agent 对所有方案打分。
8. 可以选择一个方案，也可以融合多个方案的优点。
9. 最终必须输出明确的前端开发设计规则。

输出：
- artifacts/04_ui_contest/variants/
- artifacts/04_ui_contest/ui_ranking.md
- artifacts/04_ui_contest/selected_ui_direction.md
- artifacts/04_ui_contest/final_design_rules.md

限制：
- 不要写最终代码。
- 不要直接改 workspace。
- 不要跳过 UI 评审。
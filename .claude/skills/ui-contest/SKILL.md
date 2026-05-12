---
name: ui-contest
description: 针对当前项目重新进行 UI contest，生成 ≥5 个 UI 方案（含 HTML 预览），评审出 Top 3 供用户选择。
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

## v0.2 新要求

### 方案数量
必须生成 **至少 5 个**不同的 UI 方案。

### 每个方案必须输出 4 个文件

```
artifacts/04_ui_contest/variants/variant_0N/
├── description.md          # 方案说明
├── miniapp_preview.html    # 小程序预览（375px 手机端）
├── admin_preview.html      # 商家后台预览（1440px 桌面端）
└── design_tokens.md        # 设计规则
```

### description.md 必须包含

- 方案名称
- 适合的门店类型和用户画像
- 视觉风格关键词
- 颜色建议（主色、辅色、点缀色，给出 #HEX）
- 字体层级
- 间距规则
- 按钮样式
- 卡片样式
- 表单风格
- 优点
- 缺点
- 实现难度
- 可复用性

### HTML 预览要求

- 独立 .html 文件，可直接在浏览器打开
- 使用内联 CSS（不依赖外部文件）
- 模拟真实页面布局和交互状态
- miniapp_preview.html 模拟 375px 宽手机端
- admin_preview.html 模拟 1440px 宽桌面端
- 至少包含：首页、预约页、商家后台核心页面的模拟

### design_tokens.md 必须包含

- 颜色（--color-primary, --color-bg 等，给 #HEX）
- 字体（标题/正文/辅助文字，给字号和粗细）
- 间距（基础单位）
- 圆角规则
- 阴影层级
- 状态颜色映射

## UI 设计参考思路（Open Design 轻量版）

可参考以下思路但不引入外部仓库：
- artifact-first：先输出具体产物，再讨论
- 锁定受众、调性、品牌上下文
- 生成可预览原型
- 使用设计方向选择
- 使用 critique 评审
- 使用 tweaks 做修改建议

## 任务流程

1. 使用 ui-designer agent 生成至少 5 个不同 UI 方案的 description.md 和 design_tokens.md
2. 使用 ui-prototype skill 为每个方案生成 miniapp_preview.html 和 admin_preview.html
3. 使用 ui-judge agent 对全部方案评分排名
4. ui-judge 输出 Top 3 供用户选择（不能替用户做最终决定）

## 🛑 关卡：必须等待用户确认

ui-judge 输出 top3_for_user_selection.md 后，必须停止。
等待用户输入 APPROVED_UI_OPTION: 方案名。

如果用户提出修改意见，ui-designer 必须修改方案，重新输出预览，再次等待确认。

只有用户确认后，才输出：
- artifacts/04_ui_contest/final_user_approved_design.md
- artifacts/04_ui_contest/final_design_rules.md

## 输出

- artifacts/04_ui_contest/variants/variant_01/ ~ variant_05/
- artifacts/04_ui_contest/ui_ranking.md
- artifacts/04_ui_contest/top3_for_user_selection.md
- （用户确认后）artifacts/04_ui_contest/final_user_approved_design.md
- （用户确认后）artifacts/04_ui_contest/final_design_rules.md

## 限制

- 不要写最终代码。
- 不要直接改 workspace。
- 不要跳过 UI 评审。
- UI judge 不能替用户做最终决定。

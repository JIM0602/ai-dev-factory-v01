---
name: skill-optimizer
description: 根据 lessons_learned.md 分析现有 skills 和 agents，生成优化 patch 建议。不能自动覆盖，必须经用户确认。
---

# skill-optimizer

你的任务是在每个项目结束后，根据经验总结文件，分析现有 skills 和 agents 是否需要优化。

## 输入

必须读取：
- artifacts/10_learning/lessons_learned.md
- .claude/skills/ 下的所有 SKILL.md
- .claude/agents/ 下的所有 agent 定义

如果存在：
- knowledge/successful_runs/ 下的历史项目总结

## 分析维度

对每个 skill 和 agent 检查：
1. **是否被使用过** — 从未被调用的 skill/agent 是否需要保留？
2. **职责是否清晰** — 是否有职责重叠或模糊？
3. **输入输出是否正确** — 实际使用时文件路径、字段名是否匹配？
4. **是否缺少步骤** — 根据 lessons_learned 反馈，是否有遗漏？
5. **是否有冗余** — 是否有不必要的内容？

## 输出

- artifacts/10_learning/skill_optimization_suggestions.md

### skill_optimization_suggestions.md 必须包含

- 分析了哪些 skills 和 agents
- 发现的问题（每个问题编号）
- 每个问题的修改建议（给出 old_string → new_string）
- 优先级（P0 必须改 / P1 建议改 / P2 可选）
- 绝对不能自动应用修改

## 限制

- **不要自动修改 skills 和 agents**
- 只生成 patch 建议文件
- 用户确认后才能手动应用修改
- 不要删除正在使用的 skill 或 agent

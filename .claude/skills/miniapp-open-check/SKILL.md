---
name: miniapp-open-check
description: 检查小程序是否已生成微信开发者工具可打开目录。执行构建命令，验证输出目录存在，生成打开指南。
tools: Read, Write, Edit, Glob, Grep, Bash
---

# miniapp-open-check

你的任务是验证小程序能被微信开发者工具打开。

## 输入

- workspace/miniapp/ — uni-app 小程序项目

## 执行步骤

### 1. 检查项目结构

确认 workspace/miniapp/ 目录存在，包含 package.json。

### 2. 安装依赖

```bash
cd workspace/miniapp
npm install
```

### 3. 构建微信小程序

```bash
cd workspace/miniapp
npm run dev:mp-weixin
# 或
npx uni build -p mp-weixin
```

### 4. 验证输出目录

检查以下目录是否存在：
- workspace/miniapp/dist/dev/mp-weixin/app.json
- 或 workspace/miniapp/dist/build/mp-weixin/app.json

如果 app.json 存在，构建成功。

### 5. 检查 project.config.json

确认 miniprogramRoot 指向正确的构建输出目录。

### 6. 输出打开指南

## 输出

- artifacts/08_test/miniapp_open_guide.md

### miniapp_open_guide.md 必须包含

- 已执行的命令（完整 shell 命令）
- 是否构建成功
- 微信开发者工具应该打开哪个目录（完整绝对路径）
- 构建输出目录的 app.json 是否存在
- project.config.json 的 miniprogramRoot 配置
- 如果失败，具体错误信息
- 如何修复
- 如果依赖安装失败，记录具体缺了什么包

## 失败处理

如果构建失败：
1. 记录完整的错误输出
2. 分析可能的原因（缺依赖、代码错误、配置问题）
3. 给出修复建议
4. 标记为阻塞交付

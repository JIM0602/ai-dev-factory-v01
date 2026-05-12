---
name: local-preview
description: 启动后端和商家 Web 前端，生成访问地址，验证页面可访问，输出本地预览报告。
tools: Read, Write, Edit, Glob, Grep, Bash
---

# local-preview

你的任务是在本地启动项目的后端和 Web 前端，让用户可以直接在浏览器看到效果。

## 输入

- workspace/server/ — 后端 NestJS 项目
- workspace/admin-web/ — 商家 Web 后台项目

## 执行步骤

### 1. 启动后端

```bash
cd workspace/server
npm install
npm run start:dev &
```

等待后端启动完成（检查输出中的端口号，默认 3000）。

### 2. 启动商家 Web

```bash
cd workspace/admin-web
npm install
npm run dev &
```

等待 Vite 输出访问地址（默认 http://localhost:5173）。

### 3. 验证可访问性

- 尝试访问后端健康检查或 API 端点
- 尝试访问 Web 前端页面
- 记录是否成功

### 4. 输出报告

## 输出

- artifacts/09_delivery/local_preview_report.md

### local_preview_report.md 必须包含

- 后端启动命令
- 后端访问地址
- 后端是否启动成功
- Web 启动命令
- Web 访问地址
- Web 是否启动成功
- 是否可通过浏览器访问
- 如果失败，具体错误原因
- 如何修复
- 用户接下来怎么查看（打开哪个 URL）

## 注意事项

- 如果端口被占用，尝试更换端口
- 如果依赖安装失败，记录具体错误
- 启动后不要关闭进程（让用户手动关闭）
- 数据库需要提前配置好（检查 .env 文件）

# 拼豆店预约计时小程序 -- 部署指南

## 文档信息

| 项目 | 内容 |
|------|------|
| 文档版本 | v1.0 |
| 创建日期 | 2026-05-11 |
| 负责 Agent | delivery-agent |
| 适用环境 | 开发/测试/生产 |

---

## 1. 环境要求

### 1.1 基础环境

| 软件 | 最低版本 | 推荐版本 | 用途 |
|------|:---:|:---:|------|
| Node.js | 18.x | 20.x LTS | 运行 NestJS 后端和前端构建 |
| npm / pnpm | npm 9.x | pnpm 8.x | 包管理 |
| PostgreSQL | 14 | 15 | 数据库 |
| Docker | 24.x | 26.x | 容器化部署 |
| Docker Compose | 2.x | 2.24+ | 多容器编排 |
| Git | 2.x | 2.40+ | 版本控制 |

### 1.2 微信小程序开发环境（仅本地开发）

| 软件 | 说明 |
|------|------|
| HBuilderX | uni-app 官方 IDE，支持一键编译和运行微信小程序 |
| 微信开发者工具 | 微信小程序调试和预览工具 |
| 微信小程序 AppID | 需注册微信小程序并获取 AppID |

### 1.3 服务器推荐配置

| 配置项 | 最低 | 推荐 |
|------|:---:|:---:|
| CPU | 2 核 | 4 核 |
| 内存 | 2 GB | 4 GB |
| 磁盘 | 20 GB | 40 GB SSD |
| 操作系统 | Ubuntu 20.04+ / Debian 11+ / CentOS 8+ |

---

## 2. 快速启动（Docker Compose 一键部署）

### 2.1 前置条件

确保服务器已安装 Docker 和 Docker Compose。

```bash
# 检查 Docker 版本
docker --version  # 需要 >= 24.x
docker compose version  # 需要 >= 2.x
```

### 2.2 克隆项目

```bash
git clone <your-repo-url> bead-store
cd bead-store
```

### 2.3 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，至少修改以下配置
# - DB_PASSWORD: 数据库密码
# - JWT_SECRET: JWT 签名密钥（生产环境务必使用强随机字符串）
# - WECHAT_APPID: 微信小程序 AppID
# - WECHAT_SECRET: 微信小程序 AppSecret
```

### 2.4 构建并启动

```bash
# 构建并启动所有服务（PostgreSQL + NestJS + Nginx）
docker compose up -d --build

# 查看服务状态
docker compose ps

# 预期输出：
# NAME                  STATUS
# bead-store-postgres   Up (healthy)
# bead-store-server     Up (healthy)
# bead-store-nginx      Up
```

### 2.5 验证服务

```bash
# 验证门店公开 API（无需认证）
curl http://localhost/api/store/info

# 预期返回 JSON：
# {"code": 0, "message": "ok", "data": { "name": "...", "address": "...", ... }}

# 验证商家登录
curl -X POST http://localhost/api/auth/admin-login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# 预期返回 JWT Token
```

### 2.6 访问各端

| 端 | 地址 | 说明 |
|------|------|------|
| 后端 API | `https://<your-domain>/api/` | RESTful API |
| 商家 Web 后台 | `https://<your-domain>/admin/` | 浏览器访问 |
| 用户端小程序 | 微信 AppID | 通过微信开发者工具/真机预览 |

---

## 3. 手动部署

### 3.1 PostgreSQL 数据库

#### 3.1.1 启动 PostgreSQL（Docker 方式）

```bash
docker run -d \
  --name bead-store-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=<your-password> \
  -e POSTGRES_DB=bead_store \
  -p 5432:5432 \
  -v pgdata:/var/lib/postgresql/data \
  postgres:15-alpine
```

#### 3.1.2 运行数据库迁移

```bash
cd workspace/server

# 安装依赖
pnpm install

# 运行 TypeORM Migration（创建所有表）
npx ts-node -r tsconfig-paths/register \
  ./node_modules/typeorm/cli.js migration:run \
  -d src/database/data-source.ts
```

#### 3.1.3 写入种子数据

```bash
# 写入初始数据（门店配置、预约规则、管理员账号）
npx ts-node -r tsconfig-paths/register src/database/seeds/seed.ts
```

种子数据包含：
- **门店配置**：默认门店信息（可后续在 Web 后台修改）
- **预约规则**：默认规则（自动确认、提前 7 天可预约、60 分钟时段）
- **管理员账号**：用户名 `admin`，密码 `admin123`（**生产环境请立即修改**）

#### 3.1.4 数据库表清单

| 表名 | 说明 |
|------|------|
| `store` | 门店基础信息（名称、地址、照片、营业时间、桌位数） |
| `reservation_rules` | 预约业务规则配置 |
| `reservations` | 预约记录 |
| `timer_sessions` | 计时会话 |
| `timer_extensions` | 加时记录 |
| `coupons` | 团购券核销记录 |
| `members` | 会员档案 |
| `consumption_records` | 消费记录 |
| `merchant_accounts` | 商家管理账号 |
| `messages` | 消息记录（V1 预留） |

---

### 3.2 后端服务启动

#### 3.2.1 安装依赖

```bash
cd workspace/server
pnpm install
```

#### 3.2.2 配置环境变量

创建 `workspace/server/.env` 文件：

```env
# 数据库
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=<your-password>
DB_DATABASE=bead_store

# JWT
JWT_SECRET=<generate-a-random-secret-string>
JWT_EXPIRES_IN=7d

# 微信小程序（用于 code 换 openid）
WECHAT_APPID=<your-miniapp-appid>
WECHAT_SECRET=<your-miniapp-secret>

# 服务端口
PORT=3000

# 文件上传
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880

# 定时任务：自动取消检查间隔（分钟）
AUTO_CANCEL_CRON=*/5 * * * *
```

#### 3.2.3 启动服务

```bash
# 开发模式（热重载）
pnpm start:dev

# 生产模式
pnpm build
pnpm start:prod

# 服务默认监听 http://localhost:3000
```

#### 3.2.4 验证后端

```bash
# 健康检查
curl http://localhost:3000/api/store/info

# 管理员登录
curl -X POST http://localhost:3000/api/auth/admin-login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

---

### 3.3 商家 Web 后台部署

#### 3.3.1 开发环境

```bash
cd workspace/admin-web
pnpm install
pnpm dev
# 启动 Vite 开发服务器，默认 http://localhost:5173
```

#### 3.3.2 生产构建

```bash
cd workspace/admin-web
pnpm install
pnpm build
# 产出静态文件到 dist/ 目录
```

#### 3.3.3 Nginx 静态资源配置

将 `dist/` 目录的内容部署到 Nginx 的 `/admin/` 路径下。

Nginx 配置示例：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 商家 Web 后台静态文件
    location /admin/ {
        alias /path/to/admin-web/dist/;
        try_files $uri $uri/ /admin/index.html;
    }

    # API 反向代理
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 上传文件（门店照片）
    location /uploads/ {
        alias /path/to/uploads/;
    }
}
```

生产环境建议配置 SSL：

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/ssl/certs/your-cert.pem;
    ssl_certificate_key /etc/ssl/private/your-key.pem;

    # ... 同上配置
}

server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

---

### 3.4 小程序发布流程

#### 3.4.1 本地开发

**方式 A：使用 HBuilderX（推荐）**

1. 下载并安装 [HBuilderX](https://www.dcloud.io/hbuilderx.html)
2. 打开 HBuilderX，导入项目：`文件 → 导入 → 从本地目录导入`，选择 `workspace/miniapp/`
3. 配置 `manifest.json` 中的微信小程序 AppID
4. 点击 `运行 → 运行到小程序模拟器 → 微信开发者工具`
5. 在微信开发者工具中调试和预览

**方式 B：使用 CLI**

```bash
cd workspace/miniapp

# 安装 uni-app 完整依赖
npm install @dcloudio/uni-app @dcloudio/vite-plugin-uni @dcloudio/uni-mp-weixin

# 构建微信小程序
npx vite build --mode production

# 构建产物在 dist/dev/mp-weixin/
```

使用微信开发者工具打开 `dist/dev/mp-weixin/` 目录即可预览。

#### 3.4.2 配置后端 API 地址

编辑 `workspace/miniapp/src/api/request.ts`，修改 `BASE_URL`：

```typescript
const BASE_URL = 'https://your-domain.com/api';
```

#### 3.4.3 上传与发布

1. 在微信开发者工具中点击「上传」
2. 填写版本号和项目备注
3. 登录 [微信公众平台](https://mp.weixin.qq.com/)
4. 进入「版本管理」，选择上传的版本
5. 提交审核
6. 审核通过后发布

---

## 4. 环境变量说明

### 4.1 完整环境变量列表（`.env`）

| 变量名 | 说明 | 示例 | 必填 |
|------|------|------|:---:|
| `NODE_ENV` | 运行环境 | `development` / `production` | 是 |
| `DB_HOST` | 数据库地址 | `localhost` / `postgres`（Docker） | 是 |
| `DB_PORT` | 数据库端口 | `5432` | 是 |
| `DB_USERNAME` | 数据库用户 | `postgres` | 是 |
| `DB_PASSWORD` | 数据库密码 | 随机强密码 | 是 |
| `DB_DATABASE` | 数据库名 | `bead_store` | 是 |
| `JWT_SECRET` | JWT 签名密钥 | 随机 32+ 字符 | 是 |
| `JWT_EXPIRES_IN` | JWT 过期时间 | `7d`（customer）/ `24h`（merchant admin） | 是 |
| `WECHAT_APPID` | 微信小程序 AppID | `wxXXXXXXXXXXXXXXXX` | 是 |
| `WECHAT_SECRET` | 微信小程序 AppSecret | 从微信公众平台获取 | 是 |
| `PORT` | 后端服务端口 | `3000` | 否 |
| `UPLOAD_DIR` | 门店照片上传目录 | `./uploads` | 否 |
| `MAX_FILE_SIZE` | 上传文件大小限制（字节） | `5242880`（5MB） | 否 |
| `AUTO_CANCEL_CRON` | 自动取消定时任务 cron | `*/5 * * * *` | 否 |

### 4.2 Docker Compose 环境变量

Docker Compose 使用根目录的 `.env` 文件。环境变量会自动注入到 `server` 容器中。

---

## 5. Docker Compose 部署详情

### 5.1 服务架构

```
docker compose up -d
                │
    ┌───────────┼───────────┐
    │           │           │
    v           v           v
┌────────┐ ┌────────┐ ┌────────┐
│ Nginx  │ │NestJS  │ │Postgres│
│  :443  │ │  :3000 │ │ :5432  │
└────┬───┘ └───┬────┘ └───┬────┘
     │         │          │
     │    ┌────┘          │
     │    │   网络通信     │
     │    └───────────────┘
     │
  HTTPS 终止
  /api/* → NestJS
  /admin/* → 静态文件
```

### 5.2 数据持久化

| Volume 名称 | 宿主机路径 | 用途 |
|------|------|------|
| `pgdata` | `/var/lib/docker/volumes/bead-store_pgdata/_data` | PostgreSQL 数据 |
| `uploads` | `./uploads`（项目目录） | 门店照片等上传文件 |

### 5.3 日常运维命令

```bash
# 查看所有容器状态
docker compose ps

# 查看后端日志
docker compose logs -f server

# 查看数据库日志
docker compose logs -f postgres

# 重启某个服务
docker compose restart server

# 停止所有服务
docker compose down

# 停止并清除数据（危险操作）
docker compose down -v

# 更新镜像并重新部署
docker compose pull
docker compose up -d --build

# 进入后端容器
docker compose exec server sh
```

### 5.4 数据库备份与恢复

```bash
# 备份
docker compose exec postgres pg_dump -U postgres bead_store > backup_$(date +%Y%m%d).sql

# 恢复
docker compose exec -T postgres psql -U postgres bead_store < backup_20260511.sql
```

---

## 6. 常见问题排查

### 6.1 数据库连接失败

**症状**：后端启动报错 `connect ECONNREFUSED 127.0.0.1:5432`

**排查**：
1. 确认 PostgreSQL 已启动：`docker compose ps postgres`
2. 确认 `.env` 中 `DB_HOST` 值正确：
   - 本地开发：`localhost`
   - Docker 内部：`postgres`（容器名）
3. 确认密码正确：`docker compose logs postgres | grep "ready"`

### 6.2 JWT Token 过期

**症状**：API 返回 401 Unauthorized

**解决方案**：
- 顾客端 Token 有效期 7 天，到期需重新 `wx.login`
- Web 后台 Token 有效期 24 小时，到期需重新登录
- 可调整 `.env` 中 `JWT_EXPIRES_IN` 值

### 6.3 小程序无法请求后端

**症状**：小程序端页面加载失败，网络请求报错

**排查**：
1. 确认小程序后台已将后端域名配置到「request 合法域名」
2. 确认后端使用 HTTPS（小程序强制 HTTPS）
3. 确认 SSL 证书有效
4. 检查 `BASE_URL` 配置是否正确

### 6.4 图片上传失败

**症状**：门店设置页上传图片不成功

**排查**：
1. 检查 `UPLOAD_DIR` 目录是否存在且有写权限
2. 检查 Nginx `client_max_body_size` 是否足够（建议 10MB）
3. 确认 `MAX_FILE_SIZE` 设置（默认 5MB）

### 6.5 定时任务不执行

**症状**：待确认预约不会自动取消

**排查**：
1. 确认 `AUTO_CANCEL_CRON` 配置正确（默认 `*/5 * * * *`）
2. 确认 `reservation_rules.require_confirmation = true`
3. 确认 `reservation_rules.auto_cancel_hours` 有值
4. 检查后端日志：`docker compose logs server | grep "autoCancel"`

### 6.6 商家端小程序和用户端小程序是同一个吗？

**是的。** 这是同一个微信小程序，通过角色自动识别展示不同界面：
- 普通微信用户打开 → 看到用户端（门店主页、预约）
- 数据库中标记为商家的 openid → 看到商家端（工作台、计时看板）
- 商家也可在小程序内切换到顾客视角预览

### 6.7 如何修改管理员密码？

```bash
# 进入后端容器
docker compose exec server sh

# 使用 Node.js 生成 bcrypt hash
node -e "
const bcrypt = require('bcrypt');
bcrypt.hash('your-new-password', 10).then(h => console.log(h));
"

# 然后手动更新数据库
# docker compose exec postgres psql -U postgres -d bead_store -c \
#   "UPDATE merchant_accounts SET password_hash = '<hash>' WHERE username = 'admin';"
```

或者通过 Web 后台的账号管理功能（V2 计划）修改。

---

## 7. 生产环境检查清单

部署到生产环境前，请逐项确认：

- [ ] `.env` 中 `JWT_SECRET` 已替换为强随机字符串（至少 32 字符）
- [ ] 数据库密码已从默认值修改
- [ ] 管理员密码已从 `admin123` 修改
- [ ] SSL 证书已配置且有效
- [ ] 微信小程序后台已配置 `request 合法域名`
- [ ] 数据库备份策略已配置（建议每日自动备份）
- [ ] 上传文件目录有定期备份
- [ ] 服务器防火墙仅开放 443（HTTPS）端口
- [ ] Nginx 已限制 `client_max_body_size` 非无限大
- [ ] 微信小程序 AppID 和 AppSecret 已配置为正式环境值
- [ ] 种子数据中门店信息已修改为实际门店信息

---

## 8. 文档修订记录

| 版本 | 日期 | 修改内容 | 修改人 |
|------|------|----------|--------|
| v1.0 | 2026-05-11 | 初稿创建 | delivery-agent |

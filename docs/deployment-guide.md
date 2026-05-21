# 高管周总结系统 · 部署指南

> 版本：v1.0 | 更新：2026-05-21

---

## 环境要求

| 依赖 | 版本 | 说明 |
|---|---|---|
| Node.js | >= 18.0 | 运行时 |
| npm | >= 9.0 | 包管理器 |
| Chromium | 自动安装 | Puppeteer 截图依赖 |

---

## 方式一：直接部署（推荐小规模）

### 1. 安装依赖

```bash
cd src/
npm install --production
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env`，至少配置以下项：

```env
PORT=3457

# DeepSeek（可选，如不配置则使用规则降级）
DEEPSEEK_API_KEY=sk-your-key-here

# 企业微信（可选，如不配置则使用 Mock）
WECOM_CORP_ID=your_corp_id
WECOM_AGENT_ID=your_agent_id
WECOM_SECRET=your_secret
```

### 3. 启动服务

```bash
# 开发模式（自动重启）
npm run dev

# 生产模式
npm start
```

### 4. 使用 PM2 管理进程（生产推荐）

```bash
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup   # 开机自启
```

### 5. 验证部署

访问 `http://your-server:3457/`，确认页面正常渲染。

---

## 方式二：Docker 部署

### 1. 构建镜像

```bash
cd ../
docker-compose -f src/docker-compose.yml build
```

### 2. 启动容器

```bash
docker-compose -f src/docker-compose.yml up -d
```

### 3. 查看日志

```bash
docker-compose -f src/docker-compose.yml logs -f
```

### 4. 停止服务

```bash
docker-compose -f src/docker-compose.yml down
```

---

## 配置说明

### 环境变量清单

| 变量 | 必填 | 默认 | 说明 |
|---|---|---|---|
| `PORT` | 否 | 3457 | 服务端口 |
| `DEEPSEEK_API_KEY` | 否 | - | DeepSeek API 密钥，不配置则使用规则生成摘要 |
| `DEEPSEEK_API_URL` | 否 | `https://api.deepseek.com/v1/chat/completions` | API 端点 |
| `WECOM_CORP_ID` | 否 | - | 企业微信 CorpID |
| `WECOM_AGENT_ID` | 否 | - | 企业微信应用 AgentID |
| `WECOM_SECRET` | 否 | - | 企业微信应用 Secret |

### 端口说明

- `3457`：Web 服务端口（可通过 PORT 环境变量修改）

### 目录说明

| 路径 | 说明 |
|---|---|
| `src/views/` | EJS 页面模板 |
| `src/data/` | 模拟数据（后续替换为数据库） |
| `src/services/` | 业务服务层 |
| `src/snapshots/` | 截图输出目录（自动生成） |
| `src/public/` | 静态资源 |

---

## 生产环境检查清单

- [ ] 配置 `.env` 环境变量
- [ ] 将 `DEEPSEEK_API_KEY` 设为真实密钥
- [ ] 配置企微 `WECOM_*` 变量
- [ ] 使用 PM2 或 Docker 管理进程
- [ ] 配置反向代理（Nginx）统一端口管理
- [ ] 开启 HTTPS（推荐 Let's Encrypt）
- [ ] 配置日志轮转（PM2 自带）
- [ ] 验证定时任务（每周一 8:30）
- [ ] 验证截图功能（Puppeteer）
- [ ] 验证企微推送

### Nginx 反向代理配置示例

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3457;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 维护命令

```bash
# 查看日志
pm2 logs weekly-report

# 重启服务
pm2 restart weekly-report

# 监控状态
pm2 monit

# 停止服务
pm2 stop weekly-report
```

---

## 常见问题

### Puppeteer 启动失败

```bash
# 检查缺失的系统依赖
npx puppeteer browsers install
```

### 端口被占用

```bash
# 查找占用进程
netstat -ano | findstr :3457
# 终止进程
taskkill /PID <PID> /F
```

### 定时任务未触发

- 检查服务器时区是否为 `Asia/Shanghai`
- 查看日志确认 scheduler 已启动

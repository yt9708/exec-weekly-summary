# CLAUDE.md — AI 开发助手使用说明

> ⚠️ 本文件由 CodeBuddy 自动加载。开始工作前请先阅读 `AGENTS.md` 了解完整规范。

---

## 目录结构

```
exec-weekly-summary/
├── AGENTS.md           # AI 开发说明（优先阅读）
├── README.md           # 项目简要介绍
├── docs/               # 产品文档区
│   ├── prd/            #   PRD 文档
│   ├── decisions/      #   关键决策记录（ADR）
│   ├── roadmap-v1.md   #   开发路线图
│   └── deployment-guide.md  # 部署指南
├── assets/             # 素材区
│   ├── design/         #   效果图、UI 参考、设计原型
│   ├── bug/            #   测试报错截图
│   └── reference/      #   参考图、灵感收集
├── notes/              # 学习笔记区（踩坑记录、技术方案）
└── src/                # 代码区（所有代码仅在此处）
    ├── app.js          # 入口文件
    ├── routes/         # 路由模块
    ├── services/       # 业务服务
    ├── views/          # EJS 模板视图
    ├── public/         # 静态资源
    ├── data/           # JSON 数据文件
    ├── snapshots/      # 推送截图
    ├── package.json    # 依赖管理
    ├── Dockerfile      # 容器化
    └── docker-compose.yml
```

> **技术栈**：Node.js + Express 4.x + EJS 3.x + node-cron 3.x  
> **部署**：Bonto 免费版（自动从 GitHub 拉取部署）  
> **状态**：Demo MVP · Mock 数据

---

## 核心规范

| 区域 | 规则 |
|------|------|
| **代码** | 全部放入 `src/`，不引用外部文件 |
| **文档** | 全部放入 `docs/`，Markdown 格式 |
| **素材** | 设计稿、截图分别放入 `assets/` 对应子目录 |
| **笔记** | 踩坑记录放入 `notes/` |

## 快速启动

```bash
cd src
npm install
npm start
```

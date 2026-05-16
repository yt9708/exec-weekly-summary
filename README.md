# 高管周总结系统 — Executive Weekly Summary

> 一款面向企业高管的周工作总结 Web 系统，支持结构化提交、汇总查看、历史追溯与数据看板。

## 项目定位

帮助高管高效撰写、管理、回顾周工作总结，替代传统邮件/Excel 汇报方式，提升团队管理层的信息流转效率。

## 技术栈规划

| 层     | 技术选型            |
| ------ | ------------------- |
| 前端   | React / Vue（待定） |
| 后端   | Node.js / Go（待定） |
| 数据库 | PostgreSQL（候选）  |
| 部署   | Docker              |

> 具体技术选型将在 `docs/decisions/` 中记录。

## 目录结构简述

```
exec-weekly-summary/
├── docs/        → 产品文档（PRD、需求、决策记录）
├── assets/      → 素材（设计稿、bug 截图、参考图）
├── notes/       → 开发笔记（踩坑记录、技术方案）
├── src/         → 全部代码
│   ├── client/  →   前端
│   ├── server/  →   后端
│   ├── shared/  →   共享类型/工具
│   └── config/  →   配置文件
├── CLAUDE.md    → AI 开发助手使用说明（CodeBuddy 自动加载）
└── README.md    → 本文件
```

## 开发规范

所有开发规范详见 [CLAUDE.md](./CLAUDE.md)，请参与开发的 AI 助手在动手前先完整阅读。

---

*项目初始化于 2026-05-15*

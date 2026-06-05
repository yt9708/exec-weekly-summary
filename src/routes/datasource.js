const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '../data/datasources.json');

// 硬编码默认配置 — 当文件读取失败时使用，确保功能不会丢失
const DEFAULT_DATASOURCES = {
  "sources": [
    { "id": "wecom", "name": "企业微信", "icon": "💬", "category": "协作", "description": "企业微信消息、群聊、审批通知", "enabled": true, "configured": true, "config": { "type": "wecom-api", "scopes": ["messages", "approvals", "contacts"], "updateInterval": 3600 }, "modules": ["decisions", "teamUpdates"] },
    { "id": "hesi", "name": "合思", "icon": "💰", "category": "财务", "description": "企业财务费控管理平台", "enabled": true, "configured": true, "config": { "type": "hesi-api", "scopes": ["approvals", "budget"], "updateInterval": 3600 }, "modules": ["decisions", "healthCheck"] },
    { "id": "email", "name": "企业邮箱", "icon": "📧", "category": "协作", "description": "重要邮件、审批提醒、日程通知", "enabled": true, "configured": true, "config": { "type": "email-api", "scopes": ["importantMails"], "updateInterval": 1800 }, "modules": ["decisions"] },
    { "id": "lark", "name": "飞书", "icon": "🐦", "category": "协作", "description": "飞书消息、审批、日历", "enabled": false, "configured": false, "config": { "type": "lark-api", "scopes": ["messages", "approvals", "calendar"], "updateInterval": 3600 }, "modules": ["decisions", "teamUpdates", "healthCheck"] },
    { "id": "internal-erp", "name": "内部ERP系统", "icon": "🏭", "category": "内部系统", "description": "公司内部ERP数据", "enabled": false, "configured": false, "config": { "type": "custom-api", "scopes": ["production", "inventory"], "updateInterval": 7200, "apiUrl": "" }, "modules": ["healthCheck", "warnings"] },
    { "id": "sap", "name": "SAP", "icon": "📦", "category": "企业内部", "description": "SAP 企业管理系统", "enabled": false, "configured": false, "config": { "type": "sap-api", "scopes": ["finance", "supplyChain"], "updateInterval": 7200, "apiUrl": "" }, "modules": ["healthCheck", "warnings"] },
    { "id": "custom", "name": "自定义数据源", "icon": "🔧", "category": "扩展", "description": "通过 API 接入自定义系统", "enabled": false, "configured": false, "config": { "type": "custom-api", "scopes": ["custom"], "updateInterval": 3600, "apiUrl": "" }, "modules": [] }
  ],
  "pushChannels": [
    { "id": "wecom", "name": "企业微信", "icon": "💬", "enabled": true, "hasCalendar": true, "description": "推送图片卡片 + 同步日历" },
    { "id": "lark", "name": "飞书", "icon": "🐦", "enabled": false, "hasCalendar": true, "description": "推送消息卡片 + 同步日历" },
    { "id": "email", "name": "邮件", "icon": "📧", "enabled": false, "hasCalendar": false, "description": "发送邮件摘要" }
  ]
};

// 内存缓存 — 在只读环境下也能正常工作
let cache = null;

function loadDatasources() {
  if (cache) return cache;
  try {
    cache = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
  } catch (e) {
    console.warn('[datasource] 读取 datasources.json 失败，使用硬编码默认配置:', e.message);
    // 深拷贝默认配置，避免引用污染
    cache = JSON.parse(JSON.stringify(DEFAULT_DATASOURCES));
  }
  return cache;
}

function saveDatasources(data) {
  cache = data; // 始终更新内存
  try {
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.warn('[datasource] 写入 datasources.json 失败（只读环境），仅保存在内存:', e.message);
  }
}

// 管理页面
router.get('/', (req, res) => {
  const ds = loadDatasources();
  res.render('datasource', { 
    title: '数据源管理', 
    page: 'datasource', 
    datasources: ds.sources,
    pushChannels: ds.pushChannels || []
  });
});

// API - 获取全部数据源（含推送渠道）
router.get('/api/sources', (req, res) => {
  res.json({ status: 'ok', data: loadDatasources() });
});

// API - 获取推送渠道
router.get('/api/push-channels', (req, res) => {
  const ds = loadDatasources();
  res.json({ status: 'ok', data: ds.pushChannels || [] });
});

// API - 切换推送渠道
router.put('/api/push-channels/:id/toggle', (req, res) => {
  const ds = loadDatasources();
  const channel = (ds.pushChannels || []).find(c => c.id === req.params.id);
  if (!channel) return res.status(404).json({ status: 'error', message: '未找到推送渠道' });
  channel.enabled = !channel.enabled;
  ds.updatedAt = new Date().toISOString();
  saveDatasources(ds);
  res.json({ status: 'ok', data: channel });
});

// API - 切换数据源开关
router.put('/api/sources/:id/toggle', (req, res) => {
  const ds = loadDatasources();
  const source = ds.sources.find(s => s.id === req.params.id);
  if (!source) return res.status(404).json({ status: 'error', message: '未找到数据源' });
  source.enabled = !source.enabled;
  ds.updatedAt = new Date().toISOString();
  saveDatasources(ds);
  res.json({ status: 'ok', data: source });
});

// API - 更新数据源配置
router.put('/api/sources/:id', (req, res) => {
  const ds = loadDatasources();
  const source = ds.sources.find(s => s.id === req.params.id);
  if (!source) return res.status(404).json({ status: 'error', message: '未找到数据源' });
  Object.assign(source, req.body);
  ds.updatedAt = new Date().toISOString();
  saveDatasources(ds);
  res.json({ status: 'ok', data: source });
});

module.exports = router;
module.exports.loadDatasources = loadDatasources;

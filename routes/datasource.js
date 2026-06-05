const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '../data/datasources.json');

// 内存缓存 — 在只读环境下也能正常工作
let cache = null;

function loadDatasources() {
  if (cache) return cache;
  try {
    cache = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
  } catch (e) {
    console.warn('[datasource] 读取 datasources.json 失败，使用默认配置:', e.message);
    cache = { sources: [], pushChannels: [], updatedAt: new Date().toISOString() };
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

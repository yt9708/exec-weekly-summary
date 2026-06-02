const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

function loadDatasources() {
  const dataPath = path.join(__dirname, '../data/datasources.json');
  return JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
}

function saveDatasources(data) {
  const dataPath = path.join(__dirname, '../data/datasources.json');
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf-8');
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

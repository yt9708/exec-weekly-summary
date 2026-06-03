const express = require('express');
const router = express.Router();
const store = require('../services/data-store');

// 管理页面
router.get('/', (req, res) => {
  res.render('manage', { title: '数据管理', page: 'manage', report: store.getReport() });
});

// ─── 决策事项 CRUD ───
router.get('/api/decisions', (req, res) => {
  res.json({ status: 'ok', data: store.getDecisions() });
});

router.post('/api/decisions', (req, res) => {
  const item = store.addDecision(req.body);
  res.json({ status: 'ok', data: item });
});

router.put('/api/decisions/:id', (req, res) => {
  const updated = store.updateDecision(req.params.id, req.body);
  if (!updated) return res.status(404).json({ status: 'error', message: '未找到' });
  res.json({ status: 'ok', data: updated });
});

router.delete('/api/decisions/:id', (req, res) => {
  const ok = store.deleteDecision(req.params.id);
  res.json({ status: ok ? 'ok' : 'error', message: ok ? '已删除' : '未找到' });
});

// ─── 事件 CRUD ───
router.get('/api/events', (req, res) => {
  res.json({ status: 'ok', data: store.getEvents() });
});

router.post('/api/events', (req, res) => {
  const item = store.addEvent(req.body);
  res.json({ status: 'ok', data: item });
});

router.put('/api/events/:id', (req, res) => {
  const updated = store.updateEvent(req.params.id, req.body);
  if (!updated) return res.status(404).json({ status: 'error', message: '未找到' });
  res.json({ status: 'ok', data: updated });
});

router.delete('/api/events/:id', (req, res) => {
  const ok = store.deleteEvent(req.params.id);
  res.json({ status: ok ? 'ok' : 'error', message: ok ? '已删除' : '未找到' });
});

// ─── 预警 CRUD ───
router.get('/api/warnings', (req, res) => {
  res.json({ status: 'ok', data: store.getWarnings() });
});

router.post('/api/warnings', (req, res) => {
  const item = store.addWarning(req.body);
  res.json({ status: 'ok', data: item });
});

router.put('/api/warnings/:id', (req, res) => {
  const updated = store.updateWarning(req.params.id, req.body);
  if (!updated) return res.status(404).json({ status: 'error', message: '未找到' });
  res.json({ status: 'ok', data: updated });
});

router.delete('/api/warnings/:id', (req, res) => {
  const ok = store.deleteWarning(req.params.id);
  res.json({ status: ok ? 'ok' : 'error', message: ok ? '已删除' : '未找到' });
});

// ─── 健康度 ───
router.put('/api/health/:index', (req, res) => {
  const updated = store.updateHealthItem(parseInt(req.params.index), req.body);
  if (!updated) return res.status(404).json({ status: 'error', message: '未找到' });
  res.json({ status: 'ok', data: updated });
});

// ─── 团队动态 - 人事变动 ───
router.post('/api/personnel', (req, res) => {
  const item = store.addPersonnelChange(req.body);
  res.json({ status: 'ok', data: item });
});

router.delete('/api/personnel/:index', (req, res) => {
  const ok = store.deletePersonnelChange(parseInt(req.params.index));
  res.json({ status: ok ? 'ok' : 'error', message: ok ? '已删除' : '未找到' });
});

// ─── 团队动态 - 重要日期 ───
router.post('/api/dates', (req, res) => {
  const updates = store.getTeamUpdates();
  updates.importantDates.push(req.body);
  res.json({ status: 'ok', data: req.body });
});

// ─── 重置数据 ───
router.post('/api/reset', (req, res) => {
  store._loadMockData();
  res.json({ status: 'ok', message: '数据已重置' });
});

module.exports = router;

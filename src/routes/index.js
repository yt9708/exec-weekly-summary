const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const calendarSync = require('../services/calendar-sync-service');

function loadMockData() {
  const dataPath = path.join(__dirname, '../data/mock-weekly-report.json');
  return JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
}

// 首页 - 本周周报
router.get('/', (req, res) => {
  const data = loadMockData();
  res.render('index', {
    title: '本周总结',
    page: 'current',
    report: data
  });
});

// 历史周报
router.get('/history', (req, res) => {
  const data = loadMockData();
  res.render('history', {
    title: '历史周报',
    page: 'history',
    report: data
  });
});

// 推送记录
router.get('/push-logs', (req, res) => {
  const data = loadMockData();
  res.render('push-logs', {
    title: '推送记录',
    page: 'push-logs',
    report: data
  });
});

// API - 获取完整周报数据
router.get('/api/weekly-report', (req, res) => {
  const data = loadMockData();
  res.json({ status: 'ok', data });
});

// API - 重新生成 AI 摘要（模拟）
router.post('/api/report/regenerate', (req, res) => {
  setTimeout(() => {
    const mockReroll = [
      { status: 'green', text: '整体平稳 — 各业务线按预期推进，本周无重大偏离。重点关注下周的供应商合同续签。' },
      { status: 'yellow', text: '需跟进 — 市场部新品发布物料仍有 3 项未确认，已发催办通知，请关注今天反馈。' },
      { status: 'red', text: '预警 — 研发部数据库迁移方案因安全审查延迟，建议周三前召开专题会敲定折中方案。' }
    ];
    res.json({ status: 'ok', data: { items: mockReroll, generatedAt: new Date().toISOString() } });
  }, 800);
});

// API - 确认生成周报
router.post('/api/report/confirm', (req, res) => {
  const data = loadMockData();
  const syncable = calendarSync.extractSyncableEvents(data);
  setTimeout(() => {
    res.json({
      status: 'ok',
      message: '本周总结已确认生成',
      data: {
        confirmedAt: new Date().toISOString(),
        weekInfo: data.weekInfo,
        syncableCount: syncable.length,
        syncableEvents: syncable
      }
    });
  }, 600);
});

// API - 确认生成并同步到企微日历
router.post('/api/report/confirm-and-sync', async (req, res) => {
  const data = loadMockData();
  const userId = req.body.userId || 'leung';
  const syncable = calendarSync.extractSyncableEvents(data);

  try {
    const syncResult = await calendarSync.syncToWecomCalendar(syncable, userId);
    res.json({
      status: 'ok',
      message: '本周总结已确认生成，日历事项已同步',
      data: {
        confirmedAt: new Date().toISOString(),
        weekInfo: data.weekInfo,
        syncResult
      }
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: '同步失败：' + err.message
    });
  }
});

module.exports = router;

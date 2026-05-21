const express = require('express');
const router = express.Router();
const path = require('path');
const calendarSync = require('../services/calendar-sync-service');
const screenshotService = require('../services/screenshot-service');
const wecomService = require('../services/wecom-service');
const scheduler = require('../services/scheduler');
const aiService = require('../services/ai-service');
const store = require('../services/data-store');
const BASE_URL = 'http://127.0.0.1:' + (process.env.PORT || 3457);

/**
 * 模板辅助函数：将文本中的数字+单位加粗
 * 匹配模式：数字（含小数）+ 可选空格 + 单位（万亿件个天周项%小时人元等）
 */
function boldNums(text) {
  if (!text) return '';
  return text.replace(/(\d+(?:\.\d+)?\s*(?:万|亿|元|件|个|天|周|项|%|小时|人|名))/g, '<strong class="hl-num">$1</strong>');
}

// 在每次渲染时注入 boldNums 辅助函数
router.use(function(req, res, next) {
  res.locals.boldNums = boldNums;
  next();
});

// 首页 - 本周周报
router.get('/', (req, res) => {
  res.render('index', {
    title: '本周总结',
    page: 'current',
    report: store.getReport()
  });
});

// 历史周报
router.get('/history', (req, res) => {
  res.render('history', {
    title: '历史周报',
    page: 'history',
    report: store.getReport()
  });
});

// 推送记录
router.get('/push-logs', (req, res) => {
  res.render('push-logs', {
    title: '推送记录',
    page: 'push-logs',
    report: store.getReport()
  });
});

// API - 获取完整周报数据
router.get('/api/weekly-report', (req, res) => {
  res.json({ status: 'ok', data: store.getReport() });
});

// API - 重新生成 AI 摘要
router.post('/api/report/regenerate', async (req, res) => {
  try {
    const data = store.getReport();
    const items = await aiService.generateSummary(data);
    res.json({
      status: 'ok',
      data: { items, generatedAt: new Date().toISOString() }
    });
  } catch (err) {
    console.error('[Regenerate]', err);
    res.status(500).json({ status: 'error', message: '生成失败：' + err.message });
  }
});

// API - 确认生成周报
router.post('/api/report/confirm', (req, res) => {
  const data = store.getReport();
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
  const data = store.getReport();
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

// 截图页面（精简版，专为 Puppeteer 截图优化）
router.get('/screenshot', (req, res) => {
  res.render('screenshot', { report: store.getReport() });
});

// API - 生成推送截图
router.post('/api/screenshot/generate', async (req, res) => {
  try {
    const screenshotUrl = BASE_URL + '/screenshot';
    const filename = 'push-report-' + Date.now() + '.png';
    const outputPath = await screenshotService.captureReportImage(screenshotUrl, filename);

    res.json({
      status: 'ok',
      message: '截图已生成',
      data: {
        filename: filename,
        path: '/snapshots/' + filename,
        url: '/snapshots/' + filename
      }
    });
  } catch (err) {
    console.error('[Screenshot Route]', err);
    res.status(500).json({
      status: 'error',
      message: '截图生成失败：' + err.message
    });
  }
});

// 静态文件：提供截图访问
router.use('/snapshots', express.static(path.join(__dirname, '../snapshots')));

// API - 手动推送周报到企微
router.post('/api/push/now', async (req, res) => {
  try {
    // 1. 刷新 AI 摘要
    const items = await aiService.generateSummary(store.getReport());
    store.getReport().aiSummary.items = items;

    // 2. 截图
    const screenshotUrl = BASE_URL + '/screenshot';
    const filename = 'push-' + Date.now() + '.png';
    const imagePath = await screenshotService.captureReportImage(screenshotUrl, filename);

    // 2. 推送
    const mockUsers = ['leung', 'zhangwei', 'wangfang'];
    const reportUrl = BASE_URL + '/';
    const pushResult = await wecomService.pushWeeklyReport(mockUsers, imagePath, reportUrl);

    res.json({
      status: 'ok',
      message: `已推送给 ${pushResult.successCount}/${pushResult.total} 人`,
      data: pushResult
    });
  } catch (err) {
    console.error('[Push Route]', err);
    res.status(500).json({ status: 'error', message: '推送失败：' + err.message });
  }
});

// API - 获取推送目标用户列表
router.get('/api/push/users', (req, res) => {
  const users = [
    { id: 'leung', name: 'Leung', role: 'CEO' },
    { id: 'zhangwei', name: '张伟', role: '研发部长' },
    { id: 'wangfang', name: '王芳', role: '市场部长' },
    { id: 'lichen', name: '李晨', role: '财务部长' },
    { id: 'zhaoqiang', name: '赵强', role: '供应链部长' }
  ];
  res.json({ status: 'ok', data: users });
});

module.exports = router;

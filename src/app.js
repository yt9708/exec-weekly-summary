require('dotenv').config();
const express = require('express');
const path = require('path');
const indexRouter = require('./routes/index');
const scheduler = require('./services/scheduler');
const screenshotService = require('./services/screenshot-service');
const wecomService = require('./services/wecom-service');

const app = express();
const PORT = process.env.PORT || 3456;

// View engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/', indexRouter);

// 注册定时推送流水线
scheduler.registerPushPipeline(async () => {
  console.log('[Pipeline] 开始执行定时推送流水线');

  const BASE_URL = 'http://127.0.0.1:' + PORT;

  // 1. 截图
  const screenshotUrl = BASE_URL + '/screenshot';
  const filename = 'auto-push-' + Date.now() + '.png';
  const imagePath = await screenshotService.captureReportImage(screenshotUrl, filename);

  // 2. 推送
  const mockUsers = ['leung', 'zhangwei', 'wangfang', 'lichen', 'zhaoqiang'];
  const reportUrl = BASE_URL + '/';
  const result = await wecomService.pushWeeklyReport(mockUsers, imagePath, reportUrl);

  console.log(`[Pipeline] 流水线完成：成功推送 ${result.successCount}/${result.total} 人`);
});

// 启动定时器
scheduler.start();

// Start server
app.listen(PORT, () => {
  console.log(`✓ 高管周总结系统已启动: http://127.0.0.1:${PORT}`);
  console.log(`  - 定时推送: 每周一 08:30 (Asia/Shanghai)`);
  console.log(`  - 推送目标: leung, zhangwei, wangfang, lichen, zhaoqiang (mock)`);
});

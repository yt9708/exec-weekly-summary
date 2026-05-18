const express = require('express');
const router = express.Router();

// 首页 - 本周周报
router.get('/', (req, res) => {
  res.render('index', {
    title: '本周总结',
    page: 'current'
  });
});

// API - 获取周报数据
router.get('/api/weekly-report', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Mock data endpoint'
  });
});

module.exports = router;

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

// 加载模拟数据
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

// API - 获取完整周报数据
router.get('/api/weekly-report', (req, res) => {
  const data = loadMockData();
  res.json({ status: 'ok', data });
});

module.exports = router;

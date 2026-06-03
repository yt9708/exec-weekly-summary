/**
 * 企微日历同步服务（MVP 阶段为 mock 实现）
 * 后续对接企微日历 API：https://developer.work.weixin.qq.com/document/path/93648
 */
class CalendarSyncService {

  /**
   * 从周报数据中提取所有可同步的日历事项
   */
  extractSyncableEvents(weeklyReport) {
    const events = [];

    // 模块四：下周预警中带 eventDate 的事项
    (weeklyReport.warnings || []).forEach(w => {
      if (w.syncToCalendar && w.eventDate) {
        events.push({
          title: w.title,
          description: w.description,
          date: w.eventDate,
          time: w.eventTime || '09:00',
          source: '下周预警',
          level: w.level
        });
      }
    });

    // 团队动态中标记 syncToCalendar 的事项
    const updates = weeklyReport.teamUpdates || {};
    (updates.personnelChanges || []).forEach(p => {
      if (p.syncToCalendar && p.date) {
        events.push({
          title: p.type === 'onboard' ? `入职：${p.department} ${p.name}` : `离职：${p.department} ${p.name}`,
          description: `${p.name} ${p.type === 'onboard' ? '入职' : '离职'} ${p.department}${p.role ? '（' + p.role + '）' : ''}`,
          date: p.date,
          time: '09:00',
          source: '团队动态'
        });
      }
    });

    (updates.importantDates || []).forEach(d => {
      if (d.syncToCalendar && d.dateFull) {
        const title = d.type === 'birthday'
          ? `🎂 ${d.name} 生日（${d.department}）`
          : `🎉 ${d.name} 入职 ${d.years} 周年（${d.department}）`;
        events.push({
          title,
          description: `${d.department} ${d.name} ${d.type === 'birthday' ? '生日' : '入职' + d.years + '周年纪念日'}`,
          date: d.dateFull,
          time: '09:00',
          source: '团队动态'
        });
      }
    });

    return events;
  }

  /**
   * 同步到企微日历（mock 实现）
   * @param {Array} events - 日历事项列表
   * @param {string} userId - 企微用户 ID
   * @returns {Promise<{success: boolean, synced: number, failed: number}>}
   */
  async syncToWecomCalendar(events, userId) {
    // Mock: 模拟异步同步
    console.log(`[CalendarSync] 开始同步 ${events.length} 个事项到 ${userId} 的企微日历`);
    
    return new Promise((resolve) => {
      setTimeout(() => {
        const result = {
          success: true,
          synced: events.length,
          failed: 0,
          details: events.map(e => ({
            title: e.title,
            date: e.date,
            status: 'synced'
          }))
        };
        console.log(`[CalendarSync] 同步完成：成功 ${result.synced} 个`);
        resolve(result);
      }, 1200);
    });
  }
}

module.exports = new CalendarSyncService();

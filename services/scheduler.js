const cron = require('node-cron');
const path = require('path');
const fs = require('fs');

/**
 * 定时任务调度器
 * 管理每周一 8:30 的自动推送流程
 */
class Scheduler {

  constructor() {
    this.jobs = [];
    this.pushPipeline = null;
  }

  /**
   * 注册推送流水线回调
   * @param {Function} pipelineFn - async () => { ... }
   */
  registerPushPipeline(pipelineFn) {
    this.pushPipeline = pipelineFn;
  }

  /**
   * 启动定时任务
   * 每周一 8:30 执行：加载数据 → AI 生成 → 截图 → 推送
   */
  start() {
    // cron 表达式：每周一 8:30
    // 格式：秒 分 时 日 月 周
    const job = cron.schedule('30 8 * * 1', async () => {
      console.log('[Scheduler] ⏰ 触发每周一定时推送');

      if (!this.pushPipeline) {
        console.warn('[Scheduler] 推送流水线未注册，跳过本次执行');
        return;
      }

      try {
        await this.pushPipeline();
        console.log('[Scheduler] ✓ 定时推送完成');
      } catch (err) {
        console.error('[Scheduler] ✗ 定时推送失败:', err.message);
      }
    }, {
      timezone: 'Asia/Shanghai'
    });

    this.jobs.push(job);
    console.log('[Scheduler] ✓ 定时任务已启动（每周一 8:30 Asia/Shanghai）');
  }

  /**
   * 立即执行一次推送（手动触发）
   */
  async runNow() {
    if (!this.pushPipeline) {
      throw new Error('推送流水线未注册');
    }
    console.log('[Scheduler] 🔄 手动触发推送');
    await this.pushPipeline();
    console.log('[Scheduler] ✓ 手动推送完成');
  }

  /**
   * 停止所有任务
   */
  stop() {
    this.jobs.forEach(job => job.stop());
    this.jobs = [];
    console.log('[Scheduler] 定时任务已停止');
  }
}

module.exports = new Scheduler();

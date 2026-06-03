const https = require('https');
const http = require('http');
const url = require('url');

/**
 * AI 摘要生成服务
 *
 * 使用 DeepSeek API 生成"本周总览"的 3-5 句话摘要。
 * 配置方式：在 .env 中设置 DEEPSEEK_API_KEY
 *
 * 如果不配置 API Key，服务将降级使用本地规则生成摘要。
 */
class AIService {

  constructor() {
    this.apiKey = process.env.DEEPSEEK_API_KEY || '';
    this.apiUrl = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1/chat/completions';
    this.model = 'deepseek-chat';
  }

  /**
   * 从周报数据中提取用于生成摘要的结构化信息
   */
  buildSummaryContext(report) {
    const sections = [];

    // 决策清单摘要
    const decisions = report.decisions || {};
    const actionItems = (decisions.actionRequired || []).length;
    const decisionItems = (decisions.needsDecision || []).length;
    if (actionItems + decisionItems > 0) {
      const urgent = (decisions.actionRequired || []).filter(d => d.urgency <= 2);
      sections.push(`待处理事项：${actionItems}项需紧急处理，${decisionItems}项需决策。${urgent.length > 0 ? '最紧急：' + urgent.map(d => d.title).join('、') : ''}`);
    }

    // 业务健康度
    const healthItems = report.healthCheck?.items || [];
    const redItems = healthItems.filter(h => h.status === 'red');
    const yellowItems = healthItems.filter(h => h.status === 'yellow');
    if (redItems.length > 0 || yellowItems.length > 0) {
      const issues = [];
      redItems.forEach(h => issues.push(`【红灯】${h.team} ${h.metric}：${h.detail}`));
      yellowItems.forEach(h => issues.push(`【黄灯】${h.team} ${h.metric}：${h.detail}`));
      sections.push(`业务健康度异常：${issues.join('；')}`);
    } else {
      sections.push(`业务健康度：全部 ${healthItems.length} 项指标正常。`);
    }

    // 事件与延期
    const events = report.events || [];
    if (events.length > 0) {
      sections.push(`本周事项：${events.map(e => e.title + '：' + e.description).join('；')}`);
    }

    // 下周预警
    const warnings = report.warnings || [];
    if (warnings.length > 0) {
      sections.push(`下周预警：${warnings.map(w => '【' + (w.level === 'high' ? '高' : w.level === 'medium' ? '中' : '低') + '】' + w.title + '：' + w.description).join('；')}`);
    }

    // 团队动态
    const updates = report.teamUpdates || {};
    if (updates.oneOnOne?.overdueCount > 0) {
      sections.push(`团队管理：${updates.oneOnOne.overdueCount}人超过2周未进行1on1。`);
    }
    if (updates.personnelChanges?.length > 0) {
      sections.push(`人事变动：${updates.personnelChanges.map(p => (p.type === 'onboard' ? '入职' : '离职') + p.name).join('、')}。`);
    }

    return sections.join('\n');
  }

  /**
   * 生成本周总览摘要
   * @param {object} report - 完整周报数据
   * @returns {Promise<Array<{status: string, text: string}>>}
   */
  async generateSummary(report) {
    // 降级方案：如果未配置 API Key，使用规则生成
    if (!this.apiKey || this.apiKey === 'your_api_key_here') {
      return this._fallbackGenerate(report);
    }

    const context = this.buildSummaryContext(report);
    const prompt = `你是一位高管助理，正在为管理者撰写周报的"本周总览"摘要。

请基于以下本周数据，输出 3-5 句话的总览摘要。
要求：
- 每句话以健康状态标记开头：整体状态良好/需要关注/下周风险
- 简洁、直接、结论先行
- 不重复数据细节，只提炼需要管理者知道的信号
- 如果某个维度的数据不足，不要提及该维度
- 每句话一个独立段落

本周数据：
${context}`;

    try {
      const result = await this._callDeepSeek(prompt);
      return this._parseResponse(result, report);
    } catch (err) {
      console.error('[AI Service] API 调用失败，降级到规则生成:', err.message);
      return this._fallbackGenerate(report);
    }
  }

  /**
   * 调用 DeepSeek API
   */
  _callDeepSeek(prompt) {
    return new Promise((resolve, reject) => {
      const body = JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: '你是一位专业的高管助理，输出简洁、直接、有洞察力的管理摘要。只输出摘要内容，不要添加额外说明。' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 500
      });

      const parsedUrl = url.parse(this.apiUrl);
      const isHttps = parsedUrl.protocol === 'https:';
      const transport = isHttps ? https : http;

      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (isHttps ? 443 : 80),
        path: parsedUrl.path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + this.apiKey,
          'Content-Length': Buffer.byteLength(body)
        },
        timeout: 15000
      };

      const req = transport.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.choices && parsed.choices.length > 0) {
              resolve(parsed.choices[0].message.content);
            } else {
              reject(new Error('API 返回格式异常'));
            }
          } catch (e) {
            reject(new Error('解析响应失败: ' + e.message));
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('请求超时')); });
      req.write(body);
      req.end();
    });
  }

  /**
   * 解析 AI 返回的文本为摘要项数组
   */
  _parseResponse(text, report) {
    const items = [];
    const lines = text.split('\n').filter(l => l.trim());

    for (const line of lines) {
      const trimmed = line.trim();
      let status = 'green';
      if (trimmed.includes('风险') || trimmed.includes('红灯') || trimmed.includes('预警') || trimmed.includes('警告')) {
        status = 'red';
      } else if (trimmed.includes('关注') || trimmed.includes('注意') || trimmed.includes('跟进') || trimmed.includes('黄灯')) {
        status = 'yellow';
      }
      // 去掉可能的前缀标记
      const clean = trimmed.replace(/^[-•*]\s*/, '').replace(/^【[^】]*】\s*/, '');
      if (clean.length > 5) {
        items.push({ status, text: clean });
      }
    }

    return items.length >= 2 ? items : this._fallbackGenerate(report);
  }

  /**
   * 降级方案：基于规则生成摘要
   */
  _fallbackGenerate(report) {
    const items = [];

    // 判断整体状态
    const redCount = (report.healthCheck?.items || []).filter(h => h.status === 'red').length;
    const yellowCount = (report.healthCheck?.items || []).filter(h => h.status === 'yellow').length;

    if (redCount > 0) {
      items.push({ status: 'red', text: '本周需要重点关注 — 部分业务线出现异常信号，建议尽快介入处理。' });
    } else if (yellowCount > 0) {
      items.push({ status: 'yellow', text: '整体平稳，部分业务有轻微波动 — 建议关注并提前介入。' });
    } else {
      items.push({ status: 'green', text: '整体状态良好 — 各业务线按计划推进，无重大异常。' });
    }

    // 决策事项
    const fallbackDecisions = report.decisions || {};
    const actionCount = (fallbackDecisions.actionRequired || []).length;
    const decisionCount = (fallbackDecisions.needsDecision || []).length;
    if (actionCount + decisionCount > 0) {
      items.push({ status: 'yellow', text: `需要关注 — 本周有待办事项 ${actionCount + decisionCount} 项，其中 ${actionCount} 项需要紧急处理。` });
    }

    // 预警
    const highWarnings = (report.warnings || []).filter(w => w.level === 'high');
    if (highWarnings.length > 0) {
      items.push({ status: 'red', text: `下周风险 — ${highWarnings.map(w => w.title).join('、')} 即将到期，建议提前准备。` });
    }

    // 团队管理
    const overdue = report.teamUpdates?.oneOnOne?.overdueCount || 0;
    if (overdue > 0) {
      items.push({ status: 'info', text: `团队提醒 — ${overdue} 人超过 2 周未进行 1on1，建议本周安排。` });
    }

    return items.slice(0, 3);
  }
}

module.exports = new AIService();

/**
 * 企微消息推送服务（MVP 阶段为 mock 实现）
 *
 * 后续对接企微 API：
 * - 获取 Token：   GET /cgi-bin/gettoken
 * - 上传素材：     POST /cgi-bin/media/upload
 * - 发送应用消息： POST /cgi-bin/message/send
 *
 * 参考文档：https://developer.work.weixin.qq.com/document/path/90236
 */
class WecomService {

  constructor() {
    this.config = {
      corpId: process.env.WECOM_CORP_ID || 'mock_corp_id',
      agentId: process.env.WECOM_AGENT_ID || 'mock_agent_id',
      secret: process.env.WECOM_SECRET || 'mock_secret'
    };
    this.token = null;
    this.tokenExpiresAt = 0;
  }

  /**
   * 获取 access_token（mock 实现）
   */
  async getAccessToken() {
    // Mock: 直接返回虚拟 token
    if (Date.now() < this.tokenExpiresAt) {
      return this.token;
    }
    this.token = 'mock_token_' + Date.now();
    this.tokenExpiresAt = Date.now() + 7200 * 1000; // 2 小时有效期
    console.log('[Wecom] 获取 access_token 成功（mock）');
    return this.token;
  }

  /**
   * 上传图片到企微临时素材（mock 实现）
   * @param {string} imagePath - 本地图片路径
   * @returns {Promise<string>} media_id
   */
  async uploadImage(imagePath) {
    const token = await this.getAccessToken();
    // Mock: 返回虚拟 media_id
    const mediaId = 'mock_media_' + Date.now();
    console.log('[Wecom] 上传图片素材成功（mock）:', mediaId);
    return mediaId;
  }

  /**
   * 发送图片卡片消息
   * @param {string} userId - 企微用户 ID
   * @param {string} mediaId - 图片素材 ID
   * @param {string} linkUrl - 点击跳转链接
   * @returns {Promise<object>}
   */
  async sendImageCard(userId, mediaId, linkUrl) {
    const token = await this.getAccessToken();
    // Mock: 模拟发送
    console.log(`[Wecom] 发送图片卡片给 ${userId}（mock）`);
    return {
      errcode: 0,
      errmsg: 'ok',
      invaliduser: ''
    };
  }

  /**
   * 发送图文消息卡片（带标题、描述、跳转链接）
   * @param {string} userId - 企微用户 ID
   * @param {object} card - 卡片内容
   * @param {string} card.title - 卡片标题
   * @param {string} card.description - 卡片描述
   * @param {string} card.url - 点击跳转链接
   * @param {string} [card.thumbMediaId] - 缩略图 media_id
   * @returns {Promise<object>}
   */
  async sendNewsCard(userId, card) {
    const token = await this.getAccessToken();
    console.log(`[Wecom] 发送图文卡片给 ${userId}: "${card.title}"（mock）`);
    return {
      errcode: 0,
      errmsg: 'ok',
      invaliduser: ''
    };
  }

  /**
   * 批量推送周报给所有目标用户
   * @param {string[]} userIds - 企微用户 ID 列表
   * @param {string} imagePath - 截图图片路径
   * @param {string} reportUrl - Web 详情页链接
   */
  async pushWeeklyReport(userIds, imagePath, reportUrl) {
    console.log(`[Wecom] 开始批量推送周报给 ${userIds.length} 人`);

    // 步骤 1: 上传图片
    const mediaId = await this.uploadImage(imagePath);

    // 步骤 2: 逐个发送
    const results = [];
    for (const userId of userIds) {
      const result = await this.sendImageCard(userId, mediaId, reportUrl);
      results.push({ userId, success: result.errcode === 0 });
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`[Wecom] 推送完成：成功 ${successCount}/${userIds.length}`);

    return {
      success: successCount === userIds.length,
      total: userIds.length,
      successCount,
      failedCount: userIds.length - successCount,
      details: results
    };
  }
}

module.exports = new WecomService();

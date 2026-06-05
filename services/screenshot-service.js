let puppeteer;
try { puppeteer = require('puppeteer'); } catch(e) { puppeteer = null; }
const path = require('path');
const fs = require('fs');

const SCREENSHOT_DIR = path.join(__dirname, '../snapshots');

class ScreenshotService {
  constructor() {
    this.browser = null;
    // 确保截图目录存在
    if (!fs.existsSync(SCREENSHOT_DIR)) {
      fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    }
  }

  /**
   * 获取或启动浏览器实例
   */
  async getBrowser() {
    if (!puppeteer) throw new Error('Puppeteer 未安装，截图功能不可用');
    if (!this.browser || !this.browser.isConnected()) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu'
        ]
      });
    }
    return this.browser;
  }

  /**
   * 生成周报推送图片
   * @param {string} pageUrl - 要截图的页面地址（Express 内部地址）
   * @param {string} filename - 输出文件名
   * @returns {Promise<string>} 截图文件路径
   */
  async captureReportImage(pageUrl, filename) {
    const browser = await this.getBrowser();
    const page = await browser.newPage();

    // 设置视口尺寸：750×1334（手机比例，适合企微推送）
    await page.setViewport({
      width: 750,
      height: 1334,
      deviceScaleFactor: 2  // Retina 清晰度
    });

    try {
      await page.goto(pageUrl, {
        waitUntil: 'networkidle0',
        timeout: 30000
      });

      // 等待内容渲染完成
      await page.waitForSelector('.card', { timeout: 10000 });

      // 额外等待字体加载
      await page.evaluate(() => document.fonts.ready);

      const outputPath = path.join(SCREENSHOT_DIR, filename);

      // 截取整个页面
      await page.screenshot({
        path: outputPath,
        fullPage: true,
        type: 'png'
      });

      console.log(`[Screenshot] 截图已保存: ${outputPath}`);
      return outputPath;
    } catch (err) {
      console.error('[Screenshot] 截图失败:', err.message);
      throw err;
    } finally {
      await page.close();
    }
  }

  /**
   * 关闭浏览器实例
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

module.exports = new ScreenshotService();

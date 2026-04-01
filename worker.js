const { parentPort, workerData } = require('worker_threads');
const puppeteer = require('puppeteer');
const { captureSkinList } = require('./utils');

const { taskData, threadId } = workerData;

let terminating = false;
let browser = null;
let page = null;

const getBrowserPage = async () => {
  if (terminating) return null;
  
  if (!browser) {
    console.log(`Thread: ${threadId} 初始化浏览器实例`);
    browser = await puppeteer.launch({
      headless: "new",
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--enable-http2', // 启用HTTP/2协议
        '--disable-http-cache', // 禁用缓存确保获取最新数据
        '--max-connections-per-host=10' // 增加单域名最大连接数
      ]
    });
    
    page = await browser.newPage();
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      // 只加载HTML文档，拦截所有其他资源以提高速度
      const allowedTypes = ['document'];
      // 拦截：图片、样式表、字体、脚本、媒体、XHR、Fetch、WebSocket等
      if (allowedTypes.includes(req.resourceType())) {
        // 启用keep-alive连接复用
        req.continue({
          headers: {
            ...req.headers(),
            'Connection': 'keep-alive'
          }
        });
      } else {
        req.abort();
      }
    });
    await page.setDefaultNavigationTimeout(30 * 1000); // 超时时间从60s降低到30s，提高整体速度，失败任务会自动重试
  }
  
  return page;
};

const capture = async (data) => {
  if (!data.url) {
    console.log(`Thread: ${threadId} no url to capture`, data.id, data.url);
    parentPort.postMessage(JSON.stringify({
      type: 'capture_completed',
      data: {}
    }));
    return;
  }

  // 添加随机延迟 100-300ms，避免请求过于集中触发限流
  await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));

  console.log(`Thread: ${threadId} capturing: https://www.gfwiki.org${data.url}`);

  try {
    const page = await getBrowserPage();
    if (!page) return;
    
    const skinList = await captureSkinList(page, `https://www.gfwiki.org${data.url}`);

    parentPort.postMessage(JSON.stringify({
      type: 'capture_completed',
      data: {
        [data.id]: skinList
      }
    }));
  } catch (e) {
    console.log(`Thread: ${threadId} capture error`, e);
    parentPort.postMessage(JSON.stringify({
      type: 'capture_error',
      data: data
    }));
  }
}

const start = async () => {
  if (terminating) {
    return;
  }

  try {
    console.log(`Thread: ${threadId} start with taskData:`, taskData.id, taskData.url);
    if (taskData) {
      await capture(taskData);
    }
  } catch(e) {
    console.log(`Thread ${threadId} error:`, e);
  }
}

start();

parentPort.on('message', async (message) => {
  console.log(`Thread: ${threadId} got message:`, message);

  if (message === 'exit') {
    terminating = true;
    if (browser) {
      await browser.close();
      console.log(`Thread: ${threadId} 浏览器已关闭`);
    }

    parentPort.postMessage('exited');
    // json msg
  } else if (typeof message === 'string' && message.startsWith('{') && message.endsWith('}')) {
    const jsonMsg = JSON.parse(message);

    if (jsonMsg.type === 'newData') {
      await capture(jsonMsg.taskData);
    }
  }
});

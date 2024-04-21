const { parentPort, workerData } = require('worker_threads');
const puppeteer = require('puppeteer');
const { captureSkinList } = require('./utils');

const { taskData, threadId } = workerData;


let terminating = false;
let browser = null;
let page = null;

const capture = async (data) => {
  if (!data.url) {
    console.log(`Thread: ${threadId} no url to capture`, data.id, data.url);
    parentPort.postMessage(JSON.stringify({
      type: 'capture_completed',
      data: {}
    }));
    return;
  }

  console.log(`Thread: ${threadId} capturing: https://www.gfwiki.org${data.url}`);

  try {
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

  // set page ready
  browser = await puppeteer.launch({
    headless: "new"
  });

  try {
    page = await browser.newPage();
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      if (req.resourceType() === 'document') {
        req.continue();
      } else {
        req.abort();
      }
    });
    await page.setDefaultNavigationTimeout(60 * 1000);

    if (terminating) {
      return;
    }

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

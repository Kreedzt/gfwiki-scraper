const { parentPort, workerData } = require('worker_threads');
const puppeteer = require('puppeteer');
const { captureSkinList } = require('./utils');

const { taskData, threadId } = workerData;


let terminating = false;
let browser = null;
let page = null;

const capture = async (data) => {
  console.log(`Thread: ${threadId} capturing: http://www.gfwiki.org${data.url}`);

  try {
    const skinList = await captureSkinList(page, `http://www.gfwiki.org${data.url}`);

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
    await page.setDefaultNavigationTimeout(60 * 1000);

    if (terminating) {
      return;
    }

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

const { parentPort, workerData } = require('worker_threads');
const puppeteer = require('puppeteer');
const { captureSkinList } = require('./utils');

const { taskData: taskRawData, threadId } = workerData;

const taskData = [...taskRawData];

const allSkinsRecord = {};

let terminating = false;

const start = async () => {
  // set page ready
  const browser = await puppeteer.launch({
    headless: "new"
  });

  try {
    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(60 * 1000);

    if (terminating) {
      return;
    }

    while (taskData.length > 0) {
      if (terminating) {
        return;
      }
      const handleItem = taskData.pop();
      const handleIndex = taskData.length;
      console.log(`Thread: ${threadId} handling: ${handleIndex} / ${taskRawData.length}`);

      const skinList = await captureSkinList(page, `http://www.gfwiki.org${handleItem.url}`);
      allSkinsRecord[handleItem.id] = skinList;
    }
    console.log("Thread: ", threadId, " completed");

    await page.close();
  } catch(e) {
    console.log(`Thread ${threadId} error:`, e);
  }

  await browser.close();

  parentPort.postMessage(allSkinsRecord);
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
  }
});

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { Worker } = require('worker_threads');
const { captureSkinList, captureTDollList, writeSkinList2File } = require('./utils');
const { registerExit, registerProcessExit } = require('./exit');

const threads = os.cpus().length;

/**
 * @typedef {{ "url": string, "nameIngame": string, "id": string }} TDollItem
 */

/**
 * @typedef {Object} TDollSkin
 */

/**
 * 线程状态记录: idle / busy / error
 */
const threadRecord = {};


/**
 * @param dollsData {Array<TDollItem>}
 */
const runCaptureSkinTask = async (dollsData) => {
  const allTask = [...dollsData];

  const taskLength = allTask.length;
  const perThreadTask = taskLength / threads;
  console.log("CaptureSkinTask started, total:", taskLength);

  const workerInsArr = [];

  const threadsArr = new Array(threads).fill(0).map((_a, index) => {
    return new Promise(res => {
      const start = perThreadTask * index;
      const end = perThreadTask * (index + 1);
      const threadTaskData = allTask.slice(start, end);

      if (threadTaskData.length === 0) {
        res({});
        return;
      }

      const workerIns = new Worker(path.join(__dirname, 'worker.js'), {
        workerData: {
          threadId: index,
          taskData: threadTaskData
        }
      });

      registerExit(workerIns);

      workerIns.on('message', msg => {
        console.log(`Worker ${index} message received`);

        res(msg);
      });
    });
  });

  const resList = await Promise.all(threadsArr);

  const allSkinsRecord = resList.reduce((acc, cur) => {
    Object.assign(acc, cur);

    return acc;
  }, {});

  console.log(`CaptureSkinTask completed, total: ${Object.keys(allSkinsRecord).length}`);

  // write to file
  writeSkinList2File(allSkinsRecord);

  return allSkinsRecord;
};

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu'
    ]
  });

  const tdollList = await captureTDollList(browser);
  await browser.close();

  const nextData = tdollList;

  if (nextData.length === 0) {
    return;
  }
  await runCaptureSkinTask(nextData.slice(0, 16));
})();

registerProcessExit();

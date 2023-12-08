const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { Worker } = require('worker_threads');
const { captureSkinList, captureTDollList, writeSkinList2File } = require('./utils');
const { registerExit, registerProcessExit, exitAllTask } = require('./exit');

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
  console.log("CaptureSkinTask started, total:", taskLength);

  const workerInsArr = [];

  let allSkinsRecord = {};
  let errorTimesRecord = {};

  const threadsArr = new Array(threads).fill(0).map((_a, index) => {
    return new Promise(res => {
      if (allTask.length === 0) {
        res({});
        return;
      }

      const workerIns = new Worker(path.join(__dirname, 'worker.js'), {
        workerData: {
          threadId: index,
          taskData: allTask.shift()
        }
      });

      workerIns.on('message', _msg => {
        /**
         * @type {String}
         */
        const msg = _msg;
        console.log(`Worker ${index} message received:`, msg);

        console.log(`CaptureSkinTask amount:`, allTask.length);
        if (typeof msg === 'string' && msg.startsWith('{') && msg.endsWith('}')) {
          const jsonMsg = JSON.parse(msg);

          switch (jsonMsg.type) {
            case 'capture_completed': {
              allSkinsRecord = {
                ...allSkinsRecord,
                ...jsonMsg.data
              };
            }
            case 'capture_error': {
              if (!(jsonMsg.data.id in errorTimesRecord)) {
                errorTimesRecord[jsonMsg.data.id] = 0;
              }

              // max retry times: 3
              if (errorTimesRecord[jsonMsg.data.id] !== 3) {
                // +1 times
                errorTimesRecord[jsonMsg.data.id] += 1;
                // add task to last
                allTask.push(jsonMsg.data);
              }
            }
            default: {
              if (allTask.length === 0) {
                res();
                return;
              }
              workerIns.postMessage(JSON.stringify({
                type: 'newData',
                taskData: allTask.shift()
              }));
              break;
            }
          }
        }
      });

      registerExit(workerIns);
    });
  });

  const resList = await Promise.all(threadsArr);

  exitAllTask();

  console.log(`Main: CaptureSkinTask completed, total: ${Object.keys(allSkinsRecord).length}`);

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
  await runCaptureSkinTask(nextData);
})();

registerProcessExit();

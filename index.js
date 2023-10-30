const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { Worker } = require('worker_threads');
const { captureSkinList, captureTDollList } = require('./utils');

const threads = os.cpus().length;

/**
 * @typedef {{ "url": string, "nameIngame": string, "id": string }} TDollItem
 */

/**
 * @typedef {Object} TDollSkin
 */


/**
 * @param browser {puppeteer.Browser}
 * @param dollsData {Array<TDollItem>}
 */
const runCaptureSkinTask = async (browser, dollsData) => {
  const allTask = [...dollsData];

  const taskLength = allTask.length;
  const perThreadTask = taskLength / threads;
  console.log("CaptureSkinTask started, total:", taskLength);

  const threadsArr = new Array(threads).fill(0).map((_a, index) => {
    return new Promise(res => {
      const start = perThreadTask * index;
      const end = perThreadTask * (index + 1);
      const threadTaskData = allTask.slice(perThreadTask * index, perThreadTask * (index + 1));

      const workerIns = new Worker(path.join(__dirname, 'worker.js'), {
        workerData: {
          threadId: index,
          taskData: threadTaskData
        }
      });

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
  const target = path.join(__dirname, 'tdolls_skin_data.json');
  fs.writeFileSync(target, JSON.stringify(allSkinsRecord, null, 4), 'utf-8');

  return allSkinsRecord;
};

(async () => {
  const browser = await puppeteer.launch({
    headless: "new"
  });

  const tdollList = await captureTDollList(browser);
  // await captureSkin(browser, 'http://www.gfwiki.org' + dollsData[0].url);

  // await captureSkinList(browser, 'http://www.gfwiki.org/w/M4A1#MOD3');

  await runCaptureSkinTask(browser, tdollList);

  await browser.close();
})();

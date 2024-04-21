const path = require('path');
const fs = require('fs');
const { timeout } = require('puppeteer');

/**
 * @param data {Object}
 */
const writeSkinList2File = (data) => {
  let newData = {};
  const targetPath = path.join(__dirname, 'tdolls_skin_data.json');

  if (!fs.existsSync(targetPath)) {
    try {
      const oldData = JSON.parse(fs.readFileSync(targetPath, 'utf-8'));
      newData = {
        ...oldData
      };
    } catch (e) {
      console.log('writeSkinList2File: read old data error', e);
    }
  }

  newData = {
    ...newData,
    ...data
  };

  console.log('writeSkinList2File: allData:', Object.keys(newData).length);

  fs.writeFileSync(targetPath, JSON.stringify(newData, null, 4), 'utf-8');
};

exports.writeSkinList2File = writeSkinList2File;

/**
 * @param data {Array}
 */
const writeTdollList2File = (data) => {
  const targetPath = path.join(__dirname, 'tdolls_data.json');

  const recordMap = new Map();

  if (fs.existsSync(targetPath)) {
    const oldData = JSON.parse(fs.readFileSync(targetPath, 'utf-8'));

    oldData.forEach(tdoll => {
      recordMap.set(tdoll.id, tdoll);
    });
  }

  data.forEach(tdoll => {
    recordMap.set(tdoll.id, tdoll);
  });

  const newData = [...recordMap.values()].sort((a, b) => +a.id - +b.id);


  fs.writeFileSync(targetPath, JSON.stringify(newData, null, 4), 'utf-8');
};

/**
 * @param browser {puppeteer.Browser}
  */
const captureTDollList = async (browser) => {
  console.log('CaptureTdollList started');
  const page = await browser.newPage();
  await page.setRequestInterception(true);

  let dollsData = [];

  try {
    page.on('request', (request) => {
      const resourceType = request.resourceType();
      if (resourceType !== 'document') {
        request.abort();
      } else {
        request.continue();
      }
    });

    await page.goto('https://www.gfwiki.org/w/%E6%88%98%E6%9C%AF%E4%BA%BA%E5%BD%A2%E5%9B%BE%E9%89%B4', {
      waitUntil: 'domcontentloaded',
      timeout: 3000
    });

    console.log('CaptureTdollList page loaded, start evaluating...');

    dollsData = await page.evaluate(() => {
      const dollsData = Array.from(document.querySelectorAll('.dolldata')).map((dom, index) => {
        const dataObj = {};

        for (const k in dom.dataset) {
          dataObj[k] = dom.dataset[k];
        }

        return dataObj;
      });
      return dollsData;
    });
    console.log('CaptureTdollList dollsData:', dollsData.length);

    // write to file
    writeTdollList2File(dollsData);
  } catch (e) {
    console.log('CaptureTdollList error', e);
  }

  await page.close();

  console.log('CaptureTdollList completed, total count:', dollsData.length);

  return dollsData;
}

exports.captureTDollList = captureTDollList;

/**
 * @param page {puppeteer.Page}
 * @param url {String}
 */
const captureSkinList = async (page, url) => {
  await page.goto(url);

  const skinList = await page.evaluate(() => {
    // Get skin id list
    const elements = Array.from(document.querySelectorAll('select.gf-droplist option'));
    // Get skin data script
    const script = document.querySelector('#dollPicContain ~ script');
    const skinImages = [];

    if (script) {
      const scriptStart = script.innerText.indexOf('var pic_data');
      const scriptEnd = script.innerText.indexOf('var homepic');

      if (scriptStart === -1 || scriptEnd === -1) {
        // 'No skin image found'
      } else {
        const scriptContent = script.innerText.slice(scriptStart, scriptEnd);
        let fnContent = scriptContent + 'return pic_data;';
        const picData = new Function(fnContent)();
        if (picData) {
          picData.forEach((v) => {
            skinImages.push({
              anime: v.anime,
              line: v.line,
              name: v.name,
              pic: v.pic,
              pic_d: v.pic_d,
              pic_d_h: v.pic_d_h,
              pic_h: v.pic_h,
            });
          });
        }
      }
    }

    const dataList = elements.map((v, index) => {
      const displayValue = index === 0 ? '0' : v.value;
      return {
        index,
        title: v.innerText,
        value: displayValue,
        image: skinImages[index] || null,
      };
    });

    return dataList;
  });

  return skinList;
};

exports.captureSkinList = captureSkinList;

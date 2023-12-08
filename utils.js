const path = require('path');
const fs = require('fs');

/**
 * @param data {Object}
 */
const writeSkinList2File = (data) => {
  let newData = {};
  const targetPath = path.join(__dirname, 'tdolls_skin_data.json');

  if (!fs.existsSync(targetPath)) {
    const oldData = JSON.parse(fs.readFileSync(targetPath, 'utf-8'));
    newData = {
      ...oldData
    };
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

  let dollsData = [];

  try {
    await page.goto('http://www.gfwiki.org/w/%E6%88%98%E6%9C%AF%E4%BA%BA%E5%BD%A2%E5%9B%BE%E9%89%B4', {
      waitUntil: 'networkidle2',
    });
    dollsData = await page.evaluate('window.DollsData');

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
    const elements = Array.from(document.querySelectorAll('select.gf-droplist option'));

    const dataList = elements.map((v, index) => {
      const displayValue = v.value === '{{BASEPAGENAME}}' ? '0' : v.value;
      return {
        index,
        title: v.innerText,
        value: displayValue
      };
    });

    return dataList;
  });

  console.log('url:', url, 'skinList', skinList);

  return skinList;
};

exports.captureSkinList = captureSkinList;

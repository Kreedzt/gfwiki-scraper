const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');


/**
 * @typedef {Object} TDollItem
 */

/**
 * @param browser {puppeteer.Browser}
 * @param url {String}
 */
const captureSkinList = async (browser, url) => {
  const page = await browser.newPage();

  await page.goto(url);

  const skinList = await page.evaluate(() => {
    const elements = Array.from(document.querySelectorAll('div.dollSkinBtn'));

    const dataList = elements.map(el => {
      return {
        index: el.attributes.getNamedItem('index').value,
        innerText: el.innerText
      };
    });

    return dataList;
  });

  console.log('url:', url, 'skinList', skinList);

  return skinList;
};

/**
 * @param browser {puppeteer.Browser}
  */
const captureTDollList = async (browser) => {
  const page = await browser.newPage();
  await page.goto('http://www.gfwiki.org/w/%E6%88%98%E6%9C%AF%E4%BA%BA%E5%BD%A2%E5%9B%BE%E9%89%B4', {
    waitUntil: 'networkidle2',
  });
  const dollsData = await page.evaluate('window.DollsData');

  const target = path.join(__dirname, 'tdolls_data.json');
  fs.writeFileSync(target, JSON.stringify(dollsData, null, 4), 'utf-8');

  console.log('TDollsData count:', dollsData.length);

  return dollsData;
}


/**
 * @param browser {puppeteer.Browser}
 * @param threads {Number}
 * @param dollsData {Array<TDollItem>}
 */
const runCaptureSkinTask = async (threads, dollsData) => {

};

(async () => {
  const browser = await puppeteer.launch({
    headless: "new"
  });

  const tdollList = await captureTDollList(browser);
  // await captureSkin(browser, 'http://www.gfwiki.org' + dollsData[0].url);

  await captureSkinList(browser, 'http://www.gfwiki.org/w/M4A1#MOD3');

  await browser.close();
})();

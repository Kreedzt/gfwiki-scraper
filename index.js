const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('http://www.gfwiki.org/w/%E6%88%98%E6%9C%AF%E4%BA%BA%E5%BD%A2%E5%9B%BE%E9%89%B4', {
    waitUntil: 'networkidle2',
  });
  const dollsData = await page.evaluate('window.DollsData');
  console.log(typeof dollsData);

  const target = path.join(__dirname, 'tdolls_data.json');
  fs.writeFileSync(target, JSON.stringify(dollsData, null, 4), 'utf-8');

  await browser.close();
})();
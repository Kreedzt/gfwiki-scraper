const path = require('path');
const fs = require('fs');

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
    const target = path.join(__dirname, 'tdolls_data.json');
    fs.writeFileSync(target, JSON.stringify(dollsData, null, 4), 'utf-8');
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
    // const elements = Array.from(document.querySelectorAll('div.dollSkinBtn'));
    const elements = Array.from(document.querySelectorAll('select.gf-droplist option'));

    // const dataList = elements.map(el => {
    //   return {
    //     index: el.attributes.getNamedItem('index').value,
    //     innerText: el.innerText
    //   };
    // });

    const dataList = elements.map((v, index) => {
      return {
        index,
        title: v.innerText,
        value: v.value
      };
    });

    return dataList;
  });

  console.log('url:', url, 'skinList', skinList);

  return skinList;
};

exports.captureSkinList = captureSkinList;

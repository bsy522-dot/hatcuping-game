const puppeteer = require('puppeteer');
const path = require('path');
(async () => {
  const browser = await puppeteer.launch({headless: 'new', args: ['--no-sandbox']});
  const page = await browser.newPage();
  await page.setViewport({width: 420, height: 750, deviceScaleFactor: 1});
  page.on('pageerror', err => console.log('ERROR:', err.message));

  await page.goto('file:///' + path.resolve('hatcuping-game.html').replace(/\\/g, '/'));
  await new Promise(r => setTimeout(r, 4000));
  await page.screenshot({path: 'new_plat_01_title.png'});
  console.log('1. Title');

  await page.mouse.click(210, 620);
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({path: 'new_plat_02_story1.png'});
  console.log('2. Story start');

  for (let i = 0; i < 8; i++) {
    await page.mouse.click(210, 700);
    await new Promise(r => setTimeout(r, 1000));
  }
  await page.screenshot({path: 'new_plat_03_story2.png'});
  console.log('3. Story mid');

  for (let i = 0; i < 20; i++) {
    await page.mouse.click(210, 700);
    await new Promise(r => setTimeout(r, 600));
  }
  await page.screenshot({path: 'new_plat_04_game.png'});
  const scr = await page.evaluate(() => typeof scr !== 'undefined' ? scr : 'unknown');
  console.log('4. Game screen:', scr);

  await browser.close();
  console.log('Done');
})();

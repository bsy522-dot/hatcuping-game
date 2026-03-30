const puppeteer = require('puppeteer');
const path = require('path');
(async () => {
  const browser = await puppeteer.launch({headless: 'new', args: ['--no-sandbox']});
  const page = await browser.newPage();
  await page.setViewport({width: 420, height: 750, deviceScaleFactor: 1});
  page.on('pageerror', err => console.log('ERROR:', err.message));
  await page.goto('file:///' + path.resolve('hatcuping-game.html').replace(/\\/g, '/'));
  await new Promise(r => setTimeout(r, 4000));

  await page.mouse.click(210, 655);
  await new Promise(r => setTimeout(r, 2000));
  const scr1 = await page.evaluate(() => scr);
  console.log('After start:', scr1);
  await page.screenshot({path: 'new2_01_story.png'});

  for (let i = 0; i < 5; i++) {
    await page.mouse.click(210, 600);
    await new Promise(r => setTimeout(r, 1500));
  }
  await page.screenshot({path: 'new2_02_storymid.png'});

  for (let i = 0; i < 25; i++) {
    await page.mouse.click(210, 600);
    await new Promise(r => setTimeout(r, 600));
  }
  const scr2 = await page.evaluate(() => scr);
  console.log('Screen:', scr2);
  await page.screenshot({path: 'new2_03_game.png'});

  if (scr2 !== 'title') {
    for (let i = 0; i < 15; i++) {
      await page.mouse.click(210, 600);
      await new Promise(r => setTimeout(r, 500));
    }
    const scr3 = await page.evaluate(() => scr);
    console.log('Screen:', scr3);
    await page.screenshot({path: 'new2_04_more.png'});
  }

  await browser.close();
  console.log('Done');
})();

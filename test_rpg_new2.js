const puppeteer = require('puppeteer');
const path = require('path');
(async () => {
  const browser = await puppeteer.launch({headless: 'new', args: ['--no-sandbox']});
  const page = await browser.newPage();
  await page.setViewport({width: 420, height: 750, deviceScaleFactor: 1});
  page.on('pageerror', err => console.log('ERROR:', err.message));

  await page.goto('file:///' + path.resolve('hatcuping-rpg.html').replace(/\\/g, '/'));
  await new Promise(r => setTimeout(r, 4000));
  await page.screenshot({path: 'newrpg_01_title.png'});
  console.log('1. Title');

  // Click center of screen where start button should be
  await page.mouse.click(210, 620);
  await new Promise(r => setTimeout(r, 2000));
  let scr = await page.evaluate(() => typeof scr!=='undefined'?scr:'?');
  console.log('2.', scr);
  await page.screenshot({path: 'newrpg_02.png'});

  // Advance
  for (let i = 0; i < 10; i++) {
    await page.mouse.click(210, 600);
    await new Promise(r => setTimeout(r, 800));
  }
  scr = await page.evaluate(() => scr);
  console.log('3.', scr);
  await page.screenshot({path: 'newrpg_03.png'});

  if (scr === 'map') {
    // Walk and screenshot
    await page.screenshot({path: 'newrpg_04_map.png'});
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press('ArrowDown');
      await new Promise(r => setTimeout(r, 350));
    }
    await page.screenshot({path: 'newrpg_05_walk.png'});
  } else {
    for (let i = 0; i < 20; i++) {
      await page.mouse.click(210, 600);
      await new Promise(r => setTimeout(r, 500));
    }
    scr = await page.evaluate(() => scr);
    console.log('4.', scr);
    await page.screenshot({path: 'newrpg_04.png'});
  }

  await browser.close();
  console.log('Done');
})();

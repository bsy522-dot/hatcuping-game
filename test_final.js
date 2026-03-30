const puppeteer = require('puppeteer');
const path = require('path');
(async () => {
  const browser = await puppeteer.launch({headless: 'new', args: ['--no-sandbox']});

  // RPG
  const p = await browser.newPage();
  await p.setViewport({width: 420, height: 750, deviceScaleFactor: 1});
  p.on('pageerror', err => console.log('RPG ERR:', err.message));
  await p.goto('file:///' + path.resolve('hatcuping-rpg.html').replace(/\\/g, '/'));
  await new Promise(r => setTimeout(r, 5000));
  await p.screenshot({path: 'FINAL_rpg_title.png'});
  console.log('RPG title');

  await p.mouse.click(210, 620);
  await new Promise(r => setTimeout(r, 2500));
  await p.screenshot({path: 'FINAL_rpg_story1.png'});
  console.log('RPG story1');

  for (let i = 0; i < 5; i++) {
    await p.mouse.click(210, 600);
    await new Promise(r => setTimeout(r, 1200));
  }
  await p.screenshot({path: 'FINAL_rpg_story2.png'});

  for (let i = 0; i < 10; i++) {
    await p.mouse.click(210, 600);
    await new Promise(r => setTimeout(r, 700));
  }
  let scr = await p.evaluate(() => scr);
  console.log('RPG:', scr);
  await p.screenshot({path: 'FINAL_rpg_map.png'});

  await browser.close();
  console.log('Done');
})();

const puppeteer = require('puppeteer');
const path = require('path');
(async () => {
  const browser = await puppeteer.launch({headless: 'new', args: ['--no-sandbox']});
  const page = await browser.newPage();
  await page.setViewport({width: 420, height: 750, deviceScaleFactor: 1});
  page.on('pageerror', err => console.log('ERROR:', err.message));

  await page.goto('file:///' + path.resolve('hatcuping-rpg.html').replace(/\\/g, '/'));
  await new Promise(r => setTimeout(r, 3000));

  // Start game
  await page.mouse.click(210, 600);
  await new Promise(r => setTimeout(r, 2000));

  // Advance all story
  for (let i = 0; i < 10; i++) {
    await page.mouse.click(210, 700);
    await new Promise(r => setTimeout(r, 800));
  }

  const scr = await page.evaluate(() => scr);
  console.log('Screen:', scr);

  if (scr === 'map') {
    await page.screenshot({path: 'ss_rpg_map_fixed.png'});
    console.log('Map screenshot taken');

    // Try keyboard movement
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('ArrowDown');
      await new Promise(r => setTimeout(r, 500));
    }
    await page.screenshot({path: 'ss_rpg_map_moved.png'});

    // Try interacting with NPC
    await page.keyboard.press('Space');
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({path: 'ss_rpg_map_interact.png'});
  }

  await browser.close();
  console.log('Done');
})();

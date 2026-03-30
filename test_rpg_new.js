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

  // Find and click start button
  const btns = await page.evaluate(() => btns);
  console.log('Buttons:', JSON.stringify(btns));

  // Click start
  if (btns && btns.length > 0) {
    const b = btns[0];
    await page.mouse.click(b.x + b.w/2, b.y + b.h/2);
  } else {
    await page.mouse.click(210, 620);
  }
  await new Promise(r => setTimeout(r, 2500));
  const scr1 = await page.evaluate(() => scr);
  console.log('2. After start:', scr1);
  await page.screenshot({path: 'newrpg_02_story.png'});

  // Advance story
  for (let i = 0; i < 8; i++) {
    await page.mouse.click(210, 600);
    await new Promise(r => setTimeout(r, 1200));
  }
  const scr2 = await page.evaluate(() => scr);
  console.log('3. Screen:', scr2);
  await page.screenshot({path: 'newrpg_03_mid.png'});

  // Keep advancing until map
  for (let i = 0; i < 15; i++) {
    await page.mouse.click(210, 600);
    await new Promise(r => setTimeout(r, 600));
    const s = await page.evaluate(() => scr);
    if (s === 'map') { console.log('Reached map at click ' + i); break; }
  }
  const scr3 = await page.evaluate(() => scr);
  console.log('4. Screen:', scr3);
  await page.screenshot({path: 'newrpg_04_map.png'});

  // If on map, walk around
  if (scr3 === 'map') {
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('ArrowDown');
      await new Promise(r => setTimeout(r, 400));
    }
    await page.screenshot({path: 'newrpg_05_map_walk.png'});

    // Try to trigger battle by walking in grass
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('ArrowRight');
      await new Promise(r => setTimeout(r, 300));
      const s = await page.evaluate(() => scr);
      if (s === 'battle') { console.log('Battle at step ' + i); break; }
    }
    const scr4 = await page.evaluate(() => scr);
    console.log('5. Screen:', scr4);
    await page.screenshot({path: 'newrpg_06_battle.png'});
  }

  await browser.close();
  console.log('Done');
})();

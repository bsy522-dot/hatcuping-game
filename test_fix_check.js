const puppeteer = require('puppeteer');
const path = require('path');
(async () => {
  const browser = await puppeteer.launch({headless: 'new', args: ['--no-sandbox']});
  const p = await browser.newPage();
  await p.setViewport({width: 420, height: 750, deviceScaleFactor: 1});
  p.on('pageerror', err => console.log('ERR:', err.message));
  await p.goto('file:///' + path.resolve('hatcuping-rpg.html').replace(/\\/g, '/'));
  await new Promise(r => setTimeout(r, 5000));

  // Start game
  await p.mouse.click(210, 595);
  await new Promise(r => setTimeout(r, 2000));
  // Advance story
  for (let i = 0; i < 10; i++) { await p.mouse.click(210, 500); await new Promise(r => setTimeout(r, 700)); }

  let scr = await p.evaluate(() => scr);
  if (scr === 'map') {
    await p.screenshot({path: 'FIX_map1.png'});
    console.log('Map screenshot taken');

    // Walk to king NPC and talk
    await p.keyboard.press('ArrowUp');
    await new Promise(r => setTimeout(r, 500));
    await p.keyboard.press('ArrowUp');
    await new Promise(r => setTimeout(r, 500));
    await p.keyboard.press('ArrowRight');
    await new Promise(r => setTimeout(r, 500));
    await p.keyboard.press('ArrowRight');
    await new Promise(r => setTimeout(r, 500));
    await p.screenshot({path: 'FIX_map2_walked.png'});
  }

  await browser.close();
  console.log('Done');
})();

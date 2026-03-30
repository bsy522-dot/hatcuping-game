const puppeteer = require('puppeteer');
const path = require('path');
(async () => {
  const browser = await puppeteer.launch({headless: 'new', args: ['--no-sandbox']});
  const p = await browser.newPage();
  await p.setViewport({width: 420, height: 750, deviceScaleFactor: 1});
  p.on('pageerror', err => console.log('ERR:', err.message));
  await p.goto('file:///' + path.resolve('hatcuping-game.html').replace(/\\/g, '/'));
  await new Promise(r => setTimeout(r, 5000));
  await p.screenshot({path: 'V3_plat_01_title.png'});
  console.log('1 title');

  // Try multiple y positions for start button
  for (let y = 580; y <= 700; y += 20) {
    await p.mouse.click(210, y);
    await new Promise(r => setTimeout(r, 500));
    const s = await p.evaluate(() => scr);
    if (s !== 'title') { console.log('Started at y=' + y + ' scr=' + s); break; }
  }
  await new Promise(r => setTimeout(r, 2000));
  await p.screenshot({path: 'V3_plat_02_story_castle.png'});

  for (let i = 0; i < 4; i++) { await p.mouse.click(210, 500); await new Promise(r => setTimeout(r, 1500)); }
  await p.screenshot({path: 'V3_plat_03_story_maid.png'});

  for (let i = 0; i < 6; i++) { await p.mouse.click(210, 500); await new Promise(r => setTimeout(r, 1000)); }
  await p.screenshot({path: 'V3_plat_04_festival.png'});

  for (let i = 0; i < 8; i++) { await p.mouse.click(210, 500); await new Promise(r => setTimeout(r, 800)); }
  await p.screenshot({path: 'V3_plat_05_next.png'});
  let scr = await p.evaluate(() => scr);
  console.log('5', scr);

  for (let i = 0; i < 15; i++) { await p.mouse.click(210, 500); await new Promise(r => setTimeout(r, 600)); }
  scr = await p.evaluate(() => scr);
  console.log('6', scr);
  await p.screenshot({path: 'V3_plat_06_game.png'});

  await browser.close();
  console.log('Done');
})();

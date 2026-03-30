const puppeteer = require('puppeteer');
const path = require('path');
(async () => {
  const browser = await puppeteer.launch({headless: 'new', args: ['--no-sandbox']});
  const p = await browser.newPage();
  await p.setViewport({width: 420, height: 750, deviceScaleFactor: 1});
  p.on('pageerror', err => console.log('ERR:', err.message));
  await p.goto('file:///' + path.resolve('hatcuping-rpg.html').replace(/\\/g, '/'));
  await new Promise(r => setTimeout(r, 5000));
  await p.screenshot({path: 'V3_rpg_01_title.png'});
  console.log('1 title');

  // Click start
  await p.mouse.click(210, 640);
  await new Promise(r => setTimeout(r, 2500));
  let scr = await p.evaluate(() => typeof scr!=='undefined'?scr:'?');
  if (scr === 'title') { await p.mouse.click(210, 620); await new Promise(r => setTimeout(r, 2000)); scr = await p.evaluate(() => scr); }
  if (scr === 'title') { await p.mouse.click(210, 600); await new Promise(r => setTimeout(r, 2000)); scr = await p.evaluate(() => scr); }
  console.log('2', scr);
  await p.screenshot({path: 'V3_rpg_02_story1.png'});

  // Advance to see different story scenes
  for (let i = 0; i < 3; i++) { await p.mouse.click(210, 500); await new Promise(r => setTimeout(r, 1500)); }
  await p.screenshot({path: 'V3_rpg_03_story2.png'});

  for (let i = 0; i < 5; i++) { await p.mouse.click(210, 500); await new Promise(r => setTimeout(r, 1000)); }
  await p.screenshot({path: 'V3_rpg_04_story3.png'});

  for (let i = 0; i < 10; i++) { await p.mouse.click(210, 500); await new Promise(r => setTimeout(r, 700)); }
  scr = await p.evaluate(() => scr);
  console.log('3', scr);
  await p.screenshot({path: 'V3_rpg_05_map.png'});

  if (scr === 'map') {
    for (let i = 0; i < 5; i++) { await p.keyboard.press('ArrowDown'); await new Promise(r => setTimeout(r, 400)); }
    await p.screenshot({path: 'V3_rpg_06_walk.png'});
  }

  await browser.close();
  console.log('Done');
})();

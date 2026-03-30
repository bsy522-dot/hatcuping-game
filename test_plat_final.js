const puppeteer = require('puppeteer');
const path = require('path');
(async () => {
  const browser = await puppeteer.launch({headless: 'new', args: ['--no-sandbox']});
  const p = await browser.newPage();
  await p.setViewport({width: 420, height: 750, deviceScaleFactor: 1});
  p.on('pageerror', err => console.log('ERR:', err.message));
  await p.goto('file:///' + path.resolve('hatcuping-game.html').replace(/\\/g, '/'));
  await new Promise(r => setTimeout(r, 5000));
  await p.screenshot({path: 'FINAL_plat_title.png'});
  console.log('1 title');

  // Find start button
  const btnY = await p.evaluate(() => { const b = btns && btns[0]; return b ? b.y + b.h/2 : 655; });
  await p.mouse.click(210, btnY);
  await new Promise(r => setTimeout(r, 2500));
  await p.screenshot({path: 'FINAL_plat_story1.png'});
  console.log('2 story1');

  for (let i = 0; i < 5; i++) { await p.mouse.click(210, 600); await new Promise(r => setTimeout(r, 1200)); }
  await p.screenshot({path: 'FINAL_plat_story2.png'});
  console.log('3 story2');

  for (let i = 0; i < 8; i++) { await p.mouse.click(210, 600); await new Promise(r => setTimeout(r, 800)); }
  await p.screenshot({path: 'FINAL_plat_story3.png'});
  let scr = await p.evaluate(() => scr);
  console.log('4', scr);

  for (let i = 0; i < 15; i++) { await p.mouse.click(210, 600); await new Promise(r => setTimeout(r, 600)); }
  scr = await p.evaluate(() => scr);
  await p.screenshot({path: 'FINAL_plat_game.png'});
  console.log('5', scr);

  await browser.close();
  console.log('Done');
})();

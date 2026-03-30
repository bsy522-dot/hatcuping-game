const puppeteer = require('puppeteer');
const path = require('path');
async function delay(ms) { return new Promise(r => setTimeout(r, ms)); }
(async () => {
  const browser = await puppeteer.launch({headless: 'new', args: ['--no-sandbox']});
  const p = await browser.newPage();
  await p.setViewport({width: 420, height: 750, deviceScaleFactor: 1});
  p.on('pageerror', err => console.log('ERR:', err.message));
  await p.goto('file:///' + path.resolve('hatcuping-game.html').replace(/\\/g, '/'));
  await delay(5000);

  // Start and advance to dodge game
  for (let y = 580; y <= 700; y += 15) {
    await p.mouse.click(210, y);
    await delay(300);
    const s = await p.evaluate(() => scr);
    if (s !== 'title') break;
  }
  await delay(2000);

  // Advance story to festival/dodge
  for (let i = 0; i < 20; i++) {
    await p.mouse.click(210, 500);
    await delay(700);
    const s = await p.evaluate(() => scr);
    if (s === 'dodge') { console.log('Dodge at click ' + i); break; }
  }

  await delay(1000);
  await p.screenshot({path: 'CLEAN_dodge.png'});
  console.log('Dodge screenshot');

  // Also get castle story scene
  await browser.close();
  console.log('Done');
})();

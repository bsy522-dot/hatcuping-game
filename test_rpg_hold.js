const puppeteer = require('puppeteer');
const path = require('path');
async function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const browser = await puppeteer.launch({headless: 'new', args: ['--no-sandbox']});
  const p = await browser.newPage();
  await p.setViewport({width: 420, height: 750, deviceScaleFactor: 1});
  p.on('pageerror', err => console.log('ERR:', err.message));
  await p.goto('file:///' + path.resolve('hatcuping-rpg.html').replace(/\\/g, '/'));
  await delay(5000);

  // Start
  await p.mouse.click(210, 595);
  await delay(2000);
  for (let i = 0; i < 15; i++) { await p.mouse.click(210, 500); await delay(500); }

  let s = await p.evaluate(() => ({scr,curMap,px:P.x,py:P.y,ch:storyFlags.ch}));
  console.log('Start:', JSON.stringify(s));

  // Use keyboard.down/up to hold keys properly
  async function holdKey(key, ms) {
    await p.keyboard.down(key);
    await delay(ms);
    await p.keyboard.up(key);
    await delay(200); // wait for animation to complete
  }

  // Walk to King (4,2) - from (2,3)
  await holdKey('ArrowRight', 300); await delay(300);
  await holdKey('ArrowRight', 300); await delay(300);
  await holdKey('ArrowUp', 300); await delay(300);

  // Interact with king
  await p.keyboard.press('Space');
  await delay(1000);
  // Advance dialog
  for (let i = 0; i < 5; i++) { await p.keyboard.press('Space'); await delay(400); }

  s = await p.evaluate(() => ({scr,curMap,px:P.x,py:P.y,ch:storyFlags.ch}));
  console.log('After king:', JSON.stringify(s));

  // Walk down to door (4,6) - from current position
  for (let i = 0; i < 6; i++) {
    await holdKey('ArrowDown', 300);
    await delay(300);
    s = await p.evaluate(() => ({px:P.x,py:P.y,curMap}));
    console.log('Walk step ' + i + ':', JSON.stringify(s));
  }

  s = await p.evaluate(() => ({scr,curMap,px:P.x,py:P.y,ch:storyFlags.ch,party:party.length}));
  console.log('Final:', JSON.stringify(s));
  await p.screenshot({path: 'HOLD_result.png'});

  await browser.close();
  console.log('Done');
})();

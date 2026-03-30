const puppeteer = require('puppeteer');
const path = require('path');
(async () => {
  const browser = await puppeteer.launch({headless: 'new', args: ['--no-sandbox']});

  // RPG - step by step
  const p = await browser.newPage();
  await p.setViewport({width: 420, height: 750, deviceScaleFactor: 1});
  p.on('pageerror', err => console.log('RPG ERR:', err.message));
  await p.goto('file:///' + path.resolve('hatcuping-rpg.html').replace(/\\/g, '/'));
  await new Promise(r => setTimeout(r, 5000));

  // Start
  for (let y = 580; y <= 700; y += 15) {
    await p.mouse.click(210, y);
    await new Promise(r => setTimeout(r, 300));
    const s = await p.evaluate(() => scr);
    if (s !== 'title') { console.log('RPG started at y=' + y); break; }
  }
  await new Promise(r => setTimeout(r, 2000));

  // Advance through ALL story to reach map
  for (let i = 0; i < 30; i++) {
    await p.mouse.click(210, 500);
    await new Promise(r => setTimeout(r, 800));
    const s = await p.evaluate(() => scr);
    if (s === 'map') { console.log('RPG reached map at click ' + i); break; }
  }

  const scr = await p.evaluate(() => scr);
  if (scr === 'map') {
    await p.screenshot({path: 'CHECK_rpg_map1.png'});

    // Walk around the map
    for (let i = 0; i < 3; i++) { await p.keyboard.press('ArrowRight'); await new Promise(r => setTimeout(r, 400)); }
    await p.screenshot({path: 'CHECK_rpg_map2.png'});

    // Talk to NPC
    await p.keyboard.press('ArrowUp');
    await new Promise(r => setTimeout(r, 400));
    await p.keyboard.press('Space');
    await new Promise(r => setTimeout(r, 1500));
    await p.screenshot({path: 'CHECK_rpg_npc.png'});

    // Advance NPC dialog and move to door
    for (let i = 0; i < 5; i++) { await p.keyboard.press('Space'); await new Promise(r => setTimeout(r, 500)); }
    for (let i = 0; i < 5; i++) { await p.keyboard.press('ArrowDown'); await new Promise(r => setTimeout(r, 400)); }
    for (let i = 0; i < 3; i++) { await p.keyboard.press('ArrowRight'); await new Promise(r => setTimeout(r, 400)); }
    await p.keyboard.press('Space'); // try door
    await new Promise(r => setTimeout(r, 1000));
    await p.screenshot({path: 'CHECK_rpg_door.png'});

    // Check current map
    const mapInfo = await p.evaluate(() => ({curMap, px: P.x, py: P.y, partyLen: party.length}));
    console.log('Map info:', JSON.stringify(mapInfo));
  }

  await browser.close();
  console.log('Done');
})();

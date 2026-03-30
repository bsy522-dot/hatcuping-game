const puppeteer = require('puppeteer');
const path = require('path');
(async () => {
  const browser = await puppeteer.launch({headless: 'new', args: ['--no-sandbox']});

  // ===== PLATFORMER FULL FLOW =====
  const p1 = await browser.newPage();
  await p1.setViewport({width: 420, height: 750, deviceScaleFactor: 1});
  await p1.goto('file:///' + path.resolve('hatcuping-game.html').replace(/\\/g, '/'));
  await new Promise(r => setTimeout(r, 3000));
  await p1.screenshot({path: 'final_plat_01_title.png'});

  await p1.mouse.click(210, 620); // start
  await new Promise(r => setTimeout(r, 2000));
  await p1.screenshot({path: 'final_plat_02_story1.png'});

  // Advance story
  for (let i = 0; i < 8; i++) {
    await p1.mouse.click(210, 700);
    await new Promise(r => setTimeout(r, 1200));
  }
  await p1.screenshot({path: 'final_plat_03_story2.png'});

  for (let i = 0; i < 15; i++) {
    await p1.mouse.click(210, 700);
    await new Promise(r => setTimeout(r, 800));
  }
  await p1.screenshot({path: 'final_plat_04_game.png'});

  const platScr = await p1.evaluate(() => scr);
  console.log('Plat screen:', platScr);

  // ===== RPG FULL FLOW =====
  const p2 = await browser.newPage();
  await p2.setViewport({width: 420, height: 750, deviceScaleFactor: 1});
  p2.on('pageerror', err => console.log('RPG ERROR:', err.message));
  await p2.goto('file:///' + path.resolve('hatcuping-rpg.html').replace(/\\/g, '/'));
  await new Promise(r => setTimeout(r, 3000));
  await p2.screenshot({path: 'final_rpg_01_title.png'});

  await p2.mouse.click(210, 600); // start
  await new Promise(r => setTimeout(r, 2000));
  await p2.screenshot({path: 'final_rpg_02_story1.png'});

  // Advance story
  for (let i = 0; i < 5; i++) {
    await p2.mouse.click(210, 700);
    await new Promise(r => setTimeout(r, 1500));
  }
  await p2.screenshot({path: 'final_rpg_03_story2.png'});

  const rpgScr = await p2.evaluate(() => scr);
  console.log('RPG screen:', rpgScr);

  // If we're on map, take map screenshot
  if (rpgScr === 'map') {
    await p2.screenshot({path: 'final_rpg_04_map.png'});
    // Try moving right a few times
    for (let i = 0; i < 5; i++) {
      await p2.keyboard.press('ArrowRight');
      await new Promise(r => setTimeout(r, 300));
    }
    await p2.screenshot({path: 'final_rpg_05_map_moved.png'});
  } else {
    // Keep advancing
    for (let i = 0; i < 10; i++) {
      await p2.mouse.click(210, 700);
      await new Promise(r => setTimeout(r, 1000));
    }
    await p2.screenshot({path: 'final_rpg_04_after_more.png'});
    const rpgScr2 = await p2.evaluate(() => scr);
    console.log('RPG screen after more:', rpgScr2);
  }

  await browser.close();
  console.log('All done!');
})();

const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({headless: 'new', args: ['--no-sandbox']});

  // ===== RPG DEEP TEST =====
  const page = await browser.newPage();
  await page.setViewport({width: 420, height: 750, deviceScaleFactor: 2});
  const rpgPath = 'file:///' + path.resolve('hatcuping-rpg.html').replace(/\\/g, '/');

  // Listen for console errors
  page.on('console', msg => {
    if (msg.type() === 'error' || msg.type() === 'warn') {
      console.log('CONSOLE ' + msg.type() + ':', msg.text());
    }
  });
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  await page.goto(rpgPath);
  await new Promise(r => setTimeout(r, 4000));
  await page.screenshot({path: 'ss_rpg_deep_1.png'});
  console.log('1. RPG loaded');

  // Try clicking the start button area (center bottom)
  await page.mouse.click(210, 950); // "모험 시작!" button
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({path: 'ss_rpg_deep_2.png'});
  console.log('2. After clicking 모험 시작 at 210,950');

  // Try canvas click at different positions
  await page.mouse.click(210, 1000);
  await new Promise(r => setTimeout(r, 1000));
  await page.mouse.click(210, 1050);
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({path: 'ss_rpg_deep_3.png'});
  console.log('3. After more clicks');

  // Try touch events instead
  await page.touchscreen.tap(210, 950);
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({path: 'ss_rpg_deep_4.png'});
  console.log('4. After touch tap');

  // Check what scr variable is
  const scr = await page.evaluate(() => {
    return {
      scr: typeof scr !== 'undefined' ? scr : 'undefined',
      W: typeof W !== 'undefined' ? W : 'undefined',
      H: typeof H !== 'undefined' ? H : 'undefined',
      canvasW: document.getElementById('c') ? document.getElementById('c').width : 'no canvas',
      canvasH: document.getElementById('c') ? document.getElementById('c').height : 'no canvas',
      canvasCssW: document.getElementById('c') ? document.getElementById('c').style.width : 'no',
      canvasCssH: document.getElementById('c') ? document.getElementById('c').style.height : 'no',
    };
  });
  console.log('Game state:', JSON.stringify(scr));

  // ===== PLATFORMER DEEPER TEST =====
  const page2 = await browser.newPage();
  await page2.setViewport({width: 420, height: 750, deviceScaleFactor: 2});
  const platPath = 'file:///' + path.resolve('hatcuping-game.html').replace(/\\/g, '/');

  page2.on('console', msg => {
    if (msg.type() === 'error') console.log('PLAT CONSOLE:', msg.text());
  });
  page2.on('pageerror', err => console.log('PLAT ERROR:', err.message));

  await page2.goto(platPath);
  await new Promise(r => setTimeout(r, 3000));

  // Click start
  await page2.mouse.click(210, 620);
  await new Promise(r => setTimeout(r, 2000));

  // Advance story many times to reach gameplay
  for (let i = 0; i < 20; i++) {
    await page2.mouse.click(210, 400);
    await new Promise(r => setTimeout(r, 800));
  }
  await page2.screenshot({path: 'ss_plat_deep_gameplay.png'});
  console.log('5. Platformer after 20 story clicks');

  // Check game state
  const platState = await page2.evaluate(() => {
    return {
      scr: typeof scr !== 'undefined' ? scr : 'undefined',
      lvl: typeof lvl !== 'undefined' ? lvl : 'undefined',
    };
  });
  console.log('Plat state:', JSON.stringify(platState));

  await browser.close();
  console.log('Done!');
})();

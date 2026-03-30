const puppeteer = require('puppeteer');
const path = require('path');
(async () => {
  const browser = await puppeteer.launch({headless: 'new', args: ['--no-sandbox']});
  const page = await browser.newPage();
  await page.setViewport({width: 420, height: 750, deviceScaleFactor: 1});
  const rpgPath = 'file:///' + path.resolve('hatcuping-rpg.html').replace(/\\/g, '/');
  page.on('pageerror', err => console.log('ERROR:', err.message));
  page.on('console', msg => { if(msg.type()==='error') console.log('CONSOLE:', msg.text()); });
  await page.goto(rpgPath);
  await new Promise(r => setTimeout(r, 4000));

  // Check canvas
  const info = await page.evaluate(() => {
    const c = document.getElementById('c');
    const r = c.getBoundingClientRect();
    return {rect: {left: r.left, top: r.top, width: r.width, height: r.height}, scr: scr, btnsLen: typeof btns !== 'undefined' ? btns.length : -1};
  });
  console.log('Canvas rect:', JSON.stringify(info));

  // Click start button at game coords (210, 600)
  const cx = info.rect.left + (210 / 420) * info.rect.width;
  const cy = info.rect.top + (600 / 750) * info.rect.height;
  console.log('Clicking screen coords:', cx, cy);
  await page.mouse.click(cx, cy);
  await new Promise(r => setTimeout(r, 2000));

  const state1 = await page.evaluate(() => ({scr: scr, btns: JSON.stringify(btns)}));
  console.log('After click:', state1.scr);
  await page.screenshot({path: 'ss_rpg_clicktest.png'});

  if (state1.scr === 'title') {
    // Button might not be at expected y - let's check btns
    console.log('Btns:', state1.btns);
    // Try clicking lower
    for (let y = 400; y < 750; y += 25) {
      await page.mouse.click(210, y);
      await new Promise(r => setTimeout(r, 300));
      const s = await page.evaluate(() => scr);
      if (s !== 'title') {
        console.log('FOUND! Clicked y=' + y + ', scr=' + s);
        break;
      }
    }
  }

  const finalState = await page.evaluate(() => scr);
  console.log('Final scr:', finalState);
  await page.screenshot({path: 'ss_rpg_final.png'});

  await browser.close();
  console.log('Done');
})();

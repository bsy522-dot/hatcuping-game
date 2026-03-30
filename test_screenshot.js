const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({headless: 'new', args: ['--no-sandbox']});

  // Screenshot platformer
  const page1 = await browser.newPage();
  await page1.setViewport({width: 420, height: 750, deviceScaleFactor: 2});
  const platPath = 'file:///' + path.resolve('hatcuping-game.html').replace(/\\/g, '/');
  await page1.goto(platPath);
  await new Promise(r => setTimeout(r, 3000));
  await page1.screenshot({path: 'ss_plat_1_title.png'});
  console.log('1. Platformer title');

  // Click start
  await page1.mouse.click(210, 620);
  await new Promise(r => setTimeout(r, 2000));
  await page1.screenshot({path: 'ss_plat_2_start.png'});
  console.log('2. Platformer after start click');

  // Click again for story
  await page1.mouse.click(210, 400);
  await new Promise(r => setTimeout(r, 2000));
  await page1.screenshot({path: 'ss_plat_3_story.png'});
  console.log('3. Platformer story');

  // Click more to advance
  for (let i = 0; i < 5; i++) {
    await page1.mouse.click(210, 400);
    await new Promise(r => setTimeout(r, 1500));
  }
  await page1.screenshot({path: 'ss_plat_4_game.png'});
  console.log('4. Platformer gameplay');

  // Screenshot RPG
  const page2 = await browser.newPage();
  await page2.setViewport({width: 420, height: 750, deviceScaleFactor: 2});
  const rpgPath = 'file:///' + path.resolve('hatcuping-rpg.html').replace(/\\/g, '/');
  await page2.goto(rpgPath);
  await new Promise(r => setTimeout(r, 3000));
  await page2.screenshot({path: 'ss_rpg_1_title.png'});
  console.log('5. RPG title');

  // Click start
  await page2.mouse.click(210, 500);
  await new Promise(r => setTimeout(r, 2000));
  await page2.screenshot({path: 'ss_rpg_2_start.png'});
  console.log('6. RPG after start click');

  // Click to advance story
  await page2.mouse.click(210, 400);
  await new Promise(r => setTimeout(r, 2000));
  await page2.screenshot({path: 'ss_rpg_3_story.png'});
  console.log('7. RPG story');

  for (let i = 0; i < 5; i++) {
    await page2.mouse.click(210, 400);
    await new Promise(r => setTimeout(r, 1500));
  }
  await page2.screenshot({path: 'ss_rpg_4_game.png'});
  console.log('8. RPG gameplay');

  await browser.close();
  console.log('All screenshots done!');
})();

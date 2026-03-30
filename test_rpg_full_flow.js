const puppeteer = require('puppeteer');
const path = require('path');

async function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

async function walk(p, dir, steps) {
  for (let i = 0; i < steps; i++) {
    await p.keyboard.press('Arrow' + dir);
    await delay(350);
  }
}

async function getState(p) {
  return await p.evaluate(() => ({
    scr, curMap: typeof curMap!=='undefined'?curMap:'?',
    px: P.x, py: P.y,
    ch: storyFlags.ch,
    party: party.length,
    dlg: dlg ? dlg.name : null
  }));
}

(async () => {
  const browser = await puppeteer.launch({headless: 'new', args: ['--no-sandbox']});
  const p = await browser.newPage();
  await p.setViewport({width: 420, height: 750, deviceScaleFactor: 1});
  p.on('pageerror', err => console.log('ERR:', err.message));
  await p.goto('file:///' + path.resolve('hatcuping-rpg.html').replace(/\\/g, '/'));
  await delay(5000);

  // START GAME
  await p.mouse.click(210, 595);
  await delay(2000);
  // Advance opening story
  for (let i = 0; i < 15; i++) { await p.mouse.click(210, 500); await delay(600); }

  let state = await getState(p);
  console.log('After story:', JSON.stringify(state));

  if (state.scr !== 'map') {
    for (let i = 0; i < 10; i++) { await p.mouse.click(210, 500); await delay(500); }
    state = await getState(p);
    console.log('More clicks:', JSON.stringify(state));
  }

  if (state.scr === 'map') {
    console.log('\n=== ON MAP: ' + state.curMap + ' ch=' + state.ch + ' ===');

    // Step 1: Talk to King (ch0 NPC at 4,2)
    console.log('\nStep1: Walk to King at (4,2)');
    await walk(p, 'Up', 1);
    await walk(p, 'Right', 2);
    state = await getState(p);
    console.log('Position:', state.px, state.py);

    // Face up toward king and interact
    await p.keyboard.press('ArrowUp');
    await delay(200);
    await p.keyboard.press('Space');
    await delay(1000);
    state = await getState(p);
    console.log('After interact:', JSON.stringify(state));

    // Advance dialog
    for (let i = 0; i < 10; i++) { await p.keyboard.press('Space'); await delay(400); }
    state = await getState(p);
    console.log('After king dialog:', JSON.stringify(state));

    // Step 2: Walk to door at (4,6)
    console.log('\nStep2: Walk to door at (4,6)');
    await walk(p, 'Down', 4);
    state = await getState(p);
    console.log('Position:', state.px, state.py, 'ch:', state.ch);

    // Try to warp by stepping on door
    await p.keyboard.press('Space');
    await delay(500);
    state = await getState(p);
    console.log('After door interact:', JSON.stringify(state));

    // If still castle_room, try walking onto the door tile
    if (state.curMap === 'castle_room') {
      await walk(p, 'Down', 1);
      await delay(500);
      state = await getState(p);
      console.log('After walking down more:', JSON.stringify(state));
    }

    await p.screenshot({path: 'FLOW_step2.png'});

    // If we reached festival
    if (state.curMap === 'festival') {
      console.log('\n=== FESTIVAL MAP ===');
      await p.screenshot({path: 'FLOW_festival.png'});
    }
  }

  await browser.close();
  console.log('\nDone');
})();

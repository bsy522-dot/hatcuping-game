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

  async function holdKey(key, ms) { await p.keyboard.down(key); await delay(ms); await p.keyboard.up(key); await delay(250); }
  async function talk() { for(let i=0;i<8;i++){await p.keyboard.press('Space');await delay(400)} }
  async function state() { return await p.evaluate(()=>({scr,curMap,px:P.x,py:P.y,ch:storyFlags.ch,party:party.length,dlg:dlg?dlg.name:null})); }
  async function ss(name) { await p.screenshot({path:'PLAY_'+name+'.png'}); console.log('📸 '+name); }

  // START
  await p.mouse.click(210, 595); await delay(2000);
  for(let i=0;i<15;i++){await p.mouse.click(210,500);await delay(500)}
  let s = await state();
  console.log('1. Map:', JSON.stringify(s));

  // === CASTLE_ROOM (ch0) ===
  // Talk to king at (4,2)
  await holdKey('ArrowRight',300); await delay(200);
  await holdKey('ArrowRight',300); await delay(200);
  await holdKey('ArrowUp',300); await delay(200);
  await p.keyboard.press('Space'); await delay(500);
  await talk();
  s = await state(); console.log('2. After king:', s.ch, s.curMap);

  // Walk to door at (4,6)
  for(let i=0;i<5;i++){await holdKey('ArrowDown',300);await delay(200)}
  s = await state(); console.log('3. Position:', s.px, s.py, 'Map:', s.curMap);
  await ss('castle_to_festival');

  // === FESTIVAL (ch1) ===
  if(s.curMap==='festival'){
    console.log('\n=== FESTIVAL ===');
    await ss('festival');
    // Find 집사 NPC (ch1) at (5,7) - walk down
    for(let i=0;i<6;i++){await holdKey('ArrowDown',300);await delay(200)}
    s = await state(); console.log('4. Festival pos:', s.px, s.py);
    // interact
    await p.keyboard.press('Space'); await delay(500);
    await talk();
    s = await state(); console.log('5. After 집사:', s.ch);

    // Go to library - warp at (8,8)
    for(let i=0;i<3;i++){await holdKey('ArrowRight',300);await delay(200)}
    for(let i=0;i<3;i++){await holdKey('ArrowDown',300);await delay(200)}
    s = await state(); console.log('6. Heading library:', s.px, s.py, s.curMap);
  }

  // === LIBRARY (ch2) ===
  if(s.curMap==='library'){
    console.log('\n=== LIBRARY ===');
    await ss('library');
    // Find 낡은 책 (ch2) at (4,3)
    for(let i=0;i<3;i++){await holdKey('ArrowDown',300);await delay(200)}
    await holdKey('ArrowRight',300);await delay(200);
    await p.keyboard.press('Space'); await delay(500);
    await talk();
    s = await state(); console.log('7. After book:', s.ch);

    // Go back to festival via warp (3,1)
    await holdKey('ArrowUp',300);await delay(200);
    await holdKey('ArrowUp',300);await delay(200);
    await holdKey('ArrowLeft',300);await delay(200);
    s = await state(); console.log('8.', s.curMap, s.px, s.py);
  }

  // Continue until we reach castle_exit or further
  s = await state();
  console.log('\nCurrent state:', JSON.stringify(s));
  await ss('final_state');

  await browser.close();
  console.log('\nDone');
})();

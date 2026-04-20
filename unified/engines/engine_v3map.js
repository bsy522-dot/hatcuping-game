// ============================================================
// UNIFIED v4 - V3 MAP ENGINE (rpg-v3/index.html에서 이식)
// 격자 기반 2D 탐색 맵 + 워프 + NPC + 인카운터 + 터치패드.
// API:
//   V3Map.start(mapId, opts)
//     opts: { startX, startY, encounterRate, onEncounter, onInteractNPC, onWarpOut }
//   V3Map.update()
//   V3Map.render(ctx,W,H)
//   V3Map.handleInput(x,y,kind)   // kind: 'down'|'up'|'key'
//   V3Map.stop()
//
// 맵 데이터 형식: rpg-v3/data/maps.js의 MAPS 객체 (window.MAPS)
//   + unified가 추가로 등록하는 맵도 window.MAPS에 주입
// ============================================================
(function(){
  'use strict';

  const T = 40;   // 타일 크기
  const MOVE_DELAY = 10;

  const S = {
    active: false,
    mapId: null,
    pos: { x:7, y:10 },
    moveT: 0,
    tU:false, tD:false, tL:false, tR:false,
    frameT: 0,
    tileCanvas: null,
    opts: null,
    pressedDir: null   // 터치패드 누른 방향 유지용
  };

  const WALK = {0:1, 1:1, 5:1, 6:1, 7:1, 8:1, 9:1, 10:1, 11:1, 12:1};

  // ===== 타일 생성 (rpg-v3 그대로) =====
  function genTiles(){
    if(S.tileCanvas) return;
    S.tileCanvas = {};
    const rng = (a,b) => Math.floor(Math.random()*(b-a+1))+a;
    const defs = [
      [0,'#6EB844', c=>{ c.fillStyle='#78C34E'; for(let i=0;i<5;i++){ c.beginPath(); c.arc(rng(4,T-4), rng(4,T-4), rng(1,3), 0, Math.PI*2); c.fill(); } }],
      [1,'#C9A96E', null],
      [2,'#6EB844', c=>{ c.fillStyle='#5D4037'; c.fillRect(T/2-3,T/2,6,T/2); c.fillStyle='#2E7D32'; c.beginPath(); c.arc(T/2,T/2-2,12,0,Math.PI*2); c.fill(); }],
      [3,'#888',    c=>{ c.fillStyle='#777'; c.fillRect(0,0,T,T); }],
      [4,'#2196F3', c=>{ c.fillStyle='rgba(255,255,255,0.15)'; c.beginPath(); c.arc(T/3,T/3,4,0,Math.PI*2); c.fill(); }],
      [5,'#6EB844', c=>{ const fc=['#FF69B4','#FFD700','#FF6347','#BA68C8']; for(let i=0;i<4;i++){ c.fillStyle=fc[i%4]; c.beginPath(); c.arc(8+rng(0,24), 8+rng(0,24), rng(2,3), 0, Math.PI*2); c.fill(); } }],
      [6,'#2a1540', null],
      [7,'#1a0a2e', c=>{ c.fillStyle='#150830'; c.fillRect(0,0,T,T); }],
      [8,'#C8B6E2', null],
      [9,'#9988AA', null],
      [10,'#8B6914',c=>{ c.fillStyle='#FFD700'; c.beginPath(); c.arc(T/2,T/2,8,0,Math.PI*2); c.fill(); }],
      [11,'#E1D5FF',c=>{
        // 포털
        c.fillStyle='#5D2C7A';
        c.beginPath();
        c.moveTo(8, T-4); c.lineTo(8, 16);
        c.arc(T/2, 16, T/2-8, Math.PI, 0, false);
        c.lineTo(T-8, T-4); c.closePath(); c.fill();
        const g=c.createLinearGradient(0,10,0,T);
        g.addColorStop(0,'#FFD54F'); g.addColorStop(1,'#FF6B9D');
        c.fillStyle=g;
        c.beginPath();
        c.moveTo(12, T-6); c.lineTo(12, 18);
        c.arc(T/2, 18, T/2-12, Math.PI, 0, false);
        c.lineTo(T-12, T-6); c.closePath(); c.fill();
        c.fillStyle='#fff';
        c.font='bold 18px sans-serif';
        c.textAlign='center'; c.textBaseline='middle';
        c.fillText('↑', T/2, T/2+4);
      }],
      [12,'#6EB844', c=>{ c.fillStyle='#5A9E3A'; for(let i=0;i<6;i++){ const x=rng(2,T-6); c.fillRect(x, T-rng(12,22), 2, rng(12,22)); } }]
    ];
    defs.forEach(([id, bg, fn]) => {
      const cv = document.createElement('canvas');
      cv.width = T; cv.height = T;
      const c = cv.getContext('2d');
      c.fillStyle = bg; c.fillRect(0,0,T,T);
      if(fn) fn(c);
      S.tileCanvas[id] = cv;
    });
  }

  // ===== 맵 조회 (unified 맵 → rpg-v3 MAPS 순으로) =====
  function getMap(id){
    const U = window.UNIFIED_MAPS || {};
    if(U[id]) return U[id];
    return (window.MAPS || {})[id] || null;
  }

  // ===== 공개 API =====
  function start(mapId, opts){
    opts = opts || {};
    genTiles();
    S.active = true;
    S.mapId = mapId;
    S.opts = opts;
    const m = getMap(mapId);
    if(!m){
      console.warn('[V3Map] 맵 없음:', mapId);
      return;
    }
    S.pos.x = (opts.startX != null) ? opts.startX : (m.startX != null ? m.startX : 7);
    S.pos.y = (opts.startY != null) ? opts.startY : (m.startY != null ? m.startY : 10);
    S.moveT = 0;
    S.tU = S.tD = S.tL = S.tR = false;
    if(window.STATE){
      window.STATE.currentMap = mapId;
      window.STATE.playerPos = { x:S.pos.x, y:S.pos.y };
    }
    console.log('[V3Map] start:', mapId, '@', S.pos.x, S.pos.y);
  }

  function stop(){
    S.active = false;
    S.tU = S.tD = S.tL = S.tR = false;
  }

  function update(){
    if(!S.active) return;
    S.frameT++;
    if(S.moveT > 0){ S.moveT--; return; }
    const m = getMap(S.mapId);
    if(!m) return;
    let nx = S.pos.x, ny = S.pos.y;
    if(S.tU) ny--;
    else if(S.tD) ny++;
    else if(S.tL) nx--;
    else if(S.tR) nx++;
    else return;
    S.moveT = MOVE_DELAY;
    if(ny<0 || ny>=m.h || nx<0 || nx>=m.w) return;
    const tile = m.tiles[ny]?.[nx];
    if(!WALK[tile]) return;
    // NPC 막기
    const blockedByNpc = (m.npcs||[]).some(n => n.x===nx && n.y===ny);
    if(blockedByNpc) return;

    S.pos.x = nx; S.pos.y = ny;
    if(window.STATE) window.STATE.playerPos = { x:nx, y:ny };

    // 워프
    const warp = (m.warps||[]).find(w => w.x===nx && w.y===ny);
    const warpTo = warp && (warp.to || warp.map);
    if(warpTo){
      if(S.opts && typeof S.opts.onWarpOut === 'function'){
        if(S.opts.onWarpOut(warpTo, warp) === false) return;
      }
      const dest = getMap(warpTo);
      if(dest){
        S.mapId = warpTo;
        S.pos.x = warp.tx != null ? warp.tx : (dest.startX||7);
        S.pos.y = warp.ty != null ? warp.ty : (dest.startY||10);
        if(window.STATE){
          window.STATE.currentMap = warpTo;
          window.STATE.playerPos = { x:S.pos.x, y:S.pos.y };
        }
      }
      return;
    }

    // 인카운터 (큰풀 tile=12)
    const encRate = (S.opts && S.opts.encounterRate != null) ? S.opts.encounterRate : 0.12;
    if(tile === 12 && Math.random() < encRate){
      if(S.opts && typeof S.opts.onEncounter === 'function'){
        const enc = m.encounters || [];
        const pickName = enc[Math.floor(Math.random()*enc.length)];
        S.opts.onEncounter(pickName, m);
      }
    }
  }

  function render(ctx, W, H){
    const m = getMap(S.mapId);
    ctx.fillStyle = '#1a0a2e'; ctx.fillRect(0, 0, W, H);
    if(!m){
      ctx.fillStyle = '#fff'; ctx.font = '16px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('맵 데이터 없음: ' + S.mapId, W/2, H/2);
      return;
    }
    const camX = S.pos.x * T - W/2 + T/2;
    const camY = S.pos.y * T - H/2 + T/2;

    // 타일
    for(let y=0; y<m.h; y++){
      for(let x=0; x<m.w; x++){
        const sx = x*T - camX, sy = y*T - camY;
        if(sx < -T || sx > W || sy < -T || sy > H) continue;
        const tc = S.tileCanvas[m.tiles[y]?.[x] || 0];
        if(tc) ctx.drawImage(tc, sx, sy);
      }
    }

    // 워프 간판
    const frameT = S.frameT;
    const bob = Math.sin(frameT*0.1)*2;
    (m.warps||[]).forEach(w => {
      const sx = w.x*T - camX, sy = w.y*T - camY;
      if(sx < -T || sx > W || sy < -T || sy > H) return;
      const dest = getMap(w.to || w.map);
      const label = dest?.name || (w.to || w.map || '???');
      ctx.fillStyle = '#8B6914';
      ctx.fillRect(sx+T/2-2, sy-14+bob, 4, 14);
      ctx.font = 'bold 11px "Jua", sans-serif';
      const tw = ctx.measureText('→ '+label).width + 10;
      ctx.fillStyle = 'rgba(42,21,64,0.92)';
      roundRect(ctx, sx+T/2-tw/2, sy-32+bob, tw, 16, 4); ctx.fill();
      ctx.strokeStyle = '#FFD54F'; ctx.lineWidth = 1;
      roundRect(ctx, sx+T/2-tw/2, sy-32+bob, tw, 16, 4); ctx.stroke();
      ctx.fillStyle = '#FFD54F';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('→ '+label, sx+T/2, sy-24+bob);
      ctx.textBaseline = 'alphabetic';
    });

    // NPC
    const NPC_SPRITE = {
      '리암 왕자':'liam', '리암':'liam',
      '몬쥬박사':'monju', '몬쥬':'monju', '엘더 박사':'monju',
      '바로핑':'ba', '차차핑':'ch', '꽁꽁핑':'kk', '부끄핑':'bk',
      '하츄핑':'hs', '라라핑':'la', '트러핑':'ts', '스틱핑':'stk',
      '하트킹':'hk'
    };
    const NPC_EMOJI = {
      '여왕님':'QN','왕비':'QN','왕':'KG','엄마':'MM','근위대장':'KN','근위병':'KN',
      '숲의 무당':'SM','꼬마 트레이너':'TR','제니':'JN',
      '마리':'MR','버스아저씨':'BS','꽃집 아줌마':'FL'
    };
    const npcBob = Math.sin(frameT*0.12)*2;
    (m.npcs||[]).forEach(n => {
      const sx = n.x*T - camX, sy = n.y*T - camY;
      // hatchu_ghost: 페이드 효과
      const isGhost = (n.id === 'hatchu_ghost');
      const fadeAlpha = isGhost ? (0.4 + 0.3*Math.sin(frameT*0.08)) : 1.0;
      ctx.globalAlpha = fadeAlpha;

      const key = NPC_SPRITE[n.name] || n.sprite;
      // 그림자
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath(); ctx.ellipse(sx+T/2, sy+T-4, T/3, 4, 0, 0, Math.PI*2); ctx.fill();
      if(key && window.IM && window.IM[key]){
        ctx.drawImage(window.IM[key], sx, sy+npcBob, T, T);
      } else {
        ctx.fillStyle = '#FF6B9D';
        ctx.beginPath(); ctx.arc(sx+T/2, sy+T/2+npcBob, 15, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
        const label = NPC_EMOJI[n.name] || '?';
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(label, sx+T/2, sy+T/2+npcBob);
        ctx.textBaseline = 'alphabetic';
      }
      // 이름표
      const nm = n.name || '?';
      ctx.font = '10px "Jua", sans-serif';
      const tw = ctx.measureText(nm).width + 8;
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      roundRect(ctx, sx+T/2-tw/2, sy-14, tw, 14, 4); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText(nm, sx+T/2, sy-3);
      // 느낌표
      if(n.dialog || n.gym || n.interact){
        ctx.fillStyle = '#FFD54F';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText('!', sx+T-6, sy+10+Math.sin(frameT*0.2)*2);
      }

      ctx.globalAlpha = 1.0;
    });

    // 플레이어 (로미)
    const px = W/2 - T/2, py = H/2 - T/2;
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath(); ctx.ellipse(px+T/2, py+T-4, T/3, 4, 0, 0, Math.PI*2); ctx.fill();
    const pbob = S.moveT > 0 ? Math.sin(frameT*0.4)*2 : Math.sin(frameT*0.08)*1.5;
    if(window.IM && window.IM.rs){
      ctx.drawImage(window.IM.rs, px, py+pbob, T, T);
    } else {
      ctx.fillStyle = '#FFD54F';
      ctx.fillRect(px+8, py+8+pbob, T-16, T-16);
    }

    // HUD
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, W, 32);
    ctx.fillStyle = '#FFD54F';
    ctx.font = 'bold 14px "Jua", sans-serif';
    ctx.textAlign = 'left';
    const hearts = (window.STATE && window.STATE.hearts) || 0;
    ctx.fillText('HP:'+hearts, 10, 20);
    ctx.textAlign = 'right';
    ctx.fillText(m.name || S.mapId, W-10, 20);
    ctx.textAlign = 'left';

    // 터치패드
    drawTouchPad(ctx, W, H);
  }

  function drawTouchPad(ctx, W, H){
    const cx = 70, cy = H - 80;
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    [[cx,cy-35],[cx,cy+35],[cx-35,cy],[cx+35,cy]].forEach(([x,y]) => {
      ctx.beginPath(); ctx.arc(x, y, 30, 0, Math.PI*2); ctx.fill();
    });
    ctx.fillStyle = '#FF6B9D';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('▲', cx, cy-35);
    ctx.fillText('▼', cx, cy+35);
    ctx.fillText('◀', cx-35, cy);
    ctx.fillText('▶', cx+35, cy);
    // A 버튼
    ctx.fillStyle = '#FFD54F';
    ctx.beginPath(); ctx.arc(W-60, H-80, 35, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#2a1540';
    ctx.fillText('A', W-60, H-80);
    ctx.textBaseline = 'alphabetic';
  }

  // ===== 입력 =====
  function handleInput(x, y, kind){
    if(!S.active) return;
    if(kind === 'key'){
      const k = x;  // 키 이름
      const down = (y !== false);
      if(k==='ArrowUp'||k==='w'||k==='W')         S.tU = down;
      else if(k==='ArrowDown'||k==='s'||k==='S')  S.tD = down;
      else if(k==='ArrowLeft'||k==='a'||k==='A')  S.tL = down;
      else if(k==='ArrowRight'||k==='d'||k==='D') S.tR = down;
      else if(down && (k==='Enter'||k===' '||k==='z'||k==='Z')) interactNPC();
      return;
    }
    if(kind === 'up'){
      S.tU = S.tD = S.tL = S.tR = false;
      return;
    }
    // down/tap
    const W = (arguments[3] && arguments[3].W) || 420;
    const H = (arguments[3] && arguments[3].H) || 750;
    // 터치패드 영역
    const cx = 70, cy = H - 80;
    const inC = (cx0, cy0, r) => (x-cx0)*(x-cx0) + (y-cy0)*(y-cy0) <= r*r;
    if(inC(cx, cy-35, 30)){ S.tU=true; return; }
    if(inC(cx, cy+35, 30)){ S.tD=true; return; }
    if(inC(cx-35, cy, 30)){ S.tL=true; return; }
    if(inC(cx+35, cy, 30)){ S.tR=true; return; }
    // A 버튼
    if(inC(W-60, H-80, 35)){ interactNPC(); return; }
  }

  function interactNPC(){
    const m = getMap(S.mapId);
    if(!m) return;
    const p = S.pos;
    const npc = (m.npcs||[]).find(n => Math.abs(n.x-p.x) <= 1 && Math.abs(n.y-p.y) <= 1);
    if(!npc) return;
    if(S.opts && typeof S.opts.onInteractNPC === 'function'){
      S.opts.onInteractNPC(npc, m);
    }
  }

  // ===== 유틸 =====
  function roundRect(ctx, x, y, w, h, r){
    ctx.beginPath();
    ctx.moveTo(x+r,y);
    ctx.arcTo(x+w,y,x+w,y+h,r);
    ctx.arcTo(x+w,y+h,x,y+h,r);
    ctx.arcTo(x,y+h,x,y,r);
    ctx.arcTo(x,y,x+w,y,r);
    ctx.closePath();
  }

  function onEnter(opts){
    if(opts && opts.mapId) start(opts.mapId, opts);
  }
  function onExit(){ stop(); }

  window.V3Map = {
    start, stop, update, render, handleInput,
    onEnter, onExit,
    interactNPC,
    _state: S,
    // unified 맵 등록 헬퍼
    registerMap: function(id, mapData){
      window.UNIFIED_MAPS = window.UNIFIED_MAPS || {};
      window.UNIFIED_MAPS[id] = mapData;
    },
    // 현재 위치 조회/설정
    getPos: function(){ return { mapId:S.mapId, x:S.pos.x, y:S.pos.y }; },
    setPos: function(mx, my){ S.pos.x = mx; S.pos.y = my; if(window.STATE) window.STATE.playerPos = { x:mx, y:my }; }
  };

  console.log('[UNIFIED] V3Map 엔진 로드 완료');
})();

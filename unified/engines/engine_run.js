// ============================================================
// UNIFIED v4 - RUN ENGINE (Act3 버스 러닝 리듬 미니게임)
// 로미와 버스가 나란히 달리는 횡스크롤 뷰.
// 바닥의 리듬 마커가 좌→우로 흐르고, 중앙 히트존과 겹칠 때 탭 → Perfect/Good/Miss
// API:
//   RunEngine.start(opts)
//     opts: { duration:10, markers:25, returnTo:'act3_post_run',
//             onClear:fn({hitRate, combo}), onFail:fn({hitRate}) }
// 성공 기준: hitRate >= 0.7 (실패해도 스토리 진행)
// ============================================================
(function(){
  'use strict';

  const HIT_ZONE_X = 120;   // 히트존 중앙 x
  const HIT_ZONE_Y = 520;   // 트랙 중앙 y
  const PERFECT_W = 18;
  const GOOD_W    = 42;
  const MARKER_SPEED = 3.2; // px/frame
  const SPAWN_START_X = 480;

  const S = {
    active: false,
    t: 0,
    opts: null,
    markers: [],       // {x, judged, result}
    spawnQueue: [],    // [frameT...]
    totalMarkers: 0,
    hits: 0,
    perfects: 0,
    combo: 0,
    maxCombo: 0,
    feedbackT: 0,
    feedbackText: '',
    feedbackColor: '#fff',
    bgX: 0,
    busJump: 0,
    romiJump: 0,
    phase: 'running',  // running | ending
    endCountdown: 0
  };

  function start(opts){
    opts = opts || {};
    S.active = true;
    S.t = 0;
    S.opts = opts;
    S.markers = [];
    S.totalMarkers = opts.markers || 25;
    S.hits = 0;
    S.perfects = 0;
    S.combo = 0;
    S.maxCombo = 0;
    S.bgX = 0;
    S.busJump = 0;
    S.romiJump = 0;
    S.phase = 'running';
    S.endCountdown = 0;

    // 스폰 큐 만들기: 대략 30~45프레임 간격
    S.spawnQueue = [];
    let tt = 60;
    for(let i=0; i<S.totalMarkers; i++){
      S.spawnQueue.push(tt);
      tt += 28 + Math.floor(Math.random()*20);
    }
    console.log('[RunEngine] start markers=', S.totalMarkers, ' totalFrames~', tt);
  }

  function stop(){
    S.active = false;
    S.markers = [];
  }

  function update(){
    if(!S.active) return;
    S.t++;
    S.bgX -= MARKER_SPEED * 0.5;
    S.busJump = Math.sin(S.t*0.25)*4;
    S.romiJump = Math.sin(S.t*0.3+0.5)*4;

    // 스폰
    while(S.spawnQueue.length > 0 && S.spawnQueue[0] <= S.t){
      S.spawnQueue.shift();
      S.markers.push({ x: SPAWN_START_X, judged:false, result:null });
    }

    // 마커 이동
    S.markers.forEach(m => {
      if(!m.judged) m.x -= MARKER_SPEED;
      else m.x -= MARKER_SPEED*1.5;   // 판정된건 빠르게 빠짐
    });

    // 놓친 마커 miss 처리
    S.markers.forEach(m => {
      if(!m.judged && m.x < HIT_ZONE_X - GOOD_W){
        m.judged = true;
        m.result = 'miss';
        S.combo = 0;
        S.feedbackText = 'MISS';
        S.feedbackColor = '#888';
        S.feedbackT = 20;
      }
    });

    // 화면 밖 제거
    S.markers = S.markers.filter(m => m.x > -30);

    if(S.feedbackT > 0) S.feedbackT--;

    // 종료 조건: 전부 판정 + 스폰 완료
    if(S.phase === 'running' && S.spawnQueue.length === 0 && S.markers.every(m => m.judged)){
      S.phase = 'ending';
      S.endCountdown = 60;
    }
    if(S.phase === 'ending'){
      S.endCountdown--;
      if(S.endCountdown <= 0){
        finish();
      }
    }
  }

  function finish(){
    if(!S.active) return;
    S.active = false;
    const rate = S.totalMarkers > 0 ? S.hits / S.totalMarkers : 0;
    const result = {
      hitRate: rate,
      hits: S.hits,
      perfects: S.perfects,
      total: S.totalMarkers,
      maxCombo: S.maxCombo
    };
    const threshold = 0.7;
    if(rate >= threshold){
      if(S.opts && typeof S.opts.onClear === 'function') S.opts.onClear(result);
    } else {
      if(S.opts && typeof S.opts.onFail === 'function') S.opts.onFail(result);
      else if(S.opts && typeof S.opts.onClear === 'function') S.opts.onClear(result); // 실패도 진행
    }
  }

  function render(ctx, W, H){
    if(!S.active && S.t === 0){
      ctx.fillStyle = '#0a0515'; ctx.fillRect(0,0,W,H);
      return;
    }
    // === 배경 그라디언트 (숲→마을 진행) ===
    const prog = S.totalMarkers > 0 ? Math.min(1, (S.hits + (S.totalMarkers - S.markers.length - S.spawnQueue.length)) / Math.max(1, S.totalMarkers)) : 0;
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, lerpColor('#7ec0ee', '#ffb6c1', prog));
    sky.addColorStop(1, lerpColor('#b0e0a0', '#ffd6a5', prog));
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // 배경: bg_forest 이미지 가로 스크롤
    const bgImg = window.IM && window.IM.bg_forest;
    if(bgImg){
      const bw = W;
      const off = ((S.bgX % bw) + bw) % bw;
      ctx.globalAlpha = 0.7 - prog*0.3;
      ctx.drawImage(bgImg, -off, 100, bw, H-250);
      ctx.drawImage(bgImg, bw-off, 100, bw, H-250);
      ctx.globalAlpha = 1.0;
    }

    // === 지면 ===
    ctx.fillStyle = '#8B6914';
    ctx.fillRect(0, H-180, W, 180);
    ctx.fillStyle = '#6B4F10';
    ctx.fillRect(0, H-180, W, 6);
    // 지면 라인들 (달리는 효과)
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 2;
    const lineOff = (S.t*4) % 40;
    for(let lx = -lineOff; lx < W; lx += 40){
      ctx.beginPath();
      ctx.moveTo(lx, H-80);
      ctx.lineTo(lx+20, H-80);
      ctx.stroke();
    }

    // === 구름 / 나무 실루엣 ===
    ctx.fillStyle = 'rgba(0,60,20,0.4)';
    for(let i=0; i<5; i++){
      const tx = ((i*120 - S.bgX*0.3) % (W+120) + W+120) % (W+120) - 60;
      ctx.beginPath();
      ctx.moveTo(tx, H-180);
      ctx.lineTo(tx+20, H-260);
      ctx.lineTo(tx+40, H-180);
      ctx.closePath(); ctx.fill();
    }

    // === 로미 (달리는 애니) ===
    const romiX = 70, romiY = H-220 + S.romiJump;
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath(); ctx.ellipse(romiX+30, H-175, 26, 5, 0, 0, Math.PI*2); ctx.fill();
    const rImg = window.IM && window.IM.rs;
    if(rImg){
      ctx.drawImage(rImg, romiX, romiY, 70, 70);
    } else {
      ctx.fillStyle = '#FFD54F';
      ctx.fillRect(romiX+10, romiY+10, 50, 50);
    }
    // 다리 흔들림
    ctx.fillStyle = '#FF6B9D';
    const legOff = Math.floor(S.t/6)%2 === 0 ? 4 : -4;
    ctx.fillRect(romiX+20, romiY+60, 10, 8+legOff);
    ctx.fillRect(romiX+40, romiY+60, 10, 8-legOff);

    // === 버스 ===
    const busX = W - 220, busY = H-240 + S.busJump;
    // 본체
    ctx.fillStyle = '#FFB74D';
    roundRect(ctx, busX, busY, 180, 80, 10); ctx.fill();
    ctx.strokeStyle = '#E65100'; ctx.lineWidth = 3;
    roundRect(ctx, busX, busY, 180, 80, 10); ctx.stroke();
    // 창문
    ctx.fillStyle = '#81D4FA';
    ctx.fillRect(busX+10, busY+10, 40, 30);
    ctx.fillRect(busX+60, busY+10, 40, 30);
    ctx.fillRect(busX+110, busY+10, 40, 30);
    // 아저씨 실루엣 (창문 속)
    ctx.fillStyle = '#5D4037';
    ctx.beginPath(); ctx.arc(busX+130, busY+22, 8, 0, Math.PI*2); ctx.fill();
    // 문
    ctx.fillStyle = '#FFECB3';
    ctx.fillRect(busX+160, busY+20, 15, 50);
    // 바퀴
    const wheelSpin = (S.t*10) % 360;
    [[busX+30, busY+80],[busX+150, busY+80]].forEach(([wx,wy]) => {
      ctx.fillStyle = '#212121';
      ctx.beginPath(); ctx.arc(wx, wy, 14, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#616161';
      ctx.beginPath(); ctx.arc(wx, wy, 6, 0, Math.PI*2); ctx.fill();
      // 스포크
      ctx.strokeStyle = '#FFD54F'; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(wx+10*Math.cos(wheelSpin*Math.PI/180), wy+10*Math.sin(wheelSpin*Math.PI/180));
      ctx.lineTo(wx-10*Math.cos(wheelSpin*Math.PI/180), wy-10*Math.sin(wheelSpin*Math.PI/180));
      ctx.stroke();
    });

    // === 리듬 트랙 ===
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, HIT_ZONE_Y-25, W, 50);
    ctx.strokeStyle = '#FFD54F'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, HIT_ZONE_Y-25); ctx.lineTo(W, HIT_ZONE_Y-25); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, HIT_ZONE_Y+25); ctx.lineTo(W, HIT_ZONE_Y+25); ctx.stroke();

    // 히트존 (중앙 서클)
    ctx.fillStyle = 'rgba(255,107,157,0.35)';
    ctx.beginPath(); ctx.arc(HIT_ZONE_X, HIT_ZONE_Y, GOOD_W, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#FF6B9D'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(HIT_ZONE_X, HIT_ZONE_Y, GOOD_W, 0, Math.PI*2); ctx.stroke();
    ctx.strokeStyle = '#FFD54F';
    ctx.beginPath(); ctx.arc(HIT_ZONE_X, HIT_ZONE_Y, PERFECT_W, 0, Math.PI*2); ctx.stroke();
    // TAP! 텍스트
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 13px "Jua", sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('TAP', HIT_ZONE_X, HIT_ZONE_Y-60);

    // 마커들
    S.markers.forEach(m => {
      if(m.judged && m.result === 'miss'){
        ctx.globalAlpha = 0.3;
      }
      ctx.fillStyle = m.judged
        ? (m.result==='perfect' ? '#FFD54F' : m.result==='good' ? '#4FC3F7' : '#888')
        : '#FF6B9D';
      ctx.beginPath(); ctx.arc(m.x, HIT_ZONE_Y, 14, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(m.x, HIT_ZONE_Y, 14, 0, Math.PI*2); ctx.stroke();
      ctx.globalAlpha = 1.0;
    });

    // 피드백 (Perfect/Good/Miss)
    if(S.feedbackT > 0){
      const a = S.feedbackT / 20;
      ctx.fillStyle = 'rgba(255,255,255,'+a.toFixed(2)+')';
      ctx.font = 'bold 28px "Jua", sans-serif';
      ctx.fillStyle = S.feedbackColor;
      ctx.globalAlpha = a;
      ctx.textAlign = 'center';
      ctx.fillText(S.feedbackText, HIT_ZONE_X, HIT_ZONE_Y-80);
      ctx.globalAlpha = 1.0;
    }

    // === HUD 상단 ===
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, W, 50);
    ctx.fillStyle = '#FFD54F';
    ctx.font = 'bold 18px "Jua", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('COMBO ' + S.combo + ' (MAX ' + S.maxCombo + ')', 12, 20);
    ctx.textAlign = 'right';
    ctx.fillText(S.hits + ' / ' + S.totalMarkers, W-12, 20);

    // 진행 바
    const barY = 38, barH = 6;
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(12, barY, W-24, barH);
    const done = S.totalMarkers - S.spawnQueue.length;
    const fillW = (W-24) * (done / Math.max(1, S.totalMarkers));
    ctx.fillStyle = '#FF6B9D';
    ctx.fillRect(12, barY, fillW, barH);

    // 힌트
    ctx.fillStyle = '#fff';
    ctx.font = '11px "Jua", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Space / Tap — 리듬에 맞춰 눌러라!', W/2, 60);

    // 종료 중 오버레이
    if(S.phase === 'ending'){
      const rate = S.totalMarkers > 0 ? S.hits / S.totalMarkers : 0;
      const pass = rate >= 0.7;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0,0,W,H);
      ctx.textAlign = 'center';
      ctx.fillStyle = pass ? '#FFD54F' : '#FF6B9D';
      ctx.font = 'bold 28px "Jua", sans-serif';
      ctx.fillText(pass ? '버스를 따라잡았다!' : '헉헉... 놓쳤다...', W/2, H/2-40);
      ctx.fillStyle = '#fff';
      ctx.font = '16px "Jua", sans-serif';
      ctx.fillText('명중률: ' + Math.floor(rate*100) + '%', W/2, H/2);
      ctx.fillText('최고 콤보: ' + S.maxCombo, W/2, H/2+26);
      if(!pass){
        ctx.font = '13px "Jua", sans-serif';
        ctx.fillStyle = '#FFD54F';
        ctx.fillText('"괜찮아! 다음엔 잘 할 수 있을거야!" - 아저씨', W/2, H/2+56);
      }
    }
  }

  function lerpColor(hex1, hex2, t){
    const p = (h) => { const n = parseInt(h.slice(1),16); return [(n>>16)&255,(n>>8)&255,n&255]; };
    const [r1,g1,b1] = p(hex1), [r2,g2,b2] = p(hex2);
    const r = Math.floor(r1 + (r2-r1)*t);
    const g = Math.floor(g1 + (g2-g1)*t);
    const b = Math.floor(b1 + (b2-b1)*t);
    return 'rgb('+r+','+g+','+b+')';
  }

  function roundRect(ctx, x, y, w, h, r){
    ctx.beginPath();
    ctx.moveTo(x+r,y);
    ctx.arcTo(x+w,y,x+w,y+h,r);
    ctx.arcTo(x+w,y+h,x,y+h,r);
    ctx.arcTo(x,y+h,x,y,r);
    ctx.arcTo(x,y,x+w,y,r);
    ctx.closePath();
  }

  // ===== 입력 =====
  function handleInput(x, y, kind){
    if(!S.active || S.phase !== 'running') return;
    // 키 이벤트
    if(kind === 'key'){
      const k = x;
      if(k === ' ' || k === 'Enter' || k === 'z' || k === 'Z'){
        tryHit();
      }
      return;
    }
    if(kind === 'up') return;
    // 탭: 화면 어디든 OK
    tryHit();
  }

  function tryHit(){
    // 히트존에서 가장 가까운 미판정 마커
    let best = null;
    let bestDist = Infinity;
    S.markers.forEach(m => {
      if(m.judged) return;
      const d = Math.abs(m.x - HIT_ZONE_X);
      if(d < bestDist){ bestDist = d; best = m; }
    });
    if(!best){
      S.feedbackText = '...'; S.feedbackColor = '#666';
      S.feedbackT = 12;
      return;
    }
    if(bestDist <= PERFECT_W){
      best.judged = true; best.result = 'perfect';
      S.hits++; S.perfects++; S.combo++;
      if(S.combo > S.maxCombo) S.maxCombo = S.combo;
      S.feedbackText = 'PERFECT!'; S.feedbackColor = '#FFD54F';
      S.feedbackT = 20;
    } else if(bestDist <= GOOD_W){
      best.judged = true; best.result = 'good';
      S.hits++; S.combo++;
      if(S.combo > S.maxCombo) S.maxCombo = S.combo;
      S.feedbackText = 'GOOD'; S.feedbackColor = '#4FC3F7';
      S.feedbackT = 18;
    } else {
      // 너무 이르거나 늦음 — miss로 치지 않고 단순 무시
      S.feedbackText = '...'; S.feedbackColor = '#666';
      S.feedbackT = 10;
    }
  }

  function onEnter(opts){ start(opts||{}); }
  function onExit(){ stop(); }

  window.RunEngine = {
    start, stop, update, render, handleInput,
    onEnter, onExit,
    _state: S
  };

  console.log('[UNIFIED] RunEngine 로드 완료');
})();

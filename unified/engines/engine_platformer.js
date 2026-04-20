// ============================================================
// UNIFIED v4 - PLATFORMER ENGINE (Act2 성 탈출, 마리오식)
// 420×750 세로 Canvas, 가로 스크롤(로미 중앙 고정, 월드가 움직임)
// 공개 API: window.PlatformerEngine.start(opts) / update() / render(ctx,W,H)
//            / handleInput(x,y,kind) / stop()
// opts: { levels:[...], onClear, returnTo }
// 각 level: { id, bg, spawn:{x,y}, platforms:[{x,y,w,h,type}], enemies:[{x,y,kind}],
//            hazards:[{x,y,w,h,type}], goal:{x,y,w,h}, worldW, boss?:{...} }
// ============================================================
(function(){
  'use strict';

  // ============ 물리/뷰 상수 ============
  const GR      = 0.5;      // 중력 px/frame^2 (지시사항 준수)
  const JMP     = -10;      // 점프 초기 속도 (지시사항 준수)
  const SPD     = 3;        // 좌우 속도 (지시사항 준수)
  const MXF     = 12;       // 낙하 최대 속도
  const PW      = 32;       // 로미 hitbox 가로
  const PH      = 48;       // 로미 hitbox 세로
  const SCREEN_W = 420;
  const SCREEN_H = 750;
  const CAM_ANCHOR_X = 170; // 로미가 화면상 고정되는 x좌표 (거의 중앙, 살짝 좌측)
  const GROUND_Y = 640;     // 바닥(논리상) — 레벨마다 재정의 가능
  const FALL_Y  = 900;      // 이 y 이하로 떨어지면 낙사
  const INVULN_FRAMES = 60; // 피격 후 무적 1초

  // 보스
  const BOSS_W = 90;
  const BOSS_H = 110;
  const BOSS_MAX_HP = 3;           // 3-히트 패턴
  const BOSS_QTE_NEEDED = 3;       // QTE 성공 횟수
  const BOSS_QTE_TIME = 90;        // QTE 제한 시간(frame)
  const BOSS_QTE_HITS = 6;         // Z 연타 필요 횟수
  const BOSS_CHARGE_SPD = 4.2;
  const BOSS_JUMP_VY = -12;
  const BOSS_SHOCKWAVE_DUR = 50;

  // ============ 입력 ============
  const keys = {};
  window.addEventListener('keydown', e=>{
    keys[e.key] = true;
    if(e.key === 'z' || e.key === 'Z') S.qteTapPending = true;
  });
  window.addEventListener('keyup',   e=>{ keys[e.key] = false; });

  // ============ 내부 상태 ============
  const S = {
    active: false,
    opts: null,
    levels: [],
    levelIdx: 0,
    L: null,             // 현재 레벨 레퍼런스
    camX: 0,
    hp: 5,
    maxHp: 5,
    invuln: 0,
    lvClearT: 0,         // 레벨 클리어 연출 카운터
    lvClearing: false,
    dead: false,
    deadT: 0,
    t: 0,

    // 플레이어
    P: { x:0, y:0, vx:0, vy:0, gr:false, face:1 },

    // 터치 버튼 상태
    btn: { left:false, right:false, jump:false },

    // 버튼 영역 기억 (hit test용)
    _touchRects: null,

    // 보스전
    boss: null,

    // QTE
    qte: null,           // {tapsLeft, timeLeft, total}
    qteTapPending: false,

    // 컷신(할머니 등장)
    grandma: null,       // {t}

    onClear: null
  };

  // ============ 공개 API ============
  function start(opts){
    S.opts = opts || {};
    S.levels = Array.isArray(opts.levels) ? opts.levels : [];
    S.levelIdx = 0;
    S.hp = S.maxHp;
    S.active = true;
    S.dead = false;
    S.deadT = 0;
    S.lvClearing = false;
    S.lvClearT = 0;
    S.onClear = opts.onClear || null;
    _loadLevel(0);
  }

  function stop(){
    S.active = false;
    S.opts = null;
    S.levels = [];
    S.L = null;
    S.boss = null;
    S.qte = null;
    S.grandma = null;
  }

  function onEnter(opts){
    if(opts && opts.levels){
      start(opts);
    }
  }
  function onExit(){ /* keep state if needed */ }

  function _loadLevel(idx){
    if(idx >= S.levels.length){
      _finish();
      return;
    }
    S.levelIdx = idx;
    S.L = _prepareLevel(S.levels[idx]);
    const sp = S.L.spawn || { x:60, y: 500 };
    S.P.x = sp.x; S.P.y = sp.y;
    S.P.vx = 0; S.P.vy = 0; S.P.gr = false; S.P.face = 1;
    S.camX = 0;
    S.invuln = 60;
    S.lvClearing = false;
    S.lvClearT = 0;
    S.dead = false;
    S.deadT = 0;

    // 보스 세팅 (보스 레벨인 경우)
    if(S.L.boss){
      S.boss = _makeBoss(S.L.boss);
    } else {
      S.boss = null;
    }
    S.qte = null;
    S.grandma = null;
  }

  // 레벨 데이터 원본 변이 방지용 얕은 복제 + 파생값 계산
  function _prepareLevel(raw){
    const L = Object.assign({}, raw);
    L.platforms = (raw.platforms || []).map(p => Object.assign({}, p));
    L.enemies = (raw.enemies || []).map(e => Object.assign({ alive:true, face:-1, t:0 }, e));
    L.hazards = (raw.hazards || []).map(h => Object.assign({}, h));
    L.goal = raw.goal ? Object.assign({}, raw.goal) : null;
    // 월드 너비 자동 계산 (명시 없으면 플랫폼 최대 끝 +200)
    if(!L.worldW){
      let maxX = SCREEN_W;
      L.platforms.forEach(p => { if(p.x + p.w > maxX) maxX = p.x + p.w; });
      if(L.goal) maxX = Math.max(maxX, L.goal.x + 100);
      L.worldW = maxX + 100;
    }
    return L;
  }

  function _makeBoss(b){
    return {
      name: b.name || '성기사',
      x: (b.x != null ? b.x : 1000),
      y: (b.y != null ? b.y : 500),
      vx: 0, vy: 0,
      w: BOSS_W, h: BOSS_H,
      hp: BOSS_MAX_HP,
      phase: 'intro',       // intro → pattern → stunned → qte → defeated
      phaseT: 0,
      pattern: 0,           // 0=charge, 1=jump, 2=shockwave
      stunT: 0,
      shockwave: null,
      gr: false,
      defeated: false
    };
  }

  // ============ 업데이트 ============
  function update(){
    if(!S.active || !S.L) return;
    S.t++;

    // 컷신(할머니) 진행 중이면 다른 로직 정지
    if(S.grandma){
      S.grandma.t++;
      if(S.grandma.advance){
        _finish();
      }
      return;
    }

    // 레벨 클리어 연출
    if(S.lvClearing){
      S.lvClearT++;
      if(S.lvClearT > 45){
        const nextIdx = S.levelIdx + 1;
        if(nextIdx >= S.levels.length){
          _finish();
        } else {
          _loadLevel(nextIdx);
        }
      }
      return;
    }

    // 사망 연출
    if(S.dead){
      S.deadT++;
      if(S.deadT > 60){
        // 레벨 재시작 (HP 복구 — 무한 생존 가능해야 함)
        S.hp = S.maxHp;
        _loadLevel(S.levelIdx);
      }
      return;
    }

    // QTE 모드
    if(S.qte){
      _updateQTE();
      return;
    }

    _updatePlayer();
    _updateEnemies();
    if(S.boss) _updateBoss();
    _updateCamera();
    _checkHazards();
    _checkGoal();

    if(S.invuln > 0) S.invuln--;
  }

  function _updatePlayer(){
    const P = S.P;
    const L = S.L;

    // 입력: 키보드 or 터치 버튼
    let mx = 0;
    if(keys.ArrowLeft  || keys.a || keys.A || S.btn.left)  mx -= 1;
    if(keys.ArrowRight || keys.d || keys.D || S.btn.right) mx += 1;
    P.vx = mx * SPD;
    if(mx !== 0) P.face = mx;

    // 점프
    const jumpPressed = keys.ArrowUp || keys.w || keys.W || keys[' '] || S.btn.jump;
    if(jumpPressed && P.gr){
      P.vy = JMP;
      P.gr = false;
      S.btn.jump = false; // 터치는 1회성
    }

    // 중력
    P.vy = Math.min(P.vy + GR, MXF);

    // 이동 + 충돌
    P.x += P.vx;
    P.y += P.vy;
    P.gr = false;

    for(const pl of L.platforms){
      if(P.x + PW > pl.x && P.x < pl.x + pl.w){
        // 위에서 착지 (원본 패턴: vy>=0 & y+PH >= py & 이전위치가 위)
        if(P.vy >= 0 && P.y + PH >= pl.y && (P.y + PH - P.vy) <= pl.y + 5){
          P.y = pl.y - PH;
          P.vy = 0;
          P.gr = true;
        }
        // 아래에서 머리 박기
        if(P.vy < 0 && P.y <= pl.y + pl.h && (P.y - P.vy) >= pl.y + pl.h - 3){
          P.y = pl.y + pl.h;
          P.vy = 0;
        }
      }
      // 좌우 벽
      if(P.y + PH > pl.y && P.y < pl.y + pl.h){
        if(P.vx > 0 && P.x + PW > pl.x && (P.x + PW - P.vx) <= pl.x + 2){
          P.x = pl.x - PW;
        }
        if(P.vx < 0 && P.x < pl.x + pl.w && (P.x - P.vx) >= pl.x + pl.w - 2){
          P.x = pl.x + pl.w;
        }
      }
    }

    // 월드 좌우 경계
    if(P.x < 0) P.x = 0;
    if(P.x + PW > L.worldW) P.x = L.worldW - PW;

    // 낙사
    if(P.y > FALL_Y){
      _damage(99);
    }
  }

  function _updateEnemies(){
    const L = S.L;
    const P = S.P;
    for(const e of L.enemies){
      if(!e.alive) continue;
      e.t++;
      // 단순 좌우 순찰 (range = 80)
      const cx = e.baseX != null ? e.baseX : (e.baseX = e.x);
      e.x = cx + Math.sin(e.t * 0.03) * 60;

      // 플레이어와 충돌
      const ew = e.w || 32, eh = e.h || 32;
      if(_rectOverlap(P.x, P.y, PW, PH, e.x, e.y, ew, eh)){
        // 위에서 밟기
        if(P.vy > 0 && P.y + PH - P.vy < e.y + 8){
          e.alive = false;
          P.vy = JMP * 0.6;
        } else {
          _damage(1);
        }
      }
    }
  }

  function _updateBoss(){
    const B = S.boss;
    if(!B || B.defeated) return;
    const P = S.P;
    B.phaseT++;

    if(B.phase === 'intro'){
      if(B.phaseT > 60){
        B.phase = 'pattern';
        B.phaseT = 0;
        B.pattern = 0;
        B.vx = -BOSS_CHARGE_SPD;
      }
      return;
    }

    if(B.phase === 'stunned'){
      B.vx = 0;
      if(B.phaseT > 40){
        // QTE 개시
        S.qte = { tapsLeft: BOSS_QTE_HITS, timeLeft: BOSS_QTE_TIME, total: BOSS_QTE_HITS };
        B.phase = 'qte';
        B.phaseT = 0;
      }
      return;
    }

    if(B.phase === 'defeated'){
      // 보스 쓰러짐 → 할머니 등장 타이밍
      if(B.phaseT === 90){
        _spawnGrandma();
      }
      return;
    }

    // 패턴 진행
    _bossPattern(B);

    // 보스 중력/플랫폼(간단 바닥만)
    B.vy = Math.min(B.vy + GR, MXF);
    B.x += B.vx;
    B.y += B.vy;
    B.gr = false;
    // 단순 지면: 보스전 바닥 y = 560
    const FLOOR = S.L.bossFloor != null ? S.L.bossFloor : 560;
    if(B.y + B.h >= FLOOR){ B.y = FLOOR - B.h; B.vy = 0; B.gr = true; }
    // 경계
    if(B.x < 50) { B.x = 50; B.vx = Math.abs(B.vx); }
    if(B.x + B.w > S.L.worldW - 50) { B.x = S.L.worldW - 50 - B.w; B.vx = -Math.abs(B.vx); }

    // 플레이어와 접촉 → 데미지 (충격파 포함)
    if(_rectOverlap(P.x, P.y, PW, PH, B.x, B.y, B.w, B.h)){
      _damage(1);
      // 밀쳐내기
      P.vx = (P.x < B.x ? -1 : 1) * 4;
      P.vy = -6;
    }
    // 충격파
    if(B.shockwave){
      B.shockwave.t--;
      B.shockwave.x += B.shockwave.vx;
      if(_rectOverlap(P.x, P.y, PW, PH, B.shockwave.x - 25, FLOOR - 20, 50, 20)){
        if(P.gr) _damage(1);
      }
      if(B.shockwave.t <= 0) B.shockwave = null;
    }
  }

  function _bossPattern(B){
    // 패턴 0: 돌진 (charge)
    if(B.pattern === 0){
      // 플레이어 방향으로 돌진
      const dir = (S.P.x < B.x) ? -1 : 1;
      B.vx = dir * BOSS_CHARGE_SPD;
      if(B.phaseT > 140){
        B.phase = 'pattern';
        B.pattern = 1;
        B.phaseT = 0;
        // 점프 공격
        B.vy = BOSS_JUMP_VY;
        B.vx = (S.P.x - B.x) * 0.03;
      }
      return;
    }
    // 패턴 1: 점프 공격 → 착지 시 충격파
    if(B.pattern === 1){
      if(B.gr && B.phaseT > 10){
        B.shockwave = { x: B.x + B.w/2, vx: (S.P.x < B.x ? -6 : 6), t: BOSS_SHOCKWAVE_DUR };
        B.phase = 'pattern';
        B.pattern = 2;
        B.phaseT = 0;
        B.vx = 0;
      }
      return;
    }
    // 패턴 2: 잠깐 멈춤 (회피 타이밍 부여) → 다시 돌진
    if(B.pattern === 2){
      B.vx = 0;
      if(B.phaseT > 50){
        B.pattern = 0;
        B.phaseT = 0;
      }
      return;
    }
  }

  function _updateQTE(){
    const q = S.qte;
    q.timeLeft--;
    if(S.qteTapPending){
      q.tapsLeft--;
      S.qteTapPending = false;
    }
    if(q.tapsLeft <= 0){
      // 한 라운드 성공
      const B = S.boss;
      B.hp--;
      S.qte = null;
      if(B.hp <= 0){
        B.phase = 'defeated';
        B.phaseT = 0;
        B.defeated = true;
      } else {
        // 다음 라운드로 (stunned 해제 → 패턴 재개)
        B.phase = 'pattern';
        B.pattern = 0;
        B.phaseT = 0;
        B.vx = -BOSS_CHARGE_SPD;
      }
      return;
    }
    if(q.timeLeft <= 0){
      // 실패 → 데미지, 보스 패턴 재개
      S.qte = null;
      _damage(1);
      const B = S.boss;
      B.phase = 'pattern';
      B.pattern = 0;
      B.phaseT = 0;
      B.vx = -BOSS_CHARGE_SPD;
    }
  }

  function _updateCamera(){
    // 로미 중앙 고정, 월드가 움직임
    S.camX = S.P.x - CAM_ANCHOR_X;
    if(S.camX < 0) S.camX = 0;
    const maxCam = Math.max(0, S.L.worldW - SCREEN_W);
    if(S.camX > maxCam) S.camX = maxCam;
  }

  function _checkHazards(){
    const P = S.P;
    for(const h of S.L.hazards || []){
      if(_rectOverlap(P.x, P.y, PW, PH, h.x, h.y, h.w, h.h)){
        _damage(1);
        // 가시면 살짝 튕기기
        P.vy = -6;
      }
    }
  }

  function _checkGoal(){
    const g = S.L.goal;
    if(!g) return;
    // 보스 레벨은 보스 쓰러지고 컷신 끝나야 finish
    if(S.boss && !S.boss.defeated) return;
    if(S.boss && S.boss.defeated) return; // 보스 처치→할머니 컷신 경로
    if(_rectOverlap(S.P.x, S.P.y, PW, PH, g.x, g.y, g.w, g.h)){
      S.lvClearing = true;
      S.lvClearT = 0;
    }
  }

  function _damage(n){
    if(S.invuln > 0) return;
    S.hp -= n;
    S.invuln = INVULN_FRAMES;
    if(S.hp <= 0){
      S.dead = true;
      S.deadT = 0;
    }
  }

  function _spawnGrandma(){
    S.grandma = { t:0, advance:false };
  }

  function _finish(){
    S.active = false;
    const cb = S.onClear; S.onClear = null;
    if(cb) try{ cb(); }catch(e){ console.error('[Platformer] onClear err:', e); }
  }

  function _rectOverlap(ax,ay,aw,ah, bx,by,bw,bh){
    return ax < bx+bw && ax+aw > bx && ay < by+bh && ay+ah > by;
  }

  // ============ 렌더 ============
  function render(ctx, W, H){
    if(!ctx && window.UCanvas){ ctx = window.UCanvas.ctx; W = window.UCanvas.W; H = window.UCanvas.H; }
    if(!ctx) return;
    W = W || SCREEN_W; H = H || SCREEN_H;

    if(!S.L){
      ctx.fillStyle = '#1a0a2e';
      ctx.fillRect(0,0,W,H);
      return;
    }

    _drawBg(ctx, W, H);

    // 월드 변환
    ctx.save();
    ctx.translate(-S.camX, 0);
    _drawPlatforms(ctx);
    _drawHazards(ctx);
    _drawGoal(ctx);
    _drawEnemies(ctx);
    if(S.boss) _drawBoss(ctx);
    _drawPlayer(ctx);
    if(S.grandma) _drawGrandma(ctx);
    ctx.restore();

    _drawHUD(ctx, W, H);
    _drawTouchButtons(ctx, W, H);
    if(S.qte) _drawQTE(ctx, W, H);
    if(S.grandma) _drawGrandmaDialog(ctx, W, H);
    if(S.lvClearing) _drawLevelClear(ctx, W, H);
    if(S.dead) _drawDeath(ctx, W, H);
  }

  function _drawBg(ctx, W, H){
    const IM = window.IM || {};
    const key = S.L.bg;
    const img = key ? IM[key] : null;
    if(img && img.complete && img.naturalWidth > 0){
      // 살짝 패럴랙스 (cam*0.3)
      const bgW = W, bgH = H;
      ctx.drawImage(img, -S.camX*0.3 % bgW, 0, bgW, bgH);
      ctx.drawImage(img, -S.camX*0.3 % bgW + bgW, 0, bgW, bgH);
    } else {
      // 레벨별 폴백 그라데이션
      const pal = S.L.palette || ['#2a1540','#6a2a8a','#3a1a5a'];
      const g = ctx.createLinearGradient(0,0,0,H);
      g.addColorStop(0, pal[0]);
      g.addColorStop(0.5, pal[1]);
      g.addColorStop(1, pal[2]);
      ctx.fillStyle = g; ctx.fillRect(0,0,W,H);
    }
  }

  function _drawPlatforms(ctx){
    for(const p of S.L.platforms){
      const t = p.type || 'stone';
      if(t === 'stone'){
        ctx.fillStyle = '#5a4a6a';
        ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.fillStyle = '#7a6a8a';
        ctx.fillRect(p.x, p.y, p.w, 4);
      } else if(t === 'wood'){
        ctx.fillStyle = '#8a5a3a';
        ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.fillStyle = '#b07a4a';
        ctx.fillRect(p.x, p.y, p.w, 3);
      } else if(t === 'roof'){
        ctx.fillStyle = '#7a2a4a';
        ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.fillStyle = '#aa3a5a';
        ctx.fillRect(p.x, p.y, p.w, 4);
      } else {
        ctx.fillStyle = '#666';
        ctx.fillRect(p.x, p.y, p.w, p.h);
      }
    }
  }

  function _drawHazards(ctx){
    for(const h of S.L.hazards || []){
      if(h.type === 'spike'){
        ctx.fillStyle = '#d94';
        const n = Math.max(1, Math.floor(h.w / 10));
        for(let i=0;i<n;i++){
          ctx.beginPath();
          ctx.moveTo(h.x + i*10,     h.y + h.h);
          ctx.lineTo(h.x + i*10 + 5, h.y);
          ctx.lineTo(h.x + i*10 + 10,h.y + h.h);
          ctx.closePath();
          ctx.fill();
        }
      } else {
        ctx.fillStyle = '#c33';
        ctx.fillRect(h.x, h.y, h.w, h.h);
      }
    }
  }

  function _drawGoal(ctx){
    const g = S.L.goal;
    if(!g) return;
    ctx.save();
    const wob = Math.sin(S.t*0.1)*3;
    ctx.fillStyle = 'rgba(255,220,120,0.9)';
    ctx.fillRect(g.x, g.y + wob, g.w, g.h);
    ctx.fillStyle = '#FFD54F';
    ctx.font = 'bold 16px "Jua", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(S.L.goalLabel || '출구', g.x + g.w/2, g.y + g.h/2 + wob + 5);
    ctx.restore();
  }

  function _drawEnemies(ctx){
    for(const e of S.L.enemies){
      if(!e.alive) continue;
      const ew = e.w || 32, eh = e.h || 32;
      ctx.fillStyle = '#8a2a4a';
      ctx.fillRect(e.x, e.y, ew, eh);
      // 눈
      ctx.fillStyle = '#fff';
      ctx.fillRect(e.x + 6,  e.y + 10, 5, 5);
      ctx.fillRect(e.x + 20, e.y + 10, 5, 5);
      ctx.fillStyle = '#000';
      ctx.fillRect(e.x + 8,  e.y + 12, 2, 2);
      ctx.fillRect(e.x + 22, e.y + 12, 2, 2);
    }
  }

  function _drawBoss(ctx){
    const B = S.boss;
    if(!B) return;
    // 몸통
    ctx.fillStyle = B.phase === 'stunned' || B.phase === 'qte' ? '#8899aa' : '#3a4a6a';
    ctx.fillRect(B.x, B.y, B.w, B.h);
    // 투구 장식
    ctx.fillStyle = '#cc3344';
    ctx.fillRect(B.x + B.w/2 - 4, B.y - 10, 8, 14);
    // 눈
    ctx.fillStyle = '#ff5050';
    ctx.fillRect(B.x + 20, B.y + 30, 8, 6);
    ctx.fillRect(B.x + B.w - 28, B.y + 30, 8, 6);
    // 검
    ctx.fillStyle = '#ddd';
    ctx.fillRect(B.x + B.w, B.y + 40, 40, 6);
    // HP 바
    const hpw = (B.hp / BOSS_MAX_HP);
    ctx.fillStyle = '#300';
    ctx.fillRect(B.x - 5, B.y - 20, B.w + 10, 6);
    ctx.fillStyle = '#e33';
    ctx.fillRect(B.x - 5, B.y - 20, (B.w + 10)*hpw, 6);
    // 이름
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(B.name, B.x + B.w/2, B.y - 24);
    // 충격파
    if(B.shockwave){
      ctx.fillStyle = 'rgba(255,180,80,0.7)';
      const sy = (S.L.bossFloor != null ? S.L.bossFloor : 560) - 16;
      ctx.fillRect(B.shockwave.x - 25, sy, 50, 16);
    }
  }

  function _drawPlayer(ctx){
    const P = S.P;
    // 무적 깜빡임
    if(S.invuln > 0 && (S.invuln % 6 < 3)) return;
    // 간단 로미 픽토: 분홍 드레스
    ctx.save();
    ctx.translate(P.x + PW/2, P.y + PH/2);
    if(P.face < 0) ctx.scale(-1, 1);
    // 몸
    ctx.fillStyle = '#ff6b9d';
    ctx.fillRect(-PW/2, -PH/2 + 14, PW, PH - 14);
    // 머리
    ctx.fillStyle = '#ffd7c2';
    ctx.fillRect(-10, -PH/2, 20, 18);
    // 머리카락
    ctx.fillStyle = '#6a3a5a';
    ctx.fillRect(-12, -PH/2 - 2, 24, 8);
    // 리본
    ctx.fillStyle = '#ffdd66';
    ctx.fillRect(-14, -PH/2 + 2, 4, 4);
    // 눈
    ctx.fillStyle = '#222';
    ctx.fillRect(-5, -PH/2 + 8, 2, 3);
    ctx.fillRect( 3, -PH/2 + 8, 2, 3);
    ctx.restore();
  }

  function _drawGrandma(ctx){
    // 할머니를 보스 위치 근처에 배치
    const gx = (S.boss ? S.boss.x + 30 : S.L.worldW - 200);
    const gy = (S.L.bossFloor != null ? S.L.bossFloor : 560) - 70;
    ctx.fillStyle = '#9a88a8';
    ctx.fillRect(gx, gy + 20, 40, 50);
    ctx.fillStyle = '#ffe0c0';
    ctx.fillRect(gx + 8, gy, 24, 22);
    ctx.fillStyle = '#ddd';
    ctx.fillRect(gx + 4, gy - 4, 32, 10); // 은발
  }

  function _drawHUD(ctx, W, H){
    // HP 하트
    for(let i=0;i<S.maxHp;i++){
      const x = 10 + i*22, y = 12;
      ctx.fillStyle = i < S.hp ? '#ff5080' : '#553344';
      ctx.beginPath();
      ctx.arc(x+6,  y+6, 6, 0, Math.PI*2);
      ctx.arc(x+14, y+6, 6, 0, Math.PI*2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x, y+8); ctx.lineTo(x+10, y+20); ctx.lineTo(x+20, y+8);
      ctx.fill();
    }
    // 레벨 표기
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(W - 110, 8, 100, 22);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px "Jua",sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText((S.L.title || ('Level '+(S.levelIdx+1))), W - 60, 24);
  }

  // 터치 버튼 — 좌하단 ←→, 우하단 점프
  function _drawTouchButtons(ctx, W, H){
    const y = H - 90;
    const rL = { x: 20,      y, w: 60, h: 70 };
    const rR = { x: 90,      y, w: 60, h: 70 };
    const rJ = { x: W - 100, y, w: 80, h: 70 };
    S._touchRects = { L: rL, R: rR, J: rJ };

    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = '#222';
    ctx.fillRect(rL.x, rL.y, rL.w, rL.h);
    ctx.fillRect(rR.x, rR.y, rR.w, rR.h);
    ctx.fillStyle = '#c33';
    ctx.fillRect(rJ.x, rJ.y, rJ.w, rJ.h);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('<', rL.x + rL.w/2, rL.y + rL.h/2);
    ctx.fillText('>', rR.x + rR.w/2, rR.y + rR.h/2);
    ctx.font = 'bold 16px "Jua",sans-serif';
    ctx.fillText('JUMP', rJ.x + rJ.w/2, rJ.y + rJ.h/2);
    ctx.textBaseline = 'alphabetic';
    ctx.restore();
  }

  function _drawQTE(ctx, W, H){
    const q = S.qte;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, H*0.32, W, 160);
    ctx.fillStyle = '#ffdd66';
    ctx.font = 'bold 28px "Jua",sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Z 연타!', W/2, H*0.32 + 46);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 22px "Jua",sans-serif';
    ctx.fillText('남은: ' + q.tapsLeft + ' / ' + q.total, W/2, H*0.32 + 82);
    // 시간 바
    ctx.fillStyle = '#333';
    ctx.fillRect(40, H*0.32 + 110, W-80, 10);
    ctx.fillStyle = '#e33';
    ctx.fillRect(40, H*0.32 + 110, (W-80) * (q.timeLeft / BOSS_QTE_TIME), 10);
    // 화면 탭으로도 진행 가능하다고 힌트
    ctx.fillStyle = '#aaa';
    ctx.font = '12px sans-serif';
    ctx.fillText('(화면 탭 가능)', W/2, H*0.32 + 138);
  }

  function _drawGrandmaDialog(ctx, W, H){
    const g = S.grandma;
    const lines = [
      '할머니: 로미야... 괜찮니?',
      '로미: 할머니... 저 가야 해요',
      '할머니: 잘 가거라, 내 아가야...'
    ];
    const idx = Math.min(lines.length - 1, Math.floor(g.t / 80));
    const txt = lines[idx];
    // 하단 박스
    ctx.fillStyle = 'rgba(10,5,21,0.88)';
    ctx.fillRect(20, H - 160, W - 40, 110);
    ctx.strokeStyle = '#ffdd66';
    ctx.lineWidth = 2;
    ctx.strokeRect(20, H - 160, W - 40, 110);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px "Jua",sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(txt, W/2, H - 100);
    ctx.fillStyle = '#aaa';
    ctx.font = '12px sans-serif';
    ctx.fillText('(탭 / Enter로 진행)', W/2, H - 70);
  }

  function _drawLevelClear(ctx, W, H){
    const a = Math.min(1, S.lvClearT / 30);
    ctx.fillStyle = 'rgba(0,0,0,' + (0.5*a) + ')';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#ffdd66';
    ctx.font = 'bold 34px "Jua",sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('스테이지 클리어!', W/2, H/2);
  }

  function _drawDeath(ctx, W, H){
    const a = Math.min(1, S.deadT / 30);
    ctx.fillStyle = 'rgba(60,0,0,' + (0.6*a) + ')';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#ff8080';
    ctx.font = 'bold 30px "Jua",sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('다시 시도...', W/2, H/2);
  }

  // ============ 입력 처리 ============
  function handleInput(x, y, kind){
    if(!S.active) return;

    // 컷신(할머니) 진행
    if(S.grandma){
      if(kind === 'tap' || kind === 'down' || kind === 'enter'){
        S.grandma.t += 80; // 한 대사 건너뛰기
        if(S.grandma.t >= 80 * 3){
          S.grandma.advance = true;
        }
      }
      return;
    }

    // QTE 중 탭
    if(S.qte){
      if(kind === 'tap' || kind === 'down'){
        S.qteTapPending = true;
      }
      return;
    }

    // 터치 버튼 히트 테스트
    const r = S._touchRects;
    if(!r) return;
    const inside = (rect) => x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;

    if(kind === 'down' || kind === 'tap'){
      if(inside(r.L)) S.btn.left = true;
      else if(inside(r.R)) S.btn.right = true;
      else if(inside(r.J)) S.btn.jump = true;
    } else if(kind === 'up'){
      // 모두 해제 (간단 버전)
      S.btn.left = false;
      S.btn.right = false;
    }
  }

  // ============ export ============
  window.PlatformerEngine = {
    start, stop,
    update, render, handleInput,
    onEnter, onExit,
    _S: S  // 디버그
  };

  console.log('[UNIFIED] PlatformerEngine 준비');
})();

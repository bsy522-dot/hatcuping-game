// ============================================================
// UNIFIED v4 - DODGE ENGINE (Act1.5 눈피하기 미니게임)
// "별빛 대모험" 스타일: 로미가 상단에서 떨어지는 눈송이를 피한다.
// 성공/실패 모두 스토리는 진행됨 (결과만 storyFlags.dodgeResult에 저장).
// ------------------------------------------------------------
// 인터페이스 (Dispatcher 호환):
//   DodgeEngine.start(opts)          : 명시적 시작
//   DodgeEngine.onEnter(opts)        : Dispatcher.switchMode('dodge', opts) 호출됨
//   DodgeEngine.update()             : 매 프레임
//   DodgeEngine.render(ctx, W, H)    : 매 프레임
//   DodgeEngine.handleInput(x,y,k)   : 'down'|'move'|'up'|'key'
//   DodgeEngine.stop()               : 정리
//
// opts: {
//   duration:    30,     // 버티기 성공 시간 (초)
//   dodgeTarget: 10,     // 피하기 성공 개수 (몇 개 빠져나가면 클리어)
//   maxHp:       3,      // 하트 개수
//   onClear:     fn(),
//   onFail:      fn(),
//   returnTo:    'act1_post_dodge'   // 종료 후 돌아갈 v2_scene id
// }
// ============================================================
(function(){
  'use strict';

  // ---------- 상수 (밸런싱) ----------
  const LOGICAL_W = 420;
  const LOGICAL_H = 750;

  const ROMI_W = 52;
  const ROMI_H = 56;
  const ROMI_Y = LOGICAL_H - 90;  // 하단 중앙
  const ROMI_SPD = 5;             // 키보드 이동 속도 (px/frame)

  const SPAWN_INTERVAL_F = 30;    // 0.5초 @ 60fps
  const SPAWN_MIN = 1;
  const SPAWN_MAX = 3;

  const FLAKE_MIN_SPD = 2;
  const FLAKE_MAX_SPD = 4;
  const FLAKE_MIN_R   = 4;        // 반지름 (크기 8~16px)
  const FLAKE_MAX_R   = 8;

  const HIT_INVULN_F  = 45;       // 피격 후 무적 시간 (0.75초)
  const FADE_OUT_F    = 60;       // 결과 후 1초 페이드

  // BG 파티클 (장식용 작은 눈발)
  const BG_PARTICLES = 40;

  // ---------- 내부 상태 ----------
  let S = null;  // 게임 세션 상태. null = 비활성.

  function resetState(opts){
    opts = opts || {};
    S = {
      // config
      duration:    opts.duration    || 30,
      dodgeTarget: opts.dodgeTarget || 10,
      maxHp:       opts.maxHp       || 3,
      onClear:     typeof opts.onClear === 'function' ? opts.onClear : null,
      onFail:      typeof opts.onFail  === 'function' ? opts.onFail  : null,
      returnTo:    opts.returnTo    || 'act1_post_dodge',

      // live
      t:        0,            // 경과 프레임
      hp:       opts.maxHp || 3,
      dodged:   0,            // 피한 눈송이 수 (화면 아래로 빠진 것)
      flakes:   [],
      spawnTimer: 0,
      bgFlakes: [],
      invuln:   0,            // 남은 무적 프레임

      // 로미
      romi: {
        x: LOGICAL_W/2 - ROMI_W/2,
        y: ROMI_Y,
        vx: 0,       // 키보드 입력에 의한 속도
        targetX: null // 드래그/탭 목표 x
      },

      // 입력 상태
      keyLeft:  false,
      keyRight: false,
      dragging: false,

      // 종료 페이즈
      phase: 'play',  // 'play' | 'clear' | 'fail' | 'done'
      fadeT: 0
    };

    // BG 파티클 초기화
    for(let i=0; i<BG_PARTICLES; i++){
      S.bgFlakes.push({
        x: Math.random()*LOGICAL_W,
        y: Math.random()*LOGICAL_H,
        r: 0.5 + Math.random()*1.8,
        s: 0.3 + Math.random()*1.2,
        a: 0.3 + Math.random()*0.5
      });
    }
  }

  // ---------- 눈송이 스폰 ----------
  function spawnFlakes(){
    const n = SPAWN_MIN + Math.floor(Math.random() * (SPAWN_MAX - SPAWN_MIN + 1));
    for(let i=0; i<n; i++){
      const r = FLAKE_MIN_R + Math.random() * (FLAKE_MAX_R - FLAKE_MIN_R);
      S.flakes.push({
        x: 20 + Math.random() * (LOGICAL_W - 40),
        y: -r - Math.random()*20,
        vy: FLAKE_MIN_SPD + Math.random() * (FLAKE_MAX_SPD - FLAKE_MIN_SPD),
        r: r,
        rot: Math.random() * Math.PI * 2,
        rotSpd: (Math.random() - 0.5) * 0.1
      });
    }
  }

  // ---------- 충돌 ----------
  function collideRomi(flake){
    // 로미 히트박스 (약간 축소)
    const pad = 8;
    const rx = S.romi.x + pad;
    const ry = S.romi.y + pad;
    const rw = ROMI_W - pad*2;
    const rh = ROMI_H - pad*2;
    // AABB vs circle
    const cx = Math.max(rx, Math.min(flake.x, rx+rw));
    const cy = Math.max(ry, Math.min(flake.y, ry+rh));
    const dx = flake.x - cx;
    const dy = flake.y - cy;
    return (dx*dx + dy*dy) <= (flake.r*flake.r);
  }

  // ---------- 사운드 헬퍼 ----------
  function sfx(name){
    if(!window.AM) return;
    try {
      if(name === 'damage' && AM.damage)       AM.damage();
      else if(name === 'victory' && AM.victory) AM.victory();
      else if(name === 'fail' && AM.captureFail) AM.captureFail();
    } catch(e){ /* 조용히 무시 */ }
  }

  // ---------- 종료 처리 ----------
  function finishClear(){
    if(S.phase !== 'play') return;
    S.phase = 'clear';
    S.fadeT = 0;
    if(window.STATE){
      window.STATE.storyFlags = window.STATE.storyFlags || {};
      window.STATE.storyFlags.dodgeResult = 'clear';
    }
    sfx('victory');
  }
  function finishFail(){
    if(S.phase !== 'play') return;
    S.phase = 'fail';
    S.fadeT = 0;
    if(window.STATE){
      window.STATE.storyFlags = window.STATE.storyFlags || {};
      window.STATE.storyFlags.dodgeResult = 'fail';
    }
    sfx('fail');
  }

  function finalizeReturn(){
    // 콜백 우선, 없으면 Dispatcher로 v2_scene 복귀
    const result = S.phase;
    const returnTo = S.returnTo;
    const cbClear = S.onClear;
    const cbFail  = S.onFail;
    S.phase = 'done';

    if(result === 'clear' && cbClear){ try{ cbClear(); }catch(e){ console.error(e); } }
    else if(result === 'fail' && cbFail){ try{ cbFail(); }catch(e){ console.error(e); } }
    else if(window.Dispatcher){
      window.Dispatcher.switchMode('v2_scene', { next: returnTo, dodgeResult: result });
    }
  }

  // ---------- UPDATE ----------
  function update(){
    if(!S) return;

    if(S.phase === 'play'){
      S.t++;

      // 로미 이동 (키보드)
      let vx = 0;
      if(S.keyLeft)  vx -= ROMI_SPD;
      if(S.keyRight) vx += ROMI_SPD;
      S.romi.x += vx;

      // 로미 이동 (드래그 목표)
      if(S.romi.targetX != null){
        const dx = S.romi.targetX - (S.romi.x + ROMI_W/2);
        const step = Math.max(-8, Math.min(8, dx));
        S.romi.x += step;
        if(Math.abs(dx) < 2) S.romi.targetX = null;
      }

      // 로미 경계
      if(S.romi.x < 4) S.romi.x = 4;
      if(S.romi.x > LOGICAL_W - ROMI_W - 4) S.romi.x = LOGICAL_W - ROMI_W - 4;

      // 무적 카운트다운
      if(S.invuln > 0) S.invuln--;

      // 눈송이 스폰
      S.spawnTimer++;
      if(S.spawnTimer >= SPAWN_INTERVAL_F){
        S.spawnTimer = 0;
        spawnFlakes();
      }

      // 눈송이 업데이트
      for(let i = S.flakes.length - 1; i >= 0; i--){
        const f = S.flakes[i];
        f.y += f.vy;
        f.rot += f.rotSpd;

        // 충돌
        if(S.invuln <= 0 && collideRomi(f)){
          S.flakes.splice(i, 1);
          S.hp--;
          S.invuln = HIT_INVULN_F;
          sfx('damage');
          if(S.hp <= 0){ finishFail(); }
          continue;
        }

        // 화면 아래로 빠짐 = 피한 것
        if(f.y - f.r > LOGICAL_H){
          S.flakes.splice(i, 1);
          S.dodged++;
          if(S.dodged >= S.dodgeTarget){ finishClear(); break; }
        }
      }

      // BG 파티클
      for(const b of S.bgFlakes){
        b.y += b.s;
        if(b.y > LOGICAL_H){ b.y = -2; b.x = Math.random()*LOGICAL_W; }
      }

      // 시간 초과 = 버티기 성공
      if(S.t >= S.duration * 60){ finishClear(); }
    }
    else if(S.phase === 'clear' || S.phase === 'fail'){
      // BG 파티클은 계속
      for(const b of S.bgFlakes){
        b.y += b.s;
        if(b.y > LOGICAL_H){ b.y = -2; b.x = Math.random()*LOGICAL_W; }
      }
      S.fadeT++;
      if(S.fadeT >= FADE_OUT_F){
        finalizeReturn();
      }
    }
  }

  // ---------- RENDER ----------
  function render(ctx, W, H){
    if(!S){ return; }

    // ===== 배경: 성 창문 뷰 =====
    drawBackground(ctx, W, H);

    // ===== BG 파티클 (뒤쪽 눈발) =====
    for(const b of S.bgFlakes){
      ctx.fillStyle = 'rgba(255,255,255,' + b.a.toFixed(2) + ')';
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI*2);
      ctx.fill();
    }

    // ===== 눈송이 (전경, 실제 위험) =====
    for(const f of S.flakes){
      drawSnowflake(ctx, f);
    }

    // ===== 로미 =====
    drawRomi(ctx, S.romi.x, S.romi.y, S.invuln > 0 && (S.invuln % 6 < 3));

    // ===== UI =====
    drawUI(ctx, W, H);

    // ===== 결과 오버레이 =====
    if(S.phase === 'clear' || S.phase === 'fail'){
      drawResult(ctx, W, H);
    }
  }

  function drawBackground(ctx, W, H){
    // 성 내부 - 창문으로 보이는 눈내리는 밤
    // 깊은 파란 그라데이션
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#0a1d3f');
    g.addColorStop(0.6, '#132a5c');
    g.addColorStop(1,   '#1d3a78');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // 창문 프레임 (장식)
    ctx.strokeStyle = 'rgba(120,90,180,0.35)';
    ctx.lineWidth = 4;
    ctx.strokeRect(14, 14, W-28, H-28);
    // 창틀 십자
    ctx.beginPath();
    ctx.moveTo(W/2, 14); ctx.lineTo(W/2, H-14);
    ctx.moveTo(14, H*0.42); ctx.lineTo(W-14, H*0.42);
    ctx.stroke();

    // 저 멀리 달
    ctx.fillStyle = 'rgba(255,240,200,0.85)';
    ctx.beginPath();
    ctx.arc(W*0.78, H*0.18, 28, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,240,200,0.2)';
    ctx.beginPath();
    ctx.arc(W*0.78, H*0.18, 42, 0, Math.PI*2);
    ctx.fill();

    // 하단 바닥 (성 바닥)
    ctx.fillStyle = 'rgba(40,20,70,0.55)';
    ctx.fillRect(0, H - 40, W, 40);
  }

  function drawSnowflake(ctx, f){
    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.rotate(f.rot);

    // 외곽 발광
    ctx.fillStyle = 'rgba(200,230,255,0.3)';
    ctx.beginPath();
    ctx.arc(0, 0, f.r + 2, 0, Math.PI*2);
    ctx.fill();

    // 중앙 흰 원
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, f.r * 0.6, 0, Math.PI*2);
    ctx.fill();

    // 6방 결정 패턴
    ctx.strokeStyle = '#e8f3ff';
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    for(let i=0; i<6; i++){
      const a = i * Math.PI / 3;
      const x = Math.cos(a) * f.r;
      const y = Math.sin(a) * f.r;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(x, y);
      ctx.stroke();
      // 작은 가지
      const bx = Math.cos(a) * f.r * 0.6;
      const by = Math.sin(a) * f.r * 0.6;
      const a2 = a + Math.PI/6;
      const a3 = a - Math.PI/6;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + Math.cos(a2)*f.r*0.25, by + Math.sin(a2)*f.r*0.25);
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + Math.cos(a3)*f.r*0.25, by + Math.sin(a3)*f.r*0.25);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawRomi(ctx, x, y, flicker){
    // 이미지 있으면 사용
    const img = (window.IM && (window.IM.rs || window.IM.romi)) || null;
    if(img && img.complete && img.naturalWidth > 0){
      if(flicker) ctx.globalAlpha = 0.5;
      ctx.drawImage(img, x, y, ROMI_W, ROMI_H);
      ctx.globalAlpha = 1;
      return;
    }

    // 플레이스홀더: 핑크 원 + 리본
    if(flicker) ctx.globalAlpha = 0.5;

    // 그림자
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(x + ROMI_W/2, y + ROMI_H - 2, ROMI_W*0.4, 4, 0, 0, Math.PI*2);
    ctx.fill();

    // 몸통 (핑크)
    const cx = x + ROMI_W/2;
    const cy = y + ROMI_H/2;
    ctx.fillStyle = '#FFB3D1';
    ctx.beginPath();
    ctx.arc(cx, cy, ROMI_W*0.42, 0, Math.PI*2);
    ctx.fill();

    // 볼터치
    ctx.fillStyle = '#FF6B9D';
    ctx.beginPath();
    ctx.arc(cx - 9, cy + 4, 3, 0, Math.PI*2);
    ctx.arc(cx + 9, cy + 4, 3, 0, Math.PI*2);
    ctx.fill();

    // 눈
    ctx.fillStyle = '#2a1140';
    ctx.beginPath();
    ctx.arc(cx - 6, cy - 3, 2.5, 0, Math.PI*2);
    ctx.arc(cx + 6, cy - 3, 2.5, 0, Math.PI*2);
    ctx.fill();

    // 리본 (머리 위)
    ctx.fillStyle = '#ff4f8a';
    ctx.beginPath();
    ctx.moveTo(cx, cy - ROMI_H*0.35);
    ctx.lineTo(cx - 8, cy - ROMI_H*0.28);
    ctx.lineTo(cx - 4, cy - ROMI_H*0.22);
    ctx.lineTo(cx + 4, cy - ROMI_H*0.22);
    ctx.lineTo(cx + 8, cy - ROMI_H*0.28);
    ctx.closePath();
    ctx.fill();

    ctx.globalAlpha = 1;
  }

  function drawUI(ctx, W, H){
    // 상단 패널 배경
    ctx.fillStyle = 'rgba(10,5,25,0.55)';
    ctx.fillRect(0, 0, W, 44);

    // 피하기 카운터
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px "Jua", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('피하기 ' + S.dodged + '/' + S.dodgeTarget, 12, 22);

    // 남은 시간
    const remain = Math.max(0, Math.ceil(S.duration - S.t/60));
    ctx.textAlign = 'center';
    ctx.fillStyle = '#FFD54F';
    ctx.fillText(remain + '초', W/2, 22);

    // HP 하트
    ctx.textAlign = 'right';
    for(let i=0; i<S.maxHp; i++){
      drawHeart(ctx, W - 14 - i*22, 22, 9, i < S.hp);
    }
    ctx.textBaseline = 'alphabetic';
  }

  function drawHeart(ctx, cx, cy, r, filled){
    ctx.save();
    ctx.translate(cx, cy);
    ctx.beginPath();
    ctx.moveTo(0, r*0.5);
    ctx.bezierCurveTo(r, -r*0.3, r*0.3, -r, 0, -r*0.3);
    ctx.bezierCurveTo(-r*0.3, -r, -r, -r*0.3, 0, r*0.5);
    ctx.closePath();
    if(filled){
      ctx.fillStyle = '#ff4f8a';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    } else {
      ctx.strokeStyle = 'rgba(255,120,170,0.6)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawResult(ctx, W, H){
    const a = Math.min(0.75, S.fadeT / FADE_OUT_F * 0.75);
    ctx.fillStyle = 'rgba(0,0,0,' + a.toFixed(3) + ')';
    ctx.fillRect(0, 0, W, H);

    const mainA = Math.min(1, S.fadeT / 20);
    ctx.globalAlpha = mainA;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if(S.phase === 'clear'){
      ctx.fillStyle = '#FFD54F';
      ctx.font = 'bold 36px "Jua", sans-serif';
      ctx.fillText('눈을 피했다!', W/2, H/2 - 20);
      ctx.fillStyle = '#fff';
      ctx.font = '16px "Jua", sans-serif';
      ctx.fillText('로미는 무사히 창문을 지나갔다', W/2, H/2 + 18);
    } else {
      ctx.fillStyle = '#ff7aa8';
      ctx.font = 'bold 32px "Jua", sans-serif';
      ctx.fillText('으앗… 차가워!', W/2, H/2 - 20);
      ctx.fillStyle = '#fff';
      ctx.font = '16px "Jua", sans-serif';
      ctx.fillText('그래도 멈출 수 없어. 계속 가자', W/2, H/2 + 18);
    }
    ctx.globalAlpha = 1;
    ctx.textBaseline = 'alphabetic';
  }

  // ---------- INPUT ----------
  function handleInput(x, y, kind){
    if(!S || S.phase !== 'play') return;

    if(kind === 'down'){
      S.dragging = true;
      S.romi.targetX = x;
    } else if(kind === 'move'){
      if(S.dragging){
        S.romi.targetX = x;
      }
    } else if(kind === 'up'){
      S.dragging = false;
      // 탭(short click)이어도 targetX가 이미 설정됐으므로 그대로 자연스럽게 이동함
    } else if(kind === 'key'){
      // x = 'left'|'right'|'leftup'|'rightup'
      if(x === 'left')      S.keyLeft  = true;
      else if(x === 'right') S.keyRight = true;
      else if(x === 'leftup')  S.keyLeft  = false;
      else if(x === 'rightup') S.keyRight = false;
    }
  }

  // 키보드 글로벌 리스너 (Dispatcher가 key 이벤트를 전달 안 해줄 수도 있어 자체 등록)
  function installKeyboard(){
    if(window.__dodgeKbdInstalled) return;
    window.__dodgeKbdInstalled = true;
    window.addEventListener('keydown', function(e){
      if(!S || S.phase !== 'play') return;
      if(e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A'){  S.keyLeft = true; }
      else if(e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D'){ S.keyRight = true; }
    });
    window.addEventListener('keyup', function(e){
      if(!S) return;
      if(e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A'){  S.keyLeft = false; }
      else if(e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D'){ S.keyRight = false; }
    });
  }

  // ---------- LIFECYCLE ----------
  function start(opts){
    resetState(opts);
    installKeyboard();
    console.log('[DodgeEngine] start', {
      duration: S.duration, dodgeTarget: S.dodgeTarget, maxHp: S.maxHp, returnTo: S.returnTo
    });
  }

  function onEnter(opts){
    start(opts || {});
  }

  function onExit(nextMode){
    // 정리 (혹시 중간에 다른 모드로 강제 전환된 경우)
    S = null;
  }

  function stop(){
    S = null;
  }

  // ---------- 등록 ----------
  window.DodgeEngine = {
    start: start,
    stop:  stop,
    onEnter: onEnter,
    onExit:  onExit,
    update:  update,
    render:  render,
    handleInput: handleInput,
    // 디버그용
    _getState(){ return S; }
  };

  console.log('[UNIFIED] DodgeEngine 준비 완료');
})();

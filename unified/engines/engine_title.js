// ============================================================
// UNIFIED v4 - TITLE SCREEN ENGINE
// rpg-v3/game-v2 스타일: 핑크 그라데이션 + 로미/하츄핑 3D + 새 게임 버튼
// ============================================================
(function(){
  'use strict';

  const S = {
    active: false,
    t: 0,
    hearts: [],
    btnRect: null,
    contBtnRect: null,
    onStart: null
  };

  function _initHearts(W, H){
    if(S.hearts.length) return;
    for(let i=0; i<22; i++){
      S.hearts.push({
        x: Math.random() * W,
        y: Math.random() * H,
        s: 8 + Math.random() * 14,
        sp: 0.15 + Math.random() * 0.4,
        ph: Math.random() * Math.PI * 2,
        alpha: 0.15 + Math.random() * 0.35
      });
    }
  }

  function onEnter(opts){
    S.active = true;
    S.t = 0;
    S.onStart = (opts && opts.onStart) || null;
  }

  function onExit(){
    S.active = false;
  }

  function update(){
    if(!S.active) return;
    S.t++;
  }

  function render(ctx, W, H){
    if(!ctx && window.UCanvas){ ctx = window.UCanvas.ctx; W = window.UCanvas.W; H = window.UCanvas.H; }
    if(!ctx) return;
    W = W || 420; H = H || 750;

    _initHearts(W, H);

    // 그라데이션 배경 (핑크 → 퍼플)
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0,    '#FFB6D9');
    g.addColorStop(0.5,  '#FF8BC7');
    g.addColorStop(1,    '#D96FB8');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // 하트 플로트
    S.hearts.forEach(h => {
      h.y -= h.sp;
      if(h.y < -20){ h.y = H + 10; h.x = Math.random() * W; }
      const wobble = Math.sin((S.t + h.ph*60)*0.04) * 3;
      _drawHeart(ctx, h.x + wobble, h.y, h.s, `rgba(255,100,170,${h.alpha})`);
    });

    // 대형 중앙 하트 (로고 위)
    _drawHeart(ctx, W/2, 70, 46, 'rgba(255,255,255,0.92)');

    // 타이틀 텍스트 (그림자 효과)
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.font = 'bold 38px "Jua", sans-serif';
    ctx.fillStyle = 'rgba(130,40,90,0.3)';
    ctx.fillText('사랑의 하츄핑', W/2 + 2, 150 + 2);
    ctx.fillStyle = '#fff';
    ctx.fillText('사랑의 하츄핑', W/2, 150);

    ctx.font = 'bold 18px "Jua", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.fillText('UNIFIED v4 ✨', W/2, 178);
    ctx.font = '14px "Jua", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.fillText('3 게임 융합 · 영화 감성 프리퀄', W/2, 200);

    // 캐릭터 스프라이트 (ROMI_P, HATCHU_P 3D 렌더)
    const IM = window.IM || {};
    const bob = Math.sin(S.t * 0.05) * 4;
    // 로미 (왼쪽)
    if(IM.rp && IM.rp.complete){
      ctx.drawImage(IM.rp, 30, 240 + bob, 180, 240);
    } else if(IM.rs && IM.rs.complete){
      ctx.drawImage(IM.rs, 50, 260 + bob, 140, 200);
    }
    // 하츄핑 (오른쪽)
    if(IM.hp && IM.hp.complete){
      ctx.drawImage(IM.hp, 210, 260 + bob*1.2, 180, 220);
    } else if(IM.hs && IM.hs.complete){
      ctx.drawImage(IM.hs, 230, 280 + bob*1.2, 140, 180);
    }

    // 새 게임 버튼
    const btnW = 240, btnH = 56;
    const btnX = (W - btnW) / 2;
    const btnY = 560;
    const pulse = 1 + Math.sin(S.t * 0.1) * 0.03;
    S.btnRect = { x:btnX, y:btnY, w:btnW, h:btnH };
    ctx.save();
    ctx.translate(btnX + btnW/2, btnY + btnH/2);
    ctx.scale(pulse, pulse);
    _roundRect(ctx, -btnW/2, -btnH/2, btnW, btnH, 28);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = '#FF5BA5';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.font = 'bold 22px "Jua", sans-serif';
    ctx.fillStyle = '#FF5BA5';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✨ 새 모험!', 0, 0);
    ctx.restore();

    // 이어하기 버튼 (저장 있으면)
    const hasSave = !!(window.UnifiedSave && window.UnifiedSave.exists && window.UnifiedSave.exists());
    if(hasSave){
      const cbW = 180, cbH = 40;
      const cbX = (W - cbW) / 2;
      const cbY = btnY + btnH + 14;
      S.contBtnRect = { x:cbX, y:cbY, w:cbW, h:cbH };
      _roundRect(ctx, cbX, cbY, cbW, cbH, 20);
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,91,165,0.7)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.font = 'bold 16px "Jua", sans-serif';
      ctx.fillStyle = '#B23366';
      ctx.fillText('💾 이어하기', cbX + cbW/2, cbY + cbH/2);
    } else { S.contBtnRect = null; }

    // 푸터
    ctx.textBaseline = 'alphabetic';
    ctx.font = '11px "Jua", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.textAlign = 'center';
    ctx.fillText('PRISM Studio © 2026', W/2, H - 14);
  }

  function handleInput(x, y, kind){
    if(!S.active) return;
    if(kind !== 'down' && kind !== 'tap' && kind !== 'up') return;
    const b = S.btnRect;
    if(b && x >= b.x && x <= b.x+b.w && y >= b.y && y <= b.y+b.h){
      _startNew();
      return;
    }
    const c = S.contBtnRect;
    if(c && x >= c.x && x <= c.x+c.w && y >= c.y && y <= c.y+c.h){
      _continue();
      return;
    }
  }

  function _startNew(){
    S.active = false;
    if(window.StoryRouter){
      window.StoryRouter.play('act1_morning');
    } else if(S.onStart){ S.onStart('new'); }
  }

  function _continue(){
    S.active = false;
    if(window.UnifiedSave && window.UnifiedSave.load){
      window.UnifiedSave.load();
    }
    if(window.StoryRouter){
      const last = (window.STATE && window.STATE.currentStory) || 'act1_morning';
      window.StoryRouter.play(last);
    }
  }

  // ---- helpers ----
  function _drawHeart(ctx, cx, cy, size, color){
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(size/30, size/30);
    ctx.beginPath();
    ctx.moveTo(0, 8);
    ctx.bezierCurveTo(-15, -5, -15, -20, 0, -8);
    ctx.bezierCurveTo(15, -20, 15, -5, 0, 8);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
  }

  function _roundRect(ctx, x, y, w, h, r){
    ctx.beginPath();
    ctx.moveTo(x+r, y);
    ctx.arcTo(x+w, y,   x+w, y+h, r);
    ctx.arcTo(x+w, y+h, x,   y+h, r);
    ctx.arcTo(x,   y+h, x,   y,   r);
    ctx.arcTo(x,   y,   x+w, y,   r);
    ctx.closePath();
  }

  window.TitleScreen = { onEnter, onExit, update, render, handleInput };
  console.log('[UNIFIED] TitleScreen 로드 완료');
})();

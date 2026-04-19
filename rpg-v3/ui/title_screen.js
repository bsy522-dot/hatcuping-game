// title_screen.js — 타이틀 화면
// 그라디언트 + 하트 파티클 + 4 버튼
// window.TitleScreen = { draw, update, handleClick, init }

(function(){
  const state = {
    particles: [],
    t: 0,
    buttons: [],          // [{label, y, enabled, id}]
    onSelect: null,
  };

  function init(onSelect){
    state.onSelect = onSelect || null;
    // 파티클 20개
    state.particles = [];
    for (let i=0;i<20;i++){
      state.particles.push({
        x: Math.random()*420,
        y: Math.random()*750,
        s: 10 + Math.random()*14,
        vy: -(0.3 + Math.random()*0.6),
        a: 0.4 + Math.random()*0.5,
      });
    }
  }

  function roundRect(ctx,x,y,w,h,r){
    ctx.beginPath();
    ctx.moveTo(x+r,y);
    ctx.arcTo(x+w,y,x+w,y+h,r);
    ctx.arcTo(x+w,y+h,x,y+h,r);
    ctx.arcTo(x,y+h,x,y,r);
    ctx.arcTo(x,y,x+w,y,r);
    ctx.closePath();
  }

  function hasSave(){
    try {
      if (window.SaveGame && typeof window.SaveGame.exists === 'function'){
        return !!window.SaveGame.exists();
      }
      return !!localStorage.getItem('hatcuping_save');
    } catch(e){ return false; }
  }

  function update(dt){
    state.t += dt || 16;
    state.particles.forEach(p => {
      p.y += p.vy;
      if (p.y < -20){
        p.y = 770;
        p.x = Math.random()*420;
      }
    });
  }

  function draw(ctx, W, H){
    // 그라디언트 배경
    const g = ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0, '#FF6B9D');
    g.addColorStop(0.5, '#FFD54F');
    g.addColorStop(1, '#4FC3F7');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // 하트 파티클
    state.particles.forEach(p => {
      ctx.globalAlpha = p.a;
      ctx.fillStyle = '#fff';
      ctx.font = p.s+'px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('💖', p.x, p.y);
    });
    ctx.globalAlpha = 1;

    // 타이틀
    const titleY = H*0.22;
    ctx.textAlign = 'center';
    // 그림자
    ctx.fillStyle = 'rgba(42,21,64,0.4)';
    ctx.font = 'bold 32px sans-serif';
    ctx.fillText('사랑의 하츄핑 RPG v3 ✨', W/2+2, titleY+2);
    ctx.fillStyle = '#fff';
    ctx.fillText('사랑의 하츄핑 RPG v3 ✨', W/2, titleY);
    // 서브
    ctx.fillStyle = '#2a1540';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('원작 스토리 완전판', W/2, titleY+28);

    // 버튼들
    const saveExists = hasSave();
    const items = [
      { label:'🎮  새 게임',  id:'new',    enabled:true },
      { label:'💾  이어하기', id:'load',   enabled:saveExists },
      { label:'📖  도감',     id:'dex',    enabled:true },
      { label:'✨  크레딧',   id:'credit', enabled:true },
    ];
    state.buttons = [];
    const btnW = 240, btnH = 52;
    const startY = H*0.48;
    items.forEach((it, i) => {
      const bx = (W-btnW)/2;
      const by = startY + i * (btnH + 12);
      state.buttons.push({ ...it, x:bx, y:by, w:btnW, h:btnH });

      // 버튼 박스
      ctx.fillStyle = it.enabled ? '#fff' : 'rgba(255,255,255,0.3)';
      roundRect(ctx, bx, by, btnW, btnH, 14); ctx.fill();
      ctx.strokeStyle = it.enabled ? '#FF6B9D' : '#888';
      ctx.lineWidth = 3;
      roundRect(ctx, bx, by, btnW, btnH, 14); ctx.stroke();
      ctx.fillStyle = it.enabled ? '#2a1540' : '#777';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(it.label, W/2, by+32);
    });

    // 하단 버전
    ctx.fillStyle = 'rgba(42,21,64,0.7)';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PRISM Studio © 2026 · Made with 💖', W/2, H-14);
  }

  function handleClick(x, y){
    for (const b of state.buttons){
      if (!b.enabled) continue;
      if (x >= b.x && x <= b.x+b.w && y >= b.y && y <= b.y+b.h){
        if (state.onSelect) state.onSelect(b.id);
        return b.id;
      }
    }
    return null;
  }

  window.TitleScreen = { draw, update, handleClick, init };
})();

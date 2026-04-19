// hud.js — 전투/맵 공용 HUD (포켓몬식 + 카톡풍)
// drawBattleHUD / drawMapHUD / drawMiniMap

(function(){
  const COLORS = {
    pink:'#FF6B9D', yellow:'#FFD54F', green:'#66BB6A',
    blue:'#4FC3F7', dark:'#2a1540', white:'#fff'
  };

  // 타입 배지 색
  const TYPE_COLORS = {
    '사랑':'#FF6B9D','불':'#FF7043','물':'#4FC3F7','풀':'#66BB6A',
    '번개':'#FFD54F','얼음':'#B3E5FC','어둠':'#5E35B1','빛':'#FFF176',
    '바람':'#80DEEA','땅':'#A1887F'
  };

  function roundRect(ctx,x,y,w,h,r){
    ctx.beginPath();
    ctx.moveTo(x+r,y);
    ctx.arcTo(x+w,y,x+w,y+h,r);
    ctx.arcTo(x+w,y+h,x,y+h,r);
    ctx.arcTo(x,y+h,x,y,r);
    ctx.arcTo(x,y,x+w,y,r);
    ctx.closePath();
  }

  function drawBar(ctx, x, y, w, h, ratio, color){
    // 배경
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    roundRect(ctx, x, y, w, h, h/2); ctx.fill();
    // 채움
    const fw = Math.max(0, Math.min(1, ratio)) * (w - 4);
    ctx.fillStyle = color;
    roundRect(ctx, x+2, y+2, fw, h-4, (h-4)/2); ctx.fill();
  }

  function typeBadge(ctx, x, y, type){
    const c = TYPE_COLORS[type] || '#888';
    const w = 48, h = 16;
    ctx.fillStyle = c;
    roundRect(ctx, x, y, w, h, h/2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(type, x + w/2, y + 11);
  }

  // Battle HUD
  // enemy: {name, lv, hp, maxHp, type}
  // player: {name, lv, hp, maxHp, exp, maxExp, type}
  function drawBattleHUD(ctx, W, H, enemy, player){
    // 적 (우상단)
    if (enemy){
      const bw = 180, bh = 54;
      const bx = W - bw - 10, by = 10;
      ctx.fillStyle = 'rgba(42,21,64,0.85)';
      roundRect(ctx, bx, by, bw, bh, 10); ctx.fill();
      ctx.strokeStyle = '#FFD54F'; ctx.lineWidth = 2;
      roundRect(ctx, bx, by, bw, bh, 10); ctx.stroke();

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(enemy.name || '???', bx+10, by+16);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#FFD54F';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('Lv.'+(enemy.lv||1), bx+bw-10, by+16);

      // HP 바
      drawBar(ctx, bx+10, by+22, bw-20, 10, (enemy.hp||0)/(enemy.maxHp||1), COLORS.green);
      // 타입
      if (enemy.type) typeBadge(ctx, bx+10, by+36, enemy.type);
    }

    // 플레이어 (좌하단)
    if (player){
      const bw = 200, bh = 64;
      const bx = 10, by = H - bh - 10;
      ctx.fillStyle = 'rgba(42,21,64,0.9)';
      roundRect(ctx, bx, by, bw, bh, 10); ctx.fill();
      ctx.strokeStyle = '#FF6B9D'; ctx.lineWidth = 2;
      roundRect(ctx, bx, by, bw, bh, 10); ctx.stroke();

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(player.name || '로미', bx+10, by+16);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#FFD54F';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('Lv.'+(player.lv||1), bx+bw-10, by+16);

      // HP
      drawBar(ctx, bx+10, by+22, bw-20, 10, (player.hp||0)/(player.maxHp||1), COLORS.green);
      // HP 숫자
      ctx.fillStyle = '#fff';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText((player.hp||0)+'/'+(player.maxHp||1), bx+bw-10, by+40);
      // EXP
      drawBar(ctx, bx+10, by+44, bw-20, 6, (player.exp||0)/(player.maxExp||1), COLORS.blue);
      // 타입
      if (player.type) typeBadge(ctx, bx+10, by+54, player.type);
    }
  }

  // Map HUD
  // info: {hearts, badges:[bool x8], location, leader}
  function drawMapHUD(ctx, W, H, info){
    info = info || {};
    // 상단 바
    const topH = 40;
    ctx.fillStyle = 'rgba(42,21,64,0.9)';
    ctx.fillRect(0, 0, W, topH);
    // 하트
    ctx.fillStyle = '#FF6B9D';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('💖 × '+(info.hearts||0), 10, 26);
    // 배지 8슬롯
    const badges = info.badges || [];
    const bx0 = 110;
    for (let i=0;i<8;i++){
      const bx = bx0 + i*22, by = 12;
      ctx.beginPath();
      ctx.arc(bx+8, by+8, 8, 0, Math.PI*2);
      if (badges[i]){
        ctx.fillStyle = '#FFD54F'; ctx.fill();
        ctx.strokeStyle = '#FF6B9D';
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fill();
        ctx.strokeStyle = '#555';
      }
      ctx.lineWidth = 1.5; ctx.stroke();
    }
    // 메뉴 버튼
    ctx.fillStyle = '#FFD54F';
    roundRect(ctx, W-50, 8, 42, 24, 6); ctx.fill();
    ctx.fillStyle = '#2a1540';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('≡ 메뉴', W-29, 24);

    // 하단 바
    const botH = 48;
    ctx.fillStyle = 'rgba(42,21,64,0.9)';
    ctx.fillRect(0, H-botH, W, botH);
    // 리더 스프라이트 자리 (원형)
    ctx.beginPath();
    ctx.arc(26, H-botH/2, 18, 0, Math.PI*2);
    ctx.fillStyle = '#FF6B9D'; ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText((info.leader||'로').charAt(0), 26, H-botH/2+5);

    // 위치명
    ctx.fillStyle = '#FFD54F';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('📍 '+(info.location||'티니핑 마을'), 54, H-botH/2-2);
    ctx.fillStyle = '#fff';
    ctx.font = '11px sans-serif';
    ctx.fillText(info.leader ? '리더: '+info.leader : '', 54, H-botH/2+14);
  }

  // 미니맵 (좌상단 아래 or 우상단)
  // map: {grid:[[0|1]], px, py, w, h}
  function drawMiniMap(ctx, W, H, map){
    if (!map || !map.grid) return;
    const mw = 80, mh = 60;
    const mx = W - mw - 10, my = 46;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    roundRect(ctx, mx, my, mw, mh, 6); ctx.fill();
    ctx.strokeStyle = '#FFD54F'; ctx.lineWidth = 1;
    roundRect(ctx, mx, my, mw, mh, 6); ctx.stroke();

    const cols = map.grid[0].length;
    const rows = map.grid.length;
    const cw = (mw-4)/cols, ch = (mh-4)/rows;
    for (let r=0;r<rows;r++){
      for (let c=0;c<cols;c++){
        const v = map.grid[r][c];
        ctx.fillStyle = v === 1 ? '#66BB6A' : (v === 2 ? '#4FC3F7' : '#555');
        ctx.fillRect(mx+2+c*cw, my+2+r*ch, cw, ch);
      }
    }
    // 플레이어 위치
    if (map.px != null && map.py != null){
      ctx.fillStyle = '#FF6B9D';
      ctx.beginPath();
      ctx.arc(mx+2+map.px*cw+cw/2, my+2+map.py*ch+ch/2, 2.5, 0, Math.PI*2);
      ctx.fill();
    }
  }

  window.HUD = { drawBattleHUD, drawMapHUD, drawMiniMap };
})();

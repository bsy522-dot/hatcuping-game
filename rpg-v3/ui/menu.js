// menu.js — 하단 고정 4탭 메뉴 (도감/가방/티니핑/저장)
// window.Menu = { open, close, switchTab, draw, handleClick }

(function(){
  const TABS = [
    { id:'pokedex', label:'도감',  icon:'📖', color:'#4FC3F7' },
    { id:'bag',     label:'가방',  icon:'🎒', color:'#66BB6A' },
    { id:'party',   label:'티니핑', icon:'💖', color:'#FF6B9D' },
    { id:'save',    label:'저장',  icon:'💾', color:'#FFD54F' },
  ];

  const state = {
    open: false,
    tab: 'pokedex',
    party: [], // [{id,name,lv,hp,maxHp,type} x6]
    bag: [],   // [{id,name,count,icon}]
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

  function open(tab){
    state.open = true;
    if (tab) state.tab = tab;
  }
  function close(){ state.open = false; }
  function switchTab(id){ state.tab = id; }
  function setData(data){
    if (data.party) state.party = data.party;
    if (data.bag) state.bag = data.bag;
  }

  function draw(ctx, W, H){
    if (!state.open) return;
    // 오버레이
    ctx.fillStyle = 'rgba(42,21,64,0.95)';
    ctx.fillRect(0, 0, W, H);

    // 상단 타이틀 바
    const titleH = 50;
    ctx.fillStyle = '#FF6B9D';
    ctx.fillRect(0, 0, W, titleH);
    const curTab = TABS.find(t => t.id === state.tab) || TABS[0];
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(curTab.icon + ' ' + curTab.label, W/2, 32);
    // 닫기 X
    ctx.fillStyle = '#2a1540';
    roundRect(ctx, W-42, 12, 30, 28, 6); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('✕', W-27, 32);

    // 탭별 컨텐츠
    const contentTop = titleH + 10;
    const contentH = H - titleH - 70; // 하단 탭바 자리
    if (state.tab === 'pokedex'){
      drawPokedex(ctx, W, contentTop, contentH);
    } else if (state.tab === 'bag'){
      drawBag(ctx, W, contentTop, contentH);
    } else if (state.tab === 'party'){
      drawParty(ctx, W, contentTop, contentH);
    } else if (state.tab === 'save'){
      drawSave(ctx, W, contentTop, contentH);
    }

    // 하단 탭바
    drawTabBar(ctx, W, H);
  }

  const DEX_TABS = ['royal','normal','villain','legend'];
  const DEX_TAB_LABELS = {royal:'로열',normal:'일반',villain:'빌런',legend:'레전드'};
  let dexSubTab = 'royal';

  function drawPokedex(ctx, W, y, h){
    const dex = window.TINIPING_DEX || [];
    const pd = (window.STATE && window.STATE.pokedex) || {seen:{}, caught:{}};
    // 서브탭
    const subH = 28, subY = y;
    DEX_TABS.forEach((t, i) => {
      const tw = W / DEX_TABS.length;
      const tx = i * tw;
      const active = t === dexSubTab;
      ctx.fillStyle = active ? '#FF6B9D' : 'rgba(255,255,255,0.08)';
      ctx.fillRect(tx+2, subY, tw-4, subH);
      ctx.fillStyle = '#fff';
      ctx.font = (active?'bold ':'')+'12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(DEX_TAB_LABELS[t]+' ('+dex.filter(s=>s.class===t).length+')', tx+tw/2, subY+18);
    });
    // 그리드
    const list = dex.filter(s => s.class === dexSubTab);
    const gy = subY + subH + 8;
    const cols = 4;
    const cellW = (W - 40) / cols;
    const cellH = 70;
    list.forEach((s, i) => {
      const col = i % cols, row = Math.floor(i / cols);
      const cx = 16 + col * (cellW + 2), cy = gy + row * (cellH + 4);
      if (cy + cellH > y + h - 20) return;
      const caught = !!pd.caught[s.no] || !!pd.caught[s.name];
      const seen = !!pd.seen[s.no] || !!pd.seen[s.name] || caught;
      const color = (window.TYPE_COLORS && window.TYPE_COLORS[s.type&&s.type[0]]) || '#888';
      ctx.fillStyle = seen ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.3)';
      roundRect(ctx, cx, cy, cellW, cellH, 6); ctx.fill();
      ctx.strokeStyle = seen ? color : '#444';
      ctx.lineWidth = 2;
      roundRect(ctx, cx, cy, cellW, cellH, 6); ctx.stroke();
      ctx.fillStyle = '#aaa';
      ctx.font = '9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No.'+s.no, cx+cellW/2, cy+12);
      ctx.fillStyle = seen ? '#fff' : '#666';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(caught ? s.name : (seen ? s.name : '???'), cx+cellW/2, cy+32);
      if (caught){
        ctx.fillStyle = color;
        ctx.font = '9px sans-serif';
        ctx.fillText(s.emotion||'', cx+cellW/2, cy+48);
        ctx.fillStyle = '#FFD54F';
        ctx.fillText('✓', cx+cellW-10, cy+12);
      }
    });
    // 카운트
    const total = list.length;
    const caughtN = list.filter(s => pd.caught[s.no] || pd.caught[s.name]).length;
    ctx.fillStyle = '#FFD54F';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('포획 '+caughtN+' / '+total, W/2, y + h - 8);
  }

  function drawBag(ctx, W, y, h){
    const items = state.bag;
    if (items.length === 0){
      ctx.fillStyle = '#fff';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('가방이 비어있어요 🎒', W/2, y+h/2);
      return;
    }
    items.forEach((it, i) => {
      const rowY = y + 10 + i*54;
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      roundRect(ctx, 12, rowY, W-24, 48, 8); ctx.fill();
      ctx.fillStyle = '#FFD54F';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(it.icon||'🎁', 20, rowY+32);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(it.name, 58, rowY+22);
      ctx.fillStyle = '#FFD54F';
      ctx.font = '12px sans-serif';
      ctx.fillText('× '+it.count, 58, rowY+40);
    });
  }

  function drawParty(ctx, W, y, h){
    // 6슬롯 2x3
    const slotW = (W - 48) / 2;
    const slotH = 80;
    for (let i=0;i<6;i++){
      const col = i % 2, row = Math.floor(i/2);
      const sx = 16 + col * (slotW + 16);
      const sy = y + 10 + row * (slotH + 10);
      const p = state.party[i];
      ctx.fillStyle = p ? 'rgba(255,107,157,0.25)' : 'rgba(255,255,255,0.08)';
      roundRect(ctx, sx, sy, slotW, slotH, 10); ctx.fill();
      ctx.strokeStyle = p ? '#FF6B9D' : '#444';
      ctx.lineWidth = 2;
      roundRect(ctx, sx, sy, slotW, slotH, 10); ctx.stroke();

      if (p){
        // 아바타
        ctx.beginPath();
        ctx.arc(sx+28, sy+40, 22, 0, Math.PI*2);
        ctx.fillStyle = '#FF6B9D'; ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText((p.name||'?').charAt(0), sx+28, sy+46);

        // 정보
        ctx.textAlign = 'left';
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 13px sans-serif';
        ctx.fillText(p.name, sx+58, sy+22);
        ctx.fillStyle = '#FFD54F';
        ctx.font = '11px sans-serif';
        ctx.fillText('Lv.'+(p.lv||1), sx+58, sy+38);
        // HP
        const ratio = (p.hp||0)/(p.maxHp||1);
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        roundRect(ctx, sx+58, sy+46, slotW-68, 8, 4); ctx.fill();
        ctx.fillStyle = '#66BB6A';
        roundRect(ctx, sx+60, sy+48, (slotW-72)*ratio, 4, 2); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = '10px sans-serif';
        ctx.fillText((p.hp||0)+'/'+(p.maxHp||1), sx+58, sy+68);
      } else {
        ctx.fillStyle = '#666';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('빈 슬롯', sx+slotW/2, sy+slotH/2+4);
      }
    }
  }

  function drawSave(ctx, W, y, h){
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('💾 게임 저장', W/2, y+40);

    const btns = [
      { label:'현재 상태 저장', color:'#66BB6A' },
      { label:'이어하기',       color:'#4FC3F7' },
      { label:'초기화',         color:'#FF6B9D' },
    ];
    btns.forEach((b, i) => {
      const by = y + 80 + i*60;
      ctx.fillStyle = b.color;
      roundRect(ctx, 40, by, W-80, 46, 10); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText(b.label, W/2, by+28);
    });
  }

  function drawTabBar(ctx, W, H){
    const barH = 60;
    const by = H - barH;
    ctx.fillStyle = '#1a0b2e';
    ctx.fillRect(0, by, W, barH);
    const tw = W / TABS.length;
    TABS.forEach((t, i) => {
      const tx = i * tw;
      const active = t.id === state.tab;
      if (active){
        ctx.fillStyle = t.color;
        ctx.fillRect(tx+4, by+4, tw-8, 3);
      }
      ctx.fillStyle = active ? t.color : '#888';
      ctx.font = '22px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(t.icon, tx+tw/2, by+30);
      ctx.font = active ? 'bold 11px sans-serif' : '11px sans-serif';
      ctx.fillText(t.label, tx+tw/2, by+50);
    });
  }

  function handleClick(x, y, W, H){
    if (!state.open) return false;
    // 닫기
    if (x > W-42 && x < W-12 && y > 12 && y < 40){
      close(); return true;
    }
    // 하단 탭바
    const barH = 60;
    if (y > H - barH){
      const idx = Math.floor(x / (W / TABS.length));
      if (TABS[idx]) switchTab(TABS[idx].id);
      return true;
    }
    // 도감 서브탭
    if (state.tab === 'pokedex'){
      const subY = 60, subH = 28;
      if (y >= subY && y <= subY + subH){
        const idx = Math.floor(x / (W / DEX_TABS.length));
        if (DEX_TABS[idx]) dexSubTab = DEX_TABS[idx];
        return true;
      }
    }
    return true;
  }

  window.Menu = { open, close, switchTab, draw, setData, handleClick,
                  isOpen: ()=>state.open };
})();

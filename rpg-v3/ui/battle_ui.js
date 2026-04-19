// battle_ui.js — 전투 화면 커맨드/스킬/포획 UI
// window.BattleUI = { drawCommands, drawSkills, drawCapturePrompt,
//                     drawBag, drawLog, addLog, handleInput, setState }

(function(){
  const COMMANDS = [
    { id:'fight',   label:'싸우기',  color:'#FF6B9D', icon:'⚔️' },
    { id:'party',   label:'티니핑',  color:'#4FC3F7', icon:'💖' },
    { id:'bag',     label:'가방',    color:'#66BB6A', icon:'🎒' },
    { id:'run',     label:'도망',    color:'#FFD54F', icon:'💨' },
  ];

  const state = {
    mode: 'commands',    // commands | skills | bag | capture
    skills: [],          // [{name,pp,maxPp,type,power}]
    bagItems: [],        // [{id,name,count,icon,kind}]
    log: [],             // 최대 3줄
    hitAreas: [],        // [{x,y,w,h,id,kind}]
    onAction: null,
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

  function setState(partial){ Object.assign(state, partial); }
  function addLog(line){
    state.log.push(line);
    if (state.log.length > 3) state.log.shift();
  }

  // 공통: 하단 박스 영역 계산
  function cmdArea(W, H){
    const h = 170;
    return { x: 0, y: H - h, w: W, h };
  }

  function drawLog(ctx, W, H){
    const area = cmdArea(W, H);
    // 로그는 커맨드 박스 위
    const lh = 22;
    const rows = state.log.length;
    const ly = area.y - (rows*lh + 16);
    if (rows === 0) return;
    ctx.fillStyle = 'rgba(42,21,64,0.85)';
    roundRect(ctx, 8, ly, W-16, rows*lh+12, 10); ctx.fill();
    ctx.strokeStyle = '#FEE500'; ctx.lineWidth = 1.5;
    roundRect(ctx, 8, ly, W-16, rows*lh+12, 10); ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'left';
    state.log.forEach((ln, i) => {
      ctx.fillText('▸ '+ln, 18, ly+20+i*lh);
    });
  }

  function drawCommands(ctx, W, H){
    state.hitAreas = [];
    const area = cmdArea(W, H);
    ctx.fillStyle = 'rgba(42,21,64,0.95)';
    ctx.fillRect(area.x, area.y, area.w, area.h);
    ctx.strokeStyle = '#FF6B9D'; ctx.lineWidth = 2;
    ctx.strokeRect(area.x, area.y+0.5, area.w, area.h);

    // 2x2 그리드
    const cellW = (W - 24) / 2;
    const cellH = (area.h - 24) / 2;
    COMMANDS.forEach((c, i) => {
      const col = i % 2, row = Math.floor(i/2);
      const cx = 8 + col*(cellW+8);
      const cy = area.y + 8 + row*(cellH+8);
      ctx.fillStyle = c.color;
      roundRect(ctx, cx, cy, cellW, cellH, 12); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
      roundRect(ctx, cx, cy, cellW, cellH, 12); ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 22px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(c.icon+' '+c.label, cx+cellW/2, cy+cellH/2+8);
      state.hitAreas.push({ x:cx, y:cy, w:cellW, h:cellH, id:c.id, kind:'command' });
    });
  }

  function drawSkills(ctx, W, H){
    state.hitAreas = [];
    const area = cmdArea(W, H);
    ctx.fillStyle = 'rgba(42,21,64,0.95)';
    ctx.fillRect(area.x, area.y, area.w, area.h);

    // 2x2 스킬
    const skills = state.skills.slice(0, 4);
    const cellW = (W - 24) / 2;
    const cellH = (area.h - 40) / 2;
    for (let i=0;i<4;i++){
      const s = skills[i];
      const col = i % 2, row = Math.floor(i/2);
      const cx = 8 + col*(cellW+8);
      const cy = area.y + 8 + row*(cellH+8);
      ctx.fillStyle = s ? '#FF6B9D' : 'rgba(255,255,255,0.08)';
      roundRect(ctx, cx, cy, cellW, cellH, 10); ctx.fill();
      ctx.strokeStyle = s ? '#fff' : '#555'; ctx.lineWidth = 2;
      roundRect(ctx, cx, cy, cellW, cellH, 10); ctx.stroke();
      if (s){
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 15px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(s.name, cx+10, cy+22);
        ctx.fillStyle = '#FFD54F';
        ctx.font = '11px sans-serif';
        ctx.fillText(s.type||'사랑', cx+10, cy+40);
        ctx.textAlign = 'right';
        ctx.fillText('PP '+(s.pp||0)+'/'+(s.maxPp||0), cx+cellW-10, cy+cellH-8);
        state.hitAreas.push({ x:cx, y:cy, w:cellW, h:cellH, id:i, kind:'skill' });
      }
    }
    // 취소(뒤로)
    const backW = 80, backH = 24;
    const bx = W - backW - 10, by = area.y + area.h - backH - 4;
    ctx.fillStyle = '#2a1540';
    roundRect(ctx, bx, by, backW, backH, 6); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('◀ 뒤로', bx+backW/2, by+16);
    state.hitAreas.push({ x:bx, y:by, w:backW, h:backH, id:'back', kind:'nav' });
  }

  function drawBag(ctx, W, H){
    state.hitAreas = [];
    const area = cmdArea(W, H);
    ctx.fillStyle = 'rgba(42,21,64,0.95)';
    ctx.fillRect(area.x, area.y, area.w, area.h);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('🎒 가방 — 하트/회복템', 14, area.y+22);

    const items = state.bagItems.slice(0, 6);
    items.forEach((it, i) => {
      const ry = area.y + 32 + i*22;
      const isCapture = it.kind === 'capture';
      ctx.fillStyle = isCapture ? 'rgba(255,107,157,0.3)' : 'rgba(102,187,106,0.25)';
      roundRect(ctx, 10, ry, W-20, 20, 4); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText((it.icon||'🎁')+' '+it.name, 16, ry+15);
      ctx.textAlign = 'right';
      ctx.fillText('× '+it.count, W-16, ry+15);
      state.hitAreas.push({ x:10, y:ry, w:W-20, h:20, id:it.id, kind:'item' });
    });
    // 뒤로
    const bx = W - 90, by = area.y + area.h - 28;
    ctx.fillStyle = '#2a1540';
    roundRect(ctx, bx, by, 80, 22, 6); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('◀ 뒤로', bx+40, by+15);
    state.hitAreas.push({ x:bx, y:by, w:80, h:22, id:'back', kind:'nav' });
  }

  function drawCapturePrompt(ctx, W, H, target){
    state.hitAreas = [];
    const bw = 280, bh = 170;
    const bx = (W-bw)/2, by = (H-bh)/2;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff';
    roundRect(ctx, bx, by, bw, bh, 14); ctx.fill();
    ctx.strokeStyle = '#FF6B9D'; ctx.lineWidth = 3;
    roundRect(ctx, bx, by, bw, bh, 14); ctx.stroke();

    ctx.fillStyle = '#FF6B9D';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('💖 하트로 포획할까요?', W/2, by+32);
    ctx.fillStyle = '#2a1540';
    ctx.font = '14px sans-serif';
    ctx.fillText('대상: '+(target&&target.name||'???'), W/2, by+60);
    ctx.fillText('성공률: '+((target&&target.rate)||30)+'%', W/2, by+80);

    // 버튼
    const yesX = bx+20, noX = bx+bw-120, btnY = by+bh-50;
    ctx.fillStyle = '#FF6B9D';
    roundRect(ctx, yesX, btnY, 100, 36, 8); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('💖 포획', yesX+50, btnY+23);
    state.hitAreas.push({ x:yesX, y:btnY, w:100, h:36, id:'capture_yes', kind:'capture' });

    ctx.fillStyle = '#888';
    roundRect(ctx, noX, btnY, 100, 36, 8); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillText('취소', noX+50, btnY+23);
    state.hitAreas.push({ x:noX, y:btnY, w:100, h:36, id:'capture_no', kind:'capture' });
  }

  function handleInput(x, y){
    for (const h of state.hitAreas){
      if (x >= h.x && x <= h.x+h.w && y >= h.y && y <= h.y+h.h){
        if (state.onAction) state.onAction(h.kind, h.id);
        return { kind:h.kind, id:h.id };
      }
    }
    return null;
  }

  window.BattleUI = {
    drawCommands, drawSkills, drawBag, drawCapturePrompt, drawLog,
    addLog, setState, handleInput,
    getMode: () => state.mode,
    setMode: (m) => { state.mode = m; },
  };
})();

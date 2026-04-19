// katok_dialog.js — 카카오톡 스타일 대화창 (Canvas 2D)
// Romi(주인공) 메시지: 우측 노란 말풍선 (#FEE500)
// NPC 메시지: 좌측 회색 말풍선, 아바타+이름
// 탭하여 다음 메시지, 타이핑 효과(30ms/char), 탭으로 완료

(function(){
  const CHAR_PER_LINE = 24;
  const TYPE_MS = 30;
  const MAX_VISIBLE = 2;

  const state = {
    active: false,
    actors: {},          // id → {name,avatar,side}
    queue: [],           // 남은 대사
    history: [],         // 표시된 대사들 {who,text,shown,startTs,y}
    onDone: null,
    lastTs: 0,
  };

  function wrap(text, n){
    const out = [];
    for (let i = 0; i < text.length; i += n) out.push(text.slice(i, i+n));
    return out;
  }

  function show(payload, onDone){
    state.actors = {};
    (payload.actors||[]).forEach(a => state.actors[a.id] = a);
    state.queue = (payload.dialog||[]).slice();
    state.history = [];
    state.onDone = onDone || null;
    state.active = true;
    advance(); // 첫 대사 즉시 pop
  }

  function advance(){
    if (!state.active) return;
    // 진행 중인 타이핑이 있으면 즉시 완성
    const last = state.history[state.history.length-1];
    if (last && last.shown < last.text.length){
      last.shown = last.text.length;
      return;
    }
    // 다음 대사 pop
    if (state.queue.length === 0){
      state.active = false;
      if (state.onDone) state.onDone();
      return;
    }
    const next = state.queue.shift();
    state.history.push({
      who: next.who,
      text: next.text,
      shown: 0,
      startTs: performance.now(),
    });
    // 오래된 것 fade-out 대상은 MAX_VISIBLE 넘을 때 자동 처리
  }

  function isActive(){ return state.active; }

  function draw(ctx, W, H){
    if (!state.active && state.history.length === 0) return;

    const now = performance.now();
    const last = state.history[state.history.length-1];
    if (last && last.shown < last.text.length){
      const elapsed = now - last.startTs;
      last.shown = Math.min(last.text.length, Math.floor(elapsed / TYPE_MS));
    }

    // 하단 영역: 전체의 아래 45%
    const areaTop = H * 0.55;
    const areaBottom = H - 10;
    const padX = 14;
    const bubbleMaxW = W - padX*2 - 56; // 아바타 자리

    // 아래에서 위로 스택 (최신 = 하단)
    const visible = state.history.slice(-MAX_VISIBLE);
    const fadeOld = state.history.length > MAX_VISIBLE;
    let y = areaBottom;

    // 카톡 배경 살짝 어둡게
    ctx.fillStyle = 'rgba(42, 21, 64, 0.85)';
    ctx.fillRect(0, areaTop - 20, W, H - areaTop + 20);

    for (let i = visible.length - 1; i >= 0; i--){
      const msg = visible[i];
      const actor = state.actors[msg.who] || {name:msg.who, side:'left'};
      const isRomi = actor.side === 'right';
      const shownText = msg.text.slice(0, msg.shown);
      const lines = wrap(shownText, CHAR_PER_LINE);
      const lineH = 22;
      const bubbleH = lines.length * lineH + 20;
      const bubbleW = Math.min(bubbleMaxW,
        Math.max(60, Math.max(...lines.map(l => l.length)) * 11 + 24));

      y -= bubbleH + 10;
      // 오래된 메시지 페이드 (위쪽 것)
      const alpha = (fadeOld && i === 0) ? 0.55 : 1.0;
      ctx.globalAlpha = alpha;

      if (isRomi){
        // 우측 노란 말풍선
        const bx = W - padX - bubbleW;
        const by = y;
        roundRect(ctx, bx, by, bubbleW, bubbleH, 14);
        ctx.fillStyle = '#FEE500';
        ctx.fill();
        // 꼬리
        ctx.beginPath();
        ctx.moveTo(bx + bubbleW, by + 12);
        ctx.lineTo(bx + bubbleW + 8, by + 8);
        ctx.lineTo(bx + bubbleW, by + 22);
        ctx.closePath();
        ctx.fill();
        // 텍스트
        ctx.fillStyle = '#2a1540';
        ctx.font = '15px sans-serif';
        ctx.textAlign = 'left';
        lines.forEach((ln, idx) => {
          ctx.fillText(ln, bx + 12, by + 18 + idx*lineH);
        });
      } else {
        // 좌측 NPC
        const ax = padX + 4;
        const ay = y + 4;
        // 아바타 원형 배경
        ctx.beginPath();
        ctx.arc(ax + 18, ay + 18, 18, 0, Math.PI*2);
        ctx.fillStyle = '#FF6B9D';
        ctx.fill();
        // 아바타 이미지 (클립 후 그리기), 없으면 이니셜
        const img = actor.avatar;
        if (img && img.complete && img.naturalWidth > 0){
          ctx.save();
          ctx.beginPath();
          ctx.arc(ax + 18, ay + 18, 17, 0, Math.PI*2);
          ctx.clip();
          ctx.drawImage(img, ax, ay, 36, 36);
          ctx.restore();
        } else {
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 14px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText((actor.name||'?').charAt(0), ax+18, ay+22);
        }
        // 테두리
        ctx.beginPath();
        ctx.arc(ax + 18, ay + 18, 18, 0, Math.PI*2);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 이름
        ctx.fillStyle = '#FFD54F';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(actor.name || msg.who, ax + 44, y - 2);

        // 말풍선
        const bx = ax + 44;
        const by = y + 4;
        roundRect(ctx, bx, by, bubbleW, bubbleH, 14);
        ctx.fillStyle = '#f0f0f0';
        ctx.fill();
        // 꼬리
        ctx.beginPath();
        ctx.moveTo(bx, by + 12);
        ctx.lineTo(bx - 8, by + 8);
        ctx.lineTo(bx, by + 22);
        ctx.closePath();
        ctx.fill();
        // 텍스트
        ctx.fillStyle = '#2a1540';
        ctx.font = '15px sans-serif';
        lines.forEach((ln, idx) => {
          ctx.fillText(ln, bx + 12, by + 18 + idx*lineH);
        });
      }
      ctx.globalAlpha = 1.0;
    }

    // 탭 힌트
    if (state.active){
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'right';
      const hint = (last && last.shown < last.text.length) ? '▶ 탭: 빨리보기' : '▶ 탭: 다음';
      ctx.fillText(hint, W - 10, H - 6);
    }
  }

  function roundRect(ctx, x, y, w, h, r){
    ctx.beginPath();
    ctx.moveTo(x+r, y);
    ctx.arcTo(x+w, y, x+w, y+h, r);
    ctx.arcTo(x+w, y+h, x, y+h, r);
    ctx.arcTo(x, y+h, x, y, r);
    ctx.arcTo(x, y, x+w, y, r);
    ctx.closePath();
  }

  window.KatokDialog = { show, advance, isActive, draw };
})();

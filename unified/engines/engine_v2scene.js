// ============================================================
// UNIFIED v4 - SCENE ENGINE (v2 스타일 대화/씬)
// 상단 60% 배경+캐릭터 대형 스프라이트 / 하단 40% 말풍선
// 타이핑 효과 30ms/char, 탭·Enter로 가속→완료→다음
// sceneData: { location, bg, actors:[{id,name,side,avatar?}], dialog:[{who,text,emotion?}] }
// ============================================================
(function(){
  'use strict';

  // ----- 설정 -----
  const TYPE_MS       = 30;     // 글자당 ms
  const CHAR_PER_LINE = 22;     // 말풍선 줄바꿈
  const SPRITE_SIZE   = 220;    // 대형 캐릭터 스프라이트
  const BOUNCE_AMP    = 6;      // sin 바운스 진폭 px

  // 스프라이트 키 맵 (Foundation 없는 경우 자체 기본값)
  if(!window.SPRITE_KEY){
    window.SPRITE_KEY = {
      romi:'rs', kkong:'kk', hatchu:'hs', baro:'ba',
      buggreu:'bk', lala:'la', stick:'st', truping:'ts',
      hartking:'hk', liam:'lip'
    };
  }

  // 이모지 폴백 맵
  const EMOJI_FALLBACK = {
    romi:'👧', kkong:'🧊', hatchu:'💖', baro:'⚡',
    buggreu:'🙈', lala:'🎵', stick:'🔮', truping:'😈',
    hartking:'👑', liam:'🤴', narration:''
  };

  // ----- 내부 상태 -----
  const S = {
    active: false,
    data: null,            // 현재 씬 데이터
    scenes: null,          // 다중 씬 지원 배열
    sceneIdx: 0,
    dialogIdx: 0,
    typed: 0,              // 현재 대사에서 표시된 글자 수
    typingStartTs: 0,
    onComplete: null,
    t: 0,                  // 프레임 카운터 (바운스 등)
    actorsById: {},        // 현재 씬 actors 빠른 조회
    choiceMode: false,     // 선택지 대기 상태
    choiceRects: [],       // 선택지 버튼 영역 [{x,y,w,h,opt}]
    choiceSelect: null     // 선택 콜백 (scene 기반)
  };

  // ==========================================================
  // 공개 API
  // ==========================================================

  // start(scenesOrSceneData, onComplete)
  //   - 배열이면 다중 씬 순차, 단일 객체면 단일 씬
  function start(input, onComplete){
    S.scenes   = Array.isArray(input) ? input.slice() : [input];
    S.sceneIdx = 0;
    S.onComplete = onComplete || null;
    S.active = true;
    _loadScene(0);
  }

  function _loadScene(idx){
    if(idx >= S.scenes.length){
      // 전체 씬 완료
      S.active = false;
      const cb = S.onComplete; S.onComplete = null;
      if(cb) try{ cb(); }catch(e){ console.error('[SceneEngine] onComplete err:', e); }
      return;
    }
    S.sceneIdx = idx;
    S.data = S.scenes[idx] || {};
    S.dialogIdx = 0;
    S.typed = 0;
    S.typingStartTs = performance.now();
    S.choiceMode = false;
    S.choiceRects = [];
    // actors 색인
    S.actorsById = {};
    (S.data.actors || []).forEach(a => { S.actorsById[a.id] = a; });
  }

  function update(){
    if(!S.active) return;
    S.t++;
    const line = _currentLine();
    if(!line) return;
    // 타이핑 진행
    const full = line.text || '';
    if(S.typed < full.length){
      const elapsed = performance.now() - S.typingStartTs;
      S.typed = Math.min(full.length, Math.floor(elapsed / TYPE_MS));
    }
  }

  function render(ctx, W, H){
    // 파라미터 없으면 UCanvas 참조
    if(!ctx && window.UCanvas){ ctx = window.UCanvas.ctx; W = window.UCanvas.W; H = window.UCanvas.H; }
    if(!ctx) return;
    W = W || 420; H = H || 750;

    if(!S.active && !S.data){
      // 씬 없음: 대기 화면 (보기용)
      ctx.fillStyle = '#1a0a2e';
      ctx.fillRect(0, 0, W, H);
      return;
    }

    _drawBg(ctx, W, H);
    _drawActors(ctx, W, H);
    _drawDialogBox(ctx, W, H);
    if(S.choiceMode) _drawChoices(ctx, W, H);
  }

  // 선택지 버튼 렌더 (하단 오버레이)
  function _drawChoices(ctx, W, H){
    const opts = (S.data && S.data.choices) || [];
    if(opts.length === 0) return;
    const prompt = S.data.choicePrompt || '어떻게 할까?';
    // 반투명 오버레이
    ctx.fillStyle = 'rgba(10,5,21,0.75)';
    ctx.fillRect(0, 0, W, H);
    // 프롬프트
    ctx.font = 'bold 18px "Jua", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#FFD54F';
    ctx.fillText(prompt, W/2, H * 0.35);
    // 버튼 레이아웃
    const btnW = W * 0.8;
    const btnH = 52;
    const gap  = 12;
    const totalH = opts.length * btnH + (opts.length - 1) * gap;
    const startY = H * 0.42;
    S.choiceRects = [];
    for(let i=0; i<opts.length; i++){
      const opt = opts[i];
      const bx = (W - btnW) / 2;
      const by = startY + i * (btnH + gap);
      // 버튼 배경
      _roundRect(ctx, bx, by, btnW, btnH, 14);
      ctx.fillStyle = 'rgba(255,107,157,0.85)';
      ctx.fill();
      ctx.strokeStyle = '#FFD54F';
      ctx.lineWidth = 2;
      ctx.stroke();
      // 텍스트
      ctx.font = 'bold 16px "Jua", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff';
      ctx.fillText(opt.text, W/2, by + btnH/2);
      S.choiceRects.push({ x:bx, y:by, w:btnW, h:btnH, opt:opt, idx:i });
    }
    ctx.textBaseline = 'alphabetic';
    // 하단 힌트
    ctx.font = '12px "Jua", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillText('버튼을 선택해주세요', W/2, H - 30);
  }

  // handleInput(x, y, kind) — kind: 'down'|'tap'|'key'|'enter'
  function handleInput(x, y, kind){
    if(!S.active) return;
    // 선택지 대기 중이면 버튼 히트 체크
    if(S.choiceMode){
      // 'down' 이벤트에서만 히트 체크 (mouseup 도 허용)
      if(kind === 'down' || kind === 'tap' || kind === 'up'){
        for(let i=0; i<S.choiceRects.length; i++){
          const r = S.choiceRects[i];
          if(x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h){
            _selectChoice(r.opt, r.idx);
            return;
          }
        }
      }
      return; // 버튼 외 영역 무시
    }
    // 탭/Enter 모두 진행 트리거로 취급
    _advance();
  }

  function _selectChoice(opt, idx){
    // 플래그/호감도 저장
    window.STATE = window.STATE || {};
    window.STATE.storyFlags = window.STATE.storyFlags || {};
    if(opt.affection != null){
      const key = (S.data && S.data.affectionKey) || 'act5_affection';
      window.STATE.storyFlags[key] = (window.STATE.storyFlags[key] || 0) + opt.affection;
    }
    if(opt.flag){
      window.STATE.storyFlags['choice_' + opt.flag] = true;
    }
    // scene 의 onChoice 훅
    if(typeof S.data.onChoice === 'function'){
      try{ S.data.onChoice(opt, idx, window.STATE); }catch(e){ console.error('[SceneEngine] onChoice err:', e); }
    }
    // 다음 씬
    S.choiceMode = false;
    S.choiceRects = [];
    _nextScene();
  }

  function onEnter(opts){
    // Dispatcher가 switchMode 시 호출. opts에 { returnTo, sceneData } 등 가능
    if(opts && opts.sceneData){
      start(opts.sceneData, opts.onComplete);
    }
  }
  function onExit(/*nextMode*/){
    // 특별히 할 일 없음. (필요 시 정리)
  }

  // ==========================================================
  // 내부 로직
  // ==========================================================
  function _currentLine(){
    if(!S.data) return null;
    const d = S.data.dialog || [];
    return d[S.dialogIdx] || null;
  }

  function _advance(){
    const line = _currentLine();
    if(!line){ _maybeEnterChoice(); return; }
    const full = (line.text || '');
    if(S.typed < full.length){
      // 타이핑 중이면 즉시 완성
      S.typed = full.length;
      return;
    }
    // 다음 대사
    S.dialogIdx++;
    const next = _currentLine();
    if(!next){
      _maybeEnterChoice();
    } else {
      S.typed = 0;
      S.typingStartTs = performance.now();
    }
  }

  function _maybeEnterChoice(){
    // 대사 끝났을 때 choices 있으면 choice mode 진입
    if(S.data && Array.isArray(S.data.choices) && S.data.choices.length > 0){
      S.choiceMode = true;
      return;
    }
    _nextScene();
  }

  function _nextScene(){
    _loadScene(S.sceneIdx + 1);
  }

  // ----- 배경 -----
  function _drawBg(ctx, W, H){
    const key = S.data && S.data.bg;
    const IM  = window.IM || {};
    const img = key ? IM[key] : null;
    if(img && img.complete && img.naturalWidth > 0){
      ctx.drawImage(img, 0, 0, W, H);
    } else {
      // 그라데이션 폴백 (침실 느낌 핑크/퍼플)
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#3a1a5a');
      g.addColorStop(0.6, '#6a2a8a');
      g.addColorStop(1, '#c76fa8');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      // 장식: 별
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      for(let i=0;i<28;i++){
        const sx = (i*37 + S.t*0.1) % W;
        const sy = (i*53) % (H*0.55);
        ctx.fillRect(sx, sy, 2, 2);
      }
    }
    // 상단 60% 유지, 하단은 박스가 덮을 영역이므로 어둠 오버레이
    ctx.fillStyle = 'rgba(10,5,21,0.35)';
    ctx.fillRect(0, H*0.60, W, H*0.40);
  }

  // ----- 캐릭터 대형 스프라이트 -----
  function _drawActors(ctx, W, H){
    const actors = (S.data && S.data.actors) || [];
    const line   = _currentLine();
    const speaker = line ? line.who : null;

    // 좌/우 분리
    const left  = actors.find(a => a.side === 'left');
    const right = actors.find(a => a.side === 'right');

    // 스테이지 Y (상단 영역 가운데 약간 아래)
    const stageY = H * 0.55 - SPRITE_SIZE * 0.5;

    if(left)  _drawOneActor(ctx, left,  40,              stageY, speaker);
    if(right) _drawOneActor(ctx, right, W - SPRITE_SIZE - 40, stageY, speaker);

    // 나레이션이거나 아무도 안 맞으면 스피커 디밍 없음
  }

  function _drawOneActor(ctx, actor, x, y, speakerId){
    // 바운스 (말하는 사람만 크게, 아닌 사람은 살짝)
    const isSpeaking = actor.id === speakerId;
    const bounce = Math.sin(S.t * 0.15) * (isSpeaking ? BOUNCE_AMP : BOUNCE_AMP*0.3);
    const alpha  = isSpeaking ? 1.0 : 0.65;

    ctx.save();
    ctx.globalAlpha = alpha;

    // 그림자
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(x + SPRITE_SIZE/2, y + SPRITE_SIZE - 8, SPRITE_SIZE*0.4, 10, 0, 0, Math.PI*2);
    ctx.fill();

    // 이미지 시도
    const IM = window.IM || {};
    const spriteKey = (window.SPRITE_KEY || {})[actor.id] || actor.id;
    const img = IM[spriteKey];
    if(img && img.complete && img.naturalWidth > 0){
      ctx.drawImage(img, x, y + bounce, SPRITE_SIZE, SPRITE_SIZE);
    } else {
      // 이모지 폴백
      const emoji = actor.avatar || EMOJI_FALLBACK[actor.id] || '✨';
      // 원형 배경
      ctx.fillStyle = isSpeaking ? 'rgba(255,107,157,0.7)' : 'rgba(120,80,160,0.5)';
      ctx.beginPath();
      ctx.arc(x + SPRITE_SIZE/2, y + SPRITE_SIZE/2 + bounce, SPRITE_SIZE*0.42, 0, Math.PI*2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.stroke();
      // 이모지
      ctx.font = Math.floor(SPRITE_SIZE*0.55) + 'px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff';
      ctx.fillText(emoji, x + SPRITE_SIZE/2, y + SPRITE_SIZE/2 + bounce);
    }

    // 이름 태그 (말하는 사람만)
    if(isSpeaking){
      ctx.globalAlpha = 1.0;
      const label = actor.name || actor.id;
      ctx.font = 'bold 14px "Jua", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      const tw = ctx.measureText(label).width + 18;
      const tx = x + SPRITE_SIZE/2 - tw/2;
      const ty = y + SPRITE_SIZE + 4;
      _roundRect(ctx, tx, ty, tw, 22, 10);
      ctx.fillStyle = '#FF6B9D';
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.fillText(label, x + SPRITE_SIZE/2, ty + 16);
    }

    ctx.restore();
  }

  // ----- 하단 대화 박스 -----
  function _drawDialogBox(ctx, W, H){
    const line = _currentLine();
    const boxTop = H * 0.60;
    const padX   = 14;
    const padY   = 14;

    // 박스 배경
    ctx.save();
    _roundRect(ctx, 10, boxTop + 4, W - 20, H - boxTop - 14, 16);
    ctx.fillStyle = 'rgba(20,10,40,0.92)';
    ctx.fill();
    ctx.strokeStyle = '#FF6B9D';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    if(!line){
      // 빈 상태
      ctx.fillStyle = '#ccc';
      ctx.font = '14px "Jua", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('(계속하려면 탭)', W/2, boxTop + 60);
      return;
    }

    // 화자 이름
    const who = line.who;
    const actor = S.actorsById[who];
    const isNarr = (who === 'narration' || who === 'narr' || !actor);
    const displayName = isNarr ? '' : (actor ? actor.name : who);

    if(displayName){
      ctx.font = 'bold 16px "Jua", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillStyle = '#FFD54F';
      ctx.fillText(displayName, 24, boxTop + 28);
    }

    // 본문 (타이핑)
    const full = line.text || '';
    const shown = full.slice(0, S.typed);
    const lines = _wrapText(shown, CHAR_PER_LINE);
    ctx.font = (isNarr ? 'italic ' : '') + '16px "Jua", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = isNarr ? '#E0D0FF' : '#FFFFFF';
    const textStartY = boxTop + (displayName ? 52 : 36);
    const lineH = 24;
    lines.forEach((ln, i) => {
      ctx.fillText(ln, 24, textStartY + i * lineH);
    });

    // 탭 힌트 (타이핑 끝나면 반짝임)
    const full2 = full;
    const typingDone = S.typed >= full2.length;
    const hintAlpha = typingDone ? (0.5 + 0.5*Math.sin(S.t*0.15)) : 0.5;
    ctx.fillStyle = 'rgba(255,255,255,' + hintAlpha.toFixed(2) + ')';
    ctx.font = '12px "Jua", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(typingDone ? '▼ 탭 / Enter : 다음' : '▶ 탭 : 빠르게', W - 20, H - 22);

    // 진행 인디케이터
    const total = (S.data.dialog || []).length;
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.font = '11px sans-serif';
    ctx.fillText((S.dialogIdx+1) + ' / ' + total, 24, H - 22);
  }

  // ----- 유틸 -----
  function _wrapText(text, n){
    if(!text) return [''];
    // \n 우선 처리
    const out = [];
    const paras = String(text).split('\n');
    paras.forEach(p => {
      if(p.length <= n){ out.push(p); return; }
      for(let i=0; i<p.length; i+=n){ out.push(p.slice(i, i+n)); }
    });
    return out;
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

  // ==========================================================
  window.SceneEngine = {
    start, update, render, handleInput,
    onEnter, onExit,
    // 디버그/편의
    _isActive(){ return S.active; },
    _currentLine
  };

  // 키보드 Enter/Space 바인딩 (document 레벨, 다른 모드에서도 안전)
  if(typeof document !== 'undefined'){
    document.addEventListener('keydown', function(e){
      if(!S.active) return;
      if(e.key === 'Enter' || e.key === ' ' || e.code === 'Space'){
        e.preventDefault();
        _advance();
      }
    });
  }

  console.log('[UNIFIED] SceneEngine 로드 완료');
})();

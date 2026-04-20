// ============================================================
// UNIFIED v4 - MODE DISPATCHER
// 현재 STATE.mode 값에 따라 알맞는 엔진에 update/render/input을 위임.
// 각 엔진은 나중에 다른 에이전트가 구현. 없는 엔진 호출은 조용히 무시.
// ============================================================
(function(){
  'use strict';

  // 모드 → 엔진(window.X) 매핑
  const ENGINE_MAP = {
    title:      'TitleScreen',       // 타이틀 화면
    v2_scene:   'SceneEngine',       // v2 대화형 씬 (카톡 다이얼로그)
    platformer: 'PlatformerEngine',  // Act2 성 탈출 (마리오식)
    dodge:      'DodgeEngine',       // Act1.5 눈피하기
    run:        'RunEngine',         // Act3 버스 러닝
    v3_map:     'V3Map',             // Act4/5 탐색 맵 (포켓몬식)
    v3_battle:  'V3Battle',          // 전투
    cutscene:   'CutsceneEngine'     // 연출 전용 컷씬
  };

  const TRANSITION_DUR = 18; // 약 0.3s @ 60fps

  function getEngine(modeName){
    const key = ENGINE_MAP[modeName || window.STATE.mode];
    if(!key) return null;
    return window[key] || null;
  }

  window.Dispatcher = {
    // ===== 모드 전환 =====
    switchMode(newMode, opts){
      opts = opts || {};
      if(!ENGINE_MAP[newMode]){
        console.warn('[Dispatcher] 알 수 없는 모드:', newMode);
        return false;
      }
      const S = window.STATE;
      if(S.mode === newMode && !opts.force) return false;
      console.log('[Dispatcher] switchMode:', S.mode, '→', newMode);

      // 이전 엔진 exit 훅
      try{ getEngine(S.mode)?.onExit?.(newMode); }catch(e){ console.warn('onExit err:', e); }

      S.prevMode = S.mode;
      S.mode = newMode;

      // 페이드 트랜지션 설정
      if(opts.fade !== false){
        S.transition = { t: 0, dur: TRANSITION_DUR, dir: 'in' };
      } else {
        S.transition = null;
      }

      // 새 엔진 enter 훅
      try{ getEngine(newMode)?.onEnter?.(opts); }catch(e){ console.warn('onEnter err:', e); }

      return true;
    },

    // ===== 현재 엔진 접근 =====
    getCurrentEngine(){ return getEngine(window.STATE.mode); },

    // ===== 프레임 업데이트 =====
    update(){
      const S = window.STATE;
      // 트랜지션 타이머
      if(S.transition){
        S.transition.t++;
        if(S.transition.t >= S.transition.dur) S.transition = null;
      }
      try{ getEngine(S.mode)?.update?.(); }catch(e){ console.error('[Dispatcher] update err:', e); }
    },

    // ===== 렌더 =====
    render(ctx, W, H){
      const S = window.STATE;
      try{
        const eng = getEngine(S.mode);
        if(eng && typeof eng.render === 'function'){
          eng.render(ctx, W, H);
        } else {
          // 플레이스홀더 (엔진 미구현 시)
          drawPlaceholder(ctx, W, H, S.mode);
        }
      }catch(e){
        console.error('[Dispatcher] render err:', e);
        drawPlaceholder(ctx, W, H, 'ERROR: '+e.message);
      }
      // 페이드 오버레이
      if(S.transition){
        const a = 1 - (S.transition.t / S.transition.dur);
        ctx.fillStyle = 'rgba(10,5,21,'+a.toFixed(3)+')';
        ctx.fillRect(0, 0, W, H);
      }
    },

    // ===== 입력 =====
    handleInput(x, y, kind){
      try{ getEngine(window.STATE.mode)?.handleInput?.(x, y, kind); }
      catch(e){ console.error('[Dispatcher] input err:', e); }
    },

    // 디버그용
    _ENGINE_MAP: ENGINE_MAP
  };

  function drawPlaceholder(ctx, W, H, label){
    ctx.fillStyle = '#1a0a2e';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#FF6B9D';
    ctx.font = 'bold 22px "Jua", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('사랑의 하츄핑 UNIFIED v4', W/2, H/2 - 40);
    ctx.fillStyle = '#FFD54F';
    ctx.font = '16px "Jua", sans-serif';
    ctx.fillText('mode: ' + label, W/2, H/2);
    ctx.fillStyle = '#ccc';
    ctx.font = '13px sans-serif';
    ctx.fillText('엔진 로딩 대기중...', W/2, H/2 + 30);
    ctx.textBaseline = 'alphabetic';
  }

  console.log('[UNIFIED] Dispatcher 준비 완료. 모드:', Object.keys(ENGINE_MAP).join(', '));
})();

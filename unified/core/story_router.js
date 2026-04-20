// ============================================================
// UNIFIED v4 - STORY ROUTER
// Act 간 체인을 담당. 각 Act의 onComplete를 읽고 다음 Act/Mode로 전환.
// ============================================================
(function(){
  'use strict';

  const ACT_MAP = {};

  function ensureMap(){
    const keys = {
      'act1_morning':    'ACT1',
      'act1_post_dodge': 'ACT1_POST',
      'act1b_book':      'ACT1B_BOOK',
      'act2_escape':     'ACT2',
      'act2_post':       'ACT2_POST',
      'act3_bus':        'ACT3',
      'act4_village':    'ACT4',
      'act5_forest':     'ACT5'
    };
    for(const id in keys){
      if(window[keys[id]]) ACT_MAP[id] = window[keys[id]];
    }
  }

  function play(storyId){
    ensureMap();
    const act = ACT_MAP[storyId];
    if(!act){
      console.warn('[StoryRouter] 알 수 없는 스토리:', storyId, 'available:', Object.keys(ACT_MAP));
      return false;
    }
    console.log('[StoryRouter] play:', storyId);
    window.STATE.currentStory = storyId;

    // Act3/Act4 처럼 자체 start() 있으면 위임
    if(typeof act.start === 'function'){
      act.start();
      return true;
    }

    const mode = act.triggerMode || (act.scenes ? 'v2_scene' : null);

    if(act.scenes){
      // 씬 배열 → SceneEngine
      window.Dispatcher.switchMode('v2_scene');
      setTimeout(()=>{
        if(!window.SceneEngine){ console.error('SceneEngine 없음'); return; }
        window.SceneEngine.start(act.scenes, ()=> handleComplete(act));
      }, 20);
      return true;
    }

    if(mode === 'platformer'){
      const opts = Object.assign({}, act.opts || {}, {
        onClear: ()=> handleComplete(act)
      });
      window.Dispatcher.switchMode('platformer', opts);
      return true;
    }

    if(mode === 'v3_map'){
      window.Dispatcher.switchMode('v3_map', act.opts || {});
      return true;
    }

    console.warn('[StoryRouter] 처리 불가:', storyId, mode);
    return false;
  }

  function handleComplete(act){
    const oc = act.onComplete;
    // opts.returnTo 폴백: Act2(platformer)처럼 onComplete 없고 opts.returnTo만 있는 경우
    if(!oc && act.opts && act.opts.returnTo){
      play(act.opts.returnTo);
      return;
    }
    if(!oc){ console.log('[StoryRouter]', act.id, '완료, 체인 없음'); return; }
    if(oc.setFlags){
      window.STATE.storyFlags = window.STATE.storyFlags || {};
      Object.assign(window.STATE.storyFlags, oc.setFlags);
    }

    const trig = oc.triggerMode;

    if(trig === 'dodge'){
      // Dodge 엔진은 자체적으로 끝나면 switchMode('v2_scene', {next: returnTo}) 호출
      window.Dispatcher.switchMode('dodge', {
        duration: 30,
        dodgeTarget: 10,
        returnTo: oc.returnTo || oc.next
      });
      return;
    }

    if((trig === 'platformer' || trig === 'v2_scene') && oc.next){
      play(oc.next);
      return;
    }

    if(trig === 'v3_map'){
      // oc.next 가 등록된 Act이면 해당 Act으로 위임 (Act3 등이 자체 맵 열음)
      ensureMap();
      if(oc.next && ACT_MAP[oc.next]){
        play(oc.next);
        return;
      }
      // Act2_post → castle_gate → Act3 자동 연결
      if(oc.next === 'castle_gate' && window.ACT3){
        play('act3_bus');
        return;
      }
      const opts = Object.assign({ mapId: oc.next }, oc.opts || {});
      window.Dispatcher.switchMode('v3_map', opts);
      return;
    }

    console.warn('[StoryRouter] 알 수 없는 완료 경로:', oc);
  }

  window.StoryRouter = { play, handleComplete, _ACT_MAP: ACT_MAP };

  // Dispatcher.switchMode 후킹: 엔진이 {next}로 복귀 요청하면 StoryRouter로 위임
  if(window.Dispatcher && !window.Dispatcher._storyRouterHooked){
    const orig = window.Dispatcher.switchMode;
    window.Dispatcher.switchMode = function(newMode, opts){
      if(newMode === 'v2_scene' && opts && opts.next){
        setTimeout(()=> play(opts.next), 20);
        return orig.call(window.Dispatcher, newMode, Object.assign({}, opts, { next: null }));
      }
      return orig.call(window.Dispatcher, newMode, opts);
    };
    window.Dispatcher._storyRouterHooked = true;
  }

  console.log('[UNIFIED] StoryRouter 로드 완료');
})();

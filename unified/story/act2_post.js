// ============================================================
// UNIFIED v4 - ACT2 POST (할머니 컷신 → Act3 트리거)
// 성기사 처치 직후, 로미가 할머니를 만나 작별 인사.
// 짧고 임팩트 있게. 영화 감성 필수.
// 연결:
//   Act2 플랫포머 onClear → Dispatcher.switchMode('v2_scene', {sceneData: ACT2_POST.scenes, onComplete})
//   onComplete → Dispatcher.switchMode('v3_map', { next: 'castle_gate' })
// ============================================================
(function(){
  'use strict';

  // ---- 씬 1: 중정, 보스 쓰러진 직후 ----
  const SCENE_REUNION = {
    location: '성 중정',
    bg: 'bg_plaza',
    actors: [
      { id:'grandma', name:'할머니', side:'left'  },
      { id:'romi',    name:'로미',   side:'right' }
    ],
    dialog: [
      { who:'grandma', text:'로미야...' },
      { who:'grandma', text:'우리 로미... 드디어 네 길을 찾았구나', emotion:'smile' },
      { who:'romi',    text:'할머니...', emotion:'tear' },
      { who:'grandma', text:'하츄핑은 금단의 숲 깊은 곳에 있다고 하더구나' },
      { who:'grandma', text:'쉽지 않은 길일 거야. 그래도 네가 가야 할 길이란다.' }
    ]
  };

  // ---- 씬 2: 성문 앞, 작별 ----
  const SCENE_FAREWELL = {
    location: '성문 앞',
    bg: 'bg_castle_gate',
    actors: [
      { id:'grandma', name:'할머니', side:'left'  },
      { id:'romi',    name:'로미',   side:'right' }
    ],
    dialog: [
      { who:'grandma', text:'조심히 다녀오거라, 내 아가야...', emotion:'tear' },
      { who:'romi',    text:'할머니... 고마워요', emotion:'tear' },
      { who:'romi',    text:'꼭 하츄핑을 만나서 돌아올게요.', emotion:'resolve' },
      { who:'grandma', text:'그래... 그래야지. 네 마음이 곧 길이란다.' },
      { who:'narration', text:'— 그렇게 로미는 성 밖으로 나섰다 —' }
    ]
  };

  // ---- 엔트리 ----
  window.ACT2_POST = {
    id: 'act2_post',
    triggerMode: 'v2_scene',
    scenes: [SCENE_REUNION, SCENE_FAREWELL],
    onComplete: {
      triggerMode: 'v3_map',
      next: 'castle_gate',
      // Dispatcher 측에서 이 객체를 읽어 switchMode 하도록 약속
      opts: { spawn: { map:'castle_gate', x: 7, y: 10 } }
    }
  };

  console.log('[UNIFIED] ACT2_POST 할머니 컷신 준비');
})();

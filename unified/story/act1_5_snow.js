// ============================================================
// UNIFIED v4 - ACT 1.5: 눈피하기 (꽁꽁핑 조우)
// ------------------------------------------------------------
// 스토리 플로우:
//   Act1 꽁꽁핑 대화 → ACT1_5 트리거 → DodgeEngine (30초, 10개) → act1_post_dodge 씬
// 결과는 STATE.storyFlags.dodgeResult ('clear'|'fail')로 저장.
// v2_scene이 해당 플래그를 읽어 분기된 대사를 낼 수 있다.
//
// 스토리 엔진(별도 에이전트)이 이 객체를 읽어 다음처럼 씬을 연결:
//   if(triggerMode === 'dodge') Dispatcher.switchMode('dodge', opts);
// ============================================================
(function(){
  'use strict';

  window.ACT1_5 = {
    id: 'act1_5_snow',
    title: '꽁꽁핑의 눈보라',

    // 트리거: v2_scene에서 이 씬 id에 도달하면 dodge 모드로 전환한다.
    triggerMode: 'dodge',

    // Dispatcher.switchMode('dodge', opts)에 그대로 넘어감
    opts: {
      duration:    30,
      dodgeTarget: 10,
      maxHp:       3,
      returnTo:    'act1_post_dodge'
    },

    // 진입 훅 (스토리 엔진이 호출 가능)
    onBefore(){
      // 꽁꽁핑 조우 플래그 (중복 진입 방지용)
      if(window.STATE){
        window.STATE.storyFlags = window.STATE.storyFlags || {};
        window.STATE.storyFlags.kkongkkong_met = true;
      }
    },

    // 퇴장 훅: 결과에 따라 후속 씬 결정
    onAfter(){
      if(!window.STATE) return;
      const r = window.STATE.storyFlags && window.STATE.storyFlags.dodgeResult;
      // v2_scene의 act1_post_dodge 안에서 r을 분기해 사용
      console.log('[ACT1_5] 눈피하기 결과:', r);
    },

    // 스토리 엔진이 씬 목록을 스캔할 때 참고할 수 있는 대화 힌트
    dialogHints: {
      intro: '꽁꽁핑: 여기는… 내 영역이야! 지나가려면 내 눈보라를 견뎌봐!',
      clearOutro: '꽁꽁핑: 헉… 대단한 집중력이네. 통과시켜 줄게.',
      failOutro:  '꽁꽁핑: 많이 맞았구나… 그래도 통과는 시켜줄게. 몸이나 녹이렴.'
    }
  };

  console.log('[UNIFIED] ACT1_5 (눈피하기) 등록');
})();

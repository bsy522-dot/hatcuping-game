// ============================================================
// UNIFIED v4 - GLOBAL STATE
// 모든 엔진/씬/모드가 공유하는 단일 상태 객체
// ============================================================
(function(){
  'use strict';

  // 로미 초기 스탯 (v4 핵심 혁신: 로미가 직접 전투)
  const ROMI_INIT = {
    name: '로미',
    lv: 1,
    xp: 0,
    hp: 50,
    maxHp: 50,
    atk: 15,
    def: 10,
    spd: 12,
    skills: [],        // Act 진행 시 습득 (ex. '용기의 외침', '우정의 힘')
    status: null
  };

  // 전역 STATE: 모든 모드(v2_scene / platformer / dodge / run / v3_map / v3_battle / cutscene)가 참조
  window.STATE = {
    // ----- 모드 관리 -----
    mode: 'v2_scene',          // 현재 활성 엔진 모드
    prevMode: null,            // 모드 전환 추적
    transition: null,          // {t, dur, dir} 페이드 중이면 객체, 아니면 null

    // ----- 스토리 -----
    act: 1,                    // Act 1 ~ 8
    scene: 0,
    storyFlags: {},            // 진행 플래그: {hatchu_met:true, castle_escaped:true, ...}

    // ----- 플레이어 (로미) -----
    romi: Object.assign({}, ROMI_INIT),

    // ----- 동료 티니핑들 -----
    partners: [],              // [{name:'하츄핑', lv, hp, maxHp, skills, ...}]

    // ----- 도감 -----
    pokedex: {
      seen: {},
      caught: {}
    },

    // ----- 월드/맵 -----
    currentMap: 'castle_bedroom',
    playerPos: { x: 7, y: 10 },

    // ----- 전투 임시 -----
    battle: null,              // 전투 중일 때만 채워짐
    battleResult: null,

    // ----- 메타 -----
    version: 'v4',
    hearts: 5,
    gold: 0,
    items: {}
  };

  // 로미 리셋 헬퍼 (New Game 용)
  window.STATE.resetRomi = function(){
    window.STATE.romi = Object.assign({}, ROMI_INIT, { skills: [] });
  };

  console.log('[UNIFIED] STATE 초기화 v4:', window.STATE.mode, 'Act', window.STATE.act);
})();

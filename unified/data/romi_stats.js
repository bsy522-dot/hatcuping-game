// ============================================================
// UNIFIED v4 - ROMI STATS & SKILLS
// 로미는 v4의 주인공 전투원. 4가지 감정 기반 스킬을 가진다.
// Act 진행에 따라 레벨업 + 스킬 강화.
// ============================================================
(function(){
  'use strict';

  window.ROMI_DEF = {
    id: 'romi',
    name: '로미',
    displayName: '로미 공주',

    // Lv1 기본 스탯
    baseStats: {
      hp:  50,
      atk: 15,
      def: 10,
      spd: 12
    },

    // 레벨업 당 성장치 (lv마다 가산)
    growth: {
      hp:  3,
      atk: 2,
      def: 1,
      spd: 1
    },

    // 감정 기반 4스킬 (고정)
    // - id는 시스템 식별자, name은 표시명
    // - power: 기본 공격력 (0이면 버프/자버프)
    // - heal: 비율(0.3 = maxHp의 30% 회복)
    // - pierce: true면 적 defense 50% 무시
    // - buff: {atk|def|spd:배수, turns:지속턴} — 자버프
    // - type: battle.js 타입 상성용
    skills: [
      { id:'love',    name:'사랑의 파동', type:'사랑',   power:30, heal:0.3,  pp:20, maxPp:20,
        desc:'따뜻한 빛으로 적을 감싸며 자신도 회복한다.' },
      { id:'courage', name:'용기의 일격', type:'용기',   power:70, pp:10, maxPp:10,
        desc:'두려움을 떨치고 내지르는 강한 일격.' },
      { id:'honesty', name:'정직한 검',   type:'정직',   power:50, pierce:true, pp:15, maxPp:15,
        desc:'거짓을 베는 검. 방어력을 절반 무시한다.' },
      { id:'hope',    name:'희망의 빛',   type:'빛',    power:0,  buff:{atk:1.2, turns:3}, pp:10, maxPp:10,
        desc:'희망의 빛으로 3턴간 공격력이 20% 상승한다.' }
    ]
  };

  // 로미 객체 생성기 (Battle이 요구하는 형태로)
  window.makeRomi = function(lv){
    lv = lv || (window.STATE && window.STATE.romi && window.STATE.romi.lv) || 1;
    const def = window.ROMI_DEF;
    const lvMinus = Math.max(0, lv - 1);
    const hp  = def.baseStats.hp  + def.growth.hp  * lvMinus;
    const atk = def.baseStats.atk + def.growth.atk * lvMinus;
    const dfn = def.baseStats.def + def.growth.def * lvMinus;
    const spd = def.baseStats.spd + def.growth.spd * lvMinus;
    return {
      id: 'romi',
      name: '로미',
      isRomi: true,
      lv: lv, xp: 0,
      type: ['사랑','빛'],     // 상성 계산용
      hp: hp, maxHp: hp,
      atk: atk, def: dfn, spd: spd,
      stats: { hp:hp, atk:atk, def:dfn, spd:spd, spAtk:atk, spDef:dfn },
      skills: def.skills.map(s => Object.assign({}, s)),
      status: null,
      buffs: []    // [{stat, mult, turns}]
    };
  };

  console.log('[UNIFIED] ROMI_DEF 로드: 4 스킬(사랑/용기/정직/희망)');
})();

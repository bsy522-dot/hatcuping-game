// ============================================================
// UNIFIED v4 - PARTNER (TINIPING) SUPPORT EFFECTS
// 파트너 티니핑은 직접 공격하지 않고, 서포트 효과로 전투를 돕는다.
// V3Battle이 "파트너" 커맨드 선택 시 turnEffect를 적용.
// ============================================================
(function(){
  'use strict';

  // 각 효과 설명
  // - onSupport: V3Battle이 파트너 선택 시 호출 (턴당 1회)
  // - passive: 전투 시작 시 자동 적용
  // - 필드값 예시:
  //    acc:-0.2   → 적 명중률 -20%
  //    hpRegen:3  → 매 턴 아군 HP +3
  //    crit:0.15  → 아군 크리티컬 +15%
  //    enemySpd:-0.3 → 적 속도 -30%
  //    defPen:0.5 → 아군 공격 시 적 방어 50% 무시
  //    shield:0.3 → 피격 데미지 30% 감소 (1회)
  //    healNow:0.5 → 발동 즉시 50% 회복

  window.PARTNER_EFFECTS = {
    hatchu: {
      name: '하츄핑',
      passive: { shield: 0.3 },
      onSupport: { healNow: 0.4, heal: 12, msg: '하츄핑이 하트 파동으로 로미를 감쌌다! HP +12' }
    },
    bukku: {
      name: '부끄핑',
      passive: { },
      onSupport: { acc: -0.3, turns: 3, msg: '부끄핑이 적을 부끄럽게 만들었다! 적 명중률 -30% (3턴)' }
    },
    chacha: {
      name: '차차핑',
      passive: { hpRegen: 3 },
      onSupport: { heal: 20, msg: '차차핑이 여유만만 티타임! HP +20' }
    },
    aza: {
      name: '아자핑',
      passive: { crit: 0.15 },
      onSupport: { crit: 0.5, turns: 2, msg: '아자핑의 용기의 함성! 크리율 +50% (2턴)' }
    },
    kkong: {
      name: '꽁꽁핑',
      passive: { enemySpd: -0.3 },
      onSupport: { freeze: 0.4, msg: '꽁꽁핑이 적을 얼렸다! (40% 확률 행동불능)' }
    },
    baro: {
      name: '바로핑',
      passive: { },
      onSupport: { defPen: 0.5, turns: 2, msg: '바로핑의 진실의 검! 적 방어 무시 50% (2턴)' }
    },
    // === 확장용: 추가 파트너 기본 효과 ===
    lala: {
      name: '라라핑',
      passive: { },
      onSupport: { spdBuff: 1.3, turns: 3, msg: '라라핑의 리듬댄스! 로미 속도 +30% (3턴)' }
    },
    truping: {
      name: '트러핑',
      passive: { },
      onSupport: { atkDown: -0.3, turns: 3, msg: '트러핑이 훼방을 놓았다! 적 공격력 -30% (3턴)' }
    }
  };

  // 파트너 객체 id → effect 매핑 헬퍼
  window.getPartnerEffect = function(partner){
    if(!partner) return null;
    const key = partner.id || partner.name;
    // 한글명 매핑
    const nameMap = {
      '하츄핑':'hatchu', '부끄핑':'bukku', '차차핑':'chacha',
      '아자핑':'aza', '꽁꽁핑':'kkong', '바로핑':'baro',
      '라라핑':'lala', '트러핑':'truping'
    };
    return window.PARTNER_EFFECTS[nameMap[key]] || window.PARTNER_EFFECTS[key] || null;
  };

  console.log('[UNIFIED] PARTNER_EFFECTS 로드:', Object.keys(window.PARTNER_EFFECTS).length, '종');
})();

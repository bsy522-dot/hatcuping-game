// ============================================================
// UNIFIED v4 - ACT2 성 탈출 (플랫포머)
// 4 레벨 구성: 복도 → 계단 → 지붕 → 중정(성기사 보스)
// 엔진: window.PlatformerEngine 의 start(opts)
// Dispatcher 트리거: switchMode('platformer', ACT2.opts)
// ============================================================
(function(){
  'use strict';

  // 좌표 공통 기준:
  //  - 화면 420×750 세로
  //  - 바닥 플랫폼 y ≈ 640 (GROUND)
  //  - 캐릭터 PH=48 이므로 착지 시 로미 머리는 y ≈ 592
  //  - 중간 플랫폼 y = 500/420/340 등

  // ---------- Level 1: 복도 ----------
  // 좁고 길쭉한 복도. 기본 점프/이동 학습용. 경비병 2명.
  const LEVEL1 = {
    id: 'corridor',
    title: '성 복도',
    bg: 'bg_corridor',
    palette: ['#2a1a3a','#4a2a5a','#1a0a2a'],
    spawn: { x: 40, y: 560 },
    worldW: 2400,
    platforms: [
      // 바닥(중간에 1구간 끊어짐 — 첫 점프 유도)
      { x: 0,    y: 640, w: 520,  h: 40, type: 'stone' },
      { x: 620,  y: 640, w: 420,  h: 40, type: 'stone' },
      { x: 1140, y: 640, w: 560,  h: 40, type: 'stone' },
      { x: 1800, y: 640, w: 600,  h: 40, type: 'stone' },
      // 중간 플랫폼 (선택 루트)
      { x: 300,  y: 520, w: 80,   h: 14, type: 'wood' },
      { x: 800,  y: 500, w: 90,   h: 14, type: 'wood' },
      { x: 1000, y: 420, w: 70,   h: 14, type: 'wood' },
      { x: 1350, y: 500, w: 100,  h: 14, type: 'wood' },
      { x: 1580, y: 420, w: 90,   h: 14, type: 'wood' },
      { x: 2000, y: 520, w: 120,  h: 14, type: 'wood' }
    ],
    hazards: [
      // 끊어진 바닥의 가시 (떨어지면 데미지)
      { x: 525, y: 624, w: 90, h: 20, type: 'spike' }
    ],
    enemies: [
      { x: 720,  y: 608, kind: 'guard_s', w: 32, h: 32 },
      { x: 1400, y: 608, kind: 'guard_s', w: 32, h: 32 }
    ],
    goal: { x: 2300, y: 560, w: 50, h: 80 },
    goalLabel: '다음'
  };

  // ---------- Level 2: 계단/움직이는 플랫폼 ----------
  // 수직 상승 + 움직이는 플랫폼 흉내 (sin 적용된 y는 엔진이 지원 X → 정적 배치로 "점프 타이밍" 챌린지)
  const LEVEL2 = {
    id: 'stairs',
    title: '대계단',
    bg: 'bg_castle',
    palette: ['#3a2050','#6a3a8a','#2a1040'],
    spawn: { x: 30, y: 580 },
    worldW: 2000,
    platforms: [
      { x: 0,    y: 640, w: 200, h: 40, type: 'stone' },
      // 올라가는 계단
      { x: 240,  y: 600, w: 80,  h: 14, type: 'stone' },
      { x: 360,  y: 560, w: 80,  h: 14, type: 'stone' },
      { x: 480,  y: 520, w: 80,  h: 14, type: 'stone' },
      { x: 600,  y: 480, w: 80,  h: 14, type: 'stone' },
      { x: 720,  y: 440, w: 80,  h: 14, type: 'stone' },
      { x: 840,  y: 400, w: 80,  h: 14, type: 'stone' },
      // 상단 회피 구간(좁은 발판 연속)
      { x: 980,  y: 380, w: 60,  h: 12, type: 'wood' },
      { x: 1080, y: 340, w: 60,  h: 12, type: 'wood' },
      { x: 1200, y: 380, w: 60,  h: 12, type: 'wood' },
      { x: 1320, y: 340, w: 60,  h: 12, type: 'wood' },
      { x: 1440, y: 380, w: 60,  h: 12, type: 'wood' },
      // 랜딩
      { x: 1560, y: 440, w: 440, h: 20, type: 'stone' }
    ],
    hazards: [
      // 계단 사이 좁은 틈에 가시
      { x: 210, y: 624, w: 30, h: 20, type: 'spike' },
      { x: 940, y: 624, w: 40, h: 20, type: 'spike' }
    ],
    enemies: [
      { x: 620, y: 448, kind: 'guard_s', w: 32, h: 32 },
      { x: 1620,y: 408, kind: 'guard_s', w: 32, h: 32 }
    ],
    goal: { x: 1900, y: 360, w: 50, h: 80 },
    goalLabel: '지붕으로'
  };

  // ---------- Level 3: 지붕 ----------
  // 넓은 점프 폭, 추락 주의. 낙사 위험↑
  const LEVEL3 = {
    id: 'roof',
    title: '지붕',
    bg: 'bg_roof',
    palette: ['#1a1a3a','#3a3a7a','#0a0a20'],
    spawn: { x: 30, y: 560 },
    worldW: 2600,
    platforms: [
      // 지붕 블록들 (사이 틈이 넓음)
      { x: 0,    y: 640, w: 360, h: 40, type: 'roof' },
      { x: 480,  y: 620, w: 240, h: 40, type: 'roof' },
      { x: 820,  y: 580, w: 220, h: 40, type: 'roof' },
      { x: 1140, y: 620, w: 240, h: 40, type: 'roof' },
      { x: 1460, y: 560, w: 220, h: 40, type: 'roof' },
      { x: 1780, y: 620, w: 220, h: 40, type: 'roof' },
      { x: 2100, y: 580, w: 440, h: 40, type: 'roof' },
      // 보조 점프대
      { x: 400,  y: 520, w: 50,  h: 10, type: 'wood' },
      { x: 1060, y: 500, w: 50,  h: 10, type: 'wood' },
      { x: 1700, y: 480, w: 50,  h: 10, type: 'wood' }
    ],
    hazards: [],   // 지붕 사이 공간 자체가 낙사 (FALL_Y)
    enemies: [
      { x: 1200, y: 588, kind: 'raven', w: 32, h: 28 },
      { x: 1820, y: 588, kind: 'raven', w: 32, h: 28 }
    ],
    goal: { x: 2500, y: 500, w: 50, h: 80 },
    goalLabel: '중정'
  };

  // ---------- Level 4: 중정 — 성기사 보스전 ----------
  const LEVEL4 = {
    id: 'plaza_boss',
    title: '성 중정',
    bg: 'bg_plaza',
    palette: ['#40202a','#70404a','#20100a'],
    spawn: { x: 60, y: 500 },
    worldW: 1400,
    bossFloor: 560,
    platforms: [
      // 넓은 바닥 (보스 기동 공간)
      { x: 0,    y: 560, w: 1400, h: 40, type: 'stone' },
      // 회피용 발판 (점프 공격 피하기)
      { x: 220,  y: 460, w: 80,   h: 14, type: 'stone' },
      { x: 620,  y: 420, w: 90,   h: 14, type: 'stone' },
      { x: 1000, y: 460, w: 80,   h: 14, type: 'stone' }
    ],
    hazards: [],
    enemies: [],
    boss: { name: '성기사 가르드', x: 1050, y: 450 },
    goal: null,         // 보스 처치 후 할머니 컷신 → onClear
    goalLabel: ''
  };

  // ---------- Act2 엔트리 ----------
  window.ACT2 = {
    id: 'act2_escape',
    triggerMode: 'platformer',
    opts: {
      levels: [LEVEL1, LEVEL2, LEVEL3, LEVEL4],
      returnTo: 'act2_post'   // 완료 후 v2_scene 으로 이어갈 대본 id
    }
  };

  // (호환) 개별 레벨도 외부에서 참조 가능하게
  window.ACT2.LEVELS = [LEVEL1, LEVEL2, LEVEL3, LEVEL4];

  console.log('[UNIFIED] ACT2 성탈출 준비 — 4레벨(복도/계단/지붕/보스)');
})();

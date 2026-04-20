// ============================================================
// UNIFIED v4 - ACT3: 성문 → 버스정류장 → 러닝 → 버스 안 꿈 컷신
// 시퀀스:
//   1) castle_gate 맵 짧게 이동 (도보로 버스정류장까지)
//   2) 버스아저씨 NPC 대화 (v2_scene)
//   3) RunEngine 리듬 미니게임
//   4) 버스 안 꿈 컷신 (트러핑 실루엣, 울림 텍스트)
//   5) 꽃마을 도착 → Act4로 진입
//
// Dispatcher 사용: window.Dispatcher.switchMode('모드', opts)
// ============================================================
(function(){
  'use strict';

  // ===== 맵 데이터 등록: castle_gate (성문 → 버스정류장 가는 길) =====
  const W = 15, H = 20;
  function build(base, wall, opts){
    opts = opts || {};
    const g = [];
    for(let y=0;y<H;y++){
      const row = [];
      for(let x=0;x<W;x++){
        if(x===0||x===W-1||y===0||y===H-1) row.push(wall);
        else row.push(base);
      }
      g.push(row);
    }
    function fillRect(tile, r){
      const [x,y,w,h] = r;
      for(let j=y; j<y+h && j<H-1; j++){
        for(let i=x; i<x+w && i<W-1; i++){
          if(i>0 && j>0) g[j][i] = tile;
        }
      }
    }
    (opts.tallgrass||[]).forEach(r=>fillRect(12,r));
    (opts.trees||[]).forEach(p=>{ if(p[1]>0 && p[1]<H-1 && p[0]>0 && p[0]<W-1) g[p[1]][p[0]] = 2; });
    (opts.warps||[]).forEach(p=>{ g[p[1]][p[0]] = 11; });
    if(opts.extra) opts.extra(g);
    return g;
  }

  const CASTLE_GATE = {
    id: 'castle_gate', name: '성문 앞 숲길', act: 3, w: W, h: H,
    tiles: build(0, 2, {
      trees: [[3,5],[4,5],[10,5],[11,5],[3,12],[11,12]],
      tallgrass: [[5,8,4,2]],
      warps: [[7,18]],
      extra: (g) => {
        // 길
        for(let y=2; y<=17; y++) g[y][7] = 1;
        for(let y=2; y<=17; y++) g[y][6] = 1;
      }
    }),
    npcs: [
      { id:'guard', name:'근위병', x:10, y:3, dialog:['조심히 다녀오세요 공주님!', '하츄핑을 꼭 찾으시길...'] },
      { id:'old_man', name:'꽃집 아줌마', x:4, y:8, dialog:['어머 로미 공주님!', '버스정류장이 저 아래 있어요!'] }
    ],
    warps: [{ x:7, y:18, to:'bus_stop', tx:7, ty:2 }],
    encounters: [],
    startX: 7, startY: 2
  };

  const BUS_STOP = {
    id: 'bus_stop', name: '버스정류장', act: 3, w: W, h: H,
    tiles: build(0, 2, {
      trees:[[2,3],[12,3]],
      warps:[[7,1]],
      extra:(g)=>{
        // 아스팔트
        for(let y=10; y<=14; y++) for(let x=1; x<W-1; x++) g[y][x] = 9;
        // 정류장 벤치
        for(let x=4; x<=10; x++) g[8][x] = 3;
      }
    }),
    npcs: [
      { id:'bus_driver', name:'버스아저씨', x:7, y:12, interact:'bus_run' }
    ],
    warps: [{ x:7, y:1, to:'castle_gate', tx:7, ty:17 }],
    encounters: [],
    startX: 7, startY: 2
  };

  // V3Map이 로드된 후에 등록 (타이밍 상 즉시 주입)
  if(window.V3Map && window.V3Map.registerMap){
    window.V3Map.registerMap('castle_gate', CASTLE_GATE);
    window.V3Map.registerMap('bus_stop', BUS_STOP);
  } else {
    // V3Map 로드 전이면 MAPS에 직접 주입
    window.UNIFIED_MAPS = window.UNIFIED_MAPS || {};
    window.UNIFIED_MAPS.castle_gate = CASTLE_GATE;
    window.UNIFIED_MAPS.bus_stop = BUS_STOP;
  }

  // ===== 배우 =====
  const A_ROMI = { id:'romi', name:'로미', side:'right' };
  const A_BUS  = { id:'bus_driver', name:'버스아저씨', side:'left' };
  const A_TRUP = { id:'truping', name:'???', side:'left' };
  const A_NAR  = { id:'narration', name:'', side:'center' };

  // ===== 컷신: 버스정류장에서 아저씨와 만남 =====
  const BUS_INTRO_SCENES = [
    {
      id: 'act3_bus_intro_1',
      location: 'bus_stop',
      bg: 'bg_plaza',
      actors: [A_ROMI, A_BUS],
      dialog: [
        { who:'narration', text:'저 멀리 노란 버스 한 대가 보인다.\n버스 아저씨가 손을 흔들고 있다.' },
        { who:'bus_driver', text:'학생! 버스 탈거면 뛰어와!' },
        { who:'bus_driver', text:'이거 꽃마을행 막차야!\n놓치면 오늘은 못 간다고!' },
        { who:'romi', text:'아, 잠시만요! 지금 갈게요!' },
        { who:'bus_driver', text:'리듬에 맞춰서 달려!\n이 아저씨가 박자 쳐줄게!' }
      ]
    }
  ];

  // ===== 컷신: 러닝 결과 대화 =====
  function makePostRunScenes(passed){
    return [{
      id: 'act3_bus_post_run',
      location: 'bus_stop',
      bg: 'bg_plaza',
      actors: [A_ROMI, A_BUS],
      dialog: passed ? [
        { who:'bus_driver', text:'오오! 리듬감 있구먼!' },
        { who:'bus_driver', text:'자, 타요 타!' },
        { who:'romi', text:'감사합니다 아저씨!' }
      ] : [
        { who:'bus_driver', text:'헉헉... 놓쳤구나 얘야.' },
        { who:'bus_driver', text:'괜찮아, 다음엔 잘 할 수 있을거야!' },
        { who:'bus_driver', text:'아저씨가 기다려 줄게.\n자, 얼른 타요!' },
        { who:'romi', text:'고맙습니다...' }
      ]
    }];
  }

  // ===== 컷신: 버스 안 꿈 =====
  const BUS_DREAM_SCENES = [
    {
      id: 'act3_bus_dream_1',
      location: 'castle_corridor',  // 꿈 배경 (어두운 복도 느낌)
      bg: 'bg_corridor',
      actors: [A_ROMI],
      dialog: [
        { who:'narration', text:'덜컹거리는 버스.\n로미는 창가에 기대어 스르르 잠이 들었다.' },
        { who:'narration', text:'꿈속—\n어디선가 목소리가 들린다.' }
      ]
    },
    {
      id: 'act3_bus_dream_2',
      location: 'castle_corridor',
      bg: 'bg_corridor',
      actors: [A_TRUP],
      dialog: [
        { who:'truping', text:'…사라진…' },
        { who:'truping', text:'…사라져…' },
        { who:'truping', text:'…전부… 사라져버려…' }
      ]
    },
    {
      id: 'act3_bus_dream_3',
      location: 'castle_corridor',
      bg: 'bg_corridor',
      actors: [A_ROMI],
      dialog: [
        { who:'narration', text:'로미는 식은땀을 흘리며 깨어났다.' },
        { who:'romi', text:'…방금… 그건 뭐였지…?' },
        { who:'narration', text:'창 밖으로 꽃향기가 실려 온다.\n어느새 버스는 꽃마을에 도착했다.' }
      ]
    }
  ];

  // ===== Stage 정의 =====
  // 각 stage: { enter: (go) => void }
  //   go()는 다음 stage로 이동
  const stages = [
    // Stage 1: 성문 앞 숲길 (짧게 이동)
    {
      id: 'castle_gate',
      enter: function(next){
        if(!window.Dispatcher) return next();
        window.Dispatcher.switchMode('v3_map', {
          mapId: 'castle_gate',
          encounterRate: 0,
          onWarpOut: (to) => {
            if(to === 'bus_stop'){
              // 자연스럽게 다음 스테이지로
              setTimeout(() => next(), 80);
              return false;  // V3Map 자체 워프 막고 우리가 처리
            }
            return true;
          },
          onInteractNPC: (npc) => {
            if(npc.dialog && window.SceneEngine){
              window.SceneEngine.start([{
                actors: [{id:npc.id||'npc', name:npc.name, side:'left'}, A_ROMI],
                dialog: (Array.isArray(npc.dialog)?npc.dialog:[npc.dialog]).map(t=>({who:npc.id||'npc', text:t}))
              }], () => {});
            }
          }
        });
      }
    },

    // Stage 2: 버스정류장 (v3_map) - 아저씨 NPC 상호작용
    {
      id: 'bus_stop',
      enter: function(next){
        if(!window.Dispatcher) return next();
        window.Dispatcher.switchMode('v3_map', {
          mapId: 'bus_stop',
          encounterRate: 0,
          onInteractNPC: (npc) => {
            if(npc.interact === 'bus_run'){
              // 아저씨 대화 → 러닝 미니게임
              if(window.SceneEngine){
                window.SceneEngine.start(BUS_INTRO_SCENES, () => next());
              } else {
                next();
              }
            }
          }
        });
      }
    },

    // Stage 3: 러닝 미니게임
    {
      id: 'bus_run',
      enter: function(next){
        if(!window.Dispatcher) return next();
        window.Dispatcher.switchMode('run', {
          duration: 10,
          markers: 25,
          onClear: (res) => {
            // 성공 — 다음으로 (플래그 저장)
            if(window.STATE){
              window.STATE.storyFlags = window.STATE.storyFlags || {};
              window.STATE.storyFlags.act3_run_passed = (res.hitRate >= 0.7);
              window.STATE.storyFlags.act3_run_rate = res.hitRate;
            }
            setTimeout(() => next(), 500);
          },
          onFail: (res) => {
            if(window.STATE){
              window.STATE.storyFlags = window.STATE.storyFlags || {};
              window.STATE.storyFlags.act3_run_passed = false;
              window.STATE.storyFlags.act3_run_rate = res.hitRate;
            }
            setTimeout(() => next(), 500);
          }
        });
      }
    },

    // Stage 4: 러닝 결과 대화
    {
      id: 'post_run',
      enter: function(next){
        if(!window.Dispatcher) return next();
        const passed = !!(window.STATE && window.STATE.storyFlags && window.STATE.storyFlags.act3_run_passed);
        window.Dispatcher.switchMode('v2_scene');
        if(window.SceneEngine){
          window.SceneEngine.start(makePostRunScenes(passed), () => next());
        } else {
          next();
        }
      }
    },

    // Stage 5: 버스 안 꿈 컷신
    {
      id: 'bus_dream',
      enter: function(next){
        if(!window.Dispatcher) return next();
        window.Dispatcher.switchMode('v2_scene');
        if(window.SceneEngine){
          window.SceneEngine.start(BUS_DREAM_SCENES, () => next());
        } else {
          next();
        }
      }
    },

    // Stage 6: Act4로 전환
    {
      id: 'to_act4',
      enter: function(next){
        if(window.STATE){
          window.STATE.storyFlags = window.STATE.storyFlags || {};
          window.STATE.storyFlags.act3_done = true;
          window.STATE.act = 4;
        }
        if(window.ACT4 && typeof window.ACT4.start === 'function'){
          window.ACT4.start();
        } else {
          console.log('[ACT3] 완료 — ACT4.start() 호출 대기');
        }
      }
    }
  ];

  function runStage(i){
    if(i >= stages.length) return;
    const stage = stages[i];
    console.log('[ACT3] Stage', i, stage.id);
    stage.enter(() => runStage(i+1));
  }

  window.ACT3 = {
    id: 'act3_bus',
    title: '버스 타고 꽃마을로',
    stages: stages,
    start: function(){ runStage(0); }
  };

  console.log('[UNIFIED] ACT3 (버스 러닝) 로드 완료 -', stages.length, '스테이지');
})();

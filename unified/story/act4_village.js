// ============================================================
// UNIFIED v4 - ACT4: 꽃마을 도착 → 마리 대화 → 첫 전투 → 리암 동행
// 시퀀스:
//   1) heart_town_v4 맵 진입
//   2) 마리 NPC 대화 (v2_scene)
//   3) 마을 밖 route_1_v4 로 나감
//   4) 해핑 야생 조우 → V3Battle 첫 전투
//   5) 전투 후 리암 왕자 등장 → 동행 대화 → 동료(서사적) 합류
//
// 로미는 이 시점부터 전투에서 직접 싸운다.
// 파트너(티니핑)는 아직 없음 (Act5에서 하츄핑 합류).
// ============================================================
(function(){
  'use strict';

  // ===== 맵 데이터 등록 =====
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
    (opts.water||[]).forEach(r=>fillRect(4,r));
    (opts.tallgrass||[]).forEach(r=>fillRect(12,r));
    (opts.flowers||[]).forEach(r=>fillRect(5,r));
    (opts.trees||[]).forEach(p=>{ if(p[1]>0 && p[1]<H-1 && p[0]>0 && p[0]<W-1) g[p[1]][p[0]] = 2; });
    (opts.chests||[]).forEach(p=>{ g[p[1]][p[0]] = 10; });
    (opts.warps||[]).forEach(p=>{ g[p[1]][p[0]] = 11; });
    if(opts.extra) opts.extra(g);
    return g;
  }

  const HEART_TOWN_V4 = {
    id: 'heart_town_v4', name: '꽃마을', act: 4, w: W, h: H,
    tiles: build(0, 2, {
      trees: [[2,2],[12,2],[2,17],[12,17]],
      flowers: [[3,4,3,2],[9,4,3,2],[3,14,9,2]],
      warps: [[7,1],[7,18]],
      extra:(g)=>{
        // 마을 광장 (나무바닥)
        for(let y=8; y<=11; y++) for(let x=5; x<=9; x++) g[y][x] = 8;
        // 집 (벽)
        g[3][3]=3; g[3][4]=3; g[3][5]=3; g[4][3]=3; g[4][5]=3;
        g[3][9]=3; g[3][10]=3; g[3][11]=3; g[4][9]=3; g[4][11]=3;
      }
    }),
    npcs: [
      { id:'mari', name:'마리', x:7, y:9, dialog:'...', interact:'mari_greet' },
      { id:'florist', name:'꽃집 아줌마', x:3, y:14, dialog:['꽃 사가요~ 한 송이에 10골드예요.'] }
    ],
    warps: [
      { x:7, y:1, to:'bus_stop', tx:7, ty:12 },
      { x:7, y:18, to:'route_1_v4', tx:7, ty:1 }
    ],
    encounters: [],
    startX: 7, startY: 3
  };

  const ROUTE_1_V4 = {
    id: 'route_1_v4', name: '꽃마을 외곽', act: 4, w: W, h: H,
    tiles: build(0, 2, {
      trees: [[3,5],[4,6],[10,5],[11,6],[3,14],[11,14]],
      tallgrass: [[5,8,5,3], [5,13,5,3]],
      warps: [[7,1],[7,18]]
    }),
    npcs: [],
    warps: [
      { x:7, y:1, to:'heart_town_v4', tx:7, ty:17 },
      { x:7, y:18, to:'emotion_forest_v4', tx:7, ty:1 }
    ],
    encounters: ['해핑','방실핑'],
    startX: 7, startY: 2
  };

  // V3Map 등록
  function registerMaps(){
    const register = (window.V3Map && window.V3Map.registerMap) ? window.V3Map.registerMap : (id, data) => {
      window.UNIFIED_MAPS = window.UNIFIED_MAPS || {};
      window.UNIFIED_MAPS[id] = data;
    };
    register('heart_town_v4', HEART_TOWN_V4);
    register('route_1_v4', ROUTE_1_V4);
  }
  registerMaps();

  // ===== 배우 =====
  const A_ROMI = { id:'romi', name:'로미', side:'right' };
  const A_MARI = { id:'mari', name:'마리', side:'left' };
  const A_LIAM = { id:'liam', name:'리암', side:'left' };
  const A_NAR  = { id:'narration', name:'', side:'center' };

  // ===== 대화 씬 =====
  const MARI_GREET = [{
    id:'act4_mari_1', location:'heart_town_v4', bg:'bg_plaza',
    actors:[A_ROMI, A_MARI],
    dialog:[
      { who:'narration', text:'꽃마을 광장.\n익숙한 얼굴이 뛰어온다.' },
      { who:'mari', text:'로미야! 오랜만이야!' },
      { who:'mari', text:'어머, 공주님이 이런 곳까지!\n설마 그 소문이 사실이야?' },
      { who:'romi', text:'마리, 나 하츄핑을 찾으러 왔어.' },
      { who:'mari', text:'하츄핑…?!\n얼마 전부터 이상한 일들이 생기고 있어.' },
      { who:'mari', text:'마을 밖 숲에서\n티니핑들이 자꾸 날뛰고 있다는 소문이야.' },
      { who:'romi', text:'…내가 가봐야겠어.' },
      { who:'mari', text:'조심해, 로미야.\n너 혼자서는 위험할지도 몰라!' }
    ]
  }];

  const PRE_BATTLE = [{
    id:'act4_pre_battle', location:'route_1_v4', bg:'bg_forest',
    actors:[A_ROMI],
    dialog:[
      { who:'narration', text:'마을 밖 풀숲.\n스륵, 풀이 움직인다.' },
      { who:'narration', text:'분홍색 티니핑 하나가 튀어나왔다!' },
      { who:'romi', text:'해핑?! 왜 이렇게 흥분해 있어?' },
      { who:'narration', text:'해핑이 사납게 으르렁거린다.\n피할 수 없다!' }
    ]
  }];

  const POST_BATTLE_WIN = [{
    id:'act4_post_win', location:'route_1_v4', bg:'bg_forest',
    actors:[A_ROMI, A_LIAM],
    dialog:[
      { who:'narration', text:'해핑이 고개를 털더니 풀숲 속으로 사라졌다.' },
      { who:'romi', text:'왠지… 슬퍼 보였어.' },
      { who:'narration', text:'그때 뒤에서 누군가 달려온다.' },
      { who:'liam', text:'누나—!!' },
      { who:'romi', text:'리암?! 너 왜 여기 있어!' },
      { who:'liam', text:'혼자 보내기 싫었어!\n누나, 나도 갈래!' },
      { who:'romi', text:'…리암.' },
      { who:'liam', text:'어머니랑 아버지한텐\n편지 써놓고 왔어! 헤헤.' },
      { who:'liam', text:'같이 하츄핑 찾으러 가자!\n응?' },
      { who:'romi', text:'…그래, 같이 가자.\n대신 내 옆 꼭 붙어 있어.' },
      { who:'liam', text:'응! 약속할게!' }
    ]
  }];

  const POST_BATTLE_LOSE = [{
    id:'act4_post_lose', location:'route_1_v4', bg:'bg_forest',
    actors:[A_ROMI, A_LIAM],
    dialog:[
      { who:'narration', text:'정신을 차리자 로미는 마을로 돌아와 있었다.' },
      { who:'liam', text:'누나! 괜찮아?!' },
      { who:'romi', text:'리암?! 너 왜 여기…' },
      { who:'liam', text:'누나가 쓰러진 걸\n내가 마을 사람들이랑 옮겼어!' },
      { who:'romi', text:'…고마워, 리암.' },
      { who:'liam', text:'누나 혼자는 안 돼.\n나도 따라갈래!' },
      { who:'romi', text:'…그래. 같이 가자.' }
    ]
  }];

  // ===== 스테이지 =====
  const stages = [
    // S1: 꽃마을 맵 진입
    {
      id:'heart_town_v4',
      enter:function(next){
        if(!window.Dispatcher) return next();
        window.Dispatcher.switchMode('v3_map', {
          mapId:'heart_town_v4',
          encounterRate: 0,
          onInteractNPC:(npc) => {
            if(npc.interact === 'mari_greet'){
              if(window.SceneEngine){
                window.Dispatcher.switchMode('v2_scene');
                window.SceneEngine.start(MARI_GREET, () => {
                  window.STATE.storyFlags = window.STATE.storyFlags || {};
                  window.STATE.storyFlags.act4_mari_met = true;
                  // 맵으로 복귀
                  window.Dispatcher.switchMode('v3_map', {
                    mapId:'heart_town_v4',
                    encounterRate: 0,
                    onWarpOut:(to)=>{
                      if(to === 'route_1_v4'){ setTimeout(()=>next(), 80); return false; }
                      return true;
                    }
                  });
                });
              } else { next(); }
            } else if(npc.dialog && window.SceneEngine){
              window.Dispatcher.switchMode('v2_scene');
              window.SceneEngine.start([{
                actors:[{id:npc.id||'npc',name:npc.name,side:'left'}, A_ROMI],
                dialog:(Array.isArray(npc.dialog)?npc.dialog:[npc.dialog]).map(t=>({who:npc.id||'npc',text:t}))
              }], ()=> {
                window.Dispatcher.switchMode('v3_map', { mapId:'heart_town_v4', encounterRate: 0 });
              });
            }
          },
          onWarpOut:(to)=>{
            if(to === 'route_1_v4'){
              const flagOk = window.STATE && window.STATE.storyFlags && window.STATE.storyFlags.act4_mari_met;
              if(!flagOk){
                // 마리와 얘기부터
                if(window.SceneEngine){
                  window.Dispatcher.switchMode('v2_scene');
                  window.SceneEngine.start([{
                    actors:[A_NAR], dialog:[{who:'narration',text:'먼저 마리와 이야기를 나눠야 할 것 같다.'}]
                  }], ()=> window.Dispatcher.switchMode('v3_map',{mapId:'heart_town_v4',encounterRate:0}));
                }
                return false;
              }
              setTimeout(()=>next(), 80);
              return false;
            }
            return true;
          }
        });
      }
    },

    // S2: 외곽 진입 → 사전 대화 → 전투
    {
      id:'pre_battle',
      enter:function(next){
        if(!window.Dispatcher) return next();
        window.Dispatcher.switchMode('v2_scene');
        if(window.SceneEngine){
          window.SceneEngine.start(PRE_BATTLE, () => next());
        } else { next(); }
      }
    },

    // S3: 첫 전투 (로미 vs 해핑)
    {
      id:'first_battle',
      enter:function(next){
        if(!window.Dispatcher) return next();
        const romi = window.makeRomi ? window.makeRomi() : null;
        if(!romi){ console.error('[ACT4] makeRomi 실패'); return next(); }
        const enemy = makeWildEnemy('해핑', 3);
        window.Dispatcher.switchMode('v3_battle', {});
        if(window.V3Battle && window.V3Battle.start){
          window.V3Battle.start(romi, enemy, {
            wild: true, allowCapture: false,
            onVictory: (r) => {
              window.STATE.storyFlags = window.STATE.storyFlags || {};
              window.STATE.storyFlags.act4_first_battle_won = true;
              next();
            },
            onDefeat: (r) => {
              window.STATE.storyFlags = window.STATE.storyFlags || {};
              window.STATE.storyFlags.act4_first_battle_won = false;
              next();
            }
          });
        } else { next(); }
      }
    },

    // S4: 전투 후 리암 등장
    {
      id:'post_battle',
      enter:function(next){
        if(!window.Dispatcher) return next();
        const won = window.STATE && window.STATE.storyFlags && window.STATE.storyFlags.act4_first_battle_won;
        window.Dispatcher.switchMode('v2_scene');
        const scenes = won ? POST_BATTLE_WIN : POST_BATTLE_LOSE;
        if(window.SceneEngine){
          window.SceneEngine.start(scenes, () => {
            // 리암 동행 플래그
            window.STATE.storyFlags = window.STATE.storyFlags || {};
            window.STATE.storyFlags.act4_liam_joined = true;
            next();
          });
        } else { next(); }
      }
    },

    // S5: Act5로 진입
    {
      id:'to_act5',
      enter:function(next){
        if(window.STATE){
          window.STATE.storyFlags = window.STATE.storyFlags || {};
          window.STATE.storyFlags.act4_done = true;
          window.STATE.act = 5;
        }
        if(window.ACT5 && typeof window.ACT5.start === 'function'){
          window.ACT5.start();
        } else {
          console.log('[ACT4] 완료 — ACT5 대기');
        }
      }
    }
  ];

  // ===== 적 생성 헬퍼 =====
  function makeWildEnemy(name, lv){
    // tiniping_dex에서 찾아서 생성, 없으면 기본값
    const dex = (window.TINIPING_DEX || []).find(d => d.name === name);
    const bs = (dex && dex.baseStats) || { hp:40, atk:40, def:35, spd:45, spAtk:40, spDef:40 };
    const scaleF = 1 + Math.max(0, lv-5) * 0.12;
    const scale = k => Math.max(1, Math.floor((bs[k]||40) * scaleF));
    return {
      id: name, name: name,
      lv: lv || 3,
      type: (dex && dex.type) || ['사랑'],
      hp: scale('hp'), maxHp: scale('hp'),
      atk: scale('atk'), def: scale('def'), spd: scale('spd'),
      spAtk: scale('spAtk'), spDef: scale('spDef'),
      stats: bs,
      skills: (dex && dex.skills || ['태클']).slice(0,2).map(s => ({ name:s, power:35, type:(dex&&dex.type&&dex.type[0])||'어둠' })),
      status: null
    };
  }

  function runStage(i){
    if(i >= stages.length) return;
    const stage = stages[i];
    console.log('[ACT4] Stage', i, stage.id);
    stage.enter(() => runStage(i+1));
  }

  window.ACT4 = {
    id: 'act4_village',
    title: '꽃마을의 인연',
    stages: stages,
    makeWildEnemy: makeWildEnemy,
    start: function(){ runStage(0); }
  };

  console.log('[UNIFIED] ACT4 (꽃마을 전투) 로드 완료 -', stages.length, '스테이지');
})();

// ============================================================
// UNIFIED v4 - ACT5: 금단의 숲 → 하츄핑 조우 → 호감도 쌓기 → 파트너 합류
// 시퀀스:
//   1) emotion_forest_v4 진입 (리암 동행, 거리 느낌)
//   2) 숲 깊은 곳에 도달 → 하츄핑 발견 (경계 상태)
//   3) 호감도 빌드업 3단계: 쿠키 → 자장가 → 이름 부르기
//   4) 하츄핑 심장이 열림 → 파트너 합류 → 하트링 빛남
//   5) Act6 (트러핑 예고)로 이어짐
//
// v3 rpg Act0 choices 메커니즘을 순차 서사로 풀어 SceneEngine 호환.
// ============================================================
(function(){
  'use strict';

  // ===== 맵: 감정의 숲 =====
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
    (opts.flowers||[]).forEach(r=>fillRect(5,r));
    (opts.trees||[]).forEach(p=>{ if(p[1]>0 && p[1]<H-1 && p[0]>0 && p[0]<W-1) g[p[1]][p[0]] = 2; });
    (opts.warps||[]).forEach(p=>{ g[p[1]][p[0]] = 11; });
    if(opts.extra) opts.extra(g);
    return g;
  }

  const EMOTION_FOREST_V4 = {
    id:'emotion_forest_v4', name:'감정의 숲', act:5, w:W, h:H,
    tiles: build(0, 2, {
      trees: [[2,3],[4,4],[11,4],[13,3],[2,9],[12,9],[3,15],[11,15]],
      tallgrass: [[4,6,7,3],[4,12,7,3]],
      flowers: [[6,17,3,1]],
      warps: [[7,1],[7,18]]
    }),
    npcs: [],
    warps: [
      { x:7, y:1,  to:'route_1_v4',     tx:7, ty:17 },
      { x:7, y:18, to:'forbidden_forest_v4', tx:7, ty:1 }
    ],
    encounters: ['부끄핑','나도핑','방실핑'],
    startX: 7, startY: 2
  };

  const FORBIDDEN_FOREST_V4 = {
    id:'forbidden_forest_v4', name:'금단의 숲', act:5, w:W, h:H,
    tiles: build(6, 2, {
      trees: [[2,2],[4,3],[11,3],[13,2],[2,8],[12,8],[3,13],[11,13],[4,17],[11,17]],
      tallgrass: [[3,5,9,3]],
      flowers: [[7,10,1,1]],
      warps: [[7,1]]
    }),
    npcs: [
      { id:'hatchu_wild', name:'???', x:7, y:10, interact:'hatchu_first_encounter' }
    ],
    warps: [
      { x:7, y:1, to:'emotion_forest_v4', tx:7, ty:17 }
    ],
    encounters: [],
    startX: 7, startY: 2
  };

  function registerMaps(){
    const register = (window.V3Map && window.V3Map.registerMap)
      ? window.V3Map.registerMap
      : (id, data) => { window.UNIFIED_MAPS = window.UNIFIED_MAPS || {}; window.UNIFIED_MAPS[id] = data; };
    register('emotion_forest_v4', EMOTION_FOREST_V4);
    register('forbidden_forest_v4', FORBIDDEN_FOREST_V4);
  }
  registerMaps();

  // ===== 배우 =====
  const A_ROMI  = { id:'romi',   name:'로미',   side:'right' };
  const A_LIAM  = { id:'liam',   name:'리암',   side:'left'  };
  const A_HATCHU= { id:'hatchu', name:'???',   side:'left'  };
  const A_NAR   = { id:'narration', name:'', side:'center'  };

  // ===== 컷신: 감정의 숲 입구 (리암 동행) =====
  const FOREST_ENTRY = [{
    id:'act5_forest_entry', location:'emotion_forest_v4', bg:'bg_forest',
    actors:[A_ROMI, A_LIAM],
    dialog:[
      { who:'narration', text:'바람이 분다.\n나뭇잎 사이로 햇살이 부서진다.' },
      { who:'liam', text:'누나… 여기가 감정의 숲 맞지?' },
      { who:'romi', text:'응. 이 숲을 지나면 금단의 숲이 나와.' },
      { who:'liam', text:'(덜덜)\n소문대로 무서운 곳이래…' },
      { who:'romi', text:'괜찮아, 리암.\n내가 앞장설게.' },
      { who:'narration', text:'로미는 용기를 내어\n숲 안쪽으로 걸어 들어간다.' }
    ]
  }];

  // ===== 컷신: 금단의 숲 경계 =====
  const FORBIDDEN_ENTRY = [{
    id:'act5_forbidden_entry', location:'forbidden_forest_v4', bg:'bg_forest_dark',
    actors:[A_ROMI, A_LIAM],
    dialog:[
      { who:'narration', text:'공기가 달라졌다.\n새소리도, 바람도 멈춰 있다.' },
      { who:'liam', text:'누나… 여기… 이상해.' },
      { who:'romi', text:'…여기가 금단의 숲이야.' },
      { who:'narration', text:'로미의 가슴이 세차게 뛴다.\n하츄핑이 — 가까이 있다.' },
      { who:'romi', text:'리암. 넌 여기서 기다려.\n난… 혼자 가야 할 것 같아.' },
      { who:'liam', text:'누나! 혼자는 위험해!' },
      { who:'romi', text:'(미소)\n내 심장이 이 순간만은 \n\"혼자 가라\"고 말하고 있어.' },
      { who:'liam', text:'…알았어. 조심해.' }
    ]
  }];

  // ===== 컷신: 하츄핑 조우 (경계) =====
  const HATCHU_FIRST_MEET = [{
    id:'act5_hatchu_meet', location:'forbidden_forest_v4', bg:'bg_forest_dark',
    actors:[A_ROMI, A_HATCHU],
    dialog:[
      { who:'narration', text:'숲 가장 깊은 곳.\n한 그루 큰 나무 아래,' },
      { who:'narration', text:'분홍빛 작은 심장이\n웅크리고 있다.' },
      { who:'hatchu', text:'…흑… 핑…' },
      { who:'romi', text:'어…?\n너… 다쳤어?' },
      { who:'hatchu', text:'(번쩍 고개를 들고)\n피이잉—!' },
      { who:'narration', text:'작은 아이가 꽃덤불 뒤로\n빠르게 숨어버렸다.' },
      { who:'romi', text:'기다려, 도망가지 마!\n…나쁜 사람 아니야.' }
    ]
  }];

  // ===== 호감도 빌드업 1: 쿠키 =====
  const AFFECTION_COOKIE = [{
    id:'act5_affection_cookie', location:'forbidden_forest_v4', bg:'bg_forest_dark',
    actors:[A_ROMI, A_HATCHU],
    dialog:[
      { who:'narration', text:'로미는 주머니에서\n따뜻한 쿠키 하나를 꺼냈다.' },
      { who:'romi', text:'배고프지…? 이거, 먹어도 돼.\n꽁꽁핑이 아침에 몰래 챙겨줬어.' },
      { who:'narration', text:'살짝 — 꽃덤불이 흔들린다.\n분홍빛 눈동자가 조심스레 내다본다.' },
      { who:'hatchu', text:'…핑…?' },
      { who:'romi', text:'응. 너 먹으라고.\n천천히 나와도 돼.' },
      { who:'narration', text:'하츄핑이 발을 들어\n한 걸음, 앞으로 내디뎠다.' },
      { who:'hatchu', text:'(쿠키를 쥐고)\n…암… 냠…' },
      { who:'romi', text:'(웃음)\n맛있지?' }
    ]
  }];

  // ===== 호감도 빌드업 2: 자장가 =====
  const AFFECTION_LULLABY = [{
    id:'act5_affection_lullaby', location:'forbidden_forest_v4', bg:'bg_forest_dark',
    actors:[A_ROMI, A_HATCHU],
    dialog:[
      { who:'narration', text:'쿠키를 다 먹은 하츄핑.\n그래도 아직 로미의 품엔 오지 않는다.' },
      { who:'romi', text:'…너도 혼자였지?\n외로웠지, 많이.' },
      { who:'hatchu', text:'…핑…' },
      { who:'romi', text:'(작게 노래를 부른다)\n♪ 반짝반짝 작은 별…' },
      { who:'romi', text:'♪ 아름답게 비치네…\n♪ 서쪽 하늘에서도, 동쪽 하늘에서도…' },
      { who:'narration', text:'하츄핑의 어깨가\n스르르 내려간다.' },
      { who:'hatchu', text:'(눈을 감으며)\n…따뜻해…' },
      { who:'romi', text:'응. 이제 무서워하지 않아도 돼.' }
    ]
  }];

  // ===== 호감도 빌드업 3: 이름 부르기 + 짝꿍 선언 =====
  const AFFECTION_NAMECALL = [{
    id:'act5_affection_namecall', location:'forbidden_forest_v4', bg:'bg_forest_dark',
    actors:[A_ROMI, A_HATCHU],
    dialog:[
      { who:'romi', text:'있잖아.\n나 너를 찾아서 여기까지 왔어.' },
      { who:'romi', text:'꿈속에서, 책 속에서,\n매일 밤 네가 날 불렀어.' },
      { who:'romi', text:'(심장에 손을 얹으며)\n…너 내 짝꿍이지?' },
      { who:'hatchu', text:'(눈을 크게 뜨고)\n핑…!' },
      { who:'romi', text:'네 이름을 말해 줄래?\n내가 꼭 불러줄게.' },
      { who:'narration', text:'하츄핑의 몸에서\n분홍빛이 새어 나오기 시작한다.' },
      { who:'hatchu', text:'핑…\n하… 츄… 핑…!' },
      { who:'hatchu', text:'하츄핑이야!\n내 이름은 — 하츄핑!' }
    ]
  }];

  // ===== 파트너 합류 + 하트링 빛남 =====
  const PARTNER_OATH = [{
    id:'act5_partner_oath', location:'forbidden_forest_v4', bg:'bg_forest_dark',
    actors:[A_ROMI, A_HATCHU],
    dialog:[
      { who:'romi', text:'하츄핑!\n드디어 만났어!' },
      { who:'hatchu', text:'(품에 폴짝 뛰어들며)\n핑핑— 짝꿍!' },
      { who:'narration', text:'로미의 손목에서\n하트링이 반짝 — 빛났다.' },
      { who:'narration', text:'짝꿍 맹세가\n세상에 새겨진 순간이다.' },
      { who:'romi', text:'(하츄핑을 꼭 안고)\n이제 다시 혼자 두지 않을게.' },
      { who:'hatchu', text:'핑! 로미 짝꿍! 영원히 핑!' },
      { who:'narration', text:'— 그러나 그 순간 —\n숲 저편에서 검은 바람이 불어왔다.' }
    ]
  }];

  // ===== 트러핑 예고 =====
  const TRUPPING_WARN = [{
    id:'act5_trup_warn', location:'forbidden_forest_v4', bg:'bg_forest_dark',
    actors:[A_ROMI, A_HATCHU],
    dialog:[
      { who:'narration', text:'차가운 목소리가\n숲 전체에 울려 퍼진다.' },
      { who:'narration', text:'"…사라져…\n…전부… 사라져버려…"' },
      { who:'hatchu', text:'(몸을 떨며)\n핑…! 로미, 저건…!' },
      { who:'romi', text:'버스 안 꿈에서 들었던 목소리야!' },
      { who:'narration', text:'하늘에서 분홍 눈이\n하나둘 사그라들어 시커멓게 변한다.' },
      { who:'romi', text:'…트러핑.\n그 아이가 찾아오고 있어.' },
      { who:'hatchu', text:'짝꿍! 나, 네 편이야!\n같이 싸울래!' },
      { who:'romi', text:'(고개를 끄덕이며)\n가자, 하츄핑.\n우리의 진짜 이야기는 이제부터야.' }
    ]
  }];

  // ===== 스테이지 정의 =====
  const stages = [
    // S1: 감정의 숲 입구 대화
    {
      id:'forest_entry_dialog',
      enter:function(next){
        if(!window.Dispatcher) return next();
        window.Dispatcher.switchMode('v2_scene');
        if(window.SceneEngine){
          window.SceneEngine.start(FOREST_ENTRY, () => next());
        } else next();
      }
    },
    // S2: 감정의 숲 자유 탐색 (간단히: 워프로 나가면 다음)
    {
      id:'emotion_forest_walk',
      enter:function(next){
        if(!window.Dispatcher) return next();
        window.Dispatcher.switchMode('v3_map', {
          mapId:'emotion_forest_v4',
          encounterRate: 0.08,
          onWarpOut:(to)=>{
            if(to === 'forbidden_forest_v4'){ setTimeout(()=>next(), 80); return false; }
            return true;
          }
        });
      }
    },
    // S3: 금단의 숲 입구 컷신
    {
      id:'forbidden_entry_dialog',
      enter:function(next){
        window.Dispatcher.switchMode('v2_scene');
        if(window.SceneEngine){
          window.SceneEngine.start(FORBIDDEN_ENTRY, () => next());
        } else next();
      }
    },
    // S4: 금단의 숲 맵 (하츄핑 NPC 상호작용 유도)
    {
      id:'forbidden_forest_walk',
      enter:function(next){
        window.Dispatcher.switchMode('v3_map', {
          mapId:'forbidden_forest_v4',
          encounterRate: 0,
          onInteractNPC:(npc)=>{
            if(npc.interact === 'hatchu_first_encounter'){
              next();
            }
          }
        });
      }
    },
    // S5: 하츄핑 첫 조우 컷신
    {
      id:'hatchu_meet',
      enter:function(next){
        window.Dispatcher.switchMode('v2_scene');
        if(window.SceneEngine){
          window.SceneEngine.start(HATCHU_FIRST_MEET, () => next());
        } else next();
      }
    },
    // S6~S8: 호감도 3단계 (쿠키 → 자장가 → 이름)
    {
      id:'affection_1_cookie',
      enter:function(next){
        window.Dispatcher.switchMode('v2_scene');
        if(window.SceneEngine){
          window.SceneEngine.start(AFFECTION_COOKIE, () => {
            window.STATE.storyFlags = window.STATE.storyFlags || {};
            window.STATE.storyFlags.act5_affection = (window.STATE.storyFlags.act5_affection||0) + 2;
            next();
          });
        } else next();
      }
    },
    {
      id:'affection_2_lullaby',
      enter:function(next){
        window.Dispatcher.switchMode('v2_scene');
        if(window.SceneEngine){
          window.SceneEngine.start(AFFECTION_LULLABY, () => {
            window.STATE.storyFlags.act5_affection = (window.STATE.storyFlags.act5_affection||0) + 3;
            next();
          });
        } else next();
      }
    },
    {
      id:'affection_3_namecall',
      enter:function(next){
        window.Dispatcher.switchMode('v2_scene');
        if(window.SceneEngine){
          window.SceneEngine.start(AFFECTION_NAMECALL, () => {
            window.STATE.storyFlags.act5_affection = (window.STATE.storyFlags.act5_affection||0) + 5;
            next();
          });
        } else next();
      }
    },
    // S9: 파트너 맹세 + 하트링
    {
      id:'partner_oath',
      enter:function(next){
        window.Dispatcher.switchMode('v2_scene');
        if(window.SceneEngine){
          window.SceneEngine.start(PARTNER_OATH, () => {
            // 파트너 합류
            window.STATE.partners = window.STATE.partners || [];
            if(!window.STATE.partners.find(p=>p.id==='hatchu')){
              window.STATE.partners.push({
                id:'hatchu', name:'하츄핑',
                lv: 5, hp: 40, maxHp: 40,
                atk: 12, def: 8, spd: 14,
                skills: ['사랑의 힘','치유의 빛'],
                affection: window.STATE.storyFlags.act5_affection || 10
              });
            }
            window.STATE.storyFlags.hatchu_joined = true;
            window.STATE.storyFlags.heart_ring_activated = true;
            next();
          });
        } else next();
      }
    },
    // S10: 트러핑 예고
    {
      id:'trupping_warn',
      enter:function(next){
        window.Dispatcher.switchMode('v2_scene');
        if(window.SceneEngine){
          window.SceneEngine.start(TRUPPING_WARN, () => next());
        } else next();
      }
    },
    // S11: Act6 진입
    {
      id:'to_act6',
      enter:function(next){
        window.STATE.storyFlags.act5_done = true;
        window.STATE.act = 6;
        if(window.ACT6 && typeof window.ACT6.start === 'function'){
          window.ACT6.start();
        } else {
          // Act6 미구현 시 엔딩 텍스트로 마무리
          window.Dispatcher.switchMode('v2_scene');
          if(window.SceneEngine){
            window.SceneEngine.start([{
              id:'act5_end_placeholder',
              actors:[A_NAR],
              dialog:[
                { who:'narration', text:'— 제 1부 완 —' },
                { who:'narration', text:'로미와 하츄핑의 진짜 이야기는\n이제 시작입니다.' },
                { who:'narration', text:'(다음 업데이트에서 계속됩니다)' }
              ]
            }], ()=>{});
          }
          console.log('[ACT5] 완료 — ACT6 대기');
        }
      }
    }
  ];

  function runStage(i){
    if(i >= stages.length) return;
    const stage = stages[i];
    console.log('[ACT5] Stage', i, stage.id);
    stage.enter(() => runStage(i+1));
  }

  window.ACT5 = {
    id: 'act5_forest',
    title: '금단의 숲 — 하츄핑',
    stages: stages,
    start: function(){ runStage(0); }
  };

  console.log('[UNIFIED] ACT5 (감정의 숲 + 하츄핑 호감도) 로드 완료 -', stages.length, '스테이지');
})();

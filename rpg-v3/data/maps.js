// rpg-v3 맵 데이터 (20개 맵)
// 타일 ID: 0=풀, 1=흙, 2=나무, 3=벽, 4=물, 5=꽃, 6=어둠바닥, 7=던전, 8=나무바닥, 9=돌바닥, 10=상자, 11=워프, 12=큰풀(조우)
(function(){
  'use strict';

  var W = 15, H = 20;

  // 공용 타일 그리드 빌더
  // base: 기본 바닥 타일, wall: 외곽 벽 타일
  // opts.water: [[x,y,w,h], ...]
  // opts.tallgrass: [[x,y,w,h], ...]
  // opts.trees: [[x,y], ...] (벽처럼 장애물)
  // opts.warps: [[x,y], ...]
  // opts.chests: [[x,y], ...]
  // opts.extra: function(grid){...} 개별 조정
  function build(base, wall, opts){
    opts = opts || {};
    var g = [];
    for(var y=0;y<H;y++){
      var row = [];
      for(var x=0;x<W;x++){
        if(x===0||x===W-1||y===0||y===H-1) row.push(wall);
        else row.push(base);
      }
      g.push(row);
    }
    function fillRect(tile, r){
      var x=r[0],y=r[1],w=r[2],h=r[3];
      for(var j=y;j<y+h && j<H-1;j++){
        for(var i=x;i<x+w && i<W-1;i++){
          if(i>0 && j>0) g[j][i] = tile;
        }
      }
    }
    (opts.water||[]).forEach(function(r){ fillRect(4, r); });
    (opts.tallgrass||[]).forEach(function(r){ fillRect(12, r); });
    (opts.trees||[]).forEach(function(p){ if(p[1]>0&&p[1]<H-1&&p[0]>0&&p[0]<W-1) g[p[1]][p[0]] = 2; });
    (opts.chests||[]).forEach(function(p){ g[p[1]][p[0]] = 10; });
    (opts.warps||[]).forEach(function(p){ g[p[1]][p[0]] = 11; });
    if(opts.extra) opts.extra(g);
    return g;
  }

  var MAPS = {};

  // ===== Act 0: 프롤로그 =====
  MAPS.ion_castle = {
    id:'ion_castle', name:'이모션 왕국 성', act:0, w:W, h:H,
    tiles: build(9, 3, {
      warps:[[7,18]],
      extra:function(g){
        // 내부 방 구획
        for(var x=3;x<=11;x++){ g[5][x]=3; }
        g[5][7]=9; // 입구
        g[3][4]=8; g[3][10]=8; // 나무 바닥 포인트
      }
    }),
    npcs:[
      {id:'queen', name:'여왕님', x:7, y:3, dialog:'로미야, 하츄핑을 찾아줘...'},
      {id:'liam', name:'리암 왕자', x:4, y:8, dialog:'누나, 내가 도와줄게!'},
      {id:'guard', name:'근위대장', x:10, y:8, dialog:'공주님, 조심히 다녀오세요.'}
    ],
    warps:[{x:7,y:18, to:'forbidden_forest', tx:7, ty:1}],
    encounters:[], startX:7, startY:10
  };

  MAPS.forbidden_forest = {
    id:'forbidden_forest', name:'금단의 숲', act:0, w:W, h:H,
    tiles: build(0, 2, {
      tallgrass:[[3,4,4,3],[8,10,4,4]],
      trees:[[5,8],[6,8],[9,6],[10,6],[4,12],[11,13]],
      warps:[[7,1],[7,18]]
    }),
    npcs:[{id:'shaman', name:'숲의 무당', x:10, y:9, dialog:'어둠이 다가온다...'}],
    warps:[
      {x:7,y:1, to:'ion_castle', tx:7, ty:17},
      {x:7,y:18, to:'hatchu_shelter', tx:7, ty:1}
    ],
    encounters:['하츄핑','차차핑'], startX:7, startY:2
  };

  MAPS.hatchu_shelter = {
    id:'hatchu_shelter', name:'하츄핑 은신처', act:0, w:W, h:H,
    tiles: build(8, 3, {
      warps:[[7,18]],
      chests:[[3,3],[11,3]],
      extra:function(g){ for(var x=5;x<=9;x++) g[10][x]=5; }
    }),
    npcs:[{id:'hatchu', name:'하츄핑', x:7, y:9, dialog:'함께 가자!'}],
    warps:[{x:7,y:18, to:'heart_town', tx:7, ty:1}],
    encounters:[], startX:7, startY:2
  };

  // ===== Act 1 (S1) =====
  MAPS.heart_town = {
    id:'heart_town', name:'하트마을', act:1, w:W, h:H,
    tiles: build(0, 2, {
      trees:[[3,3],[11,3],[3,16],[11,16]],
      warps:[[2,10],[12,10],[7,18]],
      extra:function(g){
        // 집 3채
        for(var j=5;j<=8;j++) for(var i=4;i<=6;i++) g[j][i]= (j===5||j===8||i===4||i===6)?3:8;
        for(var j=5;j<=8;j++) for(var i=9;i<=11;i++) g[j][i]= (j===5||j===8||i===9||i===11)?3:8;
        g[8][5]=8; g[8][10]=8; // 문
      }
    }),
    npcs:[
      {id:'prof', name:'엘더 박사', x:5, y:7, dialog:'첫 파트너를 골라봐!'},
      {id:'mom', name:'엄마', x:10, y:7, dialog:'조심히 다녀와.'}
    ],
    warps:[
      {x:2,y:10, to:'emotion_forest', tx:13, ty:10},
      {x:12,y:10, to:'route_1', tx:1, ty:10},
      {x:7,y:18, to:'hatchu_shelter', tx:7, ty:1}
    ],
    encounters:[], startX:7, startY:10
  };

  MAPS.route_1 = {
    id:'route_1', name:'1번 도로', act:1, w:W, h:H,
    tiles: build(0, 2, {
      tallgrass:[[3,5,4,4],[8,11,4,4]],
      trees:[[6,9],[7,9],[8,9]],
      warps:[[1,10],[13,10]]
    }),
    npcs:[{id:'trainer1', name:'꼬마 트레이너', x:5, y:8, dialog:'승부다!'}],
    warps:[
      {x:1,y:10, to:'heart_town', tx:11, ty:10},
      {x:13,y:10, to:'sparkle_city_gym1', tx:1, ty:10}
    ],
    encounters:['아자핑','부끄핑','차차핑'], startX:2, startY:10
  };

  MAPS.sparkle_city_gym1 = {
    id:'sparkle_city_gym1', name:'반짝시티 (체육관1)', act:1, w:W, h:H,
    tiles: build(9, 3, {
      warps:[[1,10],[7,3]],
      extra:function(g){
        // 체육관 건물
        for(var j=4;j<=8;j++) for(var i=5;i<=9;i++) g[j][i]= (j===4||j===8||i===5||i===9)?3:8;
        g[8][7]=11; // 체육관 입구 워프
      }
    }),
    npcs:[
      {id:'gymleader1', name:'체육관장 러브핑 (Lv.12)', x:7, y:6, dialog:'사랑의 힘을 보여주마!'},
      {id:'citizen', name:'시민', x:11, y:12, dialog:'반짝시티에 오신 걸 환영!'}
    ],
    warps:[
      {x:1,y:10, to:'route_1', tx:12, ty:10},
      {x:7,y:3, to:'emotion_forest', tx:7, ty:18}
    ],
    encounters:[], startX:7, startY:10
  };

  MAPS.emotion_forest = {
    id:'emotion_forest', name:'감정의 숲', act:1, w:W, h:H,
    tiles: build(0, 2, {
      tallgrass:[[2,3,5,5],[8,11,5,5]],
      trees:[[5,10],[9,10],[7,6],[7,14]],
      warps:[[13,10],[7,18]]
    }),
    npcs:[{id:'druid', name:'숲의 현자', x:7, y:9, dialog:'진실된 마음만이 길을 연다.'}],
    warps:[
      {x:13,y:10, to:'heart_town', tx:3, ty:10},
      {x:7,y:18, to:'sparkle_city_gym1', tx:7, ty:4}
    ],
    encounters:['아자핑','라라핑','부끄핑'], startX:2, startY:10
  };

  // ===== Act 2 (S2) =====
  MAPS.jewel_forest_entry = {
    id:'jewel_forest_entry', name:'보석숲 입구', act:2, w:W, h:H,
    tiles: build(0, 2, {
      tallgrass:[[3,4,4,4],[8,10,4,5]],
      trees:[[5,8],[9,8],[6,14],[10,14]],
      warps:[[7,1],[7,18]]
    }),
    npcs:[{id:'ranger', name:'삼림 레인저', x:8, y:5, dialog:'보석숲 깊은 곳은 위험해.'}],
    warps:[
      {x:7,y:1, to:'heart_town', tx:7, ty:17},
      {x:7,y:18, to:'jewel_forest_deep_gym2', tx:7, ty:1}
    ],
    encounters:['라라핑','바로핑','시크핑'], startX:7, startY:2
  };

  MAPS.jewel_forest_deep_gym2 = {
    id:'jewel_forest_deep_gym2', name:'보석숲 깊은 곳 (체육관2)', act:2, w:W, h:H,
    tiles: build(0, 2, {
      tallgrass:[[2,3,3,3],[10,3,3,3]],
      trees:[[4,8],[5,8],[9,8],[10,8],[7,12]],
      warps:[[7,1],[13,10],[7,18]],
      extra:function(g){
        for(var j=9;j<=13;j++) for(var i=5;i<=9;i++) g[j][i]= (j===9||j===13||i===5||i===9)?3:8;
        g[13][7]=11;
      }
    }),
    npcs:[{id:'gymleader2', name:'체육관장 바로핑 (Lv.20)', x:7, y:11, dialog:'정직한 승부!'}],
    warps:[
      {x:7,y:1, to:'jewel_forest_entry', tx:7, ty:17},
      {x:13,y:10, to:'crystal_lake_gym3', tx:1, ty:10},
      {x:7,y:18, to:'jewel_cave_gym4', tx:7, ty:1}
    ],
    encounters:['바로핑','라라핑','아자핑'], startX:7, startY:2
  };

  MAPS.crystal_lake_gym3 = {
    id:'crystal_lake_gym3', name:'수정호수 (체육관3)', act:2, w:W, h:H,
    tiles: build(0, 2, {
      water:[[3,5,9,8]],
      warps:[[1,10],[7,16]],
      extra:function(g){
        // 호수 위 나무다리
        for(var i=4;i<=10;i++) g[9][i]=8;
        // 체육관(호수 너머)
        for(var j=13;j<=15;j++) for(var i=5;i<=9;i++) g[j][i]= (j===13||j===15||i===5||i===9)?3:8;
        g[15][7]=11;
      }
    }),
    npcs:[{id:'gymleader3', name:'체육관장 아쿠아핑 (Lv.26)', x:7, y:14, dialog:'얼음의 차가움을!'}],
    warps:[
      {x:1,y:10, to:'jewel_forest_deep_gym2', tx:12, ty:10},
      {x:7,y:16, to:'jewel_cave_gym4', tx:7, ty:1}
    ],
    encounters:['아쿠아핑','차차핑'], startX:2, startY:10
  };

  MAPS.jewel_cave_gym4 = {
    id:'jewel_cave_gym4', name:'보석동굴 (체육관4)', act:2, w:W, h:H,
    tiles: build(7, 3, {
      warps:[[7,1],[13,10],[7,18]],
      chests:[[3,5],[11,5],[7,9]],
      extra:function(g){
        // 미로 벽
        for(var i=3;i<=11;i++) g[7][i]=3; g[7][7]=7;
        for(var i=3;i<=11;i++) g[13][i]=3; g[13][7]=7;
      }
    }),
    npcs:[{id:'gymleader4', name:'체육관장 글로우핑 (Lv.30)', x:7, y:15, dialog:'빛의 심판!'}],
    warps:[
      {x:7,y:1, to:'jewel_forest_deep_gym2', tx:7, ty:17},
      {x:13,y:10, to:'crystal_lake_gym3', tx:1, ty:10},
      {x:7,y:18, to:'dimension_gate', tx:7, ty:1}
    ],
    encounters:['글로우핑','섀도핑'], startX:7, startY:2
  };

  MAPS.dimension_gate = {
    id:'dimension_gate', name:'차원의 문', act:2, w:W, h:H,
    tiles: build(9, 3, {
      warps:[[7,1],[7,10],[7,18]],
      extra:function(g){
        // 원형 포털
        for(var j=8;j<=12;j++) for(var i=5;i<=9;i++) g[j][i]=6;
        g[10][7]=11;
      }
    }),
    npcs:[{id:'guardian', name:'차원지기', x:7, y:5, dialog:'각오가 되었느냐?'}],
    warps:[
      {x:7,y:1, to:'jewel_cave_gym4', tx:7, ty:17},
      {x:7,y:10, to:'mystic_outskirts', tx:7, ty:1},
      {x:7,y:18, to:'mystic_outskirts', tx:7, ty:1}
    ],
    encounters:[], startX:7, startY:15
  };

  // ===== Act 3 (S3) =====
  MAPS.mystic_outskirts = {
    id:'mystic_outskirts', name:'미스틱 외곽', act:3, w:W, h:H,
    tiles: build(6, 2, {
      tallgrass:[[3,4,4,4],[8,11,4,4]],
      trees:[[5,8],[9,8],[6,13],[10,13]],
      warps:[[7,1],[1,10],[13,10],[7,18]]
    }),
    npcs:[{id:'wanderer', name:'방랑자', x:7, y:6, dialog:'까마귀탑이 보이지...'}],
    warps:[
      {x:7,y:1, to:'dimension_gate', tx:7, ty:17},
      {x:1,y:10, to:'lost_library', tx:12, ty:10},
      {x:13,y:10, to:'raven_tower_gym5', tx:1, ty:10},
      {x:7,y:18, to:'jewel_dragon_shrine_gym6', tx:7, ty:1}
    ],
    encounters:['섀도핑','시크핑','차차핑'], startX:7, startY:10
  };

  MAPS.raven_tower_gym5 = {
    id:'raven_tower_gym5', name:'까마귀탑 (체육관5)', act:3, w:W, h:H,
    tiles: build(9, 3, {
      warps:[[1,10]],
      extra:function(g){
        // 탑 층계
        for(var j=4;j<=16;j+=3){ for(var i=4;i<=10;i++) g[j][i]=3; g[j][7]=9; }
      }
    }),
    npcs:[{id:'gymleader5', name:'체육관장 섀도핑 (Lv.36)', x:7, y:5, dialog:'어둠에 잠식되어라.'}],
    warps:[{x:1,y:10, to:'mystic_outskirts', tx:12, ty:10}],
    encounters:['섀도핑'], startX:7, startY:17
  };

  MAPS.lost_library = {
    id:'lost_library', name:'잊혀진 도서관', act:3, w:W, h:H,
    tiles: build(8, 3, {
      warps:[[13,10]],
      chests:[[3,5],[11,5],[3,14],[11,14]],
      extra:function(g){
        // 책장 패턴
        for(var j=4;j<=6;j++) for(var i=3;i<=11;i+=4) g[j][i]=3;
        for(var j=13;j<=15;j++) for(var i=3;i<=11;i+=4) g[j][i]=3;
      }
    }),
    npcs:[{id:'librarian', name:'사서 노인', x:7, y:10, dialog:'고대 문헌에 따르면...'}],
    warps:[{x:13,y:10, to:'mystic_outskirts', tx:2, ty:10}],
    encounters:[], startX:2, startY:10
  };

  MAPS.jewel_dragon_shrine_gym6 = {
    id:'jewel_dragon_shrine_gym6', name:'보석드래곤 신전 (체육관6)', act:3, w:W, h:H,
    tiles: build(9, 3, {
      warps:[[7,1],[7,18]],
      extra:function(g){
        // 제단
        for(var j=8;j<=12;j++) for(var i=5;i<=9;i++) g[j][i]=6;
        g[10][7]=10; // 중앙 보석 상자
      }
    }),
    npcs:[{id:'gymleader6', name:'체육관장 드래곤핑 (Lv.42)', x:7, y:5, dialog:'용의 포효!'}],
    warps:[
      {x:7,y:1, to:'mystic_outskirts', tx:7, ty:17},
      {x:7,y:18, to:'dimension_end', tx:7, ty:1}
    ],
    encounters:['드래곤핑'], startX:7, startY:17
  };

  MAPS.dimension_end = {
    id:'dimension_end', name:'차원의 끝', act:3, w:W, h:H,
    tiles: build(6, 3, {
      warps:[[7,1],[7,18]],
      extra:function(g){
        for(var j=8;j<=12;j++) for(var i=5;i<=9;i++) g[j][i]=11;
      }
    }),
    npcs:[{id:'herald', name:'전령', x:7, y:5, dialog:'달콤의 세계로...'}],
    warps:[
      {x:7,y:1, to:'jewel_dragon_shrine_gym6', tx:7, ty:17},
      {x:7,y:18, to:'dessert_town', tx:7, ty:1}
    ],
    encounters:[], startX:7, startY:10
  };

  // ===== Act 4 (S4) =====
  MAPS.dessert_town = {
    id:'dessert_town', name:'디저트 마을', act:4, w:W, h:H,
    tiles: build(5, 2, {
      warps:[[7,1],[1,10],[13,10]],
      extra:function(g){
        for(var j=5;j<=8;j++) for(var i=4;i<=6;i++) g[j][i]= (j===5||j===8||i===4||i===6)?3:8;
        for(var j=5;j<=8;j++) for(var i=9;i<=11;i++) g[j][i]= (j===5||j===8||i===9||i===11)?3:8;
      }
    }),
    npcs:[{id:'baker', name:'제과사', x:5, y:7, dialog:'달콤한 향이 나네?'}],
    warps:[
      {x:7,y:1, to:'dimension_end', tx:7, ty:17},
      {x:1,y:10, to:'mirror_realm', tx:12, ty:10},
      {x:13,y:10, to:'sugar_vault_gym7', tx:1, ty:10}
    ],
    encounters:[], startX:7, startY:10
  };

  MAPS.mirror_realm = {
    id:'mirror_realm', name:'거울 차원', act:4, w:W, h:H,
    tiles: build(6, 3, {
      warps:[[13,10],[7,18]],
      extra:function(g){
        // 거울(물 타일로 표현)
        for(var j=5;j<=14;j+=3) for(var i=3;i<=11;i+=4) g[j][i]=4;
      }
    }),
    npcs:[{id:'mirror', name:'거울의 너', x:7, y:10, dialog:'나는... 너다.'}],
    warps:[
      {x:13,y:10, to:'dessert_town', tx:2, ty:10},
      {x:7,y:18, to:'sugar_vault_gym7', tx:7, ty:1}
    ],
    encounters:['시크핑','섀도핑'], startX:2, startY:10
  };

  MAPS.sugar_vault_gym7 = {
    id:'sugar_vault_gym7', name:'슈가 볼트 (체육관7)', act:4, w:W, h:H,
    tiles: build(8, 3, {
      warps:[[1,10],[7,1],[7,18]],
      chests:[[4,5],[10,5]],
      extra:function(g){
        for(var j=8;j<=12;j++) for(var i=5;i<=9;i++) g[j][i]= (j===8||j===12||i===5||i===9)?3:5;
      }
    }),
    npcs:[{id:'gymleader7', name:'체육관장 달콤핑 (Lv.48)', x:7, y:10, dialog:'달콤한 덫에 걸렸군.'}],
    warps:[
      {x:1,y:10, to:'dessert_town', tx:12, ty:10},
      {x:7,y:1, to:'mirror_realm', tx:7, ty:17},
      {x:7,y:18, to:'starlight_plateau', tx:7, ty:1}
    ],
    encounters:['달콤핑'], startX:7, startY:17
  };

  // ===== Act 5 (S5) =====
  MAPS.starlight_plateau = {
    id:'starlight_plateau', name:'별빛 고원', act:5, w:W, h:H,
    tiles: build(0, 2, {
      tallgrass:[[3,4,4,4],[8,11,4,4]],
      trees:[[5,9],[9,9],[6,13],[10,13]],
      warps:[[7,1],[7,18]]
    }),
    npcs:[
      {id:'elder', name:'최후의 현자', x:7, y:5, dialog:'챔피언이 기다린다.'},
      {id:'healer', name:'치유사', x:11, y:10, dialog:'회복해드릴게요!'}
    ],
    warps:[
      {x:7,y:1, to:'sugar_vault_gym7', tx:7, ty:17},
      {x:7,y:18, to:'champion_castle_gym8', tx:7, ty:1}
    ],
    encounters:['러브핑','드래곤핑','글로우핑'], startX:7, startY:10
  };

  MAPS.champion_castle_gym8 = {
    id:'champion_castle_gym8', name:'챔피언 성 (체육관8/최종)', act:5, w:W, h:H,
    tiles: build(9, 3, {
      warps:[[7,18]],
      extra:function(g){
        // 왕좌의 홀
        for(var i=3;i<=11;i++){ g[6][i]=3; g[14][i]=3; }
        g[6][7]=9; g[14][7]=9;
        for(var j=8;j<=12;j++) for(var i=5;i<=9;i++) g[j][i]=6;
        g[10][7]=9; // 왕좌
      }
    }),
    npcs:[{id:'champion', name:'챔피언 이모션 여왕 (Lv.55)', x:7, y:10, dialog:'이것이 최후의 시련이다!'}],
    warps:[{x:7,y:18, to:'starlight_plateau', tx:7, ty:1}],
    encounters:[], startX:7, startY:17
  };

  window.MAPS = MAPS;
  window.MAP_LIST = Object.keys(MAPS);
})();

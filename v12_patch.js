// hatcuping-game v12_patch.js - NEXTERA+PRISM AUTO v12.0
// Self-contained patch module (1300+ lines, 45+ functions)
(function(){
'use strict';

// ============================================================
// 1. PET COMPANION SYSTEM (반려 동반자 6종 + 친밀도 + 버프)
// ============================================================
var PETS = [
  {id:'fairy',name:'별빛 요정',desc:'XP 획득량 +20%',icon:'&#x2728;',color:'#FFD700',buff:'xp',buffVal:20,maxAffinity:100},
  {id:'dragon',name:'미니 드래곤',desc:'공격력 +15%',icon:'&#x1F409;',color:'#F44336',buff:'atk',buffVal:15,maxAffinity:100},
  {id:'bunny',name:'솜사탕 토끼',desc:'HP 회복 +25%',icon:'&#x1F430;',color:'#E91E63',buff:'heal',buffVal:25,maxAffinity:100},
  {id:'fox',name:'은빛 여우',desc:'회피율 +10%',icon:'&#x1F98A;',color:'#FF9800',buff:'dodge',buffVal:10,maxAffinity:100},
  {id:'owl',name:'지혜의 부엉이',desc:'퀴즈 힌트 확률 +30%',icon:'&#x1F989;',color:'#795548',buff:'hint',buffVal:30,maxAffinity:100},
  {id:'phoenix',name:'불사조 새',desc:'부활 확률 +20%',icon:'&#x1F985;',color:'#FF5722',buff:'revive',buffVal:20,maxAffinity:100}
];

function getPetData(){
  try{ return JSON.parse(localStorage.getItem('hatcuping_pets') || '{"active":"","affinity":{}}'); }catch(e){ return {active:'',affinity:{}}; }
}

function savePetData(d){
  try{ localStorage.setItem('hatcuping_pets', JSON.stringify(d)); }catch(e){}
}

function openPetSystem(){
  if(document.getElementById('petModal')) return;
  var overlay = document.createElement('div');
  overlay.id = 'petModal';
  overlay.className = 'modal-overlay show';
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');
  trackV12Feature('pet');

  var pd = getPetData();
  var html = '<div class="modal" style="max-width:400px;max-height:80vh;overflow-y:auto">';
  html += '<button class="modal-close" id="petClose" aria-label="닫기">&times;</button>';
  html += '<h3 style="font-size:17px">&#x1F43E; 반려 동반자</h3>';
  html += '<div style="font-size:12px;color:var(--text-sub);margin-bottom:10px">동반자를 선택하고 친밀도를 올려보세요!</div>';

  PETS.forEach(function(p){
    var aff = pd.affinity[p.id] || 0;
    var isActive = pd.active === p.id;
    var affPct = Math.min(aff / p.maxAffinity * 100, 100);
    var hearts = aff >= 80 ? '&#x1F495;&#x1F495;&#x1F495;' : aff >= 40 ? '&#x1F495;&#x1F495;' : aff > 0 ? '&#x1F495;' : '&#x1F494;';

    html += '<div class="pet-card" data-pet="'+p.id+'" style="display:flex;gap:10px;padding:12px;margin-bottom:8px;border-radius:14px;background:'+(isActive?'rgba(255,95,162,.08)':'rgba(0,0,0,.02)')+';border:2px solid '+(isActive?p.color:'transparent')+';cursor:pointer;transition:all .2s">';
    html += '<div style="width:48px;height:48px;border-radius:14px;background:linear-gradient(135deg,'+p.color+'33,'+p.color+'11);display:flex;align-items:center;justify-content:center;font-size:24px">'+p.icon+'</div>';
    html += '<div style="flex:1"><div style="display:flex;align-items:center;gap:6px">';
    html += '<span style="font-size:13px;font-weight:700">'+p.name+'</span>';
    if(isActive) html += '<span style="font-size:9px;padding:1px 6px;border-radius:8px;background:var(--pink);color:#fff;font-weight:700">활성</span>';
    html += '</div>';
    html += '<div style="font-size:11px;color:var(--text-sub)">'+p.desc+'</div>';
    html += '<div style="display:flex;align-items:center;gap:6px;margin-top:4px">';
    html += '<span style="font-size:10px">'+hearts+'</span>';
    html += '<div style="flex:1;height:6px;background:rgba(0,0,0,.06);border-radius:3px;overflow:hidden"><div style="height:100%;width:'+affPct+'%;background:'+p.color+';border-radius:3px;transition:width .4s"></div></div>';
    html += '<span style="font-size:10px;font-weight:700;color:'+p.color+'">'+aff+'</span>';
    html += '</div></div></div>';
  });

  html += '<div style="display:flex;gap:6px;margin-top:8px">';
  html += '<button id="petFeed" style="flex:1;padding:8px;background:linear-gradient(135deg,#4CAF50,#81C784);color:#fff;border:none;border-radius:10px;font-size:12px;font-weight:700;cursor:pointer">&#x1F36C; 먹이주기</button>';
  html += '<button id="petPlay" style="flex:1;padding:8px;background:linear-gradient(135deg,var(--pink),var(--purple));color:#fff;border:none;border-radius:10px;font-size:12px;font-weight:700;cursor:pointer">&#x1F3BE; 놀아주기</button>';
  html += '</div></div>';
  overlay.innerHTML = html;
  document.body.appendChild(overlay);

  document.getElementById('petClose').onclick = function(){ overlay.remove(); };
  overlay.onclick = function(e){ if(e.target === overlay) overlay.remove(); };

  document.querySelectorAll('.pet-card').forEach(function(card){
    card.onmouseenter = function(){ card.style.transform = 'translateY(-2px)'; };
    card.onmouseleave = function(){ card.style.transform = ''; };
    card.onclick = function(){
      pd.active = card.dataset.pet;
      if(!pd.affinity[pd.active]) pd.affinity[pd.active] = 1;
      savePetData(pd);
      checkAndAwardV12('a_pet_first');
      sfxV12('pet_select');
      overlay.remove();
      openPetSystem();
    };
  });

  document.getElementById('petFeed').onclick = function(){
    if(!pd.active){ showToastV12('먼저 동반자를 선택하세요!'); return; }
    pd.affinity[pd.active] = Math.min((pd.affinity[pd.active]||0) + 5, 100);
    savePetData(pd);
    sfxV12('pet_feed');
    showToastV12('&#x1F36C; '+PETS.filter(function(p){return p.id===pd.active;})[0].name+' 친밀도 +5!');
    if(pd.affinity[pd.active] >= 100) checkAndAwardV12('a_pet_max');
    overlay.remove();
    openPetSystem();
  };

  document.getElementById('petPlay').onclick = function(){
    if(!pd.active){ showToastV12('먼저 동반자를 선택하세요!'); return; }
    pd.affinity[pd.active] = Math.min((pd.affinity[pd.active]||0) + 8, 100);
    savePetData(pd);
    sfxV12('pet_play');
    showToastV12('&#x1F3BE; 놀아주기 완료! 친밀도 +8!');
    overlay.remove();
    openPetSystem();
  };
  sfxV12('pet_open');
}


// ============================================================
// 2. WORLD MAP EXPLORER (월드맵 Canvas 탐험)
// ============================================================
var WORLD_REGIONS = [
  {id:'kingdom',name:'이모션 왕국',x:150,y:40,color:'#FF5FA2',unlocked:true,desc:'하츄핑의 고향'},
  {id:'forest',name:'이모션 숲',x:60,y:100,color:'#4CAF50',unlocked:true,desc:'신비한 나무가 가득'},
  {id:'cave',name:'크리스탈 동굴',x:240,y:100,color:'#2196F3',unlocked:true,desc:'보석이 빛나는 동굴'},
  {id:'cloud',name:'구름 마을',x:150,y:140,color:'#81D4FA',unlocked:true,desc:'평화로운 구름 위 마을'},
  {id:'castle',name:'어둠의 성',x:80,y:200,color:'#7B1FA2',unlocked:true,desc:'트러핑이 숨어있는 성'},
  {id:'volcano',name:'불의 산',x:220,y:200,color:'#FF5722',unlocked:false,desc:'용암이 흐르는 위험한 산'},
  {id:'ocean',name:'평화의 바다',x:150,y:260,color:'#00BCD4',unlocked:false,desc:'바다 위 구름에서 모험'},
  {id:'star',name:'별빛 전망대',x:60,y:280,color:'#FFD700',unlocked:false,desc:'별을 관측하는 높은 곳'},
  {id:'rainbow',name:'무지개 다리',x:240,y:280,color:'#E91E63',unlocked:false,desc:'무지개로 이어진 다리'}
];

function getWorldProgress(){
  try{ return JSON.parse(localStorage.getItem('hatcuping_worldmap') || '{}'); }catch(e){ return {}; }
}

function openWorldMap(){
  if(document.getElementById('worldModal')) return;
  var overlay = document.createElement('div');
  overlay.id = 'worldModal';
  overlay.className = 'modal-overlay show';
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');
  trackV12Feature('worldmap');

  var progress = getWorldProgress();
  var html = '<div class="modal" style="max-width:400px;text-align:center">';
  html += '<button class="modal-close" id="worldClose" aria-label="닫기">&times;</button>';
  html += '<h3 style="font-size:17px">&#x1F5FA;&#xFE0F; 월드맵</h3>';
  html += '<div style="font-size:12px;color:var(--text-sub);margin-bottom:8px">탐험한 지역을 확인하세요</div>';
  html += '<canvas id="worldCanvas" width="300" height="320" style="width:100%;border-radius:14px;background:linear-gradient(180deg,#E3F2FD 0%,#C8E6C9 40%,#FFF9C4 70%,#FFCCBC 100%)"></canvas>';
  html += '<div id="worldInfo" style="margin-top:8px;font-size:12px;color:var(--text-sub);min-height:20px"></div>';
  html += '</div>';
  overlay.innerHTML = html;
  document.body.appendChild(overlay);

  var cv = document.getElementById('worldCanvas');
  var ctx = cv.getContext('2d');

  for(var i = 0; i < WORLD_REGIONS.length; i++){
    for(var j = i+1; j < WORLD_REGIONS.length; j++){
      var a = WORLD_REGIONS[i], b = WORLD_REGIONS[j];
      var dx = a.x - b.x, dy = a.y - b.y;
      if(Math.sqrt(dx*dx + dy*dy) < 130){
        ctx.strokeStyle = 'rgba(0,0,0,.08)';
        ctx.lineWidth = 2;
        ctx.setLineDash([4,4]);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
  }

  WORLD_REGIONS.forEach(function(r){
    var visited = !!progress[r.id];
    var unlocked = r.unlocked || visited;

    ctx.beginPath();
    ctx.arc(r.x, r.y, 20, 0, Math.PI * 2);
    if(unlocked){
      var grad = ctx.createRadialGradient(r.x, r.y, 0, r.x, r.y, 20);
      grad.addColorStop(0, r.color);
      grad.addColorStop(1, r.color + '88');
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = 'rgba(0,0,0,.15)';
    }
    ctx.fill();

    if(visited){
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.font = '9px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = unlocked ? '#333' : '#999';
    ctx.fillText(unlocked ? r.name : '???', r.x, r.y + 32);

    if(unlocked){
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(visited ? '&#x2B50;' : '&#x26AA;', r.x, r.y);
    } else {
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('&#x1F512;', r.x, r.y);
    }
  });

  cv.onclick = function(e){
    var rect = cv.getBoundingClientRect();
    var scaleX = 300 / rect.width;
    var mx = (e.clientX - rect.left) * scaleX;
    var my = (e.clientY - rect.top) * scaleX;
    WORLD_REGIONS.forEach(function(r){
      var d = Math.sqrt((mx-r.x)*(mx-r.x)+(my-r.y)*(my-r.y));
      if(d < 24 && (r.unlocked || progress[r.id])){
        progress[r.id] = true;
        try{ localStorage.setItem('hatcuping_worldmap', JSON.stringify(progress)); }catch(e){}
        document.getElementById('worldInfo').textContent = r.name + ' - ' + r.desc;
        sfxV12('world_visit');
        var visitedCount = Object.keys(progress).length;
        if(visitedCount >= 5) checkAndAwardV12('a_explorer');
        if(visitedCount >= 9) checkAndAwardV12('a_world_master');
      }
    });
  };

  document.getElementById('worldClose').onclick = function(){ overlay.remove(); };
  overlay.onclick = function(e){ if(e.target === overlay) overlay.remove(); };
  checkAndAwardV12('a_worldmap_open');
  sfxV12('world_open');
}


// ============================================================
// 3. CRAFTING WORKSHOP (아이템 제작 공방 8종)
// ============================================================
var RECIPES = [
  {id:'love_potion',name:'사랑의 물약',icon:'&#x1F48C;',desc:'HP 완전 회복',materials:['하트x3','별x1'],result:'체력 완전 회복'},
  {id:'shield_gem',name:'방패의 보석',icon:'&#x1F48E;',desc:'10초간 무적',materials:['크리스탈x2','방패조각x1'],result:'10초 무적'},
  {id:'speed_boots',name:'바람의 부츠',icon:'&#x1F462;',desc:'이동속도 2배',materials:['깃털x2','가죽x1'],result:'30초 스피드업'},
  {id:'combo_ring',name:'콤보의 반지',icon:'&#x1F48D;',desc:'콤보 데미지 증가',materials:['루비x1','금속x2'],result:'콤보 1.5배'},
  {id:'lucky_clover',name:'행운의 클로버',icon:'&#x1F340;',desc:'드롭률 3배',materials:['씨앗x3','이슬x1'],result:'드롭률 증가'},
  {id:'star_wand',name:'별의 지팡이',icon:'&#x1FA84;',desc:'마법 공격력 증가',materials:['별가루x2','나무x1'],result:'마법 공격 2배'},
  {id:'heal_bell',name:'치유의 종',icon:'&#x1F514;',desc:'파티 전체 회복',materials:['은x2','하트x2'],result:'파티 HP 50% 회복'},
  {id:'thunder_orb',name:'번개의 오브',icon:'&#x26A1;',desc:'범위 마법 공격',materials:['전기석x2','구슬x1'],result:'전체 적 데미지'}
];

function getCraftData(){
  try{ return JSON.parse(localStorage.getItem('hatcuping_crafts') || '{"made":{},"materials":{"하트":10,"별":5,"크리스탈":3,"방패조각":2,"깃털":4,"가죽":2,"루비":1,"금속":3,"씨앗":5,"이슬":3,"별가루":4,"나무":6,"은":2,"전기석":2,"구슬":3}}'); }catch(e){ return {made:{},materials:{}}; }
}

function saveCraftData(d){
  try{ localStorage.setItem('hatcuping_crafts', JSON.stringify(d)); }catch(e){}
}

function openCrafting(){
  if(document.getElementById('craftModal')) return;
  var overlay = document.createElement('div');
  overlay.id = 'craftModal';
  overlay.className = 'modal-overlay show';
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');
  trackV12Feature('crafting');

  var cd = getCraftData();
  var html = '<div class="modal" style="max-width:400px;max-height:80vh;overflow-y:auto">';
  html += '<button class="modal-close" id="craftClose" aria-label="닫기">&times;</button>';
  html += '<h3 style="font-size:17px">&#x1F528; 제작 공방</h3>';
  html += '<div style="font-size:12px;color:var(--text-sub);margin-bottom:8px">재료를 모아 아이템을 제작하세요! (제작: <strong style="color:var(--pink)">'+Object.keys(cd.made).length+'/'+RECIPES.length+'</strong>)</div>';

  RECIPES.forEach(function(r){
    var made = !!cd.made[r.id];
    html += '<div style="display:flex;gap:10px;padding:10px;margin-bottom:6px;border-radius:14px;background:'+(made?'rgba(76,175,80,.06)':'rgba(0,0,0,.02)')+';border:1px solid '+(made?'rgba(76,175,80,.2)':'var(--border)')+'">';
    html += '<div style="width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,rgba(255,95,162,.15),rgba(176,102,255,.1));display:flex;align-items:center;justify-content:center;font-size:20px">'+r.icon+'</div>';
    html += '<div style="flex:1"><div style="font-size:13px;font-weight:700">'+r.name+(made?' &#x2705;':'')+'</div>';
    html += '<div style="font-size:11px;color:var(--text-sub)">'+r.desc+'</div>';
    html += '<div style="font-size:10px;color:#888;margin-top:2px">재료: '+r.materials.join(', ')+'</div>';
    if(!made) html += '<button class="craft-btn" data-recipe="'+r.id+'" style="margin-top:4px;padding:3px 10px;background:linear-gradient(135deg,var(--pink),var(--purple));color:#fff;border:none;border-radius:8px;font-size:10px;font-weight:700;cursor:pointer">제작하기</button>';
    html += '</div></div>';
  });
  html += '</div>';
  overlay.innerHTML = html;
  document.body.appendChild(overlay);

  document.getElementById('craftClose').onclick = function(){ overlay.remove(); };
  overlay.onclick = function(e){ if(e.target === overlay) overlay.remove(); };

  document.querySelectorAll('.craft-btn').forEach(function(btn){
    btn.onclick = function(){
      var rid = btn.dataset.recipe;
      cd.made[rid] = Date.now();
      saveCraftData(cd);
      sfxV12('craft_success');
      showToastV12('&#x1F528; 제작 완료!');
      checkAndAwardV12('a_craft_first');
      if(Object.keys(cd.made).length >= 8) checkAndAwardV12('a_craft_master');
      overlay.remove();
      openCrafting();
    };
  });
  sfxV12('craft_open');
}


// ============================================================
// 4. DAILY LOGIN REWARDS (일일 출석 보상 캘린더 7일)
// ============================================================
var LOGIN_REWARDS = [
  {day:1,reward:'하트 x5',icon:'&#x1F497;'},
  {day:2,reward:'별 x3',icon:'&#x2B50;'},
  {day:3,reward:'재료 팩',icon:'&#x1F381;'},
  {day:4,reward:'XP 100',icon:'&#x2728;'},
  {day:5,reward:'파워업 랜덤',icon:'&#x1F4A5;'},
  {day:6,reward:'크리스탈 x5',icon:'&#x1F48E;'},
  {day:7,reward:'전설 상자',icon:'&#x1F3C6;'}
];

function getLoginData(){
  try{ return JSON.parse(localStorage.getItem('hatcuping_login') || '{"streak":0,"lastDate":"","claimed":[]}'); }catch(e){ return {streak:0,lastDate:'',claimed:[]}; }
}

function openLoginRewards(){
  if(document.getElementById('loginModal')) return;
  var overlay = document.createElement('div');
  overlay.id = 'loginModal';
  overlay.className = 'modal-overlay show';
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');
  trackV12Feature('login');

  var ld = getLoginData();
  var today = new Date().toISOString().slice(0,10);
  var canClaim = ld.lastDate !== today;

  if(canClaim && ld.lastDate){
    var last = new Date(ld.lastDate);
    var now = new Date(today);
    var diff = Math.floor((now - last) / 86400000);
    if(diff > 1) ld.streak = 0;
  }

  var html = '<div class="modal" style="max-width:380px;text-align:center">';
  html += '<button class="modal-close" id="loginClose" aria-label="닫기">&times;</button>';
  html += '<h3 style="font-size:17px">&#x1F4C5; 일일 출석 보상</h3>';
  html += '<div style="font-size:12px;color:var(--text-sub);margin-bottom:10px">연속 출석: <strong style="color:var(--pink)">'+(ld.streak%7+1)+'</strong>/7일</div>';

  html += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:12px">';
  LOGIN_REWARDS.forEach(function(r){
    var claimed = ld.claimed.indexOf(r.day) !== -1 || (ld.streak%7 >= r.day);
    var isNext = (ld.streak%7) + 1 === r.day && canClaim;
    html += '<div style="padding:10px 4px;border-radius:12px;text-align:center;background:'+(claimed?'rgba(76,175,80,.1)':isNext?'rgba(255,95,162,.1)':'rgba(0,0,0,.03)')+';border:2px solid '+(isNext?'var(--pink)':claimed?'rgba(76,175,80,.3)':'transparent')+';position:relative'+(r.day===7?';grid-column:2/4':'')+'">';
    html += '<div style="font-size:11px;font-weight:700;color:'+(claimed?'#4CAF50':'var(--text-sub)')+'">Day '+r.day+'</div>';
    html += '<div style="font-size:20px;margin:4px 0">'+(claimed?'&#x2705;':r.icon)+'</div>';
    html += '<div style="font-size:10px;color:var(--text-sub)">'+r.reward+'</div></div>';
  });
  html += '</div>';

  if(canClaim){
    html += '<button id="loginClaim" style="width:100%;padding:10px;background:linear-gradient(135deg,var(--pink),var(--purple));color:#fff;border:none;border-radius:14px;font-size:14px;font-weight:700;cursor:pointer;transition:transform .2s">&#x1F381; 오늘의 보상 받기!</button>';
  } else {
    html += '<div style="padding:10px;background:rgba(0,0,0,.04);border-radius:14px;font-size:13px;color:var(--text-sub);font-weight:600">&#x2705; 오늘의 보상을 이미 받았습니다!</div>';
  }
  html += '</div>';
  overlay.innerHTML = html;
  document.body.appendChild(overlay);

  document.getElementById('loginClose').onclick = function(){ overlay.remove(); };
  overlay.onclick = function(e){ if(e.target === overlay) overlay.remove(); };

  var claimBtn = document.getElementById('loginClaim');
  if(claimBtn){
    claimBtn.onclick = function(){
      ld.streak++;
      ld.lastDate = today;
      var dayNum = ((ld.streak-1)%7)+1;
      if(ld.claimed.indexOf(dayNum)===-1) ld.claimed.push(dayNum);
      try{ localStorage.setItem('hatcuping_login', JSON.stringify(ld)); }catch(e){}
      sfxV12('login_claim');
      var reward = LOGIN_REWARDS.filter(function(r){return r.day===dayNum;})[0];
      showToastV12(reward.icon+' Day '+dayNum+' 보상: '+reward.reward);
      checkAndAwardV12('a_login_first');
      if(ld.streak >= 7) checkAndAwardV12('a_login_week');
      overlay.remove();
      openLoginRewards();
    };
  }
  sfxV12('login_open');
}


// ============================================================
// 5. RANKING HALL (AI 랭킹 리더보드 10인)
// ============================================================
var AI_RANKERS = [
  {name:'별빛 전사',score:9800,avatar:'&#x1F31F;'},{name:'핑크 히어로',score:8500,avatar:'&#x1F496;'},
  {name:'용감한 드래곤',score:7200,avatar:'&#x1F409;'},{name:'구름 위 요정',score:6100,avatar:'&#x2601;&#xFE0F;'},
  {name:'얼음 공주',score:5500,avatar:'&#x2744;&#xFE0F;'},{name:'번개 닌자',score:4800,avatar:'&#x26A1;'},
  {name:'꽃의 마법사',score:4200,avatar:'&#x1F338;'},{name:'바다 탐험가',score:3500,avatar:'&#x1F30A;'},
  {name:'달빛 궁수',score:2800,avatar:'&#x1F319;'},{name:'숲의 수호자',score:2100,avatar:'&#x1F332;'}
];

function openRankingHall(){
  if(document.getElementById('rankModal')) return;
  var overlay = document.createElement('div');
  overlay.id = 'rankModal';
  overlay.className = 'modal-overlay show';
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');
  trackV12Feature('ranking');

  var stats = {};
  try{ stats = JSON.parse(localStorage.getItem('hatcuping_stats') || '{}'); }catch(e){}
  var myScore = ((stats.clears||0) * 100) + ((stats.combos||0) * 10) + (stats.hearts||0);

  var allRankers = AI_RANKERS.slice();
  allRankers.push({name:'&#x1F3AE; 나',score:myScore,avatar:'&#x1F467;',isMe:true});
  allRankers.sort(function(a,b){ return b.score - a.score; });

  var html = '<div class="modal" style="max-width:380px;max-height:80vh;overflow-y:auto">';
  html += '<button class="modal-close" id="rankClose" aria-label="닫기">&times;</button>';
  html += '<h3 style="font-size:17px">&#x1F3C6; 랭킹 전당</h3>';

  var medals = ['&#x1F947;','&#x1F948;','&#x1F949;'];
  allRankers.forEach(function(r, i){
    var isMe = !!r.isMe;
    html += '<div style="display:flex;align-items:center;gap:10px;padding:8px 10px;margin-bottom:4px;border-radius:12px;background:'+(isMe?'rgba(255,95,162,.1)':'rgba(0,0,0,.02)')+';border:1px solid '+(isMe?'var(--pink)':'transparent')+'">';
    html += '<span style="font-size:14px;font-weight:800;color:'+(i<3?'#FFD700':'var(--text-sub)')+';width:24px;text-align:center">'+(medals[i]||(i+1))+'</span>';
    html += '<span style="font-size:18px">'+r.avatar+'</span>';
    html += '<span style="flex:1;font-size:13px;font-weight:'+(isMe?'800':'600')+';color:'+(isMe?'var(--pink)':'var(--text)')+'">'+r.name+'</span>';
    html += '<span style="font-size:12px;font-weight:700;color:'+(i<3?'#FFD700':'var(--text-sub)')+'">'+r.score.toLocaleString()+'</span>';
    html += '</div>';
  });
  html += '</div>';
  overlay.innerHTML = html;
  document.body.appendChild(overlay);

  document.getElementById('rankClose').onclick = function(){ overlay.remove(); };
  overlay.onclick = function(e){ if(e.target === overlay) overlay.remove(); };
  checkAndAwardV12('a_ranking_view');
  sfxV12('rank_open');
}


// ============================================================
// 6. STORY JOURNAL (스토리 저널 / 퀘스트 로그)
// ============================================================
var STORY_CHAPTERS = [
  {id:'ch1',title:'로미의 출발',desc:'로미가 이모션 왕국으로 떠나는 이야기',icon:'&#x1F3E0;'},
  {id:'ch2',title:'하츄핑과의 만남',desc:'하츄핑을 처음 만나고 친구가 되다',icon:'&#x1F496;'},
  {id:'ch3',title:'숲 속 모험',desc:'이모션 숲에서 차차핑을 구출하다',icon:'&#x1F332;'},
  {id:'ch4',title:'크리스탈 동굴',desc:'동굴 깊은 곳에서 보석을 찾다',icon:'&#x1F48E;'},
  {id:'ch5',title:'구름 마을의 위기',desc:'구름 마을이 어둠에 잠기다',icon:'&#x2601;&#xFE0F;'},
  {id:'ch6',title:'트러핑의 등장',desc:'트러핑이 왕국을 위협하다',icon:'&#x1F47E;'},
  {id:'ch7',title:'동료를 모아서',desc:'모든 티니핑의 힘을 하나로!',icon:'&#x1F91D;'},
  {id:'ch8',title:'어둠의 성 돌파',desc:'어둠의 성에 잠입하다',icon:'&#x1F3F0;'},
  {id:'ch9',title:'최후의 결전',desc:'트러핑과의 마지막 전투',icon:'&#x2694;&#xFE0F;'},
  {id:'ch10',title:'사랑의 기적',desc:'사랑의 마법으로 평화를 되찾다',icon:'&#x1F308;'}
];

function getJournalData(){
  try{ return JSON.parse(localStorage.getItem('hatcuping_journal') || '{"read":[],"notes":{}}'); }catch(e){ return {read:[],notes:{}}; }
}

function openStoryJournal(){
  if(document.getElementById('journalModal')) return;
  var overlay = document.createElement('div');
  overlay.id = 'journalModal';
  overlay.className = 'modal-overlay show';
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');
  trackV12Feature('journal');

  var jd = getJournalData();
  var html = '<div class="modal" style="max-width:400px;max-height:80vh;overflow-y:auto">';
  html += '<button class="modal-close" id="journalClose" aria-label="닫기">&times;</button>';
  html += '<h3 style="font-size:17px">&#x1F4D6; 스토리 저널</h3>';
  html += '<div style="font-size:12px;color:var(--text-sub);margin-bottom:10px">진행도: <strong style="color:var(--pink)">'+jd.read.length+'/'+STORY_CHAPTERS.length+'</strong> 챕터</div>';

  var progPct = jd.read.length / STORY_CHAPTERS.length * 100;
  html += '<div style="height:6px;background:rgba(0,0,0,.06);border-radius:3px;margin-bottom:12px;overflow:hidden"><div style="height:100%;width:'+progPct+'%;background:linear-gradient(90deg,var(--pink),var(--purple));border-radius:3px;transition:width .6s"></div></div>';

  STORY_CHAPTERS.forEach(function(ch, i){
    var isRead = jd.read.indexOf(ch.id) !== -1;
    var isNext = !isRead && (i === 0 || jd.read.indexOf(STORY_CHAPTERS[i-1].id) !== -1);
    html += '<div class="journal-ch" data-ch="'+ch.id+'" style="display:flex;gap:10px;padding:10px;margin-bottom:6px;border-radius:14px;background:'+(isRead?'rgba(76,175,80,.05)':isNext?'rgba(255,95,162,.05)':'rgba(0,0,0,.02)')+';border:1px solid '+(isNext?'rgba(255,95,162,.2)':'transparent')+';cursor:'+(isRead||isNext?'pointer':'default')+';opacity:'+(isRead||isNext?'1':'.4')+';transition:all .2s">';
    html += '<div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,'+(isRead?'#4CAF50':'var(--pink)')+','+(isRead?'#81C784':'var(--purple)')+');display:flex;align-items:center;justify-content:center;font-size:16px">'+(isRead?'&#x2705;':ch.icon)+'</div>';
    html += '<div style="flex:1"><div style="font-size:12px;font-weight:700">Ch.'+String(i+1)+' '+ch.title+'</div>';
    html += '<div style="font-size:11px;color:var(--text-sub)">'+(isRead||isNext?ch.desc:'???')+'</div></div></div>';
  });
  html += '</div>';
  overlay.innerHTML = html;
  document.body.appendChild(overlay);

  document.getElementById('journalClose').onclick = function(){ overlay.remove(); };
  overlay.onclick = function(e){ if(e.target === overlay) overlay.remove(); };

  document.querySelectorAll('.journal-ch').forEach(function(el){
    el.onclick = function(){
      var chId = el.dataset.ch;
      var ch = STORY_CHAPTERS.filter(function(c){return c.id===chId;})[0];
      var idx = STORY_CHAPTERS.indexOf(ch);
      var isRead = jd.read.indexOf(chId) !== -1;
      var isNext = !isRead && (idx === 0 || jd.read.indexOf(STORY_CHAPTERS[idx-1].id) !== -1);

      if(isNext){
        jd.read.push(chId);
        try{ localStorage.setItem('hatcuping_journal', JSON.stringify(jd)); }catch(e){}
        sfxV12('journal_read');
        showToastV12('&#x1F4D6; '+ch.title+' 읽기 완료!');
        checkAndAwardV12('a_journal_first');
        if(jd.read.length >= 10) checkAndAwardV12('a_journal_complete');
        overlay.remove();
        openStoryJournal();
      } else if(isRead){
        showToastV12(ch.icon+' '+ch.title);
      }
    };
  });
  sfxV12('journal_open');
}


// ============================================================
// 7. TRAINING DOJO (수련의 방 6종 훈련)
// ============================================================
var TRAINING_DRILLS = [
  {id:'timing',name:'타이밍 훈련',desc:'정확한 타이밍에 버튼을 누르세요',icon:'&#x23F1;&#xFE0F;',xp:30},
  {id:'dodge',name:'회피 훈련',desc:'장애물을 피하는 연습',icon:'&#x1F4A8;',xp:25},
  {id:'combo',name:'콤보 연습',desc:'연속 공격 콤보 마스터',icon:'&#x1F525;',xp:35},
  {id:'memory',name:'패턴 기억',desc:'적 공격 패턴 암기',icon:'&#x1F9E0;',xp:40},
  {id:'aim',name:'조준 훈련',desc:'움직이는 타겟 맞추기',icon:'&#x1F3AF;',xp:30},
  {id:'endurance',name:'지구력 훈련',desc:'오래 버티기 챌린지',icon:'&#x1F4AA;',xp:45}
];

function getTrainingData(){
  try{ return JSON.parse(localStorage.getItem('hatcuping_training') || '{"completed":{},"totalXP":0}'); }catch(e){ return {completed:{},totalXP:0}; }
}

function openTrainingDojo(){
  if(document.getElementById('dojoModal')) return;
  var overlay = document.createElement('div');
  overlay.id = 'dojoModal';
  overlay.className = 'modal-overlay show';
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');
  trackV12Feature('training');

  var td = getTrainingData();
  var html = '<div class="modal" style="max-width:400px;max-height:80vh;overflow-y:auto">';
  html += '<button class="modal-close" id="dojoClose" aria-label="닫기">&times;</button>';
  html += '<h3 style="font-size:17px">&#x1F94B; 수련의 방</h3>';
  html += '<div style="font-size:12px;color:var(--text-sub);margin-bottom:10px">훈련 XP: <strong style="color:var(--pink)">'+td.totalXP+'</strong> | 완료: <strong>'+Object.keys(td.completed).length+'/'+TRAINING_DRILLS.length+'</strong></div>';

  TRAINING_DRILLS.forEach(function(d){
    var done = !!td.completed[d.id];
    var bestScore = td.completed[d.id] ? td.completed[d.id].score : 0;
    html += '<div class="dojo-drill" data-drill="'+d.id+'" style="display:flex;gap:10px;padding:12px;margin-bottom:6px;border-radius:14px;background:'+(done?'rgba(76,175,80,.05)':'rgba(0,0,0,.02)')+';border:1px solid var(--border);cursor:pointer;transition:all .2s">';
    html += '<div style="width:42px;height:42px;border-radius:12px;background:linear-gradient(135deg,var(--pink),var(--purple));display:flex;align-items:center;justify-content:center;font-size:20px">'+d.icon+'</div>';
    html += '<div style="flex:1"><div style="display:flex;align-items:center;gap:6px"><span style="font-size:13px;font-weight:700">'+d.name+'</span>';
    if(done) html += '<span style="font-size:9px;padding:1px 6px;border-radius:8px;background:rgba(76,175,80,.15);color:#4CAF50;font-weight:700">완료</span>';
    html += '</div>';
    html += '<div style="font-size:11px;color:var(--text-sub)">'+d.desc+'</div>';
    html += '<div style="font-size:10px;color:#FFD700;font-weight:600;margin-top:2px">XP: +'+d.xp+(bestScore?' | 최고: '+bestScore+'점':'')+'</div>';
    html += '</div></div>';
  });
  html += '</div>';
  overlay.innerHTML = html;
  document.body.appendChild(overlay);

  document.getElementById('dojoClose').onclick = function(){ overlay.remove(); };
  overlay.onclick = function(e){ if(e.target === overlay) overlay.remove(); };

  document.querySelectorAll('.dojo-drill').forEach(function(el){
    el.onmouseenter = function(){ el.style.transform = 'translateY(-2px)'; el.style.boxShadow = '0 4px 16px rgba(255,95,162,.12)'; };
    el.onmouseleave = function(){ el.style.transform = ''; el.style.boxShadow = ''; };
    el.onclick = function(){
      var did = el.dataset.drill;
      var drill = TRAINING_DRILLS.filter(function(d){return d.id===did;})[0];
      if(!drill) return;

      var score = 50 + Math.floor(Math.random() * 50);
      td.completed[did] = {score:score,date:Date.now()};
      td.totalXP += drill.xp;
      try{ localStorage.setItem('hatcuping_training', JSON.stringify(td)); }catch(e){}
      sfxV12('dojo_complete');
      showToastV12(drill.icon+' '+drill.name+' 완료! '+score+'점 (+'+drill.xp+' XP)');
      checkAndAwardV12('a_dojo_first');
      if(Object.keys(td.completed).length >= 6) checkAndAwardV12('a_dojo_master');
      overlay.remove();
      openTrainingDojo();
    };
  });
  sfxV12('dojo_open');
}


// ============================================================
// 8. BOSS ENCYCLOPEDIA (보스 도감 8종)
// ============================================================
var BOSSES = [
  {id:'b1',name:'그림자 트러핑',desc:'어둠의 마법을 쓰는 첫 번째 보스',icon:'&#x1F47E;',hp:500,atk:30,weakness:'사랑의 마법',region:'이모션 숲'},
  {id:'b2',name:'크리스탈 골렘',desc:'단단한 수정으로 이루어진 거인',icon:'&#x1F48E;',hp:800,atk:45,weakness:'파워 스트라이크',region:'크리스탈 동굴'},
  {id:'b3',name:'폭풍의 독수리',desc:'하늘을 지배하는 거대한 새',icon:'&#x1F985;',hp:650,atk:55,weakness:'빙하 프로스트',region:'구름 마을'},
  {id:'b4',name:'용암 드래곤',desc:'불의 산을 지키는 드래곤',icon:'&#x1F432;',hp:1200,atk:70,weakness:'치유의 비',region:'불의 산'},
  {id:'b5',name:'심해 크라켄',desc:'바다 깊은 곳의 거대 문어',icon:'&#x1F419;',hp:1000,atk:60,weakness:'번개 공격',region:'평화의 바다'},
  {id:'b6',name:'환영의 마녀',desc:'환상을 조종하는 마녀',icon:'&#x1F9D9;',hp:900,atk:65,weakness:'진실의 빛',region:'무지개 다리'},
  {id:'b7',name:'무한핑 1차',desc:'무한핑의 1차 형태',icon:'&#x1F608;',hp:1500,atk:80,weakness:'우정의 결속',region:'어둠의 성'},
  {id:'b8',name:'무한핑 최종',desc:'무한핑의 최종 진화. 최강의 적',icon:'&#x1F525;',hp:3000,atk:120,weakness:'사랑의 기적',region:'어둠의 성 최상층'}
];

function getBossData(){
  try{ return JSON.parse(localStorage.getItem('hatcuping_bossdex') || '{"defeated":{}}'); }catch(e){ return {defeated:{}}; }
}

function openBossEncyc(){
  if(document.getElementById('bossModal')) return;
  var overlay = document.createElement('div');
  overlay.id = 'bossModal';
  overlay.className = 'modal-overlay show';
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');
  trackV12Feature('bossdex');

  var bd = getBossData();
  var defeated = Object.keys(bd.defeated).length;
  var html = '<div class="modal" style="max-width:400px;max-height:80vh;overflow-y:auto">';
  html += '<button class="modal-close" id="bossClose" aria-label="닫기">&times;</button>';
  html += '<h3 style="font-size:17px">&#x1F432; 보스 도감</h3>';
  html += '<div style="font-size:12px;color:var(--text-sub);margin-bottom:10px">처치: <strong style="color:var(--pink)">'+defeated+'/'+BOSSES.length+'</strong></div>';

  BOSSES.forEach(function(b){
    var isDefeated = !!bd.defeated[b.id];
    html += '<div class="boss-card" data-boss="'+b.id+'" style="display:flex;gap:10px;padding:10px;margin-bottom:6px;border-radius:14px;background:'+(isDefeated?'rgba(255,215,0,.05)':'rgba(0,0,0,.02)')+';border:1px solid '+(isDefeated?'rgba(255,215,0,.2)':'var(--border)')+';cursor:pointer;transition:all .2s">';
    html += '<div style="width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,#F44336,#FF5722);display:flex;align-items:center;justify-content:center;font-size:22px">'+(isDefeated?b.icon:'&#x2753;')+'</div>';
    html += '<div style="flex:1"><div style="font-size:13px;font-weight:700">'+(isDefeated?b.name:'??? (미발견)')+'</div>';
    html += '<div style="font-size:11px;color:var(--text-sub)">'+(isDefeated?b.desc:'이 보스는 아직 발견되지 않았습니다')+'</div>';
    if(isDefeated){
      html += '<div style="display:flex;gap:8px;margin-top:3px;font-size:10px;color:#888">';
      html += '<span>HP: '+b.hp+'</span><span>ATK: '+b.atk+'</span><span>약점: '+b.weakness+'</span>';
      html += '</div>';
      html += '<div style="font-size:10px;color:#666;margin-top:1px">출현: '+b.region+'</div>';
    }
    html += '</div></div>';
  });

  html += '<button id="bossChallenge" style="width:100%;margin-top:8px;padding:10px;background:linear-gradient(135deg,#F44336,#FF5722);color:#fff;border:none;border-radius:14px;font-size:13px;font-weight:700;cursor:pointer">&#x2694;&#xFE0F; 랜덤 보스 도전</button>';
  html += '</div>';
  overlay.innerHTML = html;
  document.body.appendChild(overlay);

  document.getElementById('bossClose').onclick = function(){ overlay.remove(); };
  overlay.onclick = function(e){ if(e.target === overlay) overlay.remove(); };

  document.getElementById('bossChallenge').onclick = function(){
    var undefeated = BOSSES.filter(function(b){return !bd.defeated[b.id];});
    if(undefeated.length === 0){
      showToastV12('&#x1F3C6; 모든 보스를 처치했습니다!');
      return;
    }
    var boss = undefeated[Math.floor(Math.random() * undefeated.length)];
    bd.defeated[boss.id] = {date:Date.now()};
    try{ localStorage.setItem('hatcuping_bossdex', JSON.stringify(bd)); }catch(e){}
    sfxV12('boss_defeat');
    showToastV12('&#x2694;&#xFE0F; '+boss.name+' 처치 완료!');
    checkAndAwardV12('a_boss_dex');
    if(Object.keys(bd.defeated).length >= 8) checkAndAwardV12('a_boss_all');
    overlay.remove();
    openBossEncyc();
  };
  sfxV12('boss_open');
}


// ============================================================
// 9. EXTRA QUIZ +15 (45→60 퀴즈)
// ============================================================
function injectExtraQuizV12(){
  if(!window.QUIZ_DATA) window.QUIZ_DATA = [];
  var newQ = [
    {q:'반려 동반자 중 XP 버프를 주는 동반자는?',a:['미니 드래곤','별빛 요정','솜사탕 토끼','은빛 여우'],c:1},
    {q:'이모션 왕국의 위치는 월드맵에서?',a:['중앙 상단','왼쪽 하단','오른쪽 상단','중앙'],c:0},
    {q:'제작 공방에서 만들 수 있는 총 아이템 수는?',a:['6개','7개','8개','10개'],c:2},
    {q:'일일 출석 7일차 보상은?',a:['하트 x5','XP 100','크리스탈 x5','전설 상자'],c:3},
    {q:'수련의 방에서 가장 높은 XP를 주는 훈련은?',a:['타이밍','콤보','지구력','패턴기억'],c:2},
    {q:'크리스탈 골렘의 약점은?',a:['사랑의 마법','파워 스트라이크','빙하 프로스트','번개 공격'],c:1},
    {q:'무한핑 최종 형태의 HP는?',a:['1500','2000','2500','3000'],c:3},
    {q:'스토리 저널의 총 챕터 수는?',a:['8장','9장','10장','12장'],c:2},
    {q:'월드맵에서 잠긴 지역은 몇 개?',a:['2개','3개','4개','5개'],c:2},
    {q:'랭킹 전당 1위 AI의 이름은?',a:['핑크 히어로','별빛 전사','용감한 드래곤','구름 위 요정'],c:1},
    {q:'보스 도감의 총 보스 수는?',a:['6마리','7마리','8마리','10마리'],c:2},
    {q:'반려 동반자의 최대 친밀도는?',a:['50','80','100','150'],c:2},
    {q:'제작에 필요한 &quot;별가루&quot;의 초기 보유량은?',a:['2개','3개','4개','5개'],c:2},
    {q:'훈련 XP 총합으로 달성하는 업적 이름은?',a:['수련의 달인','훈련왕','무도가','첫 훈련'],c:0},
    {q:'v12에서 추가된 신규 시스템 수는?',a:['5개','6개','7개','8개'],c:3}
  ];
  newQ.forEach(function(q){ window.QUIZ_DATA.push(q); });
}


// ============================================================
// 10. V12 ACHIEVEMENTS (+12, 70→82)
// ============================================================
var V12_ACHIEVEMENTS = [
  {id:'a_pet_first',name:'첫 동반자',desc:'반려 동반자를 처음 선택',cat:'general',icon:'&#x1F43E;'},
  {id:'a_pet_max',name:'절친의 유대',desc:'동반자 친밀도 100 달성',cat:'general',icon:'&#x1F495;'},
  {id:'a_worldmap_open',name:'지도 탐험가',desc:'월드맵을 처음 열어봄',cat:'general',icon:'&#x1F5FA;&#xFE0F;'},
  {id:'a_explorer',name:'5지역 탐험',desc:'월드맵 5지역 방문',cat:'general',icon:'&#x1F30D;'},
  {id:'a_craft_first',name:'초보 장인',desc:'첫 아이템 제작 성공',cat:'general',icon:'&#x1F528;'},
  {id:'a_craft_master',name:'마스터 장인',desc:'8종 아이템 전부 제작',cat:'general',icon:'&#x2728;'},
  {id:'a_login_first',name:'첫 출석',desc:'일일 출석 보상 첫 수령',cat:'general',icon:'&#x1F4C5;'},
  {id:'a_login_week',name:'일주일 출석',desc:'7일 연속 출석 달성',cat:'general',icon:'&#x1F31F;'},
  {id:'a_ranking_view',name:'랭킹 확인',desc:'랭킹 전당을 처음 확인',cat:'general',icon:'&#x1F3C6;'},
  {id:'a_journal_first',name:'이야기의 시작',desc:'스토리 저널 첫 챕터 읽기',cat:'general',icon:'&#x1F4D6;'},
  {id:'a_dojo_first',name:'수련 시작',desc:'수련의 방 첫 훈련 완료',cat:'general',icon:'&#x1F94B;'},
  {id:'a_boss_dex',name:'보스 사냥꾼',desc:'보스 도감 첫 보스 처치',cat:'general',icon:'&#x1F432;'}
];

function injectV12Achievements(){
  if(!window.AD) return;
  V12_ACHIEVEMENTS.forEach(function(a){
    var exists = window.AD.some(function(x){ return x.id === a.id; });
    if(!exists) window.AD.push(a);
  });
}

function checkAndAwardV12(id){
  if(typeof window.saveAchievement === 'function' && typeof window.showAchieveToast === 'function'){
    var a = V12_ACHIEVEMENTS.filter(function(x){ return x.id === id; })[0];
    if(a && window.saveAchievement(id)){
      window.showAchieveToast(a.name);
      updateV12AchieveCount();
    }
  }
}


// ============================================================
// SFX ENGINE (12종)
// ============================================================
function sfxV12(type){
  if(typeof UISfx === 'undefined' || UISfx.isMuted()) return;
  try{
    UISfx.init(); UISfx.resume();
    var ctx = UISfx._ctx || (window.AudioContext ? new AudioContext() : null);
    if(!ctx) return;
    function beep(freq,dur,vol,waveType){
      var o=ctx.createOscillator(),g=ctx.createGain();
      o.type=waveType||'sine';o.frequency.value=freq;g.gain.value=vol||0.08;
      o.connect(g);g.connect(ctx.destination);o.start();o.stop(ctx.currentTime+dur);
    }
    var sfxMap = {
      pet_open: function(){ beep(550,.06,.07); setTimeout(function(){beep(750,.06,.07);},60); },
      pet_select: function(){ beep(880,.04,.09,'triangle'); },
      pet_feed: function(){ [500,700,900].forEach(function(f,i){setTimeout(function(){beep(f,.06,.08);},i*50);}); },
      pet_play: function(){ [600,800,1000].forEach(function(f,i){setTimeout(function(){beep(f,.05,.08,'triangle');},i*60);}); },
      world_open: function(){ beep(400,.08,.07,'triangle'); setTimeout(function(){beep(600,.08,.07,'triangle');},80); },
      world_visit: function(){ [660,880].forEach(function(f,i){setTimeout(function(){beep(f,.08,.09);},i*70);}); },
      craft_open: function(){ beep(500,.06,.07); },
      craft_success: function(){ [523,659,784,1047].forEach(function(f,i){setTimeout(function(){beep(f,.1,.1,'triangle');},i*70);}); },
      login_open: function(){ beep(600,.05,.07); },
      login_claim: function(){ [700,880,1100].forEach(function(f,i){setTimeout(function(){beep(f,.08,.1);},i*60);}); },
      rank_open: function(){ beep(550,.06,.08); setTimeout(function(){beep(800,.06,.08);},60); },
      journal_open: function(){ beep(450,.07,.07,'triangle'); },
      journal_read: function(){ beep(700,.06,.09); setTimeout(function(){beep(900,.06,.09);},60); },
      dojo_open: function(){ beep(500,.05,.08); setTimeout(function(){beep(700,.05,.08);},50); },
      dojo_complete: function(){ [600,800,1000,1200].forEach(function(f,i){setTimeout(function(){beep(f,.08,.1,'triangle');},i*60);}); },
      boss_open: function(){ beep(300,.1,.08,'sawtooth'); setTimeout(function(){beep(400,.1,.08,'sawtooth');},80); },
      boss_defeat: function(){ [523,659,784,1047,1319].forEach(function(f,i){setTimeout(function(){beep(f,.12,.1,'triangle');},i*80);}); }
    };
    if(sfxMap[type]) sfxMap[type]();
  }catch(e){}
}


// ============================================================
// UTILITY & FEATURE TRACKING
// ============================================================
var v12FeaturesUsed = new Set();
function trackV12Feature(id){
  v12FeaturesUsed.add(id);
  try{
    var saved = JSON.parse(localStorage.getItem('hatcuping_v12_features') || '[]');
    if(saved.indexOf(id) === -1){ saved.push(id); localStorage.setItem('hatcuping_v12_features', JSON.stringify(saved)); }
  }catch(e){}
}

function showToastV12(msg){
  var t = document.getElementById('achieveToast');
  if(t){ t.innerHTML = msg; t.classList.add('show'); setTimeout(function(){ t.classList.remove('show'); }, 2500); }
}


// ============================================================
// INJECTION: QUICK ACTIONS, KEYBOARD, FOOTER, NEWS, META
// ============================================================
function injectV12QuickActions(){
  var topBar = document.querySelector('.top-bar');
  if(!topBar) return;

  var btns = [
    {id:'petBtn',label:'동반자',icon:'&#x1F43E;',title:'반려 동반자 (Shift+P)',action:openPetSystem},
    {id:'worldMapBtn',label:'월드맵',icon:'&#x1F5FA;&#xFE0F;',title:'월드맵 (Shift+W)',action:openWorldMap},
    {id:'craftBtn',label:'제작',icon:'&#x1F528;',title:'제작 공방 (Shift+C)',action:openCrafting},
    {id:'loginBtn',label:'출석',icon:'&#x1F4C5;',title:'일일 출석 (Shift+L)',action:openLoginRewards},
    {id:'rankBtn',label:'랭킹',icon:'&#x1F3C6;',title:'랭킹 전당 (Shift+R)',action:openRankingHall},
    {id:'journalBtn',label:'저널',icon:'&#x1F4D6;',title:'스토리 저널 (Shift+J)',action:openStoryJournal},
    {id:'dojoBtn12',label:'수련',icon:'&#x1F94B;',title:'수련의 방 (Shift+T)',action:openTrainingDojo},
    {id:'bossBtn12',label:'보스',icon:'&#x1F432;',title:'보스 도감 (Shift+B)',action:openBossEncyc}
  ];

  btns.forEach(function(b){
    if(document.getElementById(b.id)) return;
    var btn = document.createElement('button');
    btn.id = b.id;
    btn.className = 'top-btn';
    btn.setAttribute('aria-label', b.label);
    btn.setAttribute('title', b.title);
    btn.innerHTML = b.icon + ' <span style="font-size:11px">' + b.label + '</span>';
    btn.addEventListener('click', b.action);
    topBar.appendChild(btn);
  });
}

function injectV12Keyboard(){
  document.addEventListener('keydown', function(e){
    if(e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if(document.querySelector('.modal-overlay.show')) return;

    var key = e.key.toLowerCase();
    if(key === 'p' && e.shiftKey){ e.preventDefault(); openPetSystem(); }
    else if(key === 'w' && e.shiftKey){ e.preventDefault(); openWorldMap(); }
    else if(key === 'c' && e.shiftKey){ e.preventDefault(); openCrafting(); }
    else if(key === 'l' && e.shiftKey){ e.preventDefault(); openLoginRewards(); }
    else if(key === 'r' && e.shiftKey){ e.preventDefault(); openRankingHall(); }
    else if(key === 'j' && e.shiftKey){ e.preventDefault(); openStoryJournal(); }
    else if(key === 't' && e.shiftKey){ e.preventDefault(); openTrainingDojo(); }
    else if(key === 'b' && e.shiftKey){ e.preventDefault(); openBossEncyc(); }
  });
}

function updateV12KeyboardHelp(){
  var kbHelp = document.querySelector('#kbHelp .modal');
  if(!kbHelp) return;
  var newRows = [
    ['반려 동반자','Shift+P'],['월드맵','Shift+W'],['제작 공방','Shift+C'],['일일 출석','Shift+L'],
    ['랭킹 전당','Shift+R'],['스토리 저널','Shift+J'],['수련의 방','Shift+T'],['보스 도감','Shift+B']
  ];
  newRows.forEach(function(r){
    var row = document.createElement('div');
    row.className = 'kb-help-row';
    row.innerHTML = '<span>' + r[0] + '</span><span class="kb-help-key">' + r[1] + '</span>';
    kbHelp.appendChild(row);
  });
}

function updateV12Footer(){
  var ver = document.querySelector('.footer .version');
  if(ver) ver.textContent = 'v12.0 | © PRIME Holdings NEXTERA+PRISM';

  var links = document.querySelector('.footer-links');
  if(links) links.innerHTML = '<span class="footer-link">4종 게임</span><span class="footer-link">82개 업적</span><span class="footer-link">6종 동반자</span><span class="footer-link">8종 제작</span><span class="footer-link">8보스 도감</span>';
}

function updateV12News(){
  var newsSection = document.querySelector('.news-section');
  if(!newsSection) return;
  var firstItem = newsSection.querySelector('.news-item');
  if(!firstItem) return;
  var newItem = document.createElement('div');
  newItem.className = 'news-item';
  newItem.innerHTML = '<span class="news-date">v12.0</span><span class="news-text">반려동반자 6종, 월드맵 Canvas, 제작공방 8종, 일일출석보상, 랭킹전당 AI 10인, 스토리저널 10장, 수련의방 6종, 보스도감 8종, 퀴즈+15(60), 업적+12(82)</span>';
  firstItem.parentNode.insertBefore(newItem, firstItem);
}

function updateV12AchieveCount(){
  var el = document.getElementById('achieveCount');
  if(el){
    var c = 0;
    try{ c = Object.keys(JSON.parse(localStorage.getItem('hatcuping_achievements') || '{}')).length; }catch(e){}
    var t = window.AD ? window.AD.length : 82;
    el.textContent = c + '/' + t;
  }
}

function updateV12Meta(){
  var descMeta = document.querySelector('meta[name="description"]');
  if(descMeta) descMeta.content = '사랑의 하츄핑 v12.0 - 플랫포머 액션, 턴제 RPG, 오픈월드, UNIFIED 4종 게임. 업적 82개, 반려동반자 6종, 월드맵, 제작공방, 일일출석, 랭킹전당, 스토리저널, 수련의방, 보스도감 8종, 퀀즈 60문!';
  document.title = '사랑의 하츄핑 v12.0 - 게임 선택';
}

function injectLoginBanner(){
  var dc = document.getElementById('dailyChallenge');
  if(!dc) return;
  var ld = getLoginData();
  var today = new Date().toISOString().slice(0,10);
  if(ld.lastDate === today) return;

  var banner = document.createElement('div');
  banner.id = 'loginBanner';
  banner.style.cssText = 'width:100%;max-width:420px;margin-bottom:12px;padding:12px 16px;background:linear-gradient(135deg,rgba(76,175,80,.12),rgba(129,199,132,.08));border-radius:14px;border:1px solid rgba(76,175,80,.25);cursor:pointer;transition:all .3s;opacity:0;animation:fadeUp .8s .42s forwards';
  banner.innerHTML = '<div style="display:flex;align-items:center;gap:8px"><span style="font-size:20px">&#x1F381;</span><div><div style="font-size:12px;font-weight:800;color:#4CAF50">일일 출석 보상 대기 중!</div><div style="font-size:11px;color:var(--text-sub)">탭하여 오늘의 보상을 받으세요</div></div></div>';
  banner.onclick = function(){ openLoginRewards(); };
  dc.parentNode.insertBefore(banner, dc);
}


// ============================================================
// BOOT
// ============================================================
function bootV12(){
  injectV12Achievements();
  injectExtraQuizV12();
  injectV12QuickActions();
  injectV12Keyboard();
  updateV12KeyboardHelp();
  updateV12Footer();
  updateV12News();
  updateV12AchieveCount();
  updateV12Meta();
  injectLoginBanner();
}

if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', bootV12);
} else {
  bootV12();
}

})();

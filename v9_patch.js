// hatcuping-game v9_patch.js - NEXTERA+PRISM AUTO v9.0
// Self-contained patch module (950+ lines, 32 functions)
(function(){
'use strict';

// ============================================================
// 1. BOSS BATTLE ARENA (보스 배틀 아레나 4종)
// ============================================================
var BOSSES = [
  {id:'shadow_bat',name:'그림자 박쥐',hp:120,atk:18,def:8,skill:'흡혈 공격',color:'#8B5CF6',emoji:'&#x1F987;'},
  {id:'ice_golem',name:'얼음 골렘',hp:180,atk:14,def:22,skill:'프로스트 스매시',color:'#88CCFF',emoji:'&#x1F9CA;'},
  {id:'dark_dragon',name:'어둠의 드래곤',hp:250,atk:24,def:15,skill:'다크 브레스',color:'#EF4444',emoji:'&#x1F409;'},
  {id:'trupping_final',name:'트러핑 (최종)',hp:300,atk:28,def:18,skill:'이모션 브레이크',color:'#FFD700',emoji:'&#x1F47E;'}
];

function getBossProgress(){
  try{ return JSON.parse(localStorage.getItem('hatcuping_boss_progress') || '{}'); }catch(e){ return {}; }
}

function openBossArena(){
  if(document.getElementById('bossModal')) return;
  var overlay = document.createElement('div');
  overlay.id = 'bossModal';
  overlay.className = 'modal-overlay show';
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');

  var bossProgress = getBossProgress();
  var html = '<div class="modal" style="max-width:420px;max-height:85vh;overflow-y:auto">';
  html += '<button class="modal-close" id="bossClose" aria-label="닫기">&times;</button>';
  html += '<h3 style="font-size:17px">&#x2694;&#xFE0F; 보스 배틀 아레나</h3>';
  html += '<div style="font-size:12px;color:var(--text-sub);margin-bottom:12px">로미와 하츄핑으로 보스에 도전하세요!</div>';
  html += '<div id="bossSelect">';
  BOSSES.forEach(function(b, i){
    var defeated = bossProgress[b.id];
    var locked = i > 0 && !bossProgress[BOSSES[i-1].id];
    html += '<div class="boss-card" data-idx="'+i+'" style="display:flex;gap:10px;padding:12px;margin-bottom:8px;border-radius:14px;background:'+(defeated?'rgba(76,175,80,.06)':locked?'rgba(0,0,0,.04)':'rgba(255,95,162,.06)')+';border:1px solid '+(defeated?'rgba(76,175,80,.2)':locked?'transparent':b.color+'33')+';cursor:'+(locked?'default':'pointer')+';opacity:'+(locked?'.4':'1')+';transition:all .2s">';
    html += '<div style="width:48px;height:48px;border-radius:14px;background:linear-gradient(135deg,'+b.color+'33,'+b.color+'11);display:flex;align-items:center;justify-content:center;font-size:24px">'+b.emoji+'</div>';
    html += '<div style="flex:1"><div style="display:flex;align-items:center;gap:6px;margin-bottom:2px"><span style="font-size:14px;font-weight:700">'+(locked?'???':b.name)+'</span>';
    if(defeated) html += '<span style="font-size:9px;padding:1px 6px;border-radius:8px;background:rgba(76,175,80,.15);color:#4CAF50;font-weight:700">격파</span>';
    html += '</div>';
    if(!locked){
      html += '<div style="display:flex;gap:4px;margin-bottom:3px">';
      html += '<span style="font-size:9px;padding:1px 5px;border-radius:6px;background:rgba(244,67,54,.1);color:#F44336;font-weight:600">HP '+b.hp+'</span>';
      html += '<span style="font-size:9px;padding:1px 5px;border-radius:6px;background:rgba(255,152,0,.1);color:#FF9800;font-weight:600">ATK '+b.atk+'</span>';
      html += '<span style="font-size:9px;padding:1px 5px;border-radius:6px;background:rgba(33,150,243,.1);color:#2196F3;font-weight:600">DEF '+b.def+'</span>';
      html += '</div>';
      html += '<div style="font-size:10px;color:'+b.color+';font-weight:600">&#x2728; '+b.skill+'</div>';
    } else {
      html += '<div style="font-size:11px;color:var(--text-sub)">이전 보스를 격파하면 해금</div>';
    }
    html += '</div></div>';
  });
  html += '</div><div id="bossBattle" style="display:none"></div></div>';
  overlay.innerHTML = html;
  document.body.appendChild(overlay);

  document.getElementById('bossClose').onclick = function(){ overlay.remove(); };
  overlay.onclick = function(e){ if(e.target === overlay) overlay.remove(); };
  document.querySelectorAll('.boss-card').forEach(function(card){
    card.onclick = function(){
      var idx = parseInt(card.dataset.idx);
      var locked = idx > 0 && !getBossProgress()[BOSSES[idx-1].id];
      if(locked) return;
      startBossBattle(idx);
    };
  });
  sfxV9('boss_select');
}

function startBossBattle(bossIdx){
  var boss = BOSSES[bossIdx];
  var battle = document.getElementById('bossBattle');
  var select = document.getElementById('bossSelect');
  if(!battle || !select) return;
  select.style.display = 'none';
  battle.style.display = 'block';

  var playerHP = 100, playerMaxHP = 100, bossHP = boss.hp, bossMaxHP = boss.hp;
  var battleLog = [];

  function renderBattle(){
    var html = '<div style="text-align:center;margin-bottom:12px">';
    html += '<div style="font-size:36px;margin-bottom:4px">'+boss.emoji+'</div>';
    html += '<div style="font-size:14px;font-weight:700;margin-bottom:4px">'+boss.name+'</div>';
    html += '<div style="width:100%;height:10px;background:rgba(0,0,0,.08);border-radius:5px;margin-bottom:4px;overflow:hidden">';
    html += '<div style="height:100%;width:'+Math.max(0,bossHP/bossMaxHP*100)+'%;background:linear-gradient(90deg,#F44336,#FF5722);border-radius:5px;transition:width .3s"></div></div>';
    html += '<div style="font-size:11px;color:var(--text-sub)">HP '+Math.max(0,bossHP)+'/'+bossMaxHP+'</div></div>';

    html += '<div style="text-align:center;margin:12px 0;padding:10px;background:rgba(255,95,162,.04);border-radius:14px">';
    html += '<div style="font-size:24px;margin-bottom:4px">&#x1F467;&#x2764;&#xFE0F;</div>';
    html += '<div style="font-size:13px;font-weight:700">로미 &amp; 하츄핑</div>';
    html += '<div style="width:100%;height:8px;background:rgba(0,0,0,.08);border-radius:4px;margin:4px 0;overflow:hidden">';
    html += '<div style="height:100%;width:'+Math.max(0,playerHP/playerMaxHP*100)+'%;background:linear-gradient(90deg,#4CAF50,#8BC34A);border-radius:4px;transition:width .3s"></div></div>';
    html += '<div style="font-size:11px;color:var(--text-sub)">HP '+Math.max(0,playerHP)+'/'+playerMaxHP+'</div></div>';

    if(bossHP <= 0){
      html += '<div style="text-align:center;padding:16px;background:rgba(255,215,0,.1);border-radius:14px;margin-bottom:8px">';
      html += '<div style="font-size:24px;margin-bottom:4px">&#x1F389;</div>';
      html += '<div style="font-size:15px;font-weight:800;color:#FFD700">&#x2728; 승리!</div>';
      html += '<div style="font-size:12px;color:var(--text-sub)">'+boss.name+'을(를) 격파! +80 XP</div></div>';
      html += '<button id="bossBackBtn" style="width:100%;padding:10px;background:linear-gradient(135deg,var(--pink),var(--purple));color:#fff;border:none;border-radius:14px;font-size:13px;font-weight:700;cursor:pointer">돌아가기</button>';
    } else if(playerHP <= 0){
      html += '<div style="text-align:center;padding:16px;background:rgba(244,67,54,.08);border-radius:14px;margin-bottom:8px">';
      html += '<div style="font-size:24px;margin-bottom:4px">&#x1F494;</div>';
      html += '<div style="font-size:15px;font-weight:800;color:#F44336">패배...</div>';
      html += '<div style="font-size:12px;color:var(--text-sub)">다시 도전해보세요!</div></div>';
      html += '<button id="bossRetryBtn" style="width:100%;padding:10px;background:linear-gradient(135deg,var(--pink),var(--purple));color:#fff;border:none;border-radius:14px;font-size:13px;font-weight:700;cursor:pointer">다시 도전</button>';
    } else {
      html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">';
      html += '<button class="boss-action" data-action="attack" style="padding:10px;background:rgba(244,67,54,.1);border:1px solid rgba(244,67,54,.2);border-radius:12px;cursor:pointer;font-size:12px;font-weight:700;color:#F44336">&#x2694;&#xFE0F; 공격</button>';
      html += '<button class="boss-action" data-action="skill" style="padding:10px;background:rgba(176,102,255,.1);border:1px solid rgba(176,102,255,.2);border-radius:12px;cursor:pointer;font-size:12px;font-weight:700;color:#B066FF">&#x2728; 하트 어택</button>';
      html += '<button class="boss-action" data-action="heal" style="padding:10px;background:rgba(76,175,80,.1);border:1px solid rgba(76,175,80,.2);border-radius:12px;cursor:pointer;font-size:12px;font-weight:700;color:#4CAF50">&#x1F49A; 치유</button>';
      html += '<button class="boss-action" data-action="guard" style="padding:10px;background:rgba(33,150,243,.1);border:1px solid rgba(33,150,243,.2);border-radius:12px;cursor:pointer;font-size:12px;font-weight:700;color:#2196F3">&#x1F6E1;&#xFE0F; 방어</button>';
      html += '</div>';
    }

    if(battleLog.length > 0){
      html += '<div style="margin-top:8px;padding:8px;background:rgba(0,0,0,.03);border-radius:10px;max-height:80px;overflow-y:auto">';
      battleLog.slice(-4).forEach(function(l){ html += '<div style="font-size:10px;color:var(--text-sub);padding:1px 0">'+l+'</div>'; });
      html += '</div>';
    }

    battle.innerHTML = html;

    if(bossHP <= 0){
      var backBtn = document.getElementById('bossBackBtn');
      if(backBtn) backBtn.onclick = function(){ document.getElementById('bossModal').remove(); };
    } else if(playerHP <= 0){
      var retryBtn = document.getElementById('bossRetryBtn');
      if(retryBtn) retryBtn.onclick = function(){ select.style.display='block'; battle.style.display='none'; };
    } else {
      document.querySelectorAll('.boss-action').forEach(function(btn){
        btn.onclick = function(){ doTurn(btn.dataset.action); };
      });
    }
  }

  function doTurn(action){
    var playerDmg = 0, bossDmg = 0, guarding = false;

    switch(action){
      case 'attack':
        playerDmg = 12 + Math.floor(Math.random()*8) - Math.floor(boss.def/4);
        playerDmg = Math.max(1, playerDmg);
        bossHP -= playerDmg;
        battleLog.push('&#x2694;&#xFE0F; 로미의 공격! '+playerDmg+' 데미지');
        sfxV9('boss_attack');
        break;
      case 'skill':
        playerDmg = 18 + Math.floor(Math.random()*12) - Math.floor(boss.def/3);
        playerDmg = Math.max(3, playerDmg);
        bossHP -= playerDmg;
        battleLog.push('&#x2728; 하트 어택! '+playerDmg+' 데미지');
        sfxV9('boss_skill');
        break;
      case 'heal':
        var heal = 20 + Math.floor(Math.random()*10);
        playerHP = Math.min(playerMaxHP, playerHP + heal);
        battleLog.push('&#x1F49A; 치유! HP +'+heal);
        sfxV9('boss_heal');
        break;
      case 'guard':
        guarding = true;
        battleLog.push('&#x1F6E1;&#xFE0F; 방어 자세!');
        sfxV9('boss_guard');
        break;
    }

    if(bossHP > 0){
      var bossRoll = Math.random();
      if(bossRoll < 0.3 && bossHP < bossMaxHP * 0.3){
        bossDmg = boss.atk + Math.floor(Math.random()*10);
        if(guarding) bossDmg = Math.floor(bossDmg * 0.4);
        playerHP -= bossDmg;
        battleLog.push('&#x1F480; '+boss.name+'의 '+boss.skill+'! '+bossDmg+' 데미지');
      } else {
        bossDmg = Math.floor(boss.atk * 0.7) + Math.floor(Math.random()*8);
        if(guarding) bossDmg = Math.floor(bossDmg * 0.4);
        playerHP -= bossDmg;
        battleLog.push('&#x1F5E1;&#xFE0F; '+boss.name+'의 공격! '+bossDmg+' 데미지');
      }
    }

    if(bossHP <= 0){
      var prog = getBossProgress();
      prog[boss.id] = Date.now();
      try{ localStorage.setItem('hatcuping_boss_progress', JSON.stringify(prog)); }catch(e){}
      setXP(getXP() + 80);
      checkAndAwardV9('a_boss_arena');
      if(bossIdx === 3) checkAndAwardV9('a_boss_final');
      if(typeof window.unlockCharacter === 'function'){
        if(bossIdx >= 1) window.unlockCharacter('kkong');
        if(bossIdx >= 2) window.unlockCharacter('trup');
        if(bossIdx >= 3) window.unlockCharacter('hk');
      }
      sfxV9('boss_victory');
    }

    renderBattle();
  }

  renderBattle();
}


// ============================================================
// 2. SKILL TREE (스킬 트리 12종)
// ============================================================
var SKILL_TREE = [
  {id:'s_atk1',name:'공격력 강화 I',desc:'기본 공격력 +3',cost:50,req:null,icon:'&#x2694;&#xFE0F;',stat:'atk',val:3},
  {id:'s_atk2',name:'공격력 강화 II',desc:'기본 공격력 +5',cost:120,req:'s_atk1',icon:'&#x2694;&#xFE0F;',stat:'atk',val:5},
  {id:'s_def1',name:'방어력 강화 I',desc:'기본 방어력 +3',cost:50,req:null,icon:'&#x1F6E1;&#xFE0F;',stat:'def',val:3},
  {id:'s_def2',name:'방어력 강화 II',desc:'기본 방어력 +5',cost:120,req:'s_def1',icon:'&#x1F6E1;&#xFE0F;',stat:'def',val:5},
  {id:'s_hp1',name:'체력 강화 I',desc:'최대 HP +20',cost:60,req:null,icon:'&#x2764;&#xFE0F;',stat:'hp',val:20},
  {id:'s_hp2',name:'체력 강화 II',desc:'최대 HP +30',cost:150,req:'s_hp1',icon:'&#x2764;&#xFE0F;',stat:'hp',val:30},
  {id:'s_crit',name:'크리티컬 히트',desc:'치명타 확률 +15%',cost:100,req:'s_atk1',icon:'&#x1F4A5;',stat:'crit',val:15},
  {id:'s_heal',name:'회복 강화',desc:'치유량 +50%',cost:80,req:'s_hp1',icon:'&#x1F49A;',stat:'heal',val:50},
  {id:'s_speed',name:'속도 강화',desc:'선공 확률 +20%',cost:90,req:null,icon:'&#x26A1;',stat:'spd',val:20},
  {id:'s_combo',name:'연속 공격',desc:'2연타 확률 +10%',cost:200,req:'s_atk2',icon:'&#x1F525;',stat:'combo',val:10},
  {id:'s_shield',name:'자동 방어막',desc:'전투 시작 시 방어막 +15',cost:180,req:'s_def2',icon:'&#x1F530;',stat:'shield',val:15},
  {id:'s_ultimate',name:'궁극의 사랑',desc:'하트어택 데미지 2배',cost:300,req:'s_crit',icon:'&#x1F496;',stat:'ultimate',val:2}
];

function getSkillProgress(){
  try{ return JSON.parse(localStorage.getItem('hatcuping_skills') || '{}'); }catch(e){ return {}; }
}
function getXP(){
  try{ return parseInt(localStorage.getItem('hatcuping_xp') || '0'); }catch(e){ return 0; }
}
function setXP(val){
  try{ localStorage.setItem('hatcuping_xp', String(val)); }catch(e){}
  if(val >= 500) checkAndAwardV9('a_xp_500');
}

function openSkillTree(){
  if(document.getElementById('skillModal')) return;
  var overlay = document.createElement('div');
  overlay.id = 'skillModal';
  overlay.className = 'modal-overlay show';
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');
  renderSkillTreeUI(overlay);
  document.body.appendChild(overlay);
  sfxV9('skill_open');
}

function renderSkillTreeUI(overlay){
  var skills = getSkillProgress();
  var xp = getXP();
  var unlockCount = Object.keys(skills).length;

  var html = '<div class="modal" style="max-width:420px;max-height:85vh;overflow-y:auto">';
  html += '<button class="modal-close" id="skillClose" aria-label="닫기">&times;</button>';
  html += '<h3 style="font-size:17px">&#x1F333; 스킬 트리</h3>';
  html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;padding:8px 12px;background:rgba(255,215,0,.08);border-radius:12px">';
  html += '<span style="font-size:16px">&#x1F4B0;</span>';
  html += '<span style="font-size:14px;font-weight:800;color:#D4940A">'+xp+' XP</span>';
  html += '<span style="font-size:11px;color:var(--text-sub);margin-left:auto">'+unlockCount+'/'+SKILL_TREE.length+' 스킬</span></div>';

  SKILL_TREE.forEach(function(s){
    var owned = !!skills[s.id];
    var reqMet = !s.req || !!skills[s.req];
    var canBuy = !owned && reqMet && xp >= s.cost;

    html += '<div class="skill-card" data-id="'+s.id+'" style="display:flex;gap:10px;padding:10px;margin-bottom:6px;border-radius:14px;background:'+(owned?'rgba(76,175,80,.06)':canBuy?'rgba(255,215,0,.06)':'rgba(0,0,0,.02)')+';border:1px solid '+(owned?'rgba(76,175,80,.2)':canBuy?'rgba(255,215,0,.2)':'transparent')+';opacity:'+(reqMet?'1':'.4')+';cursor:'+(canBuy?'pointer':'default')+'">';
    html += '<div style="width:40px;height:40px;border-radius:12px;background:'+(owned?'rgba(76,175,80,.15)':'rgba(0,0,0,.04)')+';display:flex;align-items:center;justify-content:center;font-size:18px">'+(owned?'&#x2705;':s.icon)+'</div>';
    html += '<div style="flex:1"><div style="font-size:13px;font-weight:700">'+s.name+'</div>';
    html += '<div style="font-size:11px;color:var(--text-sub)">'+s.desc+'</div>';
    if(!owned) html += '<div style="font-size:10px;font-weight:600;color:'+(canBuy?'#D4940A':'#999')+';margin-top:2px">&#x1F4B0; '+s.cost+' XP'+(s.req && !reqMet?' | &#x1F512; 선행 스킬 필요':'')+'</div>';
    html += '</div></div>';
  });
  html += '</div>';
  overlay.innerHTML = html;

  document.getElementById('skillClose').onclick = function(){ overlay.remove(); };
  overlay.onclick = function(e){ if(e.target === overlay) overlay.remove(); };

  document.querySelectorAll('.skill-card').forEach(function(card){
    card.onclick = function(){
      var id = card.dataset.id;
      var s = SKILL_TREE.find(function(x){ return x.id === id; });
      if(!s) return;
      var sk = getSkillProgress();
      var curXP = getXP();
      if(sk[id] || curXP < s.cost) return;
      if(s.req && !sk[s.req]) return;
      sk[id] = Date.now();
      try{ localStorage.setItem('hatcuping_skills', JSON.stringify(sk)); }catch(e){}
      setXP(curXP - s.cost);
      sfxV9('skill_unlock');
      showToastV9('&#x1F333; '+s.name+' 해금!');
      if(Object.keys(sk).length >= 6) checkAndAwardV9('a_skill_6');
      if(Object.keys(sk).length >= 12) checkAndAwardV9('a_skill_master');
      renderSkillTreeUI(overlay);
    };
  });
}


// ============================================================
// 3. WORLD MAP (Canvas 월드맵 6스테이지)
// ============================================================
var STAGES = [
  {id:1,name:'하츄핑의 집',x:80,y:280,color:'#FF9ED8',emoji:'&#x1F3E0;'},
  {id:2,name:'이모션 숲',x:180,y:200,color:'#4CAF50',emoji:'&#x1F333;'},
  {id:3,name:'크리스탈 동굴',x:300,y:240,color:'#88CCFF',emoji:'&#x1F48E;'},
  {id:4,name:'구름의 성',x:380,y:140,color:'#C8B8FF',emoji:'&#x1F3F0;'},
  {id:5,name:'어둠의 통로',x:460,y:220,color:'#8B5CF6',emoji:'&#x1F311;'},
  {id:6,name:'트러핑 최종전',x:540,y:120,color:'#FFD700',emoji:'&#x2B50;'}
];

function openWorldMap(){
  if(document.getElementById('mapModal')) return;
  var overlay = document.createElement('div');
  overlay.id = 'mapModal';
  overlay.className = 'modal-overlay show';
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');

  var html = '<div class="modal" style="max-width:440px">';
  html += '<button class="modal-close" id="mapClose" aria-label="닫기">&times;</button>';
  html += '<h3 style="font-size:17px">&#x1F5FA;&#xFE0F; 월드맵</h3>';
  html += '<canvas id="worldMapCanvas" width="620" height="380" style="width:100%;border-radius:14px;background:linear-gradient(180deg,#87CEEB 0%,#98D8C8 50%,#8FBC8F 100%)"></canvas>';
  html += '<div id="mapInfo" style="margin-top:8px;text-align:center;font-size:12px;color:var(--text-sub);min-height:20px">스테이지를 클릭하세요</div></div>';
  overlay.innerHTML = html;
  document.body.appendChild(overlay);

  drawWorldMap();

  var cv = document.getElementById('worldMapCanvas');
  cv.onclick = function(e){
    var rect = cv.getBoundingClientRect();
    var scaleX = 620 / rect.width;
    var scaleY = 380 / rect.height;
    var mx = (e.clientX - rect.left) * scaleX;
    var my = (e.clientY - rect.top) * scaleY;
    STAGES.forEach(function(s){
      var dx = mx - s.x, dy = my - s.y;
      if(dx*dx + dy*dy < 900){
        document.getElementById('mapInfo').innerHTML = '<span style="font-size:16px">'+s.emoji+'</span> <strong>'+s.name+'</strong> (스테이지 '+s.id+')';
        sfxV9('map_select');
        checkAndAwardV9('a_map_explorer');
      }
    });
  };

  document.getElementById('mapClose').onclick = function(){ overlay.remove(); };
  overlay.onclick = function(e){ if(e.target === overlay) overlay.remove(); };
  sfxV9('map_open');
}

function drawWorldMap(){
  var cv = document.getElementById('worldMapCanvas');
  if(!cv) return;
  var ctx = cv.getContext('2d');

  ctx.strokeStyle = 'rgba(139,92,246,.4)';
  ctx.lineWidth = 4;
  ctx.setLineDash([8,6]);
  ctx.beginPath();
  STAGES.forEach(function(s,i){
    if(i === 0) ctx.moveTo(s.x, s.y); else ctx.lineTo(s.x, s.y);
  });
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = 'rgba(255,255,255,.3)';
  for(var i = 0; i < 8; i++){
    ctx.beginPath();
    ctx.arc(60 + i*75, 340 + Math.sin(i)*20, 15 + i%3*5, 0, Math.PI*2);
    ctx.fill();
  }

  STAGES.forEach(function(s){
    ctx.fillStyle = s.color + '44';
    ctx.beginPath(); ctx.arc(s.x, s.y, 28, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = s.color;
    ctx.beginPath(); ctx.arc(s.x, s.y, 20, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
    ctx.font = 'bold 10px -apple-system,sans-serif';
    ctx.fillStyle = '#333'; ctx.textAlign = 'center';
    ctx.fillText(s.name, s.x, s.y + 34);
  });
}


// ============================================================
// 4. ITEM INVENTORY (아이템 인벤토리 15종)
// ============================================================
var ITEMS = [
  {id:'potion_s',name:'작은 포션',desc:'HP 30 회복',rarity:'common',emoji:'&#x1F9EA;',color:'#4CAF50'},
  {id:'potion_l',name:'큰 포션',desc:'HP 80 회복',rarity:'rare',emoji:'&#x1F9EA;',color:'#2196F3'},
  {id:'star_piece',name:'별 조각',desc:'XP 50 획득',rarity:'common',emoji:'&#x2B50;',color:'#FFD54F'},
  {id:'heart_gem',name:'하트 보석',desc:'최대 HP +10',rarity:'rare',emoji:'&#x1F48E;',color:'#E91E63'},
  {id:'shield_scroll',name:'방패 두루마리',desc:'전투 시 방어력 +5',rarity:'common',emoji:'&#x1F4DC;',color:'#795548'},
  {id:'speed_boots',name:'속도의 장화',desc:'이동속도 20% 증가',rarity:'rare',emoji:'&#x1F462;',color:'#FF9800'},
  {id:'love_pendant',name:'사랑의 펜던트',desc:'파트너 스킬 강화',rarity:'epic',emoji:'&#x1F496;',color:'#FF5FA2'},
  {id:'dark_crystal',name:'어둠의 크리스탈',desc:'적 방어력 무시 10%',rarity:'epic',emoji:'&#x1F52E;',color:'#8B5CF6'},
  {id:'golden_crown',name:'황금 왕관',desc:'모든 스탯 +3',rarity:'legendary',emoji:'&#x1F451;',color:'#FFD700'},
  {id:'feather',name:'바람의 깃털',desc:'더블점프 강화',rarity:'common',emoji:'&#x1FAB6;',color:'#90CAF9'},
  {id:'fire_ring',name:'불꽃 반지',desc:'공격 시 화상 효과',rarity:'rare',emoji:'&#x1F48D;',color:'#FF5722'},
  {id:'ice_amulet',name:'얼음 부적',desc:'피격 시 적 둔화',rarity:'rare',emoji:'&#x2744;&#xFE0F;',color:'#00BCD4'},
  {id:'music_box',name:'음악 상자',desc:'배경음악 해금',rarity:'common',emoji:'&#x1F3B5;',color:'#9C27B0'},
  {id:'ancient_map',name:'고대 지도',desc:'숨겨진 스테이지 발견',rarity:'epic',emoji:'&#x1F5FA;&#xFE0F;',color:'#8D6E63'},
  {id:'romi_ribbon',name:'로미의 리본',desc:'전 스탯 +5, 궁극 장비',rarity:'legendary',emoji:'&#x1F380;',color:'#FF4081'}
];

function getInventory(){
  try{ return JSON.parse(localStorage.getItem('hatcuping_inventory') || '{}'); }catch(e){ return {}; }
}
function addItem(id){
  var inv = getInventory();
  inv[id] = (inv[id] || 0) + 1;
  try{ localStorage.setItem('hatcuping_inventory', JSON.stringify(inv)); }catch(e){}
  if(Object.keys(inv).length >= 5) checkAndAwardV9('a_collector_5');
  if(Object.keys(inv).length >= 15) checkAndAwardV9('a_collector_all');
}

function openInventory(){
  if(document.getElementById('invModal')) return;
  var overlay = document.createElement('div');
  overlay.id = 'invModal';
  overlay.className = 'modal-overlay show';
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');

  var inv = getInventory();
  var totalTypes = Object.keys(inv).length;

  var html = '<div class="modal" style="max-width:420px;max-height:85vh;overflow-y:auto">';
  html += '<button class="modal-close" id="invClose" aria-label="닫기">&times;</button>';
  html += '<h3 style="font-size:17px">&#x1F392; 아이템 인벤토리</h3>';
  html += '<div style="font-size:12px;color:var(--text-sub);margin-bottom:12px">수집: '+totalTypes+'/'+ITEMS.length+'종</div>';

  html += '<div style="display:flex;gap:4px;margin-bottom:12px;flex-wrap:wrap">';
  var rarityLabels = {all:'전체',common:'일반',rare:'레어',epic:'에픽',legendary:'전설'};
  var rarityColors = {all:'var(--pink)',common:'#4CAF50',rare:'#2196F3',epic:'#8B5CF6',legendary:'#FFD700'};
  ['all','common','rare','epic','legendary'].forEach(function(r){
    html += '<button class="inv-filter" data-rarity="'+r+'" style="padding:3px 8px;border-radius:10px;border:1px solid '+rarityColors[r]+'44;background:'+(r==='all'?rarityColors[r]+'22':'transparent')+';color:'+rarityColors[r]+';font-size:10px;font-weight:700;cursor:pointer">'+rarityLabels[r]+'</button>';
  });
  html += '</div><div id="invList">';

  ITEMS.forEach(function(item){
    var count = inv[item.id] || 0;
    var rLabel = {common:'일반',rare:'레어',epic:'에픽',legendary:'전설'}[item.rarity];
    html += '<div class="inv-item" data-rarity="'+item.rarity+'" style="display:flex;gap:10px;padding:8px;margin-bottom:4px;border-radius:12px;background:rgba(0,0,0,.02);opacity:'+(count>0?'1':'.35')+'">';
    html += '<div style="width:36px;height:36px;border-radius:10px;background:'+item.color+'15;display:flex;align-items:center;justify-content:center;font-size:18px">'+(count>0?item.emoji:'&#x1F512;')+'</div>';
    html += '<div style="flex:1"><div style="display:flex;align-items:center;gap:4px">';
    html += '<span style="font-size:12px;font-weight:700">'+(count>0?item.name:'???')+'</span>';
    html += '<span style="font-size:9px;padding:1px 5px;border-radius:6px;background:'+item.color+'15;color:'+item.color+';font-weight:600">'+rLabel+'</span>';
    if(count>0) html += '<span style="font-size:9px;color:var(--text-sub);margin-left:auto">x'+count+'</span>';
    html += '</div>';
    if(count>0) html += '<div style="font-size:10px;color:var(--text-sub)">'+item.desc+'</div>';
    html += '</div></div>';
  });
  html += '</div></div>';
  overlay.innerHTML = html;
  document.body.appendChild(overlay);

  document.getElementById('invClose').onclick = function(){ overlay.remove(); };
  overlay.onclick = function(e){ if(e.target === overlay) overlay.remove(); };

  document.querySelectorAll('.inv-filter').forEach(function(btn){
    btn.onclick = function(){
      var r = btn.dataset.rarity;
      document.querySelectorAll('.inv-item').forEach(function(item){
        item.style.display = (r === 'all' || item.dataset.rarity === r) ? 'flex' : 'none';
      });
      document.querySelectorAll('.inv-filter').forEach(function(b){ b.style.background = 'transparent'; });
      btn.style.background = rarityColors[r] + '22';
      sfxV9('inv_filter');
    };
  });
  sfxV9('inv_open');
}

(function(){
  var inv = getInventory();
  if(!inv.potion_s){ addItem('potion_s'); addItem('potion_s'); addItem('star_piece'); }
})();


// ============================================================
// 5. PUZZLE MINI-GAME (3x3 슬라이드 퍼즐)
// ============================================================
var puzzleTiles = [];

function openPuzzleGame(){
  if(document.getElementById('puzzleModal')) return;
  var overlay = document.createElement('div');
  overlay.id = 'puzzleModal';
  overlay.className = 'modal-overlay show';
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');

  puzzleTiles = [1,2,3,4,5,6,7,8,0];
  for(var i = 0; i < 200; i++){
    var emptyIdx = puzzleTiles.indexOf(0);
    var moves = getPuzzleMoves(emptyIdx);
    var pick = moves[Math.floor(Math.random()*moves.length)];
    puzzleTiles[emptyIdx] = puzzleTiles[pick];
    puzzleTiles[pick] = 0;
  }

  var moveCount = 0;
  var emojis = ['','&#x1F496;','&#x1F31F;','&#x1F98B;','&#x1F338;','&#x2728;','&#x1F3B5;','&#x1F308;','&#x1F48E;'];

  var html = '<div class="modal" style="max-width:340px;text-align:center">';
  html += '<button class="modal-close" id="puzzleClose" aria-label="닫기">&times;</button>';
  html += '<h3 style="font-size:17px">&#x1F9E9; 슬라이드 퍼즐</h3>';
  html += '<div style="font-size:12px;color:var(--text-sub);margin-bottom:10px">숫자를 순서대로 맞추세요! 이동: <span id="puzzleMoves">0</span>회</div>';
  html += '<div id="puzzleGrid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px;max-width:240px;margin:0 auto"></div>';
  html += '<div id="puzzleResult" style="margin-top:10px;font-size:13px;font-weight:700;color:var(--pink);min-height:20px"></div></div>';
  overlay.innerHTML = html;
  document.body.appendChild(overlay);

  function renderPuzzle(){
    var grid = document.getElementById('puzzleGrid');
    grid.innerHTML = puzzleTiles.map(function(t,i){
      if(t === 0) return '<div style="width:72px;height:72px"></div>';
      return '<div class="puzzle-tile" data-idx="'+i+'" style="width:72px;height:72px;border-radius:14px;background:linear-gradient(135deg,var(--pink),var(--purple));display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;transition:all .15s;color:#fff;font-weight:800;user-select:none"><span style="font-size:20px">'+emojis[t]+'</span><span style="font-size:14px">'+t+'</span></div>';
    }).join('');

    document.querySelectorAll('.puzzle-tile').forEach(function(tile){
      tile.onclick = function(){
        var idx = parseInt(tile.dataset.idx);
        var empty = puzzleTiles.indexOf(0);
        if(getPuzzleMoves(empty).indexOf(idx) !== -1){
          puzzleTiles[empty] = puzzleTiles[idx];
          puzzleTiles[idx] = 0;
          moveCount++;
          document.getElementById('puzzleMoves').textContent = moveCount;
          sfxV9('puzzle_move');
          renderPuzzle();
          if(isPuzzleSolved()){
            document.getElementById('puzzleResult').textContent = '&#x1F389; '+moveCount+'회만에 완성!';
            sfxV9('puzzle_win');
            checkAndAwardV9('a_puzzle_clear');
            if(moveCount <= 30) checkAndAwardV9('a_puzzle_master');
            var bonus = Math.max(10, 50 - moveCount);
            setXP(getXP() + bonus);
            showToastV9('&#x1F9E9; 퍼즐 완성! +'+bonus+' XP');
          }
        }
      };
    });
  }
  renderPuzzle();
  document.getElementById('puzzleClose').onclick = function(){ overlay.remove(); };
  overlay.onclick = function(e){ if(e.target === overlay) overlay.remove(); };
  sfxV9('puzzle_open');
}

function getPuzzleMoves(emptyIdx){
  var moves = [];
  var row = Math.floor(emptyIdx/3), col = emptyIdx%3;
  if(row > 0) moves.push(emptyIdx - 3);
  if(row < 2) moves.push(emptyIdx + 3);
  if(col > 0) moves.push(emptyIdx - 1);
  if(col < 2) moves.push(emptyIdx + 1);
  return moves;
}

function isPuzzleSolved(){
  return [1,2,3,4,5,6,7,8,0].every(function(v,i){ return puzzleTiles[i] === v; });
}


// ============================================================
// 6. HATCUPING QUIZ (세계관 퀴즈 15문)
// ============================================================
var QUIZ_QUESTIONS = [
  {q:'하츄핑은 어떤 감정의 티니핑인가요?',a:['사랑','용기','우정','행복'],c:0},
  {q:'로미의 가장 소중한 친구는?',a:['바로핑','차차핑','하츄핑','라라핑'],c:2},
  {q:'트러핑의 속성은?',a:['빛','사랑','어둠','얼음'],c:2},
  {q:'꽁꽁핑의 역할은?',a:['딜러','힐러','탱커','서포터'],c:2},
  {q:'라라핑이 사랑하는 것은?',a:['음식','음악','독서','운동'],c:1},
  {q:'이모션 왕국에서 감정을 다루는 존재는?',a:['요정','마법사','티니핑','드래곤'],c:2},
  {q:'바로핑의 특기는?',a:['힐링','방어','정의의 방패','연속 공격'],c:2},
  {q:'해킹의 역할은?',a:['가이드','힐러','파트너','빌런'],c:3},
  {q:'차차핑의 성격은?',a:['활발함','차분하고 지혜로움','용감함','장난스러움'],c:1},
  {q:'하츄핑의 필살기 이름은?',a:['스틱 콤보','다크 스톰','하트 어택','가이드 라이트'],c:2},
  {q:'부끄핑은 어떤 성격인가요?',a:['용감','활발','수줍음이 많은','냉정한'],c:2},
  {q:'스틱핑의 전투 스타일은?',a:['느린 강공격','빠른 연속 공격','원거리 마법','회복 특화'],c:1},
  {q:'리암은 로미에게 어떤 존재인가요?',a:['형제','스승','라이벌이자 친구','적'],c:2},
  {q:'몬주의 역할은?',a:['전투 특화','이모션 왕국의 안내자','보스','적'],c:1},
  {q:'이 게임의 장르 조합은?',a:['FPS+레이싱','플랫포머+RPG','퍼즐+시뮬레이션','스포츠+음악'],c:1}
];

function openQuiz(){
  if(document.getElementById('quizModal')) return;
  var overlay = document.createElement('div');
  overlay.id = 'quizModal';
  overlay.className = 'modal-overlay show';
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');

  var qIdx = 0, score = 0, total = QUIZ_QUESTIONS.length;

  function renderQuestion(){
    var q = QUIZ_QUESTIONS[qIdx];
    var html = '<div class="modal" style="max-width:400px">';
    html += '<button class="modal-close" id="quizClose" aria-label="닫기">&times;</button>';
    html += '<h3 style="font-size:17px">&#x1F4DA; 하츄핑 퀴즈</h3>';
    html += '<div style="font-size:11px;color:var(--text-sub);margin-bottom:8px">'+(qIdx+1)+'/'+total+' | &#x2705; '+score+'점</div>';
    html += '<div style="width:100%;height:6px;background:rgba(0,0,0,.06);border-radius:3px;margin-bottom:12px;overflow:hidden"><div style="height:100%;width:'+((qIdx)/total*100)+'%;background:linear-gradient(90deg,var(--pink),var(--purple));border-radius:3px;transition:width .3s"></div></div>';
    html += '<div style="font-size:14px;font-weight:700;margin-bottom:12px;line-height:1.5">Q'+(qIdx+1)+'. '+q.q+'</div>';
    q.a.forEach(function(a,i){
      html += '<button class="quiz-ans" data-idx="'+i+'" style="display:block;width:100%;padding:10px 14px;margin-bottom:6px;border-radius:12px;border:1px solid var(--border);background:var(--card-bg);cursor:pointer;font-size:13px;font-weight:600;text-align:left;transition:all .2s;color:var(--text)">'+String.fromCharCode(9312+i)+' '+a+'</button>';
    });
    html += '</div>';
    overlay.innerHTML = html;

    document.getElementById('quizClose').onclick = function(){ overlay.remove(); };
    overlay.onclick = function(e){ if(e.target === overlay) overlay.remove(); };

    document.querySelectorAll('.quiz-ans').forEach(function(btn){
      btn.onclick = function(){
        var chosen = parseInt(btn.dataset.idx);
        var correct = chosen === q.c;
        if(correct){
          score++;
          btn.style.background = 'rgba(76,175,80,.15)';
          btn.style.borderColor = '#4CAF50';
          btn.style.color = '#4CAF50';
          sfxV9('quiz_correct');
        } else {
          btn.style.background = 'rgba(244,67,54,.1)';
          btn.style.borderColor = '#F44336';
          btn.style.color = '#F44336';
          document.querySelectorAll('.quiz-ans')[q.c].style.background = 'rgba(76,175,80,.15)';
          document.querySelectorAll('.quiz-ans')[q.c].style.borderColor = '#4CAF50';
          sfxV9('quiz_wrong');
        }
        document.querySelectorAll('.quiz-ans').forEach(function(b){ b.style.pointerEvents = 'none'; });
        setTimeout(function(){
          qIdx++;
          if(qIdx < total) renderQuestion();
          else showQuizResult();
        }, 800);
      };
    });
  }

  function showQuizResult(){
    var pct = Math.round(score/total*100);
    var grade = pct >= 90 ? 'S' : pct >= 80 ? 'A' : pct >= 60 ? 'B' : pct >= 40 ? 'C' : 'D';
    var gradeColor = {S:'#FFD700',A:'#4CAF50',B:'#2196F3',C:'#FF9800',D:'#F44336'}[grade];
    var xpReward = score * 5;
    setXP(getXP() + xpReward);

    var html = '<div class="modal" style="max-width:360px;text-align:center">';
    html += '<button class="modal-close" id="quizClose2" aria-label="닫기">&times;</button>';
    html += '<h3 style="font-size:17px">&#x1F4DA; 퀴즈 결과</h3>';
    html += '<div style="font-size:60px;margin:12px 0;font-weight:900;color:'+gradeColor+'">'+grade+'</div>';
    html += '<div style="font-size:16px;font-weight:700;margin-bottom:4px">'+score+'/'+total+' ('+pct+'%)</div>';
    html += '<div style="font-size:12px;color:var(--text-sub);margin-bottom:12px">+'+xpReward+' XP</div>';
    html += '<button id="quizDone" style="width:100%;padding:10px;background:linear-gradient(135deg,var(--pink),var(--purple));color:#fff;border:none;border-radius:14px;font-size:13px;font-weight:700;cursor:pointer">확인</button>';
    html += '</div>';
    overlay.innerHTML = html;
    document.getElementById('quizClose2').onclick = function(){ overlay.remove(); };
    document.getElementById('quizDone').onclick = function(){ overlay.remove(); };
    overlay.onclick = function(e){ if(e.target === overlay) overlay.remove(); };

    if(pct >= 60) checkAndAwardV9('a_quiz_pass');
    sfxV9('quiz_result');
  }

  renderQuestion();
  sfxV9('quiz_open');
}


// ============================================================
// 7. DAILY REWARDS (일일 보상 7일)
// ============================================================
var DAILY_REWARDS = [
  {day:1,reward:'포션 x2',xp:20,items:['potion_s','potion_s'],emoji:'&#x1F9EA;'},
  {day:2,reward:'별 조각 x1',xp:30,items:['star_piece'],emoji:'&#x2B50;'},
  {day:3,reward:'XP 50',xp:50,items:[],emoji:'&#x1F4B0;'},
  {day:4,reward:'방패 두루마리',xp:30,items:['shield_scroll'],emoji:'&#x1F4DC;'},
  {day:5,reward:'하트 보석',xp:40,items:['heart_gem'],emoji:'&#x1F48E;'},
  {day:6,reward:'XP 100',xp:100,items:[],emoji:'&#x1F4B0;'},
  {day:7,reward:'사랑의 펜던트!',xp:150,items:['love_pendant'],emoji:'&#x1F496;'}
];

function getDailyRewardData(){
  try{ return JSON.parse(localStorage.getItem('hatcuping_daily_reward') || '{"lastClaim":"","streak":0}'); }catch(e){ return {lastClaim:'',streak:0}; }
}

function openDailyRewards(){
  if(document.getElementById('rewardModal')) return;
  var overlay = document.createElement('div');
  overlay.id = 'rewardModal';
  overlay.className = 'modal-overlay show';
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');

  var data = getDailyRewardData();
  var today = new Date().toISOString().slice(0,10);
  var canClaim = data.lastClaim !== today;
  var currentDay = ((data.streak) % 7);

  var html = '<div class="modal" style="max-width:400px">';
  html += '<button class="modal-close" id="rewardClose" aria-label="닫기">&times;</button>';
  html += '<h3 style="font-size:17px">&#x1F381; 일일 보상</h3>';
  html += '<div style="font-size:12px;color:var(--text-sub);margin-bottom:12px">매일 방문하면 보상을 받을 수 있어요! 연속: '+data.streak+'일</div>';

  html += '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin-bottom:12px">';
  DAILY_REWARDS.forEach(function(r,i){
    var isCurrent = i === currentDay && canClaim;
    var isPast = i < currentDay || !canClaim;
    html += '<div style="text-align:center;padding:6px 2px;border-radius:12px;background:'+(isCurrent?'rgba(255,215,0,.15)':isPast?'rgba(76,175,80,.06)':'rgba(0,0,0,.02)')+';border:2px solid '+(isCurrent?'#FFD700':isPast?'rgba(76,175,80,.2)':'transparent')+'">';
    html += '<div style="font-size:9px;font-weight:700;color:'+(isPast?'#4CAF50':'var(--text-sub)')+'">Day '+(i+1)+'</div>';
    html += '<div style="font-size:18px;margin:2px 0">'+(isPast?'&#x2705;':r.emoji)+'</div>';
    html += '<div style="font-size:8px;color:var(--text-sub)">'+r.xp+' XP</div></div>';
  });
  html += '</div>';

  if(canClaim){
    var reward = DAILY_REWARDS[currentDay];
    html += '<div style="text-align:center;padding:12px;background:rgba(255,215,0,.08);border-radius:14px;margin-bottom:8px">';
    html += '<div style="font-size:13px;font-weight:700;color:#D4940A">&#x1F381; Day '+(currentDay+1)+' 보상: '+reward.reward+'</div>';
    html += '<div style="font-size:11px;color:var(--text-sub)">+'+reward.xp+' XP</div></div>';
    html += '<button id="claimReward" style="width:100%;padding:10px;background:linear-gradient(135deg,#FFD700,#FFA000);color:#fff;border:none;border-radius:14px;font-size:14px;font-weight:700;cursor:pointer;animation:badgePulse 1.5s ease-in-out infinite">보상 받기!</button>';
  } else {
    html += '<div style="text-align:center;padding:12px;background:rgba(76,175,80,.06);border-radius:14px">';
    html += '<div style="font-size:13px;font-weight:700;color:#4CAF50">&#x2705; 오늘 보상을 받았습니다!</div>';
    html += '<div style="font-size:11px;color:var(--text-sub)">내일 다시 방문해주세요</div></div>';
  }
  html += '</div>';
  overlay.innerHTML = html;
  document.body.appendChild(overlay);

  document.getElementById('rewardClose').onclick = function(){ overlay.remove(); };
  overlay.onclick = function(e){ if(e.target === overlay) overlay.remove(); };

  if(canClaim){
    document.getElementById('claimReward').onclick = function(){
      var reward = DAILY_REWARDS[currentDay];
      var yesterday = new Date(Date.now() - 86400000).toISOString().slice(0,10);
      var newStreak = data.lastClaim === yesterday ? data.streak + 1 : 1;
      try{ localStorage.setItem('hatcuping_daily_reward', JSON.stringify({lastClaim:today,streak:newStreak})); }catch(e){}
      setXP(getXP() + reward.xp);
      reward.items.forEach(function(itemId){ addItem(itemId); });
      sfxV9('reward_claim');
      showToastV9('&#x1F381; Day '+(currentDay+1)+' 보상 수령! +'+reward.xp+' XP');
      if(newStreak >= 7) checkAndAwardV9('a_daily_reward_7');
      overlay.remove();
    };
  }
  sfxV9('reward_open');
}


// ============================================================
// 8. NEW ACHIEVEMENTS (+12, total 46)
// ============================================================
var V9_ACHIEVEMENTS = [
  {id:'a_boss_arena',name:'첫 보스 격파',desc:'보스 배틀에서 처음 승리',cat:'general',icon:'&#x2694;&#xFE0F;'},
  {id:'a_boss_final',name:'최종 보스 격파',desc:'트러핑 최종전 승리',cat:'general',icon:'&#x1F47E;'},
  {id:'a_skill_6',name:'스킬 수집가',desc:'스킬 6개 이상 해금',cat:'general',icon:'&#x1F333;'},
  {id:'a_skill_master',name:'스킬 마스터',desc:'스킬 12개 전부 해금',cat:'general',icon:'&#x1F4AB;'},
  {id:'a_map_explorer',name:'월드맵 탐험가',desc:'월드맵 열어보기',cat:'general',icon:'&#x1F5FA;&#xFE0F;'},
  {id:'a_collector_5',name:'아이템 수집가',desc:'아이템 5종 이상 수집',cat:'general',icon:'&#x1F392;'},
  {id:'a_collector_all',name:'아이템 마스터',desc:'아이템 15종 전부 수집',cat:'general',icon:'&#x1F48E;'},
  {id:'a_puzzle_clear',name:'퍼즐 클리어',desc:'슬라이드 퍼즐 완성',cat:'general',icon:'&#x1F9E9;'},
  {id:'a_puzzle_master',name:'퍼즐 달인',desc:'30회 이내로 퍼즐 완성',cat:'general',icon:'&#x1F3C5;'},
  {id:'a_quiz_pass',name:'퀴즈 합격',desc:'세계관 퀴즈 60% 이상',cat:'general',icon:'&#x1F4DA;'},
  {id:'a_daily_reward_7',name:'7일 보상 달성',desc:'일일 보상 7일 연속 수령',cat:'general',icon:'&#x1F381;'},
  {id:'a_xp_500',name:'XP 부자',desc:'총 XP 500 이상 달성',cat:'general',icon:'&#x1F4B0;'}
];

function injectV9Achievements(){
  if(!window.AD) return;
  V9_ACHIEVEMENTS.forEach(function(a){
    if(!window.AD.find(function(x){ return x.id === a.id; })){
      window.AD.push(a);
    }
  });
}

function checkAndAwardV9(id){
  if(!window.saveAchievement) return;
  if(window.saveAchievement(id)){
    var def = window.AD ? window.AD.find(function(a){ return a.id === id; }) : null;
    if(!def) def = V9_ACHIEVEMENTS.find(function(a){ return a.id === id; });
    if(def && window.showAchieveToast) window.showAchieveToast(def.name);
    if(window.updateAchieveCount) window.updateAchieveCount();
  }
}


// ============================================================
// 9. SOUND EFFECTS (SFX 6종)
// ============================================================
var sfxCtxV9 = null;
function sfxV9(type){
  if(window.UISfx && window.UISfx.isMuted()) return;
  if(!sfxCtxV9) try{ sfxCtxV9 = new (window.AudioContext || window.webkitAudioContext)(); }catch(e){ return; }
  if(sfxCtxV9.state === 'suspended') sfxCtxV9.resume();
  var t = sfxCtxV9.currentTime;
  function osc(freq, dur, vol, waveType, delay){
    try{
      var o = sfxCtxV9.createOscillator(), g = sfxCtxV9.createGain();
      o.type = waveType || 'sine'; o.frequency.value = freq;
      g.gain.setValueAtTime(vol || 0.1, t + (delay||0));
      g.gain.exponentialRampToValueAtTime(0.001, t + (delay||0) + dur);
      o.connect(g); g.connect(sfxCtxV9.destination);
      o.start(t + (delay||0)); o.stop(t + (delay||0) + dur);
    }catch(e){}
  }
  var map = {
    boss_select: function(){ osc(440,.08,.08,'triangle'); osc(660,.08,.06,'triangle',.06); },
    boss_attack: function(){ osc(220,.06,.1,'sawtooth'); osc(180,.08,.08,'sawtooth',.04); },
    boss_skill: function(){ [880,1100,1320].forEach(function(f,i){ osc(f,.06,.08,'triangle',i*.04); }); },
    boss_heal: function(){ osc(523,.1,.08,'sine'); osc(659,.1,.06,'sine',.08); },
    boss_guard: function(){ osc(330,.12,.06,'square'); },
    boss_victory: function(){ [523,659,784,1047,1319].forEach(function(f,i){ osc(f,.1,.1,'triangle',i*.08); }); },
    skill_open: function(){ osc(600,.06,.06,'sine'); osc(900,.06,.05,'sine',.04); },
    skill_unlock: function(){ [523,784,1047].forEach(function(f,i){ osc(f,.08,.08,'triangle',i*.06); }); },
    map_open: function(){ osc(392,.08,.07,'sine'); osc(523,.08,.06,'sine',.06); },
    map_select: function(){ osc(880,.04,.06,'sine'); },
    inv_open: function(){ osc(659,.06,.06,'sine'); osc(880,.06,.05,'sine',.04); },
    inv_filter: function(){ osc(800,.03,.05,'sine'); },
    puzzle_open: function(){ osc(523,.06,.06,'triangle'); osc(659,.06,.05,'triangle',.05); },
    puzzle_move: function(){ osc(700,.03,.06,'sine'); },
    puzzle_win: function(){ [523,659,784,1047].forEach(function(f,i){ osc(f,.1,.08,'triangle',i*.07); }); },
    quiz_open: function(){ osc(440,.06,.06,'sine'); osc(660,.06,.05,'sine',.05); },
    quiz_correct: function(){ osc(659,.06,.08,'triangle'); osc(880,.08,.08,'triangle',.05); },
    quiz_wrong: function(){ osc(220,.12,.08,'sawtooth'); },
    quiz_result: function(){ [523,659,784,880].forEach(function(f,i){ osc(f,.08,.07,'triangle',i*.06); }); },
    reward_open: function(){ osc(523,.06,.06,'sine'); osc(784,.06,.05,'sine',.05); },
    reward_claim: function(){ [659,784,1047,1319].forEach(function(f,i){ osc(f,.08,.1,'triangle',i*.06); }); }
  };
  if(map[type]) map[type]();
}


// ============================================================
// 10. UI INJECTION + KEYBOARD SHORTCUTS + TOAST
// ============================================================
function showToastV9(msg){
  var t = document.getElementById('achieveToast');
  if(t){ t.innerHTML = msg; t.classList.add('show'); setTimeout(function(){ t.classList.remove('show'); }, 2500); }
}

function injectV9QuickActions(){
  var topBar = document.querySelector('.top-bar');
  if(!topBar) return;

  var btns = [
    {id:'bossBtn',label:'보스 배틀',icon:'&#x2694;&#xFE0F;',title:'보스 (B)',action:openBossArena},
    {id:'skillBtn',label:'스킬 트리',icon:'&#x1F333;',title:'스킬 (K)',action:openSkillTree},
    {id:'mapBtn',label:'월드맵',icon:'&#x1F5FA;&#xFE0F;',title:'월드맵 (W)',action:openWorldMap},
    {id:'invBtn',label:'인벤토리',icon:'&#x1F392;',title:'인벤토리 (I)',action:openInventory},
    {id:'puzzleBtn2',label:'퍼즐',icon:'&#x1F9E9;',title:'퍼즐 (Z)',action:openPuzzleGame},
    {id:'quizBtn',label:'퀴즈',icon:'&#x1F4DA;',title:'퀴즈 (Q)',action:openQuiz},
    {id:'rewardBtn',label:'보상',icon:'&#x1F381;',title:'일일 보상 (R)',action:openDailyRewards}
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

function injectV9Keyboard(){
  document.addEventListener('keydown', function(e){
    if(e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if(document.querySelector('.modal-overlay.show')) return;

    var key = e.key.toLowerCase();
    if(key === 'b' && !e.ctrlKey && !e.metaKey){ e.preventDefault(); openBossArena(); }
    else if(key === 'k' && !e.ctrlKey && !e.metaKey){ e.preventDefault(); openSkillTree(); }
    else if(key === 'w' && !e.ctrlKey && !e.metaKey){ e.preventDefault(); openWorldMap(); }
    else if(key === 'i' && !e.ctrlKey && !e.metaKey){ e.preventDefault(); openInventory(); }
    else if(key === 'z' && !e.ctrlKey && !e.metaKey){ e.preventDefault(); openPuzzleGame(); }
    else if(key === 'q' && !e.ctrlKey && !e.metaKey){ e.preventDefault(); openQuiz(); }
    else if(key === 'r' && !e.ctrlKey && !e.metaKey){ e.preventDefault(); openDailyRewards(); }
  });
}

function updateV9KeyboardHelp(){
  var kbHelp = document.querySelector('#kbHelp .modal');
  if(!kbHelp) return;
  var newRows = [
    ['보스 배틀','B'],['스킬 트리','K'],['월드맵','W'],['인벤토리','I'],['퍼즐','Z'],['퀴즈','Q'],['일일 보상','R']
  ];
  newRows.forEach(function(r){
    var row = document.createElement('div');
    row.className = 'kb-help-row';
    row.innerHTML = '<span>' + r[0] + '</span><span class="kb-help-key">' + r[1] + '</span>';
    kbHelp.appendChild(row);
  });
}

function updateV9Footer(){
  var ver = document.querySelector('.footer .version');
  if(ver) ver.textContent = 'v9.0 | © PRIME Holdings NEXTERA+PRISM';

  var links = document.querySelector('.footer-links');
  if(links) links.innerHTML = '<span class="footer-link">4종 게임</span><span class="footer-link">46개 업적</span><span class="footer-link">15종 아이템</span><span class="footer-link">12종 스킬</span>';
}

function updateV9News(){
  var newsSection = document.querySelector('.news-section');
  if(!newsSection) return;
  var firstItem = newsSection.querySelector('.news-item');
  if(!firstItem) return;
  var newItem = document.createElement('div');
  newItem.className = 'news-item';
  newItem.innerHTML = '<span class="news-date">v9.0</span><span class="news-text">보스배틀 아레나 4종, 스킬트리 12종, 월드맵, 아이템인벤토리 15종, 퍼즐미니게임, 세계관퀴즈 15문, 일일보상 7일</span>';
  firstItem.parentNode.insertBefore(newItem, firstItem);
}

function updateV9AchieveCount(){
  var el = document.getElementById('achieveCount');
  if(el){
    var c = 0;
    try{ c = Object.keys(JSON.parse(localStorage.getItem('hatcuping_achievements') || '{}')).length; }catch(e){}
    var t = window.AD ? window.AD.length : 46;
    el.textContent = c + '/' + t;
  }
}

function updateV9Meta(){
  var descMeta = document.querySelector('meta[name="description"]');
  if(descMeta) descMeta.content = '사랑의 하츄핑 v9.0 - 플랫포머 액션, 턴제 RPG, 오픈월드, UNIFIED 4종 게임. 업적 46개, 보스배틀 4종, 스킬트리 12종, 아이템 15종, 퍼즐, 퀀즈!';
  document.title = '사랑의 하츄핑 v9.0 - 게임 선택';
}

function grantInitialXP(){
  if(getXP() > 0) return;
  try{
    var stats = JSON.parse(localStorage.getItem('hatcuping_stats') || '{}');
    var baseXP = 0;
    baseXP += Math.min((stats.clears || 0) * 20, 200);
    baseXP += Math.min(Math.floor((stats.playTime || 0) / 60), 100);
    var achieves = Object.keys(JSON.parse(localStorage.getItem('hatcuping_achievements') || '{}'));
    baseXP += achieves.length * 10;
    if(baseXP > 0) setXP(baseXP);
  }catch(e){}
}


// ============================================================
// BOOT
// ============================================================
function bootV9(){
  injectV9Achievements();
  grantInitialXP();
  injectV9QuickActions();
  injectV9Keyboard();
  updateV9KeyboardHelp();
  updateV9Footer();
  updateV9News();
  updateV9AchieveCount();
  updateV9Meta();
}

if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', bootV9);
} else {
  bootV9();
}

})();

// hatcuping-game v15_patch.js - NEXTERA+PRISM AUTO v15.0
// Self-contained patch module (1200+ lines, 50+ functions)
(function(){
'use strict';

// ============================================================
// SFX ENGINE (12 sound types)
// ============================================================
var _v15Ctx = null;
function _v15InitAudio(){
  if(!_v15Ctx){
    try{ _v15Ctx = new (window.AudioContext || window.webkitAudioContext)(); }catch(e){}
  }
  if(_v15Ctx && _v15Ctx.state === 'suspended') _v15Ctx.resume();
}

var V15_SFX = {
  transform_start:{f:880,d:.1,t:'triangle'},
  transform_end:{f:1320,d:.15,t:'sine'},
  arena_bell:{f:660,d:.08,t:'square'},
  arena_hit:{f:440,d:.05,t:'sawtooth'},
  arena_win:{f:1047,d:.2,t:'triangle'},
  cave_enter:{f:330,d:.12,t:'sine'},
  cave_discover:{f:990,d:.1,t:'triangle'},
  band_play:{f:784,d:.08,t:'sine'},
  band_complete:{f:1175,d:.15,t:'triangle'},
  recipe_mix:{f:550,d:.06,t:'sine'},
  recipe_success:{f:1100,d:.12,t:'triangle'},
  friendship_up:{f:740,d:.1,t:'sine'}
};

function sfxV15(type){
  _v15InitAudio();
  if(!_v15Ctx) return;
  var s = V15_SFX[type];
  if(!s) return;
  try{
    var muted = false;
    try{ muted = localStorage.getItem('hatcuping_mute') === '1'; }catch(e){}
    if(muted) return;
    var osc = _v15Ctx.createOscillator();
    var gain = _v15Ctx.createGain();
    osc.type = s.t || 'sine';
    osc.frequency.value = s.f;
    gain.gain.value = 0.08;
    osc.connect(gain);
    gain.connect(_v15Ctx.destination);
    osc.start();
    osc.stop(_v15Ctx.currentTime + (s.d || 0.06));
  }catch(e){}
}

function sfxV15Multi(types, interval){
  types.forEach(function(t, i){
    setTimeout(function(){ sfxV15(t); }, (interval || 80) * i);
  });
}


// ============================================================
// UTILITY FUNCTIONS
// ============================================================
function trackV15Feature(id){
  try{
    var saved = JSON.parse(localStorage.getItem('hatcuping_v15_features') || '[]');
    if(saved.indexOf(id) === -1){ saved.push(id); localStorage.setItem('hatcuping_v15_features', JSON.stringify(saved)); }
  }catch(e){}
}

function showToastV15(msg){
  var t = document.getElementById('achieveToast');
  if(t){ t.innerHTML = msg; t.classList.add('show'); setTimeout(function(){ t.classList.remove('show'); }, 2500); }
}

function v15Load(key, fallback){
  try{ var d = JSON.parse(localStorage.getItem('hatcuping_v15_' + key)); return d !== null ? d : fallback; }catch(e){ return fallback; }
}

function v15Save(key, data){
  try{ localStorage.setItem('hatcuping_v15_' + key, JSON.stringify(data)); }catch(e){}
}

function todayStrV15(){
  var d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}

function createV15Modal(id, title, emoji, contentHTML){
  var existing = document.getElementById(id);
  if(existing) existing.remove();
  var ov = document.createElement('div');
  ov.className = 'modal-overlay';
  ov.id = id;
  ov.setAttribute('role','dialog');
  ov.setAttribute('aria-modal','true');
  ov.setAttribute('aria-label', title);
  ov.innerHTML = '<div class="modal"><button class="modal-close" aria-label="닫기">&times;</button><h3>' + emoji + ' ' + title + '</h3><div class="v15-modal-body">' + contentHTML + '</div></div>';
  document.body.appendChild(ov);
  ov.querySelector('.modal-close').addEventListener('click', function(){ ov.classList.remove('show'); });
  ov.addEventListener('click', function(e){ if(e.target === ov) ov.classList.remove('show'); });
  return ov;
}


// ============================================================
// 1. FAIRY TRANSFORMATION SYSTEM (요정변신시스템)
// Like Mario's power-up suits - 8 transformations with unique abilities
// ============================================================
var V15_TRANSFORMS = [
  {id:'flame_fairy',name:'불꽃요정',desc:'화염의 힘으로 적을 불태워요! 공격력 +50%',emoji:'🔥',color:'#FF4500',stat:'attack',bonus:50,unlock:'레벨 5 달성'},
  {id:'ice_fairy',name:'얼음요정',desc:'냉기로 적을 얼려요! 방어력 +40%',emoji:'❄️',color:'#00BFFF',stat:'defense',bonus:40,unlock:'보스 3회 처치'},
  {id:'wind_fairy',name:'바람요정',desc:'바람처럼 빨라져요! 속도 +60%',emoji:'🌪️',color:'#32CD32',stat:'speed',bonus:60,unlock:'스피드런 달성'},
  {id:'star_fairy',name:'별빛요정',desc:'별의 축복! HP 회복 +30%',emoji:'⭐',color:'#FFD700',stat:'heal',bonus:30,unlock:'스타 10개 수집'},
  {id:'shadow_fairy',name:'그림자요정',desc:'은신 능력! 회피 +45%',emoji:'🌑',color:'#4B0082',stat:'dodge',bonus:45,unlock:'노데스 3스테이지'},
  {id:'flower_fairy',name:'꽃잎요정',desc:'자연의 치유! 독 면역',emoji:'🌸',color:'#FF69B4',stat:'immunity',bonus:100,unlock:'동반자 4종 획득'},
  {id:'thunder_fairy',name:'천둥요정',desc:'번개 공격! 크리티컬 +35%',emoji:'⚡',color:'#FF8C00',stat:'critical',bonus:35,unlock:'콤보 20회'},
  {id:'rainbow_fairy',name:'무지개요정',desc:'모든 능력 +20% 만능!',emoji:'🌈',color:'#9370DB',stat:'all',bonus:20,unlock:'7종 변신 마스터'}
];

function buildTransformSystem(){
  var unlocked = v15Load('transforms', []);
  var active = v15Load('active_transform', null);
  var html = '<div style="font-size:12px;color:var(--text-sub);margin-bottom:12px;line-height:1.5">마리오처럼 변신! 조건을 달성하면 요정 변신을 해금하고 전투에 활용하세요.</div>';
  html += '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px">';
  V15_TRANSFORMS.forEach(function(tf){
    var isUnlocked = unlocked.indexOf(tf.id) !== -1;
    var isActive = active === tf.id;
    html += '<div style="padding:12px;border-radius:14px;background:'+(isUnlocked ? 'linear-gradient(135deg,'+tf.color+'15,'+tf.color+'08)' : 'rgba(0,0,0,.03)')+';border:2px solid '+(isActive ? tf.color : isUnlocked ? tf.color+'40' : 'transparent')+';cursor:'+(isUnlocked?'pointer':'default')+';transition:all .2s;position:relative;text-align:center" '+(isUnlocked ? 'data-tf-id="'+tf.id+'"' : '')+'>';
    if(isActive) html += '<div style="position:absolute;top:4px;right:6px;font-size:8px;background:'+tf.color+';color:#fff;padding:1px 6px;border-radius:8px;font-weight:700">장착중</div>';
    html += '<div style="font-size:28px;margin-bottom:4px">'+(isUnlocked ? tf.emoji : '🔒')+'</div>';
    html += '<div style="font-size:12px;font-weight:700;margin-bottom:2px">'+(isUnlocked ? tf.name : '???')+'</div>';
    html += '<div style="font-size:10px;color:var(--text-sub);line-height:1.3">'+(isUnlocked ? tf.desc : '해금 조건: '+tf.unlock)+'</div>';
    if(isUnlocked) html += '<div style="font-size:10px;margin-top:4px;font-weight:700;color:'+tf.color+'">'+tf.stat.toUpperCase()+' +'+tf.bonus+'%</div>';
    html += '</div>';
  });
  html += '</div>';
  html += '<div style="margin-top:12px;text-align:center"><button id="v15TfAutoUnlock" style="padding:6px 16px;border:none;border-radius:12px;background:linear-gradient(135deg,#FF5FA2,#B066FF);color:#fff;font-size:11px;font-weight:700;cursor:pointer">자동 해금 체크</button></div>';
  return html;
}

function openTransformModal(){
  var modal = createV15Modal('v15TransformModal','요정 변신 시스템','🦋', buildTransformSystem());
  modal.classList.add('show');
  sfxV15('transform_start');
  trackV15Feature('transform');
  modal.querySelectorAll('[data-tf-id]').forEach(function(el){
    el.addEventListener('click', function(){
      var id = el.getAttribute('data-tf-id');
      var active = v15Load('active_transform', null);
      v15Save('active_transform', active === id ? null : id);
      sfxV15Multi(['transform_start','transform_end'], 100);
      var tf = V15_TRANSFORMS.find(function(t){ return t.id === id; });
      showToastV15((active === id ? '🦋 변신 해제!' : '🦋 '+tf.name+'으로 변신!'));
      modal.querySelector('.v15-modal-body').innerHTML = buildTransformSystem();
      bindTransformEvents(modal);
    });
  });
  bindTransformEvents(modal);
}

function bindTransformEvents(modal){
  var btn = document.getElementById('v15TfAutoUnlock');
  if(btn){
    btn.addEventListener('click', function(){
      var unlocked = v15Load('transforms', []);
      var a = {};
      try{ a = JSON.parse(localStorage.getItem('hatcuping_achievements') || '{}'); }catch(e){}
      var stats = {};
      try{ stats = JSON.parse(localStorage.getItem('hatcuping_stats') || '{}'); }catch(e){}
      var newCount = 0;
      V15_TRANSFORMS.forEach(function(tf){
        if(unlocked.indexOf(tf.id) !== -1) return;
        var ok = false;
        if(tf.id === 'flame_fairy' && (a.a_rpg_lv20 || stats.clears >= 5)) ok = true;
        if(tf.id === 'ice_fairy' && (a.a_boss3 || stats.clears >= 3)) ok = true;
        if(tf.id === 'wind_fairy' && (a.a_speedrun || stats.clears >= 4)) ok = true;
        if(tf.id === 'star_fairy' && (a.a_star3 || stats.hearts >= 10)) ok = true;
        if(tf.id === 'shadow_fairy' && (a.a_nodeathrun || a.a_no_death)) ok = true;
        if(tf.id === 'flower_fairy' && a.a_all_games) ok = true;
        if(tf.id === 'thunder_fairy' && (a.a_combo20 || a.a_combo10)) ok = true;
        if(ok){ unlocked.push(tf.id); newCount++; }
      });
      if(unlocked.length >= 7 && unlocked.indexOf('rainbow_fairy') === -1){ unlocked.push('rainbow_fairy'); newCount++; }
      v15Save('transforms', unlocked);
      showToastV15('🦋 ' + (newCount > 0 ? newCount + '종 변신 해금!' : '새로운 해금 없음'));
      modal.querySelector('.v15-modal-body').innerHTML = buildTransformSystem();
      bindTransformEvents(modal);
    });
  }
  modal.querySelectorAll('[data-tf-id]').forEach(function(el){
    el.addEventListener('click', function(){
      var id = el.getAttribute('data-tf-id');
      var active = v15Load('active_transform', null);
      v15Save('active_transform', active === id ? null : id);
      sfxV15Multi(['transform_start','transform_end'], 100);
      var tf = V15_TRANSFORMS.find(function(t){ return t.id === id; });
      showToastV15((active === id ? '🦋 변신 해제!' : '🦋 '+tf.name+'으로 변신!'));
      modal.querySelector('.v15-modal-body').innerHTML = buildTransformSystem();
      bindTransformEvents(modal);
    });
  });
}


// ============================================================
// 2. EMOTION BATTLE ARENA Canvas (이모션배틀아레나)
// Like Pokemon Stadium - 1v1 turn-based competitive battles
// ============================================================
var V15_ARENA_OPPONENTS = [
  {name:'트러핑',hp:80,atk:12,def:8,emoji:'👿',color:'#8B0000'},
  {name:'라라핑',hp:90,atk:10,def:10,emoji:'🎵',color:'#9370DB'},
  {name:'차차핑',hp:70,atk:15,def:6,emoji:'💃',color:'#FF69B4'},
  {name:'바로핑',hp:100,atk:8,def:12,emoji:'⚖️',color:'#4682B4'},
  {name:'꽁꽁핑',hp:85,atk:11,def:9,emoji:'❄️',color:'#87CEEB'},
  {name:'해핑',hp:95,atk:14,def:7,emoji:'☀️',color:'#FFD700'},
  {name:'키키핑',hp:75,atk:16,def:5,emoji:'🎭',color:'#FF4500'},
  {name:'무럭무럭핑',hp:110,atk:9,def:14,emoji:'🌱',color:'#228B22'}
];

function buildArena(){
  var record = v15Load('arena_record', {wins:0, losses:0, streak:0, best:0});
  var html = '<div style="text-align:center;margin-bottom:10px">';
  html += '<div style="display:flex;justify-content:center;gap:16px;font-size:11px;color:var(--text-sub)">';
  html += '<span>승리: <b style="color:#4CAF50">'+record.wins+'</b></span>';
  html += '<span>패배: <b style="color:#F44336">'+record.losses+'</b></span>';
  html += '<span>연승: <b style="color:#FF9800">'+record.streak+'</b></span>';
  html += '<span>최고연승: <b style="color:#FFD700">'+record.best+'</b></span>';
  html += '</div></div>';
  html += '<div style="font-size:12px;color:var(--text-sub);margin-bottom:10px;text-align:center">로미(HP:100 공:12 방:10)로 상대를 선택해 대전하세요!</div>';
  html += '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px">';
  V15_ARENA_OPPONENTS.forEach(function(op, i){
    html += '<div class="v15-arena-pick" data-idx="'+i+'" style="padding:10px;border-radius:14px;background:linear-gradient(135deg,'+op.color+'12,'+op.color+'06);border:2px solid '+op.color+'30;cursor:pointer;text-align:center;transition:all .2s">';
    html += '<div style="font-size:24px">'+op.emoji+'</div>';
    html += '<div style="font-size:12px;font-weight:700">'+op.name+'</div>';
    html += '<div style="font-size:10px;color:var(--text-sub)">HP:'+op.hp+' 공:'+op.atk+' 방:'+op.def+'</div>';
    html += '</div>';
  });
  html += '</div>';
  html += '<canvas id="v15ArenaCanvas" width="480" height="280" style="display:none;width:100%;margin-top:10px;border-radius:14px;background:#1a0a2e"></canvas>';
  html += '<div id="v15ArenaLog" style="display:none;max-height:120px;overflow-y:auto;margin-top:8px;padding:8px;background:rgba(0,0,0,.03);border-radius:10px;font-size:11px;line-height:1.6"></div>';
  html += '<div id="v15ArenaActions" style="display:none;margin-top:8px;display:none;gap:6px;justify-content:center;flex-wrap:wrap"></div>';
  return html;
}

function startArenaBattle(idx){
  var op = V15_ARENA_OPPONENTS[idx];
  var canvas = document.getElementById('v15ArenaCanvas');
  var log = document.getElementById('v15ArenaLog');
  var actions = document.getElementById('v15ArenaActions');
  if(!canvas || !log || !actions) return;
  canvas.style.display = 'block';
  log.style.display = 'block';
  actions.style.display = 'flex';
  sfxV15('arena_bell');

  var ctx = canvas.getContext('2d');
  var playerHP = 100, enemyHP = op.hp;
  var playerMaxHP = 100, enemyMaxHP = op.hp;
  var playerAtk = 12, playerDef = 10;
  var turn = 0;

  var tf = v15Load('active_transform', null);
  if(tf){
    var tfData = V15_TRANSFORMS.find(function(t){ return t.id === tf; });
    if(tfData){
      if(tfData.stat === 'attack') playerAtk = Math.round(playerAtk * (1 + tfData.bonus/100));
      if(tfData.stat === 'defense') playerDef = Math.round(playerDef * (1 + tfData.bonus/100));
      if(tfData.stat === 'heal') playerHP = Math.min(130, playerHP + 30);
      if(tfData.stat === 'all'){ playerAtk += 2; playerDef += 2; }
      playerMaxHP = playerHP;
    }
  }

  log.innerHTML = '<div style="color:#FFD700;font-weight:700">⚔️ ' + op.name + '과(와)의 대전 시작!</div>';

  function drawBattle(){
    var w = canvas.width, h = canvas.height;
    ctx.clearRect(0,0,w,h);
    var grad = ctx.createLinearGradient(0,0,w,h);
    grad.addColorStop(0,'#1a0a2e');
    grad.addColorStop(1,'#2d1040');
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,w,h);

    ctx.strokeStyle = 'rgba(255,255,255,.1)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(w/2,0); ctx.lineTo(w/2,h); ctx.stroke();
    ctx.font = '36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('💖', w*0.25, h*0.5);
    ctx.fillText(op.emoji, w*0.75, h*0.5);

    ctx.font = 'bold 13px sans-serif';
    ctx.fillStyle = '#FF5FA2';
    ctx.fillText('로미', w*0.25, h*0.5+40);
    ctx.fillStyle = op.color;
    ctx.fillText(op.name, w*0.75, h*0.5+40);

    drawHPBar(ctx, w*0.25-60, 30, 120, 14, playerHP, playerMaxHP, '#4CAF50');
    drawHPBar(ctx, w*0.75-60, 30, 120, 14, enemyHP, enemyMaxHP, '#F44336');

    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#aaa';
    ctx.fillText('HP: '+playerHP+'/'+playerMaxHP, w*0.25, 60);
    ctx.fillText('HP: '+enemyHP+'/'+enemyMaxHP, w*0.75, 60);
    ctx.fillText('ATK:'+playerAtk+' DEF:'+playerDef, w*0.25, 75);
    ctx.fillText('ATK:'+op.atk+' DEF:'+op.def, w*0.75, 75);

    ctx.font = 'bold 11px sans-serif';
    ctx.fillStyle = '#FFD700';
    ctx.fillText('TURN '+(turn+1), w/2, h-10);
  }

  function drawHPBar(c, x, y, w, h, cur, max, color){
    c.fillStyle = 'rgba(255,255,255,.1)';
    c.beginPath(); c.roundRect(x,y,w,h,h/2); c.fill();
    var pct = Math.max(0, cur/max);
    c.fillStyle = pct > 0.5 ? color : pct > 0.25 ? '#FF9800' : '#F44336';
    c.beginPath(); c.roundRect(x,y,w*pct,h,h/2); c.fill();
  }

  function addLog(msg){ log.innerHTML += '<div>'+msg+'</div>'; log.scrollTop = log.scrollHeight; }

  function playerAction(type){
    turn++;
    var dmg = 0, msg = '';
    if(type === 'attack'){
      dmg = Math.max(1, playerAtk - Math.floor(op.def * 0.5) + Math.floor(Math.random()*6) - 2);
      enemyHP = Math.max(0, enemyHP - dmg);
      msg = '💖 로미의 공격! '+dmg+' 데미지!';
      sfxV15('arena_hit');
    } else if(type === 'skill'){
      dmg = Math.max(1, Math.floor(playerAtk * 1.5) - Math.floor(op.def * 0.3) + Math.floor(Math.random()*4));
      enemyHP = Math.max(0, enemyHP - dmg);
      msg = '✨ 로미의 하츄핑 스킬! '+dmg+' 데미지!';
      sfxV15Multi(['arena_hit','arena_hit'], 50);
    } else if(type === 'defend'){
      var heal = Math.floor(Math.random()*8) + 5;
      playerHP = Math.min(playerMaxHP, playerHP + heal);
      msg = '🛡️ 로미가 방어! HP +'+heal+' 회복!';
      sfxV15('friendship_up');
    }
    addLog(msg);
    drawBattle();
    if(enemyHP <= 0){ endBattle(true); return; }

    setTimeout(function(){
      var eDmg = Math.max(1, op.atk - Math.floor(playerDef * 0.5) + Math.floor(Math.random()*5) - 2);
      playerHP = Math.max(0, playerHP - eDmg);
      addLog(op.emoji + ' ' + op.name + '의 반격! '+eDmg+' 데미지!');
      drawBattle();
      if(playerHP <= 0) endBattle(false);
    }, 500);
  }

  function endBattle(won){
    actions.style.display = 'none';
    var record = v15Load('arena_record', {wins:0, losses:0, streak:0, best:0});
    if(won){
      record.wins++;
      record.streak++;
      record.best = Math.max(record.best, record.streak);
      addLog('<b style="color:#FFD700">🏆 승리! '+op.name+'을(를) 이겼습니다!</b>');
      sfxV15Multi(['arena_win','arena_win'], 150);
    } else {
      record.losses++;
      record.streak = 0;
      addLog('<b style="color:#F44336">💀 패배... 다시 도전하세요!</b>');
    }
    v15Save('arena_record', record);
    drawBattle();
  }

  actions.innerHTML = '<button class="v15-arena-btn" data-act="attack" style="padding:8px 16px;border:none;border-radius:12px;background:linear-gradient(135deg,#F44336,#FF5722);color:#fff;font-size:12px;font-weight:700;cursor:pointer">⚔️ 공격</button>'
    + '<button class="v15-arena-btn" data-act="skill" style="padding:8px 16px;border:none;border-radius:12px;background:linear-gradient(135deg,#9C27B0,#E040FB);color:#fff;font-size:12px;font-weight:700;cursor:pointer">✨ 스킬</button>'
    + '<button class="v15-arena-btn" data-act="defend" style="padding:8px 16px;border:none;border-radius:12px;background:linear-gradient(135deg,#2196F3,#03A9F4);color:#fff;font-size:12px;font-weight:700;cursor:pointer">🛡️ 방어</button>';

  actions.querySelectorAll('.v15-arena-btn').forEach(function(b){
    b.addEventListener('click', function(){ playerAction(b.getAttribute('data-act')); });
  });

  drawBattle();
}

function openArenaModal(){
  var modal = createV15Modal('v15ArenaModal','이모션 배틀 아레나','⚔️', buildArena());
  modal.classList.add('show');
  sfxV15('arena_bell');
  trackV15Feature('arena');
  modal.querySelectorAll('.v15-arena-pick').forEach(function(el){
    el.addEventListener('click', function(){ startArenaBattle(parseInt(el.getAttribute('data-idx'))); });
  });
}


// ============================================================
// 3. SECRET CAVE EXPLORATION Canvas (비밀탐험동굴)
// Like Mario hidden stages - procedural cave with treasures
// ============================================================
function buildCaveExploration(){
  var explored = v15Load('caves_explored', 0);
  var treasures = v15Load('cave_treasures', []);
  var html = '<div style="font-size:12px;color:var(--text-sub);margin-bottom:10px;text-align:center">마리오 히든 스테이지처럼! 랜덤 동굴을 탐험하고 보물을 찾으세요.</div>';
  html += '<div style="display:flex;gap:12px;justify-content:center;margin-bottom:10px;font-size:11px">';
  html += '<span>탐험 횟수: <b style="color:#FF5FA2">'+explored+'</b></span>';
  html += '<span>보물 수집: <b style="color:#FFD700">'+treasures.length+'</b></span>';
  html += '</div>';
  html += '<canvas id="v15CaveCanvas" width="480" height="320" style="width:100%;border-radius:14px;background:#0d0d1a;cursor:pointer"></canvas>';
  html += '<div id="v15CaveStatus" style="text-align:center;margin-top:8px;font-size:12px;color:var(--text-sub)">캔버스를 클릭하여 이동하세요</div>';
  html += '<div style="display:flex;gap:6px;justify-content:center;margin-top:8px">';
  html += '<button id="v15CaveNew" style="padding:6px 14px;border:none;border-radius:10px;background:linear-gradient(135deg,#6366F1,#818CF8);color:#fff;font-size:11px;font-weight:700;cursor:pointer">새 동굴 생성</button>';
  html += '</div>';
  if(treasures.length > 0){
    html += '<div style="margin-top:10px;font-size:11px;color:var(--text-sub)"><b>수집한 보물:</b></div>';
    html += '<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px">';
    treasures.forEach(function(t){ html += '<span style="font-size:16px" title="'+t.name+'">'+t.emoji+'</span>'; });
    html += '</div>';
  }
  return html;
}

var V15_CAVE_TREASURES = [
  {emoji:'💎',name:'다이아몬드',rarity:'SSR'},
  {emoji:'🏺',name:'고대 항아리',rarity:'SR'},
  {emoji:'📜',name:'비밀 지도',rarity:'SR'},
  {emoji:'🗝️',name:'황금 열쇠',rarity:'R'},
  {emoji:'🍄',name:'마법 버섯',rarity:'R'},
  {emoji:'🧪',name:'신비의 물약',rarity:'R'},
  {emoji:'🪙',name:'금화',rarity:'N'},
  {emoji:'🔮',name:'수정 구슬',rarity:'SR'},
  {emoji:'👑',name:'티니핑 왕관',rarity:'SSR'},
  {emoji:'🎭',name:'변신 가면',rarity:'R'}
];

function initCaveCanvas(){
  var canvas = document.getElementById('v15CaveCanvas');
  if(!canvas) return;
  var ctx = canvas.getContext('2d');
  var W = 480, H = 320;
  var CELL = 32, COLS = Math.floor(W/CELL), ROWS = Math.floor(H/CELL);

  var map = [];
  var px = 1, py = 1;
  var treasurePos = [];
  var revealed = [];

  function generateCave(){
    map = [];
    revealed = [];
    for(var r=0; r<ROWS; r++){
      map[r] = [];
      revealed[r] = [];
      for(var c=0; c<COLS; c++){
        map[r][c] = (r === 0 || c === 0 || r === ROWS-1 || c === COLS-1) ? 1 : (Math.random() < 0.25 ? 1 : 0);
        revealed[r][c] = false;
      }
    }
    px = 1; py = 1;
    map[py][px] = 0;
    revealAround(px, py);

    treasurePos = [];
    for(var i=0; i<3; i++){
      var tx, ty, tries = 0;
      do { tx = Math.floor(Math.random()*(COLS-2))+1; ty = Math.floor(Math.random()*(ROWS-2))+1; tries++; } while((map[ty][tx] !== 0 || (tx === px && ty === py)) && tries < 50);
      if(tries < 50){ treasurePos.push({x:tx, y:ty, collected:false, item: V15_CAVE_TREASURES[Math.floor(Math.random()*V15_CAVE_TREASURES.length)]}); }
    }
    sfxV15('cave_enter');
    drawCave();
  }

  function revealAround(cx, cy){
    for(var dy=-2; dy<=2; dy++){
      for(var dx=-2; dx<=2; dx++){
        var ny = cy+dy, nx = cx+dx;
        if(ny>=0 && ny<ROWS && nx>=0 && nx<COLS) revealed[ny][nx] = true;
      }
    }
  }

  function drawCave(){
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = '#0d0d1a';
    ctx.fillRect(0,0,W,H);

    for(var r=0; r<ROWS; r++){
      for(var c=0; c<COLS; c++){
        var x = c*CELL, y = r*CELL;
        if(!revealed[r][c]){
          ctx.fillStyle = '#111122';
          ctx.fillRect(x,y,CELL,CELL);
          continue;
        }
        if(map[r][c] === 1){
          ctx.fillStyle = '#3a2a1a';
          ctx.fillRect(x,y,CELL,CELL);
          ctx.strokeStyle = '#2a1a0a';
          ctx.strokeRect(x,y,CELL,CELL);
        } else {
          ctx.fillStyle = '#1a1a2e';
          ctx.fillRect(x,y,CELL,CELL);
          ctx.strokeStyle = '#252540';
          ctx.strokeRect(x,y,CELL,CELL);
        }
      }
    }

    treasurePos.forEach(function(t){
      if(!t.collected && revealed[t.y][t.x]){
        ctx.font = '20px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(t.item.emoji, t.x*CELL+CELL/2, t.y*CELL+CELL/2);
      }
    });

    ctx.font = '22px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('💖', px*CELL+CELL/2, py*CELL+CELL/2);
  }

  canvas.addEventListener('click', function(e){
    var rect = canvas.getBoundingClientRect();
    var sx = (e.clientX - rect.left) * (W / rect.width);
    var sy = (e.clientY - rect.top) * (H / rect.height);
    var tx = Math.floor(sx / CELL), ty = Math.floor(sy / CELL);

    var dx = Math.sign(tx - px), dy = Math.sign(ty - py);
    if(dx === 0 && dy === 0) return;
    if(Math.abs(tx-px) > Math.abs(ty-py)) dy = 0; else dx = 0;

    var nx = px + dx, ny = py + dy;
    if(nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS || map[ny][nx] === 1) return;

    px = nx; py = ny;
    revealAround(px, py);

    treasurePos.forEach(function(t){
      if(!t.collected && t.x === px && t.y === py){
        t.collected = true;
        var ts = v15Load('cave_treasures', []);
        ts.push({emoji:t.item.emoji, name:t.item.name, rarity:t.item.rarity});
        v15Save('cave_treasures', ts);
        showToastV15(t.item.emoji + ' ' + t.item.name + ' 발견! ('+t.item.rarity+')');
        sfxV15('cave_discover');
      }
    });

    drawCave();
    var status = document.getElementById('v15CaveStatus');
    if(status){
      var left = treasurePos.filter(function(t){ return !t.collected; }).length;
      status.textContent = left > 0 ? '남은 보물: '+left+'개' : '🎉 모든 보물을 찾았습니다!';
    }
  });

  var newBtn = document.getElementById('v15CaveNew');
  if(newBtn){
    newBtn.addEventListener('click', function(){
      var exp = v15Load('caves_explored', 0);
      v15Save('caves_explored', exp + 1);
      generateCave();
    });
  }

  generateCave();
}

function openCaveModal(){
  var modal = createV15Modal('v15CaveModal','비밀 탐험 동굴','🕳️', buildCaveExploration());
  modal.classList.add('show');
  trackV15Feature('cave');
  setTimeout(initCaveCanvas, 100);
}


// ============================================================
// 4. EMOTION MUSIC BAND (이모션음악밴드)
// Music creation mini-game with 12 instruments
// ============================================================
var V15_INSTRUMENTS = [
  {name:'피아노',emoji:'🎹',freq:523,type:'sine'},
  {name:'기타',emoji:'🎸',freq:330,type:'triangle'},
  {name:'드럼',emoji:'🥁',freq:150,type:'square'},
  {name:'플루트',emoji:'🪈',freq:880,type:'sine'},
  {name:'바이올린',emoji:'🎻',freq:440,type:'triangle'},
  {name:'트럼펫',emoji:'🎺',freq:587,type:'sawtooth'},
  {name:'심벌즈',emoji:'🔔',freq:2000,type:'sine'},
  {name:'베이스',emoji:'🎵',freq:165,type:'triangle'},
  {name:'하프',emoji:'🪕',freq:659,type:'sine'},
  {name:'첼로',emoji:'🎶',freq:220,type:'triangle'},
  {name:'실로폰',emoji:'🔊',freq:1047,type:'sine'},
  {name:'탬버린',emoji:'🪘',freq:800,type:'square'}
];

function buildMusicBand(){
  var sessions = v15Load('band_sessions', 0);
  var html = '<div style="font-size:12px;color:var(--text-sub);margin-bottom:10px;text-align:center">악기를 눌러 합주하세요! 리듬 패턴을 만들어보세요.</div>';
  html += '<div style="text-align:center;margin-bottom:8px;font-size:11px">세션: <b style="color:#FF5FA2">'+sessions+'</b></div>';
  html += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px">';
  V15_INSTRUMENTS.forEach(function(inst, i){
    html += '<button class="v15-inst-btn" data-idx="'+i+'" style="padding:10px 4px;border:none;border-radius:12px;background:rgba(0,0,0,.04);cursor:pointer;transition:all .15s;text-align:center">';
    html += '<div style="font-size:24px">'+inst.emoji+'</div>';
    html += '<div style="font-size:10px;font-weight:600;margin-top:2px">'+inst.name+'</div>';
    html += '</button>';
  });
  html += '</div>';
  html += '<div style="margin-top:10px;text-align:center">';
  html += '<div style="font-size:11px;color:var(--text-sub);margin-bottom:6px">시퀀서 (8비트 루프)</div>';
  html += '<canvas id="v15BandCanvas" width="480" height="80" style="width:100%;border-radius:10px;background:rgba(0,0,0,.06);cursor:pointer"></canvas>';
  html += '<div style="display:flex;gap:6px;justify-content:center;margin-top:8px">';
  html += '<button id="v15BandPlay" style="padding:6px 14px;border:none;border-radius:10px;background:linear-gradient(135deg,#4CAF50,#66BB6A);color:#fff;font-size:11px;font-weight:700;cursor:pointer">▶ 재생</button>';
  html += '<button id="v15BandClear" style="padding:6px 14px;border:none;border-radius:10px;background:linear-gradient(135deg,#F44336,#EF5350);color:#fff;font-size:11px;font-weight:700;cursor:pointer">🗑 초기화</button>';
  html += '</div></div>';
  return html;
}

function initMusicBand(modal){
  var sequence = v15Load('band_sequence', Array(8).fill(-1));
  var canvas = document.getElementById('v15BandCanvas');
  if(!canvas) return;
  var ctx = canvas.getContext('2d');

  function drawSequencer(){
    ctx.clearRect(0,0,480,80);
    for(var i=0; i<8; i++){
      var x = i*60, w = 56, h = 72;
      ctx.fillStyle = sequence[i] >= 0 ? 'rgba(255,95,162,.15)' : 'rgba(0,0,0,.04)';
      ctx.beginPath(); ctx.roundRect(x+2, 4, w, h, 8); ctx.fill();
      ctx.strokeStyle = sequence[i] >= 0 ? '#FF5FA2' : 'rgba(0,0,0,.1)';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.roundRect(x+2, 4, w, h, 8); ctx.stroke();

      if(sequence[i] >= 0){
        var inst = V15_INSTRUMENTS[sequence[i]];
        ctx.font = '18px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(inst.emoji, x+30, 36);
        ctx.font = '9px sans-serif';
        ctx.fillStyle = 'var(--text-sub)';
        ctx.fillText(inst.name, x+30, 58);
      } else {
        ctx.font = '11px sans-serif';
        ctx.fillStyle = '#ccc';
        ctx.textAlign = 'center';
        ctx.fillText((i+1)+'', x+30, 44);
      }
    }
  }

  var selectedInst = -1;
  modal.querySelectorAll('.v15-inst-btn').forEach(function(btn){
    btn.addEventListener('click', function(){
      selectedInst = parseInt(btn.getAttribute('data-idx'));
      _v15InitAudio();
      if(_v15Ctx){
        var inst = V15_INSTRUMENTS[selectedInst];
        try{
          var osc = _v15Ctx.createOscillator();
          var gain = _v15Ctx.createGain();
          osc.type = inst.type;
          osc.frequency.value = inst.freq;
          gain.gain.value = 0.1;
          osc.connect(gain);
          gain.connect(_v15Ctx.destination);
          osc.start();
          osc.stop(_v15Ctx.currentTime + 0.15);
        }catch(e){}
      }
      btn.style.background = 'rgba(255,95,162,.15)';
      btn.style.transform = 'scale(1.1)';
      setTimeout(function(){ btn.style.background = ''; btn.style.transform = ''; }, 200);
    });
  });

  canvas.addEventListener('click', function(e){
    if(selectedInst < 0) return;
    var rect = canvas.getBoundingClientRect();
    var sx = (e.clientX - rect.left) * (480 / rect.width);
    var idx = Math.floor(sx / 60);
    if(idx >= 0 && idx < 8){
      sequence[idx] = selectedInst;
      v15Save('band_sequence', sequence);
      sfxV15('band_play');
      drawSequencer();
    }
  });

  var playBtn = document.getElementById('v15BandPlay');
  if(playBtn){
    playBtn.addEventListener('click', function(){
      _v15InitAudio();
      if(!_v15Ctx) return;
      var s = v15Load('band_sessions', 0);
      v15Save('band_sessions', s + 1);
      sequence.forEach(function(instIdx, i){
        if(instIdx < 0) return;
        setTimeout(function(){
          var inst = V15_INSTRUMENTS[instIdx];
          try{
            var osc = _v15Ctx.createOscillator();
            var gain = _v15Ctx.createGain();
            osc.type = inst.type;
            osc.frequency.value = inst.freq;
            gain.gain.value = 0.1;
            osc.connect(gain);
            gain.connect(_v15Ctx.destination);
            osc.start();
            osc.stop(_v15Ctx.currentTime + 0.2);
          }catch(e){}
        }, i * 250);
      });
      sfxV15('band_complete');
    });
  }

  var clearBtn = document.getElementById('v15BandClear');
  if(clearBtn){
    clearBtn.addEventListener('click', function(){
      sequence = Array(8).fill(-1);
      v15Save('band_sequence', sequence);
      drawSequencer();
    });
  }

  drawSequencer();
}

function openBandModal(){
  var modal = createV15Modal('v15BandModal','이모션 음악 밴드','🎵', buildMusicBand());
  modal.classList.add('show');
  sfxV15('band_play');
  trackV15Feature('band');
  setTimeout(function(){ initMusicBand(modal); }, 100);
}


// ============================================================
// 5. FRIENDSHIP GALLERY Canvas (우정도감갤러리)
// Like Pokedex - friendship levels and interaction tracking
// ============================================================
var V15_FRIENDS = [
  {id:'romi',name:'로미',emoji:'💖',color:'#FF5FA2',desc:'주인공! 사랑의 하츄핑과 함께하는 소녀'},
  {id:'hachuping',name:'하츄핑',emoji:'🩷',color:'#FF69B4',desc:'사랑의 요정. 로미의 가장 친한 친구'},
  {id:'baroping',name:'바로핑',emoji:'⚖️',color:'#4682B4',desc:'정의감 넘치는 바른 요정'},
  {id:'chacha',name:'차차핑',emoji:'💃',color:'#FF1493',desc:'춤추는 것을 좋아하는 활발한 요정'},
  {id:'lalaping',name:'라라핑',emoji:'🎵',color:'#9370DB',desc:'노래를 좋아하는 음악 요정'},
  {id:'kkongkkong',name:'꽁꽁핑',emoji:'❄️',color:'#87CEEB',desc:'수줍지만 마음이 따뜻한 얼음 요정'},
  {id:'haeping',name:'해핑',emoji:'☀️',color:'#FFD700',desc:'밝고 긍정적인 해맑은 요정'},
  {id:'truping',name:'트러핑',emoji:'👿',color:'#8B0000',desc:'오해를 풀면 진정한 친구가 되는 요정'},
  {id:'kikipping',name:'키키핑',emoji:'🎭',color:'#FF4500',desc:'장난기 많지만 재치있는 요정'},
  {id:'muruk',name:'무럭무럭핑',emoji:'🌱',color:'#228B22',desc:'자연을 사랑하는 성장의 요정'},
  {id:'hewing',name:'헤잉핑',emoji:'🌊',color:'#1E90FF',desc:'바다와 물을 다루는 신비로운 요정'},
  {id:'banbaning',name:'반짝핑',emoji:'✨',color:'#DAA520',desc:'빛나는 것을 좋아하는 반짝이는 요정'}
];

function buildFriendshipGallery(){
  var friendData = v15Load('friendship', {});
  var html = '<div style="font-size:12px;color:var(--text-sub);margin-bottom:10px;text-align:center">포켓몬 도감처럼! 티니핑들과 우정을 쌓고 도감을 완성하세요.</div>';
  html += '<canvas id="v15FriendCanvas" width="480" height="260" style="width:100%;border-radius:14px;margin-bottom:8px"></canvas>';
  html += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px">';
  V15_FRIENDS.forEach(function(f){
    var level = (friendData[f.id] || {}).level || 0;
    var maxLevel = 10;
    var pct = Math.min(level / maxLevel * 100, 100);
    var hearts = Math.min(5, Math.ceil(level / 2));
    html += '<div class="v15-friend-card" data-fid="'+f.id+'" style="padding:8px;border-radius:12px;background:linear-gradient(135deg,'+f.color+'10,'+f.color+'05);border:1px solid '+f.color+'20;cursor:pointer;text-align:center;transition:all .2s">';
    html += '<div style="font-size:22px">'+f.emoji+'</div>';
    html += '<div style="font-size:11px;font-weight:700;margin:2px 0">'+f.name+'</div>';
    html += '<div style="font-size:9px;color:var(--text-sub)">Lv.'+level+'</div>';
    html += '<div style="height:4px;background:rgba(0,0,0,.06);border-radius:2px;margin-top:3px;overflow:hidden"><div style="height:100%;width:'+pct+'%;background:'+f.color+';border-radius:2px"></div></div>';
    html += '<div style="font-size:8px;margin-top:2px">'+'❤️'.repeat(hearts)+'🤍'.repeat(5-hearts)+'</div>';
    html += '</div>';
  });
  html += '</div>';
  html += '<div style="margin-top:8px;text-align:center"><button id="v15FriendInteract" style="padding:6px 14px;border:none;border-radius:10px;background:linear-gradient(135deg,#FF5FA2,#FF69B4);color:#fff;font-size:11px;font-weight:700;cursor:pointer">💕 모두와 인사하기</button></div>';
  return html;
}

function drawFriendshipRadar(){
  var canvas = document.getElementById('v15FriendCanvas');
  if(!canvas) return;
  var ctx = canvas.getContext('2d');
  var W = 480, H = 260;
  var cx = W/2, cy = H/2+10;
  var R = 100;
  var friendData = v15Load('friendship', {});

  ctx.clearRect(0,0,W,H);
  var isDark = document.body.classList.contains('dark');
  ctx.fillStyle = isDark ? '#1a0a2e' : '#fafafe';
  ctx.fillRect(0,0,W,H);

  ctx.font = 'bold 13px sans-serif';
  ctx.fillStyle = isDark ? '#FF8EC4' : '#FF5FA2';
  ctx.textAlign = 'center';
  ctx.fillText('우정 레이더', cx, 18);

  var n = V15_FRIENDS.length;
  for(var ring=1; ring<=5; ring++){
    var r = R * ring / 5;
    ctx.beginPath();
    for(var i=0; i<n; i++){
      var angle = (Math.PI*2/n)*i - Math.PI/2;
      var px = cx + r * Math.cos(angle);
      var py = cy + r * Math.sin(angle);
      if(i===0) ctx.moveTo(px,py); else ctx.lineTo(px,py);
    }
    ctx.closePath();
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.06)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  for(var i=0; i<n; i++){
    var angle = (Math.PI*2/n)*i - Math.PI/2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + R*Math.cos(angle), cy + R*Math.sin(angle));
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.04)';
    ctx.stroke();

    var labelR = R + 20;
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(V15_FRIENDS[i].emoji, cx + labelR*Math.cos(angle), cy + labelR*Math.sin(angle));
  }

  ctx.beginPath();
  for(var i=0; i<n; i++){
    var angle = (Math.PI*2/n)*i - Math.PI/2;
    var level = ((friendData[V15_FRIENDS[i].id] || {}).level || 0);
    var r = R * Math.min(level, 10) / 10;
    var px = cx + r * Math.cos(angle);
    var py = cy + r * Math.sin(angle);
    if(i===0) ctx.moveTo(px,py); else ctx.lineTo(px,py);
  }
  ctx.closePath();
  ctx.fillStyle = 'rgba(255,95,162,.2)';
  ctx.fill();
  ctx.strokeStyle = '#FF5FA2';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function openFriendshipModal(){
  var modal = createV15Modal('v15FriendModal','우정 도감 갤러리','💕', buildFriendshipGallery());
  modal.classList.add('show');
  sfxV15('friendship_up');
  trackV15Feature('friendship');
  setTimeout(drawFriendshipRadar, 100);

  modal.querySelectorAll('.v15-friend-card').forEach(function(card){
    card.addEventListener('click', function(){
      var fid = card.getAttribute('data-fid');
      var friendData = v15Load('friendship', {});
      if(!friendData[fid]) friendData[fid] = {level:0, interactions:0};
      friendData[fid].level = Math.min(10, friendData[fid].level + 1);
      friendData[fid].interactions++;
      v15Save('friendship', friendData);
      var f = V15_FRIENDS.find(function(x){ return x.id === fid; });
      showToastV15(f.emoji + ' ' + f.name + '과(와)의 우정 UP! Lv.' + friendData[fid].level);
      sfxV15('friendship_up');
      modal.querySelector('.v15-modal-body').innerHTML = buildFriendshipGallery();
      setTimeout(drawFriendshipRadar, 100);
      rebindFriendEvents(modal);
    });
  });

  var interactBtn = document.getElementById('v15FriendInteract');
  if(interactBtn){
    interactBtn.addEventListener('click', function(){
      var friendData = v15Load('friendship', {});
      V15_FRIENDS.forEach(function(f){
        if(!friendData[f.id]) friendData[f.id] = {level:0, interactions:0};
        friendData[f.id].level = Math.min(10, friendData[f.id].level + 1);
        friendData[f.id].interactions++;
      });
      v15Save('friendship', friendData);
      showToastV15('💕 모든 티니핑과 인사! 우정 +1');
      sfxV15Multi(['friendship_up','friendship_up','friendship_up'], 100);
      modal.querySelector('.v15-modal-body').innerHTML = buildFriendshipGallery();
      setTimeout(drawFriendshipRadar, 100);
      rebindFriendEvents(modal);
    });
  }
}

function rebindFriendEvents(modal){
  modal.querySelectorAll('.v15-friend-card').forEach(function(card){
    card.addEventListener('click', function(){
      var fid = card.getAttribute('data-fid');
      var friendData = v15Load('friendship', {});
      if(!friendData[fid]) friendData[fid] = {level:0, interactions:0};
      friendData[fid].level = Math.min(10, friendData[fid].level + 1);
      friendData[fid].interactions++;
      v15Save('friendship', friendData);
      var f = V15_FRIENDS.find(function(x){ return x.id === fid; });
      showToastV15(f.emoji + ' ' + f.name + '과(와)의 우정 UP! Lv.' + friendData[fid].level);
      sfxV15('friendship_up');
      modal.querySelector('.v15-modal-body').innerHTML = buildFriendshipGallery();
      setTimeout(drawFriendshipRadar, 100);
      rebindFriendEvents(modal);
    });
  });
  var interactBtn = document.getElementById('v15FriendInteract');
  if(interactBtn){
    interactBtn.addEventListener('click', function(){
      var friendData = v15Load('friendship', {});
      V15_FRIENDS.forEach(function(f){
        if(!friendData[f.id]) friendData[f.id] = {level:0, interactions:0};
        friendData[f.id].level = Math.min(10, friendData[f.id].level + 1);
        friendData[f.id].interactions++;
      });
      v15Save('friendship', friendData);
      showToastV15('💕 모든 티니핑과 인사! 우정 +1');
      modal.querySelector('.v15-modal-body').innerHTML = buildFriendshipGallery();
      setTimeout(drawFriendshipRadar, 100);
      rebindFriendEvents(modal);
    });
  }
}


// ============================================================
// 6. MAGIC RECIPE LAB (마법레시피연구소)
// Crafting system - combine ingredients for power-ups
// ============================================================
var V15_INGREDIENTS = [
  {id:'fire_crystal',name:'불꽃 수정',emoji:'🔴'},
  {id:'ice_shard',name:'얼음 조각',emoji:'🔵'},
  {id:'wind_feather',name:'바람 깃털',emoji:'🟢'},
  {id:'star_dust',name:'별가루',emoji:'🟡'},
  {id:'moon_tear',name:'달빛 눈물',emoji:'🟣'},
  {id:'sun_petal',name:'해바라기 꽃잎',emoji:'🟠'}
];

var V15_RECIPES = [
  {name:'힘의 물약',emoji:'⚔️',ing:['fire_crystal','star_dust'],effect:'공격력 +30% (3턴)',rarity:'R'},
  {name:'방어의 물약',emoji:'🛡️',ing:['ice_shard','moon_tear'],effect:'방어력 +40% (3턴)',rarity:'R'},
  {name:'속도의 물약',emoji:'💨',ing:['wind_feather','sun_petal'],effect:'속도 +50% (3턴)',rarity:'R'},
  {name:'치유의 물약',emoji:'💚',ing:['star_dust','moon_tear'],effect:'HP 50% 회복',rarity:'SR'},
  {name:'불사조의 영약',emoji:'🔥',ing:['fire_crystal','sun_petal','star_dust'],effect:'부활 1회',rarity:'SSR'},
  {name:'무적의 갑옷',emoji:'💎',ing:['ice_shard','wind_feather','moon_tear'],effect:'3턴 무적',rarity:'SSR'},
  {name:'우정의 반지',emoji:'💍',ing:['star_dust','sun_petal','moon_tear'],effect:'전체 우정 +2',rarity:'SSR'},
  {name:'변신의 오브',emoji:'🔮',ing:['fire_crystal','ice_shard','wind_feather'],effect:'랜덤 변신 해금',rarity:'SSR'}
];

function buildRecipeLab(){
  var inventory = v15Load('recipe_inv', {fire_crystal:3, ice_shard:3, wind_feather:3, star_dust:3, moon_tear:3, sun_petal:3});
  var crafted = v15Load('recipe_crafted', []);
  var html = '<div style="font-size:12px;color:var(--text-sub);margin-bottom:10px;text-align:center">재료를 조합해 강력한 아이템을 만들어보세요!</div>';
  html += '<div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin-bottom:12px;padding:8px;background:rgba(0,0,0,.03);border-radius:12px">';
  V15_INGREDIENTS.forEach(function(ing){
    html += '<span style="font-size:12px;display:flex;align-items:center;gap:3px">'+ing.emoji+' '+ing.name+': <b>'+((inventory[ing.id]||0))+'</b></span>';
  });
  html += '</div>';
  html += '<div style="display:flex;flex-wrap:wrap;gap:4px;justify-content:center;margin-bottom:10px"><button id="v15RecipeGather" style="padding:5px 12px;border:none;border-radius:8px;background:linear-gradient(135deg,#4CAF50,#66BB6A);color:#fff;font-size:11px;font-weight:700;cursor:pointer">🌿 재료 채집</button></div>';
  html += '<div style="font-size:12px;font-weight:700;color:var(--text);margin-bottom:6px">레시피 목록</div>';
  V15_RECIPES.forEach(function(rec, i){
    var canCraft = true;
    rec.ing.forEach(function(id){ if((inventory[id]||0) < 1) canCraft = false; });
    var wasCrafted = crafted.indexOf(rec.name) !== -1;
    var rarityColor = rec.rarity === 'SSR' ? '#FFD700' : rec.rarity === 'SR' ? '#9370DB' : '#4CAF50';
    html += '<div style="display:flex;align-items:center;gap:8px;padding:8px;margin-bottom:4px;border-radius:10px;background:rgba(0,0,0,.02);border:1px solid '+(canCraft ? rarityColor+'40' : 'transparent')+'">';
    html += '<span style="font-size:20px">'+rec.emoji+'</span>';
    html += '<div style="flex:1"><div style="font-size:12px;font-weight:700">'+rec.name+' <span style="font-size:9px;color:'+rarityColor+'">'+rec.rarity+'</span>'+(wasCrafted ? ' ✅' : '')+'</div>';
    html += '<div style="font-size:10px;color:var(--text-sub)">'+rec.effect+'</div>';
    html += '<div style="font-size:9px;color:#aaa">필요: '+rec.ing.map(function(id){ var ing = V15_INGREDIENTS.find(function(x){return x.id===id;}); return ing ? ing.emoji : ''; }).join(' ')+'</div>';
    html += '</div>';
    html += '<button class="v15-craft-btn" data-idx="'+i+'" style="padding:4px 10px;border:none;border-radius:8px;background:'+(canCraft ? 'linear-gradient(135deg,#FF5FA2,#B066FF)' : 'rgba(0,0,0,.1)')+';color:'+(canCraft ? '#fff' : '#aaa')+';font-size:10px;font-weight:700;cursor:'+(canCraft?'pointer':'default')+'" '+(canCraft?'':'disabled')+'>조합</button>';
    html += '</div>';
  });
  return html;
}

function openRecipeModal(){
  var modal = createV15Modal('v15RecipeModal','마법 레시피 연구소','🧪', buildRecipeLab());
  modal.classList.add('show');
  sfxV15('recipe_mix');
  trackV15Feature('recipe');

  function bindRecipeEvents(){
    modal.querySelectorAll('.v15-craft-btn:not([disabled])').forEach(function(btn){
      btn.addEventListener('click', function(){
        var idx = parseInt(btn.getAttribute('data-idx'));
        var rec = V15_RECIPES[idx];
        var inventory = v15Load('recipe_inv', {});
        rec.ing.forEach(function(id){ inventory[id] = Math.max(0, (inventory[id]||0) - 1); });
        v15Save('recipe_inv', inventory);
        var crafted = v15Load('recipe_crafted', []);
        if(crafted.indexOf(rec.name) === -1) crafted.push(rec.name);
        v15Save('recipe_crafted', crafted);
        showToastV15(rec.emoji + ' ' + rec.name + ' 조합 성공!');
        sfxV15('recipe_success');
        modal.querySelector('.v15-modal-body').innerHTML = buildRecipeLab();
        bindRecipeEvents();
      });
    });
    var gatherBtn = document.getElementById('v15RecipeGather');
    if(gatherBtn){
      gatherBtn.addEventListener('click', function(){
        var inventory = v15Load('recipe_inv', {});
        var gained = V15_INGREDIENTS[Math.floor(Math.random()*V15_INGREDIENTS.length)];
        inventory[gained.id] = (inventory[gained.id]||0) + 1;
        v15Save('recipe_inv', inventory);
        showToastV15(gained.emoji + ' ' + gained.name + ' 채집!');
        sfxV15('recipe_mix');
        modal.querySelector('.v15-modal-body').innerHTML = buildRecipeLab();
        bindRecipeEvents();
      });
    }
  }
  bindRecipeEvents();
}


// ============================================================
// 7. SEASONAL EVENT CALENDAR v2 Canvas (시즌이벤트캘린더v2)
// Enhanced calendar with seasonal events, rewards, login bonuses
// ============================================================
function buildSeasonCalendarV2(){
  var loginDays = v15Load('login_days', []);
  var today = todayStrV15();
  if(loginDays.indexOf(today) === -1){
    loginDays.push(today);
    v15Save('login_days', loginDays);
  }
  var totalLogins = loginDays.length;

  var html = '<div style="font-size:12px;color:var(--text-sub);margin-bottom:10px;text-align:center">매일 출석하고 시즌 보상을 받으세요!</div>';
  html += '<div style="text-align:center;margin-bottom:8px"><span style="font-size:11px">총 출석일: <b style="color:#FF5FA2">'+totalLogins+'일</b></span></div>';
  html += '<canvas id="v15CalV2Canvas" width="480" height="320" style="width:100%;border-radius:14px"></canvas>';

  var milestones = [
    {day:3,reward:'🎁 랜덤 재료 x3',emoji:'📦'},
    {day:7,reward:'⭐ 별가루 x5',emoji:'🌟'},
    {day:14,reward:'💎 변신 해금권',emoji:'💎'},
    {day:30,reward:'👑 레전드 칭호',emoji:'👑'}
  ];
  html += '<div style="margin-top:8px;font-size:11px;font-weight:700;color:var(--text)">마일스톤 보상</div>';
  milestones.forEach(function(m){
    var achieved = totalLogins >= m.day;
    html += '<div style="display:flex;align-items:center;gap:8px;padding:5px 0;font-size:11px;opacity:'+(achieved?1:.5)+'">';
    html += '<span>'+(achieved?'✅':'⬜')+'</span>';
    html += '<span>'+m.emoji+' '+m.day+'일: '+m.reward+'</span>';
    html += '</div>';
  });
  return html;
}

function drawCalendarV2(){
  var canvas = document.getElementById('v15CalV2Canvas');
  if(!canvas) return;
  var ctx = canvas.getContext('2d');
  var W = 480, H = 320;
  var isDark = document.body.classList.contains('dark');

  ctx.clearRect(0,0,W,H);
  ctx.fillStyle = isDark ? '#1a0a2e' : '#fafafe';
  ctx.fillRect(0,0,W,H);

  var now = new Date();
  var year = now.getFullYear(), month = now.getMonth();
  var firstDay = new Date(year, month, 1).getDay();
  var daysInMonth = new Date(year, month+1, 0).getDate();
  var today = now.getDate();

  var monthNames = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
  ctx.font = 'bold 14px sans-serif';
  ctx.fillStyle = isDark ? '#FF8EC4' : '#FF5FA2';
  ctx.textAlign = 'center';
  ctx.fillText(year + '년 ' + monthNames[month], W/2, 22);

  var dayNames = ['일','월','화','수','목','금','토'];
  var cellW = (W-20)/7, cellH = 38;
  var startX = 10, startY = 36;

  ctx.font = '11px sans-serif';
  dayNames.forEach(function(d, i){
    ctx.fillStyle = i===0 ? '#F44336' : i===6 ? '#2196F3' : (isDark ? '#aaa' : '#666');
    ctx.fillText(d, startX + i*cellW + cellW/2, startY);
  });

  var loginDays = v15Load('login_days', []);
  var seasonEmoji = month >= 2 && month <= 4 ? '🌸' : month >= 5 && month <= 7 ? '🌻' : month >= 8 && month <= 10 ? '🍂' : '❄️';

  for(var d=1; d<=daysInMonth; d++){
    var col = (firstDay + d - 1) % 7;
    var row = Math.floor((firstDay + d - 1) / 7);
    var x = startX + col * cellW;
    var y = startY + 14 + row * cellH;

    var dateStr = year + '-' + String(month+1).padStart(2,'0') + '-' + String(d).padStart(2,'0');
    var isLoggedIn = loginDays.indexOf(dateStr) !== -1;
    var isToday = d === today;

    if(isToday){
      ctx.fillStyle = 'rgba(255,95,162,.15)';
      ctx.beginPath();
      ctx.roundRect(x+2, y-10, cellW-4, cellH-4, 8);
      ctx.fill();
      ctx.strokeStyle = '#FF5FA2';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(x+2, y-10, cellW-4, cellH-4, 8);
      ctx.stroke();
    } else if(isLoggedIn){
      ctx.fillStyle = 'rgba(76,175,80,.1)';
      ctx.beginPath();
      ctx.roundRect(x+2, y-10, cellW-4, cellH-4, 8);
      ctx.fill();
    }

    ctx.font = (isToday ? 'bold ' : '') + '12px sans-serif';
    ctx.fillStyle = isToday ? '#FF5FA2' : col===0 ? '#F44336' : col===6 ? '#2196F3' : (isDark ? '#ddd' : '#333');
    ctx.textAlign = 'center';
    ctx.fillText(d+'', x + cellW/2, y+4);

    if(isLoggedIn){
      ctx.font = '8px sans-serif';
      ctx.fillText('✅', x + cellW/2, y+16);
    }
  }

  ctx.font = '20px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(seasonEmoji, W-10, 22);
}

function openSeasonCalendarModal(){
  var modal = createV15Modal('v15CalV2Modal','시즌 이벤트 캘린더','📅', buildSeasonCalendarV2());
  modal.classList.add('show');
  trackV15Feature('calendar_v2');
  setTimeout(drawCalendarV2, 100);
}


// ============================================================
// 8. EMOTION STICKER COLLECTION (이모션스티커컬렉션)
// Collectible sticker album with rare stickers
// ============================================================
var V15_STICKERS = [
  {id:'s_romi_happy',name:'행복한 로미',emoji:'😊',cat:'로미',rarity:'N'},
  {id:'s_romi_brave',name:'용감한 로미',emoji:'💪',cat:'로미',rarity:'R'},
  {id:'s_romi_love',name:'사랑의 로미',emoji:'💗',cat:'로미',rarity:'SR'},
  {id:'s_hc_fly',name:'날아라 하츄핑',emoji:'🦋',cat:'하츄핑',rarity:'N'},
  {id:'s_hc_magic',name:'마법 하츄핑',emoji:'🪄',cat:'하츄핑',rarity:'R'},
  {id:'s_hc_mega',name:'메가 하츄핑',emoji:'⭐',cat:'하츄핑',rarity:'SSR'},
  {id:'s_baro_justice',name:'정의의 바로핑',emoji:'⚖️',cat:'바로핑',rarity:'N'},
  {id:'s_baro_shield',name:'방패 바로핑',emoji:'🛡️',cat:'바로핑',rarity:'R'},
  {id:'s_chacha_dance',name:'댄싱 차차핑',emoji:'💃',cat:'차차핑',rarity:'N'},
  {id:'s_chacha_star',name:'스타 차차핑',emoji:'🌟',cat:'차차핑',rarity:'SR'},
  {id:'s_lala_song',name:'노래하는 라라핑',emoji:'🎵',cat:'라라핑',rarity:'N'},
  {id:'s_lala_concert',name:'콘서트 라라핑',emoji:'🎤',cat:'라라핑',rarity:'SR'},
  {id:'s_kkong_snow',name:'눈꽃 꽁꽁핑',emoji:'❄️',cat:'꽁꽁핑',rarity:'R'},
  {id:'s_hae_sun',name:'태양 해핑',emoji:'☀️',cat:'해핑',rarity:'R'},
  {id:'s_tru_friend',name:'친구 트러핑',emoji:'🤝',cat:'트러핑',rarity:'SSR'},
  {id:'s_legend',name:'전설의 티니핑',emoji:'👑',cat:'레전드',rarity:'SSR'}
];

function buildStickerCollection(){
  var collected = v15Load('stickers', []);
  var total = V15_STICKERS.length;
  var pct = Math.round(collected.length / total * 100);
  var html = '<div style="font-size:12px;color:var(--text-sub);margin-bottom:10px;text-align:center">스티커를 모아 앨범을 완성하세요! 매일 1장 무료 뽑기!</div>';
  html += '<div style="text-align:center;margin-bottom:8px"><span style="font-size:11px">수집: <b style="color:#FF5FA2">'+collected.length+'/'+total+'</b> ('+pct+'%)</span></div>';
  html += '<div style="height:6px;background:rgba(0,0,0,.06);border-radius:3px;margin-bottom:10px;overflow:hidden"><div style="height:100%;width:'+pct+'%;background:linear-gradient(90deg,#FF5FA2,#B066FF);border-radius:3px"></div></div>';
  html += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:10px">';
  V15_STICKERS.forEach(function(st){
    var owned = collected.indexOf(st.id) !== -1;
    var rarityColor = st.rarity === 'SSR' ? '#FFD700' : st.rarity === 'SR' ? '#9370DB' : st.rarity === 'R' ? '#2196F3' : '#4CAF50';
    html += '<div style="padding:8px 4px;border-radius:10px;background:'+(owned ? 'linear-gradient(135deg,'+rarityColor+'12,'+rarityColor+'06)' : 'rgba(0,0,0,.03)')+';border:1px solid '+(owned ? rarityColor+'30' : 'transparent')+';text-align:center">';
    html += '<div style="font-size:22px">'+(owned ? st.emoji : '❓')+'</div>';
    html += '<div style="font-size:9px;font-weight:600;margin-top:2px">'+(owned ? st.name : '???')+'</div>';
    html += '<div style="font-size:8px;color:'+rarityColor+'">'+st.rarity+'</div>';
    html += '</div>';
  });
  html += '</div>';
  var lastDraw = v15Load('sticker_last_draw', '');
  var canDraw = lastDraw !== todayStrV15();
  html += '<div style="text-align:center"><button id="v15StickerDraw" style="padding:8px 20px;border:none;border-radius:12px;background:'+(canDraw ? 'linear-gradient(135deg,#FFD700,#FFA000)' : 'rgba(0,0,0,.1)')+';color:'+(canDraw ? '#fff' : '#aaa')+';font-size:12px;font-weight:700;cursor:'+(canDraw?'pointer':'default')+'" '+(canDraw?'':'disabled')+'>'+(canDraw ? '🎰 오늘의 무료 뽑기!' : '내일 다시 뽑기 가능')+'</button></div>';
  return html;
}

function openStickerModal(){
  var modal = createV15Modal('v15StickerModal','이모션 스티커 컬렉션','🏷️', buildStickerCollection());
  modal.classList.add('show');
  trackV15Feature('sticker');

  function bindStickerEvents(){
    var drawBtn = document.getElementById('v15StickerDraw');
    if(drawBtn && !drawBtn.disabled){
      drawBtn.addEventListener('click', function(){
        var collected = v15Load('stickers', []);
        var available = V15_STICKERS.filter(function(s){ return collected.indexOf(s.id) === -1; });
        if(available.length === 0){
          showToastV15('🎉 모든 스티커를 수집했습니다!');
          return;
        }
        var weights = available.map(function(s){ return s.rarity === 'SSR' ? 1 : s.rarity === 'SR' ? 3 : s.rarity === 'R' ? 5 : 8; });
        var totalW = weights.reduce(function(a,b){ return a+b; }, 0);
        var r = Math.random() * totalW;
        var sum = 0, picked = available[0];
        for(var i=0; i<available.length; i++){
          sum += weights[i];
          if(r < sum){ picked = available[i]; break; }
        }
        collected.push(picked.id);
        v15Save('stickers', collected);
        v15Save('sticker_last_draw', todayStrV15());
        var rarityColor = picked.rarity === 'SSR' ? '#FFD700' : picked.rarity === 'SR' ? '#9370DB' : '#2196F3';
        showToastV15(picked.emoji + ' ' + picked.name + ' 획득! (' + picked.rarity + ')');
        sfxV15Multi(['recipe_mix','recipe_success'], 150);
        modal.querySelector('.v15-modal-body').innerHTML = buildStickerCollection();
        bindStickerEvents();
      });
    }
  }
  bindStickerEvents();
}


// ============================================================
// QUIZ v15 (+15 questions, total 90→105)
// ============================================================
function injectExtraQuizV15(){
  if(!window.EXTRA_QUIZ) window.EXTRA_QUIZ = [];
  var q15 = [
    {q:'v15에서 추가된 변신 시스템의 총 변신 수는?',a:['8종','4종','6종','10종'],c:0},
    {q:'이모션 배틀 아레나에서 로미의 기본 HP는?',a:['100','80','120','90'],c:0},
    {q:'비밀 탐험 동굴에서 찾을 수 있는 최고 레어리티는?',a:['SSR','SR','R','N'],c:0},
    {q:'이모션 음악 밴드의 시퀀서는 몇 비트?',a:['8비트','4비트','16비트','12비트'],c:0},
    {q:'우정 도감의 최대 우정 레벨은?',a:['10','5','15','20'],c:0},
    {q:'마법 레시피 연구소의 재료 종류 수는?',a:['6종','4종','8종','10종'],c:0},
    {q:'무지개요정 변신의 해금 조건은?',a:['7종 변신 마스터','레벨 30','보스 10회','콤보 50회'],c:0},
    {q:'이모션 배틀에서 사용할 수 있는 액션은?',a:['공격/스킬/방어','공격/방어','공격/스킬','공격/회피/스킬'],c:0},
    {q:'스티커 컬렉션의 총 스티커 수는?',a:['16장','12장','20장','8장'],c:0},
    {q:'시즌 캘린더의 30일 출석 보상은?',a:['레전드 칭호','변신 해금권','별가루 x10','랜덤 재료'],c:0},
    {q:'불사조의 영약 조합에 필요한 재료 수는?',a:['3개','2개','4개','5개'],c:0},
    {q:'탐험 동굴에서 보물은 한 번에 몇 개 생성?',a:['3개','1개','5개','2개'],c:0},
    {q:'우정 도감에 등장하는 티니핑 수는?',a:['12명','8명','10명','16명'],c:0},
    {q:'전설의 티니핑 스티커의 레어리티는?',a:['SSR','SR','R','UR'],c:0},
    {q:'v15 패치의 신규 기능 수는?',a:['8종','6종','10종','4종'],c:0}
  ];
  q15.forEach(function(q){ window.EXTRA_QUIZ.push(q); });
}


// ============================================================
// ACHIEVEMENTS (+12, total 106→118)
// ============================================================
function injectV15Achievements(){
  if(!window.AD) return;
  var newAchievements = [
    {id:'a_v15_transform_first',name:'첫 변신',desc:'요정 변신을 처음 해금!',cat:'general',icon:'🦋'},
    {id:'a_v15_transform_all',name:'변신 마스터',desc:'모든 변신 해금!',cat:'general',icon:'🌈'},
    {id:'a_v15_arena_first',name:'첫 대전',desc:'아레나에서 첫 승리!',cat:'general',icon:'⚔️'},
    {id:'a_v15_arena_streak5',name:'5연승',desc:'아레나 5연승 달성!',cat:'general',icon:'🏆'},
    {id:'a_v15_cave_first',name:'동굴 탐험가',desc:'동굴 탐험 시작!',cat:'general',icon:'🕳️'},
    {id:'a_v15_cave_treasure5',name:'보물 사냥꾼',desc:'보물 5개 수집!',cat:'general',icon:'💎'},
    {id:'a_v15_band_first',name:'음악 데뷔',desc:'밴드 첫 연주!',cat:'general',icon:'🎵'},
    {id:'a_v15_friend_max',name:'최고의 친구',desc:'티니핑 1명 우정 MAX!',cat:'general',icon:'💕'},
    {id:'a_v15_recipe_first',name:'초보 연금술사',desc:'첫 레시피 조합!',cat:'general',icon:'🧪'},
    {id:'a_v15_recipe_all',name:'마스터 연금술사',desc:'모든 레시피 조합!',cat:'general',icon:'🏅'},
    {id:'a_v15_sticker_half',name:'스티커 수집가',desc:'스티커 8장 수집!',cat:'general',icon:'🏷️'},
    {id:'a_v15_explorer',name:'v15 탐험가',desc:'v15 기능 6종 이상 사용!',cat:'general',icon:'🗺️'}
  ];
  newAchievements.forEach(function(na){
    var exists = window.AD.some(function(a){ return a.id === na.id; });
    if(!exists) window.AD.push(na);
  });
}


// ============================================================
// ACHIEVEMENT AUTO-CHECK
// ============================================================
function checkAndAwardV15(){
  var a = {};
  try{ a = JSON.parse(localStorage.getItem('hatcuping_achievements') || '{}'); }catch(e){}
  function award(id){
    if(!a[id]){
      a[id] = Date.now();
      try{ localStorage.setItem('hatcuping_achievements', JSON.stringify(a)); }catch(e){}
      var ad = (window.AD || []).find(function(x){ return x.id === id; });
      if(ad) showToastV15('🏆 ' + ad.name + ' 업적 달성!');
    }
  }

  var transforms = v15Load('transforms', []);
  if(transforms.length >= 1) award('a_v15_transform_first');
  if(transforms.length >= 8) award('a_v15_transform_all');

  var arena = v15Load('arena_record', {});
  if(arena.wins >= 1) award('a_v15_arena_first');
  if(arena.best >= 5) award('a_v15_arena_streak5');

  var caves = v15Load('caves_explored', 0);
  if(caves >= 1) award('a_v15_cave_first');
  var treasures = v15Load('cave_treasures', []);
  if(treasures.length >= 5) award('a_v15_cave_treasure5');

  var bandSessions = v15Load('band_sessions', 0);
  if(bandSessions >= 1) award('a_v15_band_first');

  var friendData = v15Load('friendship', {});
  var maxFriend = false;
  Object.keys(friendData).forEach(function(k){ if(friendData[k].level >= 10) maxFriend = true; });
  if(maxFriend) award('a_v15_friend_max');

  var crafted = v15Load('recipe_crafted', []);
  if(crafted.length >= 1) award('a_v15_recipe_first');
  if(crafted.length >= 8) award('a_v15_recipe_all');

  var stickers = v15Load('stickers', []);
  if(stickers.length >= 8) award('a_v15_sticker_half');

  var features = [];
  try{ features = JSON.parse(localStorage.getItem('hatcuping_v15_features') || '[]'); }catch(e){}
  if(features.length >= 6) award('a_v15_explorer');
}


// ============================================================
// QUICK ACTION BUTTONS (하단 FAB)
// ============================================================
function injectV15QuickActions(){
  var navBar = document.querySelector('.v14-scroll-nav') || document.querySelector('.v13-scroll-nav') || document.querySelector('.v12-scroll-nav');
  if(!navBar) return;
  var btns = [
    {label:'변신',emoji:'🦋',fn:openTransformModal},
    {label:'배틀',emoji:'⚔️',fn:openArenaModal},
    {label:'동굴',emoji:'🕳️',fn:openCaveModal},
    {label:'밴드',emoji:'🎵',fn:openBandModal},
    {label:'우정',emoji:'💕',fn:openFriendshipModal},
    {label:'레시피',emoji:'🧪',fn:openRecipeModal},
    {label:'캘린더',emoji:'📅',fn:openSeasonCalendarModal},
    {label:'스티커',emoji:'🏷️',fn:openStickerModal}
  ];
  btns.forEach(function(b){
    var el = document.createElement('button');
    el.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:2px;padding:6px 10px;border:none;border-radius:12px;background:transparent;cursor:pointer;font-size:16px;transition:all .2s;flex-shrink:0';
    el.innerHTML = '<span>'+b.emoji+'</span><span style="font-size:9px;font-weight:600;color:var(--text-sub)">'+b.label+'</span>';
    el.addEventListener('click', b.fn);
    el.addEventListener('mouseenter', function(){ el.style.background = 'rgba(255,95,162,.1)'; });
    el.addEventListener('mouseleave', function(){ el.style.background = 'transparent'; });
    navBar.appendChild(el);
  });
}

function injectV15FAB(){
  var existing = document.querySelector('.v15-fab-container');
  if(existing) return;
  var navExists = document.querySelector('.v14-scroll-nav') || document.querySelector('.v13-scroll-nav');
  if(navExists) return;

  var container = document.createElement('div');
  container.className = 'v15-fab-container';
  container.style.cssText = 'position:fixed;bottom:0;left:0;right:0;background:var(--glass);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-top:1px solid var(--border);padding:6px 8px;display:flex;gap:4px;overflow-x:auto;z-index:900;justify-content:center;-webkit-overflow-scrolling:touch';
  container.classList.add('v15-scroll-nav');

  var btns = [
    {label:'변신',emoji:'🦋',fn:openTransformModal},
    {label:'배틀',emoji:'⚔️',fn:openArenaModal},
    {label:'동굴',emoji:'🕳️',fn:openCaveModal},
    {label:'밴드',emoji:'🎵',fn:openBandModal},
    {label:'우정',emoji:'💕',fn:openFriendshipModal},
    {label:'레시피',emoji:'🧪',fn:openRecipeModal},
    {label:'캘린더',emoji:'📅',fn:openSeasonCalendarModal},
    {label:'스티커',emoji:'🏷️',fn:openStickerModal}
  ];
  btns.forEach(function(b){
    var el = document.createElement('button');
    el.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:2px;padding:6px 10px;border:none;border-radius:12px;background:transparent;cursor:pointer;font-size:16px;transition:all .2s;flex-shrink:0';
    el.innerHTML = '<span>'+b.emoji+'</span><span style="font-size:9px;font-weight:600;color:var(--text-sub)">'+b.label+'</span>';
    el.addEventListener('click', b.fn);
    container.appendChild(el);
  });
  document.body.appendChild(container);
  document.body.style.paddingBottom = '70px';
}


// ============================================================
// KEYBOARD SHORTCUTS
// ============================================================
function injectV15Keyboard(){
  document.addEventListener('keydown', function(e){
    if(e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if(!e.shiftKey) return;
    switch(e.key){
      case 'T': case 't': e.preventDefault(); openTransformModal(); break;
      case 'B': case 'b': e.preventDefault(); openArenaModal(); break;
      case 'C': case 'c': e.preventDefault(); openCaveModal(); break;
      case 'M': case 'm': e.preventDefault(); openBandModal(); break;
      case 'F': case 'f': e.preventDefault(); openFriendshipModal(); break;
      case 'R': case 'r': e.preventDefault(); openRecipeModal(); break;
      case 'L': case 'l': e.preventDefault(); openSeasonCalendarModal(); break;
      case 'K': case 'k': e.preventDefault(); openStickerModal(); break;
    }
  });
}

function updateV15KeyboardHelp(){
  var kbModal = document.getElementById('kbHelp');
  if(!kbModal) return;
  var modal = kbModal.querySelector('.modal');
  if(!modal) return;
  var rows = [
    {key:'Shift+T',label:'요정 변신'},
    {key:'Shift+B',label:'배틀 아레나'},
    {key:'Shift+C',label:'동굴 탐험'},
    {key:'Shift+M',label:'음악 밴드'},
    {key:'Shift+F',label:'우정 도감'},
    {key:'Shift+R',label:'레시피 연구소'},
    {key:'Shift+L',label:'시즌 캘린더'},
    {key:'Shift+K',label:'스티커 컬렉션'}
  ];
  rows.forEach(function(r){
    var div = document.createElement('div');
    div.className = 'kb-help-row';
    div.innerHTML = '<span>'+r.label+'</span><span class="kb-help-key">'+r.key+'</span>';
    modal.appendChild(div);
  });
}


// ============================================================
// UPDATE FOOTER / NEWS / META
// ============================================================
function updateV15Footer(){
  var footer = document.querySelector('.footer');
  if(!footer) return;
  var links = footer.querySelector('.footer-links');
  if(links) links.innerHTML = '<span class="footer-link">4종 게임</span><span class="footer-link">118개 업적</span><span class="footer-link">오프라인 지원</span>';
  var ver = footer.querySelector('.version');
  if(ver) ver.innerHTML = 'v15.0 | &copy; PRIME Holdings NEXTERA+PRISM';
}

function updateV15News(){
  var newsSection = document.querySelector('.news-section');
  if(!newsSection) return;
  var firstItem = newsSection.querySelector('.news-item');
  if(!firstItem) return;
  var newItem = document.createElement('div');
  newItem.className = 'news-item';
  newItem.innerHTML = '<span class="news-date">v15.0</span><span class="news-text">요정변신8종, 배틀아레나8인, 비밀동굴탐험, 음악밴드시퀀서, 우정도감12종Radar, 마법레시피8종, 시즌캘린더v2, 스티커컬렉션16종, 퀴즈+15(105), 업적+12(118)</span>';
  firstItem.parentNode.insertBefore(newItem, firstItem);
}

function updateV15AchieveCount(){
  var el = document.getElementById('achieveCount');
  if(el){
    var c = 0;
    try{ c = Object.keys(JSON.parse(localStorage.getItem('hatcuping_achievements') || '{}')).length; }catch(e){}
    var t = window.AD ? window.AD.length : 118;
    el.textContent = c + '/' + t;
  }
}

function updateV15Meta(){
  var descMeta = document.querySelector('meta[name="description"]');
  if(descMeta) descMeta.content = '사랑의 하츄핑 v15.0 - 플랫포머 액션, 턴제 RPG, 오픈월드, UNIFIED 4종 게임. 업적 118개, 요정변신 8종, 배틀아레나 8인, 비밀동굴, 음악밴드, 우정도감 12종, 마법레시피 8종, 스티커 16종, 퀴즈 105문!';
  document.title = '사랑의 하츄핑 v15.0 - 게임 선택';
}


// ============================================================
// BOOT
// ============================================================
function bootV15(){
  injectV15Achievements();
  injectExtraQuizV15();
  injectV15QuickActions();
  injectV15Keyboard();
  updateV15KeyboardHelp();
  injectV15FAB();
  updateV15Footer();
  updateV15News();
  updateV15AchieveCount();
  updateV15Meta();
  checkAndAwardV15();
}

if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', bootV15);
} else {
  bootV15();
}

})();

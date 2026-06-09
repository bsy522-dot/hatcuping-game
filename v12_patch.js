// hatcuping-game v12_patch.js - NEXTERA+PRISM AUTO v12.0
// Self-contained patch module (1100+ lines, 45 functions)
(function(){
'use strict';

// ============================================================
// UTILITY: SFX ENGINE (23 sound types)
// ============================================================
var _v12Ctx = null;
function _v12InitAudio(){
  if(!_v12Ctx){
    try{ _v12Ctx = new (window.AudioContext || window.webkitAudioContext)(); }catch(e){}
  }
  if(_v12Ctx && _v12Ctx.state === 'suspended') _v12Ctx.resume();
}

var SFX_MAP = {
  map_open:{f:660,d:.06,t:'triangle'},map_click:{f:880,d:.04,t:'sine'},
  card_open:{f:700,d:.06,t:'triangle'},card_gacha:{f:520,d:.12,t:'sawtooth'},card_ssr:{f:1047,d:.2,t:'triangle'},
  boss_open:{f:440,d:.08,t:'square'},boss_attack:{f:330,d:.05,t:'sawtooth'},boss_skill:{f:990,d:.1,t:'triangle'},boss_heal:{f:784,d:.1,t:'sine'},boss_win:{f:1047,d:.15,t:'triangle'},boss_lose:{f:220,d:.2,t:'sawtooth'},
  xp_open:{f:600,d:.06,t:'triangle'},xp_train:{f:880,d:.08,t:'sine'},xp_levelup:{f:1047,d:.15,t:'triangle'},
  share_open:{f:700,d:.06,t:'triangle'},share_save:{f:880,d:.08,t:'sine'},
  journal_open:{f:550,d:.06,t:'triangle'},journal_save:{f:660,d:.06,t:'sine'},
  jukebox_open:{f:523,d:.06,t:'triangle'},jukebox_play:{f:784,d:.08,t:'sine'},
  guide_open:{f:600,d:.06,t:'triangle'},guide_read:{f:700,d:.05,t:'sine'},
  quiz_correct:{f:880,d:.08,t:'triangle'}
};

function sfxV12(type){
  _v12InitAudio();
  if(!_v12Ctx) return;
  var s = SFX_MAP[type];
  if(!s) return;
  try{
    var muted = false;
    try{ muted = localStorage.getItem('hatcuping_mute') === '1'; }catch(e){}
    if(muted) return;
    var osc = _v12Ctx.createOscillator();
    var gain = _v12Ctx.createGain();
    osc.type = s.t || 'sine';
    osc.frequency.value = s.f;
    gain.gain.value = 0.08;
    osc.connect(gain);
    gain.connect(_v12Ctx.destination);
    osc.start();
    osc.stop(_v12Ctx.currentTime + (s.d || 0.06));
  }catch(e){}
}

function trackV12Feature(id){
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
// 1. WORLD MAP (이모션 왕국 월드맵)
// ============================================================
var MAP_LOCATIONS = [
  {id:'forest',name:'이모션 숲',icon:'&#x1F333;',desc:'하츄핑과 처음 만나는 곳',x:0.2,y:0.35,color:'#4CAF50',game:'hatcuping-game-v2.html'},
  {id:'crystal',name:'크리스탈 동굴',icon:'&#x1F48E;',desc:'빛나는 보석의 미로',x:0.45,y:0.55,color:'#9C27B0',game:'hatcuping-rpg-v2.html'},
  {id:'cloud',name:'구름의 성',icon:'&#x2601;&#xFE0F;',desc:'하늘 위의 왕국',x:0.7,y:0.3,color:'#2196F3',game:'rpg-v3/index.html'},
  {id:'final',name:'사랑의 궁전',icon:'&#x1F3F0;',desc:'최종 결전의 장소',x:0.85,y:0.6,color:'#FF5FA2',game:'hatcuping-unified.html'}
];

function openWorldMap(){
  if(document.getElementById('worldMapModal')) return;
  trackV12Feature('worldmap');
  sfxV12('map_open');

  var overlay = document.createElement('div');
  overlay.id = 'worldMapModal';
  overlay.className = 'modal-overlay show';
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');

  var html = '<div class="modal" style="max-width:460px;padding:16px">';
  html += '<button class="modal-close" id="mapClose" aria-label="&#xB2EB;&#xAE30;">&times;</button>';
  html += '<h3 style="font-size:17px">&#x1F5FA;&#xFE0F; &#xC774;&#xBAA8;&#xC158; &#xC655;&#xAD6D; &#xC6D4;&#xB4DC;&#xB9F5;</h3>';
  html += '<canvas id="worldMapCanvas" width="420" height="280" style="width:100%;border-radius:12px;cursor:pointer;background:#1a1040"></canvas>';
  html += '<div id="mapInfo" style="margin-top:8px;font-size:12px;color:var(--text-sub);text-align:center;min-height:20px"></div>';
  html += '</div>';
  overlay.innerHTML = html;
  document.body.appendChild(overlay);

  var canvas = document.getElementById('worldMapCanvas');
  var ctx = canvas.getContext('2d');
  var hoveredIdx = -1;

  function getProgress(id){
    var keys = {forest:'hatcuping_plat_progress',crystal:'hatcuping_rpg_progress',cloud:'hatcuping_v3_progress',final:'hatcuping_uni_progress'};
    try{ return parseInt(localStorage.getItem(keys[id])) || 0; }catch(e){ return 0; }
  }

  function isDark(){ return document.body.classList.contains('dark'); }

  function drawMap(){
    var w = canvas.width, h = canvas.height;
    // Background gradient
    var grd = ctx.createLinearGradient(0,0,w,h);
    if(isDark()){
      grd.addColorStop(0,'#0d0825');
      grd.addColorStop(0.5,'#1a0a3e');
      grd.addColorStop(1,'#0d1030');
    } else {
      grd.addColorStop(0,'#E8F5E9');
      grd.addColorStop(0.5,'#E3F2FD');
      grd.addColorStop(1,'#F3E5F5');
    }
    ctx.fillStyle = grd;
    ctx.fillRect(0,0,w,h);

    // Dotted path between locations
    ctx.strokeStyle = isDark() ? 'rgba(255,255,255,.2)' : 'rgba(0,0,0,.15)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6,4]);
    ctx.beginPath();
    for(var i = 0; i < MAP_LOCATIONS.length; i++){
      var loc = MAP_LOCATIONS[i];
      var lx = loc.x * w, ly = loc.y * h;
      if(i === 0) ctx.moveTo(lx, ly);
      else ctx.lineTo(lx, ly);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw locations
    MAP_LOCATIONS.forEach(function(loc, idx){
      var lx = loc.x * w, ly = loc.y * h;
      var r = hoveredIdx === idx ? 28 : 22;
      var prog = getProgress(loc.id);

      // Glow
      if(hoveredIdx === idx){
        ctx.save();
        ctx.shadowColor = loc.color;
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(lx, ly, r + 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,.1)';
        ctx.fill();
        ctx.restore();
      }

      // Circle bg
      ctx.beginPath();
      ctx.arc(lx, ly, r, 0, Math.PI * 2);
      ctx.fillStyle = loc.color;
      ctx.fill();

      // Progress ring
      if(prog > 0){
        ctx.beginPath();
        ctx.arc(lx, ly, r + 4, -Math.PI/2, -Math.PI/2 + (Math.PI*2 * Math.min(prog,100)/100));
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      // Icon text (emoji)
      ctx.fillStyle = '#fff';
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(loc.icon.replace(/&#x([0-9A-Fa-f]+);/g, function(m,c){ return String.fromCodePoint(parseInt(c,16)); }), lx, ly);

      // Name label
      ctx.font = (hoveredIdx === idx ? 'bold ' : '') + '11px sans-serif';
      ctx.fillStyle = isDark() ? '#ddd' : '#333';
      ctx.fillText(loc.name, lx, ly + r + 14);
    });

    // Title
    ctx.font = 'bold 14px sans-serif';
    ctx.fillStyle = isDark() ? '#FFD700' : '#FF5FA2';
    ctx.textAlign = 'center';
    ctx.fillText('&#xC774;&#xBAA8;&#xC158; &#xC655;&#xAD6D;'.replace(/&#x([0-9A-Fa-f]+);/g, function(m,c){ return String.fromCodePoint(parseInt(c,16)); }), w/2, 20);
  }

  function getLocAt(mx, my){
    var rect = canvas.getBoundingClientRect();
    var sx = canvas.width / rect.width;
    var sy = canvas.height / rect.height;
    var cx = (mx - rect.left) * sx;
    var cy = (my - rect.top) * sy;
    for(var i = 0; i < MAP_LOCATIONS.length; i++){
      var loc = MAP_LOCATIONS[i];
      var dx = cx - loc.x * canvas.width;
      var dy = cy - loc.y * canvas.height;
      if(Math.sqrt(dx*dx + dy*dy) < 30) return i;
    }
    return -1;
  }

  canvas.addEventListener('mousemove', function(e){
    var idx = getLocAt(e.clientX, e.clientY);
    if(idx !== hoveredIdx){
      hoveredIdx = idx;
      drawMap();
      var info = document.getElementById('mapInfo');
      if(info){
        if(idx >= 0){
          var loc = MAP_LOCATIONS[idx];
          var prog = getProgress(loc.id);
          info.innerHTML = '<b>' + loc.name + '</b> - ' + loc.desc + ' (&#xC9C4;&#xD589;: ' + prog + '%)';
        } else {
          info.innerHTML = '&#xC7A5;&#xC18C;&#xB97C; &#xD074;&#xB9AD;&#xD558;&#xBA74; &#xAC8C;&#xC784;&#xC73C;&#xB85C; &#xC774;&#xB3D9;&#xD569;&#xB2C8;&#xB2E4;';
        }
      }
    }
  });

  canvas.addEventListener('click', function(e){
    var idx = getLocAt(e.clientX, e.clientY);
    if(idx >= 0){
      sfxV12('map_click');
      window.location.href = MAP_LOCATIONS[idx].game;
    }
  });

  drawMap();
  document.getElementById('mapClose').onclick = function(){ overlay.remove(); };
  overlay.onclick = function(e){ if(e.target === overlay) overlay.remove(); };
}


// ============================================================
// 2. TINIPING CARD COLLECTION (티니핑 카드 컬렉션 24장)
// ============================================================
var CARD_DATA = [
  {id:'c_romi',name:'로미',grade:'SSR',attr:'사랑',icon:'&#x1F467;',color:'#FF5FA2'},
  {id:'c_hachuping',name:'하츄핑',grade:'SSR',attr:'사랑',icon:'&#x1F496;',color:'#FF69B4'},
  {id:'c_baroping',name:'바로핑',grade:'SR',attr:'정의',icon:'&#x2694;&#xFE0F;',color:'#4169E1'},
  {id:'c_chacha',name:'차차핑',grade:'SR',attr:'용기',icon:'&#x1F525;',color:'#FF6347'},
  {id:'c_kkongkkong',name:'꽁꽁핑',grade:'SR',attr:'얼음',icon:'&#x2744;&#xFE0F;',color:'#00CED1'},
  {id:'c_bukkeuk',name:'부끄핑',grade:'R',attr:'수줍음',icon:'&#x1F33A;',color:'#FFB6C1'},
  {id:'c_lala',name:'라라핑',grade:'SR',attr:'음악',icon:'&#x1F3B5;',color:'#9370DB'},
  {id:'c_truring',name:'트러핑',grade:'SSR',attr:'어둠',icon:'&#x1F47F;',color:'#8B0000'},
  {id:'c_sticking',name:'스틱핑',grade:'R',attr:'마법',icon:'&#x2B50;',color:'#FFD700'},
  {id:'c_liam',name:'리암',grade:'R',attr:'힘',icon:'&#x1F4AA;',color:'#CD853F'},
  {id:'c_monju',name:'몬주',grade:'R',attr:'지혜',icon:'&#x1F4D6;',color:'#6B8E23'},
  {id:'c_hacking',name:'해킹',grade:'SSR',attr:'혼돈',icon:'&#x1F5A5;&#xFE0F;',color:'#2F4F4F'},
  {id:'c_heartring',name:'하트핑',grade:'SR',attr:'치유',icon:'&#x1F49D;',color:'#FF1493'},
  {id:'c_happying',name:'해피핑',grade:'R',attr:'기쁨',icon:'&#x1F60A;',color:'#FFA500'},
  {id:'c_angrying',name:'앙그핑',grade:'R',attr:'분노',icon:'&#x1F620;',color:'#DC143C'},
  {id:'c_sadping',name:'새드핑',grade:'R',attr:'슬픔',icon:'&#x1F622;',color:'#4682B4'},
  {id:'c_scareping',name:'스케핑',grade:'R',attr:'공포',icon:'&#x1F631;',color:'#483D8B'},
  {id:'c_shield',name:'실드핑',grade:'SR',attr:'방어',icon:'&#x1F6E1;&#xFE0F;',color:'#2E8B57'},
  {id:'c_speed',name:'스피드핑',grade:'R',attr:'속도',icon:'&#x1F4A8;',color:'#00BFFF'},
  {id:'c_powerping',name:'파워핑',grade:'SR',attr:'파워',icon:'&#x1F4A5;',color:'#B22222'},
  {id:'c_healping',name:'힐핑',grade:'R',attr:'회복',icon:'&#x1F33F;',color:'#3CB371'},
  {id:'c_wiseping',name:'위즈핑',grade:'R',attr:'마법',icon:'&#x1F52E;',color:'#7B68EE'},
  {id:'c_queen',name:'여왕님',grade:'SSR',attr:'통치',icon:'&#x1F451;',color:'#DAA520'},
  {id:'c_legend',name:'전설의 티니핑',grade:'SSR',attr:'전설',icon:'&#x1F31F;',color:'#FF4500'}
];

var GACHA_WEIGHTS = {N:0,R:55,SR:30,SSR:15};

function getCardCollection(){
  try{ return JSON.parse(localStorage.getItem('hatcuping_cards') || '[]'); }catch(e){ return []; }
}
function saveCardCollection(arr){
  try{ localStorage.setItem('hatcuping_cards', JSON.stringify(arr)); }catch(e){}
}

function doGacha(){
  var roll = Math.random() * 100;
  var grade;
  if(roll < GACHA_WEIGHTS.SSR) grade = 'SSR';
  else if(roll < GACHA_WEIGHTS.SSR + GACHA_WEIGHTS.SR) grade = 'SR';
  else grade = 'R';

  var pool = CARD_DATA.filter(function(c){ return c.grade === grade; });
  var card = pool[Math.floor(Math.random() * pool.length)];
  var coll = getCardCollection();
  if(coll.indexOf(card.id) === -1){
    coll.push(card.id);
    saveCardCollection(coll);
  }

  checkAndAwardV12();
  return card;
}

function openCardCollection(){
  if(document.getElementById('cardModal')) return;
  trackV12Feature('cards');
  sfxV12('card_open');

  var overlay = document.createElement('div');
  overlay.id = 'cardModal';
  overlay.className = 'modal-overlay show';
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');

  var coll = getCardCollection();
  var html = '<div class="modal" style="max-width:440px">';
  html += '<button class="modal-close" id="cardClose" aria-label="&#xB2EB;&#xAE30;">&times;</button>';
  html += '<h3 style="font-size:17px">&#x1F0CF; &#xD2F0;&#xB2C8;&#xD551; &#xCE74;&#xB4DC; &#xCEEC;&#xB809;&#xC158; (' + coll.length + '/' + CARD_DATA.length + ')</h3>';
  html += '<div style="text-align:center;margin-bottom:12px"><button id="gachaBtn" style="padding:10px 24px;background:linear-gradient(135deg,#FFD700,#FF8C00);color:#fff;border:none;border-radius:14px;font-size:14px;font-weight:700;cursor:pointer;transition:transform .2s">&#x2728; &#xAC00;&#xCC28; &#xBF51;&#xAE30;!</button></div>';
  html += '<div id="gachaResult" style="text-align:center;min-height:24px;margin-bottom:10px;font-size:13px"></div>';
  html += '<div id="cardGrid" style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;max-height:320px;overflow-y:auto">';
  CARD_DATA.forEach(function(c){
    var owned = coll.indexOf(c.id) !== -1;
    var gradeColor = c.grade === 'SSR' ? '#FFD700' : c.grade === 'SR' ? '#C0C0C0' : '#CD7F32';
    html += '<div style="padding:8px 4px;border-radius:10px;text-align:center;font-size:10px;background:' + (owned ? 'rgba(255,215,0,.1)' : 'rgba(0,0,0,.04)') + ';border:1px solid ' + (owned ? gradeColor : 'transparent') + ';opacity:' + (owned ? '1' : '.4') + '">';
    html += '<div style="font-size:22px">' + (owned ? c.icon : '&#x1F512;') + '</div>';
    html += '<div style="font-weight:700;margin-top:2px">' + (owned ? c.name : '???') + '</div>';
    html += '<div style="color:' + gradeColor + ';font-weight:700;font-size:9px">' + c.grade + '</div>';
    html += '</div>';
  });
  html += '</div></div>';
  overlay.innerHTML = html;
  document.body.appendChild(overlay);

  document.getElementById('gachaBtn').onclick = function(){
    sfxV12('card_gacha');
    var card = doGacha();
    var result = document.getElementById('gachaResult');
    var gradeColor = card.grade === 'SSR' ? '#FFD700' : card.grade === 'SR' ? '#C0C0C0' : '#CD7F32';
    result.innerHTML = card.icon + ' <b style="color:' + gradeColor + '">[' + card.grade + ']</b> ' + card.name + ' &#xD68D;&#xB4DD;!';
    if(card.grade === 'SSR') sfxV12('card_ssr');
    // Refresh modal
    setTimeout(function(){ overlay.remove(); openCardCollection(); }, 800);
  };

  document.getElementById('cardClose').onclick = function(){ overlay.remove(); };
  overlay.onclick = function(e){ if(e.target === overlay) overlay.remove(); };
}


// ============================================================
// 3. BOSS RUSH MODE (보스 러시 5라운드)
// ============================================================
var BOSS_RUSH = [
  {id:'shadow',name:'어둠의 트러핑',hp:120,atk:18,def:8,icon:'&#x1F47F;',color:'#4B0082'},
  {id:'ice',name:'얼음 드래곤',hp:160,atk:22,def:12,icon:'&#x1F409;',color:'#00CED1'},
  {id:'fire',name:'불꽃 페닉스',hp:200,atk:26,def:10,icon:'&#x1F525;',color:'#FF4500'},
  {id:'storm',name:'폭풍 타이탄',hp:240,atk:30,def:14,icon:'&#x26A1;',color:'#1E90FF'},
  {id:'chaos',name:'카오스 로드',hp:300,atk:35,def:18,icon:'&#x1F480;',color:'#8B0000'}
];

function getBossRushProgress(){
  try{ return JSON.parse(localStorage.getItem('hatcuping_boss_rush') || '{}'); }catch(e){ return {}; }
}

function openBossRush(){
  if(document.getElementById('bossRushModal')) return;
  trackV12Feature('bossrush');
  sfxV12('boss_open');

  var overlay = document.createElement('div');
  overlay.id = 'bossRushModal';
  overlay.className = 'modal-overlay show';
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');

  var prog = getBossRushProgress();
  var html = '<div class="modal" style="max-width:420px">';
  html += '<button class="modal-close" id="bossRushClose" aria-label="&#xB2EB;&#xAE30;">&times;</button>';
  html += '<h3 style="font-size:17px">&#x2694;&#xFE0F; &#xBCF4;&#xC2A4; &#xB7EC;&#xC2DC; &#xBAA8;&#xB4DC;</h3>';
  html += '<div style="font-size:12px;color:var(--text-sub);margin-bottom:12px">5&#xB77C;&#xC6B4;&#xB4DC; &#xC5F0;&#xC18D; &#xBCF4;&#xC2A4;&#xC804;! &#xACF5;&#xACA9;/&#xC2A4;&#xD0AC;/&#xD78C; 3&#xAC00;&#xC9C0; &#xC561;&#xC158;.</div>';

  BOSS_RUSH.forEach(function(boss, idx){
    var cleared = !!prog[boss.id];
    var unlocked = idx === 0 || !!prog[BOSS_RUSH[idx-1].id];
    html += '<div class="br-card" data-idx="' + idx + '" style="display:flex;gap:10px;padding:12px;margin-bottom:8px;border-radius:14px;background:' + (cleared ? 'rgba(76,175,80,.08)' : 'rgba(255,95,162,.05)') + ';border:1px solid ' + (cleared ? '#4CAF50' : 'var(--border)') + ';cursor:' + (unlocked ? 'pointer' : 'not-allowed') + ';opacity:' + (unlocked ? '1' : '.5') + ';transition:all .2s">';
    html += '<div style="width:44px;height:44px;border-radius:12px;background:' + boss.color + ';display:flex;align-items:center;justify-content:center;font-size:22px">' + boss.icon + '</div>';
    html += '<div style="flex:1"><div style="font-size:14px;font-weight:700">' + (idx+1) + '. ' + boss.name + '</div>';
    html += '<div style="font-size:11px;color:var(--text-sub)">HP ' + boss.hp + ' / ATK ' + boss.atk + ' / DEF ' + boss.def + '</div>';
    if(cleared) html += '<div style="font-size:10px;color:#4CAF50;font-weight:700;margin-top:2px">&#x2705; &#xD074;&#xB9AC;&#xC5B4;</div>';
    html += '</div></div>';
  });
  html += '</div>';
  overlay.innerHTML = html;
  document.body.appendChild(overlay);

  overlay.querySelectorAll('.br-card').forEach(function(card){
    card.onclick = function(){
      var idx = parseInt(card.dataset.idx);
      var boss = BOSS_RUSH[idx];
      var unlocked = idx === 0 || !!prog[BOSS_RUSH[idx-1].id];
      if(!unlocked) return;
      startBossRushBattle(overlay, boss);
    };
  });

  document.getElementById('bossRushClose').onclick = function(){ overlay.remove(); };
  overlay.onclick = function(e){ if(e.target === overlay) overlay.remove(); };
}

function startBossRushBattle(overlay, boss){
  var playerHP = 150, playerMaxHP = 150, playerATK = 25, playerDEF = 10;
  var bossHP = boss.hp, bossMaxHP = boss.hp;
  var skillCooldown = 0;
  var log = [];

  function addLog(msg){ log.push(msg); if(log.length > 4) log.shift(); }

  function renderBattle(){
    var html = '<div class="modal" style="max-width:400px;padding:16px">';
    html += '<h3 style="font-size:15px;margin-bottom:8px">' + boss.icon + ' vs &#x1F467; &#xB85C;&#xBBF8;</h3>';

    // Boss HP bar
    html += '<div style="margin-bottom:6px"><div style="display:flex;justify-content:space-between;font-size:11px;font-weight:700"><span style="color:' + boss.color + '">' + boss.name + '</span><span>' + Math.max(0,bossHP) + '/' + bossMaxHP + '</span></div>';
    html += '<div style="height:10px;background:rgba(0,0,0,.1);border-radius:5px;overflow:hidden"><div style="width:' + (Math.max(0,bossHP)/bossMaxHP*100) + '%;height:100%;background:' + boss.color + ';border-radius:5px;transition:width .3s"></div></div></div>';

    // Player HP bar
    html += '<div style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;font-size:11px;font-weight:700"><span style="color:#FF5FA2">&#xB85C;&#xBBF8;</span><span>' + Math.max(0,playerHP) + '/' + playerMaxHP + '</span></div>';
    html += '<div style="height:10px;background:rgba(0,0,0,.1);border-radius:5px;overflow:hidden"><div style="width:' + (Math.max(0,playerHP)/playerMaxHP*100) + '%;height:100%;background:linear-gradient(90deg,#FF5FA2,#FFB8D9);border-radius:5px;transition:width .3s"></div></div></div>';

    // Log
    html += '<div style="background:rgba(0,0,0,.04);border-radius:10px;padding:8px;margin-bottom:10px;min-height:60px;font-size:11px;color:var(--text-sub)">';
    log.forEach(function(l){ html += '<div>' + l + '</div>'; });
    html += '</div>';

    // Actions
    html += '<div style="display:flex;gap:6px">';
    html += '<button class="br-act" data-act="attack" style="flex:1;padding:10px;border:none;border-radius:12px;background:linear-gradient(135deg,#FF5FA2,#FF8EC4);color:#fff;font-weight:700;font-size:13px;cursor:pointer">&#x2694;&#xFE0F; &#xACF5;&#xACA9;</button>';
    html += '<button class="br-act" data-act="skill" style="flex:1;padding:10px;border:none;border-radius:12px;background:linear-gradient(135deg,#B066FF,#D4A0FF);color:#fff;font-weight:700;font-size:13px;cursor:pointer' + (skillCooldown > 0 ? ';opacity:.5' : '') + '">&#x2728; &#xC2A4;&#xD0AC;' + (skillCooldown > 0 ? '(' + skillCooldown + ')' : '') + '</button>';
    html += '<button class="br-act" data-act="heal" style="flex:1;padding:10px;border:none;border-radius:12px;background:linear-gradient(135deg,#4CAF50,#81C784);color:#fff;font-weight:700;font-size:13px;cursor:pointer">&#x1F49A; &#xD78C;</button>';
    html += '</div></div>';

    overlay.innerHTML = html;

    overlay.querySelectorAll('.br-act').forEach(function(btn){
      btn.onclick = function(){ doAction(btn.dataset.act); };
    });
  }

  function doAction(act){
    if(bossHP <= 0 || playerHP <= 0) return;

    // Player turn
    if(act === 'attack'){
      var dmg = Math.max(1, playerATK - boss.def + Math.floor(Math.random() * 8));
      bossHP -= dmg;
      addLog('&#x1F467; &#xB85C;&#xBBF8; &#xACF5;&#xACA9;! ' + dmg + ' &#xB370;&#xBBF8;&#xC9C0;');
      sfxV12('boss_attack');
    } else if(act === 'skill'){
      if(skillCooldown > 0){ addLog('&#x26A0;&#xFE0F; &#xC2A4;&#xD0AC; &#xCFE8;&#xB2E4;&#xC6B4; &#xC911;!'); renderBattle(); return; }
      var dmg2 = Math.max(1, Math.floor(playerATK * 1.8) - boss.def + Math.floor(Math.random() * 12));
      bossHP -= dmg2;
      skillCooldown = 3;
      addLog('&#x2728; &#xD558;&#xD2B8; &#xC5B4;&#xD0DD;! ' + dmg2 + ' &#xB370;&#xBBF8;&#xC9C0;!');
      sfxV12('boss_skill');
    } else if(act === 'heal'){
      var healAmt = 30 + Math.floor(Math.random() * 15);
      playerHP = Math.min(playerMaxHP, playerHP + healAmt);
      addLog('&#x1F49A; &#xD78C;&#xB9C1;! HP +' + healAmt);
      sfxV12('boss_heal');
    }

    if(skillCooldown > 0 && act !== 'skill') skillCooldown--;

    // Check boss dead
    if(bossHP <= 0){
      addLog('&#x1F389; ' + boss.name + ' &#xACA9;&#xD30C;!');
      sfxV12('boss_win');
      var prog2 = getBossRushProgress();
      prog2[boss.id] = Date.now();
      try{ localStorage.setItem('hatcuping_boss_rush', JSON.stringify(prog2)); }catch(e){}
      checkAndAwardV12();
      showToastV12('&#x2694;&#xFE0F; ' + boss.name + ' &#xACA9;&#xD30C;!');
      renderBattle();
      setTimeout(function(){ overlay.remove(); openBossRush(); }, 1500);
      return;
    }

    // Boss turn
    var bossDmg = Math.max(1, boss.atk - playerDEF + Math.floor(Math.random() * 6));
    playerHP -= bossDmg;
    addLog(boss.icon + ' ' + boss.name + ' &#xACF5;&#xACA9;! ' + bossDmg + ' &#xB370;&#xBBF8;&#xC9C0;');

    if(playerHP <= 0){
      addLog('&#x1F4A2; &#xD328;&#xBC30;...');
      sfxV12('boss_lose');
      showToastV12('&#x1F4A2; ' + boss.name + '&#xC5D0;&#xAC8C; &#xD328;&#xBC30;...');
    }

    renderBattle();
  }

  addLog('&#x2694;&#xFE0F; ' + boss.name + '&#xC640;&#xC758; &#xC804;&#xD22C; &#xC2DC;&#xC791;!');
  renderBattle();
}


// ============================================================
// 4. XP LEVEL SYSTEM (레벨 시스템 1-30)
// ============================================================
var LEVEL_TITLES = [
  {lv:1,title:'견습생',icon:'&#x1F331;'},
  {lv:5,title:'수련생',icon:'&#x1F3AF;'},
  {lv:10,title:'모험가',icon:'&#x2694;&#xFE0F;'},
  {lv:15,title:'영웅',icon:'&#x1F6E1;&#xFE0F;'},
  {lv:20,title:'챔피언',icon:'&#x1F3C6;'},
  {lv:25,title:'전설',icon:'&#x1F31F;'},
  {lv:30,title:'이모션 마스터',icon:'&#x1F451;'}
];

function getXPData(){
  try{
    var d = JSON.parse(localStorage.getItem('hatcuping_xp_data') || 'null');
    if(!d) d = {xp:0, level:1};
    return d;
  }catch(e){ return {xp:0, level:1}; }
}

function saveXPData(d){
  try{ localStorage.setItem('hatcuping_xp_data', JSON.stringify(d)); }catch(e){}
}

function xpForLevel(lv){ return lv * 100 + (lv - 1) * 50; }

function getLevelTitle(lv){
  var title = LEVEL_TITLES[0];
  for(var i = LEVEL_TITLES.length - 1; i >= 0; i--){
    if(lv >= LEVEL_TITLES[i].lv){ title = LEVEL_TITLES[i]; break; }
  }
  return title;
}

function addTrainingXP(){
  var d = getXPData();
  var gain = 20 + Math.floor(Math.random() * 30);
  d.xp += gain;
  var needed = xpForLevel(d.level);
  var leveled = false;
  while(d.xp >= needed && d.level < 30){
    d.xp -= needed;
    d.level++;
    needed = xpForLevel(d.level);
    leveled = true;
  }
  if(d.level >= 30) d.level = 30;
  saveXPData(d);
  checkAndAwardV12();
  sfxV12(leveled ? 'xp_levelup' : 'xp_train');
  return {gain: gain, leveled: leveled, data: d};
}

function openXPLevel(){
  if(document.getElementById('xpModal')) return;
  trackV12Feature('xplevel');
  sfxV12('xp_open');

  var overlay = document.createElement('div');
  overlay.id = 'xpModal';
  overlay.className = 'modal-overlay show';
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');

  function renderXP(){
    var d = getXPData();
    var needed = xpForLevel(d.level);
    var pct = d.level >= 30 ? 100 : Math.round(d.xp / needed * 100);
    var title = getLevelTitle(d.level);

    var html = '<div class="modal" style="max-width:380px">';
    html += '<button class="modal-close" id="xpClose" aria-label="&#xB2EB;&#xAE30;">&times;</button>';
    html += '<h3 style="font-size:17px">&#x1F4CA; XP &#xB808;&#xBCA8; &#xC2DC;&#xC2A4;&#xD15C;</h3>';

    html += '<div style="text-align:center;padding:16px 0">';
    html += '<div style="font-size:36px">' + title.icon + '</div>';
    html += '<div style="font-size:20px;font-weight:800;color:var(--pink)">Lv.' + d.level + '</div>';
    html += '<div style="font-size:14px;font-weight:700;color:var(--text-sub)">' + title.title + '</div>';
    html += '<div style="margin-top:8px;height:12px;background:rgba(0,0,0,.08);border-radius:6px;overflow:hidden"><div style="width:' + pct + '%;height:100%;background:linear-gradient(90deg,#FFD700,#FF8C00);border-radius:6px;transition:width .4s"></div></div>';
    html += '<div style="font-size:11px;color:var(--text-sub);margin-top:4px">' + (d.level >= 30 ? 'MAX LEVEL!' : d.xp + ' / ' + needed + ' XP (' + pct + '%)') + '</div>';
    html += '</div>';

    // Level titles list
    html += '<div style="font-size:12px;margin-bottom:10px">';
    LEVEL_TITLES.forEach(function(t){
      var active = d.level >= t.lv;
      html += '<div style="display:flex;align-items:center;gap:6px;padding:4px 0;opacity:' + (active ? '1' : '.4') + '">';
      html += '<span>' + t.icon + '</span><span style="font-weight:' + (active ? '700' : '400') + '">Lv.' + t.lv + '+ ' + t.title + '</span>';
      if(active) html += '<span style="color:#4CAF50;font-size:10px">&#x2705;</span>';
      html += '</div>';
    });
    html += '</div>';

    // Training button
    html += '<div style="text-align:center"><button id="trainBtn" style="padding:10px 24px;background:linear-gradient(135deg,var(--pink),var(--purple));color:#fff;border:none;border-radius:14px;font-size:14px;font-weight:700;cursor:pointer;transition:transform .2s">&#x1F3CB;&#xFE0F; &#xD2B8;&#xB808;&#xC774;&#xB2DD;!</button>';
    html += '<div id="trainResult" style="font-size:12px;margin-top:6px;min-height:18px;color:var(--text-sub)"></div></div>';
    html += '</div>';

    overlay.innerHTML = html;
    document.getElementById('xpClose').onclick = function(){ overlay.remove(); };
    document.getElementById('trainBtn').onclick = function(){
      var res = addTrainingXP();
      document.getElementById('trainResult').innerHTML = '&#x1F4AA; +' + res.gain + ' XP!' + (res.leveled ? ' &#x1F389; &#xB808;&#xBCA8;&#xC5C5;! Lv.' + res.data.level : '');
      setTimeout(function(){ renderXP(); }, 600);
    };
    overlay.onclick = function(e){ if(e.target === overlay) overlay.remove(); };
  }

  renderXP();
}


// ============================================================
// 5. SHARE CARD (공유 카드)
// ============================================================
function openShareCard(){
  if(document.getElementById('shareCardModal')) return;
  trackV12Feature('sharecard');
  sfxV12('share_open');

  var overlay = document.createElement('div');
  overlay.id = 'shareCardModal';
  overlay.className = 'modal-overlay show';
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');

  var html = '<div class="modal" style="max-width:440px">';
  html += '<button class="modal-close" id="shareClose" aria-label="&#xB2EB;&#xAE30;">&times;</button>';
  html += '<h3 style="font-size:17px">&#x1F4F1; &#xACF5;&#xC720; &#xCE74;&#xB4DC;</h3>';
  html += '<canvas id="shareCanvas" width="600" height="380" style="width:100%;border-radius:12px"></canvas>';
  html += '<div style="display:flex;gap:8px;margin-top:10px;justify-content:center">';
  html += '<button id="shareDL" style="padding:8px 16px;background:var(--pink);color:#fff;border:none;border-radius:12px;font-size:12px;font-weight:700;cursor:pointer">&#x1F4BE; PNG &#xB2E4;&#xC6B4;&#xB85C;&#xB4DC;</button>';
  html += '<button id="shareCopy" style="padding:8px 16px;background:var(--purple);color:#fff;border:none;border-radius:12px;font-size:12px;font-weight:700;cursor:pointer">&#x1F4CB; &#xD074;&#xB9BD;&#xBCF4;&#xB4DC; &#xBCF5;&#xC0AC;</button>';
  html += '</div></div>';
  overlay.innerHTML = html;
  document.body.appendChild(overlay);

  var canvas = document.getElementById('shareCanvas');
  var ctx = canvas.getContext('2d');
  var w = 600, h = 380;

  // Gradient bg
  var grd = ctx.createLinearGradient(0,0,w,h);
  grd.addColorStop(0,'#FF5FA2');
  grd.addColorStop(0.5,'#B066FF');
  grd.addColorStop(1,'#4A90D9');
  ctx.fillStyle = grd;
  ctx.fillRect(0,0,w,h);

  // Decorative circles
  ctx.globalAlpha = 0.1;
  ctx.beginPath(); ctx.arc(50,50,80,0,Math.PI*2); ctx.fillStyle='#fff'; ctx.fill();
  ctx.beginPath(); ctx.arc(w-60,h-60,100,0,Math.PI*2); ctx.fill();
  ctx.globalAlpha = 1;

  // Title
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('사랑의 하츄핑 v12.0', w/2, 40);
  ctx.font = '13px sans-serif';
  ctx.fillText('나의 모험 기록', w/2, 62);

  // Stats
  var stats;
  try{ stats = JSON.parse(localStorage.getItem('hatcuping_stats') || '{}'); }catch(e){ stats = {}; }
  var xpData = getXPData();
  var cards = getCardCollection();
  var achieves;
  try{ achieves = JSON.parse(localStorage.getItem('hatcuping_achievements') || '{}'); }catch(e){ achieves = {}; }

  var statItems = [
    {label:'플레이 시간', val: Math.floor((stats.playTime || 0)/60) + '분', icon:'⏰'},
    {label:'클리어', val: (stats.clears || 0) + '회', icon:'⭐'},
    {label:'업적', val: Object.keys(achieves).length + '개', icon:'🏆'},
    {label:'레벨', val: 'Lv.' + xpData.level, icon:'📊'},
    {label:'카드', val: cards.length + '/' + CARD_DATA.length, icon:'🃏'},
    {label:'하트', val: (stats.hearts || 0) + '개', icon:'💖'}
  ];

  var cardW = 160, cardH = 70, startX = 40, startY = 90, gap = 20;
  statItems.forEach(function(s, i){
    var col = i % 3, row = Math.floor(i / 3);
    var cx = startX + col * (cardW + gap);
    var cy = startY + row * (cardH + gap);

    ctx.fillStyle = 'rgba(255,255,255,.15)';
    ctx.beginPath();
    ctx.moveTo(cx+10,cy);
    ctx.lineTo(cx+cardW-10,cy);
    ctx.quadraticCurveTo(cx+cardW,cy,cx+cardW,cy+10);
    ctx.lineTo(cx+cardW,cy+cardH-10);
    ctx.quadraticCurveTo(cx+cardW,cy+cardH,cx+cardW-10,cy+cardH);
    ctx.lineTo(cx+10,cy+cardH);
    ctx.quadraticCurveTo(cx,cy+cardH,cx,cy+cardH-10);
    ctx.lineTo(cx,cy+10);
    ctx.quadraticCurveTo(cx,cy,cx+10,cy);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(s.icon, cx + 12, cy + 30);
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(s.val, cx + 42, cy + 30);
    ctx.font = '11px sans-serif';
    ctx.globalAlpha = 0.8;
    ctx.fillText(s.label, cx + 42, cy + 50);
    ctx.globalAlpha = 1;
  });

  // Footer
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255,255,255,.6)';
  ctx.fillText('PRIME Holdings NEXTERA+PRISM | ' + new Date().toLocaleDateString('ko-KR'), w/2, h - 16);

  // Download
  document.getElementById('shareDL').onclick = function(){
    sfxV12('share_save');
    var link = document.createElement('a');
    link.download = 'hatcuping-v12-card.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // Clipboard
  document.getElementById('shareCopy').onclick = function(){
    sfxV12('share_save');
    canvas.toBlob(function(blob){
      if(blob && navigator.clipboard && window.ClipboardItem){
        navigator.clipboard.write([new ClipboardItem({'image/png': blob})]).then(function(){
          showToastV12('&#x1F4CB; &#xD074;&#xB9BD;&#xBCF4;&#xB4DC;&#xC5D0; &#xBCF5;&#xC0AC;&#xB418;&#xC5C8;&#xC5B4;&#xC694;!');
        });
      } else {
        showToastV12('&#x26A0;&#xFE0F; &#xC774; &#xBE0C;&#xB77C;&#xC6B0;&#xC800;&#xC5D0;&#xC11C;&#xB294; &#xD074;&#xB9BD;&#xBCF4;&#xB4DC; &#xBCF5;&#xC0AC;&#xAC00; &#xC9C0;&#xC6D0;&#xB418;&#xC9C0; &#xC54A;&#xC544;&#xC694;.');
      }
    },'image/png');
  };

  document.getElementById('shareClose').onclick = function(){ overlay.remove(); };
  overlay.onclick = function(e){ if(e.target === overlay) overlay.remove(); };
}


// ============================================================
// 6. ADVENTURE JOURNAL (모험 일지)
// ============================================================
var MOOD_LIST = [
  {id:'happy',label:'&#xD589;&#xBCF5;',icon:'&#x1F60A;',color:'#FFD700'},
  {id:'excited',label:'&#xC2E0;&#xB0A8;',icon:'&#x1F929;',color:'#FF6347'},
  {id:'calm',label:'&#xD3C9;&#xC628;',icon:'&#x1F60C;',color:'#4CAF50'},
  {id:'tired',label:'&#xD53C;&#xACE4;',icon:'&#x1F634;',color:'#9E9E9E'},
  {id:'determined',label:'&#xACB0;&#xC758;',icon:'&#x1F4AA;',color:'#FF5FA2'}
];

function getJournal(){
  try{ return JSON.parse(localStorage.getItem('hatcuping_journal') || '[]'); }catch(e){ return []; }
}
function saveJournal(arr){
  try{ localStorage.setItem('hatcuping_journal', JSON.stringify(arr.slice(-50))); }catch(e){}
}

function openJournal(){
  if(document.getElementById('journalModal')) return;
  trackV12Feature('journal');
  sfxV12('journal_open');

  var overlay = document.createElement('div');
  overlay.id = 'journalModal';
  overlay.className = 'modal-overlay show';
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');

  function renderJournal(){
    var entries = getJournal();
    var html = '<div class="modal" style="max-width:400px">';
    html += '<button class="modal-close" id="journalClose" aria-label="&#xB2EB;&#xAE30;">&times;</button>';
    html += '<h3 style="font-size:17px">&#x1F4D3; &#xBAA8;&#xD5D8; &#xC77C;&#xC9C0;</h3>';

    // New entry form
    html += '<div style="margin-bottom:12px;padding:12px;background:rgba(255,95,162,.04);border-radius:12px">';
    html += '<div style="font-size:12px;font-weight:700;margin-bottom:6px">&#xC624;&#xB298;&#xC758; &#xAE30;&#xBD84;</div>';
    html += '<div style="display:flex;gap:6px;margin-bottom:8px">';
    MOOD_LIST.forEach(function(m){
      html += '<button class="mood-btn" data-mood="' + m.id + '" style="padding:6px 10px;border:2px solid transparent;border-radius:10px;background:rgba(0,0,0,.04);cursor:pointer;font-size:16px;transition:all .2s" title="' + m.label + '">' + m.icon + '</button>';
    });
    html += '</div>';
    html += '<textarea id="journalText" placeholder="&#xC624;&#xB298;&#xC758; &#xBAA8;&#xD5D8;&#xC744; &#xAE30;&#xB85D;&#xD558;&#xC138;&#xC694;..." style="width:100%;height:60px;border:1px solid var(--border);border-radius:10px;padding:8px;font-size:12px;resize:none;font-family:inherit;background:var(--card-bg);color:var(--text)"></textarea>';
    html += '<button id="journalSaveBtn" style="margin-top:6px;padding:6px 16px;background:var(--pink);color:#fff;border:none;border-radius:10px;font-size:12px;font-weight:700;cursor:pointer">&#x1F4DD; &#xC800;&#xC7A5;</button>';
    html += '</div>';

    // Timeline
    html += '<div style="font-size:12px;font-weight:700;margin-bottom:6px">&#x1F4C5; &#xD0C0;&#xC784;&#xB77C;&#xC778; (' + entries.length + '/50)</div>';
    html += '<div style="max-height:200px;overflow-y:auto">';
    if(entries.length === 0){
      html += '<div style="text-align:center;color:var(--text-sub);font-size:12px;padding:16px">&#xC544;&#xC9C1; &#xAE30;&#xB85D;&#xC774; &#xC5C6;&#xC5B4;&#xC694;. &#xCCAB; &#xC77C;&#xC9C0;&#xB97C; &#xC791;&#xC131;&#xD574;&#xBCF4;&#xC138;&#xC694;!</div>';
    }
    entries.slice().reverse().forEach(function(e){
      var mood = MOOD_LIST.filter(function(m){ return m.id === e.mood; })[0];
      var dateStr = new Date(e.date).toLocaleDateString('ko-KR', {month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});
      html += '<div style="padding:8px;margin-bottom:6px;border-radius:10px;background:rgba(0,0,0,.03);border-left:3px solid ' + (mood ? mood.color : '#ccc') + '">';
      html += '<div style="display:flex;justify-content:space-between;font-size:10px;color:var(--text-sub)"><span>' + (mood ? mood.icon + ' ' + mood.label : '') + '</span><span>' + dateStr + '</span></div>';
      html += '<div style="font-size:12px;margin-top:4px;color:var(--text)">' + e.text + '</div>';
      html += '</div>';
    });
    html += '</div></div>';

    overlay.innerHTML = html;

    var selectedMood = '';
    overlay.querySelectorAll('.mood-btn').forEach(function(btn){
      btn.onclick = function(){
        overlay.querySelectorAll('.mood-btn').forEach(function(b){ b.style.borderColor = 'transparent'; });
        btn.style.borderColor = 'var(--pink)';
        selectedMood = btn.dataset.mood;
      };
    });

    document.getElementById('journalSaveBtn').onclick = function(){
      var text = document.getElementById('journalText').value.trim();
      if(!text){ showToastV12('&#x26A0;&#xFE0F; &#xB0B4;&#xC6A9;&#xC744; &#xC785;&#xB825;&#xD574;&#xC8FC;&#xC138;&#xC694;!'); return; }
      var entries2 = getJournal();
      entries2.push({mood: selectedMood || 'happy', text: text, date: Date.now()});
      saveJournal(entries2);
      sfxV12('journal_save');
      checkAndAwardV12();
      showToastV12('&#x1F4DD; &#xC77C;&#xC9C0;&#xAC00; &#xC800;&#xC7A5;&#xB418;&#xC5C8;&#xC5B4;&#xC694;!');
      renderJournal();
    };

    document.getElementById('journalClose').onclick = function(){ overlay.remove(); };
    overlay.onclick = function(e){ if(e.target === overlay) overlay.remove(); };
  }

  renderJournal();
}


// ============================================================
// 7. MUSIC JUKEBOX (뮤직 주크박스 10곡)
// ============================================================
var JUKEBOX_SONGS = [
  {id:'main',name:'메인 테마',bpm:120,key:'C',notes:[523,587,659,698,784,698,659,587]},
  {id:'forest',name:'이모션 숲',bpm:100,key:'G',notes:[392,440,494,523,587,523,494,440]},
  {id:'boss',name:'보스 배틀',bpm:140,key:'Am',notes:[440,523,659,880,784,659,523,440]},
  {id:'village',name:'평화로운 마을',bpm:90,key:'F',notes:[349,392,440,523,494,440,392,349]},
  {id:'crystal',name:'크리스탈 동굴',bpm:110,key:'Em',notes:[330,392,494,659,587,494,392,330]},
  {id:'ending',name:'엔딩 크레딧',bpm:80,key:'D',notes:[294,330,370,440,494,440,370,330]},
  {id:'lullaby',name:'별의 자장가',bpm:70,key:'Bb',notes:[466,523,587,698,659,587,523,466]},
  {id:'battle2',name:'결전의 때',bpm:150,key:'Dm',notes:[294,349,440,587,523,440,349,294]},
  {id:'adventure',name:'모험의 시작',bpm:130,key:'A',notes:[440,494,554,659,740,659,554,494]},
  {id:'love',name:'사랑의 테마',bpm:85,key:'Eb',notes:[311,370,415,466,523,466,415,370]}
];

var _jukeboxPlaying = null;
var _jukeboxInterval = null;

function stopJukebox(){
  if(_jukeboxInterval){ clearInterval(_jukeboxInterval); _jukeboxInterval = null; }
  _jukeboxPlaying = null;
}

function playJukeboxSong(song){
  stopJukebox();
  _v12InitAudio();
  if(!_v12Ctx) return;
  _jukeboxPlaying = song.id;
  var noteIdx = 0;
  var interval = Math.floor(60000 / song.bpm);

  _jukeboxInterval = setInterval(function(){
    if(!_jukeboxPlaying || _jukeboxPlaying !== song.id){ stopJukebox(); return; }
    try{
      var muted = false;
      try{ muted = localStorage.getItem('hatcuping_mute') === '1'; }catch(e){}
      if(muted) return;
      var osc = _v12Ctx.createOscillator();
      var gain = _v12Ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = song.notes[noteIdx % song.notes.length];
      gain.gain.value = 0.06;
      gain.gain.linearRampToValueAtTime(0, _v12Ctx.currentTime + interval/1000 * 0.9);
      osc.connect(gain);
      gain.connect(_v12Ctx.destination);
      osc.start();
      osc.stop(_v12Ctx.currentTime + interval/1000);
    }catch(e){}
    noteIdx++;
  }, interval);
}

function openJukebox(){
  if(document.getElementById('jukeboxModal')) return;
  trackV12Feature('jukebox');
  sfxV12('jukebox_open');

  var overlay = document.createElement('div');
  overlay.id = 'jukeboxModal';
  overlay.className = 'modal-overlay show';
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');

  var html = '<div class="modal" style="max-width:400px">';
  html += '<button class="modal-close" id="jukeboxClose" aria-label="&#xB2EB;&#xAE30;">&times;</button>';
  html += '<h3 style="font-size:17px">&#x1F3B6; &#xBBA4;&#xC9C1; &#xC8FC;&#xD06C;&#xBC15;&#xC2A4;</h3>';
  html += '<div style="font-size:12px;color:var(--text-sub);margin-bottom:10px">10&#xACE1; &#xC624;&#xB9AC;&#xC9C0;&#xB110; &#xC0AC;&#xC6B4;&#xB4DC;&#xD2B8;&#xB799;</div>';

  JUKEBOX_SONGS.forEach(function(song){
    var isPlaying = _jukeboxPlaying === song.id;
    html += '<div class="jb-song" data-id="' + song.id + '" style="display:flex;align-items:center;gap:10px;padding:10px;margin-bottom:4px;border-radius:12px;background:' + (isPlaying ? 'rgba(255,95,162,.1)' : 'rgba(0,0,0,.03)') + ';cursor:pointer;transition:all .2s">';
    html += '<div style="width:32px;height:32px;border-radius:8px;background:' + (isPlaying ? 'var(--pink)' : 'rgba(0,0,0,.06)') + ';display:flex;align-items:center;justify-content:center;color:' + (isPlaying ? '#fff' : 'var(--text-sub)') + ';font-size:14px">' + (isPlaying ? '&#x23F8;' : '&#x25B6;&#xFE0F;') + '</div>';
    html += '<div style="flex:1"><div style="font-size:13px;font-weight:700">' + song.name + '</div>';
    html += '<div style="font-size:10px;color:var(--text-sub)">BPM ' + song.bpm + ' | Key: ' + song.key + '</div></div>';
    html += '</div>';
  });

  html += '<div style="text-align:center;margin-top:8px"><button id="jbStop" style="padding:6px 16px;background:rgba(0,0,0,.1);color:var(--text-sub);border:none;border-radius:10px;font-size:12px;font-weight:700;cursor:pointer">&#x23F9; &#xC815;&#xC9C0;</button></div>';
  html += '</div>';
  overlay.innerHTML = html;
  document.body.appendChild(overlay);

  overlay.querySelectorAll('.jb-song').forEach(function(el){
    el.onclick = function(){
      var id = el.dataset.id;
      if(_jukeboxPlaying === id){ stopJukebox(); }
      else {
        var song = JUKEBOX_SONGS.filter(function(s){ return s.id === id; })[0];
        if(song){ playJukeboxSong(song); sfxV12('jukebox_play'); }
      }
      checkAndAwardV12();
      overlay.remove();
      openJukebox();
    };
  });

  document.getElementById('jbStop').onclick = function(){ stopJukebox(); overlay.remove(); openJukebox(); };
  document.getElementById('jukeboxClose').onclick = function(){ stopJukebox(); overlay.remove(); };
  overlay.onclick = function(e){ if(e.target === overlay){ stopJukebox(); overlay.remove(); } };
}


// ============================================================
// 8. TUTORIAL GUIDE CENTER (가이드 센터 12개)
// ============================================================
var GUIDE_DATA = [
  {id:'g_start',title:'게임 시작하기',desc:'4종 게임 중 하나를 선택해서 모험을 시작하세요. 처음이라면 탈출 어드벤처를 추천!',icon:'&#x1F3AE;'},
  {id:'g_plat',title:'플랫포머 조작법',desc:'방향키로 이동, 스페이스로 점프, 더블점프와 대시를 활용하세요.',icon:'&#x1F3C3;'},
  {id:'g_rpg',title:'RPG 전투 기초',desc:'턴제 전투에서 공격/스킬/아이템/방어를 전략적으로 사용하세요.',icon:'&#x2694;&#xFE0F;'},
  {id:'g_boss',title:'보스전 공략',desc:'보스의 패턴을 파악하고, 스킬 쿨다운을 관리하며 치유 타이밍을 놓치지 마세요.',icon:'&#x1F409;'},
  {id:'g_card',title:'카드 수집 가이드',desc:'가챠로 24종의 티니핑 카드를 수집하세요. SSR 확률은 15%!',icon:'&#x1F0CF;'},
  {id:'g_xp',title:'XP와 레벨업',desc:'트레이닝과 게임 플레이로 XP를 모아 레벨 30 이모션 마스터를 목표로!',icon:'&#x1F4CA;'},
  {id:'g_achieve',title:'업적 달성하기',desc:'82개의 업적을 하나씩 달성해보세요. 업적 버튼(A키)에서 확인 가능.',icon:'&#x1F3C6;'},
  {id:'g_dark',title:'다크모드 활용',desc:'D키 또는 다크모드 버튼으로 전환. 눈이 편한 다크모드를 즐기세요.',icon:'&#x1F319;'},
  {id:'g_save',title:'세이브/로드',desc:'3개 세이브 슬롯과 JSON 내보내기/가져오기로 진행 상황을 안전하게 관리.',icon:'&#x1F4BE;'},
  {id:'g_share',title:'공유 카드 만들기',desc:'나만의 통계 카드를 PNG로 저장하거나 클립보드에 복사해서 자랑하세요!',icon:'&#x1F4F1;'},
  {id:'g_journal',title:'모험 일지 작성',desc:'매일의 기분과 모험 기록을 남겨보세요. 최대 50개까지 저장됩니다.',icon:'&#x1F4D3;'},
  {id:'g_keyboard',title:'키보드 단축키',desc:'?키로 전체 단축키를 확인. Shift 조합으로 빠르게 기능에 접근!',icon:'&#x2328;&#xFE0F;'}
];

function getGuideRead(){
  try{ return JSON.parse(localStorage.getItem('hatcuping_guides_read') || '[]'); }catch(e){ return []; }
}
function saveGuideRead(arr){
  try{ localStorage.setItem('hatcuping_guides_read', JSON.stringify(arr)); }catch(e){}
}

function openGuideCenter(){
  if(document.getElementById('guideModal')) return;
  trackV12Feature('guide');
  sfxV12('guide_open');

  var overlay = document.createElement('div');
  overlay.id = 'guideModal';
  overlay.className = 'modal-overlay show';
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');

  var readList = getGuideRead();
  var html = '<div class="modal" style="max-width:420px">';
  html += '<button class="modal-close" id="guideClose" aria-label="&#xB2EB;&#xAE30;">&times;</button>';
  html += '<h3 style="font-size:17px">&#x1F4D6; &#xAC00;&#xC774;&#xB4DC; &#xC13C;&#xD130; (' + readList.length + '/' + GUIDE_DATA.length + ')</h3>';

  GUIDE_DATA.forEach(function(g){
    var isRead = readList.indexOf(g.id) !== -1;
    html += '<div class="guide-item" data-id="' + g.id + '" style="display:flex;gap:10px;padding:10px;margin-bottom:6px;border-radius:12px;background:' + (isRead ? 'rgba(76,175,80,.06)' : 'rgba(0,0,0,.03)') + ';cursor:pointer;transition:all .2s">';
    html += '<div style="width:36px;height:36px;border-radius:10px;background:' + (isRead ? 'rgba(76,175,80,.15)' : 'rgba(255,95,162,.08)') + ';display:flex;align-items:center;justify-content:center;font-size:18px">' + g.icon + '</div>';
    html += '<div style="flex:1"><div style="font-size:13px;font-weight:700">' + g.title + (isRead ? ' &#x2705;' : '') + '</div>';
    html += '<div style="font-size:11px;color:var(--text-sub);line-height:1.4">' + g.desc + '</div></div></div>';
  });
  html += '</div>';
  overlay.innerHTML = html;
  document.body.appendChild(overlay);

  overlay.querySelectorAll('.guide-item').forEach(function(el){
    el.onclick = function(){
      var id = el.dataset.id;
      var r = getGuideRead();
      if(r.indexOf(id) === -1){
        r.push(id);
        saveGuideRead(r);
        sfxV12('guide_read');
        checkAndAwardV12();
        showToastV12('&#x1F4D6; &#xAC00;&#xC774;&#xB4DC; &#xC77D;&#xC74C;!');
        overlay.remove();
        openGuideCenter();
      }
    };
  });

  document.getElementById('guideClose').onclick = function(){ overlay.remove(); };
  overlay.onclick = function(e){ if(e.target === overlay) overlay.remove(); };
}


// ============================================================
// 9. QUIZ +15 (45 -> 60)
// ============================================================
var V12_QUIZ = [
  {q:'&#xBCF4;&#xC2A4; &#xB7EC;&#xC2DC; &#xBAA8;&#xB4DC;&#xC758; &#xCCA8; &#xBC88;&#xC9F8; &#xBCF4;&#xC2A4;&#xB294;?',a:['&#xC5B4;&#xB460;&#xC758; &#xD2B8;&#xB7EC;&#xD551;','&#xC5BC;&#xC74C; &#xB4DC;&#xB798;&#xACE4;','&#xBD88;&#xAF43; &#xD398;&#xB2C9;&#xC2A4;','&#xCE74;&#xC624;&#xC2A4; &#xB85C;&#xB4DC;'],c:0},
  {q:'&#xD2F0;&#xB2C8;&#xD551; &#xCE74;&#xB4DC;&#xC758; &#xCD1D; &#xC218;&#xB294;?',a:['16&#xC7A5;','20&#xC7A5;','24&#xC7A5;','30&#xC7A5;'],c:2},
  {q:'SSR &#xB4F1;&#xAE09; &#xCE74;&#xB4DC;&#xC758; &#xAC00;&#xCC28; &#xD655;&#xB960;&#xC740;?',a:['5%','10%','15%','20%'],c:2},
  {q:'XP &#xB808;&#xBCA8; &#xC2DC;&#xC2A4;&#xD15C;&#xC758; &#xCD5C;&#xACE0; &#xB808;&#xBCA8;&#xC740;?',a:['20','25','30','50'],c:2},
  {q:'&#xB808;&#xBCA8; 30 &#xCE6D;&#xD638;&#xB294;?',a:['&#xC804;&#xC124;','&#xCC54;&#xD53C;&#xC5B8;','&#xC774;&#xBAA8;&#xC158; &#xB9C8;&#xC2A4;&#xD130;','&#xC601;&#xC6C5;'],c:2},
  {q:'&#xBAA8;&#xD5D8; &#xC77C;&#xC9C0;&#xC758; &#xCD5C;&#xB300; &#xC800;&#xC7A5; &#xC218;&#xB294;?',a:['20','30','50','100'],c:2},
  {q:'&#xBBA4;&#xC9C1; &#xC8FC;&#xD06C;&#xBC15;&#xC2A4;&#xC5D0;&#xB294; &#xBA87; &#xACE1;&#xC774; &#xC788;&#xB098;&#xC694;?',a:['5&#xACE1;','7&#xACE1;','10&#xACE1;','12&#xACE1;'],c:2},
  {q:'&#xAC00;&#xC774;&#xB4DC; &#xC13C;&#xD130;&#xC758; &#xCD1D; &#xAC00;&#xC774;&#xB4DC; &#xC218;&#xB294;?',a:['8&#xAC1C;','10&#xAC1C;','12&#xAC1C;','15&#xAC1C;'],c:2},
  {q:'&#xC6D4;&#xB4DC;&#xB9F5;&#xC758; &#xC7A5;&#xC18C; &#xC218;&#xB294;?',a:['3&#xACE3;','4&#xACE3;','5&#xACE3;','6&#xACE3;'],c:1},
  {q:'&#xBCF4;&#xC2A4; &#xB7EC;&#xC2DC;&#xC758; &#xCD5C;&#xC885; &#xBCF4;&#xC2A4; &#xC774;&#xB984;&#xC740;?',a:['&#xD3ED;&#xD48D; &#xD0C0;&#xC774;&#xD0C4;','&#xCE74;&#xC624;&#xC2A4; &#xB85C;&#xB4DC;','&#xC5B4;&#xB460;&#xC758; &#xD2B8;&#xB7EC;&#xD551;','&#xBD88;&#xAF43; &#xD398;&#xB2C9;&#xC2A4;'],c:1},
  {q:'&#xACF5;&#xC720; &#xCE74;&#xB4DC;&#xC758; &#xD06C;&#xAE30;&#xB294;?',a:['400x240','500x300','600x380','800x500'],c:2},
  {q:'&#xBCF4;&#xC2A4; &#xB7EC;&#xC2DC;&#xC5D0;&#xC11C; &#xC2A4;&#xD0AC; &#xCFE8;&#xB2E4;&#xC6B4;&#xC740; &#xBA87; &#xD134;?',a:['1&#xD134;','2&#xD134;','3&#xD134;','5&#xD134;'],c:2},
  {q:'v12.0&#xC5D0;&#xC11C; &#xCD94;&#xAC00;&#xB41C; &#xC5C5;&#xC801; &#xC218;&#xB294;?',a:['8&#xAC1C;','10&#xAC1C;','12&#xAC1C;','15&#xAC1C;'],c:2},
  {q:'&#xD2B8;&#xB808;&#xC774;&#xB2DD;&#xC73C;&#xB85C; &#xC5BB;&#xB294; XP &#xBC94;&#xC704;&#xB294;?',a:['10~20','20~50','50~100','100~200'],c:1},
  {q:'&#xCE74;&#xC624;&#xC2A4; &#xB85C;&#xB4DC;&#xC758; HP&#xB294;?',a:['200','250','300','350'],c:2}
];

function injectExtraQuizV12(){
  if(window._v12QuizInjected) return;
  window._v12QuizInjected = true;
  if(window.QUIZ_DATA){
    V12_QUIZ.forEach(function(q){ window.QUIZ_DATA.push(q); });
  }
}


// ============================================================
// 10. ACHIEVEMENTS +12 (70 -> 82)
// ============================================================
var V12_ACHIEVEMENTS = [
  {id:'a_card_first',name:'첫 카드 수집',desc:'첫 티니핑 카드 획득!',cat:'general',icon:'&#x1F0CF;'},
  {id:'a_card_half',name:'카드 반 수집',desc:'12장 이상 카드 수집',cat:'general',icon:'&#x1F4E6;'},
  {id:'a_card_complete',name:'카드 컴플리트',desc:'24장 카드 전부 수집!',cat:'general',icon:'&#x1F31F;'},
  {id:'a_boss_rush',name:'보스 도전자',desc:'보스 러시 첫 클리어',cat:'general',icon:'&#x2694;&#xFE0F;'},
  {id:'a_boss_rush_clear',name:'보스 러시 마스터',desc:'보스 러시 5라운드 완주!',cat:'general',icon:'&#x1F451;'},
  {id:'a_level5',name:'Lv.5 달성',desc:'레벨 5에 도달!',cat:'general',icon:'&#x1F4CA;'},
  {id:'a_level10',name:'Lv.10 달성',desc:'레벨 10에 도달!',cat:'general',icon:'&#x1F4C8;'},
  {id:'a_share',name:'공유왕',desc:'공유 카드를 처음 생성!',cat:'general',icon:'&#x1F4F1;'},
  {id:'a_journal_first',name:'일지 시작',desc:'모험 일지 첫 작성!',cat:'general',icon:'&#x1F4D3;'},
  {id:'a_journal_10',name:'일지 수집가',desc:'일지 10개 이상 작성!',cat:'general',icon:'&#x1F4DA;'},
  {id:'a_jukebox',name:'음악 감상가',desc:'주크박스에서 곡 재생!',cat:'general',icon:'&#x1F3B6;'},
  {id:'a_guide_first',name:'가이드 첫 읽기',desc:'가이드를 처음 읽음!',cat:'general',icon:'&#x1F4D6;'},
  {id:'a_guide_master',name:'가이드 마스터',desc:'12개 가이드 모두 읽음!',cat:'general',icon:'&#x1F393;'}
];

function injectV12Achievements(){
  if(window._v12AchievementsInjected) return;
  window._v12AchievementsInjected = true;
  if(window.AD){
    V12_ACHIEVEMENTS.forEach(function(a){
      var exists = window.AD.some(function(e){ return e.id === a.id; });
      if(!exists) window.AD.push(a);
    });
  }
}

function checkAndAwardV12(){
  if(!window.saveAchievement || !window.showAchieveToast) return;

  var cards = getCardCollection();
  if(cards.length >= 1 && window.saveAchievement('a_card_first')){ window.showAchieveToast('첫 카드 수집'); }
  if(cards.length >= 12 && window.saveAchievement('a_card_half')){ window.showAchieveToast('카드 반 수집'); }
  if(cards.length >= 24 && window.saveAchievement('a_card_complete')){ window.showAchieveToast('카드 컴플리트'); }

  var bProg = getBossRushProgress();
  var bossKeys = Object.keys(bProg);
  if(bossKeys.length >= 1 && window.saveAchievement('a_boss_rush')){ window.showAchieveToast('보스 도전자'); }
  if(bossKeys.length >= 5 && window.saveAchievement('a_boss_rush_clear')){ window.showAchieveToast('보스 러시 마스터'); }

  var xpD = getXPData();
  if(xpD.level >= 5 && window.saveAchievement('a_level5')){ window.showAchieveToast('Lv.5 달성'); }
  if(xpD.level >= 10 && window.saveAchievement('a_level10')){ window.showAchieveToast('Lv.10 달성'); }

  var journal = getJournal();
  if(journal.length >= 1 && window.saveAchievement('a_journal_first')){ window.showAchieveToast('일지 시작'); }
  if(journal.length >= 10 && window.saveAchievement('a_journal_10')){ window.showAchieveToast('일지 수집가'); }

  var guides = getGuideRead();
  if(guides.length >= 1 && window.saveAchievement('a_guide_first')){ window.showAchieveToast('가이드 첫 읽기'); }
  if(guides.length >= 12 && window.saveAchievement('a_guide_master')){ window.showAchieveToast('가이드 마스터'); }

  try{
    var feat = JSON.parse(localStorage.getItem('hatcuping_v12_features') || '[]');
    if(feat.indexOf('sharecard') !== -1 && window.saveAchievement('a_share')){ window.showAchieveToast('공유왕'); }
    if(feat.indexOf('jukebox') !== -1 && window.saveAchievement('a_jukebox')){ window.showAchieveToast('음악 감상가'); }
  }catch(e){}
}


// ============================================================
// INJECTION: QUICK ACTIONS (8 buttons), KEYBOARD (8 shortcuts)
// ============================================================
function injectV12QuickActions(){
  var topBar = document.querySelector('.top-bar');
  if(!topBar) return;

  var btns = [
    {id:'worldMapBtn',label:'&#xC6D4;&#xB4DC;&#xB9F5;',icon:'&#x1F5FA;&#xFE0F;',title:'&#xC6D4;&#xB4DC;&#xB9F5; (Shift+W)',action:openWorldMap},
    {id:'cardCollBtn',label:'&#xCE74;&#xB4DC;',icon:'&#x1F0CF;',title:'&#xD2F0;&#xB2C8;&#xD551; &#xCE74;&#xB4DC; (Shift+C)',action:openCardCollection},
    {id:'bossRushBtn',label:'&#xBCF4;&#xC2A4;&#xB7EC;&#xC2DC;',icon:'&#x2694;&#xFE0F;',title:'&#xBCF4;&#xC2A4; &#xB7EC;&#xC2DC; (Shift+B)',action:openBossRush},
    {id:'xpLevelBtn',label:'&#xB808;&#xBCA8;',icon:'&#x1F4CA;',title:'XP &#xB808;&#xBCA8; (Shift+L)',action:openXPLevel},
    {id:'shareCardBtn',label:'&#xACF5;&#xC720;',icon:'&#x1F4F1;',title:'&#xACF5;&#xC720; &#xCE74;&#xB4DC; (Shift+P)',action:openShareCard},
    {id:'journalBtn',label:'&#xC77C;&#xC9C0;',icon:'&#x1F4D3;',title:'&#xBAA8;&#xD5D8; &#xC77C;&#xC9C0; (Shift+J)',action:openJournal},
    {id:'jukeboxBtn',label:'&#xC8FC;&#xD06C;&#xBC15;&#xC2A4;',icon:'&#x1F3B6;',title:'&#xBBA4;&#xC9C1; &#xC8FC;&#xD06C;&#xBC15;&#xC2A4; (Shift+M)',action:openJukebox},
    {id:'guideCenterBtn',label:'&#xAC00;&#xC774;&#xB4DC;',icon:'&#x1F4D6;',title:'&#xAC00;&#xC774;&#xB4DC; &#xC13C;&#xD130; (Shift+G)',action:openGuideCenter}
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
    if(key === 'w' && e.shiftKey){ e.preventDefault(); openWorldMap(); }
    else if(key === 'c' && e.shiftKey){ e.preventDefault(); openCardCollection(); }
    else if(key === 'b' && e.shiftKey){ e.preventDefault(); openBossRush(); }
    else if(key === 'l' && e.shiftKey){ e.preventDefault(); openXPLevel(); }
    else if(key === 'p' && e.shiftKey){ e.preventDefault(); openShareCard(); }
    else if(key === 'j' && e.shiftKey){ e.preventDefault(); openJournal(); }
    else if(key === 'm' && e.shiftKey){ e.preventDefault(); openJukebox(); }
    else if(key === 'g' && e.shiftKey){ e.preventDefault(); openGuideCenter(); }
  });
}

function updateV12KeyboardHelp(){
  var kbHelp = document.querySelector('#kbHelp .modal');
  if(!kbHelp) return;
  var newRows = [
    ['&#xC6D4;&#xB4DC;&#xB9F5;','Shift+W'],['&#xD2F0;&#xB2C8;&#xD551; &#xCE74;&#xB4DC;','Shift+C'],['&#xBCF4;&#xC2A4; &#xB7EC;&#xC2DC;','Shift+B'],
    ['XP &#xB808;&#xBCA8;','Shift+L'],['&#xACF5;&#xC720; &#xCE74;&#xB4DC;','Shift+P'],['&#xBAA8;&#xD5D8; &#xC77C;&#xC9C0;','Shift+J'],
    ['&#xC8FC;&#xD06C;&#xBC15;&#xC2A4;','Shift+M'],['&#xAC00;&#xC774;&#xB4DC; &#xC13C;&#xD130;','Shift+G']
  ];
  newRows.forEach(function(r){
    var row = document.createElement('div');
    row.className = 'kb-help-row';
    row.innerHTML = '<span>' + r[0] + '</span><span class="kb-help-key">' + r[1] + '</span>';
    kbHelp.appendChild(row);
  });
}


// ============================================================
// FOOTER, NEWS, META, ACHIEVE COUNT UPDATE
// ============================================================
function updateV12Footer(){
  var ver = document.querySelector('.footer .version');
  if(ver) ver.textContent = 'v12.0 | © PRIME Holdings NEXTERA+PRISM';

  var links = document.querySelector('.footer-links');
  if(links) links.innerHTML = '<span class="footer-link">4&#xC885; &#xAC8C;&#xC784;</span><span class="footer-link">82&#xAC1C; &#xC5C5;&#xC801;</span><span class="footer-link">24&#xC885; &#xCE74;&#xB4DC;</span><span class="footer-link">10&#xACE1; &#xC8FC;&#xD06C;&#xBC15;&#xC2A4;</span><span class="footer-link">&#xBCF4;&#xC2A4;&#xB7EC;&#xC2DC; 5R</span>';
}

function updateV12News(){
  var newsSection = document.querySelector('.news-section');
  if(!newsSection) return;
  var firstItem = newsSection.querySelector('.news-item');
  if(!firstItem) return;
  var newItem = document.createElement('div');
  newItem.className = 'news-item';
  newItem.innerHTML = '<span class="news-date">v12.0</span><span class="news-text">&#xC6D4;&#xB4DC;&#xB9F5;, &#xD2F0;&#xB2C8;&#xD551;&#xCE74;&#xB4DC; 24&#xC885;, &#xBCF4;&#xC2A4;&#xB7EC;&#xC2DC; 5R, XP&#xB808;&#xBCA8; 30, &#xACF5;&#xC720;&#xCE74;&#xB4DC;, &#xBAA8;&#xD5D8;&#xC77C;&#xC9C0;, &#xC8FC;&#xD06C;&#xBC15;&#xC2A4; 10&#xACE1;, &#xAC00;&#xC774;&#xB4DC;&#xC13C;&#xD130; 12&#xAC1C;, &#xD000;&#xC988;+15(60), &#xC5C5;&#xC801;+12(82)</span>';
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
  if(descMeta) descMeta.content = '사랑의 하츄핑 v12.0 - 플랫포머 액션, 턴제 RPG, 오픈월드, UNIFIED 4종 게임. 업적 82개, 티니핑카드 24종, 보스러시 5R, XP레벨 30, 주크박스 10곡, 가이드센터, 퀀즈 60문!';
  document.title = '사랑의 하츄핑 v12.0 - 게임 선택';
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
  checkAndAwardV12();
}

if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', bootV12);
} else {
  bootV12();
}

})();

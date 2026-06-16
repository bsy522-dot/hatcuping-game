// hatcuping-game v13_patch.js - NEXTERA+PRISM AUTO v13.0
// Self-contained patch module (1400+ lines, 50+ functions)
(function(){
'use strict';

// ============================================================
// UTILITY: SFX ENGINE (10 new sound types)
// ============================================================
var _v13Ctx = null;
function _v13InitAudio(){
  if(!_v13Ctx){
    try{ _v13Ctx = new (window.AudioContext || window.webkitAudioContext)(); }catch(e){}
  }
  if(_v13Ctx && _v13Ctx.state === 'suspended') _v13Ctx.resume();
}

var SFX_V13 = {
  friend_open:{f:660,d:.06,t:'triangle'},friend_gift:{f:880,d:.1,t:'sine'},friend_levelup:{f:1047,d:.15,t:'triangle'},
  login_open:{f:700,d:.06,t:'triangle'},login_claim:{f:880,d:.12,t:'sine'},
  fusion_open:{f:550,d:.06,t:'triangle'},fusion_success:{f:1047,d:.18,t:'triangle'},
  skill_open:{f:600,d:.06,t:'triangle'},skill_unlock:{f:784,d:.1,t:'sine'},
  dungeon_open:{f:440,d:.08,t:'square'},dungeon_battle:{f:330,d:.06,t:'sawtooth'},dungeon_clear:{f:1047,d:.15,t:'triangle'},
  gallery_open:{f:700,d:.06,t:'triangle'},
  stamp_open:{f:600,d:.06,t:'triangle'},stamp_collect:{f:880,d:.1,t:'sine'},
  minimap_open:{f:660,d:.05,t:'triangle'},
  ranking_open:{f:700,d:.06,t:'triangle'}
};

function sfxV13(type){
  _v13InitAudio();
  if(!_v13Ctx) return;
  var s = SFX_V13[type];
  if(!s) return;
  try{
    var muted = false;
    try{ muted = localStorage.getItem('hatcuping_mute') === '1'; }catch(e){}
    if(muted) return;
    var osc = _v13Ctx.createOscillator();
    var gain = _v13Ctx.createGain();
    osc.type = s.t || 'sine';
    osc.frequency.value = s.f;
    gain.gain.value = 0.08;
    osc.connect(gain);
    gain.connect(_v13Ctx.destination);
    osc.start();
    osc.stop(_v13Ctx.currentTime + (s.d || 0.06));
  }catch(e){}
}

function trackV13Feature(id){
  try{
    var saved = JSON.parse(localStorage.getItem('hatcuping_v13_features') || '[]');
    if(saved.indexOf(id) === -1){ saved.push(id); localStorage.setItem('hatcuping_v13_features', JSON.stringify(saved)); }
  }catch(e){}
}

function showToastV13(msg){
  var t = document.getElementById('achieveToast');
  if(t){ t.innerHTML = msg; t.classList.add('show'); setTimeout(function(){ t.classList.remove('show'); }, 2500); }
}


// ============================================================
// 1. FRIENDSHIP SYSTEM (친밀도/우정 시스템 - 8캐릭터)
// ============================================================
var FRIENDS = [
  {id:'romi',name:'로미',icon:'&#x1F467;',desc:'용감한 소녀',gift:'&#x1F338;',maxLevel:10},
  {id:'hachuping',name:'하츄핑',icon:'&#x1F496;',desc:'사랑의 티니핑',gift:'&#x2764;&#xFE0F;',maxLevel:10},
  {id:'baroping',name:'바로핑',icon:'&#x1F499;',desc:'정의의 티니핑',gift:'&#x2B50;',maxLevel:10},
  {id:'chacha',name:'차차핑',icon:'&#x1F49B;',desc:'즐거운 티니핑',gift:'&#x1F382;',maxLevel:10},
  {id:'lala',name:'라라핑',icon:'&#x1F49C;',desc:'음악의 티니핑',gift:'&#x1F3B5;',maxLevel:10},
  {id:'kkongkkong',name:'꽁꽁핑',icon:'&#x1F4A0;',desc:'얼음의 티니핑',gift:'&#x2744;&#xFE0F;',maxLevel:10},
  {id:'hana',name:'하나핑',icon:'&#x1F49A;',desc:'자연의 티니핑',gift:'&#x1F33F;',maxLevel:10},
  {id:'muruping',name:'무루핑',icon:'&#x1F9E1;',desc:'무지개의 티니핑',gift:'&#x1F308;',maxLevel:10}
];

function getFriendData(){
  try{ return JSON.parse(localStorage.getItem('hatcuping_friends') || '{}'); }catch(e){ return {}; }
}
function saveFriendData(data){
  try{ localStorage.setItem('hatcuping_friends', JSON.stringify(data)); }catch(e){}
}

function getFriendLevel(pts){
  if(pts >= 100) return 10;
  if(pts >= 80) return 9;
  if(pts >= 65) return 8;
  if(pts >= 52) return 7;
  if(pts >= 40) return 6;
  if(pts >= 30) return 5;
  if(pts >= 22) return 4;
  if(pts >= 15) return 3;
  if(pts >= 9) return 2;
  if(pts >= 4) return 1;
  return 0;
}

function getFriendTitle(level){
  var titles = ['낯선 사이','아는 사이','친구','좋은 친구','절친','소울메이트','영혼의 동반자','최고의 파트너','전설의 우정','운명의 인연','영원한 유대'];
  return titles[Math.min(level, titles.length - 1)];
}

function openFriendship(){
  if(document.getElementById('friendModal')) return;
  trackV13Feature('friendship');
  sfxV13('friend_open');

  var overlay = document.createElement('div');
  overlay.id = 'friendModal';
  overlay.className = 'modal-overlay show';
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');

  var fData = getFriendData();
  var html = '<div class="modal" style="max-width:420px">';
  html += '<button class="modal-close" id="friendClose" aria-label="&#xB2EB;&#xAE30;">&times;</button>';
  html += '<h3 style="font-size:17px">&#x1F91D; &#xC6B0;&#xC815; &#xC2DC;&#xC2A4;&#xD15C;</h3>';
  html += '<div style="font-size:12px;color:var(--text-sub);margin-bottom:12px">&#xCE90;&#xB9AD;&#xD130;&#xC5D0;&#xAC8C; &#xC120;&#xBB3C;&#xC744; &#xC8FC;&#xACE0; &#xCE5C;&#xBC00;&#xB3C4;&#xB97C; &#xB192;&#xC774;&#xC138;&#xC694;!</div>';

  FRIENDS.forEach(function(f){
    var pts = (fData[f.id] || {}).points || 0;
    var lv = getFriendLevel(pts);
    var title = getFriendTitle(lv);
    var pct = Math.min(pts, 100);
    var canGift = true;
    try{
      var lastGift = (fData[f.id] || {}).lastGift || 0;
      var now = Date.now();
      if(now - lastGift < 3600000) canGift = false;
    }catch(e){}

    html += '<div style="display:flex;align-items:center;gap:10px;padding:10px;margin-bottom:6px;border-radius:14px;background:rgba(0,0,0,.03)">';
    html += '<div style="width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,rgba(255,95,162,.1),rgba(176,102,255,.1));display:flex;align-items:center;justify-content:center;font-size:22px">' + f.icon + '</div>';
    html += '<div style="flex:1">';
    html += '<div style="display:flex;justify-content:space-between;align-items:center"><span style="font-size:13px;font-weight:700">' + f.name + '</span><span style="font-size:10px;color:var(--pink);font-weight:700">Lv.' + lv + ' ' + title + '</span></div>';
    html += '<div style="font-size:11px;color:var(--text-sub);margin:2px 0">' + f.desc + '</div>';
    html += '<div style="height:6px;background:rgba(0,0,0,.06);border-radius:3px;overflow:hidden;margin-top:4px"><div style="height:100%;width:' + pct + '%;background:linear-gradient(90deg,#FF5FA2,#B066FF);border-radius:3px;transition:width .5s"></div></div>';
    html += '</div>';
    html += '<button class="friend-gift-btn" data-fid="' + f.id + '" style="padding:6px 12px;background:' + (canGift ? 'linear-gradient(135deg,#FF5FA2,#B066FF)' : 'rgba(0,0,0,.1)') + ';color:' + (canGift ? '#fff' : 'var(--text-sub)') + ';border:none;border-radius:10px;font-size:11px;font-weight:700;cursor:' + (canGift ? 'pointer' : 'default') + ';white-space:nowrap" ' + (canGift ? '' : 'disabled') + '>' + f.gift + ' &#xC120;&#xBB3C;</button>';
    html += '</div>';
  });

  var totalPts = 0;
  FRIENDS.forEach(function(f){ totalPts += (fData[f.id] || {}).points || 0; });
  html += '<div style="text-align:center;margin-top:10px;padding:10px;background:rgba(255,95,162,.04);border-radius:12px">';
  html += '<div style="font-size:11px;color:var(--text-sub)">&#xCD1D; &#xCE5C;&#xBC00;&#xB3C4; &#xD3EC;&#xC778;&#xD2B8;</div>';
  html += '<div style="font-size:20px;font-weight:800;color:var(--pink)">' + totalPts + '</div>';
  html += '</div>';
  html += '</div>';
  overlay.innerHTML = html;
  document.body.appendChild(overlay);

  overlay.querySelectorAll('.friend-gift-btn:not([disabled])').forEach(function(btn){
    btn.onclick = function(){
      var fid = btn.dataset.fid;
      var d = getFriendData();
      if(!d[fid]) d[fid] = {points:0,lastGift:0};
      var addPts = 2 + Math.floor(Math.random() * 4);
      d[fid].points = Math.min((d[fid].points || 0) + addPts, 100);
      d[fid].lastGift = Date.now();
      saveFriendData(d);
      sfxV13('friend_gift');
      var newLv = getFriendLevel(d[fid].points);
      if(newLv > getFriendLevel(d[fid].points - addPts)){
        sfxV13('friend_levelup');
        showToastV13('&#x1F496; ' + FRIENDS.filter(function(ff){return ff.id===fid})[0].name + ' &#xCE5C;&#xBC00;&#xB3C4; Lv.' + newLv + '!');
      } else {
        showToastV13('&#x1F381; &#xC120;&#xBB3C; &#xC804;&#xB2EC; &#xC644;&#xB8CC;! (+' + addPts + ')');
      }
      checkAndAwardV13();
      overlay.remove();
      openFriendship();
    };
  });

  document.getElementById('friendClose').onclick = function(){ overlay.remove(); };
  overlay.onclick = function(e){ if(e.target === overlay) overlay.remove(); };
}


// ============================================================
// 2. DAILY LOGIN REWARDS (출석 보상 시스템)
// ============================================================
var LOGIN_REWARDS = [
  {day:1,name:'&#xD558;&#xD2B8; x5',icon:'&#x1F497;',xp:10},
  {day:2,name:'&#xCE74;&#xB4DC; &#xAC00;&#xCC28; 1&#xD68C;',icon:'&#x1F0CF;',xp:15},
  {day:3,name:'XP +50',icon:'&#x2B50;',xp:50},
  {day:4,name:'&#xC6B0;&#xC815; &#xD3EC;&#xC778;&#xD2B8; x10',icon:'&#x1F91D;',xp:20},
  {day:5,name:'&#xC2A4;&#xD0EC;&#xD504; 3&#xAC1C;',icon:'&#x1F3AB;',xp:30},
  {day:6,name:'XP +100',icon:'&#x1F4AB;',xp:100},
  {day:7,name:'SSR &#xCE74;&#xB4DC; &#xBCF4;&#xC7A5;!',icon:'&#x1F451;',xp:200}
];

function getLoginData(){
  try{ return JSON.parse(localStorage.getItem('hatcuping_login_rewards') || '{}'); }catch(e){ return {}; }
}
function saveLoginData(data){
  try{ localStorage.setItem('hatcuping_login_rewards', JSON.stringify(data)); }catch(e){}
}

function getTodayStr(){
  var d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}

function openLoginRewards(){
  if(document.getElementById('loginModal')) return;
  trackV13Feature('login');
  sfxV13('login_open');

  var overlay = document.createElement('div');
  overlay.id = 'loginModal';
  overlay.className = 'modal-overlay show';
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');

  var lData = getLoginData();
  var today = getTodayStr();
  var streak = lData.streak || 0;
  var lastClaim = lData.lastClaim || '';
  var claimedToday = (lastClaim === today);
  var currentDay = (streak % 7) + 1;

  var html = '<div class="modal" style="max-width:380px">';
  html += '<button class="modal-close" id="loginClose" aria-label="&#xB2EB;&#xAE30;">&times;</button>';
  html += '<h3 style="font-size:17px">&#x1F4C5; &#xCD9C;&#xC11D; &#xBCF4;&#xC0C1;</h3>';
  html += '<div style="text-align:center;margin-bottom:12px"><span style="font-size:12px;color:var(--text-sub)">&#xC5F0;&#xC18D; &#xCD9C;&#xC11D;</span> <span style="font-size:18px;font-weight:800;color:var(--pink)">' + streak + '&#xC77C;</span></div>';
  html += '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:6px;margin-bottom:12px">';

  LOGIN_REWARDS.forEach(function(r){
    var isCurrent = (r.day === currentDay && !claimedToday);
    var isPast = (r.day < currentDay) || (r.day === currentDay && claimedToday);
    var bgColor = isPast ? 'rgba(76,175,80,.12)' : (isCurrent ? 'rgba(255,95,162,.12)' : 'rgba(0,0,0,.04)');
    var borderColor = isCurrent ? '2px solid var(--pink)' : (isPast ? '2px solid rgba(76,175,80,.3)' : '2px solid transparent');

    html += '<div style="text-align:center;padding:8px 2px;border-radius:12px;background:' + bgColor + ';border:' + borderColor + '">';
    html += '<div style="font-size:10px;color:var(--text-sub);font-weight:700">Day ' + r.day + '</div>';
    html += '<div style="font-size:18px;margin:4px 0">' + (isPast ? '&#x2705;' : r.icon) + '</div>';
    html += '<div style="font-size:9px;color:var(--text-sub)">' + r.name + '</div>';
    html += '</div>';
  });
  html += '</div>';

  if(!claimedToday){
    html += '<button id="claimLoginBtn" style="width:100%;padding:12px;background:linear-gradient(135deg,#FF5FA2,#B066FF);color:#fff;border:none;border-radius:14px;font-size:14px;font-weight:700;cursor:pointer">&#x1F381; Day ' + currentDay + ' &#xBCF4;&#xC0C1; &#xBC1B;&#xAE30;!</button>';
  } else {
    html += '<div style="text-align:center;padding:12px;color:var(--text-sub);font-size:13px;font-weight:700">&#x2705; &#xC624;&#xB298; &#xBCF4;&#xC0C1; &#xC644;&#xB8CC;! &#xB0B4;&#xC77C; &#xB2E4;&#xC2DC; &#xC624;&#xC138;&#xC694;!</div>';
  }
  html += '</div>';
  overlay.innerHTML = html;
  document.body.appendChild(overlay);

  var claimBtn = document.getElementById('claimLoginBtn');
  if(claimBtn){
    claimBtn.onclick = function(){
      var d = getLoginData();
      var yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      var yesterdayStr = yesterday.getFullYear() + '-' + String(yesterday.getMonth()+1).padStart(2,'0') + '-' + String(yesterday.getDate()).padStart(2,'0');

      if(d.lastClaim === yesterdayStr){
        d.streak = (d.streak || 0) + 1;
      } else if(d.lastClaim !== today){
        d.streak = 1;
      }
      d.lastClaim = today;
      d.totalClaims = (d.totalClaims || 0) + 1;
      saveLoginData(d);

      var reward = LOGIN_REWARDS[((d.streak - 1) % 7)];
      sfxV13('login_claim');
      showToastV13('&#x1F381; Day ' + ((d.streak - 1) % 7 + 1) + ' &#xBCF4;&#xC0C1;: ' + reward.name + '!');
      checkAndAwardV13();
      overlay.remove();
      openLoginRewards();
    };
  }

  document.getElementById('loginClose').onclick = function(){ overlay.remove(); };
  overlay.onclick = function(e){ if(e.target === overlay) overlay.remove(); };
}


// ============================================================
// 3. CARD FUSION WORKSHOP (카드 합성소)
// ============================================================
var FUSION_RECIPES = [
  {id:'f_love',name:'&#xC0AC;&#xB791;&#xC758; &#xBE5B;',icon:'&#x1F496;',need:['hachuping_n','romi_n'],result:'love_light_sr',tier:'SR',desc:'&#xD558;&#xCE04;&#xD551;+&#xB85C;&#xBBF8; &#xC735;&#xD569;'},
  {id:'f_justice',name:'&#xC815;&#xC758;&#xC758; &#xBD88;&#xAF43;',icon:'&#x1F525;',need:['baroping_r','chacha_r'],result:'justice_fire_sr',tier:'SR',desc:'&#xBC14;&#xB85C;&#xD551;+&#xCC28;&#xCC28;&#xD551; &#xC735;&#xD569;'},
  {id:'f_harmony',name:'&#xC870;&#xD654;&#xC758; &#xBA5C;&#xB85C;&#xB514;',icon:'&#x1F3B6;',need:['lala_r','muruping_n'],result:'harmony_melody_sr',tier:'SR',desc:'&#xB77C;&#xB77C;&#xD551;+&#xBB34;&#xB8E8;&#xD551; &#xC735;&#xD569;'},
  {id:'f_ice',name:'&#xC5BC;&#xC74C;&#xC758; &#xC655;&#xAD00;',icon:'&#x1F451;',need:['kkongkkong_sr','hana_sr'],result:'ice_crown_ssr',tier:'SSR',desc:'&#xAF49;&#xAF49;&#xD551;+&#xD558;&#xB098;&#xD551; &#xCD5C;&#xACE0; &#xC735;&#xD569;'},
  {id:'f_rainbow',name:'&#xBB34;&#xC9C0;&#xAC1C; &#xC6D0;&#xC11D;',icon:'&#x1F48E;',need:['muruping_sr','hachuping_sr'],result:'rainbow_gem_ssr',tier:'SSR',desc:'&#xBB34;&#xB8E8;&#xD551;+&#xD558;&#xCE04;&#xD551; SSR &#xC735;&#xD569;'},
  {id:'f_star',name:'&#xBCC4;&#xBE5B; &#xC218;&#xD638;&#xC790;',icon:'&#x2B50;',need:['baroping_sr','romi_r'],result:'star_guardian_ssr',tier:'SSR',desc:'&#xBC14;&#xB85C;&#xD551;+&#xB85C;&#xBBF8; &#xC804;&#xC124; &#xC735;&#xD569;'}
];

function getFusionData(){
  try{ return JSON.parse(localStorage.getItem('hatcuping_fusions') || '[]'); }catch(e){ return []; }
}
function saveFusionData(data){
  try{ localStorage.setItem('hatcuping_fusions', JSON.stringify(data)); }catch(e){}
}

function openFusionWorkshop(){
  if(document.getElementById('fusionModal')) return;
  trackV13Feature('fusion');
  sfxV13('fusion_open');

  var overlay = document.createElement('div');
  overlay.id = 'fusionModal';
  overlay.className = 'modal-overlay show';
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');

  var fused = getFusionData();
  var html = '<div class="modal" style="max-width:420px">';
  html += '<button class="modal-close" id="fusionClose" aria-label="&#xB2EB;&#xAE30;">&times;</button>';
  html += '<h3 style="font-size:17px">&#x2728; &#xCE74;&#xB4DC; &#xD569;&#xC131;&#xC18C; (' + fused.length + '/' + FUSION_RECIPES.length + ')</h3>';
  html += '<div style="font-size:12px;color:var(--text-sub);margin-bottom:12px">&#xCE74;&#xB4DC;&#xB97C; &#xC870;&#xD569;&#xD574; &#xAC15;&#xB825;&#xD55C; &#xC0C8; &#xCE74;&#xB4DC;&#xB97C; &#xB9CC;&#xB4DC;&#xC138;&#xC694;!</div>';

  FUSION_RECIPES.forEach(function(r){
    var isDone = fused.indexOf(r.id) !== -1;
    var tierColor = r.tier === 'SSR' ? '#FFD700' : '#9C27B0';
    html += '<div class="fusion-recipe" data-fid="' + r.id + '" style="display:flex;align-items:center;gap:10px;padding:12px;margin-bottom:6px;border-radius:14px;background:' + (isDone ? 'rgba(255,215,0,.08)' : 'rgba(0,0,0,.03)') + ';cursor:pointer;transition:all .2s;border:1px solid ' + (isDone ? 'rgba(255,215,0,.2)' : 'transparent') + '">';
    html += '<div style="width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,' + (isDone ? 'rgba(255,215,0,.2)' : 'rgba(0,0,0,.06)') + ',rgba(255,95,162,.1));display:flex;align-items:center;justify-content:center;font-size:20px">' + (isDone ? r.icon : '&#x1F512;') + '</div>';
    html += '<div style="flex:1"><div style="font-size:13px;font-weight:700">' + (isDone ? r.name : '???') + ' <span style="font-size:10px;color:' + tierColor + ';font-weight:800">' + r.tier + '</span></div>';
    html += '<div style="font-size:11px;color:var(--text-sub)">' + (isDone ? r.desc : '&#xD569;&#xC131; &#xC870;&#xAC74;&#xC744; &#xCDA9;&#xC871;&#xD558;&#xC138;&#xC694;') + '</div></div>';
    if(!isDone) html += '<button class="fusion-try-btn" data-fid="' + r.id + '" style="padding:6px 12px;background:linear-gradient(135deg,#FF5FA2,#B066FF);color:#fff;border:none;border-radius:10px;font-size:11px;font-weight:700;cursor:pointer;white-space:nowrap">&#xD569;&#xC131;!</button>';
    else html += '<span style="font-size:16px">&#x2705;</span>';
    html += '</div>';
  });

  html += '</div>';
  overlay.innerHTML = html;
  document.body.appendChild(overlay);

  overlay.querySelectorAll('.fusion-try-btn').forEach(function(btn){
    btn.onclick = function(e){
      e.stopPropagation();
      var fid = btn.dataset.fid;
      var d = getFusionData();
      if(d.indexOf(fid) === -1){
        if(Math.random() < 0.7){
          d.push(fid);
          saveFusionData(d);
          sfxV13('fusion_success');
          var recipe = FUSION_RECIPES.filter(function(r){ return r.id === fid; })[0];
          showToastV13('&#x2728; &#xD569;&#xC131; &#xC131;&#xACF5;! ' + recipe.name + ' &#xD68D;&#xB4DD;!');
        } else {
          showToastV13('&#x1F4A8; &#xD569;&#xC131; &#xC2E4;&#xD328;... &#xB2E4;&#xC2DC; &#xC2DC;&#xB3C4;&#xD558;&#xC138;&#xC694;!');
        }
        checkAndAwardV13();
        overlay.remove();
        openFusionWorkshop();
      }
    };
  });

  document.getElementById('fusionClose').onclick = function(){ overlay.remove(); };
  overlay.onclick = function(e){ if(e.target === overlay) overlay.remove(); };
}


// ============================================================
// 4. SKILL TREE (스킬 트리 Canvas 시각화)
// ============================================================
var SKILL_TREE = [
  {id:'s_dash',name:'&#xB300;&#xC2DC;',icon:'&#x1F4A8;',desc:'&#xBE60;&#xB978; &#xC774;&#xB3D9;',tier:1,x:0.5,y:0.15,cost:10},
  {id:'s_djump',name:'&#xB354;&#xBE14;&#xC810;&#xD504;',icon:'&#x2B06;&#xFE0F;',desc:'2&#xB2E8; &#xC810;&#xD504;',tier:1,x:0.25,y:0.15,cost:10},
  {id:'s_shield',name:'&#xC2E4;&#xB4DC;',icon:'&#x1F6E1;&#xFE0F;',desc:'1&#xD68C; &#xD53C;&#xD574; &#xBC29;&#xC5B4;',tier:1,x:0.75,y:0.15,cost:10},
  {id:'s_heal',name:'&#xD799;&#xB9C1;',icon:'&#x1F49A;',desc:'HP &#xD68C;&#xBCF5;',tier:2,x:0.35,y:0.4,cost:25,req:'s_djump'},
  {id:'s_power',name:'&#xD30C;&#xC6CC;&#xC5C5;',icon:'&#x1F4AA;',desc:'&#xACF5;&#xACA9;&#xB825; +30%',tier:2,x:0.65,y:0.4,cost:25,req:'s_dash'},
  {id:'s_speed',name:'&#xC2A4;&#xD53C;&#xB4DC;',icon:'&#x26A1;',desc:'&#xC774;&#xB3D9;&#xC18D;&#xB3C4; +20%',tier:2,x:0.5,y:0.4,cost:25,req:'s_shield'},
  {id:'s_magnet',name:'&#xC790;&#xC11D;',icon:'&#x1F9F2;',desc:'&#xC544;&#xC774;&#xD15C; &#xC790;&#xB3D9; &#xC218;&#xC9D1;',tier:3,x:0.3,y:0.65,cost:50,req:'s_heal'},
  {id:'s_combo',name:'&#xCF64;&#xBCF4; &#xB9C8;&#xC2A4;&#xD130;',icon:'&#x1F525;',desc:'&#xCF64;&#xBCF4; &#xBC30;&#xC728; x2',tier:3,x:0.7,y:0.65,cost:50,req:'s_power'},
  {id:'s_revive',name:'&#xBD80;&#xD65C;',icon:'&#x1F4AB;',desc:'&#xC0AC;&#xB9DD;&#xC2DC; 1&#xD68C; &#xBD80;&#xD65C;',tier:3,x:0.5,y:0.65,cost:50,req:'s_speed'},
  {id:'s_ultimate',name:'&#xC774;&#xBAA8;&#xC158; &#xD3ED;&#xBC1C;',icon:'&#x1F31F;',desc:'&#xC804;&#xCCB4; &#xC801; &#xD574;&#xC81C;',tier:4,x:0.5,y:0.88,cost:100,req:'s_revive'}
];

function getSkillData(){
  try{ return JSON.parse(localStorage.getItem('hatcuping_skills') || '[]'); }catch(e){ return []; }
}
function saveSkillData(data){
  try{ localStorage.setItem('hatcuping_skills', JSON.stringify(data)); }catch(e){}
}

function getSkillPoints(){
  try{ return parseInt(localStorage.getItem('hatcuping_skill_points') || '50'); }catch(e){ return 50; }
}
function saveSkillPoints(pts){
  try{ localStorage.setItem('hatcuping_skill_points', String(pts)); }catch(e){}
}

function openSkillTree(){
  if(document.getElementById('skillModal')) return;
  trackV13Feature('skilltree');
  sfxV13('skill_open');

  var overlay = document.createElement('div');
  overlay.id = 'skillModal';
  overlay.className = 'modal-overlay show';
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');

  var unlocked = getSkillData();
  var pts = getSkillPoints();

  var html = '<div class="modal" style="max-width:420px">';
  html += '<button class="modal-close" id="skillClose" aria-label="&#xB2EB;&#xAE30;">&times;</button>';
  html += '<h3 style="font-size:17px">&#x1F332; &#xC2A4;&#xD0AC; &#xD2B8;&#xB9AC;</h3>';
  html += '<div style="text-align:center;margin-bottom:8px"><span style="font-size:12px;color:var(--text-sub)">&#xC2A4;&#xD0AC; &#xD3EC;&#xC778;&#xD2B8;:</span> <span style="font-size:16px;font-weight:800;color:var(--pink)">' + pts + '</span> | <span style="font-size:12px;color:var(--text-sub)">&#xD574;&#xAE08;: ' + unlocked.length + '/' + SKILL_TREE.length + '</span></div>';
  html += '<canvas id="skillTreeCanvas" width="380" height="340" style="width:100%;border-radius:12px;background:rgba(0,0,0,.03);cursor:pointer"></canvas>';
  html += '<div id="skillInfo" style="margin-top:8px;padding:10px;background:rgba(255,95,162,.04);border-radius:12px;font-size:12px;color:var(--text-sub);text-align:center">&#xC2A4;&#xD0AC;&#xC744; &#xD074;&#xB9AD;&#xD574; &#xD574;&#xAE08;&#xD558;&#xC138;&#xC694;</div>';
  html += '</div>';
  overlay.innerHTML = html;
  document.body.appendChild(overlay);

  var canvas = document.getElementById('skillTreeCanvas');
  var ctx2d = canvas.getContext('2d');
  var isDark = document.body.classList.contains('dark');

  function drawSkillTree(){
    ctx2d.clearRect(0, 0, 380, 340);
    var bgGrad = ctx2d.createLinearGradient(0, 0, 0, 340);
    bgGrad.addColorStop(0, isDark ? '#1a0a2e' : '#FFF8FC');
    bgGrad.addColorStop(1, isDark ? '#2d1040' : '#F0E8FF');
    ctx2d.fillStyle = bgGrad;
    ctx2d.fillRect(0, 0, 380, 340);

    SKILL_TREE.forEach(function(skill){
      if(skill.req){
        var parent = SKILL_TREE.filter(function(s){ return s.id === skill.req; })[0];
        if(parent){
          ctx2d.beginPath();
          ctx2d.moveTo(parent.x * 380, parent.y * 340);
          ctx2d.lineTo(skill.x * 380, skill.y * 340);
          ctx2d.strokeStyle = unlocked.indexOf(skill.id) !== -1 ? '#FF5FA2' : (isDark ? 'rgba(255,255,255,.15)' : 'rgba(0,0,0,.1)');
          ctx2d.lineWidth = unlocked.indexOf(skill.id) !== -1 ? 3 : 1.5;
          ctx2d.setLineDash(unlocked.indexOf(skill.id) !== -1 ? [] : [4,4]);
          ctx2d.stroke();
          ctx2d.setLineDash([]);
        }
      }
    });

    SKILL_TREE.forEach(function(skill){
      var sx = skill.x * 380;
      var sy = skill.y * 340;
      var isUnlocked = unlocked.indexOf(skill.id) !== -1;
      var canUnlock = !isUnlocked && (!skill.req || unlocked.indexOf(skill.req) !== -1) && pts >= skill.cost;

      ctx2d.beginPath();
      ctx2d.arc(sx, sy, 22, 0, Math.PI * 2);
      if(isUnlocked){
        var grad = ctx2d.createRadialGradient(sx, sy, 0, sx, sy, 22);
        grad.addColorStop(0, '#FF8EC4');
        grad.addColorStop(1, '#FF5FA2');
        ctx2d.fillStyle = grad;
      } else if(canUnlock){
        ctx2d.fillStyle = isDark ? 'rgba(255,95,162,.2)' : 'rgba(255,95,162,.1)';
      } else {
        ctx2d.fillStyle = isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)';
      }
      ctx2d.fill();

      if(canUnlock){
        ctx2d.strokeStyle = '#FF5FA2';
        ctx2d.lineWidth = 2;
        ctx2d.stroke();
      }

      ctx2d.font = '16px sans-serif';
      ctx2d.textAlign = 'center';
      ctx2d.textBaseline = 'middle';
      ctx2d.fillStyle = isUnlocked ? '#fff' : (isDark ? '#aaa' : '#666');
      ctx2d.fillText(isUnlocked ? '✓' : skill.cost + '', sx, sy);

      ctx2d.font = '10px sans-serif';
      ctx2d.fillStyle = isDark ? '#ccc' : '#555';
      ctx2d.fillText(skill.name, sx, sy + 32);
    });

    ctx2d.font = 'bold 11px sans-serif';
    ctx2d.textAlign = 'center';
    ctx2d.fillStyle = isDark ? '#8866AA' : '#B088CC';
    ctx2d.fillText('Tier 1 - 기본', 190, 12);
    ctx2d.fillText('Tier 2 - 중급', 190, 130);
    ctx2d.fillText('Tier 3 - 고급', 190, 215);
    ctx2d.fillText('Tier 4 - 전설', 190, 290);
  }

  drawSkillTree();

  canvas.onclick = function(e){
    var rect = canvas.getBoundingClientRect();
    var mx = (e.clientX - rect.left) * (380 / rect.width);
    var my = (e.clientY - rect.top) * (340 / rect.height);

    SKILL_TREE.forEach(function(skill){
      var sx = skill.x * 380;
      var sy = skill.y * 340;
      var dist = Math.sqrt((mx - sx) * (mx - sx) + (my - sy) * (my - sy));
      if(dist < 24){
        var isUnlocked = unlocked.indexOf(skill.id) !== -1;
        if(isUnlocked){
          document.getElementById('skillInfo').innerHTML = '&#x2705; <b>' + skill.name + '</b> - ' + skill.desc + ' (&#xD574;&#xAE08;&#xB428;)';
          return;
        }
        var canUnlock = (!skill.req || unlocked.indexOf(skill.req) !== -1) && pts >= skill.cost;
        if(canUnlock){
          unlocked.push(skill.id);
          saveSkillData(unlocked);
          pts -= skill.cost;
          saveSkillPoints(pts);
          sfxV13('skill_unlock');
          showToastV13('&#x1F332; ' + skill.name + ' &#xC2A4;&#xD0AC; &#xD574;&#xAE08;!');
          checkAndAwardV13();
          overlay.remove();
          openSkillTree();
        } else {
          var reason = pts < skill.cost ? '&#xD3EC;&#xC778;&#xD2B8; &#xBD80;&#xC871; (' + pts + '/' + skill.cost + ')' : '&#xC120;&#xD589; &#xC2A4;&#xD0AC; &#xD544;&#xC694;';
          document.getElementById('skillInfo').innerHTML = '&#x1F512; <b>' + skill.name + '</b> - ' + skill.desc + '<br>' + reason;
        }
      }
    });
  };

  document.getElementById('skillClose').onclick = function(){ overlay.remove(); };
  overlay.onclick = function(e){ if(e.target === overlay) overlay.remove(); };
}


// ============================================================
// 5. SEASON DUNGEON (시즌 던전 4종)
// ============================================================
var SEASON_DUNGEONS = [
  {id:'spring',name:'&#xBD04;&#xC758; &#xAF43;&#xBC2D; &#xB358;&#xC804;',icon:'&#x1F338;',color:'#FF69B4',boss:'&#xAF43;&#xC694;&#xC815;',bossHP:120,reward:'XP +80'},
  {id:'summer',name:'&#xC5EC;&#xB984;&#xC758; &#xBC14;&#xB2E4; &#xB358;&#xC804;',icon:'&#x1F3D6;&#xFE0F;',color:'#00BCD4',boss:'&#xD30C;&#xB3C4; &#xBC94;&#xC7A5;',bossHP:150,reward:'XP +100'},
  {id:'autumn',name:'&#xAC00;&#xC744;&#xC758; &#xB2E8;&#xD48D; &#xB358;&#xC804;',icon:'&#x1F341;',color:'#FF9800',boss:'&#xB2E8;&#xD48D; &#xB9C8;&#xBC95;&#xC0AC;',bossHP:180,reward:'XP +120'},
  {id:'winter',name:'&#xACA8;&#xC6B8;&#xC758; &#xB208;&#xAF43; &#xB358;&#xC804;',icon:'&#x2744;&#xFE0F;',color:'#90CAF9',boss:'&#xC5BC;&#xC74C; &#xAC70;&#xC778;',bossHP:200,reward:'XP +150'}
];

function getDungeonData(){
  try{ return JSON.parse(localStorage.getItem('hatcuping_dungeons') || '{}'); }catch(e){ return {}; }
}
function saveDungeonData(data){
  try{ localStorage.setItem('hatcuping_dungeons', JSON.stringify(data)); }catch(e){}
}

function getCurrentSeason(){
  var m = new Date().getMonth();
  if(m >= 2 && m <= 4) return 'spring';
  if(m >= 5 && m <= 7) return 'summer';
  if(m >= 8 && m <= 10) return 'autumn';
  return 'winter';
}

function openSeasonDungeon(){
  if(document.getElementById('dungeonModal')) return;
  trackV13Feature('dungeon');
  sfxV13('dungeon_open');

  var overlay = document.createElement('div');
  overlay.id = 'dungeonModal';
  overlay.className = 'modal-overlay show';
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');

  var dData = getDungeonData();
  var currentSeason = getCurrentSeason();

  var html = '<div class="modal" style="max-width:420px">';
  html += '<button class="modal-close" id="dungeonClose" aria-label="&#xB2EB;&#xAE30;">&times;</button>';
  html += '<h3 style="font-size:17px">&#x1F3F0; &#xC2DC;&#xC98C; &#xB358;&#xC804;</h3>';
  html += '<div style="font-size:12px;color:var(--text-sub);margin-bottom:12px">&#xACC4;&#xC808;&#xBCC4; &#xB358;&#xC804;&#xC744; &#xD074;&#xB9AC;&#xC5B4;&#xD558;&#xC138;&#xC694;! &#xD604;&#xC7AC;: ' + {spring:'&#xBD04;',summer:'&#xC5EC;&#xB984;',autumn:'&#xAC00;&#xC744;',winter:'&#xACA8;&#xC6B8;'}[currentSeason] + '</div>';

  SEASON_DUNGEONS.forEach(function(dg){
    var cleared = !!(dData[dg.id] && dData[dg.id].cleared);
    var bestTime = (dData[dg.id] && dData[dg.id].bestTime) || null;
    var isCurrent = (dg.id === currentSeason);
    html += '<div style="display:flex;align-items:center;gap:10px;padding:12px;margin-bottom:6px;border-radius:14px;background:' + (isCurrent ? 'rgba(255,95,162,.06)' : 'rgba(0,0,0,.03)') + ';border:2px solid ' + (isCurrent ? dg.color + '40' : 'transparent') + '">';
    html += '<div style="width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,' + dg.color + '20,' + dg.color + '40);display:flex;align-items:center;justify-content:center;font-size:22px">' + dg.icon + '</div>';
    html += '<div style="flex:1"><div style="font-size:13px;font-weight:700">' + dg.name + (isCurrent ? ' <span style="font-size:9px;background:' + dg.color + ';color:#fff;padding:1px 6px;border-radius:8px">NOW</span>' : '') + '</div>';
    html += '<div style="font-size:11px;color:var(--text-sub)">&#xBCF4;&#xC2A4;: ' + dg.boss + ' (HP ' + dg.bossHP + ') | ' + dg.reward + '</div>';
    if(bestTime) html += '<div style="font-size:10px;color:var(--pink);margin-top:2px">&#xCD5C;&#xACE0; &#xAE30;&#xB85D;: ' + bestTime + '&#xCD08;</div>';
    html += '</div>';
    html += '<button class="dungeon-enter-btn" data-did="' + dg.id + '" style="padding:8px 14px;background:linear-gradient(135deg,' + dg.color + ',' + dg.color + 'CC);color:#fff;border:none;border-radius:12px;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap">' + (cleared ? '&#xC7AC;&#xB3C4;&#xC804;' : '&#xC785;&#xC7A5;!') + '</button>';
    html += '</div>';
  });

  html += '</div>';
  overlay.innerHTML = html;
  document.body.appendChild(overlay);

  overlay.querySelectorAll('.dungeon-enter-btn').forEach(function(btn){
    btn.onclick = function(){
      var did = btn.dataset.did;
      var dg = SEASON_DUNGEONS.filter(function(d){ return d.id === did; })[0];
      if(!dg) return;
      overlay.remove();
      startDungeonBattle(dg);
    };
  });

  document.getElementById('dungeonClose').onclick = function(){ overlay.remove(); };
  overlay.onclick = function(e){ if(e.target === overlay) overlay.remove(); };
}

function startDungeonBattle(dg){
  var overlay = document.createElement('div');
  overlay.id = 'dungeonBattleModal';
  overlay.className = 'modal-overlay show';

  var bossHP = dg.bossHP;
  var playerHP = 100;
  var turn = 0;
  var startTime = Date.now();
  var log = [];

  function renderBattle(){
    var bossHPpct = Math.max(0, bossHP / dg.bossHP * 100);
    var playerHPpct = Math.max(0, playerHP);

    var html = '<div class="modal" style="max-width:380px">';
    html += '<h3 style="font-size:16px">' + dg.icon + ' vs ' + dg.boss + '</h3>';
    html += '<div style="margin-bottom:8px"><div style="font-size:11px;color:var(--text-sub);margin-bottom:2px">&#xBCF4;&#xC2A4; HP: ' + Math.max(0,bossHP) + '/' + dg.bossHP + '</div>';
    html += '<div style="height:10px;background:rgba(0,0,0,.06);border-radius:5px;overflow:hidden"><div style="height:100%;width:' + bossHPpct + '%;background:linear-gradient(90deg,#F44336,#FF5252);border-radius:5px;transition:width .3s"></div></div></div>';
    html += '<div style="margin-bottom:8px"><div style="font-size:11px;color:var(--text-sub);margin-bottom:2px">&#xB0B4; HP: ' + Math.max(0,playerHP) + '/100</div>';
    html += '<div style="height:10px;background:rgba(0,0,0,.06);border-radius:5px;overflow:hidden"><div style="height:100%;width:' + playerHPpct + '%;background:linear-gradient(90deg,#4CAF50,#66BB6A);border-radius:5px;transition:width .3s"></div></div></div>';

    html += '<div style="max-height:80px;overflow-y:auto;margin-bottom:10px;padding:6px;background:rgba(0,0,0,.03);border-radius:8px;font-size:11px;color:var(--text-sub)">';
    log.slice(-4).forEach(function(l){ html += '<div>' + l + '</div>'; });
    html += '</div>';

    if(bossHP <= 0){
      var elapsed = Math.round((Date.now() - startTime) / 1000);
      html += '<div style="text-align:center;padding:12px;background:rgba(76,175,80,.1);border-radius:12px;margin-bottom:8px"><div style="font-size:16px;font-weight:800;color:#4CAF50">&#x1F389; &#xC2B9;&#xB9AC;!</div><div style="font-size:12px;color:var(--text-sub)">' + elapsed + '&#xCD08; | ' + dg.reward + '</div></div>';
      html += '<button id="dungeonVictory" style="width:100%;padding:10px;background:linear-gradient(135deg,#4CAF50,#66BB6A);color:#fff;border:none;border-radius:12px;font-size:13px;font-weight:700;cursor:pointer">&#xC644;&#xB8CC;</button>';
    } else if(playerHP <= 0){
      html += '<div style="text-align:center;padding:12px;background:rgba(244,67,54,.1);border-radius:12px;margin-bottom:8px"><div style="font-size:16px;font-weight:800;color:#F44336">&#x1F4A5; &#xD328;&#xBC30;...</div><div style="font-size:12px;color:var(--text-sub)">&#xB2E4;&#xC2DC; &#xB3C4;&#xC804;&#xD558;&#xC138;&#xC694;!</div></div>';
      html += '<button id="dungeonRetry" style="width:100%;padding:10px;background:linear-gradient(135deg,#FF5FA2,#B066FF);color:#fff;border:none;border-radius:12px;font-size:13px;font-weight:700;cursor:pointer">&#xB2EB;&#xAE30;</button>';
    } else {
      html += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px">';
      html += '<button class="db-action" data-act="attack" style="padding:10px;background:linear-gradient(135deg,#F44336,#FF5252);color:#fff;border:none;border-radius:12px;font-size:12px;font-weight:700;cursor:pointer">&#x2694;&#xFE0F; &#xACF5;&#xACA9;</button>';
      html += '<button class="db-action" data-act="skill" style="padding:10px;background:linear-gradient(135deg,#9C27B0,#BA68C8);color:#fff;border:none;border-radius:12px;font-size:12px;font-weight:700;cursor:pointer">&#x2728; &#xC2A4;&#xD0AC;</button>';
      html += '<button class="db-action" data-act="heal" style="padding:10px;background:linear-gradient(135deg,#4CAF50,#66BB6A);color:#fff;border:none;border-radius:12px;font-size:12px;font-weight:700;cursor:pointer">&#x1F49A; &#xD68C;&#xBCF5;</button>';
      html += '</div>';
    }
    html += '</div>';
    overlay.innerHTML = html;

    overlay.querySelectorAll('.db-action').forEach(function(btn){
      btn.onclick = function(){
        var act = btn.dataset.act;
        turn++;
        if(act === 'attack'){
          var dmg = 15 + Math.floor(Math.random() * 15);
          bossHP -= dmg;
          log.push('&#x2694;&#xFE0F; &#xACF5;&#xACA9;! ' + dmg + ' &#xB370;&#xBBF8;&#xC9C0;!');
          sfxV13('dungeon_battle');
        } else if(act === 'skill'){
          var dmg2 = 25 + Math.floor(Math.random() * 20);
          bossHP -= dmg2;
          log.push('&#x2728; &#xC2A4;&#xD0AC;! ' + dmg2 + ' &#xB370;&#xBBF8;&#xC9C0;!');
          sfxV13('dungeon_battle');
        } else {
          var healAmt = 20 + Math.floor(Math.random() * 15);
          playerHP = Math.min(100, playerHP + healAmt);
          log.push('&#x1F49A; &#xD68C;&#xBCF5;! +' + healAmt + ' HP');
        }
        if(bossHP > 0){
          var bossDmg = 10 + Math.floor(Math.random() * 15);
          playerHP -= bossDmg;
          log.push('&#x1F47E; ' + dg.boss + ' &#xACF5;&#xACA9;! -' + bossDmg + ' HP');
        }
        if(bossHP <= 0){
          sfxV13('dungeon_clear');
          var dd = getDungeonData();
          var elapsed2 = Math.round((Date.now() - startTime) / 1000);
          dd[dg.id] = {cleared:true, bestTime: dd[dg.id] && dd[dg.id].bestTime ? Math.min(dd[dg.id].bestTime, elapsed2) : elapsed2};
          saveDungeonData(dd);
          checkAndAwardV13();
        }
        renderBattle();
      };
    });

    var victoryBtn = document.getElementById('dungeonVictory');
    if(victoryBtn) victoryBtn.onclick = function(){ overlay.remove(); };
    var retryBtn = document.getElementById('dungeonRetry');
    if(retryBtn) retryBtn.onclick = function(){ overlay.remove(); };
  }

  document.body.appendChild(overlay);
  renderBattle();
}


// ============================================================
// 6. ACHIEVEMENT GALLERY (영웅의 전당 Canvas)
// ============================================================
function openAchievementGallery(){
  if(document.getElementById('galleryModal')) return;
  trackV13Feature('gallery');
  sfxV13('gallery_open');

  var overlay = document.createElement('div');
  overlay.id = 'galleryModal';
  overlay.className = 'modal-overlay show';
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');

  var html = '<div class="modal" style="max-width:420px">';
  html += '<button class="modal-close" id="galleryClose" aria-label="&#xB2EB;&#xAE30;">&times;</button>';
  html += '<h3 style="font-size:17px">&#x1F3C6; &#xC601;&#xC6C5;&#xC758; &#xC804;&#xB2F9;</h3>';
  html += '<canvas id="galleryCanvas" width="380" height="280" style="width:100%;border-radius:12px;background:rgba(0,0,0,.03)"></canvas>';
  html += '<div style="margin-top:8px;text-align:center;font-size:11px;color:var(--text-sub)">&#xC5C5;&#xC801; &#xB2EC;&#xC131; &#xD604;&#xD669; &#xC2DC;&#xAC01;&#xD654;</div>';
  html += '</div>';
  overlay.innerHTML = html;
  document.body.appendChild(overlay);

  var canvas = document.getElementById('galleryCanvas');
  var ctx2d = canvas.getContext('2d');
  var isDark = document.body.classList.contains('dark');

  var achievements = [];
  try{ achievements = JSON.parse(localStorage.getItem('hatcuping_achievements') || '{}'); }catch(e){}
  var total = window.AD ? window.AD.length : 94;
  var unlocked = Object.keys(achievements).length;
  var pct = Math.round(unlocked / total * 100);

  var bgGrad = ctx2d.createLinearGradient(0, 0, 380, 280);
  bgGrad.addColorStop(0, isDark ? '#1a0a2e' : '#FFF8FC');
  bgGrad.addColorStop(1, isDark ? '#2d1040' : '#F0E8FF');
  ctx2d.fillStyle = bgGrad;
  ctx2d.fillRect(0, 0, 380, 280);

  ctx2d.font = 'bold 14px sans-serif';
  ctx2d.textAlign = 'center';
  ctx2d.fillStyle = isDark ? '#eee' : '#333';
  ctx2d.fillText('업적 달성률', 190, 24);

  ctx2d.beginPath();
  ctx2d.arc(190, 100, 50, 0, Math.PI * 2);
  ctx2d.fillStyle = isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)';
  ctx2d.fill();
  ctx2d.beginPath();
  ctx2d.arc(190, 100, 50, -Math.PI / 2, -Math.PI / 2 + (pct / 100) * Math.PI * 2);
  ctx2d.strokeStyle = '#FF5FA2';
  ctx2d.lineWidth = 8;
  ctx2d.lineCap = 'round';
  ctx2d.stroke();
  ctx2d.font = 'bold 22px sans-serif';
  ctx2d.fillStyle = isDark ? '#FF8EC4' : '#FF5FA2';
  ctx2d.textAlign = 'center';
  ctx2d.textBaseline = 'middle';
  ctx2d.fillText(pct + '%', 190, 96);
  ctx2d.font = '10px sans-serif';
  ctx2d.fillStyle = isDark ? '#aaa' : '#888';
  ctx2d.fillText(unlocked + '/' + total, 190, 114);

  var categories = [{name:'플랫포머',key:'plat',color:'#FF5FA2'},{name:'RPG',key:'rpg',color:'#8B5CF6'},{name:'일반',key:'general',color:'#FF9800'}];
  var barY = 180;
  categories.forEach(function(cat){
    var catAll = (window.AD || []).filter(function(a){ return a.cat === cat.key; });
    var catUnlocked = catAll.filter(function(a){ return !!achievements[a.id]; }).length;
    var catPct = catAll.length > 0 ? catUnlocked / catAll.length * 100 : 0;

    ctx2d.font = '11px sans-serif';
    ctx2d.textAlign = 'right';
    ctx2d.fillStyle = isDark ? '#ccc' : '#555';
    ctx2d.fillText(cat.name, 80, barY + 10);

    ctx2d.fillStyle = isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)';
    ctx2d.fillRect(90, barY, 240, 16);
    ctx2d.fillStyle = cat.color;
    ctx2d.fillRect(90, barY, 240 * catPct / 100, 16);

    ctx2d.font = '10px sans-serif';
    ctx2d.textAlign = 'left';
    ctx2d.fillStyle = isDark ? '#eee' : '#333';
    ctx2d.fillText(catUnlocked + '/' + catAll.length + ' (' + Math.round(catPct) + '%)', 340, barY + 12);
    barY += 28;
  });

  document.getElementById('galleryClose').onclick = function(){ overlay.remove(); };
  overlay.onclick = function(e){ if(e.target === overlay) overlay.remove(); };
}


// ============================================================
// 7. STAMP COLLECTION BOOK (스탬프 수집 20종)
// ============================================================
var STAMPS = [
  {id:'st_first_play',name:'&#xCCAB; &#xD50C;&#xB808;&#xC774;',icon:'&#x1F3AE;',desc:'&#xAC8C;&#xC784; &#xCCAB; &#xC2DC;&#xC791;'},
  {id:'st_dark_mode',name:'&#xC5B4;&#xB460;&#xC758; &#xBAA8;&#xD5D8;&#xAC00;',icon:'&#x1F319;',desc:'&#xB2E4;&#xD06C;&#xBAA8;&#xB4DC; &#xC0AC;&#xC6A9;'},
  {id:'st_achieve_10',name:'&#xC5C5;&#xC801; &#xC218;&#xC9D1;&#xAC00;',icon:'&#x1F3C6;',desc:'10&#xAC1C; &#xC5C5;&#xC801; &#xB2EC;&#xC131;'},
  {id:'st_card_5',name:'&#xCE74;&#xB4DC; &#xC218;&#xC9D1;&#xAC00;',icon:'&#x1F0CF;',desc:'5&#xC7A5; &#xCE74;&#xB4DC; &#xC218;&#xC9D1;'},
  {id:'st_boss_clear',name:'&#xBCF4;&#xC2A4; &#xD5CC;&#xD130;',icon:'&#x1F409;',desc:'&#xBCF4;&#xC2A4; &#xCC98;&#xCE58;'},
  {id:'st_quiz_10',name:'&#xD000;&#xC988; &#xBC15;&#xC0AC;',icon:'&#x1F4DD;',desc:'&#xD000;&#xC988; 10&#xBB38; &#xC815;&#xB2F5;'},
  {id:'st_friend_3',name:'&#xC6B0;&#xC815;&#xC758; &#xC2DC;&#xC791;',icon:'&#x1F91D;',desc:'3&#xBA85; &#xCE5C;&#xBC00;&#xB3C4; Lv.3+'},
  {id:'st_login_7',name:'&#xAC1C;&#xADFC; &#xD50C;&#xB808;&#xC774;&#xC5B4;',icon:'&#x1F4C5;',desc:'7&#xC77C; &#xC5F0;&#xC18D; &#xCD9C;&#xC11D;'},
  {id:'st_fusion_1',name:'&#xD569;&#xC131; &#xCC28;&#xC6D4;',icon:'&#x2728;',desc:'&#xCCAB; &#xCE74;&#xB4DC; &#xD569;&#xC131;'},
  {id:'st_skill_3',name:'&#xC2A4;&#xD0AC; &#xC218;&#xB828;&#xC0DD;',icon:'&#x1F332;',desc:'3&#xAC1C; &#xC2A4;&#xD0AC; &#xD574;&#xAE08;'},
  {id:'st_dungeon_1',name:'&#xB358;&#xC804; &#xD0D0;&#xD5D8;&#xAC00;',icon:'&#x1F3F0;',desc:'&#xB358;&#xC804; 1&#xAC1C; &#xD074;&#xB9AC;&#xC5B4;'},
  {id:'st_dungeon_all',name:'&#xB358;&#xC804; &#xB9C8;&#xC2A4;&#xD130;',icon:'&#x1F3C5;',desc:'4&#xAC1C; &#xB358;&#xC804; &#xBAA8;&#xB450; &#xD074;&#xB9AC;&#xC5B4;'},
  {id:'st_jukebox',name:'&#xC74C;&#xC545; &#xC560;&#xD638;&#xAC00;',icon:'&#x1F3B6;',desc:'&#xC8FC;&#xD06C;&#xBC15;&#xC2A4; &#xC0AC;&#xC6A9;'},
  {id:'st_share',name:'&#xACF5;&#xC720;&#xC758; &#xAE30;&#xC220;',icon:'&#x1F4F1;',desc:'&#xACF5;&#xC720; &#xCE74;&#xB4DC; &#xC0DD;&#xC131;'},
  {id:'st_guide_all',name:'&#xAC00;&#xC774;&#xB4DC; &#xB9C8;&#xC2A4;&#xD130;',icon:'&#x1F4D6;',desc:'&#xAC00;&#xC774;&#xB4DC; &#xC804;&#xBD80; &#xC77D;&#xAE30;'},
  {id:'st_journal_5',name:'&#xC77C;&#xC9C0; &#xC791;&#xC131;&#xAC00;',icon:'&#x1F4D3;',desc:'&#xC77C;&#xC9C0; 5&#xAC1C; &#xC791;&#xC131;'},
  {id:'st_level_15',name:'&#xC131;&#xC7A5;&#xC758; &#xAE38;',icon:'&#x1F4CA;',desc:'Lv.15 &#xB3C4;&#xB2EC;'},
  {id:'st_all_games',name:'&#xC62C;&#xB77C;&#xC6B4;&#xB354;',icon:'&#x1F3AF;',desc:'4&#xC885; &#xAC8C;&#xC784; &#xBAA8;&#xB450; &#xD50C;&#xB808;&#xC774;'},
  {id:'st_time_2h',name:'&#xD5CC;&#xC2E0;&#xC801; &#xD50C;&#xB808;&#xC774;&#xC5B4;',icon:'&#x23F0;',desc:'&#xCD1D; 2&#xC2DC;&#xAC04; &#xD50C;&#xB808;&#xC774;'},
  {id:'st_collector',name:'&#xCF9C;&#xD50C;&#xB9AC;&#xD2B8;!',icon:'&#x1F31F;',desc:'&#xC2A4;&#xD0EC;&#xD504; 20&#xAC1C; &#xBAA8;&#xB450; &#xC218;&#xC9D1;'}
];

function getStampData(){
  try{ return JSON.parse(localStorage.getItem('hatcuping_stamps') || '[]'); }catch(e){ return []; }
}
function saveStampData(data){
  try{ localStorage.setItem('hatcuping_stamps', JSON.stringify(data)); }catch(e){}
}

function awardStamp(id){
  var d = getStampData();
  if(d.indexOf(id) === -1){
    d.push(id);
    saveStampData(d);
    sfxV13('stamp_collect');
    var stamp = STAMPS.filter(function(s){ return s.id === id; })[0];
    if(stamp) showToastV13('&#x1F3AB; &#xC2A4;&#xD0EC;&#xD504; &#xD68D;&#xB4DD;: ' + stamp.name + '!');
  }
}

function openStampBook(){
  if(document.getElementById('stampModal')) return;
  trackV13Feature('stamps');
  sfxV13('stamp_open');

  var overlay = document.createElement('div');
  overlay.id = 'stampModal';
  overlay.className = 'modal-overlay show';
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');

  var collected = getStampData();
  var html = '<div class="modal" style="max-width:420px">';
  html += '<button class="modal-close" id="stampClose" aria-label="&#xB2EB;&#xAE30;">&times;</button>';
  html += '<h3 style="font-size:17px">&#x1F3AB; &#xC2A4;&#xD0EC;&#xD504; &#xC218;&#xC9D1;&#xCCA9; (' + collected.length + '/' + STAMPS.length + ')</h3>';
  html += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:12px">';

  STAMPS.forEach(function(s){
    var has = collected.indexOf(s.id) !== -1;
    html += '<div style="text-align:center;padding:10px 4px;border-radius:14px;background:' + (has ? 'rgba(255,215,0,.08)' : 'rgba(0,0,0,.04)') + ';border:2px solid ' + (has ? 'rgba(255,215,0,.2)' : 'transparent') + '">';
    html += '<div style="font-size:24px;margin-bottom:4px">' + (has ? s.icon : '&#x2753;') + '</div>';
    html += '<div style="font-size:9px;color:' + (has ? 'var(--pink)' : 'var(--text-sub)') + ';font-weight:700">' + (has ? s.name : '???') + '</div>';
    html += '</div>';
  });

  html += '</div>';
  var pct = Math.round(collected.length / STAMPS.length * 100);
  html += '<div style="text-align:center;padding:10px;background:rgba(255,95,162,.04);border-radius:12px"><div style="font-size:11px;color:var(--text-sub)">&#xC218;&#xC9D1;&#xB960;</div>';
  html += '<div style="height:8px;background:rgba(0,0,0,.06);border-radius:4px;margin:6px 0;overflow:hidden"><div style="height:100%;width:' + pct + '%;background:linear-gradient(90deg,#FFD700,#FFA000);border-radius:4px"></div></div>';
  html += '<div style="font-size:14px;font-weight:800;color:var(--pink)">' + pct + '%</div></div>';
  html += '</div>';
  overlay.innerHTML = html;
  document.body.appendChild(overlay);

  document.getElementById('stampClose').onclick = function(){ overlay.remove(); };
  overlay.onclick = function(e){ if(e.target === overlay) overlay.remove(); };
}


// ============================================================
// 8. RANKING/LEADERBOARD (랭킹 리더보드)
// ============================================================
var AI_PLAYERS = [
  {name:'&#xD558;&#xCE04;&#xD551;&#xB9C8;&#xC2A4;&#xD130;',score:9800},{name:'&#xB85C;&#xBBF8;&#xD788;&#xC5B4;&#xB85C;',score:8500},
  {name:'&#xBC14;&#xB85C;&#xD551;&#xB77C;&#xC774;&#xB354;',score:7200},{name:'&#xCC28;&#xCC28;&#xD551;&#xD30C;&#xC774;&#xD130;',score:6800},
  {name:'&#xB77C;&#xB77C;&#xD551;&#xC2F1;&#xC5B4;',score:5500},{name:'&#xAF49;&#xAF49;&#xD551;&#xB2CC;&#xC790;',score:4200},
  {name:'&#xD558;&#xB098;&#xD551;&#xAC00;&#xB4DC;&#xB108;',score:3800},{name:'&#xBB34;&#xB8E8;&#xD551;&#xB808;&#xC778;&#xBCF4;',score:3000},
  {name:'&#xD2F0;&#xB2C8;&#xD551;&#xB8E8;&#xD0A4;',score:2200},{name:'&#xC774;&#xBAA8;&#xC158;&#xC6CC;&#xCEE4;',score:1500}
];

function getPlayerScore(){
  var score = 0;
  try{
    var achievements = JSON.parse(localStorage.getItem('hatcuping_achievements') || '{}');
    score += Object.keys(achievements).length * 100;
    var stats = JSON.parse(localStorage.getItem('hatcuping_stats') || '{}');
    score += (stats.clears || 0) * 50;
    score += (stats.combos || 0) * 10;
    var stamps = getStampData();
    score += stamps.length * 150;
    var skills = getSkillData();
    score += skills.length * 200;
  }catch(e){}
  return score;
}

function openRanking(){
  if(document.getElementById('rankingModal')) return;
  trackV13Feature('ranking');
  sfxV13('ranking_open');

  var overlay = document.createElement('div');
  overlay.id = 'rankingModal';
  overlay.className = 'modal-overlay show';
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');

  var myScore = getPlayerScore();
  var allPlayers = AI_PLAYERS.map(function(p){ return {name:p.name,score:p.score,isAI:true}; });
  allPlayers.push({name:'&#x1F3AE; &#xB098;',score:myScore,isAI:false});
  allPlayers.sort(function(a,b){ return b.score - a.score; });

  var html = '<div class="modal" style="max-width:400px">';
  html += '<button class="modal-close" id="rankingClose" aria-label="&#xB2EB;&#xAE30;">&times;</button>';
  html += '<h3 style="font-size:17px">&#x1F3C5; &#xB7AD;&#xD0B9; &#xB9AC;&#xB354;&#xBCF4;&#xB4DC;</h3>';

  var medals = ['&#x1F947;','&#x1F948;','&#x1F949;'];
  allPlayers.forEach(function(p, i){
    var isMe = !p.isAI;
    html += '<div style="display:flex;align-items:center;gap:10px;padding:10px;margin-bottom:4px;border-radius:12px;background:' + (isMe ? 'rgba(255,95,162,.08)' : 'rgba(0,0,0,.02)') + ';border:' + (isMe ? '2px solid var(--pink)' : '1px solid transparent') + '">';
    html += '<div style="width:28px;text-align:center;font-size:' + (i < 3 ? '18' : '13') + 'px;font-weight:800;color:' + (i < 3 ? '#FFD700' : 'var(--text-sub)') + '">' + (i < 3 ? medals[i] : (i + 1)) + '</div>';
    html += '<div style="flex:1;font-size:13px;font-weight:' + (isMe ? '800' : '600') + ';color:' + (isMe ? 'var(--pink)' : 'var(--text)') + '">' + p.name + '</div>';
    html += '<div style="font-size:14px;font-weight:800;color:' + (isMe ? 'var(--pink)' : '#FFD700') + '">' + p.score.toLocaleString() + '</div>';
    html += '</div>';
  });

  html += '<div style="text-align:center;margin-top:10px;font-size:11px;color:var(--text-sub)">&#xC5C5;&#xC801;+&#xD074;&#xB9AC;&#xC5B4;+&#xCF64;&#xBCF4;+&#xC2A4;&#xD0EC;&#xD504;+&#xC2A4;&#xD0AC; &#xAE30;&#xBC18; &#xC810;&#xC218;</div>';
  html += '</div>';
  overlay.innerHTML = html;
  document.body.appendChild(overlay);

  document.getElementById('rankingClose').onclick = function(){ overlay.remove(); };
  overlay.onclick = function(e){ if(e.target === overlay) overlay.remove(); };
}


// ============================================================
// 9. QUIZ +15 (60 -> 75)
// ============================================================
var V13_QUIZ = [
  {q:'&#xCE5C;&#xBC00;&#xB3C4; &#xC2DC;&#xC2A4;&#xD15C;&#xC758; &#xCE90;&#xB9AD;&#xD130; &#xC218;&#xB294;?',a:['4&#xBA85;','6&#xBA85;','8&#xBA85;','10&#xBA85;'],c:2},
  {q:'&#xCD9C;&#xC11D; &#xBCF4;&#xC0C1; &#xC8FC;&#xAE30;&#xB294;?',a:['5&#xC77C;','7&#xC77C;','10&#xC77C;','14&#xC77C;'],c:1},
  {q:'&#xCE74;&#xB4DC; &#xD569;&#xC131;&#xC758; &#xC131;&#xACF5; &#xD655;&#xB960;&#xC740;?',a:['50%','60%','70%','80%'],c:2},
  {q:'&#xC2A4;&#xD0AC; &#xD2B8;&#xB9AC;&#xC758; &#xCD5C;&#xC885; &#xC2A4;&#xD0AC;&#xC740;?',a:['&#xBD80;&#xD65C;','&#xCF64;&#xBCF4; &#xB9C8;&#xC2A4;&#xD130;','&#xC774;&#xBAA8;&#xC158; &#xD3ED;&#xBC1C;','&#xC790;&#xC11D;'],c:2},
  {q:'&#xC2DC;&#xC98C; &#xB358;&#xC804;&#xC740; &#xCD1D; &#xBA87; &#xAC1C;?',a:['2&#xAC1C;','3&#xAC1C;','4&#xAC1C;','5&#xAC1C;'],c:2},
  {q:'&#xC2A4;&#xD0EC;&#xD504; &#xCEEC;&#xB809;&#xC158;&#xC758; &#xCD1D; &#xC2A4;&#xD0EC;&#xD504; &#xC218;&#xB294;?',a:['10&#xAC1C;','15&#xAC1C;','20&#xAC1C;','25&#xAC1C;'],c:2},
  {q:'&#xACA8;&#xC6B8; &#xB358;&#xC804; &#xBCF4;&#xC2A4;&#xC758; &#xC774;&#xB984;&#xC740;?',a:['&#xB208;&#xAF43; &#xC694;&#xC815;','&#xC5BC;&#xC74C; &#xAC70;&#xC778;','&#xB208;&#xBCF4;&#xB77C; &#xAD34;&#xBB3C;','&#xB3D9;&#xAE30; &#xB9C8;&#xC655;'],c:1},
  {q:'&#xCE5C;&#xBC00;&#xB3C4; &#xCD5C;&#xACE0; &#xB808;&#xBCA8;&#xC740;?',a:['5','8','10','15'],c:2},
  {q:'&#xC120;&#xBB3C; &#xC804;&#xB2EC; &#xC7AC;&#xC0AC;&#xC6A9; &#xB300;&#xAE30;&#xC2DC;&#xAC04;&#xC740;?',a:['30&#xBD84;','1&#xC2DC;&#xAC04;','2&#xC2DC;&#xAC04;','&#xC81C;&#xD55C;&#xC5C6;&#xC74C;'],c:1},
  {q:'&#xC2A4;&#xD0AC; &#xD2B8;&#xB9AC; Tier 4 &#xC2A4;&#xD0AC; &#xBE44;&#xC6A9;&#xC740;?',a:['50','75','100','150'],c:2},
  {q:'SSR &#xCE74;&#xB4DC; &#xD569;&#xC131;&#xC5D0; &#xD544;&#xC694;&#xD55C; &#xB4F1;&#xAE09;&#xC740;?',a:['N+N','R+R','SR+SR','N+R'],c:2},
  {q:'Day 7 &#xCD9C;&#xC11D; &#xBCF4;&#xC0C1;&#xC740;?',a:['XP +50','&#xD558;&#xD2B8; x10','SSR &#xCE74;&#xB4DC; &#xBCF4;&#xC7A5;','&#xC2A4;&#xD0EC;&#xD504; 5&#xAC1C;'],c:2},
  {q:'&#xBD04; &#xB358;&#xC804; &#xBCF4;&#xC2A4;&#xC758; HP&#xB294;?',a:['100','120','150','180'],c:1},
  {q:'v13&#xC5D0;&#xC11C; &#xCD94;&#xAC00;&#xB41C; &#xC5C5;&#xC801; &#xC218;&#xB294;?',a:['8&#xAC1C;','10&#xAC1C;','12&#xAC1C;','15&#xAC1C;'],c:2},
  {q:'&#xB9AC;&#xB354;&#xBCF4;&#xB4DC; AI &#xD50C;&#xB808;&#xC774;&#xC5B4; &#xC218;&#xB294;?',a:['5&#xBA85;','8&#xBA85;','10&#xBA85;','12&#xBA85;'],c:2}
];

function injectExtraQuizV13(){
  if(window._v13QuizInjected) return;
  window._v13QuizInjected = true;
  if(window.QUIZ_DATA){
    V13_QUIZ.forEach(function(q){ window.QUIZ_DATA.push(q); });
  }
}


// ============================================================
// 10. ACHIEVEMENTS +12 (82 -> 94)
// ============================================================
var V13_ACHIEVEMENTS = [
  {id:'a_friend_first',name:'&#xCCAB; &#xC6B0;&#xC815;',desc:'&#xCE90;&#xB9AD;&#xD130;&#xC5D0;&#xAC8C; &#xCCAB; &#xC120;&#xBB3C;!',cat:'general',icon:'&#x1F91D;'},
  {id:'a_friend_3lv5',name:'&#xC6B0;&#xC815; &#xB9C8;&#xC2A4;&#xD130;',desc:'3&#xBA85; &#xCE5C;&#xBC00;&#xB3C4; Lv.5+',cat:'general',icon:'&#x1F496;'},
  {id:'a_login_7',name:'7&#xC77C; &#xCD9C;&#xC11D;',desc:'7&#xC77C; &#xC5F0;&#xC18D; &#xCD9C;&#xC11D;!',cat:'general',icon:'&#x1F4C5;'},
  {id:'a_login_30',name:'30&#xC77C; &#xCD9C;&#xC11D;',desc:'&#xCD1D; 30&#xD68C; &#xCD9C;&#xC11D;!',cat:'general',icon:'&#x1F4C6;'},
  {id:'a_fusion_first',name:'&#xCCAB; &#xD569;&#xC131;',desc:'&#xCE74;&#xB4DC; &#xD569;&#xC131; &#xCCAB; &#xC131;&#xACF5;!',cat:'general',icon:'&#x2728;'},
  {id:'a_fusion_all',name:'&#xD569;&#xC131; &#xB9C8;&#xC2A4;&#xD130;',desc:'6&#xAC1C; &#xD569;&#xC131; &#xBAA8;&#xB450; &#xC644;&#xC131;!',cat:'general',icon:'&#x1F48E;'},
  {id:'a_skill_3',name:'&#xC2A4;&#xD0AC; &#xC218;&#xB828;&#xC0DD;',desc:'3&#xAC1C; &#xC2A4;&#xD0AC; &#xD574;&#xAE08;',cat:'general',icon:'&#x1F332;'},
  {id:'a_skill_all',name:'&#xC2A4;&#xD0AC; &#xB9C8;&#xC2A4;&#xD130;',desc:'&#xBAA8;&#xB4E0; &#xC2A4;&#xD0AC; &#xD574;&#xAE08;!',cat:'general',icon:'&#x1F31F;'},
  {id:'a_dungeon_1',name:'&#xB358;&#xC804; &#xD0D0;&#xD5D8;&#xAC00;',desc:'&#xB358;&#xC804; 1&#xAC1C; &#xD074;&#xB9AC;&#xC5B4;',cat:'general',icon:'&#x1F3F0;'},
  {id:'a_dungeon_all',name:'&#xB358;&#xC804; &#xC815;&#xBCF5;&#xC790;',desc:'4&#xAC1C; &#xB358;&#xC804; &#xBAA8;&#xB450; &#xD074;&#xB9AC;&#xC5B4;!',cat:'general',icon:'&#x1F451;'},
  {id:'a_stamp_10',name:'&#xC2A4;&#xD0EC;&#xD504; &#xC218;&#xC9D1;&#xAC00;',desc:'10&#xAC1C; &#xC2A4;&#xD0EC;&#xD504; &#xC218;&#xC9D1;',cat:'general',icon:'&#x1F3AB;'},
  {id:'a_v13_explorer',name:'v13 &#xD0D0;&#xD5D8;&#xAC00;',desc:'v13 &#xC2E0;&#xADDC; &#xAE30;&#xB2A5; 5&#xAC1C; &#xCCB4;&#xD5D8;!',cat:'general',icon:'&#x1F680;'}
];

function injectV13Achievements(){
  if(window._v13AchievementsInjected) return;
  window._v13AchievementsInjected = true;
  if(window.AD){
    V13_ACHIEVEMENTS.forEach(function(a){
      var exists = window.AD.some(function(e){ return e.id === a.id; });
      if(!exists) window.AD.push(a);
    });
  }
}

function checkAndAwardV13(){
  if(!window.saveAchievement || !window.showAchieveToast) return;

  var fData = getFriendData();
  var hasGift = Object.keys(fData).some(function(k){ return (fData[k].points || 0) > 0; });
  if(hasGift && window.saveAchievement('a_friend_first')){ window.showAchieveToast('첫 우정'); }

  var lv5Count = 0;
  Object.keys(fData).forEach(function(k){ if(getFriendLevel(fData[k].points || 0) >= 5) lv5Count++; });
  if(lv5Count >= 3 && window.saveAchievement('a_friend_3lv5')){ window.showAchieveToast('우정 마스터'); }

  var lData = getLoginData();
  if((lData.streak || 0) >= 7 && window.saveAchievement('a_login_7')){ window.showAchieveToast('7일 출석'); }
  if((lData.totalClaims || 0) >= 30 && window.saveAchievement('a_login_30')){ window.showAchieveToast('30일 출석'); }

  var fusions = getFusionData();
  if(fusions.length >= 1 && window.saveAchievement('a_fusion_first')){ window.showAchieveToast('첫 합성'); }
  if(fusions.length >= 6 && window.saveAchievement('a_fusion_all')){ window.showAchieveToast('합성 마스터'); }

  var skills = getSkillData();
  if(skills.length >= 3 && window.saveAchievement('a_skill_3')){ window.showAchieveToast('스킬 수련생'); }
  if(skills.length >= 10 && window.saveAchievement('a_skill_all')){ window.showAchieveToast('스킬 마스터'); }

  var dungeons = getDungeonData();
  var clearedDungeons = Object.keys(dungeons).filter(function(k){ return dungeons[k] && dungeons[k].cleared; });
  if(clearedDungeons.length >= 1 && window.saveAchievement('a_dungeon_1')){ window.showAchieveToast('던전 탐험가'); }
  if(clearedDungeons.length >= 4 && window.saveAchievement('a_dungeon_all')){ window.showAchieveToast('던전 정복자'); }

  var stamps = getStampData();
  if(stamps.length >= 10 && window.saveAchievement('a_stamp_10')){ window.showAchieveToast('스탬프 수집가'); }

  try{
    var v13feats = JSON.parse(localStorage.getItem('hatcuping_v13_features') || '[]');
    if(v13feats.length >= 5 && window.saveAchievement('a_v13_explorer')){ window.showAchieveToast('v13 탐험가'); }
  }catch(e){}

  checkStamps();
}

function checkStamps(){
  try{
    var achievements = JSON.parse(localStorage.getItem('hatcuping_achievements') || '{}');
    if(Object.keys(achievements).length >= 10) awardStamp('st_achieve_10');
    if(Object.keys(achievements).length > 0) awardStamp('st_first_play');

    var stats = JSON.parse(localStorage.getItem('hatcuping_stats') || '{}');
    if((stats.playTime || 0) >= 7200) awardStamp('st_time_2h');
    if((stats.clears || 0) > 0) awardStamp('st_boss_clear');

    var rg = JSON.parse(localStorage.getItem('hatcuping_recent_games') || '[]');
    if(rg.length >= 4) awardStamp('st_all_games');

    if(document.body.classList.contains('dark')) awardStamp('st_dark_mode');

    var fData = getFriendData();
    var lv3Count = 0;
    Object.keys(fData).forEach(function(k){ if(getFriendLevel(fData[k].points || 0) >= 3) lv3Count++; });
    if(lv3Count >= 3) awardStamp('st_friend_3');

    var lData = getLoginData();
    if((lData.streak || 0) >= 7) awardStamp('st_login_7');

    var fusions = getFusionData();
    if(fusions.length >= 1) awardStamp('st_fusion_1');

    var skills = getSkillData();
    if(skills.length >= 3) awardStamp('st_skill_3');

    var dungeons = getDungeonData();
    var dc = Object.keys(dungeons).filter(function(k){ return dungeons[k] && dungeons[k].cleared; });
    if(dc.length >= 1) awardStamp('st_dungeon_1');
    if(dc.length >= 4) awardStamp('st_dungeon_all');

    var v13f = JSON.parse(localStorage.getItem('hatcuping_v13_features') || '[]');
    if(v13f.indexOf('jukebox') !== -1 || v13f.indexOf('sharecard') !== -1) awardStamp('st_jukebox');

    var guides = [];
    try{ guides = JSON.parse(localStorage.getItem('hatcuping_guides_read') || '[]'); }catch(e){}
    if(guides.length >= 12) awardStamp('st_guide_all');

    var journal = [];
    try{ journal = JSON.parse(localStorage.getItem('hatcuping_journal') || '[]'); }catch(e){}
    if(journal.length >= 5) awardStamp('st_journal_5');

    var cards = [];
    try{ cards = JSON.parse(localStorage.getItem('hatcuping_card_collection') || '[]'); }catch(e){}
    if(cards.length >= 5) awardStamp('st_card_5');

    var stampData = getStampData();
    if(stampData.length >= 19) awardStamp('st_collector');
  }catch(e){}
}


// ============================================================
// INJECTION: QUICK ACTIONS (8 buttons), KEYBOARD (8 shortcuts)
// ============================================================
function injectV13QuickActions(){
  var topBar = document.querySelector('.top-bar');
  if(!topBar) return;

  var btns = [
    {id:'friendBtn',label:'&#xC6B0;&#xC815;',icon:'&#x1F91D;',title:'&#xC6B0;&#xC815; &#xC2DC;&#xC2A4;&#xD15C; (Shift+F)',action:openFriendship},
    {id:'loginRewardBtn',label:'&#xCD9C;&#xC11D;',icon:'&#x1F4C5;',title:'&#xCD9C;&#xC11D; &#xBCF4;&#xC0C1; (Shift+R)',action:openLoginRewards},
    {id:'fusionBtn',label:'&#xD569;&#xC131;',icon:'&#x2728;',title:'&#xCE74;&#xB4DC; &#xD569;&#xC131;&#xC18C; (Shift+X)',action:openFusionWorkshop},
    {id:'skillTreeBtn',label:'&#xC2A4;&#xD0AC;',icon:'&#x1F332;',title:'&#xC2A4;&#xD0AC; &#xD2B8;&#xB9AC; (Shift+T)',action:openSkillTree},
    {id:'dungeonBtn',label:'&#xB358;&#xC804;',icon:'&#x1F3F0;',title:'&#xC2DC;&#xC98C; &#xB358;&#xC804; (Shift+D)',action:openSeasonDungeon},
    {id:'galleryBtn',label:'&#xC804;&#xB2F9;',icon:'&#x1F3C6;',title:'&#xC601;&#xC6C5;&#xC758; &#xC804;&#xB2F9; (Shift+H)',action:openAchievementGallery},
    {id:'stampBtn',label:'&#xC2A4;&#xD0EC;&#xD504;',icon:'&#x1F3AB;',title:'&#xC2A4;&#xD0EC;&#xD504; &#xC218;&#xC9D1; (Shift+N)',action:openStampBook},
    {id:'rankingBtn',label:'&#xB7AD;&#xD0B9;',icon:'&#x1F3C5;',title:'&#xB9AC;&#xB354;&#xBCF4;&#xB4DC; (Shift+K)',action:openRanking}
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

function injectV13Keyboard(){
  document.addEventListener('keydown', function(e){
    if(e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if(document.querySelector('.modal-overlay.show')) return;

    var key = e.key.toLowerCase();
    if(key === 'f' && e.shiftKey){ e.preventDefault(); openFriendship(); }
    else if(key === 'r' && e.shiftKey){ e.preventDefault(); openLoginRewards(); }
    else if(key === 'x' && e.shiftKey){ e.preventDefault(); openFusionWorkshop(); }
    else if(key === 't' && e.shiftKey){ e.preventDefault(); openSkillTree(); }
    else if(key === 'd' && e.shiftKey){ e.preventDefault(); openSeasonDungeon(); }
    else if(key === 'h' && e.shiftKey){ e.preventDefault(); openAchievementGallery(); }
    else if(key === 'n' && e.shiftKey){ e.preventDefault(); openStampBook(); }
    else if(key === 'k' && e.shiftKey){ e.preventDefault(); openRanking(); }
  });
}

function updateV13KeyboardHelp(){
  var kbHelp = document.querySelector('#kbHelp .modal');
  if(!kbHelp) return;
  var newRows = [
    ['&#xC6B0;&#xC815; &#xC2DC;&#xC2A4;&#xD15C;','Shift+F'],['&#xCD9C;&#xC11D; &#xBCF4;&#xC0C1;','Shift+R'],
    ['&#xCE74;&#xB4DC; &#xD569;&#xC131;','Shift+X'],['&#xC2A4;&#xD0AC; &#xD2B8;&#xB9AC;','Shift+T'],
    ['&#xC2DC;&#xC98C; &#xB358;&#xC804;','Shift+D'],['&#xC601;&#xC6C5;&#xC758; &#xC804;&#xB2F9;','Shift+H'],
    ['&#xC2A4;&#xD0EC;&#xD504; &#xC218;&#xC9D1;','Shift+N'],['&#xB9AC;&#xB354;&#xBCF4;&#xB4DC;','Shift+K']
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
function updateV13Footer(){
  var ver = document.querySelector('.footer .version');
  if(ver) ver.textContent = 'v13.0 | © PRIME Holdings NEXTERA+PRISM';

  var links = document.querySelector('.footer-links');
  if(links) links.innerHTML = '<span class="footer-link">4종 게임</span><span class="footer-link">94개 업적</span><span class="footer-link">24종 카드</span><span class="footer-link">우정 8캐릭터</span><span class="footer-link">스탬프 20종</span><span class="footer-link">던전 4개</span>';
}

function updateV13News(){
  var newsSection = document.querySelector('.news-section');
  if(!newsSection) return;
  var firstItem = newsSection.querySelector('.news-item');
  if(!firstItem) return;
  var newItem = document.createElement('div');
  newItem.className = 'news-item';
  newItem.innerHTML = '<span class="news-date">v13.0</span><span class="news-text">우정시스템 8캐릭터, 출석보상 7일, 카드합성 6종, 스킬트리 Canvas 10스킬, 시즌던전 4종, 영웅의전당 Canvas, 스탬프 20종, 리더보드, 퀀즈+15(75), 업적+12(94)</span>';
  firstItem.parentNode.insertBefore(newItem, firstItem);
}

function updateV13AchieveCount(){
  var el = document.getElementById('achieveCount');
  if(el){
    var c = 0;
    try{ c = Object.keys(JSON.parse(localStorage.getItem('hatcuping_achievements') || '{}')).length; }catch(e){}
    var t = window.AD ? window.AD.length : 94;
    el.textContent = c + '/' + t;
  }
}

function updateV13Meta(){
  var descMeta = document.querySelector('meta[name="description"]');
  if(descMeta) descMeta.content = '사랑의 하츄핑 v13.0 - 플랫포머 액션, 턴제 RPG, 오픈월드, UNIFIED 4종 게임. 업적 94개, 우정시스템, 카드합성, 스킬트리, 시즌던전, 스탬프 20종, 리더보드, 퀀즈 75문!';
  document.title = '사랑의 하츄핑 v13.0 - 게임 선택';
}


// ============================================================
// AUTO LOGIN CHECK
// ============================================================
function autoLoginCheck(){
  var lData = getLoginData();
  var today = getTodayStr();
  if(lData.lastClaim !== today){
    setTimeout(function(){
      showToastV13('&#x1F4C5; &#xCD9C;&#xC11D; &#xBCF4;&#xC0C1;&#xC774; &#xAE30;&#xB2E4;&#xB9AC;&#xACE0; &#xC788;&#xC5B4;&#xC694;!');
    }, 3000);
  }
}


// ============================================================
// BOOT
// ============================================================
function bootV13(){
  injectV13Achievements();
  injectExtraQuizV13();
  injectV13QuickActions();
  injectV13Keyboard();
  updateV13KeyboardHelp();
  updateV13Footer();
  updateV13News();
  updateV13AchieveCount();
  updateV13Meta();
  checkAndAwardV13();
  autoLoginCheck();
}

if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', bootV13);
} else {
  bootV13();
}

})();

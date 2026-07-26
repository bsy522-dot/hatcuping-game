// hatcuping-game v24_patch.js - NEXTERA+PRISM AUTO v24.0
// Self-contained IIFE patch module
(function(){
'use strict';

var _v24Ctx = null;
function _v24InitAudio(){
  if(!_v24Ctx){
    try{ _v24Ctx = new (window.AudioContext || window.webkitAudioContext)(); }catch(e){}
  }
  if(_v24Ctx && _v24Ctx.state === 'suspended') _v24Ctx.resume();
}

var V24_SFX = {
  rank_scan:{f:660,d:.06,t:'triangle'},
  rank_update:{f:1320,d:.18,t:'sine'},
  skill_learn:{f:880,d:.1,t:'triangle'},
  skill_master:{f:1100,d:.2,t:'sine'},
  weather_shift:{f:550,d:.12,t:'sine'},
  weather_storm:{f:220,d:.25,t:'sawtooth'},
  synergy_link:{f:770,d:.08,t:'triangle'},
  synergy_max:{f:1400,d:.22,t:'sine'},
  forge_hit:{f:330,d:.04,t:'square'},
  forge_success:{f:1050,d:.18,t:'triangle'},
  dungeon_clear:{f:990,d:.15,t:'sine'},
  dungeon_record:{f:1500,d:.3,t:'triangle'},
  persona_scan:{f:600,d:.06,t:'sine'},
  persona_reveal:{f:900,d:.12,t:'triangle'},
  compendium_add:{f:500,d:.05,t:'sine'},
  compendium_complete:{f:1200,d:.25,t:'triangle'},
  v24_nav:{f:720,d:.05,t:'sine'},
  v24_quiz:{f:900,d:.08,t:'triangle'}
};

function sfxV24(type){
  _v24InitAudio();
  if(!_v24Ctx) return;
  var s = V24_SFX[type];
  if(!s) return;
  try{
    var muted = false;
    try{ muted = localStorage.getItem('hatcuping_mute') === '1'; }catch(e){}
    if(muted) return;
    var osc = _v24Ctx.createOscillator();
    var gain = _v24Ctx.createGain();
    osc.type = s.t || 'sine';
    osc.frequency.value = s.f;
    gain.gain.value = 0.08;
    osc.connect(gain);
    gain.connect(_v24Ctx.destination);
    osc.start();
    osc.stop(_v24Ctx.currentTime + (s.d || 0.06));
  }catch(e){}
}

function v24Load(key, fb){ try{ var d = JSON.parse(localStorage.getItem(key)); return d !== null ? d : fb; }catch(e){ return fb; } }
function v24Save(key, data){ try{ localStorage.setItem(key, JSON.stringify(data)); }catch(e){} }
function isDarkV24(){ return document.body.classList.contains('dark'); }
function showToastV24(msg){
  var t = document.getElementById('achieveToast');
  if(t){ t.innerHTML = msg; t.classList.add('show'); setTimeout(function(){ t.classList.remove('show'); }, 2500); }
}

function createV24Modal(title, contentHTML){
  var overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.6);z-index:9999;display:flex;justify-content:center;align-items:center;backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px)';
  var modal = document.createElement('div');
  var bg = isDarkV24() ? '#2a1a3e' : '#fff';
  var col = isDarkV24() ? '#eee' : '#333';
  modal.style.cssText = 'background:' + bg + ';color:' + col + ';border-radius:24px;padding:24px;max-width:680px;width:94%;max-height:85vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.25);position:relative';
  modal.innerHTML = '<button style="position:absolute;top:12px;right:16px;background:none;border:none;font-size:24px;cursor:pointer;color:' + col + '" onclick="this.closest(\'div[style]\').parentElement.remove()">&times;</button><h3 style="font-size:18px;margin-bottom:16px;color:#FF5FA2">' + title + '</h3>' + contentHTML;
  overlay.appendChild(modal);
  overlay.addEventListener('click', function(e){ if(e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
  return modal;
}


// ============================================================
// 1. ADVENTURER RANKING SYSTEM (Canvas 620x400)
// ============================================================
var RANK_CATEGORIES = [
  {name:'전투력',icon:'⚔️',max:1000},
  {name:'탐험도',icon:'🗺️',max:800},
  {name:'수집률',icon:'📦',max:600},
  {name:'퀴즈점수',icon:'📝',max:500},
  {name:'콤보기록',icon:'🔥',max:400},
  {name:'스피드런',icon:'⚡',max:300},
  {name:'보스킬수',icon:'💀',max:200},
  {name:'업적달성',icon:'🏆',max:250}
];

function renderAdventurerRanking(){
  var saved = v24Load('v24_ranking', {scores:RANK_CATEGORIES.map(function(){return Math.floor(Math.random()*80)+20}), totalXP:0, rank:'D', history:[]});
  var html = '<div style="text-align:center;margin-bottom:12px"><canvas id="v24RankCanvas" width="620" height="400" style="max-width:100%;border-radius:12px;background:' + (isDarkV24()?'#1a0a2e':'#FFF0F8') + '"></canvas></div>';
  html += '<div style="text-align:center;margin-bottom:8px"><button id="v24RankScan" style="padding:8px 22px;background:linear-gradient(135deg,#FF5FA2,#B066FF);color:#fff;border:none;border-radius:14px;font-size:13px;font-weight:700;cursor:pointer">🔍 랭킹 스캔</button> ';
  html += '<button id="v24RankReset" style="padding:8px 16px;background:rgba(0,0,0,.1);color:' + (isDarkV24()?'#ccc':'#666') + ';border:none;border-radius:14px;font-size:12px;font-weight:600;cursor:pointer">초기화</button></div>';
  html += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:8px" id="v24RankGrid"></div>';

  var m = createV24Modal('🏅 모험가 랭킹 시스템', html);

  function drawRank(){
    var c = document.getElementById('v24RankCanvas');
    if(!c) return;
    var ctx = c.getContext('2d');
    var W = c.width, H = c.height;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = isDarkV24() ? '#1a0a2e' : '#FFF0F8';
    ctx.fillRect(0,0,W,H);

    ctx.fillStyle = isDarkV24() ? '#FF8EC4' : '#FF5FA2';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('모험가 랭킹 시스템', W/2, 28);

    var total = 0;
    var maxTotal = 0;
    RANK_CATEGORIES.forEach(function(cat, i){ total += saved.scores[i]; maxTotal += cat.max; });
    var pct = Math.round(total / maxTotal * 100);
    var rank = pct >= 90 ? 'S' : pct >= 75 ? 'A' : pct >= 60 ? 'B' : pct >= 40 ? 'C' : 'D';
    saved.rank = rank;

    var rankColors = {S:'#FFD700',A:'#FF5FA2',B:'#8B5CF6',C:'#4ECDC4',D:'#999'};
    ctx.fillStyle = rankColors[rank];
    ctx.font = 'bold 48px sans-serif';
    ctx.fillText(rank, W/2, 80);
    ctx.font = '12px sans-serif';
    ctx.fillStyle = isDarkV24() ? '#aaa' : '#888';
    ctx.fillText('종합 ' + pct + '% (' + total + '/' + maxTotal + ')', W/2, 100);

    var barW = 55;
    var barMaxH = 220;
    var startX = 45;
    var baseY = 360;
    var gap = (W - startX * 2) / RANK_CATEGORIES.length;

    RANK_CATEGORIES.forEach(function(cat, i){
      var x = startX + i * gap + gap/2 - barW/2;
      var val = saved.scores[i];
      var h = (val / cat.max) * barMaxH;

      var grad = ctx.createLinearGradient(x, baseY - h, x, baseY);
      grad.addColorStop(0, '#FF5FA2');
      grad.addColorStop(1, '#B066FF');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(x, baseY - h, barW, h, [6,6,0,0]);
      ctx.fill();

      ctx.fillStyle = isDarkV24() ? '#eee' : '#333';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(val, x + barW/2, baseY - h - 6);

      ctx.fillStyle = isDarkV24() ? '#aaa' : '#888';
      ctx.font = '10px sans-serif';
      ctx.fillText(cat.icon, x + barW/2, baseY + 14);
      ctx.fillText(cat.name, x + barW/2, baseY + 28);
    });

    ctx.strokeStyle = isDarkV24() ? 'rgba(255,255,255,.1)' : 'rgba(0,0,0,.08)';
    ctx.beginPath();
    ctx.moveTo(startX, baseY);
    ctx.lineTo(W - startX, baseY);
    ctx.stroke();

    v24Save('v24_ranking', saved);
  }

  drawRank();

  setTimeout(function(){
    var scanBtn = document.getElementById('v24RankScan');
    var resetBtn = document.getElementById('v24RankReset');
    if(scanBtn) scanBtn.addEventListener('click', function(){
      sfxV24('rank_scan');
      saved.scores = RANK_CATEGORIES.map(function(cat){ return Math.min(cat.max, Math.floor(Math.random() * cat.max * 0.9) + Math.floor(cat.max * 0.1)); });
      saved.totalXP += 50;
      drawRank();
      sfxV24('rank_update');
    });
    if(resetBtn) resetBtn.addEventListener('click', function(){
      saved = {scores:RANK_CATEGORIES.map(function(){return 0}), totalXP:0, rank:'D', history:[]};
      drawRank();
    });
  }, 100);
}


// ============================================================
// 2. SKILL MASTERY TREE (Canvas 600x380)
// ============================================================
var SKILL_NODES = [
  {id:0,name:'기본 공격',x:280,y:30,tier:0,req:[],icon:'⚔️'},
  {id:1,name:'강타',x:140,y:100,tier:1,req:[0],icon:'💥'},
  {id:2,name:'연타',x:280,y:100,tier:1,req:[0],icon:'🔄'},
  {id:3,name:'방어 자세',x:420,y:100,tier:1,req:[0],icon:'🛡️'},
  {id:4,name:'회오리베기',x:80,y:180,tier:2,req:[1],icon:'🌀'},
  {id:5,name:'파워스매시',x:200,y:180,tier:2,req:[1,2],icon:'🔨'},
  {id:6,name:'속사 연타',x:340,y:180,tier:2,req:[2],icon:'⚡'},
  {id:7,name:'카운터',x:460,y:180,tier:2,req:[3],icon:'↩️'},
  {id:8,name:'궁극기: 하츄핑빔',x:180,y:270,tier:3,req:[4,5],icon:'✨'},
  {id:9,name:'궁극기: 폭풍연격',x:300,y:270,tier:3,req:[5,6],icon:'🌪️'},
  {id:10,name:'궁극기: 철벽방어',x:420,y:270,tier:3,req:[6,7],icon:'🏰'},
  {id:11,name:'최종오의: 사랑의힘',x:280,y:350,tier:4,req:[8,9,10],icon:'💖'}
];

function renderSkillTree(){
  var saved = v24Load('v24_skilltree', {unlocked:[0], points:10});
  var html = '<div style="text-align:center;margin-bottom:12px"><canvas id="v24SkillCanvas" width="600" height="380" style="max-width:100%;border-radius:12px;background:' + (isDarkV24()?'#1a0a2e':'#FFF0F8') + '"></canvas></div>';
  html += '<div style="text-align:center;font-size:13px;margin-bottom:8px">스킬 포인트: <strong id="v24SP" style="color:#FF5FA2">' + saved.points + '</strong> | 해금: <strong>' + saved.unlocked.length + '/' + SKILL_NODES.length + '</strong></div>';
  html += '<div style="text-align:center"><button id="v24AddSP" style="padding:6px 16px;background:linear-gradient(135deg,#4ECDC4,#44B8AA);color:#fff;border:none;border-radius:12px;font-size:12px;font-weight:700;cursor:pointer">+3 포인트 획득</button></div>';

  var m = createV24Modal('🌳 스킬 마스터리 트리', html);

  function drawSkillTree(){
    var c = document.getElementById('v24SkillCanvas');
    if(!c) return;
    var ctx = c.getContext('2d');
    var W = c.width, H = c.height;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = isDarkV24() ? '#1a0a2e' : '#FFF0F8';
    ctx.fillRect(0,0,W,H);

    SKILL_NODES.forEach(function(node){
      node.req.forEach(function(reqId){
        var parent = SKILL_NODES[reqId];
        var unlocked = saved.unlocked.indexOf(node.id) !== -1;
        var parentUnlocked = saved.unlocked.indexOf(reqId) !== -1;
        ctx.strokeStyle = unlocked && parentUnlocked ? '#FF5FA2' : (isDarkV24() ? 'rgba(255,255,255,.15)' : 'rgba(0,0,0,.1)');
        ctx.lineWidth = unlocked && parentUnlocked ? 3 : 1;
        ctx.beginPath();
        ctx.moveTo(parent.x + 10, parent.y + 10);
        ctx.lineTo(node.x + 10, node.y + 10);
        ctx.stroke();
      });
    });

    SKILL_NODES.forEach(function(node){
      var unlocked = saved.unlocked.indexOf(node.id) !== -1;
      var canUnlock = !unlocked && saved.points > 0 && node.req.every(function(r){ return saved.unlocked.indexOf(r) !== -1; });

      ctx.beginPath();
      ctx.arc(node.x + 10, node.y + 10, 22, 0, Math.PI * 2);
      if(unlocked){
        var grad = ctx.createRadialGradient(node.x+10,node.y+10,0,node.x+10,node.y+10,22);
        grad.addColorStop(0, '#FF8EC4');
        grad.addColorStop(1, '#FF5FA2');
        ctx.fillStyle = grad;
      } else if(canUnlock){
        ctx.fillStyle = isDarkV24() ? 'rgba(255,215,0,.3)' : 'rgba(255,215,0,.2)';
      } else {
        ctx.fillStyle = isDarkV24() ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.06)';
      }
      ctx.fill();

      if(canUnlock){
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.fillStyle = unlocked ? '#fff' : (isDarkV24() ? '#aaa' : '#999');
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(node.icon, node.x + 10, node.y + 16);
    });

    v24Save('v24_skilltree', saved);
  }

  drawSkillTree();

  var c = document.getElementById('v24SkillCanvas');
  if(c) c.addEventListener('click', function(e){
    var rect = c.getBoundingClientRect();
    var scaleX = c.width / rect.width;
    var scaleY = c.height / rect.height;
    var mx = (e.clientX - rect.left) * scaleX;
    var my = (e.clientY - rect.top) * scaleY;

    SKILL_NODES.forEach(function(node){
      var dx = mx - (node.x + 10);
      var dy = my - (node.y + 10);
      if(dx*dx + dy*dy < 22*22){
        var unlocked = saved.unlocked.indexOf(node.id) !== -1;
        var canUnlock = !unlocked && saved.points > 0 && node.req.every(function(r){ return saved.unlocked.indexOf(r) !== -1; });
        if(canUnlock){
          saved.unlocked.push(node.id);
          saved.points--;
          sfxV24('skill_learn');
          if(node.tier >= 3) sfxV24('skill_master');
          var spEl = document.getElementById('v24SP');
          if(spEl) spEl.textContent = saved.points;
          drawSkillTree();
        }
      }
    });
  });

  setTimeout(function(){
    var addBtn = document.getElementById('v24AddSP');
    if(addBtn) addBtn.addEventListener('click', function(){
      saved.points += 3;
      var spEl = document.getElementById('v24SP');
      if(spEl) spEl.textContent = saved.points;
      sfxV24('rank_update');
      v24Save('v24_skilltree', saved);
    });
  }, 100);
}


// ============================================================
// 3. WEATHER BATTLE SYSTEM (Canvas 620x400)
// ============================================================
var WEATHER_TYPES = [
  {name:'맑음',icon:'☀️',atk:1.0,def:1.0,spd:1.0,desc:'기본 전투 환경',color:'#FFD700'},
  {name:'비',icon:'🌧️',atk:0.8,def:1.2,spd:0.9,desc:'물 속성 +30%, 불 속성 -20%',color:'#4A90D9'},
  {name:'폭풍',icon:'⛈️',atk:1.3,def:0.7,spd:1.1,desc:'전기 속성 +50%, 명중률 -15%',color:'#6B3FA0'},
  {name:'눈',icon:'❄️',atk:0.9,def:1.1,spd:0.7,desc:'얼음 속성 +40%, 속도 감소',color:'#87CEEB'},
  {name:'안개',icon:'🌫️',atk:1.0,def:0.9,spd:0.8,desc:'명중률 -25%, 회피율 +20%',color:'#B0B0B0'},
  {name:'모래폭풍',icon:'🏜️',atk:1.1,def:0.8,spd:1.2,desc:'바위 속성 +35%, 시야 감소',color:'#D4A574'},
  {name:'오로라',icon:'🌌',atk:1.2,def:1.2,spd:1.0,desc:'마법 속성 +40%, 전 스탯 버프',color:'#9B59B6'},
  {name:'무지개',icon:'🌈',atk:1.1,def:1.1,spd:1.1,desc:'모든 속성 +15%, 행운 +30%',color:'#E91E63'}
];

function renderWeatherBattle(){
  var saved = v24Load('v24_weather', {current:0, battles:0, wins:0, weatherHistory:[]});
  var html = '<div style="text-align:center;margin-bottom:12px"><canvas id="v24WeatherCanvas" width="620" height="400" style="max-width:100%;border-radius:12px;background:' + (isDarkV24()?'#1a0a2e':'#FFF0F8') + '"></canvas></div>';
  html += '<div style="text-align:center;margin-bottom:8px"><button id="v24WeatherChange" style="padding:8px 22px;background:linear-gradient(135deg,#4ECDC4,#2ECC71);color:#fff;border:none;border-radius:14px;font-size:13px;font-weight:700;cursor:pointer">🌤️ 날씨 변경</button> ';
  html += '<button id="v24BattleSim" style="padding:8px 22px;background:linear-gradient(135deg,#FF5FA2,#B066FF);color:#fff;border:none;border-radius:14px;font-size:13px;font-weight:700;cursor:pointer">⚔️ 전투 시뮬</button></div>';
  html += '<div style="font-size:11px;text-align:center;color:' + (isDarkV24()?'#aaa':'#888') + '">전투: ' + saved.battles + '회 | 승리: ' + saved.wins + '회 | 승률: ' + (saved.battles > 0 ? Math.round(saved.wins/saved.battles*100) : 0) + '%</div>';

  var m = createV24Modal('🌦️ 날씨 전투 시스템', html);

  function drawWeather(){
    var c = document.getElementById('v24WeatherCanvas');
    if(!c) return;
    var ctx = c.getContext('2d');
    var W = c.width, H = c.height;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = isDarkV24() ? '#1a0a2e' : '#FFF0F8';
    ctx.fillRect(0,0,W,H);

    var w = WEATHER_TYPES[saved.current];

    ctx.fillStyle = isDarkV24() ? '#FF8EC4' : '#FF5FA2';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('날씨 전투 시스템', W/2, 28);

    ctx.font = '40px sans-serif';
    ctx.fillText(w.icon, W/2, 80);
    ctx.fillStyle = w.color;
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(w.name, W/2, 110);
    ctx.fillStyle = isDarkV24() ? '#aaa' : '#888';
    ctx.font = '12px sans-serif';
    ctx.fillText(w.desc, W/2, 130);

    var stats = [{label:'공격력',val:w.atk},{label:'방어력',val:w.def},{label:'속도',val:w.spd}];
    var barW = 140;
    var statStartX = W/2 - (stats.length * (barW + 20)) / 2 + 10;
    stats.forEach(function(stat, i){
      var x = statStartX + i * (barW + 20);
      var y = 160;
      ctx.fillStyle = isDarkV24() ? '#aaa' : '#666';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(stat.label, x, y);

      var trackY = y + 8;
      ctx.fillStyle = isDarkV24() ? 'rgba(255,255,255,.1)' : 'rgba(0,0,0,.06)';
      ctx.beginPath();
      ctx.roundRect(x, trackY, barW, 16, 8);
      ctx.fill();

      var fillW = Math.min(barW, (stat.val / 1.5) * barW);
      var barCol = stat.val > 1.0 ? '#4ECDC4' : stat.val < 1.0 ? '#FF6B6B' : '#FFD700';
      ctx.fillStyle = barCol;
      ctx.beginPath();
      ctx.roundRect(x, trackY, fillW, 16, 8);
      ctx.fill();

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('x' + stat.val.toFixed(1), x + fillW/2, trackY + 12);
    });

    var gridX = 30;
    var gridY = 210;
    var cellW = (W - 60) / WEATHER_TYPES.length;
    var cellH = 160;

    WEATHER_TYPES.forEach(function(wt, i){
      var x = gridX + i * cellW;
      var isActive = i === saved.current;

      if(isActive){
        ctx.fillStyle = isDarkV24() ? 'rgba(255,95,162,.15)' : 'rgba(255,95,162,.08)';
        ctx.beginPath();
        ctx.roundRect(x + 2, gridY, cellW - 4, cellH, 8);
        ctx.fill();
        ctx.strokeStyle = '#FF5FA2';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.fillStyle = isDarkV24() ? '#eee' : '#333';
      ctx.font = '20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(wt.icon, x + cellW/2, gridY + 28);

      ctx.fillStyle = isDarkV24() ? '#ccc' : '#555';
      ctx.font = '9px sans-serif';
      ctx.fillText(wt.name, x + cellW/2, gridY + 46);

      var barH = 80;
      var barY = gridY + 58;
      var bars = [{v:wt.atk,c:'#FF6B6B'},{v:wt.def,c:'#4ECDC4'},{v:wt.spd,c:'#FFD700'}];
      bars.forEach(function(b, bi){
        var bx = x + 8 + bi * ((cellW - 16) / 3);
        var bw = (cellW - 24) / 3;
        var bh = (b.v / 1.5) * barH;
        ctx.fillStyle = isDarkV24() ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.04)';
        ctx.fillRect(bx, barY, bw, barH);
        ctx.fillStyle = b.c;
        ctx.fillRect(bx, barY + barH - bh, bw, bh);
      });
    });

    ctx.textAlign = 'left';
    ctx.fillStyle = isDarkV24() ? '#888' : '#aaa';
    ctx.font = '9px sans-serif';
    ctx.fillText('🔴공격 🟢방어 🟡속도', gridX, H - 8);

    v24Save('v24_weather', saved);
  }

  drawWeather();

  setTimeout(function(){
    var changeBtn = document.getElementById('v24WeatherChange');
    var battleBtn = document.getElementById('v24BattleSim');
    if(changeBtn) changeBtn.addEventListener('click', function(){
      saved.current = (saved.current + 1) % WEATHER_TYPES.length;
      sfxV24('weather_shift');
      drawWeather();
    });
    if(battleBtn) battleBtn.addEventListener('click', function(){
      sfxV24('weather_storm');
      saved.battles++;
      var w = WEATHER_TYPES[saved.current];
      var power = w.atk * 0.4 + w.def * 0.3 + w.spd * 0.3;
      var win = Math.random() < (power * 0.45 + 0.1);
      if(win) saved.wins++;
      drawWeather();
      showToastV24(win ? '⚔️ 전투 승리! ' + w.name + ' 날씨 보너스 적용' : '💫 전투 패배... 날씨 전략을 바꿔보세요');
    });
  }, 100);
}


// ============================================================
// 4. CHARACTER SYNERGY MATRIX (Canvas 620x380)
// ============================================================
var SYNERGY_CHARS = [
  {name:'하츄핑',icon:'💖',type:'사랑'},
  {name:'바로핑',icon:'⚡',type:'용기'},
  {name:'아자핑',icon:'🔥',type:'활력'},
  {name:'차차핑',icon:'💃',type:'매력'},
  {name:'해필핑',icon:'😊',type:'행복'},
  {name:'로미',icon:'👧',type:'우정'}
];

var SYNERGY_TABLE = [
  [100,85,70,60,90,95],
  [85,100,90,55,65,80],
  [70,90,100,75,60,75],
  [60,55,75,100,80,70],
  [90,65,60,80,100,85],
  [95,80,75,70,85,100]
];

function renderSynergyMatrix(){
  var saved = v24Load('v24_synergy', {selected:[0,5], battles:0});
  var html = '<div style="text-align:center;margin-bottom:12px"><canvas id="v24SynergyCanvas" width="620" height="380" style="max-width:100%;border-radius:12px;background:' + (isDarkV24()?'#1a0a2e':'#FFF0F8') + '"></canvas></div>';
  html += '<div style="text-align:center;font-size:12px;color:' + (isDarkV24()?'#aaa':'#888') + '">히트맵 셀 클릭으로 캐릭터 조합을 선택하세요</div>';

  var m = createV24Modal('🤝 캐릭터 시너지 매트릭스', html);

  function drawSynergy(){
    var c = document.getElementById('v24SynergyCanvas');
    if(!c) return;
    var ctx = c.getContext('2d');
    var W = c.width, H = c.height;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = isDarkV24() ? '#1a0a2e' : '#FFF0F8';
    ctx.fillRect(0,0,W,H);

    ctx.fillStyle = isDarkV24() ? '#FF8EC4' : '#FF5FA2';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('캐릭터 시너지 매트릭스', W/2, 28);

    var gridSize = 6;
    var cellSize = 55;
    var startX = 120;
    var startY = 60;

    SYNERGY_CHARS.forEach(function(ch, i){
      ctx.fillStyle = isDarkV24() ? '#ccc' : '#555';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(ch.icon + ' ' + ch.name, startX - 8, startY + i * cellSize + cellSize/2 + 4);

      ctx.textAlign = 'center';
      ctx.fillText(ch.icon, startX + i * cellSize + cellSize/2, startY - 8);
    });

    for(var r = 0; r < gridSize; r++){
      for(var co = 0; co < gridSize; co++){
        var x = startX + co * cellSize;
        var y = startY + r * cellSize;
        var val = SYNERGY_TABLE[r][co];

        var intensity = val / 100;
        var red, green, blue;
        if(val >= 80){
          red = 255; green = Math.round(95 + (1-intensity) * 160); blue = Math.round(162 * intensity);
        } else if(val >= 60){
          red = Math.round(255 * intensity); green = Math.round(200 * intensity); blue = Math.round(100 + 100 * intensity);
        } else {
          red = Math.round(150 + 50 * intensity); green = Math.round(150 + 50 * intensity); blue = Math.round(180 + 75 * intensity);
        }
        ctx.fillStyle = 'rgb(' + red + ',' + green + ',' + blue + ')';
        ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);

        var isSelected = (saved.selected[0] === r && saved.selected[1] === co);
        if(isSelected){
          ctx.strokeStyle = '#FFD700';
          ctx.lineWidth = 3;
          ctx.strokeRect(x, y, cellSize, cellSize);
        }

        ctx.fillStyle = val >= 80 ? '#fff' : (isDarkV24() ? '#eee' : '#333');
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(val + '%', x + cellSize/2, y + cellSize/2 + 5);
      }
    }

    var sel = SYNERGY_TABLE[saved.selected[0]][saved.selected[1]];
    var c1 = SYNERGY_CHARS[saved.selected[0]];
    var c2 = SYNERGY_CHARS[saved.selected[1]];
    var infoX = startX + gridSize * cellSize + 20;
    var infoY = startY + 20;

    ctx.fillStyle = isDarkV24() ? '#FF8EC4' : '#FF5FA2';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('선택된 조합', infoX, infoY);

    ctx.fillStyle = isDarkV24() ? '#eee' : '#333';
    ctx.font = '28px sans-serif';
    ctx.fillText(c1.icon + ' + ' + c2.icon, infoX, infoY + 40);

    ctx.font = '13px sans-serif';
    ctx.fillText(c1.name + ' x ' + c2.name, infoX, infoY + 60);

    var grade = sel >= 90 ? 'S' : sel >= 80 ? 'A' : sel >= 70 ? 'B' : sel >= 60 ? 'C' : 'D';
    var gradeColors = {S:'#FFD700',A:'#FF5FA2',B:'#8B5CF6',C:'#4ECDC4',D:'#999'};
    ctx.fillStyle = gradeColors[grade];
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText(grade, infoX + 60, infoY + 110);

    ctx.fillStyle = isDarkV24() ? '#aaa' : '#888';
    ctx.font = '11px sans-serif';
    ctx.fillText('시너지: ' + sel + '%', infoX, infoY + 130);

    var synDesc = sel >= 90 ? '환상의 조합!' : sel >= 80 ? '좋은 궁합' : sel >= 70 ? '보통 시너지' : sel >= 60 ? '약한 시너지' : '부족한 궁합';
    ctx.fillText(synDesc, infoX, infoY + 150);

    v24Save('v24_synergy', saved);
  }

  drawSynergy();

  var canvas = document.getElementById('v24SynergyCanvas');
  if(canvas) canvas.addEventListener('click', function(e){
    var rect = canvas.getBoundingClientRect();
    var scaleX = canvas.width / rect.width;
    var scaleY = canvas.height / rect.height;
    var mx = (e.clientX - rect.left) * scaleX;
    var my = (e.clientY - rect.top) * scaleY;

    var startX = 120, startY = 60, cellSize = 55;
    var col = Math.floor((mx - startX) / cellSize);
    var row = Math.floor((my - startY) / cellSize);
    if(col >= 0 && col < 6 && row >= 0 && row < 6){
      saved.selected = [row, col];
      sfxV24('synergy_link');
      if(SYNERGY_TABLE[row][col] >= 90) sfxV24('synergy_max');
      drawSynergy();
    }
  });
}


// ============================================================
// 5. ITEM ENHANCEMENT FORGE (Canvas 600x380)
// ============================================================
var FORGE_ITEMS = [
  {name:'별빛검',icon:'⚔️',base:50,level:0,maxLv:10,stat:'공격력'},
  {name:'사랑방패',icon:'🛡️',base:40,level:0,maxLv:10,stat:'방어력'},
  {name:'바람부츠',icon:'👢',base:30,level:0,maxLv:10,stat:'속도'},
  {name:'지혜반지',icon:'💍',base:25,level:0,maxLv:10,stat:'마법력'},
  {name:'용기갑옷',icon:'🦺',base:45,level:0,maxLv:10,stat:'체력'},
  {name:'행운클로버',icon:'🍀',base:20,level:0,maxLv:10,stat:'행운'},
  {name:'치유오브',icon:'💚',base:35,level:0,maxLv:10,stat:'회복력'},
  {name:'번개완드',icon:'🪄',base:38,level:0,maxLv:10,stat:'크리티컬'}
];

function renderForge(){
  var saved = v24Load('v24_forge', {items:FORGE_ITEMS.map(function(it){return {level:0,exp:0}}), coins:500, totalForges:0});
  var html = '<div style="text-align:center;margin-bottom:12px"><canvas id="v24ForgeCanvas" width="600" height="380" style="max-width:100%;border-radius:12px;background:' + (isDarkV24()?'#1a0a2e':'#FFF0F8') + '"></canvas></div>';
  html += '<div style="text-align:center;margin-bottom:8px">코인: <strong id="v24Coins" style="color:#FFD700">💰 ' + saved.coins + '</strong> | 강화횟수: ' + saved.totalForges + '</div>';
  html += '<div style="text-align:center"><button id="v24ForgeAll" style="padding:8px 22px;background:linear-gradient(135deg,#FF5FA2,#B066FF);color:#fff;border:none;border-radius:14px;font-size:13px;font-weight:700;cursor:pointer">🔨 전체 강화 (+코인 100)</button></div>';

  var m = createV24Modal('🔨 아이템 강화 대장간', html);

  function drawForge(){
    var c = document.getElementById('v24ForgeCanvas');
    if(!c) return;
    var ctx = c.getContext('2d');
    var W = c.width, H = c.height;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = isDarkV24() ? '#1a0a2e' : '#FFF0F8';
    ctx.fillRect(0,0,W,H);

    ctx.fillStyle = isDarkV24() ? '#FF8EC4' : '#FF5FA2';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('아이템 강화 대장간', W/2, 28);

    var cols = 2;
    var rows = 4;
    var cardW = 260;
    var cardH = 72;
    var gapX = 20;
    var gapY = 10;
    var startX = (W - cols * cardW - (cols-1) * gapX) / 2;
    var startY = 48;

    FORGE_ITEMS.forEach(function(item, i){
      var col = i % cols;
      var row = Math.floor(i / cols);
      var x = startX + col * (cardW + gapX);
      var y = startY + row * (cardH + gapY);
      var lv = saved.items[i].level;
      var power = item.base + lv * Math.ceil(item.base * 0.15);

      ctx.fillStyle = isDarkV24() ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.03)';
      ctx.beginPath();
      ctx.roundRect(x, y, cardW, cardH, 12);
      ctx.fill();

      if(lv >= item.maxLv){
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.fillStyle = isDarkV24() ? '#eee' : '#333';
      ctx.font = '22px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(item.icon, x + 12, y + 36);

      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(item.name, x + 44, y + 22);

      ctx.fillStyle = isDarkV24() ? '#aaa' : '#888';
      ctx.font = '11px sans-serif';
      ctx.fillText(item.stat + ': ' + power, x + 44, y + 38);

      var lvColor = lv >= 10 ? '#FFD700' : lv >= 7 ? '#FF5FA2' : lv >= 4 ? '#8B5CF6' : '#4ECDC4';
      ctx.fillStyle = lvColor;
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('Lv.' + lv + '/' + item.maxLv, x + 44, y + 54);

      var barX = x + 110;
      var barY = y + 46;
      var barW = cardW - 130;
      var barH = 10;
      ctx.fillStyle = isDarkV24() ? 'rgba(255,255,255,.1)' : 'rgba(0,0,0,.06)';
      ctx.beginPath();
      ctx.roundRect(barX, barY, barW, barH, 5);
      ctx.fill();
      var fillW = (lv / item.maxLv) * barW;
      ctx.fillStyle = lvColor;
      ctx.beginPath();
      ctx.roundRect(barX, barY, fillW, barH, 5);
      ctx.fill();
    });

    v24Save('v24_forge', saved);
  }

  drawForge();

  var forgeCanvas = document.getElementById('v24ForgeCanvas');
  if(forgeCanvas) forgeCanvas.addEventListener('click', function(e){
    var rect = forgeCanvas.getBoundingClientRect();
    var scaleX = forgeCanvas.width / rect.width;
    var scaleY = forgeCanvas.height / rect.height;
    var mx = (e.clientX - rect.left) * scaleX;
    var my = (e.clientY - rect.top) * scaleY;

    var cols = 2, cardW = 260, cardH = 72, gapX = 20, gapY = 10;
    var W = forgeCanvas.width;
    var startX = (W - cols * cardW - (cols-1) * gapX) / 2;
    var startY = 48;

    FORGE_ITEMS.forEach(function(item, i){
      var col = i % cols;
      var row = Math.floor(i / cols);
      var x = startX + col * (cardW + gapX);
      var y = startY + row * (cardH + gapY);
      if(mx >= x && mx <= x + cardW && my >= y && my <= y + cardH){
        if(saved.items[i].level < item.maxLv && saved.coins >= 30){
          saved.items[i].level++;
          saved.coins -= 30;
          saved.totalForges++;
          sfxV24('forge_hit');
          if(saved.items[i].level >= item.maxLv) sfxV24('forge_success');
          var coinsEl = document.getElementById('v24Coins');
          if(coinsEl) coinsEl.textContent = '💰 ' + saved.coins;
          drawForge();
        } else if(saved.coins < 30){
          showToastV24('💰 코인이 부족합니다! (30 필요)');
        }
      }
    });
  });

  setTimeout(function(){
    var allBtn = document.getElementById('v24ForgeAll');
    if(allBtn) allBtn.addEventListener('click', function(){
      saved.coins += 100;
      sfxV24('forge_success');
      var coinsEl = document.getElementById('v24Coins');
      if(coinsEl) coinsEl.textContent = '💰 ' + saved.coins;
      drawForge();
    });
  }, 100);
}


// ============================================================
// 6. DUNGEON CLEAR TIMEBOARD (Canvas 620x400)
// ============================================================
var DUNGEON_FLOORS = [
  {name:'꽃의 숲',icon:'🌸',bestTime:0,attempts:0,difficulty:1},
  {name:'바람의 계곡',icon:'🌬️',bestTime:0,attempts:0,difficulty:2},
  {name:'얼음 동굴',icon:'🧊',bestTime:0,attempts:0,difficulty:3},
  {name:'불의 사원',icon:'🔥',bestTime:0,attempts:0,difficulty:4},
  {name:'어둠의 성',icon:'🏰',bestTime:0,attempts:0,difficulty:5},
  {name:'용의 둥지',icon:'🐉',bestTime:0,attempts:0,difficulty:6},
  {name:'천공의 탑',icon:'🗼',bestTime:0,attempts:0,difficulty:7},
  {name:'최종 심연',icon:'🌑',bestTime:0,attempts:0,difficulty:8},
  {name:'비밀 차원',icon:'🌀',bestTime:0,attempts:0,difficulty:9},
  {name:'사랑의 정원',icon:'💖',bestTime:0,attempts:0,difficulty:10}
];

function renderDungeonTimeboard(){
  var saved = v24Load('v24_dungeon', {floors:DUNGEON_FLOORS.map(function(f){return {best:0,attempts:0}}), totalClears:0});
  var html = '<div style="text-align:center;margin-bottom:12px"><canvas id="v24DungeonCanvas" width="620" height="400" style="max-width:100%;border-radius:12px;background:' + (isDarkV24()?'#1a0a2e':'#FFF0F8') + '"></canvas></div>';
  html += '<div style="text-align:center;margin-bottom:8px"><button id="v24RunDungeon" style="padding:8px 22px;background:linear-gradient(135deg,#FF5FA2,#B066FF);color:#fff;border:none;border-radius:14px;font-size:13px;font-weight:700;cursor:pointer">🏃 던전 도전!</button> ';
  html += '<button id="v24DungeonReset" style="padding:8px 16px;background:rgba(0,0,0,.1);color:' + (isDarkV24()?'#ccc':'#666') + ';border:none;border-radius:14px;font-size:12px;cursor:pointer">기록 초기화</button></div>';

  var m = createV24Modal('⏱️ 던전 클리어 타임보드', html);

  function drawDungeon(){
    var c = document.getElementById('v24DungeonCanvas');
    if(!c) return;
    var ctx = c.getContext('2d');
    var W = c.width, H = c.height;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = isDarkV24() ? '#1a0a2e' : '#FFF0F8';
    ctx.fillRect(0,0,W,H);

    ctx.fillStyle = isDarkV24() ? '#FF8EC4' : '#FF5FA2';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('던전 클리어 타임보드', W/2, 28);
    ctx.fillStyle = isDarkV24() ? '#aaa' : '#888';
    ctx.font = '12px sans-serif';
    ctx.fillText('총 클리어: ' + saved.totalClears + '회', W/2, 46);

    var barMaxW = 380;
    var barH = 28;
    var startX = 160;
    var startY = 65;
    var gap = 32;

    var maxTime = 1;
    saved.floors.forEach(function(f){ if(f.best > maxTime) maxTime = f.best; });

    DUNGEON_FLOORS.forEach(function(floor, i){
      var y = startY + i * gap;
      var f = saved.floors[i];

      ctx.fillStyle = isDarkV24() ? '#ccc' : '#555';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(floor.icon + ' ' + floor.name, startX - 12, y + 18);

      ctx.fillStyle = isDarkV24() ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.04)';
      ctx.beginPath();
      ctx.roundRect(startX, y, barMaxW, barH, 6);
      ctx.fill();

      if(f.best > 0){
        var w = (f.best / maxTime) * barMaxW * 0.9;
        var grad = ctx.createLinearGradient(startX, y, startX + w, y);
        var diffPct = floor.difficulty / 10;
        grad.addColorStop(0, 'hsl(' + (120 - diffPct * 120) + ',70%,55%)');
        grad.addColorStop(1, 'hsl(' + (120 - diffPct * 120) + ',80%,45%)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(startX, y, w, barH, 6);
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(f.best.toFixed(1) + 's', startX + 8, y + 18);

        ctx.textAlign = 'right';
        ctx.fillStyle = isDarkV24() ? '#aaa' : '#888';
        ctx.font = '9px sans-serif';
        ctx.fillText(f.attempts + '회', startX + barMaxW - 8, y + 18);
      } else {
        ctx.fillStyle = isDarkV24() ? '#666' : '#bbb';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('미도전', startX + 12, y + 18);
      }

      var stars = '';
      for(var s = 0; s < floor.difficulty; s++) stars += '★';
      ctx.fillStyle = '#FFD700';
      ctx.font = '7px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(stars, startX - 52 - (floor.name.length * 3), y + 18);
    });

    v24Save('v24_dungeon', saved);
  }

  drawDungeon();

  setTimeout(function(){
    var runBtn = document.getElementById('v24RunDungeon');
    var resetBtn = document.getElementById('v24DungeonReset');
    if(runBtn) runBtn.addEventListener('click', function(){
      var idx = Math.floor(Math.random() * DUNGEON_FLOORS.length);
      var floor = DUNGEON_FLOORS[idx];
      var time = (floor.difficulty * 3 + Math.random() * floor.difficulty * 5).toFixed(1);
      time = parseFloat(time);
      saved.floors[idx].attempts++;
      saved.totalClears++;
      if(saved.floors[idx].best === 0 || time < saved.floors[idx].best){
        saved.floors[idx].best = time;
        sfxV24('dungeon_record');
        showToastV24('🏆 ' + floor.name + ' 신기록! ' + time + '초');
      } else {
        sfxV24('dungeon_clear');
        showToastV24('✅ ' + floor.name + ' 클리어 ' + time + '초');
      }
      drawDungeon();
    });
    if(resetBtn) resetBtn.addEventListener('click', function(){
      saved = {floors:DUNGEON_FLOORS.map(function(){return {best:0,attempts:0}}), totalClears:0};
      drawDungeon();
    });
  }, 100);
}


// ============================================================
// 7. CHARACTER PERSONALITY ANALYZER (Canvas 600x380)
// ============================================================
var PERSONA_CHARS = [
  {name:'하츄핑',traits:[95,60,80,70,90,85],type:'ENFP',desc:'열정적이고 사랑이 넘치는 리더'},
  {name:'바로핑',traits:[60,95,70,85,50,75],type:'ISTJ',desc:'정의감 넘치는 올곧은 수호자'},
  {name:'아자핑',traits:[85,70,95,60,75,80],type:'ESTP',desc:'활기차고 에너지가 넘치는 모험가'},
  {name:'차차핑',traits:[70,55,65,95,85,60],type:'ESFP',desc:'매력적이고 사교적인 엔터테이너'},
  {name:'해필핑',traits:[90,65,60,80,95,90],type:'INFP',desc:'따뜻하고 공감 능력이 뛰어난 치유사'},
  {name:'로미',traits:[80,80,75,65,80,95],type:'ENFJ',desc:'모두를 이끄는 따뜻한 주인공'}
];
var PERSONA_AXES = ['사랑','용기','활력','매력','행복','우정'];

function renderPersonalityAnalyzer(){
  var saved = v24Load('v24_persona', {selected:0, compared:-1, tests:0});
  var html = '<div style="text-align:center;margin-bottom:12px"><canvas id="v24PersonaCanvas" width="600" height="380" style="max-width:100%;border-radius:12px;background:' + (isDarkV24()?'#1a0a2e':'#FFF0F8') + '"></canvas></div>';
  html += '<div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap;margin-bottom:8px" id="v24PersonaBtns"></div>';

  var m = createV24Modal('🧬 캐릭터 성격 분석기', html);

  function drawPersona(){
    var c = document.getElementById('v24PersonaCanvas');
    if(!c) return;
    var ctx = c.getContext('2d');
    var W = c.width, H = c.height;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = isDarkV24() ? '#1a0a2e' : '#FFF0F8';
    ctx.fillRect(0,0,W,H);

    ctx.fillStyle = isDarkV24() ? '#FF8EC4' : '#FF5FA2';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('캐릭터 성격 유형 분석기', W/2, 28);

    var ch = PERSONA_CHARS[saved.selected];
    ctx.font = '12px sans-serif';
    ctx.fillStyle = isDarkV24() ? '#aaa' : '#888';
    ctx.fillText(ch.name + ' - ' + ch.type + ' | ' + ch.desc, W/2, 48);

    var cx = 200, cy = 210, radius = 130;
    var axes = PERSONA_AXES.length;

    for(var ring = 1; ring <= 5; ring++){
      var r = radius * ring / 5;
      ctx.beginPath();
      for(var a = 0; a < axes; a++){
        var angle = (Math.PI * 2 / axes) * a - Math.PI / 2;
        var px = cx + Math.cos(angle) * r;
        var py = cy + Math.sin(angle) * r;
        if(a === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.strokeStyle = isDarkV24() ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.06)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    for(var a = 0; a < axes; a++){
      var angle = (Math.PI * 2 / axes) * a - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
      ctx.strokeStyle = isDarkV24() ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.08)';
      ctx.stroke();

      var lx = cx + Math.cos(angle) * (radius + 20);
      var ly = cy + Math.sin(angle) * (radius + 20);
      ctx.fillStyle = isDarkV24() ? '#ccc' : '#555';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(PERSONA_AXES[a], lx, ly + 4);
    }

    ctx.beginPath();
    ch.traits.forEach(function(val, i){
      var angle = (Math.PI * 2 / axes) * i - Math.PI / 2;
      var r = (val / 100) * radius;
      var px = cx + Math.cos(angle) * r;
      var py = cy + Math.sin(angle) * r;
      if(i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.closePath();
    ctx.fillStyle = 'rgba(255,95,162,.2)';
    ctx.fill();
    ctx.strokeStyle = '#FF5FA2';
    ctx.lineWidth = 2;
    ctx.stroke();

    if(saved.compared >= 0 && saved.compared !== saved.selected){
      var ch2 = PERSONA_CHARS[saved.compared];
      ctx.beginPath();
      ch2.traits.forEach(function(val, i){
        var angle = (Math.PI * 2 / axes) * i - Math.PI / 2;
        var r = (val / 100) * radius;
        var px = cx + Math.cos(angle) * r;
        var py = cy + Math.sin(angle) * r;
        if(i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.closePath();
      ctx.fillStyle = 'rgba(139,92,246,.15)';
      ctx.fill();
      ctx.strokeStyle = '#8B5CF6';
      ctx.lineWidth = 2;
      ctx.setLineDash([5,3]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    var infoX = 380, infoY = 80;
    PERSONA_AXES.forEach(function(axis, i){
      var y = infoY + i * 36;
      ctx.fillStyle = isDarkV24() ? '#aaa' : '#666';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(axis, infoX, y);

      var barX = infoX + 40;
      var barW = 150;
      var barH = 14;
      ctx.fillStyle = isDarkV24() ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.04)';
      ctx.beginPath();
      ctx.roundRect(barX, y - 10, barW, barH, 7);
      ctx.fill();

      var fillW = (ch.traits[i] / 100) * barW;
      ctx.fillStyle = '#FF5FA2';
      ctx.beginPath();
      ctx.roundRect(barX, y - 10, fillW, barH, 7);
      ctx.fill();

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(ch.traits[i], barX + fillW / 2, y);
    });

    v24Save('v24_persona', saved);
  }

  drawPersona();

  setTimeout(function(){
    var btnArea = document.getElementById('v24PersonaBtns');
    if(btnArea){
      PERSONA_CHARS.forEach(function(ch, i){
        var btn = document.createElement('button');
        btn.textContent = ch.name;
        btn.style.cssText = 'padding:5px 12px;border:2px solid ' + (i === saved.selected ? '#FF5FA2' : 'rgba(0,0,0,.1)') + ';border-radius:12px;background:' + (i === saved.selected ? 'rgba(255,95,162,.1)' : 'transparent') + ';color:' + (isDarkV24() ? '#eee' : '#333') + ';font-size:11px;font-weight:700;cursor:pointer';
        btn.addEventListener('click', function(){
          if(saved.selected === i){
            saved.compared = -1;
          } else {
            saved.compared = saved.selected;
            saved.selected = i;
          }
          sfxV24('persona_scan');
          drawPersona();
          Array.from(btnArea.children).forEach(function(b, bi){
            b.style.borderColor = bi === saved.selected ? '#FF5FA2' : 'rgba(0,0,0,.1)';
            b.style.background = bi === saved.selected ? 'rgba(255,95,162,.1)' : 'transparent';
          });
        });
        btnArea.appendChild(btn);
      });
    }
  }, 100);
}


// ============================================================
// 8. ADVENTURE COMPENDIUM TRACKER (Canvas 620x380)
// ============================================================
var COMPENDIUM_CATS = [
  {name:'캐릭터',icon:'👥',total:12,color:'#FF5FA2'},
  {name:'아이템',icon:'📦',total:24,color:'#8B5CF6'},
  {name:'스킬',icon:'⚔️',total:16,color:'#4ECDC4'},
  {name:'보스',icon:'💀',total:10,color:'#FF6B6B'},
  {name:'맵',icon:'🗺️',total:8,color:'#FFD700'},
  {name:'업적',icon:'🏆',total:20,color:'#2ECC71'},
  {name:'BGM',icon:'🎵',total:6,color:'#E91E63'},
  {name:'비밀',icon:'🔮',total:4,color:'#9B59B6'}
];

function renderCompendiumTracker(){
  var saved = v24Load('v24_compendium', {collected:COMPENDIUM_CATS.map(function(cat){return Math.floor(Math.random() * cat.total * 0.6)})});
  var html = '<div style="text-align:center;margin-bottom:12px"><canvas id="v24CompCanvas" width="620" height="380" style="max-width:100%;border-radius:12px;background:' + (isDarkV24()?'#1a0a2e':'#FFF0F8') + '"></canvas></div>';
  html += '<div style="text-align:center"><button id="v24CompDiscover" style="padding:8px 22px;background:linear-gradient(135deg,#FF5FA2,#B066FF);color:#fff;border:none;border-radius:14px;font-size:13px;font-weight:700;cursor:pointer">🔍 탐험하기</button></div>';

  var m = createV24Modal('📚 모험 도감 완성도 트래커', html);

  function drawCompendium(){
    var c = document.getElementById('v24CompCanvas');
    if(!c) return;
    var ctx = c.getContext('2d');
    var W = c.width, H = c.height;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = isDarkV24() ? '#1a0a2e' : '#FFF0F8';
    ctx.fillRect(0,0,W,H);

    ctx.fillStyle = isDarkV24() ? '#FF8EC4' : '#FF5FA2';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('모험 도감 완성도 트래커', W/2, 28);

    var totalCollected = 0, totalAll = 0;
    COMPENDIUM_CATS.forEach(function(cat, i){ totalCollected += saved.collected[i]; totalAll += cat.total; });
    var totalPct = Math.round(totalCollected / totalAll * 100);

    var centerX = W/2, centerY = 100;
    var outerR = 50, innerR = 35;

    ctx.beginPath();
    ctx.arc(centerX, centerY, outerR, 0, Math.PI * 2);
    ctx.fillStyle = isDarkV24() ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.04)';
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, outerR, -Math.PI/2, -Math.PI/2 + (totalPct/100) * Math.PI * 2);
    ctx.closePath();
    var grad = ctx.createLinearGradient(centerX - outerR, centerY, centerX + outerR, centerY);
    grad.addColorStop(0, '#FF5FA2');
    grad.addColorStop(1, '#B066FF');
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(centerX, centerY, innerR, 0, Math.PI * 2);
    ctx.fillStyle = isDarkV24() ? '#1a0a2e' : '#FFF0F8';
    ctx.fill();

    ctx.fillStyle = isDarkV24() ? '#eee' : '#333';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(totalPct + '%', centerX, centerY + 6);

    ctx.fillStyle = isDarkV24() ? '#aaa' : '#888';
    ctx.font = '10px sans-serif';
    ctx.fillText(totalCollected + '/' + totalAll, centerX, centerY + 20);

    var barStartX = 40;
    var barStartY = 160;
    var barMaxW = W - 80;
    var barH = 22;
    var gap = 26;

    COMPENDIUM_CATS.forEach(function(cat, i){
      var y = barStartY + i * gap;
      var pct = saved.collected[i] / cat.total;

      ctx.fillStyle = isDarkV24() ? '#ccc' : '#555';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(cat.icon + ' ' + cat.name, barStartX, y + 15);

      var trackX = barStartX + 85;
      var trackW = barMaxW - 140;

      ctx.fillStyle = isDarkV24() ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.04)';
      ctx.beginPath();
      ctx.roundRect(trackX, y, trackW, barH, 6);
      ctx.fill();

      var fillW = pct * trackW;
      ctx.fillStyle = cat.color;
      ctx.beginPath();
      ctx.roundRect(trackX, y, fillW, barH, 6);
      ctx.fill();

      ctx.fillStyle = pct > 0.3 ? '#fff' : (isDarkV24() ? '#ccc' : '#555');
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      if(fillW > 30) ctx.fillText(Math.round(pct * 100) + '%', trackX + fillW / 2, y + 15);

      ctx.textAlign = 'right';
      ctx.fillStyle = isDarkV24() ? '#aaa' : '#888';
      ctx.font = '11px sans-serif';
      ctx.fillText(saved.collected[i] + '/' + cat.total, barStartX + barMaxW, y + 15);
    });

    v24Save('v24_compendium', saved);
  }

  drawCompendium();

  setTimeout(function(){
    var discoverBtn = document.getElementById('v24CompDiscover');
    if(discoverBtn) discoverBtn.addEventListener('click', function(){
      var idx = Math.floor(Math.random() * COMPENDIUM_CATS.length);
      var cat = COMPENDIUM_CATS[idx];
      if(saved.collected[idx] < cat.total){
        saved.collected[idx]++;
        sfxV24('compendium_add');
        var allComplete = COMPENDIUM_CATS.every(function(c, i){ return saved.collected[i] >= c.total; });
        if(allComplete) sfxV24('compendium_complete');
        showToastV24('📚 ' + cat.icon + ' ' + cat.name + ' 항목 발견! (' + saved.collected[idx] + '/' + cat.total + ')');
      } else {
        showToastV24('✅ ' + cat.name + ' 카테고리 이미 완성!');
        var incomplete = [];
        COMPENDIUM_CATS.forEach(function(c, i){ if(saved.collected[i] < c.total) incomplete.push(i); });
        if(incomplete.length > 0){
          var ri = incomplete[Math.floor(Math.random() * incomplete.length)];
          saved.collected[ri]++;
          sfxV24('compendium_add');
          showToastV24('📚 ' + COMPENDIUM_CATS[ri].icon + ' ' + COMPENDIUM_CATS[ri].name + ' 항목 발견!');
        }
      }
      drawCompendium();
    });
  }, 100);
}


// ============================================================
// QUIZ v24 - 15 Questions (225 -> 240)
// ============================================================
var V24_QUIZ = [
  {q:'하츄핑의 대표 속성은?',a:['사랑','용기','지혜','활력'],c:0},
  {q:'포켓몬에서 불/물/풀 삼속성 상성을 뭐라 하나?',a:['타입 상성','레벨 차이','특성 효과','종족값'],c:0},
  {q:'RPG에서 HP는 무엇의 약자?',a:['Hit Points','High Power','Hero Potential','Hard Play'],c:0},
  {q:'슈퍼마리오의 적 쿠파의 종족은?',a:['거북이','공룡','드래곤','악어'],c:0},
  {q:'턴제 RPG에서 속도 스탯이 높으면?',a:['먼저 행동','데미지 증가','방어력 증가','체력 증가'],c:0},
  {q:'게임에서 NPC는 무엇의 약자?',a:['Non-Player Character','New Play Content','Next Phase Challenge','Normal Power Check'],c:0},
  {q:'포켓몬에서 진화는 보통 몇 레벨부터 시작?',a:['16','5','30','50'],c:0},
  {q:'플랫포머 게임의 핵심 조작은?',a:['점프','마법','대화','제작'],c:0},
  {q:'RPG에서 파티 편성 시 가장 중요한 것은?',a:['역할 밸런스','레벨 높은 캐릭','같은 속성 조합','외모'],c:0},
  {q:'슈퍼마리오에서 스타를 먹으면?',a:['무적 상태','체력 회복','크기 증가','시간 정지'],c:0},
  {q:'날씨가 전투에 영향을 미치는 시스템을 뭐라 하나?',a:['날씨 시스템','기후 전투','환경 효과','자연 보너스'],c:0},
  {q:'캐릭터 시너지란 무엇을 의미하나?',a:['조합 상승효과','단독 강화','레벨업','장비 세트'],c:0},
  {q:'아이템 강화 시 실패하면 보통 어떻게 되나?',a:['강화 수치 유지/하락','캐릭터 삭제','게임 종료','맵 이동'],c:0},
  {q:'스피드런이란?',a:['최단 시간 클리어','최고 점수 달성','올 클리어','무피해 클리어'],c:0},
  {q:'MBTI에서 E와 I는 각각 무엇을 의미?',a:['외향/내향','에너지/지성','감정/직관','판단/인식'],c:0}
];

function renderV24Quiz(){
  var saved = v24Load('v24_quiz_state', {answered:0, correct:0, idx:0, history:[]});
  if(saved.idx >= V24_QUIZ.length) saved.idx = 0;
  var quiz = V24_QUIZ[saved.idx];

  var html = '<div style="margin-bottom:12px;font-size:13px;color:' + (isDarkV24()?'#aaa':'#888') + '">진행: ' + (saved.idx + 1) + '/' + V24_QUIZ.length + ' | 정답률: ' + (saved.answered > 0 ? Math.round(saved.correct/saved.answered*100) : 0) + '% (' + saved.correct + '/' + saved.answered + ')</div>';
  html += '<div style="font-size:15px;font-weight:700;margin-bottom:16px">' + quiz.q + '</div>';
  quiz.a.forEach(function(ans, i){
    html += '<button class="v24QuizBtn" data-idx="' + i + '" style="display:block;width:100%;padding:10px;margin-bottom:8px;background:' + (isDarkV24()?'rgba(255,255,255,.06)':'rgba(0,0,0,.03)') + ';border:2px solid transparent;border-radius:14px;color:' + (isDarkV24()?'#eee':'#333') + ';font-size:13px;font-weight:600;cursor:pointer;text-align:left;transition:all .2s">' + String.fromCharCode(9312 + i) + ' ' + ans + '</button>';
  });

  var m = createV24Modal('❓ 퀴즈 v24 (15문)', html);

  setTimeout(function(){
    var btns = m.querySelectorAll('.v24QuizBtn');
    btns.forEach(function(btn){
      btn.addEventListener('click', function(){
        var idx = parseInt(btn.dataset.idx);
        var isCorrect = idx === quiz.c;
        saved.answered++;
        if(isCorrect) saved.correct++;
        saved.idx++;
        if(saved.idx >= V24_QUIZ.length) saved.idx = 0;

        btns.forEach(function(b){
          var bi = parseInt(b.dataset.idx);
          if(bi === quiz.c) b.style.borderColor = '#4ECDC4';
          else if(bi === idx && !isCorrect) b.style.borderColor = '#FF6B6B';
          b.style.pointerEvents = 'none';
        });

        sfxV24(isCorrect ? 'v24_quiz' : 'forge_hit');
        v24Save('v24_quiz_state', saved);

        setTimeout(function(){
          m.closest('div[style]').remove();
          renderV24Quiz();
        }, 1200);
      });
    });
  }, 100);
}


// ============================================================
// ACHIEVEMENTS v24 (+12, 214 -> 226)
// ============================================================
var V24_ACHIEVEMENTS = [
  {id:'a_v24_rank_scan',name:'랭킹 스캐너',desc:'랭킹 스캔 1회 실행',cat:'general',icon:'🏅'},
  {id:'a_v24_rank_A',name:'A등급 달성',desc:'종합 랭킹 A등급 이상',cat:'general',icon:'🥇'},
  {id:'a_v24_skill_5',name:'스킬 입문자',desc:'스킬 5개 해금',cat:'general',icon:'🌳'},
  {id:'a_v24_skill_all',name:'스킬 마스터',desc:'모든 스킬 해금',cat:'general',icon:'⭐'},
  {id:'a_v24_weather_3',name:'기상학자',desc:'3가지 날씨에서 전투',cat:'general',icon:'🌦️'},
  {id:'a_v24_synergy_90',name:'환상의 조합',desc:'시너지 90% 이상 발견',cat:'general',icon:'🤝'},
  {id:'a_v24_forge_5',name:'견습 대장장이',desc:'강화 5회 성공',cat:'general',icon:'🔨'},
  {id:'a_v24_forge_max',name:'전설의 대장간',desc:'아이템 1개 최대 강화',cat:'general',icon:'⚒️'},
  {id:'a_v24_dungeon_5',name:'던전 탐험가',desc:'던전 5회 클리어',cat:'general',icon:'🏰'},
  {id:'a_v24_persona_all',name:'성격 분석 완료',desc:'모든 캐릭터 성격 확인',cat:'general',icon:'🧬'},
  {id:'a_v24_compendium_50',name:'도감 수집가',desc:'도감 50% 이상 달성',cat:'general',icon:'📚'},
  {id:'a_v24_quiz_master',name:'퀴즈 v24 마스터',desc:'v24 퀴즈 전문 정답',cat:'general',icon:'🏅'}
];

function checkV24Achievements(){
  var achievements;
  try{ achievements = JSON.parse(localStorage.getItem('hatcuping_achievements')) || {}; }catch(e){ achievements = {}; }
  var changed = false;

  var ranking = v24Load('v24_ranking', {scores:[],rank:'D'});
  if(ranking.scores.length > 0 && !achievements.a_v24_rank_scan){ achievements.a_v24_rank_scan = Date.now(); changed = true; showToastV24('🏆 랭킹 스캐너 업적 달성!'); }
  if((ranking.rank === 'A' || ranking.rank === 'S') && !achievements.a_v24_rank_A){ achievements.a_v24_rank_A = Date.now(); changed = true; showToastV24('🏆 A등급 달성 업적!'); }

  var skill = v24Load('v24_skilltree', {unlocked:[0]});
  if(skill.unlocked.length >= 5 && !achievements.a_v24_skill_5){ achievements.a_v24_skill_5 = Date.now(); changed = true; showToastV24('🏆 스킬 입문자 업적 달성!'); }
  if(skill.unlocked.length >= SKILL_NODES.length && !achievements.a_v24_skill_all){ achievements.a_v24_skill_all = Date.now(); changed = true; showToastV24('🏆 스킬 마스터 업적 달성!'); }

  var weather = v24Load('v24_weather', {battles:0});
  if(weather.battles >= 3 && !achievements.a_v24_weather_3){ achievements.a_v24_weather_3 = Date.now(); changed = true; showToastV24('🏆 기상학자 업적 달성!'); }

  var forge = v24Load('v24_forge', {items:[],totalForges:0});
  if(forge.totalForges >= 5 && !achievements.a_v24_forge_5){ achievements.a_v24_forge_5 = Date.now(); changed = true; showToastV24('🏆 견습 대장장이 업적 달성!'); }
  if(forge.items && forge.items.some(function(it){return it.level >= 10}) && !achievements.a_v24_forge_max){ achievements.a_v24_forge_max = Date.now(); changed = true; showToastV24('🏆 전설의 대장간 업적 달성!'); }

  var dungeon = v24Load('v24_dungeon', {totalClears:0});
  if(dungeon.totalClears >= 5 && !achievements.a_v24_dungeon_5){ achievements.a_v24_dungeon_5 = Date.now(); changed = true; showToastV24('🏆 던전 탐험가 업적 달성!'); }

  var comp = v24Load('v24_compendium', {collected:[]});
  if(comp.collected.length > 0){
    var totalC = 0, totalA = 0;
    COMPENDIUM_CATS.forEach(function(cat, i){ totalC += (comp.collected[i] || 0); totalA += cat.total; });
    if(totalC / totalA >= 0.5 && !achievements.a_v24_compendium_50){ achievements.a_v24_compendium_50 = Date.now(); changed = true; showToastV24('🏆 도감 수집가 업적 달성!'); }
  }

  var quiz = v24Load('v24_quiz_state', {answered:0,correct:0});
  if(quiz.answered >= 15 && quiz.correct >= 15 && !achievements.a_v24_quiz_master){ achievements.a_v24_quiz_master = Date.now(); changed = true; showToastV24('🏆 퀴즈 v24 마스터 업적 달성!'); }

  if(changed){
    try{ localStorage.setItem('hatcuping_achievements', JSON.stringify(achievements)); }catch(e){}
    var countEl = document.getElementById('achieveCount');
    if(countEl) countEl.textContent = Object.keys(achievements).length + '/24';
  }
}

setInterval(checkV24Achievements, 5000);


// ============================================================
// NAV BUTTONS - Append to existing bottom bar (UI rule compliant)
// ============================================================
function addV24NavButtons(){
  var bottomBar = document.querySelector('.sg30-bottom-bar') || document.getElementById('v8BottomBar') || document.querySelector('[id*="BottomBar"]') || document.querySelector('[id*="bottomBar"]') || document.querySelector('[class*="bottom-bar"]');
  if(!bottomBar){
    var allBtns = document.querySelectorAll('button');
    for(var i = 0; i < allBtns.length; i++){
      var p = allBtns[i].parentElement;
      if(p && p.children.length >= 4 && p.style && (p.style.position === 'fixed' || getComputedStyle(p).position === 'fixed')){
        bottomBar = p; break;
      }
    }
  }

  var navItems = [
    {label:'🏅 랭킹',fn:renderAdventurerRanking,key:'Shift+I'},
    {label:'🌳 스킬트리',fn:renderSkillTree,key:'Shift+J'},
    {label:'🌦️ 날씨전투',fn:renderWeatherBattle,key:'Shift+K'},
    {label:'🤝 시너지',fn:renderSynergyMatrix,key:'Shift+L'},
    {label:'🔨 대장간',fn:renderForge,key:'Shift+M'},
    {label:'⏱️ 던전타임',fn:renderDungeonTimeboard,key:'Shift+N'},
    {label:'🧬 성격분석',fn:renderPersonalityAnalyzer,key:'Shift+O'},
    {label:'📚 도감',fn:renderCompendiumTracker,key:'Shift+P'},
    {label:'❓ 퀴즈v24',fn:renderV24Quiz,key:'Shift+0'}
  ];

  if(bottomBar){
    navItems.forEach(function(item){
      var btn = document.createElement('button');
      btn.textContent = item.label;
      btn.style.cssText = 'padding:6px 10px;margin:2px;background:linear-gradient(135deg,#4ECDC4,#2ECC71);color:#fff;border:none;border-radius:10px;font-size:10px;font-weight:700;cursor:pointer;white-space:nowrap';
      btn.addEventListener('click', function(){ sfxV24('v24_nav'); item.fn(); });
      bottomBar.appendChild(btn);
    });
  }

  document.addEventListener('keydown', function(e){
    if(!e.shiftKey) return;
    if(e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    var keyMap = {
      'I':renderAdventurerRanking, 'J':renderSkillTree, 'K':renderWeatherBattle,
      'L':renderSynergyMatrix, 'M':renderForge, 'N':renderDungeonTimeboard,
      'O':renderPersonalityAnalyzer, 'P':renderCompendiumTracker, '0':renderV24Quiz
    };
    var fn = keyMap[e.key.toUpperCase()];
    if(fn){ e.preventDefault(); sfxV24('v24_nav'); fn(); }
  });
}

if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', addV24NavButtons);
} else {
  addV24NavButtons();
}

})();

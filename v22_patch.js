// hatcuping-game v22_patch.js - NEXTERA+PRISM AUTO v22.0
// Self-contained IIFE patch module
(function(){
'use strict';

var _v22Ctx = null;
function _v22InitAudio(){
  if(!_v22Ctx){
    try{ _v22Ctx = new (window.AudioContext || window.webkitAudioContext)(); }catch(e){}
  }
  if(_v22Ctx && _v22Ctx.state === 'suspended') _v22Ctx.resume();
}

var V22_SFX = {
  friend_link:{f:880,d:.12,t:'triangle'},
  friend_boost:{f:1100,d:.15,t:'sine'},
  tactic_select:{f:660,d:.08,t:'square'},
  tactic_win:{f:1200,d:.18,t:'triangle'},
  alchemy_mix:{f:440,d:.14,t:'sine'},
  alchemy_success:{f:990,d:.2,t:'triangle'},
  quest_accept:{f:550,d:.08,t:'sine'},
  quest_complete:{f:1320,d:.16,t:'triangle'},
  growth_up:{f:770,d:.1,t:'sine'},
  boss_scan:{f:330,d:.1,t:'square'},
  team_sync:{f:600,d:.12,t:'sine'},
  timeline_tick:{f:500,d:.05,t:'triangle'},
  v22_nav:{f:700,d:.05,t:'sine'},
  v22_quiz:{f:880,d:.08,t:'triangle'}
};

function sfxV22(type){
  _v22InitAudio();
  if(!_v22Ctx) return;
  var s = V22_SFX[type];
  if(!s) return;
  try{
    var muted = false;
    try{ muted = localStorage.getItem('hatcuping_mute') === '1'; }catch(e){}
    if(muted) return;
    var osc = _v22Ctx.createOscillator();
    var gain = _v22Ctx.createGain();
    osc.type = s.t || 'sine';
    osc.frequency.value = s.f;
    gain.gain.value = 0.08;
    osc.connect(gain);
    gain.connect(_v22Ctx.destination);
    osc.start();
    osc.stop(_v22Ctx.currentTime + (s.d || 0.06));
  }catch(e){}
}

function v22Load(key, fb){ try{ var d = JSON.parse(localStorage.getItem(key)); return d !== null ? d : fb; }catch(e){ return fb; } }
function v22Save(key, data){ try{ localStorage.setItem(key, JSON.stringify(data)); }catch(e){} }
function isDarkV22(){ return document.body.classList.contains('dark'); }
function showToastV22(msg){
  var t = document.getElementById('achieveToast');
  if(t){ t.innerHTML = msg; t.classList.add('show'); setTimeout(function(){ t.classList.remove('show'); }, 2500); }
}

function createV22Modal(title, contentHTML){
  var overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.6);z-index:9999;display:flex;justify-content:center;align-items:center;backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px)';
  var modal = document.createElement('div');
  var bg = isDarkV22() ? '#2a1a3e' : '#fff';
  var col = isDarkV22() ? '#eee' : '#333';
  modal.style.cssText = 'background:' + bg + ';color:' + col + ';border-radius:24px;padding:24px;max-width:680px;width:94%;max-height:85vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.25);position:relative';
  modal.innerHTML = '<button style="position:absolute;top:12px;right:16px;background:none;border:none;font-size:24px;cursor:pointer;color:' + col + '" onclick="this.closest(\'div[style]\').parentElement.remove()">&times;</button><h3 style="font-size:18px;margin-bottom:16px;color:#FF5FA2">' + title + '</h3>' + contentHTML;
  overlay.appendChild(modal);
  overlay.addEventListener('click', function(e){ if(e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
  return modal;
}


// ============================================================
// 1. TINIPING FRIENDSHIP NETWORK (Canvas 600x400)
// ============================================================
var FRIEND_CHARS = [
  {name:'하츄핑',icon:'💖',color:'#FF5FA2'},
  {name:'바로핑',icon:'⚖️',color:'#42A5F5'},
  {name:'아자핑',icon:'💪',color:'#FF9800'},
  {name:'차차핑',icon:'💃',color:'#AB47BC'},
  {name:'해필핑',icon:'😊',color:'#66BB6A'},
  {name:'라라핑',icon:'🎵',color:'#EF5350'},
  {name:'로미',icon:'👧',color:'#E91E63'},
  {name:'키키핑',icon:'😈',color:'#78909C'},
  {name:'무무핑',icon:'🛡️',color:'#5C6BC0'},
  {name:'또또핑',icon:'🔮',color:'#7E57C2'},
  {name:'시러핑',icon:'❄️',color:'#26C6DA'},
  {name:'오로라핑',icon:'🌈',color:'#FFA726'}
];
var FRIEND_BONDS = [
  [0,6,95],[0,1,80],[0,2,85],[0,3,75],[0,4,90],[0,5,70],
  [6,1,60],[6,4,88],[6,9,55],[1,2,65],[2,5,60],[3,5,82],
  [4,5,70],[7,8,75],[8,9,68],[9,10,50],[10,11,72],[0,11,65],
  [6,3,58],[2,8,45],[1,4,62],[3,9,48],[5,11,55],[7,10,40]
];

function openFriendNetwork(){
  sfxV22('friend_link');
  var state = v22Load('v22_friend', {boosts:0,selectedPair:null});
  var html = '<div style="text-align:center;margin-bottom:12px"><canvas id="v22FriendCanvas" width="600" height="400" style="max-width:100%;border-radius:12px;background:' + (isDarkV22()?'#1a1030':'#FFF8FC') + '"></canvas></div>';
  html += '<div style="text-align:center;margin-bottom:8px"><button id="v22FriendBoost" style="padding:10px 28px;border-radius:14px;border:none;background:linear-gradient(135deg,#FF5FA2,#AB47BC);color:#fff;font-weight:700;font-size:14px;cursor:pointer;margin:0 4px">우정 강화</button>';
  html += '<button id="v22FriendReset" style="padding:10px 28px;border-radius:14px;border:none;background:linear-gradient(135deg,#78909C,#546E7A);color:#fff;font-weight:700;font-size:14px;cursor:pointer;margin:0 4px">초기화</button></div>';
  html += '<div id="v22FriendInfo" style="text-align:center;font-size:12px;color:#888;min-height:24px">캐릭터를 클릭하여 관계를 확인하세요</div>';
  var modal = createV22Modal('💞 티니핑 우정 네트워크', html);
  drawFriendNetwork(state, -1);
  var selectedChar = -1;
  var canvas = modal.querySelector('#v22FriendCanvas');
  canvas.onclick = function(e){
    var rect = canvas.getBoundingClientRect();
    var sx = 600/rect.width, sy = 400/rect.height;
    var mx = (e.clientX - rect.left)*sx, my = (e.clientY - rect.top)*sy;
    var positions = getFriendPositions();
    for(var i=0;i<12;i++){
      var dx = mx - positions[i].x, dy = my - positions[i].y;
      if(dx*dx+dy*dy < 900){
        selectedChar = (selectedChar === i) ? -1 : i;
        sfxV22('friend_link');
        drawFriendNetwork(state, selectedChar);
        var info = modal.querySelector('#v22FriendInfo');
        if(selectedChar >= 0){
          var bonds = [];
          FRIEND_BONDS.forEach(function(b){
            var bonus = state.boosts || 0;
            var val = Math.min(b[2] + bonus, 100);
            if(b[0]===selectedChar) bonds.push(FRIEND_CHARS[b[1]].name + ': ' + val + '%');
            else if(b[1]===selectedChar) bonds.push(FRIEND_CHARS[b[0]].name + ': ' + val + '%');
          });
          info.textContent = FRIEND_CHARS[selectedChar].name + '의 관계: ' + bonds.join(', ');
        } else { info.textContent = '캐릭터를 클릭하여 관계를 확인하세요'; }
        break;
      }
    }
  };
  modal.querySelector('#v22FriendBoost').onclick = function(){
    state.boosts = Math.min((state.boosts||0) + 2, 20);
    v22Save('v22_friend', state);
    sfxV22('friend_boost');
    drawFriendNetwork(state, selectedChar);
    showToastV22('💞 우정 +2 강화!');
  };
  modal.querySelector('#v22FriendReset').onclick = function(){
    state.boosts = 0; v22Save('v22_friend', state);
    drawFriendNetwork(state, selectedChar);
  };
}

function getFriendPositions(){
  var cx = 300, cy = 200, r = 150;
  var pos = [];
  for(var i=0;i<12;i++){
    var a = (i/12)*Math.PI*2 - Math.PI/2;
    pos.push({x: cx + Math.cos(a)*r, y: cy + Math.sin(a)*r});
  }
  return pos;
}

function drawFriendNetwork(state, selected){
  var c = document.getElementById('v22FriendCanvas'); if(!c) return;
  var ctx = c.getContext('2d'); var dk = isDarkV22();
  ctx.clearRect(0,0,600,400);
  ctx.fillStyle = dk ? '#1a1030' : '#FFF8FC'; ctx.fillRect(0,0,600,400);
  var pos = getFriendPositions();
  var bonus = state.boosts || 0;
  FRIEND_BONDS.forEach(function(b){
    var val = Math.min(b[2] + bonus, 100);
    var a = pos[b[0]], bb = pos[b[1]];
    var highlight = (selected === b[0] || selected === b[1]);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y); ctx.lineTo(bb.x, bb.y);
    ctx.strokeStyle = highlight ? '#FF5FA2' : (dk ? 'rgba(255,255,255,'+(val/300)+')' : 'rgba(0,0,0,'+(val/300)+')');
    ctx.lineWidth = highlight ? 3 : Math.max(1, val/30);
    ctx.stroke();
    if(highlight){
      var mx = (a.x+bb.x)/2, my = (a.y+bb.y)/2;
      ctx.font = 'bold 10px sans-serif';
      ctx.fillStyle = '#FF5FA2';
      ctx.textAlign = 'center';
      ctx.fillText(val + '%', mx, my - 4);
    }
  });
  for(var i=0;i<12;i++){
    var p = pos[i], ch = FRIEND_CHARS[i];
    ctx.beginPath();
    ctx.arc(p.x, p.y, selected === i ? 24 : 20, 0, Math.PI*2);
    ctx.fillStyle = selected === i ? ch.color : (dk ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.05)');
    ctx.fill();
    ctx.strokeStyle = ch.color; ctx.lineWidth = selected === i ? 3 : 1.5; ctx.stroke();
    ctx.font = '16px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(ch.icon, p.x, p.y + 5);
    ctx.font = 'bold 9px sans-serif'; ctx.fillStyle = dk ? '#ccc' : '#555';
    ctx.fillText(ch.name, p.x, p.y + 34);
  }
  ctx.font = 'bold 14px sans-serif'; ctx.fillStyle = dk ? '#FF8EC4' : '#FF5FA2'; ctx.textAlign = 'center';
  ctx.fillText('💞 우정 네트워크 (강화: +' + bonus + ')', 300, 20);
}


// ============================================================
// 2. BATTLE TACTICS SIMULATOR (Canvas 580x380)
// ============================================================
var TACTICS = [
  {name:'돌격전법',atk:90,def:30,spd:80,icon:'⚔️'},
  {name:'방어진형',atk:40,def:95,spd:25,icon:'🛡️'},
  {name:'기습작전',atk:75,def:20,spd:95,icon:'🗡️'},
  {name:'마법포격',atk:95,def:45,spd:40,icon:'🔮'},
  {name:'유인후퇴',atk:55,def:70,spd:85,icon:'🏃'},
  {name:'협공전법',atk:85,def:50,spd:65,icon:'🤝'},
  {name:'매복전술',atk:80,def:60,spd:50,icon:'🌿'},
  {name:'최종결전',atk:100,def:15,spd:70,icon:'💥'}
];

function openTacticsSim(){
  sfxV22('tactic_select');
  var state = v22Load('v22_tactics', {wins:0,losses:0,draws:0});
  var html = '<div style="text-align:center;margin-bottom:12px"><canvas id="v22TacticsCanvas" width="580" height="380" style="max-width:100%;border-radius:12px;background:' + (isDarkV22()?'#1a1030':'#F8F8FF') + '"></canvas></div>';
  html += '<div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin-bottom:8px" id="v22TacticBtns"></div>';
  html += '<div id="v22TacticResult" style="text-align:center;font-size:13px;color:#888;min-height:30px">전술을 선택하여 대결하세요!</div>';
  html += '<div style="text-align:center;font-size:11px;color:#888;margin-top:4px">전적: ' + state.wins + '승 ' + state.losses + '패 ' + state.draws + '무</div>';
  var modal = createV22Modal('⚔️ 전투 전략 시뮬레이터', html);
  var btnsDiv = modal.querySelector('#v22TacticBtns');
  TACTICS.forEach(function(t, idx){
    var btn = document.createElement('button');
    btn.style.cssText = 'padding:8px 14px;border-radius:12px;border:2px solid rgba(255,95,162,.2);background:' + (isDarkV22()?'rgba(255,255,255,.08)':'rgba(0,0,0,.03)') + ';cursor:pointer;font-size:12px;font-weight:700;color:' + (isDarkV22()?'#eee':'#333') + ';transition:all .2s';
    btn.textContent = t.icon + ' ' + t.name;
    btn.onmouseenter = function(){ btn.style.borderColor = '#FF5FA2'; };
    btn.onmouseleave = function(){ btn.style.borderColor = 'rgba(255,95,162,.2)'; };
    btn.onclick = function(){ runTacticsBattle(idx, state, modal); };
    btnsDiv.appendChild(btn);
  });
  drawTacticsIdle();
}

function drawTacticsIdle(){
  var c = document.getElementById('v22TacticsCanvas'); if(!c) return;
  var ctx = c.getContext('2d'); var dk = isDarkV22();
  ctx.clearRect(0,0,580,380);
  ctx.fillStyle = dk ? '#1a1030' : '#F8F8FF'; ctx.fillRect(0,0,580,380);
  ctx.font = 'bold 16px sans-serif'; ctx.fillStyle = dk ? '#FF8EC4' : '#FF5FA2'; ctx.textAlign = 'center';
  ctx.fillText('⚔️ 전투 전략 시뮬레이터', 290, 30);
  var labels = ['공격력','방어력','속도'];
  var colors = ['#EF5350','#42A5F5','#66BB6A'];
  TACTICS.forEach(function(t, i){
    var x = 40 + (i%4)*135, y = 60 + Math.floor(i/4)*155;
    ctx.font = '12px sans-serif'; ctx.fillStyle = dk ? '#ccc' : '#555'; ctx.textAlign = 'center';
    ctx.fillText(t.icon + ' ' + t.name, x + 55, y);
    var vals = [t.atk, t.def, t.spd];
    vals.forEach(function(v, j){
      var bx = x + 5, by = y + 10 + j*18;
      ctx.fillStyle = dk ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.04)';
      ctx.fillRect(bx, by, 100, 12);
      ctx.fillStyle = colors[j]; ctx.fillRect(bx, by, v, 12);
      ctx.font = '9px sans-serif'; ctx.fillStyle = dk ? '#aaa' : '#888'; ctx.textAlign = 'left';
      ctx.fillText(labels[j], bx + 104, by + 10);
    });
  });
}

function runTacticsBattle(playerIdx, state, modal){
  sfxV22('tactic_select');
  var enemyIdx = Math.floor(Math.random() * TACTICS.length);
  while(enemyIdx === playerIdx) enemyIdx = Math.floor(Math.random() * TACTICS.length);
  var p = TACTICS[playerIdx], e = TACTICS[enemyIdx];
  var pScore = p.atk * 0.4 + p.def * 0.3 + p.spd * 0.3 + Math.random()*20;
  var eScore = e.atk * 0.4 + e.def * 0.3 + e.spd * 0.3 + Math.random()*20;
  var result, resultColor;
  if(pScore > eScore + 5){ result = '승리!'; state.wins++; resultColor = '#4CAF50'; sfxV22('tactic_win'); }
  else if(eScore > pScore + 5){ result = '패배...'; state.losses++; resultColor = '#F44336'; }
  else { result = '무승부'; state.draws++; resultColor = '#FF9800'; }
  v22Save('v22_tactics', state);
  var resEl = modal.querySelector('#v22TacticResult');
  resEl.innerHTML = '<span style="color:' + resultColor + ';font-weight:700">' + p.icon + p.name + ' vs ' + e.icon + e.name + ' → ' + result + '</span>';
  var c = document.getElementById('v22TacticsCanvas'); if(!c) return;
  var ctx = c.getContext('2d'); var dk = isDarkV22();
  ctx.clearRect(0,0,580,380);
  ctx.fillStyle = dk ? '#1a1030' : '#F8F8FF'; ctx.fillRect(0,0,580,380);
  ctx.font = 'bold 16px sans-serif'; ctx.fillStyle = resultColor; ctx.textAlign = 'center';
  ctx.fillText(result, 290, 30);
  var drawRadar = function(cx, cy, r, vals, color, label){
    var axes = ['공격','방어','속도'];
    ctx.beginPath();
    for(var i=0;i<3;i++){
      var a = (i/3)*Math.PI*2 - Math.PI/2;
      var x = cx + Math.cos(a)*r, y = cy + Math.sin(a)*r;
      if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    }
    ctx.closePath(); ctx.strokeStyle = dk?'rgba(255,255,255,.15)':'rgba(0,0,0,.1)'; ctx.stroke();
    ctx.beginPath();
    for(var i=0;i<3;i++){
      var a = (i/3)*Math.PI*2 - Math.PI/2;
      var v = vals[i]/100;
      var x = cx + Math.cos(a)*r*v, y = cy + Math.sin(a)*r*v;
      if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    }
    ctx.closePath(); ctx.fillStyle = color + '33'; ctx.fill();
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke();
    ctx.font = 'bold 13px sans-serif'; ctx.fillStyle = dk?'#ccc':'#555';
    ctx.fillText(label, cx, cy + r + 30);
    axes.forEach(function(ax,i){
      var a = (i/3)*Math.PI*2 - Math.PI/2;
      ctx.font = '11px sans-serif'; ctx.fillStyle = dk?'#aaa':'#777';
      ctx.fillText(ax+':'+vals[i], cx + Math.cos(a)*(r+20), cy + Math.sin(a)*(r+20));
    });
  };
  drawRadar(170, 200, 100, [p.atk,p.def,p.spd], '#4CAF50', p.icon + ' ' + p.name + ' (나)');
  drawRadar(410, 200, 100, [e.atk,e.def,e.spd], '#F44336', e.icon + ' ' + e.name + ' (적)');
  ctx.font = 'bold 28px sans-serif'; ctx.fillStyle = resultColor; ctx.textAlign = 'center';
  ctx.fillText('VS', 290, 210);
}


// ============================================================
// 3. MAGIC ELEMENT ALCHEMY (Canvas 600x380)
// ============================================================
var ALCHEMY_ELEMENTS = [
  {name:'불',icon:'🔥',color:'#F44336'},
  {name:'물',icon:'💧',color:'#2196F3'},
  {name:'바람',icon:'🌪️',color:'#4CAF50'},
  {name:'땅',icon:'🪨',color:'#795548'},
  {name:'빛',icon:'✨',color:'#FFC107'},
  {name:'어둠',icon:'🌑',color:'#37474F'}
];
var ALCHEMY_RECIPES = [
  {a:0,b:1,name:'증기',icon:'♨️',power:75},{a:0,b:2,name:'화염폭풍',icon:'🌋',power:90},
  {a:0,b:3,name:'용암',icon:'🫧',power:85},{a:0,b:4,name:'태양불꽃',icon:'☀️',power:95},
  {a:0,b:5,name:'지옥불',icon:'👿',power:88},{a:1,b:2,name:'태풍',icon:'🌊',power:80},
  {a:1,b:3,name:'진흙',icon:'🏖️',power:55},{a:1,b:4,name:'무지개',icon:'🌈',power:70},
  {a:1,b:5,name:'심해',icon:'🐙',power:78},{a:2,b:3,name:'모래폭풍',icon:'🏜️',power:72},
  {a:2,b:4,name:'오로라',icon:'🌌',power:82},{a:2,b:5,name:'암흑바람',icon:'🖤',power:76},
  {a:3,b:4,name:'보석',icon:'💎',power:68},{a:3,b:5,name:'지하세계',icon:'⛏️',power:74},
  {a:4,b:5,name:'황혼',icon:'🌅',power:92}
];

function openAlchemy(){
  sfxV22('alchemy_mix');
  var state = v22Load('v22_alchemy', {discovered:[], totalMix:0});
  var html = '<div style="text-align:center;margin-bottom:12px"><canvas id="v22AlchemyCanvas" width="600" height="380" style="max-width:100%;border-radius:12px;background:' + (isDarkV22()?'#1a1030':'#FFFDF0') + '"></canvas></div>';
  html += '<div style="display:flex;gap:8px;justify-content:center;margin-bottom:8px;flex-wrap:wrap" id="v22ElemBtns"></div>';
  html += '<div id="v22AlchemySlots" style="text-align:center;margin-bottom:8px;font-size:14px">원소 2개를 선택하세요</div>';
  html += '<div style="text-align:center"><button id="v22AlchemyMix" style="padding:10px 28px;border-radius:14px;border:none;background:linear-gradient(135deg,#FFC107,#FF9800);color:#fff;font-weight:700;font-size:14px;cursor:pointer">합성!</button></div>';
  html += '<div id="v22AlchemyResult" style="text-align:center;font-size:13px;color:#888;min-height:24px;margin-top:6px">발견: ' + state.discovered.length + '/' + ALCHEMY_RECIPES.length + ' | 총 합성: ' + state.totalMix + '</div>';
  var modal = createV22Modal('⚗️ 마법 속성 합성 연금술', html);
  var selected = [];
  var btnsDiv = modal.querySelector('#v22ElemBtns');
  ALCHEMY_ELEMENTS.forEach(function(el, idx){
    var btn = document.createElement('button');
    btn.style.cssText = 'padding:10px 18px;border-radius:14px;border:2px solid ' + el.color + '44;background:' + el.color + '11;cursor:pointer;font-size:14px;font-weight:700;color:' + (isDarkV22()?'#eee':'#333') + ';transition:all .2s';
    btn.textContent = el.icon + ' ' + el.name;
    btn.onclick = function(){
      if(selected.length < 2 && selected.indexOf(idx) === -1){
        selected.push(idx);
        btn.style.borderColor = el.color;
        btn.style.background = el.color + '33';
        sfxV22('alchemy_mix');
      } else if(selected.indexOf(idx) >= 0){
        selected.splice(selected.indexOf(idx), 1);
        btn.style.borderColor = el.color + '44';
        btn.style.background = el.color + '11';
      }
      modal.querySelector('#v22AlchemySlots').textContent = selected.length === 2 ?
        ALCHEMY_ELEMENTS[selected[0]].icon + ' + ' + ALCHEMY_ELEMENTS[selected[1]].icon + ' = ?' : '원소 ' + (2-selected.length) + '개 더 선택';
    };
    btnsDiv.appendChild(btn);
  });
  modal.querySelector('#v22AlchemyMix').onclick = function(){
    if(selected.length !== 2) return;
    var a = Math.min(selected[0],selected[1]), b = Math.max(selected[0],selected[1]);
    state.totalMix++;
    var recipe = null;
    ALCHEMY_RECIPES.forEach(function(r){ if(r.a===a && r.b===b) recipe = r; });
    if(recipe){
      if(state.discovered.indexOf(recipe.name) === -1) state.discovered.push(recipe.name);
      v22Save('v22_alchemy', state);
      sfxV22('alchemy_success');
      modal.querySelector('#v22AlchemyResult').innerHTML = '<span style="color:#4CAF50;font-weight:700">' + recipe.icon + ' ' + recipe.name + ' 합성 성공! (위력: ' + recipe.power + ')</span> | 발견: ' + state.discovered.length + '/' + ALCHEMY_RECIPES.length;
      drawAlchemyResult(recipe);
    } else {
      v22Save('v22_alchemy', state);
      modal.querySelector('#v22AlchemyResult').innerHTML = '<span style="color:#F44336">합성 실패! 다른 조합을 시도하세요</span>';
    }
    selected = [];
    btnsDiv.querySelectorAll('button').forEach(function(b,i){ b.style.borderColor = ALCHEMY_ELEMENTS[i].color+'44'; b.style.background = ALCHEMY_ELEMENTS[i].color+'11'; });
    modal.querySelector('#v22AlchemySlots').textContent = '원소 2개를 선택하세요';
  };
  drawAlchemyGrid(state);
}

function drawAlchemyGrid(state){
  var c = document.getElementById('v22AlchemyCanvas'); if(!c) return;
  var ctx = c.getContext('2d'); var dk = isDarkV22();
  ctx.clearRect(0,0,600,380);
  ctx.fillStyle = dk ? '#1a1030' : '#FFFDF0'; ctx.fillRect(0,0,600,380);
  ctx.font = 'bold 14px sans-serif'; ctx.fillStyle = dk ? '#FF8EC4' : '#FF5FA2'; ctx.textAlign = 'center';
  ctx.fillText('⚗️ 합성 레시피 도감 (' + state.discovered.length + '/' + ALCHEMY_RECIPES.length + ')', 300, 24);
  ALCHEMY_RECIPES.forEach(function(r, i){
    var x = 20 + (i%5)*118, y = 42 + Math.floor(i/5)*108;
    var found = state.discovered.indexOf(r.name) >= 0;
    ctx.fillStyle = found ? (dk?'rgba(76,175,80,.15)':'rgba(76,175,80,.08)') : (dk?'rgba(255,255,255,.04)':'rgba(0,0,0,.03)');
    ctx.beginPath(); ctx.roundRect(x,y,110,95,8); ctx.fill();
    ctx.strokeStyle = found ? '#4CAF50' : (dk?'rgba(255,255,255,.1)':'rgba(0,0,0,.06)');
    ctx.lineWidth = 1; ctx.stroke();
    if(found){
      ctx.font = '20px sans-serif'; ctx.fillText(r.icon, x+55, y+30);
      ctx.font = 'bold 11px sans-serif'; ctx.fillStyle = dk?'#ccc':'#555'; ctx.fillText(r.name, x+55, y+50);
      ctx.font = '10px sans-serif'; ctx.fillStyle = dk?'#aaa':'#888';
      ctx.fillText(ALCHEMY_ELEMENTS[r.a].icon + '+' + ALCHEMY_ELEMENTS[r.b].icon + ' 위력:' + r.power, x+55, y+68);
      ctx.fillStyle = '#4CAF50'; ctx.fillRect(x+15, y+78, 80*(r.power/100), 6);
      ctx.fillStyle = dk?'rgba(255,255,255,.06)':'rgba(0,0,0,.03)'; ctx.fillRect(x+15+80*(r.power/100), y+78, 80*(1-r.power/100), 6);
    } else {
      ctx.font = '20px sans-serif'; ctx.fillText('❓', x+55, y+35);
      ctx.font = '11px sans-serif'; ctx.fillStyle = dk?'#666':'#bbb'; ctx.fillText('미발견', x+55, y+55);
      ctx.font = '10px sans-serif'; ctx.fillText(ALCHEMY_ELEMENTS[r.a].icon + '+' + ALCHEMY_ELEMENTS[r.b].icon, x+55, y+72);
    }
  });
}

function drawAlchemyResult(recipe){
  var c = document.getElementById('v22AlchemyCanvas'); if(!c) return;
  var ctx = c.getContext('2d'); var dk = isDarkV22();
  ctx.clearRect(0,0,600,380);
  ctx.fillStyle = dk ? '#1a1030' : '#FFFDF0'; ctx.fillRect(0,0,600,380);
  ctx.font = 'bold 16px sans-serif'; ctx.fillStyle = '#4CAF50'; ctx.textAlign = 'center';
  ctx.fillText('합성 성공!', 300, 40);
  ctx.font = '60px sans-serif'; ctx.fillText(recipe.icon, 300, 130);
  ctx.font = 'bold 24px sans-serif'; ctx.fillStyle = dk?'#eee':'#333';
  ctx.fillText(recipe.name, 300, 180);
  ctx.font = '14px sans-serif'; ctx.fillStyle = dk?'#aaa':'#888';
  ctx.fillText(ALCHEMY_ELEMENTS[recipe.a].icon + ' ' + ALCHEMY_ELEMENTS[recipe.a].name + ' + ' + ALCHEMY_ELEMENTS[recipe.b].icon + ' ' + ALCHEMY_ELEMENTS[recipe.b].name, 300, 210);
  ctx.fillStyle = dk?'rgba(255,255,255,.08)':'rgba(0,0,0,.04)';
  ctx.fillRect(150, 240, 300, 20);
  ctx.fillStyle = '#FF9800'; ctx.fillRect(150, 240, 300*(recipe.power/100), 20);
  ctx.font = 'bold 12px sans-serif'; ctx.fillStyle = '#fff'; ctx.fillText('위력: ' + recipe.power, 300, 255);
  var state = v22Load('v22_alchemy', {discovered:[]});
  ctx.font = '12px sans-serif'; ctx.fillStyle = dk?'#888':'#aaa';
  ctx.fillText('발견한 레시피: ' + state.discovered.length + '/' + ALCHEMY_RECIPES.length, 300, 310);
}


// ============================================================
// 4. ADVENTURE QUEST BOARD (Canvas 580x360)
// ============================================================
var QUESTS = [
  {name:'별빛 수집',desc:'빛나는 별 10개 수집',reward:50,icon:'⭐',diff:1},
  {name:'몬스터 소탕',desc:'작은 몬스터 5마리 퇴치',reward:80,icon:'👾',diff:2},
  {name:'약초 채집',desc:'치유 약초 8개 채집',reward:40,icon:'🌿',diff:1},
  {name:'보물 탐색',desc:'숨겨진 보물상자 찾기',reward:120,icon:'📦',diff:3},
  {name:'우정 미션',desc:'친구 3명과 대화하기',reward:60,icon:'💕',diff:1},
  {name:'보스 도전',desc:'중간 보스 1마리 처치',reward:150,icon:'🐲',diff:4},
  {name:'퍼즐 해결',desc:'고대 퍼즐 3개 풀기',reward:70,icon:'🧩',diff:2},
  {name:'레이스 우승',desc:'달리기 경주에서 1등',reward:90,icon:'🏃',diff:3},
  {name:'요리 납품',desc:'특별 요리 2개 납품',reward:65,icon:'🍲',diff:2},
  {name:'탐험 일지',desc:'미탐험 구역 3곳 방문',reward:100,icon:'🗺️',diff:3}
];

function openQuestBoard(){
  sfxV22('quest_accept');
  var state = v22Load('v22_quests', {completed:[], totalRewards:0, dailyDone:[]});
  var today = new Date().toDateString();
  if(state.lastDate !== today){ state.dailyDone = []; state.lastDate = today; v22Save('v22_quests', state); }
  var html = '<div style="text-align:center;margin-bottom:12px"><canvas id="v22QuestCanvas" width="580" height="360" style="max-width:100%;border-radius:12px;background:' + (isDarkV22()?'#1a1030':'#F5FFF5') + '"></canvas></div>';
  html += '<div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center" id="v22QuestBtns"></div>';
  html += '<div style="text-align:center;font-size:11px;color:#888;margin-top:8px">누적 보상: ' + state.totalRewards + ' | 완료 퀘스트: ' + state.completed.length + '</div>';
  var modal = createV22Modal('📋 모험 퀘스트 보드', html);
  var btnsDiv = modal.querySelector('#v22QuestBtns');
  QUESTS.forEach(function(q, idx){
    var done = state.dailyDone.indexOf(idx) >= 0;
    var btn = document.createElement('button');
    btn.style.cssText = 'padding:6px 12px;border-radius:10px;border:1px solid ' + (done?'#4CAF50':'rgba(255,95,162,.2)') + ';background:' + (done?'rgba(76,175,80,.1)':'transparent') + ';cursor:pointer;font-size:11px;font-weight:600;color:' + (isDarkV22()?'#eee':'#333');
    btn.textContent = q.icon + ' ' + q.name + (done?' ✓':'');
    btn.disabled = done;
    btn.onclick = function(){
      if(state.dailyDone.indexOf(idx) >= 0) return;
      state.dailyDone.push(idx);
      if(state.completed.indexOf(q.name) === -1) state.completed.push(q.name);
      state.totalRewards += q.reward;
      v22Save('v22_quests', state);
      sfxV22('quest_complete');
      btn.textContent = q.icon + ' ' + q.name + ' ✓';
      btn.style.borderColor = '#4CAF50';
      btn.style.background = 'rgba(76,175,80,.1)';
      btn.disabled = true;
      showToastV22('📋 ' + q.name + ' 완료! +' + q.reward + ' 보상');
      drawQuestBoard(state);
    };
    btnsDiv.appendChild(btn);
  });
  drawQuestBoard(state);
}

function drawQuestBoard(state){
  var c = document.getElementById('v22QuestCanvas'); if(!c) return;
  var ctx = c.getContext('2d'); var dk = isDarkV22();
  ctx.clearRect(0,0,580,360);
  ctx.fillStyle = dk ? '#1a1030' : '#F5FFF5'; ctx.fillRect(0,0,580,360);
  ctx.font = 'bold 14px sans-serif'; ctx.fillStyle = dk ? '#FF8EC4' : '#FF5FA2'; ctx.textAlign = 'center';
  ctx.fillText('📋 오늘의 퀘스트 진행도', 290, 22);
  var doneCount = state.dailyDone ? state.dailyDone.length : 0;
  ctx.fillStyle = dk?'rgba(255,255,255,.06)':'rgba(0,0,0,.04)';
  ctx.fillRect(40, 35, 500, 16);
  ctx.fillStyle = '#4CAF50'; ctx.fillRect(40, 35, 500*(doneCount/QUESTS.length), 16);
  ctx.font = 'bold 10px sans-serif'; ctx.fillStyle = '#fff';
  ctx.fillText(doneCount + '/' + QUESTS.length + ' (' + Math.round(doneCount/QUESTS.length*100) + '%)', 290, 47);
  QUESTS.forEach(function(q, i){
    var x = 20 + (i%2)*285, y = 65 + Math.floor(i/2)*56;
    var done = state.dailyDone && state.dailyDone.indexOf(i) >= 0;
    ctx.fillStyle = done ? (dk?'rgba(76,175,80,.12)':'rgba(76,175,80,.06)') : (dk?'rgba(255,255,255,.04)':'rgba(0,0,0,.02)');
    ctx.beginPath(); ctx.roundRect(x, y, 270, 48, 8); ctx.fill();
    ctx.strokeStyle = done ? '#4CAF50' : (dk?'rgba(255,255,255,.08)':'rgba(0,0,0,.05)');
    ctx.lineWidth = 1; ctx.stroke();
    ctx.font = '18px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(q.icon, x+10, y+30);
    ctx.font = 'bold 12px sans-serif'; ctx.fillStyle = done ? '#4CAF50' : (dk?'#ccc':'#555');
    ctx.fillText(q.name + (done?' ✓':''), x+35, y+20);
    ctx.font = '10px sans-serif'; ctx.fillStyle = dk?'#888':'#aaa';
    ctx.fillText(q.desc, x+35, y+35);
    var stars = '';
    for(var s=0;s<q.diff;s++) stars += '★';
    for(var s=q.diff;s<5;s++) stars += '☆';
    ctx.font = '9px sans-serif'; ctx.fillStyle = '#FFC107'; ctx.textAlign = 'right';
    ctx.fillText(stars + ' +' + q.reward, x+260, y+20);
    ctx.textAlign = 'left';
  });
}


// ============================================================
// 5. CHARACTER GROWTH CURVE (Canvas 600x380)
// ============================================================
var GROWTH_STATS = ['HP','공격','방어','속도','마법','운'];
var GROWTH_COLORS = ['#F44336','#FF9800','#2196F3','#4CAF50','#9C27B0','#FFC107'];
var GROWTH_CHARS = [
  {name:'로미',base:[40,30,25,35,20,30]},
  {name:'하츄핑',base:[35,25,20,30,40,35]},
  {name:'바로핑',base:[30,35,40,20,25,25]},
  {name:'아자핑',base:[45,40,30,25,15,20]}
];

function openGrowthCurve(){
  sfxV22('growth_up');
  var state = v22Load('v22_growth', {selectedChar:0,level:1});
  var html = '<div style="text-align:center;margin-bottom:12px"><canvas id="v22GrowthCanvas" width="600" height="380" style="max-width:100%;border-radius:12px;background:' + (isDarkV22()?'#1a1030':'#F8F0FF') + '"></canvas></div>';
  html += '<div style="display:flex;gap:8px;justify-content:center;margin-bottom:8px" id="v22GrowthCharBtns"></div>';
  html += '<div style="text-align:center"><input type="range" id="v22GrowthSlider" min="1" max="30" value="' + state.level + '" style="width:80%"><div id="v22GrowthLevel" style="font-size:12px;color:#888">Lv.' + state.level + '</div></div>';
  var modal = createV22Modal('📈 캐릭터 성장 곡선', html);
  var btnsDiv = modal.querySelector('#v22GrowthCharBtns');
  GROWTH_CHARS.forEach(function(ch, idx){
    var btn = document.createElement('button');
    btn.style.cssText = 'padding:8px 16px;border-radius:12px;border:2px solid ' + (idx===state.selectedChar?'#FF5FA2':'rgba(255,95,162,.2)') + ';background:' + (idx===state.selectedChar?'rgba(255,95,162,.1)':'transparent') + ';cursor:pointer;font-size:13px;font-weight:700;color:' + (isDarkV22()?'#eee':'#333');
    btn.textContent = ch.name;
    btn.onclick = function(){
      state.selectedChar = idx;
      v22Save('v22_growth', state);
      btnsDiv.querySelectorAll('button').forEach(function(b,j){
        b.style.borderColor = j===idx?'#FF5FA2':'rgba(255,95,162,.2)';
        b.style.background = j===idx?'rgba(255,95,162,.1)':'transparent';
      });
      sfxV22('growth_up');
      drawGrowthCurve(state);
    };
    btnsDiv.appendChild(btn);
  });
  modal.querySelector('#v22GrowthSlider').oninput = function(){
    state.level = parseInt(this.value);
    v22Save('v22_growth', state);
    modal.querySelector('#v22GrowthLevel').textContent = 'Lv.' + state.level;
    drawGrowthCurve(state);
  };
  drawGrowthCurve(state);
}

function drawGrowthCurve(state){
  var c = document.getElementById('v22GrowthCanvas'); if(!c) return;
  var ctx = c.getContext('2d'); var dk = isDarkV22();
  ctx.clearRect(0,0,600,380);
  ctx.fillStyle = dk ? '#1a1030' : '#F8F0FF'; ctx.fillRect(0,0,600,380);
  var ch = GROWTH_CHARS[state.selectedChar];
  ctx.font = 'bold 14px sans-serif'; ctx.fillStyle = dk ? '#FF8EC4' : '#FF5FA2'; ctx.textAlign = 'center';
  ctx.fillText('📈 ' + ch.name + ' 성장 곡선 (Lv.1~30)', 300, 22);
  var left = 60, top = 40, w = 500, h = 260;
  ctx.strokeStyle = dk?'rgba(255,255,255,.08)':'rgba(0,0,0,.06)'; ctx.lineWidth = 1;
  for(var g=0;g<=5;g++){
    var y = top + h - (g/5)*h;
    ctx.beginPath(); ctx.moveTo(left,y); ctx.lineTo(left+w,y); ctx.stroke();
    ctx.font = '9px sans-serif'; ctx.fillStyle = dk?'#666':'#bbb'; ctx.textAlign = 'right';
    ctx.fillText(Math.round(g*40), left-5, y+3);
  }
  for(var lv=1;lv<=30;lv+=5){
    var x = left + ((lv-1)/29)*w;
    ctx.beginPath(); ctx.moveTo(x,top); ctx.lineTo(x,top+h); ctx.stroke();
    ctx.font = '9px sans-serif'; ctx.fillStyle = dk?'#666':'#bbb'; ctx.textAlign = 'center';
    ctx.fillText('Lv.'+lv, x, top+h+14);
  }
  GROWTH_STATS.forEach(function(stat, si){
    ctx.beginPath(); ctx.strokeStyle = GROWTH_COLORS[si]; ctx.lineWidth = 2;
    for(var lv=1;lv<=30;lv++){
      var val = ch.base[si] + (lv-1) * (2 + si*0.3 + Math.sin(lv*0.2+si)*2);
      val = Math.min(val, 200);
      var x = left + ((lv-1)/29)*w;
      var y = top + h - (val/200)*h;
      if(lv===1) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    }
    ctx.stroke();
  });
  var curLv = state.level;
  var curX = left + ((curLv-1)/29)*w;
  ctx.strokeStyle = '#FF5FA2'; ctx.lineWidth = 2; ctx.setLineDash([4,4]);
  ctx.beginPath(); ctx.moveTo(curX,top); ctx.lineTo(curX,top+h); ctx.stroke();
  ctx.setLineDash([]);
  ctx.font = 'bold 10px sans-serif'; ctx.fillStyle = '#FF5FA2'; ctx.textAlign = 'center';
  ctx.fillText('Lv.'+curLv, curX, top-5);
  var legendY = top + h + 28;
  GROWTH_STATS.forEach(function(stat, si){
    var lx = 60 + si*90;
    ctx.fillStyle = GROWTH_COLORS[si]; ctx.fillRect(lx, legendY, 10, 10);
    ctx.font = '10px sans-serif'; ctx.fillStyle = dk?'#aaa':'#777'; ctx.textAlign = 'left';
    var val = Math.round(ch.base[si] + (curLv-1)*(2+si*0.3+Math.sin(curLv*0.2+si)*2));
    ctx.fillText(stat + ':' + Math.min(val,200), lx+14, legendY+9);
  });
}


// ============================================================
// 6. BOSS STRATEGY GUIDE (Canvas 580x380)
// ============================================================
var BOSSES = [
  {name:'그림자왕',icon:'👤',stats:[90,70,40,60,80,75]},
  {name:'폭풍마녀',icon:'🌪️',stats:[65,50,85,90,95,45]},
  {name:'얼음거인',icon:'🧊',stats:[80,95,30,40,70,55]},
  {name:'불꽃드래곤',icon:'🐉',stats:[95,60,55,70,85,40]},
  {name:'어둠기사',icon:'⚔️',stats:[85,85,65,55,60,60]},
  {name:'독안개요정',icon:'🧚',stats:[50,40,90,95,75,80]},
  {name:'시간수호자',icon:'⏰',stats:[70,75,70,80,90,70]},
  {name:'최종보스절망',icon:'💀',stats:[95,90,80,75,95,85]}
];
var BOSS_AXES = ['공격력','방어력','마법력','속도','특수기','약점노출'];

function openBossGuide(){
  sfxV22('boss_scan');
  var state = v22Load('v22_boss', {selectedBoss:0,analyzed:[]});
  var html = '<div style="text-align:center;margin-bottom:12px"><canvas id="v22BossCanvas" width="580" height="380" style="max-width:100%;border-radius:12px;background:' + (isDarkV22()?'#1a1030':'#FFF0F0') + '"></canvas></div>';
  html += '<div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin-bottom:8px" id="v22BossBtns"></div>';
  html += '<div style="text-align:center"><button id="v22BossAnalyze" style="padding:10px 28px;border-radius:14px;border:none;background:linear-gradient(135deg,#F44336,#E91E63);color:#fff;font-weight:700;font-size:14px;cursor:pointer">약점 분석</button></div>';
  html += '<div id="v22BossInfo" style="text-align:center;font-size:12px;color:#888;min-height:24px;margin-top:6px">분석 완료: ' + state.analyzed.length + '/' + BOSSES.length + '</div>';
  var modal = createV22Modal('📖 보스 공략 가이드북', html);
  var btnsDiv = modal.querySelector('#v22BossBtns');
  BOSSES.forEach(function(b, idx){
    var btn = document.createElement('button');
    var analyzed = state.analyzed.indexOf(idx) >= 0;
    btn.style.cssText = 'padding:6px 12px;border-radius:10px;border:1px solid ' + (idx===state.selectedBoss?'#F44336':'rgba(244,67,54,.2)') + ';background:' + (analyzed?'rgba(76,175,80,.1)':'transparent') + ';cursor:pointer;font-size:12px;font-weight:600;color:' + (isDarkV22()?'#eee':'#333');
    btn.textContent = b.icon + ' ' + b.name + (analyzed?' ✓':'');
    btn.onclick = function(){
      state.selectedBoss = idx;
      v22Save('v22_boss', state);
      btnsDiv.querySelectorAll('button').forEach(function(bb,j){ bb.style.borderColor = j===idx?'#F44336':'rgba(244,67,54,.2)'; });
      sfxV22('boss_scan');
      drawBossRadar(state);
    };
    btnsDiv.appendChild(btn);
  });
  modal.querySelector('#v22BossAnalyze').onclick = function(){
    if(state.analyzed.indexOf(state.selectedBoss) === -1){
      state.analyzed.push(state.selectedBoss);
      v22Save('v22_boss', state);
      sfxV22('boss_scan');
      showToastV22('📖 ' + BOSSES[state.selectedBoss].name + ' 약점 분석 완료!');
      btnsDiv.querySelectorAll('button')[state.selectedBoss].textContent = BOSSES[state.selectedBoss].icon + ' ' + BOSSES[state.selectedBoss].name + ' ✓';
      btnsDiv.querySelectorAll('button')[state.selectedBoss].style.background = 'rgba(76,175,80,.1)';
      modal.querySelector('#v22BossInfo').textContent = '분석 완료: ' + state.analyzed.length + '/' + BOSSES.length;
    }
    drawBossRadar(state);
  };
  drawBossRadar(state);
}

function drawBossRadar(state){
  var c = document.getElementById('v22BossCanvas'); if(!c) return;
  var ctx = c.getContext('2d'); var dk = isDarkV22();
  ctx.clearRect(0,0,580,380);
  ctx.fillStyle = dk ? '#1a1030' : '#FFF0F0'; ctx.fillRect(0,0,580,380);
  var boss = BOSSES[state.selectedBoss];
  var analyzed = state.analyzed.indexOf(state.selectedBoss) >= 0;
  ctx.font = 'bold 14px sans-serif'; ctx.fillStyle = dk ? '#FF8EC4' : '#FF5FA2'; ctx.textAlign = 'center';
  ctx.fillText('📖 ' + boss.icon + ' ' + boss.name + (analyzed?' (분석완료)':' (미분석)'), 290, 22);
  var cx = 200, cy = 210, r = 130;
  for(var ring=1;ring<=5;ring++){
    ctx.beginPath();
    for(var i=0;i<6;i++){
      var a = (i/6)*Math.PI*2 - Math.PI/2;
      var x = cx + Math.cos(a)*r*(ring/5), y = cy + Math.sin(a)*r*(ring/5);
      if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    }
    ctx.closePath(); ctx.strokeStyle = dk?'rgba(255,255,255,.08)':'rgba(0,0,0,.06)'; ctx.lineWidth = 1; ctx.stroke();
  }
  for(var i=0;i<6;i++){
    var a = (i/6)*Math.PI*2 - Math.PI/2;
    ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r); ctx.stroke();
    ctx.font = '11px sans-serif'; ctx.fillStyle = dk?'#aaa':'#777';
    ctx.fillText(BOSS_AXES[i], cx+Math.cos(a)*(r+18), cy+Math.sin(a)*(r+18));
  }
  if(analyzed){
    ctx.beginPath();
    for(var i=0;i<6;i++){
      var a = (i/6)*Math.PI*2 - Math.PI/2;
      var v = boss.stats[i]/100;
      var x = cx + Math.cos(a)*r*v, y = cy + Math.sin(a)*r*v;
      if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    }
    ctx.closePath(); ctx.fillStyle = 'rgba(244,67,54,.15)'; ctx.fill();
    ctx.strokeStyle = '#F44336'; ctx.lineWidth = 2; ctx.stroke();
    var weakIdx = 0, weakVal = 100;
    boss.stats.forEach(function(s,i){ if(s < weakVal){ weakVal = s; weakIdx = i; }});
    var rx = 420, ry = 60;
    ctx.font = 'bold 13px sans-serif'; ctx.fillStyle = dk?'#ccc':'#555'; ctx.textAlign = 'left';
    ctx.fillText('스탯 분석:', rx, ry);
    boss.stats.forEach(function(s, i){
      var by = ry + 20 + i*28;
      ctx.font = '11px sans-serif'; ctx.fillStyle = dk?'#aaa':'#777'; ctx.textAlign = 'left';
      ctx.fillText(BOSS_AXES[i], rx, by);
      ctx.fillStyle = dk?'rgba(255,255,255,.06)':'rgba(0,0,0,.04)';
      ctx.fillRect(rx+65, by-10, 100, 12);
      ctx.fillStyle = i===weakIdx ? '#4CAF50' : '#F44336';
      ctx.fillRect(rx+65, by-10, s, 12);
      ctx.font = '10px sans-serif'; ctx.fillStyle = dk?'#ccc':'#555'; ctx.textAlign = 'left';
      ctx.fillText(s, rx+170, by);
    });
    ctx.font = 'bold 12px sans-serif'; ctx.fillStyle = '#4CAF50';
    ctx.fillText('★ 약점: ' + BOSS_AXES[weakIdx] + ' (' + weakVal + ')', rx, ry + 200);
    var recTactic = weakIdx < 2 ? '마법포격' : (weakIdx < 4 ? '돌격전법' : '기습작전');
    ctx.font = '11px sans-serif'; ctx.fillStyle = '#FF9800';
    ctx.fillText('추천전술: ' + recTactic, rx, ry + 220);
  } else {
    ctx.font = '16px sans-serif'; ctx.fillStyle = dk?'#666':'#bbb'; ctx.textAlign = 'center';
    ctx.fillText('분석 버튼을 눌러 약점을 파악하세요', 290, 370);
  }
}


// ============================================================
// 7. TEAM COMPOSITION OPTIMIZER (Canvas 620x400)
// ============================================================
var TEAM_CHARS = [
  {name:'로미',role:'리더',icon:'👧',atk:70,def:60,mag:50,spd:75,sup:80},
  {name:'하츄핑',role:'마법사',icon:'💖',atk:50,def:40,mag:95,spd:65,sup:90},
  {name:'바로핑',role:'탱커',icon:'⚖️',atk:55,def:95,mag:40,spd:35,sup:60},
  {name:'아자핑',role:'전사',icon:'💪',atk:90,def:70,mag:30,spd:60,sup:45},
  {name:'차차핑',role:'서포터',icon:'💃',atk:35,def:50,mag:70,spd:90,sup:95},
  {name:'해필핑',role:'힐러',icon:'😊',atk:30,def:55,mag:85,spd:50,sup:85},
  {name:'라라핑',role:'버퍼',icon:'🎵',atk:45,def:45,mag:75,spd:70,sup:90},
  {name:'키키핑',role:'어쌔신',icon:'😈',atk:85,def:25,mag:55,spd:95,sup:30},
  {name:'무무핑',role:'수호자',icon:'🛡️',atk:40,def:90,mag:35,spd:30,sup:70},
  {name:'또또핑',role:'예언자',icon:'🔮',atk:55,def:45,mag:90,spd:55,sup:75},
  {name:'시러핑',role:'냉기사',icon:'❄️',atk:75,def:65,mag:80,spd:45,sup:40},
  {name:'오로라핑',role:'성기사',icon:'🌈',atk:65,def:75,mag:70,spd:60,sup:65}
];
var TEAM_SYNERGY = {
  '로미+하츄핑':15,'로미+차차핑':10,'하츄핑+해필핑':12,'바로핑+무무핑':18,
  '아자핑+키키핑':14,'차차핑+라라핑':16,'또또핑+시러핑':11,'오로라핑+해필핑':13,
  '로미+아자핑':8,'하츄핑+또또핑':15,'바로핑+아자핑':10,'키키핑+시러핑':12
};

function openTeamOptimizer(){
  sfxV22('team_sync');
  var state = v22Load('v22_team', {party:[0,1,2,3]});
  var html = '<div style="text-align:center;margin-bottom:12px"><canvas id="v22TeamCanvas" width="620" height="400" style="max-width:100%;border-radius:12px;background:' + (isDarkV22()?'#1a1030':'#F0F0FF') + '"></canvas></div>';
  html += '<div style="display:flex;flex-wrap:wrap;gap:4px;justify-content:center;margin-bottom:8px" id="v22TeamBtns"></div>';
  html += '<div style="text-align:center"><button id="v22TeamAuto" style="padding:8px 20px;border-radius:12px;border:none;background:linear-gradient(135deg,#4CAF50,#66BB6A);color:#fff;font-weight:700;font-size:13px;cursor:pointer;margin:0 4px">자동 최적화</button>';
  html += '<button id="v22TeamReset" style="padding:8px 20px;border-radius:12px;border:none;background:linear-gradient(135deg,#78909C,#546E7A);color:#fff;font-weight:700;font-size:13px;cursor:pointer;margin:0 4px">초기화</button></div>';
  var modal = createV22Modal('🎯 팀 편성 최적화기', html);
  var btnsDiv = modal.querySelector('#v22TeamBtns');
  TEAM_CHARS.forEach(function(ch, idx){
    var inParty = state.party.indexOf(idx) >= 0;
    var btn = document.createElement('button');
    btn.style.cssText = 'padding:5px 10px;border-radius:8px;border:1px solid ' + (inParty?'#4CAF50':'rgba(0,0,0,.1)') + ';background:' + (inParty?'rgba(76,175,80,.1)':'transparent') + ';cursor:pointer;font-size:11px;font-weight:600;color:' + (isDarkV22()?'#eee':'#333');
    btn.textContent = ch.icon + ch.name;
    btn.onclick = function(){
      var pi = state.party.indexOf(idx);
      if(pi >= 0){ state.party.splice(pi, 1); }
      else if(state.party.length < 4){ state.party.push(idx); }
      v22Save('v22_team', state);
      sfxV22('team_sync');
      btnsDiv.querySelectorAll('button').forEach(function(b,j){
        var inp = state.party.indexOf(j) >= 0;
        b.style.borderColor = inp?'#4CAF50':'rgba(0,0,0,.1)';
        b.style.background = inp?'rgba(76,175,80,.1)':'transparent';
      });
      drawTeamComp(state);
    };
    btnsDiv.appendChild(btn);
  });
  modal.querySelector('#v22TeamAuto').onclick = function(){
    state.party = [0,1,5,3];
    v22Save('v22_team', state);
    sfxV22('team_sync');
    btnsDiv.querySelectorAll('button').forEach(function(b,j){
      var inp = state.party.indexOf(j) >= 0;
      b.style.borderColor = inp?'#4CAF50':'rgba(0,0,0,.1)';
      b.style.background = inp?'rgba(76,175,80,.1)':'transparent';
    });
    showToastV22('🎯 최적 파티 자동 편성!');
    drawTeamComp(state);
  };
  modal.querySelector('#v22TeamReset').onclick = function(){
    state.party = []; v22Save('v22_team', state);
    btnsDiv.querySelectorAll('button').forEach(function(b){
      b.style.borderColor = 'rgba(0,0,0,.1)'; b.style.background = 'transparent';
    });
    drawTeamComp(state);
  };
  drawTeamComp(state);
}

function drawTeamComp(state){
  var c = document.getElementById('v22TeamCanvas'); if(!c) return;
  var ctx = c.getContext('2d'); var dk = isDarkV22();
  ctx.clearRect(0,0,620,400);
  ctx.fillStyle = dk ? '#1a1030' : '#F0F0FF'; ctx.fillRect(0,0,620,400);
  ctx.font = 'bold 14px sans-serif'; ctx.fillStyle = dk ? '#FF8EC4' : '#FF5FA2'; ctx.textAlign = 'center';
  ctx.fillText('🎯 파티 편성 (' + state.party.length + '/4)', 310, 22);
  if(state.party.length === 0){
    ctx.font = '14px sans-serif'; ctx.fillStyle = dk?'#666':'#bbb';
    ctx.fillText('캐릭터를 선택하여 파티를 구성하세요', 310, 200);
    return;
  }
  var statNames = ['공격','방어','마법','속도','지원'];
  var statColors = ['#F44336','#2196F3','#9C27B0','#4CAF50','#FF9800'];
  state.party.forEach(function(ci, pi){
    var ch = TEAM_CHARS[ci];
    var x = 20 + pi*155, y = 40;
    ctx.fillStyle = dk?'rgba(255,255,255,.06)':'rgba(0,0,0,.03)';
    ctx.beginPath(); ctx.roundRect(x, y, 140, 160, 10); ctx.fill();
    ctx.font = '24px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(ch.icon, x+70, y+35);
    ctx.font = 'bold 12px sans-serif'; ctx.fillStyle = dk?'#ccc':'#555';
    ctx.fillText(ch.name, x+70, y+55);
    ctx.font = '10px sans-serif'; ctx.fillStyle = dk?'#888':'#aaa';
    ctx.fillText(ch.role, x+70, y+70);
    var vals = [ch.atk,ch.def,ch.mag,ch.spd,ch.sup];
    vals.forEach(function(v, si){
      var by = y + 80 + si*14;
      ctx.fillStyle = dk?'rgba(255,255,255,.06)':'rgba(0,0,0,.04)';
      ctx.fillRect(x+10, by, 80, 8);
      ctx.fillStyle = statColors[si]; ctx.fillRect(x+10, by, 80*(v/100), 8);
      ctx.font = '8px sans-serif'; ctx.fillStyle = dk?'#aaa':'#888'; ctx.textAlign = 'left';
      ctx.fillText(statNames[si], x+95, by+7);
    });
  });
  if(state.party.length >= 2){
    var totalSynergy = 0;
    var synergyList = [];
    for(var i=0;i<state.party.length;i++){
      for(var j=i+1;j<state.party.length;j++){
        var a = TEAM_CHARS[state.party[i]].name, b = TEAM_CHARS[state.party[j]].name;
        var key1 = a+'+'+b, key2 = b+'+'+a;
        var syn = TEAM_SYNERGY[key1] || TEAM_SYNERGY[key2] || 0;
        if(syn > 0){ totalSynergy += syn; synergyList.push(a+'×'+b+': +'+syn); }
      }
    }
    var avgAtk = 0, avgDef = 0, avgMag = 0, avgSpd = 0, avgSup = 0;
    state.party.forEach(function(ci){
      var ch = TEAM_CHARS[ci];
      avgAtk += ch.atk; avgDef += ch.def; avgMag += ch.mag; avgSpd += ch.spd; avgSup += ch.sup;
    });
    var n = state.party.length;
    avgAtk = Math.round(avgAtk/n); avgDef = Math.round(avgDef/n); avgMag = Math.round(avgMag/n); avgSpd = Math.round(avgSpd/n); avgSup = Math.round(avgSup/n);
    var total = avgAtk+avgDef+avgMag+avgSpd+avgSup+totalSynergy;
    var grade = total >= 400 ? 'S' : total >= 320 ? 'A' : total >= 240 ? 'B' : total >= 160 ? 'C' : 'D';
    var gradeColor = {S:'#FFD700',A:'#4CAF50',B:'#2196F3',C:'#FF9800',D:'#F44336'};
    ctx.font = 'bold 13px sans-serif'; ctx.fillStyle = dk?'#ccc':'#555'; ctx.textAlign = 'left';
    ctx.fillText('팀 종합:', 30, 230);
    var teamStats = [{n:'공격',v:avgAtk},{n:'방어',v:avgDef},{n:'마법',v:avgMag},{n:'속도',v:avgSpd},{n:'지원',v:avgSup}];
    teamStats.forEach(function(ts, si){
      var by = 245 + si*22;
      ctx.font = '11px sans-serif'; ctx.fillStyle = dk?'#aaa':'#777'; ctx.textAlign = 'left';
      ctx.fillText(ts.n, 30, by+8);
      ctx.fillStyle = dk?'rgba(255,255,255,.06)':'rgba(0,0,0,.04)';
      ctx.fillRect(80, by, 200, 12);
      ctx.fillStyle = statColors[si]; ctx.fillRect(80, by, 200*(ts.v/100), 12);
      ctx.font = '10px sans-serif'; ctx.fillStyle = dk?'#ccc':'#555'; ctx.textAlign = 'left';
      ctx.fillText(ts.v, 285, by+10);
    });
    ctx.font = 'bold 13px sans-serif'; ctx.fillStyle = dk?'#ccc':'#555'; ctx.textAlign = 'left';
    ctx.fillText('시너지:', 350, 230);
    if(synergyList.length > 0){
      synergyList.forEach(function(s, i){
        ctx.font = '11px sans-serif'; ctx.fillStyle = '#4CAF50';
        ctx.fillText(s, 350, 248 + i*16);
      });
    } else {
      ctx.font = '11px sans-serif'; ctx.fillStyle = dk?'#666':'#bbb';
      ctx.fillText('시너지 없음', 350, 248);
    }
    ctx.font = 'bold 20px sans-serif'; ctx.fillStyle = gradeColor[grade]; ctx.textAlign = 'center';
    ctx.fillText(grade + '등급', 500, 360);
    ctx.font = '12px sans-serif'; ctx.fillStyle = dk?'#aaa':'#888';
    ctx.fillText('총점: ' + total + ' (시너지 +' + totalSynergy + ')', 500, 380);
  }
}


// ============================================================
// 8. ADVENTURE ACHIEVEMENT TIMELINE (Canvas 600x360)
// ============================================================
var TIMELINE_EVENTS = [
  {day:1,title:'첫 모험 시작',icon:'🌟',type:'milestone'},
  {day:3,title:'하츄핑과 만남',icon:'💖',type:'story'},
  {day:5,title:'첫 보스 처치',icon:'🐉',type:'battle'},
  {day:7,title:'바로핑 합류',icon:'⚖️',type:'story'},
  {day:10,title:'숲의 시련 통과',icon:'🌳',type:'milestone'},
  {day:12,title:'마법 각성',icon:'✨',type:'skill'},
  {day:15,title:'중간 보스 격파',icon:'👿',type:'battle'},
  {day:18,title:'아자핑 합류',icon:'💪',type:'story'},
  {day:20,title:'전설 무기 획득',icon:'⚔️',type:'item'},
  {day:22,title:'차차핑 합류',icon:'💃',type:'story'},
  {day:25,title:'마왕성 도달',icon:'🏰',type:'milestone'},
  {day:28,title:'최종 전투 승리',icon:'🏆',type:'battle'},
  {day:30,title:'평화 달성',icon:'🌈',type:'milestone'}
];

function openTimeline(){
  sfxV22('timeline_tick');
  var state = v22Load('v22_timeline', {currentDay:1,unlocked:['첫 모험 시작']});
  var html = '<div style="text-align:center;margin-bottom:12px"><canvas id="v22TimelineCanvas" width="600" height="360" style="max-width:100%;border-radius:12px;background:' + (isDarkV22()?'#1a1030':'#FFFFF0') + '"></canvas></div>';
  html += '<div style="text-align:center;margin-bottom:8px"><button id="v22TimeAdv" style="padding:10px 28px;border-radius:14px;border:none;background:linear-gradient(135deg,#FF9800,#FFC107);color:#fff;font-weight:700;font-size:14px;cursor:pointer;margin:0 4px">모험 진행 (+1일)</button>';
  html += '<button id="v22TimeReset" style="padding:10px 28px;border-radius:14px;border:none;background:linear-gradient(135deg,#78909C,#546E7A);color:#fff;font-weight:700;font-size:14px;cursor:pointer;margin:0 4px">처음부터</button></div>';
  html += '<div id="v22TimeInfo" style="text-align:center;font-size:12px;color:#888;min-height:24px">현재: ' + state.currentDay + '일차 | 해금: ' + state.unlocked.length + '/' + TIMELINE_EVENTS.length + '</div>';
  var modal = createV22Modal('📅 모험 성과 타임라인', html);
  modal.querySelector('#v22TimeAdv').onclick = function(){
    if(state.currentDay < 30){
      state.currentDay++;
      TIMELINE_EVENTS.forEach(function(ev){
        if(ev.day <= state.currentDay && state.unlocked.indexOf(ev.title) === -1){
          state.unlocked.push(ev.title);
          showToastV22(ev.icon + ' ' + ev.title + ' 달성!');
        }
      });
      v22Save('v22_timeline', state);
      sfxV22('timeline_tick');
      modal.querySelector('#v22TimeInfo').textContent = '현재: ' + state.currentDay + '일차 | 해금: ' + state.unlocked.length + '/' + TIMELINE_EVENTS.length;
      drawTimeline(state);
    }
  };
  modal.querySelector('#v22TimeReset').onclick = function(){
    state = {currentDay:1,unlocked:['첫 모험 시작']};
    v22Save('v22_timeline', state);
    modal.querySelector('#v22TimeInfo').textContent = '현재: 1일차 | 해금: 1/' + TIMELINE_EVENTS.length;
    drawTimeline(state);
  };
  drawTimeline(state);
}

function drawTimeline(state){
  var c = document.getElementById('v22TimelineCanvas'); if(!c) return;
  var ctx = c.getContext('2d'); var dk = isDarkV22();
  ctx.clearRect(0,0,600,360);
  ctx.fillStyle = dk ? '#1a1030' : '#FFFFF0'; ctx.fillRect(0,0,600,360);
  ctx.font = 'bold 14px sans-serif'; ctx.fillStyle = dk ? '#FF8EC4' : '#FF5FA2'; ctx.textAlign = 'center';
  ctx.fillText('📅 모험 타임라인 (Day ' + state.currentDay + '/30)', 300, 22);
  var lineY = 180;
  ctx.strokeStyle = dk?'rgba(255,255,255,.15)':'rgba(0,0,0,.1)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(30, lineY); ctx.lineTo(570, lineY); ctx.stroke();
  ctx.fillStyle = '#FF5FA2';
  ctx.fillRect(30, lineY-1.5, 540*(state.currentDay/30), 3);
  var typeColors = {milestone:'#FFD700',story:'#FF5FA2',battle:'#F44336',skill:'#9C27B0',item:'#4CAF50'};
  TIMELINE_EVENTS.forEach(function(ev, i){
    var x = 30 + (ev.day/30)*540;
    var unlocked = state.unlocked.indexOf(ev.title) >= 0;
    var above = i % 2 === 0;
    var dotY = lineY;
    ctx.beginPath();
    ctx.arc(x, dotY, unlocked ? 10 : 6, 0, Math.PI*2);
    ctx.fillStyle = unlocked ? (typeColors[ev.type]||'#888') : (dk?'rgba(255,255,255,.1)':'rgba(0,0,0,.06)');
    ctx.fill();
    if(unlocked){
      ctx.strokeStyle = typeColors[ev.type]||'#888'; ctx.lineWidth = 2; ctx.stroke();
    }
    var textY = above ? dotY - 20 : dotY + 30;
    var lineFromDot = above ? dotY - 12 : dotY + 12;
    var lineToText = above ? textY + 6 : textY - 12;
    ctx.strokeStyle = dk?'rgba(255,255,255,.1)':'rgba(0,0,0,.05)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x, lineFromDot); ctx.lineTo(x, lineToText); ctx.stroke();
    if(unlocked){
      ctx.font = '14px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(ev.icon, x, above ? textY - 4 : textY + 14);
      ctx.font = '9px sans-serif'; ctx.fillStyle = dk?'#ccc':'#555';
      ctx.fillText(ev.title, x, above ? textY - 16 : textY + 28);
    } else {
      ctx.font = '10px sans-serif'; ctx.fillStyle = dk?'#444':'#ccc'; ctx.textAlign = 'center';
      ctx.fillText('???', x, above ? textY : textY + 14);
    }
    ctx.font = '8px sans-serif'; ctx.fillStyle = dk?'#555':'#bbb'; ctx.textAlign = 'center';
    ctx.fillText('Day'+ev.day, x, lineY + (above?16:-10));
  });
  var legendY = 330;
  var types = [{t:'milestone',n:'마일스톤'},{t:'story',n:'스토리'},{t:'battle',n:'전투'},{t:'skill',n:'스킬'},{t:'item',n:'아이템'}];
  types.forEach(function(tp, i){
    var lx = 80 + i*110;
    ctx.fillStyle = typeColors[tp.t]; ctx.beginPath(); ctx.arc(lx, legendY, 5, 0, Math.PI*2); ctx.fill();
    ctx.font = '10px sans-serif'; ctx.fillStyle = dk?'#aaa':'#777'; ctx.textAlign = 'left';
    ctx.fillText(tp.n, lx+10, legendY+4);
  });
}


// ============================================================
// QUIZ V22 (+15 questions, 195->210)
// ============================================================
function injectExtraQuizV22(){
  if(!window.quizPool && !window.QUIZ_POOL) return;
  var pool = window.quizPool || window.QUIZ_POOL;
  var newQ = [
    {q:'우정 네트워크에서 12캐릭터의 배치 형태는?',a:['직선','원형','격자','무작위'],c:1},
    {q:'전투 전략 시뮬레이터의 전술 수는?',a:['4','6','8','10'],c:2},
    {q:'마법 합성에서 불+물의 결과물은?',a:['용암','증기','태풍','진흙'],c:1},
    {q:'마법 합성의 총 레시피 수는?',a:['10','12','15','20'],c:2},
    {q:'퀘스트 보드의 총 퀘스트 수는?',a:['5','8','10','12'],c:2},
    {q:'캐릭터 성장 곡선의 최대 레벨은?',a:['20','25','30','50'],c:2},
    {q:'보스 공략 가이드의 보스 수는?',a:['4','6','8','10'],c:2},
    {q:'팀 편성의 최대 파티 인원은?',a:['3','4','5','6'],c:1},
    {q:'팀 시너지 등급 S의 기준 총점은?',a:['300','350','400','450'],c:2},
    {q:'모험 타임라인의 총 기간은?',a:['15일','20일','30일','60일'],c:2},
    {q:'최종보스절망의 공격력 스탯은?',a:['80','85','90','95'],c:3},
    {q:'빛+어둠 합성의 결과는?',a:['무지개','보석','황혼','오로라'],c:2},
    {q:'팀 편성에서 로미의 역할은?',a:['마법사','전사','리더','힐러'],c:2},
    {q:'퀘스트 보스 도전의 보상 포인트는?',a:['100','120','150','200'],c:2},
    {q:'v22에서 추가된 총 업적 수는?',a:['8','10','12','15'],c:2}
  ];
  newQ.forEach(function(q){
    var exists = false;
    for(var i=0;i<pool.length;i++){
      if(pool[i].q === q.q){ exists = true; break; }
    }
    if(!exists) pool.push(q);
  });
}


// ============================================================
// ACHIEVEMENTS (+12, total 202)
// ============================================================
function injectV22Achievements(){
  if(!window.AD) return;
  var newAch = [
    {id:'a_v22_friend_net',name:'우정 마스터',desc:'우정 강화 5회 수행',cat:'general',icon:'💞'},
    {id:'a_v22_tactic_win',name:'전략가',desc:'전술 대결 5회 승리',cat:'general',icon:'⚔️'},
    {id:'a_v22_alchemy_5',name:'연금술사',desc:'합성 레시피 5개 발견',cat:'general',icon:'⚗️'},
    {id:'a_v22_quest_all',name:'퀘스트 완주',desc:'일일 퀘스트 전부 완료',cat:'general',icon:'📋'},
    {id:'a_v22_growth_max',name:'만렙 도달',desc:'성장곡선 Lv.30 확인',cat:'general',icon:'📈'},
    {id:'a_v22_boss_all',name:'보스 분석가',desc:'모든 보스 분석 완료',cat:'general',icon:'📖'},
    {id:'a_v22_team_s',name:'최강 팀',desc:'팀 S등급 달성',cat:'general',icon:'🎯'},
    {id:'a_v22_timeline_end',name:'대장정 완료',desc:'타임라인 30일 완주',cat:'general',icon:'📅'},
    {id:'a_v22_quiz_clear',name:'퀴즈 v22',desc:'v22 퀴즈 정답 경험',cat:'general',icon:'❓'},
    {id:'a_v22_quiz_s',name:'퀴즈 천재 v22',desc:'퀴즈 S등급 달성',cat:'general',icon:'🏅'},
    {id:'a_v22_explorer',name:'v22 탐험가',desc:'v22 기능 4개 이상 사용',cat:'general',icon:'🗺️'},
    {id:'a_v22_complete',name:'v22 컴플리트',desc:'v22 모든 기능 체험',cat:'general',icon:'🌟'}
  ];

  newAch.forEach(function(a){
    var exists = false;
    for(var i=0;i<window.AD.length;i++){
      if(window.AD[i].id === a.id){ exists = true; break; }
    }
    if(!exists) window.AD.push(a);
  });
}


// ============================================================
// CHECK AND AWARD ACHIEVEMENTS
// ============================================================
function checkAndAwardV22(){
  var friend = v22Load('v22_friend', {boosts:0});
  var tactics = v22Load('v22_tactics', {wins:0});
  var alchemy = v22Load('v22_alchemy', {discovered:[]});
  var quests = v22Load('v22_quests', {completed:[],dailyDone:[]});
  var growth = v22Load('v22_growth', {level:1});
  var boss = v22Load('v22_boss', {analyzed:[]});
  var team = v22Load('v22_team', {party:[]});
  var timeline = v22Load('v22_timeline', {currentDay:1});

  var featuresUsed = 0;
  if(friend.boosts > 0) featuresUsed++;
  if(tactics.wins > 0) featuresUsed++;
  if(alchemy.discovered && alchemy.discovered.length > 0) featuresUsed++;
  if(quests.completed && quests.completed.length > 0) featuresUsed++;
  if(growth.level > 1) featuresUsed++;
  if(boss.analyzed && boss.analyzed.length > 0) featuresUsed++;
  if(team.party && team.party.length > 0) featuresUsed++;
  if(timeline.currentDay > 1) featuresUsed++;

  var checks = [
    {id:'a_v22_friend_net', cond: friend.boosts >= 5},
    {id:'a_v22_tactic_win', cond: tactics.wins >= 5},
    {id:'a_v22_alchemy_5', cond: (alchemy.discovered||[]).length >= 5},
    {id:'a_v22_quest_all', cond: quests.dailyDone && quests.dailyDone.length >= 10},
    {id:'a_v22_growth_max', cond: growth.level >= 30},
    {id:'a_v22_boss_all', cond: (boss.analyzed||[]).length >= 8},
    {id:'a_v22_team_s', cond: team.party && team.party.length === 4},
    {id:'a_v22_timeline_end', cond: timeline.currentDay >= 30},
    {id:'a_v22_explorer', cond: featuresUsed >= 4},
    {id:'a_v22_complete', cond: featuresUsed >= 8}
  ];

  checks.forEach(function(ch){
    if(ch.cond){
      try{
        var a = JSON.parse(localStorage.getItem('hatcuping_achievements') || '{}');
        if(!a[ch.id]){
          a[ch.id] = Date.now();
          localStorage.setItem('hatcuping_achievements', JSON.stringify(a));
          var ad = window.AD ? window.AD.find(function(x){ return x.id === ch.id; }) : null;
          if(ad) showToastV22('🏆 ' + ad.name + ' 업적 달성!');
        }
      }catch(e){}
    }
  });
}


// ============================================================
// KEYBOARD SHORTCUTS (Shift+A~H via e.code)
// ============================================================
function injectV22Keyboard(){
  document.addEventListener('keydown', function(e){
    if(e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
    if(!e.shiftKey) return;
    switch(e.code){
      case 'KeyA': e.preventDefault(); openFriendNetwork(); break;
      case 'KeyB': e.preventDefault(); openTacticsSim(); break;
      case 'KeyC': e.preventDefault(); openAlchemy(); break;
      case 'KeyD': e.preventDefault(); openQuestBoard(); break;
      case 'KeyE': e.preventDefault(); openGrowthCurve(); break;
      case 'KeyF': e.preventDefault(); openBossGuide(); break;
      case 'KeyG': e.preventDefault(); openTeamOptimizer(); break;
      case 'KeyH': e.preventDefault(); openTimeline(); break;
    }
  });
}


// ============================================================
// BOTTOM NAVIGATION (append to existing v18 nav, NO new fixed bar)
// ============================================================
function injectV22BottomNav(){
  var existingNav = document.getElementById('v18BottomNav');
  if(!existingNav) return;

  var buttons = [
    {icon:'💞',label:'우정',action:openFriendNetwork},
    {icon:'⚔️',label:'전술',action:openTacticsSim},
    {icon:'⚗️',label:'연금',action:openAlchemy},
    {icon:'📋',label:'퀘스트',action:openQuestBoard},
    {icon:'📈',label:'성장',action:openGrowthCurve},
    {icon:'📖',label:'보스',action:openBossGuide},
    {icon:'🎯',label:'팀',action:openTeamOptimizer},
    {icon:'📅',label:'타임라인',action:openTimeline}
  ];

  buttons.forEach(function(b){
    var btn = document.createElement('button');
    btn.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:2px;background:none;border:none;cursor:pointer;padding:4px 6px;border-radius:8px;transition:all .2s';
    btn.innerHTML = '<span style="font-size:18px">' + b.icon + '</span><span style="font-size:9px;font-weight:700;color:var(--text-sub)">' + b.label + '</span>';
    btn.onmouseenter = function(){ btn.style.background = 'rgba(255,95,162,.1)'; };
    btn.onmouseleave = function(){ btn.style.background = 'none'; };
    btn.onclick = function(){ sfxV22('v22_nav'); b.action(); };
    existingNav.appendChild(btn);
  });
}


// ============================================================
// FOOTER, NEWS, META UPDATE
// ============================================================
function updateV22Footer(){
  var ver = document.querySelector('.footer .version');
  if(ver) ver.textContent = 'v22.0 | © PRIME Holdings NEXTERA+PRISM';

  var links = document.querySelector('.footer-links');
  if(links) links.innerHTML = '<span class="footer-link">4종 게임</span><span class="footer-link">202개 업적</span><span class="footer-link">우정+전술+연금</span><span class="footer-link">보스+팀+타임라인</span><span class="footer-link">퀴즈 210문</span>';
}

function updateV22News(){
  var newsSection = document.querySelector('.news-section');
  if(!newsSection) return;
  var firstItem = newsSection.querySelector('.news-item');
  if(!firstItem) return;
  var newItem = document.createElement('div');
  newItem.className = 'news-item';
  newItem.innerHTML = '<span class="news-date">v22.0</span><span class="news-text">우정네트워크12캐릭터Canvas, 전투전략시뮬레이터8전술RadarCanvas, 마법속성합성연금술15레시피Canvas, 모험퀘스트보드10퀘스트Canvas, 캐릭터성장곡선Lv30라인Canvas, 보스공략가이드8보스RadarCanvas, 팀편성최적화기12캐릭터시너지Canvas, 모험성과타임라인Canvas, 퀴즈+15(210), 업적+12(202)</span>';
  firstItem.parentNode.insertBefore(newItem, firstItem);
}

function updateV22AchieveCount(){
  var el = document.getElementById('achieveCount');
  if(el){
    var c = 0;
    try{ c = Object.keys(JSON.parse(localStorage.getItem('hatcuping_achievements') || '{}')).length; }catch(e){}
    var t = window.AD ? window.AD.length : 202;
    el.textContent = c + '/' + t;
  }
}

function updateV22Meta(){
  var descMeta = document.querySelector('meta[name="description"]');
  if(descMeta) descMeta.content = '사랑의 하츄핑 v22.0 - 플랫포머 액션, 턴제 RPG, 오픈월드, UNIFIED 4종 게임. 업적 202개, 우정네트워크12캐릭터Canvas, 전투전략시뮬레이터8전술RadarCanvas, 마법속성합성연금술15레시피Canvas, 모험퀘스트보드10퀘스트Canvas, 캐릭터성장곡선Lv30라인Canvas, 보스공략가이드8보스RadarCanvas, 팀편성최적화기12캐릭터시너지Canvas, 모험성과타임라인Canvas, 퀴즈 210문!';
  document.title = '사랑의 하츄핑 v22.0 - 게임 선택';
}


// ============================================================
// BOOT
// ============================================================
function bootV22(){
  injectV22Achievements();
  injectExtraQuizV22();
  injectV22Keyboard();
  injectV22BottomNav();
  updateV22Footer();
  updateV22News();
  updateV22AchieveCount();
  updateV22Meta();
  checkAndAwardV22();
}

if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', bootV22);
} else {
  bootV22();
}

})();

// hatcuping-game v21_patch.js - NEXTERA+PRISM AUTO v21.0
// Self-contained IIFE patch module
(function(){
'use strict';

var _v21Ctx = null;
function _v21InitAudio(){
  if(!_v21Ctx){
    try{ _v21Ctx = new (window.AudioContext || window.webkitAudioContext)(); }catch(e){}
  }
  if(_v21Ctx && _v21Ctx.state === 'suspended') _v21Ctx.resume();
}

var V21_SFX = {
  beauty_judge:{f:880,d:.1,t:'triangle'},
  beauty_win:{f:1200,d:.2,t:'sine'},
  stat_train:{f:660,d:.08,t:'square'},
  stat_up:{f:990,d:.12,t:'triangle'},
  aura_cast:{f:440,d:.15,t:'sine'},
  aura_fuse:{f:1100,d:.18,t:'triangle'},
  dungeon_step:{f:330,d:.06,t:'square'},
  dungeon_treasure:{f:1320,d:.14,t:'sine'},
  gene_mix:{f:550,d:.1,t:'sine'},
  memory_flip:{f:770,d:.05,t:'triangle'},
  cook_sizzle:{f:220,d:.12,t:'sawtooth'},
  v21_nav:{f:700,d:.05,t:'sine'}
};

function sfxV21(type){
  _v21InitAudio();
  if(!_v21Ctx) return;
  var s = V21_SFX[type];
  if(!s) return;
  try{
    var muted = false;
    try{ muted = localStorage.getItem('hatcuping_mute') === '1'; }catch(e){}
    if(muted) return;
    var osc = _v21Ctx.createOscillator();
    var gain = _v21Ctx.createGain();
    osc.type = s.t || 'sine';
    osc.frequency.value = s.f;
    gain.gain.value = 0.08;
    osc.connect(gain);
    gain.connect(_v21Ctx.destination);
    osc.start();
    osc.stop(_v21Ctx.currentTime + (s.d || 0.06));
  }catch(e){}
}

function v21Load(key, fb){ try{ var d = JSON.parse(localStorage.getItem(key)); return d !== null ? d : fb; }catch(e){ return fb; } }
function v21Save(key, data){ try{ localStorage.setItem(key, JSON.stringify(data)); }catch(e){} }
function isDarkV21(){ return document.body.classList.contains('dark'); }
function showToastV21(msg){
  var t = document.getElementById('achieveToast');
  if(t){ t.innerHTML = msg; t.classList.add('show'); setTimeout(function(){ t.classList.remove('show'); }, 2500); }
}

function createV21Modal(title, contentHTML){
  var overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.6);z-index:9999;display:flex;justify-content:center;align-items:center;backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px)';
  var modal = document.createElement('div');
  var bg = isDarkV21() ? '#2a1a3e' : '#fff';
  var col = isDarkV21() ? '#eee' : '#333';
  modal.style.cssText = 'background:' + bg + ';color:' + col + ';border-radius:24px;padding:24px;max-width:660px;width:94%;max-height:85vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.25);position:relative';
  modal.innerHTML = '<button style="position:absolute;top:12px;right:16px;background:none;border:none;font-size:24px;cursor:pointer;color:' + col + '" onclick="this.closest(\'div[style]\').parentElement.remove()">&times;</button><h3 style="font-size:18px;margin-bottom:16px;color:#FF5FA2">' + title + '</h3>' + contentHTML;
  overlay.appendChild(modal);
  overlay.addEventListener('click', function(e){ if(e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
  return modal;
}


// ============================================================
// 1. TINIPING BEAUTY CONTEST (Canvas 580x380)
// ============================================================
var BEAUTY_CONTESTANTS = [
  {name:'하츄핑',icon:'💖'},{name:'바로핑',icon:'⚖️'},{name:'아자핑',icon:'💪'},{name:'차차핑',icon:'💃'},
  {name:'해필핑',icon:'😊'},{name:'라라핑',icon:'🎵'},{name:'키키핑',icon:'😈'},{name:'무무핑',icon:'🛡️'}
];
var BEAUTY_CRITERIA = ['매력','재능','우아함','개성','무대장악력'];
var BEAUTY_COLORS = ['#FF5FA2','#FFB74D','#AB47BC','#42A5F5','#66BB6A'];

function openBeautyContest(){
  sfxV21('beauty_judge');
  var state = v21Load('v21_beauty', {wins:{},totalContests:0});
  var html = '<div style="text-align:center;margin-bottom:12px"><canvas id="v21BeautyCanvas" width="580" height="380" style="max-width:100%;border-radius:12px;background:' + (isDarkV21()?'#1a1030':'#FFF8FC') + '"></canvas></div>';
  html += '<div style="text-align:center;margin-bottom:8px"><button id="v21BeautyStart" style="padding:10px 28px;border-radius:14px;border:none;background:linear-gradient(135deg,#FF5FA2,#FF8EC4);color:#fff;font-weight:700;font-size:14px;cursor:pointer">대회 시작</button></div>';
  html += '<div id="v21BeautyResult" style="text-align:center;font-size:13px;color:#888;min-height:30px">버튼을 눌러 대회를 시작하세요!</div>';
  html += '<div style="text-align:center;margin-top:6px;font-size:11px;color:#888">총 대회 횟수: ' + state.totalContests + '</div>';
  var modal = createV21Modal('👑 티니핑 뷰티 콘테스트', html);
  drawBeautyIdle();
  modal.querySelector('#v21BeautyStart').onclick = function(){ runBeautyContest(state, modal); };
}

function drawBeautyIdle(){
  var c = document.getElementById('v21BeautyCanvas'); if(!c) return;
  var ctx = c.getContext('2d'); var dk = isDarkV21();
  ctx.clearRect(0,0,580,380);
  ctx.fillStyle = dk ? '#1a1030' : '#FFF8FC'; ctx.fillRect(0,0,580,380);
  ctx.font = 'bold 16px sans-serif'; ctx.fillStyle = dk ? '#FF8EC4' : '#FF5FA2'; ctx.textAlign = 'center';
  ctx.fillText('👑 뷰티 콘테스트', 290, 30);
  ctx.font = '13px sans-serif'; ctx.fillStyle = dk ? '#aaa' : '#888';
  for(var i = 0; i < 8; i++){
    var x = 40 + (i % 4) * 135, y = 60 + Math.floor(i / 4) * 150;
    ctx.fillText(BEAUTY_CONTESTANTS[i].icon + ' ' + BEAUTY_CONTESTANTS[i].name, x + 50, y + 20);
  }
  ctx.fillText('대회 시작 버튼을 눌러주세요', 290, 360);
}

function runBeautyContest(state, modal){
  sfxV21('beauty_judge');
  var scores = [];
  for(var i = 0; i < 8; i++){
    var s = []; var total = 0;
    for(var j = 0; j < 5; j++){ var v = 40 + Math.floor(Math.random() * 61); s.push(v); total += v; }
    scores.push({idx:i, scores:s, total:total});
  }
  scores.sort(function(a,b){ return b.total - a.total; });
  var winnerIdx = scores[0].idx;
  state.totalContests++;
  if(!state.wins[winnerIdx]) state.wins[winnerIdx] = 0;
  state.wins[winnerIdx]++;
  v21Save('v21_beauty', state);

  var c = document.getElementById('v21BeautyCanvas'); if(!c) return;
  var ctx = c.getContext('2d'); var dk = isDarkV21();
  var animStep = 0;
  function animBars(){
    ctx.clearRect(0,0,580,380);
    ctx.fillStyle = dk ? '#1a1030' : '#FFF8FC'; ctx.fillRect(0,0,580,380);
    ctx.font = 'bold 14px sans-serif'; ctx.fillStyle = dk ? '#FF8EC4' : '#FF5FA2'; ctx.textAlign = 'center';
    ctx.fillText('👑 뷰티 콘테스트 결과', 290, 22);
    var barH = 32, gap = 8, startY = 40;
    var maxTotal = scores[0].total;
    var progress = Math.min(1, animStep / 30);
    for(var i = 0; i < 8; i++){
      var entry = scores[i];
      var y = startY + i * (barH + gap);
      ctx.font = '11px sans-serif'; ctx.textAlign = 'right'; ctx.fillStyle = dk ? '#ccc' : '#555';
      ctx.fillText(BEAUTY_CONTESTANTS[entry.idx].icon + ' ' + BEAUTY_CONTESTANTS[entry.idx].name, 90, y + 21);
      var barX = 100, maxBarW = 420;
      var cumX = barX;
      for(var j = 0; j < 5; j++){
        var w = (entry.scores[j] / maxTotal) * maxBarW * progress;
        ctx.fillStyle = BEAUTY_COLORS[j];
        ctx.globalAlpha = 0.85;
        ctx.beginPath(); ctx.roundRect(cumX, y + 4, Math.max(0, w), barH - 8, 4); ctx.fill();
        ctx.globalAlpha = 1;
        cumX += w;
      }
      ctx.font = '10px sans-serif'; ctx.textAlign = 'left'; ctx.fillStyle = dk ? '#ddd' : '#333';
      ctx.fillText(Math.round(entry.total * progress), cumX + 4, y + 20);
      if(i === 0 && progress >= 1){
        ctx.font = 'bold 12px sans-serif'; ctx.fillStyle = '#FFD700';
        ctx.fillText('👑', cumX + 30, y + 20);
      }
    }
    ctx.font = '9px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = dk ? '#666' : '#bbb';
    var legendY = 370;
    for(var k = 0; k < 5; k++){
      ctx.fillStyle = BEAUTY_COLORS[k];
      ctx.fillRect(60 + k * 100, legendY - 6, 10, 10);
      ctx.fillStyle = dk ? '#aaa' : '#888';
      ctx.fillText(BEAUTY_CRITERIA[k], 60 + k * 100 + 40, legendY + 3);
    }
    animStep++;
    if(animStep <= 35) requestAnimationFrame(animBars);
  }
  animBars();

  sfxV21('beauty_win');
  var resEl = modal.querySelector('#v21BeautyResult');
  if(resEl) resEl.innerHTML = '👑 우승: <b>' + BEAUTY_CONTESTANTS[winnerIdx].icon + ' ' + BEAUTY_CONTESTANTS[winnerIdx].name + '</b> (' + scores[0].total + '점)';
  checkAndAwardV21();
}


// ============================================================
// 2. STAT TRAINING MANAGER (Canvas 580x360)
// ============================================================
var STAT_NAMES = ['HP','공격','방어','속도','특수공격','특수방어'];
var STAT_COLORS = ['#F44336','#FF9800','#2196F3','#4CAF50','#9C27B0','#00BCD4'];

function openStatTrainer(){
  sfxV21('stat_train');
  var state = v21Load('v21_stats', {levels:[1,1,1,1,1,1],fatigue:0,history:[]});
  var html = '<div style="text-align:center;margin-bottom:10px"><canvas id="v21StatCanvas" width="580" height="360" style="max-width:100%;border-radius:12px;background:' + (isDarkV21()?'#1a1030':'#FFF8FC') + '"></canvas></div>';
  html += '<div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;margin-bottom:8px">';
  html += '<button id="v21Train1" style="padding:8px 14px;border-radius:10px;border:none;background:#FF5FA2;color:#fff;font-weight:700;cursor:pointer;font-size:12px">집중훈련</button>';
  html += '<button id="v21Train2" style="padding:8px 14px;border-radius:10px;border:none;background:#42A5F5;color:#fff;font-weight:700;cursor:pointer;font-size:12px">균형훈련</button>';
  html += '<button id="v21Train3" style="padding:8px 14px;border-radius:10px;border:none;background:#66BB6A;color:#fff;font-weight:700;cursor:pointer;font-size:12px">실전훈련</button>';
  html += '<button id="v21Train4" style="padding:8px 14px;border-radius:10px;border:none;background:#FFB74D;color:#fff;font-weight:700;cursor:pointer;font-size:12px">휴식</button>';
  html += '</div>';
  html += '<div id="v21StatInfo" style="text-align:center;font-size:12px;color:#888">훈련 모드를 선택하세요. 피로도: ' + state.fatigue + '/100</div>';
  html += '<div id="v21StatPick" style="display:none;text-align:center;margin-top:6px"></div>';
  var modal = createV21Modal('💪 스탯 훈련 매니저', html);
  drawStatRadar(state);
  modal.querySelector('#v21Train1').onclick = function(){
    var pickDiv = modal.querySelector('#v21StatPick');
    pickDiv.style.display = 'block';
    pickDiv.innerHTML = STAT_NAMES.map(function(n,i){ return '<button class="v21sp" data-si="' + i + '" style="margin:2px;padding:6px 12px;border-radius:8px;border:1px solid #FF5FA2;background:none;color:' + (isDarkV21()?'#eee':'#333') + ';cursor:pointer;font-size:11px">' + n + '</button>'; }).join('');
    pickDiv.querySelectorAll('.v21sp').forEach(function(b){
      b.onclick = function(){
        var si = parseInt(b.dataset.si);
        var gain = state.fatigue >= 80 ? 1 : 3;
        state.levels[si] = Math.min(10, state.levels[si] + gain);
        state.fatigue = Math.min(100, state.fatigue + 20);
        state.history.push({type:'집중',stat:si,gain:gain});
        if(state.history.length > 10) state.history.shift();
        v21Save('v21_stats', state); sfxV21('stat_up');
        drawStatRadar(state); pickDiv.style.display = 'none';
        modal.querySelector('#v21StatInfo').textContent = '집중훈련! ' + STAT_NAMES[si] + ' +' + gain + ' | 피로도: ' + state.fatigue + '/100';
        checkAndAwardV21();
      };
    });
  };
  modal.querySelector('#v21Train2').onclick = function(){
    var gain = state.fatigue >= 80 ? 0 : 1;
    for(var i = 0; i < 6; i++) state.levels[i] = Math.min(10, state.levels[i] + gain);
    state.fatigue = Math.min(100, state.fatigue + 15);
    state.history.push({type:'균형',stat:-1,gain:gain});
    if(state.history.length > 10) state.history.shift();
    v21Save('v21_stats', state); sfxV21('stat_up'); drawStatRadar(state);
    modal.querySelector('#v21StatInfo').textContent = '균형훈련! 전체 +' + gain + ' | 피로도: ' + state.fatigue + '/100';
    modal.querySelector('#v21StatPick').style.display = 'none';
    checkAndAwardV21();
  };
  modal.querySelector('#v21Train3').onclick = function(){
    var s1 = Math.floor(Math.random() * 6), s2;
    do { s2 = Math.floor(Math.random() * 6); } while(s2 === s1);
    var gain = state.fatigue >= 80 ? 1 : 2;
    state.levels[s1] = Math.min(10, state.levels[s1] + gain);
    state.levels[s2] = Math.min(10, state.levels[s2] + gain);
    state.fatigue = Math.min(100, state.fatigue + 18);
    state.history.push({type:'실전',stat:s1,gain:gain});
    if(state.history.length > 10) state.history.shift();
    v21Save('v21_stats', state); sfxV21('stat_up'); drawStatRadar(state);
    modal.querySelector('#v21StatInfo').textContent = '실전훈련! ' + STAT_NAMES[s1] + '&' + STAT_NAMES[s2] + ' +' + gain + ' | 피로도: ' + state.fatigue + '/100';
    modal.querySelector('#v21StatPick').style.display = 'none';
    checkAndAwardV21();
  };
  modal.querySelector('#v21Train4').onclick = function(){
    state.fatigue = Math.max(0, state.fatigue - 40);
    state.history.push({type:'휴식',stat:-1,gain:0});
    if(state.history.length > 10) state.history.shift();
    v21Save('v21_stats', state); drawStatRadar(state);
    modal.querySelector('#v21StatInfo').textContent = '휴식 완료! 피로도: ' + state.fatigue + '/100';
    modal.querySelector('#v21StatPick').style.display = 'none';
  };
}

function drawStatRadar(state){
  var c = document.getElementById('v21StatCanvas'); if(!c) return;
  var ctx = c.getContext('2d'); var dk = isDarkV21();
  ctx.clearRect(0,0,580,360);
  ctx.fillStyle = dk ? '#1a1030' : '#FFF8FC'; ctx.fillRect(0,0,580,360);
  var cx = 200, cy = 175, r = 110;
  for(var ring = 1; ring <= 5; ring++){
    ctx.beginPath();
    for(var i = 0; i < 6; i++){
      var angle = -Math.PI/2 + (Math.PI*2/6)*i;
      var rx = cx + Math.cos(angle) * r * ring / 5;
      var ry = cy + Math.sin(angle) * r * ring / 5;
      if(i === 0) ctx.moveTo(rx, ry); else ctx.lineTo(rx, ry);
    }
    ctx.closePath(); ctx.strokeStyle = dk ? 'rgba(255,255,255,.1)' : 'rgba(0,0,0,.08)'; ctx.stroke();
  }
  ctx.beginPath();
  for(var i = 0; i < 6; i++){
    var angle = -Math.PI/2 + (Math.PI*2/6)*i;
    var val = state.levels[i] / 10;
    var px = cx + Math.cos(angle) * r * val;
    var py = cy + Math.sin(angle) * r * val;
    if(i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath(); ctx.fillStyle = 'rgba(255,95,162,.25)'; ctx.fill();
  ctx.strokeStyle = '#FF5FA2'; ctx.lineWidth = 2; ctx.stroke();
  for(var i = 0; i < 6; i++){
    var angle = -Math.PI/2 + (Math.PI*2/6)*i;
    var lx = cx + Math.cos(angle) * (r + 20);
    var ly = cy + Math.sin(angle) * (r + 20);
    ctx.font = 'bold 11px sans-serif'; ctx.fillStyle = STAT_COLORS[i]; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(STAT_NAMES[i] + ' ' + state.levels[i], lx, ly);
  }
  var total = 0; for(var i=0;i<6;i++) total += state.levels[i];
  var grade = total >= 55 ? 'S' : total >= 45 ? 'A' : total >= 35 ? 'B' : total >= 25 ? 'C' : 'D';
  ctx.font = 'bold 18px sans-serif'; ctx.fillStyle = grade === 'S' ? '#FFD700' : grade === 'A' ? '#4CAF50' : '#FF5FA2';
  ctx.textAlign = 'center'; ctx.fillText('등급: ' + grade, cx, cy + r + 45);
  ctx.font = '10px sans-serif'; ctx.fillStyle = dk ? '#888' : '#aaa';
  ctx.fillText('총 스탯: ' + total + '/60 | 피로도: ' + state.fatigue + '/100', cx, cy + r + 60);
  var histX = 400, histY = 40;
  ctx.font = 'bold 12px sans-serif'; ctx.fillStyle = dk ? '#ccc' : '#555'; ctx.textAlign = 'center';
  ctx.fillText('훈련 기록', histX + 80, histY);
  if(state.history.length > 0){
    var bw = 14, bGap = 3, maxH = 100;
    for(var i = 0; i < state.history.length; i++){
      var h = state.history[i];
      var barH = (h.gain / 3) * maxH || 5;
      var bx = histX + i * (bw + bGap);
      var by = histY + 20 + maxH - barH;
      ctx.fillStyle = h.type === '집중' ? '#FF5FA2' : h.type === '균형' ? '#42A5F5' : h.type === '실전' ? '#66BB6A' : '#FFB74D';
      ctx.beginPath(); ctx.roundRect(bx, by, bw, barH, 3); ctx.fill();
    }
    ctx.font = '9px sans-serif'; ctx.fillStyle = dk ? '#777' : '#bbb'; ctx.textAlign = 'left';
    ctx.fillText('집중', histX, histY + maxH + 40); ctx.fillStyle = '#FF5FA2'; ctx.fillRect(histX + 22, histY + maxH + 33, 8, 8);
    ctx.fillStyle = dk ? '#777' : '#bbb';
    ctx.fillText('균형', histX + 40, histY + maxH + 40); ctx.fillStyle = '#42A5F5'; ctx.fillRect(histX + 62, histY + maxH + 33, 8, 8);
    ctx.fillStyle = dk ? '#777' : '#bbb';
    ctx.fillText('실전', histX + 80, histY + maxH + 40); ctx.fillStyle = '#66BB6A'; ctx.fillRect(histX + 102, histY + maxH + 33, 8, 8);
  }
}


// ============================================================
// 3. MAGIC AURA CUSTOMIZER (Canvas 600x380)
// ============================================================
var AURA_TYPES = [
  {name:'불',icon:'🔥',color:'#F44336',pair:{}},
  {name:'물',icon:'💧',color:'#2196F3',pair:{}},
  {name:'바람',icon:'🌪️',color:'#81C784',pair:{}},
  {name:'대지',icon:'🌿',color:'#8D6E63',pair:{}},
  {name:'빛',icon:'✨',color:'#FFD700',pair:{}},
  {name:'어둠',icon:'🌑',color:'#5C6BC0',pair:{}},
  {name:'번개',icon:'⚡',color:'#FFEB3B',pair:{}},
  {name:'얼음',icon:'❄️',color:'#4FC3F7',pair:{}}
];
var AURA_FUSIONS = [
  {a:0,b:1,name:'증기',icon:'♨️',color:'#B0BEC5'},
  {a:0,b:2,name:'화염폭풍',icon:'🌋',color:'#FF6F00'},
  {a:0,b:7,name:'용암',icon:'🔶',color:'#E65100'},
  {a:1,b:7,name:'서리',icon:'🧊',color:'#80DEEA'},
  {a:2,b:6,name:'뇌운',icon:'🌩️',color:'#7E57C2'},
  {a:3,b:2,name:'모래폭풍',icon:'🏜️',color:'#D4A373'},
  {a:4,b:5,name:'황혼',icon:'🌅',color:'#FF8A65'},
  {a:6,b:7,name:'빙뢰',icon:'💎',color:'#18FFFF'},
  {a:3,b:4,name:'성장',icon:'🌱',color:'#A5D6A7'},
  {a:5,b:6,name:'암뇌',icon:'🖤',color:'#37474F'}
];

function openAuraCustomizer(){
  sfxV21('aura_cast');
  var state = v21Load('v21_aura', {props:[[5,5,5],[5,5,5],[5,5,5],[5,5,5],[5,5,5],[5,5,5],[5,5,5],[5,5,5]],fusions:[],selected:0});
  var html = '<div style="text-align:center;margin-bottom:10px"><canvas id="v21AuraCanvas" width="600" height="380" style="max-width:100%;border-radius:12px;background:' + (isDarkV21()?'#1a1030':'#FFF8FC') + '"></canvas></div>';
  html += '<div style="display:flex;gap:4px;flex-wrap:wrap;justify-content:center;margin-bottom:8px">';
  AURA_TYPES.forEach(function(a,i){
    html += '<button class="v21aura-btn" data-ai="' + i + '" style="padding:6px 10px;border-radius:10px;border:2px solid ' + a.color + ';background:none;cursor:pointer;font-size:12px;color:' + (isDarkV21()?'#eee':'#333') + '">' + a.icon + a.name + '</button>';
  });
  html += '</div>';
  html += '<div style="display:flex;gap:6px;justify-content:center;margin-bottom:6px">';
  html += '<label style="font-size:11px;color:#888">강도<input type="range" id="v21AuraInt" min="1" max="10" value="' + state.props[state.selected][0] + '" style="width:80px"></label>';
  html += '<label style="font-size:11px;color:#888">범위<input type="range" id="v21AuraRng" min="1" max="10" value="' + state.props[state.selected][1] + '" style="width:80px"></label>';
  html += '<label style="font-size:11px;color:#888">지속<input type="range" id="v21AuraDur" min="1" max="10" value="' + state.props[state.selected][2] + '" style="width:80px"></label>';
  html += '</div>';
  html += '<div style="text-align:center;margin-bottom:6px"><button id="v21AuraFuseBtn" style="padding:8px 18px;border-radius:10px;border:none;background:#AB47BC;color:#fff;font-weight:700;cursor:pointer;font-size:12px">융합 (2개 선택)</button></div>';
  html += '<div id="v21AuraInfo" style="text-align:center;font-size:12px;color:#888">오라를 선택하고 속성을 조절하세요. 융합 발견: ' + state.fusions.length + '/' + AURA_FUSIONS.length + '</div>';
  var modal = createV21Modal('✨ 마법 오라 커스터마이저', html);
  var selArr = [state.selected];
  drawAura(state, selArr);

  modal.querySelectorAll('.v21aura-btn').forEach(function(b){
    b.onclick = function(){
      var ai = parseInt(b.dataset.ai);
      if(selArr.length >= 2) selArr = [];
      selArr.push(ai);
      state.selected = ai;
      modal.querySelector('#v21AuraInt').value = state.props[ai][0];
      modal.querySelector('#v21AuraRng').value = state.props[ai][1];
      modal.querySelector('#v21AuraDur').value = state.props[ai][2];
      drawAura(state, selArr);
    };
  });
  ['v21AuraInt','v21AuraRng','v21AuraDur'].forEach(function(rid,ri){
    modal.querySelector('#' + rid).oninput = function(){
      state.props[state.selected][ri] = parseInt(this.value);
      v21Save('v21_aura', state);
      drawAura(state, selArr);
    };
  });
  modal.querySelector('#v21AuraFuseBtn').onclick = function(){
    if(selArr.length < 2){ modal.querySelector('#v21AuraInfo').textContent = '2개의 오라를 선택하세요!'; return; }
    var a = Math.min(selArr[0], selArr[1]), b = Math.max(selArr[0], selArr[1]);
    var fusion = null;
    AURA_FUSIONS.forEach(function(f){ if(f.a === a && f.b === b) fusion = f; });
    if(!fusion){ modal.querySelector('#v21AuraInfo').textContent = '이 조합은 융합할 수 없습니다!'; return; }
    sfxV21('aura_fuse');
    if(state.fusions.indexOf(fusion.name) < 0){ state.fusions.push(fusion.name); v21Save('v21_aura', state); }
    modal.querySelector('#v21AuraInfo').innerHTML = '융합 성공! <b>' + fusion.icon + ' ' + fusion.name + '</b> 발견! (' + state.fusions.length + '/' + AURA_FUSIONS.length + ')';
    drawAuraFusion(fusion);
    checkAndAwardV21();
  };
}

function drawAura(state, selArr){
  var c = document.getElementById('v21AuraCanvas'); if(!c) return;
  var ctx = c.getContext('2d'); var dk = isDarkV21();
  ctx.clearRect(0,0,600,380);
  ctx.fillStyle = dk ? '#1a1030' : '#FFF8FC'; ctx.fillRect(0,0,600,380);
  var sel = selArr[selArr.length - 1] || 0;
  var aura = AURA_TYPES[sel]; var props = state.props[sel];
  var cx = 300, cy = 190, maxR = 30 + props[1] * 12;
  for(var ring = 5; ring >= 1; ring--){
    var rr = maxR * ring / 5;
    var grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, rr);
    grad.addColorStop(0, aura.color); grad.addColorStop(1, 'transparent');
    ctx.globalAlpha = (props[0] / 10) * 0.15 * (6 - ring) / 5;
    ctx.beginPath(); ctx.arc(cx, cy, rr, 0, Math.PI * 2); ctx.fillStyle = grad; ctx.fill();
  }
  ctx.globalAlpha = 1;
  var nParticles = props[2] * 3;
  for(var p = 0; p < nParticles; p++){
    var angle = (Math.PI * 2 / nParticles) * p + (Date.now() / 1000);
    var dist = maxR * 0.4 + Math.random() * maxR * 0.6;
    var px = cx + Math.cos(angle) * dist, py = cy + Math.sin(angle) * dist;
    ctx.beginPath(); ctx.arc(px, py, 1.5 + Math.random() * 2, 0, Math.PI * 2);
    ctx.fillStyle = aura.color; ctx.globalAlpha = 0.5 + Math.random() * 0.5;
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.font = 'bold 30px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = aura.color;
  ctx.fillText(aura.icon, cx, cy + 10);
  ctx.font = 'bold 14px sans-serif'; ctx.fillText(aura.name + ' 오라', cx, cy + maxR + 30);
  ctx.font = '11px sans-serif'; ctx.fillStyle = dk ? '#aaa' : '#888';
  ctx.fillText('강도:' + props[0] + ' 범위:' + props[1] + ' 지속:' + props[2], cx, cy + maxR + 48);
  if(selArr.length >= 2){
    ctx.font = '12px sans-serif'; ctx.fillStyle = '#AB47BC';
    ctx.fillText(AURA_TYPES[selArr[0]].icon + ' + ' + AURA_TYPES[selArr[1]].icon + ' 융합 준비', cx, 25);
  }
}

function drawAuraFusion(fusion){
  var c = document.getElementById('v21AuraCanvas'); if(!c) return;
  var ctx = c.getContext('2d'); var dk = isDarkV21();
  ctx.clearRect(0,0,600,380);
  ctx.fillStyle = dk ? '#1a1030' : '#FFF8FC'; ctx.fillRect(0,0,600,380);
  var cx = 300, cy = 190;
  for(var ring = 6; ring >= 1; ring--){
    var rr = ring * 25;
    var grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, rr);
    grad.addColorStop(0, fusion.color); grad.addColorStop(1, 'transparent');
    ctx.globalAlpha = 0.2 * (7 - ring) / 6;
    ctx.beginPath(); ctx.arc(cx, cy, rr, 0, Math.PI * 2); ctx.fillStyle = grad; ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.font = 'bold 40px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = fusion.color;
  ctx.fillText(fusion.icon, cx, cy + 15);
  ctx.font = 'bold 18px sans-serif'; ctx.fillText(fusion.name, cx, cy + 55);
  ctx.font = '13px sans-serif'; ctx.fillStyle = dk ? '#ccc' : '#555';
  ctx.fillText('융합 오라 발현!', cx, cy + 80);
}


// ============================================================
// 4. DUNGEON EXPLORATION LOG (Canvas 600x400)
// ============================================================
var DUNGEON_MONSTERS = ['슬라임핑','고블린핑','트롤핑','유령핑','드래곤핑','마녀핑','해골핑','거미핑','박쥐핑','보스오그핑'];

function openDungeon(){
  sfxV21('dungeon_step');
  var state = v21Load('v21_dungeon', {floor:0,hp:100,gold:0,log:[],clears:0,bestGold:0});
  if(state.hp <= 0 || state.floor >= 10){ state.floor = 0; state.hp = 100; state.gold = 0; state.log = []; }
  var html = '<div style="text-align:center;margin-bottom:10px"><canvas id="v21DungeonCanvas" width="600" height="400" style="max-width:100%;border-radius:12px;background:' + (isDarkV21()?'#1a1030':'#FFF8FC') + '"></canvas></div>';
  html += '<div style="text-align:center;margin-bottom:8px"><button id="v21DungeonGo" style="padding:10px 28px;border-radius:14px;border:none;background:linear-gradient(135deg,#7E57C2,#AB47BC);color:#fff;font-weight:700;font-size:14px;cursor:pointer">탐험</button></div>';
  html += '<div id="v21DungeonLog" style="text-align:center;font-size:12px;color:#888;min-height:30px">던전에 입장합니다! 현재 ' + state.floor + 'F</div>';
  html += '<div style="text-align:center;font-size:11px;color:#888;margin-top:4px">클리어: ' + state.clears + '회 | 최고 골드: ' + state.bestGold + '</div>';
  var modal = createV21Modal('🏰 던전 탐험 로그', html);
  drawDungeon(state);

  modal.querySelector('#v21DungeonGo').onclick = function(){
    if(state.hp <= 0 || state.floor >= 10){
      if(state.floor >= 10){ state.clears++; if(state.gold > state.bestGold) state.bestGold = state.gold; }
      v21Save('v21_dungeon', state);
      state.floor = 0; state.hp = 100; state.gold = 0; state.log = [];
      modal.querySelector('#v21DungeonLog').textContent = '새 던전 시작!';
      drawDungeon(state);
      checkAndAwardV21();
      return;
    }
    state.floor++;
    sfxV21('dungeon_step');
    var roll = Math.random();
    var msg = '';
    if(roll < 0.45){
      var mon = DUNGEON_MONSTERS[Math.floor(Math.random() * DUNGEON_MONSTERS.length)];
      var dmg = 10 + Math.floor(Math.random() * 15);
      state.hp = Math.max(0, state.hp - dmg);
      msg = state.floor + 'F: ' + mon + ' 등장! -' + dmg + 'HP';
    } else if(roll < 0.75){
      var g = 10 + Math.floor(Math.random() * 20);
      state.gold += g;
      sfxV21('dungeon_treasure');
      msg = state.floor + 'F: 보물 발견! +' + g + '골드';
    } else {
      var trap = Math.random() < 0.5;
      if(trap){ var td = 5 + Math.floor(Math.random() * 10); state.hp = Math.max(0, state.hp - td); msg = state.floor + 'F: 함정! -' + td + 'HP'; }
      else { msg = state.floor + 'F: 함정 회피 성공!'; }
    }
    state.log.push(msg);
    if(state.log.length > 10) state.log.shift();
    v21Save('v21_dungeon', state);
    drawDungeon(state);
    var logEl = modal.querySelector('#v21DungeonLog');
    if(state.hp <= 0){
      logEl.innerHTML = '<span style="color:#F44336;font-weight:700">HP 소진! 던전 탈출...</span> 골드: ' + state.gold;
    } else if(state.floor >= 10){
      state.clears++; if(state.gold > state.bestGold) state.bestGold = state.gold;
      v21Save('v21_dungeon', state);
      logEl.innerHTML = '<span style="color:#4CAF50;font-weight:700">던전 클리어!</span> 골드: ' + state.gold;
      checkAndAwardV21();
    } else {
      logEl.textContent = msg;
    }
  };
}

function drawDungeon(state){
  var c = document.getElementById('v21DungeonCanvas'); if(!c) return;
  var ctx = c.getContext('2d'); var dk = isDarkV21();
  ctx.clearRect(0,0,600,400);
  ctx.fillStyle = dk ? '#1a1030' : '#FFF8FC'; ctx.fillRect(0,0,600,400);
  ctx.font = 'bold 14px sans-serif'; ctx.fillStyle = dk ? '#FF8EC4' : '#FF5FA2'; ctx.textAlign = 'center';
  ctx.fillText('🏰 던전 탐험', 300, 22);
  ctx.fillStyle = dk ? '#333' : '#eee'; ctx.fillRect(20, 34, 260, 16);
  ctx.fillStyle = state.hp > 50 ? '#4CAF50' : state.hp > 25 ? '#FF9800' : '#F44336';
  ctx.fillRect(20, 34, 260 * (state.hp / 100), 16);
  ctx.font = 'bold 10px sans-serif'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
  ctx.fillText('HP: ' + state.hp + '/100', 150, 46);
  ctx.font = 'bold 12px sans-serif'; ctx.fillStyle = '#FFD700'; ctx.textAlign = 'left';
  ctx.fillText('💰 ' + state.gold, 300, 47);
  for(var f = 10; f >= 1; f--){
    var fy = 60 + (10 - f) * 32;
    var isCurrent = f === state.floor;
    var isCleared = f < state.floor;
    ctx.fillStyle = isCurrent ? (dk ? 'rgba(255,95,162,.3)' : 'rgba(255,95,162,.15)') : isCleared ? (dk ? 'rgba(76,175,80,.15)' : 'rgba(76,175,80,.1)') : (dk ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.03)');
    ctx.beginPath(); ctx.roundRect(60, fy, 200, 28, 6); ctx.fill();
    ctx.strokeStyle = isCurrent ? '#FF5FA2' : dk ? 'rgba(255,255,255,.1)' : 'rgba(0,0,0,.08)';
    ctx.lineWidth = isCurrent ? 2 : 1; ctx.stroke();
    ctx.font = (isCurrent ? 'bold ' : '') + '11px sans-serif';
    ctx.fillStyle = isCurrent ? '#FF5FA2' : isCleared ? '#4CAF50' : (dk ? '#888' : '#aaa');
    ctx.textAlign = 'center';
    ctx.fillText((isCleared ? '✓ ' : '') + f + 'F' + (isCurrent ? ' ◀ 현재' : ''), 160, fy + 18);
    if(f > 1){
      ctx.strokeStyle = dk ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.05)';
      ctx.beginPath(); ctx.moveTo(160, fy + 28); ctx.lineTo(160, fy + 32); ctx.stroke();
    }
  }
  var logX = 310, logY = 70;
  ctx.font = 'bold 11px sans-serif'; ctx.fillStyle = dk ? '#ccc' : '#555'; ctx.textAlign = 'left';
  ctx.fillText('탐험 기록:', logX, logY);
  ctx.font = '10px sans-serif'; ctx.fillStyle = dk ? '#aaa' : '#888';
  state.log.forEach(function(l, i){
    ctx.fillText(l, logX, logY + 18 + i * 16);
  });
}


// ============================================================
// 5. GENETIC TRAIT LAB (Canvas 580x360)
// ============================================================
var GENE_TRAITS = ['날개색','눈색','체형','성격','특수능력','울음소리','꼬리형태','무늬'];
var GENE_VARIANTS = [
  ['분홍','파랑','초록','보라'],['빨강','갈색','금색','검정'],['소형','중형','대형','특대'],
  ['다정','활발','차분','장난'],['비행','치유','방어','공격'],['짹짹','뿅뿅','윙윙','반짝'],
  ['짧은','긴','곱슬','뾰족'],['줄무늬','점무늬','별무늬','하트무늬']
];
var GENE_COLORS = ['#FF5FA2','#2196F3','#66BB6A','#FF9800','#9C27B0','#00BCD4','#F44336','#FFD700'];

function openGeneLab(){
  sfxV21('gene_mix');
  var state = v21Load('v21_gene', {offspring:[],count:0});
  var parentA = [], parentB = [];
  for(var i = 0; i < 8; i++){ parentA.push(Math.floor(Math.random() * 4)); parentB.push(Math.floor(Math.random() * 4)); }
  var html = '<div style="text-align:center;margin-bottom:10px"><canvas id="v21GeneCanvas" width="580" height="360" style="max-width:100%;border-radius:12px;background:' + (isDarkV21()?'#1a1030':'#FFF8FC') + '"></canvas></div>';
  html += '<div style="text-align:center;margin-bottom:8px"><button id="v21GeneBreed" style="padding:10px 24px;border-radius:14px;border:none;background:linear-gradient(135deg,#66BB6A,#42A5F5);color:#fff;font-weight:700;font-size:14px;cursor:pointer">교배</button>';
  html += ' <button id="v21GeneReroll" style="padding:10px 18px;border-radius:14px;border:none;background:#FF9800;color:#fff;font-weight:700;cursor:pointer;font-size:12px">부모 변경</button></div>';
  html += '<div id="v21GeneInfo" style="text-align:center;font-size:12px;color:#888">부모 형질을 확인하고 교배하세요! 자손 기록: ' + state.offspring.length + '/30</div>';
  var modal = createV21Modal('🧬 유전 형질 연구소', html);
  drawGene(parentA, parentB, null);

  modal.querySelector('#v21GeneBreed').onclick = function(){
    sfxV21('gene_mix');
    var child = [];
    for(var i = 0; i < 8; i++){
      if(Math.random() < 0.45) child.push(parentA[i]);
      else if(Math.random() < 0.82) child.push(parentB[i]);
      else child.push(Math.floor(Math.random() * 4));
    }
    state.offspring.push(child);
    state.count++;
    if(state.offspring.length > 30) state.offspring.shift();
    v21Save('v21_gene', state);
    drawGene(parentA, parentB, child);
    modal.querySelector('#v21GeneInfo').textContent = '자손 탄생! 기록: ' + state.offspring.length + '/30 | 총 교배: ' + state.count;
    checkAndAwardV21();
  };
  modal.querySelector('#v21GeneReroll').onclick = function(){
    for(var i = 0; i < 8; i++){ parentA[i] = Math.floor(Math.random() * 4); parentB[i] = Math.floor(Math.random() * 4); }
    drawGene(parentA, parentB, null);
  };
}

function drawGene(pA, pB, child){
  var c = document.getElementById('v21GeneCanvas'); if(!c) return;
  var ctx = c.getContext('2d'); var dk = isDarkV21();
  ctx.clearRect(0,0,580,360);
  ctx.fillStyle = dk ? '#1a1030' : '#FFF8FC'; ctx.fillRect(0,0,580,360);
  ctx.font = 'bold 14px sans-serif'; ctx.fillStyle = dk ? '#FF8EC4' : '#FF5FA2'; ctx.textAlign = 'center';
  ctx.fillText('🧬 유전 형질 연구소', 290, 22);

  ctx.font = 'bold 11px sans-serif'; ctx.fillStyle = '#FF5FA2'; ctx.textAlign = 'center';
  ctx.fillText('부모 A', 120, 45); ctx.fillStyle = '#42A5F5'; ctx.fillText('부모 B', 340, 45);
  if(child) { ctx.fillStyle = '#66BB6A'; ctx.fillText('자손', 500, 45); }

  for(var i = 0; i < 8; i++){
    var y = 55 + i * 34;
    ctx.font = '10px sans-serif'; ctx.fillStyle = dk ? '#aaa' : '#888'; ctx.textAlign = 'left';
    ctx.fillText(GENE_TRAITS[i], 10, y + 14);
    ctx.fillStyle = GENE_COLORS[i]; ctx.globalAlpha = 0.8;
    var wA = 15 + pA[i] * 18;
    ctx.beginPath(); ctx.roundRect(70, y + 2, wA, 16, 4); ctx.fill();
    ctx.font = '9px sans-serif'; ctx.fillStyle = dk ? '#fff' : '#333'; ctx.globalAlpha = 1; ctx.textAlign = 'center';
    ctx.fillText(GENE_VARIANTS[i][pA[i]], 70 + wA / 2, y + 14);

    ctx.fillStyle = GENE_COLORS[i]; ctx.globalAlpha = 0.8;
    var wB = 15 + pB[i] * 18;
    ctx.beginPath(); ctx.roundRect(260, y + 2, wB, 16, 4); ctx.fill();
    ctx.font = '9px sans-serif'; ctx.fillStyle = dk ? '#fff' : '#333'; ctx.globalAlpha = 1; ctx.textAlign = 'center';
    ctx.fillText(GENE_VARIANTS[i][pB[i]], 260 + wB / 2, y + 14);

    if(child){
      ctx.fillStyle = GENE_COLORS[i]; ctx.globalAlpha = 0.8;
      var wC = 15 + child[i] * 18;
      ctx.beginPath(); ctx.roundRect(440, y + 2, wC, 16, 4); ctx.fill();
      ctx.font = '9px sans-serif'; ctx.fillStyle = dk ? '#fff' : '#333'; ctx.globalAlpha = 1; ctx.textAlign = 'center';
      ctx.fillText(GENE_VARIANTS[i][child[i]], 440 + wC / 2, y + 14);
    }

    // Punnett connection lines
    ctx.strokeStyle = dk ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.05)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(70 + wA, y + 10); ctx.lineTo(260, y + 10); ctx.stroke();
    if(child){
      ctx.beginPath(); ctx.moveTo(260 + wB, y + 10); ctx.lineTo(440, y + 10); ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
}


// ============================================================
// 6. BATTLE MEMORY GAME (Canvas 580x360)
// ============================================================
var MEMORY_SKILLS = ['하트빔','별빛방패','치유의빛','용기의불꽃','바람의노래','대지의힘','번개일격','얼음결계','불꽃화살','수호벽'];
var MEMORY_ICONS = ['💖','⭐','💚','🔥','🌪️','🌿','⚡','❄️','🏹','🛡️'];
var _memoryState = null;

function openMemoryGame(){
  sfxV21('memory_flip');
  var best = v21Load('v21_memory', {bestMoves:999,bestTime:9999,gamesWon:0});
  var html = '<div style="text-align:center;margin-bottom:8px">';
  html += '<button class="v21mem-diff" data-d="0" style="padding:6px 14px;border-radius:8px;border:none;background:#66BB6A;color:#fff;font-weight:700;cursor:pointer;font-size:11px;margin:0 4px">Easy 3x4</button>';
  html += '<button class="v21mem-diff" data-d="1" style="padding:6px 14px;border-radius:8px;border:none;background:#FF9800;color:#fff;font-weight:700;cursor:pointer;font-size:11px;margin:0 4px">Normal 4x4</button>';
  html += '<button class="v21mem-diff" data-d="2" style="padding:6px 14px;border-radius:8px;border:none;background:#F44336;color:#fff;font-weight:700;cursor:pointer;font-size:11px;margin:0 4px">Hard 5x4</button>';
  html += '</div>';
  html += '<div style="text-align:center;margin-bottom:10px"><canvas id="v21MemCanvas" width="580" height="360" style="max-width:100%;border-radius:12px;background:' + (isDarkV21()?'#1a1030':'#FFF8FC') + ';cursor:pointer"></canvas></div>';
  html += '<div id="v21MemInfo" style="text-align:center;font-size:12px;color:#888">난이도를 선택하세요! 최고: ' + (best.bestMoves < 999 ? best.bestMoves + '수' : '-') + ' | 승리: ' + best.gamesWon + '</div>';
  var modal = createV21Modal('🃏 배틀 메모리 게임', html);

  modal.querySelectorAll('.v21mem-diff').forEach(function(b){
    b.onclick = function(){ startMemory(parseInt(b.dataset.d), best, modal); };
  });
}

function startMemory(diff, best, modal){
  var cols = [3,4,5][diff], rows = 4;
  var pairs = (cols * rows) / 2;
  var icons = MEMORY_ICONS.slice(0, pairs);
  var deck = []; icons.forEach(function(ic){ deck.push(ic); deck.push(ic); });
  for(var i = deck.length - 1; i > 0; i--){ var j = Math.floor(Math.random() * (i + 1)); var t = deck[i]; deck[i] = deck[j]; deck[j] = t; }
  _memoryState = {cols:cols,rows:rows,deck:deck,revealed:[],matched:[],moves:0,startTime:Date.now(),first:null,locked:false,done:false};
  drawMemory();
  var c = document.getElementById('v21MemCanvas');
  if(!c) return;
  c.onclick = function(e){
    if(!_memoryState || _memoryState.locked || _memoryState.done) return;
    var rect = c.getBoundingClientRect();
    var scaleX = 580 / rect.width;
    var mx = (e.clientX - rect.left) * scaleX;
    var my = (e.clientY - rect.top) * (360 / rect.height);
    var cw = 580 / cols, ch = 320 / rows;
    var ci = Math.floor(mx / cw), ri = Math.floor((my - 20) / ch);
    if(ci < 0 || ci >= cols || ri < 0 || ri >= rows) return;
    var idx = ri * cols + ci;
    if(_memoryState.matched.indexOf(idx) >= 0 || _memoryState.revealed.indexOf(idx) >= 0) return;
    sfxV21('memory_flip');
    _memoryState.revealed.push(idx);
    drawMemory();
    if(_memoryState.revealed.length === 2){
      _memoryState.moves++;
      _memoryState.locked = true;
      var i1 = _memoryState.revealed[0], i2 = _memoryState.revealed[1];
      if(_memoryState.deck[i1] === _memoryState.deck[i2]){
        _memoryState.matched.push(i1); _memoryState.matched.push(i2);
        _memoryState.revealed = []; _memoryState.locked = false;
        drawMemory();
        if(_memoryState.matched.length === _memoryState.deck.length){
          _memoryState.done = true;
          var elapsed = Math.round((Date.now() - _memoryState.startTime) / 1000);
          var score = Math.max(0, 500 - (_memoryState.moves * 5) - (elapsed * 2));
          best.gamesWon++;
          if(_memoryState.moves < best.bestMoves) best.bestMoves = _memoryState.moves;
          if(elapsed < best.bestTime) best.bestTime = elapsed;
          v21Save('v21_memory', best);
          modal.querySelector('#v21MemInfo').innerHTML = '<span style="color:#4CAF50;font-weight:700">클리어!</span> ' + _memoryState.moves + '수 / ' + elapsed + '초 / 점수: ' + score + ' | 승리: ' + best.gamesWon;
          checkAndAwardV21();
        }
      } else {
        setTimeout(function(){ _memoryState.revealed = []; _memoryState.locked = false; drawMemory(); }, 700);
      }
    }
    modal.querySelector('#v21MemInfo').textContent = '수: ' + _memoryState.moves + ' | 매칭: ' + (_memoryState.matched.length / 2) + '/' + (_memoryState.deck.length / 2);
  };
}

function drawMemory(){
  if(!_memoryState) return;
  var c = document.getElementById('v21MemCanvas'); if(!c) return;
  var ctx = c.getContext('2d'); var dk = isDarkV21();
  var st = _memoryState;
  ctx.clearRect(0,0,580,360);
  ctx.fillStyle = dk ? '#1a1030' : '#FFF8FC'; ctx.fillRect(0,0,580,360);
  var cw = 580 / st.cols, ch = 320 / st.rows;
  for(var r = 0; r < st.rows; r++){
    for(var co = 0; co < st.cols; co++){
      var idx = r * st.cols + co;
      var x = co * cw + 4, y = r * ch + 24, w = cw - 8, h = ch - 8;
      var isRevealed = st.revealed.indexOf(idx) >= 0 || st.matched.indexOf(idx) >= 0;
      if(isRevealed){
        ctx.fillStyle = dk ? 'rgba(255,95,162,.15)' : 'rgba(255,95,162,.08)';
        ctx.beginPath(); ctx.roundRect(x, y, w, h, 10); ctx.fill();
        ctx.strokeStyle = '#FF5FA2'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.roundRect(x, y, w, h, 10); ctx.stroke();
        ctx.font = 'bold ' + Math.min(30, h * 0.4) + 'px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = '#FF5FA2';
        ctx.fillText(st.deck[idx], x + w / 2, y + h / 2);
      } else {
        ctx.fillStyle = dk ? 'rgba(126,87,194,.3)' : 'rgba(126,87,194,.15)';
        ctx.beginPath(); ctx.roundRect(x, y, w, h, 10); ctx.fill();
        ctx.strokeStyle = dk ? 'rgba(255,255,255,.15)' : 'rgba(0,0,0,.1)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.roundRect(x, y, w, h, 10); ctx.stroke();
        ctx.font = 'bold ' + Math.min(24, h * 0.3) + 'px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = dk ? '#666' : '#bbb';
        ctx.fillText('?', x + w / 2, y + h / 2);
      }
    }
  }
  ctx.textBaseline = 'alphabetic';
  ctx.font = '10px sans-serif'; ctx.fillStyle = dk ? '#666' : '#bbb'; ctx.textAlign = 'center';
  ctx.fillText('수: ' + st.moves + ' | 매칭: ' + (st.matched.length / 2) + '/' + (st.deck.length / 2), 290, 355);
}


// ============================================================
// 7. SEASON PASS TRACKER (Canvas 600x380)
// ============================================================
var SEASON_REWARDS_FREE = [
  '10코인','칭호:초보','20코인','오라조각x1','30코인','칭호:탐험가','40코인','오라조각x2','50코인','칭호:전사',
  '60코인','코스튬:기본','70코인','오라조각x3','80코인','칭호:영웅','90코인','코스튬:전투','100코인','칭호:전설',
  '120코인','오라조각x5','150코인','코스튬:빛','200코인','칭호:마스터','250코인','코스튬:왕','300코인','칭호:챔피언'
];
var SEASON_REWARDS_PREM = [
  '50코인','특별칭호','100코인','레어오라','150코인','특별칭호2','200코인','레어오라2','250코인','특별칭호3',
  '300코인','레어코스튬','350코인','레어오라3','400코인','특별칭호4','450코인','레어코스튬2','500코인','특별칭호5',
  '600코인','에픽오라','700코인','에픽코스튬','800코인','전설칭호','900코인','전설코스튬','1000코인','최종보상'
];

function openSeasonPass(){
  var state = v21Load('v21_season', {xp:0,level:0,claimed:[]});
  var html = '<div style="text-align:center;margin-bottom:10px"><canvas id="v21SeasonCanvas" width="600" height="380" style="max-width:100%;border-radius:12px;background:' + (isDarkV21()?'#1a1030':'#FFF8FC') + '"></canvas></div>';
  html += '<div style="display:flex;gap:6px;justify-content:center;margin-bottom:8px">';
  html += '<button id="v21SeasonLeft" style="padding:6px 14px;border-radius:8px;border:none;background:#7E57C2;color:#fff;font-weight:700;cursor:pointer;font-size:12px">◀</button>';
  html += '<button id="v21SeasonRight" style="padding:6px 14px;border-radius:8px;border:none;background:#7E57C2;color:#fff;font-weight:700;cursor:pointer;font-size:12px">▶</button>';
  html += '<button id="v21SeasonAddXP" style="padding:6px 14px;border-radius:8px;border:none;background:#FF5FA2;color:#fff;font-weight:700;cursor:pointer;font-size:12px">+50 XP 테스트</button>';
  html += '</div>';
  html += '<div id="v21SeasonInfo" style="text-align:center;font-size:12px;color:#888">레벨 ' + state.level + '/30 | XP: ' + state.xp + ' | 다음 레벨: ' + (100 + state.level * 20 - state.xp % (100 + state.level * 20)) + 'XP 필요</div>';
  var modal = createV21Modal('🎫 시즌 패스 트래커', html);
  var scrollOff = 0;
  drawSeasonPass(state, scrollOff);

  modal.querySelector('#v21SeasonLeft').onclick = function(){ scrollOff = Math.max(0, scrollOff - 5); drawSeasonPass(state, scrollOff); };
  modal.querySelector('#v21SeasonRight').onclick = function(){ scrollOff = Math.min(24, scrollOff + 5); drawSeasonPass(state, scrollOff); };
  modal.querySelector('#v21SeasonAddXP').onclick = function(){
    state.xp += 50;
    var needed = 100 + state.level * 20;
    while(state.xp >= needed && state.level < 30){ state.xp -= needed; state.level++; needed = 100 + state.level * 20; }
    v21Save('v21_season', state);
    drawSeasonPass(state, scrollOff);
    modal.querySelector('#v21SeasonInfo').textContent = '레벨 ' + state.level + '/30 | XP: ' + state.xp + ' | 다음: ' + (state.level < 30 ? (100 + state.level * 20 - state.xp) + 'XP' : 'MAX');
    checkAndAwardV21();
  };
}

function drawSeasonPass(state, scrollOff){
  var c = document.getElementById('v21SeasonCanvas'); if(!c) return;
  var ctx = c.getContext('2d'); var dk = isDarkV21();
  ctx.clearRect(0,0,600,380);
  ctx.fillStyle = dk ? '#1a1030' : '#FFF8FC'; ctx.fillRect(0,0,600,380);
  ctx.font = 'bold 14px sans-serif'; ctx.fillStyle = dk ? '#FF8EC4' : '#FF5FA2'; ctx.textAlign = 'center';
  ctx.fillText('🎫 시즌 패스 Lv.' + state.level, 300, 22);
  var needed = 100 + state.level * 20;
  var prog = state.level >= 30 ? 1 : state.xp / needed;
  ctx.fillStyle = dk ? '#333' : '#eee'; ctx.beginPath(); ctx.roundRect(50, 32, 500, 14, 7); ctx.fill();
  ctx.fillStyle = '#FF5FA2'; ctx.beginPath(); ctx.roundRect(50, 32, 500 * prog, 14, 7); ctx.fill();
  ctx.font = '9px sans-serif'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
  ctx.fillText(state.level >= 30 ? 'MAX' : state.xp + '/' + needed, 300, 43);

  var visible = 6, cellW = 90;
  var startX = 15;
  ctx.font = 'bold 10px sans-serif'; ctx.fillStyle = '#FFD700'; ctx.textAlign = 'center';
  ctx.fillText('FREE TRACK', 300, 72);
  for(var i = 0; i < visible && (scrollOff + i) < 30; i++){
    var lvl = scrollOff + i;
    var x = startX + i * (cellW + 6);
    var unlocked = lvl < state.level;
    ctx.fillStyle = unlocked ? (dk ? 'rgba(76,175,80,.2)' : 'rgba(76,175,80,.1)') : lvl === state.level ? (dk ? 'rgba(255,95,162,.2)' : 'rgba(255,95,162,.1)') : (dk ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.03)');
    ctx.beginPath(); ctx.roundRect(x, 80, cellW, 90, 8); ctx.fill();
    ctx.strokeStyle = lvl === state.level ? '#FF5FA2' : dk ? 'rgba(255,255,255,.1)' : 'rgba(0,0,0,.08)';
    ctx.lineWidth = lvl === state.level ? 2 : 1; ctx.stroke();
    ctx.font = 'bold 10px sans-serif'; ctx.fillStyle = unlocked ? '#4CAF50' : (dk ? '#aaa' : '#888'); ctx.textAlign = 'center';
    ctx.fillText('Lv.' + (lvl + 1), x + cellW / 2, 96);
    ctx.font = '9px sans-serif'; ctx.fillStyle = dk ? '#ccc' : '#555';
    var reward = SEASON_REWARDS_FREE[lvl] || '???';
    var lines = reward.length > 8 ? [reward.substring(0, 8), reward.substring(8)] : [reward];
    lines.forEach(function(l, li){ ctx.fillText(l, x + cellW / 2, 115 + li * 12); });
    if(unlocked){ ctx.font = '16px sans-serif'; ctx.fillText('✓', x + cellW / 2, 155); }
  }

  ctx.font = 'bold 10px sans-serif'; ctx.fillStyle = '#AB47BC'; ctx.textAlign = 'center';
  ctx.fillText('PREMIUM TRACK', 300, 190);
  for(var i = 0; i < visible && (scrollOff + i) < 30; i++){
    var lvl = scrollOff + i;
    var x = startX + i * (cellW + 6);
    var unlocked = lvl < state.level;
    ctx.fillStyle = unlocked ? (dk ? 'rgba(171,71,188,.2)' : 'rgba(171,71,188,.1)') : (dk ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.03)');
    ctx.beginPath(); ctx.roundRect(x, 198, cellW, 90, 8); ctx.fill();
    ctx.strokeStyle = dk ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.06)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.font = 'bold 10px sans-serif'; ctx.fillStyle = unlocked ? '#AB47BC' : (dk ? '#777' : '#aaa'); ctx.textAlign = 'center';
    ctx.fillText('Lv.' + (lvl + 1), x + cellW / 2, 214);
    ctx.font = '9px sans-serif'; ctx.fillStyle = dk ? '#bbb' : '#666';
    var preward = SEASON_REWARDS_PREM[lvl] || '???';
    var plines = preward.length > 8 ? [preward.substring(0, 8), preward.substring(8)] : [preward];
    plines.forEach(function(l, li){ ctx.fillText(l, x + cellW / 2, 233 + li * 12); });
    if(unlocked){ ctx.font = '16px sans-serif'; ctx.fillText('✓', x + cellW / 2, 273); }
  }

  ctx.font = '9px sans-serif'; ctx.fillStyle = dk ? '#555' : '#ccc'; ctx.textAlign = 'center';
  ctx.fillText('◀ / ▶ 버튼으로 스크롤 | 표시: Lv.' + (scrollOff + 1) + '~' + Math.min(scrollOff + visible, 30), 300, 370);
}


// ============================================================
// 8. TINIPING COOKING CONTEST (Canvas 580x360)
// ============================================================
var COOK_INGREDIENTS = [
  {name:'사랑열매',icon:'❤️',color:'#F44336'},
  {name:'용기씨앗',icon:'🌰',color:'#FF9800'},
  {name:'지혜잎',icon:'🍃',color:'#4CAF50'},
  {name:'활력꽃',icon:'🌸',color:'#E91E63'},
  {name:'행복물',icon:'💧',color:'#2196F3'},
  {name:'평화소금',icon:'🧂',color:'#9E9E9E'},
  {name:'장난후추',icon:'🌶️',color:'#FF5722'},
  {name:'수호허브',icon:'🌿',color:'#66BB6A'}
];
var COOK_RECIPES = [
  {ing:[0,2,4],name:'사랑의 물약',icon:'💖'},
  {ing:[1,3,6],name:'용기의 불꽃',icon:'🔥'},
  {ing:[2,4,5],name:'지혜의 차',icon:'🍵'},
  {ing:[0,3,7],name:'치유의 수프',icon:'🍲'},
  {ing:[1,5,7],name:'수호의 빵',icon:'🍞'},
  {ing:[0,1,2],name:'무지개 케이크',icon:'🎂'},
  {ing:[3,4,6],name:'활력 주스',icon:'🧃'},
  {ing:[5,6,7],name:'장난 쿠키',icon:'🍪'},
  {ing:[0,4,7],name:'별빛 푸딩',icon:'🍮'},
  {ing:[1,2,3],name:'자연의 샐러드',icon:'🥗'}
];

function openCookContest(){
  sfxV21('cook_sizzle');
  var state = v21Load('v21_cook', {discovered:[],totalCooks:0,bestScore:0});
  var html = '<div style="text-align:center;margin-bottom:10px"><canvas id="v21CookCanvas" width="580" height="360" style="max-width:100%;border-radius:12px;background:' + (isDarkV21()?'#1a1030':'#FFF8FC') + '"></canvas></div>';
  html += '<div style="display:flex;gap:4px;flex-wrap:wrap;justify-content:center;margin-bottom:8px">';
  COOK_INGREDIENTS.forEach(function(ing, i){
    html += '<button class="v21cook-ing" data-ci="' + i + '" style="padding:6px 10px;border-radius:10px;border:2px solid ' + ing.color + ';background:none;cursor:pointer;font-size:11px;color:' + (isDarkV21()?'#eee':'#333') + '">' + ing.icon + ing.name + '</button>';
  });
  html += '</div>';
  html += '<div style="text-align:center;margin-bottom:6px"><button id="v21CookBtn" style="padding:8px 24px;border-radius:14px;border:none;background:linear-gradient(135deg,#FF5722,#FF9800);color:#fff;font-weight:700;cursor:pointer;font-size:13px">요리하기</button></div>';
  html += '<div id="v21CookInfo" style="text-align:center;font-size:12px;color:#888">재료 3개를 선택하세요! 레시피 발견: ' + state.discovered.length + '/' + COOK_RECIPES.length + '</div>';
  html += '<div id="v21CookSel" style="text-align:center;font-size:12px;color:#FF5FA2;min-height:20px"></div>';
  var modal = createV21Modal('🍳 티니핑 요리대회', html);
  var selected = [];
  drawCookIdle(state);

  modal.querySelectorAll('.v21cook-ing').forEach(function(b){
    b.onclick = function(){
      var ci = parseInt(b.dataset.ci);
      if(selected.indexOf(ci) >= 0){ selected = selected.filter(function(x){ return x !== ci; }); b.style.background = 'none'; }
      else if(selected.length < 3){ selected.push(ci); b.style.background = 'rgba(255,95,162,.15)'; }
      modal.querySelector('#v21CookSel').textContent = '선택: ' + selected.map(function(s){ return COOK_INGREDIENTS[s].icon; }).join(' + ');
    };
  });

  modal.querySelector('#v21CookBtn').onclick = function(){
    if(selected.length !== 3){ modal.querySelector('#v21CookInfo').textContent = '재료 3개를 선택하세요!'; return; }
    sfxV21('cook_sizzle');
    var sorted = selected.slice().sort(function(a,b){ return a - b; });
    var recipe = null;
    COOK_RECIPES.forEach(function(r){
      if(r.ing[0] === sorted[0] && r.ing[1] === sorted[1] && r.ing[2] === sorted[2]) recipe = r;
    });

    state.totalCooks++;
    drawCookTimer(function(){
      var taste = 1 + Math.floor(Math.random() * 10);
      var visual = 1 + Math.floor(Math.random() * 10);
      var creativity = 1 + Math.floor(Math.random() * 10);
      if(recipe){ taste = Math.min(10, taste + 2); visual = Math.min(10, visual + 2); creativity = Math.min(10, creativity + 2); }
      var total = taste + visual + creativity;
      var rank = total >= 27 ? 'S' : total >= 22 ? 'A' : total >= 17 ? 'B' : total >= 12 ? 'C' : 'D';
      if(total > state.bestScore) state.bestScore = total;
      if(recipe && state.discovered.indexOf(recipe.name) < 0){ state.discovered.push(recipe.name); }
      v21Save('v21_cook', state);

      drawCookResult(recipe, taste, visual, creativity, total, rank, state);
      modal.querySelector('#v21CookInfo').innerHTML = (recipe ? recipe.icon + ' <b>' + recipe.name + '</b> 완성! ' : '알 수 없는 요리 완성! ') + '등급: <b>' + rank + '</b> (' + total + '점) | 발견: ' + state.discovered.length + '/' + COOK_RECIPES.length;
      selected = [];
      modal.querySelectorAll('.v21cook-ing').forEach(function(b2){ b2.style.background = 'none'; });
      modal.querySelector('#v21CookSel').textContent = '';
      checkAndAwardV21();
    });
  };
}

function drawCookIdle(state){
  var c = document.getElementById('v21CookCanvas'); if(!c) return;
  var ctx = c.getContext('2d'); var dk = isDarkV21();
  ctx.clearRect(0,0,580,360);
  ctx.fillStyle = dk ? '#1a1030' : '#FFF8FC'; ctx.fillRect(0,0,580,360);
  ctx.font = 'bold 14px sans-serif'; ctx.fillStyle = dk ? '#FF8EC4' : '#FF5FA2'; ctx.textAlign = 'center';
  ctx.fillText('🍳 티니핑 요리대회', 290, 25);
  ctx.font = '12px sans-serif'; ctx.fillStyle = dk ? '#aaa' : '#888';
  ctx.fillText('재료를 선택하고 요리하세요!', 290, 180);

  ctx.font = 'bold 11px sans-serif'; ctx.fillStyle = dk ? '#ccc' : '#555';
  ctx.fillText('레시피 컬렉션 (' + state.discovered.length + '/' + COOK_RECIPES.length + ')', 290, 220);
  COOK_RECIPES.forEach(function(r, i){
    var x = 30 + (i % 5) * 110, y = 240 + Math.floor(i / 5) * 50;
    var found = state.discovered.indexOf(r.name) >= 0;
    ctx.fillStyle = found ? (dk ? 'rgba(76,175,80,.15)' : 'rgba(76,175,80,.1)') : (dk ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.03)');
    ctx.beginPath(); ctx.roundRect(x, y, 100, 38, 6); ctx.fill();
    ctx.font = '10px sans-serif'; ctx.fillStyle = found ? (dk ? '#ccc' : '#555') : (dk ? '#555' : '#ccc');
    ctx.textAlign = 'center';
    ctx.fillText(found ? r.icon + ' ' + r.name : '???', x + 50, y + 23);
  });
}

function drawCookTimer(callback){
  var c = document.getElementById('v21CookCanvas'); if(!c) return;
  var ctx = c.getContext('2d'); var dk = isDarkV21();
  var start = Date.now(), dur = 1500;
  function frame(){
    var elapsed = Date.now() - start;
    var prog = Math.min(1, elapsed / dur);
    ctx.clearRect(0,0,580,360);
    ctx.fillStyle = dk ? '#1a1030' : '#FFF8FC'; ctx.fillRect(0,0,580,360);
    ctx.font = 'bold 20px sans-serif'; ctx.fillStyle = dk ? '#FF8EC4' : '#FF5FA2'; ctx.textAlign = 'center';
    ctx.fillText('🔥 요리 중...', 290, 150);
    ctx.fillStyle = dk ? '#333' : '#eee'; ctx.beginPath(); ctx.roundRect(100, 180, 380, 24, 12); ctx.fill();
    ctx.fillStyle = '#FF9800'; ctx.beginPath(); ctx.roundRect(100, 180, 380 * prog, 24, 12); ctx.fill();
    ctx.font = 'bold 11px sans-serif'; ctx.fillStyle = '#fff';
    ctx.fillText(Math.round(prog * 100) + '%', 290, 197);
    if(prog < 1) requestAnimationFrame(frame); else callback();
  }
  frame();
}

function drawCookResult(recipe, taste, visual, creativity, total, rank, state){
  var c = document.getElementById('v21CookCanvas'); if(!c) return;
  var ctx = c.getContext('2d'); var dk = isDarkV21();
  ctx.clearRect(0,0,580,360);
  ctx.fillStyle = dk ? '#1a1030' : '#FFF8FC'; ctx.fillRect(0,0,580,360);
  ctx.font = 'bold 16px sans-serif'; ctx.fillStyle = dk ? '#FF8EC4' : '#FF5FA2'; ctx.textAlign = 'center';
  ctx.fillText(recipe ? recipe.icon + ' ' + recipe.name : '🍽️ 알 수 없는 요리', 290, 30);

  var judges = ['맛','비주얼','창의성'];
  var scores = [taste, visual, creativity];
  var colors = ['#F44336','#FF9800','#4CAF50'];
  for(var j = 0; j < 3; j++){
    var y = 60 + j * 50;
    ctx.font = '12px sans-serif'; ctx.fillStyle = dk ? '#ccc' : '#555'; ctx.textAlign = 'left';
    ctx.fillText('심사위원 ' + (j + 1) + ' - ' + judges[j], 50, y + 18);
    ctx.fillStyle = dk ? '#333' : '#eee'; ctx.beginPath(); ctx.roundRect(200, y + 4, 300, 22, 6); ctx.fill();
    ctx.fillStyle = colors[j]; ctx.beginPath(); ctx.roundRect(200, y + 4, 300 * (scores[j] / 10), 22, 6); ctx.fill();
    ctx.font = 'bold 11px sans-serif'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
    ctx.fillText(scores[j] + '/10', 200 + 150, y + 19);
  }

  ctx.font = 'bold 28px sans-serif';
  ctx.fillStyle = rank === 'S' ? '#FFD700' : rank === 'A' ? '#4CAF50' : rank === 'B' ? '#2196F3' : rank === 'C' ? '#FF9800' : '#888';
  ctx.textAlign = 'center';
  ctx.fillText('등급: ' + rank, 290, 250);
  ctx.font = '14px sans-serif'; ctx.fillStyle = dk ? '#ccc' : '#555';
  ctx.fillText('총점: ' + total + '/30', 290, 275);
  ctx.font = '11px sans-serif'; ctx.fillStyle = dk ? '#888' : '#aaa';
  ctx.fillText('최고 점수: ' + state.bestScore + ' | 총 요리: ' + state.totalCooks + ' | 레시피: ' + state.discovered.length + '/' + COOK_RECIPES.length, 290, 340);
}


// ============================================================
// ACHIEVEMENTS (+12, total 190)
// ============================================================
function injectV21Achievements(){
  if(!window.AD) return;
  var newAch = [
    {id:'a_v21_beauty_champ',name:'뷰티 챔피언',desc:'뷰티 콘테스트 5회 진행',cat:'general',icon:'👑'},
    {id:'a_v21_stat_master',name:'스탯 마스터',desc:'총 스탯 50 이상 달성',cat:'general',icon:'💪'},
    {id:'a_v21_aura_fusion',name:'오라 융합사',desc:'오라 융합 5종 발견',cat:'general',icon:'✨'},
    {id:'a_v21_dungeon_clear',name:'던전 정복자',desc:'던전 1회 클리어',cat:'general',icon:'🏰'},
    {id:'a_v21_gene_researcher',name:'유전 연구원',desc:'교배 10회 수행',cat:'general',icon:'🧬'},
    {id:'a_v21_memory_ace',name:'메모리 에이스',desc:'메모리 게임 5회 승리',cat:'general',icon:'🃏'},
    {id:'a_v21_season_10',name:'시즌 10',desc:'시즌 패스 레벨 10 달성',cat:'general',icon:'🎫'},
    {id:'a_v21_chef_master',name:'요리 마스터',desc:'레시피 5종 발견',cat:'general',icon:'🍳'},
    {id:'a_v21_quiz_clear',name:'퀴즈 v21',desc:'v21 퀴즈 정답 경험',cat:'general',icon:'❓'},
    {id:'a_v21_quiz_s',name:'퀴즈 천재 v21',desc:'퀴즈 S등급 달성',cat:'general',icon:'🏅'},
    {id:'a_v21_explorer',name:'v21 탐험가',desc:'v21 기능 4개 이상 사용',cat:'general',icon:'🗺️'},
    {id:'a_v21_complete',name:'v21 컴플리트',desc:'v21 모든 기능 체험',cat:'general',icon:'🌟'}
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
// QUIZ V21 (+15 questions, 180->195)
// ============================================================
function injectExtraQuizV21(){
  if(!window.quizPool && !window.QUIZ_POOL) return;
  var pool = window.quizPool || window.QUIZ_POOL;
  var newQ = [
    {q:'뷰티 콘테스트의 심사 기준은 총 몇 가지?',a:['3','4','5','6'],c:2},
    {q:'뷰티 콘테스트 참가자는 총 몇 명?',a:['4','6','8','10'],c:2},
    {q:'스탯 훈련의 집중훈련은 한 스탯을 얼마나 올리나?',a:['+1','+2','+3','+5'],c:2},
    {q:'스탯 등급 S는 총 스탯 몇 이상?',a:['45','50','55','60'],c:2},
    {q:'불+물 오라 융합의 결과는?',a:['화염폭풍','증기','서리','뇌운'],c:1},
    {q:'번개+얼음 오라 융합 이름은?',a:['빙뢰','서리','뇌운','암뇌'],c:0},
    {q:'던전 탐험은 총 몇 층?',a:['5','8','10','15'],c:2},
    {q:'던전에서 보물을 발견하면 얻는 것은?',a:['HP','골드','경험치','아이템'],c:1},
    {q:'유전 형질 연구소의 형질 종류는?',a:['4','6','8','10'],c:2},
    {q:'메모리 게임 Normal 난이도의 카드 배열은?',a:['3x4','4x4','5x4','6x4'],c:1},
    {q:'시즌 패스의 최대 레벨은?',a:['20','25','30','50'],c:2},
    {q:'요리대회의 총 레시피 수는?',a:['6','8','10','12'],c:2},
    {q:'요리대회 S등급 점수 기준은?',a:['25이상','27이상','28이상','30'],c:1},
    {q:'요리대회 심사 기준은?',a:['맛/비주얼/창의성','맛/양/속도','맛/영양/위생','맛/가격/속도'],c:0},
    {q:'v21에서 추가된 업적 수는?',a:['8','10','12','15'],c:2}
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
// CHECK AND AWARD ACHIEVEMENTS
// ============================================================
function checkAndAwardV21(){
  var beauty = v21Load('v21_beauty', {wins:{},totalContests:0});
  var stats = v21Load('v21_stats', {levels:[1,1,1,1,1,1]});
  var aura = v21Load('v21_aura', {fusions:[]});
  var dungeon = v21Load('v21_dungeon', {clears:0});
  var gene = v21Load('v21_gene', {count:0});
  var memory = v21Load('v21_memory', {gamesWon:0});
  var season = v21Load('v21_season', {level:0});
  var cook = v21Load('v21_cook', {discovered:[]});

  var totalStats = 0;
  if(stats.levels) for(var i=0;i<stats.levels.length;i++) totalStats += stats.levels[i];

  var featuresUsed = 0;
  if(beauty.totalContests > 0) featuresUsed++;
  if(totalStats > 6) featuresUsed++;
  if(aura.fusions && aura.fusions.length > 0) featuresUsed++;
  if(dungeon.clears > 0) featuresUsed++;
  if(gene.count > 0) featuresUsed++;
  if(memory.gamesWon > 0) featuresUsed++;
  if(season.level > 0) featuresUsed++;
  if(cook.totalCooks > 0) featuresUsed++;

  var checks = [
    {id:'a_v21_beauty_champ', cond: beauty.totalContests >= 5},
    {id:'a_v21_stat_master', cond: totalStats >= 50},
    {id:'a_v21_aura_fusion', cond: (aura.fusions||[]).length >= 5},
    {id:'a_v21_dungeon_clear', cond: dungeon.clears >= 1},
    {id:'a_v21_gene_researcher', cond: gene.count >= 10},
    {id:'a_v21_memory_ace', cond: memory.gamesWon >= 5},
    {id:'a_v21_season_10', cond: season.level >= 10},
    {id:'a_v21_chef_master', cond: (cook.discovered||[]).length >= 5},
    {id:'a_v21_explorer', cond: featuresUsed >= 4},
    {id:'a_v21_complete', cond: featuresUsed >= 8}
  ];

  checks.forEach(function(ch){
    if(ch.cond){
      try{
        var a = JSON.parse(localStorage.getItem('hatcuping_achievements') || '{}');
        if(!a[ch.id]){
          a[ch.id] = Date.now();
          localStorage.setItem('hatcuping_achievements', JSON.stringify(a));
          var ad = window.AD ? window.AD.find(function(x){ return x.id === ch.id; }) : null;
          if(ad) showToastV21('🏆 ' + ad.name + ' 업적 달성!');
        }
      }catch(e){}
    }
  });
}


// ============================================================
// KEYBOARD SHORTCUTS (Shift+1~8 via e.code)
// ============================================================
function injectV21Keyboard(){
  document.addEventListener('keydown', function(e){
    if(e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
    if(!e.shiftKey) return;
    switch(e.code){
      case 'Digit1': e.preventDefault(); openBeautyContest(); break;
      case 'Digit2': e.preventDefault(); openStatTrainer(); break;
      case 'Digit3': e.preventDefault(); openAuraCustomizer(); break;
      case 'Digit4': e.preventDefault(); openDungeon(); break;
      case 'Digit5': e.preventDefault(); openGeneLab(); break;
      case 'Digit6': e.preventDefault(); openMemoryGame(); break;
      case 'Digit7': e.preventDefault(); openSeasonPass(); break;
      case 'Digit8': e.preventDefault(); openCookContest(); break;
    }
  });
}


// ============================================================
// BOTTOM NAVIGATION (append to existing v18 nav, NO new fixed bar)
// ============================================================
function injectV21BottomNav(){
  var existingNav = document.getElementById('v18BottomNav');
  if(!existingNav) return;

  var buttons = [
    {icon:'👑',label:'뷰티',action:openBeautyContest},
    {icon:'💪',label:'훈련',action:openStatTrainer},
    {icon:'✨',label:'오라',action:openAuraCustomizer},
    {icon:'🏰',label:'던전',action:openDungeon},
    {icon:'🧬',label:'유전',action:openGeneLab},
    {icon:'🃏',label:'메모리',action:openMemoryGame},
    {icon:'🎫',label:'시즌',action:openSeasonPass},
    {icon:'🍳',label:'요리',action:openCookContest}
  ];

  buttons.forEach(function(b){
    var btn = document.createElement('button');
    btn.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:2px;background:none;border:none;cursor:pointer;padding:4px 6px;border-radius:8px;transition:all .2s';
    btn.innerHTML = '<span style="font-size:18px">' + b.icon + '</span><span style="font-size:9px;font-weight:700;color:var(--text-sub)">' + b.label + '</span>';
    btn.onmouseenter = function(){ btn.style.background = 'rgba(255,95,162,.1)'; };
    btn.onmouseleave = function(){ btn.style.background = 'none'; };
    btn.onclick = function(){ sfxV21('v21_nav'); b.action(); };
    existingNav.appendChild(btn);
  });
}


// ============================================================
// FOOTER, NEWS, META UPDATE
// ============================================================
function updateV21Footer(){
  var ver = document.querySelector('.footer .version');
  if(ver) ver.textContent = 'v21.0 | © PRIME Holdings NEXTERA+PRISM';

  var links = document.querySelector('.footer-links');
  if(links) links.innerHTML = '<span class="footer-link">4종 게임</span><span class="footer-link">190개 업적</span><span class="footer-link">뷰티+훈련+오라</span><span class="footer-link">던전+유전+메모리</span><span class="footer-link">퀴즈 195문</span>';
}

function updateV21News(){
  var newsSection = document.querySelector('.news-section');
  if(!newsSection) return;
  var firstItem = newsSection.querySelector('.news-item');
  if(!firstItem) return;
  var newItem = document.createElement('div');
  newItem.className = 'news-item';
  newItem.innerHTML = '<span class="news-date">v21.0</span><span class="news-text">뷰티콘테스트8인Canvas, 스탯훈련매니저RadarCanvas, 마법오라커스터마이저10융합Canvas, 던전탐험로그10층Canvas, 유전형질연구소8형질Canvas, 배틀메모리게임3난이도Canvas, 시즌패스트래커30레벨Canvas, 요리대회10레시피Canvas, 퀴즈+15(195), 업적+12(190)</span>';
  firstItem.parentNode.insertBefore(newItem, firstItem);
}

function updateV21AchieveCount(){
  var el = document.getElementById('achieveCount');
  if(el){
    var c = 0;
    try{ c = Object.keys(JSON.parse(localStorage.getItem('hatcuping_achievements') || '{}')).length; }catch(e){}
    var t = window.AD ? window.AD.length : 190;
    el.textContent = c + '/' + t;
  }
}

function updateV21Meta(){
  var descMeta = document.querySelector('meta[name="description"]');
  if(descMeta) descMeta.content = '사랑의 하츄핑 v21.0 - 플랫포머 액션, 턴제 RPG, 오픈월드, UNIFIED 4종 게임. 업적 190개, 뷰티콘테스트8인Canvas, 스탯훈련RadarCanvas, 오라커스터마이저10융합Canvas, 던전탐험10층Canvas, 유전형질8형질Canvas, 메모리게임3난이도Canvas, 시즌패스30레벨Canvas, 요리대회10레시피Canvas, 퀴즈 195문!';
  document.title = '사랑의 하츄핑 v21.0 - 게임 선택';
}


// ============================================================
// BOOT
// ============================================================
function bootV21(){
  injectV21Achievements();
  injectExtraQuizV21();
  injectV21Keyboard();
  injectV21BottomNav();
  updateV21Footer();
  updateV21News();
  updateV21AchieveCount();
  updateV21Meta();
  checkAndAwardV21();
}

if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', bootV21);
} else {
  bootV21();
}

})();

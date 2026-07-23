// hatcuping-game v23_patch.js - NEXTERA+PRISM AUTO v23.0
// Self-contained IIFE patch module
(function(){
'use strict';

var _v23Ctx = null;
function _v23InitAudio(){
  if(!_v23Ctx){
    try{ _v23Ctx = new (window.AudioContext || window.webkitAudioContext)(); }catch(e){}
  }
  if(_v23Ctx && _v23Ctx.state === 'suspended') _v23Ctx.resume();
}

var V23_SFX = {
  roulette_spin:{f:660,d:.06,t:'triangle'},
  roulette_stop:{f:1320,d:.18,t:'sine'},
  combo_chain:{f:880,d:.1,t:'triangle'},
  combo_master:{f:1100,d:.2,t:'sine'},
  bond_grow:{f:550,d:.12,t:'sine'},
  bond_max:{f:1200,d:.22,t:'triangle'},
  evolution_glow:{f:770,d:.15,t:'sine'},
  evolution_complete:{f:1400,d:.25,t:'triangle'},
  diff_scan:{f:440,d:.08,t:'square'},
  diff_rank:{f:990,d:.12,t:'sine'},
  predict_calc:{f:600,d:.06,t:'square'},
  predict_result:{f:1050,d:.15,t:'triangle'},
  charge_up:{f:330,d:.1,t:'sine'},
  charge_full:{f:1500,d:.3,t:'triangle'},
  board_update:{f:500,d:.05,t:'sine'},
  board_rank:{f:1100,d:.12,t:'triangle'},
  v23_nav:{f:720,d:.05,t:'sine'},
  v23_quiz:{f:900,d:.08,t:'triangle'}
};

function sfxV23(type){
  _v23InitAudio();
  if(!_v23Ctx) return;
  var s = V23_SFX[type];
  if(!s) return;
  try{
    var muted = false;
    try{ muted = localStorage.getItem('hatcuping_mute') === '1'; }catch(e){}
    if(muted) return;
    var osc = _v23Ctx.createOscillator();
    var gain = _v23Ctx.createGain();
    osc.type = s.t || 'sine';
    osc.frequency.value = s.f;
    gain.gain.value = 0.08;
    osc.connect(gain);
    gain.connect(_v23Ctx.destination);
    osc.start();
    osc.stop(_v23Ctx.currentTime + (s.d || 0.06));
  }catch(e){}
}

function v23Load(key, fb){ try{ var d = JSON.parse(localStorage.getItem(key)); return d !== null ? d : fb; }catch(e){ return fb; } }
function v23Save(key, data){ try{ localStorage.setItem(key, JSON.stringify(data)); }catch(e){} }
function isDarkV23(){ return document.body.classList.contains('dark'); }
function showToastV23(msg){
  var t = document.getElementById('achieveToast');
  if(t){ t.innerHTML = msg; t.classList.add('show'); setTimeout(function(){ t.classList.remove('show'); }, 2500); }
}

function createV23Modal(title, contentHTML){
  var overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.6);z-index:9999;display:flex;justify-content:center;align-items:center;backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px)';
  var modal = document.createElement('div');
  var bg = isDarkV23() ? '#2a1a3e' : '#fff';
  var col = isDarkV23() ? '#eee' : '#333';
  modal.style.cssText = 'background:' + bg + ';color:' + col + ';border-radius:24px;padding:24px;max-width:680px;width:94%;max-height:85vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.25);position:relative';
  modal.innerHTML = '<button style="position:absolute;top:12px;right:16px;background:none;border:none;font-size:24px;cursor:pointer;color:' + col + '" onclick="this.closest(\'div[style]\').parentElement.remove()">&times;</button><h3 style="font-size:18px;margin-bottom:16px;color:#FF5FA2">' + title + '</h3>' + contentHTML;
  overlay.appendChild(modal);
  overlay.addEventListener('click', function(e){ if(e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
  return modal;
}


// ============================================================
// 1. ADVENTURE CHALLENGE ROULETTE (Canvas 620x400)
// ============================================================
var ROULETTE_CHALLENGES = [
  {name:'3스테이지 무피해',icon:'🛡️',diff:'hard',reward:120,desc:'어떤 피해도 받지 않고 3스테이지 클리어'},
  {name:'스피드런 60초',icon:'⚡',diff:'hard',reward:150,desc:'60초 내에 스테이지 클리어'},
  {name:'코인 50개 수집',icon:'💰',diff:'normal',reward:80,desc:'한 스테이지에서 코인 50개 이상 수집'},
  {name:'보스 1턴킬',icon:'🗡️',diff:'extreme',reward:200,desc:'보스를 한 턴 만에 처치'},
  {name:'전 캐릭 사용',icon:'👥',diff:'normal',reward:90,desc:'4명의 캐릭터를 모두 사용하여 클리어'},
  {name:'점프 없이 클리어',icon:'🚶',diff:'extreme',reward:250,desc:'점프를 사용하지 않고 스테이지 클리어'},
  {name:'아이템 미사용',icon:'🚫',diff:'hard',reward:130,desc:'아이템 없이 스테이지 클리어'},
  {name:'더블점프 10회',icon:'🦘',diff:'easy',reward:50,desc:'한 스테이지에서 더블점프 10회 사용'},
  {name:'콤보 15회',icon:'🔥',diff:'normal',reward:100,desc:'전투에서 콤보 15회 달성'},
  {name:'5분 생존',icon:'⏰',diff:'easy',reward:60,desc:'보스전에서 5분 이상 생존'},
  {name:'비밀통로 발견',icon:'🔍',diff:'normal',reward:110,desc:'히든 루트 1개 이상 발견'},
  {name:'대시 30회',icon:'💨',diff:'easy',reward:40,desc:'한 스테이지에서 대시 30회 사용'}
];

function renderChallengeRoulette(){
  var saved = v23Load('v23_roulette', {spins:0, completed:[], history:[]});
  var html = '<div style="text-align:center;margin-bottom:12px"><canvas id="v23RouletteCanvas" width="620" height="400" style="max-width:100%;border-radius:12px;background:' + (isDarkV23()?'#1a0a2e':'#FFF0F8') + '"></canvas></div>';
  html += '<div style="text-align:center;margin-bottom:8px"><button id="v23SpinBtn" style="padding:10px 28px;background:linear-gradient(135deg,#FF5FA2,#B066FF);color:#fff;border:none;border-radius:16px;font-size:14px;font-weight:700;cursor:pointer">🎰 룰렛 돌리기!</button></div>';
  html += '<div style="font-size:12px;color:' + (isDarkV23()?'#aaa':'#888') + ';text-align:center">총 ' + saved.spins + '회 스핀 | 완료 ' + saved.completed.length + '/' + ROULETTE_CHALLENGES.length + '</div>';
  var modal = createV23Modal('🎰 모험 챌린지 룰렛', html);
  sfxV23('v23_nav');

  var canvas = document.getElementById('v23RouletteCanvas');
  if(!canvas) return;
  var ctx = canvas.getContext('2d');
  var spinning = false, angle = 0, targetAngle = 0, currentAngle = 0;
  var colors = ['#FF5FA2','#42A5F5','#FFD700','#4CAF50','#E91E63','#9C27B0','#FF9800','#00BCD4','#F44336','#8BC34A','#FF6B35','#6366F1'];

  function drawWheel(a){
    var cx = 200, cy = 200, r = 170;
    var dk = isDarkV23();
    ctx.clearRect(0, 0, 620, 400);
    ctx.fillStyle = dk ? '#1a0a2e' : '#FFF0F8';
    ctx.fillRect(0, 0, 620, 400);

    var sliceAngle = (2 * Math.PI) / ROULETTE_CHALLENGES.length;
    for(var i = 0; i < ROULETTE_CHALLENGES.length; i++){
      var startA = a + i * sliceAngle;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, startA, startA + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = colors[i % colors.length];
      ctx.fill();
      ctx.strokeStyle = dk ? '#2a1a3e' : '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(startA + sliceAngle / 2);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(ROULETTE_CHALLENGES[i].icon, r * 0.65, 4);
      ctx.restore();
    }

    ctx.beginPath();
    ctx.arc(cx, cy, 25, 0, Math.PI * 2);
    ctx.fillStyle = dk ? '#3a2a5e' : '#fff';
    ctx.fill();
    ctx.strokeStyle = '#FF5FA2';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#FF5FA2';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SPIN', cx, cy + 5);

    ctx.beginPath();
    ctx.moveTo(cx + r + 10, cy);
    ctx.lineTo(cx + r + 25, cy - 10);
    ctx.lineTo(cx + r + 25, cy + 10);
    ctx.closePath();
    ctx.fillStyle = '#FF5FA2';
    ctx.fill();

    var selIdx = Math.floor(((2 * Math.PI - (a % (2 * Math.PI))) / sliceAngle) % ROULETTE_CHALLENGES.length);
    var sel = ROULETTE_CHALLENGES[selIdx];
    var infoX = 430, infoY = 30;
    ctx.fillStyle = dk ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.04)';
    ctx.beginPath();
    ctx.roundRect(infoX, infoY, 180, 340, 12);
    ctx.fill();

    ctx.fillStyle = dk ? '#eee' : '#333';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('선택된 챌린지', infoX + 90, infoY + 25);
    ctx.font = '32px sans-serif';
    ctx.fillText(sel.icon, infoX + 90, infoY + 65);
    ctx.font = 'bold 13px sans-serif';
    ctx.fillStyle = '#FF5FA2';
    ctx.fillText(sel.name, infoX + 90, infoY + 90);

    var diffColors = {easy:'#4CAF50',normal:'#FF9800',hard:'#F44336',extreme:'#9C27B0'};
    var diffNames = {easy:'쉬움',normal:'보통',hard:'어려움',extreme:'극한'};
    ctx.fillStyle = diffColors[sel.diff] || '#888';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('난이도: ' + (diffNames[sel.diff] || sel.diff), infoX + 90, infoY + 112);
    ctx.fillStyle = '#FFD700';
    ctx.fillText('보상: ' + sel.reward + 'pt', infoX + 90, infoY + 130);

    ctx.fillStyle = dk ? '#bbb' : '#666';
    ctx.font = '11px sans-serif';
    var words = sel.desc.split('');
    var line = '', ly = infoY + 155;
    for(var w = 0; w < words.length; w++){
      var test = line + words[w];
      if(ctx.measureText(test).width > 160){ ctx.fillText(line, infoX + 90, ly); ly += 15; line = words[w]; }
      else line = test;
    }
    if(line) ctx.fillText(line, infoX + 90, ly);

    var completed = saved.completed.indexOf(sel.name) >= 0;
    if(completed){
      ctx.fillStyle = '#4CAF50';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('✅ 완료!', infoX + 90, infoY + 220);
    }

    ctx.fillStyle = dk ? '#aaa' : '#888';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('히스토리:', infoX + 10, infoY + 255);
    var hist = saved.history.slice(-4);
    for(var h = 0; h < hist.length; h++){
      ctx.fillStyle = dk ? '#bbb' : '#666';
      ctx.fillText((h+1) + '. ' + hist[h], infoX + 10, infoY + 275 + h * 16);
    }
  }

  drawWheel(0);

  var spinBtn = document.getElementById('v23SpinBtn');
  if(spinBtn){
    spinBtn.addEventListener('click', function(){
      if(spinning) return;
      spinning = true;
      sfxV23('roulette_spin');
      var totalSpin = Math.PI * 6 + Math.random() * Math.PI * 4;
      var startAngle = currentAngle;
      var endAngle = startAngle + totalSpin;
      var startTime = Date.now();
      var duration = 3000;

      function animSpin(){
        var elapsed = Date.now() - startTime;
        var progress = Math.min(elapsed / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        currentAngle = startAngle + (endAngle - startAngle) * eased;
        drawWheel(currentAngle);
        if(progress < 1){
          requestAnimationFrame(animSpin);
        } else {
          spinning = false;
          saved.spins++;
          var sliceAngle = (2 * Math.PI) / ROULETTE_CHALLENGES.length;
          var selIdx = Math.floor(((2 * Math.PI - (currentAngle % (2 * Math.PI))) / sliceAngle) % ROULETTE_CHALLENGES.length);
          var sel = ROULETTE_CHALLENGES[selIdx];
          saved.history.push(sel.name);
          if(saved.history.length > 20) saved.history = saved.history.slice(-20);
          v23Save('v23_roulette', saved);
          sfxV23('roulette_stop');
          showToastV23('🎰 ' + sel.name + ' 챌린지 선택!');
        }
      }
      requestAnimationFrame(animSpin);
    });
  }
}


// ============================================================
// 2. BATTLE COMBO TREE VISUALIZER (Canvas 640x420)
// ============================================================
var COMBO_NODES = [
  {id:0,name:'기본공격',icon:'👊',x:320,y:30,children:[1,2,3],color:'#FF5FA2'},
  {id:1,name:'연속타',icon:'💥',x:120,y:110,children:[4,5],color:'#F44336'},
  {id:2,name:'마법공격',icon:'✨',x:320,y:110,children:[5,6],color:'#9C27B0'},
  {id:3,name:'방어반격',icon:'🛡️',x:520,y:110,children:[6,7],color:'#42A5F5'},
  {id:4,name:'메가펀치',icon:'🔥',x:60,y:210,children:[8],color:'#FF9800'},
  {id:5,name:'마법연쇄',icon:'⚡',x:220,y:210,children:[8,9],color:'#FFD700'},
  {id:6,name:'가드브레이크',icon:'💫',x:380,y:210,children:[9,10],color:'#4CAF50'},
  {id:7,name:'카운터',icon:'🌀',x:540,y:210,children:[10],color:'#00BCD4'},
  {id:8,name:'궁극기A',icon:'🌟',x:140,y:320,children:[11],color:'#E91E63'},
  {id:9,name:'궁극기B',icon:'💎',x:320,y:320,children:[11],color:'#6366F1'},
  {id:10,name:'궁극기C',icon:'🔱',x:500,y:320,children:[11],color:'#FF6B35'},
  {id:11,name:'하츄핑 피니시',icon:'💖',x:320,y:400,children:[],color:'#FF5FA2'}
];

function renderComboTree(){
  var saved = v23Load('v23_combotree', {unlocked:[0], selected:-1, totalDmg:0});
  var html = '<div style="text-align:center;margin-bottom:8px"><canvas id="v23ComboCanvas" width="640" height="420" style="max-width:100%;border-radius:12px;background:' + (isDarkV23()?'#1a0a2e':'#FFF0F8') + '"></canvas></div>';
  html += '<div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">';
  html += '<button id="v23ComboReset" style="padding:6px 16px;background:#F44336;color:#fff;border:none;border-radius:12px;font-size:12px;cursor:pointer">초기화</button>';
  html += '<button id="v23ComboUnlockAll" style="padding:6px 16px;background:#4CAF50;color:#fff;border:none;border-radius:12px;font-size:12px;cursor:pointer">전체 해금</button>';
  html += '</div>';
  html += '<div style="font-size:11px;color:' + (isDarkV23()?'#aaa':'#888') + ';text-align:center;margin-top:6px">노드를 클릭하여 해금 | 해금: ' + saved.unlocked.length + '/' + COMBO_NODES.length + '</div>';
  var modal = createV23Modal('⚔️ 전투 콤보 트리', html);
  sfxV23('v23_nav');

  var canvas = document.getElementById('v23ComboCanvas');
  if(!canvas) return;
  var ctx = canvas.getContext('2d');

  function drawTree(){
    var dk = isDarkV23();
    ctx.clearRect(0, 0, 640, 420);
    ctx.fillStyle = dk ? '#1a0a2e' : '#FFF0F8';
    ctx.fillRect(0, 0, 640, 420);

    for(var i = 0; i < COMBO_NODES.length; i++){
      var node = COMBO_NODES[i];
      for(var c = 0; c < node.children.length; c++){
        var child = COMBO_NODES[node.children[c]];
        var bothUnlocked = saved.unlocked.indexOf(node.id) >= 0 && saved.unlocked.indexOf(child.id) >= 0;
        ctx.beginPath();
        ctx.moveTo(node.x, node.y);
        ctx.lineTo(child.x, child.y);
        ctx.strokeStyle = bothUnlocked ? node.color : (dk ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.08)');
        ctx.lineWidth = bothUnlocked ? 3 : 1.5;
        ctx.stroke();
      }
    }

    for(var i = 0; i < COMBO_NODES.length; i++){
      var node = COMBO_NODES[i];
      var unlocked = saved.unlocked.indexOf(node.id) >= 0;
      var r = node.id === 11 ? 28 : 22;

      ctx.beginPath();
      ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
      if(unlocked){
        ctx.fillStyle = node.color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else {
        ctx.fillStyle = dk ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.04)';
        ctx.fill();
        ctx.strokeStyle = dk ? 'rgba(255,255,255,.15)' : 'rgba(0,0,0,.1)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      ctx.font = (node.id === 11 ? '20px' : '16px') + ' sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(unlocked ? node.icon : '🔒', node.x, node.y + 5);

      ctx.fillStyle = unlocked ? (dk ? '#eee' : '#333') : (dk ? '#666' : '#bbb');
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText(unlocked ? node.name : '???', node.x, node.y + r + 14);
    }

    ctx.fillStyle = dk ? '#eee' : '#333';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('콤보 트리 진행: ' + saved.unlocked.length + '/' + COMBO_NODES.length, 10, 16);
    var pct = Math.round(saved.unlocked.length / COMBO_NODES.length * 100);
    ctx.fillStyle = dk ? 'rgba(255,255,255,.1)' : 'rgba(0,0,0,.06)';
    ctx.beginPath(); ctx.roundRect(10, 22, 200, 8, 4); ctx.fill();
    ctx.fillStyle = '#FF5FA2';
    ctx.beginPath(); ctx.roundRect(10, 22, pct * 2, 8, 4); ctx.fill();
  }

  drawTree();

  canvas.addEventListener('click', function(e){
    var rect = canvas.getBoundingClientRect();
    var scaleX = 640 / rect.width;
    var mx = (e.clientX - rect.left) * scaleX;
    var my = (e.clientY - rect.top) * (420 / rect.height);
    for(var i = 0; i < COMBO_NODES.length; i++){
      var node = COMBO_NODES[i];
      var dx = mx - node.x, dy = my - node.y;
      if(dx*dx + dy*dy < 900){
        if(saved.unlocked.indexOf(node.id) >= 0) break;
        var canUnlock = false;
        for(var p = 0; p < COMBO_NODES.length; p++){
          if(COMBO_NODES[p].children.indexOf(node.id) >= 0 && saved.unlocked.indexOf(p) >= 0){
            canUnlock = true; break;
          }
        }
        if(node.id === 0) canUnlock = true;
        if(canUnlock){
          saved.unlocked.push(node.id);
          v23Save('v23_combotree', saved);
          sfxV23('combo_chain');
          showToastV23('⚔️ ' + node.name + ' 해금!');
          drawTree();
        }
        break;
      }
    }
  });

  var resetBtn = document.getElementById('v23ComboReset');
  if(resetBtn) resetBtn.addEventListener('click', function(){ saved.unlocked = [0]; v23Save('v23_combotree', saved); drawTree(); sfxV23('v23_nav'); });
  var unlockBtn = document.getElementById('v23ComboUnlockAll');
  if(unlockBtn) unlockBtn.addEventListener('click', function(){ saved.unlocked = COMBO_NODES.map(function(n){return n.id}); v23Save('v23_combotree', saved); drawTree(); sfxV23('combo_master'); showToastV23('⚔️ 전체 콤보 해금!'); });
}


// ============================================================
// 3. CHARACTER BOND TRACKER (Canvas 600x380)
// ============================================================
var BOND_PAIRS = [
  {a:'하츄핑',b:'로미',icon:'💖',bond:95,maxBond:100,events:['첫만남','함께 모험','우정의 힘']},
  {a:'바로핑',b:'로미',icon:'⚖️',bond:78,maxBond:100,events:['의리 대결','함께 훈련']},
  {a:'차핑',b:'로미',icon:'🍵',bond:82,maxBond:100,events:['티타임','힐링 케어','마음치유']},
  {a:'해핑',b:'로미',icon:'😄',bond:88,maxBond:100,events:['웃음 폭발','긍정 에너지']},
  {a:'라라핑',b:'로미',icon:'🎵',bond:72,maxBond:100,events:['음악 세션','듀엣 공연']},
  {a:'티카핑',b:'로미',icon:'✏️',bond:65,maxBond:100,events:['공부 도움','시험 준비']},
  {a:'하츄핑',b:'바로핑',icon:'🤝',bond:90,maxBond:100,events:['라이벌','최강 듀오','합체기']},
  {a:'하츄핑',b:'해핑',icon:'😊',bond:85,maxBond:100,events:['장난치기','함께 웃기']},
  {a:'차핑',b:'해핑',icon:'☕',bond:70,maxBond:100,events:['차 한잔','힐링타임']},
  {a:'라라핑',b:'해핑',icon:'🎶',bond:75,maxBond:100,events:['합창','공연 준비']}
];

function renderBondTracker(){
  var saved = v23Load('v23_bonds', {levels: BOND_PAIRS.map(function(p){return p.bond}), interactions: 0});
  var html = '<div style="text-align:center;margin-bottom:8px"><canvas id="v23BondCanvas" width="600" height="380" style="max-width:100%;border-radius:12px;background:' + (isDarkV23()?'#1a0a2e':'#FFF0F8') + '"></canvas></div>';
  html += '<div style="text-align:center"><button id="v23BondBoost" style="padding:8px 20px;background:linear-gradient(135deg,#FF5FA2,#FFD700);color:#fff;border:none;border-radius:14px;font-size:12px;font-weight:700;cursor:pointer">💕 우정 강화!</button></div>';
  html += '<div style="font-size:11px;color:' + (isDarkV23()?'#aaa':'#888') + ';text-align:center;margin-top:6px">총 교류 ' + saved.interactions + '회</div>';
  var modal = createV23Modal('💕 캐릭터 유대감 트래커', html);
  sfxV23('v23_nav');

  var canvas = document.getElementById('v23BondCanvas');
  if(!canvas) return;
  var ctx = canvas.getContext('2d');

  function drawBonds(){
    var dk = isDarkV23();
    ctx.clearRect(0, 0, 600, 380);
    ctx.fillStyle = dk ? '#1a0a2e' : '#FFF0F8';
    ctx.fillRect(0, 0, 600, 380);

    ctx.fillStyle = dk ? '#eee' : '#333';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('캐릭터 유대감 현황', 300, 22);

    var barW = 260, barH = 16, startX = 220, startY = 45;
    var rankColors = {S:'#FFD700',A:'#FF5FA2',B:'#42A5F5',C:'#4CAF50',D:'#FF9800'};

    for(var i = 0; i < BOND_PAIRS.length; i++){
      var pair = BOND_PAIRS[i];
      var level = Math.min(saved.levels[i] || pair.bond, 100);
      var y = startY + i * 32;
      var rank = level >= 95 ? 'S' : level >= 80 ? 'A' : level >= 60 ? 'B' : level >= 40 ? 'C' : 'D';

      ctx.fillStyle = dk ? '#bbb' : '#555';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(pair.icon + ' ' + pair.a + ' × ' + pair.b, startX - 10, y + 12);

      ctx.fillStyle = dk ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.04)';
      ctx.beginPath(); ctx.roundRect(startX, y, barW, barH, 8); ctx.fill();

      var grad = ctx.createLinearGradient(startX, 0, startX + barW * level / 100, 0);
      grad.addColorStop(0, '#FF5FA2');
      grad.addColorStop(1, '#FFD700');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.roundRect(startX, y, barW * level / 100, barH, 8); ctx.fill();

      ctx.fillStyle = rankColors[rank];
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(rank + ' ' + level + '%', startX + barW + 8, y + 13);

      if(level >= 95){
        ctx.fillStyle = '#FFD700';
        ctx.font = '10px sans-serif';
        ctx.fillText('★MAX', startX + barW + 50, y + 13);
      }
    }

    var evY = startY + BOND_PAIRS.length * 32 + 15;
    ctx.fillStyle = dk ? '#eee' : '#333';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('최근 이벤트 기록', 300, evY);

    var maxBondIdx = 0, maxBondVal = 0;
    for(var i = 0; i < saved.levels.length; i++){
      if(saved.levels[i] > maxBondVal){ maxBondVal = saved.levels[i]; maxBondIdx = i; }
    }
    var bestPair = BOND_PAIRS[maxBondIdx];
    ctx.fillStyle = dk ? '#bbb' : '#666';
    ctx.font = '11px sans-serif';
    ctx.fillText('최고 유대: ' + bestPair.a + ' × ' + bestPair.b + ' (' + maxBondVal + '%)', 300, evY + 18);

    var avgBond = Math.round(saved.levels.reduce(function(a,b){return a+b},0) / saved.levels.length);
    ctx.fillText('평균 유대감: ' + avgBond + '% | 총 교류: ' + saved.interactions + '회', 300, evY + 36);
  }

  drawBonds();

  var boostBtn = document.getElementById('v23BondBoost');
  if(boostBtn){
    boostBtn.addEventListener('click', function(){
      var idx = Math.floor(Math.random() * BOND_PAIRS.length);
      saved.levels[idx] = Math.min((saved.levels[idx] || BOND_PAIRS[idx].bond) + Math.floor(Math.random() * 5) + 1, 100);
      saved.interactions++;
      v23Save('v23_bonds', saved);
      sfxV23('bond_grow');
      if(saved.levels[idx] >= 100) sfxV23('bond_max');
      showToastV23('💕 ' + BOND_PAIRS[idx].a + ' × ' + BOND_PAIRS[idx].b + ' 유대감 UP!');
      drawBonds();
    });
  }
}


// ============================================================
// 4. POWER-UP EVOLUTION PATH (Canvas 620x380)
// ============================================================
var POWERUP_EVOS = [
  {name:'기본 하트',icon:'💗',stage:1,next:'강화 하트',stats:{hp:10,atk:5,def:3,spd:4,mag:2}},
  {name:'강화 하트',icon:'💖',stage:2,next:'슈퍼 하트',stats:{hp:25,atk:12,def:8,spd:9,mag:6}},
  {name:'슈퍼 하트',icon:'💝',stage:3,next:'울트라 하트',stats:{hp:50,atk:25,def:18,spd:20,mag:15}},
  {name:'울트라 하트',icon:'💟',stage:4,next:'레전드 하트',stats:{hp:80,atk:40,def:30,spd:35,mag:28}},
  {name:'레전드 하트',icon:'❤️‍🔥',stage:5,next:null,stats:{hp:100,atk:60,def:50,spd:50,mag:45}},
  {name:'별빛 조각',icon:'⭐',stage:1,next:'별빛 결정',stats:{hp:8,atk:8,def:5,spd:6,mag:8}},
  {name:'별빛 결정',icon:'🌟',stage:2,next:'별빛 보석',stats:{hp:20,atk:20,def:12,spd:15,mag:22}},
  {name:'별빛 보석',icon:'💫',stage:3,next:'스타 코어',stats:{hp:40,atk:38,def:25,spd:30,mag:42}},
  {name:'스타 코어',icon:'✨',stage:4,next:null,stats:{hp:65,atk:55,def:40,spd:48,mag:65}}
];

function renderEvolutionPath(){
  var saved = v23Load('v23_evopath', {current:0, evolved:[]});
  var html = '<div style="text-align:center;margin-bottom:8px"><canvas id="v23EvoCanvas" width="620" height="380" style="max-width:100%;border-radius:12px;background:' + (isDarkV23()?'#1a0a2e':'#FFF0F8') + '"></canvas></div>';
  html += '<div style="text-align:center"><button id="v23EvoBtn" style="padding:8px 20px;background:linear-gradient(135deg,#9C27B0,#FF5FA2);color:#fff;border:none;border-radius:14px;font-size:12px;font-weight:700;cursor:pointer">🔮 진화 시도!</button></div>';
  var modal = createV23Modal('🔮 파워업 진화 경로', html);
  sfxV23('v23_nav');

  var canvas = document.getElementById('v23EvoCanvas');
  if(!canvas) return;
  var ctx = canvas.getContext('2d');

  function drawEvo(){
    var dk = isDarkV23();
    ctx.clearRect(0, 0, 620, 380);
    ctx.fillStyle = dk ? '#1a0a2e' : '#FFF0F8';
    ctx.fillRect(0, 0, 620, 380);

    ctx.fillStyle = dk ? '#eee' : '#333';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('파워업 진화 경로 맵', 310, 22);

    var heartLine = POWERUP_EVOS.slice(0, 5);
    var starLine = POWERUP_EVOS.slice(5);

    function drawLine(items, baseY, label){
      ctx.fillStyle = dk ? '#bbb' : '#666';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(label, 15, baseY - 5);

      var spacing = 110;
      var startX = 70;
      for(var i = 0; i < items.length; i++){
        var item = items[i];
        var x = startX + i * spacing;
        var evolved = saved.evolved.indexOf(item.name) >= 0;

        if(i < items.length - 1){
          ctx.beginPath();
          ctx.moveTo(x + 25, baseY + 30);
          ctx.lineTo(x + spacing - 25, baseY + 30);
          ctx.strokeStyle = evolved ? '#FF5FA2' : (dk ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.08)');
          ctx.lineWidth = evolved ? 3 : 1.5;
          ctx.setLineDash(evolved ? [] : [4, 4]);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.fillStyle = evolved ? '#FF5FA2' : (dk ? '#555' : '#ccc');
          ctx.beginPath();
          ctx.moveTo(x + spacing - 30, baseY + 25);
          ctx.lineTo(x + spacing - 20, baseY + 30);
          ctx.lineTo(x + spacing - 30, baseY + 35);
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(x, baseY + 30, 24, 0, Math.PI * 2);
        ctx.fillStyle = evolved ? item.stats.mag > 30 ? 'rgba(156,39,176,.2)' : 'rgba(255,95,162,.15)' : (dk ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.03)');
        ctx.fill();
        ctx.strokeStyle = evolved ? '#FF5FA2' : (dk ? 'rgba(255,255,255,.15)' : 'rgba(0,0,0,.08)');
        ctx.lineWidth = evolved ? 2.5 : 1;
        ctx.stroke();

        ctx.font = '20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(item.icon, x, baseY + 37);

        ctx.fillStyle = evolved ? (dk ? '#eee' : '#333') : (dk ? '#666' : '#bbb');
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText(evolved ? item.name : '???', x, baseY + 62);

        ctx.fillStyle = dk ? '#aaa' : '#999';
        ctx.font = '9px sans-serif';
        ctx.fillText('Lv.' + item.stage, x, baseY + 74);
      }
    }

    drawLine(heartLine, 40, '❤️ 하트 라인');
    drawLine(starLine, 180, '⭐ 별빛 라인');

    var cur = POWERUP_EVOS[saved.current];
    var infoY = 290;
    ctx.fillStyle = dk ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.03)';
    ctx.beginPath(); ctx.roundRect(10, infoY, 600, 80, 12); ctx.fill();

    ctx.fillStyle = dk ? '#eee' : '#333';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('현재 선택: ' + cur.icon + ' ' + cur.name, 20, infoY + 20);

    var statNames = ['HP','ATK','DEF','SPD','MAG'];
    var statKeys = ['hp','atk','def','spd','mag'];
    var statColors = ['#4CAF50','#F44336','#42A5F5','#FF9800','#9C27B0'];
    var barStartX = 20;
    for(var s = 0; s < 5; s++){
      var sx = barStartX + s * 118;
      ctx.fillStyle = statColors[s];
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(statNames[s], sx, infoY + 42);
      ctx.fillStyle = dk ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.04)';
      ctx.beginPath(); ctx.roundRect(sx, infoY + 48, 100, 8, 4); ctx.fill();
      ctx.fillStyle = statColors[s];
      ctx.beginPath(); ctx.roundRect(sx, infoY + 48, cur.stats[statKeys[s]], 8, 4); ctx.fill();
      ctx.fillStyle = dk ? '#aaa' : '#888';
      ctx.font = '9px sans-serif';
      ctx.fillText(cur.stats[statKeys[s]], sx + 104, infoY + 55);
    }

    ctx.fillStyle = dk ? '#aaa' : '#888';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('진화 완료: ' + saved.evolved.length + '/' + POWERUP_EVOS.length, 310, infoY + 76);
  }

  drawEvo();

  var evoBtn = document.getElementById('v23EvoBtn');
  if(evoBtn){
    evoBtn.addEventListener('click', function(){
      var cur = POWERUP_EVOS[saved.current];
      if(saved.evolved.indexOf(cur.name) < 0){
        saved.evolved.push(cur.name);
      }
      saved.current = (saved.current + 1) % POWERUP_EVOS.length;
      v23Save('v23_evopath', saved);
      sfxV23('evolution_glow');
      if(saved.evolved.length >= POWERUP_EVOS.length) sfxV23('evolution_complete');
      showToastV23('🔮 ' + cur.name + ' 진화 완료!');
      drawEvo();
    });
  }
}


// ============================================================
// 5. STAGE DIFFICULTY ANALYZER (Canvas 620x400)
// ============================================================
var STAGE_DATA = [
  {name:'초원 마을',diff:15,enemies:3,traps:1,time:60,boss:false},
  {name:'꽃잎 숲',diff:25,enemies:5,traps:3,time:90,boss:false},
  {name:'무지개 언덕',diff:35,enemies:7,traps:5,time:120,boss:true},
  {name:'구름 다리',diff:45,enemies:8,traps:6,time:100,boss:false},
  {name:'별빛 동굴',diff:55,enemies:10,traps:8,time:150,boss:false},
  {name:'폭풍 계곡',diff:65,enemies:12,traps:10,time:120,boss:true},
  {name:'얼음 궁전',diff:72,enemies:14,traps:12,time:180,boss:false},
  {name:'화산 요새',diff:82,enemies:16,traps:14,time:150,boss:false},
  {name:'어둠의 탑',diff:90,enemies:18,traps:16,time:200,boss:true},
  {name:'최종 결전',diff:100,enemies:20,traps:18,time:300,boss:true}
];

function renderDifficultyAnalyzer(){
  var html = '<div style="text-align:center;margin-bottom:8px"><canvas id="v23DiffCanvas" width="620" height="400" style="max-width:100%;border-radius:12px;background:' + (isDarkV23()?'#1a0a2e':'#FFF0F8') + '"></canvas></div>';
  html += '<div style="font-size:11px;color:' + (isDarkV23()?'#aaa':'#888') + ';text-align:center">10 스테이지 난이도 곡선 분석 | 보스전 ★ 표시</div>';
  var modal = createV23Modal('📊 스테이지 난이도 분석기', html);
  sfxV23('diff_scan');

  var canvas = document.getElementById('v23DiffCanvas');
  if(!canvas) return;
  var ctx = canvas.getContext('2d');
  var dk = isDarkV23();

  ctx.fillStyle = dk ? '#1a0a2e' : '#FFF0F8';
  ctx.fillRect(0, 0, 620, 400);

  ctx.fillStyle = dk ? '#eee' : '#333';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('스테이지 난이도 분석', 310, 22);

  var chartX = 60, chartY = 45, chartW = 500, chartH = 200;

  ctx.strokeStyle = dk ? 'rgba(255,255,255,.1)' : 'rgba(0,0,0,.06)';
  ctx.lineWidth = 1;
  for(var g = 0; g <= 4; g++){
    var gy = chartY + chartH - (g / 4) * chartH;
    ctx.beginPath(); ctx.moveTo(chartX, gy); ctx.lineTo(chartX + chartW, gy); ctx.stroke();
    ctx.fillStyle = dk ? '#888' : '#aaa';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText((g * 25) + '', chartX - 5, gy + 4);
  }

  var grad = ctx.createLinearGradient(chartX, chartY + chartH, chartX, chartY);
  grad.addColorStop(0, 'rgba(76,175,80,.3)');
  grad.addColorStop(0.5, 'rgba(255,152,0,.3)');
  grad.addColorStop(1, 'rgba(244,67,54,.3)');

  ctx.beginPath();
  ctx.moveTo(chartX, chartY + chartH);
  var points = [];
  for(var i = 0; i < STAGE_DATA.length; i++){
    var x = chartX + (i / (STAGE_DATA.length - 1)) * chartW;
    var y = chartY + chartH - (STAGE_DATA[i].diff / 100) * chartH;
    points.push({x:x, y:y});
    if(i === 0) ctx.lineTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.lineTo(chartX + chartW, chartY + chartH);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.beginPath();
  for(var i = 0; i < points.length; i++){
    if(i === 0) ctx.moveTo(points[i].x, points[i].y);
    else ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.strokeStyle = '#FF5FA2';
  ctx.lineWidth = 3;
  ctx.stroke();

  for(var i = 0; i < STAGE_DATA.length; i++){
    var p = points[i];
    var stage = STAGE_DATA[i];

    ctx.beginPath();
    ctx.arc(p.x, p.y, stage.boss ? 8 : 5, 0, Math.PI * 2);
    ctx.fillStyle = stage.boss ? '#FFD700' : '#FF5FA2';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    if(stage.boss){
      ctx.fillStyle = '#FFD700';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('★', p.x, p.y - 14);
    }

    ctx.fillStyle = dk ? '#bbb' : '#666';
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'center';
    ctx.save();
    ctx.translate(p.x, chartY + chartH + 14);
    ctx.rotate(-0.4);
    ctx.fillText(stage.name, 0, 0);
    ctx.restore();
  }

  var detailY = chartY + chartH + 50;
  ctx.fillStyle = dk ? '#eee' : '#333';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('스테이지별 상세 스탯', 310, detailY);

  var metrics = ['적','함정','시간(초)','난이도'];
  var metricKeys = ['enemies','traps','time','diff'];
  var metricColors = ['#F44336','#FF9800','#42A5F5','#9C27B0'];
  var barBaseY = detailY + 15;

  for(var m = 0; m < metrics.length; m++){
    var my = barBaseY + m * 24;
    ctx.fillStyle = metricColors[m];
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(metrics[m], chartX - 5, my + 10);

    for(var i = 0; i < STAGE_DATA.length; i++){
      var val = STAGE_DATA[i][metricKeys[m]];
      var maxVal = metricKeys[m] === 'time' ? 300 : metricKeys[m] === 'enemies' ? 20 : metricKeys[m] === 'traps' ? 18 : 100;
      var bx = chartX + (i / (STAGE_DATA.length - 1)) * chartW - 18;
      var bw = 36, bh = 14;
      var fillW = (val / maxVal) * bw;

      ctx.fillStyle = dk ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.03)';
      ctx.beginPath(); ctx.roundRect(bx, my, bw, bh, 3); ctx.fill();
      ctx.fillStyle = metricColors[m];
      ctx.globalAlpha = 0.7;
      ctx.beginPath(); ctx.roundRect(bx, my, fillW, bh, 3); ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  sfxV23('diff_rank');
}


// ============================================================
// 6. BATTLE POWER PREDICTOR (Canvas 600x380)
// ============================================================
var PRED_CHARS = [
  {name:'하츄핑',icon:'💖',hp:100,atk:45,def:30,spd:50,mag:60,type:'사랑'},
  {name:'바로핑',icon:'⚖️',hp:120,atk:55,def:45,spd:35,mag:40,type:'정의'},
  {name:'차핑',icon:'🍵',hp:90,atk:30,def:50,spd:40,mag:55,type:'힐링'},
  {name:'해핑',icon:'😄',hp:85,atk:35,def:25,spd:55,mag:50,type:'긍정'},
  {name:'라라핑',icon:'🎵',hp:80,atk:40,def:20,spd:60,mag:65,type:'음악'},
  {name:'티카핑',icon:'✏️',hp:95,atk:50,def:35,spd:45,mag:45,type:'지식'}
];

var PRED_BOSSES = [
  {name:'그림자 트러핑',icon:'👿',hp:300,atk:60,def:40,spd:30},
  {name:'분노의 왕',icon:'😡',hp:400,atk:75,def:35,spd:25},
  {name:'슬픔의 마녀',icon:'😢',hp:250,atk:50,def:55,spd:40},
  {name:'두려움 기사',icon:'😨',hp:350,atk:65,def:50,spd:35},
  {name:'질투의 드래곤',icon:'🐲',hp:500,atk:80,def:60,spd:20},
  {name:'최종보스 카오스',icon:'👹',hp:800,atk:90,def:70,spd:15}
];

function renderBattlePredictor(){
  var saved = v23Load('v23_predictor', {charIdx:0, bossIdx:0, simulations:0});
  var html = '<div style="text-align:center;margin-bottom:8px"><canvas id="v23PredCanvas" width="600" height="380" style="max-width:100%;border-radius:12px;background:' + (isDarkV23()?'#1a0a2e':'#FFF0F8') + '"></canvas></div>';
  html += '<div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">';
  html += '<button id="v23PredChar" style="padding:6px 14px;background:#FF5FA2;color:#fff;border:none;border-radius:12px;font-size:11px;cursor:pointer">캐릭터 변경</button>';
  html += '<button id="v23PredBoss" style="padding:6px 14px;background:#9C27B0;color:#fff;border:none;border-radius:12px;font-size:11px;cursor:pointer">보스 변경</button>';
  html += '<button id="v23PredSim" style="padding:8px 20px;background:linear-gradient(135deg,#F44336,#FF9800);color:#fff;border:none;border-radius:14px;font-size:12px;font-weight:700;cursor:pointer">⚔️ 전투 시뮬!</button>';
  html += '</div>';
  var modal = createV23Modal('⚔️ 전투력 예측 시뮬레이터', html);
  sfxV23('v23_nav');

  var canvas = document.getElementById('v23PredCanvas');
  if(!canvas) return;
  var ctx = canvas.getContext('2d');

  function drawPredictor(){
    var dk = isDarkV23();
    var ch = PRED_CHARS[saved.charIdx];
    var boss = PRED_BOSSES[saved.bossIdx];
    ctx.clearRect(0, 0, 600, 380);
    ctx.fillStyle = dk ? '#1a0a2e' : '#FFF0F8';
    ctx.fillRect(0, 0, 600, 380);

    ctx.fillStyle = dk ? '#eee' : '#333';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('전투력 예측 시뮬레이터', 300, 22);

    // Character side
    ctx.fillStyle = dk ? 'rgba(255,95,162,.1)' : 'rgba(255,95,162,.06)';
    ctx.beginPath(); ctx.roundRect(15, 40, 270, 200, 14); ctx.fill();
    ctx.font = '36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(ch.icon, 150, 85);
    ctx.fillStyle = '#FF5FA2';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(ch.name, 150, 110);
    ctx.fillStyle = dk ? '#bbb' : '#888';
    ctx.font = '11px sans-serif';
    ctx.fillText('속성: ' + ch.type, 150, 126);

    var stats = [{k:'HP',v:ch.hp,c:'#4CAF50'},{k:'ATK',v:ch.atk,c:'#F44336'},{k:'DEF',v:ch.def,c:'#42A5F5'},{k:'SPD',v:ch.spd,c:'#FF9800'},{k:'MAG',v:ch.mag,c:'#9C27B0'}];
    for(var s = 0; s < stats.length; s++){
      var sy = 140 + s * 18;
      ctx.fillStyle = stats[s].c;
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(stats[s].k, 60, sy + 10);
      ctx.fillStyle = dk ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.04)';
      ctx.beginPath(); ctx.roundRect(65, sy, 180, 12, 6); ctx.fill();
      ctx.fillStyle = stats[s].c;
      ctx.beginPath(); ctx.roundRect(65, sy, stats[s].v / 120 * 180, 12, 6); ctx.fill();
      ctx.fillStyle = dk ? '#eee' : '#333';
      ctx.font = '9px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(stats[s].v, 250, sy + 10);
    }

    // VS
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('VS', 300, 150);

    // Boss side
    ctx.fillStyle = dk ? 'rgba(156,39,176,.1)' : 'rgba(156,39,176,.06)';
    ctx.beginPath(); ctx.roundRect(315, 40, 270, 200, 14); ctx.fill();
    ctx.font = '36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(boss.icon, 450, 85);
    ctx.fillStyle = '#9C27B0';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(boss.name, 450, 110);
    ctx.fillStyle = dk ? '#bbb' : '#888';
    ctx.font = '11px sans-serif';
    ctx.fillText('HP: ' + boss.hp, 450, 126);

    var bStats = [{k:'ATK',v:boss.atk,c:'#F44336'},{k:'DEF',v:boss.def,c:'#42A5F5'},{k:'SPD',v:boss.spd,c:'#FF9800'}];
    for(var s = 0; s < bStats.length; s++){
      var sy = 140 + s * 22;
      ctx.fillStyle = bStats[s].c;
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(bStats[s].k, 370, sy + 10);
      ctx.fillStyle = dk ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.04)';
      ctx.beginPath(); ctx.roundRect(375, sy, 180, 14, 6); ctx.fill();
      ctx.fillStyle = bStats[s].c;
      ctx.beginPath(); ctx.roundRect(375, sy, bStats[s].v / 100 * 180, 14, 6); ctx.fill();
      ctx.fillStyle = dk ? '#eee' : '#333';
      ctx.font = '9px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(bStats[s].v, 560, sy + 10);
    }

    // Prediction result
    var dmgToB = Math.max(1, ch.atk + ch.mag * 0.5 - boss.def * 0.4);
    var dmgToC = Math.max(1, boss.atk - ch.def * 0.5);
    var turnsToKill = Math.ceil(boss.hp / dmgToB);
    var turnsToLose = Math.ceil(ch.hp / dmgToC);
    var winRate = Math.min(99, Math.max(1, Math.round((turnsToLose / (turnsToKill + turnsToLose)) * 100)));

    var resultY = 260;
    ctx.fillStyle = dk ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.03)';
    ctx.beginPath(); ctx.roundRect(15, resultY, 570, 105, 14); ctx.fill();

    ctx.fillStyle = dk ? '#eee' : '#333';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('전투 예측 결과', 300, resultY + 20);

    var gaugeX = 50, gaugeY = resultY + 35, gaugeW = 500;
    ctx.fillStyle = dk ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.04)';
    ctx.beginPath(); ctx.roundRect(gaugeX, gaugeY, gaugeW, 20, 10); ctx.fill();
    var winGrad = ctx.createLinearGradient(gaugeX, 0, gaugeX + gaugeW, 0);
    winGrad.addColorStop(0, '#F44336');
    winGrad.addColorStop(0.3, '#FF9800');
    winGrad.addColorStop(0.6, '#FFD700');
    winGrad.addColorStop(1, '#4CAF50');
    ctx.fillStyle = winGrad;
    ctx.beginPath(); ctx.roundRect(gaugeX, gaugeY, gaugeW * winRate / 100, 20, 10); ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('승률 ' + winRate + '%', gaugeX + gaugeW * winRate / 200, gaugeY + 14);

    ctx.fillStyle = dk ? '#bbb' : '#666';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('예상 턴: ' + turnsToKill + ' | 데미지/턴: ' + Math.round(dmgToB) + ' | 피격/턴: ' + Math.round(dmgToC), 300, resultY + 80);
    ctx.fillText('시뮬레이션 횟수: ' + saved.simulations, 300, resultY + 96);
  }

  drawPredictor();

  document.getElementById('v23PredChar').addEventListener('click', function(){
    saved.charIdx = (saved.charIdx + 1) % PRED_CHARS.length;
    v23Save('v23_predictor', saved);
    sfxV23('predict_calc');
    drawPredictor();
  });
  document.getElementById('v23PredBoss').addEventListener('click', function(){
    saved.bossIdx = (saved.bossIdx + 1) % PRED_BOSSES.length;
    v23Save('v23_predictor', saved);
    sfxV23('predict_calc');
    drawPredictor();
  });
  document.getElementById('v23PredSim').addEventListener('click', function(){
    saved.simulations++;
    v23Save('v23_predictor', saved);
    sfxV23('predict_result');
    drawPredictor();
    showToastV23('⚔️ 전투 시뮬레이션 완료!');
  });
}


// ============================================================
// 7. EMOTION ENERGY CHARGE GAME (Canvas 580x360)
// ============================================================
var EMOTION_TYPES = [
  {name:'사랑',icon:'💖',color:'#FF5FA2'},
  {name:'기쁨',icon:'😊',color:'#FFD700'},
  {name:'용기',icon:'💪',color:'#F44336'},
  {name:'지혜',icon:'📚',color:'#42A5F5'},
  {name:'희망',icon:'🌟',color:'#4CAF50'},
  {name:'우정',icon:'🤝',color:'#9C27B0'}
];

function renderEmotionCharge(){
  var saved = v23Load('v23_emotion', {charges: [0,0,0,0,0,0], totalCharges: 0, maxStreak: 0, currentStreak: 0});
  var html = '<div style="text-align:center;margin-bottom:8px"><canvas id="v23EmotionCanvas" width="580" height="360" style="max-width:100%;border-radius:12px;background:' + (isDarkV23()?'#1a0a2e':'#FFF0F8') + '"></canvas></div>';
  html += '<div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap" id="v23EmoBtns"></div>';
  html += '<div style="font-size:11px;color:' + (isDarkV23()?'#aaa':'#888') + ';text-align:center;margin-top:6px">총 충전: ' + saved.totalCharges + ' | 최대 연속: ' + saved.maxStreak + '</div>';
  var modal = createV23Modal('⚡ 감정 에너지 충전기', html);
  sfxV23('v23_nav');

  var btnsDiv = document.getElementById('v23EmoBtns');
  for(var i = 0; i < EMOTION_TYPES.length; i++){
    (function(idx){
      var btn = document.createElement('button');
      btn.textContent = EMOTION_TYPES[idx].icon + ' ' + EMOTION_TYPES[idx].name;
      btn.style.cssText = 'padding:6px 14px;background:' + EMOTION_TYPES[idx].color + ';color:#fff;border:none;border-radius:12px;font-size:11px;font-weight:700;cursor:pointer';
      btn.addEventListener('click', function(){
        saved.charges[idx] = Math.min(saved.charges[idx] + Math.floor(Math.random() * 15) + 5, 100);
        saved.totalCharges++;
        saved.currentStreak++;
        if(saved.currentStreak > saved.maxStreak) saved.maxStreak = saved.currentStreak;
        v23Save('v23_emotion', saved);
        sfxV23('charge_up');
        if(saved.charges[idx] >= 100) sfxV23('charge_full');
        drawEmotion();
      });
      btnsDiv.appendChild(btn);
    })(i);
  }

  var canvas = document.getElementById('v23EmotionCanvas');
  if(!canvas) return;
  var ctx = canvas.getContext('2d');

  function drawEmotion(){
    var dk = isDarkV23();
    ctx.clearRect(0, 0, 580, 360);
    ctx.fillStyle = dk ? '#1a0a2e' : '#FFF0F8';
    ctx.fillRect(0, 0, 580, 360);

    ctx.fillStyle = dk ? '#eee' : '#333';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('감정 에너지 충전 현황', 290, 22);

    // Vertical bars
    var barW = 60, gap = 20, startX = 55;
    var maxH = 200;
    for(var i = 0; i < EMOTION_TYPES.length; i++){
      var x = startX + i * (barW + gap);
      var emo = EMOTION_TYPES[i];
      var val = saved.charges[i];
      var h = (val / 100) * maxH;

      ctx.fillStyle = dk ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.03)';
      ctx.beginPath(); ctx.roundRect(x, 50, barW, maxH, 8); ctx.fill();

      var grad = ctx.createLinearGradient(0, 50 + maxH, 0, 50 + maxH - h);
      grad.addColorStop(0, emo.color);
      grad.addColorStop(1, emo.color + '88');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.roundRect(x, 50 + maxH - h, barW, h, 8); ctx.fill();

      if(val >= 100){
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.roundRect(x, 50, barW, maxH, 8); ctx.stroke();
      }

      ctx.font = '20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(emo.icon, x + barW / 2, 50 + maxH + 24);

      ctx.fillStyle = dk ? '#bbb' : '#666';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(emo.name, x + barW / 2, 50 + maxH + 40);

      ctx.fillStyle = val >= 100 ? '#FFD700' : (dk ? '#eee' : '#333');
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(val + '%', x + barW / 2, 50 + maxH - h - 8);
    }

    // Summary
    var totalEnergy = saved.charges.reduce(function(a,b){return a+b}, 0);
    var avgEnergy = Math.round(totalEnergy / 6);
    var maxIdx = 0;
    for(var i = 1; i < saved.charges.length; i++){
      if(saved.charges[i] > saved.charges[maxIdx]) maxIdx = i;
    }
    var rank = avgEnergy >= 90 ? 'S' : avgEnergy >= 70 ? 'A' : avgEnergy >= 50 ? 'B' : avgEnergy >= 30 ? 'C' : 'D';
    var rankColors = {S:'#FFD700',A:'#FF5FA2',B:'#42A5F5',C:'#4CAF50',D:'#FF9800'};

    var sumY = 310;
    ctx.fillStyle = dk ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.03)';
    ctx.beginPath(); ctx.roundRect(15, sumY, 550, 40, 12); ctx.fill();

    ctx.fillStyle = rankColors[rank];
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(rank, 30, sumY + 28);

    ctx.fillStyle = dk ? '#bbb' : '#666';
    ctx.font = '11px sans-serif';
    ctx.fillText('평균 에너지: ' + avgEnergy + '% | 총 에너지: ' + totalEnergy + '/600 | 최강 감정: ' + EMOTION_TYPES[maxIdx].name + ' | 연속: ' + saved.currentStreak, 65, sumY + 26);
  }

  drawEmotion();
}


// ============================================================
// 8. ADVENTURE SCOREBOARD (Canvas 620x380)
// ============================================================
function renderScoreboard(){
  var saved = v23Load('v23_scoreboard', {
    entries: [
      {name:'하츄핑',score:9500,rank:'S',icon:'💖',kills:120,clears:45,time:3600},
      {name:'바로핑',score:8200,rank:'A',icon:'⚖️',kills:100,clears:38,time:3200},
      {name:'로미',score:7800,rank:'A',icon:'👧',kills:85,clears:42,time:4100},
      {name:'해핑',score:7100,rank:'B',icon:'😄',kills:72,clears:30,time:2800},
      {name:'차핑',score:6500,rank:'B',icon:'🍵',kills:55,clears:25,time:2400},
      {name:'라라핑',score:6000,rank:'B',icon:'🎵',kills:60,clears:28,time:2600},
      {name:'티카핑',score:5800,rank:'C',icon:'✏️',kills:48,clears:22,time:2200},
      {name:'플레이어',score:0,rank:'D',icon:'🎮',kills:0,clears:0,time:0}
    ],
    updates: 0
  });

  try{
    var stats = JSON.parse(localStorage.getItem('hatcuping_stats')) || {};
    saved.entries[7].score = (stats.clears || 0) * 100 + (stats.combos || 0) * 20 + (stats.hearts || 0) * 5;
    saved.entries[7].kills = stats.combos || 0;
    saved.entries[7].clears = stats.clears || 0;
    saved.entries[7].time = stats.playTime || 0;
    var ps = saved.entries[7].score;
    saved.entries[7].rank = ps >= 9000 ? 'S' : ps >= 7000 ? 'A' : ps >= 5000 ? 'B' : ps >= 3000 ? 'C' : 'D';
  }catch(e){}

  saved.entries.sort(function(a,b){return b.score - a.score});

  var html = '<div style="text-align:center;margin-bottom:8px"><canvas id="v23BoardCanvas" width="620" height="380" style="max-width:100%;border-radius:12px;background:' + (isDarkV23()?'#1a0a2e':'#FFF0F8') + '"></canvas></div>';
  html += '<div style="text-align:center"><button id="v23BoardRefresh" style="padding:8px 20px;background:linear-gradient(135deg,#42A5F5,#4CAF50);color:#fff;border:none;border-radius:14px;font-size:12px;font-weight:700;cursor:pointer">🔄 스코어 갱신</button></div>';
  var modal = createV23Modal('🏆 모험 스코어보드', html);
  sfxV23('v23_nav');

  var canvas = document.getElementById('v23BoardCanvas');
  if(!canvas) return;
  var ctx = canvas.getContext('2d');

  function drawBoard(){
    var dk = isDarkV23();
    ctx.clearRect(0, 0, 620, 380);
    ctx.fillStyle = dk ? '#1a0a2e' : '#FFF0F8';
    ctx.fillRect(0, 0, 620, 380);

    ctx.fillStyle = dk ? '#eee' : '#333';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('모험 종합 스코어보드', 310, 22);

    // Headers
    var cols = ['순위','캐릭터','점수','등급','처치','클리어','시간'];
    var colX = [30, 100, 230, 310, 380, 450, 540];
    ctx.fillStyle = dk ? '#aaa' : '#888';
    ctx.font = 'bold 10px sans-serif';
    for(var c = 0; c < cols.length; c++){
      ctx.textAlign = c === 0 ? 'center' : 'center';
      ctx.fillText(cols[c], colX[c], 48);
    }

    ctx.strokeStyle = dk ? 'rgba(255,255,255,.1)' : 'rgba(0,0,0,.06)';
    ctx.beginPath(); ctx.moveTo(15, 54); ctx.lineTo(605, 54); ctx.stroke();

    var medals = ['🥇','🥈','🥉'];
    var rankColors = {S:'#FFD700',A:'#FF5FA2',B:'#42A5F5',C:'#4CAF50',D:'#FF9800'};

    for(var i = 0; i < saved.entries.length; i++){
      var entry = saved.entries[i];
      var y = 72 + i * 32;
      var isPlayer = entry.name === '플레이어';

      if(isPlayer){
        ctx.fillStyle = dk ? 'rgba(255,95,162,.1)' : 'rgba(255,95,162,.06)';
        ctx.beginPath(); ctx.roundRect(15, y - 12, 590, 28, 8); ctx.fill();
      }

      ctx.textAlign = 'center';
      ctx.font = i < 3 ? '16px sans-serif' : '12px sans-serif';
      ctx.fillText(i < 3 ? medals[i] : (i + 1) + '', colX[0], y + 6);

      ctx.font = '16px sans-serif';
      ctx.fillText(entry.icon, colX[1] - 20, y + 6);
      ctx.fillStyle = isPlayer ? '#FF5FA2' : (dk ? '#eee' : '#333');
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(entry.name, colX[1] + 15, y + 5);

      ctx.fillStyle = dk ? '#eee' : '#333';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(entry.score.toLocaleString(), colX[2], y + 5);

      ctx.fillStyle = rankColors[entry.rank] || '#888';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(entry.rank, colX[3], y + 5);

      ctx.fillStyle = dk ? '#bbb' : '#666';
      ctx.font = '11px sans-serif';
      ctx.fillText(entry.kills, colX[4], y + 5);
      ctx.fillText(entry.clears, colX[5], y + 5);
      var mins = Math.floor(entry.time / 60);
      ctx.fillText(mins > 60 ? Math.floor(mins/60) + 'h' + (mins%60) + 'm' : mins + 'm', colX[6], y + 5);
    }

    // Score distribution bar chart at bottom
    var chartY = 340;
    ctx.fillStyle = dk ? '#aaa' : '#888';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('점수 분포:', 20, chartY);

    var maxScore = saved.entries[0].score || 1;
    for(var i = 0; i < saved.entries.length; i++){
      var bx = 100 + i * 62;
      var bw = 50;
      var bh = (saved.entries[i].score / maxScore) * 25;
      ctx.fillStyle = saved.entries[i].name === '플레이어' ? '#FF5FA2' : (dk ? 'rgba(255,255,255,.15)' : 'rgba(0,0,0,.1)');
      ctx.beginPath(); ctx.roundRect(bx, chartY + 5 - bh, bw, bh, 4); ctx.fill();
    }
  }

  drawBoard();

  var refreshBtn = document.getElementById('v23BoardRefresh');
  if(refreshBtn){
    refreshBtn.addEventListener('click', function(){
      saved.updates++;
      for(var i = 0; i < 7; i++){
        saved.entries[i].score += Math.floor(Math.random() * 200);
        saved.entries[i].kills += Math.floor(Math.random() * 5);
        saved.entries[i].clears += Math.floor(Math.random() * 3);
      }
      saved.entries.sort(function(a,b){return b.score - a.score});
      v23Save('v23_scoreboard', saved);
      sfxV23('board_update');
      drawBoard();
      showToastV23('🏆 스코어보드 갱신 완료!');
    });
  }
}


// ============================================================
// QUIZ v23 - 15 NEW QUESTIONS (210 -> 225)
// ============================================================
var V23_QUIZ = [
  {q:'슈퍼마리오에서 파이어볼을 쏠 수 있는 파워업은?',a:['파이어플라워','슈퍼스타','무적별','망토깃털'],c:0},
  {q:'포켓몬에서 물 타입이 강한 상대는?',a:['풀 타입','불 타입','전기 타입','바위 타입'],c:1},
  {q:'하츄핑의 주요 감정 속성은?',a:['분노','사랑','질투','두려움'],c:1},
  {q:'RPG에서 턴제 전투의 장점은?',a:['빠른 액션','전략적 사고','실시간 조작','자동 전투'],c:1},
  {q:'플랫포머 게임의 핵심 조작은?',a:['전략 수립','점프와 이동','퍼즐 풀기','대화 선택'],c:1},
  {q:'포켓몬에서 포획 확률을 높이려면?',a:['HP를 줄인다','도망간다','무시한다','레벨을 올린다'],c:0},
  {q:'콤보 시스템의 장점은?',a:['방어 강화','연속 공격 보너스','회복 증가','도주 확률 상승'],c:1},
  {q:'보스전에서 가장 중요한 것은?',a:['무작정 공격','패턴 파악','아이템 낭비','도주 시도'],c:1},
  {q:'슈퍼마리오의 최종 목표는?',a:['코인 수집','공주 구출','성 파괴','악당 되기'],c:1},
  {q:'게임에서 세이브 포인트의 역할은?',a:['장식','진행 상황 저장','점수 감소','난이도 상승'],c:1},
  {q:'캐릭터 성장곡선에서 S등급은?',a:['최고 등급','최저 등급','중간 등급','특수 등급'],c:0},
  {q:'PWA 기술의 장점은?',a:['온라인만 가능','오프라인 지원','유료 전용','PC만 가능'],c:1},
  {q:'Canvas API로 가능한 것은?',a:['서버 관리','2D 그래픽 렌더링','네트워크 통신','파일 저장'],c:1},
  {q:'Web Audio API의 용도는?',a:['영상 재생','음향 효과 생성','텍스트 변환','이미지 편집'],c:1},
  {q:'게임 밸런싱에서 중요한 요소는?',a:['그래픽만','난이도 곡선','용량','가격'],c:1}
];

function renderV23Quiz(){
  var saved = v23Load('v23_quiz_state', {answered:0, correct:0, history:[]});
  var qIdx = saved.answered % V23_QUIZ.length;
  var q = V23_QUIZ[qIdx];
  var html = '<div style="text-align:center;margin-bottom:12px">';
  html += '<div style="font-size:11px;color:' + (isDarkV23()?'#aaa':'#888') + '">문제 ' + (qIdx+1) + '/' + V23_QUIZ.length + ' | 정답률: ' + (saved.answered > 0 ? Math.round(saved.correct/saved.answered*100) : 0) + '%</div>';
  html += '<div style="font-size:15px;font-weight:700;margin:12px 0;color:' + (isDarkV23()?'#eee':'#333') + '">' + q.q + '</div>';
  html += '</div>';
  for(var i = 0; i < q.a.length; i++){
    html += '<button class="v23qa" data-idx="' + i + '" style="display:block;width:100%;padding:10px;margin:6px 0;background:' + (isDarkV23()?'rgba(255,255,255,.06)':'rgba(0,0,0,.03)') + ';border:2px solid ' + (isDarkV23()?'rgba(255,255,255,.1)':'rgba(0,0,0,.06)') + ';border-radius:12px;font-size:13px;cursor:pointer;color:' + (isDarkV23()?'#eee':'#333') + ';text-align:left">' + (i+1) + '. ' + q.a[i] + '</button>';
  }
  var modal = createV23Modal('❓ 퀴즈 v23 (' + (210 + qIdx + 1) + '/225)', html);

  var btns = modal.querySelectorAll('.v23qa');
  btns.forEach(function(btn){
    btn.addEventListener('click', function(){
      var sel = parseInt(btn.dataset.idx);
      saved.answered++;
      if(sel === q.c){
        saved.correct++;
        btn.style.background = 'rgba(76,175,80,.2)';
        btn.style.borderColor = '#4CAF50';
        sfxV23('v23_quiz');
        showToastV23('✅ 정답! (' + saved.correct + '/' + saved.answered + ')');
      } else {
        btn.style.background = 'rgba(244,67,54,.2)';
        btn.style.borderColor = '#F44336';
        btns[q.c].style.background = 'rgba(76,175,80,.2)';
        btns[q.c].style.borderColor = '#4CAF50';
        showToastV23('❌ 오답! 정답: ' + q.a[q.c]);
      }
      saved.history.push({q:qIdx, correct:sel===q.c});
      if(saved.history.length > 50) saved.history = saved.history.slice(-50);
      v23Save('v23_quiz_state', saved);
      btns.forEach(function(b){ b.disabled = true; });
    });
  });
}


// ============================================================
// ACHIEVEMENTS v23 - 12 NEW (202 -> 214)
// ============================================================
var V23_ACHIEVEMENTS = [
  {id:'a_v23_roulette_spin',name:'운명의 바퀴',desc:'챌린지 룰렛을 처음 돌리기',cat:'general',icon:'🎰'},
  {id:'a_v23_roulette_10',name:'룰렛 마스터',desc:'룰렛 10회 스핀',cat:'general',icon:'🎯'},
  {id:'a_v23_combo_unlock5',name:'콤보 입문자',desc:'콤보 트리 5개 해금',cat:'general',icon:'⚔️'},
  {id:'a_v23_combo_complete',name:'콤보 마스터',desc:'콤보 트리 전체 해금',cat:'general',icon:'💥'},
  {id:'a_v23_bond_max',name:'최고의 유대',desc:'유대감 100% 달성',cat:'general',icon:'💕'},
  {id:'a_v23_evo_complete',name:'진화 완성',desc:'모든 파워업 진화 완료',cat:'general',icon:'🔮'},
  {id:'a_v23_diff_view',name:'난이도 분석가',desc:'난이도 분석기 확인',cat:'general',icon:'📊'},
  {id:'a_v23_predict_5',name:'전략가',desc:'전투 시뮬 5회 실행',cat:'general',icon:'🧠'},
  {id:'a_v23_emotion_full',name:'감정 충전 완료',desc:'감정 에너지 1개 100% 달성',cat:'general',icon:'⚡'},
  {id:'a_v23_emotion_all',name:'감정 마스터',desc:'모든 감정 에너지 50% 이상',cat:'general',icon:'🌈'},
  {id:'a_v23_quiz_master',name:'퀴즈 v23 마스터',desc:'v23 퀴즈 전문 정답',cat:'general',icon:'🏅'},
  {id:'a_v23_explorer',name:'v23 탐험가',desc:'v23 기능 전체 열어보기',cat:'general',icon:'🗺️'}
];

function checkV23Achievements(){
  var achievements;
  try{ achievements = JSON.parse(localStorage.getItem('hatcuping_achievements')) || {}; }catch(e){ achievements = {}; }
  var changed = false;

  var roulette = v23Load('v23_roulette', {spins:0});
  if(roulette.spins >= 1 && !achievements.a_v23_roulette_spin){ achievements.a_v23_roulette_spin = Date.now(); changed = true; showToastV23('🏆 운명의 바퀴 업적 달성!'); }
  if(roulette.spins >= 10 && !achievements.a_v23_roulette_10){ achievements.a_v23_roulette_10 = Date.now(); changed = true; showToastV23('🏆 룰렛 마스터 업적 달성!'); }

  var combo = v23Load('v23_combotree', {unlocked:[0]});
  if(combo.unlocked.length >= 5 && !achievements.a_v23_combo_unlock5){ achievements.a_v23_combo_unlock5 = Date.now(); changed = true; showToastV23('🏆 콤보 입문자 업적 달성!'); }
  if(combo.unlocked.length >= COMBO_NODES.length && !achievements.a_v23_combo_complete){ achievements.a_v23_combo_complete = Date.now(); changed = true; showToastV23('🏆 콤보 마스터 업적 달성!'); }

  var bonds = v23Load('v23_bonds', {levels:[]});
  if(bonds.levels && bonds.levels.some(function(l){return l>=100}) && !achievements.a_v23_bond_max){ achievements.a_v23_bond_max = Date.now(); changed = true; showToastV23('🏆 최고의 유대 업적 달성!'); }

  var evo = v23Load('v23_evopath', {evolved:[]});
  if(evo.evolved.length >= POWERUP_EVOS.length && !achievements.a_v23_evo_complete){ achievements.a_v23_evo_complete = Date.now(); changed = true; showToastV23('🏆 진화 완성 업적 달성!'); }

  var pred = v23Load('v23_predictor', {simulations:0});
  if(pred.simulations >= 5 && !achievements.a_v23_predict_5){ achievements.a_v23_predict_5 = Date.now(); changed = true; showToastV23('🏆 전략가 업적 달성!'); }

  var emotion = v23Load('v23_emotion', {charges:[]});
  if(emotion.charges && emotion.charges.some(function(c){return c>=100}) && !achievements.a_v23_emotion_full){ achievements.a_v23_emotion_full = Date.now(); changed = true; showToastV23('🏆 감정 충전 완료 업적 달성!'); }
  if(emotion.charges && emotion.charges.length >= 6 && emotion.charges.every(function(c){return c>=50}) && !achievements.a_v23_emotion_all){ achievements.a_v23_emotion_all = Date.now(); changed = true; showToastV23('🏆 감정 마스터 업적 달성!'); }

  var quiz = v23Load('v23_quiz_state', {answered:0,correct:0});
  if(quiz.answered >= 15 && quiz.correct >= 15 && !achievements.a_v23_quiz_master){ achievements.a_v23_quiz_master = Date.now(); changed = true; showToastV23('🏆 퀴즈 v23 마스터 업적 달성!'); }

  if(changed){
    try{ localStorage.setItem('hatcuping_achievements', JSON.stringify(achievements)); }catch(e){}
    var countEl = document.getElementById('achieveCount');
    if(countEl) countEl.textContent = Object.keys(achievements).length + '/24';
  }
}

setInterval(checkV23Achievements, 5000);


// ============================================================
// NAV BUTTONS - Append to existing bottom bar (UI rule compliant)
// ============================================================
function addV23NavButtons(){
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
    {label:'🎰 룰렛',fn:renderChallengeRoulette,key:'Shift+A'},
    {label:'⚔️ 콤보트리',fn:renderComboTree,key:'Shift+B'},
    {label:'💕 유대감',fn:renderBondTracker,key:'Shift+C'},
    {label:'🔮 진화경로',fn:renderEvolutionPath,key:'Shift+D'},
    {label:'📊 난이도',fn:renderDifficultyAnalyzer,key:'Shift+E'},
    {label:'⚔️ 전투예측',fn:renderBattlePredictor,key:'Shift+F'},
    {label:'⚡ 감정충전',fn:renderEmotionCharge,key:'Shift+G'},
    {label:'🏆 스코어보드',fn:renderScoreboard,key:'Shift+H'},
    {label:'❓ 퀴즈v23',fn:renderV23Quiz,key:'Shift+9'}
  ];

  if(bottomBar){
    navItems.forEach(function(item){
      var btn = document.createElement('button');
      btn.textContent = item.label;
      btn.style.cssText = 'padding:6px 10px;margin:2px;background:linear-gradient(135deg,#FF5FA2,#B066FF);color:#fff;border:none;border-radius:10px;font-size:10px;font-weight:700;cursor:pointer;white-space:nowrap';
      btn.addEventListener('click', function(){ sfxV23('v23_nav'); item.fn(); });
      bottomBar.appendChild(btn);
    });
  }

  document.addEventListener('keydown', function(e){
    if(!e.shiftKey) return;
    if(e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    var keyMap = {
      'A':renderChallengeRoulette, 'B':renderComboTree, 'C':renderBondTracker,
      'D':renderEvolutionPath, 'E':renderDifficultyAnalyzer, 'F':renderBattlePredictor,
      'G':renderEmotionCharge, 'H':renderScoreboard, '9':renderV23Quiz
    };
    var fn = keyMap[e.key.toUpperCase()];
    if(fn){ e.preventDefault(); sfxV23('v23_nav'); fn(); }
  });
}

if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', addV23NavButtons);
} else {
  addV23NavButtons();
}

})();

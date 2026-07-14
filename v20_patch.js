// hatcuping-game v20_patch.js - NEXTERA+PRISM AUTO v20.0
// Self-contained IIFE patch module
(function(){
'use strict';

var _v20Ctx = null;
function _v20InitAudio(){
  if(!_v20Ctx){
    try{ _v20Ctx = new (window.AudioContext || window.webkitAudioContext)(); }catch(e){}
  }
  if(_v20Ctx && _v20Ctx.state === 'suspended') _v20Ctx.resume();
}

var V20_SFX = {
  tournament_start:{f:880,d:.12,t:'triangle'},
  tournament_win:{f:1200,d:.18,t:'sine'},
  tournament_lose:{f:300,d:.15,t:'sawtooth'},
  compat_match:{f:990,d:.08,t:'sine'},
  compat_perfect:{f:1400,d:.2,t:'triangle'},
  combo_mix:{f:660,d:.06,t:'sine'},
  combo_success:{f:1100,d:.14,t:'triangle'},
  bossrush_go:{f:500,d:.05,t:'square'},
  bossrush_clear:{f:1300,d:.16,t:'triangle'},
  economy_coin:{f:1320,d:.08,t:'sine'},
  scorecard_gen:{f:800,d:.1,t:'triangle'},
  v20_nav:{f:700,d:.05,t:'sine'}
};

function sfxV20(type){
  _v20InitAudio();
  if(!_v20Ctx) return;
  var s = V20_SFX[type];
  if(!s) return;
  try{
    var muted = false;
    try{ muted = localStorage.getItem('hatcuping_mute') === '1'; }catch(e){}
    if(muted) return;
    var osc = _v20Ctx.createOscillator();
    var gain = _v20Ctx.createGain();
    osc.type = s.t || 'sine';
    osc.frequency.value = s.f;
    gain.gain.value = 0.08;
    osc.connect(gain);
    gain.connect(_v20Ctx.destination);
    osc.start();
    osc.stop(_v20Ctx.currentTime + (s.d || 0.06));
  }catch(e){}
}

function v20Load(key, fb){ try{ var d = JSON.parse(localStorage.getItem(key)); return d !== null ? d : fb; }catch(e){ return fb; } }
function v20Save(key, data){ try{ localStorage.setItem(key, JSON.stringify(data)); }catch(e){} }
function isDarkV20(){ return document.body.classList.contains('dark'); }
function showToastV20(msg){
  var t = document.getElementById('achieveToast');
  if(t){ t.innerHTML = msg; t.classList.add('show'); setTimeout(function(){ t.classList.remove('show'); }, 2500); }
}

function createV20Modal(title, contentHTML){
  var overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.6);z-index:9999;display:flex;justify-content:center;align-items:center;backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px)';
  var modal = document.createElement('div');
  var bg = isDarkV20() ? '#2a1a3e' : '#fff';
  var col = isDarkV20() ? '#eee' : '#333';
  modal.style.cssText = 'background:' + bg + ';color:' + col + ';border-radius:24px;padding:24px;max-width:440px;width:92%;max-height:85vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.25);position:relative';
  modal.innerHTML = '<button style="position:absolute;top:12px;right:16px;background:none;border:none;font-size:24px;cursor:pointer;color:' + col + '" onclick="this.closest(\'div[style]\').parentElement.remove()">&times;</button><h3 style="font-size:18px;margin-bottom:16px;color:#FF5FA2">' + title + '</h3>' + contentHTML;
  overlay.appendChild(modal);
  overlay.addEventListener('click', function(e){ if(e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
  return modal;
}

// ============================================================
// 1. TINIPING BATTLE TOURNAMENT (Canvas 580x380)
// ============================================================
var TOURNAMENT_FIGHTERS = [
  {name:'하츄핑',hp:100,atk:18,def:12,spd:15,icon:'💖',type:'사랑'},
  {name:'바로핑',hp:95,atk:20,def:14,spd:13,icon:'⚖️',type:'정의'},
  {name:'아자핑',hp:90,atk:22,def:10,spd:16,icon:'💪',type:'용기'},
  {name:'차차핑',hp:85,atk:16,def:16,spd:18,icon:'💃',type:'활력'},
  {name:'해필핑',hp:110,atk:14,def:18,spd:10,icon:'😊',type:'행복'},
  {name:'라라핑',hp:88,atk:19,def:11,spd:17,icon:'🎵',type:'음악'},
  {name:'키키핑',hp:92,atk:21,def:9,spd:19,icon:'😈',type:'장난'},
  {name:'무무핑',hp:115,atk:12,def:20,spd:8,icon:'🛡️',type:'수호'}
];

function openBattleTournament(){
  sfxV20('tournament_start');
  var state = v20Load('v20_tournament', {wins:0,losses:0,streak:0,bestStreak:0});
  var html = '<div style="text-align:center;margin-bottom:12px"><canvas id="v20TournCanvas" width="580" height="380" style="max-width:100%;border-radius:12px;background:' + (isDarkV20()?'#1a1030':'#FFF8FC') + '"></canvas></div>';
  html += '<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-bottom:12px">';
  TOURNAMENT_FIGHTERS.forEach(function(f,i){
    html += '<button class="v20-fighter-btn" data-idx="' + i + '" style="padding:8px 12px;border-radius:12px;border:2px solid rgba(255,95,162,.2);background:' + (isDarkV20()?'rgba(255,255,255,.06)':'rgba(255,95,162,.05)') + ';cursor:pointer;font-size:13px;font-weight:700;color:' + (isDarkV20()?'#eee':'#333') + '">' + f.icon + ' ' + f.name + '</button>';
  });
  html += '</div>';
  html += '<div id="v20BattleLog" style="font-size:12px;color:#888;min-height:40px;text-align:center">파이터를 선택하세요!</div>';
  html += '<div style="text-align:center;margin-top:8px;font-size:12px;color:#888">전적: <span style="color:#4CAF50;font-weight:700">' + state.wins + '승</span> / <span style="color:#F44336;font-weight:700">' + state.losses + '패</span> | 최고 연승: <span style="color:#FF5FA2;font-weight:700">' + state.bestStreak + '</span></div>';

  var modal = createV20Modal('🏟️ 티니핑 배틀 토너먼트', html);
  drawTournamentBracket(null, null);

  modal.querySelectorAll('.v20-fighter-btn').forEach(function(btn){
    btn.onclick = function(){
      var idx = parseInt(btn.dataset.idx);
      runBattle(idx, state, modal);
    };
  });
}

function drawTournamentBracket(playerFighter, opponentFighter){
  var c = document.getElementById('v20TournCanvas');
  if(!c) return;
  var ctx = c.getContext('2d');
  var dk = isDarkV20();
  ctx.clearRect(0,0,580,380);
  ctx.fillStyle = dk ? '#1a1030' : '#FFF8FC';
  ctx.fillRect(0,0,580,380);

  ctx.font = 'bold 16px sans-serif';
  ctx.fillStyle = dk ? '#FF8EC4' : '#FF5FA2';
  ctx.textAlign = 'center';
  ctx.fillText('⚔️ 배틀 토너먼트', 290, 30);

  var bracketY = [60, 120, 180, 240];
  ctx.strokeStyle = dk ? 'rgba(255,255,255,.15)' : 'rgba(0,0,0,.1)';
  ctx.lineWidth = 2;

  for(var r = 0; r < 4; r++){
    ctx.beginPath();
    ctx.roundRect(30, bracketY[r], 160, 40, 8);
    ctx.stroke();
    ctx.beginPath();
    ctx.roundRect(390, bracketY[r], 160, 40, 8);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(190, bracketY[r] + 20);
    ctx.lineTo(230, bracketY[r] + 20);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(350, bracketY[r] + 20);
    ctx.lineTo(390, bracketY[r] + 20);
    ctx.stroke();

    ctx.font = '12px sans-serif';
    ctx.fillStyle = dk ? '#aaa' : '#888';
    ctx.textAlign = 'center';
    var leftF = TOURNAMENT_FIGHTERS[r];
    var rightF = TOURNAMENT_FIGHTERS[r + 4];
    ctx.fillText(leftF.icon + ' ' + leftF.name, 110, bracketY[r] + 25);
    ctx.fillText(rightF.icon + ' ' + rightF.name, 470, bracketY[r] + 25);
  }

  ctx.beginPath();
  ctx.roundRect(230, 130, 120, 50, 10);
  ctx.fillStyle = 'rgba(255,95,162,.1)';
  ctx.fill();
  ctx.stroke();

  ctx.font = 'bold 13px sans-serif';
  ctx.fillStyle = dk ? '#FFD700' : '#D4940A';
  ctx.textAlign = 'center';
  ctx.fillText('🏆 결승전', 290, 160);

  if(playerFighter && opponentFighter){
    ctx.font = 'bold 14px sans-serif';
    ctx.fillStyle = '#4CAF50';
    ctx.fillText(playerFighter.icon + ' vs ' + opponentFighter.icon, 290, 330);
  }

  ctx.font = '11px sans-serif';
  ctx.fillStyle = dk ? '#666' : '#bbb';
  ctx.fillText('파이터를 골라 대전하세요!', 290, 370);
}

function runBattle(playerIdx, state, modal){
  var player = Object.assign({}, TOURNAMENT_FIGHTERS[playerIdx]);
  var oppIdx;
  do { oppIdx = Math.floor(Math.random() * TOURNAMENT_FIGHTERS.length); } while(oppIdx === playerIdx);
  var opp = Object.assign({}, TOURNAMENT_FIGHTERS[oppIdx]);

  drawTournamentBracket(player, opp);

  var pHP = player.hp, oHP = opp.hp;
  var log = [];
  var round = 0;
  while(pHP > 0 && oHP > 0 && round < 20){
    round++;
    var pFirst = player.spd >= opp.spd;
    if(pFirst){
      var dmg1 = Math.max(1, player.atk - opp.def / 2 + Math.floor(Math.random() * 6));
      oHP -= dmg1;
      log.push(player.name + ' → ' + dmg1 + ' 데미지!');
      if(oHP > 0){
        var dmg2 = Math.max(1, opp.atk - player.def / 2 + Math.floor(Math.random() * 6));
        pHP -= dmg2;
        log.push(opp.name + ' → ' + dmg2 + ' 데미지!');
      }
    } else {
      var dmg2b = Math.max(1, opp.atk - player.def / 2 + Math.floor(Math.random() * 6));
      pHP -= dmg2b;
      log.push(opp.name + ' → ' + dmg2b + ' 데미지!');
      if(pHP > 0){
        var dmg1b = Math.max(1, player.atk - opp.def / 2 + Math.floor(Math.random() * 6));
        oHP -= dmg1b;
        log.push(player.name + ' → ' + dmg1b + ' 데미지!');
      }
    }
  }

  var won = pHP > 0;
  if(won){ state.wins++; state.streak++; if(state.streak > state.bestStreak) state.bestStreak = state.streak; sfxV20('tournament_win'); }
  else { state.losses++; state.streak = 0; sfxV20('tournament_lose'); }
  v20Save('v20_tournament', state);

  var logEl = modal.querySelector('#v20BattleLog');
  if(logEl){
    logEl.innerHTML = '<div style="font-weight:700;color:' + (won?'#4CAF50':'#F44336') + ';font-size:14px;margin-bottom:4px">' + (won?'🎉 승리!':'😢 패배...') + ' ' + player.icon + player.name + ' vs ' + opp.icon + opp.name + '</div>' +
      '<div style="font-size:11px;color:#888">' + log.slice(-4).join(' | ') + '</div>' +
      '<div style="margin-top:6px;font-size:12px">전적: <span style="color:#4CAF50;font-weight:700">' + state.wins + '승</span> / <span style="color:#F44336;font-weight:700">' + state.losses + '패</span> | 연승: ' + state.streak + ' | 최고: ' + state.bestStreak + '</div>';
  }
}


// ============================================================
// 2. TINIPING PERSONALITY COMPATIBILITY (Canvas 560x360)
// ============================================================
var PERSONALITIES = [
  {name:'다정한',traits:[9,5,3,7,8,6],color:'#FF5FA2'},
  {name:'용감한',traits:[5,9,7,8,4,6],color:'#F44336'},
  {name:'지혜로운',traits:[6,4,9,5,7,8],color:'#2196F3'},
  {name:'활발한',traits:[7,6,5,9,5,7],color:'#FF9800'},
  {name:'차분한',traits:[8,3,8,4,9,7],color:'#4CAF50'},
  {name:'유머있는',traits:[6,7,4,8,5,9],color:'#9C27B0'}
];
var TRAIT_LABELS = ['사랑','용기','지혜','활력','평화','매력'];

function openCompatibilityTest(){
  sfxV20('compat_match');
  var html = '<div style="text-align:center;margin-bottom:12px"><canvas id="v20CompatCanvas" width="560" height="360" style="max-width:100%;border-radius:12px;background:' + (isDarkV20()?'#1a1030':'#FFF8FC') + '"></canvas></div>';
  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">';
  html += '<div><label style="font-size:12px;font-weight:700;color:#FF5FA2">내 성격</label><select id="v20Pers1" style="width:100%;padding:6px;border-radius:8px;border:1px solid rgba(255,95,162,.3);background:' + (isDarkV20()?'#2a1a3e':'#fff') + ';color:' + (isDarkV20()?'#eee':'#333') + '">';
  PERSONALITIES.forEach(function(p,i){ html += '<option value="' + i + '">' + p.name + '</option>'; });
  html += '</select></div>';
  html += '<div><label style="font-size:12px;font-weight:700;color:#B066FF">파트너 성격</label><select id="v20Pers2" style="width:100%;padding:6px;border-radius:8px;border:1px solid rgba(176,102,255,.3);background:' + (isDarkV20()?'#2a1a3e':'#fff') + ';color:' + (isDarkV20()?'#eee':'#333') + '">';
  PERSONALITIES.forEach(function(p,i){ html += '<option value="' + i + '"' + (i===1?' selected':'') + '>' + p.name + '</option>'; });
  html += '</select></div></div>';
  html += '<button id="v20CompatBtn" style="display:block;width:100%;padding:10px;background:linear-gradient(135deg,#FF5FA2,#B066FF);color:#fff;border:none;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer">💕 궁합 분석하기!</button>';
  html += '<div id="v20CompatResult" style="text-align:center;margin-top:8px;font-size:13px;color:#888"></div>';

  var modal = createV20Modal('💕 티니핑 성격 궁합 테스터', html);
  drawCompatRadar(0, 1, 0);

  modal.querySelector('#v20CompatBtn').onclick = function(){
    var i1 = parseInt(modal.querySelector('#v20Pers1').value);
    var i2 = parseInt(modal.querySelector('#v20Pers2').value);
    var score = calcCompat(i1, i2);
    drawCompatRadar(i1, i2, score);
    sfxV20(score >= 80 ? 'compat_perfect' : 'compat_match');
    var grade = score >= 90 ? 'S' : score >= 80 ? 'A' : score >= 65 ? 'B' : score >= 50 ? 'C' : 'D';
    var gradeColor = grade === 'S' ? '#FFD700' : grade === 'A' ? '#4CAF50' : grade === 'B' ? '#2196F3' : grade === 'C' ? '#FF9800' : '#F44336';
    modal.querySelector('#v20CompatResult').innerHTML = '궁합 점수: <span style="font-size:20px;font-weight:800;color:' + gradeColor + '">' + score + '% (' + grade + ')</span>';
    v20Save('v20_compat_last', {p1:i1,p2:i2,score:score});
  };
}

function calcCompat(i1, i2){
  var p1 = PERSONALITIES[i1].traits, p2 = PERSONALITIES[i2].traits;
  var sum = 0, max = 0;
  for(var i=0;i<6;i++){
    var complement = 10 - Math.abs(p1[i] - p2[i]);
    sum += complement;
    max += 10;
  }
  return Math.round(sum / max * 100);
}

function drawCompatRadar(i1, i2, score){
  var c = document.getElementById('v20CompatCanvas');
  if(!c) return;
  var ctx = c.getContext('2d');
  var dk = isDarkV20();
  ctx.clearRect(0,0,560,360);
  ctx.fillStyle = dk ? '#1a1030' : '#FFF8FC';
  ctx.fillRect(0,0,560,360);

  var cx = 280, cy = 195, r = 120;
  var angles = [];
  for(var i=0;i<6;i++) angles.push(-Math.PI/2 + (Math.PI*2/6)*i);

  for(var lv=1;lv<=5;lv++){
    ctx.beginPath();
    var lr = r * lv / 5;
    for(var j=0;j<6;j++){
      var x = cx + lr * Math.cos(angles[j]);
      var y = cy + lr * Math.sin(angles[j]);
      if(j===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    }
    ctx.closePath();
    ctx.strokeStyle = dk ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.06)';
    ctx.stroke();
  }

  for(var j=0;j<6;j++){
    ctx.beginPath();
    ctx.moveTo(cx,cy);
    ctx.lineTo(cx + r * Math.cos(angles[j]), cy + r * Math.sin(angles[j]));
    ctx.strokeStyle = dk ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.06)';
    ctx.stroke();
    ctx.font = 'bold 11px sans-serif';
    ctx.fillStyle = dk ? '#aaa' : '#666';
    ctx.textAlign = 'center';
    var lx = cx + (r+20) * Math.cos(angles[j]);
    var ly = cy + (r+20) * Math.sin(angles[j]);
    ctx.fillText(TRAIT_LABELS[j], lx, ly + 4);
  }

  var p1 = PERSONALITIES[i1], p2 = PERSONALITIES[i2];
  [p1, p2].forEach(function(p, pi){
    ctx.beginPath();
    for(var j=0;j<6;j++){
      var v = p.traits[j] / 10 * r;
      var x = cx + v * Math.cos(angles[j]);
      var y = cy + v * Math.sin(angles[j]);
      if(j===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    }
    ctx.closePath();
    ctx.fillStyle = p.color + '33';
    ctx.fill();
    ctx.strokeStyle = p.color;
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillStyle = p1.color;
  ctx.fillText('● ' + p1.name, 20, 30);
  ctx.fillStyle = p2.color;
  ctx.fillText('● ' + p2.name, 20, 50);

  if(score > 0){
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillStyle = score >= 80 ? '#FFD700' : score >= 60 ? '#4CAF50' : '#FF9800';
    ctx.fillText(score + '%', 540, 35);
    ctx.font = '12px sans-serif';
    ctx.fillStyle = dk ? '#888' : '#aaa';
    ctx.fillText('궁합 점수', 540, 52);
  }

  ctx.font = 'bold 16px sans-serif';
  ctx.fillStyle = dk ? '#FF8EC4' : '#FF5FA2';
  ctx.textAlign = 'center';
  ctx.fillText('💕 성격 궁합 레이더', 280, 355);
}


// ============================================================
// 3. POWER-UP COMBO LAB (Canvas 580x360)
// ============================================================
var POWERUPS = [
  {name:'별빛방패',icon:'🛡️',type:'방어',power:30},
  {name:'번개부츠',icon:'⚡',type:'속도',power:35},
  {name:'불꽃검',icon:'🗡️',type:'공격',power:40},
  {name:'힐링오브',icon:'💚',type:'회복',power:25},
  {name:'마법지팡이',icon:'🪄',type:'마법',power:38},
  {name:'행운클로버',icon:'🍀',type:'행운',power:20}
];

var COMBO_RECIPES = [
  {a:0,b:2,result:'불꽃의 수호자',grade:'S',bonus:85,desc:'방어+공격 완벽조합'},
  {a:1,b:4,result:'번개마법사',grade:'S',bonus:88,desc:'속도+마법 극강시너지'},
  {a:2,b:4,result:'화염마도사',grade:'A',bonus:75,desc:'공격+마법 파괴력'},
  {a:0,b:3,result:'치유전사',grade:'A',bonus:70,desc:'방어+회복 철벽힐러'},
  {a:1,b:5,result:'행운의 질주',grade:'B',bonus:55,desc:'속도+행운 럭키러너'},
  {a:3,b:5,result:'기적의 치유',grade:'A',bonus:72,desc:'회복+행운 기적발동'},
  {a:0,b:1,result:'민첩방패',grade:'B',bonus:60,desc:'방어+속도 밸런스형'},
  {a:2,b:3,result:'흡혈검',grade:'A',bonus:78,desc:'공격+회복 흡혈공격'},
  {a:4,b:5,result:'행운마법',grade:'B',bonus:58,desc:'마법+행운 확률업'},
  {a:0,b:4,result:'마법갑옷',grade:'A',bonus:68,desc:'방어+마법 마법방어'}
];

function openComboLab(){
  sfxV20('combo_mix');
  var state = v20Load('v20_combos', {discovered:[]});
  var html = '<div style="text-align:center;margin-bottom:12px"><canvas id="v20ComboCanvas" width="580" height="360" style="max-width:100%;border-radius:12px;background:' + (isDarkV20()?'#1a1030':'#FFF8FC') + '"></canvas></div>';
  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">';
  html += '<div><label style="font-size:12px;font-weight:700;color:#FF5FA2">파워업 A</label><select id="v20ComboA" style="width:100%;padding:6px;border-radius:8px;border:1px solid rgba(255,95,162,.3);background:' + (isDarkV20()?'#2a1a3e':'#fff') + ';color:' + (isDarkV20()?'#eee':'#333') + '">';
  POWERUPS.forEach(function(p,i){ html += '<option value="' + i + '">' + p.icon + ' ' + p.name + '</option>'; });
  html += '</select></div>';
  html += '<div><label style="font-size:12px;font-weight:700;color:#B066FF">파워업 B</label><select id="v20ComboB" style="width:100%;padding:6px;border-radius:8px;border:1px solid rgba(176,102,255,.3);background:' + (isDarkV20()?'#2a1a3e':'#fff') + ';color:' + (isDarkV20()?'#eee':'#333') + '">';
  POWERUPS.forEach(function(p,i){ html += '<option value="' + i + '"' + (i===2?' selected':'') + '>' + p.icon + ' ' + p.name + '</option>'; });
  html += '</select></div></div>';
  html += '<button id="v20ComboBtn" style="display:block;width:100%;padding:10px;background:linear-gradient(135deg,#FF9800,#F44336);color:#fff;border:none;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer">⚗️ 조합 실험!</button>';
  html += '<div id="v20ComboResult" style="text-align:center;margin-top:8px;font-size:13px;color:#888">두 파워업을 선택해 조합하세요!</div>';
  html += '<div style="text-align:center;margin-top:4px;font-size:11px;color:#aaa">발견한 조합: ' + state.discovered.length + '/' + COMBO_RECIPES.length + '</div>';

  var modal = createV20Modal('⚗️ 파워업 조합 실험실', html);
  drawComboChart(state);

  modal.querySelector('#v20ComboBtn').onclick = function(){
    var a = parseInt(modal.querySelector('#v20ComboA').value);
    var b = parseInt(modal.querySelector('#v20ComboB').value);
    if(a === b){ modal.querySelector('#v20ComboResult').innerHTML = '⚠️ 같은 파워업은 조합할 수 없어요!'; return; }
    var recipe = COMBO_RECIPES.find(function(r){ return (r.a===a && r.b===b) || (r.a===b && r.b===a); });
    if(recipe){
      sfxV20('combo_success');
      if(state.discovered.indexOf(recipe.result) === -1){ state.discovered.push(recipe.result); v20Save('v20_combos', state); }
      var gc = recipe.grade === 'S' ? '#FFD700' : recipe.grade === 'A' ? '#4CAF50' : '#2196F3';
      modal.querySelector('#v20ComboResult').innerHTML = '✨ <span style="font-weight:800;color:' + gc + '">' + recipe.result + ' (' + recipe.grade + '등급)</span><br><span style="font-size:11px">' + recipe.desc + ' | 보너스: +' + recipe.bonus + '%</span>';
    } else {
      modal.querySelector('#v20ComboResult').innerHTML = '💨 조합 실패... 다른 조합을 시도해보세요!';
    }
    drawComboChart(state);
  };
}

function drawComboChart(state){
  var c = document.getElementById('v20ComboCanvas');
  if(!c) return;
  var ctx = c.getContext('2d');
  var dk = isDarkV20();
  ctx.clearRect(0,0,580,360);
  ctx.fillStyle = dk ? '#1a1030' : '#FFF8FC';
  ctx.fillRect(0,0,580,360);

  ctx.font = 'bold 14px sans-serif';
  ctx.fillStyle = dk ? '#FF8EC4' : '#FF5FA2';
  ctx.textAlign = 'center';
  ctx.fillText('⚗️ 조합 레시피 차트', 290, 25);

  var bw = 48, bh = 20, sx = 40, sy = 50;
  COMBO_RECIPES.forEach(function(r, i){
    var y = sy + i * 28;
    var discovered = state.discovered.indexOf(r.result) !== -1;
    ctx.fillStyle = discovered ? (r.grade==='S'?'rgba(255,215,0,.2)':r.grade==='A'?'rgba(76,175,80,.15)':'rgba(33,150,243,.1)') : (dk?'rgba(255,255,255,.03)':'rgba(0,0,0,.03)');
    ctx.beginPath();
    ctx.roundRect(sx, y, 500, 24, 6);
    ctx.fill();

    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = dk ? '#ccc' : '#555';
    ctx.fillText(POWERUPS[r.a].icon + '+' + POWERUPS[r.b].icon, sx+8, y+16);

    ctx.fillStyle = discovered ? (dk?'#eee':'#333') : (dk?'#555':'#ccc');
    ctx.fillText(discovered ? r.result : '???', sx+70, y+16);

    var gc = r.grade==='S'?'#FFD700':r.grade==='A'?'#4CAF50':'#2196F3';
    ctx.fillStyle = discovered ? gc : (dk?'#444':'#ddd');
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText(discovered ? r.grade : '?', sx + 250, y+16);

    if(discovered){
      var barW = r.bonus / 100 * 200;
      ctx.fillStyle = gc + '44';
      ctx.beginPath();
      ctx.roundRect(sx+270, y+4, 200, 16, 4);
      ctx.fill();
      ctx.fillStyle = gc;
      ctx.beginPath();
      ctx.roundRect(sx+270, y+4, barW, 16, 4);
      ctx.fill();
      ctx.font = '10px sans-serif';
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText('+' + r.bonus + '%', sx+270+barW/2, y+16);
      ctx.textAlign = 'left';
    }
  });

  ctx.font = '11px sans-serif';
  ctx.fillStyle = dk ? '#666' : '#bbb';
  ctx.textAlign = 'center';
  ctx.fillText('발견: ' + state.discovered.length + '/' + COMBO_RECIPES.length, 290, 350);
}


// ============================================================
// 4. BOSS RUSH CHALLENGE (Canvas 580x360)
// ============================================================
var BOSSES_RUSH = [
  {name:'그림자왕',hp:200,atk:15,icon:'👤',weak:'사랑'},
  {name:'폭풍마녀',hp:180,atk:18,icon:'🌪️',weak:'평화'},
  {name:'얼음거인',hp:250,atk:12,icon:'🧊',weak:'용기'},
  {name:'불꽃드래곤',hp:220,atk:20,icon:'🐉',weak:'지혜'},
  {name:'어둠기사',hp:240,atk:17,icon:'⚔️',weak:'사랑'},
  {name:'독안개요정',hp:160,atk:22,icon:'🧚',weak:'활력'},
  {name:'시간수호자',hp:280,atk:14,icon:'⏳',weak:'용기'},
  {name:'절망의제왕',hp:350,atk:25,icon:'💀',weak:'사랑'}
];

function openBossRush(){
  sfxV20('bossrush_go');
  var state = v20Load('v20_bossrush', {bestTime:null,clears:0,currentBoss:0});
  var html = '<div style="text-align:center;margin-bottom:12px"><canvas id="v20BossRushCanvas" width="580" height="360" style="max-width:100%;border-radius:12px;background:' + (isDarkV20()?'#1a1030':'#FFF8FC') + '"></canvas></div>';
  html += '<div style="display:flex;gap:8px;justify-content:center;margin-bottom:8px">';
  html += '<button id="v20RushStart" style="padding:8px 20px;background:linear-gradient(135deg,#F44336,#FF5722);color:#fff;border:none;border-radius:12px;font-size:13px;font-weight:700;cursor:pointer">⚔️ 러시 시작!</button>';
  html += '<button id="v20RushReset" style="padding:8px 20px;background:rgba(0,0,0,.1);border:none;border-radius:12px;font-size:13px;font-weight:700;cursor:pointer;color:' + (isDarkV20()?'#aaa':'#666') + '">🔄 리셋</button>';
  html += '</div>';
  html += '<div id="v20RushLog" style="text-align:center;font-size:12px;color:#888">8보스를 연속으로 격파하세요! 최고기록: ' + (state.bestTime ? (state.bestTime/1000).toFixed(1)+'초' : '미기록') + '</div>';

  var modal = createV20Modal('⚔️ 보스 러시 챌린지', html);
  drawBossRush(state, null);

  modal.querySelector('#v20RushStart').onclick = function(){
    var startTime = Date.now();
    var bossIdx = 0;
    function fightNext(){
      if(bossIdx >= BOSSES_RUSH.length){
        var elapsed = Date.now() - startTime;
        state.clears++;
        if(!state.bestTime || elapsed < state.bestTime) state.bestTime = elapsed;
        v20Save('v20_bossrush', state);
        sfxV20('bossrush_clear');
        modal.querySelector('#v20RushLog').innerHTML = '🎉 전원 격파! 시간: <span style="color:#FFD700;font-weight:800">' + (elapsed/1000).toFixed(1) + '초</span> | 최고: ' + (state.bestTime/1000).toFixed(1) + '초 | 클리어: ' + state.clears + '회';
        drawBossRush(state, null);
        return;
      }
      var boss = BOSSES_RUSH[bossIdx];
      drawBossRush(state, bossIdx);
      sfxV20('bossrush_go');
      modal.querySelector('#v20RushLog').innerHTML = '⚔️ ' + boss.icon + ' ' + boss.name + ' 전투 중... (' + (bossIdx+1) + '/8)';
      setTimeout(function(){
        bossIdx++;
        fightNext();
      }, 400 + Math.floor(Math.random() * 300));
    }
    fightNext();
  };

  modal.querySelector('#v20RushReset').onclick = function(){
    state = {bestTime:null,clears:0,currentBoss:0};
    v20Save('v20_bossrush', state);
    drawBossRush(state, null);
    modal.querySelector('#v20RushLog').innerHTML = '리셋 완료! 다시 도전하세요!';
  };
}

function drawBossRush(state, activeBoss){
  var c = document.getElementById('v20BossRushCanvas');
  if(!c) return;
  var ctx = c.getContext('2d');
  var dk = isDarkV20();
  ctx.clearRect(0,0,580,360);
  ctx.fillStyle = dk ? '#1a1030' : '#FFF8FC';
  ctx.fillRect(0,0,580,360);

  ctx.font = 'bold 14px sans-serif';
  ctx.fillStyle = dk ? '#FF8EC4' : '#FF5FA2';
  ctx.textAlign = 'center';
  ctx.fillText('⚔️ 보스 러시 챌린지', 290, 25);

  BOSSES_RUSH.forEach(function(boss, i){
    var col = i % 4;
    var row = Math.floor(i / 4);
    var bx = 40 + col * 130;
    var by = 50 + row * 150;
    var isActive = activeBoss === i;
    var isCleared = activeBoss !== null && i < activeBoss;

    ctx.fillStyle = isActive ? 'rgba(255,95,162,.15)' : isCleared ? 'rgba(76,175,80,.1)' : (dk?'rgba(255,255,255,.04)':'rgba(0,0,0,.03)');
    ctx.beginPath();
    ctx.roundRect(bx, by, 115, 130, 12);
    ctx.fill();

    if(isActive){
      ctx.strokeStyle = '#FF5FA2';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.font = '28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(boss.icon, bx + 57, by + 40);

    ctx.font = 'bold 12px sans-serif';
    ctx.fillStyle = isCleared ? '#4CAF50' : (dk?'#eee':'#333');
    ctx.fillText(boss.name, bx + 57, by + 60);

    ctx.font = '10px sans-serif';
    ctx.fillStyle = dk ? '#888' : '#aaa';
    ctx.fillText('HP:' + boss.hp + ' ATK:' + boss.atk, bx + 57, by + 78);
    ctx.fillText('약점: ' + boss.weak, bx + 57, by + 92);

    var hpPct = isCleared ? 0 : 1;
    ctx.fillStyle = dk ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.06)';
    ctx.beginPath();
    ctx.roundRect(bx + 10, by + 100, 95, 8, 4);
    ctx.fill();
    ctx.fillStyle = isCleared ? '#4CAF50' : '#F44336';
    ctx.beginPath();
    ctx.roundRect(bx + 10, by + 100, 95 * hpPct, 8, 4);
    ctx.fill();

    if(isCleared){
      ctx.font = 'bold 14px sans-serif';
      ctx.fillStyle = '#4CAF50';
      ctx.fillText('✓', bx + 57, by + 125);
    }
  });

  ctx.font = '11px sans-serif';
  ctx.fillStyle = dk ? '#666' : '#bbb';
  ctx.textAlign = 'center';
  ctx.fillText('최고기록: ' + (state.bestTime ? (state.bestTime/1000).toFixed(1)+'초' : '미기록') + ' | 클리어: ' + state.clears + '회', 290, 350);
}


// ============================================================
// 5. HATCUPING ECONOMY SIMULATOR (Canvas 580x360)
// ============================================================
function openEconomy(){
  sfxV20('economy_coin');
  var state = v20Load('v20_economy', {coins:100,gems:5,items:0,rounds:0,income:[]});
  var html = '<div style="text-align:center;margin-bottom:12px"><canvas id="v20EconCanvas" width="580" height="360" style="max-width:100%;border-radius:12px;background:' + (isDarkV20()?'#1a1030':'#FFF8FC') + '"></canvas></div>';
  html += '<div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-bottom:8px">';
  html += '<button class="v20-econ-btn" data-act="quest" style="padding:6px 14px;border-radius:10px;border:2px solid rgba(76,175,80,.3);background:rgba(76,175,80,.08);cursor:pointer;font-size:12px;font-weight:700;color:' + (isDarkV20()?'#8BC34A':'#388E3C') + '">🗡️ 모험 (+10~30코인)</button>';
  html += '<button class="v20-econ-btn" data-act="mine" style="padding:6px 14px;border-radius:10px;border:2px solid rgba(33,150,243,.3);background:rgba(33,150,243,.08);cursor:pointer;font-size:12px;font-weight:700;color:' + (isDarkV20()?'#64B5F6':'#1976D2') + '">⛏️ 채굴 (+1보석)</button>';
  html += '<button class="v20-econ-btn" data-act="shop" style="padding:6px 14px;border-radius:10px;border:2px solid rgba(255,152,0,.3);background:rgba(255,152,0,.08);cursor:pointer;font-size:12px;font-weight:700;color:' + (isDarkV20()?'#FFB74D':'#E65100') + '">🏪 구매 (-50코인, +1아이템)</button>';
  html += '<button class="v20-econ-btn" data-act="gamble" style="padding:6px 14px;border-radius:10px;border:2px solid rgba(156,39,176,.3);background:rgba(156,39,176,.08);cursor:pointer;font-size:12px;font-weight:700;color:' + (isDarkV20()?'#CE93D8':'#7B1FA2') + '">🎰 도박 (±20코인)</button>';
  html += '</div>';
  html += '<div id="v20EconLog" style="text-align:center;font-size:12px;color:#888">코인: ' + state.coins + ' 💎보석: ' + state.gems + ' 📦아이템: ' + state.items + '</div>';

  var modal = createV20Modal('💰 하츄핑 경제 시뮬레이터', html);
  drawEconChart(state);

  modal.querySelectorAll('.v20-econ-btn').forEach(function(btn){
    btn.onclick = function(){
      var act = btn.dataset.act;
      var msg = '';
      if(act === 'quest'){
        var earn = 10 + Math.floor(Math.random() * 21);
        state.coins += earn;
        state.rounds++;
        state.income.push(earn);
        if(state.income.length > 20) state.income.shift();
        msg = '🗡️ 모험 완료! +' + earn + '코인';
      } else if(act === 'mine'){
        state.gems++;
        state.rounds++;
        state.income.push(0);
        if(state.income.length > 20) state.income.shift();
        msg = '⛏️ 보석 채굴! +1보석';
      } else if(act === 'shop'){
        if(state.coins < 50){ msg = '⚠️ 코인이 부족합니다! (50 필요)'; }
        else { state.coins -= 50; state.items++; state.income.push(-50); if(state.income.length > 20) state.income.shift(); msg = '🏪 아이템 구매! -50코인, +1아이템'; }
      } else if(act === 'gamble'){
        var win = Math.random() > 0.5;
        var amt = Math.floor(Math.random() * 21) + 10;
        if(win){ state.coins += amt; msg = '🎰 대박! +' + amt + '코인'; } else { state.coins = Math.max(0, state.coins - amt); msg = '🎰 실패... -' + amt + '코인'; }
        state.rounds++;
        state.income.push(win ? amt : -amt);
        if(state.income.length > 20) state.income.shift();
      }
      sfxV20('economy_coin');
      v20Save('v20_economy', state);
      drawEconChart(state);
      modal.querySelector('#v20EconLog').innerHTML = msg + ' | 코인: <span style="color:#FFD700;font-weight:700">' + state.coins + '</span> 💎' + state.gems + ' 📦' + state.items;
    };
  });
}

function drawEconChart(state){
  var c = document.getElementById('v20EconCanvas');
  if(!c) return;
  var ctx = c.getContext('2d');
  var dk = isDarkV20();
  ctx.clearRect(0,0,580,360);
  ctx.fillStyle = dk ? '#1a1030' : '#FFF8FC';
  ctx.fillRect(0,0,580,360);

  ctx.font = 'bold 14px sans-serif';
  ctx.fillStyle = dk ? '#FF8EC4' : '#FF5FA2';
  ctx.textAlign = 'center';
  ctx.fillText('💰 경제 대시보드', 290, 25);

  var resources = [
    {name:'코인',val:state.coins,max:500,color:'#FFD700',icon:'🪙'},
    {name:'보석',val:state.gems,max:50,color:'#2196F3',icon:'💎'},
    {name:'아이템',val:state.items,max:30,color:'#4CAF50',icon:'📦'},
    {name:'라운드',val:state.rounds,max:100,color:'#FF5FA2',icon:'🎮'}
  ];

  resources.forEach(function(r, i){
    var bx = 30, by = 45 + i * 40;
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = dk ? '#ccc' : '#555';
    ctx.fillText(r.icon + ' ' + r.name, bx, by + 14);

    ctx.fillStyle = dk ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.04)';
    ctx.beginPath();
    ctx.roundRect(bx + 80, by, 350, 22, 6);
    ctx.fill();

    var w = Math.min(r.val / r.max, 1) * 350;
    ctx.fillStyle = r.color;
    ctx.beginPath();
    ctx.roundRect(bx + 80, by, w, 22, 6);
    ctx.fill();

    ctx.font = 'bold 11px sans-serif';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    if(w > 30) ctx.fillText(r.val + '', bx + 80 + w / 2, by + 15);

    ctx.textAlign = 'right';
    ctx.fillStyle = dk ? '#888' : '#aaa';
    ctx.font = '10px sans-serif';
    ctx.fillText('/' + r.max, bx + 440, by + 15);
  });

  if(state.income.length > 1){
    ctx.font = 'bold 12px sans-serif';
    ctx.fillStyle = dk ? '#aaa' : '#888';
    ctx.textAlign = 'center';
    ctx.fillText('수입/지출 추이 (최근 20회)', 290, 220);

    var gx = 50, gy = 235, gw = 480, gh = 100;
    ctx.strokeStyle = dk ? 'rgba(255,255,255,.1)' : 'rgba(0,0,0,.06)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(gx, gy + gh/2);
    ctx.lineTo(gx + gw, gy + gh/2);
    ctx.stroke();

    var maxAbs = 1;
    state.income.forEach(function(v){ if(Math.abs(v) > maxAbs) maxAbs = Math.abs(v); });

    ctx.beginPath();
    state.income.forEach(function(v, i){
      var x = gx + (i / (state.income.length - 1)) * gw;
      var y = gy + gh/2 - (v / maxAbs) * (gh/2 - 5);
      if(i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = '#FF5FA2';
    ctx.lineWidth = 2;
    ctx.stroke();

    state.income.forEach(function(v, i){
      var x = gx + (i / (state.income.length - 1)) * gw;
      var y = gy + gh/2 - (v / maxAbs) * (gh/2 - 5);
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = v >= 0 ? '#4CAF50' : '#F44336';
      ctx.fill();
    });
  }

  ctx.font = '11px sans-serif';
  ctx.fillStyle = dk ? '#666' : '#bbb';
  ctx.textAlign = 'center';
  ctx.fillText('모험/채굴/구매/도박으로 자산을 운용하세요!', 290, 350);
}


// ============================================================
// 6. EVOLUTION TREE VISUALIZER (Canvas 600x380)
// ============================================================
var EVO_TREE = [
  {name:'하츄핑',stage:1,icon:'💖',evolvesTo:'러브핑',lvReq:10},
  {name:'러브핑',stage:2,icon:'💗',evolvesTo:'하트퀸핑',lvReq:25},
  {name:'하트퀸핑',stage:3,icon:'👑',evolvesTo:null,lvReq:null},
  {name:'바로핑',stage:1,icon:'⚖️',evolvesTo:'저스티핑',lvReq:12},
  {name:'저스티핑',stage:2,icon:'⚔️',evolvesTo:'저지먼핑',lvReq:28},
  {name:'저지먼핑',stage:3,icon:'🏛️',evolvesTo:null,lvReq:null},
  {name:'아자핑',stage:1,icon:'💪',evolvesTo:'브레이핑',lvReq:11},
  {name:'브레이핑',stage:2,icon:'🔥',evolvesTo:'블레이즈핑',lvReq:26},
  {name:'블레이즈핑',stage:3,icon:'🌟',evolvesTo:null,lvReq:null},
  {name:'차차핑',stage:1,icon:'💃',evolvesTo:'댄서핑',lvReq:10},
  {name:'댄서핑',stage:2,icon:'🎭',evolvesTo:'스타핑',lvReq:24},
  {name:'스타핑',stage:3,icon:'⭐',evolvesTo:null,lvReq:null}
];

function openEvoTree(){
  sfxV20('v20_nav');
  var html = '<div style="text-align:center"><canvas id="v20EvoCanvas" width="600" height="380" style="max-width:100%;border-radius:12px;background:' + (isDarkV20()?'#1a1030':'#FFF8FC') + '"></canvas></div>';
  html += '<div style="text-align:center;margin-top:8px;font-size:11px;color:#888">4계열 x 3단계 진화 트리</div>';
  createV20Modal('🧬 진화 계보도', html);
  drawEvoTree();
}

function drawEvoTree(){
  var c = document.getElementById('v20EvoCanvas');
  if(!c) return;
  var ctx = c.getContext('2d');
  var dk = isDarkV20();
  ctx.clearRect(0,0,600,380);
  ctx.fillStyle = dk ? '#1a1030' : '#FFF8FC';
  ctx.fillRect(0,0,600,380);

  ctx.font = 'bold 14px sans-serif';
  ctx.fillStyle = dk ? '#FF8EC4' : '#FF5FA2';
  ctx.textAlign = 'center';
  ctx.fillText('🧬 티니핑 진화 계보도', 300, 25);

  var families = [
    {start:0,color:'#FF5FA2',label:'사랑 계열'},
    {start:3,color:'#2196F3',label:'정의 계열'},
    {start:6,color:'#F44336',label:'용기 계열'},
    {start:9,color:'#FF9800',label:'활력 계열'}
  ];

  families.forEach(function(fam, fi){
    var y = 55 + fi * 85;

    ctx.font = 'bold 11px sans-serif';
    ctx.fillStyle = fam.color;
    ctx.textAlign = 'left';
    ctx.fillText(fam.label, 15, y + 30);

    for(var s = 0; s < 3; s++){
      var evo = EVO_TREE[fam.start + s];
      var x = 120 + s * 170;

      ctx.fillStyle = s === 2 ? fam.color + '22' : (dk?'rgba(255,255,255,.04)':'rgba(0,0,0,.03)');
      ctx.beginPath();
      ctx.roundRect(x, y, 140, 60, 12);
      ctx.fill();

      if(s === 2){
        ctx.strokeStyle = fam.color;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(evo.icon, x + 30, y + 38);

      ctx.font = 'bold 12px sans-serif';
      ctx.fillStyle = dk ? '#eee' : '#333';
      ctx.fillText(evo.name, x + 90, y + 28);

      ctx.font = '10px sans-serif';
      ctx.fillStyle = dk ? '#888' : '#aaa';
      ctx.fillText('Stage ' + evo.stage + (evo.lvReq ? ' (Lv.' + evo.lvReq + '→)' : ' (MAX)'), x + 90, y + 45);

      if(s < 2){
        ctx.beginPath();
        ctx.moveTo(x + 140, y + 30);
        ctx.lineTo(x + 170, y + 30);
        ctx.strokeStyle = fam.color + '88';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(x + 162, y + 25);
        ctx.lineTo(x + 170, y + 30);
        ctx.lineTo(x + 162, y + 35);
        ctx.strokeStyle = fam.color;
        ctx.stroke();
      }
    }
  });

  ctx.font = '11px sans-serif';
  ctx.fillStyle = dk ? '#666' : '#bbb';
  ctx.textAlign = 'center';
  ctx.fillText('레벨을 올려 진화시키세요!', 300, 370);
}


// ============================================================
// 7. ADVENTURE SCORECARD (Canvas 600x400)
// ============================================================
function openScorecard(){
  sfxV20('scorecard_gen');
  var metrics = [
    {name:'도감 완성도',val:v20Load('v20_dex_count',0),max:12,icon:'📚'},
    {name:'조합 발견',val:(v20Load('v20_combos',{discovered:[]}).discovered||[]).length,max:10,icon:'⚗️'},
    {name:'보스러시 클리어',val:(v20Load('v20_bossrush',{clears:0}).clears||0),max:5,icon:'⚔️'},
    {name:'토너먼트 승리',val:(v20Load('v20_tournament',{wins:0}).wins||0),max:20,icon:'🏟️'},
    {name:'코인 보유',val:(v20Load('v20_economy',{coins:0}).coins||0),max:500,icon:'💰'},
    {name:'퀴즈 정답률',val:v20Load('v20_quiz_correct',0),max:15,icon:'❓'}
  ];

  var totalScore = 0, totalMax = 0;
  metrics.forEach(function(m){ totalScore += Math.min(m.val, m.max); totalMax += m.max; });
  var pct = Math.round(totalScore / totalMax * 100);
  var grade = pct >= 90 ? 'S' : pct >= 75 ? 'A' : pct >= 60 ? 'B' : pct >= 40 ? 'C' : 'D';

  var html = '<div style="text-align:center;margin-bottom:12px"><canvas id="v20ScoreCanvas" width="600" height="400" style="max-width:100%;border-radius:12px;background:' + (isDarkV20()?'#1a1030':'#FFF8FC') + '"></canvas></div>';
  html += '<div style="text-align:center;font-size:12px;color:#888">종합 점수: <span style="font-size:18px;font-weight:800;color:' + (grade==='S'?'#FFD700':grade==='A'?'#4CAF50':'#FF9800') + '">' + pct + '% (' + grade + ')</span></div>';

  createV20Modal('🏅 모험 완성도 스코어카드', html);
  drawScorecard(metrics, pct, grade);
}

function drawScorecard(metrics, pct, grade){
  var c = document.getElementById('v20ScoreCanvas');
  if(!c) return;
  var ctx = c.getContext('2d');
  var dk = isDarkV20();
  ctx.clearRect(0,0,600,400);
  ctx.fillStyle = dk ? '#1a1030' : '#FFF8FC';
  ctx.fillRect(0,0,600,400);

  ctx.font = 'bold 14px sans-serif';
  ctx.fillStyle = dk ? '#FF8EC4' : '#FF5FA2';
  ctx.textAlign = 'center';
  ctx.fillText('🏅 모험 완성도 스코어카드', 300, 25);

  var gc = grade==='S'?'#FFD700':grade==='A'?'#4CAF50':grade==='B'?'#2196F3':grade==='C'?'#FF9800':'#F44336';
  ctx.beginPath();
  ctx.arc(300, 100, 55, 0, Math.PI * 2);
  ctx.fillStyle = gc + '22';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(300, 100, 55, -Math.PI/2, -Math.PI/2 + (pct/100) * Math.PI * 2);
  ctx.strokeStyle = gc;
  ctx.lineWidth = 6;
  ctx.stroke();

  ctx.font = 'bold 28px sans-serif';
  ctx.fillStyle = gc;
  ctx.textAlign = 'center';
  ctx.fillText(grade, 300, 108);
  ctx.font = '12px sans-serif';
  ctx.fillStyle = dk ? '#aaa' : '#888';
  ctx.fillText(pct + '%', 300, 128);

  metrics.forEach(function(m, i){
    var y = 170 + i * 35;
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = dk ? '#ccc' : '#555';
    ctx.fillText(m.icon + ' ' + m.name, 40, y + 15);

    ctx.fillStyle = dk ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.04)';
    ctx.beginPath();
    ctx.roundRect(200, y, 300, 22, 6);
    ctx.fill();

    var ratio = Math.min(m.val / m.max, 1);
    var barColor = ratio >= 0.8 ? '#4CAF50' : ratio >= 0.5 ? '#FF9800' : '#F44336';
    ctx.fillStyle = barColor;
    ctx.beginPath();
    ctx.roundRect(200, y, 300 * ratio, 22, 6);
    ctx.fill();

    ctx.font = 'bold 10px sans-serif';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    if(300 * ratio > 30) ctx.fillText(m.val + '/' + m.max, 200 + 300 * ratio / 2, y + 15);

    ctx.textAlign = 'right';
    ctx.fillStyle = dk ? '#888' : '#aaa';
    ctx.font = '10px sans-serif';
    ctx.fillText(Math.round(ratio * 100) + '%', 540, y + 15);
  });

  ctx.font = '11px sans-serif';
  ctx.fillStyle = dk ? '#666' : '#bbb';
  ctx.textAlign = 'center';
  ctx.fillText('각 기능을 플레이해 완성도를 높이세요!', 300, 390);
}


// ============================================================
// 8. TINIPING WORLD MAP PROGRESS (Canvas 600x380)
// ============================================================
var WORLD_REGIONS = [
  {name:'하트빌리지',icon:'💖',x:100,y:80,quests:5,color:'#FF5FA2'},
  {name:'용기의 숲',icon:'🌲',x:250,y:60,quests:4,color:'#4CAF50'},
  {name:'지혜의 탑',icon:'🏛️',x:400,y:90,quests:6,color:'#2196F3'},
  {name:'음악의 언덕',icon:'🎵',x:500,y:140,quests:3,color:'#9C27B0'},
  {name:'얼음 동굴',icon:'🧊',x:150,y:200,quests:5,color:'#00BCD4'},
  {name:'불꽃 화산',icon:'🌋',x:300,y:220,quests:4,color:'#F44336'},
  {name:'별빛 호수',icon:'⭐',x:450,y:200,quests:3,color:'#FFD700'},
  {name:'어둠의 성',icon:'🏰',x:300,y:310,quests:8,color:'#607D8B'}
];

function openWorldMap(){
  sfxV20('v20_nav');
  var state = v20Load('v20_worldmap', {visited:[],questsDone:{}});
  var html = '<div style="text-align:center;margin-bottom:12px"><canvas id="v20WorldCanvas" width="600" height="380" style="max-width:100%;border-radius:12px;background:' + (isDarkV20()?'#1a1030':'#FFF8FC') + '"></canvas></div>';
  var totalQ = 0, doneQ = 0;
  WORLD_REGIONS.forEach(function(r){ totalQ += r.quests; doneQ += (state.questsDone[r.name] || 0); });
  html += '<div style="text-align:center;font-size:12px;color:#888;margin-bottom:8px">탐험: ' + state.visited.length + '/' + WORLD_REGIONS.length + ' 지역 | 퀘스트: ' + doneQ + '/' + totalQ + '</div>';
  html += '<div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center">';
  WORLD_REGIONS.forEach(function(r){
    var visited = state.visited.indexOf(r.name) !== -1;
    html += '<button class="v20-region-btn" data-name="' + r.name + '" style="padding:6px 12px;border-radius:10px;border:2px solid ' + (visited?r.color:'rgba(0,0,0,.1)') + ';background:' + (visited?r.color+'22':(isDarkV20()?'rgba(255,255,255,.04)':'rgba(0,0,0,.02)')) + ';cursor:pointer;font-size:11px;font-weight:700;color:' + (isDarkV20()?'#eee':'#333') + '">' + r.icon + ' ' + r.name + '</button>';
  });
  html += '</div>';
  html += '<div id="v20MapLog" style="text-align:center;margin-top:8px;font-size:12px;color:#888">지역을 클릭해 탐험하세요!</div>';

  var modal = createV20Modal('🗺️ 모험 월드맵 진행도', html);
  drawWorldMap(state);

  modal.querySelectorAll('.v20-region-btn').forEach(function(btn){
    btn.onclick = function(){
      var name = btn.dataset.name;
      if(state.visited.indexOf(name) === -1) state.visited.push(name);
      if(!state.questsDone[name]) state.questsDone[name] = 0;
      var region = WORLD_REGIONS.find(function(r){ return r.name === name; });
      if(region && state.questsDone[name] < region.quests){
        state.questsDone[name]++;
        sfxV20('v20_nav');
      }
      v20Save('v20_worldmap', state);
      drawWorldMap(state);
      modal.querySelector('#v20MapLog').innerHTML = region.icon + ' ' + name + ' 탐험! 퀘스트: ' + state.questsDone[name] + '/' + region.quests;
    };
  });
}

function drawWorldMap(state){
  var c = document.getElementById('v20WorldCanvas');
  if(!c) return;
  var ctx = c.getContext('2d');
  var dk = isDarkV20();
  ctx.clearRect(0,0,600,380);
  ctx.fillStyle = dk ? '#1a1030' : '#FFF8FC';
  ctx.fillRect(0,0,600,380);

  ctx.font = 'bold 14px sans-serif';
  ctx.fillStyle = dk ? '#FF8EC4' : '#FF5FA2';
  ctx.textAlign = 'center';
  ctx.fillText('🗺️ 하츄핑 월드맵', 300, 25);

  for(var i = 0; i < WORLD_REGIONS.length - 1; i++){
    var a = WORLD_REGIONS[i], b = WORLD_REGIONS[i+1];
    ctx.beginPath();
    ctx.moveTo(a.x, a.y + 20);
    ctx.lineTo(b.x, b.y + 20);
    ctx.strokeStyle = dk ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.06)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4,4]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  WORLD_REGIONS.forEach(function(r){
    var visited = state.visited.indexOf(r.name) !== -1;
    var done = state.questsDone[r.name] || 0;
    var pct = done / r.quests;

    ctx.beginPath();
    ctx.arc(r.x, r.y + 20, 28, 0, Math.PI * 2);
    ctx.fillStyle = visited ? r.color + '33' : (dk?'rgba(255,255,255,.04)':'rgba(0,0,0,.03)');
    ctx.fill();

    if(visited){
      ctx.beginPath();
      ctx.arc(r.x, r.y + 20, 28, -Math.PI/2, -Math.PI/2 + pct * Math.PI * 2);
      ctx.strokeStyle = r.color;
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    ctx.font = '20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(r.icon, r.x, r.y + 27);

    ctx.font = 'bold 10px sans-serif';
    ctx.fillStyle = dk ? '#ccc' : '#444';
    ctx.fillText(r.name, r.x, r.y + 55);

    ctx.font = '9px sans-serif';
    ctx.fillStyle = dk ? '#888' : '#aaa';
    ctx.fillText(done + '/' + r.quests, r.x, r.y + 67);
  });

  ctx.font = '11px sans-serif';
  ctx.fillStyle = dk ? '#666' : '#bbb';
  ctx.textAlign = 'center';
  ctx.fillText('지역 버튼을 클릭해 퀘스트를 진행하세요!', 300, 370);
}


// ============================================================
// ACHIEVEMENTS (12 new, 166→178)
// ============================================================
function injectV20Achievements(){
  if(!window.AD) return;
  var newAch = [
    {id:'a_v20_tournament_3',name:'배틀 챔피언',desc:'토너먼트 3승 달성',cat:'general',icon:'🏟️'},
    {id:'a_v20_tournament_10',name:'무적 파이터',desc:'토너먼트 10승 달성',cat:'general',icon:'🏆'},
    {id:'a_v20_compat_test',name:'궁합 마스터',desc:'성격 궁합 테스트 수행',cat:'general',icon:'💕'},
    {id:'a_v20_combo_3',name:'조합 탐험가',desc:'파워업 조합 3종 발견',cat:'general',icon:'⚗️'},
    {id:'a_v20_combo_all',name:'조합 마스터',desc:'파워업 조합 전체 발견',cat:'general',icon:'🧪'},
    {id:'a_v20_bossrush_clear',name:'보스 슬레이어',desc:'보스 러시 1회 클리어',cat:'general',icon:'⚔️'},
    {id:'a_v20_bossrush_fast',name:'스피드 러시',desc:'보스 러시 5초 이내 클리어',cat:'general',icon:'⚡'},
    {id:'a_v20_coins_200',name:'부자 하츄핑',desc:'코인 200개 보유',cat:'general',icon:'💰'},
    {id:'a_v20_world_4',name:'세계 탐험가',desc:'4개 이상 지역 탐험',cat:'general',icon:'🗺️'},
    {id:'a_v20_world_all',name:'월드 마스터',desc:'전 지역 탐험 완료',cat:'general',icon:'🌍'},
    {id:'a_v20_evo_viewer',name:'진화 연구자',desc:'진화 계보도 열람',cat:'general',icon:'🧬'},
    {id:'a_v20_scorecard',name:'v20 컴플리트',desc:'모험 스코어카드 확인',cat:'general',icon:'🏅'}
  ];

  newAch.forEach(function(a){
    var exists = false;
    for(var i=0;i<window.AD.length;i++){
      if(window.AD[i].id === a.id){ exists = true; break; }
    }
    if(!exists) window.AD.push(a);
  });
}

function checkAndAwardV20(){
  var state_t = v20Load('v20_tournament', {wins:0});
  var state_c = v20Load('v20_combos', {discovered:[]});
  var state_br = v20Load('v20_bossrush', {clears:0,bestTime:null});
  var state_e = v20Load('v20_economy', {coins:0});
  var state_w = v20Load('v20_worldmap', {visited:[]});
  var state_cp = v20Load('v20_compat_last', null);

  var checks = [
    {id:'a_v20_tournament_3', cond: state_t.wins >= 3},
    {id:'a_v20_tournament_10', cond: state_t.wins >= 10},
    {id:'a_v20_compat_test', cond: state_cp !== null},
    {id:'a_v20_combo_3', cond: (state_c.discovered||[]).length >= 3},
    {id:'a_v20_combo_all', cond: (state_c.discovered||[]).length >= COMBO_RECIPES.length},
    {id:'a_v20_bossrush_clear', cond: state_br.clears >= 1},
    {id:'a_v20_bossrush_fast', cond: state_br.bestTime !== null && state_br.bestTime <= 5000},
    {id:'a_v20_coins_200', cond: state_e.coins >= 200},
    {id:'a_v20_world_4', cond: (state_w.visited||[]).length >= 4},
    {id:'a_v20_world_all', cond: (state_w.visited||[]).length >= WORLD_REGIONS.length}
  ];

  checks.forEach(function(ch){
    if(ch.cond){
      try{
        var a = JSON.parse(localStorage.getItem('hatcuping_achievements') || '{}');
        if(!a[ch.id]){
          a[ch.id] = Date.now();
          localStorage.setItem('hatcuping_achievements', JSON.stringify(a));
          var ad = window.AD ? window.AD.find(function(x){ return x.id === ch.id; }) : null;
          if(ad) showToastV20('🏆 ' + ad.name + ' 업적 달성!');
        }
      }catch(e){}
    }
  });
}


// ============================================================
// QUIZ V20 (+15 questions, 165→180)
// ============================================================
function injectExtraQuizV20(){
  if(!window.quizPool && !window.QUIZ_POOL) return;
  var pool = window.quizPool || window.QUIZ_POOL;
  var newQ = [
    {q:'티니핑 배틀 토너먼트에서 총 파이터 수는?',a:['4','6','8','10'],c:2},
    {q:'하츄핑의 배틀 스탯 중 가장 높은 것은?',a:['HP','공격력','방어력','속도'],c:0},
    {q:'무무핑의 특기 속성은?',a:['수호','사랑','장난','음악'],c:0},
    {q:'성격 궁합 테스터의 특성 축 수는?',a:['4','5','6','8'],c:2},
    {q:'파워업 조합 레시피는 총 몇 가지?',a:['6','8','10','12'],c:2},
    {q:'&quot;불꽃의 수호자&quot; 조합에 필요한 파워업은?',a:['별빛방패+불꽃검','번개부츠+마법지팡이','힐링오브+행운클로버','불꽃검+마법지팡이'],c:0},
    {q:'보스 러시의 최종 보스 이름은?',a:['시간수호자','어둠기사','절망의제왕','폭풍마녀'],c:2},
    {q:'보스 러시에서 보스는 총 몇 명?',a:['5','6','8','10'],c:2},
    {q:'경제 시뮬레이터에서 아이템 구매 비용은?',a:['30코인','50코인','70코인','100코인'],c:1},
    {q:'진화 계보도에서 하츄핑의 최종 진화는?',a:['러브핑','하트퀸핑','스타핑','블레이즈핑'],c:1},
    {q:'진화에 필요한 계열은 총 몇 개?',a:['2','3','4','6'],c:2},
    {q:'월드맵의 최종 지역은?',a:['불꽃 화산','별빛 호수','어둠의 성','음악의 언덕'],c:2},
    {q:'월드맵의 총 지역 수는?',a:['5','6','8','10'],c:2},
    {q:'v20에서 추가된 업적 수는?',a:['8','10','12','15'],c:2},
    {q:'키키핑의 속성은?',a:['사랑','행복','장난','음악'],c:2}
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
// KEYBOARD SHORTCUTS (8 new: Shift+F/G/H/I/J/K/L/M → but avoid conflicts, use Shift+1~8 as Numpad not used)
// ============================================================
function injectV20Keyboard(){
  document.addEventListener('keydown', function(e){
    if(e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
    if(!e.shiftKey) return;
    switch(e.code){
      case 'KeyF': e.preventDefault(); openBattleTournament(); break;
      case 'KeyG': e.preventDefault(); openCompatibilityTest(); break;
      case 'KeyH': e.preventDefault(); openComboLab(); break;
      case 'KeyI': e.preventDefault(); openBossRush(); break;
      case 'KeyJ': e.preventDefault(); openEconomy(); break;
      case 'KeyK': e.preventDefault(); openEvoTree(); break;
      case 'KeyL': e.preventDefault(); openScorecard(); break;
      case 'KeyM': e.preventDefault(); openWorldMap(); break;
    }
  });
}


// ============================================================
// BOTTOM NAVIGATION (append to existing v18 nav, NO new fixed bar)
// ============================================================
function injectV20BottomNav(){
  var existingNav = document.getElementById('v18BottomNav');
  if(!existingNav) return;

  var buttons = [
    {icon:'🏟️',label:'토너먼트',action:openBattleTournament},
    {icon:'💕',label:'궁합',action:openCompatibilityTest},
    {icon:'⚗️',label:'조합',action:openComboLab},
    {icon:'⚔️',label:'러시',action:openBossRush},
    {icon:'💰',label:'경제',action:openEconomy},
    {icon:'🧬',label:'진화',action:openEvoTree},
    {icon:'🏅',label:'스코어',action:openScorecard},
    {icon:'🗺️',label:'월드맵',action:openWorldMap}
  ];

  buttons.forEach(function(b){
    var btn = document.createElement('button');
    btn.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:2px;background:none;border:none;cursor:pointer;padding:4px 6px;border-radius:8px;transition:all .2s';
    btn.innerHTML = '<span style="font-size:18px">' + b.icon + '</span><span style="font-size:9px;font-weight:700;color:var(--text-sub)">' + b.label + '</span>';
    btn.onmouseenter = function(){ btn.style.background = 'rgba(255,95,162,.1)'; };
    btn.onmouseleave = function(){ btn.style.background = 'none'; };
    btn.onclick = b.action;
    existingNav.appendChild(btn);
  });
}


// ============================================================
// FOOTER, NEWS, META UPDATE
// ============================================================
function updateV20Footer(){
  var ver = document.querySelector('.footer .version');
  if(ver) ver.textContent = 'v20.0 | © PRIME Holdings NEXTERA+PRISM';

  var links = document.querySelector('.footer-links');
  if(links) links.innerHTML = '<span class="footer-link">4종 게임</span><span class="footer-link">178개 업적</span><span class="footer-link">토너먼트+궁합+조합</span><span class="footer-link">보스러시+경제+진화</span><span class="footer-link">퀴즈 180문</span>';
}

function updateV20News(){
  var newsSection = document.querySelector('.news-section');
  if(!newsSection) return;
  var firstItem = newsSection.querySelector('.news-item');
  if(!firstItem) return;
  var newItem = document.createElement('div');
  newItem.className = 'news-item';
  newItem.innerHTML = '<span class="news-date">v20.0</span><span class="news-text">티니핑배틀토너먼트8인Canvas, 성격궁합테스터6축6축RadarCanvas, 파워업조합실험실10종Canvas, 보스러시챌린지8보스Canvas, 경제시뮬레이터Canvas, 진화계보도4계열Canvas, 스코어카드6지표Canvas, 월드맵8지역Canvas, 퀴즈+15(180), 업적+12(178)</span>';
  firstItem.parentNode.insertBefore(newItem, firstItem);
}

function updateV20AchieveCount(){
  var el = document.getElementById('achieveCount');
  if(el){
    var c = 0;
    try{ c = Object.keys(JSON.parse(localStorage.getItem('hatcuping_achievements') || '{}')).length; }catch(e){}
    var t = window.AD ? window.AD.length : 178;
    el.textContent = c + '/' + t;
  }
}

function updateV20Meta(){
  var descMeta = document.querySelector('meta[name="description"]');
  if(descMeta) descMeta.content = '사랑의 하츄핑 v20.0 - 플랫포머 액션, 턴제 RPG, 오픈월드, UNIFIED 4종 게임. 업적 178개, 토너먼트8인Canvas, 궁합테스터6축RadarCanvas, 파워업조함10종Canvas, 보스러시8보스Canvas, 경제시뮬레이터Canvas, 진화계보도4계열Canvas, 스코어카드6지표Canvas, 월드맵8지역Canvas, 퀴즈 180문!';
  document.title = '사랑의 하츄핑 v20.0 - 게임 선택';
}


// ============================================================
// BOOT
// ============================================================
function bootV20(){
  injectV20Achievements();
  injectExtraQuizV20();
  injectV20Keyboard();
  injectV20BottomNav();
  updateV20Footer();
  updateV20News();
  updateV20AchieveCount();
  updateV20Meta();
  checkAndAwardV20();
}

if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', bootV20);
} else {
  bootV20();
}

})();

// hatcuping-game v18_patch.js - NEXTERA+PRISM AUTO v18.0
// Self-contained IIFE patch module (~1200 lines)
(function(){
'use strict';

// ============================================================
// SFX ENGINE (12 sound types)
// ============================================================
var _v18Ctx = null;
function _v18InitAudio(){
  if(!_v18Ctx){
    try{ _v18Ctx = new (window.AudioContext || window.webkitAudioContext)(); }catch(e){}
  }
  if(_v18Ctx && _v18Ctx.state === 'suspended') _v18Ctx.resume();
}

var V18_SFX = {
  evolve_start:{f:523,d:.1,t:'triangle'},
  evolve_complete:{f:1047,d:.15,t:'sine'},
  potion_mix:{f:440,d:.08,t:'sine'},
  potion_complete:{f:880,d:.12,t:'triangle'},
  battle_hit:{f:300,d:.05,t:'square'},
  battle_win:{f:1200,d:.15,t:'triangle'},
  tarot_flip:{f:660,d:.06,t:'sine'},
  tarot_reveal:{f:990,d:.1,t:'triangle'},
  music_note:{f:784,d:.08,t:'sine'},
  music_play:{f:600,d:.1,t:'triangle'},
  calendar_mark:{f:700,d:.05,t:'sine'},
  v18_feature:{f:850,d:.08,t:'triangle'}
};

function sfxV18(type){
  _v18InitAudio();
  if(!_v18Ctx) return;
  var s = V18_SFX[type];
  if(!s) return;
  try{
    var muted = false;
    try{ muted = localStorage.getItem('hatcuping_mute') === '1'; }catch(e){}
    if(muted) return;
    var osc = _v18Ctx.createOscillator();
    var gain = _v18Ctx.createGain();
    osc.type = s.t || 'sine';
    osc.frequency.value = s.f;
    gain.gain.value = 0.08;
    osc.connect(gain);
    gain.connect(_v18Ctx.destination);
    osc.start();
    osc.stop(_v18Ctx.currentTime + (s.d || 0.06));
  }catch(e){}
}


// ============================================================
// UTILITY FUNCTIONS
// ============================================================
function trackV18Feature(id){
  try{
    var saved = JSON.parse(localStorage.getItem('hatcuping_v18_features') || '[]');
    if(saved.indexOf(id) === -1){ saved.push(id); localStorage.setItem('hatcuping_v18_features', JSON.stringify(saved)); }
  }catch(e){}
}

function showToastV18(msg){
  var t = document.getElementById('achieveToast');
  if(t){ t.innerHTML = msg; t.classList.add('show'); setTimeout(function(){ t.classList.remove('show'); }, 2500); }
}

function v18Load(key, fallback){
  try{ var d = JSON.parse(localStorage.getItem(key)); return d !== null ? d : fallback; }catch(e){ return fallback; }
}

function v18Save(key, data){
  try{ localStorage.setItem(key, JSON.stringify(data)); }catch(e){}
}

function isDarkV18(){
  return document.body.classList.contains('dark');
}

function createV18Modal(title, content){
  var overlay = document.createElement('div');
  overlay.className = 'modal-overlay show';
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.6);z-index:999;display:flex;justify-content:center;align-items:center;backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px)';
  var modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.cssText = 'background:var(--card-bg);border-radius:24px;padding:24px;max-width:520px;width:92%;max-height:85vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.25);position:relative';
  if(isDarkV18()) modal.style.background = '#2a1a3e';
  modal.innerHTML = '<button style="position:absolute;top:12px;right:16px;background:none;border:none;font-size:24px;cursor:pointer;color:var(--text-sub);padding:4px" aria-label="&#xB2EB;&#xAE30;">&times;</button><h3 style="font-size:18px;margin-bottom:16px;color:#FF5FA2;display:flex;align-items:center;gap:8px">'+title+'</h3><div class="v18-content">'+content+'</div>';
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  modal.querySelector('button').onclick = function(){ overlay.remove(); };
  overlay.addEventListener('click', function(e){ if(e.target === overlay) overlay.remove(); });
  return {overlay:overlay, modal:modal};
}


// ============================================================
// 1. EVOLUTION LAB (Canvas character evolution tree, 8 characters)
// ============================================================
var EVOLUTION_DATA = [
  {name:'하츄핑',stages:['알','아기','성장','완성'],colors:['#FFB8D9','#FF8EC4','#FF5FA2','#FF1493'],power:[20,45,70,100]},
  {name:'바로핑',stages:['알','아기','성장','완성'],colors:['#B8D4FF','#6BAAFF','#4488FF','#2266DD'],power:[18,42,68,95]},
  {name:'차차핑',stages:['알','아기','성장','완성'],colors:['#FFE4B8','#FFD080','#FFC040','#FF9900'],power:[22,48,72,98]},
  {name:'해필핑',stages:['알','아기','성장','완성'],colors:['#B8FFB8','#66DD66','#44BB44','#22AA22'],power:[19,44,69,96]},
  {name:'아자핑',stages:['알','아기','성장','완성'],colors:['#FFB8B8','#FF7777','#FF4444','#DD2222'],power:[25,50,75,100]},
  {name:'라라핑',stages:['알','아기','성장','완성'],colors:['#E8B8FF','#CC77FF','#AA44FF','#8822DD'],power:[17,40,65,92]},
  {name:'키키핑',stages:['알','아기','성장','완성'],colors:['#FFFFB8','#FFFF77','#FFDD44','#DDBB22'],power:[21,46,71,97]},
  {name:'무무핑',stages:['알','아기','성장','완성'],colors:['#B8FFFF','#77DDDD','#44BBBB','#229999'],power:[20,43,67,93]}
];

function openEvolutionLab(){
  trackV18Feature('evolution');
  sfxV18('v18_feature');
  var dark = isDarkV18();
  var data = v18Load('hatcuping_evolution', {levels:{},xp:{}});
  var selectedChar = 0;

  var html = '<div style="margin-bottom:8px"><canvas id="v18EvoCanvas" width="500" height="380" style="width:100%;border-radius:12px;background:'+(dark?'#1a1030':'#FFF5FA')+'"></canvas></div>';
  html += '<div style="display:flex;gap:4px;flex-wrap:wrap;justify-content:center;margin-bottom:8px">';
  EVOLUTION_DATA.forEach(function(ch, i){
    html += '<button class="v18EvoBtn" data-idx="'+i+'" style="padding:6px 12px;border-radius:12px;border:2px solid '+(i===0?'#FF5FA2':'transparent')+';background:var(--card-bg);cursor:pointer;font-size:11px;font-weight:700;color:var(--text)">'+ch.name+'</button>';
  });
  html += '</div>';
  html += '<div style="display:flex;gap:6px;justify-content:center">';
  html += '<button id="v18EvoFeed" style="padding:6px 14px;border-radius:12px;border:none;background:linear-gradient(135deg,#FF5FA2,#B066FF);color:#fff;font-weight:700;cursor:pointer;font-size:12px">&#x1F36C; 먹이주기 (+10XP)</button>';
  html += '<button id="v18EvoTrain" style="padding:6px 14px;border-radius:12px;border:none;background:linear-gradient(135deg,#4CAF50,#2196F3);color:#fff;font-weight:700;cursor:pointer;font-size:12px">&#x1F4AA; 훈련 (+25XP)</button>';
  html += '</div>';

  var m = createV18Modal('&#x1F9EC; 진화 연구소', html);

  function getStage(charIdx){
    var xp = (data.xp[charIdx] || 0);
    if(xp >= 300) return 3;
    if(xp >= 150) return 2;
    if(xp >= 50) return 1;
    return 0;
  }

  function drawEvolution(){
    var c = document.getElementById('v18EvoCanvas');
    if(!c) return;
    var ctx = c.getContext('2d');
    var W = c.width, H = c.height;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = dark?'#1a1030':'#FFF5FA';
    ctx.fillRect(0,0,W,H);

    var ch = EVOLUTION_DATA[selectedChar];
    var stage = getStage(selectedChar);
    var xp = data.xp[selectedChar] || 0;

    ctx.font = 'bold 15px sans-serif';
    ctx.fillStyle = dark?'#FF8EC4':'#FF5FA2';
    ctx.textAlign = 'center';
    ctx.fillText(ch.name + ' 진화 트리', W/2, 24);

    for(var s=0; s<4; s++){
      var x = 50 + s * 120;
      var y = 80;
      var isActive = s <= stage;

      ctx.fillStyle = isActive ? ch.colors[s] : (dark?'rgba(255,255,255,.06)':'rgba(0,0,0,.04)');
      ctx.beginPath();
      ctx.arc(x, y, 30, 0, Math.PI*2);
      ctx.fill();

      if(isActive){
        ctx.strokeStyle = ch.colors[s];
        ctx.lineWidth = 3;
        ctx.stroke();
        if(s === stage){
          ctx.save();
          ctx.shadowColor = ch.colors[s];
          ctx.shadowBlur = 15;
          ctx.strokeStyle = ch.colors[s];
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(x, y, 34, 0, Math.PI*2);
          ctx.stroke();
          ctx.restore();
        }
      }

      var emoji = s===0?'🥚':s===1?'🐣':s===2?'✨':'👑';
      ctx.font = '20px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(emoji, x, y);

      ctx.font = 'bold 10px sans-serif';
      ctx.fillStyle = isActive ? (dark?'#eee':'#333') : (dark?'#555':'#bbb');
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(ch.stages[s], x, y+48);

      if(s < 3){
        ctx.beginPath();
        ctx.moveTo(x+34, y);
        ctx.lineTo(x+86, y);
        ctx.strokeStyle = s < stage ? ch.colors[s+1] : (dark?'rgba(255,255,255,.1)':'rgba(0,0,0,.08)');
        ctx.lineWidth = 2;
        ctx.setLineDash(s < stage ? [] : [4,4]);
        ctx.stroke();
        ctx.setLineDash([]);
        var thresholds = [50, 150, 300];
        ctx.font = '9px sans-serif';
        ctx.fillStyle = dark?'#888':'#aaa';
        ctx.textAlign = 'center';
        ctx.fillText(thresholds[s]+'XP', x+60, y-8);
      }
    }

    var barY = 160;
    var nextThreshold = stage >= 3 ? 300 : [50,150,300][stage];
    var prevThreshold = stage <= 0 ? 0 : [0,50,150][stage];
    var progress = Math.min((xp - prevThreshold) / (nextThreshold - prevThreshold), 1);
    if(stage >= 3) progress = 1;

    ctx.fillStyle = dark?'rgba(255,255,255,.06)':'rgba(0,0,0,.04)';
    ctx.beginPath();
    ctx.roundRect(50, barY, 400, 16, 8);
    ctx.fill();

    var grad = ctx.createLinearGradient(50, 0, 450, 0);
    grad.addColorStop(0, ch.colors[1]);
    grad.addColorStop(1, ch.colors[3]);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(50, barY, 400 * progress, 16, 8);
    ctx.fill();

    ctx.font = 'bold 10px sans-serif';
    ctx.fillStyle = dark?'#eee':'#333';
    ctx.textAlign = 'center';
    ctx.fillText('XP: '+xp+' / '+nextThreshold, W/2, barY+32);

    ctx.font = 'bold 12px sans-serif';
    ctx.fillStyle = dark?'#FF8EC4':'#FF5FA2';
    ctx.fillText('현재 단계: '+ch.stages[stage]+' (전투력 '+ch.power[stage]+')', W/2, barY+52);

    var statY = 230;
    ctx.font = 'bold 12px sans-serif';
    ctx.fillStyle = dark?'#aaa':'#666';
    ctx.textAlign = 'left';
    ctx.fillText('캐릭터 능력치', 50, statY);

    var stats = [{name:'공격',val:ch.power[stage]*0.8},{name:'방어',val:ch.power[stage]*0.6},{name:'속도',val:ch.power[stage]*0.7},{name:'마법',val:ch.power[stage]*0.9},{name:'체력',val:ch.power[stage]*0.75}];
    stats.forEach(function(st, i){
      var sy = statY + 16 + i * 22;
      ctx.font = '10px sans-serif';
      ctx.fillStyle = dark?'#aaa':'#888';
      ctx.textAlign = 'right';
      ctx.fillText(st.name, 90, sy+10);

      ctx.fillStyle = dark?'rgba(255,255,255,.06)':'rgba(0,0,0,.04)';
      ctx.beginPath();
      ctx.roundRect(100, sy, 300, 12, 6);
      ctx.fill();

      var barGrad = ctx.createLinearGradient(100,0,400,0);
      barGrad.addColorStop(0, ch.colors[1]);
      barGrad.addColorStop(1, ch.colors[3]);
      ctx.fillStyle = barGrad;
      ctx.beginPath();
      ctx.roundRect(100, sy, 300*(st.val/100), 12, 6);
      ctx.fill();

      ctx.font = 'bold 9px sans-serif';
      ctx.fillStyle = dark?'#eee':'#333';
      ctx.textAlign = 'left';
      ctx.fillText(Math.round(st.val), 410, sy+10);
    });
  }

  drawEvolution();

  m.modal.querySelectorAll('.v18EvoBtn').forEach(function(btn){
    btn.onclick = function(){
      selectedChar = parseInt(btn.dataset.idx);
      m.modal.querySelectorAll('.v18EvoBtn').forEach(function(b){ b.style.borderColor = 'transparent'; });
      btn.style.borderColor = '#FF5FA2';
      sfxV18('evolve_start');
      drawEvolution();
    };
  });

  m.modal.querySelector('#v18EvoFeed').onclick = function(){
    data.xp[selectedChar] = (data.xp[selectedChar] || 0) + 10;
    var oldStage = getStage(selectedChar);
    v18Save('hatcuping_evolution', data);
    sfxV18('evolve_start');
    var newStage = getStage(selectedChar);
    if(newStage > oldStage){
      sfxV18('evolve_complete');
      showToastV18('✨ '+EVOLUTION_DATA[selectedChar].name+'이(가) '+EVOLUTION_DATA[selectedChar].stages[newStage]+'(으)로 진화!');
    }
    drawEvolution();
  };

  m.modal.querySelector('#v18EvoTrain').onclick = function(){
    data.xp[selectedChar] = (data.xp[selectedChar] || 0) + 25;
    var oldStage = getStage(selectedChar);
    v18Save('hatcuping_evolution', data);
    sfxV18('evolve_start');
    var newStage = getStage(selectedChar);
    if(newStage > oldStage){
      sfxV18('evolve_complete');
      showToastV18('✨ '+EVOLUTION_DATA[selectedChar].name+'이(가) '+EVOLUTION_DATA[selectedChar].stages[newStage]+'(으)로 진화!');
    }
    drawEvolution();
  };
}


// ============================================================
// 2. MAGIC POTION LAB (Canvas ingredient mixing, 10 recipes)
// ============================================================
var POTION_RECIPES = [
  {name:'용기의 물약',ingredients:['붉은꽃','불의돌','용의비늘'],color:'#FF4444',effect:'+공격력 20%',emoji:'🧪'},
  {name:'지혜의 엘릭서',ingredients:['푸른잎','달빛수정','현자의돌'],color:'#4488FF',effect:'+경험치 30%',emoji:'🧫'},
  {name:'생명의 포션',ingredients:['초록이끼','생명수','치유풀'],color:'#44BB44',effect:'+체력 회복',emoji:'🍸'},
  {name:'속도의 비약',ingredients:['번개석','바람깃털','수은방울'],color:'#FFAA00',effect:'+이동속도 25%',emoji:'⚡'},
  {name:'보호의 영약',ingredients:['강철가루','다이아몬드','수호돌'],color:'#8888FF',effect:'+방어력 30%',emoji:'🛡️'},
  {name:'행복의 묘약',ingredients:['무지개가루','별빛조각','사랑의꽃'],color:'#FF88CC',effect:'+행복도 50%',emoji:'🌈'},
  {name:'투명의 물약',ingredients:['안개이슬','유령먼지','거울조각'],color:'#CCCCFF',effect:'투명 효과',emoji:'👻'},
  {name:'거인의 약',ingredients:['대지의힘','거인뼈','마그마'],color:'#CC6600',effect:'+크기 200%',emoji:'🦴'},
  {name:'시간의 모래',ingredients:['모래시계','시간수정','영원꽃'],color:'#FFD700',effect:'시간 정지',emoji:'⌛'},
  {name:'우정의 영약',ingredients:['하트조각','눈물방울','약속의돌'],color:'#FF5FA2',effect:'+우정 100%',emoji:'💕'}
];

function openPotionLab(){
  trackV18Feature('potion');
  sfxV18('v18_feature');
  var dark = isDarkV18();
  var data = v18Load('hatcuping_potions', {crafted:{},total:0});
  var selectedRecipe = 0;

  var html = '<div style="margin-bottom:8px"><canvas id="v18PotionCanvas" width="500" height="340" style="width:100%;border-radius:12px;background:'+(dark?'#1a1030':'#F5F0FF')+'"></canvas></div>';
  html += '<div style="display:flex;gap:4px;flex-wrap:wrap;justify-content:center;margin-bottom:8px">';
  POTION_RECIPES.forEach(function(p, i){
    html += '<button class="v18PotionBtn" data-idx="'+i+'" style="padding:4px 8px;border-radius:10px;border:2px solid '+(i===0?'#FF5FA2':'transparent')+';background:var(--card-bg);cursor:pointer;font-size:10px;font-weight:600;color:var(--text)">'+p.emoji+' '+p.name+'</button>';
  });
  html += '</div>';
  html += '<button id="v18PotionCraft" style="display:block;margin:0 auto;padding:8px 20px;border-radius:12px;border:none;background:linear-gradient(135deg,#B066FF,#FF5FA2);color:#fff;font-weight:700;cursor:pointer;font-size:13px">🧪 조합하기!</button>';

  var m = createV18Modal('🧪 마법 포션 제조소', html);

  function drawPotion(){
    var c = document.getElementById('v18PotionCanvas');
    if(!c) return;
    var ctx = c.getContext('2d');
    var W = c.width, H = c.height;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = dark?'#1a1030':'#F5F0FF';
    ctx.fillRect(0,0,W,H);

    var recipe = POTION_RECIPES[selectedRecipe];

    ctx.font = 'bold 15px sans-serif';
    ctx.fillStyle = dark?'#FF8EC4':'#FF5FA2';
    ctx.textAlign = 'center';
    ctx.fillText(recipe.emoji+' '+recipe.name, W/2, 24);

    var flaskX = W/2, flaskY = 140;
    ctx.fillStyle = 'rgba(200,200,220,.15)';
    ctx.beginPath();
    ctx.moveTo(flaskX-40, flaskY-60);
    ctx.lineTo(flaskX+40, flaskY-60);
    ctx.lineTo(flaskX+55, flaskY+40);
    ctx.quadraticCurveTo(flaskX+55, flaskY+65, flaskX+30, flaskY+65);
    ctx.lineTo(flaskX-30, flaskY+65);
    ctx.quadraticCurveTo(flaskX-55, flaskY+65, flaskX-55, flaskY+40);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = dark?'rgba(255,255,255,.2)':'rgba(0,0,0,.15)';
    ctx.lineWidth = 2;
    ctx.stroke();

    var liquidH = data.crafted[selectedRecipe] ? 80 : 30;
    var liquidGrad = ctx.createLinearGradient(0, flaskY+65-liquidH, 0, flaskY+65);
    liquidGrad.addColorStop(0, recipe.color+'88');
    liquidGrad.addColorStop(1, recipe.color);
    ctx.fillStyle = liquidGrad;
    ctx.beginPath();
    ctx.roundRect(flaskX-48, flaskY+65-liquidH, 96, liquidH, [0,0,20,20]);
    ctx.fill();

    if(data.crafted[selectedRecipe]){
      for(var b=0;b<6;b++){
        var bx = flaskX - 30 + (b%3)*30;
        var by = flaskY + 30 - (b%2)*15;
        ctx.fillStyle = recipe.color+'44';
        ctx.beginPath();
        ctx.arc(bx, by, 3+b%3, 0, Math.PI*2);
        ctx.fill();
      }
    }

    ctx.font = 'bold 11px sans-serif';
    ctx.fillStyle = dark?'#aaa':'#666';
    ctx.textAlign = 'center';
    ctx.fillText('🧪 재료', W/2, flaskY+95);

    recipe.ingredients.forEach(function(ing, i){
      var ix = 100 + i * 150;
      var iy = flaskY + 115;
      ctx.fillStyle = dark?'rgba(255,255,255,.06)':'rgba(0,0,0,.03)';
      ctx.beginPath();
      ctx.roundRect(ix-55, iy-8, 110, 28, 10);
      ctx.fill();
      ctx.font = '11px sans-serif';
      ctx.fillStyle = dark?'#ddd':'#555';
      ctx.textAlign = 'center';
      ctx.fillText('✨ '+ing, ix, iy+10);
    });

    ctx.font = 'bold 12px sans-serif';
    ctx.fillStyle = recipe.color;
    ctx.textAlign = 'center';
    ctx.fillText('🌟 효과: '+recipe.effect, W/2, H-40);

    var status = data.crafted[selectedRecipe] ? '✅ 제조 완료!' : '❌ 미제조';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillStyle = data.crafted[selectedRecipe] ? '#4CAF50' : '#F44336';
    ctx.fillText(status, W/2, H-20);
    ctx.font = '10px sans-serif';
    ctx.fillStyle = dark?'#888':'#aaa';
    ctx.fillText('총 제조: '+data.total+'회', W/2, H-6);
  }

  drawPotion();

  m.modal.querySelectorAll('.v18PotionBtn').forEach(function(btn){
    btn.onclick = function(){
      selectedRecipe = parseInt(btn.dataset.idx);
      m.modal.querySelectorAll('.v18PotionBtn').forEach(function(b){ b.style.borderColor = 'transparent'; });
      btn.style.borderColor = '#FF5FA2';
      sfxV18('potion_mix');
      drawPotion();
    };
  });

  m.modal.querySelector('#v18PotionCraft').onclick = function(){
    data.crafted[selectedRecipe] = true;
    data.total++;
    v18Save('hatcuping_potions', data);
    sfxV18('potion_complete');
    showToastV18('🧪 '+POTION_RECIPES[selectedRecipe].name+' 제조 성공!');
    drawPotion();
  };
}


// ============================================================
// 3. EMOTION BATTLE ARENA (Canvas turn-based, 6 emotions)
// ============================================================
var BATTLE_EMOTIONS = [
  {name:'사랑',emoji:'❤️',hp:100,atk:25,def:15,color:'#FF5FA2'},
  {name:'용기',emoji:'💪',hp:90,atk:30,def:12,color:'#FF4444'},
  {name:'지혜',emoji:'💡',hp:80,atk:20,def:20,color:'#4488FF'},
  {name:'기쁨',emoji:'😄',hp:110,atk:18,def:18,color:'#FFD700'},
  {name:'친절',emoji:'💖',hp:95,atk:22,def:16,color:'#44BB44'},
  {name:'성실',emoji:'⭐',hp:85,atk:28,def:14,color:'#FF9800'}
];

function openBattleArena(){
  trackV18Feature('battle');
  sfxV18('v18_feature');
  var dark = isDarkV18();
  var data = v18Load('hatcuping_battles', {wins:0,losses:0,streak:0});
  var playerChoice = 0;
  var enemyChoice = Math.floor(Math.random()*BATTLE_EMOTIONS.length);
  var playerHP, enemyHP, battleLog, battleOver;

  function resetBattle(){
    playerHP = BATTLE_EMOTIONS[playerChoice].hp;
    enemyHP = BATTLE_EMOTIONS[enemyChoice].hp;
    battleLog = ['전투 시작!'];
    battleOver = false;
  }
  resetBattle();

  var html = '<div style="margin-bottom:8px"><canvas id="v18BattleCanvas" width="500" height="320" style="width:100%;border-radius:12px;background:'+(dark?'#1a1030':'#FFF8F0')+'"></canvas></div>';
  html += '<div style="display:flex;gap:4px;flex-wrap:wrap;justify-content:center;margin-bottom:8px">';
  BATTLE_EMOTIONS.forEach(function(e, i){
    html += '<button class="v18BattleBtn" data-idx="'+i+'" style="padding:4px 10px;border-radius:10px;border:2px solid '+(i===0?'#FF5FA2':'transparent')+';background:var(--card-bg);cursor:pointer;font-size:11px;font-weight:600;color:var(--text)">'+e.emoji+' '+e.name+'</button>';
  });
  html += '</div>';
  html += '<div style="display:flex;gap:6px;justify-content:center">';
  html += '<button id="v18BattleAtk" style="padding:6px 14px;border-radius:12px;border:none;background:linear-gradient(135deg,#FF4444,#FF6666);color:#fff;font-weight:700;cursor:pointer;font-size:12px">⚔️ 공격</button>';
  html += '<button id="v18BattleDef" style="padding:6px 14px;border-radius:12px;border:none;background:linear-gradient(135deg,#4488FF,#66AAFF);color:#fff;font-weight:700;cursor:pointer;font-size:12px">🛡️ 방어</button>';
  html += '<button id="v18BattleSpecial" style="padding:6px 14px;border-radius:12px;border:none;background:linear-gradient(135deg,#FFD700,#FF9800);color:#fff;font-weight:700;cursor:pointer;font-size:12px">✨ 특수기</button>';
  html += '</div>';
  html += '<div style="text-align:center;font-size:11px;color:var(--text-sub);margin-top:6px">전적: '+data.wins+'승 '+data.losses+'패 | 연승: '+data.streak+'</div>';

  var m = createV18Modal('⚔️ 감정 에너지 배틀', html);

  function drawBattle(){
    var c = document.getElementById('v18BattleCanvas');
    if(!c) return;
    var ctx = c.getContext('2d');
    var W = c.width, H = c.height;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = dark?'#1a1030':'#FFF8F0';
    ctx.fillRect(0,0,W,H);

    var p = BATTLE_EMOTIONS[playerChoice];
    var e = BATTLE_EMOTIONS[enemyChoice];

    ctx.font = '32px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(p.emoji, 100, 80);
    ctx.fillText(e.emoji, 400, 80);

    ctx.font = 'bold 12px sans-serif';
    ctx.fillStyle = dark?'#eee':'#333';
    ctx.fillText(p.name, 100, 105);
    ctx.fillText(e.name, 400, 105);

    ctx.font = '11px sans-serif';
    ctx.fillStyle = dark?'#aaa':'#888';
    ctx.fillText('YOU', 100, 45);
    ctx.fillText('ENEMY', 400, 45);

    ctx.fillStyle = dark?'rgba(255,255,255,.06)':'rgba(0,0,0,.04)';
    ctx.beginPath(); ctx.roundRect(40, 115, 120, 12, 6); ctx.fill();
    ctx.beginPath(); ctx.roundRect(340, 115, 120, 12, 6); ctx.fill();

    ctx.fillStyle = playerHP > p.hp*0.3 ? '#4CAF50' : '#F44336';
    ctx.beginPath(); ctx.roundRect(40, 115, 120*Math.max(playerHP/p.hp,0), 12, 6); ctx.fill();
    ctx.fillStyle = enemyHP > e.hp*0.3 ? '#4CAF50' : '#F44336';
    ctx.beginPath(); ctx.roundRect(340, 115, 120*Math.max(enemyHP/e.hp,0), 12, 6); ctx.fill();

    ctx.font = 'bold 10px sans-serif';
    ctx.fillStyle = dark?'#eee':'#333';
    ctx.textAlign = 'center';
    ctx.fillText(Math.max(playerHP,0)+'/'+p.hp, 100, 145);
    ctx.fillText(Math.max(enemyHP,0)+'/'+e.hp, 400, 145);

    ctx.font = 'bold 14px sans-serif';
    ctx.fillStyle = dark?'#888':'#ccc';
    ctx.fillText('VS', W/2, 90);

    ctx.fillStyle = dark?'rgba(255,255,255,.04)':'rgba(0,0,0,.02)';
    ctx.beginPath(); ctx.roundRect(30, 170, W-60, 120, 12); ctx.fill();

    ctx.font = '11px sans-serif';
    ctx.fillStyle = dark?'#aaa':'#666';
    ctx.textAlign = 'left';
    var logs = battleLog.slice(-5);
    logs.forEach(function(log, i){
      ctx.fillText('▸ '+log, 50, 192 + i*20);
    });
  }

  drawBattle();

  function doAttack(type){
    if(battleOver) return;
    var p = BATTLE_EMOTIONS[playerChoice];
    var e = BATTLE_EMOTIONS[enemyChoice];
    var pDmg, eDmg;

    if(type === 'atk'){
      pDmg = Math.max(p.atk - e.def/2 + Math.floor(Math.random()*8), 5);
      eDmg = Math.max(e.atk - p.def/2 + Math.floor(Math.random()*8), 5);
      battleLog.push(p.name+' 공격! '+pDmg+' 데미지');
    } else if(type === 'def'){
      pDmg = Math.max(p.atk/2 - e.def/2, 3);
      eDmg = Math.max(e.atk - p.def, 2);
      battleLog.push(p.name+' 방어 자세! 피해 감소');
    } else {
      pDmg = Math.max(p.atk * 1.5 - e.def/3 + Math.floor(Math.random()*12), 8);
      eDmg = Math.max(e.atk * 1.2 - p.def/3 + Math.floor(Math.random()*10), 6);
      battleLog.push(p.name+' 특수기! '+Math.round(pDmg)+' 대데미지!');
    }

    enemyHP -= Math.round(pDmg);
    sfxV18('battle_hit');

    if(enemyHP <= 0){
      battleOver = true;
      battleLog.push('🎉 승리! '+p.name+' 이겨냈습니다!');
      data.wins++;
      data.streak++;
      v18Save('hatcuping_battles', data);
      sfxV18('battle_win');
      showToastV18('⚔️ 전투 승리! '+data.streak+'연승!');
    } else {
      playerHP -= Math.round(eDmg);
      battleLog.push(e.name+' 반격! '+Math.round(eDmg)+' 데미지');
      if(playerHP <= 0){
        battleOver = true;
        battleLog.push('💥 패배... 다음엔 이겨봐요!');
        data.losses++;
        data.streak = 0;
        v18Save('hatcuping_battles', data);
      }
    }
    drawBattle();
  }

  m.modal.querySelector('#v18BattleAtk').onclick = function(){ doAttack('atk'); };
  m.modal.querySelector('#v18BattleDef').onclick = function(){ doAttack('def'); };
  m.modal.querySelector('#v18BattleSpecial').onclick = function(){ doAttack('special'); };

  m.modal.querySelectorAll('.v18BattleBtn').forEach(function(btn){
    btn.onclick = function(){
      playerChoice = parseInt(btn.dataset.idx);
      enemyChoice = Math.floor(Math.random()*BATTLE_EMOTIONS.length);
      while(enemyChoice === playerChoice) enemyChoice = Math.floor(Math.random()*BATTLE_EMOTIONS.length);
      m.modal.querySelectorAll('.v18BattleBtn').forEach(function(b){ b.style.borderColor = 'transparent'; });
      btn.style.borderColor = '#FF5FA2';
      resetBattle();
      sfxV18('v18_feature');
      drawBattle();
    };
  });
}


// ============================================================
// 4. TINYPING TAROT (Canvas 10-card fortune telling)
// ============================================================
var TAROT_CARDS = [
  {name:'사랑의 별',meaning:'새로운 사랑과 우정이 피어납니다',emoji:'⭐',color:'#FF5FA2',luck:95},
  {name:'용기의 불꽃',meaning:'도전이 성공으로 이끄어집니다',emoji:'🔥',color:'#FF4444',luck:88},
  {name:'지혜의 달',meaning:'현명한 판단이 빛날 때입니다',emoji:'🌙',color:'#4488FF',luck:82},
  {name:'행복의 무지개',meaning:'뜯밖의 행운이 찾아옵니다',emoji:'🌈',color:'#FFD700',luck:90},
  {name:'친절의 장미',meaning:'따뜻한 마음이 보상받습니다',emoji:'🌹',color:'#E91E63',luck:85},
  {name:'성실의 시계',meaning:'꿇준한 노력이 결실을 맺습니다',emoji:'⏰',color:'#FF9800',luck:78},
  {name:'모험의 나침반',meaning:'새로운 여행이 시작됩니다',emoji:'🧭',color:'#2196F3',luck:80},
  {name:'희망의 태양',meaning:'밝은 미래가 기다립니다',emoji:'☀️',color:'#FFB300',luck:92},
  {name:'조화의 천사',meaning:'모든 것이 균형을 찾습니다',emoji:'😇',color:'#AB47BC',luck:86},
  {name:'기적의 열쇠',meaning:'불가능해 보이던 문이 열립니다',emoji:'🔑',color:'#4CAF50',luck:98}
];

function openTarot(){
  trackV18Feature('tarot');
  sfxV18('v18_feature');
  var dark = isDarkV18();
  var data = v18Load('hatcuping_tarot', {lastDate:'',readings:0});
  var revealed = false;
  var cardIdx = Math.floor(Math.random()*TAROT_CARDS.length);

  var html = '<div style="margin-bottom:8px"><canvas id="v18TarotCanvas" width="500" height="360" style="width:100%;border-radius:12px;background:'+(dark?'#1a1030':'#F0F0FF')+'"></canvas></div>';
  html += '<button id="v18TarotReveal" style="display:block;margin:0 auto;padding:8px 24px;border-radius:12px;border:none;background:linear-gradient(135deg,#AB47BC,#FF5FA2);color:#fff;font-weight:700;cursor:pointer;font-size:13px">🔮 카드 뽑기</button>';
  html += '<div style="text-align:center;font-size:11px;color:var(--text-sub);margin-top:6px">총 점술 횟수: '+data.readings+'</div>';

  var m = createV18Modal('🔮 티니핑 타로 점술', html);

  function drawTarot(){
    var c = document.getElementById('v18TarotCanvas');
    if(!c) return;
    var ctx = c.getContext('2d');
    var W = c.width, H = c.height;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = dark?'#1a1030':'#F0F0FF';
    ctx.fillRect(0,0,W,H);

    ctx.font = 'bold 14px sans-serif';
    ctx.fillStyle = dark?'#C8A8FF':'#7744AA';
    ctx.textAlign = 'center';
    ctx.fillText('🔮 티니핑 타로 점술', W/2, 24);

    var cardW = 160, cardH = 240;
    var cx = W/2 - cardW/2, cy = 45;

    if(!revealed){
      var backGrad = ctx.createLinearGradient(cx,cy,cx+cardW,cy+cardH);
      backGrad.addColorStop(0,'#6B3FA0');
      backGrad.addColorStop(1,'#AB47BC');
      ctx.fillStyle = backGrad;
      ctx.beginPath();
      ctx.roundRect(cx,cy,cardW,cardH,16);
      ctx.fill();

      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(cx+8,cy+8,cardW-16,cardH-16,12);
      ctx.stroke();

      ctx.font = '40px sans-serif';
      ctx.fillStyle = '#FFD700';
      ctx.textAlign = 'center';
      ctx.fillText('?', W/2, cy+cardH/2+14);
      ctx.font = '12px sans-serif';
      ctx.fillText('탭하여 뽑기', W/2, cy+cardH-20);
    } else {
      var card = TAROT_CARDS[cardIdx];
      ctx.fillStyle = dark?'#2a1a3e':'#FFFFFF';
      ctx.beginPath();
      ctx.roundRect(cx,cy,cardW,cardH,16);
      ctx.fill();
      ctx.strokeStyle = card.color;
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.save();
      ctx.shadowColor = card.color;
      ctx.shadowBlur = 20;
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(card.emoji, W/2, cy+80);
      ctx.restore();

      ctx.font = 'bold 16px sans-serif';
      ctx.fillStyle = card.color;
      ctx.fillText(card.name, W/2, cy+120);

      ctx.font = '12px sans-serif';
      ctx.fillStyle = dark?'#ddd':'#555';
      var words = card.meaning.split(' ');
      var line1 = words.slice(0, Math.ceil(words.length/2)).join(' ');
      var line2 = words.slice(Math.ceil(words.length/2)).join(' ');
      ctx.fillText(line1, W/2, cy+150);
      ctx.fillText(line2, W/2, cy+168);

      ctx.font = 'bold 14px sans-serif';
      ctx.fillStyle = '#FFD700';
      ctx.fillText('⭐ 행운지수: '+card.luck+'%', W/2, cy+200);

      var luckBarY = cy+210;
      ctx.fillStyle = dark?'rgba(255,255,255,.06)':'rgba(0,0,0,.04)';
      ctx.beginPath(); ctx.roundRect(cx+20,luckBarY,cardW-40,10,5); ctx.fill();
      var luckGrad = ctx.createLinearGradient(cx+20,0,cx+cardW-20,0);
      luckGrad.addColorStop(0,'#FFD700');
      luckGrad.addColorStop(1,card.color);
      ctx.fillStyle = luckGrad;
      ctx.beginPath(); ctx.roundRect(cx+20,luckBarY,(cardW-40)*card.luck/100,10,5); ctx.fill();
    }

    ctx.font = '10px sans-serif';
    ctx.fillStyle = dark?'#666':'#bbb';
    ctx.textAlign = 'center';
    ctx.fillText('매일 새로운 운세를 확인해보세요!', W/2, H-10);
  }

  drawTarot();

  m.modal.querySelector('#v18TarotReveal').onclick = function(){
    if(revealed){
      revealed = false;
      cardIdx = Math.floor(Math.random()*TAROT_CARDS.length);
    } else {
      revealed = true;
      data.readings++;
      v18Save('hatcuping_tarot', data);
      sfxV18('tarot_reveal');
      showToastV18('🔮 '+TAROT_CARDS[cardIdx].name+' - 행운 '+TAROT_CARDS[cardIdx].luck+'%!');
    }
    drawTarot();
  };
}


// ============================================================
// 5. HATCUPING MUSIC BOX (Canvas + Web Audio melody player)
// ============================================================
var MUSIC_MELODIES = [
  {name:'하츄핑의 노래',notes:[523,587,659,698,784,698,659,587],tempo:250,emoji:'🎵'},
  {name:'용기의 행진곡',notes:[440,523,659,784,880,784,659,523],tempo:200,emoji:'🎺'},
  {name:'별빛 자장가',notes:[659,659,698,784,784,698,659,587],tempo:280,emoji:'🌟'},
  {name:'사랑의 멜로디',notes:[523,659,784,1047,784,659,523,440],tempo:300,emoji:'❤️'},
  {name:'모험의 테마',notes:[392,440,523,587,659,587,523,440],tempo:220,emoji:'🗺️'},
  {name:'평화의 멜로디',notes:[330,392,440,523,587,523,440,392],tempo:320,emoji:'🌿'},
  {name:'친구의 노래',notes:[523,587,659,784,880,1047,880,784],tempo:260,emoji:'🤝'},
  {name:'축제의 팜파레',notes:[659,784,880,1047,1175,1047,880,784],tempo:180,emoji:'🎉'}
];

function openMusicBox(){
  trackV18Feature('musicbox');
  sfxV18('v18_feature');
  var dark = isDarkV18();
  var playing = -1;
  var playTimer = null;

  var html = '<div style="margin-bottom:8px"><canvas id="v18MusicCanvas" width="500" height="300" style="width:100%;border-radius:12px;background:'+(dark?'#1a1030':'#FFF8F0')+'"></canvas></div>';
  html += '<div style="display:flex;gap:4px;flex-wrap:wrap;justify-content:center">';
  MUSIC_MELODIES.forEach(function(mel, i){
    html += '<button class="v18MusicBtn" data-idx="'+i+'" style="padding:5px 10px;border-radius:10px;border:2px solid transparent;background:var(--card-bg);cursor:pointer;font-size:11px;font-weight:600;color:var(--text)">'+mel.emoji+' '+mel.name+'</button>';
  });
  html += '</div>';

  var m = createV18Modal('🎵 하츄핑 뮤직박스', html);

  function drawMusicBox(){
    var c = document.getElementById('v18MusicCanvas');
    if(!c) return;
    var ctx = c.getContext('2d');
    var W = c.width, H = c.height;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = dark?'#1a1030':'#FFF8F0';
    ctx.fillRect(0,0,W,H);

    ctx.font = 'bold 15px sans-serif';
    ctx.fillStyle = dark?'#FF8EC4':'#FF5FA2';
    ctx.textAlign = 'center';
    ctx.fillText('🎵 하츄핑 뮤직박스', W/2, 24);

    ctx.fillStyle = dark?'rgba(255,255,255,.04)':'rgba(0,0,0,.02)';
    ctx.beginPath();
    ctx.roundRect(30, 40, W-60, 100, 16);
    ctx.fill();
    ctx.strokeStyle = dark?'rgba(255,255,255,.08)':'rgba(0,0,0,.06)';
    ctx.lineWidth = 2;
    ctx.stroke();

    if(playing >= 0){
      var mel = MUSIC_MELODIES[playing];
      ctx.font = '28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(mel.emoji, W/2, 80);
      ctx.font = 'bold 13px sans-serif';
      ctx.fillStyle = dark?'#eee':'#333';
      ctx.fillText('♪ '+mel.name+' 재생 중...', W/2, 110);

      var noteW = (W-80)/mel.notes.length;
      mel.notes.forEach(function(freq, i){
        var nh = (freq-300)/8;
        var nx = 40 + i*noteW;
        var ny = 200 - nh;
        ctx.fillStyle = 'rgba(255,95,162,'+(0.3+i*0.08)+')';
        ctx.beginPath();
        ctx.roundRect(nx, ny, noteW-4, nh, [6,6,0,0]);
        ctx.fill();
        ctx.font = '9px sans-serif';
        ctx.fillStyle = dark?'#aaa':'#888';
        ctx.textAlign = 'center';
        ctx.fillText(Math.round(freq)+'Hz', nx+noteW/2-2, 210);
      });
    } else {
      ctx.font = '36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🎶', W/2, 85);
      ctx.font = '12px sans-serif';
      ctx.fillStyle = dark?'#aaa':'#888';
      ctx.fillText('아래에서 곡을 선택해주세요!', W/2, 115);
    }

    ctx.font = '10px sans-serif';
    ctx.fillStyle = dark?'#666':'#bbb';
    ctx.textAlign = 'center';
    ctx.fillText(MUSIC_MELODIES.length+'곡 수록 | Web Audio API 실시간 재생', W/2, H-12);
  }

  drawMusicBox();

  function playMelody(idx){
    if(playTimer) clearTimeout(playTimer);
    playing = idx;
    drawMusicBox();
    _v18InitAudio();
    if(!_v18Ctx) return;
    var mel = MUSIC_MELODIES[idx];
    var noteIdx = 0;
    function playNote(){
      if(noteIdx >= mel.notes.length){ playing = -1; drawMusicBox(); return; }
      try{
        var osc = _v18Ctx.createOscillator();
        var gain = _v18Ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = mel.notes[noteIdx];
        gain.gain.value = 0.1;
        gain.gain.exponentialRampToValueAtTime(0.001, _v18Ctx.currentTime + mel.tempo/1000 * 0.9);
        osc.connect(gain);
        gain.connect(_v18Ctx.destination);
        osc.start();
        osc.stop(_v18Ctx.currentTime + mel.tempo/1000);
      }catch(e){}
      noteIdx++;
      playTimer = setTimeout(playNote, mel.tempo);
    }
    playNote();
  }

  m.modal.querySelectorAll('.v18MusicBtn').forEach(function(btn){
    btn.onclick = function(){
      var idx = parseInt(btn.dataset.idx);
      m.modal.querySelectorAll('.v18MusicBtn').forEach(function(b){ b.style.borderColor = 'transparent'; });
      btn.style.borderColor = '#FF5FA2';
      playMelody(idx);
    };
  });
}


// ============================================================
// 6. CHARACTER STAT COMPARISON (Canvas 6-axis radar, 2 chars)
// ============================================================
function openStatCompare(){
  trackV18Feature('statcompare');
  sfxV18('v18_feature');
  var dark = isDarkV18();
  var chars = [
    {name:'하츄핑',stats:{atk:80,def:70,spd:75,mag:90,hp:85,luck:88},color:'#FF5FA2',emoji:'💖'},
    {name:'바로핑',stats:{atk:75,def:85,spd:70,mag:65,hp:90,luck:72},color:'#4488FF',emoji:'💙'},
    {name:'차차핑',stats:{atk:85,def:60,spd:90,mag:70,hp:75,luck:82},color:'#FF9800',emoji:'🧡'},
    {name:'해필핑',stats:{atk:70,def:75,spd:80,mag:80,hp:80,luck:90},color:'#4CAF50',emoji:'💚'},
    {name:'아자핑',stats:{atk:95,def:55,spd:85,mag:60,hp:70,luck:78},color:'#F44336',emoji:'❤️'},
    {name:'라라핑',stats:{atk:65,def:80,spd:65,mag:95,hp:78,luck:85},color:'#9C27B0',emoji:'💜'}
  ];
  var sel = [0,1];

  var html = '<div style="margin-bottom:8px"><canvas id="v18CompareCanvas" width="480" height="400" style="width:100%;border-radius:12px;background:'+(dark?'#1a1030':'#F8F0FF')+'"></canvas></div>';
  html += '<div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">';
  chars.forEach(function(ch, i){
    html += '<button class="v18CompBtn" data-idx="'+i+'" style="padding:4px 10px;border-radius:10px;border:2px solid '+(i<2?chars[i].color:'transparent')+';background:var(--card-bg);cursor:pointer;font-size:11px;font-weight:600;color:var(--text)">'+ch.emoji+' '+ch.name+'</button>';
  });
  html += '</div>';

  var m = createV18Modal('📊 캐릭터 능력치 비교', html);

  function drawCompare(){
    var c = document.getElementById('v18CompareCanvas');
    if(!c) return;
    var ctx = c.getContext('2d');
    var W = c.width, H = c.height;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = dark?'#1a1030':'#F8F0FF';
    ctx.fillRect(0,0,W,H);

    var cX = W/2, cY = H/2+20, R = 130;
    var axes = [
      {key:'atk',label:'공격',angle:-Math.PI/2},
      {key:'def',label:'방어',angle:-Math.PI/2+Math.PI/3},
      {key:'spd',label:'속도',angle:-Math.PI/2+2*Math.PI/3},
      {key:'mag',label:'마법',angle:-Math.PI/2+Math.PI},
      {key:'hp',label:'체력',angle:-Math.PI/2+4*Math.PI/3},
      {key:'luck',label:'행운',angle:-Math.PI/2+5*Math.PI/3}
    ];

    ctx.font = 'bold 14px sans-serif';
    ctx.fillStyle = dark?'#FF8EC4':'#FF5FA2';
    ctx.textAlign = 'center';
    ctx.fillText(chars[sel[0]].emoji+' '+chars[sel[0]].name+' vs '+chars[sel[1]].emoji+' '+chars[sel[1]].name, cX, 22);

    for(var ring=4;ring>=1;ring--){
      var rr = R*ring/4;
      ctx.beginPath();
      for(var a=0;a<6;a++){
        var px = cX+Math.cos(axes[a].angle)*rr;
        var py = cY+Math.sin(axes[a].angle)*rr;
        if(a===0) ctx.moveTo(px,py); else ctx.lineTo(px,py);
      }
      ctx.closePath();
      ctx.strokeStyle = dark?'rgba(255,255,255,.06)':'rgba(0,0,0,.05)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    for(var a=0;a<6;a++){
      ctx.beginPath();
      ctx.moveTo(cX,cY);
      ctx.lineTo(cX+Math.cos(axes[a].angle)*R, cY+Math.sin(axes[a].angle)*R);
      ctx.strokeStyle = dark?'rgba(255,255,255,.08)':'rgba(0,0,0,.06)';
      ctx.stroke();
      var lx = cX+Math.cos(axes[a].angle)*(R+22);
      var ly = cY+Math.sin(axes[a].angle)*(R+22);
      ctx.font = 'bold 10px sans-serif';
      ctx.fillStyle = dark?'#aaa':'#666';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(axes[a].label, lx, ly);
    }

    for(var ci=0;ci<2;ci++){
      var ch = chars[sel[ci]];
      ctx.beginPath();
      for(var a=0;a<6;a++){
        var val = ch.stats[axes[a].key]/100;
        var px = cX+Math.cos(axes[a].angle)*R*val;
        var py = cY+Math.sin(axes[a].angle)*R*val;
        if(a===0) ctx.moveTo(px,py); else ctx.lineTo(px,py);
      }
      ctx.closePath();
      ctx.fillStyle = ch.color+'33';
      ctx.fill();
      ctx.strokeStyle = ch.color;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    var legendY = H - 30;
    for(var ci=0;ci<2;ci++){
      var lx2 = W/2 + (ci===0?-80:20);
      ctx.fillStyle = chars[sel[ci]].color;
      ctx.beginPath(); ctx.roundRect(lx2,legendY,12,12,3); ctx.fill();
      ctx.font = '11px sans-serif';
      ctx.fillStyle = dark?'#eee':'#333';
      ctx.textAlign = 'left';
      ctx.fillText(chars[sel[ci]].name, lx2+16, legendY+10);
    }
  }

  drawCompare();

  var clickCount = 0;
  m.modal.querySelectorAll('.v18CompBtn').forEach(function(btn){
    btn.onclick = function(){
      var idx = parseInt(btn.dataset.idx);
      sel[clickCount % 2] = idx;
      clickCount++;
      m.modal.querySelectorAll('.v18CompBtn').forEach(function(b){ b.style.borderColor = 'transparent'; });
      m.modal.querySelectorAll('.v18CompBtn[data-idx="'+sel[0]+'"]').forEach(function(b){ b.style.borderColor = chars[sel[0]].color; });
      m.modal.querySelectorAll('.v18CompBtn[data-idx="'+sel[1]+'"]').forEach(function(b){ b.style.borderColor = chars[sel[1]].color; });
      sfxV18('v18_feature');
      drawCompare();
    };
  });
}


// ============================================================
// 7. SEASON EVENT CALENDAR (Canvas monthly calendar + events)
// ============================================================
var SEASON_EVENTS = [
  {month:1,day:1,name:'새해 축제',emoji:'🎉',reward:'+100XP'},
  {month:2,day:14,name:'발렌타인 이벤트',emoji:'💝',reward:'사랑 무기'},
  {month:3,day:1,name:'봄 축제',emoji:'🌸',reward:'봄 코스튬'},
  {month:4,day:5,name:'식목일 이벤트',emoji:'🌳',reward:'+50XP'},
  {month:5,day:5,name:'어린이날 특별이벤트',emoji:'🎈',reward:'특별 배지'},
  {month:6,day:21,name:'하지 이벤트',emoji:'☀️',reward:'+80XP'},
  {month:7,day:7,name:'칠석 이벤트',emoji:'🌟',reward:'별빛 무기'},
  {month:8,day:15,name:'여름 페스티벌',emoji:'🌴',reward:'여름 코스튼'},
  {month:9,day:1,name:'가을 수확제',emoji:'🍂',reward:'+60XP'},
  {month:10,day:31,name:'할로윈 파티',emoji:'🎃',reward:'할로윈 코스튼'},
  {month:11,day:11,name:'빼빼로 데이',emoji:'🍬',reward:'+30XP'},
  {month:12,day:25,name:'크리스마스 파티',emoji:'🎄',reward:'크리스마스 무기'}
];

function openSeasonCalendar(){
  trackV18Feature('calendar');
  sfxV18('v18_feature');
  var dark = isDarkV18();
  var now = new Date();
  var currentMonth = now.getMonth();
  var currentDay = now.getDate();

  var html = '<div style="margin-bottom:8px"><canvas id="v18CalCanvas" width="500" height="380" style="width:100%;border-radius:12px;background:'+(dark?'#1a1030':'#FFF5F0')+'"></canvas></div>';
  html += '<div style="display:flex;gap:6px;justify-content:center">';
  html += '<button id="v18CalPrev" style="padding:4px 12px;border-radius:8px;border:1px solid var(--border);background:var(--card-bg);cursor:pointer;font-weight:700;color:var(--text)">&lt;</button>';
  html += '<button id="v18CalNext" style="padding:4px 12px;border-radius:8px;border:1px solid var(--border);background:var(--card-bg);cursor:pointer;font-weight:700;color:var(--text)">&gt;</button>';
  html += '</div>';

  var m = createV18Modal('📅 시즌 이벤트 캘린더', html);
  var viewMonth = currentMonth;

  function drawCalendar(){
    var c = document.getElementById('v18CalCanvas');
    if(!c) return;
    var ctx = c.getContext('2d');
    var W = c.width, H = c.height;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = dark?'#1a1030':'#FFF5F0';
    ctx.fillRect(0,0,W,H);

    var months = ['월','화','수','목','금','토','일'];
    var monthNames = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];

    ctx.font = 'bold 15px sans-serif';
    ctx.fillStyle = dark?'#FF8EC4':'#FF5FA2';
    ctx.textAlign = 'center';
    ctx.fillText('📅 '+monthNames[viewMonth]+' 이벤트 캘린더', W/2, 24);

    var cellW = (W-40)/7, cellH = 42;
    var startX = 20, startY = 50;

    months.forEach(function(d, i){
      ctx.font = 'bold 11px sans-serif';
      ctx.fillStyle = i===5?'#4488FF':i===6?'#F44336':(dark?'#aaa':'#666');
      ctx.textAlign = 'center';
      ctx.fillText(d, startX + i*cellW + cellW/2, startY);
    });

    var firstDay = new Date(now.getFullYear(), viewMonth, 1).getDay();
    var daysInMonth = new Date(now.getFullYear(), viewMonth+1, 0).getDate();
    var eventMap = {};
    SEASON_EVENTS.forEach(function(ev){ if(ev.month === viewMonth+1) eventMap[ev.day] = ev; });

    var day = 1;
    for(var row=0;row<6;row++){
      for(var col=0;col<7;col++){
        var cellIdx = row*7+col;
        if(cellIdx < firstDay || day > daysInMonth) continue;

        var cx = startX + col*cellW;
        var cy = startY + 12 + row*cellH;
        var isToday = (viewMonth === currentMonth && day === currentDay);
        var hasEvent = eventMap[day];

        if(isToday){
          ctx.fillStyle = 'rgba(255,95,162,.15)';
          ctx.beginPath(); ctx.roundRect(cx+2,cy,cellW-4,cellH-4,8); ctx.fill();
          ctx.strokeStyle = '#FF5FA2';
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.roundRect(cx+2,cy,cellW-4,cellH-4,8); ctx.stroke();
        } else if(hasEvent){
          ctx.fillStyle = dark?'rgba(255,215,0,.08)':'rgba(255,215,0,.1)';
          ctx.beginPath(); ctx.roundRect(cx+2,cy,cellW-4,cellH-4,8); ctx.fill();
        }

        ctx.font = 'bold 12px sans-serif';
        ctx.fillStyle = col===6?'#F44336':col===5?'#4488FF':(dark?'#eee':'#333');
        ctx.textAlign = 'center';
        ctx.fillText(day, cx+cellW/2, cy+16);

        if(hasEvent){
          ctx.font = '12px sans-serif';
          ctx.fillText(hasEvent.emoji, cx+cellW/2, cy+32);
        }

        day++;
      }
    }

    var monthEvents = SEASON_EVENTS.filter(function(ev){ return ev.month === viewMonth+1; });
    if(monthEvents.length > 0){
      var evY = H - 50;
      ctx.font = 'bold 11px sans-serif';
      ctx.fillStyle = dark?'#FFD54F':'#FF9800';
      ctx.textAlign = 'center';
      monthEvents.forEach(function(ev, i){
        ctx.fillText(ev.emoji+' '+ev.day+'일: '+ev.name+' ('+ev.reward+')', W/2, evY + i*16);
      });
    } else {
      ctx.font = '11px sans-serif';
      ctx.fillStyle = dark?'#666':'#bbb';
      ctx.textAlign = 'center';
      ctx.fillText('이번 달에는 이벤트가 없어요', W/2, H-30);
    }
  }

  drawCalendar();

  m.modal.querySelector('#v18CalPrev').onclick = function(){
    viewMonth = (viewMonth + 11) % 12;
    sfxV18('calendar_mark');
    drawCalendar();
  };
  m.modal.querySelector('#v18CalNext').onclick = function(){
    viewMonth = (viewMonth + 1) % 12;
    sfxV18('calendar_mark');
    drawCalendar();
  };
}


// ============================================================
// 8. ADVENTURE WORLD MAP (Canvas exploration map, 10 regions)
// ============================================================
var WORLD_REGIONS = [
  {name:'하트 마을',x:250,y:180,r:28,color:'#FF5FA2',emoji:'🏠',desc:'하츄핑의 고향'},
  {name:'별빛 숲',x:120,y:120,r:24,color:'#4CAF50',emoji:'🌳',desc:'신비한 발광 나무들'},
  {name:'용기의 불꽃 산',x:380,y:100,r:26,color:'#FF4444',emoji:'🌋',desc:'거대한 화산 지형'},
  {name:'지혜의 호수',x:100,y:250,r:22,color:'#2196F3',emoji:'🌊',desc:'맑고 평온한 호수'},
  {name:'무지개 다리',x:250,y:60,r:20,color:'#FFD700',emoji:'🌈',desc:'하늘을 가로지르는 다리'},
  {name:'천사의 탑',x:400,y:240,r:24,color:'#AB47BC',emoji:'🏰',desc:'높이 솔은 신비의 탑'},
  {name:'꿇의 암혁',x:180,y:310,r:22,color:'#FF9800',emoji:'🍵',desc:'꿇이 흐르는 때'},
  {name:'별똑별 전문대',x:360,y:320,r:20,color:'#00BCD4',emoji:'🔭',desc:'별을 관측하는 곳'},
  {name:'사랑의 정원',x:60,y:180,r:22,color:'#E91E63',emoji:'🌹',desc:'아름다운 꽃이 피는 곳'},
  {name:'비밀의 동굴',x:430,y:160,r:20,color:'#607D8B',emoji:'🗿',desc:'미지의 보물이 잠든 곳'}
];

function openWorldMap(){
  trackV18Feature('worldmap');
  sfxV18('v18_feature');
  var dark = isDarkV18();
  var data = v18Load('hatcuping_worldmap', {explored:{}});

  var html = '<div style="margin-bottom:8px"><canvas id="v18MapCanvas" width="500" height="400" style="width:100%;border-radius:12px;background:'+(dark?'#0d1030':'#E8F0FF')+';cursor:pointer"></canvas></div>';
  html += '<div id="v18MapInfo" style="text-align:center;font-size:12px;color:var(--text-sub)">지역을 탭하여 탐험하세요! (탐험: '+Object.keys(data.explored).length+'/'+WORLD_REGIONS.length+')</div>';

  var m = createV18Modal('🗺️ 모험 월드맵', html);

  function drawMap(){
    var c = document.getElementById('v18MapCanvas');
    if(!c) return;
    var ctx = c.getContext('2d');
    var W = c.width, H = c.height;
    ctx.clearRect(0,0,W,H);

    var bgGrad = ctx.createRadialGradient(W/2,H/2,50,W/2,H/2,300);
    bgGrad.addColorStop(0, dark?'#1a1040':'#E8F4FF');
    bgGrad.addColorStop(1, dark?'#0a0820':'#D0E0F0');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0,0,W,H);

    for(var i=0;i<WORLD_REGIONS.length;i++){
      for(var j=i+1;j<WORLD_REGIONS.length;j++){
        var a = WORLD_REGIONS[i], b = WORLD_REGIONS[j];
        var dist = Math.sqrt(Math.pow(a.x-b.x,2)+Math.pow(a.y-b.y,2));
        if(dist < 180){
          ctx.beginPath();
          ctx.moveTo(a.x,a.y);
          ctx.lineTo(b.x,b.y);
          ctx.strokeStyle = dark?'rgba(255,255,255,.06)':'rgba(0,0,0,.05)';
          ctx.lineWidth = 1;
          ctx.setLineDash([4,4]);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }
    }

    WORLD_REGIONS.forEach(function(region, i){
      var explored = !!data.explored[i];

      if(explored){
        ctx.save();
        ctx.shadowColor = region.color;
        ctx.shadowBlur = 12;
      }
      ctx.fillStyle = explored ? region.color+'44' : (dark?'rgba(255,255,255,.04)':'rgba(0,0,0,.03)');
      ctx.beginPath();
      ctx.arc(region.x, region.y, region.r, 0, Math.PI*2);
      ctx.fill();
      ctx.strokeStyle = explored ? region.color : (dark?'rgba(255,255,255,.12)':'rgba(0,0,0,.08)');
      ctx.lineWidth = 2;
      ctx.stroke();
      if(explored) ctx.restore();

      ctx.font = (region.r > 22 ? '18' : '14')+'px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(explored ? region.emoji : '❓', region.x, region.y);

      ctx.font = 'bold 9px sans-serif';
      ctx.fillStyle = explored ? (dark?'#eee':'#333') : (dark?'#555':'#bbb');
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(explored ? region.name : '???', region.x, region.y + region.r + 12);
    });

    var explored_count = Object.keys(data.explored).length;
    ctx.font = 'bold 12px sans-serif';
    ctx.fillStyle = dark?'#FFD54F':'#FF9800';
    ctx.textAlign = 'center';
    ctx.fillText('탐험률: '+Math.round(explored_count/WORLD_REGIONS.length*100)+'% ('+explored_count+'/'+WORLD_REGIONS.length+')', W/2, H-12);
  }

  drawMap();

  var canvas = document.getElementById('v18MapCanvas');
  if(canvas){
    canvas.onclick = function(e){
      var rect = canvas.getBoundingClientRect();
      var scaleX = canvas.width / rect.width;
      var scaleY = canvas.height / rect.height;
      var mx = (e.clientX - rect.left) * scaleX;
      var my = (e.clientY - rect.top) * scaleY;

      for(var i=0;i<WORLD_REGIONS.length;i++){
        var r = WORLD_REGIONS[i];
        var dist = Math.sqrt(Math.pow(mx-r.x,2)+Math.pow(my-r.y,2));
        if(dist <= r.r + 8){
          data.explored[i] = true;
          v18Save('hatcuping_worldmap', data);
          sfxV18('tarot_reveal');
          showToastV18('🗺️ '+r.name+' 탐험 완료! - '+r.desc);
          drawMap();
          document.getElementById('v18MapInfo').textContent = '탐험: '+Object.keys(data.explored).length+'/'+WORLD_REGIONS.length;
          break;
        }
      }
    };
  }
}


// ============================================================
// V18 ACHIEVEMENTS (12 new, 142->154)
// ============================================================
var V18_ACHIEVEMENTS = [
  {id:'a_v18_evolve_first',name:'진화 입문',desc:'첫 번째 진화 성공',cat:'general',icon:'🥚'},
  {id:'a_v18_evolve_max',name:'진화 마스터',desc:'캐릭터 완성 단계 도달',cat:'general',icon:'👑'},
  {id:'a_v18_potion_first',name:'조보 연금술사',desc:'첫 포션 제조',cat:'general',icon:'🧪'},
  {id:'a_v18_potion_5',name:'포션 마스터',desc:'포션 5종 제조',cat:'general',icon:'⚗️'},
  {id:'a_v18_battle_first',name:'첫 전투',desc:'감정 배틀 첫 승리',cat:'general',icon:'⚔️'},
  {id:'a_v18_battle_5',name:'전투 베테랑',desc:'배틀 5승 달성',cat:'general',icon:'🏆'},
  {id:'a_v18_tarot',name:'점술사',desc:'타로 점술 3회 이상',cat:'general',icon:'🔮'},
  {id:'a_v18_music',name:'음악 감상가',desc:'뮤직박스에서 곡 재생',cat:'general',icon:'🎵'},
  {id:'a_v18_compare',name:'분석가',desc:'캐릭터 비교 체험',cat:'general',icon:'📊'},
  {id:'a_v18_calendar',name:'이벤트 탐색가',desc:'캘린더 확인',cat:'general',icon:'📅'},
  {id:'a_v18_worldmap_5',name:'탐험가',desc:'월드맵 5곣 탐험',cat:'general',icon:'🗺️'},
  {id:'a_v18_explorer',name:'v18 탐험가',desc:'v18 기능 6개 이상 체험',cat:'general',icon:'🌟'}
];


// ============================================================
// INJECT V18 ACHIEVEMENTS
// ============================================================
function injectV18Achievements(){
  if(!window.AD) return;
  V18_ACHIEVEMENTS.forEach(function(a){
    var exists = false;
    for(var i=0;i<window.AD.length;i++){
      if(window.AD[i].id === a.id){ exists = true; break; }
    }
    if(!exists) window.AD.push(a);
  });
}


// ============================================================
// CHECK AND AWARD V18 ACHIEVEMENTS
// ============================================================
function checkAndAwardV18(){
  try{
    var a = JSON.parse(localStorage.getItem('hatcuping_achievements') || '{}');

    var evo = v18Load('hatcuping_evolution', {xp:{}});
    var hasEvo = false, hasMax = false;
    for(var k in evo.xp){ if(evo.xp[k] >= 50) hasEvo = true; if(evo.xp[k] >= 300) hasMax = true; }
    if(hasEvo && !a.a_v18_evolve_first){ a.a_v18_evolve_first = Date.now(); showToastV18('🏆 진화 입문 업적 달성!'); }
    if(hasMax && !a.a_v18_evolve_max){ a.a_v18_evolve_max = Date.now(); showToastV18('🏆 진화 마스터 업적 달성!'); }

    var potions = v18Load('hatcuping_potions', {crafted:{},total:0});
    if(potions.total > 0 && !a.a_v18_potion_first){ a.a_v18_potion_first = Date.now(); showToastV18('🏆 조보 연금술사 업적 달성!'); }
    if(Object.keys(potions.crafted).length >= 5 && !a.a_v18_potion_5){ a.a_v18_potion_5 = Date.now(); showToastV18('🏆 포션 마스터 업적 달성!'); }

    var battles = v18Load('hatcuping_battles', {wins:0});
    if(battles.wins > 0 && !a.a_v18_battle_first){ a.a_v18_battle_first = Date.now(); showToastV18('🏆 첫 전투 업적 달성!'); }
    if(battles.wins >= 5 && !a.a_v18_battle_5){ a.a_v18_battle_5 = Date.now(); showToastV18('🏆 전투 베테랑 업적 달성!'); }

    var tarot = v18Load('hatcuping_tarot', {readings:0});
    if(tarot.readings >= 3 && !a.a_v18_tarot){ a.a_v18_tarot = Date.now(); showToastV18('🏆 점술사 업적 달성!'); }

    var worldmap = v18Load('hatcuping_worldmap', {explored:{}});
    if(Object.keys(worldmap.explored).length >= 5 && !a.a_v18_worldmap_5){ a.a_v18_worldmap_5 = Date.now(); showToastV18('🏆 탐험가 업적 달성!'); }

    var features = [];
    try{ features = JSON.parse(localStorage.getItem('hatcuping_v18_features') || '[]'); }catch(e){}
    if(features.indexOf('musicbox') !== -1 && !a.a_v18_music){ a.a_v18_music = Date.now(); showToastV18('🏆 음악 감상가 업적 달성!'); }
    if(features.indexOf('statcompare') !== -1 && !a.a_v18_compare){ a.a_v18_compare = Date.now(); showToastV18('🏆 분석가 업적 달성!'); }
    if(features.indexOf('calendar') !== -1 && !a.a_v18_calendar){ a.a_v18_calendar = Date.now(); showToastV18('🏆 이벤트 탐색가 업적 달성!'); }
    if(features.length >= 6 && !a.a_v18_explorer){ a.a_v18_explorer = Date.now(); showToastV18('🏆 v18 탐험가 업적 달성!'); }

    localStorage.setItem('hatcuping_achievements', JSON.stringify(a));
  }catch(e){}
}


// ============================================================
// QUIZ V18 (+15 questions, 135->150)
// ============================================================
function injectExtraQuizV18(){
  if(!window.QUIZ_BANK) window.QUIZ_BANK = [];
  var pool = window.hatcuping_quiz_pool || window.QUIZ_BANK;
  var newQ = [
    {q:'진화 연구소의 캐릭터 수는?',a:['4','6','8','10'],c:2},
    {q:'진화 완성 단계까지 필요한 XP는?',a:['100','200','300','500'],c:2},
    {q:'마법 포션의 종류 수는?',a:['6','8','10','12'],c:2},
    {q:'우정의 영약 효과는?',a:['+공격 50%','+우정 100%','+체력 200%','+마법 80%'],c:1},
    {q:'감정 배틀의 감정 종류 수는?',a:['4','5','6','8'],c:2},
    {q:'배틀에서 특수기의 데미지 배율은?',a:['x1.2','x1.5','x2.0','x3.0'],c:1},
    {q:'타로 카드의 총 수는?',a:['6','8','10','12'],c:2},
    {q:'행운지수가 가장 높은 카드는?',a:['사랑의 별','기적의 열쇠','희망의 태양','행복의 무지개'],c:1},
    {q:'뮤직박스의 수록곡 수는?',a:['4','6','8','10'],c:2},
    {q:'월드맵의 지역 수는?',a:['6','8','10','12'],c:2},
    {q:'하트 마을은 누구의 고향?',a:['바로핑','하츄핑','차차핑','해필핑'],c:1},
    {q:'시즌 이벤트의 총 수는?',a:['8','10','12','15'],c:2},
    {q:'크리스마스 파티의 보상은?',a:['+100XP','별빛 무기','크리스마스 무기','+200XP'],c:2},
    {q:'v18에서 추가된 업적 수는?',a:['8','10','12','15'],c:2},
    {q:'아자핑의 가장 높은 능력치는?',a:['공격','방어','속도','마법'],c:0}
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
// KEYBOARD SHORTCUTS (8 new: Shift+H/I/J/K/L/O/P/Q)
// ============================================================
function injectV18Keyboard(){
  document.addEventListener('keydown', function(e){
    if(e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if(!e.shiftKey) return;
    switch(e.key){
      case 'H': e.preventDefault(); openEvolutionLab(); break;
      case 'I': e.preventDefault(); openPotionLab(); break;
      case 'J': e.preventDefault(); openBattleArena(); break;
      case 'K': e.preventDefault(); openTarot(); break;
      case 'L': e.preventDefault(); openMusicBox(); break;
      case 'O': e.preventDefault(); openStatCompare(); break;
      case 'P': e.preventDefault(); openSeasonCalendar(); break;
      case 'Q': e.preventDefault(); openWorldMap(); break;
    }
  });
}


// ============================================================
// BOTTOM NAVIGATION BAR (8 quick action buttons, replaces v17)
// ============================================================
function injectV18BottomNav(){
  var existing = document.getElementById('v17BottomNav');
  if(existing) existing.remove();
  existing = document.getElementById('v18BottomNav');
  if(existing) return;

  var nav = document.createElement('div');
  nav.id = 'v18BottomNav';
  nav.style.cssText = 'position:fixed;bottom:0;left:0;right:0;display:flex;justify-content:space-around;align-items:center;padding:6px 4px;background:rgba(255,255,255,.95);border-top:1px solid rgba(0,0,0,.08);z-index:901;backdrop-filter:blur(10px)';
  if(isDarkV18()) nav.style.background = 'rgba(26,10,46,.95)';

  var buttons = [
    {icon:'🧬',label:'진화',action:openEvolutionLab},
    {icon:'🧪',label:'포션',action:openPotionLab},
    {icon:'⚔️',label:'배틀',action:openBattleArena},
    {icon:'🔮',label:'타로',action:openTarot},
    {icon:'🎵',label:'뮤직',action:openMusicBox},
    {icon:'📊',label:'비교',action:openStatCompare},
    {icon:'📅',label:'캘린더',action:openSeasonCalendar},
    {icon:'🗺️',label:'월드맵',action:openWorldMap}
  ];

  buttons.forEach(function(b){
    var btn = document.createElement('button');
    btn.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:2px;background:none;border:none;cursor:pointer;padding:4px 6px;border-radius:8px;transition:all .2s';
    btn.innerHTML = '<span style="font-size:18px">' + b.icon + '</span><span style="font-size:9px;font-weight:700;color:var(--text-sub)">' + b.label + '</span>';
    btn.onmouseenter = function(){ btn.style.background = 'rgba(255,95,162,.1)'; };
    btn.onmouseleave = function(){ btn.style.background = 'none'; };
    btn.onclick = b.action;
    nav.appendChild(btn);
  });

  document.body.appendChild(nav);
  document.body.style.paddingBottom = '56px';
}


// ============================================================
// FOOTER, NEWS, META UPDATE
// ============================================================
function updateV18Footer(){
  var ver = document.querySelector('.footer .version');
  if(ver) ver.textContent = 'v18.0 | © PRIME Holdings NEXTERA+PRISM';

  var links = document.querySelector('.footer-links');
  if(links) links.innerHTML = '<span class="footer-link">4종 게임</span><span class="footer-link">154개 업적</span><span class="footer-link">진화+포션+배틀</span><span class="footer-link">타로+뮤직+월드맵</span><span class="footer-link">퀴즈 150문</span>';
}

function updateV18News(){
  var newsSection = document.querySelector('.news-section');
  if(!newsSection) return;
  var firstItem = newsSection.querySelector('.news-item');
  if(!firstItem) return;
  var newItem = document.createElement('div');
  newItem.className = 'news-item';
  newItem.innerHTML = '<span class="news-date">v18.0</span><span class="news-text">진화연구소8캐릭터Canvas, 마법포션제조소10종Canvas, 감정에너지배틀6감정Canvas, 티니핑타로10장Canvas, 뮤직박스8곡WebAudio, 캐릭터비교6축6인RadarCanvas, 시즌캘린더12이벤트Canvas, 모험월드맵10지역Canvas, 퀴즈+15(150), 업적+12(154)</span>';
  firstItem.parentNode.insertBefore(newItem, firstItem);
}

function updateV18AchieveCount(){
  var el = document.getElementById('achieveCount');
  if(el){
    var c = 0;
    try{ c = Object.keys(JSON.parse(localStorage.getItem('hatcuping_achievements') || '{}')).length; }catch(e){}
    var t = window.AD ? window.AD.length : 154;
    el.textContent = c + '/' + t;
  }
}

function updateV18Meta(){
  var descMeta = document.querySelector('meta[name="description"]');
  if(descMeta) descMeta.content = '사랑의 하츄핑 v18.0 - 플랫포머 액션, 턴제 RPG, 오픈월드, UNIFIED 4종 게임. 업적 154개, 진화연구소8캐릭터, 마법포션10종, 감정배틀6종, 타로10장, 뮤직박스8곡, 캐릭터비교6축Radar, 시즌캘린더12이벤트, 월드맵10지역, 퀴즈 150문!';
  document.title = '사랑의 하츄핑 v18.0 - 게임 선택';
}


// ============================================================
// BOOT
// ============================================================
function bootV18(){
  injectV18Achievements();
  injectExtraQuizV18();
  injectV18Keyboard();
  injectV18BottomNav();
  updateV18Footer();
  updateV18News();
  updateV18AchieveCount();
  updateV18Meta();
  checkAndAwardV18();
}

if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', bootV18);
} else {
  bootV18();
}

})();

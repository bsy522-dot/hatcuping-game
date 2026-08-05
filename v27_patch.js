// hatcuping-game v27_patch.js - NEXTERA+PRISM AUTO v27.0
// Self-contained IIFE patch module
(function(){
'use strict';

var _v27Ctx = null;
function _v27InitAudio(){
  if(!_v27Ctx){
    try{ _v27Ctx = new (window.AudioContext || window.webkitAudioContext)(); }catch(e){}
  }
  if(_v27Ctx && _v27Ctx.state === 'suspended') _v27Ctx.resume();
}

var V27_SFX = {
  evo_select:{f:680,d:.06,t:'triangle'},
  evo_evolve:{f:1250,d:.2,t:'sine'},
  type_scan:{f:740,d:.05,t:'sine'},
  type_effect:{f:1150,d:.16,t:'triangle'},
  dungeon_step:{f:520,d:.04,t:'square'},
  dungeon_clear:{f:1300,d:.22,t:'sine'},
  synth_click:{f:660,d:.05,t:'triangle'},
  synth_success:{f:1200,d:.18,t:'sine'},
  quest_check:{f:580,d:.04,t:'sine'},
  quest_complete:{f:1350,d:.2,t:'triangle'},
  pet_feed:{f:700,d:.06,t:'triangle'},
  pet_bond:{f:1100,d:.15,t:'sine'},
  ai_scan:{f:620,d:.05,t:'square'},
  ai_predict:{f:1180,d:.18,t:'triangle'},
  dash_calc:{f:550,d:.06,t:'triangle'},
  dash_rank:{f:1400,d:.25,t:'sine'},
  v27_nav:{f:780,d:.05,t:'sine'},
  v27_quiz:{f:970,d:.08,t:'triangle'}
};

function sfxV27(type){
  _v27InitAudio();
  if(!_v27Ctx) return;
  var s = V27_SFX[type];
  if(!s) return;
  try{
    var muted = false;
    try{ muted = localStorage.getItem('hatcuping_mute') === '1'; }catch(e){}
    if(muted) return;
    var osc = _v27Ctx.createOscillator();
    var gain = _v27Ctx.createGain();
    osc.type = s.t || 'sine';
    osc.frequency.value = s.f;
    gain.gain.value = 0.08;
    osc.connect(gain);
    gain.connect(_v27Ctx.destination);
    osc.start();
    osc.stop(_v27Ctx.currentTime + (s.d || 0.06));
  }catch(e){}
}

function v27Load(key, fb){ try{ var d = JSON.parse(localStorage.getItem(key)); return d !== null ? d : fb; }catch(e){ return fb; } }
function v27Save(key, data){ try{ localStorage.setItem(key, JSON.stringify(data)); }catch(e){} }
function isDarkV27(){ return document.body.classList.contains('dark'); }
function showToastV27(msg){
  var t = document.getElementById('achieveToast');
  if(t){ t.innerHTML = msg; t.classList.add('show'); setTimeout(function(){ t.classList.remove('show'); }, 2500); }
}

function createV27Modal(title, contentHTML){
  var overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.6);z-index:9999;display:flex;justify-content:center;align-items:center;backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px)';
  var modal = document.createElement('div');
  var bg = isDarkV27() ? '#2a1a3e' : '#fff';
  var col = isDarkV27() ? '#eee' : '#333';
  modal.style.cssText = 'background:' + bg + ';color:' + col + ';border-radius:24px;padding:24px;max-width:700px;width:94%;max-height:85vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.25);position:relative';
  modal.innerHTML = '<button style="position:absolute;top:12px;right:16px;background:none;border:none;font-size:24px;cursor:pointer;color:' + col + '" onclick="this.closest(\'div[style]\').parentElement.remove()">&times;</button><h3 style="font-size:18px;margin-bottom:16px;color:#FF5FA2">' + title + '</h3>' + contentHTML;
  overlay.appendChild(modal);
  overlay.addEventListener('click', function(e){ if(e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
  return modal;
}


// ============================================================
// 1. CHARACTER EVOLUTION GENEALOGY TREE (Canvas 620x400)
// ============================================================
function renderEvolutionTree(){
  sfxV27('evo_select');
  var chars = [
    {name:'로미',stages:['씨앗','새싹','꽃봉오리','만개','전설'],color:'#FF5FA2',stats:[65,70,80,90,98]},
    {name:'하츄핑',stages:['알','유아','소년','전사','수호자'],color:'#FF88CC',stats:[60,68,78,88,96]},
    {name:'바로핑',stages:['돌멩이','바위','거석','산맥','대지신'],color:'#8B6914',stats:[70,75,82,92,97]},
    {name:'해핑',stages:['물방울','시내','강','바다','해신'],color:'#4488FF',stats:[55,65,76,87,95]},
    {name:'차핑',stages:['불씨','횃불','화염','용암','화신'],color:'#FF4444',stats:[72,78,85,93,99]},
    {name:'아자핑',stages:['미풍','돌풍','태풍','용오름','풍신'],color:'#44BB88',stats:[58,66,77,86,94]},
    {name:'라라핑',stages:['음표','멜로디','화음','교향곡','음악신'],color:'#AA66FF',stats:[50,62,74,85,93]},
    {name:'무지핑',stages:['프리즘','무지개','오로라','은하','빛의신'],color:'#FFD700',stats:[63,72,81,91,97]}
  ];
  var selected = v27Load('v27_evo_sel', 0);
  var html = '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px">';
  chars.forEach(function(c,i){
    html += '<button onclick="document.dispatchEvent(new CustomEvent(\'v27evoSel\',{detail:'+i+'}))" style="padding:4px 10px;border-radius:8px;border:2px solid '+(i===selected?c.color:'#ccc')+';background:'+(i===selected?c.color+'22':'transparent')+';font-size:11px;cursor:pointer;font-weight:'+(i===selected?'700':'400')+'">'+c.name+'</button>';
  });
  html += '</div><canvas id="v27EvoCanvas" width="620" height="400" style="width:100%;border-radius:12px;background:'+(isDarkV27()?'#1a1028':'#fef8ff')+'"></canvas>';
  var m = createV27Modal('🧬 캐릭터 진화 계보도', html);

  function draw(idx){
    var c = chars[idx];
    var cvs = document.getElementById('v27EvoCanvas');
    if(!cvs) return;
    var ctx = cvs.getContext('2d');
    var W = 620, H = 400;
    ctx.clearRect(0,0,W,H);
    var dark = isDarkV27();
    ctx.fillStyle = dark ? '#1a1028' : '#fef8ff';
    ctx.fillRect(0,0,W,H);

    ctx.font = 'bold 14px sans-serif';
    ctx.fillStyle = c.color;
    ctx.textAlign = 'center';
    ctx.fillText(c.name + ' 진화 계보', W/2, 30);

    var stageW = 90, stageH = 50, gap = 25;
    var startX = (W - (5 * stageW + 4 * gap)) / 2;
    var y = 70;

    c.stages.forEach(function(stage, si){
      var x = startX + si * (stageW + gap);
      var alpha = 0.3 + si * 0.175;
      ctx.fillStyle = c.color;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.roundRect(x, y, stageW, stageH, 12);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = c.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(x, y, stageW, stageH, 12);
      ctx.stroke();
      ctx.fillStyle = dark ? '#fff' : '#333';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(stage, x + stageW/2, y + 22);
      ctx.font = '10px sans-serif';
      ctx.fillStyle = c.color;
      ctx.fillText('Lv.' + (si*20+1) + '~' + ((si+1)*20), x + stageW/2, y + 40);

      if(si < 4){
        ctx.strokeStyle = c.color;
        ctx.lineWidth = 2;
        ctx.setLineDash([4,3]);
        ctx.beginPath();
        ctx.moveTo(x + stageW, y + stageH/2);
        ctx.lineTo(x + stageW + gap, y + stageH/2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = c.color;
        ctx.beginPath();
        ctx.moveTo(x + stageW + gap - 6, y + stageH/2 - 5);
        ctx.lineTo(x + stageW + gap, y + stageH/2);
        ctx.lineTo(x + stageW + gap - 6, y + stageH/2 + 5);
        ctx.fill();
      }
    });

    var barY = 160;
    ctx.font = 'bold 12px sans-serif';
    ctx.fillStyle = dark ? '#ddd' : '#555';
    ctx.textAlign = 'left';
    ctx.fillText('단계별 전투력 성장 곡선', 30, barY);
    barY += 15;

    var maxStat = 100;
    var chartW = W - 80, chartH = 140;
    var chartX = 50, chartY = barY;

    ctx.strokeStyle = dark ? '#444' : '#ddd';
    ctx.lineWidth = 1;
    for(var g = 0; g <= 4; g++){
      var gy = chartY + chartH - (g * chartH / 4);
      ctx.beginPath();
      ctx.moveTo(chartX, gy);
      ctx.lineTo(chartX + chartW, gy);
      ctx.stroke();
      ctx.fillStyle = dark ? '#888' : '#999';
      ctx.font = '9px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText((g * 25) + '', chartX - 5, gy + 3);
    }

    ctx.strokeStyle = c.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    c.stats.forEach(function(stat, si){
      var px = chartX + si * (chartW / 4);
      var py = chartY + chartH - (stat / maxStat * chartH);
      if(si === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();

    ctx.fillStyle = c.color;
    c.stats.forEach(function(stat, si){
      var px = chartX + si * (chartW / 4);
      var py = chartY + chartH - (stat / maxStat * chartH);
      ctx.beginPath();
      ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = dark ? '#fff' : '#333';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(stat, px, py - 10);
      ctx.fillStyle = c.color;
    });

    ctx.textAlign = 'center';
    ctx.font = '9px sans-serif';
    ctx.fillStyle = dark ? '#aaa' : '#777';
    c.stages.forEach(function(stage, si){
      var px = chartX + si * (chartW / 4);
      ctx.fillText(stage, px, chartY + chartH + 15);
    });

    var infoY = chartY + chartH + 40;
    ctx.font = 'bold 12px sans-serif';
    ctx.fillStyle = dark ? '#ddd' : '#555';
    ctx.textAlign = 'left';
    ctx.fillText('진화 요구 재료', 30, infoY);
    var materials = ['하트결정 x5','용기의불꽃 x3','지혜의물방울 x4','전설의조각 x2'];
    ctx.font = '10px sans-serif';
    materials.forEach(function(mat, mi){
      ctx.fillStyle = dark ? '#bbb' : '#666';
      ctx.fillText('Stage ' + (mi+1) + ' → ' + (mi+2) + ': ' + mat, 40, infoY + 18 + mi * 16);
    });

    var grade = c.stats[4] >= 97 ? 'S' : c.stats[4] >= 94 ? 'A' : c.stats[4] >= 90 ? 'B' : 'C';
    var gradeColor = grade === 'S' ? '#FFD700' : grade === 'A' ? '#FF5FA2' : grade === 'B' ? '#4488FF' : '#888';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillStyle = gradeColor;
    ctx.textAlign = 'right';
    ctx.fillText(grade, W - 30, infoY + 50);
    ctx.font = '10px sans-serif';
    ctx.fillText('최종 등급', W - 20, infoY + 65);
  }

  draw(selected);
  document.addEventListener('v27evoSel', function handler(e){
    sfxV27('evo_evolve');
    v27Save('v27_evo_sel', e.detail);
    draw(e.detail);
  });
}


// ============================================================
// 2. BATTLE ELEMENT TYPE CHART (Canvas 640x400)
// ============================================================
function renderTypeChart(){
  sfxV27('type_scan');
  var types = ['불','물','풀','번개','얼음','땅','바람','빛'];
  var colors = ['#FF4444','#4488FF','#44BB44','#FFCC00','#88DDFF','#8B6914','#44BB88','#FFD700'];
  // 1 = effective, 0 = normal, -1 = not effective
  var chart = [
    [ 0, -1, 1, 0, 1, 0, 0, 0],
    [ 1, 0, -1, -1, 0, 1, 0, 0],
    [-1, 1, 0, 0, -1, 1, 0, 0],
    [ 0, 1, 0, 0, 0, -1, 1, 0],
    [-1, 0, 1, 0, 0, 0, 1, -1],
    [ 0, -1, -1, 1, 0, 0, 0, 1],
    [ 0, 0, 0, -1, -1, 0, 0, 1],
    [ 0, 0, 0, 0, 1, -1, -1, 0]
  ];

  var html = '<canvas id="v27TypeCanvas" width="640" height="400" style="width:100%;border-radius:12px;background:'+(isDarkV27()?'#1a1028':'#fef8ff')+'"></canvas><p style="font-size:11px;margin-top:8px;color:#888">🔴 효과적(2x) | ⚪ 보통(1x) | 🔵 비효과적(0.5x) — 클릭하여 상세 확인</p>';
  var m = createV27Modal('⚡ 전투 속성 상성 차트', html);

  var cvs = document.getElementById('v27TypeCanvas');
  if(!cvs) return;
  var ctx = cvs.getContext('2d');
  var W = 640, H = 400;
  var dark = isDarkV27();

  ctx.fillStyle = dark ? '#1a1028' : '#fef8ff';
  ctx.fillRect(0,0,W,H);

  ctx.font = 'bold 14px sans-serif';
  ctx.fillStyle = '#FF5FA2';
  ctx.textAlign = 'center';
  ctx.fillText('속성 상성 매트릭스 (8x8)', W/2, 28);

  var cellW = 55, cellH = 36;
  var startX = 90, startY = 60;

  ctx.font = 'bold 10px sans-serif';
  ctx.fillStyle = dark ? '#aaa' : '#777';
  ctx.textAlign = 'center';
  ctx.fillText('공격 →', startX + (8 * cellW) / 2, 48);
  ctx.save();
  ctx.translate(15, startY + (8 * cellH) / 2);
  ctx.rotate(-Math.PI/2);
  ctx.fillText('방어 →', 0, 0);
  ctx.restore();

  types.forEach(function(t, i){
    ctx.fillStyle = colors[i];
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(t, startX + i * cellW + cellW/2, startY - 6);
    ctx.fillText(t, startX - 30, startY + i * cellH + cellH/2 + 4);
  });

  for(var r = 0; r < 8; r++){
    for(var c = 0; c < 8; c++){
      var x = startX + c * cellW;
      var y = startY + r * cellH;
      var val = chart[r][c];
      if(val === 1){
        ctx.fillStyle = dark ? '#442222' : '#FFE0E0';
      } else if(val === -1){
        ctx.fillStyle = dark ? '#222244' : '#E0E0FF';
      } else {
        ctx.fillStyle = dark ? '#2a2a3a' : '#F8F8FF';
      }
      ctx.fillRect(x, y, cellW, cellH);
      ctx.strokeStyle = dark ? '#444' : '#ddd';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, cellW, cellH);

      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      if(val === 1){
        ctx.fillStyle = '#FF4444';
        ctx.fillText('2x', x + cellW/2, y + cellH/2 + 5);
      } else if(val === -1){
        ctx.fillStyle = '#4488FF';
        ctx.fillText('0.5x', x + cellW/2, y + cellH/2 + 5);
      } else {
        ctx.fillStyle = dark ? '#666' : '#bbb';
        ctx.fillText('1x', x + cellW/2, y + cellH/2 + 5);
      }
    }
  }

  var summaryY = startY + 8 * cellH + 20;
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillStyle = dark ? '#ddd' : '#555';
  ctx.fillText('속성별 공격 효율 요약', 30, summaryY);
  summaryY += 5;

  types.forEach(function(t, i){
    var eff = 0, weak = 0;
    chart[i].forEach(function(v){ if(v===1) eff++; if(v===-1) weak++; });
    var bx = 30 + (i % 4) * 150;
    var by = summaryY + 12 + Math.floor(i / 4) * 20;
    ctx.fillStyle = colors[i];
    ctx.fillRect(bx, by - 8, 8, 8);
    ctx.fillStyle = dark ? '#ccc' : '#555';
    ctx.font = '10px sans-serif';
    ctx.fillText(t + ': 효과 ' + eff + '종 | 비효과 ' + weak + '종', bx + 12, by);
  });
}


// ============================================================
// 3. DUNGEON LAYER EXPLORATION MAP (Canvas 620x400)
// ============================================================
function renderDungeonMap(){
  sfxV27('dungeon_step');
  var floors = [
    {name:'숲의 입구',monsters:3,treasure:2,boss:false,diff:1},
    {name:'어둠의 동굴',monsters:5,treasure:3,boss:false,diff:2},
    {name:'크리스탈 광산',monsters:6,treasure:4,boss:false,diff:3},
    {name:'용암의 통로',monsters:7,treasure:3,boss:false,diff:4},
    {name:'얼음 미궁',monsters:8,treasure:5,boss:false,diff:5},
    {name:'바람의 탑',monsters:6,treasure:4,boss:true,diff:6},
    {name:'마법의 서재',monsters:9,treasure:6,boss:false,diff:7},
    {name:'그림자 성채',monsters:10,treasure:5,boss:false,diff:8},
    {name:'천공의 다리',monsters:8,treasure:7,boss:true,diff:9},
    {name:'최종 보스의 방',monsters:12,treasure:10,boss:true,diff:10}
  ];
  var progress = v27Load('v27_dungeon_progress', [1,1,0,0,0,0,0,0,0,0]);

  var html = '<canvas id="v27DungeonCanvas" width="620" height="400" style="width:100%;border-radius:12px;background:'+(isDarkV27()?'#1a1028':'#fef8ff')+'"></canvas>';
  html += '<div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap">';
  floors.forEach(function(f,i){
    html += '<button onclick="document.dispatchEvent(new CustomEvent(\'v27dungeonClick\',{detail:'+i+'}))" style="padding:3px 8px;border-radius:6px;border:1px solid '+(progress[i]?'#44BB44':'#ccc')+';background:'+(progress[i]?'#44BB4422':'transparent')+';font-size:9px;cursor:pointer">'+(i+1)+'F</button>';
  });
  html += '</div>';
  createV27Modal('🏰 던전 레이어 탐험 맵', html);

  function draw(){
    var cvs = document.getElementById('v27DungeonCanvas');
    if(!cvs) return;
    var ctx = cvs.getContext('2d');
    var W = 620, H = 400;
    var dark = isDarkV27();
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = dark ? '#1a1028' : '#fef8ff';
    ctx.fillRect(0,0,W,H);

    ctx.font = 'bold 14px sans-serif';
    ctx.fillStyle = '#FF5FA2';
    ctx.textAlign = 'center';
    ctx.fillText('던전 탐험 진행도 (10 레이어)', W/2, 28);

    var barX = 50, barW = W - 100, barH = 24;
    var cleared = progress.filter(function(p){ return p; }).length;
    var pct = cleared / 10;
    var barY = 42;
    ctx.fillStyle = dark ? '#333' : '#eee';
    ctx.beginPath(); ctx.roundRect(barX, barY, barW, barH, 12); ctx.fill();
    if(pct > 0){
      var grad = ctx.createLinearGradient(barX, 0, barX + barW * pct, 0);
      grad.addColorStop(0, '#FF5FA2');
      grad.addColorStop(1, '#FF88CC');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.roundRect(barX, barY, barW * pct, barH, 12); ctx.fill();
    }
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText(cleared + '/10 클리어 (' + Math.round(pct*100) + '%)', W/2, barY + 16);

    var floorH = 28, floorGap = 4;
    var startY = 80;
    floors.forEach(function(f, i){
      var y = startY + i * (floorH + floorGap);
      var x = 30;
      var w = W - 60;
      var done = progress[i];

      ctx.fillStyle = done ? (dark ? '#1a3322' : '#E8FFE8') : (dark ? '#2a2a3a' : '#F5F5FF');
      ctx.beginPath(); ctx.roundRect(x, y, w, floorH, 8); ctx.fill();
      ctx.strokeStyle = done ? '#44BB44' : (dark ? '#555' : '#ddd');
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.roundRect(x, y, w, floorH, 8); ctx.stroke();

      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillStyle = done ? '#44BB44' : (dark ? '#aaa' : '#888');
      ctx.fillText((i+1) + 'F ' + f.name, x + 10, y + 18);

      ctx.font = '9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = dark ? '#bbb' : '#777';
      ctx.fillText('몬스터 ' + f.monsters, x + w * 0.45, y + 18);
      ctx.fillText('보물 ' + f.treasure, x + w * 0.6, y + 18);

      if(f.boss){
        ctx.fillStyle = '#FF4444';
        ctx.font = 'bold 9px sans-serif';
        ctx.fillText('BOSS', x + w * 0.75, y + 18);
      }

      var diffBarX = x + w * 0.82, diffBarW = 60;
      ctx.fillStyle = dark ? '#333' : '#eee';
      ctx.fillRect(diffBarX, y + 8, diffBarW, 10);
      var diffPct = f.diff / 10;
      var diffGrad = ctx.createLinearGradient(diffBarX, 0, diffBarX + diffBarW, 0);
      diffGrad.addColorStop(0, '#44BB44');
      diffGrad.addColorStop(0.5, '#FFCC00');
      diffGrad.addColorStop(1, '#FF4444');
      ctx.fillStyle = diffGrad;
      ctx.fillRect(diffBarX, y + 8, diffBarW * diffPct, 10);
      ctx.fillStyle = dark ? '#fff' : '#333';
      ctx.font = '8px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('난이도 ' + f.diff, x + w - 8, y + 18);

      if(done){
        ctx.fillStyle = '#44BB44';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('✓', x + 28, y + 18);
      }
    });
  }

  draw();
  document.addEventListener('v27dungeonClick', function(e){
    var idx = e.detail;
    if(!progress[idx]){
      progress[idx] = 1;
      v27Save('v27_dungeon_progress', progress);
      sfxV27('dungeon_clear');
      showToastV27('🏰 ' + floors[idx].name + ' 클리어!');
    }
    draw();
  });
}


// ============================================================
// 4. ITEM SYNTHESIS RECIPE TREE (Canvas 640x400)
// ============================================================
function renderSynthTree(){
  sfxV27('synth_click');
  var recipes = [
    {name:'하트의 검',mat1:'강철 조각',mat2:'하트결정',result:'공격력+15',tier:1,color:'#FF5FA2'},
    {name:'바람의 망토',mat1:'실크 천',mat2:'바람의 깃털',result:'속도+12',tier:1,color:'#44BB88'},
    {name:'물의 반지',mat1:'은 반지',mat2:'물의 구슬',result:'마법력+10',tier:1,color:'#4488FF'},
    {name:'불꽃의 갑옷',mat1:'용비늘',mat2:'용암 핵',result:'방어력+18',tier:2,color:'#FF4444'},
    {name:'번개의 부적',mat1:'금빛 조각',mat2:'번개의 정수',result:'크리티컬+8%',tier:2,color:'#FFCC00'},
    {name:'얼음의 왕관',mat1:'미스릴',mat2:'얼음 꽃',result:'HP+200',tier:2,color:'#88DDFF'},
    {name:'대지의 방패',mat1:'고대 원석',mat2:'대지의 심장',result:'방어력+25',tier:3,color:'#8B6914'},
    {name:'빛의 지팡이',mat1:'세계수 가지',mat2:'빛의 파편',result:'마법력+30',tier:3,color:'#FFD700'},
    {name:'전설의 검',mat1:'하트의 검',mat2:'빛의 파편',result:'공격력+40',tier:4,color:'#FF1493'},
    {name:'수호자의 갑옷',mat1:'불꽃의 갑옷',mat2:'대지의 심장',result:'전능력+20',tier:4,color:'#9400D3'}
  ];

  var html = '<canvas id="v27SynthCanvas" width="640" height="400" style="width:100%;border-radius:12px;background:'+(isDarkV27()?'#1a1028':'#fef8ff')+'"></canvas>';
  createV27Modal('🔨 아이템 합성 레시피 트리', html);

  var cvs = document.getElementById('v27SynthCanvas');
  if(!cvs) return;
  var ctx = cvs.getContext('2d');
  var W = 640, H = 400;
  var dark = isDarkV27();

  ctx.fillStyle = dark ? '#1a1028' : '#fef8ff';
  ctx.fillRect(0,0,W,H);

  ctx.font = 'bold 14px sans-serif';
  ctx.fillStyle = '#FF5FA2';
  ctx.textAlign = 'center';
  ctx.fillText('아이템 합성 레시피 (10종, 4티어)', W/2, 28);

  var tierLabels = ['Tier 1 (기본)', 'Tier 2 (고급)', 'Tier 3 (희귀)', 'Tier 4 (전설)'];
  var tierColors = ['#44BB44', '#4488FF', '#AA66FF', '#FFD700'];
  var tierY = [55, 150, 245, 335];

  tierLabels.forEach(function(label, ti){
    ctx.fillStyle = tierColors[ti];
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(label, 15, tierY[ti]);
  });

  recipes.forEach(function(r, ri){
    var tierItems = recipes.filter(function(rr){ return rr.tier === r.tier; });
    var idxInTier = tierItems.indexOf(r);
    var count = tierItems.length;
    var boxW = 140, boxH = 65;
    var spacing = (W - 40) / count;
    var x = 20 + idxInTier * spacing + (spacing - boxW) / 2;
    var y = tierY[r.tier - 1] + 10;

    ctx.fillStyle = r.color + '22';
    ctx.beginPath(); ctx.roundRect(x, y, boxW, boxH, 10); ctx.fill();
    ctx.strokeStyle = r.color;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.roundRect(x, y, boxW, boxH, 10); ctx.stroke();

    ctx.fillStyle = r.color;
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(r.name, x + boxW/2, y + 14);

    ctx.fillStyle = dark ? '#bbb' : '#777';
    ctx.font = '8px sans-serif';
    ctx.fillText(r.mat1 + ' + ' + r.mat2, x + boxW/2, y + 30);

    ctx.fillStyle = '#44BB44';
    ctx.font = 'bold 9px sans-serif';
    ctx.fillText('→ ' + r.result, x + boxW/2, y + 46);

    var stars = '';
    for(var s = 0; s < r.tier; s++) stars += '★';
    ctx.fillStyle = '#FFD700';
    ctx.font = '9px sans-serif';
    ctx.fillText(stars, x + boxW/2, y + 60);
  });

  for(var ti = 0; ti < 3; ti++){
    var upper = recipes.filter(function(r){ return r.tier === ti + 1; });
    var lower = recipes.filter(function(r){ return r.tier === ti + 2; });
    if(upper.length && lower.length){
      ctx.strokeStyle = dark ? '#555' : '#ccc';
      ctx.lineWidth = 1;
      ctx.setLineDash([3,3]);
      var uy = tierY[ti] + 75;
      var ly = tierY[ti + 1] + 10;
      var midY = (uy + ly) / 2;
      ctx.beginPath();
      ctx.moveTo(W/2, uy);
      ctx.lineTo(W/2, ly);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
}


// ============================================================
// 5. DAILY QUEST REWARD TRACKER (Canvas 620x400)
// ============================================================
function renderDailyQuest(){
  sfxV27('quest_check');
  var quests = [
    {name:'몬스터 10마리 처치',xp:50,gold:100,icon:'⚔️'},
    {name:'보물상자 3개 열기',xp:30,gold:80,icon:'📦'},
    {name:'NPC와 대화 5회',xp:20,gold:50,icon:'💬'},
    {name:'아이템 합성 2회',xp:40,gold:120,icon:'🔨'},
    {name:'던전 1층 클리어',xp:60,gold:150,icon:'🏰'},
    {name:'퀴즈 5문제 풀기',xp:35,gold:70,icon:'❓'},
    {name:'콤보 10회 달성',xp:45,gold:90,icon:'🔥'}
  ];
  var days = ['월','화','수','목','금','토','일'];
  var completed = v27Load('v27_daily_completed', [[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0]]);

  var html = '<canvas id="v27QuestCanvas" width="620" height="400" style="width:100%;border-radius:12px;background:'+(isDarkV27()?'#1a1028':'#fef8ff')+'"></canvas>';
  html += '<div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap">';
  for(var qi = 0; qi < 7; qi++){
    html += '<button onclick="document.dispatchEvent(new CustomEvent(\'v27questToggle\',{detail:{q:'+qi+',d:'+(new Date().getDay()||7)-1+'}}))" style="padding:3px 8px;border-radius:6px;border:1px solid #FF5FA2;font-size:9px;cursor:pointer">'+quests[qi].icon+' 완료</button>';
  }
  html += '</div>';
  createV27Modal('📋 일일 퀘스트 보상 추적기', html);

  function draw(){
    var cvs = document.getElementById('v27QuestCanvas');
    if(!cvs) return;
    var ctx = cvs.getContext('2d');
    var W = 620, H = 400;
    var dark = isDarkV27();
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = dark ? '#1a1028' : '#fef8ff';
    ctx.fillRect(0,0,W,H);

    ctx.font = 'bold 14px sans-serif';
    ctx.fillStyle = '#FF5FA2';
    ctx.textAlign = 'center';
    ctx.fillText('일일 퀘스트 주간 진행 현황', W/2, 28);

    var cellW = 68, cellH = 40;
    var startX = 95, startY = 60;

    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    days.forEach(function(d, di){
      ctx.fillStyle = di >= 5 ? '#FF5FA2' : (dark ? '#aaa' : '#777');
      ctx.fillText(d, startX + di * cellW + cellW/2, startY - 6);
    });

    quests.forEach(function(q, qi){
      ctx.fillStyle = dark ? '#bbb' : '#555';
      ctx.font = '9px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(q.icon + ' ' + q.name.substring(0, 8), startX - 5, startY + qi * cellH + cellH/2 + 3);

      days.forEach(function(d, di){
        var x = startX + di * cellW;
        var y = startY + qi * cellH;
        var done = completed[qi] && completed[qi][di];

        ctx.fillStyle = done ? (dark ? '#1a3322' : '#E8FFE8') : (dark ? '#2a2a3a' : '#F8F8FF');
        ctx.fillRect(x + 1, y + 1, cellW - 2, cellH - 2);
        ctx.strokeStyle = done ? '#44BB44' : (dark ? '#444' : '#eee');
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 1, y + 1, cellW - 2, cellH - 2);

        if(done){
          ctx.fillStyle = '#44BB44';
          ctx.font = 'bold 16px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('✓', x + cellW/2, y + cellH/2 + 6);
        }
      });
    });

    var summaryY = startY + 7 * cellH + 15;
    ctx.font = 'bold 11px sans-serif';
    ctx.fillStyle = dark ? '#ddd' : '#555';
    ctx.textAlign = 'left';
    ctx.fillText('일별 완료율', 30, summaryY);

    days.forEach(function(d, di){
      var done = 0;
      completed.forEach(function(row){ if(row[di]) done++; });
      var pct = done / 7;
      var x = startX + di * cellW;
      var barW = cellW - 10;
      var barH = 16;
      ctx.fillStyle = dark ? '#333' : '#eee';
      ctx.fillRect(x + 5, summaryY + 8, barW, barH);
      if(pct > 0){
        ctx.fillStyle = pct >= 0.7 ? '#44BB44' : pct >= 0.4 ? '#FFCC00' : '#FF5FA2';
        ctx.fillRect(x + 5, summaryY + 8, barW * pct, barH);
      }
      ctx.fillStyle = dark ? '#fff' : '#333';
      ctx.font = '8px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(Math.round(pct*100) + '%', x + cellW/2, summaryY + 20);
    });
  }

  draw();
  document.addEventListener('v27questToggle', function(e){
    var q = e.detail.q, d = e.detail.d;
    if(q >= 0 && q < 7 && d >= 0 && d < 7){
      completed[q][d] = completed[q][d] ? 0 : 1;
      v27Save('v27_daily_completed', completed);
      sfxV27('quest_complete');
      draw();
    }
  });
}


// ============================================================
// 6. PET COMPANION AFFINITY ANALYZER (Canvas 600x380)
// ============================================================
function renderPetAffinity(){
  sfxV27('pet_feed');
  var pets = [
    {name:'핑크냥이',type:'고양이',stats:[85,70,90,65,80,75],color:'#FF5FA2'},
    {name:'하늘토끼',type:'토끼',stats:[70,85,75,80,70,90],color:'#88BBFF'},
    {name:'숲의다람쥐',type:'다람쥐',stats:[75,80,65,90,75,70],color:'#8B6914'},
    {name:'별빛여우',type:'여우',stats:[90,65,80,75,85,80],color:'#FFD700'},
    {name:'구름강아지',type:'강아지',stats:[80,90,70,70,65,85],color:'#AADDFF'},
    {name:'무지개새',type:'새',stats:[65,75,85,85,90,65],color:'#AA66FF'},
    {name:'바다거북이',type:'거북이',stats:[70,80,80,60,75,95],color:'#44BB88'},
    {name:'불꽃도마뱀',type:'도마뱀',stats:[95,60,75,80,70,70],color:'#FF4444'}
  ];
  var axes = ['공격력','방어력','속도','지능','충성도','회복력'];
  var selected = v27Load('v27_pet_sel', 0);

  var html = '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px">';
  pets.forEach(function(p,i){
    html += '<button onclick="document.dispatchEvent(new CustomEvent(\'v27petSel\',{detail:'+i+'}))" style="padding:4px 10px;border-radius:8px;border:2px solid '+(i===selected?p.color:'#ccc')+';background:'+(i===selected?p.color+'22':'transparent')+';font-size:11px;cursor:pointer;font-weight:'+(i===selected?'700':'400')+'">'+p.name+'</button>';
  });
  html += '</div><canvas id="v27PetCanvas" width="600" height="380" style="width:100%;border-radius:12px;background:'+(isDarkV27()?'#1a1028':'#fef8ff')+'"></canvas>';
  createV27Modal('🐾 동료 펫 친밀도 분석기', html);

  function draw(idx){
    var pet = pets[idx];
    var cvs = document.getElementById('v27PetCanvas');
    if(!cvs) return;
    var ctx = cvs.getContext('2d');
    var W = 600, H = 380;
    var dark = isDarkV27();
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = dark ? '#1a1028' : '#fef8ff';
    ctx.fillRect(0,0,W,H);

    ctx.font = 'bold 14px sans-serif';
    ctx.fillStyle = pet.color;
    ctx.textAlign = 'center';
    ctx.fillText(pet.name + ' (' + pet.type + ') 능력 분석', W/2, 28);

    var cx = W * 0.35, cy = 200, R = 110;
    var n = 6;

    for(var ring = 4; ring >= 1; ring--){
      var rr = R * ring / 4;
      ctx.strokeStyle = dark ? '#444' : '#ddd';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for(var a = 0; a < n; a++){
        var angle = (Math.PI * 2 * a / n) - Math.PI / 2;
        var px = cx + rr * Math.cos(angle);
        var py = cy + rr * Math.sin(angle);
        if(a === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
    }

    for(var a = 0; a < n; a++){
      var angle = (Math.PI * 2 * a / n) - Math.PI / 2;
      ctx.strokeStyle = dark ? '#444' : '#ddd';
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + R * Math.cos(angle), cy + R * Math.sin(angle));
      ctx.stroke();

      var lx = cx + (R + 20) * Math.cos(angle);
      var ly = cy + (R + 20) * Math.sin(angle);
      ctx.fillStyle = dark ? '#bbb' : '#666';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(axes[a], lx, ly + 4);
    }

    ctx.fillStyle = pet.color + '33';
    ctx.strokeStyle = pet.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    pet.stats.forEach(function(stat, si){
      var angle = (Math.PI * 2 * si / n) - Math.PI / 2;
      var sr = R * stat / 100;
      var px = cx + sr * Math.cos(angle);
      var py = cy + sr * Math.sin(angle);
      if(si === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = pet.color;
    pet.stats.forEach(function(stat, si){
      var angle = (Math.PI * 2 * si / n) - Math.PI / 2;
      var sr = R * stat / 100;
      var px = cx + sr * Math.cos(angle);
      var py = cy + sr * Math.sin(angle);
      ctx.beginPath();
      ctx.arc(px, py, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    var barX = W * 0.62, barY = 55, barW = 160, barH = 14;
    ctx.font = 'bold 11px sans-serif';
    ctx.fillStyle = dark ? '#ddd' : '#555';
    ctx.textAlign = 'left';
    ctx.fillText('능력치 상세', barX, barY - 5);

    axes.forEach(function(axis, ai){
      var y = barY + 10 + ai * 30;
      ctx.fillStyle = dark ? '#bbb' : '#777';
      ctx.font = '9px sans-serif';
      ctx.fillText(axis, barX, y);

      ctx.fillStyle = dark ? '#333' : '#eee';
      ctx.fillRect(barX, y + 4, barW, barH);
      var pct = pet.stats[ai] / 100;
      ctx.fillStyle = pet.color;
      ctx.fillRect(barX, y + 4, barW * pct, barH);

      ctx.fillStyle = dark ? '#fff' : '#333';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(pet.stats[ai], barX + barW + 20, y + 15);
      ctx.textAlign = 'left';
    });

    var avg = Math.round(pet.stats.reduce(function(a,b){return a+b;},0) / 6);
    var grade = avg >= 85 ? 'S' : avg >= 78 ? 'A' : avg >= 70 ? 'B' : 'C';
    var gradeColor = grade === 'S' ? '#FFD700' : grade === 'A' ? '#FF5FA2' : grade === 'B' ? '#4488FF' : '#888';

    ctx.font = 'bold 24px sans-serif';
    ctx.fillStyle = gradeColor;
    ctx.textAlign = 'center';
    ctx.fillText(grade, barX + barW/2, barY + 245);
    ctx.font = '10px sans-serif';
    ctx.fillText('종합 등급 (평균 ' + avg + ')', barX + barW/2, barY + 262);

    ctx.fillStyle = dark ? '#aaa' : '#888';
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'left';
    var bestStat = Math.max.apply(null, pet.stats);
    var bestIdx = pet.stats.indexOf(bestStat);
    ctx.fillText('최강 능력: ' + axes[bestIdx] + ' (' + bestStat + ')', 30, H - 25);
    var weakStat = Math.min.apply(null, pet.stats);
    var weakIdx = pet.stats.indexOf(weakStat);
    ctx.fillText('약점 능력: ' + axes[weakIdx] + ' (' + weakStat + ')', 30, H - 10);
  }

  draw(selected);
  document.addEventListener('v27petSel', function(e){
    sfxV27('pet_bond');
    v27Save('v27_pet_sel', e.detail);
    draw(e.detail);
  });
}


// ============================================================
// 7. BATTLE AI PATTERN LEARNING (Canvas 620x400)
// ============================================================
function renderAIPattern(){
  sfxV27('ai_scan');
  var bosses = [
    {name:'그림자왕',patterns:['돌진','회전참격','어둠파동','순간이동','암흑포효','독안개','그림자분신','기습'],freq:[8,6,5,7,4,3,6,5]},
    {name:'불꽃마왕',patterns:['화염브레스','용암폭발','파이어볼','열폭풍','마그마벽','화산분출','자폭공격','불의비'],freq:[7,5,8,4,6,3,5,6]},
    {name:'얼음여왕',patterns:['블리자드','얼음창','냉기파동','빙결진','서리폭풍','빙하충돌','극한냉기','눈보라'],freq:[6,8,5,4,7,3,6,5]},
    {name:'번개장군',patterns:['낙뢰','전격파','체인라이트닝','전자기장','뇌광','전기충격','플라즈마','썬더볼트'],freq:[5,7,6,8,4,5,3,6]},
    {name:'대지거신',patterns:['지진','암석폭포','대지분쇄','모래폭풍','석화','균열','산사태','거석투척'],freq:[8,6,7,4,5,3,6,5]},
    {name:'바람군주',patterns:['폭풍','진공칼날','토네이도','급강하','기류조종','음속참격','바람방벽','사이클론'],freq:[6,7,5,8,4,6,3,5]}
  ];
  var selected = v27Load('v27_ai_sel', 0);

  var html = '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px">';
  bosses.forEach(function(b,i){
    html += '<button onclick="document.dispatchEvent(new CustomEvent(\'v27aiSel\',{detail:'+i+'}))" style="padding:4px 10px;border-radius:8px;border:2px solid '+(i===selected?'#FF5FA2':'#ccc')+';background:'+(i===selected?'#FF5FA222':'transparent')+';font-size:11px;cursor:pointer;font-weight:'+(i===selected?'700':'400')+'">'+b.name+'</button>';
  });
  html += '</div><canvas id="v27AICanvas" width="620" height="400" style="width:100%;border-radius:12px;background:'+(isDarkV27()?'#1a1028':'#fef8ff')+'"></canvas>';
  createV27Modal('🤖 전투 AI 패턴 러닝', html);

  function draw(idx){
    var boss = bosses[idx];
    var cvs = document.getElementById('v27AICanvas');
    if(!cvs) return;
    var ctx = cvs.getContext('2d');
    var W = 620, H = 400;
    var dark = isDarkV27();
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = dark ? '#1a1028' : '#fef8ff';
    ctx.fillRect(0,0,W,H);

    ctx.font = 'bold 14px sans-serif';
    ctx.fillStyle = '#FF5FA2';
    ctx.textAlign = 'center';
    ctx.fillText(boss.name + ' 공격 패턴 분석', W/2, 28);

    var barX = 140, barY = 50, barW = 360, barH = 26, gap = 6;
    var maxFreq = Math.max.apply(null, boss.freq);
    var patColors = ['#FF5FA2','#FF4444','#4488FF','#FFCC00','#44BB44','#AA66FF','#FF8844','#88DDFF'];

    boss.patterns.forEach(function(pat, pi){
      var y = barY + pi * (barH + gap);
      ctx.fillStyle = dark ? '#bbb' : '#555';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(pat, barX - 10, y + barH/2 + 4);

      ctx.fillStyle = dark ? '#333' : '#eee';
      ctx.beginPath(); ctx.roundRect(barX, y, barW, barH, 6); ctx.fill();

      var pct = boss.freq[pi] / maxFreq;
      var grad = ctx.createLinearGradient(barX, 0, barX + barW * pct, 0);
      grad.addColorStop(0, patColors[pi]);
      grad.addColorStop(1, patColors[pi] + '88');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.roundRect(barX, y, barW * pct, barH, 6); ctx.fill();

      ctx.fillStyle = dark ? '#fff' : '#333';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(boss.freq[pi] + '회/전투', barX + barW * pct + 8, y + barH/2 + 4);
    });

    var timeY = barY + 8 * (barH + gap) + 15;
    ctx.font = 'bold 12px sans-serif';
    ctx.fillStyle = dark ? '#ddd' : '#555';
    ctx.textAlign = 'left';
    ctx.fillText('패턴 타임라인 (최근 전투 시뮬레이션)', 30, timeY);
    timeY += 15;

    var timeline = [];
    for(var t = 0; t < 16; t++){
      var totalFreq = boss.freq.reduce(function(a,b){return a+b;},0);
      var r = (t * 7 + 3) % totalFreq;
      var cumul = 0;
      for(var p = 0; p < boss.freq.length; p++){
        cumul += boss.freq[p];
        if(r < cumul){ timeline.push(p); break; }
      }
    }

    var tW = 32, tH = 24;
    timeline.forEach(function(pi, ti){
      var x = 30 + ti * (tW + 4);
      var y = timeY;
      ctx.fillStyle = patColors[pi] + '44';
      ctx.fillRect(x, y, tW, tH);
      ctx.strokeStyle = patColors[pi];
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, tW, tH);
      ctx.fillStyle = patColors[pi];
      ctx.font = '7px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(boss.patterns[pi].substring(0,3), x + tW/2, y + tH/2 + 3);
    });

    ctx.font = '8px sans-serif';
    ctx.fillStyle = dark ? '#888' : '#aaa';
    ctx.textAlign = 'center';
    timeline.forEach(function(pi, ti){
      ctx.fillText((ti+1)+'턴', 30 + ti * (tW + 4) + tW/2, timeY + tH + 12);
    });

    var mostUsed = boss.freq.indexOf(maxFreq);
    ctx.fillStyle = '#FF5FA2';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('최다 사용: ' + boss.patterns[mostUsed] + ' (' + maxFreq + '회)', W - 20, H - 10);
  }

  draw(selected);
  document.addEventListener('v27aiSel', function(e){
    sfxV27('ai_predict');
    v27Save('v27_ai_sel', e.detail);
    draw(e.detail);
  });
}


// ============================================================
// 8. ADVENTURE STATS DASHBOARD (Canvas 620x400)
// ============================================================
function renderAdventureDashboard(){
  sfxV27('dash_calc');
  var kpis = [
    {name:'총 전투 횟수',value:847,max:1000,unit:'회',color:'#FF5FA2'},
    {name:'클리어 스테이지',value:42,max:50,unit:'개',color:'#4488FF'},
    {name:'수집 아이템',value:186,max:250,unit:'종',color:'#44BB44'},
    {name:'퀴즈 정답률',value:78,max:100,unit:'%',color:'#FFCC00'},
    {name:'업적 달성률',value:65,max:100,unit:'%',color:'#AA66FF'},
    {name:'동료 친밀도',value:72,max:100,unit:'%',color:'#FF8844'},
    {name:'던전 진행률',value:40,max:100,unit:'%',color:'#88DDFF'},
    {name:'종합 모험 점수',value:82,max:100,unit:'점',color:'#FFD700'}
  ];

  var html = '<canvas id="v27DashCanvas" width="620" height="400" style="width:100%;border-radius:12px;background:'+(isDarkV27()?'#1a1028':'#fef8ff')+'"></canvas>';
  createV27Modal('📊 종합 모험 통계 대시보드', html);

  var cvs = document.getElementById('v27DashCanvas');
  if(!cvs) return;
  var ctx = cvs.getContext('2d');
  var W = 620, H = 400;
  var dark = isDarkV27();

  ctx.fillStyle = dark ? '#1a1028' : '#fef8ff';
  ctx.fillRect(0,0,W,H);

  ctx.font = 'bold 14px sans-serif';
  ctx.fillStyle = '#FF5FA2';
  ctx.textAlign = 'center';
  ctx.fillText('종합 모험 통계 대시보드', W/2, 28);

  var cols = 4, rows = 2;
  var gaugeCX = 68, gaugeCY = 60;
  var gaugeR = 45;
  var cellW = W / cols, cellH = 170;

  kpis.forEach(function(kpi, ki){
    var col = ki % cols;
    var row = Math.floor(ki / cols);
    var cx = col * cellW + cellW / 2;
    var cy = 50 + row * cellH + gaugeCY;

    ctx.strokeStyle = dark ? '#333' : '#eee';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.arc(cx, cy, gaugeR, Math.PI, 2 * Math.PI);
    ctx.stroke();

    var pct = kpi.value / kpi.max;
    var endAngle = Math.PI + pct * Math.PI;
    ctx.strokeStyle = kpi.color;
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(cx, cy, gaugeR, Math.PI, endAngle);
    ctx.stroke();
    ctx.lineCap = 'butt';

    ctx.fillStyle = dark ? '#fff' : '#333';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(kpi.value + '', cx, cy + 5);

    ctx.fillStyle = dark ? '#aaa' : '#888';
    ctx.font = '9px sans-serif';
    ctx.fillText('/ ' + kpi.max + kpi.unit, cx, cy + 18);

    ctx.fillStyle = kpi.color;
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText(kpi.name, cx, cy + gaugeR + 18);

    var grade = pct >= 0.85 ? 'S' : pct >= 0.7 ? 'A' : pct >= 0.5 ? 'B' : 'C';
    var gradeColor = grade === 'S' ? '#FFD700' : grade === 'A' ? '#FF5FA2' : grade === 'B' ? '#4488FF' : '#888';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillStyle = gradeColor;
    ctx.fillText(grade, cx, cy + gaugeR + 32);
  });

  var totalPct = kpis.reduce(function(sum, k){ return sum + k.value / k.max; }, 0) / kpis.length;
  var totalGrade = totalPct >= 0.85 ? 'S' : totalPct >= 0.7 ? 'A' : totalPct >= 0.5 ? 'B' : 'C';
  var totalGradeColor = totalGrade === 'S' ? '#FFD700' : totalGrade === 'A' ? '#FF5FA2' : totalGrade === 'B' ? '#4488FF' : '#888';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillStyle = totalGradeColor;
  ctx.textAlign = 'center';
  ctx.fillText('종합 등급: ' + totalGrade + ' (' + Math.round(totalPct * 100) + '%)', W/2, H - 12);
}


// ============================================================
// QUIZ v27 - 15 NEW QUESTIONS (270 -> 285)
// ============================================================
function renderV27Quiz(){
  sfxV27('v27_quiz');
  var questions = [
    {q:'캐릭터 진화에서 로미의 최종 단계는?',a:['만개','전설','수호자','빛의신'],c:0},
    {q:'불 속성이 효과적인(2x) 상대 속성은?',a:['물','풀','번개','빛'],c:1},
    {q:'던전 10층의 이름은?',a:['천공의 다리','최종 보스의 방','그림자 성채','마법의 서재'],c:1},
    {q:'아이템 합성에서 &quot;전설의 검&quot;의 재료는?',a:['하트의 검+빛의 파편','강철+하트결정','용비늘+용암핵','금빛조각+번개정수'],c:0},
    {q:'일일 퀘스트에서 던전 클리어 보상 XP는?',a:['40','50','60','35'],c:2},
    {q:'펫 &quot;별빛여우&quot;의 최강 능력은?',a:['속도','공격력','충성도','방어력'],c:1},
    {q:'그림자왕의 가장 많이 사용하는 패턴은?',a:['돌진','순간이동','회전참격','그림자분신'],c:0},
    {q:'종합 모험 대시보드의 KPI 개수는?',a:['6개','7개','8개','10개'],c:2},
    {q:'바로핑의 진화 2단계 이름은?',a:['돌멩이','바위','거석','산맥'],c:1},
    {q:'얼음 속성은 어떤 속성에 비효과적(0.5x)인가?',a:['풀','불','빛','바람'],c:1},
    {q:'Tier 3 합성 아이템은 몇 종인가?',a:['1종','2종','3종','4종'],c:1},
    {q:'던전에서 보스가 등장하는 층은?',a:['3,5,8층','6,9,10층','5,7,10층','4,8,10층'],c:1},
    {q:'펫 &quot;바다거북이&quot;의 최강 능력은?',a:['방어력','회복력','지능','공격력'],c:1},
    {q:'하츄핑의 진화 최종 단계는?',a:['전사','수호자','대지신','빛의신'],c:1},
    {q:'번개장군의 가장 많이 사용하는 패턴은?',a:['낙뢰','전자기장','전격파','체인라이트닝'],c:1}
  ];
  var score = v27Load('v27_quiz_score', 0);
  var answered = v27Load('v27_quiz_answered', []);
  var currentQ = 0;

  function buildQuizHTML(){
    var h = '<div id="v27QuizArea">';
    h += '<p style="font-size:12px;margin-bottom:12px">v27 퀴즈 (15문) | 현재 점수: <strong>' + score + '/' + answered.length + '</strong></p>';
    var q = questions[currentQ];
    h += '<p style="font-size:13px;font-weight:700;margin-bottom:10px">Q' + (currentQ + 1) + '. ' + q.q + '</p>';
    q.a.forEach(function(ans, ai){
      var disabled = answered.indexOf(currentQ) >= 0;
      h += '<button onclick="document.dispatchEvent(new CustomEvent(\'v27quizAns\',{detail:{q:'+currentQ+',a:'+ai+'}}))" style="display:block;width:100%;padding:8px;margin:4px 0;border:1px solid #FF5FA2;border-radius:8px;background:transparent;cursor:pointer;text-align:left;font-size:12px"' + (disabled ? ' disabled' : '') + '>' + String.fromCharCode(9312 + ai) + ' ' + ans + '</button>';
    });
    h += '<div style="display:flex;gap:6px;margin-top:12px">';
    h += '<button onclick="document.dispatchEvent(new CustomEvent(\'v27quizNav\',{detail:-1}))" style="padding:4px 12px;border:1px solid #ccc;border-radius:6px;background:transparent;cursor:pointer;font-size:11px"' + (currentQ === 0 ? ' disabled' : '') + '>◀ 이전</button>';
    h += '<button onclick="document.dispatchEvent(new CustomEvent(\'v27quizNav\',{detail:1}))" style="padding:4px 12px;border:1px solid #ccc;border-radius:6px;background:transparent;cursor:pointer;font-size:11px"' + (currentQ === 14 ? ' disabled' : '') + '>다음 ▶</button>';
    h += '</div></div>';
    return h;
  }

  var m = createV27Modal('❓ 퀴즈 v27 (270→285)', buildQuizHTML());

  document.addEventListener('v27quizAns', function(e){
    var qi = e.detail.q, ai = e.detail.a;
    if(answered.indexOf(qi) >= 0) return;
    answered.push(qi);
    if(ai === questions[qi].c){
      score++;
      showToastV27('✅ 정답! (+1)');
    } else {
      showToastV27('❌ 오답! 정답: ' + questions[qi].a[questions[qi].c]);
    }
    v27Save('v27_quiz_score', score);
    v27Save('v27_quiz_answered', answered);
    var area = document.getElementById('v27QuizArea');
    if(area) area.outerHTML = buildQuizHTML();
  });

  document.addEventListener('v27quizNav', function(e){
    currentQ = Math.max(0, Math.min(14, currentQ + e.detail));
    var area = document.getElementById('v27QuizArea');
    if(area) area.outerHTML = buildQuizHTML();
  });
}


// ============================================================
// ACHIEVEMENTS v27 - 12 NEW (250 -> 262)
// ============================================================
var V27_ACHIEVEMENTS = [
  {id:'v27_evo_viewer',name:'진화의 관찰자',desc:'캐릭터 진화 계보도 확인',check:function(){return v27Load('v27_evo_sel',null)!==null;}},
  {id:'v27_type_master',name:'속성 마스터',desc:'속성 상성 차트 분석',check:function(){return true;}},
  {id:'v27_dungeon_3',name:'던전 탐험가',desc:'던전 3층 클리어',check:function(){var p=v27Load('v27_dungeon_progress',[]);var c=0;p.forEach(function(v){if(v)c++;});return c>=3;}},
  {id:'v27_dungeon_10',name:'던전 정복자',desc:'던전 10층 전부 클리어',check:function(){var p=v27Load('v27_dungeon_progress',[]);var c=0;p.forEach(function(v){if(v)c++;});return c>=10;}},
  {id:'v27_synth_viewer',name:'연금술사 견습생',desc:'아이템 합성 트리 확인',check:function(){return true;}},
  {id:'v27_quest_3',name:'퀘스트 도전자',desc:'일일 퀘스트 3개 완료',check:function(){var c=v27Load('v27_daily_completed',[]);var t=0;c.forEach(function(row){row.forEach(function(v){if(v)t++;});});return t>=3;}},
  {id:'v27_quest_full',name:'퀘스트 완벽주의자',desc:'일일 퀘스트 전체 완료',check:function(){var c=v27Load('v27_daily_completed',[]);var t=0;c.forEach(function(row){row.forEach(function(v){if(v)t++;});});return t>=49;}},
  {id:'v27_pet_viewer',name:'동물 애호가',desc:'펫 친밀도 분석기 사용',check:function(){return v27Load('v27_pet_sel',null)!==null;}},
  {id:'v27_ai_student',name:'AI 분석가',desc:'보스 AI 패턴 분석',check:function(){return v27Load('v27_ai_sel',null)!==null;}},
  {id:'v27_dashboard',name:'통계의 달인',desc:'종합 모험 대시보드 확인',check:function(){return true;}},
  {id:'v27_quiz_5',name:'퀴즈 도전자 v27',desc:'v27 퀴즈 5문제 정답',check:function(){return v27Load('v27_quiz_score',0)>=5;}},
  {id:'v27_quiz_all',name:'퀴즈 마스터 v27',desc:'v27 퀴즈 전문제 정답',check:function(){return v27Load('v27_quiz_score',0)>=15;}}
];

function checkV27Achievements(){
  V27_ACHIEVEMENTS.forEach(function(ach){
    var unlocked = v27Load('ach_' + ach.id, false);
    if(!unlocked && ach.check()){
      v27Save('ach_' + ach.id, true);
      showToastV27('🏆 업적 달성: ' + ach.name);
      sfxV27('dash_rank');
    }
  });
}

setInterval(checkV27Achievements, 5000);


// ============================================================
// NAV BUTTONS - Append to existing bottom bar (UI rule compliant)
// ============================================================
function addV27NavButtons(){
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
    {label:'🧬 진화계보',fn:renderEvolutionTree,key:'Shift+Q'},
    {label:'⚡ 속성상성',fn:renderTypeChart,key:'Shift+W'},
    {label:'🏰 던전탐험',fn:renderDungeonMap,key:'Shift+E'},
    {label:'🔨 합성트리',fn:renderSynthTree,key:'Shift+R'},
    {label:'📋 일일퀘스트',fn:renderDailyQuest,key:'Shift+T'},
    {label:'🐾 펫친밀도',fn:renderPetAffinity,key:'Shift+Y'},
    {label:'🤖 AI패턴',fn:renderAIPattern,key:'Shift+U'},
    {label:'📊 모험통계',fn:renderAdventureDashboard,key:'Shift+I'},
    {label:'❓ 퀴즈v27',fn:renderV27Quiz,key:'Shift+9'}
  ];

  if(bottomBar){
    navItems.forEach(function(item){
      var btn = document.createElement('button');
      btn.textContent = item.label;
      btn.style.cssText = 'padding:6px 10px;margin:2px;background:linear-gradient(135deg,#FF5FA2,#FF88CC);color:#fff;border:none;border-radius:10px;font-size:10px;font-weight:700;cursor:pointer;white-space:nowrap';
      btn.addEventListener('click', function(){ sfxV27('v27_nav'); item.fn(); });
      bottomBar.appendChild(btn);
    });
  }

  document.addEventListener('keydown', function(e){
    if(!e.shiftKey) return;
    if(e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    var keyMap = {
      'Q':renderEvolutionTree, 'W':renderTypeChart, 'E':renderDungeonMap,
      'R':renderSynthTree, 'T':renderDailyQuest, 'Y':renderPetAffinity,
      'U':renderAIPattern, 'I':renderAdventureDashboard, '9':renderV27Quiz
    };
    var fn = keyMap[e.key.toUpperCase()];
    if(fn){ e.preventDefault(); sfxV27('v27_nav'); fn(); }
  });
}

if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', addV27NavButtons);
} else {
  addV27NavButtons();
}

})();

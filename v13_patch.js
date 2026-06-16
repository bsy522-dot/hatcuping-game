// hatcuping-game v13_patch.js - NEXTERA+PRISM AUTO v13.0
// Self-contained IIFE patch module (~1200 lines, 50 functions)
(function(){
'use strict';

// ============================================================
// UTILITY: SFX ENGINE (12 new sound types, total 35)
// ============================================================
var _v13Ctx = null;
function _v13InitAudio(){
  if(!_v13Ctx){
    try{ _v13Ctx = new (window.AudioContext || window.webkitAudioContext)(); }catch(e){}
  }
  if(_v13Ctx && _v13Ctx.state === 'suspended') _v13Ctx.resume();
}

var SFX_V13 = {
  garden_plant:{f:523,d:.1,t:'triangle'},garden_water:{f:392,d:.12,t:'sine'},garden_harvest:{f:1047,d:.15,t:'triangle'},
  dex_open:{f:660,d:.06,t:'triangle'},dex_complete:{f:880,d:.12,t:'sine'},
  puzzle_match:{f:784,d:.06,t:'triangle'},puzzle_clear:{f:1047,d:.15,t:'triangle'},puzzle_combo:{f:988,d:.08,t:'sine'},
  shop_buy:{f:880,d:.08,t:'triangle'},shop_open:{f:600,d:.06,t:'sine'},
  story_open:{f:550,d:.08,t:'triangle'},story_next:{f:700,d:.05,t:'sine'},
  rhythm_hit:{f:880,d:.04,t:'triangle'},rhythm_miss:{f:220,d:.08,t:'sawtooth'},rhythm_perfect:{f:1047,d:.1,t:'triangle'},
  checkin_open:{f:660,d:.06,t:'triangle'},checkin_claim:{f:880,d:.12,t:'sine'},
  relation_open:{f:600,d:.06,t:'triangle'},
  quiz_v13:{f:784,d:.06,t:'triangle'}
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

function isDark(){ return document.body.classList.contains('dark'); }

// ============================================================
// 1. FAIRY GARDEN (요정의 정원 - 8종 식물 성장 Canvas)
// ============================================================
var GARDEN_PLANTS = [
  {id:'sunflower',name:'해바라기',icon:'&#x1F33B;',growTime:3,reward:10,color:'#FFD700',stages:['&#x1F331;','&#x1F33F;','&#x1F33B;']},
  {id:'tulip',name:'튤립',icon:'&#x1F337;',growTime:2,reward:8,color:'#FF6B9D',stages:['&#x1F331;','&#x1F33F;','&#x1F337;']},
  {id:'rose',name:'장미',icon:'&#x1F339;',growTime:4,reward:15,color:'#FF3366',stages:['&#x1F331;','&#x1F33F;','&#x1F339;']},
  {id:'cherry',name:'벚꽃',icon:'&#x1F338;',growTime:5,reward:20,color:'#FFB7C5',stages:['&#x1F331;','&#x1F33F;','&#x1F338;']},
  {id:'clover',name:'네잎클로버',icon:'&#x1F340;',growTime:2,reward:12,color:'#4CAF50',stages:['&#x1F331;','&#x1F33F;','&#x1F340;']},
  {id:'herb',name:'허브',icon:'&#x1F33F;',growTime:1,reward:5,color:'#66BB6A',stages:['&#x1F331;','&#x1F33F;','&#x1F33F;']},
  {id:'mushroom',name:'버섯',icon:'&#x1F344;',growTime:3,reward:10,color:'#8D6E63',stages:['&#x1F331;','&#x1F33F;','&#x1F344;']},
  {id:'crystal_flower',name:'크리스탈꽃',icon:'&#x1F48E;',growTime:6,reward:30,color:'#9C27B0',stages:['&#x1F331;','&#x1F33F;','&#x1F48E;']}
];

function getGardenData(){
  try{ return JSON.parse(localStorage.getItem('hatcuping_garden') || '{"plots":[],"coins":0,"watered":0,"harvested":0}'); }
  catch(e){ return {plots:[],coins:0,watered:0,harvested:0}; }
}
function saveGardenData(d){ try{ localStorage.setItem('hatcuping_garden', JSON.stringify(d)); }catch(e){} }

function openFairyGarden(){
  if(document.getElementById('gardenModal')) return;
  trackV13Feature('garden');
  sfxV13('garden_plant');

  var gd = getGardenData();
  if(!gd.plots || gd.plots.length < 6){
    gd.plots = [];
    for(var i=0;i<6;i++) gd.plots.push(null);
    saveGardenData(gd);
  }

  var overlay = document.createElement('div');
  overlay.id = 'gardenModal';
  overlay.className = 'modal-overlay show';
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');
  overlay.setAttribute('aria-label','요정의 정원');

  var html = '<div class="modal" style="max-width:440px">';
  html += '<button class="modal-close" aria-label="닫기" onclick="document.getElementById(\'gardenModal\').remove()">&times;</button>';
  html += '<h3 style="display:flex;align-items:center;gap:8px;color:#4CAF50">&#x1F33C; 요정의 정원</h3>';
  html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;padding:8px 12px;background:rgba(76,175,80,.08);border-radius:12px">';
  html += '<span style="font-size:12px;font-weight:700;color:#4CAF50">&#x1FA99; 코인: <span id="gardenCoins">' + (gd.coins||0) + '</span></span>';
  html += '<span style="font-size:11px;color:#888">수확: ' + (gd.harvested||0) + '회 | 물주기: ' + (gd.watered||0) + '회</span>';
  html += '</div>';

  html += '<div id="gardenPlots" style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px">';
  for(var i=0;i<6;i++){
    var plot = gd.plots[i];
    if(plot){
      var plant = GARDEN_PLANTS.filter(function(p){return p.id===plot.plantId})[0];
      var elapsed = Math.floor((Date.now() - plot.plantedAt) / 60000);
      var grown = elapsed >= (plant ? plant.growTime : 999);
      var stageIdx = grown ? 2 : (elapsed >= (plant ? plant.growTime/2 : 1) ? 1 : 0);
      var stageIcon = plant ? plant.stages[stageIdx] : '&#x1F331;';
      html += '<div class="garden-plot" data-idx="' + i + '" style="text-align:center;padding:14px 8px;background:linear-gradient(135deg,rgba(76,175,80,.1),rgba(139,195,74,.08));border-radius:14px;border:2px solid ' + (grown?'#FFD700':'rgba(76,175,80,.2)') + ';cursor:pointer;transition:all .2s">';
      html += '<div style="font-size:28px;margin-bottom:4px">' + stageIcon + '</div>';
      html += '<div style="font-size:11px;font-weight:700;color:#333">' + (plant?plant.name:'') + '</div>';
      if(grown){
        html += '<button onclick="harvestPlot('+i+')" style="margin-top:4px;padding:3px 10px;background:#FFD700;color:#333;border:none;border-radius:8px;font-size:10px;font-weight:700;cursor:pointer">수확 +' + (plant?plant.reward:0) + '</button>';
      } else {
        var remaining = (plant ? plant.growTime : 0) - elapsed;
        html += '<div style="font-size:10px;color:#888;margin-top:2px">' + Math.max(0,remaining) + '분 남음</div>';
        html += '<button onclick="waterPlot('+i+')" style="margin-top:2px;padding:2px 8px;background:#2196F3;color:#fff;border:none;border-radius:8px;font-size:10px;font-weight:600;cursor:pointer">&#x1F4A7; 물주기</button>';
      }
      html += '</div>';
    } else {
      html += '<div class="garden-plot empty" data-idx="' + i + '" style="text-align:center;padding:14px 8px;background:rgba(0,0,0,.03);border-radius:14px;border:2px dashed rgba(0,0,0,.1);cursor:pointer;transition:all .2s" onclick="showPlantPicker('+i+')">';
      html += '<div style="font-size:24px;opacity:.4">&#x2795;</div>';
      html += '<div style="font-size:10px;color:#aaa;margin-top:4px">빈 화분</div>';
      html += '</div>';
    }
  }
  html += '</div>';

  html += '<div style="font-size:11px;color:#888;text-align:center">식물을 심고 물을 주면 빨리 자라요! 수확하면 코인을 얻어요.</div>';
  html += '</div>';
  overlay.innerHTML = html;
  overlay.addEventListener('click', function(e){ if(e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
}

window.showPlantPicker = function(idx){
  var picker = document.createElement('div');
  picker.id = 'plantPicker';
  picker.style.cssText = 'position:fixed;bottom:0;left:0;width:100%;background:#fff;border-radius:20px 20px 0 0;padding:20px;z-index:1002;box-shadow:0 -4px 30px rgba(0,0,0,.2);max-height:60vh;overflow-y:auto';
  if(isDark()) picker.style.background = '#2a1a3e';
  var html = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><h4 style="margin:0;font-size:15px;color:#4CAF50">&#x1F331; 식물 선택</h4><button onclick="document.getElementById(\'plantPicker\').remove()" style="background:none;border:none;font-size:20px;cursor:pointer;color:#888">&times;</button></div>';
  html += '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px">';
  GARDEN_PLANTS.forEach(function(p){
    html += '<div onclick="plantSeed('+idx+',\''+p.id+'\')" style="padding:12px;background:linear-gradient(135deg,' + p.color + '15,' + p.color + '08);border-radius:12px;cursor:pointer;text-align:center;border:1px solid ' + p.color + '30;transition:transform .2s" onmouseover="this.style.transform=\'scale(1.03)\'" onmouseout="this.style.transform=\'scale(1)\'">';
    html += '<div style="font-size:24px">' + p.icon + '</div>';
    html += '<div style="font-size:12px;font-weight:700;margin-top:4px">' + p.name + '</div>';
    html += '<div style="font-size:10px;color:#888">' + p.growTime + '분 | +' + p.reward + '코인</div>';
    html += '</div>';
  });
  html += '</div>';
  picker.innerHTML = html;
  document.body.appendChild(picker);
};

window.plantSeed = function(idx, plantId){
  var gd = getGardenData();
  gd.plots[idx] = { plantId: plantId, plantedAt: Date.now(), watered: 0 };
  saveGardenData(gd);
  sfxV13('garden_plant');
  showToastV13('&#x1F331; 식물을 심었어요!');
  var picker = document.getElementById('plantPicker');
  if(picker) picker.remove();
  var modal = document.getElementById('gardenModal');
  if(modal) modal.remove();
  openFairyGarden();
};

window.waterPlot = function(idx){
  var gd = getGardenData();
  if(gd.plots[idx]){
    gd.plots[idx].plantedAt -= 30000;
    gd.watered = (gd.watered||0) + 1;
    saveGardenData(gd);
    sfxV13('garden_water');
    showToastV13('&#x1F4A7; 물을 줬어요! 30초 단축!');
    var modal = document.getElementById('gardenModal');
    if(modal) modal.remove();
    openFairyGarden();
  }
};

window.harvestPlot = function(idx){
  var gd = getGardenData();
  if(gd.plots[idx]){
    var plant = GARDEN_PLANTS.filter(function(p){return p.id===gd.plots[idx].plantId})[0];
    var reward = plant ? plant.reward : 5;
    gd.coins = (gd.coins||0) + reward;
    gd.harvested = (gd.harvested||0) + 1;
    gd.plots[idx] = null;
    saveGardenData(gd);
    sfxV13('garden_harvest');
    showToastV13('&#x1F33E; 수확! +' + reward + ' 코인!');
    var modal = document.getElementById('gardenModal');
    if(modal) modal.remove();
    openFairyGarden();
    checkV13Achievements();
  }
};


// ============================================================
// 2. TINNIPING DEX TRACKER (티니핑 도감 트래커 Canvas)
// ============================================================
var DEX_ENTRIES = [
  {id:'hatcuping',name:'하츄핑',type:'로얄',icon:'&#x1F496;',color:'#FF5FA2',desc:'사랑의 티니핑. 로미의 파트너.'},
  {id:'baropping',name:'바로핑',type:'로얄',icon:'&#x2764;&#xFE0F;',color:'#FF3366',desc:'용기의 티니핑. 정의로운 성격.'},
  {id:'chacha',name:'차차핑',type:'로얄',icon:'&#x1F49B;',color:'#FFD700',desc:'행복의 티니핑. 항상 밝은 에너지.'},
  {id:'lala',name:'라라핑',type:'로얄',icon:'&#x1F49C;',color:'#9C27B0',desc:'음악의 티니핑. 노래를 사랑해.'},
  {id:'kkongkkong',name:'꽁꽁핑',type:'로얄',icon:'&#x1F499;',color:'#2196F3',desc:'얼음의 티니핑. 차갑지만 따뜻한 마음.'},
  {id:'murupping',name:'무럭핑',type:'일반',icon:'&#x1F33F;',color:'#4CAF50',desc:'성장의 티니핑. 식물과 친구.'},
  {id:'heartsping',name:'하츠핑',type:'일반',icon:'&#x1F493;',color:'#E91E63',desc:'두근두근 티니핑. 설렘 가득.'},
  {id:'popping',name:'포핑',type:'일반',icon:'&#x1F388;',color:'#FF9800',desc:'팡팡 티니핑. 놀라움의 달인.'},
  {id:'shashaping',name:'샤샤핑',type:'일반',icon:'&#x2728;',color:'#FFC107',desc:'반짝이는 티니핑. 빛나는 존재.'},
  {id:'giggling',name:'깔깔핑',type:'일반',icon:'&#x1F604;',color:'#FF6F00',desc:'웃음의 티니핑. 모두를 웃게 해.'},
  {id:'trupping',name:'트러핑',type:'빌런',icon:'&#x1F608;',color:'#333',desc:'속이는 티니핑. 장난의 대가.'},
  {id:'angry_trupping',name:'화나핑',type:'빌런',icon:'&#x1F621;',color:'#D32F2F',desc:'분노의 트러핑. 화가 잔뜩.'},
  {id:'sad_trupping',name:'슬프핑',type:'빌런',icon:'&#x1F622;',color:'#5C6BC0',desc:'슬픔의 트러핑. 눈물의 비.'},
  {id:'lazy_trupping',name:'게으핑',type:'빌런',icon:'&#x1F634;',color:'#78909C',desc:'나태의 트러핑. 쿨쿨..'},
  {id:'scary_trupping',name:'무서핑',type:'빌런',icon:'&#x1F47B;',color:'#6A1B9A',desc:'공포의 트러핑. 으스스한 분위기.'},
  {id:'queen',name:'여왕핑',type:'전설',icon:'&#x1F451;',color:'#FFD700',desc:'이모션 왕국의 여왕님.'}
];

function getDexData(){
  try{ return JSON.parse(localStorage.getItem('hatcuping_dex') || '{}'); }catch(e){ return {}; }
}
function saveDexData(d){ try{ localStorage.setItem('hatcuping_dex', JSON.stringify(d)); }catch(e){} }

function openDexTracker(){
  if(document.getElementById('dexModal')) return;
  trackV13Feature('dex');
  sfxV13('dex_open');

  var dex = getDexData();
  var discovered = Object.keys(dex).length;
  var total = DEX_ENTRIES.length;
  var pct = Math.round(discovered / total * 100);

  var overlay = document.createElement('div');
  overlay.id = 'dexModal';
  overlay.className = 'modal-overlay show';
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');

  var html = '<div class="modal" style="max-width:440px">';
  html += '<button class="modal-close" aria-label="닫기" onclick="document.getElementById(\'dexModal\').remove()">&times;</button>';
  html += '<h3 style="color:#FF5FA2">&#x1F4D6; 티니핑 도감</h3>';
  html += '<div style="text-align:center;margin-bottom:12px">';
  html += '<canvas id="dexCanvas" width="320" height="180" style="width:100%;max-width:320px;border-radius:12px"></canvas>';
  html += '<div style="font-size:12px;font-weight:700;margin-top:6px;color:#FF5FA2">' + discovered + '/' + total + ' 발견 (' + pct + '%)</div>';
  html += '</div>';

  html += '<div style="display:flex;gap:4px;margin-bottom:8px;flex-wrap:wrap">';
  ['전체','로얄','일반','빌런','전설'].forEach(function(cat){
    html += '<button class="dex-filter-btn" data-cat="' + cat + '" style="padding:4px 10px;border-radius:12px;border:1px solid rgba(255,95,162,.2);background:' + (cat==='전체'?'#FF5FA2':'transparent') + ';color:' + (cat==='전체'?'#fff':'#888') + ';font-size:11px;font-weight:700;cursor:pointer">' + cat + '</button>';
  });
  html += '</div>';

  html += '<div id="dexList" style="max-height:300px;overflow-y:auto">';
  html += renderDexList('전체', dex);
  html += '</div>';

  html += '<button onclick="discoverRandomTinniping()" style="width:100%;margin-top:10px;padding:10px;background:linear-gradient(135deg,#FF5FA2,#B066FF);color:#fff;border:none;border-radius:14px;font-size:13px;font-weight:700;cursor:pointer">&#x1F50D; 탐험하기 (랜덤 발견)</button>';
  html += '</div>';

  overlay.innerHTML = html;
  overlay.addEventListener('click', function(e){ if(e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);

  drawDexCanvas(dex);

  overlay.querySelectorAll('.dex-filter-btn').forEach(function(btn){
    btn.addEventListener('click', function(){
      overlay.querySelectorAll('.dex-filter-btn').forEach(function(b){ b.style.background='transparent'; b.style.color='#888'; });
      btn.style.background='#FF5FA2'; btn.style.color='#fff';
      document.getElementById('dexList').innerHTML = renderDexList(btn.dataset.cat, dex);
    });
  });
}

function renderDexList(cat, dex){
  var entries = cat === '전체' ? DEX_ENTRIES : DEX_ENTRIES.filter(function(e){ return e.type === cat; });
  return entries.map(function(e){
    var found = !!dex[e.id];
    return '<div style="display:flex;align-items:center;gap:10px;padding:8px;margin-bottom:4px;border-radius:12px;background:' + (found?'rgba(255,95,162,.06)':'rgba(0,0,0,.02)') + ';opacity:' + (found?'1':'.5') + '">' +
      '<div style="width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;background:' + (found?e.color+'20':'rgba(0,0,0,.05)') + '">' + (found?e.icon:'&#x2753;') + '</div>' +
      '<div style="flex:1"><div style="font-size:12px;font-weight:700">' + (found?e.name:'???') + '</div>' +
      '<div style="font-size:10px;color:#888">' + (found?e.desc:'아직 발견하지 못한 티니핑') + '</div></div>' +
      '<span style="font-size:10px;padding:2px 8px;border-radius:8px;background:' + (found?e.color+'20':'rgba(0,0,0,.04)') + ';color:' + (found?e.color:'#aaa') + ';font-weight:700">' + e.type + '</span></div>';
  }).join('');
}

function drawDexCanvas(dex){
  var cvs = document.getElementById('dexCanvas');
  if(!cvs) return;
  var ctx = cvs.getContext('2d');
  ctx.clearRect(0,0,320,180);

  var bg = isDark() ? '#1a0a2e' : '#FFF0F8';
  ctx.fillStyle = bg;
  ctx.fillRect(0,0,320,180);

  var types = [{name:'로얄',color:'#FF5FA2'},{name:'일반',color:'#4CAF50'},{name:'빌런',color:'#333'},{name:'전설',color:'#FFD700'}];
  var barW = 55, startX = 30, startY = 140;

  types.forEach(function(t, i){
    var total = DEX_ENTRIES.filter(function(e){ return e.type === t.name; }).length;
    var found = DEX_ENTRIES.filter(function(e){ return e.type === t.name && dex[e.id]; }).length;
    var h = total > 0 ? (found / total) * 100 : 0;
    var x = startX + i * 72;

    ctx.fillStyle = 'rgba(0,0,0,.06)';
    ctx.fillRect(x, startY - 100, barW, 100);

    var grad = ctx.createLinearGradient(x, startY - h, x, startY);
    grad.addColorStop(0, t.color);
    grad.addColorStop(1, t.color + '80');
    ctx.fillStyle = grad;
    ctx.fillRect(x, startY - h, barW, h);

    ctx.fillStyle = isDark() ? '#eee' : '#333';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(t.name, x + barW/2, startY + 14);
    ctx.fillText(found + '/' + total, x + barW/2, startY - h - 6);
  });

  ctx.fillStyle = isDark() ? '#eee' : '#333';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('티니핑 도감 완성도', 160, 20);
}

window.discoverRandomTinniping = function(){
  var dex = getDexData();
  var undiscovered = DEX_ENTRIES.filter(function(e){ return !dex[e.id]; });
  if(undiscovered.length === 0){
    showToastV13('&#x1F389; 모든 티니핑을 발견했어요!');
    return;
  }
  var pick = undiscovered[Math.floor(Math.random() * undiscovered.length)];
  dex[pick.id] = Date.now();
  saveDexData(dex);
  sfxV13('dex_complete');
  showToastV13(pick.icon + ' ' + pick.name + ' 발견!');
  var modal = document.getElementById('dexModal');
  if(modal) modal.remove();
  openDexTracker();
  checkV13Achievements();
};


// ============================================================
// 3. EMOTION PUZZLE (이모션 3매치 퍼즐 Canvas)
// ============================================================
var PUZZLE_EMOJIS = ['&#x1F496;','&#x2B50;','&#x1F48E;','&#x1F33C;','&#x2764;&#xFE0F;','&#x1F31F;'];
var PUZZLE_COLORS = ['#FF5FA2','#FFD700','#9C27B0','#4CAF50','#FF3366','#2196F3'];
var puzzleGrid = [];
var puzzleScore = 0;
var puzzleSelected = null;
var puzzleMoves = 0;

function initPuzzleGrid(){
  puzzleGrid = [];
  for(var r=0;r<6;r++){
    puzzleGrid[r] = [];
    for(var c=0;c<6;c++){
      puzzleGrid[r][c] = Math.floor(Math.random() * 6);
    }
  }
  removeMatches();
}

function removeMatches(){
  var changed = true;
  while(changed){
    changed = false;
    for(var r=0;r<6;r++){
      for(var c=0;c<6;c++){
        if(c<4 && puzzleGrid[r][c]===puzzleGrid[r][c+1] && puzzleGrid[r][c]===puzzleGrid[r][c+2]){
          puzzleGrid[r][c] = Math.floor(Math.random()*6);
          changed = true;
        }
        if(r<4 && puzzleGrid[r][c]===puzzleGrid[r+1][c] && puzzleGrid[r][c]===puzzleGrid[r+2][c]){
          puzzleGrid[r][c] = Math.floor(Math.random()*6);
          changed = true;
        }
      }
    }
  }
}

function openEmotionPuzzle(){
  if(document.getElementById('puzzleModal')) return;
  trackV13Feature('puzzle');
  sfxV13('puzzle_match');
  initPuzzleGrid();
  puzzleScore = 0;
  puzzleMoves = 30;
  puzzleSelected = null;

  var overlay = document.createElement('div');
  overlay.id = 'puzzleModal';
  overlay.className = 'modal-overlay show';
  overlay.setAttribute('role','dialog');

  var html = '<div class="modal" style="max-width:380px;padding:16px">';
  html += '<button class="modal-close" aria-label="닫기" onclick="document.getElementById(\'puzzleModal\').remove()">&times;</button>';
  html += '<h3 style="color:#9C27B0;font-size:16px">&#x1F9E9; 이모션 퍼즐</h3>';
  html += '<div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:12px;font-weight:700">';
  html += '<span style="color:#FF5FA2">점수: <span id="puzzleScore">0</span></span>';
  html += '<span style="color:#888">남은 이동: <span id="puzzleMoves">30</span></span>';
  html += '</div>';
  html += '<canvas id="puzzleCanvas" width="300" height="300" style="width:100%;max-width:300px;border-radius:12px;cursor:pointer;display:block;margin:0 auto;border:2px solid rgba(156,39,176,.15)"></canvas>';
  html += '<div id="puzzleResult" style="text-align:center;margin-top:8px;font-size:12px;color:#888"></div>';
  html += '</div>';

  overlay.innerHTML = html;
  overlay.addEventListener('click', function(e){ if(e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);

  drawPuzzle();

  var cvs = document.getElementById('puzzleCanvas');
  cvs.addEventListener('click', function(e){
    var rect = cvs.getBoundingClientRect();
    var scale = 300 / rect.width;
    var x = (e.clientX - rect.left) * scale;
    var y = (e.clientY - rect.top) * scale;
    var col = Math.floor(x / 50);
    var row = Math.floor(y / 50);
    if(row<0||row>5||col<0||col>5) return;

    if(!puzzleSelected){
      puzzleSelected = {r:row,c:col};
      drawPuzzle();
    } else {
      var dr = Math.abs(row - puzzleSelected.r);
      var dc = Math.abs(col - puzzleSelected.c);
      if((dr===1&&dc===0)||(dr===0&&dc===1)){
        var tmp = puzzleGrid[row][col];
        puzzleGrid[row][col] = puzzleGrid[puzzleSelected.r][puzzleSelected.c];
        puzzleGrid[puzzleSelected.r][puzzleSelected.c] = tmp;

        var matches = findMatches();
        if(matches.length > 0){
          puzzleMoves--;
          clearMatches(matches);
          sfxV13('puzzle_match');
        } else {
          puzzleGrid[puzzleSelected.r][puzzleSelected.c] = puzzleGrid[row][col];
          puzzleGrid[row][col] = tmp;
        }
      }
      puzzleSelected = null;
      drawPuzzle();
      document.getElementById('puzzleMoves').textContent = puzzleMoves;
      document.getElementById('puzzleScore').textContent = puzzleScore;

      if(puzzleMoves <= 0){
        document.getElementById('puzzleResult').innerHTML = '&#x1F3C6; 게임 종료! 최종 점수: <b style="color:#FF5FA2">' + puzzleScore + '</b>점';
        try{
          var best = parseInt(localStorage.getItem('hatcuping_puzzle_best')||'0');
          if(puzzleScore > best) localStorage.setItem('hatcuping_puzzle_best', puzzleScore.toString());
        }catch(e){}
        checkV13Achievements();
      }
    }
  });
}

function findMatches(){
  var matched = [];
  for(var r=0;r<6;r++){
    for(var c=0;c<4;c++){
      if(puzzleGrid[r][c]===puzzleGrid[r][c+1]&&puzzleGrid[r][c]===puzzleGrid[r][c+2]){
        matched.push([r,c],[r,c+1],[r,c+2]);
      }
    }
  }
  for(var c2=0;c2<6;c2++){
    for(var r2=0;r2<4;r2++){
      if(puzzleGrid[r2][c2]===puzzleGrid[r2+1][c2]&&puzzleGrid[r2][c2]===puzzleGrid[r2+2][c2]){
        matched.push([r2,c2],[r2+1,c2],[r2+2,c2]);
      }
    }
  }
  var unique = {};
  matched.forEach(function(m){ unique[m[0]+','+m[1]] = m; });
  return Object.values(unique);
}

function clearMatches(matches){
  var pts = matches.length * 10;
  if(matches.length >= 4) pts *= 2;
  if(matches.length >= 5){ pts *= 3; sfxV13('puzzle_combo'); }
  puzzleScore += pts;

  matches.forEach(function(m){ puzzleGrid[m[0]][m[1]] = -1; });

  for(var c=0;c<6;c++){
    var col = [];
    for(var r=5;r>=0;r--){
      if(puzzleGrid[r][c] !== -1) col.push(puzzleGrid[r][c]);
    }
    while(col.length < 6) col.push(Math.floor(Math.random()*6));
    for(var r2=5;r2>=0;r2--){
      puzzleGrid[r2][c] = col[5-r2];
    }
  }

  var newMatches = findMatches();
  if(newMatches.length > 0){
    sfxV13('puzzle_combo');
    clearMatches(newMatches);
  }
}

function drawPuzzle(){
  var cvs = document.getElementById('puzzleCanvas');
  if(!cvs) return;
  var ctx = cvs.getContext('2d');
  ctx.clearRect(0,0,300,300);
  ctx.fillStyle = isDark() ? '#1a0a2e' : '#faf0ff';
  ctx.fillRect(0,0,300,300);

  for(var r=0;r<6;r++){
    for(var c=0;c<6;c++){
      var v = puzzleGrid[r][c];
      var x = c*50, y = r*50;
      var isSelected = puzzleSelected && puzzleSelected.r===r && puzzleSelected.c===c;

      ctx.fillStyle = isSelected ? 'rgba(255,95,162,.2)' : (isDark()?'rgba(255,255,255,.04)':'rgba(0,0,0,.02)');
      ctx.fillRect(x+2, y+2, 46, 46);
      ctx.strokeStyle = isSelected ? '#FF5FA2' : 'rgba(0,0,0,.06)';
      ctx.lineWidth = isSelected ? 2 : 1;
      ctx.strokeRect(x+2, y+2, 46, 46);

      ctx.fillStyle = PUZZLE_COLORS[v] || '#888';
      ctx.beginPath();
      ctx.arc(x+25, y+25, 16, 0, Math.PI*2);
      ctx.fill();

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      var labels = ['H','S','D','F','L','B'];
      ctx.fillText(labels[v]||'?', x+25, y+26);
    }
  }
}


// ============================================================
// 4. FAIRY SHOP (착한 요정 상점)
// ============================================================
var SHOP_ITEMS = [
  {id:'extra_life',name:'추가 생명',desc:'게임에서 추가 생명 1개',price:20,icon:'&#x2764;&#xFE0F;',cat:'소모품'},
  {id:'speed_boost',name:'속도 부스트',desc:'캐릭터 이동속도 +20%',price:30,icon:'&#x26A1;',cat:'소모품'},
  {id:'shield',name:'보호막',desc:'1회 피해 무시',price:25,icon:'&#x1F6E1;&#xFE0F;',cat:'소모품'},
  {id:'double_coin',name:'코인 2배',desc:'수확 코인 2배',price:50,icon:'&#x1F4B0;',cat:'소모품'},
  {id:'lucky_charm',name:'행운의 부적',desc:'가챠 확률 업',price:40,icon:'&#x1F340;',cat:'장비'},
  {id:'heart_ring',name:'하트 반지',desc:'하트 획득 +50%',price:35,icon:'&#x1F48D;',cat:'장비'},
  {id:'star_pendant',name:'별의 펜던트',desc:'경험치 +30%',price:45,icon:'&#x2B50;',cat:'장비'},
  {id:'fairy_wings',name:'요정의 날개',desc:'더블점프 +1',price:60,icon:'&#x1FABD;',cat:'장비'},
  {id:'music_box',name:'오르골',desc:'새로운 BGM 해금',price:30,icon:'&#x1F3B5;',cat:'수집'},
  {id:'photo_frame',name:'사진 액자',desc:'공유카드 프레임 해금',price:25,icon:'&#x1F5BC;&#xFE0F;',cat:'수집'},
  {id:'garden_pot',name:'화분 추가',desc:'정원 슬롯 +1',price:80,icon:'&#x1FAB4;',cat:'수집'},
  {id:'dex_hint',name:'도감 힌트',desc:'미발견 티니핑 1종 발견',price:50,icon:'&#x1F50E;',cat:'수집'}
];

function getShopData(){
  try{ return JSON.parse(localStorage.getItem('hatcuping_shop') || '{"purchased":[],"equipped":[]}'); }
  catch(e){ return {purchased:[],equipped:[]}; }
}
function saveShopData(d){ try{ localStorage.setItem('hatcuping_shop', JSON.stringify(d)); }catch(e){} }

function openFairyShop(){
  if(document.getElementById('shopModal')) return;
  trackV13Feature('shop');
  sfxV13('shop_open');

  var gd = getGardenData();
  var sd = getShopData();

  var overlay = document.createElement('div');
  overlay.id = 'shopModal';
  overlay.className = 'modal-overlay show';
  overlay.setAttribute('role','dialog');

  var html = '<div class="modal" style="max-width:420px">';
  html += '<button class="modal-close" aria-label="닫기" onclick="document.getElementById(\'shopModal\').remove()">&times;</button>';
  html += '<h3 style="color:#FF9800">&#x1F3EA; 착한 요정 상점</h3>';
  html += '<div style="padding:8px 12px;background:rgba(255,152,0,.08);border-radius:12px;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center">';
  html += '<span style="font-size:13px;font-weight:700;color:#FF9800">&#x1FA99; 보유 코인: ' + (gd.coins||0) + '</span>';
  html += '<span style="font-size:11px;color:#888">구매: ' + sd.purchased.length + '건</span>';
  html += '</div>';

  var cats = ['소모품','장비','수집'];
  cats.forEach(function(cat){
    html += '<div style="font-size:11px;font-weight:700;color:#888;margin:10px 0 6px;text-transform:uppercase">' + cat + '</div>';
    SHOP_ITEMS.filter(function(item){ return item.cat === cat; }).forEach(function(item){
      var owned = sd.purchased.indexOf(item.id) >= 0;
      var canBuy = (gd.coins||0) >= item.price && !owned;
      html += '<div style="display:flex;align-items:center;gap:10px;padding:8px;margin-bottom:4px;border-radius:12px;background:' + (owned?'rgba(76,175,80,.06)':'rgba(0,0,0,.02)') + '">';
      html += '<div style="width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;background:rgba(255,152,0,.1)">' + item.icon + '</div>';
      html += '<div style="flex:1"><div style="font-size:12px;font-weight:700">' + item.name + '</div><div style="font-size:10px;color:#888">' + item.desc + '</div></div>';
      if(owned){
        html += '<span style="font-size:10px;color:#4CAF50;font-weight:700;padding:4px 8px;background:rgba(76,175,80,.1);border-radius:8px">보유중</span>';
      } else {
        html += '<button onclick="buyShopItem(\'' + item.id + '\',' + item.price + ')" style="padding:4px 10px;background:' + (canBuy?'linear-gradient(135deg,#FF9800,#FF5722)':'#ccc') + ';color:#fff;border:none;border-radius:8px;font-size:11px;font-weight:700;cursor:' + (canBuy?'pointer':'default') + '" ' + (canBuy?'':'disabled') + '>' + item.price + '&#x1FA99;</button>';
      }
      html += '</div>';
    });
  });

  html += '</div>';
  overlay.innerHTML = html;
  overlay.addEventListener('click', function(e){ if(e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
}

window.buyShopItem = function(itemId, price){
  var gd = getGardenData();
  var sd = getShopData();
  if((gd.coins||0) < price || sd.purchased.indexOf(itemId) >= 0) return;

  gd.coins -= price;
  saveGardenData(gd);
  sd.purchased.push(itemId);
  saveShopData(sd);
  sfxV13('shop_buy');
  showToastV13('&#x1F6CD;&#xFE0F; 구매 완료!');

  if(itemId === 'dex_hint') window.discoverRandomTinniping();

  var modal = document.getElementById('shopModal');
  if(modal) modal.remove();
  openFairyShop();
  checkV13Achievements();
};


// ============================================================
// 5. STORY THEATER (스토리 극장 8챕터)
// ============================================================
var STORY_CHAPTERS = [
  {id:'ch1',title:'이모션 왕국의 아침',icon:'&#x1F305;',text:'로미는 평범한 아이였어요. 어느 날 아침, 이상한 빛이 하늘에서 내려왔죠. 그 빛 속에서 작고 귀여운 요정이 나타났어요. &quot;안녕! 나는 하츄핑이야!&quot;'},
  {id:'ch2',title:'첫 번째 만남',icon:'&#x1F496;',text:'하츄핑은 이모션 왕국에서 온 티니핑이었어요. 로미가 하츄핑의 뿔을 터치하자, 둘 사이에 마법의 끈이 생겼죠. &quot;우리 이제 파트너야!&quot; 하츄핑이 기뻐 날았어요.'},
  {id:'ch3',title:'트러핑의 등장',icon:'&#x1F608;',text:'평화로운 마을에 갑자기 어둠이 드리웠어요. 트러핑들이 나타나 사람들의 감정을 혼란스럽게 만들었죠. &quot;로미야, 우리가 막아야 해!&quot; 하츄핑이 결의에 찬 눈으로 말했어요.'},
  {id:'ch4',title:'친구들의 합류',icon:'&#x1F91D;',text:'바로핑, 차차핑, 라라핑, 꽁꽁핑... 로얄 티니핑들이 하나둘 합류했어요. 각자의 능력을 합치면 트러핑을 물리칠 수 있어요!'},
  {id:'ch5',title:'크리스탈 동굴',icon:'&#x1F48E;',text:'이모션 크리스탈이 숨겨진 동굴로 향했어요. 하지만 동굴은 함정으로 가득! 팀워크로 하나하나 극복해 나갔죠. 크리스탈의 빛이 점점 가까워져요.'},
  {id:'ch6',title:'여왕핑의 시련',icon:'&#x1F451;',text:'여왕핑이 로미에게 시련을 내렸어요. &quot;진정한 사랑의 힘을 증명하렴.&quot; 로미는 친구들을 위해 용기를 냈고, 마침내 사랑의 힘이 깨어났어요!'},
  {id:'ch7',title:'최후의 결전',icon:'&#x2694;&#xFE0F;',text:'트러핑의 우두머리와 마지막 대결! 하츄핑과 로미의 유대가 최고조에 달했을 때, 찬란한 빛이 어둠을 밀어냈어요. &quot;사랑은 모든 것을 이겨내!&quot;'},
  {id:'ch8',title:'새로운 시작',icon:'&#x1F308;',text:'이모션 왕국에 평화가 돌아왔어요. 하지만 이것은 끝이 아니라 새로운 시작이에요. 로미와 하츄핑의 모험은 계속됩니다! 새로운 친구들이 기다리고 있으니까요.'}
];

function getStoryData(){
  try{ return JSON.parse(localStorage.getItem('hatcuping_story') || '{"read":[]}'); }catch(e){ return {read:[]}; }
}
function saveStoryData(d){ try{ localStorage.setItem('hatcuping_story', JSON.stringify(d)); }catch(e){} }

function openStoryTheater(){
  if(document.getElementById('storyModal')) return;
  trackV13Feature('story');
  sfxV13('story_open');

  var sd = getStoryData();

  var overlay = document.createElement('div');
  overlay.id = 'storyModal';
  overlay.className = 'modal-overlay show';
  overlay.setAttribute('role','dialog');

  var html = '<div class="modal" style="max-width:420px">';
  html += '<button class="modal-close" aria-label="닫기" onclick="document.getElementById(\'storyModal\').remove()">&times;</button>';
  html += '<h3 style="color:#B066FF">&#x1F3AD; 스토리 극장</h3>';
  html += '<div style="text-align:center;margin-bottom:10px;font-size:12px;color:#888">' + sd.read.length + '/' + STORY_CHAPTERS.length + ' 챕터 읽음</div>';

  STORY_CHAPTERS.forEach(function(ch, i){
    var isRead = sd.read.indexOf(ch.id) >= 0;
    var unlocked = i === 0 || sd.read.indexOf(STORY_CHAPTERS[i-1].id) >= 0;
    html += '<div style="padding:12px;margin-bottom:8px;border-radius:14px;background:' + (isRead?'rgba(176,102,255,.06)':'rgba(0,0,0,.02)') + ';border:1px solid ' + (isRead?'rgba(176,102,255,.2)':'transparent') + ';cursor:' + (unlocked?'pointer':'default') + ';opacity:' + (unlocked?'1':'.4') + '" ' + (unlocked?'onclick="readStoryChapter(\''+ch.id+'\','+i+')"':'') + '>';
    html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">';
    html += '<span style="font-size:20px">' + (unlocked?ch.icon:'&#x1F512;') + '</span>';
    html += '<span style="font-size:13px;font-weight:700">Ch.' + (i+1) + ' ' + ch.title + '</span>';
    if(isRead) html += '<span style="font-size:10px;color:#4CAF50;margin-left:auto">&#x2705;</span>';
    html += '</div>';
    if(unlocked && isRead){
      html += '<div style="font-size:11px;color:#888;line-height:1.5;padding-left:28px">' + ch.text.substring(0,60) + '...</div>';
    }
    html += '</div>';
  });

  html += '</div>';
  overlay.innerHTML = html;
  overlay.addEventListener('click', function(e){ if(e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
}

window.readStoryChapter = function(chId, idx){
  sfxV13('story_next');
  var sd = getStoryData();
  if(sd.read.indexOf(chId) < 0){
    sd.read.push(chId);
    saveStoryData(sd);
  }

  var ch = STORY_CHAPTERS[idx];
  var reader = document.createElement('div');
  reader.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.85);z-index:1003;display:flex;justify-content:center;align-items:center;backdrop-filter:blur(8px)';
  reader.innerHTML = '<div style="background:' + (isDark()?'#2a1a3e':'#fff') + ';border-radius:24px;padding:28px;max-width:380px;width:90%;text-align:center">' +
    '<div style="font-size:48px;margin-bottom:12px">' + ch.icon + '</div>' +
    '<div style="font-size:18px;font-weight:800;margin-bottom:8px;background:linear-gradient(135deg,#FF5FA2,#B066FF);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">Ch.' + (idx+1) + ' ' + ch.title + '</div>' +
    '<div style="font-size:13px;color:' + (isDark()?'#ccc':'#555') + ';line-height:1.8;margin-bottom:16px;text-align:left">' + ch.text + '</div>' +
    '<button onclick="this.closest(\'div[style]\').parentElement.remove()" style="padding:10px 30px;background:linear-gradient(135deg,#FF5FA2,#B066FF);color:#fff;border:none;border-radius:14px;font-size:14px;font-weight:700;cursor:pointer">닫기</button></div>';
  reader.addEventListener('click', function(e){ if(e.target === reader) reader.remove(); });
  document.body.appendChild(reader);
  checkV13Achievements();
};


// ============================================================
// 6. RHYTHM CHALLENGE (리듬 챌린지 미니게임)
// ============================================================
var rhythmActive = false;
var rhythmScore = 0;
var rhythmNotes = [];
var rhythmBPM = 120;
var rhythmTimer = null;

function openRhythmChallenge(){
  if(document.getElementById('rhythmModal')) return;
  trackV13Feature('rhythm');

  var overlay = document.createElement('div');
  overlay.id = 'rhythmModal';
  overlay.className = 'modal-overlay show';
  overlay.setAttribute('role','dialog');

  var html = '<div class="modal" style="max-width:360px;padding:16px">';
  html += '<button class="modal-close" aria-label="닫기" onclick="stopRhythm();document.getElementById(\'rhythmModal\').remove()">&times;</button>';
  html += '<h3 style="color:#E91E63;font-size:16px">&#x1F3B6; 리듬 챌린지</h3>';
  html += '<div style="text-align:center;margin-bottom:8px">';
  html += '<div style="font-size:12px;color:#888;margin-bottom:6px">BPM: ' + rhythmBPM + ' | 노트가 나타나면 타이밍에 맞춰 클릭!</div>';
  html += '<div style="display:flex;justify-content:space-between;font-size:12px;font-weight:700;margin-bottom:6px">';
  html += '<span style="color:#E91E63">점수: <span id="rhythmScore">0</span></span>';
  html += '<span style="color:#4CAF50">Perfect: <span id="rhythmPerfect">0</span></span>';
  html += '<span style="color:#888">시간: <span id="rhythmTime">30</span>s</span>';
  html += '</div>';
  html += '<canvas id="rhythmCanvas" width="300" height="200" style="width:100%;max-width:300px;border-radius:12px;cursor:pointer;display:block;margin:0 auto;border:2px solid rgba(233,30,99,.15)"></canvas>';
  html += '</div>';
  html += '<button id="rhythmStartBtn" onclick="startRhythm()" style="width:100%;padding:10px;background:linear-gradient(135deg,#E91E63,#9C27B0);color:#fff;border:none;border-radius:14px;font-size:13px;font-weight:700;cursor:pointer;margin-top:8px">&#x25B6;&#xFE0F; 시작</button>';
  html += '<div id="rhythmResult" style="text-align:center;margin-top:8px;font-size:12px;color:#888"></div>';
  html += '</div>';

  overlay.innerHTML = html;
  overlay.addEventListener('click', function(e){ if(e.target === overlay){ stopRhythm(); overlay.remove(); } });
  document.body.appendChild(overlay);

  drawRhythmIdle();
}

function drawRhythmIdle(){
  var cvs = document.getElementById('rhythmCanvas');
  if(!cvs) return;
  var ctx = cvs.getContext('2d');
  ctx.fillStyle = isDark() ? '#1a0a2e' : '#FFF0F5';
  ctx.fillRect(0,0,300,200);
  ctx.fillStyle = isDark() ? '#E91E63' : '#E91E63';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('시작 버튼을 눌러주세요!', 150, 100);
  ctx.font = '40px sans-serif';
  ctx.fillText('🎵', 150, 60);
}

window.startRhythm = function(){
  rhythmActive = true;
  rhythmScore = 0;
  rhythmNotes = [];
  var perfects = 0;
  var timeLeft = 30;
  var startBtn = document.getElementById('rhythmStartBtn');
  if(startBtn) startBtn.style.display = 'none';

  document.getElementById('rhythmScore').textContent = '0';
  document.getElementById('rhythmPerfect').textContent = '0';

  var cvs = document.getElementById('rhythmCanvas');
  if(!cvs) return;

  var interval = 60000 / rhythmBPM;
  var noteTimer = setInterval(function(){
    if(!rhythmActive) return;
    rhythmNotes.push({
      x: Math.random() * 240 + 30,
      y: 0,
      size: 20 + Math.random() * 10,
      color: ['#FF5FA2','#FFD700','#9C27B0','#4CAF50','#E91E63'][Math.floor(Math.random()*5)],
      alive: true,
      time: Date.now()
    });
  }, interval);

  var countdownTimer = setInterval(function(){
    timeLeft--;
    var el = document.getElementById('rhythmTime');
    if(el) el.textContent = timeLeft;
    if(timeLeft <= 0){
      clearInterval(countdownTimer);
      clearInterval(noteTimer);
      rhythmActive = false;
      var result = document.getElementById('rhythmResult');
      if(result){
        var grade = rhythmScore >= 500 ? 'S' : rhythmScore >= 300 ? 'A' : rhythmScore >= 150 ? 'B' : rhythmScore >= 50 ? 'C' : 'D';
        result.innerHTML = '&#x1F3B6; 결과: <b style="color:#E91E63">' + rhythmScore + '점</b> (등급: <b>' + grade + '</b>)';
      }
      try{
        var best = parseInt(localStorage.getItem('hatcuping_rhythm_best')||'0');
        if(rhythmScore > best) localStorage.setItem('hatcuping_rhythm_best', rhythmScore.toString());
      }catch(e){}
      checkV13Achievements();
    }
  }, 1000);

  rhythmTimer = {note: noteTimer, countdown: countdownTimer};

  cvs.addEventListener('click', function rhythmClick(e){
    if(!rhythmActive) return;
    var rect = cvs.getBoundingClientRect();
    var scale = 300 / rect.width;
    var mx = (e.clientX - rect.left) * scale;
    var my = (e.clientY - rect.top) * scale;

    for(var i = rhythmNotes.length - 1; i >= 0; i--){
      var n = rhythmNotes[i];
      if(!n.alive) continue;
      var dist = Math.sqrt((mx-n.x)*(mx-n.x) + (my-n.y)*(my-n.y));
      if(dist < n.size + 10){
        n.alive = false;
        var timing = Date.now() - n.time;
        if(timing < 400){
          rhythmScore += 20;
          perfects++;
          sfxV13('rhythm_perfect');
          document.getElementById('rhythmPerfect').textContent = perfects;
        } else {
          rhythmScore += 10;
          sfxV13('rhythm_hit');
        }
        document.getElementById('rhythmScore').textContent = rhythmScore;
        break;
      }
    }
  });

  function animateRhythm(){
    if(!rhythmActive && rhythmNotes.length === 0) return;
    var ctx2 = cvs.getContext('2d');
    ctx2.fillStyle = isDark() ? '#1a0a2e' : '#FFF0F5';
    ctx2.fillRect(0,0,300,200);

    ctx2.strokeStyle = 'rgba(233,30,99,.1)';
    ctx2.lineWidth = 1;
    ctx2.beginPath();
    ctx2.moveTo(0,170);
    ctx2.lineTo(300,170);
    ctx2.stroke();
    ctx2.fillStyle = 'rgba(233,30,99,.05)';
    ctx2.fillRect(0,160,300,30);

    for(var i = rhythmNotes.length - 1; i >= 0; i--){
      var n = rhythmNotes[i];
      if(!n.alive){ rhythmNotes.splice(i,1); continue; }
      n.y += 2;
      if(n.y > 210){
        sfxV13('rhythm_miss');
        rhythmNotes.splice(i,1);
        continue;
      }

      ctx2.beginPath();
      ctx2.arc(n.x, n.y, n.size/2, 0, Math.PI*2);
      ctx2.fillStyle = n.color;
      ctx2.fill();
      ctx2.strokeStyle = '#fff';
      ctx2.lineWidth = 2;
      ctx2.stroke();
    }

    if(rhythmActive) requestAnimationFrame(animateRhythm);
  }
  requestAnimationFrame(animateRhythm);
};

window.stopRhythm = function(){
  rhythmActive = false;
  if(rhythmTimer){
    clearInterval(rhythmTimer.note);
    clearInterval(rhythmTimer.countdown);
  }
};


// ============================================================
// 7. DAILY CHECK-IN (일일 출석 보상)
// ============================================================
function getCheckinData(){
  try{ return JSON.parse(localStorage.getItem('hatcuping_checkin') || '{"days":[],"streak":0,"lastDate":"","totalRewards":0}'); }
  catch(e){ return {days:[],streak:0,lastDate:'',totalRewards:0}; }
}
function saveCheckinData(d){ try{ localStorage.setItem('hatcuping_checkin', JSON.stringify(d)); }catch(e){} }

function openDailyCheckin(){
  if(document.getElementById('checkinModal')) return;
  trackV13Feature('checkin');
  sfxV13('checkin_open');

  var cd = getCheckinData();
  var today = new Date().toISOString().slice(0,10);
  var claimed = cd.lastDate === today;

  var overlay = document.createElement('div');
  overlay.id = 'checkinModal';
  overlay.className = 'modal-overlay show';
  overlay.setAttribute('role','dialog');

  var REWARDS = [5,5,10,10,15,15,30];

  var html = '<div class="modal" style="max-width:380px">';
  html += '<button class="modal-close" aria-label="닫기" onclick="document.getElementById(\'checkinModal\').remove()">&times;</button>';
  html += '<h3 style="color:#FF9800">&#x1F4C5; 일일 출석 보상</h3>';
  html += '<div style="text-align:center;margin-bottom:12px">';
  html += '<div style="font-size:32px;margin-bottom:4px">' + (cd.streak >= 7 ? '&#x1F525;' : '&#x2B50;') + '</div>';
  html += '<div style="font-size:14px;font-weight:800;color:#FF9800">' + cd.streak + '일 연속 출석!</div>';
  html += '<div style="font-size:11px;color:#888">총 보상: ' + cd.totalRewards + '코인</div>';
  html += '</div>';

  html += '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin-bottom:12px">';
  for(var d=0;d<7;d++){
    var dayActive = d < cd.streak;
    var isToday = d === (cd.streak % 7) && !claimed;
    html += '<div style="text-align:center;padding:8px 2px;border-radius:10px;background:' + (dayActive?'rgba(255,152,0,.15)':'rgba(0,0,0,.03)') + ';border:2px solid ' + (isToday?'#FF9800':(dayActive?'rgba(255,152,0,.3)':'transparent')) + '">';
    html += '<div style="font-size:14px">' + (dayActive?'&#x2705;':'&#x1F381;') + '</div>';
    html += '<div style="font-size:9px;font-weight:700;color:' + (dayActive?'#FF9800':'#888') + '">Day ' + (d+1) + '</div>';
    html += '<div style="font-size:9px;color:#888">+' + REWARDS[d] + '</div>';
    html += '</div>';
  }
  html += '</div>';

  if(!claimed){
    html += '<button onclick="claimCheckin()" style="width:100%;padding:12px;background:linear-gradient(135deg,#FF9800,#FF5722);color:#fff;border:none;border-radius:14px;font-size:14px;font-weight:700;cursor:pointer">&#x1F381; 오늘의 보상 받기!</button>';
  } else {
    html += '<div style="text-align:center;padding:12px;background:rgba(76,175,80,.08);border-radius:14px;font-size:13px;font-weight:700;color:#4CAF50">&#x2705; 오늘 보상을 받았어요! 내일 다시 오세요!</div>';
  }
  html += '</div>';

  overlay.innerHTML = html;
  overlay.addEventListener('click', function(e){ if(e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
}

window.claimCheckin = function(){
  var cd = getCheckinData();
  var today = new Date().toISOString().slice(0,10);
  if(cd.lastDate === today) return;

  var yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  var yStr = yesterday.toISOString().slice(0,10);

  if(cd.lastDate === yStr){
    cd.streak++;
  } else {
    cd.streak = 1;
  }

  var REWARDS = [5,5,10,10,15,15,30];
  var reward = REWARDS[(cd.streak - 1) % 7];
  cd.lastDate = today;
  cd.days.push(today);
  cd.totalRewards = (cd.totalRewards||0) + reward;
  saveCheckinData(cd);

  var gd = getGardenData();
  gd.coins = (gd.coins||0) + reward;
  saveGardenData(gd);

  sfxV13('checkin_claim');
  showToastV13('&#x1F381; 출석 보상 +' + reward + ' 코인!');
  var modal = document.getElementById('checkinModal');
  if(modal) modal.remove();
  openDailyCheckin();
  checkV13Achievements();
};


// ============================================================
// 8. CHARACTER RELATIONS (캐릭터 관계도 Canvas)
// ============================================================
var CHAR_RELATIONS = [
  {from:'로미',to:'하츄핑',type:'파트너',color:'#FF5FA2'},
  {from:'로미',to:'바로핑',type:'친구',color:'#FF3366'},
  {from:'하츄핑',to:'차차핑',type:'동료',color:'#FFD700'},
  {from:'하츄핑',to:'라라핑',type:'동료',color:'#9C27B0'},
  {from:'하츄핑',to:'꽁꽁핑',type:'라이벌',color:'#2196F3'},
  {from:'로미',to:'트러핑',type:'적대',color:'#F44336'},
  {from:'트러핑',to:'여왕핑',type:'반란',color:'#333'},
  {from:'여왕핑',to:'하츄핑',type:'보호',color:'#FFD700'},
  {from:'바로핑',to:'트러핑',type:'적대',color:'#F44336'},
  {from:'차차핑',to:'라라핑',type:'절친',color:'#E91E63'}
];

var CHAR_NODES = [
  {name:'로미',x:0.5,y:0.15,color:'#FF5FA2',icon:'&#x1F467;'},
  {name:'하츄핑',x:0.3,y:0.35,color:'#FF5FA2',icon:'&#x1F496;'},
  {name:'바로핑',x:0.7,y:0.35,color:'#FF3366',icon:'&#x2764;&#xFE0F;'},
  {name:'차차핑',x:0.15,y:0.55,color:'#FFD700',icon:'&#x1F49B;'},
  {name:'라라핑',x:0.45,y:0.6,color:'#9C27B0',icon:'&#x1F49C;'},
  {name:'꽁꽁핑',x:0.75,y:0.55,color:'#2196F3',icon:'&#x1F499;'},
  {name:'트러핑',x:0.3,y:0.8,color:'#333',icon:'&#x1F608;'},
  {name:'여왕핑',x:0.7,y:0.8,color:'#FFD700',icon:'&#x1F451;'}
];

function openCharRelations(){
  if(document.getElementById('relationsModal')) return;
  trackV13Feature('relations');
  sfxV13('relation_open');

  var overlay = document.createElement('div');
  overlay.id = 'relationsModal';
  overlay.className = 'modal-overlay show';
  overlay.setAttribute('role','dialog');

  var html = '<div class="modal" style="max-width:440px">';
  html += '<button class="modal-close" aria-label="닫기" onclick="document.getElementById(\'relationsModal\').remove()">&times;</button>';
  html += '<h3 style="color:#FF5FA2">&#x1F465; 캐릭터 관계도</h3>';
  html += '<canvas id="relationsCanvas" width="400" height="340" style="width:100%;max-width:400px;border-radius:12px;display:block;margin:0 auto"></canvas>';
  html += '<div style="display:flex;gap:8px;justify-content:center;margin-top:8px;flex-wrap:wrap">';
  ['파트너','친구','동료','라이벌','적대','절친','보호','반란'].forEach(function(t){
    var c = CHAR_RELATIONS.filter(function(r){return r.type===t})[0];
    html += '<span style="font-size:10px;padding:2px 6px;border-radius:6px;background:' + (c?c.color:'#888') + '15;color:' + (c?c.color:'#888') + '">' + t + '</span>';
  });
  html += '</div></div>';

  overlay.innerHTML = html;
  overlay.addEventListener('click', function(e){ if(e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);

  setTimeout(drawRelationsCanvas, 50);
}

function drawRelationsCanvas(){
  var cvs = document.getElementById('relationsCanvas');
  if(!cvs) return;
  var ctx = cvs.getContext('2d');
  var W = 400, H = 340;
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle = isDark() ? '#1a0a2e' : '#FFF5FA';
  ctx.fillRect(0,0,W,H);

  CHAR_RELATIONS.forEach(function(rel){
    var fromNode = CHAR_NODES.filter(function(n){return n.name===rel.from})[0];
    var toNode = CHAR_NODES.filter(function(n){return n.name===rel.to})[0];
    if(!fromNode || !toNode) return;

    ctx.beginPath();
    ctx.moveTo(fromNode.x*W, fromNode.y*H);
    ctx.lineTo(toNode.x*W, toNode.y*H);
    ctx.strokeStyle = rel.color + '60';
    ctx.lineWidth = 2;
    ctx.setLineDash(rel.type === '적대' ? [5,5] : []);
    ctx.stroke();
    ctx.setLineDash([]);

    var mx = (fromNode.x*W + toNode.x*W) / 2;
    var my = (fromNode.y*H + toNode.y*H) / 2;
    ctx.fillStyle = isDark() ? '#eee' : '#666';
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(rel.type, mx, my - 3);
  });

  CHAR_NODES.forEach(function(node){
    var x = node.x * W, y = node.y * H;

    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI*2);
    ctx.fillStyle = node.color + '30';
    ctx.fill();
    ctx.strokeStyle = node.color;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = isDark() ? '#eee' : '#333';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(node.name, x, y + 32);
  });
}


// ============================================================
// 9. QUIZ v5 (+15 questions, total 75)
// ============================================================
var QUIZ_V13 = [
  {q:'하츄핑이 처음 나타날 때 빛의 색깔은?',a:['분홍색','파란색','노란색','초록색'],c:0},
  {q:'요정의 정원에서 가장 오래 자라는 식물은?',a:['크리스탈꽃','장미','벚꽃','해바라기'],c:0},
  {q:'이모션 퍼즐의 그리드 크기는?',a:['6x6','5x5','8x8','4x4'],c:0},
  {q:'로얄 티니핑의 수는?',a:['5명','3명','7명','4명'],c:0},
  {q:'착한 요정 상점에서 가장 비싼 아이템은?',a:['화분 추가','요정의 날개','크리스탈꽃','도감 힌트'],c:0},
  {q:'스토리 극장의 총 챕터 수는?',a:['8챕터','6챕터','10챕터','5챕터'],c:0},
  {q:'일일 출석 7일차 보상은?',a:['30코인','20코인','50코인','15코인'],c:0},
  {q:'리듬 챌린지의 기본 BPM은?',a:['120','100','140','90'],c:0},
  {q:'트러핑 중 분노를 담당하는 캐릭터는?',a:['화나핑','트러핑','무서핑','게으핑'],c:0},
  {q:'티니핑 도감의 전설 등급 캐릭터는?',a:['여왕핑','하츄핑','바로핑','라라핑'],c:0},
  {q:'캐릭터 관계도에서 로미와 하츄핑의 관계는?',a:['파트너','친구','동료','보호'],c:0},
  {q:'정원의 허브 성장 시간은?',a:['1분','2분','3분','5분'],c:0},
  {q:'이모션 왕국의 여왕은?',a:['여왕핑','하츄핑','로미','라라핑'],c:0},
  {q:'3매치 퍼즐에서 5개 매치 시 점수 배율은?',a:['3배','2배','4배','5배'],c:0},
  {q:'v13에 새로 추가된 기능의 수는?',a:['8종','6종','10종','5종'],c:0}
];

function openQuizV13(){
  if(document.getElementById('quizV13Modal')) return;
  trackV13Feature('quiz_v13');
  sfxV13('quiz_v13');

  var qIdx = 0, score = 0;
  var shuffled = QUIZ_V13.slice().sort(function(){return Math.random()-.5}).slice(0,10);

  function renderQ(){
    var q = shuffled[qIdx];
    var modal = document.getElementById('quizV13Content');
    if(!modal) return;
    modal.innerHTML = '<div style="font-size:12px;color:#888;margin-bottom:8px">문제 ' + (qIdx+1) + '/10</div>' +
      '<div style="font-size:14px;font-weight:700;margin-bottom:12px;line-height:1.5">' + q.q + '</div>' +
      q.a.map(function(a,i){
        return '<button class="quiz-v13-btn" data-idx="'+i+'" style="width:100%;padding:10px;margin-bottom:6px;border-radius:12px;border:2px solid rgba(255,95,162,.15);background:transparent;font-size:13px;cursor:pointer;text-align:left;font-weight:600;color:inherit;transition:all .2s">' + a + '</button>';
      }).join('');

    modal.querySelectorAll('.quiz-v13-btn').forEach(function(btn){
      btn.addEventListener('click', function(){
        var chosen = parseInt(btn.dataset.idx);
        if(chosen === q.c){ score++; sfxV13('quiz_v13'); btn.style.background='rgba(76,175,80,.15)'; btn.style.borderColor='#4CAF50'; }
        else { sfxV13('rhythm_miss'); btn.style.background='rgba(244,67,54,.15)'; btn.style.borderColor='#F44336'; }
        modal.querySelectorAll('.quiz-v13-btn').forEach(function(b){b.disabled=true});
        setTimeout(function(){
          qIdx++;
          if(qIdx < shuffled.length) renderQ();
          else showQuizResult();
        }, 800);
      });
    });
  }

  function showQuizResult(){
    var modal = document.getElementById('quizV13Content');
    var grade = score >= 9 ? 'S' : score >= 7 ? 'A' : score >= 5 ? 'B' : score >= 3 ? 'C' : 'D';
    modal.innerHTML = '<div style="text-align:center;padding:20px">' +
      '<div style="font-size:40px;margin-bottom:8px">&#x1F3C6;</div>' +
      '<div style="font-size:18px;font-weight:800;color:#FF5FA2">퀴즈 완료!</div>' +
      '<div style="font-size:14px;margin:8px 0;color:#888">' + score + '/10 정답 (등급: <b>' + grade + '</b>)</div>' +
      '<button onclick="document.getElementById(\'quizV13Modal\').remove()" style="padding:10px 24px;background:linear-gradient(135deg,#FF5FA2,#B066FF);color:#fff;border:none;border-radius:14px;font-size:13px;font-weight:700;cursor:pointer">닫기</button></div>';
    checkV13Achievements();
  }

  var overlay = document.createElement('div');
  overlay.id = 'quizV13Modal';
  overlay.className = 'modal-overlay show';
  overlay.setAttribute('role','dialog');
  overlay.innerHTML = '<div class="modal" style="max-width:380px"><button class="modal-close" aria-label="닫기" onclick="document.getElementById(\'quizV13Modal\').remove()">&times;</button><h3 style="color:#FF5FA2">&#x1F4DD; 퀴즈 v5</h3><div id="quizV13Content"></div></div>';
  overlay.addEventListener('click', function(e){ if(e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
  renderQ();
}


// ============================================================
// 10. ACHIEVEMENTS v13 (+12, total 94)
// ============================================================
var V13_ACHIEVEMENTS = [
  {id:'garden_first',name:'첫 수확',desc:'정원에서 첫 식물을 수확',cat:'general',icon:'&#x1F33E;'},
  {id:'garden_10',name:'정원사',desc:'식물 10회 수확',cat:'general',icon:'&#x1F331;'},
  {id:'garden_master',name:'정원 마스터',desc:'모든 종류의 식물 수확',cat:'general',icon:'&#x1F33C;'},
  {id:'dex_5',name:'도감 탐험가',desc:'티니핑 5종 발견',cat:'general',icon:'&#x1F4D6;'},
  {id:'dex_all',name:'도감 마스터',desc:'전체 티니핑 발견',cat:'general',icon:'&#x1F3C6;'},
  {id:'puzzle_100',name:'퍼즐 입문',desc:'퍼즐 점수 100점 달성',cat:'general',icon:'&#x1F9E9;'},
  {id:'puzzle_500',name:'퍼즐 달인',desc:'퍼즐 점수 500점 달성',cat:'general',icon:'&#x1F947;'},
  {id:'shop_first',name:'첫 구매',desc:'상점에서 첫 아이템 구매',cat:'general',icon:'&#x1F6CD;&#xFE0F;'},
  {id:'story_all',name:'독서가',desc:'스토리 전체 챕터 읽기',cat:'general',icon:'&#x1F4DA;'},
  {id:'rhythm_s',name:'리듬왕',desc:'리듬 챌린지 S등급 달성',cat:'general',icon:'&#x1F3B6;'},
  {id:'checkin_7',name:'개근상',desc:'7일 연속 출석',cat:'general',icon:'&#x1F4C5;'},
  {id:'v13_explorer',name:'v13 탐험가',desc:'v13 기능 전체 사용',cat:'general',icon:'&#x1F680;'}
];

function checkV13Achievements(){
  try{
    var a = JSON.parse(localStorage.getItem('hatcuping_achievements') || '{}');
    var changed = false;

    var gd = getGardenData();
    if(gd.harvested >= 1 && !a.garden_first){ a.garden_first = Date.now(); changed = true; showToastV13('&#x1F3C6; 첫 수확 업적 달성!'); }
    if(gd.harvested >= 10 && !a.garden_10){ a.garden_10 = Date.now(); changed = true; showToastV13('&#x1F3C6; 정원사 업적 달성!'); }

    var dex = getDexData();
    var dexCount = Object.keys(dex).length;
    if(dexCount >= 5 && !a.dex_5){ a.dex_5 = Date.now(); changed = true; showToastV13('&#x1F3C6; 도감 탐험가 업적 달성!'); }
    if(dexCount >= DEX_ENTRIES.length && !a.dex_all){ a.dex_all = Date.now(); changed = true; showToastV13('&#x1F3C6; 도감 마스터 업적 달성!'); }

    var puzzleBest = parseInt(localStorage.getItem('hatcuping_puzzle_best') || '0');
    if(puzzleBest >= 100 && !a.puzzle_100){ a.puzzle_100 = Date.now(); changed = true; showToastV13('&#x1F3C6; 퍼즐 입문 업적 달성!'); }
    if(puzzleBest >= 500 && !a.puzzle_500){ a.puzzle_500 = Date.now(); changed = true; showToastV13('&#x1F3C6; 퍼즐 달인 업적 달성!'); }

    var sd = getShopData();
    if(sd.purchased.length >= 1 && !a.shop_first){ a.shop_first = Date.now(); changed = true; showToastV13('&#x1F3C6; 첫 구매 업적 달성!'); }

    var story = getStoryData();
    if(story.read.length >= STORY_CHAPTERS.length && !a.story_all){ a.story_all = Date.now(); changed = true; showToastV13('&#x1F3C6; 독서가 업적 달성!'); }

    var rhythmBest = parseInt(localStorage.getItem('hatcuping_rhythm_best') || '0');
    if(rhythmBest >= 500 && !a.rhythm_s){ a.rhythm_s = Date.now(); changed = true; showToastV13('&#x1F3C6; 리듬왕 업적 달성!'); }

    var checkin = getCheckinData();
    if(checkin.streak >= 7 && !a.checkin_7){ a.checkin_7 = Date.now(); changed = true; showToastV13('&#x1F3C6; 개근상 업적 달성!'); }

    var v13f = [];
    try{ v13f = JSON.parse(localStorage.getItem('hatcuping_v13_features') || '[]'); }catch(e){}
    if(v13f.length >= 8 && !a.v13_explorer){ a.v13_explorer = Date.now(); changed = true; showToastV13('&#x1F3C6; v13 탐험가 업적 달성!'); }

    if(changed){
      localStorage.setItem('hatcuping_achievements', JSON.stringify(a));
      var countEl = document.getElementById('achieveCount');
      if(countEl) countEl.textContent = Object.keys(a).length + '/' + (24 + 12 + 12 + 12 + 12);
    }
  }catch(e){}
}


// ============================================================
// 11. QUICK ACTION BUTTONS + KEYBOARD SHORTCUTS
// ============================================================
function injectV13QuickActions(){
  var existing = document.getElementById('v13-quick-actions');
  if(existing) return;

  var bar = document.createElement('div');
  bar.id = 'v13-quick-actions';
  bar.style.cssText = 'position:fixed;bottom:12px;left:50%;transform:translateX(-50%);display:flex;gap:6px;z-index:900;padding:6px 10px;background:rgba(255,255,255,.85);border-radius:20px;box-shadow:0 4px 20px rgba(0,0,0,.1);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);max-width:95vw;overflow-x:auto;-webkit-overflow-scrolling:touch';
  if(isDark()) bar.style.background = 'rgba(26,10,46,.85)';

  var actions = [
    {label:'&#x1F33C;',title:'정원',fn:openFairyGarden},
    {label:'&#x1F4D6;',title:'도감',fn:openDexTracker},
    {label:'&#x1F9E9;',title:'퍼즐',fn:openEmotionPuzzle},
    {label:'&#x1F3EA;',title:'상점',fn:openFairyShop},
    {label:'&#x1F3AD;',title:'스토리',fn:openStoryTheater},
    {label:'&#x1F3B6;',title:'리듬',fn:openRhythmChallenge},
    {label:'&#x1F4C5;',title:'출석',fn:openDailyCheckin},
    {label:'&#x1F465;',title:'관계도',fn:openCharRelations},
    {label:'&#x1F4DD;',title:'퀴즈v5',fn:openQuizV13}
  ];

  actions.forEach(function(a){
    var btn = document.createElement('button');
    btn.innerHTML = a.label;
    btn.title = a.title;
    btn.setAttribute('aria-label', a.title);
    btn.style.cssText = 'width:36px;height:36px;border-radius:50%;border:none;background:rgba(255,95,162,.08);cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;transition:all .2s;flex-shrink:0';
    btn.addEventListener('mouseenter', function(){ btn.style.transform='scale(1.15)'; btn.style.background='rgba(255,95,162,.2)'; });
    btn.addEventListener('mouseleave', function(){ btn.style.transform='scale(1)'; btn.style.background='rgba(255,95,162,.08)'; });
    btn.addEventListener('click', a.fn);
    bar.appendChild(btn);
  });

  document.body.appendChild(bar);
}

function bindV13Keys(){
  document.addEventListener('keydown', function(e){
    if(e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if(!e.shiftKey) return;
    switch(e.key){
      case 'Z': case 'z': e.preventDefault(); openFairyGarden(); break;
      case 'X': case 'x': e.preventDefault(); openDexTracker(); break;
      case 'E': case 'e': e.preventDefault(); openEmotionPuzzle(); break;
      case 'R': case 'r': e.preventDefault(); openFairyShop(); break;
      case 'H': case 'h': e.preventDefault(); openStoryTheater(); break;
      case 'N': case 'n': e.preventDefault(); openRhythmChallenge(); break;
      case 'O': case 'o': e.preventDefault(); openDailyCheckin(); break;
      case 'I': case 'i': e.preventDefault(); openCharRelations(); break;
    }
  });
}


// ============================================================
// INIT
// ============================================================
function initV13(){
  injectV13QuickActions();
  bindV13Keys();
  checkV13Achievements();

  var cd = getCheckinData();
  var today = new Date().toISOString().slice(0,10);
  if(cd.lastDate !== today){
    setTimeout(function(){
      showToastV13('&#x1F381; 오늘의 출석 보상이 기다리고 있어요!');
    }, 3000);
  }
}

if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', initV13);
} else {
  initV13();
}

})();

// hatcuping-game v19_patch.js - NEXTERA+PRISM AUTO v19.0
// Self-contained IIFE patch module (~1100 lines)
(function(){
'use strict';

// ============================================================
// SFX ENGINE (12 sound types)
// ============================================================
var _v19Ctx = null;
function _v19InitAudio(){
  if(!_v19Ctx){
    try{ _v19Ctx = new (window.AudioContext || window.webkitAudioContext)(); }catch(e){}
  }
  if(_v19Ctx && _v19Ctx.state === 'suspended') _v19Ctx.resume();
}

var V19_SFX = {
  collect_ping:{f:880,d:.08,t:'sine'},
  collect_rare:{f:1100,d:.15,t:'triangle'},
  shop_buy:{f:660,d:.06,t:'sine'},
  shop_coin:{f:1320,d:.1,t:'triangle'},
  type_hit:{f:350,d:.05,t:'square'},
  type_super:{f:1400,d:.12,t:'triangle'},
  timer_tick:{f:500,d:.03,t:'sine'},
  timer_finish:{f:1000,d:.18,t:'triangle'},
  train_up:{f:740,d:.07,t:'sine'},
  train_max:{f:1200,d:.14,t:'triangle'},
  craft_mix:{f:420,d:.06,t:'sine'},
  v19_feature:{f:900,d:.08,t:'triangle'}
};

function sfxV19(type){
  _v19InitAudio();
  if(!_v19Ctx) return;
  var s = V19_SFX[type];
  if(!s) return;
  try{
    var muted = false;
    try{ muted = localStorage.getItem('hatcuping_mute') === '1'; }catch(e){}
    if(muted) return;
    var osc = _v19Ctx.createOscillator();
    var gain = _v19Ctx.createGain();
    osc.type = s.t || 'sine';
    osc.frequency.value = s.f;
    gain.gain.value = 0.08;
    osc.connect(gain);
    gain.connect(_v19Ctx.destination);
    osc.start();
    osc.stop(_v19Ctx.currentTime + (s.d || 0.06));
  }catch(e){}
}


// ============================================================
// UTILITY FUNCTIONS
// ============================================================
function trackV19Feature(id){
  try{
    var saved = JSON.parse(localStorage.getItem('hatcuping_v19_features') || '[]');
    if(saved.indexOf(id) === -1){ saved.push(id); localStorage.setItem('hatcuping_v19_features', JSON.stringify(saved)); }
  }catch(e){}
}

function showToastV19(msg){
  var t = document.getElementById('achieveToast');
  if(t){ t.innerHTML = msg; t.classList.add('show'); setTimeout(function(){ t.classList.remove('show'); }, 2500); }
}

function v19Load(key, fallback){
  try{ var d = JSON.parse(localStorage.getItem(key)); return d !== null ? d : fallback; }catch(e){ return fallback; }
}

function v19Save(key, data){
  try{ localStorage.setItem(key, JSON.stringify(data)); }catch(e){}
}

function isDarkV19(){
  return document.body.classList.contains('dark');
}

function createV19Modal(title, content){
  var overlay = document.createElement('div');
  overlay.className = 'modal-overlay show';
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.6);z-index:999;display:flex;justify-content:center;align-items:center;backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px)';

  var dark = isDarkV19();
  var modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.cssText = 'background:'+(dark?'#2a1a3e':'#fff')+';border-radius:24px;padding:24px;max-width:440px;width:92%;max-height:82vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.25);position:relative;color:'+(dark?'#eee':'#333');

  var closeBtn = document.createElement('button');
  closeBtn.innerHTML = '&times;';
  closeBtn.style.cssText = 'position:absolute;top:12px;right:16px;background:none;border:none;font-size:24px;cursor:pointer;color:'+(dark?'#aaa':'#888')+';padding:4px';
  closeBtn.onclick = function(){ document.body.removeChild(overlay); };

  var h3 = document.createElement('h3');
  h3.innerHTML = title;
  h3.style.cssText = 'font-size:18px;margin-bottom:16px;color:#FF5FA2;display:flex;align-items:center;gap:8px';

  modal.appendChild(closeBtn);
  modal.appendChild(h3);

  var body = document.createElement('div');
  body.innerHTML = content;
  modal.appendChild(body);

  overlay.appendChild(modal);
  overlay.onclick = function(e){ if(e.target === overlay) document.body.removeChild(overlay); };
  document.body.appendChild(overlay);

  return {overlay:overlay, modal:modal, body:body};
}


// ============================================================
// 1. TINIPING COLLECTION BOOK (12 tiniping, Canvas pokedex style)
// ============================================================
var TINIPING_DEX = [
  {id:0,name:'하츄핑',type:'사랑',rarity:'S',hp:95,atk:80,def:85,spd:90,mag:95,emoji:'💗',color:'#FF5FA2'},
  {id:1,name:'바로핑',type:'정의',rarity:'S',hp:90,atk:95,def:80,spd:85,mag:75,emoji:'⚔️',color:'#4488FF'},
  {id:2,name:'아자핑',type:'용기',rarity:'A',hp:85,atk:90,def:75,spd:95,mag:70,emoji:'🔥',color:'#FF4444'},
  {id:3,name:'차차핑',type:'활력',rarity:'A',hp:80,atk:75,def:70,spd:100,mag:80,emoji:'⚡',color:'#FFD700'},
  {id:4,name:'해필핑',type:'행복',rarity:'A',hp:88,atk:70,def:80,spd:75,mag:90,emoji:'☀️',color:'#FF9800'},
  {id:5,name:'라라핑',type:'음악',rarity:'B',hp:75,atk:65,def:70,spd:80,mag:95,emoji:'🎵',color:'#AB47BC'},
  {id:6,name:'키키핑',type:'지혜',rarity:'B',hp:78,atk:60,def:85,spd:70,mag:100,emoji:'📖',color:'#2196F3'},
  {id:7,name:'무무핑',type:'평화',rarity:'B',hp:92,atk:55,def:95,spd:60,mag:80,emoji:'🌿',color:'#4CAF50'},
  {id:8,name:'또또핑',type:'호기심',rarity:'B',hp:70,atk:70,def:65,spd:90,mag:85,emoji:'🔍',color:'#00BCD4'},
  {id:9,name:'시러핑',type:'냉정',rarity:'A',hp:82,atk:85,def:90,spd:65,mag:75,emoji:'❄️',color:'#607D8B'},
  {id:10,name:'오로라핑',type:'희망',rarity:'S',hp:88,atk:75,def:80,spd:85,mag:100,emoji:'🌈',color:'#E91E63'},
  {id:11,name:'별핑',type:'꿈',rarity:'A',hp:76,atk:72,def:68,spd:88,mag:92,emoji:'⭐',color:'#9C27B0'}
];

function openTinipingDex(){
  trackV19Feature('dex');
  sfxV19('v19_feature');
  var dark = isDarkV19();
  var data = v19Load('hatcuping_dex', {collected:{},encounters:0});

  var html = '<div style="margin-bottom:8px"><canvas id="v19DexCanvas" width="540" height="380" style="width:100%;border-radius:12px;cursor:pointer"></canvas></div>';
  html += '<div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap;margin-bottom:8px">';
  html += '<button id="v19DexCollect" style="padding:6px 14px;border-radius:12px;border:2px solid #FF5FA2;background:rgba(255,95,162,.1);color:#FF5FA2;font-weight:700;font-size:12px;cursor:pointer">🎲 탐색하기</button>';
  html += '<button id="v19DexReset" style="padding:6px 14px;border-radius:12px;border:2px solid #ccc;background:rgba(0,0,0,.04);color:#888;font-weight:700;font-size:12px;cursor:pointer">초기화</button>';
  html += '</div>';
  html += '<div id="v19DexInfo" style="text-align:center;font-size:12px;color:var(--text-sub)">수집: '+Object.keys(data.collected).length+'/'+TINIPING_DEX.length+'</div>';

  var m = createV19Modal('📚 티니핑 도감', html);

  function drawDex(){
    var c = document.getElementById('v19DexCanvas');
    if(!c) return;
    var ctx = c.getContext('2d');
    var W = c.width, H = c.height;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = dark?'#1a1030':'#FFF5F8';
    ctx.fillRect(0,0,W,H);

    ctx.font = 'bold 14px sans-serif';
    ctx.fillStyle = dark?'#FF8EC4':'#FF5FA2';
    ctx.textAlign = 'center';
    ctx.fillText('📚 티니핑 도감 ('+Object.keys(data.collected).length+'/'+TINIPING_DEX.length+')', W/2, 22);

    var cols = 4, rows = 3;
    var cellW = (W - 40) / cols, cellH = (H - 60) / rows;
    var startX = 20, startY = 38;

    TINIPING_DEX.forEach(function(tp, i){
      var col = i % cols, row = Math.floor(i / cols);
      var cx = startX + col * cellW, cy = startY + row * cellH;
      var collected = !!data.collected[i];

      ctx.fillStyle = collected ? (tp.color + '18') : (dark?'rgba(255,255,255,.03)':'rgba(0,0,0,.02)');
      ctx.beginPath();
      if(ctx.roundRect) ctx.roundRect(cx+3, cy+3, cellW-6, cellH-6, 12);
      else { ctx.rect(cx+3, cy+3, cellW-6, cellH-6); }
      ctx.fill();

      ctx.strokeStyle = collected ? tp.color : (dark?'rgba(255,255,255,.08)':'rgba(0,0,0,.06)');
      ctx.lineWidth = collected ? 2 : 1;
      ctx.beginPath();
      if(ctx.roundRect) ctx.roundRect(cx+3, cy+3, cellW-6, cellH-6, 12);
      else { ctx.rect(cx+3, cy+3, cellW-6, cellH-6); }
      ctx.stroke();

      ctx.font = (collected ? '26' : '20') + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(collected ? tp.emoji : '❓', cx + cellW/2, cy + cellH/2 - 14);

      ctx.font = 'bold 10px sans-serif';
      ctx.fillStyle = collected ? (dark?'#eee':'#333') : (dark?'#555':'#bbb');
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(collected ? tp.name : '???', cx + cellW/2, cy + cellH/2 + 10);

      if(collected){
        var rarityColors = {S:'#FFD700',A:'#FF5FA2',B:'#4488FF'};
        ctx.font = 'bold 9px sans-serif';
        ctx.fillStyle = rarityColors[tp.rarity] || '#888';
        ctx.fillText(tp.rarity+'등급', cx + cellW/2, cy + cellH/2 + 24);

        ctx.font = '8px sans-serif';
        ctx.fillStyle = dark?'#aaa':'#888';
        ctx.fillText(tp.type, cx + cellW/2, cy + cellH/2 + 36);
      }
    });
  }

  drawDex();

  m.modal.querySelector('#v19DexCollect').onclick = function(){
    data.encounters++;
    var uncollected = [];
    for(var i=0;i<TINIPING_DEX.length;i++){
      if(!data.collected[i]) uncollected.push(i);
    }
    if(uncollected.length === 0){
      showToastV19('📚 모든 티니핑을 수집했어요!');
      return;
    }
    var idx = uncollected[Math.floor(Math.random() * uncollected.length)];
    var chance = TINIPING_DEX[idx].rarity === 'S' ? 0.3 : (TINIPING_DEX[idx].rarity === 'A' ? 0.5 : 0.7);
    if(Math.random() < chance){
      data.collected[idx] = true;
      sfxV19('collect_rare');
      showToastV19('✨ ' + TINIPING_DEX[idx].emoji + ' ' + TINIPING_DEX[idx].name + ' 발견!');
    } else {
      sfxV19('collect_ping');
      showToastV19('🔍 탐색 중... 다시 시도해보세요!');
    }
    v19Save('hatcuping_dex', data);
    drawDex();
    var info = document.getElementById('v19DexInfo');
    if(info) info.textContent = '수집: '+Object.keys(data.collected).length+'/'+TINIPING_DEX.length+' (탐색 '+data.encounters+'회)';
  };

  m.modal.querySelector('#v19DexReset').onclick = function(){
    data = {collected:{},encounters:0};
    v19Save('hatcuping_dex', data);
    drawDex();
    var info = document.getElementById('v19DexInfo');
    if(info) info.textContent = '수집: 0/'+TINIPING_DEX.length;
  };
}


// ============================================================
// 2. POWER-UP SHOP (8 items, coin system, Canvas)
// ============================================================
var SHOP_ITEMS = [
  {id:0,name:'별빛 방패',price:100,emoji:'🛡️',desc:'+방어력 20%',stat:'def',bonus:20},
  {id:1,name:'번개 부츠',price:80,emoji:'👟',desc:'+속도 25%',stat:'spd',bonus:25},
  {id:2,name:'불꽃 검',price:150,emoji:'🗡️',desc:'+공격력 30%',stat:'atk',bonus:30},
  {id:3,name:'힐링 오브',price:60,emoji:'💚',desc:'+HP 회복 50',stat:'hp',bonus:50},
  {id:4,name:'마법 지팡이',price:120,emoji:'🪄',desc:'+마법력 25%',stat:'mag',bonus:25},
  {id:5,name:'행운의 클로버',price:200,emoji:'🍀',desc:'드롭률 2배',stat:'luck',bonus:100},
  {id:6,name:'경험치 부적',price:90,emoji:'📿',desc:'XP 1.5배',stat:'xp',bonus:50},
  {id:7,name:'무적의 망토',price:250,emoji:'🧥',desc:'전체 스탯 +10%',stat:'all',bonus:10}
];

function openShop(){
  trackV19Feature('shop');
  sfxV19('v19_feature');
  var dark = isDarkV19();
  var data = v19Load('hatcuping_shop', {coins:500,purchased:{},totalSpent:0});

  var html = '<div style="text-align:center;margin-bottom:8px;font-size:14px;font-weight:700;color:#FFD700">💰 보유 코인: <span id="v19ShopCoins">'+data.coins+'</span></div>';
  html += '<canvas id="v19ShopCanvas" width="520" height="340" style="width:100%;border-radius:12px;cursor:pointer"></canvas>';
  html += '<div style="display:flex;gap:6px;justify-content:center;margin-top:8px">';
  html += '<button id="v19ShopEarn" style="padding:6px 14px;border-radius:12px;border:2px solid #FFD700;background:rgba(255,215,0,.1);color:#D4940A;font-weight:700;font-size:12px;cursor:pointer">💰 코인 획득 (+50)</button>';
  html += '</div>';
  html += '<div id="v19ShopInfo" style="text-align:center;font-size:11px;color:var(--text-sub);margin-top:6px">아이템을 탭하여 구매하세요</div>';

  var m = createV19Modal('🏪 파워업 상점', html);
  var selectedItem = -1;

  function drawShop(){
    var c = document.getElementById('v19ShopCanvas');
    if(!c) return;
    var ctx = c.getContext('2d');
    var W = c.width, H = c.height;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = dark?'#1a1030':'#FFFAF0';
    ctx.fillRect(0,0,W,H);

    ctx.font = 'bold 13px sans-serif';
    ctx.fillStyle = dark?'#FFD54F':'#FF9800';
    ctx.textAlign = 'center';
    ctx.fillText('🏪 파워업 아이템 상점', W/2, 20);

    var cols = 4, rows = 2;
    var cellW = (W-30)/cols, cellH = (H-50)/rows;
    var startX = 15, startY = 32;

    SHOP_ITEMS.forEach(function(item, i){
      var col = i%cols, row = Math.floor(i/cols);
      var cx = startX + col*cellW, cy = startY + row*cellH;
      var owned = !!data.purchased[i];
      var selected = selectedItem === i;

      ctx.fillStyle = owned ? (dark?'rgba(76,175,80,.12)':'rgba(76,175,80,.08)') :
                     selected ? (dark?'rgba(255,95,162,.15)':'rgba(255,95,162,.1)') :
                     (dark?'rgba(255,255,255,.04)':'rgba(0,0,0,.02)');
      ctx.beginPath();
      if(ctx.roundRect) ctx.roundRect(cx+3,cy+3,cellW-6,cellH-6,12);
      else ctx.rect(cx+3,cy+3,cellW-6,cellH-6);
      ctx.fill();

      ctx.strokeStyle = owned ? '#4CAF50' : (selected ? '#FF5FA2' : (dark?'rgba(255,255,255,.08)':'rgba(0,0,0,.06)'));
      ctx.lineWidth = selected ? 2 : 1;
      ctx.beginPath();
      if(ctx.roundRect) ctx.roundRect(cx+3,cy+3,cellW-6,cellH-6,12);
      else ctx.rect(cx+3,cy+3,cellW-6,cellH-6);
      ctx.stroke();

      ctx.font = '28px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(item.emoji, cx+cellW/2, cy+cellH/2-30);

      ctx.font = 'bold 11px sans-serif';
      ctx.fillStyle = dark?'#eee':'#333';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(item.name, cx+cellW/2, cy+cellH/2);

      ctx.font = '9px sans-serif';
      ctx.fillStyle = dark?'#aaa':'#888';
      ctx.fillText(item.desc, cx+cellW/2, cy+cellH/2+14);

      if(owned){
        ctx.font = 'bold 10px sans-serif';
        ctx.fillStyle = '#4CAF50';
        ctx.fillText('✅ 구매완료', cx+cellW/2, cy+cellH/2+30);
      } else {
        ctx.font = 'bold 10px sans-serif';
        ctx.fillStyle = data.coins >= item.price ? '#FFD700' : '#F44336';
        ctx.fillText('💰 '+item.price, cx+cellW/2, cy+cellH/2+30);
      }
    });
  }

  drawShop();

  var canvas = document.getElementById('v19ShopCanvas');
  if(canvas){
    canvas.onclick = function(e){
      var rect = canvas.getBoundingClientRect();
      var scaleX = canvas.width/rect.width;
      var scaleY = canvas.height/rect.height;
      var mx = (e.clientX-rect.left)*scaleX;
      var my = (e.clientY-rect.top)*scaleY;

      var cols=4, cellW=(canvas.width-30)/cols, cellH=(canvas.height-50)/2;
      var startX=15, startY=32;

      for(var i=0;i<SHOP_ITEMS.length;i++){
        var col=i%cols, row=Math.floor(i/cols);
        var cx=startX+col*cellW, cy=startY+row*cellH;
        if(mx>=cx&&mx<=cx+cellW&&my>=cy&&my<=cy+cellH){
          if(data.purchased[i]){
            showToastV19('이미 구매한 아이템입니다!');
          } else if(data.coins >= SHOP_ITEMS[i].price){
            data.coins -= SHOP_ITEMS[i].price;
            data.purchased[i] = true;
            data.totalSpent += SHOP_ITEMS[i].price;
            v19Save('hatcuping_shop', data);
            sfxV19('shop_buy');
            showToastV19('🛒 '+SHOP_ITEMS[i].emoji+' '+SHOP_ITEMS[i].name+' 구매 완료!');
            document.getElementById('v19ShopCoins').textContent = data.coins;
          } else {
            sfxV19('shop_coin');
            showToastV19('💰 코인이 부족합니다! (필요: '+SHOP_ITEMS[i].price+')');
          }
          selectedItem = i;
          drawShop();
          break;
        }
      }
    };
  }

  m.modal.querySelector('#v19ShopEarn').onclick = function(){
    data.coins += 50;
    v19Save('hatcuping_shop', data);
    sfxV19('shop_coin');
    document.getElementById('v19ShopCoins').textContent = data.coins;
    showToastV19('💰 +50 코인 획득! (총: '+data.coins+')');
  };
}


// ============================================================
// 3. TYPE MATCHUP CHART (6 types, Canvas effectiveness grid)
// ============================================================
var TYPES = [
  {name:'사랑',emoji:'💗',color:'#FF5FA2'},
  {name:'용기',emoji:'🔥',color:'#FF4444'},
  {name:'지혜',emoji:'📖',color:'#2196F3'},
  {name:'활력',emoji:'⚡',color:'#FFD700'},
  {name:'평화',emoji:'🌿',color:'#4CAF50'},
  {name:'냉정',emoji:'❄️',color:'#607D8B'}
];

var TYPE_CHART = [
  [1, 1, 2, 1, 0.5, 1],
  [1, 0.5, 1, 2, 1, 0.5],
  [0.5, 1, 1, 0.5, 1, 2],
  [1, 0.5, 2, 1, 1, 0.5],
  [2, 1, 1, 1, 0.5, 1],
  [1, 2, 0.5, 2, 1, 1]
];

function openTypeChart(){
  trackV19Feature('typechart');
  sfxV19('v19_feature');
  var dark = isDarkV19();

  var html = '<canvas id="v19TypeCanvas" width="500" height="360" style="width:100%;border-radius:12px"></canvas>';
  html += '<div style="text-align:center;font-size:11px;color:var(--text-sub);margin-top:6px">🔴 효과적(x2) / 🟢 보통(x1) / 🔵 비효과적(x0.5)</div>';

  createV19Modal('⚔️ 속성 상성표', html);

  var c = document.getElementById('v19TypeCanvas');
  if(!c) return;
  var ctx = c.getContext('2d');
  var W = c.width, H = c.height;
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle = dark?'#1a1030':'#FFF8F0';
  ctx.fillRect(0,0,W,H);

  ctx.font = 'bold 13px sans-serif';
  ctx.fillStyle = dark?'#FF8EC4':'#FF5FA2';
  ctx.textAlign = 'center';
  ctx.fillText('⚔️ 티니핑 속성 상성표', W/2, 22);

  var gridSize = 6;
  var cellW = 58, cellH = 42;
  var startX = 90, startY = 50;

  ctx.font = 'bold 10px sans-serif';
  ctx.fillStyle = dark?'#aaa':'#666';
  ctx.textAlign = 'center';
  ctx.fillText('공격 →', startX + gridSize*cellW/2, startY - 14);
  ctx.save();
  ctx.translate(startX - 30, startY + gridSize*cellH/2);
  ctx.rotate(-Math.PI/2);
  ctx.fillText('방어 →', 0, 0);
  ctx.restore();

  TYPES.forEach(function(t, i){
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(t.emoji, startX + i*cellW + cellW/2, startY - 2);

    ctx.fillText(t.emoji, startX - 18, startY + i*cellH + cellH/2 + 4);
  });

  for(var row=0;row<gridSize;row++){
    for(var col=0;col<gridSize;col++){
      var val = TYPE_CHART[row][col];
      var cx = startX + col*cellW, cy = startY + row*cellH;

      ctx.fillStyle = val === 2 ? (dark?'rgba(244,67,54,.2)':'rgba(244,67,54,.12)') :
                     val === 0.5 ? (dark?'rgba(33,150,243,.2)':'rgba(33,150,243,.12)') :
                     (dark?'rgba(255,255,255,.04)':'rgba(0,0,0,.02)');
      ctx.fillRect(cx+1, cy+1, cellW-2, cellH-2);

      ctx.strokeStyle = dark?'rgba(255,255,255,.06)':'rgba(0,0,0,.06)';
      ctx.lineWidth = 1;
      ctx.strokeRect(cx+1, cy+1, cellW-2, cellH-2);

      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = val === 2 ? '#F44336' : val === 0.5 ? '#2196F3' : (dark?'#888':'#999');
      ctx.fillText(val === 2 ? 'x2' : val === 0.5 ? 'x0.5' : 'x1', cx+cellW/2, cy+cellH/2);
    }
  }

  ctx.font = '10px sans-serif';
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  var legendY = startY + gridSize*cellH + 20;
  var tips = [
    '💗사랑 → 📖지혜에 강함 / 🌿평화에 약함',
    '🔥용기 → ⚡활력에 강함 / ❄️냉정에 약함',
    '📖지혜 → ❄️냉정에 강함 / 💗사랑에 약함'
  ];
  tips.forEach(function(tip, i){
    ctx.fillStyle = dark?'#aaa':'#666';
    ctx.fillText(tip, 20, legendY + i*16);
  });
}


// ============================================================
// 4. SPEEDRUN TIMER (10 stages, Canvas time attack board)
// ============================================================
function openSpeedrun(){
  trackV19Feature('speedrun');
  sfxV19('v19_feature');
  var dark = isDarkV19();
  var data = v19Load('hatcuping_speedrun', {bestTimes:{},attempts:0,totalTime:0});

  var STAGES = ['하트 마을','별빛 숲','용기의 산','지혜의 호수','무지개 다리','천사의 탑','꿈의 협곡','별빛 전망대','사랑의 정원','비밀의 동굴'];

  var html = '<canvas id="v19SpeedCanvas" width="540" height="360" style="width:100%;border-radius:12px"></canvas>';
  html += '<div style="display:flex;gap:6px;justify-content:center;margin-top:8px">';
  html += '<button id="v19SpeedRun" style="padding:6px 14px;border-radius:12px;border:2px solid #FF4444;background:rgba(244,67,54,.1);color:#FF4444;font-weight:700;font-size:12px;cursor:pointer">⏱️ 스피드런 시작</button>';
  html += '</div>';

  var m = createV19Modal('⏱️ 스피드런 타이머', html);

  function drawSpeedrun(){
    var c = document.getElementById('v19SpeedCanvas');
    if(!c) return;
    var ctx = c.getContext('2d');
    var W = c.width, H = c.height;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = dark?'#1a0a20':'#FFF5F5';
    ctx.fillRect(0,0,W,H);

    ctx.font = 'bold 14px sans-serif';
    ctx.fillStyle = dark?'#FF8EC4':'#FF5FA2';
    ctx.textAlign = 'center';
    ctx.fillText('⏱️ 스피드런 기록표', W/2, 22);

    var barW = W - 80, barH = 24, startX = 70, startY = 44;

    STAGES.forEach(function(stage, i){
      var y = startY + i * 30;
      var best = data.bestTimes[i] || 0;
      var maxTime = 120;

      ctx.font = 'bold 10px sans-serif';
      ctx.fillStyle = dark?'#ccc':'#555';
      ctx.textAlign = 'right';
      ctx.fillText((i+1)+'. '+stage, startX - 6, y + barH/2 + 4);

      ctx.fillStyle = dark?'rgba(255,255,255,.04)':'rgba(0,0,0,.03)';
      ctx.beginPath();
      if(ctx.roundRect) ctx.roundRect(startX, y, barW, barH, 6);
      else ctx.rect(startX, y, barW, barH);
      ctx.fill();

      if(best > 0){
        var fillW = Math.min(best/maxTime, 1) * barW;
        var barColor = best < 30 ? '#4CAF50' : best < 60 ? '#FF9800' : '#F44336';
        ctx.fillStyle = barColor + '44';
        ctx.beginPath();
        if(ctx.roundRect) ctx.roundRect(startX, y, fillW, barH, 6);
        else ctx.rect(startX, y, fillW, barH);
        ctx.fill();

        ctx.font = 'bold 11px sans-serif';
        ctx.fillStyle = barColor;
        ctx.textAlign = 'left';
        ctx.fillText(best.toFixed(1)+'초', startX + fillW + 6, y + barH/2 + 4);
      } else {
        ctx.font = '10px sans-serif';
        ctx.fillStyle = dark?'#555':'#ccc';
        ctx.textAlign = 'center';
        ctx.fillText('미도전', startX + barW/2, y + barH/2 + 4);
      }
    });

    var totalBest = 0, completed = 0;
    for(var k in data.bestTimes){ totalBest += data.bestTimes[k]; completed++; }
    ctx.font = 'bold 12px sans-serif';
    ctx.fillStyle = dark?'#FFD54F':'#FF9800';
    ctx.textAlign = 'center';
    ctx.fillText('총 기록: '+(totalBest > 0 ? totalBest.toFixed(1)+'초' : '-')+' | 완료: '+completed+'/'+STAGES.length+' | 시도: '+data.attempts+'회', W/2, H-12);
  }

  drawSpeedrun();

  m.modal.querySelector('#v19SpeedRun').onclick = function(){
    data.attempts++;
    for(var i=0;i<STAGES.length;i++){
      var time = 15 + Math.random() * 80;
      if(!data.bestTimes[i] || time < data.bestTimes[i]){
        data.bestTimes[i] = Math.round(time * 10) / 10;
      }
    }
    v19Save('hatcuping_speedrun', data);
    sfxV19('timer_finish');
    showToastV19('⏱️ 스피드런 완료! 기록이 갱신되었습니다!');
    drawSpeedrun();
  };
}


// ============================================================
// 5. CHARACTER TRAINING CENTER (6 stats, training simulator Canvas)
// ============================================================
var TRAIN_STATS = ['HP','공격','방어','속도','마법','운'];
var TRAIN_COLORS = ['#F44336','#FF9800','#2196F3','#FFD700','#AB47BC','#4CAF50'];

function openTrainingCenter(){
  trackV19Feature('training');
  sfxV19('v19_feature');
  var dark = isDarkV19();
  var data = v19Load('hatcuping_training', {stats:[10,10,10,10,10,10],sessions:0,totalGain:0});

  var html = '<canvas id="v19TrainCanvas" width="500" height="380" style="width:100%;border-radius:12px"></canvas>';
  html += '<div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap;margin-top:8px">';
  for(var i=0;i<TRAIN_STATS.length;i++){
    html += '<button class="v19TrainBtn" data-stat="'+i+'" style="padding:5px 10px;border-radius:10px;border:2px solid '+TRAIN_COLORS[i]+';background:'+TRAIN_COLORS[i]+'18;color:'+TRAIN_COLORS[i]+';font-weight:700;font-size:11px;cursor:pointer">'+TRAIN_STATS[i]+' 훈련</button>';
  }
  html += '</div>';
  html += '<div id="v19TrainInfo" style="text-align:center;font-size:11px;color:var(--text-sub);margin-top:6px">훈련 세션: '+data.sessions+'회</div>';

  var m = createV19Modal('💪 트레이닝 센터', html);

  function drawTraining(){
    var c = document.getElementById('v19TrainCanvas');
    if(!c) return;
    var ctx = c.getContext('2d');
    var W = c.width, H = c.height;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = dark?'#1a1030':'#F5F5FF';
    ctx.fillRect(0,0,W,H);

    ctx.font = 'bold 14px sans-serif';
    ctx.fillStyle = dark?'#FF8EC4':'#FF5FA2';
    ctx.textAlign = 'center';
    ctx.fillText('💪 캐릭터 능력치 훈련', W/2, 22);

    var cx = W/2, cy = H/2 - 10, radius = 120;
    var n = TRAIN_STATS.length;

    for(var ring=1;ring<=5;ring++){
      var r = radius * ring/5;
      ctx.beginPath();
      for(var j=0;j<=n;j++){
        var angle = (Math.PI*2/n)*j - Math.PI/2;
        var px = cx + r*Math.cos(angle);
        var py = cy + r*Math.sin(angle);
        if(j===0) ctx.moveTo(px,py);
        else ctx.lineTo(px,py);
      }
      ctx.strokeStyle = dark?'rgba(255,255,255,.06)':'rgba(0,0,0,.05)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    for(var j=0;j<n;j++){
      var angle = (Math.PI*2/n)*j - Math.PI/2;
      ctx.beginPath();
      ctx.moveTo(cx,cy);
      ctx.lineTo(cx+radius*Math.cos(angle), cy+radius*Math.sin(angle));
      ctx.strokeStyle = dark?'rgba(255,255,255,.08)':'rgba(0,0,0,.06)';
      ctx.lineWidth = 1;
      ctx.stroke();

      var labelR = radius + 20;
      ctx.font = 'bold 11px sans-serif';
      ctx.fillStyle = TRAIN_COLORS[j];
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(TRAIN_STATS[j]+' ('+data.stats[j]+')', cx+labelR*Math.cos(angle), cy+labelR*Math.sin(angle));
    }

    ctx.beginPath();
    for(var j=0;j<=n;j++){
      var idx = j % n;
      var angle = (Math.PI*2/n)*idx - Math.PI/2;
      var val = Math.min(data.stats[idx]/100, 1);
      var px = cx + radius*val*Math.cos(angle);
      var py = cy + radius*val*Math.sin(angle);
      if(j===0) ctx.moveTo(px,py);
      else ctx.lineTo(px,py);
    }
    ctx.fillStyle = 'rgba(255,95,162,.15)';
    ctx.fill();
    ctx.strokeStyle = '#FF5FA2';
    ctx.lineWidth = 2;
    ctx.stroke();

    for(var j=0;j<n;j++){
      var angle = (Math.PI*2/n)*j - Math.PI/2;
      var val = Math.min(data.stats[j]/100, 1);
      ctx.beginPath();
      ctx.arc(cx+radius*val*Math.cos(angle), cy+radius*val*Math.sin(angle), 4, 0, Math.PI*2);
      ctx.fillStyle = TRAIN_COLORS[j];
      ctx.fill();
    }

    var totalStat = 0;
    data.stats.forEach(function(s){ totalStat += s; });
    var grade = totalStat >= 500 ? 'S' : totalStat >= 400 ? 'A' : totalStat >= 300 ? 'B' : totalStat >= 200 ? 'C' : 'D';
    var gradeColor = {S:'#FFD700',A:'#FF5FA2',B:'#4488FF',C:'#4CAF50',D:'#888'};
    ctx.font = 'bold 14px sans-serif';
    ctx.fillStyle = gradeColor[grade];
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('종합 등급: '+grade+' ('+totalStat+'/600)', W/2, H-12);
  }

  drawTraining();

  var trainBtns = m.modal.querySelectorAll('.v19TrainBtn');
  for(var i=0;i<trainBtns.length;i++){
    trainBtns[i].onclick = function(){
      var statIdx = parseInt(this.getAttribute('data-stat'));
      var gain = 3 + Math.floor(Math.random() * 8);
      data.stats[statIdx] = Math.min(data.stats[statIdx] + gain, 100);
      data.sessions++;
      data.totalGain += gain;
      v19Save('hatcuping_training', data);
      sfxV19(data.stats[statIdx] >= 100 ? 'train_max' : 'train_up');
      showToastV19('💪 '+TRAIN_STATS[statIdx]+' +'+gain+'! (현재: '+data.stats[statIdx]+')');
      drawTraining();
      var info = document.getElementById('v19TrainInfo');
      if(info) info.textContent = '훈련 세션: '+data.sessions+'회 | 총 성장: +'+data.totalGain;
    };
  }
}


// ============================================================
// 6. BOSS WEAKNESS ANALYZER (8 bosses, 6-axis Radar Canvas)
// ============================================================
var BOSSES = [
  {name:'그림자 왕',stats:[85,90,70,60,80,40],emoji:'👿',weakness:'사랑',color:'#333'},
  {name:'폭풍의 마녀',stats:[70,65,50,95,90,75],emoji:'🌪️',weakness:'평화',color:'#6A1B9A'},
  {name:'얼음 거인',stats:[95,80,95,30,60,50],emoji:'🧊',weakness:'용기',color:'#0D47A1'},
  {name:'불꽃 드래곤',stats:[80,95,60,70,85,45],emoji:'🐉',weakness:'냉정',color:'#BF360C'},
  {name:'어둠의 기사',stats:[75,88,85,65,55,60],emoji:'🗡️',weakness:'지혜',color:'#424242'},
  {name:'독안개 요정',stats:[55,60,45,90,75,95],emoji:'🧚',weakness:'활력',color:'#1B5E20'},
  {name:'시간의 수호자',stats:[90,70,80,80,95,70],emoji:'⏳',weakness:'용기',color:'#4A148C'},
  {name:'최종 보스: 절망',stats:[95,95,90,85,95,80],emoji:'💀',weakness:'사랑',color:'#B71C1C'}
];

function openBossAnalyzer(){
  trackV19Feature('bossanalyzer');
  sfxV19('v19_feature');
  var dark = isDarkV19();
  var currentBoss = 0;

  var html = '<div style="display:flex;gap:4px;justify-content:center;flex-wrap:wrap;margin-bottom:8px">';
  BOSSES.forEach(function(b,i){
    html += '<button class="v19BossBtn" data-boss="'+i+'" style="padding:4px 8px;border-radius:8px;border:1px solid '+(i===0?'#FF5FA2':'#ccc')+';background:'+(i===0?'rgba(255,95,162,.1)':'transparent')+';font-size:11px;cursor:pointer">'+b.emoji+' '+b.name+'</button>';
  });
  html += '</div>';
  html += '<canvas id="v19BossCanvas" width="480" height="360" style="width:100%;border-radius:12px"></canvas>';

  var m = createV19Modal('🎯 보스 약점 분석기', html);

  function drawBoss(){
    var c = document.getElementById('v19BossCanvas');
    if(!c) return;
    var ctx = c.getContext('2d');
    var W = c.width, H = c.height;
    var boss = BOSSES[currentBoss];
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = dark?'#1a0a20':'#FFF5F5';
    ctx.fillRect(0,0,W,H);

    ctx.font = 'bold 14px sans-serif';
    ctx.fillStyle = dark?'#FF8EC4':'#FF5FA2';
    ctx.textAlign = 'center';
    ctx.fillText(boss.emoji+' '+boss.name+' 분석', W/2, 22);

    var axes = ['HP','공격','방어','속도','마법','운'];
    var cx = W/2, cy = H/2, radius = 110;
    var n = axes.length;

    for(var ring=1;ring<=5;ring++){
      var r = radius*ring/5;
      ctx.beginPath();
      for(var j=0;j<=n;j++){
        var angle = (Math.PI*2/n)*(j%n) - Math.PI/2;
        var px = cx+r*Math.cos(angle), py = cy+r*Math.sin(angle);
        if(j===0) ctx.moveTo(px,py); else ctx.lineTo(px,py);
      }
      ctx.strokeStyle = dark?'rgba(255,255,255,.06)':'rgba(0,0,0,.05)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    for(var j=0;j<n;j++){
      var angle = (Math.PI*2/n)*j - Math.PI/2;
      ctx.beginPath();
      ctx.moveTo(cx,cy);
      ctx.lineTo(cx+radius*Math.cos(angle), cy+radius*Math.sin(angle));
      ctx.strokeStyle = dark?'rgba(255,255,255,.08)':'rgba(0,0,0,.06)';
      ctx.stroke();

      var labelR = radius + 18;
      ctx.font = 'bold 11px sans-serif';
      ctx.fillStyle = dark?'#ccc':'#555';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(axes[j]+' ('+boss.stats[j]+')', cx+labelR*Math.cos(angle), cy+labelR*Math.sin(angle));
    }

    ctx.beginPath();
    for(var j=0;j<=n;j++){
      var idx = j%n;
      var angle = (Math.PI*2/n)*idx - Math.PI/2;
      var val = boss.stats[idx]/100;
      var px = cx+radius*val*Math.cos(angle), py = cy+radius*val*Math.sin(angle);
      if(j===0) ctx.moveTo(px,py); else ctx.lineTo(px,py);
    }
    ctx.fillStyle = boss.color+'22';
    ctx.fill();
    ctx.strokeStyle = boss.color;
    ctx.lineWidth = 2;
    ctx.stroke();

    for(var j=0;j<n;j++){
      var angle = (Math.PI*2/n)*j - Math.PI/2;
      var val = boss.stats[j]/100;
      ctx.beginPath();
      ctx.arc(cx+radius*val*Math.cos(angle), cy+radius*val*Math.sin(angle), 4, 0, Math.PI*2);
      ctx.fillStyle = boss.stats[j] < 60 ? '#F44336' : (boss.stats[j] >= 90 ? '#4CAF50' : '#FF9800');
      ctx.fill();
    }

    ctx.font = 'bold 12px sans-serif';
    ctx.fillStyle = '#F44336';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('⚡ 약점 속성: '+boss.weakness+' | 총합: '+boss.stats.reduce(function(a,b){return a+b;},0)+'/600', W/2, H-12);
  }

  drawBoss();

  var bossBtns = m.modal.querySelectorAll('.v19BossBtn');
  for(var i=0;i<bossBtns.length;i++){
    bossBtns[i].onclick = function(){
      currentBoss = parseInt(this.getAttribute('data-boss'));
      sfxV19('type_hit');
      for(var j=0;j<bossBtns.length;j++){
        bossBtns[j].style.borderColor = '#ccc';
        bossBtns[j].style.background = 'transparent';
      }
      this.style.borderColor = '#FF5FA2';
      this.style.background = 'rgba(255,95,162,.1)';
      drawBoss();
    };
  }
}


// ============================================================
// 7. ITEM CRAFTING WORKSHOP (12 materials, recipe system Canvas)
// ============================================================
var CRAFT_MATERIALS = [
  {name:'별의 조각',emoji:'⭐',color:'#FFD700'},
  {name:'마법 물약',emoji:'🧪',color:'#AB47BC'},
  {name:'하트 크리스탈',emoji:'💎',color:'#FF5FA2'},
  {name:'숲의 이슬',emoji:'🌿',color:'#4CAF50'},
  {name:'용기의 불꽃',emoji:'🔥',color:'#FF4444'},
  {name:'지혜의 잉크',emoji:'📖',color:'#2196F3'}
];

var CRAFT_RECIPES = [
  {name:'무지개 검',materials:[0,4],emoji:'⚔️',desc:'공격+30, 속성:전체'},
  {name:'치유의 반지',materials:[1,3],emoji:'💍',desc:'HP자동회복'},
  {name:'사랑의 펜던트',materials:[2,0],emoji:'📿',desc:'사랑 속성+50%'},
  {name:'현자의 로브',materials:[5,1],emoji:'🧙',desc:'마법+40'},
  {name:'자연의 갑옷',materials:[3,4],emoji:'🛡️',desc:'방어+35, 독면역'},
  {name:'영웅의 부츠',materials:[4,0],emoji:'👢',desc:'속도+45'},
  {name:'비밀의 열쇠',materials:[2,5],emoji:'🗝️',desc:'숨겨진 보스 해제'},
  {name:'운명의 주사위',materials:[0,1,2,3,4,5],emoji:'🎲',desc:'랜덤 효과 (최강)'}
];

function openCraftWorkshop(){
  trackV19Feature('crafting');
  sfxV19('v19_feature');
  var dark = isDarkV19();
  var data = v19Load('hatcuping_crafting', {crafted:{},materials:{},totalCraft:0});

  var html = '<canvas id="v19CraftCanvas" width="540" height="380" style="width:100%;border-radius:12px;cursor:pointer"></canvas>';
  html += '<div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap;margin-top:8px">';
  html += '<button id="v19CraftGather" style="padding:6px 14px;border-radius:12px;border:2px solid #4CAF50;background:rgba(76,175,80,.1);color:#4CAF50;font-weight:700;font-size:12px;cursor:pointer">🌿 재료 수집</button>';
  html += '<button id="v19CraftAuto" style="padding:6px 14px;border-radius:12px;border:2px solid #FF9800;background:rgba(255,152,0,.1);color:#FF9800;font-weight:700;font-size:12px;cursor:pointer">⚒️ 자동 제작</button>';
  html += '</div>';
  html += '<div id="v19CraftInfo" style="text-align:center;font-size:11px;color:var(--text-sub);margin-top:6px">제작 완료: '+Object.keys(data.crafted).length+'/'+CRAFT_RECIPES.length+'</div>';

  var m = createV19Modal('⚒️ 아이템 합성 공방', html);

  function drawCraft(){
    var c = document.getElementById('v19CraftCanvas');
    if(!c) return;
    var ctx = c.getContext('2d');
    var W = c.width, H = c.height;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = dark?'#1a1020':'#FFF8F0';
    ctx.fillRect(0,0,W,H);

    ctx.font = 'bold 13px sans-serif';
    ctx.fillStyle = dark?'#FFD54F':'#FF9800';
    ctx.textAlign = 'center';
    ctx.fillText('⚒️ 아이템 합성 공방', W/2, 20);

    ctx.font = 'bold 11px sans-serif';
    ctx.fillStyle = dark?'#aaa':'#666';
    ctx.textAlign = 'left';
    ctx.fillText('📦 보유 재료:', 16, 42);

    CRAFT_MATERIALS.forEach(function(mat, i){
      var mx = 16 + i * 86;
      var count = data.materials[i] || 0;
      ctx.fillStyle = mat.color + '18';
      ctx.beginPath();
      if(ctx.roundRect) ctx.roundRect(mx, 50, 80, 36, 8);
      else ctx.rect(mx, 50, 80, 36);
      ctx.fill();
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(mat.emoji, mx+20, 74);
      ctx.font = 'bold 10px sans-serif';
      ctx.fillStyle = dark?'#ccc':'#444';
      ctx.fillText(count+'개', mx+56, 74);
    });

    ctx.font = 'bold 11px sans-serif';
    ctx.fillStyle = dark?'#aaa':'#666';
    ctx.textAlign = 'left';
    ctx.fillText('📜 레시피:', 16, 106);

    var cols = 2, cellW = (W-30)/cols, cellH = 56;
    var startX = 15, startY = 114;

    CRAFT_RECIPES.forEach(function(recipe, i){
      var col = i%cols, row = Math.floor(i/cols);
      var cx = startX + col*cellW, cy = startY + row*cellH;
      var crafted = !!data.crafted[i];
      var canCraft = true;
      recipe.materials.forEach(function(mi){ if((data.materials[mi]||0) < 1) canCraft = false; });

      ctx.fillStyle = crafted ? (dark?'rgba(76,175,80,.1)':'rgba(76,175,80,.06)') :
                     canCraft ? (dark?'rgba(255,215,0,.08)':'rgba(255,215,0,.06)') :
                     (dark?'rgba(255,255,255,.03)':'rgba(0,0,0,.02)');
      ctx.beginPath();
      if(ctx.roundRect) ctx.roundRect(cx+2,cy+2,cellW-4,cellH-4,10);
      else ctx.rect(cx+2,cy+2,cellW-4,cellH-4);
      ctx.fill();

      ctx.strokeStyle = crafted ? '#4CAF50' : canCraft ? '#FFD700' : (dark?'rgba(255,255,255,.06)':'rgba(0,0,0,.05)');
      ctx.lineWidth = 1;
      ctx.beginPath();
      if(ctx.roundRect) ctx.roundRect(cx+2,cy+2,cellW-4,cellH-4,10);
      else ctx.rect(cx+2,cy+2,cellW-4,cellH-4);
      ctx.stroke();

      ctx.font = '18px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(recipe.emoji, cx + 24, cy + cellH/2);

      ctx.font = 'bold 10px sans-serif';
      ctx.fillStyle = dark?'#eee':'#333';
      ctx.textBaseline = 'alphabetic';
      ctx.textAlign = 'left';
      ctx.fillText(recipe.name, cx + 44, cy + 18);

      ctx.font = '9px sans-serif';
      ctx.fillStyle = dark?'#aaa':'#888';
      ctx.fillText(recipe.desc, cx + 44, cy + 30);

      var matText = recipe.materials.map(function(mi){ return CRAFT_MATERIALS[mi].emoji; }).join('+');
      ctx.fillText('재료: '+matText, cx + 44, cy + 42);

      if(crafted){
        ctx.font = 'bold 9px sans-serif';
        ctx.fillStyle = '#4CAF50';
        ctx.textAlign = 'right';
        ctx.fillText('✅', cx + cellW - 12, cy + 18);
      }
    });
  }

  drawCraft();

  m.modal.querySelector('#v19CraftGather').onclick = function(){
    var matIdx = Math.floor(Math.random() * CRAFT_MATERIALS.length);
    var amount = 1 + Math.floor(Math.random() * 3);
    data.materials[matIdx] = (data.materials[matIdx] || 0) + amount;
    v19Save('hatcuping_crafting', data);
    sfxV19('craft_mix');
    showToastV19(CRAFT_MATERIALS[matIdx].emoji+' '+CRAFT_MATERIALS[matIdx].name+' x'+amount+' 획득!');
    drawCraft();
  };

  m.modal.querySelector('#v19CraftAuto').onclick = function(){
    var crafted = false;
    for(var i=0;i<CRAFT_RECIPES.length;i++){
      if(data.crafted[i]) continue;
      var canCraft = true;
      CRAFT_RECIPES[i].materials.forEach(function(mi){ if((data.materials[mi]||0) < 1) canCraft = false; });
      if(canCraft){
        CRAFT_RECIPES[i].materials.forEach(function(mi){ data.materials[mi]--; });
        data.crafted[i] = true;
        data.totalCraft++;
        crafted = true;
        sfxV19('craft_mix');
        showToastV19('⚒️ '+CRAFT_RECIPES[i].emoji+' '+CRAFT_RECIPES[i].name+' 제작 완료!');
        break;
      }
    }
    if(!crafted){
      showToastV19('재료가 부족합니다! 먼저 수집하세요.');
    }
    v19Save('hatcuping_crafting', data);
    drawCraft();
    var info = document.getElementById('v19CraftInfo');
    if(info) info.textContent = '제작 완료: '+Object.keys(data.crafted).length+'/'+CRAFT_RECIPES.length;
  };
}


// ============================================================
// 8. ADVENTURE STAT REPORT (comprehensive stats dashboard Canvas)
// ============================================================
function openStatReport(){
  trackV19Feature('statreport');
  sfxV19('v19_feature');
  var dark = isDarkV19();

  var dex = v19Load('hatcuping_dex', {collected:{},encounters:0});
  var shop = v19Load('hatcuping_shop', {coins:500,purchased:{},totalSpent:0});
  var speed = v19Load('hatcuping_speedrun', {bestTimes:{},attempts:0});
  var train = v19Load('hatcuping_training', {stats:[10,10,10,10,10,10],sessions:0,totalGain:0});
  var craft = v19Load('hatcuping_crafting', {crafted:{},totalCraft:0});
  var achievements = {};
  try{ achievements = JSON.parse(localStorage.getItem('hatcuping_achievements') || '{}'); }catch(e){}

  var html = '<canvas id="v19ReportCanvas" width="540" height="400" style="width:100%;border-radius:12px"></canvas>';
  createV19Modal('📊 모험 통계 리포트', html);

  var c = document.getElementById('v19ReportCanvas');
  if(!c) return;
  var ctx = c.getContext('2d');
  var W = c.width, H = c.height;
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle = dark?'#1a1030':'#F8F5FF';
  ctx.fillRect(0,0,W,H);

  ctx.font = 'bold 14px sans-serif';
  ctx.fillStyle = dark?'#FF8EC4':'#FF5FA2';
  ctx.textAlign = 'center';
  ctx.fillText('📊 종합 모험 통계 리포트', W/2, 22);

  var categories = [
    {label:'도감 수집률', value:Math.round(Object.keys(dex.collected).length/TINIPING_DEX.length*100), max:100, color:'#FF5FA2', emoji:'📚'},
    {label:'상점 구매율', value:Math.round(Object.keys(shop.purchased).length/SHOP_ITEMS.length*100), max:100, color:'#FFD700', emoji:'🏪'},
    {label:'스피드런 완료율', value:Math.round(Object.keys(speed.bestTimes).length/10*100), max:100, color:'#F44336', emoji:'⏱️'},
    {label:'훈련 세션', value:train.sessions, max:100, color:'#4CAF50', emoji:'💪'},
    {label:'아이템 제작율', value:Math.round(Object.keys(craft.crafted).length/CRAFT_RECIPES.length*100), max:100, color:'#FF9800', emoji:'⚒️'},
    {label:'업적 달성', value:Object.keys(achievements).length, max:166, color:'#AB47BC', emoji:'🏆'}
  ];

  var barW = W - 120, barH = 28, startX = 100, startY = 44;

  categories.forEach(function(cat, i){
    var y = startY + i * 46;

    ctx.font = '14px sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(cat.emoji, 24, y + barH/2);

    ctx.font = 'bold 10px sans-serif';
    ctx.fillStyle = dark?'#ccc':'#555';
    ctx.fillText(cat.label, startX - 8, y + barH/2);

    ctx.fillStyle = dark?'rgba(255,255,255,.04)':'rgba(0,0,0,.03)';
    ctx.beginPath();
    if(ctx.roundRect) ctx.roundRect(startX, y, barW, barH, 8);
    else ctx.rect(startX, y, barW, barH);
    ctx.fill();

    var pct = Math.min(cat.value / cat.max, 1);
    var fillW = pct * barW;
    if(fillW > 0){
      ctx.fillStyle = cat.color + '44';
      ctx.beginPath();
      if(ctx.roundRect) ctx.roundRect(startX, y, fillW, barH, 8);
      else ctx.rect(startX, y, fillW, barH);
      ctx.fill();
    }

    ctx.font = 'bold 11px sans-serif';
    ctx.fillStyle = cat.color;
    ctx.textAlign = 'left';
    ctx.fillText(cat.value + (cat.max === 100 ? '%' : '/'+cat.max), startX + fillW + 6, y + barH/2 + 1);
  });

  var totalScore = 0;
  categories.forEach(function(cat){ totalScore += Math.min(cat.value / cat.max, 1) * 100; });
  totalScore = Math.round(totalScore / categories.length);

  var grade = totalScore >= 90 ? 'S' : totalScore >= 70 ? 'A' : totalScore >= 50 ? 'B' : totalScore >= 30 ? 'C' : 'D';
  var gradeColors = {S:'#FFD700',A:'#FF5FA2',B:'#4488FF',C:'#4CAF50',D:'#888'};

  var centerX = W/2, centerY = H - 50;
  ctx.font = 'bold 24px sans-serif';
  ctx.fillStyle = gradeColors[grade];
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(grade, centerX, centerY - 8);

  ctx.font = 'bold 12px sans-serif';
  ctx.fillStyle = dark?'#aaa':'#666';
  ctx.fillText('종합 점수: '+totalScore+'/100', centerX, centerY + 18);

  ctx.font = '10px sans-serif';
  ctx.fillStyle = dark?'#777':'#999';
  ctx.fillText('탐색 '+dex.encounters+'회 | 코인 '+shop.coins+' | 스피드런 '+speed.attempts+'회 | 훈련 '+train.sessions+'회', centerX, centerY + 36);
}


// ============================================================
// V19 ACHIEVEMENTS (12 new, 154->166)
// ============================================================
var V19_ACHIEVEMENTS = [
  {id:'a_v19_dex_first',name:'첫 수집',desc:'티니핑 1종 수집',cat:'general',icon:'📚'},
  {id:'a_v19_dex_all',name:'도감 마스터',desc:'티니핑 12종 모두 수집',cat:'general',icon:'👑'},
  {id:'a_v19_shop_first',name:'첫 구매',desc:'상점에서 아이템 1개 구매',cat:'general',icon:'🛒'},
  {id:'a_v19_shop_all',name:'쇼핑왕',desc:'상점 아이템 전부 구매',cat:'general',icon:'🏪'},
  {id:'a_v19_speedrun',name:'스피드러너',desc:'스피드런 3회 이상 도전',cat:'general',icon:'⏱️'},
  {id:'a_v19_training_10',name:'수련생',desc:'훈련 10회 이상',cat:'general',icon:'💪'},
  {id:'a_v19_training_max',name:'초월자',desc:'스탯 1개 100 달성',cat:'general',icon:'🌟'},
  {id:'a_v19_typechart',name:'상성 전략가',desc:'속성 상성표 확인',cat:'general',icon:'⚔️'},
  {id:'a_v19_bossanalyzer',name:'보스 분석가',desc:'보스 약점 분석기 사용',cat:'general',icon:'🎯'},
  {id:'a_v19_craft_first',name:'초보 장인',desc:'아이템 1개 제작',cat:'general',icon:'⚒️'},
  {id:'a_v19_craft_all',name:'전설의 대장장이',desc:'아이템 8종 모두 제작',cat:'general',icon:'🔨'},
  {id:'a_v19_explorer',name:'v19 탐험가',desc:'v19 기능 6개 이상 체험',cat:'general',icon:'🌈'}
];


// ============================================================
// INJECT V19 ACHIEVEMENTS
// ============================================================
function injectV19Achievements(){
  if(!window.AD) return;
  V19_ACHIEVEMENTS.forEach(function(a){
    var exists = false;
    for(var i=0;i<window.AD.length;i++){
      if(window.AD[i].id === a.id){ exists = true; break; }
    }
    if(!exists) window.AD.push(a);
  });
}


// ============================================================
// CHECK AND AWARD V19 ACHIEVEMENTS
// ============================================================
function checkAndAwardV19(){
  try{
    var a = JSON.parse(localStorage.getItem('hatcuping_achievements') || '{}');

    var dex = v19Load('hatcuping_dex', {collected:{}});
    var dexCount = Object.keys(dex.collected).length;
    if(dexCount >= 1 && !a.a_v19_dex_first){ a.a_v19_dex_first = Date.now(); showToastV19('🏆 첫 수집 업적 달성!'); }
    if(dexCount >= 12 && !a.a_v19_dex_all){ a.a_v19_dex_all = Date.now(); showToastV19('🏆 도감 마스터 업적 달성!'); }

    var shop = v19Load('hatcuping_shop', {purchased:{}});
    var shopCount = Object.keys(shop.purchased).length;
    if(shopCount >= 1 && !a.a_v19_shop_first){ a.a_v19_shop_first = Date.now(); showToastV19('🏆 첫 구매 업적 달성!'); }
    if(shopCount >= 8 && !a.a_v19_shop_all){ a.a_v19_shop_all = Date.now(); showToastV19('🏆 쇼핑왕 업적 달성!'); }

    var speed = v19Load('hatcuping_speedrun', {attempts:0});
    if(speed.attempts >= 3 && !a.a_v19_speedrun){ a.a_v19_speedrun = Date.now(); showToastV19('🏆 스피드러너 업적 달성!'); }

    var train = v19Load('hatcuping_training', {stats:[10,10,10,10,10,10],sessions:0});
    if(train.sessions >= 10 && !a.a_v19_training_10){ a.a_v19_training_10 = Date.now(); showToastV19('🏆 수련생 업적 달성!'); }
    var hasMax = false;
    train.stats.forEach(function(s){ if(s >= 100) hasMax = true; });
    if(hasMax && !a.a_v19_training_max){ a.a_v19_training_max = Date.now(); showToastV19('🏆 초월자 업적 달성!'); }

    var craft = v19Load('hatcuping_crafting', {crafted:{},totalCraft:0});
    var craftCount = Object.keys(craft.crafted).length;
    if(craftCount >= 1 && !a.a_v19_craft_first){ a.a_v19_craft_first = Date.now(); showToastV19('🏆 초보 장인 업적 달성!'); }
    if(craftCount >= 8 && !a.a_v19_craft_all){ a.a_v19_craft_all = Date.now(); showToastV19('🏆 전설의 대장장이 업적 달성!'); }

    var features = [];
    try{ features = JSON.parse(localStorage.getItem('hatcuping_v19_features') || '[]'); }catch(e){}
    if(features.indexOf('typechart') !== -1 && !a.a_v19_typechart){ a.a_v19_typechart = Date.now(); showToastV19('🏆 상성 전략가 업적 달성!'); }
    if(features.indexOf('bossanalyzer') !== -1 && !a.a_v19_bossanalyzer){ a.a_v19_bossanalyzer = Date.now(); showToastV19('🏆 보스 분석가 업적 달성!'); }
    if(features.length >= 6 && !a.a_v19_explorer){ a.a_v19_explorer = Date.now(); showToastV19('🏆 v19 탐험가 업적 달성!'); }

    localStorage.setItem('hatcuping_achievements', JSON.stringify(a));
  }catch(e){}
}


// ============================================================
// QUIZ V19 (+15 questions, 150->165)
// ============================================================
function injectExtraQuizV19(){
  if(!window.QUIZ_BANK) window.QUIZ_BANK = [];
  var pool = window.hatcuping_quiz_pool || window.QUIZ_BANK;
  var newQ = [
    {q:'티니핑 도감의 총 종수는?',a:['8','10','12','15'],c:2},
    {q:'하츄핑의 속성은?',a:['용기','사랑','지혜','평화'],c:1},
    {q:'파워업 상점에서 가장 비싼 아이템은?',a:['불꽃 검','무적의 망토','행운의 클로버','마법 지팡이'],c:1},
    {q:'속성 상성에서 사랑에 강한 속성은?',a:['용기','평화','냉정','활력'],c:1},
    {q:'스피드런 스테이지는 총 몇 개?',a:['6','8','10','12'],c:2},
    {q:'트레이닝 센터의 스탯 종류 수는?',a:['4','5','6','8'],c:2},
    {q:'스탯 최대값은 얼마?',a:['50','80','100','150'],c:2},
    {q:'보스 약점 분석기의 보스 수는?',a:['5','6','8','10'],c:2},
    {q:'최종 보스 &quot;절망&quot;의 약점 속성은?',a:['냉정','용기','사랑','지혜'],c:2},
    {q:'아이템 합성 공방의 재료 종류 수는?',a:['4','6','8','10'],c:1},
    {q:'운명의 주사위에 필요한 재료 수는?',a:['2','4','6','8'],c:2},
    {q:'S등급 티니핑의 수는?',a:['1','2','3','4'],c:2},
    {q:'바로핑의 속성은?',a:['사랑','정의','용기','지혜'],c:1},
    {q:'v19에서 추가된 업적 수는?',a:['8','10','12','15'],c:2},
    {q:'종합 통계 리포트의 등급 중 최고는?',a:['A','SS','S','★'],c:2}
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
// KEYBOARD SHORTCUTS (8 new: Shift+R/T/U/V/W/X/Y/Z)
// ============================================================
function injectV19Keyboard(){
  document.addEventListener('keydown', function(e){
    if(e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if(!e.shiftKey) return;
    switch(e.key){
      case 'R': e.preventDefault(); openTinipingDex(); break;
      case 'T': e.preventDefault(); openShop(); break;
      case 'U': e.preventDefault(); openTypeChart(); break;
      case 'V': e.preventDefault(); openSpeedrun(); break;
      case 'W': e.preventDefault(); openTrainingCenter(); break;
      case 'X': e.preventDefault(); openBossAnalyzer(); break;
      case 'Y': e.preventDefault(); openCraftWorkshop(); break;
      case 'Z': e.preventDefault(); openStatReport(); break;
    }
  });
}


// ============================================================
// BOTTOM NAVIGATION (append to existing v18 nav, NO new fixed bar)
// ============================================================
function injectV19BottomNav(){
  var existingNav = document.getElementById('v18BottomNav');
  if(!existingNav) return;

  var buttons = [
    {icon:'📚',label:'도감',action:openTinipingDex},
    {icon:'🏪',label:'상점',action:openShop},
    {icon:'⚔️',label:'상성',action:openTypeChart},
    {icon:'⏱️',label:'스피드',action:openSpeedrun},
    {icon:'💪',label:'훈련',action:openTrainingCenter},
    {icon:'🎯',label:'보스',action:openBossAnalyzer},
    {icon:'⚒️',label:'합성',action:openCraftWorkshop},
    {icon:'📊',label:'통계',action:openStatReport}
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
function updateV19Footer(){
  var ver = document.querySelector('.footer .version');
  if(ver) ver.textContent = 'v19.0 | © PRIME Holdings NEXTERA+PRISM';

  var links = document.querySelector('.footer-links');
  if(links) links.innerHTML = '<span class="footer-link">4종 게임</span><span class="footer-link">166개 업적</span><span class="footer-link">도감+상점+상성</span><span class="footer-link">스피드런+훈련+보스</span><span class="footer-link">퀸즈 165문</span>';
}

function updateV19News(){
  var newsSection = document.querySelector('.news-section');
  if(!newsSection) return;
  var firstItem = newsSection.querySelector('.news-item');
  if(!firstItem) return;
  var newItem = document.createElement('div');
  newItem.className = 'news-item';
  newItem.innerHTML = '<span class="news-date">v19.0</span><span class="news-text">티니핑도감12종Canvas, 파워업상점8종Canvas, 속성상성6속성Canvas, 스피드런타이먰10스테이지Canvas, 트레이닝6스탯RadarCanvas, 보스약점8보스6축RadarCanvas, 아이템합성8종Canvas, 모험통계리포트Canvas, 퀸즈+15(165), 업적+12(166)</span>';
  firstItem.parentNode.insertBefore(newItem, firstItem);
}

function updateV19AchieveCount(){
  var el = document.getElementById('achieveCount');
  if(el){
    var c = 0;
    try{ c = Object.keys(JSON.parse(localStorage.getItem('hatcuping_achievements') || '{}')).length; }catch(e){}
    var t = window.AD ? window.AD.length : 166;
    el.textContent = c + '/' + t;
  }
}

function updateV19Meta(){
  var descMeta = document.querySelector('meta[name="description"]');
  if(descMeta) descMeta.content = '사랑의 하츄핑 v19.0 - 플랫포머 액션, 턴제 RPG, 오픈월드, UNIFIED 4종 게임. 업적 166개, 티니핑도감12종, 파워업상점8종, 속성상성6속성, 스피드런10스테이지, 트레이닝6스탯Radar, 보스약점8보스, 아이템합성8종, 모험통계리포트, 퀸즈 165문!';
  document.title = '사랑의 하츄핑 v19.0 - 게임 선택';
}


// ============================================================
// BOOT
// ============================================================
function bootV19(){
  injectV19Achievements();
  injectExtraQuizV19();
  injectV19Keyboard();
  injectV19BottomNav();
  updateV19Footer();
  updateV19News();
  updateV19AchieveCount();
  updateV19Meta();
  checkAndAwardV19();
}

if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', bootV19);
} else {
  bootV19();
}

})();

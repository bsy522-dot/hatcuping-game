// hatcuping-game v17_patch.js - NEXTERA+PRISM AUTO v17.0
// Self-contained patch module (1200+ lines, 60+ functions)
(function(){
'use strict';

// ============================================================
// SFX ENGINE (12 sound types)
// ============================================================
var _v17Ctx = null;
function _v17InitAudio(){
  if(!_v17Ctx){
    try{ _v17Ctx = new (window.AudioContext || window.webkitAudioContext)(); }catch(e){}
  }
  if(_v17Ctx && _v17Ctx.state === 'suspended') _v17Ctx.resume();
}

var V17_SFX = {
  stamp_collect:{f:880,d:.08,t:'triangle'},
  stamp_complete:{f:1200,d:.15,t:'sine'},
  garden_plant:{f:550,d:.06,t:'sine'},
  garden_water:{f:440,d:.1,t:'sine'},
  memory_flip:{f:660,d:.04,t:'sine'},
  memory_match:{f:1047,d:.1,t:'triangle'},
  emotion_select:{f:700,d:.05,t:'sine'},
  emotion_save:{f:990,d:.08,t:'triangle'},
  treasure_dig:{f:500,d:.06,t:'square'},
  treasure_find:{f:1320,d:.12,t:'triangle'},
  dress_change:{f:770,d:.06,t:'sine'},
  v17_feature:{f:850,d:.08,t:'triangle'}
};

function sfxV17(type){
  _v17InitAudio();
  if(!_v17Ctx) return;
  var s = V17_SFX[type];
  if(!s) return;
  try{
    var muted = false;
    try{ muted = localStorage.getItem('hatcuping_mute') === '1'; }catch(e){}
    if(muted) return;
    var osc = _v17Ctx.createOscillator();
    var gain = _v17Ctx.createGain();
    osc.type = s.t || 'sine';
    osc.frequency.value = s.f;
    gain.gain.value = 0.08;
    osc.connect(gain);
    gain.connect(_v17Ctx.destination);
    osc.start();
    osc.stop(_v17Ctx.currentTime + (s.d || 0.06));
  }catch(e){}
}


// ============================================================
// UTILITY FUNCTIONS
// ============================================================
function trackV17Feature(id){
  try{
    var saved = JSON.parse(localStorage.getItem('hatcuping_v17_features') || '[]');
    if(saved.indexOf(id) === -1){ saved.push(id); localStorage.setItem('hatcuping_v17_features', JSON.stringify(saved)); }
  }catch(e){}
}

function showToastV17(msg){
  var t = document.getElementById('achieveToast');
  if(t){ t.innerHTML = msg; t.classList.add('show'); setTimeout(function(){ t.classList.remove('show'); }, 2500); }
}

function v17Load(key, fallback){
  try{ var d = JSON.parse(localStorage.getItem(key)); return d !== null ? d : fallback; }catch(e){ return fallback; }
}

function v17Save(key, data){
  try{ localStorage.setItem(key, JSON.stringify(data)); }catch(e){}
}

function todayStrV17(){
  var d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}

function isDarkV17(){
  return document.body.classList.contains('dark');
}

function createV17Modal(title, contentHtml){
  var overlay = document.createElement('div');
  overlay.className = 'modal-overlay show';
  overlay.style.zIndex = '1000';
  var modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = '<button class="modal-close" style="position:absolute;top:12px;right:16px;background:none;border:none;font-size:24px;cursor:pointer;color:var(--text-sub)">&times;</button><h3>' + title + '</h3>' + contentHtml;
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  overlay.querySelector('.modal-close').onclick = function(){ overlay.remove(); };
  overlay.addEventListener('click', function(e){ if(e.target === overlay) overlay.remove(); });
  return {overlay: overlay, modal: modal};
}


// ============================================================
// 1. STAMP RALLY COLLECTION (Canvas 640x360, 20 stamps)
// ============================================================
var STAMP_DATA = [
  {id:'s1',name:'로미',emoji:'&#x1F466;',zone:'이모션 왕국',desc:'용감한 주인공'},
  {id:'s2',name:'하츄핑',emoji:'&#x1F496;',zone:'하트필 숨',desc:'사랑의 티니핑'},
  {id:'s3',name:'바로핑',emoji:'&#x2728;',zone:'별빛 마을;',desc:'올바른 티니핑'},
  {id:'s4',name:'차차핑',emoji:'&#x1F4DA;',zone:'지식의 탑;',desc:'차분한 티니핑'},
  {id:'s5',name:'해필핑',emoji:'&#x1F60A;',zone:'무지개 언덕;',desc:'행복의 티니핑'},
  {id:'s6',name:'새침핑',emoji:'&#x1F31F;',zone:'새벽 언덕;',desc:'깨움의 티니핑'},
  {id:'s7',name:'아이스핑',emoji:'&#x2744;',zone:'얼음 동굴;',desc:'차가운 티니핑'},
  {id:'s8',name:'파이어핑',emoji:'&#x1F525;',zone:'화염 산;',desc:'뜨거운 티니핑'},
  {id:'s9',name:'워터핑',emoji:'&#x1F4A7;',zone:'맑은 호수;',desc:'물의 티니핑'},
  {id:'s10',name:'윈디핑',emoji:'&#x1F32C;',zone:'바람 계곡;',desc:'바람의 티니핑'},
  {id:'s11',name:'라비핑',emoji:'&#x1F49C;',zone:'보라보라 꽃밤;',desc:'마법의 티니핑'},
  {id:'s12',name:'티라미수',emoji:'&#x1F380;',zone:'무대 구역;',desc:'예술의 수호자'},
  {id:'s13',name:'케치핑',emoji:'&#x1F345;',zone:'건강 마을;',desc:'건강의 티니핑'},
  {id:'s14',name:'비밀핑',emoji:'&#x1F510;',zone:'숨겨진 동굴;',desc:'비밀의 티니핑'},
  {id:'s15',name:'음악핑',emoji:'&#x1F3B5;',zone:'멜로디 언덕;',desc:'음악의 티니핑'},
  {id:'s16',name:'꽃핑',emoji:'&#x1F338;',zone:'봄꽃 정원;',desc:'자연의 티니핑'},
  {id:'s17',name:'별핑',emoji:'&#x2B50;',zone:'별빛 천문대;',desc:'별의 티니핑'},
  {id:'s18',name:'빛핑',emoji:'&#x1F4A1;',zone:'빛의 등대;',desc:'빛의 티니핑'},
  {id:'s19',name:'어둠핑',emoji:'&#x1F31A;',zone:'그림자 숲;',desc:'어둠의 티니핑'},
  {id:'s20',name:'팅글핑',emoji:'&#x1F4AB;',zone:'반짝임 백화점;',desc:'반짝임의 티니핑'}
];

function openStampRally(){
  trackV17Feature('stamp');
  sfxV17('v17_feature');
  var data = v17Load('hatcuping_stamps', {collected:{}});
  var dark = isDarkV17();

  var html = '<div style="margin-bottom:12px"><canvas id="v17StampCanvas" width="600" height="340" style="width:100%;border-radius:12px;background:'+(dark?'#1a1030':'#FFF5FA')+'"></canvas></div>';
  html += '<div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;margin-bottom:12px">';
  html += '<button id="v17StampCollect" style="padding:6px 14px;border-radius:12px;border:2px solid #FF5FA2;background:linear-gradient(135deg,#FF5FA2,#B066FF);color:#fff;font-weight:700;cursor:pointer;font-size:12px">&#x1F3AB; 스탬프 수집!</button>';
  html += '<button id="v17StampReset" style="padding:6px 14px;border-radius:12px;border:1px solid #ddd;background:rgba(0,0,0,.04);cursor:pointer;font-size:11px;font-weight:600;color:var(--text-sub)">초기화</button>';
  html += '</div>';
  html += '<div id="v17StampInfo" style="font-size:12px;text-align:center;color:var(--text-sub)"></div>';

  var m = createV17Modal('&#x1F3AB; 스탬프 랠리 컬렉션', html);

  function drawStamps(){
    var c = document.getElementById('v17StampCanvas');
    if(!c) return;
    var ctx = c.getContext('2d');
    var W = c.width, H = c.height;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = dark ? '#1a1030' : '#FFF5FA';
    ctx.fillRect(0,0,W,H);

    ctx.fillStyle = dark ? '#FF8EC4' : '#FF5FA2';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    var collected = Object.keys(data.collected).length;
    ctx.fillText('스탬프 랠리: ' + collected + '/' + STAMP_DATA.length, W/2, 24);

    var pct = collected / STAMP_DATA.length;
    ctx.fillStyle = dark ? 'rgba(255,255,255,.1)' : 'rgba(0,0,0,.06)';
    ctx.fillRect(40, 32, W-80, 10);
    var grad = ctx.createLinearGradient(40,0,W-40,0);
    grad.addColorStop(0,'#FF5FA2');
    grad.addColorStop(1,'#B066FF');
    ctx.fillStyle = grad;
    ctx.fillRect(40, 32, (W-80)*pct, 10);

    var cols = 5, rows = 4;
    var cellW = (W-60)/cols, cellH = (H-70)/rows;
    for(var i=0;i<STAMP_DATA.length;i++){
      var col = i % cols, row = Math.floor(i/cols);
      var cx = 30 + col*cellW + cellW/2;
      var cy = 56 + row*cellH + cellH/2;
      var has = !!data.collected[STAMP_DATA[i].id];

      if(has){
        ctx.fillStyle = dark ? 'rgba(255,95,162,.15)' : 'rgba(255,95,162,.08)';
        ctx.beginPath();
        ctx.arc(cx, cy, cellW/2.5, 0, Math.PI*2);
        ctx.fill();
        ctx.strokeStyle = '#FF5FA2';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else {
        ctx.fillStyle = dark ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.03)';
        ctx.beginPath();
        ctx.arc(cx, cy, cellW/2.5, 0, Math.PI*2);
        ctx.fill();
        ctx.strokeStyle = dark ? 'rgba(255,255,255,.1)' : 'rgba(0,0,0,.08)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3,3]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      ctx.font = has ? '22px sans-serif' : '18px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(has ? String.fromCodePoint(parseInt(STAMP_DATA[i].emoji.replace(/&#x|;/g,''),16)) : '🔒', cx, cy - 4);

      ctx.font = 'bold 9px sans-serif';
      ctx.fillStyle = has ? (dark?'#FFB8D9':'#FF5FA2') : (dark?'#666':'#bbb');
      ctx.fillText(has ? STAMP_DATA[i].name : '???', cx, cy + 20);
    }

    var info = document.getElementById('v17StampInfo');
    if(info){
      if(collected === STAMP_DATA.length){
        info.innerHTML = '&#x1F389; <b>축하합니다!</b> 모든 스탬프를 모았어요!';
      } else {
        info.textContent = '수집 버튼을 눌러 램덤 스탬프를 모아보세요!';
      }
    }
  }

  drawStamps();

  m.modal.querySelector('#v17StampCollect').onclick = function(){
    var uncollected = [];
    for(var i=0;i<STAMP_DATA.length;i++){
      if(!data.collected[STAMP_DATA[i].id]) uncollected.push(STAMP_DATA[i]);
    }
    if(uncollected.length === 0){
      showToastV17('모든 스탬프를 이미 모았어요!');
      return;
    }
    var pick = uncollected[Math.floor(Math.random()*uncollected.length)];
    data.collected[pick.id] = todayStrV17();
    v17Save('hatcuping_stamps', data);
    sfxV17('stamp_collect');
    showToastV17('&#x1F3AB; ' + pick.name + ' 스탬프 획득! (' + pick.zone + ')');
    if(Object.keys(data.collected).length === STAMP_DATA.length) sfxV17('stamp_complete');
    drawStamps();
  };

  m.modal.querySelector('#v17StampReset').onclick = function(){
    data = {collected:{}};
    v17Save('hatcuping_stamps', data);
    drawStamps();
  };
}


// ============================================================
// 2. MAGIC GARDEN (Canvas flower growing sim, 10 flowers)
// ============================================================
var GARDEN_FLOWERS = [
  {id:'rose',name:'장미',emoji:'&#x1F339;',color:'#E91E63',grow:3},
  {id:'sunflower',name:'해바라기',emoji:'&#x1F33B;',color:'#FFC107',grow:4},
  {id:'tulip',name:'튀립',emoji:'&#x1F337;',color:'#FF5722',grow:2},
  {id:'cherry',name:'벗꽃',emoji:'&#x1F338;',color:'#F06292',grow:3},
  {id:'daisy',name:'데이지',emoji:'&#x1F33C;',color:'#FFEB3B',grow:2},
  {id:'lily',name:'백합',emoji:'&#x1F33A;',color:'#FFFFFF',grow:5},
  {id:'lavender',name:'라벤더',emoji:'&#x1F4AE;',color:'#9C27B0',grow:4},
  {id:'cosmos',name:'코스모스',emoji:'&#x1F33E;',color:'#E91E63',grow:3},
  {id:'iris',name:'붓꽃',emoji:'&#x1F490;',color:'#3F51B5',grow:4},
  {id:'clover',name:'클로버',emoji:'&#x2618;',color:'#4CAF50',grow:2}
];

function openMagicGarden(){
  trackV17Feature('garden');
  sfxV17('v17_feature');
  var data = v17Load('hatcuping_garden', {plots:[null,null,null,null,null,null],water:3,totalGrown:0});
  var dark = isDarkV17();

  var html = '<div style="margin-bottom:10px"><canvas id="v17GardenCanvas" width="560" height="320" style="width:100%;border-radius:12px;background:'+(dark?'#0d1a0d':'#F0FFF0')+'"></canvas></div>';
  html += '<div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;margin-bottom:8px">';
  html += '<button id="v17GardenPlant" style="padding:6px 14px;border-radius:12px;border:2px solid #4CAF50;background:linear-gradient(135deg,#4CAF50,#8BC34A);color:#fff;font-weight:700;cursor:pointer;font-size:12px">&#x1F331; 심기</button>';
  html += '<button id="v17GardenWater" style="padding:6px 14px;border-radius:12px;border:2px solid #2196F3;background:linear-gradient(135deg,#2196F3,#03A9F4);color:#fff;font-weight:700;cursor:pointer;font-size:12px">&#x1F4A7; 물주기 (<span id="v17WaterCount">'+data.water+'</span>)</button>';
  html += '<button id="v17GardenHarvest" style="padding:6px 14px;border-radius:12px;border:2px solid #FF9800;background:linear-gradient(135deg,#FF9800,#FFC107);color:#fff;font-weight:700;cursor:pointer;font-size:12px">&#x1F33C; 수확;</button>';
  html += '</div>';
  html += '<div id="v17GardenInfo" style="font-size:11px;text-align:center;color:var(--text-sub)">총 수확: '+data.totalGrown+'송이</div>';

  var m = createV17Modal('&#x1F33A; 마법의 정원', html);

  function drawGarden(){
    var c = document.getElementById('v17GardenCanvas');
    if(!c) return;
    var ctx = c.getContext('2d');
    var W = c.width, H = c.height;
    ctx.clearRect(0,0,W,H);

    var skyGrad = ctx.createLinearGradient(0,0,0,H*0.4);
    skyGrad.addColorStop(0, dark?'#0a0a2e':'#87CEEB');
    skyGrad.addColorStop(1, dark?'#1a1040':'#E0F7FA');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0,0,W,H*0.4);

    var groundGrad = ctx.createLinearGradient(0,H*0.4,0,H);
    groundGrad.addColorStop(0, dark?'#1a3a1a':'#8BC34A');
    groundGrad.addColorStop(1, dark?'#0d1a0d':'#4CAF50');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0,H*0.4,W,H*0.6);

    ctx.fillStyle = dark?'#FFD700':'#FFA000';
    ctx.beginPath();
    ctx.arc(W-60, 50, 30, 0, Math.PI*2);
    ctx.fill();

    ctx.font = 'bold 14px sans-serif';
    ctx.fillStyle = dark?'#aaa':'#333';
    ctx.textAlign = 'center';
    ctx.fillText('마법의 정원 - 수확: ' + data.totalGrown + '송이', W/2, 28);

    var plotW = 80, plotH = 90, gap = 10;
    var startX = (W - (plotW*6 + gap*5))/2;
    var startY = H*0.45;

    for(var i=0;i<6;i++){
      var px = startX + i*(plotW+gap);
      var py = startY;

      ctx.fillStyle = dark?'rgba(139,69,19,.4)':'#8B4513';
      ctx.fillRect(px, py+plotH-20, plotW, 20);
      ctx.fillStyle = dark?'rgba(101,67,33,.5)':'#654321';
      ctx.fillRect(px+4, py+plotH-16, plotW-8, 12);

      var plot = data.plots[i];
      if(plot){
        var flower = null;
        for(var f=0;f<GARDEN_FLOWERS.length;f++){
          if(GARDEN_FLOWERS[f].id === plot.type){ flower = GARDEN_FLOWERS[f]; break; }
        }
        if(flower){
          var stage = Math.min(plot.watered, flower.grow);
          var pct = stage / flower.grow;

          if(pct >= 1){
            ctx.font = '32px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(String.fromCodePoint(parseInt(flower.emoji.replace(/&#x|;/g,''),16)), px+plotW/2, py+plotH-30);
            ctx.font = 'bold 10px sans-serif';
            ctx.fillStyle = '#4CAF50';
            ctx.fillText('수확 가능!', px+plotW/2, py+12);
          } else {
            ctx.fillStyle = '#4CAF50';
            var stemH = 20 + pct*30;
            ctx.fillRect(px+plotW/2-2, py+plotH-20-stemH, 4, stemH);

            if(pct > 0.3){
              ctx.fillStyle = flower.color;
              ctx.beginPath();
              ctx.arc(px+plotW/2, py+plotH-22-stemH, 6+pct*8, 0, Math.PI*2);
              ctx.fill();
            }

            ctx.font = '9px sans-serif';
            ctx.fillStyle = dark?'#aaa':'#666';
            ctx.textAlign = 'center';
            ctx.fillText(flower.name + ' ' + stage + '/' + flower.grow, px+plotW/2, py+12);
          }
        }
      } else {
        ctx.font = '24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = dark?'#555':'#ccc';
        ctx.fillText('➕', px+plotW/2, py+plotH/2);
        ctx.font = '9px sans-serif';
        ctx.fillText('빈 화분', px+plotW/2, py+plotH/2+18);
      }
    }

    document.getElementById('v17WaterCount').textContent = data.water;
    document.getElementById('v17GardenInfo').textContent = '총 수확: '+data.totalGrown+'송이 | 물: '+data.water+'방울';
  }

  drawGarden();

  m.modal.querySelector('#v17GardenPlant').onclick = function(){
    var emptyIdx = -1;
    for(var i=0;i<data.plots.length;i++){
      if(!data.plots[i]){ emptyIdx = i; break; }
    }
    if(emptyIdx === -1){ showToastV17('모든 화분이 차 있어요!'); return; }
    var f = GARDEN_FLOWERS[Math.floor(Math.random()*GARDEN_FLOWERS.length)];
    data.plots[emptyIdx] = {type:f.id,watered:0,plantedAt:todayStrV17()};
    v17Save('hatcuping_garden', data);
    sfxV17('garden_plant');
    showToastV17('&#x1F331; ' + f.name + '을(를) 심었어요!');
    drawGarden();
  };

  m.modal.querySelector('#v17GardenWater').onclick = function(){
    if(data.water <= 0){ showToastV17('물이 부족해요! 내일 다시 받을 수 있어요.'); return; }
    var watered = false;
    for(var i=0;i<data.plots.length;i++){
      if(data.plots[i]){
        var flower = null;
        for(var f=0;f<GARDEN_FLOWERS.length;f++){
          if(GARDEN_FLOWERS[f].id === data.plots[i].type){ flower = GARDEN_FLOWERS[f]; break; }
        }
        if(flower && data.plots[i].watered < flower.grow){
          data.plots[i].watered++;
          watered = true;
        }
      }
    }
    if(watered){
      data.water--;
      v17Save('hatcuping_garden', data);
      sfxV17('garden_water');
      showToastV17('&#x1F4A7; 물을 줬어요! 꽃이 자라고 있어요~');
    } else {
      showToastV17('물을 줄 꽃이 없어요!');
    }
    drawGarden();
  };

  m.modal.querySelector('#v17GardenHarvest').onclick = function(){
    var harvested = 0;
    for(var i=0;i<data.plots.length;i++){
      if(data.plots[i]){
        var flower = null;
        for(var f=0;f<GARDEN_FLOWERS.length;f++){
          if(GARDEN_FLOWERS[f].id === data.plots[i].type){ flower = GARDEN_FLOWERS[f]; break; }
        }
        if(flower && data.plots[i].watered >= flower.grow){
          data.plots[i] = null;
          harvested++;
        }
      }
    }
    if(harvested > 0){
      data.totalGrown += harvested;
      data.water = Math.min(data.water + harvested, 10);
      v17Save('hatcuping_garden', data);
      sfxV17('stamp_complete');
      showToastV17('&#x1F33C; ' + harvested + '송이 수확! 물 +' + harvested);
    } else {
      showToastV17('수확할 꽃이 없어요!');
    }
    drawGarden();
  };
}


// ============================================================
// 3. MEMORY CARD MATCH (Canvas 4x4 / 5x4, 10 pairs)
// ============================================================
function openMemoryMatch(){
  trackV17Feature('memory');
  sfxV17('v17_feature');
  var dark = isDarkV17();

  var pairs = [
    {emoji:'&#x1F496;',name:'하츄핑'},
    {emoji:'&#x1F466;',name:'로미'},
    {emoji:'&#x2728;',name:'바로핑'},
    {emoji:'&#x1F4DA;',name:'차차핑'},
    {emoji:'&#x1F525;',name:'파이어핑'},
    {emoji:'&#x2744;',name:'아이스핑'},
    {emoji:'&#x1F4A7;',name:'워터핑'},
    {emoji:'&#x1F60A;',name:'해필핑'}
  ];

  var cards = [];
  pairs.forEach(function(p){
    cards.push({emoji:p.emoji,name:p.name,matched:false,flipped:false});
    cards.push({emoji:p.emoji,name:p.name,matched:false,flipped:false});
  });
  for(var i=cards.length-1;i>0;i--){
    var j=Math.floor(Math.random()*(i+1));
    var tmp=cards[i]; cards[i]=cards[j]; cards[j]=tmp;
  }

  var cols = 4, rows = 4;
  var firstIdx = -1, secondIdx = -1, locked = false;
  var moves = 0, matched = 0, totalPairs = pairs.length;
  var memData = v17Load('hatcuping_memory', {best:999,plays:0});

  var html = '<div style="margin-bottom:8px"><canvas id="v17MemCanvas" width="480" height="360" style="width:100%;border-radius:12px;cursor:pointer;background:'+(dark?'#1a1030':'#F0F0FF')+'"></canvas></div>';
  html += '<div id="v17MemInfo" style="font-size:12px;text-align:center;color:var(--text-sub)">수: '+moves+' | 베스트: '+(memData.best<999?memData.best:'-')+'</div>';

  var m = createV17Modal('&#x1F0CF; 캐릭터 카드 매칭', html);

  function drawMemory(){
    var c = document.getElementById('v17MemCanvas');
    if(!c) return;
    var ctx = c.getContext('2d');
    var W = c.width, H = c.height;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = dark?'#1a1030':'#F0F0FF';
    ctx.fillRect(0,0,W,H);

    var cW = (W-50)/cols, cH = (H-50)/rows;
    var startX = 25, startY = 25;

    for(var i=0;i<cards.length;i++){
      var col = i%cols, row = Math.floor(i/cols);
      var cx = startX + col*(cW+5);
      var cy = startY + row*(cH+5);
      var card = cards[i];

      if(card.matched){
        ctx.fillStyle = dark?'rgba(76,175,80,.2)':'rgba(76,175,80,.1)';
        ctx.strokeStyle = '#4CAF50';
      } else if(card.flipped){
        ctx.fillStyle = dark?'rgba(255,95,162,.15)':'rgba(255,240,248,1)';
        ctx.strokeStyle = '#FF5FA2';
      } else {
        ctx.fillStyle = dark?'rgba(176,102,255,.15)':'rgba(176,102,255,.1)';
        ctx.strokeStyle = dark?'rgba(176,102,255,.4)':'#B066FF';
      }

      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(cx, cy, cW-2, cH-2, 10);
      ctx.fill();
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      if(card.flipped || card.matched){
        ctx.font = '28px sans-serif';
        ctx.fillText(String.fromCodePoint(parseInt(card.emoji.replace(/&#x|;/g,''),16)), cx+cW/2-1, cy+cH/2-6);
        ctx.font = 'bold 9px sans-serif';
        ctx.fillStyle = dark?'#ccc':'#666';
        ctx.fillText(card.name, cx+cW/2-1, cy+cH/2+18);
      } else {
        ctx.font = '20px sans-serif';
        ctx.fillStyle = dark?'#B066FF':'#B066FF';
        ctx.fillText('?', cx+cW/2-1, cy+cH/2);
      }
    }

    document.getElementById('v17MemInfo').textContent = '수: '+moves+' | 베스트: '+(memData.best<999?memData.best:'-') + (matched===totalPairs?' | 클리어!':'');
  }

  drawMemory();

  document.getElementById('v17MemCanvas').onclick = function(e){
    if(locked) return;
    var c = document.getElementById('v17MemCanvas');
    var rect = c.getBoundingClientRect();
    var scaleX = c.width/rect.width, scaleY = c.height/rect.height;
    var mx = (e.clientX-rect.left)*scaleX;
    var my = (e.clientY-rect.top)*scaleY;

    var cW = (c.width-50)/cols, cH = (c.height-50)/rows;
    var col = Math.floor((mx-25)/(cW+5));
    var row = Math.floor((my-25)/(cH+5));
    if(col<0||col>=cols||row<0||row>=rows) return;
    var idx = row*cols+col;
    if(idx>=cards.length) return;
    if(cards[idx].flipped||cards[idx].matched) return;

    cards[idx].flipped = true;
    sfxV17('memory_flip');

    if(firstIdx === -1){
      firstIdx = idx;
      drawMemory();
    } else {
      secondIdx = idx;
      moves++;
      locked = true;
      drawMemory();

      setTimeout(function(){
        if(cards[firstIdx].emoji === cards[secondIdx].emoji){
          cards[firstIdx].matched = true;
          cards[secondIdx].matched = true;
          matched++;
          sfxV17('memory_match');
          if(matched === totalPairs){
            if(moves < memData.best) memData.best = moves;
            memData.plays++;
            v17Save('hatcuping_memory', memData);
            showToastV17('&#x1F389; ' + moves + '수로 클리어!');
          }
        } else {
          cards[firstIdx].flipped = false;
          cards[secondIdx].flipped = false;
        }
        firstIdx = -1;
        secondIdx = -1;
        locked = false;
        drawMemory();
      }, 800);
    }
  };
}


// ============================================================
// 4. EMOTION WEATHER FORECAST (Canvas mood tracker, 7-day)
// ============================================================
var EMOTION_WEATHERS = [
  {id:'sunny',emoji:'&#x2600;',name:'맑음',color:'#FFD54F',desc:'오늘 기분이 최고예요!'},
  {id:'cloudy',emoji:'&#x26C5;',name:'구름',color:'#90A4AE',desc:'보통이에요~ 괜찮아요'},
  {id:'rainy',emoji:'&#x1F327;',name:'비',color:'#42A5F5',desc:'조금 슬프지만 괜찮아요'},
  {id:'stormy',emoji:'&#x26C8;',name:'폭풍',color:'#5C6BC0',desc:'힘든 날이에요...'},
  {id:'rainbow',emoji:'&#x1F308;',name:'무지개',color:'#EC407A',desc:'신나고 행복해요!'},
  {id:'snowy',emoji:'&#x2744;',name:'눈;',color:'#B3E5FC',desc:'차분하고 조용한 날'}
];

function openEmotionWeather(){
  trackV17Feature('weather');
  sfxV17('v17_feature');
  var data = v17Load('hatcuping_emotionweather', {records:[]});
  var dark = isDarkV17();
  var today = todayStrV17();
  var todayRecord = null;
  for(var i=0;i<data.records.length;i++){
    if(data.records[i].date === today){ todayRecord = data.records[i]; break; }
  }

  var html = '<div style="margin-bottom:10px"><canvas id="v17WeatherCanvas" width="560" height="280" style="width:100%;border-radius:12px;background:'+(dark?'#1a1030':'#F0F8FF')+'"></canvas></div>';
  html += '<div style="text-align:center;margin-bottom:8px;font-size:12px;color:var(--text-sub)">오늘의 감정 날씨를 선택하세요:</div>';
  html += '<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-bottom:8px">';
  EMOTION_WEATHERS.forEach(function(w){
    html += '<button class="v17WeatherBtn" data-wid="'+w.id+'" style="display:flex;flex-direction:column;align-items:center;gap:2px;padding:8px 10px;border-radius:12px;border:2px solid '+(todayRecord&&todayRecord.weather===w.id?w.color:'transparent')+';background:'+(dark?'rgba(255,255,255,.06)':'rgba(0,0,0,.03)')+';cursor:pointer;transition:all .2s;min-width:60px"><span style="font-size:24px">'+w.emoji+'</span><span style="font-size:10px;font-weight:700;color:var(--text-sub)">'+w.name+'</span></button>';
  });
  html += '</div>';
  html += '<div id="v17WeatherMsg" style="font-size:12px;text-align:center;color:var(--text-sub);padding:8px">'+(todayRecord?'오늘: '+todayRecord.weather+' - '+todayRecord.note:'아직 기록하지 않았어요')+'</div>';

  var m = createV17Modal('&#x1F326; 감정 날씨 예보', html);

  function drawWeather(){
    var c = document.getElementById('v17WeatherCanvas');
    if(!c) return;
    var ctx = c.getContext('2d');
    var W = c.width, H = c.height;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = dark?'#1a1030':'#F0F8FF';
    ctx.fillRect(0,0,W,H);

    ctx.font = 'bold 14px sans-serif';
    ctx.fillStyle = dark?'#FF8EC4':'#FF5FA2';
    ctx.textAlign = 'center';
    ctx.fillText('최근 7일 감정 날씨', W/2, 24);

    var recent = data.records.slice(-7);
    if(recent.length === 0){
      ctx.font = '13px sans-serif';
      ctx.fillStyle = dark?'#666':'#999';
      ctx.fillText('아직 기록이 없어요. 오늘의 감정을 선택해보세요!', W/2, H/2);
      return;
    }

    var barW = Math.min(60, (W-80)/7);
    var barGap = 10;
    var totalW = recent.length * barW + (recent.length-1)*barGap;
    var startX = (W-totalW)/2;

    for(var i=0;i<recent.length;i++){
      var r = recent[i];
      var wx = startX + i*(barW+barGap);
      var wy = 50;
      var wh = H - 80;

      var weather = null;
      for(var j=0;j<EMOTION_WEATHERS.length;j++){
        if(EMOTION_WEATHERS[j].id === r.weather){ weather = EMOTION_WEATHERS[j]; break; }
      }
      if(!weather) continue;

      ctx.fillStyle = weather.color + '33';
      ctx.beginPath();
      ctx.roundRect(wx, wy, barW, wh, 10);
      ctx.fill();
      ctx.strokeStyle = weather.color;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.font = '28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(String.fromCodePoint(parseInt(weather.emoji.replace(/&#x|;/g,''),16)), wx+barW/2, wy+wh/2-10);

      ctx.font = 'bold 10px sans-serif';
      ctx.fillStyle = dark?'#aaa':'#666';
      ctx.fillText(weather.name, wx+barW/2, wy+wh/2+18);

      ctx.font = '9px sans-serif';
      ctx.fillStyle = dark?'#777':'#999';
      ctx.fillText(r.date.slice(5), wx+barW/2, wy+wh-8);
    }
  }

  drawWeather();

  m.modal.querySelectorAll('.v17WeatherBtn').forEach(function(btn){
    btn.onclick = function(){
      var wid = btn.dataset.wid;
      var weather = null;
      for(var j=0;j<EMOTION_WEATHERS.length;j++){
        if(EMOTION_WEATHERS[j].id === wid){ weather = EMOTION_WEATHERS[j]; break; }
      }
      if(!weather) return;

      var existing = -1;
      for(var i=0;i<data.records.length;i++){
        if(data.records[i].date === today){ existing = i; break; }
      }
      if(existing >= 0){
        data.records[existing].weather = wid;
        data.records[existing].note = weather.desc;
      } else {
        data.records.push({date:today,weather:wid,note:weather.desc});
      }
      if(data.records.length > 30) data.records = data.records.slice(-30);
      v17Save('hatcuping_emotionweather', data);
      sfxV17('emotion_save');
      showToastV17(weather.emoji + ' 오늘의 감정: ' + weather.name + '!');

      m.modal.querySelectorAll('.v17WeatherBtn').forEach(function(b){
        b.style.borderColor = b.dataset.wid === wid ? weather.color : 'transparent';
      });
      document.getElementById('v17WeatherMsg').textContent = '오늘: ' + weather.name + ' - ' + weather.desc;
      drawWeather();
    };
  });
}


// ============================================================
// 5. TREASURE HUNT (Canvas 8x6 grid dig game)
// ============================================================
function openTreasureHunt(){
  trackV17Feature('treasure');
  sfxV17('v17_feature');
  var data = v17Load('hatcuping_treasure', {totalFound:0,plays:0});
  var dark = isDarkV17();

  var cols = 8, rows = 6;
  var grid = [];
  var treasures = [
    {emoji:'&#x1F48E;',name:'보석',points:30},
    {emoji:'&#x1F451;',name:'왕관;',points:50},
    {emoji:'&#x2B50;',name:'별',points:20},
    {emoji:'&#x1F3C6;',name:'트로피',points:40},
    {emoji:'&#x1F381;',name:'선물',points:25},
    {emoji:'&#x1F36D;',name:'사탕',points:10}
  ];

  for(var y=0;y<rows;y++){
    grid[y] = [];
    for(var x=0;x<cols;x++){
      grid[y][x] = {dug:false,treasure:null};
    }
  }
  var numTreasures = 8;
  var placed = 0;
  while(placed < numTreasures){
    var tx = Math.floor(Math.random()*cols);
    var ty = Math.floor(Math.random()*rows);
    if(!grid[ty][tx].treasure){
      grid[ty][tx].treasure = treasures[Math.floor(Math.random()*treasures.length)];
      placed++;
    }
  }

  var digs = 12, score = 0, found = 0;

  var html = '<div style="margin-bottom:8px"><canvas id="v17TreasureCanvas" width="520" height="340" style="width:100%;border-radius:12px;cursor:pointer;background:'+(dark?'#2a1a10':'#FFF3E0')+'"></canvas></div>';
  html += '<div id="v17TreasureInfo" style="font-size:12px;text-align:center;color:var(--text-sub)">남은 파기: '+digs+' | 점수: '+score+' | 총 발견: '+data.totalFound+'</div>';

  var m = createV17Modal('&#x1F3F4; 보물찾기 모험', html);

  function drawTreasure(){
    var c = document.getElementById('v17TreasureCanvas');
    if(!c) return;
    var ctx = c.getContext('2d');
    var W = c.width, H = c.height;
    ctx.clearRect(0,0,W,H);

    var sandGrad = ctx.createLinearGradient(0,0,0,H);
    sandGrad.addColorStop(0, dark?'#2a1a10':'#FFF3E0');
    sandGrad.addColorStop(1, dark?'#1a0d05':'#FFE0B2');
    ctx.fillStyle = sandGrad;
    ctx.fillRect(0,0,W,H);

    ctx.font = 'bold 13px sans-serif';
    ctx.fillStyle = dark?'#FFB74D':'#E65100';
    ctx.textAlign = 'center';
    ctx.fillText('보물찾기! 땅을 파서 보물을 찾으세요! (남은: '+digs+'회)', W/2, 22);

    var cellW = (W-40)/cols, cellH = (H-50)/rows;

    for(var y=0;y<rows;y++){
      for(var x=0;x<cols;x++){
        var cx = 20 + x*cellW, cy = 36 + y*cellH;
        var cell = grid[y][x];

        if(cell.dug){
          ctx.fillStyle = dark?'rgba(101,67,33,.3)':'#D7CCC8';
          ctx.beginPath();
          ctx.roundRect(cx+2, cy+2, cellW-4, cellH-4, 6);
          ctx.fill();

          if(cell.treasure){
            ctx.font = '22px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(String.fromCodePoint(parseInt(cell.treasure.emoji.replace(/&#x|;/g,''),16)), cx+cellW/2, cy+cellH/2-2);
            ctx.font = '8px sans-serif';
            ctx.fillStyle = dark?'#FFB74D':'#E65100';
            ctx.fillText('+'+cell.treasure.points, cx+cellW/2, cy+cellH/2+16);
          } else {
            ctx.font = '16px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = dark?'#555':'#bbb';
            ctx.fillText('✖', cx+cellW/2, cy+cellH/2);
          }
        } else {
          ctx.fillStyle = dark?'rgba(139,109,69,.4)':'#A1887F';
          ctx.beginPath();
          ctx.roundRect(cx+2, cy+2, cellW-4, cellH-4, 6);
          ctx.fill();
          ctx.fillStyle = dark?'rgba(160,130,90,.5)':'#BCAAA4';
          ctx.fillRect(cx+6, cy+6, cellW-12, 3);
          ctx.fillRect(cx+10, cy+12, cellW-20, 2);
        }
      }
    }

    document.getElementById('v17TreasureInfo').textContent = '남은 파기: '+digs+' | 점수: '+score+' | 총 발견: '+data.totalFound;
  }

  drawTreasure();

  document.getElementById('v17TreasureCanvas').onclick = function(e){
    if(digs <= 0) return;
    var c = document.getElementById('v17TreasureCanvas');
    var rect = c.getBoundingClientRect();
    var scaleX = c.width/rect.width, scaleY = c.height/rect.height;
    var mx = (e.clientX-rect.left)*scaleX;
    var my = (e.clientY-rect.top)*scaleY;

    var cellW = (c.width-40)/cols, cellH = (c.height-50)/rows;
    var gx = Math.floor((mx-20)/cellW);
    var gy = Math.floor((my-36)/cellH);
    if(gx<0||gx>=cols||gy<0||gy>=rows) return;
    if(grid[gy][gx].dug) return;

    grid[gy][gx].dug = true;
    digs--;

    if(grid[gy][gx].treasure){
      score += grid[gy][gx].treasure.points;
      found++;
      data.totalFound++;
      v17Save('hatcuping_treasure', data);
      sfxV17('treasure_find');
      showToastV17(grid[gy][gx].treasure.emoji + ' ' + grid[gy][gx].treasure.name + ' 발견! +' + grid[gy][gx].treasure.points);
    } else {
      sfxV17('treasure_dig');
    }

    if(digs === 0){
      data.plays++;
      v17Save('hatcuping_treasure', data);
      showToastV17('&#x1F3F4; 탐험 종료! 점수: ' + score + ' (발견: '+found+'/'+numTreasures+')');
    }

    drawTreasure();
  };
}


// ============================================================
// 6. DRESS-UP STUDIO (Canvas character dress-up, 8 categories)
// ============================================================
var DRESSUP_PARTS = {
  hair: [{name:'기본',color:'#5D4037'},{name:'봄날',color:'#FF7043'},{name:'바다',color:'#42A5F5'},{name:'숲',color:'#66BB6A'},{name:'별빛',color:'#FFD54F'},{name:'라벤더',color:'#AB47BC'}],
  eyes: [{name:'반짝',color:'#1565C0'},{name:'별',color:'#FFD54F'},{name:'하트',color:'#E91E63'},{name:'초록',color:'#43A047'}],
  outfit: [{name:'핑크',color:'#FF5FA2'},{name:'블루',color:'#2196F3'},{name:'민트',color:'#4CAF50'},{name:'보라',color:'#9C27B0'},{name:'골드',color:'#FFC107'}],
  accessory: [{name:'없음',color:'transparent'},{name:'리본',color:'#E91E63'},{name:'별핑',color:'#FFD54F'},{name:'반짝이',color:'#CE93D8'},{name:'하트',color:'#F44336'}]
};

function openDressUpStudio(){
  trackV17Feature('dressup');
  sfxV17('v17_feature');
  var dark = isDarkV17();
  var selected = v17Load('hatcuping_dressup', {hair:0,eyes:0,outfit:0,accessory:0});

  var html = '<div style="margin-bottom:8px"><canvas id="v17DressCanvas" width="400" height="380" style="width:100%;border-radius:12px;background:'+(dark?'#1a1030':'#FFF0F8')+'"></canvas></div>';
  var categories = [{key:'hair',label:'&#x1F487; 머리'},{key:'eyes',label:'&#x1F440; 눈'},{key:'outfit',label:'&#x1F457; 옷'},{key:'accessory',label:'&#x1F380; 액세서리'}];
  categories.forEach(function(cat){
    html += '<div style="margin-bottom:8px"><div style="font-size:11px;font-weight:700;color:var(--text-sub);margin-bottom:4px">'+cat.label+'</div>';
    html += '<div style="display:flex;gap:4px;flex-wrap:wrap">';
    DRESSUP_PARTS[cat.key].forEach(function(part,idx){
      html += '<button class="v17DressBtn" data-cat="'+cat.key+'" data-idx="'+idx+'" style="padding:4px 10px;border-radius:10px;border:2px solid '+(selected[cat.key]===idx?'#FF5FA2':'transparent')+';background:'+(dark?'rgba(255,255,255,.06)':'rgba(0,0,0,.03)')+';cursor:pointer;font-size:11px;font-weight:600;color:var(--text-sub);transition:all .2s">'+part.name+'</button>';
    });
    html += '</div></div>';
  });
  html += '<button id="v17DressRandom" style="width:100%;padding:8px;border-radius:12px;border:2px solid #FF5FA2;background:linear-gradient(135deg,#FF5FA2,#B066FF);color:#fff;font-weight:700;cursor:pointer;font-size:12px;margin-top:4px">&#x1F3B2; 램덤 코디네이션</button>';

  var m = createV17Modal('&#x1F457; 코디네이션 스튜디오', html);

  function drawCharacter(){
    var c = document.getElementById('v17DressCanvas');
    if(!c) return;
    var ctx = c.getContext('2d');
    var W = c.width, H = c.height;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = dark?'#1a1030':'#FFF0F8';
    ctx.fillRect(0,0,W,H);

    var cX = W/2, cY = H/2;

    ctx.fillStyle = '#FFCCBC';
    ctx.beginPath();
    ctx.arc(cX, cY-50, 50, 0, Math.PI*2);
    ctx.fill();

    var hairColor = DRESSUP_PARTS.hair[selected.hair].color;
    ctx.fillStyle = hairColor;
    ctx.beginPath();
    ctx.ellipse(cX, cY-80, 55, 35, 0, Math.PI, 0);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cX-45, cY-55, 15, 30, -0.2, 0, Math.PI*2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cX+45, cY-55, 15, 30, 0.2, 0, Math.PI*2);
    ctx.fill();

    var eyeColor = DRESSUP_PARTS.eyes[selected.eyes].color;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(cX-18, cY-55, 12, 14, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cX+18, cY-55, 12, 14, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = eyeColor;
    ctx.beginPath();
    ctx.arc(cX-18, cY-53, 7, 0, Math.PI*2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cX+18, cY-53, 7, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(cX-18, cY-53, 3, 0, Math.PI*2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cX+18, cY-53, 3, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(cX-16, cY-55, 2, 0, Math.PI*2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cX+20, cY-55, 2, 0, Math.PI*2);
    ctx.fill();

    ctx.fillStyle = '#FF8A80';
    ctx.beginPath();
    ctx.arc(cX, cY-38, 4, 0, Math.PI*2);
    ctx.fill();

    ctx.strokeStyle = '#E91E63';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cX, cY-30, 8, 0.1*Math.PI, 0.9*Math.PI);
    ctx.stroke();

    ctx.fillStyle = '#FFCCBC';
    ctx.fillRect(cX-10, cY-5, 20, 20);

    var outfitColor = DRESSUP_PARTS.outfit[selected.outfit].color;
    ctx.fillStyle = outfitColor;
    ctx.beginPath();
    ctx.moveTo(cX-35, cY+15);
    ctx.lineTo(cX+35, cY+15);
    ctx.lineTo(cX+45, cY+100);
    ctx.lineTo(cX-45, cY+100);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = outfitColor;
    ctx.beginPath();
    ctx.ellipse(cX-40, cY+30, 12, 25, -0.3, 0, Math.PI*2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cX+40, cY+30, 12, 25, 0.3, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#FFCCBC';
    ctx.beginPath();
    ctx.arc(cX-48, cY+55, 8, 0, Math.PI*2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cX+48, cY+55, 8, 0, Math.PI*2);
    ctx.fill();

    ctx.fillStyle = '#FFCCBC';
    ctx.fillRect(cX-18, cY+100, 12, 40);
    ctx.fillRect(cX+6, cY+100, 12, 40);
    ctx.fillStyle = dark?'#333':'#795548';
    ctx.beginPath();
    ctx.ellipse(cX-12, cY+142, 14, 8, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cX+12, cY+142, 14, 8, 0, 0, Math.PI*2);
    ctx.fill();

    var accIdx = selected.accessory;
    if(accIdx > 0){
      var accColor = DRESSUP_PARTS.accessory[accIdx].color;
      if(accIdx === 1){
        ctx.fillStyle = accColor;
        ctx.beginPath();
        ctx.moveTo(cX-12, cY-90);
        ctx.lineTo(cX, cY-80);
        ctx.lineTo(cX+12, cY-90);
        ctx.quadraticCurveTo(cX, cY-100, cX-12, cY-90);
        ctx.fill();
      } else if(accIdx === 2){
        ctx.fillStyle = accColor;
        ctx.beginPath();
        ctx.moveTo(cX+30, cY-85);
        for(var s=0;s<5;s++){
          var angle = s*Math.PI*2/5 - Math.PI/2;
          var r1 = 10, r2 = 5;
          ctx.lineTo(cX+30+Math.cos(angle)*r1, cY-85+Math.sin(angle)*r1);
          ctx.lineTo(cX+30+Math.cos(angle+Math.PI/5)*r2, cY-85+Math.sin(angle+Math.PI/5)*r2);
        }
        ctx.closePath();
        ctx.fill();
      } else if(accIdx === 3){
        ctx.strokeStyle = accColor;
        ctx.lineWidth = 3;
        for(var sp=0;sp<3;sp++){
          ctx.beginPath();
          ctx.arc(cX+25+sp*6, cY-75-sp*4, 3, 0, Math.PI*2);
          ctx.stroke();
        }
      } else if(accIdx === 4){
        ctx.fillStyle = accColor;
        var hx = cX+35, hy = cY-70;
        ctx.beginPath();
        ctx.moveTo(hx, hy+8);
        ctx.bezierCurveTo(hx-10, hy-5, hx-5, hy-12, hx, hy-4);
        ctx.bezierCurveTo(hx+5, hy-12, hx+10, hy-5, hx, hy+8);
        ctx.fill();
      }
    }

    ctx.font = 'bold 11px sans-serif';
    ctx.fillStyle = dark?'#aaa':'#666';
    ctx.textAlign = 'center';
    ctx.fillText('내 캐릭터 코디네이션', cX, H-10);
  }

  drawCharacter();

  m.modal.querySelectorAll('.v17DressBtn').forEach(function(btn){
    btn.onclick = function(){
      var cat = btn.dataset.cat;
      var idx = parseInt(btn.dataset.idx);
      selected[cat] = idx;
      v17Save('hatcuping_dressup', selected);
      sfxV17('dress_change');

      m.modal.querySelectorAll('.v17DressBtn[data-cat="'+cat+'"]').forEach(function(b){
        b.style.borderColor = parseInt(b.dataset.idx)===idx?'#FF5FA2':'transparent';
      });
      drawCharacter();
    };
  });

  m.modal.querySelector('#v17DressRandom').onclick = function(){
    selected.hair = Math.floor(Math.random()*DRESSUP_PARTS.hair.length);
    selected.eyes = Math.floor(Math.random()*DRESSUP_PARTS.eyes.length);
    selected.outfit = Math.floor(Math.random()*DRESSUP_PARTS.outfit.length);
    selected.accessory = Math.floor(Math.random()*DRESSUP_PARTS.accessory.length);
    v17Save('hatcuping_dressup', selected);
    sfxV17('stamp_complete');

    m.modal.querySelectorAll('.v17DressBtn').forEach(function(b){
      b.style.borderColor = parseInt(b.dataset.idx)===selected[b.dataset.cat]?'#FF5FA2':'transparent';
    });
    drawCharacter();
  };
}


// ============================================================
// 7. WORD CHAIN GAME (끝말잇기 with hatcuping vocab)
// ============================================================
var WORD_CHAIN_VOCAB = [
  '하츄핑','바로핑','차차핑','로미','사랑','모험','용기','우정',
  '행복','별빛','비밀','보물','마법','동화','연금술','원석',
  '요정','솔직','씨앗','나라','친구','이야기','마을','숲',
  '꽃방','수호','감정','음악','무지개','별똑별','봉오리','하늘',
  '바다','산','때릭','새벽','황혼','새벽별','운동','사탕',
  '기쁨','습관','탐험','발견','지혀','성장','창작','꽃백'
];

function openWordChain(){
  trackV17Feature('wordchain');
  sfxV17('v17_feature');
  var data = v17Load('hatcuping_wordchain', {best:0,plays:0});
  var dark = isDarkV17();
  var chain = [];
  var usedWords = {};
  var score = 0;
  var aiWords = WORD_CHAIN_VOCAB.slice();

  var html = '<div style="margin-bottom:10px"><canvas id="v17WordCanvas" width="500" height="200" style="width:100%;border-radius:12px;background:'+(dark?'#1a1030':'#F5F5FF')+'"></canvas></div>';
  html += '<div style="display:flex;gap:6px;margin-bottom:8px">';
  html += '<input id="v17WordInput" type="text" placeholder="단어를 입력하세요" style="flex:1;padding:8px 12px;border-radius:12px;border:2px solid var(--border);background:var(--card-bg);color:var(--text);font-size:13px">';
  html += '<button id="v17WordSubmit" style="padding:8px 16px;border-radius:12px;border:none;background:linear-gradient(135deg,#FF5FA2,#B066FF);color:#fff;font-weight:700;cursor:pointer;font-size:13px">입력</button>';
  html += '</div>';
  html += '<div id="v17WordInfo" style="font-size:12px;text-align:center;color:var(--text-sub)">첫 단어를 입력해보세요! (베스트: '+(data.best||0)+'점)</div>';

  var m = createV17Modal('&#x1F4AC; 끝말잇기', html);

  function drawWordChain(){
    var c = document.getElementById('v17WordCanvas');
    if(!c) return;
    var ctx = c.getContext('2d');
    var W = c.width, H = c.height;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = dark?'#1a1030':'#F5F5FF';
    ctx.fillRect(0,0,W,H);

    ctx.font = 'bold 14px sans-serif';
    ctx.fillStyle = dark?'#FF8EC4':'#FF5FA2';
    ctx.textAlign = 'center';
    ctx.fillText('끝말잇기 - 점수: '+score, W/2, 22);

    var display = chain.slice(-6);
    var startX = 30;
    for(var i=0;i<display.length;i++){
      var x = startX + i*78;
      var y = 50;
      ctx.fillStyle = display[i].isAI ? (dark?'rgba(176,102,255,.15)':'rgba(176,102,255,.1)') : (dark?'rgba(255,95,162,.15)':'rgba(255,95,162,.1)');
      ctx.beginPath();
      ctx.roundRect(x, y, 72, 50, 10);
      ctx.fill();
      ctx.strokeStyle = display[i].isAI ? '#B066FF' : '#FF5FA2';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.font = 'bold 13px sans-serif';
      ctx.fillStyle = dark?'#eee':'#333';
      ctx.textAlign = 'center';
      ctx.fillText(display[i].word, x+36, y+28);
      ctx.font = '9px sans-serif';
      ctx.fillStyle = dark?'#aaa':'#999';
      ctx.fillText(display[i].isAI?'AI':'YOU', x+36, y+44);
    }

    if(chain.length > 0){
      var last = chain[chain.length-1].word;
      var lastChar = last.charAt(last.length-1);
      ctx.font = 'bold 16px sans-serif';
      ctx.fillStyle = dark?'#FFD54F':'#FF6F00';
      ctx.textAlign = 'center';
      ctx.fillText('다음 글자: "' + lastChar + '"', W/2, H-30);
    }

    if(display.length > 1){
      for(var j=0;j<display.length-1;j++){
        var ax = startX + j*78 + 72;
        var ay = 75;
        ctx.fillStyle = dark?'#666':'#ccc';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('→', ax+3, ay);
      }
    }
  }

  drawWordChain();

  function submitWord(){
    var input = document.getElementById('v17WordInput');
    var word = input.value.trim();
    if(!word || word.length < 2){
      showToastV17('2글자 이상 입력해주세요!');
      return;
    }

    if(usedWords[word]){
      showToastV17('이미 사용한 단어예요!');
      return;
    }

    if(chain.length > 0){
      var lastWord = chain[chain.length-1].word;
      var lastChar = lastWord.charAt(lastWord.length-1);
      if(word.charAt(0) !== lastChar){
        showToastV17('"'+lastChar+'"으로 시작하는 단어를 입력해주세요!');
        return;
      }
    }

    chain.push({word:word,isAI:false});
    usedWords[word] = true;
    score += word.length;
    input.value = '';
    sfxV17('memory_match');

    var targetChar = word.charAt(word.length-1);
    var aiChoices = aiWords.filter(function(w){ return w.charAt(0) === targetChar && !usedWords[w]; });

    if(aiChoices.length > 0){
      var aiWord = aiChoices[Math.floor(Math.random()*aiChoices.length)];
      chain.push({word:aiWord,isAI:true});
      usedWords[aiWord] = true;
      score += 2;
    } else {
      showToastV17('&#x1F389; AI가 항복! 축하합니다!');
      score += 10;
      if(score > data.best){ data.best = score; }
      data.plays++;
      v17Save('hatcuping_wordchain', data);
    }

    drawWordChain();
    document.getElementById('v17WordInfo').textContent = '점수: '+score+' | 체인: '+chain.length+'단어 | 베스트: '+data.best;
  }

  m.modal.querySelector('#v17WordSubmit').onclick = submitWord;
  m.modal.querySelector('#v17WordInput').onkeydown = function(e){ if(e.key==='Enter') submitWord(); };
}


// ============================================================
// 8. FRIENDSHIP POWER METER (Canvas 6-axis radar, team combo)
// ============================================================
function openFriendshipMeter(){
  trackV17Feature('friendship');
  sfxV17('v17_feature');
  var dark = isDarkV17();

  var stats = {love:0,courage:0,wisdom:0,joy:0,honesty:0,kindness:0};
  try{
    var a = JSON.parse(localStorage.getItem('hatcuping_achievements') || '{}');
    stats.love = Math.min(Object.keys(a).length * 5, 100);
    var s = JSON.parse(localStorage.getItem('hatcuping_stats') || '{}');
    stats.courage = Math.min((s.clears||0)*10, 100);
    stats.wisdom = Math.min((s.combos||0)*5, 100);
    stats.joy = Math.min((s.playTime||0)/36, 100);

    var features = [];
    try{ features = JSON.parse(localStorage.getItem('hatcuping_v16_features') || '[]'); }catch(e){}
    var features17 = [];
    try{ features17 = JSON.parse(localStorage.getItem('hatcuping_v17_features') || '[]'); }catch(e){}
    stats.honesty = Math.min((features.length + features17.length) * 8, 100);
    stats.kindness = Math.min((s.hearts||0)*2, 100);
  }catch(e){}

  var html = '<div style="margin-bottom:8px"><canvas id="v17FriendCanvas" width="440" height="400" style="width:100%;border-radius:12px;background:'+(dark?'#1a1030':'#FFF0F8')+'"></canvas></div>';
  html += '<div style="font-size:11px;text-align:center;color:var(--text-sub)">게임 활동으로 우정 파워가 성장해요!</div>';

  var m = createV17Modal('&#x1F91D; 우정 파워 미터', html);

  var c = document.getElementById('v17FriendCanvas');
  if(!c) return;
  var ctx = c.getContext('2d');
  var W = c.width, H = c.height;
  var cX = W/2, cY = H/2 + 10;
  var R = 140;

  ctx.clearRect(0,0,W,H);
  ctx.fillStyle = dark?'#1a1030':'#FFF0F8';
  ctx.fillRect(0,0,W,H);

  ctx.font = 'bold 16px sans-serif';
  ctx.fillStyle = dark?'#FF8EC4':'#FF5FA2';
  ctx.textAlign = 'center';
  ctx.fillText('우정 파워 미터', cX, 28);

  var axes = [
    {key:'love',label:'사랑',emoji:'❤️',angle:-Math.PI/2},
    {key:'courage',label:'용기',emoji:'💪',angle:-Math.PI/2+Math.PI/3},
    {key:'wisdom',label:'지혜',emoji:'💡',angle:-Math.PI/2+2*Math.PI/3},
    {key:'joy',label:'기쁨',emoji:'😄',angle:-Math.PI/2+Math.PI},
    {key:'honesty',label:'성실',emoji:'⭐',angle:-Math.PI/2+4*Math.PI/3},
    {key:'kindness',label:'친절',emoji:'💖',angle:-Math.PI/2+5*Math.PI/3}
  ];

  for(var ring=4;ring>=1;ring--){
    var rr = R * ring/4;
    ctx.beginPath();
    for(var a=0;a<6;a++){
      var ax = cX + Math.cos(axes[a].angle)*rr;
      var ay = cY + Math.sin(axes[a].angle)*rr;
      if(a===0) ctx.moveTo(ax,ay);
      else ctx.lineTo(ax,ay);
    }
    ctx.closePath();
    ctx.strokeStyle = dark?'rgba(255,255,255,.08)':'rgba(0,0,0,.06)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  for(var a=0;a<6;a++){
    ctx.beginPath();
    ctx.moveTo(cX, cY);
    ctx.lineTo(cX+Math.cos(axes[a].angle)*R, cY+Math.sin(axes[a].angle)*R);
    ctx.strokeStyle = dark?'rgba(255,255,255,.1)':'rgba(0,0,0,.08)';
    ctx.stroke();

    var lx = cX + Math.cos(axes[a].angle)*(R+28);
    var ly = cY + Math.sin(axes[a].angle)*(R+28);
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(axes[a].emoji, lx, ly-8);
    ctx.font = 'bold 10px sans-serif';
    ctx.fillStyle = dark?'#aaa':'#666';
    ctx.fillText(axes[a].label, lx, ly+10);
    ctx.fillStyle = dark?'#FF8EC4':'#FF5FA2';
    ctx.fillText(Math.round(stats[axes[a].key])+'%', lx, ly+22);
  }

  ctx.beginPath();
  for(var a=0;a<6;a++){
    var val = stats[axes[a].key]/100;
    var px = cX + Math.cos(axes[a].angle)*R*val;
    var py = cY + Math.sin(axes[a].angle)*R*val;
    if(a===0) ctx.moveTo(px,py);
    else ctx.lineTo(px,py);
  }
  ctx.closePath();
  ctx.fillStyle = 'rgba(255,95,162,.2)';
  ctx.fill();
  ctx.strokeStyle = '#FF5FA2';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  for(var a=0;a<6;a++){
    var val = stats[axes[a].key]/100;
    var px = cX + Math.cos(axes[a].angle)*R*val;
    var py = cY + Math.sin(axes[a].angle)*R*val;
    ctx.fillStyle = '#FF5FA2';
    ctx.beginPath();
    ctx.arc(px,py,4,0,Math.PI*2);
    ctx.fill();
  }

  var total = Math.round((stats.love+stats.courage+stats.wisdom+stats.joy+stats.honesty+stats.kindness)/6);
  var grade = total>=90?'S':total>=75?'A':total>=60?'B':total>=40?'C':'D';
  var gradeColor = grade==='S'?'#FFD700':grade==='A'?'#4CAF50':grade==='B'?'#2196F3':grade==='C'?'#FF9800':'#F44336';
  ctx.font = 'bold 28px sans-serif';
  ctx.fillStyle = gradeColor;
  ctx.textAlign = 'center';
  ctx.fillText(grade, cX, cY+6);
  ctx.font = '11px sans-serif';
  ctx.fillStyle = dark?'#aaa':'#888';
  ctx.fillText(total+'%', cX, cY+22);
}


// ============================================================
// V17 ACHIEVEMENTS (12 new, 130->142)
// ============================================================
var V17_ACHIEVEMENTS = [
  {id:'a_v17_stamp_first',name:'스탬프 수집가',desc:'스탬프 처음 수집',cat:'general',icon:'🎫'},
  {id:'a_v17_stamp_all',name:'스탬프 마스터',desc:'스탬프 20개 전부 수집',cat:'general',icon:'🏅'},
  {id:'a_v17_garden_first',name:'초보 정원사',desc:'첫 번째 꽃 수확',cat:'general',icon:'🌺'},
  {id:'a_v17_garden_10',name:'꽃 마스터',desc:'꽃 10송이 수확',cat:'general',icon:'🌻'},
  {id:'a_v17_memory_first',name:'기억력 입문',desc:'카드 매칭 처음 클리어',cat:'general',icon:'🃏'},
  {id:'a_v17_memory_fast',name:'기억력 달인',desc:'12수 이하로 클리어',cat:'general',icon:'🧠'},
  {id:'a_v17_weather_7',name:'감정 기록가',desc:'감정 날씨 7일 기록',cat:'general',icon:'⛅'},
  {id:'a_v17_treasure_first',name:'보물 헌터',desc:'첫 보물 발견',cat:'general',icon:'💎'},
  {id:'a_v17_treasure_10',name:'보물 마스터',desc:'보물 10개 발견',cat:'general',icon:'👑'},
  {id:'a_v17_dressup',name:'패션니스타',desc:'코디네이션 체험',cat:'general',icon:'👗'},
  {id:'a_v17_wordchain',name:'끝말잇기 도전',desc:'끝말잇기 첫 플레이',cat:'general',icon:'💬'},
  {id:'a_v17_explorer',name:'v17 탐험가',desc:'v17 기능 6개 이상 체험',cat:'general',icon:'🌟'}
];


// ============================================================
// INJECT V17 ACHIEVEMENTS
// ============================================================
function injectV17Achievements(){
  if(!window.AD) return;
  V17_ACHIEVEMENTS.forEach(function(a){
    var exists = false;
    for(var i=0;i<window.AD.length;i++){
      if(window.AD[i].id === a.id){ exists = true; break; }
    }
    if(!exists) window.AD.push(a);
  });
}


// ============================================================
// CHECK AND AWARD V17 ACHIEVEMENTS
// ============================================================
function checkAndAwardV17(){
  try{
    var a = JSON.parse(localStorage.getItem('hatcuping_achievements') || '{}');

    var stamps = v17Load('hatcuping_stamps', {collected:{}});
    if(Object.keys(stamps.collected).length > 0 && !a.a_v17_stamp_first){
      a.a_v17_stamp_first = Date.now();
      showToastV17('🏆 스탬프 수집가 업적 달성!');
    }
    if(Object.keys(stamps.collected).length >= 20 && !a.a_v17_stamp_all){
      a.a_v17_stamp_all = Date.now();
      showToastV17('🏆 스탬프 마스터 업적 달성!');
    }

    var garden = v17Load('hatcuping_garden', {totalGrown:0});
    if(garden.totalGrown > 0 && !a.a_v17_garden_first){
      a.a_v17_garden_first = Date.now();
      showToastV17('🏆 초보 정원사 업적 달성!');
    }
    if(garden.totalGrown >= 10 && !a.a_v17_garden_10){
      a.a_v17_garden_10 = Date.now();
      showToastV17('🏆 꽃 마스터 업적 달성!');
    }

    var memory = v17Load('hatcuping_memory', {best:999,plays:0});
    if(memory.plays > 0 && !a.a_v17_memory_first){
      a.a_v17_memory_first = Date.now();
      showToastV17('🏆 기억력 입문 업적 달성!');
    }
    if(memory.best <= 12 && !a.a_v17_memory_fast){
      a.a_v17_memory_fast = Date.now();
      showToastV17('🏆 기억력 달인 업적 달성!');
    }

    var weather = v17Load('hatcuping_emotionweather', {records:[]});
    if(weather.records.length >= 7 && !a.a_v17_weather_7){
      a.a_v17_weather_7 = Date.now();
      showToastV17('🏆 감정 기록가 업적 달성!');
    }

    var treasure = v17Load('hatcuping_treasure', {totalFound:0});
    if(treasure.totalFound > 0 && !a.a_v17_treasure_first){
      a.a_v17_treasure_first = Date.now();
      showToastV17('🏆 보물 헌터 업적 달성!');
    }
    if(treasure.totalFound >= 10 && !a.a_v17_treasure_10){
      a.a_v17_treasure_10 = Date.now();
      showToastV17('🏆 보물 마스터 업적 달성!');
    }

    var features = [];
    try{ features = JSON.parse(localStorage.getItem('hatcuping_v17_features') || '[]'); }catch(e){}
    if(features.indexOf('dressup') !== -1 && !a.a_v17_dressup){
      a.a_v17_dressup = Date.now();
      showToastV17('🏆 패션니스타 업적 달성!');
    }
    if(features.indexOf('wordchain') !== -1 && !a.a_v17_wordchain){
      a.a_v17_wordchain = Date.now();
      showToastV17('🏆 끝말잇기 도전 업적 달성!');
    }
    if(features.length >= 6 && !a.a_v17_explorer){
      a.a_v17_explorer = Date.now();
      showToastV17('🏆 v17 탐험가 업적 달성!');
    }

    localStorage.setItem('hatcuping_achievements', JSON.stringify(a));
  }catch(e){}
}


// ============================================================
// QUIZ V17 (+15 questions, 120->135)
// ============================================================
function injectExtraQuizV17(){
  if(!window.QUIZ_BANK) window.QUIZ_BANK = [];
  var pool = window.hatcuping_quiz_pool || window.QUIZ_BANK;
  var newQ = [
    {q:'스탬프 랠리의 총 스탬프 수는?',a:['10','15','20','25'],c:2},
    {q:'마법의 정원의 화분 수는?',a:['4','6','8','10'],c:1},
    {q:'마법의 정원에서 가장 오래 걸리는 꽃은?',a:['장미','해바라기','백합','라벤더'],c:2},
    {q:'카드 매칭의 카드 총 수는?',a:['12','14','16','20'],c:2},
    {q:'감정 날씨의 종류 수는?',a:['4','5','6','8'],c:2},
    {q:'무지개 날씨의 의미는?',a:['슬픔','행복','화남','지루함'],c:1},
    {q:'보물찾기의 총 파기 횟수는?',a:['8','10','12','15'],c:2},
    {q:'보물찾기에서 가장 값비싼 보물은?',a:['별','보석','왕관','트로피'],c:2},
    {q:'코디네이션의 머리 색상 수는?',a:['4','5','6','8'],c:2},
    {q:'코디네이션의 액세서리 종류 수는?',a:['3','4','5','6'],c:2},
    {q:'끝말잇기의 최소 글자 수는?',a:['1','2','3','4'],c:1},
    {q:'우정 파워 미터의 축 수는?',a:['4','5','6','8'],c:2},
    {q:'우정 파워의 최고 등급은?',a:['A','S','SS','SSS'],c:1},
    {q:'v17에서 추가된 업적 수는?',a:['8','10','12','15'],c:2},
    {q:'해필핑의 특성은?',a:['용기','행복','지혜','사랑'],c:1}
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
// KEYBOARD SHORTCUTS (8 new: Shift+A/B/C/E/F/G/N/W)
// ============================================================
function injectV17Keyboard(){
  document.addEventListener('keydown', function(e){
    if(e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if(!e.shiftKey) return;
    switch(e.key){
      case 'A': e.preventDefault(); openStampRally(); break;
      case 'B': e.preventDefault(); openMagicGarden(); break;
      case 'C': e.preventDefault(); openMemoryMatch(); break;
      case 'E': e.preventDefault(); openEmotionWeather(); break;
      case 'F': e.preventDefault(); openTreasureHunt(); break;
      case 'G': e.preventDefault(); openDressUpStudio(); break;
      case 'N': e.preventDefault(); openWordChain(); break;
      case 'W': e.preventDefault(); openFriendshipMeter(); break;
    }
  });
}


// ============================================================
// BOTTOM NAVIGATION BAR (8 quick action buttons)
// ============================================================
function injectV17BottomNav(){
  var existing = document.getElementById('v16BottomNav');
  if(existing) existing.remove();
  existing = document.getElementById('v17BottomNav');
  if(existing) return;

  var nav = document.createElement('div');
  nav.id = 'v17BottomNav';
  nav.style.cssText = 'position:fixed;bottom:0;left:0;right:0;display:flex;justify-content:space-around;align-items:center;padding:6px 4px;background:rgba(255,255,255,.95);border-top:1px solid rgba(0,0,0,.08);z-index:900;backdrop-filter:blur(10px)';
  if(isDarkV17()) nav.style.background = 'rgba(26,10,46,.95)';

  var buttons = [
    {icon:'&#x1F3AB;',label:'스탬프',action:openStampRally},
    {icon:'&#x1F33A;',label:'정원',action:openMagicGarden},
    {icon:'&#x1F0CF;',label:'카드매칭',action:openMemoryMatch},
    {icon:'&#x1F326;',label:'감정날씨',action:openEmotionWeather},
    {icon:'&#x1F3F4;',label:'보물',action:openTreasureHunt},
    {icon:'&#x1F457;',label:'코디',action:openDressUpStudio},
    {icon:'&#x1F4AC;',label:'끝말잇기',action:openWordChain},
    {icon:'&#x1F91D;',label:'우정',action:openFriendshipMeter}
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
// FOOTER, NEWS, META, ACHIEVE COUNT UPDATE
// ============================================================
function updateV17Footer(){
  var ver = document.querySelector('.footer .version');
  if(ver) ver.textContent = 'v17.0 | © PRIME Holdings NEXTERA+PRISM';

  var links = document.querySelector('.footer-links');
  if(links) links.innerHTML = '<span class="footer-link">4종 게임</span><span class="footer-link">142개 업적</span><span class="footer-link">스탬프+정원+코디</span><span class="footer-link">카드매칭+보물</span><span class="footer-link">퀀즈 135문</span>';
}

function updateV17News(){
  var newsSection = document.querySelector('.news-section');
  if(!newsSection) return;
  var firstItem = newsSection.querySelector('.news-item');
  if(!firstItem) return;
  var newItem = document.createElement('div');
  newItem.className = 'news-item';
  newItem.innerHTML = '<span class="news-date">v17.0</span><span class="news-text">스탬프랠리20종Canvas, 마법의정원10꽃Canvas, 캐릭터카드매칭4x4Canvas, 감정날씨예보6종Canvas, 보물찾기8x6Canvas, 코디네이션스튜디오Canvas, 끝말잇기AI대전, 우정파워6축Radar, 퀀즈+15(135), 업적+12(142)</span>';
  firstItem.parentNode.insertBefore(newItem, firstItem);
}

function updateV17AchieveCount(){
  var el = document.getElementById('achieveCount');
  if(el){
    var c = 0;
    try{ c = Object.keys(JSON.parse(localStorage.getItem('hatcuping_achievements') || '{}')).length; }catch(e){}
    var t = window.AD ? window.AD.length : 142;
    el.textContent = c + '/' + t;
  }
}

function updateV17Meta(){
  var descMeta = document.querySelector('meta[name="description"]');
  if(descMeta) descMeta.content = '사랑의 하츄핑 v17.0 - 플랫포머 액션, 턴제 RPG, 오픈월드, UNIFIED 4종 게임. 업적 142개, 스탬프랠리20종, 마법의정원10꽃, 카드매칭, 감정날씨, 보물찾기, 코디네이션, 끝말잇기AI, 우정파워6축6Radar, 퀀즈 135문!';
  document.title = '사랑의 하츄핑 v17.0 - 게임 선택';
}


// ============================================================
// BOOT
// ============================================================
function bootV17(){
  injectV17Achievements();
  injectExtraQuizV17();
  injectV17Keyboard();
  injectV17BottomNav();
  updateV17Footer();
  updateV17News();
  updateV17AchieveCount();
  updateV17Meta();
  checkAndAwardV17();
}

if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', bootV17);
} else {
  bootV17();
}

})();

// hatcuping-game v26_patch.js - NEXTERA+PRISM AUTO v26.0
// Self-contained IIFE patch module
(function(){
'use strict';

var _v26Ctx = null;
function _v26InitAudio(){
  if(!_v26Ctx){
    try{ _v26Ctx = new (window.AudioContext || window.webkitAudioContext)(); }catch(e){}
  }
  if(_v26Ctx && _v26Ctx.state === 'suspended') _v26Ctx.resume();
}

var V26_SFX = {
  elem_scan:{f:700,d:.07,t:'triangle'},
  elem_strong:{f:1200,d:.14,t:'sine'},
  combo_chain:{f:880,d:.06,t:'triangle'},
  combo_max:{f:1350,d:.22,t:'sine'},
  awaken_select:{f:650,d:.05,t:'sine'},
  awaken_evolve:{f:1100,d:.2,t:'triangle'},
  explore_click:{f:560,d:.04,t:'square'},
  explore_complete:{f:1250,d:.18,t:'triangle'},
  weakness_scan:{f:490,d:.06,t:'sine'},
  weakness_found:{f:1050,d:.15,t:'triangle'},
  equip_slot:{f:720,d:.05,t:'triangle'},
  equip_set:{f:1180,d:.2,t:'sine'},
  skill_node:{f:630,d:.04,t:'sine'},
  skill_chain:{f:1300,d:.18,t:'triangle'},
  power_calc:{f:580,d:.07,t:'triangle'},
  power_rank:{f:1400,d:.25,t:'sine'},
  v26_nav:{f:760,d:.05,t:'sine'},
  v26_quiz:{f:950,d:.08,t:'triangle'}
};

function sfxV26(type){
  _v26InitAudio();
  if(!_v26Ctx) return;
  var s = V26_SFX[type];
  if(!s) return;
  try{
    var muted = false;
    try{ muted = localStorage.getItem('hatcuping_mute') === '1'; }catch(e){}
    if(muted) return;
    var osc = _v26Ctx.createOscillator();
    var gain = _v26Ctx.createGain();
    osc.type = s.t || 'sine';
    osc.frequency.value = s.f;
    gain.gain.value = 0.08;
    osc.connect(gain);
    gain.connect(_v26Ctx.destination);
    osc.start();
    osc.stop(_v26Ctx.currentTime + (s.d || 0.06));
  }catch(e){}
}

function v26Load(key, fb){ try{ var d = JSON.parse(localStorage.getItem(key)); return d !== null ? d : fb; }catch(e){ return fb; } }
function v26Save(key, data){ try{ localStorage.setItem(key, JSON.stringify(data)); }catch(e){} }
function isDarkV26(){ return document.body.classList.contains('dark'); }
function showToastV26(msg){
  var t = document.getElementById('achieveToast');
  if(t){ t.innerHTML = msg; t.classList.add('show'); setTimeout(function(){ t.classList.remove('show'); }, 2500); }
}

function createV26Modal(title, contentHTML){
  var overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.6);z-index:9999;display:flex;justify-content:center;align-items:center;backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px)';
  var modal = document.createElement('div');
  var bg = isDarkV26() ? '#2a1a3e' : '#fff';
  var col = isDarkV26() ? '#eee' : '#333';
  modal.style.cssText = 'background:' + bg + ';color:' + col + ';border-radius:24px;padding:24px;max-width:700px;width:94%;max-height:85vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.25);position:relative';
  modal.innerHTML = '<button style="position:absolute;top:12px;right:16px;background:none;border:none;font-size:24px;cursor:pointer;color:' + col + '" onclick="this.closest(\'div[style]\').parentElement.remove()">&times;</button><h3 style="font-size:18px;margin-bottom:16px;color:#FF5FA2">' + title + '</h3>' + contentHTML;
  overlay.appendChild(modal);
  overlay.addEventListener('click', function(e){ if(e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
  return modal;
}


// ============================================================
// 1. ELEMENT AFFINITY ANALYZER (Canvas 620x400)
// 8 elements with rock-paper-scissors relationship matrix
// ============================================================
var ELEMENTS = [
  {name:'불꽃',color:'#FF4444',emoji:'🔥',strong:['얼음','바람'],weak:['물','대지']},
  {name:'물',color:'#4488FF',emoji:'💧',strong:['불꽃','대지'],weak:['번개','얼음']},
  {name:'번개',color:'#FFD700',emoji:'⚡',strong:['물','바람'],weak:['대지','빛']},
  {name:'대지',color:'#8B6914',emoji:'🪨',strong:['번개','불꽃'],weak:['물','바람']},
  {name:'바람',color:'#66CC99',emoji:'🌪️',strong:['대지','빛'],weak:['불꽃','번개']},
  {name:'얼음',color:'#88DDFF',emoji:'❄️',strong:['물','바람'],weak:['불꽃','빛']},
  {name:'빛',color:'#FFAA00',emoji:'✨',strong:['어둠','얼음'],weak:['바람','어둠']},
  {name:'어둠',color:'#8844AA',emoji:'🌑',strong:['빛','번개'],weak:['빛','불꽃']}
];

function renderElementAnalyzer(){
  var saved = v26Load('v26_elem', {scanned:[], mode:'matrix'});
  var html = '<canvas id="v26ElemCanvas" width="620" height="400" style="width:100%;max-width:620px;border-radius:12px;cursor:crosshair"></canvas>';
  html += '<div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap;justify-content:center">';
  html += '<button id="v26ElemMode" style="padding:6px 14px;background:linear-gradient(135deg,#FF4444,#FF8800);color:#fff;border:none;border-radius:10px;font-size:11px;font-weight:700;cursor:pointer">' + (saved.mode === 'matrix' ? '🔄 레이더 보기' : '🔄 매트릭스 보기') + '</button>';
  html += '</div>';
  html += '<p style="font-size:11px;color:#999;margin-top:6px;text-align:center">셀 클릭: 상성 관계 확인 | 스캔: ' + saved.scanned.length + '/' + ELEMENTS.length + '</p>';

  var m = createV26Modal('🔥 속성 상성 분석기', html);
  var canvas = m.querySelector('#v26ElemCanvas');
  var ctx = canvas.getContext('2d');
  var hovered = {r:-1,c:-1};

  function getRelation(atk, def){
    if(ELEMENTS[atk].strong.indexOf(ELEMENTS[def].name) >= 0) return 2;
    if(ELEMENTS[atk].weak.indexOf(ELEMENTS[def].name) >= 0) return 0.5;
    return 1;
  }

  function drawMatrix(){
    var dk = isDarkV26();
    ctx.fillStyle = dk ? '#1a0a2e' : '#FAFAFE';
    ctx.fillRect(0,0,620,400);
    var ox = 90, oy = 60, cw = 62, ch = 38;
    ctx.font = '700 13px sans-serif';
    ctx.fillStyle = dk ? '#ccc' : '#555';
    ctx.textAlign = 'center';
    ctx.fillText('공격 →', 350, 22);
    ctx.save(); ctx.translate(18, 250); ctx.rotate(-Math.PI/2);
    ctx.fillText('방어 →', 0, 0); ctx.restore();

    for(var c = 0; c < 8; c++){
      ctx.fillStyle = ELEMENTS[c].color;
      ctx.font = '700 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(ELEMENTS[c].emoji + ELEMENTS[c].name, ox + c * cw + cw/2, oy - 8);
    }
    for(var r = 0; r < 8; r++){
      ctx.fillStyle = ELEMENTS[r].color;
      ctx.font = '700 11px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(ELEMENTS[r].emoji + ' ' + ELEMENTS[r].name, ox - 6, oy + r * ch + ch/2 + 4);
    }

    for(var r2 = 0; r2 < 8; r2++){
      for(var c2 = 0; c2 < 8; c2++){
        var rel = getRelation(c2, r2);
        var x = ox + c2 * cw, y = oy + r2 * ch;
        var isHov = (hovered.r === r2 && hovered.c === c2);
        if(rel === 2) ctx.fillStyle = isHov ? '#FF6666' : (dk ? 'rgba(255,68,68,.35)' : 'rgba(255,68,68,.25)');
        else if(rel === 0.5) ctx.fillStyle = isHov ? '#6688FF' : (dk ? 'rgba(68,136,255,.35)' : 'rgba(68,136,255,.2)');
        else ctx.fillStyle = isHov ? (dk ? 'rgba(255,255,255,.15)' : 'rgba(0,0,0,.08)') : (dk ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.03)');
        ctx.fillRect(x + 1, y + 1, cw - 2, ch - 2);
        if(isHov){
          ctx.strokeStyle = '#FF5FA2'; ctx.lineWidth = 2;
          ctx.strokeRect(x + 1, y + 1, cw - 2, ch - 2);
        }
        ctx.fillStyle = rel === 2 ? '#FF2222' : (rel === 0.5 ? '#4488FF' : (dk ? '#888' : '#999'));
        ctx.font = '700 13px sans-serif';
        ctx.textAlign = 'center';
        var label = rel === 2 ? '⬆x2' : (rel === 0.5 ? '⬇x½' : '―');
        ctx.fillText(label, x + cw/2, y + ch/2 + 5);
      }
    }

    ctx.fillStyle = dk ? '#aaa' : '#666';
    ctx.font = '600 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillRect(ox, oy + 8 * ch + 16, 14, 14);
    ctx.fillStyle = dk ? 'rgba(255,68,68,.35)' : 'rgba(255,68,68,.25)';
    ctx.fillRect(ox, oy + 8 * ch + 16, 14, 14);
    ctx.fillStyle = dk ? '#ccc' : '#555';
    ctx.fillText('⬆x2 효과적', ox + 20, oy + 8 * ch + 27);
    ctx.fillStyle = dk ? 'rgba(68,136,255,.35)' : 'rgba(68,136,255,.2)';
    ctx.fillRect(ox + 140, oy + 8 * ch + 16, 14, 14);
    ctx.fillStyle = dk ? '#ccc' : '#555';
    ctx.fillText('⬇x½ 비효과', ox + 160, oy + 8 * ch + 27);
    ctx.fillStyle = dk ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.03)';
    ctx.fillRect(ox + 280, oy + 8 * ch + 16, 14, 14);
    ctx.fillStyle = dk ? '#ccc' : '#555';
    ctx.fillText('― 보통', ox + 300, oy + 8 * ch + 27);
  }

  function drawRadar(){
    var dk = isDarkV26();
    ctx.fillStyle = dk ? '#1a0a2e' : '#FAFAFE';
    ctx.fillRect(0,0,620,400);
    var cx = 310, cy = 200, maxR = 140;
    for(var ring = 5; ring >= 1; ring--){
      var rr = maxR * ring / 5;
      ctx.beginPath();
      for(var a = 0; a < 8; a++){
        var ang = (a / 8) * Math.PI * 2 - Math.PI/2;
        var px = cx + Math.cos(ang) * rr, py = cy + Math.sin(ang) * rr;
        a === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.strokeStyle = dk ? 'rgba(255,255,255,.1)' : 'rgba(0,0,0,.08)';
      ctx.stroke();
    }
    for(var i = 0; i < 8; i++){
      var ang2 = (i / 8) * Math.PI * 2 - Math.PI/2;
      ctx.beginPath(); ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(ang2) * maxR, cy + Math.sin(ang2) * maxR);
      ctx.strokeStyle = dk ? 'rgba(255,255,255,.1)' : 'rgba(0,0,0,.06)';
      ctx.stroke();
      var lx = cx + Math.cos(ang2) * (maxR + 22), ly = cy + Math.sin(ang2) * (maxR + 22);
      ctx.fillStyle = ELEMENTS[i].color;
      ctx.font = '700 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(ELEMENTS[i].emoji + ELEMENTS[i].name, lx, ly + 5);
    }
    var strengths = ELEMENTS.map(function(el){
      var s = 0;
      ELEMENTS.forEach(function(def){ s += (el.strong.indexOf(def.name) >= 0 ? 2 : (el.weak.indexOf(def.name) >= 0 ? 0.5 : 1)); });
      return s / 8;
    });
    ctx.beginPath();
    strengths.forEach(function(v, idx){
      var ang3 = (idx / 8) * Math.PI * 2 - Math.PI/2;
      var r = maxR * Math.min(v / 1.5, 1);
      var px = cx + Math.cos(ang3) * r, py = cy + Math.sin(ang3) * r;
      idx === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    });
    ctx.closePath();
    ctx.fillStyle = 'rgba(255,95,162,.2)';
    ctx.fill();
    ctx.strokeStyle = '#FF5FA2';
    ctx.lineWidth = 2;
    ctx.stroke();
    strengths.forEach(function(v, idx){
      var ang4 = (idx / 8) * Math.PI * 2 - Math.PI/2;
      var r2 = maxR * Math.min(v / 1.5, 1);
      var px2 = cx + Math.cos(ang4) * r2, py2 = cy + Math.sin(ang4) * r2;
      ctx.beginPath(); ctx.arc(px2, py2, 4, 0, Math.PI*2);
      ctx.fillStyle = ELEMENTS[idx].color; ctx.fill();
    });
    ctx.fillStyle = dk ? '#aaa' : '#666';
    ctx.font = '600 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('속성별 총합 공격력 레이더', cx, 385);
  }

  function draw(){
    if(saved.mode === 'matrix') drawMatrix(); else drawRadar();
  }
  draw();

  canvas.addEventListener('click', function(e){
    var rect = canvas.getBoundingClientRect();
    var sx = 620 / rect.width;
    var mx = (e.clientX - rect.left) * sx;
    var my = (e.clientY - rect.top) * sx;
    if(saved.mode === 'matrix'){
      var ox = 90, oy = 60, cw = 62, ch = 38;
      var col = Math.floor((mx - ox) / cw);
      var row = Math.floor((my - oy) / ch);
      if(col >= 0 && col < 8 && row >= 0 && row < 8){
        sfxV26('elem_scan');
        if(saved.scanned.indexOf(col) < 0){ saved.scanned.push(col); }
        if(saved.scanned.indexOf(row) < 0){ saved.scanned.push(row); }
        v26Save('v26_elem', saved);
        var rel = getRelation(col, row);
        var msg = ELEMENTS[col].emoji + ELEMENTS[col].name + ' → ' + ELEMENTS[row].emoji + ELEMENTS[row].name + ': ';
        msg += rel === 2 ? '⬆ 2배 효과! (강함)' : (rel === 0.5 ? '⬇ 0.5배 (약함)' : '― 보통 데미지');
        if(rel === 2) sfxV26('elem_strong');
        showToastV26(msg);
      }
    }
  });

  canvas.addEventListener('mousemove', function(e){
    var rect = canvas.getBoundingClientRect();
    var sx = 620 / rect.width;
    var mx = (e.clientX - rect.left) * sx, my = (e.clientY - rect.top) * sx;
    if(saved.mode === 'matrix'){
      var ox = 90, oy = 60, cw = 62, ch = 38;
      hovered.c = Math.floor((mx - ox) / cw);
      hovered.r = Math.floor((my - oy) / ch);
      if(hovered.c < 0 || hovered.c >= 8) hovered.c = -1;
      if(hovered.r < 0 || hovered.r >= 8) hovered.r = -1;
      draw();
    }
  });

  m.querySelector('#v26ElemMode').addEventListener('click', function(){
    saved.mode = saved.mode === 'matrix' ? 'radar' : 'matrix';
    v26Save('v26_elem', saved);
    this.textContent = saved.mode === 'matrix' ? '🔄 레이더 보기' : '🔄 매트릭스 보기';
    draw();
    sfxV26('elem_scan');
  });
}


// ============================================================
// 2. BATTLE COMBO CHAIN BUILDER (Canvas 620x380)
// 10 combo chains with damage multiplier visualization
// ============================================================
var COMBO_CHAINS = [
  {name:'스파크 러시',skills:['번개','번개','불꽃'],mult:2.5,type:'공격'},
  {name:'프로즌 스톰',skills:['얼음','바람','얼음'],mult:2.8,type:'공격'},
  {name:'대지의 방벽',skills:['대지','대지','빛'],mult:2.2,type:'방어'},
  {name:'그림자 연쇄',skills:['어둠','어둠','번개'],mult:3.0,type:'공격'},
  {name:'불꽃 폭풍',skills:['불꽃','바람','불꽃'],mult:3.2,type:'공격'},
  {name:'치유의 빛',skills:['빛','물','빛'],mult:2.0,type:'회복'},
  {name:'타이달 웨이브',skills:['물','물','대지'],mult:2.6,type:'공격'},
  {name:'어둠 포옹',skills:['어둠','빛','어둠'],mult:3.5,type:'특수'},
  {name:'자연 순환',skills:['바람','대지','물'],mult:2.4,type:'회복'},
  {name:'절대영도',skills:['얼음','물','번개'],mult:3.3,type:'공격'}
];

function renderComboChainBuilder(){
  var saved = v26Load('v26_combo', {discovered:[], execCount:0});
  var html = '<canvas id="v26ComboCanvas" width="620" height="380" style="width:100%;max-width:620px;border-radius:12px;cursor:pointer"></canvas>';
  html += '<p style="font-size:11px;color:#999;margin-top:6px;text-align:center">콤보 클릭: 연쇄 발동 시뮬 | 발견: ' + saved.discovered.length + '/' + COMBO_CHAINS.length + '</p>';

  var m = createV26Modal('⛓️ 전투 콤보 연쇄기', html);
  var canvas = m.querySelector('#v26ComboCanvas');
  var ctx = canvas.getContext('2d');
  var hovIdx = -1;

  function draw(){
    var dk = isDarkV26();
    ctx.fillStyle = dk ? '#1a0a2e' : '#FAFAFE';
    ctx.fillRect(0,0,620,380);
    ctx.fillStyle = dk ? '#ccc' : '#444';
    ctx.font = '700 14px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('⛓️ 콤보 연쇄 목록 (클릭하여 발동)', 20, 28);

    var barW = 260, barH = 24;
    COMBO_CHAINS.forEach(function(combo, idx){
      var row = idx % 5, col = Math.floor(idx / 5);
      var x = 20 + col * 310, y = 48 + row * 62;
      var isHov = hovIdx === idx;
      var disc = saved.discovered.indexOf(idx) >= 0;

      ctx.fillStyle = isHov ? (dk ? 'rgba(255,95,162,.15)' : 'rgba(255,95,162,.1)') : (dk ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.02)');
      ctx.beginPath(); ctx.roundRect(x, y, 290, 56, 10); ctx.fill();
      if(isHov){ ctx.strokeStyle = '#FF5FA2'; ctx.lineWidth = 2; ctx.stroke(); }

      ctx.fillStyle = dk ? '#eee' : '#333';
      ctx.font = '700 12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText((disc ? combo.name : '??? 미발견'), x + 10, y + 16);

      var typeColors = {공격:'#FF4444',방어:'#4488FF',회복:'#44CC88',특수:'#AA44FF'};
      ctx.fillStyle = typeColors[combo.type] || '#999';
      ctx.font = '600 10px sans-serif';
      ctx.fillText('[' + combo.type + ']', x + 200, y + 16);

      combo.skills.forEach(function(sk, si){
        var el = ELEMENTS.find(function(e){ return e.name === sk; });
        if(el){
          ctx.fillStyle = el.color;
          ctx.beginPath(); ctx.arc(x + 16 + si * 30, y + 36, 10, 0, Math.PI*2); ctx.fill();
          ctx.fillStyle = '#fff';
          ctx.font = '12px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(el.emoji, x + 16 + si * 30, y + 40);
          if(si < combo.skills.length - 1){
            ctx.strokeStyle = dk ? '#666' : '#ccc';
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(x + 26 + si * 30, y + 36); ctx.lineTo(x + 6 + (si+1) * 30, y + 36); ctx.stroke();
          }
        }
      });

      var multPct = combo.mult / 4;
      ctx.fillStyle = dk ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.06)';
      ctx.fillRect(x + 110, y + 30, barW - 120, 12);
      var multColor = combo.mult >= 3.0 ? '#FF4444' : (combo.mult >= 2.5 ? '#FF8800' : '#44CC88');
      ctx.fillStyle = multColor;
      ctx.fillRect(x + 110, y + 30, (barW - 120) * Math.min(multPct, 1), 12);

      ctx.fillStyle = dk ? '#ddd' : '#444';
      ctx.font = '700 10px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('x' + combo.mult.toFixed(1), x + 280, y + 40);
    });

    ctx.fillStyle = dk ? '#aaa' : '#777';
    ctx.font = '600 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('실행 횟수: ' + saved.execCount + ' | 발견: ' + saved.discovered.length + '/' + COMBO_CHAINS.length, 310, 372);
  }
  draw();

  canvas.addEventListener('mousemove', function(e){
    var rect = canvas.getBoundingClientRect();
    var sx = 620 / rect.width;
    var mx = (e.clientX - rect.left) * sx, my = (e.clientY - rect.top) * sx;
    hovIdx = -1;
    COMBO_CHAINS.forEach(function(_, idx){
      var row = idx % 5, col = Math.floor(idx / 5);
      var x = 20 + col * 310, y = 48 + row * 62;
      if(mx >= x && mx <= x + 290 && my >= y && my <= y + 56) hovIdx = idx;
    });
    draw();
  });

  canvas.addEventListener('click', function(e){
    if(hovIdx >= 0){
      sfxV26('combo_chain');
      saved.execCount++;
      if(saved.discovered.indexOf(hovIdx) < 0){
        saved.discovered.push(hovIdx);
        sfxV26('combo_max');
        showToastV26('⛓️ 콤보 발견: ' + COMBO_CHAINS[hovIdx].name + ' (x' + COMBO_CHAINS[hovIdx].mult + ')');
      }
      v26Save('v26_combo', saved);
      draw();
    }
  });
}


// ============================================================
// 3. CHARACTER POTENTIAL AWAKENING MATRIX (Canvas 620x400)
// 8 characters with 6 potential stats, awakening paths
// ============================================================
var AWAKEN_CHARS = [
  {name:'로미',emoji:'👧',stats:[85,70,60,90,75,80],color:'#FF5FA2'},
  {name:'하츄핑',emoji:'💖',stats:[70,85,75,80,90,85],color:'#FF88CC'},
  {name:'바로핑',emoji:'⚡',stats:[90,60,80,65,70,75],color:'#FFD700'},
  {name:'차차핑',emoji:'🌸',stats:[65,90,70,85,80,60],color:'#FF9ED8'},
  {name:'아자핑',emoji:'🔥',stats:[95,55,90,50,65,70],color:'#FF4444'},
  {name:'라라핑',emoji:'🎵',stats:[60,80,55,95,85,90],color:'#8866FF'},
  {name:'해핑',emoji:'☀️',stats:[75,75,65,80,95,80],color:'#FFAA00'},
  {name:'무럭핑',emoji:'🌿',stats:[70,95,60,70,80,85],color:'#44BB66'}
];
var AWAKEN_AXES = ['공격력','방어력','체력','마력','속도','운'];

function renderAwakenMatrix(){
  var saved = v26Load('v26_awaken', {selected:0, awakened:[]});
  var html = '<canvas id="v26AwakenCanvas" width="620" height="400" style="width:100%;max-width:620px;border-radius:12px;cursor:pointer"></canvas>';
  html += '<div style="display:flex;gap:4px;margin-top:8px;flex-wrap:wrap;justify-content:center">';
  AWAKEN_CHARS.forEach(function(ch, i){
    html += '<button class="v26AwakenBtn" data-idx="' + i + '" style="padding:5px 10px;background:' + (i === saved.selected ? ch.color : (isDarkV26()?'rgba(255,255,255,.08)':'rgba(0,0,0,.04)')) + ';color:' + (i === saved.selected ? '#fff' : (isDarkV26()?'#ccc':'#666')) + ';border:none;border-radius:8px;font-size:11px;font-weight:700;cursor:pointer">' + ch.emoji + ch.name + '</button>';
  });
  html += '</div>';
  html += '<p style="font-size:11px;color:#999;margin-top:6px;text-align:center">캐릭터 선택 후 레이더 분석 | 각성: ' + saved.awakened.length + '/' + AWAKEN_CHARS.length + '</p>';

  var m = createV26Modal('🌟 캐릭터 잠재력 각성', html);
  var canvas = m.querySelector('#v26AwakenCanvas');
  var ctx = canvas.getContext('2d');

  function draw(){
    var dk = isDarkV26();
    var ch = AWAKEN_CHARS[saved.selected];
    ctx.fillStyle = dk ? '#1a0a2e' : '#FAFAFE';
    ctx.fillRect(0,0,620,400);

    var cx = 200, cy = 210, maxR = 130;
    for(var ring = 5; ring >= 1; ring--){
      var rr = maxR * ring / 5;
      ctx.beginPath();
      for(var a = 0; a < 6; a++){
        var ang = (a / 6) * Math.PI * 2 - Math.PI/2;
        var px = cx + Math.cos(ang) * rr, py = cy + Math.sin(ang) * rr;
        a === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.strokeStyle = dk ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.06)';
      ctx.stroke();
    }
    for(var i = 0; i < 6; i++){
      var ang2 = (i / 6) * Math.PI * 2 - Math.PI/2;
      ctx.beginPath(); ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(ang2) * maxR, cy + Math.sin(ang2) * maxR);
      ctx.stroke();
      var lx = cx + Math.cos(ang2) * (maxR + 20), ly = cy + Math.sin(ang2) * (maxR + 20);
      ctx.fillStyle = dk ? '#bbb' : '#666';
      ctx.font = '600 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(AWAKEN_AXES[i], lx, ly + 4);
    }
    ctx.beginPath();
    ch.stats.forEach(function(v, idx){
      var ang3 = (idx / 6) * Math.PI * 2 - Math.PI/2;
      var r = maxR * v / 100;
      var px = cx + Math.cos(ang3) * r, py = cy + Math.sin(ang3) * r;
      idx === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    });
    ctx.closePath();
    ctx.fillStyle = ch.color + '33';
    ctx.fill();
    ctx.strokeStyle = ch.color;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ch.stats.forEach(function(v, idx){
      var ang4 = (idx / 6) * Math.PI * 2 - Math.PI/2;
      var r2 = maxR * v / 100;
      ctx.beginPath(); ctx.arc(cx + Math.cos(ang4) * r2, cy + Math.sin(ang4) * r2, 4, 0, Math.PI*2);
      ctx.fillStyle = ch.color; ctx.fill();
    });
    ctx.fillStyle = ch.color;
    ctx.font = '800 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(ch.emoji + ' ' + ch.name, cx, 30);

    var totalStat = ch.stats.reduce(function(a,b){return a+b;},0);
    var grade = totalStat >= 500 ? 'S' : (totalStat >= 450 ? 'A' : (totalStat >= 400 ? 'B' : (totalStat >= 350 ? 'C' : 'D')));
    var gradeColors = {S:'#FF4444',A:'#FF8800',B:'#44BB66',C:'#4488FF',D:'#888'};

    var sx = 430;
    ctx.fillStyle = dk ? '#ccc' : '#444';
    ctx.font = '700 13px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('스탯 상세', sx, 60);

    AWAKEN_AXES.forEach(function(axis, ai){
      var y = 80 + ai * 42;
      ctx.fillStyle = dk ? '#aaa' : '#777';
      ctx.font = '600 11px sans-serif';
      ctx.fillText(axis, sx, y);
      ctx.fillStyle = dk ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.06)';
      ctx.fillRect(sx, y + 6, 150, 14);
      ctx.fillStyle = ch.color;
      ctx.fillRect(sx, y + 6, 150 * ch.stats[ai] / 100, 14);
      ctx.fillStyle = dk ? '#eee' : '#333';
      ctx.font = '700 10px sans-serif';
      ctx.fillText(ch.stats[ai], sx + 155, y + 17);
    });

    ctx.fillStyle = gradeColors[grade];
    ctx.font = '800 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(grade, sx + 75, 360);
    ctx.fillStyle = dk ? '#aaa' : '#777';
    ctx.font = '600 11px sans-serif';
    ctx.fillText('종합: ' + totalStat + '/600', sx + 75, 380);
  }
  draw();

  m.querySelectorAll('.v26AwakenBtn').forEach(function(btn){
    btn.addEventListener('click', function(){
      var idx = parseInt(btn.dataset.idx);
      saved.selected = idx;
      if(saved.awakened.indexOf(idx) < 0){ saved.awakened.push(idx); }
      v26Save('v26_awaken', saved);
      sfxV26('awaken_select');
      m.querySelectorAll('.v26AwakenBtn').forEach(function(b, bi){
        var ch2 = AWAKEN_CHARS[bi];
        b.style.background = bi === idx ? ch2.color : (isDarkV26()?'rgba(255,255,255,.08)':'rgba(0,0,0,.04)');
        b.style.color = bi === idx ? '#fff' : (isDarkV26()?'#ccc':'#666');
      });
      draw();
    });
  });
}


// ============================================================
// 4. WORLD EXPLORATION TRACKER (Canvas 640x400)
// 8 regions with exploration %, collectibles, secrets
// ============================================================
var WORLD_REGIONS = [
  {name:'이모션 왕국',emoji:'🏰',areas:12,color:'#FF5FA2'},
  {name:'하늘정원',emoji:'🌸',areas:8,color:'#FF88CC'},
  {name:'크리스탈 동굴',emoji:'💎',areas:10,color:'#44AAFF'},
  {name:'불꽃의 대지',emoji:'🌋',areas:9,color:'#FF4444'},
  {name:'바다의 신전',emoji:'🌊',areas:11,color:'#4488FF'},
  {name:'얼음 봉우리',emoji:'❄️',areas:7,color:'#88DDFF'},
  {name:'어둠의 숲',emoji:'🌑',areas:10,color:'#8844AA'},
  {name:'별빛 탑',emoji:'⭐',areas:6,color:'#FFD700'}
];

function renderExplorationTracker(){
  var saved = v26Load('v26_explore', {regions:WORLD_REGIONS.map(function(r){ return {explored:Math.floor(Math.random()*r.areas), collectibles:Math.floor(Math.random()*8), secrets:Math.floor(Math.random()*3)}; })});
  var html = '<canvas id="v26ExploreCanvas" width="640" height="400" style="width:100%;max-width:640px;border-radius:12px;cursor:pointer"></canvas>';
  html += '<p style="font-size:11px;color:#999;margin-top:6px;text-align:center">지역 클릭: 탐사 기록 | 전체 탐사율 확인</p>';

  var m = createV26Modal('🗺️ 월드 탐사율 트래커', html);
  var canvas = m.querySelector('#v26ExploreCanvas');
  var ctx = canvas.getContext('2d');
  var hovIdx = -1;

  function draw(){
    var dk = isDarkV26();
    ctx.fillStyle = dk ? '#1a0a2e' : '#FAFAFE';
    ctx.fillRect(0,0,640,400);

    var totalExplored = 0, totalAreas = 0;
    saved.regions.forEach(function(r, i){ totalExplored += r.explored; totalAreas += WORLD_REGIONS[i].areas; });
    var totalPct = Math.round(totalExplored / totalAreas * 100);

    ctx.fillStyle = dk ? '#ccc' : '#444';
    ctx.font = '700 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🗺️ 월드 탐사 현황 — 전체 ' + totalPct + '%', 320, 28);

    WORLD_REGIONS.forEach(function(region, idx){
      var row = idx % 4, col = Math.floor(idx / 4);
      var x = 20 + col * 310, y = 46 + row * 84;
      var rd = saved.regions[idx];
      var pct = Math.round(rd.explored / region.areas * 100);
      var isHov = hovIdx === idx;

      ctx.fillStyle = isHov ? (dk ? 'rgba(255,95,162,.12)' : 'rgba(255,95,162,.08)') : (dk ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.02)');
      ctx.beginPath(); ctx.roundRect(x, y, 295, 76, 12); ctx.fill();
      if(isHov){ ctx.strokeStyle = '#FF5FA2'; ctx.lineWidth = 2; ctx.stroke(); }

      ctx.fillStyle = region.color;
      ctx.font = '18px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(region.emoji, x + 12, y + 28);
      ctx.fillStyle = dk ? '#eee' : '#333';
      ctx.font = '700 13px sans-serif';
      ctx.fillText(region.name, x + 38, y + 26);

      ctx.fillStyle = dk ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.06)';
      ctx.fillRect(x + 38, y + 34, 200, 12);
      ctx.fillStyle = region.color;
      ctx.fillRect(x + 38, y + 34, 200 * pct / 100, 12);

      ctx.fillStyle = dk ? '#ddd' : '#444';
      ctx.font = '700 11px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(pct + '%', x + 280, y + 44);

      ctx.fillStyle = dk ? '#aaa' : '#888';
      ctx.font = '600 10px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('구역 ' + rd.explored + '/' + region.areas + '  💎' + rd.collectibles + '  🔑' + rd.secrets, x + 38, y + 64);
    });

    // total progress arc
    ctx.beginPath();
    ctx.arc(320, 380, 10, 0, Math.PI * 2);
    ctx.strokeStyle = dk ? 'rgba(255,255,255,.1)' : 'rgba(0,0,0,.08)';
    ctx.lineWidth = 3; ctx.stroke();
    ctx.beginPath();
    ctx.arc(320, 380, 10, -Math.PI/2, -Math.PI/2 + Math.PI * 2 * totalPct / 100);
    ctx.strokeStyle = '#FF5FA2';
    ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = dk ? '#aaa' : '#777';
    ctx.font = '600 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('총 탐사 ' + totalPct + '%', 320, 398);
  }
  draw();

  canvas.addEventListener('mousemove', function(e){
    var rect = canvas.getBoundingClientRect();
    var sx = 640 / rect.width;
    var mx = (e.clientX - rect.left) * sx, my = (e.clientY - rect.top) * sx;
    hovIdx = -1;
    WORLD_REGIONS.forEach(function(_, idx){
      var row = idx % 4, col = Math.floor(idx / 4);
      var x = 20 + col * 310, y = 46 + row * 84;
      if(mx >= x && mx <= x + 295 && my >= y && my <= y + 76) hovIdx = idx;
    });
    draw();
  });

  canvas.addEventListener('click', function(){
    if(hovIdx >= 0){
      sfxV26('explore_click');
      var rd = saved.regions[hovIdx];
      var region = WORLD_REGIONS[hovIdx];
      if(rd.explored < region.areas){
        rd.explored++;
        if(Math.random() > 0.6) rd.collectibles++;
        if(Math.random() > 0.85) rd.secrets++;
        sfxV26('explore_complete');
        showToastV26(region.emoji + ' ' + region.name + ' 탐사 진행! (' + rd.explored + '/' + region.areas + ')');
      } else {
        showToastV26(region.emoji + ' ' + region.name + ' 완전 탐사 완료!');
      }
      v26Save('v26_explore', saved);
      draw();
    }
  });
}


// ============================================================
// 5. BOSS WEAKNESS ANALYSIS CHART (Canvas 620x400)
// 8 bosses with weakness patterns, strategy recs
// ============================================================
var BOSS_DATA = [
  {name:'트러핑 킹',emoji:'👑',hp:5000,weakness:['빛','바람'],resist:['어둠'],pattern:'3턴마다 어둠 폭풍',strategy:'빛 스킬로 약점 공략',color:'#8844AA'},
  {name:'프로즌 드래곤',emoji:'🐉',hp:6500,weakness:['불꽃','번개'],resist:['얼음','물'],pattern:'2턴마다 빙결 브레스',strategy:'불꽃 연쇄로 속공',color:'#88DDFF'},
  {name:'화염 마왕',emoji:'😈',hp:7000,weakness:['물','얼음'],resist:['불꽃'],pattern:'4턴마다 전체 화염',strategy:'물 방벽 후 반격',color:'#FF4444'},
  {name:'번개 거인',emoji:'⚡',hp:5500,weakness:['대지'],resist:['번개','바람'],pattern:'매턴 감전 부여',strategy:'대지 스킬 집중',color:'#FFD700'},
  {name:'숲의 수호자',emoji:'🌿',hp:4500,weakness:['불꽃','얼음'],resist:['대지','물'],pattern:'5턴마다 회복',strategy:'불꽃으로 회복 차단',color:'#44BB66'},
  {name:'심해 크라켄',emoji:'🦑',hp:8000,weakness:['번개','빛'],resist:['물','어둠'],pattern:'3턴마다 잉크 공격',strategy:'번개 연쇄 속공',color:'#2244AA'},
  {name:'그림자 기사',emoji:'🗡️',hp:6000,weakness:['빛','불꽃'],resist:['어둠','얼음'],pattern:'2턴마다 분신 소환',strategy:'빛으로 본체 식별',color:'#442266'},
  {name:'폭풍 피닉스',emoji:'🔥',hp:9000,weakness:['얼음','대지'],resist:['불꽃','바람'],pattern:'HP 50%에서 부활',strategy:'얼음 연쇄 후 처치',color:'#FF6600'}
];

function renderBossWeakness(){
  var saved = v26Load('v26_weakness', {analyzed:[], selected:0});
  var html = '<canvas id="v26BossCanvas" width="620" height="400" style="width:100%;max-width:620px;border-radius:12px;cursor:pointer"></canvas>';
  html += '<div style="display:flex;gap:4px;margin-top:8px;flex-wrap:wrap;justify-content:center">';
  BOSS_DATA.forEach(function(b, i){
    html += '<button class="v26BossBtn" data-idx="' + i + '" style="padding:5px 10px;background:' + (i === saved.selected ? b.color : (isDarkV26()?'rgba(255,255,255,.06)':'rgba(0,0,0,.03)')) + ';color:' + (i === saved.selected ? '#fff' : (isDarkV26()?'#ccc':'#666')) + ';border:none;border-radius:8px;font-size:11px;font-weight:700;cursor:pointer">' + b.emoji + b.name + '</button>';
  });
  html += '</div>';

  var m = createV26Modal('🗡️ 보스 약점 분석도', html);
  var canvas = m.querySelector('#v26BossCanvas');
  var ctx = canvas.getContext('2d');

  function draw(){
    var dk = isDarkV26();
    var boss = BOSS_DATA[saved.selected];
    ctx.fillStyle = dk ? '#1a0a2e' : '#FAFAFE';
    ctx.fillRect(0,0,620,400);

    ctx.fillStyle = boss.color;
    ctx.font = '700 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(boss.emoji + ' ' + boss.name, 310, 30);

    // HP bar
    ctx.fillStyle = dk ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.06)';
    ctx.fillRect(160, 44, 300, 16);
    ctx.fillStyle = '#FF4444';
    ctx.fillRect(160, 44, 300, 16);
    ctx.fillStyle = '#fff';
    ctx.font = '700 10px sans-serif';
    ctx.fillText('HP: ' + boss.hp.toLocaleString(), 310, 55);

    // Weakness/Resist section
    ctx.fillStyle = dk ? '#ccc' : '#444';
    ctx.font = '700 13px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('약점 속성', 30, 90);
    boss.weakness.forEach(function(w, wi){
      var el = ELEMENTS.find(function(e){ return e.name === w; });
      if(el){
        ctx.fillStyle = el.color;
        ctx.beginPath(); ctx.arc(50 + wi * 80, 115, 16, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(el.emoji, 50 + wi * 80, 120);
        ctx.fillStyle = dk ? '#ccc' : '#555';
        ctx.font = '600 10px sans-serif';
        ctx.fillText(el.name, 50 + wi * 80, 138);
      }
    });

    ctx.textAlign = 'left';
    ctx.fillStyle = dk ? '#ccc' : '#444';
    ctx.font = '700 13px sans-serif';
    ctx.fillText('내성 속성', 250, 90);
    boss.resist.forEach(function(r, ri){
      var el = ELEMENTS.find(function(e){ return e.name === r; });
      if(el){
        ctx.fillStyle = el.color + '88';
        ctx.beginPath(); ctx.arc(270 + ri * 80, 115, 16, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(el.emoji, 270 + ri * 80, 120);
        ctx.fillStyle = dk ? '#999' : '#888';
        ctx.font = '600 10px sans-serif';
        ctx.fillText(el.name, 270 + ri * 80, 138);
      }
    });

    // Pattern section
    ctx.fillStyle = dk ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.02)';
    ctx.beginPath(); ctx.roundRect(30, 155, 560, 70, 12); ctx.fill();
    ctx.fillStyle = dk ? '#ccc' : '#444';
    ctx.font = '700 12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('📋 공격 패턴', 50, 178);
    ctx.fillStyle = dk ? '#aaa' : '#666';
    ctx.font = '600 12px sans-serif';
    ctx.fillText(boss.pattern, 50, 200);

    ctx.fillStyle = dk ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.02)';
    ctx.beginPath(); ctx.roundRect(30, 235, 560, 70, 12); ctx.fill();
    ctx.fillStyle = dk ? '#ccc' : '#444';
    ctx.font = '700 12px sans-serif';
    ctx.fillText('🎯 공략 전략', 50, 258);
    ctx.fillStyle = '#FF5FA2';
    ctx.font = '600 12px sans-serif';
    ctx.fillText(boss.strategy, 50, 280);

    // Element effectiveness bar
    ctx.fillStyle = dk ? '#ccc' : '#444';
    ctx.font = '700 12px sans-serif';
    ctx.fillText('속성별 효과', 30, 330);
    ELEMENTS.forEach(function(el, ei){
      var x = 30 + ei * 70, y = 340;
      var eff = boss.weakness.indexOf(el.name) >= 0 ? 2 : (boss.resist.indexOf(el.name) >= 0 ? 0.5 : 1);
      var h = eff * 20;
      ctx.fillStyle = dk ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.04)';
      ctx.fillRect(x, y + 40 - 40, 50, 40);
      ctx.fillStyle = eff === 2 ? '#FF4444' : (eff === 0.5 ? '#4488FF' : (dk ? '#555' : '#ccc'));
      ctx.fillRect(x, y + 40 - h, 50, h);
      ctx.fillStyle = el.color;
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(el.emoji, x + 25, y + 52);
      ctx.fillStyle = dk ? '#aaa' : '#777';
      ctx.font = '700 9px sans-serif';
      ctx.fillText('x' + eff, x + 25, y - h + 50);
    });
  }
  draw();

  m.querySelectorAll('.v26BossBtn').forEach(function(btn){
    btn.addEventListener('click', function(){
      var idx = parseInt(btn.dataset.idx);
      saved.selected = idx;
      if(saved.analyzed.indexOf(idx) < 0){
        saved.analyzed.push(idx);
        sfxV26('weakness_found');
        showToastV26('🗡️ ' + BOSS_DATA[idx].name + ' 약점 분석 완료!');
      } else {
        sfxV26('weakness_scan');
      }
      v26Save('v26_weakness', saved);
      m.querySelectorAll('.v26BossBtn').forEach(function(b, bi){
        b.style.background = bi === idx ? BOSS_DATA[bi].color : (isDarkV26()?'rgba(255,255,255,.06)':'rgba(0,0,0,.03)');
        b.style.color = bi === idx ? '#fff' : (isDarkV26()?'#ccc':'#666');
      });
      draw();
    });
  });
}


// ============================================================
// 6. EQUIPMENT SET EFFECT CALCULATOR (Canvas 620x380)
// 10 equipment sets with set bonus stacking visualization
// ============================================================
var EQUIP_SETS = [
  {name:'용사의 갑옷',pieces:4,bonus:['+10% 공격','+20% 방어','+15% HP','+30% 모든 스탯'],color:'#FF4444',icon:'🛡️'},
  {name:'마법사의 로브',pieces:4,bonus:['+15% 마력','+10% 속도','+20% MP','+25% 주문 위력'],color:'#8844FF',icon:'🧙'},
  {name:'그림자 망토',pieces:3,bonus:['+20% 회피','+15% 치명타','+35% 암흑 데미지'],color:'#442266',icon:'🌑'},
  {name:'빛의 성의',pieces:3,bonus:['+15% 회복력','+20% 빛 데미지','+25% 부활 확률'],color:'#FFD700',icon:'✨'},
  {name:'얼음 왕관',pieces:4,bonus:['+10% 방어','+15% 빙결 확률','+20% 얼음 데미지','+30% 빙결 면역'],color:'#88DDFF',icon:'👑'},
  {name:'바람의 부츠',pieces:3,bonus:['+25% 속도','+15% 회피','+20% 선제 공격'],color:'#66CC99',icon:'👟'},
  {name:'대지의 방패',pieces:4,bonus:['+20% 방어','+10% HP','+15% 피해 감소','+25% 반사 데미지'],color:'#8B6914',icon:'🪨'},
  {name:'불꽃 장갑',pieces:3,bonus:['+15% 공격','+20% 화염 데미지','+30% 연소 확률'],color:'#FF6600',icon:'🔥'},
  {name:'번개 목걸이',pieces:3,bonus:['+15% 속도','+20% 번개 데미지','+25% 마비 확률'],color:'#FFCC00',icon:'⚡'},
  {name:'하츄핑 세트',pieces:4,bonus:['+10% 모든 스탯','+15% 경험치','+20% 드롭률','+50% 사랑의 힘'],color:'#FF5FA2',icon:'💖'}
];

function renderEquipSetCalc(){
  var saved = v26Load('v26_equip', {owned:{}, selected:0});
  var html = '<canvas id="v26EquipCanvas" width="620" height="380" style="width:100%;max-width:620px;border-radius:12px;cursor:pointer"></canvas>';
  html += '<p style="font-size:11px;color:#999;margin-top:6px;text-align:center">세트 클릭: 보유 토글 | 보너스 확인</p>';

  var m = createV26Modal('🛡️ 장비 세트 효과 계산기', html);
  var canvas = m.querySelector('#v26EquipCanvas');
  var ctx = canvas.getContext('2d');
  var hovIdx = -1;

  function draw(){
    var dk = isDarkV26();
    ctx.fillStyle = dk ? '#1a0a2e' : '#FAFAFE';
    ctx.fillRect(0,0,620,380);

    ctx.fillStyle = dk ? '#ccc' : '#444';
    ctx.font = '700 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🛡️ 장비 세트 효과 — 보유 세트 확인', 310, 24);

    EQUIP_SETS.forEach(function(set, idx){
      var row = idx % 5, col = Math.floor(idx / 5);
      var x = 15 + col * 305, y = 40 + row * 64;
      var isHov = hovIdx === idx;
      var ownCount = saved.owned[idx] || 0;

      ctx.fillStyle = isHov ? (dk ? 'rgba(255,95,162,.12)' : 'rgba(255,95,162,.08)') : (dk ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.02)');
      ctx.beginPath(); ctx.roundRect(x, y, 292, 58, 10); ctx.fill();
      if(isHov){ ctx.strokeStyle = '#FF5FA2'; ctx.lineWidth = 2; ctx.stroke(); }

      ctx.font = '18px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(set.icon, x + 10, y + 24);
      ctx.fillStyle = dk ? '#eee' : '#333';
      ctx.font = '700 12px sans-serif';
      ctx.fillText(set.name, x + 34, y + 20);

      for(var p = 0; p < set.pieces; p++){
        var px = x + 34 + p * 22;
        ctx.fillStyle = p < ownCount ? set.color : (dk ? 'rgba(255,255,255,.1)' : 'rgba(0,0,0,.08)');
        ctx.beginPath(); ctx.arc(px + 8, y + 36, 8, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = '700 8px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(p + 1, px + 8, y + 39);
      }

      if(ownCount > 0 && ownCount <= set.bonus.length){
        ctx.fillStyle = set.color;
        ctx.font = '600 9px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(set.bonus[ownCount - 1], x + 34 + set.pieces * 22 + 10, y + 39);
      }

      ctx.fillStyle = dk ? '#888' : '#aaa';
      ctx.font = '600 10px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(ownCount + '/' + set.pieces, x + 282, y + 52);
    });

    var totalSets = 0;
    Object.values(saved.owned).forEach(function(v){ if(v > 0) totalSets++; });
    ctx.fillStyle = dk ? '#aaa' : '#777';
    ctx.font = '600 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('활성 세트: ' + totalSets + '/' + EQUIP_SETS.length, 310, 372);
  }
  draw();

  canvas.addEventListener('mousemove', function(e){
    var rect = canvas.getBoundingClientRect();
    var sx = 620 / rect.width;
    var mx = (e.clientX - rect.left) * sx, my = (e.clientY - rect.top) * sx;
    hovIdx = -1;
    EQUIP_SETS.forEach(function(_, idx){
      var row = idx % 5, col = Math.floor(idx / 5);
      var x = 15 + col * 305, y = 40 + row * 64;
      if(mx >= x && mx <= x + 292 && my >= y && my <= y + 58) hovIdx = idx;
    });
    draw();
  });

  canvas.addEventListener('click', function(){
    if(hovIdx >= 0){
      var set = EQUIP_SETS[hovIdx];
      var cur = saved.owned[hovIdx] || 0;
      saved.owned[hovIdx] = (cur + 1) % (set.pieces + 1);
      sfxV26(saved.owned[hovIdx] > 0 ? 'equip_slot' : 'equip_set');
      if(saved.owned[hovIdx] === set.pieces){
        sfxV26('equip_set');
        showToastV26(set.icon + ' ' + set.name + ' 풀세트 활성화!');
      }
      v26Save('v26_equip', saved);
      draw();
    }
  });
}


// ============================================================
// 7. SKILL CHAIN NETWORK (Canvas 640x400)
// 12 skills connected in a network graph
// ============================================================
var SKILL_NODES = [
  {name:'파이어볼',type:'공격',cost:3,power:80,color:'#FF4444'},
  {name:'아이스 실드',type:'방어',cost:4,power:60,color:'#88DDFF'},
  {name:'썬더볼트',type:'공격',cost:5,power:100,color:'#FFD700'},
  {name:'힐링 라이트',type:'회복',cost:3,power:70,color:'#44BB66'},
  {name:'다크 슬래시',type:'공격',cost:4,power:90,color:'#8844AA'},
  {name:'윈드 러시',type:'지원',cost:2,power:50,color:'#66CC99'},
  {name:'어스 월',type:'방어',cost:5,power:75,color:'#8B6914'},
  {name:'스타 버스트',type:'특수',cost:6,power:120,color:'#FFAA00'},
  {name:'프로즌 랜스',type:'공격',cost:4,power:85,color:'#4488FF'},
  {name:'플레임 댄스',type:'공격',cost:5,power:95,color:'#FF6600'},
  {name:'하츄핑 빔',type:'특수',cost:7,power:150,color:'#FF5FA2'},
  {name:'리저렉션',type:'회복',cost:8,power:100,color:'#FFD700'}
];
var SKILL_LINKS = [
  [0,9],[0,2],[1,8],[1,6],[2,7],[3,11],[3,5],[4,7],[4,10],[5,6],[7,10],[8,9],[10,11]
];

function renderSkillNetwork(){
  var saved = v26Load('v26_skills', {unlocked:[], selectedNode:-1});
  var html = '<canvas id="v26SkillCanvas" width="640" height="400" style="width:100%;max-width:640px;border-radius:12px;cursor:pointer"></canvas>';
  html += '<p style="font-size:11px;color:#999;margin-top:6px;text-align:center">노드 클릭: 스킬 해금/정보 | 연결선: 연계 가능</p>';

  var m = createV26Modal('🔗 스킬 연계 네트워크', html);
  var canvas = m.querySelector('#v26SkillCanvas');
  var ctx = canvas.getContext('2d');
  var hovNode = -1;

  var nodePos = [
    {x:120,y:80},{x:320,y:60},{x:520,y:80},{x:80,y:200},
    {x:240,y:180},{x:400,y:180},{x:540,y:200},{x:320,y:260},
    {x:160,y:300},{x:480,y:300},{x:320,y:360},{x:100,y:360}
  ];

  function draw(){
    var dk = isDarkV26();
    ctx.fillStyle = dk ? '#1a0a2e' : '#FAFAFE';
    ctx.fillRect(0,0,640,400);

    SKILL_LINKS.forEach(function(link){
      var a = nodePos[link[0]], b = nodePos[link[1]];
      var bothUnlocked = saved.unlocked.indexOf(link[0]) >= 0 && saved.unlocked.indexOf(link[1]) >= 0;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = bothUnlocked ? '#FF5FA2' : (dk ? 'rgba(255,255,255,.1)' : 'rgba(0,0,0,.08)');
      ctx.lineWidth = bothUnlocked ? 2.5 : 1;
      ctx.stroke();
    });

    SKILL_NODES.forEach(function(skill, idx){
      var pos = nodePos[idx];
      var unlocked = saved.unlocked.indexOf(idx) >= 0;
      var isHov = hovNode === idx;
      var radius = isHov ? 24 : 20;

      ctx.beginPath(); ctx.arc(pos.x, pos.y, radius, 0, Math.PI*2);
      if(unlocked){
        ctx.fillStyle = skill.color;
      } else {
        ctx.fillStyle = dk ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.06)';
      }
      ctx.fill();
      if(isHov){
        ctx.strokeStyle = '#FF5FA2';
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      ctx.fillStyle = unlocked ? '#fff' : (dk ? '#666' : '#bbb');
      ctx.font = '700 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(unlocked ? skill.name : '???', pos.x, pos.y + 3);

      if(isHov && unlocked){
        ctx.fillStyle = dk ? 'rgba(0,0,0,.8)' : 'rgba(255,255,255,.95)';
        ctx.beginPath(); ctx.roundRect(pos.x - 60, pos.y - 55, 120, 30, 8); ctx.fill();
        ctx.strokeStyle = skill.color; ctx.lineWidth = 1; ctx.stroke();
        ctx.fillStyle = dk ? '#eee' : '#333';
        ctx.font = '600 10px sans-serif';
        ctx.fillText('[' + skill.type + '] MP:' + skill.cost + ' 위력:' + skill.power, pos.x, pos.y - 36);
      }
    });

    ctx.fillStyle = dk ? '#aaa' : '#777';
    ctx.font = '600 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('해금: ' + saved.unlocked.length + '/' + SKILL_NODES.length + ' | 연계: ' + SKILL_LINKS.length + '개', 320, 16);
  }
  draw();

  canvas.addEventListener('mousemove', function(e){
    var rect = canvas.getBoundingClientRect();
    var sx = 640 / rect.width;
    var mx = (e.clientX - rect.left) * sx, my = (e.clientY - rect.top) * sx;
    hovNode = -1;
    nodePos.forEach(function(pos, idx){
      var dist = Math.sqrt((mx - pos.x)*(mx - pos.x) + (my - pos.y)*(my - pos.y));
      if(dist < 24) hovNode = idx;
    });
    draw();
  });

  canvas.addEventListener('click', function(){
    if(hovNode >= 0){
      if(saved.unlocked.indexOf(hovNode) < 0){
        saved.unlocked.push(hovNode);
        sfxV26('skill_chain');
        showToastV26('🔗 ' + SKILL_NODES[hovNode].name + ' 스킬 해금!');
      } else {
        sfxV26('skill_node');
      }
      v26Save('v26_skills', saved);
      draw();
    }
  });
}


// ============================================================
// 8. COMPREHENSIVE BATTLE POWER RADAR (Canvas 620x400)
// 8-axis radar with tier grading S~D
// ============================================================
var POWER_AXES = ['공격력','방어력','체력','마력','속도','운','기술','의지'];

function renderBattlePowerRadar(){
  var saved = v26Load('v26_power', {
    data: AWAKEN_CHARS.map(function(ch){
      return ch.stats.concat([Math.floor(50 + Math.random()*40), Math.floor(50 + Math.random()*40)]);
    }),
    selected: 0,
    history: []
  });
  var html = '<canvas id="v26PowerCanvas" width="620" height="400" style="width:100%;max-width:620px;border-radius:12px;cursor:pointer"></canvas>';
  html += '<div style="display:flex;gap:4px;margin-top:8px;flex-wrap:wrap;justify-content:center">';
  AWAKEN_CHARS.forEach(function(ch, i){
    html += '<button class="v26PowerBtn" data-idx="' + i + '" style="padding:5px 10px;background:' + (i === saved.selected ? ch.color : (isDarkV26()?'rgba(255,255,255,.06)':'rgba(0,0,0,.03)')) + ';color:' + (i === saved.selected ? '#fff' : (isDarkV26()?'#ccc':'#666')) + ';border:none;border-radius:8px;font-size:11px;font-weight:700;cursor:pointer">' + ch.emoji + ch.name + '</button>';
  });
  html += '</div>';

  var m = createV26Modal('⚔️ 종합 전투력 레이더', html);
  var canvas = m.querySelector('#v26PowerCanvas');
  var ctx = canvas.getContext('2d');

  function draw(){
    var dk = isDarkV26();
    var ch = AWAKEN_CHARS[saved.selected];
    var stats = saved.data[saved.selected];
    ctx.fillStyle = dk ? '#1a0a2e' : '#FAFAFE';
    ctx.fillRect(0,0,620,400);

    var cx = 220, cy = 210, maxR = 140;
    for(var ring = 5; ring >= 1; ring--){
      var rr = maxR * ring / 5;
      ctx.beginPath();
      for(var a = 0; a < 8; a++){
        var ang = (a / 8) * Math.PI * 2 - Math.PI/2;
        var px = cx + Math.cos(ang) * rr, py = cy + Math.sin(ang) * rr;
        a === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.strokeStyle = dk ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.06)';
      ctx.stroke();
    }
    for(var i = 0; i < 8; i++){
      var ang2 = (i / 8) * Math.PI * 2 - Math.PI/2;
      ctx.beginPath(); ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(ang2) * maxR, cy + Math.sin(ang2) * maxR);
      ctx.stroke();
      var lx = cx + Math.cos(ang2) * (maxR + 22), ly = cy + Math.sin(ang2) * (maxR + 22);
      ctx.fillStyle = dk ? '#bbb' : '#666';
      ctx.font = '600 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(POWER_AXES[i], lx, ly + 4);
    }
    ctx.beginPath();
    stats.forEach(function(v, idx){
      var ang3 = (idx / 8) * Math.PI * 2 - Math.PI/2;
      var r = maxR * v / 100;
      var ppx = cx + Math.cos(ang3) * r, ppy = cy + Math.sin(ang3) * r;
      idx === 0 ? ctx.moveTo(ppx, ppy) : ctx.lineTo(ppx, ppy);
    });
    ctx.closePath();
    ctx.fillStyle = ch.color + '33';
    ctx.fill();
    ctx.strokeStyle = ch.color;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    stats.forEach(function(v, idx){
      var ang4 = (idx / 8) * Math.PI * 2 - Math.PI/2;
      var r2 = maxR * v / 100;
      ctx.beginPath(); ctx.arc(cx + Math.cos(ang4) * r2, cy + Math.sin(ang4) * r2, 4, 0, Math.PI*2);
      ctx.fillStyle = ch.color; ctx.fill();
    });

    ctx.fillStyle = ch.color;
    ctx.font = '800 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(ch.emoji + ' ' + ch.name + ' 전투력', cx, 30);

    // Right side stats
    var sx = 430;
    var totalPower = stats.reduce(function(a,b){ return a+b; }, 0);
    var grade = totalPower >= 700 ? 'S' : (totalPower >= 600 ? 'A' : (totalPower >= 500 ? 'B' : (totalPower >= 400 ? 'C' : 'D')));
    var gradeColors = {S:'#FF4444',A:'#FF8800',B:'#44BB66',C:'#4488FF',D:'#888'};

    ctx.fillStyle = gradeColors[grade];
    ctx.font = '800 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(grade, sx + 65, 80);
    ctx.fillStyle = dk ? '#aaa' : '#777';
    ctx.font = '600 12px sans-serif';
    ctx.fillText('종합: ' + totalPower + '/800', sx + 65, 100);

    ctx.font = '700 12px sans-serif';
    ctx.fillStyle = dk ? '#ccc' : '#444';
    ctx.textAlign = 'left';
    ctx.fillText('상세 스탯', sx, 130);

    POWER_AXES.forEach(function(axis, ai){
      var y = 148 + ai * 28;
      ctx.fillStyle = dk ? '#999' : '#888';
      ctx.font = '600 10px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(axis, sx, y);
      ctx.fillStyle = dk ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.06)';
      ctx.fillRect(sx + 40, y - 8, 100, 12);
      ctx.fillStyle = ch.color;
      ctx.fillRect(sx + 40, y - 8, 100 * stats[ai] / 100, 12);
      ctx.fillStyle = dk ? '#eee' : '#333';
      ctx.font = '700 10px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(stats[ai], sx + 155, y);
    });

    // ranking
    var rankings = saved.data.map(function(d, di){
      return {idx:di, total:d.reduce(function(a,b){return a+b;},0)};
    }).sort(function(a,b){return b.total - a.total;});
    var rank = rankings.findIndex(function(r){ return r.idx === saved.selected; }) + 1;
    ctx.fillStyle = dk ? '#aaa' : '#777';
    ctx.font = '600 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('순위: ' + rank + '/' + AWAKEN_CHARS.length + '위', sx + 65, 390);
  }
  draw();

  m.querySelectorAll('.v26PowerBtn').forEach(function(btn){
    btn.addEventListener('click', function(){
      var idx = parseInt(btn.dataset.idx);
      saved.selected = idx;
      v26Save('v26_power', saved);
      sfxV26('power_calc');
      m.querySelectorAll('.v26PowerBtn').forEach(function(b, bi){
        b.style.background = bi === idx ? AWAKEN_CHARS[bi].color : (isDarkV26()?'rgba(255,255,255,.06)':'rgba(0,0,0,.03)');
        b.style.color = bi === idx ? '#fff' : (isDarkV26()?'#ccc':'#666');
      });
      draw();
    });
  });
}


// ============================================================
// QUIZ v26 (+15 questions, 255 -> 270)
// ============================================================
var V26_QUIZ = [
  {q:'속성 상성에서 불꽃이 강한 속성은?', a:['물, 대지','얼음, 바람','번개, 빛','어둠, 바람'], c:1},
  {q:'콤보 연쇄 &quot;어둠 포옹&quot;의 배율은?', a:['x2.5','x3.0','x3.5','x2.8'], c:2},
  {q:'로미의 가장 높은 기본 스탯은?', a:['공격력','방어력','마력','속도'], c:2},
  {q:'월드 &quot;별빛 탑&quot;의 총 구역 수는?', a:['6','8','10','7'], c:0},
  {q:'트러핑 킹의 약점 속성은?', a:['불꽃, 번개','빛, 바람','물, 얼음','대지, 어둠'], c:1},
  {q:'&quot;하츄핑 세트&quot;는 몇 피스 풀세트?', a:['3','4','5','6'], c:1},
  {q:'스킬 &quot;하츄핑 빔&quot;의 MP 코스트는?', a:['5','6','7','8'], c:2},
  {q:'종합 전투력 S등급 기준은?', a:['600 이상','650 이상','700 이상','800 이상'], c:2},
  {q:'프로즌 드래곤이 내성을 가진 속성은?', a:['불꽃','얼음, 물','번개, 빛','대지, 바람'], c:1},
  {q:'콤보 &quot;절대영도&quot;에 사용되는 속성 조합은?', a:['얼음, 물, 번개','얼음, 바람, 물','불꽃, 얼음, 물','번개, 빛, 얼음'], c:0},
  {q:'캐릭터 중 기본 공격력이 가장 높은 것은?', a:['로미','하츄핑','아자핑','바로핑'], c:2},
  {q:'&quot;치유의 빛&quot; 콤보의 타입은?', a:['공격','방어','회복','특수'], c:2},
  {q:'폭풍 피닉스의 HP는?', a:['7000','8000','9000','10000'], c:2},
  {q:'장비 세트 &quot;그림자 망토&quot;는 몇 피스?', a:['3','4','5','2'], c:0},
  {q:'스킬 네트워크의 총 연결 수는?', a:['10','11','12','13'], c:3}
];

function renderV26Quiz(){
  var saved = v26Load('v26_quiz_state', {answered:0, correct:0, idx:0});
  var quiz = V26_QUIZ[saved.idx % V26_QUIZ.length];

  var html = '<div style="text-align:center;margin-bottom:12px">';
  html += '<span style="font-size:12px;color:#FF5FA2;font-weight:700">정답률: ' + (saved.answered > 0 ? Math.round(saved.correct / saved.answered * 100) : 0) + '%</span>';
  html += ' | <span style="font-size:12px;color:#888">' + saved.answered + '문 응시 / ' + saved.correct + '문 정답</span>';
  html += '</div>';

  html += '<div style="font-size:15px;font-weight:700;margin-bottom:16px">' + quiz.q + '</div>';
  quiz.a.forEach(function(ans, i){
    html += '<button class="v26QuizBtn" data-idx="' + i + '" style="display:block;width:100%;padding:10px;margin-bottom:8px;background:' + (isDarkV26()?'rgba(255,255,255,.06)':'rgba(0,0,0,.03)') + ';border:2px solid transparent;border-radius:14px;color:' + (isDarkV26()?'#eee':'#333') + ';font-size:13px;font-weight:600;cursor:pointer;text-align:left;transition:all .2s">' + String.fromCharCode(9312 + i) + ' ' + ans + '</button>';
  });

  var m2 = createV26Modal('❓ 퀴즈 v26 (15문)', html);

  setTimeout(function(){
    var btns = m2.querySelectorAll('.v26QuizBtn');
    btns.forEach(function(btn){
      btn.addEventListener('click', function(){
        var idx = parseInt(btn.dataset.idx);
        var isCorrect = idx === quiz.c;
        saved.answered++;
        if(isCorrect) saved.correct++;
        saved.idx++;
        if(saved.idx >= V26_QUIZ.length) saved.idx = 0;

        btns.forEach(function(b){
          var bi = parseInt(b.dataset.idx);
          if(bi === quiz.c) b.style.borderColor = '#4ECDC4';
          else if(bi === idx && !isCorrect) b.style.borderColor = '#FF6B6B';
          b.style.pointerEvents = 'none';
        });

        sfxV26(isCorrect ? 'v26_quiz' : 'explore_click');
        v26Save('v26_quiz_state', saved);

        setTimeout(function(){
          m2.closest('div[style]').remove();
          renderV26Quiz();
        }, 1200);
      });
    });
  }, 100);
}


// ============================================================
// ACHIEVEMENTS v26 (+12, 238 -> 250)
// ============================================================
var V26_ACHIEVEMENTS = [
  {id:'a_v26_elem_3',name:'속성 연구원',desc:'속성 3종 스캔',cat:'general',icon:'🔥'},
  {id:'a_v26_elem_all',name:'속성 마스터',desc:'모든 속성 스캔 완료',cat:'general',icon:'🌈'},
  {id:'a_v26_combo_5',name:'콤보 수집가',desc:'콤보 5종 발견',cat:'general',icon:'⛓️'},
  {id:'a_v26_combo_all',name:'콤보 완전체',desc:'모든 콤보 발견',cat:'general',icon:'💫'},
  {id:'a_v26_awaken_4',name:'각성의 빛',desc:'캐릭터 4종 각성 분석',cat:'general',icon:'🌟'},
  {id:'a_v26_explore_50',name:'탐험가',desc:'전체 탐사율 50% 달성',cat:'general',icon:'🗺️'},
  {id:'a_v26_boss_4',name:'보스 분석가',desc:'보스 4종 약점 분석',cat:'general',icon:'🗡️'},
  {id:'a_v26_equip_3',name:'장비 수집가',desc:'세트 3종 활성화',cat:'general',icon:'🛡️'},
  {id:'a_v26_skill_6',name:'스킬 입문자',desc:'스킬 6종 해금',cat:'general',icon:'🔗'},
  {id:'a_v26_skill_all',name:'스킬 마스터',desc:'모든 스킬 해금',cat:'general',icon:'⚡'},
  {id:'a_v26_power_s',name:'S등급 전사',desc:'S등급 전투력 달성',cat:'general',icon:'🏅'},
  {id:'a_v26_quiz_v26',name:'퀴즈 v26 마스터',desc:'v26 퀴즈 전문 정답',cat:'general',icon:'🏆'}
];

function checkV26Achievements(){
  var achievements;
  try{ achievements = JSON.parse(localStorage.getItem('hatcuping_achievements')) || {}; }catch(e){ achievements = {}; }
  var changed = false;

  var elem = v26Load('v26_elem', {scanned:[]});
  if(elem.scanned.length >= 3 && !achievements.a_v26_elem_3){ achievements.a_v26_elem_3 = Date.now(); changed = true; showToastV26('🏆 속성 연구원 업적 달성!'); }
  if(elem.scanned.length >= ELEMENTS.length && !achievements.a_v26_elem_all){ achievements.a_v26_elem_all = Date.now(); changed = true; showToastV26('🏆 속성 마스터 업적 달성!'); }

  var combo = v26Load('v26_combo', {discovered:[]});
  if(combo.discovered.length >= 5 && !achievements.a_v26_combo_5){ achievements.a_v26_combo_5 = Date.now(); changed = true; showToastV26('🏆 콤보 수집가 업적 달성!'); }
  if(combo.discovered.length >= COMBO_CHAINS.length && !achievements.a_v26_combo_all){ achievements.a_v26_combo_all = Date.now(); changed = true; showToastV26('🏆 콤보 완전체 업적 달성!'); }

  var awaken = v26Load('v26_awaken', {awakened:[]});
  if(awaken.awakened.length >= 4 && !achievements.a_v26_awaken_4){ achievements.a_v26_awaken_4 = Date.now(); changed = true; showToastV26('🏆 각성의 빛 업적 달성!'); }

  var explore = v26Load('v26_explore', {regions:[]});
  if(explore.regions.length > 0){
    var totalExpl = 0, totalAr = 0;
    explore.regions.forEach(function(r, i){ if(WORLD_REGIONS[i]){ totalExpl += r.explored; totalAr += WORLD_REGIONS[i].areas; }});
    if(totalAr > 0 && totalExpl / totalAr >= 0.5 && !achievements.a_v26_explore_50){ achievements.a_v26_explore_50 = Date.now(); changed = true; showToastV26('🏆 탐험가 업적 달성!'); }
  }

  var weakness = v26Load('v26_weakness', {analyzed:[]});
  if(weakness.analyzed.length >= 4 && !achievements.a_v26_boss_4){ achievements.a_v26_boss_4 = Date.now(); changed = true; showToastV26('🏆 보스 분석가 업적 달성!'); }

  var equip = v26Load('v26_equip', {owned:{}});
  var activeSets = 0;
  Object.values(equip.owned).forEach(function(v){ if(v > 0) activeSets++; });
  if(activeSets >= 3 && !achievements.a_v26_equip_3){ achievements.a_v26_equip_3 = Date.now(); changed = true; showToastV26('🏆 장비 수집가 업적 달성!'); }

  var skills = v26Load('v26_skills', {unlocked:[]});
  if(skills.unlocked.length >= 6 && !achievements.a_v26_skill_6){ achievements.a_v26_skill_6 = Date.now(); changed = true; showToastV26('🏆 스킬 입문자 업적 달성!'); }
  if(skills.unlocked.length >= SKILL_NODES.length && !achievements.a_v26_skill_all){ achievements.a_v26_skill_all = Date.now(); changed = true; showToastV26('🏆 스킬 마스터 업적 달성!'); }

  var power = v26Load('v26_power', {data:[]});
  if(power.data.length > 0){
    var anyS = power.data.some(function(d){ return d.reduce(function(a,b){return a+b;},0) >= 700; });
    if(anyS && !achievements.a_v26_power_s){ achievements.a_v26_power_s = Date.now(); changed = true; showToastV26('🏆 S등급 전사 업적 달성!'); }
  }

  var quiz = v26Load('v26_quiz_state', {answered:0, correct:0});
  if(quiz.answered >= 15 && quiz.correct >= 15 && !achievements.a_v26_quiz_v26){ achievements.a_v26_quiz_v26 = Date.now(); changed = true; showToastV26('🏆 퀴즈 v26 마스터 업적 달성!'); }

  if(changed){
    try{ localStorage.setItem('hatcuping_achievements', JSON.stringify(achievements)); }catch(e){}
    var countEl = document.getElementById('achieveCount');
    if(countEl) countEl.textContent = Object.keys(achievements).length + '/24';
  }
}

setInterval(checkV26Achievements, 5000);


// ============================================================
// NAV BUTTONS - Append to existing bottom bar (UI rule compliant)
// ============================================================
function addV26NavButtons(){
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
    {label:'🔥 속성상성',fn:renderElementAnalyzer,key:'Shift+A'},
    {label:'⛓️ 콤보연쇄',fn:renderComboChainBuilder,key:'Shift+S'},
    {label:'🌟 각성매트릭스',fn:renderAwakenMatrix,key:'Shift+F'},
    {label:'🗺️ 탐사트래커',fn:renderExplorationTracker,key:'Shift+G'},
    {label:'🗡️ 보스약점',fn:renderBossWeakness,key:'Shift+H'},
    {label:'🛡️ 장비세트',fn:renderEquipSetCalc,key:'Shift+J'},
    {label:'🔗 스킬네트워크',fn:renderSkillNetwork,key:'Shift+K'},
    {label:'⚔️ 전투력레이더',fn:renderBattlePowerRadar,key:'Shift+L'},
    {label:'❓ 퀴즈v26',fn:renderV26Quiz,key:'Shift+0'}
  ];

  if(bottomBar){
    navItems.forEach(function(item){
      var btn = document.createElement('button');
      btn.textContent = item.label;
      btn.style.cssText = 'padding:6px 10px;margin:2px;background:linear-gradient(135deg,#FF5FA2,#FF88CC);color:#fff;border:none;border-radius:10px;font-size:10px;font-weight:700;cursor:pointer;white-space:nowrap';
      btn.addEventListener('click', function(){ sfxV26('v26_nav'); item.fn(); });
      bottomBar.appendChild(btn);
    });
  }

  document.addEventListener('keydown', function(e){
    if(!e.shiftKey) return;
    if(e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    var keyMap = {
      'A':renderElementAnalyzer, 'S':renderComboChainBuilder, 'F':renderAwakenMatrix,
      'G':renderExplorationTracker, 'H':renderBossWeakness, 'J':renderEquipSetCalc,
      'K':renderSkillNetwork, 'L':renderBattlePowerRadar, '0':renderV26Quiz
    };
    var fn = keyMap[e.key.toUpperCase()];
    if(fn){ e.preventDefault(); sfxV26('v26_nav'); fn(); }
  });
}

if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', addV26NavButtons);
} else {
  addV26NavButtons();
}

})();

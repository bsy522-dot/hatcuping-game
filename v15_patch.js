// hatcuping-game v15_patch.js - NEXTERA+PRISM AUTO v15.0
// Self-contained patch module (1150+ lines, 55+ functions)
(function(){
'use strict';

// ============================================================
// SFX ENGINE (12 sound types)
// ============================================================
var _v15Ctx = null;
function _v15InitAudio(){
  if(!_v15Ctx){
    try{ _v15Ctx = new (window.AudioContext || window.webkitAudioContext)(); }catch(e){}
  }
  if(_v15Ctx && _v15Ctx.state === 'suspended') _v15Ctx.resume();
}

var V15_SFX = {
  evo_open:{f:660,d:.08,t:'triangle'},
  evo_evolve:{f:1200,d:.2,t:'sine'},
  compat_open:{f:580,d:.06,t:'sine'},
  compat_check:{f:880,d:.08,t:'triangle'},
  party_open:{f:620,d:.06,t:'sine'},
  party_set:{f:1047,d:.1,t:'triangle'},
  arcade_open:{f:700,d:.06,t:'sine'},
  arcade_play:{f:990,d:.08,t:'square'},
  season_open:{f:550,d:.07,t:'sine'},
  season_claim:{f:1100,d:.12,t:'triangle'},
  ost_play:{f:440,d:.06,t:'sine'},
  avatar_open:{f:760,d:.07,t:'triangle'}
};

function sfxV15(type){
  _v15InitAudio();
  if(!_v15Ctx) return;
  var s = V15_SFX[type];
  if(!s) return;
  try{
    var muted = false;
    try{ muted = localStorage.getItem('hatcuping_mute') === '1'; }catch(e){}
    if(muted) return;
    var osc = _v15Ctx.createOscillator();
    var gain = _v15Ctx.createGain();
    osc.type = s.t || 'sine';
    osc.frequency.value = s.f;
    gain.gain.value = 0.08;
    osc.connect(gain);
    gain.connect(_v15Ctx.destination);
    osc.start();
    osc.stop(_v15Ctx.currentTime + (s.d || 0.06));
  }catch(e){}
}


// ============================================================
// UTILITY FUNCTIONS
// ============================================================
function trackV15Feature(id){
  try{
    var saved = JSON.parse(localStorage.getItem('hatcuping_v15_features') || '[]');
    if(saved.indexOf(id) === -1){ saved.push(id); localStorage.setItem('hatcuping_v15_features', JSON.stringify(saved)); }
  }catch(e){}
}

function showToastV15(msg){
  var t = document.getElementById('achieveToast');
  if(t){ t.innerHTML = msg; t.classList.add('show'); setTimeout(function(){ t.classList.remove('show'); }, 2500); }
}

function v15Load(key, fallback){
  try{ var d = JSON.parse(localStorage.getItem('hatcuping_v15_' + key)); return d !== null ? d : fallback; }catch(e){ return fallback; }
}

function v15Save(key, data){
  try{ localStorage.setItem('hatcuping_v15_' + key, JSON.stringify(data)); }catch(e){}
}

function todayStrV15(){
  var d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}

function createV15Modal(id, title, contentFn){
  if(document.getElementById(id)) return;
  var overlay = document.createElement('div');
  overlay.id = id;
  overlay.className = 'modal-overlay show';
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');
  var html = '<div class="modal" style="max-width:480px">';
  html += '<button class="modal-close" aria-label="&#xB2EB;&#xAE30;" onclick="document.getElementById(\'' + id + '\').remove()">&times;</button>';
  html += '<h3 style="font-size:17px">' + title + '</h3>';
  html += contentFn();
  html += '</div>';
  overlay.innerHTML = html;
  overlay.addEventListener('click', function(e){ if(e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
  return overlay;
}


// ============================================================
// 1. TINIPING EVOLUTION CHAIN CANVAS (12&#xC885; 3&#xB2E8;&#xACC4; &#xC9C4;&#xD654;)
// ============================================================
var EVO_CHAINS = [
  {id:'evo_love',base:'&#xC0AC;&#xB791;&#xC528;&#xC557;',mid:'&#xD558;&#xCE04;&#xD551;',final:'&#xB7EC;&#xBE0C;&#xD558;&#xCE04;&#xD551;',icon:['&#x1F331;','&#x1F496;','&#x1F49D;'],lvReq:[1,10,25],element:'&#xC0AC;&#xB791;'},
  {id:'evo_courage',base:'&#xC6A9;&#xAE30;&#xC528;&#xC557;',mid:'&#xC6A9;&#xAE30;&#xD551;',final:'&#xC6A9;&#xC790;&#xC6A9;&#xAE30;&#xD551;',icon:['&#x1F331;','&#x1F4AA;','&#x2694;&#xFE0F;'],lvReq:[1,10,25],element:'&#xC6A9;&#xAE30;'},
  {id:'evo_happy',base:'&#xAE30;&#xC068;&#xC528;&#xC557;',mid:'&#xD589;&#xBCF5;&#xD551;',final:'&#xD658;&#xD76C;&#xD589;&#xBCF5;&#xD551;',icon:['&#x1F331;','&#x1F60A;','&#x2728;'],lvReq:[1,10,25],element:'&#xAE30;&#xC068;'},
  {id:'evo_wisdom',base:'&#xC9C0;&#xD61C;&#xC528;&#xC557;',mid:'&#xC9C0;&#xD61C;&#xD551;',final:'&#xD604;&#xC790;&#xC9C0;&#xD61C;&#xD551;',icon:['&#x1F331;','&#x1F4D6;','&#x1F9D9;'],lvReq:[1,12,28],element:'&#xC9C0;&#xD61C;'},
  {id:'evo_dream',base:'&#xAFC8;&#xC528;&#xC557;',mid:'&#xAFC8;&#xD551;',final:'&#xBCC4;&#xBE5B;&#xAFC8;&#xD551;',icon:['&#x1F331;','&#x1F31F;','&#x1F30C;'],lvReq:[1,8,22],element:'&#xAFC8;'},
  {id:'evo_kind',base:'&#xCE5C;&#xC808;&#xC528;&#xC557;',mid:'&#xCC29;&#xD551;',final:'&#xC131;&#xC790;&#xCC29;&#xD551;',icon:['&#x1F331;','&#x1F338;','&#x1F33A;'],lvReq:[1,8,22],element:'&#xCE5C;&#xC808;'},
  {id:'evo_anger',base:'&#xBD84;&#xB178;&#xC528;&#xC557;',mid:'&#xD654;&#xB0B4;&#xD551;',final:'&#xD3ED;&#xD48D;&#xD654;&#xB0B4;&#xD551;',icon:['&#x1F331;','&#x1F621;','&#x1F525;'],lvReq:[1,10,25],element:'&#xBD84;&#xB178;'},
  {id:'evo_sad',base:'&#xC2AC;&#xD514;&#xC528;&#xC557;',mid:'&#xC2AC;&#xD504;&#xD551;',final:'&#xC704;&#xB85C;&#xC2AC;&#xD504;&#xD551;',icon:['&#x1F331;','&#x1F622;','&#x1F4A7;'],lvReq:[1,10,25],element:'&#xC2AC;&#xD514;'},
  {id:'evo_jealous',base:'&#xC9C8;&#xD22C;&#xC528;&#xC557;',mid:'&#xC9C8;&#xD22C;&#xD551;',final:'&#xC5F4;&#xC815;&#xC9C8;&#xD22C;&#xD551;',icon:['&#x1F331;','&#x1F624;','&#x1F4A2;'],lvReq:[1,12,28],element:'&#xC9C8;&#xD22C;'},
  {id:'evo_star',base:'&#xBCC4;&#xBE5B;&#xC528;&#xC557;',mid:'&#xBCC4;&#xBE5B;&#xD551;',final:'&#xC740;&#xD558;&#xBCC4;&#xBE5B;&#xD551;',icon:['&#x1F331;','&#x2B50;','&#x1F31F;'],lvReq:[1,15,30],element:'&#xBCC4;'},
  {id:'evo_rainbow',base:'&#xBB34;&#xC9C0;&#xAC1C;&#xC528;&#xC557;',mid:'&#xBB34;&#xC9C0;&#xAC1C;&#xD551;',final:'&#xD504;&#xB9AC;&#xC998;&#xBB34;&#xC9C0;&#xAC1C;&#xD551;',icon:['&#x1F331;','&#x1F308;','&#x1FA84;'],lvReq:[1,15,30],element:'&#xBB34;&#xC9C0;&#xAC1C;'},
  {id:'evo_miracle',base:'&#xAE30;&#xC801;&#xC528;&#xC557;',mid:'&#xAE30;&#xC801;&#xD551;',final:'&#xC2E0;&#xC131;&#xAE30;&#xC801;&#xD551;',icon:['&#x1F331;','&#x1FA84;','&#x1F451;'],lvReq:[1,20,35],element:'&#xAE30;&#xC801;'}
];

function getEvoData(){
  return v15Load('evo', {levels:{},evolved:{}});
}
function saveEvoData(d){ v15Save('evo', d); }

function evolve(chainId){
  var d = getEvoData();
  var chain = null;
  for(var i=0;i<EVO_CHAINS.length;i++){ if(EVO_CHAINS[i].id===chainId){ chain=EVO_CHAINS[i]; break; } }
  if(!chain) return;
  var lv = d.levels[chainId] || 1;
  var stage = d.evolved[chainId] || 0;
  if(stage >= 2) return;
  var req = chain.lvReq[stage + 1];
  if(lv >= req){
    d.evolved[chainId] = stage + 1;
    saveEvoData(d);
    sfxV15('evo_evolve');
    showToastV15('&#x2728; ' + (stage === 0 ? chain.mid : chain.final) + '&#xC73C;&#xB85C; &#xC9C4;&#xD654;!');
    checkAndAwardV15();
  }
}

function openEvoChain(){
  trackV15Feature('evo');
  sfxV15('evo_open');
  var d = getEvoData();

  createV15Modal('evoModal', '&#x1F331; &#xD2F0;&#xB2C8;&#xD551; &#xC9C4;&#xD654; &#xCCB4;&#xC778;', function(){
    var html = '<canvas id="evoCanvas" width="440" height="300" style="width:100%;border-radius:12px;margin-bottom:10px;background:linear-gradient(135deg,rgba(200,240,200,.15),rgba(100,200,255,.1))"></canvas>';
    html += '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px">';
    EVO_CHAINS.forEach(function(ch){
      var lv = d.levels[ch.id] || 1;
      var stage = d.evolved[ch.id] || 0;
      var names = [ch.base, ch.mid, ch.final];
      var canEvo = stage < 2 && lv >= ch.lvReq[stage + 1];
      html += '<div style="padding:10px;border-radius:14px;background:rgba(0,0,0,.03);border:2px solid ' + (stage >= 2 ? 'rgba(255,215,0,.4)' : 'transparent') + '">';
      html += '<div style="display:flex;align-items:center;gap:4px;margin-bottom:4px">';
      for(var s=0;s<3;s++){
        html += '<span style="font-size:' + (s===stage?'22px':'14px') + ';opacity:' + (s<=stage?'1':'.3') + '">' + ch.icon[s] + '</span>';
        if(s<2) html += '<span style="font-size:10px;color:var(--text-sub)">&#x2192;</span>';
      }
      html += '</div>';
      html += '<div style="font-size:12px;font-weight:700;margin-bottom:2px">' + names[stage] + '</div>';
      html += '<div style="font-size:10px;color:var(--text-sub)">Lv.' + lv + ' | ' + ch.element + ' &#xC18D;&#xC131;</div>';
      html += '<div style="height:4px;background:rgba(0,0,0,.08);border-radius:2px;margin:4px 0;overflow:hidden"><div style="height:100%;width:' + Math.min(lv / (ch.lvReq[2] || 35) * 100, 100) + '%;background:linear-gradient(90deg,#4CAF50,#81C784);border-radius:2px"></div></div>';
      html += '<div style="display:flex;justify-content:space-between;align-items:center">';
      html += '<button onclick="(function(){var d=JSON.parse(localStorage.getItem(\'hatcuping_v15_evo\')||\'{}\')||{};if(!d.levels)d.levels={};d.levels[\'' + ch.id + '\']=(d.levels[\'' + ch.id + '\']||1)+1;localStorage.setItem(\'hatcuping_v15_evo\',JSON.stringify(d));document.getElementById(\'evoModal\').remove();})()" style="padding:3px 8px;border-radius:8px;border:none;font-size:10px;font-weight:700;cursor:pointer;background:rgba(76,175,80,.15);color:#4CAF50">&#xD6C8;&#xB828;+1</button>';
      if(canEvo){
        html += '<button onclick="(function(){var d=JSON.parse(localStorage.getItem(\'hatcuping_v15_evo\')||\'{}\')||{};if(!d.evolved)d.evolved={};d.evolved[\'' + ch.id + '\']=(d.evolved[\'' + ch.id + '\']||0)+1;localStorage.setItem(\'hatcuping_v15_evo\',JSON.stringify(d));document.getElementById(\'evoModal\').remove();})()" style="padding:3px 10px;border-radius:8px;border:none;font-size:10px;font-weight:700;cursor:pointer;background:linear-gradient(135deg,#FF5FA2,#B066FF);color:#fff;animation:badgePulse 1.5s infinite">&#xC9C4;&#xD654;!</button>';
      }
      html += '</div></div>';
    });
    html += '</div>';

    setTimeout(function(){
      var cv = document.getElementById('evoCanvas');
      if(!cv) return;
      var cx = cv.getContext('2d');
      var w = cv.width, h = cv.height;
      cx.clearRect(0,0,w,h);
      cx.font = '13px sans-serif';
      cx.textAlign = 'center';
      cx.fillStyle = '#666';
      cx.fillText('&#xC9C4;&#xD654; &#xCCB4;&#xC778; &#xC804;&#xCCB4; &#xD604;&#xD669;', w/2, 20);
      var cols = 4, rows = 3;
      var cw = w/cols, ch2 = (h-40)/rows;
      EVO_CHAINS.forEach(function(chain, idx){
        var col = idx % cols, row = Math.floor(idx / cols);
        var bx = col*cw + cw/2, by = 40 + row*ch2 + ch2/2;
        var stage = d.evolved[chain.id] || 0;
        var colors = ['#A5D6A7','#66BB6A','#FFD700'];
        cx.beginPath();
        cx.arc(bx, by, 20, 0, Math.PI*2);
        cx.fillStyle = colors[stage] || '#A5D6A7';
        cx.fill();
        cx.strokeStyle = stage >= 2 ? '#FFD700' : '#888';
        cx.lineWidth = stage >= 2 ? 3 : 1;
        cx.stroke();
        cx.fillStyle = '#333';
        cx.font = '9px sans-serif';
        cx.fillText(chain.mid.substring(0,4), bx, by + 34);
        cx.font = '16px sans-serif';
        cx.fillText(chain.icon[stage], bx, by + 6);
      });
    }, 100);

    return html;
  });
}


// ============================================================
// 2. ELEMENT COMPATIBILITY MATRIX (8&#xC18D;&#xC131; &#xC0C1;&#xC131;&#xD45C; Canvas)
// ============================================================
var ELEMENTS = ['&#xC0AC;&#xB791;','&#xC6A9;&#xAE30;','&#xAE30;&#xC068;','&#xC9C0;&#xD61C;','&#xBD84;&#xB178;','&#xC2AC;&#xD514;','&#xBCC4;','&#xBB34;&#xC9C0;&#xAC1C;'];
var ELEM_COLORS = ['#FF5FA2','#FF6B35','#FFD700','#4A90D9','#F44336','#5C6BC0','#9C27B0','#4CAF50'];
var COMPAT_MATRIX = [
  [1.0,1.2,1.3,0.8,0.5,1.5,1.0,1.2],
  [0.8,1.0,1.0,0.7,1.5,0.8,1.2,1.0],
  [0.7,1.0,1.0,1.2,0.6,1.5,1.0,1.3],
  [1.2,1.3,0.8,1.0,0.8,1.0,1.5,0.7],
  [1.5,0.5,1.4,1.2,1.0,0.6,0.8,1.0],
  [0.5,1.2,0.5,1.0,1.4,1.0,1.0,1.2],
  [1.0,0.8,1.0,0.5,1.2,1.0,1.0,1.5],
  [0.8,1.0,0.7,1.3,1.0,0.8,0.5,1.0]
];

function openCompatChart(){
  trackV15Feature('compat');
  sfxV15('compat_open');

  createV15Modal('compatModal', '&#x2694;&#xFE0F; &#xC18D;&#xC131; &#xC0C1;&#xC131;&#xD45C;', function(){
    var html = '<canvas id="compatCanvas" width="420" height="420" style="width:100%;border-radius:12px;margin-bottom:10px"></canvas>';
    html += '<div style="font-size:11px;color:var(--text-sub);text-align:center;margin-bottom:8px">&#xBE68;&#xAC04;&#xC0C9;=&#xC720;&#xB9AC;(1.3+) | &#xCD08;&#xB85D;&#xC0C9;=&#xBD88;&#xB9AC;(0.7-) | &#xD68C;&#xC0C9;=&#xBCF4;&#xD1B5;</div>';
    html += '<div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center">';
    ELEMENTS.forEach(function(el, i){
      html += '<span style="padding:3px 10px;border-radius:10px;font-size:11px;font-weight:700;background:' + ELEM_COLORS[i] + '20;color:' + ELEM_COLORS[i] + ';border:1px solid ' + ELEM_COLORS[i] + '40">' + el + '</span>';
    });
    html += '</div>';

    setTimeout(function(){
      var cv = document.getElementById('compatCanvas');
      if(!cv) return;
      var cx = cv.getContext('2d');
      var w = cv.width, h = cv.height;
      var pad = 60, cellW = (w-pad)/8, cellH = (h-pad)/8;
      cx.clearRect(0,0,w,h);
      cx.fillStyle = '#333';
      cx.font = 'bold 11px sans-serif';
      cx.textAlign = 'center';
      cx.fillText('&#xACF5;&#xACA9; &#x2193; / &#xBC29;&#xC5B4; &#x2192;', w/2, 14);
      for(var i=0;i<8;i++){
        cx.fillStyle = ELEM_COLORS[i];
        cx.font = 'bold 10px sans-serif';
        cx.textAlign = 'right';
        cx.fillText(ELEMENTS[i], pad-4, pad + i*cellH + cellH/2 + 4);
        cx.textAlign = 'center';
        cx.fillText(ELEMENTS[i], pad + i*cellW + cellW/2, pad - 6);
      }
      for(var r=0;r<8;r++){
        for(var c=0;c<8;c++){
          var val = COMPAT_MATRIX[r][c];
          var x = pad + c*cellW, y = pad + r*cellH;
          if(val >= 1.3) cx.fillStyle = 'rgba(244,67,54,.25)';
          else if(val <= 0.7) cx.fillStyle = 'rgba(76,175,80,.25)';
          else if(val >= 1.1) cx.fillStyle = 'rgba(255,152,0,.15)';
          else cx.fillStyle = 'rgba(0,0,0,.04)';
          cx.fillRect(x+1, y+1, cellW-2, cellH-2);
          cx.strokeStyle = 'rgba(0,0,0,.1)';
          cx.strokeRect(x, y, cellW, cellH);
          cx.fillStyle = val >= 1.3 ? '#D32F2F' : val <= 0.7 ? '#388E3C' : '#666';
          cx.font = 'bold 12px sans-serif';
          cx.textAlign = 'center';
          cx.fillText(val.toFixed(1) + 'x', x + cellW/2, y + cellH/2 + 4);
        }
      }
    }, 100);

    return html;
  });
}


// ============================================================
// 3. PARTY BUILDER (4&#xC778; &#xD30C;&#xD2F0; &#xD3B8;&#xC131;&#xAE30; + &#xC2DC;&#xB108;&#xC9C0; Canvas)
// ============================================================
var PARTY_MEMBERS = [
  {id:'pm_romi',name:'&#xB85C;&#xBBF8;',icon:'&#x1F467;',type:'&#xC8FC;&#xC778;&#xACF5;',hp:100,atk:80,def:70,spd:90,element:'&#xC0AC;&#xB791;'},
  {id:'pm_hatchu',name:'&#xD558;&#xCE04;&#xD551;',icon:'&#x1F496;',type:'&#xAC10;&#xC815;',hp:120,atk:85,def:60,spd:85,element:'&#xC0AC;&#xB791;'},
  {id:'pm_courage',name:'&#xC6A9;&#xAE30;&#xD551;',icon:'&#x1F4AA;',type:'&#xAC10;&#xC815;',hp:130,atk:95,def:80,spd:70,element:'&#xC6A9;&#xAE30;'},
  {id:'pm_happy',name:'&#xD589;&#xBCF5;&#xD551;',icon:'&#x1F60A;',type:'&#xAC10;&#xC815;',hp:110,atk:75,def:65,spd:95,element:'&#xAE30;&#xC068;'},
  {id:'pm_wisdom',name:'&#xC9C0;&#xD61C;&#xD551;',icon:'&#x1F4D6;',type:'&#xAC10;&#xC815;',hp:95,atk:100,def:55,spd:80,element:'&#xC9C0;&#xD61C;'},
  {id:'pm_dream',name:'&#xAFC8;&#xD551;',icon:'&#x1F31F;',type:'&#xAC10;&#xC815;',hp:100,atk:70,def:75,spd:100,element:'&#xAFC8;'},
  {id:'pm_kind',name:'&#xCC29;&#xD551;',icon:'&#x1F338;',type:'&#xAC10;&#xC815;',hp:115,atk:65,def:85,spd:75,element:'&#xCE5C;&#xC808;'},
  {id:'pm_star',name:'&#xBCC4;&#xBE5B;&#xD551;',icon:'&#x2B50;',type:'&#xC804;&#xC124;',hp:140,atk:110,def:90,spd:85,element:'&#xBCC4;'}
];

var SYNERGIES = [
  {ids:['pm_romi','pm_hatchu'],name:'&#xC0AC;&#xB791;&#xC758; &#xC720;&#xB300;',bonus:'ATK+15%',desc:'&#xB85C;&#xBBF8;+&#xD558;&#xCE04;&#xD551; &#xC0AC;&#xB791; &#xC2DC;&#xB108;&#xC9C0;'},
  {ids:['pm_courage','pm_wisdom'],name:'&#xBB38;&#xBB34;&#xACB8;&#xBE44;',bonus:'DEF+20%',desc:'&#xC6A9;&#xAE30;+&#xC9C0;&#xD61C; &#xBC38;&#xB7F0;&#xC2A4; &#xC2DC;&#xB108;&#xC9C0;'},
  {ids:['pm_happy','pm_dream'],name:'&#xAFC8;&#xACFC; &#xD76C;&#xB9DD;',bonus:'SPD+15%',desc:'&#xD589;&#xBCF5;+&#xAFC8; &#xD76C;&#xB9DD; &#xC2DC;&#xB108;&#xC9C0;'},
  {ids:['pm_kind','pm_star'],name:'&#xBCC4;&#xBE5B; &#xCE5C;&#xC808;',bonus:'HP+20%',desc:'&#xCC29;&#xD551;+&#xBCC4;&#xBE5B;&#xD551; &#xD78C;&#xB9C1; &#xC2DC;&#xB108;&#xC9C0;'}
];

function getPartyData(){
  return v15Load('party', {slots:['pm_romi','pm_hatchu','pm_courage','pm_happy']});
}
function savePartyData(d){ v15Save('party', d); }

function openPartyBuilder(){
  trackV15Feature('party');
  sfxV15('party_open');
  var d = getPartyData();

  createV15Modal('partyModal', '&#x1F46B; &#xD30C;&#xD2F0; &#xD3B8;&#xC131;&#xAE30;', function(){
    var html = '<canvas id="partyCanvas" width="400" height="240" style="width:100%;border-radius:12px;margin-bottom:10px;background:linear-gradient(135deg,rgba(255,200,220,.1),rgba(180,200,255,.1))"></canvas>';

    var activeSyn = [];
    SYNERGIES.forEach(function(syn){
      var match = syn.ids.every(function(id){ return d.slots.indexOf(id) !== -1; });
      if(match) activeSyn.push(syn);
    });

    if(activeSyn.length > 0){
      html += '<div style="margin-bottom:10px">';
      activeSyn.forEach(function(syn){
        html += '<div style="padding:6px 10px;border-radius:10px;background:rgba(255,215,0,.1);border:1px solid rgba(255,215,0,.3);margin-bottom:4px;font-size:11px"><span style="font-weight:700;color:#D4940A">&#x2728; ' + syn.name + '</span> <span style="color:#996B00">(' + syn.bonus + ')</span><div style="font-size:10px;color:var(--text-sub)">' + syn.desc + '</div></div>';
      });
      html += '</div>';
    }

    html += '<div style="font-size:12px;font-weight:700;color:var(--text-sub);margin-bottom:6px">&#xD30C;&#xD2F0; &#xC2AC;&#xB86F; (4&#xC778;)</div>';
    html += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:12px">';
    for(var s=0;s<4;s++){
      var member = null;
      for(var m=0;m<PARTY_MEMBERS.length;m++){
        if(PARTY_MEMBERS[m].id === d.slots[s]){ member = PARTY_MEMBERS[m]; break; }
      }
      html += '<div style="padding:8px;border-radius:12px;background:rgba(255,95,162,.06);text-align:center;border:2px solid rgba(255,95,162,.2)">';
      html += '<div style="font-size:24px">' + (member ? member.icon : '&#x2753;') + '</div>';
      html += '<div style="font-size:11px;font-weight:700">' + (member ? member.name : '&#xBE44;&#xC5B4;&#xC788;&#xC74C;') + '</div>';
      if(member){
        html += '<div style="font-size:9px;color:var(--text-sub)">HP' + member.hp + ' ATK' + member.atk + '</div>';
      }
      html += '</div>';
    }
    html += '</div>';

    html += '<div style="font-size:12px;font-weight:700;color:var(--text-sub);margin-bottom:6px">&#xBA64;&#xBC84; &#xC120;&#xD0DD;</div>';
    html += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px">';
    PARTY_MEMBERS.forEach(function(pm){
      var inParty = d.slots.indexOf(pm.id) !== -1;
      html += '<div onclick="(function(){var d=JSON.parse(localStorage.getItem(\'hatcuping_v15_party\')||\'{}\')||{};if(!d.slots)d.slots=[];var idx=d.slots.indexOf(\'' + pm.id + '\');if(idx!==-1){d.slots.splice(idx,1)}else if(d.slots.length<4){d.slots.push(\'' + pm.id + '\')}localStorage.setItem(\'hatcuping_v15_party\',JSON.stringify(d));document.getElementById(\'partyModal\').remove();})()" style="padding:6px;border-radius:10px;background:' + (inParty ? 'rgba(76,175,80,.12)' : 'rgba(0,0,0,.03)') + ';border:2px solid ' + (inParty ? 'rgba(76,175,80,.4)' : 'transparent') + ';text-align:center;cursor:pointer">';
      html += '<span style="font-size:20px">' + pm.icon + '</span>';
      html += '<div style="font-size:10px;font-weight:700">' + pm.name + '</div>';
      html += '</div>';
    });
    html += '</div>';

    setTimeout(function(){
      var cv = document.getElementById('partyCanvas');
      if(!cv) return;
      var cx = cv.getContext('2d');
      var w = cv.width, h2 = cv.height;
      cx.clearRect(0,0,w,h2);
      cx.font = 'bold 13px sans-serif';
      cx.textAlign = 'center';
      cx.fillStyle = '#666';
      cx.fillText('&#xD30C;&#xD2F0; &#xC804;&#xD22C;&#xB825; &#xBD84;&#xC11D;', w/2, 20);
      var stats = ['HP','ATK','DEF','SPD'];
      var vals = [0,0,0,0];
      d.slots.forEach(function(id){
        for(var i=0;i<PARTY_MEMBERS.length;i++){
          if(PARTY_MEMBERS[i].id===id){
            vals[0]+=PARTY_MEMBERS[i].hp;
            vals[1]+=PARTY_MEMBERS[i].atk;
            vals[2]+=PARTY_MEMBERS[i].def;
            vals[3]+=PARTY_MEMBERS[i].spd;
            break;
          }
        }
      });
      var maxV = Math.max.apply(null, vals) || 1;
      var bw = 60, gap = 20, startX = (w - (bw*4 + gap*3))/2;
      var barColors = ['#4CAF50','#F44336','#2196F3','#FF9800'];
      for(var i=0;i<4;i++){
        var x = startX + i*(bw+gap);
        var barH = vals[i] / maxV * 140;
        cx.fillStyle = barColors[i] + '30';
        cx.fillRect(x, 40, bw, 160);
        cx.fillStyle = barColors[i];
        cx.fillRect(x, 40 + 160 - barH, bw, barH);
        cx.strokeStyle = barColors[i];
        cx.strokeRect(x, 40, bw, 160);
        cx.fillStyle = '#333';
        cx.font = 'bold 11px sans-serif';
        cx.fillText(stats[i], x + bw/2, 215);
        cx.fillText(vals[i].toString(), x + bw/2, 40 + 160 - barH - 6);
      }
    }, 100);

    return html;
  });
}


// ============================================================
// 4. ARCADE SCOREBOARD (8&#xC885; &#xBBF8;&#xB2C8;&#xAC8C;&#xC784; &#xC2A4;&#xCF54;&#xC5B4;&#xBCF4;&#xB4DC;)
// ============================================================
var ARCADE_GAMES = [
  {id:'ag_memory',name:'&#xCE74;&#xB4DC; &#xB9E4;&#xCE6D;',icon:'&#x1F0CF;',desc:'&#xAC19;&#xC740; &#xD2F0;&#xB2C8;&#xD551; &#xCC3E;&#xAE30;',best:0},
  {id:'ag_reaction',name:'&#xBC18;&#xC751;&#xC18D;&#xB3C4;',icon:'&#x26A1;',desc:'&#xBE60;&#xB974;&#xAC8C; &#xD0ED;&#xD558;&#xAE30;',best:999},
  {id:'ag_puzzle',name:'&#xD37C;&#xC990; &#xD0C0;&#xC77C;',icon:'&#x1F9E9;',desc:'3x3 &#xC2AC;&#xB77C;&#xC774;&#xB4DC; &#xD37C;&#xC990;',best:0},
  {id:'ag_catch',name:'&#xBCC4;&#xBE5B; &#xC7A1;&#xAE30;',icon:'&#x2B50;',desc:'&#xB5A8;&#xC5B4;&#xC9C0;&#xB294; &#xBCC4; &#xC7A1;&#xAE30;',best:0},
  {id:'ag_quiz',name:'&#xC2A4;&#xD53C;&#xB4DC; &#xD034;&#xC988;',icon:'&#x1F4DD;',desc:'10&#xCD08; &#xC548;&#xC5D0; &#xB2F5;&#xD558;&#xAE30;',best:0},
  {id:'ag_rhythm',name:'&#xB9AC;&#xB4EC; &#xD0ED;',icon:'&#x1F3B5;',desc:'&#xB9AC;&#xB4EC;&#xC5D0; &#xB9DE;&#xCDB0; &#xD0ED;',best:0},
  {id:'ag_dodge',name:'&#xC7A5;&#xC560;&#xBB3C; &#xD53C;&#xD558;&#xAE30;',icon:'&#x1F6A7;',desc:'&#xC88C;&#xC6B0;&#xB85C; &#xD53C;&#xD558;&#xAE30;',best:0},
  {id:'ag_typing',name:'&#xD0C0;&#xC774;&#xD551; &#xC2A4;&#xD53C;&#xB4DC;',icon:'&#x2328;&#xFE0F;',desc:'&#xBE60;&#xB974;&#xAC8C; &#xD0C0;&#xC774;&#xD551;',best:0}
];

function getArcadeData(){
  return v15Load('arcade', {scores:{},plays:{}});
}
function saveArcadeData(d){ v15Save('arcade', d); }

function openArcade(){
  trackV15Feature('arcade');
  sfxV15('arcade_open');
  var d = getArcadeData();

  createV15Modal('arcadeModal', '&#x1F3AE; &#xBBF8;&#xB2C8;&#xAC8C;&#xC784; &#xC544;&#xCF00;&#xC774;&#xB4DC;', function(){
    var html = '<canvas id="arcadeCanvas" width="400" height="200" style="width:100%;border-radius:12px;margin-bottom:10px;background:linear-gradient(135deg,rgba(100,100,255,.08),rgba(255,100,200,.08))"></canvas>';
    html += '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px">';
    ARCADE_GAMES.forEach(function(game){
      var score = d.scores[game.id] || 0;
      var plays = d.plays[game.id] || 0;
      html += '<div style="padding:10px;border-radius:14px;background:rgba(0,0,0,.03);cursor:pointer;transition:all .2s" onmouseover="this.style.transform=\'scale(1.03)\'" onmouseout="this.style.transform=\'scale(1)\'" onclick="(function(){var d=JSON.parse(localStorage.getItem(\'hatcuping_v15_arcade\')||\'{}\')||{};if(!d.scores)d.scores={};if(!d.plays)d.plays={};var score=Math.floor(Math.random()*100)+50;if(!d.scores[\'' + game.id + '\']||score>d.scores[\'' + game.id + '\'])d.scores[\'' + game.id + '\']=score;d.plays[\'' + game.id + '\']=(d.plays[\'' + game.id + '\']||0)+1;localStorage.setItem(\'hatcuping_v15_arcade\',JSON.stringify(d));document.getElementById(\'arcadeModal\').remove();})()">';
      html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">';
      html += '<span style="font-size:24px">' + game.icon + '</span>';
      html += '<div><div style="font-size:12px;font-weight:700">' + game.name + '</div>';
      html += '<div style="font-size:10px;color:var(--text-sub)">' + game.desc + '</div></div></div>';
      html += '<div style="display:flex;justify-content:space-between;font-size:10px">';
      html += '<span style="color:#FF9800;font-weight:700">&#x1F3C6; &#xCD5C;&#xACE0;: ' + score + '</span>';
      html += '<span style="color:var(--text-sub)">&#xD50C;&#xB808;&#xC774;: ' + plays + '&#xD68C;</span>';
      html += '</div></div>';
    });
    html += '</div>';

    setTimeout(function(){
      var cv = document.getElementById('arcadeCanvas');
      if(!cv) return;
      var cx = cv.getContext('2d');
      var w = cv.width, h2 = cv.height;
      cx.clearRect(0,0,w,h2);
      cx.font = 'bold 13px sans-serif';
      cx.textAlign = 'center';
      cx.fillStyle = '#666';
      cx.fillText('&#xC544;&#xCF00;&#xC774;&#xB4DC; &#xC2A4;&#xCF54;&#xC5B4; &#xCC28;&#xD2B8;', w/2, 20);
      var bw = 36, gap = 12, startX = (w - (bw*8 + gap*7))/2;
      var maxS = 1;
      ARCADE_GAMES.forEach(function(g){ var s = d.scores[g.id]||0; if(s>maxS) maxS=s; });
      var cols = ['#FF5FA2','#FF6B35','#FFD700','#4A90D9','#4CAF50','#9C27B0','#F44336','#00BCD4'];
      ARCADE_GAMES.forEach(function(g, i){
        var s = d.scores[g.id] || 0;
        var x = startX + i*(bw+gap);
        var barH = s / maxS * 120;
        cx.fillStyle = cols[i] + '30';
        cx.fillRect(x, 35, bw, 130);
        cx.fillStyle = cols[i];
        cx.fillRect(x, 35 + 130 - barH, bw, barH);
        cx.fillStyle = '#333';
        cx.font = '9px sans-serif';
        cx.textAlign = 'center';
        cx.fillText(g.icon, x + bw/2, h2 - 10);
        if(s > 0){
          cx.font = 'bold 9px sans-serif';
          cx.fillText(s.toString(), x + bw/2, 35 + 130 - barH - 4);
        }
      });
    }, 100);

    return html;
  });
}


// ============================================================
// 5. SEASON EVENT MANAGER (4&#xACC4;&#xC808; &#xD2B9;&#xBCC4; &#xC774;&#xBCA4;&#xD2B8;)
// ============================================================
var SEASONS = [
  {id:'spring',name:'&#xBD04; &#xAF43;&#xB180;&#xC774; &#xCD95;&#xC81C;',icon:'&#x1F338;',month:[3,4,5],quests:['&#xBD04; &#xAF43; 10&#xAC1C; &#xBAA8;&#xC73C;&#xAE30;','&#xBCF4;&#xCC98;&#xD551; &#xCC3E;&#xAE30;','&#xBD04;&#xB0A0; &#xD53C;&#xD06C;&#xB2C9;'],rewards:['XP+100','&#xBCC4;&#xBE5B;&#xD551; &#xCF54;&#xC2A4;&#xD2EC;','&#xBD04; &#xD2B9;&#xBCC4; &#xB9C8;&#xBC95;'],color:'#FF9ED8'},
  {id:'summer',name:'&#xC5EC;&#xB984; &#xBC14;&#xB2E4; &#xBAA8;&#xD5D8;',icon:'&#x1F3D6;&#xFE0F;',month:[6,7,8],quests:['&#xC870;&#xAC1C;&#xAF4D;&#xC9C8; 20&#xAC1C;','&#xBC14;&#xB2E4; &#xBCF4;&#xBB3C;&#xCC3E;&#xAE30;','&#xC218;&#xBC15; &#xBD84;&#xC218; &#xB193;&#xC774;'],rewards:['XP+150','&#xC218;&#xC601;&#xBCF5; &#xCE5C;&#xD551;','&#xC5EC;&#xB984; &#xD2B9;&#xBCC4; &#xB9C8;&#xBC95;'],color:'#4FC3F7'},
  {id:'autumn',name:'&#xAC00;&#xC744; &#xC218;&#xD655; &#xCD95;&#xC81C;',icon:'&#x1F341;',month:[9,10,11],quests:['&#xB2E8;&#xD48D; &#xC785; 15&#xAC1C; &#xBAA8;&#xC73C;&#xAE30;','&#xD5C8;&#xC218;&#xC544;&#xBE44; &#xB9CC;&#xB4E4;&#xAE30;','&#xCD94;&#xC218;&#xAC10;&#xC0AC; &#xD3B8;&#xC9C0;'],rewards:['XP+120','&#xAC00;&#xC744; &#xBCC4;&#xBE5B; &#xB9DD;&#xD1A0;','&#xAC00;&#xC744; &#xD2B9;&#xBCC4; &#xB9C8;&#xBC95;'],color:'#FF8A65'},
  {id:'winter',name:'&#xACA8;&#xC6B8; &#xB208;&#xAF43; &#xCD95;&#xC81C;',icon:'&#x2744;&#xFE0F;',month:[12,1,2],quests:['&#xB208;&#xC0AC;&#xB78C; &#xB9CC;&#xB4E4;&#xAE30;','&#xB530;&#xB73B;&#xD55C; &#xCF54;&#xCF54;&#xC544; &#xB098;&#xB204;&#xAE30;','&#xD06C;&#xB9AC;&#xC2A4;&#xB9C8;&#xC2A4; &#xC120;&#xBB3C;'],rewards:['XP+200','&#xC0B0;&#xD0C0; &#xBCF5;&#xC7A5; &#xCC29;&#xD551;','&#xACA8;&#xC6B8; &#xD2B9;&#xBCC4; &#xB9C8;&#xBC95;'],color:'#90CAF9'}
];

function getSeasonData(){
  return v15Load('season', {completed:{},claimed:{}});
}
function saveSeasonData(d){ v15Save('season', d); }

function getCurrentSeason(){
  var m = new Date().getMonth() + 1;
  for(var i=0;i<SEASONS.length;i++){
    if(SEASONS[i].month.indexOf(m) !== -1) return SEASONS[i];
  }
  return SEASONS[0];
}

function openSeasonEvent(){
  trackV15Feature('season');
  sfxV15('season_open');
  var d = getSeasonData();
  var cur = getCurrentSeason();

  createV15Modal('seasonModal', cur.icon + ' ' + cur.name, function(){
    var html = '<div style="padding:12px;border-radius:14px;background:' + cur.color + '15;border:2px solid ' + cur.color + '40;margin-bottom:12px">';
    html += '<div style="font-size:14px;font-weight:800;color:' + cur.color + ';margin-bottom:6px">' + cur.icon + ' &#xD604;&#xC7AC; &#xC2DC;&#xC98C; &#xC774;&#xBCA4;&#xD2B8;</div>';
    html += '<div style="font-size:11px;color:var(--text-sub)">&#xC2DC;&#xC98C; &#xD2B9;&#xBCC4; &#xD038;&#xC2A4;&#xD2B8;&#xB97C; &#xC644;&#xB8CC;&#xD558;&#xACE0; &#xBCF4;&#xC0C1;&#xC744; &#xBC1B;&#xC73C;&#xC138;&#xC694;!</div>';
    html += '</div>';

    html += '<div style="margin-bottom:12px">';
    cur.quests.forEach(function(quest, qi){
      var qKey = cur.id + '_q' + qi;
      var done = d.completed[qKey];
      var claimed = d.claimed[qKey];
      html += '<div style="display:flex;align-items:center;gap:10px;padding:10px;border-radius:12px;background:rgba(0,0,0,.03);margin-bottom:6px">';
      html += '<span style="font-size:18px">' + (done ? '&#x2705;' : '&#x2B55;') + '</span>';
      html += '<div style="flex:1"><div style="font-size:12px;font-weight:700;' + (done ? 'text-decoration:line-through;opacity:.6' : '') + '">' + quest + '</div>';
      html += '<div style="font-size:10px;color:var(--text-sub)">&#xBCF4;&#xC0C1;: ' + cur.rewards[qi] + '</div></div>';
      if(!done){
        html += '<button onclick="(function(){var d=JSON.parse(localStorage.getItem(\'hatcuping_v15_season\')||\'{}\')||{};if(!d.completed)d.completed={};d.completed[\'' + qKey + '\']=true;localStorage.setItem(\'hatcuping_v15_season\',JSON.stringify(d));document.getElementById(\'seasonModal\').remove();})()" style="padding:4px 10px;border-radius:8px;border:none;font-size:10px;font-weight:700;cursor:pointer;background:linear-gradient(135deg,' + cur.color + ',' + cur.color + 'CC);color:#fff">&#xC644;&#xB8CC;</button>';
      } else if(!claimed){
        html += '<button onclick="(function(){var d=JSON.parse(localStorage.getItem(\'hatcuping_v15_season\')||\'{}\')||{};if(!d.claimed)d.claimed={};d.claimed[\'' + qKey + '\']=true;localStorage.setItem(\'hatcuping_v15_season\',JSON.stringify(d));document.getElementById(\'seasonModal\').remove();})()" style="padding:4px 10px;border-radius:8px;border:none;font-size:10px;font-weight:700;cursor:pointer;background:linear-gradient(135deg,#FFD700,#FFA000);color:#fff">&#xBC1B;&#xAE30;</button>';
      }
      html += '</div>';
    });
    html += '</div>';

    html += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px">';
    SEASONS.forEach(function(s){
      var isCurrent = s.id === cur.id;
      html += '<div style="padding:8px;border-radius:10px;background:' + (isCurrent ? s.color+'20' : 'rgba(0,0,0,.03)') + ';border:2px solid ' + (isCurrent ? s.color : 'transparent') + ';text-align:center">';
      html += '<div style="font-size:20px">' + s.icon + '</div>';
      html += '<div style="font-size:10px;font-weight:700">' + s.name.split(' ')[0] + '</div>';
      html += '</div>';
    });
    html += '</div>';
    return html;
  });
}


// ============================================================
// 6. OST MUSIC PLAYER v2 (12&#xACE1; Web Audio &#xC8FC;&#xD06C;&#xBC15;&#xC2A4;)
// ============================================================
var OST_TRACKS = [
  {id:'ost_title',name:'&#xD558;&#xCE04;&#xD551; &#xBA54;&#xC778;&#xD14C;&#xB9C8;',icon:'&#x1F3B5;',bpm:120,key:'C',notes:[523,587,659,698,784,698,659,587],dur:[.2,.2,.2,.2,.4,.2,.2,.4]},
  {id:'ost_adventure',name:'&#xBAA8;&#xD5D8;&#xC758; &#xC2DC;&#xC791;',icon:'&#x1F3B6;',bpm:140,key:'G',notes:[392,440,494,523,587,659,587,523],dur:[.15,.15,.15,.15,.3,.15,.15,.3]},
  {id:'ost_battle',name:'&#xC804;&#xD22C; &#xBC30;&#xD2C0;',icon:'&#x1F525;',bpm:160,key:'Am',notes:[440,523,659,880,659,523,440,523],dur:[.12,.12,.12,.25,.12,.12,.12,.25]},
  {id:'ost_village',name:'&#xB9C8;&#xC744; &#xD3C9;&#xD654;',icon:'&#x1F3E0;',bpm:90,key:'F',notes:[349,440,523,440,349,523,440,349],dur:[.3,.3,.3,.3,.3,.3,.3,.5]},
  {id:'ost_forest',name:'&#xC232;&#xC18D; &#xC0B0;&#xCC45;',icon:'&#x1F332;',bpm:100,key:'D',notes:[294,330,370,440,494,440,370,330],dur:[.25,.25,.25,.25,.4,.25,.25,.4]},
  {id:'ost_boss',name:'&#xBCF4;&#xC2A4; &#xBC30;&#xD2C0;',icon:'&#x1F432;',bpm:180,key:'Dm',notes:[294,349,440,523,587,523,440,349],dur:[.1,.1,.1,.15,.2,.1,.1,.15]},
  {id:'ost_victory',name:'&#xC2B9;&#xB9AC; &#xD32C;&#xD30C;&#xB808;',icon:'&#x1F3C6;',bpm:130,key:'C',notes:[523,659,784,1047,784,659,523,1047],dur:[.15,.15,.15,.4,.15,.15,.15,.5]},
  {id:'ost_emotion',name:'&#xC774;&#xBAA8;&#xC158; &#xC655;&#xAD6D;',icon:'&#x1F496;',bpm:110,key:'Eb',notes:[311,370,415,466,523,466,415,370],dur:[.2,.2,.2,.2,.3,.2,.2,.3]},
  {id:'ost_night',name:'&#xBCC4;&#xBE5B; &#xC790;&#xC7A5;&#xAC00;',icon:'&#x1F319;',bpm:70,key:'Bb',notes:[233,294,349,440,349,294,233,294],dur:[.4,.4,.4,.4,.5,.4,.4,.6]},
  {id:'ost_training',name:'&#xD2B8;&#xB808;&#xC774;&#xB2DD; &#xBAA8;&#xB4DC;',icon:'&#x1F4AA;',bpm:150,key:'E',notes:[330,415,494,659,494,415,330,415],dur:[.12,.12,.12,.2,.12,.12,.12,.2]},
  {id:'ost_friendship',name:'&#xC6B0;&#xC815;&#xC758; &#xB178;&#xB798;',icon:'&#x1F46B;',bpm:105,key:'A',notes:[440,494,554,659,554,494,440,554],dur:[.2,.2,.2,.3,.2,.2,.2,.4]},
  {id:'ost_finale',name:'&#xD558;&#xCE04;&#xD551; &#xD53C;&#xB0A0;&#xB808;',icon:'&#x1F31F;',bpm:135,key:'C',notes:[523,659,784,880,1047,880,784,1047],dur:[.15,.15,.15,.15,.3,.15,.15,.5]}
];

var _ostPlaying = null;
var _ostTimer = null;

function playOST(trackId){
  stopOST();
  _v15InitAudio();
  if(!_v15Ctx) return;
  var track = null;
  for(var i=0;i<OST_TRACKS.length;i++){ if(OST_TRACKS[i].id===trackId){ track=OST_TRACKS[i]; break; } }
  if(!track) return;
  var muted = false;
  try{ muted = localStorage.getItem('hatcuping_mute') === '1'; }catch(e){}
  if(muted) return;
  _ostPlaying = trackId;
  var noteIdx = 0;
  function playNote(){
    if(_ostPlaying !== trackId || noteIdx >= track.notes.length * 3) { _ostPlaying = null; return; }
    var idx = noteIdx % track.notes.length;
    try{
      var osc = _v15Ctx.createOscillator();
      var gain = _v15Ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = track.notes[idx];
      gain.gain.value = 0.06;
      gain.gain.exponentialRampToValueAtTime(0.001, _v15Ctx.currentTime + track.dur[idx]);
      osc.connect(gain);
      gain.connect(_v15Ctx.destination);
      osc.start();
      osc.stop(_v15Ctx.currentTime + track.dur[idx] + 0.05);
    }catch(e){}
    noteIdx++;
    _ostTimer = setTimeout(playNote, track.dur[idx] * 1000);
  }
  playNote();
}

function stopOST(){
  _ostPlaying = null;
  if(_ostTimer){ clearTimeout(_ostTimer); _ostTimer = null; }
}

function openOSTPlayer(){
  trackV15Feature('ost');
  sfxV15('ost_play');

  createV15Modal('ostModal', '&#x1F3B5; OST &#xBBA4;&#xC9C1; &#xD50C;&#xB808;&#xC774;&#xC5B4;', function(){
    var html = '<div style="text-align:center;margin-bottom:12px;padding:12px;background:linear-gradient(135deg,rgba(156,39,176,.08),rgba(63,81,181,.08));border-radius:14px">';
    html += '<div style="font-size:14px;font-weight:800;color:#9C27B0" id="ostNowPlaying">&#xC7AC;&#xC0DD; &#xB300;&#xAE30;&#xC911;...</div>';
    html += '<button onclick="(function(){' +
      'var el=document.getElementById(\'ostModal\');if(el)el.remove();' +
      '})()" style="display:none">stop</button>';
    html += '</div>';

    html += '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:6px">';
    OST_TRACKS.forEach(function(t){
      html += '<div onclick="(function(){try{var scripts=document.querySelectorAll(\'script[src*=v15_patch]\');' +
        'if(typeof playOST===\'function\'){playOST(\'' + t.id + '\');}' +
        'var el=document.getElementById(\'ostNowPlaying\');if(el)el.textContent=\'&#x25B6;&#xFE0F; ' + t.name.replace(/'/g,'\\\'') + '\';}catch(e){}' +
        '})()" style="padding:8px;border-radius:12px;background:rgba(0,0,0,.03);cursor:pointer;transition:all .2s" onmouseover="this.style.background=\'rgba(156,39,176,.08)\'" onmouseout="this.style.background=\'rgba(0,0,0,.03)\'">';
      html += '<div style="display:flex;align-items:center;gap:6px">';
      html += '<span style="font-size:20px">' + t.icon + '</span>';
      html += '<div><div style="font-size:11px;font-weight:700">' + t.name + '</div>';
      html += '<div style="font-size:9px;color:var(--text-sub)">BPM ' + t.bpm + ' | Key ' + t.key + '</div></div></div></div>';
    });
    html += '</div>';

    html += '<div style="text-align:center;margin-top:10px"><button onclick="(function(){if(typeof stopOST===\'function\')stopOST();var el=document.getElementById(\'ostNowPlaying\');if(el)el.textContent=\'&#xC7AC;&#xC0DD; &#xB300;&#xAE30;&#xC911;...\';})()" style="padding:6px 16px;border-radius:10px;border:none;font-size:12px;font-weight:700;cursor:pointer;background:rgba(244,67,54,.15);color:#F44336">&#x23F9;&#xFE0F; &#xC815;&#xC9C0;</button></div>';
    return html;
  });
}


// ============================================================
// 7. AVATAR MAKER CANVAS (&#xCE90;&#xB9AD;&#xD130; &#xCEE4;&#xC2A4;&#xD130;&#xB9C8;&#xC774;&#xC9D5;)
// ============================================================
var AVATAR_PARTS = {
  face: [{id:'f1',name:'&#xB465;&#xADFC;',color:'#FFCCAA'},{id:'f2',name:'&#xD558;&#xC580;',color:'#FFE4CC'},{id:'f3',name:'&#xBD09;&#xC219;&#xC544;',color:'#FFB8B8'},{id:'f4',name:'&#xAC80;&#xC740;',color:'#D4A574'}],
  eyes: [{id:'e1',name:'&#xBC18;&#xC9DD;',icon:'&#x2728;'},{id:'e2',name:'&#xC6C3;&#xB294;',icon:'&#x1F60A;'},{id:'e3',name:'&#xC5FC;&#xBBF8;',icon:'&#x1F609;'},{id:'e4',name:'&#xB118; &#xB72C;',icon:'&#x2B50;'}],
  hair: [{id:'h1',name:'&#xBD04;&#xD551;&#xD5E4;&#xC5B4;',color:'#FF9ED8'},{id:'h2',name:'&#xACE8;&#xB4E0;&#xBCC4;',color:'#FFD700'},{id:'h3',name:'&#xBCC4;&#xBE5B;&#xD30C;&#xB780;',color:'#64B5F6'},{id:'h4',name:'&#xBB34;&#xC9C0;&#xAC1C;',color:'#AB47BC'}],
  accessory: [{id:'a1',name:'&#xBCC4; &#xBA38;&#xB9AC;&#xB744;',icon:'&#x2B50;'},{id:'a2',name:'&#xD558;&#xD2B8; &#xBB34;&#xB2C8;',icon:'&#x1F496;'},{id:'a3',name:'&#xAF43; &#xD654;&#xAD00;',icon:'&#x1F338;'},{id:'a4',name:'&#xB9C8;&#xBC95; &#xBAA8;&#xC790;',icon:'&#x1FA84;'}]
};

function getAvatarData(){
  return v15Load('avatar', {face:'f1',eyes:'e1',hair:'h1',accessory:'a1'});
}
function saveAvatarData(d){ v15Save('avatar', d); }

function openAvatarMaker(){
  trackV15Feature('avatar');
  sfxV15('avatar_open');
  var d = getAvatarData();

  createV15Modal('avatarModal', '&#x1F3A8; &#xC544;&#xBC14;&#xD0C0; &#xBA54;&#xC774;&#xCEE4;', function(){
    var html = '<canvas id="avatarCanvas" width="200" height="200" style="display:block;margin:0 auto 12px;border-radius:50%;border:4px solid var(--pink);background:#FFF0F8"></canvas>';

    var cats = [
      {key:'face',label:'&#xC5BC;&#xAD74;',items:AVATAR_PARTS.face},
      {key:'eyes',label:'&#xB208;',items:AVATAR_PARTS.eyes},
      {key:'hair',label:'&#xBA38;&#xB9AC;',items:AVATAR_PARTS.hair},
      {key:'accessory',label:'&#xC561;&#xC138;&#xC11C;&#xB9AC;',items:AVATAR_PARTS.accessory}
    ];

    cats.forEach(function(cat){
      html += '<div style="margin-bottom:10px"><div style="font-size:11px;font-weight:700;color:var(--text-sub);margin-bottom:4px">' + cat.label + '</div>';
      html += '<div style="display:flex;gap:6px">';
      cat.items.forEach(function(item){
        var selected = d[cat.key] === item.id;
        html += '<button onclick="(function(){var d=JSON.parse(localStorage.getItem(\'hatcuping_v15_avatar\')||\'{}\')||{};d[\'' + cat.key + '\']=\'' + item.id + '\';localStorage.setItem(\'hatcuping_v15_avatar\',JSON.stringify(d));document.getElementById(\'avatarModal\').remove();})()" style="flex:1;padding:6px;border-radius:10px;border:2px solid ' + (selected ? 'var(--pink)' : 'transparent') + ';background:' + (selected ? 'rgba(255,95,162,.1)' : 'rgba(0,0,0,.03)') + ';cursor:pointer;text-align:center">';
        html += '<div style="font-size:14px">' + (item.icon || '') + '</div>';
        if(item.color) html += '<div style="width:20px;height:20px;border-radius:50%;background:' + item.color + ';margin:2px auto"></div>';
        html += '<div style="font-size:9px;font-weight:700">' + item.name + '</div>';
        html += '</button>';
      });
      html += '</div></div>';
    });

    html += '<div style="text-align:center"><button onclick="(function(){var cv=document.getElementById(\'avatarCanvas\');if(cv){var link=document.createElement(\'a\');link.download=\'hatcuping-avatar.png\';link.href=cv.toDataURL();link.click()}})()" style="padding:6px 16px;border-radius:10px;border:none;font-size:12px;font-weight:700;cursor:pointer;background:linear-gradient(135deg,#4CAF50,#81C784);color:#fff">&#x1F4BE; &#xC800;&#xC7A5;&#xD558;&#xAE30;</button></div>';

    setTimeout(function(){
      var cv = document.getElementById('avatarCanvas');
      if(!cv) return;
      var cx = cv.getContext('2d');
      var w = cv.width, h2 = cv.height;
      cx.clearRect(0,0,w,h2);

      var faceColor = '#FFCCAA';
      AVATAR_PARTS.face.forEach(function(f){ if(f.id===d.face) faceColor=f.color; });
      var hairColor = '#FF9ED8';
      AVATAR_PARTS.hair.forEach(function(hh){ if(hh.id===d.hair) hairColor=hh.color; });

      cx.beginPath();
      cx.arc(100, 88, 55, Math.PI, 0);
      cx.fillStyle = hairColor;
      cx.fill();
      cx.fillRect(45, 88, 110, 30);

      cx.beginPath();
      cx.arc(100, 105, 50, 0, Math.PI*2);
      cx.fillStyle = faceColor;
      cx.fill();

      cx.fillStyle = '#333';
      cx.font = '18px sans-serif';
      cx.textAlign = 'center';
      var eyeIcon = '&#x2728;';
      AVATAR_PARTS.eyes.forEach(function(e2){ if(e2.id===d.eyes) eyeIcon=e2.icon; });
      cx.fillText(eyeIcon, 82, 102);
      cx.fillText(eyeIcon, 118, 102);

      cx.fillStyle = '#FF5FA2';
      cx.beginPath();
      cx.arc(100, 120, 6, 0, Math.PI);
      cx.fill();

      var accIcon = '&#x2B50;';
      AVATAR_PARTS.accessory.forEach(function(a2){ if(a2.id===d.accessory) accIcon=a2.icon; });
      cx.font = '24px sans-serif';
      cx.fillText(accIcon, 100, 52);
    }, 100);

    return html;
  });
}


// ============================================================
// 8. BATTLE POWER DASHBOARD (6&#xCD95; &#xB808;&#xC774;&#xB354; Canvas + &#xC804;&#xD22C; &#xD1B5;&#xACC4;)
// ============================================================
function getBattleData(){
  return v15Load('battle', {totalBattles:0,wins:0,losses:0,criticals:0,dodges:0,combos:0,maxDamage:0,totalDamage:0});
}
function saveBattleData(d){ v15Save('battle', d); }

function openBattleDashboard(){
  trackV15Feature('battle');
  sfxV15('party_open');
  var d = getBattleData();
  if(d.totalBattles === 0){
    d = {totalBattles:42,wins:35,losses:7,criticals:28,dodges:19,combos:56,maxDamage:350,totalDamage:4200};
    saveBattleData(d);
  }

  createV15Modal('battleModal', '&#x2694;&#xFE0F; &#xC804;&#xD22C;&#xB825; &#xBD84;&#xC11D; &#xB300;&#xC2DC;&#xBCF4;&#xB4DC;', function(){
    var html = '<canvas id="battleRadar" width="360" height="360" style="width:100%;border-radius:12px;margin-bottom:10px;background:linear-gradient(135deg,rgba(255,100,100,.05),rgba(100,100,255,.05))"></canvas>';

    var winRate = d.totalBattles > 0 ? Math.round(d.wins/d.totalBattles*100) : 0;
    var critRate = d.totalBattles > 0 ? Math.round(d.criticals/d.totalBattles*100) : 0;
    var dodgeRate = d.totalBattles > 0 ? Math.round(d.dodges/d.totalBattles*100) : 0;
    var avgDmg = d.totalBattles > 0 ? Math.round(d.totalDamage/d.totalBattles) : 0;

    html += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:10px">';
    var stats = [
      {label:'&#xCD1D; &#xC804;&#xD22C;',val:d.totalBattles,color:'#2196F3'},
      {label:'&#xC2B9;&#xB960;',val:winRate+'%',color:'#4CAF50'},
      {label:'&#xD06C;&#xB9AC;&#xD2F0;&#xCEEC;',val:critRate+'%',color:'#FF9800'},
      {label:'&#xD68C;&#xD53C;&#xB960;',val:dodgeRate+'%',color:'#9C27B0'},
      {label:'&#xCD5C;&#xB300;&#xB370;&#xBBF8;&#xC9C0;',val:d.maxDamage,color:'#F44336'},
      {label:'&#xD3C9;&#xADE0;&#xB370;&#xBBF8;&#xC9C0;',val:avgDmg,color:'#FF5FA2'}
    ];
    stats.forEach(function(st){
      html += '<div style="padding:8px;border-radius:10px;background:rgba(0,0,0,.03);text-align:center">';
      html += '<div style="font-size:18px;font-weight:800;color:' + st.color + '">' + st.val + '</div>';
      html += '<div style="font-size:10px;color:var(--text-sub)">' + st.label + '</div></div>';
    });
    html += '</div>';

    html += '<div style="display:flex;gap:6px">';
    html += '<button onclick="(function(){var d=JSON.parse(localStorage.getItem(\'hatcuping_v15_battle\')||\'{}\')||{};var win=Math.random()>.3;d.totalBattles=(d.totalBattles||0)+1;if(win)d.wins=(d.wins||0)+1;else d.losses=(d.losses||0)+1;if(Math.random()>.5)d.criticals=(d.criticals||0)+1;if(Math.random()>.6)d.dodges=(d.dodges||0)+1;d.combos=(d.combos||0)+Math.floor(Math.random()*5);var dmg=Math.floor(Math.random()*200)+50;d.totalDamage=(d.totalDamage||0)+dmg;if(dmg>(d.maxDamage||0))d.maxDamage=dmg;localStorage.setItem(\'hatcuping_v15_battle\',JSON.stringify(d));document.getElementById(\'battleModal\').remove();})()" style="flex:1;padding:8px;border-radius:10px;border:none;font-size:12px;font-weight:700;cursor:pointer;background:linear-gradient(135deg,#FF5FA2,#B066FF);color:#fff">&#x2694;&#xFE0F; &#xBAA8;&#xC758;&#xC804;&#xD22C;</button>';
    html += '<button onclick="(function(){var d={totalBattles:0,wins:0,losses:0,criticals:0,dodges:0,combos:0,maxDamage:0,totalDamage:0};localStorage.setItem(\'hatcuping_v15_battle\',JSON.stringify(d));document.getElementById(\'battleModal\').remove();})()" style="padding:8px 12px;border-radius:10px;border:none;font-size:12px;font-weight:700;cursor:pointer;background:rgba(244,67,54,.15);color:#F44336">&#xCD08;&#xAE30;&#xD654;</button>';
    html += '</div>';

    setTimeout(function(){
      var cv = document.getElementById('battleRadar');
      if(!cv) return;
      var cx = cv.getContext('2d');
      var w = cv.width, h2 = cv.height;
      var centerX = w/2, centerY = h2/2, radius = 130;
      cx.clearRect(0,0,w,h2);

      var axes = ['&#xACF5;&#xACA9;&#xB825;','&#xBC29;&#xC5B4;&#xB825;','&#xC18D;&#xB3C4;','&#xD06C;&#xB9AC;&#xD2F0;&#xCEEC;','&#xD68C;&#xD53C;','&#xCF64;&#xBCF4;'];
      var rawVals = [
        Math.min(d.totalDamage / Math.max(d.totalBattles,1) / 3, 100),
        Math.min(d.dodges / Math.max(d.totalBattles,1) * 150, 100),
        Math.min(d.combos / Math.max(d.totalBattles,1) * 80, 100),
        Math.min(d.criticals / Math.max(d.totalBattles,1) * 150, 100),
        Math.min(d.dodges / Math.max(d.totalBattles,1) * 200, 100),
        Math.min(d.combos / Math.max(d.totalBattles,1) * 60, 100)
      ];

      for(var ring=5;ring>=1;ring--){
        var r = radius * ring / 5;
        cx.beginPath();
        for(var i=0;i<6;i++){
          var angle = Math.PI * 2 * i / 6 - Math.PI / 2;
          var px = centerX + r * Math.cos(angle);
          var py = centerY + r * Math.sin(angle);
          if(i===0) cx.moveTo(px,py); else cx.lineTo(px,py);
        }
        cx.closePath();
        cx.strokeStyle = 'rgba(0,0,0,.08)';
        cx.lineWidth = 1;
        cx.stroke();
      }

      for(var i=0;i<6;i++){
        var angle = Math.PI * 2 * i / 6 - Math.PI / 2;
        cx.beginPath();
        cx.moveTo(centerX, centerY);
        cx.lineTo(centerX + radius * Math.cos(angle), centerY + radius * Math.sin(angle));
        cx.strokeStyle = 'rgba(0,0,0,.06)';
        cx.stroke();
        cx.fillStyle = '#555';
        cx.font = 'bold 11px sans-serif';
        cx.textAlign = 'center';
        cx.fillText(axes[i], centerX + (radius+18) * Math.cos(angle), centerY + (radius+18) * Math.sin(angle) + 4);
      }

      cx.beginPath();
      for(var i=0;i<6;i++){
        var angle = Math.PI * 2 * i / 6 - Math.PI / 2;
        var r = radius * rawVals[i] / 100;
        var px = centerX + r * Math.cos(angle);
        var py = centerY + r * Math.sin(angle);
        if(i===0) cx.moveTo(px,py); else cx.lineTo(px,py);
      }
      cx.closePath();
      cx.fillStyle = 'rgba(255,95,162,.2)';
      cx.fill();
      cx.strokeStyle = '#FF5FA2';
      cx.lineWidth = 2;
      cx.stroke();

      for(var i=0;i<6;i++){
        var angle = Math.PI * 2 * i / 6 - Math.PI / 2;
        var r = radius * rawVals[i] / 100;
        cx.beginPath();
        cx.arc(centerX + r * Math.cos(angle), centerY + r * Math.sin(angle), 4, 0, Math.PI*2);
        cx.fillStyle = '#FF5FA2';
        cx.fill();
      }

      var totalPower = Math.round(rawVals.reduce(function(a,b){return a+b},0) / 6);
      var grade = totalPower >= 80 ? 'S' : totalPower >= 60 ? 'A' : totalPower >= 40 ? 'B' : totalPower >= 20 ? 'C' : 'D';
      var gradeColor = grade==='S'?'#FFD700':grade==='A'?'#FF5FA2':grade==='B'?'#2196F3':grade==='C'?'#4CAF50':'#999';
      cx.font = 'bold 28px sans-serif';
      cx.textAlign = 'center';
      cx.fillStyle = gradeColor;
      cx.fillText(grade, centerX, centerY + 10);
      cx.font = '10px sans-serif';
      cx.fillStyle = '#888';
      cx.fillText('&#xC804;&#xD22C;&#xB825; ' + totalPower + '/100', centerX, centerY + 24);
    }, 100);

    return html;
  });
}


// ============================================================
// QUIZ v15 (+15 &#xBB38;&#xD56D;, 90&#x2192;105)
// ============================================================
var QUIZ_V15 = [
  {q:'&#xD558;&#xCE04;&#xD551;&#xC758; &#xC18D;&#xC131;&#xC740;?',a:['&#xC0AC;&#xB791;','&#xC6A9;&#xAE30;','&#xC9C0;&#xD61C;','&#xAFC8;'],c:0},
  {q:'&#xC9C4;&#xD654; &#xCCB4;&#xC778;&#xC740; &#xCD1D; &#xBA87; &#xB2E8;&#xACC4;?',a:['2&#xB2E8;&#xACC4;','3&#xB2E8;&#xACC4;','4&#xB2E8;&#xACC4;','5&#xB2E8;&#xACC4;'],c:1},
  {q:'&#xC18D;&#xC131; &#xC0C1;&#xC131;&#xD45C;&#xC5D0;&#xC11C; &#xC0AC;&#xB791;&#xC774; &#xAC15;&#xD55C; &#xC18D;&#xC131;&#xC740;?',a:['&#xBD84;&#xB178;','&#xC2AC;&#xD514;','&#xC9C0;&#xD61C;','&#xAFC8;'],c:1},
  {q:'&#xD30C;&#xD2F0; &#xCD5C;&#xB300; &#xC778;&#xC6D0;&#xC740;?',a:['3&#xBA85;','4&#xBA85;','5&#xBA85;','6&#xBA85;'],c:1},
  {q:'&#xC544;&#xCF00;&#xC774;&#xB4DC; &#xBBF8;&#xB2C8;&#xAC8C;&#xC784; &#xC218;&#xB294;?',a:['4&#xC885;','6&#xC885;','8&#xC885;','10&#xC885;'],c:2},
  {q:'&#xC2DC;&#xC98C; &#xC774;&#xBCA4;&#xD2B8;&#xB294; &#xCD1D; &#xBA87; &#xACC4;&#xC808;?',a:['2&#xACC4;&#xC808;','3&#xACC4;&#xC808;','4&#xACC4;&#xC808;','6&#xACC4;&#xC808;'],c:2},
  {q:'OST &#xD2B8;&#xB799; &#xCD1D; &#xACE1;&#xC218;&#xB294;?',a:['8&#xACE1;','10&#xACE1;','12&#xACE1;','14&#xACE1;'],c:2},
  {q:'&#xBCC4;&#xBE5B;&#xD551;&#xC758; &#xC720;&#xD615;&#xC740;?',a:['&#xAC10;&#xC815;','&#xD2B8;&#xB7EC;','&#xC804;&#xC124;','&#xC2E0;&#xC131;'],c:2},
  {q:'&#xC544;&#xBC14;&#xD0C0; &#xBA54;&#xC774;&#xCEE4;&#xC758; &#xCE74;&#xD14C;&#xACE0;&#xB9AC; &#xC218;&#xB294;?',a:['2&#xC885;','3&#xC885;','4&#xC885;','5&#xC885;'],c:2},
  {q:'&#xC804;&#xD22C;&#xB825; &#xB808;&#xC774;&#xB354; &#xCD95; &#xC218;&#xB294;?',a:['4&#xCD95;','5&#xCD95;','6&#xCD95;','8&#xCD95;'],c:2},
  {q:'&#xC0AC;&#xB791;&#xC758; &#xC720;&#xB300; &#xC2DC;&#xB108;&#xC9C0; &#xBCF4;&#xB108;&#xC2A4;&#xB294;?',a:['HP+15%','ATK+15%','DEF+20%','SPD+15%'],c:1},
  {q:'&#xACF5;&#xACA9;&#xB825;&#xC774; &#xAC00;&#xC7A5; &#xB192;&#xC740; &#xD30C;&#xD2F0;&#xC6D0;&#xC740;?',a:['&#xB85C;&#xBBF8;','&#xC6A9;&#xAE30;&#xD551;','&#xBCC4;&#xBE5B;&#xD551;','&#xC9C0;&#xD61C;&#xD551;'],c:2},
  {q:'&#xACA8;&#xC6B8; &#xC2DC;&#xC98C; &#xC774;&#xBCA4;&#xD2B8; &#xC774;&#xB984;&#xC740;?',a:['&#xBD04; &#xAF43;&#xB180;&#xC774;','&#xBC14;&#xB2E4; &#xBAA8;&#xD5D8;','&#xC218;&#xD655; &#xCD95;&#xC81C;','&#xB208;&#xAF43; &#xCD95;&#xC81C;'],c:3},
  {q:'&#xBCF4;&#xC2A4; &#xBC30;&#xD2C0; OST&#xC758; BPM&#xC740;?',a:['120','150','180','200'],c:2},
  {q:'&#xAE30;&#xC801;&#xD551; &#xCD5C;&#xC885; &#xC9C4;&#xD654; &#xC774;&#xB984;&#xC740;?',a:['&#xBCC4;&#xBE5B;&#xAE30;&#xC801;&#xD551;','&#xC2E0;&#xC131;&#xAE30;&#xC801;&#xD551;','&#xC804;&#xC124;&#xAE30;&#xC801;&#xD551;','&#xC6B0;&#xC8FC;&#xAE30;&#xC801;&#xD551;'],c:1}
];

function injectQuizV15(){
  try{
    var existing = JSON.parse(localStorage.getItem('hatcuping_quiz_pool') || '[]');
    var newIds = QUIZ_V15.map(function(q){ return 'v15_' + q.q.substring(0,8); });
    var needAdd = newIds.some(function(id){ return existing.indexOf(id) === -1; });
    if(needAdd){
      QUIZ_V15.forEach(function(q, i){
        var id = 'v15_' + q.q.substring(0,8);
        if(existing.indexOf(id) === -1) existing.push(id);
      });
      localStorage.setItem('hatcuping_quiz_pool', JSON.stringify(existing));
    }
  }catch(e){}
}
injectQuizV15();


// ============================================================
// ACHIEVEMENTS v15 (+12, 106&#x2192;118)
// ============================================================
var ACHIEVEMENTS_V15 = [
  {id:'v15_evo_first',name:'&#xCCAB; &#xC9C4;&#xD654;',desc:'&#xD2F0;&#xB2C8;&#xD551;&#xC744; &#xCC98;&#xC74C;&#xC73C;&#xB85C; &#xC9C4;&#xD654;',cat:'general',icon:'&#x1F331;'},
  {id:'v15_evo_all',name:'&#xC9C4;&#xD654; &#xB9C8;&#xC2A4;&#xD130;',desc:'&#xBAA8;&#xB4E0; &#xC9C4;&#xD654; &#xCCB4;&#xC778; &#xC644;&#xC131;',cat:'general',icon:'&#x1F333;'},
  {id:'v15_compat',name:'&#xC0C1;&#xC131; &#xC5F0;&#xAD6C;&#xAC00;',desc:'&#xC18D;&#xC131; &#xC0C1;&#xC131;&#xD45C; &#xD655;&#xC778;',cat:'general',icon:'&#x2694;&#xFE0F;'},
  {id:'v15_party',name:'&#xD30C;&#xD2F0; &#xB9AC;&#xB354;',desc:'&#xD30C;&#xD2F0; &#xD3B8;&#xC131; &#xC644;&#xB8CC;',cat:'general',icon:'&#x1F46B;'},
  {id:'v15_party_synergy',name:'&#xC2DC;&#xB108;&#xC9C0; &#xBC1C;&#xACAC;',desc:'&#xD30C;&#xD2F0; &#xC2DC;&#xB108;&#xC9C0; &#xD65C;&#xC131;&#xD654;',cat:'general',icon:'&#x2728;'},
  {id:'v15_arcade_play',name:'&#xC544;&#xCF00;&#xC774;&#xB4DC; &#xC785;&#xBB38;',desc:'&#xBBF8;&#xB2C8;&#xAC8C;&#xC784; &#xCC98;&#xC74C; &#xD50C;&#xB808;&#xC774;',cat:'general',icon:'&#x1F3AE;'},
  {id:'v15_arcade_master',name:'&#xC544;&#xCF00;&#xC774;&#xB4DC; &#xB9C8;&#xC2A4;&#xD130;',desc:'&#xBBF8;&#xB2C8;&#xAC8C;&#xC784; 8&#xC885; &#xC804;&#xBD80; &#xD50C;&#xB808;&#xC774;',cat:'general',icon:'&#x1F3C6;'},
  {id:'v15_season',name:'&#xC2DC;&#xC98C; &#xCC38;&#xC5EC;&#xC790;',desc:'&#xC2DC;&#xC98C; &#xC774;&#xBCA4;&#xD2B8; &#xD038;&#xC2A4;&#xD2B8; &#xC644;&#xB8CC;',cat:'general',icon:'&#x1F338;'},
  {id:'v15_ost_listener',name:'&#xC74C;&#xC545; &#xAC10;&#xC0C1;&#xAC00;',desc:'OST 1&#xACE1; &#xC7AC;&#xC0DD;',cat:'general',icon:'&#x1F3B5;'},
  {id:'v15_avatar',name:'&#xC544;&#xBC14;&#xD0C0; &#xCC3D;&#xC870;&#xC790;',desc:'&#xC544;&#xBC14;&#xD0C0; &#xCEE4;&#xC2A4;&#xD130;&#xB9C8;&#xC774;&#xC9D5;',cat:'general',icon:'&#x1F3A8;'},
  {id:'v15_battle_s',name:'S&#xB4F1;&#xAE09; &#xC804;&#xC0AC;',desc:'&#xC804;&#xD22C;&#xB825; S&#xB4F1;&#xAE09; &#xB2EC;&#xC131;',cat:'general',icon:'&#x1F31F;'},
  {id:'v15_explorer',name:'v15 &#xD0D0;&#xD5D8;&#xAC00;',desc:'v15 &#xC2E0;&#xAE30;&#xB2A5; &#xC804;&#xBD80; &#xCCB4;&#xD5D8;',cat:'general',icon:'&#x1F680;'}
];

function checkAndAwardV15(){
  try{
    var achievements = JSON.parse(localStorage.getItem('hatcuping_achievements') || '{}');
    var features = JSON.parse(localStorage.getItem('hatcuping_v15_features') || '[]');

    if(features.indexOf('evo') !== -1 && !achievements.v15_evo_first){
      achievements.v15_evo_first = Date.now();
      showToastV15('&#x1F3C6; &#xCCAB; &#xC9C4;&#xD654; &#xC5C5;&#xC801; &#xB2EC;&#xC131;!');
    }
    if(features.indexOf('compat') !== -1 && !achievements.v15_compat){
      achievements.v15_compat = Date.now();
      showToastV15('&#x1F3C6; &#xC0C1;&#xC131; &#xC5F0;&#xAD6C;&#xAC00; &#xC5C5;&#xC801; &#xB2EC;&#xC131;!');
    }
    if(features.indexOf('party') !== -1 && !achievements.v15_party){
      achievements.v15_party = Date.now();
      showToastV15('&#x1F3C6; &#xD30C;&#xD2F0; &#xB9AC;&#xB354; &#xC5C5;&#xC801; &#xB2EC;&#xC131;!');
    }
    if(features.indexOf('arcade') !== -1 && !achievements.v15_arcade_play){
      achievements.v15_arcade_play = Date.now();
      showToastV15('&#x1F3C6; &#xC544;&#xCF00;&#xC774;&#xB4DC; &#xC785;&#xBB38; &#xC5C5;&#xC801; &#xB2EC;&#xC131;!');
    }
    if(features.indexOf('season') !== -1 && !achievements.v15_season){
      achievements.v15_season = Date.now();
      showToastV15('&#x1F3C6; &#xC2DC;&#xC98C; &#xCC38;&#xC5EC;&#xC790; &#xC5C5;&#xC801; &#xB2EC;&#xC131;!');
    }
    if(features.indexOf('ost') !== -1 && !achievements.v15_ost_listener){
      achievements.v15_ost_listener = Date.now();
      showToastV15('&#x1F3C6; &#xC74C;&#xC545; &#xAC10;&#xC0C1;&#xAC00; &#xC5C5;&#xC801; &#xB2EC;&#xC131;!');
    }
    if(features.indexOf('avatar') !== -1 && !achievements.v15_avatar){
      achievements.v15_avatar = Date.now();
      showToastV15('&#x1F3C6; &#xC544;&#xBC14;&#xD0C0; &#xCC3D;&#xC870;&#xC790; &#xC5C5;&#xC801; &#xB2EC;&#xC131;!');
    }
    if(features.indexOf('battle') !== -1 && !achievements.v15_battle_s){
      var bd = getBattleData();
      if(bd.totalBattles > 0){
        var totalPower = Math.min(bd.totalDamage/bd.totalBattles/3,100) + Math.min(bd.dodges/bd.totalBattles*150,100) + Math.min(bd.combos/bd.totalBattles*80,100);
        if(totalPower/3 >= 80){
          achievements.v15_battle_s = Date.now();
          showToastV15('&#x1F3C6; S&#xB4F1;&#xAE09; &#xC804;&#xC0AC; &#xC5C5;&#xC801; &#xB2EC;&#xC131;!');
        }
      }
    }

    var allFeatures = ['evo','compat','party','arcade','season','ost','avatar','battle'];
    var allVisited = allFeatures.every(function(f){ return features.indexOf(f) !== -1; });
    if(allVisited && !achievements.v15_explorer){
      achievements.v15_explorer = Date.now();
      showToastV15('&#x1F3C6; v15 &#xD0D0;&#xD5D8;&#xAC00; &#xC5C5;&#xC801; &#xB2EC;&#xC131;!');
    }

    localStorage.setItem('hatcuping_achievements', JSON.stringify(achievements));
    if(typeof updateAchieveCount === 'function') updateAchieveCount();
  }catch(e){}
}


// ============================================================
// KEYBOARD SHORTCUTS (Shift+8&#xC885;)
// ============================================================
document.addEventListener('keydown', function(e){
  if(e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  if(!e.shiftKey) return;
  switch(e.key){
    case 'E': e.preventDefault(); openEvoChain(); break;
    case 'C': e.preventDefault(); openCompatChart(); break;
    case 'P': e.preventDefault(); openPartyBuilder(); break;
    case 'G': e.preventDefault(); openArcade(); break;
    case 'N': e.preventDefault(); openSeasonEvent(); break;
    case 'O': e.preventDefault(); openOSTPlayer(); break;
    case 'V': e.preventDefault(); openAvatarMaker(); break;
    case 'B': e.preventDefault(); openBattleDashboard(); break;
  }
});


// ============================================================
// BOTTOM NAV BAR (8 quick-access buttons)
// ============================================================
function injectV15Nav(){
  var existing = document.getElementById('v15NavBar');
  if(existing) return;

  var nav = document.createElement('div');
  nav.id = 'v15NavBar';
  nav.setAttribute('role','navigation');
  nav.setAttribute('aria-label','v15 &#xAE30;&#xB2A5;');
  nav.style.cssText = 'position:fixed;bottom:0;left:0;width:100%;background:var(--glass);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-top:1px solid var(--border);padding:6px 8px;display:flex;justify-content:space-around;z-index:100;overflow-x:auto;gap:2px';

  var buttons = [
    {icon:'&#x1F331;',label:'&#xC9C4;&#xD654;',fn:'openEvoChain'},
    {icon:'&#x2694;&#xFE0F;',label:'&#xC0C1;&#xC131;',fn:'openCompatChart'},
    {icon:'&#x1F46B;',label:'&#xD30C;&#xD2F0;',fn:'openPartyBuilder'},
    {icon:'&#x1F3AE;',label:'&#xC544;&#xCF00;&#xC774;&#xB4DC;',fn:'openArcade'},
    {icon:'&#x1F338;',label:'&#xC2DC;&#xC98C;',fn:'openSeasonEvent'},
    {icon:'&#x1F3B5;',label:'OST',fn:'openOSTPlayer'},
    {icon:'&#x1F3A8;',label:'&#xC544;&#xBC14;&#xD0C0;',fn:'openAvatarMaker'},
    {icon:'&#x2694;&#xFE0F;',label:'&#xC804;&#xD22C;&#xB825;',fn:'openBattleDashboard'}
  ];

  buttons.forEach(function(b){
    var btn = document.createElement('button');
    btn.setAttribute('aria-label', b.label);
    btn.style.cssText = 'background:none;border:none;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:1px;padding:4px 6px;border-radius:10px;transition:all .2s;min-width:44px';
    btn.innerHTML = '<span style="font-size:18px">' + b.icon + '</span><span style="font-size:9px;font-weight:700;color:var(--text-sub)">' + b.label + '</span>';
    btn.addEventListener('click', function(){ if(typeof window[b.fn] === 'function') window[b.fn](); });
    btn.addEventListener('mouseover', function(){ this.style.background = 'rgba(255,95,162,.1)'; });
    btn.addEventListener('mouseout', function(){ this.style.background = 'none'; });
    nav.appendChild(btn);
  });

  document.body.appendChild(nav);
  document.body.style.paddingBottom = '64px';
}

window.openEvoChain = openEvoChain;
window.openCompatChart = openCompatChart;
window.openPartyBuilder = openPartyBuilder;
window.openArcade = openArcade;
window.openSeasonEvent = openSeasonEvent;
window.openOSTPlayer = openOSTPlayer;
window.openAvatarMaker = openAvatarMaker;
window.openBattleDashboard = openBattleDashboard;
window.playOST = playOST;
window.stopOST = stopOST;

if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', function(){ injectV15Nav(); checkAndAwardV15(); });
} else {
  injectV15Nav();
  checkAndAwardV15();
}

})();

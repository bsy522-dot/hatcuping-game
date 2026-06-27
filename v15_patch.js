// hatcuping-game v15_patch.js - NEXTERA+PRISM AUTO v15.0
// Self-contained patch module (1000+ lines, 60+ functions)
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
  cook_open:{f:700,d:.07,t:'sine'},
  cook_done:{f:1100,d:.12,t:'triangle'},
  costume_open:{f:660,d:.06,t:'sine'},
  costume_equip:{f:880,d:.1,t:'triangle'},
  skill_open:{f:600,d:.06,t:'sine'},
  skill_learn:{f:1047,d:.12,t:'triangle'},
  mail_open:{f:550,d:.07,t:'sine'},
  mail_read:{f:770,d:.05,t:'triangle'},
  fortune_open:{f:500,d:.08,t:'sine'},
  race_start:{f:990,d:.04,t:'square'},
  studio_note:{f:523,d:.15,t:'sine'},
  encyc_open:{f:720,d:.06,t:'sine'}
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
  try{ var d = JSON.parse(localStorage.getItem(key)); return d !== null ? d : fallback; }catch(e){ return fallback; }
}

function v15Save(key, data){
  try{ localStorage.setItem(key, JSON.stringify(data)); }catch(e){}
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
// 1. COOKING CLASS (&#xC694;&#xB9AC;&#xAD50;&#xC2E4;) - Shift+C
// ============================================================
var RECIPES = [
  {id:'rc01',name:'&#xC0AC;&#xB791;&#xC758;&#xCFE0;&#xD0A4;',icon:'&#x1F36A;',rarity:'&#xC77C;&#xBC18;',xp:10,time:3,desc:'&#xC0AC;&#xB791;&#xC744; &#xB2F4;&#xC544; &#xAD7D;&#xB294; &#xCFE0;&#xD0A4;'},
  {id:'rc02',name:'&#xBB34;&#xC9C0;&#xAC1C;&#xCF00;&#xC774;&#xD06C;',icon:'&#x1F382;',rarity:'&#xC77C;&#xBC18;',xp:12,time:4,desc:'&#xBB34;&#xC9C0;&#xAC1C; &#xC0C9;&#xC73C;&#xB85C; &#xBB3C;&#xB4E0; &#xCF00;&#xC774;&#xD06C;'},
  {id:'rc03',name:'&#xBCC4;&#xBE5B;&#xC824;&#xB9AC;',icon:'&#x1F36C;',rarity:'&#xC77C;&#xBC18;',xp:8,time:2,desc:'&#xBCC4;&#xBE5B;&#xC774; &#xBC18;&#xC9DD;&#xC774;&#xB294; &#xC824;&#xB9AC;'},
  {id:'rc04',name:'&#xD558;&#xD2B8;&#xCD08;&#xCF5C;&#xB9BF;',icon:'&#x1F36B;',rarity:'&#xD76C;&#xADC0;',xp:20,time:5,desc:'&#xD558;&#xD2B8; &#xBAA8;&#xC591;&#xC758; &#xD2B9;&#xBCC4;&#xD55C; &#xCD08;&#xCF5C;&#xB9BF;'},
  {id:'rc05',name:'&#xAD6C;&#xB984;&#xC194;&#xC0AC;&#xD0D5;',icon:'&#x1F36D;',rarity:'&#xD76C;&#xADC0;',xp:18,time:4,desc:'&#xAD6C;&#xB984;&#xCC98;&#xB7FC; &#xD3ED;&#xC2E0;&#xD3ED;&#xC2E0;&#xD55C; &#xC194;&#xC0AC;&#xD0D5;'},
  {id:'rc06',name:'&#xB9C8;&#xBC95;&#xD30C;&#xC774;',icon:'&#x1F967;',rarity:'&#xD76C;&#xADC0;',xp:22,time:6,desc:'&#xBA39;&#xC73C;&#xBA74; &#xB9C8;&#xBC95;&#xB825;&#xC774; &#xC0C1;&#xC2B9;&#xD558;&#xB294; &#xD30C;&#xC774;'},
  {id:'rc07',name:'&#xC774;&#xBAA8;&#xC158;&#xD478;&#xB529;',icon:'&#x1F36E;',rarity:'&#xC601;&#xC6C5;',xp:35,time:8,desc:'&#xAC10;&#xC815;&#xC744; &#xB2F4;&#xC544;&#xB0B8; &#xD2B9;&#xBCC4;&#xD55C; &#xD478;&#xB529;'},
  {id:'rc08',name:'&#xBCC4;&#xBE5B;&#xB9C8;&#xCE74;&#xB871;',icon:'&#x1F369;',rarity:'&#xC601;&#xC6C5;',xp:30,time:7,desc:'&#xBCC4;&#xBE5B;&#xC744; &#xAC00;&#xB450; &#xB2F4;&#xC740; &#xB9C8;&#xCE74;&#xB871;'},
  {id:'rc09',name:'&#xC0AC;&#xB791;&#xC758;&#xD2F0;',icon:'&#x2615;',rarity:'&#xC601;&#xC6C5;',xp:28,time:6,desc:'&#xB530;&#xB73B;&#xD55C; &#xC0AC;&#xB791;&#xC774; &#xB290;&#xAEF4;&#xC9C0;&#xB294; &#xD2F0;'},
  {id:'rc10',name:'&#xBB34;&#xC9C0;&#xAC1C;&#xC544;&#xC774;&#xC2A4;&#xD06C;&#xB9BC;',icon:'&#x1F366;',rarity:'&#xC601;&#xC6C5;',xp:32,time:7,desc:'7&#xAC00;&#xC9C0; &#xC0C9;&#xC758; &#xC544;&#xC774;&#xC2A4;&#xD06C;&#xB9BC;'},
  {id:'rc11',name:'&#xCD95;&#xBCF5;&#xC758;&#xBE75;',icon:'&#x1F35E;',rarity:'&#xC804;&#xC124;',xp:50,time:10,desc:'&#xBA39;&#xC73C;&#xBA74; &#xCD95;&#xBCF5;&#xC744; &#xBC1B;&#xB294; &#xC804;&#xC124;&#xC758; &#xBE75;'},
  {id:'rc12',name:'&#xC804;&#xC124;&#xC758;&#xC5F0;&#xD68C;',icon:'&#x1F370;',rarity:'&#xC804;&#xC124;',xp:60,time:12,desc:'&#xBAA8;&#xB4E0; &#xC694;&#xB9AC;&#xC758; &#xC815;&#xC218;&#xB97C; &#xB2F4;&#xC740; &#xC5F0;&#xD68C;'}
];

var RARITY_COLORS = {'&#xC77C;&#xBC18;':'#8BC34A','&#xD76C;&#xADC0;':'#2196F3','&#xC601;&#xC6C5;':'#9C27B0','&#xC804;&#xC124;':'#FFD700'};

function getCookingData(){
  return v15Load('v15_cooking', {level:1,xp:0,cooked:{},totalCooks:0});
}
function saveCookingData(d){ v15Save('v15_cooking', d); }

function openCookingClass(){
  trackV15Feature('cooking');
  sfxV15('cook_open');
  var d = getCookingData();
  var xpNeeded = d.level * 50;

  createV15Modal('cookModal', '&#x1F373; &#xC694;&#xB9AC;&#xAD50;&#xC2E4; (Lv.' + d.level + ')', function(){
    var html = '';
    html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;padding:8px 12px;background:linear-gradient(135deg,rgba(255,152,0,.1),rgba(255,87,34,.1));border-radius:12px">';
    html += '<span style="font-size:20px">&#x1F468;&#x200D;&#x1F373;</span>';
    html += '<div style="flex:1"><div style="font-size:11px;color:var(--text-sub)">&#xC170;&#xD504; &#xB808;&#xBCA8; ' + d.level + '</div>';
    html += '<div style="height:8px;background:rgba(0,0,0,.1);border-radius:4px;overflow:hidden"><div style="height:100%;width:' + Math.min(d.xp/xpNeeded*100,100) + '%;background:linear-gradient(90deg,#FF9800,#F57C00);border-radius:4px;transition:width .3s"></div></div>';
    html += '</div><span style="font-weight:800;color:#FF9800">' + d.xp + '/' + xpNeeded + ' XP</span></div>';

    html += '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px">';
    RECIPES.forEach(function(rc){
      var count = d.cooked[rc.id] || 0;
      var canCook = true;
      var rarityColor = RARITY_COLORS[rc.rarity] || '#888';
      html += '<div style="padding:10px;border-radius:14px;background:rgba(0,0,0,.03);border:2px solid ' + rarityColor + '40;position:relative">';
      html += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">';
      html += '<span style="font-size:20px">' + rc.icon + '</span>';
      html += '<div><div style="font-size:12px;font-weight:700">' + rc.name + '</div>';
      html += '<div style="font-size:9px;color:' + rarityColor + ';font-weight:700">' + rc.rarity + '</div></div></div>';
      html += '<div style="font-size:10px;color:var(--text-sub);margin-bottom:4px">' + rc.desc + '</div>';
      html += '<div style="display:flex;justify-content:space-between;align-items:center">';
      html += '<span style="font-size:10px;color:#FF9800;font-weight:700">+' + rc.xp + 'XP | &#xC694;&#xB9AC;:' + count + '&#xD68C;</span>';
      html += '<button onclick="(function(){var d=JSON.parse(localStorage.getItem(&#x27;v15_cooking&#x27;)||&#x27;{}&#x27;)||{};if(!d.cooked)d.cooked={};d.cooked[&#x27;' + rc.id + '&#x27;]=(d.cooked[&#x27;' + rc.id + '&#x27;]||0)+1;d.totalCooks=(d.totalCooks||0)+1;d.xp=(d.xp||0)+' + rc.xp + ';var need=(d.level||1)*50;if(d.xp>=need){d.level=(d.level||1)+1;d.xp=d.xp-need;}localStorage.setItem(&#x27;v15_cooking&#x27;,JSON.stringify(d));document.getElementById(&#x27;cookModal&#x27;).remove();})()" style="padding:3px 10px;border-radius:8px;border:none;font-size:10px;font-weight:700;cursor:pointer;background:linear-gradient(135deg,#FF9800,#F57C00);color:#fff">&#xC694;&#xB9AC;!</button>';
      html += '</div></div>';
    });
    html += '</div>';
    return html;
  });
}


// ============================================================
// 2. COSTUME COLLECTION (&#xCF54;&#xC2A4;&#xD280; &#xCEEC;&#xB809;&#xC158;) - Shift+O
// ============================================================
var COSTUMES = [
  {id:'cs01',name:'&#xAE30;&#xBCF8;&#xBCF5;',icon:'&#x1F455;',rarity:'&#xC77C;&#xBC18;',effect:'&#xAE30;&#xBCF8; &#xC0C1;&#xD0DC;',desc:'&#xD558;&#xCE04;&#xD551;&#xC758; &#xAE30;&#xBCF8; &#xC758;&#xC0C1;'},
  {id:'cs02',name:'&#xBD04;&#xAF43;&#xB4DC;&#xB808;&#xC2A4;',icon:'&#x1F338;',rarity:'&#xC77C;&#xBC18;',effect:'HP +5%',desc:'&#xBD04;&#xAF43;&#xCC98;&#xB7FC; &#xD654;&#xC0AC;&#xD55C; &#xB4DC;&#xB808;&#xC2A4;'},
  {id:'cs03',name:'&#xC5EC;&#xB984;&#xBC14;&#xB2E4;&#xBCF5;',icon:'&#x1F3D6;&#xFE0F;',rarity:'&#xC77C;&#xBC18;',effect:'SPD +5%',desc:'&#xC2DC;&#xC6D0;&#xD55C; &#xC5EC;&#xB984; &#xBC14;&#xB2E4; &#xC758;&#xC0C1;'},
  {id:'cs04',name:'&#xAC00;&#xC744;&#xB2E8;&#xD48D;&#xBCF5;',icon:'&#x1F341;',rarity:'&#xD76C;&#xADC0;',effect:'DEF +8%',desc:'&#xB2E8;&#xD48D;&#xC73C;&#xB85C; &#xBB3C;&#xB4E0; &#xAC00;&#xC744; &#xC758;&#xC0C1;'},
  {id:'cs05',name:'&#xACA8;&#xC6B8;&#xB208;&#xAF43;&#xBCF5;',icon:'&#x2744;&#xFE0F;',rarity:'&#xD76C;&#xADC0;',effect:'MAG +8%',desc:'&#xB208;&#xAF43; &#xBB38;&#xC591;&#xC758; &#xACA8;&#xC6B8; &#xC758;&#xC0C1;'},
  {id:'cs06',name:'&#xBCC4;&#xBE5B;&#xB9DD;&#xD1A0;',icon:'&#x1F31F;',rarity:'&#xD76C;&#xADC0;',effect:'LUK +10%',desc:'&#xBCC4;&#xBE5B;&#xC774; &#xBC18;&#xC9DD;&#xC774;&#xB294; &#xB9DD;&#xD1A0;'},
  {id:'cs07',name:'&#xBB34;&#xC9C0;&#xAC1C;&#xB0A0;&#xAC1C;&#xC637;',icon:'&#x1F308;',rarity:'&#xC601;&#xC6C5;',effect:'&#xC804;&#xCCB4; +5%',desc:'&#xBB34;&#xC9C0;&#xAC1C; &#xB0A0;&#xAC1C;&#xAC00; &#xB2EC;&#xB9B0; &#xC637;'},
  {id:'cs08',name:'&#xD558;&#xD2B8;&#xD504;&#xB9B0;&#xC138;&#xC2A4;',icon:'&#x1F496;',rarity:'&#xC601;&#xC6C5;',effect:'ATK +10%',desc:'&#xC0AC;&#xB791;&#xC758; &#xD798;&#xC774; &#xAE43;&#xB4E0; &#xD504;&#xB9B0;&#xC138;&#xC2A4; &#xBCF5;'},
  {id:'cs09',name:'&#xC6A9;&#xC0AC;&#xAC11;&#xC637;',icon:'&#x1F6E1;&#xFE0F;',rarity:'&#xC601;&#xC6C5;',effect:'DEF +15%',desc:'&#xC6A9;&#xAE30;&#xC758; &#xC6A9;&#xC0AC;&#xAC00; &#xC785;&#xB294; &#xAC11;&#xC637;'},
  {id:'cs10',name:'&#xB9C8;&#xBC95;&#xC0AC;&#xB85C;&#xBE0C;',icon:'&#x1FA84;',rarity:'&#xC601;&#xC6C5;',effect:'MAG +15%',desc:'&#xAC15;&#xB825;&#xD55C; &#xB9C8;&#xBC95;&#xB825;&#xC744; &#xBD80;&#xC5EC;&#xD558;&#xB294; &#xB85C;&#xBE0C;'},
  {id:'cs11',name:'&#xCD95;&#xC81C;&#xD55C;&#xBCF5;',icon:'&#x1F3CE;&#xFE0F;',rarity:'&#xC804;&#xC124;',effect:'&#xC804;&#xCCB4; +10%',desc:'&#xD654;&#xB824;&#xD55C; &#xCD95;&#xC81C; &#xD55C;&#xBCF5;'},
  {id:'cs12',name:'&#xC804;&#xC124;&#xC758;&#xC655;&#xAD00;&#xBCF5;',icon:'&#x1F451;',rarity:'&#xC804;&#xC124;',effect:'&#xC804;&#xCCB4; +15%',desc:'&#xC804;&#xC124; &#xC18D; &#xC655;&#xC774; &#xC785;&#xB358; &#xC758;&#xC0C1;'}
];

function getCostumeData(){
  return v15Load('v15_costumes', {owned:['cs01'],equipped:'cs01'});
}
function saveCostumeData(d){ v15Save('v15_costumes', d); }

function openCostumeCollection(){
  trackV15Feature('costumes');
  sfxV15('costume_open');
  var d = getCostumeData();

  createV15Modal('costumeModal', '&#x1F457; &#xCF54;&#xC2A4;&#xD280; &#xCEEC;&#xB809;&#xC158; (' + d.owned.length + '/' + COSTUMES.length + ')', function(){
    var html = '';
    html += '<div style="text-align:center;margin-bottom:10px"><button onclick="(function(){var d=JSON.parse(localStorage.getItem(&#x27;v15_costumes&#x27;)||&#x27;{}&#x27;)||{};var owned=d.owned||[&#x27;cs01&#x27;];var all=[&#x27;cs01&#x27;,&#x27;cs02&#x27;,&#x27;cs03&#x27;,&#x27;cs04&#x27;,&#x27;cs05&#x27;,&#x27;cs06&#x27;,&#x27;cs07&#x27;,&#x27;cs08&#x27;,&#x27;cs09&#x27;,&#x27;cs10&#x27;,&#x27;cs11&#x27;,&#x27;cs12&#x27;];var locked=all.filter(function(c){return owned.indexOf(c)===-1;});if(locked.length>0){owned.push(locked[Math.floor(Math.random()*locked.length)]);d.owned=owned;localStorage.setItem(&#x27;v15_costumes&#x27;,JSON.stringify(d));document.getElementById(&#x27;costumeModal&#x27;).remove();}})()" style="padding:8px 20px;background:linear-gradient(135deg,#E91E63,#9C27B0);color:#fff;border:none;border-radius:12px;font-size:12px;font-weight:700;cursor:pointer">&#x1F381; &#xCF54;&#xC2A4;&#xD280; &#xBBD1;&#xAE30;</button></div>';

    html += '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px">';
    COSTUMES.forEach(function(cs){
      var owned = d.owned.indexOf(cs.id) !== -1;
      var equipped = d.equipped === cs.id;
      var rarityColor = RARITY_COLORS[cs.rarity] || '#888';
      html += '<div style="padding:10px;border-radius:14px;background:' + (equipped ? 'rgba(233,30,99,.08)' : 'rgba(0,0,0,.03)') + ';border:2px solid ' + (equipped ? '#E91E63' : (owned ? rarityColor + '40' : 'transparent')) + ';opacity:' + (owned ? '1' : '.45') + '">';
      html += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">';
      html += '<span style="font-size:22px">' + (owned ? cs.icon : '&#x1F512;') + '</span>';
      html += '<div><div style="font-size:12px;font-weight:700">' + (owned ? cs.name : '???') + '</div>';
      html += '<div style="font-size:9px;color:' + rarityColor + ';font-weight:700">' + cs.rarity + '</div></div></div>';
      if(owned){
        html += '<div style="font-size:10px;color:var(--text-sub);margin-bottom:2px">' + cs.desc + '</div>';
        html += '<div style="font-size:10px;color:#E91E63;font-weight:700;margin-bottom:4px">&#xD6A8;&#xACFC;: ' + cs.effect + '</div>';
        if(!equipped){
          html += '<button onclick="(function(){var d=JSON.parse(localStorage.getItem(&#x27;v15_costumes&#x27;)||&#x27;{}&#x27;)||{};d.equipped=&#x27;' + cs.id + '&#x27;;localStorage.setItem(&#x27;v15_costumes&#x27;,JSON.stringify(d));document.getElementById(&#x27;costumeModal&#x27;).remove();})()" style="padding:3px 10px;border-radius:8px;border:none;font-size:10px;font-weight:700;cursor:pointer;background:linear-gradient(135deg,#E91E63,#9C27B0);color:#fff">&#xC7A5;&#xCC29;</button>';
        } else {
          html += '<span style="font-size:10px;color:#4CAF50;font-weight:700">&#x2705; &#xC7A5;&#xCC29;&#xC911;</span>';
        }
      }
      html += '</div>';
    });
    html += '</div>';
    return html;
  });
}


// ============================================================
// 3. SKILL TREE (&#xC2A4;&#xD0AC;&#xD2B8;&#xB9AC;) - Shift+T
// ============================================================
var SKILL_NODES = [
  {id:'sk01',name:'&#xC0AC;&#xB791;&#xC758;&#xC2DC;&#xC791;',tier:1,cost:1,parent:null,icon:'&#x1F496;',desc:'&#xAE30;&#xBCF8; &#xC0AC;&#xB791;&#xC758; &#xD798;&#xC744; &#xAC01;&#xC131;'},
  {id:'sk02',name:'&#xC6A9;&#xAE30;&#xC758;&#xBD88;&#xAF43;',tier:1,cost:1,parent:null,icon:'&#x1F525;',desc:'&#xC6A9;&#xAE30;&#xC758; &#xBD88;&#xAF43;&#xC744; &#xD53C;&#xC6B0;&#xB2E4;'},
  {id:'sk03',name:'&#xC9C0;&#xD61C;&#xC758;&#xBE5B;',tier:1,cost:1,parent:null,icon:'&#x1F4A1;',desc:'&#xC9C0;&#xD61C;&#xC758; &#xBE5B;&#xC744; &#xBC1D;&#xD78C;&#xB2E4;'},
  {id:'sk04',name:'&#xD558;&#xD2B8;&#xC2DC;&#xB4DC;',tier:2,cost:2,parent:'sk01',icon:'&#x1F49E;',desc:'&#xC0AC;&#xB791;&#xC758; &#xC528;&#xC557;&#xC744; &#xC2EC;&#xB294;&#xB2E4;'},
  {id:'sk05',name:'&#xC6A9;&#xAE30;&#xC758;&#xAC80;',tier:2,cost:2,parent:'sk02',icon:'&#x2694;&#xFE0F;',desc:'&#xC6A9;&#xAE30;&#xB97C; &#xAC80;&#xC73C;&#xB85C; &#xD615;&#xC0C1;&#xD654;'},
  {id:'sk06',name:'&#xBCC4;&#xC790;&#xB9AC;&#xC77D;&#xAE30;',tier:2,cost:2,parent:'sk03',icon:'&#x2B50;',desc:'&#xBCC4;&#xC790;&#xB9AC;&#xB97C; &#xC77D;&#xB294; &#xB2A5;&#xB825;'},
  {id:'sk07',name:'&#xC0AC;&#xB791;&#xC758;&#xD3ED;&#xD48D;',tier:3,cost:3,parent:'sk04',icon:'&#x1F32A;&#xFE0F;',desc:'&#xC0AC;&#xB791;&#xC758; &#xD798;&#xC73C;&#xB85C; &#xD3ED;&#xD48D;&#xC744; &#xC77C;&#xC73C;&#xD0A8;&#xB2E4;'},
  {id:'sk08',name:'&#xD53C;&#xB2C9;&#xC2A4;&#xBE0C;&#xB808;&#xC774;&#xD06C;',tier:3,cost:3,parent:'sk05',icon:'&#x1F985;',desc:'&#xBD88;&#xC0AC;&#xC870;&#xCC98;&#xB7FC; &#xBD80;&#xD65C;&#xD558;&#xB294; &#xD798;'},
  {id:'sk09',name:'&#xC608;&#xC5B8;&#xC758;&#xB208;',tier:3,cost:3,parent:'sk06',icon:'&#x1F441;&#xFE0F;',desc:'&#xBBF8;&#xB798;&#xB97C; &#xBCF4;&#xB294; &#xB208;'},
  {id:'sk10',name:'&#xADF9;&#xCC28;&#xC0AC;&#xB791;',tier:4,cost:5,parent:'sk07',icon:'&#x1F31F;',desc:'&#xADF9;&#xD55C;&#xC758; &#xC0AC;&#xB791; &#xD798;'},
  {id:'sk11',name:'&#xC804;&#xC124;&#xC758;&#xC6A9;&#xC0AC;',tier:4,cost:5,parent:'sk08',icon:'&#x1F451;',desc:'&#xC804;&#xC124; &#xC18D; &#xC6A9;&#xC0AC;&#xC758; &#xD798;'},
  {id:'sk12',name:'&#xC804;&#xC9C0;&#xC804;&#xB2A5;',tier:4,cost:5,parent:'sk09',icon:'&#x1F52E;',desc:'&#xBAA8;&#xB4E0; &#xAC83;&#xC744; &#xC544;&#xB294; &#xC804;&#xC9C0;&#xC804;&#xB2A5;'}
];

function getSkillData(){
  return v15Load('v15_skillTree', {sp:5,learned:[],totalSP:5});
}
function saveSkillData(d){ v15Save('v15_skillTree', d); }

function openSkillTree(){
  trackV15Feature('skillTree');
  sfxV15('skill_open');
  var d = getSkillData();

  createV15Modal('skillModal', '&#x1F333; &#xC2A4;&#xD0AC;&#xD2B8;&#xB9AC; (SP: ' + d.sp + ')', function(){
    var html = '';
    var tierNames = {1:'Tier 1: &#xAE30;&#xBCF8;',2:'Tier 2: &#xACE0;&#xAE09;',3:'Tier 3: &#xB9C8;&#xC2A4;&#xD130;',4:'Tier 4: &#xAD81;&#xADF9;'};
    var tierColors = {1:'#8BC34A',2:'#2196F3',3:'#9C27B0',4:'#FFD700'};

    for(var tier=1;tier<=4;tier++){
      html += '<div style="margin-bottom:10px"><div style="font-size:12px;font-weight:800;color:' + tierColors[tier] + ';margin-bottom:6px">' + tierNames[tier] + '</div>';
      html += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px">';
      SKILL_NODES.forEach(function(sk){
        if(sk.tier !== tier) return;
        var learned = d.learned.indexOf(sk.id) !== -1;
        var parentOk = !sk.parent || d.learned.indexOf(sk.parent) !== -1;
        var canLearn = !learned && parentOk && d.sp >= sk.cost;
        html += '<div style="padding:8px;border-radius:12px;text-align:center;background:' + (learned ? tierColors[tier] + '15' : 'rgba(0,0,0,.04)') + ';border:2px solid ' + (learned ? tierColors[tier] : 'transparent') + ';opacity:' + (parentOk || learned ? '1' : '.4') + '">';
        html += '<div style="font-size:22px">' + sk.icon + '</div>';
        html += '<div style="font-size:11px;font-weight:700;margin:2px 0">' + sk.name + '</div>';
        html += '<div style="font-size:9px;color:var(--text-sub);margin-bottom:4px">' + sk.desc + '</div>';
        if(learned){
          html += '<span style="font-size:9px;color:#4CAF50;font-weight:700">&#x2705; &#xC2B5;&#xB4DD;</span>';
        } else if(canLearn){
          html += '<button onclick="(function(){var d=JSON.parse(localStorage.getItem(&#x27;v15_skillTree&#x27;)||&#x27;{}&#x27;)||{};if(!d.learned)d.learned=[];if((d.sp||0)>=' + sk.cost + '){d.sp=(d.sp||0)-' + sk.cost + ';d.learned.push(&#x27;' + sk.id + '&#x27;);localStorage.setItem(&#x27;v15_skillTree&#x27;,JSON.stringify(d));document.getElementById(&#x27;skillModal&#x27;).remove();}})()" style="padding:2px 8px;border-radius:8px;border:none;font-size:9px;font-weight:700;cursor:pointer;background:' + tierColors[tier] + ';color:#fff">SP ' + sk.cost + '</button>';
        } else {
          html += '<span style="font-size:9px;color:var(--text-sub)">&#x1F512; SP ' + sk.cost + '</span>';
        }
        html += '</div>';
      });
      html += '</div></div>';
    }
    return html;
  });
}


// ============================================================
// 4. MAILBOX (&#xC6B0;&#xCCB4;&#xD1B5;) - Shift+L
// ============================================================
var MAIL_LETTERS = [
  {id:'ml01',sender:'&#xD558;&#xCE04;&#xD551;',icon:'&#x1F496;',content:'&#xC624;&#xB298;&#xB3C4; &#xC0AC;&#xB791;&#xC744; &#xC804;&#xD574;! &#xB108;&#xC758; &#xD558;&#xB8E8;&#xAC00; &#xD589;&#xBCF5;&#xD558;&#xAE38; &#xBC14;&#xB798;!',reward:'&#xD558;&#xD2B8; x3'},
  {id:'ml02',sender:'&#xC6A9;&#xAE30;&#xD551;',icon:'&#x1F4AA;',content:'&#xD798;&#xB0B4;! &#xB108;&#xB294; &#xCDA9;&#xBD84;&#xD788; &#xC6A9;&#xAC10;&#xD574;! &#xC624;&#xB298;&#xB3C4; &#xD30C;&#xC774;&#xD305;!',reward:'&#xC6A9;&#xAE30;&#xC758;&#xBCC4; x1'},
  {id:'ml03',sender:'&#xD589;&#xBCF5;&#xD551;',icon:'&#x1F60A;',content:'&#xD589;&#xBCF5;&#xC740; &#xAC00;&#xAE4C;&#xC774; &#xC788;&#xC5B4;! &#xC624;&#xB298;&#xB3C4; &#xC6C3;&#xC5B4;&#xBD10;!',reward:'XP +30'},
  {id:'ml04',sender:'&#xC9C0;&#xD61C;&#xD551;',icon:'&#x1F4D6;',content:'&#xC0C8;&#xB85C;&#xC6B4; &#xC9C0;&#xC2DD;&#xC744; &#xBC30;&#xC6E0;&#xC5B4;! &#xD568;&#xAED8; &#xACF5;&#xBD80;&#xD558;&#xC790;!',reward:'&#xC9C0;&#xD61C;&#xC758;&#xCC45; x1'},
  {id:'ml05',sender:'&#xAFC8;&#xD551;',icon:'&#x1F31F;',content:'&#xAFC8;&#xC744; &#xC78A;&#xC9C0; &#xB9C8;! &#xB108;&#xC758; &#xAFC8;&#xC740; &#xBC18;&#xB4DC;&#xC2DC; &#xC774;&#xB8E8;&#xC5B4;&#xC838;!',reward:'&#xAFC8;&#xC758;&#xBCC4; x1'},
  {id:'ml06',sender:'&#xCC29;&#xD551;',icon:'&#x1F338;',content:'&#xB530;&#xB73B;&#xD55C; &#xB9D0; &#xD55C;&#xB9C8;&#xB514;! &#xB108;&#xB294; &#xC815;&#xB9D0; &#xCC29;&#xD55C; &#xC544;&#xC774;&#xC57C;!',reward:'&#xAF43; x5'},
  {id:'ml07',sender:'&#xB85C;&#xBBF8;',icon:'&#x1F467;',content:'&#xC624;&#xB298; &#xBAA8;&#xD5D8;&#xC774; &#xC815;&#xB9D0; &#xC7AC;&#xBC0C;&#xC5C8;&#xC5B4;! &#xB2E4;&#xC74C;&#xC5D0;&#xB3C4; &#xD568;&#xAED8;&#xD558;&#xC790;!',reward:'&#xBAA8;&#xD5D8;&#xC758;&#xD45C; x1'},
  {id:'ml08',sender:'&#xBCC4;&#xBE5B;&#xD551;',icon:'&#x2B50;',content:'&#xBCC4;&#xBE5B;&#xC774; &#xB110; &#xBE44;&#xCD94;&#xACE0; &#xC788;&#xC5B4;! &#xC5B8;&#xC81C;&#xB098; &#xBE5B;&#xB098;&#xB294; &#xC874;&#xC7AC;&#xC57C;!',reward:'&#xBCC4;&#xBE5B; x3'},
  {id:'ml09',sender:'&#xBB34;&#xC9C0;&#xAC1C;&#xD551;',icon:'&#x1F308;',content:'&#xBB34;&#xC9C0;&#xAC1C;&#xCC98;&#xB7FC; &#xB2E4;&#xCC44;&#xB85C;&#xC6B4; &#xD558;&#xB8E8; &#xBCF4;&#xB0B4;!',reward:'&#xBB34;&#xC9C0;&#xAC1C;&#xC870;&#xAC01; x2'},
  {id:'ml10',sender:'&#xD654;&#xB0B4;&#xD551;',icon:'&#x1F621;',content:'&#xD754;, &#xBCC4;&#xB85C; &#xD3B8;&#xC9C0; &#xC4F4; &#xAC74; &#xC544;&#xB2C8;&#xC57C;! ...&#xADF8;&#xB0E5; &#xC548;&#xBD80;',reward:'&#xD654;&#xC5FC; x1'},
  {id:'ml11',sender:'&#xC2AC;&#xD504;&#xD551;',icon:'&#x1F622;',content:'&#xD3B8;&#xC9C0;&#xB97C; &#xC77D;&#xC5B4;&#xC918;&#xC11C; &#xACE0;&#xB9C8;&#xC6CC;... &#xB0B4; &#xB208;&#xBB3C;&#xC774; &#xB09C;&#xB2E4;&#xC5B4;...',reward:'&#xC704;&#xB85C;&#xC758;&#xBB3C;&#xBC29;&#xC6B8; x1'},
  {id:'ml12',sender:'&#xAC8C;&#xC73C;&#xB978;&#xD551;',icon:'&#x1F634;',content:'&#xD3B8;&#xC9C0; &#xC4F0;&#xB294; &#xAC83;&#xB3C4; &#xD798;&#xB4E4;&#xC5B4;... &#xD558;&#xC554;~ &#xC798; &#xC790;...',reward:'&#xD3ED;&#xC2E0;&#xBCA0;&#xAC1C; x1'}
];

function getMailData(){
  return v15Load('v15_mailbox', {read:[],lastDate:''});
}
function saveMailData(d){ v15Save('v15_mailbox', d); }

function openMailbox(){
  trackV15Feature('mailbox');
  sfxV15('mail_open');
  var d = getMailData();
  var today = todayStrV15();
  var seed = new Date();
  var dayOfYear = Math.floor((seed - new Date(seed.getFullYear(),0,0)) / 86400000);
  var todayIdx = dayOfYear % MAIL_LETTERS.length;
  var todayMail = MAIL_LETTERS[todayIdx];

  createV15Modal('mailModal', '&#x1F4EC; &#xC6B0;&#xCCB4;&#xD1B5; (&#xC77D;&#xC74C;: ' + d.read.length + '/' + MAIL_LETTERS.length + ')', function(){
    var html = '';
    html += '<div style="padding:14px;border-radius:14px;background:linear-gradient(135deg,rgba(255,95,162,.08),rgba(176,102,255,.08));margin-bottom:12px;border:2px solid rgba(255,95,162,.2)">';
    html += '<div style="font-size:11px;color:#FF5FA2;font-weight:700;margin-bottom:6px">&#x1F4E8; &#xC624;&#xB298;&#xC758; &#xD3B8;&#xC9C0;</div>';
    html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">';
    html += '<span style="font-size:24px">' + todayMail.icon + '</span>';
    html += '<div><div style="font-size:13px;font-weight:700">' + todayMail.sender + '&#xC73C;&#xB85C;&#xBD80;&#xD130;</div></div></div>';
    html += '<div style="font-size:12px;line-height:1.6;color:var(--text-main);padding:8px;background:rgba(255,255,255,.5);border-radius:10px;margin-bottom:6px">&quot;' + todayMail.content + '&quot;</div>';
    html += '<div style="font-size:11px;color:#FF9800;font-weight:700">&#x1F381; &#xBCF4;&#xC0C1;: ' + todayMail.reward + '</div>';
    var alreadyRead = d.read.indexOf(todayMail.id) !== -1;
    if(!alreadyRead){
      html += '<button onclick="(function(){var d=JSON.parse(localStorage.getItem(&#x27;v15_mailbox&#x27;)||&#x27;{}&#x27;)||{};if(!d.read)d.read=[];if(d.read.indexOf(&#x27;' + todayMail.id + '&#x27;)===-1)d.read.push(&#x27;' + todayMail.id + '&#x27;);d.lastDate=&#x27;' + today + '&#x27;;localStorage.setItem(&#x27;v15_mailbox&#x27;,JSON.stringify(d));document.getElementById(&#x27;mailModal&#x27;).remove();})()" style="margin-top:6px;padding:6px 16px;background:linear-gradient(135deg,#FF5FA2,#B066FF);color:#fff;border:none;border-radius:10px;font-size:11px;font-weight:700;cursor:pointer">&#x1F4E9; &#xC77D;&#xC74C; &#xD45C;&#xC2DC; &amp; &#xBCF4;&#xC0C1; &#xBC1B;&#xAE30;</button>';
    } else {
      html += '<div style="margin-top:6px;font-size:10px;color:#4CAF50;font-weight:700">&#x2705; &#xC774;&#xBBF8; &#xC77D;&#xC740; &#xD3B8;&#xC9C0;</div>';
    }
    html += '</div>';

    html += '<div style="font-size:12px;font-weight:700;margin-bottom:6px">&#x1F4DA; &#xC804;&#xCCB4; &#xD3B8;&#xC9C0; &#xBAA9;&#xB85D;</div>';
    html += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px">';
    MAIL_LETTERS.forEach(function(ml){
      var isRead = d.read.indexOf(ml.id) !== -1;
      html += '<div style="padding:8px;border-radius:10px;text-align:center;background:' + (isRead ? 'rgba(76,175,80,.08)' : 'rgba(0,0,0,.04)') + ';opacity:' + (isRead ? '1' : '.5') + '">';
      html += '<div style="font-size:18px">' + (isRead ? ml.icon : '&#x1F4E7;') + '</div>';
      html += '<div style="font-size:10px;font-weight:700">' + (isRead ? ml.sender : '???') + '</div>';
      html += '</div>';
    });
    html += '</div>';
    return html;
  });
}


// ============================================================
// 5. FORTUNE TELLER (&#xC6B4;&#xC138;) - Shift+F
// ============================================================
var FORTUNE_ASPECTS = ['&#xC0AC;&#xB791;','&#xC6B0;&#xC815;','&#xAC74;&#xAC15;','&#xACF5;&#xBD80;','&#xD589;&#xC6B4;','&#xBAA8;&#xD5D8;'];
var FORTUNE_GRADES = ['&#x2B50;&#x2B50;&#x2B50;&#x2B50;&#x2B50;','&#x2B50;&#x2B50;&#x2B50;&#x2B50;','&#x2B50;&#x2B50;&#x2B50;','&#x2B50;&#x2B50;','&#x2B50;'];
var LUCKY_COLORS = ['&#xBE68;&#xAC04;','&#xD30C;&#xB780;','&#xB178;&#xB780;','&#xBCF4;&#xB77C;','&#xBD84;&#xD64D;','&#xCD08;&#xB85D;','&#xD558;&#xB298;','&#xD770;'];
var LUCKY_ELEMENTS = ['&#xBD88;','&#xBB3C;','&#xBC14;&#xB78C;','&#xD758;','&#xBCC4;','&#xBB34;&#xC9C0;&#xAC1C;','&#xAD6C;&#xB984;','&#xBE5B;'];

function getFortuneData(){
  return v15Load('v15_fortune', {lastDate:'',fortune:null});
}
function saveFortuneData(d){ v15Save('v15_fortune', d); }

function generateFortune(){
  var today = todayStrV15();
  var seed = 0;
  for(var i=0;i<today.length;i++) seed += today.charCodeAt(i);
  var aspects = [];
  for(var j=0;j<FORTUNE_ASPECTS.length;j++){
    var grade = ((seed * (j+7) * 13) % 5);
    aspects.push({name:FORTUNE_ASPECTS[j],grade:grade,stars:FORTUNE_GRADES[grade]});
  }
  var luckyNum = (seed % 99) + 1;
  var luckyColor = LUCKY_COLORS[seed % LUCKY_COLORS.length];
  var luckyElement = LUCKY_ELEMENTS[(seed * 3) % LUCKY_ELEMENTS.length];
  return {date:today,aspects:aspects,luckyNum:luckyNum,luckyColor:luckyColor,luckyElement:luckyElement};
}

function openFortuneTeller(){
  trackV15Feature('fortune');
  sfxV15('fortune_open');
  var d = getFortuneData();
  var today = todayStrV15();
  var fortune;
  if(d.lastDate === today && d.fortune){
    fortune = d.fortune;
  } else {
    fortune = generateFortune();
    d.lastDate = today;
    d.fortune = fortune;
    saveFortuneData(d);
  }

  createV15Modal('fortuneModal', '&#x1F52E; &#xC624;&#xB298;&#xC758; &#xC6B4;&#xC138;', function(){
    var html = '';
    html += '<div style="text-align:center;padding:16px;background:linear-gradient(135deg,rgba(156,39,176,.1),rgba(103,58,183,.1));border-radius:16px;margin-bottom:12px">';
    html += '<div style="font-size:40px;margin-bottom:6px">&#x1F52E;</div>';
    html += '<div style="font-size:14px;font-weight:800;margin-bottom:4px">' + today + ' &#xC6B4;&#xC138;</div>';
    html += '<div style="display:flex;gap:8px;justify-content:center;margin-top:8px">';
    html += '<span style="padding:4px 10px;background:rgba(255,95,162,.15);border-radius:8px;font-size:11px;font-weight:700;color:#FF5FA2">&#xD589;&#xC6B4;&#xC758; &#xC22B;&#xC790;: ' + fortune.luckyNum + '</span>';
    html += '<span style="padding:4px 10px;background:rgba(156,39,176,.15);border-radius:8px;font-size:11px;font-weight:700;color:#9C27B0">&#xD589;&#xC6B4;&#xC758; &#xC0C9;: ' + fortune.luckyColor + '</span>';
    html += '<span style="padding:4px 10px;background:rgba(33,150,243,.15);border-radius:8px;font-size:11px;font-weight:700;color:#2196F3">&#xD589;&#xC6B4;&#xC758; &#xC6D0;&#xC18C;: ' + fortune.luckyElement + '</span>';
    html += '</div></div>';

    html += '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px">';
    fortune.aspects.forEach(function(asp){
      var colors = ['#FFD700','#FF9800','#4CAF50','#2196F3','#9E9E9E'];
      var color = colors[asp.grade];
      html += '<div style="padding:10px;border-radius:12px;background:rgba(0,0,0,.03);text-align:center">';
      html += '<div style="font-size:13px;font-weight:700;margin-bottom:4px">' + asp.name + '</div>';
      html += '<div style="font-size:14px;letter-spacing:2px">' + asp.stars + '</div>';
      html += '</div>';
    });
    html += '</div>';

    var totalScore = 0;
    fortune.aspects.forEach(function(asp){ totalScore += (5 - asp.grade); });
    var overallGrade = totalScore >= 25 ? '&#xCD5C;&#xACE0;' : totalScore >= 20 ? '&#xB300;&#xAE38;' : totalScore >= 15 ? '&#xC911;&#xAE38;' : totalScore >= 10 ? '&#xC18C;&#xAE38;' : '&#xD3C9;&#xBC94;';
    html += '<div style="text-align:center;margin-top:12px;padding:10px;background:linear-gradient(135deg,rgba(255,215,0,.15),rgba(255,152,0,.1));border-radius:12px">';
    html += '<span style="font-size:16px;font-weight:800;color:#FF9800">&#xCD1D;&#xD569; &#xC6B4;&#xC138;: ' + overallGrade + ' (' + totalScore + '/30)</span>';
    html += '</div>';
    return html;
  });
}


// ============================================================
// 6. PET RACING (&#xD3AB; &#xB808;&#xC774;&#xC2F1;) - Shift+R
// ============================================================
var RACERS = [
  {id:'r01',name:'&#xD1A0;&#xB07C;&#xD551;',icon:'&#x1F430;',color:'#FF5FA2',speed:1.0},
  {id:'r02',name:'&#xACE0;&#xC591;&#xC774;&#xD551;',icon:'&#x1F431;',color:'#9C27B0',speed:0.95},
  {id:'r03',name:'&#xAC15;&#xC544;&#xC9C0;&#xD551;',icon:'&#x1F436;',color:'#FF9800',speed:1.05},
  {id:'r04',name:'&#xB2E4;&#xB78C;&#xC950;&#xD551;',icon:'&#x1F43F;&#xFE0F;',color:'#795548',speed:0.9},
  {id:'r05',name:'&#xC5EC;&#xC6B0;&#xD551;',icon:'&#x1F98A;',color:'#F44336',speed:1.1},
  {id:'r06',name:'&#xACF0;&#xB3CC;&#xC774;&#xD551;',icon:'&#x1F43B;',color:'#607D8B',speed:0.85}
];

function getRacingData(){
  return v15Load('v15_racing', {wins:{},totalRaces:0});
}
function saveRacingData(d){ v15Save('v15_racing', d); }

function openPetRacing(){
  trackV15Feature('racing');
  sfxV15('race_start');
  var d = getRacingData();

  createV15Modal('raceModal', '&#x1F3C7; &#xD3AB; &#xB808;&#xC774;&#xC2F1; (&#xCD1D; ' + d.totalRaces + '&#xD68C;)', function(){
    var html = '';
    html += '<canvas id="raceCanvas" width="420" height="240" style="width:100%;border-radius:12px;margin-bottom:8px"></canvas>';
    html += '<div style="display:flex;gap:4px;flex-wrap:wrap;justify-content:center;margin-bottom:8px">';
    RACERS.forEach(function(rc){
      var wins = d.wins[rc.id] || 0;
      html += '<span style="font-size:10px;padding:3px 8px;border-radius:8px;background:' + rc.color + '20;color:' + rc.color + ';font-weight:700">' + rc.icon + ' ' + rc.name + ' (' + wins + '&#xC2B9;)</span>';
    });
    html += '</div>';
    html += '<div style="text-align:center"><button id="raceStartBtn" onclick="window._v15StartRace&&window._v15StartRace()" style="padding:8px 24px;background:linear-gradient(135deg,#FF5FA2,#B066FF);color:#fff;border:none;border-radius:12px;font-size:13px;font-weight:700;cursor:pointer">&#x1F3C1; &#xB808;&#xC774;&#xC2A4; &#xC2DC;&#xC791;!</button></div>';
    return html;
  });

  setTimeout(function(){
    var canvas = document.getElementById('raceCanvas');
    if(!canvas) return;
    var ctx = canvas.getContext('2d');
    var W = 420, H = 240;
    var positions = [0,0,0,0,0,0];
    var racing = false;
    var animId = null;
    var finishLine = W - 60;
    var winner = -1;

    function drawTrack(){
      ctx.fillStyle = '#2d1040';
      ctx.fillRect(0,0,W,H);
      for(var i=0;i<6;i++){
        var y = 10 + i * 38;
        ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,.05)' : 'rgba(255,255,255,.02)';
        ctx.fillRect(0,y,W,36);
        ctx.strokeStyle = 'rgba(255,255,255,.1)';
        ctx.setLineDash([4,4]);
        ctx.beginPath();
        ctx.moveTo(0,y+36);
        ctx.lineTo(W,y+36);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(finishLine,0);
      ctx.lineTo(finishLine,H);
      ctx.stroke();
      ctx.lineWidth = 1;
    }

    function drawRacers(){
      for(var i=0;i<6;i++){
        var y = 10 + i * 38 + 18;
        var x = 30 + positions[i];
        ctx.font = '20px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(RACERS[i].icon, x, y);
        ctx.font = 'bold 9px sans-serif';
        ctx.fillStyle = RACERS[i].color;
        ctx.fillText(RACERS[i].name, x, y + 14);
      }
    }

    function raceStep(){
      if(!racing) return;
      drawTrack();
      var done = false;
      for(var i=0;i<6;i++){
        positions[i] += (Math.random() * 3 + 0.5) * RACERS[i].speed;
        if(positions[i] >= finishLine - 30 && winner === -1){
          winner = i;
          done = true;
        }
      }
      drawRacers();
      if(done){
        racing = false;
        ctx.fillStyle = 'rgba(0,0,0,.5)';
        ctx.fillRect(0,H/2-30,W,60);
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('&#x1F3C6; &#xC6B0;&#xC2B9;: ' + RACERS[winner].icon + ' ' + RACERS[winner].name + '!', W/2, H/2+5);
        var rd = getRacingData();
        rd.totalRaces++;
        if(!rd.wins[RACERS[winner].id]) rd.wins[RACERS[winner].id] = 0;
        rd.wins[RACERS[winner].id]++;
        saveRacingData(rd);
        checkAndAwardV15();
        document.getElementById('raceStartBtn').textContent = '&#x1F3C1; &#xB2E4;&#xC2DC; &#xB808;&#xC774;&#xC2A4;!';
        return;
      }
      animId = requestAnimationFrame(raceStep);
    }

    window._v15StartRace = function(){
      positions = [0,0,0,0,0,0];
      winner = -1;
      racing = true;
      if(animId) cancelAnimationFrame(animId);
      sfxV15('race_start');
      document.getElementById('raceStartBtn').textContent = '&#xC9C4;&#xD589;&#xC911;...';
      raceStep();
    };

    drawTrack();
    drawRacers();
  }, 80);
}


// ============================================================
// 7. MUSIC STUDIO (&#xC74C;&#xC545; &#xC2A4;&#xD29C;&#xB514;&#xC624;) - Shift+M
// ============================================================
var PIANO_NOTES = [
  {note:'C4',freq:261.63,label:'&#xB3C4;'},
  {note:'D4',freq:293.66,label:'&#xB808;'},
  {note:'E4',freq:329.63,label:'&#xBBF8;'},
  {note:'F4',freq:349.23,label:'&#xD30C;'},
  {note:'G4',freq:392.00,label:'&#xC194;'},
  {note:'A4',freq:440.00,label:'&#xB77C;'},
  {note:'B4',freq:493.88,label:'&#xC2DC;'},
  {note:'C5',freq:523.25,label:'&#xB3C4;&#x2191;'},
  {note:'D5',freq:587.33,label:'&#xB808;&#x2191;'},
  {note:'E5',freq:659.25,label:'&#xBBF8;&#x2191;'}
];

function getStudioData(){
  return v15Load('v15_studio', {melodies:[],currentMelody:[]});
}
function saveStudioData(d){ v15Save('v15_studio', d); }

function playNote(freq){
  _v15InitAudio();
  if(!_v15Ctx) return;
  try{
    var muted = false;
    try{ muted = localStorage.getItem('hatcuping_mute') === '1'; }catch(e){}
    if(muted) return;
    var osc = _v15Ctx.createOscillator();
    var gain = _v15Ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.value = 0.1;
    gain.gain.exponentialRampToValueAtTime(0.001, _v15Ctx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(_v15Ctx.destination);
    osc.start();
    osc.stop(_v15Ctx.currentTime + 0.5);
  }catch(e){}
}

function openMusicStudio(){
  trackV15Feature('studio');
  sfxV15('studio_note');
  var d = getStudioData();

  createV15Modal('studioModal', '&#x1F3B9; &#xC74C;&#xC545; &#xC2A4;&#xD29C;&#xB514;&#xC624;', function(){
    var html = '';
    html += '<div style="margin-bottom:10px;text-align:center;font-size:11px;color:var(--text-sub)">&#xAC74;&#xBC18;&#xC744; &#xB20C;&#xB7EC; &#xC5F0;&#xC8FC;&#xD558;&#xC138;&#xC694;! &#xB179;&#xC74C; &amp; &#xC7AC;&#xC0DD;&#xB3C4; &#xAC00;&#xB2A5;!</div>';
    html += '<div id="pianoKeys" style="display:flex;gap:3px;justify-content:center;margin-bottom:12px">';
    var keyColors = ['#FF5FA2','#FF7EB3','#FFB6C1','#DDA0DD','#B066FF','#9C27B0','#7B1FA2','#FF5FA2','#FF7EB3','#FFB6C1'];
    PIANO_NOTES.forEach(function(pn, idx){
      html += '<button onclick="(function(){window._v15PlayNote&&window._v15PlayNote(' + pn.freq + ',' + idx + ');})()" style="width:38px;height:80px;border-radius:0 0 8px 8px;border:2px solid ' + keyColors[idx] + ';background:linear-gradient(180deg,#fff,' + keyColors[idx] + '20);font-size:11px;font-weight:700;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;padding-bottom:6px;color:' + keyColors[idx] + '">' + pn.label + '</button>';
    });
    html += '</div>';

    html += '<div style="display:flex;gap:6px;justify-content:center;margin-bottom:10px">';
    html += '<button id="studioRecBtn" onclick="window._v15ToggleRecord&&window._v15ToggleRecord()" style="padding:6px 14px;background:#F44336;color:#fff;border:none;border-radius:10px;font-size:11px;font-weight:700;cursor:pointer">&#x23FA;&#xFE0F; &#xB179;&#xC74C;</button>';
    html += '<button onclick="window._v15PlayMelody&&window._v15PlayMelody()" style="padding:6px 14px;background:#4CAF50;color:#fff;border:none;border-radius:10px;font-size:11px;font-weight:700;cursor:pointer">&#x25B6;&#xFE0F; &#xC7AC;&#xC0DD;</button>';
    html += '<button onclick="window._v15SaveMelody&&window._v15SaveMelody()" style="padding:6px 14px;background:#2196F3;color:#fff;border:none;border-radius:10px;font-size:11px;font-weight:700;cursor:pointer">&#x1F4BE; &#xC800;&#xC7A5;</button>';
    html += '</div>';

    html += '<div id="melodyDisplay" style="padding:8px;border-radius:10px;background:rgba(0,0,0,.04);min-height:30px;font-size:11px;color:var(--text-sub);text-align:center">&#xB179;&#xC74C; &#xBC84;&#xD2BC;&#xC744; &#xB204;&#xB974;&#xACE0; &#xC5F0;&#xC8FC;&#xD558;&#xC138;&#xC694;</div>';

    if(d.melodies && d.melodies.length > 0){
      html += '<div style="margin-top:8px;font-size:11px;font-weight:700">&#x1F4BE; &#xC800;&#xC7A5;&#xB41C; &#xBA5C;&#xB85C;&#xB514; (' + d.melodies.length + '&#xAC1C;)</div>';
      html += '<div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:4px">';
      d.melodies.forEach(function(mel, mIdx){
        html += '<button onclick="window._v15LoadMelody&&window._v15LoadMelody(' + mIdx + ')" style="padding:3px 8px;border-radius:8px;border:1px solid rgba(0,0,0,.1);background:rgba(0,0,0,.03);font-size:10px;cursor:pointer">&#x1F3B5; #' + (mIdx+1) + '</button>';
      });
      html += '</div>';
    }
    return html;
  });

  setTimeout(function(){
    var recording = false;
    var currentMelody = [];

    window._v15PlayNote = function(freq, idx){
      playNote(freq);
      if(recording){
        currentMelody.push({freq:freq,idx:idx,label:PIANO_NOTES[idx].label});
        var display = document.getElementById('melodyDisplay');
        if(display){
          var labels = currentMelody.map(function(n){return n.label;});
          display.textContent = labels.join(' - ');
        }
      }
    };

    window._v15ToggleRecord = function(){
      recording = !recording;
      var btn = document.getElementById('studioRecBtn');
      if(recording){
        currentMelody = [];
        if(btn) btn.innerHTML = '&#x23F9;&#xFE0F; &#xC815;&#xC9C0;';
        if(btn) btn.style.background = '#FF9800';
        var display = document.getElementById('melodyDisplay');
        if(display) display.textContent = '&#xB179;&#xC74C;&#xC911;...';
      } else {
        if(btn) btn.innerHTML = '&#x23FA;&#xFE0F; &#xB179;&#xC74C;';
        if(btn) btn.style.background = '#F44336';
      }
    };

    window._v15PlayMelody = function(){
      if(currentMelody.length === 0) return;
      var i = 0;
      var interval = setInterval(function(){
        if(i >= currentMelody.length){ clearInterval(interval); return; }
        playNote(currentMelody[i].freq);
        i++;
      }, 300);
    };

    window._v15SaveMelody = function(){
      if(currentMelody.length === 0) return;
      var sd = getStudioData();
      sd.melodies.push(currentMelody.slice());
      saveStudioData(sd);
      showToastV15('&#x1F3B5; &#xBA5C;&#xB85C;&#xB514; &#xC800;&#xC7A5;&#xB428;!');
      checkAndAwardV15();
    };

    window._v15LoadMelody = function(idx){
      var sd = getStudioData();
      if(sd.melodies && sd.melodies[idx]){
        currentMelody = sd.melodies[idx].slice();
        var display = document.getElementById('melodyDisplay');
        if(display){
          var labels = currentMelody.map(function(n){return n.label;});
          display.textContent = labels.join(' - ');
        }
      }
    };
  }, 80);
}


// ============================================================
// 8. ENCYCLOPEDIA V2 (&#xBC31;&#xACFC;&#xC0AC;&#xC804; v2) - Shift+E
// ============================================================
var ENCYC_DATA = {
  '&#xCE90;&#xB9AD;&#xD130;': [
    {name:'&#xB85C;&#xBBF8;',desc:'&#xC0AC;&#xB791;&#xC758; &#xD558;&#xCE04;&#xD551;&#xC758; &#xC8FC;&#xC778;&#xACF5;. &#xBC1D;&#xACE0; &#xC6A9;&#xAC10;&#xD55C; &#xC18C;&#xB140;.'},
    {name:'&#xD558;&#xCE04;&#xD551;',desc:'&#xC0AC;&#xB791;&#xC758; &#xAC10;&#xC815;&#xC744; &#xB2F4;&#xB2F9;&#xD558;&#xB294; &#xD2F0;&#xB2C8;&#xD551;. &#xB85C;&#xBBF8;&#xC758; &#xCE5C;&#xAD6C;.'},
    {name:'&#xC6A9;&#xAE30;&#xD551;',desc:'&#xC6A9;&#xAE30;&#xC758; &#xAC10;&#xC815;&#xC744; &#xB2F4;&#xB2F9;. &#xAC15;&#xC778;&#xD55C; &#xCCB4;&#xB825;&#xC758; &#xC18C;&#xC720;&#xC790;.'},
    {name:'&#xD589;&#xBCF5;&#xD551;',desc:'&#xD589;&#xBCF5;&#xC758; &#xAC10;&#xC815;&#xC744; &#xB2F4;&#xB2F9;. &#xD56D;&#xC0C1; &#xC6C3;&#xB294; &#xC5BC;&#xAD74;.'},
    {name:'&#xC9C0;&#xD61C;&#xD551;',desc:'&#xC9C0;&#xD61C;&#xC758; &#xAC10;&#xC815;&#xC744; &#xB2F4;&#xB2F9;. &#xCC45;&#xC744; &#xC0AC;&#xB791;&#xD558;&#xB294; &#xD2F0;&#xB2C8;&#xD551;.'},
    {name:'&#xAFC8;&#xD551;',desc:'&#xAFC8;&#xC758; &#xAC10;&#xC815;&#xC744; &#xB2F4;&#xB2F9;. &#xBAA8;&#xB4E0; &#xAFC8;&#xC744; &#xC751;&#xC6D0;&#xD558;&#xB294; &#xD2F0;&#xB2C8;&#xD551;.'},
    {name:'&#xCC29;&#xD551;',desc:'&#xCE5C;&#xC808;&#xC758; &#xAC10;&#xC815;&#xC744; &#xB2F4;&#xB2F9;. &#xB530;&#xB73B;&#xD55C; &#xB9C8;&#xC74C;&#xC758; &#xC18C;&#xC720;&#xC790;.'},
    {name:'&#xD654;&#xB0B4;&#xD551;',desc:'&#xBD84;&#xB178;&#xC758; &#xAC10;&#xC815;&#xC744; &#xB2F4;&#xB2F9;&#xD558;&#xB294; &#xD2B8;&#xB7EC;&#xD551;.'},
    {name:'&#xBCC4;&#xBE5B;&#xD551;',desc:'&#xC804;&#xC124;&#xC758; &#xD2F0;&#xB2C8;&#xD551;. &#xBCC4;&#xC758; &#xD798;&#xC744; &#xC9C0;&#xB2CC;&#xB2E4;.'},
    {name:'&#xBB34;&#xC9C0;&#xAC1C;&#xD551;',desc:'&#xC804;&#xC124;&#xC758; &#xD2F0;&#xB2C8;&#xD551;. &#xBB34;&#xC9C0;&#xAC1C;&#xC758; &#xD798;&#xC744; &#xC9C0;&#xB2CC;&#xB2E4;.'}
  ],
  '&#xC544;&#xC774;&#xD15C;': [
    {name:'&#xD558;&#xD2B8;&#xC7A0;&#xC790;&#xB9AC;',desc:'&#xD558;&#xCE04;&#xD551;&#xC744; &#xC7A0;&#xC5D0;&#xC11C; &#xAE68;&#xC6B0;&#xB294; &#xB9C8;&#xBC95;&#xC758; &#xC7A0;&#xC790;&#xB9AC;.'},
    {name:'&#xAC10;&#xC815;&#xC758;&#xBCF4;&#xC11D;',desc:'&#xAC10;&#xC815;&#xC758; &#xD798;&#xC774; &#xB2F4;&#xAE34; &#xBC18;&#xC9DD;&#xC774;&#xB294; &#xBCF4;&#xC11D;.'},
    {name:'&#xC6A9;&#xAE30;&#xC758;&#xBCC4;',desc:'&#xC6A9;&#xAE30;&#xB97C; &#xBD80;&#xC5EC;&#xD558;&#xB294; &#xBCC4; &#xBAA8;&#xC591;&#xC758; &#xC544;&#xC774;&#xD15C;.'},
    {name:'&#xC9C0;&#xD61C;&#xC758;&#xCC45;',desc:'&#xC9C0;&#xD61C;&#xD551;&#xC774; &#xAC00;&#xC7A5; &#xC88B;&#xC544;&#xD558;&#xB294; &#xB9C8;&#xBC95;&#xC758; &#xCC45;.'},
    {name:'&#xAFC8;&#xC758;&#xC5F4;&#xC1E0;',desc:'&#xAFC8;&#xC758; &#xC138;&#xACC4;&#xB85C; &#xB4E4;&#xC5B4;&#xAC00;&#xB294; &#xD669;&#xAE08; &#xC5F4;&#xC1E0;.'},
    {name:'&#xBB34;&#xC9C0;&#xAC1C;&#xBD93;',desc:'&#xBB34;&#xC9C0;&#xAC1C;&#xC758; &#xD798;&#xC774; &#xB2F4;&#xAE34; &#xB9C8;&#xBC95;&#xC758; &#xBD93;.'},
    {name:'&#xBCC4;&#xBE5B;&#xBC18;&#xC9C0;',desc:'&#xBCC4;&#xBE5B;&#xC758; &#xD798;&#xC744; &#xBC1C;&#xD718;&#xD558;&#xB294; &#xB9C8;&#xBC95; &#xBC18;&#xC9C0;.'},
    {name:'&#xC0AC;&#xB791;&#xC758;&#xD380;&#xB358;&#xD2B8;',desc:'&#xC0AC;&#xB791;&#xC758; &#xD798;&#xC744; &#xC99D;&#xD3ED;&#xD558;&#xB294; &#xD380;&#xB358;&#xD2B8;.'},
    {name:'&#xD68C;&#xBCF5;&#xC758;&#xBB3C;&#xC57D;',desc:'&#xCCB4;&#xB825;&#xC744; &#xD68C;&#xBCF5;&#xD558;&#xB294; &#xC2E0;&#xBE44;&#xD55C; &#xBB3C;&#xC57D;.'},
    {name:'&#xB9C8;&#xBC95;&#xBD80;&#xCC44;',desc:'&#xD2F0;&#xB2C8;&#xD551;&#xC758; &#xD798;&#xC744; &#xBAA8;&#xC73C;&#xB294; &#xB9C8;&#xBC95; &#xBD80;&#xCC44;.'}
  ],
  '&#xC7A5;&#xC18C;': [
    {name:'&#xC774;&#xBAA8;&#xC158; &#xC655;&#xAD6D;',desc:'&#xD2F0;&#xB2C8;&#xD551;&#xB4E4;&#xC774; &#xC0AC;&#xB294; &#xAC10;&#xC815;&#xC758; &#xC655;&#xAD6D;.'},
    {name:'&#xD558;&#xD2B8;&#xD3EC;&#xB808;&#xC2A4;&#xD2B8;',desc:'&#xC0AC;&#xB791;&#xC758; &#xD798;&#xC73C;&#xB85C; &#xAC00;&#xB4DD;&#xD55C; &#xC228;.'},
    {name:'&#xBCC4;&#xBE5B; &#xD0D1;',desc:'&#xBCC4;&#xC758; &#xD798;&#xC774; &#xBAA8;&#xC774;&#xB294; &#xC2E0;&#xBE44;&#xD55C; &#xD0D1;.'},
    {name:'&#xBB34;&#xC9C0;&#xAC1C; &#xB2E4;&#xB9AC;',desc:'&#xC774;&#xBAA8;&#xC158; &#xC655;&#xAD6D;&#xACFC; &#xC778;&#xAC04; &#xC138;&#xACC4;&#xB97C; &#xC787;&#xB294; &#xB2E4;&#xB9AC;.'},
    {name:'&#xAFC8;&#xC758; &#xC815;&#xC6D0;',desc:'&#xAFC8;&#xD551;&#xC774; &#xAD00;&#xB9AC;&#xD558;&#xB294; &#xC544;&#xB984;&#xB2E4;&#xC6B4; &#xC815;&#xC6D0;.'},
    {name:'&#xC6A9;&#xAE30;&#xC758; &#xC544;&#xB808;&#xB098;',desc:'&#xC6A9;&#xAE30;&#xD551;&#xC774; &#xC218;&#xB828;&#xD558;&#xB294; &#xD6C8;&#xB828;&#xC7A5;.'},
    {name:'&#xC9C0;&#xD61C;&#xC758; &#xB3C4;&#xC11C;&#xAD00;',desc:'&#xC9C0;&#xD61C;&#xD551;&#xC774; &#xC6B4;&#xC601;&#xD558;&#xB294; &#xAC70;&#xB300;&#xD55C; &#xB3C4;&#xC11C;&#xAD00;.'},
    {name:'&#xD589;&#xBCF5; &#xAD11;&#xC7A5;',desc:'&#xD589;&#xBCF5;&#xD551;&#xC774; &#xBAA8;&#xB450;&#xB97C; &#xC6C3;&#xAC8C; &#xD558;&#xB294; &#xAD11;&#xC7A5;.'},
    {name:'&#xC5B4;&#xB460;&#xC758; &#xC131;',desc:'&#xD2B8;&#xB7EC;&#xD551;&#xB4E4;&#xC774; &#xBAA8;&#xC774;&#xB294; &#xC5B4;&#xB450;&#xC6B4; &#xC131;.'},
    {name:'&#xAE30;&#xC801;&#xC758; &#xC131;&#xC804;',desc:'&#xBAA8;&#xB4E0; &#xC774;&#xC57C;&#xAE30;&#xAC00; &#xC2DC;&#xC791;&#xB418;&#xB294; &#xC131;&#xC804;.'}
  ],
  '&#xC2A4;&#xD0AC;': [
    {name:'&#xD558;&#xD2B8;&#xBE44;&#xBE54;',desc:'&#xD558;&#xCE04;&#xD551;&#xC758; &#xC0AC;&#xB791;&#xC758; &#xBE5B;&#xC744; &#xBC1C;&#xC0AC;&#xD558;&#xB294; &#xAE30;&#xC220;.'},
    {name:'&#xC6A9;&#xAE30;&#xC758;&#xBD88;&#xAF43;',desc:'&#xC6A9;&#xAE30;&#xD551;&#xC758; &#xBD88;&#xAF43; &#xACF5;&#xACA9; &#xAE30;&#xC220;.'},
    {name:'&#xD589;&#xBCF5;&#xC758;&#xB178;&#xB798;',desc:'&#xD589;&#xBCF5;&#xD551;&#xC758; &#xD68C;&#xBCF5; &#xB178;&#xB798; &#xAE30;&#xC220;.'},
    {name:'&#xBCC4;&#xBE5B;&#xC9C0;&#xC2DD;',desc:'&#xC9C0;&#xD61C;&#xD551;&#xC758; &#xC9C0;&#xC2DD; &#xACF5;&#xACA9; &#xAE30;&#xC220;.'},
    {name:'&#xAFC8;&#xC758;&#xB098;&#xB798;',desc:'&#xAFC8;&#xD551;&#xC758; &#xC7A0;&#xC7AC;&#xC6B0;&#xB294; &#xB178;&#xB798; &#xAE30;&#xC220;.'},
    {name:'&#xB530;&#xB73B;&#xD55C;&#xC190;&#xAE38;',desc:'&#xCC29;&#xD551;&#xC758; &#xCE58;&#xC720;&#xC758; &#xC190;&#xAE38; &#xAE30;&#xC220;.'},
    {name:'&#xBD84;&#xB178;&#xD3ED;&#xBC1C;',desc:'&#xD654;&#xB0B4;&#xD551;&#xC758; &#xAC15;&#xB825;&#xD55C; &#xD3ED;&#xBC1C; &#xACF5;&#xACA9;.'},
    {name:'&#xB208;&#xBB3C;&#xBE44;',desc:'&#xC2AC;&#xD504;&#xD551;&#xC758; &#xC2AC;&#xD514;&#xC758; &#xBE44; &#xACF5;&#xACA9;.'},
    {name:'&#xC720;&#xC131;&#xC6B0;&#xC8FC;&#xBE54;',desc:'&#xBCC4;&#xBE5B;&#xD551;&#xC758; &#xAD81;&#xADF9;&#xAE30; &#xACF5;&#xACA9;.'},
    {name:'&#xC77C;&#xACF1;&#xD3ED;&#xD48D;',desc:'&#xBB34;&#xC9C0;&#xAC1C;&#xD551;&#xC758; &#xAD81;&#xADF9;&#xAE30; &#xACF5;&#xACA9;.'}
  ],
  '&#xC2A4;&#xD1A0;&#xB9AC;': [
    {name:'&#xC2DC;&#xC98C;1: &#xB9CC;&#xB0A8;',desc:'&#xB85C;&#xBBF8;&#xC640; &#xD558;&#xCE04;&#xD551;&#xC758; &#xCCAB; &#xB9CC;&#xB0A8; &#xC774;&#xC57C;&#xAE30;.'},
    {name:'&#xC2DC;&#xC98C;2: &#xC655;&#xAD6D;&#xC758;&#xBE44;&#xBC00;',desc:'&#xC774;&#xBAA8;&#xC158; &#xC655;&#xAD6D;&#xC758; &#xBE44;&#xBC00;&#xC744; &#xC54C;&#xAC8C; &#xB418;&#xB294; &#xC774;&#xC57C;&#xAE30;.'},
    {name:'&#xC2DC;&#xC98C;3: &#xD2B8;&#xB7EC;&#xD551;',desc:'&#xD2B8;&#xB7EC;&#xD551;&#xC758; &#xC2B5;&#xACA9;&#xC5D0; &#xB9DE;&#xC11C;&#xB294; &#xC774;&#xC57C;&#xAE30;.'},
    {name:'&#xC2DC;&#xC98C;4: &#xC131;&#xC7A5;',desc:'&#xC6A9;&#xAE30;&#xD551;&#xACFC; &#xD589;&#xBCF5;&#xD551;&#xC758; &#xC131;&#xC7A5; &#xC774;&#xC57C;&#xAE30;.'},
    {name:'&#xC2DC;&#xC98C;5: &#xC5B4;&#xB460;&#xC758;&#xC655;',desc:'&#xC5B4;&#xB460;&#xC758; &#xC655; &#xBD80;&#xD65C;&#xACFC; &#xC704;&#xAE30; &#xC774;&#xC57C;&#xAE30;.'},
    {name:'&#xC2DC;&#xC98C;6: &#xC6B0;&#xC815;',desc:'&#xC6B0;&#xC815;&#xC73C;&#xB85C; &#xC704;&#xAE30;&#xB97C; &#xADF9;&#xBCF5;&#xD558;&#xB294; &#xC774;&#xC57C;&#xAE30;.'},
    {name:'&#xC2DC;&#xC98C;7: &#xC804;&#xC124;',desc:'&#xC804;&#xC124;&#xC758; &#xD2F0;&#xB2C8;&#xD551; &#xB4F1;&#xC7A5; &#xC774;&#xC57C;&#xAE30;.'},
    {name:'&#xC2DC;&#xC98C;8: &#xCD95;&#xC81C;',desc:'&#xC774;&#xBAA8;&#xC158; &#xC655;&#xAD6D; &#xCD95;&#xC81C; &#xC774;&#xC57C;&#xAE30;.'},
    {name:'&#xADF9;&#xC7A5;&#xD310;1',desc:'&#xC0AC;&#xB791;&#xC758; &#xB9C8;&#xBC95; &#xADF9;&#xC7A5;&#xD310; &#xC774;&#xC57C;&#xAE30;.'},
    {name:'&#xADF9;&#xC7A5;&#xD310;2',desc:'&#xC601;&#xC6D0;&#xD55C; &#xC6B0;&#xC815; &#xADF9;&#xC7A5;&#xD310; &#xC774;&#xC57C;&#xAE30;.'}
  ],
  '&#xC2DC;&#xC2A4;&#xD15C;': [
    {name:'&#xD000;&#xC988; &#xC2DC;&#xC2A4;&#xD15C;',desc:'&#xC9C8;&#xBB38;&#xC5D0; &#xB2F5;&#xD558;&#xC5EC; &#xC9C0;&#xC2DD;&#xC744; &#xD14C;&#xC2A4;&#xD2B8;&#xD558;&#xB294; &#xC2DC;&#xC2A4;&#xD15C;.'},
    {name:'&#xC5C5;&#xC801; &#xC2DC;&#xC2A4;&#xD15C;',desc:'&#xB2E4;&#xC591;&#xD55C; &#xBAA9;&#xD45C;&#xB97C; &#xB2EC;&#xC131;&#xD558;&#xBA74; &#xBCF4;&#xC0C1;&#xC744; &#xBC1B;&#xB294; &#xC2DC;&#xC2A4;&#xD15C;.'},
    {name:'&#xB808;&#xBCA8; &#xC2DC;&#xC2A4;&#xD15C;',desc:'&#xACBD;&#xD5D8;&#xCE58;&#xB97C; &#xBAA8;&#xC544; &#xB808;&#xBCA8;&#xC744; &#xC62C;&#xB9AC;&#xB294; &#xC2DC;&#xC2A4;&#xD15C;.'},
    {name:'&#xC694;&#xB9AC; &#xC2DC;&#xC2A4;&#xD15C;',desc:'&#xB2E4;&#xC591;&#xD55C; &#xC694;&#xB9AC;&#xB97C; &#xB9CC;&#xB4E4;&#xC5B4; &#xACBD;&#xD5D8;&#xCE58;&#xB97C; &#xC5BB;&#xB294; &#xC2DC;&#xC2A4;&#xD15C;.'},
    {name:'&#xCF54;&#xC2A4;&#xD280; &#xC2DC;&#xC2A4;&#xD15C;',desc:'&#xCE90;&#xB9AD;&#xD130;&#xC758; &#xC678;&#xD615;&#xC744; &#xBCC0;&#xACBD;&#xD558;&#xB294; &#xC2DC;&#xC2A4;&#xD15C;.'},
    {name:'&#xC2A4;&#xD0AC;&#xD2B8;&#xB9AC;',desc:'&#xC2A4;&#xD0AC; &#xD3EC;&#xC778;&#xD2B8;&#xB85C; &#xB2A5;&#xB825;&#xC744; &#xD574;&#xAE08;&#xD558;&#xB294; &#xC2DC;&#xC2A4;&#xD15C;.'},
    {name:'&#xC6B0;&#xCCB4;&#xD1B5;',desc:'&#xD2F0;&#xB2C8;&#xD551;&#xC73C;&#xB85C;&#xBD80;&#xD130; &#xD3B8;&#xC9C0;&#xB97C; &#xBC1B;&#xB294; &#xC2DC;&#xC2A4;&#xD15C;.'},
    {name:'&#xC6B4;&#xC138;',desc:'&#xB9E4;&#xC77C; &#xB2EC;&#xB77C;&#xC9C0;&#xB294; &#xC6B4;&#xC138;&#xB97C; &#xD655;&#xC778;&#xD558;&#xB294; &#xC2DC;&#xC2A4;&#xD15C;.'},
    {name:'&#xD3AB; &#xB808;&#xC774;&#xC2F1;',desc:'&#xD3AB;&#xB4E4;&#xC774; &#xACBD;&#xC8FC;&#xD558;&#xB294; &#xBBF8;&#xB2C8;&#xAC8C;&#xC784; &#xC2DC;&#xC2A4;&#xD15C;.'},
    {name:'&#xC74C;&#xC545; &#xC2A4;&#xD29C;&#xB514;&#xC624;',desc:'&#xD53C;&#xC544;&#xB178;&#xB97C; &#xC5F0;&#xC8FC;&#xD558;&#xACE0; &#xBA5C;&#xB85C;&#xB514;&#xB97C; &#xC800;&#xC7A5;&#xD558;&#xB294; &#xC2DC;&#xC2A4;&#xD15C;.'}
  ]
};

function getEncycData(){
  return v15Load('v15_encyc', {viewed:[]});
}
function saveEncycData(d){ v15Save('v15_encyc', d); }

function openEncyclopedia(){
  trackV15Feature('encyclopedia');
  sfxV15('encyc_open');
  var d = getEncycData();
  var totalItems = 0;
  var categories = Object.keys(ENCYC_DATA);
  categories.forEach(function(cat){ totalItems += ENCYC_DATA[cat].length; });

  createV15Modal('encycModal', '&#x1F4D6; &#xBC31;&#xACFC;&#xC0AC;&#xC804; v2 (' + d.viewed.length + '/' + totalItems + ')', function(){
    var html = '';
    html += '<div style="margin-bottom:10px"><input id="encycSearch" type="text" placeholder="&#xAC80;&#xC0C9;&#xC5B4; &#xC785;&#xB825;..." style="width:100%;padding:8px 12px;border:2px solid rgba(0,0,0,.1);border-radius:10px;font-size:12px;box-sizing:border-box" oninput="(function(v){document.querySelectorAll(&#x27;[data-encyc-item]&#x27;).forEach(function(el){el.style.display=el.dataset.encycItem.indexOf(v)!==-1?&#x27;block&#x27;:&#x27;none&#x27;});})(this.value)"></div>';

    categories.forEach(function(cat, catIdx){
      var catColor = ['#FF5FA2','#9C27B0','#2196F3','#FF9800','#4CAF50','#607D8B'][catIdx];
      html += '<div style="margin-bottom:10px"><div style="font-size:12px;font-weight:800;color:' + catColor + ';margin-bottom:6px;padding:4px 10px;background:' + catColor + '15;border-radius:8px;display:inline-block">' + cat + ' (' + ENCYC_DATA[cat].length + ')</div>';
      html += '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:6px">';
      ENCYC_DATA[cat].forEach(function(item, itemIdx){
        var itemKey = cat + '_' + itemIdx;
        var viewed = d.viewed.indexOf(itemKey) !== -1;
        html += '<div data-encyc-item="' + item.name + item.desc + '" style="padding:8px;border-radius:10px;background:' + (viewed ? catColor + '08' : 'rgba(0,0,0,.03)') + ';border-left:3px solid ' + (viewed ? catColor : '#ddd') + ';cursor:pointer" onclick="(function(){var d=JSON.parse(localStorage.getItem(&#x27;v15_encyc&#x27;)||&#x27;{}&#x27;)||{};if(!d.viewed)d.viewed=[];var k=&#x27;' + itemKey + '&#x27;;if(d.viewed.indexOf(k)===-1)d.viewed.push(k);localStorage.setItem(&#x27;v15_encyc&#x27;,JSON.stringify(d));this.style.borderLeftColor=&#x27;' + catColor + '&#x27;}).call(this)">';
        html += '<div style="font-size:11px;font-weight:700">' + item.name + '</div>';
        html += '<div style="font-size:10px;color:var(--text-sub);line-height:1.4">' + item.desc + '</div>';
        html += '</div>';
      });
      html += '</div></div>';
    });
    return html;
  });
}


// ============================================================
// V15 ACHIEVEMENTS (+12, 106->118)
// ============================================================
var V15_ACHIEVEMENTS = [
  {id:'a_v15_cook_first',name:'&#xCD08;&#xBCF4; &#xC170;&#xD504;',desc:'&#xCCAB; &#xC694;&#xB9AC; &#xC644;&#xC131;',cat:'general',icon:'&#x1F373;'},
  {id:'a_v15_cook_all',name:'&#xC694;&#xB9AC;&#xC758; &#xB2EC;&#xC778;',desc:'12&#xC885; &#xC694;&#xB9AC; &#xC804;&#xBD80; &#xC644;&#xC131;',cat:'general',icon:'&#x1F468;&#x200D;&#x1F373;'},
  {id:'a_v15_costume_5',name:'&#xD328;&#xC158;&#xC758; &#xC2DC;&#xC791;',desc:'&#xCF54;&#xC2A4;&#xD280; 5&#xAC1C; &#xC218;&#xC9D1;',cat:'general',icon:'&#x1F457;'},
  {id:'a_v15_costume_all',name:'&#xCF54;&#xC2A4;&#xD280; &#xB9C8;&#xC2A4;&#xD130;',desc:'12&#xC885; &#xCF54;&#xC2A4;&#xD280; &#xC804;&#xBD80; &#xC218;&#xC9D1;',cat:'general',icon:'&#x1F451;'},
  {id:'a_v15_skill_3',name:'&#xC2A4;&#xD0AC; &#xC785;&#xBB38;',desc:'&#xC2A4;&#xD0AC; 3&#xAC1C; &#xC2B5;&#xB4DD;',cat:'general',icon:'&#x1F333;'},
  {id:'a_v15_skill_all',name:'&#xC2A4;&#xD0AC; &#xB9C8;&#xC2A4;&#xD130;',desc:'12&#xAC1C; &#xC2A4;&#xD0AC; &#xC804;&#xBD80; &#xC2B5;&#xB4DD;',cat:'general',icon:'&#x1F31F;'},
  {id:'a_v15_mail_6',name:'&#xD3B8;&#xC9C0; &#xC218;&#xC9D1;&#xAC00;',desc:'&#xD3B8;&#xC9C0; 6&#xD1B5; &#xC77D;&#xAE30;',cat:'general',icon:'&#x1F4EC;'},
  {id:'a_v15_fortune',name:'&#xC6B4;&#xC138; &#xD655;&#xC778;',desc:'&#xCCAB; &#xC6B4;&#xC138; &#xD655;&#xC778;',cat:'general',icon:'&#x1F52E;'},
  {id:'a_v15_race_5',name:'&#xB808;&#xC774;&#xC2F1; &#xD314;',desc:'&#xB808;&#xC774;&#xC2A4; 5&#xD68C; &#xCC38;&#xC5EC;',cat:'general',icon:'&#x1F3C7;'},
  {id:'a_v15_melody',name:'&#xCCAB; &#xBA5C;&#xB85C;&#xB514;',desc:'&#xBA5C;&#xB85C;&#xB514; &#xCCAB; &#xC800;&#xC7A5;',cat:'general',icon:'&#x1F3B9;'},
  {id:'a_v15_encyc_30',name:'&#xBC31;&#xACFC;&#xC0AC;&#xC804; &#xD0D0;&#xD5D8;',desc:'&#xBC31;&#xACFC;&#xC0AC;&#xC804; 30&#xD56D;&#xBAA9; &#xC5F4;&#xB78C;',cat:'general',icon:'&#x1F4D6;'},
  {id:'a_v15_explorer',name:'v15 &#xD0D0;&#xD5D8;&#xAC00;',desc:'v15 &#xAE30;&#xB2A5; 6&#xAC1C; &#xC774;&#xC0C1; &#xCCB4;&#xD5D8;',cat:'general',icon:'&#x1F680;'}
];

function injectV15Achievements(){
  if(!window.AD) return;
  V15_ACHIEVEMENTS.forEach(function(a){
    var exists = false;
    for(var i=0;i<window.AD.length;i++){
      if(window.AD[i].id === a.id){ exists = true; break; }
    }
    if(!exists) window.AD.push(a);
  });
}

function checkAndAwardV15(){
  try{
    var a = JSON.parse(localStorage.getItem('hatcuping_achievements') || '{}');

    var cookData = getCookingData();
    if(cookData.totalCooks > 0 && !a.a_v15_cook_first){
      a.a_v15_cook_first = Date.now();
      showToastV15('&#x1F3C6; &#xCD08;&#xBCF4; &#xC170;&#xD504; &#xC5C5;&#xC801; &#xB2EC;&#xC131;!');
    }
    var cookedAll = true;
    RECIPES.forEach(function(rc){ if(!cookData.cooked || !cookData.cooked[rc.id]) cookedAll = false; });
    if(cookedAll && !a.a_v15_cook_all){
      a.a_v15_cook_all = Date.now();
      showToastV15('&#x1F3C6; &#xC694;&#xB9AC;&#xC758; &#xB2EC;&#xC778; &#xC5C5;&#xC801; &#xB2EC;&#xC131;!');
    }

    var costumeData = getCostumeData();
    if(costumeData.owned && costumeData.owned.length >= 5 && !a.a_v15_costume_5){
      a.a_v15_costume_5 = Date.now();
      showToastV15('&#x1F3C6; &#xD328;&#xC158;&#xC758; &#xC2DC;&#xC791; &#xC5C5;&#xC801; &#xB2EC;&#xC131;!');
    }
    if(costumeData.owned && costumeData.owned.length >= COSTUMES.length && !a.a_v15_costume_all){
      a.a_v15_costume_all = Date.now();
      showToastV15('&#x1F3C6; &#xCF54;&#xC2A4;&#xD280; &#xB9C8;&#xC2A4;&#xD130; &#xC5C5;&#xC801; &#xB2EC;&#xC131;!');
    }

    var skillData = getSkillData();
    if(skillData.learned && skillData.learned.length >= 3 && !a.a_v15_skill_3){
      a.a_v15_skill_3 = Date.now();
      showToastV15('&#x1F3C6; &#xC2A4;&#xD0AC; &#xC785;&#xBB38; &#xC5C5;&#xC801; &#xB2EC;&#xC131;!');
    }
    if(skillData.learned && skillData.learned.length >= SKILL_NODES.length && !a.a_v15_skill_all){
      a.a_v15_skill_all = Date.now();
      showToastV15('&#x1F3C6; &#xC2A4;&#xD0AC; &#xB9C8;&#xC2A4;&#xD130; &#xC5C5;&#xC801; &#xB2EC;&#xC131;!');
    }

    var mailData = getMailData();
    if(mailData.read && mailData.read.length >= 6 && !a.a_v15_mail_6){
      a.a_v15_mail_6 = Date.now();
      showToastV15('&#x1F3C6; &#xD3B8;&#xC9C0; &#xC218;&#xC9D1;&#xAC00; &#xC5C5;&#xC801; &#xB2EC;&#xC131;!');
    }

    var fortuneData = getFortuneData();
    if(fortuneData.lastDate && !a.a_v15_fortune){
      a.a_v15_fortune = Date.now();
      showToastV15('&#x1F3C6; &#xC6B4;&#xC138; &#xD655;&#xC778; &#xC5C5;&#xC801; &#xB2EC;&#xC131;!');
    }

    var racingData = getRacingData();
    if(racingData.totalRaces >= 5 && !a.a_v15_race_5){
      a.a_v15_race_5 = Date.now();
      showToastV15('&#x1F3C6; &#xB808;&#xC774;&#xC2F1; &#xD314; &#xC5C5;&#xC801; &#xB2EC;&#xC131;!');
    }

    var studioData = getStudioData();
    if(studioData.melodies && studioData.melodies.length > 0 && !a.a_v15_melody){
      a.a_v15_melody = Date.now();
      showToastV15('&#x1F3C6; &#xCCAB; &#xBA5C;&#xB85C;&#xB514; &#xC5C5;&#xC801; &#xB2EC;&#xC131;!');
    }

    var encycData = getEncycData();
    if(encycData.viewed && encycData.viewed.length >= 30 && !a.a_v15_encyc_30){
      a.a_v15_encyc_30 = Date.now();
      showToastV15('&#x1F3C6; &#xBC31;&#xACFC;&#xC0AC;&#xC804; &#xD0D0;&#xD5D8; &#xC5C5;&#xC801; &#xB2EC;&#xC131;!');
    }

    var features = [];
    try{ features = JSON.parse(localStorage.getItem('hatcuping_v15_features') || '[]'); }catch(e){}
    if(features.length >= 6 && !a.a_v15_explorer){
      a.a_v15_explorer = Date.now();
      showToastV15('&#x1F3C6; v15 &#xD0D0;&#xD5D8;&#xAC00; &#xC5C5;&#xC801; &#xB2EC;&#xC131;!');
    }

    localStorage.setItem('hatcuping_achievements', JSON.stringify(a));
  }catch(e){}
}


// ============================================================
// QUIZ V15 (+15 questions, 90->105)
// ============================================================
function injectExtraQuizV15(){
  if(!window.QUIZ_BANK) window.QUIZ_BANK = [];
  var pool = window.hatcuping_quiz_pool || window.QUIZ_BANK;
  var newQ = [
    {q:'&#xC694;&#xB9AC;&#xAD50;&#xC2E4;&#xC5D0;&#xC11C; &#xC804;&#xC124; &#xB4F1;&#xAE09; &#xC694;&#xB9AC;&#xB294; &#xBA87;&#xAC1C;?',a:['1','2','3','4'],c:1},
    {q:'&#xCF54;&#xC2A4;&#xD280; &#xCEEC;&#xB809;&#xC158;&#xC758; &#xCD1D; &#xCF54;&#xC2A4;&#xD280; &#xC218;&#xB294;?',a:['8','10','12','15'],c:2},
    {q:'&#xC2A4;&#xD0AC;&#xD2B8;&#xB9AC;&#xC758; &#xCD1D; &#xD2F0;&#xC5B4; &#xC218;&#xB294;?',a:['2','3','4','5'],c:2},
    {q:'&#xC6B0;&#xCCB4;&#xD1B5;&#xC5D0;&#xC11C; &#xD3B8;&#xC9C0;&#xB97C; &#xBCF4;&#xB0B4;&#xB294; &#xCE90;&#xB9AD;&#xD130; &#xC218;&#xB294;?',a:['8','10','12','15'],c:2},
    {q:'&#xC6B4;&#xC138; &#xC2DC;&#xC2A4;&#xD15C;&#xC5D0;&#xC11C; &#xD655;&#xC778;&#xD558;&#xB294; &#xC6B4;&#xC138; &#xCE74;&#xD14C;&#xACE0;&#xB9AC; &#xC218;&#xB294;?',a:['4','5','6','8'],c:2},
    {q:'&#xD3AB; &#xB808;&#xC774;&#xC2F1;&#xC5D0;&#xC11C; &#xCC38;&#xAC00;&#xD558;&#xB294; &#xB808;&#xC774;&#xC11C; &#xC218;&#xB294;?',a:['4','5','6','8'],c:2},
    {q:'&#xC74C;&#xC545; &#xC2A4;&#xD29C;&#xB514;&#xC624;&#xC758; &#xD53C;&#xC544;&#xB178; &#xAC74;&#xBC18; &#xC218;&#xB294;?',a:['7','8','10','12'],c:2},
    {q:'&#xBC31;&#xACFC;&#xC0AC;&#xC804; v2&#xC758; &#xCD1D; &#xD56D;&#xBAA9; &#xC218;&#xB294;?',a:['30','40','50','60'],c:3},
    {q:'&#xBC31;&#xACFC;&#xC0AC;&#xC804;&#xC758; &#xCE74;&#xD14C;&#xACE0;&#xB9AC; &#xC218;&#xB294;?',a:['4','5','6','8'],c:2},
    {q:'&#xC694;&#xB9AC;&#xAD50;&#xC2E4;&#xC5D0;&#xC11C; &#xC0AC;&#xB791;&#xC758;&#xCFE0;&#xD0A4;&#xC758; &#xB4F1;&#xAE09;&#xC740;?',a:['&#xC77C;&#xBC18;','&#xD76C;&#xADC0;','&#xC601;&#xC6C5;','&#xC804;&#xC124;'],c:0},
    {q:'&#xC2A4;&#xD0AC;&#xD2B8;&#xB9AC; Tier 4 &#xC2A4;&#xD0AC;&#xC758; SP &#xBE44;&#xC6A9;&#xC740;?',a:['3','4','5','6'],c:2},
    {q:'&#xD3AB; &#xB808;&#xC774;&#xC2F1;&#xC5D0;&#xC11C; &#xAC00;&#xC7A5; &#xBE60;&#xB978; &#xB808;&#xC774;&#xC11C;&#xB294;?',a:['&#xD1A0;&#xB07C;&#xD551;','&#xAC15;&#xC544;&#xC9C0;&#xD551;','&#xC5EC;&#xC6B0;&#xD551;','&#xACF0;&#xB3CC;&#xC774;&#xD551;'],c:2},
    {q:'v15&#xC5D0;&#xC11C; &#xCD94;&#xAC00;&#xB41C; &#xC5C5;&#xC801; &#xC218;&#xB294;?',a:['8','10','12','15'],c:2},
    {q:'&#xCF54;&#xC2A4;&#xD280; &#xC911; &#xC804;&#xC124;&#xC758;&#xC655;&#xAD00;&#xBCF5;&#xC758; &#xD6A8;&#xACFC;&#xB294;?',a:['ATK +15%','DEF +15%','&#xC804;&#xCCB4; +15%','MAG +15%'],c:2},
    {q:'&#xC6B0;&#xCCB4;&#xD1B5;&#xC5D0;&#xC11C; &#xAC8C;&#xC73C;&#xB978;&#xD551;&#xC758; &#xBCF4;&#xC0C1;&#xC740;?',a:['&#xD3ED;&#xC2E0;&#xBCA0;&#xAC1C; x1','XP +30','&#xAF43; x5','&#xD558;&#xD2B8; x3'],c:0}
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
// KEYBOARD SHORTCUTS (8 new)
// ============================================================
function injectV15Keyboard(){
  document.addEventListener('keydown', function(e){
    if(e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if(!e.shiftKey) return;
    switch(e.key){
      case 'C': e.preventDefault(); openCookingClass(); break;
      case 'O': e.preventDefault(); openCostumeCollection(); break;
      case 'T': e.preventDefault(); openSkillTree(); break;
      case 'L': e.preventDefault(); openMailbox(); break;
      case 'F': e.preventDefault(); openFortuneTeller(); break;
      case 'R': e.preventDefault(); openPetRacing(); break;
      case 'M': e.preventDefault(); openMusicStudio(); break;
      case 'E': e.preventDefault(); openEncyclopedia(); break;
    }
  });
}


// ============================================================
// BOTTOM NAVIGATION BAR (8 quick action buttons)
// ============================================================
function injectV15BottomNav(){
  var existing = document.getElementById('v15BottomNav');
  if(existing) return;

  var nav = document.createElement('div');
  nav.id = 'v15BottomNav';
  nav.style.cssText = 'position:fixed;bottom:0;left:0;right:0;display:flex;justify-content:space-around;align-items:center;padding:6px 4px;background:rgba(255,255,255,.95);border-top:1px solid rgba(0,0,0,.08);z-index:900;backdrop-filter:blur(10px)';

  var buttons = [
    {icon:'&#x1F373;',label:'&#xC694;&#xB9AC;',action:openCookingClass},
    {icon:'&#x1F457;',label:'&#xCF54;&#xC2A4;&#xD280;',action:openCostumeCollection},
    {icon:'&#x1F333;',label:'&#xC2A4;&#xD0AC;',action:openSkillTree},
    {icon:'&#x1F4EC;',label:'&#xC6B0;&#xCCB4;&#xD1B5;',action:openMailbox},
    {icon:'&#x1F52E;',label:'&#xC6B4;&#xC138;',action:openFortuneTeller},
    {icon:'&#x1F3C7;',label:'&#xB808;&#xC774;&#xC2F1;',action:openPetRacing},
    {icon:'&#x1F3B9;',label:'&#xC74C;&#xC545;',action:openMusicStudio},
    {icon:'&#x1F4D6;',label:'&#xBC31;&#xACFC;',action:openEncyclopedia}
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
function updateV15Footer(){
  var ver = document.querySelector('.footer .version');
  if(ver) ver.textContent = 'v15.0 | © PRIME Holdings NEXTERA+PRISM';

  var links = document.querySelector('.footer-links');
  if(links) links.innerHTML = '<span class="footer-link">4&#xC885; &#xAC8C;&#xC784;</span><span class="footer-link">118&#xAC1C; &#xC5C5;&#xC801;</span><span class="footer-link">&#xC694;&#xB9AC; 12&#xC885;</span><span class="footer-link">&#xCF54;&#xC2A4;&#xD280; 12&#xC885;</span><span class="footer-link">&#xC2A4;&#xD0AC; 12&#xAC1C;</span><span class="footer-link">&#xD000;&#xC988; 105&#xBB38;</span>';
}

function updateV15News(){
  var newsSection = document.querySelector('.news-section');
  if(!newsSection) return;
  var firstItem = newsSection.querySelector('.news-item');
  if(!firstItem) return;
  var newItem = document.createElement('div');
  newItem.className = 'news-item';
  newItem.innerHTML = '<span class="news-date">v15.0</span><span class="news-text">&#xC694;&#xB9AC;&#xAD50;&#xC2E4; 12&#xC885;, &#xCF54;&#xC2A4;&#xD280;&#xCEEC;&#xB809;&#xC158; 12&#xC885;, &#xC2A4;&#xD0AC;&#xD2B8;&#xB9AC; 12&#xAC1C;, &#xC6B0;&#xCCB4;&#xD1B5; 12&#xD1B5;, &#xC6B4;&#xC138;&#xC2DC;&#xC2A4;&#xD15C;, &#xD3AB;&#xB808;&#xC774;&#xC2F1;Canvas, &#xC74C;&#xC545;&#xC2A4;&#xD29C;&#xB514;&#xC624;, &#xBC31;&#xACFC;&#xC0AC;&#xC804;v2 60&#xD56D;&#xBAA9;, &#xD000;&#xC988;+15(105), &#xC5C5;&#xC801;+12(118)</span>';
  firstItem.parentNode.insertBefore(newItem, firstItem);
}

function updateV15AchieveCount(){
  var el = document.getElementById('achieveCount');
  if(el){
    var c = 0;
    try{ c = Object.keys(JSON.parse(localStorage.getItem('hatcuping_achievements') || '{}')).length; }catch(e){}
    var t = window.AD ? window.AD.length : 118;
    el.textContent = c + '/' + t;
  }
}

function updateV15Meta(){
  var descMeta = document.querySelector('meta[name="description"]');
  if(descMeta) descMeta.content = '사랑의 하츄핑 v15.0 - 플랫포머 액션, 턴제 RPG, 오픈월드, UNIFIED 4종 게임. 업적 118개, 요리교실 12종, 코스튀 12종, 스킬트리, 우체통, 운세, 펫레이싱, 음악스튜디오, 백과사전v2 60항목, 퀀즈 105문!';
  document.title = '사랑의 하츄핑 v15.0 - 게임 선택';
}


// ============================================================
// BOOT
// ============================================================
function bootV15(){
  injectV15Achievements();
  injectExtraQuizV15();
  injectV15Keyboard();
  injectV15BottomNav();
  updateV15Footer();
  updateV15News();
  updateV15AchieveCount();
  updateV15Meta();
  checkAndAwardV15();
}

if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', bootV15);
} else {
  bootV15();
}

})();

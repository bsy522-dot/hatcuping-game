// hatcuping-game v14_patch.js - NEXTERA+PRISM AUTO v14.0
// Self-contained patch module (1100+ lines, 50+ functions)
(function(){
'use strict';

// ============================================================
// SFX ENGINE (12 sound types)
// ============================================================
var _v14Ctx = null;
function _v14InitAudio(){
  if(!_v14Ctx){
    try{ _v14Ctx = new (window.AudioContext || window.webkitAudioContext)(); }catch(e){}
  }
  if(_v14Ctx && _v14Ctx.state === 'suspended') _v14Ctx.resume();
}

var V14_SFX = {
  spell_open:{f:660,d:.07,t:'sine'},
  spell_cast:{f:1100,d:.15,t:'triangle'},
  spell_fail:{f:300,d:.12,t:'sawtooth'},
  dex_open:{f:720,d:.06,t:'sine'},
  dex_discover:{f:1047,d:.12,t:'triangle'},
  story_open:{f:500,d:.07,t:'sine'},
  story_read:{f:660,d:.05,t:'triangle'},
  calendar_open:{f:600,d:.06,t:'triangle'},
  calendar_claim:{f:880,d:.1,t:'sine'},
  stat_open:{f:550,d:.06,t:'sine'},
  training_hit:{f:990,d:.04,t:'square'},
  training_grade:{f:1200,d:.12,t:'sine'}
};

function sfxV14(type){
  _v14InitAudio();
  if(!_v14Ctx) return;
  var s = V14_SFX[type];
  if(!s) return;
  try{
    var muted = false;
    try{ muted = localStorage.getItem('hatcuping_mute') === '1'; }catch(e){}
    if(muted) return;
    var osc = _v14Ctx.createOscillator();
    var gain = _v14Ctx.createGain();
    osc.type = s.t || 'sine';
    osc.frequency.value = s.f;
    gain.gain.value = 0.08;
    osc.connect(gain);
    gain.connect(_v14Ctx.destination);
    osc.start();
    osc.stop(_v14Ctx.currentTime + (s.d || 0.06));
  }catch(e){}
}


// ============================================================
// UTILITY FUNCTIONS
// ============================================================
function trackV14Feature(id){
  try{
    var saved = JSON.parse(localStorage.getItem('hatcuping_v14_features') || '[]');
    if(saved.indexOf(id) === -1){ saved.push(id); localStorage.setItem('hatcuping_v14_features', JSON.stringify(saved)); }
  }catch(e){}
}

function showToastV14(msg){
  var t = document.getElementById('achieveToast');
  if(t){ t.innerHTML = msg; t.classList.add('show'); setTimeout(function(){ t.classList.remove('show'); }, 2500); }
}

function v14Load(key, fallback){
  try{ var d = JSON.parse(localStorage.getItem('hatcuping_v14_' + key)); return d !== null ? d : fallback; }catch(e){ return fallback; }
}

function v14Save(key, data){
  try{ localStorage.setItem('hatcuping_v14_' + key, JSON.stringify(data)); }catch(e){}
}

function todayStrV14(){
  var d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}

function createV14Modal(id, title, contentFn){
  if(document.getElementById(id)) return;
  var overlay = document.createElement('div');
  overlay.id = id;
  overlay.className = 'modal-overlay show';
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');
  var html = '<div class="modal" style="max-width:460px">';
  html += '<button class="modal-close" aria-label="닫기" onclick="document.getElementById(\'' + id + '\').remove()">&times;</button>';
  html += '<h3 style="font-size:17px">' + title + '</h3>';
  html += contentFn();
  html += '</div>';
  overlay.innerHTML = html;
  overlay.addEventListener('click', function(e){ if(e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
  return overlay;
}


// ============================================================
// 1. MAGIC SPELLBOOK (&#xAC8C;&#xC784;&#xB0B4; &#xB9C8;&#xBC95; &#xC8FC;&#xBB38;&#xC11C; 12&#xC885;)
// ============================================================
var SPELLS = [
  {id:'sp_heal',name:'&#xCE58;&#xC720;&#xC758; &#xBE5B;',icon:'&#x2728;',element:'light',power:30,mana:10,rarity:'common',desc:'&#xC0C1;&#xCC98;&#xB97C; &#xCE58;&#xC720;&#xD558;&#xB294; &#xBE5B;&#xC758; &#xB9C8;&#xBC95;'},
  {id:'sp_shield',name:'&#xBCC4;&#xBE5B; &#xBC29;&#xBCBD;',icon:'&#x1F6E1;&#xFE0F;',element:'light',power:25,mana:15,rarity:'common',desc:'&#xBCC4;&#xBE5B;&#xC73C;&#xB85C; &#xB9CC;&#xB4E0; &#xBCF4;&#xD638;&#xB9C9;'},
  {id:'sp_fire',name:'&#xC0AC;&#xB791;&#xC758; &#xBD88;&#xAF43;',icon:'&#x1F525;',element:'fire',power:45,mana:20,rarity:'rare',desc:'&#xB728;&#xAC70;&#xC6B4; &#xC0AC;&#xB791;&#xC758; &#xD654;&#xC5FC;'},
  {id:'sp_ice',name:'&#xC5BC;&#xC74C; &#xACB0;&#xACC4;',icon:'&#x2744;&#xFE0F;',element:'ice',power:40,mana:18,rarity:'rare',desc:'&#xBAA8;&#xB4E0; &#xAC83;&#xC744; &#xC5BC;&#xB9AC;&#xB294; &#xACB0;&#xACC4;'},
  {id:'sp_wind',name:'&#xD3ED;&#xD48D;&#xC758; &#xB0A0;&#xAC1C;',icon:'&#x1F32A;&#xFE0F;',element:'wind',power:35,mana:14,rarity:'common',desc:'&#xAC15;&#xB825;&#xD55C; &#xBC14;&#xB78C;&#xC758; &#xB9C8;&#xBC95;'},
  {id:'sp_thunder',name:'&#xCC9C;&#xB465; &#xBC88;&#xAC1C;',icon:'&#x26A1;',element:'thunder',power:55,mana:25,rarity:'rare',desc:'&#xD558;&#xB298;&#xC5D0;&#xC11C; &#xB5A8;&#xC5B4;&#xC9C0;&#xB294; &#xBC88;&#xAC1C;'},
  {id:'sp_earth',name:'&#xB300;&#xC9C0;&#xC758; &#xD798;',icon:'&#x1F30D;',element:'earth',power:50,mana:22,rarity:'rare',desc:'&#xB300;&#xC9C0;&#xC758; &#xC5D0;&#xB108;&#xC9C0;&#xB97C; &#xBAA8;&#xC73C;&#xB294; &#xB9C8;&#xBC95;'},
  {id:'sp_star',name:'&#xC720;&#xC131;&#xC6B0;',icon:'&#x2B50;',element:'light',power:60,mana:30,rarity:'epic',desc:'&#xBCC4;&#xBE5B;&#xC774; &#xBE44;&#xCC98;&#xB7FC; &#xC3DF;&#xC544;&#xC9C0;&#xB294; &#xB9C8;&#xBC95;'},
  {id:'sp_rainbow',name:'&#xBB34;&#xC9C0;&#xAC1C; &#xD3ED;&#xD48D;',icon:'&#x1F308;',element:'all',power:70,mana:35,rarity:'epic',desc:'&#xBAA8;&#xB4E0; &#xC6D0;&#xC18C;&#xB97C; &#xD569;&#xCE5C; &#xD3ED;&#xD48D;'},
  {id:'sp_heart',name:'&#xD558;&#xCE04;&#xD551; &#xB7EC;&#xBE0C;&#xBE54;',icon:'&#x1F496;',element:'love',power:80,mana:40,rarity:'epic',desc:'&#xC0AC;&#xB791;&#xC758; &#xD798;&#xC73C;&#xB85C; &#xBAA8;&#xB4E0; &#xAC83;&#xC744; &#xAC10;&#xC2F8;&#xB294; &#xBE54;'},
  {id:'sp_cosmos',name:'&#xC6B0;&#xC8FC;&#xC758; &#xC758;&#xC9C0;',icon:'&#x1F30C;',element:'cosmic',power:90,mana:50,rarity:'legendary',desc:'&#xC6B0;&#xC8FC;&#xC758; &#xD798;&#xC744; &#xBE4C;&#xB824;&#xC624;&#xB294; &#xAD6C;&#xADF9;&#xC758; &#xB9C8;&#xBC95;'},
  {id:'sp_miracle',name:'&#xAE30;&#xC801;&#xC758; &#xC8FC;&#xBB38;',icon:'&#x1FA84;',element:'miracle',power:100,mana:60,rarity:'legendary',desc:'&#xBAA8;&#xB4E0; &#xAC83;&#xC744; &#xBC14;&#xAFB8;&#xB294; &#xAE30;&#xC801;&#xC758; &#xD798;'}
];

var SPELL_RARITY_COLORS = {common:'#8BC34A',rare:'#2196F3',epic:'#9C27B0',legendary:'#FFD700'};

function getSpellData(){
  return v14Load('spells', {mana:100,maxMana:100,learned:[],castCount:0,lastManaRefill:''});
}
function saveSpellData(d){ v14Save('spells', d); }

function learnSpell(spellId){
  var d = getSpellData();
  if(d.learned.indexOf(spellId) === -1){
    d.learned.push(spellId);
    saveSpellData(d);
  }
}

function castSpell(spellId){
  var d = getSpellData();
  var spell = null;
  for(var i=0;i<SPELLS.length;i++){ if(SPELLS[i].id===spellId){ spell=SPELLS[i]; break; } }
  if(!spell || d.learned.indexOf(spellId)===-1) return false;
  if(d.mana < spell.mana) return false;
  d.mana -= spell.mana;
  d.castCount++;
  saveSpellData(d);
  checkAndAwardV14();
  return true;
}

function refillMana(){
  var d = getSpellData();
  var today = todayStrV14();
  if(d.lastManaRefill === today) return false;
  d.mana = d.maxMana;
  d.lastManaRefill = today;
  saveSpellData(d);
  return true;
}

function openSpellbook(){
  trackV14Feature('spellbook');
  sfxV14('spell_open');

  var d = getSpellData();
  if(d.learned.length === 0){
    SPELLS.forEach(function(sp){
      if(sp.rarity === 'common') learnSpell(sp.id);
    });
    d = getSpellData();
  }

  createV14Modal('spellModal', '&#x1FA84; &#xB9C8;&#xBC95; &#xC8FC;&#xBB38;&#xC11C; (' + d.learned.length + '/' + SPELLS.length + ')', function(){
    var html = '';
    html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;padding:8px 12px;background:linear-gradient(135deg,rgba(100,100,255,.1),rgba(200,100,255,.1));border-radius:12px">';
    html += '<span style="font-size:20px">&#x1F52E;</span>';
    html += '<div style="flex:1"><div style="font-size:11px;color:var(--text-sub)">&#xB9C8;&#xB098;</div>';
    html += '<div style="height:8px;background:rgba(0,0,0,.1);border-radius:4px;overflow:hidden"><div style="height:100%;width:' + (d.mana/d.maxMana*100) + '%;background:linear-gradient(90deg,#6366F1,#A855F7);border-radius:4px;transition:width .3s"></div></div>';
    html += '</div><span style="font-weight:800;color:#6366F1">' + d.mana + '/' + d.maxMana + '</span></div>';

    var canRefill = d.lastManaRefill !== todayStrV14();
    html += '<div style="text-align:center;margin-bottom:10px"><button onclick="(function(){var d=JSON.parse(localStorage.getItem(\'hatcuping_v14_spells\')||\'{}\')||{};d.mana=d.maxMana||100;d.lastManaRefill=new Date().toISOString().slice(0,10);localStorage.setItem(\'hatcuping_v14_spells\',JSON.stringify(d));document.getElementById(\'spellModal\').remove();})()" style="padding:6px 16px;background:' + (canRefill ? 'linear-gradient(135deg,#6366F1,#A855F7)' : 'rgba(0,0,0,.1)') + ';color:' + (canRefill ? '#fff' : 'var(--text-sub)') + ';border:none;border-radius:10px;font-size:12px;font-weight:700;cursor:' + (canRefill ? 'pointer' : 'default') + '">' + (canRefill ? '&#x2728; &#xC624;&#xB298;&#xC758; &#xB9C8;&#xB098; &#xCDA9;&#xC804;' : '&#x2705; &#xC624;&#xB298; &#xC774;&#xBBF8; &#xCDA9;&#xC804;&#xD568;') + '</button></div>';

    html += '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px">';
    SPELLS.forEach(function(sp){
      var learned = d.learned.indexOf(sp.id) !== -1;
      var canCast = learned && d.mana >= sp.mana;
      html += '<div style="padding:10px;border-radius:14px;background:' + (learned ? 'rgba(0,0,0,.03)' : 'rgba(0,0,0,.06)') + ';border:2px solid ' + (learned ? SPELL_RARITY_COLORS[sp.rarity] + '40' : 'transparent') + ';opacity:' + (learned ? '1' : '.5') + ';position:relative">';
      html += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">';
      html += '<span style="font-size:20px">' + (learned ? sp.icon : '&#x1F512;') + '</span>';
      html += '<div><div style="font-size:12px;font-weight:700">' + (learned ? sp.name : '???') + '</div>';
      html += '<div style="font-size:9px;color:' + SPELL_RARITY_COLORS[sp.rarity] + ';font-weight:700">' + sp.rarity.toUpperCase() + '</div></div></div>';
      if(learned){
        html += '<div style="font-size:10px;color:var(--text-sub);margin-bottom:4px">' + sp.desc + '</div>';
        html += '<div style="display:flex;justify-content:space-between;align-items:center">';
        html += '<span style="font-size:10px;color:#6366F1;font-weight:700">&#x1F52E; ' + sp.mana + ' | &#x2694;&#xFE0F; ' + sp.power + '</span>';
        html += '<button onclick="(function(){var d=JSON.parse(localStorage.getItem(\'hatcuping_v14_spells\')||\'{}\')||{};if(d.mana>=' + sp.mana + '){d.mana-=' + sp.mana + ';d.castCount=(d.castCount||0)+1;localStorage.setItem(\'hatcuping_v14_spells\',JSON.stringify(d));document.getElementById(\'spellModal\').remove();}})()" style="padding:3px 10px;border-radius:8px;border:none;font-size:10px;font-weight:700;cursor:' + (canCast ? 'pointer' : 'default') + ';background:' + (canCast ? 'linear-gradient(135deg,#FF5FA2,#B066FF)' : 'rgba(0,0,0,.08)') + ';color:' + (canCast ? '#fff' : 'var(--text-sub)') + '">&#xC2DC;&#xC804;</button>';
        html += '</div>';
      }
      html += '</div>';
    });
    html += '</div>';
    return html;
  });
}


// ============================================================
// 2. TINIFYING DEX EXPANDED (&#xD2F0;&#xB2C8;&#xD551; &#xB3C4;&#xAC10; &#xD655;&#xC7A5; 12&#xC885;)
// ============================================================
var TINIPINGS_V14 = [
  {id:'tp_love',name:'&#xD558;&#xCE04;&#xD551;',type:'&#xAC10;&#xC815;',icon:'&#x1F496;',stars:5,element:'&#xC0AC;&#xB791;',skill:'&#xD558;&#xD2B8;&#xBE44;&#xBE54;',hp:120,atk:85},
  {id:'tp_courage',name:'&#xC6A9;&#xAE30;&#xD551;',type:'&#xAC10;&#xC815;',icon:'&#x1F4AA;',stars:4,element:'&#xC6A9;&#xAE30;',skill:'&#xC6A9;&#xAE30;&#xC758;&#xBD88;&#xAF43;',hp:130,atk:90},
  {id:'tp_happy',name:'&#xD589;&#xBCF5;&#xD551;',type:'&#xAC10;&#xC815;',icon:'&#x1F60A;',stars:4,element:'&#xAE30;&#xC068;',skill:'&#xD589;&#xBCF5;&#xC758;&#xB178;&#xB798;',hp:110,atk:75},
  {id:'tp_wisdom',name:'&#xC9C0;&#xD61C;&#xD551;',type:'&#xAC10;&#xC815;',icon:'&#x1F4D6;',stars:4,element:'&#xC9C0;&#xD61C;',skill:'&#xBCC4;&#xBE5B;&#xC9C0;&#xC2DD;',hp:100,atk:95},
  {id:'tp_dream',name:'&#xAFC8;&#xD551;',type:'&#xAC10;&#xC815;',icon:'&#x1F31F;',stars:3,element:'&#xAFC8;',skill:'&#xAFC8;&#xC758;&#xB098;&#xB798;',hp:105,atk:70},
  {id:'tp_kind',name:'&#xCC29;&#xD551;',type:'&#xAC10;&#xC815;',icon:'&#x1F338;',stars:3,element:'&#xCE5C;&#xC808;',skill:'&#xB530;&#xB73B;&#xD55C;&#xC190;&#xAE38;',hp:115,atk:65},
  {id:'tp_anger',name:'&#xD654;&#xB0B4;&#xD551;',type:'&#xD2B8;&#xB7EC;',icon:'&#x1F621;',stars:3,element:'&#xBD84;&#xB178;',skill:'&#xBD84;&#xB178;&#xD3ED;&#xBC1C;',hp:95,atk:100},
  {id:'tp_sad',name:'&#xC2AC;&#xD504;&#xD551;',type:'&#xD2B8;&#xB7EC;',icon:'&#x1F622;',stars:3,element:'&#xC2AC;&#xD514;',skill:'&#xB208;&#xBB3C;&#xBE44;',hp:90,atk:80},
  {id:'tp_jealous',name:'&#xC9C8;&#xD22C;&#xD551;',type:'&#xD2B8;&#xB7EC;',icon:'&#x1F624;',stars:4,element:'&#xC9C8;&#xD22C;',skill:'&#xC9C8;&#xD22C;&#xC758;&#xBD88;&#xAF43;',hp:100,atk:95},
  {id:'tp_lazy',name:'&#xAC8C;&#xC73C;&#xB978;&#xD551;',type:'&#xD2B8;&#xB7EC;',icon:'&#x1F634;',stars:2,element:'&#xAC8C;&#xC73C;&#xB984;',skill:'&#xC7A0;&#xC790;&#xB294;&#xC548;&#xAC1C;',hp:140,atk:40},
  {id:'tp_star',name:'&#xBCC4;&#xBE5B;&#xD551;',type:'&#xC804;&#xC124;',icon:'&#x1F31F;',stars:5,element:'&#xBCC4;',skill:'&#xC720;&#xC131;&#xC6B0;&#xC8FC;&#xBE54;',hp:150,atk:110},
  {id:'tp_rainbow',name:'&#xBB34;&#xC9C0;&#xAC1C;&#xD551;',type:'&#xC804;&#xC124;',icon:'&#x1F308;',stars:5,element:'&#xBB34;&#xC9C0;&#xAC1C;',skill:'&#xC77C;&#xACF1;&#xD3ED;&#xD48D;',hp:160,atk:120}
];

function getDexData(){
  return v14Load('dex', {discovered:['tp_love','tp_courage','tp_happy'],favorites:[]});
}
function saveDexData(d){ v14Save('dex', d); }

function openTinipingDex(){
  trackV14Feature('dex');
  sfxV14('dex_open');

  var d = getDexData();
  createV14Modal('dexModal', '&#x1F4D6; &#xD2F0;&#xB2C8;&#xD551; &#xB3C4;&#xAC10; (' + d.discovered.length + '/' + TINIPINGS_V14.length + ')', function(){
    var html = '';
    html += '<div style="display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap;justify-content:center">';
    html += '<button onclick="(function(){var btns=document.querySelectorAll(\'[data-dex-filter]\');btns.forEach(function(b){b.style.background=\'rgba(0,0,0,.05)\';b.style.color=\'var(--text-sub)\'});event.target.style.background=\'#FF5FA2\';event.target.style.color=\'#fff\';document.querySelectorAll(\'[data-tp-type]\').forEach(function(c){c.style.display=\'block\'});})()" data-dex-filter="all" style="padding:4px 12px;border-radius:10px;border:none;font-size:11px;font-weight:700;cursor:pointer;background:#FF5FA2;color:#fff">&#xC804;&#xCCB4;</button>';
    ['&#xAC10;&#xC815;','&#xD2B8;&#xB7EC;','&#xC804;&#xC124;'].forEach(function(t){
      html += '<button onclick="(function(){var btns=document.querySelectorAll(\'[data-dex-filter]\');btns.forEach(function(b){b.style.background=\'rgba(0,0,0,.05)\';b.style.color=\'var(--text-sub)\'});event.target.style.background=\'#FF5FA2\';event.target.style.color=\'#fff\';document.querySelectorAll(\'[data-tp-type]\').forEach(function(c){c.style.display=c.dataset.tpType===\'' + t + '\'?\'block\':\'none\'});})()" data-dex-filter="' + t + '" style="padding:4px 12px;border-radius:10px;border:none;font-size:11px;font-weight:700;cursor:pointer;background:rgba(0,0,0,.05);color:var(--text-sub)">' + t + '</button>';
    });
    html += '</div>';

    html += '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px">';
    TINIPINGS_V14.forEach(function(tp){
      var found = d.discovered.indexOf(tp.id) !== -1;
      var starStr = '';
      for(var i=0;i<tp.stars;i++) starStr += '&#x2B50;';
      html += '<div data-tp-type="' + tp.type + '" style="padding:10px;border-radius:14px;background:' + (found ? 'rgba(0,0,0,.03)' : 'rgba(0,0,0,.06)') + ';opacity:' + (found ? '1' : '.45') + ';transition:all .2s">';
      html += '<div style="text-align:center;font-size:28px;margin-bottom:4px">' + (found ? tp.icon : '&#x2753;') + '</div>';
      html += '<div style="text-align:center;font-size:12px;font-weight:700;margin-bottom:2px">' + (found ? tp.name : '???') + '</div>';
      html += '<div style="text-align:center;font-size:9px;margin-bottom:4px">' + starStr + '</div>';
      if(found){
        html += '<div style="font-size:10px;color:var(--text-sub);text-align:center;margin-bottom:4px">' + tp.element + ' &#xC18D;&#xC131; | ' + tp.skill + '</div>';
        html += '<div style="display:flex;gap:4px;justify-content:center">';
        html += '<span style="font-size:9px;padding:2px 6px;border-radius:8px;background:rgba(76,175,80,.15);color:#4CAF50;font-weight:700">HP ' + tp.hp + '</span>';
        html += '<span style="font-size:9px;padding:2px 6px;border-radius:8px;background:rgba(244,67,54,.15);color:#F44336;font-weight:700">ATK ' + tp.atk + '</span>';
        html += '</div>';
      }
      html += '</div>';
    });
    html += '</div>';

    html += '<div style="margin-top:12px;text-align:center"><button onclick="(function(){var d=JSON.parse(localStorage.getItem(\'hatcuping_v14_dex\')||\'{}\')||{};var disc=d.discovered||[];var all=[\'tp_love\',\'tp_courage\',\'tp_happy\',\'tp_wisdom\',\'tp_dream\',\'tp_kind\',\'tp_anger\',\'tp_sad\',\'tp_jealous\',\'tp_lazy\',\'tp_star\',\'tp_rainbow\'];var undiscovered=all.filter(function(id){return disc.indexOf(id)===-1});if(undiscovered.length>0){disc.push(undiscovered[Math.floor(Math.random()*undiscovered.length)]);d.discovered=disc;localStorage.setItem(\'hatcuping_v14_dex\',JSON.stringify(d));document.getElementById(\'dexModal\').remove();}})()" style="padding:8px 20px;background:linear-gradient(135deg,#FF9800,#F57C00);color:#fff;border:none;border-radius:12px;font-size:12px;font-weight:700;cursor:pointer">&#x1F50D; &#xD0D0;&#xC0C9;&#xD558;&#xAE30; (&#xB79C;&#xB364; &#xBC1C;&#xACAC;)</button></div>';
    return html;
  });
}


// ============================================================
// 3. DAILY REWARD CALENDAR (&#xC77C;&#xC77C; &#xBCF4;&#xC0C1; &#xCE98;&#xB9B0;&#xB354; Canvas 30&#xC77C;)
// ============================================================
function getCalendarData(){
  return v14Load('calendar', {claimed:{},streak:0,lastClaim:''});
}
function saveCalendarData(d){ v14Save('calendar', d); }

function openDailyCalendar(){
  trackV14Feature('calendar');
  sfxV14('calendar_open');

  var d = getCalendarData();
  var today = todayStrV14();
  var canClaim = d.lastClaim !== today;

  createV14Modal('calendarModal', '&#x1F4C5; &#xC77C;&#xC77C; &#xBCF4;&#xC0C1; &#xCE98;&#xB9B0;&#xB354; (&#xC5F0;&#xC18D; ' + d.streak + '&#xC77C;)', function(){
    var html = '';
    html += '<canvas id="calCanvas" width="400" height="280" style="width:100%;border-radius:12px;margin-bottom:10px"></canvas>';

    html += '<div style="text-align:center;margin-bottom:8px"><button onclick="(function(){var d=JSON.parse(localStorage.getItem(\'hatcuping_v14_calendar\')||\'{}\')||{};var today=new Date();var key=today.getFullYear()+\'-\'+String(today.getMonth()+1).padStart(2,\'0\')+\'-\'+String(today.getDate()).padStart(2,\'0\');if(d.lastClaim===key)return;if(!d.claimed)d.claimed={};d.claimed[key]=true;var yesterday=new Date(today);yesterday.setDate(yesterday.getDate()-1);var yk=yesterday.getFullYear()+\'-\'+String(yesterday.getMonth()+1).padStart(2,\'0\')+\'-\'+String(yesterday.getDate()).padStart(2,\'0\');d.streak=(d.claimed&&d.claimed[yk])?(d.streak||0)+1:1;d.lastClaim=key;localStorage.setItem(\'hatcuping_v14_calendar\',JSON.stringify(d));document.getElementById(\'calendarModal\').remove();})()" style="padding:8px 20px;background:' + (canClaim ? 'linear-gradient(135deg,#4CAF50,#81C784)' : 'rgba(0,0,0,.1)') + ';color:' + (canClaim ? '#fff' : 'var(--text-sub)') + ';border:none;border-radius:12px;font-size:13px;font-weight:700;cursor:' + (canClaim ? 'pointer' : 'default') + '">' + (canClaim ? '&#x1F381; &#xC624;&#xB298;&#xC758; &#xBCF4;&#xC0C1; &#xBC1B;&#xAE30;!' : '&#x2705; &#xC624;&#xB298; &#xC774;&#xBBF8; &#xBC1B;&#xC558;&#xC5B4;&#xC694;!') + '</button></div>';

    var rewards = ['&#xAC00;&#xB8E8; x5','&#xACB0;&#xC815; x3','&#xAF43; x3','&#xB9C8;&#xB098; +20','&#xB3CC; x3','XP +50','&#xAC00;&#xB8E8; x8','&#xACB0;&#xC815; x5','&#xAF43; x5','&#xB9C8;&#xB098; +30','&#xB3CC; x5','XP +80','&#xAC00;&#xB8E8; x10','&#xACB0;&#xC815; x8','&#xAF43; x8','&#xB9C8;&#xB098; +40','&#xB3CC; x8','XP +100','&#xAC00;&#xB8E8; x12','&#xACB0;&#xC815; x10','&#xAF43; x10','&#xB9C8;&#xB098; +50','&#xB3CC; x10','XP +120','&#xAC00;&#xB8E8; x15','&#xACB0;&#xC815; x12','&#xAF43; x12','&#xB9C8;&#xB098; +60','&#xB3CC; x12','&#x1F31F; &#xC804;&#xC124; &#xBCF4;&#xC0C1;!'];
    html += '<div style="display:grid;grid-template-columns:repeat(6,1fr);gap:4px">';
    for(var i=1;i<=30;i++){
      var dayKey = i;
      var claimed = d.claimed && d.claimed[Object.keys(d.claimed||{})[i-1]];
      html += '<div style="padding:4px;border-radius:8px;text-align:center;font-size:10px;background:' + (claimed ? 'rgba(76,175,80,.15)' : (i <= Object.keys(d.claimed||{}).length ? 'rgba(255,152,0,.1)' : 'rgba(0,0,0,.04)')) + ';border:1px solid ' + (claimed ? 'rgba(76,175,80,.3)' : 'transparent') + '">';
      html += '<div style="font-weight:700;font-size:11px">' + i + '</div>';
      html += '<div style="font-size:8px;color:var(--text-sub)">' + (rewards[i-1] || 'XP') + '</div>';
      html += '</div>';
    }
    html += '</div>';

    return html;
  });

  setTimeout(function(){
    var canvas = document.getElementById('calCanvas');
    if(!canvas) return;
    var ctx = canvas.getContext('2d');
    var w = 400, h = 280;

    var gradient = ctx.createLinearGradient(0,0,w,h);
    gradient.addColorStop(0,'#FFF0F8');
    gradient.addColorStop(1,'#E8D0FF');
    ctx.fillStyle = gradient;
    ctx.fillRect(0,0,w,h);

    ctx.fillStyle = '#FF5FA2';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    var now = new Date();
    ctx.fillText(now.getFullYear() + '&#xB144; ' + (now.getMonth()+1) + '&#xC6D4;', w/2, 28);

    var days = ['&#xC77C;','&#xC6D4;','&#xD654;','&#xC218;','&#xBAA9;','&#xAE08;','&#xD1A0;'];
    ctx.font = 'bold 11px sans-serif';
    ctx.fillStyle = '#888';
    for(var i=0;i<7;i++){
      ctx.fillText(days[i], 30 + i*52, 52);
    }

    var firstDay = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
    var daysInMonth = new Date(now.getFullYear(), now.getMonth()+1, 0).getDate();
    var todayDate = now.getDate();

    for(var day=1; day<=daysInMonth; day++){
      var col = (firstDay + day - 1) % 7;
      var row = Math.floor((firstDay + day - 1) / 7);
      var cx = 30 + col*52;
      var cy = 80 + row*36;

      if(day === todayDate){
        ctx.fillStyle = '#FF5FA2';
        ctx.beginPath();
        ctx.arc(cx, cy, 14, 0, Math.PI*2);
        ctx.fill();
        ctx.fillStyle = '#fff';
      } else if(d.claimed && d.claimed[todayStrV14().slice(0,8) + String(day).padStart(2,'0')]){
        ctx.fillStyle = 'rgba(76,175,80,.2)';
        ctx.beginPath();
        ctx.arc(cx, cy, 14, 0, Math.PI*2);
        ctx.fill();
        ctx.fillStyle = '#4CAF50';
      } else {
        ctx.fillStyle = '#666';
      }
      ctx.font = (day===todayDate?'bold ':'') + '12px sans-serif';
      ctx.fillText(String(day), cx, cy+4);
    }
  }, 50);
}


// ============================================================
// 4. STORY GALLERY (&#xC2A4;&#xD1A0;&#xB9AC; &#xAC24;&#xB7EC;&#xB9AC; 12&#xC5D0;&#xD53C;&#xC18C;&#xB4DC;)
// ============================================================
var STORIES = [
  {id:'st1',title:'&#xB85C;&#xBBF8;&#xC640; &#xD558;&#xCE04;&#xD551;&#xC758; &#xB9CC;&#xB0A8;',season:'S1',icon:'&#x1F496;',summary:'&#xC678;&#xB85C;&#xC6B4; &#xB85C;&#xBBF8;&#xC5D0;&#xAC8C; &#xD558;&#xCE04;&#xD551;&#xC774; &#xCC3E;&#xC544;&#xC628;&#xB2E4;. &#xB458;&#xC758; &#xC6B0;&#xC815;&#xC774; &#xC2DC;&#xC791;&#xB418;&#xB294; &#xAC10;&#xB3D9;&#xC801;&#xC778; &#xCCAB; &#xB9CC;&#xB0A8;.'},
  {id:'st2',title:'&#xC774;&#xBAA8;&#xC158; &#xC655;&#xAD6D;&#xC758; &#xBE44;&#xBC00;',season:'S1',icon:'&#x1F3F0;',summary:'&#xC774;&#xBAA8;&#xC158; &#xC655;&#xAD6D;&#xC758; &#xC874;&#xC7AC;&#xB97C; &#xC54C;&#xAC8C; &#xB41C; &#xB85C;&#xBBF8;. &#xC655;&#xAD6D;&#xC744; &#xAD6C;&#xD558;&#xAE30; &#xC704;&#xD55C; &#xBAA8;&#xD5D8;&#xC774; &#xC2DC;&#xC791;&#xB41C;&#xB2E4;.'},
  {id:'st3',title:'&#xD2B8;&#xB7EC;&#xD551;&#xC758; &#xC2B5;&#xACA9;',season:'S2',icon:'&#x1F608;',summary:'&#xD2B8;&#xB7EC;&#xD551;&#xB4E4;&#xC774; &#xB098;&#xD0C0;&#xB098; &#xD63C;&#xB780;&#xC744; &#xC77C;&#xC73C;&#xD0A8;&#xB2E4;. &#xB85C;&#xBBF8;&#xC640; &#xCE5C;&#xAD6C;&#xB4E4;&#xC774; &#xD798;&#xC744; &#xD569;&#xCE5C;&#xB2E4;.'},
  {id:'st4',title:'&#xC6A9;&#xAE30;&#xD551;&#xC758; &#xAC01;&#xC131;',season:'S2',icon:'&#x1F4AA;',summary:'&#xC6A9;&#xAE30;&#xD551;&#xC774; &#xC9C4;&#xC815;&#xD55C; &#xC6A9;&#xAE30;&#xB97C; &#xCC3E;&#xB294; &#xC774;&#xC57C;&#xAE30;. &#xB85C;&#xBBF8;&#xC758; &#xB3C4;&#xC6C0;&#xC73C;&#xB85C; &#xC131;&#xC7A5;&#xD55C;&#xB2E4;.'},
  {id:'st5',title:'&#xD589;&#xBCF5;&#xC758; &#xB178;&#xB798;',season:'S3',icon:'&#x1F3B5;',summary:'&#xD589;&#xBCF5;&#xD551;&#xC774; &#xB178;&#xB798;&#xB97C; &#xC783;&#xC5B4;&#xBC84;&#xB838;&#xB2E4;. &#xB85C;&#xBBF8;&#xC640; &#xD568;&#xAED8; &#xD589;&#xBCF5;&#xC758; &#xB178;&#xB798;&#xB97C; &#xCC3E;&#xB294; &#xC5EC;&#xC815;.'},
  {id:'st6',title:'&#xBCC4;&#xBE5B;&#xC758; &#xCD95;&#xC81C;',season:'S3',icon:'&#x2B50;',summary:'&#xC774;&#xBAA8;&#xC158; &#xC655;&#xAD6D;&#xC758; &#xD070; &#xCD95;&#xC81C;! &#xBAA8;&#xB4E0; &#xD2F0;&#xB2C8;&#xD551;&#xB4E4;&#xC774; &#xBAA8;&#xC5EC; &#xCD95;&#xD558;&#xD558;&#xB294; &#xB0A0;.'},
  {id:'st7',title:'&#xC5B4;&#xB460;&#xC758; &#xC655; &#xBD80;&#xD65C;',season:'S4',icon:'&#x1F47F;',summary:'&#xC5B4;&#xB460;&#xC758; &#xC655;&#xC774; &#xBD80;&#xD65C;&#xD558;&#xC5EC; &#xC655;&#xAD6D;&#xC744; &#xC704;&#xD611;&#xD55C;&#xB2E4;. &#xCD5C;&#xB300; &#xC704;&#xAE30;&#xC758; &#xC21C;&#xAC04;.'},
  {id:'st8',title:'&#xC6B0;&#xC815;&#xC758; &#xD798;',season:'S4',icon:'&#x1F91D;',summary:'&#xCE5C;&#xAD6C;&#xB4E4;&#xC758; &#xC6B0;&#xC815;&#xC774; &#xC5B4;&#xB460;&#xC744; &#xBB3C;&#xB9AC;&#xCE5C;&#xB2E4;. &#xD568;&#xAED8;&#xB77C;&#xBA74; &#xBB34;&#xC5C7;&#xC774;&#xB4E0; &#xD560; &#xC218; &#xC788;&#xB2E4;!'},
  {id:'st9',title:'&#xC0C8;&#xB85C;&#xC6B4; &#xC2DC;&#xC791;',season:'S5',icon:'&#x1F31F;',summary:'&#xC0C8;&#xB85C;&#xC6B4; &#xD2F0;&#xB2C8;&#xD551;&#xB4E4;&#xC774; &#xB4F1;&#xC7A5;&#xD55C;&#xB2E4;. &#xBCC4;&#xBE5B;&#xD551;&#xACFC; &#xBB34;&#xC9C0;&#xAC1C;&#xD551;&#xC758; &#xC774;&#xC57C;&#xAE30;.'},
  {id:'st10',title:'&#xC804;&#xC124;&#xC758; &#xD2F0;&#xB2C8;&#xD551;',season:'S5',icon:'&#x1F451;',summary:'&#xC804;&#xC124;&#xC5D0;&#xB9CC; &#xC874;&#xC7AC;&#xD558;&#xB358; &#xD2F0;&#xB2C8;&#xD551;&#xC774; &#xAE68;&#xC5B4;&#xB09C;&#xB2E4;. &#xC655;&#xAD6D;&#xC758; &#xC6B4;&#xBA85;&#xC774; &#xBC14;&#xB00C;&#xB294; &#xC21C;&#xAC04;.'},
  {id:'st11',title:'&#xADF9;&#xC7A5;&#xD310;: &#xC0AC;&#xB791;&#xC758; &#xB9C8;&#xBC95;',season:'&#xADF9;&#xC7A5;&#xD310;',icon:'&#x1F3AC;',summary:'&#xBAA8;&#xB4E0; &#xC774;&#xC57C;&#xAE30;&#xC758; &#xC9D1;&#xB300;&#xC131;! &#xC0AC;&#xB791;&#xC758; &#xB9C8;&#xBC95;&#xC774; &#xC138;&#xC0C1;&#xC744; &#xAD6C;&#xD558;&#xB294; &#xAC10;&#xB3D9; &#xC2A4;&#xD1A0;&#xB9AC;.'},
  {id:'st12',title:'&#xC601;&#xC6D0;&#xD55C; &#xC6B0;&#xC815;',season:'&#xADF9;&#xC7A5;&#xD310;',icon:'&#x1F496;',summary:'&#xB85C;&#xBBF8;&#xC640; &#xD2F0;&#xB2C8;&#xD551;&#xB4E4;&#xC758; &#xC6B0;&#xC815;&#xC740; &#xC601;&#xC6D0;&#xD558;&#xB2E4;. &#xBAA8;&#xB4E0; &#xC774;&#xC57C;&#xAE30;&#xC758; &#xC544;&#xB984;&#xB2E4;&#xC6B4; &#xACB0;&#xB9D0;.'}
];

function getStoryData(){
  return v14Load('story', {read:[]});
}
function saveStoryData(d){ v14Save('story', d); }

function openStoryGallery(){
  trackV14Feature('story');
  sfxV14('story_open');

  var d = getStoryData();
  createV14Modal('storyModal', '&#x1F4DA; &#xC2A4;&#xD1A0;&#xB9AC; &#xAC24;&#xB7EC;&#xB9AC; (' + d.read.length + '/' + STORIES.length + ')', function(){
    var html = '<div style="display:flex;flex-direction:column;gap:8px">';
    STORIES.forEach(function(st){
      var isRead = d.read.indexOf(st.id) !== -1;
      html += '<div style="padding:12px;border-radius:14px;background:' + (isRead ? 'rgba(76,175,80,.06)' : 'rgba(0,0,0,.03)') + ';border-left:4px solid ' + (isRead ? '#4CAF50' : '#ddd') + ';cursor:pointer" onclick="(function(){var d=JSON.parse(localStorage.getItem(\'hatcuping_v14_story\')||\'{}\')||{};if(!d.read)d.read=[];if(d.read.indexOf(\'' + st.id + '\')===-1)d.read.push(\'' + st.id + '\');localStorage.setItem(\'hatcuping_v14_story\',JSON.stringify(d));event.target.closest(\'div\').style.borderLeftColor=\'#4CAF50\';})()">';
      html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">';
      html += '<span style="font-size:22px">' + st.icon + '</span>';
      html += '<div style="flex:1"><div style="font-size:13px;font-weight:700">' + st.title + '</div>';
      html += '<span style="font-size:9px;padding:1px 6px;border-radius:8px;background:rgba(255,95,162,.1);color:#FF5FA2;font-weight:700">' + st.season + '</span></div>';
      html += (isRead ? '<span style="font-size:12px;color:#4CAF50">&#x2705;</span>' : '<span style="font-size:12px;color:#ddd">&#x25CB;</span>') + '</div>';
      html += '<div style="font-size:11px;color:var(--text-sub);line-height:1.5">' + st.summary + '</div>';
      html += '</div>';
    });
    html += '</div>';
    return html;
  });
}


// ============================================================
// 5. CHARACTER STAT COMPARISON (Canvas &#xB808;&#xC774;&#xB354; &#xCC28;&#xD2B8; 6&#xCD95;)
// ============================================================
var CHARACTERS = [
  {name:'&#xB85C;&#xBBF8;',icon:'&#x1F467;',hp:100,atk:70,def:65,spd:80,mag:75,luk:90},
  {name:'&#xD558;&#xCE04;&#xD551;',icon:'&#x1F496;',hp:90,atk:60,def:55,spd:85,mag:95,luk:80},
  {name:'&#xC6A9;&#xAE30;&#xD551;',icon:'&#x1F4AA;',hp:120,atk:95,def:80,spd:70,mag:50,luk:65},
  {name:'&#xD589;&#xBCF5;&#xD551;',icon:'&#x1F60A;',hp:85,atk:55,def:50,spd:90,mag:85,luk:95},
  {name:'&#xC9C0;&#xD61C;&#xD551;',icon:'&#x1F4D6;',hp:80,atk:65,def:60,spd:75,mag:100,luk:70},
  {name:'&#xBCC4;&#xBE5B;&#xD551;',icon:'&#x1F31F;',hp:110,atk:90,def:75,spd:85,mag:90,luk:85}
];

function openStatComparison(){
  trackV14Feature('stats');
  sfxV14('stat_open');

  createV14Modal('statModal', '&#x1F4CA; &#xCE90;&#xB9AD;&#xD130; &#xC2A4;&#xD0EF; &#xBE44;&#xAD50;', function(){
    var html = '';
    html += '<canvas id="statRadar" width="360" height="360" style="width:100%;border-radius:12px;margin-bottom:10px"></canvas>';

    html += '<div style="display:flex;gap:4px;flex-wrap:wrap;justify-content:center;margin-bottom:10px">';
    CHARACTERS.forEach(function(ch, idx){
      html += '<button data-char-idx="' + idx + '" onclick="(function(){window._v14SelectedChar=' + idx + ';window._v14DrawRadar&&window._v14DrawRadar();})()" style="padding:4px 10px;border-radius:10px;border:2px solid ' + (idx===0 ? '#FF5FA2' : 'transparent') + ';background:rgba(0,0,0,.04);font-size:11px;font-weight:700;cursor:pointer">' + ch.icon + ' ' + ch.name + '</button>';
    });
    html += '</div>';

    html += '<div id="charDetail" style="padding:10px;border-radius:12px;background:rgba(0,0,0,.03)"></div>';
    return html;
  });

  window._v14SelectedChar = 0;

  function drawRadar(){
    var canvas = document.getElementById('statRadar');
    if(!canvas) return;
    var ctx = canvas.getContext('2d');
    var w = 360, h = 360;
    var cx = w/2, cy = h/2, r = 120;

    ctx.clearRect(0,0,w,h);

    var grad = ctx.createRadialGradient(cx,cy,0,cx,cy,r+40);
    grad.addColorStop(0,'#FFF8FC');
    grad.addColorStop(1,'#F0E0FF');
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,w,h);

    var labels = ['HP','ATK','DEF','SPD','MAG','LUK'];
    var angles = [];
    for(var i=0;i<6;i++) angles.push(-Math.PI/2 + (2*Math.PI/6)*i);

    for(var ring=1;ring<=5;ring++){
      ctx.beginPath();
      var rr = r * ring/5;
      for(var j=0;j<6;j++){
        var x = cx + rr * Math.cos(angles[j]);
        var y = cy + rr * Math.sin(angles[j]);
        if(j===0) ctx.moveTo(x,y);
        else ctx.lineTo(x,y);
      }
      ctx.closePath();
      ctx.strokeStyle = 'rgba(0,0,0,.08)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    for(var k=0;k<6;k++){
      ctx.beginPath();
      ctx.moveTo(cx,cy);
      ctx.lineTo(cx + r*Math.cos(angles[k]), cy + r*Math.sin(angles[k]));
      ctx.strokeStyle = 'rgba(0,0,0,.1)';
      ctx.stroke();

      ctx.fillStyle = '#666';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      var lx = cx + (r+20)*Math.cos(angles[k]);
      var ly = cy + (r+20)*Math.sin(angles[k]);
      ctx.fillText(labels[k], lx, ly);
    }

    var ch = CHARACTERS[window._v14SelectedChar || 0];
    var vals = [ch.hp, ch.atk, ch.def, ch.spd, ch.mag, ch.luk];

    ctx.beginPath();
    for(var m=0;m<6;m++){
      var vr = r * vals[m]/120;
      var px = cx + vr * Math.cos(angles[m]);
      var py = cy + vr * Math.sin(angles[m]);
      if(m===0) ctx.moveTo(px,py);
      else ctx.lineTo(px,py);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(255,95,162,.2)';
    ctx.fill();
    ctx.strokeStyle = '#FF5FA2';
    ctx.lineWidth = 2;
    ctx.stroke();

    for(var n=0;n<6;n++){
      var dvr = r * vals[n]/120;
      var dx = cx + dvr * Math.cos(angles[n]);
      var dy = cy + dvr * Math.sin(angles[n]);
      ctx.beginPath();
      ctx.arc(dx,dy,4,0,Math.PI*2);
      ctx.fillStyle = '#FF5FA2';
      ctx.fill();

      ctx.fillStyle = '#FF5FA2';
      ctx.font = 'bold 10px sans-serif';
      var tx = cx + (dvr+14) * Math.cos(angles[n]);
      var ty = cy + (dvr+14) * Math.sin(angles[n]);
      ctx.fillText(String(vals[n]), tx, ty);
    }

    ctx.fillStyle = '#FF5FA2';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(ch.icon + ' ' + ch.name, cx, 24);

    var detail = document.getElementById('charDetail');
    if(detail){
      var total = vals.reduce(function(a,b){return a+b},0);
      var grade = total >= 500 ? 'S' : total >= 430 ? 'A' : total >= 360 ? 'B' : 'C';
      detail.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center"><span style="font-size:14px;font-weight:800">' + ch.icon + ' ' + ch.name + '</span><span style="font-size:12px;font-weight:800;color:#FF5FA2">&#xCD1D;&#xC810; ' + total + ' | ' + grade + '&#xB4F1;&#xAE09;</span></div>';
    }

    document.querySelectorAll('[data-char-idx]').forEach(function(btn){
      btn.style.borderColor = parseInt(btn.dataset.charIdx) === (window._v14SelectedChar||0) ? '#FF5FA2' : 'transparent';
    });
  }

  window._v14DrawRadar = drawRadar;
  setTimeout(drawRadar, 80);
}


// ============================================================
// 6. TRAINING DOJO (&#xD0C0;&#xC774;&#xBC0D; &#xD2B8;&#xB808;&#xC774;&#xB2DD; Canvas &#xBBF8;&#xB2C8;&#xAC8C;&#xC784;)
// ============================================================
function getTrainingData(){
  return v14Load('training', {bestScore:0,sessions:0,totalHits:0});
}
function saveTrainingData(d){ v14Save('training', d); }

function openTrainingDojo(){
  trackV14Feature('training');
  sfxV14('training_hit');

  var d = getTrainingData();
  createV14Modal('trainModal', '&#x1F94B; &#xD2B8;&#xB808;&#xC774;&#xB2DD; &#xB3C4;&#xC7A5; (&#xCD5C;&#xACE0;: ' + d.bestScore + '&#xC810;)', function(){
    var html = '';
    html += '<canvas id="trainCanvas" width="400" height="320" style="width:100%;border-radius:12px;cursor:pointer;margin-bottom:8px"></canvas>';
    html += '<div style="text-align:center">';
    html += '<div style="font-size:12px;color:var(--text-sub);margin-bottom:6px">&#xD0C0;&#xAC9F;&#xC774; &#xB098;&#xD0C0;&#xB098;&#xBA74; &#xD074;&#xB9AD;/&#xD0ED;&#xD558;&#xC138;&#xC694;!</div>';
    html += '<div style="display:flex;gap:12px;justify-content:center">';
    html += '<div style="text-align:center"><div style="font-size:18px;font-weight:800;color:#FF5FA2" id="trainScore">0</div><div style="font-size:10px;color:var(--text-sub)">&#xC810;&#xC218;</div></div>';
    html += '<div style="text-align:center"><div style="font-size:18px;font-weight:800;color:#4CAF50" id="trainHits">0</div><div style="font-size:10px;color:var(--text-sub)">&#xC801;&#xC911;</div></div>';
    html += '<div style="text-align:center"><div style="font-size:18px;font-weight:800;color:#F44336" id="trainMiss">0</div><div style="font-size:10px;color:var(--text-sub)">&#xBBF8;&#xC2A4;</div></div>';
    html += '</div>';
    html += '<button id="trainStartBtn" onclick="window._v14StartTraining&&window._v14StartTraining()" style="margin-top:8px;padding:8px 24px;background:linear-gradient(135deg,#FF5FA2,#B066FF);color:#fff;border:none;border-radius:12px;font-size:13px;font-weight:700;cursor:pointer">&#xC2DC;&#xC791;!</button>';
    html += '</div>';
    return html;
  });

  setTimeout(function(){
    var canvas = document.getElementById('trainCanvas');
    if(!canvas) return;
    var ctx = canvas.getContext('2d');
    var W = 400, H = 320;
    var score = 0, hits = 0, misses = 0, targets = [], gameActive = false, animId = null;

    function drawBg(){
      var g = ctx.createLinearGradient(0,0,0,H);
      g.addColorStop(0,'#1a0a2e');
      g.addColorStop(1,'#2d1040');
      ctx.fillStyle = g;
      ctx.fillRect(0,0,W,H);

      for(var i=0;i<30;i++){
        ctx.beginPath();
        ctx.arc(Math.random()*W, Math.random()*H, Math.random()*2, 0, Math.PI*2);
        ctx.fillStyle = 'rgba(255,255,255,' + (Math.random()*0.5+0.1) + ')';
        ctx.fill();
      }
    }

    function spawnTarget(){
      targets.push({
        x: 30 + Math.random()*(W-60),
        y: 30 + Math.random()*(H-60),
        r: 20 + Math.random()*15,
        life: 60 + Math.floor(Math.random()*40),
        color: ['#FF5FA2','#B066FF','#FFE44D','#4CAF50','#2196F3'][Math.floor(Math.random()*5)]
      });
    }

    function update(){
      if(!gameActive) return;
      drawBg();

      for(var i=targets.length-1;i>=0;i--){
        var t = targets[i];
        t.life--;
        if(t.life <= 0){
          misses++;
          targets.splice(i,1);
          continue;
        }
        var alpha = Math.min(t.life/20, 1);
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.r+6, 0, Math.PI*2);
        ctx.strokeStyle = t.color + Math.floor(alpha*60).toString(16).padStart(2,'0');
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.r, 0, Math.PI*2);
        ctx.fillStyle = t.color + Math.floor(alpha*200).toString(16).padStart(2,'0');
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('&#x1F496;', t.x, t.y);
      }

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('&#xC810;&#xC218;: ' + score, 10, 20);

      document.getElementById('trainScore').textContent = score;
      document.getElementById('trainHits').textContent = hits;
      document.getElementById('trainMiss').textContent = misses;

      if(misses >= 5){
        gameActive = false;
        ctx.fillStyle = 'rgba(0,0,0,.6)';
        ctx.fillRect(0,0,W,H);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('&#xAC8C;&#xC784; &#xC624;&#xBC84;!', W/2, H/2-20);
        ctx.font = '16px sans-serif';
        ctx.fillText('&#xC810;&#xC218;: ' + score + ' | &#xC801;&#xC911;: ' + hits, W/2, H/2+10);
        var grade = score >= 200 ? 'S' : score >= 150 ? 'A' : score >= 100 ? 'B' : score >= 50 ? 'C' : 'D';
        ctx.fillStyle = '#FFE44D';
        ctx.font = 'bold 20px sans-serif';
        ctx.fillText(grade + '&#xB4F1;&#xAE09;', W/2, H/2+40);

        var td = getTrainingData();
        td.sessions++;
        td.totalHits += hits;
        if(score > td.bestScore) td.bestScore = score;
        saveTrainingData(td);
        checkAndAwardV14();
        return;
      }

      if(Math.random() < 0.04) spawnTarget();
      animId = requestAnimationFrame(update);
    }

    canvas.addEventListener('click', function(e){
      if(!gameActive) return;
      var rect = canvas.getBoundingClientRect();
      var mx = (e.clientX - rect.left) * (W/rect.width);
      var my = (e.clientY - rect.top) * (H/rect.height);
      for(var i=targets.length-1;i>=0;i--){
        var t = targets[i];
        var dist = Math.sqrt((mx-t.x)*(mx-t.x) + (my-t.y)*(my-t.y));
        if(dist <= t.r+6){
          hits++;
          score += Math.max(10, Math.floor(t.life/2));
          sfxV14('training_hit');
          targets.splice(i,1);
          break;
        }
      }
    });

    window._v14StartTraining = function(){
      score = 0; hits = 0; misses = 0; targets = []; gameActive = true;
      if(animId) cancelAnimationFrame(animId);
      document.getElementById('trainStartBtn').textContent = '&#xC9C4;&#xD589;&#xC911;...';
      update();
    };

    drawBg();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('&#xC2DC;&#xC791; &#xBC84;&#xD2BC;&#xC744; &#xB204;&#xB974;&#xC138;&#xC694;!', W/2, H/2);
  }, 80);
}


// ============================================================
// 7. EMOTION WEATHER SYSTEM (&#xAC10;&#xC815; &#xB0A0;&#xC528; &#xC2DC;&#xC2A4;&#xD15C; 8&#xC885;)
// ============================================================
var EMOTION_WEATHERS = [
  {id:'sunny',name:'&#xD589;&#xBCF5;&#xD55C; &#xB9D1;&#xC74C;',icon:'&#x2600;&#xFE0F;',color:'#FFD700',effect:'+10% XP &#xBCF4;&#xB108;&#xC2A4;',mood:'&#xD589;&#xBCF5;'},
  {id:'rainbow',name:'&#xD76C;&#xB9DD;&#xC758; &#xBB34;&#xC9C0;&#xAC1C;',icon:'&#x1F308;',color:'#FF5FA2',effect:'+15% &#xD589;&#xC6B4;',mood:'&#xD76C;&#xB9DD;'},
  {id:'cloudy',name:'&#xC0DD;&#xAC01;&#xC774; &#xB9CE;&#xC740; &#xAD6C;&#xB984;',icon:'&#x2601;&#xFE0F;',color:'#90A4AE',effect:'+5% &#xB9C8;&#xBC95;&#xB825;',mood:'&#xC0AC;&#xC0C9;'},
  {id:'rain',name:'&#xC704;&#xB85C;&#xC758; &#xBE44;',icon:'&#x1F327;&#xFE0F;',color:'#42A5F5',effect:'+10% &#xD68C;&#xBCF5;&#xB825;',mood:'&#xC704;&#xB85C;'},
  {id:'snow',name:'&#xC124;&#xB808;&#xC784;&#xC758; &#xB208;',icon:'&#x2744;&#xFE0F;',color:'#B3E5FC',effect:'+8% &#xBC29;&#xC5B4;&#xB825;',mood:'&#xC124;&#xB818;'},
  {id:'storm',name:'&#xC5F4;&#xC815;&#xC758; &#xD3ED;&#xD48D;',icon:'&#x26C8;&#xFE0F;',color:'#7B1FA2',effect:'+20% &#xACF5;&#xACA9;&#xB825;',mood:'&#xC5F4;&#xC815;'},
  {id:'aurora',name:'&#xAF3F;&#xC758; &#xC624;&#xB85C;&#xB77C;',icon:'&#x1F30C;',color:'#00BCD4',effect:'+12% &#xC804;&#xCCB4; &#xBCF4;&#xB108;&#xC2A4;',mood:'&#xACBD;&#xC774;'},
  {id:'star',name:'&#xBCC4;&#xBE5B; &#xC1E4;&#xC6CC;',icon:'&#x2B50;',color:'#FFC107',effect:'+25% &#xB808;&#xC5B4; &#xD655;&#xB960;',mood:'&#xD589;&#xC6B4;'}
];

function getTodayWeather(){
  var d = new Date();
  var seed = d.getFullYear()*10000 + (d.getMonth()+1)*100 + d.getDate();
  return EMOTION_WEATHERS[seed % EMOTION_WEATHERS.length];
}

function openEmotionWeather(){
  trackV14Feature('weather');
  var w = getTodayWeather();
  createV14Modal('weatherModal', '&#x1F326;&#xFE0F; &#xC624;&#xB298;&#xC758; &#xAC10;&#xC815; &#xB0A0;&#xC528;', function(){
    var html = '';
    html += '<div style="text-align:center;padding:24px;background:linear-gradient(135deg,' + w.color + '20,' + w.color + '10);border-radius:16px;margin-bottom:12px">';
    html += '<div style="font-size:56px;margin-bottom:8px">' + w.icon + '</div>';
    html += '<div style="font-size:20px;font-weight:800;margin-bottom:4px">' + w.name + '</div>';
    html += '<div style="font-size:13px;color:var(--text-sub);margin-bottom:8px">&#xC624;&#xB298;&#xC758; &#xAC10;&#xC815;: ' + w.mood + '</div>';
    html += '<div style="font-size:12px;padding:6px 16px;display:inline-block;background:' + w.color + '30;border-radius:10px;font-weight:700;color:' + w.color + '">' + w.effect + '</div>';
    html += '</div>';
    html += '<div style="font-size:12px;color:var(--text-sub);margin-bottom:10px">&#x1F4C5; &#xC77C;&#xC8FC;&#xC77C; &#xAC10;&#xC815; &#xC608;&#xBCF4;:</div>';
    html += '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px">';
    var today = new Date();
    for(var i=0;i<7;i++){
      var fd = new Date(today);
      fd.setDate(fd.getDate()+i);
      var seed = fd.getFullYear()*10000 + (fd.getMonth()+1)*100 + fd.getDate();
      var fw = EMOTION_WEATHERS[seed % EMOTION_WEATHERS.length];
      var days = ['&#xC77C;','&#xC6D4;','&#xD654;','&#xC218;','&#xBAA9;','&#xAE08;','&#xD1A0;'];
      html += '<div style="text-align:center;padding:6px 2px;border-radius:10px;background:' + (i===0 ? fw.color+'20' : 'rgba(0,0,0,.03)') + '">';
      html += '<div style="font-size:9px;font-weight:700;color:var(--text-sub)">' + days[fd.getDay()] + '</div>';
      html += '<div style="font-size:18px;margin:2px 0">' + fw.icon + '</div>';
      html += '<div style="font-size:8px;color:var(--text-sub)">' + fw.mood + '</div>';
      html += '</div>';
    }
    html += '</div>';
    return html;
  });
}


// ============================================================
// 8. FRIENDSHIP BOARD (&#xC6B0;&#xC815; &#xAC8C;&#xC2DC;&#xD310; - &#xD3B8;&#xC9C0; &#xC4F0;&#xAE30; 12&#xCE78;)
// ============================================================
var LETTER_TEMPLATES = [
  {id:'lt1',to:'&#xD558;&#xCE04;&#xD551;',icon:'&#x1F496;',template:'&#xD558;&#xCE04;&#xD551;&#xC544;, &#xB108;&#xC758; &#xC0AC;&#xB791;&#xC758; &#xD798;&#xC740; &#xC815;&#xB9D0; &#xB300;&#xB2E8;&#xD574;!'},
  {id:'lt2',to:'&#xC6A9;&#xAE30;&#xD551;',icon:'&#x1F4AA;',template:'&#xC6A9;&#xAE30;&#xD551;&#xC544;, &#xB108;&#xC758; &#xC6A9;&#xAE30;&#xB294; &#xBAA8;&#xB450;&#xC5D0;&#xAC8C; &#xD798;&#xC744; &#xC918;!'},
  {id:'lt3',to:'&#xD589;&#xBCF5;&#xD551;',icon:'&#x1F60A;',template:'&#xD589;&#xBCF5;&#xD551;&#xC544;, &#xB108;&#xC758; &#xBBF8;&#xC18C;&#xB294; &#xC138;&#xC0C1;&#xC744; &#xBC1D;&#xAC8C; &#xD574;!'},
  {id:'lt4',to:'&#xC9C0;&#xD61C;&#xD551;',icon:'&#x1F4D6;',template:'&#xC9C0;&#xD61C;&#xD551;&#xC544;, &#xB108;&#xC758; &#xC9C0;&#xD61C;&#xB85C; &#xBAA8;&#xD5D8;&#xC774; &#xB354; &#xC990;&#xAC70;&#xC6CC;!'},
  {id:'lt5',to:'&#xAFC8;&#xD551;',icon:'&#x1F31F;',template:'&#xAFC8;&#xD551;&#xC544;, &#xB108;&#xC758; &#xAFC8;&#xC740; &#xC5B8;&#xC820;&#xAC00; &#xC774;&#xB8E8;&#xC5B4;&#xC9C8; &#xAC70;&#xC57C;!'},
  {id:'lt6',to:'&#xCC29;&#xD551;',icon:'&#x1F338;',template:'&#xCC29;&#xD551;&#xC544;, &#xB108;&#xC758; &#xCE5C;&#xC808;&#xD568;&#xC5D0; &#xB2E4;&#xB4E4; &#xAC10;&#xB3D9;&#xBC1B;&#xC544;!'},
  {id:'lt7',to:'&#xB85C;&#xBBF8;',icon:'&#x1F467;',template:'&#xB85C;&#xBBF8;&#xC57C;, &#xB108;&#xB294; &#xC815;&#xB9D0; &#xBA4B;&#xC9C4; &#xC8FC;&#xC778;&#xACF5;&#xC774;&#xC57C;!'},
  {id:'lt8',to:'&#xBCC4;&#xBE5B;&#xD551;',icon:'&#x1F31F;',template:'&#xBCC4;&#xBE5B;&#xD551;&#xC544;, &#xB108;&#xC758; &#xBE5B;&#xC774; &#xBAA8;&#xB450;&#xB97C; &#xBE44;&#xCDB0;&#xC918;!'},
  {id:'lt9',to:'&#xBB34;&#xC9C0;&#xAC1C;&#xD551;',icon:'&#x1F308;',template:'&#xBB34;&#xC9C0;&#xAC1C;&#xD551;&#xC544;, &#xB108;&#xC640; &#xD568;&#xAED8;&#xBA74; &#xC138;&#xC0C1;&#xC774; &#xB354; &#xC544;&#xB984;&#xB2E4;&#xC6CC;!'},
  {id:'lt10',to:'&#xD654;&#xB0B4;&#xD551;',icon:'&#x1F621;',template:'&#xD654;&#xB0B4;&#xD551;&#xC544;, &#xD654;&#xB0B4;&#xB294; &#xAC83;&#xB3C4; &#xAD1C;&#xCC2E;&#xC544;. &#xC6B0;&#xB9AC;&#xAC00; &#xC788;&#xC796;&#xC544;!'},
  {id:'lt11',to:'&#xC2AC;&#xD504;&#xD551;',icon:'&#x1F622;',template:'&#xC2AC;&#xD504;&#xD551;&#xC544;, &#xC2AC;&#xD50C; &#xB550; &#xC6B8;&#xC5B4;&#xB3C4; &#xB3FC;. &#xC6B0;&#xB9AC;&#xAC00; &#xC704;&#xB85C;&#xD574;&#xC904;&#xAC8C;!'},
  {id:'lt12',to:'&#xAC8C;&#xC73C;&#xB978;&#xD551;',icon:'&#x1F634;',template:'&#xAC8C;&#xC73C;&#xB978;&#xD551;&#xC544;, &#xC77C;&#xC5B4;&#xB098;! &#xC624;&#xB298;&#xB3C4; &#xC990;&#xAC70;&#xC6B4; &#xBAA8;&#xD5D8;&#xC774; &#xAE30;&#xB2E4;&#xB824;!'}
];

function getLetterData(){
  return v14Load('letters', {sent:[]});
}
function saveLetterData(d){ v14Save('letters', d); }

function openFriendshipBoard(){
  trackV14Feature('friendship');

  var d = getLetterData();
  createV14Modal('friendModal', '&#x1F48C; &#xC6B0;&#xC815; &#xAC8C;&#xC2DC;&#xD310; (' + d.sent.length + '/' + LETTER_TEMPLATES.length + ')', function(){
    var html = '<div style="display:flex;flex-direction:column;gap:8px">';
    LETTER_TEMPLATES.forEach(function(lt){
      var sent = d.sent.indexOf(lt.id) !== -1;
      html += '<div style="padding:10px 14px;border-radius:14px;background:' + (sent ? 'rgba(255,95,162,.06)' : 'rgba(0,0,0,.03)') + ';border:1px solid ' + (sent ? 'rgba(255,95,162,.2)' : 'transparent') + '">';
      html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">';
      html += '<span style="font-size:20px">' + lt.icon + '</span>';
      html += '<span style="font-size:13px;font-weight:700">' + lt.to + '&#xC5D0;&#xAC8C;</span>';
      html += (sent ? '<span style="font-size:10px;color:#4CAF50;font-weight:700;margin-left:auto">&#xBC1C;&#xC1A1;&#xC644;&#xB8CC; &#x2705;</span>' : '') + '</div>';
      html += '<div style="font-size:11px;color:var(--text-sub);line-height:1.5">' + lt.template + '</div>';
      if(!sent){
        html += '<button onclick="(function(){var d=JSON.parse(localStorage.getItem(\'hatcuping_v14_letters\')||\'{}\')||{};if(!d.sent)d.sent=[];if(d.sent.indexOf(\'' + lt.id + '\')===-1)d.sent.push(\'' + lt.id + '\');localStorage.setItem(\'hatcuping_v14_letters\',JSON.stringify(d));document.getElementById(\'friendModal\').remove();})()" style="margin-top:6px;padding:4px 12px;background:linear-gradient(135deg,#FF5FA2,#B066FF);color:#fff;border:none;border-radius:8px;font-size:10px;font-weight:700;cursor:pointer">&#x1F48C; &#xD3B8;&#xC9C0; &#xBCF4;&#xB0B4;&#xAE30;</button>';
      }
      html += '</div>';
    });
    html += '</div>';
    return html;
  });
}


// ============================================================
// V14 ACHIEVEMENTS (+12, 94->106)
// ============================================================
var V14_ACHIEVEMENTS = [
  {id:'a_v14_spell_first',name:'&#xCD08;&#xBCF4; &#xB9C8;&#xBC95;&#xC0AC;',desc:'&#xCCAB; &#xB9C8;&#xBC95; &#xC2DC;&#xC804;',cat:'general',icon:'&#x1FA84;'},
  {id:'a_v14_spell_all',name:'&#xB9C8;&#xBC95; &#xB300;&#xC2A4;&#xC2B9;',desc:'12&#xC885; &#xB9C8;&#xBC95; &#xC804;&#xBD80; &#xD559;&#xC2B5;',cat:'general',icon:'&#x1F52E;'},
  {id:'a_v14_dex_half',name:'&#xB3C4;&#xAC10; &#xC218;&#xC9D1;&#xAC00;',desc:'&#xD2F0;&#xB2C8;&#xD551; 6&#xC885; &#xBC1C;&#xACAC;',cat:'rpg',icon:'&#x1F4D6;'},
  {id:'a_v14_dex_all',name:'&#xB3C4;&#xAC10; &#xC644;&#xC131;',desc:'&#xD2F0;&#xB2C8;&#xD551; 12&#xC885; &#xC804;&#xBD80; &#xBC1C;&#xACAC;',cat:'rpg',icon:'&#x1F4DA;'},
  {id:'a_v14_calendar_7',name:'7&#xC77C; &#xC5F0;&#xC18D; &#xCD9C;&#xC11D;',desc:'7&#xC77C; &#xC5F0;&#xC18D; &#xBCF4;&#xC0C1; &#xC218;&#xB839;',cat:'general',icon:'&#x1F4C5;'},
  {id:'a_v14_calendar_30',name:'30&#xC77C; &#xAC1C;&#xADFC;',desc:'30&#xC77C; &#xBCF4;&#xC0C1; &#xC218;&#xB839;',cat:'general',icon:'&#x1F525;'},
  {id:'a_v14_story_half',name:'&#xC774;&#xC57C;&#xAE30; &#xD0D0;&#xD5D8;&#xAC00;',desc:'&#xC2A4;&#xD1A0;&#xB9AC; 6&#xD3B8; &#xC77D;&#xAE30;',cat:'general',icon:'&#x1F4D6;'},
  {id:'a_v14_story_all',name:'&#xC2A4;&#xD1A0;&#xB9AC; &#xB9C8;&#xC2A4;&#xD130;',desc:'&#xC2A4;&#xD1A0;&#xB9AC; 12&#xD3B8; &#xC804;&#xBD80; &#xC77D;&#xAE30;',cat:'general',icon:'&#x1F3AC;'},
  {id:'a_v14_training',name:'&#xC218;&#xB828;&#xC758; &#xC2DC;&#xC791;',desc:'&#xD2B8;&#xB808;&#xC774;&#xB2DD; &#xB3C4;&#xC7A5; &#xCCAB; &#xD50C;&#xB808;&#xC774;',cat:'general',icon:'&#x1F94B;'},
  {id:'a_v14_training_s',name:'S&#xB4F1;&#xAE09; &#xD2B8;&#xB808;&#xC774;&#xB108;',desc:'&#xD2B8;&#xB808;&#xC774;&#xB2DD; 200&#xC810; &#xC774;&#xC0C1;',cat:'general',icon:'&#x1F947;'},
  {id:'a_v14_letter_first',name:'&#xCCAB; &#xD3B8;&#xC9C0;',desc:'&#xC6B0;&#xC815; &#xD3B8;&#xC9C0; &#xCCAB; &#xBC1C;&#xC1A1;',cat:'general',icon:'&#x1F48C;'},
  {id:'a_v14_explorer',name:'v14 &#xD0D0;&#xD5D8;&#xAC00;',desc:'v14 &#xAE30;&#xB2A5; 6&#xAC1C; &#xC774;&#xC0C1; &#xCCB4;&#xD5D8;',cat:'general',icon:'&#x1F680;'}
];

function injectV14Achievements(){
  if(!window.AD) return;
  V14_ACHIEVEMENTS.forEach(function(a){
    var exists = false;
    for(var i=0;i<window.AD.length;i++){
      if(window.AD[i].id === a.id){ exists = true; break; }
    }
    if(!exists) window.AD.push(a);
  });
}

function checkAndAwardV14(){
  try{
    var a = JSON.parse(localStorage.getItem('hatcuping_achievements') || '{}');

    var spellData = getSpellData();
    if(spellData.castCount > 0 && !a.a_v14_spell_first){
      a.a_v14_spell_first = Date.now();
      showToastV14('&#x1F3C6; &#xCD08;&#xBCF4; &#xB9C8;&#xBC95;&#xC0AC; &#xC5C5;&#xC801; &#xB2EC;&#xC131;!');
    }
    if(spellData.learned.length >= SPELLS.length && !a.a_v14_spell_all){
      a.a_v14_spell_all = Date.now();
      showToastV14('&#x1F3C6; &#xB9C8;&#xBC95; &#xB300;&#xC2A4;&#xC2B9; &#xC5C5;&#xC801; &#xB2EC;&#xC131;!');
    }

    var dexData = getDexData();
    if(dexData.discovered.length >= 6 && !a.a_v14_dex_half){
      a.a_v14_dex_half = Date.now();
      showToastV14('&#x1F3C6; &#xB3C4;&#xAC10; &#xC218;&#xC9D1;&#xAC00; &#xC5C5;&#xC801; &#xB2EC;&#xC131;!');
    }
    if(dexData.discovered.length >= TINIPINGS_V14.length && !a.a_v14_dex_all){
      a.a_v14_dex_all = Date.now();
      showToastV14('&#x1F3C6; &#xB3C4;&#xAC10; &#xC644;&#xC131; &#xC5C5;&#xC801; &#xB2EC;&#xC131;!');
    }

    var calData = getCalendarData();
    if(calData.streak >= 7 && !a.a_v14_calendar_7){
      a.a_v14_calendar_7 = Date.now();
      showToastV14('&#x1F3C6; 7&#xC77C; &#xC5F0;&#xC18D; &#xCD9C;&#xC11D; &#xC5C5;&#xC801; &#xB2EC;&#xC131;!');
    }
    if(Object.keys(calData.claimed||{}).length >= 30 && !a.a_v14_calendar_30){
      a.a_v14_calendar_30 = Date.now();
      showToastV14('&#x1F3C6; 30&#xC77C; &#xAC1C;&#xADFC; &#xC5C5;&#xC801; &#xB2EC;&#xC131;!');
    }

    var storyData = getStoryData();
    if(storyData.read.length >= 6 && !a.a_v14_story_half){
      a.a_v14_story_half = Date.now();
      showToastV14('&#x1F3C6; &#xC774;&#xC57C;&#xAE30; &#xD0D0;&#xD5D8;&#xAC00; &#xC5C5;&#xC801; &#xB2EC;&#xC131;!');
    }
    if(storyData.read.length >= STORIES.length && !a.a_v14_story_all){
      a.a_v14_story_all = Date.now();
      showToastV14('&#x1F3C6; &#xC2A4;&#xD1A0;&#xB9AC; &#xB9C8;&#xC2A4;&#xD130; &#xC5C5;&#xC801; &#xB2EC;&#xC131;!');
    }

    var trainData = getTrainingData();
    if(trainData.sessions > 0 && !a.a_v14_training){
      a.a_v14_training = Date.now();
      showToastV14('&#x1F3C6; &#xC218;&#xB828;&#xC758; &#xC2DC;&#xC791; &#xC5C5;&#xC801; &#xB2EC;&#xC131;!');
    }
    if(trainData.bestScore >= 200 && !a.a_v14_training_s){
      a.a_v14_training_s = Date.now();
      showToastV14('&#x1F3C6; S&#xB4F1;&#xAE09; &#xD2B8;&#xB808;&#xC774;&#xB108; &#xC5C5;&#xC801; &#xB2EC;&#xC131;!');
    }

    var letterData = getLetterData();
    if(letterData.sent.length > 0 && !a.a_v14_letter_first){
      a.a_v14_letter_first = Date.now();
      showToastV14('&#x1F3C6; &#xCCAB; &#xD3B8;&#xC9C0; &#xC5C5;&#xC801; &#xB2EC;&#xC131;!');
    }

    var features = [];
    try{ features = JSON.parse(localStorage.getItem('hatcuping_v14_features') || '[]'); }catch(e){}
    if(features.length >= 6 && !a.a_v14_explorer){
      a.a_v14_explorer = Date.now();
      showToastV14('&#x1F3C6; v14 &#xD0D0;&#xD5D8;&#xAC00; &#xC5C5;&#xC801; &#xB2EC;&#xC131;!');
    }

    localStorage.setItem('hatcuping_achievements', JSON.stringify(a));
  }catch(e){}
}


// ============================================================
// QUIZ V14 (+15 questions, 75->90)
// ============================================================
function injectExtraQuizV14(){
  if(!window.QUIZ_BANK) window.QUIZ_BANK = [];
  var newQ = [
    {q:'&#xD558;&#xCE04;&#xD551;&#xC758; &#xC18D;&#xC131;&#xC740;?',a:['&#xC0AC;&#xB791;','&#xC6A9;&#xAE30;','&#xC9C0;&#xD61C;','&#xD589;&#xBCF5;'],c:0},
    {q:'&#xB9C8;&#xBC95; &#xC8FC;&#xBB38;&#xC11C;&#xC5D0;&#xB294; &#xCD1D; &#xBA87;&#xC885;&#xC758; &#xB9C8;&#xBC95;&#xC774; &#xC788;&#xB098;&#xC694;?',a:['8','10','12','15'],c:2},
    {q:'&#xC804;&#xC124; &#xB4F1;&#xAE09; &#xB9C8;&#xBC95;&#xC740; &#xBA87;&#xAC1C;?',a:['1','2','3','4'],c:1},
    {q:'&#xBCC4;&#xBE5B;&#xD551;&#xC758; &#xC2A4;&#xD0AC;&#xC740;?',a:['&#xD558;&#xD2B8;&#xBE44;&#xBE54;','&#xC720;&#xC131;&#xC6B0;&#xC8FC;&#xBE54;','&#xBB34;&#xC9C0;&#xAC1C;&#xD3ED;&#xD48D;','&#xBCC4;&#xBE5B;&#xC9C0;&#xC2DD;'],c:1},
    {q:'&#xD2F0;&#xB2C8;&#xD551; &#xB3C4;&#xAC10;&#xC5D0;&#xB294; &#xCD1D; &#xBA87;&#xC885;&#xC774; &#xC788;&#xB098;&#xC694;?',a:['8','10','12','15'],c:2},
    {q:'&#xAC10;&#xC815; &#xB0A0;&#xC528; &#xC2DC;&#xC2A4;&#xD15C;&#xC758; &#xB0A0;&#xC528; &#xC885;&#xB958; &#xC218;&#xB294;?',a:['4','6','8','10'],c:2},
    {q:'&#xD2B8;&#xB808;&#xC774;&#xB2DD; &#xB3C4;&#xC7A5;&#xC5D0;&#xC11C; S&#xB4F1;&#xAE09;&#xC744; &#xBC1B;&#xC73C;&#xB824;&#xBA74; &#xBA87;&#xC810; &#xC774;&#xC0C1;?',a:['100','150','200','250'],c:2},
    {q:'&#xC2A4;&#xD1A0;&#xB9AC; &#xAC24;&#xB7EC;&#xB9AC;&#xC758; &#xCD1D; &#xC5D0;&#xD53C;&#xC18C;&#xB4DC; &#xC218;&#xB294;?',a:['8','10','12','15'],c:2},
    {q:'&#xC6B0;&#xC815; &#xAC8C;&#xC2DC;&#xD310;&#xC5D0;&#xC11C; &#xD3B8;&#xC9C0;&#xB97C; &#xBCF4;&#xB0BC; &#xC218; &#xC788;&#xB294; &#xCE90;&#xB9AD;&#xD130; &#xC218;&#xB294;?',a:['8','10','12','15'],c:2},
    {q:'&#xC77C;&#xC77C; &#xBCF4;&#xC0C1; &#xCE98;&#xB9B0;&#xB354;&#xB294; &#xBA87;&#xC77C;&#xAE4C;&#xC9C0;?',a:['7','14','21','30'],c:3},
    {q:'&#xBB34;&#xC9C0;&#xAC1C;&#xD551;&#xC758; &#xACF5;&#xACA9;&#xB825;&#xC740;?',a:['100','110','120','130'],c:2},
    {q:'&#xAC8C;&#xC73C;&#xB978;&#xD551;&#xC758; &#xD2B9;&#xAE30;&#xB294;?',a:['&#xBD84;&#xB178;&#xD3ED;&#xBC1C;','&#xC7A0;&#xC790;&#xB294;&#xC548;&#xAC1C;','&#xB208;&#xBB3C;&#xBE44;','&#xC9C8;&#xD22C;&#xC758;&#xBD88;&#xAF43;'],c:1},
    {q:'v14&#xC5D0;&#xC11C; &#xCD94;&#xAC00;&#xB41C; &#xC5C5;&#xC801; &#xC218;&#xB294;?',a:['8','10','12','15'],c:2},
    {q:'&#xCE90;&#xB9AD;&#xD130; &#xC2A4;&#xD0EF; &#xBE44;&#xAD50;&#xC758; &#xCD95; &#xC218;&#xB294;?',a:['4','5','6','8'],c:2},
    {q:'&#xC5B4;&#xB460;&#xC758; &#xC655;&#xC774; &#xBD80;&#xD65C;&#xD558;&#xB294; &#xC2DC;&#xC98C;&#xC740;?',a:['S2','S3','S4','S5'],c:2}
  ];
  newQ.forEach(function(q){
    var exists = false;
    for(var i=0;i<window.QUIZ_BANK.length;i++){
      if(window.QUIZ_BANK[i].q === q.q){ exists = true; break; }
    }
    if(!exists) window.QUIZ_BANK.push(q);
  });
}


// ============================================================
// KEYBOARD SHORTCUTS (8 new)
// ============================================================
function injectV14Keyboard(){
  document.addEventListener('keydown', function(e){
    if(e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if(!e.shiftKey) return;
    switch(e.key){
      case 'M': e.preventDefault(); openSpellbook(); break;
      case 'X': e.preventDefault(); openTinipingDex(); break;
      case 'C': e.preventDefault(); openDailyCalendar(); break;
      case 'G': e.preventDefault(); openStoryGallery(); break;
      case 'T': e.preventDefault(); openStatComparison(); break;
      case 'N': e.preventDefault(); openTrainingDojo(); break;
      case 'W': e.preventDefault(); openEmotionWeather(); break;
      case 'B': e.preventDefault(); openFriendshipBoard(); break;
    }
  });
}

function updateV14KeyboardHelp(){
  var modal = document.querySelector('#kbHelp .modal');
  if(!modal) return;
  var newRows = [
    {key:'Shift+M',desc:'&#xB9C8;&#xBC95; &#xC8FC;&#xBB38;&#xC11C;'},
    {key:'Shift+X',desc:'&#xD2F0;&#xB2C8;&#xD551; &#xB3C4;&#xAC10;'},
    {key:'Shift+C',desc:'&#xC77C;&#xC77C; &#xCE98;&#xB9B0;&#xB354;'},
    {key:'Shift+G',desc:'&#xC2A4;&#xD1A0;&#xB9AC; &#xAC24;&#xB7EC;&#xB9AC;'},
    {key:'Shift+T',desc:'&#xC2A4;&#xD0EF; &#xBE44;&#xAD50;'},
    {key:'Shift+N',desc:'&#xD2B8;&#xB808;&#xC774;&#xB2DD; &#xB3C4;&#xC7A5;'},
    {key:'Shift+W',desc:'&#xAC10;&#xC815; &#xB0A0;&#xC528;'},
    {key:'Shift+B',desc:'&#xC6B0;&#xC815; &#xAC8C;&#xC2DC;&#xD310;'}
  ];
  newRows.forEach(function(r){
    var row = document.createElement('div');
    row.className = 'kb-help-row';
    row.innerHTML = '<span>' + r.desc + '</span><span class="kb-help-key">' + r.key + '</span>';
    modal.appendChild(row);
  });
}


// ============================================================
// FAB (Floating Action Buttons)
// ============================================================
function injectV14FAB(){
  var existing = document.getElementById('v14fab');
  if(existing) return;

  var fab = document.createElement('div');
  fab.id = 'v14fab';
  fab.style.cssText = 'position:fixed;right:16px;bottom:80px;display:flex;flex-direction:column;gap:8px;z-index:900';

  var buttons = [
    {icon:'&#x1FA84;',color:'linear-gradient(135deg,#6366F1,#A855F7)',label:'&#xB9C8;&#xBC95; &#xC8FC;&#xBB38;&#xC11C;',action:openSpellbook},
    {icon:'&#x1F4D6;',color:'linear-gradient(135deg,#FF5FA2,#B066FF)',label:'&#xD2F0;&#xB2C8;&#xD551; &#xB3C4;&#xAC10;',action:openTinipingDex},
    {icon:'&#x1F4C5;',color:'linear-gradient(135deg,#4CAF50,#81C784)',label:'&#xC77C;&#xC77C; &#xCE98;&#xB9B0;&#xB354;',action:openDailyCalendar},
    {icon:'&#x1F4DA;',color:'linear-gradient(135deg,#FF9800,#F57C00)',label:'&#xC2A4;&#xD1A0;&#xB9AC;',action:openStoryGallery},
    {icon:'&#x1F4CA;',color:'linear-gradient(135deg,#2196F3,#1565C0)',label:'&#xC2A4;&#xD0EF; &#xBE44;&#xAD50;',action:openStatComparison},
    {icon:'&#x1F94B;',color:'linear-gradient(135deg,#F44336,#C62828)',label:'&#xD2B8;&#xB808;&#xC774;&#xB2DD;',action:openTrainingDojo},
    {icon:'&#x1F326;&#xFE0F;',color:'linear-gradient(135deg,#00BCD4,#0097A7)',label:'&#xAC10;&#xC815; &#xB0A0;&#xC528;',action:openEmotionWeather},
    {icon:'&#x1F48C;',color:'linear-gradient(135deg,#E91E63,#C2185B)',label:'&#xC6B0;&#xC815; &#xAC8C;&#xC2DC;&#xD310;',action:openFriendshipBoard}
  ];

  buttons.forEach(function(b){
    var btn = document.createElement('button');
    btn.style.cssText = 'width:36px;height:36px;border-radius:50%;border:none;background:' + b.color + ';color:#fff;font-size:16px;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.2);transition:all .2s;display:flex;align-items:center;justify-content:center';
    btn.innerHTML = b.icon;
    btn.setAttribute('aria-label', b.label);
    btn.setAttribute('title', b.label);
    btn.onmouseenter = function(){ btn.style.transform = 'scale(1.2)'; };
    btn.onmouseleave = function(){ btn.style.transform = 'scale(1)'; };
    btn.onclick = b.action;
    fab.appendChild(btn);
  });

  document.body.appendChild(fab);
}


// ============================================================
// QUICK ACTIONS (top bar buttons)
// ============================================================
function injectV14QuickActions(){
  var topBar = document.querySelector('.top-bar');
  if(!topBar) return;

  var btns = [
    {id:'spellBtn',label:'&#xB9C8;&#xBC95;',icon:'&#x1FA84;',title:'&#xB9C8;&#xBC95; &#xC8FC;&#xBB38;&#xC11C; (Shift+M)',action:openSpellbook},
    {id:'dexBtn',label:'&#xB3C4;&#xAC10;',icon:'&#x1F4D6;',title:'&#xD2F0;&#xB2C8;&#xD551; &#xB3C4;&#xAC10; (Shift+X)',action:openTinipingDex},
    {id:'calendarBtn',label:'&#xCE98;&#xB9B0;&#xB354;',icon:'&#x1F4C5;',title:'&#xC77C;&#xC77C; &#xBCF4;&#xC0C1; (Shift+C)',action:openDailyCalendar},
    {id:'storyBtn',label:'&#xC2A4;&#xD1A0;&#xB9AC;',icon:'&#x1F4DA;',title:'&#xC2A4;&#xD1A0;&#xB9AC; &#xAC24;&#xB7EC;&#xB9AC; (Shift+G)',action:openStoryGallery},
    {id:'trainBtn',label:'&#xC218;&#xB828;',icon:'&#x1F94B;',title:'&#xD2B8;&#xB808;&#xC774;&#xB2DD; &#xB3C4;&#xC7A5; (Shift+N)',action:openTrainingDojo},
    {id:'weatherBtn',label:'&#xB0A0;&#xC528;',icon:'&#x1F326;&#xFE0F;',title:'&#xAC10;&#xC815; &#xB0A0;&#xC528; (Shift+W)',action:openEmotionWeather}
  ];

  btns.forEach(function(b){
    if(document.getElementById(b.id)) return;
    var btn = document.createElement('button');
    btn.id = b.id;
    btn.className = 'top-btn';
    btn.setAttribute('aria-label', b.label);
    btn.setAttribute('title', b.title);
    btn.innerHTML = b.icon + ' <span style="font-size:11px">' + b.label + '</span>';
    btn.addEventListener('click', b.action);
    topBar.appendChild(btn);
  });
}


// ============================================================
// FOOTER, NEWS, META, ACHIEVE COUNT UPDATE
// ============================================================
function updateV14Footer(){
  var ver = document.querySelector('.footer .version');
  if(ver) ver.textContent = 'v14.0 | © PRIME Holdings NEXTERA+PRISM';

  var links = document.querySelector('.footer-links');
  if(links) links.innerHTML = '<span class="footer-link">4&#xC885; &#xAC8C;&#xC784;</span><span class="footer-link">106&#xAC1C; &#xC5C5;&#xC801;</span><span class="footer-link">12&#xC885; &#xB9C8;&#xBC95;</span><span class="footer-link">12&#xC885; &#xB3C4;&#xAC10;</span><span class="footer-link">12&#xD3B8; &#xC2A4;&#xD1A0;&#xB9AC;</span><span class="footer-link">&#xD000;&#xC988; 90&#xBB38;</span>';
}

function updateV14News(){
  var newsSection = document.querySelector('.news-section');
  if(!newsSection) return;
  var firstItem = newsSection.querySelector('.news-item');
  if(!firstItem) return;
  var newItem = document.createElement('div');
  newItem.className = 'news-item';
  newItem.innerHTML = '<span class="news-date">v14.0</span><span class="news-text">&#xB9C8;&#xBC95;&#xC8FC;&#xBB38;&#xC11C; 12&#xC885;, &#xD2F0;&#xB2C8;&#xD551;&#xB3C4;&#xAC10; 12&#xC885;, &#xC77C;&#xC77C;&#xCE98;&#xB9B0;&#xB354;Canvas, &#xC2A4;&#xD1A0;&#xB9AC;&#xAC24;&#xB7EC;&#xB9AC; 12&#xD3B8;, &#xC2A4;&#xD0EF;&#xBE44;&#xAD50;Canvas 6&#xCD95;, &#xD2B8;&#xB808;&#xC774;&#xB2DD;&#xB3C4;&#xC7A5;Canvas, &#xAC10;&#xC815;&#xB0A0;&#xC528; 8&#xC885;, &#xC6B0;&#xC815;&#xAC8C;&#xC2DC;&#xD310; 12&#xCE78;, &#xD000;&#xC988;+15(90), &#xC5C5;&#xC801;+12(106)</span>';
  firstItem.parentNode.insertBefore(newItem, firstItem);
}

function updateV14AchieveCount(){
  var el = document.getElementById('achieveCount');
  if(el){
    var c = 0;
    try{ c = Object.keys(JSON.parse(localStorage.getItem('hatcuping_achievements') || '{}')).length; }catch(e){}
    var t = window.AD ? window.AD.length : 106;
    el.textContent = c + '/' + t;
  }
}

function updateV14Meta(){
  var descMeta = document.querySelector('meta[name="description"]');
  if(descMeta) descMeta.content = '사랑의 하츄핑 v14.0 - 플랫포머 액션, 턴제 RPG, 오픈월드, UNIFIED 4종 게임. 업적 106개, 마법주문서 12종, 티니핑도감 12종, 스토리 12편, 트레이닝도장, 감정날씨 8종, 퀀즈 90문!';
  document.title = '사랑의 하츄핑 v14.0 - 게임 선택';
}


// ============================================================
// BOOT
// ============================================================
function bootV14(){
  injectV14Achievements();
  injectExtraQuizV14();
  injectV14QuickActions();
  injectV14Keyboard();
  updateV14KeyboardHelp();
  injectV14FAB();
  updateV14Footer();
  updateV14News();
  updateV14AchieveCount();
  updateV14Meta();
  checkAndAwardV14();
}

if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', bootV14);
} else {
  bootV14();
}

})();

// hatcuping-game v13_patch.js - NEXTERA+PRISM AUTO v13.0
// Self-contained patch module (1200+ lines, 50+ functions)
(function(){
'use strict';

// ============================================================
// SFX ENGINE (12 sound types)
// ============================================================
var _v13Ctx = null;
function _v13InitAudio(){
  if(!_v13Ctx){
    try{ _v13Ctx = new (window.AudioContext || window.webkitAudioContext)(); }catch(e){}
  }
  if(_v13Ctx && _v13Ctx.state === 'suspended') _v13Ctx.resume();
}

var V13_SFX = {
  craft_open:{f:620,d:.07,t:'triangle'},
  craft_success:{f:1047,d:.15,t:'sine'},
  pet_open:{f:700,d:.06,t:'sine'},
  pet_action:{f:880,d:.05,t:'triangle'},
  pet_levelup:{f:1100,d:.12,t:'sine'},
  combo_open:{f:550,d:.06,t:'square'},
  combo_hit:{f:990,d:.04,t:'triangle'},
  combo_grade:{f:1200,d:.1,t:'sine'},
  diary_open:{f:500,d:.06,t:'triangle'},
  diary_save:{f:660,d:.06,t:'sine'},
  quest_open:{f:600,d:.06,t:'triangle'},
  affinity_open:{f:700,d:.07,t:'sine'}
};

function sfxV13(type){
  _v13InitAudio();
  if(!_v13Ctx) return;
  var s = V13_SFX[type];
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


// ============================================================
// UTILITY FUNCTIONS
// ============================================================
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

function v13Load(key, fallback){
  try{ var d = JSON.parse(localStorage.getItem('hatcuping_v13_' + key)); return d !== null ? d : fallback; }catch(e){ return fallback; }
}

function v13Save(key, data){
  try{ localStorage.setItem('hatcuping_v13_' + key, JSON.stringify(data)); }catch(e){}
}

function todayStr(){
  var d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}


// ============================================================
// 1. CRAFTING WORKSHOP (크래프팅 공방)
// ============================================================
var CRAFT_MATERIALS = [
  {id:'emotion_crystal',name:'이모션결정',icon:'&#x1F48E;',color:'#9C27B0'},
  {id:'shiny_powder',name:'빛나는가루',icon:'&#x2728;',color:'#FFD700'},
  {id:'love_flower',name:'사랑의꽃',icon:'&#x1F33A;',color:'#FF5FA2'},
  {id:'rainbow_stone',name:'무지개돌',icon:'&#x1F308;',color:'#4CAF50'}
];

var CRAFT_RECIPES = [
  {id:'cr_ring',name:'사랑의 반지',icon:'&#x1F48D;',rarity:'common',mats:{emotion_crystal:2,shiny_powder:1},desc:'하츄핑의 사랑이 담긴 반지'},
  {id:'cr_wand',name:'별빛 요술봉',icon:'&#x1FA84;',rarity:'common',mats:{shiny_powder:2,love_flower:1},desc:'반짝이는 별빛이 담긴 봉'},
  {id:'cr_potion',name:'치유의 물약',icon:'&#x1F9EA;',rarity:'common',mats:{love_flower:2,rainbow_stone:1},desc:'모든 상처를 치유하는 물약'},
  {id:'cr_shield',name:'무지개 방패',icon:'&#x1F6E1;&#xFE0F;',rarity:'rare',mats:{rainbow_stone:3,emotion_crystal:2},desc:'무지개 빛으로 보호하는 방패'},
  {id:'cr_crown',name:'이모션 왕관',icon:'&#x1F451;',rarity:'rare',mats:{emotion_crystal:3,shiny_powder:2},desc:'감정의 힘이 깃든 왕관'},
  {id:'cr_necklace',name:'하트 목걸이',icon:'&#x1F4FF;',rarity:'rare',mats:{love_flower:3,shiny_powder:2},desc:'진심을 전하는 목걸이'},
  {id:'cr_wings',name:'빛나는 날개',icon:'&#x1FABD;',rarity:'epic',mats:{shiny_powder:4,rainbow_stone:3,emotion_crystal:2},desc:'하늘을 나는 빛의 날개'},
  {id:'cr_harp',name:'이모션 하프',icon:'&#x1F3B5;',rarity:'epic',mats:{emotion_crystal:4,love_flower:3,shiny_powder:2},desc:'감정을 노래하는 악기'},
  {id:'cr_mirror',name:'진실의 거울',icon:'&#x1FA9E;',rarity:'epic',mats:{rainbow_stone:4,emotion_crystal:3,love_flower:2},desc:'진실을 비춰주는 거울'},
  {id:'cr_star',name:'별빛 티아라',icon:'&#x1F31F;',rarity:'legendary',mats:{emotion_crystal:5,shiny_powder:5,love_flower:3,rainbow_stone:3},desc:'모든 감정을 담은 별빛 왕관'},
  {id:'cr_scepter',name:'사랑의 홀',icon:'&#x1FA97;',rarity:'legendary',mats:{love_flower:5,rainbow_stone:5,emotion_crystal:3,shiny_powder:3},desc:'세상을 사랑으로 채우는 홀'},
  {id:'cr_orb',name:'무지개 오브',icon:'&#x1F52E;',rarity:'legendary',mats:{rainbow_stone:6,shiny_powder:4,love_flower:4,emotion_crystal:2},desc:'무한한 가능성의 구슬'}
];

var RARITY_COLORS = {common:'#8BC34A',rare:'#2196F3',epic:'#9C27B0',legendary:'#FFD700'};
var RARITY_NAMES = {common:'일반',rare:'레어',epic:'에픽',legendary:'전설'};

function getCraftData(){
  return v13Load('craft', {inventory:{},crafted:[],lastFree:''});
}
function saveCraftData(d){ v13Save('craft', d); }

function claimFreeMaterials(){
  var d = getCraftData();
  var today = todayStr();
  if(d.lastFree === today) return false;
  CRAFT_MATERIALS.forEach(function(m){
    d.inventory[m.id] = (d.inventory[m.id] || 0) + 3;
  });
  d.lastFree = today;
  saveCraftData(d);
  return true;
}

function canCraft(recipe, inv){
  var keys = Object.keys(recipe.mats);
  for(var i = 0; i < keys.length; i++){
    if((inv[keys[i]] || 0) < recipe.mats[keys[i]]) return false;
  }
  return true;
}

function doCraft(recipe){
  var d = getCraftData();
  if(!canCraft(recipe, d.inventory)) return false;
  var keys = Object.keys(recipe.mats);
  for(var i = 0; i < keys.length; i++){
    d.inventory[keys[i]] -= recipe.mats[keys[i]];
  }
  if(d.crafted.indexOf(recipe.id) === -1) d.crafted.push(recipe.id);
  saveCraftData(d);
  checkAndAwardV13();
  return true;
}

function openCraftWorkshop(){
  if(document.getElementById('craftModal')) return;
  trackV13Feature('craft');
  sfxV13('craft_open');

  var overlay = document.createElement('div');
  overlay.id = 'craftModal';
  overlay.className = 'modal-overlay show';
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');

  function renderCraft(){
    var d = getCraftData();
    var html = '<div class="modal" style="max-width:460px">';
    html += '<button class="modal-close" id="craftClose" aria-label="&#xB2EB;&#xAE30;">&times;</button>';
    html += '<h3 style="font-size:17px">&#x1F528; 크래프팅 공방 (' + d.crafted.length + '/' + CRAFT_RECIPES.length + ')</h3>';

    // Materials bar
    html += '<div style="display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap">';
    CRAFT_MATERIALS.forEach(function(m){
      html += '<div style="flex:1;min-width:80px;padding:6px 8px;border-radius:10px;background:rgba(0,0,0,.04);text-align:center;font-size:11px">';
      html += '<div style="font-size:16px">' + m.icon + '</div>';
      html += '<div style="font-weight:700">' + (d.inventory[m.id] || 0) + '</div>';
      html += '<div style="color:var(--text-sub);font-size:9px">' + m.name + '</div></div>';
    });
    html += '</div>';

    // Daily free button
    var today = todayStr();
    var canFree = d.lastFree !== today;
    html += '<div style="text-align:center;margin-bottom:10px"><button id="craftFreeBtn" style="padding:6px 16px;background:' + (canFree ? 'linear-gradient(135deg,#4CAF50,#81C784)' : 'rgba(0,0,0,.1)') + ';color:' + (canFree ? '#fff' : 'var(--text-sub)') + ';border:none;border-radius:10px;font-size:12px;font-weight:700;cursor:' + (canFree ? 'pointer' : 'default') + '">' + (canFree ? '&#x1F381; 오늘의 무료 재료 받기' : '&#x2705; 오늘 이미 받았어요') + '</button></div>';

    // Recipe grid (2 columns)
    html += '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:6px;max-height:320px;overflow-y:auto">';
    CRAFT_RECIPES.forEach(function(r){
      var owned = d.crafted.indexOf(r.id) !== -1;
      var able = canCraft(r, d.inventory);
      var rc = RARITY_COLORS[r.rarity];
      html += '<div class="craft-item" data-id="' + r.id + '" style="padding:10px 8px;border-radius:12px;text-align:center;background:' + (owned ? 'rgba(76,175,80,.08)' : able ? 'rgba(255,95,162,.05)' : 'rgba(0,0,0,.03)') + ';border:2px solid ' + (owned ? '#4CAF50' : able ? rc : 'transparent') + ';cursor:' + (owned ? 'default' : able ? 'pointer' : 'default') + ';opacity:' + (owned || able ? '1' : '.6') + ';transition:all .2s">';
      html += '<div style="font-size:24px">' + r.icon + '</div>';
      html += '<div style="font-size:12px;font-weight:700;margin-top:2px">' + r.name + '</div>';
      html += '<div style="font-size:9px;color:' + rc + ';font-weight:700">[' + RARITY_NAMES[r.rarity] + ']</div>';
      html += '<div style="font-size:9px;color:var(--text-sub);margin-top:2px">' + r.desc + '</div>';
      if(owned){
        html += '<div style="font-size:9px;color:#4CAF50;font-weight:700;margin-top:2px">&#x2705; 제작 완료</div>';
      } else {
        var matStr = '';
        var mKeys = Object.keys(r.mats);
        mKeys.forEach(function(mk){
          var mat = CRAFT_MATERIALS.filter(function(m){ return m.id === mk; })[0];
          var have = d.inventory[mk] || 0;
          var need = r.mats[mk];
          matStr += '<span style="color:' + (have >= need ? '#4CAF50' : '#F44336') + '">' + (mat ? mat.icon : '') + have + '/' + need + '</span> ';
        });
        html += '<div style="font-size:9px;margin-top:2px">' + matStr + '</div>';
      }
      html += '</div>';
    });
    html += '</div></div>';

    overlay.innerHTML = html;

    document.getElementById('craftFreeBtn').onclick = function(){
      if(claimFreeMaterials()){
        sfxV13('craft_success');
        showToastV13('&#x1F381; 무료 재료를 받았어요!');
        renderCraft();
      }
    };

    overlay.querySelectorAll('.craft-item').forEach(function(el){
      el.onclick = function(){
        var rid = el.dataset.id;
        var recipe = CRAFT_RECIPES.filter(function(r){ return r.id === rid; })[0];
        if(!recipe) return;
        var cd = getCraftData();
        if(cd.crafted.indexOf(rid) !== -1) return;
        if(doCraft(recipe)){
          sfxV13('craft_success');
          showToastV13('&#x1F528; ' + recipe.icon + ' ' + recipe.name + ' 제작 완료!');
          renderCraft();
        } else {
          showToastV13('&#x26A0;&#xFE0F; 재료가 부족해요!');
        }
      };
    });

    document.getElementById('craftClose').onclick = function(){ overlay.remove(); };
    overlay.onclick = function(e){ if(e.target === overlay) overlay.remove(); };
  }

  renderCraft();
}


// ============================================================
// 2. PET NURTURING (펫 키우기)
// ============================================================
var PET_LIST = [
  {id:'star_rabbit',name:'별토끼',icon:'&#x1F430;',color:'#FFD700',personality:'호기심 많은'},
  {id:'cloud_cat',name:'구름고양이',icon:'&#x1F431;',color:'#90CAF9',personality:'느균하고 여유로운'},
  {id:'flower_dog',name:'꽃강아지',icon:'&#x1F436;',color:'#FF8A80',personality:'충성스러운'},
  {id:'rainbow_bird',name:'무지개새',icon:'&#x1F426;',color:'#4CAF50',personality:'자유로운'},
  {id:'moon_fox',name:'달빛여우',icon:'&#x1F98A;',color:'#B39DDB',personality:'신비로운'},
  {id:'heart_bear',name:'하트곰',icon:'&#x1F43B;',color:'#FF5FA2',personality:'다정한'}
];

var PET_STAGES = [
  {name:'아기',min:0,suffix:' 아기'},
  {name:'청소년',min:30,suffix:' 청소년'},
  {name:'성인',min:70,suffix:''}
];

function getPetData(){
  return v13Load('pet', {adopted:null,happiness:50,hunger:50,growth:0,lastAction:''});
}
function savePetData(d){ v13Save('pet', d); }

function getPetStage(growth){
  for(var i = PET_STAGES.length - 1; i >= 0; i--){
    if(growth >= PET_STAGES[i].min) return PET_STAGES[i];
  }
  return PET_STAGES[0];
}

function petAction(action){
  var d = getPetData();
  if(!d.adopted) return d;
  if(action === 'feed'){
    d.hunger = Math.min(100, d.hunger + 20);
    d.happiness = Math.min(100, d.happiness + 5);
    d.growth = Math.min(100, d.growth + 3);
  } else if(action === 'play'){
    d.happiness = Math.min(100, d.happiness + 15);
    d.hunger = Math.max(0, d.hunger - 10);
    d.growth = Math.min(100, d.growth + 5);
  } else if(action === 'sleep'){
    d.hunger = Math.max(0, d.hunger - 5);
    d.happiness = Math.min(100, d.happiness + 10);
    d.growth = Math.min(100, d.growth + 4);
  }
  d.lastAction = todayStr();
  savePetData(d);
  checkAndAwardV13();
  return d;
}

function openPetNurturing(){
  if(document.getElementById('petModal')) return;
  trackV13Feature('pet');
  sfxV13('pet_open');

  var overlay = document.createElement('div');
  overlay.id = 'petModal';
  overlay.className = 'modal-overlay show';
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');

  function renderPet(){
    var d = getPetData();
    var html = '<div class="modal" style="max-width:400px">';
    html += '<button class="modal-close" id="petClose" aria-label="&#xB2EB;&#xAE30;">&times;</button>';
    html += '<h3 style="font-size:17px">&#x1F43E; 펫 키우기</h3>';

    if(!d.adopted){
      // Adoption screen
      html += '<div style="font-size:12px;color:var(--text-sub);margin-bottom:10px">함께할 펫을 입양하세요!</div>';
      html += '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px">';
      PET_LIST.forEach(function(p){
        html += '<div class="pet-adopt" data-id="' + p.id + '" style="padding:12px;border-radius:14px;text-align:center;background:rgba(0,0,0,.03);border:2px solid transparent;cursor:pointer;transition:all .2s">';
        html += '<div style="font-size:32px">' + p.icon + '</div>';
        html += '<div style="font-size:13px;font-weight:700;margin-top:4px">' + p.name + '</div>';
        html += '<div style="font-size:10px;color:var(--text-sub)">' + p.personality + '</div></div>';
      });
      html += '</div>';
    } else {
      // Pet care screen
      var pet = PET_LIST.filter(function(p){ return p.id === d.adopted; })[0];
      var stage = getPetStage(d.growth);
      if(!pet) pet = PET_LIST[0];

      html += '<div style="text-align:center;padding:12px 0">';
      html += '<div style="font-size:48px">' + pet.icon + '</div>';
      html += '<div style="font-size:18px;font-weight:800;color:' + pet.color + '">' + pet.name + stage.suffix + '</div>';
      html += '<div style="font-size:12px;color:var(--text-sub)">성장 단계: ' + stage.name + ' | ' + pet.personality + '</div>';
      html += '</div>';

      // Stats bars
      var bars = [
        {label:'행복도',val:d.happiness,color:'#FF5FA2',icon:'&#x1F49D;'},
        {label:'포만감',val:d.hunger,color:'#FF9800',icon:'&#x1F35E;'},
        {label:'성장',val:d.growth,color:'#4CAF50',icon:'&#x1F331;'}
      ];
      bars.forEach(function(b){
        html += '<div style="margin-bottom:6px"><div style="display:flex;justify-content:space-between;font-size:11px;font-weight:700"><span>' + b.icon + ' ' + b.label + '</span><span>' + b.val + '/100</span></div>';
        html += '<div style="height:8px;background:rgba(0,0,0,.08);border-radius:4px;overflow:hidden"><div style="width:' + b.val + '%;height:100%;background:' + b.color + ';border-radius:4px;transition:width .3s"></div></div></div>';
      });

      // Action buttons
      html += '<div style="display:flex;gap:6px;margin-top:12px">';
      html += '<button class="pet-act" data-act="feed" style="flex:1;padding:10px;border:none;border-radius:12px;background:linear-gradient(135deg,#FF9800,#FFB74D);color:#fff;font-weight:700;font-size:13px;cursor:pointer">&#x1F35E; 밥주기</button>';
      html += '<button class="pet-act" data-act="play" style="flex:1;padding:10px;border:none;border-radius:12px;background:linear-gradient(135deg,#FF5FA2,#FF8EC4);color:#fff;font-weight:700;font-size:13px;cursor:pointer">&#x1F3BE; 놀아주기</button>';
      html += '<button class="pet-act" data-act="sleep" style="flex:1;padding:10px;border:none;border-radius:12px;background:linear-gradient(135deg,#7E57C2,#B39DDB);color:#fff;font-weight:700;font-size:13px;cursor:pointer">&#x1F4A4; 재우기</button>';
      html += '</div>';
      html += '<div id="petResult" style="text-align:center;font-size:12px;margin-top:6px;min-height:18px;color:var(--text-sub)"></div>';
    }

    html += '</div>';
    overlay.innerHTML = html;

    // Adoption handlers
    overlay.querySelectorAll('.pet-adopt').forEach(function(el){
      el.onmouseenter = function(){ el.style.borderColor = 'var(--pink)'; el.style.transform = 'translateY(-2px)'; };
      el.onmouseleave = function(){ el.style.borderColor = 'transparent'; el.style.transform = ''; };
      el.onclick = function(){
        var pid = el.dataset.id;
        var dd = getPetData();
        dd.adopted = pid;
        dd.happiness = 60;
        dd.hunger = 60;
        dd.growth = 0;
        savePetData(dd);
        sfxV13('pet_levelup');
        var pet2 = PET_LIST.filter(function(p){ return p.id === pid; })[0];
        showToastV13('&#x1F43E; ' + (pet2 ? pet2.name : '') + '을(를) 입양했어요!');
        checkAndAwardV13();
        renderPet();
      };
    });

    // Action handlers
    overlay.querySelectorAll('.pet-act').forEach(function(btn){
      btn.onclick = function(){
        var act = btn.dataset.act;
        var newD = petAction(act);
        sfxV13('pet_action');
        var msgs = {feed:'&#x1F35E; 밥을 주었어요!',play:'&#x1F3BE; 신나게 놀았어요!',sleep:'&#x1F4A4; 편안하게 잠들었어요!'};
        var extra = '';
        if(newD.happiness >= 100) extra = ' &#x1F496; 최고 행복!';
        if(newD.growth >= 70 && getPetStage(newD.growth - 5).name !== getPetStage(newD.growth).name){
          extra += ' &#x1F389; 성장했어요!';
          sfxV13('pet_levelup');
        }
        showToastV13(msgs[act] + extra);
        renderPet();
      };
    });

    document.getElementById('petClose').onclick = function(){ overlay.remove(); };
    overlay.onclick = function(e){ if(e.target === overlay) overlay.remove(); };
  }

  renderPet();
}


// ============================================================
// 3. COMBO TRAINING DOJO (콤보 트레이닝 도장)
// ============================================================
var COMBO_LIST = [
  {id:'cb_heart',name:'하트 스트라이크',seq:['up','right','down','left','up'],grade:''},
  {id:'cb_star',name:'별빛 콤보',seq:['left','left','right','up','down'],grade:''},
  {id:'cb_rainbow',name:'무지개 어택',seq:['up','up','down','down','left','right'],grade:''},
  {id:'cb_shield',name:'실드 배리어',seq:['down','down','left','right','up'],grade:''},
  {id:'cb_storm',name:'폭풍 러시',seq:['right','up','left','down','right','up'],grade:''},
  {id:'cb_heal',name:'힌링 웨이브',seq:['up','left','down','right','down','left','up'],grade:''},
  {id:'cb_ultimate',name:'얼티먻 비트',seq:['up','right','down','left','up','right','down'],grade:''},
  {id:'cb_legend',name:'전설의 연무',seq:['left','up','right','down','left','up','right','down'],grade:''}
];

var ARROW_MAP = {up:'↑',down:'↓',left:'←',right:'→'};
var GRADE_THRESHOLDS = [{name:'S',max:1.2},{name:'A',max:2.0},{name:'B',max:3.0},{name:'C',max:4.5},{name:'D',max:999}];

function getComboData(){
  return v13Load('combo', {scores:{}});
}
function saveComboData(d){ v13Save('combo', d); }

function openComboDojo(){
  if(document.getElementById('comboModal')) return;
  trackV13Feature('combo');
  sfxV13('combo_open');

  var overlay = document.createElement('div');
  overlay.id = 'comboModal';
  overlay.className = 'modal-overlay show';
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');

  function renderComboList(){
    var cd = getComboData();
    var html = '<div class="modal" style="max-width:420px">';
    html += '<button class="modal-close" id="comboClose" aria-label="&#xB2EB;&#xAE30;">&times;</button>';
    html += '<h3 style="font-size:17px">&#x1F94B; 콤보 트레이닝 도장</h3>';
    html += '<div style="font-size:12px;color:var(--text-sub);margin-bottom:10px">화살표 버튼을 순서대로 누르세요!</div>';

    COMBO_LIST.forEach(function(c){
      var best = cd.scores[c.id] || null;
      html += '<div class="combo-item" data-id="' + c.id + '" style="display:flex;gap:10px;padding:10px;margin-bottom:6px;border-radius:12px;background:rgba(0,0,0,.03);border:1px solid var(--border);cursor:pointer;transition:all .2s">';
      html += '<div style="flex:1"><div style="font-size:13px;font-weight:700">' + c.name + '</div>';
      html += '<div style="font-size:11px;color:var(--text-sub);margin-top:2px">';
      c.seq.forEach(function(s){ html += '<span style="display:inline-block;width:20px;height:20px;line-height:20px;text-align:center;background:rgba(0,0,0,.06);border-radius:4px;margin-right:2px;font-size:12px">' + ARROW_MAP[s] + '</span>'; });
      html += '</div>';
      if(best){
        var gc = best.grade === 'S' ? '#FFD700' : best.grade === 'A' ? '#4CAF50' : best.grade === 'B' ? '#2196F3' : '#9E9E9E';
        html += '<div style="font-size:10px;margin-top:2px;color:' + gc + ';font-weight:700">베스트: ' + best.grade + ' (' + best.time.toFixed(2) + '초)</div>';
      }
      html += '</div></div>';
    });
    html += '</div>';
    overlay.innerHTML = html;

    overlay.querySelectorAll('.combo-item').forEach(function(el){
      el.onmouseenter = function(){ el.style.transform = 'translateY(-2px)'; el.style.boxShadow = '0 4px 16px rgba(255,95,162,.15)'; };
      el.onmouseleave = function(){ el.style.transform = ''; el.style.boxShadow = ''; };
      el.onclick = function(){
        var cid = el.dataset.id;
        var combo = COMBO_LIST.filter(function(c){ return c.id === cid; })[0];
        if(combo) startComboGame(overlay, combo);
      };
    });

    document.getElementById('comboClose').onclick = function(){ overlay.remove(); };
    overlay.onclick = function(e){ if(e.target === overlay) overlay.remove(); };
  }

  function startComboGame(ov, combo){
    var seqIdx = 0;
    var startTime = null;
    var finished = false;

    function renderComboPlay(){
      var html = '<div class="modal" style="max-width:380px;text-align:center">';
      html += '<h3 style="font-size:15px;margin-bottom:8px">&#x1F94B; ' + combo.name + '</h3>';

      // Show sequence with highlight
      html += '<div style="display:flex;gap:4px;justify-content:center;margin-bottom:16px;flex-wrap:wrap">';
      combo.seq.forEach(function(s, idx){
        var active = idx === seqIdx;
        var done = idx < seqIdx;
        html += '<div style="width:32px;height:32px;line-height:32px;text-align:center;border-radius:8px;font-size:18px;font-weight:700;background:' + (done ? '#4CAF50' : active ? 'var(--pink)' : 'rgba(0,0,0,.06)') + ';color:' + (done || active ? '#fff' : 'var(--text)') + ';transition:all .2s">' + ARROW_MAP[s] + '</div>';
      });
      html += '</div>';

      // Arrow buttons
      html += '<div style="display:grid;grid-template-columns:repeat(3,60px);grid-template-rows:repeat(2,48px);gap:6px;justify-content:center;margin-bottom:12px">';
      html += '<div></div>';
      html += '<button class="combo-btn" data-dir="up" style="padding:0;border:none;border-radius:12px;background:linear-gradient(135deg,#FF5FA2,#FF8EC4);color:#fff;font-size:22px;font-weight:700;cursor:pointer">↑</button>';
      html += '<div></div>';
      html += '<button class="combo-btn" data-dir="left" style="padding:0;border:none;border-radius:12px;background:linear-gradient(135deg,#B066FF,#D4A0FF);color:#fff;font-size:22px;font-weight:700;cursor:pointer">←</button>';
      html += '<button class="combo-btn" data-dir="down" style="padding:0;border:none;border-radius:12px;background:linear-gradient(135deg,#4CAF50,#81C784);color:#fff;font-size:22px;font-weight:700;cursor:pointer">↓</button>';
      html += '<button class="combo-btn" data-dir="right" style="padding:0;border:none;border-radius:12px;background:linear-gradient(135deg,#FF9800,#FFB74D);color:#fff;font-size:22px;font-weight:700;cursor:pointer">→</button>';
      html += '</div>';

      html += '<div id="comboStatus" style="font-size:12px;color:var(--text-sub);min-height:20px">시작하세요!</div>';
      html += '</div>';
      ov.innerHTML = html;

      ov.querySelectorAll('.combo-btn').forEach(function(btn){
        btn.onclick = function(){
          if(finished) return;
          var dir = btn.dataset.dir;
          if(!startTime) startTime = Date.now();

          if(dir === combo.seq[seqIdx]){
            sfxV13('combo_hit');
            seqIdx++;
            if(seqIdx >= combo.seq.length){
              finished = true;
              var elapsed = (Date.now() - startTime) / 1000;
              var avgPerKey = elapsed / combo.seq.length;
              var grade = 'D';
              for(var i = 0; i < GRADE_THRESHOLDS.length; i++){
                if(avgPerKey <= GRADE_THRESHOLDS[i].max){ grade = GRADE_THRESHOLDS[i].name; break; }
              }
              sfxV13('combo_grade');
              var cd2 = getComboData();
              if(!cd2.scores[combo.id] || elapsed < cd2.scores[combo.id].time){
                cd2.scores[combo.id] = {grade:grade,time:elapsed};
                saveComboData(cd2);
              }
              checkAndAwardV13();
              var gc2 = grade === 'S' ? '#FFD700' : grade === 'A' ? '#4CAF50' : grade === 'B' ? '#2196F3' : '#9E9E9E';
              showToastV13('&#x1F94B; ' + combo.name + ' - <b style="color:' + gc2 + '">' + grade + '등급</b> (' + elapsed.toFixed(2) + '초)');
              setTimeout(function(){ renderComboList(); }, 1200);
            } else {
              renderComboPlay();
            }
          } else {
            // Reset on wrong input
            seqIdx = 0;
            startTime = null;
            renderComboPlay();
            var status = document.getElementById('comboStatus');
            if(status) status.innerHTML = '<span style="color:#F44336">✖ 틀렸어요! 다시 시도!</span>';
          }
        };
      });
    }

    renderComboPlay();
  }

  renderComboList();
}


// ============================================================
// 4. EMOTION DIARY (이모션 감정일기)
// ============================================================
var DIARY_EMOTIONS = [
  {id:'joy',name:'기쁨',icon:'&#x1F60A;',color:'#FFD700'},
  {id:'love',name:'사랑',icon:'&#x1F496;',color:'#FF5FA2'},
  {id:'calm',name:'평온;',icon:'&#x1F60C;',color:'#4CAF50'},
  {id:'excited',name:'설렘;',icon:'&#x1F929;',color:'#FF6347'},
  {id:'sad',name:'슬픔;',icon:'&#x1F622;',color:'#4682B4'},
  {id:'angry',name:'화남',icon:'&#x1F620;',color:'#DC143C'},
  {id:'scared',name:'두려움',icon:'&#x1F628;',color:'#7B68EE'},
  {id:'tired',name:'피곤',icon:'&#x1F634;',color:'#9E9E9E'}
];

function getDiaryData(){
  return v13Load('diary', {entries:[],streak:0,lastDate:''});
}
function saveDiaryData(d){ v13Save('diary', d); }

function calcStreak(entries){
  if(entries.length === 0) return 0;
  var sorted = entries.slice().sort(function(a,b){ return b.date.localeCompare(a.date); });
  var streak = 1;
  var prev = sorted[0].date;
  for(var i = 1; i < sorted.length; i++){
    var d1 = new Date(prev);
    var d2 = new Date(sorted[i].date);
    var diff = (d1 - d2) / (1000 * 60 * 60 * 24);
    if(diff >= 0.5 && diff <= 1.5){
      streak++;
      prev = sorted[i].date;
    } else if(diff > 1.5){
      break;
    }
  }
  return streak;
}

function openEmotionDiary(){
  if(document.getElementById('diaryModal')) return;
  trackV13Feature('diary');
  sfxV13('diary_open');

  var overlay = document.createElement('div');
  overlay.id = 'diaryModal';
  overlay.className = 'modal-overlay show';
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');

  function renderDiary(){
    var d = getDiaryData();
    var streak = calcStreak(d.entries);
    var todayEntry = d.entries.filter(function(e){ return e.date === todayStr(); })[0];
    var html = '<div class="modal" style="max-width:420px">';
    html += '<button class="modal-close" id="diaryClose" aria-label="&#xB2EB;&#xAE30;">&times;</button>';
    html += '<h3 style="font-size:17px">&#x1F4D4; 이모션 감정일기</h3>';
    html += '<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:10px"><span style="color:var(--text-sub)">총 ' + d.entries.length + '일 기록</span><span style="color:#FF9800;font-weight:700">&#x1F525; 연속 ' + streak + '일</span></div>';

    // Today's entry
    if(!todayEntry){
      html += '<div style="padding:12px;background:rgba(255,95,162,.04);border-radius:12px;margin-bottom:12px">';
      html += '<div style="font-size:12px;font-weight:700;margin-bottom:8px">오늘의 감정을 선택하세요!</div>';
      html += '<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:8px">';
      DIARY_EMOTIONS.forEach(function(em){
        html += '<button class="diary-emo" data-emo="' + em.id + '" style="padding:6px 10px;border:2px solid transparent;border-radius:10px;background:rgba(0,0,0,.04);cursor:pointer;font-size:14px;transition:all .2s" title="' + em.name + '">' + em.icon + '</button>';
      });
      html += '</div>';
      html += '<textarea id="diaryText" placeholder="오늘 느낌 감정에 대해 적어보세요..." style="width:100%;height:50px;border:1px solid var(--border);border-radius:10px;padding:8px;font-size:12px;resize:none;font-family:inherit;background:var(--card-bg);color:var(--text)"></textarea>';
      html += '<button id="diarySaveBtn" style="margin-top:6px;padding:6px 16px;background:var(--pink);color:#fff;border:none;border-radius:10px;font-size:12px;font-weight:700;cursor:pointer">&#x1F4DD; 기록하기</button>';
      html += '</div>';
    } else {
      var em = DIARY_EMOTIONS.filter(function(e){ return e.id === todayEntry.emotion; })[0];
      html += '<div style="padding:10px;background:rgba(76,175,80,.06);border-radius:12px;margin-bottom:12px;text-align:center">';
      html += '<div style="font-size:11px;color:#4CAF50;font-weight:700">&#x2705; 오늘 이미 기록했어요</div>';
      html += '<div style="font-size:24px;margin-top:4px">' + (em ? em.icon : '&#x1F60A;') + '</div>';
      html += '<div style="font-size:12px;color:var(--text-sub);margin-top:2px">' + todayEntry.note + '</div>';
      html += '</div>';
    }

    // Calendar view (last 14 days)
    html += '<div style="font-size:12px;font-weight:700;margin-bottom:6px">&#x1F4C5; 최근 기록</div>';
    html += '<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:8px">';
    for(var i = 13; i >= 0; i--){
      var dt = new Date();
      dt.setDate(dt.getDate() - i);
      var ds = dt.getFullYear() + '-' + String(dt.getMonth()+1).padStart(2,'0') + '-' + String(dt.getDate()).padStart(2,'0');
      var entry = d.entries.filter(function(e){ return e.date === ds; })[0];
      var emo = entry ? DIARY_EMOTIONS.filter(function(e){ return e.id === entry.emotion; })[0] : null;
      html += '<div style="width:28px;height:28px;line-height:28px;text-align:center;border-radius:8px;background:' + (entry ? 'rgba(255,95,162,.1)' : 'rgba(0,0,0,.04)') + ';font-size:' + (entry ? '14px' : '9px') + ';color:var(--text-sub)" title="' + ds + '">' + (emo ? emo.icon : String(dt.getDate())) + '</div>';
    }
    html += '</div>';

    // History list
    html += '<div style="max-height:150px;overflow-y:auto">';
    d.entries.slice().reverse().slice(0,10).forEach(function(e){
      var em2 = DIARY_EMOTIONS.filter(function(x){ return x.id === e.emotion; })[0];
      html += '<div style="display:flex;gap:8px;padding:6px;margin-bottom:2px;font-size:11px;border-radius:8px;background:rgba(0,0,0,.02)">';
      html += '<span>' + (em2 ? em2.icon : '&#x1F60A;') + '</span>';
      html += '<span style="color:var(--text-sub)">' + e.date + '</span>';
      html += '<span style="flex:1">' + (e.note || '') + '</span></div>';
    });
    html += '</div></div>';
    overlay.innerHTML = html;

    var selectedEmo = '';
    overlay.querySelectorAll('.diary-emo').forEach(function(btn){
      btn.onclick = function(){
        overlay.querySelectorAll('.diary-emo').forEach(function(b){ b.style.borderColor = 'transparent'; });
        btn.style.borderColor = 'var(--pink)';
        selectedEmo = btn.dataset.emo;
      };
    });

    var saveBtn = document.getElementById('diarySaveBtn');
    if(saveBtn){
      saveBtn.onclick = function(){
        if(!selectedEmo){ showToastV13('&#x26A0;&#xFE0F; 감정을 선택해주세요!'); return; }
        var note = (document.getElementById('diaryText') || {}).value || '';
        var dd = getDiaryData();
        dd.entries.push({date:todayStr(),emotion:selectedEmo,note:note.trim()});
        if(dd.entries.length > 100) dd.entries = dd.entries.slice(-100);
        dd.lastDate = todayStr();
        dd.streak = calcStreak(dd.entries);
        saveDiaryData(dd);
        sfxV13('diary_save');
        checkAndAwardV13();
        showToastV13('&#x1F4D4; 감정일기가 저장되었어요!');
        renderDiary();
      };
    }

    document.getElementById('diaryClose').onclick = function(){ overlay.remove(); };
    overlay.onclick = function(e){ if(e.target === overlay) overlay.remove(); };
  }

  renderDiary();
}


// ============================================================
// 5. MINI QUEST BOARD (미니퀘스트 보드)
// ============================================================
var QUEST_LIST = [
  {id:'q_craft3',name:'초보 재료상',desc:'아이템 3개 제작하기',target:3,check:function(){ var d = getCraftData(); return d.crafted.length; },xp:50,icon:'&#x1F528;'},
  {id:'q_pet_happy',name:'행복한 펫',desc:'펫 행복도 80 이상',target:80,check:function(){ var d = getPetData(); return d.adopted ? d.happiness : 0; },xp:40,icon:'&#x1F43E;'},
  {id:'q_combo3',name:'콤보 도전자',desc:'콤보 3개 성공',target:3,check:function(){ var d = getComboData(); return Object.keys(d.scores).length; },xp:60,icon:'&#x1F94B;'},
  {id:'q_diary5',name:'감정 기록가',desc:'감정일기 5일 기록',target:5,check:function(){ var d = getDiaryData(); return d.entries.length; },xp:50,icon:'&#x1F4D4;'},
  {id:'q_affinity30',name:'친구 사귀기',desc:'인연도 30 달성',target:30,check:function(){ var d = getAffinityData(); var mx = 0; Object.keys(d.levels).forEach(function(k){ if(d.levels[k] > mx) mx = d.levels[k]; }); return mx; },xp:60,icon:'&#x1F91D;'},
  {id:'q_craft_rare',name:'레어 수집가',desc:'레어 등급 이상 제작',target:1,check:function(){ var d = getCraftData(); var cnt = 0; d.crafted.forEach(function(c){ var r = CRAFT_RECIPES.filter(function(x){ return x.id === c; })[0]; if(r && (r.rarity === 'rare' || r.rarity === 'epic' || r.rarity === 'legendary')) cnt++; }); return cnt; },xp:70,icon:'&#x1F48E;'},
  {id:'q_explore_all',name:'v13 탐험가',desc:'v13 기능 5개 이상 사용',target:5,check:function(){ try{ return JSON.parse(localStorage.getItem('hatcuping_v13_features') || '[]').length; }catch(e){ return 0; } },xp:80,icon:'&#x1F5FA;&#xFE0F;'},
  {id:'q_combo_s',name:'S등급 마스터',desc:'콤보 S등급 획득',target:1,check:function(){ var d = getComboData(); var cnt = 0; Object.keys(d.scores).forEach(function(k){ if(d.scores[k].grade === 'S') cnt++; }); return cnt; },xp:100,icon:'&#x1F31F;'}
];

function getQuestData(){
  return v13Load('quests', {completed:[]});
}
function saveQuestData(d){ v13Save('quests', d); }

function openQuestBoard(){
  if(document.getElementById('questModal')) return;
  trackV13Feature('quest');
  sfxV13('quest_open');

  var overlay = document.createElement('div');
  overlay.id = 'questModal';
  overlay.className = 'modal-overlay show';
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');

  var qd = getQuestData();
  var html = '<div class="modal" style="max-width:440px">';
  html += '<button class="modal-close" id="questClose" aria-label="&#xB2EB;&#xAE30;">&times;</button>';
  html += '<h3 style="font-size:17px">&#x1F4CB; 미니퀸스트 보드 (' + qd.completed.length + '/' + QUEST_LIST.length + ')</h3>';
  html += '<div style="font-size:12px;color:var(--text-sub);margin-bottom:10px">퀸스트를 완료하고 XP를 받으세요!</div>';

  QUEST_LIST.forEach(function(q){
    var done = qd.completed.indexOf(q.id) !== -1;
    var progress = 0;
    try{ progress = q.check(); }catch(e){}
    var pct = Math.min(100, Math.round(progress / q.target * 100));
    var canClaim = !done && progress >= q.target;

    html += '<div class="quest-item" data-id="' + q.id + '" style="padding:10px;margin-bottom:6px;border-radius:12px;background:' + (done ? 'rgba(76,175,80,.06)' : canClaim ? 'rgba(255,215,0,.08)' : 'rgba(0,0,0,.03)') + ';border:1px solid ' + (done ? '#4CAF50' : canClaim ? '#FFD700' : 'var(--border)') + ';cursor:' + (canClaim ? 'pointer' : 'default') + ';transition:all .2s">';
    html += '<div style="display:flex;gap:8px;align-items:center">';
    html += '<div style="font-size:20px">' + q.icon + '</div>';
    html += '<div style="flex:1"><div style="font-size:13px;font-weight:700">' + q.name + (done ? ' &#x2705;' : '') + '</div>';
    html += '<div style="font-size:11px;color:var(--text-sub)">' + q.desc + '</div>';
    if(!done){
      html += '<div style="height:6px;background:rgba(0,0,0,.08);border-radius:3px;overflow:hidden;margin-top:4px"><div style="width:' + pct + '%;height:100%;background:' + (canClaim ? '#FFD700' : 'var(--pink)') + ';border-radius:3px;transition:width .3s"></div></div>';
      html += '<div style="font-size:9px;color:var(--text-sub);margin-top:2px">' + Math.min(progress, q.target) + '/' + q.target + (canClaim ? ' - 클릭하여 보상 받기!' : '') + '</div>';
    }
    html += '<div style="font-size:10px;color:#FF9800;font-weight:700;margin-top:2px">+' + q.xp + ' XP</div>';
    html += '</div></div></div>';
  });
  html += '</div>';
  overlay.innerHTML = html;

  overlay.querySelectorAll('.quest-item').forEach(function(el){
    el.onclick = function(){
      var qid = el.dataset.id;
      var quest = QUEST_LIST.filter(function(q){ return q.id === qid; })[0];
      if(!quest) return;
      var qd2 = getQuestData();
      if(qd2.completed.indexOf(qid) !== -1) return;
      var prog = 0;
      try{ prog = quest.check(); }catch(e){}
      if(prog < quest.target) return;
      qd2.completed.push(qid);
      saveQuestData(qd2);
      // Award XP
      try{
        var xpD = JSON.parse(localStorage.getItem('hatcuping_xp_data') || '{"xp":0,"level":1}');
        xpD.xp += quest.xp;
        var needed = xpD.level * 100 + (xpD.level - 1) * 50;
        while(xpD.xp >= needed && xpD.level < 30){
          xpD.xp -= needed;
          xpD.level++;
          needed = xpD.level * 100 + (xpD.level - 1) * 50;
        }
        localStorage.setItem('hatcuping_xp_data', JSON.stringify(xpD));
      }catch(e){}
      sfxV13('craft_success');
      checkAndAwardV13();
      showToastV13('&#x1F4CB; ' + quest.name + ' 완료! +' + quest.xp + ' XP');
      overlay.remove();
      openQuestBoard();
    };
  });

  document.getElementById('questClose').onclick = function(){ overlay.remove(); };
  overlay.onclick = function(e){ if(e.target === overlay) overlay.remove(); };
}


// ============================================================
// 6. TINIPING AFFINITY (티니핑 인연도)
// ============================================================
var AFFINITY_CHARS = [
  {id:'af_hachuping',name:'하츄핑',icon:'&#x1F496;',color:'#FF69B4',milestones:{20:'안녕! 반가워!',50:'너와 함께라 행복해!',80:'우리 영원히 친구야!',100:'사랑의 힘이 널 지켜줄게!'}},
  {id:'af_baroping',name:'바로핑',icon:'&#x2694;&#xFE0F;',color:'#4169E1',milestones:{20:'내 정의감이 느껴져!',50:'함께 정의를 세우자!',80:'너는 진정한 용사야!',100:'정의의 파트너로 인정한다!'}},
  {id:'af_chacha',name:'차차핑',icon:'&#x1F525;',color:'#FF6347',milestones:{20:'오! 용기가 느껴져!',50:'함께라면 뭐든 할 수 있어!',80:'너의 용기는 진짜야!',100:'영원한 용기의 친구!'}},
  {id:'af_lala',name:'라라핑',icon:'&#x1F3B5;',color:'#9370DB',milestones:{20:'노래를 함께 부르자♪',50:'우리의 멜로디가 완성돼가!',80:'너와의 하모니는 완벽해!',100:'영원한 음악의 파트너!'}},
  {id:'af_kkongkkong',name:'꽁꽁핑',icon:'&#x2744;&#xFE0F;',color:'#00CED1',milestones:{20:'...조금 괜찮아.',50:'네 따뜻함이 좋아.',80:'네가 내 얼음을 녹였어.',100:'너는 내 소중한 친구야.'}},
  {id:'af_bukkeuk',name:'부끄핑',icon:'&#x1F33A;',color:'#FFB6C1',milestones:{20:'부...부끄러워...',50:'네 앞에서는 편해...',80:'너와 함께라면 용기가 나!',100:'너는 나의 가장 소중한 친구!'}}
];

function getAffinityData(){
  return v13Load('affinity', {levels:{},lastAction:{}});
}
function saveAffinityData(d){ v13Save('affinity', d); }

function affinityAction(charId, action){
  var d = getAffinityData();
  var gains = {talk:5,gift:10,play:8};
  var gain = gains[action] || 5;
  d.levels[charId] = Math.min(100, (d.levels[charId] || 0) + gain);
  d.lastAction[charId] = todayStr();
  saveAffinityData(d);
  checkAndAwardV13();
  return d.levels[charId];
}

function openAffinity(){
  if(document.getElementById('affinityModal')) return;
  trackV13Feature('affinity');
  sfxV13('affinity_open');

  var overlay = document.createElement('div');
  overlay.id = 'affinityModal';
  overlay.className = 'modal-overlay show';
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');

  function renderAffinity(){
    var d = getAffinityData();
    var html = '<div class="modal" style="max-width:440px">';
    html += '<button class="modal-close" id="affinityClose" aria-label="&#xB2EB;&#xAE30;">&times;</button>';
    html += '<h3 style="font-size:17px">&#x1F91D; 티니핑 인연도</h3>';
    html += '<div style="font-size:12px;color:var(--text-sub);margin-bottom:10px">티니핑과 친해져보세요!</div>';

    AFFINITY_CHARS.forEach(function(ch){
      var lv = d.levels[ch.id] || 0;
      // Find milestone dialogue
      var dialogue = '';
      var mKeys = Object.keys(ch.milestones).map(Number).sort(function(a,b){return b-a;});
      for(var i = 0; i < mKeys.length; i++){
        if(lv >= mKeys[i]){ dialogue = ch.milestones[mKeys[i]]; break; }
      }

      html += '<div style="padding:10px;margin-bottom:8px;border-radius:14px;background:rgba(0,0,0,.03);border:1px solid var(--border)">';
      html += '<div style="display:flex;gap:10px;align-items:center;margin-bottom:6px">';
      html += '<div style="width:40px;height:40px;border-radius:12px;background:' + ch.color + ';display:flex;align-items:center;justify-content:center;font-size:20px">' + ch.icon + '</div>';
      html += '<div style="flex:1"><div style="font-size:14px;font-weight:700">' + ch.name + '</div>';
      html += '<div style="height:6px;background:rgba(0,0,0,.08);border-radius:3px;overflow:hidden;margin-top:4px"><div style="width:' + lv + '%;height:100%;background:' + ch.color + ';border-radius:3px;transition:width .3s"></div></div>';
      html += '<div style="font-size:10px;color:var(--text-sub);margin-top:2px">인연도: ' + lv + '/100</div>';
      html += '</div></div>';

      if(dialogue){
        html += '<div style="padding:6px 10px;background:rgba(255,95,162,.04);border-radius:10px;font-size:11px;color:var(--text);margin-bottom:6px;font-style:italic">&quot;' + dialogue + '&quot;</div>';
      }

      html += '<div style="display:flex;gap:4px">';
      html += '<button class="aff-act" data-char="' + ch.id + '" data-act="talk" style="flex:1;padding:6px;border:none;border-radius:8px;background:linear-gradient(135deg,#2196F3,#64B5F6);color:#fff;font-size:11px;font-weight:700;cursor:pointer">&#x1F4AC; 대화</button>';
      html += '<button class="aff-act" data-char="' + ch.id + '" data-act="gift" style="flex:1;padding:6px;border:none;border-radius:8px;background:linear-gradient(135deg,#FF9800,#FFB74D);color:#fff;font-size:11px;font-weight:700;cursor:pointer">&#x1F381; 선물</button>';
      html += '<button class="aff-act" data-char="' + ch.id + '" data-act="play" style="flex:1;padding:6px;border:none;border-radius:8px;background:linear-gradient(135deg,#4CAF50,#81C784);color:#fff;font-size:11px;font-weight:700;cursor:pointer">&#x1F3BE; 놀기</button>';
      html += '</div></div>';
    });
    html += '</div>';
    overlay.innerHTML = html;

    overlay.querySelectorAll('.aff-act').forEach(function(btn){
      btn.onclick = function(){
        var charId = btn.dataset.char;
        var act = btn.dataset.act;
        var newLv = affinityAction(charId, act);
        sfxV13('pet_action');
        var ch2 = AFFINITY_CHARS.filter(function(c){ return c.id === charId; })[0];
        var msgs = {talk:'&#x1F4AC; 즐거운 대화!',gift:'&#x1F381; 선물을 줄었어요!',play:'&#x1F3BE; 신나게 놀았어요!'};
        showToastV13((ch2 ? ch2.name : '') + ' ' + msgs[act] + ' (인연도: ' + newLv + ')');
        renderAffinity();
      };
    });

    document.getElementById('affinityClose').onclick = function(){ overlay.remove(); };
    overlay.onclick = function(e){ if(e.target === overlay) overlay.remove(); };
  }

  renderAffinity();
}


// ============================================================
// 7. QUIZ v5 (+15 questions about v13 features)
// ============================================================
var V13_QUIZ = [
  {q:'크래프팅 공방의 총 아이템 수는?',a:['8개','10개','12개','15개'],c:2},
  {q:'크래프팅 재료의 종류는?',a:['2종','3종','4종','5종'],c:2},
  {q:'펫 키우기의 펫 수는?',a:['4마리','5마리','6마리','8마리'],c:2},
  {q:'펫의 성장 단계는 몇 단계?',a:['2단계','3단계','4단계','5단계'],c:1},
  {q:'콤보 도장의 콤보 수는?',a:['5개','6개','8개','10개'],c:2},
  {q:'콤보 최고 등급은?',a:['A','S','SS','SSS'],c:1},
  {q:'감정일기의 감정 종류는?',a:['5가지','6가지','8가지','10가지'],c:2},
  {q:'미니퀸스트 보드의 퀸스트 수는?',a:['5개','6개','8개','10개'],c:2},
  {q:'티니핑 인연도의 캐릭터 수는?',a:['4명','5명','6명','8명'],c:2},
  {q:'인연도 최대치는?',a:['50','80','100','200'],c:2},
  {q:'전설 등급 크래프팅 아이템은 몇 개?',a:['1개','2개','3개','4개'],c:2},
  {q:'하트곰의 성격은?',a:['호기심 많은','신비로운','다정한','자유로운'],c:2},
  {q:'꽁꽁핑 인연도 100 대사는?',a:['사랑의 힘!','영원한 용기!','너는 내 소중한 친구야.','정의를 세우자!'],c:2},
  {q:'v13에서 추가된 업적 수는?',a:['8개','10개','12개','15개'],c:2},
  {q:'별토끼의 성격은?',a:['느균한','호기심 많은','충성스러운','신비로운'],c:1}
];

function injectExtraQuizV13(){
  if(window._v13QuizInjected) return;
  window._v13QuizInjected = true;
  if(!window.QUIZ_DATA) window.QUIZ_DATA = [];
  V13_QUIZ.forEach(function(q){ window.QUIZ_DATA.push(q); });
}


// ============================================================
// 8. ACHIEVEMENTS +12 (82 -> 94)
// ============================================================
var V13_ACHIEVEMENTS = [
  {id:'a_craft_first',name:'첫 제작',desc:'크래프팅으로 첫 아이템 제작!',cat:'general',icon:'&#x1F528;'},
  {id:'a_craft_5',name:'재료상 견습생',desc:'아이템 5개 이상 제작!',cat:'general',icon:'&#x1F3ED;'},
  {id:'a_craft_legendary',name:'전설의 장인',desc:'전설 등급 아이템 제작!',cat:'general',icon:'&#x1F31F;'},
  {id:'a_pet_adopt',name:'첫 입양',desc:'펫을 처음 입양!',cat:'general',icon:'&#x1F43E;'},
  {id:'a_pet_adult',name:'성장 완료',desc:'펫이 성인으로 성장!',cat:'general',icon:'&#x1F31F;'},
  {id:'a_pet_happy100',name:'최고 행복',desc:'펫 행복도 100 달성!',cat:'general',icon:'&#x1F496;'},
  {id:'a_combo_s',name:'콤보 마스터',desc:'콤보에서 S등급 획득!',cat:'general',icon:'&#x1F94B;'},
  {id:'a_combo_all',name:'콤보 컴플리트',desc:'모든 콤보 성공!',cat:'general',icon:'&#x1F3C6;'},
  {id:'a_diary_7',name:'일주일 기록',desc:'감정일기 7일 이상 기록!',cat:'general',icon:'&#x1F4D4;'},
  {id:'a_quest_3',name:'퀸스트 도전자',desc:'퀸스트 3개 이상 완료!',cat:'general',icon:'&#x1F4CB;'},
  {id:'a_affinity_50',name:'친해진 친구',desc:'인연도 50 이상 달성!',cat:'general',icon:'&#x1F91D;'},
  {id:'a_v13_explorer',name:'v13 탐험가',desc:'v13 기능 6개 이상 사용!',cat:'general',icon:'&#x1F5FA;&#xFE0F;'}
];

function injectV13Achievements(){
  if(window._v13AchievementsInjected) return;
  window._v13AchievementsInjected = true;
  if(window.AD){
    V13_ACHIEVEMENTS.forEach(function(a){
      var exists = window.AD.some(function(e){ return e.id === a.id; });
      if(!exists) window.AD.push(a);
    });
  }
}

function checkAndAwardV13(){
  if(!window.saveAchievement || !window.showAchieveToast) return;

  // Crafting achievements
  var craft = getCraftData();
  if(craft.crafted.length >= 1 && window.saveAchievement('a_craft_first')){ window.showAchieveToast('첫 제작'); }
  if(craft.crafted.length >= 5 && window.saveAchievement('a_craft_5')){ window.showAchieveToast('재료상 견습생'); }
  var hasLegendary = false;
  craft.crafted.forEach(function(c){ var r = CRAFT_RECIPES.filter(function(x){ return x.id === c; })[0]; if(r && r.rarity === 'legendary') hasLegendary = true; });
  if(hasLegendary && window.saveAchievement('a_craft_legendary')){ window.showAchieveToast('전설의 장인'); }

  // Pet achievements
  var pet = getPetData();
  if(pet.adopted && window.saveAchievement('a_pet_adopt')){ window.showAchieveToast('첫 입양'); }
  if(pet.growth >= 70 && window.saveAchievement('a_pet_adult')){ window.showAchieveToast('성장 완료'); }
  if(pet.happiness >= 100 && window.saveAchievement('a_pet_happy100')){ window.showAchieveToast('최고 행복'); }

  // Combo achievements
  var combo = getComboData();
  var comboKeys = Object.keys(combo.scores);
  var hasSGrade = false;
  comboKeys.forEach(function(k){ if(combo.scores[k].grade === 'S') hasSGrade = true; });
  if(hasSGrade && window.saveAchievement('a_combo_s')){ window.showAchieveToast('콤보 마스터'); }
  if(comboKeys.length >= 8 && window.saveAchievement('a_combo_all')){ window.showAchieveToast('콤보 컴플리트'); }

  // Diary achievements
  var diary = getDiaryData();
  if(diary.entries.length >= 7 && window.saveAchievement('a_diary_7')){ window.showAchieveToast('일주일 기록'); }

  // Quest achievements
  var quests = getQuestData();
  if(quests.completed.length >= 3 && window.saveAchievement('a_quest_3')){ window.showAchieveToast('퀸스트 도전자'); }

  // Affinity achievements
  var aff = getAffinityData();
  var maxAff = 0;
  Object.keys(aff.levels).forEach(function(k){ if(aff.levels[k] > maxAff) maxAff = aff.levels[k]; });
  if(maxAff >= 50 && window.saveAchievement('a_affinity_50')){ window.showAchieveToast('친해진 친구'); }

  // Explorer achievement
  try{
    var feat = JSON.parse(localStorage.getItem('hatcuping_v13_features') || '[]');
    if(feat.length >= 6 && window.saveAchievement('a_v13_explorer')){ window.showAchieveToast('v13 탐험가'); }
  }catch(e){}
}


// ============================================================
// KEYBOARD SHORTCUTS (8 shortcuts: Shift+R/P/O/E/Q/F/Z/H)
// ============================================================
function injectV13Keyboard(){
  document.addEventListener('keydown', function(e){
    if(e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if(document.querySelector('.modal-overlay.show')) return;

    var key = e.key.toLowerCase();
    if(key === 'r' && e.shiftKey){ e.preventDefault(); openCraftWorkshop(); }
    else if(key === 'p' && e.shiftKey){ e.preventDefault(); openPetNurturing(); }
    else if(key === 'o' && e.shiftKey){ e.preventDefault(); openComboDojo(); }
    else if(key === 'e' && e.shiftKey){ e.preventDefault(); openEmotionDiary(); }
    else if(key === 'q' && e.shiftKey){ e.preventDefault(); openQuestBoard(); }
    else if(key === 'f' && e.shiftKey){ e.preventDefault(); openAffinity(); }
    else if(key === 'z' && e.shiftKey){ e.preventDefault(); openCraftWorkshop(); }
    else if(key === 'h' && e.shiftKey){ e.preventDefault(); openPetNurturing(); }
  });
}

function updateV13KeyboardHelp(){
  var kbHelp = document.querySelector('#kbHelp .modal');
  if(!kbHelp) return;
  var newRows = [
    ['크래프팅 공방','Shift+R'],['펫 키우기','Shift+P'],['콤보 도장','Shift+O'],
    ['감정일기','Shift+E'],['퀸스트 보드','Shift+Q'],['티니핑 인연도','Shift+F'],
    ['크래프팅 (ALT)','Shift+Z'],['펫 (ALT)','Shift+H']
  ];
  newRows.forEach(function(r){
    var row = document.createElement('div');
    row.className = 'kb-help-row';
    row.innerHTML = '<span>' + r[0] + '</span><span class="kb-help-key">' + r[1] + '</span>';
    kbHelp.appendChild(row);
  });
}


// ============================================================
// FAB QUICK ACTIONS (7 buttons, fixed left side)
// ============================================================
function injectV13FAB(){
  if(document.getElementById('v13Fab')) return;

  var fab = document.createElement('div');
  fab.id = 'v13Fab';
  fab.style.cssText = 'position:fixed;left:8px;top:50%;transform:translateY(-50%);z-index:900;display:flex;flex-direction:column;gap:6px';

  var fabBtns = [
    {icon:'&#x1F528;',label:'크래프팅',action:openCraftWorkshop,color:'#9C27B0'},
    {icon:'&#x1F43E;',label:'펫',action:openPetNurturing,color:'#FF5FA2'},
    {icon:'&#x1F94B;',label:'콤보',action:openComboDojo,color:'#FF6347'},
    {icon:'&#x1F4D4;',label:'일기',action:openEmotionDiary,color:'#FFD700'},
    {icon:'&#x1F4CB;',label:'퀸스트',action:openQuestBoard,color:'#4CAF50'},
    {icon:'&#x1F91D;',label:'인연도',action:openAffinity,color:'#2196F3'},
    {icon:'&#x2B50;',label:'v13',action:function(){ showToastV13('&#x2B50; v13.0 - 크래프팅, 펫, 콤보, 일기, 퀸스트, 인연도!'); },color:'#FF9800'}
  ];

  fabBtns.forEach(function(b){
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
function injectV13QuickActions(){
  var topBar = document.querySelector('.top-bar');
  if(!topBar) return;

  var btns = [
    {id:'craftBtn',label:'크래프팅',icon:'&#x1F528;',title:'크래프팅 공방 (Shift+R)',action:openCraftWorkshop},
    {id:'petBtn',label:'펫',icon:'&#x1F43E;',title:'펫 키우기 (Shift+P)',action:openPetNurturing},
    {id:'comboBtn',label:'콤보',icon:'&#x1F94B;',title:'콤보 도장 (Shift+O)',action:openComboDojo},
    {id:'diaryBtn',label:'일기',icon:'&#x1F4D4;',title:'감정일기 (Shift+E)',action:openEmotionDiary},
    {id:'questBtn',label:'퀸스트',icon:'&#x1F4CB;',title:'퀸스트 보드 (Shift+Q)',action:openQuestBoard},
    {id:'affinityBtn',label:'인연도',icon:'&#x1F91D;',title:'티니핑 인연도 (Shift+F)',action:openAffinity}
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
function updateV13Footer(){
  var ver = document.querySelector('.footer .version');
  if(ver) ver.textContent = 'v13.0 | © PRIME Holdings NEXTERA+PRISM';

  var links = document.querySelector('.footer-links');
  if(links) links.innerHTML = '<span class="footer-link">4종 게임</span><span class="footer-link">94개 업적</span><span class="footer-link">24종 카드</span><span class="footer-link">12종 크래프팅</span><span class="footer-link">6마리 펫</span><span class="footer-link">8콤보</span>';
}

function updateV13News(){
  var newsSection = document.querySelector('.news-section');
  if(!newsSection) return;
  var firstItem = newsSection.querySelector('.news-item');
  if(!firstItem) return;
  var newItem = document.createElement('div');
  newItem.className = 'news-item';
  newItem.innerHTML = '<span class="news-date">v13.0</span><span class="news-text">크래프팅공방 12종, 펫키우기 6마리, 콤보도장 8콤보, 감정일기, 미니퀸스트 8개, 티니핑인연도 6캐릭터, 퀀즈+15(75), 업적+12(94)</span>';
  firstItem.parentNode.insertBefore(newItem, firstItem);
}

function updateV13AchieveCount(){
  var el = document.getElementById('achieveCount');
  if(el){
    var c = 0;
    try{ c = Object.keys(JSON.parse(localStorage.getItem('hatcuping_achievements') || '{}')).length; }catch(e){}
    var t = window.AD ? window.AD.length : 94;
    el.textContent = c + '/' + t;
  }
}

function updateV13Meta(){
  var descMeta = document.querySelector('meta[name="description"]');
  if(descMeta) descMeta.content = '사랑의 하츄핑 v13.0 - 플랫포머 액션, 턴제 RPG, 오픈월드, UNIFIED 4종 게임. 업적 94개, 크래프팅 12종, 펫 6마리, 콤보 8개, 감정일기, 퀸스트 8개, 인연도 6캐릭터, 퀀즈 75문!';
  document.title = '사랑의 하츄핑 v13.0 - 게임 선택';
}


// ============================================================
// BOOT
// ============================================================
function bootV13(){
  injectV13Achievements();
  injectExtraQuizV13();
  injectV13QuickActions();
  injectV13Keyboard();
  updateV13KeyboardHelp();
  injectV13FAB();
  updateV13Footer();
  updateV13News();
  updateV13AchieveCount();
  updateV13Meta();
  checkAndAwardV13();
}

if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', bootV13);
} else {
  bootV13();
}

})();

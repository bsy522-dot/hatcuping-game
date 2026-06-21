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
  shop_open:{f:660,d:.07,t:'triangle'},
  shop_buy:{f:1100,d:.12,t:'sine'},
  ranking_open:{f:580,d:.06,t:'triangle'},
  battle_open:{f:700,d:.06,t:'square'},
  battle_hit:{f:880,d:.04,t:'sawtooth'},
  battle_win:{f:1200,d:.15,t:'sine'},
  radar_open:{f:620,d:.06,t:'sine'},
  dex_open:{f:550,d:.06,t:'triangle'},
  champ_open:{f:750,d:.07,t:'square'},
  gallery_open:{f:600,d:.06,t:'sine'},
  calendar_open:{f:520,d:.06,t:'triangle'},
  calendar_claim:{f:1047,d:.12,t:'sine'}
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


// ============================================================
// 1. EMOTION SHOP (이모션 상점)
// ============================================================
var SHOP_ITEMS = [
  {id:'sh_shield',name:'보호 실드',icon:'&#x1F6E1;&#xFE0F;',price:50,desc:'1회 사망 방지',cat:'item'},
  {id:'sh_magnet',name:'하트 자석',icon:'&#x1F9F2;',price:80,desc:'하트 자동 수집',cat:'item'},
  {id:'sh_speed',name:'스피드부츠',icon:'&#x1F45F;',price:100,desc:'이동속도 +20%',cat:'item'},
  {id:'sh_doubleJump',name:'이중점프',icon:'&#x1F680;',price:120,desc:'추가 점프 1회',cat:'item'},
  {id:'sh_heal',name:'회복포션',icon:'&#x1F48A;',price:60,desc:'HP 50% 회복',cat:'item'},
  {id:'sh_xp2x',name:'경험치2배',icon:'&#x2B50;',price:150,desc:'XP 획득 2배',cat:'item'},
  {id:'sh_skin_ocean',name:'바다 테마',icon:'&#x1F30A;',price:200,desc:'바다 배경 스킨',cat:'skin'},
  {id:'sh_skin_space',name:'우주 테마',icon:'&#x1F30C;',price:200,desc:'우주 배경 스킨',cat:'skin'},
  {id:'sh_skin_forest',name:'숲 테마',icon:'&#x1F332;',price:200,desc:'숲속 배경 스킨',cat:'skin'},
  {id:'sh_pet_food',name:'프리미엄사료',icon:'&#x1F356;',price:40,desc:'펫 성장 +10',cat:'pet'},
  {id:'sh_pet_toy',name:'황금 장난감',icon:'&#x1F3B2;',price:70,desc:'펫 행복 +15',cat:'pet'},
  {id:'sh_lucky_box',name:'행운상자',icon:'&#x1F381;',price:300,desc:'랜덤 3종 아이템',cat:'special'}
];

function getShopData(){
  return v14Load('shop', {coins:500,purchased:[],inventory:{}});
}
function saveShopData(d){ v14Save('shop', d); }

function buyItem(itemId){
  var d = getShopData();
  var item = SHOP_ITEMS.filter(function(s){ return s.id === itemId; })[0];
  if(!item) return false;
  if(d.coins < item.price) return false;
  d.coins -= item.price;
  d.inventory[itemId] = (d.inventory[itemId] || 0) + 1;
  if(d.purchased.indexOf(itemId) === -1) d.purchased.push(itemId);
  saveShopData(d);
  checkAndAwardV14();
  return true;
}

function openEmotionShop(){
  if(document.getElementById('shopModal')) return;
  trackV14Feature('shop');
  sfxV14('shop_open');

  var overlay = document.createElement('div');
  overlay.id = 'shopModal';
  overlay.className = 'modal-overlay show';
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');

  function renderShop(){
    var d = getShopData();
    var html = '<div class="modal" style="max-width:480px">';
    html += '<button class="modal-close" id="shopClose" aria-label="&#xB2EB;&#xAE30;">&times;</button>';
    html += '<h3 style="font-size:17px">&#x1F6CD;&#xFE0F; 이모션 상점</h3>';
    html += '<div style="text-align:center;margin-bottom:10px;padding:8px;background:linear-gradient(135deg,rgba(255,215,0,.15),rgba(255,140,0,.1));border-radius:12px">';
    html += '<span style="font-size:20px">&#x1FA99;</span> <span style="font-size:18px;font-weight:800;color:#D4940A">' + d.coins + '</span> <span style="font-size:12px;color:#B08A00">코인</span></div>';

    var cats = [{id:'item',name:'&#x1F3AF; 아이템'},{id:'skin',name:'&#x1F3A8; 스킨'},{id:'pet',name:'&#x1F43E; 펫용품'},{id:'special',name:'&#x2728; 스페셜'}];
    cats.forEach(function(cat){
      var items = SHOP_ITEMS.filter(function(s){ return s.cat === cat.id; });
      html += '<div style="margin-bottom:10px"><div style="font-size:12px;font-weight:700;color:var(--text-sub);margin-bottom:6px">' + cat.name + '</div>';
      html += '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:6px">';
      items.forEach(function(item){
        var owned = (d.inventory[item.id] || 0);
        var canBuy = d.coins >= item.price;
        html += '<div class="shop-item" data-id="' + item.id + '" style="padding:8px;border-radius:12px;text-align:center;background:rgba(0,0,0,.03);border:2px solid ' + (canBuy ? 'rgba(255,95,162,.2)' : 'transparent') + ';cursor:' + (canBuy ? 'pointer' : 'default') + ';opacity:' + (canBuy ? '1' : '.5') + ';transition:all .2s">';
        html += '<div style="font-size:22px">' + item.icon + '</div>';
        html += '<div style="font-size:11px;font-weight:700;margin-top:2px">' + item.name + '</div>';
        html += '<div style="font-size:9px;color:var(--text-sub)">' + item.desc + '</div>';
        html += '<div style="margin-top:4px;font-size:11px;font-weight:700;color:#D4940A">&#x1FA99; ' + item.price + '</div>';
        if(owned > 0) html += '<div style="font-size:9px;color:#4CAF50;font-weight:700">보유: ' + owned + '개</div>';
        html += '</div>';
      });
      html += '</div></div>';
    });

    html += '<div style="text-align:center;margin-top:8px;font-size:10px;color:var(--text-sub)">&#x1F4A1; 게임 플레이로 코인을 획득하세요!</div>';
    html += '</div>';
    overlay.innerHTML = html;

    overlay.querySelectorAll('.shop-item').forEach(function(el){
      el.onclick = function(){
        var id = el.dataset.id;
        if(buyItem(id)){
          sfxV14('shop_buy');
          var itm = SHOP_ITEMS.filter(function(s){ return s.id === id; })[0];
          showToastV14('&#x1F6CD;&#xFE0F; ' + (itm ? itm.name : '') + ' 구매 완료!');
          renderShop();
        } else {
          showToastV14('&#x274C; 코인이 부족합니다!');
        }
      };
    });

    document.getElementById('shopClose').onclick = function(){ overlay.remove(); };
    overlay.onclick = function(e){ if(e.target === overlay) overlay.remove(); };
  }

  renderShop();
  document.body.appendChild(overlay);
}


// ============================================================
// 2. STAGE RANKING BOARD (스테이지 랭킹 보드)
// ============================================================
var RANKING_STAGES = [
  {id:'s1',name:'초원의 시작',best:0},{id:'s2',name:'꽃길 모험',best:0},
  {id:'s3',name:'구름다리',best:0},{id:'s4',name:'무지개 폭포',best:0},
  {id:'s5',name:'별빛 동굴',best:0},{id:'s6',name:'얼음 왕국',best:0},
  {id:'s7',name:'화산 지대',best:0},{id:'s8',name:'하늘 성',best:0},
  {id:'s9',name:'어둠의 숲',best:0},{id:'s10',name:'최종 보스',best:0}
];

function getRankingData(){
  return v14Load('ranking', {stages:{},totalScore:0,bestCombo:0,fastestClear:999});
}
function saveRankingData(d){ v14Save('ranking', d); }

function openRankingBoard(){
  if(document.getElementById('rankingModal')) return;
  trackV14Feature('ranking');
  sfxV14('ranking_open');

  var overlay = document.createElement('div');
  overlay.id = 'rankingModal';
  overlay.className = 'modal-overlay show';
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');

  var d = getRankingData();
  var html = '<div class="modal" style="max-width:460px">';
  html += '<button class="modal-close" id="rankingClose" aria-label="&#xB2EB;&#xAE30;">&times;</button>';
  html += '<h3 style="font-size:17px">&#x1F3C5; 스테이지 랭킹</h3>';

  html += '<canvas id="rankingCanvas" width="400" height="220" style="width:100%;border-radius:12px;margin-bottom:10px;background:rgba(0,0,0,.03)"></canvas>';

  html += '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:6px;margin-bottom:10px">';
  html += '<div style="text-align:center;padding:8px;border-radius:10px;background:rgba(255,215,0,.1)"><div style="font-size:18px;font-weight:800;color:#D4940A">' + (d.totalScore || 0) + '</div><div style="font-size:10px;color:var(--text-sub)">총 점수</div></div>';
  html += '<div style="text-align:center;padding:8px;border-radius:10px;background:rgba(76,175,80,.1)"><div style="font-size:18px;font-weight:800;color:#4CAF50">' + (d.bestCombo || 0) + '</div><div style="font-size:10px;color:var(--text-sub)">최고 콤보</div></div></div>';

  html += '<div style="max-height:200px;overflow-y:auto">';
  RANKING_STAGES.forEach(function(stg, i){
    var score = (d.stages[stg.id] || {}).score || 0;
    var grade = score >= 9000 ? 'S' : score >= 7000 ? 'A' : score >= 5000 ? 'B' : score >= 3000 ? 'C' : 'D';
    var gradeColors = {S:'#FFD700',A:'#4CAF50',B:'#2196F3',C:'#FF9800',D:'#999'};
    html += '<div style="display:flex;align-items:center;gap:8px;padding:6px;border-bottom:1px solid rgba(0,0,0,.04)">';
    html += '<div style="width:24px;height:24px;border-radius:50%;background:linear-gradient(135deg,#FF5FA2,#B066FF);color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center">' + (i+1) + '</div>';
    html += '<div style="flex:1;font-size:12px;font-weight:600">' + stg.name + '</div>';
    html += '<div style="font-size:12px;font-weight:700;color:' + gradeColors[grade] + '">' + grade + '</div>';
    html += '<div style="font-size:11px;color:var(--text-sub);width:50px;text-align:right">' + score + '점</div>';
    html += '</div>';
  });
  html += '</div>';

  html += '<div style="text-align:center;margin-top:8px"><button id="rankingSimBtn" style="padding:6px 16px;background:linear-gradient(135deg,#FF5FA2,#B066FF);color:#fff;border:none;border-radius:10px;font-size:12px;font-weight:700;cursor:pointer">&#x1F3AE; 연습 시뮬레이션</button></div>';
  html += '</div>';
  overlay.innerHTML = html;

  var canvas = document.getElementById('rankingCanvas');
  if(canvas){
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(255,95,162,.05)';
    ctx.fillRect(0,0,400,220);

    ctx.fillStyle = '#B088CC';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('스테이지별 점수 분포', 200, 18);

    var maxScore = 10000;
    RANKING_STAGES.forEach(function(stg, i){
      var score = (d.stages[stg.id] || {}).score || Math.floor(Math.random() * 3000);
      var barH = (score / maxScore) * 150;
      var x = 30 + i * 37;

      var grd = ctx.createLinearGradient(x, 200 - barH, x, 200);
      grd.addColorStop(0, '#FF5FA2');
      grd.addColorStop(1, '#B066FF');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.roundRect(x, 200 - barH, 28, barH, 4);
      ctx.fill();

      ctx.fillStyle = '#888';
      ctx.font = '9px sans-serif';
      ctx.fillText('S' + (i+1), x + 14, 215);
      ctx.fillStyle = '#FF5FA2';
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText(score, x + 14, 195 - barH);
    });
  }

  document.getElementById('rankingSimBtn').onclick = function(){
    var rd = getRankingData();
    var idx = Math.floor(Math.random() * RANKING_STAGES.length);
    var score = 2000 + Math.floor(Math.random() * 8000);
    var stgId = RANKING_STAGES[idx].id;
    if(!rd.stages[stgId]) rd.stages[stgId] = {};
    if(score > (rd.stages[stgId].score || 0)) rd.stages[stgId].score = score;
    rd.totalScore = 0;
    Object.keys(rd.stages).forEach(function(k){ rd.totalScore += (rd.stages[k].score || 0); });
    rd.bestCombo = Math.max(rd.bestCombo, Math.floor(Math.random() * 30));
    saveRankingData(rd);
    showToastV14('&#x1F3C5; ' + RANKING_STAGES[idx].name + ': ' + score + '점!');
    checkAndAwardV14();
    overlay.remove();
    openRankingBoard();
  };

  document.getElementById('rankingClose').onclick = function(){ overlay.remove(); };
  overlay.onclick = function(e){ if(e.target === overlay) overlay.remove(); };
  document.body.appendChild(overlay);
}


// ============================================================
// 3. EMOTION BATTLE SIMULATOR (감정 배틀 시뮬레이터)
// ============================================================
var BATTLE_EMOTIONS = [
  {id:'love',name:'사랑',icon:'&#x1F496;',color:'#FF5FA2',strong:'fear',weak:'anger'},
  {id:'courage',name:'용기',icon:'&#x1F525;',color:'#FF6347',strong:'sadness',weak:'love'},
  {id:'joy',name:'기쁨',icon:'&#x1F31F;',color:'#FFD700',strong:'anger',weak:'sadness'},
  {id:'wisdom',name:'지혜',icon:'&#x1F4A0;',color:'#2196F3',strong:'confusion',weak:'joy'},
  {id:'anger',name:'분노',icon:'&#x1F4A2;',color:'#F44336',strong:'love',weak:'joy'},
  {id:'sadness',name:'슬픔',icon:'&#x1F4A7;',color:'#5C6BC0',strong:'joy',weak:'courage'},
  {id:'fear',name:'공포',icon:'&#x1F47B;',color:'#7B1FA2',strong:'courage',weak:'love'},
  {id:'confusion',name:'혼란',icon:'&#x1F300;',color:'#9E9E9E',strong:'wisdom',weak:'wisdom'}
];

function getBattleData(){
  return v14Load('battle', {wins:0,losses:0,streak:0,bestStreak:0});
}
function saveBattleData(d){ v14Save('battle', d); }

function openBattleSimulator(){
  if(document.getElementById('battleModal')) return;
  trackV14Feature('battle');
  sfxV14('battle_open');

  var overlay = document.createElement('div');
  overlay.id = 'battleModal';
  overlay.className = 'modal-overlay show';
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');

  var bd = getBattleData();
  var enemyIdx = Math.floor(Math.random() * BATTLE_EMOTIONS.length);
  var enemy = BATTLE_EMOTIONS[enemyIdx];
  var enemyHp = 100;
  var playerHp = 100;

  function renderBattle(){
    var html = '<div class="modal" style="max-width:460px">';
    html += '<button class="modal-close" id="battleClose" aria-label="&#xB2EB;&#xAE30;">&times;</button>';
    html += '<h3 style="font-size:17px">&#x2694;&#xFE0F; 감정 배틀</h3>';

    html += '<div style="display:flex;justify-content:space-between;margin-bottom:10px">';
    html += '<div style="font-size:11px;color:#4CAF50;font-weight:700">승리: ' + bd.wins + '</div>';
    html += '<div style="font-size:11px;color:#FF9800;font-weight:700">연승: ' + bd.streak + ' (최고: ' + bd.bestStreak + ')</div>';
    html += '<div style="font-size:11px;color:#F44336;font-weight:700">패배: ' + bd.losses + '</div>';
    html += '</div>';

    html += '<canvas id="battleCanvas" width="400" height="200" style="width:100%;border-radius:12px;margin-bottom:10px"></canvas>';

    html += '<div style="text-align:center;margin-bottom:8px;font-size:13px;font-weight:700;color:' + enemy.color + '">VS ' + enemy.icon + ' ' + enemy.name + '의 감정</div>';
    html += '<div style="display:flex;gap:4px;margin-bottom:6px"><div style="flex:1;text-align:center;font-size:11px;font-weight:700;color:#4CAF50">내 HP: ' + playerHp + '</div><div style="flex:1;text-align:center;font-size:11px;font-weight:700;color:#F44336">적 HP: ' + enemyHp + '</div></div>';

    html += '<div style="font-size:11px;color:var(--text-sub);margin-bottom:6px;text-align:center">감정을 선택하여 공격하세요! (상성에 따라 데미지 변화)</div>';
    html += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px">';
    BATTLE_EMOTIONS.forEach(function(em){
      html += '<button class="battle-atk" data-em="' + em.id + '" style="padding:8px 4px;border:2px solid ' + em.color + ';border-radius:10px;background:rgba(0,0,0,.02);cursor:pointer;text-align:center;transition:all .2s">';
      html += '<div style="font-size:18px">' + em.icon + '</div>';
      html += '<div style="font-size:9px;font-weight:700;color:' + em.color + '">' + em.name + '</div></button>';
    });
    html += '</div>';

    html += '<div style="margin-top:8px;padding:6px;background:rgba(0,0,0,.03);border-radius:8px;font-size:10px;color:var(--text-sub);text-align:center">&#x1F4A1; 상성: 사랑&gt;공포&gt;용기&gt;슬픔&gt;기쁨&gt;분노&gt;사랑 | 지혜&#x21C4;혼란</div>';
    html += '</div>';
    overlay.innerHTML = html;

    var canvas = document.getElementById('battleCanvas');
    if(canvas){
      var ctx = canvas.getContext('2d');
      ctx.clearRect(0,0,400,200);

      var bgGrd = ctx.createLinearGradient(0,0,400,200);
      bgGrd.addColorStop(0,'rgba(255,95,162,.08)');
      bgGrd.addColorStop(1,'rgba(176,102,255,.08)');
      ctx.fillStyle = bgGrd;
      ctx.fillRect(0,0,400,200);

      ctx.fillStyle = 'rgba(0,0,0,.1)';
      ctx.fillRect(30,30,140,16);
      ctx.fillStyle = '#4CAF50';
      ctx.fillRect(30,30,140*(playerHp/100),16);

      ctx.fillStyle = 'rgba(0,0,0,.1)';
      ctx.fillRect(230,30,140,16);
      ctx.fillStyle = '#F44336';
      ctx.fillRect(230,30,140*(enemyHp/100),16);

      ctx.font = 'bold 10px sans-serif';
      ctx.fillStyle = '#333';
      ctx.textAlign = 'center';
      ctx.fillText('플레이어', 100, 25);
      ctx.fillText(enemy.name, 300, 25);

      ctx.font = '40px sans-serif';
      ctx.fillText('&#x1F496;', 100, 120);
      ctx.fillText(enemy.icon, 300, 120);

      ctx.font = 'bold 14px sans-serif';
      ctx.fillStyle = '#FF5FA2';
      ctx.fillText('VS', 200, 110);
    }

    overlay.querySelectorAll('.battle-atk').forEach(function(btn){
      btn.onclick = function(){
        var atkId = btn.dataset.em;
        var atk = BATTLE_EMOTIONS.filter(function(e){ return e.id === atkId; })[0];
        if(!atk) return;

        var dmg = 20;
        if(atk.strong === enemy.id) dmg = 40;
        else if(atk.weak === enemy.id) dmg = 10;
        dmg += Math.floor(Math.random() * 10);

        enemyHp = Math.max(0, enemyHp - dmg);
        sfxV14('battle_hit');

        var enemyAtk = BATTLE_EMOTIONS[Math.floor(Math.random() * BATTLE_EMOTIONS.length)];
        var eDmg = 15 + Math.floor(Math.random() * 15);
        playerHp = Math.max(0, playerHp - eDmg);

        if(enemyHp <= 0){
          bd.wins++;
          bd.streak++;
          if(bd.streak > bd.bestStreak) bd.bestStreak = bd.streak;
          saveBattleData(bd);
          sfxV14('battle_win');
          showToastV14('&#x1F3C6; 승리! 연승 ' + bd.streak + '회!');
          checkAndAwardV14();
          overlay.remove();
          return;
        }
        if(playerHp <= 0){
          bd.losses++;
          bd.streak = 0;
          saveBattleData(bd);
          showToastV14('&#x1F4A5; 패배... 다시 도전하세요!');
          overlay.remove();
          return;
        }

        renderBattle();
      };
    });

    document.getElementById('battleClose').onclick = function(){ overlay.remove(); };
    overlay.onclick = function(e){ if(e.target === overlay) overlay.remove(); };
  }

  renderBattle();
  document.body.appendChild(overlay);
}


// ============================================================
// 4. CHARACTER GROWTH RADAR (캐릭터 성장 레이더)
// ============================================================
var RADAR_STATS = ['공격','방어','속도','행운','지혜','매력'];
var RADAR_CHARS = [
  {id:'romi',name:'로미',icon:'&#x1F467;',color:'#FF5FA2',base:[7,5,8,6,7,9]},
  {id:'hatchu',name:'하츄핑',icon:'&#x1F496;',color:'#FF9ED8',base:[5,6,6,8,6,10]},
  {id:'baroping',name:'바로핑',icon:'&#x2694;&#xFE0F;',color:'#FF6347',base:[9,8,7,4,5,6]},
  {id:'kkongkkong',name:'꽁꽁핑',icon:'&#x2744;&#xFE0F;',color:'#64B5F6',base:[6,9,5,5,8,7]}
];

function getRadarData(){
  return v14Load('radar', {bonuses:{}});
}
function saveRadarData(d){ v14Save('radar', d); }

function openGrowthRadar(){
  if(document.getElementById('radarModal')) return;
  trackV14Feature('radar');
  sfxV14('radar_open');

  var overlay = document.createElement('div');
  overlay.id = 'radarModal';
  overlay.className = 'modal-overlay show';
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');

  var rd = getRadarData();
  var selectedChar = 0;

  function renderRadar(){
    var ch = RADAR_CHARS[selectedChar];
    var bonus = rd.bonuses[ch.id] || [0,0,0,0,0,0];
    var stats = ch.base.map(function(b, i){ return Math.min(10, b + (bonus[i] || 0)); });

    var html = '<div class="modal" style="max-width:440px">';
    html += '<button class="modal-close" id="radarClose" aria-label="&#xB2EB;&#xAE30;">&times;</button>';
    html += '<h3 style="font-size:17px">&#x1F4CA; 캐릭터 성장</h3>';

    html += '<div style="display:flex;gap:4px;margin-bottom:10px;justify-content:center">';
    RADAR_CHARS.forEach(function(c, i){
      html += '<button class="radar-char" data-idx="' + i + '" style="padding:6px 10px;border:2px solid ' + (i === selectedChar ? c.color : 'transparent') + ';border-radius:10px;background:' + (i === selectedChar ? 'rgba(255,95,162,.08)' : 'rgba(0,0,0,.03)') + ';cursor:pointer;font-size:12px;font-weight:700;transition:all .2s">' + c.icon + ' ' + c.name + '</button>';
    });
    html += '</div>';

    html += '<canvas id="radarCanvas" width="320" height="320" style="width:100%;max-width:320px;margin:0 auto;display:block;border-radius:12px"></canvas>';

    html += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px;margin-top:10px">';
    RADAR_STATS.forEach(function(st, i){
      html += '<div style="text-align:center;padding:6px;border-radius:8px;background:rgba(0,0,0,.03)">';
      html += '<div style="font-size:10px;color:var(--text-sub)">' + st + '</div>';
      html += '<div style="font-size:16px;font-weight:800;color:' + ch.color + '">' + stats[i] + '</div>';
      html += '<button class="radar-train" data-stat="' + i + '" style="margin-top:2px;padding:2px 8px;border:none;border-radius:6px;background:' + ch.color + ';color:#fff;font-size:9px;font-weight:700;cursor:pointer">훈련</button>';
      html += '</div>';
    });
    html += '</div>';
    html += '</div>';
    overlay.innerHTML = html;

    var canvas = document.getElementById('radarCanvas');
    if(canvas){
      var ctx = canvas.getContext('2d');
      var cx = 160, cy = 160, maxR = 120;
      ctx.clearRect(0,0,320,320);

      for(var lvl = 2; lvl <= 10; lvl += 2){
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(0,0,0,.06)';
        ctx.lineWidth = 1;
        for(var j = 0; j <= 6; j++){
          var angle = (Math.PI * 2 * j / 6) - Math.PI / 2;
          var r = maxR * (lvl / 10);
          var px = cx + r * Math.cos(angle);
          var py = cy + r * Math.sin(angle);
          if(j === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
      }

      for(var k = 0; k < 6; k++){
        var ang = (Math.PI * 2 * k / 6) - Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + maxR * Math.cos(ang), cy + maxR * Math.sin(ang));
        ctx.strokeStyle = 'rgba(0,0,0,.08)';
        ctx.stroke();

        ctx.fillStyle = '#888';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        var lx = cx + (maxR + 18) * Math.cos(ang);
        var ly = cy + (maxR + 18) * Math.sin(ang);
        ctx.fillText(RADAR_STATS[k], lx, ly);
      }

      ctx.beginPath();
      for(var m = 0; m < 6; m++){
        var a2 = (Math.PI * 2 * m / 6) - Math.PI / 2;
        var r2 = maxR * (stats[m] / 10);
        var x2 = cx + r2 * Math.cos(a2);
        var y2 = cy + r2 * Math.sin(a2);
        if(m === 0) ctx.moveTo(x2, y2); else ctx.lineTo(x2, y2);
      }
      ctx.closePath();
      ctx.fillStyle = ch.color + '33';
      ctx.fill();
      ctx.strokeStyle = ch.color;
      ctx.lineWidth = 2;
      ctx.stroke();

      for(var n = 0; n < 6; n++){
        var a3 = (Math.PI * 2 * n / 6) - Math.PI / 2;
        var r3 = maxR * (stats[n] / 10);
        ctx.beginPath();
        ctx.arc(cx + r3 * Math.cos(a3), cy + r3 * Math.sin(a3), 4, 0, Math.PI * 2);
        ctx.fillStyle = ch.color;
        ctx.fill();
      }

      ctx.fillStyle = ch.color;
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(ch.name + ' (총합: ' + stats.reduce(function(a,b){return a+b;},0) + '/60)', cx, 305);
    }

    overlay.querySelectorAll('.radar-char').forEach(function(btn){
      btn.onclick = function(){
        selectedChar = parseInt(btn.dataset.idx);
        renderRadar();
      };
    });

    overlay.querySelectorAll('.radar-train').forEach(function(btn){
      btn.onclick = function(){
        var si = parseInt(btn.dataset.stat);
        var chId = RADAR_CHARS[selectedChar].id;
        if(!rd.bonuses[chId]) rd.bonuses[chId] = [0,0,0,0,0,0];
        if(rd.bonuses[chId][si] < 3){
          rd.bonuses[chId][si]++;
          saveRadarData(rd);
          showToastV14('&#x1F4AA; ' + RADAR_STATS[si] + ' 훈련 완료!');
          checkAndAwardV14();
          renderRadar();
        } else {
          showToastV14('&#x26A0;&#xFE0F; 이미 최대 훈련치입니다!');
        }
      };
    });

    document.getElementById('radarClose').onclick = function(){ overlay.remove(); };
    overlay.onclick = function(e){ if(e.target === overlay) overlay.remove(); };
  }

  renderRadar();
  document.body.appendChild(overlay);
}


// ============================================================
// 5. ENHANCED EMOTION ENCYCLOPEDIA (이모션 도감 강화판)
// ============================================================
var DEX_ENTRIES = [
  {id:'dx_hatchu',name:'하츄핑',type:'사랑',rarity:'SSR',hp:85,atk:60,def:70,spd:75,desc:'사랑의 감정을 전하는 티니핑. 모든 것을 사랑으로 감싸안는 힘이 있다.',icon:'&#x1F496;',color:'#FF5FA2'},
  {id:'dx_baro',name:'바로핑',type:'정의',rarity:'SR',hp:90,atk:85,def:80,spd:65,desc:'정의의 감정을 담은 티니핑. 불의를 보면 참지 못한다.',icon:'&#x2694;&#xFE0F;',color:'#FF6347'},
  {id:'dx_kkong',name:'꽁꽁핑',type:'용기',rarity:'SR',hp:80,atk:70,def:90,spd:55,desc:'용기의 감정을 지닌 티니핑. 차가운 외모 속에 뜨거운 마음.',icon:'&#x2744;&#xFE0F;',color:'#64B5F6'},
  {id:'dx_happy',name:'해핑',type:'행복',rarity:'SR',hp:70,atk:55,def:60,spd:90,desc:'행복의 감정을 나누는 티니핑. 주변을 밝게 만든다.',icon:'&#x1F31F;',color:'#FFD700'},
  {id:'dx_sad',name:'시러핑',type:'슬픔',rarity:'R',hp:75,atk:50,def:85,spd:60,desc:'슬픔의 감정을 이해하는 티니핑. 공감의 달인.',icon:'&#x1F4A7;',color:'#5C6BC0'},
  {id:'dx_anger',name:'화나핑',type:'분노',rarity:'R',hp:95,atk:90,def:50,spd:80,desc:'분노의 감정을 다스리는 티니핑. 엄청난 파괴력.',icon:'&#x1F4A2;',color:'#F44336'},
  {id:'dx_fear',name:'무서핑',type:'공포',rarity:'R',hp:65,atk:45,def:55,spd:95,desc:'공포의 감정을 극복하게 해주는 티니핑.',icon:'&#x1F47B;',color:'#7B1FA2'},
  {id:'dx_curious',name:'궁금핑',type:'호기심',rarity:'R',hp:60,atk:40,def:50,spd:85,desc:'호기심의 감정을 자극하는 티니핑.',icon:'&#x1F50D;',color:'#00BCD4'},
  {id:'dx_trust',name:'믿어핑',type:'신뢰',rarity:'SR',hp:80,atk:65,def:85,spd:70,desc:'신뢰의 감정을 심어주는 티니핑.',icon:'&#x1F91D;',color:'#4CAF50'},
  {id:'dx_dream',name:'꿈꿔핑',type:'희망',rarity:'SSR',hp:75,atk:70,def:65,spd:80,desc:'희망의 꿈을 선물하는 전설의 티니핑.',icon:'&#x1F320;',color:'#E040FB'},
  {id:'dx_shy',name:'부끄핑',type:'수줍음',rarity:'N',hp:55,atk:35,def:45,spd:70,desc:'수줍음이 많지만 용감한 티니핑.',icon:'&#x1F33A;',color:'#FF8A80'},
  {id:'dx_sleep',name:'졸려핑',type:'나른함',rarity:'N',hp:50,atk:30,def:60,spd:40,desc:'항상 졸리지만 잠꼬대에 지혜가 담긴 티니핑.',icon:'&#x1F4A4;',color:'#B0BEC5'}
];

function getDexData(){
  return v14Load('dex', {discovered:[],favorites:[]});
}
function saveDexData(d){ v14Save('dex', d); }

function openEnhancedDex(){
  if(document.getElementById('dexModal')) return;
  trackV14Feature('dex');
  sfxV14('dex_open');

  var overlay = document.createElement('div');
  overlay.id = 'dexModal';
  overlay.className = 'modal-overlay show';
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');

  var dd = getDexData();
  if(dd.discovered.length === 0){
    dd.discovered = DEX_ENTRIES.map(function(e){ return e.id; });
    saveDexData(dd);
  }

  var html = '<div class="modal" style="max-width:480px">';
  html += '<button class="modal-close" id="dexClose" aria-label="&#xB2EB;&#xAE30;">&times;</button>';
  html += '<h3 style="font-size:17px">&#x1F4D6; 이모션 도감 (' + dd.discovered.length + '/' + DEX_ENTRIES.length + ')</h3>';

  html += '<canvas id="dexCanvas" width="420" height="160" style="width:100%;border-radius:12px;margin-bottom:10px"></canvas>';

  html += '<div style="max-height:320px;overflow-y:auto">';
  DEX_ENTRIES.forEach(function(entry){
    var found = dd.discovered.indexOf(entry.id) !== -1;
    var rarColors = {N:'#8BC34A',R:'#2196F3',SR:'#9C27B0',SSR:'#FFD700'};
    html += '<div style="display:flex;gap:10px;padding:8px;margin-bottom:6px;border-radius:12px;background:rgba(0,0,0,.03);border-left:4px solid ' + (found ? entry.color : '#ccc') + ';opacity:' + (found ? '1' : '.4') + '">';
    html += '<div style="width:40px;height:40px;border-radius:12px;background:' + (found ? entry.color + '22' : 'rgba(0,0,0,.06)') + ';display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">' + (found ? entry.icon : '&#x2753;') + '</div>';
    html += '<div style="flex:1;min-width:0">';
    html += '<div style="display:flex;gap:6px;align-items:center"><span style="font-size:13px;font-weight:700">' + (found ? entry.name : '???') + '</span>';
    html += '<span style="font-size:9px;font-weight:700;color:' + rarColors[entry.rarity] + ';padding:1px 6px;border-radius:8px;background:' + rarColors[entry.rarity] + '15">' + entry.rarity + '</span></div>';
    if(found){
      html += '<div style="font-size:10px;color:var(--text-sub);margin-top:2px">' + entry.desc + '</div>';
      html += '<div style="display:flex;gap:6px;margin-top:4px;font-size:9px">';
      html += '<span style="color:#F44336">HP:' + entry.hp + '</span>';
      html += '<span style="color:#FF9800">ATK:' + entry.atk + '</span>';
      html += '<span style="color:#2196F3">DEF:' + entry.def + '</span>';
      html += '<span style="color:#4CAF50">SPD:' + entry.spd + '</span></div>';
    }
    html += '</div></div>';
  });
  html += '</div></div>';
  overlay.innerHTML = html;

  var canvas = document.getElementById('dexCanvas');
  if(canvas){
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(255,95,162,.04)';
    ctx.fillRect(0,0,420,160);

    ctx.fillStyle = '#B088CC';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('티니핑 스탯 비교', 210, 16);

    var barW = 28;
    DEX_ENTRIES.slice(0,10).forEach(function(entry, i){
      var total = entry.hp + entry.atk + entry.def + entry.spd;
      var maxTotal = 400;
      var barH = (total / maxTotal) * 110;
      var x = 20 + i * 40;

      var grd = ctx.createLinearGradient(x, 145 - barH, x, 145);
      grd.addColorStop(0, entry.color);
      grd.addColorStop(1, entry.color + '66');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.roundRect(x, 145 - barH, barW, barH, 3);
      ctx.fill();

      ctx.fillStyle = '#888';
      ctx.font = '8px sans-serif';
      ctx.fillText(entry.name.substring(0,2), x + barW/2, 156);
    });
  }

  document.getElementById('dexClose').onclick = function(){ overlay.remove(); };
  overlay.onclick = function(e){ if(e.target === overlay) overlay.remove(); };
  document.body.appendChild(overlay);
}


// ============================================================
// 6. MINIGAME CHAMPIONSHIP (미니게임 대회 모드)
// ============================================================
var CHAMP_EVENTS = [
  {id:'ev_reaction',name:'반응속도 대결',icon:'&#x26A1;',desc:'빠르게 클릭!'},
  {id:'ev_memory',name:'기억력 대결',icon:'&#x1F9E0;',desc:'순서를 기억하세요!'},
  {id:'ev_rhythm',name:'리듬 탭',icon:'&#x1F3B5;',desc:'박자에 맞춰 탭!'},
  {id:'ev_math',name:'암산 대결',icon:'&#x1F4AF;',desc:'빠른 계산!'},
  {id:'ev_color',name:'색깔 맞추기',icon:'&#x1F3A8;',desc:'정확한 색을 선택!'},
  {id:'ev_word',name:'단어 찾기',icon:'&#x1F4DD;',desc:'숨은 단어 발견!'}
];

function getChampData(){
  return v14Load('champ', {played:0,medals:{gold:0,silver:0,bronze:0},bestEvent:''});
}
function saveChampData(d){ v14Save('champ', d); }

function openChampionship(){
  if(document.getElementById('champModal')) return;
  trackV14Feature('champ');
  sfxV14('champ_open');

  var overlay = document.createElement('div');
  overlay.id = 'champModal';
  overlay.className = 'modal-overlay show';
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');

  var cd = getChampData();

  var html = '<div class="modal" style="max-width:460px">';
  html += '<button class="modal-close" id="champClose" aria-label="&#xB2EB;&#xAE30;">&times;</button>';
  html += '<h3 style="font-size:17px">&#x1F3C6; 미니게임 대회</h3>';

  html += '<div style="display:flex;gap:8px;margin-bottom:10px;justify-content:center">';
  html += '<div style="text-align:center;padding:6px 12px;border-radius:10px;background:rgba(255,215,0,.1)"><div style="font-size:16px">&#x1F947;</div><div style="font-size:14px;font-weight:800;color:#D4940A">' + cd.medals.gold + '</div></div>';
  html += '<div style="text-align:center;padding:6px 12px;border-radius:10px;background:rgba(192,192,192,.15)"><div style="font-size:16px">&#x1F948;</div><div style="font-size:14px;font-weight:800;color:#9E9E9E">' + cd.medals.silver + '</div></div>';
  html += '<div style="text-align:center;padding:6px 12px;border-radius:10px;background:rgba(205,127,50,.1)"><div style="font-size:16px">&#x1F949;</div><div style="font-size:14px;font-weight:800;color:#CD7F32">' + cd.medals.bronze + '</div></div>';
  html += '</div>';

  html += '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:6px">';
  CHAMP_EVENTS.forEach(function(ev){
    html += '<button class="champ-event" data-ev="' + ev.id + '" style="padding:12px;border:2px solid rgba(255,95,162,.15);border-radius:14px;background:rgba(0,0,0,.02);cursor:pointer;text-align:center;transition:all .2s">';
    html += '<div style="font-size:24px">' + ev.icon + '</div>';
    html += '<div style="font-size:12px;font-weight:700;margin-top:4px">' + ev.name + '</div>';
    html += '<div style="font-size:10px;color:var(--text-sub)">' + ev.desc + '</div></button>';
  });
  html += '</div>';

  html += '<div style="text-align:center;margin-top:10px"><button id="champAllBtn" style="padding:8px 20px;background:linear-gradient(135deg,#FFD700,#FFA000);color:#fff;border:none;border-radius:12px;font-size:13px;font-weight:700;cursor:pointer;box-shadow:0 2px 8px rgba(255,215,0,.3)">&#x1F3C6; 전체 대회 시작</button></div>';
  html += '<div style="text-align:center;margin-top:6px;font-size:10px;color:var(--text-sub)">총 참가: ' + cd.played + '회</div>';
  html += '</div>';
  overlay.innerHTML = html;

  function runEvent(evId){
    var score = Math.floor(Math.random() * 100);
    var medal = score >= 80 ? 'gold' : score >= 50 ? 'silver' : 'bronze';
    cd.medals[medal]++;
    cd.played++;
    cd.bestEvent = evId;
    saveChampData(cd);
    var ev = CHAMP_EVENTS.filter(function(e){ return e.id === evId; })[0];
    var medalEmoji = {gold:'&#x1F947;',silver:'&#x1F948;',bronze:'&#x1F949;'};
    showToastV14(medalEmoji[medal] + ' ' + (ev ? ev.name : '') + ': ' + score + '점!');
    checkAndAwardV14();
    overlay.remove();
    openChampionship();
  }

  overlay.querySelectorAll('.champ-event').forEach(function(btn){
    btn.onclick = function(){ runEvent(btn.dataset.ev); };
  });

  document.getElementById('champAllBtn').onclick = function(){
    var totalScore = 0;
    CHAMP_EVENTS.forEach(function(ev){
      var s = Math.floor(Math.random() * 100);
      totalScore += s;
      var m = s >= 80 ? 'gold' : s >= 50 ? 'silver' : 'bronze';
      cd.medals[m]++;
    });
    cd.played += CHAMP_EVENTS.length;
    saveChampData(cd);
    var avg = Math.floor(totalScore / CHAMP_EVENTS.length);
    showToastV14('&#x1F3C6; 전체 대회 완료! 평균: ' + avg + '점');
    checkAndAwardV14();
    overlay.remove();
    openChampionship();
  };

  document.getElementById('champClose').onclick = function(){ overlay.remove(); };
  overlay.onclick = function(e){ if(e.target === overlay) overlay.remove(); };
  document.body.appendChild(overlay);
}


// ============================================================
// 7. FAN ART GALLERY (팬아트 갤러리)
// ============================================================
var GALLERY_STAMPS = [
  {id:'st_heart',icon:'&#x1F496;',name:'하트'},{id:'st_star',icon:'&#x2B50;',name:'별'},
  {id:'st_flower',icon:'&#x1F33A;',name:'꽃'},{id:'st_rainbow',icon:'&#x1F308;',name:'무지개'},
  {id:'st_cloud',icon:'&#x2601;&#xFE0F;',name:'구름'},{id:'st_sparkle',icon:'&#x2728;',name:'반짝'},
  {id:'st_moon',icon:'&#x1F319;',name:'달'},{id:'st_ribbon',icon:'&#x1F380;',name:'리본'},
  {id:'st_butterfly',icon:'&#x1F98B;',name:'나비'},{id:'st_music',icon:'&#x1F3B5;',name:'음표'},
  {id:'st_crown',icon:'&#x1F451;',name:'왕관'},{id:'st_diamond',icon:'&#x1F48E;',name:'다이아'}
];

var GALLERY_COLORS = ['#FF5FA2','#FF6347','#FFD700','#4CAF50','#2196F3','#9C27B0','#FF9800','#00BCD4'];

function getGalleryData(){
  return v14Load('gallery', {artworks:[],totalCreated:0});
}
function saveGalleryData(d){ v14Save('gallery', d); }

function openFanArtGallery(){
  if(document.getElementById('galleryModal')) return;
  trackV14Feature('gallery');
  sfxV14('gallery_open');

  var overlay = document.createElement('div');
  overlay.id = 'galleryModal';
  overlay.className = 'modal-overlay show';
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');

  var gd = getGalleryData();
  var currentColor = '#FF5FA2';
  var brushSize = 3;

  var html = '<div class="modal" style="max-width:480px">';
  html += '<button class="modal-close" id="galleryClose" aria-label="&#xB2EB;&#xAE30;">&times;</button>';
  html += '<h3 style="font-size:17px">&#x1F3A8; 팬아트 갤러리</h3>';

  html += '<canvas id="artCanvas" width="400" height="280" style="width:100%;border-radius:12px;margin-bottom:8px;background:#fff;cursor:crosshair;touch-action:none;border:2px solid rgba(0,0,0,.1)"></canvas>';

  html += '<div style="display:flex;gap:3px;margin-bottom:6px;flex-wrap:wrap;justify-content:center">';
  GALLERY_COLORS.forEach(function(c){
    html += '<button class="art-color" data-color="' + c + '" style="width:24px;height:24px;border-radius:50%;border:2px solid ' + (c === currentColor ? '#333' : 'transparent') + ';background:' + c + ';cursor:pointer"></button>';
  });
  html += '<button class="art-color" data-color="#FFFFFF" style="width:24px;height:24px;border-radius:50%;border:2px solid #ccc;background:#fff;cursor:pointer;font-size:10px">&#x1FA79;</button>';
  html += '</div>';

  html += '<div style="display:flex;gap:4px;margin-bottom:6px;justify-content:center">';
  GALLERY_STAMPS.slice(0,8).forEach(function(st){
    html += '<button class="art-stamp" data-stamp="' + st.id + '" style="width:28px;height:28px;border-radius:8px;border:1px solid rgba(0,0,0,.1);background:rgba(0,0,0,.02);cursor:pointer;font-size:14px" title="' + st.name + '">' + st.icon + '</button>';
  });
  html += '</div>';

  html += '<div style="display:flex;gap:6px;justify-content:center">';
  html += '<button id="artClear" style="padding:5px 12px;border:1px solid rgba(0,0,0,.1);border-radius:8px;background:rgba(0,0,0,.03);cursor:pointer;font-size:11px;font-weight:700">&#x1F5D1;&#xFE0F; 지우기</button>';
  html += '<button id="artSave" style="padding:5px 12px;border:none;border-radius:8px;background:linear-gradient(135deg,#FF5FA2,#B066FF);color:#fff;cursor:pointer;font-size:11px;font-weight:700">&#x1F4BE; 저장</button>';
  html += '<button id="artDownload" style="padding:5px 12px;border:none;border-radius:8px;background:linear-gradient(135deg,#4CAF50,#81C784);color:#fff;cursor:pointer;font-size:11px;font-weight:700">&#x1F4E5; 다운로드</button>';
  html += '</div>';
  html += '<div style="text-align:center;margin-top:6px;font-size:10px;color:var(--text-sub)">총 작품: ' + gd.totalCreated + '개</div>';
  html += '</div>';
  overlay.innerHTML = html;

  var canvas = document.getElementById('artCanvas');
  if(canvas){
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0,0,400,280);
    var drawing = false;

    function getPos(e){
      var rect = canvas.getBoundingClientRect();
      var scaleX = 400 / rect.width;
      var scaleY = 280 / rect.height;
      var clientX = e.touches ? e.touches[0].clientX : e.clientX;
      var clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY};
    }

    function startDraw(e){
      e.preventDefault();
      drawing = true;
      var pos = getPos(e);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    }
    function doDraw(e){
      e.preventDefault();
      if(!drawing) return;
      var pos = getPos(e);
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.strokeStyle = currentColor;
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    }
    function endDraw(e){ if(e) e.preventDefault(); drawing = false; }

    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', doDraw);
    canvas.addEventListener('mouseup', endDraw);
    canvas.addEventListener('mouseleave', endDraw);
    canvas.addEventListener('touchstart', startDraw, {passive:false});
    canvas.addEventListener('touchmove', doDraw, {passive:false});
    canvas.addEventListener('touchend', endDraw, {passive:false});
  }

  overlay.querySelectorAll('.art-color').forEach(function(btn){
    btn.onclick = function(){
      currentColor = btn.dataset.color;
      overlay.querySelectorAll('.art-color').forEach(function(b){ b.style.borderColor = 'transparent'; });
      btn.style.borderColor = '#333';
      brushSize = currentColor === '#FFFFFF' ? 12 : 3;
    };
  });

  overlay.querySelectorAll('.art-stamp').forEach(function(btn){
    btn.onclick = function(){
      if(!canvas) return;
      var ctx2 = canvas.getContext('2d');
      var x = 50 + Math.floor(Math.random() * 300);
      var y = 40 + Math.floor(Math.random() * 200);
      ctx2.font = '28px sans-serif';
      ctx2.textAlign = 'center';
      ctx2.textBaseline = 'middle';
      var st = GALLERY_STAMPS.filter(function(s){ return s.id === btn.dataset.stamp; })[0];
      if(st) ctx2.fillText(st.icon, x, y);
    };
  });

  document.getElementById('artClear').onclick = function(){
    if(canvas){
      var ctx3 = canvas.getContext('2d');
      ctx3.fillStyle = '#fff';
      ctx3.fillRect(0,0,400,280);
    }
  };

  document.getElementById('artSave').onclick = function(){
    gd.totalCreated++;
    saveGalleryData(gd);
    showToastV14('&#x1F4BE; 작품이 저장되었습니다! (총 ' + gd.totalCreated + '개)');
    checkAndAwardV14();
  };

  document.getElementById('artDownload').onclick = function(){
    if(!canvas) return;
    try{
      var link = document.createElement('a');
      link.download = 'hatcuping_fanart_' + Date.now() + '.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
      showToastV14('&#x1F4E5; 다운로드 완료!');
    }catch(e){
      showToastV14('&#x274C; 다운로드 실패');
    }
  };

  document.getElementById('galleryClose').onclick = function(){ overlay.remove(); };
  overlay.onclick = function(e){ if(e.target === overlay) overlay.remove(); };
  document.body.appendChild(overlay);
}


// ============================================================
// 8. DAILY REWARD CALENDAR (일일 보상 캘린더)
// ============================================================
function getCalendarData(){
  return v14Load('calendar', {claimed:{},streak:0,lastClaim:'',totalClaimed:0});
}
function saveCalendarData(d){ v14Save('calendar', d); }

function openDailyCalendar(){
  if(document.getElementById('calendarModal')) return;
  trackV14Feature('calendar');
  sfxV14('calendar_open');

  var overlay = document.createElement('div');
  overlay.id = 'calendarModal';
  overlay.className = 'modal-overlay show';
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');

  var cd = getCalendarData();
  var now = new Date();
  var year = now.getFullYear();
  var month = now.getMonth();
  var today = now.getDate();
  var todayKey = todayStrV14();

  var DAILY_REWARDS = [
    {day:1,reward:'&#x1FA99; 50코인',coins:50},{day:2,reward:'&#x1FA99; 50코인',coins:50},
    {day:3,reward:'&#x1FA99; 80코인',coins:80},{day:4,reward:'&#x1FA99; 80코인',coins:80},
    {day:5,reward:'&#x1FA99; 100코인',coins:100},{day:6,reward:'&#x1FA99; 120코인',coins:120},
    {day:7,reward:'&#x1F381; 150코인+아이템',coins:150}
  ];

  var html = '<div class="modal" style="max-width:440px">';
  html += '<button class="modal-close" id="calendarClose" aria-label="&#xB2EB;&#xAE30;">&times;</button>';
  html += '<h3 style="font-size:17px">&#x1F4C5; 일일 보상 캘린더</h3>';

  html += '<div style="text-align:center;margin-bottom:8px;font-size:13px;font-weight:700;color:#B088CC">' + year + '년 ' + (month+1) + '월</div>';

  html += '<canvas id="calCanvas" width="380" height="280" style="width:100%;border-radius:12px;margin-bottom:8px"></canvas>';

  var claimed = cd.claimed[todayKey];
  html += '<div style="text-align:center;margin-bottom:8px">';
  if(!claimed){
    html += '<button id="calClaimBtn" style="padding:8px 24px;background:linear-gradient(135deg,#FFD700,#FFA000);color:#fff;border:none;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;box-shadow:0 2px 10px rgba(255,215,0,.3);animation:badgePulse 1.5s ease-in-out infinite">&#x1F381; 오늘의 보상 받기!</button>';
  } else {
    html += '<div style="padding:8px 24px;background:rgba(76,175,80,.1);border-radius:12px;font-size:13px;font-weight:700;color:#4CAF50">&#x2705; 오늘 보상을 이미 받았어요!</div>';
  }
  html += '</div>';

  html += '<div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-sub)">';
  html += '<span>연속 출석: <b style="color:#FF5FA2">' + cd.streak + '일</b></span>';
  html += '<span>총 출석: <b style="color:#FF5FA2">' + cd.totalClaimed + '일</b></span></div>';

  html += '<div style="margin-top:8px"><div style="font-size:11px;font-weight:700;color:var(--text-sub);margin-bottom:4px">7일 연속 보상</div>';
  html += '<div style="display:flex;gap:4px">';
  DAILY_REWARDS.forEach(function(dr){
    var done = cd.streak >= dr.day;
    html += '<div style="flex:1;text-align:center;padding:4px;border-radius:8px;background:' + (done ? 'rgba(76,175,80,.1)' : 'rgba(0,0,0,.03)') + ';font-size:9px;border:1px solid ' + (done ? '#4CAF50' : 'transparent') + '">';
    html += '<div style="font-weight:700;color:' + (done ? '#4CAF50' : 'var(--text-sub)') + '">Day ' + dr.day + '</div>';
    html += '<div>' + (done ? '&#x2705;' : dr.reward) + '</div></div>';
  });
  html += '</div></div>';
  html += '</div>';
  overlay.innerHTML = html;

  var calCanvas = document.getElementById('calCanvas');
  if(calCanvas){
    var ctx = calCanvas.getContext('2d');
    ctx.fillStyle = 'rgba(255,95,162,.03)';
    ctx.fillRect(0,0,380,280);

    var dayNames = ['일','월','화','수','목','금','토'];
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    dayNames.forEach(function(dn, i){
      ctx.fillStyle = i === 0 ? '#F44336' : i === 6 ? '#2196F3' : '#888';
      ctx.fillText(dn, 27 + i * 50, 18);
    });

    var firstDay = new Date(year, month, 1).getDay();
    var daysInMonth = new Date(year, month + 1, 0).getDate();

    for(var d = 1; d <= daysInMonth; d++){
      var col = (firstDay + d - 1) % 7;
      var row = Math.floor((firstDay + d - 1) / 7);
      var cx = 27 + col * 50;
      var cy = 45 + row * 42;

      var dateKey = year + '-' + String(month+1).padStart(2,'0') + '-' + String(d).padStart(2,'0');
      var isClaimed = cd.claimed[dateKey];
      var isToday = d === today;

      if(isToday){
        ctx.fillStyle = '#FF5FA222';
        ctx.beginPath();
        ctx.arc(cx, cy, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FF5FA2';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      if(isClaimed){
        ctx.fillStyle = '#4CAF5022';
        ctx.beginPath();
        ctx.arc(cx, cy, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#4CAF50';
        ctx.font = '14px sans-serif';
        ctx.fillText('✓', cx, cy + 5);
      }

      ctx.fillStyle = isToday ? '#FF5FA2' : col === 0 ? '#F44336' : col === 6 ? '#2196F3' : '#555';
      ctx.font = (isToday ? 'bold ' : '') + '12px sans-serif';
      ctx.fillText(String(d), cx, cy + (isClaimed ? -8 : 4));
    }
  }

  if(!claimed && document.getElementById('calClaimBtn')){
    document.getElementById('calClaimBtn').onclick = function(){
      var yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      var yKey = yesterday.getFullYear() + '-' + String(yesterday.getMonth()+1).padStart(2,'0') + '-' + String(yesterday.getDate()).padStart(2,'0');

      if(cd.claimed[yKey]){
        cd.streak++;
      } else {
        cd.streak = 1;
      }
      cd.claimed[todayKey] = true;
      cd.totalClaimed++;
      saveCalendarData(cd);

      var rewardIdx = Math.min(cd.streak - 1, DAILY_REWARDS.length - 1);
      var reward = DAILY_REWARDS[rewardIdx];
      var shopData = getShopData();
      shopData.coins += reward.coins;
      saveShopData(shopData);

      sfxV14('calendar_claim');
      showToastV14('&#x1F381; Day ' + cd.streak + ' 보상: ' + reward.reward + ' 획득!');
      checkAndAwardV14();
      overlay.remove();
      openDailyCalendar();
    };
  }

  document.getElementById('calendarClose').onclick = function(){ overlay.remove(); };
  overlay.onclick = function(e){ if(e.target === overlay) overlay.remove(); };
  document.body.appendChild(overlay);
}


// ============================================================
// 9. QUIZ v6 (+15 questions about v14 features → 75→90)
// ============================================================
var V14_QUIZ = [
  {q:'이모션 상점의 총 아이템 수는?',a:['8개','10개','12개','15개'],c:2},
  {q:'상점에서 가장 비싼 아이템은?',a:['스피드부츠','경험치2배','행운상자','바다테마'],c:2},
  {q:'감정 배틀의 감정 종류는?',a:['6가지','7가지','8가지','10가지'],c:2},
  {q:'사랑 감정이 강한 상대는?',a:['용기','분노','공포','슬픔'],c:2},
  {q:'캐릭터 성장 레이더의 스탯 수는?',a:['4개','5개','6개','8개'],c:2},
  {q:'레이더에 없는 스탯은?',a:['공격','방어','체력','매력'],c:2},
  {q:'이모션 도감의 SSR 티니핑은?',a:['바로핑과 꽁꽁핑','하츄핑과 꿈꿔핑','해핑과 시러핑','화나핑과 무서핑'],c:1},
  {q:'미니게임 대회의 종목 수는?',a:['4종','5종','6종','8종'],c:2},
  {q:'팬아트 갤러리의 스탬프 수는?',a:['8개','10개','12개','15개'],c:2},
  {q:'일일 캘린더 7일차 보상은?',a:['50코인','100코인','150코인+아이템','200코인'],c:2},
  {q:'상점의 초기 보유 코인은?',a:['100','300','500','1000'],c:2},
  {q:'배틀에서 상성 유리 시 데미지는?',a:['20','30','40','50'],c:2},
  {q:'도감의 총 티니핑 수는?',a:['8종','10종','12종','15종'],c:2},
  {q:'갤러리의 색상 수는?',a:['6개','8개','10개','12개'],c:1},
  {q:'v14에서 추가된 업적 수는?',a:['8개','10개','12개','15개'],c:2}
];

function injectExtraQuizV14(){
  if(window._v14QuizInjected) return;
  window._v14QuizInjected = true;
  if(!window.QUIZ_DATA) window.QUIZ_DATA = [];
  V14_QUIZ.forEach(function(q){ window.QUIZ_DATA.push(q); });
}


// ============================================================
// 10. ACHIEVEMENTS +12 (94 → 106)
// ============================================================
var V14_ACHIEVEMENTS = [
  {id:'a_shop_first',name:'첫 구매',desc:'상점에서 첫 아이템 구매!',cat:'general',icon:'&#x1F6CD;&#xFE0F;'},
  {id:'a_shop_5',name:'쇼핑왕',desc:'상점에서 5종류 이상 구매!',cat:'general',icon:'&#x1F4B0;'},
  {id:'a_shop_rich',name:'부자 모험가',desc:'코인 1000개 이상 보유!',cat:'general',icon:'&#x1FA99;'},
  {id:'a_battle_win',name:'첫 승리',desc:'감정 배틀에서 첫 승리!',cat:'general',icon:'&#x2694;&#xFE0F;'},
  {id:'a_battle_streak5',name:'연승의 제왕',desc:'배틀 5연승 달성!',cat:'general',icon:'&#x1F525;'},
  {id:'a_radar_train',name:'훈련 시작',desc:'캐릭터 스탯 첫 훈련!',cat:'general',icon:'&#x1F4AA;'},
  {id:'a_dex_open',name:'도감 탐색',desc:'이모션 도감 열어보기!',cat:'general',icon:'&#x1F4D6;'},
  {id:'a_champ_gold',name:'금메달리스트',desc:'대회에서 금메달 획득!',cat:'general',icon:'&#x1F947;'},
  {id:'a_champ_all',name:'대회 마스터',desc:'전체 대회 참가!',cat:'general',icon:'&#x1F3C6;'},
  {id:'a_gallery_first',name:'첫 작품',desc:'팬아트 첫 작품 저장!',cat:'general',icon:'&#x1F3A8;'},
  {id:'a_calendar_7',name:'7일 연속',desc:'7일 연속 출석!',cat:'general',icon:'&#x1F4C5;'},
  {id:'a_v14_explorer',name:'v14 탐험가',desc:'v14 기능 6개 이상 사용!',cat:'general',icon:'&#x1F30D;'}
];

function injectV14Achievements(){
  if(window._v14AchievementsInjected) return;
  window._v14AchievementsInjected = true;
  if(window.AD){
    V14_ACHIEVEMENTS.forEach(function(a){
      var exists = window.AD.some(function(e){ return e.id === a.id; });
      if(!exists) window.AD.push(a);
    });
  }
}

function checkAndAwardV14(){
  if(!window.saveAchievement || !window.showAchieveToast) return;

  var shop = getShopData();
  if(shop.purchased.length >= 1 && window.saveAchievement('a_shop_first')){ window.showAchieveToast('첫 구매'); }
  if(shop.purchased.length >= 5 && window.saveAchievement('a_shop_5')){ window.showAchieveToast('쇼핑왕'); }
  if(shop.coins >= 1000 && window.saveAchievement('a_shop_rich')){ window.showAchieveToast('부자 모험가'); }

  var battle = getBattleData();
  if(battle.wins >= 1 && window.saveAchievement('a_battle_win')){ window.showAchieveToast('첫 승리'); }
  if(battle.bestStreak >= 5 && window.saveAchievement('a_battle_streak5')){ window.showAchieveToast('연승의 제왕'); }

  var radar = getRadarData();
  var hasTraining = false;
  Object.keys(radar.bonuses).forEach(function(k){
    if(radar.bonuses[k].some(function(v){ return v > 0; })) hasTraining = true;
  });
  if(hasTraining && window.saveAchievement('a_radar_train')){ window.showAchieveToast('훈련 시작'); }

  var dex = getDexData();
  if(dex.discovered.length > 0 && window.saveAchievement('a_dex_open')){ window.showAchieveToast('도감 탐색'); }

  var champ = getChampData();
  if(champ.medals.gold >= 1 && window.saveAchievement('a_champ_gold')){ window.showAchieveToast('금메달리스트'); }
  if(champ.played >= 6 && window.saveAchievement('a_champ_all')){ window.showAchieveToast('대회 마스터'); }

  var gallery = getGalleryData();
  if(gallery.totalCreated >= 1 && window.saveAchievement('a_gallery_first')){ window.showAchieveToast('첫 작품'); }

  var cal = getCalendarData();
  if(cal.streak >= 7 && window.saveAchievement('a_calendar_7')){ window.showAchieveToast('7일 연속'); }

  try{
    var feat = JSON.parse(localStorage.getItem('hatcuping_v14_features') || '[]');
    if(feat.length >= 6 && window.saveAchievement('a_v14_explorer')){ window.showAchieveToast('v14 탐험가'); }
  }catch(e){}
}


// ============================================================
// KEYBOARD SHORTCUTS (8: Shift+1~8 mapped to features)
// ============================================================
function injectV14Keyboard(){
  document.addEventListener('keydown', function(e){
    if(e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if(document.querySelector('.modal-overlay.show')) return;

    var key = e.key.toLowerCase();
    if(key === 'b' && e.shiftKey){ e.preventDefault(); openEmotionShop(); }
    else if(key === 'k' && e.shiftKey){ e.preventDefault(); openRankingBoard(); }
    else if(key === 'v' && e.shiftKey){ e.preventDefault(); openBattleSimulator(); }
    else if(key === 'g' && e.shiftKey){ e.preventDefault(); openGrowthRadar(); }
    else if(key === 'x' && e.shiftKey){ e.preventDefault(); openEnhancedDex(); }
    else if(key === 'c' && e.shiftKey){ e.preventDefault(); openChampionship(); }
    else if(key === 'w' && e.shiftKey){ e.preventDefault(); openFanArtGallery(); }
    else if(key === 'l' && e.shiftKey){ e.preventDefault(); openDailyCalendar(); }
  });
}

function updateV14KeyboardHelp(){
  var kbHelp = document.querySelector('#kbHelp .modal');
  if(!kbHelp) return;
  var newRows = [
    ['이모션 상점','Shift+B'],['스테이지 랭킹','Shift+K'],['감정 배틀','Shift+V'],
    ['캐릭터 성장','Shift+G'],['이모션 도감','Shift+X'],['미니게임 대회','Shift+C'],
    ['팬아트 갤러리','Shift+W'],['일일 캘린더','Shift+L']
  ];
  newRows.forEach(function(r){
    var row = document.createElement('div');
    row.className = 'kb-help-row';
    row.innerHTML = '<span>' + r[0] + '</span><span class="kb-help-key">' + r[1] + '</span>';
    kbHelp.appendChild(row);
  });
}


// ============================================================
// SCROLL NAVIGATION BAR (bottom)
// ============================================================
function injectV14ScrollNav(){
  if(document.getElementById('v14ScrollNav')) return;
  var nav = document.createElement('div');
  nav.id = 'v14ScrollNav';
  nav.style.cssText = 'position:fixed;bottom:8px;left:50%;transform:translateX(-50%);z-index:900;display:flex;gap:4px;background:rgba(255,255,255,.85);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);padding:4px 8px;border-radius:20px;box-shadow:0 2px 12px rgba(0,0,0,.1);border:1px solid rgba(255,95,162,.15)';

  var navBtns = [
    {icon:'&#x1F6CD;&#xFE0F;',label:'상점',action:openEmotionShop,color:'#9C27B0'},
    {icon:'&#x1F3C5;',label:'랭킹',action:openRankingBoard,color:'#FF9800'},
    {icon:'&#x2694;&#xFE0F;',label:'배틀',action:openBattleSimulator,color:'#F44336'},
    {icon:'&#x1F4CA;',label:'성장',action:openGrowthRadar,color:'#2196F3'},
    {icon:'&#x1F4D6;',label:'도감',action:openEnhancedDex,color:'#4CAF50'},
    {icon:'&#x1F3C6;',label:'대회',action:openChampionship,color:'#FFD700'},
    {icon:'&#x1F3A8;',label:'갤러리',action:openFanArtGallery,color:'#E91E63'},
    {icon:'&#x1F4C5;',label:'출석',action:openDailyCalendar,color:'#FF5722'}
  ];

  navBtns.forEach(function(b){
    var btn = document.createElement('button');
    btn.style.cssText = 'border:none;background:none;cursor:pointer;padding:4px 6px;border-radius:12px;transition:all .2s;display:flex;flex-direction:column;align-items:center;gap:1px';
    btn.innerHTML = '<span style="font-size:16px">' + b.icon + '</span><span style="font-size:8px;font-weight:700;color:' + b.color + '">' + b.label + '</span>';
    btn.setAttribute('aria-label', b.label);
    btn.onmouseenter = function(){ btn.style.background = 'rgba(255,95,162,.1)'; btn.style.transform = 'scale(1.1)'; };
    btn.onmouseleave = function(){ btn.style.background = 'none'; btn.style.transform = 'scale(1)'; };
    btn.onclick = b.action;
    nav.appendChild(btn);
  });

  document.body.appendChild(nav);
}


// ============================================================
// FOOTER, NEWS, META, ACHIEVE COUNT UPDATE
// ============================================================
function updateV14Footer(){
  var ver = document.querySelector('.footer .version');
  if(ver) ver.textContent = 'v14.0 | © PRIME Holdings NEXTERA+PRISM';

  var links = document.querySelector('.footer-links');
  if(links) links.innerHTML = '<span class="footer-link">4종 게임</span><span class="footer-link">106개 업적</span><span class="footer-link">상점 12종</span><span class="footer-link">배틀 8감정</span><span class="footer-link">도감 12종</span><span class="footer-link">대회 6종</span>';
}

function updateV14News(){
  var newsSection = document.querySelector('.news-section');
  if(!newsSection) return;
  var firstItem = newsSection.querySelector('.news-item');
  if(!firstItem) return;
  var existing = newsSection.querySelectorAll('.news-item');
  var hasV14 = false;
  existing.forEach(function(item){
    if(item.textContent.indexOf('v14.0') !== -1) hasV14 = true;
  });
  if(hasV14) return;
  var newItem = document.createElement('div');
  newItem.className = 'news-item';
  newItem.innerHTML = '<span class="news-date">v14.0</span><span class="news-text">이모션상점 12종, 스테이지랭킹, 감정배틀 8감정, 캐릭터성장레이더Canvas, 이모션도감 12종, 미니게임대회 6종, 팬아트갤러리Canvas, 일일보상캘린더Canvas, 퀴즈+15(90), 업적+12(106)</span>';
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
  if(descMeta) descMeta.content = '사랑의 하츄핑 v14.0 - 플랫포머 액션, 턴제 RPG, 오픈월드, UNIFIED 4종 게임. 업적 106개, 상점 12종, 배틀 8감정, 도감 12종, 대회 6종, 갤러리, 캘린더, 퀴즈 90문!';
  document.title = '사랑의 하츄핑 v14.0 - 게임 선택';
}


// ============================================================
// BOOT
// ============================================================
function bootV14(){
  injectV14Achievements();
  injectExtraQuizV14();
  injectV14Keyboard();
  updateV14KeyboardHelp();
  injectV14ScrollNav();
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

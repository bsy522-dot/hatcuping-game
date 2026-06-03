// hatcuping-game v10_patch.js - NEXTERA+PRISM AUTO v10.0
// Self-contained patch module (1050+ lines, 35 functions)
(function(){
'use strict';

// ============================================================
// 1. CARD MATCHING MINI-GAME (카드 매칭 기억력 게임 6쌍)
// ============================================================
var CARD_PAIRS = [
  {id:'romi',emoji:'&#x1F467;',name:'로미'},
  {id:'hatchu',emoji:'&#x1F496;',name:'하츄핑'},
  {id:'baro',emoji:'&#x1F6E1;&#xFE0F;',name:'바로핑'},
  {id:'chacha',emoji:'&#x1F33F;',name:'차차핑'},
  {id:'lala',emoji:'&#x1F3B5;',name:'라라핑'},
  {id:'kkong',emoji:'&#x2744;&#xFE0F;',name:'꽁꽁핑'}
];

function openCardMatch(){
  if(document.getElementById('cardModal')) return;
  var overlay = document.createElement('div');
  overlay.id = 'cardModal';
  overlay.className = 'modal-overlay show';
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');

  var deck = [];
  CARD_PAIRS.forEach(function(p){
    deck.push({id:p.id,emoji:p.emoji,name:p.name});
    deck.push({id:p.id,emoji:p.emoji,name:p.name});
  });
  for(var i = deck.length - 1; i > 0; i--){
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = deck[i]; deck[i] = deck[j]; deck[j] = tmp;
  }

  var flipped = [], matched = [], moves = 0, locked = false;
  var startTime = Date.now();

  function render(){
    var elapsed = Math.floor((Date.now() - startTime) / 1000);
    var html = '<div class="modal" style="max-width:380px;text-align:center">';
    html += '<button class="modal-close" id="cardClose" aria-label="닫기">&times;</button>';
    html += '<h3 style="font-size:17px">&#x1F0CF; 카드 매칭</h3>';
    html += '<div style="display:flex;justify-content:center;gap:16px;font-size:12px;color:var(--text-sub);margin-bottom:10px">';
    html += '<span>이동: <strong style="color:var(--pink)">'+moves+'</strong>회</span>';
    html += '<span>매칭: <strong style="color:#4CAF50">'+matched.length/2+'/6</strong></span>';
    html += '<span>시간: <strong>'+elapsed+'</strong>초</span></div>';
    html += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;max-width:300px;margin:0 auto">';
    deck.forEach(function(card, idx){
      var isFlipped = flipped.indexOf(idx) !== -1;
      var isMatched = matched.indexOf(idx) !== -1;
      if(isFlipped || isMatched){
        html += '<div class="match-card" data-idx="'+idx+'" style="width:66px;height:78px;border-radius:14px;background:'+(isMatched?'rgba(76,175,80,.12)':'rgba(255,95,162,.08)')+';border:2px solid '+(isMatched?'#4CAF50':'var(--pink)')+';display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:default;transition:all .2s">';
        html += '<span style="font-size:24px">'+card.emoji+'</span>';
        html += '<span style="font-size:9px;font-weight:700;color:var(--text);margin-top:2px">'+card.name+'</span></div>';
      } else {
        html += '<div class="match-card" data-idx="'+idx+'" style="width:66px;height:78px;border-radius:14px;background:linear-gradient(135deg,var(--pink),var(--purple));display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .2s;box-shadow:0 2px 8px rgba(255,95,162,.2)">';
        html += '<span style="font-size:20px;color:#fff">?</span></div>';
      }
    });
    html += '</div>';

    if(matched.length === 12){
      var finalTime = Math.floor((Date.now() - startTime) / 1000);
      var xpReward = Math.max(20, 80 - moves - finalTime);
      if(typeof window.setXP === 'function' && typeof window.getXP === 'function'){
        window.setXP(window.getXP() + xpReward);
      }
      html += '<div style="margin-top:12px;padding:14px;background:rgba(255,215,0,.1);border-radius:14px">';
      html += '<div style="font-size:20px">&#x1F389;</div>';
      html += '<div style="font-size:15px;font-weight:800;color:#FFD700">완벽한 매칭!</div>';
      html += '<div style="font-size:12px;color:var(--text-sub)">'+moves+'회, '+finalTime+'초 | +'+xpReward+' XP</div></div>';
      checkAndAwardV10('a_card_match');
      if(moves <= 12) checkAndAwardV10('a_card_perfect');
      sfxV10('card_win');
    }
    html += '</div>';
    overlay.innerHTML = html;

    document.getElementById('cardClose').onclick = function(){ overlay.remove(); };
    overlay.onclick = function(e){ if(e.target === overlay) overlay.remove(); };

    if(matched.length < 12){
      document.querySelectorAll('.match-card').forEach(function(el){
        el.onclick = function(){
          if(locked) return;
          var idx = parseInt(el.dataset.idx);
          if(flipped.indexOf(idx) !== -1 || matched.indexOf(idx) !== -1) return;
          flipped.push(idx);
          sfxV10('card_flip');
          moves++;
          render();

          if(flipped.length === 2){
            locked = true;
            var a = flipped[0], b = flipped[1];
            if(deck[a].id === deck[b].id){
              matched.push(a, b);
              flipped = [];
              locked = false;
              sfxV10('card_match');
              render();
            } else {
              setTimeout(function(){
                flipped = [];
                locked = false;
                render();
              }, 700);
            }
          }
        };
      });
    }
  }
  render();
  sfxV10('card_open');
}


// ============================================================
// 2. WEATHER PARTICLE SYSTEM (날씨 효과 4종)
// ============================================================
var weatherTypes = ['clear','rain','snow','sakura'];
var currentWeather = 'clear';
var weatherParticles = [];
var weatherCanvas = null;
var weatherCtx = null;
var weatherAnimId = null;

function initWeatherCanvas(){
  if(weatherCanvas) return;
  weatherCanvas = document.createElement('canvas');
  weatherCanvas.id = 'weatherFX';
  weatherCanvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0;opacity:.7';
  document.body.insertBefore(weatherCanvas, document.body.firstChild);
  weatherCtx = weatherCanvas.getContext('2d');
  resizeWeather();
  window.addEventListener('resize', resizeWeather);
}

function resizeWeather(){
  if(!weatherCanvas) return;
  weatherCanvas.width = window.innerWidth;
  weatherCanvas.height = window.innerHeight;
}

function setWeather(type){
  currentWeather = type;
  weatherParticles = [];
  try{ localStorage.setItem('hatcuping_weather', type); }catch(e){}
  if(type === 'clear'){
    if(weatherAnimId){ cancelAnimationFrame(weatherAnimId); weatherAnimId = null; }
    if(weatherCtx) weatherCtx.clearRect(0, 0, weatherCanvas.width, weatherCanvas.height);
    return;
  }
  initWeatherCanvas();
  var count = type === 'rain' ? 80 : type === 'snow' ? 50 : 40;
  for(var i = 0; i < count; i++){
    weatherParticles.push(createWeatherParticle(type, true));
  }
  if(!weatherAnimId) animateWeather();
  checkAndAwardV10('a_weather');
}

function createWeatherParticle(type, init){
  var w = weatherCanvas ? weatherCanvas.width : window.innerWidth;
  var h = weatherCanvas ? weatherCanvas.height : window.innerHeight;
  var p = {x: Math.random() * w, y: init ? Math.random() * h : -10};
  if(type === 'rain'){
    p.speed = 8 + Math.random() * 6;
    p.length = 12 + Math.random() * 8;
    p.opacity = 0.3 + Math.random() * 0.4;
  } else if(type === 'snow'){
    p.speed = 1 + Math.random() * 2;
    p.size = 2 + Math.random() * 4;
    p.wobble = Math.random() * Math.PI * 2;
    p.wobbleSpeed = 0.02 + Math.random() * 0.03;
    p.opacity = 0.5 + Math.random() * 0.5;
  } else {
    p.speed = 1 + Math.random() * 1.5;
    p.size = 6 + Math.random() * 6;
    p.rotation = Math.random() * 360;
    p.rotSpeed = 1 + Math.random() * 3;
    p.wobble = Math.random() * Math.PI * 2;
    p.opacity = 0.6 + Math.random() * 0.4;
  }
  return p;
}

function animateWeather(){
  if(currentWeather === 'clear') return;
  if(!weatherCtx || !weatherCanvas) return;
  var w = weatherCanvas.width, h = weatherCanvas.height;
  weatherCtx.clearRect(0, 0, w, h);

  weatherParticles.forEach(function(p, i){
    if(currentWeather === 'rain'){
      p.y += p.speed;
      p.x += 1;
      weatherCtx.strokeStyle = 'rgba(150,200,255,' + p.opacity + ')';
      weatherCtx.lineWidth = 1;
      weatherCtx.beginPath();
      weatherCtx.moveTo(p.x, p.y);
      weatherCtx.lineTo(p.x + 1, p.y + p.length);
      weatherCtx.stroke();
    } else if(currentWeather === 'snow'){
      p.y += p.speed;
      p.wobble += p.wobbleSpeed;
      p.x += Math.sin(p.wobble) * 0.8;
      weatherCtx.fillStyle = 'rgba(255,255,255,' + p.opacity + ')';
      weatherCtx.beginPath();
      weatherCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      weatherCtx.fill();
    } else {
      p.y += p.speed;
      p.wobble += 0.02;
      p.x += Math.sin(p.wobble) * 1.5;
      p.rotation += p.rotSpeed;
      weatherCtx.save();
      weatherCtx.translate(p.x, p.y);
      weatherCtx.rotate(p.rotation * Math.PI / 180);
      weatherCtx.globalAlpha = p.opacity;
      weatherCtx.fillStyle = '#FFB7C5';
      for(var k = 0; k < 5; k++){
        weatherCtx.beginPath();
        weatherCtx.ellipse(0, -p.size * 0.4, p.size * 0.25, p.size * 0.4, k * Math.PI / 2.5, 0, Math.PI * 2);
        weatherCtx.fill();
      }
      weatherCtx.globalAlpha = 1;
      weatherCtx.restore();
    }

    if(p.y > h + 20 || p.x > w + 20 || p.x < -20){
      weatherParticles[i] = createWeatherParticle(currentWeather, false);
      weatherParticles[i].x = Math.random() * w;
    }
  });
  weatherAnimId = requestAnimationFrame(animateWeather);
}


// ============================================================
// 3. SHARE CARD (Canvas 600x380 플레이 통계 공유)
// ============================================================
function openShareCard(){
  if(document.getElementById('shareModal')) return;
  var overlay = document.createElement('div');
  overlay.id = 'shareModal';
  overlay.className = 'modal-overlay show';
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');

  var html = '<div class="modal" style="max-width:440px;text-align:center">';
  html += '<button class="modal-close" id="shareClose" aria-label="닫기">&times;</button>';
  html += '<h3 style="font-size:17px">&#x1F4F7; 플레이 카드 공유</h3>';
  html += '<canvas id="shareCanvas" width="600" height="380" style="width:100%;border-radius:14px;margin-bottom:8px"></canvas>';
  html += '<div style="display:flex;gap:8px;justify-content:center">';
  html += '<button id="shareDownload" style="padding:8px 16px;background:linear-gradient(135deg,var(--pink),var(--purple));color:#fff;border:none;border-radius:12px;font-size:12px;font-weight:700;cursor:pointer">&#x1F4E5; PNG 다운로드</button>';
  html += '<button id="shareCopy" style="padding:8px 16px;background:rgba(0,0,0,.06);border:1px solid var(--border);border-radius:12px;font-size:12px;font-weight:700;cursor:pointer;color:var(--text)">&#x1F4CB; 클립보드 복사</button>';
  html += '</div></div>';
  overlay.innerHTML = html;
  document.body.appendChild(overlay);

  drawShareCard();

  document.getElementById('shareClose').onclick = function(){ overlay.remove(); };
  overlay.onclick = function(e){ if(e.target === overlay) overlay.remove(); };

  document.getElementById('shareDownload').onclick = function(){
    var cv = document.getElementById('shareCanvas');
    var link = document.createElement('a');
    link.download = 'hatcuping-stats.png';
    link.href = cv.toDataURL('image/png');
    link.click();
    sfxV10('share_save');
    checkAndAwardV10('a_share');
  };

  document.getElementById('shareCopy').onclick = function(){
    var cv = document.getElementById('shareCanvas');
    cv.toBlob(function(blob){
      if(blob && navigator.clipboard && navigator.clipboard.write){
        navigator.clipboard.write([new ClipboardItem({'image/png': blob})]).then(function(){
          showToastV10('&#x1F4CB; 클립보드에 복사됨!');
        });
      } else {
        showToastV10('&#x26A0;&#xFE0F; 이 브라우저에서 지원되지 않습니다');
      }
    }, 'image/png');
  };
  sfxV10('share_open');
}

function drawShareCard(){
  var cv = document.getElementById('shareCanvas');
  if(!cv) return;
  var ctx = cv.getContext('2d');
  var W = 600, H = 380;

  var grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, '#FF6B9D');
  grad.addColorStop(0.5, '#B066FF');
  grad.addColorStop(1, '#5FA2FF');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = 'rgba(255,255,255,.12)';
  ctx.beginPath(); ctx.arc(480, 60, 100, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(80, 320, 60, 0, Math.PI*2); ctx.fill();

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 28px -apple-system,BlinkMacSystemFont,sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('사랑의 하츄핑 v10.0', 30, 50);

  ctx.font = '14px -apple-system,BlinkMacSystemFont,sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,.8)';
  ctx.fillText('My Play Stats', 30, 72);

  var stats;
  try{ stats = JSON.parse(localStorage.getItem('hatcuping_stats') || '{}'); }catch(e){ stats = {}; }
  var achieveCount = 0;
  try{ achieveCount = Object.keys(JSON.parse(localStorage.getItem('hatcuping_achievements') || '{}')).length; }catch(e){}
  var xp = 0;
  try{ xp = parseInt(localStorage.getItem('hatcuping_xp') || '0'); }catch(e){}
  var bossCount = 0;
  try{ bossCount = Object.keys(JSON.parse(localStorage.getItem('hatcuping_boss_progress') || '{}')).length; }catch(e){}

  var statData = [
    {label:'플레이 시간',value:Math.floor((stats.playTime||0)/60)+'분',icon:'&#x23F1;'},
    {label:'클리어',value:(stats.clears||0)+'회',icon:'&#x2705;'},
    {label:'업적',value:achieveCount+'개',icon:'&#x1F3C6;'},
    {label:'XP',value:xp,icon:'&#x1F4B0;'},
    {label:'보스 격파',value:bossCount+'/4',icon:'&#x2694;'},
    {label:'하트',value:(stats.hearts||0)+'개',icon:'&#x1F496;'}
  ];

  ctx.fillStyle = 'rgba(0,0,0,.2)';
  ctx.fillRect(20, 90, W-40, 230);
  ctx.fillStyle = 'rgba(255,255,255,.08)';
  ctx.fillRect(20, 90, W-40, 230);

  statData.forEach(function(s, i){
    var col = i % 3;
    var row = Math.floor(i / 3);
    var x = 40 + col * 185;
    var y = 115 + row * 110;

    ctx.fillStyle = 'rgba(255,255,255,.12)';
    var rr = 14;
    ctx.beginPath();
    ctx.moveTo(x+rr, y); ctx.lineTo(x+160-rr, y);
    ctx.quadraticCurveTo(x+160, y, x+160, y+rr);
    ctx.lineTo(x+160, y+85-rr);
    ctx.quadraticCurveTo(x+160, y+85, x+160-rr, y+85);
    ctx.lineTo(x+rr, y+85);
    ctx.quadraticCurveTo(x, y+85, x, y+85-rr);
    ctx.lineTo(x, y+rr);
    ctx.quadraticCurveTo(x, y, x+rr, y);
    ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,.6)';
    ctx.font = '12px -apple-system,sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(s.label, x+80, y+25);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 28px -apple-system,sans-serif';
    ctx.fillText(String(s.value), x+80, y+60);
  });

  ctx.fillStyle = 'rgba(255,255,255,.5)';
  ctx.font = '11px -apple-system,sans-serif';
  ctx.textAlign = 'right';
  var dateStr = new Date().toISOString().slice(0,10);
  ctx.fillText('PRIME Holdings NEXTERA+PRISM | '+dateStr, W-20, H-15);
}


// ============================================================
// 4. WEEKLY CHALLENGE (주간 챌린지 4목표)
// ============================================================
var WEEKLY_GOALS = [
  {id:'w_boss',name:'보스 1회 격파',desc:'보스 배틀에서 승리하기',target:1,icon:'&#x2694;&#xFE0F;'},
  {id:'w_quiz',name:'퀴즈 80% 이상',desc:'세계관 퀴즈에서 80점 이상 받기',target:1,icon:'&#x1F4DA;'},
  {id:'w_puzzle',name:'퍼즐 2회 완성',desc:'슬라이드 퍼즐 2번 클리어',target:2,icon:'&#x1F9E9;'},
  {id:'w_card',name:'카드매칭 클리어',desc:'카드 매칭 게임 완료',target:1,icon:'&#x1F0CF;'},
  {id:'w_play30',name:'30분 플레이',desc:'총 30분 이상 플레이',target:30,icon:'&#x23F1;&#xFE0F;'},
  {id:'w_item3',name:'아이템 3종 수집',desc:'새로운 아이템 3종 획득',target:3,icon:'&#x1F392;'},
  {id:'w_skill2',name:'스킬 2개 해금',desc:'스킬 트리에서 2개 해금',target:2,icon:'&#x1F333;'},
  {id:'w_achieve3',name:'업적 3개 달성',desc:'새 업적 3개 획득',target:3,icon:'&#x1F3C6;'}
];

function getWeekSeed(){
  var now = new Date();
  return now.getFullYear() * 100 + Math.floor((now.getMonth()*30 + now.getDate()) / 7);
}

function getWeeklyProgress(){
  try{
    var data = JSON.parse(localStorage.getItem('hatcuping_weekly') || '{}');
    if(data.seed !== getWeekSeed()) return {seed: getWeekSeed(), progress: {}, completed: false};
    return data;
  }catch(e){ return {seed: getWeekSeed(), progress: {}, completed: false}; }
}

function openWeeklyChallenge(){
  if(document.getElementById('weeklyModal')) return;
  var overlay = document.createElement('div');
  overlay.id = 'weeklyModal';
  overlay.className = 'modal-overlay show';
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');

  var seed = getWeekSeed();
  var selected = [];
  var rng = seed;
  for(var i = 0; i < 4; i++){
    rng = (rng * 1103515245 + 12345) & 0x7fffffff;
    var idx = rng % WEEKLY_GOALS.length;
    while(selected.indexOf(idx) !== -1){ idx = (idx + 1) % WEEKLY_GOALS.length; }
    selected.push(idx);
  }

  var weekData = getWeeklyProgress();
  var totalDone = 0;

  var html = '<div class="modal" style="max-width:400px">';
  html += '<button class="modal-close" id="weeklyClose" aria-label="닫기">&times;</button>';
  html += '<h3 style="font-size:17px">&#x1F4C5; 주간 챌린지</h3>';
  html += '<div style="font-size:12px;color:var(--text-sub);margin-bottom:12px">매주 새로운 4개 목표에 도전하세요!</div>';

  selected.forEach(function(gIdx){
    var g = WEEKLY_GOALS[gIdx];
    var prog = weekData.progress[g.id] || 0;
    var done = prog >= g.target;
    if(done) totalDone++;
    var pct = Math.min(100, Math.round(prog / g.target * 100));

    html += '<div style="padding:12px;margin-bottom:8px;border-radius:14px;background:'+(done?'rgba(76,175,80,.06)':'rgba(0,0,0,.02)')+';border:1px solid '+(done?'rgba(76,175,80,.2)':'transparent')+'">';
    html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">';
    html += '<span style="font-size:18px">'+g.icon+'</span>';
    html += '<div style="flex:1"><div style="font-size:13px;font-weight:700">'+(done?'&#x2705; ':'')+g.name+'</div>';
    html += '<div style="font-size:11px;color:var(--text-sub)">'+g.desc+'</div></div>';
    html += '<span style="font-size:11px;font-weight:700;color:'+(done?'#4CAF50':'var(--pink)')+'">'+prog+'/'+g.target+'</span></div>';
    html += '<div style="height:6px;background:rgba(0,0,0,.06);border-radius:3px;overflow:hidden">';
    html += '<div style="height:100%;width:'+pct+'%;background:'+(done?'#4CAF50':'linear-gradient(90deg,var(--pink),var(--purple))')+';border-radius:3px;transition:width .3s"></div></div></div>';
  });

  if(totalDone >= 4){
    html += '<div style="text-align:center;padding:12px;background:rgba(255,215,0,.1);border-radius:14px;margin-top:4px">';
    html += '<div style="font-size:20px">&#x1F389;</div>';
    html += '<div style="font-size:14px;font-weight:800;color:#FFD700">주간 챌린지 올클리어!</div></div>';
    checkAndAwardV10('a_weekly_clear');
  }
  html += '</div>';
  overlay.innerHTML = html;
  document.body.appendChild(overlay);

  document.getElementById('weeklyClose').onclick = function(){ overlay.remove(); };
  overlay.onclick = function(e){ if(e.target === overlay) overlay.remove(); };
  sfxV10('weekly_open');
}


// ============================================================
// 5. BATTLE STATS DASHBOARD (전투 통계 Canvas 대시보드)
// ============================================================
function getBattleStats(){
  try{ return JSON.parse(localStorage.getItem('hatcuping_battle_stats') || '{"wins":0,"losses":0,"totalDmg":0,"totalHeal":0,"maxCombo":0,"bossKills":0,"turns":0}'); }
  catch(e){ return {wins:0,losses:0,totalDmg:0,totalHeal:0,maxCombo:0,bossKills:0,turns:0}; }
}

function openBattleStats(){
  if(document.getElementById('bstatsModal')) return;
  var overlay = document.createElement('div');
  overlay.id = 'bstatsModal';
  overlay.className = 'modal-overlay show';
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');

  var bs = getBattleStats();
  var winRate = bs.wins + bs.losses > 0 ? Math.round(bs.wins / (bs.wins + bs.losses) * 100) : 0;

  var html = '<div class="modal" style="max-width:420px">';
  html += '<button class="modal-close" id="bstatsClose" aria-label="닫기">&times;</button>';
  html += '<h3 style="font-size:17px">&#x1F4CA; 전투 통계</h3>';

  html += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px">';
  var cards = [
    {label:'승리',value:bs.wins,color:'#4CAF50'},
    {label:'패배',value:bs.losses,color:'#F44336'},
    {label:'승률',value:winRate+'%',color:'#FF9800'}
  ];
  cards.forEach(function(c){
    html += '<div style="text-align:center;padding:10px;border-radius:14px;background:'+c.color+'0A">';
    html += '<div style="font-size:22px;font-weight:800;color:'+c.color+'">'+c.value+'</div>';
    html += '<div style="font-size:10px;color:var(--text-sub);font-weight:600">'+c.label+'</div></div>';
  });
  html += '</div>';

  html += '<canvas id="bstatsCanvas" width="380" height="200" style="width:100%;border-radius:14px;background:rgba(0,0,0,.03);margin-bottom:8px"></canvas>';

  var details = [
    {label:'총 데미지',value:bs.totalDmg,icon:'&#x2694;&#xFE0F;'},
    {label:'총 치유량',value:bs.totalHeal,icon:'&#x1F49A;'},
    {label:'최대 콤보',value:bs.maxCombo,icon:'&#x1F525;'},
    {label:'보스 격파',value:bs.bossKills,icon:'&#x1F480;'},
    {label:'총 턴 수',value:bs.turns,icon:'&#x1F504;'}
  ];
  html += '<div style="display:flex;flex-wrap:wrap;gap:6px">';
  details.forEach(function(d){
    html += '<div style="flex:1;min-width:100px;padding:8px;border-radius:10px;background:rgba(0,0,0,.02);text-align:center">';
    html += '<div style="font-size:14px">'+d.icon+'</div>';
    html += '<div style="font-size:16px;font-weight:800;color:var(--pink)">'+d.value+'</div>';
    html += '<div style="font-size:9px;color:var(--text-sub)">'+d.label+'</div></div>';
  });
  html += '</div></div>';
  overlay.innerHTML = html;
  document.body.appendChild(overlay);

  drawBattleChart(bs);

  document.getElementById('bstatsClose').onclick = function(){ overlay.remove(); };
  overlay.onclick = function(e){ if(e.target === overlay) overlay.remove(); };
  checkAndAwardV10('a_stats_view');
  sfxV10('stats_open');
}

function drawBattleChart(bs){
  var cv = document.getElementById('bstatsCanvas');
  if(!cv) return;
  var ctx = cv.getContext('2d');
  var W = 380, H = 200;

  var data = [
    {label:'승리',value:bs.wins,color:'#4CAF50'},
    {label:'패배',value:bs.losses,color:'#F44336'},
    {label:'데미지',value:Math.min(bs.totalDmg, 999),color:'#FF9800'},
    {label:'치유',value:Math.min(bs.totalHeal, 999),color:'#2196F3'},
    {label:'콤보',value:bs.maxCombo * 10,color:'#8B5CF6'}
  ];
  var maxVal = Math.max.apply(null, data.map(function(d){ return d.value; }));
  if(maxVal === 0) maxVal = 1;

  ctx.strokeStyle = 'rgba(0,0,0,.06)';
  for(var i = 0; i <= 4; i++){
    var y = 20 + (H - 50) * (1 - i/4);
    ctx.beginPath(); ctx.moveTo(50, y); ctx.lineTo(W - 20, y); ctx.stroke();
  }

  var barW = 40, gap = (W - 70 - data.length * barW) / (data.length + 1);
  data.forEach(function(d, i){
    var x = 50 + gap * (i + 1) + barW * i;
    var barH = (d.value / maxVal) * (H - 60);
    var y = H - 30 - barH;

    var g = ctx.createLinearGradient(x, y, x, H - 30);
    g.addColorStop(0, d.color);
    g.addColorStop(1, d.color + '44');
    ctx.fillStyle = g;

    ctx.beginPath();
    ctx.moveTo(x + 6, y);
    ctx.lineTo(x + barW - 6, y);
    ctx.quadraticCurveTo(x + barW, y, x + barW, y + 6);
    ctx.lineTo(x + barW, H - 30);
    ctx.lineTo(x, H - 30);
    ctx.lineTo(x, y + 6);
    ctx.quadraticCurveTo(x, y, x + 6, y);
    ctx.fill();

    ctx.fillStyle = d.color;
    ctx.font = 'bold 10px -apple-system,sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(String(d.value), x + barW/2, y - 5);

    ctx.fillStyle = '#666';
    ctx.font = '9px -apple-system,sans-serif';
    ctx.fillText(d.label, x + barW/2, H - 15);
  });
}


// ============================================================
// 6. COMPANION SYSTEM (동반자 4종)
// ============================================================
var COMPANIONS = [
  {id:'fairy_star',name:'별빛 요정',bonus:'XP +20%',emoji:'&#x2B50;',color:'#FFD54F',desc:'XP 획득량이 20% 증가합니다'},
  {id:'dragon_mini',name:'미니 드래곤',bonus:'공격력 +15%',emoji:'&#x1F409;',color:'#EF4444',desc:'전투 시 공격력이 15% 증가합니다'},
  {id:'snow_bunny',name:'눈토끼',bonus:'회복 +25%',emoji:'&#x1F430;',color:'#88CCFF',desc:'치유 효과가 25% 강화됩니다'},
  {id:'flower_spirit',name:'꽃의 정령',bonus:'행운 +10%',emoji:'&#x1F338;',color:'#FF9ED8',desc:'아이템 획득 확률이 10% 증가합니다'}
];

function getCompanion(){
  try{ return localStorage.getItem('hatcuping_companion') || ''; }catch(e){ return ''; }
}

function openCompanionSelect(){
  if(document.getElementById('companionModal')) return;
  var overlay = document.createElement('div');
  overlay.id = 'companionModal';
  overlay.className = 'modal-overlay show';
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');

  var current = getCompanion();

  var html = '<div class="modal" style="max-width:400px">';
  html += '<button class="modal-close" id="companionClose" aria-label="닫기">&times;</button>';
  html += '<h3 style="font-size:17px">&#x1F43E; 동반자 선택</h3>';
  html += '<div style="font-size:12px;color:var(--text-sub);margin-bottom:12px">모험을 함께할 동반자를 선택하세요!</div>';

  COMPANIONS.forEach(function(c){
    var isActive = current === c.id;
    html += '<div class="companion-card" data-id="'+c.id+'" style="display:flex;gap:12px;padding:12px;margin-bottom:8px;border-radius:14px;background:'+(isActive?c.color+'15':'rgba(0,0,0,.02)')+';border:2px solid '+(isActive?c.color:'transparent')+';cursor:pointer;transition:all .2s">';
    html += '<div style="width:48px;height:48px;border-radius:14px;background:'+c.color+'22;display:flex;align-items:center;justify-content:center;font-size:24px;transition:transform .2s">'+c.emoji+'</div>';
    html += '<div style="flex:1"><div style="display:flex;align-items:center;gap:6px">';
    html += '<span style="font-size:14px;font-weight:700">'+c.name+'</span>';
    if(isActive) html += '<span style="font-size:9px;padding:1px 6px;border-radius:8px;background:'+c.color+'22;color:'+c.color+';font-weight:700">활성</span>';
    html += '</div>';
    html += '<div style="font-size:11px;color:var(--text-sub);margin-top:2px">'+c.desc+'</div>';
    html += '<div style="font-size:10px;font-weight:700;color:'+c.color+';margin-top:3px">&#x2728; '+c.bonus+'</div>';
    html += '</div></div>';
  });
  html += '</div>';
  overlay.innerHTML = html;
  document.body.appendChild(overlay);

  document.getElementById('companionClose').onclick = function(){ overlay.remove(); };
  overlay.onclick = function(e){ if(e.target === overlay) overlay.remove(); };

  document.querySelectorAll('.companion-card').forEach(function(card){
    card.onclick = function(){
      var id = card.dataset.id;
      try{ localStorage.setItem('hatcuping_companion', id); }catch(e){}
      sfxV10('companion_select');
      showToastV10('&#x1F43E; '+COMPANIONS.find(function(c){return c.id===id}).name+' 선택!');
      checkAndAwardV10('a_companion');
      overlay.remove();
    };
  });
  sfxV10('companion_open');
}


// ============================================================
// 7. SOUNDTRACK PLAYER (사운드트랙 주크박스 7곡)
// ============================================================
var TRACKS = [
  {id:'t_title',name:'사랑의 하츄핑 - 메인 테마',bpm:100,key:'C major',notes:[523,659,784,659,523,392,523,659],dur:.25},
  {id:'t_forest',name:'이모션 숲의 아침',bpm:80,key:'G major',notes:[392,494,587,494,392,330,392,494],dur:.3},
  {id:'t_battle',name:'보스전 - 결전의 때',bpm:140,key:'D minor',notes:[587,523,440,523,587,698,587,523],dur:.15},
  {id:'t_village',name:'평화로운 마을',bpm:90,key:'F major',notes:[349,440,523,440,349,294,349,440],dur:.3},
  {id:'t_crystal',name:'크리스탈 동굴',bpm:70,key:'A minor',notes:[440,523,660,523,440,330,440,523],dur:.35},
  {id:'t_ending',name:'엔딩 - 사랑의 힘',bpm:95,key:'C major',notes:[523,659,784,1047,784,659,523,659],dur:.3},
  {id:'t_lullaby',name:'하츄핑의 자장가',bpm:60,key:'G major',notes:[392,494,587,494,587,659,587,494],dur:.4}
];

var bgmPlaying = null;
var bgmInterval = null;

function openSoundtrack(){
  if(document.getElementById('bgmModal')) return;
  var overlay = document.createElement('div');
  overlay.id = 'bgmModal';
  overlay.className = 'modal-overlay show';
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');

  var html = '<div class="modal" style="max-width:400px">';
  html += '<button class="modal-close" id="bgmClose" aria-label="닫기">&times;</button>';
  html += '<h3 style="font-size:17px">&#x1F3B6; 사운드트랙</h3>';
  html += '<div style="font-size:12px;color:var(--text-sub);margin-bottom:12px">7곡의 오리지널 사운드트랙을 감상하세요</div>';

  TRACKS.forEach(function(t){
    var isPlaying = bgmPlaying === t.id;
    html += '<div class="track-card" data-id="'+t.id+'" style="display:flex;align-items:center;gap:10px;padding:10px;margin-bottom:4px;border-radius:12px;background:'+(isPlaying?'rgba(255,95,162,.08)':'rgba(0,0,0,.02)')+';border:1px solid '+(isPlaying?'var(--pink)':'transparent')+';cursor:pointer;transition:all .2s">';
    html += '<div style="width:36px;height:36px;border-radius:10px;background:'+(isPlaying?'linear-gradient(135deg,var(--pink),var(--purple))':'rgba(0,0,0,.04)')+';display:flex;align-items:center;justify-content:center;font-size:16px;color:'+(isPlaying?'#fff':'var(--text-sub)')+'">'+(isPlaying?'&#x23F8;':'&#x25B6;')+'</div>';
    html += '<div style="flex:1"><div style="font-size:13px;font-weight:700;color:'+(isPlaying?'var(--pink)':'var(--text)')+'">'+t.name+'</div>';
    html += '<div style="font-size:10px;color:var(--text-sub)">'+t.key+' | '+t.bpm+' BPM</div></div></div>';
  });

  html += '<div style="text-align:center;margin-top:8px">';
  html += '<button id="bgmStop" style="padding:6px 16px;background:rgba(244,67,54,.1);border:1px solid rgba(244,67,54,.2);border-radius:10px;font-size:11px;font-weight:700;color:#F44336;cursor:pointer">&#x23F9; 정지</button></div>';
  html += '</div>';
  overlay.innerHTML = html;
  document.body.appendChild(overlay);

  document.getElementById('bgmClose').onclick = function(){ overlay.remove(); };
  overlay.onclick = function(e){ if(e.target === overlay) overlay.remove(); };
  document.getElementById('bgmStop').onclick = function(){
    stopBGM();
    bgmPlaying = null;
    overlay.remove();
    openSoundtrack();
  };

  document.querySelectorAll('.track-card').forEach(function(card){
    card.onclick = function(){
      var id = card.dataset.id;
      if(bgmPlaying === id){ stopBGM(); bgmPlaying = null; }
      else {
        var track = TRACKS.find(function(t){ return t.id === id; });
        if(track){ playBGM(track); bgmPlaying = id; checkAndAwardV10('a_soundtrack'); }
      }
      overlay.remove();
      openSoundtrack();
    };
  });
  sfxV10('bgm_open');
}

function playBGM(track){
  stopBGM();
  if(window.UISfx && window.UISfx.isMuted()) return;
  var ctx;
  try{ ctx = new (window.AudioContext || window.webkitAudioContext)(); }catch(e){ return; }
  var noteIdx = 0;
  function playNote(){
    if(!bgmPlaying) return;
    try{
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'triangle';
      o.frequency.value = track.notes[noteIdx % track.notes.length];
      g.gain.setValueAtTime(0.06, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + track.dur * 0.9);
      o.connect(g); g.connect(ctx.destination);
      o.start(); o.stop(ctx.currentTime + track.dur);
      noteIdx++;
    }catch(e){}
  }
  playNote();
  bgmInterval = setInterval(playNote, track.dur * 1000);
}

function stopBGM(){
  if(bgmInterval){ clearInterval(bgmInterval); bgmInterval = null; }
}


// ============================================================
// 8. GAME TIPS/GUIDE (게임 팁 12개)
// ============================================================
var TIPS = [
  {icon:'&#x1F4A1;',title:'보스전 팁',text:'HP가 30% 이하일 때 보스는 필살기를 사용합니다. 방어 타이밍을 잘 맞추세요!'},
  {icon:'&#x2694;&#xFE0F;',title:'스킬 우선순위',text:'공격력 강화 I → 크리티컬 히트 → 궁극의 사랑 순서가 가장 효율적입니다.'},
  {icon:'&#x1F48E;',title:'아이템 수집',text:'일일 보상 7일 연속으로 에픽 등급 &quot;사랑의 펜던트&quot;를 얻을 수 있어요!'},
  {icon:'&#x1F9E9;',title:'퍼즐 팁',text:'가장자리 숫자부터 맞추고, 중앙을 마지막에 해결하면 30회 이내에 클리어 가능!'},
  {icon:'&#x1F3AE;',title:'플랫포머 팁',text:'더블점프 후 대시를 사용하면 더 먼 거리를 이동할 수 있어요.'},
  {icon:'&#x1F6E1;&#xFE0F;',title:'방어 활용',text:'보스전에서 방어를 사용하면 피해를 60% 감소시킬 수 있습니다.'},
  {icon:'&#x1F4B0;',title:'XP 벌기',text:'퀴즈 만점(75XP) + 보스 격파(80XP)가 가장 효율적인 XP 획득 방법이에요.'},
  {icon:'&#x1F319;',title:'다크모드',text:'다크모드에서 게임 클리어 시 특별 업적을 달성할 수 있어요!'},
  {icon:'&#x1F496;',title:'하트 어택',text:'하트 어택은 일반 공격보다 50% 더 강하지만, 빗나갈 수 있어요.'},
  {icon:'&#x1F43E;',title:'동반자 효과',text:'동반자를 선택하면 보너스 효과가 적용됩니다. 전투 스타일에 맞게 선택하세요!'},
  {icon:'&#x1F30A;',title:'날씨 효과',text:'날씨 효과를 바꿔보세요! 눈이나 벚꽃 효과로 게임 분위기가 달라져요.'},
  {icon:'&#x1F4C5;',title:'주간 챌린지',text:'매주 4개의 새로운 목표가 갱신됩니다. 올클리어하면 특별 업적을 얻어요!'}
];

function openTips(){
  if(document.getElementById('tipsModal')) return;
  var overlay = document.createElement('div');
  overlay.id = 'tipsModal';
  overlay.className = 'modal-overlay show';
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');

  var html = '<div class="modal" style="max-width:400px;max-height:85vh;overflow-y:auto">';
  html += '<button class="modal-close" id="tipsClose" aria-label="닫기">&times;</button>';
  html += '<h3 style="font-size:17px">&#x1F4A1; 게임 가이드</h3>';
  html += '<div style="font-size:12px;color:var(--text-sub);margin-bottom:12px">'+TIPS.length+'개의 유용한 팁으로 게임을 마스터하세요!</div>';

  TIPS.forEach(function(t){
    html += '<div style="padding:10px;margin-bottom:6px;border-radius:14px;background:rgba(0,0,0,.02);transition:all .2s">';
    html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">';
    html += '<span style="font-size:18px">'+t.icon+'</span>';
    html += '<span style="font-size:13px;font-weight:700">'+t.title+'</span></div>';
    html += '<div style="font-size:12px;color:var(--text-sub);line-height:1.5;padding-left:30px">'+t.text+'</div></div>';
  });
  html += '</div>';
  overlay.innerHTML = html;
  document.body.appendChild(overlay);

  document.getElementById('tipsClose').onclick = function(){ overlay.remove(); };
  overlay.onclick = function(e){ if(e.target === overlay) overlay.remove(); };
  checkAndAwardV10('a_tips_read');
  sfxV10('tips_open');
}


// ============================================================
// 9. ADDITIONAL QUIZ QUESTIONS (+15, total 30)
// ============================================================
var EXTRA_QUIZ = [
  {q:'하츄핑의 날개 색깔은?',a:['파란색','분홍색','노란색','초록색'],c:1},
  {q:'이모션 왕국의 여왕 이름은?',a:['엘사','하츄핑','에이스','로열 퀸'],c:3},
  {q:'트러핑이 원하는 것은?',a:['우정','권력과 지배','사랑','음악'],c:1},
  {q:'RPG에서 최대 파티 인원은?',a:['2명','3명','4명','5명'],c:2},
  {q:'플랫포머에서 더블점프 후 사용 가능한 기술은?',a:['방어','대시','텔레포트','회전'],c:1},
  {q:'스킬 트리에서 가장 비싼 스킬의 XP 비용은?',a:['100','200','300','500'],c:2},
  {q:'일일 보상 7일차에 받는 아이템은?',a:['포션','별 조각','사랑의 펜던트','황금 왕관'],c:2},
  {q:'보스 배틀 첫 번째 보스는?',a:['어둠의 드래곤','그림자 박쥐','얼음 골렘','트러핑'],c:1},
  {q:'아이템 중 전설 등급은 몇 종?',a:['1종','2종','3종','4종'],c:1},
  {q:'슬라이드 퍼즐은 몇 x 몇 크기?',a:['2x2','3x3','4x4','5x5'],c:1},
  {q:'로미의 기본 HP는?',a:['50','80','100','120'],c:2},
  {q:'월드맵의 마지막 스테이지 이름은?',a:['어둠의 통로','구름의 성','트러핑 최종전','이모션 숲'],c:2},
  {q:'게임에서 사용하는 통화 단위는?',a:['골드','XP','루비','다이아'],c:1},
  {q:'4종 게임을 모두 플레이하면 얻는 업적은?',a:['올라운더','마스터','챔피언','레전드'],c:0},
  {q:'동반자 중 XP 보너스를 주는 것은?',a:['미니 드래곤','눈토끼','별빛 요정','꽃의 정령'],c:2}
];

function injectExtraQuiz(){
  if(!window.QUIZ_QUESTIONS) return;
  EXTRA_QUIZ.forEach(function(q){
    var exists = window.QUIZ_QUESTIONS.some(function(eq){ return eq.q === q.q; });
    if(!exists) window.QUIZ_QUESTIONS.push(q);
  });
}


// ============================================================
// 10. NEW ACHIEVEMENTS (+12, total 58)
// ============================================================
var V10_ACHIEVEMENTS = [
  {id:'a_card_match',name:'카드 마스터',desc:'카드 매칭 게임 클리어',cat:'general',icon:'&#x1F0CF;'},
  {id:'a_card_perfect',name:'완벽한 기억력',desc:'12회 이내로 카드 매칭 클리어',cat:'general',icon:'&#x1F9E0;'},
  {id:'a_weather',name:'날씨 마법사',desc:'날씨 효과를 변경',cat:'general',icon:'&#x1F326;&#xFE0F;'},
  {id:'a_share',name:'자랑하기',desc:'플레이 카드를 공유/저장',cat:'general',icon:'&#x1F4F7;'},
  {id:'a_weekly_clear',name:'주간 챌피언',desc:'주간 챌린지 4개 올클리어',cat:'general',icon:'&#x1F4C5;'},
  {id:'a_stats_view',name:'통계 분석가',desc:'전투 통계 대시보드 확인',cat:'general',icon:'&#x1F4CA;'},
  {id:'a_companion',name:'첫 동반자',desc:'동반자를 선택',cat:'general',icon:'&#x1F43E;'},
  {id:'a_soundtrack',name:'음악 감상가',desc:'사운드트랙 재생',cat:'general',icon:'&#x1F3B6;'},
  {id:'a_tips_read',name:'공부벌레',desc:'게임 가이드 열어보기',cat:'general',icon:'&#x1F4A1;'},
  {id:'a_quiz_30',name:'퀴즈 박사',desc:'30문제 퀴즈 도전',cat:'general',icon:'&#x1F393;'},
  {id:'a_xp_1000',name:'XP 대부호',desc:'총 XP 1000 이상',cat:'general',icon:'&#x1F4B0;'},
  {id:'a_all_features',name:'탐험의 달인',desc:'v10 기능 5가지 이상 사용',cat:'general',icon:'&#x1F30D;'}
];

function injectV10Achievements(){
  if(!window.AD) return;
  V10_ACHIEVEMENTS.forEach(function(a){
    if(!window.AD.find(function(x){ return x.id === a.id; })){
      window.AD.push(a);
    }
  });
}

function checkAndAwardV10(id){
  if(!window.saveAchievement) return;
  if(window.saveAchievement(id)){
    var def = V10_ACHIEVEMENTS.find(function(a){ return a.id === id; });
    if(!def && window.AD) def = window.AD.find(function(a){ return a.id === id; });
    if(def && window.showAchieveToast) window.showAchieveToast(def.name);
    if(window.updateAchieveCount) window.updateAchieveCount();
  }
  trackV10Feature(id);
}


// ============================================================
// 11. SFX (효과음 12종)
// ============================================================
var sfxCtxV10 = null;
function sfxV10(type){
  if(window.UISfx && window.UISfx.isMuted()) return;
  if(!sfxCtxV10) try{ sfxCtxV10 = new (window.AudioContext || window.webkitAudioContext)(); }catch(e){ return; }
  if(sfxCtxV10.state === 'suspended') sfxCtxV10.resume();
  var t = sfxCtxV10.currentTime;
  function osc(freq, dur, vol, waveType, delay){
    try{
      var o = sfxCtxV10.createOscillator(), g = sfxCtxV10.createGain();
      o.type = waveType || 'sine'; o.frequency.value = freq;
      g.gain.setValueAtTime(vol || 0.08, t + (delay||0));
      g.gain.exponentialRampToValueAtTime(0.001, t + (delay||0) + dur);
      o.connect(g); g.connect(sfxCtxV10.destination);
      o.start(t + (delay||0)); o.stop(t + (delay||0) + dur);
    }catch(e){}
  }
  var map = {
    card_open: function(){ osc(523,.06,.07,'triangle'); osc(784,.06,.06,'triangle',.05); },
    card_flip: function(){ osc(880,.03,.06,'sine'); },
    card_match: function(){ osc(659,.06,.08,'triangle'); osc(880,.08,.07,'triangle',.05); },
    card_win: function(){ [523,659,784,1047,1319].forEach(function(f,i){ osc(f,.1,.09,'triangle',i*.07); }); },
    share_open: function(){ osc(440,.06,.06,'sine'); osc(660,.06,.05,'sine',.05); },
    share_save: function(){ [659,784,1047].forEach(function(f,i){ osc(f,.08,.08,'triangle',i*.06); }); },
    weekly_open: function(){ osc(523,.06,.06,'sine'); osc(659,.06,.05,'sine',.04); },
    stats_open: function(){ osc(392,.06,.06,'sine'); osc(523,.06,.05,'sine',.05); },
    companion_open: function(){ osc(494,.06,.06,'sine'); osc(659,.06,.05,'sine',.04); },
    companion_select: function(){ [523,659,784].forEach(function(f,i){ osc(f,.08,.08,'triangle',i*.05); }); },
    bgm_open: function(){ osc(440,.06,.06,'triangle'); osc(523,.06,.05,'triangle',.05); },
    tips_open: function(){ osc(600,.06,.06,'sine'); osc(800,.06,.05,'sine',.04); }
  };
  if(map[type]) map[type]();
}


// ============================================================
// 12. FEATURE TRACKING + UI INJECTION
// ============================================================
var v10FeaturesUsed = new Set();
function trackV10Feature(id){
  v10FeaturesUsed.add(id);
  try{
    var saved = JSON.parse(localStorage.getItem('hatcuping_v10_features') || '[]');
    if(saved.indexOf(id) === -1){ saved.push(id); localStorage.setItem('hatcuping_v10_features', JSON.stringify(saved)); }
    if(saved.length >= 5) checkAndAwardV10('a_all_features');
  }catch(e){}
}

function showToastV10(msg){
  var t = document.getElementById('achieveToast');
  if(t){ t.innerHTML = msg; t.classList.add('show'); setTimeout(function(){ t.classList.remove('show'); }, 2500); }
}

function injectV10QuickActions(){
  var topBar = document.querySelector('.top-bar');
  if(!topBar) return;

  var btns = [
    {id:'cardMatchBtn',label:'카드매칭',icon:'&#x1F0CF;',title:'카드매칭 (C)',action:openCardMatch},
    {id:'weatherBtn',label:'날씨',icon:'&#x1F326;&#xFE0F;',title:'날씨 (Shift+W)',action:cycleWeather},
    {id:'shareBtn',label:'공유',icon:'&#x1F4F7;',title:'공유 (Shift+S)',action:openShareCard},
    {id:'weeklyBtn',label:'주간',icon:'&#x1F4C5;',title:'주간 챌린지 (Shift+C)',action:openWeeklyChallenge},
    {id:'bstatsBtn',label:'통계',icon:'&#x1F4CA;',title:'전투통계 (Shift+T)',action:openBattleStats},
    {id:'companBtn',label:'동반자',icon:'&#x1F43E;',title:'동반자 (Shift+P)',action:openCompanionSelect},
    {id:'bgmBtn',label:'BGM',icon:'&#x1F3B6;',title:'사운드트랙 (Shift+M)',action:openSoundtrack},
    {id:'tipsBtn',label:'가이드',icon:'&#x1F4A1;',title:'가이드 (Shift+G)',action:openTips}
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

var weatherCycleIdx = 0;
function cycleWeather(){
  weatherCycleIdx = (weatherCycleIdx + 1) % weatherTypes.length;
  setWeather(weatherTypes[weatherCycleIdx]);
  var names = {clear:'맑음',rain:'비',snow:'눈',sakura:'벚꽃'};
  showToastV10('&#x1F326;&#xFE0F; 날씨: '+names[weatherTypes[weatherCycleIdx]]);
  sfxV10('companion_select');
}

function injectV10Keyboard(){
  document.addEventListener('keydown', function(e){
    if(e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if(document.querySelector('.modal-overlay.show')) return;

    var key = e.key.toLowerCase();
    if(key === 'c' && !e.shiftKey && !e.ctrlKey && !e.metaKey){ e.preventDefault(); openCardMatch(); }
    else if(key === 'w' && e.shiftKey){ e.preventDefault(); cycleWeather(); }
    else if(key === 's' && e.shiftKey){ e.preventDefault(); openShareCard(); }
    else if(key === 'c' && e.shiftKey){ e.preventDefault(); openWeeklyChallenge(); }
    else if(key === 't' && e.shiftKey){ e.preventDefault(); openBattleStats(); }
    else if(key === 'p' && e.shiftKey){ e.preventDefault(); openCompanionSelect(); }
    else if(key === 'm' && e.shiftKey){ e.preventDefault(); openSoundtrack(); }
    else if(key === 'g' && e.shiftKey){ e.preventDefault(); openTips(); }
  });
}

function updateV10KeyboardHelp(){
  var kbHelp = document.querySelector('#kbHelp .modal');
  if(!kbHelp) return;
  var newRows = [
    ['카드매칭','C'],['날씨 효과','Shift+W'],['공유 카드','Shift+S'],['주간 챌린지','Shift+C'],
    ['전투 통계','Shift+T'],['동반자','Shift+P'],['사운드트랙','Shift+M'],['게임 가이드','Shift+G']
  ];
  newRows.forEach(function(r){
    var row = document.createElement('div');
    row.className = 'kb-help-row';
    row.innerHTML = '<span>' + r[0] + '</span><span class="kb-help-key">' + r[1] + '</span>';
    kbHelp.appendChild(row);
  });
}

function updateV10Footer(){
  var ver = document.querySelector('.footer .version');
  if(ver) ver.textContent = 'v10.0 | © PRIME Holdings NEXTERA+PRISM';

  var links = document.querySelector('.footer-links');
  if(links) links.innerHTML = '<span class="footer-link">4종 게임</span><span class="footer-link">58개 업적</span><span class="footer-link">15종 아이템</span><span class="footer-link">12종 스킬</span><span class="footer-link">7곡 OST</span>';
}

function updateV10News(){
  var newsSection = document.querySelector('.news-section');
  if(!newsSection) return;
  var firstItem = newsSection.querySelector('.news-item');
  if(!firstItem) return;
  var newItem = document.createElement('div');
  newItem.className = 'news-item';
  newItem.innerHTML = '<span class="news-date">v10.0</span><span class="news-text">카드매칭 미니게임, 날씨효과 4종, 공유카드, 주간챌린지, 전투통계, 동반자 4종, 사운드트랙 7곡, 게임가이드, 퀴즈+15문(30), 업적+12(58)</span>';
  firstItem.parentNode.insertBefore(newItem, firstItem);
}

function updateV10AchieveCount(){
  var el = document.getElementById('achieveCount');
  if(el){
    var c = 0;
    try{ c = Object.keys(JSON.parse(localStorage.getItem('hatcuping_achievements') || '{}')).length; }catch(e){}
    var t = window.AD ? window.AD.length : 58;
    el.textContent = c + '/' + t;
  }
}

function updateV10Meta(){
  var descMeta = document.querySelector('meta[name="description"]');
  if(descMeta) descMeta.content = '사랑의 하츄핑 v10.0 - 플랫포머 액션, 턴제 RPG, 오픈월드, UNIFIED 4종 게임. 업적 58개, 보스배틀 4종, 스킬트리 12종, 카드매칭, 날씨효과, 동반자 4종, OST 7곡!';
  document.title = '사랑의 하츄핑 v10.0 - 게임 선택';
}

function restoreWeather(){
  try{
    var saved = localStorage.getItem('hatcuping_weather');
    if(saved && saved !== 'clear'){
      weatherCycleIdx = weatherTypes.indexOf(saved);
      if(weatherCycleIdx === -1) weatherCycleIdx = 0;
      setWeather(saved);
    }
  }catch(e){}
}

function checkXP1000(){
  try{
    var xp = parseInt(localStorage.getItem('hatcuping_xp') || '0');
    if(xp >= 1000) checkAndAwardV10('a_xp_1000');
  }catch(e){}
}


// ============================================================
// BOOT
// ============================================================
function bootV10(){
  injectV10Achievements();
  injectExtraQuiz();
  injectV10QuickActions();
  injectV10Keyboard();
  updateV10KeyboardHelp();
  updateV10Footer();
  updateV10News();
  updateV10AchieveCount();
  updateV10Meta();
  restoreWeather();
  checkXP1000();
}

if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', bootV10);
} else {
  bootV10();
}

})();

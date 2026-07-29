// hatcuping-game v25_patch.js - NEXTERA+PRISM AUTO v25.0
// Self-contained IIFE patch module
(function(){
'use strict';

var _v25Ctx = null;
function _v25InitAudio(){
  if(!_v25Ctx){
    try{ _v25Ctx = new (window.AudioContext || window.webkitAudioContext)(); }catch(e){}
  }
  if(_v25Ctx && _v25Ctx.state === 'suspended') _v25Ctx.resume();
}

var V25_SFX = {
  codex_scan:{f:680,d:.07,t:'triangle'},
  codex_switch:{f:1100,d:.12,t:'sine'},
  xp_calc:{f:770,d:.06,t:'triangle'},
  xp_optimize:{f:1250,d:.18,t:'sine'},
  boss_analyze:{f:440,d:.08,t:'sawtooth'},
  boss_weak:{f:990,d:.15,t:'triangle'},
  drop_sim:{f:600,d:.05,t:'sine'},
  drop_rare:{f:1400,d:.25,t:'triangle'},
  party_select:{f:720,d:.06,t:'triangle'},
  party_synergy:{f:1050,d:.2,t:'sine'},
  stage_click:{f:550,d:.04,t:'square'},
  stage_star:{f:1200,d:.15,t:'triangle'},
  battle_predict:{f:660,d:.08,t:'sine'},
  battle_win:{f:1300,d:.22,t:'triangle'},
  journal_mark:{f:500,d:.05,t:'sine'},
  journal_streak:{f:1100,d:.18,t:'triangle'},
  v25_nav:{f:740,d:.05,t:'sine'},
  v25_quiz:{f:920,d:.08,t:'triangle'}
};

function sfxV25(type){
  _v25InitAudio();
  if(!_v25Ctx) return;
  var s = V25_SFX[type];
  if(!s) return;
  try{
    var muted = false;
    try{ muted = localStorage.getItem('hatcuping_mute') === '1'; }catch(e){}
    if(muted) return;
    var osc = _v25Ctx.createOscillator();
    var gain = _v25Ctx.createGain();
    osc.type = s.t || 'sine';
    osc.frequency.value = s.f;
    gain.gain.value = 0.08;
    osc.connect(gain);
    gain.connect(_v25Ctx.destination);
    osc.start();
    osc.stop(_v25Ctx.currentTime + (s.d || 0.06));
  }catch(e){}
}

function v25Load(key, fb){ try{ var d = JSON.parse(localStorage.getItem(key)); return d !== null ? d : fb; }catch(e){ return fb; } }
function v25Save(key, data){ try{ localStorage.setItem(key, JSON.stringify(data)); }catch(e){} }
function isDarkV25(){ return document.body.classList.contains('dark'); }
function showToastV25(msg){
  var t = document.getElementById('achieveToast');
  if(t){ t.innerHTML = msg; t.classList.add('show'); setTimeout(function(){ t.classList.remove('show'); }, 2500); }
}

function createV25Modal(title, contentHTML){
  var overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.6);z-index:9999;display:flex;justify-content:center;align-items:center;backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px)';
  var modal = document.createElement('div');
  var bg = isDarkV25() ? '#2a1a3e' : '#fff';
  var col = isDarkV25() ? '#eee' : '#333';
  modal.style.cssText = 'background:' + bg + ';color:' + col + ';border-radius:24px;padding:24px;max-width:680px;width:94%;max-height:85vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.25);position:relative';
  modal.innerHTML = '<button style="position:absolute;top:12px;right:16px;background:none;border:none;font-size:24px;cursor:pointer;color:' + col + '" onclick="this.closest(\'div[style]\').parentElement.remove()">&times;</button><h3 style="font-size:18px;margin-bottom:16px;color:#FF5FA2">' + title + '</h3>' + contentHTML;
  overlay.appendChild(modal);
  overlay.addEventListener('click', function(e){ if(e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
  return modal;
}


// ============================================================
// 1. MONSTER CODEX ANALYZER (Canvas 620x400)
// ============================================================
var CODEX_MONSTERS = [
  {name:'슬라임',icon:'🟢',grade:'D',atk:20,def:15,spd:30,mag:10,hp:25,spc:5,desc:'기본 몬스터. 느리지만 만만하지 않다.'},
  {name:'고블린',icon:'👺',grade:'D',atk:35,def:20,spd:40,mag:15,hp:30,spc:10,desc:'교활한 소형 몬스터.'},
  {name:'오크',icon:'👹',grade:'C',atk:55,def:50,spd:20,mag:10,hp:60,spc:15,desc:'힘이 센 전사 몬스터.'},
  {name:'스켈레톤',icon:'💀',grade:'C',atk:40,def:25,spd:45,mag:35,hp:20,spc:30,desc:'언데드 몬스터. 마법 저항 높음.'},
  {name:'위치',icon:'🧙',grade:'B',atk:30,def:20,spd:35,mag:70,hp:25,spc:45,desc:'강력한 마법 공격을 사용.'},
  {name:'드래곤',icon:'🐉',grade:'A',atk:80,def:70,spd:50,mag:60,hp:85,spc:55,desc:'공중의 왕. 브레스 공격 주의.'},
  {name:'페닉스',icon:'🔥',grade:'A',atk:75,def:45,spd:70,mag:65,hp:50,spc:80,desc:'불사조. 부활 능력 보유.'},
  {name:'골렘',icon:'🧱',grade:'B',atk:50,def:90,spd:10,mag:5,hp:95,spc:20,desc:'그그 절대 방어. 속도가 느림.'},
  {name:'크라켄',icon:'🐙',grade:'A',atk:70,def:60,spd:40,mag:55,hp:75,spc:65,desc:'심해의 괴물. 다수의 촉수 공격.'},
  {name:'키메라',icon:'🦁',grade:'S',atk:85,def:65,spd:60,mag:70,hp:70,spc:75,desc:'합성 몬스터. 다양한 속성 공격.'},
  {name:'리바이어던',icon:'🐳',grade:'S',atk:90,def:80,spd:30,mag:75,hp:100,hp2:100,spc:70,desc:'바다의 지배자. 거대한 체력.'},
  {name:'히드라',icon:'🐲',grade:'S',atk:95,def:75,spd:55,mag:80,hp:90,spc:90,desc:'다두 몬스터. 머리를 잘라도 재생.'}
];
var CODEX_AXES = ['공격','방어','속도','마법','체력','특수'];

function renderMonsterCodex(){
  var saved = v25Load('v25_codex', {selected:0, scanned:[]});
  var html = '<div style="text-align:center;margin-bottom:12px"><canvas id="v25CodexCanvas" width="620" height="400" style="max-width:100%;border-radius:12px;background:' + (isDarkV25()?'#1a0a2e':'#FFF0F8') + '"></canvas></div>';
  html += '<div style="text-align:center;font-size:12px;color:' + (isDarkV25()?'#aaa':'#888') + '">캔버스 클릭으로 몬스터 전환 | 스캔: ' + saved.scanned.length + '/' + CODEX_MONSTERS.length + '</div>';

  var m = createV25Modal('📖 몬스터도감분석기', html);

  function drawCodex(){
    var c = document.getElementById('v25CodexCanvas');
    if(!c) return;
    var ctx = c.getContext('2d');
    var W = c.width, H = c.height;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = isDarkV25() ? '#1a0a2e' : '#FFF0F8';
    ctx.fillRect(0,0,W,H);

    var mon = CODEX_MONSTERS[saved.selected];

    // Title
    ctx.fillStyle = isDarkV25() ? '#FF8EC4' : '#FF5FA2';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('몬스터 도감 분석기', W/2, 28);

    // Monster icon & name
    ctx.font = '36px sans-serif';
    ctx.fillText(mon.icon, 90, 80);
    ctx.fillStyle = isDarkV25() ? '#eee' : '#333';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(mon.name, 130, 72);

    // Grade badge
    var gradeColors = {S:'#FFD700',A:'#FF5FA2',B:'#8B5CF6',C:'#4ECDC4',D:'#999'};
    ctx.fillStyle = gradeColors[mon.grade] || '#999';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText(mon.grade, 130, 102);
    ctx.font = '11px sans-serif';
    ctx.fillStyle = isDarkV25() ? '#aaa' : '#888';
    ctx.fillText('위험등급', 160, 102);

    // Description
    ctx.font = '12px sans-serif';
    ctx.fillStyle = isDarkV25() ? '#bbb' : '#666';
    ctx.fillText(mon.desc, 40, 125);

    // Radar chart - 6 axes
    var cx = 170, cy = 270, radius = 100;
    var stats = [mon.atk, mon.def, mon.spd, mon.mag, mon.hp, mon.spc];

    // Background rings
    for(var ring = 1; ring <= 4; ring++){
      var rr = radius * ring / 4;
      ctx.beginPath();
      for(var ai = 0; ai < 6; ai++){
        var angle = -Math.PI/2 + (Math.PI*2/6) * ai;
        var px = cx + rr * Math.cos(angle);
        var py = cy + rr * Math.sin(angle);
        if(ai === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.strokeStyle = isDarkV25() ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.06)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Axis lines
    for(var ai2 = 0; ai2 < 6; ai2++){
      var angle2 = -Math.PI/2 + (Math.PI*2/6) * ai2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + radius * Math.cos(angle2), cy + radius * Math.sin(angle2));
      ctx.strokeStyle = isDarkV25() ? 'rgba(255,255,255,.1)' : 'rgba(0,0,0,.08)';
      ctx.stroke();
    }

    // Filled radar polygon
    ctx.beginPath();
    for(var ai3 = 0; ai3 < 6; ai3++){
      var angle3 = -Math.PI/2 + (Math.PI*2/6) * ai3;
      var val = stats[ai3] / 100;
      var rx = cx + radius * val * Math.cos(angle3);
      var ry = cy + radius * val * Math.sin(angle3);
      if(ai3 === 0) ctx.moveTo(rx, ry);
      else ctx.lineTo(rx, ry);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(255,95,162,.25)';
    ctx.fill();
    ctx.strokeStyle = '#FF5FA2';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Dots on vertices
    for(var ai4 = 0; ai4 < 6; ai4++){
      var angle4 = -Math.PI/2 + (Math.PI*2/6) * ai4;
      var val4 = stats[ai4] / 100;
      var dx = cx + radius * val4 * Math.cos(angle4);
      var dy = cy + radius * val4 * Math.sin(angle4);
      ctx.beginPath();
      ctx.arc(dx, dy, 4, 0, Math.PI*2);
      ctx.fillStyle = '#FF5FA2';
      ctx.fill();
    }

    // Axis labels
    for(var ai5 = 0; ai5 < 6; ai5++){
      var angle5 = -Math.PI/2 + (Math.PI*2/6) * ai5;
      var lx = cx + (radius + 18) * Math.cos(angle5);
      var ly = cy + (radius + 18) * Math.sin(angle5);
      ctx.fillStyle = isDarkV25() ? '#ccc' : '#555';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(CODEX_AXES[ai5] + ' ' + stats[ai5], lx, ly);
    }
    ctx.textBaseline = 'alphabetic';

    // Monster list on right side
    var listX = 340, listY = 50;
    var listItemH = 27;
    CODEX_MONSTERS.forEach(function(m2, i){
      var iy = listY + i * listItemH;
      if(i === saved.selected){
        ctx.fillStyle = isDarkV25() ? 'rgba(255,95,162,.15)' : 'rgba(255,95,162,.08)';
        ctx.beginPath();
        ctx.roundRect(listX - 4, iy - 14, 270, listItemH - 2, 6);
        ctx.fill();
      }
      ctx.fillStyle = isDarkV25() ? '#eee' : '#333';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(m2.icon, listX, iy);
      ctx.font = '12px sans-serif';
      ctx.fillText(m2.name, listX + 22, iy);

      ctx.fillStyle = gradeColors[m2.grade] || '#999';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(m2.grade, listX + 260, iy);

      // Mini stat bar
      var totalStat = m2.atk + m2.def + m2.spd + m2.mag + m2.hp + m2.spc;
      var barPct = totalStat / 600;
      ctx.fillStyle = isDarkV25() ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.04)';
      ctx.fillRect(listX + 130, iy - 8, 100, 6);
      ctx.fillStyle = gradeColors[m2.grade] || '#999';
      ctx.fillRect(listX + 130, iy - 8, 100 * barPct, 6);
    });

    // Mark scanned
    if(saved.scanned.indexOf(saved.selected) === -1){
      saved.scanned.push(saved.selected);
    }
    v25Save('v25_codex', saved);
  }

  drawCodex();

  var canvas = document.getElementById('v25CodexCanvas');
  if(canvas) canvas.addEventListener('click', function(e){
    var rect = canvas.getBoundingClientRect();
    var scaleX = canvas.width / rect.width;
    var mx = (e.clientX - rect.left) * scaleX;
    var my = (e.clientY - rect.top) * scaleX;
    // Check monster list clicks
    var listX = 340, listY = 50, listItemH = 27;
    for(var i = 0; i < CODEX_MONSTERS.length; i++){
      var iy = listY + i * listItemH;
      if(mx >= listX - 4 && mx <= listX + 270 && my >= iy - 14 && my <= iy + listItemH - 16){
        saved.selected = i;
        sfxV25('codex_switch');
        drawCodex();
        return;
      }
    }
    // Click anywhere else cycles forward
    saved.selected = (saved.selected + 1) % CODEX_MONSTERS.length;
    sfxV25('codex_scan');
    drawCodex();
  });
}


// ============================================================
// 2. XP EFFICIENCY OPTIMIZER (Canvas 600x380)
// ============================================================
var XP_ACTIVITIES = [
  {name:'퀸스트',icon:'📜',xpPerMin:12,time:15,difficulty:'B'},
  {name:'전투',icon:'⚔️',xpPerMin:8,time:5,difficulty:'C'},
  {name:'탐험',icon:'🗺️',xpPerMin:6,time:20,difficulty:'D'},
  {name:'퀴즈',icon:'📝',xpPerMin:15,time:3,difficulty:'A'},
  {name:'대장간',icon:'🔨',xpPerMin:10,time:8,difficulty:'B'},
  {name:'던전',icon:'🏰',xpPerMin:18,time:25,difficulty:'A'},
  {name:'보스',icon:'💀',xpPerMin:25,time:30,difficulty:'S'},
  {name:'콤보',icon:'🔥',xpPerMin:20,time:10,difficulty:'A'},
  {name:'수집',icon:'📦',xpPerMin:5,time:12,difficulty:'D'},
  {name:'일일챌린지',icon:'🎯',xpPerMin:22,time:20,difficulty:'S'}
];

function renderXPOptimizer(){
  var saved = v25Load('v25_xp', {runs:0, bestPath:[]});
  var html = '<div style="text-align:center;margin-bottom:12px"><canvas id="v25XPCanvas" width="600" height="380" style="max-width:100%;border-radius:12px;background:' + (isDarkV25()?'#1a0a2e':'#FFF0F8') + '"></canvas></div>';
  html += '<div style="text-align:center"><button id="v25XPOptimize" style="padding:8px 22px;background:linear-gradient(135deg,#4ECDC4,#2ECC71);color:#fff;border:none;border-radius:14px;font-size:13px;font-weight:700;cursor:pointer">⚡ 최적 경로 분석</button> ';
  html += '<button id="v25XPRandom" style="padding:8px 16px;background:linear-gradient(135deg,#FF5FA2,#B066FF);color:#fff;border:none;border-radius:14px;font-size:12px;font-weight:600;cursor:pointer">🎲 랜덤 효율</button></div>';

  var m = createV25Modal('⚡ 경험치효율최적화기', html);

  function drawXP(){
    var c = document.getElementById('v25XPCanvas');
    if(!c) return;
    var ctx = c.getContext('2d');
    var W = c.width, H = c.height;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = isDarkV25() ? '#1a0a2e' : '#FFF0F8';
    ctx.fillRect(0,0,W,H);

    ctx.fillStyle = isDarkV25() ? '#FF8EC4' : '#FF5FA2';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('경험치 효율 최적화기', W/2, 28);

    // Sort by xpPerMin descending for display
    var sorted = XP_ACTIVITIES.slice().sort(function(a,b){ return b.xpPerMin - a.xpPerMin; });
    var maxXP = 30;
    var barH = 26;
    var startX = 120;
    var startY = 50;
    var barMaxW = W - startX - 60;

    sorted.forEach(function(act, i){
      var y = startY + i * (barH + 6);

      // Label
      ctx.fillStyle = isDarkV25() ? '#ccc' : '#555';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(act.icon + ' ' + act.name, startX - 8, y + barH/2 + 4);

      // Track
      ctx.fillStyle = isDarkV25() ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.04)';
      ctx.beginPath();
      ctx.roundRect(startX, y, barMaxW, barH, 6);
      ctx.fill();

      // Fill bar
      var fillW = (act.xpPerMin / maxXP) * barMaxW;
      var grade = act.xpPerMin >= 20 ? 'S' : act.xpPerMin >= 15 ? 'A' : act.xpPerMin >= 10 ? 'B' : act.xpPerMin >= 6 ? 'C' : 'D';
      var gc = {S:'#FFD700',A:'#FF5FA2',B:'#8B5CF6',C:'#4ECDC4',D:'#999'};
      var grad = ctx.createLinearGradient(startX, y, startX + fillW, y);
      grad.addColorStop(0, gc[grade]);
      grad.addColorStop(1, gc[grade] + '88');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(startX, y, fillW, barH, 6);
      ctx.fill();

      // Value text
      ctx.fillStyle = fillW > 60 ? '#fff' : (isDarkV25() ? '#ccc' : '#555');
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(act.xpPerMin + ' XP/min', startX + Math.max(fillW - 70, 4), y + barH/2 + 4);

      // Grade badge
      ctx.fillStyle = gc[grade];
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(grade, startX + barMaxW + 10, y + barH/2 + 5);
    });

    // Optimal path recommendation box
    var boxY = startY + XP_ACTIVITIES.length * (barH + 6) + 8;
    ctx.fillStyle = isDarkV25() ? 'rgba(255,95,162,.1)' : 'rgba(255,95,162,.05)';
    ctx.beginPath();
    ctx.roundRect(20, boxY, W - 40, 40, 10);
    ctx.fill();
    ctx.strokeStyle = '#FF5FA2';
    ctx.lineWidth = 1;
    ctx.stroke();

    var top3 = sorted.slice(0, 3);
    ctx.fillStyle = isDarkV25() ? '#FF8EC4' : '#FF5FA2';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('최적 레벨링 경로: ' + top3.map(function(a){ return a.icon + a.name; }).join(' → '), W/2, boxY + 16);
    ctx.fillStyle = isDarkV25() ? '#aaa' : '#888';
    ctx.font = '11px sans-serif';
    ctx.fillText('총 효율: ' + top3.reduce(function(s,a){ return s + a.xpPerMin; }, 0) + ' XP/min | 분석횟수: ' + saved.runs, W/2, boxY + 32);

    v25Save('v25_xp', saved);
  }

  drawXP();

  setTimeout(function(){
    var optBtn = document.getElementById('v25XPOptimize');
    var rndBtn = document.getElementById('v25XPRandom');
    if(optBtn) optBtn.addEventListener('click', function(){
      sfxV25('xp_optimize');
      saved.runs++;
      drawXP();
      showToastV25('⚡ XP 최적 경로 분석 완료! (분석 #' + saved.runs + ')');
    });
    if(rndBtn) rndBtn.addEventListener('click', function(){
      sfxV25('xp_calc');
      XP_ACTIVITIES.forEach(function(a){ a.xpPerMin = Math.floor(Math.random() * 25) + 3; });
      saved.runs++;
      drawXP();
    });
  }, 100);
}


// ============================================================
// 3. BOSS ATTACK PATTERN ANALYZER (Canvas 620x400)
// ============================================================
var BOSS_DATA = [
  {name:'그림자기사',icon:'🗡️',attacks:[{t:0,d:2,name:'암흑베기'},{t:3,d:1,name:'그림자돌진'},{t:5,d:3,name:'암흡폭발'},{t:9,d:1,name:'텔레포트'}],weak:'빛',resist:'어둡'},
  {name:'얼음여왕',icon:'❄️',attacks:[{t:0,d:3,name:'빙하폭풍'},{t:4,d:2,name:'얼음창'},{t:7,d:1,name:'동결슠피'},{t:9,d:2,name:'비전빔리자드'}],weak:'불',resist:'얼음'},
  {name:'화염드래곤',icon:'🔥',attacks:[{t:0,d:1,name:'화염브레스'},{t:2,d:2,name:'꼬리휘두르기'},{t:5,d:3,name:'메테오폭격'},{t:9,d:2,name:'분화'}],weak:'물',resist:'불'},
  {name:'독거미여왕',icon:'🕷️',attacks:[{t:0,d:1,name:'독침'},{t:2,d:2,name:'거미줄트랩'},{t:5,d:1,name:'비독안개'},{t:7,d:3,name:'여왕의여름'}],weak:'불',resist:'독'},
  {name:'번개피닉스',icon:'⚡',attacks:[{t:0,d:2,name:'전기폭풍'},{t:3,d:1,name:'급강하'},{t:5,d:2,name:'섬광탄'},{t:8,d:2,name:'부활전류'}],weak:'땅',resist:'전기'},
  {name:'암흡마법사',icon:'🧙‍♂️',attacks:[{t:0,d:1,name:'저주탄'},{t:2,d:3,name:'암흡결계'},{t:6,d:2,name:'영혼흡수'},{t:9,d:1,name:'차원분리'}],weak:'성수',resist:'암흡'},
  {name:'대해적',icon:'🏴‍☠️',attacks:[{t:0,d:2,name:'대포세례'},{t:3,d:1,name:'돌격럼'},{t:5,d:2,name:'해적단함비령비'},{t:8,d:2,name:'크라켄소환'}],weak:'번개',resist:'물'},
  {name:'최종보스',icon:'👑',attacks:[{t:0,d:2,name:'전체공격'},{t:2,d:1,name:'시공정지'},{t:4,d:3,name:'차원붕괴'},{t:8,d:3,name:'궁귉의파멸'}],weak:'사랑',resist:'모든속성'}
];

function renderBossPattern(){
  var saved = v25Load('v25_boss', {selected:0, analyzed:[]});
  var html = '<div style="text-align:center;margin-bottom:12px"><canvas id="v25BossCanvas" width="620" height="400" style="max-width:100%;border-radius:12px;background:' + (isDarkV25()?'#1a0a2e':'#FFF0F8') + '"></canvas></div>';
  html += '<div style="text-align:center;font-size:12px;color:' + (isDarkV25()?'#aaa':'#888') + '">보스 아이콘 클릭으로 선택 | 분석: ' + saved.analyzed.length + '/' + BOSS_DATA.length + '</div>';

  var m = createV25Modal('🗡️ 보스패턴분석기', html);

  function drawBoss(){
    var c = document.getElementById('v25BossCanvas');
    if(!c) return;
    var ctx = c.getContext('2d');
    var W = c.width, H = c.height;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = isDarkV25() ? '#1a0a2e' : '#FFF0F8';
    ctx.fillRect(0,0,W,H);

    var boss = BOSS_DATA[saved.selected];

    ctx.fillStyle = isDarkV25() ? '#FF8EC4' : '#FF5FA2';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('보스 공격 패턴 분석기', W/2, 28);

    // Boss selector row
    var bossRowY = 46;
    var bossItemW = (W - 40) / BOSS_DATA.length;
    BOSS_DATA.forEach(function(b, i){
      var bx = 20 + i * bossItemW;
      if(i === saved.selected){
        ctx.fillStyle = isDarkV25() ? 'rgba(255,95,162,.2)' : 'rgba(255,95,162,.1)';
        ctx.beginPath();
        ctx.roundRect(bx, bossRowY, bossItemW - 4, 36, 6);
        ctx.fill();
        ctx.strokeStyle = '#FF5FA2';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      ctx.fillStyle = isDarkV25() ? '#eee' : '#333';
      ctx.font = '18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(b.icon, bx + bossItemW/2 - 2, bossRowY + 18);
      ctx.font = '8px sans-serif';
      ctx.fillStyle = isDarkV25() ? '#aaa' : '#888';
      ctx.fillText(b.name, bx + bossItemW/2 - 2, bossRowY + 32);
    });

    // Attack timeline
    var timelineY = 100;
    var timelineH = 140;
    var timelineW = W - 80;
    var timelineX = 40;
    var totalTime = 12;

    ctx.fillStyle = isDarkV25() ? '#eee' : '#333';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(boss.icon + ' ' + boss.name + ' 공격 타임라인', timelineX, timelineY - 8);

    // Time grid
    for(var t = 0; t <= totalTime; t++){
      var tx = timelineX + (t / totalTime) * timelineW;
      ctx.strokeStyle = isDarkV25() ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.06)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(tx, timelineY);
      ctx.lineTo(tx, timelineY + timelineH);
      ctx.stroke();
      ctx.fillStyle = isDarkV25() ? '#888' : '#aaa';
      ctx.font = '9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(t + 's', tx, timelineY + timelineH + 14);
    }

    // Safe zones (gaps between attacks) - highlight green
    var attackIntervals = boss.attacks.map(function(a){ return {start:a.t, end:a.t+a.d}; });
    for(var sec = 0; sec < totalTime; sec++){
      var isSafe = true;
      for(var ai = 0; ai < attackIntervals.length; ai++){
        if(sec >= attackIntervals[ai].start && sec < attackIntervals[ai].end){ isSafe = false; break; }
      }
      if(isSafe){
        var sx = timelineX + (sec / totalTime) * timelineW;
        var sw = timelineW / totalTime;
        ctx.fillStyle = isDarkV25() ? 'rgba(78,205,196,.12)' : 'rgba(78,205,196,.08)';
        ctx.fillRect(sx, timelineY, sw, timelineH);
      }
    }

    // Attack bars
    var barColors = ['#FF5FA2','#B066FF','#FF6B6B','#FFD700'];
    boss.attacks.forEach(function(atk, i){
      var ax = timelineX + (atk.t / totalTime) * timelineW;
      var aw = (atk.d / totalTime) * timelineW;
      var ay = timelineY + 10 + i * 30;
      var barH2 = 22;

      ctx.fillStyle = barColors[i % barColors.length];
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.roundRect(ax, ay, aw, barH2, 4);
      ctx.fill();
      ctx.globalAlpha = 1.0;

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'left';
      if(aw > 40) ctx.fillText(atk.name, ax + 4, ay + 15);
    });

    // Legend
    ctx.fillStyle = isDarkV25() ? '#aaa' : '#888';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('🟢 안전구간   🟥 공격구간', timelineX, timelineY + timelineH + 30);

    // Weakness / Resistance bar chart
    var infoY = 290;
    ctx.fillStyle = isDarkV25() ? '#FF8EC4' : '#FF5FA2';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('약점 / 내성 분석', 40, infoY);

    // Weakness bar
    ctx.fillStyle = isDarkV25() ? 'rgba(78,205,196,.15)' : 'rgba(78,205,196,.1)';
    ctx.beginPath();
    ctx.roundRect(40, infoY + 10, 250, 30, 8);
    ctx.fill();
    ctx.fillStyle = '#4ECDC4';
    ctx.beginPath();
    ctx.roundRect(40, infoY + 10, 200, 30, 8);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('약점: ' + boss.weak + ' (x2.0 데미지)', 140, infoY + 30);

    // Resistance bar
    ctx.fillStyle = isDarkV25() ? 'rgba(255,107,107,.15)' : 'rgba(255,107,107,.1)';
    ctx.beginPath();
    ctx.roundRect(320, infoY + 10, 260, 30, 8);
    ctx.fill();
    ctx.fillStyle = '#FF6B6B';
    ctx.beginPath();
    ctx.roundRect(320, infoY + 10, 180, 30, 8);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('내성: ' + boss.resist + ' (x0.5 데미지)', 450, infoY + 30);

    // Tips
    ctx.fillStyle = isDarkV25() ? '#bbb' : '#666';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('💡 팁: ' + boss.weak + ' 속성으로 공격하고, 안전구간에서 회복하세요!', W/2, infoY + 70);

    if(saved.analyzed.indexOf(saved.selected) === -1) saved.analyzed.push(saved.selected);
    v25Save('v25_boss', saved);
  }

  drawBoss();

  var canvas = document.getElementById('v25BossCanvas');
  if(canvas) canvas.addEventListener('click', function(e){
    var rect = canvas.getBoundingClientRect();
    var scaleX = canvas.width / rect.width;
    var mx = (e.clientX - rect.left) * scaleX;
    var my = (e.clientY - rect.top) * scaleX;

    var bossRowY = 46;
    var bossItemW = (canvas.width - 40) / BOSS_DATA.length;
    if(my >= bossRowY && my <= bossRowY + 36){
      var idx = Math.floor((mx - 20) / bossItemW);
      if(idx >= 0 && idx < BOSS_DATA.length){
        saved.selected = idx;
        sfxV25('boss_analyze');
        drawBoss();
        return;
      }
    }
    // Click elsewhere cycles
    saved.selected = (saved.selected + 1) % BOSS_DATA.length;
    sfxV25('boss_weak');
    drawBoss();
  });
}


// ============================================================
// 4. ITEM DROP RATE SIMULATOR (Canvas 600x380)
// ============================================================
var DROP_ITEMS = [
  {name:'체력포션',icon:'❤️'},
  {name:'마나포션',icon:'💙'},
  {name:'철광석',icon:'⚪'},
  {name:'루비',icon:'🔴'},
  {name:'사파이어',icon:'🔵'},
  {name:'에메랄드',icon:'🟢'},
  {name:'다이아몬드',icon:'💠'},
  {name:'봉황깃',icon:'🟡'},
  {name:'용의비늘',icon:'🟣'},
  {name:'신화석',icon:'⭐'}
];
var DROP_GRADES = ['일반','고급','희귀','전설','신화'];
var DROP_RATES = [
  [50,30,15,4,1],[55,28,12,4,1],[60,25,10,4,1],[45,30,17,6,2],[40,32,18,7,3],
  [52,28,14,5,1],[48,30,15,5,2],[58,26,11,4,1],[42,28,19,8,3],[35,30,22,10,3]
];

function renderDropSimulator(){
  var saved = v25Load('v25_drop', {simCount:0, drops:DROP_ITEMS.map(function(){return [0,0,0,0,0];}), lastDrop:null});
  var html = '<div style="text-align:center;margin-bottom:12px"><canvas id="v25DropCanvas" width="600" height="380" style="max-width:100%;border-radius:12px;background:' + (isDarkV25()?'#1a0a2e':'#FFF0F8') + '"></canvas></div>';
  html += '<div style="text-align:center"><button id="v25DropSim1" style="padding:8px 22px;background:linear-gradient(135deg,#FF5FA2,#B066FF);color:#fff;border:none;border-radius:14px;font-size:13px;font-weight:700;cursor:pointer">🎲 1회 시뮬</button> ';
  html += '<button id="v25DropSim10" style="padding:8px 16px;background:linear-gradient(135deg,#4ECDC4,#2ECC71);color:#fff;border:none;border-radius:14px;font-size:12px;font-weight:600;cursor:pointer">🎰 10회 시뮬</button> ';
  html += '<button id="v25DropReset" style="padding:8px 16px;background:rgba(0,0,0,.1);color:' + (isDarkV25()?'#ccc':'#666') + ';border:none;border-radius:14px;font-size:12px;cursor:pointer">초기화</button></div>';

  var m = createV25Modal('🎲 아이템드롭확률시뮬', html);

  function simulateDrop(){
    var itemIdx = Math.floor(Math.random() * DROP_ITEMS.length);
    var rates = DROP_RATES[itemIdx];
    var roll = Math.random() * 100;
    var cumul = 0;
    var gradeIdx = 0;
    for(var g = 0; g < rates.length; g++){
      cumul += rates[g];
      if(roll < cumul){ gradeIdx = g; break; }
    }
    saved.drops[itemIdx][gradeIdx]++;
    saved.simCount++;
    saved.lastDrop = {item:itemIdx, grade:gradeIdx};
    return {item:itemIdx, grade:gradeIdx};
  }

  function drawDrop(){
    var c = document.getElementById('v25DropCanvas');
    if(!c) return;
    var ctx = c.getContext('2d');
    var W = c.width, H = c.height;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = isDarkV25() ? '#1a0a2e' : '#FFF0F8';
    ctx.fillRect(0,0,W,H);

    ctx.fillStyle = isDarkV25() ? '#FF8EC4' : '#FF5FA2';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('아이템 드롭 확률 시뮬레이터', W/2, 28);

    // Heatmap: 10 items x 5 grades
    var cellW = 46;
    var cellH = 24;
    var startX = 90;
    var startY = 62;
    var gradeColors = ['#4ECDC4','#8B5CF6','#FF5FA2','#FFD700','#FF6B6B'];

    // Column headers (grades)
    DROP_GRADES.forEach(function(gr, gi){
      ctx.fillStyle = gradeColors[gi];
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(gr, startX + gi * cellW + cellW/2, startY - 6);
    });

    // Row headers and heatmap cells
    DROP_ITEMS.forEach(function(item, ii){
      var y = startY + ii * cellH;

      ctx.fillStyle = isDarkV25() ? '#ccc' : '#555';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(item.icon + item.name, startX - 6, y + cellH/2 + 4);

      DROP_GRADES.forEach(function(gr, gi){
        var x = startX + gi * cellW;
        var rate = DROP_RATES[ii][gi];

        // Background intensity based on rate
        var intensity = Math.min(rate / 60, 1);
        var r, g2, b;
        if(gi >= 3){
          r = 255; g2 = Math.round(215 - intensity * 150); b = 0;
        } else {
          r = Math.round(gradeColors[gi].length > 0 ? intensity * 180 : 100);
          g2 = Math.round(100 + intensity * 100);
          b = Math.round(150 + intensity * 60);
        }
        ctx.fillStyle = 'rgba(' + (gi===0?78:gi===1?139:gi===2?255:gi===3?255:255) + ',' + (gi===0?205:gi===1?92:gi===2?95:gi===3?215:107) + ',' + (gi===0?196:gi===1?246:gi===2?162:gi===3?0:107) + ',' + (0.15 + intensity * 0.6) + ')';
        ctx.fillRect(x + 1, y + 1, cellW - 2, cellH - 2);

        // Show rate
        ctx.fillStyle = intensity > 0.4 ? '#fff' : (isDarkV25() ? '#ddd' : '#444');
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(rate + '%', x + cellW/2, y + cellH/2 + 4);

        // Highlight drop counts
        var dropCount = saved.drops[ii][gi];
        if(dropCount > 0){
          ctx.fillStyle = '#FFD700';
          ctx.font = 'bold 8px sans-serif';
          ctx.fillText('x' + dropCount, x + cellW - 12, y + 10);
        }
      });
    });

    // Last drop highlight
    if(saved.lastDrop !== null){
      var ldx = startX + saved.lastDrop.grade * cellW;
      var ldy = startY + saved.lastDrop.item * cellH;
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 2;
      ctx.strokeRect(ldx, ldy, cellW, cellH);
    }

    // Cumulative stats bar chart on right side
    var statX = startX + 5 * cellW + 30;
    var statY = startY;
    ctx.fillStyle = isDarkV25() ? '#FF8EC4' : '#FF5FA2';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('드롭 통계', statX, statY - 6);

    var totalByGrade = [0,0,0,0,0];
    saved.drops.forEach(function(itemDrops){
      itemDrops.forEach(function(cnt, gi){ totalByGrade[gi] += cnt; });
    });
    var maxDrop = Math.max.apply(null, totalByGrade.concat([1]));

    DROP_GRADES.forEach(function(gr, gi){
      var by = statY + gi * 44;
      ctx.fillStyle = isDarkV25() ? '#aaa' : '#888';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(gr, statX, by + 12);

      var barW = 100;
      var barH2 = 14;
      ctx.fillStyle = isDarkV25() ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.04)';
      ctx.beginPath();
      ctx.roundRect(statX, by + 16, barW, barH2, 4);
      ctx.fill();

      var fw = (totalByGrade[gi] / maxDrop) * barW;
      ctx.fillStyle = gradeColors[gi];
      ctx.beginPath();
      ctx.roundRect(statX, by + 16, Math.max(fw, 0), barH2, 4);
      ctx.fill();

      ctx.fillStyle = isDarkV25() ? '#ccc' : '#555';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText(totalByGrade[gi] + '', statX + barW + 6, by + 28);
    });

    // Total sim count
    ctx.fillStyle = isDarkV25() ? '#aaa' : '#888';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('총 시뮬: ' + saved.simCount + '회', W/2, H - 10);

    v25Save('v25_drop', saved);
  }

  drawDrop();

  setTimeout(function(){
    var sim1 = document.getElementById('v25DropSim1');
    var sim10 = document.getElementById('v25DropSim10');
    var resetBtn = document.getElementById('v25DropReset');
    if(sim1) sim1.addEventListener('click', function(){
      var result = simulateDrop();
      sfxV25(result.grade >= 3 ? 'drop_rare' : 'drop_sim');
      drawDrop();
      showToastV25('🎲 ' + DROP_ITEMS[result.item].icon + DROP_ITEMS[result.item].name + ' [' + DROP_GRADES[result.grade] + '] 드롭!');
    });
    if(sim10) sim10.addEventListener('click', function(){
      var rareCount = 0;
      for(var s = 0; s < 10; s++){
        var r = simulateDrop();
        if(r.grade >= 3) rareCount++;
      }
      sfxV25(rareCount > 0 ? 'drop_rare' : 'drop_sim');
      drawDrop();
      showToastV25('🎰 10회 시뮬 완료! 전설+ 드롭: ' + rareCount + '회');
    });
    if(resetBtn) resetBtn.addEventListener('click', function(){
      saved = {simCount:0, drops:DROP_ITEMS.map(function(){return [0,0,0,0,0];}), lastDrop:null};
      drawDrop();
    });
  }, 100);
}


// ============================================================
// 5. PARTY BUILDER OPTIMIZER (Canvas 620x400)
// ============================================================
var PARTY_CHARS = [
  {name:'로미',icon:'👧',atk:60,def:50,spd:55,mag:40,hp:65,spc:45,role:'리더'},
  {name:'하츄핑',icon:'💖',atk:50,def:45,spd:60,mag:70,hp:55,spc:80,role:'서포터'},
  {name:'바로핑',icon:'⚡',atk:75,def:60,spd:50,mag:30,hp:70,spc:35,role:'탱커'},
  {name:'해핑',icon:'😊',atk:40,def:35,spd:70,mag:55,hp:45,spc:65,role:'힐러'},
  {name:'차차핑',icon:'💃',atk:55,def:40,spd:80,mag:50,hp:40,spc:55,role:'스피드스터'},
  {name:'라라핑',icon:'🎵',atk:35,def:30,spd:45,mag:80,hp:35,spc:70,role:'마법사'},
  {name:'아자핑',icon:'🔥',atk:80,def:55,spd:65,mag:35,hp:60,spc:30,role:'어태커'},
  {name:'무루핑',icon:'💜',atk:45,def:75,spd:30,mag:65,hp:80,spc:60,role:'방어형'}
];

var PARTY_SYNERGY = {
  '로미+하츄핑':20,'로미+바로핑':15,'로미+해핑':18,
  '하츄핑+해핑':22,'하츄핑+라라핑':25,'바로핑+아자핑':20,
  '차차핑+라라핑':18,'해핑+무루핑':15,'아자핑+무루핑':12,
  '바로핑+무루핑':16,'로미+아자핑':14,'하츄핑+무루핑':19,
  '차차핑+아자핑':17,'라라핑+무루핑':21,'해핑+라라핑':16,
  '로미+차차핑':13,'바로핑+해핑':11,'하츄핑+차차핑':14,
  '로미+라라핑':12,'바로핑+차차핑':10,'하츄핑+아자핑':16,
  '차차핑+해핑':15,'하츄핑+바로핑':13,'로미+무루핑':17,
  '바로핑+라라핑':9,'아자핑+라라핑':11,'차차핑+무루핑':13,
  '아자핑+해핑':14
};

function getSynergy(n1, n2){
  return PARTY_SYNERGY[n1+'+'+n2] || PARTY_SYNERGY[n2+'+'+n1] || 8;
}

function renderPartyBuilder(){
  var saved = v25Load('v25_party', {party:[0,1,3,5], builds:0});
  var html = '<div style="text-align:center;margin-bottom:12px"><canvas id="v25PartyCanvas" width="620" height="400" style="max-width:100%;border-radius:12px;background:' + (isDarkV25()?'#1a0a2e':'#FFF0F8') + '"></canvas></div>';
  html += '<div style="text-align:center"><button id="v25PartyAuto" style="padding:8px 22px;background:linear-gradient(135deg,#FF5FA2,#B066FF);color:#fff;border:none;border-radius:14px;font-size:13px;font-weight:700;cursor:pointer">✨ 최적 파티 추천</button> ';
  html += '<button id="v25PartyRandom" style="padding:8px 16px;background:linear-gradient(135deg,#4ECDC4,#2ECC71);color:#fff;border:none;border-radius:14px;font-size:12px;font-weight:600;cursor:pointer">🎲 랜덤 파티</button></div>';

  var m = createV25Modal('🤝 파티빌더최적화', html);

  function calcPartyScore(indices){
    var totalSyn = 0;
    var count = 0;
    for(var i = 0; i < indices.length; i++){
      for(var j = i+1; j < indices.length; j++){
        totalSyn += getSynergy(PARTY_CHARS[indices[i]].name, PARTY_CHARS[indices[j]].name);
        count++;
      }
    }
    return count > 0 ? Math.round(totalSyn / count) : 0;
  }

  function drawParty(){
    var c = document.getElementById('v25PartyCanvas');
    if(!c) return;
    var ctx = c.getContext('2d');
    var W = c.width, H = c.height;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = isDarkV25() ? '#1a0a2e' : '#FFF0F8';
    ctx.fillRect(0,0,W,H);

    ctx.fillStyle = isDarkV25() ? '#FF8EC4' : '#FF5FA2';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('파티 빌더 최적화', W/2, 28);

    // Character roster (selectable)
    var rosterY = 48;
    var rosterItemW = (W - 40) / PARTY_CHARS.length;
    PARTY_CHARS.forEach(function(ch, i){
      var rx = 20 + i * rosterItemW;
      var inParty = saved.party.indexOf(i) !== -1;

      if(inParty){
        ctx.fillStyle = isDarkV25() ? 'rgba(255,95,162,.2)' : 'rgba(255,95,162,.1)';
        ctx.beginPath();
        ctx.roundRect(rx, rosterY, rosterItemW - 4, 52, 8);
        ctx.fill();
        ctx.strokeStyle = '#FF5FA2';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else {
        ctx.fillStyle = isDarkV25() ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.02)';
        ctx.beginPath();
        ctx.roundRect(rx, rosterY, rosterItemW - 4, 52, 8);
        ctx.fill();
      }

      ctx.fillStyle = isDarkV25() ? '#eee' : '#333';
      ctx.font = '22px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(ch.icon, rx + rosterItemW/2 - 2, rosterY + 24);
      ctx.font = '10px sans-serif';
      ctx.fillStyle = isDarkV25() ? '#aaa' : '#888';
      ctx.fillText(ch.name, rx + rosterItemW/2 - 2, rosterY + 40);
      ctx.font = '8px sans-serif';
      ctx.fillStyle = inParty ? '#FF5FA2' : (isDarkV25() ? '#666' : '#bbb');
      ctx.fillText(ch.role, rx + rosterItemW/2 - 2, rosterY + 50);
    });

    // Synergy score
    var score = calcPartyScore(saved.party);
    var grade = score >= 20 ? 'S' : score >= 16 ? 'A' : score >= 12 ? 'B' : score >= 8 ? 'C' : 'D';
    var gradeColors = {S:'#FFD700',A:'#FF5FA2',B:'#8B5CF6',C:'#4ECDC4',D:'#999'};

    ctx.fillStyle = gradeColors[grade];
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(grade, 80, 140);
    ctx.fillStyle = isDarkV25() ? '#aaa' : '#888';
    ctx.font = '11px sans-serif';
    ctx.fillText('시너지 ' + score + '점', 80, 158);
    ctx.fillText('빌드 #' + saved.builds, 80, 172);

    // Team Radar chart
    var cx = 220, cy = 220, radius = 80;
    var teamStats = [0,0,0,0,0,0];
    saved.party.forEach(function(pi){
      var ch = PARTY_CHARS[pi];
      teamStats[0] += ch.atk;
      teamStats[1] += ch.def;
      teamStats[2] += ch.spd;
      teamStats[3] += ch.mag;
      teamStats[4] += ch.hp;
      teamStats[5] += ch.spc;
    });
    var maxTeamStat = saved.party.length * 100;
    var radarAxes = ['공격','방어','속도','마법','체력','특수'];

    // Background rings
    for(var ring = 1; ring <= 4; ring++){
      var rr = radius * ring / 4;
      ctx.beginPath();
      for(var ai = 0; ai < 6; ai++){
        var angle = -Math.PI/2 + (Math.PI*2/6) * ai;
        var px = cx + rr * Math.cos(angle);
        var py = cy + rr * Math.sin(angle);
        if(ai === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.strokeStyle = isDarkV25() ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.06)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Axis lines
    for(var ai2 = 0; ai2 < 6; ai2++){
      var angle2 = -Math.PI/2 + (Math.PI*2/6) * ai2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + radius * Math.cos(angle2), cy + radius * Math.sin(angle2));
      ctx.strokeStyle = isDarkV25() ? 'rgba(255,255,255,.1)' : 'rgba(0,0,0,.08)';
      ctx.stroke();
    }

    // Filled radar
    ctx.beginPath();
    for(var ai3 = 0; ai3 < 6; ai3++){
      var angle3 = -Math.PI/2 + (Math.PI*2/6) * ai3;
      var val = teamStats[ai3] / maxTeamStat;
      var rx2 = cx + radius * val * Math.cos(angle3);
      var ry2 = cy + radius * val * Math.sin(angle3);
      if(ai3 === 0) ctx.moveTo(rx2, ry2);
      else ctx.lineTo(rx2, ry2);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(176,102,255,.25)';
    ctx.fill();
    ctx.strokeStyle = '#B066FF';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Dots
    for(var ai4 = 0; ai4 < 6; ai4++){
      var angle4 = -Math.PI/2 + (Math.PI*2/6) * ai4;
      var val4 = teamStats[ai4] / maxTeamStat;
      ctx.beginPath();
      ctx.arc(cx + radius * val4 * Math.cos(angle4), cy + radius * val4 * Math.sin(angle4), 4, 0, Math.PI*2);
      ctx.fillStyle = '#B066FF';
      ctx.fill();
    }

    // Axis labels
    for(var ai5 = 0; ai5 < 6; ai5++){
      var angle5 = -Math.PI/2 + (Math.PI*2/6) * ai5;
      var lx = cx + (radius + 18) * Math.cos(angle5);
      var ly = cy + (radius + 18) * Math.sin(angle5);
      ctx.fillStyle = isDarkV25() ? '#ccc' : '#555';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(radarAxes[ai5] + ' ' + teamStats[ai5], lx, ly);
    }
    ctx.textBaseline = 'alphabetic';

    // Party member detail cards on right
    var cardX = 360, cardY = 115;
    saved.party.forEach(function(pi, idx){
      var ch = PARTY_CHARS[pi];
      var cy2 = cardY + idx * 68;

      ctx.fillStyle = isDarkV25() ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.03)';
      ctx.beginPath();
      ctx.roundRect(cardX, cy2, 240, 60, 10);
      ctx.fill();

      ctx.fillStyle = isDarkV25() ? '#eee' : '#333';
      ctx.font = '20px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(ch.icon, cardX + 10, cy2 + 28);

      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(ch.name, cardX + 38, cy2 + 18);

      ctx.fillStyle = '#FF5FA2';
      ctx.font = '10px sans-serif';
      ctx.fillText(ch.role, cardX + 38, cy2 + 32);

      // Mini stats
      ctx.fillStyle = isDarkV25() ? '#aaa' : '#888';
      ctx.font = '9px sans-serif';
      ctx.fillText('공' + ch.atk + ' 방' + ch.def + ' 속' + ch.spd + ' 마' + ch.mag + ' HP' + ch.hp, cardX + 38, cy2 + 48);
    });

    v25Save('v25_party', saved);
  }

  drawParty();

  // Click on roster to toggle party members
  var canvas = document.getElementById('v25PartyCanvas');
  if(canvas) canvas.addEventListener('click', function(e){
    var rect = canvas.getBoundingClientRect();
    var scaleX = canvas.width / rect.width;
    var mx = (e.clientX - rect.left) * scaleX;
    var my = (e.clientY - rect.top) * scaleX;

    var rosterY = 48;
    var rosterItemW = (canvas.width - 40) / PARTY_CHARS.length;
    if(my >= rosterY && my <= rosterY + 52){
      var idx = Math.floor((mx - 20) / rosterItemW);
      if(idx >= 0 && idx < PARTY_CHARS.length){
        var pos = saved.party.indexOf(idx);
        if(pos !== -1){
          if(saved.party.length > 1){
            saved.party.splice(pos, 1);
            sfxV25('party_select');
          }
        } else if(saved.party.length < 4){
          saved.party.push(idx);
          sfxV25('party_synergy');
        } else {
          // Replace last
          saved.party[3] = idx;
          sfxV25('party_select');
        }
        drawParty();
      }
    }
  });

  setTimeout(function(){
    var autoBtn = document.getElementById('v25PartyAuto');
    var rndBtn = document.getElementById('v25PartyRandom');
    if(autoBtn) autoBtn.addEventListener('click', function(){
      sfxV25('party_synergy');
      // Find best party of 4 by brute force
      var bestScore = -1;
      var bestParty = [0,1,2,3];
      for(var a = 0; a < 5; a++){
        for(var b = a+1; b < 6; b++){
          for(var cc = b+1; cc < 7; cc++){
            for(var d = cc+1; d < 8; d++){
              var sc = calcPartyScore([a,b,cc,d]);
              if(sc > bestScore){ bestScore = sc; bestParty = [a,b,cc,d]; }
            }
          }
        }
      }
      saved.party = bestParty;
      saved.builds++;
      drawParty();
      showToastV25('✨ 최적 파티 추천: ' + bestParty.map(function(i){ return PARTY_CHARS[i].icon; }).join('') + ' (시너지 ' + bestScore + ')');
    });
    if(rndBtn) rndBtn.addEventListener('click', function(){
      sfxV25('party_select');
      var indices = [];
      while(indices.length < 4){
        var r = Math.floor(Math.random() * PARTY_CHARS.length);
        if(indices.indexOf(r) === -1) indices.push(r);
      }
      saved.party = indices;
      saved.builds++;
      drawParty();
    });
  }, 100);
}


// ============================================================
// 6. STAGE CLEAR HEATMAP (Canvas 620x380)
// ============================================================
var STAGE_WORLDS = ['풀발월드','얼음월드','화염월드','암흡월드','별빛월드'];
var STAGE_COUNT = 8;

function renderStageHeatmap(){
  var saved = v25Load('v25_stages', {
    data: STAGE_WORLDS.map(function(){
      return Array.from({length:STAGE_COUNT}, function(){
        return {time:Math.floor(Math.random()*180)+30, stars:Math.floor(Math.random()*4), attempts:Math.floor(Math.random()*10)+1};
      });
    }),
    selectedWorld: -1,
    selectedStage: -1
  });

  var html = '<div style="text-align:center;margin-bottom:12px"><canvas id="v25StageCanvas" width="620" height="380" style="max-width:100%;border-radius:12px;background:' + (isDarkV25()?'#1a0a2e':'#FFF0F8') + '"></canvas></div>';
  html += '<div style="text-align:center"><button id="v25StageRegen" style="padding:8px 22px;background:linear-gradient(135deg,#4ECDC4,#2ECC71);color:#fff;border:none;border-radius:14px;font-size:13px;font-weight:700;cursor:pointer">🎲 데이터 재생성</button></div>';

  var m = createV25Modal('🗺️ 스테이지클리어히트맵', html);

  function drawStage(){
    var c = document.getElementById('v25StageCanvas');
    if(!c) return;
    var ctx = c.getContext('2d');
    var W = c.width, H = c.height;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = isDarkV25() ? '#1a0a2e' : '#FFF0F8';
    ctx.fillRect(0,0,W,H);

    ctx.fillStyle = isDarkV25() ? '#FF8EC4' : '#FF5FA2';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('스테이지 클리어 히트맵', W/2, 28);

    // Heatmap grid: 5 worlds x 8 stages
    var cellW = 58;
    var cellH = 42;
    var startX = 100;
    var startY = 60;

    // Column headers
    for(var s = 0; s < STAGE_COUNT; s++){
      ctx.fillStyle = isDarkV25() ? '#aaa' : '#888';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Stage ' + (s+1), startX + s * cellW + cellW/2, startY - 6);
    }

    // Rows
    STAGE_WORLDS.forEach(function(world, wi){
      var y = startY + wi * cellH;

      // Row label
      ctx.fillStyle = isDarkV25() ? '#ccc' : '#555';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(world, startX - 8, y + cellH/2 + 4);

      for(var si = 0; si < STAGE_COUNT; si++){
        var x = startX + si * cellW;
        var stage = saved.data[wi][si];

        // Color based on stars (0-3)
        var colors = ['rgba(153,153,153,.3)','rgba(78,205,196,.5)','rgba(139,92,246,.5)','rgba(255,95,162,.6)'];
        ctx.fillStyle = colors[Math.min(stage.stars, 3)];
        ctx.beginPath();
        ctx.roundRect(x + 1, y + 1, cellW - 2, cellH - 2, 4);
        ctx.fill();

        // Selected highlight
        if(saved.selectedWorld === wi && saved.selectedStage === si){
          ctx.strokeStyle = '#FFD700';
          ctx.lineWidth = 2.5;
          ctx.stroke();
        }

        // Stars display
        var starStr = '';
        for(var st = 0; st < 3; st++) starStr += st < stage.stars ? '★' : '☆';
        ctx.fillStyle = stage.stars >= 3 ? '#FFD700' : (isDarkV25() ? '#ddd' : '#444');
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(starStr, x + cellW/2, y + cellH/2 - 2);

        // Time
        var min = Math.floor(stage.time / 60);
        var sec = stage.time % 60;
        ctx.fillStyle = isDarkV25() ? '#bbb' : '#666';
        ctx.font = '9px sans-serif';
        ctx.fillText(min + ':' + (sec < 10 ? '0' : '') + sec, x + cellW/2, y + cellH/2 + 12);
      }
    });

    // Legend
    var legY = startY + STAGE_WORLDS.length * cellH + 16;
    var legLabels = ['미클리어','★','★★','★★★'];
    var legColors = ['rgba(153,153,153,.3)','rgba(78,205,196,.5)','rgba(139,92,246,.5)','rgba(255,95,162,.6)'];
    legLabels.forEach(function(l, li){
      var lx = startX + li * 80;
      ctx.fillStyle = legColors[li];
      ctx.fillRect(lx, legY, 14, 14);
      ctx.fillStyle = isDarkV25() ? '#ccc' : '#555';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(l, lx + 18, legY + 11);
    });

    // Detail panel for selected stage
    if(saved.selectedWorld >= 0 && saved.selectedStage >= 0){
      var sel = saved.data[saved.selectedWorld][saved.selectedStage];
      var detailX = 30;
      var detailY = legY + 30;

      ctx.fillStyle = isDarkV25() ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.03)';
      ctx.beginPath();
      ctx.roundRect(detailX, detailY, W - 60, 55, 10);
      ctx.fill();

      ctx.fillStyle = isDarkV25() ? '#FF8EC4' : '#FF5FA2';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(STAGE_WORLDS[saved.selectedWorld] + ' - Stage ' + (saved.selectedStage + 1), detailX + 14, detailY + 20);

      ctx.fillStyle = isDarkV25() ? '#ccc' : '#555';
      ctx.font = '12px sans-serif';
      var timeMin = Math.floor(sel.time / 60);
      var timeSec = sel.time % 60;
      ctx.fillText('클리어시간: ' + timeMin + '분 ' + timeSec + '초 | 별점: ' + sel.stars + '/3 | 시도횟수: ' + sel.attempts + '회', detailX + 14, detailY + 40);

      var grade = sel.stars >= 3 && sel.time < 60 ? 'S' : sel.stars >= 3 ? 'A' : sel.stars >= 2 ? 'B' : sel.stars >= 1 ? 'C' : 'D';
      var gc = {S:'#FFD700',A:'#FF5FA2',B:'#8B5CF6',C:'#4ECDC4',D:'#999'};
      ctx.fillStyle = gc[grade];
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(grade, W - 50, detailY + 38);
    }

    v25Save('v25_stages', saved);
  }

  drawStage();

  var canvas = document.getElementById('v25StageCanvas');
  if(canvas) canvas.addEventListener('click', function(e){
    var rect = canvas.getBoundingClientRect();
    var scaleX = canvas.width / rect.width;
    var mx = (e.clientX - rect.left) * scaleX;
    var my = (e.clientY - rect.top) * scaleX;

    var startX = 100, startY = 60, cellW = 58, cellH = 42;
    var col = Math.floor((mx - startX) / cellW);
    var row = Math.floor((my - startY) / cellH);
    if(col >= 0 && col < STAGE_COUNT && row >= 0 && row < STAGE_WORLDS.length){
      saved.selectedWorld = row;
      saved.selectedStage = col;
      sfxV25('stage_click');
      if(saved.data[row][col].stars >= 3) sfxV25('stage_star');
      drawStage();
    }
  });

  setTimeout(function(){
    var regenBtn = document.getElementById('v25StageRegen');
    if(regenBtn) regenBtn.addEventListener('click', function(){
      saved.data = STAGE_WORLDS.map(function(){
        return Array.from({length:STAGE_COUNT}, function(){
          return {time:Math.floor(Math.random()*180)+30, stars:Math.floor(Math.random()*4), attempts:Math.floor(Math.random()*10)+1};
        });
      });
      saved.selectedWorld = -1;
      saved.selectedStage = -1;
      sfxV25('stage_click');
      drawStage();
    });
  }, 100);
}


// ============================================================
// 7. BATTLE OUTCOME PREDICTOR (Canvas 600x380)
// ============================================================
var BATTLE_CHARS = [
  {name:'로미',icon:'👧',power:70},
  {name:'하츄핑',icon:'💖',power:65},
  {name:'바로핑',icon:'⚡',power:75},
  {name:'아자핑',icon:'🔥',power:80}
];
var BATTLE_BOSSES = [
  {name:'그림자기사',icon:'🗡️',power:60},
  {name:'얼음여왕',icon:'❄️',power:70},
  {name:'화염드래곤',icon:'🔥',power:80},
  {name:'최종보스',icon:'👑',power:95}
];

function renderBattlePredictor(){
  var saved = v25Load('v25_battle', {charIdx:0, bossIdx:0, history:[], sims:0});
  var html = '<div style="text-align:center;margin-bottom:12px"><canvas id="v25BattleCanvas" width="600" height="380" style="max-width:100%;border-radius:12px;background:' + (isDarkV25()?'#1a0a2e':'#FFF0F8') + '"></canvas></div>';
  html += '<div style="text-align:center"><button id="v25BattleSim" style="padding:8px 22px;background:linear-gradient(135deg,#FF5FA2,#B066FF);color:#fff;border:none;border-radius:14px;font-size:13px;font-weight:700;cursor:pointer">⚔️ 전투 시뮬레이션</button> ';
  html += '<button id="v25BattleNext" style="padding:8px 16px;background:linear-gradient(135deg,#4ECDC4,#2ECC71);color:#fff;border:none;border-radius:14px;font-size:12px;font-weight:600;cursor:pointer">➡️ 보스 변경</button></div>';

  var m = createV25Modal('⚔️ 전투결과예측엔진', html);

  function drawBattle(){
    var c = document.getElementById('v25BattleCanvas');
    if(!c) return;
    var ctx = c.getContext('2d');
    var W = c.width, H = c.height;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = isDarkV25() ? '#1a0a2e' : '#FFF0F8';
    ctx.fillRect(0,0,W,H);

    var ch = BATTLE_CHARS[saved.charIdx];
    var boss = BATTLE_BOSSES[saved.bossIdx];

    ctx.fillStyle = isDarkV25() ? '#FF8EC4' : '#FF5FA2';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('전투 결과 예측 엔진', W/2, 28);

    // Character selection row
    var charY = 46;
    var charItemW = 120;
    var charStartX = 30;
    BATTLE_CHARS.forEach(function(bc, i){
      var bx = charStartX + i * charItemW;
      if(i === saved.charIdx){
        ctx.fillStyle = isDarkV25() ? 'rgba(78,205,196,.2)' : 'rgba(78,205,196,.1)';
        ctx.beginPath();
        ctx.roundRect(bx, charY, charItemW - 8, 36, 6);
        ctx.fill();
        ctx.strokeStyle = '#4ECDC4';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      ctx.fillStyle = isDarkV25() ? '#eee' : '#333';
      ctx.font = '18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(bc.icon, bx + charItemW/2 - 4, charY + 18);
      ctx.font = '10px sans-serif';
      ctx.fillStyle = isDarkV25() ? '#aaa' : '#888';
      ctx.fillText(bc.name, bx + charItemW/2 - 4, charY + 32);
    });

    // VS display
    ctx.fillStyle = isDarkV25() ? '#eee' : '#333';
    ctx.font = '28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(ch.icon, W/2 - 80, 120);
    ctx.fillStyle = '#FF5FA2';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('VS', W/2, 118);
    ctx.fillStyle = isDarkV25() ? '#eee' : '#333';
    ctx.font = '28px sans-serif';
    ctx.fillText(boss.icon, W/2 + 80, 120);

    ctx.font = '12px sans-serif';
    ctx.fillStyle = isDarkV25() ? '#ccc' : '#555';
    ctx.fillText(ch.name + ' (전투력 ' + ch.power + ')', W/2 - 80, 140);
    ctx.fillText(boss.name + ' (전투력 ' + boss.power + ')', W/2 + 80, 140);

    // Win rate semicircle gauge
    var winRate = Math.min(95, Math.max(5, Math.round((ch.power / (ch.power + boss.power)) * 100 + (Math.random() * 10 - 5))));
    var gaugeX = W/2, gaugeY = 200, gaugeR = 60;

    // Background arc
    ctx.beginPath();
    ctx.arc(gaugeX, gaugeY, gaugeR, Math.PI, 0);
    ctx.strokeStyle = isDarkV25() ? 'rgba(255,255,255,.1)' : 'rgba(0,0,0,.06)';
    ctx.lineWidth = 16;
    ctx.stroke();

    // Filled arc
    var fillAngle = Math.PI + (winRate / 100) * Math.PI;
    ctx.beginPath();
    ctx.arc(gaugeX, gaugeY, gaugeR, Math.PI, fillAngle);
    var gaugeColor = winRate >= 70 ? '#4ECDC4' : winRate >= 40 ? '#FFD700' : '#FF6B6B';
    ctx.strokeStyle = gaugeColor;
    ctx.lineWidth = 16;
    ctx.stroke();

    // Win rate text
    ctx.fillStyle = gaugeColor;
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(winRate + '%', gaugeX, gaugeY - 10);
    ctx.fillStyle = isDarkV25() ? '#aaa' : '#888';
    ctx.font = '11px sans-serif';
    ctx.fillText('승률 예측', gaugeX, gaugeY + 8);

    // History line chart
    var histY = 240;
    ctx.fillStyle = isDarkV25() ? '#FF8EC4' : '#FF5FA2';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('시뮬레이션 히스토리', 30, histY);

    var chartX = 50, chartY = histY + 12, chartW = W - 80, chartH = 100;

    // Chart background
    ctx.fillStyle = isDarkV25() ? 'rgba(255,255,255,.03)' : 'rgba(0,0,0,.02)';
    ctx.fillRect(chartX, chartY, chartW, chartH);

    // Grid lines
    for(var g = 0; g <= 4; g++){
      var gy = chartY + (g / 4) * chartH;
      ctx.strokeStyle = isDarkV25() ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.04)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(chartX, gy);
      ctx.lineTo(chartX + chartW, gy);
      ctx.stroke();

      ctx.fillStyle = isDarkV25() ? '#888' : '#aaa';
      ctx.font = '8px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText((100 - g * 25) + '%', chartX - 4, gy + 3);
    }

    // Plot history
    if(saved.history.length > 1){
      var maxPoints = 20;
      var hist = saved.history.slice(-maxPoints);
      ctx.beginPath();
      hist.forEach(function(h, i){
        var hx = chartX + (i / (maxPoints - 1)) * chartW;
        var hy = chartY + chartH - (h.winRate / 100) * chartH;
        if(i === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      });
      ctx.strokeStyle = '#FF5FA2';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Dots
      hist.forEach(function(h, i){
        var hx = chartX + (i / (maxPoints - 1)) * chartW;
        var hy = chartY + chartH - (h.winRate / 100) * chartH;
        ctx.beginPath();
        ctx.arc(hx, hy, 3, 0, Math.PI * 2);
        ctx.fillStyle = h.won ? '#4ECDC4' : '#FF6B6B';
        ctx.fill();
      });
    }

    // Stats
    var wins = saved.history.filter(function(h){ return h.won; }).length;
    ctx.fillStyle = isDarkV25() ? '#aaa' : '#888';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('총 시뮬: ' + saved.sims + ' | 승리: ' + wins + ' | 승률: ' + (saved.sims > 0 ? Math.round(wins/saved.sims*100) : 0) + '%', W/2, H - 10);

    v25Save('v25_battle', saved);
  }

  drawBattle();

  // Click on character row to select
  var canvas = document.getElementById('v25BattleCanvas');
  if(canvas) canvas.addEventListener('click', function(e){
    var rect = canvas.getBoundingClientRect();
    var scaleX = canvas.width / rect.width;
    var mx = (e.clientX - rect.left) * scaleX;
    var my = (e.clientY - rect.top) * scaleX;

    var charY = 46, charItemW = 120, charStartX = 30;
    if(my >= charY && my <= charY + 36){
      var idx = Math.floor((mx - charStartX) / charItemW);
      if(idx >= 0 && idx < BATTLE_CHARS.length){
        saved.charIdx = idx;
        sfxV25('battle_predict');
        drawBattle();
      }
    }
  });

  setTimeout(function(){
    var simBtn = document.getElementById('v25BattleSim');
    var nextBtn = document.getElementById('v25BattleNext');
    if(simBtn) simBtn.addEventListener('click', function(){
      var ch = BATTLE_CHARS[saved.charIdx];
      var boss = BATTLE_BOSSES[saved.bossIdx];
      var winRate = Math.min(95, Math.max(5, Math.round((ch.power / (ch.power + boss.power)) * 100)));
      var won = Math.random() * 100 < winRate;
      saved.history.push({winRate:winRate, won:won, char:saved.charIdx, boss:saved.bossIdx});
      if(saved.history.length > 50) saved.history = saved.history.slice(-50);
      saved.sims++;
      sfxV25(won ? 'battle_win' : 'battle_predict');
      drawBattle();
      showToastV25(won ? '⚔️ 승리! ' + ch.icon + ' > ' + boss.icon : '💥 패배... ' + boss.icon + ' > ' + ch.icon);
    });
    if(nextBtn) nextBtn.addEventListener('click', function(){
      saved.bossIdx = (saved.bossIdx + 1) % BATTLE_BOSSES.length;
      sfxV25('battle_predict');
      drawBattle();
    });
  }, 100);
}


// ============================================================
// 8. ADVENTURE JOURNAL CALENDAR (Canvas 620x400)
// ============================================================
function renderAdventureJournal(){
  var saved = v25Load('v25_journal', {
    activities: Array.from({length:30}, function(){ return Math.floor(Math.random() * 5); }),
    milestones: [3, 7, 14, 21, 28],
    streak: Math.floor(Math.random() * 15) + 1,
    totalDays: 30,
    markedToday: false
  });

  var html = '<div style="text-align:center;margin-bottom:12px"><canvas id="v25JournalCanvas" width="620" height="400" style="max-width:100%;border-radius:12px;background:' + (isDarkV25()?'#1a0a2e':'#FFF0F8') + '"></canvas></div>';
  html += '<div style="text-align:center"><button id="v25JournalMark" style="padding:8px 22px;background:linear-gradient(135deg,#FF5FA2,#B066FF);color:#fff;border:none;border-radius:14px;font-size:13px;font-weight:700;cursor:pointer">📝 오늘 활동 기록</button> ';
  html += '<button id="v25JournalReset" style="padding:8px 16px;background:rgba(0,0,0,.1);color:' + (isDarkV25()?'#ccc':'#666') + ';border:none;border-radius:14px;font-size:12px;cursor:pointer">초기화</button></div>';

  var m = createV25Modal('📓 모험일지캘린더', html);

  function drawJournal(){
    var c = document.getElementById('v25JournalCanvas');
    if(!c) return;
    var ctx = c.getContext('2d');
    var W = c.width, H = c.height;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = isDarkV25() ? '#1a0a2e' : '#FFF0F8';
    ctx.fillRect(0,0,W,H);

    ctx.fillStyle = isDarkV25() ? '#FF8EC4' : '#FF5FA2';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('모험 일지 캘린더', W/2, 28);

    // GitHub-style heatmap: 6 rows x 5 cols = 30 days
    var cols = 6;
    var rows = 5;
    var cellSize = 36;
    var gap = 4;
    var startX = (W - cols * (cellSize + gap)) / 2;
    var startY = 60;

    // Activity intensity colors (5 levels)
    var intensityColors = isDarkV25()
      ? ['rgba(255,255,255,.05)','rgba(78,205,196,.25)','rgba(78,205,196,.45)','rgba(255,95,162,.5)','rgba(255,95,162,.8)']
      : ['rgba(0,0,0,.04)','rgba(78,205,196,.2)','rgba(78,205,196,.4)','rgba(255,95,162,.45)','rgba(255,95,162,.7)'];

    var dayLabels = ['월','화','수','목','금'];

    // Row labels
    for(var rl = 0; rl < rows; rl++){
      ctx.fillStyle = isDarkV25() ? '#888' : '#aaa';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(dayLabels[rl], startX - 8, startY + rl * (cellSize + gap) + cellSize/2 + 4);
    }

    // Week labels
    for(var wl = 0; wl < cols; wl++){
      ctx.fillStyle = isDarkV25() ? '#888' : '#aaa';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('W' + (wl+1), startX + wl * (cellSize + gap) + cellSize/2, startY - 6);
    }

    // Draw cells
    for(var day = 0; day < 30; day++){
      var col = Math.floor(day / rows);
      var row = day % rows;
      var x = startX + col * (cellSize + gap);
      var y = startY + row * (cellSize + gap);
      var level = saved.activities[day];

      ctx.fillStyle = intensityColors[level];
      ctx.beginPath();
      ctx.roundRect(x, y, cellSize, cellSize, 6);
      ctx.fill();

      // Day number
      ctx.fillStyle = level >= 3 ? '#fff' : (isDarkV25() ? '#aaa' : '#888');
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('D' + (day+1), x + cellSize/2, y + cellSize/2 + 4);

      // Milestone marker
      if(saved.milestones.indexOf(day) !== -1){
        ctx.fillStyle = '#FFD700';
        ctx.font = '12px sans-serif';
        ctx.fillText('⭐', x + cellSize - 6, y + 10);
      }
    }

    // Legend
    var legX = startX;
    var legY = startY + rows * (cellSize + gap) + 16;
    ctx.fillStyle = isDarkV25() ? '#aaa' : '#888';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('없음', legX, legY + 12);
    var legLabels = ['없음','조금','보통','활발','매우활발'];
    for(var li = 0; li < 5; li++){
      var lx = legX + 32 + li * 56;
      ctx.fillStyle = intensityColors[li];
      ctx.fillRect(lx, legY, 16, 16);
      ctx.fillStyle = isDarkV25() ? '#aaa' : '#888';
      ctx.font = '9px sans-serif';
      ctx.fillText(legLabels[li], lx + 19, legY + 12);
    }

    // Stats panel on the right
    var statsX = startX + cols * (cellSize + gap) + 30;
    var statsY = startY + 10;

    ctx.fillStyle = isDarkV25() ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.03)';
    ctx.beginPath();
    ctx.roundRect(statsX, statsY, 160, 180, 12);
    ctx.fill();

    ctx.fillStyle = isDarkV25() ? '#FF8EC4' : '#FF5FA2';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('활동 통계', statsX + 14, statsY + 24);

    // Streak
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 32px sans-serif';
    ctx.fillText(saved.streak, statsX + 14, statsY + 66);
    ctx.fillStyle = isDarkV25() ? '#aaa' : '#888';
    ctx.font = '11px sans-serif';
    ctx.fillText('연속 플레이 일수', statsX + 14, statsY + 82);

    // Total active days
    var activeDays = saved.activities.filter(function(a){ return a > 0; }).length;
    ctx.fillStyle = '#4ECDC4';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText(activeDays + '/30', statsX + 14, statsY + 116);
    ctx.fillStyle = isDarkV25() ? '#aaa' : '#888';
    ctx.font = '11px sans-serif';
    ctx.fillText('활동일 / 총일수', statsX + 14, statsY + 132);

    // Milestones reached
    var msReached = saved.milestones.filter(function(ms){ return saved.activities[ms] > 0; }).length;
    ctx.fillStyle = '#B066FF';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(msReached + '/' + saved.milestones.length, statsX + 14, statsY + 162);
    ctx.fillStyle = isDarkV25() ? '#aaa' : '#888';
    ctx.font = '11px sans-serif';
    ctx.fillText('마일스톤 달성', statsX + 14, statsY + 176);

    // Monthly summary bar at bottom
    var sumY = legY + 32;
    ctx.fillStyle = isDarkV25() ? '#FF8EC4' : '#FF5FA2';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('주간 활동량', 30, sumY);

    for(var wk = 0; wk < cols; wk++){
      var weekTotal = 0;
      for(var wd = 0; wd < rows; wd++){
        var di = wk * rows + wd;
        if(di < 30) weekTotal += saved.activities[di];
      }
      var barX = 30 + wk * 95;
      var barY2 = sumY + 8;
      var barW = 80;
      var barH2 = 18;
      var maxWeekTotal = rows * 4;
      var fillW = (weekTotal / maxWeekTotal) * barW;

      ctx.fillStyle = isDarkV25() ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.04)';
      ctx.beginPath();
      ctx.roundRect(barX, barY2, barW, barH2, 4);
      ctx.fill();

      ctx.fillStyle = '#B066FF';
      ctx.beginPath();
      ctx.roundRect(barX, barY2, fillW, barH2, 4);
      ctx.fill();

      ctx.fillStyle = fillW > 25 ? '#fff' : (isDarkV25() ? '#ccc' : '#555');
      ctx.font = '9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('W' + (wk+1) + ': ' + weekTotal, barX + barW/2, barY2 + 13);
    }

    v25Save('v25_journal', saved);
  }

  drawJournal();

  // Click cells to toggle activity level
  var canvas = document.getElementById('v25JournalCanvas');
  if(canvas) canvas.addEventListener('click', function(e){
    var rect = canvas.getBoundingClientRect();
    var scaleX = canvas.width / rect.width;
    var mx = (e.clientX - rect.left) * scaleX;
    var my = (e.clientY - rect.top) * scaleX;

    var cols2 = 6, rows2 = 5, cellSize2 = 36, gap2 = 4;
    var startX2 = (canvas.width - cols2 * (cellSize2 + gap2)) / 2;
    var startY2 = 60;

    for(var day = 0; day < 30; day++){
      var col2 = Math.floor(day / rows2);
      var row2 = day % rows2;
      var cx2 = startX2 + col2 * (cellSize2 + gap2);
      var cy2 = startY2 + row2 * (cellSize2 + gap2);
      if(mx >= cx2 && mx <= cx2 + cellSize2 && my >= cy2 && my <= cy2 + cellSize2){
        saved.activities[day] = (saved.activities[day] + 1) % 5;
        sfxV25('journal_mark');
        // Recalculate streak
        var streak = 0;
        for(var s = 29; s >= 0; s--){
          if(saved.activities[s] > 0) streak++;
          else break;
        }
        saved.streak = streak;
        if(streak >= 7) sfxV25('journal_streak');
        drawJournal();
        return;
      }
    }
  });

  setTimeout(function(){
    var markBtn = document.getElementById('v25JournalMark');
    var resetBtn = document.getElementById('v25JournalReset');
    if(markBtn) markBtn.addEventListener('click', function(){
      // Mark day 29 (today) with random high activity
      saved.activities[29] = Math.floor(Math.random() * 3) + 2;
      saved.markedToday = true;
      // Recalculate streak
      var streak = 0;
      for(var s = 29; s >= 0; s--){
        if(saved.activities[s] > 0) streak++;
        else break;
      }
      saved.streak = streak;
      sfxV25('journal_mark');
      if(streak >= 7) sfxV25('journal_streak');
      drawJournal();
      showToastV25('📓 오늘 활동 기록 완료! 연속 ' + streak + '일차!');
    });
    if(resetBtn) resetBtn.addEventListener('click', function(){
      saved = {
        activities: Array.from({length:30}, function(){ return 0; }),
        milestones: [3, 7, 14, 21, 28],
        streak: 0,
        totalDays: 30,
        markedToday: false
      };
      drawJournal();
    });
  }, 100);
}


// ============================================================
// QUIZ v25 - 15 Questions (240 -> 255)
// ============================================================
var V25_QUIZ = [
  {q:'몬스터 도감에서 드래곤의 위험등급은?',a:['A','S','B','C'],c:0},
  {q:'파티 편성에서 가장 중요한 요소는?',a:['시너지 밸런스','최고 레벨','같은 속성','외모'],c:0},
  {q:'보스 전투에서 안전구간의 역할은?',a:['회복 및 공격 준비','도망치기','아이템 사용','저장하기'],c:0},
  {q:'경험치 효율이 가장 높은 활동은 보통?',a:['보스 전투','일반 전투','탐험','수집'],c:0},
  {q:'아이템 드롭에서 &ldquo;신화&rdquo; 등급의 특징은?',a:['가장 낮은 확률','가장 높은 확률','보통 확률','드롭 불가'],c:0},
  {q:'레이더 차트에서 6축이란?',a:['6가지 능력치','회전 수','레벨 수','스테이지 수'],c:0},
  {q:'히트맵 시각화의 장점은?',a:['패턴을 한눈에 파악','정확한 수치 표시','애니메이션 효과','색상 미학'],c:0},
  {q:'하츄핑의 주요 역할은?',a:['서포터','탱커','어태커','방어형'],c:0},
  {q:'스테이지 클리어 별점의 최대는?',a:['3개','5개','10개','1개'],c:0},
  {q:'GitHub 스타일 활동 히트맵의 색상 단계는?',a:['5단계','3단계','10단계','2단계'],c:0},
  {q:'전투 승률 예측에 영향을 미치는 요소는?',a:['전투력 비교','외모','이름 길이','아이콘 크기'],c:0},
  {q:'마일스톤의 의미는?',a:['중요 성취 포인트','거리 단위','시간 단위','레벨 단위'],c:0},
  {q:'파티 빌더에서 최적 파티 추천의 기준은?',a:['시너지 점수','레벨 합계','외모 점수','랜덤'],c:0},
  {q:'보스 패턴 분석에서 약점 공격의 효과는?',a:['2배 데미지','0.5배 데미지','1배 데미지','3배 데미지'],c:0},
  {q:'연속 플레이 보상의 목적은?',a:['꾸준한 참여 유도','과금 유도','경쟁 유도','로그아웃 유도'],c:0}
];

function renderV25Quiz(){
  var saved = v25Load('v25_quiz_state', {answered:0, correct:0, idx:0, history:[]});
  if(saved.idx >= V25_QUIZ.length) saved.idx = 0;
  var quiz = V25_QUIZ[saved.idx];

  var html = '<div style="margin-bottom:12px;font-size:13px;color:' + (isDarkV25()?'#aaa':'#888') + '">진행: ' + (saved.idx + 1) + '/' + V25_QUIZ.length + ' | 정답률: ' + (saved.answered > 0 ? Math.round(saved.correct/saved.answered*100) : 0) + '% (' + saved.correct + '/' + saved.answered + ')</div>';
  html += '<div style="font-size:15px;font-weight:700;margin-bottom:16px">' + quiz.q + '</div>';
  quiz.a.forEach(function(ans, i){
    html += '<button class="v25QuizBtn" data-idx="' + i + '" style="display:block;width:100%;padding:10px;margin-bottom:8px;background:' + (isDarkV25()?'rgba(255,255,255,.06)':'rgba(0,0,0,.03)') + ';border:2px solid transparent;border-radius:14px;color:' + (isDarkV25()?'#eee':'#333') + ';font-size:13px;font-weight:600;cursor:pointer;text-align:left;transition:all .2s">' + String.fromCharCode(9312 + i) + ' ' + ans + '</button>';
  });

  var m2 = createV25Modal('❓ 퀴즈 v25 (15문)', html);

  setTimeout(function(){
    var btns = m2.querySelectorAll('.v25QuizBtn');
    btns.forEach(function(btn){
      btn.addEventListener('click', function(){
        var idx = parseInt(btn.dataset.idx);
        var isCorrect = idx === quiz.c;
        saved.answered++;
        if(isCorrect) saved.correct++;
        saved.idx++;
        if(saved.idx >= V25_QUIZ.length) saved.idx = 0;

        btns.forEach(function(b){
          var bi = parseInt(b.dataset.idx);
          if(bi === quiz.c) b.style.borderColor = '#4ECDC4';
          else if(bi === idx && !isCorrect) b.style.borderColor = '#FF6B6B';
          b.style.pointerEvents = 'none';
        });

        sfxV25(isCorrect ? 'v25_quiz' : 'stage_click');
        v25Save('v25_quiz_state', saved);

        setTimeout(function(){
          m2.closest('div[style]').remove();
          renderV25Quiz();
        }, 1200);
      });
    });
  }, 100);
}


// ============================================================
// ACHIEVEMENTS v25 (+12, 226 -> 238)
// ============================================================
var V25_ACHIEVEMENTS = [
  {id:'a_v25_codex_scan',name:'도감 연구원',desc:'몬스터 3종 스캔',cat:'general',icon:'📖'},
  {id:'a_v25_codex_all',name:'몬스터 박사',desc:'모든 몬스터 스캔 완료',cat:'general',icon:'🎓'},
  {id:'a_v25_xp_analyze',name:'XP 분석가',desc:'XP 효율 분석 3회 실행',cat:'general',icon:'⚡'},
  {id:'a_v25_boss_5',name:'보스 해결사',desc:'보스 5종 분석',cat:'general',icon:'🗡️'},
  {id:'a_v25_drop_50',name:'드롭 시뮬레이터',desc:'드롭 시뮬 50회',cat:'general',icon:'🎲'},
  {id:'a_v25_drop_myth',name:'신화 획득',desc:'신화 등급 아이템 획득',cat:'general',icon:'⭐'},
  {id:'a_v25_party_opt',name:'최적 파티 발견',desc:'자동 최적 파티 추천 사용',cat:'general',icon:'🤝'},
  {id:'a_v25_stage_3star',name:'스테이지 마스터',desc:'3성 스테이지 5개 달성',cat:'general',icon:'⭐'},
  {id:'a_v25_battle_10',name:'전투 베테랑',desc:'전투 시뮬 10회',cat:'general',icon:'⚔️'},
  {id:'a_v25_battle_streak',name:'연승 전사',desc:'전투 5연승',cat:'general',icon:'🔥'},
  {id:'a_v25_journal_7',name:'일주일 모험가',desc:'7일 연속 플레이',cat:'general',icon:'📓'},
  {id:'a_v25_quiz_master',name:'퀴즈 v25 마스터',desc:'v25 퀴즈 전문 정답',cat:'general',icon:'🏆'}
];

function checkV25Achievements(){
  var achievements;
  try{ achievements = JSON.parse(localStorage.getItem('hatcuping_achievements')) || {}; }catch(e){ achievements = {}; }
  var changed = false;

  var codex = v25Load('v25_codex', {scanned:[]});
  if(codex.scanned.length >= 3 && !achievements.a_v25_codex_scan){ achievements.a_v25_codex_scan = Date.now(); changed = true; showToastV25('🏆 도감 연구원 업적 달성!'); }
  if(codex.scanned.length >= CODEX_MONSTERS.length && !achievements.a_v25_codex_all){ achievements.a_v25_codex_all = Date.now(); changed = true; showToastV25('🏆 몬스터 박사 업적 달성!'); }

  var xp = v25Load('v25_xp', {runs:0});
  if(xp.runs >= 3 && !achievements.a_v25_xp_analyze){ achievements.a_v25_xp_analyze = Date.now(); changed = true; showToastV25('🏆 XP 분석가 업적 달성!'); }

  var boss = v25Load('v25_boss', {analyzed:[]});
  if(boss.analyzed.length >= 5 && !achievements.a_v25_boss_5){ achievements.a_v25_boss_5 = Date.now(); changed = true; showToastV25('🏆 보스 해결사 업적 달성!'); }

  var drop = v25Load('v25_drop', {simCount:0, drops:[]});
  if(drop.simCount >= 50 && !achievements.a_v25_drop_50){ achievements.a_v25_drop_50 = Date.now(); changed = true; showToastV25('🏆 드롭 시뮬레이터 업적 달성!'); }
  if(drop.drops && drop.drops.length > 0){
    var hasMythic = drop.drops.some(function(d){ return d[4] > 0; });
    if(hasMythic && !achievements.a_v25_drop_myth){ achievements.a_v25_drop_myth = Date.now(); changed = true; showToastV25('🏆 신화 획득 업적 달성!'); }
  }

  var party = v25Load('v25_party', {builds:0});
  if(party.builds >= 1 && !achievements.a_v25_party_opt){ achievements.a_v25_party_opt = Date.now(); changed = true; showToastV25('🏆 최적 파티 발견 업적 달성!'); }

  var stages = v25Load('v25_stages', {data:[]});
  if(stages.data && stages.data.length > 0){
    var threeStarCount = 0;
    stages.data.forEach(function(world){ world.forEach(function(st){ if(st.stars >= 3) threeStarCount++; }); });
    if(threeStarCount >= 5 && !achievements.a_v25_stage_3star){ achievements.a_v25_stage_3star = Date.now(); changed = true; showToastV25('🏆 스테이지 마스터 업적 달성!'); }
  }

  var battle = v25Load('v25_battle', {sims:0, history:[]});
  if(battle.sims >= 10 && !achievements.a_v25_battle_10){ achievements.a_v25_battle_10 = Date.now(); changed = true; showToastV25('🏆 전투 베테랑 업적 달성!'); }
  if(battle.history && battle.history.length >= 5){
    var lastFive = battle.history.slice(-5);
    if(lastFive.every(function(h){ return h.won; }) && !achievements.a_v25_battle_streak){
      achievements.a_v25_battle_streak = Date.now(); changed = true; showToastV25('🏆 연승 전사 업적 달성!');
    }
  }

  var journal = v25Load('v25_journal', {streak:0});
  if(journal.streak >= 7 && !achievements.a_v25_journal_7){ achievements.a_v25_journal_7 = Date.now(); changed = true; showToastV25('🏆 일주일 모험가 업적 달성!'); }

  var quiz = v25Load('v25_quiz_state', {answered:0, correct:0});
  if(quiz.answered >= 15 && quiz.correct >= 15 && !achievements.a_v25_quiz_master){ achievements.a_v25_quiz_master = Date.now(); changed = true; showToastV25('🏆 퀴즈 v25 마스터 업적 달성!'); }

  if(changed){
    try{ localStorage.setItem('hatcuping_achievements', JSON.stringify(achievements)); }catch(e){}
    var countEl = document.getElementById('achieveCount');
    if(countEl) countEl.textContent = Object.keys(achievements).length + '/24';
  }
}

setInterval(checkV25Achievements, 5000);


// ============================================================
// NAV BUTTONS - Append to existing bottom bar (UI rule compliant)
// ============================================================
function addV25NavButtons(){
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
    {label:'📖 도감',fn:renderMonsterCodex,key:'Shift+Q'},
    {label:'⚡ XP효율',fn:renderXPOptimizer,key:'Shift+W'},
    {label:'🗡️ 보스패턴',fn:renderBossPattern,key:'Shift+E'},
    {label:'🎲 드롭시뮬',fn:renderDropSimulator,key:'Shift+R'},
    {label:'🤝 파티빌더',fn:renderPartyBuilder,key:'Shift+T'},
    {label:'🗺️ 스테이지맵',fn:renderStageHeatmap,key:'Shift+Y'},
    {label:'⚔️ 전투예측',fn:renderBattlePredictor,key:'Shift+U'},
    {label:'📓 모험일지',fn:renderAdventureJournal,key:'Shift+D'},
    {label:'❓ 퀴즈v25',fn:renderV25Quiz,key:'Shift+9'}
  ];

  if(bottomBar){
    navItems.forEach(function(item){
      var btn = document.createElement('button');
      btn.textContent = item.label;
      btn.style.cssText = 'padding:6px 10px;margin:2px;background:linear-gradient(135deg,#B066FF,#8B5CF6);color:#fff;border:none;border-radius:10px;font-size:10px;font-weight:700;cursor:pointer;white-space:nowrap';
      btn.addEventListener('click', function(){ sfxV25('v25_nav'); item.fn(); });
      bottomBar.appendChild(btn);
    });
  }

  document.addEventListener('keydown', function(e){
    if(!e.shiftKey) return;
    if(e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    var keyMap = {
      'Q':renderMonsterCodex, 'W':renderXPOptimizer, 'E':renderBossPattern,
      'R':renderDropSimulator, 'T':renderPartyBuilder, 'Y':renderStageHeatmap,
      'U':renderBattlePredictor, 'D':renderAdventureJournal, '9':renderV25Quiz
    };
    var fn = keyMap[e.key.toUpperCase()];
    if(fn){ e.preventDefault(); sfxV25('v25_nav'); fn(); }
  });
}

if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', addV25NavButtons);
} else {
  addV25NavButtons();
}

})();

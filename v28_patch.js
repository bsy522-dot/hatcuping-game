// hatcuping-game v28_patch.js - NEXTERA+PRISM AUTO v28.0
// Self-contained IIFE patch module
(function(){
'use strict';

var _v28Ctx = null;
function _v28InitAudio(){
  if(!_v28Ctx){
    try{ _v28Ctx = new (window.AudioContext || window.webkitAudioContext)(); }catch(e){}
  }
  if(_v28Ctx && _v28Ctx.state === 'suspended') _v28Ctx.resume();
}

var V28_SFX = {
  talent_click:{f:720,d:.05,t:'triangle'},
  talent_unlock:{f:1280,d:.2,t:'sine'},
  season_switch:{f:640,d:.06,t:'sine'},
  season_effect:{f:1120,d:.16,t:'triangle'},
  guild_join:{f:560,d:.05,t:'square'},
  guild_rank:{f:1340,d:.22,t:'sine'},
  rune_slot:{f:690,d:.05,t:'triangle'},
  rune_combine:{f:1220,d:.18,t:'sine'},
  mount_ride:{f:600,d:.06,t:'sine'},
  mount_bond:{f:1160,d:.15,t:'triangle'},
  arena_start:{f:780,d:.05,t:'square'},
  arena_win:{f:1380,d:.22,t:'sine'},
  craft_mix:{f:670,d:.06,t:'triangle'},
  craft_rare:{f:1260,d:.2,t:'sine'},
  dash28_calc:{f:580,d:.05,t:'triangle'},
  dash28_rank:{f:1420,d:.25,t:'sine'},
  v28_nav:{f:800,d:.05,t:'sine'},
  v28_quiz:{f:990,d:.08,t:'triangle'}
};

function sfxV28(type){
  _v28InitAudio();
  if(!_v28Ctx) return;
  var s = V28_SFX[type];
  if(!s) return;
  try{
    var muted = false;
    try{ muted = localStorage.getItem('hatcuping_mute') === '1'; }catch(e){}
    if(muted) return;
    var osc = _v28Ctx.createOscillator();
    var gain = _v28Ctx.createGain();
    osc.type = s.t || 'sine';
    osc.frequency.value = s.f;
    gain.gain.value = 0.08;
    osc.connect(gain);
    gain.connect(_v28Ctx.destination);
    osc.start();
    osc.stop(_v28Ctx.currentTime + (s.d || 0.06));
  }catch(e){}
}

function v28Load(key, fb){ try{ var d = JSON.parse(localStorage.getItem(key)); return d !== null ? d : fb; }catch(e){ return fb; } }
function v28Save(key, data){ try{ localStorage.setItem(key, JSON.stringify(data)); }catch(e){} }
function isDarkV28(){ return document.body.classList.contains('dark'); }
function showToastV28(msg){
  var t = document.getElementById('achieveToast');
  if(!t){
    t = document.createElement('div');
    t.id = 'achieveToast';
    t.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#FF5FA2,#B066FF);color:#fff;padding:12px 24px;border-radius:16px;font-size:13px;font-weight:700;z-index:10000;opacity:0;transition:opacity .4s;pointer-events:none;text-align:center;max-width:90vw';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = '1';
  setTimeout(function(){ t.style.opacity = '0'; }, 2500);
}

function v28CreateModal(titleText){
  var ov = document.createElement('div');
  ov.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.55);z-index:9999;display:flex;align-items:center;justify-content:center;padding:12px;opacity:0;transition:opacity .3s';
  var box = document.createElement('div');
  var dk = isDarkV28();
  box.style.cssText = 'background:'+(dk?'#1e1030':'#fff')+';border-radius:20px;width:100%;max-width:680px;max-height:88vh;overflow-y:auto;position:relative;box-shadow:0 8px 40px rgba(0,0,0,.3);padding:0';
  var hdr = document.createElement('div');
  hdr.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:16px 20px 12px;border-bottom:1px solid '+(dk?'rgba(255,255,255,.1)':'rgba(0,0,0,.08)');
  var h = document.createElement('h3');
  h.style.cssText = 'font-size:16px;font-weight:800;color:'+(dk?'#FFB8D9':'#FF5FA2')+';margin:0';
  h.textContent = titleText;
  var cls = document.createElement('button');
  cls.textContent = '✕';
  cls.style.cssText = 'background:none;border:none;font-size:20px;color:'+(dk?'#aaa':'#888')+';cursor:pointer;padding:4px 8px;border-radius:8px;transition:all .2s';
  cls.addEventListener('mouseenter', function(){ this.style.color = '#FF5FA2'; });
  cls.addEventListener('mouseleave', function(){ this.style.color = dk?'#aaa':'#888'; });
  cls.addEventListener('click', function(){ ov.style.opacity='0'; setTimeout(function(){ ov.remove(); },300); });
  hdr.appendChild(h); hdr.appendChild(cls);
  var body = document.createElement('div');
  body.style.cssText = 'padding:16px 20px 20px';
  box.appendChild(hdr); box.appendChild(body);
  ov.appendChild(box);
  document.body.appendChild(ov);
  requestAnimationFrame(function(){ ov.style.opacity='1'; });
  ov.addEventListener('click', function(e){ if(e.target===ov){ ov.style.opacity='0'; setTimeout(function(){ ov.remove(); },300); }});
  return body;
}

// ============================================================
// 1. TALENT TREE - 스킬 재능 트리 (8캐릭 x 6스킬 노드 트리)
// ============================================================
function renderTalentTree(){
  sfxV28('talent_click');
  var body = v28CreateModal('🌳 캐릭터 재능 트리');
  var dk = isDarkV28();
  var chars = [
    {name:'로미',color:'#FF5FA2',talents:['HP강화','MP회복','회복마법','방어막','버프시전','채답회복'],mastery:[85,72,68,78,55,62]},
    {name:'하캄핑',color:'#FFB8D9',talents:['비행속도','사랑파동','페어리원','치료빛','하트실드','사랑명중'],mastery:[90,88,75,82,60,70]},
    {name:'바로핑',color:'#5FA2FF',talents:['힘강화','방어력','돌파가르기','에너지방벽','대지진동','바위던지기'],mastery:[92,85,78,70,65,58]},
    {name:'해핑',color:'#4DB6AC',talents:['파도자를','해일소환','물방울','쳴물제어','수중호흡','해일참호'],mastery:[80,76,72,88,62,55]},
    {name:'차핑',color:'#AB47BC',talents:['차원문','순간이동','시간정지','미래예지','공간왜곡','차원폭발'],mastery:[75,82,68,71,59,48]},
    {name:'아자핑',color:'#FF7043',talents:['용기부스트','도발정신','전투함성','리더십','불굴의의지','영웅의방패'],mastery:[88,80,74,70,66,52]},
    {name:'라라핑',color:'#FFD54F',talents:['노래파동','리듬마법','치유멜로디','하모니우련','음파방벽','전장의노래'],mastery:[86,78,82,60,56,45]},
    {name:'무지핑',color:'#78909C',talents:['무관심','평온유지','신비은폐','과믵한힘','모른철벽','무한기상술'],mastery:[65,72,80,55,90,42]}
  ];
  var sel = v28Load('v28_talent_char', 0);

  var wrap = document.createElement('div');
  var tabs = document.createElement('div');
  tabs.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;margin-bottom:16px';
  chars.forEach(function(c, i){
    var tb = document.createElement('button');
    tb.textContent = c.name;
    tb.style.cssText = 'padding:6px 14px;border-radius:12px;border:2px solid '+(i===sel?c.color:'transparent')+';background:'+(i===sel?c.color+'22':'transparent')+';color:'+(dk?'#eee':'#333')+';font-size:12px;font-weight:700;cursor:pointer;transition:all .2s';
    tb.addEventListener('click', function(){ sel=i; v28Save('v28_talent_char',i); sfxV28('talent_click'); renderTree(); tabs.querySelectorAll('button').forEach(function(b,j){ b.style.borderColor=j===i?chars[j].color:'transparent'; b.style.background=j===i?chars[j].color+'22':'transparent'; }); });
    tabs.appendChild(tb);
  });

  var canvasWrap = document.createElement('div');
  canvasWrap.style.cssText = 'display:flex;justify-content:center';
  var canvas = document.createElement('canvas');
  canvas.width = 620; canvas.height = 400;
  canvas.style.cssText = 'max-width:100%;height:auto;border-radius:12px;background:'+(dk?'#150a20':'#faf5ff');
  canvasWrap.appendChild(canvas);

  wrap.appendChild(tabs);
  wrap.appendChild(canvasWrap);
  body.appendChild(wrap);

  function renderTree(){
    var c = chars[sel];
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0,0,620,400);
    ctx.fillStyle = dk?'#150a20':'#faf5ff';
    ctx.fillRect(0,0,620,400);
    ctx.fillStyle = dk?'#eee':'#333';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(c.name + ' 재능 트리', 310, 28);
    var nodes = [];
    var rootX = 310, rootY = 65;
    nodes.push({x:rootX,y:rootY,label:c.talents[0],val:c.mastery[0]});
    var lx = [155, 465];
    nodes.push({x:lx[0],y:140,label:c.talents[1],val:c.mastery[1]});
    nodes.push({x:lx[1],y:140,label:c.talents[2],val:c.mastery[2]});
    nodes.push({x:100,y:230,label:c.talents[3],val:c.mastery[3]});
    nodes.push({x:310,y:230,label:c.talents[4],val:c.mastery[4]});
    nodes.push({x:520,y:230,label:c.talents[5],val:c.mastery[5]});
    var edges = [[0,1],[0,2],[1,3],[1,4],[2,4],[2,5]];
    ctx.strokeStyle = c.color+'66';
    ctx.lineWidth = 2.5;
    edges.forEach(function(e){
      ctx.beginPath();
      ctx.moveTo(nodes[e[0]].x, nodes[e[0]].y);
      ctx.lineTo(nodes[e[1]].x, nodes[e[1]].y);
      ctx.stroke();
    });
    nodes.forEach(function(n){
      var r = 28 + n.val*0.1;
      var grad = ctx.createRadialGradient(n.x,n.y,0,n.x,n.y,r);
      grad.addColorStop(0, c.color+'cc');
      grad.addColorStop(1, c.color+'33');
      ctx.beginPath();
      ctx.arc(n.x, n.y, r, 0, Math.PI*2);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = c.color;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = dk?'#fff':'#333';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(n.label, n.x, n.y-4);
      ctx.fillStyle = c.color;
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(n.val+'%', n.x, n.y+12);
    });
    var total = 0; c.mastery.forEach(function(m){total+=m;});
    var avg = Math.round(total/c.mastery.length);
    var grade = avg>=85?'S':avg>=70?'A':avg>=55?'B':avg>=40?'C':'D';
    var gCol = {S:'#FFD700',A:'#FF5FA2',B:'#5FA2FF',C:'#4DB6AC',D:'#888'}[grade];
    ctx.fillStyle = dk?'#aaa':'#666';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('종합 마스터리: '+avg+'%', 30, 340);
    ctx.fillStyle = gCol;
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText(grade, 30, 376);
    ctx.fillStyle = dk?'#888':'#aaa';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('클릭: 캐릭터 선택 | Shift+Q', 590, 390);
  }
  renderTree();
}

// ============================================================
// 2. SEASON BATTLE SYSTEM - 계절전투시스템 (4계절 x 8효과 히트맵)
// ============================================================
function renderSeasonBattle(){
  sfxV28('season_switch');
  var body = v28CreateModal('🍃 계절전투 시스템');
  var dk = isDarkV28();
  var canvas = document.createElement('canvas');
  canvas.width = 640; canvas.height = 400;
  canvas.style.cssText = 'max-width:100%;height:auto;border-radius:12px;background:'+(dk?'#0a1520':'#f5faff');
  body.appendChild(canvas);
  var ctx = canvas.getContext('2d');

  var seasons = ['봄','여름','가을','겨울'];
  var effects = ['공격력','방어력','속도','회복력','회피률','크리티컬','원소데미지','버프지속'];
  var seasonColors = ['#4CAF50','#FF7043','#FF9800','#42A5F5'];
  var data = [
    [1.2,0.9,1.3,1.1,1.0,0.8,1.15,1.25],
    [1.4,0.7,1.1,0.8,0.9,1.3,1.35,0.9],
    [1.0,1.1,0.9,1.3,1.2,1.1,1.0,1.4],
    [0.8,1.4,0.7,1.2,0.8,1.2,0.9,1.1]
  ];

  ctx.clearRect(0,0,640,400);
  ctx.fillStyle = dk?'#0a1520':'#f5faff';
  ctx.fillRect(0,0,640,400);
  ctx.fillStyle = dk?'#eee':'#333';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('계절별 전투 효과 히트맵 (4계절 x 8효과)', 320, 28);

  var cellW = 60, cellH = 55;
  var startX = 130, startY = 58;
  ctx.fillStyle = dk?'#aaa':'#666';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'center';
  effects.forEach(function(ef, j){
    ctx.save();
    ctx.translate(startX + j*cellW + cellW/2, startY-6);
    ctx.rotate(-0.4);
    ctx.fillText(ef, 0, 0);
    ctx.restore();
  });
  ctx.textAlign = 'right';
  seasons.forEach(function(s, i){
    ctx.fillStyle = seasonColors[i];
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(s, startX-12, startY + i*cellH + cellH/2 + 4);
  });

  ctx.textAlign = 'center';
  data.forEach(function(row, i){
    row.forEach(function(val, j){
      var x = startX + j*cellW, y = startY + i*cellH;
      var intensity = (val - 0.7) / 0.7;
      var r,g,b;
      if(val >= 1.0){
        r = Math.round(255 - intensity*80);
        g = Math.round(100 + intensity*80);
        b = Math.round(100);
      } else {
        r = Math.round(100 + (1-val)*200);
        g = Math.round(100);
        b = Math.round(255 - (1-val)*80);
      }
      ctx.fillStyle = 'rgba('+r+','+g+','+b+','+(dk?0.7:0.5)+')';
      ctx.fillRect(x+1, y+1, cellW-2, cellH-2);
      ctx.strokeStyle = dk?'rgba(255,255,255,.1)':'rgba(0,0,0,.06)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x+1, y+1, cellW-2, cellH-2);
      ctx.fillStyle = dk?'#fff':'#333';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText('x'+val.toFixed(1), x+cellW/2, y+cellH/2+2);
      var label = val>=1.3?'↑↑':val>=1.1?'↑':val<=0.8?'↓↓':val<1.0?'↓':'-';
      ctx.fillStyle = val>=1.1?'#4CAF50':val<1.0?'#f44336':'#999';
      ctx.font = '10px sans-serif';
      ctx.fillText(label, x+cellW/2, y+cellH/2+16);
    });
  });
  ctx.fillStyle = dk?'#aaa':'#888';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('↑↑ x1.3+  ↑ x1.1+  - x1.0  ↓ x0.9-  ↓↓ x0.8-', 130, 310);

  var bestSeason = ['봄: 속도+버프', '여름: 공격+원소', '가을: 회복+버프', '겨울: 방어+회복'];
  ctx.fillStyle = dk?'#eee':'#333';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText('계절별 최적 전략:', 30, 345);
  bestSeason.forEach(function(s, i){
    ctx.fillStyle = seasonColors[i];
    ctx.font = '11px sans-serif';
    ctx.fillText(s, 30 + (i%2)*300, 365 + Math.floor(i/2)*18);
  });
  ctx.fillStyle = dk?'#888':'#aaa';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('Shift+W', 610, 390);
}

// ============================================================
// 3. GUILD SYSTEM - 길드 시스템 (6길드 x 5혜택 네트워크)
// ============================================================
function renderGuildSystem(){
  sfxV28('guild_join');
  var body = v28CreateModal('🏰 길드 시스템');
  var dk = isDarkV28();
  var canvas = document.createElement('canvas');
  canvas.width = 620; canvas.height = 400;
  canvas.style.cssText = 'max-width:100%;height:auto;border-radius:12px;background:'+(dk?'#100a1e':'#f8f5ff');
  body.appendChild(canvas);
  var ctx = canvas.getContext('2d');

  var guilds = [
    {name:'사랑의기사단',color:'#FF5FA2',x:310,y:80,members:24,power:920,benefits:[90,85,70,80,75]},
    {name:'용기의수호자',color:'#FF7043',x:140,y:160,members:18,power:850,benefits:[75,90,85,65,70]},
    {name:'지혜의탐구자',color:'#5FA2FF',x:480,y:160,members:15,power:780,benefits:[80,65,90,85,60]},
    {name:'자연의수호자',color:'#4CAF50',x:100,y:280,members:20,power:810,benefits:[70,75,65,90,85]},
    {name:'별빛의마법사',color:'#AB47BC',x:310,y:300,members:12,power:880,benefits:[85,70,80,60,90]},
    {name:'철벽의수비대',color:'#78909C',x:520,y:280,members:22,power:860,benefits:[65,95,75,70,80]}
  ];
  var benefitLabels = ['공격보너스','방어보너스','경험치보너스','회복보너스','드롭확률보너스'];
  var alliances = [[0,1],[0,2],[1,3],[2,5],[3,4],[4,5],[0,4]];

  ctx.clearRect(0,0,620,400);
  ctx.fillStyle = dk?'#100a1e':'#f8f5ff';
  ctx.fillRect(0,0,620,400);
  ctx.fillStyle = dk?'#eee':'#333';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('길드 동맹 네트워크 (6길드 동맹맵)', 310, 28);

  alliances.forEach(function(a){
    ctx.beginPath();
    ctx.moveTo(guilds[a[0]].x, guilds[a[0]].y);
    ctx.lineTo(guilds[a[1]].x, guilds[a[1]].y);
    ctx.strokeStyle = dk?'rgba(255,255,255,.12)':'rgba(0,0,0,.08)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6,4]);
    ctx.stroke();
    ctx.setLineDash([]);
  });

  guilds.forEach(function(g){
    var r = 32;
    var grad = ctx.createRadialGradient(g.x,g.y,0,g.x,g.y,r);
    grad.addColorStop(0, g.color+'cc');
    grad.addColorStop(1, g.color+'33');
    ctx.beginPath();
    ctx.arc(g.x, g.y, r, 0, Math.PI*2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = g.color;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.fillStyle = dk?'#fff':'#333';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(g.name, g.x, g.y - 2);
    ctx.fillStyle = g.color;
    ctx.font = '9px sans-serif';
    ctx.fillText(g.members+'명 | '+g.power+'PT', g.x, g.y + 12);
  });

  ctx.fillStyle = dk?'#aaa':'#666';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('점선: 동맹 관계  |  원 크기: 길드 규모', 30, 370);
  ctx.fillStyle = dk?'#888':'#aaa';
  ctx.textAlign = 'right';
  ctx.fillText('Shift+E', 590, 390);
}

// ============================================================
// 4. RUNE ENCHANTMENT - 룬 인챈트 시스템 (12룬 x 4등급 그리드)
// ============================================================
function renderRuneSystem(){
  sfxV28('rune_slot');
  var body = v28CreateModal('🔮 룬 인챈트 시스템');
  var dk = isDarkV28();
  var canvas = document.createElement('canvas');
  canvas.width = 640; canvas.height = 400;
  canvas.style.cssText = 'max-width:100%;height:auto;border-radius:12px;background:'+(dk?'#0d0a18':'#faf8ff');
  body.appendChild(canvas);
  var ctx = canvas.getContext('2d');

  var runes = [
    {name:'화염룬',color:'#f44336',tiers:[10,25,50,100],effect:'공격+'},
    {name:'빙하룬',color:'#42A5F5',tiers:[8,20,45,90],effect:'방어+'},
    {name:'풍속룬',color:'#66BB6A',tiers:[12,28,55,110],effect:'속도+'},
    {name:'붉광룬',color:'#FFB300',tiers:[15,35,65,120],effect:'크리+'},
    {name:'어둠룬',color:'#5C6BC0',tiers:[7,18,40,85],effect:'HP+'},
    {name:'생명룬',color:'#E91E63',tiers:[9,22,48,95],effect:'회복+'},
    {name:'천둥룬',color:'#FDD835',tiers:[11,26,52,105],effect:'마비+'},
    {name:'대지룬',color:'#8D6E63',tiers:[6,16,38,80],effect:'인내+'},
    {name:'성수룬',color:'#26C6DA',tiers:[13,30,58,115],effect:'MP+'},
    {name:'포식룬',color:'#9CCC65',tiers:[10,24,50,100],effect:'회피+'},
    {name:'혼돈룬',color:'#AB47BC',tiers:[14,32,60,125],effect:'버프+'},
    {name:'시간룬',color:'#78909C',tiers:[8,20,42,88],effect:'쿨+'}
  ];
  var tierNames = ['일반','고급','희귀','전설'];
  var tierColors = ['#aaa','#5FA2FF','#AB47BC','#FFD700'];

  ctx.clearRect(0,0,640,400);
  ctx.fillStyle = dk?'#0d0a18':'#faf8ff';
  ctx.fillRect(0,0,640,400);
  ctx.fillStyle = dk?'#eee':'#333';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('룬 인챈트 시스템 (12룬 x 4등급)', 320, 28);

  var cellW = 45, cellH = 22;
  var startX = 185, startY = 58;
  ctx.font = '10px sans-serif';
  ctx.fillStyle = dk?'#aaa':'#666';
  tierNames.forEach(function(t, j){
    ctx.fillStyle = tierColors[j];
    ctx.fillText(t, startX + j*cellW + cellW/2, startY - 6);
  });

  runes.forEach(function(r, i){
    ctx.fillStyle = r.color;
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(r.name, startX - 10, startY + i*cellH + cellH/2 + 4);
    ctx.fillStyle = dk?'#aaa':'#888';
    ctx.font = '9px sans-serif';
    ctx.fillText(r.effect, startX - 80, startY + i*cellH + cellH/2 + 4);
    ctx.textAlign = 'center';
    r.tiers.forEach(function(val, j){
      var x = startX + j*cellW, y = startY + i*cellH;
      var alpha = 0.2 + (val/125)*0.6;
      ctx.fillStyle = tierColors[j] + Math.round(alpha*255).toString(16).padStart(2,'0');
      ctx.fillRect(x+1, y+1, cellW-2, cellH-2);
      ctx.strokeStyle = dk?'rgba(255,255,255,.08)':'rgba(0,0,0,.04)';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(x+1, y+1, cellW-2, cellH-2);
      ctx.fillStyle = dk?'#fff':'#333';
      ctx.font = '10px sans-serif';
      ctx.fillText('+'+val, x+cellW/2, y+cellH/2+4);
    });
  });

  var combos = ['화염+천둥 = 폭발룬 (x1.5)','빙하+대지 = 불침룬 (x1.4)','풍속+시간 = 바람룬 (x1.3)','붉광+어둠 = 황혼룬 (x1.6)'];
  ctx.fillStyle = dk?'#eee':'#333';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('룬 조합 보너스:', 400, 80);
  combos.forEach(function(c, i){
    ctx.fillStyle = dk?'#ccc':'#555';
    ctx.font = '10px sans-serif';
    ctx.fillText(c, 400, 98 + i*16);
  });
  ctx.fillStyle = dk?'#888':'#aaa';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('Shift+R', 610, 390);
}

// ============================================================
// 5. MOUNT COLLECTION - 탈것 도감 (10탈것 x 5스탯 Radar)
// ============================================================
function renderMountCollection(){
  sfxV28('mount_ride');
  var body = v28CreateModal('🐴 탈것 도감');
  var dk = isDarkV28();
  var canvas = document.createElement('canvas');
  canvas.width = 620; canvas.height = 400;
  canvas.style.cssText = 'max-width:100%;height:auto;border-radius:12px;background:'+(dk?'#0a1510':'#f5fff8');
  body.appendChild(canvas);
  var ctx = canvas.getContext('2d');

  var mounts = [
    {name:'무지개망아지',stats:[90,60,40,70,85],color:'#FF5FA2'},
    {name:'빛나는유니콘',stats:[70,95,80,60,75],color:'#AB47BC'},
    {name:'봉황페가수스',stats:[85,80,90,55,70],color:'#FF7043'},
    {name:'하늘드래곤',stats:[95,85,75,80,65],color:'#42A5F5'},
    {name:'별빛사슴',stats:[75,70,85,90,80],color:'#FFD54F'},
    {name:'얼음늑대',stats:[80,75,65,85,90],color:'#78909C'},
    {name:'불꽃불사조',stats:[90,65,95,50,60],color:'#f44336'},
    {name:'바람그리펰',stats:[65,90,70,75,95],color:'#4CAF50'},
    {name:'수정거북이',stats:[50,95,40,95,85],color:'#26C6DA'},
    {name:'천둥호랑이',stats:[85,80,88,65,78],color:'#FDD835'}
  ];
  var statLabels = ['속도','방어','공격보너스','회복','친밀도'];
  var sel = v28Load('v28_mount_sel', 0);

  ctx.clearRect(0,0,620,400);
  ctx.fillStyle = dk?'#0a1510':'#f5fff8';
  ctx.fillRect(0,0,620,400);
  ctx.fillStyle = dk?'#eee':'#333';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('탈것 도감 - '+mounts[sel].name, 310, 28);

  var cx = 310, cy = 200, radius = 120;
  var angles = statLabels.map(function(_,i){ return -Math.PI/2 + (Math.PI*2/statLabels.length)*i; });
  for(var ring = 5; ring >= 1; ring--){
    ctx.beginPath();
    var rr = radius * ring / 5;
    angles.forEach(function(a, i){
      var px = cx + Math.cos(a)*rr, py = cy + Math.sin(a)*rr;
      if(i===0) ctx.moveTo(px,py); else ctx.lineTo(px,py);
    });
    ctx.closePath();
    ctx.strokeStyle = dk?'rgba(255,255,255,.08)':'rgba(0,0,0,.05)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  statLabels.forEach(function(l, i){
    var a = angles[i];
    var lx = cx + Math.cos(a)*(radius+20), ly = cy + Math.sin(a)*(radius+20);
    ctx.fillStyle = dk?'#aaa':'#666';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(l, lx, ly);
  });

  var m = mounts[sel];
  ctx.beginPath();
  m.stats.forEach(function(s, i){
    var a = angles[i], r = radius * s / 100;
    var px = cx + Math.cos(a)*r, py = cy + Math.sin(a)*r;
    if(i===0) ctx.moveTo(px,py); else ctx.lineTo(px,py);
  });
  ctx.closePath();
  ctx.fillStyle = m.color+'44';
  ctx.fill();
  ctx.strokeStyle = m.color;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  m.stats.forEach(function(s, i){
    var a = angles[i], r = radius * s / 100;
    var px = cx + Math.cos(a)*r, py = cy + Math.sin(a)*r;
    ctx.beginPath();
    ctx.arc(px, py, 4, 0, Math.PI*2);
    ctx.fillStyle = m.color;
    ctx.fill();
  });

  ctx.textBaseline = 'alphabetic';
  var listX = 30;
  ctx.fillStyle = dk?'#eee':'#333';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'left';
  mounts.forEach(function(mt, i){
    ctx.fillStyle = i===sel ? mt.color : (dk?'#888':'#aaa');
    ctx.fillText((i===sel?'▶ ':'')+mt.name, listX, 55 + i*16);
  });

  var avg = Math.round(m.stats.reduce(function(a,b){return a+b;},0)/m.stats.length);
  var grade = avg>=85?'S':avg>=70?'A':avg>=55?'B':'C';
  ctx.fillStyle = {S:'#FFD700',A:'#FF5FA2',B:'#5FA2FF',C:'#888'}[grade];
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(grade, 30, 380);
  ctx.fillStyle = dk?'#aaa':'#666';
  ctx.font = '11px sans-serif';
  ctx.fillText('종합: '+avg+'%', 55, 380);
  ctx.fillStyle = dk?'#888':'#aaa';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('클릭: 탈것 선택 | Shift+T', 590, 390);

  canvas.addEventListener('click', function(){
    sel = (sel+1) % mounts.length;
    v28Save('v28_mount_sel', sel);
    sfxV28('mount_bond');
    renderMountCollection();
  });
}

// ============================================================
// 6. ARENA TOURNAMENT - 아레나 토너먼트 (8라운드 대진표)
// ============================================================
function renderArenaTournament(){
  sfxV28('arena_start');
  var body = v28CreateModal('⚔️ 아레나 토너먼트');
  var dk = isDarkV28();
  var canvas = document.createElement('canvas');
  canvas.width = 620; canvas.height = 400;
  canvas.style.cssText = 'max-width:100%;height:auto;border-radius:12px;background:'+(dk?'#1a0a10':'#fff5f8');
  body.appendChild(canvas);
  var ctx = canvas.getContext('2d');

  var fighters = ['로미','하캄핑','바로핑','해핑','차핑','아자핑','라라핑','무지핑'];
  var fColors = ['#FF5FA2','#FFB8D9','#5FA2FF','#4DB6AC','#AB47BC','#FF7043','#FFD54F','#78909C'];
  var results = v28Load('v28_arena', null);
  if(!results){
    results = {
      r1:[0,3,4,6],
      r2:[0,4],
      champion:0
    };
    v28Save('v28_arena', results);
  }

  ctx.clearRect(0,0,620,400);
  ctx.fillStyle = dk?'#1a0a10':'#fff5f8';
  ctx.fillRect(0,0,620,400);
  ctx.fillStyle = dk?'#eee':'#333';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('아레나 토너먼트 대진표', 310, 28);

  var cols = [80, 230, 380, 530];
  var matchY = [[60,110,200,250],[100,225],[170]];

  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = dk?'#aaa':'#888';
  ctx.fillText('8강', cols[0], 48);
  ctx.fillText('4강', cols[1], 48);
  ctx.fillText('결승', cols[2], 48);
  ctx.fillText('챔피언', cols[3], 48);

  fighters.forEach(function(f, i){
    var y = 65 + i * 40;
    ctx.fillStyle = fColors[i]+'44';
    ctx.fillRect(cols[0]-45, y-12, 90, 24);
    ctx.strokeStyle = fColors[i];
    ctx.lineWidth = 1.5;
    ctx.strokeRect(cols[0]-45, y-12, 90, 24);
    ctx.fillStyle = dk?'#eee':'#333';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(f, cols[0], y+4);
  });

  results.r1.forEach(function(wi, i){
    var y = matchY[0][i] || 100 + i*80;
    ctx.strokeStyle = dk?'rgba(255,255,255,.15)':'rgba(0,0,0,.08)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(cols[0]+50, 65+wi*40); ctx.lineTo(cols[1], y+60); ctx.stroke();
    ctx.fillStyle = fColors[wi]+'44';
    ctx.fillRect(cols[1]-45, y+48, 90, 24);
    ctx.strokeStyle = fColors[wi];
    ctx.strokeRect(cols[1]-45, y+48, 90, 24);
    ctx.fillStyle = dk?'#eee':'#333';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText(fighters[wi], cols[1], y+64);
  });

  results.r2.forEach(function(wi, i){
    var y = 145 + i*120;
    ctx.fillStyle = fColors[wi]+'44';
    ctx.fillRect(cols[2]-45, y, 90, 24);
    ctx.strokeStyle = fColors[wi];
    ctx.lineWidth = 1.5;
    ctx.strokeRect(cols[2]-45, y, 90, 24);
    ctx.fillStyle = dk?'#eee':'#333';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText(fighters[wi], cols[2], y+16);
  });

  var ch = results.champion;
  ctx.fillStyle = '#FFD700'+'44';
  ctx.fillRect(cols[3]-50, 155, 100, 30);
  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(cols[3]-50, 155, 100, 30);
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('🏆 '+fighters[ch], cols[3], 175);

  ctx.fillStyle = dk?'#aaa':'#666';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('클릭하여 신규 토너먼트 시작', 30, 360);
  ctx.fillStyle = dk?'#888':'#aaa';
  ctx.textAlign = 'right';
  ctx.fillText('Shift+Y', 590, 390);

  canvas.addEventListener('click', function(){
    var shuffled = fighters.map(function(_,i){return i;}).sort(function(){return Math.random()-0.5;});
    var nr1 = [];
    for(var i=0;i<8;i+=2) nr1.push(Math.random()>0.5?shuffled[i]:shuffled[i+1]);
    var nr2 = [];
    for(var j=0;j<4;j+=2) nr2.push(Math.random()>0.5?nr1[j]:nr1[j+1]);
    results = {r1:nr1,r2:nr2,champion:Math.random()>0.5?nr2[0]:nr2[1]};
    v28Save('v28_arena', results);
    sfxV28('arena_win');
    renderArenaTournament();
  });
}

// ============================================================
// 7. CRAFTING RECIPE BOOK - 제작 레시피북 (15레시피 x 재료 바차트)
// ============================================================
function renderRecipeBook(){
  sfxV28('craft_mix');
  var body = v28CreateModal('📖 제작 레시피북');
  var dk = isDarkV28();
  var canvas = document.createElement('canvas');
  canvas.width = 620; canvas.height = 400;
  canvas.style.cssText = 'max-width:100%;height:auto;border-radius:12px;background:'+(dk?'#180d08':'#fff8f0');
  body.appendChild(canvas);
  var ctx = canvas.getContext('2d');

  var recipes = [
    {name:'회복포션',mats:[3,2,0,1],tier:1,color:'#4CAF50'},
    {name:'공격부적',mats:[0,4,1,2],tier:1,color:'#f44336'},
    {name:'방어부적',mats:[1,0,4,2],tier:1,color:'#42A5F5'},
    {name:'속도부적',mats:[2,1,0,4],tier:1,color:'#66BB6A'},
    {name:'마나엘릭서',mats:[4,3,2,1],tier:2,color:'#AB47BC'},
    {name:'피닉스깃털',mats:[3,4,3,2],tier:2,color:'#FF7043'},
    {name:'별빛반지',mats:[2,3,4,3],tier:2,color:'#FFD54F'},
    {name:'비닝아뮨',mats:[1,2,3,5],tier:2,color:'#78909C'},
    {name:'전설의검',mats:[5,4,3,5],tier:3,color:'#FFD700'},
    {name:'수호자방패',mats:[3,5,5,4],tier:3,color:'#26C6DA'},
    {name:'마법지팡이',mats:[4,5,4,5],tier:3,color:'#E91E63'},
    {name:'신성헬멧',mats:[5,3,5,4],tier:3,color:'#FDD835'},
    {name:'천사의날개',mats:[5,5,5,5],tier:4,color:'#FFD700'},
    {name:'혹성의아뮨',mats:[5,5,4,5],tier:4,color:'#AB47BC'},
    {name:'청롱의깃털',mats:[4,5,5,5],tier:4,color:'#42A5F5'}
  ];
  var matNames = ['마법석','별가루','바람정수','불꽃심'];
  var matColors = ['#AB47BC','#FFD54F','#66BB6A','#f44336'];
  var tierLabels = ['일반','고급','희귀','전설'];

  ctx.clearRect(0,0,620,400);
  ctx.fillStyle = dk?'#180d08':'#fff8f0';
  ctx.fillRect(0,0,620,400);
  ctx.fillStyle = dk?'#eee':'#333';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('제작 레시피북 (15종 아이템)', 310, 28);

  var barH = 18, gap = 4, startY = 50;
  recipes.forEach(function(r, i){
    var y = startY + i*(barH+gap);
    ctx.fillStyle = r.color;
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('['+tierLabels[r.tier-1]+'] '+r.name, 140, y+barH/2+3);
    var totalMat = r.mats.reduce(function(a,b){return a+b;},0);
    var bx = 150;
    r.mats.forEach(function(m, j){
      var w = (m/totalMat) * 400;
      ctx.fillStyle = matColors[j]+(dk?'cc':'99');
      ctx.fillRect(bx, y, w, barH);
      if(w > 25){
        ctx.fillStyle = dk?'#fff':'#333';
        ctx.font = '8px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(m, bx+w/2, y+barH/2+3);
      }
      bx += w;
    });
  });
  ctx.textAlign = 'left';
  matNames.forEach(function(mn, i){
    ctx.fillStyle = matColors[i];
    ctx.fillRect(150 + i*110, 380, 10, 10);
    ctx.fillStyle = dk?'#ccc':'#555';
    ctx.font = '10px sans-serif';
    ctx.fillText(mn, 163 + i*110, 390);
  });
  ctx.fillStyle = dk?'#888':'#aaa';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('Shift+U', 590, 390);
}

// ============================================================
// 8. COMPREHENSIVE GROWTH DASHBOARD - 종합 성장 대시보드 (8KPI 반원게이지)
// ============================================================
function renderGrowthDashboard(){
  sfxV28('dash28_calc');
  var body = v28CreateModal('📈 종합 성장 대시보드');
  var dk = isDarkV28();
  var canvas = document.createElement('canvas');
  canvas.width = 620; canvas.height = 400;
  canvas.style.cssText = 'max-width:100%;height:auto;border-radius:12px;background:'+(dk?'#0d0a18':'#f8f5ff');
  body.appendChild(canvas);
  var ctx = canvas.getContext('2d');

  var kpis = [
    {label:'전투력',value:78,color:'#f44336'},
    {label:'탐험도',value:72,color:'#FF7043'},
    {label:'수집력',value:85,color:'#FFD54F'},
    {label:'사교력',value:68,color:'#4CAF50'},
    {label:'전략력',value:74,color:'#42A5F5'},
    {label:'성장속도',value:82,color:'#AB47BC'},
    {label:'업적달성',value:70,color:'#FF5FA2'},
    {label:'종합등급',value:76,color:'#5FA2FF'}
  ];

  ctx.clearRect(0,0,620,400);
  ctx.fillStyle = dk?'#0d0a18':'#f8f5ff';
  ctx.fillRect(0,0,620,400);
  ctx.fillStyle = dk?'#eee':'#333';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('종합 성장 대시보드 (8KPI)', 310, 28);

  var cols = 4, rows = 2;
  var gW = 130, gH = 150;
  var startX = 30, startY = 50;

  kpis.forEach(function(k, i){
    var col = i % cols, row = Math.floor(i / cols);
    var cx = startX + col*(gW+10) + gW/2;
    var cy = startY + row*(gH+15) + gH/2 + 20;
    var r = 48;
    ctx.beginPath();
    ctx.arc(cx, cy, r, Math.PI, 0, false);
    ctx.strokeStyle = dk?'rgba(255,255,255,.08)':'rgba(0,0,0,.05)';
    ctx.lineWidth = 12;
    ctx.stroke();
    var endAngle = Math.PI + (Math.PI * k.value / 100);
    ctx.beginPath();
    ctx.arc(cx, cy, r, Math.PI, endAngle, false);
    ctx.strokeStyle = k.color;
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.lineCap = 'butt';
    ctx.fillStyle = dk?'#eee':'#333';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(k.value+'%', cx, cy-2);
    var grade = k.value>=85?'S':k.value>=70?'A':k.value>=55?'B':'C';
    ctx.fillStyle = k.color;
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(grade, cx, cy+18);
    ctx.fillStyle = dk?'#aaa':'#666';
    ctx.font = '11px sans-serif';
    ctx.fillText(k.label, cx, cy+38);
  });

  var total = 0; kpis.forEach(function(k){total+=k.value;});
  var totalAvg = Math.round(total/kpis.length);
  var totalGrade = totalAvg>=85?'S':totalAvg>=70?'A':totalAvg>=55?'B':'C';
  ctx.fillStyle = {S:'#FFD700',A:'#FF5FA2',B:'#5FA2FF',C:'#888'}[totalGrade];
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('종합: '+totalAvg+'% ('+totalGrade+'등급)', 310, 395);
  ctx.fillStyle = dk?'#888':'#aaa';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('Shift+I', 590, 390);
}

// ============================================================
// QUIZ v28 - 15 questions
// ============================================================
function renderV28Quiz(){
  sfxV28('v28_quiz');
  var body = v28CreateModal('❓ 하캄핑 퀴즈 v28');
  var dk = isDarkV28();

  var questions = [
    {q:'재능 트리에서 하캄핑의 대표 능력은?',a:['사랑파동','무관심','돌파가르기','차원문'],c:0},
    {q:'봄 계절에 가장 강화되는 전투 효과는?',a:['공격력','속도','방어력','회복력'],c:1},
    {q:'길드 시스템에서 가장 많은 회원을 보유한 길드는?',a:['사랑의기사단','별빛의마법사','철벽의수비대','용기의수호자'],c:0},
    {q:'화염룬과 천둥룬을 조합하면?',a:['불침룬','폭발룬','바람룬','황혼룬'],c:1},
    {q:'하늘드래곤 탈것의 가장 높은 스탯은?',a:['방어','속도','친밀도','회복'],c:1},
    {q:'아레나 토너먼트의 최종 우승자 칭호는?',a:['챔피언','레전드','히어로','마스터'],c:0},
    {q:'전설 등급 제작 아이템에 필요한 최소 재료 수는?',a:['12개','15개','17개','20개'],c:2},
    {q:'바로핑의 가장 높은 재능 마스터리는?',a:['방어력 85%','힘강화 92%','돌파가르기 78%','에너지방벽 70%'],c:1},
    {q:'여름 계절에 가장 높은 배율의 효과는?',a:['공격력 x1.4','방어력 x1.4','속도 x1.3','회복력 x1.2'],c:0},
    {q:'별빛의마법사 길드의 최고 보너스는?',a:['공격보너스','드롭확률보너스','경험치보너스','방어보너스'],c:1},
    {q:'혹성의아뮨를 만드는데 필요한 총 재료 수는?',a:['17개','18개','19개','20개'],c:2},
    {q:'수정거북이 탈것의 가장 낮은 스탯은?',a:['공격보너스 40','속도 50','방어 95','친밀도 85'],c:1},
    {q:'차핑의 대표 재능은?',a:['차원문','순간이동','시간정지','미래예지'],c:1},
    {q:'신성헬멧 제작에 가장 많이 필요한 재료는?',a:['마법석','별가루','바람정수','불꽃심'],c:0},
    {q:'길드 동맹 관계가 가장 많은 길드는?',a:['사랑의기사단','철벽의수비대','별빛의마법사','자연의수호자'],c:0}
  ];

  var state = v28Load('v28_quiz', {idx:0,score:0,done:false});
  if(state.done) state = {idx:0,score:0,done:false};

  function renderQ(){
    body.innerHTML = '';
    if(state.idx >= questions.length){
      state.done = true;
      v28Save('v28_quiz', state);
      var pct = Math.round(state.score/questions.length*100);
      var grade = pct>=90?'S':pct>=70?'A':pct>=50?'B':'C';
      body.innerHTML = '<div style="text-align:center;padding:30px"><div style="font-size:48px;margin-bottom:12px">'+(pct>=70?'🎉':'💪')+'</div><div style="font-size:20px;font-weight:800;color:'+(dk?'#FFB8D9':'#FF5FA2')+'">'+state.score+'/'+questions.length+' 정답 ('+pct+'%)</div><div style="font-size:36px;font-weight:900;color:'+(grade==='S'?'#FFD700':'#FF5FA2')+';margin-top:8px">'+grade+'등급</div></div>';
      sfxV28('dash28_rank');
      return;
    }
    var q = questions[state.idx];
    var wrap = document.createElement('div');
    wrap.innerHTML = '<div style="font-size:13px;color:'+(dk?'#aaa':'#888')+';margin-bottom:8px">Q'+(state.idx+1)+'/'+questions.length+'</div><div style="font-size:15px;font-weight:700;color:'+(dk?'#eee':'#333')+';margin-bottom:16px">'+q.q+'</div>';
    q.a.forEach(function(a, i){
      var btn = document.createElement('button');
      btn.textContent = a;
      btn.style.cssText = 'display:block;width:100%;padding:12px 16px;margin-bottom:8px;background:'+(dk?'rgba(255,255,255,.06)':'#f8f5ff')+';border:2px solid '+(dk?'rgba(255,255,255,.1)':'rgba(0,0,0,.06)')+';border-radius:12px;color:'+(dk?'#eee':'#333')+';font-size:13px;font-weight:600;cursor:pointer;text-align:left;transition:all .2s';
      btn.addEventListener('mouseenter', function(){ this.style.borderColor='#FF5FA2'; });
      btn.addEventListener('mouseleave', function(){ this.style.borderColor=dk?'rgba(255,255,255,.1)':'rgba(0,0,0,.06)'; });
      btn.addEventListener('click', function(){
        if(i===q.c){ state.score++; sfxV28('talent_unlock'); showToastV28('✅ 정답!'); }
        else { sfxV28('season_switch'); showToastV28('❌ 오답 - 정답: '+q.a[q.c]); }
        state.idx++;
        v28Save('v28_quiz', state);
        setTimeout(renderQ, 800);
      });
      wrap.appendChild(btn);
    });
    body.appendChild(wrap);
  }
  renderQ();
}

// ============================================================
// ACHIEVEMENTS v28 - 12 new achievements (262 -> 274)
// ============================================================
var V28_ACHIEVEMENTS = [
  {id:'v28_talent_explorer',name:'재능탐험가',desc:'재능 트리를 처음으로 열었다',check:function(){return v28Load('v28_talent_char',null)!==null;}},
  {id:'v28_season_master',name:'계절전사',desc:'계절전투 시스템을 확인했다',check:function(){return v28Load('v28_season_viewed',false);}},
  {id:'v28_guild_leader',name:'길드리더',desc:'길드 시스템을 탐색했다',check:function(){return v28Load('v28_guild_viewed',false);}},
  {id:'v28_rune_master',name:'룬마스터',desc:'룬 인챈트 시스템을 열었다',check:function(){return v28Load('v28_rune_viewed',false);}},
  {id:'v28_mount_rider',name:'탈것수집가',desc:'탈것 3종 이상 확인',check:function(){return v28Load('v28_mount_sel',0)>=2;}},
  {id:'v28_arena_champion',name:'아레나챔피언',desc:'아레나 토너먼트 완료',check:function(){return v28Load('v28_arena',null)!==null;}},
  {id:'v28_recipe_scholar',name:'레시피학자',desc:'제작 레시피북을 열었다',check:function(){return v28Load('v28_recipe_viewed',false);}},
  {id:'v28_growth_analyst',name:'성장분석가',desc:'성장 대시보드를 확인했다',check:function(){return v28Load('v28_growth_viewed',false);}},
  {id:'v28_quiz_beginner',name:'퀴즈도전자v28',desc:'v28 퀴즈를 시작했다',check:function(){var s=v28Load('v28_quiz',null);return s&&s.idx>0;}},
  {id:'v28_quiz_master',name:'퀴즈마스터v28',desc:'v28 퀴즈 전문 정답',check:function(){var s=v28Load('v28_quiz',null);return s&&s.done&&s.score===15;}},
  {id:'v28_all_features',name:'v28완전정복',desc:'v28 모든 기능 확인',check:function(){return v28Load('v28_talent_char',null)!==null&&v28Load('v28_season_viewed',false)&&v28Load('v28_guild_viewed',false)&&v28Load('v28_rune_viewed',false)&&v28Load('v28_mount_sel',0)>=1&&v28Load('v28_arena',null)!==null&&v28Load('v28_recipe_viewed',false)&&v28Load('v28_growth_viewed',false);}},
  {id:'v28_dedicated',name:'헌신적모험가',desc:'v28 업적 10개 이상 달성',check:function(){var cnt=0;V28_ACHIEVEMENTS.forEach(function(a){if(a.id!=='v28_dedicated'){var u=v28Load('v28_ach_'+a.id,false);if(u)cnt++;}});return cnt>=10;}}
];

function checkV28Achievements(){
  V28_ACHIEVEMENTS.forEach(function(a){
    var done = v28Load('v28_ach_'+a.id, false);
    if(!done && a.check()){
      v28Save('v28_ach_'+a.id, true);
      sfxV28('talent_unlock');
      showToastV28('🏆 업적 달성: '+a.name);
    }
  });
}

var _origRenderSeason = renderSeasonBattle;
renderSeasonBattle = function(){ v28Save('v28_season_viewed',true); _origRenderSeason(); checkV28Achievements(); };
var _origRenderGuild = renderGuildSystem;
renderGuildSystem = function(){ v28Save('v28_guild_viewed',true); _origRenderGuild(); checkV28Achievements(); };
var _origRenderRune = renderRuneSystem;
renderRuneSystem = function(){ v28Save('v28_rune_viewed',true); _origRenderRune(); checkV28Achievements(); };
var _origRenderRecipe = renderRecipeBook;
renderRecipeBook = function(){ v28Save('v28_recipe_viewed',true); _origRenderRecipe(); checkV28Achievements(); };
var _origRenderGrowth = renderGrowthDashboard;
renderGrowthDashboard = function(){ v28Save('v28_growth_viewed',true); _origRenderGrowth(); checkV28Achievements(); };

setInterval(checkV28Achievements, 5000);


// ============================================================
// NAV BUTTONS - Append to existing bottom bar (UI rule compliant)
// ============================================================
function addV28NavButtons(){
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
    {label:'🌳 재능트리',fn:renderTalentTree,key:'Shift+Q'},
    {label:'🍃 계절전투',fn:renderSeasonBattle,key:'Shift+W'},
    {label:'🏰 길드',fn:renderGuildSystem,key:'Shift+E'},
    {label:'🔮 룬인챈트',fn:renderRuneSystem,key:'Shift+R'},
    {label:'🐴 탈것도감',fn:renderMountCollection,key:'Shift+T'},
    {label:'⚔️ 아레나',fn:renderArenaTournament,key:'Shift+Y'},
    {label:'📖 레시피북',fn:renderRecipeBook,key:'Shift+U'},
    {label:'📈 성장대시',fn:renderGrowthDashboard,key:'Shift+I'},
    {label:'❓ 퀴즈v28',fn:renderV28Quiz,key:'Shift+0'}
  ];

  if(bottomBar){
    navItems.forEach(function(item){
      var btn = document.createElement('button');
      btn.textContent = item.label;
      btn.style.cssText = 'padding:6px 10px;margin:2px;background:linear-gradient(135deg,#AB47BC,#E040FB);color:#fff;border:none;border-radius:10px;font-size:10px;font-weight:700;cursor:pointer;white-space:nowrap';
      btn.addEventListener('click', function(){ sfxV28('v28_nav'); item.fn(); });
      bottomBar.appendChild(btn);
    });
  }

  document.addEventListener('keydown', function(e){
    if(!e.shiftKey) return;
    if(e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    var keyMap = {
      'Q':renderTalentTree, 'W':renderSeasonBattle, 'E':renderGuildSystem,
      'R':renderRuneSystem, 'T':renderMountCollection, 'Y':renderArenaTournament,
      'U':renderRecipeBook, 'I':renderGrowthDashboard, '0':renderV28Quiz
    };
    var fn = keyMap[e.key.toUpperCase ? e.key.toUpperCase() : e.key];
    if(fn){ e.preventDefault(); sfxV28('v28_nav'); fn(); }
  });
}

if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', addV28NavButtons);
} else {
  addV28NavButtons();
}

})();

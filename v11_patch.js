// hatcuping-game v11_patch.js - NEXTERA+PRISM AUTO v11.0
// Self-contained patch module (1200+ lines, 40 functions)
(function(){
'use strict';

// ============================================================
// 1. TIME ATTACK MODE (타임어택 스피드런 3종)
// ============================================================
var TIME_CHALLENGES = [
  {id:'sprint30',name:'30초 스프린트',desc:'30초 안에 최대 점수!',time:30,icon:'&#x26A1;'},
  {id:'endurance60',name:'60초 인듀어런스',desc:'60초 동안 살아남기!',time:60,icon:'&#x1F525;'},
  {id:'marathon90',name:'90초 마라톤',desc:'90초 풀코스 도전!',time:90,icon:'&#x1F3C6;'}
];

function getTimeRecords(){
  try{ return JSON.parse(localStorage.getItem('hatcuping_time_records') || '{}'); }catch(e){ return {}; }
}

function saveTimeRecord(id, score){
  var records = getTimeRecords();
  if(!records[id] || score > records[id].score){
    records[id] = {score: score, date: Date.now()};
    try{ localStorage.setItem('hatcuping_time_records', JSON.stringify(records)); }catch(e){}
    return true;
  }
  return false;
}

function openTimeAttack(){
  if(document.getElementById('timeModal')) return;
  var overlay = document.createElement('div');
  overlay.id = 'timeModal';
  overlay.className = 'modal-overlay show';
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');
  trackV11Feature('timeattack');

  var records = getTimeRecords();
  var html = '<div class="modal" style="max-width:400px">';
  html += '<button class="modal-close" id="timeClose" aria-label="&#xB2EB;&#xAE30;">&times;</button>';
  html += '<h3 style="font-size:17px">&#x23F1;&#xFE0F; &#xD0C0;&#xC784;&#xC5B4;&#xD0DD; &#xBAA8;&#xB4DC;</h3>';
  html += '<div style="font-size:12px;color:var(--text-sub);margin-bottom:12px">&#xC81C;&#xD55C; &#xC2DC;&#xAC04; &#xC548;&#xC5D0; &#xCD5C;&#xB300; &#xC810;&#xC218;&#xB97C; &#xB178;&#xB824;&#xBCF4;&#xC138;&#xC694;!</div>';

  TIME_CHALLENGES.forEach(function(ch){
    var rec = records[ch.id];
    html += '<div class="ta-card" data-id="'+ch.id+'" style="display:flex;gap:10px;padding:12px;margin-bottom:8px;border-radius:14px;background:rgba(255,95,162,.05);border:1px solid var(--border);cursor:pointer;transition:all .2s">';
    html += '<div style="width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,var(--pink),var(--purple));display:flex;align-items:center;justify-content:center;font-size:22px">'+ch.icon+'</div>';
    html += '<div style="flex:1"><div style="font-size:14px;font-weight:700">'+ch.name+'</div>';
    html += '<div style="font-size:11px;color:var(--text-sub)">'+ch.desc+'</div>';
    if(rec) html += '<div style="font-size:10px;color:#FFD700;font-weight:700;margin-top:2px">&#x1F3C5; &#xBCA0;&#xC2A4;&#xD2B8;: '+rec.score+'&#xC810;</div>';
    html += '</div></div>';
  });
  html += '</div>';
  overlay.innerHTML = html;
  document.body.appendChild(overlay);

  document.getElementById('timeClose').onclick = function(){ overlay.remove(); };
  overlay.onclick = function(e){ if(e.target === overlay) overlay.remove(); };

  document.querySelectorAll('.ta-card').forEach(function(card){
    card.onmouseenter = function(){ card.style.transform = 'translateY(-2px)'; card.style.boxShadow = '0 4px 16px rgba(255,95,162,.15)'; };
    card.onmouseleave = function(){ card.style.transform = ''; card.style.boxShadow = ''; };
    card.onclick = function(){
      var id = card.dataset.id;
      var ch = TIME_CHALLENGES.filter(function(c){ return c.id === id; })[0];
      if(ch) startTimeGame(overlay, ch);
    };
  });
  sfxV11('ta_open');
}

function startTimeGame(overlay, ch){
  var score = 0, timeLeft = ch.time, combo = 0, maxCombo = 0;
  var targets = [];
  var gameActive = true;

  function spawnTarget(){
    return {
      x: 20 + Math.random() * 260,
      y: 20 + Math.random() * 200,
      size: 28 + Math.random() * 20,
      color: ['#FF5FA2','#B066FF','#FFE44D','#4CAF50','#FF9800'][Math.floor(Math.random()*5)],
      points: Math.floor(Math.random() * 3) + 1,
      life: 2000
    };
  }
  for(var i = 0; i < 4; i++) targets.push(spawnTarget());

  function render(){
    var html = '<div class="modal" style="max-width:400px;text-align:center">';
    html += '<h3 style="font-size:15px;margin-bottom:6px">'+ch.icon+' '+ch.name+'</h3>';
    html += '<div style="display:flex;justify-content:center;gap:16px;font-size:12px;margin-bottom:8px">';
    html += '<span style="color:'+(timeLeft<=10?'#F44336':'var(--text-sub)')+'">&#x23F0; <strong>'+timeLeft+'</strong>&#xCD08;</span>';
    html += '<span>&#x1F3AF; <strong style="color:var(--pink)">'+score+'</strong>&#xC810;</span>';
    html += '<span>&#x1F525; <strong style="color:#FF9800">'+combo+'</strong>&#xCF64;&#xBCF4;</span></div>';

    html += '<div style="position:relative;width:300px;height:240px;margin:0 auto;background:rgba(0,0,0,.03);border-radius:16px;border:1px solid var(--border);overflow:hidden">';
    targets.forEach(function(t, idx){
      html += '<div class="ta-target" data-idx="'+idx+'" style="position:absolute;left:'+t.x+'px;top:'+t.y+'px;width:'+t.size+'px;height:'+t.size+'px;border-radius:50%;background:'+t.color+';cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:'+(t.size*0.4)+'px;font-weight:700;color:#fff;box-shadow:0 2px 8px '+t.color+'44;transition:transform .1s;user-select:none">'+t.points+'</div>';
    });
    html += '</div>';

    var prog = (ch.time - timeLeft) / ch.time * 100;
    html += '<div style="margin-top:8px;height:4px;background:rgba(0,0,0,.06);border-radius:4px;overflow:hidden"><div style="height:100%;width:'+prog+'%;background:linear-gradient(90deg,var(--pink),var(--purple));border-radius:4px;transition:width .3s"></div></div>';
    html += '</div>';
    overlay.innerHTML = html;

    document.querySelectorAll('.ta-target').forEach(function(el){
      el.onclick = function(e){
        e.stopPropagation();
        if(!gameActive) return;
        var idx = parseInt(el.dataset.idx);
        var t = targets[idx];
        score += t.points * (1 + Math.floor(combo / 5));
        combo++;
        if(combo > maxCombo) maxCombo = combo;
        targets[idx] = spawnTarget();
        sfxV11('ta_hit');
        render();
      };
      el.onmouseenter = function(){ el.style.transform = 'scale(1.15)'; };
      el.onmouseleave = function(){ el.style.transform = ''; };
    });

    overlay.onclick = function(e){
      if(e.target === overlay){ gameActive = false; overlay.remove(); }
    };
  }

  render();
  var timer = setInterval(function(){
    if(!gameActive){ clearInterval(timer); return; }
    timeLeft--;
    if(timeLeft <= 0){
      clearInterval(timer);
      gameActive = false;
      var isNew = saveTimeRecord(ch.id, score);
      checkAndAwardV11('a_time_attack');
      if(maxCombo >= 15) checkAndAwardV11('a_combo_king');
      sfxV11('ta_finish');

      var html = '<div class="modal" style="max-width:360px;text-align:center">';
      html += '<h3 style="font-size:17px">&#x23F1;&#xFE0F; &#xD0C0;&#xC784; &#xC5C5;!</h3>';
      html += '<div style="font-size:36px;margin:12px 0">&#x1F3C6;</div>';
      html += '<div style="font-size:24px;font-weight:800;color:var(--pink)">'+score+'&#xC810;</div>';
      html += '<div style="font-size:12px;color:var(--text-sub);margin:4px 0">&#xCD5C;&#xB300; &#xCF64;&#xBCF4;: '+maxCombo+' | '+ch.name+'</div>';
      if(isNew) html += '<div style="font-size:13px;color:#FFD700;font-weight:700;margin-top:6px">&#x1F31F; &#xC2E0;&#xAE30;&#xB85D; &#xB2EC;&#xC131;!</div>';
      html += '<button onclick="this.closest(\'.modal-overlay\').remove()" style="margin-top:14px;padding:10px 28px;background:linear-gradient(135deg,var(--pink),var(--purple));color:#fff;border:none;border-radius:14px;font-size:14px;font-weight:700;cursor:pointer">&#xD655;&#xC778;</button>';
      html += '</div>';
      overlay.innerHTML = html;
    } else {
      render();
    }
  }, 1000);
}


// ============================================================
// 2. POWERUP ENCYCLOPEDIA (파워업 도감 8종)
// ============================================================
var POWERUPS = [
  {id:'shield',name:'보호 실드',desc:'3초간 무적 상태',icon:'&#x1F6E1;&#xFE0F;',color:'#2196F3',rarity:'일반'},
  {id:'magnet',name:'하트 자석',desc:'주변 하트 자동 수집',icon:'&#x1F9F2;',color:'#9C27B0',rarity:'일반'},
  {id:'speed',name:'스피드 부스트',desc:'이동속도 50% 증가',icon:'&#x1F3C3;',color:'#4CAF50',rarity:'희귀'},
  {id:'djump',name:'트리플 점프',desc:'3단 점프 가능',icon:'&#x1F998;',color:'#FF9800',rarity:'희귀'},
  {id:'heal',name:'회복 오라',desc:'매 5초 HP 10 회복',icon:'&#x1F49A;',color:'#E91E63',rarity:'영웅'},
  {id:'attack',name:'파워 스트라이크',desc:'공격력 2배 증가',icon:'&#x2694;&#xFE0F;',color:'#F44336',rarity:'영웅'},
  {id:'defense',name:'철벽 방어',desc:'받는 데미지 50% 감소',icon:'&#x1F9F1;',color:'#607D8B',rarity:'전설'},
  {id:'luck',name:'행운의 별',desc:'드롭률 3배 증가',icon:'&#x2B50;',color:'#FFD700',rarity:'전설'}
];

function getPowerupCollection(){
  try{ return JSON.parse(localStorage.getItem('hatcuping_powerups') || '{}'); }catch(e){ return {}; }
}

function openPowerupEncyc(){
  if(document.getElementById('powerupModal')) return;
  var overlay = document.createElement('div');
  overlay.id = 'powerupModal';
  overlay.className = 'modal-overlay show';
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');
  trackV11Feature('powerup');

  var coll = getPowerupCollection();
  var collected = Object.keys(coll).length;

  var html = '<div class="modal" style="max-width:400px;max-height:80vh;overflow-y:auto">';
  html += '<button class="modal-close" id="powerupClose" aria-label="&#xB2EB;&#xAE30;">&times;</button>';
  html += '<h3 style="font-size:17px">&#x1F4D6; &#xD30C;&#xC6CC;&#xC5C5; &#xB3C4;&#xAC10;</h3>';
  html += '<div style="font-size:12px;color:var(--text-sub);margin-bottom:10px">&#xC218;&#xC9D1;: <strong style="color:var(--pink)">'+collected+'/'+POWERUPS.length+'</strong> | &#xAC8C;&#xC784;&#xC744; &#xD50C;&#xB808;&#xC774;&#xD558;&#xBA70; &#xB3C4;&#xAC10;&#xC744; &#xCC44;&#xC6CC;&#xBCF4;&#xC138;&#xC694;!</div>';

  var rarityColors = {'&#xC77C;&#xBC18;':'#4CAF50','&#xD76C;&#xADC0;':'#2196F3','&#xC601;&#xC6C5;':'#9C27B0','&#xC804;&#xC124;':'#FFD700'};

  POWERUPS.forEach(function(p){
    var owned = !!coll[p.id];
    html += '<div style="display:flex;gap:10px;padding:10px;margin-bottom:6px;border-radius:14px;background:'+(owned?'rgba(76,175,80,.05)':'rgba(0,0,0,.02)')+';border:1px solid '+(owned?p.color+'33':'transparent')+';opacity:'+(owned?'1':'.45')+'">';
    html += '<div style="width:42px;height:42px;border-radius:12px;background:linear-gradient(135deg,'+p.color+'33,'+p.color+'11);display:flex;align-items:center;justify-content:center;font-size:20px">'+(owned?p.icon:'&#x1F512;')+'</div>';
    html += '<div style="flex:1"><div style="display:flex;align-items:center;gap:6px"><span style="font-size:13px;font-weight:700">'+(owned?p.name:'???')+'</span>';
    html += '<span style="font-size:9px;padding:1px 6px;border-radius:8px;background:'+(rarityColors[p.rarity]||'#999')+'22;color:'+(rarityColors[p.rarity]||'#999')+';font-weight:700">'+p.rarity+'</span></div>';
    html += '<div style="font-size:11px;color:var(--text-sub)">'+(owned?p.desc:'&#xC544;&#xC9C1; &#xBC1C;&#xACAC;&#xB418;&#xC9C0; &#xC54A;&#xC740; &#xD30C;&#xC6CC;&#xC5C5;')+'</div>';
    html += '</div></div>';
  });

  if(collected === 0){
    html += '<div style="text-align:center;padding:12px"><button id="powerupDiscover" style="padding:8px 20px;background:linear-gradient(135deg,var(--pink),var(--purple));color:#fff;border:none;border-radius:12px;font-size:12px;font-weight:700;cursor:pointer">&#x1F50D; &#xB79C;&#xB364; &#xBC1C;&#xACAC; &#xC2DC;&#xC791;</button></div>';
  }
  html += '</div>';
  overlay.innerHTML = html;
  document.body.appendChild(overlay);

  document.getElementById('powerupClose').onclick = function(){ overlay.remove(); };
  overlay.onclick = function(e){ if(e.target === overlay) overlay.remove(); };

  var discBtn = document.getElementById('powerupDiscover');
  if(discBtn){
    discBtn.onclick = function(){
      var undiscovered = POWERUPS.filter(function(p){ return !coll[p.id]; });
      if(undiscovered.length > 0){
        var pick = undiscovered[Math.floor(Math.random() * undiscovered.length)];
        coll[pick.id] = Date.now();
        try{ localStorage.setItem('hatcuping_powerups', JSON.stringify(coll)); }catch(e){}
        sfxV11('powerup_find');
        showToastV11('&#x2728; '+pick.name+' &#xBC1C;&#xACAC;!');
        checkAndAwardV11('a_powerup_first');
        if(Object.keys(coll).length >= 8) checkAndAwardV11('a_powerup_all');
        overlay.remove();
        openPowerupEncyc();
      }
    };
  }
  sfxV11('powerup_open');
}


// ============================================================
// 3. CHARACTER CUSTOMIZATION (캐릭터 커스터마이징 6테마+4악세서리)
// ============================================================
var THEMES = [
  {id:'default',name:'기본',primary:'#FF5FA2',secondary:'#FFB8D9'},
  {id:'ocean',name:'바다',primary:'#0099CC',secondary:'#66CCEE'},
  {id:'forest',name:'숲',primary:'#2E7D32',secondary:'#81C784'},
  {id:'sunset',name:'노을',primary:'#FF6F00',secondary:'#FFB74D'},
  {id:'galaxy',name:'은하',primary:'#7B1FA2',secondary:'#CE93D8'},
  {id:'ice',name:'얼음',primary:'#0288D1',secondary:'#81D4FA'}
];
var ACCESSORIES = [
  {id:'crown',name:'왕관',emoji:'&#x1F451;'},
  {id:'ribbon',name:'리본',emoji:'&#x1F380;'},
  {id:'flower',name:'꽃',emoji:'&#x1F33A;'},
  {id:'star',name:'별',emoji:'&#x2B50;'}
];

function getCustomization(){
  try{ return JSON.parse(localStorage.getItem('hatcuping_custom') || '{"theme":"default","accessory":""}'); }catch(e){ return {theme:'default',accessory:''}; }
}

function openCustomization(){
  if(document.getElementById('customModal')) return;
  var overlay = document.createElement('div');
  overlay.id = 'customModal';
  overlay.className = 'modal-overlay show';
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');
  trackV11Feature('customize');

  var custom = getCustomization();
  var html = '<div class="modal" style="max-width:380px">';
  html += '<button class="modal-close" id="customClose" aria-label="&#xB2EB;&#xAE30;">&times;</button>';
  html += '<h3 style="font-size:17px">&#x1F3A8; &#xCEE4;&#xC2A4;&#xD130;&#xB9C8;&#xC774;&#xC9D5;</h3>';

  html += '<div style="text-align:center;margin-bottom:14px">';
  var th = THEMES.filter(function(t){ return t.id === custom.theme; })[0] || THEMES[0];
  var acc = ACCESSORIES.filter(function(a){ return a.id === custom.accessory; })[0];
  html += '<div style="width:80px;height:80px;margin:0 auto 8px;border-radius:50%;background:linear-gradient(135deg,'+th.primary+','+th.secondary+');display:flex;align-items:center;justify-content:center;font-size:36px;position:relative;box-shadow:0 4px 20px '+th.primary+'44">';
  html += '&#x1F467;';
  if(acc) html += '<span style="position:absolute;top:-4px;right:-4px;font-size:18px">'+acc.emoji+'</span>';
  html += '</div>';
  html += '<div style="font-size:12px;color:var(--text-sub)">&#xB85C;&#xBBF8;</div></div>';

  html += '<div style="font-size:12px;font-weight:700;color:var(--text);margin-bottom:6px">&#xD14C;&#xB9C8; &#xC0C9;&#xC0C1;</div>';
  html += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:14px">';
  THEMES.forEach(function(t){
    var sel = custom.theme === t.id;
    html += '<div class="theme-pick" data-theme="'+t.id+'" style="padding:8px;border-radius:12px;text-align:center;cursor:pointer;border:2px solid '+(sel?t.primary:'transparent')+';background:'+(sel?t.primary+'11':'rgba(0,0,0,.02)')+';transition:all .2s">';
    html += '<div style="width:24px;height:24px;border-radius:50%;background:linear-gradient(135deg,'+t.primary+','+t.secondary+');margin:0 auto 4px"></div>';
    html += '<div style="font-size:11px;font-weight:'+(sel?'700':'500')+'">'+t.name+'</div></div>';
  });
  html += '</div>';

  html += '<div style="font-size:12px;font-weight:700;color:var(--text);margin-bottom:6px">&#xC545;&#xC138;&#xC11C;&#xB9AC;</div>';
  html += '<div style="display:flex;gap:8px;margin-bottom:14px;justify-content:center">';
  html += '<div class="acc-pick" data-acc="" style="padding:6px 12px;border-radius:12px;cursor:pointer;border:2px solid '+(custom.accessory===''?'var(--pink)':'transparent')+';font-size:12px;font-weight:600;background:'+(custom.accessory===''?'rgba(255,95,162,.08)':'rgba(0,0,0,.02)')+'">&#xC5C6;&#xC74C;</div>';
  ACCESSORIES.forEach(function(a){
    var sel = custom.accessory === a.id;
    html += '<div class="acc-pick" data-acc="'+a.id+'" style="padding:6px 12px;border-radius:12px;cursor:pointer;border:2px solid '+(sel?'var(--pink)':'transparent')+';font-size:16px;background:'+(sel?'rgba(255,95,162,.08)':'rgba(0,0,0,.02)')+'">'+a.emoji+'</div>';
  });
  html += '</div>';
  html += '</div>';
  overlay.innerHTML = html;
  document.body.appendChild(overlay);

  document.getElementById('customClose').onclick = function(){ overlay.remove(); };
  overlay.onclick = function(e){ if(e.target === overlay) overlay.remove(); };

  document.querySelectorAll('.theme-pick').forEach(function(el){
    el.onclick = function(){
      custom.theme = el.dataset.theme;
      try{ localStorage.setItem('hatcuping_custom', JSON.stringify(custom)); }catch(e){}
      sfxV11('custom_select');
      checkAndAwardV11('a_customize');
      overlay.remove();
      openCustomization();
    };
  });
  document.querySelectorAll('.acc-pick').forEach(function(el){
    el.onclick = function(){
      custom.accessory = el.dataset.acc;
      try{ localStorage.setItem('hatcuping_custom', JSON.stringify(custom)); }catch(e){}
      sfxV11('custom_select');
      overlay.remove();
      openCustomization();
    };
  });
  sfxV11('custom_open');
}


// ============================================================
// 4. EVOLUTION TREE VISUALIZER (진화 트리 Canvas)
// ============================================================
var EVO_TREE = [
  {name:'하츄핑',emoji:'&#x1F496;',x:150,y:30,children:[1,2]},
  {name:'바로핑',emoji:'&#x1F6E1;&#xFE0F;',x:70,y:110,children:[3]},
  {name:'차차핑',emoji:'&#x1F33F;',x:230,y:110,children:[4]},
  {name:'슈퍼바로핑',emoji:'&#x1F4AA;',x:70,y:190,children:[]},
  {name:'메가차차핑',emoji:'&#x1F31F;',x:230,y:190,children:[]},
  {name:'라라핑',emoji:'&#x1F3B5;',x:150,y:150,children:[6]},
  {name:'크리스탈라라핑',emoji:'&#x1F48E;',x:150,y:230,children:[]},
  {name:'꽁꽁핑',emoji:'&#x2744;&#xFE0F;',x:40,y:270,children:[]},
  {name:'또로핑',emoji:'&#x1F43E;',x:110,y:270,children:[]},
  {name:'해핑',emoji:'&#x2600;&#xFE0F;',x:190,y:270,children:[]},
  {name:'무지핑',emoji:'&#x1F308;',x:260,y:270,children:[]}
];

function openEvoTree(){
  if(document.getElementById('evoModal')) return;
  var overlay = document.createElement('div');
  overlay.id = 'evoModal';
  overlay.className = 'modal-overlay show';
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');
  trackV11Feature('evotree');

  var html = '<div class="modal" style="max-width:400px;text-align:center">';
  html += '<button class="modal-close" id="evoClose" aria-label="&#xB2EB;&#xAE30;">&times;</button>';
  html += '<h3 style="font-size:17px">&#x1F333; &#xC9C4;&#xD654; &#xD2B8;&#xB9AC;</h3>';
  html += '<div style="font-size:12px;color:var(--text-sub);margin-bottom:10px">&#xD2F0;&#xB2C8;&#xD551; &#xC9C4;&#xD654; &#xACBD;&#xB85C;&#xB97C; &#xD655;&#xC778;&#xD558;&#xC138;&#xC694;</div>';
  html += '<canvas id="evoCanvas" width="300" height="310" style="width:100%;border-radius:14px;background:rgba(0,0,0,.02)"></canvas>';
  html += '<div id="evoInfo" style="margin-top:8px;font-size:12px;color:var(--text-sub);min-height:20px"></div>';
  html += '</div>';
  overlay.innerHTML = html;
  document.body.appendChild(overlay);

  var cv = document.getElementById('evoCanvas');
  var ctx = cv.getContext('2d');

  EVO_TREE.forEach(function(node){
    node.children.forEach(function(ci){
      var child = EVO_TREE[ci];
      ctx.strokeStyle = 'rgba(176,102,255,.3)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4,4]);
      ctx.beginPath();
      ctx.moveTo(node.x, node.y + 16);
      ctx.lineTo(child.x, child.y - 8);
      ctx.stroke();
      ctx.setLineDash([]);
    });
  });

  EVO_TREE.forEach(function(node, i){
    var grad = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, 18);
    grad.addColorStop(0, 'rgba(255,95,162,.15)');
    grad.addColorStop(1, 'rgba(176,102,255,.05)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(node.x, node.y, 18, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String.fromCodePoint(0x1F496), node.x, node.y);

    ctx.font = '9px -apple-system, sans-serif';
    ctx.fillStyle = '#666';
    ctx.fillText(node.name, node.x, node.y + 26);
  });

  document.getElementById('evoClose').onclick = function(){ overlay.remove(); };
  overlay.onclick = function(e){ if(e.target === overlay) overlay.remove(); };
  checkAndAwardV11('a_evo_tree');
  sfxV11('evo_open');
}


// ============================================================
// 5. SAVE SLOT MANAGER (세이브 슬롯 3개 + 내보내기/가져오기)
// ============================================================
function getSaveSlots(){
  try{ return JSON.parse(localStorage.getItem('hatcuping_saveslots') || '[null,null,null]'); }catch(e){ return [null,null,null]; }
}

function openSaveManager(){
  if(document.getElementById('saveModal')) return;
  var overlay = document.createElement('div');
  overlay.id = 'saveModal';
  overlay.className = 'modal-overlay show';
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');
  trackV11Feature('savemanager');

  var slots = getSaveSlots();
  var html = '<div class="modal" style="max-width:380px">';
  html += '<button class="modal-close" id="saveClose" aria-label="&#xB2EB;&#xAE30;">&times;</button>';
  html += '<h3 style="font-size:17px">&#x1F4BE; &#xC138;&#xC774;&#xBE0C; &#xAD00;&#xB9AC;</h3>';

  for(var i = 0; i < 3; i++){
    var s = slots[i];
    html += '<div style="padding:12px;margin-bottom:8px;border-radius:14px;background:rgba(0,0,0,.03);border:1px solid var(--border)">';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">';
    html += '<span style="font-size:13px;font-weight:700">&#xC2AC;&#xB86F; '+(i+1)+'</span>';
    if(s){
      var d = new Date(s.date);
      html += '<span style="font-size:10px;color:var(--text-sub)">'+d.toLocaleDateString('ko-KR')+'</span>';
    }
    html += '</div>';
    if(s){
      html += '<div style="font-size:11px;color:var(--text-sub);margin-bottom:6px">&#xC5C5;&#xC801;: '+(s.achievements||0)+' | XP: '+(s.xp||0)+' | &#xD50C;&#xB808;&#xC774;: '+(Math.floor((s.playTime||0)/60))+'&#xBD84;</div>';
      html += '<div style="display:flex;gap:6px">';
      html += '<button class="save-load" data-slot="'+i+'" style="padding:4px 12px;background:var(--pink);color:#fff;border:none;border-radius:8px;font-size:11px;font-weight:700;cursor:pointer">&#xBD88;&#xB7EC;&#xC624;&#xAE30;</button>';
      html += '<button class="save-delete" data-slot="'+i+'" style="padding:4px 12px;background:rgba(244,67,54,.1);color:#F44336;border:none;border-radius:8px;font-size:11px;font-weight:700;cursor:pointer">&#xC0AD;&#xC81C;</button>';
      html += '</div>';
    } else {
      html += '<button class="save-create" data-slot="'+i+'" style="width:100%;padding:6px;background:linear-gradient(135deg,var(--pink),var(--purple));color:#fff;border:none;border-radius:10px;font-size:12px;font-weight:700;cursor:pointer">&#xD604;&#xC7AC; &#xC0C1;&#xD0DC; &#xC800;&#xC7A5;</button>';
    }
    html += '</div>';
  }

  html += '<div style="display:flex;gap:8px;margin-top:10px">';
  html += '<button id="saveExport" style="flex:1;padding:8px;background:rgba(0,0,0,.04);border:1px solid var(--border);border-radius:10px;font-size:11px;font-weight:700;cursor:pointer;color:var(--text)">&#x1F4E4; &#xB0B4;&#xBCF4;&#xB0B4;&#xAE30;</button>';
  html += '<button id="saveImport" style="flex:1;padding:8px;background:rgba(0,0,0,.04);border:1px solid var(--border);border-radius:10px;font-size:11px;font-weight:700;cursor:pointer;color:var(--text)">&#x1F4E5; &#xAC00;&#xC838;&#xC624;&#xAE30;</button>';
  html += '</div></div>';
  overlay.innerHTML = html;
  document.body.appendChild(overlay);

  document.getElementById('saveClose').onclick = function(){ overlay.remove(); };
  overlay.onclick = function(e){ if(e.target === overlay) overlay.remove(); };

  document.querySelectorAll('.save-create').forEach(function(btn){
    btn.onclick = function(){
      var idx = parseInt(btn.dataset.slot);
      var data = collectSaveData();
      slots[idx] = data;
      try{ localStorage.setItem('hatcuping_saveslots', JSON.stringify(slots)); }catch(e){}
      sfxV11('save_create');
      showToastV11('&#x1F4BE; &#xC2AC;&#xB86F; '+(idx+1)+' &#xC800;&#xC7A5; &#xC644;&#xB8CC;!');
      checkAndAwardV11('a_save_first');
      overlay.remove();
      openSaveManager();
    };
  });

  document.querySelectorAll('.save-load').forEach(function(btn){
    btn.onclick = function(){
      var idx = parseInt(btn.dataset.slot);
      var s = slots[idx];
      if(s) restoreSaveData(s);
      sfxV11('save_load');
      showToastV11('&#x1F4C2; &#xC2AC;&#xB86F; '+(idx+1)+' &#xBD88;&#xB7EC;&#xC624;&#xAE30; &#xC644;&#xB8CC;!');
      overlay.remove();
    };
  });

  document.querySelectorAll('.save-delete').forEach(function(btn){
    btn.onclick = function(){
      var idx = parseInt(btn.dataset.slot);
      slots[idx] = null;
      try{ localStorage.setItem('hatcuping_saveslots', JSON.stringify(slots)); }catch(e){}
      sfxV11('save_delete');
      overlay.remove();
      openSaveManager();
    };
  });

  document.getElementById('saveExport').onclick = function(){
    var allData = {};
    for(var k = 0; k < localStorage.length; k++){
      var key = localStorage.key(k);
      if(key && key.indexOf('hatcuping_') === 0) allData[key] = localStorage.getItem(key);
    }
    var blob = new Blob([JSON.stringify(allData, null, 2)], {type:'application/json'});
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'hatcuping-save-'+new Date().toISOString().slice(0,10)+'.json';
    a.click();
    URL.revokeObjectURL(url);
    sfxV11('save_export');
    showToastV11('&#x1F4E4; &#xB0B4;&#xBCF4;&#xB0B4;&#xAE30; &#xC644;&#xB8CC;!');
  };

  document.getElementById('saveImport').onclick = function(){
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = function(ev){
      var file = ev.target.files[0];
      if(!file) return;
      var reader = new FileReader();
      reader.onload = function(e){
        try{
          var data = JSON.parse(e.target.result);
          Object.keys(data).forEach(function(k){
            if(k.indexOf('hatcuping_') === 0) localStorage.setItem(k, data[k]);
          });
          showToastV11('&#x1F4E5; &#xAC00;&#xC838;&#xC624;&#xAE30; &#xC644;&#xB8CC;! &#xC0C8;&#xB85C;&#xACE0;&#xCE68; &#xD569;&#xB2C8;&#xB2E4;.');
          setTimeout(function(){ location.reload(); }, 1500);
        }catch(err){
          showToastV11('&#x26A0;&#xFE0F; &#xC720;&#xD6A8;&#xD558;&#xC9C0; &#xC54A;&#xC740; &#xD30C;&#xC77C;&#xC785;&#xB2C8;&#xB2E4;');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };
  sfxV11('save_open');
}

function collectSaveData(){
  return {
    date: Date.now(),
    achievements: Object.keys(JSON.parse(localStorage.getItem('hatcuping_achievements') || '{}')).length,
    xp: parseInt(localStorage.getItem('hatcuping_xp') || '0'),
    playTime: (JSON.parse(localStorage.getItem('hatcuping_stats') || '{}')).playTime || 0,
    stats: localStorage.getItem('hatcuping_stats'),
    achievements_data: localStorage.getItem('hatcuping_achievements'),
    difficulty: localStorage.getItem('hatcuping_difficulty')
  };
}

function restoreSaveData(s){
  if(s.stats) localStorage.setItem('hatcuping_stats', s.stats);
  if(s.achievements_data) localStorage.setItem('hatcuping_achievements', s.achievements_data);
  if(s.difficulty) localStorage.setItem('hatcuping_difficulty', s.difficulty);
  if(s.xp) localStorage.setItem('hatcuping_xp', String(s.xp));
}


// ============================================================
// 6. MINI-GAME ARCADE (반응속도 + 색상기억 + 리듬탭)
// ============================================================
var ARCADE_GAMES = [
  {id:'reaction',name:'반응속도 테스트',desc:'화면이 변하면 빠르게 탭!',icon:'&#x1F7E2;'},
  {id:'color_mem',name:'색상 기억 게임',desc:'순서대로 색상을 기억하세요!',icon:'&#x1F308;'},
  {id:'rhythm',name:'리듬 탭',desc:'박자에 맞춰 탭하세요!',icon:'&#x1F3B5;'}
];

function openArcade(){
  if(document.getElementById('arcadeModal')) return;
  var overlay = document.createElement('div');
  overlay.id = 'arcadeModal';
  overlay.className = 'modal-overlay show';
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');
  trackV11Feature('arcade');

  var html = '<div class="modal" style="max-width:380px">';
  html += '<button class="modal-close" id="arcadeClose" aria-label="&#xB2EB;&#xAE30;">&times;</button>';
  html += '<h3 style="font-size:17px">&#x1F579;&#xFE0F; &#xBBF8;&#xB2C8;&#xAC8C;&#xC784; &#xC544;&#xCF00;&#xC774;&#xB4DC;</h3>';

  ARCADE_GAMES.forEach(function(g){
    html += '<div class="arcade-card" data-game="'+g.id+'" style="display:flex;gap:10px;padding:12px;margin-bottom:8px;border-radius:14px;background:rgba(255,95,162,.05);border:1px solid var(--border);cursor:pointer;transition:all .2s">';
    html += '<div style="width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,var(--pink),var(--purple));display:flex;align-items:center;justify-content:center;font-size:22px">'+g.icon+'</div>';
    html += '<div style="flex:1"><div style="font-size:14px;font-weight:700">'+g.name+'</div>';
    html += '<div style="font-size:11px;color:var(--text-sub)">'+g.desc+'</div></div></div>';
  });
  html += '</div>';
  overlay.innerHTML = html;
  document.body.appendChild(overlay);

  document.getElementById('arcadeClose').onclick = function(){ overlay.remove(); };
  overlay.onclick = function(e){ if(e.target === overlay) overlay.remove(); };

  document.querySelectorAll('.arcade-card').forEach(function(card){
    card.onmouseenter = function(){ card.style.transform = 'translateY(-2px)'; };
    card.onmouseleave = function(){ card.style.transform = ''; };
    card.onclick = function(){
      var gid = card.dataset.game;
      if(gid === 'reaction') startReactionGame(overlay);
      else if(gid === 'color_mem') startColorMemGame(overlay);
      else if(gid === 'rhythm') startRhythmGame(overlay);
    };
  });
  sfxV11('arcade_open');
}

function startReactionGame(overlay){
  var html = '<div class="modal" style="max-width:360px;text-align:center">';
  html += '<h3 style="font-size:15px">&#x1F7E2; &#xBC18;&#xC751;&#xC18D;&#xB3C4; &#xD14C;&#xC2A4;&#xD2B8;</h3>';
  html += '<div style="font-size:12px;color:var(--text-sub);margin-bottom:12px">&#xBE68;&#xAC04;&#xC0C9;&#xC774; &#xCD08;&#xB85D;&#xC0C9;&#xC73C;&#xB85C; &#xBC14;&#xB00C;&#xBA74; &#xD0ED;!</div>';
  html += '<div id="reactionZone" style="width:200px;height:200px;margin:0 auto;border-radius:50%;background:#F44336;display:flex;align-items:center;justify-content:center;font-size:16px;color:#fff;font-weight:700;cursor:pointer;transition:background .1s">&#xB300;&#xAE30;&#xC911;...</div>';
  html += '<div id="reactionResult" style="margin-top:10px;font-size:14px;min-height:24px"></div>';
  html += '<button onclick="this.closest(\'.modal-overlay\').remove()" style="margin-top:8px;padding:6px 20px;background:rgba(0,0,0,.06);border:1px solid var(--border);border-radius:10px;font-size:12px;cursor:pointer;color:var(--text)">&#xB2EB;&#xAE30;</button>';
  html += '</div>';
  overlay.innerHTML = html;

  var zone = document.getElementById('reactionZone');
  var result = document.getElementById('reactionResult');
  var ready = false;
  var startMs = 0;

  var delay = 2000 + Math.random() * 3000;
  var tid = setTimeout(function(){
    zone.style.background = '#4CAF50';
    zone.textContent = '&#xD0ED;!';
    ready = true;
    startMs = performance.now();
  }, delay);

  zone.onclick = function(){
    if(!ready){
      clearTimeout(tid);
      zone.style.background = '#FF9800';
      zone.textContent = '&#xB108;&#xBB34; &#xBE68;&#xB77C;&#xC694;!';
      result.textContent = '&#xB2E4;&#xC2DC; &#xC2DC;&#xB3C4;&#xD558;&#xC138;&#xC694;';
      return;
    }
    var ms = Math.round(performance.now() - startMs);
    var grade = ms < 200 ? 'S' : ms < 300 ? 'A' : ms < 400 ? 'B' : ms < 500 ? 'C' : 'D';
    var gradeColors = {S:'#FFD700',A:'#4CAF50',B:'#2196F3',C:'#FF9800',D:'#F44336'};
    result.innerHTML = '<span style="font-size:24px;font-weight:800;color:'+gradeColors[grade]+'">'+grade+'&#xB4F1;&#xAE09;</span><br><span style="font-size:13px;color:var(--text-sub)">'+ms+'ms</span>';
    zone.textContent = ms + 'ms';
    sfxV11('arcade_win');
    checkAndAwardV11('a_arcade');
    if(ms < 200) checkAndAwardV11('a_reaction_s');
  };
}

function startColorMemGame(overlay){
  var colors = ['#F44336','#4CAF50','#2196F3','#FFD700'];
  var sequence = [];
  var playerIdx = 0;
  var level = 1;
  var showing = false;

  function addToSequence(){
    sequence.push(Math.floor(Math.random() * 4));
  }
  addToSequence();

  function render(){
    var html = '<div class="modal" style="max-width:360px;text-align:center">';
    html += '<h3 style="font-size:15px">&#x1F308; &#xC0C9;&#xC0C1; &#xAE30;&#xC5B5; &#xAC8C;&#xC784;</h3>';
    html += '<div style="font-size:12px;color:var(--text-sub);margin-bottom:8px">&#xB808;&#xBCA8;: <strong style="color:var(--pink)">'+level+'</strong></div>';
    html += '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;max-width:200px;margin:0 auto">';
    for(var i = 0; i < 4; i++){
      html += '<div class="color-btn" data-ci="'+i+'" style="width:90px;height:90px;border-radius:16px;background:'+colors[i]+';opacity:.6;cursor:'+(showing?'default':'pointer')+';transition:opacity .2s;box-shadow:0 2px 8px '+colors[i]+'44"></div>';
    }
    html += '</div>';
    html += '<div id="colorMsg" style="margin-top:10px;font-size:12px;color:var(--text-sub);min-height:20px">'+(showing?'&#xC21C;&#xC11C;&#xB97C; &#xAE30;&#xC5B5;&#xD558;&#xC138;&#xC694;...':'&#xC21C;&#xC11C;&#xB300;&#xB85C; &#xD0ED;&#xD558;&#xC138;&#xC694;!')+'</div>';
    html += '<button onclick="this.closest(\'.modal-overlay\').remove()" style="margin-top:8px;padding:6px 20px;background:rgba(0,0,0,.06);border:1px solid var(--border);border-radius:10px;font-size:12px;cursor:pointer;color:var(--text)">&#xB2EB;&#xAE30;</button>';
    html += '</div>';
    overlay.innerHTML = html;

    if(!showing){
      document.querySelectorAll('.color-btn').forEach(function(btn){
        btn.onclick = function(){
          var ci = parseInt(btn.dataset.ci);
          if(ci === sequence[playerIdx]){
            btn.style.opacity = '1';
            sfxV11('color_hit');
            playerIdx++;
            if(playerIdx >= sequence.length){
              level++;
              playerIdx = 0;
              addToSequence();
              if(level > 5) checkAndAwardV11('a_color_master');
              setTimeout(function(){ showSequence(); }, 600);
            }
          } else {
            document.getElementById('colorMsg').innerHTML = '&#x274C; &#xC2E4;&#xD328;! &#xB808;&#xBCA8; '+(level-1)+'&#xAE4C;&#xC9C0; &#xB3C4;&#xB2EC;';
            sfxV11('arcade_fail');
          }
        };
      });
    }
  }

  function showSequence(){
    showing = true;
    render();
    sequence.forEach(function(ci, i){
      setTimeout(function(){
        var btns = document.querySelectorAll('.color-btn');
        if(btns[ci]) btns[ci].style.opacity = '1';
        setTimeout(function(){
          if(btns[ci]) btns[ci].style.opacity = '.6';
          if(i === sequence.length - 1){
            showing = false;
            render();
          }
        }, 400);
      }, i * 700);
    });
  }
  showSequence();
}

function startRhythmGame(overlay){
  var bpm = 120;
  var beatMs = 60000 / bpm;
  var beats = [];
  var score = 0;
  var total = 16;
  var current = 0;
  var active = true;

  for(var i = 0; i < total; i++){
    beats.push({time: i * beatMs, hit: false, result: null});
  }

  var html = '<div class="modal" style="max-width:360px;text-align:center">';
  html += '<h3 style="font-size:15px">&#x1F3B5; &#xB9AC;&#xB4EC; &#xD0ED;</h3>';
  html += '<div style="font-size:12px;color:var(--text-sub);margin-bottom:6px">BPM '+bpm+' | &#xBC15;&#xC790;&#xC5D0; &#xB9DE;&#xCDB0; &#xBC84;&#xD2BC;&#xC744; &#xB204;&#xB974;&#xC138;&#xC694;</div>';
  html += '<div id="rhythmBar" style="width:100%;height:60px;background:rgba(0,0,0,.04);border-radius:14px;position:relative;overflow:hidden;margin-bottom:8px"></div>';
  html += '<button id="rhythmTap" style="width:120px;height:120px;border-radius:50%;background:linear-gradient(135deg,var(--pink),var(--purple));border:none;color:#fff;font-size:28px;font-weight:800;cursor:pointer;box-shadow:0 4px 20px rgba(255,95,162,.3);transition:transform .1s">TAP</button>';
  html += '<div id="rhythmScore" style="margin-top:8px;font-size:14px;font-weight:700;color:var(--pink)">0/'+total+'</div>';
  html += '<button onclick="this.closest(\'.modal-overlay\').remove()" style="margin-top:6px;padding:6px 20px;background:rgba(0,0,0,.06);border:1px solid var(--border);border-radius:10px;font-size:12px;cursor:pointer;color:var(--text)">&#xB2EB;&#xAE30;</button>';
  html += '</div>';
  overlay.innerHTML = html;

  var tapBtn = document.getElementById('rhythmTap');
  var startTime = performance.now();

  tapBtn.onclick = function(){
    if(!active) return;
    tapBtn.style.transform = 'scale(.9)';
    setTimeout(function(){ tapBtn.style.transform = ''; }, 100);

    var now = performance.now() - startTime;
    var closest = -1;
    var minDiff = Infinity;
    beats.forEach(function(b, i){
      if(!b.hit){
        var diff = Math.abs(now - b.time);
        if(diff < minDiff){ minDiff = diff; closest = i; }
      }
    });

    if(closest >= 0 && minDiff < beatMs * 0.4){
      beats[closest].hit = true;
      beats[closest].result = minDiff < beatMs * 0.15 ? 'perfect' : 'good';
      score += beats[closest].result === 'perfect' ? 2 : 1;
      sfxV11(beats[closest].result === 'perfect' ? 'rhythm_perfect' : 'rhythm_good');
    } else {
      sfxV11('arcade_fail');
    }
    document.getElementById('rhythmScore').textContent = score + '/' + (total * 2);
  };

  var rhythmTimer = setInterval(function(){
    if(!active) return;
    current++;
    if(current >= total){
      clearInterval(rhythmTimer);
      active = false;
      checkAndAwardV11('a_rhythm');
      var pct = Math.round(score / (total * 2) * 100);
      document.getElementById('rhythmScore').innerHTML = '<div style="font-size:20px">&#x1F3B6;</div> '+pct+'% ('+score+'/'+(total*2)+')';
    }
  }, beatMs);
}


// ============================================================
// 7. SEASON EVENT SYSTEM (월별 시즌 이벤트)
// ============================================================
function getSeasonEvent(){
  var month = new Date().getMonth();
  var seasons = [
    {name:'&#xACE8;&#xB4DC; &#xC708;&#xD130;',icon:'&#x2744;&#xFE0F;',color:'#81D4FA',reward:'&#xACE8;&#xB4DC; &#xD504;&#xB808;&#xC784; &#xD574;&#xAE08;',month:0},
    {name:'&#xBC1C;&#xB808;&#xD0C0;&#xC778; &#xC774;&#xBCA4;&#xD2B8;',icon:'&#x1F496;',color:'#FF5FA2',reward:'&#xD558;&#xD2B8; &#xD14C;&#xB9C8; &#xD574;&#xAE08;',month:1},
    {name:'&#xBD04;&#xD55C;&#xC815; &#xD398;&#xC2A4;&#xD2F0;&#xBC8C;',icon:'&#x1F338;',color:'#F48FB1',reward:'&#xBD04; &#xD14C;&#xB9C8; &#xD574;&#xAE08;',month:2},
    {name:'&#xC774;&#xC2A4;&#xD130; &#xC5D0;&#xADF8; &#xD5CC;&#xD2B8;',icon:'&#x1F95A;',color:'#FFCC80',reward:'&#xBF08;&#xC2A4; &#xD78C;&#xD2B8;',month:3},
    {name:'&#xC5B4;&#xB9B0;&#xC774;&#xB0A0; &#xD2B9;&#xBCC4;',icon:'&#x1F382;',color:'#CE93D8',reward:'&#xD2B9;&#xBCC4; &#xC544;&#xC774;&#xD15C;',month:4},
    {name:'&#xC5EC;&#xB984; &#xC218;&#xC601;&#xC7A5;',icon:'&#x1F3D6;&#xFE0F;',color:'#4FC3F7',reward:'&#xC218;&#xC601;&#xC7A5; &#xBC30;&#xACBD;',month:5},
    {name:'&#xC5EC;&#xB984; &#xBAA8;&#xD5D8;',icon:'&#x26F0;&#xFE0F;',color:'#81C784',reward:'&#xD0D0;&#xD5D8; &#xC7A5;&#xBE44;',month:6},
    {name:'&#xBCC4;&#xBD07;&#xBE44; &#xCD95;&#xC81C;',icon:'&#x1F320;',color:'#7986CB',reward:'&#xBCC4; &#xD14C;&#xB9C8;',month:7},
    {name:'&#xCD94;&#xC11D; &#xB300;&#xC791;&#xC804;',icon:'&#x1F319;',color:'#FFB74D',reward:'&#xC1A1;&#xD3B8; &#xC544;&#xC774;&#xD15C;',month:8},
    {name:'&#xD560;&#xB85C;&#xC708; &#xD30C;&#xD2F0;',icon:'&#x1F383;',color:'#FF8A65',reward:'&#xD560;&#xB85C;&#xC708; &#xD14C;&#xB9C8;',month:9},
    {name:'&#xAC00;&#xC744; &#xC218;&#xD655;&#xC81C;',icon:'&#x1F342;',color:'#A1887F',reward:'&#xAC00;&#xC744; &#xD14C;&#xB9C8;',month:10},
    {name:'&#xD06C;&#xB9AC;&#xC2A4;&#xB9C8;&#xC2A4; &#xD30C;&#xD2F0;',icon:'&#x1F384;',color:'#EF5350',reward:'&#xC0B0;&#xD0C0; &#xBAA8;&#xC790;',month:11}
  ];
  return seasons[month] || seasons[5];
}

function injectSeasonBanner(){
  var event = getSeasonEvent();
  var banner = document.querySelector('.daily-challenge');
  if(!banner) return;

  var seasonDiv = document.createElement('div');
  seasonDiv.id = 'seasonBanner';
  seasonDiv.style.cssText = 'width:100%;max-width:420px;margin-bottom:12px;padding:12px 16px;background:linear-gradient(135deg,'+event.color+'22,'+event.color+'11);border-radius:14px;border:1px solid '+event.color+'33;cursor:pointer;transition:all .3s;opacity:0;animation:fadeUp .8s .45s forwards';
  seasonDiv.innerHTML = '<div style="display:flex;align-items:center;gap:8px"><span style="font-size:20px">'+event.icon+'</span><div><div style="font-size:12px;font-weight:800;color:'+event.color+'">'+event.name+'</div><div style="font-size:11px;color:var(--text-sub)">&#xBCF4;&#xC0C1;: '+event.reward+'</div></div></div>';
  seasonDiv.onclick = function(){
    showToastV11(event.icon+' '+event.name+' &#xC774;&#xBCA4;&#xD2B8; &#xCC38;&#xC5EC; &#xC911;!');
    checkAndAwardV11('a_season_event');
    sfxV11('season_click');
  };
  banner.parentNode.insertBefore(seasonDiv, banner);
}


// ============================================================
// 8. IN-GAME ENCYCLOPEDIA (캐릭터/아이템/스킬 백과사전 40항목)
// ============================================================
var ENCYCLOPEDIA = {
  characters: [
    {name:'&#xB85C;&#xBBF8;',desc:'&#xC6A9;&#xAC10;&#xD558;&#xACE0; &#xBC1D;&#xC740; &#xC18C;&#xB140;. &#xD558;&#xCE04;&#xD551;&#xACFC; &#xD568;&#xAED8; &#xBAA8;&#xD5D8;&#xC744; &#xB5A0;&#xB098;&#xC694;',icon:'&#x1F467;'},
    {name:'&#xD558;&#xCE04;&#xD551;',desc:'&#xC0AC;&#xB791;&#xC758; &#xB9C8;&#xBC95;&#xC744; &#xC4F0;&#xB294; &#xD2F0;&#xB2C8;&#xD551;. &#xBD84;&#xD64D;&#xC0C9; &#xB0A0;&#xAC1C;&#xAC00; &#xD2B9;&#xC9D5;!',icon:'&#x1F496;'},
    {name:'&#xBC14;&#xB85C;&#xD551;',desc:'&#xC6A9;&#xAE30;&#xC758; &#xD2F0;&#xB2C8;&#xD551;. &#xD30C;&#xB780; &#xBC29;&#xD328;&#xB85C; &#xBCF4;&#xD638;&#xD574;&#xC694;',icon:'&#x1F6E1;&#xFE0F;'},
    {name:'&#xCC28;&#xCC28;&#xD551;',desc:'&#xC790;&#xC5F0;&#xC758; &#xD2F0;&#xB2C8;&#xD551;. &#xCD08;&#xB85D; &#xD798;&#xC73C;&#xB85C; &#xCE58;&#xC720;&#xD574;&#xC694;',icon:'&#x1F33F;'},
    {name:'&#xB77C;&#xB77C;&#xD551;',desc:'&#xC74C;&#xC545;&#xC758; &#xD2F0;&#xB2C8;&#xD551;. &#xC544;&#xB984;&#xB2E4;&#xC6B4; &#xBA5C;&#xB85C;&#xB514;&#xB97C; &#xB4E4;&#xB824;&#xC918;&#xC694;',icon:'&#x1F3B5;'},
    {name:'&#xAF41;&#xAF41;&#xD551;',desc:'&#xC5BC;&#xC74C;&#xC758; &#xD2F0;&#xB2C8;&#xD551;. &#xBAA8;&#xB4E0; &#xAC83;&#xC744; &#xC5BC;&#xB9B4; &#xC218; &#xC788;&#xC5B4;&#xC694;',icon:'&#x2744;&#xFE0F;'},
    {name:'&#xD2B8;&#xB7EC;&#xD551;',desc:'&#xBB34;&#xD55C;&#xD551;&#xC774; &#xBCF4;&#xB0B8; &#xC545;&#xB2F9;. &#xC0AC;&#xC2E4;&#xC740; &#xC678;&#xB85C;&#xC6B4; &#xC874;&#xC7AC;',icon:'&#x1F47E;'},
    {name:'&#xD574;&#xD551;',desc:'&#xD0DC;&#xC591;&#xC758; &#xD2F0;&#xB2C8;&#xD551;. &#xBC1D;&#xC740; &#xBE5B;&#xC744; &#xBFCC;&#xB824;&#xC694;',icon:'&#x2600;&#xFE0F;'},
    {name:'&#xB610;&#xB85C;&#xD551;',desc:'&#xC7A5;&#xB09C;&#xAFB8;&#xB7EC;&#xAE30; &#xD2F0;&#xB2C8;&#xD551;. &#xAE4C;&#xBD88;&#xC9C0;&#xB9CC; &#xC740;&#xADFC;&#xD788; &#xB2E4;&#xAC00;&#xC640;&#xC694;',icon:'&#x1F43E;'},
    {name:'&#xBB34;&#xC9C0;&#xD551;',desc:'&#xBB34;&#xC9C0;&#xAC1C;&#xC758; &#xD2F0;&#xB2C8;&#xD551;. &#xC77C;&#xACF1; &#xC0C9; &#xBE5B;&#xC744; &#xB0B4;&#xC694;',icon:'&#x1F308;'}
  ],
  items: [
    {name:'&#xD558;&#xD2B8;',desc:'&#xCCB4;&#xB825;&#xC744; &#xD68C;&#xBCF5;&#xD558;&#xB294; &#xAE30;&#xBCF8; &#xC544;&#xC774;&#xD15C;',icon:'&#x1F497;'},
    {name:'&#xBCC4;',desc:'&#xBCF4;&#xB108;&#xC2A4; &#xC810;&#xC218;&#xB97C; &#xC5BB;&#xB294; &#xD76C;&#xADC0; &#xC218;&#xC9D1;&#xD488;',icon:'&#x2B50;'},
    {name:'&#xBC29;&#xD328;',desc:'&#xB370;&#xBBF8;&#xC9C0;&#xB97C; &#xB9C9;&#xC544;&#xC8FC;&#xB294; &#xBCF4;&#xD638;&#xAD6C;',icon:'&#x1F6E1;&#xFE0F;'},
    {name:'&#xC2A4;&#xD53C;&#xB4DC; &#xBD80;&#xC2A4;&#xD130;',desc:'&#xC774;&#xB3D9; &#xC18D;&#xB3C4;&#xB97C; &#xB192;&#xC5EC;&#xC8FC;&#xB294; &#xC2E0;&#xBC1C;',icon:'&#x1F45F;'},
    {name:'&#xC790;&#xC11D;',desc:'&#xC8FC;&#xBCC0; &#xC544;&#xC774;&#xD15C;&#xC744; &#xB04C;&#xC5B4;&#xB2F9;&#xAE30;&#xB294; &#xC790;&#xC11D;',icon:'&#x1F9F2;'},
    {name:'&#xD68C;&#xBCF5; &#xD3EC;&#xC158;',desc:'HP&#xB97C; &#xB300;&#xB7C9; &#xD68C;&#xBCF5;&#xD558;&#xB294; &#xBB3C;&#xC57D;',icon:'&#x1F48A;'},
    {name:'&#xACF5;&#xACA9; &#xBD80;&#xC801;',desc:'&#xACF5;&#xACA9;&#xB825;&#xC744; &#xC77C;&#xC2DC;&#xC801;&#xC73C;&#xB85C; &#xB192;&#xC774;&#xB294; &#xBD80;&#xC801;',icon:'&#x1F4A5;'},
    {name:'&#xBD80;&#xD65C; &#xAE43;&#xD138;',desc:'&#xC4F0;&#xB7EC;&#xC84C;&#xC744; &#xB54C; &#xC790;&#xB3D9; &#xBD80;&#xD65C;',icon:'&#x1F4AB;'},
    {name:'&#xD3EC;&#xD68D; &#xCE94;&#xC2F0;',desc:'&#xC801;&#xC744; &#xD3EC;&#xD68D;&#xD560; &#xC218; &#xC788;&#xB294; &#xD2B9;&#xC218; &#xCE94;&#xC2F0;',icon:'&#x1F3B0;'},
    {name:'&#xD589;&#xC6B4;&#xC758; &#xD074;&#xB85C;&#xBC84;',desc:'&#xB4DC;&#xB86D;&#xB960; &#xC99D;&#xAC00;',icon:'&#x1F340;'}
  ],
  skills: [
    {name:'&#xC0AC;&#xB791;&#xC758; &#xD3EC;&#xC639;',desc:'&#xD558;&#xCE04;&#xD551;&#xC758; &#xAE30;&#xBCF8;&#xAE30;. &#xC0AC;&#xB791;&#xC758; &#xB9C8;&#xBC95;',icon:'&#x1F496;'},
    {name:'&#xC6A9;&#xAE30;&#xC758; &#xBC29;&#xD328;',desc:'&#xBC14;&#xB85C;&#xD551;&#xC758; &#xBC29;&#xC5B4; &#xC2A4;&#xD0AC;',icon:'&#x1F6E1;&#xFE0F;'},
    {name:'&#xCE58;&#xC720;&#xC758; &#xBE44;',desc:'&#xCC28;&#xCC28;&#xD551;&#xC758; &#xD68C;&#xBCF5; &#xC2A4;&#xD0AC;',icon:'&#x1F33F;'},
    {name:'&#xD558;&#xBAA8;&#xB2C8; &#xBE14;&#xB77C;&#xC2A4;&#xD2B8;',desc:'&#xB77C;&#xB77C;&#xD551;&#xC758; &#xC74C;&#xD30C; &#xACF5;&#xACA9;',icon:'&#x1F3B5;'},
    {name:'&#xBE59;&#xD558; &#xD504;&#xB85C;&#xC2A4;&#xD2B8;',desc:'&#xAF41;&#xAF41;&#xD551;&#xC758; &#xC5BC;&#xC74C; &#xACF5;&#xACA9;',icon:'&#x2744;&#xFE0F;'},
    {name:'&#xB300;&#xC2DC;',desc:'&#xBE60;&#xB978; &#xC55E;&#xC73C;&#xB85C; &#xB3CC;&#xC9C4;',icon:'&#x1F4A8;'},
    {name:'&#xB354;&#xBE14; &#xC810;&#xD504;',desc:'&#xACF5;&#xC911;&#xC5D0;&#xC11C; &#xD55C; &#xBC88; &#xB354; &#xC810;&#xD504;',icon:'&#x1F998;'},
    {name:'&#xBCBD;&#xD0C0;&#xAE30;',desc:'&#xBCBD;&#xC744; &#xD0C0;&#xACE0; &#xBBF8;&#xB044;&#xB7EC;&#xC9C0;&#xAE30;',icon:'&#x1F9D7;'},
    {name:'&#xCF64;&#xBCF4; &#xC5B4;&#xD0DD;',desc:'&#xC5F0;&#xC18D; &#xACF5;&#xACA9;&#xC73C;&#xB85C; &#xCD94;&#xAC00; &#xB370;&#xBBF8;&#xC9C0;',icon:'&#x1F525;'},
    {name:'&#xB9C8;&#xBC95; &#xD3ED;&#xBC1C;',desc:'&#xBC94;&#xC704; &#xB9C8;&#xBC95; &#xACF5;&#xACA9;',icon:'&#x1F4A5;'}
  ],
  worlds: [
    {name:'&#xC774;&#xBAA8;&#xC158; &#xC655;&#xAD6D;',desc:'&#xD2F0;&#xB2C8;&#xD551;&#xB4E4;&#xC774; &#xC0AC;&#xB294; &#xB9C8;&#xBC95;&#xC758; &#xB098;&#xB77C;',icon:'&#x1F3F0;'},
    {name:'&#xC774;&#xBAA8;&#xC158; &#xC232;',desc:'&#xC544;&#xB984;&#xB2E4;&#xC6B4; &#xB098;&#xBB34;&#xB4E4;&#xC774; &#xC788;&#xB294; &#xC2E0;&#xBE44;&#xC758; &#xC232;',icon:'&#x1F332;'},
    {name:'&#xD06C;&#xB9AC;&#xC2A4;&#xD0C8; &#xB3D9;&#xAD74;',desc:'&#xBC18;&#xC9DD;&#xC774;&#xB294; &#xBCF4;&#xC11D;&#xC73C;&#xB85C; &#xAC00;&#xB4DD;&#xD55C; &#xB3D9;&#xAD74;',icon:'&#x1F48E;'},
    {name:'&#xD558;&#xB298; &#xAD6C;&#xB984; &#xB9C8;&#xC744;',desc:'&#xAD6C;&#xB984; &#xC704;&#xC5D0; &#xC788;&#xB294; &#xD3C9;&#xD654;&#xB85C;&#xC6B4; &#xB9C8;&#xC744;',icon:'&#x2601;&#xFE0F;'},
    {name:'&#xC5B4;&#xB460;&#xC758; &#xC131;',desc:'&#xD2B8;&#xB7EC;&#xD551;&#xC774; &#xC228;&#xC5B4;&#xC788;&#xB294; &#xC5B4;&#xB450;&#xC6B4; &#xC131;',icon:'&#x1F3F0;'},
    {name:'&#xD3C9;&#xD654;&#xC758; &#xAD6C;&#xB984; &#xBC14;&#xB2E4;',desc:'&#xBC14;&#xB2E4; &#xC704;&#xC758; &#xAD6C;&#xB984;&#xC5D0;&#xC11C; &#xBAA8;&#xD5D8;',icon:'&#x1F30A;'},
    {name:'&#xBD88;&#xC758; &#xC0B0;',desc:'&#xC6A9;&#xC554;&#xC774; &#xD750;&#xB974;&#xB294; &#xC704;&#xD5D8;&#xD55C; &#xC0B0;',icon:'&#x1F30B;'},
    {name:'&#xBCC4;&#xBE5B; &#xC804;&#xB9DD;&#xB300;',desc:'&#xBCC4;&#xC744; &#xAD00;&#xCE21;&#xD560; &#xC218; &#xC788;&#xB294; &#xB192;&#xC740; &#xACF3;',icon:'&#x1F320;'},
    {name:'&#xBB34;&#xC9C0;&#xAC1C; &#xB2E4;&#xB9AC;',desc:'&#xBB34;&#xC9C0;&#xAC1C;&#xB85C; &#xC774;&#xC5B4;&#xC9C4; &#xC2E0;&#xBE44;&#xC758; &#xB2E4;&#xB9AC;',icon:'&#x1F308;'},
    {name:'&#xAF43;&#xC758; &#xC815;&#xC6D0;',desc:'&#xC544;&#xB984;&#xB2E4;&#xC6B4; &#xAF43;&#xB4E4;&#xC774; &#xD540; &#xC815;&#xC6D0;',icon:'&#x1F33A;'}
  ]
};

function openEncyclopedia(){
  if(document.getElementById('encycModal')) return;
  var overlay = document.createElement('div');
  overlay.id = 'encycModal';
  overlay.className = 'modal-overlay show';
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');
  trackV11Feature('encyclopedia');

  var categories = [
    {key:'characters',name:'&#xCE90;&#xB9AD;&#xD130;',icon:'&#x1F467;'},
    {key:'items',name:'&#xC544;&#xC774;&#xD15C;',icon:'&#x1F48E;'},
    {key:'skills',name:'&#xC2A4;&#xD0AC;',icon:'&#x2694;&#xFE0F;'},
    {key:'worlds',name:'&#xC6D4;&#xB4DC;',icon:'&#x1F30D;'}
  ];
  var currentCat = 'characters';

  function render(){
    var html = '<div class="modal" style="max-width:400px;max-height:80vh;overflow-y:auto">';
    html += '<button class="modal-close" id="encycClose" aria-label="&#xB2EB;&#xAE30;">&times;</button>';
    html += '<h3 style="font-size:17px">&#x1F4D6; &#xBC31;&#xACFC;&#xC0AC;&#xC804;</h3>';

    html += '<div style="display:flex;gap:4px;margin-bottom:12px;background:rgba(0,0,0,.04);border-radius:12px;padding:3px">';
    categories.forEach(function(c){
      html += '<button class="encyc-tab" data-cat="'+c.key+'" style="flex:1;padding:6px 4px;border:none;border-radius:10px;cursor:pointer;font-size:10px;font-weight:700;background:'+(currentCat===c.key?'var(--pink)':'transparent')+';color:'+(currentCat===c.key?'#fff':'var(--text-sub)')+';transition:all .2s">'+c.icon+' '+c.name+'</button>';
    });
    html += '</div>';

    var items = ENCYCLOPEDIA[currentCat] || [];
    html += '<div style="font-size:11px;color:var(--text-sub);margin-bottom:6px">'+items.length+'&#xAC1C; &#xD56D;&#xBAA9;</div>';
    items.forEach(function(item){
      html += '<div style="display:flex;gap:8px;padding:8px;margin-bottom:4px;border-radius:12px;background:rgba(0,0,0,.02);border:1px solid var(--border)">';
      html += '<span style="font-size:18px;flex-shrink:0">'+item.icon+'</span>';
      html += '<div><div style="font-size:12px;font-weight:700">'+item.name+'</div>';
      html += '<div style="font-size:11px;color:var(--text-sub)">'+item.desc+'</div></div></div>';
    });
    html += '</div>';
    overlay.innerHTML = html;

    document.getElementById('encycClose').onclick = function(){ overlay.remove(); };
    overlay.onclick = function(e){ if(e.target === overlay) overlay.remove(); };

    document.querySelectorAll('.encyc-tab').forEach(function(tab){
      tab.onclick = function(){
        currentCat = tab.dataset.cat;
        render();
        sfxV11('encyc_tab');
      };
    });
  }
  render();
  checkAndAwardV11('a_encyclopedia');
  sfxV11('encyc_open');
}


// ============================================================
// 9. EXTRA QUIZ +15 (30→45 퀴즈)
// ============================================================
function injectExtraQuizV11(){
  if(!window.QUIZ_DATA) window.QUIZ_DATA = [];
  var newQ = [
    {q:'&#xD558;&#xCE04;&#xD551;&#xC758; &#xB0A0;&#xAC1C; &#xC0C9;&#xC740;?',a:['&#xBD84;&#xD64D;&#xC0C9;','&#xD30C;&#xB780;&#xC0C9;','&#xCD08;&#xB85D;&#xC0C9;','&#xBCF4;&#xB77C;&#xC0C9;'],c:0},
    {q:'&#xC774;&#xBAA8;&#xC158; &#xC655;&#xAD6D;&#xC758; &#xC5EC;&#xC655;&#xC740;?',a:['&#xC5D8;&#xB9AC;&#xD551;','&#xBB34;&#xD55C;&#xD551;','&#xD574;&#xD551;','&#xB77C;&#xB77C;&#xD551;'],c:1},
    {q:'&#xBC14;&#xB85C;&#xD551;&#xC758; &#xC0C1;&#xC9D5; &#xC544;&#xC774;&#xD15C;&#xC740;?',a:['&#xAC80;','&#xBC29;&#xD328;','&#xD65C;','&#xC9C0;&#xD321;&#xC774;'],c:1},
    {q:'RPG&#xC5D0;&#xC11C; &#xCCAB; &#xBC88;&#xC9F8; &#xD30C;&#xD2F0;&#xC6D0;&#xC740;?',a:['&#xD558;&#xCE04;&#xD551;','&#xBC14;&#xB85C;&#xD551;','&#xCC28;&#xCC28;&#xD551;','&#xB77C;&#xB77C;&#xD551;'],c:0},
    {q:'&#xD50C;&#xB7AB;&#xD3EC;&#xBA38;&#xC758; &#xCD5C;&#xB300; &#xC2A4;&#xD14C;&#xC774;&#xC9C0; &#xC218;&#xB294;?',a:['5','8','10','12'],c:2},
    {q:'&#xD2B8;&#xB7EC;&#xD551;&#xC758; &#xD2B9;&#xC218;&#xAE30; &#xC774;&#xB984;&#xC740;?',a:['&#xC774;&#xBAA8;&#xC158; &#xBE0C;&#xB808;&#xC774;&#xD06C;','&#xB2E4;&#xD06C; &#xBE0C;&#xB808;&#xC2A4;','&#xC0E4;&#xB3C4;&#xC6B0; &#xBCFC;','&#xCE74;&#xC624;&#xC2A4; &#xC2A4;&#xD2B8;&#xB77C;&#xC774;&#xD06C;'],c:0},
    {q:'&#xBCC4;&#xBE5B; &#xC694;&#xC815; &#xB3D9;&#xBC18;&#xC790;&#xC758; &#xBCF4;&#xB108;&#xC2A4;&#xB294;?',a:['&#xACF5;&#xACA9;+15%','XP+20%','&#xD68C;&#xBCF5;+25%','&#xD589;&#xC6B4;+10%'],c:1},
    {q:'&#xCE74;&#xB4DC; &#xB9E4;&#xCE6D;&#xC5D0;&#xC11C; &#xCD1D; &#xCE74;&#xB4DC; &#xC218;&#xB294;?',a:['8&#xC7A5;','10&#xC7A5;','12&#xC7A5;','14&#xC7A5;'],c:2},
    {q:'&#xB0A0;&#xC528; &#xD6A8;&#xACFC; &#xC885;&#xB958;&#xB294; &#xBA87; &#xAC00;&#xC9C0;?',a:['2','3','4','5'],c:2},
    {q:'&#xC0AC;&#xC6B4;&#xB4DC;&#xD2B8;&#xB799;&#xC758; &#xCD1D; &#xACE1; &#xC218;&#xB294;?',a:['5&#xACE1;','6&#xACE1;','7&#xACE1;','8&#xACE1;'],c:2},
    {q:'&#xAF41;&#xAF41;&#xD551;&#xC758; &#xC18D;&#xC131;&#xC740;?',a:['&#xBD88;','&#xBB3C;','&#xC5BC;&#xC74C;','&#xBC14;&#xB78C;'],c:2},
    {q:'v11&#xC5D0;&#xC11C; &#xCD94;&#xAC00;&#xB41C; &#xBBF8;&#xB2C8;&#xAC8C;&#xC784;&#xC740;?',a:['&#xD37C;&#xC990;','&#xC544;&#xCF00;&#xC774;&#xB4DC;','&#xB808;&#xC774;&#xC2F1;','&#xB09A;&#xC2DC;'],c:1},
    {q:'&#xC9C4;&#xD654; &#xD2B8;&#xB9AC;&#xC5D0;&#xC11C; &#xD558;&#xCE04;&#xD551;&#xC758; &#xC9C4;&#xD654;&#xCCB4;&#xB294;?',a:['&#xC218;&#xD37C;&#xD558;&#xCE04;&#xD551;','&#xBA54;&#xAC00;&#xD558;&#xCE04;&#xD551;','&#xBC14;&#xB85C;&#xD551;/&#xCC28;&#xCC28;&#xD551;','&#xC5C6;&#xC74C;'],c:2},
    {q:'&#xD30C;&#xC6CC;&#xC5C5; &#xB3C4;&#xAC10;&#xC758; &#xC804;&#xC124; &#xB4F1;&#xAE09; &#xC218;&#xB294;?',a:['1&#xAC1C;','2&#xAC1C;','3&#xAC1C;','4&#xAC1C;'],c:1},
    {q:'&#xD0C0;&#xC784;&#xC5B4;&#xD0DD; &#xBAA8;&#xB4DC;&#xC758; &#xC885;&#xB958;&#xB294;?',a:['2&#xC885;','3&#xC885;','4&#xC885;','5&#xC885;'],c:1}
  ];
  newQ.forEach(function(q){ window.QUIZ_DATA.push(q); });
}


// ============================================================
// 10. V11 ACHIEVEMENTS (+12, 58→70)
// ============================================================
var V11_ACHIEVEMENTS = [
  {id:'a_time_attack',name:'&#xD0C0;&#xC784; &#xCC4C;&#xB9B0;&#xC800;',desc:'&#xD0C0;&#xC784;&#xC5B4;&#xD0DD; &#xBAA8;&#xB4DC; &#xCCAB; &#xD50C;&#xB808;&#xC774;',cat:'general',icon:'&#x23F1;&#xFE0F;'},
  {id:'a_combo_king',name:'&#xCF64;&#xBCF4; &#xD0B9;',desc:'&#xD0C0;&#xC784;&#xC5B4;&#xD0DD;&#xC5D0;&#xC11C; 15&#xCF64;&#xBCF4; &#xB2EC;&#xC131;',cat:'general',icon:'&#x1F525;'},
  {id:'a_powerup_first',name:'&#xCCAB; &#xBC1C;&#xACAC;',desc:'&#xD30C;&#xC6CC;&#xC5C5;&#xC744; &#xCC98;&#xC74C; &#xBC1C;&#xACAC;',cat:'general',icon:'&#x1F50D;'},
  {id:'a_powerup_all',name:'&#xC218;&#xC9D1;&#xAC00;',desc:'&#xD30C;&#xC6CC;&#xC5C5; 8&#xC885; &#xC804;&#xBD80; &#xC218;&#xC9D1;',cat:'general',icon:'&#x1F4D6;'},
  {id:'a_customize',name:'&#xD328;&#xC158;&#xB2C8;&#xC2A4;&#xD0C0;',desc:'&#xCE90;&#xB9AD;&#xD130; &#xCEE4;&#xC2A4;&#xD130;&#xB9C8;&#xC774;&#xC9D5; &#xCCAB; &#xBCC0;&#xACBD;',cat:'general',icon:'&#x1F3A8;'},
  {id:'a_evo_tree',name:'&#xC9C4;&#xD654; &#xD559;&#xC790;',desc:'&#xC9C4;&#xD654; &#xD2B8;&#xB9AC; &#xD655;&#xC778;',cat:'general',icon:'&#x1F333;'},
  {id:'a_save_first',name:'&#xC138;&#xC774;&#xBE0C; &#xB9C8;&#xC2A4;&#xD130;',desc:'&#xCCAB; &#xC138;&#xC774;&#xBE0C; &#xC2AC;&#xB86F; &#xC800;&#xC7A5;',cat:'general',icon:'&#x1F4BE;'},
  {id:'a_arcade',name:'&#xC544;&#xCF00;&#xC774;&#xB4DC; &#xB3C4;&#xC804;&#xC790;',desc:'&#xBBF8;&#xB2C8;&#xAC8C;&#xC784; &#xC544;&#xCF00;&#xC774;&#xB4DC; &#xCCAB; &#xD50C;&#xB808;&#xC774;',cat:'general',icon:'&#x1F579;&#xFE0F;'},
  {id:'a_reaction_s',name:'&#xBC88;&#xAC1C; &#xBC18;&#xC0AC;',desc:'&#xBC18;&#xC751;&#xC18D;&#xB3C4; S&#xB4F1;&#xAE09; (200ms &#xC774;&#xD558;)',cat:'general',icon:'&#x26A1;'},
  {id:'a_color_master',name:'&#xC0C9;&#xC0C1; &#xB9C8;&#xC2A4;&#xD130;',desc:'&#xC0C9;&#xC0C1; &#xAE30;&#xC5B5; &#xB808;&#xBCA8; 5 &#xB3C4;&#xB2EC;',cat:'general',icon:'&#x1F308;'},
  {id:'a_encyclopedia',name:'&#xBC31;&#xACFC;&#xC0AC;&#xC804; &#xD0D0;&#xD5D8;',desc:'&#xBC31;&#xACFC;&#xC0AC;&#xC804; &#xCCAB; &#xC5F4;&#xB78C;',cat:'general',icon:'&#x1F4D6;'},
  {id:'a_season_event',name:'&#xC2DC;&#xC98C; &#xCC38;&#xC5EC;&#xC790;',desc:'&#xC2DC;&#xC98C; &#xC774;&#xBCA4;&#xD2B8; &#xCC38;&#xC5EC;',cat:'general',icon:'&#x1F389;'}
];

function injectV11Achievements(){
  if(!window.AD) return;
  V11_ACHIEVEMENTS.forEach(function(a){
    var exists = window.AD.some(function(x){ return x.id === a.id; });
    if(!exists) window.AD.push(a);
  });
}

function checkAndAwardV11(id){
  if(typeof window.saveAchievement === 'function' && typeof window.showAchieveToast === 'function'){
    var a = V11_ACHIEVEMENTS.filter(function(x){ return x.id === id; })[0];
    if(a && window.saveAchievement(id)){
      window.showAchieveToast(a.name);
      updateV11AchieveCount();
    }
  }
}


// ============================================================
// SFX ENGINE (10종)
// ============================================================
function sfxV11(type){
  if(typeof UISfx === 'undefined' || UISfx.isMuted()) return;
  try{
    UISfx.init(); UISfx.resume();
    var ctx = UISfx._ctx || (window.AudioContext ? new AudioContext() : null);
    if(!ctx) return;
    function beep(freq,dur,vol,waveType){
      var o=ctx.createOscillator(),g=ctx.createGain();
      o.type=waveType||'sine';o.frequency.value=freq;g.gain.value=vol||0.08;
      o.connect(g);g.connect(ctx.destination);o.start();o.stop(ctx.currentTime+dur);
    }
    var sfxMap = {
      ta_open: function(){ beep(600,.06,.08); setTimeout(function(){beep(900,.06,.08);},60); },
      ta_hit: function(){ beep(1200,.04,.1,'triangle'); },
      ta_finish: function(){ [523,659,784,1047].forEach(function(f,i){setTimeout(function(){beep(f,.15,.1,'triangle');},i*80);}); },
      powerup_open: function(){ beep(500,.06,.08); },
      powerup_find: function(){ [660,880,1100].forEach(function(f,i){setTimeout(function(){beep(f,.1,.1,'sine');},i*70);}); },
      custom_open: function(){ beep(700,.05,.07); },
      custom_select: function(){ beep(880,.04,.08,'triangle'); },
      evo_open: function(){ beep(400,.08,.07,'triangle'); setTimeout(function(){beep(600,.08,.07,'triangle');},80); },
      save_open: function(){ beep(500,.06,.07); },
      save_create: function(){ beep(700,.06,.08); setTimeout(function(){beep(1000,.06,.08);},60); },
      save_load: function(){ beep(600,.08,.08,'triangle'); },
      save_delete: function(){ beep(300,.1,.06,'sawtooth'); },
      save_export: function(){ beep(800,.05,.07); },
      arcade_open: function(){ beep(600,.05,.08); setTimeout(function(){beep(800,.05,.08);},50); },
      arcade_win: function(){ [700,880,1100].forEach(function(f,i){setTimeout(function(){beep(f,.08,.1);},i*60);}); },
      arcade_fail: function(){ beep(200,.15,.08,'sawtooth'); },
      color_hit: function(){ beep(1000,.03,.08); },
      rhythm_perfect: function(){ beep(1200,.05,.1,'triangle'); },
      rhythm_good: function(){ beep(800,.05,.08); },
      season_click: function(){ beep(660,.06,.08); setTimeout(function(){beep(880,.06,.08);},60); },
      encyc_open: function(){ beep(550,.06,.07); },
      encyc_tab: function(){ beep(700,.03,.06); }
    };
    if(sfxMap[type]) sfxMap[type]();
  }catch(e){}
}


// ============================================================
// UTILITY & FEATURE TRACKING
// ============================================================
var v11FeaturesUsed = new Set();
function trackV11Feature(id){
  v11FeaturesUsed.add(id);
  try{
    var saved = JSON.parse(localStorage.getItem('hatcuping_v11_features') || '[]');
    if(saved.indexOf(id) === -1){ saved.push(id); localStorage.setItem('hatcuping_v11_features', JSON.stringify(saved)); }
  }catch(e){}
}

function showToastV11(msg){
  var t = document.getElementById('achieveToast');
  if(t){ t.innerHTML = msg; t.classList.add('show'); setTimeout(function(){ t.classList.remove('show'); }, 2500); }
}


// ============================================================
// INJECTION: QUICK ACTIONS, KEYBOARD, FOOTER, NEWS, META
// ============================================================
function injectV11QuickActions(){
  var topBar = document.querySelector('.top-bar');
  if(!topBar) return;

  var btns = [
    {id:'timeAttackBtn',label:'&#xD0C0;&#xC784;&#xC5B4;&#xD0DD;',icon:'&#x23F1;&#xFE0F;',title:'&#xD0C0;&#xC784;&#xC5B4;&#xD0DD; (Shift+I)',action:openTimeAttack},
    {id:'powerupBtn',label:'&#xB3C4;&#xAC10;',icon:'&#x1F4D6;',title:'&#xD30C;&#xC6CC;&#xC5C5; &#xB3C4;&#xAC10; (Shift+U)',action:openPowerupEncyc},
    {id:'customBtn',label:'&#xCEE4;&#xC2A4;&#xD140;',icon:'&#x1F3A8;',title:'&#xCEE4;&#xC2A4;&#xD130;&#xB9C8;&#xC774;&#xC9D5; (Shift+K)',action:openCustomization},
    {id:'evoBtn',label:'&#xC9C4;&#xD654;',icon:'&#x1F333;',title:'&#xC9C4;&#xD654; &#xD2B8;&#xB9AC; (Shift+E)',action:openEvoTree},
    {id:'saveBtn',label:'&#xC138;&#xC774;&#xBE0C;',icon:'&#x1F4BE;',title:'&#xC138;&#xC774;&#xBE0C; &#xAD00;&#xB9AC; (Shift+V)',action:openSaveManager},
    {id:'arcadeBtn',label:'&#xC544;&#xCF00;&#xC774;&#xB4DC;',icon:'&#x1F579;&#xFE0F;',title:'&#xBBF8;&#xB2C8;&#xAC8C;&#xC784; (Shift+A)',action:openArcade},
    {id:'encycBtn',label:'&#xBC31;&#xACFC;',icon:'&#x1F4DA;',title:'&#xBC31;&#xACFC;&#xC0AC;&#xC804; (Shift+N)',action:openEncyclopedia}
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

function injectV11Keyboard(){
  document.addEventListener('keydown', function(e){
    if(e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if(document.querySelector('.modal-overlay.show')) return;

    var key = e.key.toLowerCase();
    if(key === 'i' && e.shiftKey){ e.preventDefault(); openTimeAttack(); }
    else if(key === 'u' && e.shiftKey){ e.preventDefault(); openPowerupEncyc(); }
    else if(key === 'k' && e.shiftKey){ e.preventDefault(); openCustomization(); }
    else if(key === 'e' && e.shiftKey){ e.preventDefault(); openEvoTree(); }
    else if(key === 'v' && e.shiftKey){ e.preventDefault(); openSaveManager(); }
    else if(key === 'a' && e.shiftKey){ e.preventDefault(); openArcade(); }
    else if(key === 'n' && e.shiftKey){ e.preventDefault(); openEncyclopedia(); }
  });
}

function updateV11KeyboardHelp(){
  var kbHelp = document.querySelector('#kbHelp .modal');
  if(!kbHelp) return;
  var newRows = [
    ['&#xD0C0;&#xC784;&#xC5B4;&#xD0DD;','Shift+I'],['&#xD30C;&#xC6CC;&#xC5C5; &#xB3C4;&#xAC10;','Shift+U'],['&#xCEE4;&#xC2A4;&#xD130;&#xB9C8;&#xC774;&#xC9D5;','Shift+K'],
    ['&#xC9C4;&#xD654; &#xD2B8;&#xB9AC;','Shift+E'],['&#xC138;&#xC774;&#xBE0C; &#xAD00;&#xB9AC;','Shift+V'],['&#xBBF8;&#xB2C8;&#xAC8C;&#xC784; &#xC544;&#xCF00;&#xC774;&#xB4DC;','Shift+A'],
    ['&#xBC31;&#xACFC;&#xC0AC;&#xC804;','Shift+N']
  ];
  newRows.forEach(function(r){
    var row = document.createElement('div');
    row.className = 'kb-help-row';
    row.innerHTML = '<span>' + r[0] + '</span><span class="kb-help-key">' + r[1] + '</span>';
    kbHelp.appendChild(row);
  });
}

function updateV11Footer(){
  var ver = document.querySelector('.footer .version');
  if(ver) ver.textContent = 'v11.0 | © PRIME Holdings NEXTERA+PRISM';

  var links = document.querySelector('.footer-links');
  if(links) links.innerHTML = '<span class="footer-link">4&#xC885; &#xAC8C;&#xC784;</span><span class="footer-link">70&#xAC1C; &#xC5C5;&#xC801;</span><span class="footer-link">8&#xC885; &#xD30C;&#xC6CC;&#xC5C5;</span><span class="footer-link">3&#xC885; &#xBBF8;&#xB2C8;&#xAC8C;&#xC784;</span><span class="footer-link">40&#xD56D;&#xBAA9; &#xBC31;&#xACFC;</span>';
}

function updateV11News(){
  var newsSection = document.querySelector('.news-section');
  if(!newsSection) return;
  var firstItem = newsSection.querySelector('.news-item');
  if(!firstItem) return;
  var newItem = document.createElement('div');
  newItem.className = 'news-item';
  newItem.innerHTML = '<span class="news-date">v11.0</span><span class="news-text">&#xD0C0;&#xC784;&#xC5B4;&#xD0DD; 3&#xC885;, &#xD30C;&#xC6CC;&#xC5C5;&#xB3C4;&#xAC10; 8&#xC885;, &#xCEE4;&#xC2A4;&#xD130;&#xB9C8;&#xC774;&#xC9D5;, &#xC9C4;&#xD654;&#xD2B8;&#xB9AC;, &#xC138;&#xC774;&#xBE0C;&#xC2AC;&#xB86F; 3&#xAC1C;, &#xBBF8;&#xB2C8;&#xAC8C;&#xC784; &#xC544;&#xCF00;&#xC774;&#xB4DC; 3&#xC885;, &#xC2DC;&#xC98C;&#xC774;&#xBCA4;&#xD2B8;, &#xBC31;&#xACFC;&#xC0AC;&#xC804; 40&#xD56D;&#xBAA9;, &#xD000;&#xC988;+15(45), &#xC5C5;&#xC801;+12(70)</span>';
  firstItem.parentNode.insertBefore(newItem, firstItem);
}

function updateV11AchieveCount(){
  var el = document.getElementById('achieveCount');
  if(el){
    var c = 0;
    try{ c = Object.keys(JSON.parse(localStorage.getItem('hatcuping_achievements') || '{}')).length; }catch(e){}
    var t = window.AD ? window.AD.length : 70;
    el.textContent = c + '/' + t;
  }
}

function updateV11Meta(){
  var descMeta = document.querySelector('meta[name="description"]');
  if(descMeta) descMeta.content = '사랑의 하츄핑 v11.0 - 플랫포머 액션, 턴제 RPG, 오픈월드, UNIFIED 4종 게임. 업적 70개, 타임어택, 파워업도감 8종, 커스터마이징, 진화트리, 세이브슬롯, 미니게임 아케이드 3종, 백과사전 40항목!';
  document.title = '사랑의 하츄핑 v11.0 - 게임 선택';
}


// ============================================================
// BOOT
// ============================================================
function bootV11(){
  injectV11Achievements();
  injectExtraQuizV11();
  injectV11QuickActions();
  injectV11Keyboard();
  updateV11KeyboardHelp();
  updateV11Footer();
  updateV11News();
  updateV11AchieveCount();
  updateV11Meta();
  injectSeasonBanner();
}

if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', bootV11);
} else {
  bootV11();
}

})();

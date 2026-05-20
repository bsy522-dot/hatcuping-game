// hatcuping-game v8_patch.js - NEXTERA+PRISM AUTO v8.0
// Self-contained patch module (720+ lines, 28 functions)
(function(){
'use strict';

// ============================================================
// 1. CHARACTER ENCYCLOPEDIA (캐릭터 도감 12종)
// ============================================================
const CHARACTERS = [
  {id:'romi',name:'로미',role:'주인공',grade:'SSR',hp:100,atk:15,def:10,spd:12,
   desc:'이모션 왕국의 용감한 소녀. 하츄핑과 함께 모험을 떠난다.',
   skill:'사랑의 마법',element:'love',color:'#FF6B9D'},
  {id:'hatchu',name:'하츄핑',role:'파트너',grade:'SSR',hp:80,atk:18,def:8,spd:14,
   desc:'사랑의 감정을 다루는 티니핑. 로미의 가장 소중한 친구.',
   skill:'하트 어택',element:'love',color:'#FF9ED8'},
  {id:'baro',name:'바로핑',role:'서포터',grade:'SR',hp:90,atk:10,def:15,spd:8,
   desc:'정의감 넘치는 티니핑. 항상 올바른 길을 찾으려 한다.',
   skill:'정의의 방패',element:'justice',color:'#5FA2FF'},
  {id:'chacha',name:'차차핑',role:'힐러',grade:'SR',hp:70,atk:8,def:12,spd:11,
   desc:'차분하고 지혜로운 티니핑. 동료들을 치유해준다.',
   skill:'힐링 브리즈',element:'calm',color:'#88DDAA'},
  {id:'kkong',name:'꽁꽁핑',role:'탱커',grade:'SR',hp:120,atk:12,def:20,spd:6,
   desc:'얼음의 힘을 가진 단단한 티니핑. 모두를 지켜준다.',
   skill:'아이스 월',element:'ice',color:'#88CCFF'},
  {id:'bukku',name:'부끄핑',role:'서포터',grade:'R',hp:65,atk:7,def:9,spd:13,
   desc:'수줍음이 많지만 마음이 따뜻한 티니핑.',
   skill:'숨바꼭질',element:'shy',color:'#FFB088'},
  {id:'lala',name:'라라핑',role:'딜러',grade:'SR',hp:75,atk:16,def:7,spd:15,
   desc:'음악을 사랑하는 밝고 쾌활한 티니핑.',
   skill:'멜로디 블래스트',element:'music',color:'#FFE44D'},
  {id:'trup',name:'트러핑',role:'보스',grade:'SSR',hp:150,atk:20,def:18,spd:10,
   desc:'이모션 왕국의 숨겨진 보스. 진정한 우정을 알게 된다.',
   skill:'다크 스톰',element:'dark',color:'#8B5CF6'},
  {id:'stick',name:'스틱핑',role:'딜러',grade:'R',hp:60,atk:14,def:6,spd:16,
   desc:'장난기 가득한 활발한 티니핑. 빠른 연속 공격이 특기.',
   skill:'스틱 콤보',element:'fun',color:'#FF8C44'},
  {id:'liam',name:'리암',role:'라이벌',grade:'SR',hp:95,atk:17,def:14,spd:11,
   desc:'로미의 라이벌이자 친구. 강한 의지의 소유자.',
   skill:'라이벌 스트라이크',element:'will',color:'#6366F1'},
  {id:'monju',name:'몬주',role:'가이드',grade:'R',hp:50,atk:5,def:5,spd:20,
   desc:'이모션 왕국의 안내자. 모험의 길을 알려준다.',
   skill:'가이드 라이트',element:'wisdom',color:'#C084FC'},
  {id:'hk',name:'해킹',role:'빌런',grade:'SSR',hp:200,atk:22,def:16,spd:9,
   desc:'감정을 왜곡하는 강력한 적. 최종 보스로 등장.',
   skill:'이모션 브레이크',element:'chaos',color:'#EF4444'}
];

function openEncyclopedia(){
  if(document.getElementById('encycModal')) return;
  const overlay = document.createElement('div');
  overlay.id = 'encycModal';
  overlay.className = 'modal-overlay show';
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');
  overlay.setAttribute('aria-label','캐릭터 도감');

  const unlocked = getEncycProgress();
  const totalU = Object.keys(unlocked).length;

  let html = '<div class="modal" style="max-width:440px;max-height:85vh;overflow-y:auto">';
  html += '<button class="modal-close" id="encycClose" aria-label="닫기">&times;</button>';
  html += '<h3 style="font-size:17px">&#x1F4D6; 캐릭터 도감 <span style="font-size:12px;color:var(--text-sub);margin-left:8px">' + totalU + '/' + CHARACTERS.length + '</span></h3>';

  // Grade filter tabs
  html += '<div style="display:flex;gap:4px;margin-bottom:12px;flex-wrap:wrap">';
  ['전체','SSR','SR','R'].forEach(g => {
    html += '<button class="encyc-grade-btn" data-grade="' + g + '" style="padding:4px 10px;border-radius:12px;border:1px solid var(--border);background:' + (g==='전체'?'var(--pink)':'transparent') + ';color:' + (g==='전체'?'#fff':'var(--text-sub)') + ';font-size:11px;font-weight:700;cursor:pointer">' + g + '</button>';
  });
  html += '</div>';

  html += '<div id="encycList"></div></div>';
  overlay.innerHTML = html;
  document.body.appendChild(overlay);

  renderEncycList('전체');

  document.getElementById('encycClose').onclick = () => overlay.remove();
  overlay.onclick = e => { if(e.target === overlay) overlay.remove(); };
  document.querySelectorAll('.encyc-grade-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.encyc-grade-btn').forEach(b => {
        b.style.background = 'transparent'; b.style.color = 'var(--text-sub)';
      });
      btn.style.background = 'var(--pink)'; btn.style.color = '#fff';
      renderEncycList(btn.dataset.grade);
      if(window.UISfx) UISfx.click();
    };
  });
  if(window.UISfx) UISfx.click();
}

function renderEncycList(grade){
  const list = document.getElementById('encycList');
  if(!list) return;
  const unlocked = getEncycProgress();
  const filtered = grade === '전체' ? CHARACTERS : CHARACTERS.filter(c => c.grade === grade);

  list.innerHTML = filtered.map(c => {
    const isUnlocked = unlocked[c.id] || false;
    const gradeColors = {SSR:'#FFD700',SR:'#C0C0FF',R:'#CD7F32'};
    return '<div style="display:flex;gap:10px;padding:10px;margin-bottom:6px;border-radius:14px;background:' + (isUnlocked ? 'rgba(255,107,157,.06)' : 'rgba(0,0,0,.02)') + ';border:1px solid ' + (isUnlocked ? c.color+'33' : 'transparent') + ';opacity:' + (isUnlocked ? '1' : '.5') + '">' +
      '<div style="width:42px;height:42px;border-radius:12px;background:' + (isUnlocked ? 'linear-gradient(135deg,'+c.color+'44,'+c.color+'22)' : 'rgba(0,0,0,.06)') + ';display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">' + (isUnlocked ? getCharEmoji(c.id) : '&#x1F512;') + '</div>' +
      '<div style="flex:1;min-width:0">' +
        '<div style="display:flex;align-items:center;gap:6px;margin-bottom:2px">' +
          '<span style="font-size:13px;font-weight:700">' + (isUnlocked ? c.name : '???') + '</span>' +
          '<span style="font-size:9px;padding:1px 6px;border-radius:8px;background:' + (gradeColors[c.grade]||'#ccc') + '22;color:' + (gradeColors[c.grade]||'#ccc') + ';font-weight:800">' + c.grade + '</span>' +
          (isUnlocked ? '<span style="font-size:9px;padding:1px 6px;border-radius:8px;background:'+c.color+'22;color:'+c.color+';font-weight:600">'+c.role+'</span>' : '') +
        '</div>' +
        (isUnlocked ? '<div style="font-size:11px;color:var(--text-sub);line-height:1.4;margin-bottom:4px">' + c.desc + '</div>' +
          '<div style="display:flex;gap:4px;flex-wrap:wrap">' +
            statPill('HP',c.hp,'#4CAF50') + statPill('ATK',c.atk,'#F44336') + statPill('DEF',c.def,'#2196F3') + statPill('SPD',c.spd,'#FF9800') +
          '</div>' +
          '<div style="font-size:10px;color:'+c.color+';font-weight:600;margin-top:3px">&#x2728; ' + c.skill + '</div>'
        : '<div style="font-size:11px;color:var(--text-sub)">게임을 플레이하여 해금하세요</div>') +
      '</div></div>';
  }).join('');
}

function statPill(label, val, color){
  return '<span style="font-size:9px;padding:1px 6px;border-radius:8px;background:'+color+'15;color:'+color+';font-weight:600">'+label+' '+val+'</span>';
}

function getCharEmoji(id){
  const map = {romi:'&#x1F467;',hatchu:'&#x1F496;',baro:'&#x1F6E1;',chacha:'&#x1F33F;',kkong:'&#x2744;',bukku:'&#x1F60A;',lala:'&#x1F3B5;',trup:'&#x1F47E;',stick:'&#x26A1;',liam:'&#x2694;',monju:'&#x1F52E;',hk:'&#x1F525;'};
  return map[id] || '&#x2753;';
}

function getEncycProgress(){
  try{ return JSON.parse(localStorage.getItem('hatcuping_encyc') || '{}'); }catch(e){ return {}; }
}
function unlockCharacter(id){
  const p = getEncycProgress();
  if(p[id]) return false;
  p[id] = Date.now();
  try{ localStorage.setItem('hatcuping_encyc', JSON.stringify(p)); }catch(e){}
  return true;
}
// Auto-unlock basic characters on first load
(function(){
  const basics = ['romi','hatchu','baro'];
  basics.forEach(id => unlockCharacter(id));
})();


// ============================================================
// 2. SOUNDTRACK PLAYER (사운드트랙 7곡)
// ============================================================
const TRACKS = [
  {name:'타이틀 테마',notes:[523,659,784,659],type:'sine',bpm:110,dur:4000},
  {name:'성 안의 모험',notes:[392,494,587,494,523,659,587,494],type:'triangle',bpm:130,dur:5000},
  {name:'숲의 여정',notes:[523,587,659,784,659,587,523,440],type:'sine',bpm:140,dur:4500},
  {name:'어둠의 통로',notes:[220,262,294,220,196,233,262,196],type:'sawtooth',bpm:120,dur:5500},
  {name:'보스 배틀',notes:[330,392,440,494,440,392,330,294],type:'square',bpm:170,dur:3800},
  {name:'필드 탐험',notes:[392,440,494,523,494,440,392,349],type:'sine',bpm:135,dur:4500},
  {name:'승리의 팡파레',notes:[523,587,659,784,880,1047,1319],type:'triangle',bpm:100,dur:5000}
];
let stCtx = null, stInterval = null, stPlaying = -1;

function openSoundtrack(){
  if(document.getElementById('stModal')) return;
  const overlay = document.createElement('div');
  overlay.id = 'stModal';
  overlay.className = 'modal-overlay show';
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');

  let html = '<div class="modal" style="max-width:380px">';
  html += '<button class="modal-close" id="stClose" aria-label="닫기">&times;</button>';
  html += '<h3 style="font-size:17px">&#x1F3B5; 사운드트랙</h3>';
  html += '<div id="stNowPlaying" style="text-align:center;padding:12px;margin-bottom:10px;background:rgba(255,95,162,.04);border-radius:14px">';
  html += '<div style="font-size:28px;margin-bottom:4px">&#x1F3B6;</div>';
  html += '<div style="font-size:12px;color:var(--text-sub)">곡을 선택하세요</div></div>';
  html += '<div id="stList">';
  TRACKS.forEach((t, i) => {
    html += '<div class="st-track" data-idx="'+i+'" style="display:flex;align-items:center;gap:10px;padding:10px;margin-bottom:4px;border-radius:12px;cursor:pointer;transition:all .2s;background:rgba(0,0,0,.02)">';
    html += '<div style="width:32px;height:32px;border-radius:10px;background:linear-gradient(135deg,var(--pink),var(--purple));display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:800">' + (i+1) + '</div>';
    html += '<div style="flex:1"><div style="font-size:13px;font-weight:700">' + t.name + '</div>';
    html += '<div style="font-size:10px;color:var(--text-sub)">' + t.type + ' | ' + t.bpm + ' BPM</div></div>';
    html += '<span class="st-play-icon" style="font-size:16px">&#x25B6;</span></div>';
  });
  html += '</div>';
  html += '<button id="stStopAll" style="width:100%;padding:8px;margin-top:8px;background:rgba(0,0,0,.05);border:none;border-radius:12px;font-size:12px;font-weight:700;cursor:pointer;color:var(--text-sub)">&#x23F9; 정지</button>';
  html += '</div>';
  overlay.innerHTML = html;
  document.body.appendChild(overlay);

  document.querySelectorAll('.st-track').forEach(el => {
    el.onmouseenter = () => { el.style.background = 'rgba(255,95,162,.08)'; };
    el.onmouseleave = () => { el.style.background = el.dataset.idx == stPlaying ? 'rgba(255,95,162,.12)' : 'rgba(0,0,0,.02)'; };
    el.onclick = () => playSoundtrack(parseInt(el.dataset.idx));
  });

  document.getElementById('stClose').onclick = () => { stopSoundtrack(); overlay.remove(); };
  document.getElementById('stStopAll').onclick = stopSoundtrack;
  overlay.onclick = e => { if(e.target === overlay) { stopSoundtrack(); overlay.remove(); } };
  if(window.UISfx) UISfx.click();
}

function playSoundtrack(idx){
  stopSoundtrack();
  if(!stCtx) try{ stCtx = new (window.AudioContext || window.webkitAudioContext)(); }catch(e){ return; }
  if(stCtx.state === 'suspended') stCtx.resume();

  stPlaying = idx;
  const t = TRACKS[idx];
  let step = 0;
  const beatMs = 60000 / t.bpm;

  stInterval = setInterval(() => {
    if(window.UISfx && UISfx.isMuted()) return;
    const freq = t.notes[step % t.notes.length];
    if(freq > 0){
      try{
        const o = stCtx.createOscillator(), g = stCtx.createGain();
        o.type = t.type; o.frequency.value = freq;
        g.gain.value = 0.08;
        g.gain.exponentialRampToValueAtTime(0.001, stCtx.currentTime + beatMs/1000);
        o.connect(g); g.connect(stCtx.destination);
        o.start(); o.stop(stCtx.currentTime + beatMs/1000);
      }catch(e){}
    }
    step++;
  }, beatMs);

  const np = document.getElementById('stNowPlaying');
  if(np) np.innerHTML = '<div style="font-size:28px;margin-bottom:4px;animation:titlePulse 1s ease-in-out infinite">&#x1F3B6;</div><div style="font-size:13px;font-weight:700;color:var(--pink)">' + t.name + '</div><div style="font-size:10px;color:var(--text-sub)">재생 중...</div>';

  document.querySelectorAll('.st-track').forEach(el => {
    el.style.background = el.dataset.idx == idx ? 'rgba(255,95,162,.12)' : 'rgba(0,0,0,.02)';
    el.querySelector('.st-play-icon').textContent = el.dataset.idx == idx ? '⏸' : '▶';
  });
}

function stopSoundtrack(){
  if(stInterval){ clearInterval(stInterval); stInterval = null; }
  stPlaying = -1;
  const np = document.getElementById('stNowPlaying');
  if(np) np.innerHTML = '<div style="font-size:28px;margin-bottom:4px">&#x1F3B6;</div><div style="font-size:12px;color:var(--text-sub)">곡을 선택하세요</div>';
  document.querySelectorAll('.st-track').forEach(el => {
    el.style.background = 'rgba(0,0,0,.02)';
    const icon = el.querySelector('.st-play-icon');
    if(icon) icon.textContent = '▶';
  });
}


// ============================================================
// 3. TIPS & STRATEGY GUIDE (게임 공략 가이드)
// ============================================================
const TIPS = [
  {cat:'플랫포머',title:'더블점프 활용법',desc:'공중에서 한 번 더 점프하면 높은 곳에 도달 가능! 타이밍이 핵심.',icon:'&#x1F3C3;'},
  {cat:'플랫포머',title:'대시 콤보',desc:'대시 직후 점프하면 더 멀리 이동. 보스전에서 필수 기술!',icon:'&#x1F4A8;'},
  {cat:'플랫포머',title:'벽 슬라이드',desc:'벽에 붙으면 천천히 미끄러진다. 벽타기로 숨겨진 루트를 발견하자!',icon:'&#x1F9D7;'},
  {cat:'플랫포머',title:'체크포인트 위치',desc:'매 스테이지 중간에 체크포인트가 있다. 놓치지 말고 지나가자!',icon:'&#x2705;'},
  {cat:'플랫포머',title:'보스전 패턴',desc:'보스는 3페이즈로 나뉜다. 각 페이즈마다 공격 패턴이 달라지니 관찰하자!',icon:'&#x1F409;'},
  {cat:'RPG',title:'파티 편성',desc:'탱커+딜러+힐러 조합이 기본. 몬스터 속성에 맞춰 교체하자!',icon:'&#x1F46B;'},
  {cat:'RPG',title:'포획 팁',desc:'적 HP가 낮을수록 포획 확률 상승. 보스는 포획 불가!',icon:'&#x1FA78;'},
  {cat:'RPG',title:'미니게임 보상',desc:'미니게임 클리어 시 특별 아이템 획득. 반복 플레이로 레벨업!',icon:'&#x1F3AE;'},
  {cat:'RPG',title:'레벨업 전략',desc:'잡몹 반복 사냥보다 퀘스트 클리어가 경험치 효율이 높다.',icon:'&#x1F4AB;'},
  {cat:'RPG',title:'속성 상성표',desc:'사랑>어둠>정의>사랑. 상성을 활용하면 데미지 1.5배!',icon:'&#x2694;'},
  {cat:'공통',title:'다크모드 꿀팁',desc:'다크모드에서 게임 클리어 시 &quot;어둠의 지배자&quot; 업적 달성!',icon:'&#x1F319;'},
  {cat:'공통',title:'일일 챌린지',desc:'매일 오전 0시에 새 챌린지 갱신. 연속 달성 시 보너스!',icon:'&#x1F31F;'}
];

function openTipsGuide(){
  if(document.getElementById('tipsModal')) return;
  const overlay = document.createElement('div');
  overlay.id = 'tipsModal';
  overlay.className = 'modal-overlay show';
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');

  let html = '<div class="modal" style="max-width:400px;max-height:82vh;overflow-y:auto">';
  html += '<button class="modal-close" id="tipsClose" aria-label="닫기">&times;</button>';
  html += '<h3 style="font-size:17px">&#x1F4DD; 공략 가이드</h3>';
  html += '<div style="display:flex;gap:4px;margin-bottom:12px;flex-wrap:wrap">';
  ['전체','플랫포머','RPG','공통'].forEach(c => {
    html += '<button class="tips-cat-btn" data-cat="'+c+'" style="padding:4px 10px;border-radius:12px;border:1px solid var(--border);background:'+(c==='전체'?'var(--pink)':'transparent')+';color:'+(c==='전체'?'#fff':'var(--text-sub)')+';font-size:11px;font-weight:700;cursor:pointer">'+c+'</button>';
  });
  html += '</div><div id="tipsList"></div></div>';
  overlay.innerHTML = html;
  document.body.appendChild(overlay);
  renderTips('전체');

  document.getElementById('tipsClose').onclick = () => overlay.remove();
  overlay.onclick = e => { if(e.target === overlay) overlay.remove(); };
  document.querySelectorAll('.tips-cat-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.tips-cat-btn').forEach(b => { b.style.background='transparent'; b.style.color='var(--text-sub)'; });
      btn.style.background='var(--pink)'; btn.style.color='#fff';
      renderTips(btn.dataset.cat);
      if(window.UISfx) UISfx.click();
    };
  });
  if(window.UISfx) UISfx.click();
}

function renderTips(cat){
  const list = document.getElementById('tipsList');
  if(!list) return;
  const items = cat === '전체' ? TIPS : TIPS.filter(t => t.cat === cat);
  list.innerHTML = items.map(t =>
    '<div style="padding:10px;margin-bottom:6px;border-radius:14px;background:rgba(0,0,0,.02);border:1px solid var(--border)">' +
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">' +
        '<span style="font-size:18px">' + t.icon + '</span>' +
        '<span style="font-size:13px;font-weight:700">' + t.title + '</span>' +
        '<span style="font-size:9px;padding:1px 6px;border-radius:8px;background:rgba(255,95,162,.08);color:var(--pink);font-weight:600;margin-left:auto">' + t.cat + '</span>' +
      '</div>' +
      '<div style="font-size:12px;color:var(--text-sub);line-height:1.5;padding-left:26px">' + t.desc + '</div>' +
    '</div>'
  ).join('');
}


// ============================================================
// 4. SHARE CARD (공유 카드 Canvas 생성)
// ============================================================
function openShareCard(){
  if(document.getElementById('shareModal')) return;
  const overlay = document.createElement('div');
  overlay.id = 'shareModal';
  overlay.className = 'modal-overlay show';
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');

  let html = '<div class="modal" style="max-width:380px;text-align:center">';
  html += '<button class="modal-close" id="shareClose" aria-label="닫기">&times;</button>';
  html += '<h3 style="font-size:17px">&#x1F4F8; 공유 카드</h3>';
  html += '<canvas id="shareCanvas" width="600" height="380" style="width:100%;border-radius:12px;margin:8px 0"></canvas>';
  html += '<div style="display:flex;gap:8px;justify-content:center;margin-top:8px">';
  html += '<button id="shareDownload" style="padding:8px 16px;background:linear-gradient(135deg,var(--pink),var(--purple));color:#fff;border:none;border-radius:12px;font-size:12px;font-weight:700;cursor:pointer">&#x1F4E5; 다운로드</button>';
  html += '<button id="shareCopy" style="padding:8px 16px;background:rgba(0,0,0,.06);color:var(--text);border:none;border-radius:12px;font-size:12px;font-weight:700;cursor:pointer">&#x1F4CB; 복사</button>';
  html += '</div></div>';
  overlay.innerHTML = html;
  document.body.appendChild(overlay);

  drawShareCard();

  document.getElementById('shareClose').onclick = () => overlay.remove();
  overlay.onclick = e => { if(e.target === overlay) overlay.remove(); };
  document.getElementById('shareDownload').onclick = downloadShareCard;
  document.getElementById('shareCopy').onclick = copyShareCard;
  if(window.UISfx) UISfx.click();
}

function drawShareCard(){
  const cv = document.getElementById('shareCanvas');
  if(!cv) return;
  const ctx = cv.getContext('2d');
  const W = 600, H = 380;

  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, '#FF6B9D');
  grad.addColorStop(0.5, '#B066FF');
  grad.addColorStop(1, '#6366F1');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = 'rgba(255,255,255,.08)';
  for(let i = 0; i < 6; i++){
    ctx.beginPath();
    ctx.arc(100 + i*100, 60 + (i%2)*260, 40 + i*10, 0, Math.PI*2);
    ctx.fill();
  }

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 28px -apple-system,BlinkMacSystemFont,sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('❤️ 사랑의 하츄핑', W/2, 50);

  ctx.font = '14px -apple-system,BlinkMacSystemFont,sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,.7)';
  ctx.fillText('My Game Stats', W/2, 75);

  const stats = getStatsV8();
  const items = [
    {label:'플레이(min)', val: Math.floor(stats.playTime/60), icon:'⏱'},
    {label:'클리어', val: stats.clears, icon:'⭐'},
    {label:'콤보', val: stats.combos, icon:'🔥'},
    {label:'업적', val: getAchieveCountV8(), icon:'🏆'},
    {label:'도감', val: Object.keys(getEncycProgress()).length, icon:'📖'},
    {label:'출석', val: getStreakDays(), icon:'📅'}
  ];

  const cardW = 80, cardH = 80, startX = (W - items.length * (cardW+12) + 12) / 2, startY = 105;
  items.forEach((item, i) => {
    const x = startX + i * (cardW + 12), y = startY;
    ctx.fillStyle = 'rgba(255,255,255,.15)';
    roundRect(ctx, x, y, cardW, cardH, 12);
    ctx.fill();

    ctx.font = '22px -apple-system,BlinkMacSystemFont,sans-serif';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText(item.icon, x + cardW/2, y + 28);

    ctx.font = 'bold 20px -apple-system,BlinkMacSystemFont,sans-serif';
    ctx.fillText(String(item.val), x + cardW/2, y + 52);

    ctx.font = '10px -apple-system,BlinkMacSystemFont,sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,.7)';
    ctx.fillText(item.label, x + cardW/2, y + 70);
  });

  // Achievements progress bar
  const ac = getAchieveCountV8(), at = getAchieveTotalV8();
  const bx = 60, by = 220, bw = W - 120, bh = 16;
  ctx.fillStyle = 'rgba(255,255,255,.15)';
  roundRect(ctx, bx, by, bw, bh, 8); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.6)';
  roundRect(ctx, bx, by, bw * Math.min(ac/at, 1), bh, 8); ctx.fill();
  ctx.font = '11px -apple-system,BlinkMacSystemFont,sans-serif';
  ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
  ctx.fillText('업적 ' + ac + '/' + at + ' (' + Math.round(ac/at*100) + '%)', W/2, by + 38);

  // Date stamp
  const now = new Date();
  const dateStr = now.getFullYear() + '.' + String(now.getMonth()+1).padStart(2,'0') + '.' + String(now.getDate()).padStart(2,'0');
  ctx.font = '12px -apple-system,BlinkMacSystemFont,sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,.5)';
  ctx.textAlign = 'center';
  ctx.fillText(dateStr + ' | PRIME Holdings NEXTERA+PRISM', W/2, H - 20);

  // Decorative hearts
  ctx.fillStyle = 'rgba(255,255,255,.12)';
  ctx.font = '36px sans-serif';
  ctx.fillText('❤', 50, 340);
  ctx.fillText('❤', W - 50, 340);
}

function roundRect(ctx, x, y, w, h, r){
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.lineTo(x+w-r, y);
  ctx.quadraticCurveTo(x+w, y, x+w, y+r);
  ctx.lineTo(x+w, y+h-r);
  ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
  ctx.lineTo(x+r, y+h);
  ctx.quadraticCurveTo(x, y+h, x, y+h-r);
  ctx.lineTo(x, y+r);
  ctx.quadraticCurveTo(x, y, x+r, y);
  ctx.closePath();
}

function downloadShareCard(){
  const cv = document.getElementById('shareCanvas');
  if(!cv) return;
  const a = document.createElement('a');
  a.download = 'hatcuping-stats.png';
  a.href = cv.toDataURL('image/png');
  a.click();
  sfxV8('share');
}

function copyShareCard(){
  const cv = document.getElementById('shareCanvas');
  if(!cv) return;
  cv.toBlob(blob => {
    if(navigator.clipboard && navigator.clipboard.write){
      navigator.clipboard.write([new ClipboardItem({'image/png': blob})]).then(() => {
        showToastV8('📋 복사 완료!');
      }).catch(() => { showToastV8('📥 다운로드를 이용해주세요'); });
    } else {
      showToastV8('📥 다운로드를 이용해주세요');
    }
  }, 'image/png');
}


// ============================================================
// 5. LOGIN STREAK (연속 출석 시스템)
// ============================================================
function getStreakData(){
  try{ return JSON.parse(localStorage.getItem('hatcuping_streak') || '{"days":0,"lastDate":"","total":0}'); }catch(e){ return {days:0,lastDate:'',total:0}; }
}

function updateStreak(){
  const data = getStreakData();
  const today = new Date().toISOString().slice(0, 10);
  if(data.lastDate === today) return data;

  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if(data.lastDate === yesterday){
    data.days++;
  } else {
    data.days = 1;
  }
  data.lastDate = today;
  data.total = (data.total || 0) + 1;
  try{ localStorage.setItem('hatcuping_streak', JSON.stringify(data)); }catch(e){}

  if(data.days === 7) checkAndAward('a_streak_7');
  if(data.days === 30) checkAndAward('a_streak_30');
  if(data.total >= 10) checkAndAward('a_loyal_player');

  return data;
}

function getStreakDays(){
  return getStreakData().days || 0;
}


// ============================================================
// 6. SEASONAL EVENT SYSTEM (계절 이벤트)
// ============================================================
function getSeasonalTheme(){
  const month = new Date().getMonth() + 1;
  if(month >= 3 && month <= 5) return {name:'봄 페스티벌',emoji:'🌸',color:'#FF9ED8',particles:['🌸','🌼','🌺']};
  if(month >= 6 && month <= 8) return {name:'여름 어드벤처',emoji:'☀️',color:'#FFD54F',particles:['☀️','🌴','🌊']};
  if(month >= 9 && month <= 11) return {name:'가을 하베스트',emoji:'🍁',color:'#FF8C44',particles:['🍁','🍂','🍃']};
  return {name:'겨울 원더랜드',emoji:'❄️',color:'#88CCFF',particles:['❄️','⭐','🌟']};
}

function injectSeasonalBanner(){
  const theme = getSeasonalTheme();
  const dc = document.getElementById('dailyChallenge');
  if(!dc) return;

  const banner = document.createElement('div');
  banner.id = 'seasonalBanner';
  banner.style.cssText = 'width:100%;max-width:420px;margin-bottom:8px;padding:10px 16px;background:linear-gradient(135deg,'+theme.color+'15,'+theme.color+'08);border-radius:14px;border:1px solid '+theme.color+'30;text-align:center;opacity:0;animation:fadeUp .8s .35s forwards;cursor:default';
  banner.innerHTML = '<span style="font-size:16px">' + theme.emoji + '</span> <span style="font-size:12px;font-weight:700;color:'+theme.color+'">' + theme.name + '</span> <span style="font-size:11px;color:var(--text-sub)">| 시즌 이벤트 진행 중!</span>';
  dc.parentNode.insertBefore(banner, dc);
}


// ============================================================
// 7. MEMORY MINI-GAME (기억력 미니게임)
// ============================================================
function openMemoryGame(){
  if(document.getElementById('memModal')) return;
  const overlay = document.createElement('div');
  overlay.id = 'memModal';
  overlay.className = 'modal-overlay show';
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');

  const emojis = ['💖','💛','💜','💙','💚','❤️','🩷','🖤'];
  const pairs = emojis.slice(0, 6);
  const cards = [...pairs, ...pairs].sort(() => Math.random() - 0.5);

  let html = '<div class="modal" style="max-width:360px;text-align:center">';
  html += '<button class="modal-close" id="memClose" aria-label="닫기">&times;</button>';
  html += '<h3 style="font-size:17px">&#x1F9E0; 기억력 게임</h3>';
  html += '<div style="font-size:12px;color:var(--text-sub);margin-bottom:10px">같은 카드 짝을 찾으세요! <span id="memMoves">0</span>회</div>';
  html += '<div id="memGrid" style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;max-width:260px;margin:0 auto">';
  cards.forEach((emoji, i) => {
    html += '<div class="mem-card" data-idx="'+i+'" data-emoji="'+emoji+'" style="width:60px;height:60px;border-radius:12px;background:linear-gradient(135deg,var(--pink),var(--purple));display:flex;align-items:center;justify-content:center;font-size:24px;cursor:pointer;transition:all .3s;user-select:none;color:#fff">?</div>';
  });
  html += '</div>';
  html += '<div id="memResult" style="margin-top:10px;font-size:13px;font-weight:700;color:var(--pink);min-height:20px"></div>';
  html += '</div>';
  overlay.innerHTML = html;
  document.body.appendChild(overlay);

  let flipped = [], matched = 0, moves = 0, locked = false;

  document.querySelectorAll('.mem-card').forEach(card => {
    card.onclick = () => {
      if(locked || card.dataset.matched === 'true' || flipped.includes(card)) return;
      card.textContent = card.dataset.emoji;
      card.style.background = 'rgba(255,95,162,.1)';
      card.style.transform = 'scale(1.05)';
      flipped.push(card);
      sfxV8('mem_flip');

      if(flipped.length === 2){
        moves++;
        document.getElementById('memMoves').textContent = moves;
        locked = true;

        if(flipped[0].dataset.emoji === flipped[1].dataset.emoji){
          flipped.forEach(c => { c.dataset.matched = 'true'; c.style.background = 'rgba(76,175,80,.15)'; c.style.border = '2px solid rgba(76,175,80,.3)'; });
          matched += 2;
          sfxV8('mem_match');
          flipped = [];
          locked = false;

          if(matched === cards.length){
            document.getElementById('memResult').textContent = '🎉 ' + moves + '회만에 완료! ';
            sfxV8('mem_win');
            checkAndAward('a_minigame_clear');
            if(moves <= 10) checkAndAward('a_memory_master');
          }
        } else {
          setTimeout(() => {
            flipped.forEach(c => { c.textContent = '?'; c.style.background = 'linear-gradient(135deg,var(--pink),var(--purple))'; c.style.transform = 'scale(1)'; });
            flipped = [];
            locked = false;
          }, 700);
        }
      }
    };
  });

  document.getElementById('memClose').onclick = () => overlay.remove();
  overlay.onclick = e => { if(e.target === overlay) overlay.remove(); };
  if(window.UISfx) UISfx.click();
}


// ============================================================
// 8. NEW ACHIEVEMENTS (+10, total 34)
// ============================================================
const NEW_ACHIEVEMENTS = [
  {id:'a_encyc_all',name:'도감 마스터',desc:'캐릭터 12종 모두 해금',cat:'general',icon:'📖'},
  {id:'a_streak_7',name:'7일 연속 출석',desc:'7일 연속으로 방문',cat:'general',icon:'🔥'},
  {id:'a_streak_30',name:'30일 연속 출석',desc:'30일 연속으로 방문',cat:'general',icon:'💪'},
  {id:'a_loyal_player',name:'충성 플레이어',desc:'총 10일 방문',cat:'general',icon:'❤️'},
  {id:'a_minigame_clear',name:'미니게임 콌러',desc:'기억력 미니게임 클리어',cat:'general',icon:'🧠'},
  {id:'a_memory_master',name:'기억의 달인',desc:'미니게임 10회 이하로 클리어',cat:'general',icon:'🏅'},
  {id:'a_share_first',name:'첫 공유',desc:'공유 카드 처음 생성',cat:'general',icon:'📸'},
  {id:'a_soundtrack_all',name:'음악 감상가',desc:'사운드트랙 전곡 감상',cat:'general',icon:'🎵'},
  {id:'a_tips_reader',name:'공략 마스터',desc:'공략 가이드 열람',cat:'general',icon:'📝'},
  {id:'a_seasonal',name:'시즌 플레이어',desc:'계절 이벤트 중 방문',cat:'general',icon:'🌸'}
];

function injectNewAchievements(){
  if(!window.AD) return;
  NEW_ACHIEVEMENTS.forEach(a => {
    if(!window.AD.find(x => x.id === a.id)){
      window.AD.push(a);
    }
  });
}

function checkAndAward(id){
  if(!window.saveAchievement) return;
  if(window.saveAchievement(id)){
    const def = [...(window.AD||[]),...NEW_ACHIEVEMENTS].find(a => a.id === id);
    if(def && window.showAchieveToast) window.showAchieveToast(def.name);
    if(window.updateAchieveCount) window.updateAchieveCount();
  }
}

function getAchieveCountV8(){
  try{ return Object.keys(JSON.parse(localStorage.getItem('hatcuping_achievements') || '{}')).length; }catch(e){ return 0; }
}
function getAchieveTotalV8(){
  return (window.AD ? window.AD.length : 24) + NEW_ACHIEVEMENTS.length;
}
function getStatsV8(){
  try{ return JSON.parse(localStorage.getItem('hatcuping_stats') || '{"playTime":0,"clears":0,"deaths":0,"combos":0,"hearts":0}'); }catch(e){ return {playTime:0,clears:0,deaths:0,combos:0,hearts:0}; }
}


// ============================================================
// 9. SOUND EFFECTS (SFX 6종)
// ============================================================
let sfxCtx = null;
function sfxV8(type){
  if(window.UISfx && UISfx.isMuted()) return;
  if(!sfxCtx) try{ sfxCtx = new (window.AudioContext || window.webkitAudioContext)(); }catch(e){ return; }
  if(sfxCtx.state === 'suspended') sfxCtx.resume();
  const t = sfxCtx.currentTime;
  function osc(freq, dur, vol, waveType, delay){
    try{
      const o = sfxCtx.createOscillator(), g = sfxCtx.createGain();
      o.type = waveType || 'sine'; o.frequency.value = freq;
      g.gain.setValueAtTime(vol || 0.1, t + (delay||0));
      g.gain.exponentialRampToValueAtTime(0.001, t + (delay||0) + dur);
      o.connect(g); g.connect(sfxCtx.destination);
      o.start(t + (delay||0)); o.stop(t + (delay||0) + dur);
    }catch(e){}
  }
  const map = {
    encyc: () => { osc(880,.08,.1,'triangle'); osc(1100,.08,.08,'triangle',.06); },
    share: () => { osc(523,.1,.1,'sine'); osc(784,.1,.08,'sine',.08); osc(1047,.12,.1,'sine',.16); },
    mem_flip: () => { osc(800,.04,.08,'sine'); },
    mem_match: () => { osc(659,.08,.1,'triangle'); osc(880,.1,.1,'triangle',.06); },
    mem_win: () => { [523,659,784,1047,1319].forEach((f,i) => osc(f,.12,.1,'triangle',i*.08)); },
    streak: () => { osc(440,.1,.08,'sine'); osc(660,.1,.08,'sine',.08); osc(880,.12,.1,'sine',.16); }
  };
  if(map[type]) map[type]();
}


// ============================================================
// 10. UI INJECTION (Quick Action Buttons + Keyboard + Toast)
// ============================================================
function showToastV8(msg){
  const t = document.getElementById('achieveToast');
  if(t){ t.textContent = msg; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 2500); }
}

function injectQuickActions(){
  const topBar = document.querySelector('.top-bar');
  if(!topBar) return;

  const btns = [
    {id:'encycBtn',label:'캐릭터 도감',icon:'📖',title:'도감 (E)',action:openEncyclopedia},
    {id:'stBtn',label:'사운드트랙',icon:'🎵',title:'사운드트랙 (M)',action:openSoundtrack},
    {id:'tipsBtn',label:'공략',icon:'📝',title:'공략 (G)',action:openTipsGuide},
    {id:'memBtn',label:'미니게임',icon:'🧠',title:'미니게임 (P)',action:openMemoryGame},
    {id:'shareBtn',label:'공유',icon:'📸',title:'공유 카드 (C)',action:() => { openShareCard(); checkAndAward('a_share_first'); }}
  ];

  btns.forEach(b => {
    const btn = document.createElement('button');
    btn.id = b.id;
    btn.className = 'top-btn';
    btn.setAttribute('aria-label', b.label);
    btn.setAttribute('title', b.title);
    btn.innerHTML = b.icon + ' <span style="font-size:11px">' + b.label + '</span>';
    btn.addEventListener('click', b.action);
    topBar.appendChild(btn);
  });
}

function injectKeyboardShortcuts(){
  document.addEventListener('keydown', e => {
    if(e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if(document.querySelector('.modal-overlay.show')) return;

    const key = e.key.toLowerCase();
    if(key === 'e' && !e.ctrlKey && !e.metaKey){ e.preventDefault(); openEncyclopedia(); }
    else if(key === 'm' && !e.ctrlKey && !e.metaKey){ e.preventDefault(); openSoundtrack(); }
    else if(key === 'g' && !e.ctrlKey && !e.metaKey){ e.preventDefault(); openTipsGuide(); }
    else if(key === 'p' && !e.ctrlKey && !e.metaKey){ e.preventDefault(); openMemoryGame(); }
    else if(key === 'c' && !e.ctrlKey && !e.metaKey){ e.preventDefault(); openShareCard(); checkAndAward('a_share_first'); }
  });
}

function updateStreakDisplay(){
  const streak = updateStreak();
  if(streak.days >= 2){
    sfxV8('streak');
    setTimeout(() => showToastV8('🔥 ' + streak.days + '일 연속 출석!'), 1500);
  }
  checkAndAward('a_seasonal');
}

function updateFooterV8(){
  const ver = document.querySelector('.footer .version');
  if(ver) ver.textContent = 'v8.0 | © PRIME Holdings NEXTERA+PRISM';

  const links = document.querySelector('.footer-links');
  if(links) links.innerHTML = '<span class="footer-link">4종 게임</span><span class="footer-link">34개 업적</span><span class="footer-link">오프라인 지원</span><span class="footer-link">12종 도감</span>';
}

function updateNewsV8(){
  const newsSection = document.querySelector('.news-section');
  if(!newsSection) return;
  const firstItem = newsSection.querySelector('.news-item');
  if(!firstItem) return;

  const newItem = document.createElement('div');
  newItem.className = 'news-item';
  newItem.innerHTML = '<span class="news-date">v8.0</span><span class="news-text">캐릭터 도감 12종, 사운드트랙 7곡, 공략가이드, 미니게임, 공유카드, 출석시스템, 계절이벤트</span>';
  firstItem.parentNode.insertBefore(newItem, firstItem);
}

function updateKeyboardHelpV8(){
  const kbHelp = document.querySelector('#kbHelp .modal');
  if(!kbHelp) return;
  const closeBtn = kbHelp.querySelector('.modal-close');

  const newRows = [
    ['캐릭터 도감','E'],
    ['사운드트랙','M'],
    ['공략 가이드','G'],
    ['미니게임','P'],
    ['공유 카드','C']
  ];

  newRows.forEach(([label, key]) => {
    const row = document.createElement('div');
    row.className = 'kb-help-row';
    row.innerHTML = '<span>' + label + '</span><span class="kb-help-key">' + key + '</span>';
    if(closeBtn && closeBtn.nextSibling){
      kbHelp.appendChild(row);
    } else {
      kbHelp.appendChild(row);
    }
  });
}

function updateAchieveCountV8(){
  const el = document.getElementById('achieveCount');
  if(el){
    const c = getAchieveCountV8();
    const t = (window.AD ? window.AD.length : 34);
    el.textContent = c + '/' + t;
  }
}


// ============================================================
// BOOT
// ============================================================
function bootV8(){
  injectNewAchievements();
  injectQuickActions();
  injectKeyboardShortcuts();
  injectSeasonalBanner();
  updateStreakDisplay();
  updateFooterV8();
  updateNewsV8();
  updateKeyboardHelpV8();
  updateAchieveCountV8();

  // Update achieve count display for new total
  const descMeta = document.querySelector('meta[name="description"]');
  if(descMeta) descMeta.content = '사랑의 하츄핑 v8.0 - 플랫포머 액션, 턴제 RPG, 오픈월드, UNIFIED 통합판 4종 게임. 업적 34개, 캐릭터 도감 12종, 사운드트랙, 미니게임!';

  // Tips guide opened achievement
  const tipsBtn = document.getElementById('tipsBtn');
  if(tipsBtn){
    const origClick = tipsBtn.onclick;
    tipsBtn.addEventListener('click', () => { checkAndAward('a_tips_reader'); }, {once:true});
  }
}

if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', bootV8);
} else {
  bootV8();
}

})();

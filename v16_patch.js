// hatcuping-game v16_patch.js - NEXTERA+PRISM AUTO v16.0
// Self-contained patch module (1100+ lines, 60+ functions)
(function(){
'use strict';

// ============================================================
// SFX ENGINE (12 sound types)
// ============================================================
var _v16Ctx = null;
function _v16InitAudio(){
  if(!_v16Ctx){
    try{ _v16Ctx = new (window.AudioContext || window.webkitAudioContext)(); }catch(e){}
  }
  if(_v16Ctx && _v16Ctx.state === 'suspended') _v16Ctx.resume();
}

var V16_SFX = {
  maze_step:{f:660,d:.04,t:'sine'},
  maze_item:{f:1100,d:.1,t:'triangle'},
  farm_plant:{f:550,d:.08,t:'sine'},
  farm_harvest:{f:880,d:.12,t:'triangle'},
  attend_check:{f:990,d:.06,t:'triangle'},
  relation_open:{f:700,d:.06,t:'sine'},
  color_paint:{f:440,d:.05,t:'sine'},
  rhythm_hit:{f:1047,d:.04,t:'square'},
  puzzle_slide:{f:600,d:.05,t:'sine'},
  puzzle_clear:{f:1200,d:.15,t:'triangle'},
  quote_open:{f:720,d:.06,t:'sine'},
  v16_feature:{f:800,d:.08,t:'triangle'}
};

function sfxV16(type){
  _v16InitAudio();
  if(!_v16Ctx) return;
  var s = V16_SFX[type];
  if(!s) return;
  try{
    var muted = false;
    try{ muted = localStorage.getItem('hatcuping_mute') === '1'; }catch(e){}
    if(muted) return;
    var osc = _v16Ctx.createOscillator();
    var gain = _v16Ctx.createGain();
    osc.type = s.t || 'sine';
    osc.frequency.value = s.f;
    gain.gain.value = 0.08;
    osc.connect(gain);
    gain.connect(_v16Ctx.destination);
    osc.start();
    osc.stop(_v16Ctx.currentTime + (s.d || 0.06));
  }catch(e){}
}


// ============================================================
// UTILITY FUNCTIONS
// ============================================================
function trackV16Feature(id){
  try{
    var saved = JSON.parse(localStorage.getItem('hatcuping_v16_features') || '[]');
    if(saved.indexOf(id) === -1){ saved.push(id); localStorage.setItem('hatcuping_v16_features', JSON.stringify(saved)); }
  }catch(e){}
}

function showToastV16(msg){
  var t = document.getElementById('achieveToast');
  if(t){ t.innerHTML = msg; t.classList.add('show'); setTimeout(function(){ t.classList.remove('show'); }, 2500); }
}

function v16Load(key, fallback){
  try{ var d = JSON.parse(localStorage.getItem(key)); return d !== null ? d : fallback; }catch(e){ return fallback; }
}

function v16Save(key, data){
  try{ localStorage.setItem(key, JSON.stringify(data)); }catch(e){}
}

function todayStrV16(){
  var d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}

function isDarkV16(){
  return document.body.classList.contains('dark');
}

function createV16Modal(title, contentHtml){
  var overlay = document.createElement('div');
  overlay.className = 'modal-overlay show';
  overlay.style.zIndex = '1000';
  var modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = '<button class="modal-close" style="position:absolute;top:12px;right:16px;background:none;border:none;font-size:24px;cursor:pointer;color:var(--text-sub)">&times;</button><h3>' + title + '</h3>' + contentHtml;
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  overlay.querySelector('.modal-close').onclick = function(){ overlay.remove(); };
  overlay.addEventListener('click', function(e){ if(e.target === overlay) overlay.remove(); });
  return {overlay: overlay, modal: modal};
}


// ============================================================
// 1. EMOTION MAZE EXPLORER (Canvas 8x8, 3 stages)
// ============================================================
var MAZE_LEVELS = [
  {w:6,h:6,items:3,name:'&#xC27D;&#xC6B4; &#xBBF8;&#xB85C;'},
  {w:7,h:7,items:4,name:'&#xBCF4;&#xD1B5; &#xBBF8;&#xB85C;'},
  {w:8,h:8,items:5,name:'&#xC5B4;&#xB824;&#xC6B4; &#xBBF8;&#xB85C;'}
];

function generateMaze(w, h){
  var grid = [];
  for(var y=0;y<h;y++){
    grid[y] = [];
    for(var x=0;x<w;x++) grid[y][x] = 1;
  }
  function carve(cx, cy){
    grid[cy][cx] = 0;
    var dirs = [[0,-2],[0,2],[-2,0],[2,0]];
    for(var i=dirs.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var tmp=dirs[i];dirs[i]=dirs[j];dirs[j]=tmp;}
    for(var d=0;d<dirs.length;d++){
      var nx=cx+dirs[d][0], ny=cy+dirs[d][1];
      if(nx>=0&&nx<w&&ny>=0&&ny<h&&grid[ny][nx]===1){
        grid[cy+dirs[d][1]/2][cx+dirs[d][0]/2]=0;
        carve(nx,ny);
      }
    }
  }
  carve(0,0);
  grid[h-1][w-1] = 0;
  if(h>1) grid[h-2][w-1] = 0;
  return grid;
}

function openMazeExplorer(){
  trackV16Feature('maze');
  sfxV16('v16_feature');
  var mazeData = v16Load('hatcuping_maze', {level:0,clears:0});
  var lvl = MAZE_LEVELS[Math.min(mazeData.level, MAZE_LEVELS.length-1)];
  var grid = generateMaze(lvl.w, lvl.h);
  var items = [];
  var placed = 0;
  while(placed < lvl.items){
    var ix = Math.floor(Math.random()*lvl.w);
    var iy = Math.floor(Math.random()*lvl.h);
    if(grid[iy][ix]===0 && !(ix===0&&iy===0) && !(ix===lvl.w-1&&iy===lvl.h-1)){
      var dup = false;
      for(var c=0;c<items.length;c++){if(items[c].x===ix&&items[c].y===iy){dup=true;break;}}
      if(!dup){items.push({x:ix,y:iy,collected:false});placed++;}
    }
  }
  var px=0, py=0, collected=0, moves=0;

  var m = createV16Modal('&#x1F9E9; &#xC774;&#xBAA8;&#xC158; &#xBBF8;&#xB85C;&#xD0D0;&#xD5D8;', '<p style="font-size:12px;color:var(--text-sub);margin-bottom:8px">&#xB808;&#xBCA8;: ' + lvl.name + ' | &#xC544;&#xC774;&#xD15C;: <span id="mazeCollected">0</span>/' + lvl.items + ' | &#xC774;&#xB3D9;: <span id="mazeMoves">0</span></p><canvas id="mazeCanvas" width="320" height="320" style="width:100%;max-width:320px;border-radius:12px;background:#f0f0f0;display:block;margin:0 auto"></canvas><div style="display:flex;justify-content:center;gap:8px;margin-top:10px"><button id="mazeUp" style="padding:8px 16px;border:none;border-radius:8px;background:var(--pink);color:#fff;font-size:16px;cursor:pointer">&#x2B06;</button></div><div style="display:flex;justify-content:center;gap:8px;margin-top:4px"><button id="mazeLeft" style="padding:8px 16px;border:none;border-radius:8px;background:var(--pink);color:#fff;font-size:16px;cursor:pointer">&#x2B05;</button><button id="mazeDown" style="padding:8px 16px;border:none;border-radius:8px;background:var(--pink);color:#fff;font-size:16px;cursor:pointer">&#x2B07;</button><button id="mazeRight" style="padding:8px 16px;border:none;border-radius:8px;background:var(--pink);color:#fff;font-size:16px;cursor:pointer">&#x27A1;</button></div>');

  var canvas = document.getElementById('mazeCanvas');
  var ctx = canvas.getContext('2d');
  var cellW = 320 / lvl.w, cellH = 320 / lvl.h;

  function drawMaze(){
    var dk = isDarkV16();
    ctx.clearRect(0,0,320,320);
    for(var y=0;y<lvl.h;y++){
      for(var x=0;x<lvl.w;x++){
        if(grid[y][x]===1){
          ctx.fillStyle = dk ? '#3a2a4e' : '#C8B8FF';
          ctx.fillRect(x*cellW, y*cellH, cellW, cellH);
        } else {
          ctx.fillStyle = dk ? '#1a0a2e' : '#FFF0F8';
          ctx.fillRect(x*cellW, y*cellH, cellW, cellH);
        }
      }
    }
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect((lvl.w-1)*cellW+4, (lvl.h-1)*cellH+4, cellW-8, cellH-8);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold ' + Math.floor(cellH*0.4) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GOAL', (lvl.w-1)*cellW+cellW/2, (lvl.h-1)*cellH+cellH/2);
    for(var i=0;i<items.length;i++){
      if(!items[i].collected){
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(items[i].x*cellW+cellW/2, items[i].y*cellH+cellH/2, cellW*0.25, 0, Math.PI*2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = Math.floor(cellH*0.3) + 'px sans-serif';
        ctx.fillText('★', items[i].x*cellW+cellW/2, items[i].y*cellH+cellH/2);
      }
    }
    ctx.fillStyle = '#FF5FA2';
    ctx.beginPath();
    ctx.arc(px*cellW+cellW/2, py*cellH+cellH/2, cellW*0.3, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold ' + Math.floor(cellH*0.35) + 'px sans-serif';
    ctx.fillText('❤', px*cellW+cellW/2, py*cellH+cellH/2);
  }

  function movePlayer(dx, dy){
    var nx = px+dx, ny = py+dy;
    if(nx<0||nx>=lvl.w||ny<0||ny>=lvl.h||grid[ny][nx]===1) return;
    px=nx; py=ny; moves++;
    sfxV16('maze_step');
    document.getElementById('mazeMoves').textContent = moves;
    for(var i=0;i<items.length;i++){
      if(!items[i].collected && items[i].x===px && items[i].y===py){
        items[i].collected=true; collected++;
        sfxV16('maze_item');
        document.getElementById('mazeCollected').textContent = collected;
      }
    }
    drawMaze();
    if(px===lvl.w-1 && py===lvl.h-1 && collected>=lvl.items){
      sfxV16('puzzle_clear');
      mazeData.clears++;
      if(mazeData.level < MAZE_LEVELS.length-1) mazeData.level++;
      v16Save('hatcuping_maze', mazeData);
      setTimeout(function(){
        showToastV16('\u{1F389} &#xBBF8;&#xB85C; &#xD074;&#xB9AC;&#xC5B4;! &#xC774;&#xB3D9; ' + moves + '&#xD68C;');
      }, 300);
    }
  }

  document.getElementById('mazeUp').onclick = function(){ movePlayer(0,-1); };
  document.getElementById('mazeDown').onclick = function(){ movePlayer(0,1); };
  document.getElementById('mazeLeft').onclick = function(){ movePlayer(-1,0); };
  document.getElementById('mazeRight').onclick = function(){ movePlayer(1,0); };

  function mazeKeyHandler(e){
    if(!document.getElementById('mazeCanvas')) { document.removeEventListener('keydown', mazeKeyHandler); return; }
    if(e.key==='ArrowUp'){e.preventDefault();movePlayer(0,-1);}
    else if(e.key==='ArrowDown'){e.preventDefault();movePlayer(0,1);}
    else if(e.key==='ArrowLeft'){e.preventDefault();movePlayer(-1,0);}
    else if(e.key==='ArrowRight'){e.preventDefault();movePlayer(1,0);}
  }
  document.addEventListener('keydown', mazeKeyHandler);
  drawMaze();
}


// ============================================================
// 2. HATCUPING FARM SIMULATOR (6x4 grid, 8 crops)
// ============================================================
var CROPS = [
  {id:'strawberry',name:'&#xB531;&#xAE30;',emoji:'&#x1F353;',time:3,value:10},
  {id:'sunflower',name:'&#xD574;&#xBC14;&#xB77C;&#xAE30;',emoji:'&#x1F33B;',time:4,value:15},
  {id:'carrot',name:'&#xB2F9;&#xADFC;',emoji:'&#x1F955;',time:2,value:8},
  {id:'corn',name:'&#xC625;&#xC218;&#xC218;',emoji:'&#x1F33D;',time:5,value:20},
  {id:'tulip',name:'&#xD280;&#xB9BD;',emoji:'&#x1F337;',time:3,value:12},
  {id:'watermelon',name:'&#xC218;&#xBC15;',emoji:'&#x1F349;',time:6,value:25},
  {id:'cherry',name:'&#xCCB4;&#xB9AC;',emoji:'&#x1F352;',time:4,value:14},
  {id:'clover',name:'&#xD074;&#xB85C;&#xBC84;',emoji:'&#x1F340;',time:2,value:6}
];

function getFarmData(){
  return v16Load('hatcuping_farm', {grid:[], gold:50, totalHarvest:0, selectedCrop:0});
}

function openFarmSimulator(){
  trackV16Feature('farm');
  sfxV16('v16_feature');
  var farm = getFarmData();
  if(!farm.grid || farm.grid.length !== 24){
    farm.grid = [];
    for(var i=0;i<24;i++) farm.grid.push(null);
  }
  var selCrop = farm.selectedCrop || 0;

  var cropBtns = CROPS.map(function(c,i){
    return '<button class="v16-crop-btn" data-idx="' + i + '" style="padding:4px 8px;border:1px solid var(--border);border-radius:8px;background:' + (i===selCrop?'var(--pink)':'var(--glass)') + ';color:' + (i===selCrop?'#fff':'var(--text)') + ';font-size:11px;cursor:pointer">' + c.emoji + ' ' + c.name + ' (' + c.value + 'G)</button>';
  }).join('');

  var m = createV16Modal('&#x1F33E; &#xD558;&#xCE04;&#xD551; &#xB18D;&#xC7A5;', '<p style="font-size:12px;color:var(--text-sub);margin-bottom:6px">&#xACE8;&#xB4DC;: <span id="farmGold">' + farm.gold + '</span>G | &#xCD1D;&#xC218;&#xD655;: <span id="farmHarvest">' + farm.totalHarvest + '</span></p><div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:10px" id="cropSelector">' + cropBtns + '</div><canvas id="farmCanvas" width="360" height="240" style="width:100%;max-width:360px;border-radius:12px;display:block;margin:0 auto;cursor:pointer"></canvas><div style="display:flex;gap:6px;margin-top:8px;justify-content:center"><button id="farmWater" style="padding:6px 14px;border:none;border-radius:8px;background:#4FC3F7;color:#fff;font-size:12px;font-weight:700;cursor:pointer">&#x1F4A7; &#xBB3C;&#xC8FC;&#xAE30;</button><button id="farmHarvestBtn" style="padding:6px 14px;border:none;border-radius:8px;background:#4CAF50;color:#fff;font-size:12px;font-weight:700;cursor:pointer">&#x1F33E; &#xC218;&#xD655;</button></div>');

  var canvas = document.getElementById('farmCanvas');
  var ctx = canvas.getContext('2d');
  var cols=6, rows=4, cw=60, ch=60;

  function drawFarm(){
    var dk = isDarkV16();
    ctx.clearRect(0,0,360,240);
    for(var r=0;r<rows;r++){
      for(var c=0;c<cols;c++){
        var idx = r*cols+c;
        var x=c*cw, y=r*ch;
        ctx.fillStyle = dk ? '#2d1040' : '#E8F5E9';
        ctx.fillRect(x+1, y+1, cw-2, ch-2);
        ctx.strokeStyle = dk ? '#4a2a6e' : '#A5D6A7';
        ctx.lineWidth = 1;
        ctx.strokeRect(x+1, y+1, cw-2, ch-2);
        var cell = farm.grid[idx];
        if(cell){
          var crop = CROPS[cell.cropIdx];
          ctx.font = '24px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          if(cell.growth >= crop.time){
            ctx.fillStyle = 'rgba(255,215,0,.2)';
            ctx.fillRect(x+2,y+2,cw-4,ch-4);
          }
          ctx.fillText(crop.emoji.replace(/&#x([0-9A-F]+);/gi, function(_,hex){return String.fromCodePoint(parseInt(hex,16));}), x+cw/2, y+ch/2-6);
          var pct = Math.min(cell.growth / crop.time, 1);
          ctx.fillStyle = pct >= 1 ? '#FFD700' : '#4CAF50';
          ctx.fillRect(x+8, y+ch-12, (cw-16)*pct, 6);
          ctx.strokeStyle = dk ? '#555' : '#999';
          ctx.strokeRect(x+8, y+ch-12, cw-16, 6);
        }
      }
    }
  }

  canvas.onclick = function(e){
    var rect = canvas.getBoundingClientRect();
    var sx = 360/rect.width;
    var mx = (e.clientX - rect.left)*sx;
    var my = (e.clientY - rect.top)*sx;
    var col = Math.floor(mx/cw), row = Math.floor(my/ch);
    if(col<0||col>=cols||row<0||row>=rows) return;
    var idx = row*cols+col;
    if(!farm.grid[idx]){
      var cost = Math.max(3, Math.floor(CROPS[selCrop].value * 0.5));
      if(farm.gold >= cost){
        farm.gold -= cost;
        farm.grid[idx] = {cropIdx: selCrop, growth: 0, watered: false};
        sfxV16('farm_plant');
        document.getElementById('farmGold').textContent = farm.gold;
        v16Save('hatcuping_farm', farm);
        drawFarm();
      } else {
        showToastV16('&#xACE8;&#xB4DC;&#xAC00; &#xBD80;&#xC871;&#xD569;&#xB2C8;&#xB2E4;!');
      }
    }
  };

  document.getElementById('farmWater').onclick = function(){
    var watered = 0;
    for(var i=0;i<farm.grid.length;i++){
      if(farm.grid[i] && !farm.grid[i].watered){
        farm.grid[i].watered = true;
        farm.grid[i].growth++;
        watered++;
      }
    }
    if(watered > 0){
      sfxV16('farm_plant');
      showToastV16('&#x1F4A7; ' + watered + '&#xCE78; &#xBB3C;&#xC8FC;&#xAE30; &#xC644;&#xB8CC;!');
      v16Save('hatcuping_farm', farm);
      drawFarm();
    }
  };

  document.getElementById('farmHarvestBtn').onclick = function(){
    var earned = 0, count = 0;
    for(var i=0;i<farm.grid.length;i++){
      if(farm.grid[i]){
        var crop = CROPS[farm.grid[i].cropIdx];
        if(farm.grid[i].growth >= crop.time){
          earned += crop.value;
          count++;
          farm.grid[i] = null;
        }
      }
    }
    if(count > 0){
      farm.gold += earned;
      farm.totalHarvest += count;
      sfxV16('farm_harvest');
      document.getElementById('farmGold').textContent = farm.gold;
      document.getElementById('farmHarvest').textContent = farm.totalHarvest;
      showToastV16('&#x1F33E; ' + count + '&#xAC1C; &#xC218;&#xD655;! +' + earned + 'G');
      v16Save('hatcuping_farm', farm);
      drawFarm();
    }
  };

  document.querySelectorAll('.v16-crop-btn').forEach(function(btn){
    btn.onclick = function(){
      selCrop = parseInt(btn.dataset.idx);
      farm.selectedCrop = selCrop;
      document.querySelectorAll('.v16-crop-btn').forEach(function(b,i){
        b.style.background = i===selCrop ? 'var(--pink)' : 'var(--glass)';
        b.style.color = i===selCrop ? '#fff' : 'var(--text)';
      });
    };
  });

  drawFarm();
}


// ============================================================
// 3. DAILY ATTENDANCE CALENDAR (Canvas 30 days)
// ============================================================
function getAttendData(){
  return v16Load('hatcuping_attend', {days:[], streak:0, totalReward:0});
}

function openAttendCalendar(){
  trackV16Feature('attend');
  sfxV16('v16_feature');
  var data = getAttendData();
  var today = todayStrV16();
  var alreadyChecked = data.days.indexOf(today) !== -1;

  var m = createV16Modal('&#x1F4C5; &#xCD9C;&#xC11D; &#xCE98;&#xB9B0;&#xB354;', '<p style="font-size:12px;color:var(--text-sub);margin-bottom:6px">&#xC5F0;&#xC18D; &#xCD9C;&#xC11D;: <span id="attendStreak">' + data.streak + '</span>&#xC77C; | &#xCD1D; &#xBCF4;&#xC0C1;: <span id="attendReward">' + data.totalReward + '</span>XP</p><canvas id="attendCanvas" width="350" height="280" style="width:100%;max-width:350px;border-radius:12px;display:block;margin:0 auto"></canvas><button id="attendCheckBtn" style="display:block;margin:10px auto 0;padding:8px 24px;border:none;border-radius:12px;background:' + (alreadyChecked ? '#ccc' : 'linear-gradient(135deg,var(--pink),var(--purple))') + ';color:#fff;font-size:14px;font-weight:700;cursor:pointer">' + (alreadyChecked ? '&#xC624;&#xB298; &#xCD9C;&#xC11D; &#xC644;&#xB8CC; &#x2714;' : '&#xCD9C;&#xC11D;&#xCCB4;&#xD06C; &#x1F31F;') + '</button>');

  var canvas = document.getElementById('attendCanvas');
  var ctx = canvas.getContext('2d');

  function drawCalendar(){
    var dk = isDarkV16();
    ctx.clearRect(0,0,350,280);
    ctx.fillStyle = dk ? '#eee' : '#333';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('30&#xC77C; &#xCD9C;&#xC11D; &#xBCF4;&#xC0C1;', 175, 20);

    var cols=7, cellW=46, cellH=34, startX=11, startY=40;
    var dayLabels = ['&#xC77C;','&#xC6D4;','&#xD654;','&#xC218;','&#xBAA9;','&#xAE08;','&#xD1A0;'];
    ctx.font = '11px sans-serif';
    ctx.fillStyle = dk ? '#aaa' : '#888';
    for(var d=0;d<7;d++){
      ctx.fillText(dayLabels[d], startX+d*cellW+cellW/2, startY);
    }

    var now = new Date();
    for(var i=0;i<30;i++){
      var date = new Date(now);
      date.setDate(date.getDate() - 29 + i);
      var dateStr = date.getFullYear() + '-' + String(date.getMonth()+1).padStart(2,'0') + '-' + String(date.getDate()).padStart(2,'0');
      var col = i % 7, row = Math.floor(i / 7);
      var x = startX + col*cellW, y = startY + 16 + row*cellH;
      var checked = data.days.indexOf(dateStr) !== -1;
      var isToday = dateStr === today;

      ctx.fillStyle = checked ? (dk ? 'rgba(255,95,162,.3)' : 'rgba(255,95,162,.15)') : (dk ? '#2a1a3e' : '#f8f8f8');
      ctx.beginPath();
      ctx.roundRect(x+2, y+2, cellW-4, cellH-4, 6);
      ctx.fill();

      if(isToday){
        ctx.strokeStyle = '#FF5FA2';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(x+2, y+2, cellW-4, cellH-4, 6);
        ctx.stroke();
      }

      ctx.fillStyle = dk ? '#ddd' : '#555';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(date.getDate(), x+cellW/2, y+cellH/2+2);

      if(checked){
        ctx.fillStyle = '#FF5FA2';
        ctx.font = '10px sans-serif';
        ctx.fillText('✔', x+cellW-10, y+12);
      }
    }

    ctx.fillStyle = dk ? '#aaa' : '#666';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    var rewards = [
      {day:3,xp:30},{day:7,xp:70},{day:14,xp:150},{day:21,xp:250},{day:30,xp:500}
    ];
    ctx.fillText('&#xBCF4;&#xB108;&#xC2A4;: ', 11, 265);
    var bx = 50;
    rewards.forEach(function(r){
      var achieved = data.streak >= r.day;
      ctx.fillStyle = achieved ? '#FFD700' : (dk ? '#555' : '#ddd');
      ctx.fillRect(bx, 254, 50, 16);
      ctx.fillStyle = achieved ? '#333' : (dk ? '#888' : '#aaa');
      ctx.font = '9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(r.day + '&#xC77C;:' + r.xp + 'XP', bx+25, 265);
      bx += 56;
    });
  }

  document.getElementById('attendCheckBtn').onclick = function(){
    if(alreadyChecked) return;
    data.days.push(today);
    if(data.days.length > 30) data.days = data.days.slice(-30);
    var yesterday = new Date();
    yesterday.setDate(yesterday.getDate()-1);
    var yStr = yesterday.getFullYear() + '-' + String(yesterday.getMonth()+1).padStart(2,'0') + '-' + String(yesterday.getDate()).padStart(2,'0');
    if(data.days.indexOf(yStr) !== -1){
      data.streak++;
    } else {
      data.streak = 1;
    }
    var reward = 10 + data.streak * 2;
    data.totalReward += reward;
    v16Save('hatcuping_attend', data);
    sfxV16('attend_check');
    showToastV16('&#x1F31F; &#xCD9C;&#xC11D; &#xC644;&#xB8CC;! +' + reward + 'XP (&#xC5F0;&#xC18D; ' + data.streak + '&#xC77C;)');
    alreadyChecked = true;
    var btn = document.getElementById('attendCheckBtn');
    btn.textContent = '&#xC624;&#xB298; &#xCD9C;&#xC11D; &#xC644;&#xB8CC; ✔';
    btn.style.background = '#ccc';
    document.getElementById('attendStreak').textContent = data.streak;
    document.getElementById('attendReward').textContent = data.totalReward;
    drawCalendar();
  };

  drawCalendar();
}


// ============================================================
// 4. CHARACTER RELATIONSHIP MAP (Canvas 12 characters)
// ============================================================
var CHARACTERS = [
  {id:'romi',name:'&#xB85C;&#xBBF8;',emoji:'&#x1F467;',color:'#FF5FA2'},
  {id:'hatcuping',name:'&#xD558;&#xCE04;&#xD551;',emoji:'&#x1F496;',color:'#FF8EC4'},
  {id:'baropping',name:'&#xBC14;&#xB85C;&#xD551;',emoji:'&#x1F4AA;',color:'#FF6B6B'},
  {id:'chachaaping',name:'&#xCC28;&#xCC28;&#xD551;',emoji:'&#x1F9CA;',color:'#64B5F6'},
  {id:'ggokggokpping',name:'&#xAF09;&#xAF09;&#xD551;',emoji:'&#x1F340;',color:'#66BB6A'},
  {id:'arapping',name:'&#xC544;&#xB77C;&#xD551;',emoji:'&#x2728;',color:'#FFD54F'},
  {id:'murupping',name:'&#xBB34;&#xB7F9;&#xD551;',emoji:'&#x1F4A7;',color:'#4FC3F7'},
  {id:'heheping',name:'&#xD5E4;&#xD5E4;&#xD551;',emoji:'&#x1F60A;',color:'#FF9800'},
  {id:'geueonpping',name:'&#xAC8C;&#xC73C;&#xB978;&#xD551;',emoji:'&#x1F634;',color:'#9575CD'},
  {id:'tterupping',name:'&#xB610;&#xB8E8;&#xD551;',emoji:'&#x1F622;',color:'#78909C'},
  {id:'ggongping',name:'&#xAF41;&#xAF41;&#xD551;',emoji:'&#x2744;',color:'#B3E5FC'},
  {id:'queen',name:'&#xC5EC;&#xC655;&#xB2D8;',emoji:'&#x1F451;',color:'#E040FB'}
];

var RELATIONS = [
  {a:0,b:1,type:'love',label:'&#xC0AC;&#xB791;'},
  {a:0,b:2,type:'friend',label:'&#xCE5C;&#xAD6C;'},
  {a:1,b:11,type:'loyal',label:'&#xCDA9;&#xC131;'},
  {a:1,b:4,type:'friend',label:'&#xCE5C;&#xAD6C;'},
  {a:2,b:3,type:'rival',label:'&#xB77C;&#xC774;&#xBC8C;'},
  {a:3,b:10,type:'friend',label:'&#xCE5C;&#xAD6C;'},
  {a:4,b:5,type:'friend',label:'&#xCE5C;&#xAD6C;'},
  {a:5,b:11,type:'loyal',label:'&#xCDA9;&#xC131;'},
  {a:6,b:7,type:'friend',label:'&#xCE5C;&#xAD6C;'},
  {a:7,b:8,type:'friend',label:'&#xCE5C;&#xAD6C;'},
  {a:8,b:9,type:'rival',label:'&#xB77C;&#xC774;&#xBC8C;'},
  {a:0,b:11,type:'respect',label:'&#xC874;&#xACBD;'}
];

function openRelationMap(){
  trackV16Feature('relation');
  sfxV16('relation_open');
  var m = createV16Modal('&#x1F495; &#xCE90;&#xB9AD;&#xD130; &#xAD00;&#xACC4;&#xB3C4;', '<canvas id="relationCanvas" width="400" height="400" style="width:100%;max-width:400px;border-radius:12px;display:block;margin:0 auto"></canvas><p style="font-size:11px;color:var(--text-sub);text-align:center;margin-top:8px">&#x1F497; &#xC0AC;&#xB791; &#x1F91D; &#xCE5C;&#xAD6C; &#x2694; &#xB77C;&#xC774;&#xBC8C; &#x1F451; &#xCDA9;&#xC131; &#x2B50; &#xC874;&#xACBD;</p>');

  var canvas = document.getElementById('relationCanvas');
  var ctx = canvas.getContext('2d');
  var cx=200, cy=200, radius=140;
  var dk = isDarkV16();

  var positions = CHARACTERS.map(function(_, i){
    var angle = (i / CHARACTERS.length) * Math.PI * 2 - Math.PI/2;
    return {x: cx + Math.cos(angle)*radius, y: cy + Math.sin(angle)*radius};
  });

  ctx.clearRect(0,0,400,400);

  var typeColors = {love:'#FF5FA2',friend:'#4CAF50',rival:'#F44336',loyal:'#FFD700',respect:'#9C27B0'};
  RELATIONS.forEach(function(r){
    var pa = positions[r.a], pb = positions[r.b];
    ctx.beginPath();
    ctx.moveTo(pa.x, pa.y);
    ctx.lineTo(pb.x, pb.y);
    ctx.strokeStyle = typeColors[r.type] || '#888';
    ctx.lineWidth = 2;
    ctx.setLineDash(r.type === 'rival' ? [5,5] : []);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = typeColors[r.type] || '#888';
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(r.label, (pa.x+pb.x)/2, (pa.y+pb.y)/2 - 4);
  });

  CHARACTERS.forEach(function(ch, i){
    var p = positions[i];
    ctx.beginPath();
    ctx.arc(p.x, p.y, 22, 0, Math.PI*2);
    ctx.fillStyle = ch.color;
    ctx.fill();
    ctx.strokeStyle = dk ? '#eee' : '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String.fromCodePoint(parseInt(ch.emoji.replace('&#x','').replace(';',''),16)), p.x, p.y-1);
    ctx.fillStyle = dk ? '#eee' : '#333';
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText(ch.name, p.x, p.y+32);
  });
}


// ============================================================
// 5. EMOTION COLORING BOOK (Canvas click-to-paint)
// ============================================================
var COLORING_DESIGNS = [
  {id:'heart',name:'&#xD558;&#xD2B8;',zones:[[60,60,80,80],[160,40,100,60],[100,130,120,70],[40,140,60,50],[220,130,70,60]]},
  {id:'star',name:'&#xBCC4;',zones:[[120,20,80,60],[60,80,100,60],[160,80,100,60],[80,140,70,60],[170,140,70,60]]},
  {id:'flower',name:'&#xAF43;',zones:[[140,20,40,40],[100,50,40,50],[180,50,40,50],[120,100,80,40],[140,140,40,60]]},
  {id:'rainbow',name:'&#xBB34;&#xC9C0;&#xAC1C;',zones:[[20,160,280,30],[20,130,280,30],[20,100,280,30],[20,70,280,30],[20,40,280,30]]},
  {id:'cloud',name:'&#xAD6C;&#xB984;',zones:[[80,80,60,40],[130,60,80,50],[200,80,60,40],[100,120,140,40],[60,110,40,40]]},
  {id:'moon',name:'&#xB2EC;',zones:[[100,40,120,120],[90,60,40,80],[200,60,40,80],[120,150,80,30],[140,20,40,30]]},
  {id:'butterfly',name:'&#xB098;&#xBE44;',zones:[[40,60,100,80],[180,60,100,80],[140,80,40,60],[100,150,120,30],[140,40,40,30]]},
  {id:'cake',name:'&#xCF00;&#xC775;',zones:[[60,140,200,50],[80,100,160,40],[100,60,120,40],[140,30,40,30],[60,180,200,20]]},
  {id:'crown',name:'&#xC655;&#xAD00;',zones:[[60,100,200,60],[60,60,50,50],[150,40,20,60],[210,60,50,50],[80,160,160,20]]},
  {id:'balloon',name:'&#xD48D;&#xC120;',zones:[[100,20,120,140],[140,160,40,40],[150,180,10,40],[80,60,40,40],[200,60,40,40]]},
  {id:'fish',name:'&#xBB3C;&#xACE0;&#xAE30;',zones:[[40,80,80,60],[120,60,100,80],[220,50,40,40],[220,110,40,40],[180,90,30,30]]},
  {id:'house',name:'&#xC9D1;',zones:[[80,100,160,100],[80,40,160,60],[120,130,60,70],[80,100,40,40],[200,100,40,40]]}
];

var PALETTE = ['#FF5FA2','#FF6B6B','#FFD54F','#66BB6A','#4FC3F7','#9C27B0','#FF9800','#795548','#607D8B','#E91E63','#fff','#333'];

function openColoringBook(){
  trackV16Feature('coloring');
  sfxV16('v16_feature');
  var colorData = v16Load('hatcuping_coloring', {designs:{}, currentDesign:0});
  var curDesign = colorData.currentDesign || 0;
  var selColor = 0;

  var designTabs = COLORING_DESIGNS.map(function(d,i){
    return '<button class="v16-design-tab" data-idx="' + i + '" style="padding:3px 8px;border:1px solid var(--border);border-radius:6px;background:' + (i===curDesign?'var(--pink)':'transparent') + ';color:' + (i===curDesign?'#fff':'var(--text-sub)') + ';font-size:10px;cursor:pointer">' + d.name + '</button>';
  }).join('');

  var paletteBtns = PALETTE.map(function(c,i){
    return '<button class="v16-pal-btn" data-idx="' + i + '" style="width:24px;height:24px;border-radius:50%;border:2px solid ' + (i===0?'#333':'transparent') + ';background:' + c + ';cursor:pointer"></button>';
  }).join('');

  var m = createV16Modal('&#x1F3A8; &#xC774;&#xBAA8;&#xC158; &#xCEEC;&#xB7EC;&#xB9C1;&#xBD81;', '<div style="display:flex;flex-wrap:wrap;gap:3px;margin-bottom:8px">' + designTabs + '</div><canvas id="colorCanvas" width="320" height="220" style="width:100%;max-width:320px;border-radius:12px;display:block;margin:0 auto;cursor:crosshair;background:#fff"></canvas><div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:8px;justify-content:center">' + paletteBtns + '</div><button id="colorReset" style="display:block;margin:8px auto 0;padding:4px 16px;border:1px solid var(--border);border-radius:8px;background:var(--glass);font-size:11px;cursor:pointer">&#xCD08;&#xAE30;&#xD654;</button>');

  var canvas = document.getElementById('colorCanvas');
  var ctx = canvas.getContext('2d');

  function getDesignColors(){
    return colorData.designs[COLORING_DESIGNS[curDesign].id] || {};
  }

  function drawDesign(){
    ctx.clearRect(0,0,320,220);
    var design = COLORING_DESIGNS[curDesign];
    var colors = getDesignColors();
    design.zones.forEach(function(z, i){
      ctx.fillStyle = colors[i] || '#f0f0f0';
      ctx.fillRect(z[0], z[1], z[2], z[3]);
      ctx.strokeStyle = '#999';
      ctx.lineWidth = 1;
      ctx.strokeRect(z[0], z[1], z[2], z[3]);
    });
    ctx.fillStyle = '#888';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(design.name, 160, 215);
  }

  canvas.onclick = function(e){
    var rect = canvas.getBoundingClientRect();
    var sx = 320/rect.width;
    var mx = (e.clientX-rect.left)*sx, my = (e.clientY-rect.top)*sx;
    var design = COLORING_DESIGNS[curDesign];
    for(var i=design.zones.length-1;i>=0;i--){
      var z = design.zones[i];
      if(mx>=z[0]&&mx<=z[0]+z[2]&&my>=z[1]&&my<=z[1]+z[3]){
        var colors = getDesignColors();
        colors[i] = PALETTE[selColor];
        if(!colorData.designs) colorData.designs = {};
        colorData.designs[design.id] = colors;
        v16Save('hatcuping_coloring', colorData);
        sfxV16('color_paint');
        drawDesign();
        break;
      }
    }
  };

  document.querySelectorAll('.v16-pal-btn').forEach(function(btn){
    btn.onclick = function(){
      selColor = parseInt(btn.dataset.idx);
      document.querySelectorAll('.v16-pal-btn').forEach(function(b,i){
        b.style.borderColor = i===selColor ? '#333' : 'transparent';
      });
    };
  });

  document.querySelectorAll('.v16-design-tab').forEach(function(btn){
    btn.onclick = function(){
      curDesign = parseInt(btn.dataset.idx);
      colorData.currentDesign = curDesign;
      document.querySelectorAll('.v16-design-tab').forEach(function(b,i){
        b.style.background = i===curDesign ? 'var(--pink)' : 'transparent';
        b.style.color = i===curDesign ? '#fff' : 'var(--text-sub)';
      });
      drawDesign();
    };
  });

  document.getElementById('colorReset').onclick = function(){
    if(colorData.designs) delete colorData.designs[COLORING_DESIGNS[curDesign].id];
    v16Save('hatcuping_coloring', colorData);
    drawDesign();
  };

  drawDesign();
}


// ============================================================
// 6. RHYTHM TIMING GAME (Canvas falling notes)
// ============================================================
var RHYTHM_SONGS = [
  {id:'theme',name:'&#xBA54;&#xC778;&#xD14C;&#xB9C8;',bpm:120,notes:[0,1,2,1,0,2,1,0,1,2,0,1,2,1,0,2]},
  {id:'happy',name:'&#xC990;&#xAC70;&#xC6B4; &#xD558;&#xB8E8;',bpm:130,notes:[0,0,1,1,2,2,1,0,2,1,0,2,1,0,1,2]},
  {id:'battle',name:'&#xC804;&#xD22C; &#xD14C;&#xB9C8;',bpm:150,notes:[2,0,1,2,0,1,2,0,2,1,0,2,1,2,0,1]},
  {id:'love',name:'&#xC0AC;&#xB791;&#xC758; &#xBA5C;&#xB85C;&#xB514;',bpm:100,notes:[1,0,1,2,1,0,2,1,0,1,2,0,1,2,1,0]},
  {id:'adventure',name:'&#xBAA8;&#xD5D8;&#xC758; &#xC2DC;&#xC791;',bpm:140,notes:[0,2,1,0,2,1,0,2,1,2,0,1,0,2,1,2]},
  {id:'dream',name:'&#xAFC8;&#xC758; &#xC138;&#xACC4;',bpm:110,notes:[1,1,0,2,0,1,2,1,0,0,2,1,2,0,1,1]}
];

function openRhythmGame(){
  trackV16Feature('rhythm');
  sfxV16('v16_feature');
  var rhythmData = v16Load('hatcuping_rhythm', {bestScores:{}, totalPlays:0});
  var songIdx = 0;

  var songBtns = RHYTHM_SONGS.map(function(s,i){
    var best = rhythmData.bestScores[s.id] || 0;
    return '<button class="v16-song-btn" data-idx="' + i + '" style="padding:4px 10px;border:1px solid var(--border);border-radius:8px;background:var(--glass);font-size:11px;cursor:pointer">' + s.name + ' (' + s.bpm + 'BPM) ' + (best>0?'Best:'+best:'') + '</button>';
  }).join(' ');

  var m = createV16Modal('&#x1F3B5; &#xB9AC;&#xB4EC; &#xD0C0;&#xC774;&#xBC0D; &#xAC8C;&#xC784;', '<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px">' + songBtns + '</div><canvas id="rhythmCanvas" width="300" height="350" style="width:100%;max-width:300px;border-radius:12px;display:block;margin:0 auto;background:#1a0a2e"></canvas><div style="display:flex;justify-content:center;gap:8px;margin-top:8px"><button id="rhythmLane0" style="padding:8px 20px;border:none;border-radius:8px;background:#FF5FA2;color:#fff;font-size:14px;font-weight:700;cursor:pointer">&#x2B05;</button><button id="rhythmLane1" style="padding:8px 20px;border:none;border-radius:8px;background:#B066FF;color:#fff;font-size:14px;font-weight:700;cursor:pointer">&#x2B07;</button><button id="rhythmLane2" style="padding:8px 20px;border:none;border-radius:8px;background:#4FC3F7;color:#fff;font-size:14px;font-weight:700;cursor:pointer">&#x27A1;</button></div><p style="font-size:11px;color:var(--text-sub);text-align:center;margin-top:4px">&#xD0A4;&#xBCF4;&#xB4DC;: Z/X/C &#xB610;&#xB294; &#xBC84;&#xD2BC; &#xD074;&#xB9AD;</p>');

  var canvas = document.getElementById('rhythmCanvas');
  var ctx = canvas.getContext('2d');
  var playing = false, noteIdx = 0, score = 0, combo = 0, maxCombo = 0;
  var fallingNotes = [], laneW = 100, judgeLine = 310;
  var frameId = null;

  function startSong(idx){
    songIdx = idx;
    var song = RHYTHM_SONGS[songIdx];
    playing = true; noteIdx = 0; score = 0; combo = 0; maxCombo = 0;
    fallingNotes = [];
    var interval = 60000 / song.bpm;
    var noteTimer = setInterval(function(){
      if(!playing || noteIdx >= song.notes.length){
        clearInterval(noteTimer);
        if(noteIdx >= song.notes.length){
          setTimeout(function(){
            playing = false;
            if(frameId) cancelAnimationFrame(frameId);
            var grade = score >= 90 ? 'S' : score >= 70 ? 'A' : score >= 50 ? 'B' : score >= 30 ? 'C' : 'D';
            if(!rhythmData.bestScores[song.id] || score > rhythmData.bestScores[song.id]){
              rhythmData.bestScores[song.id] = score;
            }
            rhythmData.totalPlays++;
            v16Save('hatcuping_rhythm', rhythmData);
            showToastV16('&#x1F3B5; ' + song.name + ' &#xC644;&#xB8CC;! &#xC810;&#xC218;:' + score + ' &#xB4F1;&#xAE09;:' + grade + ' &#xCF64;&#xBCF4;:' + maxCombo);
          }, 1500);
        }
        return;
      }
      fallingNotes.push({lane: song.notes[noteIdx], y: 0, hit: false, missed: false});
      noteIdx++;
    }, interval);

    function gameLoop(){
      if(!playing && fallingNotes.length === 0){return;}
      ctx.clearRect(0,0,300,350);
      var colors = ['#FF5FA2','#B066FF','#4FC3F7'];
      for(var l=0;l<3;l++){
        ctx.fillStyle = 'rgba(255,255,255,.03)';
        ctx.fillRect(l*laneW, 0, laneW, 350);
        ctx.strokeStyle = 'rgba(255,255,255,.1)';
        ctx.strokeRect(l*laneW, 0, laneW, 350);
      }
      ctx.fillStyle = 'rgba(255,255,255,.15)';
      ctx.fillRect(0, judgeLine-4, 300, 8);

      for(var i=fallingNotes.length-1;i>=0;i--){
        var n = fallingNotes[i];
        if(n.hit) continue;
        n.y += 3;
        if(n.y > judgeLine + 40){
          n.missed = true;
          combo = 0;
          fallingNotes.splice(i, 1);
          continue;
        }
        ctx.fillStyle = colors[n.lane];
        ctx.beginPath();
        ctx.roundRect(n.lane*laneW+10, n.y-15, laneW-20, 30, 8);
        ctx.fill();
      }

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('Score: ' + score, 10, 25);
      ctx.fillText('Combo: ' + combo, 10, 45);
      ctx.textAlign = 'right';
      var grade = score >= 90 ? 'S' : score >= 70 ? 'A' : score >= 50 ? 'B' : score >= 30 ? 'C' : 'D';
      ctx.fillText(grade, 290, 25);

      frameId = requestAnimationFrame(gameLoop);
    }
    gameLoop();
  }

  function hitLane(lane){
    if(!playing) return;
    var bestDist = 999, bestIdx = -1;
    for(var i=0;i<fallingNotes.length;i++){
      var n = fallingNotes[i];
      if(n.lane === lane && !n.hit && !n.missed){
        var dist = Math.abs(n.y - judgeLine);
        if(dist < 40 && dist < bestDist){
          bestDist = dist;
          bestIdx = i;
        }
      }
    }
    if(bestIdx >= 0){
      fallingNotes[bestIdx].hit = true;
      var points = bestDist < 15 ? 10 : bestDist < 25 ? 7 : 4;
      score += points;
      combo++;
      if(combo > maxCombo) maxCombo = combo;
      sfxV16('rhythm_hit');
      fallingNotes.splice(bestIdx, 1);
    } else {
      combo = 0;
    }
  }

  document.getElementById('rhythmLane0').onclick = function(){ hitLane(0); };
  document.getElementById('rhythmLane1').onclick = function(){ hitLane(1); };
  document.getElementById('rhythmLane2').onclick = function(){ hitLane(2); };

  function rhythmKeyHandler(e){
    if(!document.getElementById('rhythmCanvas')){document.removeEventListener('keydown',rhythmKeyHandler);return;}
    if(e.key==='z'||e.key==='Z'){e.preventDefault();hitLane(0);}
    else if(e.key==='x'||e.key==='X'){e.preventDefault();hitLane(1);}
    else if(e.key==='c'||e.key==='C'){e.preventDefault();hitLane(2);}
  }
  document.addEventListener('keydown', rhythmKeyHandler);

  document.querySelectorAll('.v16-song-btn').forEach(function(btn){
    btn.onclick = function(){
      if(playing) return;
      startSong(parseInt(btn.dataset.idx));
    };
  });

  startSong(0);
}


// ============================================================
// 7. HATCUPING PUZZLE SLIDER (3x3 / 4x4)
// ============================================================
function openPuzzleSlider(){
  trackV16Feature('puzzle');
  sfxV16('v16_feature');
  var puzzleData = v16Load('hatcuping_puzzle', {clears3:0,clears4:0,bestMoves3:999,bestMoves4:999});
  var size = 3, tiles = [], emptyIdx = 0, moves = 0, solved = false;

  function initPuzzle(s){
    size = s; moves = 0; solved = false;
    tiles = [];
    for(var i=0;i<size*size-1;i++) tiles.push(i+1);
    tiles.push(0);
    emptyIdx = size*size-1;
    for(var j=0;j<200;j++){
      var dirs = [];
      var er = Math.floor(emptyIdx/size), ec = emptyIdx%size;
      if(er>0) dirs.push(emptyIdx-size);
      if(er<size-1) dirs.push(emptyIdx+size);
      if(ec>0) dirs.push(emptyIdx-1);
      if(ec<size-1) dirs.push(emptyIdx+1);
      var pick = dirs[Math.floor(Math.random()*dirs.length)];
      tiles[emptyIdx] = tiles[pick];
      tiles[pick] = 0;
      emptyIdx = pick;
    }
    if(document.getElementById('puzzleMoves')) document.getElementById('puzzleMoves').textContent = '0';
  }

  var m = createV16Modal('&#x1F9E9; &#xD558;&#xCE04;&#xD551; &#xD37C;&#xC990; &#xC2AC;&#xB77C;&#xC774;&#xB354;', '<p style="font-size:12px;color:var(--text-sub);margin-bottom:6px">&#xC774;&#xB3D9;: <span id="puzzleMoves">0</span> | 3x3 &#xCD5C;&#xACE0;: <span id="puzzleBest3">' + (puzzleData.bestMoves3<999?puzzleData.bestMoves3:'-') + '</span> | 4x4 &#xCD5C;&#xACE0;: <span id="puzzleBest4">' + (puzzleData.bestMoves4<999?puzzleData.bestMoves4:'-') + '</span></p><div style="display:flex;gap:8px;justify-content:center;margin-bottom:8px"><button id="puzzle3" style="padding:4px 14px;border:none;border-radius:8px;background:var(--pink);color:#fff;font-size:12px;font-weight:700;cursor:pointer">3x3</button><button id="puzzle4" style="padding:4px 14px;border:none;border-radius:8px;background:var(--purple,#B066FF);color:#fff;font-size:12px;font-weight:700;cursor:pointer">4x4</button></div><canvas id="puzzleCanvas" width="280" height="280" style="width:100%;max-width:280px;border-radius:12px;display:block;margin:0 auto;cursor:pointer"></canvas>');

  var canvas = document.getElementById('puzzleCanvas');
  var ctx = canvas.getContext('2d');

  function drawPuzzle(){
    var dk = isDarkV16();
    ctx.clearRect(0,0,280,280);
    var cellSize = 280/size;
    var colors = ['#FF5FA2','#B066FF','#4FC3F7','#FFD54F','#66BB6A','#FF9800','#E91E63','#9C27B0','#00BCD4','#F44336','#8BC34A','#FF7043','#5C6BC0','#26A69A','#EC407A','#AB47BC'];
    for(var i=0;i<size*size;i++){
      var val = tiles[i];
      var col = i%size, row = Math.floor(i/size);
      var x = col*cellSize, y = row*cellSize;
      if(val === 0){
        ctx.fillStyle = dk ? '#1a0a2e' : '#f0f0f0';
        ctx.fillRect(x+2,y+2,cellSize-4,cellSize-4);
        continue;
      }
      ctx.fillStyle = colors[(val-1) % colors.length];
      ctx.beginPath();
      ctx.roundRect(x+3,y+3,cellSize-6,cellSize-6,8);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold ' + Math.floor(cellSize*0.35) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(val, x+cellSize/2, y+cellSize/2);
    }
    if(solved){
      ctx.fillStyle = 'rgba(0,0,0,.5)';
      ctx.fillRect(0,0,280,280);
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('CLEAR!', 140, 130);
      ctx.fillStyle = '#fff';
      ctx.font = '16px sans-serif';
      ctx.fillText(moves + ' moves', 140, 160);
    }
  }

  function checkSolved(){
    for(var i=0;i<size*size-1;i++){
      if(tiles[i] !== i+1) return false;
    }
    return tiles[size*size-1] === 0;
  }

  canvas.onclick = function(e){
    if(solved) return;
    var rect = canvas.getBoundingClientRect();
    var sx = 280/rect.width;
    var cellSize = 280/size;
    var mx = (e.clientX-rect.left)*sx, my = (e.clientY-rect.top)*sx;
    var col = Math.floor(mx/cellSize), row = Math.floor(my/cellSize);
    if(col<0||col>=size||row<0||row>=size) return;
    var idx = row*size+col;
    if(tiles[idx] === 0) return;
    var er = Math.floor(emptyIdx/size), ec = emptyIdx%size;
    if((Math.abs(row-er)===1&&col===ec)||(Math.abs(col-ec)===1&&row===er)){
      tiles[emptyIdx] = tiles[idx];
      tiles[idx] = 0;
      emptyIdx = idx;
      moves++;
      sfxV16('puzzle_slide');
      document.getElementById('puzzleMoves').textContent = moves;
      if(checkSolved()){
        solved = true;
        sfxV16('puzzle_clear');
        if(size===3){
          puzzleData.clears3++;
          if(moves<puzzleData.bestMoves3) puzzleData.bestMoves3 = moves;
          document.getElementById('puzzleBest3').textContent = puzzleData.bestMoves3;
        } else {
          puzzleData.clears4++;
          if(moves<puzzleData.bestMoves4) puzzleData.bestMoves4 = moves;
          document.getElementById('puzzleBest4').textContent = puzzleData.bestMoves4;
        }
        v16Save('hatcuping_puzzle', puzzleData);
        showToastV16('\u{1F389} &#xD37C;&#xC990; &#xD074;&#xB9AC;&#xC5B4;! ' + moves + '&#xD68C; &#xC774;&#xB3D9;');
      }
      drawPuzzle();
    }
  };

  document.getElementById('puzzle3').onclick = function(){ initPuzzle(3); drawPuzzle(); };
  document.getElementById('puzzle4').onclick = function(){ initPuzzle(4); drawPuzzle(); };

  initPuzzle(3);
  drawPuzzle();
}


// ============================================================
// 8. CHARACTER QUOTE GALLERY (20 famous quotes)
// ============================================================
var QUOTES = [
  {char:'&#xB85C;&#xBBF8;',quote:'&#xD558;&#xCE04;&#xD551;, &#xB098;&#xB294; &#xB110; &#xC0AC;&#xB791;&#xD574;!',emoji:'&#x1F467;'},
  {char:'&#xD558;&#xCE04;&#xD551;',quote:'&#xC0AC;&#xB791;&#xC758; &#xD798;&#xC774; &#xC138;&#xC0C1;&#xC744; &#xAD6C;&#xD560; &#xAC70;&#xC57C;!',emoji:'&#x1F496;'},
  {char:'&#xBC14;&#xB85C;&#xD551;',quote:'&#xC815;&#xC758;&#xB97C; &#xC704;&#xD574;! &#xBC14;&#xB85C; &#xB098;&#xC57C;!',emoji:'&#x1F4AA;'},
  {char:'&#xCC28;&#xCC28;&#xD551;',quote:'&#xCC28;&#xAC11;&#xAC8C;, &#xADF8;&#xB9AC;&#xACE0; &#xC815;&#xD655;&#xD558;&#xAC8C;.',emoji:'&#x1F9CA;'},
  {char:'&#xAF09;&#xAF09;&#xD551;',quote:'&#xC790;&#xC5F0;&#xC758; &#xD798;&#xC744; &#xBBFF;&#xC5B4;&#xBD10;!',emoji:'&#x1F340;'},
  {char:'&#xC544;&#xB77C;&#xD551;',quote:'&#xC544;&#xB77C;&#xBD10;~ &#xBBF8;&#xB798;&#xB97C; &#xBCFC; &#xC218; &#xC788;&#xC5B4;!',emoji:'&#x2728;'},
  {char:'&#xBB34;&#xB7F9;&#xD551;',quote:'&#xBB3C;&#xCC98;&#xB7FC; &#xD750;&#xB974;&#xBA74; &#xB3FC;.',emoji:'&#x1F4A7;'},
  {char:'&#xD5E4;&#xD5E4;&#xD551;',quote:'&#xC6C3;&#xC73C;&#xBA74; &#xBAA8;&#xB4E0; &#xAC8C; &#xD574;&#xACB0;&#xB3FC;!',emoji:'&#x1F60A;'},
  {char:'&#xC5EC;&#xC655;&#xB2D8;',quote:'&#xD2F0;&#xB2C8;&#xD551;&#xB4E4;&#xC744; &#xC9C0;&#xCF1C;&#xC57C; &#xD574;.',emoji:'&#x1F451;'},
  {char:'&#xB85C;&#xBBF8;',quote:'&#xCE5C;&#xAD6C;&#xB4E4;&#xC774; &#xC788;&#xC73C;&#xBA74; &#xBB34;&#xC5C7;&#xC774;&#xB4E0; &#xD560; &#xC218; &#xC788;&#xC5B4;!',emoji:'&#x1F467;'},
  {char:'&#xD558;&#xCE04;&#xD551;',quote:'&#xC0AC;&#xB791;&#xC740; &#xAC00;&#xC7A5; &#xAC15;&#xD55C; &#xB9C8;&#xBC95;&#xC774;&#xC57C;.',emoji:'&#x1F496;'},
  {char:'&#xBC14;&#xB85C;&#xD551;',quote:'&#xD3EC;&#xAE30;&#xD558;&#xC9C0; &#xB9C8;! &#xC6B0;&#xB9AC;&#xB294; &#xD560; &#xC218; &#xC788;&#xC5B4;!',emoji:'&#x1F4AA;'},
  {char:'&#xAF09;&#xAF09;&#xD551;',quote:'&#xC528;&#xC559;&#xC744; &#xC2EC;&#xC73C;&#xBA74; &#xAF43;&#xC774; &#xD540;&#xB2E4;!',emoji:'&#x1F340;'},
  {char:'&#xCC28;&#xCC28;&#xD551;',quote:'&#xACC4;&#xD68D;&#xB300;&#xB85C; &#xAC00;&#xBA74; &#xBB38;&#xC81C;&#xC5C6;&#xC5B4;.',emoji:'&#x1F9CA;'},
  {char:'&#xD5E4;&#xD5E4;&#xD551;',quote:'&#xC624;&#xB298;&#xB3C4; &#xD589;&#xBCF5;&#xD55C; &#xD558;&#xB8E8;!',emoji:'&#x1F60A;'},
  {char:'&#xC544;&#xB77C;&#xD551;',quote:'&#xBCC4;&#xC774; &#xBE5B;&#xB098;&#xB294; &#xBC24;, &#xAFC8;&#xC744; &#xAFD4;!',emoji:'&#x2728;'},
  {char:'&#xBB34;&#xB7F9;&#xD551;',quote:'&#xBE44;&#xAC00; &#xC624;&#xBA74; &#xBB34;&#xC9C0;&#xAC1C;&#xAC00; &#xB5A0;.',emoji:'&#x1F4A7;'},
  {char:'&#xB85C;&#xBBF8;',quote:'&#xBAA8;&#xB450;&#xC758; &#xD589;&#xBCF5;&#xC744; &#xC704;&#xD574;&#xC11C;!',emoji:'&#x1F467;'},
  {char:'&#xD558;&#xCE04;&#xD551;',quote:'&#xB108;&#xC758; &#xB9C8;&#xC74C;&#xC774; &#xB098;&#xC758; &#xD798;&#xC774;&#xC57C;.',emoji:'&#x1F496;'},
  {char:'&#xC5EC;&#xC655;&#xB2D8;',quote:'&#xC774;&#xBAA8;&#xC158; &#xC655;&#xAD6D;&#xC758; &#xD3C9;&#xD654;&#xB97C; &#xC704;&#xD574;!',emoji:'&#x1F451;'}
];

function openQuoteGallery(){
  trackV16Feature('quote');
  sfxV16('quote_open');
  var today = new Date();
  var seed = today.getFullYear()*10000+(today.getMonth()+1)*100+today.getDate();
  var dailyIdx = seed % QUOTES.length;
  var dailyQuote = QUOTES[dailyIdx];

  var quoteCards = QUOTES.map(function(q, i){
    var isDaily = i === dailyIdx;
    return '<div style="padding:10px;margin-bottom:6px;border-radius:12px;background:' + (isDaily ? 'linear-gradient(135deg,rgba(255,95,162,.1),rgba(176,102,255,.1))' : 'rgba(0,0,0,.02)') + ';border:' + (isDaily ? '2px solid var(--pink)' : '1px solid var(--border)') + '"><div style="display:flex;align-items:center;gap:8px;margin-bottom:4px"><span style="font-size:20px">' + q.emoji + '</span><span style="font-size:13px;font-weight:700">' + q.char + '</span>' + (isDaily ? '<span style="font-size:9px;background:var(--pink);color:#fff;padding:1px 6px;border-radius:8px">TODAY</span>' : '') + '</div><p style="font-size:12px;color:var(--text-sub);line-height:1.5;font-style:italic">&ldquo;' + q.quote + '&rdquo;</p></div>';
  }).join('');

  createV16Modal('&#x1F4AC; &#xCE90;&#xB9AD;&#xD130; &#xBA85;&#xB300;&#xC0AC; &#xAC24;&#xB7EC;&#xB9AC;', '<p style="font-size:12px;color:var(--text-sub);margin-bottom:10px">&#xB9E4;&#xC77C; &#xC0C8;&#xB85C;&#xC6B4; &#xBA85;&#xB300;&#xC0AC;&#xAC00; &#xD558;&#xC774;&#xB77C;&#xC774;&#xD2B8;&#xB429;&#xB2C8;&#xB2E4; (20&#xC120;)</p>' + quoteCards);
}


// ============================================================
// ACHIEVEMENTS V16 (+12, total 118->130)
// ============================================================
var V16_ACHIEVEMENTS = [
  {id:'a_v16_maze_first',name:'&#xBBF8;&#xB85C; &#xD0D0;&#xD5D8;&#xAC00;',desc:'&#xCCAB; &#xBBF8;&#xB85C; &#xD074;&#xB9AC;&#xC5B4;',cat:'general',icon:'&#x1F9E9;'},
  {id:'a_v16_maze_all',name:'&#xBBF8;&#xB85C; &#xB9C8;&#xC2A4;&#xD130;',desc:'3&#xB2E8;&#xACC4; &#xBBF8;&#xB85C; &#xC804;&#xBD80; &#xD074;&#xB9AC;&#xC5B4;',cat:'general',icon:'&#x1F3C6;'},
  {id:'a_v16_farm_10',name:'&#xCD08;&#xBCF4; &#xB18D;&#xBD80;',desc:'&#xC791;&#xBB3C; 10&#xAC1C; &#xC218;&#xD655;',cat:'general',icon:'&#x1F33E;'},
  {id:'a_v16_farm_gold',name:'&#xBD80;&#xC790; &#xB18D;&#xBD80;',desc:'&#xACE8;&#xB4DC; 500 &#xB2EC;&#xC131;',cat:'general',icon:'&#x1F4B0;'},
  {id:'a_v16_attend_7',name:'7&#xC77C; &#xC5F0;&#xC18D; &#xCD9C;&#xC11D;',desc:'7&#xC77C; &#xC5F0;&#xC18D; &#xCD9C;&#xC11D;&#xCCB4;&#xD06C;',cat:'general',icon:'&#x1F4C5;'},
  {id:'a_v16_attend_14',name:'14&#xC77C; &#xC5F0;&#xC18D;',desc:'14&#xC77C; &#xC5F0;&#xC18D; &#xCD9C;&#xC11D;',cat:'general',icon:'&#x1F31F;'},
  {id:'a_v16_relation',name:'&#xAD00;&#xACC4;&#xB3C4; &#xD0D0;&#xC0C9;',desc:'&#xCE90;&#xB9AD;&#xD130; &#xAD00;&#xACC4;&#xB3C4; &#xD655;&#xC778;',cat:'general',icon:'&#x1F495;'},
  {id:'a_v16_color_5',name:'&#xCEEC;&#xB7EC;&#xB9C1; &#xC785;&#xBB38;',desc:'5&#xAC1C; &#xB3C4;&#xC548; &#xCC44;&#xC0C9;',cat:'general',icon:'&#x1F3A8;'},
  {id:'a_v16_rhythm_s',name:'&#xB9AC;&#xB4EC; S&#xB4F1;&#xAE09;',desc:'&#xB9AC;&#xB4EC;&#xAC8C;&#xC784; S&#xB4F1;&#xAE09; &#xB2EC;&#xC131;',cat:'general',icon:'&#x1F3B5;'},
  {id:'a_v16_puzzle_3',name:'&#xD37C;&#xC990; 3x3 &#xD074;&#xB9AC;&#xC5B4;',desc:'3x3 &#xD37C;&#xC990; &#xCCAB; &#xD074;&#xB9AC;&#xC5B4;',cat:'general',icon:'&#x1F9E9;'},
  {id:'a_v16_puzzle_4',name:'&#xD37C;&#xC990; 4x4 &#xD074;&#xB9AC;&#xC5B4;',desc:'4x4 &#xD37C;&#xC990; &#xCCAB; &#xD074;&#xB9AC;&#xC5B4;',cat:'general',icon:'&#x1F3C5;'},
  {id:'a_v16_explorer',name:'v16 &#xD0D0;&#xD5D8;&#xAC00;',desc:'v16 &#xAE30;&#xB2A5; 6&#xAC1C; &#xC774;&#xC0C1; &#xCCB4;&#xD5D8;',cat:'general',icon:'&#x1F680;'}
];

function injectV16Achievements(){
  if(!window.AD) return;
  V16_ACHIEVEMENTS.forEach(function(a){
    var exists = false;
    for(var i=0;i<window.AD.length;i++){
      if(window.AD[i].id === a.id){ exists = true; break; }
    }
    if(!exists) window.AD.push(a);
  });
}

function checkAndAwardV16(){
  try{
    var a = JSON.parse(localStorage.getItem('hatcuping_achievements') || '{}');

    var mazeData = v16Load('hatcuping_maze', {level:0,clears:0});
    if(mazeData.clears > 0 && !a.a_v16_maze_first){
      a.a_v16_maze_first = Date.now();
      showToastV16('&#x1F3C6; &#xBBF8;&#xB85C; &#xD0D0;&#xD5D8;&#xAC00; &#xC5C5;&#xC801; &#xB2EC;&#xC131;!');
    }
    if(mazeData.clears >= 3 && !a.a_v16_maze_all){
      a.a_v16_maze_all = Date.now();
      showToastV16('&#x1F3C6; &#xBBF8;&#xB85C; &#xB9C8;&#xC2A4;&#xD130; &#xC5C5;&#xC801; &#xB2EC;&#xC131;!');
    }

    var farmData = v16Load('hatcuping_farm', {grid:[],gold:50,totalHarvest:0});
    if(farmData.totalHarvest >= 10 && !a.a_v16_farm_10){
      a.a_v16_farm_10 = Date.now();
      showToastV16('&#x1F3C6; &#xCD08;&#xBCF4; &#xB18D;&#xBD80; &#xC5C5;&#xC801; &#xB2EC;&#xC131;!');
    }
    if(farmData.gold >= 500 && !a.a_v16_farm_gold){
      a.a_v16_farm_gold = Date.now();
      showToastV16('&#x1F3C6; &#xBD80;&#xC790; &#xB18D;&#xBD80; &#xC5C5;&#xC801; &#xB2EC;&#xC131;!');
    }

    var attendData = v16Load('hatcuping_attend', {days:[],streak:0});
    if(attendData.streak >= 7 && !a.a_v16_attend_7){
      a.a_v16_attend_7 = Date.now();
      showToastV16('&#x1F3C6; 7&#xC77C; &#xC5F0;&#xC18D; &#xCD9C;&#xC11D; &#xC5C5;&#xC801; &#xB2EC;&#xC131;!');
    }
    if(attendData.streak >= 14 && !a.a_v16_attend_14){
      a.a_v16_attend_14 = Date.now();
      showToastV16('&#x1F3C6; 14&#xC77C; &#xC5F0;&#xC18D; &#xC5C5;&#xC801; &#xB2EC;&#xC131;!');
    }

    var features = [];
    try{ features = JSON.parse(localStorage.getItem('hatcuping_v16_features') || '[]'); }catch(e){}
    if(features.indexOf('relation') !== -1 && !a.a_v16_relation){
      a.a_v16_relation = Date.now();
      showToastV16('&#x1F3C6; &#xAD00;&#xACC4;&#xB3C4; &#xD0D0;&#xC0C9; &#xC5C5;&#xC801; &#xB2EC;&#xC131;!');
    }

    var colorData = v16Load('hatcuping_coloring', {designs:{}});
    if(colorData.designs && Object.keys(colorData.designs).length >= 5 && !a.a_v16_color_5){
      a.a_v16_color_5 = Date.now();
      showToastV16('&#x1F3C6; &#xCEEC;&#xB7EC;&#xB9C1; &#xC785;&#xBB38; &#xC5C5;&#xC801; &#xB2EC;&#xC131;!');
    }

    var rhythmData = v16Load('hatcuping_rhythm', {bestScores:{}});
    var hasS = false;
    Object.keys(rhythmData.bestScores||{}).forEach(function(k){
      if(rhythmData.bestScores[k] >= 90) hasS = true;
    });
    if(hasS && !a.a_v16_rhythm_s){
      a.a_v16_rhythm_s = Date.now();
      showToastV16('&#x1F3C6; &#xB9AC;&#xB4EC; S&#xB4F1;&#xAE09; &#xC5C5;&#xC801; &#xB2EC;&#xC131;!');
    }

    var puzzleData = v16Load('hatcuping_puzzle', {clears3:0,clears4:0});
    if(puzzleData.clears3 > 0 && !a.a_v16_puzzle_3){
      a.a_v16_puzzle_3 = Date.now();
      showToastV16('&#x1F3C6; &#xD37C;&#xC990; 3x3 &#xD074;&#xB9AC;&#xC5B4; &#xC5C5;&#xC801; &#xB2EC;&#xC131;!');
    }
    if(puzzleData.clears4 > 0 && !a.a_v16_puzzle_4){
      a.a_v16_puzzle_4 = Date.now();
      showToastV16('&#x1F3C6; &#xD37C;&#xC990; 4x4 &#xD074;&#xB9AC;&#xC5B4; &#xC5C5;&#xC801; &#xB2EC;&#xC131;!');
    }

    if(features.length >= 6 && !a.a_v16_explorer){
      a.a_v16_explorer = Date.now();
      showToastV16('&#x1F3C6; v16 &#xD0D0;&#xD5D8;&#xAC00; &#xC5C5;&#xC801; &#xB2EC;&#xC131;!');
    }

    localStorage.setItem('hatcuping_achievements', JSON.stringify(a));
  }catch(e){}
}


// ============================================================
// QUIZ V16 (+15 questions, 105->120)
// ============================================================
function injectExtraQuizV16(){
  if(!window.QUIZ_BANK) window.QUIZ_BANK = [];
  var pool = window.hatcuping_quiz_pool || window.QUIZ_BANK;
  var newQ = [
    {q:'&#xBBF8;&#xB85C;&#xD0D0;&#xD5D8;&#xC758; &#xCD5C;&#xB300; &#xBBF8;&#xB85C; &#xD06C;&#xAE30;&#xB294;?',a:['6x6','7x7','8x8','10x10'],c:2},
    {q:'&#xB18D;&#xC7A5; &#xC2DC;&#xBBAC;&#xB808;&#xC774;&#xD130;&#xC758; &#xC791;&#xBB3C; &#xC885;&#xB958; &#xC218;&#xB294;?',a:['4','6','8','10'],c:2},
    {q:'&#xB18D;&#xC7A5;&#xC5D0;&#xC11C; &#xAC00;&#xC7A5; &#xBE44;&#xC2FC; &#xC791;&#xBB3C;&#xC740;?',a:['&#xB531;&#xAE30;','&#xC625;&#xC218;&#xC218;','&#xC218;&#xBC15;','&#xCCB4;&#xB9AC;'],c:2},
    {q:'&#xCD9C;&#xC11D; &#xCE98;&#xB9B0;&#xB354;&#xC758; &#xCD1D; &#xC77C;&#xC218;&#xB294;?',a:['7','14','21','30'],c:3},
    {q:'&#xCE90;&#xB9AD;&#xD130; &#xAD00;&#xACC4;&#xB3C4;&#xC758; &#xCE90;&#xB9AD;&#xD130; &#xC218;&#xB294;?',a:['8','10','12','15'],c:2},
    {q:'&#xB85C;&#xBBF8;&#xC640; &#xD558;&#xCE04;&#xD551;&#xC758; &#xAD00;&#xACC4;&#xB294;?',a:['&#xCE5C;&#xAD6C;','&#xC0AC;&#xB791;','&#xB77C;&#xC774;&#xBC8C;','&#xCDA9;&#xC131;'],c:1},
    {q:'&#xCEEC;&#xB7EC;&#xB9C1;&#xBD81;&#xC758; &#xD314;&#xB808;&#xD2B8; &#xC0C9;&#xC0C1; &#xC218;&#xB294;?',a:['8','10','12','16'],c:2},
    {q:'&#xCEEC;&#xB7EC;&#xB9C1;&#xBD81;&#xC758; &#xCD1D; &#xB3C4;&#xC548; &#xC218;&#xB294;?',a:['8','10','12','15'],c:2},
    {q:'&#xB9AC;&#xB4EC; &#xD0C0;&#xC774;&#xBC0D; &#xAC8C;&#xC784;&#xC758; &#xB808;&#xC778; &#xC218;&#xB294;?',a:['2','3','4','5'],c:1},
    {q:'&#xB9AC;&#xB4EC; &#xAC8C;&#xC784;&#xC758; &#xCD1D; &#xACE1; &#xC218;&#xB294;?',a:['4','5','6','8'],c:2},
    {q:'&#xD37C;&#xC990; &#xC2AC;&#xB77C;&#xC774;&#xB354;&#xC758; &#xCD5C;&#xB300; &#xD06C;&#xAE30;&#xB294;?',a:['3x3','4x4','5x5','6x6'],c:1},
    {q:'&#xBA85;&#xB300;&#xC0AC; &#xAC24;&#xB7EC;&#xB9AC;&#xC758; &#xCD1D; &#xBA85;&#xB300;&#xC0AC; &#xC218;&#xB294;?',a:['10','15','20','25'],c:2},
    {q:'v16&#xC5D0;&#xC11C; &#xCD94;&#xAC00;&#xB41C; &#xC5C5;&#xC801; &#xC218;&#xB294;?',a:['8','10','12','15'],c:2},
    {q:'&#xBC14;&#xB85C;&#xD551;&#xACFC; &#xCC28;&#xCC28;&#xD551;&#xC758; &#xAD00;&#xACC4;&#xB294;?',a:['&#xCE5C;&#xAD6C;','&#xC0AC;&#xB791;','&#xB77C;&#xC774;&#xBC8C;','&#xCDA9;&#xC131;'],c:2},
    {q:'&#xB18D;&#xC7A5;&#xC758; &#xADF8;&#xB9AC;&#xB4DC; &#xD06C;&#xAE30;&#xB294;?',a:['4x4','5x5','6x4','8x4'],c:2}
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
// KEYBOARD SHORTCUTS (8 new: Shift+H/I/K/Q/U/V/Y/Z)
// ============================================================
function injectV16Keyboard(){
  document.addEventListener('keydown', function(e){
    if(e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if(!e.shiftKey) return;
    switch(e.key){
      case 'H': e.preventDefault(); openMazeExplorer(); break;
      case 'I': e.preventDefault(); openFarmSimulator(); break;
      case 'K': e.preventDefault(); openAttendCalendar(); break;
      case 'Q': e.preventDefault(); openRelationMap(); break;
      case 'U': e.preventDefault(); openColoringBook(); break;
      case 'V': e.preventDefault(); openRhythmGame(); break;
      case 'Y': e.preventDefault(); openPuzzleSlider(); break;
      case 'Z': e.preventDefault(); openQuoteGallery(); break;
    }
  });
}


// ============================================================
// BOTTOM NAVIGATION BAR (8 quick action buttons)
// ============================================================
function injectV16BottomNav(){
  var existing = document.getElementById('v15BottomNav');
  if(existing) existing.remove();
  existing = document.getElementById('v16BottomNav');
  if(existing) return;

  var nav = document.createElement('div');
  nav.id = 'v16BottomNav';
  nav.style.cssText = 'position:fixed;bottom:0;left:0;right:0;display:flex;justify-content:space-around;align-items:center;padding:6px 4px;background:rgba(255,255,255,.95);border-top:1px solid rgba(0,0,0,.08);z-index:900;backdrop-filter:blur(10px)';
  if(isDarkV16()) nav.style.background = 'rgba(26,10,46,.95)';

  var buttons = [
    {icon:'&#x1F9E9;',label:'&#xBBF8;&#xB85C;',action:openMazeExplorer},
    {icon:'&#x1F33E;',label:'&#xB18D;&#xC7A5;',action:openFarmSimulator},
    {icon:'&#x1F4C5;',label:'&#xCD9C;&#xC11D;',action:openAttendCalendar},
    {icon:'&#x1F495;',label:'&#xAD00;&#xACC4;&#xB3C4;',action:openRelationMap},
    {icon:'&#x1F3A8;',label:'&#xCEEC;&#xB7EC;&#xB9C1;',action:openColoringBook},
    {icon:'&#x1F3B5;',label:'&#xB9AC;&#xB4EC;',action:openRhythmGame},
    {icon:'&#x1FA78;',label:'&#xD37C;&#xC990;',action:openPuzzleSlider},
    {icon:'&#x1F4AC;',label:'&#xBA85;&#xB300;&#xC0AC;',action:openQuoteGallery}
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
function updateV16Footer(){
  var ver = document.querySelector('.footer .version');
  if(ver) ver.textContent = 'v16.0 | © PRIME Holdings NEXTERA+PRISM';

  var links = document.querySelector('.footer-links');
  if(links) links.innerHTML = '<span class="footer-link">4&#xC885; &#xAC8C;&#xC784;</span><span class="footer-link">130&#xAC1C; &#xC5C5;&#xC801;</span><span class="footer-link">&#xBBF8;&#xB85C;+&#xB18D;&#xC7A5;+&#xCEEC;&#xB7EC;&#xB9C1;</span><span class="footer-link">&#xB9AC;&#xB4EC;+&#xD37C;&#xC990;</span><span class="footer-link">&#xD000;&#xC988; 120&#xBB38;</span>';
}

function updateV16News(){
  var newsSection = document.querySelector('.news-section');
  if(!newsSection) return;
  var firstItem = newsSection.querySelector('.news-item');
  if(!firstItem) return;
  var newItem = document.createElement('div');
  newItem.className = 'news-item';
  newItem.innerHTML = '<span class="news-date">v16.0</span><span class="news-text">&#xC774;&#xBAA8;&#xC158;&#xBBF8;&#xB85C;&#xD0D0;&#xD5D8;Canvas, &#xD558;&#xCE04;&#xD551;&#xB18D;&#xC7A5;8&#xC885;, &#xCD9C;&#xC11D;&#xCE98;&#xB9B0;&#xB354;Canvas30&#xC77C;, &#xCE90;&#xB9AD;&#xD130;&#xAD00;&#xACC4;&#xB3C4;Canvas12&#xC778;, &#xCEEC;&#xB7EC;&#xB9C1;&#xBD81;12&#xB3C4;&#xC548;, &#xB9AC;&#xB4EC;&#xD0C0;&#xC774;&#xBC0D;6&#xACE1;Canvas, &#xD37C;&#xC990;&#xC2AC;&#xB77C;&#xC774;&#xB354;3x3/4x4, &#xBA85;&#xB300;&#xC0AC;20&#xC120;, &#xD000;&#xC988;+15(120), &#xC5C5;&#xC801;+12(130)</span>';
  firstItem.parentNode.insertBefore(newItem, firstItem);
}

function updateV16AchieveCount(){
  var el = document.getElementById('achieveCount');
  if(el){
    var c = 0;
    try{ c = Object.keys(JSON.parse(localStorage.getItem('hatcuping_achievements') || '{}')).length; }catch(e){}
    var t = window.AD ? window.AD.length : 130;
    el.textContent = c + '/' + t;
  }
}

function updateV16Meta(){
  var descMeta = document.querySelector('meta[name="description"]');
  if(descMeta) descMeta.content = '사랑의 하츄핑 v16.0 - 플랫포머 액션, 턴제 RPG, 오픈월드, UNIFIED 4종 게임. 업적 130개, 미로탐험, 농장시뮬, 출석캘린더, 캐릭터관계도, 컬러링북 12종, 리듬게임 6곡, 퍼즐슬라이더, 명대사 20선, 퀀즈 120문!';
  document.title = '사랑의 하츄핑 v16.0 - 게임 선택';
}


// ============================================================
// BOOT
// ============================================================
function bootV16(){
  injectV16Achievements();
  injectExtraQuizV16();
  injectV16Keyboard();
  injectV16BottomNav();
  updateV16Footer();
  updateV16News();
  updateV16AchieveCount();
  updateV16Meta();
  checkAndAwardV16();
}

if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', bootV16);
} else {
  bootV16();
}

})();

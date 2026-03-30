"""Build 사랑의 하츄핑 Pokemon-style RPG."""
import os

sd = r"D:\AI\게임\sprites"
out = r"D:\AI\게임\hatcuping-rpg.html"

# Read sprites
sp = {}
with open(os.path.join(sd, "final_sprites.js"), "r", encoding="utf-8") as f:
    for line in f:
        line = line.strip()
        if line.startswith("const ") and "=" in line:
            n = line.split("=")[0].replace("const ","").strip()
            v = line.split("=",1)[1].strip().rstrip(";").strip('"')
            sp[n] = v
print(f"Sprites: {len(sp)}")
sp_js = "\n".join(f'const {k}="{v}";' for k,v in sp.items())

html = r'''<!DOCTYPE html>
<html lang="ko"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<title>사랑의 하츄핑 RPG</title>
<link href="https://fonts.googleapis.com/css2?family=Jua&display=swap" rel="stylesheet">
<style>*{margin:0;padding:0;box-sizing:border-box}html,body{width:100%;height:100%;overflow:hidden;background:#0a0515;display:flex;justify-content:center;align-items:center}canvas{display:block;max-width:100vw;max-height:100vh;touch-action:none}</style>
</head><body><canvas id="c"></canvas>
<script>
// ===== SPRITES =====
''' + sp_js + r'''

const C=document.getElementById('c'),X=C.getContext('2d');
const W=420,H=750;C.width=W;C.height=H;
let fOK=false;setTimeout(()=>fOK=true,1200);
function FN(s){return s+'px '+(fOK?"Jua,":"")+'sans-serif'}

// ===== IMAGE LOADER =====
const IM={};let iL=0,iT=0;
function lI(n,s){iT++;const i=new Image();i.onload=()=>{iL++;IM[n]=i};i.onerror=()=>iL++;i.src=s}
lI('rs',ROMI_S);lI('rp',ROMI_P);lI('rf',ROMI_F);
lI('hs',HATCHU_S);lI('hp',HATCHU_P);lI('hf',HATCHU_F);lI('h2',HATCHU2_S);
lI('ts',TRUP_S);lI('tp',TRUP_P);lI('ba',BARO_S);lI('ch',CHACHA_S);
lI('hk',HK_F);lI('kk',KKONG_S);lI('kp',KKONG_P);lI('bk',BUKKU_S);lI('bp',BUKKU_P);
lI('hm',HATCHU_M);lI('hmp',HATCHU_MP);lI('st',STICK_S);lI('stp',STICK_P);
lI('li',LIAM_S);lI('lip',LIAM_P);lI('la',LALA_S);

// ===== HELPERS =====
function heart(c,x,y,s,col){c.save();c.translate(x,y);c.scale(s/16,s/16);c.fillStyle=col;c.beginPath();c.moveTo(0,-4);c.bezierCurveTo(-8,-14,-18,-4,-8,4);c.lineTo(0,12);c.moveTo(0,-4);c.bezierCurveTo(8,-14,18,-4,8,4);c.lineTo(0,12);c.fill();c.restore()}
function rr(c,x,y,w,h,r,f,s){c.beginPath();c.moveTo(x+r,y);c.lineTo(x+w-r,y);c.quadraticCurveTo(x+w,y,x+w,y+r);c.lineTo(x+w,y+h-r);c.quadraticCurveTo(x+w,y+h,x+w-r,y+h);c.lineTo(x+r,y+h);c.quadraticCurveTo(x,y+h,x,y+h-r);c.lineTo(x,y+r);c.quadraticCurveTo(x,y,x+r,y);c.closePath();if(f){c.fillStyle=f;c.fill()}if(s){c.strokeStyle=s;c.lineWidth=2;c.stroke()}}
function rng(a,b){return Math.floor(Math.random()*(b-a+1))+a}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function lerp(a,b,t){return a+(b-a)*t}

// ===== TILE SYSTEM =====
const T=40; // tile size
// Tile types: 0=grass 1=path 2=tree 3=wall 4=water 5=flower 6=dark_floor 7=dark_wall 8=castle_floor 9=castle_wall 10=door 11=npc_spot 12=tall_grass
const TILE_WALK={0:true,1:true,5:true,6:true,8:true,10:true,11:true,12:true};
const TILE_ENCOUNTER={12:0.12,5:0.08};

// Pre-render tiles
const tileCanvas={};
function genTiles(){
  const tiles=[
    [0,'#6EB844',c=>{c.fillStyle='#78C34E';for(let i=0;i<4;i++){c.beginPath();c.arc(rng(4,T-4),rng(4,T-4),rng(1,2),0,Math.PI*2);c.fill()}}],
    [1,'#C9A96E',c=>{c.strokeStyle='rgba(0,0,0,0.05)';c.lineWidth=1;c.strokeRect(1,1,T-2,T-2)}],
    [2,'#6EB844',c=>{c.fillStyle='#5D4037';c.fillRect(T/2-3,T/2,6,T/2);c.fillStyle='#2E7D32';c.beginPath();c.arc(T/2,T/2-2,12,0,Math.PI*2);c.fill();c.fillStyle='#388E3C';c.beginPath();c.arc(T/2-5,T/2+2,7,0,Math.PI*2);c.fill()}],
    [3,'#888',c=>{c.fillStyle='#777';c.fillRect(0,0,T,T);c.strokeStyle='#666';c.lineWidth=1;for(let i=0;i<T;i+=10)c.strokeRect(i,0,10,T/2);for(let i=5;i<T;i+=10)c.strokeRect(i,T/2,10,T/2)}],
    [4,'#2196F3',c=>{c.fillStyle='rgba(255,255,255,0.15)';c.beginPath();c.arc(T/3,T/3,4,0,Math.PI*2);c.fill();c.beginPath();c.arc(T*2/3,T*2/3,3,0,Math.PI*2);c.fill()}],
    [5,'#6EB844',c=>{const fc=['#FF69B4','#FFD700','#FF6347','#BA68C8'];for(let i=0;i<3;i++){c.fillStyle=fc[i];c.beginPath();c.arc(8+rng(0,24),8+rng(0,24),rng(2,3),0,Math.PI*2);c.fill()}}],
    [6,'#2a1540',c=>{c.fillStyle='#351a50';c.fillRect(1,1,T-2,T-2);c.strokeStyle='rgba(128,0,255,0.1)';c.lineWidth=1;c.strokeRect(2,2,T-4,T-4)}],
    [7,'#1a0a2e',c=>{c.fillStyle='#150830';c.fillRect(0,0,T,T);c.strokeStyle='#2a1540';c.lineWidth=1;for(let i=0;i<T;i+=10)c.strokeRect(i,0,10,T/2)}],
    [8,'#C8B6E2',c=>{c.fillStyle='#D4C1EC';c.fillRect(0,0,T,T);c.strokeStyle='rgba(0,0,0,0.06)';c.lineWidth=1;for(let i=0;i<T;i+=T/2){c.strokeRect(i,0,T/2,T/2);c.strokeRect(i+T/4,T/2,T/2,T/2)}}],
    [9,'#9988AA',c=>{c.fillStyle='#AA99BB';c.fillRect(0,0,T,T);c.strokeStyle='#776688';c.lineWidth=1;c.strokeRect(2,2,T-4,T-4)}],
    [10,'#8B6914',c=>{c.fillStyle='#A0792C';c.fillRect(T/4,0,T/2,T);c.fillStyle='#FFD700';c.beginPath();c.arc(T/2+5,T/2,2,0,Math.PI*2);c.fill()}],
    [11,'#C8B6E2',null], // npc spot (same as castle floor)
    [12,'#6EB844',c=>{c.fillStyle='#5A9E3A';for(let i=0;i<5;i++){const x=rng(2,T-6);c.fillRect(x,T-rng(12,20),3,rng(12,20))}}],
  ];
  tiles.forEach(([id,bg,fn])=>{
    const cv=document.createElement('canvas');cv.width=T;cv.height=T;
    const c=cv.getContext('2d');c.fillStyle=bg;c.fillRect(0,0,T,T);
    if(fn)fn(c);tileCanvas[id]=cv;
  });
}

// ===== MAPS =====
// Each map: {w,h,tiles:[rows of tile ids],npcs:[{x,y,spr,name,dialog,cond}],warps:[{x,y,map,tx,ty}],encounters:[{key,minLv,maxLv}]}
const MAPS={
castle_room:{w:10,h:8,
  tiles:[
    [9,9,9,9,9,9,9,9,9,9],
    [9,8,8,8,8,8,8,8,8,9],
    [9,8,8,8,11,8,8,8,8,9],
    [9,8,8,8,8,8,8,8,8,9],
    [9,8,8,8,8,8,8,11,8,9],
    [9,8,8,8,8,8,8,8,8,9],
    [9,8,8,8,10,8,8,8,8,9],
    [9,9,9,9,9,9,9,9,9,9],
  ],
  npcs:[
    {x:4,y:2,spr:'hk',name:'하트킹',dialog:['로미야, 오늘은 네 열 살 생일이란다!','짝꿍 티니핑을 찾는 중요한 날이야!','축제 광장에 가서 만나보렴!'],cond:'ch0'},
    {x:7,y:4,spr:null,name:'시녀',dialog:['공주님, 축제 광장은 아래쪽이에요!','문을 통해 나가시면 됩니다!'],cond:null},
  ],
  warps:[{x:4,y:6,map:'festival',tx:5,ty:1}],
  encounters:[],startX:2,startY:3,
},
festival:{w:12,h:10,
  tiles:[
    [3,3,3,3,3,3,3,3,3,3,3,3],
    [3,1,1,1,1,1,1,1,1,1,10,3],
    [3,1,5,1,1,11,1,1,5,1,1,3],
    [3,1,1,1,1,1,1,1,1,1,1,3],
    [3,1,1,11,1,1,1,11,1,1,1,3],
    [3,1,5,1,1,1,1,1,5,1,1,3],
    [3,1,1,1,1,1,1,1,1,1,1,3],
    [3,1,1,1,1,11,1,1,1,1,1,3],
    [3,1,1,1,1,1,1,1,10,1,1,3],
    [3,3,3,3,3,3,3,3,3,3,3,3],
  ],
  npcs:[
    {x:5,y:2,spr:'kk',name:'꽁꽁핑',dialog:['...냉기가 느껴진다...','(갑자기 주변이 얼어붙었다!)','으... 너무 차가워!\n이 아이는 아니야!'],cond:null},
    {x:3,y:4,spr:'bk',name:'부끄핑',dialog:['(부끄핑이 로미를 보자마자','새빨개진 얼굴로 후다닥 도망갔다!)','이 아이도 아닌 것 같아...'],cond:null},
    {x:7,y:4,spr:'st',name:'딱풀핑',dialog:['딱풀핑이 풀 마법을 보여주었는데','사람들을 전부 묶어버렸어!','이것도 아니야!'],cond:null},
    {x:5,y:7,spr:'rf',name:'집사',dialog:['공주님, 더 만나볼 티니핑이 없습니다...','혹시 도서관에 가보시겠어요?','아래쪽 문으로 가시면 됩니다.'],cond:'ch1'},
  ],
  warps:[{x:10,y:1,map:'castle_room',tx:4,ty:5},{x:8,y:8,map:'library',tx:3,ty:1}],
  encounters:[],startX:5,startY:1,
},
library:{w:8,h:7,
  tiles:[
    [9,9,9,9,9,9,9,9],
    [9,8,8,10,8,8,8,9],
    [9,8,8,8,8,8,8,9],
    [9,8,8,8,11,8,8,9],
    [9,8,8,8,8,8,8,9],
    [9,8,8,8,8,8,8,9],
    [9,9,9,9,9,9,9,9],
  ],
  npcs:[
    {x:4,y:3,spr:null,name:'낡은 책',dialog:['(신비로운 빛이 흘러나온다!)','✨ 책 속에서 하츄핑의 모습이 나타났다!','이 아이야...! 내 운명의 짝이야!','하츄핑은 라미엔느 왕국에 있대...'],cond:'ch2'},
  ],
  warps:[{x:3,y:1,map:'festival',tx:8,ty:7}],
  encounters:[],startX:3,startY:5,
},
castle_exit:{w:12,h:10,
  tiles:[
    [9,9,9,9,10,9,9,9,9,9,9,9],
    [3,3,1,1,1,1,1,1,3,3,3,3],
    [0,0,1,0,12,12,0,1,0,2,0,2],
    [0,12,1,12,0,0,12,1,12,0,0,0],
    [2,0,1,0,12,12,0,1,0,12,0,2],
    [0,12,1,12,0,0,12,1,12,0,12,0],
    [0,0,1,0,12,12,0,1,0,0,0,0],
    [2,12,1,12,0,0,12,1,12,0,2,0],
    [0,0,1,1,1,1,1,1,1,1,1,10],
    [3,3,3,3,3,3,3,3,3,3,3,3],
  ],
  npcs:[
    {x:2,y:1,spr:'hk',name:'하트킹',dialog:['로미야! 라미엔느는 위험해!','트러핑의 저주가 내린 곳이야!','...하지만 네 결심이 그렇다면...','이 바로핑을 데려가거라.\n너를 지켜줄 거야!','💫 바로핑이 파티에 합류했다!'],cond:'ch3'},
  ],
  warps:[{x:4,y:0,map:'castle_room',tx:4,ty:5},{x:11,y:8,map:'forest',tx:1,ty:1}],
  encounters:[{key:'baro',minLv:2,maxLv:4},{key:'chacha',minLv:2,maxLv:4}],
  startX:4,startY:1,
},
forest:{w:14,h:12,
  tiles:[
    [2,2,2,2,2,2,2,2,2,2,2,2,2,2],
    [2,1,1,0,12,12,0,0,12,12,0,0,2,2],
    [2,1,0,12,0,0,12,0,0,0,12,0,0,2],
    [2,0,12,0,2,0,0,12,0,2,0,12,0,2],
    [2,12,0,0,0,12,0,0,12,0,0,0,12,2],
    [2,0,12,0,12,0,0,0,0,12,0,0,0,2],
    [2,0,0,12,0,0,11,0,0,0,12,0,0,2],
    [2,12,0,0,12,0,0,0,12,0,0,12,0,2],
    [2,0,0,0,0,12,0,12,0,0,0,0,0,2],
    [2,0,12,0,0,0,0,0,0,12,1,1,1,2],
    [2,0,0,12,0,0,0,12,0,0,1,11,1,2],
    [2,2,2,2,2,2,2,2,2,2,2,10,2,2],
  ],
  npcs:[
    {x:6,y:6,spr:'ba',name:'바로핑',dialog:['나는 바로핑!','정의의 티니핑이다!','용기를 내, 로미!'],cond:null},
    {x:11,y:10,spr:null,name:'버스 아저씨',dialog:['라미엔느로 간다고?','그 눈빛... 진심이구나!','좋아! 특급버스 출발! 🚌💨'],cond:'ch4'},
  ],
  warps:[{x:11,y:11,map:'laminne',tx:7,ty:1}],
  encounters:[{key:'baro',minLv:3,maxLv:6},{key:'chacha',minLv:3,maxLv:6},{key:'kkong',minLv:4,maxLv:6}],
  startX:1,startY:1,
},
laminne:{w:14,h:14,
  tiles:[
    [7,7,7,7,7,7,7,7,7,7,7,7,7,7],
    [7,6,6,6,6,6,6,10,6,6,6,6,6,7],
    [7,6,12,6,12,6,6,6,6,12,6,12,6,7],
    [7,6,6,12,6,6,6,6,6,6,12,6,6,7],
    [7,6,12,6,6,12,6,6,12,6,6,12,6,7],
    [7,6,6,6,12,6,6,6,6,12,6,6,6,7],
    [7,6,12,6,6,6,11,6,6,6,6,12,6,7],
    [7,6,6,12,6,6,6,6,6,12,6,6,6,7],
    [7,6,12,6,6,12,6,6,12,6,6,12,6,7],
    [7,6,6,6,12,6,6,6,6,12,6,6,6,7],
    [7,6,12,6,6,6,6,6,6,6,6,12,6,7],
    [7,6,6,6,6,6,6,6,6,6,6,6,6,7],
    [7,6,6,6,6,6,11,6,6,6,6,6,6,7],
    [7,7,7,7,7,7,7,7,7,7,7,7,7,7],
  ],
  npcs:[
    {x:6,y:6,spr:'hs',name:'하츄핑',dialog:['...누구야?','인간은 무서운 존재라고 들었어...','...','...너, 진심이야?','정말 나를 찾아온 거야?','💗 ...좋아, 함께 할게!'],cond:'ch5'},
    {x:6,y:12,spr:'ts',name:'트러핑',dialog:['크크크... 인간 따위가!','하츄핑은 내 거야!','용서 못 해!'],cond:'ch6'},
  ],
  warps:[{x:7,y:1,map:'forest',tx:11,ty:9}],
  encounters:[{key:'trup_minion',minLv:5,maxLv:8}],
  startX:7,startY:2,
},
};

// ===== CHARACTER DATA =====
const CHARS={
  hatchu:{n:'하츄핑',ic:'💗',hp:55,atk:14,def:10,spd:12,type:'love',
    sk:[{n:'러브 어택',pw:15,tp:'love'},{n:'하트 빔',pw:25,tp:'love'},{n:'치유의 눈물',pw:-30,tp:'heal'},{n:'사랑의 보호막',pw:0,tp:'shield'}]},
  baro:{n:'바로핑',ic:'⭐',hp:40,atk:13,def:7,spd:10,type:'justice',
    sk:[{n:'정의 펀치',pw:14,tp:'normal'},{n:'스타 캐논',pw:24,tp:'justice'}]},
  chacha:{n:'차차핑',ic:'🔥',hp:36,atk:16,def:5,spd:14,type:'fire',
    sk:[{n:'불꽃 태클',pw:18,tp:'fire'},{n:'파이어 스톰',pw:26,tp:'fire'}]},
  kkong:{n:'꽁꽁핑',ic:'🧊',hp:45,atk:12,def:11,spd:8,type:'ice',
    sk:[{n:'얼음 바람',pw:14,tp:'ice'},{n:'블리자드',pw:22,tp:'ice'}]},
  trup_minion:{n:'그림자핑',ic:'👤',hp:30,atk:10,def:6,spd:9,type:'dark',
    sk:[{n:'그림자 공격',pw:12,tp:'dark'},{n:'어둠의 파동',pw:18,tp:'dark'}]},
  trup:{n:'트러핑',ic:'⚡',hp:120,atk:24,def:15,spd:11,type:'dark',boss:true,
    sk:[{n:'다크 캐논',pw:22,tp:'dark'},{n:'배신의 사슬',pw:30,tp:'dark'},{n:'번개 폭풍',pw:28,tp:'dark'},{n:'그림자 회복',pw:-25,tp:'heal'}]},
};
function mkCh(key,lv){const d=CHARS[key];const mhp=d.hp+lv*5;
  return{key,n:d.n,ic:d.ic,type:d.type,boss:d.boss||false,level:lv,mhp,hp:mhp,
    a:d.atk+Math.floor(lv*2),d:d.def+Math.floor(lv*1.3),spd:d.spd+lv,exp:0,
    sk:d.sk.map(s=>({...s}))};}

// ===== GAME STATE =====
let scr='title',t=0,ticks=0;
let party=[],bag={hearts:5};
let curMap='castle_room',mapData=null;
const P={x:0,y:0,tx:0,ty:0,vx:0,vy:0,moving:false,mt:0,dir:'down',wf:0,face:1};
const MS=160; // move speed ms
let storyFlags={ch:0}; // chapter progress
let parts=[];
// Story
let stQ=[],stI=0,stTx='',stDn=false,stTm=null,stCb=null;
// Transition
let trA=0,trD=0,trNx=null;
// Battle
let bat=null;
// Dialog
let dlg=null,dlgI=0;
// Menu
let menuOpen=false,menuSel=0;
// Touch
let tL=false,tR=false,tU=false,tDn=false,tA=false;
const keys={};
let btns=[];
// NPC interaction cooldown
let interactCD=0;

// ===== STORY SYSTEM =====
function goStory(arr,cb){stQ=arr;stI=0;stTx='';stDn=false;stCb=cb;doTrans('story',()=>typeSt())}
function typeSt(){const s=stQ[stI];if(!s)return;stTx='';stDn=false;let i=0;const tx=s.tx;
  clearInterval(stTm);stTm=setInterval(()=>{if(i<tx.length)stTx=tx.slice(0,++i);else{stDn=true;clearInterval(stTm)}},22)}
function advSt(){if(!stDn){clearInterval(stTm);stTx=stQ[stI].tx;stDn=true;return}
  stI++;if(stI<stQ.length)typeSt();else{clearInterval(stTm);if(stCb)stCb()}}
function doTrans(s,cb){trD=1;trNx=()=>{scr=s;if(cb)cb();trD=-1}}

// ===== MAP SYSTEM =====
function enterMap(mapName,px,py){
  curMap=mapName;mapData=MAPS[mapName];
  if(!mapData)return;
  P.x=px||mapData.startX||1;P.y=py||mapData.startY||1;
  P.tx=P.x;P.ty=P.y;P.vx=P.x;P.vy=P.y;P.moving=false;
  doTrans('map');
}

function tryMove(dir){
  if(P.moving||dlg||menuOpen)return;
  P.dir=dir;
  let nx=P.x,ny=P.y;
  if(dir==='up')ny--;if(dir==='down')ny++;if(dir==='left')nx--;if(dir==='right')nx++;
  if(nx<0||nx>=mapData.w||ny<0||ny>=mapData.h)return;
  const tile=mapData.tiles[ny][nx];
  if(!TILE_WALK[tile])return;
  // Check NPC blocking
  const npc=mapData.npcs.find(n=>n.x===nx&&n.y===ny);
  if(npc)return;
  P.tx=nx;P.ty=ny;P.moving=true;P.mt=0;
}

function interact(){
  if(dlg||P.moving||menuOpen)return;
  if(interactCD>0)return;
  interactCD=15;
  // Check facing direction for NPC
  let fx=P.x,fy=P.y;
  if(P.dir==='up')fy--;if(P.dir==='down')fy++;if(P.dir==='left')fx--;if(P.dir==='right')fx++;
  const npc=mapData.npcs.find(n=>n.x===fx&&n.y===fy);
  if(npc){
    // Check condition
    if(npc.cond){
      const ch=parseInt(npc.cond.replace('ch',''));
      if(storyFlags.ch!==ch)return; // wrong chapter
    }
    dlg={lines:npc.dialog,name:npc.name,idx:0,npc};
    // Advance chapter after talking
    if(npc.cond){
      const ch=parseInt(npc.cond.replace('ch',''));
      if(storyFlags.ch===ch)storyFlags.ch=ch+1;
    }
    return;
  }
  // Check warp
  const warp=mapData.warps.find(w=>w.x===P.x&&w.y===P.y);
  if(warp){enterMap(warp.map,warp.tx,warp.ty);return}
  // Check tile under feet
  const tile=mapData.tiles[P.y][P.x];
  if(tile===10){// door
    const warp2=mapData.warps.find(w=>w.x===P.x&&w.y===P.y);
    if(warp2)enterMap(warp2.map,warp2.tx,warp2.ty);
  }
}

function advDlg(){
  if(!dlg)return;
  dlg.idx++;
  if(dlg.idx>=dlg.lines.length){
    const npc=dlg.npc;
    dlg=null;
    // Special events after dialog
    if(npc&&npc.cond==='ch3'&&storyFlags.ch===4){
      // 바로핑 파티 합류
      if(!party.find(p=>p.key==='baro'))party.push(mkCh('baro',4));
    }
    if(npc&&npc.cond==='ch5'&&storyFlags.ch===6){
      // 하츄핑 joins party!
      party.push(mkCh('hatchu',Math.max(5,party[0]?party[0].level:5)));
      goStory([
        {bg:'sunset',img:'hp',sp:'',tx:'💗 하츄핑이 파티에 합류했다! 💗'},
        {bg:'sunset',img:'hf',sp:'하츄핑 💗',tx:'로미... 같이 가자!\n사랑의 힘으로!'},
      ],null);
    }
    if(npc&&npc.cond==='ch6'&&storyFlags.ch===7){
      // Boss battle!
      startBattle(mkCh('trup',10),true);
    }
    if(npc&&npc.cond==='ch4'&&storyFlags.ch===5){
      // Bus ride to laminne
      goStory([
        {bg:'forest',img:null,sp:'',tx:'🚌 특급버스를 타고\n라미엔느 왕국으로!\n\n어둡고 으스스한 여정...'},
      ],()=>enterMap('laminne'));
    }
  }
}

function updateMap(){
  if(interactCD>0)interactCD--;
  if(dlg||menuOpen)return;
  // Movement input
  if(!P.moving){
    if(keys.ArrowUp||keys.w||tU)tryMove('up');
    else if(keys.ArrowDown||keys.s||tDn)tryMove('down');
    else if(keys.ArrowLeft||keys.a||tL)tryMove('left');
    else if(keys.ArrowRight||keys.d||tR)tryMove('right');
  }
  // Smooth movement
  if(P.moving){
    P.mt+=16;
    const prog=clamp(P.mt/MS,0,1);
    const ease=1-(1-prog)*(1-prog);
    P.vx=lerp(P.x,P.tx,ease);
    P.vy=lerp(P.y,P.ty,ease);
    P.wf=prog;
    // Dust
    if(prog>0.2&&prog<0.8&&Math.random()<0.2){
      parts.push({x:P.vx*T+T/2+rng(-6,6),y:P.vy*T+T,vx:(Math.random()-0.5),vy:-Math.random()*0.5,l:0.4,s:rng(2,3),c:'rgba(150,140,120,0.3)'});
    }
    if(prog>=1){
      P.x=P.tx;P.y=P.ty;P.vx=P.x;P.vy=P.y;P.moving=false;P.wf=0;
      // Auto-warp on door tiles
      const tile=mapData.tiles[P.y][P.x];
      if(tile===10){
        const warp=mapData.warps.find(w=>w.x===P.x&&w.y===P.y);
        if(warp){enterMap(warp.map,warp.tx,warp.ty);return}
      }
      // Encounter check (only if party has members)
      if(party.length>0){
        const encRate=TILE_ENCOUNTER[tile];
        if(encRate&&Math.random()<encRate&&mapData.encounters.length>0){
          const enc=mapData.encounters[rng(0,mapData.encounters.length-1)];
          const lv=rng(enc.minLv,enc.maxLv);
          startBattle(mkCh(enc.key,lv),false);
        }
      }
    }
  }
  // Particles
  parts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=0.05;p.l-=0.02});
  parts=parts.filter(p=>p.l>0);
  // Interact with space/enter/A button
  if(keys[' ']||keys.Enter||tA){
    if(dlg)advDlg();
    else interact();
    keys[' ']=false;keys.Enter=false;tA=false;
  }
}

// ===== BATTLE SYSTEM =====
function startBattle(enemy,isBoss){
  const myChar=party[0]?{...party[0]}:mkCh('hatchu',5);
  bat={en:enemy,my:myChar,turn:'player',log:enemy.ic+' '+enemy.n+' 등장!',
    phase:'select',selIdx:0,over:false,isBoss,catching:null,
    enShake:0,myShake:0,dmgNums:[],anim:0};
  doTrans('battle');
}

function batAction(action){
  if(!bat||bat.over||bat.turn!=='player')return;
  if(action==='attack'){
    bat.turn='animating';
    const sk=bat.my.sk[0];
    const d=calcDmg(bat.my,bat.en,sk);
    bat.en.hp-=d;bat.enShake=15;
    bat.log=bat.my.n+'의 '+sk.n+'! '+d+' 데미지!';
    bat.dmgNums.push({v:d,x:300,y:100,t:40,heal:false});
    setTimeout(()=>{if(bat.en.hp<=0)batWin();else enemyTurn()},600);
  }
  else if(action==='skill'){bat.phase='skill';bat.selIdx=0}
  else if(action==='capture'){
    if(bat.isBoss){bat.log='보스는 포획 불가!';return}
    if(bag.hearts<=0){bat.log='하트가 없어!';return}
    bag.hearts--;bat.turn='animating';bat.catching='...';
    const rate=clamp(80-(bat.en.hp/bat.en.mhp)*55,15,85);
    setTimeout(()=>{
      if(Math.random()*100<rate){
        bat.catching='✨ '+bat.en.n+' 포획!';bat.over=true;
        party.push(mkCh(bat.en.key,bat.en.level));
        setTimeout(()=>{bat.catching=null;batEnd()},1200);
      } else {
        bat.catching='빠져나갔다!';
        setTimeout(()=>{bat.catching=null;enemyTurn()},800);
      }
    },1000);
  }
  else if(action==='run'){
    if(bat.isBoss){bat.log='보스에게서 도망칠 수 없다!';return}
    if(Math.random()<0.7){batEnd()}
    else{bat.log='도망 실패!';bat.turn='animating';setTimeout(()=>enemyTurn(),400)}
  }
}

function useSkill(idx){
  if(!bat||bat.turn!=='player')return;
  const sk=bat.my.sk[idx];if(!sk)return;
  bat.turn='animating';bat.phase='select';
  if(sk.pw<0){// heal
    const h=Math.abs(sk.pw);bat.my.hp=Math.min(bat.my.mhp,bat.my.hp+h);
    bat.log=sk.n+'! HP +'+h;
    bat.dmgNums.push({v:h,x:100,y:220,t:40,heal:true});
    setTimeout(()=>enemyTurn(),600);
  } else if(sk.tp==='shield'){
    bat.log=sk.n+'! 방어력 상승!';bat.my.d+=3;
    setTimeout(()=>enemyTurn(),600);
  } else {
    const d=calcDmg(bat.my,bat.en,sk);bat.en.hp-=d;bat.enShake=15;
    bat.log=sk.n+'! '+d+' 데미지!';
    bat.dmgNums.push({v:d,x:300,y:100,t:40,heal:false});
    setTimeout(()=>{if(bat.en.hp<=0)batWin();else enemyTurn()},600);
  }
}

function calcDmg(atk,def,sk){
  let d=Math.max(1,atk.a+sk.pw-Math.floor(def.d*0.4))+rng(0,4);
  // Type effectiveness
  if(sk.tp==='love'&&def.type==='dark')d=Math.floor(d*1.5);
  if(sk.tp==='ice'&&def.type==='fire')d=Math.floor(d*1.5);
  if(sk.tp==='fire'&&def.type==='ice')d=Math.floor(d*1.5);
  return d;
}

function enemyTurn(){
  if(!bat||bat.over)return;
  const sk=bat.en.sk[rng(0,bat.en.sk.length-1)];
  if(sk.pw<0){
    const h=Math.abs(sk.pw);bat.en.hp=Math.min(bat.en.mhp,bat.en.hp+h);
    bat.log=bat.en.n+'의 '+sk.n+'! HP+'+h;
    bat.dmgNums.push({v:h,x:300,y:100,t:40,heal:true});
  } else {
    const d=calcDmg(bat.en,bat.my,sk);bat.my.hp-=d;bat.myShake=15;
    bat.log=bat.en.n+'의 '+sk.n+'! '+d+' 데미지!';
    bat.dmgNums.push({v:d,x:100,y:220,t:40,heal:false});
  }
  setTimeout(()=>{
    if(bat.my.hp<=0){bat.over=true;bat.log='😢 패배...';
      setTimeout(()=>{party[0].hp=party[0].mhp;batEnd()},1500)}
    else{bat.turn='player';bat.phase='select';bat.selIdx=0}
  },500);
}

function batWin(){
  bat.over=true;
  const exp=bat.en.level*12+15;
  if(party[0]){party[0].exp+=exp;party[0].hp=Math.max(1,bat.my.hp);
    if(party[0].exp>=party[0].level*25){party[0].level++;party[0].mhp+=6;party[0].hp=party[0].mhp;party[0].a+=2;party[0].d+=1;party[0].exp=0;
      bat.log='🎉 Lv.'+party[0].level+'! '+bat.en.n+' 격파!'}
    else bat.log='🎉 '+bat.en.n+' 격파! EXP+'+exp}
  if(bat.isBoss){
    bat.log='🏆 트러핑 격파! 사랑이 이겼다!';
    setTimeout(()=>{bat=null;
      goStory([
        {bg:'sunset',img:'hf',sp:'하츄핑 💗',tx:'로미... 고마워!\n네 덕분에 용기를 얻었어!'},
        {bg:'sunset',img:null,sp:'',tx:'하츄핑의 눈물이 떨어지는 순간\n트러핑의 모든 저주가 풀렸어요.\n\n트러핑도 리암 왕자와 다시 만나\n오해를 풀었습니다.'},
        {bg:'sunset',img:'hf',sp:'하츄핑 💗',tx:'싸우거나 속상한 일이 있어도\n화해하면 돼.\n로미와 함께 있으면 행복해!'},
        {bg:'sunset',img:null,sp:'',tx:'💗 사랑이 세상을 구했습니다 💗\n\n로미와 하츄핑은 진정한 짝꿍이 되어\n새로운 모험을 떠납니다...'},
      ],()=>doTrans('ending'))},2000);return;
  }
  setTimeout(()=>batEnd(),2000);
}

function batEnd(){bat=null;doTrans('map')}

// ===== UPDATE =====
function update(){
  t+=0.02;ticks++;
  if(trD>0){trA=Math.min(1,trA+0.05);if(trA>=1&&trNx){trNx();trNx=null}}
  if(trD<0){trA=Math.max(0,trA-0.05);if(trA<=0)trD=0}
  if(scr==='map')updateMap();
  if(scr==='battle'&&bat){
    bat.anim+=0.05;
    if(bat.enShake>0)bat.enShake--;
    if(bat.myShake>0)bat.myShake--;
    bat.dmgNums.forEach(d=>d.t--);
    bat.dmgNums=bat.dmgNums.filter(d=>d.t>0);
  }
}

// ===== RENDERING =====
function drawBG(type){
  const g=X.createLinearGradient(0,0,0,H);
  if(type==='sunset'){g.addColorStop(0,'#FF9A8B');g.addColorStop(0.35,'#FF6B9D');g.addColorStop(0.7,'#FFB8D4');g.addColorStop(1,'#FFDEE9');X.fillStyle=g;X.fillRect(0,0,W,H);
    for(let i=0;i<8;i++){X.globalAlpha=0.12+Math.sin(t+i)*0.06;heart(X,Math.sin(t*0.4+i*1.2)*160+W/2,70+i*65,8+i*2,'#FF6B9D')}X.globalAlpha=1;
  }else if(type==='forest'){g.addColorStop(0,'#87CEEB');g.addColorStop(0.5,'#B5EAD7');g.addColorStop(1,'#7EC850');X.fillStyle=g;X.fillRect(0,0,W,H);
  }else if(type==='dark'){g.addColorStop(0,'#0d0520');g.addColorStop(0.5,'#1a0a2e');g.addColorStop(1,'#2d1b4e');X.fillStyle=g;X.fillRect(0,0,W,H);
  }else if(type==='castle'){g.addColorStop(0,'#E8D5F5');g.addColorStop(0.5,'#FFE4F0');g.addColorStop(1,'#D4C1EC');X.fillStyle=g;X.fillRect(0,0,W,H)}
}

function renderMap(){
  if(!mapData)return;
  const isDark=curMap==='laminne';
  // Background
  X.fillStyle=isDark?'#0d0520':'#4a8c28';X.fillRect(0,0,W,H);
  // Camera
  const camX=P.vx*T+T/2-W/2;
  const camY=P.vy*T+T/2-H/2.5;
  X.save();X.translate(-camX,-camY);
  // Draw tiles
  for(let y=0;y<mapData.h;y++)for(let x=0;x<mapData.w;x++){
    const tile=mapData.tiles[y][x];
    const cv=tileCanvas[tile];
    if(cv)X.drawImage(cv,x*T,y*T);
    // Tall grass animation
    if(tile===12){
      const sway=Math.sin(t*2+x*0.5+y*0.3)*2;
      X.fillStyle='rgba(90,158,58,0.4)';
      X.fillRect(x*T+T/2-4+sway,y*T+T-14,3,14);
      X.fillRect(x*T+T/2+4+sway,y*T+T-12,3,12);
    }
  }
  // NPCs
  mapData.npcs.forEach(n=>{
    // Check if should show
    if(n.cond){const ch=parseInt(n.cond.replace('ch',''));if(storyFlags.ch>ch+1)return}
    const nx=n.x*T,ny=n.y*T;
    const bob=Math.sin(t*2+n.x)*2;
    const sprMap={hk:'hk',kk:'kk',bk:'bk',ba:'ba',ch:'ch',hs:'hm',ts:'ts',rf:'rf',st:'st',li:'li',la:'la'};
    const img=n.spr?IM[sprMap[n.spr]]:null;
    if(img){
      const iw=Math.min(T-4,img.width*(T/img.height));
      X.drawImage(img,nx+T/2-iw/2,ny+bob-4,iw,T);
    } else {
      // Generic NPC marker
      X.fillStyle=isDark?'#6a3d7d':'#c9a96e';
      X.beginPath();X.arc(nx+T/2,ny+T/2+bob,T/3,0,Math.PI*2);X.fill();
      X.fillStyle='#fff';X.font=FN(8);X.textAlign='center';X.fillText(n.name[0],nx+T/2,ny+T/2+bob+3);
    }
    // Exclamation mark for interactable
    if(n.cond){const ch=parseInt(n.cond.replace('ch',''));
      if(storyFlags.ch===ch){X.fillStyle='#FFD700';X.font='bold '+FN(14);X.textAlign='center';X.fillText('!',nx+T/2,ny-8+Math.sin(t*3)*3)}}
  });
  // Player
  const px=P.vx*T,py=P.vy*T;
  X.save();X.translate(px+T/2,py+T/2);
  if(P.moving){X.translate(0,Math.sin(P.wf*Math.PI*4)*2);X.rotate(Math.sin(P.wf*Math.PI*2)*0.04)}
  if(P.dir==='left')X.scale(-1,1);
  // Shadow
  X.fillStyle='rgba(0,0,0,0.12)';X.beginPath();X.ellipse(0,T/2-2,T/3,4,0,0,Math.PI*2);X.fill();
  if(IM.rs){const rw=PW*0.7,rh=PH*0.7;X.drawImage(IM.rs,-rw/2,-rh/2-4,rw,rh)}
  X.restore();
  // Particles
  parts.forEach(p=>{X.globalAlpha=p.l;X.fillStyle=p.c;X.beginPath();X.arc(p.x,p.y,p.s*p.l,0,Math.PI*2);X.fill()});
  X.globalAlpha=1;
  X.restore();
  // HUD
  rr(X,8,8,220,32,12,'rgba(0,0,0,0.6)');
  X.fillStyle='#fff';X.font=FN(11);X.textAlign='left';
  const p0=party[0];
  if(p0)X.fillText(p0.ic+' '+p0.n+' Lv.'+p0.level+' HP'+Math.max(0,p0.hp)+'/'+p0.mhp,16,28);
  else X.fillText('🌸 이모션 왕국',16,28);
  // Hearts
  rr(X,W-80,8,72,32,12,'rgba(0,0,0,0.6)');
  X.fillStyle='#FF6B9D';X.fillText('💗x'+bag.hearts,W-72,28);
  // Party button
  rr(X,W-80,46,72,28,10,'rgba(0,0,0,0.5)');
  X.fillStyle='#fff';X.font=FN(10);X.textAlign='center';X.fillText('🎒 파티',W-44,64);
  btns=[{x:W-80,y:46,w:72,h:28,id:'party'}];
  // Dialog box
  if(dlg){
    rr(X,10,H-170,W-20,120,14,'rgba(0,0,0,0.88)','rgba(255,107,157,0.4)');
    X.fillStyle='#FFB8D4';X.font=FN(13);X.textAlign='left';
    X.fillText(dlg.name,24,H-148);
    X.fillStyle='#fff';X.font=FN(14);
    X.fillText(dlg.lines[dlg.idx],24,H-120);
    X.globalAlpha=0.3+Math.sin(Date.now()/300)*0.3;
    X.fillStyle='#fff';X.font=FN(11);X.textAlign='right';X.fillText('▼',W-24,H-60);
    X.globalAlpha=1;
  }
  // Touch controls
  if(!dlg&&!menuOpen){
    const cx=65,cy=H-75;
    [['up',cx,cy-32],['down',cx,cy+32],['left',cx-32,cy],['right',cx+32,cy]].forEach(([d,bx,by])=>{
      X.fillStyle='rgba(255,255,255,0.15)';X.beginPath();X.arc(bx,by,18,0,Math.PI*2);X.fill();
      X.fillStyle='#fff';X.font=FN(12);X.textAlign='center';
      X.fillText({up:'▲',down:'▼',left:'◀',right:'▶'}[d],bx,by+4)});
    // A button
    X.fillStyle='rgba(255,107,157,0.25)';X.beginPath();X.arc(W-55,H-75,24,0,Math.PI*2);X.fill();
    X.fillStyle='#fff';X.font='bold '+FN(14);X.textAlign='center';X.fillText('A',W-55,H-69);
  }
  // Party panel
  if(menuOpen){
    rr(X,20,60,W-40,H-120,16,'rgba(0,0,0,0.92)','rgba(255,107,157,0.3)');
    X.fillStyle='#FFB8D4';X.font='bold '+FN(18);X.textAlign='center';X.fillText('🎒 파티',W/2,90);
    party.forEach((p,i)=>{
      const y=110+i*70;
      rr(X,30,y,W-60,60,10,'rgba(255,255,255,0.06)','rgba(255,255,255,0.08)');
      const sMap={hatchu:'hs',baro:'ba',chacha:'ch',kkong:'kk'};
      const img=IM[sMap[p.key]];
      if(img)X.drawImage(img,40,y+5,45,45);
      X.fillStyle='#fff';X.font=FN(13);X.textAlign='left';
      X.fillText(p.ic+' '+p.n+(i===0?' (리더)':''),95,y+20);
      X.fillStyle='rgba(255,255,255,0.6)';X.font=FN(10);
      X.fillText('Lv.'+p.level+' HP'+Math.max(0,p.hp)+'/'+p.mhp+' ATK'+p.a+' DEF'+p.d,95,y+40);
    });
    rr(X,W/2-40,H-80,80,32,14,'#FF6B9D');
    X.fillStyle='#fff';X.font=FN(13);X.textAlign='center';X.fillText('닫기',W/2,H-60);
    btns.push({x:W/2-40,y:H-80,w:80,h:32,id:'closeMenu'});
  }
}

function renderBattle(){
  if(!bat)return;
  const isDark=bat.en.type==='dark';
  // Background
  const g=X.createLinearGradient(0,0,0,H*0.55);
  if(isDark){g.addColorStop(0,'#0d0520');g.addColorStop(1,'#2d1b4e')}
  else{g.addColorStop(0,'#87CEEB');g.addColorStop(1,'#B5EAD7')}
  X.fillStyle=g;X.fillRect(0,0,W,H*0.55);
  // Battle floor
  X.fillStyle=isDark?'#1a0a2e':'#7EC850';
  X.fillRect(0,H*0.42,W,H*0.13);
  // Enemy
  const enSprMap={hatchu:'hm',baro:'ba',chacha:'ch',kkong:'kk',trup:'ts',trup_minion:null};
  const enImg=IM[enSprMap[bat.en.key]];
  if(enImg){
    const bob=Math.sin(bat.anim*3)*5;
    const shake=bat.enShake>0?Math.sin(bat.enShake)*5:0;
    X.globalAlpha=bat.en.hp<=0?0.3:1;
    const ew=enImg.width*(80/enImg.height);
    X.drawImage(enImg,290-ew/2+shake,80+bob,ew,80);
    X.globalAlpha=1;
  } else {
    // Generic enemy
    X.fillStyle='#4A148C';X.beginPath();X.arc(290,120+Math.sin(bat.anim*3)*5,25,0,Math.PI*2);X.fill();
    X.fillStyle='#fff';X.font=FN(16);X.textAlign='center';X.fillText(bat.en.ic,290,125);
  }
  // My character
  const myImg=IM.hs||IM.rs;
  if(myImg){
    const shake=bat.myShake>0?Math.sin(bat.myShake)*5:0;
    X.globalAlpha=bat.my.hp<=0?0.3:1;
    const mw=myImg.width*(90/myImg.height);
    X.drawImage(myImg,100-mw/2+shake,200,mw,90);
    X.globalAlpha=1;
  }
  // Damage numbers
  bat.dmgNums.forEach(d=>{
    if(d.t>0){X.globalAlpha=clamp(d.t/20,0,1);
      X.fillStyle=d.heal?'#44ff88':'#ff4444';X.font='bold '+FN(20);X.textAlign='center';
      X.fillText((d.heal?'+':'-')+d.v,d.x,d.y-(40-d.t)*1.5);X.globalAlpha=1}
  });
  // Catching overlay
  if(bat.catching){
    X.fillStyle='rgba(0,0,0,0.6)';X.fillRect(0,0,W,H*0.55);
    heart(X,W/2,H*0.25,20,'#FF6B9D');
    X.fillStyle='#fff';X.font='bold '+FN(16);X.textAlign='center';X.fillText(bat.catching,W/2,H*0.25+40);
  }
  // UI
  X.fillStyle='#1a0a2e';X.fillRect(0,H*0.55,W,H*0.45);
  // HP bars
  const by=H*0.56;
  [{p:bat.en,x:10,l:'적'},{p:bat.my,x:W/2+5,l:'나'}].forEach(({p,x})=>{
    const bw=W/2-15;
    rr(X,x,by,bw,55,10,'rgba(255,255,255,0.06)','rgba(255,255,255,0.08)');
    X.fillStyle='#fff';X.font=FN(12);X.textAlign='left';X.fillText(p.ic+' '+p.n,x+8,by+16);
    X.fillStyle='rgba(255,255,255,0.4)';X.font=FN(10);X.fillText('Lv.'+p.level,x+bw-38,by+16);
    const hp=clamp(p.hp/p.mhp*100,0,100);
    rr(X,x+8,by+22,(bw-16),7,3,'rgba(255,255,255,0.1)');
    if(hp>0)rr(X,x+8,by+22,(bw-16)*hp/100,7,3,hp<25?'#ef4444':'#4ade80');
    X.fillStyle='rgba(255,255,255,0.35)';X.font=FN(9);X.fillText(Math.max(0,p.hp)+'/'+p.mhp,x+8,by+42);
  });
  // Log
  rr(X,10,by+60,W-20,26,8,'rgba(0,0,0,0.4)');
  X.fillStyle='rgba(255,255,255,0.8)';X.font=FN(11);X.textAlign='left';X.fillText(bat.log,18,by+78);
  // Actions
  const ay=by+94;
  btns=[];
  if(!bat.over&&!bat.catching){
    if(bat.phase==='skill'){
      bat.my.sk.forEach((sk,i)=>{
        const sy=ay+i*34;
        rr(X,10,sy,W-20,30,8,'rgba(255,255,255,0.06)','rgba(255,255,255,0.08)');
        X.fillStyle='#fff';X.font=FN(11);X.textAlign='left';
        X.fillText(sk.n+' ('+(sk.pw<0?'회복'+Math.abs(sk.pw):sk.tp==='shield'?'방어↑':'위력'+sk.pw)+')',20,sy+20);
        btns.push({x:10,y:sy,w:W-20,h:30,id:'sk'+i});
      });
      const backY=ay+bat.my.sk.length*34;
      rr(X,10,backY,W-20,28,8,null,'rgba(255,255,255,0.06)');
      X.fillStyle='rgba(255,255,255,0.5)';X.font=FN(10);X.textAlign='center';X.fillText('← 뒤로',W/2,backY+18);
      btns.push({x:10,y:backY,w:W-20,h:28,id:'back'});
    } else {
      const actions=[['⚔️ 공격','attack'],['✨ 스킬','skill'],['💗 포획','capture'],['🏃 도망','run']];
      actions.forEach(([label,id],i)=>{
        const bx=10+(i%2)*(W/2),bby=ay+Math.floor(i/2)*38;
        const bw=W/2-15;
        rr(X,bx,bby,bw,34,10,'rgba(255,255,255,0.06)','rgba(255,255,255,0.08)');
        X.globalAlpha=bat.turn==='player'?1:0.4;
        X.fillStyle='#fff';X.font='bold '+FN(12);X.textAlign='center';X.fillText(label,bx+bw/2,bby+22);
        X.globalAlpha=1;
        btns.push({x:bx,y:bby,w:bw,h:34,id});
      });
    }
  }
  if(bat.over&&!bat.catching){
    rr(X,W/2-80,H*0.3,160,80,16,'rgba(0,0,0,0.88)','#FF6B9D');
    X.fillStyle='#FFD644';X.font='bold '+FN(16);X.textAlign='center';
    X.fillText(bat.isBoss?'🏆 클리어!':'🎉 승리!',W/2,H*0.3+30);
    X.fillStyle='rgba(255,255,255,0.7)';X.font=FN(11);X.fillText(bat.log,W/2,H*0.3+55);
    btns.push({x:W/2-50,y:H*0.3+60,w:100,h:28,id:'batEnd'});
    rr(X,W/2-50,H*0.3+60,100,28,12,'#FF6B9D');
    X.fillStyle='#fff';X.font=FN(12);X.fillText('확인',W/2,H*0.3+78);
  }
}

function render(){
  X.clearRect(0,0,W,H);
  if(scr==='title'){
    drawBG('sunset');
    const hs=1+Math.sin(t*3)*0.06;X.save();X.translate(W/2,150);X.scale(hs,hs);heart(X,0,0,42,'#FF6B9D');X.restore();
    X.fillStyle='#E84B7A';X.font='bold '+FN(28);X.textAlign='center';X.fillText('사랑의 하츄핑',W/2,238);
    X.fillStyle='#9D6BA0';X.font=FN(14);X.fillText('티니핑 RPG',W/2,262);
    if(IM.rp){const im=IM.rp;X.drawImage(im,40,320+Math.sin(t*1.5)*6,im.width*(230/im.height),230)}
    if(IM.hp){const im=IM.hp;X.drawImage(im,W/2+20,400+Math.sin(t*1.5+1)*6,im.width*(140/im.height),140)}
    btns=[{x:W/2-80,y:600,w:160,h:50,id:'start'}];
    rr(X,btns[0].x,btns[0].y,160,50,25,'#FF6B9D');
    X.fillStyle='#fff';X.font='bold '+FN(20);X.fillText('모험 시작!',W/2,632);
  }
  else if(scr==='story'){
    const s=stQ[stI];if(!s)return;
    drawBG(s.bg||'sunset');
    if(s.img&&IM[s.img]){const im=IM[s.img];const ih=Math.min(im.height,180);const iw=im.width*(ih/im.height);X.drawImage(im,W/2-iw/2,H*0.38-ih/2,iw,ih)}
    const dg=X.createLinearGradient(0,H*0.68,0,H);dg.addColorStop(0,'transparent');dg.addColorStop(0.1,'rgba(0,0,0,0.8)');dg.addColorStop(1,'rgba(0,0,0,0.95)');
    X.fillStyle=dg;X.fillRect(0,H*0.64,W,H*0.36);
    if(s.sp){rr(X,16,H*0.71,Math.max(80,s.sp.length*11+18),24,10,'rgba(255,107,157,0.3)','rgba(255,107,157,0.5)');
      X.fillStyle='#FFB8D4';X.font=FN(12);X.textAlign='left';X.fillText(s.sp,26,H*0.71+17)}
    X.fillStyle='#fff';X.font=FN(14);X.textAlign='left';
    stTx.split('\n').forEach((l,i)=>X.fillText(l,20,H*0.71+(s.sp?36:14)+i*24));
    if(stDn){X.globalAlpha=0.3+Math.sin(Date.now()/300)*0.3;X.fillStyle='#fff';X.font=FN(11);X.textAlign='right';X.fillText('▼ 터치',W-16,H-14);X.globalAlpha=1}
    btns=[];
  }
  else if(scr==='map'){renderMap()}
  else if(scr==='battle'){renderBattle()}
  else if(scr==='ending'){
    drawBG('sunset');heart(X,W/2,100,38,'#FF6B9D');
    X.fillStyle='#E84B7A';X.font='bold '+FN(26);X.textAlign='center';X.fillText('사랑의 하츄핑',W/2,180);
    X.fillStyle='#9D6BA0';X.font=FN(13);
    ['로미와 하츄핑의 모험은','영원히 계속됩니다...'].forEach((l,i)=>X.fillText(l,W/2,220+i*24));
    if(IM.rp)X.drawImage(IM.rp,30,300+Math.sin(t*1.5)*5,IM.rp.width*(220/IM.rp.height),220);
    if(IM.hp)X.drawImage(IM.hp,W/2+30,380+Math.sin(t*1.5+1)*5,IM.hp.width*(130/IM.hp.height),130);
    X.fillStyle='#E84B7A';X.font='bold '+FN(18);X.fillText('🌟 게임 클리어! 🌟',W/2,570);
    X.fillStyle='#9D6BA0';X.font=FN(11);X.fillText('파티: '+party.map(p=>p.ic+p.n).join(', '),W/2,600);
    btns=[{x:W/2-55,y:630,w:110,h:38,id:'restart'}];
    rr(X,btns[0].x,btns[0].y,110,38,16,'#E84B7A');X.fillStyle='#fff';X.font=FN(14);X.fillText('다시 하기',W/2,654);
  }
  if(trA>0){X.fillStyle=`rgba(0,0,0,${trA})`;X.fillRect(0,0,W,H)}
}

// ===== INPUT =====
document.addEventListener('keydown',e=>{
  keys[e.key]=true;
  if(scr==='story'&&(e.key===' '||e.key==='Enter'))advSt();
  if(scr==='map'&&dlg&&(e.key===' '||e.key==='Enter')){advDlg();keys[' ']=false;keys.Enter=false}
});
document.addEventListener('keyup',e=>{keys[e.key]=false});

function gp(e){const r=C.getBoundingClientRect();const t2=e.changedTouches?e.changedTouches[0]:e;return{x:(t2.clientX-r.left)*(W/r.width),y:(t2.clientY-r.top)*(H/r.height)}}
function inR(p,r){return p.x>=r.x&&p.x<=r.x+r.w&&p.y>=r.y&&p.y<=r.y+r.h}
function inC(p,cx,cy,r){return(p.x-cx)**2+(p.y-cy)**2<=r*r}

function onDown(e){
  e.preventDefault();const p=gp(e);if(trA>0.3)return;
  // Check buttons
  btns.forEach(b=>{
    if(!inR(p,b))return;
    if(b.id==='start'){
      party=[mkCh('hatchu',5)]; // Start with Romi using 하츄핑 temporarily for battle
      // Actually Romi doesn't fight, 하츄핑 joins later. Use a starter.
      party=[];storyFlags={ch:0};bag={hearts:5};
      goStory([
        {bg:'castle',img:null,sp:'',tx:'🌸 이모션 왕국 🌸\n\n핑크빛 장미 꽃잎이 하늘을 날아\n성 안 로미 공주의 손 위에 내려앉았어요.'},
        {bg:'castle',img:'rf',sp:'시녀 👩',tx:'공주님, 일어나세요~!\n오늘은 아주 중요한 날이에요!'},
        {bg:'castle',img:'rf',sp:'로미 💖',tx:'오늘은... 맞다!\n내 짝꿍 티니핑을 찾는 날!'},
      ],()=>enterMap('castle_room',2,3));
    }
    if(b.id==='restart')location.reload();
    if(b.id==='party'){menuOpen=true}
    if(b.id==='closeMenu'){menuOpen=false}
    if(b.id==='batEnd'){batEnd()}
    // Battle actions
    if(b.id==='attack')batAction('attack');
    if(b.id==='skill')batAction('skill');
    if(b.id==='capture')batAction('capture');
    if(b.id==='run')batAction('run');
    if(b.id==='back'){bat.phase='select'}
    if(b.id&&b.id.startsWith('sk'))useSkill(parseInt(b.id.slice(2)));
  });
  // Story advance
  if(scr==='story')advSt();
  // Map dialog
  if(scr==='map'&&dlg){advDlg();return}
  // Map touch controls
  if(scr==='map'&&!dlg&&!menuOpen){
    const cx=65,cy=H-75;
    if(inC(p,cx,cy-32,22))tU=true;
    if(inC(p,cx,cy+32,22))tDn=true;
    if(inC(p,cx-32,cy,22))tL=true;
    if(inC(p,cx+32,cy,22))tR=true;
    if(inC(p,W-55,H-75,28)){tA=true;interact()}
  }
}
function onUp(e){e.preventDefault();tL=false;tR=false;tU=false;tDn=false;tA=false}
function onMove(e){e.preventDefault();if(scr!=='map')return;
  tL=false;tR=false;tU=false;tDn=false;
  const cx=65,cy=H-75;
  for(const t2 of(e.touches||[e])){const r=C.getBoundingClientRect();
    const p={x:(t2.clientX-r.left)*(W/r.width),y:(t2.clientY-r.top)*(H/r.height)};
    if(inC(p,cx,cy-32,22))tU=true;if(inC(p,cx,cy+32,22))tDn=true;
    if(inC(p,cx-32,cy,22))tL=true;if(inC(p,cx+32,cy,22))tR=true;}}
C.addEventListener('mousedown',onDown);C.addEventListener('mouseup',onUp);
C.addEventListener('touchstart',onDown,{passive:false});C.addEventListener('touchend',onUp,{passive:false});
C.addEventListener('touchmove',onMove,{passive:false});

// ===== INIT =====
function loop(){update();render();requestAnimationFrame(loop)}
function wait(){if(iL<iT){X.fillStyle='#1a0a2e';X.fillRect(0,0,W,H);X.fillStyle='#FF6B9D';X.font=FN(16);X.textAlign='center';
  X.fillText('로딩 중...',W/2,H/2);rr(X,W/4,H/2+20,W/2,8,4,'rgba(255,255,255,0.1)');
  rr(X,W/4,H/2+20,W/2*(iL/iT),8,4,'#FF6B9D');requestAnimationFrame(wait)}
  else{genTiles();requestAnimationFrame(loop)}}
wait();
</script></body></html>'''

with open(out, "w", encoding="utf-8") as f:
    f.write(html)
print(f"Built: {os.path.getsize(out)//1024}KB")

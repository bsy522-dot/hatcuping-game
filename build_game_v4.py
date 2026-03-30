"""Build hatcuping game v4 - full story, mini-games, RPG segments."""
import os

sd = r"D:\AI\게임\sprites"
out = r"D:\AI\게임\hatcuping-game.html"

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
<title>사랑의 하츄핑</title>
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
const IM={};let iL=0,iT=0;
function lI(n,s){iT++;const i=new Image();i.onload=()=>{iL++;IM[n]=i};i.onerror=()=>iL++;i.src=s}
lI('rs',ROMI_S);lI('rp',ROMI_P);lI('rf',ROMI_F);
lI('hs',HATCHU_S);lI('hp',HATCHU_P);lI('hf',HATCHU_F);lI('h2',HATCHU2_S);
lI('ts',TRUP_S);lI('tp',TRUP_P);lI('ba',BARO_S);lI('ch',CHACHA_S);
lI('hk',HK_F);lI('kk',KKONG_S);lI('kp',KKONG_P);lI('bk',BUKKU_S);lI('bp',BUKKU_P);

// ===== HELPERS =====
function heart(c,x,y,s,col){c.save();c.translate(x,y);c.scale(s/16,s/16);c.fillStyle=col;c.beginPath();c.moveTo(0,-4);c.bezierCurveTo(-8,-14,-18,-4,-8,4);c.lineTo(0,12);c.moveTo(0,-4);c.bezierCurveTo(8,-14,18,-4,8,4);c.lineTo(0,12);c.fill();c.restore()}
function rr(c,x,y,w,h,r,f,s){c.beginPath();c.moveTo(x+r,y);c.lineTo(x+w-r,y);c.quadraticCurveTo(x+w,y,x+w,y+r);c.lineTo(x+w,y+h-r);c.quadraticCurveTo(x+w,y+h,x+w-r,y+h);c.lineTo(x+r,y+h);c.quadraticCurveTo(x,y+h,x,y+h-r);c.lineTo(x,y+r);c.quadraticCurveTo(x,y,x+r,y);c.closePath();if(f){c.fillStyle=f;c.fill()}if(s){c.strokeStyle=s;c.lineWidth=2;c.stroke()}}
function rng(a,b){return Math.floor(Math.random()*(b-a+1))+a}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}

// ===== STATE =====
let scr='title',t=0,ticks=0;
let lv=0,lives=5,hts=0;
// Player (platformer)
const P={x:0,y:0,vx:0,vy:0,gr:false,face:1,dead:false};
const PW=38,PH=88,GR=0.5,JMP=-11.5,SPD=4.2,MXF=11;
let camX=0,parts=[],enemies_l=[],items_l=[],npcs_l=[];
let boss={hp:0,mx:0,x:0,y:0,dir:1,active:false};
let hatchuShield=true; // 하츄핑이 한번 대신 맞아줌 (요시 탄 것처럼)
let npcMsg='',npcT=0,lvDone=false,lvDoneT=0;
// Story
let stQ=[],stI=0,stTx='',stDn=false,stTm=null,stCb=null;
// Transition
let trA=0,trD=0,trNx=null;
// Touch
let tL=false,tR=false,tJ=false;
const keys={};
// Dodge minigame
let dodge={px:W/2,ices:[],timer:0,hits:0,done:false};
// Race minigame
let race={taps:0,need:40,timer:0,romiX:0,ajX:0,done:false,won:false};
// RPG walk
let rpg={px:0,py:0,targetX:0,dir:1,done:false};
// Buttons
let btns=[];

// Pre-calc library books (fix flickering!)
const libBooks=[];
for(let i=0;i<6;i++)for(let j=0;j<8;j++){
  libBooks.push({x:30+i*70+rng(0,3),y:80+j*50,w:rng(8,14),h:40,
    c:['#E53935','#1E88E5','#43A047','#F9A825','#8E24AA','#FF7043'][(i+j)%6]})}

// ===== SCENE FLOW =====
// title → story_opening → story_festival → dodge_minigame → story_library → story_dad → play(castle) → rpg_walk → story_bus_meet → race_minigame → story_bus_ride → play(forest) → story_arrive → story_trust → story_boss_intro → play(dark+boss) → story_end → ending

function doTrans(s,cb){trD=1;trNx=()=>{scr=s;if(cb)cb();trD=-1}}

// ===== STORY =====
function goStory(arr,cb){stQ=arr;stI=0;stTx='';stDn=false;stCb=cb;doTrans('story',()=>typeSt())}
function typeSt(){const s=stQ[stI];if(!s)return;stTx='';stDn=false;let i=0;const tx=s.tx;
  clearInterval(stTm);stTm=setInterval(()=>{if(i<tx.length)stTx=tx.slice(0,++i);else{stDn=true;clearInterval(stTm)}},22)}
function advSt(){if(!stDn){clearInterval(stTm);stTx=stQ[stI].tx;stDn=true;return}
  stI++;if(stI<stQ.length)typeSt();else{clearInterval(stTm);if(stCb)stCb()}}

// ===== STORY DATA =====
const ST_OPEN=[
  {bg:'castle',img:null,sp:'',tx:'🌸 이모션 왕국 🌸\n\n핑크빛 장미 꽃잎이 하늘을 날아\n성 안 로미 공주의 손 위에 내려앉았어요.'},
  {bg:'castle',img:'rf',sp:'시녀 👩',tx:'공주님, 일어나세요~!\n오늘은 아주 중요한 날이에요!'},
  {bg:'castle',img:'rf',sp:'로미 💖',tx:'(하암~) 벌써 아침이야?\n오늘이... 맞다!\n내 짝꿍 티니핑을 찾는 날!'},
  {bg:'castle',img:'hk',sp:'하트킹 👑',tx:'로미야, 오늘은 네 열 살 생일이란다!\n운명의 짝꿍 티니핑을\n찾는 중요한 날이야!'},
  {bg:'castle',img:'rf',sp:'로미 💖',tx:'아빠! 두근두근해!\n내 소울메이트를 드디어 만나는 거야!'},
];
const ST_FEST=[
  {bg:'festival',img:null,sp:'',tx:'🎉 티니핑 축제 🎉\n\n수많은 티니핑이 광장에 모였어요!\n로미의 짝꿍을 찾아볼까요?'},
  {bg:'festival',img:'kp',sp:'집사 🎩',tx:'공주님, 이 아이는 꽁꽁핑이에요!\n얼음 마법을 쓰는 티니핑이죠!'},
  {bg:'festival',img:'kp',sp:'',tx:'꽁꽁핑이 자기 능력을 보여주려 하자...\n갑자기 엄청난 눈보라가 일어나\n주변이 모두 얼어붙기 시작했어요!'},
  {bg:'festival',img:'rf',sp:'로미 💖',tx:'으앗! 차가워~!\n눈보라를 피해야 해!'},
];
const ST_FEST2=[
  {bg:'festival',img:'rf',sp:'로미 💖',tx:'으... 꽁꽁핑은 눈보라가 너무 세!\n내 짝꿍은 아닌 것 같아...'},
  {bg:'festival',img:null,sp:'집사 🎩',tx:'그럼 딱풀핑은 어떠세요?'},
  {bg:'festival',img:'rf',sp:'로미 💖',tx:'딱풀핑이 리본 마법을 보여주었는데...\n사람들을 전부 묶어버렸어!\n이것도 아니야!'},
  {bg:'festival',img:'bp',sp:'집사 🎩',tx:'마지막으로 이 아이는 어떠세요?\n부끄핑이라고 합니다!'},
];
const ST_BUKKU=[
  {bg:'festival',img:'bp',sp:'',tx:'로미가 손을 내밀자...\n부끄핑은 로미의 눈도 제대로 못 맞추고\n새빨개진 얼굴로 후다닥 도망가 버렸어요!'},
  {bg:'festival',img:'rf',sp:'로미 💖',tx:'아... 부끄핑도 아니야...\n다 아니야!\n이 아이들은 내 소울메이트가 아니야!'},
];
const ST_LIB=[
  {bg:'library',img:null,sp:'',tx:'📚 왕실 도서관 📚\n\n실망한 로미는 마음을 달래러\n도서관으로 향했어요.'},
  {bg:'library',img:'rf',sp:'로미 💖',tx:'진짜 내 소울메이트는\n어디에 있는 걸까...?'},
  {bg:'library',img:'hp',sp:'',tx:'✨ 그 순간, 낡은 책에서\n신비로운 빛이 흘러나왔어요!\n\n책 속에 하츄핑의 모습이 나타났습니다!'},
  {bg:'sunset',img:'hp',sp:'로미 💖',tx:'이 아이야...!\n처음 본 순간 알 수 있었어!\n이 아이가 내 운명의 짝이야!'},
  {bg:'sunset',img:'rf',sp:'로미 💖',tx:'♪ 처음 본 순간 반해버렸어 ♪\n♪ 하츄핑, 넌 나의 소울메이트 ♪'},
];
const ST_DAD=[
  {bg:'castle',img:'hk',sp:'하트킹 👑',tx:'로미야, 하츄핑은\n라미엔느 왕국에 있단다.\n그곳은 트러핑의 저주가 내린 곳이야!'},
  {bg:'castle',img:'hk',sp:'하트킹 👑',tx:'너무 위험해!\n아빠로서 허락할 수 없단다!'},
  {bg:'castle',img:'rf',sp:'로미 💖',tx:'아빠... 미안해!\n하지만 하츄핑이 외로워하고 있어!\n느낄 수 있어! 꼭 가야만 해!'},
  {bg:'sunset',img:'rp',sp:'로미 💖',tx:'포기 안 해!\n직접 찾으러 갈 거야!\n\n(로미는 왕궁을 탈출하기로 결심!)'},
  {bg:'sunset',img:null,sp:'',tx:'🏃‍♀️ 왕궁을 탈출하라!\n\n방향키로 이동, 스페이스로 점프!\n하트를 모으며 성 밖으로!'},
];
const ST_ESCAPED=[
  {bg:'forest',img:'rf',sp:'로미 💖',tx:'후... 드디어 성 밖이다!\n이제 라미엔느로 가야 해!\n버스 정류장이 어디지...?'},
];
const ST_BUS_MEET=[
  {bg:'forest',img:null,sp:'버스 아저씨 🚌',tx:'어이구, 꼬마 아가씨!\n라미엔느로 간다고?\n거긴 위험한 곳인데...'},
  {bg:'forest',img:'rf',sp:'로미 💖',tx:'아저씨, 제발요!\n꼭 가야 해요!'},
  {bg:'forest',img:null,sp:'버스 아저씨 🚌',tx:'좋아! 그 눈빛이 진심이구나!\n달리기 대결에서 이기면\n특급버스를 불러줄게!'},
  {bg:'forest',img:null,sp:'',tx:'🏃 달리기 대결!\n\n화면을 빠르게 연타하세요!\n아저씨보다 빨리 달려야 합니다!'},
];
const ST_BUS_WIN=[
  {bg:'forest',img:null,sp:'버스 아저씨 🚌',tx:'이런, 내가 졌네!\n대단한 아가씨야!\n특급버스 출발~! 🚌💨'},
  {bg:'forest',img:'rf',sp:'로미 💖',tx:'감사합니다, 아저씨!\n하츄핑, 기다려! 지금 갈게!'},
  {bg:'forest',img:null,sp:'',tx:'🚌 특급버스를 타고\n라미엔느 왕국으로!\n\n(숲을 지나 라미엔느로 향합니다)'},
  {bg:'forest',img:null,sp:'',tx:'🌲 라미엔느로 가는 길\n\n방향키로 이동, 스페이스로 점프!\n숲 속 야생 티니핑을 조심하세요!'},
];
const ST_ARRIVE=[
  {bg:'dark',img:null,sp:'',tx:'🏰 라미엔느 왕국 🏰\n\n어둡고 으스스한 분위기...\n트러핑의 저주가 내린 곳이에요.'},
  {bg:'dark',img:'rf',sp:'로미 💖',tx:'여기가 라미엔느...\n무서워... 하지만 하츄핑을 위해서!'},
  {bg:'dark',img:'hf',sp:'??? 💗',tx:'...누구야?\n인간은 무서운 존재라고 들었어...\n가까이 오지 마!'},
  {bg:'sunset',img:'rf',sp:'로미 💖',tx:'하츄핑! 드디어 찾았어!\n나는 로미! 넌 내 소울메이트야!'},
  {bg:'sunset',img:'hf',sp:'하츄핑 💗',tx:'날 만나러...? 왜?\n트러핑이 인간은 배신한다고 했어...'},
];
const ST_TRUST=[
  {bg:'sunset',img:null,sp:'',tx:'로미는 포기하지 않았어요.\n종이비행기 쪽지를 날리고,\n그림을 그려주고, 매일 찾아갔어요.'},
  {bg:'sunset',img:'hf',sp:'하츄핑 💗',tx:'이 인간... 진심인 거야?\n마음이 따뜻해지는 느낌이야...'},
  {bg:'sunset',img:'hp',sp:'',tx:'💗 하츄핑의 마음이 열렸어요! 💗'},
];
const ST_BOSS=[
  {bg:'dark',img:'tp',sp:'트러핑 ⚡',tx:'크크크... 이 어리석은 인간!\n인간은 모두 배신자야!\n하츄핑은 내 거야!'},
  {bg:'dark',img:'rf',sp:'로미 💖',tx:'트러핑, 넌 배신당한 게 아니야!\n리암 왕자는 너를 버린 게 아니었어!'},
  {bg:'dark',img:'rf',sp:'로미 💖',tx:'하츄핑! 같이 힘을 합치자!\n사랑의 힘으로!\n\n(트러핑을 밟아서 물리치세요! x5)'},
];
const ST_END=[
  {bg:'sunset',img:'hf',sp:'하츄핑 💗',tx:'로미... 고마워!\n불 속에서 날 구해줬을 때\n네가 진심이란 걸 완전히 알았어!'},
  {bg:'sunset',img:null,sp:'',tx:'하츄핑의 눈물이 떨어지는 순간,\n트러핑의 모든 저주가 풀렸어요.\n\n트러핑도 리암 왕자와 다시 만나\n오해를 풀었습니다.'},
  {bg:'sunset',img:'hf',sp:'하츄핑 💗',tx:'싸우거나 속상한 일이 있어도\n화해하면 돼.\n로미와 함께 있으면 행복해!'},
  {bg:'sunset',img:null,sp:'',tx:'💗 사랑이 세상을 구했습니다 💗\n\n로미와 하츄핑은 진정한 짝꿍이 되어\n새로운 모험을 떠납니다...'},
];

// ===== LEVELS =====
const LEVELS=[
  {name:'왕궁 탈출',bg:'castle',sx:80,sy:430,endX:3800,
    plat:[[0,520,500,40,0],[520,520,500,40,0],[1040,520,500,40,0],[1560,520,500,40,0],[2080,520,500,40,0],[2600,520,500,40,0],[3120,520,500,40,0],[3640,520,300,40,0],
      [220,460,100,16,1],[380,420,100,16,1],[550,380,120,16,1],[780,450,100,16,1],[950,400,120,16,1],[1150,460,100,16,1],[1350,410,120,16,1],[1650,460,100,16,1],[1850,420,100,16,1],[2050,380,120,16,1],[2250,450,100,16,1],[2450,400,120,16,1],[2700,460,100,16,1],[2900,420,100,16,1],[3200,460,120,16,1],[3450,420,100,16,1]],
    items:[[270,430,0],[430,390,0],[610,350,0],[830,420,0],[1000,370,0],[1200,430,0],[1410,380,0],[1700,430,0],[1900,390,0],[2110,350,0],[2300,420,0],[2510,370,0],[2750,430,0],[2950,390,0],[3260,430,0],[3500,390,0]],
    enemies:[[400,490,0],[900,490,0],[1300,490,0],[1800,490,0],[2400,490,0],[2850,490,0],[3350,490,0]],npcs:[]},
  {name:'라미엔느로!',bg:'forest',sx:80,sy:430,endX:3600,
    plat:[[0,520,500,40,2],[520,520,500,40,2],[1040,520,500,40,2],[1560,520,500,40,2],[2080,520,500,40,2],[2600,520,500,40,2],[3120,520,600,40,2],
      [200,460,100,16,3],[400,420,120,16,3],[650,460,100,16,3],[850,410,100,16,3],[1100,460,120,16,3],[1350,420,100,16,3],[1600,460,100,16,3],[1800,410,120,16,3],[2050,460,100,16,3],[2300,420,100,16,3],[2550,460,120,16,3],[2800,420,100,16,3],[3050,460,100,16,3],[3300,410,120,16,3]],
    items:[[250,430,0],[460,390,0],[700,430,0],[900,380,0],[1160,430,0],[1400,390,0],[1650,430,0],[1860,380,0],[2100,430,0],[2350,390,0],[2610,430,0],[2850,390,0],[3100,430,0],[3360,380,0]],
    enemies:[[350,490,1],[750,490,1],[1200,490,1],[1700,490,1],[2200,490,1],[2700,490,1],[3150,490,1]],
    npcs:[[600,460,'ba','나는 바로핑!\n용기를 내!'],[1500,460,'ch','차차핑이다!\n화이팅!']]},
  {name:'라미엔느 성',bg:'dark',sx:80,sy:430,endX:3400,boss:true,
    plat:[[0,520,500,40,4],[520,520,500,40,4],[1040,520,500,40,4],[1560,520,500,40,4],[2080,520,500,40,4],[2600,520,500,40,4],[3120,520,400,40,4],
      [200,460,100,16,5],[400,410,120,16,5],[650,460,100,16,5],[900,420,100,16,5],[1150,460,120,16,5],[1400,410,100,16,5],[1650,460,100,16,5],[1900,420,120,16,5],[2150,460,100,16,5],[2400,410,100,16,5],[2650,460,120,16,5],[2900,420,100,16,5],[3100,460,120,16,5]],
    items:[[250,430,0],[460,380,0],[700,430,0],[950,390,0],[1210,430,0],[1450,380,0],[1700,430,0],[1960,390,0],[2200,430,0],[2450,380,0],[2710,430,0],[2950,390,0],[3160,430,0]],
    enemies:[[350,490,2],[800,490,2],[1250,490,2],[1750,490,2],[2300,490,2],[2750,490,2]],npcs:[]},
];

function initLv(i){const L=LEVELS[i];if(!L)return;
  P.x=L.sx;P.y=L.sy;P.vx=0;P.vy=0;P.gr=false;P.face=1;P.dead=false;camX=0;lvDone=false;lvDoneT=0;
  enemies_l=L.enemies.map(e=>[e[0],e[1],e[2],e[2]===0?1.2:e[2]===1?1:1.5,e[0]-40,e[0]+80,true]);
  items_l=L.items.map(it=>[it[0],it[1],it[2],true]);
  npcs_l=L.npcs?L.npcs.map(n=>({x:n[0],y:n[1],spr:n[2],dlg:n[3],done:false})):[];
  parts=[];npcMsg='';npcT=0;
  boss=L.boss?{hp:5,mx:5,x:L.endX-180,y:440,dir:1,active:true}:{active:false};
  if(L.boss)hatchuShield=true;
}

// ===== DODGE MINIGAME =====
function startDodge(cb){
  dodge={px:W/2,ices:[],frosts:[],timer:420,hits:0,done:false,cb,wave:0};
  doTrans('dodge');
}
function updateDodge(){
  if(dodge.done)return;
  dodge.timer--;dodge.wave+=0.05;
  // 꽁꽁핑 freezes the ground around her - frost patches spread outward
  if(dodge.timer%25===0){
    // Frost wave from 꽁꽁핑's position (center top)
    const cx=W/2+Math.sin(dodge.wave*3)*80;
    dodge.frosts.push({x:cx,y:100,vy:4+Math.random()*2,s:rng(20,35),t:60});
    // Also side frosts
    if(dodge.timer%50===0){
      dodge.frosts.push({x:rng(30,180),y:80,vy:3+Math.random()*2,s:rng(18,30),t:60});
      dodge.frosts.push({x:rng(W-180,W-30),y:80,vy:3+Math.random()*2,s:rng(18,30),t:60});
    }
  }
  // Icicles growing from ground
  if(dodge.timer%40===0){
    const ix=rng(30,W-30);
    dodge.ices.push({x:ix,y:565,h:0,maxH:rng(40,80),growing:true,t:90});
  }
  // Update frosts (falling ice blasts)
  dodge.frosts.forEach(f=>{f.y+=f.vy;f.t--});
  dodge.frosts=dodge.frosts.filter(f=>f.t>0&&f.y<600);
  // Update icicles (grow from ground)
  dodge.ices.forEach(ic=>{if(ic.growing){ic.h=Math.min(ic.h+2,ic.maxH);if(ic.h>=ic.maxH)ic.growing=false}ic.t--});
  dodge.ices=dodge.ices.filter(ic=>ic.t>0);
  // Move player
  if(keys.ArrowLeft||keys.a||tL)dodge.px=Math.max(25,dodge.px-5);
  if(keys.ArrowRight||keys.d||tR)dodge.px=Math.min(W-25,dodge.px+5);
  // Collision with frost blasts
  dodge.frosts.forEach(f=>{
    if(Math.abs(f.x-dodge.px)<(f.s/2+15)&&Math.abs(f.y-530)<30&&f.y>490){
      dodge.hits++;f.t=0;
      for(let i=0;i<4;i++)parts.push({x:dodge.px,y:530,vx:(Math.random()-0.5)*3,vy:-Math.random()*3,l:1,s:rng(3,6),c:'#90CAF9'});
    }
  });
  // Collision with icicles
  dodge.ices.forEach(ic=>{
    if(Math.abs(ic.x-dodge.px)<18&&ic.h>20){
      const iceTop=ic.y-ic.h;
      if(530>iceTop&&530<ic.y){dodge.hits++;ic.t=0;
        for(let i=0;i<4;i++)parts.push({x:ic.x,y:iceTop,vx:(Math.random()-0.5)*3,vy:-Math.random()*3,l:1,s:rng(3,6),c:'#B3E5FC'});}
    }
  });
  if(dodge.timer<=0){dodge.done=true;setTimeout(()=>{if(dodge.cb)dodge.cb()},1000)}
}

// ===== RACE MINIGAME =====
function startRace(cb){
  race={taps:0,need:35,timer:360,romiX:50,ajX:50,done:false,won:false,cb};
  doTrans('race');
}
function updateRace(){
  if(race.done)return;
  race.timer--;
  race.romiX=50+(race.taps/race.need)*250;
  race.ajX=50+(1-race.timer/360)*220;
  if(race.romiX>=300){race.done=true;race.won=true;setTimeout(()=>{if(race.cb)race.cb()},800)}
  if(race.timer<=0&&!race.done){race.done=true;race.won=true;setTimeout(()=>{if(race.cb)race.cb()},800)} // always win (easy)
}

// ===== RPG WALK =====
function startRPG(targetX,cb){
  rpg={px:60,py:380,targetX,dir:1,done:false,cb};
  doTrans('rpgwalk');
}
function updateRPG(){
  if(rpg.done)return;
  if(keys.ArrowRight||keys.d||tR){rpg.px+=3;rpg.dir=1}
  if(keys.ArrowLeft||keys.a||tL){rpg.px=Math.max(20,rpg.px-3);rpg.dir=-1}
  if(rpg.px>=rpg.targetX){rpg.done=true;setTimeout(()=>{if(rpg.cb)rpg.cb()},500)}
}

// ===== PLATFORMER UPDATE =====
function updatePlay(){
  if(P.dead)return;
  if(lvDone){if(lvDoneT>0){lvDoneT--;if(lvDoneT<=0)onClear()}return}
  const L=LEVELS[lv];if(!L)return;
  let mx=0;
  if(keys.ArrowLeft||keys.a||tL){mx=-1;P.face=-1}
  if(keys.ArrowRight||keys.d||tR){mx=1;P.face=1}
  P.vx=mx*SPD;
  if((keys.ArrowUp||keys.w||keys[' ']||tJ)&&P.gr){P.vy=JMP;P.gr=false}
  P.vy=Math.min(P.vy+GR,MXF);P.x+=P.vx;P.y+=P.vy;
  P.gr=false;
  for(const pl of L.plat){const[px,py,pw,ph]=pl;
    if(P.x+PW>px+3&&P.x<px+pw-3){
      if(P.vy>=0&&P.y+PH>=py&&P.y+PH-P.vy<=py+5){P.y=py-PH;P.vy=0;P.gr=true}
      if(P.vy<0&&P.y<=py+ph&&P.y-P.vy>=py+ph-3){P.y=py+ph;P.vy=0}}
    if(P.y+PH>py+3&&P.y<py+ph-3){
      if(P.vx>0&&P.x+PW>px&&P.x+PW-P.vx<=px+2)P.x=px-PW;
      if(P.vx<0&&P.x<px+pw&&P.x-P.vx>=px+pw-2)P.x=px+pw}}
  if(P.y>620){die();return}
  P.x=Math.max(0,P.x);
  camX+=(P.x-W/3-camX)*0.1;camX=clamp(camX,0,Math.max(0,L.endX-W+100));
  items_l.forEach(it=>{if(!it[3])return;
    if(Math.abs(P.x+PW/2-it[0])<28&&Math.abs(P.y+PH/2-it[1])<28){it[3]=false;hts++;
      for(let i=0;i<5;i++)parts.push({x:it[0],y:it[1],vx:(Math.random()-0.5)*4,vy:-Math.random()*3,l:1,s:rng(3,5),c:'#FF6B9D'})}});
  enemies_l.forEach(e=>{if(!e[6])return;e[0]+=e[3];if(e[0]<=e[4]||e[0]>=e[5])e[3]=-e[3];
    if(Math.abs(P.x+PW/2-e[0]-15)<28&&Math.abs(P.y+PH-e[1]-15)<28){
      if(P.vy>0&&P.y+PH<e[1]+10){e[6]=false;P.vy=JMP*0.6;hts+=2;
        for(let i=0;i<8;i++)parts.push({x:e[0]+15,y:e[1],vx:(Math.random()-0.5)*5,vy:-Math.random()*4,l:1,s:rng(3,7),c:'#FFD700'})}
      else die()}});
  npcs_l.forEach(n=>{if(n.done)return;
    if(Math.abs(P.x+PW/2-n.x)<50&&Math.abs(P.y+PH/2-n.y)<50){n.done=true;npcMsg=n.dlg;npcT=180}});
  if(npcT>0)npcT--;else npcMsg='';
  if(boss.active&&boss.hp>0){boss.x+=boss.dir*(1.5+((boss.mx-boss.hp)*0.3));
    if(boss.x<LEVELS[lv].endX-300||boss.x>LEVELS[lv].endX-80)boss.dir=-boss.dir;
    // Boss shoots dark orbs occasionally
    if(ticks%90===0&&boss.active){parts.push({x:boss.x+32,y:boss.y+20,vx:(P.x-boss.x)>0?3:-3,vy:0,l:2,s:10,c:'#7B1FA2',orb:true})}
    if(Math.abs(P.x+PW/2-boss.x-32)<45&&Math.abs(P.y+PH-boss.y-40)<45){
      if(P.vy>0&&P.y+PH<boss.y+15){boss.hp--;P.vy=JMP*0.7;
        for(let i=0;i<10;i++)parts.push({x:boss.x+32,y:boss.y,vx:(Math.random()-0.5)*6,vy:-Math.random()*5,l:1,s:rng(4,8),c:'#9C27B0'});
        if(boss.hp<=0){boss.active=false;lvDone=true;lvDoneT=90}}
      else{ // 피격! 하츄핑 실드 체크
        if(hatchuShield){hatchuShield=false;P.vy=JMP*0.5;P.x-=50;
          npcMsg='💔 하츄핑이 대신 맞았어!\n한 번 더 맞으면 처음부터!';npcT=150;
          for(let i=0;i<8;i++)parts.push({x:P.x+PW/2,y:P.y+PH/2,vx:(Math.random()-0.5)*4,vy:-Math.random()*3,l:1,s:rng(3,6),c:'#FF6B9D'})}
        else{// 두번째 피격 → 스테이지 처음으로 (목숨 안 깎음)
          npcMsg='😢 다시 도전!';npcT=100;
          for(let i=0;i<12;i++)parts.push({x:P.x+PW/2,y:P.y+PH/2,vx:(Math.random()-0.5)*5,vy:-Math.random()*4,l:1,s:rng(3,7),c:'#FF6B9D'});
          setTimeout(()=>{initLv(lv);scr='play'},800)}
      }}
    // Dark orb collision
    parts.forEach(p=>{if(!p.orb)return;
      if(Math.abs(P.x+PW/2-p.x)<20&&Math.abs(P.y+PH/2-p.y)<25){
        p.l=0;
        if(hatchuShield){hatchuShield=false;P.vy=JMP*0.3;
          npcMsg='💔 하츄핑이 대신 맞았어!';npcT=120;
          for(let i=0;i<6;i++)parts.push({x:P.x+PW/2,y:P.y+PH/2,vx:(Math.random()-0.5)*3,vy:-Math.random()*3,l:1,s:rng(3,5),c:'#FF6B9D'})}
        else{npcMsg='😢 다시 도전!';npcT=100;setTimeout(()=>{initLv(lv);scr='play'},800)}}})}
  if(!L.boss&&P.x>=L.endX-50){lvDone=true;lvDoneT=90}
  parts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=0.1;p.l-=0.025});parts=parts.filter(p=>p.l>0);
  if(P.gr&&Math.abs(P.vx)>1&&Math.random()<0.3)parts.push({x:P.x+PW/2,y:P.y+PH,vx:(Math.random()-0.5),vy:-Math.random()*0.8,l:0.4,s:rng(2,3),c:'rgba(150,140,120,0.4)'});
  if(lvDone&&lvDoneT>0){lvDoneT--;if(lvDoneT<=0)onClear()}
}
function die(){if(P.dead)return;P.dead=true;lives--;
  for(let i=0;i<12;i++)parts.push({x:P.x+PW/2,y:P.y+PH/2,vx:(Math.random()-0.5)*6,vy:-Math.random()*5-2,l:1,s:rng(3,7),c:'#FF6B9D'});
  setTimeout(()=>{if(lives<=0){lives=5;hts=0;lv=0;doTrans('title')}else{initLv(lv);scr='play'}},1200)}

function onClear(){
  if(lv===0){
    goStory(ST_ESCAPED,()=>startRPG(350,()=>goStory(ST_BUS_MEET,()=>startRace(()=>goStory(ST_BUS_WIN,()=>{lv=1;initLv(1);doTrans('play')})))));
  } else if(lv===1){
    goStory(ST_ARRIVE,()=>goStory(ST_TRUST,()=>goStory(ST_BOSS,()=>{lv=2;initLv(2);doTrans('play')})));
  } else if(lv===2){
    goStory(ST_END,()=>doTrans('ending'));
  }
}

// ===== MAIN UPDATE =====
function update(){
  t+=0.02;ticks++;
  if(trD>0){trA=Math.min(1,trA+0.05);if(trA>=1&&trNx){trNx();trNx=null}}
  if(trD<0){trA=Math.max(0,trA-0.05);if(trA<=0)trD=0}
  if(scr==='play')updatePlay();
  if(scr==='dodge')updateDodge();
  if(scr==='race')updateRace();
  if(scr==='rpgwalk')updateRPG();
}

// ===== BACKGROUNDS =====
function drawBG(type){
  const g=X.createLinearGradient(0,0,0,H);
  if(type==='castle'){g.addColorStop(0,'#E8D5F5');g.addColorStop(0.5,'#FFE4F0');g.addColorStop(1,'#D4C1EC');X.fillStyle=g;X.fillRect(0,0,W,H);
    X.fillStyle='#C8B6E2';for(let i=0;i<12;i++){const bx=(-(camX||0)*0.15+i*110)%W-50;X.fillRect(bx,80,30,H-80);X.fillStyle='#D4C1EC';X.fillRect(bx-4,75,38,12);X.fillStyle='#C8B6E2'}
    X.strokeStyle='#D4C1EC';X.lineWidth=6;for(let i=0;i<8;i++){const ax=(-(camX||0)*0.15+i*220+30)%W-50;X.beginPath();X.arc(ax+55,150,55,Math.PI,0);X.stroke()}
    X.fillStyle='rgba(135,206,235,0.25)';for(let i=0;i<6;i++){const wx=(-(camX||0)*0.15+i*220+55)%W-50;X.beginPath();X.arc(wx,155,20,Math.PI,0);X.fillRect(wx-20,155,40,30);X.fill()}
    X.fillStyle='rgba(200,50,80,0.12)';X.fillRect(0,490,W,70);
    X.fillStyle='#FFD700';for(let i=0;i<4;i++){const cx=(-(camX||0)*0.1+i*250+80)%W-50;X.beginPath();X.arc(cx,55,8,0,Math.PI*2);X.fill();X.fillStyle='rgba(255,215,0,0.08)';X.beginPath();X.arc(cx,55,25,0,Math.PI*2);X.fill();X.fillStyle='#FFD700'}
  }else if(type==='forest'||type==='festival'){g.addColorStop(0,'#87CEEB');g.addColorStop(0.4,'#B5EAD7');g.addColorStop(1,'#7EC850');X.fillStyle=g;X.fillRect(0,0,W,H);
    X.fillStyle='rgba(255,255,255,0.5)';for(let i=0;i<5;i++){const cx=(-(camX||0)*0.04+i*180+30)%(W+100)-50,cy=30+i*15;X.beginPath();X.arc(cx,cy,18,0,Math.PI*2);X.fill();X.beginPath();X.arc(cx+20,cy-5,14,0,Math.PI*2);X.fill();X.beginPath();X.arc(cx+35,cy+2,16,0,Math.PI*2);X.fill()}
    X.fillStyle='#81C784';X.beginPath();X.moveTo(0,360);for(let i=0;i<10;i++)X.lineTo((-(camX||0)*0.08+i*130)%(W+200)-100,260+Math.sin(i*1.3)*50);X.lineTo(W+50,360);X.lineTo(W+50,400);X.lineTo(-50,400);X.fill();
    for(let i=0;i<14;i++){const tx=(-(camX||0)*0.12+i*100+20)%(W+150)-50;X.fillStyle='#5D4037';X.fillRect(tx-3,370,6,35);X.fillStyle='#2E7D32';X.beginPath();X.arc(tx,365,16,0,Math.PI*2);X.fill()}
    if(type==='festival'){for(let i=0;i<8;i++){const fx=50+i*50;X.fillStyle=['#FF6B9D','#FFD700','#64B5F6','#FF8A65'][i%4];X.fillRect(fx,120,4,35);X.beginPath();X.moveTo(fx-6,120);X.lineTo(fx+2,108);X.lineTo(fx+10,120);X.fill()}}
  }else if(type==='dark'){g.addColorStop(0,'#0d0520');g.addColorStop(0.5,'#1a0a2e');g.addColorStop(1,'#2d1b4e');X.fillStyle=g;X.fillRect(0,0,W,H);
    if(Math.random()<0.004){X.fillStyle='rgba(180,140,255,0.08)';X.fillRect(0,0,W,H)}
    X.fillStyle='#150830';for(let i=0;i<10;i++){const px=(-(camX||0)*0.15+i*120)%(W+100)-50;X.fillRect(px,80,25,H-80)}
  }else if(type==='sunset'){g.addColorStop(0,'#FF9A8B');g.addColorStop(0.35,'#FF6B9D');g.addColorStop(0.7,'#FFB8D4');g.addColorStop(1,'#FFDEE9');X.fillStyle=g;X.fillRect(0,0,W,H);
    for(let i=0;i<8;i++){X.globalAlpha=0.12+Math.sin(t+i)*0.06;heart(X,Math.sin(t*0.4+i*1.2)*160+W/2,70+i*65,8+i*2,'#FF6B9D')}X.globalAlpha=1;
  }else if(type==='library'){
    X.fillStyle='#5D4037';X.fillRect(0,0,W,H);
    // Fixed bookshelves (no flickering!)
    for(let i=0;i<6;i++){X.fillStyle='#4E342E';X.fillRect(30+i*70,60,55,H-120)}
    libBooks.forEach(b=>{X.fillStyle=b.c;X.fillRect(b.x,b.y,b.w,b.h)});
    X.fillStyle='rgba(255,200,100,0.06)';X.beginPath();X.arc(W/2,H/2,200,0,Math.PI*2);X.fill();
    X.fillStyle='rgba(255,215,0,0.12)';X.beginPath();X.arc(W/2,H*0.5,70,0,Math.PI*2);X.fill();
  }
}

// ===== RENDER =====
function drawPlat(pl){const[px,py,pw,ph,tp]=pl;const sx=px-camX;if(sx+pw<-10||sx>W+10)return;
  const cols=[[0,'#9988AA','#AA99BB'],[1,'#8899AA','#99AABB'],[2,'#5D8A30','#6EB844'],[3,'#8B6914','#A0792C'],[4,'#1a0a2e','#2a1540'],[5,'#3a2050','#4a2860']];
  const c=cols[tp]||cols[0];X.fillStyle=c[1];X.fillRect(sx,py,pw,ph);X.fillStyle=c[2];X.fillRect(sx,py,pw,4);
  if(tp===2){X.fillStyle='#7EC850';for(let i=0;i<pw;i+=7)X.fillRect(sx+i,py-2,2,4)}}

function drawPlayer(){if(P.dead)X.globalAlpha=0.3;
  const sx=P.x-camX,sy=P.y,img=IM.rs;if(!img){X.globalAlpha=1;return}
  X.save();X.translate(sx+PW/2,sy+PH/2);if(P.face<0)X.scale(-1,1);
  if(P.gr&&Math.abs(P.vx)>1){X.translate(0,Math.sin(Date.now()/80)*3);X.rotate(Math.sin(Date.now()/120)*0.04)}
  if(!P.gr)X.rotate(clamp(P.vy*0.015,-0.2,0.2)*P.face);
  X.drawImage(img,-PW/2,-PH/2,PW,PH);X.restore();X.globalAlpha=1;
  if(P.gr){X.fillStyle='rgba(0,0,0,0.12)';X.beginPath();X.ellipse(sx+PW/2,P.y+PH+2,PW/2+2,4,0,0,Math.PI*2);X.fill()}}

function drawEnemy(e){if(!e[6])return;const sx=e[0]-camX,sy=e[1];if(sx<-40||sx>W+40)return;
  const tp=e[2],bob=Math.sin(Date.now()/300+e[0])*3;
  if(tp===0){X.fillStyle='#776688';X.fillRect(sx+2,sy,26,28);X.fillStyle='#9988AA';X.fillRect(sx+4,sy-5,22,8);
    X.fillStyle='#fff';X.beginPath();X.arc(sx+10,sy+10,3,0,Math.PI*2);X.fill();X.beginPath();X.arc(sx+20,sy+10,3,0,Math.PI*2);X.fill();
    X.fillStyle='#222';X.beginPath();X.arc(sx+10,sy+10,1.5,0,Math.PI*2);X.fill();X.beginPath();X.arc(sx+20,sy+10,1.5,0,Math.PI*2);X.fill();
    X.fillStyle='#AAA';X.fillRect(sx+28,sy-10,3,40);
  }else if(tp===1){X.fillStyle='#66BB6A';X.beginPath();X.ellipse(sx+15,sy+15+bob,16,14,0,0,Math.PI*2);X.fill();
    X.fillStyle='#81C784';X.beginPath();X.ellipse(sx+15,sy+10+bob,11,9,0,0,Math.PI*2);X.fill();
    X.fillStyle='#fff';X.beginPath();X.arc(sx+10,sy+10+bob,3.5,0,Math.PI*2);X.fill();X.beginPath();X.arc(sx+20,sy+10+bob,3.5,0,Math.PI*2);X.fill();
    X.fillStyle='#333';X.beginPath();X.arc(sx+11,sy+10+bob,1.8,0,Math.PI*2);X.fill();X.beginPath();X.arc(sx+21,sy+10+bob,1.8,0,Math.PI*2);X.fill();
  }else{X.fillStyle='#4A148C';X.beginPath();X.ellipse(sx+15,sy+15+bob,16,14,0,0,Math.PI*2);X.fill();
    X.fillStyle='#7B1FA2';X.beginPath();X.ellipse(sx+15,sy+10+bob,11,9,0,0,Math.PI*2);X.fill();
    X.fillStyle='#FF0040';X.beginPath();X.arc(sx+10,sy+10+bob,3,0,Math.PI*2);X.fill();X.beginPath();X.arc(sx+20,sy+10+bob,3,0,Math.PI*2);X.fill();
    X.fillStyle='#6A1B9A';X.beginPath();X.moveTo(sx+6,sy+2+bob);X.lineTo(sx+3,sy-8+bob);X.lineTo(sx+12,sy+4+bob);X.fill();
    X.beginPath();X.moveTo(sx+24,sy+2+bob);X.lineTo(sx+27,sy-8+bob);X.lineTo(sx+18,sy+4+bob);X.fill()}}

function render(){
  X.clearRect(0,0,W,H);

  if(scr==='title'){
    drawBG('sunset');
    const hs=1+Math.sin(t*3)*0.06;X.save();X.translate(W/2,160);X.scale(hs,hs);heart(X,0,0,42,'#FF6B9D');X.restore();
    X.fillStyle='#E84B7A';X.font='bold '+FN(28);X.textAlign='center';X.fillText('사랑의 하츄핑',W/2,248);
    X.fillStyle='#9D6BA0';X.font=FN(14);X.fillText('탈출 어드벤처',W/2,272);
    if(IM.rp){const im=IM.rp;X.drawImage(im,40,350+Math.sin(t*1.5)*6,im.width*(250/im.height),250)}
    if(IM.hp){const im=IM.hp;X.drawImage(im,W/2+20,420+Math.sin(t*1.5+1)*6,im.width*(150/im.height),150)}
    btns=[{x:W/2-80,y:620,w:160,h:50,id:'start'}];
    rr(X,btns[0].x,btns[0].y,160,50,25,'#FF6B9D');
    X.fillStyle='#fff';X.font='bold '+FN(20);X.fillText('모험 시작! 💫',W/2,652);
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
    if(!stDn){X.fillStyle='rgba(255,255,255,0.5)';X.font=FN(14);const ls=stTx.split('\n');X.fillText('|',20+X.measureText(ls[ls.length-1]).width,H*0.71+(s.sp?36:14)+(ls.length-1)*24)}
    if(stDn){X.globalAlpha=0.3+Math.sin(Date.now()/300)*0.3;X.fillStyle='#fff';X.font=FN(12);X.textAlign='right';X.fillText('▼ 터치하여 계속',W-16,H-14);X.globalAlpha=1}
    btns=[];
  }

  else if(scr==='dodge'){
    drawBG('festival');
    // Ground (freezing over!)
    const frostPct=1-dodge.timer/420;
    X.fillStyle='#5D8A30';X.fillRect(0,565,W,45);X.fillStyle='#6EB844';X.fillRect(0,565,W,5);
    // Frost spreading on ground
    X.fillStyle=`rgba(180,220,255,${frostPct*0.5})`;X.fillRect(0,565,W,45);
    // Frost sparkles on ground
    for(let i=0;i<8;i++){X.fillStyle=`rgba(200,230,255,${0.3+Math.sin(t*3+i)*0.2})`;
      X.beginPath();X.arc(30+i*55,575+Math.sin(i)*5,3,0,Math.PI*2);X.fill()}
    // Icicles growing from ground
    dodge.ices.forEach(ic=>{
      const grad=X.createLinearGradient(ic.x,ic.y,ic.x,ic.y-ic.h);
      grad.addColorStop(0,'#B3E5FC');grad.addColorStop(0.5,'#81D4FA');grad.addColorStop(1,'#4FC3F7');
      X.fillStyle=grad;
      X.beginPath();X.moveTo(ic.x-6,ic.y);X.lineTo(ic.x,ic.y-ic.h);X.lineTo(ic.x+6,ic.y);X.closePath();X.fill();
      // Sparkle at tip
      X.fillStyle='#fff';X.beginPath();X.arc(ic.x,ic.y-ic.h,2,0,Math.PI*2);X.fill();
    });
    // Frost blasts falling
    dodge.frosts.forEach(f=>{
      X.fillStyle='rgba(100,180,255,0.6)';X.beginPath();X.arc(f.x,f.y,f.s/2,0,Math.PI*2);X.fill();
      X.fillStyle='rgba(180,220,255,0.4)';X.beginPath();X.arc(f.x,f.y,f.s/2+5,0,Math.PI*2);X.fill();
      // Ice crystal shape
      X.strokeStyle='rgba(255,255,255,0.5)';X.lineWidth=1.5;
      X.beginPath();X.moveTo(f.x,f.y-f.s/3);X.lineTo(f.x,f.y+f.s/3);X.stroke();
      X.beginPath();X.moveTo(f.x-f.s/3,f.y);X.lineTo(f.x+f.s/3,f.y);X.stroke();
    });
    // Romi
    if(IM.rs){X.save();X.translate(dodge.px,520);
      if(dodge.hits>0&&ticks%6<3)X.globalAlpha=0.5; // flash when hit
      X.drawImage(IM.rs,-19,-44,38,88);X.restore();X.globalAlpha=1}
    // 꽁꽁핑 at top center (floating, casting ice)
    if(IM.kk){const bob=Math.sin(t*2)*8;const kkx=W/2+Math.sin(t*1.5)*60;
      X.save();X.translate(kkx,50+bob);
      // Ice aura
      X.fillStyle=`rgba(100,180,255,${0.1+Math.sin(t*4)*0.05})`;X.beginPath();X.arc(0,30,50,0,Math.PI*2);X.fill();
      X.drawImage(IM.kk,-44,-10,88,120);X.restore()}
    // UI
    rr(X,10,8,220,28,12,'rgba(0,0,0,0.6)');
    // Blizzard snow particles
    for(let i=0;i<12;i++){const sx=((ticks*3+i*97)%W),sy=((ticks*2+i*131)%500)+30;
      X.fillStyle=`rgba(220,240,255,${0.3+Math.sin(t+i)*0.15})`;X.beginPath();X.arc(sx,sy,rng(2,4),0,Math.PI*2);X.fill()}
    // Wind lines
    X.strokeStyle='rgba(200,230,255,0.12)';X.lineWidth=1;
    for(let i=0;i<5;i++){const ly=150+i*80;X.beginPath();X.moveTo(0,ly);X.lineTo(W,ly+20);X.stroke()}
    X.fillStyle='#fff';X.font=FN(12);X.textAlign='left';
    X.fillText('🌨️ 꽁꽁핑의 눈보라를 피해! '+Math.ceil(dodge.timer/60)+'초',18,28);
    X.fillStyle=dodge.hits>2?'#FF4444':'#FFD700';X.fillText('피격: '+dodge.hits+'회',18,52);
    // Touch controls
    X.fillStyle=`rgba(255,255,255,${tL?0.35:0.18})`;X.beginPath();X.arc(55,H-60,28,0,Math.PI*2);X.fill();
    X.fillStyle='#fff';X.font=FN(16);X.textAlign='center';X.fillText('◀',55,H-54);
    X.fillStyle=`rgba(255,255,255,${tR?0.35:0.18})`;X.beginPath();X.arc(W-55,H-60,28,0,Math.PI*2);X.fill();
    X.fillStyle='#fff';X.fillText('▶',W-55,H-54);
    if(dodge.done){X.fillStyle='rgba(0,0,0,0.6)';X.fillRect(0,0,W,H);
      X.fillStyle='#fff';X.font='bold '+FN(20);X.textAlign='center';
      X.fillText('으... 너무 차가워!',W/2,H/2-10);X.font=FN(14);X.fillText('꽁꽁핑은 내 짝이 아닌 것 같아...',W/2,H/2+20)}
    // Particles
    parts.forEach(p=>{X.globalAlpha=p.l;X.fillStyle=p.c;X.beginPath();X.arc(p.x,p.y,p.s*p.l,0,Math.PI*2);X.fill()});X.globalAlpha=1;
    btns=[];
  }

  else if(scr==='race'){
    drawBG('forest');
    // Track
    X.fillStyle='#C9A96E';X.fillRect(0,420,W,80);
    X.strokeStyle='#fff';X.lineWidth=2;X.setLineDash([10,10]);X.beginPath();X.moveTo(0,460);X.lineTo(W,460);X.stroke();X.setLineDash([]);
    // Finish line
    X.fillStyle='#FF6B9D';X.fillRect(350,420,5,80);X.fillStyle='#fff';X.font=FN(10);X.textAlign='center';X.fillText('GOAL',352,415);
    // Romi
    if(IM.rs){const bob=Math.sin(Date.now()/80)*3;X.drawImage(IM.rs,race.romiX-19,430+bob-44,38,70)}
    // Ajusshi (simple)
    X.fillStyle='#8B6914';X.fillRect(race.ajX,440,25,30);X.fillStyle='#D4A76A';X.beginPath();X.arc(race.ajX+12,435,12,0,Math.PI*2);X.fill();
    X.fillStyle='#fff';X.beginPath();X.arc(race.ajX+8,432,3,0,Math.PI*2);X.fill();X.beginPath();X.arc(race.ajX+16,432,3,0,Math.PI*2);X.fill();
    X.fillStyle='#333';X.beginPath();X.arc(race.ajX+8,432,1.5,0,Math.PI*2);X.fill();X.beginPath();X.arc(race.ajX+16,432,1.5,0,Math.PI*2);X.fill();
    // UI
    rr(X,10,8,W-20,60,12,'rgba(0,0,0,0.6)');
    X.fillStyle='#fff';X.font='bold '+FN(14);X.textAlign='center';
    X.fillText('🏃 달리기 대결! 빠르게 터치!',W/2,28);
    X.fillText('탭: '+race.taps+'/'+race.need+'  시간: '+Math.ceil(race.timer/60)+'초',W/2,52);
    // Progress bar
    rr(X,30,520,W-60,20,8,'rgba(255,255,255,0.15)');
    rr(X,30,520,(W-60)*(race.taps/race.need),20,8,'#FF6B9D');
    // Big tap area indicator
    if(!race.done){X.globalAlpha=0.15+Math.sin(Date.now()/150)*0.1;X.fillStyle='#FF6B9D';
      X.beginPath();X.arc(W/2,H-120,60,0,Math.PI*2);X.fill();X.globalAlpha=1;
      X.fillStyle='#fff';X.font='bold '+FN(20);X.fillText('TAP!',W/2,H-112)}
    if(race.done){X.fillStyle='rgba(0,0,0,0.6)';X.fillRect(0,0,W,H);X.fillStyle='#FFD644';X.font='bold '+FN(24);X.textAlign='center';X.fillText(race.won?'🎉 승리!':'다음에!',W/2,H/2)}
    btns=[];
  }

  else if(scr==='rpgwalk'){
    drawBG('forest');
    // Simple ground
    X.fillStyle='#5D8A30';X.fillRect(0,430,W,40);X.fillStyle='#6EB844';X.fillRect(0,430,W,5);
    // Path indicator
    X.fillStyle='rgba(255,255,255,0.2)';X.font=FN(11);X.textAlign='center';X.fillText('→ 오른쪽으로 이동하세요 →',W/2,420);
    // Romi
    if(IM.rs){X.save();X.translate(rpg.px,370);
      if(rpg.dir<0)X.scale(-1,1);
      if(keys.ArrowRight||keys.d||tR)X.translate(0,Math.sin(Date.now()/80)*3);
      X.drawImage(IM.rs,-19,-44,38,88);X.restore()}
    // Target indicator
    X.fillStyle='rgba(255,107,157,0.4)';X.font=FN(14);X.textAlign='center';
    const arrowBob=Math.sin(Date.now()/300)*5;
    X.fillText('🚌',rpg.targetX,400+arrowBob);
    // Touch controls
    X.fillStyle='rgba(255,255,255,0.18)';X.beginPath();X.arc(55,H-60,28,0,Math.PI*2);X.fill();
    X.fillStyle='#fff';X.font=FN(16);X.textAlign='center';X.fillText('◀',55,H-54);
    X.fillStyle='rgba(255,255,255,0.18)';X.beginPath();X.arc(130,H-60,28,0,Math.PI*2);X.fill();
    X.fillStyle='#fff';X.fillText('▶',130,H-54);
    if(rpg.done){X.fillStyle='rgba(0,0,0,0.5)';X.fillRect(0,0,W,H);X.fillStyle='#fff';X.font='bold '+FN(18);X.textAlign='center';X.fillText('🚌 버스 정류장 도착!',W/2,H/2)}
    btns=[];
  }

  else if(scr==='play'){
    const L=LEVELS[lv];if(!L)return;drawBG(L.bg);
    L.plat.forEach(drawPlat);
    items_l.forEach(it=>{if(!it[3])return;const sx=it[0]-camX,sy=it[1]+Math.sin(Date.now()/350+it[0])*4;if(sx<-15||sx>W+15)return;heart(X,sx,sy,9,'#FF6B9D')});
    npcs_l.forEach(n=>{const sx=n.x-camX;if(sx<-50||sx>W+50)return;const img=n.spr==='ba'?IM.ba:IM.ch;if(img)X.drawImage(img,sx-25,n.y-25,55,55);if(!n.done){X.fillStyle='#FFD700';X.font='bold '+FN(16);X.textAlign='center';X.fillText('!',sx+5,n.y-35)}});
    enemies_l.forEach(drawEnemy);
    if(boss.active&&boss.hp>0){const sx=boss.x-camX,bob=Math.sin(Date.now()/250)*6;
      if(IM.ts)X.drawImage(IM.ts,sx,boss.y+bob,90,80);
      rr(X,sx,boss.y-18,90,10,4,'rgba(0,0,0,0.6)');rr(X,sx+2,boss.y-16,(boss.hp/boss.mx)*86,6,3,'#FF0040');
      X.fillStyle='#fff';X.font=FN(9);X.textAlign='center';X.fillText('트러핑',sx+45,boss.y-22)}
    drawPlayer();
    parts.forEach(p=>{X.globalAlpha=p.l;X.fillStyle=p.c;X.beginPath();X.arc(p.x-camX,p.y,p.s*p.l,0,Math.PI*2);X.fill()});X.globalAlpha=1;
    rr(X,8,8,200,30,12,'rgba(0,0,0,0.55)');X.fillStyle='#fff';X.font=FN(12);X.textAlign='left';
    X.fillText('❤️x'+lives+'  💗x'+hts+'  '+L.name,16,28);
    // 하츄핑 companion (요시처럼 로미 위에 떠다님) - 보스전에서만
    if(L.boss&&!P.dead){const hx=P.x-camX+PW/2+8,hy=P.y-15+Math.sin(t*3)*5;
      if(IM.hs){X.globalAlpha=hatchuShield?1:0.3;X.drawImage(IM.hs,hx-20,hy-18,40,35);X.globalAlpha=1}
      if(hatchuShield){X.fillStyle='#FF6B9D';X.font=FN(8);X.textAlign='center';X.fillText('💗',hx,hy-22)}
      else{X.fillStyle='rgba(255,255,255,0.5)';X.font=FN(8);X.textAlign='center';X.fillText('💔',hx,hy-22)}}
    if(npcMsg&&npcT>0){rr(X,20,H-210,W-40,55,12,'rgba(0,0,0,0.88)');X.fillStyle='#fff';X.font=FN(13);X.textAlign='center';npcMsg.split('\n').forEach((l,i)=>X.fillText(l,W/2,H-190+i*22))}
    // Touch controls
    X.fillStyle=`rgba(255,255,255,${tL?0.35:0.18})`;X.beginPath();X.arc(55,H-60,28,0,Math.PI*2);X.fill();X.fillStyle='#fff';X.font=FN(16);X.textAlign='center';X.fillText('◀',55,H-54);
    X.fillStyle=`rgba(255,255,255,${tR?0.35:0.18})`;X.beginPath();X.arc(130,H-60,28,0,Math.PI*2);X.fill();X.fillStyle='#fff';X.fillText('▶',130,H-54);
    X.fillStyle=`rgba(255,107,157,${tJ?0.4:0.2})`;X.beginPath();X.arc(W-60,H-60,32,0,Math.PI*2);X.fill();X.fillStyle='#fff';X.font='bold '+FN(14);X.fillText('JUMP',W-60,H-54);
    if(lvDone){X.fillStyle=`rgba(255,255,255,${0.2+Math.sin(Date.now()/150)*0.15})`;X.fillRect(0,0,W,H);X.fillStyle='#E84B7A';X.font='bold '+FN(22);X.textAlign='center';X.fillText('🎉 스테이지 클리어!',W/2,H/2)}
    btns=[];
  }

  else if(scr==='ending'){
    drawBG('sunset');heart(X,W/2,100,38,'#FF6B9D');
    X.fillStyle='#E84B7A';X.font='bold '+FN(26);X.textAlign='center';X.fillText('사랑의 하츄핑',W/2,180);
    X.fillStyle='#9D6BA0';X.font=FN(13);
    ['로미와 하츄핑은 사랑의 힘으로','트러핑을 물리치고 평화를 되찾았어요!','','앞으로도 둘의 모험은 계속됩니다...'].forEach((l,i)=>X.fillText(l,W/2,220+i*24));
    if(IM.rp)X.drawImage(IM.rp,30,360+Math.sin(t*1.5)*5,IM.rp.width*(220/IM.rp.height),220);
    if(IM.hp)X.drawImage(IM.hp,W/2+30,430+Math.sin(t*1.5+1)*5,IM.hp.width*(130/IM.hp.height),130);
    X.fillStyle='#E84B7A';X.font='bold '+FN(18);X.fillText('🌟 게임 클리어! 🌟',W/2,610);
    X.fillStyle='#9D6BA0';X.font=FN(11);X.fillText('하트 '+hts+'개 수집',W/2,636);
    btns=[{x:W/2-55,y:655,w:110,h:38,id:'restart'}];
    rr(X,btns[0].x,btns[0].y,110,38,16,'#E84B7A');X.fillStyle='#fff';X.font=FN(14);X.fillText('다시 하기 🔄',W/2,680);
  }

  if(trA>0){X.fillStyle=`rgba(0,0,0,${trA})`;X.fillRect(0,0,W,H)}
}

// ===== INPUT =====
document.addEventListener('keydown',e=>{keys[e.key]=true;
  if(scr==='story'&&(e.key===' '||e.key==='Enter'))advSt();
  if(scr==='race'&&!race.done&&(e.key===' '||e.key==='Enter'))race.taps++;
});
document.addEventListener('keyup',e=>{keys[e.key]=false});
function gp(e){const r=C.getBoundingClientRect();const t2=e.changedTouches?e.changedTouches[0]:e;return{x:(t2.clientX-r.left)*(W/r.width),y:(t2.clientY-r.top)*(H/r.height)}}
function inR(p,r){return p.x>=r.x&&p.x<=r.x+r.w&&p.y>=r.y&&p.y<=r.y+r.h}
function inC(p,cx,cy,r){return(p.x-cx)**2+(p.y-cy)**2<=r*r}

function onDown(e){e.preventDefault();const p=gp(e);if(trA>0.3)return;
  if(scr==='title'){btns.forEach(b=>{if(inR(p,b)&&b.id==='start'){
    lives=5;hts=0;lv=0;
    goStory(ST_OPEN,()=>goStory(ST_FEST,()=>startDodge(()=>goStory(ST_FEST2,()=>goStory(ST_BUKKU,()=>goStory(ST_LIB,()=>goStory(ST_DAD,()=>{initLv(0);doTrans('play')})))))))}});}
  if(scr==='story')advSt();
  if(scr==='ending'){btns.forEach(b=>{if(inR(p,b)&&b.id==='restart')location.reload()})}
  if(scr==='race'&&!race.done)race.taps++;
  // Touch controls
  if(scr==='play'||scr==='dodge'||scr==='rpgwalk'){
    if(inC(p,55,H-60,35))tL=true;
    if(inC(p,130,H-60,35))tR=true;
    if(scr==='play'&&inC(p,W-60,H-60,40))tJ=true;
    if(scr==='dodge'){if(p.x>W-100)tR=true;if(p.x<100)tL=true}
  }
}
function onUp(e){e.preventDefault();tL=false;tR=false;tJ=false}
function onMove(e){e.preventDefault();if(scr!=='play'&&scr!=='dodge'&&scr!=='rpgwalk')return;
  tL=false;tR=false;tJ=false;
  for(const t2 of(e.touches||[e])){const r=C.getBoundingClientRect();
    const p={x:(t2.clientX-r.left)*(W/r.width),y:(t2.clientY-r.top)*(H/r.height)};
    if(inC(p,55,H-60,35))tL=true;if(inC(p,130,H-60,35))tR=true;if(scr==='play'&&inC(p,W-60,H-60,40))tJ=true;
    if(scr==='dodge'){if(p.x>W-100)tR=true;if(p.x<100)tL=true}}}
C.addEventListener('mousedown',onDown);C.addEventListener('mouseup',onUp);
C.addEventListener('touchstart',onDown,{passive:false});C.addEventListener('touchend',onUp,{passive:false});
C.addEventListener('touchmove',onMove,{passive:false});

// ===== LOOP =====
function loop(){update();render();requestAnimationFrame(loop)}
function wait(){if(iL<iT){X.fillStyle='#1a0a2e';X.fillRect(0,0,W,H);X.fillStyle='#FF6B9D';X.font=FN(16);X.textAlign='center';X.fillText('로딩 중...',W/2,H/2);rr(X,W/4,H/2+20,W/2,8,4,'rgba(255,255,255,0.1)');rr(X,W/4,H/2+20,W/2*(iL/iT),8,4,'#FF6B9D');requestAnimationFrame(wait)}else requestAnimationFrame(loop)}
wait();
</script></body></html>'''

with open(out, "w", encoding="utf-8") as f:
    f.write(html)
print(f"Built: {os.path.getsize(out)//1024}KB")

"""Build hatcuping platformer v3 - proper story, easy platforms, good visuals."""
import os

sprite_dir = r"D:\AI\게임\sprites"
out_path = r"D:\AI\게임\hatcuping-game.html"

# Read sprite base64
sprites = {}
with open(os.path.join(sprite_dir, "final_sprites.js"), "r", encoding="utf-8") as f:
    for line in f:
        line = line.strip()
        if line.startswith("const ") and "=" in line:
            name = line.split("=")[0].replace("const ", "").strip()
            val = line.split("=", 1)[1].strip().rstrip(";").strip('"')
            sprites[name] = val
print(f"Loaded {len(sprites)} sprites")

sprite_js = "\n".join(f'const {k}="{v}";' for k, v in sprites.items())

html = r'''<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<title>사랑의 하츄핑 - 탈출 어드벤처</title>
<link href="https://fonts.googleapis.com/css2?family=Jua&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;overflow:hidden;background:#0a0515;display:flex;justify-content:center;align-items:center}
canvas{display:block;max-width:100vw;max-height:100vh;touch-action:none}
</style>
</head>
<body>
<canvas id="c"></canvas>
<script>
// ===== SPRITES =====
''' + sprite_js + r'''

// ===== SETUP =====
const C=document.getElementById('c'),X=C.getContext('2d');
const W=420,H=750;C.width=W;C.height=H;
let fontOK=false;setTimeout(()=>fontOK=true,1200);
function FN(s){return s+'px '+(fontOK?"Jua,":"")+'sans-serif'}

// Image loader
const IM={};let iL=0,iT=0;
function lI(n,s){iT++;const i=new Image();i.onload=()=>{iL++;IM[n]=i};i.onerror=()=>iL++;i.src=s}
lI('rs',ROMI_S);lI('rp',ROMI_P);lI('rf',ROMI_F);
lI('hs',HATCHU_S);lI('hp',HATCHU_P);lI('hf',HATCHU_F);lI('h2',HATCHU2_S);
lI('ts',TRUP_S);lI('tp',TRUP_P);
lI('ba',BARO_S);lI('ch',CHACHA_S);

// ===== HELPERS =====
function heart(c,x,y,s,col){c.save();c.translate(x,y);c.scale(s/16,s/16);c.fillStyle=col;c.beginPath();c.moveTo(0,-4);c.bezierCurveTo(-8,-14,-18,-4,-8,4);c.lineTo(0,12);c.moveTo(0,-4);c.bezierCurveTo(8,-14,18,-4,8,4);c.lineTo(0,12);c.fill();c.restore()}
function rr(c,x,y,w,h,r,f,s){c.beginPath();c.moveTo(x+r,y);c.lineTo(x+w-r,y);c.quadraticCurveTo(x+w,y,x+w,y+r);c.lineTo(x+w,y+h-r);c.quadraticCurveTo(x+w,y+h,x+w-r,y+h);c.lineTo(x+r,y+h);c.quadraticCurveTo(x,y+h,x,y+h-r);c.lineTo(x,y+r);c.quadraticCurveTo(x,y,x+r,y);c.closePath();if(f){c.fillStyle=f;c.fill()}if(s){c.strokeStyle=s;c.lineWidth=2;c.stroke()}}
function rng(a,b){return Math.floor(Math.random()*(b-a+1))+a}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function lerp(a,b,t){return a+(b-a)*t}

// ===== STORY DATA (영화 순서대로) =====
const ST_OPENING=[
  {bg:'castle',img:'rp',sp:'',tx:'🌸 이모션 왕국 🌸\n\n핑크빛 장미 꽃잎이 하늘을 날아\n성 안 로미 공주의 손 위에 내려앉았어요.'},
  {bg:'castle',img:'rf',sp:'시녀 👩',tx:'공주님, 일어나세요!\n오늘은 아주 중요한 날이에요!'},
  {bg:'castle',img:'rf',sp:'로미 💖',tx:'(하암~) 벌써 아침이야?\n오늘이 무슨 날이더라...?'},
  {bg:'castle',img:null,sp:'하트킹 👑',tx:'로미야, 오늘은 네 열 살 생일이란다!\n너만의 운명의 짝꿍 티니핑을\n찾는 중요한 날이야!'},
  {bg:'castle',img:'rf',sp:'로미 💖',tx:'맞다! 짝꿍 티니핑!\n내 소울메이트를 드디어 만나는 거야!\n두근두근...!'},
];
const ST_FESTIVAL=[
  {bg:'festival',img:null,sp:'',tx:'🎉 티니핑 축제 🎉\n\n수많은 티니핑이 광장에 모였어요.\n로미는 자신의 운명의 짝을 찾습니다.'},
  {bg:'festival',img:null,sp:'집사 🎩',tx:'공주님, 이 티니핑은 어떠세요?\n프리징핑이라고 합니다!'},
  {bg:'festival',img:'rf',sp:'로미 💖',tx:'으... 아니야, 이 아이는 아닌 것 같아.\n왠지 마음이 안 맞아...'},
  {bg:'festival',img:null,sp:'집사 🎩',tx:'그럼 이쪽은요? 딱풀핑, 꽁꽁핑도\n있습니다!'},
  {bg:'festival',img:'rf',sp:'로미 💖',tx:'다 아니야!\n이 아이들은 내 소울메이트가 아니야!\n난... 진짜 운명의 짝을 느끼고 싶어!'},
];
const ST_LIBRARY=[
  {bg:'library',img:'rf',sp:'',tx:'📚 왕실 도서관 📚\n\n실망한 로미는 마음을 달래러\n도서관으로 향했어요.'},
  {bg:'library',img:'rf',sp:'로미 💖',tx:'진짜 내 소울메이트는\n어디에 있는 걸까...?'},
  {bg:'library',img:'hp',sp:'',tx:'✨ 그 순간, 낡은 책에서\n신비로운 빛이 흘러나왔어요!\n\n책 속에 하츄핑의 모습이 나타났습니다!'},
  {bg:'sunset',img:'hp',sp:'로미 💖',tx:'이 아이야...!\n처음 본 순간 알 수 있었어!\n이 아이가 내 운명의 짝이야!'},
  {bg:'sunset',img:'rf',sp:'로미 💖',tx:'♪ 처음 본 순간 반해버렸어 ♪\n♪ 하츄핑, 넌 나의 소울메이트 ♪\n\n난 하츄핑이 아니면 안 돼!'},
];
const ST_DECIDE=[
  {bg:'castle',img:null,sp:'하트킹 👑',tx:'하츄핑은 라미엔느 왕국에 있단다.\n그곳은 트러핑의 저주가 내린\n위험한 곳이야!'},
  {bg:'castle',img:null,sp:'몬쥬 박사 🔬',tx:'공주님, 라미엔느는 절대 안 됩니다!\n인간과 티니핑이 적이 된 곳이에요!'},
  {bg:'castle',img:'rf',sp:'로미 💖',tx:'하지만... 하츄핑이 외로워하고 있어!\n느낄 수 있어! 나한테 도움을 청하고 있어!'},
  {bg:'sunset',img:'rp',sp:'로미 💖',tx:'포기 안 해!\n아빠도 박사님도 미안하지만...\n직접 찾으러 갈 거야!'},
  {bg:'sunset',img:null,sp:'',tx:'🏃‍♀️ 로미는 모두의 반대를 무릅쓰고\n왕궁을 탈출하기로 결심했어요!\n\n(스테이지 1: 왕궁 탈출!)'},
];
const ST_BUS=[
  {bg:'forest',img:null,sp:'버스 아저씨 🚌',tx:'어이구, 꼬마 아가씨!\n라미엔느로 간다고?\n거긴 위험한 곳인데...'},
  {bg:'forest',img:'rf',sp:'로미 💖',tx:'아저씨, 제발요!\n꼭 가야 해요! 하츄핑을 찾아야 해요!'},
  {bg:'forest',img:null,sp:'버스 아저씨 🚌',tx:'그 눈빛... 진심이구나!\n좋아! 달리기 대결에서 이기면\n특급버스를 불러줄게!'},
  {bg:'forest',img:'rf',sp:'로미 💖',tx:'좋아요! 해볼게요!\n\n(로미는 온 힘을 다해 달렸어요!)'},
  {bg:'forest',img:null,sp:'버스 아저씨 🚌',tx:'이런, 내가 졌네!\n대단한 아가씨야!\n특급버스 출발~! 🚌💨'},
];
const ST_ARRIVE=[
  {bg:'dark',img:null,sp:'',tx:'🏰 라미엔느 왕국 🏰\n\n어둡고 으스스한 분위기...\n트러핑의 저주가 내린 곳이에요.'},
  {bg:'dark',img:'rf',sp:'로미 💖',tx:'여기가 라미엔느...\n무서워... 하지만 하츄핑을 위해서!'},
  {bg:'dark',img:'hf',sp:'??? 💗',tx:'...누구야?\n인간은 무서운 존재라고 들었어...\n가까이 오지 마!'},
  {bg:'sunset',img:'rf',sp:'로미 💖',tx:'하츄핑! 드디어 찾았어!\n나는 로미야! 널 만나러 왔어!'},
  {bg:'sunset',img:'hf',sp:'하츄핑 💗',tx:'날 만나러...? 왜?\n트러핑이 인간은 배신한다고 했어...'},
  {bg:'sunset',img:'rf',sp:'로미 💖',tx:'아니야! 난 절대 배신 안 해!\n넌 내 소울메이트야!\n느낄 수 있어, 우리는 운명이야!'},
];
const ST_TRUST=[
  {bg:'sunset',img:'rf',sp:'',tx:'로미는 포기하지 않았어요.\n종이비행기 쪽지를 날리고,\n그림을 그려주고, 매일 찾아갔어요.'},
  {bg:'sunset',img:'hf',sp:'하츄핑 💗',tx:'이 인간... 진심인 건가?\n매일 이렇게 찾아오다니...\n마음이 따뜻해지는 느낌이야...'},
  {bg:'sunset',img:'hp',sp:'',tx:'💗 하츄핑의 마음이 열렸어요! 💗\n\n(스테이지 3: 라미엔느 성!\n트러핑에게서 하츄핑을 지켜라!)'},
];
const ST_BOSS=[
  {bg:'dark',img:'tp',sp:'트러핑 ⚡',tx:'크크크... 이 어리석은 인간!\n리암도 나를 버렸어!\n인간은 모두 배신자야!'},
  {bg:'dark',img:'rf',sp:'로미 💖',tx:'트러핑, 넌 배신당한 게 아니야!\n리암 왕자는 너를 버린 게 아니었어!'},
  {bg:'dark',img:'tp',sp:'트러핑 ⚡',tx:'닥쳐! 용서 못 해!\n하츄핑은 내 거야!\n절대 빼앗기지 않겠어!'},
  {bg:'dark',img:'rf',sp:'로미 💖',tx:'하츄핑, 같이 힘을 합치자!\n사랑의 힘은 무적이야!'},
];
const ST_END=[
  {bg:'sunset',img:'hf',sp:'하츄핑 💗',tx:'로미... 고마워!\n불 속에서 날 구해줬을 때\n네가 진심이란 걸 완전히 알았어!'},
  {bg:'sunset',img:'rf',sp:'로미 💖',tx:'하츄핑의 눈물이\n나를 깨워줬잖아!\n우리는 진짜 소울메이트야!'},
  {bg:'sunset',img:null,sp:'',tx:'하츄핑의 눈물이 떨어지는 순간,\n트러핑의 모든 저주가 풀렸어요.\n\n트러핑도 리암 왕자와 다시 만나\n오해를 풀고 원래 모습을 되찾았습니다.'},
  {bg:'sunset',img:null,sp:'하츄핑 💗',tx:'싸우거나 속상한 일이 있어도\n화해하면 돼.\n로미와 함께 있으면 행복해!'},
  {bg:'sunset',img:null,sp:'',tx:'💗 사랑이 세상을 구했습니다 💗\n\n로미와 하츄핑은 진정한 짝꿍이 되어\n새로운 모험을 떠납니다...'},
];

// ===== LEVEL DATA =====
// 쉬운 난이도! 넓은 발판, 작은 간격
const LEVELS=[
  { // Stage 1: 왕궁 탈출
    name:'왕궁 탈출',bg:'castle',sx:80,sy:430,endX:3800,
    // [x,y,w,h,type] type: 0=castle_floor 1=stone 2=carpet
    plat:[
      [0,520,500,40,0],[520,520,500,40,0],[1040,520,500,40,0],
      [1560,520,500,40,0],[2080,520,500,40,0],[2600,520,500,40,0],
      [3120,520,500,40,0],[3640,520,300,40,0],
      // 올라가는 계단식 플랫폼 (간격 작게, 높이 차이 작게)
      [220,460,100,16,1],[380,420,100,16,1],[550,380,120,16,2],
      [780,450,100,16,1],[950,400,120,16,2],
      [1150,460,100,16,1],[1350,410,120,16,1],
      [1650,460,100,16,2],[1850,420,100,16,1],[2050,380,120,16,2],
      [2250,450,100,16,1],[2450,400,120,16,2],
      [2700,460,100,16,1],[2900,420,100,16,1],
      [3200,460,120,16,2],[3450,420,100,16,1],
    ],
    items:[[270,430,0],[430,390,0],[610,350,0],[830,420,0],[1000,370,0],
      [1200,430,0],[1410,380,0],[1700,430,0],[1900,390,0],[2110,350,0],
      [2300,420,0],[2510,370,0],[2750,430,0],[2950,390,0],[3260,430,0],[3500,390,0]],
    enemies:[[400,490,0],[900,490,0],[1300,490,0],[1800,490,0],[2400,490,0],[2850,490,0],[3350,490,0]],
    npcs:[],
  },
  { // Stage 2: 숲 길 + 버스정류장
    name:'라미엔느로!',bg:'forest',sx:80,sy:430,endX:3600,
    plat:[
      [0,520,500,40,3],[520,520,500,40,3],[1040,520,500,40,3],
      [1560,520,500,40,3],[2080,520,500,40,3],[2600,520,500,40,3],
      [3120,520,600,40,3],
      [200,460,100,16,4],[400,420,120,16,4],[650,460,100,16,4],
      [850,410,100,16,4],[1100,460,120,16,4],[1350,420,100,16,4],
      [1600,460,100,16,4],[1800,410,120,16,4],[2050,460,100,16,4],
      [2300,420,100,16,4],[2550,460,120,16,4],[2800,420,100,16,4],
      [3050,460,100,16,4],[3300,410,120,16,4],
    ],
    items:[[250,430,0],[460,390,0],[700,430,0],[900,380,0],[1160,430,0],
      [1400,390,0],[1650,430,0],[1860,380,0],[2100,430,0],[2350,390,0],
      [2610,430,0],[2850,390,0],[3100,430,0],[3360,380,0]],
    enemies:[[350,490,1],[750,490,1],[1200,490,1],[1700,490,1],[2200,490,1],[2700,490,1],[3150,490,1]],
    npcs:[[600,460,'ba','나는 바로핑!\n용기를 내, 로미!'],[1500,460,'ch','차차핑이다!\n화이팅!']],
  },
  { // Stage 3: 라미엔느 성
    name:'라미엔느 성',bg:'dark',sx:80,sy:430,endX:3400,boss:true,
    plat:[
      [0,520,500,40,5],[520,520,500,40,5],[1040,520,500,40,5],
      [1560,520,500,40,5],[2080,520,500,40,5],[2600,520,500,40,5],
      [3120,520,400,40,5],
      [200,460,100,16,6],[400,410,120,16,6],[650,460,100,16,6],
      [900,420,100,16,6],[1150,460,120,16,6],[1400,410,100,16,6],
      [1650,460,100,16,6],[1900,420,120,16,6],
      [2150,460,100,16,6],[2400,410,100,16,6],[2650,460,120,16,6],
      [2900,420,100,16,6],[3100,460,120,16,6],
    ],
    items:[[250,430,0],[460,380,0],[700,430,0],[950,390,0],[1210,430,0],
      [1450,380,0],[1700,430,0],[1960,390,0],[2200,430,0],[2450,380,0],
      [2710,430,0],[2950,390,0],[3160,430,0]],
    enemies:[[350,490,2],[800,490,2],[1250,490,2],[1750,490,2],[2300,490,2],[2750,490,2]],
    npcs:[],
  },
];

// ===== STATE =====
let scr='title',t=0;
let lv=0,lives=5,hts=0;
const P={x:0,y:0,vx:0,vy:0,ground:false,face:1,dead:false};
const PW=38,PH=88; // 로미 actual sprite size (ratio preserved!)
const GR=0.5,JMP=-11.5,SPD=4.2,MXF=11;
let camX=0;
let parts=[],enemies_live=[],items_live=[],npcs_live=[];
let boss={hp:0,mx:0,x:0,y:0,dir:1,active:false};
let npcMsg='',npcT=0;
let lvDone=false,lvDoneT=0;
let stQ=[],stI=0,stTx='',stDn=false,stTm=null,stCb=null;
let trA=0,trD=0,trNx=null;
let tL=false,tR=false,tJ=false;
const keys={};
// click areas
let btnStart={x:0,y:0,w:0,h:0},btnEnd={x:0,y:0,w:0,h:0};

function initLv(i){
  const L=LEVELS[i];if(!L)return;
  P.x=L.sx;P.y=L.sy;P.vx=0;P.vy=0;P.ground=false;P.face=1;P.dead=false;
  camX=0;lvDone=false;lvDoneT=0;
  enemies_live=L.enemies.map(e=>[e[0],e[1],e[2],e[2]===0?1.2:e[2]===1?1:1.5,e[0]-40,e[0]+80,true]);
  items_live=L.items.map(it=>[it[0],it[1],it[2],true]);
  npcs_live=L.npcs?L.npcs.map(n=>({x:n[0],y:n[1],spr:n[2],dlg:n[3],done:false})):[];
  parts=[];npcMsg='';npcT=0;
  if(L.boss){boss={hp:5,mx:5,x:L.endX-180,y:440,dir:1,active:true}}
  else{boss.active=false}
}

// ===== STORY =====
function goStory(arr,cb){stQ=arr;stI=0;stTx='';stDn=false;stCb=cb;doTrans('story',()=>typeSt())}
function typeSt(){
  const s=stQ[stI];if(!s)return;stTx='';stDn=false;let i=0;const tx=s.tx;
  clearInterval(stTm);
  stTm=setInterval(()=>{if(i<tx.length){stTx=tx.slice(0,++i)}else{stDn=true;clearInterval(stTm)}},25);
}
function advSt(){
  if(!stDn){clearInterval(stTm);stTx=stQ[stI].tx;stDn=true;return}
  stI++;if(stI<stQ.length)typeSt();else{clearInterval(stTm);if(stCb)stCb()}
}
function doTrans(s,cb){trD=1;trNx=()=>{scr=s;if(cb)cb();trD=-1}}

// ===== UPDATE =====
function update(){
  t+=0.02;
  if(trD>0){trA=Math.min(1,trA+0.05);if(trA>=1&&trNx){trNx();trNx=null}}
  if(trD<0){trA=Math.max(0,trA-0.05);if(trA<=0)trD=0}
  if(scr!=='play'||P.dead||lvDone)return;
  const L=LEVELS[lv];if(!L)return;
  // Movement
  let mx=0;
  if(keys.ArrowLeft||keys.a||tL){mx=-1;P.face=-1}
  if(keys.ArrowRight||keys.d||tR){mx=1;P.face=1}
  P.vx=mx*SPD;
  if((keys.ArrowUp||keys.w||keys[' ']||tJ)&&P.ground){P.vy=JMP;P.ground=false}
  P.vy=Math.min(P.vy+GR,MXF);
  P.x+=P.vx;P.y+=P.vy;
  // Collision
  P.ground=false;
  for(const pl of L.plat){
    const[px,py,pw,ph]=pl;
    if(P.x+PW>px+3&&P.x<px+pw-3){
      if(P.vy>=0&&P.y+PH>=py&&P.y+PH-P.vy<=py+5){P.y=py-PH;P.vy=0;P.ground=true}
      if(P.vy<0&&P.y<=py+ph&&P.y-P.vy>=py+ph-3){P.y=py+ph;P.vy=0}
    }
    if(P.y+PH>py+3&&P.y<py+ph-3){
      if(P.vx>0&&P.x+PW>px&&P.x+PW-P.vx<=px+2)P.x=px-PW;
      if(P.vx<0&&P.x<px+pw&&P.x-P.vx>=px+pw-2)P.x=px+pw;
    }
  }
  if(P.y>620){die();return}
  P.x=Math.max(0,P.x);
  camX+=(P.x-W/3-camX)*0.1;
  camX=clamp(camX,0,Math.max(0,L.endX-W+100));
  // Items
  items_live.forEach(it=>{if(!it[3])return;
    if(Math.abs(P.x+PW/2-it[0])<28&&Math.abs(P.y+PH/2-it[1])<28){
      it[3]=false;hts++;
      for(let i=0;i<6;i++)parts.push({x:it[0],y:it[1],vx:(Math.random()-0.5)*4,vy:-Math.random()*3-1,l:1,s:rng(3,6),c:'#FF6B9D'})}});
  // Enemies
  enemies_live.forEach(e=>{if(!e[6])return;
    e[0]+=e[3];if(e[0]<=e[4]||e[0]>=e[5])e[3]=-e[3];
    if(Math.abs(P.x+PW/2-e[0]-15)<28&&Math.abs(P.y+PH-e[1]-15)<28){
      if(P.vy>0&&P.y+PH<e[1]+10){e[6]=false;P.vy=JMP*0.6;hts+=2;
        for(let i=0;i<8;i++)parts.push({x:e[0]+15,y:e[1],vx:(Math.random()-0.5)*5,vy:-Math.random()*4,l:1,s:rng(3,7),c:'#FFD700'})}
      else die()}});
  // NPCs
  npcs_live.forEach(n=>{if(n.done)return;
    if(Math.abs(P.x+PW/2-n.x)<50&&Math.abs(P.y+PH/2-n.y)<50){n.done=true;npcMsg=n.dlg;npcT=180}});
  if(npcT>0)npcT--;else npcMsg='';
  // Boss
  if(boss.active&&boss.hp>0){
    boss.x+=boss.dir*1.5;
    if(boss.x<LEVELS[lv].endX-300||boss.x>LEVELS[lv].endX-80)boss.dir=-boss.dir;
    if(Math.abs(P.x+PW/2-boss.x-40)<45&&Math.abs(P.y+PH-boss.y-40)<45){
      if(P.vy>0&&P.y+PH<boss.y+15){boss.hp--;P.vy=JMP*0.7;
        for(let i=0;i<10;i++)parts.push({x:boss.x+40,y:boss.y,vx:(Math.random()-0.5)*6,vy:-Math.random()*5,l:1,s:rng(4,8),c:'#9C27B0'});
        if(boss.hp<=0){boss.active=false;lvDone=true;lvDoneT=90}}
      else die()}}
  // Level end
  if(!L.boss&&P.x>=L.endX-50){lvDone=true;lvDoneT=90}
  // Particles
  parts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=0.1;p.l-=0.025});
  parts=parts.filter(p=>p.l>0);
  if(P.ground&&Math.abs(P.vx)>1&&Math.random()<0.3)
    parts.push({x:P.x+PW/2,y:P.y+PH,vx:(Math.random()-0.5)*1.2,vy:-Math.random(),l:0.5,s:rng(2,3),c:'rgba(150,140,120,0.5)'});
  if(lvDone&&lvDoneT>0){lvDoneT--;if(lvDoneT<=0)onClear()}
}

function die(){if(P.dead)return;P.dead=true;lives--;
  for(let i=0;i<12;i++)parts.push({x:P.x+PW/2,y:P.y+PH/2,vx:(Math.random()-0.5)*6,vy:-Math.random()*5-2,l:1,s:rng(3,7),c:'#FF6B9D'});
  setTimeout(()=>{if(lives<=0){lives=5;hts=0;lv=0;doTrans('title')}else{initLv(lv);scr='play'}},1200)}

function onClear(){
  if(lv===0){goStory(ST_BUS,()=>{lv=1;initLv(1);doTrans('play')})}
  else if(lv===1){goStory(ST_ARRIVE,()=>goStory(ST_TRUST,()=>goStory(ST_BOSS,()=>{lv=2;initLv(2);doTrans('play')})))}
  else if(lv===2){goStory(ST_END,()=>doTrans('ending'))}
}

// ===== RENDER =====
function drawBG(type){
  const g=X.createLinearGradient(0,0,0,H);
  if(type==='castle'){
    g.addColorStop(0,'#E8D5F5');g.addColorStop(0.5,'#FFE4F0');g.addColorStop(1,'#D4C1EC');
    X.fillStyle=g;X.fillRect(0,0,W,H);
    // Rich castle bg: arches, chandeliers, carpet
    X.fillStyle='#C8B6E2';
    for(let i=0;i<12;i++){const bx=(-camX*0.15+i*110)%W-50;
      X.fillRect(bx,80,30,H-80);X.fillStyle='#D4C1EC';X.fillRect(bx-4,75,38,12);X.fillStyle='#C8B6E2'}
    // Arches between pillars
    X.strokeStyle='#D4C1EC';X.lineWidth=6;
    for(let i=0;i<8;i++){const ax=(-camX*0.15+i*220+30)%W-50;
      X.beginPath();X.arc(ax+55,150,55,Math.PI,0);X.stroke()}
    // Windows with light
    for(let i=0;i<6;i++){const wx=(-camX*0.15+i*220+55)%W-50;
      X.fillStyle='rgba(135,206,235,0.25)';X.beginPath();X.arc(wx,155,20,Math.PI,0);X.fillRect(wx-20,155,40,30);X.fill();
      X.fillStyle='rgba(255,255,200,0.08)';X.beginPath();X.moveTo(wx-25,185);X.lineTo(wx-60,500);X.lineTo(wx+60,500);X.lineTo(wx+25,185);X.fill()}
    // Red carpet
    X.fillStyle='rgba(200,50,80,0.15)';X.fillRect(0,490,W,70);
    // Chandeliers
    for(let i=0;i<4;i++){const cx=(-camX*0.1+i*250+80)%W-50;
      X.strokeStyle='#DAA520';X.lineWidth=2;X.beginPath();X.moveTo(cx,0);X.lineTo(cx,50);X.stroke();
      X.fillStyle='#FFD700';X.beginPath();X.arc(cx,55,8,0,Math.PI*2);X.fill();
      X.fillStyle='rgba(255,215,0,0.1)';X.beginPath();X.arc(cx,55,25,0,Math.PI*2);X.fill()}
  }
  else if(type==='forest'||type==='festival'){
    g.addColorStop(0,'#87CEEB');g.addColorStop(0.4,'#B5EAD7');g.addColorStop(1,'#7EC850');
    X.fillStyle=g;X.fillRect(0,0,W,H);
    // Sun
    X.fillStyle='rgba(255,240,100,0.3)';X.beginPath();X.arc(350,60,35,0,Math.PI*2);X.fill();
    // Clouds
    X.fillStyle='rgba(255,255,255,0.6)';
    for(let i=0;i<6;i++){const cx=(-camX*0.04+i*180+30)%(W+100)-50,cy=30+i*15;
      X.beginPath();X.arc(cx,cy,18,0,Math.PI*2);X.fill();
      X.beginPath();X.arc(cx+20,cy-5,14,0,Math.PI*2);X.fill();
      X.beginPath();X.arc(cx+35,cy+2,16,0,Math.PI*2);X.fill()}
    // Background mountains
    X.fillStyle='#81C784';X.beginPath();X.moveTo(0,360);
    for(let i=0;i<10;i++)X.lineTo((-camX*0.08+i*130)%(W+200)-100,260+Math.sin(i*1.3)*50);
    X.lineTo(W+50,360);X.lineTo(W+50,400);X.lineTo(-50,400);X.fill();
    // Trees
    for(let i=0;i<14;i++){const tx=(-camX*0.12+i*100+20)%(W+150)-50;
      X.fillStyle='#5D4037';X.fillRect(tx-3,370,6,35);
      X.fillStyle='#2E7D32';X.beginPath();X.arc(tx,365,16,0,Math.PI*2);X.fill();
      X.fillStyle='#388E3C';X.beginPath();X.arc(tx-6,360,10,0,Math.PI*2);X.fill()}
    // Flowers
    for(let i=0;i<20;i++){const fx=(-camX*0.06+i*52+10)%(W+80)-30,fy=480+Math.sin(i*2)*15;
      X.fillStyle=['#FF69B4','#FFD700','#FF6347','#BA68C8','#fff'][i%5];
      X.beginPath();X.arc(fx,fy,2.5,0,Math.PI*2);X.fill()}
    if(type==='festival'){// Festival decorations
      for(let i=0;i<8;i++){const fx=(-camX*0.1+i*140+40)%(W+100)-50;
        X.fillStyle=['#FF6B9D','#FFD700','#64B5F6','#FF8A65'][i%4];
        X.fillRect(fx,100,4,40);X.beginPath();
        X.moveTo(fx-8,100);X.lineTo(fx+2,85);X.lineTo(fx+12,100);X.fill()}}
  }
  else if(type==='dark'){
    g.addColorStop(0,'#0d0520');g.addColorStop(0.5,'#1a0a2e');g.addColorStop(1,'#2d1b4e');
    X.fillStyle=g;X.fillRect(0,0,W,H);
    // Lightning
    if(Math.random()<0.004){X.fillStyle='rgba(180,140,255,0.08)';X.fillRect(0,0,W,H)}
    // Pillars
    X.fillStyle='#150830';
    for(let i=0;i<10;i++){const px=(-camX*0.15+i*120)%(W+100)-50;
      X.fillRect(px,80,25,H-80);X.fillStyle='#1a0a38';X.fillRect(px-3,75,31,10);X.fillStyle='#150830'}
    // Eerie glow
    for(let i=0;i<4;i++){const gx=(-camX*0.08+i*220+60)%(W+150)-50;
      X.fillStyle='rgba(128,0,255,0.04)';X.beginPath();X.arc(gx,350,50,0,Math.PI*2);X.fill()}
    // Bats (tiny)
    for(let i=0;i<5;i++){const bx=(-camX*0.2+i*180+Math.sin(t*2+i)*30)%(W+100)-50,by=100+i*40+Math.sin(t*3+i)*20;
      X.fillStyle='#2a1040';X.beginPath();
      X.moveTo(bx,by);X.lineTo(bx-8,by-5);X.lineTo(bx-3,by);X.lineTo(bx+3,by);X.lineTo(bx+8,by-5);X.fill()}
  }
  else if(type==='sunset'){
    g.addColorStop(0,'#FF9A8B');g.addColorStop(0.35,'#FF6B9D');g.addColorStop(0.7,'#FFB8D4');g.addColorStop(1,'#FFDEE9');
    X.fillStyle=g;X.fillRect(0,0,W,H);
    for(let i=0;i<8;i++){X.globalAlpha=0.12+Math.sin(t+i*0.9)*0.06;
      heart(X,Math.sin(t*0.4+i*1.2)*160+W/2,70+i*65+Math.sin(t*0.8+i)*12,8+i*2,'#FF6B9D')}
    X.globalAlpha=1}
  else if(type==='library'){
    g.addColorStop(0,'#5D4037');g.addColorStop(0.5,'#795548');g.addColorStop(1,'#8D6E63');
    X.fillStyle=g;X.fillRect(0,0,W,H);
    // Bookshelves
    for(let i=0;i<6;i++){const bx=30+i*70;
      X.fillStyle='#4E342E';X.fillRect(bx,60,55,H-120);
      for(let j=0;j<8;j++){X.fillStyle=['#E53935','#1E88E5','#43A047','#F9A825','#8E24AA','#FF7043'][j%6];
        X.fillRect(bx+4+rng(0,3),80+j*50,rng(8,14),40)}}
    // Warm light
    X.fillStyle='rgba(255,200,100,0.06)';X.beginPath();X.arc(W/2,H/2,200,0,Math.PI*2);X.fill();
    // Sparkle from book
    X.fillStyle='rgba(255,215,0,0.15)';X.beginPath();X.arc(W/2,H*0.5,80,0,Math.PI*2);X.fill();
    for(let i=0;i<10;i++){X.fillStyle=`rgba(255,215,0,${Math.random()*0.4})`;
      X.beginPath();X.arc(W/2+Math.sin(t*2+i)*60,H*0.5+Math.cos(t*1.5+i)*50,rng(1,3),0,Math.PI*2);X.fill()}}
}

function drawPlat(pl){
  const[px,py,pw,ph,tp]=pl;
  const sx=px-camX;if(sx+pw<-10||sx>W+10)return;
  if(tp===0||tp===2){// castle floor / carpet
    X.fillStyle='#9988AA';X.fillRect(sx,py,pw,ph);X.fillStyle='#AA99BB';X.fillRect(sx,py,pw,4);
    for(let i=0;i<pw;i+=24){X.strokeStyle='rgba(0,0,0,0.08)';X.lineWidth=1;X.strokeRect(sx+i,py,24,ph)}
    if(tp===2){X.fillStyle='rgba(180,50,80,0.2)';X.fillRect(sx+4,py+2,pw-8,ph-4)}
  }else if(tp===1||tp===6){// stone
    X.fillStyle=tp===6?'#3a2050':'#8899AA';X.fillRect(sx,py,pw,ph);
    X.fillStyle=tp===6?'#4a2860':'#99AABB';X.fillRect(sx+1,py+1,pw-2,ph/2);
    X.strokeStyle=tp===6?'rgba(128,0,255,0.2)':'rgba(0,0,0,0.1)';X.lineWidth=1;X.strokeRect(sx,py,pw,ph);
  }else if(tp===3){// grass ground
    X.fillStyle='#5D8A30';X.fillRect(sx,py,pw,ph);X.fillStyle='#6EB844';X.fillRect(sx,py,pw,5);
    X.fillStyle='#7EC850';for(let i=0;i<pw;i+=7)X.fillRect(sx+i,py-2,2,4);
  }else if(tp===4){// wood
    X.fillStyle='#8B6914';X.fillRect(sx,py,pw,ph);X.fillStyle='#A0792C';X.fillRect(sx+1,py+1,pw-2,ph/2);
    X.strokeStyle='#6B4914';X.lineWidth=1;X.strokeRect(sx,py,pw,ph);
  }else if(tp===5){// dark ground
    X.fillStyle='#1a0a2e';X.fillRect(sx,py,pw,ph);X.fillStyle='#2a1540';X.fillRect(sx,py,pw,4);
    X.strokeStyle='rgba(128,0,255,0.15)';X.lineWidth=1;X.strokeRect(sx,py,pw,ph);
  }
}

function drawPlayer(){
  if(P.dead){X.globalAlpha=0.3}
  const sx=P.x-camX,sy=P.y;
  const img=IM.rs;if(!img){X.globalAlpha=1;return}
  X.save();X.translate(sx+PW/2,sy+PH/2);
  if(P.face<0)X.scale(-1,1);
  if(P.ground&&Math.abs(P.vx)>1){X.translate(0,Math.sin(Date.now()/80)*3);X.rotate(Math.sin(Date.now()/120)*0.04)}
  if(!P.ground)X.rotate(clamp(P.vy*0.015,-0.2,0.2)*P.face);
  X.drawImage(img,-PW/2,-PH/2,PW,PH);
  X.restore();
  X.globalAlpha=1;
  if(P.ground){X.fillStyle='rgba(0,0,0,0.12)';X.beginPath();X.ellipse(sx+PW/2,P.y+PH+2,PW/2+2,4,0,0,Math.PI*2);X.fill()}
}

function drawEnemy(e){
  if(!e[6])return;
  const sx=e[0]-camX,sy=e[1];if(sx<-40||sx>W+40)return;
  const tp=e[2];
  if(tp===0){// guard
    X.fillStyle='#776688';X.fillRect(sx+2,sy,26,28);X.fillStyle='#9988AA';X.fillRect(sx+4,sy-5,22,8);
    X.fillStyle='#554466';X.fillRect(sx+10,sy+28,10,6);
    X.fillStyle='#fff';X.beginPath();X.arc(sx+10,sy+10,3,0,Math.PI*2);X.fill();
    X.beginPath();X.arc(sx+20,sy+10,3,0,Math.PI*2);X.fill();
    X.fillStyle='#222';X.beginPath();X.arc(sx+10,sy+10,1.5,0,Math.PI*2);X.fill();
    X.beginPath();X.arc(sx+20,sy+10,1.5,0,Math.PI*2);X.fill();
    // spear
    X.fillStyle='#AAA';X.fillRect(sx+28,sy-10,3,40);X.fillStyle='#CCC';
    X.beginPath();X.moveTo(sx+24,sy-10);X.lineTo(sx+29.5,sy-20);X.lineTo(sx+35,sy-10);X.fill();
  }else if(tp===1){// forest slime
    const bob=Math.sin(Date.now()/300+e[0])*3;
    X.fillStyle='#66BB6A';X.beginPath();X.ellipse(sx+15,sy+15+bob,16,14,0,0,Math.PI*2);X.fill();
    X.fillStyle='#81C784';X.beginPath();X.ellipse(sx+15,sy+10+bob,11,9,0,0,Math.PI*2);X.fill();
    X.fillStyle='#fff';X.beginPath();X.arc(sx+10,sy+10+bob,3.5,0,Math.PI*2);X.fill();
    X.beginPath();X.arc(sx+20,sy+10+bob,3.5,0,Math.PI*2);X.fill();
    X.fillStyle='#333';X.beginPath();X.arc(sx+11,sy+10+bob,1.8,0,Math.PI*2);X.fill();
    X.beginPath();X.arc(sx+21,sy+10+bob,1.8,0,Math.PI*2);X.fill();
  }else{// dark minion
    const bob=Math.sin(Date.now()/250+e[0])*4;
    X.fillStyle='#4A148C';X.beginPath();X.ellipse(sx+15,sy+15+bob,16,14,0,0,Math.PI*2);X.fill();
    X.fillStyle='#7B1FA2';X.beginPath();X.ellipse(sx+15,sy+10+bob,11,9,0,0,Math.PI*2);X.fill();
    X.fillStyle='#FF0040';X.beginPath();X.arc(sx+10,sy+10+bob,3,0,Math.PI*2);X.fill();
    X.beginPath();X.arc(sx+20,sy+10+bob,3,0,Math.PI*2);X.fill();
    // horns
    X.fillStyle='#6A1B9A';
    X.beginPath();X.moveTo(sx+6,sy+2+bob);X.lineTo(sx+3,sy-8+bob);X.lineTo(sx+12,sy+4+bob);X.fill();
    X.beginPath();X.moveTo(sx+24,sy+2+bob);X.lineTo(sx+27,sy-8+bob);X.lineTo(sx+18,sy+4+bob);X.fill();
  }
}

function drawBoss(){
  if(!boss.active||boss.hp<=0)return;
  const sx=boss.x-camX,sy=boss.y;if(sx<-100||sx>W+100)return;
  const img=IM.ts;
  const bob=Math.sin(Date.now()/250)*6;
  if(img)X.drawImage(img,sx,sy+bob,90,80);
  else{X.fillStyle='#7B1FA2';X.beginPath();X.arc(sx+45,sy+40+bob,35,0,Math.PI*2);X.fill()}
  // HP bar
  rr(X,sx,sy-18,90,10,4,'rgba(0,0,0,0.6)');
  rr(X,sx+2,sy-16,(boss.hp/boss.mx)*86,6,3,'#FF0040');
  X.fillStyle='#fff';X.font=FN(9);X.textAlign='center';X.fillText('트러핑',sx+45,sy-22);
}

function render(){
  X.clearRect(0,0,W,H);
  if(scr==='title'){
    drawBG('sunset');
    const hs=1+Math.sin(t*3)*0.06;
    X.save();X.translate(W/2,160);X.scale(hs,hs);heart(X,0,0,42,'#FF6B9D');X.restore();
    X.fillStyle='#E84B7A';X.font='bold '+FN(28);X.textAlign='center';X.fillText('사랑의 하츄핑',W/2,248);
    X.fillStyle='#9D6BA0';X.font=FN(14);X.fillText('탈출 어드벤처',W/2,272);
    // Characters
    const b1=Math.sin(t*1.5)*6,b2=Math.sin(t*1.5+1)*6;
    if(IM.rp)X.drawImage(IM.rp,40,350+b1,IM.rp.width*(250/IM.rp.height),250);
    if(IM.hp)X.drawImage(IM.hp,W/2+20,420+b2,IM.hp.width*(150/IM.hp.height),150);
    btnStart={x:W/2-80,y:620,w:160,h:50};
    rr(X,btnStart.x,btnStart.y,btnStart.w,btnStart.h,25,'#FF6B9D');
    X.fillStyle='#fff';X.font='bold '+FN(20);X.fillText('모험 시작! 💫',W/2,652);
  }
  else if(scr==='story'){
    const s=stQ[stI];if(!s)return;
    drawBG(s.bg||'sunset');
    if(s.img&&IM[s.img]){const im=IM[s.img];const ih=Math.min(im.height,200);const iw=im.width*(ih/im.height);
      X.drawImage(im,W/2-iw/2,H*0.38-ih/2,iw,ih)}
    const dg=X.createLinearGradient(0,H*0.68,0,H);
    dg.addColorStop(0,'transparent');dg.addColorStop(0.1,'rgba(0,0,0,0.8)');dg.addColorStop(1,'rgba(0,0,0,0.95)');
    X.fillStyle=dg;X.fillRect(0,H*0.64,W,H*0.36);
    if(s.sp){rr(X,16,H*0.71,Math.max(80,s.sp.length*11+18),24,10,'rgba(255,107,157,0.3)','rgba(255,107,157,0.5)');
      X.fillStyle='#FFB8D4';X.font=FN(12);X.textAlign='left';X.fillText(s.sp,26,H*0.71+17)}
    X.fillStyle='#fff';X.font=FN(14);X.textAlign='left';
    stTx.split('\n').forEach((l,i)=>X.fillText(l,20,H*0.71+(s.sp?36:14)+i*24));
    if(!stDn){X.fillStyle='rgba(255,255,255,0.5)';X.font=FN(14);
      const ls=stTx.split('\n');X.fillText('|',20+X.measureText(ls[ls.length-1]).width,H*0.71+(s.sp?36:14)+(ls.length-1)*24)}
    if(stDn){X.globalAlpha=0.3+Math.sin(Date.now()/300)*0.3;X.fillStyle='#fff';X.font=FN(11);X.textAlign='right';X.fillText('▼ 터치',W-16,H-12);X.globalAlpha=1}
  }
  else if(scr==='play'){
    const L=LEVELS[lv];if(!L)return;
    drawBG(L.bg);
    L.plat.forEach(drawPlat);
    items_live.forEach(it=>{if(!it[3])return;const sx=it[0]-camX,sy=it[1]+Math.sin(Date.now()/350+it[0])*4;
      if(sx<-15||sx>W+15)return;heart(X,sx,sy,9,'#FF6B9D')});
    npcs_live.forEach(n=>{const sx=n.x-camX;if(sx<-50||sx>W+50)return;
      const img=n.spr==='ba'?IM.ba:IM.ch;
      if(img)X.drawImage(img,sx-25,n.y-25,55,55);
      if(!n.done){X.fillStyle='#FFD700';X.font='bold '+FN(16);X.textAlign='center';X.fillText('!',sx+5,n.y-35)}});
    enemies_live.forEach(drawEnemy);
    drawBoss();
    drawPlayer();
    parts.forEach(p=>{X.globalAlpha=p.l;X.fillStyle=p.c;X.beginPath();X.arc(p.x-camX,p.y,p.s*p.l,0,Math.PI*2);X.fill()});
    X.globalAlpha=1;
    // HUD
    rr(X,8,8,175,30,12,'rgba(0,0,0,0.55)');
    X.fillStyle='#fff';X.font=FN(12);X.textAlign='left';X.fillText('❤️x'+lives+'  💗x'+hts+'  '+L.name,16,28);
    // NPC dialog
    if(npcMsg&&npcT>0){rr(X,20,H-210,W-40,60,12,'rgba(0,0,0,0.88)');
      X.fillStyle='#fff';X.font=FN(13);X.textAlign='center';
      npcMsg.split('\n').forEach((l,i)=>X.fillText(l,W/2,H-190+i*22))}
    // Touch controls
    const la=tL?0.35:0.18,ra=tR?0.35:0.18,ja=tJ?0.4:0.2;
    X.fillStyle=`rgba(255,255,255,${la})`;X.beginPath();X.arc(55,H-60,28,0,Math.PI*2);X.fill();
    X.fillStyle='#fff';X.font=FN(16);X.textAlign='center';X.fillText('◀',55,H-54);
    X.fillStyle=`rgba(255,255,255,${ra})`;X.beginPath();X.arc(130,H-60,28,0,Math.PI*2);X.fill();
    X.fillStyle='#fff';X.fillText('▶',130,H-54);
    X.fillStyle=`rgba(255,107,157,${ja})`;X.beginPath();X.arc(W-60,H-60,32,0,Math.PI*2);X.fill();
    X.fillStyle='#fff';X.font='bold '+FN(14);X.fillText('JUMP',W-60,H-54);
    // Level complete
    if(lvDone){X.fillStyle=`rgba(255,255,255,${0.2+Math.sin(Date.now()/150)*0.15})`;X.fillRect(0,0,W,H);
      X.fillStyle='#E84B7A';X.font='bold '+FN(22);X.textAlign='center';X.fillText('🎉 스테이지 클리어!',W/2,H/2)}
  }
  else if(scr==='ending'){
    drawBG('sunset');
    heart(X,W/2,100,38,'#FF6B9D');
    X.fillStyle='#E84B7A';X.font='bold '+FN(26);X.textAlign='center';X.fillText('사랑의 하츄핑',W/2,180);
    X.fillStyle='#9D6BA0';X.font=FN(13);
    ['로미와 하츄핑은 사랑의 힘으로','트러핑을 물리치고 평화를 되찾았어요!','','앞으로도 둘의 모험은 계속됩니다...'].forEach((l,i)=>X.fillText(l,W/2,220+i*24));
    const b1=Math.sin(t*1.5)*5,b2=Math.sin(t*1.5+1)*5;
    if(IM.rp)X.drawImage(IM.rp,30,360+b1,IM.rp.width*(220/IM.rp.height),220);
    if(IM.hp)X.drawImage(IM.hp,W/2+30,430+b2,IM.hp.width*(130/IM.hp.height),130);
    X.fillStyle='#E84B7A';X.font='bold '+FN(18);X.fillText('🌟 게임 클리어! 🌟',W/2,610);
    X.fillStyle='#9D6BA0';X.font=FN(11);X.fillText('하트 '+hts+'개 수집',W/2,636);
    btnEnd={x:W/2-55,y:655,w:110,h:38};
    rr(X,btnEnd.x,btnEnd.y,btnEnd.w,btnEnd.h,16,'#E84B7A');
    X.fillStyle='#fff';X.font=FN(14);X.fillText('다시 하기 🔄',W/2,680);
  }
  if(trA>0){X.fillStyle=`rgba(0,0,0,${trA})`;X.fillRect(0,0,W,H)}
}

// ===== INPUT =====
document.addEventListener('keydown',e=>{keys[e.key]=true;if(scr==='story'&&(e.key===' '||e.key==='Enter'))advSt()});
document.addEventListener('keyup',e=>{keys[e.key]=false});
function gp(e){const r=C.getBoundingClientRect();const tt=e.changedTouches?e.changedTouches[0]:e;return{x:(tt.clientX-r.left)*(W/r.width),y:(tt.clientY-r.top)*(H/r.height)}}
function inR(p,r){return p.x>=r.x&&p.x<=r.x+r.w&&p.y>=r.y&&p.y<=r.y+r.h}
function inC(p,cx,cy,r){return(p.x-cx)**2+(p.y-cy)**2<=r*r}

function onDown(e){e.preventDefault();const p=gp(e);if(trA>0.3)return;
  if(scr==='title'&&inR(p,btnStart)){lives=5;hts=0;lv=0;initLv(0);
    goStory(ST_OPENING,()=>goStory(ST_FESTIVAL,()=>goStory(ST_LIBRARY,()=>goStory(ST_DECIDE,()=>{doTrans('play')}))))}
  if(scr==='story')advSt();
  if(scr==='ending'&&inR(p,btnEnd))location.reload();
  if(scr==='play'){if(inC(p,55,H-60,35))tL=true;if(inC(p,130,H-60,35))tR=true;if(inC(p,W-60,H-60,40))tJ=true}}
function onUp(e){e.preventDefault();tL=false;tR=false;tJ=false}
function onMove(e){e.preventDefault();if(scr!=='play')return;tL=false;tR=false;tJ=false;
  for(const tt of(e.touches||[e])){const r=C.getBoundingClientRect();
    const p={x:(tt.clientX-r.left)*(W/r.width),y:(tt.clientY-r.top)*(H/r.height)};
    if(inC(p,55,H-60,35))tL=true;if(inC(p,130,H-60,35))tR=true;if(inC(p,W-60,H-60,40))tJ=true}}
C.addEventListener('mousedown',onDown);C.addEventListener('mouseup',onUp);
C.addEventListener('touchstart',onDown,{passive:false});C.addEventListener('touchend',onUp,{passive:false});
C.addEventListener('touchmove',onMove,{passive:false});

// ===== LOOP =====
function loop(){update();render();requestAnimationFrame(loop)}
function wait(){if(iL<iT){X.fillStyle='#1a0a2e';X.fillRect(0,0,W,H);X.fillStyle='#FF6B9D';X.font=FN(16);X.textAlign='center';
  X.fillText('로딩 중...',W/2,H/2);rr(X,W/4,H/2+20,W/2,8,4,'rgba(255,255,255,0.1)');
  rr(X,W/4,H/2+20,W/2*(iL/iT),8,4,'#FF6B9D');requestAnimationFrame(wait)}else requestAnimationFrame(loop)}
wait();
</script>
</body>
</html>'''

with open(out_path, "w", encoding="utf-8") as f:
    f.write(html)
print(f"Built: {out_path} ({os.path.getsize(out_path)//1024}KB)")

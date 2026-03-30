import{useState,useEffect,useCallback,useRef}from"react";
const R="data:image/webp;base64,UklGRm4DAABXRUJQVlA4WAoAAAAQAAAALAAALAAAQUxQSBoCAAABoHPb1rE9n9A+57pi2zZ6m52dVO9IpSqVbVTJW8W2bdu2nc/GjWsXL88TEROAwhXnFRmrAKCZIijbeUR1SGYo2rwnv3eEZoZcYfw/X5YUyQBB2d/SEMI/FWDnvKpeYBLSv/tAzQAU0VmMGPOWWImbk90A2EeSf8VD4Ew8hpNP63X/OX7GyaeZBW/i0Jfp/ZFk+ItHkwdeYKsY9e8ePEoSksyCN4JD16jxYZL8n5vEWaEILv6cbPzAkKbPFOaqrX7bjd1MUr7zIlYAKjscY8Tb//eBsysCDP4vjdku+7U6MVKH9sdJJlzYg+NQTEwEmJAwkEz5afSvJWEqaL6bISHJEJZg3I3xTcoUnkiZ14wDcybMAkbe215dpLAUrRkx9xD+mlQbKA5BYYuU+sT/Qy45z1Z2EBS+ov17kkziQKb/sSEcLBW1lv8cAnMGroODrQKHmO7Y+jVEf5+qqGIE708yro8xjHoAAmvFOf5Q2TX5lz3Ew1pEX6b3VfV+mA47h5nkRBTHQj4sJmKkaBbzYlFV1PiZfeCMPJbynyZQOKxIZ8IbiX/CbHjASTtuhbNRtEz+qiMKQOTtNaiNx0gugwMAj/lvIUaynA1Fczi0+ywQE8WT83DIKaj83wA4C0UDjhSfR9F/TpiIFLuf1ofmUf7fU1ALlP2a5KWoyu1wBvBYk4yBzwVA/7oQm1F8rZKXucisWZIPJ0YZ750NVlA4IC4BAACwBwCdASotAC0APzmUvVivKiYjqrqoAeAnCWoAz/0AMAG8e4AAxQRdaCV+RJ6k/2UP5qDK0npoaKNMYZA/+WC/AWY7yIDAAP7TnXgQsQZx8xya+BjcdaKcwAVirdzk7LdTKYoVdN8Cd2O86lKQVCtihpEF4kPxZjLfN2B5oZ5al9JfqFkUjWlXdQX+9ub+Y/a5dlUACEHWFmQOohxqSPbFoiTTgcD+QiltjiWL7Hye8RTfQg00xr50p+Fut2JzAGwfGC9izhxb6o3SQb6kW0rWkiuzVhs++sZciAPYn+jiL96voqAklqgVpRF+ENCWGE/0OuTQBPp5BUnN+ll/b/29Pn9hBc+Wh8w4st9RYmNlMW1A2EKApusQ+rMXDYfeoAQZf2FXbXEVOgbIKAAAAA==";
const H="data:image/webp;base64,UklGRmgEAABXRUJQVlA4WAoAAAAQAAAALAAALAAAQUxQSGICAAABoLRtmyHJHtD7fRFje3a2sdKxbdu2V+esbNu2bdu2bSPi+95FZmVlTERMALoNAKCiAbVBUFIxbPUNpwHAShc8eNsRUwApoNjvB9JuGjnpSlb/PS6KtBawB5kz+eVv9JRzIm/vGQQag3YnGPKzZZKZzKz6fzwZUQEgdBWxHjOr5qz3nCYDMzfdaAykK93dU03TxCOG3WbkX0cjSLMe2I7dmb/1Bj1n8hiERopxH7h1Vc0kLdkMaAPRAW/Q2KIbq4kHo0eDgIv5PwsmP7ZJwIpMLMKdETupPstcwvnTaGiHgJWZWea7gZAGN3oqQuOaiHWCkb/RyyQe0yliY2aWzbwHoYOe5amQ8U1BrUQ8wlzsk551wIQvaMXeDxXR/tf8w+KZT0MBBFxEL5f8fERAdMhf2cplblEJWJvO4u4/DYUiYLU/bClIPBMBIgO/obG42z8TRBGxCRNb9iaJxyMAEcd5a00z3+uvUjmDbf3zSSdnWoCAytktOT/ck1bj9vfGiAAg4XVaK+Rfn9JrzN+bD62g71eesrfS1MnDoBV5nyRTbsM70ZwToUDAkfmlm520Fhon3wgR1cl9MfeQB5icpDWzBsaVECoCKCC301JydmkdzH4bDqlABdpDep7rJL9MTf59hckr/i9PRkBTAebussvCEV/TvM5srUtJy9nIx/urNIIoqu9ndkzcD0d8SZLfn9gXgm41xp44nz//Sqdl/uc3CwYu2XLbFYcBgjYFg7eb/KRn1r4vAbVB0P6B/Pf/d49a5u3/r4JKiDEIWpcY8TC5HdBnPCAorjL2urMHxYilW7QFVlA4IOABAABwCgCdASotAC0APzmCulSvKCWjLjgMyeAnCWwAx0mmC2pn6RQtZs92ZwimhJjoYsxZ+Wjn+l5Caj4LJtzbQeaFgfEwWNHfC0UOksWoAHvo7guChG4OLveinNyCAAD++urv54qm3km+PhjqWeUwSbV/95Vu6xZZB4vQ19gELe+54kuerglrmUTNiU8NG6PAxOuZtTAPPjOvzUcislnTCjSjvFwiilQJcl4+hNaAJkelwSi4fNVFmZLkjHbKFaGZLBuMLaYatvgWkKyxQAZFtAp5nnsN1hmy5zHEmteKbFZHF9yQnhzdq436dGzhRDb8Ahrh8H24bedECoV+u0ucOQht9PFlzcuz+XoIG1nitld7GrO7c/vOy+RpDZuQutiLlL4UiP91Sxg/upLz94xbn9ZHVkmJ3EzUbAqYuot8auiy/FJGjozQTLeZx9l7lnar/EzcghccSyCyxyfUuzk+TOg/dyiOMQtjNr/DX/l8GT2/T5/+fwKKWokh9Ki39N6zf/mGM6JI93mRDsGaHa0YNwUwQrtqrYioXWoQy5N+QFIFxYvPFv2vIyfpdm83KGOQv3BIqyAb821+/L2lg3lVUlFVuaK4GmV6Os+g4jm7QGaf0wHxMRgVjiRjVKVcyBcAAAA=";
const HK="data:image/webp;base64,UklGRtYCAABXRUJQVlA4IMoCAACwEACdASpQAEQAPt1YpU6opKMiL1Vc6RAbiWIA0LsU0BV6UtGHZ3m3LLnCO9aSa9EuEbsqTaR4vfLX4rm1Y1SqJeg9MJ46OA8/B3vH896+H90bn0d9n78oThw5W1baWlCm14ympXLGyBopxpL++yoekkqCDqam5ssmpmw8xgkCxU8XDGFxJN4NNMxQTfQAAP738QuiPwRTVl5dH7PqaxgRn8F2h5+/knt1Gz/2gSwxbnVUPg0rl16hh/JdPFzqL2k4ermuTkicq+x3ob++Oykqvb9dJUiolooDc/cCh5PaeHSjdf8iegQSlwO9CDfG25EPVZmIDOnZezicUS3fGAIonpvq/gHBefSxUH1W261KByg8xnIOk8Tx5eRQXt5fQocXEGUL8lDbajiuP7vKm2zLIIG+TTcjbwnCVDmHPCxzuRN6Yy5I5i8hDPXgUND8WzSrfrGMFZ/cLGueSRW/mff2mrPVhuYctNo71top09K/OBYHYYcGDyajnvdp45HBKFF4gtdoiVD5SGeR0l8qM3VJXj78YzgOsWL5wZwLHxpIOs99KJTh71SK2/JQy9lgfxYqC6ZMua/uNJAI8+QwmJQrJwLVjJGFsPegQqeWxjPSZrDAs0v3RZ5PxNlzrB9db/i9OoJn9Tfe8as3g+N8lYIzyaljdAsmWX0w+oJAQ4Zuu7Z+UWuOECbq2qrivVTHejyYpS7J6hMOYyN4gaYL/zZi6/9w/6/B12vMPukRSGHrWXj7aSBjkP+0+BEthfpjC3+i8kmsO5fRJzA1D0L5fItjydmXBACPdpYNrzhmmsNxKnoYRkVCUBMd3s/9TbuybnusGoeI0vxrL7quvVRcccr2OpjcqrDc5h96jpwUiqA+bfOiuII11De+XQnLZwb+j8dm8sliBlN0qKniq7hyoV8DlImD5gd1FUfbbw5gvDPj0BuQkGBdPY2QAAA=";
const TR="data:image/webp;base64,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";
const svgP=(c,ic)=>`data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="52" r="24" fill="${c}"/><circle cx="50" cy="32" r="18" fill="${c}"/><circle cx="44" cy="30" r="4" fill="white"/><circle cx="56" cy="30" r="4" fill="white"/><circle cx="44" cy="30" r="2.5" fill="#222"/><circle cx="56" cy="30" r="2.5" fill="#222"/><text x="50" y="68" text-anchor="middle" font-size="22">${ic}</text></svg>`)}`;
const DB={hatchu:{n:'하츄핑',ic:'💗',tc:'#ff6b9d',img:H,hp:50,atk:14,def:10,sk:[{n:'러브 어택',pw:15,e:'💗'},{n:'하트 빔',pw:25,e:'💖'},{n:'치유의 눈물',pw:-25,e:'💧'}]},
kiki:{n:'키키핑',ic:'🍭',tc:'#a8e06e',hp:30,atk:9,def:6,sk:[{n:'장난 마법',pw:10,e:'🍭'},{n:'사탕 폭탄',pw:18,e:'💥'}]},
kkong:{n:'꽁꽁핑',ic:'🧊',tc:'#a8d8ea',hp:35,atk:11,def:7,sk:[{n:'얼음 바람',pw:13,e:'❄️'},{n:'프리즈 샷',pw:21,e:'🧊'}]},
trup:{n:'트러핑',ic:'🦹',tc:'#6a0dad',img:TR,hp:80,atk:20,def:13,sk:[{n:'다크 캐논',pw:22,e:'🌑'},{n:'배신의 사슬',pw:30,e:'⛓️'}]}};
const WLD=['kiki','kkong'];
const mk=(k,lv)=>{const d=DB[k];return{key:k,...d,level:lv,mhp:d.hp+lv*4,hp:d.hp+lv*4,a:d.atk+Math.floor(lv*1.8),d:d.def+Math.floor(lv*1.2),exp:0}};
const pI=p=>p.img||svgP(p.tc,p.ic);
const dmg=(a,d)=>Math.max(1,a-Math.floor(d*0.4))+Math.floor(Math.random()*5);
const STORY=[
{bg:'linear-gradient(180deg,#ffd1e8,#ffe8f5)',sp:'하트킹 👑',tx:'로미야, 열 살이 됐으니\n짝꿍 티니핑을 골라야 한단다.',ci:HK},
{bg:'linear-gradient(180deg,#ffb8d4,#ffdee9)',sp:'로미 💖',tx:'(왕궁에 다양한 티니핑이 있지만...)',ci:R},
{bg:'linear-gradient(180deg,#ffb8d4,#ffdee9)',sp:'로미 💖',tx:'다 아니야! 이 아이들은 내 소울메이트가 아니야!',ci:R},
{bg:'linear-gradient(180deg,#ff9ecf,#ffdee9)',sp:'로미 💖',tx:'책에서 본 \'하츄핑\'...\n처음 본 순간 반해버렸어!\n난 하츄핑이 아니면 안 돼!',ci:R},
{bg:'linear-gradient(180deg,#d4c1ec,#c8b6e2)',sp:'하트킹 👑',tx:'하츄핑은 먼 아이즈 마을에 있어.\n위험하다, 로미야!',ci:HK},
{bg:'linear-gradient(180deg,#ff6b9d,#e84b7a)',sp:'로미 💖',tx:'포기 안 해! 직접 찾으러 갈 거야!\n\n(로미는 왕궁을 나서 모험을 떠났어요!)',ci:R},
];
const M=[[3,3,3,3,3,3,3,3,3],[3,7,5,0,1,0,2,0,3],[3,5,5,5,5,5,0,0,3],[3,0,0,0,0,5,0,1,3],[3,0,2,1,0,5,0,0,3],[3,0,0,0,0,5,5,0,3],[3,1,0,2,0,0,5,0,3],[3,0,0,0,1,0,5,8,3],[3,3,3,3,3,3,3,3,3]];
const MW=9,MH=9,TS=52;

export default function App(){
 const[scr,setScr]=useState('title');
 const[si,setSi]=useState(0);
 const[txt,setTxt]=useState('');
 const[dn,setDn]=useState(false);
 const[party,setPty]=useState([]);
 const[px,setPx]=useState(1);const[pz,setPz]=useState(2);
 const stRef=useRef(0);
 const cRef=useRef(null);
 const[bat,setBat]=useState(null);
 const[log,setLog]=useState('');
 const[bon,setBon]=useState(true);
 const[skO,setSkO]=useState(false);
 const[ctch,setCtch]=useState(null);
 const[win,setWin]=useState(null);
 const[fmsg,setFmsg]=useState(null);

 // Story typewriter
 useEffect(()=>{if(scr!=='story')return;const t=STORY[si]?.tx||'';setTxt('');setDn(false);let i=0;
  const tm=setInterval(()=>{if(i<t.length){setTxt(t.slice(0,i+1));i++}else{setDn(true);clearInterval(tm)}},35);
  return()=>clearInterval(tm)},[si,scr]);

 const nxSt=useCallback(()=>{if(!dn){setTxt(STORY[si]?.tx||'');setDn(true);return}
  if(si<STORY.length-1)setSi(i=>i+1);
  else{setPty([mk('hatchu',5)]);setPx(1);setPz(2);stRef.current=0;setScr('field');
   setFmsg('🌸 풀밭→배틀 | 하트로즈🍰(좌상)→HP회복 | 🦹보스(Lv8+)');setTimeout(()=>setFmsg(null),4500)}
 },[dn,si]);

 // Draw field
 const drawF=useCallback((x,z)=>{const c=cRef.current?.getContext('2d');if(!c)return;
  c.clearRect(0,0,420,750);const cx=x*TS-210+TS/2,cy=z*TS-375+TS/2;
  c.save();c.translate(-cx,-cy);
  const tc={0:'#7ec850',1:'#7ec850',2:'#7ec850',3:'#666',4:'#4da6ff',5:'#c9a96e',6:'#7ec850',7:'#7ec850',8:'#7ec850'};
  for(let zz=0;zz<MH;zz++)for(let xx=0;xx<MW;xx++){const t=M[zz][xx],px2=xx*TS,py=zz*TS;
   c.fillStyle=tc[t];c.fillRect(px2,py,TS,TS);
   if(t===1){c.fillStyle='#ff69b4';c.beginPath();c.arc(px2+14,py+18,3,0,Math.PI*2);c.fill();c.fillStyle='#ffd700';c.beginPath();c.arc(px2+32,py+28,3,0,Math.PI*2);c.fill()}
   if(t===2){c.fillStyle='#8B4513';c.fillRect(px2+18,py+26,14,20);c.fillStyle='#228b22';c.beginPath();c.arc(px2+25,py+18,15,0,Math.PI*2);c.fill()}
   if(t===3){c.fillStyle='#555';c.fillRect(px2,py,TS,TS)}
   if(t===7){c.fillStyle='#FFB8D4';c.fillRect(px2+4,py+16,44,30);c.fillStyle='#FF6B9D';c.beginPath();c.moveTo(px2+1,py+16);c.lineTo(px2+26,py+2);c.lineTo(px2+51,py+16);c.fill();c.fillStyle='#fff';c.font='12px sans-serif';c.fillText('♥',px2+20,py+13)}
   if(t===8){c.fillStyle='#3a1a5e';c.fillRect(px2+2,py+2,TS-4,TS-4);c.fillStyle='#fff';c.font='22px sans-serif';c.fillText('🦹',px2+13,py+35)}}
  const img=new Image();img.src=R;c.drawImage(img,x*TS+2,z*TS-10,TS-4,TS-4);
  c.restore()},[]);
 useEffect(()=>{if(scr==='field')drawF(px,pz)},[scr,px,pz,drawF]);

 const move=useCallback(d=>{if(scr!=='field')return;let nx=px,nz=pz;
  if(d==='u')nz--;if(d==='d')nz++;if(d==='l')nx--;if(d==='r')nx++;
  if(nx<0||nx>=MW||nz<0||nz>=MH)return;const t=M[nz][nx];
  if([2,3,6].includes(t))return;
  if(t===7)return;
  if(t===8){if(!party[0]||party[0].level<8){setFmsg('⚠️ Lv.8 이상 필요!');setTimeout(()=>setFmsg(null),2000);return}
   setPx(nx);setPz(nz);setTimeout(()=>startB(mk('trup',10)),300);return}
  setPx(nx);setPz(nz);stRef.current++;
  if((t===0||t===1)&&stRef.current>7&&Math.random()<0.16){stRef.current=0;
   const wk=WLD[Math.floor(Math.random()*WLD.length)];
   startB(mk(wk,Math.max(2,party[0].level+Math.floor(Math.random()*3)-1)))}
 },[scr,px,pz,party]);

 useEffect(()=>{const h=e=>{const m={ArrowUp:'u',ArrowDown:'d',ArrowLeft:'l',ArrowRight:'r',w:'u',s:'d',a:'l',d:'r'};
  if(m[e.key]&&scr==='field')move(m[e.key]);
  if((e.key===' '||e.key==='Enter')&&scr==='story')nxSt()};
  window.addEventListener('keydown',h);return()=>window.removeEventListener('keydown',h)});

 const fAct=()=>{if(px<=2&&pz<=2){const np=[...party];np.forEach(p=>p.hp=p.mhp);setPty(np);setFmsg('🍰 HP 회복!')}
  else setFmsg('풀밭에서 기운이 느껴진다...');setTimeout(()=>setFmsg(null),2000)};

 // Battle
 const startB=en=>{setBat({en,my:{...party[0]},ov:false});setLog(`${en.ic} ${en.n} 등장!`);setBon(true);setSkO(false);setCtch(null);setWin(null);setScr('battle')};
 const updBat=(ne,nm)=>setBat(b=>({...b,en:ne||b.en,my:nm||b.my}));
 const doAtk=()=>{if(!bat||bat.ov)return;setBon(false);const d=dmg(bat.my.a,bat.en.d);const ne={...bat.en,hp:bat.en.hp-d};
  setLog(`${bat.my.n} 공격! ${d}뎀!`);updBat(ne);setTimeout(()=>{if(ne.hp<=0)doWin(ne);else eT(ne,bat.my)},500)};
 const uSk=sk=>{if(!bat||bat.ov)return;setSkO(false);setBon(false);
  if(sk.pw<0){const h=Math.abs(sk.pw);const nm={...bat.my,hp:Math.min(bat.my.mhp,bat.my.hp+h)};setLog(`${sk.n}! HP+${h}`);updBat(null,nm);setTimeout(()=>eT(bat.en,nm),500)}
  else{const d=dmg(bat.my.a+sk.pw,bat.en.d);const ne={...bat.en,hp:bat.en.hp-d};setLog(`${sk.n}! ${d}뎀!`);updBat(ne);setTimeout(()=>{if(ne.hp<=0)doWin(ne);else eT(ne,bat.my)},500)}};
 const doWin=ne=>{const exp=ne.level*10+15;const np=[...party];np[0].exp+=exp;let lm='';
  if(np[0].exp>=np[0].level*25){np[0].level++;np[0].mhp+=5;np[0].hp=np[0].mhp;np[0].a+=2;np[0].d+=1;np[0].exp=0;lm=`\nLv.${np[0].level}!`}else np[0].hp=bat.my.hp;
  setPty(np);setBat(b=>({...b,ov:true}));
  setWin(ne.key==='trup'?{t:'🏆 클리어!',d:'트러핑 격파!\n사랑이 이겼다!'}:{t:'🎉 승리!',d:`EXP+${exp}${lm}`})};
 const eT=(en,my)=>{const sk=en.sk[Math.floor(Math.random()*en.sk.length)];const d=dmg(en.a+Math.floor(sk.pw*0.5),my.d);
  const nm={...my,hp:my.hp-d};setLog(`${en.n}의 ${sk.n}! ${d}뎀!`);updBat(en,nm);
  setTimeout(()=>{if(nm.hp<=0){setBat(b=>({...b,ov:true}));setWin({t:'😢 패배',d:'하트로즈로...'});const np=[...party];np.forEach(p=>p.hp=p.mhp);setPty(np);setPx(1);setPz(2)}else setBon(true)},400)};
 const doC=()=>{if(!bat||bat.ov||bat.en.key==='trup'){setLog('포획 불가!');return}setBon(false);setCtch('...');
  const rate=Math.min(85,Math.max(15,70-(bat.en.hp/bat.en.mhp)*55));
  setTimeout(()=>{if(Math.random()*100<rate){setCtch(`✨${bat.en.n} 포획!`);const np=[...party];np.push(mk(bat.en.key,bat.en.level));setPty(np);setBat(b=>({...b,ov:true}));
   setTimeout(()=>{setCtch(null);setScr('field')},1500)}
  else{setCtch('빠져나갔다!');setTimeout(()=>{setCtch(null);eT(bat.en,bat.my)},800)}},1200)};
 const doR=()=>{if(bat?.en.key==='trup'){setLog('도망 불가!');return}
  if(Math.random()<0.7)setScr('field');else{setLog('실패!');setBon(false);setTimeout(()=>eT(bat.en,bat.my),400)}};
 const endB=()=>{setWin(null);setScr('field')};
 const hp=(v,m)=>Math.max(0,v/m*100);

 return(<div style={{width:420,height:750,position:'relative',overflow:'hidden',borderRadius:20,background:'#1a0a2e',boxShadow:'0 0 60px rgba(255,107,157,0.3)',fontFamily:"'Jua',sans-serif",userSelect:'none'}}>
  <link href="https://fonts.googleapis.com/css2?family=Jua&display=swap" rel="stylesheet"/>

  {scr==='title'&&<div style={{position:'absolute',inset:0,background:'linear-gradient(170deg,#FFE4F0,#FFDEE9 25%,#B5EAEA 55%,#E8D5F5)',display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'center',textAlign:'center'}}>
   <div style={{fontSize:55,animation:'hb 1.5s infinite'}}>💗</div>
   <div style={{fontSize:30,color:'#E84B7A',textShadow:'0 2px 0 #fff'}}>사랑의 하츄핑</div>
   <div style={{fontSize:13,color:'#9D6BA0',marginTop:4}}>티니핑 RPG 어드벤처</div>
   <div style={{display:'flex',gap:8,margin:'16px 0'}}>{[R,H].map((s,i)=><img key={i} src={s} style={{width:56,height:56,borderRadius:'50%',border:'3px solid #fff',objectFit:'cover',animation:`fc 3s ease-in-out infinite ${i*0.4}s`}} alt=""/>)}</div>
   <button onClick={()=>{setSi(0);setScr('story')}} style={{padding:'13px 44px',background:'linear-gradient(135deg,#ff6b9d,#E84B7A)',color:'#fff',border:'none',borderRadius:30,fontSize:20,fontFamily:'inherit',cursor:'pointer',boxShadow:'0 6px 20px rgba(255,107,157,0.45)'}}>모험 시작! 💫</button>
  </div>}

  {scr==='story'&&<div style={{position:'absolute',inset:0,background:STORY[si]?.bg||'#000',cursor:'pointer'}} onClick={nxSt}>
   {STORY[si]?.ci&&<img src={STORY[si].ci} style={{position:'absolute',bottom:185,left:'50%',transform:'translateX(-50%)',height:110,objectFit:'contain',filter:'drop-shadow(0 4px 18px rgba(0,0,0,0.5))'}} alt=""/>}
   <div style={{position:'absolute',bottom:0,left:0,right:0,background:'linear-gradient(180deg,transparent,rgba(0,0,0,0.7) 12%,rgba(0,0,0,0.92))',padding:'32px 20px 18px',minHeight:165}}>
    {STORY[si]?.sp&&<span style={{display:'inline-block',background:'rgba(255,107,157,0.3)',border:'1px solid rgba(255,107,157,0.5)',padding:'2px 10px',borderRadius:10,fontSize:13,color:'#FFB8D4',fontWeight:700,marginBottom:6}}>{STORY[si].sp}</span>}
    <div style={{color:'#fff',fontSize:16,lineHeight:1.8,whiteSpace:'pre-line',minHeight:48}}>{txt}{!dn&&<span style={{opacity:0.6}}>|</span>}</div>
    {dn&&<div style={{textAlign:'right',color:'rgba(255,255,255,0.35)',fontSize:11,marginTop:6,animation:'bl 1.2s infinite'}}>▼ 터치</div>}
   </div></div>}

  {scr==='field'&&<div style={{position:'absolute',inset:0}}>
   <canvas ref={cRef} width={420} height={750} style={{width:'100%',height:'100%'}}/>
   <div style={{position:'absolute',top:8,left:12,right:12,display:'flex',justifyContent:'space-between',zIndex:20}}>
    <span style={{background:'rgba(0,0,0,0.55)',color:'#fff',padding:'5px 10px',borderRadius:12,fontSize:11}}>🌸 Lv.{party[0]?.level||1} | HP {party[0]?.hp||0}/{party[0]?.mhp||0}</span>
    <span onClick={()=>{}} style={{background:'rgba(0,0,0,0.55)',color:'#fff',padding:'5px 10px',borderRadius:12,fontSize:11}}>🎒 x{party.length}</span>
   </div>
   {fmsg&&<div style={{position:'absolute',bottom:168,left:14,right:14,background:'rgba(0,0,0,0.88)',borderRadius:13,padding:11,color:'#fff',fontSize:12,lineHeight:1.5,zIndex:25}} onClick={()=>setFmsg(null)}>{fmsg}</div>}
   <div style={{position:'absolute',bottom:16,left:'50%',transform:'translateX(-50%)',width:126,height:126,zIndex:20}}>
    {[['u','▲',{top:0,left:42}],['d','▼',{bottom:0,left:42}],['l','◀',{top:42,left:0}],['r','▶',{top:42,right:0}]].map(([d,t,s])=>
     <div key={d} onMouseDown={()=>move(d)} onTouchStart={e=>{e.preventDefault();move(d)}} style={{position:'absolute',...s,width:42,height:42,background:'rgba(255,255,255,0.18)',border:'2px solid rgba(255,255,255,0.25)',borderRadius:11,color:'#fff',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>{t}</div>)}
   </div>
   <div onClick={fAct} style={{position:'absolute',bottom:48,right:14,width:48,height:48,borderRadius:'50%',background:'linear-gradient(135deg,#ff6b9d,#E84B7A)',color:'#fff',fontSize:11,fontWeight:700,border:'3px solid rgba(255,255,255,0.3)',cursor:'pointer',zIndex:20,display:'flex',alignItems:'center',justifyContent:'center'}}>조사</div>
  </div>}

  {scr==='battle'&&bat&&<div style={{position:'absolute',inset:0,background:'linear-gradient(180deg,#1a0a2e,#2d1b4e 40%,#1a1a3e)',display:'flex',flexDirection:'column'}}>
   <div style={{flex:1,position:'relative',minHeight:240}}>
    <div style={{position:'absolute',bottom:0,left:0,right:0,height:80,background:'linear-gradient(#3a2d6e,#2a1d4e)',borderTop:'2px solid rgba(255,255,255,0.1)',transform:'perspective(200px) rotateX(20deg)',transformOrigin:'bottom'}}/>
    <img src={pI(bat.en)} style={{position:'absolute',top:18,right:22,width:95,height:95,objectFit:'contain',filter:'drop-shadow(0 5px 12px rgba(0,0,0,0.5))'}} alt=""/>
    <img src={H} style={{position:'absolute',bottom:40,left:22,width:110,height:110,objectFit:'contain',filter:'drop-shadow(0 5px 12px rgba(0,0,0,0.5))'}} alt=""/>
    {ctch&&<div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.75)',display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'center',zIndex:25}}><div style={{width:50,height:50,background:'linear-gradient(180deg,#ff4d6d 50%,#fff 50%)',borderRadius:'50%',border:'3px solid #333'}}/><div style={{color:'#fff',fontSize:17,fontWeight:700,marginTop:14}}>{ctch}</div></div>}
    {win&&<div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',background:'rgba(0,0,0,0.85)',padding:'20px 28px',borderRadius:16,border:'2px solid #ff6b9d',textAlign:'center',zIndex:15}}>
     <h3 style={{color:'#FFD644',fontSize:19,marginBottom:6}}>{win.t}</h3><p style={{color:'rgba(255,255,255,0.7)',fontSize:13,marginBottom:10,whiteSpace:'pre-line'}}>{win.d}</p>
     <button onClick={endB} style={{padding:'8px 24px',background:'#ff6b9d',border:'none',borderRadius:16,color:'#fff',fontFamily:'inherit',fontSize:13,cursor:'pointer'}}>확인</button></div>}
   </div>
   <div style={{padding:'8px 12px 12px',display:'flex',flexDirection:'column',gap:5}}>
    <div style={{display:'flex',gap:6}}>
     {[bat.en,bat.my].map((p,i)=>{const h=hp(p.hp,p.mhp);return<div key={i} style={{flex:1,background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,padding:'6px 9px'}}>
      <div style={{color:'#fff',fontSize:12}}>{p.ic} {p.n}</div><div style={{color:'rgba(255,255,255,0.4)',fontSize:10}}>Lv.{p.level}</div>
      <div style={{width:'100%',height:6,background:'rgba(255,255,255,0.1)',borderRadius:3,marginTop:3,overflow:'hidden'}}><div style={{height:'100%',borderRadius:3,background:h<25?'linear-gradient(90deg,#f97316,#ef4444)':'linear-gradient(90deg,#4ade80,#22c55e)',width:h+'%',transition:'width 0.5s'}}/></div>
      <div style={{color:'rgba(255,255,255,0.35)',fontSize:9,marginTop:1}}>{Math.max(0,p.hp)}/{p.mhp}</div></div>})}
    </div>
    <div style={{background:'rgba(0,0,0,0.4)',borderRadius:8,padding:'6px 9px',color:'rgba(255,255,255,0.8)',fontSize:12,minHeight:30}}>{log}</div>
    {skO?<div style={{display:'flex',flexDirection:'column',gap:4}}>
     {bat.my.sk.map((s,i)=><button key={i} onClick={()=>uSk(s)} style={{padding:'8px 10px',background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,color:'#fff',fontFamily:'inherit',fontSize:12,cursor:'pointer',textAlign:'left'}}>{s.e} {s.n} ({s.pw<0?'회복'+Math.abs(s.pw):'위력'+s.pw})</button>)}
     <button onClick={()=>setSkO(false)} style={{padding:6,background:'none',border:'1px solid rgba(255,255,255,0.08)',borderRadius:8,color:'rgba(255,255,255,0.5)',fontFamily:'inherit',fontSize:11,cursor:'pointer'}}>← 뒤로</button>
    </div>:
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:5}}>
     {[['⚔️공격',doAtk],['✨스킬',()=>setSkO(true)],['💫포획',doC],['🏃도망',doR]].map(([t,fn],i)=>
      <button key={i} disabled={!bon} onClick={fn} style={{padding:9,borderRadius:10,border:'2px solid rgba(255,255,255,0.12)',background:'rgba(255,255,255,0.08)',color:'#fff',fontFamily:'inherit',fontSize:13,fontWeight:700,cursor:'pointer',opacity:bon?1:0.4}}>{t}</button>)}
    </div>}
   </div></div>}

  <style>{`@keyframes hb{0%,100%{transform:scale(1)}15%{transform:scale(1.15)}30%{transform:scale(1)}45%{transform:scale(1.1)}}@keyframes fc{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}@keyframes bl{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
 </div>)}

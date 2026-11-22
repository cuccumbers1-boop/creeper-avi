const $=id=>document.getElementById(id);
const store={get(k,d){try{const v=localStorage.getItem(k);return v===null?d:v}catch(e){return d}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}}};

/* ---- piksel mob çizimleri ---- */
const px=t=>{
  const S=(b)=>`<svg viewBox="0 0 8 8" shape-rendering="crispEdges">${b}</svg>`;
  if(t==='tnt')return S('<rect width="8" height="8" fill="#d8362b"/><rect y="3" width="8" height="2" fill="#f3efe2"/><rect x="1" y="3" width="1" height="2" fill="#222"/><rect x="3" y="3" width="1" height="2" fill="#222"/><rect x="5" y="3" width="2" height="2" fill="#222"/>');
  if(t==='diamond')return S('<rect x="1" y="1" width="6" height="6" fill="#3de0e0"/><rect x="2" y="2" width="2" height="2" fill="#fff"/><rect x="5" y="5" width="1" height="1" fill="#0a8a9a"/>');
  if(t==='ice')return S('<rect x="1" y="1" width="6" height="6" fill="#bff1ff"/><rect x="2" y="2" width="1" height="4" fill="#7fe3ff"/><rect x="4" y="2" width="1" height="4" fill="#7fe3ff"/><rect x="2" y="4" width="4" height="1" fill="#fff"/>');
  if(t==='zombie')return S('<rect width="8" height="8" fill="#3f8f7a"/><rect y="5" width="8" height="3" fill="#2b5fa8"/><g fill="#10261f"><rect x="1" y="2" width="2" height="1"/><rect x="5" y="2" width="2" height="1"/><rect x="3" y="4" width="2" height="1"/></g>');
  const b=t==='gold'?'#f2c230':'#5cc44a',d=t==='gold'?'#7a5a00':'#12310c';
  return S(`<rect width="8" height="8" fill="${b}"/><g fill="${d}"><rect x="1" y="1" width="2" height="2"/><rect x="5" y="1" width="2" height="2"/><rect x="3" y="3" width="2" height="2"/><rect x="2" y="4" width="1" height="3"/><rect x="5" y="4" width="1" height="3"/></g>`);
};
const COL={creeper:'#5cc44a',gold:'#f2c230',zombie:'#3f8f7a',tnt:'#d8362b',diamond:'#3de0e0',ice:'#7fe3ff'};

/* ---- zorluk ayarları ---- */
const MODES={
  easy:  {life0:1900,lifeMin:1000,lk:4,int0:1150,intMin:560,ik:3,x1:80,x2:200,tnt:.12},
  normal:{life0:1600,lifeMin:800, lk:5,int0:1000,intMin:450,ik:4,x1:60,x2:150,tnt:.14},
  hard:  {life0:1400,lifeMin:600, lk:8,int0:900, intMin:320,ik:6,x1:30,x2:90, tnt:.17}
};
let mode=store.get('creeper_mode','normal');if(!MODES[mode])mode='normal';
let sound=store.get('creeper_sound','1')==='1';
let games=+store.get('creeper_games','0');

/* ---- ses ---- */
let ac;
function beep(f,d=.08,ty='square'){
  if(!sound)return;
  try{ac=ac||new (window.AudioContext||window.webkitAudioContext)();
    const o=ac.createOscillator(),g=ac.createGain();o.type=ty;o.frequency.value=f;g.gain.value=.05;
    o.connect(g);g.connect(ac.destination);o.start();o.stop(ac.currentTime+d)}catch(e){}
}

/* ---- ana ekran ---- */
$('logo').innerHTML=px('creeper');
const bg=$('bg');
for(let i=0;i<9;i++){
  const e=document.createElement('div');e.className='fl';
  const s=26+Math.random()*34;
  e.style.cssText=`left:${Math.random()*94}%;width:${s}px;height:${s}px;animation-duration:${14+Math.random()*16}s;animation-delay:${-Math.random()*20}s`;
  e.innerHTML=px(['creeper','creeper','gold','zombie','diamond'][i%5]);bg.appendChild(e);
}
const howto=$('howto');
[['creeper','Creeper: patlamadan vur (+1)'],['gold','Altın creeper: +5 puan'],['zombie','Zombi: 2 vuruş ister (+3)'],['diamond','Elmas: +1 can'],['ice','Buz: 5 sn her şeyi yavaşlatır'],['tnt',"TNT: dokunma, can gider!"]]
  .forEach(([t,x])=>{const d=document.createElement('div');d.innerHTML=px(t)+'<span>'+x+'</span>';howto.appendChild(d)});
const hd=document.createElement('div');hd.innerHTML='<span>Creeper ya da zombiyi kaçırırsan da can gider. Üst üste vurdukça kombo artar.</span>';howto.appendChild(hd);
function homeStats(){
  ['easy','normal','hard'].forEach(m=>{$('b-'+m).textContent=store.get('creeper_best_'+m,'0')});
  document.querySelectorAll('.mode').forEach(b=>b.classList.toggle('sel',b.dataset.m===mode));
  $('games').textContent=games;$('snd').textContent='SES: '+(sound?'AÇIK':'KAPALI');
}
document.querySelectorAll('.mode').forEach(b=>b.onclick=()=>{mode=b.dataset.m;store.set('creeper_mode',mode);homeStats();beep(500,.05)});
$('how').onclick=()=>{howto.hidden=!howto.hidden};
$('snd').onclick=()=>{sound=!sound;store.set('creeper_sound',sound?'1':'0');homeStats();beep(600,.06)};
homeStats();

/* ---- oyun ---- */
const board=$('board'),cells=[];
let M=MODES[mode],score=0,lives=3,combo=0,run=false,paused=false,clock=0,nextSpawn=0,freezeUntil=0,last=null,best=0,raf=0;
for(let i=0;i<9;i++){
  const el=document.createElement('div');el.className='cell';el.tabIndex=0;el.innerHTML='<div class="mob"></div>';
  const c={el,mob:el.firstChild,type:null,exp:0,hp:2};
  el.addEventListener('pointerdown',e=>{e.preventDefault();hit(c)});
  el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();hit(c)}});
  board.appendChild(el);cells.push(c);
}
const ov=document.createElement('div');ov.id='ov';ov.hidden=true;board.appendChild(ov);
const bn=document.createElement('div');bn.id='bn';board.appendChild(bn);
let rec=false,ms=50,seen={};try{seen=JSON.parse(store.get('creeper_seen','{}'))||{}}catch(e){}
function announce(t,col,sub){bn.innerHTML=t+(sub?'<small>'+sub+'</small>':'');bn.style.color=col;bn.classList.remove('show');void bn.offsetWidth;bn.classList.add('show')}
const INTRO={zombie:['ZOMBİ GELDİ!','2 vuruş ister','#7fc9b5'],tnt:['TNT!','Dokunma, can gider','#d8362b'],gold:['ALTIN CREEPER!','+5 puan','#f2c230'],diamond:['ELMAS!','Vur, +1 can kazan','#3de0e0'],ice:['BUZ!','Vur, her şey yavaşlar','#7fe3ff']};
function intro(t){const i=INTRO[t];if(!i||seen[t])return;seen[t]=1;store.set('creeper_seen',JSON.stringify(seen));announce(i[0],i[2],i[1])}

function pop(c,txt,col){const p=document.createElement('div');p.className='pop';p.textContent=txt;p.style.color=col;c.el.appendChild(p);setTimeout(()=>p.remove(),500)}
function burst(c,col){for(let i=0;i<7;i++){const p=document.createElement('i');p.className='pt';p.style.background=col;
  p.style.setProperty('--dx',(Math.random()*90-45)+'px');p.style.setProperty('--dy',(Math.random()*90-45)+'px');c.el.appendChild(p);setTimeout(()=>p.remove(),420)}}
let lastCombo='';
function hud(){
  $('sc').textContent=score;
  $('lives').textContent='♥'.repeat(Math.max(lives,0))+'·'.repeat(3-Math.max(lives,0));
  const frozen=clock<freezeUntil;
  const t=frozen?'BUZ '+Math.ceil((freezeUntil-clock)/1000)+' sn':(combo>=3?'KOMBO x'+combo:'');
  if(t!==lastCombo){$('combo').textContent=t;$('combo').classList.toggle('ice',frozen);lastCombo=t}
}
function clear(c){c.type=null;c.el.classList.remove('up');const m=c.mob;setTimeout(()=>{if(!c.type)m.innerHTML=''},110)}
function hurt(){
  lives--;combo=0;const s=$('shake');s.classList.remove('s');void s.offsetWidth;s.classList.add('s');
  beep(110,.25,'sawtooth');hud();if(lives===1)announce('SON CAN!',COL.tnt,'Dikkat et');if(lives<=0)end();
}
function hit(c){
  if(!run||paused||!c.type)return;
  const t=c.type;
  if(t==='zombie'&&--c.hp>0){pop(c,'AH!','#9fe');burst(c,COL.zombie);beep(260,.06);return}
  clear(c);burst(c,COL[t]);
  if(t==='tnt'){c.el.classList.add('boom');setTimeout(()=>c.el.classList.remove('boom'),200);pop(c,'BOOM','#fff');hurt();return}
  if(t==='diamond'){lives=Math.min(3,lives+1);pop(c,'+CAN',COL.diamond);announce('+1 CAN',COL.diamond);beep(1000,.15,'triangle');hud();return}
  if(t==='ice'){freezeUntil=clock+5000;pop(c,'BUZ!',COL.ice);announce('BUZ!',COL.ice,'5 saniye yavaş');beep(700,.2,'triangle');hud();return}
  combo++;if(combo%5===0)announce('KOMBO x'+combo,COL.gold);const pts=(t==='gold'?5:t==='zombie'?3:1)+Math.floor(combo/5);score+=pts;if(best>0&&score>best&&!rec){rec=true;announce('YENİ REKOR!',COL.gold,'Rekoru geçtin')}else if(score>=ms){ms+=50;announce('HIZLANIYOR!',COL.tnt)}
  c.el.classList.add('hit');setTimeout(()=>c.el.classList.remove('hit'),120);
  pop(c,'+'+pts,t==='gold'?COL.gold:'#fff');beep(t==='gold'?880:420+Math.min(combo,20)*20,.07);hud();
}
function pick(){
  const r=Math.random(),frozen=clock<freezeUntil;
  let t;
  if(r<.025)t='diamond';else if(r<.05)t=frozen?'creeper':'ice';
  else if(r<.05+M.tnt)t='tnt';else if(r<.11+M.tnt)t='gold';
  else if(score>15&&r<.31+M.tnt)t='zombie';else t='creeper';
  if(t==='diamond'&&lives>=3)t='gold';
  return t;
}
function spawn(){
  const free=cells.filter(c=>!c.type);if(!free.length)return;
  const c=free[Math.floor(Math.random()*free.length)],t=pick(),frozen=clock<freezeUntil;
  c.type=t;c.hp=2;intro(t);c.mob.innerHTML=px(t);void c.el.offsetWidth;c.el.classList.add('up');
  const m=t==='gold'?.8:t==='zombie'?1.4:(t==='diamond'||t==='ice')?1.1:1;
  c.exp=clock+Math.max(M.lifeMin,M.life0-score*M.lk)*m*(frozen?1.6:1);
}
function update(){
  cells.forEach(c=>{if(c.type&&clock>=c.exp){const t=c.type;clear(c);if(t==='creeper'||t==='zombie')hurt()}});
  if(run&&clock>=nextSpawn){
    spawn();if(score>M.x1&&Math.random()<.3)spawn();if(score>M.x2&&Math.random()<.3)spawn();
    const frozen=clock<freezeUntil;
    nextSpawn=clock+Math.max(M.intMin,M.int0-score*M.ik)*(frozen?1.8:1)*(.85+Math.random()*.3);
  }
  hud();
}
function frame(ts){
  if(!run)return;
  raf=requestAnimationFrame(frame);
  if(last===null)last=ts;
  const dt=Math.min(ts-last,100);last=ts;
  if(paused)return;
  clock+=dt;update();
}
function overlay(h){ov.innerHTML=h;ov.hidden=false}
function end(){
  run=false;cancelAnimationFrame(raf);cells.forEach(clear);
  games++;store.set('creeper_games',games);
  const nb=score>best;if(nb){best=score;store.set('creeper_best_'+mode,best);$('bs').textContent=best}
  overlay(`<div style="font-size:26px;color:var(--tnt)">OYUN BİTTİ</div><p>Skor: ${score}<br>${nb&&score>0?'YENİ REKOR!':'Rekor: '+best}</p><button id="go">TEKRAR</button><button id="mn" class="alt">ANA MENÜ</button>`);
  $('go').onclick=start;$('mn').onclick=toMenu;
}
function start(){
  M=MODES[mode];best=+store.get('creeper_best_'+mode,'0');$('bs').textContent=best;
  cells.forEach(c=>{c.type=null;c.el.classList.remove('up');c.mob.innerHTML=''});
  score=0;lives=3;combo=0;clock=0;rec=false;ms=50;bn.classList.remove('show');freezeUntil=0;nextSpawn=500;last=null;paused=false;lastCombo='';
  ov.hidden=true;run=true;hud();cancelAnimationFrame(raf);raf=requestAnimationFrame(frame);beep(520,.1);
}
function setPause(p){
  if(!run)return;paused=p;
  if(p)overlay(`<div style="font-size:24px">DURAKLATILDI</div><button id="go">DEVAM</button><button id="mn" class="alt">ANA MENÜ</button>`),$('go').onclick=()=>setPause(false),$('mn').onclick=toMenu;
  else ov.hidden=true;
}
function toMenu(){run=false;paused=false;cancelAnimationFrame(raf);ov.hidden=true;$('app').hidden=true;$('home').hidden=false;homeStats()}
$('play').onclick=()=>{$('home').hidden=true;$('app').hidden=false;start()};
$('pause').onclick=()=>setPause(!paused);
addEventListener('keydown',e=>{if(e.key==='p'||e.key==='P'||e.key==='Escape')setPause(!paused)});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&run&&!paused)setPause(true)});

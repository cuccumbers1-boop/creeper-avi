const px=(c,t)=>{
  if(t==='diamond')return `<svg viewBox="0 0 8 8" shape-rendering="crispEdges"><rect x="1" y="1" width="6" height="6" fill="#3de0e0"/><rect x="2" y="2" width="2" height="2" fill="#fff"/><rect x="5" y="5" width="1" height="1" fill="#0a8a9a"/></svg>`;
  if(t==='zombie')return `<svg viewBox="0 0 8 8" shape-rendering="crispEdges"><rect width="8" height="8" fill="#3f8f7a"/><rect y="5" width="8" height="3" fill="#2b5fa8"/><g fill="#10261f"><rect x="1" y="2" width="2" height="1"/><rect x="5" y="2" width="2" height="1"/><rect x="3" y="4" width="2" height="1"/></g></svg>`;
  if(t==='tnt')return `<svg viewBox="0 0 8 8" shape-rendering="crispEdges"><rect width="8" height="8" fill="#d8362b"/><rect y="3" width="8" height="2" fill="#f3efe2"/><rect x="1" y="3" width="1" height="2" fill="#222"/><rect x="3" y="3" width="1" height="2" fill="#222"/><rect x="5" y="3" width="2" height="2" fill="#222"/></svg>`;
  const b=t==='gold'?'#f2c230':'#5cc44a',d=t==='gold'?'#7a5a00':'#12310c';
  return `<svg viewBox="0 0 8 8" shape-rendering="crispEdges"><rect width="8" height="8" fill="${b}"/><g fill="${d}"><rect x="1" y="1" width="2" height="2"/><rect x="5" y="1" width="2" height="2"/><rect x="3" y="3" width="2" height="2"/><rect x="2" y="4" width="1" height="3"/><rect x="5" y="4" width="1" height="3"/></g></svg>`;
};
const board=document.getElementById('board'),$=id=>document.getElementById(id);
let cells=[],score=0,lives=3,combo=0,run=false,best=0,loop;
try{best=+localStorage.getItem('creeperBest')||0}catch(e){}
$('bs').textContent=best;
for(let i=0;i<9;i++){
  const el=document.createElement('div');el.className='cell';el.tabIndex=0;
  const c={el,type:null,t:null};
  el.addEventListener('pointerdown',e=>{e.preventDefault();hit(c)});
  el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' ')hit(c)});
  board.appendChild(el);cells.push(c);
}
const ov=document.createElement('div');ov.id='ov';board.appendChild(ov);
let ac;function beep(f,d=.08,ty='square'){try{ac=ac||new (window.AudioContext||window.webkitAudioContext)();const o=ac.createOscillator(),g=ac.createGain();o.type=ty;o.frequency.value=f;g.gain.value=.05;o.connect(g);g.connect(ac.destination);o.start();o.stop(ac.currentTime+d)}catch(e){}}
function pop(c,txt,col){const p=document.createElement('div');p.className='pop';p.textContent=txt;p.style.color=col;c.el.appendChild(p);setTimeout(()=>p.remove(),500)}
function hud(){$('sc').textContent=score;$('lives').textContent='♥'.repeat(Math.max(lives,0))+'·'.repeat(3-Math.max(lives,0));$('combo').textContent=combo>=3?`KOMBO x${combo}`:''}
function clear(c){clearTimeout(c.t);c.type=null;c.el.classList.remove('up');setTimeout(()=>{if(!c.type)c.el.innerHTML=''},110)}
function hurt(){lives--;combo=0;const s=$('shake');s.classList.remove('s');void s.offsetWidth;s.classList.add('s');beep(110,.25,'sawtooth');hud();if(lives<=0)end()}
function hit(c){
  if(!run||!c.type)return;
  const t=c.type;
  if(t==='zombie'&&--c.hp>0){pop(c,'AH!','#9fe');beep(260,.06);return}
  clear(c);
  if(t==='diamond'){lives=Math.min(3,lives+1);pop(c,'+CAN','#3de0e0');beep(1000,.15,'triangle');hud();return}
  if(t==='tnt'){c.el.classList.add('boom');setTimeout(()=>c.el.classList.remove('boom'),200);pop(c,'BOOM','#fff');hurt();return}
  combo++;const pts=(t==='gold'?5:t==='zombie'?3:1)+Math.floor(combo/5);score+=pts;
  c.el.classList.add('hit');setTimeout(()=>c.el.classList.remove('hit'),120);
  pop(c,'+'+pts,t==='gold'?'#f2c230':'#fff');beep(t==='gold'?880:420+Math.min(combo,20)*20,.07);hud();
}
function spawn(){
  const free=cells.filter(c=>!c.type);if(!free.length)return;
  const c=free[Math.floor(Math.random()*free.length)],r=Math.random();
  c.type=r<.03?'diamond':r<.15?'tnt':r<.21?'gold':(score>15&&r<.42)?'zombie':'creeper';c.hp=2;
  c.el.innerHTML=px(0,c.type);void c.el.offsetWidth;c.el.classList.add('up');
  const life=Math.max(550,1500-score*9)*(c.type==='gold'?.8:c.type==='zombie'?1.4:1);
  c.t=setTimeout(()=>{const t=c.type;clear(c);if(t!=='tnt'&&t!=='diamond'&&run)hurt()},life);
}
function tick(){
  if(!run)return;
  spawn();if(score>25&&Math.random()<.4)spawn();if(score>70&&Math.random()<.4)spawn();
  loop=setTimeout(tick,Math.max(300,950-score*7));
}
function end(){
  run=false;clearTimeout(loop);cells.forEach(clear);
  const nb=score>best;if(nb){best=score;try{localStorage.setItem('creeperBest',best)}catch(e){}$('bs').textContent=best}
  show(`<div style="font-size:26px;color:var(--tnt)">OYUN BİTTİ</div><p>Skor: ${score}<br>${nb?'YENİ REKOR!':'Rekor: '+best}</p><button id="go">TEKRAR</button><button id="mn" class="alt">ANA MENÜ</button>`);
}
function show(h){ov.innerHTML=h;ov.classList.remove('hide');$('go').onclick=start;const m=$('mn');if(m)m.onclick=toMenu}
function start(){score=0;lives=3;combo=0;run=true;hud();ov.classList.add('hide');clearTimeout(loop);loop=setTimeout(tick,400);beep(520,.1)}
show(`<div style="font-size:22px;color:var(--cr)">Creeper'lar patlamadan vur!</div><p>Kaçırırsan can gider.<br>TNT'ye basarsan da.<br>Üst üste vur, kombo yap.<br>Zombi 2 vuruş ister, elmas can verir.</p><button id="go">BAŞLA</button>`);
hud();
const home=$('home'),app=$('app');
$('logo').innerHTML=px(0,'creeper');
$('hbs').textContent=best;
$('play').onclick=()=>{home.hidden=true;app.hidden=false;start()};
$('how').onclick=()=>{$('howto').hidden=!$('howto').hidden};
function toMenu(){clearTimeout(loop);run=false;app.hidden=true;home.hidden=false;$('hbs').textContent=best}

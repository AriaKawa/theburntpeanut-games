import {setupMultiplayer} from './multiplayer-ui.js?v=mp12';
import {Game,CAST,COLS,ROWS,MAPS} from './engine.js?v=mp12';
import {loadPack,drawAsset} from './packs.js?v=mp12';
import {drawCharacter,loadCharacterSprites} from './characters.js?v=mp12';
import {drawArena,drawBomb,drawFlames,drawClosingWalls,drawRockets} from './arena.js?v=mp12';
const $=id=>document.getElementById(id),canvas=$('game'),ctx=canvas.getContext('2d');
const W=416,H=352,T=30,OX=13,OY=11;
canvas.width=W*3;canvas.height=H*3;ctx.scale(3,3);
ctx.imageSmoothingEnabled=false;
let selected='peanut',selectedMap='garden',game=new Game(),paused=false,keys=new Set(),last=performance.now(),clock=0,particles=[],floaters=[],puddles=[],shake=0,toastTimer=0,best=0,sound=true,audio=null,menuState='select',playerHit=0;
try{best=Number(localStorage.getItem('bungerman-best-v1'))||0;}catch{}
$('best').textContent=String(best).padStart(5,'0');
let animationStates=new WeakMap(),deaths=[],rings=[],menuDelay=0,pendingState=null;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let pack=null,loadTicket=0,packReady=false;
function rect(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
function drawCast(c,x,bottom,height,character,frame=0,flip=false,alpha=1){drawCharacter(c,x,bottom,height,character,{time:clock,walk:clock*7,dir:flip?'left':'down',action:frame?'walk':'idle',alpha,reduced});}
function smallCanvas(id,w,h){const el=typeof id==='string'?$(id):id;if(el.width!==w*3){el.width=w*3;el.height=h*3;}const c=el.getContext('2d');c.setTransform(3,0,0,3,0,0);c.clearRect(0,0,w,h);return c;}
function drawPortraits(){document.querySelectorAll('.portrait').forEach(p=>{const c=smallCanvas(p,88,100),char=p.dataset.portrait;drawCast(c,44,94,char==='hutch'?84:76,char);});drawCast(smallCanvas('hud-face',32,36),16,35,34,game.character);}
function drawLogo(){drawAsset(smallCanvas('logo',320,84),pack,'logo',0,4,320,76);}
function drawMenuArt(state){const c=smallCanvas('menu-art',160,124);if(['paused','won','lost','roundWon'].includes(state))drawAsset(c,pack,state,5,4,150,116);}
async function choosePack(id){
 const ticket=++loadTicket;const progress={ui:0,cast:0};const report=(group,value)=>{if(ticket!==loadTicket)return;progress[group]=value.loaded;$('pack-status').textContent='LOADING '+Math.round((progress.ui+progress.cast)/13*100)+'%';};packReady=false;$('play').disabled=true;$('pack-status').textContent='LOADING…';
 document.querySelectorAll('[data-style]').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.style===id));});
 try{const [next]=await Promise.all([loadPack('arcade2005',{onProgress:value=>report('ui',value)}),loadCharacterSprites({onProgress:value=>report('cast',value)})]);if(ticket!==loadTicket)return;pack=next;packReady=true;document.body.dataset.style=id;
 canvas.width=W*3;canvas.height=H*3;ctx.setTransform(3,0,0,3,0,0);
 $('play').disabled=false;$('pack-status').textContent='';drawLogo();drawPortraits();drawMenuArt(menuState);
 try{localStorage.setItem('bungerman-style',id);}catch{}
 }catch(error){if(ticket!==loadTicket)return;++loadTicket;$('pack-status').textContent='COULDN’T LOAD — RETRY';$('retry-assets').hidden=false;console.error(error);}
}
$('retry-assets').addEventListener('click',()=>{ $('retry-assets').hidden=true;choosePack('arcade2005');});
choosePack('arcade2005');
try{sound=localStorage.getItem('bungerman-sound')!=='off';}catch{}
function syncSound(){ $('sound-off').hidden=sound;$('sound').setAttribute('aria-label',sound?'Mute sound':'Enable sound');$('sound').setAttribute('aria-pressed',String(sound)); }
function unlockAudio(){if(sound)try{audio??=new(window.AudioContext||window.webkitAudioContext)();audio.resume()?.catch(()=>{});}catch{sound=false;}syncSound();}
syncSound();
function tone(freq,duration=.07,type='square',volume=.035,end){if(!sound||!audio)return;try{const osc=audio.createOscillator(),gain=audio.createGain();osc.type=type;osc.frequency.setValueAtTime(freq,audio.currentTime);if(end)osc.frequency.exponentialRampToValueAtTime(end,audio.currentTime+duration);gain.gain.setValueAtTime(volume,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);osc.connect(gain);gain.connect(audio.destination);osc.start();osc.stop(audio.currentTime+duration);}catch{}}
function sfx(kind){if(kind==='drop')tone(190,.09,'triangle',.06,95);if(kind==='explosion'){tone(105,.2,'sawtooth',.05,25);tone(59,.23,'triangle',.08,22);}if(kind==='hit')tone(380,.2,'square',.035,80);if(kind==='pickup'){tone(670,.08,'sine',.08);setTimeout(()=>tone(890,.09,'sine',.06),70);}if(kind==='win')[440,550,660,880].forEach((f,i)=>setTimeout(()=>tone(f,.2,'triangle',.07),i*90));if(kind==='lost')[220,170,100].forEach((f,i)=>setTimeout(()=>tone(f,.16,'triangle',.07),i*120));}
function toast(text){$('toast').textContent=text;$('toast').classList.add('visible');toastTimer=1.4;}
function updateBest(){if(game.score>best){best=game.score;try{localStorage.setItem('bungerman-best-v1',String(best));}catch{}}$('best').textContent=String(best).padStart(5,'0');}
function showState(state){resetTouches();menuState=state;toastTimer=0;$('toast').classList.remove('visible');keys.clear();$('menu').classList.remove('hidden');$('menu').dataset.view=state;$('multiplayer-view').hidden=true;$('lobby-view').hidden=true;$('select-view').hidden=state!=='select';$('state-view').hidden=state==='select';$('state-view').dataset.state=state;document.body.classList.remove('playing');$('pause').disabled=true;
 if(state==='select')return;const content={paused:['PAUSED','RESUME'],roundWon:['CLEAR!','NEXT'],won:['YOU WIN!','REPLAY'],lost:['COOKED.','RETRY']}[state];$('state-title').textContent=content[0];$('continue').innerHTML=content[1]+' <span aria-hidden="true">▶</span>';$('state-score').hidden=state==='paused';$('state-score').textContent=String(game.score).padStart(5,'0');drawMenuArt(state);if(multiplayer.active){$('continue').textContent='MENU';$('state-title').textContent=game.isDraw?'DRAW':state==='won'?'YOU WIN!':'COOKED.';}}
function hideMenu(){menuState=null;toastTimer=0;$('toast').classList.remove('visible');$('menu').classList.add('hidden');document.body.classList.add('playing');$('pause').disabled=false;canvas.focus({preventScroll:true});}
function start(){if(!packReady)return;unlockAudio();resetTouches();game=new Game(selected,Math.floor(Math.random()*999999),selectedMap);paused=false;document.body.classList.remove('paused');playerHit=0;keys.clear();particles=[];floaters=[];puddles=[];deaths=[];rings=[];animationStates=new WeakMap();menuDelay=0;pendingState=null;game.start();hideMenu();drawPortraits();tone(440,.12,'triangle',.04);updateHud();}
function home(){if(multiplayer.inRoom){multiplayer.leave();return;}if(pendingState)return;updateBest();paused=false;document.body.classList.remove('paused');playerHit=0;keys.clear();game=new Game(selected,9187,selectedMap);particles=[];floaters=[];puddles=[];deaths=[];rings=[];menuDelay=0;pendingState=null;showState('select');drawPortraits();updateHud();}
function pause(){if(multiplayer.active){toast('ONLINE MATCH');return;}if(game.status!=='playing')return;paused=!paused;document.body.classList.toggle('paused',paused);keys.clear();if(paused)showState('paused');else hideMenu();}
function proceed(){if(multiplayer.inRoom){multiplayer.leave();return;}if(paused){pause();return;}if(game.status==='roundWon'){game.next();particles=[];puddles=[];hideMenu();updateHud();return;}start();}
$('play').addEventListener('click',start);$('continue').addEventListener('click',proceed);$('change-character').addEventListener('click',home);$('pause').addEventListener('click',pause);
document.querySelectorAll('[data-character]').forEach(b=>b.addEventListener('click',()=>{selected=b.dataset.character;document.querySelectorAll('.character').forEach(c=>{const active=c===b;c.classList.toggle('selected',active);c.setAttribute('aria-pressed',String(active));});game=new Game(selected,9187,selectedMap);drawPortraits();tone(460,.05,'triangle',.04);updateHud();}));
$('sound').addEventListener('click',()=>{sound=!sound;unlockAudio();try{localStorage.setItem('bungerman-sound',sound?'on':'off');}catch{}tone(660,.08,'sine',.04);});
const mapped={KeyW:[0,-1],ArrowUp:[0,-1],KeyD:[1,0],ArrowRight:[1,0],KeyS:[0,1],ArrowDown:[0,1],KeyA:[-1,0],ArrowLeft:[-1,0]};
window.addEventListener('keydown',e=>{if(e.code==='Escape'&&document.body.classList.contains('fullscreen')){fullscreenUI(false);return;}if(e.code==='Escape'){e.preventDefault();if(!e.repeat)pause();return;}if(game.status!=='playing'||paused)return;if(e.code==='KeyE'){e.preventDefault();if(!e.repeat)fire();return;}if(mapped[e.code]||e.code==='Space'){e.preventDefault();if(!e.repeat){keys.delete(e.code);keys.add(e.code);if(e.code==='Space')plant();}}});
window.addEventListener('keyup',e=>{keys.delete(e.code);if(e.code==='Space'&&game.status==='playing')e.preventDefault();});
window.addEventListener('blur',()=>{keys.clear();if(game.status==='playing'&&!paused)pause();});document.addEventListener('visibilitychange',()=>{if(document.hidden&&game.status==='playing'&&!paused)pause();});
// Screen drag and cabinet joystick move; taps or the painted deck button plant.
const touches=new Map();let movingPointer=null;
function resetTouches(){touches.clear();clearTouchMovement();stickPointer=null;}
function clearTouchMovement(){for(const code of Object.keys(mapped))if(code.startsWith('Arrow'))keys.delete(code);movingPointer=null;}
canvas.addEventListener('pointerdown',e=>{if(menuState)return;e.preventDefault();canvas.setPointerCapture(e.pointerId);touches.set(e.pointerId,{x:e.clientX,y:e.clientY,moved:false});});
canvas.addEventListener('pointermove',e=>{const t=touches.get(e.pointerId);if(!t)return;const dx=e.clientX-t.x,dy=e.clientY-t.y;if(Math.hypot(dx,dy)<12)return;if(movingPointer!==null&&movingPointer!==e.pointerId)return;t.moved=true;clearTouchMovement();movingPointer=e.pointerId;keys.add(Math.abs(dx)>Math.abs(dy)?dx>0?'ArrowRight':'ArrowLeft':dy>0?'ArrowDown':'ArrowUp');});
function endTouch(e,cancel=false){const t=touches.get(e.pointerId);if(!t)return;if(movingPointer===e.pointerId)clearTouchMovement();if(!cancel&&!paused&&!menuState&&!t.moved)plant();touches.delete(e.pointerId);}
canvas.addEventListener('pointerup',e=>endTouch(e));canvas.addEventListener('pointercancel',e=>endTouch(e,true));canvas.addEventListener('lostpointercapture',e=>endTouch(e,true));
const stick=$('joystick');let stickPointer=null;
function steerStick(e){if(e.pointerId!==stickPointer)return;const box=stick.getBoundingClientRect(),dx=e.clientX-box.left-box.width/2,dy=e.clientY-box.top-box.height/2;clearTouchMovement();if(Math.hypot(dx,dy)>box.width*.12)keys.add(Math.abs(dx)>Math.abs(dy)?dx>0?'ArrowRight':'ArrowLeft':dy>0?'ArrowDown':'ArrowUp');}
stick.addEventListener('pointerdown',e=>{if(menuState)return;e.preventDefault();stickPointer=e.pointerId;stick.setPointerCapture(e.pointerId);steerStick(e);});stick.addEventListener('pointermove',steerStick);
for(const event of ['pointerup','pointercancel','lostpointercapture'])stick.addEventListener(event,()=>{stickPointer=null;clearTouchMovement();});
$('touch-rpg').addEventListener('click',()=>{if(!paused&&!menuState){fire();canvas.focus({preventScroll:true});}});
$('touch-bomb').addEventListener('click',()=>{if(!paused&&!menuState){plant();canvas.focus({preventScroll:true});}});
function drawMapPreviews(){const el=$('map-preview'),c=el.getContext('2d');el.width=W;el.height=H;el.dataset.mapPreview=selectedMap;drawArena(c,new Game(selected,9187,selectedMap),{time:0,reduced:true});$('map-name').textContent=selectedMap.toUpperCase();}
for(const [id,step]of [['map-prev',-1],['map-next',1]])$(id).addEventListener('click',()=>{selectedMap=MAPS[(MAPS.findIndex(m=>m.id===selectedMap)+step+MAPS.length)%MAPS.length].id;game=new Game(selected,9187,selectedMap);drawMapPreviews();updateHud();});
drawMapPreviews();
function plant(){if(multiplayer.active)multiplayer.action('bomb');else game.plantBomb();}
function fire(){if(multiplayer.active)multiplayer.action('rpg');else game.fireRpg();}
const multiplayer=setupMultiplayer({selected:()=>selected,map:()=>selectedMap,loaded:()=>packReady,home,
 showPanel(id){resetTouches();keys.clear();pendingState=null;menuDelay=0;paused=false;menuState=id;document.body.classList.remove('playing','paused');$('menu').classList.remove('hidden');for(const name of ['select','state','multiplayer','lobby'])$(name+'-view').hidden=name!==id;$('pause').disabled=true;},
 paint(el,character){const c=smallCanvas(el,88,100);if(character&&packReady)drawCast(c,44,94,character==='hutch'?84:76,character);},
 start(){unlockAudio();resetTouches();paused=false;keys.clear();particles=[];floaters=[];puddles=[];deaths=[];rings=[];animationStates=new WeakMap();pendingState=null;menuDelay=0;hideMenu();$('pause').disabled=true;},
 snapshot(next){game=next;drawCast(smallCanvas('hud-face',32,36),16,35,34,game.character);}
});
function fullscreenUI(on){document.body.classList.toggle('fullscreen',on);$('fullscreen').setAttribute('aria-pressed',String(on));$('fullscreen').setAttribute('aria-label',on?'Exit fullscreen game':'Enter fullscreen game');}
$('fullscreen').addEventListener('click',async()=>{const on=!document.body.classList.contains('fullscreen');fullscreenUI(on);try{if(on)await document.documentElement.requestFullscreen?.();else if(document.fullscreenElement)await document.exitFullscreen();}catch{}});
document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement)fullscreenUI(false);});
$('rpg-fire').addEventListener('click',()=>{if(!paused&&!menuState){fire();canvas.focus({preventScroll:true});}});
const px=x=>OX+(x+.5)*T,py=y=>OY+(y+.5)*T;
function burst(x,y,count,color){if(reduced)count=Math.ceil(count/3);for(let i=0;i<count;i++){const a=Math.random()*Math.PI*2,v=20+Math.random()*80;particles.push({x:px(x),y:py(y),vx:Math.cos(a)*v,vy:Math.sin(a)*v-20,life:.35+Math.random()*.35,max:.7,color,size:2+Math.floor(Math.random()*3)});}}
function stateFor(e){let state=animationStates.get(e);if(!state){state={x:e.rx,y:e.ry,walk:0,moving:0,travelling:false,plant:0,hit:0};animationStates.set(e,state);}return state;}
function events(){for(const ev of game.events.splice(0)){if(ev.type==='drop')sfx('drop');if(ev.type==='drop'&&ev.owner&&!ev.owner.environment)stateFor(ev.owner).plant=.34;if(ev.type==='overtime'){toast('WALLS CLOSING');tone(420,.2,'sawtooth',.03,180);}if(ev.type==='wallClose'){shake=reduced?0:5;tone(65,.22,'triangle',.06,25);for(const c of ev.cells)burst(c.x,c.y,3,'#a8b4b6');}if(ev.type==='rpgFire'){tone(200,.14,'sawtooth',.045,45);burst(ev.x,ev.y,4,'#ffcf68');}if(ev.type==='crateDamage')burst(ev.x,ev.y,4,'#a6bab9');if(ev.type==='explosion'){rings.push({x:px(ev.x),y:py(ev.y),life:.4,max:.4});sfx('explosion');shake=reduced?0:3;burst(ev.x,ev.y,14,'#ffb538');}if(ev.type==='crate')burst(ev.x,ev.y,7,'#bd965b');if(ev.type==='hit'){const entity=ev.player?game.player:game.bots.find(e=>e.x===ev.x&&e.y===ev.y);if(entity)stateFor(entity).hit=.42;sfx('hit');if(ev.player){playerHit=.95;shake=reduced?0:9;floaters.push({x:px(ev.x),y:py(ev.y)-26,text:'−1 ♥',life:1.25,hit:true});burst(ev.x,ev.y,12,'#ff665e');}}if(ev.type==='death'){deaths.push({...ev,life:.75,max:.75,dir:(ev.player?game.player:game.bots.find(e=>e.x===ev.x&&e.y===ev.y))?.dir||'down'});puddles.push({x:ev.x,y:ev.y,character:ev.character});burst(ev.x,ev.y,10,'#d8913d');if(!ev.player)floaters.push({x:px(ev.x),y:py(ev.y)-12,text:'KO',life:1});}if(ev.type==='pickup'){for(const f of floaters)if(Math.abs(f.x-px(ev.x))<45&&Math.abs(f.y-(py(ev.y)-23))<16)f.y-=16;if(ev.player!==false)sfx('pickup');floaters.push({x:px(ev.x),y:py(ev.y)-23,text:ev.pickupType==='range'?'Range Up':ev.pickupType==='rpg'?'RPG +3':ev.pickupType==='speed'?'Speed up':'+75',life:1.3,power:['range','rpg','speed'].includes(ev.pickupType)});const nearby=floaters.filter(f=>Math.abs(f.x-px(ev.x))<45).sort((a,b)=>b.y-a.y);for(let i=1;i<nearby.length;i++)nearby[i].y=Math.min(nearby[i].y,nearby[i-1].y-16);}if(ev.type==='empty')toast('WAIT!');if(ev.type==='blocked')toast('MOVE!');if(['roundWon','won','lost'].includes(ev.type)){updateBest();sfx(ev.type==='lost'?'lost':'win');pendingState=ev.type;menuDelay=reduced?.15:1;keys.clear();}}}
function updateHud(){$('rpg-fire').hidden=menuState!==null||!(game.player.rpgAmmo>0);$('rpg-ammo').textContent=game.player.rpgAmmo||0;$('rpg-fire').setAttribute('aria-label','Fire RPG (E), '+(game.player.rpgAmmo||0)+' shots remaining');$('score').textContent=String(game.score).padStart(5,'0');$('score').setAttribute('aria-label','Score '+game.score);$('hearts').textContent='♥'.repeat(Math.max(0,game.player.hp))+'♡'.repeat(1-Math.max(0,game.player.hp));$('hearts').setAttribute('aria-label',game.player.hp+' health');const seconds=Math.ceil(Math.max(0,game.time));$('timer').textContent=String(seconds).padStart(2,'0');$('timer').style.color=game.overtime?'#ff9162':'';document.querySelector('.machine').classList.toggle('overtime',game.overtime);$('timer').setAttribute('aria-label',seconds+' seconds');}

function rounded(x,y,w,h,r,fill){ctx.fillStyle=fill;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();}
function ellipse(x,y,rx,ry,fill){ctx.fillStyle=fill;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();}
function gradient(x,y,h,a,b){const g=ctx.createLinearGradient(x,y,x,y+h);g.addColorStop(0,a);g.addColorStop(1,b);return g;}
function render(){
 ctx.save();ctx.imageSmoothingEnabled=true;if(shake>0)ctx.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);
 const options={time:clock,reduced,pack,drawAsset};drawArena(ctx,game,options);
 for(const p of puddles){ellipse(px(p.x),py(p.y)+10,10,3,'#46352966');}
 for(const p of game.pickups){const x=px(p.x),y=py(p.y),spin=reduced?1:.45+.55*Math.abs(Math.cos(clock*3));ellipse(x,y+9,6,2,'#12362470');const id=p.type==='range'?'range':p.type==='rpg'?'rpg':p.type==='speed'?'speed':'pickup';drawAsset(ctx,pack,id,x-11*spin,y-10+(reduced?0:Math.sin(clock*4)*2),22*spin,22);}
 drawClosingWalls(ctx,game,options);
 for(const b of game.bombs)drawBomb(ctx,px(b.x),py(b.y)+2,b,options);
 drawFlames(ctx,game,options);
 for(const r of rings){const t=1-r.life/r.max;ctx.strokeStyle='rgba(255,232,143,'+(1-t)*.7+')';ctx.lineWidth=2*(1-t);ctx.beginPath();ctx.ellipse(r.x,r.y,4+t*22,2+t*11,0,0,Math.PI*2);ctx.stroke();}
 const entities=[...game.bots.filter(b=>b.alive),...(game.player.alive?[game.player]:[])].sort((a,b)=>a.ry-b.ry);
 for(const e of entities){const x=px(e.rx),y=py(e.ry),p=e===game.player,st=stateFor(e);ellipse(x,y+12,e.character==='hutch'?12:9,3.2,'#06352580');
 if(e.speedBoost>0){ctx.strokeStyle='#8cffaa';ctx.lineWidth=1.8;ctx.beginPath();ctx.ellipse(x,y+12,11,4,0,-Math.PI/2,-Math.PI/2+Math.PI*2*Math.min(1,e.speedBoost/10));ctx.stroke();}
 const action=p&&pendingState&&pendingState!=='lost'?'victory':st.hit>0?'hit':st.plant>0?'plant':st.travelling?'walk':'idle';
 ctx.save();if(st.hit>.28){ctx.filter='brightness(2)';ctx.shadowColor='#ff443d';ctx.shadowBlur=9;}else if(p&&playerHit>0){ctx.shadowColor='#ff554d';ctx.shadowBlur=5;}
 drawCharacter(ctx,x,y+13,e.character==='hutch'?44:42,e.character,{time:clock,walk:st.walk,dir:e.dir||'down',action,moving:st.travelling,movementBlend:st.moving,actionTime:action==='hit'?.42-st.hit:action==='plant'?.34-st.plant:clock,alpha:e.inv>0?(reduced?.8:.65+.35*Math.abs(Math.sin(clock*6))):1,reduced});ctx.restore();
 if(p){const lift=reduced?0:Math.sin(clock*5)*1.1;ctx.fillStyle='#fff284';ctx.beginPath();ctx.moveTo(x-3,y-36+lift);ctx.lineTo(x+3,y-29+lift);ctx.lineTo(x,y-32+lift);ctx.fill();}
 }
 drawRockets(ctx,game,options);
 for(const d of deaths)drawCharacter(ctx,px(d.x),py(d.y)+13,42,d.character,{time:clock,dir:d.dir,action:'death',actionTime:d.max-d.life,alpha:Math.min(1,d.life*3),reduced});
 for(const p of particles){ctx.globalAlpha=Math.max(0,p.life/p.max);ctx.save();ctx.translate(p.x,p.y);ctx.rotate((p.max-p.life)*7);rounded(-p.size/2,-p.size/2,p.size,p.size,.5,p.color);ctx.restore();}ctx.globalAlpha=1;
 for(const f of floaters){ctx.globalAlpha=Math.min(1,f.life*2);ctx.font=f.hit?'900 15px Arial':f.power?'900 10px Arial':'900 9px Arial';ctx.textAlign='center';ctx.lineWidth=f.hit?3:2;ctx.strokeStyle='#251b28';ctx.strokeText(f.text,f.x,f.y);ctx.fillStyle=f.hit?'#ffaba0':f.power?'#b1e7ff':'#fff6b4';ctx.fillText(f.text,f.x,f.y);}ctx.globalAlpha=1;ctx.restore();
}
let hudTimer=0;
function frame(now){const dt=Math.min((now-last)/1000,.05);last=now;
 const codes=[...keys].reverse(),direction=mapped[codes.find(k=>mapped[k])];multiplayer.frame(dt,direction?{dx:direction[0],dy:direction[1]}:{dx:0,dy:0});
 if(!paused){clock+=dt;playerHit=Math.max(0,playerHit-dt);if(game.status==='playing'){const codes=[...keys].reverse(),dir=mapped[codes.find(k=>mapped[k])];game.update(dt,dir?{dx:dir[0],dy:dir[1]}:{});events();}else if(multiplayer.active){events();}
 for(const e of [game.player,...game.bots]){const st=stateFor(e),distance=Math.hypot(e.rx-st.x,e.ry-st.y);st.walk+=distance*Math.PI*2*.32;st.travelling=distance>.001||Math.hypot(e.x-e.rx,e.y-e.ry)>.02;st.moving+=((st.travelling?1:0)-st.moving)*Math.min(1,dt*24);st.x=e.rx;st.y=e.ry;st.plant=Math.max(0,st.plant-dt);st.hit=Math.max(0,st.hit-dt);}
 for(const p of particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=140*dt;}particles=particles.filter(p=>p.life>0);for(const f of floaters){f.life-=dt;f.y-=13*dt;}floaters=floaters.filter(f=>f.life>0);for(const d of deaths)d.life-=dt;deaths=deaths.filter(d=>d.life>0);for(const r of rings)r.life-=dt;rings=rings.filter(r=>r.life>0);shake=Math.max(0,shake-dt*20);
 if(pendingState){menuDelay-=dt;if(menuDelay<=0){const state=pendingState;pendingState=null;showState(state);}}
 }
 const hurt=playerHit/.95;$('hit-feedback').style.opacity=String(hurt);$('hearts').classList.toggle('hurt',hurt>0);$('hearts').style.transform=reduced?'none':'scale('+(1+Math.sin(hurt*Math.PI)*.2)+')';
 toastTimer-=dt;if(toastTimer<=0)$('toast').classList.remove('visible');hudTimer-=dt;if(hudTimer<=0){updateHud();if(menuState==='select')drawPortraits();hudTimer=.05;}render();requestAnimationFrame(frame);
}
drawLogo();drawPortraits();updateHud();requestAnimationFrame(frame);










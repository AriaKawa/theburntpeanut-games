'use strict';
// Arcade rules reference: https://pacman.holenet.info/ . AK combat is a custom extension.
const MAP=[
'############################',
'#............##............#',
'#.####.#####.##.#####.####.#',
'#o####.#####.##.#####.####o#',
'#.####.#####.##.#####.####.#',
'#..........................#',
'#.####.##.########.##.####.#',
'#.####.##.########.##.####.#',
'#......##....##....##......#',
'######.#####-##-#####.######',
'%%%%%#.#####-##-#####.#%%%%%',
'%%%%%#.##----------##.#%%%%%',
'%%%%%#.##-###==###-##.#%%%%%',
'######.##-#------#-##.######',
'------.---#------#---.------',
'######.##-#------#-##.######',
'%%%%%#.##-########-##.#%%%%%',
'%%%%%#.##----------##.#%%%%%',
'%%%%%#.##-########-##.#%%%%%',
'######.##-########-##.######',
'#............##............#',
'#.####.#####.##.#####.####.#',
'#.####.#####.##.#####.####.#',
'#o..##.......--.......##..o#',
'###.##.##.########.##.##.###',
'###.##.##.########.##.##.###',
'#......##....##....##......#',
'#.##########.##.##########.#',
'#.##########.##.##########.#',
'#..........................#',
'############################'];
// Original single classic maze; all five enemies share its central house.
const ORIGINAL_MAP=MAP.slice();
let selectedMap='classic',activeTheme=MAP_THEMES[0];
function applyMap(){activeTheme=MAP_THEMES.find(t=>t.id===selectedMap)||MAP_THEMES[0];MAP.splice(0,MAP.length,...themedLayout(ORIGINAL_MAP,activeTheme.id));document.body.dataset.map=activeTheme.id;}
const BASES=[{x:13,y:14,exitY:11}];
const ROLES=['hunter', 'ambusher', 'flanker', 'sweeper', 'beatkeeper'];
const GHOST_COLORS=['#ff4040', '#ff80c0', '#43dcff', '#ff962f', '#b58aff'];
const $=s=>document.querySelector(s),canvas=$('#game'),T=30,W=28,H=31;
let ctx=canvas.getContext('2d');
const mazeLayers=new Map();
canvas.width=W*T;canvas.height=H*T;
let boardScale=1;const WALL_INSET=6;
const dirs={up:{x:0,y:-1},left:{x:-1,y:0},down:{x:0,y:1},right:{x:1,y:0}},reverse={up:'down',down:'up',left:'right',right:'left'},angles={right:0,down:Math.PI/2,left:Math.PI,up:-Math.PI/2};
const keys={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down',a:'left',d:'right',w:'up',s:'down'};
const art={};for(const name of [...['neighborhood','scifi','fantasy'].flatMap(id=>[id+'-floor',id+'-wall']),'character-ghost0','character-ghost1','character-ghost2','character-ghost3','character-ghost4','burger',...['down','left','right','up'].flatMap(d=>[0,1].map(f=>'peanut-'+d+'-'+f)),'peanut','can','ghost0','ghost1','ghost2','ghost3','ghost4','floor','wall','ak','blood','flash','eyes','bullet',...Array.from({length:8},(_,i)=>'fruit'+i)]){art[name]=new Image();art[name].src='assets/'+name+(name==='character-ghost4'?'.png':'.webp')}
let spawnHighlight=0;
let mode='ready',score=0,best=0,level=1,lives=1,bonusLife=true,dots=new Map(),totalDots=244,eaten=0,player,ghosts=[],power=0,weapon=0,powerId=0,combo=0,clock=0,last=0,acc=0,phase=0,phaseTime=0,roundTime=0,noDotTime=0,deathTimer=0,freeze=0,readyTimer=0,fruit=null,fruitTriggers=new Set(),bullets=[],splats=[],effects=[],popups=[],fireHeld=false,fireCooldown=0,flashTimer=0,sound=true,audio,lastLives=-1,lastScore=-1,lastBest=-1,lastWeapon=-1;
try{best=Number(localStorage.getItem('pacnut-arcade-best'))||0}catch{}
const wrap=x=>(x+W)%W;
function wall(x,y,actor){if(y===14&&(x<0||x>=W))return false;const c=MAP[y]?.[x];if(!c||c==='#'||c==='%')return true;if(c==='=')return !(actor&&(actor.state==='eyes'||actor.state==='exiting'));return false}
function canGo(a,d){const v=dirs[d];return !wall(a.x+v.x,a.y+v.y,a)}
function actor(x,y,dir){return{x,y,px:x,py:y,dir,next:dir,progress:0,hold:0,offsetX:0,offsetY:0,offsetRemaining:0}}
function positions(){player=actor(13,23,'left');ghosts=ROLES.map((role,id)=>Object.assign(actor(11+(id%5),14+Math.floor(id/5),'up'),{id,base:0,role,color:GHOST_COLORS[id],state:'house',frightened:false,reversePending:false,releaseAt:roundTime+.5+id*4,revivedPower:-1,capturedPower:-1}));power=weapon=0;combo=0;phase=phaseTime=0;bullets=[];fireHeld=false;fireCooldown=0;readyTimer=2.5;spawnHighlight=6;freeze=0;noDotTime=0}
function makeLevel(){applyMap();mazeLayers.clear();dots.clear();MAP.forEach((row,y)=>[...row].forEach((c,x)=>{if(c==='.'||c==='o')dots.set(x+','+y,c==='o'?'power':'can')}));totalDots=dots.size;eaten=0;roundTime=0;fruit=null;fruitTriggers.clear();splats=[];effects=[];popups=[];positions()}
function ui(){const armed=weapon>0;if(lastWeapon!==armed){lastWeapon=armed;document.dispatchEvent(new CustomEvent('pacnut:weapon',{detail:{armed}}));}if(lastScore!==score){$('#score').textContent=String(score).padStart(6,'0');lastScore=score}if(lastBest!==best){$('#best').textContent=String(best).padStart(6,'0');lastBest=best}if(lastLives!==lives){$('#lives').innerHTML='<img src="assets/peanut-down-0.webp" alt="">'.repeat(lives);$('#lives').setAttribute('aria-label',lives+(lives===1?' life':' lives'));lastLives=lives}$('#pause').disabled=!['playing','paused'].includes(mode);$('#pause').className='icon '+(mode==='paused'?'play':'pause');$('#pause').setAttribute('aria-label',mode==='paused'?'Resume':'Pause');$('#progress').style.setProperty('--progress',(100*eaten/totalDots)+'%');$('#progress').setAttribute('aria-valuenow',Math.round(100*eaten/totalDots));$('#fire').disabled=weapon<=0||mode!=='playing';$('#fire').classList.toggle('armed',weapon>0);$('#fire').style.setProperty('--ammo',Math.min(1,weapon/6));$('#fire').setAttribute('aria-label',weapon>0?'AK-47 automatic fire':'AK-47 pickup required');}
function addScore(n,x,y){score+=n;if(!bonusLife&&score>=10000){bonusLife=true;lives++;beep(1200,.4)}if(score>best){best=score;try{localStorage.setItem('pacnut-arcade-best',best)}catch{}}if(x!==undefined)popups.push({x,y,n,life:1.2});ui()}
function deathSound(){if(!sound)return;try{audio??=new(window.AudioContext||window.webkitAudioContext)();audio.resume();const t=audio.currentTime;for(const[f,delay]of [[330,0],[220,.12],[110,.3]]){const o=audio.createOscillator(),g=audio.createGain(),filter=audio.createBiquadFilter();o.type='triangle';o.frequency.setValueAtTime(f,t+delay);o.frequency.exponentialRampToValueAtTime(35,t+delay+.65);filter.type='lowpass';filter.frequency.value=1400;g.gain.setValueAtTime(.0001,t+delay);g.gain.exponentialRampToValueAtTime(.12,t+delay+.015);g.gain.exponentialRampToValueAtTime(.0001,t+delay+.8);o.connect(filter);filter.connect(g);g.connect(audio.destination);o.start(t+delay);o.stop(t+delay+.85);o.onended=()=>{o.disconnect();filter.disconnect();g.disconnect()}}}catch{}}
function beep(freq=300,duration=.06,type='square',volume=.035){if(!sound)return;try{audio??=new(window.AudioContext||window.webkitAudioContext)();audio.resume();let o=audio.createOscillator(),g=audio.createGain();o.type=type;o.frequency.setValueAtTime(freq,audio.currentTime);o.frequency.exponentialRampToValueAtTime(freq*.45,audio.currentTime+duration);g.gain.setValueAtTime(volume,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+duration)}catch{}}
function show(){const dead=mode==='over';window.pacnutArcade.show(dead,score,selectedMap,level);document.body.classList.toggle('dead',dead);$('#death-score').hidden=!dead;$('#death-score').textContent=dead?'Score '+score.toLocaleString():'';$('#start').textContent=dead?'Try again':''; $('#overlay').style.display='flex';$('#start').className='icon '+(mode==='over'?'restart':'play');$('#start').setAttribute('aria-label',mode==='over'?'Try again':mode==='clear'?'Next level':mode==='paused'?'Resume':"Let's Ride");$('.hero').style.filter=mode==='over'?'grayscale(1)':'none';document.dispatchEvent(new CustomEvent('pacnut:overlay',{detail:{mode,score,level}}))}
async function start(){if(mode==='playing')return;window.pacnutArcade.show(false);if(mode==='paused'){pause();return}if(mode==='ready'||mode==='over'){score=0;level=1;lives=1;bonusLife=true;powerId=0;makeLevel()}else if(mode==='clear'){level++;makeLevel()}mode='playing';document.body.classList.remove('dead');document.dispatchEvent(new CustomEvent('pacnut:revive'));$('#overlay').style.display='none';acc=0;ui();beep(600,.15);canvas.focus({preventScroll:true})}
function pause(){fireHeld=false;if(mode==='playing'){mode='paused';show()}else if(mode==='paused'){mode='playing';$('#overlay').style.display='none'}ui()}
function reverseActor(a){if(a.progress>0){let x=a.x,y=a.y;a.x=a.px;a.y=a.py;a.px=x;a.py=y;a.progress=1-a.progress}a.dir=reverse[a.dir]}
function setDirection(d){if(mode!=='playing')return;player.next=d;if(d===reverse[player.dir]){reverseActor(player)}}
function schedule(){return level===1?[7,20,7,20,5,20,5,Infinity]:level<5?[7,20,7,20,5,1033,1/60,Infinity]:[5,20,5,20,5,1037,1/60,Infinity]}
function frightTime(){return [6,5,4,3,2,5,2,2,1,5,2,1,1,3,1,1,0,1][level-1]||0}
// A six-second phrase: trail, signal the drop, then rush. Pauses freeze roundTime.
function beatPhase(){return roundTime%6}
function speed(a){const base=75.75757625/8;let band=level===1?0:level<5?1:2;if(a===player)return base*(power?[.9,.95,1][band]:level>=21?.9:[.8,.9,1][band])*(weapon>0?1.1:1);if(a.state==='eyes')return base*1.8;if(a.state==='exiting')return base*.55;if(a.y===14&&(a.x<6||a.x>W-7))return base*[.4,.45,.5][band];if(a.frightened)return base*[.5,.55,.6][band];let scale=[.75,.85,.95][band];if(a.id===0){let limit=level===1?20:level===2?30:level<6?40:level<9?50:level<12?60:level<15?80:level<19?100:120;if(dots.size<=limit)scale=[.8,.9,1][band];if(dots.size<=limit/2)scale=[.85,.95,1.05][band]}if(a.role==='beatkeeper'&&a.state==='active'&&phase%2===1)scale*=beatPhase()>=4.5?1.25:.85;return base*scale}
function pos(a){const v=dirs[a.dir];let p=a.progress;return{x:((p?a.px+v.x*p:a.x)+a.offsetX*(a.offsetRemaining/.25))*T+T/2,y:((p?a.py+v.y*p:a.y)+a.offsetY*(a.offsetRemaining/.25))*T+T/2}}
function playerTile(){const p=pos(player);return{x:wrap(Math.floor(p.x/T)),y:Math.floor(p.y/T)}}
// Chase personalities are separate from the shared scatter/frightened schedule.
function target(g){
 const p=playerTile(),v=dirs[player.dir],role=g.role||ROLES[g.id],base=BASES[g.base||0];
 const corners=[{x:26,y:1},{x:1,y:1},{x:1,y:29},{x:26,y:29},{x:6,y:26},{x:26,y:1},{x:1,y:29},{x:26,y:29},{x:22,y:3},{x:6,y:26}];
 if(phase%2===0)return corners[g.id];
 if(role==='hunter')return p;
 if(role==='ambusher')return{x:p.x+v.x*4,y:p.y+v.y*4};
 if(role==='flanker'){const lead=ghosts[0];return{x:2*(p.x+v.x*2)-lead.x,y:2*(p.y+v.y*2)-lead.y};}
 if(role==='sweeper'){if(p.x<14)return p;return [{x:1,y:5},{x:26,y:5},{x:26,y:26},{x:1,y:29}][Math.floor(roundTime/6)%4];}
 if(role==='beatkeeper'){const ahead=beatPhase()>=4.5?6:-3;return{x:p.x+v.x*ahead,y:p.y+v.y*ahead};}
 return Math.hypot(g.x-p.x,g.y-p.y)>=8?p:corners[g.id];
}
function shortestDirection(g,tx,ty){let q=[[g.x,g.y,null]],seen=new Set([g.x+','+g.y]);while(q.length){const[x,y,first]=q.shift();if(x===tx&&y===ty)return first||g.dir;for(const[d,v]of Object.entries(dirs)){const nx=wrap(x+v.x),ny=y+v.y,k=nx+','+ny;if(!wall(x+v.x,ny,g)&&!seen.has(k)){seen.add(k);q.push([nx,ny,first||d])}}}return g.dir}
// Tile set directly ahead of the gun; walls and the ghost-house door occlude it.
function firingLane(){let p=playerTile(),v=dirs[player.dir],set=new Set([p.x+','+p.y]);for(let i=1;i<=W+H;i++){let x=p.x+v.x*i,y=p.y+v.y*i;if(x<0||x>=W||wall(x,y))break;set.add(x+','+y)}return set}
function escapeDistance(x,y,g,lane){let q=[[x,y,0]],seen=new Set();while(q.length){let[a,b,n]=q.shift(),k=a+','+b;if(seen.has(k))continue;seen.add(k);if(!lane.has(k))return n;if(n>W)break;for(const v of Object.values(dirs)){let nx=wrap(a+v.x),ny=b+v.y;if(!wall(a+v.x,ny,g))q.push([nx,ny,n+1])}}return 100}
function chooseGhost(g){const home=BASES[g.base||0];if(g.state==='eyes')return shortestDirection(g,home.x,home.y);if(g.state==='exiting')return shortestDirection(g,home.x,home.exitY);let options=Object.entries(dirs).filter(([d])=>canGo(g,d));if(g.reversePending){g.reversePending=false;const d=reverse[g.dir];if(canGo(g,d))return d}if(options.length>1)options=options.filter(([d])=>d!==reverse[g.dir]);if(!options.length)return reverse[g.dir];if(weapon>0&&g.capturedPower!==powerId){let lane=firingLane();const threatened=lane.has(g.x+','+g.y);if(threatened||options.some(([,v])=>lane.has(wrap(g.x+v.x)+','+(g.y+v.y)))){if(threatened)options=Object.entries(dirs).filter(([d])=>canGo(g,d));const p=playerTile();options.sort((a,b)=>{const rank=([,v])=>{let x=wrap(g.x+v.x),y=g.y+v.y;return(lane.has(x+','+y)?1000:0)+escapeDistance(x,y,g,lane)*30-Math.hypot(x-p.x,y-p.y)};return rank(a)-rank(b)});return options[0][0]}}
if(g.frightened)return options[Math.floor(Math.random()*options.length)][0];if((g.y===11||g.y===23)&&(g.x===12||g.x===15)){const restricted=options.filter(([d])=>d!=='up');if(restricted.length)options=restricted}let t=target(g);options.sort((a,b)=>{const dist=([,v])=>(g.x+v.x-t.x)**2+(g.y+v.y-t.y)**2;return dist(a)-dist(b)});return options[0][0]}
function onCenter(a){a.offsetX=a.offsetY=a.offsetRemaining=0;if(a===player){collect();return}const home=BASES[a.base||0];if(a.state==='eyes'&&a.x===home.x&&a.y===home.y){a.state='exiting';a.frightened=false;a.revivedPower=powerId}else if(a.state==='exiting'&&a.x===home.x&&a.y===home.exitY){a.state='active';a.frightened=power>0&&a.revivedPower!==powerId}}
// Consume the whole step, including leftover distance after crossing tile centers.
function move(a,dt){if(a.hold>0){let used=Math.min(dt,a.hold);a.hold-=used;dt-=used}let remaining=dt*speed(a),guard=0;while(remaining>1e-9&&guard++<8){if(a.progress===0){if(a===player){if(canGo(a,a.next))a.dir=a.next}else a.dir=chooseGhost(a);if(!canGo(a,a.dir))break;let v=dirs[a.dir];a.px=a.x;a.py=a.y;a.x=wrap(a.x+v.x);a.y+=v.y;a.progress=1e-10}
let turn=a===player&&a.next!==a.dir&&a.next!==reverse[a.dir]&&canGo(a,a.next)&&a.progress<.7500001&&!a.offsetX&&!a.offsetY;const end=turn?.75:1;let step=Math.min(remaining,Math.max(0,end-a.progress));a.progress+=step;remaining-=step;a.offsetRemaining=Math.max(0,a.offsetRemaining-step);if(a.progress+1e-8>=end){if(turn){const v=dirs[a.dir];a.offsetX=-v.x*.25;a.offsetY=-v.y*.25;a.offsetRemaining=.25;a.progress=0;collect();a.dir=a.next;/* The next .25 tile follows both axes, matching arcade pre-turns. */}else{a.progress=0;a.px=a.x;a.py=a.y;onCenter(a)}if(a===player){if(mode!=='playing')break;if(a.hold>0){let used=Math.min(remaining,a.hold*speed(a));a.hold-=used/speed(a);remaining-=used;if(a.hold>0)break}}}}
}
function fruitSpec(){let index=level===1?0:level===2?1:Math.min(7,Math.floor((level-1)/2)+1);return{index,value:[100,300,500,700,1000,2000,3000,5000][index]}}
function collect(){let k=player.x+','+player.y,value=dots.get(k);if(value){dots.delete(k);eaten++;noDotTime=0;addScore(value==='power'?50:10);player.hold=value==='power'?3/60:1/60;if(value==='power'){power=frightTime();weapon=Math.max(2,power);powerId++;combo=0;ghosts.forEach(g=>{if(g.state==='active'||g.state==='house'||g.state==='exiting'){g.frightened=power>0;g.reversePending=true}});beep(160,.35,'sawtooth')}else beep(250+(eaten%2)*100,.035,'triangle');for(const threshold of [70,170])if(eaten>=threshold&&!fruitTriggers.has(threshold)){fruitTriggers.add(threshold);fruit={...fruitSpec(),x:13,y:17,time:9+Math.random()}}if(!dots.size){mode='clearing';deathTimer=1.5;weapon=power=0;fireHeld=false;bullets=[];ui()}}if(fruit&&player.x===fruit.x&&player.y===fruit.y){addScore(fruit.value,fruit.x*T+15,fruit.y*T+15);fruit=null;beep(1000,.18)} }
function capture(g){if(g.state!=='active'||g.capturedPower===powerId)return false;const p=pos(g);let value=200*2**Math.min(combo,3);combo=Math.min(4,combo+1);addScore(value,p.x,p.y);g.capturedPower=powerId;g.state='eyes';g.frightened=false;g.reversePending=false;splats.push({x:p.x,y:p.y,angle:Math.random()*Math.PI*2,life:7});for(let i=0;i<18;i++){let a=Math.random()*Math.PI*2,v=40+Math.random()*150;effects.push({x:p.x,y:p.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:.35+Math.random()*.3})}splatSound();return true}
// Wet impact: descending low body with a short filtered noise splash.
function splatSound(){if(!sound)return;try{
 audio??=new(window.AudioContext||window.webkitAudioContext)();audio.resume().catch(()=>{});const now=audio.currentTime;
 const noise=audio.createBuffer(1,Math.ceil(audio.sampleRate*.2),audio.sampleRate),data=noise.getChannelData(0);let low=0;for(let i=0;i<data.length;i++){low=.65*low+.35*(Math.random()*2-1);data[i]=low}
 const splash=audio.createBufferSource(),filter=audio.createBiquadFilter(),gain=audio.createGain(),body=audio.createOscillator(),bodyGain=audio.createGain();
 splash.buffer=noise;filter.type='lowpass';filter.frequency.setValueAtTime(1600,now);filter.frequency.exponentialRampToValueAtTime(220,now+.19);gain.gain.setValueAtTime(.0001,now);gain.gain.linearRampToValueAtTime(.28,now+.006);gain.gain.exponentialRampToValueAtTime(.0001,now+.2);splash.connect(filter);filter.connect(gain);gain.connect(audio.destination);
 body.type='sine';body.frequency.setValueAtTime(130,now);body.frequency.exponentialRampToValueAtTime(38,now+.16);bodyGain.gain.setValueAtTime(.16,now);bodyGain.gain.exponentialRampToValueAtTime(.0001,now+.19);body.connect(bodyGain);bodyGain.connect(audio.destination);
 splash.onended=()=>{splash.disconnect();filter.disconnect();gain.disconnect()};body.onended=()=>{body.disconnect();bodyGain.disconnect()};splash.start(now);splash.stop(now+.21);body.start(now);body.stop(now+.21);
 }catch{}}
// Deep rifle pow: low noise burst, bass punch and a short mid body for small speakers.
let gunNoise,gunBus,gunOutput,lastGunShot=-Infinity;const gunVoices=new Set();
function stopGunSound(){for(const node of gunVoices){try{node.stop()}catch{}}gunVoices.clear()}
function gunShot(){if(!sound)return;try{
 audio??=new(window.AudioContext||window.webkitAudioContext)();audio.resume().catch(()=>{});const now=audio.currentTime;if(now-lastGunShot<.09)return;lastGunShot=now;
 if(!gunBus){gunBus=audio.createDynamicsCompressor();gunBus.threshold.value=-12;gunBus.knee.value=12;gunBus.ratio.value=3;gunBus.attack.value=.006;gunBus.release.value=.12;gunOutput=audio.createGain();gunOutput.gain.value=1.08;gunBus.connect(gunOutput);gunOutput.connect(audio.destination)}
 if(!gunNoise){gunNoise=audio.createBuffer(1,Math.ceil(audio.sampleRate*.23),audio.sampleRate);const data=gunNoise.getChannelData(0);let low=0;for(let i=0;i<data.length;i++){low=.65*low+.35*(Math.random()*2-1);data[i]=low}}
 const crack=audio.createBufferSource(),filter=audio.createBiquadFilter(),gain=audio.createGain();
 crack.buffer=gunNoise;filter.type='lowpass';filter.frequency.setValueAtTime(1400,now);filter.frequency.exponentialRampToValueAtTime(280,now+.2);filter.Q.value=.7;gain.gain.setValueAtTime(.0001,now);gain.gain.linearRampToValueAtTime(.42,now+.003);gain.gain.exponentialRampToValueAtTime(.0001,now+.22);crack.connect(filter);filter.connect(gain);gain.connect(gunBus);
 const body=audio.createOscillator(),bodyGain=audio.createGain();body.type='sine';body.frequency.setValueAtTime(140,now);body.frequency.exponentialRampToValueAtTime(48,now+.18);bodyGain.gain.setValueAtTime(.0001,now);bodyGain.gain.linearRampToValueAtTime(.38,now+.004);bodyGain.gain.exponentialRampToValueAtTime(.0001,now+.23);body.connect(bodyGain);bodyGain.connect(gunBus);
 const punch=audio.createOscillator(),punchGain=audio.createGain();punch.type='triangle';punch.frequency.setValueAtTime(260,now);punch.frequency.exponentialRampToValueAtTime(85,now+.09);punchGain.gain.setValueAtTime(.0001,now);punchGain.gain.linearRampToValueAtTime(.18,now+.003);punchGain.gain.exponentialRampToValueAtTime(.0001,now+.12);punch.connect(punchGain);punchGain.connect(gunBus);
 // Let the low tail overlap the next shot instead of chopping off its weight.
 for(const [node,duration,cleanup]of [[crack,.23,()=>{filter.disconnect();gain.disconnect()}],[body,.24,()=>bodyGain.disconnect()],[punch,.13,()=>punchGain.disconnect()]]){gunVoices.add(node);node.start(now);node.stop(now+duration);node.onended=()=>{gunVoices.delete(node);node.disconnect();cleanup()}}
 }catch{}}
function fire(){if(mode!=='playing'||weapon<=0||fireCooldown>0||readyTimer>0||freeze>0)return;const p=pos(player),v=dirs[player.dir];bullets.push({x:p.x,y:p.y,dir:player.dir,life:1.6});fireCooldown=.15;flashTimer=.065;gunShot()}
function updateBullets(dt){for(const b of bullets){b.life-=dt;const v=dirs[b.dir];let travel=dt*T*24;while(travel>0&&b.life>0){let step=Math.min(3,travel);travel-=step;b.x+=v.x*step;b.y+=v.y*step;let x=Math.floor(b.x/T),y=Math.floor(b.y/T);if(x<0||x>=W||wall(x,y)){b.life=0;break}for(const g of ghosts){if(g.state!=='active'||g.capturedPower===powerId)continue;const p=pos(g);if(Math.hypot(p.x-b.x,p.y-b.y)<T*.43){capture(g);b.life=0;break}}}}bullets=bullets.filter(b=>b.life>0)}
function update(dt){if(mode==='paused'||mode==='ready'||mode==='over'||mode==='clear')return;clock+=dt;for(const s of splats)s.life-=dt;splats=splats.filter(s=>s.life>0).slice(-25);for(const e of effects){e.life-=dt;e.x+=e.vx*dt;e.y+=e.vy*dt;e.vx*=.96;e.vy*=.96}effects=effects.filter(e=>e.life>0);for(const p of popups){p.life-=dt;p.y-=dt*12}popups=popups.filter(p=>p.life>0);
if(mode==='dying'||mode==='clearing'){deathTimer-=dt;if(deathTimer<=0){if(mode==='clearing'){level++;makeLevel();mode='playing'}else{mode='over';show()}ui()}return}spawnHighlight=Math.max(0,spawnHighlight-dt);if(readyTimer>0){readyTimer=Math.max(0,readyTimer-dt);return}if(freeze>0){freeze-=dt;return}roundTime+=dt;noDotTime+=dt;fireCooldown=Math.max(0,fireCooldown-dt);flashTimer=Math.max(0,flashTimer-dt);weapon=Math.max(0,weapon-dt);if(weapon===0){bullets=[];fireHeld=false}if(power>0){power=Math.max(0,power-dt);if(!power)ghosts.forEach(g=>g.frightened=false)}else{phaseTime+=dt;if(phaseTime>=schedule()[phase]){phaseTime-=schedule()[phase];phase++;ghosts.forEach(g=>{if(g.state==='active')g.reversePending=true})}}if(fruit){fruit.time-=dt;if(fruit.time<=0)fruit=null}
move(player,dt);if(mode!=='playing')return;for(const g of ghosts){if(g.state==='house'){const slot=g.id%5,threshold=g.id===0||slot===1?0:(level===1?30:0);if(roundTime>=g.releaseAt&&(eaten>=threshold||noDotTime>=(level<5?4:3))){g.state='exiting';noDotTime=0}else continue}move(g,dt)}if(weapon>0)fire();updateBullets(dt);let p=pos(player);for(const g of ghosts){if(g.state!=='active')continue;let q=pos(g),dx=Math.abs(q.x-p.x);dx=Math.min(dx,W*T-dx);if(Math.hypot(dx,q.y-p.y)<T*.55){if(g.frightened&&g.capturedPower!==powerId){capture(g);freeze=.35}else{lives=0;mode='dying';deathTimer=1.4;document.dispatchEvent(new CustomEvent('pacnut:death'));deathSound();weapon=power=0;fireHeld=false;bullets=[];fruit=null;break}}}ui()}
function sprite(name,x,y,w,h){
 const im=typeof name==='string'?art[name]:name;if(!im||(!im.naturalWidth&&!(im instanceof HTMLCanvasElement)))return;
 // Place sprites on the fitted grid, but draw them at a uniform native scale.
 const m=ctx.getTransform(),px=m.a*x+m.c*y+m.e,py=m.b*x+m.d*y+m.f;
 ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.translate(px,py);ctx.rotate(Math.atan2(m.b,m.a));
 ctx.drawImage(im,-w*boardScale/2,-h*boardScale/2,w*boardScale,h*boardScale);ctx.restore();
}
function rotated(name,x,y,w,h,angle){ctx.save();ctx.translate(x,y);ctx.rotate(angle);sprite(name,0,0,w,h);ctx.restore()}
const ghostTints=new Map();
function coloredGhost(g,p){
 const special={0:0,2:1,1:2,3:3,4:4}[g.id];
 if(g.role==='beatkeeper'&&g.state==='active'&&!g.frightened&&phase%2===1&&beatPhase()>=3.75){ctx.save();ctx.strokeStyle=beatPhase()>=4.5?'#ffe34c':'#b58aff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y,19+Math.sin(roundTime*16)*2,0,Math.PI*2);ctx.stroke();ctx.restore();}
 if(special!==undefined){sprite('character-ghost'+special,p.x,p.y, g.id===0?36:32,34);return;}
 const im=art.ghost0;if(!im.complete||!im.naturalWidth)return;
 let tinted=ghostTints.get(g.id);if(!tinted){tinted=document.createElement('canvas');tinted.width=tinted.height=64;const c=tinted.getContext('2d');c.drawImage(im,0,0,64,64);c.globalCompositeOperation='source-atop';c.globalAlpha=.82;c.fillStyle=g.color;c.fillRect(0,0,64,64);ghostTints.set(g.id,tinted);}
 sprite(tinted,p.x,p.y,30,32);sprite('eyes',p.x,p.y-4,15,10);
}
function peanutWalk(x,y){
 const moving=mode==='playing'&&readyTimer<=0&&freeze<=0&&player.progress>0;
 const frame=moving?Math.floor(roundTime*9)%2:0;
 const v=dirs[player.dir],bob=moving&&frame?1.5:0;
 sprite('peanut-'+player.dir+'-'+frame,x+v.x*bob,y+v.y*bob-bob,31.5,42);
}
function paintMaze(){drawMapGround();MAP.forEach((row,y)=>[...row].forEach((c,x)=>{
 const px=x*T,py=y*T;
 if(c==='%'){if(activeTheme.id==='classic'){ctx.fillStyle='#100b08';ctx.fillRect(px,py,T,T)}else drawMapWall(px,py);return}
 if(c==='='){ctx.fillStyle=activeTheme.accent;ctx.fillRect(px,py+T/2-2,T,4);return}
 if(c!=='#')return;
 // Inset only exposed faces: adjoining wall tiles remain one solid shape.
 const left=!wall(x-1,y),right=!wall(x+1,y),top=!wall(x,y-1),bottom=!wall(x,y+1);
 const x0=left?WALL_INSET:0,x1=right?T-WALL_INSET:T,y0=top?WALL_INSET:0,y1=bottom?T-WALL_INSET:T;
 ctx.save();ctx.beginPath();ctx.rect(px+x0,py+y0,x1-x0,y1-y0);ctx.clip();drawMapWall(px,py);ctx.restore();
 ctx.strokeStyle=weapon?activeTheme.accent:activeTheme.edge;ctx.lineWidth=1.5;ctx.shadowColor=weapon?activeTheme.accent:activeTheme.glow;ctx.shadowBlur=3;
 for(const [visible,ax,ay,bx,by]of [[top,x0,y0,x1,y0],[bottom,x0,y1,x1,y1],[left,x0,y0,x0,y1],[right,x1,y0,x1,y1]])if(visible){ctx.beginPath();ctx.moveTo(px+ax,py+ay);ctx.lineTo(px+bx,py+by);ctx.stroke()}
 ctx.shadowBlur=0;
}));
}
// Rasterize the textured walls once per theme, resolution and weapon state.
function drawMaze(){
 const key=activeTheme.id+':'+canvas.width+':'+canvas.height+':'+(weapon>0);
 let layer=mazeLayers.get(key);
 if(!layer){
  layer=document.createElement('canvas');layer.width=canvas.width;layer.height=canvas.height;
  const live=ctx;ctx=layer.getContext('2d');ctx.setTransform(live.getTransform());
  try{paintMaze()}finally{ctx=live}
  mazeLayers.set(key,layer);
 }
 ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(layer,0,0);ctx.restore();
}
function draw(){ctx.clearRect(0,0,W*T,H*T);drawMaze();
for(const s of splats){ctx.globalAlpha=Math.min(.8,s.life/2);rotated('blood',s.x,s.y,64,64,s.angle)}ctx.globalAlpha=1;dots.forEach((v,k)=>{let[x,y]=k.split(',').map(Number);if(v==='can')sprite('burger',x*T+15,y*T+15,25,24);else{ctx.save();ctx.globalAlpha=.85+Math.sin(clock*6)*.15;ctx.shadowColor='#ffb44f';ctx.shadowBlur=12;rotated('ak',x*T+15,y*T+15,39,16,-.55);ctx.restore()}});if(fruit)sprite('fruit'+fruit.index,fruit.x*T+15,fruit.y*T+15,29,29);
for(const g of ghosts){const p=pos(g);if(g.state==='eyes'){sprite('eyes',p.x,p.y,22,16);continue}ctx.save();ctx.shadowColor=g.color;ctx.shadowBlur=g.frightened?0:7;if(g.frightened){if(power<1.5&&Math.floor(clock*10)%2)ctx.filter='brightness(2) saturate(0)';sprite('ghost4',p.x,p.y,30,32);}else{coloredGhost(g,p);};ctx.restore();}
let p=pos(player);ctx.save();if(mode==='dying'){ctx.globalAlpha=Math.max(0,deathTimer/1.4);ctx.translate(p.x,p.y);ctx.rotate((1.4-deathTimer)*8);sprite('peanut-down-0',0,0,31.5,42)}else{const starting=readyTimer>0||mode==='ready';ctx.shadowColor='#ffff80';ctx.shadowBlur=starting?26+Math.sin(clock*6)*4:0;ctx.filter=starting?'brightness(1.3) saturate(1.35)':'none';peanutWalk(p.x,p.y);if(p.x<25)peanutWalk(p.x+W*T,p.y);if(p.x>W*T-25)peanutWalk(p.x-W*T,p.y)}ctx.restore();if(weapon>0){const v=dirs[player.dir],angle=angles[player.dir];rotated('ak',p.x+v.x*12,p.y+v.y*12,36,14,angle);if(flashTimer>0)rotated('flash',p.x+v.x*32,p.y+v.y*32,27,20,angle)}ctx.save();ctx.shadowColor='#ffca55';ctx.shadowBlur=9;for(const b of bullets)rotated('bullet',b.x,b.y,32,8,angles[b.dir]);ctx.restore();for(const e of effects){ctx.globalAlpha=Math.min(1,e.life*3);sprite('blood',e.x,e.y,7,7)}ctx.globalAlpha=1;ctx.textAlign='center';ctx.font='bold 17px monospace';ctx.fillStyle='#fff0b6';for(const n of popups){ctx.globalAlpha=Math.min(1,n.life*2);ctx.fillText(n.n,n.x,n.y)}ctx.globalAlpha=1;
}
function frame(t){let dt=Math.min((t-last)/1000,.05);last=t;acc+=dt;while(acc>=1/120){update(1/120);acc-=1/120}draw();requestAnimationFrame(frame)}
document.addEventListener('keydown',e=>{if(e.target.closest?.('input,textarea,dialog,a,button'))return;if(e.target?.tagName==='SELECT')return;let k=e.key.length===1?e.key.toLowerCase():e.key;if(keys[k]){e.preventDefault();setDirection(keys[k])}else if(e.code==='Space'){e.preventDefault();fireHeld=true;fire()}else if(e.key==='Enter'&&['ready','over','clear','paused'].includes(mode)){e.preventDefault();start()}else if(k==='p'){e.preventDefault();pause()}else if(k==='m')toggleSound()});document.addEventListener('keyup',e=>{if(e.code==='Space')fireHeld=false});
function toggleSound(){document.getElementById('music').click()}

$('#map-select').onchange=e=>{selectedMap=e.target.value;fireHeld=false;mode='ready';score=0;level=1;lives=1;bonusLife=true;powerId=0;makeLevel();show();ui();e.target.blur()};
$('#start').onclick=start;$('#pause').onclick=pause;$('#restart').onclick=()=>{mode='over';start()};$('#fire').onpointerdown=e=>{e.preventDefault();fireHeld=true;fire();$('#fire').setPointerCapture(e.pointerId)};$('#fire').onpointerup=$('#fire').onpointercancel=()=>fireHeld=false;document.querySelectorAll('[data-dir]').forEach(b=>b.onpointerdown=e=>{e.preventDefault();setDirection(b.dataset.dir)});let touchStart;canvas.addEventListener('pointerdown',e=>{touchStart={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId)});canvas.addEventListener('pointermove',e=>{if(!touchStart)return;let dx=e.clientX-touchStart.x,dy=e.clientY-touchStart.y;if(Math.max(Math.abs(dx),Math.abs(dy))>10){setDirection(Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy>0?'down':'up');touchStart={x:e.clientX,y:e.clientY}}});canvas.addEventListener('pointerup',()=>touchStart=null);canvas.addEventListener('pointercancel',()=>touchStart=null);document.addEventListener('visibilitychange',()=>{if(document.hidden&&mode==='playing')pause()});window.addEventListener('blur',()=>{fireHeld=false;if(mode==='playing')pause()});makeLevel();ui();Promise.all(Object.values(art).map(im=>im.decode().catch(()=>{}))).then(()=>{last=performance.now();requestAnimationFrame(frame)});





$('#game-back').addEventListener('click',event=>{
 if(!$('#board').hidden){event.preventDefault();$('#board-close').click();return;}
 if(mode==='ready')return;
 event.preventDefault();fireHeld=false;mode='ready';score=0;level=1;lives=1;makeLevel();show();ui();$('#game-back').focus();
});
function fitBoard(){
 const screen=document.querySelector('.screen');
 const scale=Math.min(screen.clientWidth/(W*T),screen.clientHeight/(H*T));
 const width=W*T*scale,height=H*T*scale;
 if(!width||!height)return;
 const dpr=Math.min(devicePixelRatio||1,2,1440/Math.max(width,height)),pixelWidth=Math.round(width*dpr),pixelHeight=Math.round(height*dpr);
 canvas.style.width=width+'px';canvas.style.height=height+'px';
 if(canvas.width!==pixelWidth||canvas.height!==pixelHeight){canvas.width=pixelWidth;canvas.height=pixelHeight;mazeLayers.clear();}
 const sx=pixelWidth/(W*T),sy=pixelHeight/(H*T);boardScale=Math.min(sx,sy);
 ctx.setTransform(sx,0,0,sy,0,0);ctx.imageSmoothingEnabled=true;
}
window.addEventListener('resize',fitBoard);
document.addEventListener('fullscreenchange',fitBoard);
new ResizeObserver(fitBoard).observe(document.querySelector('.screen'));fitBoard();

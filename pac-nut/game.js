/* Pac-Nut — self-contained canvas arcade. */
'use strict';
const MAP=[
'#####################',
'#o........#........o#',
'#.##.####.#.####.##.#',
'#...................#',
'#.##.#.#######.#.##.#',
'#....#....#....#....#',
'####.####.#.####.####',
'#....#.........#....#',
'#.##.#.##...##.#.##.#',
'#......#.....#......#',
'#.####.#.....#.####.#',
'.......#.....#.......',
'#.####.#######.####.#',
'#.........#.........#',
'#.##.####.#.####.##.#',
'#..#.............#..#',
'##.#.#.#######.#.#.##',
'#....#....#....#....#',
'#.#######.#.#######.#',
'#...................#',
'#.##.####.#.####.##.#',
'#o........#........o#',
'#####################'];
const canvas=document.querySelector('#game'),ctx=canvas.getContext('2d'),$=s=>document.querySelector(s),T=30,W=21,H=23;
const dirs={left:{x:-1,y:0},right:{x:1,y:0},up:{x:0,y:-1},down:{x:0,y:1}},keys={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down',a:'left',d:'right',w:'up',s:'down'};
let lastLives=-1;let totalDots=1;const art={};for(const name of ['peanut','can','ghost0','ghost1','ghost2','ghost3','ghost4','power','floor','wall']){art[name]=new Image();art[name].src='assets/'+name+'.png';}
let score=0,best=0,level=1,lives=3,mode='ready',dots=new Map(),player,ghosts=[],power=0,invincible=0,clock=0,acc=0,last=0,particles=[],sound=false,audio,ghostCombo=0;
try{best=Number(localStorage.getItem('pacnut-best'))||0}catch{};
function wall(x,y){if(y===11&&(x<0||x>=W))return false;return !MAP[y]||MAP[y][x]==='#'||MAP[y][x]===undefined}
function wrap(x){return (x+W)%W}
function resetActors(){player={x:10,y:19,px:10,py:19,dir:'left',next:'left',progress:0};ghosts=['#ef625b','#f29bc3','#66cfce','#f4ab53'].map((color,i)=>({x:9+i%3,y:9+Math.floor(i/3),px:9+i%3,py:9+Math.floor(i/3),dir:'up',progress:0,color,delay:1+i*.8}));invincible=2;power=0}
function makeLevel(){dots.clear();MAP.forEach((row,y)=>[...row].forEach((v,x)=>{if(v!== '#'&&!(x>=8&&x<=12&&y>=8&&y<=11)&&!(x===10&&y===19))dots.set(x+','+y,v==='o'?'power':'can')}));totalDots=dots.size;resetActors()}
function ui(){$('#score').textContent=String(score).padStart(6,'0');$('#best').textContent=String(best).padStart(6,'0');if(lastLives!==lives){$('#lives').innerHTML='<img src="assets/peanut.png" alt="">'.repeat(lives);lastLives=lives;}$('#lives').setAttribute('aria-label',lives+' lives');$('#pause').disabled=!['playing','paused'].includes(mode);$('#pause').className='icon '+(mode==='paused'?'play':'pause');$('#pause').setAttribute('aria-label',mode==='paused'?'Resume':'Pause');let p=100*(1-dots.size/totalDots);$('#progress').style.setProperty('--progress',p+'%');$('#progress').setAttribute('aria-valuenow',Math.round(p));}
function addScore(n){score+=n;if(score>best){best=score;try{localStorage.setItem('pacnut-best',best)}catch{}}ui()}
function beep(freq=300,duration=.06,type='square'){if(!sound)return;try{audio??=new(window.AudioContext||window.webkitAudioContext)();audio.resume();let o=audio.createOscillator(),g=audio.createGain();o.type=type;o.frequency.setValueAtTime(freq,audio.currentTime);o.frequency.exponentialRampToValueAtTime(freq*.6,audio.currentTime+duration);g.gain.setValueAtTime(.035,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+duration)}catch{}}
function show(){ $('#overlay').style.display='flex';$('#start').className='icon '+(mode==='over'?'restart':'play');$('#start').setAttribute('aria-label',mode==='over'?'Ride again':mode==='clear'?'Next level':mode==='paused'?'Resume':"Let's Ride");$('.hero').style.filter=mode==='over'?'grayscale(1) drop-shadow(0 8px 25px #000)':'drop-shadow(0 8px 25px #000)';}
function start(){if(mode==='paused'){pause();return}if(mode==='ready'||mode==='over'){score=0;level=1;lives=3;makeLevel()}else if(mode==='clear'){level++;makeLevel()}mode='playing';$('#overlay').style.display='none';acc=0;ui();beep(600,.15);canvas.focus({preventScroll:true})}
function pause(){if(mode==='playing'){mode='paused';show('SNACK<br><em>BREAK.</em>','Your Rangers aren’t going anywhere.','KEEP ROLLING')}else if(mode==='paused'){mode='playing';$('#overlay').style.display='none'}ui()}
function setDirection(d){if(mode==='playing')player.next=d}
function chooseGhost(g,i){let options=Object.entries(dirs).filter(([d,v])=>!wall(g.x+v.x,g.y+v.y));const reverse={left:'right',right:'left',up:'down',down:'up'};if(options.length>1)options=options.filter(([d])=>d!==reverse[g.dir]);let tx=player.x,ty=player.y;const chase=clock%24>6;if(!chase){tx=i%2?19:1;ty=i<2?1:21}else if(i===1){tx+=dirs[player.dir].x*3;ty+=dirs[player.dir].y*3}else if(i===2&&Math.hypot(g.x-tx,g.y-ty)<5){tx=1;ty=21}if(Math.random()<.16)return options[Math.floor(Math.random()*options.length)]?.[0]||g.dir;options.sort((a,b)=>{let da=Math.hypot(g.x+a[1].x-tx,g.y+a[1].y-ty),db=Math.hypot(g.x+b[1].x-tx,g.y+b[1].y-ty);return power?db-da:da-db});return options[0]?.[0]||g.dir}
function move(a,dt,speed,isPlayer=false,i=0){if(a.progress===0){if(isPlayer){let v=dirs[a.next];if(!wall(a.x+v.x,a.y+v.y))a.dir=a.next}else a.dir=chooseGhost(a,i);let v=dirs[a.dir];if(wall(a.x+v.x,a.y+v.y))return;a.px=a.x;a.py=a.y;a.x=wrap(a.x+v.x);a.y+=v.y;a.progress=.00001}a.progress+=dt*speed;if(a.progress>=1){a.progress=0;a.px=a.x;a.py=a.y;if(isPlayer)collect()}}
function collect(){let key=player.x+','+player.y,value=dots.get(key);if(!value)return;dots.delete(key);addScore(value==='power'?50:10);if(value==='power'){power=7;ghostCombo=0;beep(160,.4,'sawtooth')}else beep(250+(score%70)*4,.035,'triangle');for(let i=0;i<4;i++)particles.push({x:player.x*T+15,y:player.y*T+15,vx:(Math.random()-.5)*80,vy:(Math.random()-.5)*80,life:.35});if(!dots.size){mode='clear';addScore(500*level);show('MAZE<br><em>ROASTED.</em>','Clean sweep! +'+500*level+' bonus points.','NEXT LEVEL');ui()}}
function pos(a){let v=dirs[a.dir],p=a.progress;return{x:(p?a.px+v.x*p:a.x)*T+15,y:(p?a.py+v.y*p:a.y)*T+15}}
function update(dt){clock+=dt;particles=particles.filter(p=>(p.life-=dt)>0);particles.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt});if(mode!=='playing')return;power=Math.max(0,power-dt);invincible=Math.max(0,invincible-dt);move(player,dt,6.2+Math.min(level-1,10)*.2,true);if(mode!=='playing')return;ghosts.forEach((g,i)=>{if(g.delay>0){g.delay-=dt;return}move(g,dt,power?3.4:4.5+Math.min(level-1,10)*.22,false,i)});let pp=pos(player);for(const g of ghosts){let gp=pos(g),dx=Math.abs(gp.x-pp.x);dx=Math.min(dx,W*T-dx);if(Math.hypot(dx,gp.y-pp.y)<20&&g.delay<=0){if(power){addScore(200*2**Math.min(ghostCombo++,3));g.x=g.px=10;g.y=g.py=10;g.progress=0;g.delay=2;beep(900,.12)}else if(!invincible){lives--;beep(110,.5,'sawtooth');if(!lives){mode='over';show('EXTRA<br><em>CRISPY.</em>','You scored '+score.toLocaleString()+' points. Another round?','ROLL AGAIN')}else resetActors();ui();break}}}ui()}
function rounded(x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r)}
function sprite(name,x,y,w,h){const im=art[name];if(im?.complete&&im.naturalWidth)ctx.drawImage(im,x-w/2,y-h/2,w,h)}
function peanut(x,y,size=1){ctx.save();ctx.translate(x,y);ctx.rotate(Math.sin(clock*12)*.07);if(invincible>0&&mode==='playing'&&Math.floor(clock*9)%2===0)ctx.globalAlpha=.5;sprite('peanut',0,0,24*size,43*size);ctx.restore()}
function ghost(g){const p=pos(g),index=power?4:ghosts.indexOf(g);sprite('ghost'+index,p.x,p.y+Math.sin(clock*6+g.x),28,30)}
function draw(){ctx.clearRect(0,0,630,690);if(art.floor?.complete&&art.floor.naturalWidth){ctx.fillStyle=ctx.createPattern(art.floor,'repeat');ctx.fillRect(0,0,630,690)}MAP.forEach((row,y)=>[...row].forEach((v,x)=>{if(v!=='#')return;let px=x*T,py=y*T;if(art.wall?.complete&&art.wall.naturalWidth)ctx.drawImage(art.wall,px,py,T,T);ctx.fillStyle='#08050288';ctx.fillRect(px,py,T,T);ctx.strokeStyle=power?'#eacb75':'#c68b4b';ctx.lineWidth=2;ctx.shadowColor=power?'#ffe18c':'#d77529';ctx.shadowBlur=5;for(const [dx,dy,ax,ay,bx,by] of [[0,-1,0,3,30,3],[0,1,0,27,30,27],[-1,0,3,0,3,30],[1,0,27,0,27,30]])if(!wall(x+dx,y+dy)){ctx.beginPath();ctx.moveTo(px+ax,py+ay);ctx.lineTo(px+bx,py+by);ctx.stroke()}ctx.shadowBlur=0}));dots.forEach((v,k)=>{let[x,y]=k.split(',').map(Number);if(v==='can')sprite('can',x*T+15,y*T+15,14,23);else sprite('power',x*T+15,y*T+15,27+Math.sin(clock*4)*3,27+Math.sin(clock*4)*3)});ghosts.forEach(ghost);let pp=pos(player);peanut(pp.x,pp.y);if(pp.x<20)peanut(pp.x+630,pp.y);if(pp.x>610)peanut(pp.x-630,pp.y);particles.forEach(p=>{ctx.globalAlpha=p.life/.35;sprite('power',p.x,p.y,5,5)});ctx.globalAlpha=1}

function frame(t){let dt=Math.min((t-last)/1000,.05);last=t;acc+=dt;while(acc>=1/120){update(1/120);acc-=1/120}draw();requestAnimationFrame(frame)}
document.addEventListener('keydown',e=>{if(keys[e.key]){e.preventDefault();setDirection(keys[e.key])}else if(e.key==='Enter'&&mode!=='playing'){e.preventDefault();start()}else if(e.key.toLowerCase()==='p'||e.code==='Space'){e.preventDefault();pause()}else if(e.key.toLowerCase()==='m')toggleSound()});
function toggleSound(){sound=!sound;$('#sound').className='icon '+(sound?'sound':'mute');$('#sound').setAttribute('aria-pressed',String(sound));if(sound)beep(500,.08)}
$('#sound').onclick=toggleSound;$('#start').onclick=start;$('#pause').onclick=pause;$('#restart').onclick=()=>{mode='over';start()};document.querySelectorAll('[data-dir]').forEach(b=>b.onpointerdown=e=>{e.preventDefault();setDirection(b.dataset.dir)});let touchStart;canvas.addEventListener('pointerdown',e=>{touchStart={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId)});canvas.addEventListener('pointermove',e=>{if(!touchStart)return;let dx=e.clientX-touchStart.x,dy=e.clientY-touchStart.y;if(Math.max(Math.abs(dx),Math.abs(dy))>12){setDirection(Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy>0?'down':'up');touchStart={x:e.clientX,y:e.clientY}}});canvas.addEventListener('pointerup',()=>touchStart=null);canvas.addEventListener('pointercancel',()=>touchStart=null);document.addEventListener('visibilitychange',()=>{if(document.hidden&&mode==='playing')pause()});makeLevel();ui();Promise.all(Object.values(art).map(im=>im.decode().catch(()=>{}))).then(()=>{last=performance.now();requestAnimationFrame(frame)});


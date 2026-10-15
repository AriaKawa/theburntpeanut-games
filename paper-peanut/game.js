import { CHAPTERS, MOVES, freshRun, attackDamage, incomingDamage, hitEnemy, advanceChapter, jumpHits, createContactCommand, pressContact, contactTiming, CONTACT_GRACE_MS, PACE, jumpPose, applyUpgrade } from './engine.mjs';
import { PROFILE_KEY, ARSENAL, readProfile, unlockAbility, equipAbility, rewardEncounter } from './progression.mjs';

const $ = id => document.getElementById(id);
const canvas = $('stage');
const ctx = canvas.getContext('2d');
const gameEl = $('game');
const images = {};
const state = {
  phase: 'loading', run: freshRun(), selected: 0, time: 0, paused: false,
  relaxed: false, mobile: false, W: 1440, H: 810, actors: [], particles: [],
  floats: [], tweens: [], command: null, shake: 0, session: 0, calloutUntil: 0,
  fxTime: 0, freeze: 0, impacts: [], trails: [], projectiles: [],
  reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
};
let best = 0;
let profile=readProfile(null), storageAvailable=true;
try {profile=readProfile(localStorage.getItem(PROFILE_KEY));} catch {storageAvailable=false;}
try { best = Number(localStorage.getItem('goop-run-best') || 0); state.relaxed = localStorage.getItem('rat-tales-cozy') === 'true'; } catch {}
$('relaxed').checked = state.relaxed;

function saveProfile() {
  try {localStorage.setItem(PROFILE_KEY,JSON.stringify(profile));storageAvailable=true;} catch {storageAvailable=false;}
  updateHome();
}
function updateHome() {
  $('arsenal-wallet').textContent=`${profile.scrap}`;
}
function renderArsenal() {
  $('arsenal-wallet').textContent=String(profile.scrap);
  $('arsenal-wallet').setAttribute('aria-label',profile.scrap+' scrap');
  $('arsenal-cards').replaceChildren(...Object.entries(ARSENAL).map(([key,a])=>{
    const unlocked=profile.unlocked.includes(key),equipped=profile.equipped===key;
    const card=document.createElement('article');card.className='ability-slot'+(equipped?' equipped':'')+(unlocked?'':' locked');card.dataset.ability=key;
    const sticker=document.createElement('button');sticker.className='sticker-control';sticker.innerHTML='<span>'+a.name+'</span>';
    sticker.setAttribute('aria-label',(equipped?'Equipped ':unlocked?'Equip ':'About ')+a.name);
    sticker.setAttribute('aria-pressed',String(equipped));
    const detail=a.detail+' '+MOVES[key].base+' damage · '+MOVES[key].cost+' ✦'+(!unlocked&&profile.clears<a.clears?' · '+profile.clears+'/'+a.clears+' clears':'');
    sticker.dataset.tip=detail;
    sticker.onclick=()=>{if(!unlocked){showAbilityTip(sticker);return;}if(equipAbility(profile,key)){hideAbilityTip();saveProfile();renderArsenal();$('arsenal-status').textContent=a.name+' equipped.';}};
    card.append(sticker);
    if(!unlocked){const unlock=document.createElement('button');unlock.className='unlock-sticker';unlock.textContent='Unlock · '+a.cost+' scrap';unlock.disabled=profile.scrap<a.cost||profile.clears<a.clears;unlock.setAttribute('aria-label','Unlock '+a.name+' for '+a.cost+' scrap');unlock.onclick=()=>{if(unlockAbility(profile,key)){hideAbilityTip();saveProfile();renderArsenal();audio.good();$('arsenal-status').textContent=a.name+' unlocked.';}};card.append(unlock);}
    return card;
  }));
}
let abilityTip;
function hideAbilityTip(){if(abilityTip)abilityTip.hidden=true;document.querySelectorAll('[aria-describedby="ability-tooltip"]').forEach(el=>el.removeAttribute('aria-describedby'));}
function showAbilityTip(button){
  if(!abilityTip){abilityTip=document.createElement('div');abilityTip.id='ability-tooltip';abilityTip.className='ability-tooltip';abilityTip.setAttribute('role','tooltip');document.body.append(abilityTip);}
  abilityTip.textContent=button.dataset.tip;abilityTip.hidden=false;button.setAttribute('aria-describedby','ability-tooltip');
  const rect=button.getBoundingClientRect(),box=abilityTip.getBoundingClientRect();
  abilityTip.style.left=Math.max(12,Math.min(innerWidth-box.width-12,rect.left+rect.width/2-box.width/2))+'px';
  abilityTip.style.top=Math.max(12,rect.top>box.height+20?rect.top-box.height-8:Math.min(innerHeight-box.height-12,rect.bottom+8))+'px';
}

function home() {
  setArsenalPage(false);
  state.session++;state.tweens=[];state.command=null;state.phase='title';state.paused=false;
  state.floats=[];state.particles=[];state.impacts=[];state.trails=[];state.projectiles=[];state.freeze=0;state.shake=0;
  hideCombat();setHidden('result',true);setHidden('hud',true);setHidden('title-screen',false);$('pause').disabled=true;
  gameEl.dataset.action='';updateHome();renderArsenal();$('footer-hint').textContent='Clear encounters · upgrade your moves · unlock the Arsenal';
}

// Small procedural score: plucked notes, wooden impacts, and a warm sewer hum.
const audio = {
  on: true, ctx: null, master: null, nextBeat: 0, step: 0,
  init() {
    if (!this.ctx) {
      const Context=window.AudioContext || window.webkitAudioContext;
      if(!Context)return;
      this.ctx=new Context();this.master=this.ctx.createGain();
      this.master.gain.value=this.on?.65:0;this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended' && this.on && !state.paused) this.ctx.resume().catch(()=>{});
  },
  tone(freq, length = .12, type = 'sine', volume = .05, slide = 1, delay = 0) {
    if (!this.on || !this.ctx || state.paused) return;
    const ac = this.ctx, osc = ac.createOscillator(), gain = ac.createGain(), at=ac.currentTime+delay;
    osc.type = type; osc.frequency.setValueAtTime(freq, at);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq * slide), at + length);
    gain.gain.setValueAtTime(.0001,at);gain.gain.exponentialRampToValueAtTime(volume,at+.006);
    gain.gain.exponentialRampToValueAtTime(.0001, at + length);
    osc.connect(gain); gain.connect(this.master); osc.start(at); osc.stop(at + length);
    osc.onended = () => { osc.disconnect(); gain.disconnect(); };
  },
  hit(heavy = false) {
    this.tone(heavy ? 92 : 130, .24, 'triangle', .22, .24);
    this.tone(480, .055, 'square', .05, .15);
    if (!this.on || !this.ctx || state.paused) return;
    const ac=this.ctx, buffer=ac.createBuffer(1,ac.sampleRate*.09,ac.sampleRate), data=buffer.getChannelData(0);
    for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*(1-i/data.length)**3;
    const noise=ac.createBufferSource(), filter=ac.createBiquadFilter(), gain=ac.createGain();
    noise.buffer=buffer;filter.type='lowpass';filter.frequency.value=heavy?1700:2500;gain.gain.value=.16;
    noise.connect(filter);filter.connect(gain);gain.connect(this.master);noise.start();
    noise.onended=()=>{noise.disconnect();filter.disconnect();gain.disconnect();};
  },
  whoosh(pitch=700,length=.22) {
    if(!this.on||!this.ctx||state.paused)return;
    const ac=this.ctx,buffer=ac.createBuffer(1,Math.ceil(ac.sampleRate*length),ac.sampleRate),data=buffer.getChannelData(0);
    for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*Math.sin(Math.PI*i/data.length);
    const source=ac.createBufferSource(),filter=ac.createBiquadFilter(),gain=ac.createGain();
    source.buffer=buffer;filter.type='bandpass';filter.Q.value=.7;filter.frequency.setValueAtTime(pitch,ac.currentTime);filter.frequency.exponentialRampToValueAtTime(pitch*.25,ac.currentTime+length);gain.gain.value=.12;
    source.connect(filter);filter.connect(gain);gain.connect(this.master);source.start();source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};
  },
  jump(){this.tone(260,.2,'sine',.12,2.5);this.whoosh(1200,.18);},
  launch(kind){
    if(kind==='quake'){this.tone(100,.3,'triangle',.19,.35);this.whoosh(600,.35);}
    else if(kind==='siphon'){this.tone(430,.35,'sine',.09,.45);this.tone(645,.35,'sine',.04,.45);}
    else if(kind==='propeller'){this.tone(160,.3,'triangle',.08,3);this.whoosh(1500,.35);}
    else{this.tone(220,.17,'sine',.12,2);this.tone(360,.2,'sine',.08,.5,.06);}
  },
  heal(){[440,554,660].forEach((f,i)=>this.tone(f,.24,'sine',.09,1,i*.09));},
  victory(){[392,494,587,784].forEach((f,i)=>this.tone(f,.35,'triangle',.09,1,i*.11));},
  defeat(){[220,185,147].forEach((f,i)=>this.tone(f,.35,'triangle',.07,.8,i*.16));},
  good() { this.tone(660, .24, 'sine', .1); this.tone(990, .32, 'triangle', .035); },
  block() { this.tone(880,.18,'triangle',.12,1.5);this.tone(1760,.25,'sine',.07,.75); },
  tick() { this.tone(420, .035, 'sine', .025); },
  music() {
    if (!this.on || !this.ctx || state.paused || state.phase==='title' || state.time < this.nextBeat) return;
    this.nextBeat = state.time + 290;
    const tune = [0, 7, 12, 10, 7, 3, 5, 7, 0, 7, 10, 12, 15, 12, 7, 5];
    const n = tune[this.step % tune.length];
    this.tone(164.81 * 2 ** (n / 12), .2, 'triangle', .018);
    if (this.step % 4 === 0) this.tone(this.step % 8 === 0 ? 82.4 : 110, .42, 'sine', .035);
    if (this.step % 2 === 1) this.tone(900, .025, 'triangle', .009, .3);
    this.step++;
  },
};

function setHidden(id, hidden) { $(id).hidden = hidden; }
function note(text, show = true) { $('message').textContent = text; setHidden('message', !show); }
function ease(p) { return 1 - (1 - p) ** 3; }
function animate(duration, update) {
  return new Promise(resolve => state.tweens.push({ start: state.time, duration, update, resolve }));
}
const wait = duration => animate(duration, () => {});
function move(actor, values, duration = 400) {
  const initial = Object.fromEntries(Object.keys(values).map(key => [key, actor[key]]));
  return animate(duration, p => { for (const key in values) actor[key] = initial[key] + (values[key] - initial[key]) * ease(p); });
}
function makeActors() {
  state.actors = [{ kind: 'rat', x: 0, y: 0, rot: 0, scale: 1, alpha: 1, hit: 0 }, ...state.run.enemies.map(e => ({ kind: e.kind, enemy: e, x: 0, y: 0, rot: 0, scale: 1, alpha: 1, hit: 0 }))];
  state.actors.forEach(a=>{a.stretchX=1;a.stretchY=1;});
  layoutActors();
}
function layoutActors() {
  const n = state.actors.length - 1, mobile = state.mobile;
  state.actors.forEach((a, i) => {
    a.homeX = state.W * (i === 0 ? .12 : n === 3 ? .58 + (i - 1) * .16 : .70 + (i - 1) * .20);
    const bg = images.sewer, bgHeight = bg ? bg.height * Math.max(state.W / bg.width, state.H / bg.height) : state.H;
    a.homeY = (state.H - bgHeight) / 2 + bgHeight * .735;
    a.x = a.homeX; a.y = a.homeY;
    a.width = mobile ? (a.kind === 'rat' ? 150 : a.kind === 'baron' ? 165 : 140) : a.kind === 'rat' ? 205 : a.kind === 'baron' ? 280 : 215;
  });
}
function resize() {
  const rect = gameEl.getBoundingClientRect();
  const dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.round(rect.width * dpr); canvas.height = Math.round(rect.height * dpr);
  state.mobile = rect.height > rect.width;
  state.W = state.mobile ? 810 : 1440;
  state.H = state.W * rect.height / rect.width;
  layoutActors();
}
new ResizeObserver(resize).observe(gameEl);

function updateHUD() {
  const r = state.run;
  $('hp').textContent = r.hp;
  $('hp-bar').style.width = `${r.hp / r.maxHp * 100}%`;
  $('hp-bar').style.background = r.hp <= 6 ? '#bd393c' : '#de7050';
  $('sp').textContent = '✦ '.repeat(r.sp) + '· '.repeat(r.maxSp - r.sp);
  $('sp').setAttribute('aria-label', `${r.sp} of ${r.maxSp} goop power`);
  $('cheese-count').textContent = `+8 ♥ · ×${r.cheese}`;
  const special=$('special-move');special.dataset.move=r.special;special.disabled=r.sp<MOVES[r.special].cost;
  special.querySelector('.move-icon').textContent=ARSENAL[r.special].icon;
  special.querySelector('strong').textContent=ARSENAL[r.special].name;
  special.querySelector('small').textContent=`${MOVES[r.special].cost} ✦`;
  for(const key of ['jump','bonk',r.special]) {
    const button=document.querySelector(`[data-move="${key}"]`), level=r.upgrades[key]||0;
    button.querySelector('strong').textContent=`${MOVES[key].name}${level?` +${level}`:''}`;
  }
  document.querySelector('[data-move="cheese"]').disabled = r.cheese === 0 || r.hp === r.maxHp;
  const living = r.enemies.filter(e => e.hp > 0);
  if (!living.some(e => e.id === state.selected)) state.selected = living[0]?.id ?? 0;
  const selected = r.enemies.find(e => e.id === state.selected);
  canvas.setAttribute('aria-label', selected ? `Battle stage. ${selected.name} selected, ${selected.hp} of ${selected.maxHp} health. Use left or right arrow to select an enemy.` : 'Paper Peanut battle stage');
  $('targets').replaceChildren(...living.map(e => {
    const button = document.createElement('button');
    button.textContent = `${e.name}${r.enemies.filter(x => x.kind === e.kind).length > 1 ? ` ${e.id + 1}` : ''} · ${e.hp}/${e.maxHp}`;
    button.setAttribute('aria-pressed', String(e.id === state.selected));
    button.setAttribute('aria-label', `${e.name}, ${e.hp} of ${e.maxHp} health${e.armor ? ', armored' : ''}`);
    button.tabIndex = -1;
    button.onclick = () => selectTarget(e.id);
    return button;
  }));
}
function selectTarget(id) {
  if (state.phase !== 'choose') return;
  state.selected = id; audio.tick(); updateHUD();
}
function choose() {
  state.phase = 'choose'; setHidden('commands', false); setHidden('targets', false); setHidden('action-cue', true);
  updateHUD();
  note('Your turn. Select an enemy and a move.');
  $('footer-hint').textContent = 'Space at contact · 1–4 moves · ← → target · Esc pause';
}
async function startGame() {
  state.session++; state.tweens = []; state.command = null; state.floats = []; state.particles = []; state.impacts=[];state.trails=[];state.projectiles=[];state.freeze=0;state.shake=0;
  state.command=null;setHidden('action-cue',true);gameEl.dataset.action='';
  state.run = freshRun(profile.equipped); state.selected = 0; state.paused = false; state.phase = 'intro';
  $('pause').disabled = false;
  for (const id of ['title-screen', 'result', 'commands', 'targets', 'action-cue', 'callout']) setHidden(id, true);
  setHidden('hud', false); updateHUD(); makeActors();
  audio.init();
  note('BNN BREAKING: Peanut has entered the goop depot.');
  state.actors[0].x = -200;
  await move(state.actors[0], { x: state.actors[0].homeX }, 450);
  await wait(180); choose();
}
function showCallout(text, grade, sub = '') {
  $('callout').replaceChildren(document.createTextNode(text));
  if (sub) { const small = document.createElement('small'); small.textContent = sub; $('callout').append(small); }
  setHidden('callout', false); state.calloutUntil = state.time + 650;
}

function beginContact(type, duration, label) {
  state.command = createContactCommand(state.time + duration, state.relaxed);
  state.command.type = type;
  gameEl.dataset.action = type;
  setHidden('action-cue', false);
  $('action-label').textContent = 'at contact';
  $('action-cue').dataset.type = type;
  $('action-motion').textContent = 'Winding up.';
}
function motion(text) {
  if ($('action-motion').textContent !== text) $('action-motion').textContent = text;
}
function pressCommand() {
  if (!state.command || state.paused || document.hidden) return;
  const inputTime = state.time + Math.max(0, Math.min(50, performance.now() - last) - state.freeze);
  pressContact(state.command, inputTime);
}
async function finishContact() {
  // Hold the actual collision pose briefly, accepting the displayed contact frame.
  const command = state.command;
  command.contactAt = state.time;
  motion('Contact.');
  await wait(CONTACT_GRACE_MS);
  const outcome = contactTiming(command), success = outcome === 'success';
  state.command = null; setHidden('action-cue', true); gameEl.dataset.action = '';
  if (success) {
    state.run.perfect++; state.run.score += 20;
    if (command.type === 'block') state.run.blocks++;
    else if (command.type !== 'jump') state.run.sp = Math.min(state.run.maxSp, state.run.sp + 1);
    audio.good();
  }
  const text = success ? (command.type === 'block' ? 'BLOCKED!' : 'NICE!') : outcome === 'early' ? 'TOO EARLY' : outcome === 'late' ? 'TOO LATE' : command.type === 'block' ? 'OUCH!' : 'BONK!';
  showCallout(text, success ? 'perfect' : 'miss', success ? (command.type === 'jump' ? 'DOUBLE STOMP!' : command.type === 'block' ? 'NO DAMAGE' : '+1 GOOP POWER') : 'Space right at contact');
  updateHUD(); return success ? 'perfect' : 'miss';
}
function actorHeight(a) {
  const img=images[a.kind==='rat'?'pip':a.kind];
  return a.width*(img?img.height/img.width:1);
}
// Center-column opaque top of the supplied cutouts; ignore transparent margins.
function contactTop(a) { return a.homeY-actorHeight(a)*({scrapper:1177/1254,slinger:1184/1254,baron:1167/1254}[a.kind]??.94); }
function burst(x,y,color='#ffda48',count=18,force=1) {
  for(let i=0;i<count;i++){
    const a=Math.random()*Math.PI*2,v=(90+Math.random()*330)*force;
    state.particles.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-100,life:1,color,size:5+Math.random()*11,rot:Math.random()*7,star:i%3===0});
  }
}
function impact(x,y,grade='good',heavy=false) {
  const power=(grade==='perfect'?1.35:1)*(heavy?1.2:1);
  state.freeze=Math.max(state.freeze,grade==='perfect'?85:50);
  if(!state.reducedMotion)state.shake=13*power;
  state.impacts.push({x,y,born:state.fxTime,power,color:grade==='perfect'?'#ffe842':'#fff1c6'});
  burst(x,y,'#fff2bc',12,power);burst(x,y,'#ffce31',14,power);
  audio.hit(heavy||grade==='perfect');
}
function float(text,actor,color='#fff0c8') {
  state.floats.push({text,x:actor.x,y:actor.y-actorHeight(actor)*.7,color,born:state.fxTime});
}
async function hurtEnemy(actor,damage,moveName,grade='good') {
  if(actor.enemy.hp<=0)return;
  const wasArmored=actor.enemy.armor;
  hitEnemy(actor.enemy,damage,moveName);
  const hitY=moveName==='jump'?contactTop(actor):actor.homeY-actorHeight(actor)*.38;
  impact(actor.x,hitY,grade,moveName==='bonk');float(`−${damage}`,actor);
  actor.hit=state.time+180;
  if(wasArmored&&!actor.enemy.armor){
    burst(actor.x,hitY,'#9baf87',22,1.7);
  }
  updateHUD();
  const stomp=moveName==='jump';
  await move(actor,{rot:.2,x:actor.homeX+(stomp?12:48),y:actor.homeY-(stomp?0:15),stretchX:stomp?1.28:.8,stretchY:stomp?.64:1.1},70);
  if(actor.enemy.hp<=0){
    state.run.score+=actor.kind==='baron'?100:30;
    burst(actor.x,actor.y-55,actor.kind==='baron'?'#aaa47b':'#bd9c83',24,1.2);
    await move(actor,{alpha:0,y:actor.homeY+45,x:actor.x+35,rot:.7,scale:.55},230);
  }else await move(actor,{rot:0,x:actor.homeX,y:actor.homeY,stretchX:1,stretchY:1},170);
}
async function jumpAttack(hero, target) {
  beginContact('jump', PACE.jumpWindup + PACE.jumpFlight, 'as Peanut lands');
  await move(hero, { stretchX: 1.16, stretchY: .84, rot: -.12 }, PACE.jumpWindup);
  const startX = hero.x, landX = target.x, landY = contactTop(target) + actorHeight(hero) * 50/1536;
  audio.jump();
  const apexY = Math.max(actorHeight(hero) + state.H * .08, landY - 215);
  let lastTrail = 0;
  await animate(PACE.jumpFlight, p => {
    Object.assign(hero, jumpPose(p, startX, hero.homeY, landX, landY, apexY));
    hero.rot = -.12 * (1-p); hero.stretchX = 1; hero.stretchY = 1;
    motion(p < .48 ? 'Peanut is rising.' : p < .86 ? 'Peanut is descending.' : 'Peanut is about to land.');
    if (!state.reducedMotion && state.time-lastTrail > 65 && p > .1 && p < .85) {
      state.trails.push({ x: hero.x, y: hero.y, rot: hero.rot, born: state.fxTime }); lastTrail = state.time;
    }
  });
  const grade = await finishContact(), hits = jumpHits(grade === 'perfect', target.enemy, state.run.upgrades.jump);
  for (let i=0; i<hits.length; i++) {
    if (target.enemy.hp <= 0) break;
    hero.stretchX = 1.2; hero.stretchY = .82;
    const hit = hurtEnemy(target, hits[i], 'jump', grade);
    if (i < hits.length-1 && target.enemy.hp > 0) {
      audio.jump();await animate(PACE.jumpBounce, p => { hero.y=landY-Math.sin(p*Math.PI)*125; hero.stretchX=1-.13*Math.sin(p*Math.PI); hero.stretchY=1+.12*Math.sin(p*Math.PI); hero.rot=.08-Math.sin(p*Math.PI)*.17; });
      await hit;
    } else {
      await Promise.all([hit, animate(PACE.jumpReturn, p => { hero.x=landX+(hero.homeX-landX)*ease(p); hero.y=landY+(hero.homeY-landY)*p-Math.sin(p*Math.PI)*110; hero.rot=.08*(1-p); hero.stretchX=1; hero.stretchY=1; })]);
    }
  }
  Object.assign(hero, { x:hero.homeX, y:hero.homeY, rot:0, stretchX:1, stretchY:1 });
}
async function slamAttack(hero, target) {
  beginContact('slam', PACE.slamWindup + PACE.slamTravel, 'as the shells connect');
  const contactX = target.x - hero.width * .35 - target.width * .34;
  await move(hero, { x:hero.homeX-35, rot:-.23, stretchX:1.1, stretchY:.88 }, PACE.slamWindup);
  audio.whoosh(450,.32);const startX=hero.x;
  await animate(PACE.slamTravel, p => {
    hero.x=startX+(contactX-startX)*p; hero.y=hero.homeY-Math.sin(p*Math.PI)*35;
    hero.rot=-.23+.49*p; hero.stretchX=1; hero.stretchY=1;
    motion(p < .92 ? 'Peanut is charging.' : 'Peanut is about to hit.');
  });
  const grade=await finishContact();
  await Promise.all([hurtEnemy(target,attackDamage('bonk',grade,target.enemy,state.run.upgrades.bonk),'bonk',grade),move(hero,{x:hero.homeX,y:hero.homeY,rot:0,stretchX:1,stretchY:1},420)]);
}
async function specialAttack(hero, targets, name) {
  const labels={whirl:'as the goop hits',propeller:'as the propeller hits',siphon:'as the siphon hits',quake:'as Hutch lands'};
  beginContact(name, PACE.burstWindup + PACE.burstFlight, labels[name]);
  await animate(PACE.burstWindup, p => {
    hero.rot=-Math.sin(p*Math.PI)*.15;hero.stretchX=1-.18*Math.sin(p*Math.PI);
    hero.y=hero.homeY-Math.sin(p*Math.PI)*35;
  });
  hero.stretchX=1;hero.rot=0;hero.y=hero.homeY;
  if(name==='quake'){burst(hero.x,hero.homeY-10,'#dbc08b',14);audio.hit(true);}
  audio.launch(name);
  const startX=hero.x+hero.width*.36,startY=hero.homeY-actorHeight(hero)*.55;
  const flightTargets=name==='quake'?[targets.find(a=>a.enemy.id===state.selected)||targets[0]]:targets;
  state.projectiles=flightTargets.map(target=>({x:startX,y:startY,target,type:name,rot:0}));
  await animate(PACE.burstFlight,p=>{
    for(const ball of state.projectiles){
      const endX=ball.target.x-ball.target.width*.32,endY=ball.target.homeY-actorHeight(ball.target)*.4;
      ball.rot=p*Math.PI*2;ball.x=startX+(endX-startX)*p;ball.y=startY+(endY-startY)*p-Math.sin(p*Math.PI)*(name==='quake'?160:name==='propeller'?35:85);
    }
    motion(p<.91?'The attack is flying.':'The attack is about to hit.');
  });
  const grade=await finishContact();state.projectiles=[];
  await Promise.all(targets.map(target=>hurtEnemy(target,attackDamage(name,grade,target.enemy,state.run.upgrades[name]||0),name,grade)));
  if(name==='siphon'){
    const target=targets[0],fromX=target.x,fromY=target.homeY-actorHeight(target)*.4;
    const orb={x:fromX,y:fromY,type:'siphon'};state.projectiles=[orb];
    await animate(330,p=>{orb.x=fromX+(hero.x-fromX)*p;orb.y=fromY+(hero.homeY-actorHeight(hero)*.45-fromY)*p;});
    state.projectiles=[];const heal=Math.min(grade==='perfect'?4:2,state.run.maxHp-state.run.hp);
    audio.heal();state.run.hp+=heal;float(`+${heal} ♥`,hero,'#e5b9c4');burst(hero.x,hero.y-150,'#e5b9c4',12);updateHUD();
  }
}
async function playerAction(name) {
  if(state.phase!=='choose'||state.paused)return;
  const r=state.run,hero=state.actors[0];
  if(name==='cheese'&&(r.cheese<1||r.hp>=r.maxHp))return;
  if(name!=='cheese'&&(!['jump','bonk',r.special].includes(name)||r.sp<MOVES[name].cost))return;
  state.phase='attack';for(const id of ['commands','targets','message','callout'])setHidden(id,true);
  if(name==='cheese'){
    const amount=Math.min(8,r.maxHp-r.hp);r.hp+=amount;r.cheese--;
    float(`+${amount} ♥`,hero,'#e9c29b');burst(hero.x,hero.y-130,'#ffe159',20);audio.heal();updateHUD();
    showCallout('SILLY JUICE!','good',`+${amount} HP • BACK IN BUSINESS`);
    await move(hero,{y:hero.homeY-40,rot:-.12},180);
    await move(hero,{y:hero.homeY,rot:0},180);await wait(160);
  }else{
    r.sp-=MOVES[name].cost;updateHUD();
    const targets=['whirl','quake'].includes(name)?state.actors.slice(1).filter(a=>a.enemy.hp>0):[state.actors.find(a=>a.enemy?.id===state.selected)];
    if(name==='jump')await jumpAttack(hero,targets[0]);
    else if(name==='bonk')await slamAttack(hero,targets[0]);
    else await specialAttack(hero,targets,name);
  }
  await wait(180);
  if(r.enemies.every(e=>e.hp<=0)){endEncounter();return;}
  await enemiesTurn();
}
async function enemyAttack(enemy,hero) {
  const kind=enemy.kind,hitX=hero.homeX+hero.width*.35,hitY=hero.homeY-actorHeight(hero)*.38;
  const travel=kind==='scrapper'?900:kind==='slinger'?1050:1150;
  beginContact('block',PACE.enemyWindup+travel,kind==='slinger'?'as the bolt hits you':kind==='baron'?'as the barrel hits you':'as the rat hits you');
  await move(enemy,{x:enemy.homeX+(kind==='slinger'?6:20),rot:kind==='slinger'?.08:-.14,stretchX:kind==='slinger'?.92:1.18,stretchY:kind==='slinger'?1.05:.8},PACE.enemyWindup);
  const startX=enemy.x,contactX=hitX+enemy.width*(kind==='baron'?.43:.45);
  if(kind==='slinger'){
    enemy.stretchX=1;enemy.stretchY=1;enemy.rot=0;
    const bolt={type:'bolt',x:enemy.x-enemy.width*.43,y:enemy.homeY-actorHeight(enemy)*.57};
    const bx=bolt.x,by=bolt.y;state.projectiles=[bolt];audio.tone(650,.09,'triangle',.07,.4);
    await animate(travel,p=>{bolt.x=bx+(hitX-bx)*p;bolt.y=by+(hitY-by)*p-Math.sin(p*Math.PI)*40;motion(p<.9?'The bolt is flying.':'The bolt is about to hit Peanut.');});
  }else if(kind==='baron'){
    enemy.rolling=true;
    await animate(travel,p=>{enemy.x=startX+(contactX-startX)*p;enemy.y=enemy.homeY-Math.sin(p*Math.PI*6)*5;enemy.rot=-p*Math.PI*4;enemy.stretchX=1;enemy.stretchY=1;motion(p<.91?'The barrel is rolling.':'The barrel is about to hit Peanut.');});
  }else{
    await animate(travel,p=>{enemy.x=startX+(contactX-startX)*p;enemy.y=enemy.homeY-Math.sin(p*Math.PI)*115;enemy.rot=-.18+Math.sin(p*Math.PI)*.3;enemy.stretchX=1+.1*Math.sin(p*Math.PI);enemy.stretchY=1;motion(p<.89?'The rat is pouncing.':'The rat is about to hit Peanut.');});
  }
  const grade=await finishContact();state.projectiles=[];enemy.rolling=false;enemy.rot=0;
  const damage=incomingDamage(enemy.enemy,grade);state.run.hp=Math.max(0,state.run.hp-damage);
  if(damage>0){
    impact(hitX,hitY,'good');hero.hit=state.time+240;float(`−${damage}`,hero,'#ffb990');
    hero.x-=24;hero.rot=-.16;hero.stretchX=.8;hero.stretchY=1.1;
  }else{float('0',hero,'#c4faff');impact(hitX,hitY,'perfect');audio.block();}
  updateHUD();
  await Promise.all([move(enemy,{x:enemy.homeX,y:enemy.homeY,rot:0,stretchX:1,stretchY:1},400),move(hero,{x:hero.homeX,rot:0,stretchX:1,stretchY:1},250)]);
}
async function enemiesTurn() {
  state.phase='enemy';updateHUD();const hero=state.actors[0];
  for(const enemy of state.actors.slice(1).filter(a=>a.enemy.hp>0)){
    setHidden('callout',true);await enemyAttack(enemy,hero);
    if(state.run.hp<=0){lose();return;}await wait(230);
  }
  state.run.round++;choose();
}
function resultButton(text, fn) {
  const button = document.createElement('button'); button.className = 'ribbon-button'; button.innerHTML = `${text}<b>➜</b>`; button.onclick = fn;
  $('result').append(button); button.focus({ preventScroll: true });
}
function hideCombat() {
  for (const id of ['commands', 'targets', 'action-cue', 'message', 'callout']) setHidden(id, true);
}
function homeResultButton() {
  const button=document.createElement('button');button.className='text-button';button.textContent='Home';button.onclick=home;$('result').append(button);
}
function endEncounter() {
  state.phase='result';hideCombat();$('pause').disabled=true;
  const r=state.run,scrap=rewardEncounter(profile,r);saveProfile();setHidden('result',false);
  if(r.chapter<2){
    $('result').innerHTML=`<h2>Upgrade</h2><div class="upgrade-grid" id="upgrade-choices"></div>`;
    for(const key of ['jump','bonk',r.special]){
      const card=document.createElement('article');card.className='upgrade-card';
      card.innerHTML=`<strong>${MOVES[key].name}</strong><p>${key==='jump'?'+1 damage per stomp':'+1 damage per target'} this run.</p><small>Free</small>`;
      const button=document.createElement('button');button.dataset.upgrade=key;button.textContent='Upgrade';button.setAttribute('aria-label',`Upgrade ${MOVES[key].name}`);
      button.onclick=async()=>{
        if(state.phase!=='result'||!applyUpgrade(r,key))return;
        $('upgrade-choices').querySelectorAll('button').forEach(b=>b.disabled=true);
        advanceChapter(r);setHidden('result',true);state.phase='intro';$('pause').disabled=false;makeActors();updateHUD();
        showCallout('UPGRADED!','perfect',`${MOVES[key].name.toUpperCase()} +${r.upgrades[key]}`);audio.good();
        state.actors[0].x=-180;await move(state.actors[0],{x:state.actors[0].homeX},450);await wait(180);choose();
      };
      card.append(button);$('upgrade-choices').append(card);
    }
    $('upgrade-choices').querySelector('button').focus({preventScroll:true});
  }else{
    r.score+=r.hp*5;best=Math.max(best,r.score,profile.best);try{localStorage.setItem('goop-run-best',String(best));}catch{}
    $('result').innerHTML=`<span class="eyebrow">RUN CLEARED · +${scrap} SCRAP BANKED</span><div class="stars">★ ★ ★</div><h2>Cleared</h2><div class="rewards"><span>${r.score} points</span><span>◆ ${profile.scrap} scrap</span></div><div class="run-stats">${r.perfect} perfect timings · ${r.blocks} blocks · ${r.hp} HP left</div><div class="best">PERSONAL BEST · ${best}</div>`;
    resultButton('Run it back',startGame);
    for(let i=0;i<6;i++)burst(state.W*(.2+Math.random()*.6),state.H*.25,['#ee896a','#f7cf6a','#add7bc'][i%3],20);
  }
  homeResultButton();audio.victory();
}
function lose() {
  state.phase='result';hideCombat();$('pause').disabled=true;state.actors[0].rot=-.6;setHidden('result',false);
  $('result').innerHTML=`<span class="eyebrow">RUN OVER</span><h2>Defeated</h2><p>Scrap saved.</p><div class="rewards"><span>◆ ${profile.scrap} scrap banked</span></div><div class="run-stats">${state.run.perfect} perfect timings · ${state.run.blocks} blocks</div>`;
  audio.defeat();resultButton('Requeue the run',startGame);homeResultButton();
}

function roundedRect(x,y,w,h,r,fill,stroke) {
  ctx.beginPath(); ctx.roundRect(x,y,w,h,r); ctx.fillStyle=fill; ctx.fill();
  if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke();}
}
function star(x,y,r,rot=0,fill='#f7d578') {
  ctx.save();ctx.translate(x,y);ctx.rotate(rot);ctx.beginPath();
  for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5; const rr=i%2?r*.43:r;const px=Math.cos(a)*rr,py=Math.sin(a)*rr;i?ctx.lineTo(px,py):ctx.moveTo(px,py);}
  ctx.closePath();ctx.fillStyle=fill;ctx.fill();ctx.restore();
}
function drawActor(a, index) {
  if (a.alpha <= .01) return;
  const t=state.time/1000, idle = state.phase === 'title' || state.phase === 'choose' || state.phase === 'intro';
  const wobble = Math.sin(t*3.1+index*1.8), breath = Math.sin(t*2.5+index);
  const img=images[a.kind==='rat'?'pip':a.kind]; if(!img)return;
  const width=a.width, height=width*img.height/img.width;
  ctx.save();ctx.globalAlpha=a.alpha;
  // Flattened ground contact plus offset shadow keep the actors anchored to the set.
  const altitude=Math.max(0,a.homeY-a.y),shadowScale=Math.max(.38,1-altitude/400);
  ctx.fillStyle='#151c1bb0';ctx.filter='blur(5px)';ctx.beginPath();ctx.ellipse(a.x+8,a.homeY-4,width*.34*shadowScale,13*shadowScale,0,0,Math.PI*2);ctx.fill();ctx.filter='none';
  ctx.translate(a.x,a.y-(a.rolling?height*.48:0));ctx.rotate(a.rot+(idle?wobble*.015:0));ctx.scale(a.scale*a.stretchX*(1+breath*.01),a.scale*a.stretchY*(1-breath*.012));
  const selected=state.phase==='choose'&&a.enemy?.id===state.selected;
  ctx.filter='drop-shadow(7px 7px 1px #18202177)';
  if (a.hit > state.time && Math.floor(state.time/70)%2===0) ctx.filter += ' brightness(1.6)';
  ctx.drawImage(img,-width/2,-height+(a.rolling?height*.48:0),width,height);ctx.filter='none';ctx.shadowBlur=0;
  if(a.kind==='baron'&&a.enemy&&!a.enemy.armor){ctx.beginPath();ctx.moveTo(25,-height*.65);ctx.lineTo(5,-height*.5);ctx.lineTo(27,-height*.43);ctx.lineTo(12,-height*.3);ctx.strokeStyle='#ead6a7';ctx.lineWidth=3;ctx.stroke();}
  ctx.restore();
  if(a.enemy&&a.enemy.hp>0&&state.phase!=='title'&&state.phase!=='loading'){
    const top=a.y-height-35, hp=a.enemy.hp/a.enemy.maxHp;
    ctx.save();ctx.globalAlpha=a.alpha;const bw=state.mobile?100:105;
    roundedRect(a.x-bw/2,top,bw,11,5,'#332f26d9','#ddc8a6');
    if(hp>0)roundedRect(a.x-bw/2+2,top+2,(bw-4)*hp,7,3,a.enemy.kind==='baron'?'#cc9256':'#9bb97d');
    ctx.font=`600 ${state.mobile?18:22}px Fredoka, sans-serif`;ctx.textAlign='center';ctx.strokeStyle='#25342c';ctx.lineWidth=4;
    const label=a.enemy.name;
    if(selected){
      const textWidth=ctx.measureText(label).width;
      roundedRect(a.x-textWidth/2-10,top-34,textWidth+20,31,7,'#ffdc58','#fff0a4');
      ctx.fillStyle='#322d19';ctx.fillText(label,a.x,top-12);
    }else{ctx.fillStyle='#fff0ce';ctx.strokeText(label,a.x,top-12);ctx.fillText(label,a.x,top-12);}
    ctx.font=`500 ${state.mobile?16:18}px Fredoka, sans-serif`;ctx.fillStyle='#fff0ce';
    const health=`${a.enemy.hp}/${a.enemy.maxHp}`;ctx.strokeText(health,a.x,top+32);ctx.fillText(health,a.x,top+32);
    if(a.enemy.armor){ctx.font='15px sans-serif';ctx.fillStyle='#e2d0fa';ctx.fillText('◆',a.x+bw/2+14,top+10);}
    ctx.restore();
  }
}
function draw(dt) {
  const {W,H}=state;
  ctx.setTransform(canvas.width/W,0,0,canvas.height/H,0,0);ctx.clearRect(0,0,W,H);
  ctx.save();
  if(state.shake>.1){ctx.translate(Math.sin(state.fxTime*.07)*state.shake,Math.cos(state.fxTime*.1)*state.shake*.5);state.shake*=Math.max(0,1-dt*.014);}
  const backdrop=state.phase==='title'&&images.home?images.home:images.sewer;
  if(backdrop){const scale=Math.max(W/backdrop.width,H/backdrop.height);const w=backdrop.width*scale,h=backdrop.height*scale;ctx.drawImage(backdrop,(W-w)*(state.phase==='title'&&state.mobile?.65:.5),(H-h)/2,w,h);}
  else {ctx.fillStyle='#193a3a';ctx.fillRect(0,0,W,H);}
  if(state.phase==='title'){const grad=ctx.createRadialGradient(W*.5,H*.3,20,W*.5,H*.35,W*.42);grad.addColorStop(0,'#123430aa');grad.addColorStop(1,'#12343000');ctx.fillStyle=grad;ctx.fillRect(0,0,W,H);}
  // Lantern light, dust motes, and moving water glints are separate from the printed set.
  for(const x of [.12,.8]){const g=ctx.createRadialGradient(W*x,H*.29,4,W*x,H*.29,W*.08);g.addColorStop(0,`rgba(255,175,70,${.1+Math.sin(state.time*.006+x)*.035})`);g.addColorStop(1,'#ffbb5500');ctx.fillStyle=g;ctx.globalCompositeOperation='screen';ctx.fillRect(0,0,W,H);ctx.globalCompositeOperation='source-over';}
  ctx.save();ctx.globalAlpha=.22;ctx.strokeStyle='#a9e4d2';ctx.lineWidth=2;
  for(let i=0;i<22;i++){const x=((i*113+state.time*.007)%W),y=H*(.84+(i%7)*.021);ctx.globalAlpha=.13+Math.sin(state.time*.002+i)*.07;ctx.beginPath();ctx.ellipse(x,y,13+Math.sin(state.time*.001+i)*8,1,0,0,Math.PI*2);ctx.stroke();}ctx.restore();
  for(const trail of state.trails){const age=state.fxTime-trail.born,hero=state.actors[0];ctx.save();ctx.globalAlpha=Math.max(0,.18*(1-age/160));ctx.translate(trail.x,trail.y);ctx.rotate(trail.rot);ctx.drawImage(images.pip,-hero.width/2,-actorHeight(hero),hero.width,actorHeight(hero));ctx.restore();}
  state.trails=state.trails.filter(trail=>state.fxTime-trail.born<160);
  if(state.phase==='attack'){state.actors.slice(1).forEach((a,i)=>drawActor(a,i+1));drawActor(state.actors[0],0);}else if(state.phase!=='title'&&state.phase!=='loading') state.actors.forEach(drawActor);
  for(const ball of state.projectiles){
    ctx.save();ctx.translate(ball.x,ball.y);
    if(ball.type==='bolt'){
      ctx.rotate(state.time*.012);ctx.beginPath();for(let i=0;i<6;i++){const a=i*Math.PI/3;i?ctx.lineTo(Math.cos(a)*21,Math.sin(a)*21):ctx.moveTo(Math.cos(a)*21,Math.sin(a)*21);}ctx.closePath();ctx.fillStyle='#adb8b0';ctx.fill();ctx.strokeStyle='#f5ecd1';ctx.lineWidth=4;ctx.stroke();ctx.beginPath();ctx.arc(0,0,7,0,Math.PI*2);ctx.fillStyle='#415453';ctx.fill();
    }else if(ball.type==='propeller'){
      ctx.rotate(state.time*.032);ctx.shadowColor='#b5d9fa';ctx.shadowBlur=14;
      roundedRect(-46,-10,92,20,9,'#819cc5','#fff1c5');roundedRect(-10,-46,20,92,9,'#819cc5','#fff1c5');star(0,0,16,0,'#ffd13d');
    }else if(ball.type==='quake'){
      ctx.rotate(ball.rot||0);const size=100;ctx.drawImage(images.hutch,-size/2,-size/2,size,size);
    }else{
      ctx.rotate(state.time*.02);ctx.shadowColor=ball.type==='siphon'?'#d8a1b4':'#ffdb32';ctx.shadowBlur=22;star(0,0,30,0,ball.type==='siphon'?'#bd8098':'#ffe547');star(0,0,17,.4,'#fffaaf');
    }
    ctx.restore();
  }
  for(const hit of state.impacts){
    const age=state.fxTime-hit.born,p=age/300,r=(24+90*p)*hit.power;
    ctx.save();ctx.translate(hit.x,hit.y);ctx.globalAlpha=Math.max(0,1-p);
    ctx.strokeStyle=hit.color;ctx.lineWidth=7*(1-p);
    if(p<.48){star(0,0,(36+36*Math.sin(p/.48*Math.PI))*hit.power,.2,hit.color);star(0,0,27*hit.power,-.2,'#fffbe7');}
    for(let i=0;i<10;i++){const angle=i*Math.PI/5+.18;ctx.beginPath();ctx.moveTo(Math.cos(angle)*r*.6,Math.sin(angle)*r*.6);ctx.lineTo(Math.cos(angle)*(r+26),Math.sin(angle)*(r+26));ctx.stroke();}
    ctx.restore();
  }
  state.impacts=state.impacts.filter(hit=>state.fxTime-hit.born<300);
  for(let i=0;i<18;i++){const x=(i*97.37+Math.sin(state.time*.0004+i)*15)%W,y=(i*57.93-state.time*.009)%H;ctx.fillStyle=`rgba(246,219,158,${.1+(Math.sin(state.time*.001+i)+1)*.09})`;ctx.beginPath();ctx.arc(x,y<0?y+H:y,1.5,0,Math.PI*2);ctx.fill();}
  for(const p of state.particles){p.x+=p.vx*dt/1000;p.y+=p.vy*dt/1000;p.vy+=330*dt/1000;p.life-=dt/1100;p.rot+=dt*.003;ctx.globalAlpha=Math.max(0,p.life);if(p.star)star(p.x,p.y,p.size,p.rot,p.color);else{ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);ctx.fillStyle=p.color;ctx.fillRect(-p.size/2,-p.size/2,p.size,p.size*.6);ctx.restore();}}
  ctx.globalAlpha=1;state.particles=state.particles.filter(p=>p.life>0);
  for(const f of state.floats){const age=state.fxTime-f.born;const y=f.y-age*.065;ctx.save();ctx.translate(f.x,y);const pop=1+Math.max(0,1-age/180)*.35;ctx.scale(pop,pop);ctx.globalAlpha=Math.max(0,Math.min(1,(1000-age)/300));ctx.font=`600 ${f.small?19:50}px Fredoka, sans-serif`;ctx.textAlign='center';ctx.lineWidth=f.small?4:7;ctx.strokeStyle='#33321d';ctx.strokeText(f.text,0,0);ctx.fillStyle=f.color;ctx.fillText(f.text,0,0);ctx.restore();}
  state.floats=state.floats.filter(f=>state.fxTime-f.born<1000);
  ctx.restore();
}

let last=performance.now();
function frame(now) {
  const raw=Math.max(0,Math.min(50,now-last));last=now;
  const fxdt=state.paused||document.hidden?0:raw;
  const dt=Math.max(0,fxdt-state.freeze);state.freeze=Math.max(0,state.freeze-fxdt);
  state.time+=dt;state.fxTime+=fxdt;gameEl.dataset.phase=state.phase;
  if(dt>0){
    const active=state.tweens;state.tweens=[];
    for(const tw of active){const p=Math.max(0,Math.min(1,(state.time-tw.start)/tw.duration));tw.update(p);if(p>=1)tw.resolve();else state.tweens.push(tw);}
    if(state.calloutUntil&&state.time>state.calloutUntil){setHidden('callout',true);state.calloutUntil=0;}
    audio.music();
  }
  draw(fxdt); requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

function modalOpen(id){state.paused=true;$(id).showModal();if(audio.ctx)audio.ctx.suspend();}
function modalClose(id){$(id).close();state.paused=false;if(audio.on&&audio.ctx)audio.ctx.resume();}
function pauseGame(){if(['loading','title','result'].includes(state.phase))return;modalOpen('pause-dialog');}
function setArsenalPage(open){
  hideAbilityTip();$('title-screen').dataset.view=open?'arsenal':'home';
  document.querySelector('.chapter-page').hidden=true;
  document.querySelector('.arsenal-page').hidden=!open;
  document.querySelector('.desk-menu').hidden=open;
}
$('open-arsenal').onclick=()=>{renderArsenal();setArsenalPage(true);$('close-arsenal').focus();};
$('close-arsenal').onclick=()=>{setArsenalPage(false);$('open-arsenal').focus();};
function setChapterPage(open){
 hideAbilityTip();$('title-screen').dataset.view=open?'chapters':'home';
 document.querySelector('.chapter-page').hidden=!open;
 document.querySelector('.arsenal-page').hidden=true;
 document.querySelector('.desk-menu').hidden=open;
}
function openChapters(){setChapterPage(true);$('chapter-rats').focus();}
$('start').onclick=openChapters;
$('close-chapters').onclick=()=>{setChapterPage(false);$('start').focus();};
$('chapter-rats').onclick=startGame;
$('go-home').onclick=()=>{modalClose('pause-dialog');home();};
document.querySelector('.wordmark').onclick=event=>{event.preventDefault();if(state.phase==='title')return;if(state.phase==='result')home();else pauseGame();};
document.querySelectorAll('[data-move]').forEach(button=>{
  button.onclick=()=>playerAction(button.dataset.move);
  button.onmouseenter=()=>{const hints={jump:'Watch Peanut. Press Space just before landing for a second, equally strong stomp.',bonk:'A crunchy shell charge. Breaks the Baron’s armor on the first hit.',whirl:'A golden goop blast. Hits every enemy. Costs 2 goop power.',cheese:'One Silly Juice. Restores 8 HP and uses your turn.'};$('move-hint').textContent=hints[button.dataset.move]||ARSENAL[button.dataset.move]?.detail||'';};
});
$('action-tap').addEventListener('pointerdown',event=>{event.preventDefault();pressCommand();});
$('help').onclick=()=>modalOpen('help-dialog');
$('pause').onclick=pauseGame;
$('resume').onclick=()=>modalClose('pause-dialog');
$('restart').onclick=()=>{modalClose('pause-dialog');startGame();};
document.querySelectorAll('[data-close]').forEach(button=>button.onclick=()=>modalClose(button.dataset.close));
for(const id of ['help-dialog','pause-dialog'])$(id).addEventListener('cancel',event=>{event.preventDefault();modalClose(id);});
$('relaxed').onchange=event=>{state.relaxed=event.target.checked;try{localStorage.setItem('rat-tales-cozy',String(state.relaxed));}catch{}};
function syncSound(){
  $('sound').innerHTML=`${audio.on?'♫':'♪'} <span>Sound ${audio.on?'on':'off'}</span>`;
  $('sound').setAttribute('aria-pressed',String(audio.on));$('sound').setAttribute('aria-label',audio.on?'Mute sound':'Enable sound');$('sound').title=audio.on?'Mute sound':'Enable sound';
  if(audio.master)audio.master.gain.setTargetAtTime(audio.on?.65:0,audio.ctx.currentTime,.015);
}
try{audio.on=localStorage.getItem('paper-peanut-sound')!=='off';}catch{}
syncSound();
const unlockAudio=()=>{if(audio.on)audio.init();};
document.addEventListener('pointerdown',unlockAudio,{capture:true});
document.addEventListener('keydown',unlockAudio,{capture:true});
let lastUiHover=0;
document.addEventListener('pointerover',event=>{const button=event.target.closest('button');if(!button||button.contains(event.relatedTarget))return;if(button.dataset.tip)showAbilityTip(button);if(!button.disabled&&performance.now()-lastUiHover>70){audio.tone(620,.045,'sine',.035,1.25);lastUiHover=performance.now();}});
document.addEventListener('pointerout',event=>{const button=event.target.closest('[data-tip]');if(button&&!button.contains(event.relatedTarget))hideAbilityTip();});
document.addEventListener('focusin',event=>{if(event.target.dataset?.tip)showAbilityTip(event.target);});
document.addEventListener('focusout',hideAbilityTip);
document.addEventListener('click',event=>{const button=event.target.closest('button');if(button&&!button.disabled&&button.id!=='sound'){audio.init();audio.tone(440,.07,'triangle',.055,1.5);audio.tone(780,.05,'sine',.025,.8,.025);}},{capture:true});
document.addEventListener('keydown',event=>{if(event.key==='Escape')hideAbilityTip();});
window.addEventListener('resize',hideAbilityTip);
document.addEventListener('scroll',hideAbilityTip,true);

$('sound').onclick=()=>{audio.on=!audio.on;audio.init();syncSound();try{localStorage.setItem('paper-peanut-sound',audio.on?'on':'off');}catch{}if(audio.on)audio.tick();};
$('fullscreen').onclick=async()=>{try{if(!document.fullscreenElement)await $('app').requestFullscreen();else await document.exitFullscreen();}catch{note('Fullscreen is unavailable here. The game still plays in this window.');}};
document.addEventListener('fullscreenchange',()=>{$('fullscreen').setAttribute('aria-label',document.fullscreenElement?'Exit fullscreen':'Enter fullscreen');});
window.addEventListener('keydown',event=>{
  if(state.paused)return;
  if(event.key==='Escape'){event.preventDefault();if(state.phase==='title'&&$('title-screen').dataset.view==='arsenal'){setArsenalPage(false);$('open-arsenal').focus();}else if(state.phase==='title'&&$('title-screen').dataset.view==='chapters'){setChapterPage(false);$('start').focus();}else pauseGame();return;}
  if(event.code==='Space'||event.key==='Enter'){
    if(event.target instanceof Element && event.target.closest('nav button'))return;
    if(state.command||['attack','enemy'].includes(state.phase)){
      event.preventDefault();if(event.repeat)return;
      pressCommand();
    }
    else if(state.phase==='title'&&$('title-screen').dataset.view==='home'&&!event.repeat&&!(event.target instanceof Element&&event.target.closest('button,a'))){event.preventDefault();openChapters();}
    return;
  }
  if(event.repeat)return;
  if(state.phase==='choose'){
    if(['1','2','3','4'].includes(event.key)){event.preventDefault();playerAction(['jump','bonk',state.run.special,'cheese'][Number(event.key)-1]);}
    if(['ArrowLeft','ArrowRight'].includes(event.key)){event.preventDefault();const living=state.run.enemies.filter(e=>e.hp>0);const i=living.findIndex(e=>e.id===state.selected);selectTarget(living[(i+(event.key==='ArrowLeft'?-1:1)+living.length)%living.length].id);}
  }
});
canvas.addEventListener('pointerdown',event=>{
  if(state.paused)return;
  if(state.command){pressCommand();return;}
  if(state.phase!=='choose')return;
  const rect=canvas.getBoundingClientRect(),x=(event.clientX-rect.left)/rect.width*state.W,y=(event.clientY-rect.top)/rect.height*state.H;
  for(const a of state.actors.slice(1)){if(a.enemy.hp>0&&Math.abs(x-a.x)<a.width*.6&&y<a.y+15&&y>a.y-a.width-70){selectTarget(a.enemy.id);break;}}
});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&audio.ctx)audio.ctx.suspend();else if(!state.paused&&audio.on&&audio.ctx)audio.ctx.resume();});

Promise.all(Object.entries({sewer:'goop-depot',bookspread:'peanut-book',hutch:'hutch-cannonball',bookribbon:'storybook-ribbon',pip:'peanut-happy',scrapper:'rat-scrapper',slinger:'rat-slinger',baron:'rat-boss'}).map(([name,file])=>new Promise((resolve,reject)=>{
  const img=new Image();img.onload=()=>{images[name]=img;resolve();};img.onerror=reject;img.src=`assets/${file}.png`;
}))).then(()=>{
  state.phase='title';makeActors();resize();home();$('start').disabled=false;$('start-label').textContent='Play';
}).catch(()=>{setHidden('loading-error',false);$('start-label').textContent='A prop is missing';});

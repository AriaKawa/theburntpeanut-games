const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const source=fs.readFileSync('bungerman/game.js','utf8');
function get(name){const start=source.indexOf('function '+name+'(');let brace=source.indexOf('{',start),depth=1,i=brace+1;for(;depth;i++){if(source[i]==='{')depth++;if(source[i]==='}')depth--;}return source.slice(start,i);}
const classes=()=>{const s=new Set();return {add:x=>s.add(x),remove:(...x)=>x.forEach(v=>s.delete(v)),contains:x=>s.has(x),toggle:(x,on)=>{if(on===undefined)on=!s.has(x);on?s.add(x):s.delete(x);return on;}}};
const els=new Map();const $=id=>{if(!els.has(id))els.set(id,{classList:classes(),dataset:{},setAttribute(k,v){this[k]=v},focus(){}});return els.get(id)};
const body={classList:classes()};
class Game{constructor(){this.status='select';this.score=0;}start(){this.status='playing'}next(){this.status='playing'}}
const noop=()=>{};const ctx={$ ,document:{body},Game,packReady:true,unlockAudio:noop,resetTouches:noop,selected:'peanut',selectedMap:'garden',paused:false,playerHit:0,keys:new Set(),particles:[],floaters:[],puddles:[],deaths:[],rings:[],animationStates:new WeakMap(),menuDelay:0,pendingState:null,drawPortraits:noop,sfx:noop,updateHud:noop,updateBest:noop,dismissFullscreenHint:noop,menuState:'select',toastTimer:0,canvas:{focus:noop},drawMenuArt:noop,multiplayer:{inRoom:false,active:false},Math,WeakMap,CAST:{},smallCanvas:noop,drawCast:noop};
vm.createContext(ctx);vm.runInContext(['fullscreenUI','showState','hideMenu','start','home','pause','proceed'].map(get).join('\n'),ctx);
ctx.fullscreenUI(false);assert(!body.classList.contains('fullscreen'));
ctx.start();assert(body.classList.contains('fullscreen'));assert(body.classList.contains('playing'));assert.equal($('fullscreen')['aria-label'],'Return to arcade cabinet');
ctx.fullscreenUI(false);assert(!body.classList.contains('fullscreen'));assert(body.classList.contains('playing'));
ctx.fullscreenUI(true);assert(body.classList.contains('fullscreen'));
ctx.pause();assert(ctx.paused);assert(body.classList.contains('fullscreen'));ctx.proceed();assert(!ctx.paused);assert(body.classList.contains('fullscreen'));
ctx.fullscreenUI(false);ctx.pause();ctx.proceed();assert(!body.classList.contains('fullscreen'));
ctx.game.status='lost';ctx.showState('lost');ctx.proceed();assert(body.classList.contains('fullscreen'));assert.equal(ctx.game.status,'playing');
ctx.home();assert.equal(ctx.menuState,'select');assert(!body.classList.contains('fullscreen'));assert(!body.classList.contains('playing'));
for(const name of ['game.js','style.css','view-controls.js','view-controls.css','preview-fixes.css','index.html'])assert.equal(fs.readFileSync('bungerman/'+name,'utf8'),fs.readFileSync('docs/bungerman/'+name,'utf8'));
assert(!get('start').includes('requestFullscreen'));assert(!source.includes('requestFullscreen'));
console.log('PASS cabinet-first, auto-expand start/retry, toggle both ways, pause/resume preserves view, home resets cabinet, source/docs parity; no browser fullscreen request');

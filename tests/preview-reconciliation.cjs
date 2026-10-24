const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
(async()=>{
 const engine=read('pac-nut/engine.js');
 const startCode=engine.slice(engine.indexOf('async function start()'),engine.indexOf('\nfunction pause()'));
 let finishCalls=0,levels=0;
 const context={mode:'over',score:40,level:3,lives:0,selectedMap:'classic',bonusLife:false,powerId:2,acc:1,
  window:{pacnutArcade:{finish(){finishCalls++;throw Error('Restart must not save');},show(){}}},
  document:{body:{classList:{remove(){}}},dispatchEvent(){}},CustomEvent:class{},
  $(){return {style:{}}},canvas:{focus(){}},makeLevel(){levels++},ui(){},beep(){},pause(){context.mode='playing'}};
 vm.createContext(context);vm.runInContext(startCode,context);
 for(let i=0;i<4;i++){context.mode='over';context.score=40+i;context.lives=0;await context.start();assert.equal(context.mode,'playing');assert.equal(context.score,0);assert.equal(context.lives,1)}
 assert.equal(finishCalls,0);assert.equal(levels,4);
 const nodes=new Map(),stored=new Map(),submissions=[];
 function node(id){if(!nodes.has(id))nodes.set(id,{value:'',hidden:false,disabled:false,textContent:'',handlers:{},append(){},replaceChildren(){},focus(){},select(){},addEventListener(k,fn){this.handlers[k]=fn},querySelector(){return node(id+'-button')}});return nodes.get(id)}
 const sandbox={window:{addEventListener(){}},document:{querySelector:node,getElementById:node,createElement:node,body:{classList:{toggle(){}}},addEventListener(){}},
 localStorage:{getItem:k=>stored.get(k)??null,setItem:(k,v)=>stored.set(k,v)},requestAnimationFrame:fn=>fn(),crypto:{randomUUID:()=> 'test-only-id'},
 PacnutScores:{maps:{classic:'Original'},fetchBoard:async()=>[],submit:async(entry,map)=>submissions.push({entry,map})}};
 vm.runInNewContext(read('pac-nut/arcade.js'),sandbox);
 sandbox.window.pacnutArcade.show(true,40,'classic');
 node('initials-form').handlers.submit({preventDefault(){}});await new Promise(setImmediate);
 assert.equal(submissions.length,0);assert.equal(node('save-status').textContent,'Enter three letters to save your score.');
 node('initials').value='abc';node('initials-form').handlers.submit({preventDefault(){}});await new Promise(setImmediate);
 assert.equal(submissions.length,1);assert.equal(submissions[0].entry.name,'ABC');assert.equal(submissions[0].entry.score,40);
 node('initials-form').handlers.submit({preventDefault(){}});await new Promise(setImmediate);assert.equal(submissions.length,1);
 for(const game of ['pac-nut','paper-peanut','bungerman']){
  const html=read(game+'/index.html');assert(html.includes('noindex'));assert(html.includes('preview-notice'));assert(!html.includes('style="position:fixed;bottom:8px'));
  assert.equal(html,read('docs/'+game+'/index.html'));
 }
 const metadata=await import('../bungerman/assets/runtime/ui-assets.js');
 for(const key of ['range','rpg','speed'])assert(metadata.UI_ASSETS[key].file.endsWith('-pixel.webp'));
 for(const key of ['shield','capacity','kick'])assert(metadata.UI_ASSETS[key]);
 assert(read('bungerman/index.html').includes('drop-guide'));assert(read('bungerman/index.html').includes('perk'));assert(read('bungerman/game.js').includes('multiplayer.isHost?'));
 for(const p of ['engine.js','game.js','index.html','style.css','assets/runtime/ui-assets.js','preview-fixes.css'])assert.equal(read('bungerman/'+p),read('docs/bungerman/'+p));
 console.log('PASS independent positive-score restart, explicit validated Save Score (mock only), duplicate-save guard, item/perk merge, notices and source/docs parity');
})().catch(e=>{console.error(e);process.exit(1)});

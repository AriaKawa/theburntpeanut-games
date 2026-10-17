// Test-only module instrumentation places real encounters at known health/phase states.
const {chromium}=require('C:/Users/Swagg/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');const out=__dirname+'/artifacts/paper-peanut/final-layout';fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'}),page=await browser.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/game.js?*',async route=>{
  const response=await route.fetch();await route.fulfill({response,body:(await response.text())+`\nwindow.sceneAudit={set(campaign,boss,half){state.session++;state.tweens=[];state.command=null;selectedCampaign=campaign;state.run=freshRun('whirl',campaign);if(boss){state.run.chapter=CAMPAIGNS[campaign].end;state.run.enemies=CHAPTERS[state.run.chapter].enemies.map(([kind,hp],id)=>({id,kind,hp:half?Math.floor(hp/2):hp,maxHp:hp,...auditEnemies[kind]}));}state.phase='choose';state.paused=false;setHidden('title-screen',true);setHidden('result',true);setHidden('hud',false);makeActors();resize();choose();},turn:()=>enemiesTurn(),status:()=>({phase:state.phase,hp:state.run.hp,blocks:state.run.blocks})};\nimport {ENEMIES as auditEnemies} from './engine.mjs';`});
 });
 await page.goto('http://127.0.0.1:5268/paper-peanut/');await page.waitForFunction(()=>!document.querySelector('#start').disabled);
 for(const viewport of [{width:1280,height:860},{width:390,height:844},{width:844,height:390}]){
  await page.setViewportSize(viewport);
  for(const campaign of [1,2])for(const boss of [false,true]){
    await page.evaluate(({campaign,boss})=>window.sceneAudit.set(campaign,boss,false),{campaign,boss});await page.waitForTimeout(120);
    await page.screenshot({path:`${out}/chapter-${campaign+1}-fight-${boss?4:1}-${viewport.width}x${viewport.height}.png`});
    if(boss){
      await page.evaluate(c=>{window.sceneAudit.set(c,true,true);window.sceneAudit.turn();},campaign);
      let previous='',start=Date.now();
      while(Date.now()-start<25000){
       const ui=await page.evaluate(()=>({...window.sceneAudit.status(),motion:document.querySelector('#action-motion').textContent}));
       if(ui.phase==='choose')break;
       if(ui.motion.includes('about to')&&previous!==ui.motion){await page.keyboard.press('Space');previous=ui.motion;}if(!ui.motion.includes('about to'))previous='';
       await page.waitForTimeout(10);
      }
      const status=await page.evaluate(()=>window.sceneAudit.status());assert.equal(status.phase,'choose');assert.equal(status.hp,20);assert(status.blocks>=3);
      console.log('PASS boss phase 2',campaign+1,viewport.width,status.blocks);
    }
  }
 }
 assert.equal(errors.length,0,errors.join('\n'));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});

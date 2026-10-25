const {chromium}=require('C:/Users/Swagg/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
fs.mkdirSync(path.join(__dirname,'artifacts'),{recursive:true});
(async()=>{
 const server=require('node:http').createServer((req,res)=>{
  let file=path.join(root,decodeURIComponent(req.url.split('?')[0]));if(file.endsWith(path.sep))file+='index.html';
  fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',({'.js':'text/javascript','.mjs':'text/javascript','.html':'text/html','.css':'text/css','.png':'image/png','.webp':'image/webp'})[path.extname(file)]||'application/octet-stream');res.end(data);});
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 try {
  const page=await browser.newPage({viewport:{width:1280,height:860}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/game.js?*',async route=>{
   const response=await route.fetch();await route.fulfill({response,body:(await response.text())+'\nwindow.feedbackAudit={state,audio,beginContact,pressCommand,finishContact,hurtEnemy,enemyStrike,damageTrail,updateHUD};'});
  });
  await page.goto(process.env.PAPER_PEANUT_URL||`http://127.0.0.1:${server.address().port}/docs/paper-peanut/`);
  await page.waitForFunction(()=>!document.querySelector('#start').disabled);
  await page.click('#start');await page.click('#chapter-rats');
  await page.waitForFunction(()=>!document.querySelector('#commands').hidden);
  await page.evaluate(()=>{
   const a=window.feedbackAudit;a.calls=0;const original=a.audio.contactSuccess;
   a.audio.contactSuccess=function(){a.calls++;return original.call(this);};
  });
  // Exercise the real keyboard handler while holding each command at its contact pose.
  async function command(type,offset,press=true){
   await page.evaluate(({type,offset})=>{const a=window.feedbackAudit;a.beginContact(type,offset,'test');}, {type,offset});
   if(press)await page.keyboard.press('Space');
   if(offset>0)await page.waitForTimeout(offset);
   return page.evaluate(async()=>{const a=window.feedbackAudit;const grade=await a.finishContact();return {grade,calls:a.calls,glow:a.state.actors[0].contactGlowAt,now:a.state.fxTime};});
  }
  let result=await command('jump',0);assert.equal(result.grade,'perfect');assert.equal(result.calls,1);assert(result.now-result.glow<50);
  await page.screenshot({path:path.join(__dirname,'artifacts/paper-peanut-contact-glow.png')});
  await page.waitForTimeout(720);
  assert(await page.evaluate(()=>{const s=window.feedbackAudit.state;return s.fxTime-s.actors[0].contactGlowAt>=650;}));
  result=await command('bonk',500);assert.equal(result.grade,'miss');assert.equal(result.calls,1);
  result=await command('block',0,false);assert.equal(result.grade,'miss');assert.equal(result.calls,1);
  result=await command('block',0);assert.equal(result.grade,'perfect');assert.equal(result.calls,2);
  await page.emulateMedia({reducedMotion:'reduce'});await page.setViewportSize({width:390,height:844});
  await page.evaluate(()=>{const a=window.feedbackAudit;a.audio.on=false;});
  result=await command('whirl',0);assert.equal(result.grade,'perfect');assert.equal(result.calls,3);
  assert(result.now-result.glow<50);assert.deepEqual(errors,[]);
  await page.evaluate(()=>{
   const a=window.feedbackAudit,s=a.state,original=s.fxTime;s.reducedMotion=false;
   const holder={};a.damageTrail(holder,10,10);a.damageTrail(holder,6,10);
   if(a.damageTrail(holder,6,10)!==1)throw Error('No damage hold');
   s.fxTime+=435;const middle=a.damageTrail(holder,6,10);if(!(middle>.6&&middle<1))throw Error('No damage drain');
   a.damageTrail(holder,4,10);if(a.damageTrail(holder,4,10)<middle-.001)throw Error('Repeated hit lost its trail');
   s.fxTime+=700;if(a.damageTrail(holder,4,10)!==.4)throw Error('Trail did not settle');
   if(a.damageTrail(holder,8,10)!==.8)throw Error('Healing left stale damage');
   s.fxTime=original;s.run.hp-=3;a.updateHUD();
   if(parseFloat(document.querySelector('#hp-trail').style.width)<=parseFloat(document.querySelector('#hp-bar').style.width))throw Error('Player trail missing');
   a.audio.on=true;a.audio.armorBreak();a.audio.knockout(false);a.audio.knockout(true);
   a.armorCalls=0;a.koCalls=[];a.audio.armorBreak=()=>a.armorCalls++;a.audio.knockout=final=>a.koCalls.push(final);
  });
  await page.setViewportSize({width:1280,height:860});
  await page.evaluate(()=>{
   const a=window.feedbackAudit;a.state.phase='enemy';
   const timer=setInterval(()=>{if(document.querySelector('#action-motion').textContent==='Contact.'&&a.state.command)a.state.command.inputAt=a.state.time;},5);
   a.strike=a.enemyStrike(a.state.actors[1],a.state.actors[0],{kind:'scrapper',travel:180,windup:50}).finally(()=>clearInterval(timer));
  });
  await page.waitForFunction(()=>window.feedbackAudit.state.actors[0].blockAt!==undefined);
  const block=await page.evaluate(()=>{const a=window.feedbackAudit;a.state.paused=true;return {hp:a.state.run.hp,rot:a.state.actors[1].rot};});
  await page.screenshot({path:path.join(__dirname,'artifacts/paper-peanut-shield.png')});
  await page.evaluate(()=>{window.feedbackAudit.state.paused=false;});await page.evaluate(()=>window.feedbackAudit.strike);
  assert.equal(await page.evaluate(()=>window.feedbackAudit.state.run.hp),block.hp);
  await page.evaluate(async()=>{
   const a=window.feedbackAudit,s=a.state;s.phase='attack';s.actors[1].enemy.armor=true;
   await a.hurtEnemy(s.actors[1],1,'bonk','perfect');
   if(a.armorCalls!==1||!s.floats.some(f=>f.text==='ARMOR BROKEN'))throw Error('Armor break feedback missing');
   s.actors[1].enemy.hp=1;await a.hurtEnemy(s.actors[1],1,'bonk');
   if(a.koCalls.length!==1||a.koCalls[0]!==false)throw Error('Normal knockout cue missing');
   s.actors[2].enemy.hp=1;const start=s.fxTime;
   const last=a.hurtEnemy(s.actors[2],1,'bonk');
   if(s.freeze!==150)throw Error('Final hit stop missing');
   await last;if(s.fxTime-start<550)throw Error('Final knockout has no breathing room');
   if(a.koCalls.length!==2||a.koCalls[1]!==true)throw Error('Final knockout cue missing');
  });
  assert.deepEqual(errors,[]);
  console.log('PASS: keyboard timing, muted/mobile feedback, damage hold/drain/repeated hits/healing, player trail, shield block, armor break, normal/final knockouts, no browser errors');
 } finally {await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});

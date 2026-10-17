const {chromium}=require('C:/Users/Swagg/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),out=path.join(__dirname,'artifacts/paper-peanut/refinement');fs.mkdirSync(out,{recursive:true});
(async()=>{
 const server=require('node:http').createServer((req,res)=>{let file=path.join(root,decodeURIComponent(req.url.split('?')[0]));if(file.endsWith(path.sep))file+='index.html';fs.readFile(file,(error,data)=>{if(error){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',({'.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.html':'text/html','.webp':'image/webp','.png':'image/png'})[path.extname(file)]||'application/octet-stream');res.end(data);});});
 await new Promise(resolve=>server.listen(5269,'127.0.0.1',resolve));server.unref();
 const browser=await chromium.launch({headless:true,channel:'msedge'}),page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>localStorage.setItem('paper-peanut-profile-v1',JSON.stringify({version:2,chapters:3,chapterBest:[10,20,30]})));
 await page.route('**/game.js?*',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text())+'\nwindow.refinementAudit={actors:()=>state.actors.map(a=>({alpha:a.alpha,x:a.x,homeX:a.homeX})),clear:()=>{state.run.enemies.forEach(e=>e.hp=0);endEncounter();}};'});});
 for(const viewport of [{width:1280,height:860},{width:390,height:844},{width:844,height:390}]){
  await page.setViewportSize(viewport);await page.goto('http://127.0.0.1:5269/paper-peanut/');await page.waitForFunction(()=>!document.querySelector('#start').disabled);await page.click('#start');
  assert.equal(await page.locator('#chapter-cards img').count(),0);assert((await page.locator('#chapter-2').getAttribute('aria-label')).includes('???'));assert(await page.locator('#chapter-2').isEnabled());
  await page.screenshot({path:`${out}/book-${viewport.width}.png`});
  await page.click('#chapter-rats');await page.waitForSelector('#encounter-card');
  assert((await page.evaluate(()=>window.refinementAudit.actors())).every(a=>a.alpha===0));
  await page.screenshot({path:`${out}/intro-${viewport.width}.png`});
  await page.waitForTimeout(350);assert((await page.evaluate(()=>window.refinementAudit.actors())).every(a=>a.alpha===0));
  await page.waitForFunction(()=>!document.querySelector('#commands').hidden);
  assert((await page.evaluate(()=>window.refinementAudit.actors())).every(a=>a.alpha===1&&Math.abs(a.x-a.homeX)<1));assert.equal(await page.locator('#commands kbd').count(),0);
  await page.screenshot({path:`${out}/battle-${viewport.width}.png`});
  await page.evaluate(()=>window.refinementAudit.clear());
  assert.equal(await page.locator('#result').evaluate(el=>getComputedStyle(el).backgroundImage),'none');
  await page.screenshot({path:`${out}/upgrade-${viewport.width}.png`});
  for(const button of await page.locator('#result button').all()){const box=await button.boundingBox();assert(box.x>=0&&box.y>=0&&box.x+box.width<=viewport.width&&box.y+box.height<=viewport.height);}
  await page.locator('[data-upgrade="jump"]').click();await page.waitForSelector('#encounter-card');assert((await page.evaluate(()=>window.refinementAudit.actors())).every(a=>a.alpha===0));
  console.log('PASS book, intro, move labels, upgrade layout',viewport.width,viewport.height);
 }
 assert.equal(errors.length,0,errors.join('\n'));await browser.close();
})().catch(error=>{console.error(error);process.exit(1)});

const {chromium}=require('C:/Users/Swagg/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
(async()=>{
 const server=require('node:http').createServer((req,res)=>{
  let file=path.join(root,decodeURIComponent(req.url.split('?')[0]));if(file.endsWith(path.sep))file+='index.html';
  fs.readFile(file,(err,data)=>{res.writeHead(err?404:200,{'Content-Type':({'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.mp3':'audio/mpeg'})[path.extname(file)]||'application/octet-stream'});res.end(err?'':data)});
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base=process.env.PEANUT_URL||`http://127.0.0.1:${server.address().port}/`;
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const errors=[],failures=[],report=[];const output=process.env.PEANUT_ARTIFACTS;
 try{
  for(const game of ['pac-nut','paper-peanut']){
   const page=await browser.newPage({viewport:{width:1440,height:900}});page.setDefaultTimeout(20000);console.log('Checking',game);
   page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)failures.push([r.status(),r.url()])});
   await page.goto(base+game+'/',{waitUntil:'networkidle'});
   await page.waitForFunction(()=>!document.querySelector('#start').disabled);
   await page.evaluate(async()=>{await Promise.all([...document.images].map(img=>img.decode()))});
   const bytes=await page.evaluate(()=>performance.getEntriesByType('resource').reduce((sum,r)=>sum+r.encodedBodySize,0));console.log('Initial bytes',game,bytes);
   assert(bytes<10000000,`${game} initial resources exceed 10 MB: ${bytes}`);
   if(game==='pac-nut'){
    assert.deepEqual(await page.evaluate(()=>Object.values(art).filter(im=>!im.complete||!im.naturalWidth).map(im=>im.src)),[]);
    for(const map of ['classic','neighborhood','scifi','fantasy']){
     await page.selectOption('#map-select',map);await page.click('#start');
     assert.equal(await page.evaluate(()=>activeTheme.id),map);await page.evaluate(()=>{readyTimer=0;draw()});
     await page.click('#pause');await page.click('#start');
    }
    // Reproduce the real game-over transition without submitting a fake online score.
    await page.evaluate(()=>{score=100;mode='dying';deathTimer=0;update(.01)});
    await page.waitForFunction(()=>document.body.classList.contains('dead'));
    assert(await page.locator('#initials-form').isVisible());
    for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:844,height:390}]){
     await page.setViewportSize(viewport);const back=page.locator('#game-back');
     assert(await back.isVisible());const box=await back.boundingBox();assert(box.x>=0&&box.y>=0&&box.x+box.width<=viewport.width);
     assert(await back.evaluate(el=>{const r=el.getBoundingClientRect();return el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))}));
     if(output)await page.screenshot({path:path.join(output,`back-${viewport.width}.png`)});
    }
    await page.click('#game-back');assert.equal(await page.evaluate(()=>mode),'ready');
    await page.click('#game-back');await page.waitForURL(base);
   }else{
    await page.click('#open-arsenal');await page.waitForLoadState('networkidle');
    await page.evaluate(async()=>{const e=document.querySelector('.arsenal-page'),url=getComputedStyle(e).backgroundImage.match(/url\(["']?(.*?)["']?\)/)[1];const im=new Image();im.src=url;await im.decode()});
    if(output)await page.screenshot({path:path.join(output,'arsenal-optimized.png')});
    await page.click('#game-back');await page.click('#start');await page.waitForLoadState('networkidle');
    await page.click('#chapter-rats');await page.waitForFunction(()=>!document.querySelector('#commands').hidden);
    await page.keyboard.press('1');await page.waitForTimeout(1000);
    if(output)await page.screenshot({path:path.join(output,'paper-optimized.png')});
   }
   report.push({game,initialBytes:bytes});await page.close();
  }
  assert.deepEqual(errors,[]);assert.deepEqual(failures,[]);console.log(JSON.stringify({report,errors,failures}));
 }finally{await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exit(1)});

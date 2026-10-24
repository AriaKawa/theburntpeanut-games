const {chromium}=require('C:/Users/Swagg/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
 const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
 const root=path.resolve(__dirname,'..');
 const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.png':'image/png','.webp':'image/webp'};
 const server=http.createServer((req,res)=>{let file=path.join(root,decodeURIComponent(req.url.split('?')[0]));if(file.endsWith(path.sep))file+='index.html';fs.readFile(file,(err,data)=>{res.writeHead(err?404:200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});res.end(err?'Not found':data);});});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));server.unref();
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:'+server.address().port+'/paper-peanut/');
 await page.waitForFunction(()=>!document.querySelector('#start').disabled);
 await page.click('#open-arsenal');
 assert.equal(await page.locator('#arsenal-wallet').textContent(),'0');
 assert(await page.locator('[data-ability=quake] .arsenal-action').isDisabled());
 await page.click('#close-arsenal');
 await page.evaluate(()=>localStorage.setItem('paper-peanut-profile-v1',JSON.stringify({version:2,scrap:30,clears:20,unlocked:['whirl'],equipped:'whirl'})));
 await page.reload();await page.waitForFunction(()=>!document.querySelector('#start').disabled);await page.click('#open-arsenal');
 await page.locator('[data-ability=quake] .arsenal-action').click();
 assert.equal(await page.locator('#arsenal-wallet').textContent(),'21');
 assert.equal(await page.locator('[data-ability=quake] .arsenal-action').textContent(),'✓ Equipped');
 await page.locator('[data-ability=whirl] .arsenal-action').click();
 assert.equal(await page.locator('[data-ability=whirl] .arsenal-action').textContent(),'✓ Equipped');
 await page.locator('[data-ability=quake] .tier-button').click();
 assert.equal(await page.locator('#arsenal-wallet').textContent(),'15');
 for(const size of [{width:1280,height:860},{width:844,height:390},{width:390,height:844}]){
  await page.setViewportSize(size);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  for(const locator of ['#close-arsenal','[data-ability=quake] .arsenal-action']){
   const box=await page.locator(locator).boundingBox();assert(box&&box.x>=0&&box.y>=0&&box.x+box.width<=size.width&&box.y+box.height<=size.height);
  }
  await page.screenshot({path:__dirname+'/arsenal-book-'+size.width+'.png'});
 }
 await page.keyboard.press('Escape');assert(await page.locator('.arsenal-page').isHidden());
 assert.deepEqual(errors,[]);await browser.close();console.log('PASS locked abilities, purchase, equip, upgrade, wallet, back, and three viewport layouts');
})().catch(e=>{console.error(e);process.exit(1)});

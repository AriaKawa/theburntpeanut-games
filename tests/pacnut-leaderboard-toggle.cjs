const {chromium}=require('C:/Users/Swagg/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'..');
(async()=>{
 const server=require('http').createServer((req,res)=>{let p=path.join(root,req.url.split('?')[0]);if(p.endsWith(path.sep))p+='index.html';fs.readFile(p,(e,b)=>{res.writeHead(e?404:200,{'Content-Type':({'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png'})[path.extname(p)]||'application/octet-stream'});res.end(e?'':b)})});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'msedge',headless:true});
 try{const page=await browser.newPage({viewport:{width:1920,height:1080}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.PACNUT_URL||`http://127.0.0.1:${server.address().port}/docs/pac-nut/`,{waitUntil:'networkidle'});

 // Delay score loading to exercise closing while a request is still pending.
 await page.route('**/pacnutLeaderboardV1.json?**',async route=>{await new Promise(r=>setTimeout(r,300));await route.fulfill({contentType:'application/json',body:'{}'}).catch(()=>{})});
 for(const full of [false,true]){await page.evaluate(on=>document.body.classList.toggle('fullscreen',on),full);await page.click('#board-open');assert(await page.locator('#board').isVisible());await page.click('#board-open');assert.equal(await page.locator('#board').isVisible(),false);await page.waitForTimeout(400);assert.equal(await page.locator('#board').isVisible(),false);await page.click('#board-open');await page.click('#board-close');assert.equal(await page.locator('#board').isVisible(),false);assert.equal(await page.evaluate(()=>document.activeElement.id),'board-open');await page.keyboard.press('Enter');assert(await page.locator('#board').isVisible());await page.keyboard.press('Escape');assert.equal(await page.locator('#board').isVisible(),false);}
 await page.click('#start');await page.click('#board-open');assert.equal(await page.evaluate(()=>mode),'paused');await page.click('#board-open');assert.equal(await page.evaluate(()=>mode),'paused');assert.equal(await page.locator('#board').isVisible(),false);
 assert.deepEqual(errors,[]);console.log('PASS leaderboard toggle, X parity, keyboard, delayed fetch, fullscreen, and pause preservation');
 }finally{await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exit(1)});

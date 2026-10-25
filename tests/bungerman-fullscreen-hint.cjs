const {chromium}=require('C:/Users/Swagg/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
(async()=>{
 const server=require('http').createServer((req,res)=>{let p=path.join(process.cwd(),req.url.split('?')[0]);if(p.endsWith(path.sep))p+='index.html';fs.readFile(p,(e,b)=>{res.writeHead(e?404:200,{'Content-Type':({'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp'})[path.extname(p)]||'application/octet-stream'});res.end(e?'':b)})});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'msedge',headless:true});
 try{const page=await browser.newPage({viewport:{width:1440,height:1000}});const url=process.env.BUNGERMAN_URL||`http://127.0.0.1:${server.address().port}/docs/bungerman/`;
 await page.goto(url);const hint=page.locator('#fullscreen-hint');await hint.waitFor({state:'visible'});await page.locator('#fullscreen').hover();assert.equal(await hint.isVisible(),false);await page.mouse.move(400,400);await page.evaluate(()=>window.dispatchEvent(new Event('pageshow')));assert.equal(await hint.isVisible(),false);
 await page.reload();await hint.waitFor({state:'visible'});await page.focus('#fullscreen');await page.keyboard.press('Enter');assert.equal(await hint.isVisible(),false);assert(await page.evaluate(()=>document.body.classList.contains('fullscreen')));await page.keyboard.press('Enter');assert.equal(await hint.isVisible(),false);assert.equal(await page.evaluate(()=>document.body.classList.contains('fullscreen')),false);
 await page.reload();await hint.waitFor({state:'visible'});await page.click('#fullscreen');assert.equal(await hint.isVisible(),false);console.log('PASS hover dismissal, click dismissal, keyboard click, fullscreen entry/exit, and no hint return after pageshow');
 }finally{await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exit(1)});

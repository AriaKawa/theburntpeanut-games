const {chromium}=require('C:/Users/Swagg/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
(async()=>{
 const root=process.cwd(), server=require('http').createServer((req,res)=>{let f=path.join(root,req.url.split('?')[0]);if(f.endsWith(path.sep))f+='index.html';fs.readFile(f,(e,b)=>{res.writeHead(e?404:200,{'Content-Type':f.endsWith('.js')?'text/javascript':'text/html'});res.end(e?'':b)});});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({channel:'msedge',headless:true,args:['--autoplay-policy=user-gesture-required']});
 try {
 const page=await browser.newPage();
 await page.addInitScript(()=>{window.tones=[];const original=AudioContext.prototype.createOscillator;AudioContext.prototype.createOscillator=function(){const o=original.call(this),start=o.start.bind(o);o.start=(...a)=>{tones.push({time:performance.now(),state:this.state});return start(...a)};return o;};});
 const url='http://127.0.0.1:'+server.address().port+'/';await page.goto(url);
 await page.locator('main').click({position:{x:5,y:5}});
 await page.locator('a.brand').hover();await page.waitForTimeout(160);
 assert(await page.evaluate(()=>tones.some(t=>t.state==='running')),'hover plays after gesture');
 await page.locator('#ui-sound').click();await page.waitForTimeout(160);
 const count=await page.evaluate(()=>tones.length);await page.locator('a.brand').hover();await page.waitForTimeout(160);assert.equal(await page.evaluate(()=>tones.length),count,'muted hover stays silent');
 await page.reload();assert.equal(await page.locator('#ui-sound').getAttribute('aria-pressed'),'false');
 await page.locator('#ui-sound').click();await page.waitForTimeout(160);assert(await page.evaluate(()=>tones.length>0),'unmute confirmation');
 await page.evaluate(()=>{document.querySelector('a.brand').href='#sound-test'});
 const before=await page.evaluate(()=>tones.length);await page.locator('a.brand').click();
 assert(await page.evaluate(()=>tones.length>0),'click tone started');await page.waitForURL('**/#sound-test');
 console.log('PASS: hover audio running, saved mute, unmute confirmation, click audio and navigation');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exit(1)});

const {chromium}=require('C:/Users/Swagg/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),root=path.resolve(__dirname,'..');
(async()=>{const server=require('node:http').createServer((req,res)=>{let file=path.join(root,decodeURIComponent(req.url.split('?')[0]));if(file.endsWith(path.sep))file+='index.html';fs.readFile(file,(err,data)=>{res.writeHead(err?404:200,{'Content-Type':({'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.mp3':'audio/mpeg'})[path.extname(file)]||'application/octet-stream'});res.end(err?'':data)})});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[];
try{const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto((process.env.PEANUT_URL||`http://127.0.0.1:${server.address().port}/`)+'pac-nut/',{waitUntil:'networkidle'});await page.evaluate(()=>Promise.all(Object.values(art).map(im=>im.decode())));
for(const [width,height]of [[1440,900],[841,843],[390,844],[844,390]]){
 await page.setViewportSize({width,height});await page.waitForTimeout(200);await page.evaluate(()=>{fitBoard();mode='playing';readyTimer=999;document.querySelector('#overlay').style.display='none';draw()});
 const info=await page.evaluate(()=>{const screen=document.querySelector('.screen').getBoundingClientRect(),control=document.querySelector('.controls').getBoundingClientRect(),cabinet=document.querySelector('.cabinet').getBoundingClientRect();let burger;
 const original=ctx.drawImage;ctx.drawImage=function(im,...args){if(im===art.burger){const m=this.getTransform();burger={width:args[2]*Math.hypot(m.a,m.b),height:args[3]*Math.hypot(m.c,m.d)}}return original.call(this,im,...args)};draw();ctx.drawImage=original;
 return {screen:{w:screen.width,h:screen.height},canvas:{w:canvas.width,h:canvas.height},bottom:control.bottom,cabinetBottom:cabinet.bottom,burger};});
 assert(Math.abs(info.canvas.w/info.canvas.h-info.screen.w/info.screen.h)<.01);assert(info.bottom<=height,JSON.stringify(info));assert(info.bottom<=info.cabinetBottom,JSON.stringify(info));assert(Math.abs(info.burger.width/info.burger.height-25/24)<.001,JSON.stringify(info));
 if(process.env.PEANUT_ARTIFACTS)await page.screenshot({path:path.join(process.env.PEANUT_ARTIFACTS,`native-${width}.png`)});console.log({width,height,...info});
}
for(const map of ['classic','neighborhood','scifi','fantasy']){await page.selectOption('#map-select',map);await page.click('#start');assert.equal(await page.evaluate(()=>activeTheme.id),map)}
assert.deepEqual(errors,[]);console.log('PASS native canvas fit, proportional burgers, full cabinet controls, four maps, no script errors');
}finally{await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r))}})().catch(e=>{console.error(e);process.exit(1)});

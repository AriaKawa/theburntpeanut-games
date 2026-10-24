const {chromium}=require('C:/Users/Swagg/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'..');
(async()=>{
 const server=require('http').createServer((req,res)=>{let p=path.join(root,req.url.split('?')[0]);if(p.endsWith(path.sep))p+='index.html';fs.readFile(p,(e,b)=>{res.writeHead(e?404:200,{'Content-Type':({'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png'})[path.extname(p)]||'application/octet-stream'});res.end(e?'':b)})});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'msedge',headless:true});
 try{const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:${server.address().port}/pac-nut/`,{waitUntil:'networkidle'});
 await page.evaluate(()=>Promise.all(Object.values(art).map(im=>im.decode())));
 for(const [width,height]of [[1920,1080],[2560,1440],[1366,768],[390,844],[844,390]]){
  await page.setViewportSize({width,height});
  await page.evaluate(()=>document.body.classList.add('fullscreen'));await page.waitForTimeout(150);
  const info=await page.evaluate(()=>{fitBoard();mode='playing';readyTimer=999;document.querySelector('#overlay').style.display='none';
   let walls=0;const original=drawMapWall;drawMapWall=(...args)=>{walls++;return original(...args)};mazeLayers.clear();draw();const first=walls;draw();drawMapWall=original;
   const r=canvas.getBoundingClientRect(),m=ctx.getTransform();
   const start=performance.now();for(let i=0;i<60;i++)draw();const ms=(performance.now()-start)/60;
   return {w:r.width,h:r.height,bottom:document.querySelector('.controls').getBoundingClientRect().bottom,first,second:walls-first,ms,burger:24*boardScale,spacing:30*m.d};});
  assert(Math.abs(info.w/info.h-28/31)<.002);assert(info.bottom<=height+1);assert(info.burger<info.spacing);assert(info.first>100);assert.equal(info.second,0);console.log({width,height,...info});
  if(width===1920)await page.screenshot({path:path.join(root,'tests/artifacts/fullscreen-fixed.png')});
 }
 for(const map of ['classic','neighborhood','scifi','fantasy']){await page.selectOption('#map-select',map);await page.evaluate(()=>{draw();weapon=3;draw();weapon=0;draw()});}
 await page.setViewportSize({width:1920,height:1080});await page.evaluate(()=>document.body.classList.remove('fullscreen'));await page.click('#fullscreen');await page.waitForTimeout(200);assert(await page.evaluate(()=>!!document.fullscreenElement));await page.evaluate(()=>document.exitFullscreen());await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>document.body.classList.contains('fullscreen')),false);
 assert.deepEqual(errors,[]);console.log('PASS fullscreen proportions, burger spacing, cached maze, themes, enter/exit, and controls');
 }finally{await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exit(1)});

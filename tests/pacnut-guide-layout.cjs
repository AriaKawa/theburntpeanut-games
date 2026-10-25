const {chromium}=require('C:/Users/Swagg/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'..');
(async()=>{
 const server=require('http').createServer((req,res)=>{let p=path.join(root,req.url.split('?')[0]);if(p.endsWith(path.sep))p+='index.html';fs.readFile(p,(e,b)=>{res.writeHead(e?404:200,{'Content-Type':({'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png'})[path.extname(p)]||'application/octet-stream'});res.end(e?'':b)})});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'msedge',headless:true});
 try{const page=await browser.newPage({viewport:{width:1920,height:1080}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.PACNUT_URL||`http://127.0.0.1:${server.address().port}/docs/pac-nut/`,{waitUntil:'networkidle'});

 const guide=await page.locator('.ghost-guide').textContent();for(const name of ['Hutch:','Gingy:','Ninja:','Cloakzy:','T-Pain: sweeps the right half'])assert(guide.includes(name));assert(!guide.includes('pink hat'));
 const behavior=await page.evaluate(()=>{phase=1;const g=ghosts[4];g.state='active';Object.assign(player,actor(20,5,'left'));const chase=target(g);Object.assign(player,actor(6,5,'right'));const patrol=[],speeds=[];for(const t of [0,4,4.8,6,12,18]){roundTime=t;patrol.push(target(g));speeds.push(speed(g))}return{chase,patrol,speeds,role:g.role}});assert.equal(behavior.role,'rightSweeper');assert.equal(behavior.chase.x,20);assert(behavior.patrol.every(p=>p.x>=14));assert(behavior.speeds.every(v=>v===behavior.speeds[0]));
 for(const [width,height] of [[1920,1080],[1366,768],[390,844],[844,390]]){await page.setViewportSize({width,height});for(const fullscreen of [false,true]){await page.evaluate(on=>document.body.classList.toggle('fullscreen',on),fullscreen);await page.waitForTimeout(100);const layout=await page.evaluate(()=>{const b=document.querySelector('#game-back').getBoundingClientRect(),n=document.querySelector('.preview-notice').getBoundingClientRect(),c=document.querySelector('.cabinet').getBoundingClientRect();return{left:b.left,backBottom:b.bottom,noticeCenter:n.x+n.width/2,noticeLeft:n.left,backRight:b.right,noticeBottom:n.bottom,cabinetTop:c.top}});assert(layout.left<=8);assert(Math.abs(layout.noticeCenter-width/2)<1);assert(layout.noticeLeft>layout.backRight);assert(layout.backBottom+2<=layout.cabinetTop);assert(layout.noticeBottom<=layout.cabinetTop);console.log({width,fullscreen,...layout});if(width===1920)await page.screenshot({path:'tests/artifacts/pacnut-top-'+fullscreen+'.png'});}}
 assert.deepEqual(errors,[]);console.log('PASS ghost names, right-half targeting, constant T-Pain speed, viewport navigation and texture clearance');
 }finally{await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exit(1)});


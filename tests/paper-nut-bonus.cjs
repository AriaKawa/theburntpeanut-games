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
   const response=await route.fetch();await route.fulfill({response,body:(await response.text())+'\nwindow.feedbackAudit={state,audio,beginContact,pressCommand,finishContact,hurtEnemy,enemyStrike,damageTrail,updateHUD,jumpAttack,attackDamage};'});
  });
  await page.goto(process.env.PAPER_PEANUT_URL||`http://127.0.0.1:${server.address().port}/docs/paper-peanut/`);
  await page.waitForFunction(()=>!document.querySelector('#start').disabled);
  await page.click('#start');await page.click('#chapter-rats');
  await page.waitForFunction(()=>!document.querySelector('#commands').hidden);
  await page.evaluate(async()=>{
   const a=window.feedbackAudit,s=a.state,h=s.actors[0],t=s.actors[1];
   for(const n of ['bonk','whirl','propeller','siphon','quake'])for(const armor of [false,true])for(const g of ['miss','perfect']){
    t.enemy.hp=100;t.enemy.armor=armor;s.floats=[];
    const b=a.attackDamage(n,'miss',t.enemy,0),d=a.attackDamage(n,g,t.enemy,0);
    await a.hurtEnemy(t,d,n,g);
    if(s.floats[0].text!==String.fromCharCode(8722)+b||s.floats[0].bonus!==d-b||t.enemy.hp!==100-d)throw Error('Damage feedback '+n);
   }
   t.enemy.hp=100;t.enemy.armor=false;s.floats=[];
   const timer=setInterval(()=>{if(s.command&&document.querySelector('#action-motion').textContent==='Contact.')s.command.inputAt=s.time;},1);
   await a.jumpAttack(h,t);clearInterval(timer);
   if(t.enemy.hp!==94||!s.floats.some(f=>f.bonus===3))throw Error('Jump bonus');
   const hp=s.run.hp;const spam=setInterval(()=>a.pressCommand(),5);
   await a.enemyStrike(t,h,{kind:'scrapper',travel:180,windup:50});clearInterval(spam);
   if(s.command!==null||!document.querySelector('#action-cue').hidden||s.run.hp>=hp)throw Error('Enemy block');
   s.floats=[{text:'4',bonus:2,x:640,y:350,color:'#fff0c8',born:s.fxTime}];
  });
  await page.screenshot({path:path.join(__dirname,'artifacts/paper-nut-purple-bonus.png')});
  assert.deepEqual(errors,[]);console.log('PASS 20 damage/armor/timing cases, bonus stomp, automatic enemy damage, no browser errors');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exit(1);});

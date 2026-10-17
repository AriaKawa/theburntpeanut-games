const {chromium}=require('C:/Users/Swagg/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs');const assert=require('node:assert/strict');
const out=__dirname+'/artifacts/paper-peanut';fs.mkdirSync(out,{recursive:true});
const sizes=[{width:1280,height:860},{width:390,height:844},{width:844,height:390}];
(async()=>{
 const path=require('node:path'),root=path.resolve(__dirname,'..');
 const server=require('node:http').createServer((req,res)=>{let file=path.join(root,decodeURIComponent(req.url.split('?')[0]));if(file.endsWith(path.sep))file+='index.html';fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',({'.js':'text/javascript','.mjs':'text/javascript','.html':'text/html','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream');res.end(data);});});
 await new Promise(resolve=>server.listen(5268,'127.0.0.1',resolve));server.unref();
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 const page=await browser.newPage({viewport:sizes[0]});const errors=[],intents=new Set();
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto('http://127.0.0.1:5268/paper-peanut/');await page.waitForFunction(()=>!document.querySelector('#start').disabled);
 await page.click('#start');await page.click('#chapter-rats');
 let action=0,lastMotion='',encounter=0,chapter=1,shot=new Set(),start=Date.now();
 while(Date.now()-start<900000){
   const ui=await page.evaluate(()=>({commands:!document.querySelector('#commands').hidden,motion:document.querySelector('#action-motion').textContent,cue:!document.querySelector('#action-cue').hidden,result:!document.querySelector('#result').hidden,resultText:document.querySelector('#result').textContent,upgrade:!!document.querySelector('[data-upgrade]'),card:document.querySelector('#encounter-card').textContent,intent:document.querySelector('#enemy-intent').textContent,hp:document.querySelector('#hp').textContent}));
   if(ui.intent)intents.add(ui.intent);
   if(ui.cue&&ui.motion.includes('about to')&&ui.motion!==lastMotion){await page.keyboard.press('Space');lastMotion=ui.motion;}
   if(!ui.motion.includes('about to'))lastMotion='';
   if(ui.commands){
     const match=ui.card.match(/CHAPTER (\d+) · (\d+)/);if(match){chapter=Number(match[1]);encounter=Number(match[2]);}
     const key=`chapter-${chapter}-fight-${encounter}`;
     if(!shot.has(key)){
       shot.add(key);console.log(key,'HP',ui.hp);
       if(chapter>1&&(encounter===1||encounter===4)){
         for(const viewport of sizes){await page.setViewportSize(viewport);await page.waitForTimeout(120);await page.screenshot({path:`${out}/${key}-${viewport.width}x${viewport.height}.png`});}
         await page.setViewportSize(sizes[0]);await page.waitForTimeout(100);
       }
     }
     const move=action++%3+1;
     const disabled=await page.locator('#special-move').isDisabled();
     await page.keyboard.press(String(move===3&&disabled?1:move));
   }
   if(ui.result){
     assert(!ui.resultText.includes('Defeated'),ui.resultText);
     if(ui.upgrade)await page.locator('[data-upgrade="jump"]').click();
     else{
       console.log('CLEARED',chapter,ui.resultText);
       await page.screenshot({path:`${out}/summary-${chapter}.png`});
       if(chapter===3)break;
       await page.getByRole('button',{name:'Next chapter'}).click();
     }
   }
   await page.waitForTimeout(12);
 }
 assert.equal(chapter,3);assert(shot.has('chapter-3-fight-4'));assert.equal(errors.length,0,errors.join('\n'));
 const profile=await page.evaluate(()=>JSON.parse(localStorage.getItem('paper-peanut-profile-v1')));
 assert.equal(profile.chapters,3);assert(profile.chapterBest.every(x=>x>0));
 fs.writeFileSync(`${out}/campaign-report.json`,JSON.stringify({seconds:(Date.now()-start)/1000,profile,errors,intents:[...intents]},null,2));
 console.log('PASS',JSON.stringify(profile));await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});

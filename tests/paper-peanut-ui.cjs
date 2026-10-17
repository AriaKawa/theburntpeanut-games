const {chromium}=require('C:/Users/Swagg/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');const out=__dirname+'/artifacts/paper-peanut';
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'}),page=await browser.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>localStorage.setItem('paper-peanut-profile-v1',JSON.stringify({version:2,scrap:20,clears:20,runs:3,best:920,unlocked:['whirl','quake'],equipped:'quake',chapters:3,chapterBest:[920,1000,1500],tiers:{whirl:1}})));
 await page.goto('http://127.0.0.1:5268/paper-peanut/');await page.waitForFunction(()=>!document.querySelector('#start').disabled);
 for(const viewport of [{width:390,height:844},{width:844,height:390},{width:1280,height:860}]){
   await page.setViewportSize(viewport);await page.click('#start');
   await page.screenshot({path:`${out}/chapter-book-${viewport.width}.png`});
   assert(await page.locator('#chapter-3').isEnabled());
   await page.click('#close-chapters');await page.click('#open-arsenal');await page.screenshot({path:`${out}/arsenal-${viewport.width}.png`});await page.click('#close-arsenal');
 }
 await page.click('#start');await page.click('#chapter-3');await page.waitForFunction(()=>!document.querySelector('#encounter-card').hidden);await page.screenshot({path:out+'/title-card.png'});
 await page.waitForFunction(()=>!document.querySelector('#commands').hidden);await page.keyboard.press('ArrowRight');assert((await page.locator('#stage').getAttribute('aria-label')).includes('Bolt Slinger selected'));
 await page.keyboard.press('3');await page.waitForFunction(()=>document.querySelector('#action-motion').textContent.includes('about to'),{},{polling:10});await page.keyboard.press('Enter');await page.waitForFunction(()=>document.querySelector('#callout').textContent.includes('NICE'));
 await page.keyboard.press('Escape');await page.screenshot({path:out+'/pause-cozy.png'});
 assert.equal(errors.length,0,errors.join('\n'));
 const retry=await browser.newPage();await retry.route('**/rat-market.webp',route=>route.abort());await retry.goto('http://127.0.0.1:5268/paper-peanut/');await retry.waitForSelector('#loading-error');assert(await retry.locator('#start').isDisabled());await retry.unroute('**/rat-market.webp');await retry.getByRole('button',{name:'Try again'}).click();await retry.waitForFunction(()=>!document.querySelector('#start').disabled);
 console.log('PASS menu layouts, title card, target arrows, Enter timing, pause, asset failure/retry');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});

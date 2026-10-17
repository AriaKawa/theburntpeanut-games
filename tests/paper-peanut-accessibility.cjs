const {chromium}=require('C:/Users/Swagg/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
const out=__dirname+'/artifacts/paper-peanut';
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,reducedMotion:'reduce'}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>localStorage.setItem('paper-peanut-profile-v1',JSON.stringify({version:1,scrap:17,clears:9,runs:3,best:920,unlocked:['whirl','quake'],equipped:'quake'})));
 await page.goto('http://127.0.0.1:5268/paper-peanut/');await page.waitForFunction(()=>!document.querySelector('#start').disabled);
 await page.click('#start');assert(await page.locator('#chapter-2').isEnabled());assert(await page.locator('#chapter-3').isDisabled());
 await page.click('#help');await page.check('#relaxed');await page.locator('.ribbon-button[data-close="help-dialog"]').click();await page.screenshot({path:out+'/chapter-book-portrait.png'});
 await page.click('#close-chapters');await page.click('#open-arsenal');await page.screenshot({path:out+'/arsenal-portrait.png'});
 assert((await page.locator('#arsenal-cards').innerText()).includes('9 encounter clears required'));
 await page.click('#close-arsenal');await page.click('#start');await page.click('#chapter-rats');
 await page.waitForFunction(()=>!document.querySelector('#commands').hidden);
 await page.keyboard.press('Escape');assert(await page.locator('#pause-dialog').isVisible());assert(await page.locator('#pause-cozy').isChecked());await page.uncheck('#pause-cozy');await page.click('#resume');
 const hp=await page.locator('#hp').innerText();await page.waitForTimeout(2000);assert.equal(await page.locator('#hp').innerText(),hp,'Turn-based game waits without input');
 // A touch move and touch contact must trigger a successful attack with reduced motion.
 await page.locator('[data-move="jump"]').tap();await page.waitForFunction(()=>document.querySelector('#action-motion').textContent.includes('about to'),{},{polling:10});
 await page.locator('#action-tap').dispatchEvent('pointerdown',{pointerType:'touch'});
 await page.waitForFunction(()=>document.querySelector('#callout').textContent.includes('NICE'));
 // Choose moves, but never press a timing command: the unblocked run must lose.
 const start=Date.now();
 while(Date.now()-start<240000){
  const ui=await page.evaluate(()=>({choose:!document.querySelector('#commands').hidden,result:!document.querySelector('#result').hidden,text:document.querySelector('#result').textContent}));
  if(ui.result){if(ui.text.includes('Defeated'))break;await page.locator('[data-upgrade="jump"]').click();}
  if(ui.choose)await page.locator('[data-move="jump"]').click();
  await page.waitForTimeout(60);
 }
 assert((await page.locator('#result').innerText()).includes('Defeated'));
 await page.screenshot({path:out+'/defeat-portrait.png'});assert.equal(errors.length,0,errors.join('\n'));
 fs.writeFileSync(out+'/accessibility-report.json',JSON.stringify({migration:true,cozySync:true,touch:true,reducedMotion:true,noInputWait:true,noBlockDefeat:true,errors},null,2));
 console.log('PASS old save, Cozy sync, keyboard pause, touch timing, reduced motion, idle wait and no-block defeat');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});

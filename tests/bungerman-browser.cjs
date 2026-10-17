const {chromium}=require('C:/Users/Swagg/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
const out=__dirname+'/artifacts';fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});const report=[];
try{for(const [width,height,touch] of [[1280,860,false],[390,844,true],[844,390,true]]){
 const context=await browser.newContext({viewport:{width,height},hasTouch:touch,isMobile:touch,reducedMotion:width===390?'reduce':'no-preference'}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto('http://127.0.0.1:5188/bungerman/');await page.waitForFunction(()=>!document.getElementById('play').disabled);
 await page.screenshot({path:`${out}/picker-${width}.png`});
 await page.locator('#music').click();assert.equal(await page.locator('#music').getAttribute('aria-pressed'),'false');assert.equal(await page.locator('#sound').getAttribute('aria-pressed'),'true');await page.locator('#music').click();await page.locator('#game').focus();
 await page.keyboard.press('ArrowRight');assert.equal(await page.locator('[data-character=hutch]').getAttribute('aria-pressed'),'true');await page.keyboard.press('ArrowLeft');await page.keyboard.press('ArrowDown');assert.equal(await page.locator('#map-name').textContent(),'FOUNDRY');await page.keyboard.press('ArrowUp');
 await page.keyboard.press('Enter');await page.waitForSelector('body.playing');const bounds=await page.locator('#game').boundingBox();if(!touch)assert(bounds.width>700,JSON.stringify(bounds));
 await page.keyboard.down('ArrowRight');await page.waitForTimeout(200);await page.keyboard.up('ArrowRight');
 if(touch){const stick=await page.locator('#joystick').boundingBox();assert(stick&&stick.width>=90);await page.dispatchEvent('#joystick','pointerdown',{pointerId:1,clientX:stick.x+stick.width*.75,clientY:stick.y+stick.height/2});await page.waitForTimeout(100);await page.dispatchEvent('#joystick','pointerup',{pointerId:1});await page.locator('#touch-bomb').click();}
 else await page.keyboard.press('Space');
 await page.screenshot({path:`${out}/play-${width}.png`});await page.waitForSelector('#state-view[data-state=lost]:not([hidden])',{timeout:15000});assert.match(await page.locator('#death-reason').textContent(),/Your own bomb/);
 await page.screenshot({path:`${out}/defeat-${width}.png`});await page.locator('#game').focus();await page.keyboard.press('Enter');await page.waitForSelector('body.playing');
 if(!touch){await page.locator('#fullscreen').click();assert(await page.locator('body').evaluate(el=>el.classList.contains('fullscreen')));await page.keyboard.press('Escape');assert(!(await page.locator('body').evaluate(el=>el.classList.contains('fullscreen'))));}
 // Layout fixture only: no Firebase room is created by this viewport check.
 await page.locator('#game-back').click();await page.evaluate(()=>{document.getElementById('select-view').hidden=true;document.getElementById('lobby-view').hidden=false;document.getElementById('lobby-code').textContent='TESTUI';document.getElementById('lobby-perk').textContent='Block one blast';document.getElementById('lobby-status').textContent='Choose a character, then ready up';});
 for(const id of ['#lobby-code','#lobby-leave']){const screen=await page.locator('.screen').boundingBox(),button=await page.locator(id).boundingBox();assert(button.y>=screen.y&&button.y+button.height<=screen.y+screen.height,id+' clipped at '+width);}
 await page.screenshot({path:`${out}/lobby-layout-${width}.png`});
 assert.deepEqual(errors,[]);report.push({width,height,bounds,reducedMotion:width===390,errors});await context.close();
}fs.writeFileSync(out+'/browser-results.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});


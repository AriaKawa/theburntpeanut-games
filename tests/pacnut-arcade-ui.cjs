const {chromium}=require('C:/Users/Swagg/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,channel:"msedge"});const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
for(const [width,height] of [[841,843],[1440,900],[390,844],[320,568],[844,390]]){
 await page.setViewportSize({width,height});await page.goto('http://127.0.0.1:4393/pac-nut/');await page.waitForFunction(()=>Object.values(art).every(i=>i.complete));
 const layout=await page.evaluate(()=>{const bounds=s=>{let r=document.querySelector(s).getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom}};return {screen:bounds('.screen'),canvas:bounds('canvas'),controls:bounds('.controls'),map:bounds('.map-picker'),hud:bounds('.hud'),ratio:canvas.width/canvas.height,overflow:document.documentElement.scrollWidth>innerWidth}});
 assert(!layout.overflow,`overflow ${width}`);assert(layout.screen.h>100);assert(layout.controls.bottom<=height);assert(layout.canvas.right<=layout.screen.right+1);assert(layout.canvas.bottom<=layout.screen.bottom+1);assert(Math.abs(layout.canvas.w-layout.screen.w)<2);assert(Math.abs(layout.canvas.h-layout.screen.h)<2);
 await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await page.screenshot({path:`cabinet-${width}x${height}.png`});
 await page.locator('#start').click();assert.equal(await page.evaluate(()=>mode),'playing');
 await page.locator('#pause').click();assert.equal(await page.evaluate(()=>mode),'paused');
 await page.locator('#start').click();assert.equal(await page.evaluate(()=>mode),'playing');
 await page.locator('#restart').click();assert.equal(await page.evaluate(()=>mode),'playing');
 const music=await page.locator('#music').getAttribute('aria-pressed');await page.locator('#music').click();assert.notEqual(await page.locator('#music').getAttribute('aria-pressed'),music);
 for(const map of ['classic','neighborhood','scifi','fantasy']){await page.locator('#map-select').selectOption(map);assert.equal(await page.evaluate(()=>activeTheme.id),map);assert.equal(await page.evaluate(()=>mode),'ready');}
 await page.locator('.ghost-guide summary').click();assert(await page.locator('.ghost-guide').getAttribute('open')!==null);await page.locator('.ghost-guide summary').click();
 await page.locator('#start').click();await page.evaluate(()=>{weapon=6;ui()});await page.locator('#fire').hover();await page.mouse.down();assert(await page.evaluate(()=>fireHeld));await page.mouse.up();assert.equal(await page.evaluate(()=>fireHeld),false);
 if(width<=700){await page.locator('[data-dir=right]').click();assert.equal(await page.evaluate(()=>player.next),'right');}
 console.log('PASS layout and controls',width,height,JSON.stringify(layout));
}

await page.setViewportSize({width:841,height:843});await page.goto('http://127.0.0.1:4393/pac-nut/');
await page.locator('#fullscreen').hover();assert(await page.locator('#fullscreen-hint').isHidden());await page.reload();assert(await page.locator('#fullscreen-hint').isHidden());
await page.locator('#start').click();await page.evaluate(()=>{score=1234;mode='over';show()});
await page.locator('#initials').fill('abc');await page.locator('#initials').press('Enter');assert.equal(await page.evaluate(()=>mode),'over');assert.equal(await page.locator('#score-rows tr').count(),1);
await page.locator('#initials-form button').isDisabled().then(x=>assert(x));await page.screenshot({path:'arcade-scoreboard.png'});
await page.locator('#start').click();await page.evaluate(()=>{score=4321;mode='over';show()});assert.equal(await page.locator('#initials').inputValue(),'ABC');await page.locator('#start').click();
await page.reload();assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('pacnut-leaderboard-v1')).length),2);assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('pacnut-leaderboard-v1'))[0].score),4321);
await page.locator('#start').click();await page.evaluate(()=>{score=42;mode='over';show()});await page.locator('#initials').fill('A');await page.locator('#start').click();assert.equal(await page.evaluate(()=>mode),'over');
await page.locator('#initials').fill('XYZ');await page.locator('#start').click();assert.equal(await page.evaluate(()=>mode),'playing');
await page.screenshot({path:'arcade-gameplay.png'});console.log('PASS leaderboard persistence, initials, duplicate prevention, keyboard input, hint persistence');
assert.equal(await page.locator('#game').evaluate(e=>getComputedStyle(e).objectFit),'fill');const notice=await page.locator('aside').boundingBox();assert(notice.x<15);assert(notice.y>700);assert.deepEqual(errors,[]);await browser.close();})().catch(e=>{console.error(e);process.exit(1)});




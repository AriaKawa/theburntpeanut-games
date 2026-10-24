const {chromium}=require('C:/Users/Swagg/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');const assert=require('assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,channel:'msedge'});const a=await browser.newContext(),b=await browser.newContext(),page=await a.newPage(),other=await b.newPage(),writes=new Set(),errors=[];let fail=false;
page.on('pageerror',e=>errors.push(e.message));other.on('pageerror',e=>errors.push(e.message));
await page.route('**/pacnutLeaderboardV1/*.json?auth=*',async route=>{if(route.request().method()==='PUT'){if(fail)return route.fulfill({status:503,body:'offline'});writes.add(route.request().url())}await route.continue()});
const url='http://127.0.0.1:4393/pac-nut/';
try{
await page.goto(url);await other.goto(url);await page.locator('#fullscreen').hover();
for(const [i,map]of ['classic','neighborhood','scifi','fantasy'].entries()){
 await page.locator('#map-select').selectOption(map);await page.locator('#start').click();await page.evaluate(n=>{score=n;mode='over';show()},10+i);
 if(i===0)await page.locator('#initials').fill('TST');else assert.equal(await page.locator('#initials').inputValue(),'TST');
 if(i===1){fail=true;await page.locator('#initials-form button').click();await page.waitForFunction(()=>document.getElementById('save-status').textContent.includes('Not saved online'));assert.equal(await page.evaluate(()=>mode),'over');fail=false;}
 await page.locator('#initials-form button').click();await page.waitForFunction(()=>document.getElementById('save-status').textContent.includes('SAVED ONLINE'),{timeout:20000});
 await other.locator('#map-select').selectOption(map);await other.locator('#board-open').click();await other.waitForFunction(()=>document.getElementById('board-status').textContent.startsWith('Shared scores'));const text=await other.locator('#board-list').innerText();assert(text.includes('TST'));assert(text.includes(String(10+i)));for(let j=0;j<i;j++)assert(!text.split('\n').includes(String(10+j)));await other.locator('#board-close').click();
 console.log('PASS shared cross-browser score and isolated map',map);
 await page.locator('#start').click();await page.waitForFunction(()=>mode==='playing');
}
assert.equal(writes.size,4,'one record per run including retry');await page.reload();await page.locator('#start').click();await page.evaluate(()=>{score=0;mode='over';show()});assert.equal(await page.locator('#initials').inputValue(),'TST');await page.locator('#start').click();await page.waitForFunction(()=>mode==='playing');assert.equal(writes.size,4,'zero scores do not write');
assert.deepEqual(errors,[]);console.log('PASS remembered initials, zero-score restart, network failure/retry and duplicate prevention');
}finally{for(const url of writes){const result=await fetch(url,{method:'DELETE'});assert(result.ok,'test score cleanup failed')}console.log('Removed all temporary browser test scores');await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});

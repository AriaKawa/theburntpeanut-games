const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const {chromium} = require('C:/Users/Swagg/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const server = http.createServer((req, res) => {
  let file = path.join(process.cwd(), decodeURIComponent(req.url.split('?')[0]));
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  try {
    res.setHeader('Content-Type', ({'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.png':'image/png','.webp':'image/webp'})[path.extname(file)] || 'application/octet-stream');
    res.end(fs.readFileSync(file));
  } catch { res.statusCode = 404; res.end(); }
}).listen(5198, '127.0.0.1');
const selectors = ['#game-back','#fullscreen','#sound','#play','#multiplayer','.character.selected','.character:not(.selected)'];
async function inspect(page) {
  return page.evaluate(selectors => selectors.map(selector => {
    const el = document.querySelector(selector), s = getComputedStyle(el), r = el.getBoundingClientRect();
    return {selector, width:r.width, height:r.height, paint:[s.color,s.backgroundColor,s.backgroundImage,s.borderColor,s.opacity,s.filter]};
  }), selectors);
}
async function backdrop(page) {
  // Exclude cabinet shadows and controls that can legitimately cross this pixel.
  await page.locator('body').evaluate(e=>e.style.visibility='hidden');
  const png = (await page.screenshot()).toString('base64');
  await page.locator('body').evaluate(e=>e.style.removeProperty('visibility'));
  return page.evaluate(async png => {
    const img = new Image(); img.src = 'data:image/png;base64,' + png; await img.decode();
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const ctx = c.getContext('2d'); ctx.drawImage(img,0,0);
    return [...ctx.getImageData(2,2,1,1).data];
  }, png);
}
(async () => {
  try {
    for (const autoDark of [false,true]) {
      const browser = await chromium.launch({channel:'msedge',headless:true,args:autoDark?['--enable-features=WebContentsForceDark']:[]});
      try {
        for (const [width,height] of [[1846,892],[390,844]]) {
          const page = await browser.newPage({viewport:{width,height}}), errors=[];
          page.on('pageerror', e => errors.push(e.message));
          await page.goto('http://127.0.0.1:5198/bungerman/');
          await page.waitForFunction(() => !document.querySelector('#play').disabled);
          await page.mouse.move(width/2,0);
          assert.equal(await page.locator('meta[name="darkreader-lock"]').count(),1);
          assert.equal(await page.locator('html').evaluate(e=>getComputedStyle(e).colorScheme),'light only');
          for (const fullscreen of [false,true]) {
            if(fullscreen) {await page.locator('#fullscreen').click();await page.mouse.move(width/2,0);}
            const before = await inspect(page), background = await backdrop(page);
            let current=1;
            for(const target of [.6,1.4,1]) {
              while(Math.abs(current-target)>.001) {
                const direction=target>current?1:-1;
                await page.mouse.wheel(0,-direction*100);
                current=Math.round((current+direction*.05)*100)/100;
                await page.waitForFunction(z=>Number(document.body.style.getPropertyValue('--page-zoom'))===z,current);
              }
              const after=await inspect(page);
              after.forEach((item,i)=>{
                assert.deepEqual(item.paint,before[i].paint,`${item.selector} palette at ${target}`);
                assert(Math.abs(item.width/before[i].width-target)<.005,`${item.selector} width at ${target}`);
                assert(Math.abs(item.height/before[i].height-target)<.005,`${item.selector} height at ${target}`);
              });
              assert.deepEqual(await backdrop(page),background,'Viewport background must not shrink or change');
            }
          }
          assert.deepEqual(errors,[]); console.log({width,height,autoDark,paletteAndScale:'passed'});
          await page.close();
        }
      } finally {await browser.close();}
    }
  } finally {server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});




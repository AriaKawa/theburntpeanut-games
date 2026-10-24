const fs=require('fs'),vm=require('vm');const harness=fs.readFileSync('tests/pacnut-twins.cjs','utf8').split('\n')[0];
vm.runInNewContext(harness+`vm.runInContext(\`
assert.equal(W,28);assert.equal(H,31);assert(MAP.every(r=>r.length===28));assert.equal(BASES.length,1);assert.equal(ghosts.length,10);assert.equal(player.x,13);assert.equal(player.y,23);assert.equal(dots.size,244);assert.equal([...dots.values()].filter(v=>v==='power').length,4);
let q=[[13,23]],seen=new Set(['13,23']);while(q.length){const[x,y]=q.shift();for(const v of Object.values(dirs)){let nx=wrap(x+v.x),ny=y+v.y,k=nx+','+ny;if(!wall(x+v.x,ny)&&!seen.has(k)){seen.add(k);q.push([nx,ny])}}}for(const k of dots.keys())assert(seen.has(k),'unreachable '+k);
for(let i=0;i<10;i++){positions();let g=ghosts[i];assert(!wall(g.x,g.y,g));Object.assign(g,actor(6,5,'right'),{state:'eyes',capturedPower:1});powerId=1;for(let n=0;n<10000&&g.state!=='active';n++)move(g,1/120);assert.equal(g.state,'active','revive '+i);assert.equal(g.revivedPower,1);}
positions();phase=0;for(const g of ghosts){const t=target(g);assert(t.x>=0&&t.x<W&&t.y>=0&&t.y<H)}mode='playing';readyTimer=0;for(let n=0;n<1200;n++)update(1/120);draw();console.log('PASS classic dimensions, 244 reachable pickups, four AKs, ten ghosts, return paths and gameplay');
\`,sandbox);`,{require,console});

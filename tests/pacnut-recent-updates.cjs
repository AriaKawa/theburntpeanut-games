const fs=require('fs'),vm=require('vm'),assert=require('assert');
const harness=fs.readFileSync('tests/pacnut-twins.cjs','utf8').split('\n')[0];
vm.runInNewContext(harness+`vm.runInContext(\`
assert.equal(lives,1);start();readyTimer=0;assert.equal(lives,1);weapon=0;const base=speed(player);weapon=6;assert(Math.abs(speed(player)/base-1.1)<1e-10);addScore(10000);assert.equal(lives,1);
const calls=[];sprite=(...a)=>calls.push(a);for(const [id,n]of [[0,0],[2,1],[1,2],[3,3]]){coloredGhost({id},{x:0,y:0});assert.equal(calls.pop()[0],'character-ghost'+n)}
for(const dir of ['up','right','down','left'])for(const f of [0,1]){player.dir=dir;player.progress=.5;roundTime=f/9+.001;peanutWalk(0,0);assert.equal(calls.pop()[0],'peanut-'+dir+'-'+f)}draw();assert(calls.some(a=>a[0]==='burger'));assert(!calls.some(a=>a[0]==='can'));console.log('PASS one life, AK speed, custom ghosts, burger pickups, all eight peanut frames');
\`,sandbox);`,{require,console});
for(const file of ['engine.js','song.js','index.html'])assert(fs.readFileSync('pac-nut/'+file).equals(fs.readFileSync('docs/pac-nut/'+file)));
const song=fs.readFileSync('pac-nut/song.js','utf8');assert(song.includes('track.preservesPitch = false'));assert(song.includes('event.detail.armed?1.1:1'));assert(song.includes('track.volume = .225'));const html=fs.readFileSync('pac-nut/index.html','utf8');assert(html.includes('assets/p1.png'));assert(html.includes('leaderboard.js'));assert(html.indexOf('class="hud"')>html.indexOf('id="game"'));assert(fs.readFileSync('pac-nut/engine.js','utf8').includes("'pacnut:overlay'"));console.log('PASS production mirror, pitch, half volume, P1, leaderboard and below-screen score layout');

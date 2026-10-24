const fs=require('fs'),vm=require('vm');
const harness=fs.readFileSync('tests/pacnut-twins.cjs','utf8').split('\n')[0];
vm.runInNewContext(harness+`vm.runInContext(\`
assert.equal(ghosts.length,5);assert.equal(new Set(ghosts.map(g=>g.role)).size,5);
phase=1;Object.assign(player,actor(13,23,'right'));const g=ghosts[4];g.state='active';
roundTime=2;assert.equal(target(g).x,10);const slow=speed(g);
roundTime=4;assert.equal(target(g).x,10);assert.equal(speed(g),slow);
roundTime=4.5;assert.equal(target(g).x,19);assert(speed(g)>slow);
roundTime=6;assert.equal(target(g).x,10);assert.equal(speed(g),slow);
phase=0;assert.equal(target(g).x,6);const scatter=speed(g);roundTime=4.8;assert.equal(speed(g),scatter);
phase=1;g.frightened=true;const frightened=speed(g);roundTime=2;assert.equal(speed(g),frightened);
g.frightened=false;g.state='eyes';const eyes=speed(g);roundTime=4.8;assert.equal(speed(g),eyes);
g.state='exiting';const exiting=speed(g);roundTime=2;assert.equal(speed(g),exiting);
assert(art['character-ghost4'].src.endsWith('character-ghost4.png'));
console.log('PASS five roles, beat targeting, rush, reset, scatter and vulnerable-state speeds');
\`,sandbox);`,{require,console});

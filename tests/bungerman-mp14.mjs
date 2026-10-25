import assert from 'node:assert/strict';
import {Game,CAST,DIRS} from '../bungerman/engine.js';
import {MultiplayerMatch,hydrateMatch} from '../bungerman/match.js';
const open=g=>{g.grid=g.grid.map((row,y)=>row.map((_,x)=>x===0||y===0||x===12||y===10?1:0));g.start();for(const e of [g.player,...g.bots])e.inv=0;return g;};
for(const character of Object.keys(CAST)){
 const g=open(new Game(character,1));assert.equal(g.player.capacity,2);
 assert.equal(g.player.rangeUp,0);
 assert.equal(g.player.shield,0);
 assert.equal(g.player.canKick,false);
 assert.equal(g.speedFor(g.player),5.4);
 for(const actor of [g.player,...g.bots]){
  assert.equal(g.bombRange(actor),2);assert.equal(actor.shield,0);assert.equal(actor.canKick,false);assert.equal(g.speedFor(actor),5.4);
 }
 for(const type of ['capacity','shield']){g.pickups.push({x:1,y:1,type});g.update(.01);}
 assert.equal(g.player.capacity,3);assert.equal(g.player.shield,1);
 g.hit(g.player,'blast',g.bots[0]);assert(g.player.alive);assert.equal(g.player.shield,0);
 g.player.inv=0;g.hit(g.player,'blast',g.bots[0]);assert(!g.player.alive);assert.equal(g.deathInfo.killer,g.bots[0].character);
}
{
 const g=open(new Game('tpain',2)),p=g.player;g.bombs.push({x:2,y:1,owner:g.bots[0],range:2,fuse:2});
 assert(!g.move(p,1,0));assert.equal(g.bombs[0].x,2);assert.equal(p.x,1);
 assert.equal(g.bombs[0].fuse,2);assert.equal(g.bombs[0].owner,g.bots[0]);
 p.cooldown=0;g.grid[1][4]=1;assert(!g.move(p,1,0));assert.equal(g.bombs[0].x,2);
}
{
 const g=open(new Game('peanut',12));for(let i=0;i<8;i++){g.pickups.push({x:g.player.x,y:g.player.y,type:'capacity'});g.update(.01);}assert.equal(g.player.capacity,4);
 for(let i=1;i<=4;i++){g.player.x=i;assert(g.plantBomb());}g.player.x=5;assert(!g.plantBomb());
 const mp=new MultiplayerMatch({players:[{id:'host',slot:0,character:'peanut'},{id:'guest',slot:1,character:'tpain'}]});open(mp);const guest=mp.actors[1];guest.x=2;guest.y=1;mp.bombs.push({x:3,y:1,owner:mp.player,range:2,fuse:.1});assert(!mp.move(guest,1,0));assert.equal(mp.bombs[0].x,3);
}
{
 const g=open(new Game('hutch',3));g.hit(g.player,'wall',null);assert(!g.player.alive);
 const h=open(new Game('peanut',4));h.hit(h.bots[0],'blast',h.bots[1]);assert.equal(h.score,0);h.hit(h.bots[1],'blast',h.player);assert.equal(h.score,350);
 h.round=3;h.setup();assert.equal(h.bots.length,4);
}
{
 const g=new MultiplayerMatch({players:[{id:'host',slot:0,character:'peanut'},{id:'guest',slot:1,character:'hutch'}]});g.start();
 assert.equal(g.actors[1].shield,0);assert.equal(g.actors[1].rangeUp,0);
 g.setInput(1,{slot:0,x:9,hp:99,character:'ninja',dx:5,dy:5,bombSeq:1});assert.equal(g.actors[1].hp,1);assert.equal(g.inputs.get(1).dx,1);assert.equal(g.inputs.get(1).dy,0);
 g.actors[1].inv=0;g.hit(g.actors[1],'blast',g.player,'rpg');assert(!g.actors[1].alive);
 const view=hydrateMatch(g.snapshot(),1);assert(view.spectating);assert.equal(view.deathInfo.kind,'rpg');assert.equal(view.deathInfo.killer,'peanut');
}
// Balanced spawn rotation: identical AI policy for all four actors, 3 maps, 40 seeds.
const wins=Object.fromEntries(Object.keys(CAST).map(k=>[k,0]));let draws=0;
for(let seed=1;seed<=40;seed++)for(let rotation=0;rotation<4;rotation++){
 const chars=Object.keys(CAST),g=new MultiplayerMatch({players:chars.map((_,slot)=>({id:'bot'+slot,slot,character:chars[(slot+rotation)%4]})),seed,mapId:['garden','foundry','neon'][seed%3]});
 for(const e of g.actors)Object.assign(e,{personality:0,think:2,decision:.2,goal:null,goalUntil:0,previous:null});
 g.think=function(e,dt){Game.prototype.think.call(this,e,dt);};g.start();
 for(let frame=0;frame<1800&&g.status==='playing';frame++){g.think(g.player,.05);Game.prototype.update.call(g,.05,{});const alive=g.actors.filter(e=>e.alive);if(alive.length<=1||g.time<=0){if(alive.length===1)wins[alive[0].character]++;else draws++;break;}g.status='playing';g.events=[];}
}
console.log(JSON.stringify({checks:'passed',matches:160,wins,draws},null,2));

import {Game,CAST} from './engine.js?v=mp12';

// The room transport binds authenticated member IDs to slots. It must never accept
// a slot, position, health or character supplied by an input packet as authority.
// Send held direction at least 10 Hz; action counters only increase on a press.
export class MultiplayerMatch extends Game {
 constructor({players,seed=9187,mapId='garden'}){
  if(!Array.isArray(players)||players.length<2||players.length>4)throw new Error('A match needs 2–4 players.');
  const sorted=[...players].sort((a,b)=>a.slot-b.slot);
  if(sorted.some(p=>!Number.isInteger(p.slot)||p.slot<0||p.slot>3||!CAST[p.character]||typeof p.id!=='string'||!p.id)||new Set(sorted.map(p=>p.slot)).size!==sorted.length||new Set(sorted.map(p=>p.id)).size!==sorted.length)throw new Error('Invalid match roster.');
  super(sorted[0].character,seed,mapId);
  const spawns=[[1,1],[11,9],[11,1],[1,9]],template={...this.player};
  this.actors=sorted.map(p=>{const [x,y]=spawns[p.slot];return {...template,x,y,rx:x,ry:y,id:p.id,slot:p.slot,character:p.character,hp:1,inv:1.2,cooldown:0};});
  this.player=this.actors[0];this.bots=this.actors.slice(1);this.inputs=new Map();this.history=[];this.eventSeq=0;this.tick=0;this.winnerSlot=null;this.multiplayer=true;
 }
 emit(type,data={}){if(['lost','won','roundWon'].includes(type))return;const event={type,...data,seq:++this.eventSeq};this.events.push(event);this.history?.push(event);if(this.history?.length>160)this.history.splice(0,this.history.length-160);}
 setInput(slot,packet={}){
  if(!this.actors.some(p=>p.slot===slot)||this.status!=='playing'||!packet||typeof packet!=='object')return false;
  const old=this.inputs.get(slot)??{bombSeq:0,rpgSeq:0,bombPending:false,rpgPending:false};
  const dx=Number.isFinite(packet.dx)?Math.sign(packet.dx):0,dy=dx?0:Number.isFinite(packet.dy)?Math.sign(packet.dy):0;
  const next={...old,dx,dy,received:this.elapsed};
  for(const kind of ['bomb','rpg']){const seq=packet[`${kind}Seq`];if(Number.isSafeInteger(seq)&&seq>old[`${kind}Seq`]){next[`${kind}Seq`]=seq;next[`${kind}Pending`]=true;}}
  this.inputs.set(slot,next);return true;
 }
 direction(entity){const input=this.inputs.get(entity.slot);return input&&this.elapsed-input.received<=.45?input:{};}
 think(entity){const input=this.direction(entity);if(input.dx||input.dy)this.move(entity,input.dx||0,input.dy||0);}
 hit(entity,reason,owner){
  if(!entity.alive||entity.inv>0)return;
  entity.hp=0;entity.alive=false;entity.inv=0;
  this.emit('hit',{x:entity.x,y:entity.y,slot:entity.slot,player:entity===this.player,reason});
  this.emit('death',{x:entity.x,y:entity.y,slot:entity.slot,character:entity.character,player:entity===this.player});
  if(owner&&owner!==entity&&!owner.environment)owner.kills=(owner.kills??0)+1;
 }
 fireRpg(owner=this.player){const fired=super.fireRpg(owner);if(fired)this.rockets.at(-1).id=++this.serial;return fired;}
 update(dt){
  if(this.status!=='playing'||!Number.isFinite(dt)||dt<=0)return;
  for(const actor of this.actors){const input=this.inputs.get(actor.slot);if(!input)continue;if(input.bombPending){this.plantBomb(actor);input.bombPending=false;}if(input.rpgPending){this.fireRpg(actor);input.rpgPending=false;}}
  super.update(dt,this.direction(this.player));this.tick++;
  const survivors=this.actors.filter(e=>e.alive);
  if(survivors.length<=1||this.time<=0){this.status='finished';this.winnerSlot=survivors.length===1?survivors[0].slot:null;this.emit('matchEnd',{winnerSlot:this.winnerSlot,draw:this.winnerSlot===null});}
  else this.status='playing';
 }
 snapshot(){
  const data={version:1,tick:this.tick,multiplayer:true,actors:this.actors,events:this.history,eventSeq:this.eventSeq,winnerSlot:this.winnerSlot};
  for(const k of ['grid','safeZones','bombs','rockets','wallWarnings','closedRing','nextWallAt','lootCount','rain','rainClock','overtime','flames','pickups','time','elapsed','damageReason','status','mapId','round','score','serial'])data[k]=this[k];
  return JSON.parse(JSON.stringify(data,(key,value)=>['owner','entity'].includes(key)&&value?value.environment?{environment:true}:{actorSlot:value.slot}:value));
 }
}

// Render-only replica: reuses actor identities for animation WeakMaps, resolves
// owner pointers, and converts host-relative events/status to the local player.
// Calling update only smooths drawing coordinates; it never runs the simulation.
export function hydrateMatch(snapshot,localSlot,previous=null){
 if(snapshot?.version!==1||!Array.isArray(snapshot.actors)||!snapshot.actors.some(a=>a.slot===localSlot))throw new Error('Invalid match snapshot.');
 if(previous&&snapshot.tick<previous.networkTick)return previous;
 const view=previous??Object.create(Game.prototype),existing=new Map((previous?[previous.player,...previous.bots]:[]).map(a=>[a.slot,a]));
 const actors=snapshot.actors.map(raw=>{const actor=existing.get(raw.slot)??{},rx=actor.rx,ry=actor.ry;Object.assign(actor,raw);if(rx!==undefined){actor.rx=rx;actor.ry=ry;}return actor;});
 const bySlot=new Map(actors.map(a=>[a.slot,a]));
 function revive(value){if(!value||typeof value!=='object')return value;if('actorSlot'in value)return bySlot.get(value.actorSlot)??null;if(Array.isArray(value))return value.map(revive);return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,revive(v)]));}
 for(const [key,value]of Object.entries(snapshot))if(!['actors','events','status'].includes(key))view[key]=revive(value);
 view.player=bySlot.get(localSlot);view.bots=actors.filter(a=>a!==view.player);view.character=view.player.character;view.rainOwner={environment:true};view.networkTick=snapshot.tick;
 const after=previous?.lastEventSeq??0;
 const fresh=(snapshot.events??[]).filter(e=>e.seq>after).map(e=>{const event=revive(e);if(Number.isInteger(event.slot))event.player=event.slot===localSlot;if(event.type==='pickup')event.player=event.owner===view.player;if(event.type==='matchEnd')event.type=event.winnerSlot===localSlot?'won':'lost';return event;});
 view.events=[...(previous?.events??[]),...fresh];view.lastEventSeq=snapshot.eventSeq??0;
 view.status=snapshot.status==='finished'?(snapshot.winnerSlot===localSlot?'won':'lost'):snapshot.status;
 view.isDraw=snapshot.status==='finished'&&snapshot.winnerSlot===null;view.spectating=!view.player.alive&&view.status==='playing';
 view.update=function(dt){for(const actor of [this.player,...this.bots]){const distance=Math.hypot(actor.x-actor.rx,actor.y-actor.ry),step=Math.min(distance,this.speedFor(actor)*Math.max(0,Math.min(dt,.05)));if(distance){actor.rx+=(actor.x-actor.rx)/distance*step;actor.ry+=(actor.y-actor.ry)/distance*step;}}};
 view.plantBomb=()=>false;view.fireRpg=()=>false;view.next=()=>{};
 return view;
}

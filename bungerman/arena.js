/** Original arcade arena artwork. Coordinates stay aligned with the collision grid. */
const T=30, OX=13, OY=11, W=416, H=352, TAU=Math.PI*2;
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
function rect(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(x,y,w,h);}
function oval(c,x,y,rx,ry,color){c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.fill();}
function gradient(c,x,y,h,colors){const g=c.createLinearGradient(x,y,x,y+h);colors.forEach((v,i)=>g.addColorStop(i/(colors.length-1),v));return g;}
function polygon(c,points,color){c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();}
function metal(c,x,y,edge=false,theme='garden'){
 if(theme==='foundry'){
  rect(c,x+1,y+2,29,28,'#17191c');rect(c,x,y,29,28,gradient(c,x,y,28,['#e0a464','#a3663b','#503f34']));
  polygon(c,[[x,y],[x+29,y],[x+25,y+4],[x+4,y+4]],'#f6c28c');
  polygon(c,[[x+29,y],[x+25,y+4],[x+25,y+24],[x+29,y+28]],'#533c30');
  rect(c,x+4,y+4,21,20,'#31333b');rect(c,x+6,y+6,17,16,gradient(c,x,y,24,['#68676a','#353944']));
  for(let i=0;i<3;i++){rect(c,x+8,y+8+i*4,13,2,'#20272f');rect(c,x+8,y+10+i*4,13,1,'#8d8580');}
  for(const dx of [2,26])for(const dy of [3,24]){oval(c,x+dx,y+dy,1.2,1.2,'#342d29');rect(c,x+dx-.5,y+dy-1,1,1,'#ffe0b0');}
  rect(c,x+7,y+25,15,2,edge?'#bc7935':'#efb453');return;
 }
 if(theme==='neon'){
  rect(c,x+1,y+2,29,28,'#101221');
  polygon(c,[[x+4,y],[x+25,y],[x+29,y+4],[x+29,y+24],[x+25,y+28],[x+4,y+28],[x,y+24],[x,y+4]],'#45778e');
  polygon(c,[[x+4,y],[x+25,y],[x+29,y+4],[x+25,y+5],[x+4,y+5],[x,y+4]],'#a0e4e6');
  rect(c,x+4,y+5,21,19,gradient(c,x,y+5,19,['#476784','#25394f']));
  polygon(c,[[x+14,y+7],[x+22,y+14],[x+14,y+21],[x+7,y+14]],'#182939');
  polygon(c,[[x+14,y+9],[x+19,y+14],[x+14,y+19],[x+10,y+14]],'#335e72');
  rect(c,x+6,y+3,17,1,'#d4ffff');rect(c,x+4,y+24,21,2,'#5cc6d1');
  rect(c,x+1,y+7,1,14,'#72d1d7');rect(c,x+27,y+7,1,14,'#193545');return;
 }
 rect(c,x,y,30,30,'#123b31');rect(c,x+2,y+3,28,27,'#063c2bb3');
 rect(c,x+1,y,28,28,'#354d51');
 polygon(c,[[x+1,y],[x+29,y],[x+25,y+4],[x+5,y+4]],'#d2e2df');
 polygon(c,[[x+1,y],[x+5,y+4],[x+5,y+24],[x+1,y+28]],'#a4b7b8');
 polygon(c,[[x+29,y],[x+25,y+4],[x+25,y+24],[x+29,y+28]],'#556c71');
 polygon(c,[[x+1,y+28],[x+5,y+24],[x+25,y+24],[x+29,y+28]],'#789297');
 rect(c,x+5,y+4,20,20,gradient(c,x,y,24,['#526c71','#97adaf']));
 rect(c,x+7,y+6,16,16,gradient(c,x,y+6,16,['#172e38','#526e76']));
 polygon(c,[[x+7,y+6],[x+23,y+6],[x+19,y+10],[x+11,y+10],[x+11,y+18],[x+7,y+22]],'#30454d');
 rect(c,x+7,y+22,17,1,'#c1d0c6');rect(c,x+2,y+1,26,1,'#ecf6dd');
 if(edge){rect(c,x+10,y+10,10,7,'#18353b');rect(c,x+11,y+11,8,2,'#506970');}
}
function floor(c,x,y,gx,gy,theme){
 if(theme==='foundry'){
  rect(c,x,y,T,T,'#30272a');rect(c,x+1,y+1,28,28,gradient(c,x,y,30,['#655047','#3e383b']));
  if((gx+gy)%3===0){
   rect(c,x+4,y+4,22,22,'#272b32');
   for(let i=0;i<5;i++){rect(c,x+5,y+5+i*4,20,1,'#78716b');rect(c,x+5,y+6+i*4,20,2,'#191f28');}
   rect(c,x+3,y+3,24,1,'#9d7960');rect(c,x+3,y+4,1,23,'#8b6954');
  }else{
   for(let i=0;i<3;i++)for(let j=0;j<3;j++){const xx=x+6+i*8,yy=y+6+j*8;polygon(c,[[xx-2,yy],[xx,yy-2],[xx+2,yy],[xx,yy+2]],'#83705c');rect(c,xx-1,yy+2,2,1,'#252932');}
  }
  rect(c,x+2,y+2,26,1,'#997253');rect(c,x+27,y+3,1,25,'#272831');
  for(const dx of [3,26])for(const dy of [3,26])rect(c,x+dx,y+dy,1,1,'#c2a17b');
  return;
 }
 if(theme==='neon'){
  rect(c,x,y,T,T,'#18172d');rect(c,x+1,y+1,28,28,gradient(c,x,y,30,[(gx+gy)%2?'#30284c':'#362b50','#24223d']));
  rect(c,x+3,y+3,24,1,'#51466c');rect(c,x+3,y+4,1,23,'#41375d');rect(c,x+4,y+27,24,1,'#15192f');
  // Recessed circuit paths and junction pads give this arena a distinct material.
  c.strokeStyle=(gx+gy)%3?'#514275':'#477584';c.lineWidth=1;c.beginPath();
  if(gx%2){c.moveTo(x+15,y+2);c.lineTo(x+15,y+10);c.lineTo(x+22,y+17);c.lineTo(x+22,y+28);}
  else{c.moveTo(x+2,y+20);c.lineTo(x+10,y+20);c.lineTo(x+17,y+13);c.lineTo(x+28,y+13);}c.stroke();
  rect(c,x+13,y+13,4,4,'#65588a');rect(c,x+14,y+14,2,2,'#2a273f');
  if((gx+gy)%4===0){rect(c,x+5,y+5,5,1,'#a989bf');rect(c,x+5,y+6,1,3,'#a989bf');}
  return;
 }
 rect(c,x,y,T,T,'#08602c');
 rect(c,x+1,y+1,T-2,T-2,gradient(c,x,y,T,[(gx+gy)%2?'#139d43':'#12973e','#087a32']));
 rect(c,x+3,y+3,24,1,'#29b256');rect(c,x+3,y+4,1,22,'#1ca647');
 rect(c,x+5,y+5,21,1,'#0f8838');rect(c,x+26,y+4,1,23,'#075d2b');rect(c,x+4,y+26,22,1,'#07622b');
}
function brick(c,x,y,seed){
 rect(c,x+1,y+2,30,28,'#092d23aa');rect(c,x,y,29,28,'#442a22');
 for(let row=0;row<3;row++){
  const widths=row%2?[7,15,7]:[14,15];let bx=x;
  for(let j=0;j<widths.length;j++){
   const width=widths[j], yy=y+row*9;
   rect(c,bx+1,yy+1,width-1,8,gradient(c,bx,yy,9,[(seed+j+row)%3?'#c68d57':'#b67a47','#815034','#613a2a']));
   rect(c,bx+1,yy+1,width-2,1,'#e0aa75');rect(c,bx+1,yy+2,1,5,'#b48150');
   rect(c,bx+width-1,yy+3,1,5,'#472b22');rect(c,bx+2,yy+7,width-3,1,'#563223');
   bx+=width;
  }
 }
 rect(c,x,y+27,29,2,'#352921');
}
function reinforcedCrate(c,x,y,damaged=false){
 // Deep timber, two broad bolted straps, and a separate bevel read as two-hit cover.
 rect(c,x+2,y+3,28,27,'#082b22aa');rect(c,x,y,29,29,'#302922');
 rect(c,x+1,y+1,27,26,gradient(c,x,y,27,damaged?['#a87c4b','#6e4b30','#4b3226']:['#dbab67','#9f703d','#674527']));
 for(let row=0;row<3;row++){
  const yy=y+2+row*8;rect(c,x+2,yy,25,1,damaged?'#b49363':'#e4bb7b');
  rect(c,x+2,yy+7,25,1,'#4b3324');rect(c,x+4+(row%2)*5,yy+3,12,1,'#72502b70');
 }
 rect(c,x+1,y+1,1,25,'#edc58a');rect(c,x+27,y+2,1,25,'#473b2f');
 for(const dx of [5,20]){
  rect(c,x+dx,y,5,28,'#273b43');
  rect(c,x+dx+1,y+1,3,26,gradient(c,x,y,28,damaged?['#8b9690','#526363','#35434c']:['#c4d0bc','#819991','#3b5760']));
  rect(c,x+dx,y+1,1,26,'#cad4bc');rect(c,x+dx+4,y+2,1,26,'#1c343f');
  for(const dy of [4,23]){oval(c,x+dx+2.5,y+dy,1.7,1.7,'#243b43');rect(c,x+dx+2,y+dy-1,1,1,'#edf0c9');}
 }
 rect(c,x+11,y+11,7,7,'#493b29');rect(c,x+12,y+12,5,5,damaged?'#70604c':'#bbaa68');
 if(damaged){
  // Broken right band exposes a dark gouge; bright split edges distinguish damage at game size.
  polygon(c,[[x+18,y+8],[x+25,y+10],[x+23,y+13],[x+26,y+15],[x+20,y+18],[x+17,y+16],[x+20,y+13]],'#392b25');
  polygon(c,[[x+20,y+8],[x+25,y+10],[x+23,y+12],[x+20,y+11]],'#acb8a5');
  c.strokeStyle='#39271e';c.lineWidth=2;c.beginPath();c.moveTo(x+11,y+2);c.lineTo(x+14,y+8);c.lineTo(x+11,y+14);c.lineTo(x+16,y+20);c.lineTo(x+14,y+27);c.stroke();
  c.strokeStyle='#deb27a';c.lineWidth=.8;c.beginPath();c.moveTo(x+12,y+3);c.lineTo(x+15,y+8);c.lineTo(x+12,y+14);c.lineTo(x+17,y+20);c.stroke();
  polygon(c,[[x+1,y+20],[x+4,y+23],[x+2,y+27],[x+1,y+27]],'#35281f');
 }
 rect(c,x,y+28,29,1,'#24372f');
}
export function drawArena(ctx,game,{time=0,reduced=false}={}){
 const theme=game.mapId??'garden',foundry=theme==='foundry',neon=theme==='neon';
 ctx.save();rect(ctx,0,0,W,H,'#172c37');
 // Machinery surrounds the playable grid, with a restrained hazard stripe rail.
 rect(ctx,6,4,W-12,H-8,gradient(ctx,0,0,H,foundry?['#ac825f','#3e3635','#88745f']:neon?['#66809c','#242d4c','#486481']:['#a4b5b0','#334d5b','#78908e']));
 for(let y=12;y<H-10;y+=10){for(const x of [6,W-10]){rect(ctx,x,y,4,7,'#d2b338');polygon(ctx,[[x,y+1],[x+4,y+5],[x+4,y+9],[x,y+5]],'#243338');}}
 rect(ctx,OX-2,OY-2,394,334,'#203b41');
 for(let y=0;y<game.grid.length;y++)for(let x=0;x<game.grid[y].length;x++){
  const sx=OX+x*T,sy=OY+y*T;
  floor(ctx,sx,sy,x,y,theme);
  if(game.grid[y][x]===1)metal(ctx,sx,sy,x===0||y===0||x===12||y===10,theme);
  else if(game.grid[y][x]===2)brick(ctx,sx,sy,x*7+y*3);
  else if(game.grid[y][x]>=3)reinforcedCrate(ctx,sx,sy,game.grid[y][x]===4);
 }
 for(let x=28;x<W-22;x+=60){rect(ctx,x,4,12,4,'#183038');rect(ctx,x+1,4,9,2,!reduced&&Math.sin(time*2+x)>.8?'#ffd7a1':neon?'#67d1eb':foundry?'#eda445':'#f05732');}
 ctx.restore();
}
export function drawBomb(ctx,x,y,bomb={}, {time=0,reduced=false}={}){
 const fuse=Math.max(0,bomb.fuse??2),max=bomb.maxFuse??2.45,age=Math.max(0,max-fuse),urgency=clamp(1-fuse/max);
 const pulse=reduced?0:Math.pow((1+Math.sin(time*(8+urgency*22)))/2,3)*(.055+urgency*.12);
 const bounce=reduced?0:Math.sin(clamp(age/.27)*Math.PI)*4;
 const land=reduced?0:Math.sin(clamp(age/.36)*TAU)*Math.exp(-age*10)*.2;
 oval(ctx,x,y+9,10+urgency,3,'#03251db3');
 ctx.save();ctx.translate(x,y+7-bounce);ctx.scale(1+pulse+land,1+pulse-land);ctx.translate(0,-7);
 const g=ctx.createRadialGradient(-4,-5,1,0,0,11);g.addColorStop(0,'#8995a5');g.addColorStop(.23,'#495769');g.addColorStop(.63,'#1b2332');g.addColorStop(1,'#090d19');
 oval(ctx,0,0,10,10,'#08101b');oval(ctx,0,-1,9.3,9.3,g);
 oval(ctx,-3.6,-5,3.1,1.9,'#bacbd585');
 ctx.strokeStyle='#060c18';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(1,-8);ctx.quadraticCurveTo(2,-12,5,-11);ctx.stroke();
 ctx.strokeStyle='#d6a455';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(1,-9);ctx.quadraticCurveTo(2,-14,5,-12);ctx.stroke();
 if(bomb.heat>.4){ctx.strokeStyle='#efaa4866';ctx.lineWidth=1;ctx.beginPath();ctx.arc(0,-1,8.5,.1,2.7);ctx.stroke();}
 const spark=reduced?1:1+Math.sin(time*35)*.35;
 oval(ctx,5,-12,2.8*spark,2.8*spark,'#ff7a2559');oval(ctx,5,-12,1.5,1.5,'#fff3aa');
 if(!reduced)for(let i=0;i<4;i++){const p=(time*3+i*.25)%1,a=i*2.4;ctx.globalAlpha=1-p;rect(ctx,5+Math.cos(a)*p*7,-12+Math.sin(a)*p*6-p*4,1.2,1.2,i%2?'#fffac0':'#ff9d3a');}
 ctx.restore();
}
export function drawFlames(ctx,game,{time=0,reduced=false}={}){
 if(!game.flames.length)return;
 const cells=new Map();for(const f of game.flames){const k=f.x+','+f.y;if(!cells.has(k)||cells.get(k).life<f.life)cells.set(k,f);}
 const has=(x,y)=>cells.has(x+','+y);
 ctx.save();
 // Each arm reaches its neighbour's cell boundary; the full blast is a continuous cross.
 for(const [width,color] of [[12.2,'#e44316'],[10.1,'#ff8222'],[7.4,'#ffd447'],[3.8,'#fff7ba']]){
  for(const f of cells.values()){
   const age=(f.max??.62)-f.life,ignition=reduced?1:clamp(age/.045),fade=clamp(f.life/.15);
   const x=OX+f.x*T+15,y=OY+f.y*T+15;
   const ripple=reduced?0:Math.sin(time*34+f.x*2+f.y*3)*1.05;
   const r=Math.max(.3,(width+ripple)*ignition*(.5+.5*fade));
   ctx.fillStyle=color;ctx.globalAlpha=fade;
   ctx.beginPath();ctx.arc(x,y,r,0,TAU);
   if(has(f.x-1,f.y))ctx.rect(x-15,y-r,15,r*2);
   if(has(f.x+1,f.y))ctx.rect(x,y-r,15,r*2);
   if(has(f.x,f.y-1))ctx.rect(x-r,y-15,r*2,15);
   if(has(f.x,f.y+1))ctx.rect(x-r,y,r*2,15);
   ctx.fill();
   if(!reduced&&width>7){for(let i=0;i<4;i++){const a=i*Math.PI/2+Math.sin(time*19+f.x)*.13,d=r*.67;oval(ctx,x+Math.cos(a)*d,y+Math.sin(a)*d,r*.43,r*.43,color);}}
  }
 }
 if(!reduced)for(const f of cells.values())for(let i=0;i<3;i++){
  const p=(time*2.8+f.x*.17+f.y*.31+i/3)%1;ctx.globalAlpha=clamp(f.life*4)*(1-p);
  rect(ctx,OX+f.x*T+5+((f.x*13+f.y*7+i*11)%20),OY+f.y*T+22-p*20,1.5,2.5,i%2?'#fffac8':'#ffae36');
 }
 ctx.restore();
}
export function drawClosingWalls(ctx,game,{time=0,reduced=false}={}){
 ctx.save();
 for(const warning of game.wallWarnings??[]){
  const x=OX+warning.x*T,y=OY+warning.y*T,p=clamp(1-warning.delay/(warning.maxDelay??1.5));
  // Full-cell hatch and a filling perimeter remain readable even with reduced motion.
  ctx.globalAlpha=.24+p*.22;rect(ctx,x+1,y+1,28,28,'#ff652a');
  ctx.save();ctx.beginPath();ctx.rect(x+1,y+1,28,28);ctx.clip();
  ctx.strokeStyle='#ffe1a5';ctx.lineWidth=2;ctx.globalAlpha=.32+p*.25;
  for(let offset=-30;offset<50;offset+=9){ctx.beginPath();ctx.moveTo(x+offset,y+29);ctx.lineTo(x+offset+29,y);ctx.stroke();}
  ctx.restore();
  ctx.globalAlpha=reduced?1:.8+.2*Math.sin(time*14);ctx.strokeStyle='#ffc75f';ctx.lineWidth=1.8;ctx.strokeRect(x+1.5,y+1.5,27,27);
  ctx.globalAlpha=1;ctx.strokeStyle='#fff1c5';ctx.lineWidth=2.4;
  ctx.beginPath();const perimeter=108*p,points=[[x+1.5,y+1.5],[x+28.5,y+1.5],[x+28.5,y+28.5],[x+1.5,y+28.5],[x+1.5,y+1.5]];
  ctx.moveTo(...points[0]);for(let edge=0;edge<4;edge++){const fraction=clamp((perimeter-edge*27)/27);if(!fraction)break;ctx.lineTo(points[edge][0]+(points[edge+1][0]-points[edge][0])*fraction,points[edge][1]+(points[edge+1][1]-points[edge][1])*fraction);}ctx.stroke();
  // The small chevron points toward the surviving center, not toward the closing boundary.
  const horizontal=Math.abs(warning.x-6)/6>=Math.abs(warning.y-5)/5;
  const angle=horizontal?(warning.x<6?0:Math.PI):(warning.y<5?Math.PI/2:-Math.PI/2);
  ctx.save();ctx.translate(x+15,y+15);ctx.rotate(angle);ctx.strokeStyle='#502a1b';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-3,-5);ctx.lineTo(3,0);ctx.lineTo(-3,5);ctx.stroke();ctx.strokeStyle='#fff2bf';ctx.lineWidth=2;ctx.stroke();ctx.restore();
  if(!reduced&&p>.78){const landing=clamp((p-.78)/.22);ctx.globalAlpha=landing*.6;metal(ctx,x,y-(1-landing)*(1-landing)*20,false,game.mapId);}
 }
 ctx.restore();
}
// Retain the export for older consumers; sudden death is now closing steel, never bomb rain.
export const drawRain=drawClosingWalls;
export function drawRockets(ctx,game,{time=0,reduced=false,pack,drawAsset}={}){
 ctx.save();
 for(const rocket of game.rockets??[]){
  const x=OX+rocket.x*T+15,y=OY+rocket.y*T+15,angle=Math.atan2(rocket.dy,rocket.dx);
  oval(ctx,x,y+7,7,2.2,'#09292275');ctx.save();ctx.translate(x,y);ctx.rotate(angle);
  const flicker=reduced?0:Math.sin(time*52+rocket.x*3)*2;
  if(!reduced){
   for(let i=3;i>=1;i--){ctx.globalAlpha=.18*(1-i/4);oval(ctx,-11-i*7,1,i*1.3,i*1.3,'#d5d5c9');}
   ctx.globalAlpha=1;
  }
  polygon(ctx,[[-6,-3],[-17-flicker,0],[-6,3]],'#ff8528');
  polygon(ctx,[[-6,-1.6],[-12-flicker,0],[-6,1.6]],'#fff1a1');
  // A compact, shaded dart is a projectile effect, separate from the illustrated RPG pickup.
  polygon(ctx,[[-7,-3],[-3,-2],[-3,2],[-7,3]],'#556c64');
  rect(ctx,-5,-2,9,4,gradient(ctx,0,-2,4,['#dfdfb3','#8b9b65','#425b3f']));
  polygon(ctx,[[3,-3],[8,0],[3,3]],'#bdcc87');
  rect(ctx,-4,-2,7,1,'#f3edbd');
  ctx.restore();
 }
 ctx.restore();
}

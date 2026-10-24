'use strict';
const MAP_THEMES = [
 {id:'classic',name:'Original',floor:'#20170e',wall:'#392619',edge:'#c68b4b',glow:'#d77529',accent:'#ffe18c'},
 {id:'neighborhood',name:'Neighborhood',floor:'#182c34',wall:'#274f3b',edge:'#92d6ac',glow:'#62b58e',accent:'#ffb5a4'},
 {id:'scifi',name:'Sci-fi',floor:'#080e24',wall:'#201941',edge:'#43e5ef',glow:'#24bedc',accent:'#e18dff'},
 {id:'fantasy',name:'Fantasy',floor:'#21162e',wall:'#3d3050',edge:'#ba9ae7',glow:'#9b70dc',accent:'#85f2c5'}
];
function themedLayout(original,id){
 const grid=original.map(row=>[...row]);
 const open=(x,y)=>{if(grid[y]?.[x]==='#')grid[y][x]='.';};
 for(const offset of (original[0].length===28?[0]:[0,28])){
  if(id==='neighborhood'){
   // Courtyards replace the upper apartment blocks; short alleys join lower streets.
   for(let y=2;y<=4;y++)for(let x=3;x<=4;x++)open(x+offset,y);
   for(let y=21;y<=22;y++)for(let x=8;x<=9;x++)open(x+offset,y);
   for(let x=11;x<=16;x++)open(x+offset,27);
  }else if(id==='scifi'){
   // Two long transit shafts in each half and an additional lower crossway.
   for(const x of [3,24])for(let y=1;y<=8;y++)open(x+offset,y);
   for(let x=3;x<=24;x++)open(x+offset,28);
   for(let y=21;y<=26;y++)open(15+offset,y);
  }else if(id==='fantasy'){
   // Staggered garden shortcuts around intact ghost keeps.
   for(let x=8;x<=19;x++)open(x+offset,3);
   for(let y=6;y<=8;y++)open(15+offset,y);
   for(let y=24;y<=28;y++)open(10+offset,y);
   for(let x=18;x<=23;x++)open(x+offset,25);
  }
 }
 return grid.map(row=>row.join(''));
}
// Scale each generated material once; patterns stay aligned across adjoining tiles.
const mapMaterials=new Map();
function mapMaterial(id,kind){
 const key=id+'-'+kind;
 if(mapMaterials.has(key))return mapMaterials.get(key);
 const image=art[key];if(!image?.complete||!image.naturalWidth)return null;
 const tile=document.createElement('canvas');tile.width=tile.height=kind==='floor'?120:90;
 tile.getContext('2d').drawImage(image,0,0,tile.width,tile.height);
 const pattern=ctx.createPattern(tile,'repeat');if(pattern)mapMaterials.set(key,pattern);
 return pattern;
}
function drawMapGround(){
 if(activeTheme.id==='classic'){
  if(art.floor.complete&&art.floor.naturalWidth){ctx.fillStyle=ctx.createPattern(art.floor,'repeat');ctx.fillRect(0,0,W*T,H*T)}
  ctx.fillStyle='#08060366';ctx.fillRect(0,0,W*T,H*T);return;
 }
 ctx.fillStyle=mapMaterial(activeTheme.id,'floor')||activeTheme.floor;ctx.fillRect(0,0,W*T,H*T);
 ctx.fillStyle='#03051128';ctx.fillRect(0,0,W*T,H*T);
}
function drawMapWall(px,py){
 if(activeTheme.id==='classic'){
  if(art.wall.complete&&art.wall.naturalWidth)ctx.drawImage(art.wall,px,py,T,T);
  ctx.fillStyle='#080502a0';ctx.fillRect(px,py,T,T);return;
 }
 ctx.fillStyle=mapMaterial(activeTheme.id,'wall')||activeTheme.wall;ctx.fillRect(px,py,T,T);
 ctx.fillStyle='#05031118';ctx.fillRect(px,py,T,T);
}

import {UI_ASSETS} from './assets/runtime/ui-assets.js?v=plant';
import {loadImage} from './image-loader.js';
export const PACK_IDS=['arcade2005'];
export const ASSET_IDS=['logo','pickup','range','rpg','speed','paused','won','lost','roundWon'];
const cache=new Map();
export async function loadPack(id,{onProgress,load=loadImage}={}){
 if(!PACK_IDS.includes(id))throw new Error('Unknown art style');
 if(cache.has(id)){const pack=await cache.get(id);onProgress?.({loaded:ASSET_IDS.length,total:ASSET_IDS.length});return pack;}
 let loaded=0;
 const promise=Promise.all(ASSET_IDS.map(async name=>{
 const asset=UI_ASSETS[name],img=await load(new URL('./assets/runtime/'+asset.file,import.meta.url).href);
 onProgress?.({loaded:++loaded,total:ASSET_IDS.length});return [name,{img,bounds:asset.bounds}];
 })).then(entries=>({id,assets:Object.fromEntries(entries)}));
 cache.set(id,promise);try{return await promise;}catch(e){cache.delete(id);throw e;}
}
export function drawAsset(c,pack,id,x,y,w,h,{contain=true,alpha=1}={}){
 const asset=pack?.assets[id];if(!asset)return false;const b=asset.bounds;
 if(contain){const scale=Math.min(w/b[2],h/b[3]),nw=b[2]*scale,nh=b[3]*scale;x+=(w-nw)/2;y+=(h-nh)/2;w=nw;h=nh;}
 c.save();c.imageSmoothingEnabled=pack.id!=='16bit';c.globalAlpha*=alpha;c.drawImage(asset.img,...b,x,y,w,h);c.restore();return true;
}


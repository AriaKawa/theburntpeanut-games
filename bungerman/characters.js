import { CHARACTER_ATLASES } from './assets/runtime/character-atlases.js';
// Painted arcade cast and shared motion helpers.
const TAU=Math.PI*2;
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const mix=(a,b,t)=>a+(b-a)*t;

export function animationPose(state={}) {
  const time=Number(state.time)||0, reduced=Boolean(state.reduced);
  const action=state.action||'idle', elapsed=Math.max(0,Number(state.actionTime)||0);
  const moving=state.moving??(action==='walk'||state.walk===true);
  const phase=typeof state.walk==='number'?state.walk:time*12.5, stride=moving?(reduced?.32:1):0;
  const wave=Math.sin(phase)*stride, breathe=reduced?0:Math.sin(time*2.5);
  const pose={leftLeg:wave*.52,rightLeg:-wave*.52,leftArm:-wave*.55,rightArm:wave*.55,
    bob:moving?-Math.abs(Math.cos(phase))*2.3*stride:breathe*.65,
    squash:1+(moving?Math.cos(phase*2)*.018:breathe*.012),lean:wave*.025,
    crouch:0,reach:0,blink:!reduced&&((time%4.7)>4.52),mouth:'smile',spin:0,alpha:clamp(state.alpha??1)};
  if(action==='charge') {
    const charge=clamp(Number(state.charge)||0), tremble=reduced?0:Math.sin(time*39)*charge;
    pose.leftArm=-.65;pose.rightArm=.65;pose.crouch=4+charge*4;
    pose.squash=.97-charge*.04;pose.lean=tremble*.018;pose.bob=tremble*.45;pose.mouth='tense';
  } else if(action==='plant') {
    const bend=Math.sin(clamp(elapsed/.32)*Math.PI);
    pose.crouch=12*bend;pose.squash=1-.1*bend;pose.reach=bend;
    pose.rightArm=-.5-bend*.7;pose.leftArm=.4*bend;pose.lean=.14*bend;
  } else if(action==='hit') {
    const kick=1-clamp(elapsed/.48);
    pose.lean=-.24*kick;pose.leftArm=1.3*kick;pose.rightArm=-1.3*kick;
    pose.bob=-5*Math.sin(kick*Math.PI);pose.squash=1+.16*kick;pose.mouth='open';
  } else if(action==='victory') {
    const hop=reduced?0:Math.max(0,Math.sin(time*7));
    pose.bob=-hop*10;pose.leftArm=2.25;pose.rightArm=-2.25;
    pose.leftLeg=-.14-hop*.15;pose.rightLeg=.14+hop*.15;pose.mouth='open';pose.lean=reduced?0:Math.sin(time*5)*.07;
  } else if(action==='death') {
    const fall=clamp(elapsed/.55);
    pose.crouch=fall*39;pose.squash=mix(1,.24,fall);pose.lean=-fall*.15;
    pose.leftArm=-1.4*fall;pose.rightArm=1.4*fall;pose.mouth='open';pose.blink=true;
  }
  return pose;
}


// Painted, independent poses replace the former geometric character rig.
export const CHARACTER_IDS=Object.freeze(['peanut','hutch','ninja','tpain']);
let sheets=null, loading=null;

export const ANIMATION_TIMING=Object.freeze({throwDuration:.36,throwRelease:.18,plantDuration:.34});
const loopIndex=(phase,count)=>Math.floor(((phase%TAU+TAU)%TAU)/TAU*count)%count;
const pingPong=(time,count,rate)=>{const n=Math.floor(Math.max(0,time)*rate)%(count*2-2);return n<count?n:count*2-2-n;};

export function spriteFrame(state={}) {
  const action=state.action||'idle', dir=state.dir||'down', time=Number(state.time)||0;
  let row=8,column=0;
  if(action==='throw') {
    const index=Math.min(11,Math.floor(clamp((state.actionTime||0)/ANIMATION_TIMING.throwDuration)*12));
    row=6+Math.floor(index/6);column=index%6;
  } else if(action==='plant') {
    // A short anticipation/recovery gesture; tapping never plays an overhead throw.
    row=6;column=[0,1,2,1,0][Math.min(4,Math.floor(clamp((state.actionTime||0)/ANIMATION_TIMING.plantDuration)*5))];
  } else if(action==='charge') {
    row=6;column=Math.min(5,Math.floor(clamp(state.charge||0)*5));
  } else if(action==='victory') {row=6;column=5;}
  else if((state.moving??action==='walk')&&!state.reduced) {
    const index=loopIndex(typeof state.walk==='number'?state.walk:time*12.5,12);
    row=(dir==='up'?4:(dir==='left'||dir==='right'?2:0))+Math.floor(index/6);column=index%6;
  } else {
    // Planted-feet standing drawings, never a frozen running stride.
    if(dir==='up'){row=9;column=3+(state.reduced?0:pingPong(time,3,2));}
    else if(dir==='left'||dir==='right'){row=9;column=state.reduced?0:pingPong(time,3,2);}
    else {row=8;column=state.reduced?0:Math.floor(Math.max(0,time)*3)%6;}
  }
  return {row,column,flip:dir==='left'};
}

function browserLoadImage(url) {
  return new Promise((resolve,reject)=>{
    const img=new Image();
    const timer=setTimeout(()=>{img.onload=img.onerror=null;img.src='';reject(new Error('Character download timed out. Please retry.'));},12000);
    img.onload=()=>{clearTimeout(timer);resolve(img);};
    img.onerror=()=>{clearTimeout(timer);reject(new Error('Could not load character sprite: '+url));};
    img.src=url;
  });
}

/** Prebuilt atlases need only four image decodes: no pixel scans or canvas allocations. */
export async function loadCharacterSprites(options={}) {
  if(sheets){options.onProgress?.({loaded:CHARACTER_IDS.length,total:CHARACTER_IDS.length});return sheets;}
  if(loading)return loading;
  const loadImage=options.loadImage||browserLoadImage;
  // Keep the existing arcade2005 basePath adapter for offline renderers.
  const base=options.runtimeBasePath||(options.basePath?options.basePath+'../runtime/':new URL('./assets/runtime/',import.meta.url).href);
  let loaded=0;
  loading=Promise.all(CHARACTER_IDS.map(async id=>{
    const metadata=CHARACTER_ATLASES[id],image=await loadImage(base+metadata.file);
    options.onProgress?.({loaded:++loaded,total:CHARACTER_IDS.length});
    return [id,{image,frames:metadata.frames.map(frame=>({...frame,image})),referenceHeight:metadata.referenceHeight}];
  })).then(entries=>(sheets=Object.fromEntries(entries))).catch(error=>{loading=null;throw error;});
  return loading;
}

/** Character image is anchored by the feet; poses have independent drawn limbs and shading. */
export function drawCharacter(ctx,x,feet,height,character='peanut',state={}) {
  const name=typeof character==='string'?character:character?.id||character?.key||'peanut';
  const sheet=sheets?.[name];if(!sheet)return;
  const selected=spriteFrame(state),frame=sheet.frames[selected.row*6+selected.column];
  const action=state.action||'idle',time=Number(state.time)||0;
  let bob=0,rotation=0,squash=1,alpha=clamp(state.alpha??1);
  if(action==='hit'){const kick=1-clamp((state.actionTime||0)/.48);rotation=-.2*kick;bob-=height*.12*Math.sin(kick*Math.PI);}
  if(action==='death'){const t=clamp((state.actionTime||0)/.75);rotation=t*1.5;squash=1-t*.65;alpha*=1-t;bob+=height*t*.1;}
  if(action==='victory'&&!state.reduced){bob-=Math.max(0,Math.sin(time*7))*height*.13;rotation=Math.sin(time*5)*.06;}
  ctx.save();ctx.translate(x,feet+bob);ctx.rotate(rotation);ctx.scale(selected.flip?-1:1,squash);ctx.globalAlpha*=alpha;
  ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  // Each prebuilt atlas rectangle contains one isolated painted pose.
  const blit=(f,weight=1)=>{
    const scale=height/(f.referenceHeight||sheet.referenceHeight);
    ctx.save();ctx.globalAlpha*=weight;
    ctx.drawImage(f.image,f.sx,f.sy,f.w,f.h,-f.anchorX*scale,-f.anchorY*scale,f.w*scale,f.h*scale);
    ctx.restore();
  };
  const moving=state.moving??(action==='walk');
  const blend=clamp(state.movementBlend??(moving?1:0));
  if(!state.reduced&&(action==='idle'||action==='walk')&&blend>.05&&blend<.95){
    const standing=spriteFrame({...state,action:'idle',moving:false});
    const walking=spriteFrame({...state,action:'walk',moving:true});
    blit(sheet.frames[standing.row*6+standing.column],1-blend);
    blit(sheet.frames[walking.row*6+walking.column],blend);
  }else blit(frame);
  ctx.restore();
}



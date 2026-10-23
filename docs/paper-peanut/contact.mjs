// Alpha-mask contact uses the same position, scale, pivot and rotation as rendering.
export function shapeBounds(s){
 const c=Math.cos(s.rot||0),n=Math.sin(s.rot||0),pts=[];
 for(const x of [-s.width/2,s.width/2])for(const y of [-s.height+s.pivot,s.pivot])pts.push({x:s.x+x*c-y*n,y:s.y+x*n+y*c});
 return {left:Math.min(...pts.map(p=>p.x)),right:Math.max(...pts.map(p=>p.x)),top:Math.min(...pts.map(p=>p.y)),bottom:Math.max(...pts.map(p=>p.y))};
}
export function opaqueAt(s,x,y){
 const c=Math.cos(s.rot||0),n=Math.sin(s.rot||0),dx=x-s.x,dy=y-s.y;
 const u=(dx*c+dy*n)/s.width+.5,v=(-dx*n+dy*c-s.pivot)/s.height+1;
 if(u<0||u>=1||v<0||v>=1)return false;
 return s.mask.data[(Math.floor(v*s.mask.height)*s.mask.width+Math.floor(u*s.mask.width))*4+3]>=96;
}
export function touches(a,b){
 const aa=shapeBounds(a),bb=shapeBounds(b),l=Math.max(aa.left,bb.left),r=Math.min(aa.right,bb.right),t=Math.max(aa.top,bb.top),bottom=Math.min(aa.bottom,bb.bottom);
 if(l>=r||t>=bottom)return false;
 for(let y=t+.5;y<bottom;y+=1.5)for(let x=l+.5;x<r;x+=1.5)if(opaqueAt(a,x,y)&&opaqueAt(b,x,y))return true;
 return false;
}
export function firstContact(pose,overlap,start=0){
 let previous=start;
 for(let i=0;i<=240;i++){
  const p=start+(1-start)*i/240;pose(p);
  if(overlap()){
   let low=previous,high=p;
   for(let j=0;j<10;j++){const mid=(low+high)/2;pose(mid);if(overlap())high=mid;else low=mid;}
   pose(0);return high;
  }
  previous=p;
 }
 pose(0);throw new Error('Attack path did not reach visible contact');
}

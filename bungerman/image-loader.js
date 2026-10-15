// Finite failures are retryable: never leave Play stuck waiting for a lost request.
export function loadImage(url,{timeoutMs=15000}={}){
 return new Promise((resolve,reject)=>{
  const image=new Image();let settled=false;
  const finish=(error)=>{if(settled)return;settled=true;clearTimeout(timer);image.onload=image.onerror=null;if(error){image.src='';reject(error);}else resolve(image);};
  const timer=setTimeout(()=>finish(new Error('Image load timed out: '+url)),timeoutMs);
  image.onload=()=>finish();image.onerror=()=>finish(new Error('Could not load image: '+url));
  image.src=url;
 });
}

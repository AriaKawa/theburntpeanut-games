const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
(async()=>{
for(const game of ['bungerman','pac-nut','paper-peanut']) for(const saved of ['on','off']) {
 let handlers={},docEvents={},winEvents={},store={[game+'-song']:saved},attrs={},plays=0,track,blocked=true,finish;
 const button={dataset:{musicKey:game,goldIcon:game==='pac-nut'},setAttribute:(k,v)=>attrs[k]=v,addEventListener:(k,f)=>handlers[k]=f};
 const doc={hidden:false,getElementById:()=>button,addEventListener:(k,f)=>docEvents[k]=f};
 class Audio{constructor(src){this.src=src;this.paused=true;track=this}play(){plays++;if(blocked)return Promise.reject(new Error('NotAllowedError'));this.paused=false;return new Promise(r=>finish=r)}pause(){this.paused=true}}
 const source=fs.readFileSync(game+'/song.js','utf8');
 assert.equal(source,fs.readFileSync('docs/'+game+'/song.js','utf8'));
 vm.runInNewContext(source,{document:doc,window:{addEventListener:(k,f)=>winEvents[k]=f},Audio,localStorage:{getItem:k=>store[k],setItem:(k,v)=>store[k]=v}});
 await Promise.resolve();
 assert.equal(plays,saved==='on'?1:0);assert.equal(track.volume,.19125);assert.equal(track.loop,true);assert.equal(track.preload,'auto');if(game==='pac-nut'){docEvents['pacnut:weapon']({detail:{armed:true}});assert.equal(track.playbackRate,1.03);assert.equal(track.preservesPitch,true);docEvents['pacnut:weapon']({detail:{armed:false}});assert.equal(track.playbackRate,.9);}
 blocked=false;
 if(saved==='off'){docEvents.pointerdown({target:{closest:()=>false}});assert.equal(plays,0);handlers.click();}
 else docEvents.keydown({target:{closest:()=>false}});
 assert.equal(track.paused,false);
 // Muting while play is pending must stay muted when it resolves.
 handlers.click();assert.equal(track.muted,true);assert.equal(track.paused,true);finish();await Promise.resolve();assert.equal(track.paused,true);
 assert.equal(attrs['aria-pressed'],'false');assert.equal(store[game+'-song'],'off');
 const previous=plays;docEvents.click({target:{closest:()=>false}});assert.equal(plays,previous);
 handlers.click();assert.equal(track.muted,false);assert.equal(track.paused,false);
 doc.hidden=true;docEvents.visibilitychange();assert.equal(track.paused,true);
 doc.hidden=false;docEvents.visibilitychange();assert.equal(track.paused,false);
 winEvents.pagehide();assert.equal(track.paused,true);winEvents.pageshow();assert.equal(track.paused,false);
 assert.equal(attrs['aria-label'],'Mute music');if(game==='pac-nut')assert.equal(button.className,'icon sound');
 assert(fs.readFileSync(game+'/assets/music.mp3').equals(fs.readFileSync('docs/'+game+'/assets/music.mp3')));
 console.log('PASS',game,saved,': startup, blocked autoplay fallback, mute race, saved preference, visibility, page restore, half volume');
}
})().catch(e=>{console.error(e);process.exit(1)});

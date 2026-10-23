const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
for(const game of ['bungerman','pac-nut','paper-peanut']){
 let handlers={},docEvents={},winEvents={},store={},attrs={},plays=0,pauses=0,track;
 const button={dataset:{musicKey:game},setAttribute:(k,v)=>attrs[k]=v,addEventListener:(k,f)=>handlers[k]=f};
 const doc={hidden:false,getElementById:()=>button,addEventListener:(k,f)=>docEvents[k]=f};
 class Audio{constructor(src){this.src=src;track=this}play(){plays++;return Promise.resolve()}pause(){pauses++}}
 vm.runInNewContext(fs.readFileSync(game+'/song.js','utf8'),{document:doc,window:{addEventListener:(k,f)=>winEvents[k]=f},Audio,localStorage:{getItem:k=>store[k],setItem:(k,v)=>store[k]=v}});
 assert.equal(plays,0);assert.equal(track.loop,true);assert.equal(track.src,'assets/music.mp3');
 docEvents.pointerdown({target:{closest:()=>false}});assert.equal(plays,1);
 handlers.click();assert.equal(attrs['aria-pressed'],'false');assert.equal(store[game+'-song'],'off');
 const previous=plays;doc.hidden=true;docEvents.visibilitychange();doc.hidden=false;docEvents.visibilitychange();assert.equal(plays,previous);
 handlers.click();assert.equal(attrs['aria-pressed'],'true');assert(plays>previous);
 doc.hidden=true;docEvents.visibilitychange();assert(pauses>=2);
 const bytes=fs.readFileSync(game+'/assets/music.mp3');assert(bytes.length>3000000);
 assert(bytes.equals(fs.readFileSync('docs/'+game+'/assets/music.mp3')));
 console.log('PASS '+game+': gesture start, loop, mute, persistence, hidden-tab pause, matching publication asset');
}

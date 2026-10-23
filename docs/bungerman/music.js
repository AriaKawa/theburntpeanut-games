// Original 8-bar chiptune: melody, bouncing bass, arpeggios and a soft kick.
const LEAD=[
 [76,0,79,0,81,79,76,0,72,0,74,76,79,0,74,0],
 [76,0,79,81,84,0,81,79,76,0,74,0,72,74,76,0],
 [77,0,81,0,84,81,77,0,74,0,77,79,81,0,79,0],
 [79,0,83,0,86,83,79,0,74,0,76,74,71,0,74,0],
 [76,79,84,0,83,0,79,0,81,0,79,76,74,0,72,0],
 [81,0,84,0,88,0,84,81,79,0,76,0,74,76,79,0],
 [77,0,81,84,86,0,84,81,79,0,77,0,74,0,77,0],
 [79,0,83,86,88,86,83,0,79,0,74,0,71,74,76,0]
];
const CHORDS=[[48,52,55],[45,48,52],[50,53,57],[43,47,50],[48,52,55],[45,48,52],[50,53,57],[43,47,50]];
export class ArcadeMusic {
 constructor(){this.enabled=true;this.hidden=false;this.context=null;this.timer=null;this.step=0;this.next=0;}
 attach(context){if(!context)return;if(!this.context){this.context=context;this.output=context.createGain();this.output.gain.value=this.enabled&&!this.hidden?.16:0;this.output.connect(context.destination);}this.sync();}
 setEnabled(value){this.enabled=value;this.sync();}
 setHidden(value){this.hidden=value;this.sync();}
 sync(){const c=this.context;if(!c)return;const audible=this.enabled&&!this.hidden;this.output.gain.setValueAtTime(audible?.16:0,c.currentTime);if(!audible){clearInterval(this.timer);this.timer=null;return;}if(this.timer!==null)return;this.next=c.currentTime+.04;this.timer=setInterval(()=>this.schedule(),25);this.schedule();}
 note(midi,time,duration,type,volume,end){const c=this.context,o=c.createOscillator(),g=c.createGain(),frequency=440*2**((midi-69)/12);o.type=type;o.frequency.setValueAtTime(frequency,time);if(end)o.frequency.exponentialRampToValueAtTime(end,time+duration);g.gain.setValueAtTime(0,time);g.gain.linearRampToValueAtTime(volume,time+.008);g.gain.exponentialRampToValueAtTime(.0001,time+duration);o.connect(g);g.connect(this.output);o.onended=()=>{o.disconnect();g.disconnect();};o.start(time);o.stop(time+duration+.01);}
 schedule(){const c=this.context;if(!this.enabled||this.hidden||c.state!=='running')return;const beat=60/124/4;if(this.next<c.currentTime)this.next=c.currentTime+.02;while(this.next<c.currentTime+.12){const bar=Math.floor(this.step/16)%8,s=this.step%16,chord=CHORDS[bar],lead=LEAD[bar][s],t=this.next;if(lead)this.note(lead,t,beat*.8,'square',.018);if(s%2===0)this.note(chord[s%4===0?0:2],t,beat*1.4,'triangle',.055);if(s%2===1)this.note(chord[Math.floor(s/2)%3]+24,t,beat*.55,'triangle',.018);if(s%4===0)this.note(43,t,.09,'sine',.045,30);this.step=(this.step+1)%128;this.next+=beat;}}
}

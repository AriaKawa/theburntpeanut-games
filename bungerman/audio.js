// Small procedural arcade sound bank: no downloads or loading delay.
export class ArcadeAudio {
 constructor(){this.enabled=true;this.context=null;this.voices=0;this.last=new Map();}
 unlock(force=false){if(!this.enabled&&!force)return;try{if(!this.context){this.context=new(window.AudioContext||window.webkitAudioContext)();this.master=this.context.createGain();this.master.gain.value=this.enabled?.65:0;this.master.connect(this.context.destination);}if(this.context.state==='suspended')this.context.resume()?.catch(()=>{});}catch{}}
 setEnabled(value){this.enabled=value;if(this.master)this.master.gain.setValueAtTime(value?.65:0,this.context.currentTime);}
 tone(freq,duration=.07,type='square',volume=.035,end,delay=0){const c=this.context;if(!this.enabled||!c||c.state!=='running'||this.voices>=32)return;const t=c.currentTime+delay,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);if(end)o.frequency.exponentialRampToValueAtTime(end,t+duration);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(volume,t+.004);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(g);g.connect(this.master);this.voices++;o.onended=()=>{o.disconnect();g.disconnect();this.voices--;};o.start(t);o.stop(t+duration+.01);}
 noise(duration=.15,volume=.05,frequency=900){const c=this.context;if(!this.enabled||!c||c.state!=='running'||this.voices>=32)return;const n=c.createBufferSource(),g=c.createGain(),f=c.createBiquadFilter();if(!this.buffer){this.buffer=c.createBuffer(1,c.sampleRate,c.sampleRate);const data=this.buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;}n.buffer=this.buffer;f.type='lowpass';f.frequency.value=frequency;g.gain.setValueAtTime(volume,c.currentTime);g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+duration);n.connect(f);f.connect(g);g.connect(this.master);this.voices++;n.onended=()=>{n.disconnect();f.disconnect();g.disconnect();this.voices--;};n.start();n.stop(c.currentTime+duration);}
 play(kind){if(!this.enabled||!this.context||this.context.state!=='running')return;const now=this.context.currentTime,gap=kind==='hover'?.07:kind==='step'?.16:.045;if(now-(this.last.get(kind)??-Infinity)<gap)return;this.last.set(kind,now);const t=(...args)=>this.tone(...args),n=(...args)=>this.noise(...args),melody=(notes,spacing=.07)=>notes.forEach((f,i)=>t(f,.16,'triangle',.055,undefined,i*spacing));
 switch(kind){
 case 'hover':t(760,.035,'sine',.018,950);break;
 case 'click':t(390,.055,'triangle',.04,220);break;
 case 'select':melody([440,660]);break;
 case 'map':t(300,.08,'triangle',.045,600);n(.04,.015,1800);break;
 case 'back':melody([440,300]);break;
 case 'open':melody([330,495,660]);break;
 case 'ready':melody([523,784]);break;
 case 'unready':melody([523,349]);break;
 case 'join':melody([392,523,784]);break;
 case 'countdown':t(660,.12,'square',.025);break;
 case 'start':melody([392,523,659,1046],.065);break;
 case 'pause':melody([440,330]);break;
 case 'resume':melody([330,440]);break;
 case 'fullscreen':t(300,.13,'sine',.035,800);break;
 case 'step':n(.035,.012,400);t(95,.04,'triangle',.014,65);break;
 case 'drop':t(180,.12,'triangle',.08,65);n(.045,.035,700);break;
 case 'explosion':n(.3,.13,1800);t(85,.3,'triangle',.12,24);break;
 case 'rpgFire':n(.22,.075,2600);t(210,.18,'sawtooth',.03,45);break;
 case 'crateDamage':n(.09,.06,1900);t(220,.07,'triangle',.035,100);break;
 case 'crate':n(.19,.07,3200);t(130,.12,'triangle',.04,40);break;
 case 'hit':t(520,.18,'sawtooth',.04,90);n(.1,.05,2200);break;
 case 'death':t(320,.3,'triangle',.055,45);break;
 case 'range':melody([440,660,880,1320]);break;
 case 'speed':n(.08,.025,3000);melody([600,800,1100],.045);break;
 case 'rpg':t(180,.07,'square',.03);t(420,.1,'triangle',.05,undefined,.09);break;
 case 'pickup':melody([880,1175]);break;
 case 'empty':case 'blocked':case 'error':t(120,.1,'square',.025,90);break;
 case 'overtime':melody([440,220,440,220],.16);break;
 case 'wallClose':n(.25,.08,650);t(70,.25,'triangle',.09,25);break;
 case 'win':melody([440,554,659,880],.1);break;
 case 'lost':melody([330,220,110],.15);break;
 }
 }
}

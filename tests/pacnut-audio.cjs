const fs=require('fs'),vm=require('vm');
const harness=fs.readFileSync('tests/pacnut-twins.cjs','utf8').split('\n')[0];
vm.runInNewContext(harness+`vm.runInContext(\`
let started=0;const param=()=>({value:0,setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}});const node=()=>({connect(){},disconnect(){},start(){started++},stop(){},frequency:param(),gain:param(),Q:param()});
window.AudioContext=class{constructor(){this.currentTime=1;this.sampleRate=44100;this.destination={}}resume(){return Promise.resolve()}createOscillator(){return node()}createGain(){return node()}createBiquadFilter(){return node()}createBufferSource(){return node()}createDynamicsCompressor(){return {...node(),threshold:{},knee:{},ratio:{},attack:{},release:{}}}createBuffer(c,n){return {getChannelData:()=>new Float32Array(n)}}};
start();readyTimer=0;weapon=6;fireCooldown=0;started=0;fire();assert.equal(bullets.length,1);assert.equal(started,2,'each shot starts noise and low body');assert.equal(gunOutput.gain.value,1.35,'35% rifle boost after compression');
const g=ghosts[0];g.state='active';g.capturedPower=-1;started=0;assert(capture(g));assert.equal(started,2,'capture plays splash and impact');assert.equal(g.state,'eyes');started=0;assert.equal(capture(g),false);assert.equal(started,0,'no duplicate splat');sound=false;fireCooldown=0;fire();splatSound();assert.equal(started,0,'mute respected');console.log('PASS actual shot/capture audio nodes, duplicate capture and mute');
\`,sandbox);`,{require,console});

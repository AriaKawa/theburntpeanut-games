(() => {
  const button = document.getElementById('music');
  const track = new Audio('assets/music.mp3');
  track.loop = true;
  track.playbackRate = .9;
  track.preservesPitch = true;
  track.mozPreservesPitch = true;
  track.webkitPreservesPitch = true;
  track.preload = 'auto';
  track.volume = .19125;
  const key = button.dataset.musicKey + '-song';
  let enabled = true, leaving = false, autoplayBlocked = false;
  try { enabled = localStorage.getItem(key) !== 'off'; } catch {}
  let dead=false, mixContext, mixGain, mixFilter;
  function connectMix(){
    if(mixContext){mixContext.resume().catch(()=>{});return;}
    try{const C=window.AudioContext||window.webkitAudioContext;if(!C)return;mixContext=new C();const source=mixContext.createMediaElementSource(track);mixFilter=mixContext.createBiquadFilter();mixFilter.type='lowpass';mixFilter.frequency.value=dead?650:20000;mixGain=mixContext.createGain();mixGain.gain.value=dead?.16:1;source.connect(mixFilter);mixFilter.connect(mixGain);mixGain.connect(mixContext.destination);mixContext.resume().catch(()=>{});}catch{}
  }
  function deathMix(value){dead=value;if(mixContext&&mixGain){const t=mixContext.currentTime;mixGain.gain.cancelScheduledValues(t);mixGain.gain.setTargetAtTime(dead?.16:1,t,.3);mixFilter.frequency.cancelScheduledValues(t);mixFilter.frequency.setTargetAtTime(dead?650:20000,t,.3);}else{const from=track.volume,to=dead?.0306:.19125,start=performance.now();function fade(now){const f=Math.min(1,(now-start)/1000);track.volume=from+(to-from)*f;if(f<1)requestAnimationFrame(fade)}requestAnimationFrame(fade);}}
  document.addEventListener('pacnut:weapon',event=>{track.playbackRate=event.detail.armed?1.03:.9;});
  document.addEventListener('pacnut:death',()=>{track.playbackRate=.9;deathMix(true);});
  document.addEventListener('pacnut:revive',()=>deathMix(false));
  function render() {
    button.setAttribute('aria-pressed', String(enabled && !autoplayBlocked));
    button.setAttribute('aria-label', enabled ? (autoplayBlocked ? 'Start music' : 'Mute music') : 'Enable music');
    button.title = enabled ? (autoplayBlocked ? 'Start music' : 'Mute music') : 'Enable music';
    if (button.dataset.goldIcon) button.className = 'icon ' + (enabled ? 'sound' : 'mute');
    else button.innerHTML = '<span aria-hidden="true">' + (enabled ? '\u266a' : '\u266a\u0338') + '</span>';
  }
  function sync() {
    // Apply mute immediately, including while an earlier play request is pending.
    track.muted = !enabled;
    if (!enabled || document.hidden || leaving) { track.pause(); return; }
    if (!track.paused) return;
    try {
      const play = track.play();
      if (play) play.then(() => {
        autoplayBlocked = false;
        if (!enabled || document.hidden || leaving) track.pause();
        render();
      }).catch(error => {
        if (error.name === 'NotAllowedError' && track.paused) { autoplayBlocked = true; render(); }
      });
    } catch {}
  }
  function unlock(event) {connectMix();
    if (event.target.closest?.('#music')) return;
    sync();
  }
  for (const type of ['pointerdown', 'keydown', 'click']) {
    document.addEventListener(type, unlock, {capture:true});
  }
  button.addEventListener('click', () => {
    connectMix();enabled = autoplayBlocked ? true : !enabled; autoplayBlocked = false;
    try { localStorage.setItem(key, enabled ? 'on' : 'off'); } catch {}
    render(); sync();
  });
  document.addEventListener('visibilitychange', sync);
  window.addEventListener('pagehide', () => { leaving = true; track.pause(); });
  window.addEventListener('pageshow', () => { leaving = false; sync(); });
  render();
  sync();
})();

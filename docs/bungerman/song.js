(() => {
  const button = document.getElementById('music');
  const track = new Audio('assets/music.mp3?v=sun-test-9-20261024');
  track.loop = true;
  track.preload = 'auto';
  track.volume = .19125;
  const key = button.dataset.musicKey + '-song';
  let enabled = true, leaving = false, autoplayBlocked = false;
  try { enabled = localStorage.getItem(key) !== 'off'; } catch {}
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
  function unlock(event) {
    if (event.target.closest?.('#music')) return;
    sync();
  }
  for (const type of ['pointerdown', 'keydown', 'click']) {
    document.addEventListener(type, unlock, {capture:true});
  }
  button.addEventListener('click', () => {
    enabled = autoplayBlocked ? true : !enabled; autoplayBlocked = false;
    try { localStorage.setItem(key, enabled ? 'on' : 'off'); } catch {}
    render(); sync();
  });
  document.addEventListener('visibilitychange', sync);
  window.addEventListener('pagehide', () => { leaving = true; track.pause(); });
  window.addEventListener('pageshow', () => { leaving = false; sync(); });
  render();
  sync();
})();

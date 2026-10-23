(() => {
  const button = document.getElementById('music');
  const track = new Audio('assets/music.mp3');
  track.loop = true;
  track.preload = 'none';
  track.volume = .45;
  const key = button.dataset.musicKey + '-song';
  let enabled = true, unlocked = false;
  try { enabled = localStorage.getItem(key) !== 'off'; } catch {}
  function render() {
    button.setAttribute('aria-pressed', String(enabled));
    button.setAttribute('aria-label', enabled ? 'Mute music' : 'Enable music');
    button.title = enabled ? 'Mute music' : 'Enable music';
    if (button.dataset.goldIcon) button.className = 'icon ' + (enabled ? 'sound' : 'mute');
    else button.innerHTML = '<span aria-hidden="true">' + (enabled ? '\u266a' : '\u266a\u0338') + '</span>';
  }
  function sync() {
    if (!enabled || document.hidden || !unlocked) { track.pause(); return; }
    const play = track.play();
    if (play) play.then(() => { if (!enabled || document.hidden) track.pause(); }).catch(() => {});
  }
  function unlock(event) {
    if (event.target.closest?.('#music')) return;
    unlocked = true; sync();
  }
  document.addEventListener('pointerdown', unlock, {capture:true});
  document.addEventListener('keydown', unlock, {capture:true});
  button.addEventListener('click', () => {
    enabled = !enabled; unlocked = true;
    try { localStorage.setItem(key, enabled ? 'on' : 'off'); } catch {}
    render(); sync();
  });
  document.addEventListener('visibilitychange', sync);
  window.addEventListener('pagehide', () => track.pause());
  render();
})();

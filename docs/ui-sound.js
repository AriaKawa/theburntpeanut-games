const toggle = document.getElementById('ui-sound');
let enabled = true, context, lastHover = -Infinity;
const voices = new Set();
try { enabled = localStorage.getItem('peanut-ui-sound') !== 'off'; } catch {}

function update() {
  toggle.setAttribute('aria-pressed', String(enabled));
  toggle.setAttribute('aria-label', enabled ? 'Mute button sounds' : 'Enable button sounds');
  toggle.title = enabled ? 'Mute sounds' : 'Enable sounds';
  toggle.querySelector('span').textContent = enabled ? '♪' : '♪̸';
}

function audioContext() {
  const Audio = window.AudioContext || window.webkitAudioContext;
  if (!Audio) return null;
  context ??= new Audio();
  return context;
}

function sound(kind) {
  if (!enabled) return;
  try {
    const audio = audioContext();
    // Hover stays silent until a visitor's first gesture unlocks browser audio.
    if (!audio || audio.state !== 'running' || document.hidden) return;
    const now = audio.currentTime;
    if (kind === 'hover' && now - lastHover < 0.12) return;
    if (kind === 'hover') lastHover = now;
    if (voices.size >= 6) return;
    const hover = kind === 'hover';
    const duration = hover ? 0.14 : 0.22;
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(hover ? 660 : 440, now);
    oscillator.frequency.exponentialRampToValueAtTime(hover ? 622 : 392, now + duration);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(hover ? 0.009 : 0.018, now + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain);
    gain.connect(audio.destination);
    voices.add(oscillator);
    oscillator.onended = () => {
      voices.delete(oscillator);
      oscillator.disconnect();
      gain.disconnect();
    };
    oscillator.start(now);
    oscillator.stop(now + duration + 0.01);
  } catch {}
}

function unlock() {
  if (!enabled) return;
  try { audioContext()?.resume().catch(() => {}); } catch {}
}
function control(target) {
  const element = target instanceof Element ? target.closest('a,button') : null;
  return element && !element.matches(':disabled,[aria-disabled="true"]') ? element : null;
}
document.addEventListener('pointerdown', unlock, { capture: true });
document.addEventListener('keydown', unlock, { capture: true });
document.addEventListener('pointerover', event => {
  const element = control(event.target);
  if (event.pointerType === 'touch' || !element || element.contains(event.relatedTarget)) return;
  sound('hover');
});
document.addEventListener('focusin', event => {
  if (control(event.target)?.matches(':focus-visible')) sound('hover');
});
document.addEventListener('click', event => {
  const element = control(event.target);
  if (!element || element === toggle) return;
  unlock();
  if (context?.state === 'running') sound('click');
  else context?.resume().then(() => sound('click')).catch(() => {});
});
toggle.addEventListener('click', () => {
  enabled = !enabled;
  if (!enabled) {
    for (const voice of voices) { try { voice.stop(); } catch {} }
  }
  try { localStorage.setItem('peanut-ui-sound', enabled ? 'on' : 'off'); } catch {}
  update();
  if (enabled) {
    try { audioContext()?.resume().then(() => sound('click')).catch(() => {}); } catch {}
  }
});
update();

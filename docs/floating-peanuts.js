(() => {
  const layer = document.querySelector('.peanut-floaters');
  if (!layer) return;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const starts = [[.02,.12,8,6],[.98,.2,-7,6],[.18,.95,7,-5],[.78,.92,-8,-5]];
  const portraits = [...layer.children].map((image, i) => ({image, x:0, y:0, vx:starts[i][2], vy:starts[i][3], start:starts[i], placed:false}));
  let frame = 0, previous = null;
  function paint(p) { p.image.style.transform = `translate3d(${p.x}px,${p.y}px,0)`; }
  function fit() {
    for (const p of portraits) {
      const size = p.image.getBoundingClientRect();
      p.maxX = Math.max(0, layer.clientWidth - size.width);
      p.maxY = Math.max(0, layer.clientHeight - size.height);
      p.x = p.placed ? Math.min(p.maxX, Math.max(0,p.x)) : p.start[0]*p.maxX;
      p.y = p.placed ? Math.min(p.maxY, Math.max(0,p.y)) : p.start[1]*p.maxY;
      p.placed = true;
      paint(p);
    }
  }
  function tick(now) {
    if (motion.matches || document.hidden) { previous = null; return; }
    const dt = previous === null ? 0 : Math.min((now-previous)/1000,.05);
    previous = now;
    for (const p of portraits) {
      p.x += p.vx*dt; p.y += p.vy*dt;
      if (p.x <= 0) {p.x=0;p.vx=Math.abs(p.vx);}
      else if (p.x >= p.maxX) {p.x=p.maxX;p.vx=-Math.abs(p.vx);}
      if (p.y <= 0) {p.y=0;p.vy=Math.abs(p.vy);}
      else if (p.y >= p.maxY) {p.y=p.maxY;p.vy=-Math.abs(p.vy);}
      paint(p);
    }
    frame = requestAnimationFrame(tick);
  }
  function sync() {
    cancelAnimationFrame(frame); previous = null;
    if (!motion.matches && !document.hidden) frame = requestAnimationFrame(tick);
  }
  fit();
  for (const p of portraits) p.image.addEventListener('load', fit);
  window.addEventListener('resize', fit);
  motion.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);
  sync();
})();

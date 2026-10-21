/* The cursor: a solid blue dot over a larger see-through blue disc.
   The dot tracks the pointer exactly; the disc follows on a spring, grows over
   anything clickable and squeezes on press. Mouse and trackpad only: the
   native cursor is hidden only after the first real mouse move, so touch and
   keyboard users never lose it. */
(function () {
  'use strict';
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  var root = document.documentElement;
  var rm = root.classList.contains('rm') || matchMedia('(prefers-reduced-motion: reduce)').matches;

  var disc = document.createElement('div'), dot = document.createElement('div');
  disc.className = 'cur cur--disc'; dot.className = 'cur cur--dot';
  disc.setAttribute('aria-hidden', 'true'); dot.setAttribute('aria-hidden', 'true');
  document.body.appendChild(disc); document.body.appendChild(dot);

  var x = -100, y = -100, dx = x, dy = y, vx = 0, vy = 0, last = 0, on = false;
  var hot = false, press = false, size = 1, SPRING = 14;
  var CLICKABLE = 'a, button, input, textarea, select, label, [role="button"], .compare';

  addEventListener('pointermove', function (e) {
    if (e.pointerType && e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
    x = e.clientX; y = e.clientY;
    if (!on) { on = true; dx = x; dy = y; root.classList.add('has-cur'); }
    hot = !!(e.target.closest && e.target.closest(CLICKABLE));
  }, { passive: true });
  root.addEventListener('mouseleave', function () { root.classList.add('cur-out'); });
  root.addEventListener('mouseenter', function () { root.classList.remove('cur-out'); });
  addEventListener('pointerdown', function () { press = true; });
  addEventListener('pointerup', function () { press = false; });

  // Blob behaviour. The dot stretches along its direction of travel on an
  // underdamped spring, so it overshoots and jiggles back when you stop. The
  // disc stretches toward the dot it is chasing. Both outlines wobble out of
  // round, more while the mouse is moving.
  var px0 = null, py0 = null, dst = 0, dsv = 0, dang = 0, energy = 0, t0 = performance.now();
  var ox = x, oy = y, ovx = 0, ovy = 0;
  function wobble(phase, amt, t) {
    var r = [];
    for (var i = 0; i < 8; i++) r.push((50 + Math.sin(t * 0.004 + i * 1.7 + phase) * amt).toFixed(1) + '%');
    return r.slice(0, 4).join(' ') + ' / ' + r.slice(4).join(' ');
  }

  function tick(now) {
    var dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016; last = now;
    if (rm) { dx = x; dy = y; }
    else {
      vx += ((x - dx) * SPRING * SPRING - 2 * SPRING * vx) * dt; dx += vx * dt;
      vy += ((y - dy) * SPRING * SPRING - 2 * SPRING * vy) * dt; dy += vy * dt;
    }
    var goal = (hot ? 1.7 : 1) * (press ? 0.75 : 1);
    size += (goal - size) * (rm ? 1 : 0.2);

    if (px0 === null) { px0 = x; py0 = y; ox = x; oy = y; }
    var mvx = (x - px0) / dt, mvy = (y - py0) / dt; px0 = x; py0 = y;
    var spd = Math.sqrt(mvx * mvx + mvy * mvy);                 // pointer speed, px per second
    // The dot rides its own quick, slightly bouncy spring: it trails the
    // pointer by a few pixels and overshoots a touch when you stop, like a drop.
    if (rm) { ox = x; oy = y; ovx = ovy = 0; }
    else for (var l2 = dt; l2 > 0; l2 -= 0.008) {
      var h2 = Math.min(0.008, l2);
      ovx += ((x - ox) * 1300 - ovx * 40) * h2; ox += ovx * h2;
      ovy += ((y - oy) * 1300 - ovy * 40) * h2; oy += ovy * h2;
    }
    var osp = Math.sqrt(ovx * ovx + ovy * ovy);
    if (osp > 40) dang = Math.atan2(ovy, ovx) * 180 / Math.PI;
    var aim = rm ? 0 : Math.min(osp / 1500, 0.7);
    for (var left = dt; left > 0; left -= 0.008) {
      var h = Math.min(0.008, left);
      dsv += ((aim - dst) * 220 - dsv * 14) * h; dst += dsv * h;
    }
    var lx = x - dx, ly = y - dy, lag = Math.sqrt(lx * lx + ly * ly);
    var pull = rm ? 0 : Math.min(lag / 70, 0.55), lang = Math.atan2(ly, lx) * 180 / Math.PI;
    energy += ((rm ? 0 : Math.min(spd / 1500, 1)) - energy) * 0.08;
    var t = now - t0, p = press ? 0.8 : 1;

    dot.style.transform = 'translate3d(' + ox.toFixed(1) + 'px,' + oy.toFixed(1) + 'px,0) rotate(' + dang.toFixed(1) + 'deg) scale(' + ((1 + dst) * p).toFixed(3) + ',' + ((1 - dst * 0.5) * p).toFixed(3) + ')';
    disc.style.transform = 'translate3d(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px,0) rotate(' + lang.toFixed(1) + 'deg) scale(' + (size * (1 + pull)).toFixed(3) + ',' + (size * (1 - pull * 0.4)).toFixed(3) + ')';
    disc.style.borderRadius = rm ? '50%' : wobble(0, 6 + energy * 14, t);
    dot.style.borderRadius = rm ? '50%' : wobble(2, 8 + energy * 16, t);
  }
  (function frame(now) { if (now) tick(now); requestAnimationFrame(frame); })();

  // Test hooks: read the state, or advance one frame by hand.
  window.__ekCursor = function () { return { x: x, y: y, dx: dx, dy: dy, size: size, hot: hot, on: on, stretch: dst, energy: energy, ox: ox, oy: oy, dotR: dot.style.borderRadius, dotT: dot.style.transform, discT: disc.style.transform, discR: disc.style.borderRadius }; };
  window.__ekCursorStep = tick;
})();

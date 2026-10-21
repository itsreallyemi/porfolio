/* The EK blob: the morphing shape from emikobayashi.com, rebuilt.

   Same outlines and colours as the live site's theme. Three changes:
   - It blends continuously with scroll position instead of jumping per section,
     so the shape is always somewhere between where you were and where you are going.
   - A second, softer blob sits behind it at a different rate, for depth.
   - It leans a little toward a fine pointer.

   Markup: <svg class="blob" data-blob> with <g class="blob__back"><path/></g> and
   <g class="blob__front"><path/></g>. Sections opt in with data-blob-at="0..n"
   and optionally data-blob-side="left|right|center" to park the blob behind
   that section's image. */
(function () {
  'use strict';

  var P = {
    a:  'M 262.9,252.2 C 210.1,338.2 212.6,487.6 288.8,553.9 372.2,626.5 511.2,517.8 620.3,536.3 750.6,558.4 860.3,723 987.3,686.5 1089,657.3 1168,534.7 1173,429.2 1178,313.7 1096,189.1 995.1,130.7 852.1,47.07 658.8,78.95 498.1,119.2 410.7,141.1 322.6,154.8 262.9,252.2 Z',
    aa: 'M 262.9,252.2 C 210.1,338.2 273.3,400.5 298.5,520 323.7,639.6 511.2,537.2 620.3,555.7 750.6,577.8 872.2,707.4 987.3,686.5 1102,665.6 1218,547.8 1173,429.2 1128,310.6 1096,189.1 995.1,130.7 852.1,47.07 658.8,78.95 498.1,119.2 410.7,141.1 322.6,154.8 262.9,252.2 Z',
    b:  'M 415.6,206.3 C 407.4,286.6 438.1,373.6 496.2,454.8 554.3,536.1 497,597.2 579.7,685.7 662.4,774.1 834.3,731.7 898.5,653.4 962.3,575 967.1,486 937.7,370 909.3,253.9 937.7,201.5 833.4,105.4 729.3,9.338 602.2,13.73 530.6,41.91 459,70.08 423.9,126.1 415.6,206.3 Z',
    ba: 'M 415.6,206.3 C 407.4,286.6 415.5,381.7 473.6,462.9 531.7,544.2 482.5,637.6 579.7,685.7 676.9,733.8 826.2,710.7 890.4,632.4 954.2,554 926.8,487.6 937.7,370 948.6,252.4 937.7,201.5 833.4,105.4 729.3,9.338 602.2,13.73 530.6,41.91 459,70.08 423.9,126.1 415.6,206.3 Z',
    c:  'M 383.8,163.4 C 335.8,352.3 591.6,317.1 608.7,420.8 625.8,524.5 580.5,626 647.3,688 714,750 837.1,760.5 940.9,661.5 1044,562.3 1041,455.8 975.8,393.6 909.8,331.5 854.2,365.4 784.4,328.1 714.6,290.8 771.9,245.2 733.1,132.4 694.2,19.52 431.9,-25.48 383.8,163.4 Z',
    ca: 'M 383.8,163.4 C 345.5,324.9 591.6,317.1 608.7,420.8 625.8,524.5 595.1,597 647.3,688 699.5,779 837.1,760.5 940.9,661.5 1044,562.3 1068,444.4 975.8,393.6 884,342.8 854.2,365.4 784.4,328.1 714.6,290.8 820.3,237.2 733.1,132.4 645.9,27.62 422.1,1.919 383.8,163.4 Z'
  };
  // The live theme's six states and colours, in its order.
  var STATES = [
    { d: 'a', sx: 1.3, sy: 1.8, r: 70,  tx: 0,    ty: -100, fill: '#f07a3a' },
    { d: 'b', sx: 1.9, sy: 1.0, r: 0,   tx: 0,    ty: 100,  fill: '#f54da2' },
    { d: 'c', sx: 1.9, sy: 1.1, r: 40,  tx: -100, ty: 200,  fill: '#19bb73' },
    { d: 'a', sx: 1.5, sy: 2.0, r: -20, tx: 0,    ty: -50,  fill: '#64bffe' },
    { d: 'a', sx: 1.3, sy: 1.0, r: -70, tx: 0,    ty: 150,  fill: '#f54da2' },
    { d: 'b', sx: 2.0, sy: 1.0, r: 0,   tx: 0,    ty: 100,  fill: '#ff7563' }
  ];

  function nums(s) { return s.match(/-?\d+(?:\.\d+)?/g).map(Number); }
  var N = {}; Object.keys(P).forEach(function (k) { N[k] = nums(P[k]); });
  function toPath(v) {
    // M x,y C then 21 pairs, Z. Every outline shares this layout.
    var s = 'M ' + v[0].toFixed(1) + ',' + v[1].toFixed(1) + ' C';
    for (var i = 2; i < v.length; i += 2) s += ' ' + v[i].toFixed(1) + ',' + v[i + 1].toFixed(1);
    return s + ' Z';
  }
  function mix(a, b, t) { var o = new Array(a.length); for (var i = 0; i < a.length; i++) o[i] = a[i] + (b[i] - a[i]) * t; return o; }
  function hex(h) { h = h.replace('#', ''); return [0, 2, 4].map(function (i) { return parseInt(h.substr(i, 2), 16); }); }
  function rgb(c) { return 'rgb(' + c.map(function (x) { return Math.round(x); }).join(',') + ')'; }
  var clamp = function (x, a, b) { return x < a ? a : x > b ? b : x; };
  var ease = function (x) { x = clamp(x, 0, 1); return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; };

  window.EKBlob = function (svg, opts) {
    opts = opts || {};
    var ground = hex(opts.ground || '#e8e8e6');
    var front = svg.querySelector('.blob__front'), back = svg.querySelector('.blob__back');
    var fp = front.querySelector('path'), bp = back.querySelector('path');
    var rm = !!opts.reduce;
    var fine = matchMedia('(hover: hover) and (pointer: fine)').matches && !rm;
    var marks = [].slice.call(document.querySelectorAll('[data-blob-at]'));
    var mx = 0, my = 0, tx = 0, ty = 0, t0 = performance.now();
    // The cursor, in screen pixels, and whether the button is held.
    var px = 0, py = 0, hasPointer = false, held = false;
    if (fine) {
      addEventListener('pointermove', function (e) {
        tx = e.clientX / innerWidth - 0.5; ty = e.clientY / innerHeight - 0.5;
        px = e.clientX; py = e.clientY; hasPointer = true;
      }, { passive: true });
      document.documentElement.addEventListener('mouseleave', function () { hasPointer = false; held = false; });
      addEventListener('pointerdown', function (e) { if (e.button === 0) held = true; });
      addEventListener('pointerup', function () { held = false; });
      addEventListener('blur', function () { held = false; });
    }

    // Jelly: every point of the outline has its own small offset on an
    // underdamped spring. The cursor pulls nearby points toward it (harder while
    // the button is held), scrolling jolts alternate points, and releasing lets
    // the shape wobble back into place.
    var jo = new Array(44).fill(0), jv = new Array(44).fill(0), jellySY = scrollY;
    function jelly(d, dt) {
      var lp = null, m = fp.getScreenCTM();
      if (hasPointer && m) lp = new DOMPoint(px, py).matrixTransform(m.inverse());
      var reach = held ? 0.6 : 0.45, R = held ? 460 : 320, cap = held ? 260 : 170;
      var dy = scrollY - jellySY; jellySY = scrollY;
      var kick = Math.max(-40, Math.min(40, dy)) * 0.9;
      for (var j = 0; j < d.length; j += 2) {
        var gx = 0, gy = 0;
        if (lp) {
          var ddx = lp.x - d[j], ddy = lp.y - d[j + 1];
          var f = reach * Math.exp(-(ddx * ddx + ddy * ddy) / (R * R));
          gx = ddx * f; gy = ddy * f;
          var len = Math.sqrt(gx * gx + gy * gy);
          if (len > cap) { gx *= cap / len; gy *= cap / len; }
        }
        jv[j + 1] += (j % 4 ? kick : -kick);
        for (var left = dt; left > 0; left -= 0.008) {
          var h = Math.min(0.008, left);
          jv[j] += ((gx - jo[j]) * 110 - jv[j] * 9) * h; jo[j] += jv[j] * h;
          jv[j + 1] += ((gy - jo[j + 1]) * 110 - jv[j + 1] * 9) * h; jo[j + 1] += jv[j + 1] * h;
        }
      }
      var out = new Array(d.length);
      for (var i = 0; i < d.length; i++) out[i] = d[i] + jo[i];
      return out;
    }

    function stateFor(el) {
      var s = STATES[(parseInt(el.getAttribute('data-blob-at'), 10) || 0) % STATES.length];
      var side = el.getAttribute('data-blob-side') || 'center';
      var narrow = innerWidth < 861;
      // Park the blob behind the image on wide screens.
      var off = narrow ? 0 : side === 'left' ? -380 : side === 'right' ? 380 : 0;
      // On a portrait phone the viewBox is cropped to its middle quarter, so the
      // blob needs a much smaller scale to sit behind the image only.
      var k = narrow ? 0.23 : 0.5;
      // On phones, sections stack at different heights, so follow the section's
      // own image instead of a fixed point. No image means the corner.
      var media = narrow && el.querySelector('.c-media, .c-hero__media, .proj__media, .xr__scene');
      if (narrow && !media) side = 'corner';
      // 'corner' tucks the blob into the bottom-right for text-heavy sections.
      if (side === 'corner') return { d: s.d, sx: s.sx * k * 0.75, sy: s.sy * k * 0.75, r: s.r, tx: narrow ? 330 : 860, ty: narrow ? 430 : 520, fill: hex(s.fill) };
      if (media) {
        var r = media.getBoundingClientRect(), W = innerWidth, H = innerHeight;
        var sc = Math.max(W / 1400, H / 770), ox = (W - 1400 * sc) / 2, oy = (H - 770 * sc) / 2;
        return { d: s.d, sx: s.sx * k, sy: s.sy * k, r: s.r, tx: (r.left + r.width / 2 - ox) / sc - 700, ty: (r.top + r.height * 0.42 - oy) / sc - 385, fill: hex(s.fill) };
      }
      return { d: s.d, sx: s.sx * k, sy: s.sy * k, r: s.r, tx: s.tx * 0.5 + off, ty: s.ty * 0.5, fill: hex(s.fill) };
    }

    // What is on screen follows the scroll-driven target on a critically damped
    // spring: it starts gently, glides, and settles without overshoot, so a
    // fast flick still reads as one slow, smooth move instead of a sweep.
    var cur = null, curBack = null, vel = null, velBack = null, lastT = 0, OMEGA = 3.2;
    function spring(c, v, t, dt) {
      for (var key in t) {
        if (Array.isArray(t[key])) {
          for (var j = 0; j < t[key].length; j++) {
            v[key][j] += ((t[key][j] - c[key][j]) * OMEGA * OMEGA - 2 * OMEGA * v[key][j]) * dt;
            c[key][j] += v[key][j] * dt;
          }
        } else {
          v[key] += ((t[key] - c[key]) * OMEGA * OMEGA - 2 * OMEGA * v[key]) * dt;
          c[key] += v[key] * dt;
        }
      }
    }
    function copy(t, zero) { var c = {}; for (var key in t) c[key] = Array.isArray(t[key]) ? t[key].map(function (x) { return zero ? 0 : x; }) : (zero ? 0 : t[key]); return c; }

    function frame(now, once, snap) {
      // The section under the viewport centre owns the blob. The hand-off is
      // centred on the boundary between two sections and most of a viewport
      // wide, so the change is spread over a long stretch of scroll.
      var y = innerHeight * 0.5, i = 0, k = 0, half = innerHeight * 0.4;
      for (var n = 0; n < marks.length; n++) {
        if (marks[n].getBoundingClientRect().top <= y) i = n;
      }
      var a = marks[i], b = a;
      if (!rm) {
        var next = marks[i + 1], dNext = next ? next.getBoundingClientRect().top - y : Infinity;
        var dCur = y - a.getBoundingClientRect().top;
        if (dNext < half) { b = next; k = ease(0.5 - dNext / (half * 2)); }
        else if (i > 0 && dCur < half) { b = a; a = marks[i - 1]; k = ease(0.5 + dCur / (half * 2)); }
      }
      var A = stateFor(a), B = stateFor(b);
      // The breath: the theme's path to pathAlt loop, 3s round trip.
      var breath = rm ? 0 : (Math.sin((now - t0) / 3000 * Math.PI * 2) + 1) / 2;
      var dA = mix(N[A.d], N[A.d + 'a'], breath), dB = mix(N[B.d], N[B.d + 'a'], breath);
      mx += (tx - mx) * 0.05; my += (ty - my) * 0.05;
      var target = {
        d: mix(dA, dB, k), fill: mix(A.fill, B.fill, k),
        sx: A.sx + (B.sx - A.sx) * k, sy: A.sy + (B.sy - A.sy) * k, r: A.r + (B.r - A.r) * k,
        tx: A.tx + (B.tx - A.tx) * k, ty: A.ty + (B.ty - A.ty) * k
      };
      var targetBack = { d: mix(dB, dA, 0.35 + breath * 0.3) };
      var dt = lastT ? Math.min(0.05, (now - lastT) / 1000) : 0; lastT = now;
      if (rm || snap || !cur) {
        cur = copy(target); curBack = copy(targetBack); vel = copy(target, true); velBack = copy(targetBack, true);
      } else {
        // Sub-step long frames so the spring stays stable on slow devices.
        for (var left = dt; left > 0; left -= 0.016) {
          var h = Math.min(0.016, left);
          spring(cur, vel, target, h); spring(curBack, velBack, targetBack, h);
        }
      }
      var S = cur, d = cur.d, fill = cur.fill;
      if (fine && !snap) d = jelly(d, dt);
      fp.setAttribute('d', toPath(d));
      fp.style.fill = rgb(fill);
      front.setAttribute('transform', 'translate(' + (700 + S.tx + mx * 40).toFixed(1) + ' ' + (385 + S.ty + my * 30).toFixed(1) + ') rotate(' + S.r.toFixed(2) + ') scale(' + S.sx.toFixed(3) + ' ' + S.sy.toFixed(3) + ') translate(-700 -385)');
      // The back blob: the next state's shape, larger, ground-tinted, lagging and counter-leaning.
      bp.setAttribute('d', toPath(curBack.d));
      bp.style.fill = rgb(mix(fill, ground, 0.72));
      back.setAttribute('transform', 'translate(' + (700 + S.tx * 0.6 - mx * 30 + 60).toFixed(1) + ' ' + (385 + S.ty * 0.6 - my * 24 + 40).toFixed(1) + ') rotate(' + (S.r * 0.8 - 12).toFixed(2) + ') scale(' + (S.sx * 1.18).toFixed(3) + ' ' + (S.sy * 1.18).toFixed(3) + ') translate(-700 -385)');
      svg.style.setProperty('--blob', rgb(fill));
      if (!rm && !once) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    // Test hook: draw one frame now, without starting a second loop.
    svg.__ekblob = { render: function () { frame(performance.now(), true, true); }, step: function (t) { frame(t, true); }, path: fp,
      offset: function () { return Math.max.apply(null, jo.map(Math.abs)); } };
    if (rm) { addEventListener('scroll', function () { requestAnimationFrame(function (t) { frame(t, true); }); }, { passive: true }); addEventListener('resize', function () { requestAnimationFrame(function (t) { frame(t, true); }); }); }
  };
})();

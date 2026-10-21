/* Case study pages: the bar, the chapter folio and panel, the blob,
   the before/after slider and click-to-load videos. Load after scrollcraft.js
   and blob.js. */
(function () {
  'use strict';
  var root = document.documentElement;
  var rm = root.classList.contains('rm');

  ScrollCraft.mount(document.body);
  EKBlob(document.querySelector('.blob'), { reduce: rm, ground: '#3b2182' });

  /* Folio: the current section number and title in the bar. */
  var secs = [].slice.call(document.querySelectorAll('[data-title]'));
  var num = document.getElementById('folio-num'), title = document.getElementById('folio-title');
  var project = num.textContent, last = -2;
  function track() {
    var y = innerHeight * 0.4, cur = -1;
    secs.forEach(function (c, i) { if (c.getBoundingClientRect().top <= y) cur = i; });
    if (cur === last) return; last = cur;
    if (cur < 0) { num.textContent = project; title.textContent = 'Case study'; }
    else { num.textContent = 'Section ' + (cur + 1); title.textContent = secs[cur].getAttribute('data-title'); }
  }
  var bar = document.getElementById('bar'), lastY = -1;
  (function poll() {
    if (scrollY !== lastY) { lastY = scrollY; track(); bar.classList.toggle('is-solid', scrollY > 24); }
    requestAnimationFrame(poll);
  })();

  /* Before and after: one real image, two crops, a range input as the handle. */
  [].forEach.call(document.querySelectorAll('.compare'), function (cmp) {
    var range = cmp.querySelector('input');
    function set() { cmp.style.setProperty('--x', range.value + '%'); }
    range.addEventListener('input', set); set();
  });

  /* Videos: a still until clicked, then the YouTube player. Where embedding is
     not allowed (the hosted share link sets data-videos="link" on <html>),
     each video is a "Watch on YouTube" link that opens in a new tab instead. */
  var linkOnly = root.getAttribute('data-videos') === 'link';
  [].forEach.call(document.querySelectorAll('.c-video[data-yt]'), function (box) {
    var id = box.getAttribute('data-yt'), label = box.getAttribute('data-label') || 'video';
    if (linkOnly) {
      var a = document.createElement('a');
      a.className = 'c-video__link'; a.href = 'https://www.youtube.com/watch?v=' + id;
      a.target = '_blank'; a.rel = 'noopener';
      a.innerHTML = '<span class="c-video__play" aria-hidden="true"></span><span class="c-video__label">Watch on YouTube</span>';
      a.setAttribute('aria-label', 'Watch ' + label + ' on YouTube (opens in a new tab)');
      box.appendChild(a);
      return;
    }
    var b = document.createElement('button');
    b.type = 'button'; b.setAttribute('aria-label', 'Play ' + label);
    var img = document.createElement('img');
    img.src = 'https://i.ytimg.com/vi/' + id + '/hqdefault.jpg'; img.alt = ''; img.loading = 'lazy';
    b.appendChild(img); box.appendChild(b);
    b.addEventListener('click', function () {
      var f = document.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0';
      f.title = label; f.allow = 'autoplay; encrypted-media; picture-in-picture'; f.allowFullscreen = true;
      box.replaceChildren(f); f.focus();
    });
  });
})();

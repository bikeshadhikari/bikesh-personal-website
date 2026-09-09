/* Public site behaviour. No dependencies. */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- theme toggle ---------------------------------------------------- */
  var toggle = document.getElementById('themeToggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) {}
    });
  }

  /* ---- mobile navigation ----------------------------------------------- */
  var navToggle = document.getElementById('navToggle');
  var nav = document.getElementById('siteNav');
  if (navToggle && nav) {
    navToggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(open));
      navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        nav.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        nav.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.focus();
      }
    });
  }

  /* ---- sticky header + scroll progress + back to top ------------------- */
  var header = document.getElementById('siteHeader');
  var progress = document.getElementById('scrollProgress');
  var toTop = document.getElementById('toTop');
  var ticking = false;

  function onScroll() {
    var y = window.scrollY || document.documentElement.scrollTop;
    if (header) header.classList.toggle('is-stuck', y > 8);
    if (progress) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
    }
    if (toTop) toTop.classList.toggle('is-visible', y > 600);
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { window.requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();

  if (toTop) {
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  /* ---- role rotator ----------------------------------------------------- */
  var rotator = document.querySelector('.rotator');
  if (rotator && !reduceMotion) {
    var roles = [];
    try { roles = JSON.parse(rotator.getAttribute('data-roles') || '[]'); } catch (e) {}
    var textEl = rotator.querySelector('.rotator-text');
    if (roles.length > 1 && textEl) {
      var idx = 0, chars = roles[0].length, deleting = false;
      var tick = function () {
        var word = roles[idx];
        chars += deleting ? -1 : 1;
        textEl.textContent = word.slice(0, chars);
        var delay = deleting ? 45 : 85;
        if (!deleting && chars === word.length) { deleting = true; delay = 1800; }
        else if (deleting && chars === 0) { deleting = false; idx = (idx + 1) % roles.length; delay = 260; }
        setTimeout(tick, delay);
      };
      setTimeout(tick, 2000);
    }
  }

  /* ---- reveal on scroll, skill bars, counters --------------------------- */
  var revealTargets = document.querySelectorAll(
    '.section-head, .card, .timeline-item, .highlight-card, .cert-item, .skill-group, .process-list li'
  );
  revealTargets.forEach(function (el) { el.classList.add('reveal'); });

  function animateCounter(el) {
    var raw = String(el.getAttribute('data-target') || el.textContent).replace(/[^0-9.]/g, '');
    var target = parseFloat(raw);
    if (isNaN(target)) return;
    if (reduceMotion) { el.textContent = raw; return; }
    var start = null, duration = 1400;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased).toLocaleString();
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        entry.target.querySelectorAll('.skill-bar').forEach(function (b) { b.classList.add('is-visible'); });
        var counter = entry.target.querySelector('.counter');
        if (counter && !counter.dataset.done) { counter.dataset.done = '1'; animateCounter(counter); }
        io.unobserve(entry.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    revealTargets.forEach(function (el) { io.observe(el); });
  } else {
    revealTargets.forEach(function (el) { el.classList.add('is-visible'); });
    document.querySelectorAll('.skill-bar').forEach(function (b) { b.classList.add('is-visible'); });
  }

  /* ---- copy link -------------------------------------------------------- */
  var copyBtn = document.querySelector('.copy-link');
  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      var url = copyBtn.getAttribute('data-url');
      var done = function () {
        var original = copyBtn.textContent;
        copyBtn.textContent = 'Link copied';
        setTimeout(function () { copyBtn.textContent = original; }, 1800);
      };
      if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(done).catch(done);
      } else {
        var t = document.createElement('textarea');
        t.value = url; document.body.appendChild(t); t.select();
        try { document.execCommand('copy'); } catch (e) {}
        document.body.removeChild(t); done();
      }
    });
  }

  /* ---- newsletter (posts without leaving the page) ---------------------- */
  var form = document.getElementById('newsletterForm');
  if (form) {
    var note = document.getElementById('newsletterNote');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var button = form.querySelector('button[type="submit"]');
      button.disabled = true;
      note.className = 'form-note';
      note.textContent = 'Sending…';
      fetch(form.action, { method: 'POST', body: new FormData(form), headers: { 'X-Requested-With': 'fetch' } })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          note.textContent = data.message;
          note.className = 'form-note ' + (data.ok ? 'is-ok' : 'is-error');
          if (data.ok) form.reset();
        })
        .catch(function () {
          note.textContent = 'Something went wrong. Please try again.';
          note.className = 'form-note is-error';
        })
        .finally(function () { button.disabled = false; });
    });
  }
})();

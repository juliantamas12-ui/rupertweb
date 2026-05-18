// ═══════════════════ THE PRAEFATIO - shared scripts ═══════════════════

// ── Ferrari intro overlay (once per session) ──
(function(){
  const overlay = document.getElementById('introOverlay');
  if (!overlay) return;
  let seen = false;
  try { seen = sessionStorage.getItem('praefatio_intro_seen') === '1'; } catch {}
  if (seen) {
    overlay.classList.add('skip');
  } else {
    setTimeout(() => {
      overlay.classList.add('gone');
      try { sessionStorage.setItem('praefatio_intro_seen', '1'); } catch {}
    }, 1800);
  }
  overlay.addEventListener('click', () => overlay.classList.add('gone'));
})();

// ── Mobile nav burger ──
(function(){
  const burger = document.getElementById('navBurger');
  const tabs = document.querySelector('.nav-tabs');
  if (!burger || !tabs) return;
  burger.addEventListener('click', () => tabs.classList.toggle('open'));
  // Close menu on tab click
  tabs.querySelectorAll('a').forEach(a => a.addEventListener('click', () => tabs.classList.remove('open')));
})();

// ── Reveal-on-scroll ──
(function(){
  const els = document.querySelectorAll('[data-reveal]');
  if (!els.length) return;
  const io = new IntersectionObserver((entries) => {
    for (const e of entries){
      if (e.isIntersecting){ e.target.classList.add('visible'); io.unobserve(e.target); }
    }
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  els.forEach(el => io.observe(el));
})();

// ── Mark current page tab as active based on URL ──
(function(){
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  document.querySelectorAll('.nav-tabs .tab').forEach(a => {
    const href = a.getAttribute('href').replace(/\/$/, '') || '/';
    a.classList.toggle('active', href === path);
  });
})();

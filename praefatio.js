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

// ── Per-word reveal on every body paragraph as it scrolls into view ──
(function(){
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  // Wrap each word in every <p> / .hero-strap / .strap / .lede / .cine-block .lede into spans
  const targets = document.querySelectorAll('.page p, .hero-strap, .strap, .cine-block .lede, .teaser-right p, .rail-card .body p');
  for (const el of targets){
    // Don't double-wrap; preserve inline children like <em> <strong>
    if (el.dataset.wordWrapped) continue;
    el.dataset.wordWrapped = '1';
    const html = el.innerHTML;
    // Split on spaces, preserving HTML tags. Simple approach: tokenise text nodes only.
    const walk = (node) => {
      if (node.nodeType === 3){
        const words = node.textContent.split(/(\s+)/);
        const frag = document.createDocumentFragment();
        for (const w of words){
          if (!w) continue;
          if (/^\s+$/.test(w)){ frag.appendChild(document.createTextNode(w)); }
          else { const span = document.createElement('span'); span.className='word-reveal'; span.textContent=w; frag.appendChild(span); }
        }
        node.parentNode.replaceChild(frag, node);
      } else if (node.nodeType === 1 && !node.matches('.word-reveal')){
        Array.from(node.childNodes).forEach(walk);
      }
    };
    walk(el);
  }
  // Reveal each .word-reveal staggered when its parent paragraph enters view
  const io = new IntersectionObserver((entries) => {
    for (const e of entries){
      if (!e.isIntersecting) continue;
      const words = e.target.querySelectorAll('.word-reveal');
      words.forEach((w,i) => {
        const delay = Math.min(i * 24, 800);
        setTimeout(() => w.classList.add('shown'), delay);
      });
      io.unobserve(e.target);
    }
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  targets.forEach(t => io.observe(t));
})();

// ── Magnetic hover on every interactive element ──
(function(){
  if (window.matchMedia('(prefers-reduced-motion: reduce), (hover: none)').matches) return;
  const targets = document.querySelectorAll('a:not(.no-magnetic), button:not(.no-magnetic), .cine-cta, .btn-primary, .btn-ghost');
  for (const el of targets){
    el.classList.add('magnetic');
    const strength = 0.25;
    let raf = null;
    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left - r.width/2;
      const y = e.clientY - r.top - r.height/2;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.transform = `translate(${x*strength}px, ${y*strength}px)`;
      });
    });
    el.addEventListener('mouseleave', () => {
      cancelAnimationFrame(raf);
      el.style.transform = '';
    });
  }
})();

// ── Custom cursor (gold dot + ring, grows over interactive elements) ──
(function(){
  if (window.matchMedia('(prefers-reduced-motion: reduce), (hover: none), (pointer: coarse)').matches) return;
  const dot = document.createElement('div'); dot.className = 'cursor-dot';
  const ring = document.createElement('div'); ring.className = 'cursor-ring';
  document.body.appendChild(dot);
  document.body.appendChild(ring);

  let dx=window.innerWidth/2, dy=window.innerHeight/2;
  let rx=dx, ry=dy;
  let active = false;

  window.addEventListener('mousemove', (e) => {
    dx = e.clientX; dy = e.clientY;
    if (!document.documentElement.classList.contains('cursor-ready')){
      document.documentElement.classList.add('cursor-ready');
    }
    // Check if hovering an interactive element
    const t = e.target;
    const inter = t && (t.closest('a, button, .magnetic, input, textarea, select') !== null);
    if (inter !== active){
      active = inter;
      document.documentElement.classList.toggle('cursor-active', active);
    }
  }, { passive: true });

  // Smooth ring follow (10% lerp per frame)
  function loop(){
    rx += (dx - rx) * 0.18;
    ry += (dy - ry) * 0.18;
    dot.style.transform = `translate(${dx}px, ${dy}px)`;
    ring.style.transform = `translate(${rx}px, ${ry}px)`;
    requestAnimationFrame(loop);
  }
  loop();

  // Hide custom cursor when window loses focus
  window.addEventListener('blur', () => document.documentElement.classList.remove('cursor-ready'));
  window.addEventListener('focus', () => document.documentElement.classList.add('cursor-ready'));
})();

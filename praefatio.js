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

// Custom cursor removed - Julian disliked the gold dot/ring.

// ── Feadship-style drawer menu ──
(function(){
  const trigger = document.getElementById('menuTrigger');
  const drawer = document.getElementById('menuDrawer');
  if (!trigger || !drawer) return;
  const open = () => {
    drawer.classList.add('open');
    trigger.classList.add('open');
    trigger.setAttribute('aria-expanded','true');
    drawer.setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
  };
  const close = () => {
    drawer.classList.remove('open');
    trigger.classList.remove('open');
    trigger.setAttribute('aria-expanded','false');
    drawer.setAttribute('aria-hidden','true');
    document.body.style.overflow = '';
  };
  trigger.addEventListener('click', () => drawer.classList.contains('open') ? close() : open());
  drawer.querySelector('.backdrop').addEventListener('click', close);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && drawer.classList.contains('open')) close(); });
  // Mark the current page's item as active
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  drawer.querySelectorAll('.item').forEach(a => {
    const href = a.getAttribute('href').replace(/\/$/, '') || '/';
    a.classList.toggle('active', href === path);
  });
})();

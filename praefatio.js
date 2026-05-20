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
    }, 1000);
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

// Magnetic hover effect removed - Julian disliked the dragging.

// Custom cursor removed - Julian disliked the gold dot/ring.

// ── SUB-PAGE MOTION (about/method/targets/editors/contact) ──
(function(){
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) return;

  // 1. Split H1 into per-character spans with stagger
  const h1 = document.querySelector('.page h1');
  if (h1 && !h1.dataset.charSplit){
    h1.dataset.charSplit = '1';
    const walk = (node) => {
      if (node.nodeType === 3){
        const chars = [...node.textContent];
        const frag = document.createDocumentFragment();
        chars.forEach((c,i) => {
          if (c === ' '){
            const sp = document.createElement('span'); sp.className='char space'; frag.appendChild(sp);
          } else {
            const sp = document.createElement('span'); sp.className='char'; sp.textContent=c; frag.appendChild(sp);
          }
        });
        node.parentNode.replaceChild(frag, node);
      } else if (node.nodeType === 1){
        Array.from(node.childNodes).forEach(walk);
      }
    };
    walk(h1);
    // Stagger animation delays
    const all = h1.querySelectorAll('.char');
    all.forEach((c,i) => { c.style.animationDelay = (i * 22) + 'ms'; });
    // Strap appears after the H1 is done
    const strap = document.querySelector('.page .strap');
    if (strap) strap.style.animationDelay = (all.length * 22 + 200) + 'ms';
  }

  // 2. Draw the underline beneath h2s as they enter view
  const h2s = document.querySelectorAll('.page h2');
  if (h2s.length){
    const io = new IntersectionObserver((entries) => {
      for (const e of entries){
        if (e.isIntersecting){ e.target.classList.add('draw'); io.unobserve(e.target); }
      }
    }, { threshold: 0.4 });
    h2s.forEach(el => io.observe(el));
  }

  // 3. Method items - staggered reveal
  const methods = document.querySelectorAll('.method-item');
  if (methods.length){
    const io = new IntersectionObserver((entries) => {
      for (const e of entries){
        if (e.isIntersecting){ e.target.classList.add('in-view'); io.unobserve(e.target); }
      }
    }, { threshold: 0.25, rootMargin: '0px 0px -40px 0px' });
    methods.forEach(el => io.observe(el));
  }

  // 4. Editor cards - Polaroid develop
  const editors = document.querySelectorAll('.editor');
  if (editors.length){
    const io = new IntersectionObserver((entries) => {
      for (const e of entries){
        if (e.isIntersecting){ e.target.classList.add('in-view'); io.unobserve(e.target); }
      }
    }, { threshold: 0.3 });
    editors.forEach(el => io.observe(el));
  }

  // 5. Typewriter for /about quote
  const quote = document.querySelector('.page .quote');
  if (quote){
    // The quote has a text node + an <em> + a <span class="cite">. Isolate the quote text first.
    const cite = quote.querySelector('.cite');
    // Collect text + em segments
    const fragments = [];
    Array.from(quote.childNodes).forEach(n => {
      if (n === cite) return;
      if (n.nodeType === 3){ fragments.push({type:'text', value:n.textContent}); }
      else if (n.nodeType === 1 && n.tagName !== 'SPAN'){ fragments.push({type:'tag', value:n.outerHTML, plain:n.textContent}); }
    });
    // Wipe the original content (keep cite) and rebuild with a cursor
    quote.innerHTML = '';
    const target = document.createElement('span'); quote.appendChild(target);
    const cursor = document.createElement('span'); cursor.className='typing-cursor'; quote.appendChild(cursor);
    if (cite) quote.appendChild(cite);

    // Trigger typing when scrolled into view
    const io = new IntersectionObserver((entries,obs) => {
      for (const e of entries){
        if (!e.isIntersecting) continue;
        obs.unobserve(e.target);
        let frags = fragments.slice();
        let cur = '';
        function step(){
          if (!frags.length){ quote.classList.add('done'); return; }
          const f = frags[0];
          if (f.type === 'text'){
            if (!f.value.length){ frags.shift(); step(); return; }
            cur += f.value[0];
            f.value = f.value.slice(1);
            target.textContent = cur;
            setTimeout(step, 28);
          } else {
            // tag - inject whole HTML in one go (em accent words)
            cur += f.value;
            target.innerHTML = cur;
            frags.shift();
            setTimeout(step, 60);
          }
        }
        step();
      }
    }, { threshold: 0.5 });
    io.observe(quote);
  }
})();

// ── Ambient sound toggle (opt-in, off by default, remembers choice) ──
(function(){
  const btn = document.getElementById('soundToggle');
  const audio = document.getElementById('ambientAudio');
  if (!btn || !audio) return;
  audio.volume = 0.18;
  const KEY = 'praefatio_ambient_on';
  let on = false;
  try { on = localStorage.getItem(KEY) === '1'; } catch {}
  function apply(){
    btn.classList.toggle('on', on);
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    if (on){
      audio.play().catch(() => { /* autoplay blocked - user will click to enable */ });
    } else {
      audio.pause();
    }
  }
  // Don't autoplay on first visit even if user previously had it on - browsers block this
  // Only resume if user has interacted with the site this session
  let userInteracted = false;
  const markInteracted = () => { userInteracted = true; if (on) audio.play().catch(()=>{}); window.removeEventListener('click', markInteracted); window.removeEventListener('keydown', markInteracted); };
  window.addEventListener('click', markInteracted, { once: true });
  window.addEventListener('keydown', markInteracted, { once: true });
  btn.classList.toggle('on', on);
  btn.addEventListener('click', () => {
    on = !on;
    try { localStorage.setItem(KEY, on ? '1' : '0'); } catch {}
    apply();
  });
})();

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
  const items = drawer.querySelectorAll('.item');
  items.forEach(a => {
    const href = a.getAttribute('href').replace(/\/$/, '') || '/';
    a.classList.toggle('active', href === path);
  });

  // Hover any item -> update the right column preview
  const meta = document.getElementById('menuMeta');
  if (meta){
    const label = meta.querySelector('.meta-label');
    const title = meta.querySelector('.meta-title');
    const desc = meta.querySelector('.meta-desc');
    // Capture defaults
    const defaults = {
      label: label.textContent,
      title: title.textContent,
      desc: desc.textContent,
    };
    function setMeta(itemEl){
      // Brief fade transition
      [label, title, desc].forEach(el => el.classList.add('meta-fading'));
      setTimeout(() => {
        label.textContent = itemEl.dataset.label || defaults.label;
        title.textContent = itemEl.dataset.title || defaults.title;
        desc.textContent  = itemEl.dataset.desc  || defaults.desc;
        [label, title, desc].forEach(el => el.classList.remove('meta-fading'));
      }, 160);
    }
    function resetMeta(){
      [label, title, desc].forEach(el => el.classList.add('meta-fading'));
      setTimeout(() => {
        label.textContent = defaults.label;
        title.textContent = defaults.title;
        desc.textContent  = defaults.desc;
        [label, title, desc].forEach(el => el.classList.remove('meta-fading'));
      }, 160);
    }
    items.forEach(a => {
      a.addEventListener('mouseenter', () => setMeta(a));
    });
    drawer.querySelector('.menu-list').addEventListener('mouseleave', resetMeta);
  }
})();

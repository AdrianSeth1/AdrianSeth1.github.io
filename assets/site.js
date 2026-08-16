(function(){
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- scroll progress + sticky nav ---------- */
  const prog = document.getElementById('prog');
  const nav  = document.getElementById('nav');
  function onScroll(){
    const max = document.documentElement.scrollHeight - innerHeight;
    prog.style.width = (max > 0 ? (scrollY / max) * 100 : 0) + '%';
    nav.classList.toggle('stuck', scrollY > 24);
  }
  addEventListener('scroll', onScroll, {passive:true});
  onScroll();

  /* ---------- mobile menu ---------- */
  const burger = document.getElementById('burger');
  const menu = document.getElementById('menu');
  const mobileNav = matchMedia('(max-width: 760px)');
  function setMenuOpen(open) {
    const mobileOpen = mobileNav.matches && open;
    nav.classList.toggle('open', mobileOpen);
    burger.setAttribute('aria-expanded', String(mobileOpen));
    burger.setAttribute('aria-label', mobileOpen ? 'Close menu' : 'Menu');
    menu.inert = mobileNav.matches && !mobileOpen;
  }
  burger.addEventListener('click', () => {
    setMenuOpen(!nav.classList.contains('open'));
  });
  document.querySelectorAll('#menu a').forEach(a => a.addEventListener('click', () => {
    setMenuOpen(false);
  }));
  addEventListener('keydown', e => {
    if (e.key === 'Escape' && nav.classList.contains('open')) {
      setMenuOpen(false);
      burger.focus();
    }
  });
  mobileNav.addEventListener('change', () => setMenuOpen(false));
  setMenuOpen(false);

  /* ---------- scroll reveal (staggered) ---------- */
  if (!reduce) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e, i) => {
        if (!e.isIntersecting) return;
        e.target.style.transitionDelay = Math.min(i * 70, 280) + 'ms';
        e.target.classList.add('in');
        io.unobserve(e.target);
      });
    }, {threshold: 0.12, rootMargin: '0px 0px -8% 0px'});
    document.querySelectorAll('.rv').forEach(el => io.observe(el));
  } else {
    document.querySelectorAll('.rv').forEach(el => el.classList.add('in'));
  }

  /* ---------- nav scrollspy ---------- */
  const links = [...document.querySelectorAll('#menu a')];
  const spy = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      links.forEach(l => l.classList.toggle('on', l.getAttribute('href') === '#' + e.target.id));
    });
  }, {rootMargin: '-45% 0px -50% 0px'});
  document.querySelectorAll('section[id]').forEach(s => spy.observe(s));

  /* ---------- cursor spotlight on cards ---------- */
  document.querySelectorAll('.proj, .item').forEach(card => {
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  /* ---------- animated neuron constellation ---------- */
  (function () {
    if (reduce) return;
    const canvas = document.getElementById('neural');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const COLOR = '145,132,217';
    const LINK = 148;
    let w = 0, h = 0, dpr = 1, nodes = [], pulses = [];
    const mouse = { x: -9999, y: -9999, on: false };

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = innerWidth;
      h = innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const target = Math.max(28, Math.min(96, Math.round(w * h / 15000)));
      nodes = [];
      for (let i = 0; i < target; i++) {
        nodes.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.16,
          vy: (Math.random() - 0.5) * 0.16,
          r: 1 + Math.random() * 1.6,
          glow: 0
        });
      }
    }

    function neighbors(node) {
      return nodes.filter(other => {
        if (other === node) return false;
        const dx = other.x - node.x;
        const dy = other.y - node.y;
        return dx * dx + dy * dy < LINK * LINK;
      });
    }

    function fire(from, to) {
      if (!to || pulses.length > 46) return;
      pulses.push({ a: from, b: to, t: 0, speed: 0.012 + Math.random() * 0.016 });
    }

    function igniteRandom() {
      if (!nodes.length) return;
      const node = nodes[(Math.random() * nodes.length) | 0];
      const nearby = neighbors(node);
      if (nearby.length) {
        node.glow = 1;
        fire(node, nearby[(Math.random() * nearby.length) | 0]);
      }
    }

    let last = performance.now();
    let pulseClock = 0;
    function step(now) {
      const dt = Math.min(40, now - last);
      last = now;
      pulseClock += dt;
      if (pulseClock > 620) {
        pulseClock = 0;
        igniteRandom();
      }
      ctx.clearRect(0, 0, w, h);

      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
        n.x = Math.max(0, Math.min(w, n.x));
        n.y = Math.max(0, Math.min(h, n.y));
        if (mouse.on) {
          const dx = n.x - mouse.x;
          const dy = n.y - mouse.y;
          const distanceSquared = dx * dx + dy * dy;
          if (distanceSquared < 130 * 130) {
            n.glow = Math.max(n.glow, 1 - Math.sqrt(distanceSquared) / 130);
          }
        }
        n.glow *= 0.94;
      }

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const dx = b.x - a.x, dy = b.y - a.y;
          const d = Math.hypot(dx, dy);
          if (d > LINK) continue;
          let alpha = (1 - d / LINK) * 0.16;
          alpha += Math.max(a.glow, b.glow) * 0.45;
          ctx.strokeStyle = `rgba(${COLOR},${alpha.toFixed(3)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      for (const n of nodes) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r + n.glow * 1.6, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${COLOR},${(0.34 + n.glow * 0.6).toFixed(3)})`;
        ctx.fill();
      }

      const alive = [];
      for (const p of pulses) {
        p.t += p.speed;
        const x = p.a.x + (p.b.x - p.a.x) * p.t;
        const y = p.a.y + (p.b.y - p.a.y) * p.t;
        ctx.save();
        ctx.shadowBlur = 12;
        ctx.shadowColor = `rgba(${COLOR},0.9)`;
        ctx.beginPath();
        ctx.arc(x, y, 2.4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(233,233,237,0.95)';
        ctx.fill();
        ctx.restore();
        if (p.t >= 1) {
          p.b.glow = 1;
          if (Math.random() < 0.62 && pulses.length < 40) {
            const nearby = neighbors(p.b).filter(node => node !== p.a);
            if (nearby.length) {
              fire(p.b, nearby[(Math.random() * nearby.length) | 0]);
              if (nearby.length > 2 && Math.random() < 0.35) {
                fire(p.b, nearby[(Math.random() * nearby.length) | 0]);
              }
            }
          }
        } else {
          alive.push(p);
        }
      }
      pulses = alive;

      requestAnimationFrame(step);
    }

    let rt;
    addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(resize, 120); });
    addEventListener('pointermove', e => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.on = true;
      if (Math.random() < 0.14) {
        let nearest = null;
        let bestDistance = 90 * 90;
        for (const node of nodes) {
          const dx = node.x - mouse.x;
          const dy = node.y - mouse.y;
          const distanceSquared = dx * dx + dy * dy;
          if (distanceSquared < bestDistance) {
            bestDistance = distanceSquared;
            nearest = node;
          }
        }
        if (nearest) {
          nearest.glow = 1;
          const nearby = neighbors(nearest);
          if (nearby.length) fire(nearest, nearby[(Math.random() * nearby.length) | 0]);
        }
      }
    });
    addEventListener('pointerleave', () => { mouse.on = false; });
    addEventListener('pointerdown', e => {
      mouse.x = e.clientX; mouse.y = e.clientY; mouse.on = true;
      for (const node of nodes) {
        const dx = node.x - mouse.x, dy = node.y - mouse.y;
        if (dx * dx + dy * dy < 170 * 170) {
          node.glow = 1;
          const nearby = neighbors(node);
          if (nearby.length && Math.random() < 0.5) fire(node, nearby[(Math.random() * nearby.length) | 0]);
        }
      }
    });
    resize();
    requestAnimationFrame(step);
  })();
})();
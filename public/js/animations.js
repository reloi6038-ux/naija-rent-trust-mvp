/**
 * Animation utilities: reveal on scroll, counters, cursor tracking, nav shrink.
 */
(function () {
  // Scroll reveal
  const revealEls = document.querySelectorAll('[data-reveal],[data-stagger]');
  if ('IntersectionObserver' in window && revealEls.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('visible'));
  }

  // Animated counters
  const counters = document.querySelectorAll('[data-counter]');
  counters.forEach((el) => {
    const target = parseFloat(el.dataset.counter);
    if (Number.isNaN(target)) return;
    const dur = 1400;
    const start = performance.now();
    const fmt = el.dataset.counterFmt === 'naira'
      ? (n) => '₦' + Math.round(n).toLocaleString('en-NG')
      : (n) => Math.round(n).toLocaleString('en-NG');
    const tick = (now) => {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(target * eased);
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = fmt(target);
    };
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          requestAnimationFrame(tick);
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.6 });
    io.observe(el);
  });

  // Nav shrink on scroll
  const nav = document.querySelector('.nav');
  if (nav) {
    let ticking = false;
    const update = () => {
      nav.classList.toggle('scrolled', window.scrollY > 8);
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
  }

  // Property card tilt (throttled with rAF)
  const tiltCards = document.querySelectorAll('.property-card');
  if (tiltCards.length && window.matchMedia('(hover:hover) and (pointer:fine)').matches) {
    tiltCards.forEach((card) => {
      let raf = null;
      const max = 4;
      const onMove = (e) => {
        if (raf) return;
        raf = requestAnimationFrame(() => {
          const r = card.getBoundingClientRect();
          const x = (e.clientX - r.left) / r.width - 0.5;
          const y = (e.clientY - r.top) / r.height - 0.5;
          card.style.setProperty('--ry', `${x * max}deg`);
          card.style.setProperty('--rx', `${-y * max}deg`);
          raf = null;
        });
      };
      const reset = () => {
        card.style.setProperty('--ry', '0deg');
        card.style.setProperty('--rx', '0deg');
      };
      card.addEventListener('mousemove', onMove);
      card.addEventListener('mouseleave', reset);
    });
  }
})();


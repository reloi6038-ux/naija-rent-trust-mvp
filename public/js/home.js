/**
 * Homepage-only behavior: typewriter, particles, tilt, carousel.
 */
(function () {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Typewriter ----------
  let phrases = [];
  let phraseIdx = 0;
  let charIdx = 0;
  let deleting = false;
  let typeTimeout = null;

  function getPhrases() {
    if (typeof I18n !== 'undefined' && I18n.t) {
      const p = [
        I18n.t('hero.title_typed_1'),
        I18n.t('hero.title_typed_2'),
        I18n.t('hero.title_typed_3'),
        I18n.t('hero.title_typed_4')
      ];
      // If translations failed, fallback to English
      if (p[0] === 'hero.title_typed_1') {
        return ['clearer prices.', 'stronger trust signals.', 'transparent fees.', 'real Nigerian homes.'];
      }
      return p.filter(Boolean);
    }
    return ['clearer prices.', 'stronger trust signals.', 'transparent fees.', 'real Nigerian homes.'];
  }

  function startTypewriter() {
    const typedEl = document.getElementById('typedText');
    if (!typedEl) return;
    
    clearTimeout(typeTimeout);
    phrases = getPhrases();
    phraseIdx = 0;
    charIdx = 0;
    deleting = false;
    typedEl.textContent = '';

    if (reduceMotion) {
      typedEl.textContent = phrases[0];
      return;
    }

    const typeSpeed = 65;
    const deleteSpeed = 35;
    const pauseBetween = 1800;

    function tick() {
      const current = phrases[phraseIdx];
      
      if (!deleting) {
        charIdx++;
        typedEl.textContent = current.slice(0, charIdx);
        if (charIdx === current.length) {
          deleting = true;
          typeTimeout = setTimeout(tick, pauseBetween);
          return;
        }
        typeTimeout = setTimeout(tick, typeSpeed);
      } else {
        charIdx--;
        typedEl.textContent = current.slice(0, charIdx);
        if (charIdx === 0) {
          deleting = false;
          phraseIdx = (phraseIdx + 1) % phrases.length;
          typeTimeout = setTimeout(tick, 400);
          return;
        }
        typeTimeout = setTimeout(tick, deleteSpeed);
      }
    }
    // Start after a small delay
    typeTimeout = setTimeout(tick, 800);
  }

  // Start typewriter only after i18n is ready
  if (typeof I18n !== 'undefined') {
    I18n.onLanguageChange(() => {
      // Restart typewriter when language changes
      startTypewriter();
    });
    // Wait a moment for i18n to initialize
    setTimeout(startTypewriter, 100);
  } else {
    startTypewriter();
  }

  // ---------- Particles ----------
  if (!reduceMotion) {
    const layer = document.getElementById('particles');
    if (layer) {
      const count = 40;
      for (let i = 0; i < count; i++) {
        const p = document.createElement('span');
        p.className = 'particle';
        const size = Math.random() * 3 + 1.5;
        p.style.left = Math.random() * 100 + '%';
        p.style.width = size + 'px';
        p.style.height = size + 'px';
        p.style.animationDuration = (Math.random() * 20 + 12) + 's';
        p.style.animationDelay = (Math.random() * 20) + 's';
        p.style.setProperty('--drift', (Math.random() * 100 - 50) + 'px');
        p.style.opacity = Math.random() * 0.5 + 0.2;
        layer.appendChild(p);
      }
    }
  }

  // ---------- Feature card cursor glow ----------
  document.querySelectorAll('.feature-card').forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
      card.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
    });
  });

  // ---------- Testimonials carousel ----------
  const testimonials = document.querySelectorAll('.testimonial');
  const dots = document.querySelectorAll('.testimonial-dot');
  if (testimonials.length) {
    let idx = 0;
    let timer = null;

    function show(next) {
      testimonials.forEach((t, i) => t.classList.toggle('active', i === next));
      dots.forEach((d, i) => d.classList.toggle('active', i === next));
      idx = next;
    }

    function nextSlide() { show((idx + 1) % testimonials.length); }
    function startAuto() { if (!reduceMotion) timer = setInterval(nextSlide, 5500); }
    function stopAuto() { if (timer) { clearInterval(timer); timer = null; } }

    dots.forEach((dot, i) => {
      dot.addEventListener('click', () => { stopAuto(); show(i); startAuto(); });
    });
    const stage = document.querySelector('.testimonial-stage');
    if (stage) {
      stage.addEventListener('mouseenter', stopAuto);
      stage.addEventListener('mouseleave', startAuto);
    }
    show(0);
    startAuto();
  }
})();

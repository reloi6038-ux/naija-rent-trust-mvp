/**
 * Global UI bootstrap: Nav, Back-to-top.
 */
async function loadMe() {
  try {
    const { user } = await API.get('/auth/me');
    return user;
  } catch {
    return null; // 401 is expected for guests
  }
}

async function initNav() {
  try {
    const navActions = document.getElementById('navActions');
    const navLinks = document.getElementById('navLinks');
    if (!navActions) return;

    const user = await loadMe();

    if (!user) {
      navActions.innerHTML = `
        <a href="/pages/login" class="btn btn-ghost btn-sm">Lister Login</a>
        <a href="/pages/register" class="btn btn-primary btn-sm">Post a Property</a>
      `;
    } else if (user.role === 'admin') {
      navActions.innerHTML = `
        <a href="/pages/admin-dashboard" class="btn btn-ghost btn-sm">Admin</a>
        <button class="btn btn-primary btn-sm" onclick="logout()">Logout</button>
      `;
    } else {
      navActions.innerHTML = `
        <a href="/pages/lister-dashboard" class="btn btn-ghost btn-sm">Dashboard</a>
        <button class="btn btn-primary btn-sm" onclick="logout()">Logout</button>
      `;
    }

    if (navLinks) {
      navLinks.querySelectorAll('.mobile-cta').forEach((el) => el.remove());
      if (window.matchMedia('(max-width: 480px)').matches) {
        const primary = navActions.querySelector('.btn-primary');
        if (primary) {
          const clone = primary.cloneNode(true);
          clone.classList.add('mobile-cta');
          clone.style.cssText = 'display:block;margin-top:12px;text-align:center;width:100%;';
          navLinks.appendChild(clone);
        }
      }
    }

    const path = location.pathname;
    document.querySelectorAll('.nav-links a').forEach((a) => {
      if (a.getAttribute('href') === path) a.classList.add('active');
    });
  } catch (err) {
    console.warn('[nav] init failed:', err);
  }
}

async function logout() {
  try { await API.post('/auth/logout', {}); } catch {}
  window.location.href = '/';
}

function mountNavToggle() {
  try {
    const btn = document.getElementById('navToggle');
    const links = document.getElementById('navLinks');
    if (!btn || !links) return;
    if (btn.dataset.bound === '1') return;
    btn.dataset.bound = '1';

    btn.addEventListener('click', (e) => {
      e.preventDefault(); e.stopPropagation();
      const isOpen = links.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(isOpen));
      btn.textContent = isOpen ? '✕' : '☰';
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    links.addEventListener('click', (e) => {
      if (e.target.closest('a') && links.classList.contains('open')) {
        links.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
        btn.textContent = '☰';
        document.body.style.overflow = '';
      }
    });

    document.addEventListener('click', (e) => {
      if (!links.classList.contains('open')) return;
      if (links.contains(e.target) || btn.contains(e.target)) return;
      links.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      btn.textContent = '☰';
      document.body.style.overflow = '';
    });
  } catch (err) {
    console.warn('[nav] toggle init failed:', err);
  }
}

function setupBackToTop() {
  if (document.querySelector('.back-to-top')) return;

  const btn = document.createElement('button');
  btn.className = 'back-to-top';
  btn.setAttribute('aria-label', 'Back to top');
  btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
  
  document.body.appendChild(btn);

  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      btn.classList.add('show');
    } else {
      btn.classList.remove('show');
    }
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// --- Initialization ---
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initNav();
    mountNavToggle();
    setupBackToTop();
  });
} else {
  initNav();
  mountNavToggle();
  setupBackToTop();
}

/**
 * Global UI bootstrap: nav auth state, mobile toggle.
 * Auth check is silently non-blocking so public pages render even when
 * the visitor is not logged in (401 from /auth/me is expected).
 */
async function loadMe() {
  try {
    const { user } = await API.get('/auth/me');
    return user;
  } catch {
    return null;
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

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initNav();
    mountNavToggle();
  });
} else {
  initNav();
  mountNavToggle();
}

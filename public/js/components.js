/**
 * Reusable UI components — all DOM-safe (no innerHTML for user data).
 */
const Components = {
  /** Property card used on homepage, search, and dashboard */
  propertyCard(p, { href } = {}) {
    const img = (p.photos && p.photos[0]) || '/images/placeholder.svg';
    const url = href || `/pages/property-details?id=${p._id}`;
    const verified = p.verification?.isVerified
      ? `<span class="badge badge-verified" title="Reviewed by NaijaRent">Reviewed</span>` : '';
    const statusMap = {
      Published: '<span class="pill badge-published">Published</span>',
      Rented: '<span class="pill badge-rented">Rented</span>',
      Unpublished: '<span class="pill badge-unpublished">Unpublished</span>',
      Pending: '<span class="pill badge-warn">Pending</span>'
    };
    const status = statusMap[p.status] || '';

    const el = document.createElement('article');
    el.className = 'property-card';
    el.innerHTML = `
      <a class="card-img" href="${url}" aria-label="View ${p.title}">
        ${verified ? `<div class="badge-status">${verified}</div>` : ''}
        ${status ? `<div class="badge-status right">${status}</div>` : ''}
        <img src="${img}" alt="${escapeHtml(p.title)}" loading="lazy" width="400" height="250" />
      </a>
      <div class="card-body">
        <h3 class="card-title truncate">${escapeHtml(p.title)}</h3>
        <div class="card-loc">${escapeHtml(p.area)}, ${escapeHtml(p.state)}</div>
        <div class="card-meta">
          <span>🛏 ${p.bedrooms} bed</span>
          <span>🚿 ${p.bathrooms} bath</span>
          <span>🏠 ${escapeHtml(p.propertyType)}</span>
        </div>
        <div class="card-price">${naira(p.annualRent)}<small>/ year</small></div>
        <div style="display:flex;gap:6px;margin-top:8px;" class="card-actions">
          <button class="btn btn-ghost btn-sm" data-compare="${p._id}" style="flex:1;font-size:.78rem;">＋ Compare</button>
        </div>
      </div>
    `;

    // Wire compare button
    const compareBtn = el.querySelector('[data-compare]');
    if (compareBtn && typeof Compare !== 'undefined') {
      const updateLabel = () => {
        compareBtn.textContent = Compare.has(p._id) ? '✓ Added' : '＋ Compare';
      };
      updateLabel();
      compareBtn.addEventListener('click', (e) => {
        e.preventDefault();
        Compare.toggle(p);
        updateLabel();
      });
      window.addEventListener('compare:updated', updateLabel);
    }

    return el;
  },

  /** Skeleton card */
  skeletonCard() {
    const el = document.createElement('div');
    el.className = 'skeleton skeleton-card';
    return el;
  },

  /** Empty state block */
  empty({ icon, title, message, actionHtml }) {
    const el = document.createElement('div');
    el.className = 'empty';
    el.innerHTML = `
      <img src="${icon}" alt="" width="220" height="165" />
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(message)}</p>
      ${actionHtml || ''}
    `;
    return el;
  },

  /** Stat card */
  statCard({ value, label, variant = '' }) {
    const el = document.createElement('div');
    el.className = `stat-card ${variant}`;
    el.innerHTML = `
      <div class="v" data-counter="${Number(value) || 0}">0</div>
      <div class="l">${escapeHtml(label)}</div>
    `;
    return el;
  },

  /** Confirmation modal. Returns a Promise<boolean>. */
  confirm({ title, message, confirmText = 'Confirm', cancelText = 'Cancel', danger = false }) {
    return new Promise((resolve) => {
      const backdrop = document.createElement('div');
      backdrop.className = 'modal-backdrop open';
      backdrop.innerHTML = `
        <div class="modal" role="dialog" aria-modal="true" aria-labelledby="cm-title">
          <h3 id="cm-title">${escapeHtml(title)}</h3>
          <p class="modal-sub">${escapeHtml(message)}</p>
          <div class="modal-actions">
            <button class="btn btn-ghost" data-act="cancel">${escapeHtml(cancelText)}</button>
            <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-act="confirm">${escapeHtml(confirmText)}</button>
          </div>
        </div>
      `;
      document.body.appendChild(backdrop);
      const close = (val) => { backdrop.remove(); resolve(val); };
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) close(false);
        const btn = e.target.closest('[data-act]');
        if (!btn) return;
        close(btn.dataset.act === 'confirm');
      });
      const esc = (e) => { if (e.key === 'Escape') { document.removeEventListener('keydown', esc); close(false); } };
      document.addEventListener('keydown', esc);
      backdrop.querySelector('[data-act="confirm"]').focus();
    });
  }
};

// ---- global helpers ----
function naira(n) { return '₦' + Number(n || 0).toLocaleString('en-NG'); }

function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function toast(msg, type = 'info') {
  let wrap = document.querySelector('.toast-wrap');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.className = 'toast-wrap';
    wrap.setAttribute('aria-live', 'polite');
    document.body.appendChild(wrap);
  }
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  wrap.appendChild(el);
  setTimeout(() => {
    el.style.transition = 'opacity .25s ease, transform .25s ease';
    el.style.opacity = '0';
    el.style.transform = 'translateX(20px)';
    setTimeout(() => el.remove(), 260);
  }, 3200);
}

// Cookie consent banner (NDPR/GDPR pattern)
(function () {
  const KEY = 'nr_cookie_consent_v1';
  if (localStorage.getItem(KEY)) return;
  const bar = document.createElement('div');
  bar.setAttribute('role', 'dialog');
  bar.setAttribute('aria-label', 'Cookie consent');
  bar.style.cssText = 'position:fixed;bottom:16px;left:16px;right:16px;z-index:9000;max-width:640px;margin:auto;background:#fff;border:1px solid #e2e8f0;box-shadow:0 20px 45px rgba(15,23,42,.15);border-radius:14px;padding:18px;display:flex;gap:14px;align-items:center;flex-wrap:wrap;';
  bar.innerHTML = `
    <div style="flex:1;min-width:220px;font-size:.9rem;color:#334155;">
      We use essential cookies to keep you signed in, and optional analytics cookies to improve the site. See our
      <a href="/pages/cookies">Cookie Policy</a> and <a href="/pages/privacy">Privacy Policy</a>.
    </div>
    <div style="display:flex;gap:8px;">
      <button class="btn btn-ghost btn-sm" data-act="reject">Reject optional</button>
      <button class="btn btn-primary btn-sm" data-act="accept">Accept all</button>
    </div>
  `;
  document.body.appendChild(bar);
  bar.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    localStorage.setItem(KEY, JSON.stringify({ analytics: btn.dataset.act === 'accept', at: Date.now() }));
    bar.remove();
  });
})();



/**
 * Property comparison — client-only, localStorage-backed.
 * Max 4 properties at a time.
 */
const Compare = (() => {
  const KEY = 'nr_compare_v1';
  const MAX = 4;

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; }
    catch { return []; }
  }
  function save(list) {
    localStorage.setItem(KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('compare:updated', { detail: list }));
  }

  return {
    list: load,
    has(id) { return load().some(p => p._id === id); },
    count() { return load().length; },
    toggle(prop) {
      const list = load();
      const idx = list.findIndex(p => p._id === prop._id);
      if (idx >= 0) {
        list.splice(idx, 1);
      } else {
        if (list.length >= MAX) {
          toast(`Maximum ${MAX} properties can be compared`, 'error');
          return;
        }
        list.push({
          _id: prop._id, title: prop.title, photos: prop.photos,
          area: prop.area, state: prop.state, annualRent: prop.annualRent,
          bedrooms: prop.bedrooms, bathrooms: prop.bathrooms,
          propertyType: prop.propertyType, agencyFee: prop.agencyFee || 0,
          legalFee: prop.legalFee || 0, cautionDeposit: prop.cautionDeposit || 0,
          totalMoveInCost: prop.totalMoveInCost || 0,
          amenities: prop.amenities || [],
          reviewedAt: prop.reviewedAt,
          conditionScore: prop.conditionScore || 0
        });
      }
      save(list);
      return list;
    },
    remove(id) { save(load().filter(p => p._id !== id)); },
    clear() { save([]); }
  };
})();

/**
 * Comparison bar — fixed at bottom of screen.
 */
function renderCompareBar() {
  let bar = document.getElementById('compareBar');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'compareBar';
    bar.style.cssText = `
      position: fixed; left: 16px; right: 16px; bottom: 16px;
      background: #0f172a; color: #fff; border-radius: 14px;
      padding: 12px 16px; box-shadow: 0 20px 60px rgba(0,0,0,.5);
      display: none; align-items: center; justify-content: space-between;
      gap: 12px; z-index: 800; max-width: 900px; margin: 0 auto;
      border: 1px solid rgba(96,165,250,.3);
    `;
    document.body.appendChild(bar);
  }

  const list = Compare.list();
  if (!list.length) { bar.style.display = 'none'; return; }
  bar.style.display = 'flex';

  bar.innerHTML = `
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;flex:1;min-width:0;">
      <strong style="font-size:.9rem;">Compare (${list.length}/4)</strong>
      ${list.map(p => `
        <span style="display:inline-flex;align-items:center;gap:6px;background:rgba(148,163,184,.15);padding:5px 10px;border-radius:999px;font-size:.8rem;max-width:220px;">
          <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(p.title)}</span>
          <button data-remove="${p._id}" style="background:none;border:none;color:#94a3b8;cursor:pointer;font-size:1rem;padding:0;line-height:1;">✕</button>
        </span>
      `).join('')}
    </div>
    <div style="display:flex;gap:8px;flex-shrink:0;">
      <button class="btn btn-ghost btn-sm" data-action="clear" style="color:#e2e8f0;border-color:rgba(148,163,184,.3);">Clear</button>
      <button class="btn btn-primary btn-sm" data-action="open" ${list.length < 2 ? 'disabled' : ''}>Compare</button>
    </div>
  `;

  bar.querySelectorAll('[data-remove]').forEach(b => b.onclick = () => {
    Compare.remove(b.dataset.remove);
    renderCompareBar();
  });
  bar.querySelector('[data-action="clear"]').onclick = () => {
    Compare.clear();
    renderCompareBar();
  };
  bar.querySelector('[data-action="open"]').onclick = () => {
    window.location.href = '/pages/compare';
  };
}

document.addEventListener('DOMContentLoaded', renderCompareBar);
window.addEventListener('compare:updated', renderCompareBar);

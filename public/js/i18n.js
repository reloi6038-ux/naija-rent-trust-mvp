/**
 * i18n module — loads i18next from CDN, handles language switching + persistence.
 *
 * Usage in HTML:
 *   <span data-i18n="nav.browse">Browse rentals</span>
 *   <input data-i18n-placeholder="hero.search_state_placeholder" />
 *   <button data-i18n-title="common.cancel">...</button>
 *
 * Then call: I18n.init().then(() => I18n.applyAll());
 */
(function (global) {
  const SUPPORTED = ['en', 'pcm', 'yo', 'ha'];
  const LANG_NAMES = {
    en: { native: 'English', flag: '🇬🇧' },
    pcm: { native: 'Pidgin', flag: '🇳🇬' },
    yo: { native: 'Yorùbá', flag: '🇳🇬' },
    ha: { native: 'Hausa', flag: '🇳🇬' }
  };
  const STORAGE_KEY = 'nr_lang';
  const COOKIE_NAME = 'nr_lang';

  let i18nInstance = null;
  let currentLang = 'en';
  const listeners = new Set();

  // ---- Language persistence ----
  function loadFromCookie() {
    const match = document.cookie.match(new RegExp('(^| )' + COOKIE_NAME + '=([^;]+)'));
    return match ? match[2] : null;
  }
  function saveToCookie(lang) {
    document.cookie = `${COOKIE_NAME}=${lang}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
  }
  function persist(lang) {
    try { localStorage.setItem(STORAGE_KEY, lang); } catch {}
    saveToCookie(lang);
  }

  // ---- Detect preferred language ----
  function detectLanguage() {
    // 1. Saved preference
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && SUPPORTED.includes(saved)) return saved;
    } catch {}
    // 2. Cookie
    const cookieLang = loadFromCookie();
    if (cookieLang && SUPPORTED.includes(cookieLang)) return cookieLang;
    // 3. Browser language
    const browser = (navigator.language || 'en').toLowerCase();
    if (browser.startsWith('yo')) return 'yo';
    if (browser.startsWith('ha')) return 'ha';
    if (browser.startsWith('pcm') || browser.includes('en-ng')) return 'pcm';
    // 4. Fallback
    return 'en';
  }

  // ---- Load i18next from CDN if not present ----
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) return resolve();
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.appendChild(s);
    });
  }

  async function ensureLibraries() {
    if (!global.i18next) {
      await loadScript('https://unpkg.com/i18next@23.7.6/dist/umd/i18next.min.js');
    }
    if (!global.i18nextHttpBackend) {
      await loadScript('https://unpkg.com/i18next-http-backend@2.4.2/i18nextHttpBackend.min.js');
    }
  }

  // ---- Translate the DOM ----
  function applyAll() {
    if (!i18nInstance) return;
    const t = i18nInstance.t.bind(i18nInstance);

    // data-i18n="key"
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (!key) return;
      const translation = t(key);
      if (translation && translation !== key) el.textContent = translation;
    });

    // data-i18n-html="key" (for content that may include markup — use carefully)
    document.querySelectorAll('[data-i18n-html]').forEach((el) => {
      const key = el.getAttribute('data-i18n-html');
      if (!key) return;
      const translation = t(key);
      if (translation && translation !== key) el.innerHTML = translation;
    });

    // data-i18n-placeholder="key"
    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (!key) return;
      const translation = t(key);
      if (translation && translation !== key) el.setAttribute('placeholder', translation);
    });

    // data-i18n-title="key"
    document.querySelectorAll('[data-i18n-title]').forEach((el) => {
      const key = el.getAttribute('data-i18n-title');
      if (!key) return;
      const translation = t(key);
      if (translation && translation !== key) el.setAttribute('title', translation);
    });

    // data-i18n-aria="key"
    document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
      const key = el.getAttribute('data-i18n-aria');
      if (!key) return;
      const translation = t(key);
      if (translation && translation !== key) el.setAttribute('aria-label', translation);
    });

    // Page title
    const titleKey = document.body.getAttribute('data-i18n-title-key');
    if (titleKey) {
      const t2 = t(titleKey);
      if (t2 && t2 !== titleKey) document.title = t2;
    }

    // Update lang attribute for a11y + SEO
    document.documentElement.lang = currentLang;
  }

  // ---- Language switcher UI ----
  function buildSwitcher() {
    const container = document.getElementById('langSwitcher');
    if (!container) return;

    container.innerHTML = `
      <button class="lang-btn" aria-label="Change language" aria-haspopup="true" aria-expanded="false">
        <span class="lang-flag">${LANG_NAMES[currentLang].flag}</span>
        <span class="lang-code">${currentLang.toUpperCase()}</span>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M1 3l4 4 4-4" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/>
        </svg>
      </button>
      <ul class="lang-menu" role="menu">
        ${SUPPORTED.map(code => `
          <li role="none">
            <button role="menuitem" data-lang="${code}" class="${code === currentLang ? 'active' : ''}">
              <span>${LANG_NAMES[code].flag}</span>
              <span>${LANG_NAMES[code].native}</span>
              ${code === currentLang ? '<span class="check">✓</span>' : ''}
            </button>
          </li>
        `).join('')}
      </ul>
    `;

    const btn = container.querySelector('.lang-btn');
    const menu = container.querySelector('.lang-menu');

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = menu.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(open));
    });

    document.addEventListener('click', () => {
      menu.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    });

    menu.querySelectorAll('[data-lang]').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const lang = btn.dataset.lang;
        await changeLanguage(lang);
        menu.classList.remove('open');
        container.querySelector('.lang-btn').setAttribute('aria-expanded', 'false');
      });
    });
  }

  // ---- Change language ----
  async function changeLanguage(lang) {
    if (!SUPPORTED.includes(lang) || lang === currentLang) return;
    currentLang = lang;
    persist(lang);
    await i18nInstance.changeLanguage(lang);
    applyAll();
    buildSwitcher();
    listeners.forEach((fn) => { try { fn(lang); } catch {} });
  }

  // ---- Init ----
  async function init(options = {}) {
    await ensureLibraries();
    currentLang = options.defaultLang && SUPPORTED.includes(options.defaultLang)
      ? options.defaultLang
      : detectLanguage();

    i18nInstance = global.i18next.createInstance();
    await new Promise((resolve, reject) => {
      i18nInstance.use(global.i18nextHttpBackend).init({
        lng: currentLang,
        fallbackLng: 'en',
        supportedLngs: SUPPORTED,
        ns: ['translation'],
        defaultNS: 'translation',
        backend: {
          loadPath: '/locales/{{lng}}.json'
        },
        interpolation: { escapeValue: false },
        returnNull: false
      }, (err) => (err ? reject(err) : resolve()));
    });

    // Auto-apply on any missing translations
    i18nInstance.on('languageChanged', () => applyAll());

    applyAll();
    buildSwitcher();
    persist(currentLang);

    return i18nInstance;
  }

  // ---- Public API ----
  global.I18n = {
    init,
    applyAll,
    changeLanguage,
    t: (key, opts) => i18nInstance ? i18nInstance.t(key, opts) : key,
    getLang: () => currentLang,
    supported: () => [...SUPPORTED],
    onLanguageChange: (fn) => { listeners.add(fn); return () => listeners.delete(fn); }
  };
})(window);

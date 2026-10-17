/* ==========================================================================
   site.js — 前台渲染
   读取 window.SITE_CONTENT，渲染整站。支持 ?preview=1（后台实时预览）。
   ========================================================================== */
(function () {
  'use strict';

  var PF = window.PF;
  var esc = PF.escapeHtml;
  var THEME_KEY = 'pf.theme';

  var state = {
    content: PF.merge(window.SITE_CONTENT || {}),
    preview: /[?&]preview=1/.test(location.search),
    lastFocus: null
  };

  var el = {};
  var revealObs = null;

  /* ---------------- 小工具 ---------------- */
  function $(sel, root) { return (root || document).querySelector(sel); }

  function safeUrl(u) {
    var s = String(u == null ? '' : u).trim();
    if (!s) return '';
    if (/^(https?:|mailto:|tel:|#|\/|\.{1,2}\/)/i.test(s)) return s;
    if (/^[\w.-]+\.[a-z]{2,}(\/|$)/i.test(s)) return 'https://' + s;
    if (/^(assets\/|data\/)/i.test(s)) return s;
    return '';
  }

  function arrow(dir) {
    var d = dir === 'up'
      ? '<path d="M7 17 17 7M8 7h9v9"/>'
      : '<path d="M5 12h14M13 6l6 6-6 6"/>';
    return '<svg class="arw" width="14" height="14" viewBox="0 0 24 24" fill="none" ' +
      'stroke="currentColor" stroke-width="1.7" stroke-linecap="round" ' +
      'stroke-linejoin="round" aria-hidden="true">' + d + '</svg>';
  }

  var ICON_SUN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M18.8 5.2l-1.4 1.4M6.6 17.4l-1.4 1.4"/></svg>';
  var ICON_MOON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z"/></svg>';

  /* ---------------- 主题 ---------------- */
  function urlParam(name) {
    var m = new RegExp('[?&]' + name + '=([^&#]*)').exec(location.search);
    return m ? decodeURIComponent(m[1]) : '';
  }

  function resolveTheme() {
    var forced = urlParam('theme');
    if (forced === 'light' || forced === 'dark') return forced;
    var saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
    var pref = state.content.meta.theme;
    if (pref === 'light' || pref === 'dark') return pref;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function applyTheme() {
    var t = resolveTheme();
    document.documentElement.setAttribute('data-theme', t);
    var btn = $('#theme-btn');
    if (btn) {
      btn.innerHTML = t === 'dark' ? ICON_SUN : ICON_MOON;
      btn.setAttribute('aria-label', t === 'dark' ? '切换到浅色模式' : '切换到深色模式');
    }
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', t === 'dark' ? '#121110' : '#f7f4ef');
  }

  /* ---------------- 头部 ---------------- */
  function renderNav(c) {
    var nav = $('#nav');
    if (!nav) return;
    var toggle = c.meta.themeToggle
      ? '<button class="icon-btn" id="theme-btn" type="button" aria-label="切换明暗"></button>'
      : '';
    nav.innerHTML =
      '<div class="wrap nav-inner">' +
        '<a class="brand" href="#top" aria-label="' + esc(c.profile.name) + ' 首页">' +
          esc(c.profile.name) +
          '<span class="brand-latin">' + esc(c.profile.latin) + '</span>' +
        '</a>' +
        '<nav class="nav-links" aria-label="主导航">' +
          '<a href="#work">作品</a>' +
          '<a href="#about">关于</a>' +
          '<a href="#contact">联系</a>' +
        '</nav>' +
        '<div class="nav-acts">' + toggle + '</div>' +
      '</div>';

    var tb = $('#theme-btn');
    if (tb) {
      tb.addEventListener('click', function () {
        var next = resolveTheme() === 'dark' ? 'light' : 'dark';
        localStorage.setItem(THEME_KEY, next);
        applyTheme();
      });
    }
    applyTheme();
  }

  /* ---------------- 首屏 ---------------- */
  function renderHero(c) {
    var hero = $('#hero');
    if (!hero) return;
    var p = c.profile, h = c.hero;

    var stats = (h.stats || []).map(function (s) {
      return '<li class="stat"><span class="stat-v">' + esc(s.value) + '</span>' +
        '<span class="stat-l">' + esc(s.label) + '</span></li>';
    }).join('');

    var cta =
      (h.primary && h.primary.label
        ? '<a class="btn primary" href="' + esc(safeUrl(h.primary.url) || '#work') + '">' +
            esc(h.primary.label) + arrow() + '</a>'
        : '') +
      (h.secondary && h.secondary.label
        ? '<a class="btn" href="' + esc(safeUrl(h.secondary.url) || '#contact') + '">' +
            esc(h.secondary.label) + '</a>'
        : '');

    hero.innerHTML =
      '<div class="wrap hero-grid">' +
        '<div class="hero-main">' +
          '<div class="hero-eyebrow reveal"><span class="mono">' + esc(h.eyebrow) + '</span></div>' +
          '<h1 class="hero-name display reveal">' + esc(p.name) + '</h1>' +
          '<p class="hero-statement reveal">' + esc(h.headline) + '</p>' +
          '<p class="hero-sub reveal">' + esc(h.subline) + '</p>' +
          '<div class="hero-cta reveal">' + cta + '</div>' +
          (stats ? '<ul class="stats reveal">' + stats + '</ul>' : '') +
        '</div>' +
        '<aside class="hero-side reveal">' +
          '<figure class="portrait">' +
            '<img src="' + esc(safeUrl(p.avatar) || 'assets/img/avatar.svg') + '" alt="' +
              esc(p.name) + '" width="640" height="640">' +
            '<figcaption><span>' + esc(p.role) + '</span><span>' + esc(p.location) + '</span></figcaption>' +
          '</figure>' +
        '</aside>' +
      '</div>';
  }

  /* ---------------- 作品 ---------------- */
  function renderWork(c) {
    var sec = $('#work');
    if (!sec) return;
    var list = c.projects || [];

    var cards = list.map(function (p, i) {
      var idx = String(i + 1).padStart(2, '0');
      var tags = (p.tags || []).map(function (t) {
        return '<span class="tag">' + esc(t) + '</span>';
      }).join('');
      return '<article class="card reveal' + (p.featured ? ' featured' : '') + '" data-idx="' + i + '" ' +
          'tabindex="0" role="button" aria-label="查看项目：' + esc(p.title) + '">' +
        '<div class="card-media">' +
          '<span class="card-idx">' + idx + '</span>' +
          (p.cover
            ? '<img src="' + esc(safeUrl(p.cover)) + '" alt="' + esc(p.title) + ' 封面" loading="lazy">'
            : '') +
        '</div>' +
        '<div class="card-body">' +
          '<div class="card-meta"><span>' + esc(p.category) + '</span><span>' + esc(p.year) + '</span></div>' +
          '<h3 class="card-title">' + esc(p.title) +
            (p.subtitle ? '<span class="card-sub">' + esc(p.subtitle) + '</span>' : '') +
          '</h3>' +
          '<p class="card-sum">' + esc(p.summary) + '</p>' +
          (tags ? '<div class="tags">' + tags + '</div>' : '') +
        '</div>' +
      '</article>';
    }).join('');

    sec.innerHTML =
      '<div class="wrap">' +
        '<div class="section-head">' +
          '<div class="section-label reveal"><i>' + String(list.length).padStart(2, '0') + '</i>' +
            '<span class="mono">' + esc(c.work.label) + '</span></div>' +
          '<div>' +
            '<h2 class="h2 display reveal">' + esc(c.work.heading) + '</h2>' +
            (c.work.desc ? '<p class="section-desc reveal">' + esc(c.work.desc) + '</p>' : '') +
          '</div>' +
        '</div>' +
        (list.length
          ? '<div class="work-grid">' + cards + '</div>'
          : '<p class="prose" style="color:var(--ink-3)">还没有作品。登录后台添加第一个项目。</p>') +
      '</div>';
  }

  /* ---------------- 关于 ---------------- */
  function renderAbout(c) {
    var sec = $('#about');
    if (!sec) return;
    var a = c.about;

    var paras = (a.paragraphs || []).map(function (t) {
      return PF.richText(t);
    }).join('');

    var skills = (a.skills || []).map(function (s) {
      return '<div class="skill-group"><span class="g">' + esc(s.group) + '</span>' +
        '<span class="i">' + esc((s.items || []).join(' · ')) + '</span></div>';
    }).join('');

    var timeline = (a.timeline || []).map(function (t) {
      return '<li class="tl-item">' +
        '<div class="tl-year">' + esc(t.year) + '</div>' +
        '<p class="tl-title">' + esc(t.title) + '</p>' +
        (t.desc ? '<p class="tl-desc">' + esc(t.desc) + '</p>' : '') +
      '</li>';
    }).join('');

    sec.innerHTML =
      '<div class="wrap">' +
        '<div class="section-head">' +
          '<div class="section-label reveal"><i>01</i><span class="mono">' + esc(a.label) + '</span></div>' +
          '<div><h2 class="h2 display reveal">' + esc(a.heading) + '</h2></div>' +
        '</div>' +
        '<div class="about-grid">' +
          '<div class="prose reveal">' + paras + '</div>' +
          '<div class="about-side reveal">' +
            (skills ? '<div class="block"><h3 class="block-title">能力 / SKILLS</h3>' + skills + '</div>' : '') +
            (timeline ? '<div class="block"><h3 class="block-title">经历 / EXPERIENCE</h3>' +
              '<ul class="timeline">' + timeline + '</ul></div>' : '') +
          '</div>' +
        '</div>' +
      '</div>';
  }

  /* ---------------- 联系 ---------------- */
  function renderContact(c) {
    var sec = $('#contact');
    if (!sec) return;
    var k = c.contact;

    var socials = (k.socials || []).map(function (s) {
      return '<a class="social" href="' + esc(safeUrl(s.url)) + '" target="_blank" rel="noopener noreferrer">' +
        '<span class="dot"></span>' + esc(s.label) + '</a>';
    }).join('');

    sec.innerHTML =
      '<div class="wrap contact-grid">' +
        '<div class="section-label reveal"><i>02</i><span class="mono">' + esc(k.label) + '</span></div>' +
        '<div class="contact-body">' +
          '<h2 class="contact-heading reveal">' + esc(k.heading) + '</h2>' +
          (k.text ? '<p class="contact-text reveal">' + esc(k.text) + '</p>' : '') +
          (k.email
            ? '<a class="mail-link reveal u-line" href="mailto:' + esc(k.email) + '">' +
                esc(k.email) + arrow('up') + '</a>'
            : '') +
          (socials ? '<div class="socials reveal">' + socials + '</div>' : '') +
          (k.note ? '<p class="contact-note reveal">' + esc(k.note) + '</p>' : '') +
        '</div>' +
      '</div>';
  }

  /* ---------------- 页脚 ---------------- */
  function renderFooter(c) {
    var f = $('#footer');
    if (!f) return;
    var edit = c.footer.showEdit === false ? ''
      : '<a class="foot-note u-line" href="admin.html" rel="nofollow">EDIT</a>';
    f.innerHTML =
      '<div class="wrap footer-inner">' +
        '<span>' + esc(c.footer.copyright) + '</span>' +
        '<span class="foot-note">' + esc(c.footer.note) + '</span>' +
        edit +
      '</div>';
  }

  /* ---------------- 项目详情弹层 ---------------- */
  function buildModal() {
    var host = document.createElement('div');
    host.className = 'modal';
    host.id = 'modal';
    host.setAttribute('role', 'dialog');
    host.setAttribute('aria-modal', 'true');
    host.setAttribute('aria-label', '项目详情');
    host.innerHTML = '<div class="modal-panel" tabindex="-1"></div>';
    document.body.appendChild(host);
    el.modal = host;

    host.addEventListener('click', function (e) {
      if (e.target === host) closeModal();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && host.classList.contains('is-open')) closeModal();
    });
  }

  function openModal(i) {
    var p = (state.content.projects || [])[i];
    if (!p || !el.modal) return;
    state.lastFocus = document.activeElement;

    var panel = $('.modal-panel', el.modal);
    var tags = (p.tags || []).map(function (t) {
      return '<span class="tag">' + esc(t) + '</span>';
    }).join('');

    var links = '';
    if (p.link) links += '<a class="btn" href="' + esc(safeUrl(p.link)) + '" target="_blank" rel="noopener noreferrer">在线预览' + arrow('up') + '</a>';
    if (p.repo) links += '<a class="btn" href="' + esc(safeUrl(p.repo)) + '" target="_blank" rel="noopener noreferrer">源代码' + arrow('up') + '</a>';

    panel.innerHTML =
      '<button class="modal-close" type="button" aria-label="关闭">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">' +
        '<path d="M6 6l12 12M18 6L6 18"/></svg></button>' +
      (p.cover ? '<div class="modal-media"><img src="' + esc(safeUrl(p.cover)) + '" alt="' + esc(p.title) + '"></div>' : '') +
      '<div class="modal-body">' +
        '<div class="modal-meta"><span>' + esc(p.category) + '</span><span>' + esc(p.year) + '</span></div>' +
        '<h2 class="modal-title">' + esc(p.title) + '</h2>' +
        (p.summary ? '<p class="modal-lede">' + esc(p.summary) + '</p>' : '') +
        '<div class="prose">' + PF.richText(p.body) + '</div>' +
        (tags ? '<div class="tags">' + tags + '</div>' : '') +
        (links ? '<div class="modal-links">' + links + '</div>' : '') +
      '</div>';

    el.modal.classList.add('is-open');
    document.body.classList.add('is-locked');
    $('.modal-close', el.modal).addEventListener('click', closeModal);
    panel.scrollTop = 0;
    setTimeout(function () { panel.focus(); }, 60);
  }

  function closeModal() {
    if (!el.modal) return;
    el.modal.classList.remove('is-open');
    document.body.classList.remove('is-locked');
    if (state.lastFocus && state.lastFocus.focus) state.lastFocus.focus();
  }

  function bindWork() {
    var grid = $('.work-grid');
    if (!grid) return;
    grid.addEventListener('click', function (e) {
      var card = e.target.closest('.card');
      if (card) openModal(Number(card.dataset.idx));
    });
    grid.addEventListener('keydown', function (e) {
      var card = e.target.closest('.card');
      if (card && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        openModal(Number(card.dataset.idx));
      }
    });
  }

  /* ---------------- 滚动效果 ---------------- */
  function observeReveals() {
    var items = document.querySelectorAll('.reveal:not(.is-in)');
    if (!('IntersectionObserver' in window)) {
      items.forEach(function (n) { n.classList.add('is-in'); });
      return;
    }
    if (!revealObs) {
      revealObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            en.target.classList.add('is-in');
            revealObs.unobserve(en.target);
          }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    }
    items.forEach(function (n, i) {
      n.style.transitionDelay = Math.min(i % 6, 5) * 60 + 'ms';
      revealObs.observe(n);
    });
  }

  function bindScroll() {
    var nav = $('#nav');
    var onScroll = function () {
      if (nav) nav.classList.toggle('is-stuck', window.scrollY > 10);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    if (!('IntersectionObserver' in window)) return;
    var links = document.querySelectorAll('.nav-links a');
    if (!links.length) return;
    var map = {};
    links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var a = map[en.target.id];
        if (!a) return;
        if (en.isIntersecting) {
          links.forEach(function (l) { l.classList.remove('is-active'); });
          a.classList.add('is-active');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(map).forEach(function (id) {
      var s = document.getElementById(id);
      if (s) spy.observe(s);
    });
  }

  /* ---------------- 主渲染 ---------------- */
  function renderHead(c) {
    document.documentElement.setAttribute('lang', c.meta.lang || 'zh-CN');
    document.title = c.meta.title;
    var d = document.querySelector('meta[name="description"]');
    if (d) d.setAttribute('content', c.meta.description || '');
    var ogt = document.querySelector('meta[property="og:title"]');
    if (ogt) ogt.setAttribute('content', c.meta.title);
    var ogd = document.querySelector('meta[property="og:description"]');
    if (ogd) ogd.setAttribute('content', c.meta.description || '');
    document.documentElement.setAttribute('data-display', c.meta.font === 'sans' ? 'sans' : 'serif');
    var accent = c.meta.accent || '#b5471f';
    document.documentElement.style.setProperty('--accent', accent);
    document.documentElement.style.setProperty('--accent-fade', PF.withAlpha(accent, 0.12));
  }

  function renderAll() {
    var c = state.content;
    renderHead(c);
    renderNav(c);
    renderHero(c);
    renderWork(c);
    renderAbout(c);
    renderContact(c);
    renderFooter(c);
    applyTheme();
    observeReveals();
    bindWork();
  }

  function boot() {
    buildModal();
    renderAll();
    bindScroll();

    /* 兜底：万一 IntersectionObserver 没触发（旧浏览器/异常布局），
       保证已经进入视口的内容不会一直停在透明状态。 */
    setTimeout(function () {
      document.querySelectorAll('.reveal:not(.is-in)').forEach(function (n) {
        var r = n.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) n.classList.add('is-in');
      });
    }, 900);

    /* 后台预览：接收草稿 */
    window.addEventListener('message', function (e) {
      var d = e.data;
      if (!d || typeof d !== 'object') return;
      if (d.type === 'pf-draft' && d.content) {
        state.content = PF.merge(d.content);
        renderAll();
      }
    });

    if (state.preview && window.parent && window.parent !== window) {
      try { window.parent.postMessage({ type: 'pf-ready' }, '*'); } catch (err) { /* ignore */ }
    }

    /* 分享链接：?p=1 直接打开第 1 个项目的详情 */
    var deep = urlParam('p');
    if (deep !== '' && !isNaN(Number(deep))) {
      setTimeout(function () { openModal(Number(deep)); }, 120);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();

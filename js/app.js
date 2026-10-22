/* ==========================================================================
   DESKTOP 001 — логика рабочего стола.
   Модули: Util · Navigation · Desktop/Folder · WindowManager/Window ·
   ProjectExplorer/ProjectCard · ProjectCase · AboutWindow · ContactWindow ·
   Lightbox · Cursor · Orb · Router.  Без зависимостей.
   ========================================================================== */
(() => {
  'use strict';

  const SITE = window.SITE;
  const CATS = window.CATEGORIES;
  const PROJECTS = window.PROJECTS;
  const ARCHIVE = window.ARCHIVE || [];
  const BASE_TITLE = SITE.owner.name;

  /* ================= Util ================= */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const pad = (n) => String(n).padStart(2, '0');
  const mqMobile = matchMedia('(max-width: 760px)');
  const mqReduce = matchMedia('(prefers-reduced-motion: reduce)');
  const isMobile = () => mqMobile.matches;
  const reduced = () => mqReduce.matches;
  const EASE = 'cubic-bezier(.2,.8,.2,1)';
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* storage unavailable */ } },
  };
  const plural = (n, forms) => {
    const a = n % 100, b = n % 10;
    if (a > 10 && a < 20) return forms[2];
    if (b > 1 && b < 5) return forms[1];
    if (b === 1) return forms[0];
    return forms[2];
  };
  const byCat = (id) => (id === 'archive' ? ARCHIVE : PROJECTS.filter((p) => p.category === id));
  const ORDERED = [...CATS.flatMap((c) => byCat(c.id)), ...ARCHIVE];
  const findProject = (id) => ORDERED.find((p) => p.id === id);
  const catOf = (p) => CATS.find((c) => c.id === p.category) || { id: 'archive', n: '04', title: 'ARCHIVE', ru: 'Архив' };
  const captionOf = (alt) => (alt.includes(' — ') ? alt.split(' — ').slice(1).join(' — ') : alt);

  const desk = $('#desk');
  const layer = $('#windows');
  document.documentElement.classList.add('js-reveal');

  function imgTag(m, { cls = '', sizes = '', eager = false, thumb = false } = {}) {
    const src = thumb && m.thumb ? m.thumb : m.src;
    return `<img class="${cls}" src="${esc(src)}" alt="${esc(m.alt)}" width="${m.w}" height="${m.h}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" ${sizes}>`;
  }
  // Обработка отсутствующих изображений
  document.addEventListener('error', (e) => {
    const t = e.target;
    if (t.tagName !== 'IMG' || t.dataset.failed) return;
    t.dataset.failed = '1';
    const box = el(`<span class="img-missing mono">Изображение не найдено<br>${esc(t.getAttribute('src'))}</span>`);
    t.replaceWith(box);
  }, true);

  /* ================= Toast ================= */
  const toastEl = $('#toast');
  let toastT;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('is-on');
    clearTimeout(toastT);
    toastT = setTimeout(() => toastEl.classList.remove('is-on'), 1900);
  }

  /* ================= Navigation (space label, title) ================= */
  const Navigation = {
    set(label, title) {
      $('#space-label').textContent = label;
      document.title = title ? `${title} · ${BASE_TITLE}` : BASE_TITLE;
    },
  };

  /* ================= Desktop + Folder ================= */
  function Folder(cat, i) {
    const items = byCat(cat.id);
    const sheets = items.slice(0, 3).reverse()
      .map((p) => `<span class="folder__sheet" style="background-image:url('${esc(p.cover.thumb || p.cover.src)}')"></span>`).join('');
    const count = items.length ? `${items.length} ${plural(items.length, ['файл', 'файла', 'файлов'])}` : 'пусто';
    return el(`
      <button type="button" class="folder ${items.length ? '' : 'is-empty'}" data-open="${cat.id}" data-cursor="OPEN" style="--i:${3 + i}"
        aria-label="Папка ${esc(cat.title)}: ${esc(cat.ru)}, ${count}">
        <span class="folder__icon" aria-hidden="true">
          <span class="folder__back"></span>
          <span class="folder__sheets">${sheets}</span>
          <span class="folder__front"><span class="folder__num">${cat.n}</span><span class="folder__led"></span></span>
        </span>
        <span class="folder__meta">
          <span class="folder__title">${esc(cat.title)}</span>
          <span class="folder__ru">${esc(cat.ru)}</span>
          <span class="mono folder__count">${count}</span>
        </span>
      </button>`);
  }

  const Desktop = {
    render() {
      $('#hero-lead').textContent = SITE.lead;
      const f = $('#folders');
      CATS.forEach((c, i) => f.appendChild(Folder(c, i)));
      const docs = [
        { key: 'about', name: 'ABOUT.txt', sub: 'Обо мне', icon: 'ico-page' },
        { key: 'contact', name: 'CONTACT.card', sub: 'Контакты', icon: 'ico-card' },
        { key: 'readme', name: 'README', sub: 'Как это работает', icon: 'ico-readme', glyph: '?' },
      ];
      if (ARCHIVE.length) docs.push({ key: 'archive', name: 'ARCHIVE', sub: `${ARCHIVE.length} ${plural(ARCHIVE.length, ['работа', 'работы', 'работ'])}`, icon: 'ico-archive' });
      const d = $('#docs');
      docs.forEach((doc, i) => d.appendChild(el(`
        <button type="button" class="doc" data-open="${doc.key}" data-cursor="OPEN" style="--i:${i}">
          <span class="doc__icon" aria-hidden="true"><span class="${doc.icon}">${doc.glyph || ''}</span></span>
          <span class="doc__name">${doc.name}<span class="doc__sub">${doc.sub}</span></span>
        </button>`)));
    },
    sync(openKeys) {
      $$('.folder').forEach((f) => f.classList.toggle('is-open', openKeys.has(f.dataset.open)));
    },
  };

  /* ================= Window definitions ================= */
  const DOC_SIZES = { about: [540, 600], contact: [560, 520], readme: [500, 520], privacy: [600, 600], '404': [460, 320] };

  function defineWindow(key, opts = {}) {
    const cat = CATS.find((c) => c.id === key) || (key === 'archive' && ARCHIVE.length ? { id: 'archive', n: '04', title: 'ARCHIVE', ru: 'Дополнительные работы' } : null);
    if (cat) {
      const n = byCat(cat.id).length;
      return {
        token: cat.id, file: `${cat.n}_${cat.title}/`, meta: `${n} ${plural(n, ['файл', 'файла', 'файлов'])}`,
        label: cat.title.toLowerCase(), title: cat.title, task: cat.title,
        size: [1040, 720], kind: 'folder',
        render: (body) => ProjectExplorer(body, cat),
      };
    }
    if (key === 'case') {
      const p = opts.project;
      const c = catOf(p);
      return {
        token: p.id, file: `${c.title}/${p.id}.case`, meta: p.kind || '',
        label: `${c.title.toLowerCase()}/${p.id}`, title: p.title, task: p.title,
        size: [1200, 900], max: true, kind: 'case',
        render: (body, win) => ProjectCase(body, p, win),
      };
    }
    const docs = {
      about: { file: 'ABOUT.txt', meta: 'text', title: 'About', render: AboutWindow },
      contact: { file: 'CONTACT.card', meta: 'card', title: 'Контакты', render: ContactWindow },
      readme: { file: 'README', meta: 'help', title: 'README', render: ReadmeWindow },
      privacy: { file: 'PRIVACY.txt', meta: 'policy', title: 'Конфиденциальность', render: PrivacyWindow },
      '404': { file: '404', meta: 'file not found', title: 'Файл не найден', render: (b) => NotFoundWindow(b, opts.missing) },
    };
    const d = docs[key];
    if (!d) return null;
    return { token: key === '404' ? '' : key, label: d.file.toLowerCase(), task: d.file, size: DOC_SIZES[key], kind: 'doc', ...d };
  }

  /* ================= WindowManager ================= */
  const WM = {
    wins: new Map(),
    order: [],      // z-order, last = top
    active: null,
    cascade: 0,

    deskRect() { return desk.getBoundingClientRect(); },

    open(key, opts = {}) {
      if (key === 'case' && this.wins.has('case')) {
        const w = this.wins.get('case');
        if (w.project !== opts.project) this.swapCase(w, opts.project, opts.origin);
        if (w.min) this.restore(w);
        this.focus(w);
        return w;
      }
      if (this.wins.has(key)) {
        const w = this.wins.get(key);
        if (w.min) this.restore(w); else this.focus(w);
        return w;
      }
      const def = defineWindow(key, opts);
      if (!def) return this.open('404', { missing: opts.token || key });
      const w = this.create(key, def, opts);
      return w;
    },

    create(key, def, opts) {
      const id = `win-${key}`;
      const isCase = def.kind === 'case';
      const node = el(`
        <section class="win ${isCase ? 'is-case' : ''}" id="${id}" role="dialog" aria-modal="false" aria-labelledby="${id}-t">
          <div class="win__bar" data-cursor="DRAG">
            <span class="win__led" aria-hidden="true"></span>
            <button type="button" class="win__btn win__btn--back mono" data-win="close" aria-label="Назад">← Назад</button>
            <div class="win__file mono"><b id="${id}-t"></b><span class="win__meta"></span></div>
            <div class="win__ctrl">
              ${isCase ? '<button type="button" class="win__btn win__btn--text win__btn--focus" data-win="focus" aria-pressed="false">Focus</button>' : ''}
              <button type="button" class="win__btn win__btn--min" data-win="min" aria-label="Свернуть окно">–</button>
              <button type="button" class="win__btn win__btn--max" data-win="max" aria-label="Развернуть окно">□</button>
              <button type="button" class="win__btn win__btn--close" data-win="close" aria-label="Закрыть окно">✕</button>
            </div>
          </div>
          <div class="win__body" tabindex="-1"></div>
        </section>`);
      const w = {
        key, def, el: node, bar: $('.win__bar', node), body: $('.win__body', node),
        project: opts.project || null, origin: opts.origin || null, opener: document.activeElement,
        min: false, max: !!def.max, x: 0, y: 0, w: 0, h: 0,
      };
      this.setBar(w);
      const r = this.deskRect();
      const [sw, sh] = def.size;
      w.w = Math.min(sw, r.width - 48);
      w.h = Math.min(sh, r.height - 40);
      const c = this.cascade++ % 6;
      if (def.kind === 'folder') {
        w.x = clamp(r.width * 0.05 + c * 30, 16, r.width - w.w - 16);
        w.y = clamp(16 + c * 26, 12, r.height - w.h - 12);
      } else {
        w.x = clamp((r.width - w.w) / 2 + c * 26 - 60, 16, Math.max(16, r.width - w.w - 16));
        w.y = clamp((r.height - w.h) / 2 + c * 22 - 20, 12, Math.max(12, r.height - w.h - 12));
      }
      layer.appendChild(node);
      this.wins.set(key, w);
      this.apply(w);
      def.render(w.body, w);
      this.bind(w);
      this.focus(w, { silent: true });
      this.animateOpen(w);
      requestAnimationFrame(() => ($('h2', w.body) || w.body).focus({ preventScroll: true }));
      if (def.kind === 'folder') {
        const n = byCat(key).length;
        toast(n ? `${n} ${n === 1 ? 'PROJECT' : 'PROJECTS'} FOUND` : 'FOLDER IS EMPTY');
      }
      this.sync();
      return w;
    },

    setBar(w) {
      $('.win__file b', w.el).textContent = w.def.file;
      $('.win__meta', w.el).textContent = w.def.meta;
      w.el.setAttribute('aria-label', w.def.title);
    },

    apply(w) {
      const s = w.el.style;
      w.el.classList.toggle('is-max', w.max);
      $('.win__btn--max', w.el)?.setAttribute('aria-label', w.max ? 'Восстановить размер окна' : 'Развернуть окно');
      if (w.max) {
        s.left = '0px'; s.top = '0px'; s.width = '100%'; s.height = '100%';
      } else {
        s.left = `${w.x}px`; s.top = `${w.y}px`; s.width = `${w.w}px`; s.height = `${w.h}px`;
      }
    },

    fit(w) {
      const r = this.deskRect();
      w.w = Math.min(w.w, r.width - 24);
      w.h = Math.min(w.h, r.height - 24);
      w.x = clamp(w.x, -(w.w - 120), r.width - 120);
      w.y = clamp(w.y, 0, r.height - 40);
      this.apply(w);
    },

    bind(w) {
      w.el.addEventListener('pointerdown', () => { if (this.active !== w) this.focus(w); }, true);
      w.el.addEventListener('click', (e) => {
        const b = e.target.closest('[data-win]');
        if (!b) return;
        const act = b.dataset.win;
        if (act === 'close') this.close(w);
        else if (act === 'min') this.minimize(w);
        else if (act === 'max') { w.max = !w.max; this.apply(w); }
        else if (act === 'focus') Focus.toggle();
      });
      w.bar.addEventListener('dblclick', (e) => {
        if (e.target.closest('button') || isMobile()) return;
        w.max = !w.max; this.apply(w);
      });
      // Перетаскивание только за заголовок
      let drag = null;
      w.bar.addEventListener('pointerdown', (e) => {
        if (e.button !== 0 || e.target.closest('button') || isMobile() || w.max) return;
        drag = { id: e.pointerId, sx: e.clientX, sy: e.clientY, x: w.x, y: w.y };
        w.bar.setPointerCapture(e.pointerId);
        w.el.classList.add('is-dragging');
      });
      w.bar.addEventListener('pointermove', (e) => {
        if (!drag || e.pointerId !== drag.id) return;
        const r = this.deskRect();
        w.x = clamp(drag.x + e.clientX - drag.sx, -(w.w - 120), r.width - 120);
        w.y = clamp(drag.y + e.clientY - drag.sy, 0, r.height - 40);
        w.el.style.left = `${w.x}px`; w.el.style.top = `${w.y}px`;
      });
      const end = (e) => {
        if (!drag || e.pointerId !== drag.id) return;
        drag = null; w.el.classList.remove('is-dragging');
      };
      w.bar.addEventListener('pointerup', end);
      w.bar.addEventListener('pointercancel', end);
      // Клавиатурное перемещение: стрелки при фокусе на заголовке окна
      w.bar.tabIndex = -1;
    },

    focus(w, { silent = false } = {}) {
      this.order = this.order.filter((x) => x !== w);
      this.order.push(w);
      this.order.forEach((x, i) => { x.el.style.zIndex = String(10 + i); });
      this.active = w;
      this.wins.forEach((x) => x.el.classList.toggle('is-active', x === w));
      Navigation.set(w.def.label, w.def.title);
      if (!silent) Router.replace(w.def.token);
      this.sync();
    },

    topVisible() {
      for (let i = this.order.length - 1; i >= 0; i--) if (!this.order[i].min) return this.order[i];
      return null;
    },

    close(w, { all = false } = {}) {
      if (!this.wins.has(w.key)) return;
      if (w.key === 'case' && Focus.on) Focus.toggle(false);
      this.wins.delete(w.key);
      this.order = this.order.filter((x) => x !== w);
      const node = w.el;
      const done = () => node.remove();
      const origin = w.origin && document.contains(w.origin) && w.origin.getClientRects().length ? w.origin : null;
      if (reduced() || all) done();
      else if (isMobile()) node.animate([{ transform: 'none' }, { transform: 'translateY(100%)' }], { duration: 320, easing: 'cubic-bezier(.6,0,.8,.2)' }).onfinish = done;
      else if (origin && !w.min) this.flip(node, origin.getBoundingClientRect(), true).onfinish = done;
      else node.animate([{ opacity: 1 }, { opacity: 0, transform: 'scale(.97)' }], { duration: 200, easing: 'ease-in' }).onfinish = done;

      if (all) return;
      const next = this.topVisible();
      if (next) {
        this.focus(next);
        const target = w.opener && document.contains(w.opener) && w.opener.closest('.win') === next.el ? w.opener : null;
        (target || next.body).focus({ preventScroll: true });
      } else {
        this.active = null;
        Navigation.set('desktop');
        Router.replace('');
        toast('BACK TO DESKTOP');
        const back = w.opener && document.contains(w.opener) && !w.opener.closest('.win') ? w.opener : $(`.folder[data-open="${w.key}"]`);
        back?.focus({ preventScroll: true });
      }
      this.sync();
    },

    closeAll() {
      if (!this.wins.size) return;
      [...this.wins.values()].forEach((w) => this.close(w, { all: true }));
      this.active = null;
      Navigation.set('desktop');
      toast('BACK TO DESKTOP');
      this.sync();
    },

    minimize(w) {
      if (isMobile()) return this.close(w);
      const chip = $(`.task[data-key="${w.key}"]`);
      const finish = () => { w.el.hidden = true; };
      w.min = true;
      if (!reduced() && chip) this.flip(w.el, chip.getBoundingClientRect(), true).onfinish = finish;
      else finish();
      const next = this.topVisible();
      if (next) this.focus(next);
      else { this.active = null; Navigation.set('desktop'); Router.replace(''); this.wins.forEach((x) => x.el.classList.remove('is-active')); }
      this.sync();
    },

    restore(w) {
      w.min = false;
      w.el.hidden = false;
      this.fit(w);
      const chip = $(`.task[data-key="${w.key}"]`);
      if (!reduced() && chip) this.flip(w.el, chip.getBoundingClientRect(), false);
      this.focus(w);
      w.body.focus({ preventScroll: true });
    },

    // FLIP: окно «вырастает» из исходного объекта (или сворачивается в него)
    flip(node, from, reverse = false) {
      const r = node.getBoundingClientRect();
      const sx = Math.max(from.width / r.width, 0.02);
      const sy = Math.max(from.height / r.height, 0.02);
      const t = `translate(${from.left - r.left}px, ${from.top - r.top}px) scale(${sx}, ${sy})`;
      const frames = [{ transform: t, opacity: 0.15 }, { transform: 'none', opacity: 1 }];
      return node.animate(reverse ? frames.reverse() : frames, { duration: reverse ? 380 : 580, easing: reverse ? 'cubic-bezier(.5,0,.75,0)' : EASE });
    },

    animateOpen(w) {
      if (reduced()) return;
      if (isMobile()) {
        w.el.animate([{ transform: 'translateY(100%)' }, { transform: 'none' }], { duration: 460, easing: EASE });
        return;
      }
      const o = w.origin && w.origin.getClientRects().length ? w.origin.getBoundingClientRect() : null;
      if (o) {
        this.flip(w.el, o);
        w.body.animate([{ opacity: 0 }, { opacity: 0, offset: 0.35 }, { opacity: 1 }], { duration: 640, easing: 'ease-out' });
      } else {
        w.el.animate([{ opacity: 0, transform: 'translateY(12px) scale(.985)' }, { opacity: 1, transform: 'none' }], { duration: 360, easing: EASE });
      }
    },

    swapCase(w, project, origin) {
      w.project = project;
      w.origin = origin || w.origin;
      w.def = defineWindow('case', { project });
      this.setBar(w);
      const render = () => {
        w.body.scrollTop = 0;
        w.body.innerHTML = '';
        w.def.render(w.body, w);
        $('h2', w.body)?.focus({ preventScroll: true });
        if (!reduced()) w.body.animate([{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }], { duration: 420, easing: EASE });
      };
      if (reduced()) render();
      else w.body.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, easing: 'ease-in' }).onfinish = render;
    },

    sync() {
      // Dock: задачи
      const tasks = $('#tasks');
      tasks.innerHTML = '';
      this.wins.forEach((w) => {
        const b = el(`<button type="button" class="task ${w === this.active ? 'is-active' : ''} ${w.min ? 'is-min' : ''}" data-key="${w.key}"
          aria-label="${w.min ? 'Восстановить' : 'Перейти к окну'}: ${esc(w.def.title)}"><span>${esc(w.def.task)}</span></button>`);
        b.addEventListener('click', () => (w.min ? this.restore(w) : (this.active === w ? this.minimize(w) : (this.focus(w), w.body.focus({ preventScroll: true })))));
        tasks.appendChild(b);
      });
      const visible = [...this.wins.values()].some((w) => !w.min);
      desk.classList.toggle('is-dim', visible);
      document.body.classList.toggle('is-locked', visible && isMobile());
      document.body.classList.toggle('is-paused', visible && [...this.wins.values()].some((w) => !w.min && (w.max || isMobile())));
      Desktop.sync(new Set([...this.wins.values()].filter((w) => !w.min).map((w) => w.key)));
    },

    relayout() { this.wins.forEach((w) => { if (!w.min) this.fit(w); }); },
  };

  /* ================= Focus mode ================= */
  const Focus = {
    on: false,
    toggle(force) {
      const next = typeof force === 'boolean' ? force : !this.on;
      const w = WM.wins.get('case');
      if (next && !w) return;
      this.on = next;
      document.body.classList.toggle('is-focus', next);
      if (w) {
        if (next) { w.wasMax = w.max; w.max = true; } else if (w.wasMax === false) w.max = false;
        WM.apply(w);
        const b = $('.win__btn--focus', w.el);
        if (b) { b.textContent = next ? 'Exit focus' : 'Focus'; b.setAttribute('aria-pressed', String(next)); }
      }
      toast(next ? 'FOCUS MODE · ESC TO EXIT' : 'FOCUS MODE OFF');
    },
  };

  /* ================= ProjectExplorer + ProjectCard ================= */
  function ProjectCard(p, i, ar) {
    const tags = [p.live ? '<span class="chip chip--signal mono">Live</span>' : '', p.concept ? '<span class="chip mono">Концепт</span>' : ''].join('');
    const meta = [p.year, `${p.images.length} img`].filter(Boolean).join(' · ');
    return el(`
      <button type="button" class="card" data-project="${p.id}" data-cursor="VIEW" aria-label="Открыть кейс: ${esc(p.title)}">
        <span class="card__media" style="--ar:${ar}">
          ${imgTag(p.cover, { thumb: true }).replace('<img ', `<img style="object-position:${p.cover.h > p.cover.w * 1.1 ? '50% 0%' : '50% 50%'}" `)}
          ${tags ? `<span class="card__tag">${tags}</span>` : ''}
          <span class="card__open mono">Открыть кейс →</span>
        </span>
        <span class="card__cap">
          <span class="mono card__idx">${pad(i + 1)}</span>
          <span class="card__title">${esc(p.title)}${p.kind ? `<span class="card__kind">${esc(p.kind)}</span>` : ''}</span>
          <span class="mono card__meta">${esc(meta)}</span>
        </span>
      </button>`);
  }

  function ProjectExplorer(body, cat) {
    const items = byCat(cat.id);
    const n = items.length;
    const wrap = el(`
      <div class="explorer">
        <header class="explorer__head">
          <h2 class="explorer__title" tabindex="-1">${esc(cat.title)}<small>${esc(cat.ru)}</small></h2>
          <p class="mono explorer__found"><span class="status-dot"></span>${n} ${n === 1 ? 'project' : 'projects'} found</p>
        </header>
        <div class="explorer__grid n-${n > 3 ? 'many' : n}"></div>
      </div>`);
    const grid = $('.explorer__grid', wrap);
    if (!n) {
      grid.replaceWith(el(`<div class="empty"><p class="empty__title">Папка пока пуста</p>
        <p>Работы появятся здесь, как только будут добавлены в каталог.</p></div>`));
    }
    const ratios = { 1: ['16 / 9'], 2: ['4 / 5', '4 / 3'], 3: ['4 / 5', '4 / 3', '4 / 3'] };
    items.forEach((p, i) => grid.appendChild(ProjectCard(p, i, (ratios[n] || ['4 / 3', '4 / 5', '16 / 9'])[n > 3 ? i % 3 : i])));
    body.appendChild(wrap);
    new ResizeObserver(([e]) => wrap.classList.toggle('is-narrow', e.contentRect.width < 640)).observe(wrap);
  }

  /* ================= ProjectCase ================= */
  function galleryRows(p) {
    const rows = [];
    let buf = [];
    const flush = () => { if (buf.length) rows.push({ items: buf, portraits: buf[0].h > buf[0].w * 1.15 }); buf = []; };
    p.images.forEach((m, i) => {
      if (m.src === p.cover.src && p.images.length > 1) return; // обложка уже показана сверху
      const portrait = m.h > m.w * 1.15;
      const lastPortrait = buf.length && buf[0].h > buf[0].w * 1.15;
      if (buf.length && portrait !== lastPortrait) flush();
      const max = portrait ? (m.h / m.w > 1.9 ? 3 : 2) : (rows.length === 0 && !buf.length ? 1 : (p.wideRow || 1));
      buf.push({ ...m, index: i });
      if (buf.length >= max) flush();
    });
    flush();
    return rows;
  }

  function ProjectCase(body, p, win) {
    const c = catOf(p);
    const list = byCat(p.category);
    const idx = list.indexOf(p);
    const gi = ORDERED.indexOf(p);
    const prev = ORDERED[(gi - 1 + ORDERED.length) % ORDERED.length];
    const next = ORDERED[(gi + 1) % ORDERED.length];
    const coverPortrait = p.cover.h > p.cover.w * 1.1;

    const meta = [
      ['Категория', `${c.title} · ${c.ru}`],
      p.kind && ['Формат', p.kind],
      p.year && ['Год', p.year],
      ['Материалы', `${p.images.length} ${plural(p.images.length, ['изображение', 'изображения', 'изображений'])}${p.live ? ' + интерактив' : ''}`],
      p.concept && ['Статус', 'Концепт'],
      ...(p.facts || []).map((f) => [f.label, f.value]),
    ].filter(Boolean);

    const rows = galleryRows(p).map((row) => {
      const solo = row.items.length === 1 && row.portraits;
      return `<div class="gallery__row ${row.portraits ? 'is-portraits' : ''}" style="--cols:${row.items.length}">
        ${row.items.map((m) => `
          <figure class="shot reveal" ${solo ? `style="max-width:min(100%, calc(78vh / ${(m.h / m.w).toFixed(3)}));margin-inline:auto;width:100%"` : ''}>
            <button type="button" class="shot__btn" data-shot="${m.index}" style="--ar:${m.w} / ${m.h}" data-cursor="ZOOM" aria-label="Открыть изображение ${m.index + 1}: ${esc(captionOf(m.alt))}">
              ${imgTag(m)}
            </button>
            <figcaption><span class="mono">${pad(m.index + 1)}</span>${esc(captionOf(m.alt))}</figcaption>
          </figure>`).join('')}
      </div>`;
    }).join('');

    const live = p.live ? `
      <section class="live reveal" aria-label="Интерактивная версия">
        <div class="live__bar mono">
          <span class="status-dot"></span><span class="grow">LIVE · ${esc(p.live.label)}</span>
          <a href="${esc(p.live.src)}" target="_blank" rel="noopener">Открыть отдельно ↗</a>
        </div>
        <div class="live__stage" style="--ratio:${esc(p.live.ratio || '16 / 10')}">
          <div class="live__poster">${imgTag(p.cover, { thumb: true })}
            <button type="button" class="live__run mono" data-live="run" data-cursor="PLAY">Запустить интерактив</button>
          </div>
        </div>
      </section>` : '';

    const node = el(`
      <article class="case">
        <div class="case__cover ${coverPortrait ? 'is-contain' : ''}">${imgTag(p.cover, { eager: true })}</div>
        <div class="case__inner">
          <header class="case__head">
            <div>
              <p class="mono case__crumbs"><span>${c.n} ${esc(c.title)}</span><span>/</span><span>${pad(idx + 1)} из ${pad(list.length)}</span></p>
              <h2 class="case__title" tabindex="-1">${esc(p.title)}</h2>
              ${p.description ? `<p class="case__desc">${esc(p.description)}</p>` : ''}
            </div>
            <dl class="meta mono-dl">${meta.map(([k, v]) => `<div><dt class="mono">${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
          </header>
          ${p.sections?.length ? `<div class="case__sections">${p.sections.map((s) => `
            <section class="case__section reveal"><h3 class="mono">${esc(s.heading)}</h3><p>${esc(s.text)}</p></section>`).join('')}</div>` : '<div style="height:36px"></div>'}
          ${p.swatches?.length ? `<div class="swatches reveal" aria-label="Фирменные цвета">${p.swatches.map((s) => `
            <div class="swatch" style="--c:${esc(s.hex)}"><span class="swatch__chip"></span>
              <span class="swatch__txt"><span class="mono">${esc(s.hex)}</span>${esc(s.name)}</span></div>`).join('')}</div>` : ''}
          ${live}
          <div class="gallery">${rows}</div>
          ${p.note ? `<p class="case__note"><span class="mono">NOTE</span><span>${esc(p.note)}</span></p>` : ''}
          ${p.externalUrl ? `<a class="case__ext" href="${esc(p.externalUrl)}" target="_blank" rel="noopener">Открыть проект ↗</a>` : ''}
          <nav class="case__pager" aria-label="Другие проекты">
            <button type="button" class="pager-btn" data-project="${prev.id}" data-cursor="PREV"><span class="mono">← Предыдущий</span><span>${esc(prev.title)}</span></button>
            <button type="button" class="pager-back mono" data-back="${c.id}">К папке ${esc(c.title)}</button>
            <button type="button" class="pager-btn pager-btn--next" data-project="${next.id}" data-cursor="NEXT"><span class="mono">Следующий →</span><span>${esc(next.title)}</span></button>
          </nav>
        </div>
      </article>`);
    body.appendChild(node);

    // Раскрытие обложки
    const cover = $('.case__cover', node);
    if (!reduced()) {
      cover.animate([{ clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)' }], { duration: 900, easing: EASE, delay: 120, fill: 'backwards' });
      $('img', cover).animate([{ transform: 'scale(1.08)' }, { transform: 'scale(1)' }], { duration: 1400, easing: EASE, delay: 120, fill: 'backwards' });
    }
    // Лёгкий параллакс обложки
    const cimg = $('img', cover);
    let ticking = false;
    const onScroll = () => {
      if (ticking || reduced()) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = body.scrollTop;
        if (y < cover.offsetHeight && cimg) cimg.style.transform = `translate3d(0, ${y * 0.18}px, 0)`;
        ticking = false;
      });
    };
    body.addEventListener('scroll', onScroll, { passive: true });

    // Появление при прокрутке
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    }), { root: isMobile() ? null : body, rootMargin: '0px 0px -6% 0px', threshold: 0.01 });
    $$('.reveal', node).forEach((r) => io.observe(r));
    // Страховка: всё, что уже видно, — видно сразу
    setTimeout(() => $$('.reveal', node).forEach((r) => { if (r.getBoundingClientRect().top < innerHeight) r.classList.add('is-in'); }), 60);

    node.addEventListener('click', (e) => {
      const shot = e.target.closest('[data-shot]');
      if (shot) return Lightbox.open(p, +shot.dataset.shot, shot);
      const run = e.target.closest('[data-live="run"]');
      if (run) {
        const stage = run.closest('.live__stage');
        stage.innerHTML = `<iframe src="${esc(p.live.src)}" title="Интерактивная версия: ${esc(p.title)}" loading="lazy" allow="clipboard-write"></iframe>`;
        $('iframe', stage).focus();
        return;
      }
      const back = e.target.closest('[data-back]');
      if (back) {
        const folder = WM.open(back.dataset.back);
        WM.close(win);
        WM.focus(folder);
      }
    });
  }

  /* ================= Doc windows ================= */
  function AboutWindow(body) {
    const a = SITE.about;
    body.appendChild(el(`
      <div class="doc-body">
        <p class="mono label">ABOUT.txt</p>
        <h2 tabindex="-1">${esc(a.title)}</h2>
        ${a.text.map((t) => `<p>${esc(t)}</p>`).join('')}
        <p class="mono label">Направления</p>
        <ul class="doc-list">${a.skills.map((s) => `<li><span>${esc(s)}</span></li>`).join('')}</ul>
        <p class="mono label">На рабочем столе</p>
        <ul class="doc-list">${CATS.map((c) => {
          const n = byCat(c.id).length;
          return `<li><button type="button" data-open="${c.id}">${c.n} ${esc(c.title)}</button><span class="mono">${n} ${plural(n, ['проект', 'проекта', 'проектов'])}</span></li>`;
        }).join('')}</ul>
        <div><button type="button" class="btn btn--signal" data-open="contact">Связаться →</button></div>
      </div>`));
  }

  async function copyText(text, node, label) {
    try {
      await navigator.clipboard.writeText(text);
      toast(`${label} COPIED`);
    } catch {
      if (node) {
        const range = document.createRange();
        range.selectNodeContents(node);
        const sel = getSelection(); sel.removeAllRanges(); sel.addRange(range);
      }
      toast('ВЫДЕЛЕНО — НАЖМИТЕ CTRL+C');
    }
  }

  function ContactWindow(body) {
    const c = SITE.contacts;
    const tgHandle = c.telegram ? '@' + c.telegram.replace(/^https?:\/\/(t\.me|telegram\.me)\//i, '').replace(/^@/, '').replace(/\/$/, '') : '';
    const tgUrl = c.telegram ? (/^https?:/i.test(c.telegram) ? c.telegram : `https://t.me/${c.telegram.replace(/^@/, '')}`) : '';
    const rows = [];
    if (c.email) rows.push(`
      <div class="contact-row"><span class="mono">Email</span>
        <span class="contact-row__val" id="c-email">${esc(c.email)}</span>
        <span class="contact-actions">
          <button type="button" class="btn" data-copy="email">Копировать</button>
          <a class="btn" href="mailto:${esc(c.email)}">Написать</a>
        </span></div>`);
    if (tgUrl) rows.push(`
      <div class="contact-row"><span class="mono">Telegram</span>
        <span class="contact-row__val"><a href="${esc(tgUrl)}" target="_blank" rel="noopener" id="c-tg">${esc(tgHandle)}</a></span>
        <span class="contact-actions">
          <button type="button" class="btn" data-copy="tg">Копировать</button>
          <a class="btn btn--signal" href="${esc(tgUrl)}" target="_blank" rel="noopener">Открыть ↗</a>
        </span></div>`);
    (c.links || []).filter((l) => l && l.url).forEach((l) => rows.push(`
      <div class="contact-row"><span class="mono">${esc(l.label)}</span>
        <span class="contact-row__val"><a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, ''))}</a></span>
        <span class="contact-actions"><a class="btn" href="${esc(l.url)}" target="_blank" rel="noopener">Открыть ↗</a></span></div>`));
    const node = el(`
      <div class="doc-body">
        <p class="mono label">CONTACT.card</p>
        <h2 tabindex="-1">Есть идея? <em>Давай придадим ей форму</em></h2>
        ${rows.length ? `<div>${rows.join('')}</div>` : '<p class="pending">Контакты скоро появятся на этой карточке.</p>'}
      </div>`);
    node.addEventListener('click', (e) => {
      const b = e.target.closest('[data-copy]');
      if (!b) return;
      if (b.dataset.copy === 'email') copyText(c.email, $('#c-email', node), 'EMAIL');
      else copyText(tgUrl, $('#c-tg', node), 'LINK');
    });
    body.appendChild(node);
  }

  function ReadmeWindow(body) {
    body.appendChild(el(`
      <div class="doc-body">
        <p class="mono label">README</p>
        <h2 tabindex="-1">Как устроен <em>этот стол</em></h2>
        <ul class="doc-list">
          <li><span>Папка открывает категорию работ, карточка — кейс</span><span class="kbd">Click / Enter</span></li>
          <li><span>Окно перемещается за верхнюю панель</span><span class="kbd">Drag</span></li>
          <li><span>Развернуть окно на весь стол</span><span class="kbd">□ / Double-click</span></li>
          <li><span>Свернуть в док и вернуть обратно</span><span class="kbd">–</span></li>
          <li><span>Закрыть активное окно</span><span class="kbd">Esc</span></li>
          <li><span>Режим Focus в кейсе</span><span class="kbd">F</span></li>
          <li><span>Листать изображения в просмотре</span><span class="kbd">← →</span></li>
        </ul>
        <p>На телефоне разделы открываются полноэкранными панелями, а кнопка «Назад» возвращает на шаг выше.</p>
      </div>`));
  }

  function PrivacyWindow(body) {
    body.appendChild(el(`
      <div class="doc-body">
        <p class="mono label">PRIVACY.txt</p>
        <h2 tabindex="-1">Конфиденциальность</h2>
        <p>Сайт не использует регистрацию, формы, cookies и системы аналитики и не собирает персональные данные посетителей.</p>
        <p>Шрифты загружаются с серверов Google Fonts. При этом браузер передаёт Google технические данные запроса, например IP-адрес и сведения о браузере.</p>
        <p>В локальном хранилище браузера сохраняется одна отметка о том, что вступительная анимация уже была показана. Её можно удалить, очистив данные сайта в настройках браузера.</p>
        <p>Хостинг, на котором размещён сайт, может вести стандартные технические журналы обращений.</p>
        <p>Если вы пишете на указанные контакты, переписка ведётся в выбранном вами сервисе и подчиняется его правилам.</p>
      </div>`));
  }

  function NotFoundWindow(body, missing) {
    body.appendChild(el(`
      <div class="doc-body">
        <p class="mono label">404 · FILE NOT FOUND</p>
        <h2 tabindex="-1">Такого файла <em>нет на столе</em></h2>
        <p>${missing ? `Адрес «${esc(missing)}» не ведёт ни к одной работе.` : 'Запрошенный файл не найден.'} Возможно, проект переименован или ещё не добавлен.</p>
        <div><button type="button" class="btn btn--signal" data-action="home">Вернуться на рабочий стол</button></div>
      </div>`));
  }

  /* ================= Lightbox ================= */
  const Lightbox = {
    node: $('#lightbox'), img: $('#lb-img'), p: null, i: 0, opener: null,
    open(p, i, opener) {
      this.p = p; this.opener = opener; this.node.hidden = false;
      this.show(i);
      $('#lb-close').focus();
      if (!reduced()) this.node.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220 });
    },
    show(i) {
      const n = this.p.images.length;
      this.i = (i + n) % n;
      const m = this.p.images[this.i];
      this.img.src = m.src; this.img.alt = m.alt;
      $('#lb-count').textContent = `${pad(this.i + 1)} / ${pad(n)}`;
      $('#lb-title').textContent = `${this.p.title} — ${captionOf(m.alt)}`;
      if (!reduced()) this.img.animate([{ opacity: 0, transform: 'scale(.985)' }, { opacity: 1, transform: 'none' }], { duration: 260, easing: EASE });
    },
    close() {
      this.node.hidden = true; this.img.removeAttribute('src');
      this.opener?.focus({ preventScroll: true });
    },
    get isOpen() { return !this.node.hidden; },
    init() {
      $('#lb-close').addEventListener('click', () => this.close());
      $('#lb-prev').addEventListener('click', () => this.show(this.i - 1));
      $('#lb-next').addEventListener('click', () => this.show(this.i + 1));
      this.node.addEventListener('click', (e) => { if (e.target === this.node || e.target.classList.contains('lightbox__stage')) this.close(); });
      this.node.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') this.show(this.i - 1);
        else if (e.key === 'ArrowRight') this.show(this.i + 1);
        else if (e.key === 'Tab') { // удерживаем фокус внутри просмотра
          const f = [$('#lb-close'), $('#lb-prev'), $('#lb-next')];
          const k = f.indexOf(document.activeElement);
          e.preventDefault();
          f[(k + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
        }
      });
      // Свайп на сенсорных экранах
      let sx = null;
      this.node.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; }, { passive: true });
      this.node.addEventListener('touchend', (e) => {
        if (sx == null) return;
        const dx = e.changedTouches[0].clientX - sx;
        if (Math.abs(dx) > 50) this.show(this.i + (dx < 0 ? 1 : -1));
        sx = null;
      });
    },
  };

  /* ================= Cursor ================= */
  const Cursor = {
    init() {
      if (!matchMedia('(pointer: fine) and (hover: hover)').matches) return;
      const c = $('#cursor'), label = $('.cursor__label', c);
      let x = -100, y = -100, tx = -100, ty = -100, raf = 0;
      const loop = () => {
        x += (tx - x) * 0.3; y += (ty - y) * 0.3;
        c.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.3 ? requestAnimationFrame(loop) : 0;
      };
      addEventListener('pointermove', (e) => {
        if (e.pointerType !== 'mouse') return;
        tx = e.clientX; ty = e.clientY;
        if (reduced()) { x = tx; y = ty; c.style.transform = `translate3d(${x}px, ${y}px, 0)`; }
        else if (!raf) raf = requestAnimationFrame(loop);
      }, { passive: true });
      document.addEventListener('pointerover', (e) => {
        const t = e.target.closest?.('button, a, [data-cursor]');
        c.classList.toggle('is-hover', !!t);
        label.textContent = t?.dataset.cursor || '';
        c.classList.remove('is-hidden');
      });
      document.addEventListener('pointerleave', () => c.classList.add('is-hidden'));
      addEventListener('blur', () => c.classList.add('is-hidden'));
    },
  };

  /* ================= Orb (металлическая форма, реагирует на курсор) ================= */
  const Orb = {
    init() {
      const orb = $('#orb');
      if (!orb || reduced()) return;
      let cx = 0, cy = 0, tx = 0, ty = 0, raf = 0;
      const loop = () => {
        cx += (tx - cx) * 0.06; cy += (ty - cy) * 0.06;
        orb.style.setProperty('--hx', `${34 + cx * 18}%`);
        orb.style.setProperty('--hy', `${28 + cy * 16}%`);
        orb.style.translate = `${cx * 10}px ${cy * 8}px`;
        raf = Math.abs(tx - cx) + Math.abs(ty - cy) > 0.002 ? requestAnimationFrame(loop) : 0;
      };
      addEventListener('pointermove', (e) => {
        if (document.body.classList.contains('is-paused') || isMobile()) return;
        tx = (e.clientX / innerWidth) * 2 - 1;
        ty = (e.clientY / innerHeight) * 2 - 1;
        if (!raf) raf = requestAnimationFrame(loop);
      }, { passive: true });
    },
  };

  /* ================= Router (hash: #branding, #novaderm, #about …) ================= */
  const Router = {
    replace(token) {
      try {
        const target = token ? `#${token}` : '';
        if (location.hash !== target) history.replaceState(null, '', token ? target : location.pathname + location.search);
      } catch { /* history unavailable in this frame */ }
    },
    push(token) {
      try { if (location.hash !== `#${token}`) history.pushState(null, '', `#${token}`); } catch { /* ignore */ }
    },
    open(token, opts = {}) {
      if (!token) return WM.closeAll();
      if (token === 'works') token = CATS[0].id;
      const p = findProject(token);
      const w = p ? WM.open('case', { ...opts, project: p }) : WM.open(token, { ...opts, token });
      if (!opts.fromHistory && w) this.push(w.def.token || token);
      return w;
    },
    fromHash() {
      const t = decodeURIComponent(location.hash.replace(/^#/, ''));
      if (!t) { if (WM.wins.size) WM.closeAll(); return; }
      this.open(t, { fromHistory: true });
    },
  };

  /* ================= Global events ================= */
  function bindGlobal() {
    document.addEventListener('click', (e) => {
      const opener = e.target.closest('[data-open]');
      if (opener) { e.preventDefault(); Router.open(opener.dataset.open, { origin: opener.classList.contains('folder') || opener.classList.contains('doc') ? $('.folder__icon, .doc__icon', opener) || opener : null }); return; }
      const proj = e.target.closest('[data-project]');
      if (proj) { Router.open(proj.dataset.project, { origin: $('.card__media', proj) || null }); return; }
      const act = e.target.closest('[data-action]');
      if (!act) return;
      if (act.dataset.action === 'home') { if (Focus.on) Focus.toggle(false); WM.closeAll(); Router.replace(''); }
      if (act.dataset.action === 'works') {
        if (isMobile()) $('#folders').scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
        else Router.open(CATS[0].id);
      }
    });

    document.addEventListener('keydown', (e) => {
      const typing = /input|textarea|select/i.test(e.target.tagName) || e.target.isContentEditable;
      if (e.key === 'Escape') {
        if (Lightbox.isOpen) { Lightbox.close(); return; }
        if (Focus.on) { Focus.toggle(false); return; }
        if (WM.active) { WM.close(WM.active); }
        return;
      }
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
      if ((e.key === 'f' || e.key === 'а') && WM.active?.key === 'case' && !Lightbox.isOpen) { e.preventDefault(); Focus.toggle(); }
    });

    addEventListener('popstate', () => Router.fromHash());
    addEventListener('hashchange', () => Router.fromHash());
    let rt;
    addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { WM.relayout(); WM.sync(); }, 120); });
    mqMobile.addEventListener?.('change', () => { WM.relayout(); WM.sync(); });
  }

  function clock() {
    const c = $('#clock');
    const tick = () => { const d = new Date(); c.textContent = `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
    tick(); setInterval(tick, 20000);
  }

  function intro() {
    const seen = store.get('d001-intro');
    document.body.classList.add(seen ? 'is-return' : 'is-intro');
    store.set('d001-intro', '1');
    setTimeout(() => document.body.classList.remove('is-intro', 'is-return'), 1900);
  }

  /* ================= Boot ================= */
  document.documentElement.lang = 'ru';
  Desktop.render();
  Lightbox.init();
  Cursor.init();
  Orb.init();
  clock();
  bindGlobal();
  intro();
  Navigation.set('desktop');
  if (location.hash) Router.fromHash();
})();

/* MIT · Copyright (c) 2026 Yousef Khames · kashier UI */
(function () {
  'use strict';
  const { el, t, pick } = Kit, K = KashCore;
  const A = (p, ...k) => p.append(...k.flat(Infinity).filter((x) => x != null && x !== false));
  const demoProducts = [['قهوة','Coffee',40,'مشروبات'],['شاي','Tea',25,'مشروبات'],['ساندوتش جبنة','Cheese sandwich',55,'طعام'],['بسكويت','Biscuits',15,'طعام'],['مياه','Water',10,'مشروبات'],['عصير','Juice',30,'مشروبات']]
    .map((x, i) => ({ id: 'd' + (i + 1), name: x[0] + ' | ' + x[1], price: x[2], cat: x[3], code: '', stock: i === 3 ? 3 : null, low: i === 3 ? 5 : null, demo: true }));
  const store = Kit.store('kashier', 1, { settings: { shop: { ar: 'محل تجريبي', en: 'Demo Shop' }, currency: 'ج.م', taxRate: 0, receipt: '80', pinHash: '' }, products: demoProducts, sales: [], shifts: [], seq: 0 });
  const D = () => store.data, S = () => store.data.settings, save = () => store.save();
  const app = document.getElementById('app');
  let cart = [], disc = { type: 'none', value: 0 }, method = 'cash', tendered = '', cat = '', q = '', unlocked = false, last = null;
  const route = () => location.hash.replace(/^#\/?/, '') || 'sell';
  const field = (label, input) => el('label', { class: 'field' }, el('span', { text: label }), input);
  const money = (n) => Kit.money(n, S().currency);
  const hasDemo = () => D().products.some((p) => p.demo) || D().sales.some((s) => s.demo);
  const openShift = () => D().shifts.find((s) => !s.closedAt);
  const shopName = () => Kit.shopName(pick(S().shop)) || pick(S().shop);
  const fmtTime = (ts) => new Date(ts).toLocaleString(Kit.lang === 'ar' ? 'ar-EG' : 'en-GB', { dateStyle: 'short', timeStyle: 'short' });

  function header(r) {
    const tab = (id, label) => el('a', { class: 'tab' + (r === id ? ' on' : ''), href: '#/' + id, 'aria-current': r === id ? 'page' : null }, label);
    return el('header', { class: 'top noprint' }, el('div', { class: 'brand' }, el('img', { src: 'assets/favicon.svg', width: 28, height: 28, alt: '' }), el('strong', { text: shopName() })),
      el('nav', { class: 'tabs', 'aria-label': 'Main' }, ['sell', 'products', 'shift', 'sales', 'settings'].map((id) => tab(id, t(id)))),
      el('button', { class: 'btn small', onclick: () => { Kit.setLang(Kit.lang === 'ar' ? 'en' : 'ar', 'kashier'); render(); } }, t('lang')));
  }
  const totals = () => K.totals(cart, disc, S().taxRate);

  /* ---------- sell ---------- */
  function viewSell() {
    const root = el('main', { id: 'main-content', tabindex: '-1' });
    if (hasDemo()) A(root, el('div', { class: 'banner', role: 'note', text: t('demoBanner') }));
    const sh = openShift(); A(root, sh ? el('p', { class: 'small', text: t('inShift', { t: fmtTime(sh.openedAt) }) }) : el('p', { class: 'small' }, t('noShift') + ' ', el('a', { href: '#/shift', text: t('openShift') })));
    const bc = el('input', { id: 'barcode', placeholder: t('barcode'), 'aria-label': t('barcode'), autocomplete: 'off', onkeydown: (e) => { if (e.key === 'Enter') { const p = K.findByCode(D().products, e.target.value); if (p) { cart = K.addLine(cart, p, 1); e.target.value = ''; drawCart(); } else Kit.toast(t('notFound')); } } });
    const inp = el('input', { type: 'search', placeholder: t('search'), 'aria-label': t('search'), value: q, oninput: (e) => { q = e.target.value; drawGrid(); } });
    const chips = el('div', { class: 'chips' }), grid = el('div', { class: 'pgrid' }), cartBox = el('section', { class: 'card cart' });
    const cats = [...new Set(D().products.map((p) => p.cat).filter(Boolean))];
    function drawGrid() {
      chips.replaceChildren(...[el('button', { class: 'chip' + (!cat ? ' on' : ''), 'aria-pressed': String(!cat), onclick: () => { cat = ''; drawGrid(); } }, t('all')), ...cats.map((c) => el('button', { class: 'chip' + (cat === c ? ' on' : ''), 'aria-pressed': String(cat === c), onclick: () => { cat = c; drawGrid(); } }, c))]);
      const s = q.trim().toLowerCase();
      grid.replaceChildren(...D().products.filter((p) => (!cat || p.cat === cat) && (!s || p.name.toLowerCase().includes(s) || p.code.toLowerCase().includes(s))).map((p) =>
        el('button', { class: 'ptile', 'data-id': p.id, onclick: () => { cart = K.addLine(cart, p, 1); drawCart(); } }, el('span', { class: 'pn', text: p.name }), el('span', { class: 'pp', text: money(p.price) }),
          p.stock !== null && p.stock <= 0 ? el('span', { class: 'badge', text: t('outFlag') }) : (p.stock !== null && p.low !== null && p.stock <= p.low ? el('span', { class: 'badge', text: t('lowFlag') }) : null), p.demo ? el('span', { class: 'badge demo', text: t('demoTag') }) : null)));
    }
    function drawCart() {
      cartBox.replaceChildren(el('h2', { text: t('cart') }));
      if (!cart.length) { A(cartBox, el('p', { text: t('cartEmpty') })); return; }
      cart.forEach((l) => A(cartBox, el('div', { class: 'row line', 'data-pid': l.pid }, el('span', { class: 'grow', text: l.name }),
        el('button', { class: 'btn small', 'aria-label': '-', onclick: () => { cart = K.addLine(cart, { id: l.pid, name: l.name, price: l.price }, -1); drawCart(); } }, '−'), el('strong', { text: String(l.qty) }),
        el('button', { class: 'btn small', 'aria-label': '+', onclick: () => { cart = K.addLine(cart, { id: l.pid, name: l.name, price: l.price }, 1); drawCart(); } }, '+'), el('span', { class: 'price', text: money(K.r2(l.qty * l.price)) }))));
      const tt = totals(), tn = el('input', { id: 'tendered', inputmode: 'decimal', value: tendered, oninput: (e) => { tendered = e.target.value; ch(); } }), chg = el('p', { class: 'small', id: 'change' });
      const ch = () => { const c = method === 'cash' && tendered !== '' ? K.change(tt.total, Kit.num(tendered, NaN)) : null; chg.textContent = method === 'cash' && tendered !== '' ? (c === null ? t('short') : t('changeDue') + ': ' + money(c)) : ''; };
      A(cartBox, el('div', { class: 'row' }, el('select', { id: 'dtype', 'aria-label': t('discount'), onchange: (e) => { disc = { type: e.target.value, value: 0 }; drawCart(); } }, [['none', t('dNone')], ['amount', t('dAmount')], ['percent', t('dPercent')]].map(([v, l]) => el('option', { value: v, selected: disc.type === v }, l))),
        disc.type !== 'none' ? el('input', { id: 'dval', inputmode: 'decimal', style: 'width:90px', value: disc.value || '', 'aria-label': t('discount'), onchange: (e) => { disc.value = Kit.num(e.target.value, 0); drawCart(); } }) : null),
        el('p', {}, t('subtotal') + ': ' + money(tt.subtotal)), tt.discount ? el('p', {}, t('discount') + ': −' + money(tt.discount)) : null, tt.tax ? el('p', {}, t('tax') + ' (' + tt.rate + '%): ' + money(tt.tax)) : null,
        el('p', { class: 'total' }, t('total') + ': ', el('strong', { id: 'grand', text: money(tt.total) })),
        field(t('method'), el('select', { id: 'method', onchange: (e) => { method = e.target.value; drawCart(); } }, K.METHODS.map((m) => el('option', { value: m, selected: m === method }, t('m_' + m))))), el('p', { class: 'small', text: t('noProcessing') }),
        method === 'cash' ? [field(t('tendered'), tn), chg] : null,
        el('div', { class: 'row' }, el('button', { class: 'btn primary', id: 'complete', onclick: complete }, t('complete')), el('button', { class: 'btn', onclick: () => { cart = []; disc = { type: 'none', value: 0 }; tendered = ''; drawCart(); } }, t('clearCart')))); ch();
    }
    A(root, el('div', { class: 'sellgrid' }, el('div', {}, bc, inp, chips, grid), cartBox)); drawGrid(); drawCart(); return root;
  }
  function complete() {
    if (!cart.length) return;
    if (K.stockIssues(D().products, cart).length && !confirm(t('stockWarn'))) return;
    const tt = totals();
    if (method === 'cash' && tendered !== '' && K.change(tt.total, Kit.num(tendered, NaN)) === null) return Kit.toast(t('short'));
    const sh = openShift(), no = D().seq + 1;
    const sale = K.makeSale({ id: Kit.uid('s'), no, ts: Kit.now(), shift: sh ? sh.id : null, lines: cart, discount: disc, taxRate: S().taxRate, method, tendered, demo: hasDemo() && D().products.some((p) => p.demo) && cart.some((l) => (D().products.find((p) => p.id === l.pid) || {}).demo) });
    D().seq = no; D().sales.push(sale); D().products = K.applyStock(D().products, sale); save();
    cart = []; disc = { type: 'none', value: 0 }; tendered = ''; last = sale; render(false); receiptSheet(sale); Kit.toast(t('saleDone', { n: no }));
  }
  function receiptSheet(sale) {
    const text = K.receiptText(sale, shopName(), S().currency, Kit.lang), sheet = el('div', { class: 'sheet noprint', role: 'dialog', 'aria-modal': 'true', 'aria-label': t('receipt') });
    const ph = el('input', { id: 'cust', type: 'tel', value: '' });
    A(sheet, el('div', { class: 'panel' }, el('h2', { text: t('receipt') }), el('pre', { class: 'ordertext', id: 'receipt-text', text }), field(t('custPhone'), ph),
      el('div', { class: 'row' }, el('button', { class: 'btn primary', id: 'print', onclick: () => doPrint(text) }, t('print')),
        el('button', { class: 'btn', id: 'wa', onclick: () => { const w = Kit.waLink(ph.value, text); if (!w.ok) return Kit.toast(t('copy') + '?'); window.open(w.url, '_blank', 'noopener'); } }, t('sendWa')),
        el('button', { class: 'btn', onclick: async () => { try { await navigator.clipboard.writeText(text); Kit.toast(t('copied')); } catch (e) { /* manual */ } } }, t('copy')), el('button', { class: 'btn', id: 'new-sale', onclick: () => sheet.remove() }, t('newSale'))), el('p', { class: 'small', text: t('waNote') })));
    sheet.addEventListener('keydown', (e) => { if (e.key === 'Escape') sheet.remove(); }); document.body.append(sheet);
  }
  function doPrint(text) { let p = document.getElementById('receipt-print'); if (!p) { p = el('pre', { id: 'receipt-print' }); document.body.append(p); } p.textContent = text; p.className = 'w' + S().receipt; window.print(); }

  /* ---------- owner gate ---------- */
  function gate(inner) {
    if (!S().pinHash || unlocked) return inner();
    const root = el('main', { id: 'main-content', tabindex: '-1' }), pin = el('input', { id: 'pin', type: 'password', inputmode: 'numeric', autocomplete: 'off' });
    A(root, el('h1', { text: t('pinTitle') }), field(t('pinPrompt'), pin), el('button', { class: 'btn primary', id: 'unlock', onclick: async () => { if (await K.hashPin(pin.value) === S().pinHash) { unlocked = true; render(); } else Kit.toast(t('pinWrong')); } }, t('unlock')), el('p', { class: 'small', text: t('pinNote') }));
    return root;
  }
  function blockedBanner(root) { if (store.blocked) A(root, el('div', { class: 'banner', role: 'alert', text: t('blocked') }), el('button', { class: 'btn danger', onclick: () => { if (confirm(t('confirmReset'))) { store.reset(); render(); } } }, t('resetAll'))); }

  /* ---------- products ---------- */
  function viewProducts() {
    const root = el('main', { id: 'main-content', tabindex: '-1' }); blockedBanner(root); A(root, el('h1', { text: t('products') }));
    const imp = el('input', { type: 'file', accept: '.csv,text/csv', hidden: true, onchange: async (e) => { const f = e.target.files[0]; if (!f) return; const r = K.productsFromCsv(await Kit.readFile(f), D().products.map((p) => p.id)); if (!r.ok) return Kit.toast(t('csvBad')); D().products = D().products.concat(r.products); save(); Kit.toast(t('csvOk', { n: r.products.length, s: r.skipped })); render(); } });
    A(root, el('div', { class: 'row' }, el('button', { class: 'btn primary', id: 'add-product', onclick: () => form(null) }, t('addProduct')), el('button', { class: 'btn', onclick: () => Kit.download('products.csv', '\uFEFF' + K.productsToCsv(D().products), 'text/csv') }, t('exportProducts')), el('button', { class: 'btn', onclick: () => imp.click() }, t('importProducts')), imp), el('p', { class: 'small', text: t('csvHelp') }));
    D().products.forEach((p) => A(root, el('div', { class: 'row line', 'data-pid': p.id }, el('span', { class: 'grow', text: p.name + (p.code ? ' · ' + p.code : '') }), el('span', { class: 'price', text: money(p.price) }),
      p.stock !== null ? el('span', { class: 'badge', text: p.stock <= 0 ? t('outFlag') : (p.low !== null && p.stock <= p.low ? t('lowFlag') + ': ' : '') + t('inStock', { n: p.stock }) }) : null, p.demo ? el('span', { class: 'badge demo', text: t('demoTag') }) : null,
      el('button', { class: 'btn small', onclick: () => form(p) }, t('editProduct')), el('button', { class: 'btn small danger', onclick: () => { if (confirm(t('confirm'))) { D().products = D().products.filter((x) => x.id !== p.id); save(); render(); } } }, t('del')))));
    return root;
  }
  function form(p) {
    const isNew = !p; p = p || K.product({ id: Kit.uid('p'), name: '', price: 0 }, 0);
    const f = { n: el('input', { id: 'p-name', value: p.name }), pr: el('input', { id: 'p-price', inputmode: 'decimal', value: p.price || '' }), c: el('input', { value: p.cat }), co: el('input', { id: 'p-code', value: p.code }), st: el('input', { id: 'p-stock', inputmode: 'numeric', value: p.stock === null ? '' : p.stock }), lo: el('input', { inputmode: 'numeric', value: p.low === null ? '' : p.low }) };
    const sheet = el('div', { class: 'sheet', role: 'dialog', 'aria-modal': 'true', 'aria-label': t('editProduct') }), close = () => sheet.remove();
    A(sheet, el('div', { class: 'panel' }, el('h2', { text: t('editProduct') }), field(t('name'), f.n), field(t('price'), f.pr), field(t('category'), f.c), field(t('code'), f.co), field(t('stock'), f.st), field(t('lowAt'), f.lo),
      el('div', { class: 'row' }, el('button', { class: 'btn primary', id: 'p-save', onclick: () => { if (!f.n.value.trim()) return Kit.toast(t('needName'));
        const np = K.product({ id: p.id, name: f.n.value, price: Kit.num(f.pr.value, 0), cat: f.c.value, code: f.co.value, stock: f.st.value.trim() === '' ? null : Kit.num(f.st.value, 0), low: f.lo.value.trim() === '' ? null : Kit.num(f.lo.value, 0), demo: false }, 0);
        D().products = isNew ? D().products.concat([np]) : D().products.map((x) => x.id === p.id ? np : x); save(); close(); Kit.toast(t('savedMsg')); render(); } }, t('save')), el('button', { class: 'btn', onclick: close }, t('cancel')))));
    sheet.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); }); document.body.append(sheet); f.n.focus();
  }

  /* ---------- shift ---------- */
  function sumBlock(s) { return el('div', { class: 'card' }, el('p', {}, t('nSales') + ': ' + s.sales), el('p', {}, t('refunds') + ': ' + money(s.refunds)), ['cash', 'card', 'other'].map((m) => el('p', {}, t('m_' + m) + ': ' + money(s.by[m]))), el('p', {}, el('strong', { text: t('net') + ': ' + money(s.net) })), el('p', {}, t('expected') + ': ' + money(s.expectedCash)),
    s.counted !== null ? el('p', {}, t('counted') + ': ' + money(s.counted) + ' · ' + t('diff') + ': ' + money(s.difference)) : null); }
  function viewShift() {
    const root = el('main', { id: 'main-content', tabindex: '-1' }); blockedBanner(root); A(root, el('h1', { text: t('shift') })); const sh = openShift();
    if (!sh) { const fl = el('input', { id: 'float', inputmode: 'decimal' }); A(root, el('h2', { text: t('shiftOpenTitle') }), field(t('openFloat'), fl), el('button', { class: 'btn primary', id: 'open-shift', onclick: () => { D().shifts.push({ id: Kit.uid('sh'), openedAt: Kit.now(), openFloat: Kit.num(fl.value, 0), closedAt: null, counted: null }); save(); render(); } }, t('doOpen'))); }
    else { const cn = el('input', { id: 'counted', inputmode: 'decimal' }); A(root, el('p', { text: t('inShift', { t: fmtTime(sh.openedAt) }) }), sumBlock(K.shiftSummary(sh, D().sales)), field(t('counted'), cn),
      el('button', { class: 'btn primary', id: 'close-shift', onclick: () => { if (cn.value.trim() === '') return Kit.toast(t('counted')); sh.counted = Kit.num(cn.value, 0); sh.closedAt = Kit.now(); save(); render(); } }, t('closeShift'))); }
    const day0 = new Date(Kit.now()); day0.setHours(0, 0, 0, 0); const dsum = K.dailySummary(D().sales, day0.getTime(), day0.getTime() + 864e5);
    A(root, el('h2', { text: t('today') }), D().sales.length ? el('p', {}, t('nSales') + ': ' + dsum.sales + ' · ' + t('refunds') + ': ' + dsum.refunds + ' · ' + t('net') + ': ' + money(dsum.net)) : el('p', { text: t('noSalesYet') }));
    const past = D().shifts.filter((s) => s.closedAt).reverse(); if (past.length) { A(root, el('h2', { text: t('past') })); past.forEach((s) => A(root, el('details', {}, el('summary', { text: fmtTime(s.openedAt) + ' → ' + fmtTime(s.closedAt) }), sumBlock(K.shiftSummary(s, D().sales))))); }
    return root;
  }

  /* ---------- sales ---------- */
  function viewSales() {
    const root = el('main', { id: 'main-content', tabindex: '-1' }); blockedBanner(root); A(root, el('h1', { text: t('sales') }), el('button', { class: 'btn', onclick: () => Kit.download('sales.csv', '\uFEFF' + K.salesToCsv(D().sales), 'text/csv') }, t('exportSales')));
    if (!D().sales.length) A(root, el('p', { text: t('noSalesYet') }));
    D().sales.slice().reverse().slice(0, 100).forEach((s) => A(root, el('div', { class: 'row line', 'data-sale': s.no }, el('strong', { text: '#' + s.no }), el('span', { class: 'grow', text: fmtTime(s.ts) + (s.refundOf ? ' · ' + t('refund') : '') }), el('span', { class: 'price', text: money(s.total) }), s.demo ? el('span', { class: 'badge demo', text: t('demoTag') }) : null,
      el('button', { class: 'btn small', onclick: () => receiptSheet(s) }, t('reprint')),
      !s.refundOf && !K.isRefunded(D().sales, s.id) ? el('button', { class: 'btn small danger refund', onclick: () => { if (!confirm(t('confirm'))) return; const no = D().seq + 1, sh = openShift(); const r = K.refundOf(s, Kit.uid('s'), no, Kit.now(), sh ? sh.id : null); D().seq = no; D().sales.push(r); D().products = K.applyStock(D().products, r); save(); render(); } }, t('refund')) : (s.refundOf ? null : el('span', { class: 'badge', text: t('refunded') })))));
    return root;
  }

  /* ---------- settings ---------- */
  function viewSettings() {
    const root = el('main', { id: 'main-content', tabindex: '-1' }); blockedBanner(root); A(root, el('h1', { text: t('settings') }), el('p', { class: 'small', text: t('limits') }));
    const s = S(), sa = el('input', { id: 's-ar', value: s.shop.ar }), se = el('input', { id: 's-en', value: s.shop.en }), cu = el('input', { id: 's-cur', value: s.currency }), tx = el('input', { id: 's-tax', inputmode: 'decimal', value: s.taxRate }), pin = el('input', { id: 's-pin', type: 'password', inputmode: 'numeric', autocomplete: 'off' });
    const rw = el('select', { id: 's-w' }, [['58', '58 mm'], ['80', '80 mm']].map(([v, l]) => el('option', { value: v, selected: s.receipt === v }, l)));
    A(root, el('section', { class: 'card' }, field(t('shopAr'), sa), field(t('shopEn'), se), field(t('currency'), cu), field(t('taxRate'), tx), el('p', { class: 'small', text: t('taxNote') }), field(t('width'), rw), field(t('setPin'), pin), el('p', { class: 'small', text: t('pinNote') }),
      el('button', { class: 'btn primary', id: 's-save', onclick: async () => { s.shop = { ar: sa.value, en: se.value }; s.currency = cu.value; s.taxRate = Math.min(100, Math.max(0, Kit.num(tx.value, 0))); s.receipt = rw.value; if (pin.value !== '') s.pinHash = await K.hashPin(pin.value); else if (s.pinHash && !pin.dataset.keep) { /* empty keeps existing unless cleared below */ } save(); Kit.toast(t('savedMsg')); render(); } }, t('save')),
      s.pinHash ? el('button', { class: 'btn', id: 'clear-pin', onclick: () => { s.pinHash = ''; save(); render(); } }, t('del') + ' PIN') : null));
    const imp = el('input', { type: 'file', accept: '.json,application/json', hidden: true, onchange: async (e) => { const f = e.target.files[0]; if (!f) return; const r = store.importJSON(await Kit.readFile(f)); if (!r.ok) return Kit.toast(r.error === 'newer' ? t('restoreNewer') : t('restoreFail')); if (!r.data.settings || !Array.isArray(r.data.products) || !Array.isArray(r.data.sales)) return Kit.toast(t('restoreFail')); if (D().sales.length && !confirm(t('confirmReset'))) return; store.data = Object.assign({}, store.data, r.data); store.blocked = false; save(); Kit.toast(t('restored')); render(); } });
    A(root, el('section', { class: 'card row' }, el('button', { class: 'btn', id: 'backup', onclick: () => Kit.download('kashier-backup.json', store.exportJSON('backup'), 'application/json') }, t('backup')), el('button', { class: 'btn', onclick: () => imp.click() }, t('restore')), imp, hasDemo() ? el('button', { class: 'btn', id: 'clear-demo', onclick: () => { D().products = D().products.filter((p) => !p.demo); D().sales = D().sales.filter((x) => !x.demo); save(); render(); } }, t('clearDemo')) : null,
      el('button', { class: 'btn danger', onclick: () => { if (confirm(t('confirmReset'))) { store.reset(); cart = []; render(); } } }, t('resetAll'))), el('p', { class: 'small', text: t('backupWarn') }));
    return root;
  }

  function render(scroll) {
    const r = route(); Kit.applyTheme(); document.title = 'kashier | كاشير'; document.querySelectorAll('.sheet').forEach((x) => x.remove());
    const owner = ['products', 'shift', 'sales', 'settings'].includes(r); const view = !owner ? viewSell() : gate(() => ({ products: viewProducts, shift: viewShift, sales: viewSales, settings: viewSettings }[r])());
    app.replaceChildren(header(owner ? r : 'sell'), el('div', { class: 'wrap' }, view), Kit.footer()); document.body.dataset.ready = '1';
  }
  window.addEventListener('hashchange', () => { render(); window.scrollTo(0, 0); });
  Kit.initLang('kashier'); render();
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
})();

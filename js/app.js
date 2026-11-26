(function () {
  'use strict';
  var K = window.KCore, KI = window.KI18n;
  var KEY = 'kashier.v1';
  var PALETTE = ['#0f766e', '#b45309', '#9333ea', '#be123c', '#1d4ed8', '#4d7c0f', '#c2410c', '#475569'];
  var state, t, ui = { view: 'sell', cat: '', q: '', sheet: false, tendered: '', method: 'cash', day: '', editing: null };

  // ---------- helpers ----------
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function S() { return state.settings; }
  function money(m) { return K.fmtMoney(m, S()); }
  function num(n) { return S().arabicDigits ? K.toArabicDigits(String(n)) : String(n); }
  function findP(id) { return state.products.find(function (p) { return p.id === id; }); }
  function initial(name) { var c = Array.from(String(name).trim())[0] || '?'; return c.toUpperCase(); }

  function load() {
    var raw = null;
    try { raw = JSON.parse(localStorage.getItem(KEY)); } catch (e) { raw = null; }
    state = K.normalizeState(raw) || K.normalizeState({});
    if (!raw) {
      var nav = (navigator.language || 'en').toLowerCase();
      if (nav.indexOf('ar') === 0) { state.settings.language = 'ar'; state.settings.currency = 'ج.م'; }
    }
  }
  var saveFailed = false;
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); saveFailed = false; return true; }
    catch (e) { if (!saveFailed) toast(t('storage_full')); saveFailed = true; return false; }
  }
  function setLang() {
    t = KI.make(S().language);
    document.documentElement.lang = S().language;
    document.documentElement.dir = S().language === 'ar' ? 'rtl' : 'ltr';
  }
  function applyBrand() {
    var s = S(), r = document.documentElement.style;
    r.setProperty('--brand', s.primary);
    r.setProperty('--brand-ink', K.inkOn(s.primary));
    r.setProperty('--brand-soft', K.mix(s.primary, '#ffffff', 0.88));
    r.setProperty('--brand-deep', K.mix(s.primary, '#000000', 0.35));
    r.setProperty('--accent', s.accent);
    $('#themeColor').setAttribute('content', s.primary);
    document.title = s.shopName + ' · ' + t('appName');
  }
  var toastTimer;
  function toast(msg) {
    var el = $('#toast'); el.innerHTML = '<span>' + esc(msg) + '</span>'; el.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { el.classList.remove('show'); }, 1800);
  }
  function download(name, text, type) {
    var a = document.createElement('a'), url = URL.createObjectURL(new Blob([text], { type: type || 'text/plain' }));
    a.href = url; a.download = name; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 500);
  }
  function confirmBox(msg, ok) { if (window.confirm(msg)) ok(); }
  var ICON = {
    sell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16l-1.6 9.2a2 2 0 0 1-2 1.8H7.6a2 2 0 0 1-2-1.8z"/><path d="M4 7 3 3H1"/><circle cx="9" cy="21" r="1"/><circle cx="17" cy="21" r="1"/></svg>',
    products: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="m3 8 9 5 9-5M12 13v8"/></svg>',
    sales: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
    settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
    receipt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2h12v20l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>'
  };

  // ---------- header / nav ----------
  function logoHTML(cls) {
    var s = S();
    return s.logo ? '<img class="logo ' + (cls || '') + '" src="' + s.logo + '" alt="">' : '<div class="mono ' + (cls || '') + '" aria-hidden="true">' + esc(initial(s.shopName)) + '</div>';
  }
  function renderChrome() {
    var s = S();
    $('#topbar').innerHTML = '<div class="brand">' + logoHTML() + '<div class="brand-text"><div class="brand-name">' + esc(s.shopName) + '</div>' +
      (s.tagline ? '<div class="brand-tag">' + esc(s.tagline) + '</div>' : '') + '</div></div>' +
      '<button class="chip-btn" data-act="lang" aria-label="' + esc(t('language')) + '">' + (s.language === 'ar' ? 'EN' : 'ع') + '</button>';
    var tabs = ['sell', 'products', 'sales', 'settings'];
    $('#tabbar').innerHTML = tabs.map(function (v) {
      return '<button class="tab" data-act="nav" data-v="' + v + '"' + (ui.view === v ? ' aria-current="page"' : '') + '>' + ICON[v] + '<span>' + esc(t('nav_' + v)) + '</span></button>';
    }).join('');
  }

  // ---------- cart ----------
  function cartLines() {
    return state.cart.map(function (c) { var p = findP(c.id); return p ? { id: p.id, name: p.name, price: p.price, qty: c.qty } : null; }).filter(Boolean);
  }
  function discObj() { return { type: state.disc.type, value: state.disc.type === 'percent' ? state.disc.value : Math.round(state.disc.value * Math.pow(10, S().decimals)) }; }
  function totals() {
    return K.computeCart(cartLines(), { discount: state.disc.value ? discObj() : null, taxRate: S().taxRate, taxInclusive: S().taxInclusive, decimals: S().decimals });
  }
  function inCart(id) { var c = state.cart.find(function (x) { return x.id === id; }); return c ? c.qty : 0; }
  function addToCart(id) {
    var p = findP(id); if (!p) return false;
    var cur = inCart(id);
    if (p.stock != null && cur + 1 > p.stock) { toast(t('only_left', { n: num(p.stock), name: p.name })); return false; }
    var c = state.cart.find(function (x) { return x.id === id; });
    if (c) c.qty++; else state.cart.push({ id: id, qty: 1 });
    save(); return true;
  }
  function setQty(id, q) {
    var p = findP(id), c = state.cart.find(function (x) { return x.id === id; });
    if (!c) return;
    if (q <= 0) state.cart = state.cart.filter(function (x) { return x.id !== id; });
    else if (p && p.stock != null && q > p.stock) { toast(t('only_left', { n: num(p.stock), name: p.name })); return; }
    else c.qty = q;
    save();
  }
  function clearCart() { state.cart = []; state.disc = { type: 'percent', value: 0 }; ui.tendered = ''; save(); }

  function cartHTML() {
    var lines = cartLines(), T = totals(), s = S();
    var h = '<div class="cart-head"><h2>' + esc(t('cart')) + ' <span class="muted" style="font-size:15px">' + (T.count ? num(T.count) + ' ' + esc(t(T.count === 1 ? 'item' : 'items')) : '') + '</span></h2><div class="row">' +
      (state.held.length ? '<button class="btn small" data-act="held-list">' + esc(t('held_sales')) + ' (' + num(state.held.length) + ')</button>' : '') +
      (lines.length ? '<button class="btn small" data-act="hold">' + esc(t('held')) + '</button><button class="btn small danger" data-act="clear">' + esc(t('clear')) + '</button>' : '') + '</div></div>';
    if (!lines.length) return h + '<div class="empty"><div class="big" aria-hidden="true">'+ICON.sell+'</div><h3>' + esc(t('cart_empty')) + '</h3><div>' + esc(t('cart_empty_hint')) + '</div></div>';
    h += '<div class="lines" id="cartLines">' + lines.map(function (l) {
      return '<div class="line" data-id="' + esc(l.id) + '"><div><div class="line-name">' + esc(l.name) + '</div><div class="line-sub">' + money(l.price) + '</div></div>' +
        '<div class="stepper"><button data-act="dec" data-id="' + esc(l.id) + '" aria-label="−">−</button><b>' + num(l.qty) + '</b><button data-act="inc" data-id="' + esc(l.id) + '" aria-label="+">+</button></div>' +
        '<div class="line-total">' + money(Math.round(l.price * l.qty)) + '</div></div>';
    }).join('') + '</div>';
    h += '<div class="row"><div class="seg grow" role="group" aria-label="' + esc(t('discount')) + '">' +
      ['none', 'percent', 'fixed'].map(function (k) {
        var on = (k === 'none' && !state.disc.value) || (k !== 'none' && !!state.disc.value && state.disc.type === k) || (k !== 'none' && !state.disc.value && ui.discMode === k);
        return '<button data-act="dtype" data-k="' + k + '" aria-pressed="' + on + '">' + esc(t(k === 'none' ? 'discount_none' : k === 'percent' ? 'discount_pct' : 'discount_fix')) + '</button>';
      }).join('') + '</div>' +
      (state.disc.value || ui.discMode ? '<input type="text" inputmode="decimal" id="discVal" style="max-width:96px" value="' + esc(state.disc.value || '') + '" aria-label="' + esc(t('discount')) + '">' : '') + '</div>';
    h += '<div class="totals" id="totals">' + totalsInner(T) + '</div>';
    h += '<div class="seg" role="group" aria-label="' + esc(t('pay')) + '">' + s.paymentMethods.map(function (m) {
      return '<button data-act="method" data-m="' + m + '" aria-pressed="' + (ui.method === m) + '">' + esc(t(m)) + '</button>';
    }).join('') + '</div>';
    h += '<div id="cashZone">' + cashZone(T) + '</div>';
    h += '<button class="btn primary big" id="chargeBtn" data-act="charge">' + esc(t('complete_sale')) + ' · ' + money(T.total) + '</button>';
    return h;
  }
  function totalsInner(T) {
    var h = '<div class="tline"><span>' + esc(t('subtotal')) + '</span><span>' + money(T.subtotal) + '</span></div>';
    if (T.discount) h += '<div class="tline"><span>' + esc(t('discount')) + '</span><span>−' + money(T.discount) + '</span></div>';
    if (S().taxRate) h += '<div class="tline"><span>' + esc(t(S().taxInclusive ? 'tax_incl' : 'tax')) + ' ' + num(S().taxRate) + '%</span><span>' + money(T.tax) + '</span></div>';
    return h + '<div class="tline grand"><span>' + esc(t('total')) + '</span><span>' + money(T.total) + '</span></div>';
  }
  function tenderedMinor() { var m = K.toMinor(ui.tendered, S().decimals); return isNaN(m) ? null : m; }
  function cashZone(T) {
    if (ui.method !== 'cash') return '';
    var tm = tenderedMinor(), q = quickAmounts(T.total);
    var h = '<label class="f"><span>' + esc(t('tendered')) + '</span><input type="text" inputmode="decimal" id="tendered" value="' + esc(ui.tendered) + '" placeholder="' + esc(t('exact')) + '"></label>';
    h += '<div class="quick" aria-label="' + esc(t('quick_cash')) + '"><button data-act="quick" data-v="exact">' + esc(t('exact')) + '</button>' + q.map(function (a) { return '<button data-act="quick" data-v="' + a + '">' + money(a) + '</button>'; }).join('') + '</div>';
    h += '<div id="changeLine">' + changeLine(T, tm) + '</div>';
    return h;
  }
  function changeLine(T, tm) {
    if (tm === null) return '';
    if (tm < T.total) return '<div class="change short"><span>' + esc(t('short')) + '</span><span>' + money(T.total - tm) + '</span></div>';
    return '<div class="change"><span>' + esc(t('change')) + '</span><span>' + money(K.changeDue(T.total, tm)) + '</span></div>';
  }
  function quickAmounts(total) {
    var u = Math.pow(10, S().decimals), out = [];
    [5, 10, 20, 50, 100, 200, 500, 1000].forEach(function (n) { var a = n * u; if (a >= total && out.length < 3 && out.indexOf(a) < 0) out.push(a); });
    return out;
  }
  function updateCartDynamic() {
    var T = totals();
    if ($('#totals')) $('#totals').innerHTML = totalsInner(T);
    if ($('#changeLine')) $('#changeLine').innerHTML = changeLine(T, tenderedMinor());
    $$('#chargeBtn').forEach(function (b) { b.textContent = t('complete_sale') + ' · ' + money(T.total); b.disabled = !canCharge(T); });
    updateCartBar();
  }
  function canCharge(T) {
    if (!cartLines().length) return false;
    if (ui.method === 'cash') { var tm = tenderedMinor(); if (ui.tendered.trim() !== '' && (tm === null || tm < T.total)) return false; }
    return true;
  }

  // ---------- sell view ----------
  function categories() {
    var seen = {}; state.products.forEach(function (p) { if (p.category) seen[p.category] = 1; });
    return Object.keys(seen).sort();
  }
  function filtered() {
    var q = ui.q.trim().toLowerCase();
    return state.products.filter(function (p) {
      if (ui.cat && p.category !== ui.cat) return false;
      return !q || p.name.toLowerCase().indexOf(q) >= 0 || (p.sku && p.sku.toLowerCase().indexOf(q) >= 0) || (p.category && p.category.toLowerCase().indexOf(q) >= 0);
    });
  }
  function tilesHTML() {
    var list = filtered();
    if (!state.products.length) return '<div class="card empty" style="grid-column:1/-1"><div class="big" aria-hidden="true">'+ICON.products+'</div><h3>' + esc(t('no_products')) + '</h3><div>' + esc(t('no_products_hint')) + '</div><div class="mactions" style="justify-content:center"><button class="btn primary" data-act="new-product">' + esc(t('add_product')) + '</button><button class="btn" data-act="demo">' + esc(t('load_demo')) + '</button></div></div>';
    if (!list.length) return '<div class="card empty" style="grid-column:1/-1"><div class="big" aria-hidden="true">'+ICON.search+'</div><h3>' + esc(t('no_match')) + '</h3></div>';
    return list.map(function (p) {
      var out = p.stock != null && p.stock <= 0, q = inCart(p.id);
      var badge = q ? '<span class="qty-in-cart">' + num(q) + '</span>' : out ? '<span class="badge out">' + esc(t('out_of_stock')) + '</span>' : (p.stock != null && p.stock <= 5) ? '<span class="badge">' + esc(t('low_stock')) + ' ' + num(p.stock) + '</span>' : '';
      return '<button class="tile" data-act="add" data-id="' + esc(p.id) + '"' + (out ? ' disabled' : '') + '><div class="dot" style="background:' + p.color + '">' + esc(initial(p.name)) + '</div>' + badge + '<div class="tile-name">' + esc(p.name) + '</div><div class="tile-price">' + money(p.price) + '</div></button>';
    }).join('');
  }
  function catsHTML() {
    var cs = categories(); if (!cs.length) return '';
    return '<button class="cat" data-act="cat" data-c="" aria-pressed="' + (!ui.cat) + '">' + esc(t('all')) + '</button>' + cs.map(function (c) { return '<button class="cat" data-act="cat" data-c="' + esc(c) + '" aria-pressed="' + (ui.cat === c) + '">' + esc(c) + '</button>'; }).join('');
  }
  function renderSell() {
    $('#main').innerHTML = '<div class="sell"><section aria-label="' + esc(t('nav_products')) + '"><div class="search">' + ICON.search + '<input type="search" id="q" placeholder="' + esc(t('search_ph')) + '" value="' + esc(ui.q) + '" autocomplete="off" aria-label="' + esc(t('search_ph')) + '"></div>' +
      '<div class="cats" id="cats">' + catsHTML() + '</div><div class="tiles" id="tiles">' + tilesHTML() + '</div></section>' +
      '<aside class="card cart cart-panel" id="cartPanel" aria-label="' + esc(t('cart')) + '">' + cartHTML() + '</aside></div>' +
      '<button class="cartbar" id="cartBar" data-act="open-sheet" hidden></button>';
    updateCartBar();
  }
  function updateCartBar() {
    var b = $('#cartBar'); if (!b) return;
    var T = totals();
    b.hidden = !T.count;
    b.innerHTML = '<span>' + esc(t('view_cart')) + ' · ' + num(T.count) + ' ' + esc(t(T.count === 1 ? 'item' : 'items')) + '</span><span>' + money(T.total) + '</span>';
  }
  function refreshCartUI() {
    var tiles = $('#tiles'); if (tiles) tiles.innerHTML = tilesHTML();
    var p = $('#cartPanel'); if (p) p.innerHTML = cartHTML();
    var sb = $('#sheetBody'); if (sb) { if (!cartLines().length) closeSheet(); else sb.innerHTML = cartHTML(); }
    updateCartBar();
  }
  function openSheet() {
    var d = document.createElement('div'); d.className = 'sheet cart-sheet'; d.id = 'sheet';
    d.innerHTML = '<div class="sheet-body"><div class="stack" id="sheetBody" style="gap:12px">' + cartHTML() + '</div><button class="btn big" data-act="close-sheet" style="margin-top:12px">' + esc(t('close')) + '</button></div>';
    d.addEventListener('click', function (e) { if (e.target === d) closeSheet(); });
    document.body.appendChild(d);
  }
  function closeSheet() { var s = $('#sheet'); if (s) s.remove(); }

  // ---------- checkout ----------
  function charge() {
    var lines = cartLines(), T = totals();
    if (!lines.length || !canCharge(T)) return;
    var prob = K.stockProblem(state.products, lines);
    if (prob) { toast(t('only_left', { n: num(prob.stock), name: prob.name })); return; }
    var tm = tenderedMinor();
    state.counter++;
    var sale = {
      id: uid(), no: K.receiptNo(S().receiptPrefix, state.counter), ts: Date.now(),
      lines: lines.map(function (l) { return { id: l.id, name: l.name, price: l.price, qty: l.qty }; }),
      subtotal: T.subtotal, discount: T.discount, tax: T.tax, total: T.total, count: T.count, method: ui.method,
      tendered: ui.method === 'cash' ? (ui.tendered.trim() === '' ? T.total : tm) : T.total, taxInclusive: S().taxInclusive, taxRate: S().taxRate, voided: false
    };
    K.applyStock(state.products, sale.lines, -1);
    state.sales.unshift(sale);
    state.cart = []; state.disc = { type: 'percent', value: 0 }; ui.tendered = ''; ui.discMode = null;
    save(); closeSheet();
    showReceipt(sale, true);
    refreshCartUI();
  }

  // ---------- receipts ----------
  function dtStr(ts) {
    var d = new Date(ts), p = function (n) { return String(n).padStart(2, '0'); };
    var s = d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + '  ' + p(d.getHours()) + ':' + p(d.getMinutes());
    return S().arabicDigits ? K.toArabicDigits(s) : s;
  }
  function receiptHTML(sale) {
    var s = S(), rl = function (a, b, cls) { return '<div class="rl ' + (cls || '') + '"><span>' + a + '</span><span>' + b + '</span></div>'; };
    var h = '<div class="receipt" id="receiptEl"><div class="rc-head">' + (s.logo ? '<img class="rc-logo" src="' + s.logo + '" alt="">' : '') + '<div class="rc-name">' + esc(s.shopName) + '</div>' +
      (s.tagline ? '<div>' + esc(s.tagline) + '</div>' : '') + (s.address ? '<div>' + esc(s.address) + '</div>' : '') + (s.phone ? '<div>' + esc(s.phone) + '</div>' : '') + (s.taxId ? '<div>' + esc(t('tax_id')) + ': ' + esc(s.taxId) + '</div>' : '') + '</div><hr>' +
      rl(esc(t('receipt_no')) + ' <bdi>' + esc(sale.no) + '</bdi>', '<bdi>' + dtStr(sale.ts) + '</bdi>') + '<hr>';
    sale.lines.forEach(function (l) {
      h += '<div class="ritem">' + rl(esc(l.name), money(Math.round(l.price * l.qty))) + '<small>' + num(l.qty) + ' × ' + money(l.price) + '</small></div>';
    });
    h += '<hr>' + rl(esc(t('subtotal')), money(sale.subtotal));
    if (sale.discount) h += rl(esc(t('discount')), '−' + money(sale.discount));
    if (sale.tax) h += rl(esc(t(sale.taxInclusive ? 'tax_incl' : 'tax')) + (sale.taxRate ? ' ' + num(sale.taxRate) + '%' : ''), money(sale.tax));
    h += rl(esc(t('total')), money(sale.total), 'b') + '<hr>' + rl(esc(t('paid_by')), esc(t(sale.method)));
    if (sale.method === 'cash' && sale.tendered >= sale.total) { h += rl(esc(t('cash_given')), money(sale.tendered)) + rl(esc(t('change')), money(sale.tendered - sale.total)); }
    h += '<div class="rc-foot">' + esc(s.receiptFooter) + '</div>' + (sale.voided ? '<div class="stamp">' + esc(t('void_stamp')) + '</div>' : '') + '</div>';
    return h;
  }
  function openModal(html, wide) {
    var m = $('#modal'); m.hidden = false;
    m.innerHTML = '<div class="modal-card' + (wide ? ' wide' : '') + '" role="dialog" aria-modal="true">' + html + '</div>';
    m.onclick = function (e) { if (e.target === m) closeModal(); };
    var f = $('input,button.primary,button', m); if (f && !wide) { /* keep focus management light */ }
  }
  function closeModal() { var m = $('#modal'); m.hidden = true; m.innerHTML = ''; }
  function showReceipt(sale, fresh) {
    openModal('<h3>' + esc(t(fresh ? 'sale_done' : 'receipt')) + '</h3>' + receiptHTML(sale) +
      '<div class="mactions no-print"><button class="btn primary" data-act="print">' + esc(t('print')) + '</button>' +
      (fresh ? '<button class="btn" data-act="close-modal">' + esc(t('new_sale')) + '</button>' : (!sale.voided ? '<button class="btn danger" data-act="void" data-id="' + esc(sale.id) + '">' + esc(t('void_sale')) + '</button>' : '') + '<button class="btn" data-act="close-modal">' + esc(t('close')) + '</button>') + '</div>');
  }

  // ---------- products ----------
  function renderProducts() {
    var h = '<div class="row wrap between"><h2>' + esc(t('nav_products')) + ' <span class="muted" style="font-size:15px">' + num(state.products.length) + '</span></h2><div class="row wrap">' +
      '<button class="btn primary" data-act="new-product">+ ' + esc(t('add_product')) + '</button></div></div>' +
      '<div class="row wrap" style="margin-top:10px"><button class="btn small" data-act="import-csv">' + esc(t('import_csv')) + '</button><button class="btn small" data-act="export-products"' + (state.products.length ? '' : ' disabled') + '>' + esc(t('export_csv')) + '</button>' +
      (state.products.length ? '' : '<button class="btn small" data-act="demo">' + esc(t('load_demo')) + '</button>') + '<input type="file" id="csvFile" accept=".csv,text/csv" hidden></div>';
    h += '<div class="search" style="margin-top:12px">' + ICON.search + '<input type="search" id="pq" placeholder="' + esc(t('search_ph')) + '" value="' + esc(ui.pq || '') + '" aria-label="' + esc(t('search_ph')) + '"></div>';
    h += '<div class="plist" id="plist">' + plistHTML() + '</div>';
    $('#main').innerHTML = h;
  }
  function plistHTML() {
    var q = (ui.pq || '').trim().toLowerCase();
    var list = state.products.filter(function (p) { return !q || (p.name + ' ' + p.category + ' ' + p.sku).toLowerCase().indexOf(q) >= 0; });
    if (!list.length) return '<div class="empty card"><div class="big" aria-hidden="true">'+ICON.products+'</div><h3>' + esc(t(state.products.length ? 'no_match' : 'no_products')) + '</h3>' + (state.products.length ? '' : '<div>' + esc(t('no_products_hint')) + '</div>') + '</div>';
    return list.map(function (p) {
      return '<div class="prow"><div class="dot" style="background:' + p.color + '">' + esc(initial(p.name)) + '</div><div class="grow"><div class="prow-name">' + esc(p.name) + '</div><div class="prow-meta">' +
        [p.category, p.sku, p.stock != null ? t('stock') + ': ' + num(p.stock) : ''].filter(Boolean).map(esc).join(' · ') + '</div></div><div class="price">' + money(p.price) + '</div>' +
        '<button class="btn small" data-act="edit-product" data-id="' + esc(p.id) + '">' + esc(t('edit')) + '</button></div>';
    }).join('');
  }
  function productForm(p) {
    var d = S().decimals, isNew = !p;
    p = p || { name: '', price: 0, category: '', sku: '', stock: null, color: PALETTE[state.products.length % PALETTE.length] };
    ui.editing = p;
    openModal('<h3>' + esc(t(isNew ? 'new_product' : 'edit_product')) + '</h3><form id="pform" class="stack" novalidate>' +
      '<label class="f"><span>' + esc(t('p_name')) + '</span><input type="text" name="name" maxlength="60" value="' + esc(p.name) + '" required></label>' +
      '<div class="grid2"><label class="f"><span>' + esc(t('p_price')) + ' (' + esc(S().currency) + ')</span><input type="text" name="price" inputmode="decimal" value="' + (isNew ? '' : (p.price / Math.pow(10, d)).toFixed(d)) + '"></label>' +
      '<label class="f"><span>' + esc(t('stock')) + '</span><input type="text" name="stock" inputmode="numeric" placeholder="' + esc(t('stock_ph')) + '" value="' + (p.stock == null ? '' : p.stock) + '"></label></div>' +
      '<div class="grid2"><label class="f"><span>' + esc(t('p_category')) + '</span><input type="text" name="category" maxlength="30" list="catlist" value="' + esc(p.category) + '"></label>' +
      '<label class="f"><span>' + esc(t('p_sku')) + '</span><input type="text" name="sku" maxlength="30" value="' + esc(p.sku) + '"></label></div>' +
      '<datalist id="catlist">' + categories().map(function (c) { return '<option value="' + esc(c) + '">'; }).join('') + '</datalist>' +
      '<div class="f"><span class="muted" style="font-weight:600;font-size:14px">' + esc(t('p_color')) + '</span><div class="swatches">' + PALETTE.map(function (c) { return '<button type="button" class="sw" data-act="swatch" data-c="' + c + '" style="background:' + c + '" aria-pressed="' + (p.color === c) + '" aria-label="' + c + '"></button>'; }).join('') + '</div></div>' +
      '<div class="err" id="perr" role="alert"></div>' +
      '<div class="mactions"><button class="btn primary" type="submit">' + esc(t('save')) + '</button>' + (isNew ? '' : '<button class="btn danger" type="button" data-act="del-product" data-id="' + esc(p.id) + '">' + esc(t('delete')) + '</button>') + '<button class="btn" type="button" data-act="close-modal">' + esc(t('cancel')) + '</button></div></form>');
    var f = $('#pform [name=name]'); if (f) f.focus();
    $('#pform').addEventListener('submit', function (e) { e.preventDefault(); submitProduct(isNew); });
  }
  function submitProduct(isNew) {
    var f = $('#pform'), v = function (n) { return f.elements[n].value.trim(); }, err = $('#perr');
    var name = v('name'), price = K.toMinor(v('price'), S().decimals), stockRaw = v('stock'), stock = null;
    if (!name) { err.textContent = t('invalid_name'); return f.elements.name.focus(); }
    if (isNaN(price)) { err.textContent = t('invalid_price'); return f.elements.price.focus(); }
    if (stockRaw !== '') { if (!/^\d+$/.test(stockRaw.replace(/[\u0660-\u0669]/g, function (c) { return c.charCodeAt(0) - 0x660; }))) { err.textContent = t('invalid_stock'); return f.elements.stock.focus(); } stock = parseInt(stockRaw.replace(/[\u0660-\u0669]/g, function (c) { return c.charCodeAt(0) - 0x660; }), 10); }
    var p = ui.editing;
    if (isNew) { p = { id: uid() }; state.products.push(p); }
    p.name = name; p.price = price; p.stock = stock; p.category = v('category'); p.sku = v('sku'); p.color = ui.editing.color;
    save(); closeModal(); toast(t('saved')); render();
  }
  var DEMO = {
    en: [['Espresso', 35, 'Drinks', 40], ['Cappuccino', 45, 'Drinks', 40], ['Fresh orange juice', 40, 'Drinks', 25], ['Bottled water', 10, 'Drinks', 60], ['Croissant', 30, 'Bakery', 18], ['Chocolate cake slice', 55, 'Bakery', 12], ['Cheese sandwich', 50, 'Food', 15], ['Chips', 15, 'Snacks', 50]],
    ar: [['إسبريسو', 35, 'مشروبات', 40], ['كابتشينو', 45, 'مشروبات', 40], ['عصير برتقال طازج', 40, 'مشروبات', 25], ['مياه معدنية', 10, 'مشروبات', 60], ['كرواسون', 30, 'مخبوزات', 18], ['قطعة كيك شوكولاتة', 55, 'مخبوزات', 12], ['ساندوتش جبنة', 50, 'أكل', 15], ['شيبسي', 15, 'سناكس', 50]]
  };
  function loadDemo() {
    var cats = {}, u = Math.pow(10, S().decimals);
    DEMO[S().language].forEach(function (d, i) {
      if (!cats[d[2]]) cats[d[2]] = PALETTE[Object.keys(cats).length % PALETTE.length];
      state.products.push({ id: uid() + i, name: d[0], price: d[1] * u, category: d[2], sku: String(1000 + i), stock: d[3], color: cats[d[2]] });
    });
    save(); render();
  }
  function importCSV(text) {
    var r = K.productsFromCSV(text, S().decimals);
    if (r.errors.length && r.errors[0].reason === 'header') return toast(t('import_bad'));
    r.products.forEach(function (p, i) { p.id = uid() + i; p.color = PALETTE[(state.products.length + i) % PALETTE.length]; state.products.push(p); });
    ui.pq = ''; save(); render();
    toast(t('imported', { n: num(r.products.length) }) + (r.errors.length ? ' · ' + t('import_skipped', { n: num(r.errors.length) }) : ''));
  }

  // ---------- sales ----------
  function today() { return K.dateKey(Date.now()); }
  function shiftDay(key, n) { var d = new Date(key + 'T12:00:00'); d.setDate(d.getDate() + n); return K.dateKey(d.getTime()); }
  function renderSales() {
    if (!ui.day) ui.day = today();
    var D = K.dailyTotals(state.sales, ui.day), days = K.lastDays(state.sales, ui.day, 7), max = Math.max.apply(null, days.map(function (d) { return d.total; }).concat([1]));
    var list = state.sales.filter(function (s) { return K.dateKey(s.ts) === ui.day; });
    var h = '<div class="row wrap between"><h2>' + esc(t('nav_sales')) + '</h2><div class="daynav"><button class="iconbtn" data-act="day" data-n="-1" aria-label="' + esc(t('prev_day')) + '"><span class="flip">‹</span></button>' +
      '<input type="date" id="dayIn" value="' + ui.day + '" aria-label="' + esc(t('day')) + '"><button class="iconbtn" data-act="day" data-n="1" aria-label="' + esc(t('next_day')) + '"><span class="flip">›</span></button>' +
      (ui.day !== today() ? '<button class="btn small" data-act="day-today">' + esc(t('sales_today')) + '</button>' : '') + '</div></div>';
    h += '<div class="stats" style="margin-top:12px"><div class="stat hero"><small>' + esc(t('revenue')) + '</small><b id="sRev">' + money(D.gross) + '</b></div><div class="stat"><small>' + esc(t('orders')) + '</small><b>' + num(D.count) + '</b></div><div class="stat"><small>' + esc(t('avg_order')) + '</small><b>' + money(D.avg) + '</b></div><div class="stat"><small>' + esc(t('items_sold')) + '</small><b>' + num(D.items) + '</b></div></div>';
    h += '<div class="cols"><div class="card"><h3 style="margin-bottom:6px">' + esc(t('last7')) + '</h3><div class="bars">' + days.map(function (d) {
      var dd = d.key.slice(8); return '<div class="bar' + (d.key === ui.day ? ' cur' : '') + '" title="' + d.key + ': ' + esc(money(d.total)) + '"><i style="height:' + Math.round(d.total / max * 100) + '%"></i><span>' + num(parseInt(dd, 10)) + '</span></div>';
    }).join('') + '</div></div><div class="card"><h3 style="margin-bottom:6px">' + esc(t('by_method')) + '</h3>' +
      (D.count ? Object.keys(D.byMethod).map(function (m) { return '<div class="srow"><div class="grow"><div class="row between"><span>' + esc(t(m)) + '</span><b>' + money(D.byMethod[m]) + '</b></div><div class="meter"><i style="width:' + Math.round(D.byMethod[m] / D.gross * 100) + '%"></i></div></div></div>'; }).join('') : '<div class="muted">' + esc(t('no_sales')) + '</div>') +
      '</div></div>';
    if (D.top.length) h += '<div class="card" style="margin-top:14px"><h3 style="margin-bottom:6px">' + esc(t('top_items')) + '</h3>' + D.top.map(function (p) { return '<div class="srow"><span>' + esc(p.name) + '</span><span class="muted">× ' + num(p.qty) + ' · ' + money(p.revenue) + '</span></div>'; }).join('') + '</div>';
    h += '<div class="card" style="margin-top:14px"><div class="row wrap between"><h3>' + esc(t('receipt')) + ' ' + num(list.length) + '</h3><div class="row wrap"><button class="btn small" data-act="day-report">' + esc(t('print_day')) + '</button><button class="btn small" data-act="export-sales"' + (state.sales.length ? '' : ' disabled') + '>' + esc(t('export_sales')) + '</button></div></div>' +
      (list.length ? list.map(function (s) {
        return '<button class="srow" data-act="open-sale" data-id="' + esc(s.id) + '"><div><b>' + esc(s.no) + '</b> <span class="muted">' + dtStr(s.ts).slice(-5) + '</span> ' + (s.voided ? '<span class="pill void">' + esc(t('voided')) + '</span>' : '<span class="pill">' + esc(t(s.method)) + '</span>') + '<div class="muted" style="font-size:13px">' + num(s.count) + ' ' + esc(t(s.count === 1 ? 'item' : 'items')) + '</div></div><b style="' + (s.voided ? 'text-decoration:line-through;opacity:.5' : '') + '">' + money(s.total) + '</b></button>';
      }).join('') : '<div class="empty"><div class="big" aria-hidden="true">'+ICON.receipt+'</div>' + esc(t('no_sales')) + '</div>') + '</div>';
    $('#main').innerHTML = h;
  }
  function dayReport() {
    var D = K.dailyTotals(state.sales, ui.day), rl = function (a, b, c) { return '<div class="rl ' + (c || '') + '"><span>' + a + '</span><span>' + b + '</span></div>'; };
    var cash = D.byMethod.cash || 0;
    var h = '<h3>' + esc(t('day_report')) + '</h3><div class="receipt report"><div class="rc-head">' + (S().logo ? '<img class="rc-logo" src="' + S().logo + '" alt="">' : '') + '<div class="rc-name">' + esc(S().shopName) + '</div><div>' + esc(t('day_report')) + ' · ' + (S().arabicDigits ? K.toArabicDigits(ui.day) : ui.day) + '</div></div><hr>' +
      rl(esc(t('orders')), num(D.count)) + rl(esc(t('items_sold')), num(D.items)) + rl(esc(t('discounts_given')), money(D.discount)) + rl(esc(t('net_sales')), money(D.net)) + rl(esc(t('tax_collected')), money(D.tax)) + rl(esc(t('revenue')), money(D.gross), 'b') + '<hr>' +
      Object.keys(D.byMethod).map(function (m) { return rl(esc(t(m)), money(D.byMethod[m])); }).join('') +
      (D.voided ? '<hr>' + rl(esc(t('voided')), num(D.voided)) : '') +
      (D.top.length ? '<hr><b>' + esc(t('top_items')) + '</b>' + D.top.map(function (p) { return rl(esc(p.name), '× ' + num(p.qty)); }).join('') : '') + '</div>' +
      '<div class="mactions no-print"><button class="btn primary" data-act="print">' + esc(t('print')) + '</button><button class="btn" data-act="close-modal">' + esc(t('close')) + '</button></div>';
    openModal(h);
  }
  function voidSale(id) {
    var s = state.sales.find(function (x) { return x.id === id; });
    if (!s || s.voided) return;
    confirmBox(t('confirm_void', { no: s.no }), function () {
      s.voided = true; K.applyStock(state.products, s.lines, 1); save(); closeModal(); render();
    });
  }

  // ---------- settings ----------
  function field(label, name, val, extra) {
    return '<label class="f"><span>' + esc(label) + '</span><input type="text" name="' + name + '" value="' + esc(val) + '" ' + (extra || '') + '></label>';
  }
  function renderSettings() {
    var s = S(), locked = state.products.length || state.sales.length;
    var h = '<h2>' + esc(t('nav_settings')) + '</h2><form id="sform" class="sections" style="margin-top:12px" onsubmit="return false">';
    h += '<section class="card stack"><h3>' + esc(t('settings_brand')) + '</h3><div class="logo-edit" id="logoEdit">' + logoHTML() + '<div class="stack" style="gap:8px"><button type="button" class="btn small" data-act="logo-pick">' + esc(t('upload_logo')) + '</button>' + (s.logo ? '<button type="button" class="btn small danger" data-act="logo-remove">' + esc(t('remove_logo')) + '</button>' : '') + '</div><input type="file" id="logoFile" accept="image/png,image/jpeg,image/webp,image/svg+xml" hidden></div><div class="hint">' + esc(t('logo_hint')) + '</div>' +
      '<div class="row wrap"><label class="f"><span>' + esc(t('primary')) + '</span><input type="color" name="primary" value="' + s.primary + '"></label><label class="f"><span>' + esc(t('accent')) + '</span><input type="color" name="accent" value="' + s.accent + '"></label><div id="contrast" class="grow"></div></div>' +
      '<div class="preview" id="preview"></div></section>';
    h += '<section class="card stack"><h3>' + esc(t('settings_shop')) + '</h3>' + field(t('shop_name'), 'shopName', s.shopName, 'maxlength="60"') + field(t('tagline'), 'tagline', s.tagline, 'maxlength="80"') + field(t('address'), 'address', s.address, 'maxlength="160"') + '<div class="grid2 stack-sm">' + field(t('phone'), 'phone', s.phone, 'inputmode="tel" maxlength="40"') + field(t('tax_id'), 'taxId', s.taxId, 'maxlength="40"') + '</div>' +
      '<label class="f"><span>' + esc(t('language')) + '</span><select name="language"><option value="en"' + (s.language === 'en' ? ' selected' : '') + '>English</option><option value="ar"' + (s.language === 'ar' ? ' selected' : '') + '>العربية</option></select></label></section>';
    h += '<section class="card stack"><h3>' + esc(t('settings_money')) + '</h3><div class="grid2 stack-sm">' + field(t('currency'), 'currency', s.currency, 'maxlength="8"') +
      '<label class="f"><span>' + esc(t('currency_pos')) + '</span><select name="currencyPos"><option value="before"' + (s.currencyPos === 'before' ? ' selected' : '') + '>' + esc(t('pos_before')) + '</option><option value="after"' + (s.currencyPos === 'after' ? ' selected' : '') + '>' + esc(t('pos_after')) + '</option></select></label></div>' +
      '<div class="grid2 stack-sm"><label class="f"><span>' + esc(t('decimals')) + '</span><select name="decimals"' + (locked ? ' disabled' : '') + '>' + [0, 1, 2, 3].map(function (d) { return '<option value="' + d + '"' + (s.decimals === d ? ' selected' : '') + '>' + d + '</option>'; }).join('') + '</select></label>' +
      field(t('tax_rate'), 'taxRate', s.taxRate, 'inputmode="decimal"') + '</div>' + (locked ? '<div class="hint">' + esc(t('decimals')) + ': ' + (S().language === 'ar' ? 'لا يمكن تغييرها بعد إضافة منتجات أو مبيعات.' : 'locked once products or sales exist.') + '</div>' : '') +
      '<div class="checks"><label><input type="checkbox" name="taxInclusive"' + (s.taxInclusive ? ' checked' : '') + '>' + esc(t('tax_inclusive')) + '</label><label><input type="checkbox" name="arabicDigits"' + (s.arabicDigits ? ' checked' : '') + '>' + esc(t('arabic_digits')) + '</label></div>' +
      '<div class="f"><span class="muted" style="font-weight:600;font-size:14px">' + esc(t('methods')) + '</span><div class="checks">' + ['cash', 'card', 'other'].map(function (m) { return '<label><input type="checkbox" name="pm_' + m + '"' + (s.paymentMethods.indexOf(m) >= 0 ? ' checked' : '') + '>' + esc(t(m)) + '</label>'; }).join('') + '</div></div></section>';
    h += '<section class="card stack"><h3>' + esc(t('settings_receipt')) + '</h3>' + field(t('prefix'), 'receiptPrefix', s.receiptPrefix, 'maxlength="8"') + '<label class="f"><span>' + esc(t('footer')) + '</span><textarea name="receiptFooter" rows="2" maxlength="160">' + esc(s.receiptFooter) + '</textarea></label></section>';
    h += '<section class="card stack"><h3>' + esc(t('settings_white')) + '</h3><div class="hint">' + esc(t('brand_export_hint')) + '</div><div class="mactions" style="margin:0"><button type="button" class="btn" data-act="brand-export">' + esc(t('brand_export')) + '</button><button type="button" class="btn" data-act="brand-import">' + esc(t('brand_import')) + '</button></div><input type="file" id="brandFile" accept=".json,application/json" hidden></section>';
    h += '<section class="card stack"><h3>' + esc(t('settings_data')) + '</h3><div class="hint">' + esc(t('storage_note')) + '</div><div class="mactions" style="margin:0"><button type="button" class="btn" data-act="backup-export">' + esc(t('backup_export')) + '</button><button type="button" class="btn" data-act="backup-import">' + esc(t('backup_import')) + '</button></div><input type="file" id="backupFile" accept=".json,application/json" hidden><button type="button" class="btn danger" data-act="reset">' + esc(t('reset')) + '</button></section></form>';
    $('#main').innerHTML = h;
    updatePreview();
  }
  function updatePreview() {
    var s = S(), p = $('#preview'); if (!p) return;
    var ratio = K.contrastRatio(s.primary, K.inkOn(s.primary));
    p.innerHTML = '<div class="preview-head">' + logoHTML() + '<div><div class="brand-name">' + esc(s.shopName) + '</div><div class="brand-tag">' + esc(s.tagline) + '</div></div></div><div class="preview-body"><button class="pbtn" type="button" tabindex="-1">' + esc(t('complete_sale')) + '</button><button class="pbtn acc" type="button" tabindex="-1">' + esc(t('sample_item')) + ' · ' + money(Math.pow(10, s.decimals) * 25) + '</button></div>';
    var c = $('#contrast'); if (c) c.innerHTML = ratio >= 4.5 ? '<div class="ok-note">✓ ' + esc(t('contrast_ok')) + ' (' + ratio.toFixed(1) + ':1)</div>' : '<div class="bad-note">' + esc(t('contrast_warn')) + ' (' + ratio.toFixed(1) + ':1)</div>';
    var le = $('#logoEdit'); if (le) { var old = $('.logo,.mono', le); old.outerHTML = logoHTML(); }
  }
  function onSettingInput(e) {
    var el = e.target, n = el.name, s = S(); if (!n) return;
    if (n.indexOf('pm_') === 0) {
      var m = n.slice(3), on = el.checked, list = s.paymentMethods.filter(function (x) { return x !== m; });
      if (on) list.push(m);
      if (!list.length) { el.checked = true; return; }
      s.paymentMethods = ['cash', 'card', 'other'].filter(function (x) { return list.indexOf(x) >= 0; });
      if (s.paymentMethods.indexOf(ui.method) < 0) ui.method = s.paymentMethods[0];
    } else if (el.type === 'checkbox') s[n] = el.checked;
    else if (n === 'taxRate') { var v = K.toNumber(el.value); s.taxRate = isFinite(v) && v >= 0 && v <= 100 ? v : 0; }
    else if (n === 'decimals') s.decimals = parseInt(el.value, 10);
    else if (n === 'shopName') s.shopName = el.value.slice(0, 60);
    else s[n] = el.value;
    if (n === 'shopName' && !s.shopName.trim()) s.shopName = K.BRAND_DEFAULTS.shopName;
    save();
    if (n === 'language') { setLang(); applyBrand(); renderChrome(); renderSettings(); return; }
    applyBrand(); renderChrome(); updatePreview();
  }
  function applyBrandObject(raw) {
    var b = K.sanitizeBrand(raw); Object.keys(b).forEach(function (k) { state.settings[k] = b[k]; });
    save(); setLang(); applyBrand(); render();
  }
  function readFile(file, asText, cb) {
    var r = new FileReader(); r.onload = function () { cb(r.result); }; r.onerror = function () { cb(null); };
    asText ? r.readAsText(file) : r.readAsDataURL(file);
  }
  function resizeLogo(file, cb) {
    readFile(file, false, function (url) {
      if (!url) return cb(null);
      var img = new Image();
      img.onload = function () {
        var max = 256, w = img.naturalWidth || max, h = img.naturalHeight || max, sc = Math.min(1, max / Math.max(w, h));
        var cv = document.createElement('canvas'); cv.width = Math.max(1, Math.round(w * sc)); cv.height = Math.max(1, Math.round(h * sc));
        cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
        cb(cv.toDataURL('image/png'));
      };
      img.onerror = function () { cb(null); };
      img.src = url;
    });
  }
  function brandFile() {
    var b = Object.assign({}, S()); delete b.paymentMethods; b.paymentMethods = S().paymentMethods.slice();
    return JSON.stringify(Object.assign({ kashierBrand: 1 }, b), null, 2);
  }

  // ---------- render ----------
  function render() {
    renderChrome();
    if (ui.view === 'sell') renderSell(); else if (ui.view === 'products') renderProducts(); else if (ui.view === 'sales') renderSales(); else renderSettings();
  }
  function nav(v) { ui.view = v; closeSheet(); render(); window.scrollTo(0, 0); }

  // ---------- events ----------
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-act]'); if (!el) return;
    var a = el.dataset.act, id = el.dataset.id;
    switch (a) {
      case 'nav': nav(el.dataset.v); break;
      case 'lang': S().language = S().language === 'ar' ? 'en' : 'ar'; save(); setLang(); applyBrand(); render(); break;
      case 'add': if (addToCart(id)) { refreshCartUI(); } break;
      case 'inc': addToCart(id); refreshCartUI(); break;
      case 'dec': setQty(id, inCart(id) - 1); refreshCartUI(); break;
      case 'clear': clearCart(); refreshCartUI(); break;
      case 'cat': ui.cat = el.dataset.c; $('#cats').innerHTML = catsHTML(); $('#tiles').innerHTML = tilesHTML(); break;
      case 'open-sheet': openSheet(); break;
      case 'close-sheet': closeSheet(); break;
      case 'dtype': {
        var k = el.dataset.k;
        if (k === 'none') { state.disc.value = 0; ui.discMode = null; } else { state.disc.type = k; ui.discMode = k; if (!state.disc.value) state.disc.value = 0; }
        save(); refreshCartUI(); var dv = $('#discVal'); if (dv) dv.focus(); break;
      }
      case 'method': ui.method = el.dataset.m; refreshCartUI(); break;
      case 'quick': ui.tendered = el.dataset.v === 'exact' ? '' : (el.dataset.v / Math.pow(10, S().decimals)).toFixed(S().decimals); refreshCartUI(); break;
      case 'charge': charge(); break;
      case 'hold': state.held.push({ id: uid(), ts: Date.now(), cart: state.cart.slice() }); clearCart(); toast(t('hold_hint')); refreshCartUI(); break;
      case 'held-list':
        openModal('<h3>' + esc(t('held_sales')) + '</h3>' + state.held.map(function (h) {
          var n = h.cart.reduce(function (a, c) { return a + c.qty; }, 0);
          return '<div class="srow"><div><b>' + num(n) + ' ' + esc(t(n === 1 ? 'item' : 'items')) + '</b> <span class="muted">' + dtStr(h.ts).slice(-5) + '</span></div><div class="row"><button class="btn small primary" data-act="resume" data-id="' + esc(h.id) + '">' + esc(t('resume')) + '</button><button class="btn small danger" data-act="held-del" data-id="' + esc(h.id) + '">' + esc(t('delete')) + '</button></div></div>';
        }).join('') + '<div class="mactions"><button class="btn" data-act="close-modal">' + esc(t('close')) + '</button></div>');
        break;
      case 'resume': {
        var hh = state.held.find(function (x) { return x.id === id; }); if (!hh) break;
        hh.cart.forEach(function (c) { var p = findP(c.id); if (!p) return; var q = Math.min(c.qty, p.stock != null ? Math.max(0, p.stock - inCart(c.id)) : c.qty); if (q > 0) { var ex = state.cart.find(function (x) { return x.id === c.id; }); if (ex) ex.qty += q; else state.cart.push({ id: c.id, qty: q }); } });
        state.held = state.held.filter(function (x) { return x.id !== id; }); save(); closeModal(); toast(t('resumed')); refreshCartUI(); break;
      }
      case 'held-del': state.held = state.held.filter(function (x) { return x.id !== id; }); save(); closeModal(); refreshCartUI(); break;
      case 'new-product': productForm(null); break;
      case 'edit-product': productForm(findP(id)); break;
      case 'swatch': ui.editing.color = el.dataset.c; $$('.sw').forEach(function (s) { s.setAttribute('aria-pressed', String(s.dataset.c === el.dataset.c)); }); break;
      case 'del-product': { var p = findP(id); confirmBox(t('confirm_delete_product', { name: p.name }), function () { state.products = state.products.filter(function (x) { return x.id !== id; }); state.cart = state.cart.filter(function (x) { return x.id !== id; }); save(); closeModal(); render(); }); break; }
      case 'demo': loadDemo(); break;
      case 'import-csv': $('#csvFile').click(); break;
      case 'export-products': download('products.csv', '\uFEFF' + K.productsToCSV(state.products, S().decimals), 'text/csv'); break;
      case 'close-modal': closeModal(); break;
      case 'print': window.print(); break;
      case 'open-sale': showReceipt(state.sales.find(function (s) { return s.id === id; }), false); break;
      case 'void': voidSale(id); break;
      case 'day': ui.day = shiftDay(ui.day, parseInt(el.dataset.n, 10)); renderSales(); break;
      case 'day-today': ui.day = today(); renderSales(); break;
      case 'day-report': dayReport(); break;
      case 'export-sales': download('sales.csv', '\uFEFF' + K.salesToCSV(state.sales.slice().reverse(), S().decimals), 'text/csv'); break;
      case 'logo-pick': $('#logoFile').click(); break;
      case 'logo-remove': S().logo = ''; save(); renderSettings(); renderChrome(); break;
      case 'brand-export': download('brand-' + (S().shopName.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]+/g, '-').replace(/^-|-$/g, '') || 'shop') + '.json', brandFile(), 'application/json'); break;
      case 'brand-import': $('#brandFile').click(); break;
      case 'backup-export': download('kashier-backup-' + today() + '.json', JSON.stringify(state), 'application/json'); break;
      case 'backup-import': $('#backupFile').click(); break;
      case 'reset': confirmBox(t('reset_confirm'), function () { state = K.normalizeState({}); save(); setLang(); applyBrand(); ui.day = ''; render(); }); break;
    }
  });
  document.addEventListener('input', function (e) {
    var el = e.target;
    if (el.id === 'q') { ui.q = el.value; $('#tiles').innerHTML = tilesHTML(); }
    else if (el.id === 'pq') { ui.pq = el.value; $('#plist').innerHTML = plistHTML(); }
    else if (el.id === 'discVal') { var v = K.toNumber(el.value); v = isFinite(v) && v > 0 ? Math.min(v, 1e9) : 0; if (state.disc.type === 'percent') v = Math.min(v, 100); state.disc.value = v; save(); $$('[data-act=dtype]').forEach(function (b) { var k = b.dataset.k; b.setAttribute('aria-pressed', String(k === 'none' ? !v : (k === state.disc.type))); }); updateCartDynamic(); }
    else if (el.id === 'tendered') { ui.tendered = el.value; updateCartDynamic(); }
    else if (el.closest && el.closest('#sform')) onSettingInput(e);
  });
  document.addEventListener('change', function (e) {
    var el = e.target;
    if (el.id === 'dayIn') { if (el.value) { ui.day = el.value; renderSales(); } }
    else if (el.id === 'csvFile' && el.files[0]) { readFile(el.files[0], true, function (txt) { if (txt != null) importCSV(txt); }); el.value = ''; }
    else if (el.id === 'logoFile' && el.files[0]) { resizeLogo(el.files[0], function (url) { if (url) { S().logo = url; save(); renderSettings(); renderChrome(); } }); el.value = ''; }
    else if (el.id === 'brandFile' && el.files[0]) {
      readFile(el.files[0], true, function (txt) {
        var o = null; try { o = JSON.parse(txt); } catch (x) { o = null; }
        if (!o || o.kashierBrand !== 1) return toast(t('brand_bad'));
        applyBrandObject(o); toast(t('brand_imported'));
      }); el.value = '';
    } else if (el.id === 'backupFile' && el.files[0]) {
      readFile(el.files[0], true, function (txt) {
        var o = null; try { o = JSON.parse(txt); } catch (x) { o = null; }
        if (!o || !Array.isArray(o.products) || !o.settings) return toast(t('backup_bad'));
        confirmBox(t('backup_confirm'), function () { state = K.normalizeState(o); save(); setLang(); applyBrand(); ui.day = ''; render(); toast(t('backup_restored')); });
      }); el.value = '';
    }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { if (!$('#modal').hidden) closeModal(); else closeSheet(); }
    if (e.key === 'Enter' && e.target.id === 'q') {
      e.preventDefault();
      var q = ui.q.trim().toLowerCase(); if (!q) return;
      var exact = state.products.find(function (p) { return p.sku && p.sku.toLowerCase() === q; });
      var list = filtered(), hit = exact || (list.length === 1 ? list[0] : null);
      if (hit && !(hit.stock != null && hit.stock <= 0)) { if (addToCart(hit.id)) { ui.q = ''; renderSell(); toast(t('toast_added') + ': ' + hit.name); $('#q').focus(); } }
    }
    if (e.key === 'Enter' && (e.target.id === 'tendered' || e.target.id === 'discVal')) { e.preventDefault(); var b = $('#chargeBtn'); if (b && !b.disabled && e.target.id === 'tendered') charge(); }
  });

  load(); setLang(); applyBrand(); render();
  window.__kashier = { get state() { return state; } };
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol) && location.hostname !== 'localhost') navigator.serviceWorker.register('sw.js').catch(function () {});
})();

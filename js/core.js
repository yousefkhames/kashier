/* Kashier core: pure logic, no DOM. Works in browser (window.KCore) and node (module.exports). */
(function (root) {
  'use strict';

  var HEX = /^#[0-9a-fA-F]{6}$/;

  function pow10(d) { return Math.pow(10, d); }

  /** Parse a user-typed amount ("12.5", "12,50", "١٢٫٥") into integer minor units. Returns NaN if invalid. */
  function toMinor(input, decimals) {
    if (typeof input === 'number') return Math.round(input * pow10(decimals));
    var s = String(input == null ? '' : input).trim();
    if (!s) return NaN;
    // arabic-indic and persian digits to latin
    s = s.replace(/[\u0660-\u0669]/g, function (c) { return c.charCodeAt(0) - 0x0660; })
         .replace(/[\u06F0-\u06F9]/g, function (c) { return c.charCodeAt(0) - 0x06F0; })
         .replace(/\u066B|\u066C/g, '.').replace(/،/g, '.');
    s = s.replace(',', '.');
    if (!/^\d*\.?\d*$/.test(s) || s === '.') return NaN;
    var n = parseFloat(s);
    if (!isFinite(n) || n < 0) return NaN;
    return Math.round(n * pow10(decimals) + 1e-9);
  }

  function groupInt(str) { return str.replace(/\B(?=(\d{3})+(?!\d))/g, ','); }

  /** Format minor units for display using brand settings. */
  function fmtMoney(minor, cfg) {
    var d = cfg.decimals, neg = minor < 0, v = Math.abs(minor);
    var whole = Math.floor(v / pow10(d)), frac = v % pow10(d);
    var s = groupInt(String(whole));
    if (d > 0) s += '.' + String(frac).padStart(d, '0');
    var cur = cfg.currency || '';
    var out = cfg.currencyPos === 'before' ? (cur ? cur + ' ' : '') + s : s + (cur ? ' ' + cur : '');
    if (neg) out = '-' + out;
    if (cfg.arabicDigits) out = toArabicDigits(out);
    return out;
  }

  function toArabicDigits(s) {
    return String(s).replace(/\d/g, function (c) { return String.fromCharCode(0x0660 + Number(c)); }).replace(/\./g, '\u066B').replace(/,/g, '\u066C');
  }

  function discountAmount(subtotal, disc, decimals) {
    if (!disc || !disc.value) return 0;
    var v = Number(disc.value);
    if (!isFinite(v) || v <= 0) return 0;
    if (disc.type === 'percent') return Math.min(subtotal, Math.round(subtotal * Math.min(v, 100) / 100));
    return Math.min(subtotal, Math.round(v));
  }

  /**
   * items: [{price (minor), qty}], opts: {discount:{type:'percent'|'fixed', value}, taxRate (percent), taxInclusive}
   * returns minor-unit totals. total = what the customer pays.
   */
  function computeCart(items, opts) {
    opts = opts || {};
    var subtotal = 0, count = 0;
    items.forEach(function (i) { subtotal += Math.round(i.price * i.qty); count += i.qty; });
    var discount = discountAmount(subtotal, opts.discount, opts.decimals);
    var net = subtotal - discount;
    var rate = Math.max(0, Number(opts.taxRate) || 0), tax, total;
    if (opts.taxInclusive) { total = net; tax = rate ? Math.round(net - net / (1 + rate / 100)) : 0; }
    else { tax = Math.round(net * rate / 100); total = net + tax; }
    return { subtotal: subtotal, discount: discount, tax: tax, total: total, count: count };
  }

  function changeDue(total, tendered) { return tendered >= total ? tendered - total : 0; }

  function pad(n, w) { return String(n).padStart(w, '0'); }
  function dateKey(ts) { var d = new Date(ts); return d.getFullYear() + '-' + pad(d.getMonth() + 1, 2) + '-' + pad(d.getDate(), 2); }
  function receiptNo(prefix, n) { return (prefix || '') + pad(n, 5); }

  /** Totals for sales on one local day. Voided sales are excluded from money but counted separately. */
  function dailyTotals(sales, key) {
    var r = { key: key, count: 0, voided: 0, gross: 0, net: 0, tax: 0, discount: 0, items: 0, byMethod: {}, top: [], avg: 0 };
    var prod = {};
    sales.forEach(function (s) {
      if (dateKey(s.ts) !== key) return;
      if (s.voided) { r.voided++; return; }
      r.count++; r.gross += s.total; r.tax += s.tax; r.discount += s.discount; r.items += s.count;
      r.byMethod[s.method] = (r.byMethod[s.method] || 0) + s.total;
      s.lines.forEach(function (l) {
        var p = prod[l.name] || (prod[l.name] = { name: l.name, qty: 0, revenue: 0 });
        p.qty += l.qty; p.revenue += Math.round(l.price * l.qty);
      });
    });
    r.net = r.gross - r.tax;
    r.avg = r.count ? Math.round(r.gross / r.count) : 0;
    r.top = Object.keys(prod).map(function (k) { return prod[k]; }).sort(function (a, b) { return b.qty - a.qty || b.revenue - a.revenue; }).slice(0, 5);
    return r;
  }

  function lastDays(sales, endKey, n) {
    var out = [], d = new Date(endKey + 'T12:00:00');
    for (var i = n - 1; i >= 0; i--) {
      var x = new Date(d.getTime() - i * 86400000);
      var k = dateKey(x.getTime());
      out.push({ key: k, total: dailyTotals(sales, k).gross });
    }
    return out;
  }

  // ---------- colours ----------
  function hexToRgb(h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }
  function luminance(h) {
    var c = hexToRgb(h).map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  function contrastRatio(a, b) { var l1 = luminance(a), l2 = luminance(b); var hi = Math.max(l1, l2), lo = Math.min(l1, l2); return (hi + 0.05) / (lo + 0.05); }
  /** Readable text colour on top of a brand colour. */
  function inkOn(h) { return contrastRatio(h, '#ffffff') >= contrastRatio(h, '#14110f') ? '#ffffff' : '#14110f'; }
  function mix(h1, h2, t) {
    var a = hexToRgb(h1), b = hexToRgb(h2);
    return '#' + a.map(function (v, i) { return pad(Math.round(v + (b[i] - v) * t).toString(16), 2); }).join('');
  }

  // ---------- branding ----------
  var BRAND_DEFAULTS = {
    shopName: 'My Shop', tagline: '', address: '', phone: '', taxId: '',
    logo: '', primary: '#0f766e', accent: '#f59e0b',
    currency: 'EGP', currencyPos: 'after', decimals: 2, arabicDigits: false,
    language: 'en', taxRate: 0, taxInclusive: false, receiptPrefix: 'R-', receiptFooter: 'Thank you!',
    paymentMethods: ['cash', 'card', 'other']
  };

  function str(v, max, fb) { return typeof v === 'string' ? v.slice(0, max) : fb; }

  /** Take an unknown object (e.g. imported JSON) and return a safe brand config. Unknown keys are dropped. */
  function sanitizeBrand(obj) {
    obj = obj && typeof obj === 'object' ? obj : {};
    var b = {}, D = BRAND_DEFAULTS;
    b.shopName = str(obj.shopName, 60, D.shopName).trim() || D.shopName;
    b.tagline = str(obj.tagline, 80, D.tagline);
    b.address = str(obj.address, 160, D.address);
    b.phone = str(obj.phone, 40, D.phone);
    b.taxId = str(obj.taxId, 40, D.taxId);
    b.logo = (typeof obj.logo === 'string' && /^data:image\/(png|jpeg|webp|svg\+xml);base64,[A-Za-z0-9+\/=]+$/.test(obj.logo) && obj.logo.length < 400000) ? obj.logo : '';
    b.primary = HEX.test(obj.primary) ? obj.primary.toLowerCase() : D.primary;
    b.accent = HEX.test(obj.accent) ? obj.accent.toLowerCase() : D.accent;
    b.currency = str(obj.currency, 8, D.currency).trim();
    b.currencyPos = obj.currencyPos === 'before' ? 'before' : 'after';
    var dec = parseInt(obj.decimals, 10);
    b.decimals = dec >= 0 && dec <= 3 ? dec : D.decimals;
    b.arabicDigits = !!obj.arabicDigits;
    b.language = obj.language === 'ar' ? 'ar' : 'en';
    var tr = Number(obj.taxRate);
    b.taxRate = isFinite(tr) && tr >= 0 && tr <= 100 ? tr : 0;
    b.taxInclusive = !!obj.taxInclusive;
    b.receiptPrefix = str(obj.receiptPrefix, 8, D.receiptPrefix);
    b.receiptFooter = str(obj.receiptFooter, 160, D.receiptFooter);
    var pm = Array.isArray(obj.paymentMethods) ? obj.paymentMethods.filter(function (m) { return ['cash', 'card', 'other'].indexOf(m) >= 0; }) : [];
    b.paymentMethods = pm.length ? pm.filter(function (m, i) { return pm.indexOf(m) === i; }) : D.paymentMethods.slice();
    return b;
  }

  // ---------- CSV ----------
  function csvEscape(v) { v = String(v == null ? '' : v); if (/^[=+\-@\t\r]/.test(v)) v = "'" + v; return /[",\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
  function toCSV(rows) { return rows.map(function (r) { return r.map(csvEscape).join(','); }).join('\r\n'); }
  function parseCSV(text) {
    var rows = [], row = [], cur = '', q = false, i = 0;
    text = String(text).replace(/^\uFEFF/, '');
    for (; i < text.length; i++) {
      var c = text[i];
      if (q) {
        if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c;
      } else if (c === '"') q = true;
      else if (c === ',') { row.push(cur); cur = ''; }
      else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cur); rows.push(row); row = []; cur = ''; }
      else cur += c;
    }
    if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
    return rows.filter(function (r) { return r.some(function (x) { return x.trim() !== ''; }); });
  }

  var PRODUCT_HEADER = ['name', 'price', 'category', 'sku', 'stock'];
  function productsToCSV(products, decimals) {
    return toCSV([PRODUCT_HEADER].concat(products.map(function (p) {
      return [p.name, (p.price / pow10(decimals)).toFixed(decimals), p.category || '', p.sku || '', p.stock == null ? '' : p.stock];
    })));
  }
  /** Returns {products:[...], errors:[{line,reason}]} */
  function productsFromCSV(text, decimals) {
    var rows = parseCSV(text), out = { products: [], errors: [] };
    if (!rows.length) return out;
    var head = rows[0].map(function (h) { return h.trim().toLowerCase(); });
    var idx = {}; PRODUCT_HEADER.forEach(function (h) { idx[h] = head.indexOf(h); });
    if (idx.name < 0 || idx.price < 0) { out.errors.push({ line: 1, reason: 'header' }); return out; }
    rows.slice(1).forEach(function (r, n) {
      var name = (r[idx.name] || '').trim().replace(/^'(?=[=+\-@])/, '');
      var price = toMinor(r[idx.price], decimals);
      if (!name) return out.errors.push({ line: n + 2, reason: 'name' });
      if (isNaN(price)) return out.errors.push({ line: n + 2, reason: 'price' });
      var stockRaw = idx.stock >= 0 ? (r[idx.stock] || '').trim() : '';
      var stock = stockRaw === '' ? null : parseInt(stockRaw, 10);
      if (stock !== null && (isNaN(stock) || stock < 0)) return out.errors.push({ line: n + 2, reason: 'stock' });
      out.products.push({ name: name.slice(0, 60), price: price, category: idx.category >= 0 ? (r[idx.category] || '').trim().slice(0, 30) : '', sku: idx.sku >= 0 ? (r[idx.sku] || '').trim().slice(0, 30) : '', stock: stock });
    });
    return out;
  }

  function salesToCSV(sales, decimals) {
    var head = ['receipt', 'date', 'time', 'items', 'subtotal', 'discount', 'tax', 'total', 'method', 'status'];
    var f = function (m) { return (m / pow10(decimals)).toFixed(decimals); };
    return toCSV([head].concat(sales.map(function (s) {
      var d = new Date(s.ts);
      return [s.no, dateKey(s.ts), pad(d.getHours(), 2) + ':' + pad(d.getMinutes(), 2), s.count, f(s.subtotal), f(s.discount), f(s.tax), f(s.total), s.method, s.voided ? 'void' : 'paid'];
    })));
  }

  // ---------- stock ----------
  /** Apply a sale to products (delta -1) or reverse it (+1). Only tracked products (stock != null) change. */
  function applyStock(products, lines, sign) {
    lines.forEach(function (l) {
      var p = products.find(function (x) { return x.id === l.id; });
      if (p && p.stock != null) p.stock = Math.max(0, p.stock + sign * l.qty);
    });
  }
  function stockProblem(products, cart) {
    for (var i = 0; i < cart.length; i++) {
      var p = products.find(function (x) { return x.id === cart[i].id; });
      if (p && p.stock != null && cart[i].qty > p.stock) return { name: p.name, stock: p.stock };
    }
    return null;
  }


  // ---------- state normalisation (storage / backup import) ----------
  function int(v, min, fb) { var n = parseInt(v, 10); return isFinite(n) && n >= min ? n : fb; }
  function normalizeState(raw) {
    if (!raw || typeof raw !== 'object') return null;
    var st = { v: 1, settings: sanitizeBrand(raw.settings), products: [], sales: [], held: [], cart: [], disc: { type: 'percent', value: 0 }, counter: 0 };
    var seen = {};
    (Array.isArray(raw.products) ? raw.products : []).forEach(function (p) {
      if (!p || typeof p.id !== 'string' || seen[p.id] || typeof p.name !== 'string' || !p.name.trim()) return;
      var price = int(p.price, 0, null); if (price === null) return;
      seen[p.id] = 1;
      st.products.push({ id: p.id.slice(0, 40), name: p.name.slice(0, 60), price: price, category: str(p.category, 30, ''), sku: str(p.sku, 30, ''), stock: p.stock == null ? null : int(p.stock, 0, null), color: HEX.test(p.color) ? p.color : '#0f766e' });
    });
    (Array.isArray(raw.sales) ? raw.sales : []).forEach(function (s) {
      if (!s || typeof s.no !== 'string' || !Array.isArray(s.lines)) return;
      var ts = Number(s.ts); if (!isFinite(ts)) return;
      var lines = s.lines.map(function (l) { return l && typeof l.name === 'string' ? { id: str(l.id, 40, ''), name: l.name.slice(0, 60), price: int(l.price, 0, 0), qty: int(l.qty, 1, 1) } : null; }).filter(Boolean);
      st.sales.push({ id: str(s.id, 40, s.no), no: s.no.slice(0, 20), ts: ts, lines: lines, subtotal: int(s.subtotal, 0, 0), discount: int(s.discount, 0, 0), tax: int(s.tax, 0, 0), total: int(s.total, 0, 0), count: int(s.count, 0, 0), method: ['cash', 'card', 'other'].indexOf(s.method) >= 0 ? s.method : 'other', tendered: int(s.tendered, 0, 0), taxInclusive: !!s.taxInclusive, voided: !!s.voided });
    });
    st.counter = int(raw.counter, 0, st.sales.length);
    var cartOf = function (arr) { return (Array.isArray(arr) ? arr : []).filter(function (c) { return c && typeof c.id === 'string' && int(c.qty, 1, 0); }).map(function (c) { return { id: c.id, qty: int(c.qty, 1, 1) }; }); };
    st.cart = cartOf(raw.cart);
    (Array.isArray(raw.held) ? raw.held : []).forEach(function (h) { if (h && cartOf(h.cart).length) st.held.push({ id: str(h.id, 40, 'h' + st.held.length), ts: Number(h.ts) || 0, cart: cartOf(h.cart) }); });
    if (raw.disc && (raw.disc.type === 'percent' || raw.disc.type === 'fixed')) st.disc = { type: raw.disc.type, value: Math.max(0, Number(raw.disc.value) || 0) };
    return st;
  }

  var api = {
    normalizeState: normalizeState,
    BRAND_DEFAULTS: BRAND_DEFAULTS, toMinor: toMinor, fmtMoney: fmtMoney, toArabicDigits: toArabicDigits,
    computeCart: computeCart, discountAmount: discountAmount, changeDue: changeDue, dateKey: dateKey, receiptNo: receiptNo,
    dailyTotals: dailyTotals, lastDays: lastDays, contrastRatio: contrastRatio, inkOn: inkOn, mix: mix, sanitizeBrand: sanitizeBrand,
    toCSV: toCSV, parseCSV: parseCSV, productsToCSV: productsToCSV, productsFromCSV: productsFromCSV, salesToCSV: salesToCSV,
    applyStock: applyStock, stockProblem: stockProblem
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.KCore = api;
})(typeof window !== 'undefined' ? window : globalThis);

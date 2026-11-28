/* MIT · Copyright (c) 2026 Yousef Khames · kashier core: totals, stock, shifts, refunds, CSV (browser and Node). */
(function (root) {
  'use strict';
  const r2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
  const str = (v, n) => String(v == null ? '' : v).slice(0, n || 120);
  const METHODS = ['cash', 'card', 'other'];
  function product(p, i) {
    p = p || {}; const price = Number(p.price), stock = p.stock === null || p.stock === '' || p.stock === undefined ? null : Math.floor(Number(p.stock)), low = p.low === null || p.low === '' || p.low === undefined ? null : Math.floor(Number(p.low));
    return { id: str(p.id, 40).replace(/[^\w-]/g, '') || 'p' + (i + 1), name: str(p.name, 80), price: Number.isFinite(price) && price >= 0 ? r2(price) : 0, cat: str(p.cat, 40), code: str(p.code, 40).trim(),
      stock: Number.isFinite(stock) ? stock : null, low: Number.isFinite(low) ? low : null, demo: !!p.demo };
  }
  function totals(lines, discount, taxRate) {
    const subtotal = r2(lines.reduce((s, l) => s + l.price * l.qty, 0));
    const d = discount || { type: 'none', value: 0 }; let disc = 0;
    if (d.type === 'amount') disc = Math.min(subtotal, Math.max(0, Number(d.value) || 0));
    if (d.type === 'percent') disc = subtotal * Math.min(100, Math.max(0, Number(d.value) || 0)) / 100;
    disc = r2(disc); const taxable = r2(subtotal - disc), rate = Math.min(100, Math.max(0, Number(taxRate) || 0));
    const tax = r2(taxable * rate / 100);
    return { subtotal, discount: disc, taxable, tax, total: r2(taxable + tax), rate };
  }
  const change = (total, tendered) => { const t = Number(tendered); return Number.isFinite(t) && t >= total ? r2(t - total) : null; };
  function addLine(cart, p, qty) {
    qty = qty || 1; const out = cart.map((l) => Object.assign({}, l)); const l = out.find((x) => x.pid === p.id);
    if (l) l.qty += qty; else out.push({ pid: p.id, name: p.name, price: p.price, qty });
    return out.filter((x) => x.qty > 0);
  }
  const findByCode = (products, code) => { const c = str(code).trim().toLowerCase(); return c ? products.find((p) => (p.code && p.code.toLowerCase() === c) || p.id.toLowerCase() === c) || null : null; };
  function stockIssues(products, cart) { return cart.filter((l) => { const p = products.find((x) => x.id === l.pid); return p && p.stock !== null && l.qty > p.stock; }).map((l) => l.pid); }
  function makeSale(o) {
    const tt = totals(o.lines, o.discount, o.taxRate), method = METHODS.includes(o.method) ? o.method : 'cash';
    const tendered = method === 'cash' && o.tendered !== '' && o.tendered != null ? Number(o.tendered) : null;
    return { id: o.id, no: o.no, ts: o.ts, shift: o.shift || null, lines: o.lines.map((l) => ({ pid: l.pid, name: l.name, price: l.price, qty: l.qty })), discount: o.discount || { type: 'none', value: 0 },
      taxRate: tt.rate, subtotal: tt.subtotal, discountAmt: tt.discount, tax: tt.tax, total: tt.total, method, tendered, change: tendered === null ? null : change(tt.total, tendered), refundOf: null, demo: !!o.demo };
  }
  function applyStock(products, sale) { // a sale has positive qty, a refund negative qty, so stock - qty works for both
    return products.map((p) => { const l = sale.lines.find((x) => x.pid === p.id); return l && p.stock !== null ? Object.assign({}, p, { stock: p.stock - l.qty }) : p; });
  }
  function refundOf(sale, id, no, ts, shift) {
    if (sale.refundOf) return null;
    return Object.assign({}, sale, { id, no, ts, shift: shift || null, lines: sale.lines.map((l) => Object.assign({}, l, { qty: -l.qty })), subtotal: -sale.subtotal, discountAmt: -sale.discountAmt, tax: -sale.tax, total: -sale.total, tendered: null, change: null, refundOf: sale.id });
  }
  const isRefunded = (sales, id) => sales.some((s) => s.refundOf === id);
  function shiftSummary(shift, sales) {
    const mine = sales.filter((s) => s.shift === shift.id), by = { cash: 0, card: 0, other: 0 }; let refunds = 0, count = 0;
    mine.forEach((s) => { by[s.method] = r2(by[s.method] + s.total); if (s.total < 0) refunds = r2(refunds + s.total); else count++; });
    const expectedCash = r2((Number(shift.openFloat) || 0) + by.cash), counted = shift.counted == null ? null : Number(shift.counted);
    return { sales: count, refunds, by, net: r2(by.cash + by.card + by.other), expectedCash, counted, difference: counted === null ? null : r2(counted - expectedCash) };
  }
  function dailySummary(sales, dayStart, dayEnd) {
    const d = sales.filter((s) => s.ts >= dayStart && s.ts < dayEnd); return { sales: d.filter((s) => s.total >= 0).length, refunds: d.filter((s) => s.total < 0).length, net: r2(d.reduce((a, s) => a + s.total, 0)) };
  }
  function csvCell(v) { v = String(v == null ? '' : v); if (/^[=+\-@\t\r]/.test(v)) v = "'" + v; return /[",\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
  const toCsv = (rows) => rows.map((r) => r.map(csvCell).join(',')).join('\r\n') + '\r\n';
  function parseCsv(text) {
    const rows = []; let row = [], cur = '', q = false; text = String(text).replace(/^\uFEFF/, '');
    for (let i = 0; i < text.length; i++) { const c = text[i];
      if (q) { if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
      else if (c === '"') q = true; else if (c === ',') { row.push(cur); cur = ''; } else if (c === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; } else if (c !== '\r') cur += c; }
    if (cur !== '' || row.length) { row.push(cur); rows.push(row); } return rows.filter((r) => r.some((x) => x.trim() !== ''));
  }
  const PRODUCT_HEAD = ['name', 'price', 'category', 'code', 'stock', 'low_stock_at'];
  function productsToCsv(products) { return toCsv([PRODUCT_HEAD].concat(products.map((p) => [p.name, p.price, p.cat, p.code, p.stock === null ? '' : p.stock, p.low === null ? '' : p.low]))); }
  function productsFromCsv(text, existingIds) {
    const rows = parseCsv(text); if (!rows.length) return { ok: false, error: 'empty' };
    const head = rows[0].map((h) => h.trim().toLowerCase()); if (!head.includes('name') || !head.includes('price')) return { ok: false, error: 'header' };
    const ix = (k) => head.indexOf(k), used = new Set(existingIds || []); let n = 0, skipped = 0; const out = [];
    rows.slice(1).forEach((r) => { const name = (r[ix('name')] || '').trim().replace(/^'/, ''), price = Number(String(r[ix('price')] || '').replace(',', '.'));
      if (!name || !Number.isFinite(price) || price < 0) { skipped++; return; }
      let id; do { id = 'p' + (++n) + Math.random().toString(36).slice(2, 5); } while (used.has(id)); used.add(id);
      out.push(product({ id, name, price, cat: ix('category') >= 0 ? r[ix('category')] : '', code: ix('code') >= 0 ? (r[ix('code')] || '').replace(/^'/, '') : '', stock: ix('stock') >= 0 ? r[ix('stock')] : null, low: ix('low_stock_at') >= 0 ? r[ix('low_stock_at')] : null, demo: false }, out.length)); });
    return { ok: true, products: out, skipped };
  }
  function salesToCsv(sales) {
    return toCsv([['no', 'time_iso', 'method', 'subtotal', 'discount', 'tax', 'total', 'type', 'demo']].concat(sales.map((s) => [s.no, new Date(s.ts).toISOString(), s.method, s.subtotal, s.discountAmt, s.tax, s.total, s.total < 0 ? 'refund' : 'sale', s.demo ? 'demo' : ''])));
  }
  function receiptText(sale, shop, currency, lang) {
    const L = lang === 'en', c = currency ? ' ' + currency : '';
    return [(sale.demo ? '[DEMO] ' : '') + shop, (L ? 'Receipt #' : 'إيصال رقم ') + sale.no + (sale.total < 0 ? (L ? ' (refund)' : ' (مرتجع)') : ''), ...sale.lines.map((l) => l.qty + ' × ' + l.name + ' = ' + r2(l.qty * l.price) + c),
      sale.discountAmt ? (L ? 'Discount: ' : 'الخصم: ') + sale.discountAmt + c : '', sale.tax ? (L ? 'Tax: ' : 'الضريبة: ') + sale.tax + c : '', (L ? 'Total: ' : 'الإجمالي: ') + sale.total + c,
      (L ? 'Paid by: ' : 'طريقة الدفع: ') + (L ? sale.method : { cash: 'نقدًا', card: 'بطاقة', other: 'أخرى' }[sale.method]) + (L ? ' (recorded, not processed here)' : ' (مسجلة فقط)')].filter(Boolean).join('\n');
  }
  async function hashPin(pin) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('kashier:' + pin)); return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join(''); }
  const api = { r2, METHODS, product, totals, change, addLine, findByCode, stockIssues, makeSale, applyStock, refundOf, isRefunded, shiftSummary, dailySummary, toCsv, parseCsv, productsToCsv, productsFromCsv, salesToCsv, receiptText, hashPin };
  if (typeof module === 'object' && module.exports) module.exports = api; else root.KashCore = api;
})(globalThis);

const test = require('node:test'), assert = require('node:assert/strict');
const K = require('../core.js');
const L = [{ pid: 'a', name: 'A', price: 10, qty: 2 }, { pid: 'b', name: 'B', price: 5.5, qty: 1 }];
test('totals: subtotal, amount and percent discount, tax after discount, rounding', () => {
  assert.deepEqual(K.totals(L, null, 0), { subtotal: 25.5, discount: 0, taxable: 25.5, tax: 0, total: 25.5, rate: 0 });
  assert.equal(K.totals(L, { type: 'amount', value: 5 }, 0).total, 20.5); assert.equal(K.totals(L, { type: 'percent', value: 10 }, 0).discount, 2.55);
  const t = K.totals(L, { type: 'percent', value: 10 }, 14); assert.equal(t.taxable, 22.95); assert.equal(t.tax, 3.21); assert.equal(t.total, 26.16);
});
test('discount cannot exceed subtotal or go negative; tax rate clamped', () => {
  assert.equal(K.totals(L, { type: 'amount', value: 999 }, 0).total, 0); assert.equal(K.totals(L, { type: 'amount', value: -5 }, 0).total, 25.5); assert.equal(K.totals(L, { type: 'percent', value: 500 }, 0).total, 0); assert.equal(K.totals(L, null, 500).rate, 100);
});
test('default tax rate is zero in the shipped settings (no assumed rate)', () => {
  const src = require('fs').readFileSync(require('path').join(__dirname, '../app.js'), 'utf8'); assert.match(src, /taxRate: 0/);
});
test('change due', () => { assert.equal(K.change(20.5, 50), 29.5); assert.equal(K.change(20.5, 10), null); assert.equal(K.change(20, 'x'), null); });
test('cart add, decrement and remove at zero', () => {
  const p = { id: 'a', name: 'A', price: 10 }; let c = K.addLine([], p, 1); c = K.addLine(c, p, 1); assert.equal(c[0].qty, 2); c = K.addLine(c, p, -1); c = K.addLine(c, p, -1); assert.equal(c.length, 0);
});
test('barcode lookup by code or id, case-insensitive, empty is null', () => {
  const ps = [K.product({ id: 'x1', name: 'X', price: 1, code: 'ABC123' }, 0)]; assert.equal(K.findByCode(ps, 'abc123').id, 'x1'); assert.equal(K.findByCode(ps, 'X1').id, 'x1'); assert.equal(K.findByCode(ps, ''), null); assert.equal(K.findByCode(ps, 'nope'), null);
});
test('sale, stock decrement, full refund restores stock and cannot refund twice', () => {
  const ps = [K.product({ id: 'a', name: 'A', price: 10, stock: 5 }, 0), K.product({ id: 'b', name: 'B', price: 5, stock: null }, 1)];
  assert.deepEqual(K.stockIssues(ps, [{ pid: 'a', qty: 6 }]), ['a']);
  const s = K.makeSale({ id: 's1', no: 1, ts: 1, lines: L, discount: null, taxRate: 0, method: 'cash', tendered: 30 }); assert.equal(s.change, 4.5);
  const after = K.applyStock(ps, s); assert.equal(after[0].stock, 3); assert.equal(after[1].stock, null);
  const r = K.refundOf(s, 'r1', 2, 2); assert.equal(r.total, -25.5); assert.equal(K.applyStock(after, r)[0].stock, 5); assert.equal(K.refundOf(r, 'r2', 3, 3), null);
  assert.equal(K.isRefunded([s, r], 's1'), true);
});
test('card and other sales carry no tendered cash or change', () => { const s = K.makeSale({ id: 's', no: 1, ts: 1, lines: L, method: 'card', tendered: 100 }); assert.equal(s.tendered, null); assert.equal(s.change, null); assert.equal(K.makeSale({ id: 's', no: 1, ts: 1, lines: L, method: 'bitcoin' }).method, 'cash'); });
test('shift summary uses recorded sales only; cash difference is counted minus expected', () => {
  const sh = { id: 'sh', openFloat: 100, counted: 160 }; const a = K.makeSale({ id: 'a', no: 1, ts: 1, shift: 'sh', lines: [{ pid: 'a', name: 'A', price: 50, qty: 1 }], method: 'cash' });
  const b = K.makeSale({ id: 'b', no: 2, ts: 2, shift: 'sh', lines: [{ pid: 'a', name: 'A', price: 30, qty: 1 }], method: 'card' }); const o = K.makeSale({ id: 'o', no: 3, ts: 3, shift: 'other', lines: [{ pid: 'a', name: 'A', price: 999, qty: 1 }], method: 'cash' });
  const r = K.refundOf(a, 'r', 4, 4, 'sh'); const s = K.shiftSummary(sh, [a, b, o]); assert.equal(s.net, 80); assert.equal(s.expectedCash, 150); assert.equal(s.difference, 10); assert.equal(s.sales, 2);
  assert.equal(K.shiftSummary(sh, [a, b, o, r]).expectedCash, 100); assert.equal(K.shiftSummary({ id: 'z', openFloat: 0 }, []).net, 0); assert.equal(K.shiftSummary({ id: 'z', openFloat: 0 }, []).difference, null);
});
test('daily summary has no invented numbers on empty input', () => { assert.deepEqual(K.dailySummary([], 0, 10), { sales: 0, refunds: 0, net: 0 }); });
test('CSV round trip with quotes, commas, Arabic and formula guard', () => {
  const ps = [K.product({ id: 'a', name: 'قهوة, "كبيرة"', price: 12.5, cat: 'مشروبات', code: '=1+1', stock: 4 }, 0)]; const csv = K.productsToCsv(ps); assert.ok(csv.includes("'=1+1"));
  const r = K.productsFromCsv(csv, []); assert.ok(r.ok); assert.equal(r.products[0].name, 'قهوة, "كبيرة"'); assert.equal(r.products[0].price, 12.5); assert.equal(r.products[0].code, '=1+1'); assert.equal(r.products[0].stock, 4);
});
test('CSV import rejects bad header and skips bad rows', () => {
  assert.equal(K.productsFromCsv('a,b\n1,2', []).ok, false); const r = K.productsFromCsv('name,price\nok,5\n,3\nbad,x\nneg,-1', []); assert.equal(r.products.length, 1); assert.equal(r.skipped, 3);
});
test('sales csv marks refunds and demo', () => { const s = K.makeSale({ id: 'a', no: 1, ts: 1, lines: L, method: 'cash', demo: true }); const c = K.salesToCsv([s, K.refundOf(s, 'r', 2, 2)]); assert.match(c, /refund/); assert.match(c, /demo/); });
test('receipt text marks demo, refund and that payment is not processed', () => { const s = K.makeSale({ id: 'a', no: 7, ts: 1, lines: L, method: 'card', demo: true }); const t = K.receiptText(s, 'Shop', 'EGP', 'en'); assert.match(t, /\[DEMO\]/); assert.match(t, /Receipt #7/); assert.match(t, /not processed/); assert.match(K.receiptText(K.refundOf(s, 'r', 8, 2), 'S', '', 'ar'), /مرتجع/); });
test('pin hash is stable and not the pin', async () => { const h = await K.hashPin('1234'); assert.equal(h, await K.hashPin('1234')); assert.notEqual(h, await K.hashPin('1235')); assert.ok(!h.includes('1234')); });

const test = require('node:test'), assert = require('node:assert/strict');
const K = require('../js/core.js'), I = require('../js/i18n.js');

test('toMinor parses typed amounts', () => {
  assert.equal(K.toMinor('12.5', 2), 1250);
  assert.equal(K.toMinor('12,50', 2), 1250);
  assert.equal(K.toMinor('١٢٫٥', 2), 1250);
  assert.equal(K.toMinor('0.29', 2), 29);
  assert.equal(K.toMinor('1.005', 2), 101);
  assert.equal(K.toMinor('500', 0), 500);
  assert.ok(isNaN(K.toMinor('', 2)));
  assert.ok(isNaN(K.toMinor('abc', 2)));
  assert.ok(isNaN(K.toMinor('-3', 2)));
  assert.ok(isNaN(K.toMinor('1.2.3', 2)));
});

test('fmtMoney groups, positions currency, supports Arabic digits', () => {
  const c = { decimals: 2, currency: 'EGP', currencyPos: 'after' };
  assert.equal(K.fmtMoney(123456, c), '1,234.56 EGP');
  assert.equal(K.fmtMoney(5, c), '0.05 EGP');
  assert.equal(K.fmtMoney(100000000, { ...c, currencyPos: 'before', currency: '$' }), '$ 1,000,000.00');
  assert.equal(K.fmtMoney(1050, { decimals: 0, currency: '', currencyPos: 'after' }), '1,050');
  assert.equal(K.fmtMoney(1250, { ...c, arabicDigits: true }), '١٢٫٥٠ EGP');
  assert.equal(K.fmtMoney(-250, c), '-2.50 EGP');
});

test('computeCart: exclusive tax, inclusive tax, discounts', () => {
  const items = [{ price: 1000, qty: 3 }];
  assert.deepEqual(K.computeCart(items, { taxRate: 14, discount: { type: 'percent', value: 10 } }), { subtotal: 3000, discount: 300, tax: 378, total: 3078, count: 3 });
  const inc = K.computeCart([{ price: 11400, qty: 1 }], { taxRate: 14, taxInclusive: true });
  assert.equal(inc.total, 11400); assert.equal(inc.tax, 1400);
  assert.equal(K.computeCart(items, { discount: { type: 'fixed', value: 99999 } }).total, 0, 'fixed discount cannot exceed subtotal');
  assert.equal(K.computeCart(items, { discount: { type: 'percent', value: 500 } }).total, 0, 'percent capped at 100');
  assert.equal(K.computeCart([], {}).total, 0);
  const frac = K.computeCart([{ price: 333, qty: 3 }, { price: 1, qty: 1 }], { taxRate: 14 });
  assert.equal(frac.subtotal, 1000); assert.equal(frac.tax, 140); assert.equal(frac.total, 1140);
});

test('changeDue', () => { assert.equal(K.changeDue(1000, 2000), 1000); assert.equal(K.changeDue(1000, 500), 0); });

test('receiptNo pads', () => assert.equal(K.receiptNo('R-', 42), 'R-00042'));

test('dailyTotals ignores voided and other days, ranks best sellers', () => {
  const d = (s) => new Date(s).getTime();
  const mk = (ts, total, method, lines, extra = {}) => ({ ts, total, tax: 0, discount: 0, count: lines.reduce((a, l) => a + l.qty, 0), method, lines, ...extra });
  const sales = [
    mk(d('2026-03-10T09:00:00'), 3000, 'cash', [{ name: 'Tea', price: 1000, qty: 3 }]),
    mk(d('2026-03-10T10:00:00'), 5000, 'card', [{ name: 'Cake', price: 5000, qty: 1 }], { tax: 500 }),
    mk(d('2026-03-10T11:00:00'), 9999, 'cash', [{ name: 'Tea', price: 1000, qty: 1 }], { voided: true }),
    mk(d('2026-03-11T09:00:00'), 7000, 'cash', [{ name: 'Tea', price: 1000, qty: 1 }])
  ];
  const r = K.dailyTotals(sales, '2026-03-10');
  assert.equal(r.count, 2); assert.equal(r.voided, 1); assert.equal(r.gross, 8000); assert.equal(r.tax, 500); assert.equal(r.net, 7500);
  assert.equal(r.byMethod.cash, 3000); assert.equal(r.byMethod.card, 5000); assert.equal(r.avg, 4000);
  assert.equal(r.top[0].name, 'Tea'); assert.equal(r.top[0].qty, 3);
  assert.equal(K.lastDays(sales, '2026-03-11', 2).map(x => x.total).join(), '8000,7000');
});

test('colours: ink picks readable text, contrast ratio sane', () => {
  assert.equal(K.inkOn('#000000'), '#ffffff');
  assert.equal(K.inkOn('#ffffff'), '#14110f');
  assert.equal(K.inkOn('#f59e0b'), '#14110f');
  assert.ok(K.contrastRatio('#000000', '#ffffff') > 20);
  for (const c of ['#0f766e', '#1d4ed8', '#be123c', '#facc15', '#777777']) assert.ok(K.contrastRatio(c, K.inkOn(c)) >= 4.4, c);
  assert.equal(K.mix('#000000', '#ffffff', 0.5), '#808080');
});

test('sanitizeBrand drops bad values and keeps good ones', () => {
  const b = K.sanitizeBrand({ shopName: '  ', primary: 'red', accent: '#ABCDEF', currencyPos: 'before', decimals: 9, taxRate: 500, language: 'fr', logo: 'javascript:alert(1)', evil: 1, paymentMethods: ['bitcoin'] });
  assert.equal(b.shopName, 'My Shop'); assert.equal(b.primary, '#0f766e'); assert.equal(b.accent, '#abcdef'); assert.equal(b.currencyPos, 'before');
  assert.equal(b.decimals, 2); assert.equal(b.taxRate, 0); assert.equal(b.language, 'en'); assert.equal(b.logo, ''); assert.equal(b.evil, undefined);
  assert.deepEqual(b.paymentMethods, ['cash', 'card', 'other']);
  const ok = K.sanitizeBrand({ logo: 'data:image/png;base64,iVBORw0KGgo=', paymentMethods: ['card', 'card', 'cash'] });
  assert.equal(ok.logo, 'data:image/png;base64,iVBORw0KGgo='); assert.deepEqual(ok.paymentMethods, ['card', 'cash']);
  assert.equal(K.sanitizeBrand(null).shopName, 'My Shop');
  assert.equal(K.sanitizeBrand({ logo: 'data:image/svg+xml;base64,PHN2Zz4=' }).logo.startsWith('data:image/svg'), true);
  assert.equal(K.sanitizeBrand({ logo: 'data:text/html;base64,PGI+' }).logo, '');
});

test('brand round trip through JSON is lossless', () => {
  const b = K.sanitizeBrand({ shopName: 'متجر النور', tagline: 'كل ما تحتاجه', primary: '#1d4ed8', accent: '#facc15', currency: 'ج.م', language: 'ar', taxRate: 14, taxInclusive: true, receiptPrefix: 'N-', arabicDigits: true });
  assert.deepEqual(K.sanitizeBrand(JSON.parse(JSON.stringify(b))), b);
});

test('CSV parse handles quotes, commas, newlines, BOM', () => {
  const rows = K.parseCSV('\uFEFFa,b\r\n"x, y","he said ""hi"""\n"line\nbreak",3\n');
  assert.deepEqual(rows, [['a', 'b'], ['x, y', 'he said "hi"'], ['line\nbreak', '3']]);
});

test('products CSV round trip + validation + formula guard', () => {
  const ps = [{ name: 'Tea, hot', price: 1050, category: 'Drinks', sku: '1', stock: 5 }, { name: '=SUM(A1)', price: 100, category: '', sku: '', stock: null }];
  const csv = K.productsToCSV(ps, 2);
  assert.ok(csv.includes("'=SUM(A1)"));
  const back = K.productsFromCSV(csv, 2);
  assert.equal(back.errors.length, 0);
  assert.equal(back.products[0].name, 'Tea, hot'); assert.equal(back.products[0].price, 1050); assert.equal(back.products[0].stock, 5);
  assert.equal(back.products[1].name, '=SUM(A1)'); assert.equal(back.products[1].stock, null);
  const bad = K.productsFromCSV('name,price,stock\nok,5,\n,5,\nx,abc,\ny,1,-2\n', 2);
  assert.equal(bad.products.length, 1); assert.deepEqual(bad.errors.map(e => e.reason), ['name', 'price', 'stock']);
  assert.equal(K.productsFromCSV('foo,bar\n1,2', 2).errors[0].reason, 'header');
});

test('salesToCSV marks void', () => {
  const csv = K.salesToCSV([{ no: 'R-00001', ts: new Date('2026-03-10T09:05:00').getTime(), count: 2, subtotal: 2000, discount: 0, tax: 280, total: 2280, method: 'cash', voided: true }], 2);
  assert.ok(csv.split('\r\n')[1].startsWith('R-00001,2026-03-10,09:05,2,20.00,0.00,2.80,22.80,cash,void'));
});

test('stock apply, reverse, and problem detection', () => {
  const ps = [{ id: 'a', stock: 5 }, { id: 'b', stock: null }];
  assert.deepEqual(K.stockProblem(ps, [{ id: 'a', qty: 6 }]), { name: undefined, stock: 5 });
  assert.equal(K.stockProblem(ps, [{ id: 'a', qty: 5 }, { id: 'b', qty: 99 }]), null);
  K.applyStock(ps, [{ id: 'a', qty: 3 }, { id: 'b', qty: 3 }], -1);
  assert.equal(ps[0].stock, 2); assert.equal(ps[1].stock, null);
  K.applyStock(ps, [{ id: 'a', qty: 3 }], 1); assert.equal(ps[0].stock, 5);
});

test('normalizeState repairs garbage and keeps valid data', () => {
  assert.equal(K.normalizeState(null), null);
  const s = K.normalizeState({
    products: [{ id: 'a', name: 'Tea', price: 100, stock: 3, color: 'nope' }, { id: 'a', name: 'dup', price: 1 }, { id: 'b', name: '', price: 1 }, { id: 'c', name: 'Neg', price: -5 }],
    sales: [{ no: 'R-1', ts: 1, lines: [{ name: 'Tea', price: 100, qty: 1 }], total: 100, method: 'weird' }, { no: 5 }],
    cart: [{ id: 'a', qty: 2 }, { id: 'x', qty: 0 }], disc: { type: 'bogus', value: 5 }
  });
  assert.equal(s.products.length, 1); assert.equal(s.products[0].color, '#0f766e');
  assert.equal(s.sales.length, 1); assert.equal(s.sales[0].method, 'other');
  assert.deepEqual(s.cart, [{ id: 'a', qty: 2 }]); assert.deepEqual(s.disc, { type: 'percent', value: 0 });
});

test('i18n: Arabic and English have identical keys, no empty values, placeholders match', () => {
  const en = I.T.en, ar = I.T.ar;
  assert.deepEqual(Object.keys(en).sort(), Object.keys(ar).sort());
  for (const k of Object.keys(en)) {
    assert.ok(en[k] && ar[k], k);
    const ph = (s) => (s.match(/\{\w+\}/g) || []).sort().join();
    assert.equal(ph(en[k]), ph(ar[k]), 'placeholders ' + k);
  }
  assert.equal(I.make('ar')('imported', { n: 3 }), 'تم استيراد 3 منتج');
  assert.equal(I.make('en')('nope_key'), 'nope_key');
});

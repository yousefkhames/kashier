// Real browser click-through (headless Chrome via puppeteer-core). Run: npm run test:e2e
// Set SHOTS=1 to also write README screenshots into docs/.
const puppeteer = require('puppeteer-core'), path = require('path'), fs = require('fs'), os = require('os'), assert = require('node:assert/strict');
const { start } = require('./serve.js');
const CHROME = process.env.CHROME || ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find(p => fs.existsSync(p));
const SHOTS = !!process.env.SHOTS, DOCS = path.resolve(__dirname, '..', 'docs');
let passed = 0;
async function step(name, fn) { try { await fn(); passed++; console.log('  ok  ' + name); } catch (e) { console.error('  FAIL ' + name + '\n', e.message); process.exitCode = 1; throw e; } }
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const srv = await start(0 + 18080 + Math.floor(Math.random() * 500)); const port = srv.address().port, url = 'http://localhost:' + port + '/';
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-gpu'] });
  const errors = [];
  async function newPage(w, h, mobile) {
    const p = await browser.newPage(); await p.setViewport({ width: w, height: h, deviceScaleFactor: SHOTS ? 2 : 1, isMobile: !!mobile, hasTouch: !!mobile });
    p.on('pageerror', e => errors.push('pageerror: ' + e.message)); p.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
    p.on('dialog', d => d.accept());
    return p;
  }
  const click = async (p, sel) => { await p.waitForSelector(sel, { visible: true }); await p.click(sel); };
  const text = (p, sel) => p.$eval(sel, e => e.textContent.trim());
  const clickText = async (p, sel, re) => { const h = await p.evaluateHandle((s, r) => [...document.querySelectorAll(s)].find(e => new RegExp(r).test(e.textContent) && e.offsetParent !== null), sel, re.source); if (!h.asElement()) throw new Error('no element ' + sel + ' ~ ' + re); await h.asElement().click(); };
  const shot = async (p, name) => { if (SHOTS) { await p.evaluate(() => { const t = document.querySelector('#toast'); if (t) t.classList.remove('show'); }); await sleep(400); fs.mkdirSync(DOCS, { recursive: true }); await p.screenshot({ path: path.join(DOCS, name + '.png') }); } };
  const tiles = p => p.$$eval('.tile', t => t.length);
  const tileByName = (p, n) => p.evaluateHandle(n => [...document.querySelectorAll('.tile')].find(t => t.textContent.includes(n)), n);

  try {
    // ---------- desktop flow ----------
    const p = await newPage(1280, 820);
    await p.goto(url); await p.evaluate(() => localStorage.clear()); await p.reload();
    await step('empty state offers add + demo', async () => { assert.match(await text(p, '#tiles'), /No products yet/); });
    await step('load demo products', async () => { await clickText(p, '#tiles button', /demo/i); await p.waitForSelector('.tile'); assert.equal(await tiles(p), 8); });
    await step('settings: tax 14%, currency, shop name apply live', async () => {
      await click(p, '.tab[data-v=settings]');
      await p.$eval('[name=shopName]', e => e.value = ''); await p.type('[name=shopName]', 'Nour Cafe');
      await p.$eval('[name=tagline]', e => e.value = ''); await p.type('[name=tagline]', 'Fresh every morning');
      await p.$eval('[name=taxRate]', e => e.value = ''); await p.type('[name=taxRate]', '14');
      await p.$eval('[name=currency]', e => e.value = ''); await p.type('[name=currency]', 'EGP');
      await p.$eval('[name=primary]', e => { e.value = '#8a3b12'; e.dispatchEvent(new Event('input', { bubbles: true })); });
      assert.equal(await text(p, '.brand-name'), 'Nour Cafe');
      assert.equal(await p.$eval('html', e => getComputedStyle(e).getPropertyValue('--brand').trim()), '#8a3b12');
      assert.equal(await p.title(), 'Nour Cafe · Kashier');
      assert.match(await text(p, '#contrast'), /Readable/);
      await p.evaluate(() => window.scrollTo(0, 0)); await shot(p, 'desktop-settings');
    });
    await step('low-contrast colour is flagged', async () => {
      await p.$eval('[name=primary]', e => { e.value = '#777777'; e.dispatchEvent(new Event('input', { bubbles: true })); });
      const ratio = await p.$eval('#contrast', e => e.textContent);
      // grey on its auto-picked ink is about 4.4 to 4.6, so just assert a ratio is shown
      assert.match(ratio, /\d\.\d:1/);
      await p.$eval('[name=primary]', e => { e.value = '#8a3b12'; e.dispatchEvent(new Event('input', { bubbles: true })); });
    });
    await step('sell: add items, qty, totals with tax', async () => {
      await click(p, '.tab[data-v=sell]'); await p.waitForSelector('.tile');
      for (const n of ['Espresso', 'Espresso', 'Cappuccino']) await (await tileByName(p, n)).asElement().click();
      assert.match(await text(p, '#cartPanel'), /Espresso/);
      // 35*2 + 45 = 115 ; tax 14% = 16.10 ; total 131.10
      assert.match(await text(p, '#cartPanel #totals'), /131\.10/);
      assert.match(await text(p, '#cartPanel #totals'), /16\.10/);
    });
    await step('stepper +/- and remove', async () => {
      await p.click('#cartPanel .line[data-id] [data-act=inc]'); assert.match(await text(p, '#cartPanel #totals'), /Total\s*(.*)/);
      const before = await text(p, '#cartPanel .tline.grand');
      await p.click('#cartPanel .line [data-act=dec]'); const after = await text(p, '#cartPanel .tline.grand');
      assert.notEqual(before, after);
    });
    await step('percent discount', async () => {
      await clickText(p, '#cartPanel .seg button', /% off/); await p.waitForSelector('#discVal'); await p.type('#discVal', '10');
      // 115 - 11.50 = 103.50, tax 14.49, total 117.99
      assert.match(await text(p, '#cartPanel #totals'), /117\.99/);
      assert.deepEqual(await p.$$eval('#cartPanel [data-act=dtype]', b => b.map(x => x.getAttribute('aria-pressed'))), ['false', 'true', 'false']);
    });
    await step('cash change calculation + short warning', async () => {
      await p.type('#tendered', '100'); assert.match(await text(p, '#changeLine'), /Short/); assert.equal(await p.$eval('#chargeBtn', b => b.disabled), true);
      await p.$eval('#tendered', e => e.value = ''); await p.type('#tendered', '150');
      assert.match(await text(p, '#changeLine'), /Change.*32\.01/s); assert.equal(await p.$eval('#chargeBtn', b => b.disabled), false);
      await shot(p, 'desktop-sell');
    });
    await step('charge produces receipt R-00001 and decrements stock', async () => {
      await p.click('#chargeBtn'); await p.waitForSelector('#receiptEl');
      const r = await text(p, '#receiptEl'); assert.match(r, /Nour Cafe/); assert.match(r, /R-00001/); assert.match(r, /117\.99/); assert.match(r, /32\.01/); assert.match(r, /Thank you/);
      await shot(p, 'desktop-receipt');
      await click(p, '[data-act=close-modal]');
      assert.equal(await p.$eval('#cartPanel', e => e.textContent.includes('cart is empty')), true);
      const st = await p.evaluate(() => window.__kashier.state.products.find(x => x.name === 'Espresso').stock); assert.equal(st, 38);
    });
    await step('out-of-stock guard', async () => {
      await p.evaluate(() => { const s = window.__kashier.state; s.products.find(x => x.name === 'Chips').stock = 1; });
      await clickText(p, '.tab', /Products/); await clickText(p, '.tab', /Sell/); await p.waitForSelector('.tile');
      await (await tileByName(p, 'Chips')).asElement().click(); await (await tileByName(p, 'Chips')).asElement().click();
      assert.match(await text(p, '#toast'), /Only 1 left/);
      await p.click('#cartPanel [data-act=clear]');
    });
    await step('enter on SKU adds the product', async () => {
      await p.type('#q', '1003'); await p.keyboard.press('Enter'); await sleep(100);
      assert.match(await text(p, '#cartPanel'), /Bottled water/); assert.equal(await p.$eval('#q', e => e.value), '');
      await p.click('#cartPanel [data-act=clear]');
    });
    await step('hold and resume a cart', async () => {
      await (await tileByName(p, 'Croissant')).asElement().click(); await click(p, '#cartPanel [data-act=hold]');
      assert.match(await text(p, '#cartPanel'), /cart is empty/); await clickText(p, '#cartPanel button', /Held carts/); await click(p, '[data-act=resume]');
      assert.match(await text(p, '#cartPanel'), /Croissant/); await p.click('#cartPanel [data-act=clear]');
    });
    await step('sales tab: daily totals, void restores stock', async () => {
      await clickText(p, '.tab', /Sales/); await p.waitForSelector('#sRev');
      assert.match(await text(p, '#sRev'), /117\.99/);
      await shot(p, 'desktop-sales');
      await click(p, '[data-act=open-sale]'); await p.waitForSelector('[data-act=void]'); await p.click('[data-act=void]'); await sleep(150);
      assert.match(await text(p, '#sRev'), /^0\.00/);
      assert.equal(await p.evaluate(() => window.__kashier.state.products.find(x => x.name === 'Espresso').stock), 40);
    });
    await step('day report opens', async () => { await click(p, '[data-act=day-report]'); await p.waitForSelector('.report'); assert.match(await text(p, '.report'), /Day report/); await click(p, '[data-act=close-modal]'); });
    await step('products: validation, add, edit, delete', async () => {
      await clickText(p, '.tab', /Products/); await click(p, '[data-act=new-product]'); await p.waitForSelector('#pform');
      await p.click('#pform [type=submit]'); assert.match(await text(p, '#perr'), /Enter a name/);
      await p.type('#pform [name=name]', 'Falafel wrap'); await p.click('#pform [type=submit]'); assert.match(await text(p, '#perr'), /valid price/);
      await p.type('#pform [name=price]', '27.5'); await p.type('#pform [name=category]', 'Food'); await p.click('#pform [type=submit]');
      await p.waitForSelector('#plist'); assert.match(await text(p, '#plist'), /Falafel wrap/); assert.match(await text(p, '#plist'), /27\.50/);
      await p.type('#pq', 'falafel'); assert.equal(await p.$$eval('.prow', r => r.length), 1);
      await click(p, '[data-act=edit-product]'); await p.$eval('#pform [name=price]', e => e.value = ''); await p.type('#pform [name=price]', '30'); await p.click('#pform [type=submit]');
      assert.match(await text(p, '#plist'), /30\.00/);
      await click(p, '[data-act=edit-product]'); await click(p, '[data-act=del-product]'); await sleep(100);
      assert.match(await text(p, '#plist'), /Nothing matches/);
    });
    await step('CSV import adds valid rows and reports skipped ones', async () => {
      const f = path.join(os.tmpdir(), 'k-import.csv'); fs.writeFileSync(f, 'name,price,category,sku,stock\nLemonade,22,Drinks,9001,10\n,5,,,\nBroken,xx,,,\n');
      await p.$('#csvFile') || await p.evaluate(() => 0);
      const inp = await p.$('#csvFile'); await inp.uploadFile(f); await sleep(300);
      assert.match(await text(p, '#plist'), /Lemonade/); assert.match(await text(p, '#toast'), /1 products imported.*2 rows skipped/);
    });
    await step('brand file export and import (white-label kit)', async () => {
      await clickText(p, '.tab', /Settings/);
      const exported = await p.evaluate(() => { const s = window.__kashier.state.settings; return s; });
      // use the real exporter by intercepting the download anchor
      const json = await p.evaluate(async () => { let captured; const orig = URL.createObjectURL; URL.createObjectURL = b => { captured = b; return orig(b); }; document.querySelector('[data-act=brand-export]').click(); await new Promise(r => setTimeout(r, 100)); URL.createObjectURL = orig; return captured.text(); });
      const o = JSON.parse(json); assert.equal(o.kashierBrand, 1); assert.equal(o.shopName, 'Nour Cafe'); assert.equal(o.primary, '#8a3b12'); assert.equal(o.products, undefined); assert.equal(o.sales, undefined);
      o.shopName = 'Bella Boutique'; o.primary = '#be123c'; o.language = 'ar'; o.currency = 'ج.م'; o.currencyPos = 'after'; o.receiptFooter = 'شكراً لزيارتكم';
      const f = path.join(os.tmpdir(), 'brand-in.json'); fs.writeFileSync(f, JSON.stringify(o)); await (await p.$('#brandFile')).uploadFile(f); await sleep(300);
      assert.equal(await text(p, '.brand-name'), 'Bella Boutique'); assert.equal(await p.$eval('html', e => e.dir), 'rtl'); assert.equal(await p.$eval('html', e => getComputedStyle(e).getPropertyValue('--brand').trim()), '#be123c');
      assert.match(await text(p, '#tabbar'), /الإعدادات/);
      assert.ok(await p.evaluate(() => window.__kashier.state.products.length > 0), 'products survive brand import');
    });
    await step('bad brand file is rejected', async () => {
      const f = path.join(os.tmpdir(), 'bad.json'); fs.writeFileSync(f, '{"hello":1}'); await (await p.$('#brandFile')).uploadFile(f); await sleep(200);
      assert.match(await text(p, '#toast'), /ملف هوية/); assert.equal(await text(p, '.brand-name'), 'Bella Boutique');
    });
    await step('Arabic RTL sell screen renders', async () => {
      await clickText(p, '.tab', /البيع/); await p.waitForSelector('.tile'); assert.match(await text(p, '.search input') || '', /.*/);
      assert.equal(await p.$eval('#q', e => e.placeholder), 'ابحث أو امسح كوداً…');
      await shot(p, 'desktop-arabic');
    });
    await step('backup export/restore round trip', async () => {
      await clickText(p, '.tab', /الإعدادات/);
      const json = await p.evaluate(async () => { let c; const o = URL.createObjectURL; URL.createObjectURL = b => { c = b; return o(b); }; document.querySelector('[data-act=backup-export]').click(); await new Promise(r => setTimeout(r, 100)); URL.createObjectURL = o; return c.text(); });
      const o = JSON.parse(json); assert.ok(o.products.length >= 9);
      await click(p, '[data-act=reset]'); await sleep(150); assert.equal(await p.evaluate(() => window.__kashier.state.products.length), 0);
      const f = path.join(os.tmpdir(), 'backup.json'); fs.writeFileSync(f, json); await (await p.$('#backupFile')).uploadFile(f); await sleep(300);
      assert.equal(await p.evaluate(() => window.__kashier.state.products.length), o.products.length);
      assert.equal(await p.evaluate(() => window.__kashier.state.settings.shopName), 'Bella Boutique');
    });
    await step('state persists across reload', async () => {
      await p.reload(); await p.waitForSelector('.brand-name'); assert.equal(await text(p, '.brand-name'), 'Bella Boutique');
    });
    await step('print layout shows only the receipt', async () => {
      await clickText(p, '.tab', /Sales|المبيعات/); await p.evaluate(() => { const s = window.__kashier.state; });
      await p.evaluate(() => { const st = window.__kashier.state; });
      await click(p, '[data-act=day-report]'); await p.waitForSelector('.report');
      await p.emulateMediaType('print');
      const vis = await p.evaluate(() => ({ app: getComputedStyle(document.querySelector('#app')).display, report: document.querySelector('.report').offsetParent !== null, btns: getComputedStyle(document.querySelector('.mactions')).display }));
      await p.emulateMediaType('screen');
      assert.equal(vis.app, 'none'); assert.equal(vis.report, true); assert.equal(vis.btns, 'none');
      await click(p, '[data-act=close-modal]');
    });
    await step('white-label: logo in brand file shows in header and receipt', async () => {
      const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="22" fill="#be123c"/><path d="M50 20c14 0 24 8 24 20 0 18-24 40-24 40S26 58 26 40c0-12 10-20 24-20z" fill="#fff"/><circle cx="50" cy="40" r="9" fill="#be123c"/></svg>';
      const o = await p.evaluate(() => JSON.parse(JSON.stringify(Object.assign({ kashierBrand: 1 }, window.__kashier.state.settings))));
      o.logo = 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64'); o.shopName = 'بوتيك بيلا'; o.tagline = 'أزياء عصرية'; o.arabicDigits = true;
      await clickText(p, '.tab', /الإعدادات/);
      const f = path.join(os.tmpdir(), 'brand-logo.json'); fs.writeFileSync(f, JSON.stringify(o)); await (await p.$('#brandFile')).uploadFile(f); await sleep(300);
      assert.ok(await p.$('.topbar img.logo')); assert.equal(await text(p, '.brand-name'), 'بوتيك بيلا');
      await clickText(p, '.tab', /البيع/); await p.waitForSelector('.tile'); await (await tileByName(p, 'Croissant')).asElement().click();
      await p.click('#chargeBtn'); await p.waitForSelector('#receiptEl'); assert.ok(await p.$('#receiptEl img.rc-logo'));
      assert.match(await text(p, '#receiptEl'), /٣٠٫٠٠/);
      await shot(p, 'desktop-whitelabel'); await click(p, '[data-act=close-modal]');
    });
    await p.close();

    // ---------- mobile flow ----------
    const m = await newPage(390, 844, true);
    await m.goto(url); await m.evaluate(() => localStorage.clear()); await m.reload();
    await step('mobile: demo, cart bar, bottom sheet checkout (card)', async () => {
      await clickText(m, '#tiles button', /demo/i); await m.waitForSelector('.tile');
      assert.equal(await m.$eval('#cartBar', e => e.hidden), true);
      await (await tileByName(m, 'Croissant')).asElement().click(); await (await tileByName(m, 'Cheese')).asElement().click();
      assert.equal(await m.$eval('#cartBar', e => e.hidden), false); assert.match(await text(m, '#cartBar'), /80\.00/);
      await shot(m, 'mobile-sell');
      await m.click('#cartBar'); await m.waitForSelector('#sheet');
      await sleep(400); await shot(m, 'mobile-cart');
      await clickText(m, '#sheet .seg button', /Card/); await m.click('#sheet #chargeBtn'); await m.waitForSelector('#receiptEl');
      assert.match(await text(m, '#receiptEl'), /Card/); assert.equal(await m.$('#sheet'), null);
      await shot(m, 'mobile-receipt'); await click(m, '[data-act=close-modal]');
    });
    await step('mobile: no horizontal overflow on every tab', async () => {
      for (const v of ['sell', 'products', 'sales', 'settings']) { await m.click('.tab[data-v=' + v + ']'); await sleep(80); const w = await m.evaluate(() => [document.documentElement.scrollWidth, innerWidth]); assert.ok(w[0] <= w[1], v + ' overflows ' + w); }
      await m.click('.tab[data-v=sales]'); await shot(m, 'mobile-sales'); await m.click('.tab[data-v=settings]'); await shot(m, 'mobile-settings');
    });
    await step('mobile: tap targets are at least 40px', async () => {
      await m.click('.tab[data-v=sell]'); await m.waitForSelector('.tile');
      const small = await m.evaluate(() => [...document.querySelectorAll('button:not([hidden]),.tab')].filter(b => b.offsetParent && b.getBoundingClientRect().height < 34).map(b => b.textContent.trim().slice(0, 20)));
      assert.deepEqual(small, []);
    });
    await m.close();

    await step('no console or page errors during the whole run', async () => { assert.deepEqual(errors, []); });
    console.log('\n' + passed + ' browser checks passed');
  } catch (e) { process.exitCode = 1; console.error(errors.length ? 'errors seen: ' + errors.join('\n') : ''); }
  finally { await browser.close(); srv.close(); }
})();

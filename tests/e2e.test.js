const assert = require('node:assert/strict'), { serve, launch } = require('./cdp.js');
(async () => {
  const srv = await serve(8131); const b = await launch(); let fail = 0;
  const step = async (n, f) => { try { await f(); console.log('ok  ' + n); } catch (e) { fail++; console.log('FAIL ' + n + ' ' + e.message); } };
  try {
    await b.goto('http://127.0.0.1:8131/');
    await step('demo banner, demo tags, byline, no sales invented', async () => { const t = await b.text(); assert.match(t, /وضع تجريبي/); assert.match(t, /من تطوير يوسف خميس/); assert.ok(await b.eval("document.querySelectorAll('.ptile .badge.demo').length >= 5")); assert.ok(!/اليوم/.test(t)); });
    await step('barcode input: unknown code toasts, no crash', async () => { await b.eval("(()=>{const i=document.querySelector('#barcode');i.value='zzz';i.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter'}))})()"); await b.waitFor("document.querySelector('#toast.on')"); });
    await step('add items, discount, cash change', async () => {
      await b.click('.ptile'); await b.click('.ptile'); await b.waitFor("document.querySelector('#complete')"); assert.equal(await b.eval("document.querySelector('#grand').textContent"), '80 ج.م');
      await b.eval("(()=>{const s=document.querySelector('#dtype');s.value='percent';s.dispatchEvent(new Event('change'))})()"); await b.waitFor("document.querySelector('#dval')"); await b.type('#dval', '10'); await b.waitFor("document.querySelector('#grand').textContent==='72 ج.م'");
      await b.type('#tendered', '100'); assert.match(await b.eval("document.querySelector('#change').textContent"), /28/);
    });
    await step('complete sale: receipt marked demo, sale numbered 1', async () => { await b.click('#complete'); await b.waitFor("document.querySelector('#receipt-text')"); const t = await b.eval("document.querySelector('#receipt-text').textContent"); assert.match(t, /\[DEMO\]/); assert.match(t, /رقم 1/); await b.click('#new-sale'); });
    await step('stock: low-stock product flagged and decrements', async () => { await b.click('.ptile', 'بسكويت'); await b.click('.ptile', 'بسكويت'); await b.click('#complete'); await b.waitFor("document.querySelector('#receipt-text')"); await b.click('#new-sale'); await b.eval("location.hash='#/products'"); await b.waitFor("document.querySelector('[data-pid=d4]')"); assert.match(await b.eval("document.querySelector('[data-pid=d4]').textContent"), /1/); });
    await step('shift: open with float, close with count shows difference', async () => {
      await b.eval("location.hash='#/shift'"); await b.waitFor("document.querySelector('#open-shift')"); await b.type('#float', '100'); await b.click('#open-shift'); await b.waitFor("document.querySelector('#close-shift')");
      await b.eval("location.hash='#/'"); await b.waitFor("document.querySelector('.ptile')"); await b.click('.ptile'); await b.type('#tendered', '50'); await b.click('#complete'); await b.waitFor("document.querySelector('#receipt-text')"); await b.click('#new-sale');
      await b.eval("location.hash='#/shift'"); await b.waitFor("document.querySelector('#counted')"); await b.type('#counted', '140'); await b.click('#close-shift'); await b.waitFor("document.querySelector('details')");
      await b.eval("document.querySelector('details').open=true"); assert.match(await b.text(), /الفرق: 0/);
    });
    await step('refund restores and marks the sale refunded', async () => { await b.eval("location.hash='#/sales'"); await b.waitFor("document.querySelector('.refund')"); await b.click('.refund'); await b.waitFor("document.body.innerText.includes('تم الإرجاع')"); });
    await step('settings: PIN gate locks owner area, wrong PIN refused, right PIN opens', async () => {
      await b.eval("location.hash='#/settings'"); await b.waitFor("document.querySelector('#s-pin')"); await b.type('#s-pin', '4321'); await b.click('#s-save'); await b.eval("location.hash='#/sales'"); await b.waitFor("document.querySelector('#unlock')");
      await b.type('#pin', '0000'); await b.click('#unlock'); assert.ok(await b.eval("!!document.querySelector('#unlock')")); await b.type('#pin', '4321'); await b.click('#unlock'); await b.waitFor("!document.querySelector('#unlock')");
    });
    await step('clear demo removes demo products and sales', async () => { await b.eval("location.hash='#/settings'"); await b.waitFor("document.querySelector('#clear-demo')"); await b.click('#clear-demo'); await b.waitFor("!document.querySelector('#clear-demo')"); await b.eval("location.hash='#/'"); await b.waitFor("document.body.innerText.length>0"); assert.ok(await b.eval("document.querySelectorAll('.ptile').length===0")); });
    await step('no script errors', async () => assert.deepEqual(b.logs, []));
    await b.eval("localStorage.clear();location.hash='#/';location.reload()"); await new Promise((r) => setTimeout(r, 900)); await b.viewport(1100, 800, false); await b.waitFor("document.querySelector('.ptile')"); await b.click('.ptile'); await b.click('.ptile', 'ساندوتش'); await b.shot('/tmp/kashier-sell.png');
  } finally { await b.close(); srv.close(); }
  process.exit(fail ? 1 : 0);
})();

/* MIT · Copyright (c) 2026 Yousef Khames · UI strings as [Arabic, English]. */
(function (root) {
  'use strict';
  Object.assign(root.Kit.dict, {
    title: ['كاشير', 'kashier'], sell: ['البيع', 'Sell'], products: ['المنتجات', 'Products'], shift: ['الوردية', 'Shift'], sales: ['المبيعات', 'Sales'], settings: ['الإعدادات', 'Settings'], lang: ['EN', 'عربي'],
    demoBanner: ['وضع تجريبي: المنتجات عينات وهمية والمبيعات المسجلة هنا تجريبية.', 'Demo mode: products are fictional samples and sales recorded here are demo.'], demoTag: ['تجريبي', 'Demo'],
    search: ['ابحث عن منتج', 'Search products'], barcode: ['باركود أو كود المنتج ثم Enter', 'Barcode or product code, then Enter'], notFound: ['الكود غير موجود', 'Code not found'], all: ['الكل', 'All'],
    cart: ['الفاتورة', 'Cart'], cartEmpty: ['الفاتورة فارغة.', 'The cart is empty.'], subtotal: ['المجموع', 'Subtotal'], discount: ['الخصم', 'Discount'], tax: ['الضريبة', 'Tax'], total: ['الإجمالي', 'Total'],
    dNone: ['بدون خصم', 'No discount'], dAmount: ['مبلغ', 'Amount'], dPercent: ['نسبة %', 'Percent %'], method: ['طريقة الدفع (تسجيل فقط)', 'Payment type (label only)'],
    m_cash: ['نقدًا', 'Cash'], m_card: ['بطاقة', 'Card'], m_other: ['أخرى', 'Other'], noProcessing: ['لا تتم معالجة أي دفع هنا. سجّل ما استلمته فقط.', 'No payment is processed here. Record what you received.'],
    tendered: ['المبلغ المستلم', 'Cash received'], changeDue: ['الباقي للعميل', 'Change due'], short: ['المبلغ أقل من الإجمالي', 'Amount is below the total'],
    complete: ['إتمام البيع', 'Complete sale'], clearCart: ['فرّغ الفاتورة', 'Clear cart'], stockWarn: ['الكمية أكبر من المخزون المسجل. المتابعة؟', 'Quantity exceeds recorded stock. Continue?'],
    saleDone: ['تم تسجيل البيع رقم {n}', 'Sale {n} recorded'], receipt: ['الإيصال', 'Receipt'], print: ['طباعة', 'Print'], copy: ['نسخ', 'Copy'], copied: ['تم النسخ', 'Copied'], newSale: ['بيع جديد', 'New sale'],
    custPhone: ['رقم العميل لإرسال الإيصال (اختياري)', 'Customer number for the receipt (optional)'], sendWa: ['جهّز الإيصال في واتساب', 'Prepare receipt in WhatsApp'], waNote: ['يفتح مسودة فقط. اضغط إرسال بنفسك.', 'Opens a draft only. Press send yourself.'],
    noShift: ['لا توجد وردية مفتوحة. المبيعات تُسجل بدون وردية.', 'No open shift. Sales are recorded without a shift.'], openShift: ['فتح وردية', 'Open shift'], inShift: ['وردية مفتوحة منذ {t}', 'Shift open since {t}'],
    pinTitle: ['منطقة المالك', 'Owner area'], pinPrompt: ['أدخل الرمز', 'Enter PIN'], pinWrong: ['رمز غير صحيح', 'Wrong PIN'], unlock: ['فتح', 'Unlock'], pinNote: ['الرمز وسيلة راحة فقط وليس حماية حقيقية: أي شخص يستطيع فتح بيانات المتصفح.', 'The PIN is a convenience only, not real security: anyone can open the browser data.'],
    addProduct: ['إضافة منتج', 'Add product'], editProduct: ['تعديل المنتج', 'Edit product'], name: ['الاسم', 'Name'], price: ['السعر', 'Price'], category: ['القسم', 'Category'], code: ['الباركود / الكود', 'Barcode / code'],
    stock: ['المخزون (اتركه فارغًا لعدم التتبع)', 'Stock (leave empty to not track)'], lowAt: ['تنبيه عند (اختياري)', 'Low-stock alert at (optional)'], inStock: ['{n} في المخزون', '{n} in stock'], lowFlag: ['مخزون منخفض', 'Low stock'], outFlag: ['نفد', 'Out'],
    save: ['حفظ', 'Save'], cancel: ['إلغاء', 'Cancel'], del: ['حذف', 'Delete'], confirm: ['متابعة؟', 'Continue?'], needName: ['اكتب الاسم', 'Enter a name'], savedMsg: ['تم الحفظ', 'Saved'],
    exportProducts: ['تصدير المنتجات CSV', 'Export products CSV'], importProducts: ['استيراد منتجات CSV', 'Import products CSV'], csvHelp: ['الأعمدة: name, price, category, code, stock, low_stock_at', 'Columns: name, price, category, code, stock, low_stock_at'],
    csvBad: ['ملف CSV غير صالح: يلزم عمودا name و price', 'Invalid CSV: needs name and price columns'], csvOk: ['تم استيراد {n} منتج، تخطي {s}', 'Imported {n} products, skipped {s}'],
    shiftOpenTitle: ['فتح وردية', 'Open a shift'], openFloat: ['النقدية في الدرج عند الفتح', 'Cash in drawer at opening'], doOpen: ['افتح', 'Open'], closeShift: ['إغلاق الوردية', 'Close shift'],
    counted: ['النقدية المعدودة عند الإغلاق', 'Cash counted at closing'], expected: ['النقدية المتوقعة', 'Expected cash'], diff: ['الفرق', 'Difference'], noSalesYet: ['لا توجد مبيعات مسجلة.', 'No sales recorded.'],
    nSales: ['عدد المبيعات', 'Sales count'], refunds: ['المرتجعات', 'Refunds'], net: ['الصافي', 'Net'], past: ['الورديات السابقة', 'Past shifts'], today: ['اليوم (من المسجل فقط)', 'Today (from recorded sales only)'],
    refund: ['مرتجع كامل', 'Full refund'], refunded: ['تم الإرجاع', 'Refunded'], refundOf: ['مرتجع للبيع {n}', 'Refund of sale {n}'], exportSales: ['تصدير المبيعات CSV', 'Export sales CSV'], reprint: ['إيصال', 'Receipt'],
    shopAr: ['اسم المحل (عربي)', 'Shop name (Arabic)'], shopEn: ['اسم المحل (إنجليزي)', 'Shop name (English)'], currency: ['العملة', 'Currency label'], taxRate: ['نسبة الضريبة % (الافتراضي 0)', 'Tax rate % (default 0)'],
    taxNote: ['الأسعار بدون ضريبة وتُضاف النسبة بعد الخصم. هذا ليس إيصالًا إلكترونيًا معتمدًا ولا يتصل بأي جهة ضريبية.', 'Prices exclude tax and the rate is added after discount. This is not a certified e-receipt and does not connect to any tax authority.'],
    width: ['عرض الإيصال', 'Receipt width'], setPin: ['رمز المالك (اتركه فارغًا لعدم التغيير)', 'Owner PIN (leave empty to keep current)'], backup: ['نسخة احتياطية كاملة JSON', 'Full backup JSON'], restore: ['استعادة نسخة', 'Restore backup'],
    backupWarn: ['النسخة الكاملة تحتوي المبيعات. احفظها بشكل خاص.', 'A full backup contains sales. Keep it private.'], restored: ['تمت الاستعادة', 'Restored'], restoreFail: ['ملف غير صالح', 'Invalid file'], restoreNewer: ['الملف من إصدار أحدث', 'File is from a newer version'],
    clearDemo: ['حذف البيانات التجريبية', 'Clear demo data'], resetAll: ['مسح كل البيانات', 'Erase all data'], confirmReset: ['سيتم حذف كل شيء على هذا الجهاز. صدّر نسخة أولًا. متابعة؟', 'This deletes everything on this device. Export first. Continue?'],
    blocked: ['البيانات المخزنة غير قابلة للقراءة ولن يتم الكتابة فوقها حتى تمسحها.', 'Stored data is unreadable and will not be overwritten until you erase it.'],
    limits: ['جهاز واحد فقط، بدون مزامنة. ليس نظام فوترة ضريبية. أرقام الوردية من المسجل فقط.', 'One device, no sync. Not a tax invoicing system. Shift figures come from recorded sales only.']
  });
})(globalThis);

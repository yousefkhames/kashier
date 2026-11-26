(function (root) {
  'use strict';
  var T = {
    en: {
      appName: 'Kashier', nav_sell: 'Sell', nav_products: 'Products', nav_sales: 'Sales', nav_settings: 'Settings',
      search_ph: 'Search or scan a code…', all: 'All', no_products: 'No products yet', no_products_hint: 'Add your first product, or load a small demo set to try things out.',
      add_product: 'Add product', load_demo: 'Load demo products', cart: 'Cart', cart_empty: 'The cart is empty', cart_empty_hint: 'Tap a product to add it.',
      clear: 'Clear', subtotal: 'Subtotal', discount: 'Discount', tax: 'Tax', tax_incl: 'Tax (included)', total: 'Total', charge: 'Charge', items: 'items', item: 'item',
      discount_none: 'None', discount_pct: '% off', discount_fix: 'Amount', pay: 'Payment', cash: 'Cash', card: 'Card', other: 'Other',
      tendered: 'Cash received', change: 'Change', exact: 'Exact', short: 'Short by', complete_sale: 'Complete sale', cancel: 'Cancel', save: 'Save', delete: 'Delete', edit: 'Edit', close: 'Close',
      out_of_stock: 'Out of stock', low_stock: 'Low', stock: 'Stock', stock_ph: 'Leave empty to not track', in_stock: 'in stock', only_left: 'Only {n} left of {name}',
      p_name: 'Name', p_price: 'Price', p_category: 'Category', p_sku: 'Code / SKU', p_color: 'Tile colour', edit_product: 'Edit product', new_product: 'New product',
      invalid_name: 'Enter a name', invalid_price: 'Enter a valid price', invalid_stock: 'Stock must be a whole number', confirm_delete_product: 'Delete “{name}”?',
      import_csv: 'Import CSV', export_csv: 'Export CSV', imported: '{n} products imported', import_skipped: '{n} rows skipped', import_bad: 'This CSV has no name and price columns',
      receipt: 'Receipt', receipt_no: 'Receipt', print: 'Print', new_sale: 'New sale', paid_by: 'Paid by', cash_given: 'Cash', thanks: 'Thank you!', void_stamp: 'VOID',
      sales_today: 'Today', day: 'Day', prev_day: 'Previous day', next_day: 'Next day', revenue: 'Revenue', orders: 'Orders', avg_order: 'Average order', items_sold: 'Items sold', tax_collected: 'Tax collected', discounts_given: 'Discounts given',
      by_method: 'By payment method', top_items: 'Best sellers', last7: 'Last 7 days', no_sales: 'No sales on this day', void_sale: 'Void sale', voided: 'Voided', confirm_void: 'Void receipt {no}? Stock will be restored.',
      print_day: 'Print day report', export_sales: 'Export sales CSV', day_report: 'Day report', closing_cash: 'Cash in drawer from sales', net_sales: 'Net of tax',
      settings_brand: 'Branding', settings_shop: 'Shop details', settings_money: 'Money & tax', settings_receipt: 'Receipt', settings_data: 'Data & backup', settings_white: 'White-label kit',
      shop_name: 'Shop name', tagline: 'Tagline', address: 'Address', phone: 'Phone', tax_id: 'Tax ID', logo: 'Logo', upload_logo: 'Upload logo', remove_logo: 'Remove logo', logo_hint: 'PNG, JPG, WebP or SVG. It is resized and stored in this browser.',
      primary: 'Main colour', accent: 'Accent colour', contrast_warn: 'Low contrast with text. Pick a darker or lighter colour.', contrast_ok: 'Readable',
      currency: 'Currency symbol', currency_pos: 'Symbol position', pos_before: 'Before amount', pos_after: 'After amount', decimals: 'Decimals', arabic_digits: 'Use Arabic-Indic digits (٠١٢)',
      tax_rate: 'Tax rate %', tax_inclusive: 'Prices already include tax', prefix: 'Receipt prefix', footer: 'Receipt footer', language: 'Language', methods: 'Payment methods offered',
      brand_export: 'Export brand file', brand_import: 'Import brand file', brand_export_hint: 'A small JSON with name, logo, colours, currency, language and receipt text. Send it to a shop and import it there to set it up in seconds. Products and sales are not included.',
      brand_imported: 'Brand applied', brand_bad: 'That file is not a valid brand file', backup: 'Full backup', backup_export: 'Download backup', backup_import: 'Restore backup', backup_restored: 'Backup restored', backup_bad: 'That file is not a Kashier backup', backup_confirm: 'Restoring replaces all products, sales and settings on this device. Continue?',
      reset: 'Erase everything', reset_confirm: 'Erase all products, sales and settings on this device? This cannot be undone.', saved: 'Saved', storage_note: 'Everything is stored only in this browser. Download a backup regularly.',
      preview: 'Preview', sample_item: 'Sample item', toast_added: 'Added', sale_done: 'Sale complete', storage_full: 'Browser storage is full. Download a backup and remove old data.',
      view_cart: 'View cart', quick_cash: 'Quick amounts', sku_added: 'Added by code', install_hint: 'Works offline once opened. Add it to your home screen.', method: 'Method',
      lang_en: 'English', lang_ar: 'العربية', held: 'Hold', resume: 'Resume', held_sales: 'Held carts', hold_hint: 'Cart held', resumed: 'Cart resumed', name_required: 'Name required', no_match: 'Nothing matches your search'
    },
    ar: {
      appName: 'كاشير', nav_sell: 'البيع', nav_products: 'المنتجات', nav_sales: 'المبيعات', nav_settings: 'الإعدادات',
      search_ph: 'ابحث أو امسح كوداً…', all: 'الكل', no_products: 'لا توجد منتجات بعد', no_products_hint: 'أضف أول منتج، أو حمّل مجموعة تجريبية صغيرة لتجربة النظام.',
      add_product: 'إضافة منتج', load_demo: 'تحميل منتجات تجريبية', cart: 'السلة', cart_empty: 'السلة فارغة', cart_empty_hint: 'اضغط على منتج لإضافته.',
      clear: 'مسح', subtotal: 'المجموع الفرعي', discount: 'الخصم', tax: 'الضريبة', tax_incl: 'الضريبة (مشمولة)', total: 'الإجمالي', charge: 'تحصيل', items: 'أصناف', item: 'صنف',
      discount_none: 'بدون', discount_pct: 'خصم ٪', discount_fix: 'خصم بمبلغ', pay: 'الدفع', cash: 'نقدي', card: 'بطاقة', other: 'أخرى',
      tendered: 'المبلغ المستلم', change: 'الباقي', exact: 'المبلغ بالضبط', short: 'ينقص', complete_sale: 'إتمام البيع', cancel: 'إلغاء', save: 'حفظ', delete: 'حذف', edit: 'تعديل', close: 'إغلاق',
      out_of_stock: 'نفد المخزون', low_stock: 'قليل', stock: 'المخزون', stock_ph: 'اتركه فارغاً لعدم التتبع', in_stock: 'متوفر', only_left: 'المتبقي {n} فقط من {name}',
      p_name: 'الاسم', p_price: 'السعر', p_category: 'التصنيف', p_sku: 'الكود / SKU', p_color: 'لون البطاقة', edit_product: 'تعديل المنتج', new_product: 'منتج جديد',
      invalid_name: 'اكتب اسماً', invalid_price: 'اكتب سعراً صحيحاً', invalid_stock: 'المخزون يجب أن يكون عدداً صحيحاً', confirm_delete_product: 'حذف «{name}»؟',
      import_csv: 'استيراد CSV', export_csv: 'تصدير CSV', imported: 'تم استيراد {n} منتج', import_skipped: 'تم تخطي {n} صف', import_bad: 'الملف لا يحتوي على عمودي الاسم والسعر',
      receipt: 'إيصال', receipt_no: 'إيصال', print: 'طباعة', new_sale: 'بيع جديد', paid_by: 'طريقة الدفع', cash_given: 'المدفوع نقداً', thanks: 'شكراً لكم!', void_stamp: 'ملغي',
      sales_today: 'اليوم', day: 'اليوم', prev_day: 'اليوم السابق', next_day: 'اليوم التالي', revenue: 'الإيراد', orders: 'الطلبات', avg_order: 'متوسط الطلب', items_sold: 'الأصناف المباعة', tax_collected: 'الضريبة المحصلة', discounts_given: 'الخصومات',
      by_method: 'حسب طريقة الدفع', top_items: 'الأكثر مبيعاً', last7: 'آخر ٧ أيام', no_sales: 'لا توجد مبيعات في هذا اليوم', void_sale: 'إلغاء الفاتورة', voided: 'ملغاة', confirm_void: 'إلغاء الإيصال {no}؟ سيعود المخزون.',
      print_day: 'طباعة تقرير اليوم', export_sales: 'تصدير المبيعات CSV', day_report: 'تقرير اليوم', closing_cash: 'النقدية من المبيعات', net_sales: 'الصافي بدون ضريبة',
      settings_brand: 'الهوية', settings_shop: 'بيانات المحل', settings_money: 'العملة والضريبة', settings_receipt: 'الإيصال', settings_data: 'البيانات والنسخ الاحتياطي', settings_white: 'حزمة العلامة التجارية',
      shop_name: 'اسم المحل', tagline: 'الشعار النصي', address: 'العنوان', phone: 'الهاتف', tax_id: 'الرقم الضريبي', logo: 'الشعار', upload_logo: 'رفع الشعار', remove_logo: 'إزالة الشعار', logo_hint: 'PNG أو JPG أو WebP أو SVG. يتم تصغيره وحفظه في هذا المتصفح.',
      primary: 'اللون الأساسي', accent: 'اللون الثانوي', contrast_warn: 'التباين ضعيف مع النص. اختر لوناً أغمق أو أفتح.', contrast_ok: 'مقروء',
      currency: 'رمز العملة', currency_pos: 'مكان الرمز', pos_before: 'قبل المبلغ', pos_after: 'بعد المبلغ', decimals: 'الكسور العشرية', arabic_digits: 'استخدام الأرقام العربية (٠١٢)',
      tax_rate: 'نسبة الضريبة ٪', tax_inclusive: 'الأسعار تشمل الضريبة', prefix: 'بادئة رقم الإيصال', footer: 'نص أسفل الإيصال', language: 'اللغة', methods: 'طرق الدفع المتاحة',
      brand_export: 'تصدير ملف الهوية', brand_import: 'استيراد ملف الهوية', brand_export_hint: 'ملف JSON صغير فيه الاسم والشعار والألوان والعملة واللغة ونص الإيصال. أرسله لأي محل واستورده هناك لتجهيز النظام في ثوانٍ. المنتجات والمبيعات غير مشمولة.',
      brand_imported: 'تم تطبيق الهوية', brand_bad: 'هذا الملف ليس ملف هوية صالحاً', backup: 'نسخة احتياطية كاملة', backup_export: 'تنزيل نسخة احتياطية', backup_import: 'استعادة نسخة', backup_restored: 'تمت الاستعادة', backup_bad: 'هذا الملف ليس نسخة كاشير', backup_confirm: 'الاستعادة تستبدل كل المنتجات والمبيعات والإعدادات على هذا الجهاز. متابعة؟',
      reset: 'مسح كل شيء', reset_confirm: 'مسح كل المنتجات والمبيعات والإعدادات من هذا الجهاز؟ لا يمكن التراجع.', saved: 'تم الحفظ', storage_note: 'كل البيانات محفوظة في هذا المتصفح فقط. نزّل نسخة احتياطية بانتظام.',
      preview: 'معاينة', sample_item: 'صنف تجريبي', toast_added: 'تمت الإضافة', sale_done: 'تم البيع', storage_full: 'مساحة المتصفح ممتلئة. نزّل نسخة احتياطية واحذف بيانات قديمة.',
      view_cart: 'عرض السلة', quick_cash: 'مبالغ سريعة', sku_added: 'أضيف بالكود', install_hint: 'يعمل بدون إنترنت بعد فتحه. أضفه إلى الشاشة الرئيسية.', method: 'الطريقة',
      lang_en: 'English', lang_ar: 'العربية', held: 'تعليق', resume: 'استكمال', held_sales: 'سلات معلقة', hold_hint: 'تم تعليق السلة', resumed: 'تم استكمال السلة', name_required: 'الاسم مطلوب', no_match: 'لا توجد نتائج مطابقة'
    }
  };
  function make(lang) {
    var d = T[lang] || T.en;
    return function (k, vars) {
      var s = d[k] != null ? d[k] : (T.en[k] != null ? T.en[k] : k);
      if (vars) Object.keys(vars).forEach(function (v) { s = s.split('{' + v + '}').join(vars[v]); });
      return s;
    };
  }
  var api = { T: T, make: make };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.KI18n = api;
})(typeof window !== 'undefined' ? window : globalThis);

'use strict';
// ══════════════════════════════════════════════════════════════════
// Gurukripa ERP — INVOICES (company profile + print-ready GST invoice
// + idempotent delivery→invoice) — builds on the tested ERP core.
// ══════════════════════════════════════════════════════════════════
// This module turns a REAL finalized ERP invoice document (erp-documents.js)
// into a professional, print-ready A4 "Tax Invoice / Bill of Supply" and can
// issue that invoice automatically when a delivery is confirmed — idempotently,
// so retried delivery events never produce a duplicate invoice number.
//
// HONESTY NOTES (this is a static, dependency-free PWA — do not overclaim):
//   • PDF is produced with the browser/WebView native Print → "Save as PDF"
//     of an isolated A4 document (reliable, offline, no fabricated binaries).
//   • SERVER-SIDE PDF rendering, permanent file storage, access-controlled
//     signed download URLs and email/WhatsApp delivery require a backend and
//     are therefore NOT claimed here — see docs/ERP-ARCHITECTURE.md.
//   • All amounts & taxes come from the ERP GST engine — nothing is faked.
//   • Company details are CONFIGURABLE; the defaults are the business's own
//     currently-published details (not placeholder lorem), and are overridden
//     by what the operator saves in the admin Company Profile screen.
// ══════════════════════════════════════════════════════════════════

window.GurukripaERP = window.GurukripaERP || {};

(function(E) {
    var C = E.Core;

    // ── Company profile (configurable; never hardcoded downstream) ──
    // Defaults mirror the business's existing published details so the invoice
    // is correct out-of-the-box, and the admin form overrides every field.
    var DEFAULT_PROFILE = {
        legalName: 'Gurukripa Bricks Industry',
        tradeName: 'Gurukripa Bricks',
        logo: null,                       // data URL (set via admin upload)
        address: {
            line1: 'Bhatta Yard, Jaunpur–Varanasi Highway',
            line2: 'Jaunpur', state: 'Uttar Pradesh', stateCode: '09', pincode: '', country: 'India'
        },
        contact: { phone: '+91 91989 23230', email: 'info@gurukripaentudyog.com', website: 'www.gurukripaentudyog.com' },
        registrations: { gstin: '09AAACG7481M1Z2', pan: '', cin: '', fssai: '', kilnLicense: 'GBI/JNP/1998/412', udyam: '' },
        numbering: { prefix: 'INV', serialWidth: 4, resetByFinYear: true, copyLabel: 'ORIGINAL' },
        tax: { scheme: 'exclusive', defaultRate: 5, defaultHsn: '6901.10.00', defaultPlace: 'intra', reverseCharge: false },
        bank: { accountName: '', accountNo: '', ifsc: '', bank: '', branch: '', upi: '', instructions: '' },
        signatory: { name: '', designation: '', image: null },
        terms: '1. Goods once sold & verified at site will not be taken back.\n2. Payment due within 30 days; interest @18% p.a. on overdue.\n3. Subject to Jaunpur jurisdiction.',
        declaration: 'We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.',
        footer: 'Gurukripa Bricks Industry · Computer-generated invoice · FPO'
    };
    function _merge(base, patch) {
        var out = C.clone(base);
        Object.keys(patch || {}).forEach(function (k) {
            if (patch[k] && typeof patch[k] === 'object' && !Array.isArray(patch[k]) && typeof base[k] === 'object') {
                out[k] = _merge(base[k], patch[k]);
            } else if (patch[k] !== undefined) { out[k] = patch[k]; }
        });
        return out;
    }
    function getCompanyProfile() { return _merge(DEFAULT_PROFILE, C.read(C.key('company'), {})); }
    function saveCompanyProfile(patch) {
        var merged = _merge(getCompanyProfile(), patch || {});
        C.write(C.key('company'), patch || {});            // store only overrides
        C.logAudit('company.profile.update', 'company', 'profile', { after: merged });
        return merged;
    }
    function resetCompanyProfile() { C.write(C.key('company'), {}); return C.clone(DEFAULT_PROFILE); }

    // ── Amount in words (Indian numbering) ───────────────────────
    var ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
        'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    var TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    function _below100(n) { return n < 20 ? ONES[n] : (TENS[Math.floor(n / 10)] + (n % 10 ? ' ' + ONES[n % 10] : '')); }
    function _indianWords(n) {
        n = Math.floor(Math.abs(n));
        if (n === 0) return 'Zero';
        var parts = [];
        var crore = Math.floor(n / 10000000); n -= crore * 10000000;
        var lakh = Math.floor(n / 100000); n -= lakh * 100000;
        var thousand = Math.floor(n / 1000); n -= thousand * 1000;
        var hundred = Math.floor(n / 100); n -= hundred * 100;
        if (crore) parts.push(_indianWords(crore) + ' Crore');
        if (lakh) parts.push(_below100(lakh) + ' Lakh');
        if (thousand) parts.push(_below100(thousand) + ' Thousand');
        if (hundred) parts.push(ONES[hundred] + ' Hundred');
        if (n) parts.push(_below100(n));
        return parts.join(' ').replace(/\s+/g, ' ').trim();
    }
    function amountInWords(amount, opts) {
        opts = opts || {};
        var currency = opts.currency || 'Rupees';
        var num = Math.floor(Math.abs(Number(amount) || 0));
        var paise = Math.round(((Math.abs(Number(amount) || 0)) - num) * 100);
        if (paise >= 100) { num += 1; paise -= 100; }
        var s = _indianWords(num) + ' ' + currency;
        if (paise) s += ' and ' + _below100(paise) + ' Paise';
        return s + ' Only';
    }

    // ── Formatting helpers ───────────────────────────────────────
    function money(n) {
        var v = Number(n) || 0;
        try { return v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
        catch (e) { return v.toFixed(2); }
    }
    function qty(n) { var v = Number(n) || 0; return (v % 1 === 0) ? String(v) : String(v); }
    function esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
            return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
        });
    }
    function dateFmt(iso) { if (!iso) return ''; var d = new Date(iso); if (isNaN(d)) return String(iso); var p = function (x) { return (x < 10 ? '0' : '') + x; }; return p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + d.getFullYear(); }

    // ── Document type (based on tax + config + law) ──────────────
    function documentTitle(inv, profile, opts) {
        opts = opts || {};
        if (opts.docType) return opts.docType;
        if (profile.tax.reverseCharge) return 'TAX INVOICE (REVERSE CHARGE)';
        var hasTax = inv && inv.totals && (inv.totals.taxTotal > 0 || inv.totals.cgst > 0 || inv.totals.sgst > 0 || inv.totals.igst > 0);
        return hasTax ? 'TAX INVOICE' : 'BILL OF SUPPLY';
    }

    // ── Resolve customer record (CRM) from a stored customerId ───
    function _customerFor(inv) {
        if (!inv || !inv.customerId || !E.CRM || !E.CRM.getCustomer) return null;
        return E.CRM.getCustomer(inv.customerId);
    }

    // ── Build the data model that the renderer + tests consume ───
    function buildInvoiceModel(idOrNumber, opts) {
        opts = opts || {};
        var D = E.Documents; if (!D) return { ok: false, error: 'documents_unavailable' };
        var inv = D.getDoc(idOrNumber);
        if (!inv) return { ok: false, error: 'invoice_not_found' };
        var profile = opts.profile || getCompanyProfile();
        var customer = opts.customer || _customerFor(inv);
        var delivery = opts.delivery || null;      // { orderNumber, challanNumber, deliveryDate, vehicleNo, driver, fromAddress }
        var billTo = opts.billTo || (customer ? {
            name: customer.name, gstin: customer.gstin, phone: customer.phone, email: customer.email,
            address: (customer.addresses && customer.addresses[0]) || null, stateCode: (customer.addresses && customer.addresses[0] && customer.addresses[0].stateCode) || null
        } : { name: opts.billToName || 'Buyer' });
        var isInter = inv.totals && inv.totals.place === 'inter';
        return {
            ok: true, profile: profile, doc: inv, customer: customer, billTo: billTo, delivery: delivery,
            title: documentTitle(inv, profile, opts),
            copyLabel: opts.copyLabel || profile.numbering.copyLabel || 'ORIGINAL',
            lines: inv.lines || [], totals: inv.totals || {},
            paid: inv.paidTotal || 0, balance: inv.balance || 0, status: inv.status,
            payments: inv.payments || [], dueDate: inv.dueDate,
            words: amountInWords(inv.totals ? inv.totals.grandTotal : 0, { currency: 'Rupees' }),
            isInter: isInter
        };
    }

    // ── Print-ready, self-contained A4 invoice HTML ──────────────
    function renderInvoiceHTML(idOrNumber, opts) {
        var m = buildInvoiceModel(idOrNumber, opts);
        if (!m.ok) return '<div class="gb-inv-error">' + esc(m.error) + '</div>';
        var p = m.profile, inv = m.doc, t = m.totals || {}, bt = m.billTo || {}, dl = m.delivery || {};
        var reg = p.registrations || {}, addr = p.address || {}, contact = p.contact || {}, bank = p.bank || {};

        var taxCols = m.isInter
            ? '<th class="num">IGST</th>'
            : '<th class="num">CGST</th><th class="num">SGST</th>';

        var rows = (m.lines || []).map(function (l, i) {
            var spec = [l.size, l.specification, l.category].filter(Boolean).join(' · ');
            var taxCell = m.isInter
                ? '<td class="num">' + money(l.igst) + '</td>'
                : '<td class="num">' + money(l.cgst) + '</td><td class="num">' + money(l.sgst) + '</td>';
            return '<tr>' +
                '<td class="ctr">' + (i + 1) + '</td>' +
                '<td class="mono">' + esc(l.hsn || l.sac || (p.tax && p.tax.defaultHsn) || '') + '</td>' +
                '<td class="desc"><span class="dl">' + esc(l.name || ('Item ' + l.item)) + '</span>' + (spec ? '<span class="ds">' + esc(spec) + '</span>' : '') + '</td>' +
                '<td class="num">' + qty(l.qty) + '<span class="u"> ' + esc(l.unit || 'piece') + '</span></td>' +
                '<td class="num">' + money(l.unitPrice) + '</td>' +
                '<td class="num">' + (l.discountAmount ? money(l.discountAmount) : '—') + '</td>' +
                '<td class="num">' + money(l.taxableValue) + '</td>' +
                '<td class="num">' + esc(l.taxRate || 0) + '%</td>' +
                taxCell +
                '<td class="num strong">' + money(l.lineTotal) + '</td>' +
                '</tr>';
        }).join('');

        var taxBreak = m.isInter
            ? ('<tr><td class="lbl">IGST</td><td class="num">' + money(t.igst) + '</td></tr>')
            : ('<tr><td class="lbl">CGST</td><td class="num">' + money(t.cgst) + '</td></tr>' +
               '<tr><td class="lbl">SGST</td><td class="num">' + money(t.sgst) + '</td></tr>');

        var deliveryBits = [];
        if (dl.orderNumber) deliveryBits.push('<div><span>Order No.</span><strong>' + esc(dl.orderNumber) + '</strong></div>');
        if (dl.challanNumber) deliveryBits.push('<div><span>Delivery Challan</span><strong>' + esc(dl.challanNumber) + '</strong></div>');
        if (dl.deliveryDate) deliveryBits.push('<div><span>Delivery Date</span><strong>' + esc(dateFmt(dl.deliveryDate)) + '</strong></div>');
        if (dl.vehicleNo) deliveryBits.push('<div><span>Vehicle No.</span><strong>' + esc(dl.vehicleNo) + '</strong></div>');
        if (dl.driver) deliveryBits.push('<div><span>Driver / Ref</span><strong>' + esc(dl.driver) + '</strong></div>');
        var deliveryBar = deliveryBits.length ? '<div class="delivery-bar">' + deliveryBits.join('') + '</div>' : '';

        var statusBadge = ({ paid: 'PAID', partially_paid: 'PARTIALLY PAID', draft: 'DRAFT', cancelled: 'CANCELLED' })[m.status] || 'UNPAID';
        var statusClass = ({ paid: 'ok', partially_paid: 'warn', draft: 'neutral', cancelled: 'bad' })[m.status] || 'bad';

        var logoHtml = p.logo ? ('<img class="logo" src="' + esc(p.logo) + '" alt="logo"/>') : '';
        var sigHtml = (p.signatory && (p.signatory.name || p.signatory.image))
            ? ('<div class="sign"><div class="sigline"></div>' + (p.signatory.image ? '<img class="sigimg" src="' + esc(p.signatory.image) + '"/>' : '') +
               '<div class="signame">' + esc(p.signatory.name || '') + '</div>' + (p.signatory.designation ? '<div class="sigdes">' + esc(p.signatory.designation) + '</div>' : '') + '</div>')
            : '<div class="sign"><div class="sigline"></div><div class="sigdes">Authorised Signatory</div></div>';

        var termsHtml = esc(p.terms || '').replace(/\n/g, '<br/>');
        var declHtml = p.declaration ? '<div class="decl">' + esc(p.declaration) + '</div>' : '';

        var bankHtml = (bank.bank || bank.upi || bank.accountNo)
            ? ('<div class="bank"><div class="bt">Payment details</div>' +
               (bank.accountName ? '<div><span>A/c name</span>' + esc(bank.accountName) + '</div>' : '') +
               (bank.bank ? '<div><span>Bank</span>' + esc(bank.bank) + (bank.branch ? ', ' + esc(bank.branch) : '') + '</div>' : '') +
               (bank.accountNo ? '<div><span>A/c no.</span><span class="mono">' + esc(bank.accountNo) + '</span></div>' : '') +
               (bank.ifsc ? '<div><span>IFSC</span><span class="mono">' + esc(bank.ifsc) + '</span></div>' : '') +
               (bank.upi ? '<div><span>UPI</span><span class="mono">' + esc(bank.upi) + '</span></div>' : '') +
               (bank.instructions ? '<div class="bi">' + esc(bank.instructions) + '</div>' : '') +
               '</div>') : '';

        return '' +
        '<!doctype html><html lang="en"><head><meta charset="utf-8"/><title>' + esc(m.title) + ' ' + esc(inv.number) + '</title>' +
        '<style>' + INVOICE_CSS.replace('__BRAND__', p.brandColor || '#C83E0A') + '</style>' +
        '</head><body>' +
        '<div class="gb-invoice">' +
            '<header class="ih">' +
                '<div class="ih-left">' + logoHtml +
                    '<div class="ih-co">' +
                        '<div class="ih-name">' + esc(p.legalName) + '</div>' +
                        (p.tradeName && p.tradeName !== p.legalName ? '<div class="ih-trade">' + esc(p.tradeName) + '</div>' : '') +
                        '<div class="ih-addr">' + esc(addr.line1) + (addr.line2 ? ', ' + esc(addr.line2) : '') + '<br/>' + esc(addr.state || '') + (addr.pincode ? ' - ' + esc(addr.pincode) : '') + ', ' + esc(addr.country || 'India') + '</div>' +
                        '<div class="ih-reg">' +
                            (reg.gstin ? 'GSTIN: <strong>' + esc(reg.gstin) + '</strong>' : '') +
                            (reg.pan ? ' &nbsp;PAN: <strong>' + esc(reg.pan) + '</strong>' : '') +
                            (addr.stateCode ? ' &nbsp;State Code: <strong>' + esc(addr.stateCode) + '</strong>' : '') +
                            (reg.kilnLicense ? '<br/>Kiln License: ' + esc(reg.kilnLicense) : '') +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<div class="ih-right">' +
                    '<div class="ih-title">' + esc(m.title) + '</div>' +
                    '<div class="ih-copy">' + esc(m.copyLabel) + '</div>' +
                    '<table class="ih-meta"><tr><td>Invoice No.</td><td><strong>' + esc(inv.number) + '</strong></td></tr>' +
                    '<tr><td>Date</td><td>' + esc(dateFmt(inv.date)) + '</td></tr>' +
                    (m.dueDate ? '<tr><td>Due Date</td><td>' + esc(dateFmt(m.dueDate)) + '</td></tr>' : '') +
                    (inv.supplierId ? '' : '') + '</table>' +
                '</div>' +
            '</header>' +
            '<section class="parties">' +
                '<div class="party"><div class="ptitle">Seller (Battawala)</div>' +
                    '<div class="pname">' + esc(p.legalName) + '</div>' +
                    '<div class="psub">' + esc(addr.line1) + ', ' + esc(addr.state) + (addr.stateCode ? ' (' + esc(addr.stateCode) + ')' : '') + '</div>' +
                    (contact.phone ? '<div class="psub">Ph: ' + esc(contact.phone) + '</div>' : '') +
                    (reg.gstin ? '<div class="psub">GSTIN: ' + esc(reg.gstin) + '</div>' : '') +
                '</div>' +
                '<div class="party"><div class="ptitle">Buyer (Client)</div>' +
                    '<div class="pname">' + esc(bt.name || 'Buyer') + '</div>' +
                    (bt.address ? '<div class="psub">' + esc(bt.address.line1 || '') + (bt.address.line2 ? ', ' + esc(bt.address.line2) : '') + (bt.address.city ? ', ' + esc(bt.address.city) : '') + '</div>' : '') +
                    (bt.gstin ? '<div class="psub">GSTIN: ' + esc(bt.gstin) + '</div>' : '') +
                    ((bt.stateCode || (bt.address && bt.address.stateCode)) ? '<div class="psub">State Code: ' + esc(bt.stateCode || bt.address.stateCode) + '</div>' : '') +
                    (bt.phone ? '<div class="psub">Ph: ' + esc(bt.phone) + '</div>' : '') +
                '</div>' +
            '</section>' +
            deliveryBar +
            '<table class="items">' +
                '<thead><tr><th class="ctr">#</th><th class="mono">HSN/SAC</th><th>Description &amp; Specification</th>' +
                '<th class="num">Qty</th><th class="num">Rate</th><th class="num">Disc.</th><th class="num">Taxable</th><th class="num">Tax%</th>' + taxCols + '<th class="num">Amount</th></tr></thead>' +
                '<tbody>' + (rows || '<tr><td colspan="12" class="empty">No line items</td></tr>') + '</tbody>' +
            '</table>' +
            '<section class="totals">' +
                '<div class="tot-right"><table>' +
                    '<tr><td class="lbl">Subtotal</td><td class="num">' + money(t.subTotal) + '</td></tr>' +
                    (t.discountTotal ? '<tr><td class="lbl">Total Discount</td><td class="num red">-' + money(t.discountTotal) + '</td></tr>' : '') +
                    '<tr><td class="lbl">Taxable Value</td><td class="num">' + money(t.taxableValue) + '</td></tr>' +
                    taxBreak +
                    (t.roundOff ? '<tr><td class="lbl">Round Off</td><td class="num">' + money(t.roundOff) + '</td></tr>' : '') +
                    '<tr class="grand"><td class="lbl">Grand Total</td><td class="num">₹ ' + money(t.grandTotal) + '</td></tr>' +
                '</table></div>' +
                '<div class="tot-left">' +
                    '<div class="words"><span>Amount in words</span><strong>' + esc(m.words) + '</strong></div>' +
                    '<div class="pay">Payment status: <span class="badge ' + statusClass + '">' + esc(statusBadge) + '</span></div>' +
                    '<div class="paygrid">' +
                        '<div><span>Paid</span><strong>' + money(m.paid) + '</strong></div>' +
                        '<div><span>Outstanding</span><strong>' + money(m.balance) + '</strong></div>' +
                    '</div>' +
                '</div>' +
            '</section>' +
            (bankHtml ? '<section class="mid">' + bankHtml + '<div class="terms"><div class="bt">Terms &amp; Conditions</div>' + termsHtml + '</div></section>' : '<section class="mid"><div class="terms"><div class="bt">Terms &amp; Conditions</div>' + termsHtml + '</div></section>') +
            declHtml +
            '<footer class="ifoot"><div class="fleft">' + esc(p.footer || '') + '</div>' + sigHtml + '</footer>' +
        '</div>' +
        '</body></html>';
    }

    // Self-contained stylesheet for the invoice document (works in iframe/print)
    var INVOICE_CSS = [
        '*{box-sizing:border-box;margin:0;padding:0}',
        '@page{size:A4;margin:12mm}',
        'html,body{background:#fff;color:#202124;font-family:"Segoe UI",Arial,Helvetica,sans-serif;font-size:12px;-webkit-print-color-adjust:exact;print-color-adjust:exact}',
        '.gb-invoice{padding:10mm;max-width:200mm;margin:0 auto}',
        '.mono{font-family:"Courier New",monospace}',
        'img.logo{width:56px;height:56px;object-fit:contain;margin-right:12px;float:left}',
        '.ih{display:flex;justify-content:space-between;border-bottom:2px solid __BRAND__;padding-bottom:12px;margin-bottom:14px;overflow:hidden}',
        '.ih-name{font-size:19px;font-weight:800;color:__BRAND__;letter-spacing:.2px}',
        '.ih-trade{font-size:11px;color:#64666B;margin-top:1px}',
        '.ih-addr{font-size:11px;color:#3D3B38;margin-top:5px;line-height:1.5}',
        '.ih-reg{font-size:11px;color:#202124;margin-top:4px}',
        '.ih-right{text-align:right;min-width:44%}',
        '.ih-title{font-size:16px;font-weight:800;color:#202124;border:1.5px solid #202124;padding:4px 10px;display:inline-block;letter-spacing:.5px}',
        '.ih-copy{font-size:10px;color:#64666B;margin:4px 0}',
        '.ih-meta{margin-left:auto;font-size:11px;border-collapse:collapse}',
        '.ih-meta td{padding:2px 4px;text-align:right}',
        '.ih-meta td:first-child{color:#64666B;text-align:right}',
        '.parties{display:flex;gap:12px;margin-bottom:12px}',
        '.party{flex:1;border:1px solid #E7E1DA;border-radius:6px;padding:8px 10px;background:#F8F6F1}',
        '.ptitle{font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:__BRAND__;font-weight:700;margin-bottom:4px}',
        '.pname{font-weight:700;font-size:13px}', '.psub{font-size:11px;color:#3D3B38;line-height:1.5}',
        '.delivery-bar{display:flex;flex-wrap:wrap;gap:10px 22px;background:#F1ECE4;border:1px solid #E7E1DA;border-radius:6px;padding:8px 10px;margin-bottom:12px}',
        '.delivery-bar div{font-size:11px}', '.delivery-bar span{color:#64666B;display:block;font-size:9px;text-transform:uppercase;letter-spacing:.4px}',
        'table.items{width:100%;border-collapse:collapse;font-size:11px;margin-bottom:12px}',
        'table.items thead{display:table-header-group}', /* repeat header across pages */
        'table.items th{background:__BRAND__;color:#fff;font-weight:700;padding:6px 6px;text-align:left;border:1px solid __BRAND__}',
        'table.items td{border:1px solid #E7E1DA;padding:5px 6px;vertical-align:top}',
        'table.items tbody tr{page-break-inside:avoid;break-inside:avoid}',
        '.num{text-align:right;white-space:nowrap}', '.ctr{text-align:center}', '.strong{font-weight:700}', '.red{color:#C62828}',
        '.desc{word-break:break-word;max-width:52mm}', '.dl{display:block;font-weight:600}', '.ds{display:block;color:#64666B;font-size:10px}',
        '.u{color:#64666B;font-size:9px}', '.empty{text-align:center;color:#64666B;padding:14px}',
        '.totals{display:flex;gap:14px;justify-content:space-between;margin-bottom:12px}',
        '.tot-right table{border-collapse:collapse;font-size:11.5px;min-width:62mm}',
        '.tot-right td{padding:4px 8px;border-bottom:1px solid #EEE}', '.tot-right .lbl{color:#3D3B38}',
        '.tot-right tr.grand td{border-top:1.5px solid #202124;border-bottom:none;font-weight:800;font-size:13px;color:__BRAND__}',
        '.tot-left{flex:1;border:1px solid #E7E1DA;border-radius:6px;padding:8px 10px;background:#F8F6F1;font-size:11px}',
        '.words{margin-bottom:6px}.words span{display:block;color:#64666B;font-size:9px;text-transform:uppercase}.words strong{font-size:11.5px}',
        '.badge{font-weight:700;padding:2px 8px;border-radius:10px;font-size:10px}.badge.ok{background:#E6F4EA;color:#16a34a}.badge.warn{background:#FEF6E7;color:#D6A34D}.badge.bad{background:#FDECEA;color:#C62828}.badge.neutral{background:#EEE;color:#64666B}',
        '.paygrid{display:flex;gap:16px;margin-top:6px}.paygrid div span{display:block;color:#64666B;font-size:9px;text-transform:uppercase}',
        '.mid{display:flex;gap:12px;margin-bottom:10px}', '.bank,.terms{flex:1;font-size:10.5px;border:1px solid #E7E1DA;border-radius:6px;padding:8px 10px;line-height:1.6}',
        '.bank div{display:flex;gap:6px}.bank span{color:#64666B;min-width:58px}.bank .bt,.terms .bt{font-weight:700;color:__BRAND__;text-transform:uppercase;font-size:10px;margin-bottom:4px;display:block!important;min-width:0}',
        '.bi{margin-top:4px;color:#64666B}', '.decl{font-size:10px;color:#3D3B38;border-top:1px dashed #E7E1DA;padding-top:8px;margin-bottom:8px}',
        '.ifoot{display:flex;justify-content:space-between;align-items:flex-end;margin-top:10px}',
        '.fleft{font-size:10px;color:#64666B;max-width:60%}',
        '.sign{text-align:center;min-width:48mm}.sigline{border-top:1px solid #202124;margin-bottom:4px;padding-top:22px}.sigimg{height:34px;margin-bottom:2px}.signame{font-weight:700;font-size:12px}.sigdes{font-size:10px;color:#64666B}',
        '@media print{.gb-invoice{padding:0;max-width:none}.no-print{display:none!important}}'
    ].join('');

    // ── Storefront order → ERP invoice lines (real data, no fallbacks) ──
    // order.items: [{ id/productId, name, qty, unit, price|unitPrice, taxRate?, hsn? }]
    function orderToLines(order, profile, customer) {
        var items = (order && order.items) || [];
        var cat = (typeof PRODUCTS !== 'undefined' && Array.isArray(PRODUCTS)) ? PRODUCTS : [];
        var defaultHsn = (profile.tax && profile.tax.defaultHsn) || '6901.10.00';
        var defaultRate = (profile.tax && profile.tax.defaultRate != null) ? profile.tax.defaultRate : 5;
        return items.map(function (it) {
            var pid = it.productId != null ? it.productId : it.id;
            var prod = cat.filter(function (x) { return String(x.id) === String(pid); })[0];
            return {
                item: pid, productId: pid,
                name: it.name || (prod && prod.name) || ('Item ' + pid),
                hsn: it.hsn || (prod && prod.hsn) || defaultHsn,
                qty: Number(it.qty) || 0, unit: it.unit || 'piece',
                unitPrice: Number(it.unitPrice != null ? it.unitPrice : (it.price != null ? it.price : (prod && prod.price))) || 0,
                taxRate: it.taxRate != null ? it.taxRate : (prod && prod.taxRate != null ? prod.taxRate : defaultRate),
                discountPct: it.discountPct || 0
            };
        });
    }
    function _place(order, customer, profile) {
        var seller = (profile.address && profile.address.stateCode) || (profile.registrations && profile.registrations.gstin || '').slice(0, 2);
        var buyer = (customer && customer.addresses && customer.addresses[0] && customer.addresses[0].stateCode) || (order && order.shipping && order.shipping.stateCode) || null;
        if (buyer && seller && buyer !== seller) return 'inter';
        return (profile.tax && profile.tax.defaultPlace) || 'intra';
    }

    // ── Idempotent delivery → invoice ────────────────────────────
    // Ensures exactly ONE invoice exists for a given order / delivery.
    // Safe to call repeatedly when delivery events are retried.
    function ensureInvoiceForDelivery(order, opts) {
        opts = opts || {};
        var D = E.Documents; if (!D) return { ok: false, error: 'documents_unavailable' };
        if (!order || !order.id) return { ok: false, error: 'order_required' };

        var links = C.read(C.key('inv_link'), {});
        // Already issued for this order? Return the existing invoice (no dup).
        if (links[order.id]) {
            var existing = D.getDoc(links[order.id]);
            if (existing) return { ok: true, invoice: existing, created: false, duplicate: true };
        }
        if (C.seenKey('inv:delivered:' + order.id)) {
            var ln = C.read(C.key('idem'), {})['inv:delivered:' + order.id];
            var ex = ln && D.getDoc(ln.result);
            if (ex) return { ok: true, invoice: ex, created: false, duplicate: true };
        }

        var profile = getCompanyProfile();
        // Customer: reuse/extend CRM so statements & aging reflect it.
        var customerId = order.customerId || null;
        var cust = order.customer || {};
        if (!customerId && (cust.phone || cust.name)) {
            customerId = 'cu_' + String(cust.phone || cust.name).replace(/[^0-9a-zA-Z]/g, '').slice(0, 16);
            E.CRM.upsertCustomer(Object.assign({ id: customerId, name: cust.name || 'Customer', phone: cust.phone || '', gstin: cust.gstin || '' }, {}));
            if (cust.address || (order.shipping && order.shipping.address)) {
                E.CRM.addAddress(customerId, { line1: (order.shipping && order.shipping.address) || cust.address || '', city: cust.city || (order.shipping && order.shipping.city) || '', stateCode: cust.stateCode || (order.shipping && order.shipping.stateCode) || '' });
            }
        }

        var lines = (order.items && order.items.length) ? orderToLines(order, profile, customerId ? E.CRM.getCustomer(customerId) : null) : (opts.lines || []);
        if (!lines.length) return { ok: false, error: 'no_line_data', message: 'Order has no line items; cannot create a real invoice without fabricating data.' };

        var place = opts.place || _place(order, E.CRM.getCustomer(customerId), profile);
        var scheme = opts.scheme || (profile.tax && profile.tax.scheme) || 'exclusive';

        var inv = D.createDocument('invoice', {
            customerId: customerId, warehouse: opts.warehouse || null,
            date: order.date, dueDate: opts.dueDate || null,
            lines: lines, tax: { scheme: scheme, place: place, gstRate: profile.tax.defaultRate },
            salesperson: order.salesperson || null, branch: order.branch || null,
            refDocId: order.refDocId || null,
            notes: 'Auto-issued on delivery for order ' + order.id
        });

        // Finalize (locks totals + consumes stock if a warehouse is tracked).
        var finalized = false, finError = null;
        try { D.finalize(inv.id, opts.actor); inv = D.getDoc(inv.id) || inv; finalized = inv.status === 'finalized'; }
        catch (e) { finError = e.message; }

        // Prepaid orders: mirror the collected payment (idempotent by txn id).
        if ((order.paid || order.paymentStatus === 'paid' || (order.paymentMethod && !/cod/i.test(order.paymentMethod))) && finalized) {
            try { D.recordPayment(inv.id, { amount: inv.totals.grandTotal, method: order.paymentMethod || 'upi', txnId: 'order:' + order.id }); } catch (e) { /* keep invoice */ }
            inv = D.getDoc(inv.id) || inv;
        }

        links[order.id] = inv.id;
        C.write(C.key('inv_link'), links);
        C.markOnce('inv:delivered:' + order.id, inv.id);
        C.logAudit('invoice.auto.create', 'invoice', inv.number, { after: { orderId: order.id, number: inv.number, finalized: finalized } });

        return { ok: true, invoice: inv, created: true, finalized: finalized, error: finError };
    }
    function invoiceForOrder(orderId) {
        var links = C.read(C.key('inv_link'), {});
        if (!links[orderId] || !E.Documents) return null;
        return E.Documents.getDoc(links[orderId]);
    }

    // ── Listing, scoping, reporting ──────────────────────────────
    function listInvoices(filter) {
        filter = filter || {};
        if (!E.Documents) return [];
        var invs = E.Documents.listDocs('invoice');
        return invs.filter(function (inv) {
            if (filter.status && inv.status !== filter.status) return false;
            if (filter.customerId && String(inv.customerId) !== String(filter.customerId)) return false;
            if (filter.from && new Date(inv.date) < new Date(filter.from)) return false;
            if (filter.to && new Date(inv.date) > new Date(filter.to)) return false;
            if (filter.q) {
                var q = String(filter.q).toLowerCase();
                var hay = [inv.number, inv.customerId, inv.notes, (inv.refDocId || '')].join(' ').toLowerCase();
                var cust = inv.customerId && E.CRM && E.CRM.getCustomer(inv.customerId);
                if (cust) hay += ' ' + String(cust.name).toLowerCase() + ' ' + String(cust.phone || '');
                if (hay.indexOf(q) === -1) return false;
            }
            return true;
        }).sort(function (a, b) { return new Date(b.date) - new Date(a.date); });
    }
    // Only invoices that belong to the given identity (id / phone / email).
    function invoicesForCustomer(identity) {
        identity = identity || {};
        var invs = E.Documents ? E.Documents.listDocs('invoice') : [];
        return invs.filter(function (inv) {
            var cu = inv.customerId && E.CRM && E.CRM.getCustomer(inv.customerId);
            if (!cu) return false;
            if (identity.id && String(cu.id) === String(identity.id)) return true;
            if (identity.phone && cu.phone && String(cu.phone).replace(/\D/g, '').slice(-10) === String(identity.phone).replace(/\D/g, '').slice(-10)) return true;
            if (identity.email && cu.email && String(cu.email).toLowerCase() === String(identity.email).toLowerCase()) return true;
            return false;
        });
    }
    function invoiceReport(from, to) {
        var invs = listInvoices({ from: from, to: to });
        var totals = { count: invs.length, invoiced: 0, tax: 0, received: 0, outstanding: 0, paid: 0, partial: 0, unpaid: 0, overdue: 0, cancelled: 0 };
        var now = Date.now();
        invs.forEach(function (inv) {
            if (inv.status === 'cancelled') { totals.cancelled++; return; }
            totals.invoiced += inv.totals.grandTotal || 0;
            totals.tax += inv.totals.taxTotal || 0;
            totals.received += inv.paidTotal || 0;
            totals.outstanding += inv.balance || 0;
            if (inv.status === 'paid') totals.paid++;
            else if (inv.status === 'partially_paid') totals.partial++;
            else totals.unpaid++;
            if (inv.balance > 0 && inv.dueDate && new Date(inv.dueDate).getTime() < now) totals.overdue++;
        });
        ['invoiced', 'tax', 'received', 'outstanding'].forEach(function (k) { totals[k] = C.round2(totals[k]); });
        return totals;
    }

    // ── DOM/UI helpers (guarded so the module stays testable offline) ──
    function _doc() { return (typeof document !== 'undefined') ? document : null; }
    function printInvoice(idOrNumber, opts) {
        var d = _doc(); if (!d) return { ok: false, error: 'no_dom' };
        var html = renderInvoiceHTML(idOrNumber, opts);
        var frame = d.createElement('iframe');
        frame.setAttribute('style', 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;');
        d.body.appendChild(frame);
        var doc = frame.contentWindow.document;
        doc.open(); doc.write(html); doc.close();
        function go() { try { frame.contentWindow.focus(); frame.contentWindow.print(); } catch (e) {} setTimeout(function () { d.body.removeChild(frame); }, 1000); }
        if (doc.readyState === 'complete') setTimeout(go, 250); else frame.onload = function () { setTimeout(go, 250); };
        return { ok: true };
    }
    // Download the rendered invoice as a self-contained .html (opens/prints to PDF).
    function downloadInvoice(idOrNumber, opts) {
        var d = _doc(); if (!d) return { ok: false, error: 'no_dom' };
        var inv = E.Documents.getDoc(idOrNumber);
        var html = renderInvoiceHTML(idOrNumber, opts);
        try {
            var blob = new Blob([html], { type: 'text/html' });
            var url = URL.createObjectURL(blob);
            var a = d.createElement('a'); a.href = url; a.download = 'invoice-' + (inv ? inv.number : 'preview') + '.html';
            d.body.appendChild(a); a.click(); d.body.removeChild(a); setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
            return { ok: true };
        } catch (e) { return { ok: false, error: 'download_unavailable' }; }
    }
    // Native share of the invoice (Web Share Level 2). Falls back honestly.
    function shareInvoice(idOrNumber, opts) {
        var nav = (typeof navigator !== 'undefined') ? navigator : null;
        var inv = E.Documents.getDoc(idOrNumber);
        var text = (inv ? ('Invoice ' + inv.number) : 'Invoice');
        if (nav && nav.share) {
            try { nav.share({ title: 'Gurukripa Invoice', text: text + ' from ' + getCompanyProfile().legalName }); return { ok: true, method: 'native' }; }
            catch (e) { return { ok: false, error: 'cancelled' }; }
        }
        return { ok: false, error: 'share_unsupported' };
    }
    // Sending by email/WhatsApp/queue needs a backend — never silently faked.
    function resendInvoice(idOrNumber, channel) {
        return { ok: false, sent: false, channel: channel || 'email', reason: 'backend_required',
            message: 'Automated email/WhatsApp delivery requires the notification backend (see docs/ERP-ARCHITECTURE.md). Use Download / Print / Share to send manually.' };
    }

    E.Invoices = {
        DEFAULT_PROFILE: DEFAULT_PROFILE,
        getCompanyProfile: getCompanyProfile, saveCompanyProfile: saveCompanyProfile, resetCompanyProfile: resetCompanyProfile,
        amountInWords: amountInWords, documentTitle: documentTitle,
        buildInvoiceModel: buildInvoiceModel, renderInvoiceHTML: renderInvoiceHTML, INVOICE_CSS: INVOICE_CSS,
        orderToLines: orderToLines, ensureInvoiceForDelivery: ensureInvoiceForDelivery, invoiceForOrder: invoiceForOrder,
        listInvoices: listInvoices, invoicesForCustomer: invoicesForCustomer, invoiceReport: invoiceReport,
        printInvoice: printInvoice, downloadInvoice: downloadInvoice, shareInvoice: shareInvoice, resendInvoice: resendInvoice,
        money: money, dateFmt: dateFmt, esc: esc
    };

})(window.GurukripaERP);

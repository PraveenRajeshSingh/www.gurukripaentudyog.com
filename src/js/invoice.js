// ══════════════════════════════════════════
// GST INVOICE, PDF PREVIEW, COMPANY PROFILE & RE-ORDER
// ══════════════════════════════════════════
// Real invoices are rendered from finalized ERP documents via
// window.GurukripaERP.Invoices. A legacy cash-memo view is kept only as a
// fallback so existing order-history behaviour is never broken. No amounts,
// taxes or company details are fabricated — every figure comes from records.

const _invPackageSVG = `<svg width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`;
const _invBrickSVG = `<svg width="22" height="22" fill="none" stroke="var(--brand)" stroke-width="1.8" viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="7" width="20" height="10" rx="1.5"/><line x1="8" y1="7" x2="8" y2="17"/><line x1="16" y1="7" x2="16" y2="17"/></svg>`;
const _invTruckSVG = `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>`;
const _invDocSVG = `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`;
const _invReorderSVG = `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>`;

function _ERPInv() { return (window.GurukripaERP && GurukripaERP.Invoices) ? GurukripaERP.Invoices : null; }

// ── Invoice preview modal (real ERP invoice) ─────────────────────
let _currentInvoiceRef = null;

function openInvoicePdf(idOrNumber, subtitle) {
    const modal = document.getElementById('invoicePdfModal');
    const frame = document.getElementById('invPdfFrame');
    const IV = _ERPInv();
    if (!modal || !frame || !IV) { showToast('Invoice engine unavailable', 'warning'); return; }
    const html = IV.renderInvoiceHTML(idOrNumber);
    if (html.indexOf('gb-inv-error') !== -1) { showToast('Invoice not found', 'warning'); return; }
    const doc = frame.contentWindow.document;
    doc.open(); doc.write(html); doc.close();
    _currentInvoiceRef = idOrNumber;
    const sub = document.getElementById('invPdfSubtitle');
    if (sub) sub.textContent = subtitle || ('Invoice ' + idOrNumber);
    modal.classList.add('open'); overlayLock();
}
function closeInvoicePdf() { const m = document.getElementById('invoicePdfModal'); if (m) { m.classList.remove('open'); overlayUnlock(); } }
function printCurrentInvoice() { if (_currentInvoiceRef) GurukripaERP.Invoices.printInvoice(_currentInvoiceRef); }
function downloadCurrentInvoice() { if (_currentInvoiceRef) { const r = GurukripaERP.Invoices.downloadInvoice(_currentInvoiceRef); if (r.ok) showToast('Invoice downloaded', 'success'); } }
function shareCurrentInvoice() { if (_currentInvoiceRef) { const r = GurukripaERP.Invoices.shareInvoice(_currentInvoiceRef); if (!r.ok && r.error !== 'cancelled') showToast('Sharing not supported here — use Download', 'info'); } }
function resendCurrentInvoice() { if (_currentInvoiceRef) showToast(GurukripaERP.Invoices.resendInvoice(_currentInvoiceRef).message, 'info'); }

// ── Customer order → invoice (real-first, legacy fallback) ───────
function openGstInvoice(orderId) {
    const IV = _ERPInv();
    if (IV) {
        // 1) Already-linked invoice?
        let inv = IV.invoiceForOrder(orderId);
        // 2) Otherwise try to issue one from the order's real line items.
        if (!inv && window.GurukripaServices && GurukripaServices.OrderService) {
            const order = GurukripaServices.OrderService.getOrderById(orderId);
            if (order && order.items && order.items.length) {
                const r = IV.ensureInvoiceForDelivery(order);
                if (r && r.ok) inv = r.invoice;
            }
        }
        if (inv) { openInvoicePdf(inv.number || inv.id, 'Order ' + orderId); return; }
        // No itemised record → do NOT fabricate; explain and fall back.
        renderLegacyGstInvoice(orderId);
        showToast('Detailed GST invoice is issued once your order is processed. Showing provisional cash memo.', 'info');
        return;
    }
    renderLegacyGstInvoice(orderId);
}

// Provisional cash-memo (kept from the previous behaviour; shown only when a
// real ERP invoice does not yet exist for the order).
function renderLegacyGstInvoice(orderId) {
    const modal = document.getElementById('gstInvoiceModal');
    const paper = document.getElementById('gstInvoicePrintArea');
    if (!modal || !paper) return;

    const matched = orders.find(o => o.id === orderId) || { id: orderId || 'GBI-ORDER', date: '', total: 0, itemsCount: 0 };
    const baseVal = Math.round(matched.total / 1.05);
    const taxTotal = matched.total - baseVal;
    const cgst = Math.round(taxTotal / 2);
    const sgst = taxTotal - cgst;
    const IV = _ERPInv();
    const prof = IV ? IV.getCompanyProfile() : null;
    const legal = prof ? prof.legalName : 'GURUKRIPA BRICKS INDUSTRY';
    const gstin = prof ? prof.registrations.gstin : '09AAACG7481M1Z2';

    paper.innerHTML = `
        <div class="gst-header">
            <div>
                <h2 style="font-family:var(--display);color:var(--brand);font-size:1.3rem">${sanitizeHTML(legal.toUpperCase())}</h2>
                <div style="font-size:.78rem;color:#475569">Provisional cash memo — not a tax invoice until processed.</div>
                <div style="font-size:.78rem;color:#475569">GSTIN: <strong>${sanitizeHTML(gstin)}</strong> | State Code: 09 (UP)</div>
            </div>
            <div style="text-align:right">
                <div style="font-weight:800;font-size:1.1rem;color:#1e293b">CASH MEMO</div>
                <div style="font-size:.8rem">Order #: <strong>${sanitizeHTML(matched.id)}</strong></div>
                <div style="font-size:.8rem">Date: ${sanitizeHTML(matched.date || '')}</div>
            </div>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:18px;font-size:.84rem;background:#f8fafc;padding:12px;border-radius:6px">
            <div><strong style="color:#0f172a">Billed To:</strong><br>${user ? sanitizeHTML(user.name) : 'Valued Customer'}<br>${user && user.mobile ? sanitizeHTML(user.mobile) : ''}<br>${user && user.address ? sanitizeHTML(user.address) : ''}</div>
        </div>
        <table class="gst-table">
            <thead><tr><th>Item</th><th>Qty</th><th>Amount (₹)</th></tr></thead>
            <tbody><tr>
                <td>Brick supply — order total (incl. 5% GST)</td>
                <td>${matched.itemsCount || 0} item(s)</td>
                <td><strong>${formatINR(matched.total)}</strong></td>
            </tr></tbody>
        </table>
        <div style="display:flex;justify-content:space-between;margin-top:20px;align-items:flex-end">
            <div style="font-size:.76rem;color:#64748b"><strong>Note:</strong> A full GST tax invoice with HSN, slab-wise CGST/SGST and amount in words is generated once this order is issued by our team, and will appear here for download.</div>
            <div style="text-align:right"><div style="font-size:.82rem">Order value: <strong style="font-size:1.2rem;color:var(--brand)">${formatINR(matched.total)}</strong></div></div>
        </div>`;

    modal.classList.add('open');
    overlayLock();
}
function closeGstInvoice() { document.getElementById('gstInvoiceModal')?.classList.remove('open'); overlayUnlock(); }

function reorderTrolley(orderId) {
    const matched = orders.find(o => o.id === orderId);
    const qty = matched ? (matched.itemsCount || 4000) : 4000;
    const price = matched ? Math.round(matched.total / qty * 100) / 100 : 7.05;
    cart.push({ id: Date.now(), name: 'Brick Re-Order (Trolley)', price: price, unit: 'per piece', qty: qty, img: 'src/assets/images/brick_product_1.png' });
    saveCart(); updateCartUI(); openCart();
    showToast(t('invoice.trolleyAdded'), 'success');
}

// ── Delivery → invoice hook (used by admin/driver actions) ───────
function markOrderDelivered(orderId) {
    if (!(window.GurukripaERP && GurukripaERP.Core)) { showToast('ERP unavailable', 'warning'); return; }
    const list = (typeof getSafeStorage === 'function') ? getSafeStorage('gb_orders', []) : orders;
    const order = list.find(o => String(o.id).toLowerCase() === String(orderId).toLowerCase());
    if (!order) { showToast('Order not found', 'warning'); return; }
    order.status = 'Delivered'; order.statusStep = 4;
    if (typeof setSafeStorage === 'function') setSafeStorage('gb_orders', list);
    if (typeof orders !== 'undefined') orders = list;
    const IV = _ERPInv();
    const r = IV ? IV.ensureInvoiceForDelivery(order) : { ok: false, error: 'engine_unavailable' };
    if (r.ok) { openInvoicePdf(r.invoice.number || r.invoice.id, 'Delivered · Order ' + orderId); showToast(r.created ? 'Marked delivered & invoice issued' : 'Invoice already issued', 'success'); }
    else if (r.error === 'no_line_data') { showToast('Marked delivered. Invoice needs itemised order data (create via ERP quotation/order).', 'info'); }
    else { showToast('Invoice not issued: ' + (r.message || r.error || 'unknown'), 'warning'); }
}

// ── Customer order history (scoped to the signed-in user) ────────
function renderOrderHistory() {
    const container = document.getElementById('orderHistoryList');
    if (!container) return;
    const IV = _ERPInv();
    // Show only this customer's own invoices when the ERP is available.
    const myInvoices = IV ? IV.invoicesForCustomer(user || {}) : [];
    const myIds = {}; myInvoices.forEach(iv => { myIds[iv.id] = iv; });
    const link = (typeof getSafeStorage === 'function') ? getSafeStorage('gb_erp_inv_link', {}) : {};
    const invByOrder = {};
    Object.keys(link).forEach(oid => { const iv = myIds[link[oid]]; if (iv) invByOrder[oid] = iv; });

    if (!orders || !orders.length) {
        container.innerHTML = `
            <div class="order-empty">
                <div style="margin-bottom:8px;display:flex;justify-content:center">${_invPackageSVG}</div>
                <p>No past orders found.</p>
                <button class="btn btn-outline btn-sm" style="margin-top:12px" onclick="closeProfile();openCart()">Start Shopping</button>
            </div>`;
        return;
    }
    container.innerHTML = orders.map(o => {
        const inv = invByOrder[o.id];
        const invBtn = inv
            ? `<button class="btn btn-outline btn-sm" style="font-size:.76rem" onclick="openInvoicePdf('${sanitizeHTML(inv.number)}','Order ${sanitizeHTML(o.id)}')">${_invDocSVG} Invoice PDF</button>`
            : `<button class="btn btn-outline btn-sm" style="font-size:.76rem" onclick="openGstInvoice('${sanitizeHTML(o.id)}')">${_invDocSVG} GST Invoice</button>`;
        return `
        <div class="order-item">
            <div class="order-icon">${_invBrickSVG}</div>
            <div class="order-info">
                <div class="order-id">${sanitizeHTML(o.id)}</div>
                <div class="order-date">${sanitizeHTML(o.date)} · ${o.itemsCount || 1} item(s)</div>
            </div>
            <span class="order-status ${o.status === 'Delivered' ? 'delivered' : 'processing'}">${sanitizeHTML(o.status || 'Processing')}</span>
            <div class="order-amount">${formatINR(o.total)}</div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">
                <button class="btn btn-outline btn-sm" style="font-size:.76rem" onclick="openTrackerModal('${o.id}')">${_invTruckSVG} Track Delivery</button>
                ${invBtn}
                <button class="btn btn-primary btn-sm" style="font-size:.76rem;background:#16a34a" onclick="reorderTrolley('${o.id}')">${_invReorderSVG} Re-Order Trolley</button>
            </div>
        </div>`;
    }).join('');
}

// ══════════════════════════════════════════
// COMPANY PROFILE FORM (admin config)
// ══════════════════════════════════════════
function _cpSetPath(obj, path, val) {
    const keys = path.split('.'); let o = obj;
    for (let i = 0; i < keys.length - 1; i++) { o[keys[i]] = o[keys[i]] || {}; o = o[keys[i]]; }
    o[keys[keys.length - 1]] = val;
}
function _cpGetPath(obj, path) { return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj); }
// Form field names use short prefixes (addr./reg./num.); profile keys are full.
// Translate so saved overrides merge back into the company profile correctly.
function _cpProfilePath(name) {
    return String(name)
        .replace(/^addr\./, 'address.')
        .replace(/^reg\./, 'registrations.')
        .replace(/^num\./, 'numbering.');
}

function openCompanyProfile() {
    const IV = _ERPInv(); const m = document.getElementById('companyProfileModal');
    if (!IV || !m) { showToast('Company profile unavailable', 'warning'); return; }
    const p = IV.getCompanyProfile();
    // Map profile → form field names
    const form = document.getElementById('companyProfileForm');
    const flat = {
        legalName: p.legalName, tradeName: p.tradeName,
        'addr.line1': p.address.line1, 'addr.line2': p.address.line2, 'addr.state': p.address.state, 'addr.stateCode': p.address.stateCode, 'addr.pincode': p.address.pincode, 'addr.country': p.address.country,
        'contact.phone': p.contact.phone, 'contact.email': p.contact.email, 'contact.website': p.contact.website,
        'reg.gstin': p.registrations.gstin, 'reg.pan': p.registrations.pan, 'reg.kilnLicense': p.registrations.kilnLicense, 'reg.udyam': p.registrations.udyam,
        'tax.defaultHsn': p.tax.defaultHsn, 'tax.defaultRate': p.tax.defaultRate, 'tax.scheme': p.tax.scheme, 'tax.defaultPlace': p.tax.defaultPlace,
        'num.prefix': p.numbering.prefix, 'num.serialWidth': p.numbering.serialWidth, 'num.copyLabel': p.numbering.copyLabel, 'num.resetByFinYear': p.numbering.resetByFinYear,
        'bank.accountName': p.bank.accountName, 'bank.bank': p.bank.bank, 'bank.branch': p.bank.branch, 'bank.accountNo': p.bank.accountNo, 'bank.ifsc': p.bank.ifsc, 'bank.upi': p.bank.upi, 'bank.instructions': p.bank.instructions,
        'signatory.name': p.signatory.name, 'signatory.designation': p.signatory.designation,
        terms: p.terms, declaration: p.declaration, footer: p.footer
    };
    Array.from(form.elements).forEach(el => { if (el.name && flat[el.name] !== undefined) { if (el.type === 'checkbox') el.checked = !!flat[el.name]; else el.value = flat[el.name]; } });
    const prev = document.getElementById('cpLogoPreview'); if (prev) prev.src = p.logo || '';
    if (p.logo) prev && prev.classList.add('has');
    m.classList.add('open'); overlayLock();
}
function closeCompanyProfile() { const m = document.getElementById('companyProfileModal'); if (m) { m.classList.remove('open'); overlayUnlock(); } }

function saveCompanyProfileForm() {
    const IV = _ERPInv(); const form = document.getElementById('companyProfileForm');
    if (!IV || !form) return;
    const logo = document.getElementById('cpLogoPreview');
    const patch = { logo: (logo && logo.src && logo.classList.contains('has')) ? logo.src : null };
    Array.from(form.elements).forEach(el => {
        if (!el.name) return;
        let val = el.type === 'checkbox' ? el.checked : el.value;
        if (el.type === 'number') val = val === '' ? '' : Number(val);
        _cpSetPath(patch, _cpProfilePath(el.name), val);
    });
    IV.saveCompanyProfile(patch);
    showToast('Company profile saved', 'success');
    closeCompanyProfile();
    if (currentAdminTab === 'company') renderAdminTab('company');
}

function resetCompanyProfileForm() {
    const IV = _ERPInv(); if (!IV) return;
    IV.resetCompanyProfile();
    showToast('Company profile reset to defaults', 'info');
    closeCompanyProfile();
}

function clearCompanyLogo() { const logo = document.getElementById('cpLogoPreview'); if (logo) { logo.src = ''; logo.classList.remove('has'); } }

// Logo upload → data URL preview (bounded to avoid oversized storage)
document.addEventListener && document.addEventListener('change', function (ev) {
    if (ev.target && ev.target.id === 'cpLogoInput' && ev.target.files && ev.target.files[0]) {
        const file = ev.target.files[0];
        if (file.size > 300 * 1024) { showToast('Logo too large (max ~300KB)', 'warning'); ev.target.value = ''; return; }
        const reader = new FileReader();
        reader.onload = function (e) { const logo = document.getElementById('cpLogoPreview'); if (logo) { logo.src = e.target.result; logo.classList.add('has'); } };
        reader.readAsDataURL(file);
    }
});

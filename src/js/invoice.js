// ══════════════════════════════════════════
// GST INVOICE & RE-ORDER
// ══════════════════════════════════════════
const _invPackageSVG = `<svg width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`;
const _invBrickSVG = `<svg width="22" height="22" fill="none" stroke="var(--brand)" stroke-width="1.8" viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="7" width="20" height="10" rx="1.5"/><line x1="8" y1="7" x2="8" y2="17"/><line x1="16" y1="7" x2="16" y2="17"/></svg>`;
const _invTruckSVG = `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>`;
const _invDocSVG = `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`;
const _invReorderSVG = `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>`;

function openGstInvoice(orderId) {
    const modal = document.getElementById('gstInvoiceModal');
    const paper = document.getElementById('gstInvoicePrintArea');
    if (!modal || !paper) return;

    const matched  = orders.find(o => o.id === orderId) || { id: orderId || 'GBI-20260728-4912', date: '28/07/2026', total: 28200, itemsCount: 4000 };
    const baseVal  = Math.round(matched.total / 1.05);
    const taxTotal = matched.total - baseVal;
    const cgst     = Math.round(taxTotal / 2);
    const sgst     = taxTotal - cgst;

    paper.innerHTML = `
        <div class="gst-header">
            <div>
                <h2 style="font-family:var(--display);color:var(--brand);font-size:1.3rem">GURUKRIPA BRICKS INDUSTRY</h2>
                <div style="font-size:.78rem;color:#475569">Reg. Address: Bhatta Yard, Jaunpur - Varanasi Highway, UP</div>
                <div style="font-size:.78rem;color:#475569">GSTIN: <strong>09AAACG7481M1Z2</strong> | State Code: 09 (UP)</div>
                <div style="font-size:.78rem;color:#475569">Kiln License: GBI/JNP/1998/412</div>
            </div>
            <div style="text-align:right">
                <div style="font-weight:800;font-size:1.1rem;color:#1e293b">TAX INVOICE</div>
                <div style="font-size:.8rem">Invoice #: <strong>INV-${matched.id}</strong></div>
                <div style="font-size:.8rem">Date: ${matched.date}</div>
            </div>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:18px;font-size:.84rem;background:#f8fafc;padding:12px;border-radius:6px">
            <div><strong style="color:#0f172a">Billed To:</strong><br>${user ? sanitizeHTML(user.name) : 'Valued Customer'}<br>${user && user.mobile ? sanitizeHTML(user.mobile) : '+91 91989 23230'}<br>${user && user.address ? sanitizeHTML(user.address) : 'Jaunpur, Uttar Pradesh'}</div>
            <div style="text-align:right"><strong>Dispatch Kiln Location:</strong><br>Gurukripa Brick Kiln Unit-1<br>Jaunpur District, UP</div>
        </div>
        <table class="gst-table">
            <thead><tr><th>HSN/SAC</th><th>Item</th><th>Qty</th><th>Rate (₹)</th><th>Taxable</th><th>CGST 2.5%</th><th>SGST 2.5%</th><th>Total (₹)</th></tr></thead>
            <tbody><tr>
                <td>6901</td>
                <td>Awwal / Grade-A Red Clay Building Bricks</td>
                <td>${matched.itemsCount || 4000} pcs</td>
                <td>₹${((matched.total / (matched.itemsCount || 4000))).toFixed(2)}</td>
                <td>${formatINR(baseVal)}</td>
                <td>${formatINR(cgst)}</td>
                <td>${formatINR(sgst)}</td>
                <td><strong>${formatINR(matched.total)}</strong></td>
            </tr></tbody>
        </table>
        <div style="display:flex;justify-content:space-between;margin-top:20px;align-items:flex-end">
            <div style="font-size:.76rem;color:#64748b">
                <strong>Terms &amp; Conditions:</strong><br>
                1. Goods once sold &amp; verified at site will not be taken back.<br>
                2. Subject to Jaunpur Jurisdiction.<br>
                3. Computer generated tax memo — no signature required.
            </div>
            <div style="text-align:right">
                <div style="font-size:.82rem">Grand Total: <strong style="font-size:1.2rem;color:var(--brand)">${formatINR(matched.total)}</strong></div>
                <div style="font-size:.72rem;color:#16a34a;font-weight:700">✓ PAID IN FULL</div>
            </div>
        </div>`;

    modal.classList.add('open');
    overlayLock();
}

function closeGstInvoice() {
    document.getElementById('gstInvoiceModal')?.classList.remove('open');
    overlayUnlock();
}

function reorderTrolley(orderId) {
    const matched = orders.find(o => o.id === orderId);
    const qty     = matched ? (matched.itemsCount || 4000) : 4000;
    const price   = matched ? Math.round(matched.total / qty * 100) / 100 : 7.05;
    cart.push({
        id: Date.now(),
        name: 'Brick Re-Order (Trolley)',
        price: price,
        unit: 'per piece',
        qty: qty,
        img: 'src/assets/images/brick_product_1.png'
    });
    saveCart();
    updateCartUI();
    openCart();
    showToast(t('invoice.trolleyAdded'), 'success');
}

function renderOrderHistory() {
    const container = document.getElementById('orderHistoryList');
    if (!container) return;
    if (!orders || !orders.length) {
        container.innerHTML = `
            <div class="order-empty">
                <div style="margin-bottom:8px;display:flex;justify-content:center">${_invPackageSVG}</div>
                <p>No past orders found.</p>
                <button class="btn btn-outline btn-sm" style="margin-top:12px" onclick="closeProfile();openCart()">Start Shopping</button>
            </div>`;
        return;
    }
    container.innerHTML = orders.map(o => `
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
                <button class="btn btn-outline btn-sm" style="font-size:.76rem" onclick="openGstInvoice('${o.id}')">${_invDocSVG} GST Invoice</button>
                <button class="btn btn-primary btn-sm" style="font-size:.76rem;background:#16a34a" onclick="reorderTrolley('${o.id}')">${_invReorderSVG} Re-Order Trolley</button>
            </div>
        </div>
    `).join('');
}

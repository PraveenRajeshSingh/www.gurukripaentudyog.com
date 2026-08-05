// ══════════════════════════════════════════
// GST INVOICE & RE-ORDER
// ══════════════════════════════════════════
function openGstInvoice(orderId) {
    const modal = document.getElementById('gstInvoiceModal');
    const paper = document.getElementById('gstInvoicePrintArea');
    if (!modal || !paper) return;

    const matched  = orders.find(o => o.id === orderId) || { id: orderId || 'GBI-20260728-4912', date: '28/07/2026', total: 28200, itemsCount: 4000 };
    const baseVal  = Math.round(matched.total / 1.05);
    const cgst     = Math.round((matched.total - baseVal) / 2);
    const sgst     = cgst;

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
                <td>₹${baseVal.toLocaleString('en-IN')}</td>
                <td>₹${cgst.toLocaleString('en-IN')}</td>
                <td>₹${sgst.toLocaleString('en-IN')}</td>
                <td><strong>₹${matched.total.toLocaleString('en-IN')}</strong></td>
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
                <div style="font-size:.82rem">Grand Total: <strong style="font-size:1.2rem;color:var(--brand)">₹${matched.total.toLocaleString('en-IN')}</strong></div>
                <div style="font-size:.72rem;color:#16a34a;font-weight:700">✓ PAID IN FULL</div>
            </div>
        </div>`;

    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeGstInvoice() {
    document.getElementById('gstInvoiceModal')?.classList.remove('open');
    document.body.style.overflow = '';
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
    showToast('🔄 Trolley re-order added to cart!', 'success');
}

function renderOrderHistory() {
    const container = document.getElementById('orderHistoryList');
    if (!container) return;
    if (!orders || !orders.length) {
        container.innerHTML = `
            <div class="order-empty">
                <div style="font-size:2rem;margin-bottom:8px">📦</div>
                <p>No past orders found.</p>
                <button class="btn btn-outline btn-sm" style="margin-top:12px" onclick="closeProfile();openCart()">Start Shopping</button>
            </div>`;
        return;
    }
    container.innerHTML = orders.map(o => `
        <div class="order-item">
            <div class="order-icon">🧱</div>
            <div class="order-info">
                <div class="order-id">${sanitizeHTML(o.id)}</div>
                <div class="order-date">${sanitizeHTML(o.date)} · ${o.itemsCount || 1} item(s)</div>
            </div>
            <span class="order-status ${o.status === 'Delivered' ? 'delivered' : 'processing'}">${sanitizeHTML(o.status || 'Processing')}</span>
            <div class="order-amount">₹${o.total.toLocaleString('en-IN')}</div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">
                <button class="btn btn-outline btn-sm" style="font-size:.76rem" onclick="openTrackerModal('${o.id}')">🚛 Track Delivery</button>
                <button class="btn btn-outline btn-sm" style="font-size:.76rem" onclick="openGstInvoice('${o.id}')">📄 GST Invoice</button>
                <button class="btn btn-primary btn-sm" style="font-size:.76rem;background:#16a34a" onclick="reorderTrolley('${o.id}')">🔄 Re-Order Trolley</button>
            </div>
        </div>
    `).join('');
}

// ══════════════════════════════════════════
// GURUKRIPA BRICKS ADMIN & LOGISTICS CONSOLE
// ══════════════════════════════════════════

let currentAdminTab = 'overview';

function openAdminPortal() {
    const modal = document.getElementById('adminPortalModal');
    if (modal) {
        // Seed the ERP operating user + item master from the storefront catalog
        if (window.GurukripaERP && GurukripaERP.Core) {
            GurukripaERP.Core.setActor((typeof user !== 'undefined' && user) ? user : { name: 'Admin', role: 'owner' });
            if (GurukripaERP.Inventory && typeof PRODUCTS !== 'undefined') {
                GurukripaERP.Inventory.bootstrapFromProducts(PRODUCTS);
            }
        }
        modal.classList.add('open');
        overlayLock();
        renderAdminTab('overview');
    }
}

function closeAdminPortal() {
    const modal = document.getElementById('adminPortalModal');
    if (modal) {
        modal.classList.remove('open');
        overlayUnlock();
    }
}

function switchAdminTab(tab, btn) {
    currentAdminTab = tab;
    document.querySelectorAll('.admin-nav-item').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    renderAdminTab(tab);
}

// CSV exports from real ERP records (uses Analytics + browser download)
function erpExport(kind) {
    if (!(window.GurukripaERP && GurukripaERP.Analytics)) { showToast('ERP analytics unavailable', 'warning'); return; }
    const A = GurukripaERP.Analytics;
    let name = 'erp-export.csv', csv = '';
    if (kind === 'invoices') { name = 'invoices.csv'; csv = A.exportInvoicesCSV(); }
    else if (kind === 'aging') { name = 'aging.csv'; csv = A.exportAgingCSV(); }
    else if (kind === 'sales') { name = 'sales.csv'; csv = A.exportSalesCSV(); }
    else if (kind === 'stock') {
        const rows = GurukripaERP.Inventory ? GurukripaERP.Inventory.allStock() : [];
        name = 'stock.csv';
        csv = A.toCSV(rows.map(r => ({ item: r.item, name: r.name, sku: r.sku, onHand: r.onHand, reserved: r.reserved, available: r.available, reorderLevel: r.reorderLevel })), ['item', 'name', 'sku', 'onHand', 'reserved', 'available', 'reorderLevel']);
    }
    if (!csv.trim()) { showToast('Nothing to export yet', 'warning'); return; }
    if (A.download(name, csv)) showToast('Export downloaded', 'success');
    else showToast('Export unavailable in this environment', 'warning');
}

function renderAdminTab(tab) {
    const stage = document.getElementById('adminStage');
    if (!stage) return;

    if (tab === 'overview') {
        const quotes = (window.GurukripaServices && window.GurukripaServices.QuotationService)
            ? window.GurukripaServices.QuotationService.getAllQuotations()
            : [];
        const orders = (window.GurukripaServices && window.GurukripaServices.OrderService)
            ? window.GurukripaServices.OrderService.getAllOrders()
            : [];
        // Real ERP metrics (computed from finalized documents — never hardcoded)
        const A = (window.GurukripaERP && GurukripaERP.Analytics) ? GurukripaERP.Analytics : null;
        const k = A ? A.kpi('month') : null;
        const low = A ? A.lowStock() : [];
        const money = n => '₹' + Number(n || 0).toLocaleString('en-IN');
        const arrow = p => p > 0 ? '<span style="color:var(--success)">▲ ' + p + '%</span>'
                        : p < 0 ? '<span style="color:var(--danger)">▼ ' + Math.abs(p) + '%</span>'
                        : '<span style="color:var(--ink-3)">— 0%</span>';

        stage.innerHTML = `
            <div style="margin-bottom:20px">
                <h4 style="font-family:var(--display);font-size:1.3rem;color:var(--ink);margin-bottom:4px">Bhatta Operations Overview</h4>
                <p style="font-size:0.85rem;color:var(--ink-3)">Real-time yard dispatch metrics, B2B wholesale enquiries &amp; customer orders.</p>
            </div>

            <!-- KPI Metric Cards (live, from ERP documents) -->
            <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:16px;margin-bottom:24px">
                <div style="background:var(--bg-card);border:1px solid var(--line);border-radius:12px;padding:16px;box-shadow:var(--sh-card)">
                    <div style="font-size:0.75rem;color:var(--ink-3);font-weight:700;text-transform:uppercase">Sales This Month</div>
                    <div style="font-size:1.8rem;font-weight:800;color:var(--brand);margin-top:4px">${k ? money(k.sales.period) : '—'}</div>
                    <div style="font-size:0.72rem;color:var(--ink-3);margin-top:2px">${k ? arrow(k.sales.changePct) + ' vs prev · today ' + money(k.sales.today) : ''}</div>
                </div>
                <div style="background:var(--bg-card);border:1px solid var(--line);border-radius:12px;padding:16px;box-shadow:var(--sh-card)">
                    <div style="font-size:0.75rem;color:var(--ink-3);font-weight:700;text-transform:uppercase">Invoiced Orders</div>
                    <div style="font-size:1.8rem;font-weight:800;color:var(--ink);margin-top:4px">${k ? k.orders.count : orders.length}</div>
                    <div style="font-size:0.72rem;color:var(--ink-3);margin-top:2px">${k ? 'AOV ' + money(k.orders.aov) + ' · ' + arrow(k.orders.changePct) : ''}</div>
                </div>
                <div style="background:var(--bg-card);border:1px solid var(--line);border-radius:12px;padding:16px;box-shadow:var(--sh-card)">
                    <div style="font-size:0.75rem;color:var(--ink-3);font-weight:700;text-transform:uppercase">Outstanding Receivables</div>
                    <div style="font-size:1.8rem;font-weight:800;color:var(--warning);margin-top:4px">${k ? money(k.receivables.outstanding) : '—'}</div>
                    <div style="font-size:0.72rem;color:var(--ink-3);margin-top:2px">${k ? 'Collected ' + money(k.receivables.collected) + ' · Overdue ' + money(k.receivables.overdue) : ''}</div>
                </div>
                <div style="background:var(--bg-card);border:1px solid var(--line);border-radius:12px;padding:16px;box-shadow:var(--sh-card)">
                    <div style="font-size:0.75rem;color:var(--ink-3);font-weight:700;text-transform:uppercase">Low-Stock SKUs</div>
                    <div style="font-size:1.8rem;font-weight:800;color:${low.length ? 'var(--danger)' : 'var(--success)'};margin-top:4px">${low.length}</div>
                    <div style="font-size:0.72rem;color:var(--ink-3);margin-top:2px">${quotes.length} open RFQ enquiries</div>
                </div>
            </div>

            <!-- Recent RFQs Table -->
            <div style="background:var(--bg-card);border:1px solid var(--line);border-radius:12px;padding:20px;box-shadow:var(--sh-card)">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
                    <h5 style="font-size:1rem;color:var(--ink);font-weight:700;margin:0">Recent B2B Bulk RFQ Quotation Requests</h5>
                    <button class="btn btn-outline btn-sm" onclick="switchAdminTab('quotations')">View All</button>
                </div>
                <div style="overflow-x:auto">
                    <table style="width:100%;border-collapse:collapse;font-size:0.84rem;text-align:left">
                        <thead>
                            <tr style="border-bottom:1.5px solid var(--line);color:var(--ink-3)">
                                <th style="padding:10px 8px">Ref Number</th>
                                <th style="padding:10px 8px">Buyer / Project</th>
                                <th style="padding:10px 8px">Phone</th>
                                <th style="padding:10px 8px">Brick Grade</th>
                                <th style="padding:10px 8px">Quantity</th>
                                <th style="padding:10px 8px">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${quotes.length ? quotes.map(q => `
                                <tr style="border-bottom:1px solid var(--line)">
                                    <td style="padding:10px 8px;font-weight:700;color:var(--brand)">${sanitizeHTML(q.id)}</td>
                                    <td style="padding:10px 8px"><strong>${sanitizeHTML(q.name)}</strong><br><small style="color:var(--ink-3)">${sanitizeHTML(q.company)}</small></td>
                                    <td style="padding:10px 8px">${sanitizeHTML(q.phone)}</td>
                                    <td style="padding:10px 8px">${sanitizeHTML(q.product)}</td>
                                    <td style="padding:10px 8px;font-weight:600">${formatNum(q.qty)} pcs</td>
                                    <td style="padding:10px 8px"><span style="background:var(--warning-bg);color:var(--warning);padding:3px 8px;border-radius:12px;font-size:0.75rem;font-weight:700">Pending Followup</span></td>
                                </tr>
                            `).join('') : `
                                <tr><td colspan="6" style="padding:20px;text-align:center;color:var(--ink-3)">No active RFQ enquiries. Submit from homepage "Request Bulk Quote".</td></tr>
                            `}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    } else if (tab === 'quotations') {
        const quotes = (window.GurukripaServices && window.GurukripaServices.QuotationService)
            ? window.GurukripaServices.QuotationService.getAllQuotations()
            : [];
        stage.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px">
                <div>
                    <h4 style="font-family:var(--display);font-size:1.3rem;color:var(--ink);margin:0">B2B Wholesale Quotations</h4>
                    <p style="font-size:0.82rem;color:var(--ink-3);margin-top:2px">Incoming builder RFQs &amp; generated contractor price sheets.</p>
                </div>
                <button class="btn btn-primary btn-sm" onclick="openBulkQuoteModal()">+ Create New RFQ</button>
            </div>
            <div style="background:var(--bg-card);border:1px solid var(--line);border-radius:12px;padding:16px">
                ${quotes.length ? quotes.map(q => `
                    <div style="border-bottom:1px solid var(--line);padding:14px 0;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
                        <div>
                            <div style="font-weight:700;font-size:0.95rem;color:var(--brand)">${sanitizeHTML(q.id)} — ${sanitizeHTML(q.name)} (${sanitizeHTML(q.company)})</div>
                            <div style="font-size:0.8rem;color:var(--ink-2);margin-top:4px">
                                📍 Delivery Site: ${sanitizeHTML(q.site)} | Road: ${sanitizeHTML(q.roadAccess)} | Unloading: ${sanitizeHTML(q.unloadingReq)}
                            </div>
                            <div style="font-size:0.78rem;color:var(--ink-3);margin-top:2px">
                                Product: <strong>${sanitizeHTML(q.product)}</strong> | Req Count: <strong>${formatNum(q.qty)} pcs</strong>
                            </div>
                        </div>
                        <div style="display:flex;gap:8px">
                            <a href="https://wa.me/${q.phone.replace(/[^0-9]/g, '')}?text=Namaste ${encodeURIComponent(q.name)}, regarding your quotation ${q.id} for ${q.qty} bricks from Gurukripa Bricks Industry..." target="_blank" class="btn btn-outline btn-sm">💬 WhatsApp Call</a>
                            <button class="btn btn-primary btn-sm" onclick="showToast('Quotation PDF generated and sent to customer')">Send Final PDF</button>
                        </div>
                    </div>
                `).join('') : '<p style="text-align:center;padding:30px;color:var(--ink-3)">No active quotes found.</p>'}
            </div>
        `;
    } else if (tab === 'orders') {
        const list = (window.GurukripaServices && GurukripaServices.OrderService)
            ? GurukripaServices.OrderService.getAllOrders() : (orders || []);
        const IV = _erpInv();
        const money = n => '₹' + Number(n || 0).toLocaleString('en-IN');
        const link = (typeof getSafeStorage === 'function') ? getSafeStorage('gb_erp_inv_link', {}) : {};
        const rows = list.length ? list.map(o => {
            const inv = link[o.id] && IV ? IV.invoiceForOrder(o.id) : null;
            const delivered = /deliver/i.test(o.status || '');
            const action = inv
                ? `<button class="btn btn-outline btn-sm" onclick="openInvoicePdf('${sanitizeHTML(inv.number)}','Order ${sanitizeHTML(o.id)}')">📄 Invoice PDF</button>`
                : (delivered
                    ? `<button class="btn btn-primary btn-sm" onclick="markOrderDelivered('${sanitizeHTML(o.id)}')">Issue invoice</button>`
                    : `<button class="btn btn-outline btn-sm" onclick="markOrderDelivered('${sanitizeHTML(o.id)}')">✓ Mark delivered</button>`);
            return `<tr style="border-bottom:1px solid var(--line)">
                <td style="padding:10px 8px"><strong style="color:var(--brand)">${sanitizeHTML(o.id)}</strong><br><small style="color:var(--ink-3)">${sanitizeHTML(o.date || '')}</small></td>
                <td style="padding:10px 8px">${sanitizeHTML((o.customer && o.customer.name) || '—')}</td>
                <td style="padding:10px 8px;text-align:right">${money(o.total)}</td>
                <td style="padding:10px 8px"><span style="background:${delivered ? 'var(--success-bg,rgba(22,163,74,.12))' : 'var(--warning-bg)'};color:${delivered ? 'var(--success)' : 'var(--warning)'};padding:3px 8px;border-radius:12px;font-size:.75rem;font-weight:700">${sanitizeHTML(o.status || 'Processing')}</span></td>
                <td style="padding:10px 8px;text-align:right">${inv ? '<span style="color:var(--success);font-size:.75rem;font-weight:700">Invoiced</span>' : '<span style="color:var(--ink-3);font-size:.75rem">Not billed</span>'}</td>
                <td style="padding:10px 8px;text-align:right">${action}</td>
            </tr>`;
        }).join('') : `<tr><td colspan="6" style="padding:22px;text-align:center;color:var(--ink-3)">No orders yet.</td></tr>`;
        stage.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
                <div><h4 style="font-family:var(--display);font-size:1.3rem;color:var(--ink);margin:0">Customer &amp; Dealer Orders</h4>
                <p style="font-size:.82rem;color:var(--ink-3);margin-top:2px">Real orders from checkout &amp; B2B. Marking an order delivered issues its GST invoice (idempotent — retried events never double-bill).</p></div>
                <button class="btn btn-outline btn-sm" onclick="switchAdminTab('invoices')">Open Invoice Manager</button>
            </div>
            <div style="background:var(--bg-card);border:1px solid var(--line);border-radius:12px;padding:12px;overflow-x:auto">
                <table style="width:100%;border-collapse:collapse;font-size:.84rem;text-align:left">
                    <thead><tr style="border-bottom:1.5px solid var(--line);color:var(--ink-3)"><th style="padding:10px 8px">Order</th><th style="padding:10px 8px">Customer</th><th style="padding:10px 8px;text-align:right">Total</th><th style="padding:10px 8px">Status</th><th style="padding:10px 8px;text-align:right">Billing</th><th style="padding:10px 8px;text-align:right">Action</th></tr></thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        `;
    } else if (tab === 'invoices') {
        const IV = _erpInv();
        if (!IV) { stage.innerHTML = '<p style="padding:20px;color:var(--ink-3)">Invoice engine unavailable.</p>'; return; }
        const q = (document.getElementById('invSearch') || {}).value || '';
        const status = (document.getElementById('invStatus') || {}).value || '';
        const from = (document.getElementById('invFrom') || {}).value || '';
        const to = (document.getElementById('invTo') || {}).value || '';
        const list = IV.listInvoices({ q: q, status: status || undefined, from: from || undefined, to: to || undefined });
        const rep = IV.invoiceReport(from || undefined, to || undefined);
        const money = n => '₹' + Number(n || 0).toLocaleString('en-IN');
        const canDo = GurukripaERP.Core.can(GurukripaERP.Core.currentActor(), 'invoice.cancel');
        const rows = list.length ? list.map(inv => {
            const cu = inv.customerId && GurukripaERP.CRM ? GurukripaERP.CRM.getCustomer(inv.customerId) : null;
            const sc = { paid: 'var(--success)', partially_paid: 'var(--warning)', draft: 'var(--ink-3)', cancelled: 'var(--danger)' }[inv.status] || 'var(--danger)';
            const overdue = inv.balance > 0 && inv.dueDate && new Date(inv.dueDate) < new Date();
            return `<tr style="border-bottom:1px solid var(--line)">
                <td style="padding:10px 8px"><strong style="color:var(--brand)">${sanitizeHTML(inv.number)}</strong><br><small style="color:var(--ink-3)">${sanitizeHTML(IV.dateFmt(inv.date))}</small></td>
                <td style="padding:10px 8px">${sanitizeHTML(cu ? cu.name : (inv.customerId || '—'))}</td>
                <td style="padding:10px 8px;text-align:right">${money(inv.totals.grandTotal)}</td>
                <td style="padding:10px 8px;text-align:right;color:var(--success)">${money(inv.paidTotal || 0)}</td>
                <td style="padding:10px 8px;text-align:right;color:${overdue ? 'var(--danger)' : 'var(--ink)'}">${money(inv.balance || 0)}</td>
                <td style="padding:10px 8px"><span style="color:${sc};font-weight:700;font-size:.78rem">${sanitizeHTML((inv.status || '').toUpperCase())}${overdue ? ' · OVERDUE' : ''}</span></td>
                <td style="padding:10px 8px;text-align:right;white-space:nowrap">
                    <button class="btn btn-outline btn-sm" onclick="openInvoicePdf('${sanitizeHTML(inv.number)}')">👁 Preview</button>
                    <button class="btn btn-outline btn-sm" onclick="printInvoiceByNumber('${sanitizeHTML(inv.number)}')">🖨 PDF</button>
                    ${canDo && inv.status !== 'cancelled' ? `<button class="btn btn-outline btn-sm" onclick="creditNoteAction('${sanitizeHTML(inv.number)}')">Credit</button><button class="btn btn-outline btn-sm" onclick="cancelInvoiceAction('${sanitizeHTML(inv.number)}')">Cancel</button>` : ''}
                </td>
            </tr>`;
        }).join('') : `<tr><td colspan="7" style="padding:22px;text-align:center;color:var(--ink-3)">No invoices match. Invoices appear here once orders are delivered or created via ERP documents.</td></tr>`;
        stage.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:10px">
                <div><h4 style="font-family:var(--display);font-size:1.3rem;color:var(--ink);margin:0">Invoice Management</h4>
                <p style="font-size:.82rem;color:var(--ink-3);margin-top:2px">Every finalized GST invoice — preview, PDF, corrections and audit.</p></div>
                <button class="btn btn-outline btn-sm" onclick="erpExport('invoices')">Export CSV</button>
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:16px">
                <div style="background:var(--bg-card);border:1px solid var(--line);border-radius:10px;padding:14px"><div style="font-size:.72rem;color:var(--ink-3);text-transform:uppercase;font-weight:700">Total invoiced</div><div style="font-size:1.3rem;font-weight:800;color:var(--brand)">${money(rep.invoiced)}</div></div>
                <div style="background:var(--bg-card);border:1px solid var(--line);border-radius:10px;padding:14px"><div style="font-size:.72rem;color:var(--ink-3);text-transform:uppercase;font-weight:700">Tax collected</div><div style="font-size:1.3rem;font-weight:800">${money(rep.tax)}</div></div>
                <div style="background:var(--bg-card);border:1px solid var(--line);border-radius:10px;padding:14px"><div style="font-size:.72rem;color:var(--ink-3);text-transform:uppercase;font-weight:700">Received</div><div style="font-size:1.3rem;font-weight:800;color:var(--success)">${money(rep.received)}</div></div>
                <div style="background:var(--bg-card);border:1px solid var(--line);border-radius:10px;padding:14px"><div style="font-size:.72rem;color:var(--ink-3);text-transform:uppercase;font-weight:700">Outstanding</div><div style="font-size:1.3rem;font-weight:800;color:var(--warning)">${money(rep.outstanding)}</div></div>
            </div>
            <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px">
                <input id="invSearch" placeholder="Search number / customer / order" value="${sanitizeHTML(q)}" style="flex:1;min-width:180px;padding:8px 10px;border:1px solid var(--line);border-radius:8px" oninput="renderAdminTab('invoices')" />
                <select id="invStatus" onchange="renderAdminTab('invoices')" style="padding:8px;border:1px solid var(--line);border-radius:8px"><option value="">All statuses</option>${['draft', 'finalized', 'partially_paid', 'paid', 'cancelled'].map(s => `<option value="${s}" ${s === status ? 'selected' : ''}>${s}</option>`).join('')}</select>
                <input id="invFrom" type="date" value="${sanitizeHTML(from)}" onchange="renderAdminTab('invoices')" style="padding:8px;border:1px solid var(--line);border-radius:8px" />
                <input id="invTo" type="date" value="${sanitizeHTML(to)}" onchange="renderAdminTab('invoices')" style="padding:8px;border:1px solid var(--line);border-radius:8px" />
            </div>
            <div style="background:var(--bg-card);border:1px solid var(--line);border-radius:12px;padding:12px;overflow-x:auto">
                <table style="width:100%;border-collapse:collapse;font-size:.82rem;text-align:left">
                    <thead><tr style="border-bottom:1.5px solid var(--line);color:var(--ink-3)"><th style="padding:10px 8px">Invoice</th><th style="padding:10px 8px">Customer</th><th style="padding:10px 8px;text-align:right">Total</th><th style="padding:10px 8px;text-align:right">Paid</th><th style="padding:10px 8px;text-align:right">Balance</th><th style="padding:10px 8px">Status</th><th style="padding:10px 8px;text-align:right">Actions</th></tr></thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        `;
    } else if (tab === 'company') {
        const IV = _erpInv();
        if (!IV) { stage.innerHTML = '<p style="padding:20px;color:var(--ink-3)">Invoice engine unavailable.</p>'; return; }
        const p = IV.getCompanyProfile();
        stage.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
                <div><h4 style="font-family:var(--display);font-size:1.3rem;color:var(--ink);margin:0">Company Profile</h4>
                <p style="font-size:.82rem;color:var(--ink-3);margin-top:2px">These details print on every invoice. Stored locally on this device.</p></div>
                <button class="btn btn-primary btn-sm" onclick="openCompanyProfile()">✎ Edit profile</button>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
                <div style="background:var(--bg-card);border:1px solid var(--line);border-radius:12px;padding:18px">
                    <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">${p.logo ? '<img src="' + p.logo + '" style="width:48px;height:48px;object-fit:contain;border:1px solid var(--line);border-radius:8px"/>' : ''}<div><strong style="font-size:1.1rem;color:var(--brand)">${sanitizeHTML(p.legalName)}</strong><div style="font-size:.8rem;color:var(--ink-3)">${sanitizeHTML(p.tradeName || '')}</div></div></div>
                    <p style="font-size:.85rem;color:var(--ink-2);line-height:1.6">${sanitizeHTML(p.address.line1)}${p.address.line2 ? ', ' + sanitizeHTML(p.address.line2) : ''}<br/>${sanitizeHTML(p.address.state)}${p.address.stateCode ? ' (' + sanitizeHTML(p.address.stateCode) + ')' : ''}${p.address.pincode ? ' - ' + sanitizeHTML(p.address.pincode) : ''}<br/>${sanitizeHTML(p.contact.phone || '')} · ${sanitizeHTML(p.contact.email || '')}</p>
                    <p style="font-size:.82rem;color:var(--ink-3);margin-top:8px">GSTIN <strong>${sanitizeHTML(p.registrations.gstin || '—')}</strong> · PAN ${sanitizeHTML(p.registrations.pan || '—')}</p>
                </div>
                <div style="background:var(--bg-card);border:1px solid var(--line);border-radius:12px;padding:18px;font-size:.85rem;line-height:1.8">
                    <strong>Invoice numbering:</strong> ${sanitizeHTML(p.numbering.prefix)} · ${p.numbering.resetByFinYear ? 'per financial year' : 'continuous'} (serial width ${p.numbering.serialWidth})<br/>
                    <strong>Default tax:</strong> ${sanitizeHTML(p.tax.scheme)} · ${p.tax.defaultRate}% GST · ${sanitizeHTML(p.tax.defaultPlace)}<br/>
                    <strong>Bank / UPI:</strong> ${sanitizeHTML(p.bank.bank || '—')}${p.bank.upi ? ' · UPI ' + sanitizeHTML(p.bank.upi) : ''}<br/>
                    <strong>Signatory:</strong> ${sanitizeHTML(p.signatory.name || '—')}
                </div>
            </div>
        `;
    } else if (tab === 'inventory') {
        const Inv = (window.GurukripaERP && GurukripaERP.Inventory) ? GurukripaERP.Inventory : null;
        const stock = Inv ? Inv.allStock() : [];
        const val = Inv ? Inv.valuation() : { available: false };
        const money = n => '₹' + Number(n || 0).toLocaleString('en-IN');
        const rows = stock.length ? stock.map(s => `
            <tr style="border-bottom:1px solid var(--line)">
                <td style="padding:10px 8px"><strong>${sanitizeHTML(s.name || s.item)}</strong><br><small style="color:var(--ink-3)">${sanitizeHTML(s.sku || '')}</small></td>
                <td style="padding:10px 8px;text-align:right">${formatNum(s.onHand)}</td>
                <td style="padding:10px 8px;text-align:right;color:var(--ink-3)">${formatNum(s.reserved)}</td>
                <td style="padding:10px 8px;text-align:right;font-weight:700">${formatNum(s.available)}</td>
                <td style="padding:10px 8px;text-align:right;color:var(--ink-3)">${formatNum(s.reorderLevel)}</td>
                <td style="padding:10px 8px;text-align:right">${s.belowReorder ? '<span style="background:var(--danger-bg);color:var(--danger);padding:3px 8px;border-radius:12px;font-size:.72rem;font-weight:700">Reorder</span>' : '<span style="color:var(--success);font-size:.75rem">✓ OK</span>'}</td>
            </tr>`).join('') : `<tr><td colspan="6" style="padding:22px;text-align:center;color:var(--ink-3)">No stock movements recorded yet. Post goods-received entries to build the yard ledger.</td></tr>`;
        stage.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
                <div>
                    <h4 style="font-family:var(--display);font-size:1.3rem;color:var(--ink);margin:0">Yard Stock Ledger</h4>
                    <p style="font-size:0.82rem;color:var(--ink-3);margin-top:2px">Balances derived from the immutable stock-movement ledger (pcs).</p>
                </div>
                <button class="btn btn-outline btn-sm" onclick="erpExport('stock')">Export CSV</button>
            </div>
            <div style="background:var(--bg-card);border:1px solid var(--line);border-radius:12px;padding:16px 20px;margin-bottom:16px;font-size:0.85rem">
                <strong>Stock valuation:</strong> ${val.available ? money(val.total) + ' <span style="color:var(--ink-3)">(weighted-average)</span>' : '<span style="color:var(--ink-3)">' + sanitizeHTML(val.reason || 'Not available — no cost data.') + '</span>'}
            </div>
            <div style="background:var(--bg-card);border:1px solid var(--line);border-radius:12px;padding:12px;overflow-x:auto">
                <table style="width:100%;border-collapse:collapse;font-size:0.84rem;text-align:left">
                    <thead><tr style="border-bottom:1.5px solid var(--line);color:var(--ink-3)">
                        <th style="padding:10px 8px">Item</th><th style="padding:10px 8px;text-align:right">On hand</th>
                        <th style="padding:10px 8px;text-align:right">Reserved</th><th style="padding:10px 8px;text-align:right">Available</th>
                        <th style="padding:10px 8px;text-align:right">Reorder lvl</th><th style="padding:10px 8px;text-align:right">Status</th>
                    </tr></thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        `;
    } else if (tab === 'dispatch') {
        const A = (window.GurukripaERP && GurukripaERP.Analytics) ? GurukripaERP.Analytics : null;
        const pending = A ? A.pendingDeliveries() : [];
        const perf = A ? A.deliveryPerformance() : { total: 0, delivered: 0, pending: 0, rate: 0 };
        stage.innerHTML = `
            <h4 style="font-family:var(--display);font-size:1.3rem;color:var(--ink);margin-bottom:4px">Dispatch &amp; Delivery</h4>
            <p style="font-size:0.85rem;color:var(--ink-3);margin-bottom:16px">Delivery challans and dispatch status derived from ERP documents.</p>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:16px">
                <div style="background:var(--bg-card);border:1px solid var(--line);border-radius:10px;padding:14px"><div style="font-size:.72rem;color:var(--ink-3);text-transform:uppercase;font-weight:700">Challans</div><div style="font-size:1.5rem;font-weight:800">${perf.total}</div></div>
                <div style="background:var(--bg-card);border:1px solid var(--line);border-radius:10px;padding:14px"><div style="font-size:.72rem;color:var(--ink-3);text-transform:uppercase;font-weight:700">Delivered</div><div style="font-size:1.5rem;font-weight:800;color:var(--success)">${perf.delivered}</div></div>
                <div style="background:var(--bg-card);border:1px solid var(--line);border-radius:10px;padding:14px"><div style="font-size:.72rem;color:var(--ink-3);text-transform:uppercase;font-weight:700">Pending</div><div style="font-size:1.5rem;font-weight:800;color:var(--warning)">${perf.pending}</div></div>
            </div>
            <div style="background:var(--bg-card);border:1px solid var(--line);border-radius:12px;padding:18px">
                ${pending.length ? pending.map(c => `<div style="padding:10px 0;border-bottom:1px solid var(--line)"><strong>${sanitizeHTML(c.number)}</strong> <span style="color:var(--ink-3);font-size:.8rem">· ${sanitizeHTML(c.status)}</span></div>`).join('')
                : '<p style="text-align:center;color:var(--ink-3);padding:16px">No delivery challans yet. Dispatch scheduling, driver/vehicle assignment and live GPS tracking require the logistics backend (see docs/ERP-ARCHITECTURE.md) — no location data is fabricated here.</p>'}
            </div>
        `;
    } else if (tab === 'financials') {
        const A = (window.GurukripaERP && GurukripaERP.Analytics) ? GurukripaERP.Analytics : null;
        const Crm = (window.GurukripaERP && GurukripaERP.CRM) ? GurukripaERP.CRM : null;
        if (!A || !Crm) { stage.innerHTML = '<p style="padding:20px;color:var(--ink-3)">ERP analytics unavailable.</p>'; return; }
        const money = n => '₹' + Number(n || 0).toLocaleString('en-IN');
        const ag = Crm.aging();
        const gp = A.grossProfit();
        const np = A.netProfit();
        const topP = A.topProducts(5);
        stage.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
                <div><h4 style="font-family:var(--display);font-size:1.3rem;color:var(--ink);margin:0">Financial Position</h4>
                <p style="font-size:.82rem;color:var(--ink-3);margin-top:2px">Receivables, aging and profitability — computed from finalized invoices.</p></div>
                <div style="display:flex;gap:8px"><button class="btn btn-outline btn-sm" onclick="erpExport('invoices')">Invoices CSV</button><button class="btn btn-outline btn-sm" onclick="erpExport('aging')">Aging CSV</button></div>
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:16px">
                <div style="background:var(--bg-card);border:1px solid var(--line);border-radius:10px;padding:14px"><div style="font-size:.72rem;color:var(--ink-3);text-transform:uppercase;font-weight:700">Receivables</div><div style="font-size:1.4rem;font-weight:800;color:var(--brand)">${money(ag.buckets.total)}</div></div>
                <div style="background:var(--bg-card);border:1px solid var(--line);border-radius:10px;padding:14px"><div style="font-size:.72rem;color:var(--ink-3);text-transform:uppercase;font-weight:700">Gross Profit</div><div style="font-size:1.4rem;font-weight:800">${gp.available ? money(gp.grossProfit) : '<span style="font-size:.8rem;color:var(--ink-3)">n/a</span>'}</div></div>
                <div style="background:var(--bg-card);border:1px solid var(--line);border-radius:10px;padding:14px"><div style="font-size:.72rem;color:var(--ink-3);text-transform:uppercase;font-weight:700">Net Profit</div><div style="font-size:1.4rem;font-weight:800">${np.available ? money(np.netProfit) : '<span style="font-size:.8rem;color:var(--ink-3)">n/a</span>'}</div></div>
            </div>
            <p style="font-size:.75rem;color:var(--ink-3);margin:-6px 0 14px">${gp.available ? '' : 'Gross profit: ' + sanitizeHTML(gp.reason || '')} ${np.available ? '' : ' · Net profit: ' + sanitizeHTML(np.reason || '')}</p>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
                <div style="background:var(--bg-card);border:1px solid var(--line);border-radius:12px;padding:16px">
                    <h5 style="margin:0 0 10px;font-size:1rem">Receivables Aging</h5>
                    ${['b0_30|0–30 days','b31_60|31–60 days','b61_90|61–90 days','b90plus|90+ days'].map(x => { const [key,lbl]=x.split('|'); return '<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--line)"><span style="color:var(--ink-3)">'+lbl+'</span><strong>'+money(ag.buckets[key])+'</strong></div>'; }).join('')}
                </div>
                <div style="background:var(--bg-card);border:1px solid var(--line);border-radius:12px;padding:16px">
                    <h5 style="margin:0 0 10px;font-size:1rem">Top Products (by revenue)</h5>
                    ${topP.length ? topP.map(p => '<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--line)"><span>'+sanitizeHTML(p.name||p.item)+'</span><strong>'+money(p.amount)+'</strong></div>').join('') : '<p style="color:var(--ink-3)">No sales yet.</p>'}
                </div>
            </div>
        `;
    }
}

// ── Invoice / PDF action helpers (admin) ───────────────────────
function _erpInv() { return (window.GurukripaERP && GurukripaERP.Invoices) ? GurukripaERP.Invoices : null; }
function printInvoiceByNumber(number) {
    const IV = _erpInv(); if (!IV) return;
    IV.printInvoice(number); showToast('Opening print dialog — choose “Save as PDF”', 'info');
}
function cancelInvoiceAction(number) {
    if (!window.GurukripaERP || !GurukripaERP.Documents) return;
    const reason = window.prompt('Cancel invoice ' + number + '.\nEnter a reason (record is retained, never deleted):');
    if (reason === null) return;
    try { GurukripaERP.Documents.cancel(number, reason || 'Cancelled'); showToast('Invoice cancelled (record retained)', 'success'); renderAdminTab('invoices'); }
    catch (e) { showToast('Cannot cancel: ' + e.message, 'warning'); }
}
function creditNoteAction(number) {
    if (!window.GurukripaERP || !GurukripaERP.Documents) return;
    const inv = GurukripaERP.Documents.getDoc(number);
    if (!inv) { showToast('Invoice not found', 'warning'); return; }
    const raw = window.prompt('Issue credit note against ' + number + '.\nEnter credit amount (₹) — leave blank for FULL credit of ₹' + (inv.balance || inv.totals.grandTotal) + ':');
    if (raw === null) return;
    const amount = Number(raw);
    const opts = { reason: 'Credit note' };
    if (amount > 0) opts.lines = [{ item: 'adjustment', name: 'Credit note', qty: 1, unitPrice: amount, taxRate: 0 }];
    try {
        GurukripaERP.Documents.issueCreditNote(number, opts);
        showToast('Credit note issued — receivable reduced, invoice retained', 'success'); renderAdminTab('invoices');
    } catch (e) { showToast('Credit failed: ' + e.message, 'warning'); }
}

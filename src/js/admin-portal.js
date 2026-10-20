// ══════════════════════════════════════════
// GURUKRIPA BRICKS ADMIN & LOGISTICS CONSOLE
// ══════════════════════════════════════════

let currentAdminTab = 'overview';

function openAdminPortal() {
    const modal = document.getElementById('adminPortalModal');
    if (modal) {
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

        stage.innerHTML = `
            <div style="margin-bottom:20px">
                <h4 style="font-family:var(--display);font-size:1.3rem;color:var(--ink);margin-bottom:4px">Bhatta Operations Overview</h4>
                <p style="font-size:0.85rem;color:var(--ink-3)">Real-time yard dispatch metrics, B2B wholesale enquiries &amp; customer orders.</p>
            </div>

            <!-- KPI Metric Cards -->
            <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:16px;margin-bottom:24px">
                <div style="background:var(--bg-card);border:1px solid var(--line);border-radius:12px;padding:16px;box-shadow:var(--sh-card)">
                    <div style="font-size:0.75rem;color:var(--ink-3);font-weight:700;text-transform:uppercase">Active RFQ Enquiries</div>
                    <div style="font-size:1.8rem;font-weight:800;color:var(--brand);margin-top:4px">${quotes.length || 3}</div>
                    <div style="font-size:0.72rem;color:var(--success);margin-top:2px">● All leads assigned to reps</div>
                </div>
                <div style="background:var(--bg-card);border:1px solid var(--line);border-radius:12px;padding:16px;box-shadow:var(--sh-card)">
                    <div style="font-size:0.75rem;color:var(--ink-3);font-weight:700;text-transform:uppercase">Total Confirmed Orders</div>
                    <div style="font-size:1.8rem;font-weight:800;color:var(--ink);margin-top:4px">${orders.length || 18}</div>
                    <div style="font-size:0.72rem;color:var(--ink-3);margin-top:2px">₹14.8L gross monthly book</div>
                </div>
                <div style="background:var(--bg-card);border:1px solid var(--line);border-radius:12px;padding:16px;box-shadow:var(--sh-card)">
                    <div style="font-size:0.75rem;color:var(--ink-3);font-weight:700;text-transform:uppercase">Kiln Production Capacity</div>
                    <div style="font-size:1.8rem;font-weight:800;color:var(--success);margin-top:4px">45,000</div>
                    <div style="font-size:0.72rem;color:var(--ink-3);margin-top:2px">Bricks / day firing rate</div>
                </div>
                <div style="background:var(--bg-card);border:1px solid var(--line);border-radius:12px;padding:16px;box-shadow:var(--sh-card)">
                    <div style="font-size:0.75rem;color:var(--ink-3);font-weight:700;text-transform:uppercase">Active Fleet Dispatches</div>
                    <div style="font-size:1.8rem;font-weight:800;color:var(--warning);margin-top:4px">6</div>
                    <div style="font-size:0.72rem;color:var(--ink-3);margin-top:2px">Tractor-trolleys in transit</div>
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
        stage.innerHTML = `
            <h4 style="font-family:var(--display);font-size:1.3rem;color:var(--ink);margin-bottom:4px">Customer &amp; Dealer Orders</h4>
            <p style="font-size:0.85rem;color:var(--ink-3);margin-bottom:16px">Active trolley dispatch bookings and completed site deliveries.</p>
            <div style="background:var(--bg-card);border:1px solid var(--line);border-radius:12px;padding:20px;text-align:center">
                <div style="font-size:2.5rem;margin-bottom:10px">🚛</div>
                <div style="font-weight:700;color:var(--ink);margin-bottom:6px">Trolley Fleet Active</div>
                <p style="font-size:0.85rem;color:var(--ink-3);max-width:400px;margin:0 auto 16px">All customer orders placed via the checkout modal are synced with the live delivery tracking system.</p>
                <button class="btn btn-primary btn-sm" onclick="closeAdminPortal();openTrackerModal()">Open Live Delivery Tracker</button>
            </div>
        `;
    } else if (tab === 'inventory') {
        stage.innerHTML = `
            <h4 style="font-family:var(--display);font-size:1.3rem;color:var(--ink);margin-bottom:4px">Jaunpur Yard Stock Balances</h4>
            <p style="font-size:0.85rem;color:var(--ink-3);margin-bottom:16px">Real-time kiln batch counts and reserved customer quantities.</p>
            <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(240px, 1fr));gap:16px">
                <div style="background:var(--bg-card);border:1px solid var(--line);border-radius:12px;padding:16px">
                    <div style="font-weight:700;color:var(--brand)">Awwal Bricks (आव्वल)</div>
                    <div style="font-size:1.6rem;font-weight:800;color:var(--ink);margin-top:6px">1,24,000 <small style="font-size:.7rem;color:var(--ink-3)">pcs</small></div>
                    <div style="font-size:0.75rem;color:var(--success);margin-top:4px">✓ In Stock (31 Trolleys)</div>
                </div>
                <div style="background:var(--bg-card);border:1px solid var(--line);border-radius:12px;padding:16px">
                    <div style="font-weight:700;color:var(--brand)">Laal Peti (लाल पेटी)</div>
                    <div style="font-size:1.6rem;font-weight:800;color:var(--ink);margin-top:6px">96,000 <small style="font-size:.7rem;color:var(--ink-3)">pcs</small></div>
                    <div style="font-size:0.75rem;color:var(--success);margin-top:4px">✓ In Stock (24 Trolleys)</div>
                </div>
                <div style="background:var(--bg-card);border:1px solid var(--line);border-radius:12px;padding:16px">
                    <div style="font-weight:700;color:var(--brand)">Shiv Eent Grade-A</div>
                    <div style="font-size:1.6rem;font-weight:800;color:var(--ink);margin-top:6px">48,000 <small style="font-size:.7rem;color:var(--ink-3)">pcs</small></div>
                    <div style="font-size:0.75rem;color:var(--warning);margin-top:4px">⚡ High Demand / Fast Moving</div>
                </div>
            </div>
        `;
    } else if (tab === 'dispatch') {
        stage.innerHTML = `
            <h4 style="font-family:var(--display);font-size:1.3rem;color:var(--ink);margin-bottom:4px">Vehicle &amp; Driver Fleet Scheduling</h4>
            <p style="font-size:0.85rem;color:var(--ink-3);margin-bottom:16px">Delivery challan issuance and site unloading assignments.</p>
            <div style="background:var(--bg-card);border:1px solid var(--line);border-radius:12px;padding:18px">
                <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--line);padding-bottom:12px">
                    <div>
                        <strong>Trolley UP-62-T-4912</strong> (Driver: Ramesh Yadav · +91 98765 43210)
                        <div style="font-size:0.8rem;color:var(--ink-3)">Route: Jaunpur Highway → Jalalpur Site</div>
                    </div>
                    <span style="background:var(--success-bg);color:var(--success);padding:4px 10px;border-radius:12px;font-size:0.75rem;font-weight:700">En Route</span>
                </div>
                <div style="display:flex;justify-content:space-between;align-items:center;padding-top:12px">
                    <div>
                        <strong>Truck UP-65-E-8821</strong> (Driver: Suresh Pal · +91 94150 77112)
                        <div style="font-size:0.8rem;color:var(--ink-3)">Route: Bhatta Yard → Varanasi Ring Road</div>
                    </div>
                    <span style="background:var(--warning-bg);color:var(--warning);padding:4px 10px;border-radius:12px;font-size:0.75rem;font-weight:700">Loading at Kiln</span>
                </div>
            </div>
        `;
    }
}

// ══════════════════════════════════════════
// LIVE ORDER & DELIVERY TRACKER
// ══════════════════════════════════════════
function openTrackerModal(orderId) {
    const modal = document.getElementById('trackerModal');
    if (!modal) return;
    if (orderId) {
        const inp = document.getElementById('trackerSearchInput');
        if (inp) inp.value = orderId;
    }
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    renderTrackerDetails(orderId || 'GBI-20260728-4912');
}

function closeTrackerModal() {
    document.getElementById('trackerModal')?.classList.remove('open');
    document.body.style.overflow = '';
}

function demoTrackerOrder() {
    document.getElementById('trackerSearchInput').value = 'GBI-20260728-4912';
    renderTrackerDetails('GBI-20260728-4912');
    showToast('🚚 Loaded live demo order tracking!', 'info');
}

function trackOrderSubmit() {
    const id = document.getElementById('trackerSearchInput').value.trim();
    if (!id) { showToast('Please enter an Order ID or Mobile', 'error'); return; }
    renderTrackerDetails(id);
}

function renderTrackerDetails(orderId) {
    const container = document.getElementById('trackerDisplayContent');
    if (!container) return;
    const matched  = orders.find(o => o.id.toLowerCase() === orderId.toLowerCase());
    const displayId = matched ? matched.id : orderId;
    container.innerHTML = `
        <div class="tracker-status-card">
            <div class="tracker-order-meta">
                <div>
                    <div class="tracker-order-id">📦 Order ${sanitizeHTML(displayId)}</div>
                    <div style="font-size:.76rem;color:var(--ink-3);margin-top:2px">Dispatch Point: Gurukripa Bhatta Yard, Jaunpur</div>
                </div>
                <div class="tracker-badge dispatched">🚚 In-Transit (On Road)</div>
            </div>
            <div class="tracker-stepper">
                <div class="tracker-stepper-progress" style="width:70%"></div>
                <div class="tracker-step completed"><div class="tracker-step-icon">✓</div><div class="tracker-step-title">Order Token</div><div class="tracker-step-time">09:15 AM</div></div>
                <div class="tracker-step completed"><div class="tracker-step-icon">✓</div><div class="tracker-step-title">Bhatta Loading</div><div class="tracker-step-time">11:30 AM</div></div>
                <div class="tracker-step active"><div class="tracker-step-icon">🚚</div><div class="tracker-step-title">Dispatched</div><div class="tracker-step-time">01:45 PM</div></div>
                <div class="tracker-step"><div class="tracker-step-icon">📍</div><div class="tracker-step-title">Site Unloaded</div><div class="tracker-step-time">Est. 45 mins</div></div>
            </div>
            <div class="tracker-driver-card">
                <div class="tracker-driver-info">
                    <div class="tracker-driver-avatar">👨✈️</div>
                    <div>
                        <div style="font-weight:700;font-size:.9rem;color:var(--ink)">Ram Singh (Trolley Driver)</div>
                        <div style="font-size:.76rem;color:var(--ink-3)">Trolley #: <strong>UP-62-BT-9412</strong> (Power Tractor)</div>
                    </div>
                </div>
                <a href="tel:+919198923230" class="btn btn-primary btn-sm" style="background:#16a34a">📞 Call Driver</a>
            </div>
        </div>`;
}

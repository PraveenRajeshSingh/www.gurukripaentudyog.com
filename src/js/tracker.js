// ══════════════════════════════════════════
// LIVE ORDER & DELIVERY TRACKER
// ══════════════════════════════════════════
const _trPackageSVG = `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`;
const _trTruckSVG = `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>`;
const _trPinSVG = `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>`;
const _trUserSVG = `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
const _trPhoneSVG = `<svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.36 1.9.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0122 16.92z"/></svg>`;
const _trWaSVG = `<svg width="15" height="15" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 2.10.55 4.05 1.6 5.78L2 22l4.42-1.66a9.9 9.9 0 0 0 5.62 1.72h.01c5.46 0 9.9-4.45 9.9-9.91C21.95 6.45 17.5 2 12.04 2z"/></svg>`;

function openTrackerModal(orderId) {
    const modal = document.getElementById('trackerModal');
    if (!modal) return;
    if (orderId) {
        const inp = document.getElementById('trackerSearchInput');
        if (inp) inp.value = orderId;
    }
    modal.classList.add('open');
    overlayLock();
    renderTrackerDetails(orderId || 'GBI-20260728-4912');
}

function closeTrackerModal() {
    document.getElementById('trackerModal')?.classList.remove('open');
    overlayUnlock();
}

function demoTrackerOrder() {
    document.getElementById('trackerSearchInput').value = 'GBI-20260728-4912';
    renderTrackerDetails('GBI-20260728-4912');
    showToast(t('tracker.demoLoaded'), 'info');
}

function trackOrderSubmit() {
    const id = document.getElementById('trackerSearchInput').value.trim();
    if (!id) { showToast(t('tracker.enterId'), 'error'); return; }
    renderTrackerDetails(id);
}

function renderTrackerDetails(orderId) {
    const container = document.getElementById('trackerDisplayContent');
    if (!container) return;
    const matched  = orders.find(o => o.id.toLowerCase() === orderId.toLowerCase());
    const displayId = matched ? matched.id : orderId;

    if (window.GurukripaMaps && typeof window.GurukripaMaps.initMapElement === 'function') {
        window.GurukripaMaps.initMapElement('trackerMapContainer', { lat: 25.7476, lng: 82.6837 }, {
            title: 'Trolley UP-62-BT-9412 En Route to Site'
        });
    }

    container.innerHTML = `
        <div class="tracker-status-card">
            <div class="tracker-order-meta">
                <div>
                    <div class="tracker-order-id">${_trPackageSVG} Order ${sanitizeHTML(displayId)}</div>
                    <div style="font-size:.76rem;color:var(--ink-3);margin-top:2px">Dispatch Point: Gurukripa Bhatta Yard, Jaunpur</div>
                </div>
                <div class="tracker-badge dispatched">${_trTruckSVG} In-Transit (On Road)</div>
            </div>
            <div class="tracker-stepper">
                <div class="tracker-stepper-progress" style="width:70%"></div>
                <div class="tracker-step completed"><div class="tracker-step-icon">✓</div><div class="tracker-step-title">Order Token</div><div class="tracker-step-time">09:15 AM</div></div>
                <div class="tracker-step completed"><div class="tracker-step-icon">✓</div><div class="tracker-step-title">Bhatta Loading</div><div class="tracker-step-time">11:30 AM</div></div>
                <div class="tracker-step active"><div class="tracker-step-icon">${_trTruckSVG}</div><div class="tracker-step-title">Dispatched</div><div class="tracker-step-time">01:45 PM</div></div>
                <div class="tracker-step"><div class="tracker-step-icon">${_trPinSVG}</div><div class="tracker-step-title">Site Unloaded</div><div class="tracker-step-time">Est. 45 mins</div></div>
            </div>
            <div class="tracker-driver-card">
                <div class="tracker-driver-info">
                    <div class="tracker-driver-avatar">${_trUserSVG}</div>
                    <div>
                        <div style="font-weight:700;font-size:.9rem;color:var(--ink)">Ram Singh (Trolley Driver)</div>
                        <div style="font-size:.76rem;color:var(--ink-3)">Trolley #: <strong>UP-62-BT-9412</strong> (Power Tractor)</div>
                    </div>
                </div>
                <div class="tracker-driver-actions">
                    <a href="tel:+919198923230" class="btn btn-primary btn-sm" style="background:#16a34a">${_trPhoneSVG} Call Driver</a>
                    <a href="${typeof waOrderURL === 'function' ? waOrderURL('Order ' + displayId) : 'https://wa.me/919198923230'}" target="_blank" rel="noopener" class="btn btn-outline btn-sm">${_trWaSVG} Chat</a>
                </div>
            </div>
        </div>`;
}

// ══════════════════════════════════════════
// ORDER & DELIVERY TRACKER
// Uses local orders + DispatchOps stages only.
// No fabricated GPS / driver / trolley positions.
// Map shows the verified yard location (embed or Maps JS).
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
    // Avoid a previous sheet sitting above the tracker map action row.
    if (typeof closeAllModalOverlays === 'function') closeAllModalOverlays();
    const inp = document.getElementById('trackerSearchInput');
    if (inp) {
        if (orderId) inp.value = orderId;
        else if (!inp.value || /^GBI-20260728-4912$/i.test(inp.value.trim())) inp.value = '';
    }
    if (typeof openOverlay === 'function') openOverlay(modal);
    else {
        modal.classList.add('open');
        overlayLock();
    }
    mountTrackerYardMap();
    // Sheet animation finishes after paint — reflow map so it is not 0×0.
    setTimeout(function () {
        if (window.GurukripaMaps && GurukripaMaps.invalidateMapIn) {
            GurukripaMaps.invalidateMapIn('trackerMapContainer');
        }
    }, 280);
    if (orderId || (inp && inp.value.trim())) {
        renderTrackerDetails((orderId || inp.value).trim());
    } else {
        renderTrackerEmpty();
    }
}

function closeTrackerModal() {
    if (typeof closeOverlay === 'function') closeOverlay('trackerModal');
    else {
        document.getElementById('trackerModal')?.classList.remove('open');
        overlayUnlock();
    }
}

function mountTrackerYardMap() {
    if (!window.GurukripaMaps || typeof GurukripaMaps.initMapElement !== 'function') return;
    const coords = GurukripaMaps.BhattaCoords || { lat: 25.6041031, lng: 82.7939421 };
    GurukripaMaps.initMapElement('trackerMapContainer', coords, {
        title: 'Gurukripa Yard — Newada, Jalalpur',
        note: 'This map shows the kiln yard. Live trolley GPS is not available — status comes from yard dispatch records only.',
        zoom: 15
    });
}

function refreshTracker() {
    const id = (document.getElementById('trackerSearchInput')?.value || '').trim();
    mountTrackerYardMap();
    if (!id) { renderTrackerEmpty(); return; }

    const paintLocal = () => {
        renderTrackerDetails(id);
        showToast(typeof t === 'function' ? t('tracker.refreshed') : 'Status refreshed from this device.', 'info');
    };

    // Prefer Platform API order status when signed in; otherwise re-read the local ledger.
    if (window.GBApi && GBApi.enabled() && GBApi.token && GBApi.token()) {
        GBApi.endpoints.order(id).then((remote) => {
            if (remote && remote.id) {
                const idx = orders.findIndex((o) => String(o.id) === String(remote.id));
                const merged = Object.assign({}, idx >= 0 ? orders[idx] : {}, {
                    id: remote.id,
                    status: remote.status || remote.stage || 'Processing',
                    customer: remote.customerName || remote.customer || '',
                    customerPhone: remote.customerPhone || remote.phone || '',
                    total: remote.total != null ? remote.total : (idx >= 0 ? orders[idx].total : 0)
                });
                if (idx >= 0) orders[idx] = merged;
                else orders.unshift(merged);
                setSafeStorage('gb_orders', orders);
            }
            paintLocal();
        }).catch(paintLocal);
        return;
    }
    paintLocal();
}

function trackOrderSubmit() {
    const id = document.getElementById('trackerSearchInput')?.value.trim();
    if (!id) {
        showToast(typeof t === 'function' ? t('tracker.enterId') : 'Please enter an Order ID or Mobile', 'error');
        renderTrackerEmpty();
        return;
    }
    renderTrackerDetails(id);
}

function findTrackedOrder(query) {
    const q = String(query || '').trim().toLowerCase();
    if (!q || !Array.isArray(orders)) return null;
    const byId = orders.find((o) => String(o.id || '').toLowerCase() === q);
    if (byId) return byId;
    const digits = q.replace(/\D/g, '');
    if (digits.length >= 10) {
        return orders.find((o) => {
            const phone = String(o.customerPhone || (o.customer && o.customer.phone) || '').replace(/\D/g, '');
            return phone && (phone === digits || phone.endsWith(digits.slice(-10)));
        }) || null;
    }
    return null;
}

function formatStageTime(ts) {
    if (!ts) return '—';
    try {
        return new Date(ts).toLocaleString(undefined, { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' });
    } catch (_e) {
        return '—';
    }
}

function renderTrackerEmpty() {
    const container = document.getElementById('trackerDisplayContent');
    if (!container) return;
    container.innerHTML = `
        <div class="tracker-empty">
            <div class="tracker-empty__title">Enter an order ID or mobile</div>
            <p class="tracker-empty__text">Tracking uses orders saved on this device and yard dispatch updates. Live GPS trolley positions are not available.</p>
            <div class="tracker-empty__actions">
                <a href="tel:+919198923230" class="btn btn-primary btn-sm">${_trPhoneSVG} Call Yard</a>
                <a href="https://wa.me/919198923230?text=${encodeURIComponent('Namaste! I need help tracking my brick order.')}" target="_blank" rel="noopener" class="btn btn-outline btn-sm">${_trWaSVG} WhatsApp</a>
            </div>
        </div>`;
}

function renderTrackerDetails(orderId) {
    const container = document.getElementById('trackerDisplayContent');
    if (!container) return;

    const matched = findTrackedOrder(orderId);
    if (!matched) {
        container.innerHTML = `
            <div class="tracker-empty tracker-empty--warn">
                <div class="tracker-empty__title">No order found for “${sanitizeHTML(orderId)}”</div>
                <p class="tracker-empty__text">Orders placed on this browser appear here. If you ordered on another device, call or WhatsApp the yard with your reference.</p>
                <div class="tracker-empty__actions">
                    <a href="tel:+919198923230" class="btn btn-primary btn-sm">${_trPhoneSVG} Call +91 91989 23230</a>
                    <a href="https://wa.me/919198923230?text=${encodeURIComponent('Namaste! Please help track order ' + orderId)}" target="_blank" rel="noopener" class="btn btn-outline btn-sm">${_trWaSVG} WhatsApp Yard</a>
                </div>
            </div>`;
        return;
    }

    const stages = (window.DispatchOps && DispatchOps.STAGES) ? DispatchOps.STAGES : [
        { key: 'queued', label: 'Order Logged' },
        { key: 'firing', label: 'Kiln Firing' },
        { key: 'loading', label: 'Loading' },
        { key: 'enroute', label: 'En-Route' },
        { key: 'delivered', label: 'Delivered' }
    ];
    const rec = (window.DispatchOps && typeof DispatchOps.forOrder === 'function')
        ? DispatchOps.forOrder(matched.id)
        : { stage: 'queued', driver: '', phone: '', trolleyNo: '', vehicle: '', history: [] };
    const stageKey = rec.stage || 'queued';
    const stageIdx = stages.findIndex((s) => s.key === stageKey);
    const activeIdx = stageIdx < 0 ? 0 : stageIdx;
    const progressPct = stages.length <= 1 ? 0 : Math.round((activeIdx / (stages.length - 1)) * 100);
    const stageDef = stages[activeIdx] || stages[0];
    const historyMap = {};
    (rec.history || []).forEach((h) => { if (h && h.stage) historyMap[h.stage] = h.at; });

    const badgeClass = stageKey === 'delivered' ? 'delivered' : (stageKey === 'enroute' ? 'dispatched' : 'queued');
    const badgeLabel = stageDef.label || matched.status || 'Logged';
    const hasCrew = !!(rec.driver || rec.trolleyNo || rec.vehicle);
    const callHref = rec.phone
        ? ('tel:+' + String(rec.phone).replace(/\D/g, '').replace(/^/, (d) => d.startsWith('91') ? d : '91' + d))
        : 'tel:+919198923230';
    const waText = encodeURIComponent('Namaste! Regarding order ' + matched.id + ' — please share dispatch status.');

    const stepsHtml = stages.map((s, i) => {
        const done = i < activeIdx;
        const active = i === activeIdx;
        const cls = done ? 'completed' : (active ? 'active' : '');
        const icon = done ? '✓' : (active ? _trTruckSVG : (i === stages.length - 1 ? _trPinSVG : String(i + 1)));
        const time = formatStageTime(historyMap[s.key]);
        return `<div class="tracker-step ${cls}"><div class="tracker-step-icon">${icon}</div><div class="tracker-step-title">${sanitizeHTML(s.label)}</div><div class="tracker-step-time">${time}</div></div>`;
    }).join('');

    container.innerHTML = `
        <div class="tracker-status-card">
            <div class="tracker-order-meta">
                <div>
                    <div class="tracker-order-id">${_trPackageSVG} Order ${sanitizeHTML(matched.id)}</div>
                    <div class="tracker-order-sub">Dispatch point: Newada yard, Jalalpur · Status from yard records (not live GPS)</div>
                </div>
                <div class="tracker-badge ${badgeClass}">${_trTruckSVG} ${sanitizeHTML(badgeLabel)}</div>
            </div>
            <div class="tracker-stepper">
                <div class="tracker-stepper-progress" style="width:${progressPct}%"></div>
                ${stepsHtml}
            </div>
            ${hasCrew ? `
            <div class="tracker-driver-card">
                <div class="tracker-driver-info">
                    <div class="tracker-driver-avatar">${_trUserSVG}</div>
                    <div>
                        <div class="tracker-driver-name">${sanitizeHTML(rec.driver || 'Yard crew')}</div>
                        <div class="tracker-driver-meta">${rec.trolleyNo || rec.vehicle
                            ? ('Trolley / vehicle: <strong>' + sanitizeHTML(rec.trolleyNo || rec.vehicle) + '</strong>')
                            : 'Assigned at yard — GPS position not published'}</div>
                    </div>
                </div>
                <div class="tracker-driver-actions">
                    <a href="${callHref}" class="btn btn-primary btn-sm tracker-call-btn">${_trPhoneSVG} Call</a>
                    <a href="https://wa.me/919198923230?text=${waText}" target="_blank" rel="noopener" class="btn btn-outline btn-sm">${_trWaSVG} Chat</a>
                </div>
            </div>` : `
            <div class="tracker-unavailable">
                <strong>No live trolley location</strong>
                <span>Driver and GPS are assigned by the yard when the load leaves. Call or WhatsApp for the latest update.</span>
                <div class="tracker-driver-actions" style="margin-top:10px">
                    <a href="tel:+919198923230" class="btn btn-primary btn-sm">${_trPhoneSVG} Call Yard</a>
                    <a href="https://wa.me/919198923230?text=${waText}" target="_blank" rel="noopener" class="btn btn-outline btn-sm">${_trWaSVG} WhatsApp</a>
                </div>
            </div>`}
            <div class="tracker-toolbar">
                <button type="button" class="btn btn-ghost btn-sm" onclick="refreshTracker()">Refresh status</button>
                ${matched.site ? `<span class="tracker-site">Site: ${sanitizeHTML(matched.site)}${matched.city ? ', ' + sanitizeHTML(matched.city) : ''}</span>` : ''}
            </div>
        </div>`;
}

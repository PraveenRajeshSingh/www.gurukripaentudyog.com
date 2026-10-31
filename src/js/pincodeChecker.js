// ══════════════════════════════════════════
// PINCODE DELIVERY CHECKER & MODAL SYSTEM
// Covers Eastern UP Kiln Logistics (Jaunpur, Varanasi, etc.)
// ══════════════════════════════════════════

(function () {
    const PINCODE_TABLE = {
        '222001': { area: 'Jaunpur City & Sadar',      km: 5,  zone: 'Local Jaunpur' },
        '222002': { area: 'Jaunpur Kutchery',          km: 8,  zone: 'Local Jaunpur' },
        '222003': { area: 'Mariahu / Rampur',          km: 22, zone: 'Jaunpur South' },
        '222101': { area: 'Machhlishahr',              km: 32, zone: 'Jaunpur West' },
        '222105': { area: 'Kerakat / Newada Yard',     km: 4,  zone: 'Bhatta Local' },
        '222125': { area: 'Badlapur',                  km: 35, zone: 'Jaunpur North' },
        '222136': { area: 'Jalalpur / Trilochan',      km: 2,  zone: 'Kiln Immediate' },
        '222142': { area: 'Mungra Badshahpur',         km: 48, zone: 'Jaunpur Outer' },
        '221001': { area: 'Varanasi Cantt / City',     km: 55, zone: 'Varanasi Metro' },
        '221002': { area: 'Varanasi Chowk',            km: 58, zone: 'Varanasi Metro' },
        '221005': { area: 'Sarnath',                   km: 62, zone: 'Varanasi North' },
        '221010': { area: 'BHU / Lanka / Ramnagar',    km: 65, zone: 'Varanasi South' },
        '221301': { area: 'Mirzapur Sadar',            km: 80, zone: 'Mirzapur' },
        '228001': { area: 'Sultanpur City',            km: 85, zone: 'Sultanpur' },
        '275101': { area: 'Mau Sadar',                 km: 68, zone: 'Mau' },
        '275301': { area: 'Azamgarh City',             km: 60, zone: 'Azamgarh' },
    };

    const BASE_DELIVERY_RATE = 2.5;   // ₹ per km per trolley
    const BASE_DELIVERY_MIN  = 450;   // minimum delivery charge (₹)
    const FREE_THRESHOLD_KM  = 10;    // free delivery within 10 km

    window.checkPincodeDelivery = function (pincode, trolleys = 1, vehicle = 'trolley') {
        const pin = (pincode || '').trim();
        if (!/^\d{6}$/.test(pin)) return { found: false, error: 'Please enter a valid 6-digit Indian pincode.' };

        const entry = PINCODE_TABLE[pin];
        if (!entry) {
            return {
                found: false,
                isNearby: pin.startsWith('222') || pin.startsWith('221') || pin.startsWith('275'),
                error: 'Pincode not in automated lookup table. Contact Bhatta Manager via WhatsApp for custom route booking.'
            };
        }

        const km = entry.km;
        let charge = 0;
        if (km > FREE_THRESHOLD_KM) {
            const multiplier = vehicle === 'truck' ? 1.8 : 1.0;
            charge = Math.max(BASE_DELIVERY_MIN, Math.round(km * BASE_DELIVERY_RATE * trolleys * multiplier));
        }

        const eta = km <= 15
            ? '⚡ Same-Day Priority Dispatch (within 4 hours)'
            : km <= 45
                ? '🚚 Same-Day Delivery (if ordered before 12:00 PM)'
                : '📦 Next-Day Morning Delivery (12–24 hours)';

        const accessNotice = vehicle === 'truck'
            ? 'Site road must be 18ft+ wide without low overhead wires.'
            : 'Mini-trolley easily accesses 10ft+ village & residential lanes.';

        return {
            found: true,
            area: entry.area,
            zone: entry.zone,
            km,
            charge,
            eta,
            accessNotice,
            pincode: pin
        };
    };

    let selectedProductName = 'Grade-A Bricks';

    window.openPincodeModal = function (productName) {
        if (productName) selectedProductName = productName;
        const modal = document.getElementById('pincodeModal');
        if (modal) {
            modal.classList.add('open');
            if (typeof overlayLock === 'function') overlayLock();
            setTimeout(() => document.getElementById('modalPincodeInput')?.focus(), 150);
        }
    };

    window.closePincodeModal = function () {
        const modal = document.getElementById('pincodeModal');
        if (modal) {
            modal.classList.remove('open');
            if (typeof overlayUnlock === 'function') overlayUnlock();
        }
    };

    window.setModalPincode = function (pin) {
        const input = document.getElementById('modalPincodeInput');
        if (input) {
            input.value = pin;
            runModalPincodeCheck();
        }
    };

    window.runModalPincodeCheck = function () {
        const input = document.getElementById('modalPincodeInput');
        const resEl = document.getElementById('modalPincodeResult');
        if (!input || !resEl) return;
        const pin = input.value.trim();
        if (pin.length < 6) return;

        const isTruck = document.getElementById('vehTruck')?.checked;
        const vehicle = isTruck ? 'truck' : 'trolley';
        const trolleys = (typeof cart !== 'undefined' && cart.length) ? Math.max(1, Math.ceil(cart.reduce((s,i)=>s+i.qty,0) / 4000)) : 1;
        const res = window.checkPincodeDelivery(pin, trolleys, vehicle);

        resEl.style.display = 'block';
        if (!res.found) {
            resEl.innerHTML = `
                <div style="background:rgba(220,38,38,0.08);border:1px solid rgba(220,38,38,0.25);border-radius:12px;padding:12px 14px;font-size:0.82rem;color:#b91c1c">
                    <strong>⚠ ${res.error}</strong>
                    <div style="margin-top:6px;font-size:0.75rem;color:var(--ink-2)">We regularly deliver throughout Jaunpur, Varanasi, Azamgarh, and Sultanpur districts. Tap WhatsApp below to verify.</div>
                </div>`;
            return;
        }

        const costStr = res.charge === 0
            ? '<strong style="color:#16a34a;font-size:1rem">FREE DELIVERY 🎉 (Within 10 km)</strong>'
            : `<strong style="color:var(--brand);font-size:1rem">₹${res.charge.toLocaleString('en-IN')}</strong> <span style="font-size:0.75rem;color:var(--ink-3)">(${trolleys} load${trolleys > 1 ? 's' : ''})</span>`;

        resEl.innerHTML = `
            <div style="background:var(--brand-glow);border:1.5px solid var(--line-mid);border-radius:12px;padding:14px;font-size:0.84rem;line-height:1.6">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px">
                    <div>
                        <div style="font-weight:800;color:var(--ink);font-size:0.95rem">📍 ${res.area}</div>
                        <div style="font-size:0.75rem;color:var(--ink-3)">Zone: ${res.zone} · <strong>${res.km} km</strong> from Gurukripa Kiln</div>
                    </div>
                    <span style="background:var(--bg-card);border:1px solid var(--line);border-radius:6px;padding:2px 8px;font-size:0.72rem;font-weight:700;color:var(--brand)">PIN ${res.pincode}</span>
                </div>
                <div style="border-top:1px dashed var(--line);margin:8px 0;padding-top:8px">
                    <div>🚚 Freight: ${costStr}</div>
                    <div style="margin-top:4px;font-weight:600;color:var(--ink)">${res.eta}</div>
                    <div style="font-size:0.74rem;color:var(--ink-3);margin-top:4px">🛣 ${res.accessNotice}</div>
                </div>
            </div>`;
    };

    window.whatsappModalDeliveryQuote = function () {
        const pin = document.getElementById('modalPincodeInput')?.value?.trim() || '222001';
        const isTruck = document.getElementById('vehTruck')?.checked;
        const vehicle = isTruck ? 'Heavy Truck (10k+)' : 'Mini-Trolley (4k)';
        const text = encodeURIComponent(
            `Namaste Gurukripa Bhatta! I would like to check delivery and rates:\n• Product: ${selectedProductName}\n• Delivery Pincode: ${pin}\n• Preferred Vehicle: ${vehicle}\n\nPlease confirm availability and freight cost to my site.`
        );
        window.open(`https://wa.me/919198923230?text=${text}`, '_blank');
    };
})();

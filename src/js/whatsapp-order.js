'use strict';
// ══════════════════════════════════════════════════════════════════
// WHATSAPP ORDER BOT
// Gurukripa Bricks Industry — structured order handoff to the yard
// ══════════════════════════════════════════════════════════════════
// Builds one pre-filled, WhatsApp-formatted message containing:
//   • cart line items with rate × qty and line totals
//   • coupon / grand total
//   • exact wall-estimator specs (bricks, trolleys, cement, sand)
//   • delivery pincode, zone, road access and unloading preference
//   • chosen payment method
//   • optional offline queue reference
//
// No WhatsApp Business API is required: the buyer lands in a normal chat
// with the yard number and only needs to press send.
// ══════════════════════════════════════════════════════════════════

const WhatsAppOrder = (function () {
    const NUMBER = '919198923230';
    const BRAND = 'Gurukripa Bricks Industry';

    const PAYMENT_LABELS = {
        upi: 'UPI / QR (GPay, PhonePe, Paytm)',
        card: 'Debit / Credit Card',
        cod: 'Cash on Delivery',
        credit: '30-day trade credit (GST invoice)'
    };

    const ROAD_LABELS = {
        wide: 'Wide main road (truck / trolley)',
        narrow: 'Narrow village lane (mini trolley needed)'
    };

    function inr(value) {
        return typeof formatINR === 'function'
            ? formatINR(value)
            : '₹' + Number(value || 0).toLocaleString('en-IN');
    }

    function num(value) {
        return typeof formatNum === 'function'
            ? formatNum(value)
            : Number(value || 0).toLocaleString('en-IN');
    }

    function digits(value) {
        return String(value || '').replace(/\D/g, '');
    }

    // Stable order reference: GBI-YYYYMMDD-XXXX
    function makeOrderRef() {
        const now = new Date();
        const stamp = [
            now.getFullYear(),
            String(now.getMonth() + 1).padStart(2, '0'),
            String(now.getDate()).padStart(2, '0')
        ].join('');
        return `GBI-${stamp}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    function dateLabel(value) {
        const d = value ? new Date(value) : new Date();
        try {
            return d.toLocaleString('en-IN', {
                day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
            });
        } catch (_e) {
            return d.toDateString();
        }
    }

    function estimatorBlock(est) {
        if (!est || !(est.bricks || est.project)) return '';
        const lines = [
            '',
            `*${est.tab === 'house' ? 'HOUSE ESTIMATOR' : est.tab === 'boundary' ? 'BOUNDARY ESTIMATOR' : 'WALL ESTIMATOR'}*`
        ];
        if (est.project) lines.push(`Project: ${est.project}`);
        if (est.bricks) lines.push(`Bricks needed: ${num(est.bricks)} pcs`);
        if (est.trolleys) lines.push(`Trolley load: ${est.trolleys} (4,000 pcs / trolley)`);
        if (est.cementBags) lines.push(`Cement: ${num(est.cementBags)} bags`);
        if (est.sandCuFt) lines.push(`Sand: ${num(est.sandCuFt)} cu.ft`);
        if (est.cost) lines.push(`Estimated budget: ${inr(est.cost)}`);
        lines.push('(Estimator output, not a final invoice.)');
        return lines.join('\n');
    }

    function buildMessage(order) {
        const o = order || {};
        const items = Array.isArray(o.items) ? o.items : [];
        const lines = [];

        lines.push(`*NEW BRICK ORDER — ${BRAND}*`);
        if (o.ref) lines.push(`Order ref: *${o.ref}*`);
        lines.push(`Placed: ${dateLabel(o.createdAt)}`);
        if (o.online === false) lines.push('Placed offline from a construction site (queued on device).');
        lines.push('');

        if (items.length) {
            lines.push('*CART ITEMS*');
            items.forEach((item, index) => {
                const qty = Number(item.qty || 0);
                const rate = Number(item.price || 0);
                const unit = (item.unit || 'per piece').replace(/^per\s+/i, '');
                lines.push(`${index + 1}. ${item.name}`);
                lines.push(`   ${num(qty)} ${unit}${qty === 1 ? '' : 's'} x ${inr(rate)} = *${inr(qty * rate)}*`);
            });
            lines.push('');
            if (o.subtotal != null) lines.push(`Subtotal: ${inr(o.subtotal)}`);
            if (o.discount) lines.push(`Coupon${o.coupon ? ` (${o.coupon})` : ''}: -${inr(o.discount)}`);
            if (o.deliveryFee) lines.push(`Delivery: ${inr(o.deliveryFee)}`);
            lines.push(`*Grand total: ${inr(o.total)}*`);
        } else if (o.total != null) {
            lines.push(`*Order value: ${inr(o.total)}*`);
        }

        const est = estimatorBlock(o.estimator);
        if (est) lines.push(est);

        const d = o.delivery || {};
        if (d.name || d.address || d.pincode) {
            lines.push('');
            lines.push('*DELIVERY*');
            if (d.name) lines.push(`Buyer: ${d.name}`);
            if (d.phone) lines.push(`Phone: ${d.phone}`);
            if (d.address) lines.push(`Site: ${d.address}`);
            if (d.city || d.pincode) lines.push(`City / Pincode: ${[d.city, d.pincode].filter(Boolean).join(' - ')}`);
            if (d.roadAccess) lines.push(`Road access: ${ROAD_LABELS[d.roadAccess] || d.roadAccess}`);
            if (d.unloading) lines.push(`Unloading: ${d.unloading}`);
        }

        // B2B billing identity — only appears when the buyer supplied a
        // well-shaped GSTIN. The yard still verifies the registration itself.
        const b = o.billing || {};
        if (b.gstin) {
            lines.push('');
            lines.push('*BILLING (B2B)*');
            if (b.businessName) lines.push(`Firm: ${b.businessName}`);
            lines.push(`GSTIN: ${b.gstin}`);
            lines.push('Kindly raise the tax invoice in this name.');
        }

        lines.push('');
        lines.push(`*PAYMENT PREFERENCE*`);
        lines.push(PAYMENT_LABELS[o.payment] || PAYMENT_LABELS.cod);
        if (o.notes && o.notes.length) {
            lines.push('');
            lines.push('*NOTES*');
            o.notes.forEach((note) => lines.push(`• ${note}`));
        }

        lines.push('');
        lines.push('Please confirm rate, trolley availability and the dispatch slot from the Jalalpur yard.');
        return lines.join('\n');
    }

    function buildLink(text) {
        return `https://wa.me/${NUMBER}?text=${encodeURIComponent(text || '')}`;
    }

    function openLink(url) {
        if (!url) return;
        const native = window.Platform && typeof Platform.isNative === 'function' && Platform.isNative();
        if (native) {
            // Let the OS hand the wa.me link to the installed WhatsApp app.
            window.open(url, '_system');
            return;
        }
        const win = window.open(url, '_blank', 'noopener,noreferrer');
        if (!win) window.location.href = url; // popup blocked → same tab
    }

    // ── Estimates ────────────────────────────────────────────────
    function currentEstimatorSpec() {
        if (typeof lastEstimateSpec === 'undefined' || !lastEstimateSpec) return null;
        return lastEstimateSpec;
    }

    function sendEstimate(overrides) {
        const spec = Object.assign({}, currentEstimatorSpec() || {}, overrides || {});
        if (!spec.bricks) {
            if (typeof showToast === 'function') showToast('Run an estimate first, then send it on WhatsApp.', 'warning');
            return null;
        }
        const message = buildMessage({
            createdAt: Date.now(),
            total: spec.cost,
            estimator: spec,
            delivery: { pincode: latestPincode() }
        });
        openLink(buildLink(message));
        return message;
    }

    // ── Cart handoff ─────────────────────────────────────────────
    function cartSnapshot() {
        const items = (typeof cart !== 'undefined' && Array.isArray(cart) ? cart : []).map((i) => ({
            id: i.id,
            name: i.name,
            qty: Number(i.qty || 0),
            price: Number(i.price || 0),
            unit: i.unit || 'per piece'
        }));
        const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
        const discount = typeof couponDiscount === 'number' ? couponDiscount : 0;
        return {
            items,
            subtotal,
            discount,
            coupon: typeof appliedCoupon === 'string' ? appliedCoupon : '',
            total: Math.max(0, subtotal - discount)
        };
    }

    function latestPincode() {
        const pin = document.getElementById('coPincode');
        return pin && pin.value ? pin.value.trim() : '';
    }

    // Firm details for the order: the GSTIN typed in the cart panel wins, then
    // the one saved in the profile hub's GST directory.
    function billing() {
        const profile = (typeof user !== 'undefined' && user) ? user : {};
        const gstin = String(window.cartGstNumber || profile.gstin || '').trim().toUpperCase();
        return { gstin: gstin, businessName: String(profile.businessName || '').trim() };
    }

    function orderFromCart(overrides) {
        const snap = cartSnapshot();
        if (!snap.items.length) {
            if (typeof showToast === 'function') showToast('Your cart is empty — add bricks before ordering.', 'warning');
            return null;
        }
        const message = buildMessage(Object.assign({
            ref: makeOrderRef(),
            createdAt: Date.now(),
            items: snap.items,
            subtotal: snap.subtotal,
            discount: snap.discount,
            coupon: snap.coupon,
            total: snap.total,
            estimator: currentEstimatorSpec(),
            delivery: { pincode: latestPincode() },
            billing: billing(),
            payment: typeof selectedPayMethod === 'string' ? selectedPayMethod : 'cod',
            online: navigator.onLine
        }, overrides || {}));
        openLink(buildLink(message));
        return message;
    }

    // ── Checkout handoff ─────────────────────────────────────────
    function collectCheckout(ref) {
        const val = (id) => {
            const el = document.getElementById(id);
            return el && typeof el.value === 'string' ? el.value.trim() : '';
        };
        const snap = cartSnapshot();
        if (!snap.items.length) return null;

        const delivery = {
            name: val('coName'),
            phone: val('coPhone'),
            address: val('coAddress'),
            city: val('coCity'),
            pincode: val('coPincode'),
            roadAccess: val('coRoadAccess') || 'wide',
            unloading: (val('coLaborService') || '0') === '0'
                ? 'Self-unloading at site'
                : 'Gurukripa unloader team (+₹500 / trolley)'
        };
        if (!delivery.name || !delivery.phone || !delivery.address) {
            if (typeof showToast === 'function') showToast('Add name, phone and site address before sending the order.', 'error');
            return null;
        }

        const spec = currentEstimatorSpec();
        const notes = [];
        if (spec && spec.bricks && !snap.items.some((i) => i.qty >= spec.bricks)) {
            notes.push(`Estimator suggests ${num(spec.bricks)} bricks — cart has ${num(snap.items.reduce((s, i) => s + i.qty, 0))}.`);
        }
        if (delivery.roadAccess === 'narrow') notes.push('Site needs a mini trolley for the last stretch.');

        return {
            ref: ref || makeOrderRef(),
            createdAt: Date.now(),
            items: snap.items,
            subtotal: snap.subtotal,
            discount: snap.discount,
            coupon: snap.coupon,
            deliveryFee: 0,
            total: snap.total,
            estimator: spec,
            delivery,
            billing: billing(),
            payment: typeof selectedPayMethod === 'string' ? selectedPayMethod : 'cod',
            notes,
            online: navigator.onLine
        };
    }

    // Builds the full checkout order without opening WhatsApp, so checkout.js
    // can record the order, notify the buyer and only then hand off.
    function buildCheckoutOrder(ref) {
        const payload = collectCheckout(ref);
        if (!payload) return null;
        payload.text = buildMessage(payload);
        payload.link = buildLink(payload.text);
        return payload;
    }

    function open(payload) {
        if (!payload) return;
        if (payload.link) openLink(payload.link);
        else if (payload.text) openLink(buildLink(payload.text));
    }

    // ── Offline outbox ───────────────────────────────────────────
    function queueOffline(payload) {
        if (!payload) return Promise.resolve(null);
        const message = payload.text || buildMessage(payload);
        const rowBase = {
            ref: payload.ref,
            message: message,
            waLink: buildLink(message),
            total: payload.total,
            payment: payload.payment,
            pincode: payload.delivery ? payload.delivery.pincode : '',
            itemCount: (payload.items || []).reduce((s, i) => s + Number(i.qty || 0), 0),
            status: 'pending',
            label: 'Pending, not sent yet',
            type: 'order'
        };
        const enqueue = window.OfflineQueue
            ? OfflineQueue.enqueue('order', payload, rowBase)
            : (window.OfflineStore
                ? OfflineStore.queueOrder(Object.assign({ synced: false, createdAt: Date.now() }, rowBase))
                : Promise.resolve(null));
        return enqueue.then((row) => {
            renderQueuedNotice();
            if (typeof renderOfflineQueueUI === 'function') renderOfflineQueueUI();
            return row;
        });
    }

    function sendQueuedOrders() {
        if (!window.OfflineStore) return Promise.resolve(false);
        return OfflineStore.listOutbox(true).then((rows) => {
            if (!rows.length) {
                if (typeof showToast === 'function') showToast('No offline orders are waiting.', 'info');
                return false;
            }
            const next = rows[0];
            openLink(buildLink(next.message || ''));
            return OfflineStore.markOutboxSent(next.id).then(() => {
                renderQueuedNotice();
                if (typeof showToast === 'function') {
                    showToast(rows.length > 1
                        ? `Sent ${next.ref || 'order'} on WhatsApp. ${rows.length - 1} more waiting.`
                        : `Sent ${next.ref || 'order'} on WhatsApp.`, 'success');
                }
                return true;
            });
        });
    }

    function renderQueuedNotice() {
        const box = document.getElementById('cartOutboxNotice');
        if (!box || !window.OfflineStore) return;
        OfflineStore.listOutbox(true).then((rows) => {
            if (!rows.length) {
                box.style.display = 'none';
                box.innerHTML = '';
                return;
            }
            const first = rows[0];
            box.style.display = 'block';
            box.innerHTML = `
                <div class="outbox-row">
                    <span class="outbox-icon" aria-hidden="true">
                        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 2v13"/><polyline points="6 9 12 15 18 9"/><path d="M4 21h16"/></svg>
                    </span>
                    <span class="outbox-text">
                        <strong>${rows.length} item${rows.length > 1 ? 's' : ''} <span class="gbi-badge-waiting">Waiting to send</span></strong>
                        <span>${sanitizeHTML(first.ref || 'Saved order')} — Pending, not sent yet.</span>
                    </span>
                    <button type="button" class="outbox-send" data-needs-network data-offline-label="Send via WhatsApp when online" onclick="navigator.onLine ? WhatsAppOrder.sendQueuedOrders() : (typeof showToast==='function'&&showToast('WhatsApp opens when you are back online. Draft is saved.', 'warning'))">${navigator.onLine ? 'Send' : 'Send when online'}</button>
                </div>`;
        });
    }

    // ── Order tracking shortcut ─────────────────────────────────
    function trackOrder(orderId) {
        const id = orderId || '';
        const message = `Namaste ${BRAND}! Please share the latest status for order *${id}* — trolley position and expected unloading time.`;
        openLink(buildLink(message));
    }

    return {
        NUMBER,
        buildMessage,
        buildLink,
        openLink,
        makeOrderRef,
        currentEstimatorSpec,
        sendEstimate,
        orderFromCart,
        buildCheckoutOrder,
        open,
        queueOffline,
        sendQueuedOrders,
        renderQueuedNotice,
        trackOrder
    };
})();

window.WhatsAppOrder = WhatsAppOrder;

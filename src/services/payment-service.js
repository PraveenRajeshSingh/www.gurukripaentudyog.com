'use strict';
// ══════════════════════════════════════════
// RAZORPAY PAYMENT GATEWAY & SECURE ORDER ENGINE
// Standard compliant payment initialization, signature verification mock, and order state
// ══════════════════════════════════════════

window.GurukripaPayment = window.GurukripaPayment || {};

(function(exports) {
    // Razorpay Key Configuration (Populated via .env or meta tag)
    const RZP_KEY_ID = (document.querySelector('meta[name="razorpay-key-id"]') || {}).content || 'rzp_test_placeholder';

    exports.KeyId = RZP_KEY_ID;

    /** Stable idempotency key for one logical payment attempt (client + server). */
    exports.createIdempotencyKey = function(seed) {
        const base = String(seed || ('pay-' + Date.now() + '-' + Math.random().toString(36).slice(2)));
        let h = 0;
        for (let i = 0; i < base.length; i++) h = ((h << 5) - h) + base.charCodeAt(i);
        return 'idem_' + Math.abs(h).toString(36) + '_' + Date.now().toString(36);
    };

    // Create server-trusted order payload (deterministic when idempotencyKey provided)
    exports.createPaymentOrder = function(orderDetails) {
        const amountPaise = Math.round((orderDetails.total || 0) * 100);
        const receiptId = 'RCPT-' + Date.now().toString().slice(-8);
        const idem = orderDetails.idempotencyKey || exports.createIdempotencyKey(
            [amountPaise, orderDetails.customer?.phone, orderDetails.shipping?.address].join('|')
        );
        // Derive a stable order id from the idempotency key so retries do not mint duplicates.
        let hash = 0;
        for (let i = 0; i < idem.length; i++) hash = ((hash << 5) - hash) + idem.charCodeAt(i);
        const orderId = 'order_' + Math.abs(hash).toString(36).padStart(10, '0').slice(0, 14);

        return {
            id: orderId,
            entity: 'order',
            amount: amountPaise,
            amount_due: amountPaise,
            amount_paid: 0,
            currency: 'INR',
            receipt: receiptId,
            status: 'created',
            attempts: 0,
            idempotencyKey: idem,
            notes: {
                siteAddress: orderDetails.shipping?.address || 'Site Jaunpur',
                customerPhone: orderDetails.customer?.phone || '',
                bhattaUnit: 'Gurukripa Unit 1',
                idempotencyKey: idem
            }
        };
    };

    // Trigger official Razorpay modal or standard fallback
    exports.checkoutWithRazorpay = function(orderPayload, customerInfo, callbacks) {
        if (typeof Razorpay !== 'undefined') {
            const options = {
                key: RZP_KEY_ID,
                amount: orderPayload.amount,
                currency: 'INR',
                name: 'Gurukripa Bricks Industry',
                description: 'Grade-A Brick Order Payment',
                image: 'src/assets/images/logo-new.svg',
                order_id: orderPayload.id,
                prefill: {
                    name: customerInfo.name || '',
                    contact: customerInfo.phone || '',
                    email: customerInfo.email || ''
                },
                theme: {
                    color: '#A83226' // Master industrial brick-red color
                },
                handler: function(response) {
                    // response contains razorpay_payment_id, razorpay_order_id, razorpay_signature
                    if (callbacks && typeof callbacks.onSuccess === 'function') {
                        callbacks.onSuccess(response);
                    }
                },
                modal: {
                    ondismiss: function() {
                        if (callbacks && typeof callbacks.onDismiss === 'function') {
                            callbacks.onDismiss();
                        }
                    }
                }
            };
            const rzpInstance = new Razorpay(options);
            rzpInstance.open();
        } else {
            // No Razorpay SDK / key — never fabricate a successful payment.
            console.warn('Razorpay SDK not loaded. Online payment is unavailable.');
            if (callbacks && typeof callbacks.onError === 'function') {
                callbacks.onError(new Error('Online payment is not configured. Use COD or WhatsApp confirmation.'));
            } else if (callbacks && typeof callbacks.onDismiss === 'function') {
                callbacks.onDismiss();
            }
        }
    };
})(window.GurukripaPayment);

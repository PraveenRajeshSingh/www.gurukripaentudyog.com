"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var RazorpayService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RazorpayService = void 0;
const common_1 = require("@nestjs/common");
const crypto = require("crypto");
let RazorpayService = RazorpayService_1 = class RazorpayService {
    constructor() {
        this.log = new common_1.Logger(RazorpayService_1.name);
    }
    isLiveConfigured() {
        return !!(String(process.env.RAZORPAY_KEY_ID || '').trim() &&
            String(process.env.RAZORPAY_KEY_SECRET || '').trim());
    }
    publicKeyId() {
        return String(process.env.RAZORPAY_KEY_ID || '').trim();
    }
    async createOrder(input) {
        const currency = input.currency || 'INR';
        const receipt = input.receipt || `RCPT-${Date.now().toString().slice(-8)}`;
        const notes = input.notes || {};
        if (!this.isLiveConfigured()) {
            const stubId = 'order_' + Buffer.from(input.idempotencyKey || String(Date.now())).toString('hex').slice(0, 14);
            this.log.warn('Razorpay keys missing — returning synthetic order stub (not chargeable).');
            return {
                live: false,
                order: {
                    id: stubId,
                    entity: 'order',
                    amount: input.amountPaise,
                    amount_due: input.amountPaise,
                    amount_paid: 0,
                    currency,
                    receipt,
                    status: 'created',
                    notes: { ...notes, stub: 'true' },
                    idempotencyKey: input.idempotencyKey,
                },
            };
        }
        const auth = Buffer.from(`${this.publicKeyId()}:${String(process.env.RAZORPAY_KEY_SECRET).trim()}`).toString('base64');
        const res = await fetch('https://api.razorpay.com/v1/orders', {
            method: 'POST',
            headers: {
                Authorization: `Basic ${auth}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                amount: input.amountPaise,
                currency,
                receipt,
                notes,
            }),
        });
        if (!res.ok) {
            const text = await res.text().catch(() => '');
            this.log.error(`Razorpay order create failed: ${res.status} ${text.slice(0, 200)}`);
            throw new Error('Unable to create payment order with gateway');
        }
        const data = (await res.json());
        return {
            live: true,
            order: {
                ...data,
                idempotencyKey: input.idempotencyKey,
            },
        };
    }
    verifyPaymentSignature(orderId, paymentId, signature) {
        const secret = String(process.env.RAZORPAY_KEY_SECRET || '').trim();
        if (!secret)
            return false;
        const expected = crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
        return expected === String(signature || '');
    }
    verifyWebhookSignature(rawBody, signatureHeader) {
        const secret = String(process.env.RAZORPAY_WEBHOOK_SECRET || '').trim();
        if (!secret)
            return false;
        const expected = crypto
            .createHmac('sha256', secret)
            .update(typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8'))
            .digest('hex');
        return expected === String(signatureHeader || '');
    }
};
exports.RazorpayService = RazorpayService;
exports.RazorpayService = RazorpayService = RazorpayService_1 = __decorate([
    (0, common_1.Injectable)()
], RazorpayService);
//# sourceMappingURL=razorpay.service.js.map
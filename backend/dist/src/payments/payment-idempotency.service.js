"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentIdempotencyService = void 0;
const common_1 = require("@nestjs/common");
const crypto = require("crypto");
let PaymentIdempotencyService = class PaymentIdempotencyService {
    constructor() {
        this.records = new Map();
        this.byGatewayPayment = new Map();
    }
    hashRequest(payload) {
        return crypto.createHash('sha256').update(JSON.stringify(payload ?? {})).digest('hex');
    }
    begin(params) {
        const key = String(params.idempotencyKey || '').trim();
        if (!key || key.length < 8) {
            throw new common_1.ConflictException('idempotencyKey is required (min 8 chars)');
        }
        const requestHash = this.hashRequest(params.request);
        const existing = this.records.get(key);
        if (existing) {
            if (existing.requestHash !== requestHash) {
                throw new common_1.ConflictException('Idempotency key reused with a different payload');
            }
            return { record: existing, replay: true };
        }
        const now = new Date().toISOString();
        const record = {
            idempotencyKey: key,
            tenantId: params.tenantId,
            operation: params.operation,
            requestHash,
            status: 'STARTED',
            createdAt: now,
            updatedAt: now,
        };
        this.records.set(key, record);
        return { record, replay: false };
    }
    markProcessing(key) {
        const rec = this.must(key);
        if (rec.status === 'SUCCEEDED')
            return rec;
        rec.status = 'PROCESSING';
        rec.updatedAt = new Date().toISOString();
        return rec;
    }
    succeed(key, result) {
        const rec = this.must(key);
        if (result.gatewayPaymentId) {
            const priorKey = this.byGatewayPayment.get(result.gatewayPaymentId);
            if (priorKey && priorKey !== key) {
                throw new common_1.ConflictException('Duplicate gateway payment id — capture already recorded');
            }
            this.byGatewayPayment.set(result.gatewayPaymentId, key);
        }
        rec.status = 'SUCCEEDED';
        rec.resourceType = result.resourceType;
        rec.resourceId = result.resourceId;
        rec.gatewayOrderId = result.gatewayOrderId;
        rec.gatewayPaymentId = result.gatewayPaymentId;
        rec.responseJson = result.responseJson;
        rec.updatedAt = new Date().toISOString();
        return rec;
    }
    fail(key, message) {
        const rec = this.must(key);
        if (rec.status === 'SUCCEEDED')
            return rec;
        rec.status = 'FAILED';
        rec.errorMessage = message;
        rec.updatedAt = new Date().toISOString();
        return rec;
    }
    get(key) {
        return this.records.get(key) || null;
    }
    findByGatewayPayment(paymentId) {
        const key = this.byGatewayPayment.get(paymentId);
        return key ? this.records.get(key) || null : null;
    }
    assertUniqueCapture(gatewayPaymentId) {
        const prior = this.findByGatewayPayment(gatewayPaymentId);
        if (prior && prior.status === 'SUCCEEDED') {
            return { duplicate: true, record: prior };
        }
        return { duplicate: false, record: null };
    }
    must(key) {
        const rec = this.records.get(key);
        if (!rec)
            throw new common_1.ConflictException('Unknown idempotency key');
        return rec;
    }
};
exports.PaymentIdempotencyService = PaymentIdempotencyService;
exports.PaymentIdempotencyService = PaymentIdempotencyService = __decorate([
    (0, common_1.Injectable)()
], PaymentIdempotencyService);
//# sourceMappingURL=payment-idempotency.service.js.map
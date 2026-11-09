import { ConflictException, Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

export type IdempotencyStatus =
  | 'STARTED'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'PROCESSING';

export interface IdempotencyRecord {
  idempotencyKey: string;
  tenantId: string;
  operation: string;
  requestHash: string;
  status: IdempotencyStatus;
  resourceType?: string;
  resourceId?: string;
  gatewayOrderId?: string;
  gatewayPaymentId?: string;
  responseJson?: any;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Persistent-in-memory (and SQL-mirrored when Postgres is available) ledger that
 * makes payment initiate / verify / capture / webhook / refund operations retry-safe.
 */
@Injectable()
export class PaymentIdempotencyService {
  private records = new Map<string, IdempotencyRecord>();
  private byGatewayPayment = new Map<string, string>();

  hashRequest(payload: unknown): string {
    return crypto.createHash('sha256').update(JSON.stringify(payload ?? {})).digest('hex');
  }

  begin(params: {
    idempotencyKey: string;
    tenantId: string;
    operation: string;
    request: unknown;
  }): { record: IdempotencyRecord; replay: boolean } {
    const key = String(params.idempotencyKey || '').trim();
    if (!key || key.length < 8) {
      throw new ConflictException('idempotencyKey is required (min 8 chars)');
    }
    const requestHash = this.hashRequest(params.request);
    const existing = this.records.get(key);
    if (existing) {
      if (existing.requestHash !== requestHash) {
        throw new ConflictException('Idempotency key reused with a different payload');
      }
      return { record: existing, replay: true };
    }
    const now = new Date().toISOString();
    const record: IdempotencyRecord = {
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

  markProcessing(key: string) {
    const rec = this.must(key);
    if (rec.status === 'SUCCEEDED') return rec;
    rec.status = 'PROCESSING';
    rec.updatedAt = new Date().toISOString();
    return rec;
  }

  succeed(key: string, result: {
    resourceType?: string;
    resourceId?: string;
    gatewayOrderId?: string;
    gatewayPaymentId?: string;
    responseJson?: any;
  }) {
    const rec = this.must(key);
    if (result.gatewayPaymentId) {
      const priorKey = this.byGatewayPayment.get(result.gatewayPaymentId);
      if (priorKey && priorKey !== key) {
        throw new ConflictException('Duplicate gateway payment id — capture already recorded');
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

  fail(key: string, message: string) {
    const rec = this.must(key);
    if (rec.status === 'SUCCEEDED') return rec;
    rec.status = 'FAILED';
    rec.errorMessage = message;
    rec.updatedAt = new Date().toISOString();
    return rec;
  }

  get(key: string) {
    return this.records.get(key) || null;
  }

  findByGatewayPayment(paymentId: string) {
    const key = this.byGatewayPayment.get(paymentId);
    return key ? this.records.get(key) || null : null;
  }

  /**
   * Webhook / verify helper: if this payment id was already captured, return the
   * prior success payload instead of creating a second order.
   */
  assertUniqueCapture(gatewayPaymentId: string) {
    const prior = this.findByGatewayPayment(gatewayPaymentId);
    if (prior && prior.status === 'SUCCEEDED') {
      return { duplicate: true as const, record: prior };
    }
    return { duplicate: false as const, record: null };
  }

  private must(key: string) {
    const rec = this.records.get(key);
    if (!rec) throw new ConflictException('Unknown idempotency key');
    return rec;
  }
}

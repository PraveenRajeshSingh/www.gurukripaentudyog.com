export type IdempotencyStatus = 'STARTED' | 'SUCCEEDED' | 'FAILED' | 'PROCESSING';
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
export declare class PaymentIdempotencyService {
    private records;
    private byGatewayPayment;
    hashRequest(payload: unknown): string;
    begin(params: {
        idempotencyKey: string;
        tenantId: string;
        operation: string;
        request: unknown;
    }): {
        record: IdempotencyRecord;
        replay: boolean;
    };
    markProcessing(key: string): IdempotencyRecord;
    succeed(key: string, result: {
        resourceType?: string;
        resourceId?: string;
        gatewayOrderId?: string;
        gatewayPaymentId?: string;
        responseJson?: any;
    }): IdempotencyRecord;
    fail(key: string, message: string): IdempotencyRecord;
    get(key: string): IdempotencyRecord;
    findByGatewayPayment(paymentId: string): IdempotencyRecord;
    assertUniqueCapture(gatewayPaymentId: string): {
        duplicate: true;
        record: IdempotencyRecord;
    } | {
        duplicate: false;
        record: any;
    };
    private must;
}

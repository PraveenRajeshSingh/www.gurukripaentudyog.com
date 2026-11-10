export type RazorpayOrderPayload = {
    id: string;
    entity: string;
    amount: number;
    amount_due: number;
    amount_paid: number;
    currency: string;
    receipt: string;
    status: string;
    notes?: Record<string, string>;
    idempotencyKey?: string;
};
export declare class RazorpayService {
    private readonly log;
    isLiveConfigured(): boolean;
    publicKeyId(): string;
    createOrder(input: {
        amountPaise: number;
        currency?: string;
        receipt?: string;
        notes?: Record<string, string>;
        idempotencyKey?: string;
    }): Promise<{
        order: RazorpayOrderPayload;
        live: boolean;
    }>;
    verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean;
    verifyWebhookSignature(rawBody: string | Buffer, signatureHeader: string | undefined): boolean;
}

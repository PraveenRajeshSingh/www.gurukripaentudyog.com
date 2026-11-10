export declare class RecaptchaService {
    private readonly log;
    isConfigured(): boolean;
    minScore(): number;
    verifyOrThrow(token: string | undefined | null, action?: string, remoteIp?: string): Promise<void>;
}

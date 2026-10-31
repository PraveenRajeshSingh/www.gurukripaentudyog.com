export declare function runMigrations(): Promise<{
    success: boolean;
    applied: string[];
    error?: string;
}>;

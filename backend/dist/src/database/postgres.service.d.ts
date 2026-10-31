import { PoolClient, QueryResult } from 'pg';
export interface DatabaseConfig {
    connectionString?: string;
    host?: string;
    port?: number;
    user?: string;
    password?: string;
    database?: string;
}
export declare class PostgresService {
    private static instance;
    private pool;
    private isConnected;
    private constructor();
    static getInstance(): PostgresService;
    init(config?: DatabaseConfig): void;
    query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>>;
    transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T>;
    testConnection(): Promise<{
        ok: boolean;
        message: string;
        version?: string;
    }>;
    close(): Promise<void>;
}

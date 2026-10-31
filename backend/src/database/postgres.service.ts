import { Pool, PoolClient, QueryResult } from 'pg';

export interface DatabaseConfig {
  connectionString?: string;
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
}

export class PostgresService {
  private static instance: PostgresService;
  private pool: Pool | null = null;
  private isConnected = false;

  private constructor() {}

  public static getInstance(): PostgresService {
    if (!PostgresService.instance) {
      PostgresService.instance = new PostgresService();
    }
    return PostgresService.instance;
  }

  public init(config?: DatabaseConfig): void {
    const connectionString = config?.connectionString || process.env.DATABASE_URL;
    
    if (connectionString) {
      this.pool = new Pool({
        connectionString,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      });
    } else {
      this.pool = new Pool({
        host: config?.host || process.env.DB_HOST || '127.0.0.1',
        port: Number(config?.port || process.env.DB_PORT || 5432),
        user: config?.user || process.env.DB_USER || 'postgres',
        password: config?.password || process.env.DB_PASSWORD || 'postgres',
        database: config?.database || process.env.DB_NAME || 'brick_supply_saas_dev',
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      });
    }

    this.pool.on('error', (err) => {
      console.error('Unexpected PostgreSQL client error on idle pool client:', err);
    });
  }

  public async query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
    if (!this.pool) {
      this.init();
    }
    return this.pool!.query<T>(text, params);
  }

  /**
   * Run a series of queries inside an isolated transaction
   */
  public async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    if (!this.pool) {
      this.init();
    }
    const client = await this.pool!.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Safe check for active PostgreSQL database connectivity
   */
  public async testConnection(): Promise<{ ok: boolean; message: string; version?: string }> {
    try {
      const res = await this.query('SELECT version()');
      this.isConnected = true;
      return { ok: true, message: 'Connected to PostgreSQL successfully', version: res.rows[0].version };
    } catch (error: any) {
      this.isConnected = false;
      return { ok: false, message: `PostgreSQL connection failed: ${error.message}` };
    }
  }

  public async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      this.isConnected = false;
    }
  }
}

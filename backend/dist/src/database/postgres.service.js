"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostgresService = void 0;
const pg_1 = require("pg");
class PostgresService {
    constructor() {
        this.pool = null;
        this.isConnected = false;
    }
    static getInstance() {
        if (!PostgresService.instance) {
            PostgresService.instance = new PostgresService();
        }
        return PostgresService.instance;
    }
    init(config) {
        const connectionString = config?.connectionString || process.env.DATABASE_URL;
        if (connectionString) {
            this.pool = new pg_1.Pool({
                connectionString,
                max: 20,
                idleTimeoutMillis: 30000,
                connectionTimeoutMillis: 5000,
            });
        }
        else {
            this.pool = new pg_1.Pool({
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
    async query(text, params) {
        if (!this.pool) {
            this.init();
        }
        return this.pool.query(text, params);
    }
    async transaction(callback) {
        if (!this.pool) {
            this.init();
        }
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            const result = await callback(client);
            await client.query('COMMIT');
            return result;
        }
        catch (err) {
            await client.query('ROLLBACK');
            throw err;
        }
        finally {
            client.release();
        }
    }
    async testConnection() {
        try {
            const res = await this.query('SELECT version()');
            this.isConnected = true;
            return { ok: true, message: 'Connected to PostgreSQL successfully', version: res.rows[0].version };
        }
        catch (error) {
            this.isConnected = false;
            return { ok: false, message: `PostgreSQL connection failed: ${error.message}` };
        }
    }
    async close() {
        if (this.pool) {
            await this.pool.end();
            this.pool = null;
            this.isConnected = false;
        }
    }
}
exports.PostgresService = PostgresService;
//# sourceMappingURL=postgres.service.js.map
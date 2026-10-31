"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runMigrations = runMigrations;
const fs = require("fs");
const path = require("path");
const postgres_service_1 = require("./postgres.service");
async function runMigrations() {
    const pg = postgres_service_1.PostgresService.getInstance();
    const connCheck = await pg.testConnection();
    if (!connCheck.ok) {
        return { success: false, applied: [], error: connCheck.message };
    }
    const migrationsDir = path.resolve(__dirname, 'migrations');
    if (!fs.existsSync(migrationsDir)) {
        return { success: true, applied: [] };
    }
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
    const applied = [];
    await pg.query(`
    CREATE TABLE IF NOT EXISTS _schema_migrations (
      id SERIAL PRIMARY KEY,
      version VARCHAR(50) NOT NULL UNIQUE,
      applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);
    for (const file of files) {
        const version = file.replace('.sql', '');
        const check = await pg.query('SELECT 1 FROM _schema_migrations WHERE version = $1', [version]);
        if (check.rows.length === 0) {
            console.log(`Executing migration: ${file}`);
            const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
            await pg.transaction(async (client) => {
                await client.query(sql);
                await client.query('INSERT INTO _schema_migrations (version) VALUES ($1)', [version]);
            });
            applied.push(version);
        }
    }
    return { success: true, applied };
}
if (require.main === module) {
    runMigrations()
        .then((res) => {
        console.log('Migration result:', res);
        process.exit(res.success ? 0 : 1);
    })
        .catch((err) => {
        console.error('Migration failed:', err);
        process.exit(1);
    });
}
//# sourceMappingURL=migrator.js.map
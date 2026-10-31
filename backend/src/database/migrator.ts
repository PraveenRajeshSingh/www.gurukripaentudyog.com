import * as fs from 'fs';
import * as path from 'path';
import { PostgresService } from './postgres.service';

export async function runMigrations(): Promise<{ success: boolean; applied: string[]; error?: string }> {
  const pg = PostgresService.getInstance();
  const connCheck = await pg.testConnection();
  if (!connCheck.ok) {
    return { success: false, applied: [], error: connCheck.message };
  }

  const migrationsDir = path.resolve(__dirname, 'migrations');
  if (!fs.existsSync(migrationsDir)) {
    return { success: true, applied: [] };
  }

  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
  const applied: string[] = [];

  // Ensure migrations table exists
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

// Standalone runner
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

/**
 * CLI: seed QA test accounts + demo data (dev/staging only).
 *
 *   $env:ALLOW_DEMO_SEED="1"; npm run seed:demo
 *   $env:ALLOW_DEMO_SEED="1"; npm run seed:demo:reset
 */
import * as path from 'path';
import { runDemoSeed } from '../src/platform/demo-seed';

async function main() {
  const reset = process.argv.includes('--reset');
  const repoRoot = path.resolve(__dirname, '../..');
  const result = await runDemoSeed({ reset, repoRoot });
  const s = result.summary;
  console.log('\n=== Demo seed complete ===');
  console.log(`Credentials: ${result.credentialsPath}`);
  console.log(`Dataset:     ${result.datasetPath}`);
  console.log(`Tenants: ${s.tenants} | Accounts: ${s.accounts} | Products: ${s.products}`);
  console.log(`Orders: ${s.orders} | Enquiries: ${s.enquiries} | Quotations: ${s.quotations} | Projects/sites: ${s.projects}`);
  console.log(`Login verified: ${s.loginPass}/${s.accounts} (fail ${s.loginFail})`);
  console.log(`Permission checks: ${s.permissionPass} pass / ${s.permissionFail} fail`);
  console.log(`Cross-tenant checks: ${s.crossTenantPass} pass / ${s.crossTenantFail} fail`);
  if (s.failures.length) {
    console.error('\nFailures:');
    for (const f of s.failures) console.error(' -', f);
    process.exitCode = 1;
  } else {
    console.log('\nAll seeded login + isolation checks passed.');
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});

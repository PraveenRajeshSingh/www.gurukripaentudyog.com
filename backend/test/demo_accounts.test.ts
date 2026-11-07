/**
 * Verifies demo seeder: unique credentials, bcrypt storage, login, suspended deny,
 * and cross-tenant permission blocks. Requires ALLOW_DEMO_SEED=1.
 */
import { test, describe, before } from 'node:test';
import * as assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcrypt';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { runDemoSeed, createDemoRuntime, DemoSeedResult } from '../src/platform/demo-seed';
import { PlatformStoreService } from '../src/platform/store.service';

const TENANT_A = PlatformStoreService.GURUKRIPA_TENANT_ID;
const TENANT_B = 'tenant-awadh-002';

describe('Demo seed accounts (ALLOW_DEMO_SEED)', () => {
  let result: DemoSeedResult;

  before(async () => {
    process.env.ALLOW_DEMO_SEED = '1';
    delete process.env.NODE_ENV;
    const repoRoot = path.resolve(__dirname, '../..');
    result = await runDemoSeed({ reset: true, repoRoot });
  });

  test('credentials file exists and is non-empty', () => {
    assert.ok(fs.existsSync(result.credentialsPath));
    const body = fs.readFileSync(result.credentialsPath, 'utf8');
    assert.match(body, /CONFIDENTIAL/);
    assert.match(body, /Guest \/ Public Visitor/);
    assert.ok(body.includes('@example.com'));
  });

  test('every active account login succeeded; suspended/disabled expected-deny marked verified', () => {
    assert.equal(result.summary.loginFail, 0, result.summary.failures.join('; '));
    for (const a of result.accounts) {
      assert.ok(a.password.length >= 12, `${a.key} password too short`);
      assert.ok(a.email.endsWith('@example.com'));
    }
  });

  test('passwords are unique across accounts', () => {
    const set = new Set(result.accounts.map((a) => a.password));
    assert.equal(set.size, result.accounts.length);
  });

  test('phones and emails are unique', () => {
    assert.equal(new Set(result.accounts.map((a) => a.phone)).size, result.accounts.length);
    assert.equal(new Set(result.accounts.map((a) => a.email)).size, result.accounts.length);
  });

  test('requested role personas exist for Tenant A and Tenant B', () => {
    const titles = new Set(result.accounts.map((a) => a.jobTitle));
    for (const need of [
      'Platform Super Admin', 'Tenant Admin', 'Branch Manager', 'Sales Staff',
      'Inventory Staff', 'Accountant', 'Delivery Driver', 'Contractor / Builder', 'Normal Customer',
    ]) {
      assert.ok(titles.has(need), `missing persona ${need}`);
    }
    assert.ok(result.accounts.some((a) => a.tenantId === TENANT_A));
    assert.ok(result.accounts.some((a) => a.tenantId === TENANT_B));
  });

  test('permission and cross-tenant suites passed inside seeder', () => {
    assert.equal(result.summary.permissionFail, 0, result.summary.failures.join('; '));
    assert.equal(result.summary.crossTenantFail, 0, result.summary.failures.join('; '));
    assert.ok(result.summary.permissionPass >= 3);
    assert.ok(result.summary.crossTenantPass >= 3);
  });

  test('live AuthService rejects suspended account and accepts active customer', async () => {
    // Re-seed into a fresh runtime and verify bcrypt + login gates independently
    process.env.ALLOW_DEMO_SEED = '1';
    const rt = createDemoRuntime();
    const { store, auth } = rt;
    const active = result.accounts.find((a) => a.key === 'a-customer-1')!;
    const suspended = result.accounts.find((a) => a.key === 'a-customer-suspended')!;

    await store.createUser({
      tenantId: TENANT_A, role: 'CUSTOMER', name: active.fullName, phone: '9000199991',
      email: 'recheck.active@example.com', passwordHash: await bcrypt.hash(active.password, 4),
      accountStatus: 'ACTIVE', isTestAccount: true,
    });
    await store.createUser({
      tenantId: TENANT_A, role: 'CUSTOMER', name: suspended.fullName, phone: '9000199992',
      email: 'recheck.susp@example.com', passwordHash: await bcrypt.hash(suspended.password, 4),
      accountStatus: 'SUSPENDED', isTestAccount: true,
    });

    const ok = await auth.login({ phone: '9000199991', password: active.password, tenantSlug: 'gurukripa' } as any);
    assert.equal(ok.user.role, 'CUSTOMER');
    await assert.rejects(
      () => auth.login({ phone: '9000199992', password: suspended.password, tenantSlug: 'gurukripa' } as any),
      ForbiddenException,
    );
    await assert.rejects(
      () => auth.login({ phone: '9000199991', password: 'WrongPass!999', tenantSlug: 'gurukripa' } as any),
      UnauthorizedException,
    );
  });

  test('demo dataset sidecar marks TEST DATA', () => {
    assert.ok(fs.existsSync(result.datasetPath));
    const data = JSON.parse(fs.readFileSync(result.datasetPath, 'utf8'));
    assert.match(data.mark, /TEST DATA/);
    assert.ok(data.inventory.length >= 3);
    assert.ok(data.finance.payments.some((p: any) => p.status === 'FAILED'));
  });
});

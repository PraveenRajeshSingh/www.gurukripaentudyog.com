"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");
const common_1 = require("@nestjs/common");
const demo_seed_1 = require("../src/platform/demo-seed");
const store_service_1 = require("../src/platform/store.service");
const TENANT_A = store_service_1.PlatformStoreService.GURUKRIPA_TENANT_ID;
const TENANT_B = 'tenant-awadh-002';
(0, node_test_1.describe)('Demo seed accounts (ALLOW_DEMO_SEED)', () => {
    let result;
    (0, node_test_1.before)(async () => {
        process.env.ALLOW_DEMO_SEED = '1';
        delete process.env.NODE_ENV;
        const repoRoot = path.resolve(__dirname, '../..');
        result = await (0, demo_seed_1.runDemoSeed)({ reset: true, repoRoot });
    });
    (0, node_test_1.test)('credentials file exists and is non-empty', () => {
        assert.ok(fs.existsSync(result.credentialsPath));
        const body = fs.readFileSync(result.credentialsPath, 'utf8');
        assert.match(body, /CONFIDENTIAL/);
        assert.match(body, /Guest \/ Public Visitor/);
        assert.ok(body.includes('@example.com'));
    });
    (0, node_test_1.test)('every active account login succeeded; suspended/disabled expected-deny marked verified', () => {
        assert.equal(result.summary.loginFail, 0, result.summary.failures.join('; '));
        for (const a of result.accounts) {
            assert.ok(a.password.length >= 12, `${a.key} password too short`);
            assert.ok(a.email.endsWith('@example.com'));
        }
    });
    (0, node_test_1.test)('passwords are unique across accounts', () => {
        const set = new Set(result.accounts.map((a) => a.password));
        assert.equal(set.size, result.accounts.length);
    });
    (0, node_test_1.test)('phones and emails are unique', () => {
        assert.equal(new Set(result.accounts.map((a) => a.phone)).size, result.accounts.length);
        assert.equal(new Set(result.accounts.map((a) => a.email)).size, result.accounts.length);
    });
    (0, node_test_1.test)('requested role personas exist for Tenant A and Tenant B', () => {
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
    (0, node_test_1.test)('permission and cross-tenant suites passed inside seeder', () => {
        assert.equal(result.summary.permissionFail, 0, result.summary.failures.join('; '));
        assert.equal(result.summary.crossTenantFail, 0, result.summary.failures.join('; '));
        assert.ok(result.summary.permissionPass >= 3);
        assert.ok(result.summary.crossTenantPass >= 3);
    });
    (0, node_test_1.test)('live AuthService rejects suspended account and accepts active customer', async () => {
        process.env.ALLOW_DEMO_SEED = '1';
        const rt = (0, demo_seed_1.createDemoRuntime)();
        const { store, auth } = rt;
        const active = result.accounts.find((a) => a.key === 'a-customer-1');
        const suspended = result.accounts.find((a) => a.key === 'a-customer-suspended');
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
        const ok = await auth.login({ phone: '9000199991', password: active.password, tenantSlug: 'gurukripa' });
        assert.equal(ok.user.role, 'CUSTOMER');
        await assert.rejects(() => auth.login({ phone: '9000199992', password: suspended.password, tenantSlug: 'gurukripa' }), common_1.ForbiddenException);
        await assert.rejects(() => auth.login({ phone: '9000199991', password: 'WrongPass!999', tenantSlug: 'gurukripa' }), common_1.UnauthorizedException);
    });
    (0, node_test_1.test)('demo dataset sidecar marks TEST DATA', () => {
        assert.ok(fs.existsSync(result.datasetPath));
        const data = JSON.parse(fs.readFileSync(result.datasetPath, 'utf8'));
        assert.match(data.mark, /TEST DATA/);
        assert.ok(data.inventory.length >= 3);
        assert.ok(data.finance.payments.some((p) => p.status === 'FAILED'));
    });
});
//# sourceMappingURL=demo_accounts.test.js.map
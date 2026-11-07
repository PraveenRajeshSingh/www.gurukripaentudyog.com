"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDemoRuntime = createDemoRuntime;
exports.runDemoSeed = runDemoSeed;
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const jwt_1 = require("@nestjs/jwt");
const pricing_service_1 = require("../pricing/pricing.service");
const mock_db_service_1 = require("../database/mock-db.service");
const store_service_1 = require("./store.service");
const auth_service_1 = require("./auth.service");
const notify_service_1 = require("./notify.service");
const workflow_service_1 = require("./workflow.service");
const ROUNDS = Math.max(4, Number(process.env.DEMO_BCRYPT_ROUNDS || 10) || 10);
const TENANT_A = store_service_1.PlatformStoreService.GURUKRIPA_TENANT_ID;
const TENANT_B = 'tenant-awadh-002';
function assertDemoAllowed() {
    if (process.env.NODE_ENV === 'production') {
        throw new Error('Demo seed refused: NODE_ENV=production');
    }
    if (process.env.ALLOW_DEMO_SEED !== '1' && process.env.ALLOW_DEMO_SEED !== 'true') {
        throw new Error('Demo seed refused: set ALLOW_DEMO_SEED=1 (dev/staging only)');
    }
}
function genPassword(seed) {
    const raw = crypto.createHash('sha256').update(`gk-demo|${seed}|${crypto.randomBytes(8).toString('hex')}`).digest('base64url');
    return `Qk!${raw.slice(0, 14)}${(raw.charCodeAt(0) % 9) + 1}`;
}
function accountSpecs() {
    const a = TENANT_A;
    const b = TENANT_B;
    return [
        {
            key: 'a-super', fullName: 'Priya Platform Ops', email: 'superadmin@example.com',
            username: 'super.priya', phone: '9000100001', role: 'SUPER_ADMIN', jobTitle: 'Platform Super Admin',
            tenantId: a, tenantLabel: 'Tenant A — Gurukripa Bricks Industry', tenantSlug: 'gurukripa',
            branch: 'Platform HQ', status: 'ACTIVE',
            testPurpose: 'Platform-level admin; must not freely mutate other tenants without explicit platform tools',
        },
        {
            key: 'a-tenant-admin', fullName: 'Anil Tenant Admin', email: 'tenant.admin.a@example.com',
            username: 'anil.tenant', phone: '9000100002', role: 'TENANT_ADMIN', jobTitle: 'Tenant Admin',
            tenantId: a, tenantLabel: 'Tenant A — Gurukripa Bricks Industry', tenantSlug: 'gurukripa',
            branch: 'Kheta Sarai Yard', status: 'ACTIVE',
            testPurpose: 'Full tenant A administration; blocked from tenant B data',
        },
        {
            key: 'a-branch-mgr', fullName: 'Meera Branch Manager', email: 'branch.mgr.a@example.com',
            username: 'meera.branch', phone: '9000100003', role: 'ADMIN', jobTitle: 'Branch Manager',
            tenantId: a, tenantLabel: 'Tenant A — Gurukripa Bricks Industry', tenantSlug: 'gurukripa',
            branch: 'Shahganj Depot', status: 'ACTIVE',
            testPurpose: 'Branch-scoped ops for Shahganj Depot (JWT role ADMIN)',
        },
        {
            key: 'a-sales', fullName: 'Ravi Sales Staff', email: 'sales.ravi@example.com',
            username: 'ravi.sales', phone: '9000100004', role: 'STAFF', jobTitle: 'Sales Staff',
            tenantId: a, tenantLabel: 'Tenant A — Gurukripa Bricks Industry', tenantSlug: 'gurukripa',
            branch: 'Kheta Sarai Yard', status: 'ACTIVE',
            testPurpose: 'Enquiry review and quotation preparation',
        },
        {
            key: 'a-sales-mgr', fullName: 'Sunita Sales Manager', email: 'sales.mgr.a@example.com',
            username: 'sunita.mgr', phone: '9000100005', role: 'SALES_MANAGER', jobTitle: 'Sales Manager',
            tenantId: a, tenantLabel: 'Tenant A — Gurukripa Bricks Industry', tenantSlug: 'gurukripa',
            branch: 'Kheta Sarai Yard', status: 'ACTIVE',
            testPurpose: 'Assign enquiries; manager workflows',
        },
        {
            key: 'a-inventory', fullName: 'Kabir Warehouse', email: 'inventory.a@example.com',
            username: 'kabir.wh', phone: '9000100006', role: 'WAREHOUSE_STAFF', jobTitle: 'Inventory Staff',
            tenantId: a, tenantLabel: 'Tenant A — Gurukripa Bricks Industry', tenantSlug: 'gurukripa',
            branch: 'Kheta Sarai Yard', status: 'ACTIVE',
            testPurpose: 'Inventory role login; /staff should reject until WAREHOUSE in STAFF_ROLES',
        },
        {
            key: 'a-accountant', fullName: 'Neha Accounts', email: 'accounts.a@example.com',
            username: 'neha.acct', phone: '9000100007', role: 'STAFF', jobTitle: 'Accountant',
            tenantId: a, tenantLabel: 'Tenant A — Gurukripa Bricks Industry', tenantSlug: 'gurukripa',
            branch: 'Kheta Sarai Yard', status: 'ACTIVE',
            testPurpose: 'Finance QA persona (JWT STAFF until dedicated ACCOUNTANT role exists)',
        },
        {
            key: 'a-driver', fullName: 'Imran Driver', email: 'driver.a@example.com',
            username: 'imran.drv', phone: '9000100008', role: 'DRIVER', jobTitle: 'Delivery Driver',
            tenantId: a, tenantLabel: 'Tenant A — Gurukripa Bricks Industry', tenantSlug: 'gurukripa',
            branch: 'Shahganj Depot', status: 'ACTIVE',
            testPurpose: 'Driver login + delivery sync; /staff rejected until DRIVER wired',
        },
        {
            key: 'a-dispatcher', fullName: 'Deepak Dispatcher', email: 'dispatch.a@example.com',
            username: 'deepak.disp', phone: '9000100009', role: 'DISPATCHER', jobTitle: 'Dispatcher',
            tenantId: a, tenantLabel: 'Tenant A — Gurukripa Bricks Industry', tenantSlug: 'gurukripa',
            branch: 'Kheta Sarai Yard', status: 'ACTIVE',
            testPurpose: 'Dispatcher persona for future delivery assignment APIs',
        },
        {
            key: 'a-contractor', fullName: 'Vikram Builder Co', email: 'contractor.a@example.com',
            username: 'vikram.builder', phone: '9000100010', role: 'DEALER', jobTitle: 'Contractor / Builder',
            tenantId: a, tenantLabel: 'Tenant A — Gurukripa Bricks Industry', tenantSlug: 'gurukripa',
            branch: 'Customer', status: 'ACTIVE', dealerStatus: 'APPROVED', dealerDiscountPct: 8,
            firmName: 'Vikram Builders TEST', gstin: '09TESTA1234A1Z5',
            testPurpose: 'Approved contractor/dealer pricing and quotation approve/reject',
        },
        {
            key: 'a-customer-1', fullName: 'Asha Homeowner', email: 'customer.asha@example.com',
            username: 'asha.cust', phone: '9000100011', role: 'CUSTOMER', jobTitle: 'Normal Customer',
            tenantId: a, tenantLabel: 'Tenant A — Gurukripa Bricks Industry', tenantSlug: 'gurukripa',
            branch: 'Customer', status: 'ACTIVE',
            testPurpose: 'Owns tenant A orders/estimates only',
        },
        {
            key: 'a-customer-2', fullName: 'Gopal Second Buyer', email: 'customer.gopal@example.com',
            username: 'gopal.cust', phone: '9000100012', role: 'CUSTOMER', jobTitle: 'Normal Customer',
            tenantId: a, tenantLabel: 'Tenant A — Gurukripa Bricks Industry', tenantSlug: 'gurukripa',
            branch: 'Customer', status: 'ACTIVE',
            testPurpose: 'Second customer — must not see Asha orders',
        },
        {
            key: 'a-customer-suspended', fullName: 'Suspended Buyer', email: 'customer.suspended.a@example.com',
            username: 'suspended.a', phone: '9000100013', role: 'CUSTOMER', jobTitle: 'Normal Customer',
            tenantId: a, tenantLabel: 'Tenant A — Gurukripa Bricks Industry', tenantSlug: 'gurukripa',
            branch: 'Customer', status: 'SUSPENDED',
            testPurpose: 'Suspended account must be denied login and protected APIs',
        },
        {
            key: 'a-staff-disabled', fullName: 'Disabled Staff', email: 'staff.disabled.a@example.com',
            username: 'disabled.staff', phone: '9000100014', role: 'STAFF', jobTitle: 'Sales Staff',
            tenantId: a, tenantLabel: 'Tenant A — Gurukripa Bricks Industry', tenantSlug: 'gurukripa',
            branch: 'Kheta Sarai Yard', status: 'DISABLED',
            testPurpose: 'Disabled staff cannot login',
        },
        {
            key: 'b-tenant-admin', fullName: 'Farhan Tenant Admin', email: 'tenant.admin.b@example.com',
            username: 'farhan.tenant', phone: '9000200001', role: 'TENANT_ADMIN', jobTitle: 'Tenant Admin',
            tenantId: b, tenantLabel: 'Tenant B — Awadh / Demo Construction Materials', tenantSlug: 'awadh-bricks',
            branch: 'Varanasi Yard', status: 'ACTIVE',
            testPurpose: 'Full tenant B admin; blocked from tenant A',
        },
        {
            key: 'b-branch-mgr', fullName: 'Leela Branch Manager', email: 'branch.mgr.b@example.com',
            username: 'leela.branch', phone: '9000200002', role: 'ADMIN', jobTitle: 'Branch Manager',
            tenantId: b, tenantLabel: 'Tenant B — Awadh / Demo Construction Materials', tenantSlug: 'awadh-bricks',
            branch: 'Varanasi Yard', status: 'ACTIVE',
            testPurpose: 'Tenant B branch manager reports isolation',
        },
        {
            key: 'b-sales', fullName: 'Omar Sales Staff', email: 'sales.omar@example.com',
            username: 'omar.sales', phone: '9000200003', role: 'STAFF', jobTitle: 'Sales Staff',
            tenantId: b, tenantLabel: 'Tenant B — Awadh / Demo Construction Materials', tenantSlug: 'awadh-bricks',
            branch: 'Varanasi Yard', status: 'ACTIVE',
            testPurpose: 'Cross-tenant staff IDOR attempts against tenant A enquiries',
        },
        {
            key: 'b-inventory', fullName: 'Zara Warehouse', email: 'inventory.b@example.com',
            username: 'zara.wh', phone: '9000200004', role: 'WAREHOUSE_STAFF', jobTitle: 'Inventory Staff',
            tenantId: b, tenantLabel: 'Tenant B — Awadh / Demo Construction Materials', tenantSlug: 'awadh-bricks',
            branch: 'Varanasi Yard', status: 'ACTIVE',
            testPurpose: 'Tenant B inventory persona',
        },
        {
            key: 'b-driver', fullName: 'Suresh Driver', email: 'driver.b@example.com',
            username: 'suresh.drv', phone: '9000200005', role: 'DRIVER', jobTitle: 'Delivery Driver',
            tenantId: b, tenantLabel: 'Tenant B — Awadh / Demo Construction Materials', tenantSlug: 'awadh-bricks',
            branch: 'Varanasi Yard', status: 'ACTIVE',
            testPurpose: 'Tenant B driver',
        },
        {
            key: 'b-contractor', fullName: 'Noida Contractors TEST', email: 'contractor.b@example.com',
            username: 'noida.builder', phone: '9000200006', role: 'DEALER', jobTitle: 'Contractor / Builder',
            tenantId: b, tenantLabel: 'Tenant B — Awadh / Demo Construction Materials', tenantSlug: 'awadh-bricks',
            branch: 'Customer', status: 'ACTIVE', dealerStatus: 'APPROVED', dealerDiscountPct: 5,
            firmName: 'Noida Contractors TEST', gstin: '09TESTB5678B1Z9',
            testPurpose: 'Tenant B contractor isolation',
        },
        {
            key: 'b-customer-1', fullName: 'Kiran Buyer B', email: 'customer.kiran@example.com',
            username: 'kiran.cust', phone: '9000200007', role: 'CUSTOMER', jobTitle: 'Normal Customer',
            tenantId: b, tenantLabel: 'Tenant B — Awadh / Demo Construction Materials', tenantSlug: 'awadh-bricks',
            branch: 'Customer', status: 'ACTIVE',
            testPurpose: 'Tenant B customer — own orders only; no tenant A invoices',
        },
        {
            key: 'b-customer-2', fullName: 'Pooja Buyer B2', email: 'customer.pooja@example.com',
            username: 'pooja.cust', phone: '9000200008', role: 'CUSTOMER', jobTitle: 'Normal Customer',
            tenantId: b, tenantLabel: 'Tenant B — Awadh / Demo Construction Materials', tenantSlug: 'awadh-bricks',
            branch: 'Customer', status: 'ACTIVE',
            testPurpose: 'Second tenant B customer ownership checks',
        },
    ];
}
function createDemoRuntime() {
    const pricing = new pricing_service_1.PricingEngineService();
    const mockDb = new mock_db_service_1.MockDatabaseService(pricing);
    const store = new store_service_1.PlatformStoreService(mockDb);
    const jwt = new jwt_1.JwtService({ secret: process.env.JWT_SECRET || 'demo-seed-local-secret-only', signOptions: { expiresIn: '2h' } });
    const notify = new notify_service_1.NotifyService(store);
    const workflow = new workflow_service_1.WorkflowService(store, notify, pricing);
    const auth = new auth_service_1.AuthService(store, jwt);
    return { pricing, mockDb, store, jwt, notify, workflow, auth };
}
function enrichCatalog(mockDb) {
    const extra = [
        {
            id: 'prod-004', tenantId: TENANT_A, sku: 'GURU-FLYASH-04', name: 'Fly Ash Bricks TEST',
            category: 'fly-ash', unitPrice: 5.5, trolleyCapacity: 4000, trolleyRate: 22000,
            description: 'TEST DATA — fly ash bricks sample.', features: ['TEST DATA'], isActive: true,
        },
        {
            id: 'prod-005', tenantId: TENANT_A, sku: 'GURU-OLD-05', name: 'Discontinued Grade TEST',
            category: 'other', unitPrice: 4.0, trolleyCapacity: 4000, trolleyRate: 16000,
            description: 'TEST DATA — inactive SKU.', features: ['TEST DATA'], isActive: false,
        },
        {
            id: 'prod-102', tenantId: TENANT_B, sku: 'AWADH-PREM-02', name: 'Awadh Premium Kiln TEST',
            category: 'premium', unitPrice: 9.25, trolleyCapacity: 4000, trolleyRate: 37000,
            description: 'TEST DATA — tenant B premium.', features: ['TEST DATA'], isActive: true,
        },
        {
            id: 'prod-103', tenantId: TENANT_B, sku: 'AWADH-OLD-03', name: 'Awadh Retired SKU TEST',
            category: 'standard', unitPrice: 6.0, trolleyCapacity: 4000, trolleyRate: 24000,
            description: 'TEST DATA — inactive tenant B.', features: ['TEST DATA'], isActive: false,
        },
    ];
    const products = mockDb.products;
    for (const p of extra) {
        if (!products.find((x) => x.id === p.id))
            products.push(p);
    }
    return products.length;
}
async function seedWorkflowData(store, workflow, byKey) {
    const staff = byKey.get('a-sales');
    const manager = byKey.get('a-sales-mgr');
    const cust = byKey.get('a-customer-1');
    const cust2 = byKey.get('a-customer-2');
    const contractor = byKey.get('a-contractor');
    const bStaff = byKey.get('b-sales');
    const bCust = byKey.get('b-customer-1');
    const as = (u) => ({
        id: u.id, tenantId: u.tenantId, name: u.name, phone: u.phone, email: u.email, role: u.role,
    });
    await store.addAddress(cust.id, TENANT_A, {
        label: 'Home TEST', line1: '12 Test Colony', city: 'Jaunpur', state: 'UP', pincode: '222001', isDefault: true,
    });
    await store.addAddress(cust.id, TENANT_A, {
        label: 'Site TEST', line1: 'Plot 4 Shahganj Road', city: 'Jaunpur', state: 'UP', pincode: '222139', isDefault: false,
    });
    await store.addAddress(bCust.id, TENANT_B, {
        label: 'Home TEST', line1: '88 Demo Nagar', city: 'Varanasi', state: 'UP', pincode: '221002', isDefault: true,
    });
    await store.addSavedSite(cust.id, TENANT_A, {
        name: 'House Wall Estimate TEST', address: 'Plot wall site TEST', city: 'Jaunpur',
        notes: 'TEST DATA wall estimator', estimateType: 'wall',
        payload: { lengthFt: 40, heightFt: 10, type: 'wall' },
    });
    await store.addSavedSite(cust.id, TENANT_A, {
        name: 'Full Building Estimate TEST', address: 'House plot TEST', city: 'Jaunpur',
        notes: 'TEST DATA house estimator', estimateType: 'house',
        payload: { floors: 2, sqft: 1200, type: 'house' },
    });
    await store.addSavedSite(cust.id, TENANT_A, {
        name: 'Boundary Wall Estimate TEST', address: 'Boundary site TEST', city: 'Jaunpur',
        notes: 'TEST DATA boundary', estimateType: 'boundary',
        payload: { lengthFt: 100, heightFt: 6, type: 'boundary' },
    });
    await store.addSavedSite(bCust.id, TENANT_B, {
        name: 'Tenant B Site Estimate TEST', address: 'Varanasi site TEST', city: 'Varanasi',
        notes: 'TEST DATA', estimateType: 'wall',
        payload: { lengthFt: 20, heightFt: 8, type: 'wall' },
    });
    const enq1 = await store.createEnquiry({
        tenantId: TENANT_A, userId: cust.id, contactName: cust.name, contactPhone: cust.phone,
        siteLocation: 'Jaunpur TEST site', notes: 'TEST DATA enquiry',
        lines: [{ productName: 'Awwal Bricks', quantity: 4000, unit: 'bricks' }], attachments: [],
    });
    await workflow.reviewEnquiry(as(staff), enq1.id);
    await workflow.assignEnquiry(as(manager), enq1.id, staff.id);
    const q1 = await workflow.createQuotation(as(staff), enq1.id, {
        lines: [{ name: 'Awwal Bricks', quantity: 4000, unit: 'bricks', unitPrice: 7.05 }], sendNow: true,
    });
    const orderDelivered = await workflow.respondToQuotation(as(cust), q1.id, true);
    await workflow.changeOrderStatus(as(staff), orderDelivered.id, { status: 'PRODUCTION' });
    await workflow.changeOrderStatus(as(staff), orderDelivered.id, { status: 'DISPATCHED', expectedDelivery: '2026-11-10' });
    await workflow.changeOrderStatus(as(staff), orderDelivered.id, { status: 'DELIVERED' });
    const enq2 = await store.createEnquiry({
        tenantId: TENANT_A, userId: cust.id, contactName: cust.name, contactPhone: cust.phone,
        siteLocation: 'Shahganj TEST', notes: 'TEST DATA confirmed order',
        lines: [{ productName: 'Laal Peti', quantity: 2000, unit: 'bricks' }], attachments: [],
    });
    await workflow.reviewEnquiry(as(staff), enq2.id);
    const q2 = await workflow.createQuotation(as(staff), enq2.id, {
        lines: [{ name: 'Laal Peti', quantity: 2000, unit: 'bricks', unitPrice: 6.25 }], sendNow: true,
    });
    await workflow.respondToQuotation(as(cust), q2.id, true);
    const enq3 = await store.createEnquiry({
        tenantId: TENANT_A, userId: contractor.id, contactName: contractor.name, contactPhone: contractor.phone,
        siteLocation: 'Contractor site TEST', notes: 'TEST DATA dealer order',
        lines: [{ productName: 'Awwal Bricks', quantity: 8000, unit: 'bricks' }], attachments: [],
    });
    await workflow.reviewEnquiry(as(staff), enq3.id);
    const q3 = await workflow.createQuotation(as(staff), enq3.id, {
        lines: [{ name: 'Awwal Bricks', quantity: 8000, unit: 'bricks', unitPrice: 7.05 }], sendNow: true,
    });
    const orderProd = await workflow.respondToQuotation(as(contractor), q3.id, true);
    await workflow.changeOrderStatus(as(staff), orderProd.id, { status: 'PRODUCTION' });
    const enq4 = await store.createEnquiry({
        tenantId: TENANT_A, userId: cust2.id, contactName: cust2.name, contactPhone: cust2.phone,
        siteLocation: 'Cancel site TEST', notes: 'TEST DATA cancel',
        lines: [{ productName: 'Shiv Eent', quantity: 1000, unit: 'bricks' }], attachments: [],
    });
    await workflow.reviewEnquiry(as(staff), enq4.id);
    const q4 = await workflow.createQuotation(as(staff), enq4.id, {
        lines: [{ name: 'Shiv Eent', quantity: 1000, unit: 'bricks', unitPrice: 12 }], sendNow: true,
    });
    const orderCancel = await workflow.respondToQuotation(as(cust2), q4.id, true);
    await workflow.changeOrderStatus(as(cust2), orderCancel.id, { status: 'CANCELLED', note: 'TEST DATA cancel' });
    await store.createEnquiry({
        tenantId: TENANT_A, userId: cust2.id, contactName: cust2.name, contactPhone: cust2.phone,
        siteLocation: 'Pending review TEST', notes: 'TEST DATA pending',
        lines: [{ productName: 'Fly Ash', quantity: 500, unit: 'bricks' }], attachments: [],
    });
    const bEnq = await store.createEnquiry({
        tenantId: TENANT_B, userId: bCust.id, contactName: bCust.name, contactPhone: bCust.phone,
        siteLocation: 'Varanasi TEST', notes: 'TEST DATA tenant B',
        lines: [{ productName: 'Awadh Standard', quantity: 4000, unit: 'bricks' }], attachments: [],
    });
    await workflow.reviewEnquiry(as(bStaff), bEnq.id);
    const bQ = await workflow.createQuotation(as(bStaff), bEnq.id, {
        lines: [{ name: 'Awadh Standard Kiln Bricks', quantity: 4000, unit: 'bricks', unitPrice: 7.5 }], sendNow: true,
    });
    const bOrder = await workflow.respondToQuotation(as(bCust), bQ.id, true);
    await workflow.changeOrderStatus(as(bStaff), bOrder.id, { status: 'PRODUCTION' });
    await workflow.changeOrderStatus(as(bStaff), bOrder.id, { status: 'DISPATCHED' });
    await store.saveAnnouncement({
        id: store.newId('ann'), tenantId: TENANT_A, title: 'TEST DATA monsoon dispatch notice',
        body: 'TEST DATA only — yard hours update.', audience: 'ALL', isActive: true,
        createdById: byKey.get('a-tenant-admin').id, createdAt: store.now(),
    });
    await store.saveAnnouncement({
        id: store.newId('ann'), tenantId: TENANT_B, title: 'TEST DATA tenant B promo',
        body: 'TEST DATA — Awadh kiln schedule.', audience: 'CUSTOMER', isActive: true,
        createdById: byKey.get('b-tenant-admin').id, createdAt: store.now(),
    });
    return {
        orders: store.orders.length,
        enquiries: store.enquiries.length,
        quotations: store.quotations.length,
        projects: store.savedSites.length,
        invoices: store.orders.filter((o) => o.status === 'DELIVERED' || o.status === 'DISPATCHED').length,
    };
}
function buildSidecarDataset(store, mockDb) {
    return {
        mark: 'TEST DATA — not for production',
        generatedAt: new Date().toISOString(),
        tenants: [
            { id: TENANT_A, slug: 'gurukripa', name: 'Gurukripa Bricks Industry', branches: ['Kheta Sarai Yard', 'Shahganj Depot'] },
            { id: TENANT_B, slug: 'awadh-bricks', name: 'Awadh Brick Kiln & Suppliers (Demo Construction Materials)', branches: ['Varanasi Yard'] },
        ],
        products: mockDb.products.map((p) => ({ ...p, mark: p.mark || 'TEST DATA catalog' })),
        inventory: [
            { id: 'inv-a-1', tenantId: TENANT_A, warehouse: 'Kheta Sarai Yard', sku: 'GURU-AWWAL-01', onHand: 120000, reserved: 8000, lowStock: false, mark: 'TEST DATA' },
            { id: 'inv-a-2', tenantId: TENANT_A, warehouse: 'Shahganj Depot', sku: 'GURU-LAAL-02', onHand: 900, reserved: 0, lowStock: true, mark: 'TEST DATA' },
            { id: 'inv-a-3', tenantId: TENANT_A, warehouse: 'Kheta Sarai Yard', sku: 'GURU-SHIV-03', onHand: 0, damaged: 200, mark: 'TEST DATA damaged' },
            { id: 'inv-b-1', tenantId: TENANT_B, warehouse: 'Varanasi Yard', sku: 'AWADH-STD-01', onHand: 50000, reserved: 4000, lowStock: false, mark: 'TEST DATA' },
        ],
        stockMoves: [
            { id: 'sm-1', tenantId: TENANT_A, type: 'STOCK_IN', sku: 'GURU-AWWAL-01', qty: 40000, note: 'TEST DATA kiln batch' },
            { id: 'sm-2', tenantId: TENANT_A, type: 'STOCK_OUT', sku: 'GURU-AWWAL-01', qty: 4000, note: 'TEST DATA order pick' },
            { id: 'sm-3', tenantId: TENANT_A, type: 'TRANSFER', from: 'Kheta Sarai Yard', to: 'Shahganj Depot', sku: 'GURU-LAAL-02', qty: 2000, note: 'TEST DATA' },
            { id: 'sm-4', tenantId: TENANT_B, type: 'STOCK_IN', sku: 'AWADH-STD-01', qty: 20000, note: 'TEST DATA' },
        ],
        suppliers: [
            { id: 'sup-a-1', tenantId: TENANT_A, name: 'Clay Supply TEST Pvt', gstin: '09TESTSUP01A1Z1', mark: 'TEST DATA' },
            { id: 'sup-b-1', tenantId: TENANT_B, name: 'Varanasi Fuel TEST', gstin: '09TESTSUP02B1Z2', mark: 'TEST DATA' },
        ],
        purchaseOrders: [
            { id: 'po-a-1', tenantId: TENANT_A, supplierId: 'sup-a-1', status: 'OPEN', total: 150000, mark: 'TEST DATA' },
            { id: 'po-b-1', tenantId: TENANT_B, supplierId: 'sup-b-1', status: 'RECEIVED', total: 80000, mark: 'TEST DATA' },
        ],
        finance: {
            payments: [
                { id: 'pay-a-1', tenantId: TENANT_A, orderRef: 'demo-delivered', method: 'COD', amount: 28200, status: 'COLLECTED', mark: 'TEST DATA' },
                { id: 'pay-a-2', tenantId: TENANT_A, method: 'UPI_SIMULATED', amount: 5000, status: 'FAILED', mark: 'TEST DATA failed payment — no real gateway' },
                { id: 'pay-b-1', tenantId: TENANT_B, method: 'COD', amount: 30000, status: 'OUTSTANDING', mark: 'TEST DATA' },
            ],
            expenses: [
                { id: 'exp-a-1', tenantId: TENANT_A, site: 'House Wall Estimate TEST', category: 'labour', amount: 12000, mark: 'TEST DATA' },
                { id: 'exp-a-2', tenantId: TENANT_A, site: 'House Wall Estimate TEST', category: 'transport', amount: 3500, mark: 'TEST DATA' },
            ],
            refunds: [
                { id: 'ref-a-1', tenantId: TENANT_A, amount: 1000, reason: 'TEST DATA short delivery adjustment', status: 'RECORDED' },
            ],
            gstExamples: [
                { tenantId: TENANT_A, inclusive: 28200, cgst: 672, sgst: 672, taxable: 26856, mark: 'TEST DATA 5% inclusive split' },
            ],
        },
        boq: [
            { id: 'boq-a-1', tenantId: TENANT_A, project: 'House Wall Estimate TEST', lines: [{ item: 'Awwal', qty: 12000, unit: 'bricks' }], mark: 'TEST DATA indicative BOQ' },
        ],
        platformCounts: {
            users: store.users.filter((u) => u.isTestAccount).length,
            orders: store.orders.length,
            enquiries: store.enquiries.length,
            quotations: store.quotations.length,
            addresses: store.addresses.length,
            savedSites: store.savedSites.length,
            announcements: store.announcements.length,
        },
    };
}
function writeCredentialsMarkdown(accounts, outPath) {
    const lines = [];
    lines.push('# CONFIDENTIAL — TEST ACCOUNTS ONLY');
    lines.push('');
    lines.push('> **Do not commit. Do not use in production. Do not share publicly.**');
    lines.push('> Generated by `npm run seed:demo` with `ALLOW_DEMO_SEED=1`.');
    lines.push('> Platform login uses **10-digit phone + password** (+ optional `tenantSlug`). Username mirrors phone for tooling that expects a username field.');
    lines.push('> Passwords exist only in this file; the database stores **bcrypt hashes** only.');
    lines.push('');
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push('');
    lines.push('## Guest / Public Visitor');
    lines.push('');
    lines.push('| Field | Value |');
    lines.push('|---|---|');
    lines.push('| Account | None — no password |');
    lines.push('| How to test | Open the storefront without Authorization header |');
    lines.push('| Allowed | Public catalogue, guest enquiry, calculator estimate, tenant branding by slug |');
    lines.push('| Denied | `/api/v1/me/*`, `/api/v1/staff/*`, legacy `/orders` and `/sync/push` |');
    lines.push('');
    lines.push('## Login-enabled accounts');
    lines.push('');
    lines.push('| User ID | Full Name | Email | Username | Phone (login) | Password | Role (JWT) | Job title | Tenant | Branch | Status | Login verified | Test Purpose |');
    lines.push('|---|---|---|---|---|---|---|---|---|---|---|---|---|');
    for (const a of accounts) {
        lines.push(`| ${a.userId} | ${a.fullName} | ${a.email} | ${a.username} | ${a.phone} | \`${a.password}\` | ${a.role} | ${a.jobTitle} | ${a.tenantLabel} | ${a.branch} | ${a.status} | ${a.loginOk ? 'YES' : 'NO'} | ${a.testPurpose} |`);
    }
    lines.push('');
    lines.push('## Regeneration');
    lines.push('');
    lines.push('```bash');
    lines.push('cd backend');
    lines.push('set ALLOW_DEMO_SEED=1   # PowerShell: $env:ALLOW_DEMO_SEED=\"1\"');
    lines.push('npm run seed:demo:reset');
    lines.push('```');
    lines.push('');
    lines.push('Reset clears prior `isTestAccount` users from the in-memory seed process and rebuilds this file.');
    lines.push('Never run with `NODE_ENV=production`.');
    lines.push('');
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, lines.join('\n'), 'utf8');
}
async function verifyPermissions(workflow, store, byKey) {
    const failures = [];
    let pass = 0;
    let fail = 0;
    const as = (u) => ({
        id: u.id, tenantId: u.tenantId, name: u.name, phone: u.phone, email: u.email, role: u.role,
    });
    const aStaff = byKey.get('a-sales');
    const bEnq = store.enquiries.find((e) => e.tenantId === TENANT_B);
    if (bEnq) {
        try {
            await workflow.reviewEnquiry(as(aStaff), bEnq.id);
            fail++;
            failures.push('Tenant A staff reviewed Tenant B enquiry (should deny)');
        }
        catch {
            pass++;
        }
    }
    const bOrder = store.orders.find((o) => o.tenantId === TENANT_B);
    const aCust = byKey.get('a-customer-1');
    if (bOrder) {
        try {
            await workflow.changeOrderStatus(as(aCust), bOrder.id, { status: 'CANCELLED' });
            fail++;
            failures.push('Tenant A customer cancelled Tenant B order (should deny)');
        }
        catch {
            pass++;
        }
    }
    const aOrder = store.orders.find((o) => o.tenantId === TENANT_A && o.userId === aCust.id);
    const aCust2 = byKey.get('a-customer-2');
    if (aOrder) {
        try {
            await workflow.changeOrderStatus(as(aCust2), aOrder.id, { status: 'CANCELLED' });
            fail++;
            failures.push('Customer-2 cancelled Customer-1 order (should deny)');
        }
        catch {
            pass++;
        }
    }
    const inv = byKey.get('a-inventory');
    const aEnq = store.enquiries.find((e) => e.tenantId === TENANT_A && e.status === 'NEW');
    if (aEnq) {
        try {
            await workflow.reviewEnquiry(as(inv), aEnq.id);
            fail++;
            failures.push('WAREHOUSE_STAFF reviewed enquiry (should deny until role wired)');
        }
        catch {
            pass++;
        }
    }
    return { pass, fail, failures };
}
async function verifyCrossTenant(auth, workflow, store, byKey) {
    const failures = [];
    let pass = 0;
    let fail = 0;
    const as = (u) => ({
        id: u.id, tenantId: u.tenantId, name: u.name, phone: u.phone, email: u.email, role: u.role,
    });
    try {
        await auth.login({ phone: '9000100011', password: 'x', tenantSlug: 'awadh-bricks' });
        fail++;
        failures.push('Tenant A phone accepted under Tenant B slug with wrong password path');
    }
    catch {
        pass++;
    }
    const bAdmin = byKey.get('b-tenant-admin');
    const aOrder = store.orders.find((o) => o.tenantId === TENANT_A);
    if (aOrder) {
        try {
            await workflow.changeOrderStatus(as(bAdmin), aOrder.id, { status: 'PRODUCTION' });
            fail++;
            failures.push('Tenant B admin changed Tenant A order');
        }
        catch {
            pass++;
        }
    }
    const aQ = store.quotations.find((q) => q.tenantId === TENANT_A);
    const bCust = byKey.get('b-customer-1');
    if (aQ) {
        try {
            await workflow.respondToQuotation(as(bCust), aQ.id, true);
            fail++;
            failures.push('Tenant B customer approved Tenant A quotation');
        }
        catch {
            pass++;
        }
    }
    const aNotes = store.notificationsOf(byKey.get('a-customer-1').id);
    const leak = aNotes.some((n) => n.tenantId === TENANT_B);
    if (leak) {
        fail++;
        failures.push('Tenant A inbox contains Tenant B notifications');
    }
    else
        pass++;
    return { pass, fail, failures };
}
function resolveRepoRoot(explicit) {
    if (explicit)
        return explicit;
    let dir = process.cwd();
    for (let i = 0; i < 6; i++) {
        if (fs.existsSync(path.join(dir, 'capacitor.config.json')) || fs.existsSync(path.join(dir, '.gitignore'))) {
            return dir;
        }
        const parent = path.dirname(dir);
        if (parent === dir)
            break;
        dir = parent;
    }
    return path.resolve(process.cwd(), '..');
}
async function runDemoSeed(options) {
    assertDemoAllowed();
    const rt = createDemoRuntime();
    const { store, auth, workflow, mockDb } = rt;
    if (options?.reset) {
        store.users = store.users.filter((u) => !u.isTestAccount);
    }
    const productCount = enrichCatalog(mockDb);
    const specs = accountSpecs();
    const seeded = [];
    const byKey = new Map();
    for (const spec of specs) {
        const password = genPassword(spec.key);
        const passwordHash = await bcrypt.hash(password, ROUNDS);
        const user = await store.createUser({
            tenantId: spec.tenantId,
            role: spec.role,
            name: spec.fullName,
            phone: spec.phone,
            email: spec.email,
            username: spec.username,
            jobTitle: spec.jobTitle,
            branchName: spec.branch,
            accountStatus: spec.status,
            isTestAccount: true,
            passwordHash,
            language: 'en',
            dealerStatus: spec.dealerStatus,
            dealerDiscountPct: spec.dealerDiscountPct,
            firmName: spec.firmName,
            gstin: spec.gstin,
            dealerAddress: spec.role === 'DEALER' ? 'TEST DATA address' : undefined,
            dealerCity: spec.role === 'DEALER' ? (spec.tenantId === TENANT_A ? 'Jaunpur' : 'Varanasi') : undefined,
        });
        byKey.set(spec.key, user);
        let loginOk = false;
        let loginError;
        try {
            const session = await auth.login({ phone: spec.phone, password, tenantSlug: spec.tenantSlug });
            loginOk = session.user.id === user.id && session.user.tenantId === spec.tenantId;
            if (!loginOk)
                loginError = 'Session user mismatch';
        }
        catch (e) {
            if (spec.status !== 'ACTIVE') {
                loginOk = true;
                loginError = `expected deny: ${e?.message || e}`;
            }
            else {
                loginOk = false;
                loginError = e?.message || String(e);
            }
        }
        seeded.push({ ...spec, userId: user.id, password, loginOk, loginError });
    }
    const wf = await seedWorkflowData(store, workflow, byKey);
    const perm = await verifyPermissions(workflow, store, byKey);
    const xTenant = await verifyCrossTenant(auth, workflow, store, byKey);
    const repoRoot = resolveRepoRoot(options?.repoRoot);
    const credentialsPath = path.join(repoRoot, 'TEST_ACCOUNTS.local.md');
    const demoDir = path.join(repoRoot, '.demo');
    const datasetPath = path.join(demoDir, 'demo-dataset.local.json');
    fs.mkdirSync(demoDir, { recursive: true });
    writeCredentialsMarkdown(seeded, credentialsPath);
    fs.writeFileSync(datasetPath, JSON.stringify(buildSidecarDataset(store, mockDb), null, 2), 'utf8');
    const byRole = {};
    for (const a of seeded)
        byRole[a.jobTitle] = (byRole[a.jobTitle] || 0) + 1;
    const loginPass = seeded.filter((a) => a.loginOk).length;
    const loginFail = seeded.length - loginPass;
    const failures = [
        ...seeded.filter((a) => !a.loginOk).map((a) => `login ${a.key}: ${a.loginError}`),
        ...perm.failures,
        ...xTenant.failures,
    ];
    return {
        accounts: seeded,
        credentialsPath,
        datasetPath,
        summary: {
            tenants: 2,
            accounts: seeded.length,
            byRole,
            products: productCount,
            customers: seeded.filter((a) => a.role === 'CUSTOMER' || a.role === 'DEALER').length,
            orders: wf.orders,
            projects: wf.projects,
            invoices: wf.invoices,
            enquiries: wf.enquiries,
            quotations: wf.quotations,
            loginPass,
            loginFail,
            permissionPass: perm.pass,
            permissionFail: perm.fail,
            crossTenantPass: xTenant.pass,
            crossTenantFail: xTenant.fail,
            failures,
        },
    };
}
//# sourceMappingURL=demo-seed.js.map
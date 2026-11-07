// Platform layer tests: authentication, server-side RBAC, ownership
// isolation, the enquiry -> quotation -> order workflow, notifications and
// exports. Services are exercised directly (same style as backend.test.ts).
import { test, describe } from 'node:test';
import * as assert from 'node:assert/strict';
import { JwtService } from '@nestjs/jwt';
import { ExecutionContext, ForbiddenException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PricingEngineService } from '../src/pricing/pricing.service';
import { MockDatabaseService } from '../src/database/mock-db.service';
import { PlatformStoreService } from '../src/platform/store.service';
import { AuthService } from '../src/platform/auth.service';
import { NotifyService } from '../src/platform/notify.service';
import { WorkflowService } from '../src/platform/workflow.service';
import { StaffController } from '../src/platform/staff.controller';
import { JwtAuthGuard, RolesGuard, RateLimitGuard, RequireRoles, RateLimit, JWT_ROLES_KEY, RATE_LIMIT_KEY } from '../src/platform/guards';
import { AuthenticatedUser } from '../src/types/domain';

const TENANT = PlatformStoreService.GURUKRIPA_TENANT_ID;

function makeCtx() {
  const pricing = new PricingEngineService();
  const mockDb = new MockDatabaseService(pricing);
  const store = new PlatformStoreService(mockDb);
  const jwt = new JwtService({ secret: 'unit-test-secret', signOptions: { expiresIn: '1h' } });
  const notify = new NotifyService(store);
  const workflow = new WorkflowService(store, notify, pricing);
  const auth = new AuthService(store, jwt);
  const staff = new StaffController(store, workflow, notify, auth);
  return { store, jwt, notify, workflow, auth, staff, pricing };
}

const asUser = (u: any): AuthenticatedUser => ({
  id: u.id, tenantId: TENANT, name: u.name, phone: u.phone || '9999999999', role: u.role,
} as any);

describe('Authentication', () => {
  test('register issues a verifiable JWT with role + tenant claims', async () => {
    const { auth, jwt } = makeCtx();
    const { user, token } = await auth.register({ name: 'Ramesh Singh', phone: '9415011111', password: 'Brick#2026', language: 'hi' } as any);
    const payload = await jwt.verifyAsync(token);
    assert.equal(payload.role, 'CUSTOMER');
    assert.equal(payload.tenantId, TENANT);
    assert.equal(user.phone, '9415011111');
  });

  test('duplicate phone registration is rejected', async () => {
    const { auth } = makeCtx();
    await auth.register({ name: 'A', phone: '9000000001', password: 'password123' } as any);
    await assert.rejects(() => auth.register({ name: 'B', phone: '9000000001', password: 'password123' } as any));
  });

  test('login with wrong password fails; correct password succeeds', async () => {
    const { auth } = makeCtx();
    await auth.register({ name: 'C', phone: '9000000002', password: 'password123' } as any);
    await assert.rejects(() => auth.login({ phone: '9000000002', password: 'wrongpass1' } as any), UnauthorizedException);
    const res = await auth.login({ phone: '9000000002', password: 'password123' } as any);
    assert.ok(res.token);
  });

  test('passwords are stored as bcrypt hashes, never plaintext', async () => {
    const { auth, store } = makeCtx();
    await auth.register({ name: 'D', phone: '9000000003', password: 'password123' } as any);
    const u = store.findUserByPhone(TENANT, '9000000003')!;
    assert.ok(u.passwordHash.startsWith('$2b$'));
    assert.notEqual(u.passwordHash, 'password123');
  });

  test('dealer registers as PENDING and is locked out of dealer endpoints until approved', async () => {
    const { auth, store } = makeCtx();
    const { user } = await auth.registerDealer({ name: 'E', phone: '9000000004', password: 'password123', firmName: 'Singh Traders', dealerAddress: 'Lalpur, Jaunpur', dealerCity: 'Jaunpur' } as any);
    assert.equal(store.findUserById(user.id)!.dealerStatus, 'PENDING');
    assert.throws(() => auth.assertDealerApproved(asUser(user)), ForbiddenException);
    await store.updateUser(user.id, { dealerStatus: 'APPROVED', dealerDiscountPct: 8 });
    assert.equal(auth.assertDealerApproved(asUser(user)).dealerDiscountPct, 8);
  });
});

describe('Server-side guards (RBAC + rate limiting)', () => {
  const ctxFor = (req: any, handler: any): ExecutionContext =>
    ({ switchToHttp: () => ({ getRequest: () => req }), getHandler: () => handler, getClass: () => class {} } as any);

  test('RolesGuard rejects a customer hitting a staff-only route', () => {
    const reflector = new Reflector();
    const guard = new RolesGuard(reflector);
    const handler = function staffOnly() {} as any;
    RequireRoles('STAFF', 'SALES_MANAGER', 'ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')(handler);
    const req = { user: { id: 'u1', tenantId: TENANT, name: 'x', phone: '9', role: 'CUSTOMER' } };
    assert.throws(() => guard.canActivate(ctxFor(req, handler)), ForbiddenException);
  });

  test('RolesGuard allows SUPER_ADMIN on TENANT_ADMIN (Administrator) routes', () => {
    const guard = new RolesGuard(new Reflector());
    const handler = function adminOnly() {} as any;
    RequireRoles('ADMIN', 'TENANT_ADMIN')(handler);
    const req = { user: { id: 'u1', tenantId: TENANT, name: 'x', phone: '9', role: 'SUPER_ADMIN' } };
    assert.equal(guard.canActivate(ctxFor(req, handler)), true);
  });

  test('JwtAuthGuard rejects missing and forged tokens', async () => {
    const guard = new JwtAuthGuard(new JwtService({ secret: 'unit-test-secret' }));
    await assert.rejects(() => guard.canActivate(ctxFor({ headers: {} }, () => {})), UnauthorizedException);
    const forged = new JwtService({ secret: 'attacker-secret' }).sign({ id: 'x', tenantId: TENANT, role: 'ADMIN' });
    await assert.rejects(() => guard.canActivate(ctxFor({ headers: { authorization: `Bearer ${forged}` } }, () => {})), UnauthorizedException);
  });

  test('RateLimitGuard blocks the 4th request in a 3/60s window', () => {
    const guard = new RateLimitGuard(new Reflector());
    const handler = function login() {} as any;
    RateLimit(3, 60_000)(handler);
    const ctx = ctxFor({ ip: '1.2.3.4' }, handler);
    for (let i = 0; i < 3; i++) assert.equal(guard.canActivate(ctx), true);
    assert.throws(() => guard.canActivate(ctx), ForbiddenException);
  });
});

describe('Business workflow (D)', () => {
  async function setup() {
    const c = makeCtx();
    const customer = await c.auth.register({ name: 'Shyam Const.', phone: '9415022222', password: 'password123' } as any);
    const staffUser = await c.store.createUser({ tenantId: TENANT, role: 'STAFF', name: 'Yogesh (yard)', phone: '9415033333', passwordHash: 'x' });
    const manager = asUser({ id: (await c.store.createUser({ tenantId: TENANT, role: 'SALES_MANAGER', name: 'Manager', phone: '9415044444', passwordHash: 'x' })).id, name: 'Manager', role: 'SALES_MANAGER' });
    const enq = await c.store.createEnquiry({
      tenantId: TENANT, userId: customer.user.id, contactName: 'Shyam', contactPhone: '9415022222',
      siteLocation: 'Kheta Sarai, Jaunpur', notes: '2 trolleys awwal',
      lines: [{ productName: 'Awwal Bricks', quantity: 8000, unit: 'bricks' }], attachments: [],
    });
    return { ...c, customer, staffUser, manager, enq };
  }

  test('happy path: enquiry -> review -> quotation -> approval -> order -> production -> dispatch -> delivery', async () => {
    const s = await setup();
    const staff = asUser(s.staffUser);

    await s.workflow.reviewEnquiry(staff, s.enq.id);
    assert.equal(s.store.findEnquiry(s.enq.id)!.status, 'UNDER_REVIEW');

    const q = await s.workflow.createQuotation(staff, s.enq.id, {
      lines: [{ name: 'Awwal Bricks', quantity: 8000, unit: 'bricks', unitPrice: 7.05 }],
      validDays: 7, sendNow: true,
    } as any);
    assert.equal(q.status, 'SENT');
    assert.equal(s.store.findEnquiry(s.enq.id)!.status, 'QUOTATION_PREPARED');
    // GST decomposition server-side: inclusive total 56,400 -> taxable 53,714 + 1,343 + 1,343
    assert.equal(q.lines[0].lineTotal, 56400);
    assert.equal(q.taxableValue + q.cgst + q.sgst, q.total);

    const order = await s.workflow.respondToQuotation(asUser(s.customer.user), q.id, true);
    assert.equal(order!.status, 'CONFIRMED');
    assert.equal(order!.total, q.total);

    await s.workflow.changeOrderStatus(staff, order!.id, { status: 'PRODUCTION' });
    await s.workflow.changeOrderStatus(staff, order!.id, { status: 'DISPATCHED', expectedDelivery: '2026-11-05' });
    assert.equal(s.store.findOrder(order!.id)!.expectedDelivery, '2026-11-05');
    await s.workflow.changeOrderStatus(staff, order!.id, { status: 'DELIVERED' });
    assert.equal(s.store.findOrder(order!.id)!.status, 'DELIVERED');

    // Full timeline recorded for the customer tracking screen.
    const timeline = s.store.timeline('ORDER', order!.id);
    assert.ok(timeline.length >= 4);
    assert.equal(timeline[timeline.length - 1].toStatus, 'DELIVERED');
  });

  test('illegal transitions are rejected (CONFIRMED -> DELIVERED, DELIVERED -> *)', async () => {
    const s = await setup();
    const staff = asUser(s.staffUser);
    await s.workflow.reviewEnquiry(staff, s.enq.id);
    const q = await s.workflow.createQuotation(staff, s.enq.id, { lines: [{ name: 'Laal Peti', quantity: 4000, unit: 'bricks', unitPrice: 6.25 }], sendNow: true } as any);
    const order = await s.workflow.respondToQuotation(asUser(s.customer.user), q.id, true);
    await assert.rejects(() => s.workflow.changeOrderStatus(staff, order!.id, { status: 'DELIVERED' } as any), BadRequestException);
    await s.workflow.changeOrderStatus(staff, order!.id, { status: 'PRODUCTION' });
    await s.workflow.changeOrderStatus(staff, order!.id, { status: 'DISPATCHED' });
    await s.workflow.changeOrderStatus(staff, order!.id, { status: 'DELIVERED' });
    await assert.rejects(() => s.workflow.changeOrderStatus(staff, order!.id, { status: 'CANCELLED' } as any), BadRequestException);
  });

  test('customer cannot act as staff; staff cannot approve a quotation', async () => {
    const s = await setup();
    const customer = asUser(s.customer.user);
    await assert.rejects(() => s.workflow.reviewEnquiry(customer, s.enq.id), ForbiddenException);
    const staff = asUser(s.staffUser);
    await s.workflow.reviewEnquiry(staff, s.enq.id);
    const q = await s.workflow.createQuotation(staff, s.enq.id, { lines: [{ name: 'Awwal', quantity: 4000, unit: 'bricks', unitPrice: 7.05 }], sendNow: true } as any);
    await assert.rejects(() => s.workflow.respondToQuotation(staff, q.id, true), ForbiddenException);
  });

  test('ownership isolation: another customer cannot approve or view a quotation/order', async () => {
    const s = await setup();
    const intruder = await s.auth.register({ name: 'Other Buyer', phone: '9415055555', password: 'password123' } as any);
    const staff = asUser(s.staffUser);
    await s.workflow.reviewEnquiry(staff, s.enq.id);
    const q = await s.workflow.createQuotation(staff, s.enq.id, { lines: [{ name: 'Awwal', quantity: 4000, unit: 'bricks', unitPrice: 7.05 }], sendNow: true } as any);
    await assert.rejects(() => s.workflow.respondToQuotation(asUser(intruder.user), q.id, true), ForbiddenException);
    // Staff assignment requires manager rights
    await assert.rejects(() => s.workflow.assignEnquiry(staff, s.enq.id, staff.id), ForbiddenException);
    await s.workflow.assignEnquiry(s.manager, s.enq.id, staff.id);
    assert.equal(s.store.findEnquiry(s.enq.id)!.assignedStaffId, staff.id);
  });

  test('customer may cancel only before production; cancellation is recorded', async () => {
    const s = await setup();
    const staff = asUser(s.staffUser);
    const customer = asUser(s.customer.user);
    await s.workflow.reviewEnquiry(staff, s.enq.id);
    const q = await s.workflow.createQuotation(staff, s.enq.id, { lines: [{ name: 'Awwal', quantity: 4000, unit: 'bricks', unitPrice: 7.05 }], sendNow: true } as any);
    const order = await s.workflow.respondToQuotation(customer, q.id, true);
    await s.workflow.changeOrderStatus(customer, order!.id, { status: 'CANCELLED', note: 'Changed plans' } as any);
    assert.equal(s.store.findOrder(order!.id)!.status, 'CANCELLED');
  });

  test('approved dealer discount is applied to quotations automatically', async () => {
    const s = await setup();
    const dealerAcc = await s.auth.registerDealer({ name: 'F', phone: '9415066666', password: 'password123', firmName: 'City Bricks', dealerAddress: 'Civil Lines, Jaunpur', dealerCity: 'Jaunpur' } as any);
    await s.store.updateUser(dealerAcc.user.id, { dealerStatus: 'APPROVED', dealerDiscountPct: 10 });
    // Link an enquiry to the dealer account
    const dEnq = await s.store.createEnquiry({
      tenantId: TENANT, userId: dealerAcc.user.id, contactName: 'F', contactPhone: '9415066666',
      siteLocation: 'Jaunpur', lines: [{ productName: 'Laal Peti', quantity: 4000, unit: 'bricks' }], attachments: [],
    });
    const staff = asUser(s.staffUser);
    await s.workflow.reviewEnquiry(staff, dEnq.id);
    const q = await s.workflow.createQuotation(staff, dEnq.id, { lines: [{ name: 'Laal Peti', quantity: 4000, unit: 'bricks', unitPrice: 6.25 }] } as any);
    assert.equal(q.discountAmount, 2500); // 10% of 25,000
  });
});

describe('Notifications (E) and audit trail', () => {
  test('workflow events land in the customer inbox with the right types', async () => {
    const s = makeCtx();
    const customer = await s.auth.register({ name: 'G', phone: '9415077777', password: 'password123' } as any);
    const staffAcc = await s.store.createUser({ tenantId: TENANT, role: 'STAFF', name: 'S', phone: '9415088888', passwordHash: 'x' });
    const staff = asUser(staffAcc);
    const enq = await s.store.createEnquiry({
      tenantId: TENANT, userId: customer.user.id, contactName: 'G', contactPhone: '9415077777',
      siteLocation: 'Jaunpur', lines: [{ productName: 'Awwal', quantity: 4000, unit: 'bricks' }], attachments: [],
    });
    await s.workflow.reviewEnquiry(staff, enq.id);
    const q = await s.workflow.createQuotation(staff, enq.id, { lines: [{ name: 'Awwal', quantity: 4000, unit: 'bricks', unitPrice: 7.05 }], sendNow: true } as any);
    const order = await s.workflow.respondToQuotation(asUser(customer.user), q.id, true);
    await s.workflow.changeOrderStatus(staff, order!.id, { status: 'PRODUCTION' });
    await s.workflow.changeOrderStatus(staff, order!.id, { status: 'DISPATCHED' });
    await s.workflow.changeOrderStatus(staff, order!.id, { status: 'DELIVERED' });

    const types = s.store.notificationsOf(customer.user.id).map((n) => n.type);
    for (const expected of ['QUOTATION_READY', 'ORDER_CONFIRMED', 'ORDER_STATUS_CHANGED', 'DISPATCH_COMPLETED', 'DELIVERY_COMPLETED']) {
      assert.ok((types as string[]).includes(expected), `missing notification ${expected}`);
    }
    assert.equal(s.store.notificationsOf('other-user').length, 0); // isolation
  });

  test('device preferences suppress opted-out categories', async () => {
    const s = makeCtx();
    const user = await s.auth.register({ name: 'H', phone: '9415099999', password: 'password123' } as any);
    await s.store.registerDevice(user.user.id, { token: 'tok-1234567890abcdefghij', platform: 'android', preferences: { orderUpdates: false } });
    const dev = s.store.tokensOf(user.user.id)[0];
    assert.equal(dev.preferences.orderUpdates, false);
    assert.equal(dev.preferences.quotations, true);
    // Inbox still records (audit-safe), transport filtering happens per device.
    const n = await s.notify.notifyUser(user.user.id, TENANT, 'ORDER_CONFIRMED' as any, 't', 'b');
    assert.equal(s.store.notificationsOf(user.user.id)[0].id, n.id);
  });

  test('audit log records staff actions and CSV export', async () => {
    const s = makeCtx();
    const staffAcc = await s.store.createUser({ tenantId: TENANT, role: 'SALES_MANAGER', name: 'M', phone: '9415012345', passwordHash: 'x' });
    const staff = asUser(staffAcc);
    const res: any = { headers: {} as any, body: '' };
    res.setHeader = (k: string, v: string) => { res.headers[k] = v; };
    res.send = (b: string) => { res.body = b; };
    await s.staff.exportCsv(staff, 'orders', res);
    assert.match(res.headers['content-type'], /text\/csv/);
    assert.ok(res.body.split('\n')[0].includes('number'));
    const audit = s.store.listAudit(TENANT);
    assert.equal(audit[0].action, 'CSV_EXPORT');
  });
});

describe('Cross-tenant isolation', () => {
  const OTHER = 'tenant-awadh-002';

  test('staff from tenant A cannot review or quote an enquiry owned by tenant B', async () => {
    const s = makeCtx();
    const gurukripaStaff = await s.store.createUser({
      tenantId: TENANT, role: 'STAFF', name: 'GK Staff', phone: '9415111111', passwordHash: 'x',
    });
    const awadhCustomer = await s.store.createUser({
      tenantId: OTHER, role: 'CUSTOMER', name: 'Awadh Buyer', phone: '9415222222', passwordHash: 'x',
    });
    const foreignEnq = await s.store.createEnquiry({
      tenantId: OTHER, userId: awadhCustomer.id, contactName: 'Awadh Buyer', contactPhone: '9415222222',
      siteLocation: 'Varanasi', lines: [{ productName: 'Awwal', quantity: 1000, unit: 'bricks' }], attachments: [],
    });
    const actor = asUser(gurukripaStaff);
    await assert.rejects(() => s.workflow.reviewEnquiry(actor, foreignEnq.id), ForbiddenException);
    await s.store.updateEnquiry(foreignEnq.id, { status: 'UNDER_REVIEW' });
    await assert.rejects(
      () => s.workflow.createQuotation(actor, foreignEnq.id, { lines: [{ name: 'Awwal', quantity: 1000, unit: 'bricks', unitPrice: 7 }] } as any),
      ForbiddenException,
    );
  });

  test('dealers list and announcement patch are scoped to the caller tenant', async () => {
    const s = makeCtx();
    await s.store.createUser({
      tenantId: OTHER, role: 'DEALER', name: 'Foreign Dealer', phone: '9415333333', passwordHash: 'x',
      dealerStatus: 'PENDING', firmName: 'Awadh Firm',
    } as any);
    await s.store.createUser({
      tenantId: TENANT, role: 'DEALER', name: 'Local Dealer', phone: '9415444444', passwordHash: 'x',
      dealerStatus: 'PENDING', firmName: 'GK Firm',
    } as any);
    const admin = asUser(await s.store.createUser({
      tenantId: TENANT, role: 'ADMIN', name: 'GK Admin', phone: '9415555555', passwordHash: 'x',
    }));
    const listed = s.staff.dealers(admin, 'PENDING');
    assert.equal(listed.data.length, 1);
    assert.equal(listed.data[0].phone, '9415444444');

    const foreignAnn = await s.store.saveAnnouncement({
      id: 'ann-foreign', tenantId: OTHER, title: 'Secret', body: 'B only',
      audience: 'ALL', isActive: true, createdById: 'foreign-admin', createdAt: new Date().toISOString(),
    });
    await assert.rejects(() => s.staff.patchAnnouncement(admin, foreignAnn.id, { title: 'Hacked' }), ForbiddenException);
  });

  test('login with tenantSlug does not authenticate a user from another tenant with the same phone', async () => {
    const s = makeCtx();
    const bcrypt = await import('bcrypt');
    const hash = await bcrypt.hash('password123', 4);
    await s.store.createUser({
      tenantId: OTHER, role: 'CUSTOMER', name: 'Awadh Same Phone', phone: '9415666666', passwordHash: hash,
    });
    await assert.rejects(
      () => s.auth.login({ phone: '9415666666', password: 'password123' } as any),
      UnauthorizedException,
    );
    const ok = await s.auth.login({ phone: '9415666666', password: 'password123', tenantSlug: 'awadh-bricks' } as any);
    assert.equal(ok.user.tenantId, OTHER);
  });

  test('events and audit logs inherit the actor tenantId', async () => {
    const s = makeCtx();
    const staffAcc = await s.store.createUser({
      tenantId: TENANT, role: 'STAFF', name: 'Yard', phone: '9415777777', passwordHash: 'x',
    });
    const customer = await s.auth.register({ name: 'C', phone: '9415888888', password: 'password123' } as any);
    const enq = await s.store.createEnquiry({
      tenantId: TENANT, userId: customer.user.id, contactName: 'C', contactPhone: '9415888888',
      siteLocation: 'Jaunpur', lines: [{ productName: 'Awwal', quantity: 500, unit: 'bricks' }], attachments: [],
    });
    await s.workflow.reviewEnquiry(asUser(staffAcc), enq.id);
    const events = s.store.timeline('ENQUIRY', enq.id);
    assert.ok(events.every((e) => e.tenantId === TENANT));
    const audits = s.store.listAudit(TENANT);
    assert.ok(audits.some((a) => a.action === 'ENQUIRY_REVIEW' && a.tenantId === TENANT));
    assert.equal(s.store.listAudit(OTHER).length, 0);
  });
});

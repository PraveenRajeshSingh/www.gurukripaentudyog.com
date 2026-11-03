// End-to-end API smoke test over HTTP against a running backend.
// Usage: node scripts/smoke.js [baseUrl]
// Exercises the complete requirement-D workflow with real JWT auth:
// register -> enquiry -> staff review -> quotation -> customer approval ->
// order -> production -> dispatch -> delivered, plus RBAC negative checks.
const BASE = process.argv[2] || 'http://localhost:3999';

async function call(method, path, { token, body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

function check(label, cond, extra) {
  if (!cond) {
    console.error(`FAIL: ${label}`, JSON.stringify(extra).slice(0, 400));
    process.exit(1);
  }
  console.log(`PASS: ${label}`);
}

(async () => {
  const suffix = Date.now().toString().slice(-7);
  const custPhone = `987${suffix}`; // 10-digit Indian mobile format
  const otherPhone = `986${suffix}`;

  // Admin bootstrap user exists via env (BOOTSTRAP_ADMIN_PHONE=9700000000).
  const admin = await call('POST', '/api/v1/auth/login', { body: { phone: '9700000000', password: 'Smoke#Admin2026' } });
  check('admin login', admin.status === 201 || admin.status === 200, admin.json);
  const adminToken = admin.json.token;

  // Create a STAFF account through the store bootstrap is not available over
  // HTTP; instead the admin performs staff actions (ADMIN is a staff role).
  const reg = await call('POST', '/api/v1/auth/register', { body: { name: 'Smoke Customer', phone: custPhone, password: 'Smoke#1234', language: 'en' } });
  check('customer registration', reg.json.token, reg.json);
  const custToken = reg.json.token;

  const cat = await call('GET', '/api/v1/public/products');
  check('public catalogue', cat.json.count >= 1, cat.json);

  const enq = await call('POST', '/api/v1/me/enquiries', {
    token: custToken,
    body: { lines: [{ productName: 'Awwal Bricks', quantity: 8000, unit: 'bricks' }], siteLocation: 'Kheta Sarai, Jaunpur', notes: 'smoke enquiry' },
  });
  check('enquiry created', enq.json.data && enq.json.data.status === 'NEW', enq.json);

  // Negative: customer must not reach staff endpoints.
  const forbid = await call('POST', `/api/v1/staff/enquiries/${enq.json.data.id}/review`, { token: custToken });
  check('customer blocked from staff review (403)', forbid.status === 403, forbid.json);

  const review = await call('POST', `/api/v1/staff/enquiries/${enq.json.data.id}/review`, { token: adminToken });
  check('admin review', review.json.data.status === 'UNDER_REVIEW', review.json);

  const quote = await call('POST', `/api/v1/staff/enquiries/${enq.json.data.id}/quotation`, {
    token: adminToken,
    body: { lines: [{ name: 'Awwal Bricks', quantity: 8000, unit: 'bricks', unitPrice: 7.05 }], sendNow: true },
  });
  check('quotation sent with GST split', quote.json.data.status === 'SENT' && quote.json.data.taxableValue + quote.json.data.cgst + quote.json.data.sgst === quote.json.data.total, quote.json);

  const approve = await call('POST', `/api/v1/me/quotations/${quote.json.data.id}/approve`, { token: custToken });
  check('approval converts to confirmed order', approve.json.data.status === 'CONFIRMED', approve.json);
  const orderId = approve.json.data.id;

  for (const status of ['PRODUCTION', 'DISPATCHED', 'DELIVERED']) {
    const upd = await call('POST', `/api/v1/staff/orders/${orderId}/status`, { token: adminToken, body: { status } });
    check(`order -> ${status}`, upd.json.data.status === status, upd.json);
  }

  const orderView = await call('GET', `/api/v1/me/orders/${orderId}`, { token: custToken });
  check('customer timeline has 4+ events', orderView.json.data.timeline.length >= 4, orderView.json.data.timeline);

  const inbox = await call('GET', '/api/v1/me/notifications', { token: custToken });
  check('customer inbox received workflow notifications', inbox.json.data.length >= 4, inbox.json.data.map((n) => n.type));

  const invoice = await call('GET', `/api/v1/me/orders/${orderId}/invoice`, { token: custToken });
  check('invoice document (server-computed tax)', invoice.json.data.business.gstin && invoice.json.data.total > 0, invoice.json);

  const other = await call('POST', '/api/v1/auth/register', { body: { name: 'Other', phone: otherPhone, password: 'Smoke#1234' } });
  const leak = await call('GET', `/api/v1/me/orders/${orderId}`, { token: other.json.token });
  check('cross-customer order access blocked (404)', leak.status === 404, leak.json);

  const stats = await call('GET', '/api/v1/staff/stats', { token: adminToken });
  check('admin stats reflect real data', stats.json.data.orders.total >= 1 && stats.json.data.enquiries.total >= 1, stats.json);

  const csv = await fetch(`${BASE}/api/v1/staff/export/orders.csv`, { headers: { authorization: `Bearer ${adminToken}` } });
  check('CSV export streams', csv.headers.get('content-type')?.includes('text/csv'), {});

  const noToken = await call('GET', '/api/v1/me/orders');
  check('anonymous access to /me blocked (401)', noToken.status === 401, noToken.json);

  console.log('\nALL SMOKE CHECKS PASSED');
})().catch((err) => { console.error('SMOKE CRASH:', err); process.exit(1); });

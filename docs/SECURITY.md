# Security Policy & Safeguards

Gurukripa Ent Udyog adheres to strict production security rules to protect customer data, business operations, and system integrity.

---

## 1. Zero Secret Inversion Rule

- **No Hardcoded Credentials:** Never commit API keys, database passwords, JWT secrets, or keystores into source code repositories.
- **Environment Isolation:** All sensitive credentials must be injected via runtime environment variables (`.env`, Vercel Environment Variables, GitHub Actions Secrets).

---

## 2. Server-Side Data Validation

- **No Blind Client Trust:** Calculations for discounts, coupon percentages (`GURU10`, `BRICK50`, `FIRSTORDER`), and 5% GST taxes are verified and computed on the server side.
- **Input Sanitization:** Contact enquiry inputs (`fullName`, `phone`, `deliveryLocation`, `message`) are validated with strict regex and string length constraints before processing.
- **XSS Prevention:** All user-supplied values rendered into templates are sanitized using HTML entity escaping.

---

## 3. Privacy & Customer Protection

- **No Data Brokering:** Customer telephone numbers and addresses are used solely for trolley dispatch and order fulfillment.
- **Storage Encryption:** Local offline database transactions in the Android app (Room) reside in protected application sandbox storage.
- **Transport Security:** All client-server communications use HTTPS / TLS 1.3.

---

## 4. Multi-Tenant Backend Isolation

- All database queries enforce tenant isolation (`tenant_id = currentTenant`).
- Tenant A can never view, mutate, or access inventory, orders, or pricing tables belonging to Tenant B.
- Validated via automated isolation tests in `backend/test/isolation_and_pricing.test.js`.

# OTP_NOTES — Batch 2 Phase 1

Honest capability notes for the OTP Autofill UI.

## Does an OTP flow exist?

**No.** Grep of the storefront and Platform API surface found:

- No SMS sender
- No `/auth/otp` (or similar) endpoint in use by the client
- No production mount that verifies a one-time code
- Leftover `.otp-row` / `.otp-digit` CSS in `mobile-fixes.css` (replaced this phase)

Therefore this phase **does not invent an OTP backend**. It:

1. Restyles the real **account recovery / verification step** (`#recoverPanel` / `#authVerifyStep`) — Call / WhatsApp the yard.
2. Ships a reusable **OTP autofill component** (`GBOtpAutofill`) for `/ui-kit.html` demo and future wiring.
3. Keeps a **dormant** mount point in the recover panel (`#authOtpMount[hidden]`) so we never show fake digit boxes on the live auth sheet.

## What works today (UI only)

| Path | Status |
|------|--------|
| Typing digits into the hidden `autocomplete="one-time-code"` input | Works in ui-kit demo |
| Paste (spaces/dashes stripped; Hindi digits mapped) | Works in demo |
| Keyboard / OS “From Messages” suggestion into `one-time-code` | Works when the OS offers it; still no server verify |
| Clipboard “Paste code …” chip | Offered when `clipboard.readText` is permitted |
| WebOTP (`navigator.credentials.get({ otp })`) | Feature-detected; **inactive on this static site** |
| Resend countdown (timestamp-based) | Demo UI only — no SMS is sent |
| Auto-submit | Only if a real `onComplete` handler is passed **and** `autoSubmit: true` |

## WebOTP requirement (do not claim otherwise)

WebOTP fires in supporting browsers **only** when an SMS arrives that ends with a line like:

```text
@www.gurukripaentudyog.com #482913
```

That SMS must come from a backend / SMS provider. This GitHub Pages storefront does not send SMS, so **WebOTP stays inactive**. The working autofill paths are keyboard suggestion and paste. The UI never claims “we texted you a code” on the live recover step.

## Live storefront copy

Recover panel states clearly: no automatic emails or SMS OTPs yet; yard verifies by phone/WhatsApp. Masked destination shown as `+91 ******3230` (yard line).

## Wiring later (when a backend exists)

```js
GBOtpAutofill.mount(document.getElementById('authOtpMount'), {
  length: 6, // or 4 — match the API
  destination: userMobile,
  autoSubmit: true,
  onComplete: function (code) {
    return GBApi.verifyOtp({ phone, code }); // hypothetical — does not exist today
  },
  onResend: function () {
    return GBApi.sendOtp({ phone }); // hypothetical
  }
});
```

Until then: keep `#authOtpMount` hidden; use ui-kit demo for visual QA.

## Security

- Demo mode never stores codes in `localStorage`
- No passwords or OTPs logged
- Production recover step does not collect a fake OTP

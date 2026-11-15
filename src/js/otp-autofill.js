/**
 * COMPONENT: OTP Autofill UI
 * Presentation-only module. There is no SMS/OTP backend on this static site.
 * Demo mode simulates verify/resend for ui-kit review. Production mounts stay
 * inactive unless a real verify handler is passed (see OTP_NOTES.md).
 */
(function (global) {
  'use strict';

  var HINDI_DIGITS = {
    '\u0966': '0', '\u0967': '1', '\u0968': '2', '\u0969': '3', '\u096A': '4',
    '\u096B': '5', '\u096C': '6', '\u096D': '7', '\u096E': '8', '\u096F': '9'
  };

  function reduceMotion() {
    try {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return true;
      if (navigator.connection && navigator.connection.saveData) return true;
    } catch (_e) { /* ignore */ }
    return false;
  }

  function normalizeDigits(raw, max) {
    var s = String(raw == null ? '' : raw);
    var out = '';
    for (var i = 0; i < s.length; i++) {
      var ch = s.charAt(i);
      if (HINDI_DIGITS[ch]) ch = HINDI_DIGITS[ch];
      if (ch >= '0' && ch <= '9') out += ch;
      if (out.length >= max) break;
    }
    return out;
  }

  function maskDestination(dest) {
    var d = String(dest || '').replace(/\D/g, '');
    if (d.length < 4) return dest || '••••';
    return '+91 ******' + d.slice(-4);
  }

  function createEl(tag, cls, attrs) {
    var el = document.createElement(tag);
    if (cls) el.className = cls;
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (attrs[k] == null) return;
        if (k === 'text') el.textContent = attrs[k];
        else el.setAttribute(k, attrs[k]);
      });
    }
    return el;
  }

  /**
   * @param {HTMLElement} mount
   * @param {object} opts
   * @param {number} [opts.length=6]
   * @param {string} [opts.destination] phone/email to mask in copy
   * @param {boolean} [opts.demo=false] allow simulated verify/resend
   * @param {boolean} [opts.autoSubmit=false] only when opts.onComplete returns truthy path
   * @param {function} [opts.onComplete] (code) => Promise|void — real verify hook
   * @param {function} [opts.onResend] () => Promise|void
   * @param {number} [opts.resendSeconds=30]
   * @param {number} [opts.maxAttempts]
   */
  function mountOtpAutofill(mount, opts) {
    if (!mount) return null;
    opts = opts || {};
    var length = opts.length === 4 ? 4 : 6;
    var demo = !!opts.demo;
    var autoSubmit = !!opts.autoSubmit && typeof opts.onComplete === 'function';
    var resendSeconds = Math.max(5, Number(opts.resendSeconds) || 30);
    var maxAttempts = opts.maxAttempts != null ? Number(opts.maxAttempts) : null;
    var attemptsLeft = maxAttempts;
    var reduced = reduceMotion();
    var destroyed = false;
    var verifying = false;
    var lockedUntil = 0;
    var resendUntil = Date.now() + resendSeconds * 1000;
    var webotpAbort = null;
    var timers = [];
    var lastCode = '';

    mount.innerHTML = '';
    mount.classList.add('otp-field');
    mount.setAttribute('data-length', String(length));
    mount.style.setProperty('--otp-len', String(length));

    if (!demo) {
      var banner = createEl('div', 'otp-banner otp-banner--warn');
      banner.innerHTML = '<svg class="icon icon--sm" aria-hidden="true"><use href="#i-info"></use></svg>';
      var banTxt = createEl('span', null, {
        text: 'SMS one-time codes are not sent by this site yet. Keyboard paste and autofill UI are ready for when a backend exists. WebOTP stays inactive without an SMS ending in @domain #code.'
      });
      banner.appendChild(banTxt);
      mount.appendChild(banner);
    } else {
      var demoBan = createEl('div', 'otp-banner');
      demoBan.innerHTML = '<svg class="icon icon--sm" aria-hidden="true"><use href="#i-info"></use></svg>';
      demoBan.appendChild(createEl('span', null, {
        text: 'UI kit demo only — no SMS is sent. Paste or type a ' + length + '-digit code to exercise states. Demo accepts any full code.'
      }));
      mount.appendChild(demoBan);
    }

    var meta = createEl('p', 'otp-meta');
    meta.textContent = 'Code sent to ' + maskDestination(opts.destination || '919198923230') + ' (masked).';
    mount.appendChild(meta);

    var wrap = createEl('div', 'otp-field__wrap');
    wrap.setAttribute('role', 'group');
    wrap.setAttribute('aria-label', 'One-time verification code, ' + length + ' digits');

    var input = createEl('input', 'otp-field__sr', {
      type: 'text',
      inputmode: 'numeric',
      autocomplete: 'one-time-code',
      pattern: '[0-9]*',
      maxlength: String(length),
      enterkeyhint: 'done',
      'aria-label': 'Enter ' + length + '-digit code',
      autocorrect: 'off',
      autocapitalize: 'off',
      spellcheck: 'false'
    });

    var row = createEl('div', 'otp-row');
    row.setAttribute('data-length', String(length));
    var boxes = [];
    for (var i = 0; i < length; i++) {
      var box = createEl('div', 'otp-digit', {
        'data-index': String(i),
        'aria-label': 'Digit ' + (i + 1) + ' of ' + length
      });
      // Not focusable — the single hidden input is the tab stop (WAI pattern for OTP).
      var char = createEl('span', 'otp-digit__char');
      box.appendChild(char);
      var spin = createEl('span', 'otp-digit__spin');
      spin.innerHTML = '<svg class="icon icon-spin" aria-hidden="true"><use href="#i-loader"></use></svg>';
      box.appendChild(spin);
      boxes.push({ el: box, char: char });
      row.appendChild(box);
    }

    wrap.appendChild(input);
    wrap.appendChild(row);
    mount.appendChild(wrap);

    var progress = createEl('div', 'otp-progress', { 'aria-hidden': 'true' });
    progress.appendChild(createEl('div', 'otp-progress__bar'));
    mount.appendChild(progress);

    var status = createEl('div', 'otp-status', { 'aria-live': 'polite' });
    mount.appendChild(status);

    var actions = createEl('div', 'otp-actions');
    var pasteChip = createEl('button', 'otp-paste-chip', { type: 'button' });
    pasteChip.setAttribute('hidden', '');
    var resendBtn = createEl('button', 'otp-resend', { type: 'button', text: 'Resend code' });
    resendBtn.disabled = true;
    actions.appendChild(pasteChip);
    actions.appendChild(resendBtn);
    mount.appendChild(actions);

    function setStatus(msg, tone, assertive) {
      status.textContent = msg || '';
      status.setAttribute('data-tone', tone || 'info');
      status.setAttribute('aria-live', assertive ? 'assertive' : 'polite');
    }

    function paint(code, optsPaint) {
      optsPaint = optsPaint || {};
      var stagger = !!optsPaint.stagger && !reduced;
      boxes.forEach(function (b, idx) {
        var d = code.charAt(idx) || '';
        b.char.textContent = d;
        b.el.classList.toggle('is-filled', !!d);
        b.el.classList.toggle('is-active', idx === Math.min(code.length, length - 1) && document.activeElement === input);
        b.el.classList.toggle('is-caret', idx === code.length && code.length < length && document.activeElement === input);
        if (stagger && d && idx >= (optsPaint.from || 0)) {
          b.el.classList.remove('is-pop');
          void b.el.offsetWidth;
          b.el.classList.add('is-pop');
          var t = window.setTimeout(function () { b.el.classList.remove('is-pop'); }, 220);
          timers.push(t);
        }
      });
    }

    function clearErrorSuccess() {
      mount.classList.remove('is-error', 'is-success');
    }

    function setCode(raw, source) {
      if (destroyed || verifying) return;
      if (Date.now() < lockedUntil) {
        setStatus('Too many attempts. Try again shortly.', 'warning', true);
        return;
      }
      var next = normalizeDigits(raw, length);
      var prev = lastCode;
      var grew = next.length > prev.length;
      lastCode = next;
      input.value = next;
      clearErrorSuccess();
      paint(next, { stagger: grew && (source === 'paste' || source === 'autofill' || source === 'webotp'), from: prev.length });
      if (next.length === length) {
        maybeComplete(next);
      }
    }

    function maybeComplete(code) {
      if (verifying) return;
      if (!demo && typeof opts.onComplete !== 'function') {
        setStatus('No verification service is connected. Code captured in UI only.', 'warning', false);
        return;
      }
      if (!autoSubmit && !demo && typeof opts.onComplete !== 'function') return;

      verifying = true;
      mount.classList.add('is-verifying');
      setStatus('Verifying…', 'info', false);
      input.setAttribute('aria-busy', 'true');

      var runner = typeof opts.onComplete === 'function'
        ? opts.onComplete
        : function () {
          return new Promise(function (resolve) {
            window.setTimeout(function () { resolve({ ok: true, demo: true }); }, 480);
          });
        };

      Promise.resolve()
        .then(function () { return runner(code); })
        .then(function (res) {
          if (destroyed) return;
          verifying = false;
          mount.classList.remove('is-verifying');
          input.removeAttribute('aria-busy');
          var ok = !res || res.ok !== false;
          if (ok) {
            mount.classList.add('is-success');
            boxes.forEach(function (b, i) {
              var delay = reduced ? 0 : i * 40;
              timers.push(window.setTimeout(function () {
                b.el.classList.add('is-check');
                b.char.innerHTML = '<svg class="icon icon--sm" aria-hidden="true"><use href="#i-check"></use></svg>';
              }, delay));
            });
            setStatus(demo ? 'Demo success — no server called.' : 'Verified.', 'success', false);
          } else {
            failVerify((res && res.message) || 'Invalid code. Try again.');
          }
        })
        .catch(function (err) {
          if (destroyed) return;
          verifying = false;
          mount.classList.remove('is-verifying');
          input.removeAttribute('aria-busy');
          failVerify((err && err.message) || 'Verification failed.');
        });
    }

    function failVerify(message) {
      if (attemptsLeft != null) {
        attemptsLeft -= 1;
        if (attemptsLeft <= 0) {
          lockedUntil = Date.now() + 30000;
          setStatus('No attempts left. Locked for 30s.', 'error', true);
        } else {
          setStatus(message + ' ' + attemptsLeft + ' attempt(s) left.', 'error', true);
        }
      } else {
        setStatus(message, 'error', true);
      }
      mount.classList.add('is-error');
      lastCode = '';
      input.value = '';
      paint('');
      timers.push(window.setTimeout(function () {
        mount.classList.remove('is-error');
        try { input.focus({ preventScroll: true }); } catch (_e) { input.focus(); }
      }, reduced ? 0 : 420));
    }

    function onInput() {
      abortWebOtp();
      setCode(input.value, 'type');
    }

    function onPaste(e) {
      abortWebOtp();
      try {
        var text = (e.clipboardData || window.clipboardData).getData('text');
        if (text) {
          e.preventDefault();
          setCode(text, 'paste');
        }
      } catch (_e) { /* ignore */ }
    }

    function onKeyDown(e) {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'Home' || e.key === 'End') {
        // Keep caret semantics on the single real input.
        return;
      }
      if (e.key === 'Backspace' && !input.value) {
        paint('');
      }
    }

    function focusFirstEmpty() {
      try { input.focus({ preventScroll: true }); } catch (_e) { input.focus(); }
      paint(lastCode);
    }

    function onRowPointer(e) {
      // Boxes are pointer-events:none; clicks hit the overlay input.
      focusFirstEmpty();
    }

    function tickResend() {
      if (destroyed) return;
      var left = Math.max(0, Math.ceil((resendUntil - Date.now()) / 1000));
      if (left > 0) {
        resendBtn.disabled = true;
        var m = Math.floor(left / 60);
        var s = left % 60;
        resendBtn.textContent = 'Resend code in ' + m + ':' + String(s).padStart(2, '0');
      } else {
        resendBtn.disabled = false;
        resendBtn.textContent = 'Resend code';
      }
    }

    function onResendClick() {
      if (resendBtn.disabled) return;
      resendUntil = Date.now() + resendSeconds * 1000;
      tickResend();
      setStatus('Code sent to ' + maskDestination(opts.destination || '919198923230') + '.', 'success', false);
      var p = typeof opts.onResend === 'function'
        ? opts.onResend()
        : (demo ? Promise.resolve() : Promise.resolve());
      Promise.resolve(p).catch(function () {
        setStatus('Could not resend yet — no SMS backend.', 'warning', false);
      });
      startWebOtp();
    }

    function offerPasteChip() {
      if (!navigator.clipboard || !navigator.clipboard.readText) return;
      navigator.clipboard.readText().then(function (text) {
        var digits = normalizeDigits(text, length);
        if (digits.length === length) {
          pasteChip.textContent = 'Paste code ' + digits;
          pasteChip.dataset.code = digits;
          pasteChip.classList.add('is-on');
          pasteChip.removeAttribute('hidden');
        }
      }).catch(function () {
        pasteChip.classList.remove('is-on');
        pasteChip.setAttribute('hidden', '');
      });
    }

    function onPasteChip() {
      if (pasteChip.dataset.code) setCode(pasteChip.dataset.code, 'paste');
      pasteChip.classList.remove('is-on');
      pasteChip.setAttribute('hidden', '');
    }

    function abortWebOtp() {
      if (webotpAbort) {
        try { webotpAbort.abort(); } catch (_e) { /* ignore */ }
        webotpAbort = null;
      }
    }

    function startWebOtp() {
      abortWebOtp();
      if (!('OTPCredential' in window) || !navigator.credentials || !navigator.credentials.get) {
        return;
      }
      // WebOTP only succeeds when the SMS body ends with "@<domain> #<code>" from the sender.
      // On a static site with no SMS provider this path stays inactive — see OTP_NOTES.md.
      webotpAbort = new AbortController();
      var timeout = window.setTimeout(function () { abortWebOtp(); }, 60000);
      timers.push(timeout);
      navigator.credentials.get({
        otp: { transport: ['sms'] },
        signal: webotpAbort.signal
      }).then(function (cred) {
        if (!cred || !cred.code) return;
        setCode(cred.code, 'webotp');
      }).catch(function () {
        /* Unsupported, aborted, or no matching SMS — expected on this static site. */
      });
    }

    var resendTimer = window.setInterval(tickResend, 1000);
    timers.push(resendTimer);
    tickResend();

    input.addEventListener('input', onInput);
    input.addEventListener('paste', onPaste);
    input.addEventListener('keydown', onKeyDown);
    input.addEventListener('focus', function () {
      paint(lastCode);
      offerPasteChip();
      startWebOtp();
    });
    input.addEventListener('blur', function () { paint(lastCode); });
    wrap.addEventListener('pointerdown', onRowPointer);
    resendBtn.addEventListener('click', onResendClick);
    pasteChip.addEventListener('click', onPasteChip);

    document.addEventListener('visibilitychange', onVisibility);
    function onVisibility() {
      if (document.hidden) abortWebOtp();
      else if (document.activeElement === input) startWebOtp();
      tickResend();
    }

    // Initial paint
    paint('');

    return {
      destroy: function () {
        destroyed = true;
        abortWebOtp();
        document.removeEventListener('visibilitychange', onVisibility);
        timers.forEach(function (id) {
          clearTimeout(id);
          clearInterval(id);
        });
        timers = [];
        try { mount.innerHTML = ''; } catch (_e) { /* ignore */ }
      },
      getCode: function () { return lastCode; },
      setCode: function (v) { setCode(v, 'autofill'); },
      focus: focusFirstEmpty
    };
  }

  global.GBOtpAutofill = {
    mount: mountOtpAutofill,
    normalizeDigits: normalizeDigits,
    maskDestination: maskDestination
  };
})(typeof window !== 'undefined' ? window : this);

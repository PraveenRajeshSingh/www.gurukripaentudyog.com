/* ══════════════════════════════════════════════════════════════════
   GBDialogs — brand-consistent confirm / alert / prompt dialogs.

   One reusable dialog built on the SAME overlay system as every other
   popup (OVERLAY_STACK + overlayLock/overlayUnlock in ui.js), so scroll
   lock, ESC, Tab-trap and focus return are not implemented twice.

   Also owns the "unsaved changes" guard: any .modal-overlay whose fields
   the user has typed into can no longer be dismissed by backdrop click
   (capture hook here) or Escape (ui.js calls GBDialogs.requestDismiss).

   Must load after ui.js. Requires: overlayLock, overlayUnlock, OVERLAY_STACK.
   ══════════════════════════════════════════════════════════════════ */
(function () {
    'use strict';

    var ID = 'gbDialogModal';
    var el = null, mode = null, resolver = null, busy = false;
    var box, titleEl, msgEl, iconEl, fieldEl, inputEl, errEl, cancelBtn, okBtn;

    var ICONS = {
        success: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12.5l2.5 2.5L16 9.5"/></svg>',
        error: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="#dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>',
        info: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="var(--brand)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>',
        warning: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="#d97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>'
    };

    function build() {
        if (el) return;
        el = document.createElement('div');
        el.className = 'modal-overlay gb-dialog';
        el.id = ID;
        el.setAttribute('role', 'dialog');
        el.setAttribute('aria-modal', 'true');
        el.setAttribute('aria-labelledby', 'gbDlgTitle');
        el.innerHTML =
            '<div class="modal-box" style="max-width:420px">' +
            '<div class="modal-head"><div>' +
            '<h3 class="modal-title" id="gbDlgTitle"></h3>' +
            '</div><button type="button" class="modal-close-btn" data-gb-act="cancel" aria-label="Close dialog">✕</button></div>' +
            '<div class="modal-body">' +
            '<div class="gb-dialog-row"><span class="gb-dialog-icon" id="gbDlgIcon" hidden></span><p class="gb-dialog-msg" id="gbDlgMsg"></p></div>' +
            '<div class="auth-field" id="gbDlgField" hidden>' +
            '<label class="auth-label" id="gbDlgLabel" for="gbDlgInput"></label>' +
            '<input class="auth-input gb-dialog-input" id="gbDlgInput" autocomplete="off">' +
            '</div>' +
            '<p class="auth-error-msg" id="gbDlgErr" role="alert" hidden></p>' +
            '<div class="gb-dialog-foot">' +
            '<button type="button" class="btn btn-outline" id="gbDlgCancel" data-gb-act="cancel">Cancel</button>' +
            '<button type="button" class="btn btn-primary" id="gbDlgOk">Confirm</button>' +
            '</div></div></div>';
        document.body.appendChild(el);

        box = el.querySelector('.modal-box');
        titleEl = el.querySelector('#gbDlgTitle');
        msgEl = el.querySelector('#gbDlgMsg');
        iconEl = el.querySelector('#gbDlgIcon');
        fieldEl = el.querySelector('#gbDlgField');
        inputEl = el.querySelector('#gbDlgInput');
        errEl = el.querySelector('#gbDlgErr');
        cancelBtn = el.querySelector('#gbDlgCancel');
        okBtn = el.querySelector('#gbDlgOk');

        // Backdrop dismissal is safe here (this dialog never holds unsaved data).
        el.addEventListener('click', function (e) { if (e.target === el) dismissTop(); });
        el.addEventListener('click', function (e) {
            var act = e.target.closest && e.target.closest('[data-gb-act="cancel"]');
            if (act) dismissTop();
        });
        okBtn.addEventListener('click', confirmAction);
        inputEl.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') { e.preventDefault(); confirmAction(); }
        });

        // This dialog must win against ESC on anything stacked under it.
        if (typeof OVERLAY_STACK !== 'undefined') {
            OVERLAY_STACK.unshift([ID, function () { dismissTop(); }]);
        }
    }

    function showError(text) {
        errEl.textContent = text;
        errEl.hidden = false;
        inputEl.classList.add('error');
    }

    function show(opts) {
        build();
        mode = opts.mode;
        busy = false;
        titleEl.textContent = opts.title || '';
        msgEl.textContent = opts.message || '';
        msgEl.hidden = !opts.message;
        iconEl.hidden = !opts.icon;
        if (opts.icon) iconEl.innerHTML = ICONS[opts.icon] || ICONS.info;
        errEl.hidden = true;
        inputEl.classList.remove('error');
        fieldEl.hidden = mode !== 'prompt';
        el.setAttribute('role', opts.mode === 'confirm' && opts.danger ? 'alertdialog' : 'dialog');

        okBtn.className = 'btn ' + (opts.danger ? 'gb-btn-danger' : 'btn-primary');
        okBtn.textContent = opts.confirmLabel || (mode === 'prompt' ? 'Save' : 'Confirm');
        okBtn.disabled = false;
        cancelBtn.hidden = mode === 'alert';
        cancelBtn.textContent = opts.cancelLabel || 'Cancel';

        var pending = null;
        var promise = new Promise(function (res) { pending = res; });
        el.classList.add('open');
        if (typeof overlayLock === 'function') overlayLock();
        setTimeout(function () {
            if (mode === 'prompt') inputEl.focus();
            else if (opts.danger) cancelBtn.focus();
            else okBtn.focus();
        }, 60);

        resolver = pending;
        var onConfirm = opts.onConfirm || null;
        el._gb = { onConfirm: onConfirm, promptMode: mode === 'prompt' };
        return promise;
    }

    function settle(value) {
        if (busy) return;
        el.classList.remove('open');
        if (typeof overlayUnlock === 'function') overlayUnlock();
        var r = resolver; resolver = null;
        el._gb = null;
        if (r) r(value);
    }

    // Escape/backdrop on our own dialog: alert accepts, others cancel.
    function dismissTop() {
        if (!el || !el.classList.contains('open')) return;
        settle(mode === 'alert' ? true : (mode === 'prompt' ? null : false));
    }

    function confirmAction() {
        if (busy || !el || !el.classList.contains('open')) return;
        var ctx = el._gb || {};
        if (ctx.promptMode) {
            var v = inputEl.value.trim();
            if (!v && inputEl.dataset.gbRequired === '1') { showError('This field is required.'); return; }
            settle(v);
            return;
        }
        if (typeof ctx.onConfirm !== 'function') { settle(true); return; }
        // Async action: show progress, settle only once the work succeeded (§4).
        var out = ctx.onConfirm();
        if (!out || typeof out.then !== 'function') { settle(true); return; }
        busy = true;
        okBtn.disabled = true; cancelBtn.disabled = true;
        okBtn.innerHTML = '<span class="gb-spin" aria-hidden="true"></span> Working…';
        out.then(function () {
            busy = false; okBtn.disabled = false; cancelBtn.disabled = false;
            settle(true);
        }, function (err) {
            busy = false; okBtn.disabled = false; cancelBtn.disabled = false;
            okBtn.textContent = (el._gb && el._gb.retryLabel) || 'Try again';
            errEl.textContent = (err && err.message) || 'Something went wrong. Please try again.';
            errEl.hidden = false;
        });
    }

    /* ── Unsaved-changes tracking ─────────────────────────────────
       First keystroke in a field records its starting value; the field
       is "dirty" only while it differs from that value, so backing out
       of exactly what was there does not trigger the guard. */
    document.addEventListener('input', function (e) {
        var t = e.target;
        if (!t || !t.matches || !t.matches('input,textarea,select')) return;
        var ov = t.closest ? t.closest('.modal-overlay') : null;
        if (!ov || ov.id === ID) return;
        if (!t.dataset.gbInitial) t.dataset.gbInitial = t.value || '';
        if ((t.value || '') !== t.dataset.gbInitial) t.dataset.gbDirty = '1';
        else delete t.dataset.gbDirty;
    }, true);

    function isDirty(overlayEl) {
        if (!overlayEl || !overlayEl.querySelectorAll) return false;
        var fields = overlayEl.querySelectorAll('[data-gb-dirty]');
        for (var i = 0; i < fields.length; i++) {
            var f = fields[i];
            if (f.dataset && f.dataset.gbDirty === '1' && !f.disabled && f.type !== 'hidden') return true;
        }
        return false;
    }

    // Backdrop click guard runs in capture phase, before each modal's own
    // inline onclick — and stops it when the form still holds unsaved text.
    document.addEventListener('click', function (e) {
        var ov = e.target && e.target.closest ? e.target.closest('.modal-overlay') : null;
        if (!ov || ov.id === ID || !ov.classList.contains('open')) return;
        if (e.target !== ov) return; // only true backdrop hits
        if (!isDirty(ov)) return;
        e.preventDefault(); e.stopPropagation();
        var pair = null;
        if (typeof OVERLAY_STACK !== 'undefined') {
            for (var i = 0; i < OVERLAY_STACK.length; i++) {
                if (OVERLAY_STACK[i][0] === ov.id) { pair = OVERLAY_STACK[i]; break; }
            }
        }
        requestDismiss(ov, pair);
    }, true);

    // Shared by the backdrop hook above and the ESC path in ui.js.
    function requestDismiss(overlayEl, stackPair) {
        var pair = stackPair;
        if (!pair && typeof OVERLAY_STACK !== 'undefined') {
            for (var i = 0; i < OVERLAY_STACK.length; i++) {
                if (OVERLAY_STACK[i][0] === (overlayEl && overlayEl.id)) { pair = OVERLAY_STACK[i]; break; }
            }
        }
        if (!pair) { if (overlayEl) overlayEl.classList.remove('open'); return; }
        // Must call the local GBDialogs confirm path — bare confirm() is window.confirm
        // and would coerce the options object to "[object Object]".
        show({
            mode: 'confirm',
            title: 'Discard changes?',
            message: 'You have information that has not been submitted. Close anyway?',
            confirmLabel: 'Discard',
            cancelLabel: 'Keep editing',
            danger: true
        }).then(function (go) { if (go) pair[1](); });
    }

    /* ── Public API ──────────────────────────────────────────────── */
    window.GBDialogs = {
        // opts: title, message, confirmLabel, cancelLabel, danger, icon, onConfirm()->Promise?
        confirm: function (opts) { return show(Object.assign({ mode: 'confirm' }, opts)); },
        // opts: title, message, okLabel, kind: 'success'|'error'|'info'|'warning'
        alert: function (opts) {
            opts = opts || {};
            return show({
                mode: 'alert', title: opts.title || '', message: opts.message,
                icon: opts.kind || 'info', confirmLabel: opts.okLabel || 'OK'
            });
        },
        // opts: title, message, label, value, placeholder, required, maxlength
        prompt: function (opts) {
            opts = opts || {};
            var p = show({
                mode: 'prompt', title: opts.title || '', message: opts.message,
                confirmLabel: opts.confirmLabel || 'Save', icon: opts.icon
            });
            inputEl.value = opts.value || '';
            inputEl.placeholder = opts.placeholder || '';
            inputEl.dataset.gbRequired = opts.required ? '1' : '';
            inputEl.type = opts.type || 'text';
            if (opts.maxlength) inputEl.maxLength = opts.maxlength;
            document.getElementById('gbDlgLabel').textContent = opts.label || opts.title || '';
            return p;
        },
        isDirty: isDirty,
        requestDismiss: requestDismiss
    };
})();

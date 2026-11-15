// ══════════════════════════════════════════
// AUTH UI — presentation helpers only
// Floating labels, caps-lock hint, password match,
// step enter animations. Does not change auth business logic.
// ══════════════════════════════════════════
(function () {
  'use strict';

  var AUTH_ROOT = '#authModal';
  var mounted = false;
  var capsBound = false;

  function qs(sel, root) {
    try { return (root || document).querySelector(sel); } catch (_e) { return null; }
  }

  function qsa(sel, root) {
    try { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); } catch (_e) { return []; }
  }

  function syncFloatField(field) {
    if (!field) return;
    var input = qs('input.auth-input', field);
    if (!input) return;
    var filled = !!(input.value && String(input.value).length);
    field.classList.toggle('is-filled', filled);
  }

  function syncAllFloatFields() {
    qsa(AUTH_ROOT + ' .auth-field--float').forEach(syncFloatField);
  }

  function setCapsHint(input, on) {
    if (!input) return;
    var id = input.id === 'loginPassword' ? 'loginCapsHint'
      : input.id === 'regPassword' ? 'regCapsHint' : null;
    if (!id) return;
    var hint = document.getElementById(id);
    if (hint) hint.classList.toggle('is-on', !!on);
  }

  function onCapsKey(e) {
    var t = e.target;
    if (!t || !t.classList || !t.classList.contains('auth-input-pw')) return;
    try {
      setCapsHint(t, e.getModifierState && e.getModifierState('CapsLock'));
    } catch (_e) { /* ignore */ }
  }

  function updatePasswordMatch() {
    var pw = document.getElementById('regPassword');
    var conf = document.getElementById('regConfirm');
    var hint = document.getElementById('regMatchHint');
    if (!pw || !conf || !hint) return;
    if (!conf.value) {
      hint.textContent = '';
      hint.className = 'pw-match';
      return;
    }
    var ok = pw.value === conf.value;
    hint.textContent = ok ? 'Passwords match' : 'Passwords do not match';
    hint.className = 'pw-match ' + (ok ? 'is-match' : 'is-mismatch');
  }

  function animatePanel(panel, direction) {
    if (!panel || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    panel.classList.remove('is-enter-forward', 'is-enter-back');
    // force reflow
    void panel.offsetWidth;
    panel.classList.add(direction === 'back' ? 'is-enter-back' : 'is-enter-forward');
    window.setTimeout(function () {
      panel.classList.remove('is-enter-forward', 'is-enter-back');
    }, 360);
  }

  function mountAuthUi() {
    var root = document.getElementById('authModal');
    if (!root || mounted) return;
    mounted = true;

    root.addEventListener('focusin', function (e) {
      var field = e.target && e.target.closest && e.target.closest('.auth-field--float');
      if (field) field.classList.add('is-focused');
    });
    root.addEventListener('focusout', function (e) {
      var field = e.target && e.target.closest && e.target.closest('.auth-field--float');
      if (field) {
        field.classList.remove('is-focused');
        syncFloatField(field);
      }
    });
    root.addEventListener('input', function (e) {
      var t = e.target;
      if (!t) return;
      if (t.classList && t.classList.contains('auth-input')) {
        var field = t.closest('.auth-field--float');
        syncFloatField(field);
      }
      if (t.id === 'regPassword' || t.id === 'regConfirm') updatePasswordMatch();
    });

    if (!capsBound) {
      capsBound = true;
      document.addEventListener('keydown', onCapsKey, true);
      document.addEventListener('keyup', onCapsKey, true);
    }

    syncAllFloatFields();
  }

  function unmountAuthUi() {
    // Keep document caps listeners — cheap; panel state clears on close.
    syncAllFloatFields();
  }

  window.GBAuthUi = {
    mount: mountAuthUi,
    unmount: unmountAuthUi,
    syncFloatFields: syncAllFloatFields,
    updatePasswordMatch: updatePasswordMatch,
    animatePanel: animatePanel
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountAuthUi);
  } else {
    mountAuthUi();
  }
})();

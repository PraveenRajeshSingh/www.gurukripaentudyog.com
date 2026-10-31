'use strict';
// ══════════════════════════════════════════════════════════════════
// VOICE SEARCH
// Gurukripa Bricks Industry — mic button in the navbar search field
// ══════════════════════════════════════════════════════════════════
// Uses the browser's own SpeechRecognition engine (Chrome/Edge/Android
// WebView). Nothing is uploaded to our servers — the speech is handled by
// the browser/OS. When the API is unavailable (Firefox, older iOS Safari)
// the button explains that instead of pretending to listen.
//
// The transcript is written into #navSearch and an `input` event is
// dispatched, so the existing live product filter in main.js does the
// matching. No second search implementation.
// ══════════════════════════════════════════════════════════════════

const VoiceSearch = (function () {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

    let rec = null;
    let listening = false;

    function button() { return document.getElementById('voiceSearchBtn'); }

    function input() { return document.getElementById('navSearch'); }

    // Pick the locale from the storefront language so "लाल ईंट" dictates in
    // Hindi while the English UI dictates in Indian English.
    function locale() {
        return (typeof currentLang !== 'undefined' && currentLang === 'hi') ? 'hi-IN' : 'en-IN';
    }

    function setVisual(on) {
        const btn = button();
        if (!btn) return;
        btn.style.color = on ? 'var(--brand)' : 'var(--ink-3)';
        btn.style.background = on ? 'var(--brand-light)' : 'none';
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
        btn.title = on ? 'Listening… tap to stop' : 'Voice search (' + locale() + ')';
    }

    function supported() { return !!SR; }

    function start() {
        if (!supported()) {
            showToast('This browser has no voice input. Type the brick name instead — Ctrl+K focuses the search box.', 'warning');
            return;
        }
        const field = input();
        if (!field) return;
        field.focus();

        rec = new SR();
        rec.lang = locale();
        rec.interimResults = true;
        rec.continuous = false;
        rec.maxAlternatives = 1;

        rec.onresult = (ev) => {
            const said = Array.from(ev.results)
                .map((r) => r[0] ? r[0].transcript : '')
                .join(' ').trim();
            if (!said) return;
            field.value = said;
            // Let the storefront's own debounced filter react, exactly as if
            // the buyer had typed.
            field.dispatchEvent(new Event('input', { bubbles: true }));
            if (ev.results[ev.results.length - 1].isFinal) {
                showToast('Searched for "' + said + '".', 'success');
                scrollToProducts();
            }
        };

        rec.onerror = (ev) => {
            const why = ev.error === 'not-allowed'
                ? 'Microphone permission was blocked. Allow it in the site settings, then try again.'
                : ev.error === 'no-speech'
                    ? 'No speech detected — tap the mic and say the brick name.'
                    : 'Voice input failed (' + ev.error + '). Type the brick name instead.';
            showToast(why, 'warning');
        };

        rec.onend = () => { listening = false; setVisual(false); };

        try {
            rec.start();
            listening = true;
            setVisual(true);
            showToast('Listening in ' + (locale() === 'hi-IN' ? 'हिंदी' : 'English') + '…', 'info');
        } catch (_e) {
            listening = false;
            setVisual(false);
        }
    }

    function stop() {
        if (rec && listening) { try { rec.stop(); } catch (_e) { /* already stopped */ } }
        listening = false;
        setVisual(false);
    }

    function scrollToProducts() {
        const grid = document.getElementById('productsGrid');
        if (grid) grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    return {
        supported,
        start,
        stop,
        toggle: () => { listening ? stop() : start(); },
        isListening: () => listening,
        // Called once on load so the mic never looks live when it cannot be.
        markAvailability: () => {
            const btn = button();
            if (!btn || supported()) return;
            btn.style.opacity = '.55';
            btn.title = 'Voice search is not available in this browser';
        }
    };
})();

window.VoiceSearch = VoiceSearch;

// Handler used by the navbar mic button.
function toggleVoiceSearch() { VoiceSearch.toggle(); }

document.addEventListener('DOMContentLoaded', () => {
    VoiceSearch.markAvailability();
    // Stop the mic when the buyer leaves the field — an unattended
    // recognition session keeps the hardware indicator lit on Android.
    const field = document.getElementById('navSearch');
    if (field) field.addEventListener('blur', () => VoiceSearch.stop());
});

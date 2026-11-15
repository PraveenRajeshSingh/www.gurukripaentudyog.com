// ══════════════════════════════════════════
// i18n RUNTIME (Phase 1)
// Source of truth: /i18n/en.json + /i18n/hi.json
// Sync bundle: src/js/i18n-data.js → window.__GBI_I18N__ (no network wait)
// Regenerate bundle: node scripts/extract-i18n-json.js
// ══════════════════════════════════════════
(function (global) {
    'use strict';

    var STORAGE_KEY = 'gb_lang';

    function emptyDict() {
        return { en: {}, hi: {} };
    }

    function fromBundle() {
        var b = global.__GBI_I18N__;
        if (!b || typeof b !== 'object') return null;
        return {
            en: b.en && typeof b.en === 'object' ? b.en : {},
            hi: b.hi && typeof b.hi === 'object' ? b.hi : {}
        };
    }

    // Bundle may load after this file (defer order). Start empty-safe; merge when ready.
    var TRANSLATIONS = fromBundle() || emptyDict();
    global.TRANSLATIONS = TRANSLATIONS;
    global.__GBI_I18N_REBIND__ = function () {
        var b = fromBundle();
        if (!b) return;
        TRANSLATIONS.en = Object.assign({}, TRANSLATIONS.en || {}, b.en || {});
        TRANSLATIONS.hi = Object.assign({}, TRANSLATIONS.hi || {}, b.hi || {});
    };

    function resolveDict(lang) {
        return (TRANSLATIONS && TRANSLATIONS[lang]) || {};
    }

    /**
     * t(key, params)
     * - Missing key → English → key itself
     * - {name} interpolation
     * - Plurals: if params.count is set, tries key.one / key.other (EN+HI one/other)
     */
    function t(key, vars) {
        if (!key) return '';
        var lang = (typeof global.currentLang === 'string' && global.currentLang) || 'en';
        var count = vars && Object.prototype.hasOwnProperty.call(vars, 'count') ? Number(vars.count) : NaN;
        var lookupKey = key;
        if (!isNaN(count)) {
            var plural = count === 1 ? '.one' : '.other';
            var pluralKey = key + plural;
            if (resolveDict(lang)[pluralKey] !== undefined || resolveDict('en')[pluralKey] !== undefined) {
                lookupKey = pluralKey;
            }
        }
        var val = resolveDict(lang)[lookupKey];
        if (val === undefined) val = resolveDict('en')[lookupKey];
        if (val === undefined) val = resolveDict(lang)[key];
        if (val === undefined) val = resolveDict('en')[key];
        if (val === undefined) return key;
        if (vars) {
            Object.keys(vars).forEach(function (k) {
                val = String(val).split('{' + k + '}').join(String(vars[k]));
            });
        }
        return val;
    }

    function setTextOrHtml(el, val) {
        // Prefer textContent; only legacy keys with markup (e.g. cta.title <br>) use HTML.
        if (typeof val === 'string' && /<[a-z][\s\S]*>/i.test(val)) {
            el.innerHTML = val;
        } else {
            el.textContent = val;
        }
    }

    function applyAttr(el, attrName, key) {
        var val = t(key);
        if (val === key && !(resolveDict('en')[key])) return;
        if (attrName === 'content' && el.tagName === 'META') {
            el.setAttribute('content', val);
            return;
        }
        if (attrName === 'placeholder') el.setAttribute('placeholder', val);
        else if (attrName === 'title') el.setAttribute('title', val);
        else if (attrName === 'aria-label') el.setAttribute('aria-label', val);
        else if (attrName === 'alt') el.setAttribute('alt', val);
        else if (attrName === 'value') el.setAttribute('value', val);
        else el.setAttribute(attrName, val);
    }

    /**
     * Translate [data-i18n] + data-i18n-placeholder|title|aria-label|alt|value|content
     */
    function applyTranslations(root) {
        var scope = root && root.querySelectorAll ? root : document;
        var nodes;
        try {
            nodes = scope.querySelectorAll(
                '[data-i18n],[data-i18n-placeholder],[data-i18n-title],[data-i18n-aria-label],[data-i18n-alt],[data-i18n-value],[data-i18n-content]'
            );
        } catch (_e) {
            nodes = scope.querySelectorAll('[data-i18n]');
        }
        nodes.forEach(function (el) {
            var key = el.getAttribute('data-i18n');
            if (key) {
                var val = t(key);
                if (val === key && resolveDict('en')[key] === undefined) {
                    /* missing — leave existing text */
                } else {
                    var tag = el.tagName.toUpperCase();
                    if ((tag === 'INPUT' || tag === 'TEXTAREA') && el.type !== 'submit' && el.type !== 'button') {
                        el.placeholder = val;
                    } else if (tag === 'OPTION') {
                        el.textContent = val;
                    } else if (tag === 'BUTTON' && el.type === 'submit') {
                        setTextOrHtml(el, val);
                    } else {
                        setTextOrHtml(el, val);
                    }
                }
            }
            var ph = el.getAttribute('data-i18n-placeholder');
            if (ph) applyAttr(el, 'placeholder', ph);
            var ti = el.getAttribute('data-i18n-title');
            if (ti) applyAttr(el, 'title', ti);
            var ar = el.getAttribute('data-i18n-aria-label');
            if (ar) applyAttr(el, 'aria-label', ar);
            var al = el.getAttribute('data-i18n-alt');
            if (al) applyAttr(el, 'alt', al);
            var va = el.getAttribute('data-i18n-value');
            if (va) applyAttr(el, 'value', va);
            var co = el.getAttribute('data-i18n-content');
            if (co) applyAttr(el, 'content', co);
        });
    }

    function mergeDict(lang, data) {
        if (!data || typeof data !== 'object') return;
        TRANSLATIONS[lang] = Object.assign({}, TRANSLATIONS[lang] || {}, data);
    }

    /** Optional background refresh from JSON (offline uses precache / bundle). */
    function refreshFromJson() {
        if (typeof fetch !== 'function') return Promise.resolve(TRANSLATIONS);
        var base = '';
        try {
            var scripts = document.getElementsByTagName('script');
            for (var i = 0; i < scripts.length; i++) {
                var s = scripts[i].getAttribute('src') || '';
                if (s.indexOf('i18n') !== -1) {
                    base = s.replace(/src\/js\/i18n[^/]*$/, '').replace(/\/?$/, '/');
                    break;
                }
            }
        } catch (_e) { /* ignore */ }
        var enUrl = (base || './') + 'i18n/en.json';
        var hiUrl = (base || './') + 'i18n/hi.json';
        return Promise.all([
            fetch(enUrl, { credentials: 'same-origin' }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }),
            fetch(hiUrl, { credentials: 'same-origin' }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; })
        ]).then(function (pair) {
            if (pair[0]) mergeDict('en', pair[0]);
            if (pair[1]) mergeDict('hi', pair[1]);
            return TRANSLATIONS;
        });
    }

    function runI18nDebug() {
        try {
            if (!/\bi18n-debug=1\b/.test(String(location.search || ''))) return;
            var enKeys = Object.keys(TRANSLATIONS.en || {});
            var hiKeys = Object.keys(TRANSLATIONS.hi || {});
            var enSet = new Set(enKeys);
            var hiSet = new Set(hiKeys);
            var missingHi = enKeys.filter(function (k) { return !hiSet.has(k); });
            var missingEn = hiKeys.filter(function (k) { return !enSet.has(k); });
            var used = new Set();
            document.querySelectorAll('[data-i18n],[data-i18n-placeholder],[data-i18n-title],[data-i18n-aria-label],[data-i18n-alt],[data-i18n-value],[data-i18n-content]').forEach(function (el) {
                ['data-i18n', 'data-i18n-placeholder', 'data-i18n-title', 'data-i18n-aria-label', 'data-i18n-alt', 'data-i18n-value', 'data-i18n-content'].forEach(function (a) {
                    var v = el.getAttribute(a);
                    if (v) used.add(v);
                });
            });
            var unused = enKeys.filter(function (k) { return !used.has(k); });
            var missingInDom = [];
            used.forEach(function (k) {
                if (!enSet.has(k)) missingInDom.push(k);
            });
            var latinLeft = [];
            if ((global.currentLang || '') === 'hi') {
                var allow = new RegExp('Gurukripa|GSTIN|WhatsApp|UPI|ISI|PIN|OTP|PDF|FAQ|GPS|API|COD|[0-9+\\-().\\s/]', 'g');
                document.querySelectorAll('h1,h2,h3,button,a,label,p,span,li').forEach(function (el) {
                    if (!el.offsetParent && el !== document.body) return;
                    var text = (el.childNodes.length === 1 && el.childNodes[0].nodeType === 3) ? (el.textContent || '').trim() : '';
                    if (text.length > 2 && /[A-Za-z]{3,}/.test(text.replace(allow, ''))) {
                        latinLeft.push(text.slice(0, 80));
                    }
                });
            }
            var report = {
                en: enKeys.length,
                hi: hiKeys.length,
                missingHi: missingHi,
                missingEn: missingEn,
                missingInDom: missingInDom,
                unusedCount: unused.length,
                latinSampleInHi: latinLeft.slice(0, 40)
            };
            console.info('[i18n-debug]', report);
            var banner = document.createElement('pre');
            banner.id = 'i18n-debug-banner';
            banner.setAttribute('role', 'status');
            banner.style.cssText = 'position:fixed;bottom:0;left:0;right:0;max-height:30vh;overflow:auto;z-index:99999;background:#1a1a1a;color:#9f9;font:12px/1.4 monospace;padding:8px;margin:0';
            banner.textContent = JSON.stringify(report, null, 2);
            document.body.appendChild(banner);
        } catch (err) {
            console.warn('[i18n-debug] failed', err);
        }
    }

    global.t = t;
    global.applyTranslations = applyTranslations;
    global.refreshI18nFromJson = refreshFromJson;
    global.runI18nDebug = runI18nDebug;

    // Soft-refresh from JSON when online (bundle already applied).
    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function () {
                refreshFromJson().then(function () { runI18nDebug(); }).catch(function () { runI18nDebug(); });
            });
        } else {
            refreshFromJson().then(function () { runI18nDebug(); }).catch(function () { runI18nDebug(); });
        }
    }
})(typeof window !== 'undefined' ? window : globalThis);

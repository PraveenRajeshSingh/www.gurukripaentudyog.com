// Google reCAPTCHA v3 client helper.
// Loads only when <meta name="recaptcha-site-key"> is set. Never embeds secrets.
(function (global) {
    'use strict';

    var META = 'recaptcha-site-key';
    var SCRIPT_ID = 'gb-recaptcha-v3';
    var readyPromise = null;

    function siteKey() {
        var el = document.querySelector('meta[name="' + META + '"]');
        return (el && el.content && String(el.content).trim()) || '';
    }

    function isEnabled() {
        return !!siteKey();
    }

    function loadScript() {
        if (readyPromise) return readyPromise;
        var key = siteKey();
        if (!key) {
            readyPromise = Promise.resolve(null);
            return readyPromise;
        }
        readyPromise = new Promise(function (resolve, reject) {
            if (global.grecaptcha && global.grecaptcha.execute) {
                resolve(global.grecaptcha);
                return;
            }
            var existing = document.getElementById(SCRIPT_ID);
            if (existing) {
                existing.addEventListener('load', function () { resolve(global.grecaptcha); });
                existing.addEventListener('error', reject);
                return;
            }
            var s = document.createElement('script');
            s.id = SCRIPT_ID;
            s.async = true;
            s.src = 'https://www.google.com/recaptcha/api.js?render=' + encodeURIComponent(key);
            s.onload = function () { resolve(global.grecaptcha); };
            s.onerror = function () { reject(new Error('reCAPTCHA script failed to load')); };
            document.head.appendChild(s);
        });
        return readyPromise;
    }

    /**
     * @param {string} action e.g. login | register | enquiry | contact | booking
     * @returns {Promise<string>} token or empty string when CAPTCHA is not configured
     */
    function getToken(action) {
        var key = siteKey();
        if (!key) return Promise.resolve('');
        return loadScript().then(function (grecaptcha) {
            if (!grecaptcha || !grecaptcha.execute) return '';
            return new Promise(function (resolve) {
                grecaptcha.ready(function () {
                    grecaptcha.execute(key, { action: action || 'submit' })
                        .then(function (token) { resolve(token || ''); })
                        .catch(function () { resolve(''); });
                });
            });
        }).catch(function () { return ''; });
    }

    global.GBRecaptcha = {
        isEnabled: isEnabled,
        siteKey: siteKey,
        loadScript: loadScript,
        getToken: getToken
    };
})(typeof window !== 'undefined' ? window : this);

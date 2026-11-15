// ══════════════════════════════════════════════════════════════════
// CROSS-PLATFORM ADAPTER: Web · Android · iOS
// Gurukripa Bricks Industry — Unified Native & Web Runtime Bridge
// ══════════════════════════════════════════════════════════════════

const Platform = (function () {
    'use strict';

    // 1. Detection
    function isNative() {
        return Boolean(window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform());
    }

    function getPlatform() {
        if (!isNative()) return 'web';
        return (window.Capacitor.getPlatform && window.Capacitor.getPlatform()) || 'native';
    }

    // 2. Hardware Back Button & Overlay Lifecycle (Android & Native)
    function registerBackButton() {
        const AppPlugin = window.Capacitor?.Plugins?.App;
        if (!AppPlugin) return;

        AppPlugin.addListener('backButton', ({ canGoBack }) => {
            // Check topmost active overlay
            if (typeof activeOverlay === 'function') {
                const openModal = activeOverlay();
                if (openModal) {
                    openModal[1]();
                    return;
                }
            }

            // Check checkout or product detail modals
            const checkoutModal = document.getElementById('checkoutModal');
            if (checkoutModal && checkoutModal.classList.contains('open')) {
                if (typeof closeCheckout === 'function') closeCheckout();
                return;
            }

            const productModal = document.getElementById('productModal');
            if (productModal && productModal.classList.contains('open')) {
                if (typeof closeProductModal === 'function') closeProductModal();
                return;
            }

            // If browser can navigate back, do so
            if (canGoBack && window.history.length > 1) {
                window.history.back();
            } else {
                // At root: let native app handle exit
                AppPlugin.exitApp?.();
            }
        });
    }

    // 3. Status Bar & Splash Screen Synchronization
    async function syncStatusBar(theme) {
        const StatusBar = window.Capacitor?.Plugins?.StatusBar;
        if (!StatusBar) return;

        try {
            const isDark = theme === 'dark' || (!theme && document.documentElement.getAttribute('data-theme') === 'dark');
            await StatusBar.setStyle({ style: isDark ? 'DARK' : 'LIGHT' });
            await StatusBar.setBackgroundColor({ color: isDark ? '#130B05' : '#A83226' });
        } catch (e) {
            console.debug('StatusBar sync notice:', e);
        }
    }

    async function hideSplashScreen() {
        const Splash = window.Capacitor?.Plugins?.SplashScreen;
        if (!Splash) return;
        try {
            await Splash.hide({ fadeOutDuration: 300 });
        } catch (e) {
            console.debug('Splash screen notice:', e);
        }
    }

    // 4. Native & Web Sharing
    async function share({ title, text, url }) {
        const shareData = {
            title: title || 'Gurukripa Bricks Industry',
            text: text || 'Premium Red Clay Bricks — Direct from Bhatta',
            url: url || window.location.href
        };

        const SharePlugin = window.Capacitor?.Plugins?.Share;
        if (SharePlugin && isNative()) {
            try {
                await SharePlugin.share(shareData);
                return true;
            } catch (e) {
                if (e.name !== 'AbortError') console.warn('Native share notice:', e);
            }
        }

        if (navigator.share) {
            try {
                await navigator.share(shareData);
                return true;
            } catch (e) {
                if (e.name !== 'AbortError') console.warn('Web share notice:', e);
            }
        }

        // Fallback: Copy link to clipboard
        try {
            await navigator.clipboard.writeText(shareData.url);
            if (typeof showToast === 'function') {
                showToast('📋 Link copied to clipboard!', 'success');
            }
            return true;
        } catch (e) {
            console.warn('Clipboard write notice:', e);
            return false;
        }
    }

    // 5. External Link Opening (Safe In-App Browser on Native)
    async function openExternal(url) {
        if (!url) return;
        const BrowserPlugin = window.Capacitor?.Plugins?.Browser;
        if (BrowserPlugin && isNative()) {
            try {
                await BrowserPlugin.open({ url, presentationStyle: 'popover' });
                return;
            } catch (e) {
                console.debug('Browser plugin notice:', e);
            }
        }
        window.open(url, '_blank', 'noopener,noreferrer');
    }

    // 6. Haptic Feedback (Physical Tap Feedback on Touch Devices)
    function haptic(type = 'light') {
        const Haptics = window.Capacitor?.Plugins?.Haptics;
        if (Haptics && isNative()) {
            try {
                if (type === 'success') Haptics.notification({ type: 'SUCCESS' });
                else if (type === 'warning') Haptics.notification({ type: 'WARNING' });
                else Haptics.impact({ style: 'LIGHT' });
                return;
            } catch (e) {
                console.debug('Haptics notice:', e);
            }
        }

        if ('vibrate' in navigator) {
            try {
                if (type === 'success') navigator.vibrate([20, 40, 20]);
                else if (type === 'warning') navigator.vibrate([40, 60]);
                else navigator.vibrate(12);
            } catch (e) {}
        }
    }

    // 7. Network Connectivity Observer
    function initNetworkObserver() {
        function updateStatus(online) {
            if (typeof showToast !== 'function') return;
            if (!online) {
                showToast('⚠️ No internet connection. Operating offline mode.', 'warning');
            } else {
                showToast('🟢 Back online!', 'success');
            }
        }
        window.addEventListener('online', () => updateStatus(true));
        window.addEventListener('offline', () => updateStatus(false));
    }

    // 8. Theme System (Light / Dark / System) — Phase 2 restore
    // Storage: gb_theme_mode = light|dark|system (versioned via key name)
    // Resolved appearance stored briefly as data-theme on <html>
    var _themeModeMem = 'system';
    var THEME_KEY = 'gb_theme_mode';

    function readThemeMode() {
        try {
            var m = localStorage.getItem(THEME_KEY);
            if (m === 'light' || m === 'dark' || m === 'system') return m;
            // Migrate legacy gb_theme
            var legacy = localStorage.getItem('gb_theme');
            if (legacy === 'light' || legacy === 'dark') return legacy;
        } catch (e) { /* storage blocked */ }
        return _themeModeMem || 'system';
    }

    function resolveTheme(mode) {
        if (mode === 'light' || mode === 'dark') return mode;
        try {
            return (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
        } catch (e) { return 'light'; }
    }

    function syncThemeColorMeta(resolved) {
        try {
            var metas = document.querySelectorAll('meta[name="theme-color"]');
            var color = resolved === 'dark' ? '#7F241C' : '#A83226';
            if (!metas.length) {
                var m = document.createElement('meta');
                m.name = 'theme-color';
                m.content = color;
                document.head.appendChild(m);
            } else {
                metas.forEach(function (m) { m.setAttribute('content', color); });
            }
            document.documentElement.style.colorScheme = resolved === 'dark' ? 'dark' : 'light';
        } catch (e) { /* ignore */ }
    }

    function setTheme(theme) {
        if (theme !== 'light' && theme !== 'dark' && theme !== 'system') theme = 'system';
        _themeModeMem = theme;
        try {
            localStorage.setItem(THEME_KEY, theme);
            if (theme === 'system') localStorage.removeItem('gb_theme');
            else localStorage.setItem('gb_theme', theme);
        } catch (e) { /* in-memory only */ }

        var reduce = false;
        try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e2) {}
        if (!reduce) document.documentElement.classList.add('theme-xfade');
        var resolved = resolveTheme(theme);
        document.documentElement.setAttribute('data-theme', resolved);
        document.documentElement.setAttribute('data-theme-mode', theme);
        syncThemeColorMeta(resolved);
        syncStatusBar(resolved);
        updateThemeToggleUI();
        if (!reduce) {
            setTimeout(function () {
                try { document.documentElement.classList.remove('theme-xfade'); } catch (e3) {}
            }, 220);
        }
    }

    function getThemeMode() { return readThemeMode(); }

    function toggleTheme() {
        var mode = readThemeMode();
        var next = mode === 'light' ? 'dark' : mode === 'dark' ? 'system' : 'light';
        setTheme(next);
        haptic('light');
        if (typeof showToast === 'function') {
            var label = next === 'dark' ? (typeof t === 'function' ? t('theme.dark') : 'Dark')
                : next === 'light' ? (typeof t === 'function' ? t('theme.light') : 'Light')
                : (typeof t === 'function' ? t('theme.system') : 'System');
            showToast(label, 'info');
        }
    }

    function updateThemeToggleUI() {
        var mode = readThemeMode();
        var resolved = document.documentElement.getAttribute('data-theme') || resolveTheme(mode);
        document.querySelectorAll('.theme-toggle-btn').forEach(function (btn) {
            var label = mode === 'system' ? 'System' : (resolved === 'dark' ? 'Dark' : 'Light');
            btn.setAttribute('aria-label', 'Theme: ' + label + '. Change theme');
            btn.setAttribute('title', 'Theme: ' + label);
            btn.setAttribute('data-theme-mode', mode);
            btn.setAttribute('aria-expanded', btn.getAttribute('aria-expanded') === 'true' ? 'true' : 'false');
        });
        document.querySelectorAll('[data-theme-option]').forEach(function (opt) {
            var on = opt.getAttribute('data-theme-option') === mode;
            opt.setAttribute('aria-checked', on ? 'true' : 'false');
            opt.classList.toggle('is-active', on);
        });
    }

    function bindThemeMenus() {
        document.addEventListener('click', function (e) {
            var opt = e.target && e.target.closest && e.target.closest('[data-theme-option]');
            if (opt) {
                e.preventDefault();
                setTheme(opt.getAttribute('data-theme-option'));
                document.querySelectorAll('.theme-toggle-menu').forEach(function (m) { m.classList.remove('is-open'); });
                document.querySelectorAll('.theme-toggle-btn').forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
                return;
            }
            var btn = e.target && e.target.closest && e.target.closest('.theme-toggle-btn');
            if (btn) {
                e.preventDefault();
                var menu = btn.parentElement && btn.parentElement.querySelector('.theme-toggle-menu');
                var open = menu && !menu.classList.contains('is-open');
                document.querySelectorAll('.theme-toggle-menu').forEach(function (m) { m.classList.remove('is-open'); });
                document.querySelectorAll('.theme-toggle-btn').forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
                if (menu && open) {
                    menu.classList.add('is-open');
                    btn.setAttribute('aria-expanded', 'true');
                }
                return;
            }
            if (!e.target.closest || !e.target.closest('.theme-toggle')) {
                document.querySelectorAll('.theme-toggle-menu').forEach(function (m) { m.classList.remove('is-open'); });
                document.querySelectorAll('.theme-toggle-btn').forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
            }
        });
        try {
            window.addEventListener('storage', function (ev) {
                if (ev.key === THEME_KEY || ev.key === 'gb_theme') {
                    setTheme(readThemeMode());
                }
                if (ev.key === 'gb_lang' && typeof setLang === 'function' && (ev.newValue === 'en' || ev.newValue === 'hi')) {
                    setLang(ev.newValue);
                }
            });
        } catch (e) { /* ignore */ }
        try {
            var mq = window.matchMedia('(prefers-color-scheme: dark)');
            var onChange = function () {
                if (readThemeMode() === 'system') setTheme('system');
            };
            if (mq.addEventListener) mq.addEventListener('change', onChange);
            else if (mq.addListener) mq.addListener(onChange);
        } catch (e2) { /* ignore */ }
    }

    // 9. Master Initialization
    function init() {
        const plat = getPlatform();
        document.documentElement.classList.add(`platform-${plat}`);
        if (isNative()) {
            document.documentElement.classList.add('is-native');
            registerBackButton();
            hideSplashScreen();
        }

        setTheme(readThemeMode());
        bindThemeMenus();
        initNetworkObserver();
    }

    return {
        init,
        isNative,
        getPlatform,
        share,
        openExternal,
        haptic,
        setTheme,
        getThemeMode,
        toggleTheme,
        syncStatusBar,
        updateThemeToggleUI
    };
})();
window.setTheme = function (m) { if (window.Platform) Platform.setTheme(m); };
window.toggleTheme = function () { if (window.Platform) Platform.toggleTheme(); };

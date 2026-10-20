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
            await StatusBar.setBackgroundColor({ color: isDark ? '#130B05' : '#C8460A' });
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

    // 8. Theme System (Light / Dark / System Toggle & Persistence)
    function setTheme(theme) {
        if (theme !== 'light' && theme !== 'dark' && theme !== 'system') theme = 'system';

        if (theme === 'system') {
            localStorage.removeItem('gb_theme');
            const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
            document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
        } else {
            localStorage.setItem('gb_theme', theme);
            document.documentElement.setAttribute('data-theme', theme);
        }

        // Sync status bar
        syncStatusBar(document.documentElement.getAttribute('data-theme'));
        updateThemeToggleUI();
    }

    function toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme') || 'light';
        const next = current === 'dark' ? 'light' : 'dark';
        setTheme(next);
        haptic('light');
        if (typeof showToast === 'function') {
            showToast(next === 'dark' ? '🌙 Dark Mode Enabled' : '☀️ Light Mode Enabled', 'info');
        }
    }

    function updateThemeToggleUI() {
        const current = document.documentElement.getAttribute('data-theme') || 'light';
        const isDark = current === 'dark';
        document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
            btn.innerHTML = isDark ? '☀️ <span class="theme-label">Light</span>' : '🌙 <span class="theme-label">Dark</span>';
            btn.setAttribute('aria-label', isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode');
            btn.setAttribute('title', isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode');
        });
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

        // Apply the single, consistent LIGHT theme. Dark mode was retired
        // product-wide; any stored legacy preference is ignored and cleared
        // so the UI never flips to an unavailable theme.
        try { localStorage.removeItem('gb_theme'); } catch (e) {}
        document.documentElement.setAttribute('data-theme', 'light');
        syncStatusBar('light');
        updateThemeToggleUI();

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
        toggleTheme,
        syncStatusBar
    };
})();

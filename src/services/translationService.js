/**
 * Gurukripa Bricks - Translation Service
 */
let currentLanguage = localStorage.getItem(STORAGE_KEYS.LANGUAGE) || 'en';

var TranslationService = {
    getLanguage: () => currentLanguage,
    setLanguage: (lang) => {
        const oldLang = currentLanguage;
        currentLanguage = lang;
        localStorage.setItem('SELECTED_LANGUAGE', lang); // Use a stable key
        document.documentElement.lang = lang;

        // Add/Remove body classes for CSS targeting
        document.body.classList.remove(`lang-${oldLang}`);
        document.body.classList.add(`lang-${lang}`);

        TranslationService.translatePage();
        TranslationService.updateToggle();

        // Re-render dynamic components if needed
        if (window.ProductService) window.ProductService.renderGrid();
        if (window.CartService) window.CartService.updateCartUI();
        if (window.AuthService && window.AuthService.isLoggedIn()) window.AuthService.renderDashboard();
    },
    translatePage: () => {
        const elements = document.querySelectorAll('[data-translate]');
        elements.forEach(element => {
            const key = element.getAttribute('data-translate');
            if (TRANSLATIONS[currentLanguage] && TRANSLATIONS[currentLanguage][key]) {
                const trans = TRANSLATIONS[currentLanguage][key];

                // Specific manual overrides for complex HTML tags if needed
                if (key === 'heroTitle') {
                    const highlight = currentLanguage === 'hi' ? 'गुरुकृपा' : 'Gurukripa';
                    const main = currentLanguage === 'hi' ? 'ईंट' : 'Bricks';
                    element.innerHTML = `<span class="color-changing-text">${highlight}</span> ${main}`;
                } else if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                    element.placeholder = trans;
                } else {
                    element.textContent = trans;
                }
            }
        });

        // Placeholders explicitly
        document.querySelectorAll('[data-placeholder]').forEach(el => {
            const key = el.getAttribute('data-placeholder');
            if (TRANSLATIONS[currentLanguage] && TRANSLATIONS[currentLanguage][key]) {
                el.placeholder = TRANSLATIONS[currentLanguage][key];
            }
        });
    },
    updateToggle: () => {
        const desktopToggle = document.getElementById('langToggle');
        if (desktopToggle) {
            desktopToggle.textContent = currentLanguage === 'hi' ? 'EN' : 'हिंदी';
        }

        // Update all language options (utility & drawer)
        document.querySelectorAll('.language-option, .drawer-lang-btn').forEach(el => {
            el.classList.toggle('active', el.getAttribute('data-lang') === currentLanguage);
        });
    },
    getLabel: (key) => {
        return (TRANSLATIONS[currentLanguage] && TRANSLATIONS[currentLanguage][key])
            ? TRANSLATIONS[currentLanguage][key]
            : key;
    },
    init: () => {
        // Load persisted language
        const saved = localStorage.getItem('SELECTED_LANGUAGE');
        if (saved && (saved === 'en' || saved === 'hi')) {
            currentLanguage = saved;
        }

        document.body.classList.add(`lang-${currentLanguage}`);
        TranslationService.translatePage();
        TranslationService.updateToggle();

        // Bind events
        document.querySelectorAll('.language-option, .drawer-lang-btn').forEach(el => {
            el.addEventListener('click', (e) => {
                e.preventDefault();
                const lang = el.getAttribute('data-lang');
                TranslationService.setLanguage(lang);
            });
        });

        window.setLanguage = TranslationService.setLanguage;
        window.getTranslation = TranslationService.getLabel;
    }
};

// Initialized by App.init


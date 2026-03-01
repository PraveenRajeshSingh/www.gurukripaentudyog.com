/**
 * Gurukripa Bricks - Translation Service
 */
let currentLanguage = localStorage.getItem(STORAGE_KEYS.LANGUAGE) || 'en';

var TranslationService = {
    getLanguage: () => currentLanguage,
    setLanguage: (lang) => {
        currentLanguage = lang;
        localStorage.setItem(STORAGE_KEYS.LANGUAGE, lang);
        document.documentElement.lang = lang;
        TranslationService.translatePage();
        TranslationService.updateToggle();
    },
    translatePage: () => {
        const elements = document.querySelectorAll('[data-translate]');
        elements.forEach(element => {
            const key = element.getAttribute('data-translate');
            if (TRANSLATIONS[currentLanguage] && TRANSLATIONS[currentLanguage][key]) {
                // Handling specific HTML tags inside translations
                if (key === 'heroTitle') {
                    const highlight = currentLanguage === 'hi' ? 'गुरुकृपा' : 'Gurukripa';
                    const main = currentLanguage === 'hi' ? 'ईंट' : 'Bricks';
                    element.innerHTML = `<span class="color-changing-text">${highlight}</span> ${main}`;
                } else {
                    element.textContent = TRANSLATIONS[currentLanguage][key];
                }
            }
        });

        // Placeholders
        const placeholders = document.querySelectorAll('[data-placeholder]');
        placeholders.forEach(el => {
            const key = el.getAttribute('data-placeholder');
            if (TRANSLATIONS[currentLanguage] && TRANSLATIONS[currentLanguage][key]) {
                el.placeholder = TRANSLATIONS[currentLanguage][key];
            }
        });
    },
    updateToggle: () => {
        const toggle = document.getElementById('langToggle');
        if (toggle) {
            toggle.textContent = currentLanguage === 'hi' ? 'EN' : 'हिंदी';
        }

        // Update utility switcher
        document.querySelectorAll('.language-option').forEach(el => {
            el.classList.toggle('active', el.getAttribute('data-lang') === currentLanguage);
        });
    },
    getLabel: (key) => {
        return TRANSLATIONS[currentLanguage] && TRANSLATIONS[currentLanguage][key]
            ? TRANSLATIONS[currentLanguage][key]
            : key;
    },
    init: () => {
        TranslationService.translatePage();
        TranslationService.updateToggle();

        // Bind events to language options
        document.querySelectorAll('.language-option').forEach(el => {
            el.addEventListener('click', () => {
                const lang = el.getAttribute('data-lang');
                TranslationService.setLanguage(lang);
            });
        });

        window.setLanguage = TranslationService.setLanguage;
        window.getTranslation = TranslationService.getLabel;
    }
};

// Initialized by App.init


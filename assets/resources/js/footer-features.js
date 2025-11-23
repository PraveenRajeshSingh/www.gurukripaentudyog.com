// ============================================
// FOOTER FEATURES
// ============================================

(function() {
    'use strict';

    // ============================================
    // FOOTER ANIMATION ON SCROLL
    // ============================================
    
    function initFooterAnimation() {
        const footer = document.querySelector('.footer');
        if (!footer) return;

        const observer = new IntersectionObserver(function(entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                }
            });
        }, { threshold: 0.1 });

        observer.observe(footer);
    }

    // ============================================
    // LANGUAGE SELECTOR
    // ============================================
    
    function initLanguageSelector() {
        const footer = document.querySelector('.footer');
        if (!footer) return;

        const languageDiv = document.createElement('div');
        languageDiv.className = 'footer-language';
        languageDiv.innerHTML = `
            <span>Language:</span>
            <div class="language-selector">
                <button class="language-btn active" onclick="switchLanguage('hi')">हिंदी</button>
                <button class="language-btn" onclick="switchLanguage('en')">English</button>
            </div>
        `;

        const footerBrand = footer.querySelector('.footer-brand');
        if (footerBrand) {
            footerBrand.appendChild(languageDiv);
        }

        window.switchLanguage = function(lang) {
            if (typeof setLanguage === 'function') {
                setLanguage(lang);
            } else {
                localStorage.setItem('language', lang);
                location.reload();
            }
            
            // Update active button
            document.querySelectorAll('.language-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            event.target.classList.add('active');
        };
    }

    // ============================================
    // COOKIE CONSENT POPUP
    // ============================================
    
    function initCookieConsent() {
        // Check if consent already given
        const consentGiven = localStorage.getItem('cookieConsent');
        if (consentGiven === 'true') return;

        const consent = document.createElement('div');
        consent.className = 'cookie-consent';
        consent.id = 'cookieConsent';
        consent.innerHTML = `
            <div class="cookie-content">
                <p>
                    We use cookies to enhance your browsing experience and analyze site traffic. 
                    By clicking "Accept", you consent to our use of cookies. 
                    <a href="#privacy">Learn more</a>
                </p>
            </div>
            <div class="cookie-actions">
                <button class="cookie-btn accept" onclick="acceptCookies()">Accept</button>
                <button class="cookie-btn decline" onclick="declineCookies()">Decline</button>
            </div>
        `;

        document.body.appendChild(consent);

        setTimeout(() => {
            consent.classList.add('active');
        }, 1000);

        window.acceptCookies = function() {
            localStorage.setItem('cookieConsent', 'true');
            consent.classList.remove('active');
            setTimeout(() => consent.remove(), 500);
        };

        window.declineCookies = function() {
            localStorage.setItem('cookieConsent', 'declined');
            consent.classList.remove('active');
            setTimeout(() => consent.remove(), 500);
        };
    }

    // ============================================
    // GDPR & PRIVACY COMPLIANCE
    // ============================================
    
    function initGDPRCompliance() {
        // Add privacy policy link
        const footer = document.querySelector('.footer');
        if (!footer) return;

        const privacyLinks = footer.querySelector('.footer-links ul');
        if (privacyLinks) {
            const privacyItem = document.createElement('li');
            privacyItem.innerHTML = '<a href="#privacy">Privacy Policy</a>';
            const termsItem = document.createElement('li');
            termsItem.innerHTML = '<a href="#terms">Terms of Service</a>';
            const gdprItem = document.createElement('li');
            gdprItem.innerHTML = '<a href="#gdpr">GDPR Compliance</a>';
            
            privacyLinks.appendChild(privacyItem);
            privacyLinks.appendChild(termsItem);
            privacyLinks.appendChild(gdprItem);
        }
    }

    // ============================================
    // INITIALIZE
    // ============================================
    
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                initFooterAnimation();
                initLanguageSelector();
                initCookieConsent();
                initGDPRCompliance();
            });
        } else {
            initFooterAnimation();
            initLanguageSelector();
            initCookieConsent();
            initGDPRCompliance();
        }
    }

    init();

})();


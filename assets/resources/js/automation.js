// ============================================
// AUTOMATION FEATURES
// ============================================

(function() {
    'use strict';

    // ============================================
    // AUTO-DETECT USER LOCATION
    // ============================================
    
    function detectUserLocation() {
        if (!navigator.geolocation) {
            console.log('Geolocation not supported');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            function(position) {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                
                // Store location
                localStorage.setItem('userLocation', JSON.stringify({ lat, lng }));
                
                // Find nearest branch
                findNearestBranch(lat, lng);
                
                // Show location-based content
                showLocationBasedContent(lat, lng);
            },
            function(error) {
                console.log('Location access denied or error:', error);
                // Fallback to IP-based location
                detectLocationByIP();
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    }

    function findNearestBranch(userLat, userLng) {
        // Branch locations (Jaunpur, Varanasi, Trilochan, Jalalpur)
        const branches = [
            { name: 'Jaunpur', lat: 25.7551, lng: 82.6837, distance: 0 },
            { name: 'Varanasi', lat: 25.3176, lng: 82.9739, distance: 0 },
            { name: 'Trilochan', lat: 25.6041, lng: 82.7914, distance: 0 },
            { name: 'Jalalpur', lat: 25.6041, lng: 82.7914, distance: 0 }
        ];

        branches.forEach(branch => {
            branch.distance = calculateDistance(userLat, userLng, branch.lat, branch.lng);
        });

        branches.sort((a, b) => a.distance - b.distance);
        const nearest = branches[0];

        // Show notification
        if (typeof showToast === 'function') {
            showToast('Location Detected', `Nearest branch: ${nearest.name} (${Math.round(nearest.distance)} km away)`, 'info', 5000);
        }

        // Highlight nearest branch in UI
        highlightNearestBranch(nearest.name);
    }

    function calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    function highlightNearestBranch(branchName) {
        const cityCards = document.querySelectorAll('.city-card');
        cityCards.forEach(card => {
            const cityName = card.querySelector('h3');
            if (cityName && cityName.textContent.includes(branchName)) {
                card.style.border = '3px solid var(--primary-color)';
                card.style.boxShadow = '0 10px 30px rgba(230, 126, 34, 0.4)';
                card.style.transform = 'scale(1.05)';
            }
        });
    }

    function detectLocationByIP() {
        // Fallback: Use IP-based location (requires API)
        fetch('https://ipapi.co/json/')
            .then(response => response.json())
            .then(data => {
                if (data.latitude && data.longitude) {
                    findNearestBranch(data.latitude, data.longitude);
                }
            })
            .catch(err => console.log('IP location detection failed:', err));
    }

    function showLocationBasedContent(lat, lng) {
        // Show location-specific offers or content
        const locationBanner = document.createElement('div');
        locationBanner.className = 'location-banner';
        locationBanner.innerHTML = `
            <div style="padding: 15px; background: var(--primary-color); color: white; text-align: center;">
                <i class="ion-ios-location"></i> 
                We deliver to your area! Same-day delivery available.
            </div>
        `;
        document.body.insertBefore(locationBanner, document.body.firstChild);
    }

    // ============================================
    // AUTO-SAVE FORM DATA
    // ============================================
    
    function initAutoSave() {
        const forms = document.querySelectorAll('form');
        
        forms.forEach(form => {
            const formId = form.id || 'form_' + Date.now();
            
            // Load saved data
            loadFormData(form, formId);
            
            // Save on input
            const inputs = form.querySelectorAll('input, textarea, select');
            inputs.forEach(input => {
                input.addEventListener('input', function() {
                    saveFormData(form, formId);
                });
                
                input.addEventListener('change', function() {
                    saveFormData(form, formId);
                });
            });
            
            // Clear on successful submit
            form.addEventListener('submit', function() {
                setTimeout(() => {
                    clearFormData(formId);
                }, 1000);
            });
        });
    }

    function saveFormData(form, formId) {
        const formData = {};
        const inputs = form.querySelectorAll('input, textarea, select');
        
        inputs.forEach(input => {
            if (input.type !== 'password' && input.type !== 'submit' && input.type !== 'button') {
                formData[input.name || input.id] = input.value;
            }
        });
        
        localStorage.setItem(`form_${formId}`, JSON.stringify(formData));
    }

    function loadFormData(form, formId) {
        const saved = localStorage.getItem(`form_${formId}`);
        if (!saved) return;
        
        try {
            const formData = JSON.parse(saved);
            Object.keys(formData).forEach(key => {
                const input = form.querySelector(`[name="${key}"], #${key}`);
                if (input && input.type !== 'password') {
                    input.value = formData[key];
                    // Trigger change event
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                }
            });
            
            if (typeof showToast === 'function') {
                showToast('Form Restored', 'Your previous form data has been restored', 'info', 3000);
            }
        } catch (e) {
            console.error('Error loading form data:', e);
        }
    }

    function clearFormData(formId) {
        localStorage.removeItem(`form_${formId}`);
    }

    // ============================================
    // AUTO THEME DETECTION
    // ============================================
    
    function initAutoTheme() {
        // Check if user has manually set theme
        const manualTheme = localStorage.getItem('theme');
        if (manualTheme) {
            return; // Don't override manual selection
        }

        // Detect system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
        
        function setThemeFromSystem(e) {
            const theme = e.matches ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', theme);
        }

        // Set initial theme
        setThemeFromSystem(prefersDark);
        
        // Listen for changes
        prefersDark.addEventListener('change', setThemeFromSystem);
    }

    // ============================================
    // AUTO-TRANSLATION SUPPORT
    // ============================================
    
    function initAutoTranslation() {
        // Detect browser language
        const browserLang = navigator.language || navigator.userLanguage;
        const langCode = browserLang.split('-')[0];
        
        // If language is different from current, suggest translation
        const currentLang = localStorage.getItem('language') || 'hi';
        
        if (langCode !== currentLang && (langCode === 'en' || langCode === 'hi')) {
            // Show translation suggestion
            setTimeout(() => {
                if (typeof showToast === 'function') {
                    showToast(
                        'Language Detected',
                        `We detected your language preference. Switch to ${langCode === 'en' ? 'English' : 'Hindi'}?`,
                        'info',
                        8000
                    );
                }
            }, 2000);
        }
    }

    // ============================================
    // AUTO-GENERATED SEO TAGS
    // ============================================
    
    function updateSEOTags() {
        // Update meta description based on current section
        const sections = {
            '#home': {
                title: 'Gurukripa Bricks - Best Brick Manufacturer in Jaunpur | Varanasi',
                description: 'गुरुकृपा ईंट उद्योग - जौनपुर में सर्वश्रेष्ठ ईंट निर्माता। 25+ वर्षों का अनुभव। Premium quality bricks with same-day delivery.'
            },
            '#products': {
                title: 'Premium Quality Bricks - Gurukripa Bricks Products',
                description: 'Browse our wide range of premium quality bricks. Machine-made, uniform size, superior strength. Perfect for all construction needs.'
            },
            '#blog': {
                title: 'Construction Tips & Brick Information - Gurukripa Blog',
                description: 'Latest news, tips, and information about bricks and construction. Expert advice from 25+ years of experience.'
            }
        };

        // Update on hash change
        window.addEventListener('hashchange', function() {
            const hash = window.location.hash || '#home';
            const seo = sections[hash];
            
            if (seo) {
                document.title = seo.title;
                const metaDesc = document.querySelector('meta[name="description"]');
                if (metaDesc) {
                    metaDesc.content = seo.description;
                }
            }
        });
    }

    // ============================================
    // INITIALIZE ALL AUTOMATION
    // ============================================
    
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                initAutoSave();
                initAutoTheme();
                initAutoTranslation();
                updateSEOTags();
                
                // Ask for location permission after a delay
                setTimeout(() => {
                    if (confirm('Allow location access to find nearest branch?')) {
                        detectUserLocation();
                    }
                }, 3000);
            });
        } else {
            initAutoSave();
            initAutoTheme();
            initAutoTranslation();
            updateSEOTags();
        }
    }

    init();

    // Export functions
    window.detectUserLocation = detectUserLocation;
    window.initAutoSave = initAutoSave;

})();


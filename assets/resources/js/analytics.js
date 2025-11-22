// Advanced Analytics Integration
(function() {
    'use strict';
    
    // Track page views
    function trackPageView() {
        if (typeof gtag !== 'undefined') {
            gtag('config', 'G-Q6YZRXHSBG', {
                'page_path': window.location.pathname + window.location.search + window.location.hash,
                'page_title': document.title
            });
        }
    }
    
    // Track section views
    function trackSectionView(sectionName) {
        if (typeof gtag !== 'undefined') {
            gtag('event', 'section_view', {
                'section_name': sectionName,
                'page_location': window.location.href
            });
        }
    }
    
    // Track button clicks
    function trackButtonClick(buttonName, buttonLocation) {
        if (typeof gtag !== 'undefined') {
            gtag('event', 'button_click', {
                'button_name': buttonName,
                'button_location': buttonLocation,
                'page_location': window.location.href
            });
        }
    }
    
    // Track form submissions
    function trackFormSubmission(formName) {
        if (typeof gtag !== 'undefined') {
            gtag('event', 'form_submit', {
                'form_name': formName,
                'page_location': window.location.href
            });
        }
    }
    
    // Track search queries
    function trackSearch(query) {
        if (typeof gtag !== 'undefined') {
            gtag('event', 'search', {
                'search_term': query,
                'page_location': window.location.href
            });
        }
    }
    
    // Track video plays (if any)
    function trackVideoPlay(videoName) {
        if (typeof gtag !== 'undefined') {
            gtag('event', 'video_play', {
                'video_name': videoName,
                'page_location': window.location.href
            });
        }
    }
    
    // Track file downloads
    function trackDownload(fileName) {
        if (typeof gtag !== 'undefined') {
            gtag('event', 'file_download', {
                'file_name': fileName,
                'page_location': window.location.href
            });
        }
    }
    
    // Track language changes
    function trackLanguageChange(language) {
        if (typeof gtag !== 'undefined') {
            gtag('event', 'language_change', {
                'language': language,
                'page_location': window.location.href
            });
        }
    }
    
    // Track scroll depth
    let maxScroll = 0;
    function trackScrollDepth() {
        const scrollPercent = Math.round((window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100);
        
        if (scrollPercent > maxScroll) {
            maxScroll = scrollPercent;
            
            // Track at 25%, 50%, 75%, 100%
            if (scrollPercent >= 25 && maxScroll < 50) {
                trackEvent('scroll', { 'scroll_depth': 25 });
            } else if (scrollPercent >= 50 && maxScroll < 75) {
                trackEvent('scroll', { 'scroll_depth': 50 });
            } else if (scrollPercent >= 75 && maxScroll < 100) {
                trackEvent('scroll', { 'scroll_depth': 75 });
            } else if (scrollPercent >= 100) {
                trackEvent('scroll', { 'scroll_depth': 100 });
            }
        }
    }
    
    // Track time on page
    let startTime = Date.now();
    function trackTimeOnPage() {
        const timeSpent = Math.round((Date.now() - startTime) / 1000); // in seconds
        
        // Track at 30 seconds, 1 minute, 2 minutes, 5 minutes
        if (timeSpent === 30 || timeSpent === 60 || timeSpent === 120 || timeSpent === 300) {
            trackEvent('time_on_page', {
                'time_spent': timeSpent,
                'time_unit': 'seconds'
            });
        }
    }
    
    // Generic event tracking
    function trackEvent(eventName, eventParams) {
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, {
                ...eventParams,
                'page_location': window.location.href,
                'page_title': document.title
            });
        }
    }
    
    // Track user engagement
    function trackEngagement(action, details) {
        if (typeof gtag !== 'undefined') {
            gtag('event', 'user_engagement', {
                'engagement_action': action,
                'engagement_details': details,
                'page_location': window.location.href
            });
        }
    }
    
    // Initialize analytics tracking
    function initAnalytics() {
        // Track initial page view
        trackPageView();
        
        // Track section views on scroll
        const sections = document.querySelectorAll('section[id]');
        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.5
        };
        
        const sectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    trackSectionView(entry.target.id);
                }
            });
        }, observerOptions);
        
        sections.forEach(section => {
            sectionObserver.observe(section);
        });
        
        // Track button clicks
        document.addEventListener('click', function(e) {
            const button = e.target.closest('button, .btn, a.btn');
            if (button) {
                const buttonText = button.textContent.trim() || button.getAttribute('aria-label') || 'Unknown';
                trackButtonClick(buttonText, button.closest('section')?.id || 'unknown');
            }
        });
        
        // Track form submissions
        document.addEventListener('submit', function(e) {
            const form = e.target;
            if (form.tagName === 'FORM') {
                const formName = form.id || form.className || 'unknown';
                trackFormSubmission(formName);
            }
        });
        
        // Track scroll depth
        window.addEventListener('scroll', trackScrollDepth);
        
        // Track time on page
        setInterval(trackTimeOnPage, 1000);
        
        // Track language changes
        const originalSetLanguage = window.setLanguage;
        if (originalSetLanguage) {
            window.setLanguage = function(lang) {
                trackLanguageChange(lang);
                originalSetLanguage(lang);
            };
        }
        
        // Track external link clicks
        document.addEventListener('click', function(e) {
            const link = e.target.closest('a[href^="http"]');
            if (link && !link.href.includes(window.location.hostname)) {
                trackEvent('external_link_click', {
                    'link_url': link.href,
                    'link_text': link.textContent.trim()
                });
            }
        });
        
        // Track phone number clicks
        document.addEventListener('click', function(e) {
            const link = e.target.closest('a[href^="tel:"]');
            if (link) {
                trackEvent('phone_click', {
                    'phone_number': link.href.replace('tel:', '')
                });
            }
        });
        
        // Track email clicks
        document.addEventListener('click', function(e) {
            const link = e.target.closest('a[href^="mailto:"]');
            if (link) {
                trackEvent('email_click', {
                    'email_address': link.href.replace('mailto:', '')
                });
            }
        });
        
        // Track WhatsApp clicks
        document.addEventListener('click', function(e) {
            const link = e.target.closest('a[href*="wa.me"], a[href*="whatsapp"]');
            if (link) {
                trackEvent('whatsapp_click', {
                    'link_url': link.href
                });
            }
        });
        
        // Track chatbot interactions
        const chatbotToggle = document.getElementById('chatbotToggle');
        if (chatbotToggle) {
            chatbotToggle.addEventListener('click', function() {
                trackEvent('chatbot_open', {});
            });
        }
        
        const chatbotSend = document.getElementById('chatbotSend');
        if (chatbotSend) {
            chatbotSend.addEventListener('click', function() {
                trackEvent('chatbot_message_sent', {});
            });
        }
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAnalytics);
    } else {
        initAnalytics();
    }
    
    // Export functions to global scope
    window.trackPageView = trackPageView;
    window.trackSectionView = trackSectionView;
    window.trackButtonClick = trackButtonClick;
    window.trackFormSubmission = trackFormSubmission;
    window.trackSearch = trackSearch;
    window.trackVideoPlay = trackVideoPlay;
    window.trackDownload = trackDownload;
    window.trackLanguageChange = trackLanguageChange;
    window.trackEvent = trackEvent;
    window.trackEngagement = trackEngagement;
    
})();


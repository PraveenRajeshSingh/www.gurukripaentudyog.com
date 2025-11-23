// ============================================
// SECURITY FEATURES
// ============================================

(function() {
    'use strict';

    // ============================================
    // CAPTCHA (Simple Implementation)
    // ============================================
    
    function generateCaptcha() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let captcha = '';
        for (let i = 0; i < 5; i++) {
            captcha += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return captcha;
    }

    function initCaptcha() {
        const forms = document.querySelectorAll('form[id*="register"], form[id*="login"], form[id*="checkout"]');
        
        forms.forEach(form => {
            const captchaContainer = document.createElement('div');
            captchaContainer.className = 'captcha-container';
            captchaContainer.innerHTML = `
                <div class="captcha-display">
                    <span id="captchaText" style="font-size: 24px; font-weight: bold; letter-spacing: 5px; color: var(--primary-color);">${generateCaptcha()}</span>
                    <button type="button" class="captcha-refresh" onclick="refreshCaptcha(this)" aria-label="Refresh captcha">
                        <i class="ion-ios-refresh"></i>
                    </button>
                </div>
                <input type="text" name="captcha" id="captchaInput" placeholder="Enter captcha" required style="margin-top: 10px; width: 100%; padding: 10px; border: 2px solid var(--border-color); border-radius: 8px;">
                <span class="error-message" id="captchaError" style="display: none;"></span>
            `;

            const submitButton = form.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.parentElement.insertBefore(captchaContainer, submitButton);
            }

            // Validate on submit
            form.addEventListener('submit', function(e) {
                const captchaText = captchaContainer.querySelector('#captchaText').textContent;
                const captchaInput = captchaContainer.querySelector('#captchaInput').value.toUpperCase();
                const errorMsg = captchaContainer.querySelector('#captchaError');

                if (captchaInput !== captchaText) {
                    e.preventDefault();
                    errorMsg.textContent = 'Captcha does not match';
                    errorMsg.style.display = 'block';
                    captchaInput.value = '';
                    refreshCaptcha(captchaContainer.querySelector('.captcha-refresh'));
                    return false;
                } else {
                    errorMsg.style.display = 'none';
                }
            });
        });
    }

    window.refreshCaptcha = function(button) {
        const container = button.closest('.captcha-container');
        const captchaText = container.querySelector('#captchaText');
        captchaText.textContent = generateCaptcha();
        container.querySelector('#captchaInput').value = '';
    };

    // ============================================
    // SESSION MANAGEMENT
    // ============================================
    
    function initSessionManagement() {
        const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
        let lastActivity = Date.now();

        // Update last activity on user interaction
        ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
            document.addEventListener(event, function() {
                lastActivity = Date.now();
                localStorage.setItem('lastActivity', lastActivity.toString());
            }, { passive: true });
        });

        // Check session timeout
        setInterval(function() {
            const timeSinceActivity = Date.now() - lastActivity;
            
            if (timeSinceActivity > SESSION_TIMEOUT) {
                // Session expired
                if (confirm('Your session has expired. Do you want to continue?')) {
                    lastActivity = Date.now();
                    localStorage.setItem('lastActivity', lastActivity.toString());
                } else {
                    // Clear session data
                    localStorage.removeItem('userSession');
                    if (typeof showToast === 'function') {
                        showToast('Session Expired', 'Please login again', 'warning');
                    }
                }
            }
        }, 60000); // Check every minute

        // Load last activity
        const savedActivity = localStorage.getItem('lastActivity');
        if (savedActivity) {
            lastActivity = parseInt(savedActivity);
        }
    }

    // ============================================
    // INPUT SANITIZATION
    // ============================================
    
    function sanitizeInput(input) {
        if (typeof input !== 'string') return input;
        
        // Remove potentially dangerous characters
        return input
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<[^>]+>/g, '')
            .trim();
    }

    function initInputSanitization() {
        const inputs = document.querySelectorAll('input[type="text"], input[type="email"], textarea');
        
        inputs.forEach(input => {
            input.addEventListener('blur', function() {
                const originalValue = this.value;
                const sanitized = sanitizeInput(originalValue);
                
                if (originalValue !== sanitized) {
                    this.value = sanitized;
                    if (typeof showToast === 'function') {
                        showToast('Input Cleaned', 'Potentially unsafe characters removed', 'info', 3000);
                    }
                }
            });
        });
    }

    // ============================================
    // RATE LIMITING (Client-side)
    // ============================================
    
    function checkRateLimit(action, maxAttempts = 5, timeWindow = 60000) {
        const key = `rateLimit_${action}`;
        const attempts = JSON.parse(localStorage.getItem(key) || '[]');
        const now = Date.now();
        
        // Remove old attempts
        const recentAttempts = attempts.filter(time => now - time < timeWindow);
        
        if (recentAttempts.length >= maxAttempts) {
            return false; // Rate limit exceeded
        }
        
        // Add current attempt
        recentAttempts.push(now);
        localStorage.setItem(key, JSON.stringify(recentAttempts));
        
        return true;
    }

    function initRateLimiting() {
        const forms = document.querySelectorAll('form');
        
        forms.forEach(form => {
            form.addEventListener('submit', function(e) {
                if (!checkRateLimit('form_submit', 5, 60000)) {
                    e.preventDefault();
                    if (typeof showToast === 'function') {
                        showToast('Rate Limit', 'Too many submissions. Please wait a moment.', 'error');
                    }
                    return false;
                }
            });
        });
    }

    // ============================================
    // INITIALIZE ALL SECURITY FEATURES
    // ============================================
    
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                initCaptcha();
                initSessionManagement();
                initInputSanitization();
                initRateLimiting();
            });
        } else {
            initCaptcha();
            initSessionManagement();
            initInputSanitization();
            initRateLimiting();
        }
    }

    init();

    // Export functions
    window.sanitizeInput = sanitizeInput;
    window.checkRateLimit = checkRateLimit;

})();


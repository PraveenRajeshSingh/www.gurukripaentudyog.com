// ============================================
// COMPREHENSIVE FUNCTIONALITY ENHANCEMENTS
// ============================================

(function() {
    'use strict';

    // ============================================
    // DARK MODE TOGGLE
    // ============================================
    
    function initDarkMode() {
        const themeToggle = document.createElement('button');
        themeToggle.className = 'theme-toggle';
        themeToggle.setAttribute('aria-label', 'Toggle dark mode');
        themeToggle.innerHTML = '<i class="ion-ios-moon"></i>';
        themeToggle.id = 'themeToggle';
        document.body.appendChild(themeToggle);

        // Get saved theme or default to light
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        updateThemeIcon(savedTheme);

        themeToggle.addEventListener('click', function() {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateThemeIcon(newTheme);
            showToast('Theme changed', `Switched to ${newTheme} mode`, 'success');
        });

        function updateThemeIcon(theme) {
            const icon = themeToggle.querySelector('i');
            if (icon) {
                icon.className = theme === 'dark' ? 'ion-ios-sunny' : 'ion-ios-moon';
            }
        }
    }

    // ============================================
    // TOAST NOTIFICATIONS
    // ============================================
    
    function createToastContainer() {
        if (!document.querySelector('.toast-container')) {
            const container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
    }

    function showToast(title, message, type = 'info', duration = 5000) {
        createToastContainer();
        const container = document.querySelector('.toast-container');
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: 'ion-ios-checkmark-circle',
            error: 'ion-ios-close-circle',
            warning: 'ion-ios-warning',
            info: 'ion-ios-information-circle'
        };
        
        toast.innerHTML = `
            <i class="${icons[type] || icons.info} toast-icon"></i>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" aria-label="Close notification">
                <i class="ion-ios-close"></i>
            </button>
        `;
        
        container.appendChild(toast);
        
        const closeBtn = toast.querySelector('.toast-close');
        const closeToast = () => {
            toast.classList.add('hiding');
            setTimeout(() => toast.remove(), 300);
        };
        
        closeBtn.addEventListener('click', closeToast);
        
        if (duration > 0) {
            setTimeout(closeToast, duration);
        }
        
        return toast;
    }

    // Make toast function globally available
    window.showToast = showToast;

    // ============================================
    // FORM VALIDATION
    // ============================================
    
    function validateForm(form) {
        let isValid = true;
        const inputs = form.querySelectorAll('input[required], textarea[required], select[required]');
        
        inputs.forEach(input => {
            const value = input.value.trim();
            const type = input.type;
            const name = input.name;
            
            // Remove previous error states
            input.classList.remove('error', 'success');
            const existingError = input.parentElement.querySelector('.error-message');
            if (existingError) {
                existingError.remove();
            }
            
            // Validate required fields
            if (!value) {
                showFieldError(input, 'This field is required');
                isValid = false;
                return;
            }
            
            // Email validation
            if (type === 'email' && value) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                    showFieldError(input, 'Please enter a valid email address');
                    isValid = false;
                    return;
                }
            }
            
            // Phone validation
            if (type === 'tel' && value) {
                const phoneRegex = /^[0-9]{10}$/;
                if (!phoneRegex.test(value.replace(/\D/g, ''))) {
                    showFieldError(input, 'Please enter a valid 10-digit phone number');
                    isValid = false;
                    return;
                }
            }
            
            // Password validation
            if (type === 'password' && name === 'password' && value.length < 6) {
                showFieldError(input, 'Password must be at least 6 characters');
                isValid = false;
                return;
            }
            
            // Confirm password
            if (name === 'confirmPassword') {
                const password = form.querySelector('input[name="password"]');
                if (password && value !== password.value) {
                    showFieldError(input, 'Passwords do not match');
                    isValid = false;
                    return;
                }
            }
            
            // Pincode validation
            if (name === 'pincode') {
                const pincodeRegex = /^[0-9]{6}$/;
                if (!pincodeRegex.test(value)) {
                    showFieldError(input, 'Please enter a valid 6-digit pincode');
                    isValid = false;
                    return;
                }
            }
            
            // If valid, show success
            input.classList.add('success');
        });
        
        return isValid;
    }
    
    function showFieldError(input, message) {
        input.classList.add('error');
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `<i class="ion-ios-close-circle"></i> ${message}`;
        input.parentElement.appendChild(errorDiv);
    }
    
    // Add real-time validation
    function initFormValidation() {
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            const inputs = form.querySelectorAll('input, textarea, select');
            
            inputs.forEach(input => {
                // Validate on blur
                input.addEventListener('blur', function() {
                    if (input.hasAttribute('required') || input.value.trim()) {
                        const formGroup = input.closest('.form-group') || input.parentElement;
                        const tempForm = document.createElement('form');
                        tempForm.appendChild(formGroup.cloneNode(true));
                        validateForm(tempForm);
                    }
                });
                
                // Clear error on input
                input.addEventListener('input', function() {
                    if (input.classList.contains('error')) {
                        input.classList.remove('error');
                        const errorMsg = input.parentElement.querySelector('.error-message');
                        if (errorMsg) {
                            errorMsg.remove();
                        }
                    }
                });
            });
            
            // Validate on submit
            form.addEventListener('submit', function(e) {
                if (!validateForm(form)) {
                    e.preventDefault();
                    showToast('Validation Error', 'Please correct the errors in the form', 'error');
                    const firstError = form.querySelector('.error');
                    if (firstError) {
                        firstError.focus();
                        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }
            });
        });
    }

    // ============================================
    // LOADING INDICATORS
    // ============================================
    
    function showLoading(message = 'Loading...') {
        const overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        overlay.id = 'loadingOverlay';
        overlay.innerHTML = `
            <div style="text-align: center;">
                <div class="spinner" style="margin: 0 auto 20px;"></div>
                <p style="color: var(--text-dark); font-weight: 600;">${message}</p>
            </div>
        `;
        document.body.appendChild(overlay);
        return overlay;
    }
    
    function hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.opacity = '0';
            setTimeout(() => overlay.remove(), 300);
        }
    }
    
    window.showLoading = showLoading;
    window.hideLoading = hideLoading;

    // ============================================
    // SKELETON LOADING
    // ============================================
    
    function createSkeleton(type = 'card', count = 1) {
        const skeletons = [];
        for (let i = 0; i < count; i++) {
            const skeleton = document.createElement('div');
            skeleton.className = `skeleton skeleton-${type}`;
            
            if (type === 'card') {
                skeleton.innerHTML = `
                    <div class="skeleton skeleton-image"></div>
                    <div class="skeleton skeleton-title"></div>
                    <div class="skeleton skeleton-text"></div>
                    <div class="skeleton skeleton-text" style="width: 80%;"></div>
                `;
            } else if (type === 'text') {
                skeleton.className = 'skeleton skeleton-text';
            }
            
            skeletons.push(skeleton);
        }
        return skeletons;
    }
    
    window.createSkeleton = createSkeleton;

    // ============================================
    // KEYBOARD NAVIGATION
    // ============================================
    
    function initKeyboardNavigation() {
        // Skip to main content
        const skipLink = document.createElement('a');
        skipLink.href = '#home';
        skipLink.className = 'skip-link';
        skipLink.textContent = 'Skip to main content';
        document.body.insertBefore(skipLink, document.body.firstChild);
        
        // Keyboard shortcuts
        document.addEventListener('keydown', function(e) {
            // Escape to close modals
            if (e.key === 'Escape') {
                const modals = document.querySelectorAll('.modal[style*="display: flex"], .modal[style*="display:block"]');
                modals.forEach(modal => {
                    if (typeof closeModal === 'function') {
                        closeModal();
                    } else {
                        modal.style.display = 'none';
                    }
                });
            }
            
            // Ctrl/Cmd + K to focus search (if exists)
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                const searchInput = document.querySelector('input[type="search"], input[placeholder*="search" i]');
                if (searchInput) {
                    searchInput.focus();
                }
            }
        });
    }

    // ============================================
    // INITIALIZE ALL ENHANCEMENTS
    // ============================================
    
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                initDarkMode();
                initFormValidation();
                initKeyboardNavigation();
            });
        } else {
            initDarkMode();
            initFormValidation();
            initKeyboardNavigation();
        }
    }
    
    init();
    
})();


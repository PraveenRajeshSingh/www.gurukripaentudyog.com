/**
 * Gurukripa Bricks - UI Utilities
 * Handles global notifications, toasts, and DOM interactions.
 */

/**
 * Displays a professional toast notification.
 * @param {string} message - Message to display.
 * @param {number} duration - Time in ms before disappearance.
 */
function showToast(message, duration = 4000) {
    let toast = document.getElementById('globalToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'globalToast';
        toast.className = 'global-toast';
        document.body.appendChild(toast);
    }

    const isSuccess = /✅|success|🎉|successful/i.test(message);
    const isWarning = /⚠️|Coming Soon|Demo/i.test(message);
    const isError = /error|failed|wrong/i.test(message);

    toast.className = 'global-toast active';
    if (isSuccess) toast.classList.add('toast-success');
    if (isWarning) toast.classList.add('toast-warning');
    if (isError) toast.classList.add('toast-error');

    toast.innerHTML = `<div class="toast-content">${message}</div>`;

    if (window._toastTimeout) clearTimeout(window._toastTimeout);
    window._toastTimeout = setTimeout(() => {
        toast.classList.remove('active');
        // Clear classes after transition
        setTimeout(() => {
            toast.className = 'global-toast';
        }, 300);
    }, duration);
}

// Alias for backward compatibility during refactor
var showUserFriendlyError = showToast;

/**
 * Handles modal visibility.
 */
var Modals = {
    open(id) {
        const modal = document.getElementById(id);
        if (modal) {
            modal.classList.add('active');
            document.body.classList.add('modal-open');

            // Hide FAB and Scroll-Top button when modal is open
            const fab = document.getElementById('supportFab');
            const scrollTop = document.getElementById('scrollTopBtn');
            if (fab) fab.style.display = 'none';
            if (scrollTop) scrollTop.style.display = 'none';

            // Focus first input
            setTimeout(() => {
                const firstInput = modal.querySelector('input');
                if (firstInput) firstInput.focus();
            }, 100);
        }
    },
    close(id) {
        const modal = document.getElementById(id);
        if (modal) {
            modal.classList.remove('active');

            // Re-show FAB and Scroll-Top button if no modals are left open
            const anyOpen = Array.from(document.querySelectorAll('.modal, [id$="Modal"]')).some(m => m.classList.contains('active'));
            if (!anyOpen) {
                document.body.classList.remove('modal-open');
                const fab = document.getElementById('supportFab');
                const scrollTop = document.getElementById('scrollTopBtn');
                if (fab) fab.style.display = 'flex';
                // Note: scrollTop visibility is usually handled by scroll listeners, but we reset display
                if (scrollTop) scrollTop.style.display = 'flex';
            }
        }
    },
    closeAll() {
        const modals = document.querySelectorAll('.modal, [id$="Modal"]');
        modals.forEach(m => m.classList.remove('active'));
        document.body.classList.remove('modal-open');
    }
};

/**
 * Safe execution wrapper.
 */
function safeExecute(fn, fallback = null, errorMessage = 'Something went wrong') {
    try {
        return fn();
    } catch (error) {
        console.error('[Error Handler]', error);
        showToast(`❌ ${errorMessage}`, 5000);
        return fallback;
    }
}


/**
 * Form Validation Utilities
 */
const Validation = {
    showError(input, message) {
        const group = input.closest('.form-group') || input.closest('.auth-input-group');
        if (!group) return;

        group.classList.add('has-error');
        group.classList.remove('has-success');

        let errorSpan = group.querySelector('.error-message') || group.querySelector('.auth-error');
        if (!errorSpan) {
            errorSpan = document.createElement('span');
            errorSpan.className = 'error-message';
            errorSpan.role = 'alert';
            errorSpan.ariaLive = 'polite';
            group.appendChild(errorSpan);
        }
        errorSpan.textContent = message;
        errorSpan.classList.add('visible');
    },

    showSuccess(input) {
        const group = input.closest('.form-group') || input.closest('.auth-input-group');
        if (!group) return;

        group.classList.remove('has-error');
        group.classList.add('has-success');

        const errorSpan = group.querySelector('.error-message') || group.querySelector('.auth-error');
        if (errorSpan) {
            errorSpan.textContent = '';
            errorSpan.classList.remove('visible');
        }
    },

    clear(input) {
        const group = input.closest('.form-group') || input.closest('.auth-input-group');
        if (!group) return;
        group.classList.remove('has-error');
        group.classList.remove('has-success');
        const errorSpan = group.querySelector('.error-message') || group.querySelector('.auth-error');
        if (errorSpan) {
            errorSpan.textContent = '';
            errorSpan.classList.remove('visible');
        }
    },

    isEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },

    isPhone(phone) {
        return /^[0-9]{10}$/.test(phone);
    }
};

window.Validation = Validation;

/**
 * Error Boundary & Fallback Utilities
 */
const ErrorBoundary = {
    // Handle section load failures
    handleSectionError: (sectionId, error) => {
        console.error(`[Error Boundary] Section ${sectionId} failed:`, error);
        
        const section = document.getElementById(sectionId);
        if (section) {
            section.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">⚠️</div>
                    <h3 class="empty-state-title">Something went wrong</h3>
                    <p class="empty-state-description">We're having trouble loading this section. Please try refreshing the page.</p>
                    <button class="btn-primary-modern" onclick="window.location.reload()">Refresh Page</button>
                </div>
            `;
        }
    },
    
    // Handle image load failures
    handleImageError: (img) => {
        if (!img) return;
        
        const fallbackSrc = img.dataset.fallback || 'src/assets/images/fallback.jpg';
        
        if (img.src !== fallbackSrc) {
            img.src = fallbackSrc;
        } else {
            img.style.display = 'none';
            const placeholder = document.createElement('div');
            placeholder.className = 'image-placeholder';
            placeholder.style.height = img.style.height || '200px';
            img.parentNode.insertBefore(placeholder, img);
        }
    },
    
    // Safe function execution with fallback
    safeExecute: async (fn, fallback = null, errorMessage = 'Something went wrong') => {
        try {
            return await fn();
        } catch (error) {
            console.error('[Error Boundary]', error);
            showToast(`❌ ${errorMessage}`, 5000);
            return typeof fallback === 'function' ? fallback(error) : fallback;
        }
    }
};

window.ErrorBoundary = ErrorBoundary;

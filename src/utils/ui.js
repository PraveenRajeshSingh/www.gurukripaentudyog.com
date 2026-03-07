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
            // Check if any other modal is open before removing class
            const anyOpen = Array.from(document.querySelectorAll('.modal, [id$="Modal"]')).some(m => m.classList.contains('active'));
            if (!anyOpen) document.body.classList.remove('modal-open');
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


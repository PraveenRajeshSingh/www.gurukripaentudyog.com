// ══════════════════════════════════════════
// OTP PANEL — Forgot-password / OTP sign-in sub-panel
// Split from the original monolithic auth.js (SRP).
// Depends on: loginSuccess, showToast, t() (defined elsewhere).
// ══════════════════════════════════════════

function setupOtpInputs() {
    const digits = document.querySelectorAll('.otp-digit');
    digits.forEach((d, idx) => {
        d.addEventListener('keyup', e => {
            if (e.key >= '0' && e.key <= '9') {
                d.classList.add('filled');
                if (idx < digits.length - 1) digits[idx + 1].focus();
            } else if (e.key === 'Backspace') {
                d.classList.remove('filled');
                if (idx > 0) digits[idx - 1].focus();
            }
        });
        d.addEventListener('paste', handleOtpPaste);
    });
}

function handleOtpPaste(e) {
    e.preventDefault();
    const pasteData = (e.clipboardData || window.clipboardData).getData('text').trim();
    if (!/^\d{6}$/.test(pasteData)) return;
    const digits = document.querySelectorAll('.otp-digit');
    pasteData.split('').forEach((char, idx) => {
        if (digits[idx]) {
            digits[idx].value = char;
            digits[idx].classList.add('filled');
        }
    });
    digits[5]?.focus();
}

function openOtpPanel() {
    const lp = document.getElementById('loginPanel');
    const rp = document.getElementById('registerPanel');
    const op = document.getElementById('otpPanel');
    if (lp) lp.style.display = 'none';
    if (rp) rp.style.display = 'none';
    if (op) op.style.display = 'block';
    const at = document.getElementById('authTitle');
    const as = document.getElementById('authSubtitle');
    if (at) at.textContent = 'OTP Sign In';
    if (as) as.textContent = 'Verify 6-digit code';
    setTimeout(() => document.querySelector('.otp-digit')?.focus(), 100);
}

function closeOtpPanel() {
    const op = document.getElementById('otpPanel');
    const lp = document.getElementById('loginPanel');
    if (op) op.style.display = 'none';
    if (lp) lp.style.display = 'block';
    const at = document.getElementById('authTitle');
    const as = document.getElementById('authSubtitle');
    if (at) at.textContent = 'Welcome Back';
    if (as) as.textContent = 'Sign in to your account';
}

function verifyOtp() {
    const digits = Array.from(document.querySelectorAll('.otp-digit')).map(d => d.value).join('');
    if (digits.length < 6) {
        showToast(t('auth.otpIncomplete'), 'error');
        return;
    }
    loginSuccess({ name: 'Verified Customer', email: 'user@gurukripa.in', mobile: '9198923230' });
    showToast(t('auth.otpVerified'), 'success');
}

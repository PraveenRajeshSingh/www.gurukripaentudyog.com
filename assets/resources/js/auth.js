// ============================================
// AUTHENTICATION AND MODAL FUNCTIONS
// ============================================

// Open Login Modal
function openLoginModal() {
    openModal();
    showLogin();
}

// Close Login Modal
function closeLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

// Open Register Modal
function openRegisterModal() {
    openModal();
    showRegister();
}

// Close Register Modal
function closeRegisterModal() {
    const modal = document.getElementById('registerModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

// Close modals when clicking outside
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
        document.body.style.overflow = '';
    }
});

// Close modals with Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (modal.style.display === 'flex') {
                modal.style.display = 'none';
                document.body.style.overflow = '';
            }
        });
    }
});

// Handle Login Form Submission
function handleLogin(event) {
    event.preventDefault();
    
    const form = event.target;
    const email = form.querySelector('#login-email').value;
    const password = form.querySelector('#login-password').value;
    const rememberMe = form.querySelector('input[name="remember"]').checked;
    
    // Basic validation
    if (!email || !password) {
        showUserFriendlyError('Please fill in all required fields');
        return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showUserFriendlyError('Please enter a valid email address');
        return;
    }
    
    // Simulate login process
    const loginBtn = form.querySelector('button[type="submit"]');
    const originalText = loginBtn.innerHTML;
    loginBtn.innerHTML = '<i class="ion-load-c"></i> Logging in...';
    loginBtn.disabled = true;
    
    // Simulate API call
    setTimeout(() => {
        // For demo purposes, accept any login
        const user = {
            id: 1,
            name: 'Demo User',
            email: email
        };
        
        // Store user data
        localStorage.setItem('user', JSON.stringify(user));
        if (rememberMe) {
            localStorage.setItem('rememberMe', 'true');
        }
        
        // Update UI
        updateUserInterface(user);
        closeLoginModal();
        showUserFriendlyError('Login successful!', 3000);
        
        // Reset button
        loginBtn.innerHTML = originalText;
        loginBtn.disabled = false;
        form.reset();
    }, 1500);
}

// Handle Register Form Submission
function handleRegister(event) {
    event.preventDefault();
    
    const form = event.target;
    const name = form.querySelector('#register-name').value;
    const email = form.querySelector('#register-email').value;
    const mobile = form.querySelector('#register-mobile').value;
    const password = form.querySelector('#register-password').value;
    const confirmPassword = form.querySelector('#register-confirm-password').value;
    const address = form.querySelector('#register-address').value;
    
    // Validation
    if (!name || !email || !mobile || !password || !confirmPassword) {
        showUserFriendlyError('Please fill in all required fields');
        return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showUserFriendlyError('Please enter a valid email address');
        return;
    }
    
    // Mobile validation
    const mobileRegex = /^[0-9]{10}$/;
    if (!mobileRegex.test(mobile)) {
        showUserFriendlyError('Please enter a valid 10-digit mobile number');
        return;
    }
    
    // Password validation
    if (password.length < 6) {
        showUserFriendlyError('Password must be at least 6 characters long');
        return;
    }
    
    // Confirm password validation
    if (password !== confirmPassword) {
        showUserFriendlyError('Passwords do not match');
        return;
    }
    
    // Simulate registration process
    const registerBtn = form.querySelector('button[type="submit"]');
    const originalText = registerBtn.innerHTML;
    registerBtn.innerHTML = '<i class="ion-load-c"></i> Registering...';
    registerBtn.disabled = true;
    
    // Simulate API call
    setTimeout(() => {
        // For demo purposes, accept any registration
        const user = {
            id: Date.now(),
            name: name,
            email: email,
            mobile: mobile,
            address: address
        };
        
        // Store user data
        localStorage.setItem('user', JSON.stringify(user));
        
        // Update UI
        updateUserInterface(user);
        closeRegisterModal();
        showUserFriendlyError('Registration successful! Welcome!', 3000);
        
        // Reset button
        registerBtn.innerHTML = originalText;
        registerBtn.disabled = false;
        form.reset();
    }, 1500);
}

// Update User Interface after login/register
function updateUserInterface(user) {
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const userMenu = document.getElementById('userMenu');
    const userName = document.getElementById('userName');
    const mobileUserMenu = document.getElementById('mobileUserMenu');
    const mobileUserName = document.getElementById('mobileUserName');
    
    if (loginBtn && registerBtn && userMenu && userName) {
        // Hide login/register buttons
        loginBtn.style.display = 'none';
        registerBtn.style.display = 'none';
        
        // Show user menu
        userMenu.style.display = 'block';
        userName.textContent = user.name.split(' ')[0]; // First name only
    }
    
    // Update mobile menu
    if (mobileUserMenu && mobileUserName) {
        mobileUserMenu.style.display = 'block';
        mobileUserName.textContent = user.name;
        // Hide mobile auth buttons
        document.querySelectorAll('.mobile-auth').forEach(btn => {
            btn.style.display = 'none';
        });
    }
}

// Logout User
function logoutUser() {
    // Remove user data
    localStorage.removeItem('user');
    localStorage.removeItem('rememberMe');
    
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const userMenu = document.getElementById('userMenu');
    const mobileUserMenu = document.getElementById('mobileUserMenu');
    
    if (loginBtn && registerBtn && userMenu) {
        // Show login/register buttons
        loginBtn.style.display = 'flex';
        registerBtn.style.display = 'flex';
        
        // Hide user menu
        userMenu.style.display = 'none';
    }
    
    // Update mobile menu
    if (mobileUserMenu) {
        mobileUserMenu.style.display = 'none';
        // Show mobile auth buttons
        document.querySelectorAll('.mobile-auth').forEach(btn => {
            btn.style.display = 'block';
        });
    }
    
    showUserFriendlyError('You have been logged out', 3000);
}

// Close Mobile Menu
function closeMobileMenu() {
    const mobileDrawer = document.getElementById('mobileDrawer');
    const drawerOverlay = document.getElementById('drawerOverlay');
    
    if (mobileDrawer && drawerOverlay) {
        mobileDrawer.classList.remove('active');
        drawerOverlay.classList.remove('active');
    }
}

// Check if user is already logged in
function checkUserStatus() {
    const user = localStorage.getItem('user');
    if (user) {
        try {
            const userData = JSON.parse(user);
            updateUserInterface(userData);
        } catch (e) {
            // Invalid user data, clear it
            localStorage.removeItem('user');
        }
    }
}

// Initialize user status on page load
document.addEventListener('DOMContentLoaded', function() {
    checkUserStatus();
});

// ============================================
// MODERN AUTH MODAL FUNCTIONS
// ============================================

// Open Modal
function openModal() {
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.classList.add('modal-open');
        document.body.style.overflow = 'hidden';
        
        // Focus on first input
        setTimeout(() => {
            const firstInput = modal.querySelector('input');
            if (firstInput) firstInput.focus();
        }, 300);
    }
}

// Close Modal
function closeModal() {
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
    }
}

// Show Login Tab
function showLogin() {
    document.getElementById('loginForm').classList.add('active');
    document.getElementById('registerForm').classList.remove('active');
    document.querySelectorAll('.tab-btn')[0].classList.add('active');
    document.querySelectorAll('.tab-btn')[1].classList.remove('active');
    
    // Focus on login email
    setTimeout(() => {
        document.querySelector('#loginForm input[type="email"]').focus();
    }, 100);
}

// Show Register Tab
function showRegister() {
    document.getElementById('registerForm').classList.add('active');
    document.getElementById('loginForm').classList.remove('active');
    document.querySelectorAll('.tab-btn')[1].classList.add('active');
    document.querySelectorAll('.tab-btn')[0].classList.remove('active');
    
    // Focus on register name
    setTimeout(() => {
        document.querySelector('#registerForm input[type="text"]').focus();
    }, 100);
}

// Toggle Password Visibility
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const toggle = input.nextElementSibling;
    
    if (input.type === 'password') {
        input.type = 'text';
        toggle.textContent = '🙈';
    } else {
        input.type = 'password';
        toggle.textContent = '👁️';
    }
}

// Handle Login Form
function handleLoginForm(event) {
    event.preventDefault();
    
    const form = event.target;
    const email = form.querySelector('input[type="email"]').value;
    const password = form.querySelector('input[type="password"]').value;
    const rememberMe = form.querySelector('input[name="remember"]').checked;
    
    // Validation
    if (!email || !password) {
        showUserFriendlyError('Please fill in all fields');
        return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showUserFriendlyError('Please enter a valid email address');
        return;
    }
    
    // Simulate login
    const submitBtn = form.querySelector('.auth-submit');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Logging in...';
    submitBtn.disabled = true;
    
    setTimeout(() => {
        // Demo login - accept any credentials
        const user = {
            id: 1,
            name: email.split('@')[0],
            email: email
        };
        
        localStorage.setItem('user', JSON.stringify(user));
        if (rememberMe) {
            localStorage.setItem('rememberMe', 'true');
        }
        
        updateUserInterface(user);
        closeModal();
        showUserFriendlyError('Login successful! Welcome back!', 3000);
        
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        form.reset();
    }, 1500);
}

// Handle Register Form
function handleRegisterForm(event) {
    event.preventDefault();
    
    const form = event.target;
    const inputs = form.querySelectorAll('input');
    const name = inputs[0].value;
    const email = inputs[1].value;
    const password = inputs[2].value;
    const confirmPassword = inputs[3].value;
    
    // Validation
    if (!name || !email || !password || !confirmPassword) {
        showUserFriendlyError('Please fill in all fields');
        return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showUserFriendlyError('Please enter a valid email address');
        return;
    }
    
    // Password validation
    if (password.length < 6) {
        showUserFriendlyError('Password must be at least 6 characters');
        return;
    }
    
    // Confirm password
    if (password !== confirmPassword) {
        showUserFriendlyError('Passwords do not match');
        return;
    }
    
    // Simulate registration
    const submitBtn = form.querySelector('.auth-submit');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Registering...';
    submitBtn.disabled = true;
    
    setTimeout(() => {
        // Demo registration
        const user = {
            id: Date.now(),
            name: name,
            email: email
        };
        
        localStorage.setItem('user', JSON.stringify(user));
        
        updateUserInterface(user);
        closeModal();
        showUserFriendlyError('Registration successful! Welcome!', 3000);
        
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        form.reset();
        showLogin(); // Switch to login tab
    }, 1500);
}

// Close modal when clicking outside
document.addEventListener('click', function(e) {
    const modal = document.getElementById('authModal');
    if (e.target === modal) {
        closeModal();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const modal = document.getElementById('authModal');
        if (modal && modal.style.display === 'flex') {
            closeModal();
        }
    }
});

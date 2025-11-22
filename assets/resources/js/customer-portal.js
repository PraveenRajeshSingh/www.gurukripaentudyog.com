// Customer portal functionality
let users = JSON.parse(localStorage.getItem('users')) || [];
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;

function registerUser(userData) {
    // Check if user already exists
    if (users.find(u => u.email === userData.email)) {
        return { success: false, message: 'Email already registered' };
    }
    
    const newUser = {
        id: Date.now(),
        ...userData,
        createdAt: new Date().toISOString(),
        orders: []
    };
    
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    // Auto login
    currentUser = newUser;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    // Track analytics
    if (typeof gtag !== 'undefined') {
        gtag('event', 'sign_up', {
            'method': 'email'
        });
    }
    
    return { success: true, message: 'Registration successful' };
}

function loginUser(email, password) {
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        // Track analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', 'login', {
                'method': 'email'
            });
        }
        
        return { success: true, message: 'Login successful' };
    }
    
    return { success: false, message: 'Invalid email or password' };
}

function logoutUser() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    updateUserUI();
    window.location.href = '#home';
}

function updateUserUI() {
    const loginBtn = document.getElementById('loginBtn');
    const userMenu = document.getElementById('userMenu');
    const userName = document.getElementById('userName');
    
    if (currentUser) {
        if (loginBtn) loginBtn.style.display = 'none';
        if (userMenu) userMenu.style.display = 'block';
        if (userName) userName.textContent = currentUser.name;
    } else {
        if (loginBtn) loginBtn.style.display = 'block';
        if (userMenu) userMenu.style.display = 'none';
    }
}

function openLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function closeLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function openRegisterModal() {
    closeLoginModal();
    const modal = document.getElementById('registerModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function closeRegisterModal() {
    const modal = document.getElementById('registerModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function openDashboard() {
    if (!currentUser) {
        openLoginModal();
        return;
    }
    
    window.location.href = '#dashboard';
    renderDashboard();
}

function renderDashboard() {
    const dashboard = document.getElementById('dashboard');
    if (!dashboard) return;
    
    const isHindi = currentLanguage === 'hi';
    dashboard.innerHTML = `
        <div class="dashboard-header">
            <h2>${getTranslation('dashboard')}</h2>
            <p>${isHindi ? 'नमस्ते' : 'Welcome'}, ${currentUser.name}!</p>
        </div>
        <div class="dashboard-content">
            <div class="dashboard-card">
                <h3>${getTranslation('myOrders')}</h3>
                <div id="userOrders">
                    ${renderUserOrders()}
                </div>
            </div>
            <div class="dashboard-card">
                <h3>${getTranslation('profile')}</h3>
                <div class="profile-info">
                    <p><strong>${getTranslation('name')}:</strong> ${currentUser.name}</p>
                    <p><strong>${getTranslation('email')}:</strong> ${currentUser.email}</p>
                    <p><strong>${getTranslation('mobile')}:</strong> ${currentUser.mobile}</p>
                    <p><strong>${getTranslation('address')}:</strong> ${currentUser.address || 'Not provided'}</p>
                </div>
                <button class="btn btn-full" onclick="editProfile()">${getTranslation('edit')}</button>
            </div>
        </div>
    `;
}

function renderUserOrders() {
    if (!currentUser || !currentUser.orders || currentUser.orders.length === 0) {
        return `<p>${getTranslation('orderHistory')}: No orders yet</p>`;
    }
    
    return currentUser.orders.map(order => `
        <div class="order-item">
            <div class="order-header">
                <span>Order #${order.id}</span>
                <span>${formatDate(order.date)}</span>
            </div>
            <div class="order-details">
                <p>Total: ₹${order.total}</p>
                <p>Status: ${order.status}</p>
            </div>
        </div>
    `).join('');
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString(currentLanguage === 'hi' ? 'hi-IN' : 'en-US');
}

function editProfile() {
    // Profile editing functionality
    alert('Profile editing feature coming soon');
}

// Initialize user UI on page load
document.addEventListener('DOMContentLoaded', function() {
    updateUserUI();
});


/**
 * Gurukripa Bricks - Authentication Service
 */
var AuthService = {
    getUser: () => JSON.parse(localStorage.getItem(STORAGE_KEYS.USER)),

    login: (email, password, rememberMe) => {
        return new Promise((resolve, reject) => {
            // Simulated API delay
            setTimeout(() => {
                if (email && password) {
                    const user = {
                        id: 1,
                        name: email.split('@')[0].replace(/\./g, ' '),
                        email: email
                    };
                    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
                    if (rememberMe) localStorage.setItem(STORAGE_KEYS.REMEMBER_ME, 'true');

                    AuthService.updateUI(user);
                    showToast('🎉 Login successful! Welcome back!');
                    resolve(user);
                } else {
                    reject('Invalid credentials');
                }
            }, 1000);
        });
    },

    register: (userData) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const user = { ...userData, id: Date.now() };
                localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
                AuthService.updateUI(user);
                showToast('🎊 Registration successful! Welcome to Gurukripa!');
                resolve(user);
            }, 1000);
        });
    },

    logout: () => {
        localStorage.removeItem(STORAGE_KEYS.USER);
        localStorage.removeItem(STORAGE_KEYS.REMEMBER_ME);
        AuthService.resetUI();
        showToast('👋 You have been logged out.');
    },

    updateUI: (user) => {
        const loginBtn = document.getElementById('loginBtn');
        const registerBtn = document.getElementById('registerBtn');
        const userMenu = document.getElementById('userMenu');
        const userName = document.getElementById('userName');
        const fullUserName = document.getElementById('fullUserName');
        const mobileUserMenu = document.getElementById('mobileUserMenu');
        const mobileUserName = document.getElementById('mobileUserName');

        if (loginBtn) loginBtn.style.display = 'none';
        if (registerBtn) registerBtn.style.display = 'none';

        if (userMenu) {
            userMenu.style.display = 'block';
            if (userName) userName.textContent = user.name.split(' ')[0];
            if (fullUserName) fullUserName.textContent = user.name;
        }

        if (mobileUserMenu) {
            mobileUserMenu.style.display = 'block';
            if (mobileUserName) mobileUserName.textContent = user.name;
            document.querySelectorAll('.mobile-auth').forEach(el => el.style.display = 'none');
        }

        // Render dashboard if we are on dashboard page
        if (window.location.hash === '#dashboard' || window.location.hash === '#profile') {
            AuthService.renderDashboard();
        }
    },

    renderDashboard: () => {
        const user = AuthService.getUser();
        const container = document.getElementById('dashboardContent');
        const dashboardSection = document.getElementById('dashboard');

        if (!user || !container || !dashboardSection) return;

        dashboardSection.style.display = 'block';
        const isHindi = TranslationService.getLanguage() === 'hi';

        container.innerHTML = `
            <div class="dashboard-grid">
                <div class="dashboard-sidebar">
                    <div class="user-profile-card">
                        <div class="user-avatar-lg">${user.name[0]}</div>
                        <h3>${user.name}</h3>
                        <p>${user.email}</p>
                        <div class="profile-stats">
                            <div class="stat-box">
                                <span class="stat-val">3</span>
                                <span class="stat-lbl">${isHindi ? 'ऑर्डर' : 'Orders'}</span>
                            </div>
                            <div class="stat-box">
                                <span class="stat-val">₹12k</span>
                                <span class="stat-lbl">${isHindi ? 'बचत' : 'Saved'}</span>
                            </div>
                        </div>
                    </div>
                    <nav class="dashboard-nav">
                        <button class="dash-nav-link active"><i class="ion-ios-grid-view-outline"></i> Dashboard</button>
                        <button class="dash-nav-link"><i class="ion-ios-list-outline"></i> My Orders</button>
                        <button class="dash-nav-link"><i class="ion-ios-person-outline"></i> Profile Settings</button>
                        <button class="dash-nav-link" onclick="logoutUser()"><i class="ion-log-out"></i> Logout</button>
                    </nav>
                </div>
                <div class="dashboard-main">
                    <div class="dashboard-welcome">
                        <h2>${isHindi ? 'नमस्ते' : 'Hello'}, ${user.name}! 👋</h2>
                        <p>${isHindi ? 'अपने अकाउंट और ऑर्डर ट्रैक करें' : 'Track your accounts and orders below.'}</p>
                    </div>
                    
                    <div class="recent-orders">
                        <div class="section-card">
                            <div class="card-header">
                                <h3>Recent Orders</h3>
                                <button class="btn-sm btn-outline">View All</button>
                            </div>
                            <div class="table-responsive">
                                <table class="order-table">
                                    <thead>
                                        <tr>
                                            <th>Order ID</th>
                                            <th>Date</th>
                                            <th>Status</th>
                                            <th>Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>#GB-2041</td>
                                            <td>May 12, 2026</td>
                                            <td><span class="badge badge-success">Delivered</span></td>
                                            <td>₹4,500</td>
                                        </tr>
                                        <tr>
                                            <td>#GB-1982</td>
                                            <td>Apr 28, 2026</td>
                                            <td><span class="badge badge-pending">Processing</span></td>
                                            <td>₹8,200</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    resetUI: () => {
        const loginBtn = document.getElementById('loginBtn');
        const registerBtn = document.getElementById('registerBtn');
        const userMenu = document.getElementById('userMenu');
        const mobileUserMenu = document.getElementById('mobileUserMenu');
        const dashboardSection = document.getElementById('dashboard');

        if (loginBtn) loginBtn.style.display = 'inline-block';
        if (registerBtn) registerBtn.style.display = 'inline-block';
        if (userMenu) userMenu.style.display = 'none';
        if (dashboardSection) dashboardSection.style.display = 'none';
        if (mobileUserMenu) {
            mobileUserMenu.style.display = 'none';
            document.querySelectorAll('.mobile-auth').forEach(el => el.style.display = 'block');
        }
    },

    init: () => {
        const user = AuthService.getUser();
        if (user) {
            AuthService.updateUI(user);
        }

        // Expose globally for HTML onclick handlers
        window.openLoginModal = () => Modals.open('loginModal');
        window.closeLoginModal = () => Modals.close('loginModal');
        window.openRegisterModal = () => Modals.open('registerModal');
        window.closeRegisterModal = () => Modals.close('registerModal');
        window.logoutUser = AuthService.logout;
        window.renderDashboard = AuthService.renderDashboard;
    }
};

// Initialization is managed by App.init in main.js


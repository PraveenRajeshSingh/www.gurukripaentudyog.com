/**
 * Gurukripa Bricks - Authentication Service
 */
var AuthService = {
    getUser: () => JSON.parse(localStorage.getItem(STORAGE_KEYS.USER)),
    isLoggedIn: () => !!JSON.parse(localStorage.getItem(STORAGE_KEYS.USER)),
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
        const authActions = document.getElementById('authActions');
        const userMenu = document.getElementById('userMenu');
        const userName = document.getElementById('userName');
        const mobileUserMenu = document.getElementById('mobileUserMenu');
        const mobileUserName = document.getElementById('mobileUserName');

        if (authActions) authActions.style.display = 'none';

        if (userMenu) {
            userMenu.style.display = 'block';
            if (userName) userName.textContent = user.name.split(' ')[0];
        }

        if (mobileUserMenu) {
            mobileUserMenu.style.display = 'block';
            if (mobileUserName) mobileUserName.textContent = user.name;
            const mobileEmail = mobileUserMenu.querySelector('.mobile-user-email');
            if (mobileEmail) mobileEmail.textContent = user.email;
            const mobileAuth = document.getElementById('mobileAuthButtons');
            if (mobileAuth) mobileAuth.style.display = 'none';
        }

        // Update profile images across all instances
        AuthService.syncAllAvatars(user);

        // Update mobile bottom nav profile button state
        if (typeof window.updateMobileNavProfileState === 'function') {
            window.updateMobileNavProfileState();
        }

        // Render dashboard if we are on dashboard page
        if (window.location.hash === '#dashboard' || window.location.hash === '#profile') {
            AuthService.renderDashboard();
        }
    },

    syncAllAvatars: (user) => {
        const avatarContainers = document.querySelectorAll('.user-avatar-premium, .profile-avatar-container');
        avatarContainers.forEach(container => {
            const img = container.querySelector('img');
            const span = container.querySelector('span');

            if (user && user.profileImage && img) {
                img.src = user.profileImage;
                img.style.display = 'block';
                if (span) span.style.display = 'none';
            } else if (span) {
                span.style.display = 'flex';
                if (img) img.style.display = 'none';
            }
        });

        // Update mobile bottom nav profile button state
        if (typeof window.updateMobileNavProfileState === 'function') {
            window.updateMobileNavProfileState();
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
            <div class="dashboard-modern">
                <header class="dashboard-header">
                    <div class="dash-welcome">
                        <h2>${isHindi ? 'नमस्ते' : 'Hello'}, ${user.name.split(' ')[0]}! 👋</h2>
                        <p>${isHindi ? 'अपने अकाउंट और ऑर्डर ट्रैक करें' : 'Welcome to your premium dashboard.'}</p>
                    </div>
                    <div class="dash-actions">
                         <button class="btn btn-primary btn-sm" onclick="Modals.open('profileModal')"><i class="ion-ios-person"></i> Quick Menu</button>
                    </div>
                </header>

                <div class="dashboard-grid">
                    <div class="dash-card profile-summary-card">
                        <div class="user-avatar-premium">
                            ${user.profileImage ? `<img src="${user.profileImage}" alt="${user.name}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">` : AuthService.getInitials(user.name)}
                        </div>
                        <div class="profile-info">
                            <h3>${user.name}</h3>
                            <p>${user.email}</p>
                            <div class="dash-profile-badges">
                                <span class="user-badge">${user.role || 'Premium Customer'}</span>
                                <button class="btn-dash-edit" onclick="openEditProfileModal()"><i class="ion-ios-compose-outline"></i> Edit Account</button>
                            </div>
                        </div>
                    </div>

                    <div class="dash-stats-grid">
                        <div class="stat-card">
                            <i class="ion-ios-list-outline"></i>
                            <div class="stat-body">
                                <span class="stat-num">3</span>
                                <span class="stat-label">Orders</span>
                            </div>
                        </div>
                        <div class="stat-card">
                            <i class="ion-ios-cart-outline"></i>
                            <div class="stat-body">
                                <span class="stat-num">₹12k</span>
                                <span class="stat-label">Total Spent</span>
                            </div>
                        </div>
                        <div class="stat-card">
                            <i class="ion-ios-ribbon-outline"></i>
                            <div class="stat-body">
                                <span class="stat-num">Gold</span>
                                <span class="stat-label">Member</span>
                            </div>
                        </div>
                    </div>

                    <div class="dash-card recent-activity">
                        <div class="card-header">
                            <h3>Recent Orders</h3>
                            <a href="javascript:void(0)" class="view-all">View All</a>
                        </div>
                        <div class="activity-list">
                            <div class="activity-item">
                                <div class="item-icon success"><i class="ion-ios-checkmark-empty"></i></div>
                                <div class="item-info">
                                    <span class="item-title">Order #GB-2041 Delivered</span>
                                    <span class="item-date">May 12, 2026</span>
                                </div>
                                <span class="item-amount">₹4,500</span>
                            </div>
                            <div class="activity-item">
                                <div class="item-icon pending"><i class="ion-ios-timer-outline"></i></div>
                                <div class="item-info">
                                    <span class="item-title">Order #GB-1982 Processing</span>
                                    <span class="item-date">Apr 28, 2026</span>
                                </div>
                                <span class="item-amount">₹8,200</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    getInitials: (name) => {
        if (!name) return 'U';
        const parts = name.split(' ');
        if (parts.length > 1) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name.substring(0, 1).toUpperCase();
    },

    resetUI: () => {
        const authActions = document.getElementById('authActions');
        const userMenu = document.getElementById('userMenu');
        const mobileUserMenu = document.getElementById('mobileUserMenu');
        const dashboardSection = document.getElementById('dashboard');

        if (authActions) authActions.style.display = 'flex';
        if (userMenu) userMenu.style.display = 'none';
        if (dashboardSection) dashboardSection.style.display = 'none';
        if (mobileUserMenu) {
            mobileUserMenu.style.display = 'none';
            const mobileAuth = document.getElementById('mobileAuthButtons');
            if (mobileAuth) mobileAuth.style.display = 'block';
        }

        // Update mobile bottom nav profile button state
        if (typeof window.updateMobileNavProfileState === 'function') {
            window.updateMobileNavProfileState();
        }
    },

    updateUser: (newData) => {
        const currentUser = AuthService.getUser();
        if (!currentUser) return;

        const updatedUser = { ...currentUser, ...newData };
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));

        // Refresh UI everywhere
        AuthService.updateUI(updatedUser);

        // If on dashboard, re-render it
        if (window.location.hash === '#dashboard' || window.location.hash === '#profile') {
            AuthService.renderDashboard();
        }

        showToast('✅ Profile updated successfully!');
        return updatedUser;
    },

    updateProfileImage: (imageData) => {
        const user = AuthService.getUser();
        if (!user) return;

        user.profileImage = imageData;
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));

        // Use the central synchronization method
        AuthService.syncAllAvatars(user);
        showToast('📸 Profile picture updated!');
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

        // Expose editing functions
        window.updateUserProfile = AuthService.updateUser;
    }
};

// Initialization is managed by App.init in main.js

